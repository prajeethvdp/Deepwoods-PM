import React, { createContext, useContext, useState } from 'react';
import { TeamMember } from '../types';
import { loadTeamFromStorage, saveTeamToStorage, sendAppsScriptAction, resetPasswordInBackend } from '../lib/sheets';
import { hashPassword, verifyPassword } from '../lib/cryptoUtils';

const PASSWORDS_STORAGE_KEY = 'deepwoods_user_passwords';

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

interface AuthContextType {
  user: TeamMember | null;
  isAuthenticated: boolean;
  verifyGoogleUser: (email: string, name: string) => Promise<{ success: boolean; user?: TeamMember; error?: string }>;
  completeLogin: (user: TeamMember) => void;
  loginWithGoogle: (email: string, name: string) => Promise<{ success: boolean; user?: TeamMember; error?: string }>;
  loginWithPassword: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  setPasswordForUser: (email: string, newPassword: string) => Promise<{ success: boolean; updatedUser?: TeamMember; error?: string }>;
  resetPassword: (email: string, newPassword: string) => Promise<{ success: boolean; error?: string; message?: string }>;
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
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const scriptUrl = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL;
      if (scriptUrl) {
        const res = await fetch(`${scriptUrl}?action=getTeam`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (res.ok) {
          const result = await res.json();
          if (result.success && Array.isArray(result.data)) {
            // Merge sheet data with local password cache so empty backend fields don't wipe out passwords
            team = result.data.map((m: TeamMember) => {
              const normEmail = (m.email || '').trim().toLowerCase();
              const cachedPassword = passMap[normEmail] || '';
              return {
                ...m,
                password: m.password || cachedPassword,
              };
            });
            saveTeamToStorage(team);
            backendSynced = true;
          }
        }
      }
    } catch (e) {
      console.warn('Fast team fetch warning (using local storage cache):', e);
    }

    // Attach cached passwords to local team list if needed
    team = team.map((m) => {
      const normEmail = (m.email || '').trim().toLowerCase();
      return {
        ...m,
        password: m.password || passMap[normEmail] || '',
      };
    });

    return { team, backendSynced };
  };

  const verifyGoogleUser = async (
    email: string,
    name: string
  ): Promise<{ success: boolean; user?: TeamMember; error?: string }> => {
    const normalized = email.trim().toLowerCase();
    if (!normalized) {
      return { success: false, error: 'Invalid Google account email.' };
    }

    const { team, backendSynced } = await fetchLatestTeam();
    const found = team.find((m) => m.email && m.email.trim().toLowerCase() === normalized);

    if (found) {
      if (found.active === false) {
        return {
          success: false,
          error: `Access Revoked: ${email} is set to Inactive (FALSE). Contact your administrator to reactivate access.`,
        };
      }
      return { success: true, user: found };
    }

    // Initial Setup: ONLY if Google Sheets backend returns an explicitly empty team list (0 members)
    if (backendSynced && team.length === 0) {
      const newMember: TeamMember = {
        id: `tm-${Date.now()}`,
        name: name || normalized.split('@')[0],
        role: 'Member',
        email: normalized,
        color: '#06B6D4',
        active: true,
      };
      const updatedTeam = [newMember];
      saveTeamToStorage(updatedTeam);
      sendAppsScriptAction('addTeamMember', { data: newMember });
      return { success: true, user: newMember };
    }

    return {
      success: false,
      error: `Access Denied: ${email} is not an authorized team member. Please ask a workspace administrator to add your email under Team Settings or in Google Sheets.`,
    };
  };

  const completeLogin = (member: TeamMember) => {
    setUser(member);
    localStorage.setItem('deepwoods_auth_user_id', member.id);
  };

  const loginWithGoogle = async (
    email: string,
    name: string
  ): Promise<{ success: boolean; user?: TeamMember; error?: string }> => {
    const result = await verifyGoogleUser(email, name);
    if (result.success && result.user) {
      completeLogin(result.user);
    }
    return result;
  };

  const loginWithPassword = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const normalized = email.trim().toLowerCase();
    if (!normalized) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    if (!password) {
      return { success: false, error: 'Please enter your password.' };
    }

    const { team } = await fetchLatestTeam();
    const found = team.find((m) => m.email && m.email.trim().toLowerCase() === normalized);

    if (!found) {
      return {
        success: false,
        error: `Access Denied: ${email} is not listed as a workspace team member. Please contact your workspace administrator.`,
      };
    }

    if (found.active === false) {
      return {
        success: false,
        error: `Access Revoked: Account ${email} is deactivated. Please contact your administrator.`,
      };
    }

    if (!found.password) {
      return {
        success: false,
        error: `No password set for ${email}. Click "Forgot / Reset Password" below to set up your password.`,
      };
    }

    // SHA-256 password verification
    const isValid = await verifyPassword(password, found.password);
    if (!isValid) {
      return {
        success: false,
        error: 'Incorrect password. Please try again or use "Forgot / Reset Password".',
      };
    }

    // Auto-migrate legacy plain text password to SHA-256 hash if needed
    if (found.password === password) {
      const hashedPassword = await hashPassword(password);
      found.password = hashedPassword;
      setStoredPassword(normalized, hashedPassword);
      const updatedTeam = team.map((m) => (m.id === found.id ? found : m));
      saveTeamToStorage(updatedTeam);
      resetPasswordInBackend(normalized, hashedPassword);
    }

    completeLogin(found);
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
    // Sync to Google Sheets asynchronously in background so login responds instantly
    resetPasswordInBackend(normalized, hashedPassword).catch((err) =>
      console.warn('Background sheet password sync:', err)
    );
    return { success: true, updatedUser: updatedMember };
  };

  const resetPassword = async (
    email: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string; message?: string }> => {
    const normalized = email.trim().toLowerCase();
    if (!normalized) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    if (!newPassword || newPassword.length < 4) {
      return { success: false, error: 'Password must be at least 4 characters long.' };
    }

    const { team } = await fetchLatestTeam();
    const foundIndex = team.findIndex((m) => m.email && m.email.trim().toLowerCase() === normalized);

    if (foundIndex === -1) {
      return {
        success: false,
        error: `No registered team member found with email: ${email}. Please check the email address.`,
      };
    }

    const member = team[foundIndex];
    if (member.active === false) {
      return {
        success: false,
        error: `Account ${email} is set to Inactive. Password cannot be reset for inactive accounts.`,
      };
    }

    const hashedPassword = await hashPassword(newPassword);
    setStoredPassword(normalized, hashedPassword);

    const updatedMember = { ...member, password: hashedPassword };
    const updatedTeam = [...team];
    updatedTeam[foundIndex] = updatedMember;

    saveTeamToStorage(updatedTeam);
    resetPasswordInBackend(normalized, hashedPassword).catch((err) =>
      console.warn('Background sheet password sync:', err)
    );

    return {
      success: true,
      message: `Password updated successfully for ${email}! You can now sign in with your new password.`,
    };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('deepwoods_auth_user_id');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        verifyGoogleUser,
        completeLogin,
        loginWithGoogle,
        loginWithPassword,
        setPasswordForUser,
        resetPassword,
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
