import React, { useState, useEffect } from 'react';
import { GamePackage, PaymentMethod, Order } from '../types';
import {
  createEfootballOrder,
  submitEfootballVerificationCode,
  submitOrderPaymentPhone,
  getOrderById,
} from '../services/storage';
import {
  X,
  Copy,
  Check,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  Mail,
  ShieldCheck,
  Phone,
  RotateCw,
} from 'lucide-react';

interface EfootballCheckoutModalProps {
  initialPackage?: GamePackage;
  packages: GamePackage[];
  paymentMethods: PaymentMethod[];
  isOpen: boolean;
  onClose: () => void;
  onOrderUpdated?: (order: Order) => void;
}

export const EfootballCheckoutModal: React.FC<EfootballCheckoutModalProps> = ({
  initialPackage,
  packages,
  paymentMethods,
  isOpen,
  onClose,
  onOrderUpdated,
}) => {
  const efbPackages = packages.filter((p) => p.game === 'eFootball' && p.active);

  // Selected package
  const [selectedPkg, setSelectedPkg] = useState<GamePackage | undefined>(
    initialPackage || efbPackages[0]
  );

  // Workflow steps:
  // 1: Customer Details (Email & Player ID)
  // 2: Enter Verification Code
  // 3: Dedicated Waiting Screen (Hubin ku socoto / Under manual admin review)
  // 4: Payment Instructions & Sender Phone Number
  // 5: Final Order Submitted
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Customer inputs
  const [email, setEmail] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [validationError, setValidationError] = useState('');

  // Active single order
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);

  // Verification stage
  const [enteredCode, setEnteredCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [isSubmittingCode, setIsSubmittingCode] = useState(false);

  // Payment stage
  const activeMethods = paymentMethods.filter((m) => m.active);
  const [selectedMethodId, setSelectedMethodId] = useState<string>(
    activeMethods[0]?.id || ''
  );
  const [senderPhone, setSenderPhone] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Polling hook on Waiting Screen (Step 3) to pick up Admin decision (Approve / Reject)
  useEffect(() => {
    if (!isOpen || step !== 3 || !currentOrder) return;

    const interval = setInterval(() => {
      const refreshed = getOrderById(currentOrder.id);
      if (refreshed) {
        if (
          refreshed.status !== currentOrder.status ||
          refreshed.verificationDecision !== currentOrder.verificationDecision
        ) {
          setCurrentOrder(refreshed);
          if (onOrderUpdated) onOrderUpdated(refreshed);
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isOpen, step, currentOrder, onOrderUpdated]);

  if (!isOpen) return null;

  const currentMethod =
    activeMethods.find((m) => m.id === selectedMethodId) || activeMethods[0];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // STEP 2 -> 3: Validate and create exactly ONE order
  const handleCreateOrder = async () => {
    setValidationError('');

    if (!selectedPkg) {
      setValidationError('Fadlan dooro xirmo aad rabto inaad iibsato.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setValidationError('Fadlan geli cinwaan iimayl ah oo sax ah (tusaale: magac@gmail.com).');
      return;
    }

    if (!playerId.trim()) {
      setValidationError('Fadlan geli Player ID-gaaga eFootball.');
      return;
    }

    try {
      const res = await createEfootballOrder({
        packageId: selectedPkg.id,
        packageName: selectedPkg.name,
        packageCredits: selectedPkg.credits,
        price: selectedPkg.price,
        playerId: playerId.trim(),
        email: email.trim().toLowerCase(),
      });

      if (res.success && res.order) {
        setCurrentOrder(res.order);
        setStep(2); // Proceed to verification code input
        if (onOrderUpdated) {
          onOrderUpdated(res.order);
        }
      }
    } catch (e: any) {
      setValidationError(`Khalad: ${e.message}`);
    }
  };

  // STEP 4 -> 5: Customer submits the code they received from admin via Gmail
  const handleSubmitCode = async () => {
    if (!currentOrder) return;
    if (!enteredCode.trim()) {
      setCodeError('Fadlan geli koodhka xaqiijinta ee aad heshay.');
      return;
    }

    setIsSubmittingCode(true);
    setCodeError('');

    try {
      const res = await submitEfootballVerificationCode(currentOrder.id, enteredCode.trim());
      if (res.success && res.order) {
        setCurrentOrder(res.order);
        setStep(3); // Move to Dedicated Waiting Screen
        if (onOrderUpdated) {
          onOrderUpdated(res.order);
        }
      } else {
        setCodeError(res.message);
      }
    } catch (e: any) {
      setCodeError(`Khalad: ${e.message}`);
    } finally {
      setIsSubmittingCode(false);
    }
  };

  // STEP 6: Customer submits sender phone number for the payment
  const handleSubmitPayment = async () => {
    if (!currentOrder) return;
    if (!senderPhone.trim()) {
      setPaymentError('Fadlan geli lambarka aad lacagta ka dirtay.');
      return;
    }

    if (!currentMethod) {
      setPaymentError('Fadlan dooro habka lacag-bixinta.');
      return;
    }

    setIsSubmittingPayment(true);
    setPaymentError('');

    try {
      const res = await submitOrderPaymentPhone({
        orderId: currentOrder.id,
        paymentMethodId: currentMethod.id,
        paymentMethodName: currentMethod.name,
        senderPhoneNumber: senderPhone.trim(),
      });

      if (res.success && res.order) {
        setCurrentOrder(res.order);
        setStep(5); // Complete
        if (onOrderUpdated) {
          onOrderUpdated(res.order);
        }
      } else {
        setPaymentError(res.message);
      }
    } catch (e: any) {
      setPaymentError(`Khalad: ${e.message}`);
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handleResetAndClose = () => {
    setStep(1);
    setEmail('');
    setPlayerId('');
    setEnteredCode('');
    setSenderPhone('');
    setCurrentOrder(null);
    setValidationError('');
    setCodeError('');
    setPaymentError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden my-6">
        {/* Header */}
        <div className="bg-gray-50 border-b border-gray-200 p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center font-bold text-blue-700 text-xs">
              COIN
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 tracking-tight">
                Shubashada eFootball
              </h2>
              <p className="text-xs text-gray-500">
                {step === 1 && 'Tallaabada 1: Xirmo, Iimayl & Player ID'}
                {step === 2 && 'Tallaabada 2: Geli Koodhka Xaqiijinta'}
                {step === 3 && 'Tallaabada 3: Hubin ku socoto'}
                {step === 4 && 'Tallaabada 4: Bixi Lacagta & Lambarka Diraha'}
                {step === 5 && 'Tallaabada 5: Dalabka Waa La Gudbiyay'}
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
          {/* STEP 1: Select Package & Enter Email / Player ID */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  1. Dooro Xirmada Coins-ka
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-44 overflow-y-auto pr-1">
                  {efbPackages.map((pkg) => {
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

              {/* Customer Inputs */}
              <div className="space-y-3 pt-1">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  2. Xogta Koontadaada
                </label>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Iimayl <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tusaale@gmail.com"
                      className="w-full bg-white border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    />
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Maamuluhu wuxuu koodhka xaqiijinta kugu soo diri doonaa iimaylkan.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Player ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={playerId}
                    onChange={(e) => setPlayerId(e.target.value)}
                    placeholder="Tusaale: EFB-992384"
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">
                    ID-ga ciyaarta eFootball (wuxuu taageeraa qoraallada kala duwan).
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-blue-50/60 border border-blue-100 text-[11px] text-blue-800 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Ammaan: Weligaa lama weydiin doono furahaaga sirta ah (Password-ka).</span>
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
                onClick={handleCreateOrder}
                className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs tracking-wide transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <span>Sii wad</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 2: Show Verification Input Form */}
          {step === 2 && currentOrder && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-100 text-xs text-blue-900 space-y-1">
                <div className="flex items-center justify-between font-bold">
                  <span>Dalabka: {currentOrder.id}</span>
                  <span className="text-[11px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Sugaya</span>
                </div>
                <p className="text-gray-600 text-[11px] leading-relaxed">
                  Maamuluhu wuxuu koodhka xaqiijinta kuugu soo dirayaa iimaylkaaga (<span className="font-semibold text-gray-900">{currentOrder.email}</span>). Fadlan hubi iimaylkaaga kadibna koodhka hoos ku qor.
                </p>
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="block text-xs font-semibold text-gray-700">
                  Geli Koodhka Xaqiijinta <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={enteredCode}
                  onChange={(e) => setEnteredCode(e.target.value)}
                  placeholder="Qor koodhka aad heshay..."
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-mono tracking-wider"
                />
                <p className="text-[11px] text-gray-500">
                  Koodhka aad heshay geli si maamuluhu u xaqiijiyo xogtaada.
                </p>
              </div>

              {codeError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{codeError}</span>
                </div>
              )}

              <button
                type="button"
                disabled={isSubmittingCode}
                onClick={handleSubmitCode}
                className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold text-xs tracking-wide transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                {isSubmittingCode ? (
                  <span>La gudbinayaa...</span>
                ) : (
                  <>
                    <span>Sii wad</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* STEP 3: DEDICATED WAITING SCREEN */}
          {step === 3 && currentOrder && (
            <div className="py-6 px-2 text-center space-y-4">
              {/* If Verification Rejected */}
              {currentOrder.verificationDecision === 'rejected' ? (
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto text-red-600">
                    <AlertCircle className="w-6 h-6" />
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-gray-900">
                      Xaqiijintu way fashilantay
                    </h3>
                    <p className="text-xs text-gray-600 mt-1.5 max-w-sm mx-auto leading-relaxed">
                      Xaqiijintu way fashilantay. Fadlan dib u eeg xogta aad gelisay oo isku day mar kale.
                    </p>
                    {currentOrder.verificationRejectReason && (
                      <p className="text-xs text-red-700 mt-1 font-medium">
                        Sababta: {currentOrder.verificationRejectReason}
                      </p>
                    )}
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
                    >
                      Dib u geli Koodhka
                    </button>
                  </div>
                </div>
              ) : currentOrder.verificationDecision === 'approved' ? (
                /* If Verification Approved */
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto text-green-600">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-gray-900">
                      Waa la xaqiijiyey
                    </h3>
                    <p className="text-xs text-gray-600 mt-1 max-w-sm mx-auto">
                      Waa la xaqiijiyey. Hadda waad sii wadan kartaa lacag-bixinta.
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(4)} // Advance to Payment on same order
                      className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs tracking-wide transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>U Gudub Lacag-bixinta</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                /* Still Under Review (Waiting Screen) */
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto text-blue-600">
                    <RotateCw className="w-6 h-6 animate-spin text-blue-600" />
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-base font-bold text-gray-900">
                      Hubin ku socoto
                    </h3>
                    <p className="text-xs text-gray-600 max-w-sm mx-auto leading-relaxed">
                      Xogtaada waan helnay. Waxaan hubinaynaa faahfaahinta aad noo soo dirtay. Fadlan sug; hubintu waxay qaadan kartaa ilaa 5 daqiiqo.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-600 max-w-xs mx-auto text-left space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Dalabka:</span>
                      <span className="font-mono font-bold text-gray-900">{currentOrder.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Koodhka la diray:</span>
                      <span className="font-mono text-blue-600 font-bold">{currentOrder.submittedVerificationCode}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-gray-400">
                    Boggu wuxuu si toos ah isu cusboonaysiinayaa isla marka maamuluhu go'aanka gaaro.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Payment Instructions & Sender Phone Number Submission */}
          {step === 4 && currentOrder && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-gray-500">Dalabka: </span>
                  <span className="font-bold text-gray-900 font-mono">{currentOrder.id}</span>
                  <span className="text-gray-500"> · Coins: </span>
                  <span className="font-bold text-blue-600">{currentOrder.packageCredits}</span>
                </div>
                <div className="font-bold text-blue-600 text-sm tabular-nums">
                  ${currentOrder.price.toFixed(2)}
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
                    <span className="text-gray-500 font-medium">Lambarka / Merchant:</span>
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
                      ${currentOrder.price.toFixed(2)} USD
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
                  Geli lambarka aad ka soo dirtay lacagta si maamuluhu u hubiyo.
                </p>
              </div>

              {paymentError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{paymentError}</span>
                </div>
              )}

              <button
                type="button"
                disabled={isSubmittingPayment}
                onClick={handleSubmitPayment}
                className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold text-xs tracking-wide transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                {isSubmittingPayment ? (
                  <span>La gudbinayaa...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Xaqiiji Bixinta Lacagta</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* STEP 5: Completed Screen */}
          {step === 5 && currentOrder && (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto text-green-600">
                <CheckCircle2 className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-base font-bold text-gray-900 tracking-tight">
                  Lacag-bixintaada Waa La Gudbiyay
                </h3>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                  Maamuluhu wuxuu hubinayaa lacagta si loogu shubo eFootball Coins.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-left space-y-2 text-xs max-w-sm mx-auto">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Lambarka Dalabka:</span>
                  <span className="font-mono font-bold text-blue-600">{currentOrder.id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Xirmo:</span>
                  <span className="font-medium text-gray-900">{currentOrder.packageName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Player ID:</span>
                  <span className="font-medium text-gray-900">{currentOrder.playerId}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Lambarka Diraha:</span>
                  <span className="font-mono text-gray-900">{currentOrder.senderPhoneNumber}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                  <span className="text-gray-500">Xaaladda:</span>
                  <span className="font-semibold text-blue-600 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{currentOrder.status}</span>
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
