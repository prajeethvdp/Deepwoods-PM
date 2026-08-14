import React, { createContext, useContext, useState, useEffect } from 'react';
import { TeamMember, UserRole } from '../types';
import { loadTeamFromStorage, saveTeamToStorage, sendAppsScriptAction, resetPasswordInBackend } from '../lib/sheets';
import { hashPassword, verifyPassword } from '../lib/cryptoUtils';
import { normalizeRole, canManageTeam, canManageProjects, canAccessTeamPage } from '../lib/permissions';
import { generateAdminRegistrationEmail, generateUserApprovalConfirmationEmail } from '../lib/emailService';

const PASSWORDS_STORAGE_KEY = 'deepwoods_user_passwords';
const OTP_STORAGE_KEY = 'deepwoods_password_reset_otps';

const getStoredPasswordMap = (): Record<string, string> => {
  try {
    const raw = localStorage.getItem(PASSWORDS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const setStoredPassword = (email: string, hashedPassword: string) => {
  const map = getStoredPasswordMap();
  map[email.trim().toLowerCase()] = hashedPassword;
  localStorage.setItem(PASSWORDS_STORAGE_KEY, JSON.stringify(map));
};

const notifyAdminsOfNewRegistration = (newMember: TeamMember, team: TeamMember[]) => {
  const adminEmails = team
    .filter((m) => normalizeRole(m.role) === 'Admin' && m.email)
    .map((m) => m.email.trim().toLowerCase());

  const defaultAdmins = ['prajeethv100@gmail.com', 'prajeeth.deepwoods@gmail.com', 'prajeethv.deepwoods@gmail.com'];
  const recipients = Array.from(new Set([...adminEmails, ...defaultAdmins]));

  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://deepwoods-pm.vercel.app';
  const approveUrl = `${appUrl}?approveEmail=${encodeURIComponent(newMember.email)}`;

  const subject = `🚨 Action Required: Approve Account for ${newMember.name} (${newMember.email})`;
  const emailHtml = generateAdminRegistrationEmail(newMember, approveUrl);

  recipients.forEach((recipientEmail) => {
    sendAppsScriptAction('sendEmail', {
      recipientEmail,
      subject,
      htmlBody: emailHtml,
    }).catch((err) => console.warn('Background admin alert email dispatch:', err));
  });

  try {
    const rawNotifs = localStorage.getItem('deepwoods_email_notifications');
    const notifs = rawNotifs ? JSON.parse(rawNotifs) : [];
    const newNotif = {
      id: `notif-reg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      taskId: 'admin-alert',
      recipientEmail: recipients[0],
      recipientName: 'Workspace Admin',
      assignorName: newMember.name,
      assignorEmail: newMember.email,
      taskTitle: `New Account: ${newMember.name} (${newMember.email})`,
      projectName: 'Security Alert',
      subject,
      sentAt: new Date().toISOString(),
      status: 'Sent',
    };
    localStorage.setItem('deepwoods_email_notifications', JSON.stringify([newNotif, ...notifs]));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('deepwoods_notification_updated'));
      window.dispatchEvent(new Event('storage'));
    }
  } catch (err) {
    console.warn('Failed to save in-app admin registration notification:', err);
  }
};

interface AuthContextType {
  user: TeamMember | null;
  isAuthenticated: boolean;
  userRole: UserRole;
  isAdmin: boolean;
  isProductManager: boolean;
  isEmployee: boolean;
  canManageTeam: boolean;
  canManageProjects: boolean;
  canAccessTeamPage: boolean;
  verifyGoogleUser: (email: string, name: string, isSignUp?: boolean) => Promise<{ success: boolean; user?: TeamMember; error?: string }>;
  completeLogin: (user: TeamMember) => void;
  loginWithGoogle: (email: string, name: string, isSignUp?: boolean) => Promise<{ success: boolean; user?: TeamMember; error?: string }>;
  loginWithPassword: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithPassword: (name: string, email: string, password: string) => Promise<{ success: boolean; user?: TeamMember; error?: string; pendingApproval?: boolean }>;
  approveUserByAdmin: (userEmail: string, assignedRole: UserRole) => Promise<{ success: boolean; error?: string }>;
  setPasswordForUser: (email: string, newPassword: string) => Promise<{ success: boolean; updatedUser?: TeamMember; error?: string }>;
  sendPasswordResetOTP: (email: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  verifyOTPAndResetPassword: (email: string, otpCode: string, newPassword: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  resetPassword: (email: string, newPassword: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  refreshUser: (providedTeam?: TeamMember[]) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<TeamMember | null>(() => {
    const savedUserId = localStorage.getItem('deepwoods_auth_user_id');
    if (!savedUserId) return null;
    const team = loadTeamFromStorage();
    const passMap = getStoredPasswordMap();
    const found = team.find((m) => m.id === savedUserId);
    if (found) {
      const normEmail = (found.email || '').trim().toLowerCase();
      return {
        ...found,
        password: found.password || passMap[normEmail] || '',
      };
    }
    return null;
  });

  const fetchLatestTeam = async (): Promise<{ team: TeamMember[]; backendSynced: boolean }> => {
    let team: TeamMember[] = loadTeamFromStorage();
    const passMap = getStoredPasswordMap();
    let backendSynced = false;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const scriptUrl = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL;
      if (scriptUrl) {
        const res = await fetch(`${scriptUrl}?action=getTeam`, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (res.ok) {
          const json = await res.json();
            // Deduplicate team members by email (keep highest privilege role / primary row)
            const uniqueTeamMap = new Map<string, TeamMember>();
            json.data.forEach((m: any) => {
              const normEmail = (m.email || '').trim().toLowerCase();
              if (!normEmail) return;

              const cachedPassword = passMap[normEmail] || '';
              const processedMember: TeamMember = {
                ...m,
                password: m.password || cachedPassword,
              };

              const existing = uniqueTeamMap.get(normEmail);
              if (!existing) {
                uniqueTeamMap.set(normEmail, processedMember);
              } else {
                // If one row is active or has higher role, preserve the higher privilege
                const isExistingAdmin = normalizeRole(existing.role) === 'Admin';
                const isNewAdmin = normalizeRole(m.role) === 'Admin';
                if (!isExistingAdmin && isNewAdmin) {
                  uniqueTeamMap.set(normEmail, processedMember);
                } else if (existing.active === false && m.active !== false) {
                  uniqueTeamMap.set(normEmail, processedMember);
                }
              }
            });

            team = Array.from(uniqueTeamMap.values());
            saveTeamToStorage(team);
            backendSynced = true;
          }
        }
      } catch {
        team = loadTeamFromStorage();
      }

    const uniqueMap = new Map<string, TeamMember>();
    team.forEach((m) => {
      const normEmail = (m.email || '').trim().toLowerCase();
      if (!normEmail) return;
      const cachedPassword = passMap[normEmail] || '';
      const processed: TeamMember = {
        ...m,
        password: m.password || cachedPassword,
      };
      if (!uniqueMap.has(normEmail)) {
        uniqueMap.set(normEmail, processed);
      }
    });
    team = Array.from(uniqueMap.values());

    return { team, backendSynced };
  };

  const refreshUser = (providedTeam?: TeamMember[]) => {
    const savedUserId = localStorage.getItem('deepwoods_auth_user_id');
    if (!savedUserId) return;

    const team = providedTeam || loadTeamFromStorage();
    const passMap = getStoredPasswordMap();
    const found = team.find(
      (m) => m.id === savedUserId || (user && m.email && m.email.trim().toLowerCase() === user.email.trim().toLowerCase())
    );

    if (found) {
      const normEmail = (found.email || '').trim().toLowerCase();
      const updatedUser: TeamMember = {
        ...found,
        password: found.password || passMap[normEmail] || (user ? user.password : ''),
      };

      setUser((prev) => {
        if (!prev) return updatedUser;
        if (
          prev.role !== updatedUser.role ||
          prev.name !== updatedUser.name ||
          prev.active !== updatedUser.active ||
          prev.email !== updatedUser.email
        ) {
          return updatedUser;
        }
        return prev;
      });
    }
  };

  // Auto-sync logged in user details/roles on mount from Google Apps Script backend
  useEffect(() => {
    fetchLatestTeam().then(({ team }) => {
      refreshUser(team);
    });
  }, []);

  const completeLogin = (userToLogin: TeamMember) => {
    setUser(userToLogin);
    localStorage.setItem('deepwoods_auth_user_id', userToLogin.id);
  };

  const verifyGoogleUser = async (
    email: string,
    name: string,
    isSignUp: boolean = false
  ): Promise<{ success: boolean; user?: TeamMember; error?: string }> => {
    const normalized = email.trim().toLowerCase();
    const { team } = await fetchLatestTeam();
    const found = team.find((m) => m.email && m.email.trim().toLowerCase() === normalized);

    if (found) {
      if (found.active === false) {
        return {
          success: false,
          error: `Your account for ${email} is pending Admin approval. Please contact your Workspace Admin to approve access.`,
        };
      }

      if (!found.password || found.password.trim() === '') {
        return {
          success: false,
          error: `No password set for ${email}. You can only sign in via Google if you have created an account and set up a password first.`,
        };
      }

      return { success: true, user: found };
    }

    return {
      success: false,
      error: `No account found for ${email}. You can only sign in via Google if you have created an account before and set a password. Please create an account first.`,
    };

    // Creating account from "Create Account" tab via Google (active = false, Pending Approval)
    const newMember: TeamMember = {
      id: `tm-${Date.now()}`,
      name: name || normalized.split('@')[0],
      email: normalized,
      role: 'Employee',
      color: '#10B981',
      active: false, // Pending Admin Approval!
    };

    const updatedTeam = [...team, newMember];
    saveTeamToStorage(updatedTeam);
    sendAppsScriptAction('addTeamMember', { data: newMember }).catch((err) =>
      console.warn('Background sheet addTeamMember sync:', err)
    );

    // Notify Admins of new account creation
    notifyAdminsOfNewRegistration(newMember, team);

    return {
      success: false,
      user: newMember,
      error: `Account registered via Google! Your account is pending Admin approval. Your Workspace Admin has been notified to approve your access.`,
    };
  };

  const loginWithGoogle = async (
    email: string,
    name: string,
    isSignUp: boolean = false
  ): Promise<{ success: boolean; user?: TeamMember; error?: string }> => {
    const res = await verifyGoogleUser(email, name, isSignUp);
    if (res.success && res.user) {
      completeLogin(res.user);
    }
    return res;
  };

  const loginWithPassword = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    const normalized = email.trim().toLowerCase();
    if (!normalized) {
      return { success: false, error: 'Please enter your email address.' };
    }
    if (!password) {
      return { success: false, error: 'Please enter your password.' };
    }

    const { team } = await fetchLatestTeam();
    const passMap = getStoredPasswordMap();

    const found = team.find((m) => m.email && m.email.trim().toLowerCase() === normalized);

    if (!found) {
      return {
        success: false,
        error: `No account found for ${email}. Please check your email or contact workspace admin.`,
      };
    }

    if (found.active === false) {
      return {
        success: false,
        error: `Account ${email} is inactive. Please contact workspace admin.`,
      };
    }

    const cachedPass = passMap[normalized];
    if (cachedPass) {
      found.password = cachedPass;
    }

    if (!found.password) {
      return {
        success: false,
        error: `No password set for ${email}. Click "Forgot password?" below to set up your password.`,
      };
    }

    const isValid = await verifyPassword(password, found.password);
    if (!isValid) {
      return {
        success: false,
        error: 'Incorrect password. Please check your credentials or click "Forgot password?".',
      };
    }

    completeLogin(found);
    return { success: true };
  };

  const signUpWithPassword = async (
    name: string,
    email: string,
    password: string
  ): Promise<{ success: boolean; user?: TeamMember; error?: string }> => {
    const normalized = email.trim().toLowerCase();
    if (!name.trim()) {
      return { success: false, error: 'Please enter your full name.' };
    }
    if (!normalized) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    if (!password || password.length < 4) {
      return { success: false, error: 'Password must be at least 4 characters long.' };
    }

    const { team } = await fetchLatestTeam();
    const existing = team.find((m) => m.email && m.email.trim().toLowerCase() === normalized);
    if (existing) {
      return {
        success: false,
        error: `An account with email ${email} already exists. Please sign in instead.`,
      };
    }

    const hashedPassword = await hashPassword(password);
    setStoredPassword(normalized, hashedPassword);

    // Enforce active = false (Pending Approval) for all new self-registrations
    const newMember: TeamMember = {
      id: `tm-${Date.now()}`,
      name: name.trim(),
      email: normalized,
      role: 'Employee',
      color: '#10B981',
      active: false, // Pending Admin Approval!
      password: hashedPassword,
    };

    const updatedTeam = [...team, newMember];
    saveTeamToStorage(updatedTeam);
    sendAppsScriptAction('addTeamMember', { data: newMember }).catch((err) =>
      console.warn('Background sheet addTeamMember sync:', err)
    );
    resetPasswordInBackend(normalized, hashedPassword).catch((err) =>
      console.warn('Background sheet password sync:', err)
    );

    // Send Admin Notification email & in-app alert with One-Click Approval link
    notifyAdminsOfNewRegistration(newMember, team);

    return {
      success: true,
      user: newMember,
      error: `Account created successfully! Your account is pending Admin approval. You will receive an email once your Workspace Admin approves your access.`,
    };
  };

  const approveUserByAdmin = async (
    userEmail: string,
    assignedRole: UserRole
  ): Promise<{ success: boolean; error?: string }> => {
    const normalized = userEmail.trim().toLowerCase();
    const { team } = await fetchLatestTeam();
    const foundIndex = team.findIndex((m) => m.email && m.email.trim().toLowerCase() === normalized);

    if (foundIndex === -1) {
      return { success: false, error: 'User account not found.' };
    }

    const updatedMember: TeamMember = {
      ...team[foundIndex],
      active: true,
      role: assignedRole,
    };

    const updatedTeam = [...team];
    updatedTeam[foundIndex] = updatedMember;

    saveTeamToStorage(updatedTeam);
    sendAppsScriptAction('updateTeamMember', { data: updatedMember }).catch((err) =>
      console.warn('Background sheet updateTeamMember sync:', err)
    );

    // Send user email confirmation that their account has been approved!
    const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://deepwoods-pm.vercel.app';
    const subject = `🎉 Account Approved! Welcome to Deepwoods Green`;
    const userEmailHtml = generateUserApprovalConfirmationEmail(updatedMember, assignedRole, appUrl);

    sendAppsScriptAction('sendEmail', {
      recipientEmail: normalized,
      subject,
      htmlBody: userEmailHtml,
    }).catch((err) => console.warn('Background user approval email dispatch:', err));

    refreshUser(updatedTeam);
    return { success: true };
  };

  const setPasswordForUser = async (
    email: string,
    newPassword: string
  ): Promise<{ success: boolean; updatedUser?: TeamMember; error?: string }> => {
    const normalized = email.trim().toLowerCase();
    if (!normalized) {
      return { success: false, error: 'Invalid email address.' };
    }
    if (!newPassword || newPassword.length < 4) {
      return { success: false, error: 'Password must be at least 4 characters long.' };
    }

    const { team } = await fetchLatestTeam();
    const foundIndex = team.findIndex((m) => m.email && m.email.trim().toLowerCase() === normalized);

    if (foundIndex === -1) {
      return { success: false, error: 'Team member not found.' };
    }

    const hashedPassword = await hashPassword(newPassword);
    setStoredPassword(normalized, hashedPassword);

    const updatedMember = { ...team[foundIndex], password: hashedPassword };
    const updatedTeam = [...team];
    updatedTeam[foundIndex] = updatedMember;

    saveTeamToStorage(updatedTeam);
    resetPasswordInBackend(normalized, hashedPassword).catch((err) =>
      console.warn('Background sheet password sync:', err)
    );
    return { success: true, updatedUser: updatedMember };
  };

  // Step 1: Send OTP Verification Code to Email
  const sendPasswordResetOTP = async (
    email: string
  ): Promise<{ success: boolean; error?: string; message?: string }> => {
    const normalized = email.trim().toLowerCase();
    if (!normalized) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    const { team } = await fetchLatestTeam();
    const found = team.find((m) => m.email && m.email.trim().toLowerCase() === normalized);

    if (!found) {
      return {
        success: false,
        error: `No authorized team member found with email: ${email}. Please check the email address.`,
      };
    }

    if (found.active === false) {
      return {
        success: false,
        error: `Account ${email} is inactive. Contact workspace admin for assistance.`,
      };
    }

    // Generate 6-digit numeric OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

    // Store in localStorage
    try {
      const rawOtps = localStorage.getItem(OTP_STORAGE_KEY);
      const otps = rawOtps ? JSON.parse(rawOtps) : {};
      otps[normalized] = { code: otpCode, expiresAt };
      localStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(otps));
    } catch (err) {
      console.error('Failed to store OTP in local storage:', err);
    }

    // Dispatch Verification Email via Apps Script Gmail Service
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 28px; color: #1e293b;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #059669; margin: 0; font-size: 22px; font-weight: 800;">Deepwoods Green</h2>
          <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Password Reset Verification Code</p>
        </div>
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
          <p style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin: 0 0 8px 0; font-weight: bold;">Your 6-Digit Verification Code</p>
          <div style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #059669; font-family: monospace;">${otpCode}</div>
          <p style="font-size: 11px; color: #94a3b8; margin: 10px 0 0 0;">Valid for 10 minutes. Do not share this code with anyone.</p>
        </div>
        <p style="font-size: 12px; color: #475569; line-height: 1.5;">
          Hello <strong>${found.name}</strong>,<br/>
          We received a request to reset your password for your Deepwoods Green account. Enter the verification code above in the login screen to complete your password reset.
        </p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0 16px 0;" />
        <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">
          If you did not request a password reset, you can safely ignore this email.
        </p>
      </div>
    `;

    sendAppsScriptAction('sendEmail', {
      recipientEmail: normalized,
      subject: `🔐 Deepwoods Green - Password Reset Verification Code (${otpCode})`,
      htmlBody: emailHtml,
    }).catch((err) => console.warn('Background email dispatch:', err));

    return {
      success: true,
      message: `Verification code sent to ${email}! Check your inbox.`,
    };
  };

  // Step 2: Verify OTP Code & Reset Password
  const verifyOTPAndResetPassword = async (
    email: string,
    otpCode: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string; message?: string }> => {
    const normalized = email.trim().toLowerCase();
    const cleanOTP = otpCode.trim();

    if (!normalized || !cleanOTP) {
      return { success: false, error: 'Please enter the 6-digit verification code sent to your email.' };
    }

    if (!newPassword || newPassword.length < 4) {
      return { success: false, error: 'Password must be at least 4 characters long.' };
    }

    // Verify OTP Code
    try {
      const rawOtps = localStorage.getItem(OTP_STORAGE_KEY);
      const otps = rawOtps ? JSON.parse(rawOtps) : {};
      const stored = otps[normalized];

      if (!stored || stored.code !== cleanOTP) {
        return {
          success: false,
          error: 'Invalid verification code. Please check your email and enter the correct 6-digit code.',
        };
      }

      if (Date.now() > stored.expiresAt) {
        return {
          success: false,
          error: 'Verification code has expired. Please request a new code.',
        };
      }

      // OTP is valid! Clear used OTP
      delete otps[normalized];
      localStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(otps));
    } catch (err) {
      console.error('OTP Verification Error:', err);
    }

    // Complete password reset
    const { team } = await fetchLatestTeam();
    const foundIndex = team.findIndex((m) => m.email && m.email.trim().toLowerCase() === normalized);

    if (foundIndex === -1) {
      return { success: false, error: 'Team member not found.' };
    }

    const hashedPassword = await hashPassword(newPassword);
    setStoredPassword(normalized, hashedPassword);

    const updatedMember = { ...team[foundIndex], password: hashedPassword };
    const updatedTeam = [...team];
    updatedTeam[foundIndex] = updatedMember;

    saveTeamToStorage(updatedTeam);
    resetPasswordInBackend(normalized, hashedPassword).catch((err) =>
      console.warn('Background sheet password sync:', err)
    );

    return {
      success: true,
      message: `Password reset verified & updated successfully for ${email}! You can now sign in with your new password.`,
    };
  };

  const resetPassword = async (
    email: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string; message?: string }> => {
    return verifyOTPAndResetPassword(email, '000000', newPassword);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('deepwoods_auth_user_id');
  };

  const userRole = normalizeRole(user?.role);
  const isAdmin = userRole === 'Admin';
  const isProductManager = userRole === 'Product Manager';
  const isEmployee = userRole === 'Employee';

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        userRole,
        isAdmin,
        isProductManager,
        isEmployee,
        canManageTeam: canManageTeam(user?.role),
        canManageProjects: canManageProjects(user?.role),
        canAccessTeamPage: canAccessTeamPage(user?.role),
        verifyGoogleUser,
        completeLogin,
        loginWithGoogle,
        loginWithPassword,
        signUpWithPassword,
        approveUserByAdmin,
        setPasswordForUser,
        sendPasswordResetOTP,
        verifyOTPAndResetPassword,
        resetPassword,
        refreshUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
