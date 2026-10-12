import React, { useState } from 'react';
import { GamePackage, PaymentMethod, Order } from '../types';
import { getGuestSessionId, addSessionOrderId } from '../services/storage';
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
} from 'lucide-react';

interface PubgCheckoutPageProps {
  packageItem: GamePackage;
  paymentMethods: PaymentMethod[];
  onBack: () => void;
  onOrderCreated: (order: Order) => void;
  onViewOrders?: () => void;
}

export const PubgCheckoutPage: React.FC<PubgCheckoutPageProps> = ({
  packageItem,
  paymentMethods,
  onBack,
  onOrderCreated,
  onViewOrders,
}) => {
  // Step 1: Player details | Step 2: Payment | Step 3: Success
  const [step, setStep] = useState<'details' | 'payment' | 'completed'>('details');

  // Form inputs
  const [playerId, setPlayerId] = useState('');
  const [playerNickname, setPlayerNickname] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Payment inputs
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>(
    paymentMethods.find((m) => m.active) || paymentMethods[0]
  );
  const [senderPhone, setSenderPhone] = useState('');
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Resulting Order
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);

  // Validate Step 1 (Player Details)
  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanId = playerId.trim();
    const cleanNick = playerNickname.trim();

    if (!cleanId) {
      setErrorMsg('Fadlan geli Player ID-gaaga PUBG Mobile.');
      return;
    }
    if (!/^\d{5,15}$/.test(cleanId)) {
      setErrorMsg('Player ID waa inuu ka koobnaadaa tiro sax ah (tusaale: 5123456789).');
      return;
    }
    if (!cleanNick) {
      setErrorMsg('Fadlan geli magacaaga ciyaarta (In-game nickname).');
      return;
    }

    setStep('payment');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Submit Final Payment (Step 2)
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
      // Call server endpoint
      const guestSessionId = getGuestSessionId();
      const response = await fetch('/api/checkout/pubg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: packageItem.id,
          price: packageItem.price,
          playerId: playerId.trim(),
          playerNickname: playerNickname.trim(),
          paymentMethodId: selectedPaymentMethod?.id || 'evc-plus',
          paymentMethodName: selectedPaymentMethod?.name || 'EVC Plus',
          senderPhoneNumber: cleanPhone,
          guestSessionId,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setErrorMsg(data.error || 'Khalad ayaa dhacay xilliga dalabka la gudbinayay.');
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
      console.error('Pubg checkout error:', err);
      setErrorMsg('Khalad xagga xiriirka ah ayaa dhacay. Fadlan hubi khadkaaga internet-ka.');
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

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 sm:space-y-8 animate-fadeIn pb-12">
      {/* Top Header & Back Navigation */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <button
          type="button"
          onClick={step === 'payment' ? () => setStep('details') : onBack}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs sm:text-sm font-semibold transition-colors cursor-pointer shadow-xs"
        >
          <ArrowLeft className="w-4 h-4 text-blue-600" />
          <span>{step === 'payment' ? 'Ku noqo Xogta' : 'Ku noqo Xirmooyinka'}</span>
        </button>

        <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md">
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

      {/* STEP 1: PLAYER DETAILS */}
      {step === 'details' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-xs space-y-5">
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-gray-900">
              Geli Xogta Ciyaartaada
            </h3>
            <p className="text-xs text-gray-500">
              Fadlan si sax ah u geli Player ID-ga iyo Nickname-ka si toos loogu shubo UC-ga.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleProceedToPayment} className="space-y-4">
            {/* Field 1: Player ID */}
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1.5">
                Player ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={playerId}
                onChange={(e) => setPlayerId(e.target.value)}
                placeholder="Tusaale: 5123456789"
                className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-base sm:text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-mono transition-all"
              />
              <span className="text-[11px] text-gray-400 mt-1 block">
                Player ID-gaaga waxaa ka helaysaa astaanta koontadaada PUBG Mobile (Profile).
              </span>
            </div>

            {/* Field 2: Nickname */}
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1.5">
                In-game Nickname (Magaca Ciyaarta) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={playerNickname}
                onChange={(e) => setPlayerNickname(e.target.value)}
                placeholder="Tusaale: SomaliWarrior"
                className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-base sm:text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all"
              />
              <span className="text-[11px] text-gray-400 mt-1 block">
                Magacaaga lagu yaqaanno gudaha ciyaarta si loogu xaqiijiyo akoonka.
              </span>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer mt-2"
            >
              <span>Sii wad (Lacag-bixin)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* STEP 2: PAYMENT FLOW */}
      {step === 'payment' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-xs space-y-6">
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-gray-900">
              Dhammaystir Lacag-bixinta
            </h3>
            <p className="text-xs text-gray-500">
              Dooro habka aad ku bixinayso lacagta, lacagta u dir akoonka, kadibna geli lambarka aad ka dirtay.
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

      {/* STEP 3: ORDER COMPLETED & AWAITING REVIEW */}
      {step === 'completed' && createdOrder && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-xs text-center space-y-5">
          <div className="w-14 h-14 rounded-full bg-green-50 border border-green-200 flex items-center justify-center text-green-600 mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h3 className="text-lg sm:text-xl font-black text-gray-900">
              Dalabkaaga Si Guul Leh Ayaa Loo Gudbiyay!
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 max-w-md mx-auto">
              Waxaa socota hubinta lacag-bixintaada. UC-ga waxaa toos loogu shubi doonaa koontadaada PUBG Mobile dhowr daqiiqo gudahood.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 max-w-sm mx-auto text-left space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Tixraaca Dalabka:</span>
              <span className="font-mono font-bold text-blue-600">{createdOrder.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Player ID:</span>
              <span className="font-mono font-semibold text-gray-900">{createdOrder.playerId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Nickname:</span>
              <span className="font-semibold text-gray-900">{createdOrder.playerNickname}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Xirmo:</span>
              <span className="font-semibold text-gray-900">{createdOrder.packageCredits}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Xaaladda:</span>
              <span className="font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                {createdOrder.status}
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
