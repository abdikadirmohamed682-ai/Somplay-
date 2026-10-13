import React, { useState } from 'react';
import { getOrderById, getOrders } from '../services/storage';
import { Order, OrderStatus } from '../types';
import {
  X,
  Search,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Copy,
  Check,
  CreditCard,
  MessageCircle,
} from 'lucide-react';

interface OrderTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultOrderId?: string;
}

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({
  isOpen,
  onClose,
  defaultOrderId,
}) => {
  const [searchId, setSearchId] = useState(defaultOrderId || '');
  const [foundOrder, setFoundOrder] = useState<Order | null>(
    defaultOrderId ? getOrderById(defaultOrderId) || null : null
  );
  const [hasSearched, setHasSearched] = useState(!!defaultOrderId);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchId.trim()) return;

    const order = getOrderById(searchId.trim());
    setFoundOrder(order || null);
    setHasSearched(true);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'Sugaya Xaqiijin':
        return {
          bg: 'bg-purple-50 text-purple-700 border-purple-200',
          icon: <Clock className="w-3.5 h-3.5 text-purple-600" />,
          label: 'Sugaya Koodhka',
        };
      case 'Hubin ku socoto':
        return {
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: <RotateCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />,
          label: 'Hubin ku socoto',
        };
      case 'Sugaya Lacag-bixin':
        return {
          bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          icon: <CreditCard className="w-3.5 h-3.5 text-indigo-600" />,
          label: 'Sugaya Lacag-bixin',
        };
      case 'Xaqiijintu way fashilantay':
        return {
          bg: 'bg-red-50 text-red-700 border-red-200',
          icon: <AlertTriangle className="w-3.5 h-3.5 text-red-600" />,
          label: 'Xaqiijintu way fashilantay',
        };
      case 'Sugaya Hubin':
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: <Clock className="w-3.5 h-3.5 text-amber-600" />,
          label: 'Sugaya Hubin (Lacagta)',
        };
      case 'Waa la shaqaynayaa':
        return {
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: <RotateCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />,
          label: 'Waa la shaqaynayaa',
        };
      case 'Waa la dhammaystiray':
        return {
          bg: 'bg-green-50 text-green-700 border-green-200',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />,
          label: 'Waa la dhammaystiray',
        };
      case 'Wuu fashilmay':
        return {
          bg: 'bg-red-50 text-red-700 border-red-200',
          icon: <AlertTriangle className="w-3.5 h-3.5 text-red-600" />,
          label: 'Wuu fashilmay',
        };
      default:
        return {
          bg: 'bg-gray-100 text-gray-700 border-gray-200',
          icon: <Clock className="w-3.5 h-3.5" />,
          label: status,
        };
    }
  };

  const sampleOrders = getOrders().slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden my-6">
        {/* Header */}
        <div className="bg-gray-50 border-b border-gray-200 p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 tracking-tight">
                Raadinta Dalabka
              </h2>
              <p className="text-xs text-gray-500">
                Geli lambarka dalabkaaga si aad u ogaato xaaladda
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Xir"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                placeholder="Tusaale: SOM-PUB-7821 ama SOM-EFB-4412"
                className="w-full bg-white border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 font-mono uppercase"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold text-xs transition-colors cursor-pointer"
            >
              Raadi
            </button>
          </form>

          {/* Quick links */}
          {!foundOrder && !hasSearched && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider block">
                Tijaabi Dalabaadkan Hore:
              </span>
              <div className="flex flex-wrap gap-2">
                {sampleOrders.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => {
                      setSearchId(o.id);
                      setFoundOrder(o);
                      setHasSearched(true);
                    }}
                    className="px-2.5 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-xs font-mono text-gray-700 transition-colors cursor-pointer"
                  >
                    {o.id} ({o.game})
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Not Found */}
          {hasSearched && !foundOrder && (
            <div className="p-6 rounded-xl bg-gray-50 border border-gray-200 text-center space-y-2">
              <AlertTriangle className="w-7 h-7 text-amber-500 mx-auto" />
              <h3 className="text-sm font-bold text-gray-900">Lama Helin Dalabkan</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Lama helin dalab wata lambarka <span className="font-mono text-blue-600 font-bold">{searchId}</span>. Fadlan hubi lambarka dalabkaaga.
              </p>
            </div>
          )}

          {/* Found Order */}
          {foundOrder && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-sm font-bold text-gray-900">{foundOrder.id}</span>
                    <button
                      onClick={() => handleCopy(foundOrder.id)}
                      className="text-gray-400 hover:text-gray-700"
                      title="Nuqul"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {(() => {
                    const badge = getStatusBadge(foundOrder.status);
                    return (
                      <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-bold flex items-center gap-1 ${badge.bg}`}>
                        {badge.icon}
                        <span>{badge.label}</span>
                      </span>
                    );
                  })()}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500 block">Ciyaarta:</span>
                    <span className="font-medium text-gray-900">{foundOrder.game}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Xirmo:</span>
                    <span className="font-medium text-gray-900">{foundOrder.packageName}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Player ID:</span>
                    <span className="font-mono text-gray-900">{foundOrder.playerId}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Qiimaha:</span>
                    <span className="font-bold text-gray-900 tabular-nums">${foundOrder.price.toFixed(2)} USD</span>
                  </div>
                  {foundOrder.senderPhoneNumber && (
                    <div className="col-span-2">
                      <span className="text-gray-500 block">Lambarka aad lacagta ka dirtay:</span>
                      <span className="font-mono text-blue-700 font-semibold">{foundOrder.senderPhoneNumber}</span>
                    </div>
                  )}
                </div>

                {foundOrder.failureReason && (
                  <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                    <span className="font-bold block">Sababta Fashilka:</span>
                    <span>{foundOrder.failureReason}</span>
                  </div>
                )}
              </div>

              {/* Status History Timeline */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider block">
                  Taariikhda Isbeddelka
                </span>
                <div className="border-l-2 border-gray-200 pl-3 space-y-2 text-xs ml-1">
                  {foundOrder.history.map((h, idx) => (
                    <div key={idx} className="relative">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-900">{h.status}</span>
                        <span className="text-[11px] text-gray-400">
                          {new Date(h.timestamp).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      {h.note && <p className="text-gray-500 text-[11px] mt-0.5">{h.note}</p>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Support link */}
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <span>Ma u baahan tahay caawimaad?</span>
                <a
                  href={`https://wa.me/252615482390?text=${encodeURIComponent(
                    `Asc SomTopUp, waxaan rabaa inaan wax ka weydiiyo dalabkeyga ${foundOrder.id}`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-green-700 hover:underline flex items-center gap-1 font-semibold"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp Taageero</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
