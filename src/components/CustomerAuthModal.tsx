import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  LogOut,
  ShoppingBag,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Gamepad2,
  ArrowRight,
  RotateCw,
  Award,
  History,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  getCurrentCustomer,
  registerCustomer,
  loginCustomer,
  clearCustomerSession,
  fetchCustomerProfile,
} from '../services/customerAuth';
import { UserProfile, PepAccountSummary } from '../types';
import { useLanguage } from '../services/language.tsx';

interface CustomerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register' | 'forgot' | 'profile';
  onNavigateToOrders?: () => void;
}

export const CustomerAuthModal: React.FC<CustomerAuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  onNavigateToOrders,
}) => {
  const { language } = useLanguage();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(getCurrentCustomer());
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'reset' | 'profile'>(() => {
    return getCurrentCustomer() ? 'profile' : initialMode;
  });

  // PEP Currency State
  const [pepData, setPepData] = useState<PepAccountSummary | null>(null);
  const [showPepLedger, setShowPepLedger] = useState(false);
  const [loadingPep, setLoadingPep] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [defaultPlayerId, setDefaultPlayerId] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const loadPepData = async () => {
    const token = localStorage.getItem('somtopup_customer_token');
    if (!token) return;
    setLoadingPep(true);
    try {
      const res = await fetch('/api/customer/pep', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setPepData(data);
        }
      }
    } catch (e) {
      console.error('Error loading PEP data:', e);
    } finally {
      setLoadingPep(false);
    }
  };

  // Sync session on mount & storage events
  useEffect(() => {
    const handleAuthChange = () => {
      const user = getCurrentCustomer();
      setCurrentUser(user);
      if (user) {
        loadPepData();
      }
    };

    window.addEventListener('somtopup_customer_auth_change', handleAuthChange);
    return () => {
      window.removeEventListener('somtopup_customer_auth_change', handleAuthChange);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      const user = getCurrentCustomer();
      setCurrentUser(user);
      if (user) {
        setMode('profile');
        setName(user.name || '');
        setDefaultPlayerId(user.defaultPlayerId || '');
        loadPepData();
      } else {
        setMode(initialMode === 'profile' ? 'login' : initialMode);
      }
      setErrorMessage('');
      setSuccessMessage('');
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!email.trim() || !password) {
      setErrorMessage(language === 'so' ? 'Fadlan geli iimaylkaaga iyo furahaaga sirta ah.' : 'Please enter your email and password.');
      return;
    }

    setLoading(true);
    const res = await loginCustomer(email.trim(), password);
    setLoading(false);

    if (res.success && res.user) {
      setCurrentUser(res.user);
      setSuccessMessage(language === 'so' ? 'Si guul leh ayaad u soo gashay!' : 'Logged in successfully!');
      setTimeout(() => {
        onClose();
      }, 700);
    } else {
      setErrorMessage(res.error || (language === 'so' ? 'Iimaylka ama furaha sirta ah ma saxna.' : 'Invalid email or password.'));
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage(language === 'so' ? 'Fadlan geli cinwaan iimayl sax ah.' : 'Please enter a valid email address.');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage(language === 'so' ? 'Furaha sirta ah waa inuu ugu yaraan ka koobnaadaa 6 xaraf.' : 'Password must be at least 6 characters.');
      return;
    }

    if (confirmPassword && password !== confirmPassword) {
      setErrorMessage(language === 'so' ? 'Labada fure isma leha.' : 'Passwords do not match.');
      return;
    }

    setLoading(true);
    const res = await registerCustomer(cleanEmail, password, name.trim() || undefined, defaultPlayerId.trim() || undefined);
    setLoading(false);

    if (res.success && res.user) {
      setCurrentUser(res.user);
      setSuccessMessage(language === 'so' ? 'Akoonkaaga si guul leh ayaa loo abuuray! Waad soo gashay.' : 'Account created successfully without email verification code!');
      setTimeout(() => {
        onClose();
      }, 900);
    } else {
      setErrorMessage(res.error || (language === 'so' ? 'Ma suuragelin in la abuuro akoon.' : 'Could not create account.'));
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!email.trim()) {
      setErrorMessage(language === 'so' ? 'Fadlan geli iimaylkaaga.' : 'Please enter your email.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      setLoading(false);

      if (data.success) {
        if (data.resetToken) {
          setResetToken(data.resetToken);
          setMode('reset');
          setSuccessMessage(language === 'so' ? 'Koodhka dib-u-dejinta waa la diyaariyay. Geli furahaaga cusub.' : 'Reset token generated. Please enter your new password.');
        } else {
          setSuccessMessage(data.message || 'Haddii iimaylku jiro, dib-u-dejinta waa la oggolaaday.');
        }
      } else {
        setErrorMessage(data.error || 'Khalad ayaa dhacay.');
      }
    } catch {
      setLoading(false);
      setErrorMessage('Khalad xagga xiriirka ah ayaa dhacay.');
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!newPassword || newPassword.length < 6) {
      setErrorMessage(language === 'so' ? 'Furaha cusub waa inuu ka koobnaadaa ugu yaraan 6 xaraf.' : 'New password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          resetToken,
          newPassword,
        }),
      });
      const data = await res.json();
      setLoading(false);

      if (data.success) {
        setSuccessMessage(language === 'so' ? 'Furahaaga sirta ah si guul leh ayaa loo beddelay! Fadlan soo gal.' : 'Password reset successfully! Please log in.');
        setTimeout(() => {
          setPassword('');
          setMode('login');
          setSuccessMessage('');
        }, 1500);
      } else {
        setErrorMessage(data.error || 'Ma suuragelin in la beddelo furaha.');
      }
    } catch {
      setLoading(false);
      setErrorMessage('Khalad xagga xiriirka ah ayaa dhacay.');
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const token = localStorage.getItem('somtopup_customer_token');
    if (!token) return;

    setLoading(true);
    try {
      const res = await fetch('/api/customer/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          defaultPlayerId: defaultPlayerId.trim(),
        }),
      });
      const data = await res.json();
      setLoading(false);

      if (data.success && data.user) {
        setCurrentUser(data.user);
        localStorage.setItem('somtopup_customer_user', JSON.stringify(data.user));
        setSuccessMessage(language === 'so' ? 'Xogta akoonka si guul leh ayaa loo keydiyay!' : 'Profile updated successfully!');
      } else {
        setErrorMessage(data.error || 'Khalad ayaa dhacay.');
      }
    } catch {
      setLoading(false);
      setErrorMessage('Khalad xagga xiriirka ah.');
    }
  };

  const handleLogout = async () => {
    const token = localStorage.getItem('somtopup_customer_token');
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (e) {}
    }
    clearCustomerSession();
    setCurrentUser(null);
    setMode('login');
    setSuccessMessage(language === 'so' ? 'Si nabad ah ayaad uga baxday koontada.' : 'Logged out successfully.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Header Bar (Red & White Theme) */}
        <div className="bg-red-600 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center font-bold text-white text-sm">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">
                {mode === 'profile'
                  ? (language === 'so' ? 'Akoonka Macmiilka' : 'Customer Account')
                  : mode === 'register'
                  ? (language === 'so' ? 'Sameyso Koonto Cusub' : 'Create Account')
                  : mode === 'forgot' || mode === 'reset'
                  ? (language === 'so' ? 'Dib-u-dejinta Furaha' : 'Password Recovery')
                  : (language === 'so' ? 'Gal Koontadaada' : 'Customer Login')}
              </h2>
              <p className="text-[11px] text-red-100">
                SomTopUp • Suuqa Ciyaaraha Soomaaliyeed
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Xir"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher if not logged in and not in password recovery */}
        {!currentUser && mode !== 'forgot' && mode !== 'reset' && (
          <div className="flex border-b border-gray-200 bg-gray-50/60 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMessage('');
                setSuccessMessage('');
              }}
              className={`flex-1 py-3 text-center transition-colors cursor-pointer border-b-2 ${
                mode === 'login'
                  ? 'border-red-600 text-red-600 bg-white'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              {language === 'so' ? 'Gal (Login)' : 'Login'}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMessage('');
                setSuccessMessage('');
              }}
              className={`flex-1 py-3 text-center transition-colors cursor-pointer border-b-2 ${
                mode === 'register'
                  ? 'border-red-600 text-red-600 bg-white'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              {language === 'so' ? 'Diiwaangeli (Register)' : 'Register'}
            </button>
          </div>
        )}

        <div className="p-5 sm:p-6 space-y-4">
          {/* Alerts */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-green-800 text-xs flex items-start gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* 1. LOGIN FORM */}
          {mode === 'login' && !currentUser && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  {language === 'so' ? 'Cinwaanka Iimaylka' : 'Email Address'} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full bg-white border border-gray-300 rounded-xl pl-9 pr-3.5 py-2.5 text-base sm:text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
                  />
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-gray-700">
                    {language === 'so' ? 'Furaha Sirta ah' : 'Password'} <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setErrorMessage('');
                      setSuccessMessage('');
                    }}
                    className="text-[11px] font-semibold text-red-600 hover:underline cursor-pointer"
                  >
                    {language === 'so' ? 'Ma ilowday furaha?' : 'Forgot password?'}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white border border-gray-300 rounded-xl pl-9 pr-9 py-2.5 text-base sm:text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
                  />
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:opacity-50 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-98 mt-2"
              >
                {loading ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    <span>{language === 'so' ? 'Waa la baarayaa...' : 'Signing in...'}</span>
                  </>
                ) : (
                  <span>{language === 'so' ? 'Gal Koontada' : 'Sign In'}</span>
                )}
              </button>

              <div className="pt-2 text-center text-xs text-gray-500">
                <span>{language === 'so' ? 'Miyaadan lahayn koonto?' : "Don't have an account?"} </span>
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className="font-bold text-red-600 hover:underline cursor-pointer"
                >
                  {language === 'so' ? 'Halkan ka sameyso' : 'Create one now'}
                </button>
              </div>
            </form>
          )}

          {/* 2. REGISTER FORM (NO EMAIL VERIFICATION CODE REQUIRED) */}
          {mode === 'register' && !currentUser && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div className="p-2.5 rounded-xl bg-red-50/70 border border-red-200 text-[11px] text-red-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-red-600 shrink-0" />
                <span>
                  {language === 'so'
                    ? 'Diiwaangelin degdeg ah — looma baahna koodh hubin iimayl ah.'
                    : 'Instant registration — no email verification step required.'}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {language === 'so' ? 'Magacaaga (Ikhtiyaari)' : 'Full Name (Optional)'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Magacaaga"
                    className="w-full bg-white border border-gray-300 rounded-xl pl-9 pr-3.5 py-2.5 text-base sm:text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
                  />
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {language === 'so' ? 'Cinwaanka Iimaylka' : 'Email Address'} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full bg-white border border-gray-300 rounded-xl pl-9 pr-3.5 py-2.5 text-base sm:text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
                  />
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {language === 'so' ? 'PUBG Player ID (Ikhtiyaari)' : 'Default PUBG Player ID (Optional)'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={defaultPlayerId}
                    onChange={(e) => setDefaultPlayerId(e.target.value)}
                    placeholder="5123984521"
                    className="w-full bg-white border border-gray-300 rounded-xl pl-9 pr-3.5 py-2.5 text-base sm:text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 font-mono transition-all"
                  />
                  <Gamepad2 className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
                <span className="text-[10px] text-gray-400 mt-0.5 block">
                  {language === 'so'
                    ? 'Si toos ah ayaa loogu buuxin doonaa xilliga aad dalbaneyso UC.'
                    : 'Auto-fills during your PUBG UC top-ups.'}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {language === 'so' ? 'Furaha Sirta ah (Ugu yaraan 6 xaraf)' : 'Password (min. 6 chars)'} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white border border-gray-300 rounded-xl pl-9 pr-9 py-2.5 text-base sm:text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
                  />
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:opacity-50 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-98 mt-2"
              >
                {loading ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    <span>{language === 'so' ? 'Waa la diiwaangelinayaa...' : 'Registering...'}</span>
                  </>
                ) : (
                  <span>{language === 'so' ? 'Diiwaangeli Koontada' : 'Create Account'}</span>
                )}
              </button>

              <div className="pt-2 text-center text-xs text-gray-500">
                <span>{language === 'so' ? 'Miyaad hore u lahayd koonto?' : 'Already have an account?'} </span>
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className="font-bold text-red-600 hover:underline cursor-pointer"
                >
                  {language === 'so' ? 'Halkan ka gal' : 'Log in here'}
                </button>
              </div>
            </form>
          )}

          {/* 3. FORGOT PASSWORD */}
          {mode === 'forgot' && !currentUser && (
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <p className="text-xs text-gray-600 leading-relaxed">
                {language === 'so'
                  ? 'Geli iimaylkaaga si aad dib ugu dejiso furahaaga sirta ah adigoon dhib la kulmin.'
                  : 'Enter your email address to recover and reset your password.'}
              </p>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  {language === 'so' ? 'Cinwaanka Iimaylka' : 'Email Address'} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full bg-white border border-gray-300 rounded-xl pl-9 pr-3.5 py-2.5 text-base sm:text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
                  />
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:opacity-50 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-98"
              >
                {loading ? <RotateCw className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                <span>{language === 'so' ? 'Diyaari Dib-u-dejinta' : 'Continue Password Reset'}</span>
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-xs text-gray-500 hover:text-gray-900 font-semibold cursor-pointer"
                >
                  ← {language === 'so' ? 'Ku noqo Gelitaanka' : 'Back to Login'}
                </button>
              </div>
            </form>
          )}

          {/* 4. RESET PASSWORD WITH TOKEN */}
          {mode === 'reset' && (
            <form onSubmit={handleResetSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  {language === 'so' ? 'Furaha Cusub' : 'New Password'} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white border border-gray-300 rounded-xl pl-9 pr-3.5 py-2.5 text-base sm:text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
                  />
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-98"
              >
                {loading ? <RotateCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>{language === 'so' ? 'Keydi Furaha Cusub' : 'Save New Password'}</span>
              </button>
            </form>
          )}

          {/* 5. LOGGED-IN CUSTOMER PROFILE */}
          {mode === 'profile' && currentUser && (
            <div className="space-y-4">
              {/* PEP REWARDS INTERNAL CURRENCY CARD */}
              <div className="p-4 rounded-2xl bg-white border-2 border-red-200 shadow-sm space-y-3.5 relative overflow-hidden">
                {/* Header badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center font-black text-xs tracking-wider shadow-xs">
                      PEP
                    </div>
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-gray-900">
                        {language === 'so' ? 'Haraaga PEP (Rewards)' : 'PEP Rewards Balance'}
                      </h3>
                      <span className="text-[10px] text-gray-500 font-medium">
                        {language === 'so' ? 'Lacagta abaal-marinta gudaha ee SomTopUp' : 'Internal rewards currency'}
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-50 text-red-700 border border-red-200">
                    {pepData?.progressPercentage ?? 0}%
                  </span>
                </div>

                {/* Current Balance vs Target Amount */}
                <div className="flex items-baseline justify-between pt-1">
                  <div>
                    <span className="text-[11px] text-gray-500 block">
                      {language === 'so' ? 'Haraagaaga Joogtada ah' : 'Current Balance'}
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-black text-red-600 tracking-tight tabular-nums">
                        {(pepData?.pepBalance ?? currentUser.pepBalance ?? 0).toLocaleString()}
                      </span>
                      <span className="text-xs font-bold text-gray-700">PEP</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] text-gray-500 block">
                      {language === 'so' ? 'Bartilmaameedka Abaal-marinta' : 'Reward Target'}
                    </span>
                    <span className="text-sm font-extrabold text-gray-800 tabular-nums">
                      {(pepData?.targetPep ?? 1000).toLocaleString()} PEP
                    </span>
                  </div>
                </div>

                {/* Clean Red-and-White Progress Bar with Red Fill from Left to Right */}
                <div className="space-y-1.5 pt-0.5">
                  <div className="w-full h-3 bg-red-50 rounded-full border border-red-200 overflow-hidden p-0.5">
                    <div
                      className="h-full bg-red-600 rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${Math.min(100, Math.max(0, pepData?.progressPercentage ?? 0))}%`,
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-gray-500 font-semibold px-0.5">
                    <span>0 PEP</span>
                    <span className="text-red-700 font-bold">
                      {pepData?.progressPercentage ?? 0}% {language === 'so' ? 'dhameystiran' : 'progress'}
                    </span>
                    <span>{(pepData?.targetPep ?? 1000).toLocaleString()} PEP</span>
                  </div>
                </div>

                {/* Clear explanation without claiming cash value */}
                <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-[11px] text-gray-600 leading-relaxed">
                  <p>
                    {language === 'so'
                      ? 'Ku kasbo dhibcaha PEP dalab kasta oo PUBG Mobile ah oo la xaqiijiyo. Markaad gaarto bartilmaameedka PEP, waxaad furan kartaa abaal-marinnada gaarka ah.'
                      : 'Earn PEP on every verified PUBG Mobile order. Progress toward the reward target to unlock benefits.'}
                  </p>
                </div>

                {/* Transaction Ledger Accordion */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowPepLedger(!showPepLedger)}
                    className="w-full flex items-center justify-between py-1.5 px-2 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5 text-gray-800">
                      <History className="w-3.5 h-3.5 text-red-600" />
                      <span>{language === 'so' ? 'Diiwaanka Dhaqdhaqaaqa PEP (Ledger)' : 'PEP Transaction Ledger'}</span>
                    </span>
                    {showPepLedger ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {showPepLedger && (
                    <div className="mt-2 space-y-2 max-h-44 overflow-y-auto pr-1 text-xs animate-fadeIn">
                      {pepData?.ledger && pepData.ledger.length > 0 ? (
                        pepData.ledger.map((entry) => (
                          <div
                            key={entry.id}
                            className="p-2.5 rounded-xl border border-gray-200 bg-gray-50/70 flex items-center justify-between gap-2"
                          >
                            <div className="space-y-0.5">
                              <p className="font-bold text-gray-800 text-[11px]">{entry.description}</p>
                              <span className="text-[10px] text-gray-400 block">
                                {new Date(entry.createdAt).toLocaleDateString()} {new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <span
                              className={`font-black text-xs px-2 py-0.5 rounded-md shrink-0 ${
                                entry.amount > 0
                                  ? 'bg-green-100 text-green-800 border border-green-200'
                                  : 'bg-red-100 text-red-800 border border-red-200'
                              }`}
                            >
                              {entry.amount > 0 ? `+${entry.amount}` : entry.amount} PEP
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="p-3 text-center text-[11px] text-gray-400 border border-dashed border-gray-200 rounded-xl">
                          {language === 'so'
                            ? 'Weli wax dhaqdhaqaaq PEP ah ma jiraan. Ku shubo PUBG Mobile si aad u kasbato.'
                            : 'No PEP transactions recorded yet. Complete PUBG Mobile orders to earn PEP.'}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Profile Card */}
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-gray-500 font-medium">Iimaylka Koontada:</span>
                    <p className="text-sm font-black text-gray-900 font-mono">{currentUser.email}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-800 border border-green-200">
                    Active
                  </span>
                </div>

                <div className="pt-2 border-t border-gray-200/60 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[11px] text-gray-500 block">Magaca:</span>
                    <span className="font-bold text-gray-800">{currentUser.name || 'Macmiil'}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-gray-500 block">Default PUBG ID:</span>
                    <span className="font-mono font-bold text-gray-800">{currentUser.defaultPlayerId || 'Lama gelin'}</span>
                  </div>
                </div>
              </div>

              {/* Edit Profile Form */}
              <form onSubmit={handleUpdateProfile} className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {language === 'so' ? 'Beddel Magaca' : 'Edit Display Name'}
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Magacaaga"
                    className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-base sm:text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {language === 'so' ? 'PUBG Player ID-gaaga Joogtada ah' : 'Default PUBG Player ID'}
                  </label>
                  <input
                    type="text"
                    value={defaultPlayerId}
                    onChange={(e) => setDefaultPlayerId(e.target.value)}
                    placeholder="5123984521"
                    className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-base sm:text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 font-mono transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 font-bold text-xs transition-colors cursor-pointer"
                >
                  {loading ? (language === 'so' ? 'Waa la keydinayaa...' : 'Saving...') : (language === 'so' ? 'Keydi Isbeddelada' : 'Update Profile')}
                </button>
              </form>

              {/* Action Buttons: View Orders & Logout */}
              <div className="pt-2 border-t border-gray-200 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onNavigateToOrders) onNavigateToOrders();
                  }}
                  className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-98"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{language === 'so' ? 'Eeg Dhammaan Dalabyadayda PUBG' : 'View My PUBG Orders'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{language === 'so' ? 'Ka Bax Koontada (Logout)' : 'Sign Out'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
