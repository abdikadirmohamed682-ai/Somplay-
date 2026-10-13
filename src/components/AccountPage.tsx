import React, { useState, useEffect } from 'react';
import { UserProfile, PublicOrderSummary, PepAccountSummary } from '../types';
import {
  getCurrentCustomer,
  updateCustomerProfile,
  changeCustomerPassword,
  clearCustomerSession,
  loginCustomer,
  registerCustomer,
  fetchCustomerProfile,
} from '../services/customerAuth';
import pubgBanner from '../assets/images/banner_pubg_special_1791667447343.jpg';
import pubgIcon from '../assets/images/game_pubg_mobile_1791667426125.jpg';
import { useLanguage } from '../services/language.tsx';
import {
  User,
  ShoppingBag,
  Award,
  Settings,
  ShieldCheck,
  ChevronRight,
  Edit3,
  CheckCircle2,
  AlertCircle,
  RotateCw,
  LogOut,
  Mail,
  Gamepad2,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  KeyRound,
  History,
  Check,
} from 'lucide-react';

interface AccountPageProps {
  onBack: () => void;
  onNavigateToOrders: () => void;
  onNavigateHome: () => void;
}

type AccountNavSection = 'overview' | 'orders' | 'pep-history' | 'profile-settings' | 'security';

export const AccountPage: React.FC<AccountPageProps> = ({
  onBack,
  onNavigateToOrders,
  onNavigateHome,
}) => {
  const { language } = useLanguage();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => getCurrentCustomer());
  const [activeSection, setActiveSection] = useState<AccountNavSection>('overview');

  // PEP & Activity Metrics State
  const [pepData, setPepData] = useState<PepAccountSummary | null>(null);
  const [completedOrdersCount, setCompletedOrdersCount] = useState<number>(0);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState<boolean>(true);

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [editName, setEditName] = useState<string>('');
  const [editPlayerId, setEditPlayerId] = useState<string>('');
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);
  const [profileFeedback, setProfileFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Security / Password State
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [isSavingPassword, setIsSavingPassword] = useState<boolean>(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);

  // Guest Auth State (if not signed in)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [regName, setRegName] = useState<string>('');
  const [regPlayerId, setRegPlayerId] = useState<string>('');
  const [isAuthSubmitting, setIsAuthSubmitting] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string>('');
  const [authSuccess, setAuthSuccess] = useState<string>('');

  // Initial Data Fetch
  const loadAccountData = async () => {
    setIsLoadingMetrics(true);
    const profile = await fetchCustomerProfile();
    if (profile) {
      setCurrentUser(profile);
      setEditName(profile.name || '');
      setEditPlayerId(profile.defaultPlayerId || '');

      // Fetch PEP summary & ledger
      try {
        const token = localStorage.getItem('somtopup_customer_token');
        if (token) {
          const pepRes = await fetch('/api/customer/pep', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (pepRes.ok) {
            const data = await pepRes.json();
            if (data.success) {
              setPepData({
                pepBalance: data.pepBalance,
                targetPep: data.targetPep,
                progressPercentage: data.progressPercentage,
                conversionRatePerUsd: data.conversionRatePerUsd,
                earningRatePerUsd: data.earningRatePerUsd,
                ledger: data.ledger || [],
              });
            }
          }

          // Fetch orders to compute real completed order count
          const ordRes = await fetch('/api/customer/orders', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (ordRes.ok) {
            const ordData = await ordRes.json();
            if (ordData.success && Array.isArray(ordData.orders)) {
              const completed = (ordData.orders as PublicOrderSummary[]).filter(
                (o) => o.status === 'Waa la dhammaystiray'
              );
              setCompletedOrdersCount(completed.length);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load customer metrics:', err);
      }
    }
    setIsLoadingMetrics(false);
  };

  useEffect(() => {
    loadAccountData();

    const handleAuthChange = () => {
      const updated = getCurrentCustomer();
      setCurrentUser(updated);
      if (updated) {
        setEditName(updated.name || '');
        setEditPlayerId(updated.defaultPlayerId || '');
      }
    };

    window.addEventListener('somtopup_customer_auth_change', handleAuthChange);
    return () => {
      window.removeEventListener('somtopup_customer_auth_change', handleAuthChange);
    };
  }, []);

  // Handle Profile Update
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileFeedback(null);
    setIsSavingProfile(true);

    const cleanName = editName.trim();
    const cleanPlayerId = editPlayerId.trim();

    if (cleanPlayerId && !/^\d{5,15}$/.test(cleanPlayerId)) {
      setProfileFeedback({
        type: 'error',
        message: language === 'so'
          ? 'Player ID waa inuu ka koobnaadaa 5 ilaa 15 tiro.'
          : 'Player ID must be between 5 and 15 digits.',
      });
      setIsSavingProfile(false);
      return;
    }

    const success = await updateCustomerProfile(cleanName, cleanPlayerId || undefined);
    setIsSavingProfile(false);

    if (success) {
      setProfileFeedback({
        type: 'success',
        message: language === 'so' ? 'Xogta akoonka si guul leh ayaa loo keydiyay!' : 'Profile updated successfully!',
      });
      setIsEditingProfile(false);
      await loadAccountData();
      setTimeout(() => setProfileFeedback(null), 3500);
    } else {
      setProfileFeedback({
        type: 'error',
        message: language === 'so' ? 'Ma suuragelin in la keydiyo isbeddelada.' : 'Could not save profile changes.',
      });
    }
  };

  // Handle Password Update
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFeedback(null);

    if (!newPassword || newPassword.length < 6) {
      setPasswordFeedback({
        type: 'error',
        message: language === 'so' ? 'Furaha cusub waa inuu ka koobnaadaa ugu yaraan 6 xaraf.' : 'New password must be at least 6 characters.',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordFeedback({
        type: 'error',
        message: language === 'so' ? 'Labada fure isma leha.' : 'Passwords do not match.',
      });
      return;
    }

    setIsSavingPassword(true);
    const res = await changeCustomerPassword(newPassword, currentPassword || undefined);
    setIsSavingPassword(false);

    if (res.success) {
      setPasswordFeedback({
        type: 'success',
        message: language === 'so' ? 'Furahaaga sirta ah si guul leh ayaa loo beddelay!' : 'Password updated successfully!',
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordFeedback(null), 4000);
    } else {
      setPasswordFeedback({
        type: 'error',
        message: res.error || (language === 'so' ? 'Khalad ayaa dhacay.' : 'Failed to update password.'),
      });
    }
  };

  // Handle Logout
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
    onNavigateHome();
  };

  // Guest Sign-in / Register Handler
  const handleGuestAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    const cleanEmail = loginEmail.trim();
    if (!cleanEmail) {
      setAuthError(language === 'so' ? 'Fadlan geli cinwaan iimayl sax ah.' : 'Please enter a valid email address.');
      return;
    }
    if (!loginPassword || loginPassword.length < 6) {
      setAuthError(language === 'so' ? 'Furaha sirta ah waa inuu ugu yaraan ka koobnaadaa 6 xaraf.' : 'Password must be at least 6 characters.');
      return;
    }

    setIsAuthSubmitting(true);
    let res;
    if (authMode === 'login') {
      res = await loginCustomer(cleanEmail, loginPassword);
    } else {
      res = await registerCustomer(cleanEmail, loginPassword, regName.trim() || undefined, regPlayerId.trim() || undefined);
    }
    setIsAuthSubmitting(false);

    if (res.success && res.user) {
      setCurrentUser(res.user);
      setAuthSuccess(language === 'so' ? 'Si guul leh ayaad u soo gashay!' : 'Signed in successfully!');
      await loadAccountData();
    } else {
      setAuthError(res.error || (language === 'so' ? 'Khalad ayaa dhacay.' : 'Authentication failed.'));
    }
  };

  // Compute user initial for the large circular red avatar
  const userInitial = currentUser?.email
    ? currentUser.email.trim().charAt(0).toUpperCase()
    : 'U';

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 sm:space-y-6 animate-fadeIn pb-16 px-3 sm:px-0">
      {/* Back to Home / Storefront navigation bar */}
      <div className="flex items-center justify-between py-1">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs sm:text-sm font-semibold text-gray-700 transition-colors cursor-pointer shadow-xs"
        >
          <ArrowLeft className="w-4 h-4 text-red-600" />
          <span>{language === 'so' ? 'Bogga Hore' : 'Home'}</span>
        </button>

        <span className="text-[11px] font-bold uppercase tracking-wider text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-md">
          SOMPLAY Account
        </span>
      </div>

      {/* SECTION A: PUBG HEADER BANNER */}
      <div className="relative w-full rounded-2xl overflow-hidden bg-gradient-to-r from-red-800 via-red-600 to-red-700 shadow-md border border-red-500/20">
        {/* Real PUBG Artwork Background */}
        <div className="absolute inset-0 z-0">
          <img
            src={pubgBanner}
            alt="PUBG Mobile Header"
            className="w-full h-full object-cover object-center opacity-30 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-red-950/80 via-red-800/60 to-red-600/50" />
        </div>

        {/* Content Overlay with White Typography & PUBG Mobile Badge */}
        <div className="relative z-10 p-4 sm:p-5 flex items-center justify-between gap-3 min-h-[110px] sm:min-h-[130px]">
          <div className="space-y-1 text-white max-w-[70%]">
            <div className="flex items-center gap-2">
              <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-black/30 backdrop-blur-xs text-red-200 border border-white/20">
                PUBG MOBILE
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white drop-shadow-xs">
              Account
            </h1>
            <p className="text-xs text-red-100 font-medium line-clamp-1 sm:line-clamp-none">
              Manage your profile, PUBG Player ID, and PEP rewards
            </p>
          </div>

          {/* Real PUBG Logo Icon on the right */}
          <div className="shrink-0 flex items-center justify-center p-1.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/25 shadow-sm">
            <img
              src={pubgIcon}
              alt="PUBG Mobile Logo"
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover shadow-xs border border-white/20"
            />
          </div>
        </div>
      </div>

      {/* IF GUEST (NOT SIGNED IN): DISPLAY RESPONSIVE AUTHENTICATION CARD */}
      {!currentUser ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6 space-y-4">
          <div className="text-center space-y-1">
            <div className="w-12 h-12 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-red-600 mx-auto font-black text-lg">
              <User className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-base sm:text-lg font-black text-gray-900">
              {authMode === 'login' ? 'Customer Sign In' : 'Create an Account'}
            </h2>
            <p className="text-xs text-gray-500">
              Sign in to view your real account profile, PUBG Player ID, and PEP rewards.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex rounded-xl bg-gray-100 p-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setAuthError('');
              }}
              className={`flex-1 py-2 text-center rounded-lg transition-all cursor-pointer ${
                authMode === 'login' ? 'bg-white text-red-600 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setAuthError('');
              }}
              className={`flex-1 py-2 text-center rounded-lg transition-all cursor-pointer ${
                authMode === 'register' ? 'bg-white text-red-600 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Register (Instant)
            </button>
          </div>

          {authError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          {authSuccess && (
            <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-xs text-green-700 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
              <span>{authSuccess}</span>
            </div>
          )}

          <form onSubmit={handleGuestAuthSubmit} className="space-y-3.5">
            {authMode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Full Name (Optional)</label>
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Your Name"
                    className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Default PUBG Player ID (Optional)</label>
                  <input
                    type="text"
                    value={regPlayerId}
                    onChange={(e) => setRegPlayerId(e.target.value)}
                    placeholder="e.g. 5123456789"
                    className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 font-mono focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full bg-white border border-gray-300 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
                />
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  minLength={6}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white border border-gray-300 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
                />
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isAuthSubmitting}
              className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:opacity-50 text-white font-bold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-98"
            >
              {isAuthSubmitting ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>{authMode === 'login' ? 'Sign In' : 'Create Account'}</span>
              )}
            </button>
          </form>
        </div>
      ) : (
        /* SIGNED-IN MOBILE ACCOUNT SECTIONS: B, C, D, E */
        <div className="space-y-4">
          {/* SECTION B: CUSTOMER PROFILE CARD */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-xs relative">
            <div className="flex items-center gap-3.5">
              {/* Large circular red avatar containing uppercase first letter of email */}
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-red-600 to-red-700 text-white flex items-center justify-center font-black text-2xl sm:text-3xl shadow-sm border-2 border-white ring-2 ring-red-100 shrink-0 select-none">
                {userInitial}
              </div>

              {/* Real customer details */}
              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black text-gray-900 truncate">
                    {currentUser.name || 'Gamer'}
                  </h2>
                  <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-green-50 text-green-700 border border-green-200 shrink-0">
                    Active
                  </span>
                </div>

                <p className="text-xs text-gray-600 truncate font-mono">
                  {currentUser.email}
                </p>

                {/* Saved PUBG Player ID badge */}
                <div className="pt-1 flex items-center gap-1.5 text-xs">
                  <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">
                    Player ID:
                  </span>
                  <span className="font-mono font-bold text-gray-900 bg-gray-50 px-2 py-0.5 rounded border border-gray-200 text-[11px]">
                    {currentUser.defaultPlayerId || 'Not set'}
                  </span>
                </div>
              </div>

              {/* Edit Profile Action Button */}
              <button
                type="button"
                onClick={() => {
                  setIsEditingProfile(true);
                  setActiveSection('profile-settings');
                  const target = document.getElementById('profile-edit-section');
                  if (target) target.scrollIntoView({ behavior: 'smooth' });
                }}
                className="shrink-0 p-2 sm:px-3 sm:py-1.5 rounded-xl border border-gray-200 hover:border-red-300 bg-white hover:bg-red-50 text-gray-700 hover:text-red-700 text-xs font-bold transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5"
                title="Edit Profile"
              >
                <Edit3 className="w-3.5 h-3.5 text-red-600" />
                <span className="hidden sm:inline">Edit Profile</span>
              </button>
            </div>
          </div>

          {/* SECTION C: PEP BALANCE AND ACTIVITY SUMMARY */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-red-600 text-white flex items-center justify-center font-black text-xs shadow-2xs">
                  PEP
                </div>
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-gray-900">
                  PEP Balance & Activity
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-50 text-red-700 border border-red-200">
                {pepData?.progressPercentage ?? 0}% Target
              </span>
            </div>

            {/* Metrics Grid: Real PEP Balance, Real Completed Top-Ups, Target */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {/* Metric 1: Current PEP Balance */}
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-0.5">
                <span className="text-[10px] sm:text-[11px] font-semibold text-gray-500 block uppercase tracking-wider">
                  PEP Balance
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl sm:text-2xl font-black text-red-600 tabular-nums">
                    {(pepData?.pepBalance ?? currentUser.pepBalance ?? 0).toLocaleString()}
                  </span>
                  <span className="text-[10px] font-bold text-gray-600">PEP</span>
                </div>
              </div>

              {/* Metric 2: Completed Top-Ups (Real from Order Records) */}
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-0.5">
                <span className="text-[10px] sm:text-[11px] font-semibold text-gray-500 block uppercase tracking-wider">
                  Completed Top-Ups
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl sm:text-2xl font-black text-gray-900 tabular-nums">
                    {completedOrdersCount}
                  </span>
                  <span className="text-[10px] font-bold text-gray-600">Orders</span>
                </div>
              </div>

              {/* Metric 3: Configured Reward Target Equivalent */}
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-0.5 col-span-2 sm:col-span-1">
                <span className="text-[10px] sm:text-[11px] font-semibold text-gray-500 block uppercase tracking-wider">
                  $10 Reward Target
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl sm:text-2xl font-black text-gray-800 tabular-nums">
                    {(pepData?.targetPep ?? 1000).toLocaleString()}
                  </span>
                  <span className="text-[10px] font-bold text-gray-600">PEP</span>
                </div>
              </div>
            </div>

            {/* Clean Red-and-White Progress Bar with Red Fill from Left to Right */}
            <div className="space-y-1 pt-1">
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
                  {pepData?.progressPercentage ?? 0}% completed
                </span>
                <span>{(pepData?.targetPep ?? 1000).toLocaleString()} PEP</span>
              </div>
            </div>
          </div>

          {/* SECTION D: ACCOUNT NAVIGATION (Vertical list of compact rows) */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Account Navigation
              </h3>
            </div>

            <div className="divide-y divide-gray-100">
              {/* Row 1: Overview */}
              <button
                type="button"
                onClick={() => setActiveSection('overview')}
                className={`w-full p-3.5 flex items-center justify-between text-left transition-colors cursor-pointer ${
                  activeSection === 'overview' ? 'bg-red-50/60' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-100/70 text-red-600 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">Overview</span>
                    <span className="text-[10px] text-gray-500">Profile summary and active status</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>

              {/* Row 2: My Orders (Opens separate My Orders destination) */}
              <button
                type="button"
                onClick={onNavigateToOrders}
                className="w-full p-3.5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-100/70 text-red-600 flex items-center justify-center shrink-0">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">My Orders</span>
                    <span className="text-[10px] text-gray-500">Track and view your PUBG top-up orders</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>

              {/* Row 3: PEP History */}
              <button
                type="button"
                onClick={() => setActiveSection('pep-history')}
                className={`w-full p-3.5 flex items-center justify-between text-left transition-colors cursor-pointer ${
                  activeSection === 'pep-history' ? 'bg-red-50/60' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-100/70 text-red-600 flex items-center justify-center shrink-0">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">PEP History</span>
                    <span className="text-[10px] text-gray-500">Earned and adjusted PEP transaction ledger</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>

              {/* Row 4: Profile Settings */}
              <button
                type="button"
                onClick={() => {
                  setActiveSection('profile-settings');
                  setIsEditingProfile(true);
                }}
                className={`w-full p-3.5 flex items-center justify-between text-left transition-colors cursor-pointer ${
                  activeSection === 'profile-settings' ? 'bg-red-50/60' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-100/70 text-red-600 flex items-center justify-center shrink-0">
                    <Settings className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">Profile Settings</span>
                    <span className="text-[10px] text-gray-500">Update name and saved PUBG Player ID</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>

              {/* Row 5: Security */}
              <button
                type="button"
                onClick={() => setActiveSection('security')}
                className={`w-full p-3.5 flex items-center justify-between text-left transition-colors cursor-pointer ${
                  activeSection === 'security' ? 'bg-red-50/60' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-100/70 text-red-600 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">Security</span>
                    <span className="text-[10px] text-gray-500">Change your password and account credentials</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>

          {/* ACTIVE SECTION DETAILS */}

          {/* SECTION E: PROFILE EDITING */}
          {activeSection === 'profile-settings' && (
            <div id="profile-edit-section" className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-xs space-y-4 animate-fadeIn">
              <div className="border-b border-gray-100 pb-2.5 flex items-center justify-between">
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-gray-900 flex items-center gap-1.5">
                    <Edit3 className="w-4 h-4 text-red-600" />
                    <span>Profile Settings</span>
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Update your account display name and default PUBG Player ID
                  </p>
                </div>
                <span className="text-[10px] font-bold text-gray-400 font-mono">
                  {currentUser.email}
                </span>
              </div>

              {profileFeedback && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                    profileFeedback.type === 'success'
                      ? 'bg-green-50 border-green-200 text-green-800'
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}
                >
                  {profileFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  )}
                  <span>{profileFeedback.message}</span>
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">
                    Display Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="e.g. Ahmed"
                      className="w-full bg-white border border-gray-300 rounded-xl pl-9 pr-3.5 py-2 text-xs text-gray-900 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
                    />
                    <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">
                    Saved PUBG Player ID
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={editPlayerId}
                      onChange={(e) => setEditPlayerId(e.target.value)}
                      placeholder="e.g. 5123984521"
                      className="w-full bg-white border border-gray-300 rounded-xl pl-9 pr-3.5 py-2 text-xs text-gray-900 font-mono focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
                    />
                    <Gamepad2 className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1 block">
                    Auto-fills during PUBG UC checkout. Changing this does not affect previous completed orders.
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditName(currentUser.name || '');
                      setEditPlayerId(currentUser.defaultPlayerId || '');
                      setIsEditingProfile(false);
                      setActiveSection('overview');
                    }}
                    className="flex-1 py-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-bold text-xs cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {isSavingProfile ? (
                      <>
                        <RotateCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* PEP HISTORY SECTION */}
          {activeSection === 'pep-history' && (
            <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-xs space-y-3.5 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-red-600" />
                  <h3 className="text-xs sm:text-sm font-black text-gray-900">
                    PEP Transaction Ledger
                  </h3>
                </div>
                <span className="text-xs font-black text-red-600">
                  Total: {(pepData?.pepBalance ?? currentUser.pepBalance ?? 0).toLocaleString()} PEP
                </span>
              </div>

              {pepData?.ledger && pepData.ledger.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {pepData.ledger.map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-xl border border-gray-200 bg-gray-50/70 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="space-y-0.5">
                        <p className="font-bold text-gray-800 text-[11px]">{item.description}</p>
                        <span className="text-[10px] text-gray-400 block">
                          {new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <span
                        className={`font-black text-xs px-2 py-0.5 rounded-md shrink-0 tabular-nums ${
                          item.amount > 0
                            ? 'bg-green-100 text-green-800 border border-green-200'
                            : 'bg-red-100 text-red-800 border border-red-200'
                        }`}
                      >
                        {item.amount > 0 ? `+${item.amount}` : item.amount} PEP
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-gray-400 border border-dashed border-gray-200 rounded-xl space-y-1">
                  <p className="font-semibold text-gray-600">No PEP transactions yet</p>
                  <p className="text-[11px]">Complete verified PUBG Mobile orders to earn PEP rewards.</p>
                </div>
              )}

              <button
                type="button"
                onClick={() => setActiveSection('overview')}
                className="w-full py-2 rounded-xl border border-gray-200 text-gray-600 font-bold text-xs hover:bg-gray-50 transition-colors"
              >
                Close PEP History
              </button>
            </div>
          )}

          {/* SECURITY / CHANGE PASSWORD SECTION */}
          {activeSection === 'security' && (
            <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-xs space-y-4 animate-fadeIn">
              <div className="border-b border-gray-100 pb-2.5">
                <h3 className="text-xs sm:text-sm font-black text-gray-900 flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-red-600" />
                  <span>Security & Password</span>
                </h3>
                <p className="text-[11px] text-gray-500">
                  Update your login credentials securely
                </p>
              </div>

              {passwordFeedback && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                    passwordFeedback.type === 'success'
                      ? 'bg-green-50 border-green-200 text-green-800'
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}
                >
                  {passwordFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  )}
                  <span>{passwordFeedback.message}</span>
                </div>
              )}

              <form onSubmit={handleSavePassword} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">
                    Current Password (Optional if forgotten)
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white border border-gray-300 rounded-xl pl-9 pr-9 py-2 text-xs text-gray-900 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
                    />
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">
                    New Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="min. 6 characters"
                      className="w-full bg-white border border-gray-300 rounded-xl pl-9 pr-9 py-2 text-xs text-gray-900 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
                    />
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">
                    Confirm New Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white border border-gray-300 rounded-xl pl-9 pr-3.5 py-2 text-xs text-gray-900 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
                    />
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                      setActiveSection('overview');
                    }}
                    className="flex-1 py-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-bold text-xs cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingPassword}
                    className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {isSavingPassword ? (
                      <>
                        <RotateCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Sign Out Card */}
          <div className="pt-2 flex justify-center">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full py-3 rounded-xl border border-red-200 bg-white hover:bg-red-50 text-red-600 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-2xs active:scale-98"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
