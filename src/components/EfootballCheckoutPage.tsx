import React, { useState, useEffect, useRef } from 'react';
import { GamePackage, PaymentMethod, Order } from '../types';
import { getGuestSessionId, addSessionOrderId } from '../services/storage';
import {
  ArrowLeft,
  Mail,
  ShieldCheck,
  AlertCircle,
  Clock,
  CheckCircle2,
  Copy,
  Check,
  RefreshCw,
  Phone,
  MessageCircle,
  ArrowRight,
  ShoppingBag,
} from 'lucide-react';

interface EfootballCheckoutPageProps {
  packageItem: GamePackage;
  paymentMethods: PaymentMethod[];
  onBack: () => void;
  onOrderCreated: (order: Order) => void;
  onViewOrders?: () => void;
}

export const EfootballCheckoutPage: React.FC<EfootballCheckoutPageProps> = ({
  packageItem,
  paymentMethods,
  onBack,
  onOrderCreated,
  onViewOrders,
}) => {
  // Step 1: details | Step 2: enter_code | Step 3: waiting | Step 4: payment | Step 5: completed
  const [step, setStep] = useState<'details' | 'enter_code' | 'waiting' | 'payment' | 'completed'>('details');

  // Step 1: Player info
  const [playerId, setPlayerId] = useState('');
  const [email, setEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Verification request session tokens
  const [requestId, setRequestId] = useState<string>('');
  const [orderId, setOrderId] = useState<string>('');
  const [clientToken, setClientToken] = useState<string>('');

  // Step 2: Verification code input
  const [verificationCode, setVerificationCode] = useState('');

  // Step 3: Waiting status & 5-minute countdown
  const [waitingStatus, setWaitingStatus] = useState<string>('code_submitted_pending_admin');
  const [rejectReason, setRejectReason] = useState<string>('');
  const [secondsRemaining, setSecondsRemaining] = useState<number>(300); // 5 minutes = 300s
  const [isTimeout, setIsTimeout] = useState<boolean>(false);
  const pollTimerRef = useRef<any>(null);

  // Step 4: Payment
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>(
    paymentMethods.find((m) => m.active) || paymentMethods[0]
  );
  const [senderPhone, setSenderPhone] = useState('');
  const [copiedAccount, setCopiedAccount] = useState(false);

  // Step 5: Final Order
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  // Step 1: Submit Player ID & Email to initiate verification
  const handleInitiateVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanPlayerId = playerId.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanPlayerId) {
      setErrorMsg('Fadlan geli Player ID-gaaga eFootball.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setErrorMsg('Fadlan geli cinwaan iimayl sax ah (tusaale: magac@gmail.com).');
      return;
    }

    setIsSubmitting(true);

    try {
      const guestSessionId = getGuestSessionId();
      const response = await fetch('/api/checkout/efootball/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: packageItem.id,
          price: packageItem.price,
          playerId: cleanPlayerId,
          email: cleanEmail,
          guestSessionId,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        setErrorMsg(data.error || 'Khalad ayaa dhacay xilliga codsiga la bilaabayay.');
        setIsSubmitting(false);
        return;
      }

      if (data.orderId) {
        addSessionOrderId(data.orderId);
      }

      setRequestId(data.requestId);
      setOrderId(data.orderId);
      setClientToken(data.clientToken);
      setStep('enter_code');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Initiate error:', err);
      setErrorMsg('Khalad xagga xiriirka ah ayaa dhacay.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Submit Verification Code
  const handleSubmitCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanCode = verificationCode.trim();
    if (!cleanCode) {
      setErrorMsg('Fadlan geli koodhka xaqiijinta ee laguu soo diray iimaylkaaga.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/checkout/efootball/submit-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          clientToken,
          code: cleanCode,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        setErrorMsg(data.error || 'Khalad ayaa dhacay xilliga koodhka la gudbinayay.');
        setIsSubmitting(false);
        return;
      }

      setStep('waiting');
      setWaitingStatus('code_submitted_pending_admin');
      setSecondsRemaining(300);
      setIsTimeout(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Submit code error:', err);
      setErrorMsg('Khalad xagga xiriirka ah ayaa dhacay.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 3: Waiting Poll & Countdown Timer
  useEffect(() => {
    if (step !== 'waiting' || !requestId) {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      return;
    }

    // 1-second countdown interval
    const countdownInterval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          setIsTimeout(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // 3-second backend polling interval
    const pollBackend = async () => {
      try {
        const response = await fetch(`/api/checkout/efootball/status/${requestId}`, {
          headers: {
            'x-client-token': clientToken,
          },
        });

        if (!response.ok) return;

        const data = await response.json();
        setWaitingStatus(data.status);

        if (data.status === 'verified') {
          // Admin APPROVED! Advance directly to payment step
          clearInterval(pollTimerRef.current);
          clearInterval(countdownInterval);
          setStep('payment');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else if (data.status === 'verification_failed') {
          setRejectReason(data.rejectReason || 'Xaqiijinta waa lagu guulaysan waayay.');
        } else if (data.status === 'expired' || data.isTimeout) {
          setIsTimeout(true);
        }
      } catch (e) {
        console.error('Polling error:', e);
      }
    };

    // Initial check + recurring poll
    pollBackend();
    pollTimerRef.current = setInterval(pollBackend, 3000);

    return () => {
      clearInterval(countdownInterval);
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [step, requestId, clientToken]);

  // Step 4: Submit Payment
  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanPhone = senderPhone.trim();
    if (!cleanPhone) {
      setErrorMsg('Fadlan geli lambarka aad lacagta ka dirtay.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/checkout/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          clientToken,
          paymentMethodId: selectedPaymentMethod?.id || 'evc-plus',
          paymentMethodName: selectedPaymentMethod?.name || 'EVC Plus',
          senderPhoneNumber: cleanPhone,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        setErrorMsg(data.error || 'Khalad ayaa dhacay xilliga bixinta lacagta la gudbinayay.');
        setIsSubmitting(false);
        return;
      }

      if (data.order?.id) {
        addSessionOrderId(data.order.id);
      } else if (orderId) {
        addSessionOrderId(orderId);
      }

      setCompletedOrder(data.order);
      onOrderCreated(data.order);
      setStep('completed');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Payment error:', err);
      setErrorMsg('Khalad xagga xiriirka ah ayaa dhacay.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyAccount = () => {
    if (!selectedPaymentMethod) return;
    navigator.clipboard.writeText(selectedPaymentMethod.accountNumber);
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2000);
  };

  // Format countdown mm:ss
  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 sm:space-y-8 animate-fadeIn pb-12">
      {/* Top Header & Back Navigation */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <button
          type="button"
          onClick={
            step === 'enter_code'
              ? () => setStep('details')
              : step === 'waiting'
              ? () => setStep('enter_code')
              : onBack
          }
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs sm:text-sm font-semibold transition-colors cursor-pointer shadow-xs"
        >
          <ArrowLeft className="w-4 h-4 text-blue-600" />
          <span>Dib u noqo</span>
        </button>

        <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md">
          eFootball Coins
        </span>
      </div>

      {/* Selected Package Summary Card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-xs shrink-0">
            Coins
          </div>
          <div>
            <span className="text-[11px] text-gray-500 font-medium">Xirmada aad dooratay</span>
            <h2 className="text-base sm:text-lg font-extrabold text-gray-900 tracking-tight">
              {packageItem.credits} ({packageItem.name})
            </h2>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="text-[11px] text-gray-500 block">Qiimaha rasmiga ah</span>
          <span className="text-lg sm:text-xl font-black text-blue-600 tabular-nums">
            ${packageItem.price.toFixed(2)} USD
          </span>
        </div>
      </div>

      {/* Progress Indicators */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs font-semibold">
        <div
          className={`py-2 rounded-xl border transition-colors ${
            step === 'details'
              ? 'border-blue-600 bg-blue-50 text-blue-700'
              : 'border-gray-200 bg-gray-50 text-gray-500'
          }`}
        >
          1. Xogta Koontada
        </div>
        <div
          className={`py-2 rounded-xl border transition-colors ${
            step === 'enter_code' || step === 'waiting'
              ? 'border-blue-600 bg-blue-50 text-blue-700'
              : 'border-gray-200 bg-gray-50 text-gray-500'
          }`}
        >
          2. Xaqiijinta Iimaylka
        </div>
        <div
          className={`py-2 rounded-xl border transition-colors ${
            step === 'payment' || step === 'completed'
              ? 'border-blue-600 bg-blue-50 text-blue-700'
              : 'border-gray-200 bg-gray-50 text-gray-500'
          }`}
        >
          3. Lacag-bixin
        </div>
      </div>

      {/* STEP 1: PLAYER ID & EMAIL INPUT */}
      {step === 'details' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-xs space-y-5">
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-gray-900">
              Geli Xogta eFootball
            </h3>
            <p className="text-xs text-gray-500">
              eFootball waxay u baahan tahay xaqiijin iimayl ah ka hor inta aan lacagta la bixin.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleInitiateVerification} className="space-y-4">
            {/* Field 1: Player ID */}
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1.5">
                Player ID (eFootball) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={playerId}
                onChange={(e) => setPlayerId(e.target.value)}
                placeholder="Tusaale: 987654321"
                className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-base sm:text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-mono transition-all"
              />
            </div>

            {/* Field 2: Email Address */}
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1.5">
                Cinwaanka Iimaylka <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Tusaale: magacaaga@gmail.com"
                className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-base sm:text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all"
              />
              <span className="text-[11px] text-gray-400 mt-1 block">
                Maamulaha ayaa koodhka xaqiijinta kuugu soo diri doona iimaylkan.
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-100 text-xs text-blue-900 space-y-1">
              <span className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-600" /> Nidaamka Xaqiijinta:
              </span>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                Marnaba kuma waydiinayno lambarka sirta ah ee KONAMI ama iimaylkaaga. Waxaad kaliya gelisaa koodhka uu maamuluhu kuugu soo diro iimaylka.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer mt-2"
            >
              <span>{isSubmitting ? 'Waa la diiwaangelinayaa...' : 'Sii wad'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* STEP 2: ENTER THE EMAIL CODE */}
      {step === 'enter_code' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-xs space-y-5">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-base sm:text-lg font-bold text-gray-900">
              Geli Koodhka Xaqiijinta
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Geli koodhka xaqiijinta ee laguu soo diray iimaylkaaga: <strong className="text-gray-900 font-mono">{email}</strong>.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmitCode} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1.5 text-center sm:text-left">
                Koodhka Xaqiijinta (Verification Code) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="Tusaale: 654321"
                className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-center text-lg sm:text-xl font-mono font-bold tracking-widest text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all"
              />
              <span className="text-[11px] text-gray-400 mt-1 block text-center">
                Hubi Inbox-ka ama Spam folder-ka iimaylkaaga.
              </span>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setStep('details')}
                className="py-3 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Sax Iimaylka
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <span>{isSubmitting ? 'Waa la hubinayaa...' : 'Xaqiiji Koodhka'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STEP 3: CUSTOMER WAITING SCREEN (MAX 5 MIN TIMEOUT) */}
      {step === 'waiting' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-xs text-center space-y-6">
          {waitingStatus === 'verification_failed' ? (
            /* FAILED STATE */
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-full bg-red-50 border border-red-200 flex items-center justify-center text-red-600 mx-auto">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg sm:text-xl font-black text-gray-900">
                  Xaqiijintu Way Fashilantay
                </h3>
                <p className="text-xs sm:text-sm text-red-600 max-w-md mx-auto">
                  {rejectReason || 'Waa lagu guulaysan waayay xaqiijinta. Fadlan hubi xogtaada oo mar kale isku day.'}
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setVerificationCode('');
                    setStep('enter_code');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                >
                  Mar Kale Isku Day (Geli Koodhka)
                </button>
              </div>
            </div>
          ) : isTimeout ? (
            /* TIMEOUT STATE (5 MINUTES ELAPSED) */
            <div className="space-y-4">
              <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mx-auto">
                <Clock className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg sm:text-xl font-black text-gray-900">
                  Waqtigii Xaqiijinta Wuu Dhacay (Timeout)
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 max-w-md mx-auto">
                  Maamuluhu weli ma xaqiijin koodhkaaga 5 daqiiqo gudahood. Fadlan dib u codso ama la xiriir taageerada WhatsApp.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <button
                  type="button"
                  onClick={() => setStep('enter_code')}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                >
                  Dib u Gudbi Koodhka
                </button>
                <a
                  href="https://wa.me/252615482390"
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>La xiriir WhatsApp</span>
                </a>
              </div>
            </div>
          ) : (
            /* ACTIVE WAITING STATE */
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-full bg-blue-50 border-2 border-blue-200 flex items-center justify-center text-blue-600 mx-auto relative">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg sm:text-xl font-black text-gray-900">
                  Sugaya Xaqiijinta Maamulka...
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
                  Codsigaaga waa la helay. Waxaan sugaynaa xaqiijinta maamulka. Fadlan sug inta maamuluhu koodhka ku xaqiijinayo.
                </p>
              </div>

              {/* Real-time countdown timer */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 border border-gray-200 font-mono text-sm font-bold text-gray-800">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>Waqtiga haray: {formatCountdown(secondsRemaining)}</span>
              </div>

              <p className="text-[11px] text-gray-400">
                Shaashaddani si toos ah ayay isu cusboonaysiinaysaa marka maamuluhu oggolaado. Ha xirin boggan.
              </p>
            </div>
          )}
        </div>
      )}

      {/* STEP 4: PAYMENT FLOW (ONLY ACCESSIBLE WHEN VERIFIED) */}
      {step === 'payment' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-xs space-y-6">
          <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-green-800 flex items-center gap-2 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span>Xaqiijinta Waa Lagu Guulaystay! Fadlan bixi lacagta.</span>
          </div>

          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-gray-900">
              Dhammaystir Lacag-bixinta Coins
            </h3>
            <p className="text-xs text-gray-500">
              U dir lacagta akoonka hoose, kadibna geli lambarka aad lacagta ka dirtay.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Payment Method Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-800">
              Dooro Habka Lacag-bixinta
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {paymentMethods
                .filter((m) => m.active)
                .map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedPaymentMethod(m)}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      selectedPaymentMethod?.id === m.id
                        ? 'border-blue-600 bg-blue-50/70 text-blue-700 font-bold shadow-xs ring-1 ring-blue-600'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white'
                    }`}
                  >
                    <span className="text-xs block truncate">{m.name}</span>
                  </button>
                ))}
            </div>
          </div>

          {/* Payment Instructions & Number */}
          {selectedPaymentMethod && (
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Lambarka Akoonka / USSD:
                </span>
                <button
                  type="button"
                  onClick={handleCopyAccount}
                  className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  {copiedAccount ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedAccount ? 'La guriyay' : 'Koobiyeey'}</span>
                </button>
              </div>

              <div className="p-2.5 rounded-lg bg-white border border-gray-200 font-mono text-sm sm:text-base font-extrabold text-gray-900 tracking-wide text-center">
                {selectedPaymentMethod.accountNumber}
              </div>

              <p className="text-xs text-gray-600 leading-relaxed">
                {selectedPaymentMethod.instructions}
              </p>
            </div>
          )}

          {/* Sender Phone Form */}
          <form onSubmit={handleConfirmPayment} className="space-y-4 pt-2 border-t border-gray-100">
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1.5">
                Lambarka aad lacagta ka dirtay <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={senderPhone}
                onChange={(e) => setSenderPhone(e.target.value)}
                placeholder="Tusaale: 61xxxxxxx ama 62xxxxxxx"
                className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-base sm:text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-mono transition-all"
              />
              <span className="text-[11px] text-gray-400 mt-1 block">
                Lambarkani wuxuu muhiim u yahay in maamuluhu ku xaqiijiyo bixinta lacagtaada.
              </span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isSubmitting ? 'Waa la gudbinayaa...' : 'Xaqiiji Bixinta Lacagta'}</span>
            </button>
          </form>
        </div>
      )}

      {/* STEP 5: COMPLETED STATE */}
      {step === 'completed' && completedOrder && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-xs text-center space-y-5">
          <div className="w-14 h-14 rounded-full bg-green-50 border border-green-200 flex items-center justify-center text-green-600 mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h3 className="text-lg sm:text-xl font-black text-gray-900">
              Dalabkaaga Si Guul Leh Ayaa Loo Gudbiyay!
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 max-w-md mx-auto">
              Waxaa socota hubinta lacag-bixintaada. Coins-ka waxaa toos loogu shubi doonaa koontadaada eFootball dhowr daqiiqo gudahood.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 max-w-sm mx-auto text-left space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Tixraaca Dalabka:</span>
              <span className="font-mono font-bold text-blue-600">{completedOrder.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Player ID:</span>
              <span className="font-mono font-semibold text-gray-900">{completedOrder.playerId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Iimayl:</span>
              <span className="font-semibold text-gray-900">{completedOrder.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Xirmo:</span>
              <span className="font-semibold text-gray-900">{completedOrder.packageCredits}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Xaaladda:</span>
              <span className="font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                {completedOrder.status}
              </span>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            {onViewOrders && (
              <button
                type="button"
                onClick={onViewOrders}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Fiiri Dalabyadayda</span>
              </button>
            )}
            <button
              type="button"
              onClick={onBack}
              className="px-5 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-xs transition-colors cursor-pointer"
            >
              Ku noqo Bogga Hore
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
