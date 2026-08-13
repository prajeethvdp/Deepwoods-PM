import React, { useState, useEffect, useRef } from 'react';
import {
  AlertTriangle,
  ShieldCheck,
  Lock,
  Loader2,
  Eye,
  EyeOff,
  Mail,
  KeyRound,
  CheckCircle2,
  X,
  RefreshCw,
  ArrowRight,
  Shield,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { TeamMember } from '../types';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { verifyGoogleUser, completeLogin, loginWithPassword, setPasswordForUser, resetPassword } = useAuth();

  // Primary Login State: Default to Google OAuth tab when page is opened
  const [authMethod, setAuthMethod] = useState<'password' | 'google'>('google');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Google OAuth State
  const [isGsiLoaded, setIsGsiLoaded] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const buttonContainerRef = useRef<HTMLDivElement>(null);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  // Post-Google OAuth Optional Password Setup Modal State
  const [isGooglePasswordModalOpen, setIsGooglePasswordModalOpen] = useState(false);
  const [googleUser, setGoogleUser] = useState<TeamMember | null>(null);
  const [googleNewPassword, setGoogleNewPassword] = useState('');
  const [googleConfirmPassword, setGoogleConfirmPassword] = useState('');
  const [showGooglePassword, setShowGooglePassword] = useState(false);
  const [googleModalSubmitting, setGoogleModalSubmitting] = useState(false);
  const [googleModalError, setGoogleModalError] = useState<string | null>(null);

  // Reset Password Modal State
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  // Initialize Google OAuth GSI script button
  useEffect(() => {
    if (authMethod !== 'google') return;

    const handleCredentialResponse = async (response: any) => {
      setErrorMessage(null);
      setIsVerifying(true);
      if (!response.credential) {
        setErrorMessage('Google OAuth authentication failed.');
        setIsVerifying(false);
        return;
      }

      try {
        const base64Url = response.credential.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const payload = JSON.parse(jsonPayload);

        if (payload && payload.email) {
          const res = await verifyGoogleUser(payload.email, payload.name || payload.email.split('@')[0]);
          if (res.success && res.user) {
            // Only ask to set password if no password has been set yet for this account
            if (!res.user.password) {
              setGoogleUser(res.user);
              setGoogleNewPassword('');
              setGoogleConfirmPassword('');
              setGoogleModalError(null);
              setIsGooglePasswordModalOpen(true);
            } else {
              completeLogin(res.user);
              onLoginSuccess();
            }
          } else {
            setErrorMessage(res.error || 'Access Denied.');
          }
        } else {
          setErrorMessage('Could not retrieve email from Google Account.');
        }
      } catch (err) {
        console.error('Failed to parse Google OAuth token', err);
        setErrorMessage('Failed to process Google authentication token.');
      } finally {
        setIsVerifying(false);
      }
    };

    const initGoogleOAuth = () => {
      if ((window as any).google?.accounts?.id && googleClientId) {
        try {
          (window as any).google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleCredentialResponse,
            auto_select: false,
          });

          if (buttonContainerRef.current) {
            buttonContainerRef.current.innerHTML = '';
            (window as any).google.accounts.id.renderButton(buttonContainerRef.current, {
              type: 'standard',
              theme: 'outline',
              size: 'large',
              width: 320,
              text: 'signin_with',
              shape: 'rectangular',
              logo_alignment: 'left',
            });
          }
          setIsGsiLoaded(true);
        } catch (err) {
          console.error('Google OAuth init error:', err);
        }
      }
    };

    initGoogleOAuth();
    const interval = setInterval(() => {
      if ((window as any).google?.accounts?.id) {
        initGoogleOAuth();
        clearInterval(interval);
      }
    }, 300);

    return () => clearInterval(interval);
  }, [authMethod, googleClientId, verifyGoogleUser, onLoginSuccess]);

  // Handle Password Sign In
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await loginWithPassword(email, password);
      if (result.success) {
        onLoginSuccess();
      } else {
        setErrorMessage(result.error || 'Authentication failed.');
      }
    } catch (err) {
      setErrorMessage('An unexpected error occurred during login.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Reset Password Modal
  const handleOpenResetModal = () => {
    setResetEmail(email.trim());
    setNewPassword('');
    setConfirmPassword('');
    setResetError(null);
    setResetSuccess(null);
    setIsResetModalOpen(true);
  };

  // Handle Reset Password Submit
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetSuccess(null);

    if (!resetEmail.trim()) {
      setResetError('Please enter your registered email address.');
      return;
    }

    if (!newPassword || newPassword.length < 4) {
      setResetError('Password must be at least 4 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetError('Passwords do not match. Please check and try again.');
      return;
    }

    setResetSubmitting(true);
    try {
      const res = await resetPassword(resetEmail, newPassword);
      if (res.success) {
        setResetSuccess(res.message || 'Password updated successfully!');
        setEmail(resetEmail);
        setPassword(newPassword);
        setTimeout(() => {
          setIsResetModalOpen(false);
          setSuccessMessage('Password updated! Click Sign In to log in.');
        }, 1800);
      } else {
        setResetError(res.error || 'Failed to reset password.');
      }
    } catch (err) {
      setResetError('An unexpected error occurred during password reset.');
    } finally {
      setResetSubmitting(false);
    }
  };

  // Save Password from Post-Google OAuth Modal
  const handleSaveGooglePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setGoogleModalError(null);

    if (!googleNewPassword || googleNewPassword.length < 4) {
      setGoogleModalError('Password must be at least 4 characters long.');
      return;
    }

    if (googleNewPassword !== googleConfirmPassword) {
      setGoogleModalError('Passwords do not match. Please check and try again.');
      return;
    }

    if (!googleUser) {
      onLoginSuccess();
      return;
    }

    setGoogleModalSubmitting(true);
    try {
      const res = await setPasswordForUser(googleUser.email, googleNewPassword);
      const userToLogin = res.updatedUser || googleUser;
      setIsGooglePasswordModalOpen(false);
      completeLogin(userToLogin);
      onLoginSuccess();
    } catch (err) {
      setGoogleModalError('Error saving password.');
    } finally {
      setGoogleModalSubmitting(false);
    }
  };

  // Continue to Dashboard post-Google OAuth
  const handleSkipGooglePassword = () => {
    if (googleUser) {
      completeLogin(googleUser);
    }
    setIsGooglePasswordModalOpen(false);
    onLoginSuccess();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 relative overflow-hidden select-none">
      {/* Background Radial Glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-xl inline-block">
            <img
              src="/logo.png"
              alt="Deepwoods Green"
              className="h-16 w-auto mx-auto object-contain"
            />
          </div>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Internal Project Management System. Authenticate to access workspace.
          </p>
        </div>

        {/* Global Notifications / Error Banners */}
        {errorMessage && (
          <div className="bg-red-950/90 border border-red-500/60 p-4 rounded-2xl flex items-start gap-3 animate-fade-in text-xs text-red-200 shadow-xl">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-red-300 block mb-0.5">Access Control Alert</span>
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="bg-emerald-950/90 border border-emerald-500/60 p-4 rounded-2xl flex items-start gap-3 animate-fade-in text-xs text-emerald-200 shadow-xl">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-emerald-300 block mb-0.5">Success</span>
              <span className="leading-relaxed">{successMessage}</span>
            </div>
          </div>
        )}

        {/* Main Authentication Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-md space-y-5">
          {/* Method Switcher Tabs */}
          <div className="grid grid-cols-2 p-1 bg-slate-950/80 rounded-xl border border-slate-800/80 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setAuthMethod('password');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all ${
                authMethod === 'password'
                  ? 'bg-gradient-to-r from-emerald-600 to-cyan-600 text-white shadow-md font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Password Login</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMethod('google');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all ${
                authMethod === 'google'
                  ? 'bg-gradient-to-r from-emerald-600 to-cyan-600 text-white shadow-md font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Google OAuth</span>
            </button>
          </div>

          {/* TAB 1: EMAIL & PASSWORD LOGIN */}
          {authMethod === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4 pt-1">
              {/* Email Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-cyan-400" />
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@deepwoodsgreen.com"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                />
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={handleOpenResetModal}
                    className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 hover:underline transition-all"
                  >
                    Forgot / Reset Password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 pr-10 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-semibold py-2.5 px-4 rounded-xl shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying SHA-256 Credentials...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Sign In to Workspace</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 2: GOOGLE OAUTH 2.0 */}
          {authMethod === 'google' && (
            <div className="space-y-4 py-2 text-center">
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-white tracking-tight">Google OAuth 2.0 Identity</h3>
                <p className="text-[11px] text-slate-400">
                  Sign in with your verified Google Account associated with the workspace.
                </p>
              </div>

              {!googleClientId && (
                <div className="bg-amber-950/80 border border-amber-500/50 p-3 rounded-xl flex items-start gap-2 text-[11px] text-amber-200 text-left">
                  <Lock className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-amber-300 block mb-0.5">Configuration Required</span>
                    <span>Set VITE_GOOGLE_CLIENT_ID in .env to enable Google OAuth.</span>
                  </div>
                </div>
              )}

              <div className="flex flex-col items-center justify-center min-h-[50px] py-1">
                {isVerifying ? (
                  <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold py-2 animate-pulse">
                    <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                    <span>Verifying access with workspace database...</span>
                  </div>
                ) : (
                  <>
                    <div ref={buttonContainerRef} id="google-signin-button" className="flex justify-center" />
                    {!isGsiLoaded && googleClientId && (
                      <div className="text-xs text-slate-500 animate-pulse mt-2">
                        Loading Google OAuth button...
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>SHA-256 Encrypted Session & Google OAuth 2.0</span>
        </div>
      </div>

      {/* POST-GOOGLE OAUTH OPTIONAL PASSWORD SETUP MODAL */}
      {isGooglePasswordModalOpen && googleUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl p-6 relative space-y-5">
            {/* Modal Header */}
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-emerald-600 to-cyan-600 rounded-xl text-white shadow-lg">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Set Account Password</h3>
                <p className="text-xs text-cyan-400 font-medium">Set Password for: {googleUser.email}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              Welcome, <span className="font-bold text-cyan-300">{googleUser.name}</span>! Google OAuth login successful. Please set a new password for <span className="font-semibold text-emerald-300">{googleUser.email}</span> below.
            </p>

            {/* Error Banner */}
            {googleModalError && (
              <div className="bg-red-950/90 border border-red-500/60 p-3 rounded-xl flex items-start gap-2.5 text-xs text-red-200">
                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <span>{googleModalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveGooglePassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showGooglePassword ? 'text' : 'password'}
                    value={googleNewPassword}
                    onChange={(e) => setGoogleNewPassword(e.target.value)}
                    placeholder="Enter new password (min 4 chars)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 pr-10 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowGooglePassword(!showGooglePassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {showGooglePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                  Verify New Password
                </label>
                <input
                  type={showGooglePassword ? 'text' : 'password'}
                  value={googleConfirmPassword}
                  onChange={(e) => setGoogleConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password to verify"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSkipGooglePassword}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white border border-slate-800 hover:bg-slate-800 rounded-xl transition-all"
                >
                  Continue to Dashboard
                </button>
                <button
                  type="submit"
                  disabled={googleModalSubmitting}
                  className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {googleModalSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Setting Password...</span>
                    </>
                  ) : (
                    <>
                      <span>Set Password</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl p-6 relative space-y-4">
            {/* Modal Close Button */}
            <button
              onClick={() => setIsResetModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-cyan-950/80 border border-cyan-500/40 rounded-xl text-cyan-400">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Reset Account Password</h3>
                <p className="text-xs text-slate-400">Set or update your SHA-256 encrypted password</p>
              </div>
            </div>

            {/* Error & Success Feedback inside Modal */}
            {resetError && (
              <div className="bg-red-950/90 border border-red-500/60 p-3 rounded-xl flex items-start gap-2.5 text-xs text-red-200">
                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <span>{resetError}</span>
              </div>
            )}

            {resetSuccess && (
              <div className="bg-emerald-950/90 border border-emerald-500/60 p-3 rounded-xl flex items-start gap-2.5 text-xs text-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>{resetSuccess}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleResetPasswordSubmit} className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-cyan-400" />
                  Registered Email Address
                </label>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="user@deepwoodsgreen.com"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showResetPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 4 characters"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 pr-10 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-teal-400" />
                  Confirm New Password
                </label>
                <input
                  type={showResetPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetSubmitting}
                  className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {resetSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Save & Reset Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
