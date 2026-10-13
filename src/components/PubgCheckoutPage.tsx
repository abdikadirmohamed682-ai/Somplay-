import React, { useState, useEffect } from 'react';
import { GamePackage, PaymentMethod, Order, UserProfile } from '../types';
import { getGuestSessionId, addSessionOrderId } from '../services/storage';
import { getCurrentCustomer, updateCustomerProfile } from '../services/customerAuth';
import { CustomerAuthModal } from './CustomerAuthModal';
import { useLanguage } from '../services/language.tsx';
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  Check,
  ShieldCheck,
  AlertCircle,
  Clock,
  ArrowRight,
  ShoppingBag,
  Upload,
  Phone,
  Lock,
  RotateCw,
  User,
  Award,
} from 'lucide-react';

interface PubgCheckoutPageProps {
  packageItem: GamePackage;
  paymentMethods: PaymentMethod[];
  onBack: () => void;
  onOrderCreated: (order: Order) => void;
  onViewOrders?: () => void;
  resumeOrder?: Order | null;
}

export const PubgCheckoutPage: React.FC<PubgCheckoutPageProps> = ({
  packageItem,
  paymentMethods,
  onBack,
  onOrderCreated,
  onViewOrders,
  resumeOrder,
}) => {
  const { language, t } = useLanguage();

  // Customer authentication state (Mandatory Customer Account Before Top-Up)
  const [currentCustomer, setCurrentCustomer] = useState<UserProfile | null>(() => getCurrentCustomer());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // If resuming an existing unpaid or failed order, start at payment step directly
  const [step, setStep] = useState<'details' | 'payment' | 'completed'>(
    resumeOrder ? 'payment' : 'details'
  );

  // Form inputs
  const [playerId, setPlayerId] = useState(() => {
    if (resumeOrder?.playerId) return resumeOrder.playerId;
    const cust = getCurrentCustomer();
    return cust?.defaultPlayerId || '';
  });
  const [playerNickname, setPlayerNickname] = useState(() => {
    if (resumeOrder?.playerNickname) return resumeOrder.playerNickname;
    const cust = getCurrentCustomer();
    return cust?.name || '';
  });
  const [errorMsg, setErrorMsg] = useState('');

  // Payment inputs
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>(() => {
    if (resumeOrder?.paymentMethodId) {
      const found = paymentMethods.find((m) => m.id === resumeOrder.paymentMethodId);
      if (found) return found;
    }
    return paymentMethods.find((m) => m.active) || paymentMethods[0];
  });
  const [senderPhone, setSenderPhone] = useState(resumeOrder?.senderPhoneNumber || '');
  const [receiptImage, setReceiptImage] = useState<string>(resumeOrder?.receiptImage || '');
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [isInitiating, setIsInitiating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialerOpened, setDialerOpened] = useState(false);

  // Active / Resulting Order (persisted in db)
  const [createdOrder, setCreatedOrder] = useState<Order | null>(resumeOrder || null);

  // Listen to customer session changes
  useEffect(() => {
    const handleAuthChange = () => {
      const cust = getCurrentCustomer();
      setCurrentCustomer(cust);
      if (cust) {
        if (cust.defaultPlayerId && !playerId) {
          setPlayerId(cust.defaultPlayerId);
        }
        if (cust.name && !playerNickname) {
          setPlayerNickname(cust.name);
        }
      }
    };

    window.addEventListener('somtopup_customer_auth_change', handleAuthChange);
    return () => {
      window.removeEventListener('somtopup_customer_auth_change', handleAuthChange);
    };
  }, [playerId, playerNickname]);

  useEffect(() => {
    // If not resuming and customer is logged in, auto-fill default player ID
    if (!resumeOrder && !playerId) {
      const cust = getCurrentCustomer();
      if (cust?.defaultPlayerId) setPlayerId(cust.defaultPlayerId);
      if (cust?.name && !playerNickname) setPlayerNickname(cust.name);
    }
  }, [resumeOrder, playerId, playerNickname]);

  useEffect(() => {
    if (resumeOrder) {
      setCreatedOrder(resumeOrder);
      setPlayerId(resumeOrder.playerId);
      if (resumeOrder.playerNickname) setPlayerNickname(resumeOrder.playerNickname);
      if (resumeOrder.senderPhoneNumber) setSenderPhone(resumeOrder.senderPhoneNumber);
      setStep('payment');
    }
  }, [resumeOrder]);

  // Compute dynamic payment USSD code if service code and merchant wallet are configured
  const currentPrice = createdOrder ? createdOrder.price : packageItem.price;
  const dynamicCode = React.useMemo(() => {
    if (!selectedPaymentMethod) return '';
    if (selectedPaymentMethod.serviceCode && selectedPaymentMethod.merchantWallet) {
      return `*${selectedPaymentMethod.serviceCode}*${selectedPaymentMethod.merchantWallet}*${currentPrice}#`;
    }
    return selectedPaymentMethod.accountNumber.replace('AMOUNT', String(currentPrice));
  }, [selectedPaymentMethod, currentPrice]);

  // Format tel: URI for mobile dialers with '#' encoded as '%23'
  const dialerHref = React.useMemo(() => {
    if (!dynamicCode) return '';
    return `tel:${dynamicCode.replace(/#/g, '%23')}`;
  }, [dynamicCode]);

  const handleDialerClick = () => {
    // Automatically copy code to clipboard as secondary safety fallback
    if (navigator.clipboard && dynamicCode) {
      navigator.clipboard.writeText(dynamicCode).catch(() => {});
    }
    setDialerOpened(true);
  };

  // Handle optional receipt image upload
  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg(language === 'so' ? 'Sawirka rasiidka waa inuu ka yaraadaa 5MB.' : 'Receipt image must be under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setReceiptImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Validate Step 1 (Player Details) & Create/Save Unique Order in Database BEFORE Starting Payment
  const handleProceedToPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanId = playerId.trim();
    const cleanNick = playerNickname.trim();

    if (!cleanId) {
      setErrorMsg(language === 'so' ? 'Fadlan geli Player ID-gaaga PUBG Mobile.' : 'Please enter your PUBG Mobile Player ID.');
      return;
    }
    if (!/^\d{5,15}$/.test(cleanId)) {
      setErrorMsg(language === 'so' ? 'Player ID waa inuu ka koobnaadaa 5 ilaa 15 tiro (tusaale: 5123456789).' : 'Player ID must be 5 to 15 digits (e.g. 5123456789).');
      return;
    }
    if (!cleanNick) {
      setErrorMsg(language === 'so' ? 'Fadlan geli magacaaga ciyaarta (In-game nickname).' : 'Please enter your in-game nickname.');
      return;
    }

    // Require Customer Account before initiating order
    if (!currentCustomer) {
      setIsAuthModalOpen(true);
      setErrorMsg(
        language === 'so'
          ? 'Fadlan gal ama sameyso akoon ka hor inta aadan sii wadin shubashada.'
          : 'Please log in or register before proceeding with your top-up.'
      );
      return;
    }

    // Automatically save or update default PUBG Player ID to profile if missing
    if (!currentCustomer.defaultPlayerId) {
      updateCustomerProfile(currentCustomer.name || cleanNick, cleanId);
    }

    setIsInitiating(true);
    try {
      const guestSessionId = getGuestSessionId();
      const customerToken = localStorage.getItem('somtopup_customer_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (customerToken) {
        headers['Authorization'] = `Bearer ${customerToken}`;
      }

      const response = await fetch('/api/checkout/pubg/initiate', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          packageId: packageItem.id,
          price: packageItem.price,
          playerId: cleanId,
          playerNickname: cleanNick,
          guestSessionId,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        setErrorMsg(data.error || (language === 'so' ? 'Khalad ayaa dhacay xilliga dalabka la abuurayay.' : 'Error initiating order.'));
        setIsInitiating(false);
        return;
      }

      if (data.order?.id) {
        addSessionOrderId(data.order.id);
      }

      setCreatedOrder(data.order);
      setStep('payment');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Initiate order error:', err);
      setErrorMsg(language === 'so' ? 'Khalad xagga xiriirka ah ayaa dhacay. Fadlan hubi internet-ka.' : 'Network connection error. Please check your connection.');
    } finally {
      setIsInitiating(false);
    }
  };

  // Submit Payment Reference for Verification (Step 2)
  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!createdOrder) {
      setErrorMsg(language === 'so' ? 'Xogta dalabka lama helin. Fadlan dib ugu noqo xulashada.' : 'Order not found. Please start over.');
      return;
    }

    const cleanPhone = senderPhone.trim();
    if (!cleanPhone) {
      setErrorMsg(language === 'so' ? 'Fadlan geli lambarka aad lacagta ka dirtay.' : 'Please enter the sender phone number.');
      return;
    }

    setIsSubmitting(true);

    try {
      const guestSessionId = getGuestSessionId();
      const isRetrying = createdOrder.status === 'Wuu fashilmay';
      const endpoint = isRetrying ? '/api/checkout/pubg/retry-verification' : '/api/checkout/pubg/submit-payment';

      const customerToken = localStorage.getItem('somtopup_customer_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (customerToken) {
        headers['Authorization'] = `Bearer ${customerToken}`;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          orderId: createdOrder.id,
          paymentMethodId: selectedPaymentMethod?.id || 'pay-hormuud',
          paymentMethodName: selectedPaymentMethod?.name || 'Hormuud (EVC Plus)',
          walletProvider: selectedPaymentMethod?.walletProvider || (selectedPaymentMethod?.id?.includes('sahal') ? 'sahal' : 'hormuud'),
          senderPhoneNumber: cleanPhone,
          receiptImage: receiptImage || undefined,
          guestSessionId,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setErrorMsg(data.error || (language === 'so' ? 'Khalad ayaa dhacay xilliga xaqiijinta la gudbinayay.' : 'An error occurred while submitting payment.'));
        setIsSubmitting(false);
        return;
      }

      if (data.order?.id) {
        addSessionOrderId(data.order.id);
      }

      setCreatedOrder(data.order);
      onOrderCreated(data.order);
      setStep('completed');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Pubg payment submission error:', err);
      setErrorMsg(language === 'so' ? 'Khalad xagga xiriirka ah ayaa dhacay. Fadlan hubi internet-ka.' : 'Network connection error. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyAccount = () => {
    if (!dynamicCode) return;
    navigator.clipboard.writeText(dynamicCode);
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2000);
  };

  const isResumingExisting = Boolean(resumeOrder);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 sm:space-y-8 animate-fadeIn pb-12">
      {/* Top Header & Back Navigation */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <button
          type="button"
          onClick={
            step === 'payment' && !isResumingExisting
              ? () => setStep('details')
              : onBack
          }
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs sm:text-sm font-semibold transition-colors cursor-pointer shadow-xs"
        >
          <ArrowLeft className="w-4 h-4 text-red-600" />
          <span>
            {step === 'payment' && !isResumingExisting
              ? (language === 'so' ? 'Ku noqo Xogta' : 'Back to Details')
              : (language === 'so' ? 'Ku noqo Xirmooyinka' : 'Back to Packages')}
          </span>
        </button>

        <span className="text-xs font-bold uppercase tracking-wider text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-md">
          PUBG Mobile UC
        </span>
      </div>

      {/* Selected Package Summary Card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black text-sm shadow-xs shrink-0">
            UC
          </div>
          <div>
            <span className="text-[11px] text-gray-500 font-medium">
              {language === 'so' ? 'Xirmada aad dooratay' : 'Selected Package'}
            </span>
            <h2 className="text-base sm:text-lg font-extrabold text-gray-900 tracking-tight">
              {createdOrder ? createdOrder.packageCredits : packageItem.credits} ({createdOrder ? createdOrder.packageName : packageItem.name})
            </h2>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="text-[11px] text-gray-500 block">
            {language === 'so' ? 'Qiimaha rasmiga ah' : 'Package Price'}
          </span>
          <span className="text-lg sm:text-xl font-black text-red-600 tabular-nums">
            ${currentPrice.toFixed(2)} USD
          </span>
        </div>
      </div>

      {/* STEP 1: PLAYER DETAILS */}
      {step === 'details' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-xs space-y-5">
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-gray-900">
              {language === 'so' ? 'Geli Xogta Ciyaartaada' : 'Enter Player Details'}
            </h3>
            <p className="text-xs text-gray-500">
              {language === 'so'
                ? 'Fadlan si sax ah u geli Player ID-ga iyo Nickname-ka si toos loogu shubo UC-ga.'
                : 'Please input your official PUBG Player ID and in-game Nickname accurately.'}
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Guest Account Requirement Banner */}
          {!currentCustomer && (
            <div className="p-4 rounded-xl bg-red-50/80 border border-red-200 text-red-950 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-red-600 shrink-0" />
                  <span className="font-extrabold text-xs">
                    {language === 'so'
                      ? 'Akoon Macmiil ayaa loo baahan yahay'
                      : 'Customer Account Required'}
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-700">
                  {language === 'so' ? 'Waajib' : 'Mandatory'}
                </span>
              </div>
              <p className="text-[11px] text-red-800 leading-relaxed">
                {language === 'so'
                  ? 'Fadlan soo gal ama sameyso akoon si aad u sii wadato shubashada xirmadan PUBG. Xirmada aad dooratay way kuu keydsan tahay.'
                  : 'Please sign in or create an account to proceed with this PUBG package. Your package selection is preserved.'}
              </p>
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs active:scale-98"
              >
                {language === 'so' ? 'Gal ama Sameyso Koonto' : 'Sign In or Register'}
              </button>
            </div>
          )}

          {/* Logged-in Customer Status Badge with PEP Reward Preview */}
          {currentCustomer && (
            <div className="p-3 rounded-xl bg-green-50/80 border border-green-200 text-green-900 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                <div>
                  <span className="font-bold">{currentCustomer.name || currentCustomer.email}</span>
                  <span className="text-[11px] text-green-700 block">
                    {currentCustomer.defaultPlayerId
                      ? (language === 'so' ? `Player ID-ga keydsan: ${currentCustomer.defaultPlayerId}` : `Saved Player ID: ${currentCustomer.defaultPlayerId}`)
                      : (language === 'so' ? 'Player ID-ga aad geliso waxaa lagu keydinayaa koontadaada' : 'Player ID entered will be saved to your profile')}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white border border-green-200 text-[11px] font-black text-red-600 shadow-2xs">
                <Award className="w-3.5 h-3.5 text-red-600" />
                <span>+{Math.max(1, Math.round(currentPrice * 20))} PEP</span>
              </div>
            </div>
          )}

          <form onSubmit={handleProceedToPayment} className="space-y-4">
            {/* Field 1: Player ID */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-gray-800">
                  Player ID <span className="text-red-500">*</span>
                </label>
                {currentCustomer?.defaultPlayerId && (
                  <span className="text-[10px] text-gray-500">
                    {language === 'so' ? '(Waad beddeli kartaa haddii aad rabto)' : '(You can change it if you wish)'}
                  </span>
                )}
              </div>
              <input
                type="text"
                required
                value={playerId}
                onChange={(e) => setPlayerId(e.target.value)}
                placeholder="Tusaale: 5123456789"
                className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-base sm:text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 font-mono transition-all"
              />
              <span className="text-[11px] text-gray-400 mt-1 block">
                {language === 'so'
                  ? 'Player ID-gaaga waxaa ka helaysaa astaanta akoonkaaga PUBG Mobile (Profile).'
                  : 'Find your Player ID inside your PUBG Mobile profile.'}
              </span>
            </div>

            {/* Field 2: Nickname */}
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1.5">
                Username / Nickname <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={playerNickname}
                onChange={(e) => setPlayerNickname(e.target.value)}
                placeholder="Tusaale: SomaliWarrior"
                className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-base sm:text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
              />
              <span className="text-[11px] text-gray-400 mt-1 block">
                {language === 'so'
                  ? 'Magacaaga lagu yaqaanno gudaha ciyaarta si loogu xaqiijiyo akoonka.'
                  : 'In-game character name for cross-verification.'}
              </span>
            </div>

            <button
              type="submit"
              disabled={isInitiating}
              className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:opacity-50 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer mt-2 active:scale-98"
            >
              {isInitiating ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" />
                  <span>{language === 'so' ? 'Waa la diyaarinayaa...' : 'Preparing Order...'}</span>
                </>
              ) : (
                <>
                  <span>{language === 'so' ? 'Sii wad (Payment)' : 'Continue to Payment'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* STEP 2: PAYMENT FLOW */}
      {step === 'payment' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-xs space-y-6">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-bold text-gray-900">
                {language === 'so' ? 'Dhammaystir Lacag-bixinta' : 'Complete Payment'}
              </h3>
              {createdOrder && (
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-800 border border-gray-200">
                  {createdOrder.id}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500">
              {language === 'so'
                ? 'Dooro Hormuud ama Sahal, dir lacagta, kadibna geli lambarka aad ka dirtay.'
                : 'Select Hormuud or Sahal, transfer the exact amount, then enter your sender phone number.'}
            </p>
          </div>

          {/* If customer is resuming a failed order, show failure reason */}
          {createdOrder?.failureReason && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-red-900">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{language === 'so' ? 'Sababta Diidmada Hore:' : 'Previous Verification Failure Reason:'}</span>
              </div>
              <p className="leading-relaxed">{createdOrder.failureReason}</p>
              <p className="text-[11px] text-red-600 font-medium">
                {language === 'so'
                  ? 'Fadlan hubi lambarka iyo tixraaca saxda ah, kadibna mar kale gudbi si maamuluhu u hubiyo.'
                  : 'Please correct your details and re-submit for admin verification.'}
              </p>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Order Details Confirmation (Locked) */}
          <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-gray-400 block text-[10px] uppercase font-bold">Player ID</span>
              <span className="font-mono font-bold text-gray-900">{playerId}</span>
            </div>
            <div>
              <span className="text-gray-400 block text-[10px] uppercase font-bold">Username</span>
              <span className="font-semibold text-gray-900">{playerNickname || 'Player'}</span>
            </div>
            <div>
              <span className="text-gray-400 block text-[10px] uppercase font-bold">Order Status</span>
              <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                {createdOrder?.status === 'Wuu fashilmay'
                  ? (language === 'so' ? 'Wuu Fashilmay (Dib u Sax)' : 'Failed (Retry)')
                  : (language === 'so' ? 'Sugaya Lacag-bixin (Unpaid)' : 'Awaiting Payment (Unpaid)')}
              </span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-800">
              {language === 'so' ? 'Dooro Habka Lacag-bixinta (Payment Method)' : 'Select Payment Method'}
            </label>
            <div className="grid grid-cols-2 gap-3">
              {paymentMethods
                .filter((m) => m.active)
                .slice(0, 2)
                .map((m) => {
                  const isSelected = selectedPaymentMethod?.id === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedPaymentMethod(m)}
                      className={`p-3.5 rounded-xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'border-red-600 bg-red-50/70 text-red-700 font-bold shadow-xs ring-1 ring-red-600'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white'
                      }`}
                    >
                      <span className="text-xs sm:text-sm block font-bold truncate">{m.name}</span>
                      <span className="text-[10px] text-gray-500 block mt-0.5">
                        {m.walletProvider === 'sahal' ? 'Sahal (Golis)' : 'EVC Plus'}
                      </span>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Payment Instructions & Number / USSD Code */}
          {selectedPaymentMethod && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gray-50 border border-gray-200 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  {language === 'so'
                    ? 'Koodhka Lacag-bixinta (USSD Code):'
                    : language === 'ar'
                    ? 'رمز الدفع (USSD Code):'
                    : 'Payment Code (USSD Code):'}
                </span>
                <span className="text-xs font-bold text-red-600 font-mono">
                  ${currentPrice.toFixed(2)} USD
                </span>
              </div>

              {/* Display code box */}
              <div className="p-3 rounded-xl bg-white border border-gray-200 font-mono text-base sm:text-lg font-black text-gray-900 tracking-wider text-center select-all">
                {dynamicCode}
              </div>

              <p className="text-xs text-gray-600 leading-relaxed">
                {selectedPaymentMethod.instructions || (language === 'so'
                  ? `Garaac koodhka kor ku xusan adoo isticmaalaya ${selectedPaymentMethod.name}.`
                  : language === 'ar'
                  ? `اتصل بالرمز أعلاه عبر ${selectedPaymentMethod.name}.`
                  : `Dial the payment code above using ${selectedPaymentMethod.name}.`)}
              </p>

              {/* Main Payment Action: exactly "ادفع" in Somali/Arabic and "Pay" in English with Phone Icon */}
              <div className="space-y-2.5 pt-1">
                <a
                  href={dialerHref}
                  onClick={handleDialerClick}
                  className="w-full py-3.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-black text-base sm:text-lg transition-colors flex items-center justify-center gap-2.5 shadow-sm cursor-pointer active:scale-98 text-center"
                  aria-label={language === 'en' ? 'Pay' : 'ادفع'}
                >
                  <Phone className="w-5 h-5 text-white shrink-0" />
                  <span>{language === 'en' ? 'Pay' : 'ادفع'}</span>
                </a>

                {/* Secondary Option: Copy payment code if automatic opening is unsupported */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="text-[11px] text-gray-500">
                    {language === 'en'
                      ? 'If dialer does not open automatically:'
                      : language === 'ar'
                      ? 'إذا لم تُفتح شاشة الاتصال تلقائياً:'
                      : 'Haddii taleefanku uusan toos u furmin:'}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyAccount}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-red-600 font-bold text-xs cursor-pointer shadow-2xs transition-colors shrink-0"
                  >
                    {copiedAccount ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>
                      {copiedAccount
                        ? (language === 'en' ? 'Copied' : (language === 'ar' ? 'تم النسخ' : 'La koobiyeeyay'))
                        : (language === 'en' ? 'Copy Code' : (language === 'ar' ? 'نسخ الرمز' : 'Koobiyeey Koodhka'))}
                    </span>
                  </button>
                </div>
              </div>

              {/* Official Security PIN Notice: Customer enters PIN in phone dialer ONLY */}
              <div className="p-3 rounded-xl bg-amber-50/90 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900">
                <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-0.5 leading-relaxed text-[11px] sm:text-xs">
                  <span className="font-bold block text-amber-950">
                    {language === 'en'
                      ? 'Security Notice'
                      : language === 'ar'
                      ? 'تنبيه أمان'
                      : 'Ogeysiis Amni'}
                  </span>
                  <p>
                    {language === 'en'
                      ? 'Enter your mobile wallet PIN in your phone’s official dialer interface only. Never enter your PIN on this website.'
                      : language === 'ar'
                      ? 'أدخل رمز PIN الخاص بمحفظتك في شاشة الاتصال الرسمية بهاتفك فقط، ولا تدخل رمز PIN أبداً في هذا الموقع.'
                      : 'Fadlan PIN-kaaga sirta ah ku geli shaashadda rasmiga ah ee taleefankaaga oo keliya, marna halkan ha gelin.'}
                  </p>
                </div>
              </div>

              {/* Informational notification after dialer is tapped */}
              {dialerOpened && (
                <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200 text-blue-900 text-xs flex items-start gap-2 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span className="text-[11px] sm:text-xs leading-relaxed">
                    {language === 'en'
                      ? 'Dialer launched. After transferring money, enter your details below to submit for admin confirmation.'
                      : language === 'ar'
                      ? 'تم فتح شاشة الاتصال. بعد إتمام التحويل، أدخل بياناتك أدناه للتأكيد من قبل الإدارة.'
                      : 'Shaashadda wicitaanka waa la furay. Markaad lacagta dirto, geli xogta hoos si maamuluhu u xaqiijiyo dalabkaaga.'}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Payment Submission Form for Verification */}
          <form onSubmit={handleConfirmPayment} className="space-y-4 pt-2 border-t border-gray-100">
            {/* Field 1: Sender Phone Number (REQUIRED) */}
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1.5">
                {language === 'so' ? 'Lambarka aad lacagta ka dirtay' : 'Sender Phone Number'} <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={senderPhone}
                onChange={(e) => setSenderPhone(e.target.value)}
                placeholder="Tusaale: 61xxxxxxx ama 62xxxxxxx"
                className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-base sm:text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 font-mono transition-all"
              />
              <span className="text-[11px] text-gray-400 mt-1 block">
                {language === 'so'
                  ? 'Lambarka aad ka soo wareejisay lacagta si maamuluhu u hubiyo.'
                  : 'The phone number from which the money was sent for verification.'}
              </span>
            </div>



            {/* Field 3: Optional Receipt Image Upload */}
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1.5">
                {language === 'so' ? 'Sawirka Rasiidka (Ikhtiyaari)' : 'Transfer Receipt Image (Optional)'}
              </label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 cursor-pointer shadow-xs transition-colors">
                  <Upload className="w-4 h-4 text-red-600" />
                  <span>{receiptImage ? (language === 'so' ? 'Beddel Sawirka' : 'Change Receipt') : (language === 'so' ? 'Soo geli Sawirka' : 'Upload Receipt')}</span>
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/jpg"
                    onChange={handleReceiptUpload}
                    className="hidden"
                  />
                </label>
                {receiptImage && (
                  <span className="text-xs text-green-700 font-medium flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    {language === 'so' ? 'Sawirka waa la doortay' : 'Receipt uploaded'}
                  </span>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:opacity-50 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-98"
            >
              {isSubmitting ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" />
                  <span>{language === 'so' ? 'Waa la gudbinayaa...' : 'Submitting for Verification...'}</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>{language === 'so' ? 'Gudbi Xaqiijinta Lacagta' : 'Submit Payment for Verification'}</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* STEP 3: ORDER SUBMITTED & PAYMENT VERIFICATION PENDING */}
      {step === 'completed' && createdOrder && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-xs text-center space-y-5">
          <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mx-auto">
            <Clock className="w-8 h-8 animate-pulse" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-lg sm:text-xl font-black text-gray-900">
              {language === 'so'
                ? 'Codsiga Xaqiijinta Lacagta Waa La Gudbiyay!'
                : 'Payment Verification Pending'}
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
              {language === 'so'
                ? 'Waxaa socota hubinta lacag-bixintaada (Verification Queue). Looma aqoonsanayo in dalabku dhammaystirmay ilaa maamuluhu ka xaqiijiyo xogta lacagta. PUBG UC-ga waxaa toos loogu shubi doonaa koontadaada marka xaqiijintu guulaysato.'
                : 'Your payment details have been submitted and are in the verification queue. UC top-up fulfillment will be executed once confirmed by admin records.'}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 max-w-sm mx-auto text-left space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Order ID:</span>
              <span className="font-mono font-bold text-red-600">{createdOrder.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Player ID:</span>
              <span className="font-mono font-semibold text-gray-900">{createdOrder.playerId}</span>
            </div>
            {createdOrder.playerNickname && (
              <div className="flex justify-between">
                <span className="text-gray-500">Nickname:</span>
                <span className="font-semibold text-gray-900">{createdOrder.playerNickname}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">{language === 'so' ? 'Xirmo:' : 'Package:'}</span>
              <span className="font-semibold text-gray-900">{createdOrder.packageCredits}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{language === 'so' ? 'Qiimaha:' : 'Amount:'}</span>
              <span className="font-bold text-gray-900">${createdOrder.price.toFixed(2)} USD</span>
            </div>
            {createdOrder.senderPhoneNumber && (
              <div className="flex justify-between">
                <span className="text-gray-500">{language === 'so' ? 'Tel Diraha:' : 'Sender Phone:'}</span>
                <span className="font-mono text-gray-900">{createdOrder.senderPhoneNumber}</span>
              </div>
            )}
            {createdOrder.transactionReference && (
              <div className="flex justify-between">
                <span className="text-gray-500">{language === 'so' ? 'Tixraac:' : 'Ref No:'}</span>
                <span className="font-mono text-gray-900">{createdOrder.transactionReference}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-1 border-t border-gray-200">
              <span className="text-gray-500">{language === 'so' ? 'Xaaladda:' : 'Status:'}</span>
              <span className="font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[11px]">
                {language === 'so' ? 'Sugaya Hubin (Payment Verification Pending)' : 'Payment Verification Pending'}
              </span>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            {onViewOrders && (
              <button
                type="button"
                onClick={onViewOrders}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1.5 active:scale-98"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{language === 'so' ? 'Fiiri Dalabyadayda' : 'View My Orders'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onBack}
              className="px-5 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-xs transition-colors cursor-pointer"
            >
              {language === 'so' ? 'Ku noqo Bogga Hore' : 'Back to Home'}
            </button>
          </div>
        </div>
      )}

      {/* Customer Account Login / Register Modal */}
      <CustomerAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onNavigateToOrders={onViewOrders}
      />
    </div>
  );
};
