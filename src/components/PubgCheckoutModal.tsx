import React, { useState } from 'react';
import { GamePackage, PaymentMethod, Order } from '../types';
import { createFinalPubgOrder } from '../services/storage';
import {
  X,
  Copy,
  Check,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Clock,
  Phone,
} from 'lucide-react';

interface PubgCheckoutModalProps {
  initialPackage?: GamePackage;
  packages: GamePackage[];
  paymentMethods: PaymentMethod[];
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated?: (order: Order) => void;
}

export const PubgCheckoutModal: React.FC<PubgCheckoutModalProps> = ({
  initialPackage,
  packages,
  paymentMethods,
  isOpen,
  onClose,
  onOrderCreated,
}) => {
  const pubgPackages = packages.filter((p) => p.game === 'PUBG Mobile' && p.active);

  // Selected package
  const [selectedPkg, setSelectedPkg] = useState<GamePackage | undefined>(
    initialPackage || pubgPackages[0]
  );

  // Step 1: Info (Player ID & Nickname) -> Step 2: Payment Instructions & Sender Phone -> Step 3: Complete
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Customer inputs
  const [playerId, setPlayerId] = useState('');
  const [nickname, setNickname] = useState('');
  const [validationError, setValidationError] = useState('');

  // Payment inputs
  const activeMethods = paymentMethods.filter((m) => m.active);
  const [selectedMethodId, setSelectedMethodId] = useState<string>(
    activeMethods[0]?.id || ''
  );
  const [senderPhone, setSenderPhone] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Final created order
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);

  if (!isOpen) return null;

  const currentMethod =
    activeMethods.find((m) => m.id === selectedMethodId) || activeMethods[0];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleProceedToPayment = () => {
    setValidationError('');

    if (!selectedPkg) {
      setValidationError('Fadlan dooro xirmo aad rabto inaad iibsato.');
      return;
    }

    if (!playerId.trim()) {
      setValidationError('Fadlan geli Player ID-gaaga PUBG Mobile.');
      return;
    }

    if (!nickname.trim()) {
      setValidationError('Fadlan geli Magaca aad ku dhex leedahay ciyaarta (Nickname).');
      return;
    }

    setStep(2);
  };

  const handleSubmitConfirmation = async () => {
    if (!senderPhone.trim()) {
      setPaymentError('Fadlan geli lambarka aad lacagta ka dirtay.');
      return;
    }

    if (!currentMethod) {
      setPaymentError('Fadlan dooro habka lacag-bixinta.');
      return;
    }

    setIsSubmitting(true);
    setPaymentError('');

    try {
      const result = await createFinalPubgOrder({
        packageId: selectedPkg!.id,
        packageName: selectedPkg!.name,
        packageCredits: selectedPkg!.credits,
        price: selectedPkg!.price,
        playerId: playerId.trim(),
        playerNickname: nickname.trim(),
        paymentMethodId: currentMethod.id,
        paymentMethodName: currentMethod.name,
        senderPhoneNumber: senderPhone.trim(),
      });

      if (result.success && result.order) {
        setCreatedOrder(result.order);
        setStep(3);
        if (onOrderCreated) {
          onOrderCreated(result.order);
        }
      } else {
        setPaymentError(result.error || 'Ma suuragelin in la gudbiyo dalabka. Fadlan isku day markale.');
      }
    } catch (e: any) {
      setPaymentError(`Khalad: ${e.message || 'Lama garanayo'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setStep(1);
    setPlayerId('');
    setNickname('');
    setSenderPhone('');
    setCreatedOrder(null);
    setPaymentError('');
    setValidationError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden my-6">
        {/* Header */}
        <div className="bg-gray-50 border-b border-gray-200 p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center font-bold text-blue-700 text-xs">
              UC
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 tracking-tight">
                Shubashada PUBG Mobile
              </h2>
              <p className="text-xs text-gray-500">
                {step === 1 && 'Tallaabada 1: Xirmo & Xogta Ciyaaryahanka'}
                {step === 2 && 'Tallaabada 2: Lacag-bixin & Lambarka Diraha'}
                {step === 3 && 'Tallaabada 3: Dalabka Waa La Gudbiyay'}
              </p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Xir"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* STEP 1: Select Package & Enter Player Details */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  1. Dooro Xirmada UC
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                  {pubgPackages.map((pkg) => {
                    const isSelected = selectedPkg?.id === pkg.id;
                    return (
                      <button
                        key={pkg.id}
                        type="button"
                        onClick={() => setSelectedPkg(pkg)}
                        className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50 border-blue-600 text-blue-950 font-medium'
                            : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-xs font-bold truncate">{pkg.credits}</div>
                        <div className="text-xs font-semibold text-blue-600 tabular-nums">
                          ${pkg.price.toFixed(2)}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedPkg && (
                <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-gray-900">{selectedPkg.name}</span>
                    <span className="text-gray-500 block text-[11px]">{selectedPkg.description}</span>
                  </div>
                  <div className="font-bold text-blue-600 text-sm tabular-nums">
                    ${selectedPkg.price.toFixed(2)}
                  </div>
                </div>
              )}

              {/* Player Info */}
              <div className="space-y-3 pt-1">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  2. ID-ga Ciyaaryahanka & Nickname
                </label>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Player ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={playerId}
                    onChange={(e) => setPlayerId(e.target.value)}
                    placeholder="Tusaale: 519284710"
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Nickname (Magaca Ciyaarta) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="Tusaale: SomaaliSniper"
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              {validationError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleProceedToPayment}
                className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs tracking-wide transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <span>Sii wad</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 2: Payment Instructions & Sender Phone Number */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-gray-500">Xirmo: </span>
                  <span className="font-bold text-gray-900">{selectedPkg?.credits}</span>
                  <span className="text-gray-500"> · ID: </span>
                  <span className="font-bold text-blue-600">{playerId}</span>
                </div>
                <div className="font-bold text-blue-600 text-sm tabular-nums">
                  ${selectedPkg?.price.toFixed(2)}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  Dooro Habka Lacag-bixinta
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {activeMethods.map((m) => {
                    const isSelected = m.id === currentMethod?.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedMethodId(m.id)}
                        className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50 border-blue-600 text-blue-900 font-bold'
                            : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-xs font-medium">{m.name}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {currentMethod && (
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 font-medium">Lambarka / Code:</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(currentMethod.accountNumber)}
                      className="text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer font-semibold"
                    >
                      {copiedText === currentMethod.accountNumber ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-green-600" />
                          <span className="text-green-600">Nuqul baa la qaatay</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Nuqul ka qaad</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="p-2 rounded-lg bg-white border border-gray-200 font-mono text-xs font-bold text-blue-700 break-all select-all">
                    {currentMethod.accountNumber}
                  </div>

                  <div className="flex items-center justify-between text-gray-600">
                    <span>Magaca Koontada:</span>
                    <span className="text-gray-900 font-medium">{currentMethod.accountHolder}</span>
                  </div>

                  <div className="flex items-center justify-between text-gray-600">
                    <span>Lacagta la bixinayo:</span>
                    <span className="text-gray-900 font-bold tabular-nums">
                      ${selectedPkg?.price.toFixed(2)} USD
                    </span>
                  </div>

                  <p className="text-[11px] text-gray-500 leading-relaxed pt-1 border-t border-gray-200">
                    {currentMethod.instructions}
                  </p>
                </div>
              )}

              {/* Sender Phone Number Input */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-700">
                  Lambarka aad lacagta ka dirtay <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={senderPhone}
                    onChange={(e) => setSenderPhone(e.target.value)}
                    placeholder="Tusaale: 0615482390"
                    className="w-full bg-white border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-mono"
                  />
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
                <p className="text-[11px] text-gray-500">
                  Geli lambarka aad u isticmaashay wareejinta lacagta si maamuluhu u xaqiijiyo.
                </p>
              </div>

              {paymentError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{paymentError}</span>
                </div>
              )}

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-3.5 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Dib</span>
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSubmitConfirmation}
                  className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  {isSubmitting ? (
                    <span>La gudbinayaa...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Xaqiiji Bixinta</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Order Created Confirmation */}
          {step === 3 && createdOrder && (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto text-green-600">
                <CheckCircle2 className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-base font-bold text-gray-900 tracking-tight">
                  Dalabkaaga Waa La Gudbiyay
                </h3>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                  Lacag-bixintaada waxaa hadda hubinaya maamulaha si loogu shubo UC.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-left space-y-2 text-xs max-w-sm mx-auto">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Lambarka Dalabka:</span>
                  <span className="font-mono font-bold text-blue-600">{createdOrder.id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Xirmo:</span>
                  <span className="font-medium text-gray-900">{createdOrder.packageName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Player ID:</span>
                  <span className="font-medium text-gray-900">{createdOrder.playerId}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Lambarka Diraha:</span>
                  <span className="font-mono text-gray-900">{createdOrder.senderPhoneNumber}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                  <span className="text-gray-500">Xaaladda:</span>
                  <span className="font-semibold text-blue-600 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{createdOrder.status}</span>
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="w-full py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Xir
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
