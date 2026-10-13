import React, { useState, useEffect, useCallback } from 'react';
import { GameType, OrderStatus, PublicOrderSummary } from '../types';
import { getGuestSessionId, getSessionOrderIds, addSessionOrderId } from '../services/storage';
import pubgBanner from '../assets/images/banner_pubg_special_1791667447343.jpg';
import pubgIcon from '../assets/images/game_pubg_mobile_1791667426125.jpg';
import efbIcon from '../assets/images/game_efootball_coins_1791667436245.jpg';
import { useLanguage } from '../services/language.tsx';
import {
  ArrowLeft,
  ShoppingBag,
  RotateCw,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  CreditCard,
  Copy,
  Check,
  ShieldCheck,
  MessageCircle,
  XCircle,
  Phone,
  Eye,
  X,
  Filter,
} from 'lucide-react';

interface MyOrdersPageProps {
  onBack: () => void;
  onSelectGame: (game: 'PUBG Mobile') => void;
  onResumeOrder?: (order: PublicOrderSummary) => void;
}

export const MyOrdersPage: React.FC<MyOrdersPageProps> = ({
  onBack,
  onSelectGame,
  onResumeOrder,
}) => {
  const { language, t } = useLanguage();

  // Session orders state
  const [sessionOrders, setSessionOrders] = useState<PublicOrderSummary[]>([]);
  const [isLoadingSession, setIsLoadingSession] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Lookup form state (for returning customers)
  const [lookupGame, setLookupGame] = useState<GameType>('PUBG Mobile');
  const [identifierInput, setIdentifierInput] = useState<string>('');
  const [lookupError, setLookupError] = useState<string>('');
  const [isLookingUp, setIsLookingUp] = useState<boolean>(false);
  const [lookedUpOrders, setLookedUpOrders] = useState<PublicOrderSummary[] | null>(null);
  const [lookupPerformed, setLookupPerformed] = useState<boolean>(false);
  const [showLookupForm, setShowLookupForm] = useState<boolean>(false);

  // Copied order ID indicator
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Cancelling an unpaid order state
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Authenticated customer PEP rewards summary state
  const [customerPep, setCustomerPep] = useState<{
    pepBalance: number;
    targetPep: number;
    progressPercentage: number;
  } | null>(null);

  // Status Filter State
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Processing' | 'Completed' | 'Failed' | 'Cancelled'>('All');
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<PublicOrderSummary | null>(null);

  const handleCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // 1. Same-session and authenticated customer order loading
  const fetchSessionOrders = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else setIsLoadingSession(true);

    try {
      const guestSessionId = getGuestSessionId();
      const orderIds = getSessionOrderIds();
      const customerToken = localStorage.getItem('somtopup_customer_token');

      const allFetched: PublicOrderSummary[] = [];

      // Fetch customer account orders if logged in
      if (customerToken) {
        try {
          const authRes = await fetch('/api/customer/orders', {
            headers: { Authorization: `Bearer ${customerToken}` },
          });
          if (authRes.ok) {
            const authData = await authRes.json();
            if (authData.success && Array.isArray(authData.orders)) {
              allFetched.push(...authData.orders);
            }
          }

          // Also fetch PEP rewards progress
          const pepRes = await fetch('/api/customer/pep', {
            headers: { Authorization: `Bearer ${customerToken}` },
          });
          if (pepRes.ok) {
            const pepData = await pepRes.json();
            if (pepData.success) {
              setCustomerPep({
                pepBalance: pepData.pepBalance,
                targetPep: pepData.targetPep,
                progressPercentage: pepData.progressPercentage,
              });
            }
          }
        } catch (e) {}
      }

      // Also fetch session orders
      const params = new URLSearchParams();
      if (guestSessionId) params.set('guestSessionId', guestSessionId);
      if (orderIds.length > 0) params.set('orderIds', orderIds.join(','));

      const response = await fetch(`/api/orders/session?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.orders)) {
          allFetched.push(...data.orders);
        }
      }

      // De-duplicate orders by ID
      const orderMap = new Map<string, PublicOrderSummary>();
      allFetched.forEach((o) => {
        if (o.id) orderMap.set(o.id.toUpperCase(), o);
      });
      setSessionOrders(Array.from(orderMap.values()));
    } catch (err) {
      console.error('Error fetching session orders:', err);
    } finally {
      setIsLoadingSession(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSessionOrders();
  }, [fetchSessionOrders]);

  // 2. Returning customers: Identifier lookup handler
  const handleLookupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError('');
    setLookedUpOrders(null);
    setLookupPerformed(false);

    const cleanInput = identifierInput.trim();
    if (!cleanInput) {
      setLookupError(
        language === 'so'
          ? 'Fadlan geli Player ID-gaaga PUBG Mobile ama Order ID.'
          : 'Please enter your PUBG Player ID or Order ID.'
      );
      return;
    }

    setIsLookingUp(true);

    try {
      const response = await fetch('/api/orders/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game: lookupGame,
          identifier: cleanInput,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setLookupError(data.error || (language === 'so' ? 'Khalad ayaa dhacay xilliga baarista.' : 'Error during lookup.'));
        setIsLookingUp(false);
        return;
      }

      const orders: PublicOrderSummary[] = data.orders || [];
      setLookedUpOrders(orders);
      setLookupPerformed(true);

      if (orders.length > 0) {
        orders.forEach((o) => addSessionOrderId(o.id));
      }
    } catch (err) {
      console.error('Lookup error:', err);
      setLookupError(language === 'so' ? 'Khalad xagga xiriirka ah ayaa dhacay.' : 'Network connection error.');
    } finally {
      setIsLookingUp(false);
    }
  };

  // 3. Cancel Unpaid Order Handler
  const handleCancelOrder = async (orderId: string) => {
    if (!confirm(language === 'so' ? 'Ma hubtaa inaad kansasho dalabkan aan weli la bixin?' : 'Are you sure you want to cancel this unpaid order?')) {
      return;
    }

    setCancellingId(orderId);
    try {
      const response = await fetch(`/api/orders/${orderId}/cancel`, {
        method: 'POST',
      });
      const data = await response.json();
      if (response.ok && data.success) {
        fetchSessionOrders(true);
        if (lookedUpOrders) {
          setLookedUpOrders((prev) =>
            prev ? prev.map((o) => (o.id === orderId ? { ...o, status: 'Waa la kansalay' } : o)) : null
          );
        }
      } else {
        alert(data.error || 'Could not cancel order.');
      }
    } catch (err) {
      console.error('Cancel order error:', err);
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'Sugaya Lacag-bixin':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
          icon: <CreditCard className="w-3.5 h-3.5 text-amber-600 shrink-0" />,
          label: language === 'so' ? 'Sugaya Lacag-bixin (Unpaid)' : 'Awaiting Payment (Unpaid)',
          hint: language === 'so' ? 'Dalabka waa la abuuray, waxaad sii wadi kartaa bixinta lacagta.' : 'Order saved. You can resume and complete payment.',
        };
      case 'Sugaya Hubin':
        return {
          bg: 'bg-blue-50 text-blue-800 border-blue-200',
          icon: <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />,
          label: language === 'so' ? 'Sugaya Hubin (Payment Verification Pending)' : 'Payment Verification Pending',
          hint: language === 'so' ? 'Xogta lacagta waxay ku jirtaa safka hubinta maamulka.' : 'Payment submitted. In admin verification queue.',
        };
      case 'Waa la shaqaynayaa':
        return {
          bg: 'bg-purple-50 text-purple-800 border-purple-200',
          icon: <RotateCw className="w-3.5 h-3.5 text-purple-600 animate-spin shrink-0" />,
          label: language === 'so' ? 'Waa la shaqaynayaa (Processing)' : 'Processing',
          hint: language === 'so' ? 'Lacagta waa la xaqiijiyay, waxaana socota shubista PUBG UC.' : 'Payment confirmed. UC delivery in progress.',
        };
      case 'Waa la dhammaystiray':
        return {
          bg: 'bg-green-50 text-green-800 border-green-200',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />,
          label: language === 'so' ? 'Waa la dhammaystiray (Completed)' : 'Completed',
          hint: language === 'so' ? 'Dalabkaaga si guul leh ayaa loogu shubay koontadaada PUBG.' : 'Top-up successfully fulfilled and credited.',
        };
      case 'Wuu fashilmay':
        return {
          bg: 'bg-red-50 text-red-800 border-red-200',
          icon: <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />,
          label: language === 'so' ? 'Wuu fashilmay (Failed)' : 'Verification Failed',
          hint: language === 'so' ? 'Xaqiijinta lacagta way fashilantay. Waad dib u sixi kartaa xogta lacag-bixinta.' : 'Payment verification failed. You may retry with correct details.',
        };
      case 'Waa la kansalay':
        return {
          bg: 'bg-gray-50 text-gray-700 border-gray-200',
          icon: <XCircle className="w-3.5 h-3.5 text-gray-500 shrink-0" />,
          label: language === 'so' ? 'Waa la kansalay (Cancelled)' : 'Cancelled',
          hint: language === 'so' ? 'Dalabkan waa la kansalay.' : 'This order has been cancelled.',
        };
      default:
        return {
          bg: 'bg-gray-50 text-gray-700 border-gray-200',
          icon: <Clock className="w-3.5 h-3.5 text-gray-500 shrink-0" />,
          label: status,
          hint: '',
        };
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(language === 'so' ? 'so-SO' : 'en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const displayOrders = React.useMemo(() => {
    if (lookedUpOrders && lookedUpOrders.length > 0) {
      const map = new Map<string, PublicOrderSummary>();
      lookedUpOrders.forEach((o) => map.set(o.id, o));
      sessionOrders.forEach((o) => {
        if (!map.has(o.id)) map.set(o.id, o);
      });
      return Array.from(map.values());
    }
    return sessionOrders;
  }, [lookedUpOrders, sessionOrders]);

  const filteredOrders = React.useMemo(() => {
    if (statusFilter === 'All') return displayOrders;
    if (statusFilter === 'Pending') {
      return displayOrders.filter((o) => o.status === 'Sugaya Lacag-bixin' || o.status === 'Sugaya Hubin');
    }
    if (statusFilter === 'Processing') {
      return displayOrders.filter((o) => o.status === 'Waa la shaqaynayaa');
    }
    if (statusFilter === 'Completed') {
      return displayOrders.filter((o) => o.status === 'Waa la dhammaystiray');
    }
    if (statusFilter === 'Failed') {
      return displayOrders.filter((o) => o.status === 'Wuu fashilmay');
    }
    if (statusFilter === 'Cancelled') {
      return displayOrders.filter((o) => o.status === 'Waa la kansalay');
    }
    return displayOrders;
  }, [displayOrders, statusFilter]);

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4 sm:space-y-6 animate-fadeIn pb-16 px-3 sm:px-0">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs sm:text-sm font-semibold text-gray-700 transition-colors cursor-pointer shadow-xs"
        >
          <ArrowLeft className="w-4 h-4 text-red-600" />
          <span>{language === 'so' ? 'Bogga Hore' : 'Home'}</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchSessionOrders(true)}
            disabled={isRefreshing || isLoadingSession}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-xs font-semibold text-gray-700 transition-colors cursor-pointer disabled:opacity-50"
            title="Cusbooneysii xaaladda"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-red-600' : 'text-gray-500'}`} />
            <span className="hidden sm:inline">{language === 'so' ? 'Cusbooneysii' : 'Refresh'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowLookupForm(!showLookupForm)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              showLookupForm
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Search className="w-3.5 h-3.5 text-red-600" />
            <span>{showLookupForm ? (language === 'so' ? 'Qari Raadinta' : 'Hide Search') : (language === 'so' ? 'Raadi Dalab Hore' : 'Find Past Order')}</span>
          </button>
        </div>
      </div>

      {/* SECTION A: RICH RED PUBG HEADER BANNER */}
      <div className="relative w-full rounded-2xl overflow-hidden bg-gradient-to-r from-red-800 via-red-600 to-red-700 shadow-md border border-red-500/20">
        <div className="absolute inset-0 z-0">
          <img
            src={pubgBanner}
            alt="PUBG Mobile Orders"
            className="w-full h-full object-cover object-center opacity-30 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-red-950/80 via-red-800/60 to-red-600/50" />
        </div>

        <div className="relative z-10 p-4 sm:p-5 flex items-center justify-between gap-3 min-h-[110px] sm:min-h-[125px]">
          <div className="space-y-1 text-white max-w-[70%]">
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-black/30 backdrop-blur-xs text-red-200 border border-white/20">
              PUBG MOBILE
            </span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white drop-shadow-xs">
              My Orders
            </h1>
            <p className="text-xs text-red-100 font-medium line-clamp-1 sm:line-clamp-none">
              Track live status and resume your PUBG Mobile top-ups
            </p>
          </div>

          <div className="shrink-0 flex items-center justify-center p-1.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/25 shadow-sm">
            <img
              src={pubgIcon}
              alt="PUBG Mobile"
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover shadow-xs border border-white/20"
            />
          </div>
        </div>
      </div>

      {/* Customer PEP Rewards Card (if logged in) */}
      {customerPep && (
        <div className="p-4 sm:p-5 rounded-2xl bg-white border-2 border-red-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                PEP
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-900">
                  {language === 'so' ? 'Haraagaaga PEP (Internal Rewards)' : 'Your PEP Rewards'}
                </h3>
                <span className="text-[10px] text-gray-500 font-medium">
                  {language === 'so' ? 'Ku kasbo dhibcaha PEP dalab kasta oo PUBG ah' : 'Earn PEP on every verified PUBG Mobile top-up'}
                </span>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-red-50 text-red-700 border border-red-200">
              {customerPep.progressPercentage}%
            </span>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-red-600 tracking-tight tabular-nums">
                {customerPep.pepBalance.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-gray-700">PEP</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-gray-500 block">
                {language === 'so' ? 'Bartilmaameedka Abaal-marinta' : 'Reward Target'}
              </span>
              <span className="text-xs sm:text-sm font-extrabold text-gray-800 tabular-nums">
                {customerPep.targetPep.toLocaleString()} PEP
              </span>
            </div>
          </div>

          {/* Clean Red-and-White Progress Bar with Red Fill Left to Right */}
          <div className="space-y-1">
            <div className="w-full h-3 bg-red-50 rounded-full border border-red-200 overflow-hidden p-0.5">
              <div
                className="h-full bg-red-600 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${Math.min(100, Math.max(0, customerPep.progressPercentage))}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-gray-500 font-semibold px-0.5">
              <span>0 PEP</span>
              <span className="text-red-700 font-bold">
                {customerPep.progressPercentage}% {language === 'so' ? 'dhameystiran' : 'progress'}
              </span>
              <span>{customerPep.targetPep.toLocaleString()} PEP</span>
            </div>
          </div>
        </div>
      )}

      {/* Returning Customer Identifier Lookup Form */}
      {(showLookupForm || (!isLoadingSession && sessionOrders.length === 0)) && (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-xs space-y-4">
          <div className="border-b border-gray-100 pb-3">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Search className="w-4 h-4 text-red-600" />
              <span>{language === 'so' ? 'Raadinta Dalab Hore' : 'Order Lookup'}</span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {language === 'so'
                ? 'Geli Player ID-gaaga ama Order ID si aad u hesho dalabkaagii hore.'
                : 'Input your PUBG Player ID or Order ID to retrieve previous orders.'}
            </p>
          </div>

          {/* Lookup Input Form */}
          <form onSubmit={handleLookupSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700">
                Player ID ama Order ID <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={identifierInput}
                  onChange={(e) => {
                    setIdentifierInput(e.target.value);
                    if (lookupError) setLookupError('');
                  }}
                  placeholder="Tusaale: 5123456789 ama SOM-PUB-1234"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 text-sm text-gray-900 font-mono"
                />
              </div>
            </div>

            {lookupError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{lookupError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLookingUp}
              className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:opacity-50 text-white font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs active:scale-98"
            >
              {isLookingUp ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" />
                  <span>{language === 'so' ? 'Waa la raadinayaa...' : 'Searching...'}</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>{language === 'so' ? 'Raadi Dalabka' : 'Track Order'}</span>
                </>
              )}
            </button>
          </form>

          {lookupPerformed && lookedUpOrders && lookedUpOrders.length === 0 && (
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-center space-y-1.5">
              <p className="text-xs font-bold text-gray-800">
                {language === 'so' ? 'Lama helin wax dalab ah oo ku diiwaangashan aqoonsigan.' : 'No orders found matching this identifier.'}
              </p>
              <p className="text-[11px] text-gray-500">
                {language === 'so' ? 'Fadlan hubi inaad qortay Player ID ama Order ID sax ah.' : 'Please make sure you entered a valid Player ID or Order ID.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Orders List */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <span>{language === 'so' ? 'Liiska Dalabyadaada' : 'Your Orders'}</span>
            <span className="px-2 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
              {filteredOrders.length}
            </span>
          </h2>
        </div>

        {/* Existing Status Filter Buttons: All, Pending, Processing, Completed, Failed, Cancelled */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-bold -mx-1 px-1">
          {(['All', 'Pending', 'Processing', 'Completed', 'Failed', 'Cancelled'] as const).map((st) => {
            const isSelected = statusFilter === st;
            let count = 0;
            if (st === 'All') count = displayOrders.length;
            else if (st === 'Pending') count = displayOrders.filter((o) => o.status === 'Sugaya Lacag-bixin' || o.status === 'Sugaya Hubin').length;
            else if (st === 'Processing') count = displayOrders.filter((o) => o.status === 'Waa la shaqaynayaa').length;
            else if (st === 'Completed') count = displayOrders.filter((o) => o.status === 'Waa la dhammaystiray').length;
            else if (st === 'Failed') count = displayOrders.filter((o) => o.status === 'Wuu fashilmay').length;
            else if (st === 'Cancelled') count = displayOrders.filter((o) => o.status === 'Waa la kansalay').length;

            return (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
                  isSelected
                    ? 'bg-red-600 text-white border-red-600 shadow-xs'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <span>{st}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                    isSelected ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {isLoadingSession ? (
          <div className="p-12 text-center rounded-2xl bg-white border border-gray-200 space-y-3">
            <RotateCw className="w-6 h-6 animate-spin text-red-600 mx-auto" />
            <p className="text-xs text-gray-500">{language === 'so' ? 'Waxaa la soo rarayaa dalabyadaada...' : 'Loading your orders...'}</p>
          </div>
        ) : filteredOrders.length > 0 ? (
          <div className="space-y-3.5">
            {filteredOrders.map((order) => {
              const badge = getStatusBadge(order.status);
              const isPubg = order.game === 'PUBG Mobile';
              const gameImg = isPubg ? pubgIcon : efbIcon;
              const isUnpaid = order.status === 'Sugaya Lacag-bixin';
              const isFailed = order.status === 'Wuu fashilmay';

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-xs hover:border-red-200 transition-all space-y-3.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={gameImg}
                        alt={order.game}
                        className="w-12 h-12 rounded-xl object-cover border border-gray-200 shadow-2xs shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-900 truncate">
                            {order.game}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                            {order.packageCredits}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-red-600 mt-0.5">
                          {order.packageName}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-sm sm:text-base font-black text-gray-900">
                        ${order.price.toFixed(2)}
                      </div>
                      <span className="text-[10px] text-gray-400 uppercase font-mono">
                        {order.currency || 'USD'}
                      </span>
                    </div>
                  </div>

                  {/* Customer Player ID & Order ID bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <span>Order ID:</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(order.id)}
                          className="inline-flex items-center gap-1 font-mono font-bold text-gray-900 bg-gray-50 px-2 py-0.5 rounded border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer"
                          title="Copy Order ID"
                        >
                          <span>{order.id}</span>
                          {copiedId === order.id ? (
                            <Check className="w-3 h-3 text-green-600" />
                          ) : (
                            <Copy className="w-3 h-3 text-gray-400" />
                          )}
                        </button>
                      </div>

                      {order.playerId && (
                        <div className="text-gray-600">
                          <span className="text-gray-400">Player: </span>
                          <span className="font-mono font-semibold">{order.playerId}</span>
                        </div>
                      )}
                    </div>

                    <span className="text-gray-400 text-[11px]">
                      {formatDate(order.createdAt)}
                    </span>
                  </div>

                  {/* Status Box */}
                  <div className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${badge.bg}`}>
                    <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                      <div className="mt-0.5 sm:mt-0">{badge.icon}</div>
                      <div className="min-w-0">
                        <span className="font-bold text-xs block">{badge.label}</span>
                        {badge.hint && (
                          <span className="text-[11px] opacity-90 leading-tight block">{badge.hint}</span>
                        )}
                        {order.failureReason && (
                          <p className="text-[11px] font-semibold text-red-700 mt-1">
                            {language === 'so' ? 'Sababta:' : 'Reason:'} {order.failureReason}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Order Action Buttons: View Details, Resume Payment / Retry / Cancel */}
                    <div className="flex flex-wrap items-center gap-2 self-end sm:self-center shrink-0">
                      {/* View Details Action */}
                      <button
                        type="button"
                        onClick={() => setSelectedOrderDetails(order)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-bold text-xs cursor-pointer shadow-2xs transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 text-gray-500" />
                        <span>View Details</span>
                      </button>

                      {isUnpaid && onResumeOrder && (
                        <>
                          <button
                            type="button"
                            onClick={() => onResumeOrder(order)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-black text-xs shadow-xs cursor-pointer active:scale-98"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>{language === 'en' ? 'Pay' : 'ادفع'}</span>
                          </button>
                          <button
                            type="button"
                            disabled={cancellingId === order.id}
                            onClick={() => handleCancelOrder(order.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-semibold text-xs cursor-pointer"
                          >
                            <span>{language === 'so' ? 'Kansal' : 'Cancel'}</span>
                          </button>
                        </>
                      )}

                      {isFailed && onResumeOrder && (
                        <button
                          type="button"
                          onClick={() => onResumeOrder(order)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-xs shadow-xs cursor-pointer active:scale-98"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                          <span>{language === 'so' ? 'Dib u Gudbi Xaqiijinta' : 'Retry Verification'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 sm:p-10 text-center space-y-4 shadow-xs">
            <div className="w-14 h-14 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-red-600 mx-auto">
              <ShoppingBag className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-gray-900">
                {language === 'so' ? 'Ma Jiraan Dalabyo Halkan Ku Jira' : 'No Orders Found in This Session'}
              </h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                {language === 'so'
                  ? 'Weli wax dalab ah kama aadan dhiiban aaladdan. Ku shubo PUBG Mobile hadda!'
                  : 'You have not placed any orders yet. Top up PUBG Mobile now!'}
              </p>
            </div>

            <div className="pt-2 flex justify-center">
              <button
                type="button"
                onClick={() => onSelectGame('PUBG Mobile')}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs active:scale-98"
              >
                {language === 'so' ? 'Shubo PUBG Mobile' : 'Top Up PUBG Mobile'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Support Assistance Bar */}
      <div className="p-4 rounded-2xl border border-gray-200 bg-white shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center text-green-600 shrink-0">
            <MessageCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-900">
              {language === 'so' ? 'Su\'aal Ma Ka Qabtaa Dalabkaaga?' : 'Questions About Your Order?'}
            </h4>
            <p className="text-[11px] text-gray-500">
              {language === 'so' ? 'Kala xiriir maamulka WhatsApp si degdeg ah.' : 'Contact our team directly on WhatsApp.'}
            </p>
          </div>
        </div>

        <a
          href="https://wa.me/252615482390"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>WhatsApp (+252 61 5482390)</span>
        </a>
      {/* Order Details Modal */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto animate-fadeIn">
          <div className="relative w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden my-6 text-gray-900">
            {/* Modal Header */}
            <div className="bg-red-600 text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" />
                <h3 className="text-sm font-bold tracking-tight">Order Details</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderDetails(null)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 space-y-4 text-xs">
              {/* Order ID & Status */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div>
                  <span className="text-[10px] text-gray-400 font-semibold uppercase block">Order ID</span>
                  <div className="flex items-center gap-1.5 font-mono font-bold text-red-600 text-sm">
                    <span>{selectedOrderDetails.id}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(selectedOrderDetails.id)}
                      className="text-gray-400 hover:text-gray-700 cursor-pointer p-0.5"
                      title="Copy ID"
                    >
                      {copiedId === selectedOrderDetails.id ? (
                        <Check className="w-3.5 h-3.5 text-green-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-gray-400 font-semibold uppercase block">Status</span>
                  <span className={`px-2 py-0.5 rounded font-bold text-[11px] inline-block mt-0.5 ${getStatusBadge(selectedOrderDetails.status).bg}`}>
                    {getStatusBadge(selectedOrderDetails.status).label}
                  </span>
                </div>
              </div>

              {/* Package & Price Info */}
              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">Game:</span>
                  <span className="font-bold text-gray-900">{selectedOrderDetails.game}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">Package:</span>
                  <span className="font-bold text-red-600">{selectedOrderDetails.packageCredits} ({selectedOrderDetails.packageName})</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">Price:</span>
                  <span className="font-black text-gray-900 text-sm">${selectedOrderDetails.price.toFixed(2)} {selectedOrderDetails.currency || 'USD'}</span>
                </div>
              </div>

              {/* Player Details */}
              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">PUBG Player ID:</span>
                  <span className="font-mono font-bold text-gray-900">{selectedOrderDetails.playerId || '—'}</span>
                </div>
                {selectedOrderDetails.playerNickname && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-medium">In-Game Nickname:</span>
                    <span className="font-semibold text-gray-900">{selectedOrderDetails.playerNickname}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">Created:</span>
                  <span className="text-gray-700">{formatDate(selectedOrderDetails.createdAt)}</span>
                </div>
                {selectedOrderDetails.completedAt && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-medium">Completed:</span>
                    <span className="text-green-700 font-semibold">{formatDate(selectedOrderDetails.completedAt)}</span>
                  </div>
                )}
              </div>

              {/* Failure reason if failed */}
              {selectedOrderDetails.failureReason && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 space-y-1">
                  <span className="font-bold flex items-center gap-1.5 text-red-900">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>Reason for Failure:</span>
                  </span>
                  <p className="leading-relaxed text-[11px]">{selectedOrderDetails.failureReason}</p>
                </div>
              )}

              {/* Modal Actions */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100">
                {selectedOrderDetails.status === 'Sugaya Lacag-bixin' && onResumeOrder && (
                  <button
                    type="button"
                    onClick={() => {
                      const ord = selectedOrderDetails;
                      setSelectedOrderDetails(null);
                      onResumeOrder(ord);
                    }}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{language === 'en' ? 'Pay Now' : 'ادفع الآن'}</span>
                  </button>
                )}

                {selectedOrderDetails.status === 'Wuu fashilmay' && onResumeOrder && (
                  <button
                    type="button"
                    onClick={() => {
                      const ord = selectedOrderDetails;
                      setSelectedOrderDetails(null);
                      onResumeOrder(ord);
                    }}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Retry Verification</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedOrderDetails(null)}
                  className="px-4 py-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-bold text-xs cursor-pointer transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
