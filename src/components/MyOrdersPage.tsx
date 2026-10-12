import React, { useState, useEffect, useCallback } from 'react';
import { GameType, OrderStatus, PublicOrderSummary } from '../types';
import { getGuestSessionId, getSessionOrderIds, addSessionOrderId } from '../services/storage';
import pubgIcon from '../assets/images/game_pubg_mobile_1791667426125.jpg';
import efbIcon from '../assets/images/game_efootball_coins_1791667436245.jpg';
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
  HelpCircle,
} from 'lucide-react';

interface MyOrdersPageProps {
  onBack: () => void;
  onSelectGame: (game: 'PUBG Mobile' | 'eFootball') => void;
}

export const MyOrdersPage: React.FC<MyOrdersPageProps> = ({ onBack, onSelectGame }) => {
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

  const handleCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // 1. Same-session order loading
  const fetchSessionOrders = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else setIsLoadingSession(true);

    try {
      const guestSessionId = getGuestSessionId();
      const orderIds = getSessionOrderIds();

      const params = new URLSearchParams();
      if (guestSessionId) params.set('guestSessionId', guestSessionId);
      if (orderIds.length > 0) params.set('orderIds', orderIds.join(','));

      const response = await fetch(`/api/orders/session?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.orders)) {
          setSessionOrders(data.orders);
        }
      }
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
        lookupGame === 'PUBG Mobile'
          ? 'Fadlan geli Player ID-gaaga PUBG Mobile.'
          : 'Fadlan geli cinwaanka iimaylkaaga eFootball.'
      );
      return;
    }

    if (lookupGame === 'PUBG Mobile') {
      if (!/^\d{5,15}$/.test(cleanInput)) {
        setLookupError('Player ID-ga waa inuu ka koobnaadaa 5 ilaa 15 tiro (tusaale: 5123456789).');
        return;
      }
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanInput)) {
        setLookupError('Fadlan geli cinwaan iimayl sax ah (tusaale: magac@gmail.com).');
        return;
      }
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
        setLookupError(data.error || 'Khalad ayaa dhacay xilliga baarista.');
        setIsLookingUp(false);
        return;
      }

      const orders: PublicOrderSummary[] = data.orders || [];
      setLookedUpOrders(orders);
      setLookupPerformed(true);

      // Auto-save retrieved order IDs to current session so they are kept visible
      if (orders.length > 0) {
        orders.forEach((o) => addSessionOrderId(o.id));
      }
    } catch (err) {
      console.error('Lookup error:', err);
      setLookupError('Khalad xagga xiriirka ah ayaa dhacay. Fadlan dib u tijaabi.');
    } finally {
      setIsLookingUp(false);
    }
  };

  // Somali Status Badge Mapping
  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'Sugaya Xaqiijin':
        return {
          bg: 'bg-purple-50 text-purple-700 border-purple-200',
          icon: <Clock className="w-3.5 h-3.5 text-purple-600 shrink-0" />,
          label: 'Sugaya Koodhka (eFootball)',
          hint: 'Koodhka hubinta waxaa laguu soo diri doonaa iimaylkaaga.',
        };
      case 'Hubin ku socoto':
        return {
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: <RotateCw className="w-3.5 h-3.5 text-blue-600 animate-spin shrink-0" />,
          label: 'Hubin ku socoto',
          hint: 'Maamulaha ayaa hadda gacanta ku haya xaqiijinta koodhkaaga.',
        };
      case 'Sugaya Lacag-bixin':
        return {
          bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          icon: <CreditCard className="w-3.5 h-3.5 text-indigo-600 shrink-0" />,
          label: 'Sugaya Lacag-bixin',
          hint: 'Xaqiijinta waa la oggolaaday, fadlan bixi lacagta.',
        };
      case 'Sugaya Hubin':
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />,
          label: 'Sugaya Hubin (Lacagta)',
          hint: 'Waxaa socota hubinta lambarka aad lacagta ka dirtay.',
        };
      case 'Waa la shaqaynayaa':
        return {
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: <RotateCw className="w-3.5 h-3.5 text-blue-600 animate-spin shrink-0" />,
          label: 'Waa la shaqaynayaa',
          hint: 'Lacagta waa la xaqiijiyay, waxaana socota shubista ciyaarta.',
        };
      case 'Waa la dhammaystiray':
        return {
          bg: 'bg-green-50 text-green-700 border-green-200',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />,
          label: 'Waa la dhammaystiray',
          hint: 'Dalabkaaga si guul leh ayaa loogu shubay koontadaada.',
        };
      case 'Wuu fashilmay':
        return {
          bg: 'bg-red-50 text-red-700 border-red-200',
          icon: <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />,
          label: 'Wuu fashilmay',
          hint: 'Dalabka wuu fashilmay. Fadlan la xiriir taageerada.',
        };
      case 'Xaqiijintu way fashilantay':
        return {
          bg: 'bg-red-50 text-red-700 border-red-200',
          icon: <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />,
          label: 'Xaqiijintu way fashilantay',
          hint: 'Koodhkii la soo diray ma saxna ama waa la diiday.',
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
      return d.toLocaleDateString('so-SO', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return isoString;
    }
  };

  // Determine which orders to display
  // Prioritize session orders; if user performed lookup, show those; or combine them uniquely
  const displayOrders = React.useMemo(() => {
    if (lookedUpOrders && lookedUpOrders.length > 0) {
      // Merge unique
      const map = new Map<string, PublicOrderSummary>();
      lookedUpOrders.forEach((o) => map.set(o.id, o));
      sessionOrders.forEach((o) => {
        if (!map.has(o.id)) map.set(o.id, o);
      });
      return Array.from(map.values());
    }
    return sessionOrders;
  }, [lookedUpOrders, sessionOrders]);

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* 1. Header Navigation Bar */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-blue-600" />
          <span>Bogga Hore</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchSessionOrders(true)}
            disabled={isRefreshing || isLoadingSession}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-xs font-semibold text-gray-700 transition-colors cursor-pointer disabled:opacity-50"
            title="Cusbooneysii xaaladda"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : 'text-gray-500'}`} />
            <span className="hidden sm:inline">Cusbooneysii</span>
          </button>

          <button
            type="button"
            onClick={() => setShowLookupForm(!showLookupForm)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              showLookupForm
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Search className="w-3.5 h-3.5 text-blue-600" />
            <span>{showLookupForm ? 'Qari Raadinta' : 'Raadi Dalab Hore'}</span>
          </button>
        </div>
      </div>

      {/* Page Title & Context */}
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              Dalabyadayda (My Orders)
            </h1>
            <p className="text-xs sm:text-sm text-gray-500">
              La soco xaaladda dhabta ah ee dalabyadaada PUBG Mobile iyo eFootball adigoon akoon u baahnayn.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Returning Customer Identifier Lookup Form (Shown if requested or if no session orders) */}
      {(showLookupForm || (!isLoadingSession && sessionOrders.length === 0)) && (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-xs space-y-4">
          <div className="border-b border-gray-100 pb-3">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Search className="w-4 h-4 text-blue-600" />
              <span>Raadinta Dalab Hore (Returning Customer)</span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Haddii aad ka soo gashay aalad kale ama aad tirtirtay xogta browser-ka, ku raadi dalabkaaga ciyaarta iyo aqoonsigaagii hore.
            </p>
          </div>

          {/* Game Selector Tabs */}
          <div className="grid grid-cols-2 gap-2 bg-gray-50 p-1 rounded-xl border border-gray-200">
            <button
              type="button"
              onClick={() => {
                setLookupGame('PUBG Mobile');
                setLookupError('');
                setIdentifierInput('');
              }}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                lookupGame === 'PUBG Mobile'
                  ? 'bg-white text-blue-600 shadow-xs border border-gray-200'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <img src={pubgIcon} alt="PUBG" className="w-4 h-4 rounded object-cover" />
              <span>PUBG Mobile</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setLookupGame('eFootball');
                setLookupError('');
                setIdentifierInput('');
              }}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                lookupGame === 'eFootball'
                  ? 'bg-white text-blue-600 shadow-xs border border-gray-200'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <img src={efbIcon} alt="eFootball" className="w-4 h-4 rounded object-cover" />
              <span>eFootball</span>
            </button>
          </div>

          {/* Lookup Input Form */}
          <form onSubmit={handleLookupSubmit} className="space-y-3">
            {lookupGame === 'PUBG Mobile' ? (
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-700">
                  Player ID-ga PUBG Mobile <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={identifierInput}
                    onChange={(e) => {
                      setIdentifierInput(e.target.value);
                      if (lookupError) setLookupError('');
                    }}
                    placeholder="Tusaale: 5123456789"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-sm text-gray-900 font-mono"
                  />
                </div>
                <p className="text-[11px] text-gray-500">
                  Geli Player ID-ga si aad u hesho dhammaan dalabyadii PUBG Mobile ee laguu shubay.
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-700">
                  Cinwaanka Iimaylka ee eFootball <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    inputMode="email"
                    value={identifierInput}
                    onChange={(e) => {
                      setIdentifierInput(e.target.value);
                      if (lookupError) setLookupError('');
                    }}
                    placeholder="Tusaale: magac@gmail.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-sm text-gray-900"
                  />
                </div>
                <p className="text-[11px] text-gray-500">
                  Geli iimaylkii aad u isticmaashay xaqiijinta dalabka eFootball.
                </p>
              </div>
            )}

            {lookupError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{lookupError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLookingUp}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs"
            >
              {isLookingUp ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" />
                  <span>Waa la raadinayaa...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Raadi Dalabyada {lookupGame}</span>
                </>
              )}
            </button>
          </form>

          {/* Lookup Not Found Message */}
          {lookupPerformed && lookedUpOrders && lookedUpOrders.length === 0 && (
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-center space-y-1.5">
              <p className="text-xs font-bold text-gray-800">
                Lama helin wax dalab ah oo ku diiwaangashan aqoonsigan.
              </p>
              <p className="text-[11px] text-gray-500">
                Fadlan hubi inaad dooratay ciyaarta saxda ah oo aad qortay tirooyinka ama xarfaha saxda ah.
              </p>
            </div>
          )}
        </div>
      )}

      {/* 3. Session Orders List (Scenario A: Same-session automatically displays orders) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <span>Liiska Dalabyadaada</span>
            <span className="px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
              {displayOrders.length}
            </span>
          </h2>

          {displayOrders.length > 0 && (
            <span className="text-[11px] text-gray-500">
              Toos ayey uga soo cusboonaanaysaa database-ka
            </span>
          )}
        </div>

        {isLoadingSession ? (
          <div className="p-12 text-center rounded-2xl bg-white border border-gray-200 space-y-3">
            <RotateCw className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
            <p className="text-xs text-gray-500">Waxaa la soo rarayaa dalabyadaada...</p>
          </div>
        ) : displayOrders.length > 0 ? (
          <div className="space-y-3">
            {displayOrders.map((order) => {
              const badge = getStatusBadge(order.status);
              const isPubg = order.game === 'PUBG Mobile';
              const gameImg = isPubg ? pubgIcon : efbIcon;

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-xs hover:border-blue-200 transition-all space-y-3.5"
                >
                  {/* Top Bar: Game Image, Title, Price, Status */}
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
                        <p className="text-xs font-semibold text-blue-600 mt-0.5">
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

                  {/* Middle Bar: Order ID, Date, Status Badge */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100 text-xs">
                    <div className="flex items-center gap-2 text-gray-500">
                      <span>Tixraac:</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(order.id)}
                        className="inline-flex items-center gap-1 font-mono font-bold text-gray-900 bg-gray-50 px-2 py-0.5 rounded border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer"
                        title="Nuqul ka qaad"
                      >
                        <span>{order.id}</span>
                        {copiedId === order.id ? (
                          <Check className="w-3 h-3 text-green-600" />
                        ) : (
                          <Copy className="w-3 h-3 text-gray-400" />
                        )}
                      </button>
                    </div>

                    <span className="text-gray-400 text-[11px]">
                      {formatDate(order.createdAt)}
                    </span>
                  </div>

                  {/* Status Indicator & Hint */}
                  <div className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${badge.bg}`}>
                    <div className="flex items-center gap-2 min-w-0">
                      {badge.icon}
                      <div className="min-w-0">
                        <span className="font-bold text-xs block">{badge.label}</span>
                        {badge.hint && (
                          <span className="text-[11px] opacity-90 truncate block">{badge.hint}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty State: No Orders in this session */
          <div className="bg-white rounded-2xl border border-gray-200 p-8 sm:p-10 text-center space-y-4 shadow-xs">
            <div className="w-14 h-14 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 mx-auto">
              <ShoppingBag className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-gray-900">
                Ma Jiraan Dalabyo Ku Diiwaangashan Kalfadhigan
              </h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Weli wax dalab ah kama aadan dhiiban aaladdan. Haddii aad hore u dalbatay, isticmaal badhanka "Raadi Dalab Hore" ee kor ku xusan.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-center">
              <button
                type="button"
                onClick={() => onSelectGame('PUBG Mobile')}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors cursor-pointer shadow-xs"
              >
                Shubo PUBG Mobile
              </button>
              <button
                type="button"
                onClick={() => onSelectGame('eFootball')}
                className="px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-xs transition-colors cursor-pointer"
              >
                Shubo eFootball
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Privacy & Security Notice */}
      <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex items-start gap-3 text-xs text-gray-600">
        <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-bold text-gray-900 block">Ilaalinta Xogta Macmiilka</span>
          <p className="text-[11px] text-gray-500 leading-relaxed">
            Boggani wuxuu muujiyaa xaaladda dalabka oo keliya. Ma soo bandhigo iimaylka, lambarka Player ID-ga, koodhadhka xaqiijinta, ama xogta lacag-bixinta, si loo dhowro xogtaada gaarka ah.
          </p>
        </div>
      </div>

      {/* 5. Support Assistance Bar */}
      <div className="p-4 rounded-2xl border border-gray-200 bg-white shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center text-green-600 shrink-0">
            <MessageCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-900">Su'aal Ma Ka Qabtaa Dalabkaaga?</h4>
            <p className="text-[11px] text-gray-500">
              Kala xiriir maamulka WhatsApp si degdeg ah loogu xaqiijiyo.
            </p>
          </div>
        </div>

        <a
          href="https://wa.me/252615080557?text=Asalaamu+Calaykum%2C+waxaan+doonayaa+inaan+ogaado+xaaladda+dalabkayga+SomTopUp."
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>Taageerada WhatsApp</span>
        </a>
      </div>
    </div>
  );
};
