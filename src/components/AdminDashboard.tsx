import React, { useState, useEffect } from 'react';
import {
  Order,
  OrderStatus,
  GamePackage,
  PromoBanner,
  PaymentMethod,
  TelegramSettings,
  VisitorAnalyticsData,
  GameType,
  VerificationRequest,
  AdminNotification,
} from '../types';
import {
  getOrders,
  approveEfootballVerification,
  rejectEfootballVerification,
  approveVerificationRequest,
  rejectVerificationRequest,
  getVerificationRequests,
  getAdminNotifications,
  markNotificationRead,
  confirmOrderPayment,
  completeOrder,
  failOrder,
  getPackages,
  savePackage,
  deletePackage,
  getBanners,
  saveBanner,
  deleteBanner,
  getPaymentMethods,
  savePaymentMethod,
  getTelegramSettings,
  saveTelegramSettings,
  getAnalytics,
  isAdminAuthenticated,
  adminLogin,
  adminLogout,
} from '../services/storage';
import { testTelegramConnection } from '../services/telegram';
import {
  X,
  LayoutDashboard,
  ShoppingBag,
  Package,
  CreditCard,
  Send,
  BarChart3,
  Search,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Plus,
  Trash2,
  Edit2,
  Save,
  Lock,
  LogOut,
  Phone,
  Mail,
  User,
  ShieldCheck,
} from 'lucide-react';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  onDataChanged: () => void;
}

type AdminTab =
  | 'overview'
  | 'orders'
  | 'efootball_verifications'
  | 'packages'
  | 'banners'
  | 'payments'
  | 'telegram'
  | 'analytics';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isOpen,
  onClose,
  onDataChanged,
}) => {
  // Admin authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(isAdminAuthenticated());
  const [pinInput, setPinInput] = useState('');
  const [loginError, setLoginError] = useState('');

  const [activeTab, setActiveTab] = useState<AdminTab>('orders');

  // Storage data
  const [orders, setOrders] = useState<Order[]>([]);
  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>([]);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [packages, setPackages] = useState<GamePackage[]>([]);
  const [banners, setBanners] = useState<PromoBanner[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [telegramSettings, setTelegramSettings] = useState<TelegramSettings>(getTelegramSettings());
  const [analytics, setAnalytics] = useState<VisitorAnalyticsData>(getAnalytics());

  // Verification Requests Filter & State
  const [verifFilterStatus, setVerifFilterStatus] = useState<string>('All');
  const [verifSearchQuery, setVerifSearchQuery] = useState<string>('');
  const [selectedVerifReq, setSelectedVerifReq] = useState<VerificationRequest | null>(null);
  const [verifRejectReasonInput, setVerifRejectReasonInput] = useState<string>('');

  // Orders filters
  const [orderFilterGame, setOrderFilterGame] = useState<'All' | GameType>('All');
  const [orderFilterStatus, setOrderFilterStatus] = useState<string>('All');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');

  // Selected Order
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [verificationRejectReason, setVerificationRejectReason] = useState('');
  const [paymentFailReason, setPaymentFailReason] = useState('');
  const [adminNoteInput, setAdminNoteInput] = useState('');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Package Form
  const [editingPackage, setEditingPackage] = useState<GamePackage | null>(null);

  // Banner Form
  const [editingBanner, setEditingBanner] = useState<PromoBanner | null>(null);

  // Telegram test status
  const [telegramTestStatus, setTelegramTestStatus] = useState<{
    loading: boolean;
    message?: string;
    success?: boolean;
  }>({ loading: false });

  const loadData = async () => {
    setOrders(getOrders());
    setPackages(getPackages());
    setBanners(getBanners());
    setPaymentMethods(getPaymentMethods());
    setTelegramSettings(getTelegramSettings());
    setAnalytics(getAnalytics());
    setVerificationRequests(getVerificationRequests());
    setNotifications(getAdminNotifications());

    // Also fetch live data from server API if authenticated
    try {
      const res = await fetch('/api/admin/efootball/requests', {
        headers: { Authorization: 'Bearer authorized_session' },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.requests) setVerificationRequests(data.requests);
      }
    } catch (e) {}

    try {
      const ordRes = await fetch('/api/admin/orders', {
        headers: { Authorization: 'Bearer authorized_session' },
      });
      if (ordRes.ok) {
        const ordData = await ordRes.json();
        if (ordData.orders) setOrders(ordData.orders);
      }
    } catch (e) {}

    try {
      const notifRes = await fetch('/api/admin/notifications', {
        headers: { Authorization: 'Bearer authorized_session' },
      });
      if (notifRes.ok) {
        const notifData = await notifRes.json();
        if (notifData.notifications) setNotifications(notifData.notifications);
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (isOpen) {
      setIsAuthenticated(isAdminAuthenticated());
      loadData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const showFeedback = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 3500);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const res = adminLogin(pinInput);
    if (res.success) {
      setIsAuthenticated(true);
      setPinInput('');
      setLoginError('');
      loadData();
    } else {
      setLoginError(res.message);
    }
  };

  const handleLogout = () => {
    adminLogout();
    setIsAuthenticated(false);
  };

  // Metrics
  const totalOrders = orders.length;
  const underVerificationOrders = orders.filter((o) => o.status === 'Hubin ku socoto').length;
  const awaitingPaymentReview = orders.filter((o) => o.status === 'Sugaya Hubin').length;
  const processingOrders = orders.filter((o) => o.status === 'Waa la shaqaynayaa').length;
  const completedOrders = orders.filter((o) => o.status === 'Waa la dhammaystiray').length;
  const verifiedSales = orders
    .filter((o) => o.status === 'Waa la shaqaynayaa' || o.status === 'Waa la dhammaystiray')
    .reduce((acc, curr) => acc + curr.price, 0);

  /* MANUAL VERIFICATION ACTIONS (eFootball) */
  const handleApproveVerification = async () => {
    if (!selectedOrder) return;
    const res = await approveEfootballVerification(selectedOrder.id, adminNoteInput.trim() || undefined);
    if (res.success && res.order) {
      setSelectedOrder(res.order);
      setAdminNoteInput('');
      loadData();
      onDataChanged();
      showFeedback('Koodhka xaqiijinta si guul leh ayaa loo oggolaaday.');
    } else {
      showFeedback(res.message);
    }
  };

  const handleRejectVerification = async () => {
    if (!selectedOrder) return;
    const reason = verificationRejectReason.trim() || 'Koodhka ma saxna ama lagama helin iimaylka.';
    const res = await rejectEfootballVerification(selectedOrder.id, reason);
    if (res.success && res.order) {
      setSelectedOrder(res.order);
      setVerificationRejectReason('');
      loadData();
      onDataChanged();
      showFeedback('Xaqiijinta koodhka waa la diiday.');
    } else {
      showFeedback(res.message);
    }
  };

  /* MANUAL PAYMENT ACTIONS */
  const handleConfirmPayment = async () => {
    if (!selectedOrder) return;
    const res = await confirmOrderPayment(selectedOrder.id, adminNoteInput.trim() || undefined);
    if (res.success && res.order) {
      setSelectedOrder(res.order);
      setAdminNoteInput('');
      loadData();
      onDataChanged();
      showFeedback('Lacag-bixinta waa la xaqiijiyay, hadda ayaa loo shubayaa.');
    } else {
      showFeedback(res.message);
    }
  };

  const handleCompleteOrder = async () => {
    if (!selectedOrder) return;
    const res = await completeOrder(selectedOrder.id, adminNoteInput.trim() || undefined);
    if (res.success && res.order) {
      setSelectedOrder(res.order);
      setAdminNoteInput('');
      loadData();
      onDataChanged();
      showFeedback('Dalabka si guul leh ayaa loo dhammaystiray.');
    } else {
      showFeedback(res.message);
    }
  };

  const handleFailOrder = async () => {
    if (!selectedOrder) return;
    const reason = paymentFailReason.trim() || 'Lacagta lama helin ama xogta ma saxna.';
    const res = await failOrder(selectedOrder.id, reason);
    if (res.success && res.order) {
      setSelectedOrder(res.order);
      setPaymentFailReason('');
      loadData();
      onDataChanged();
      showFeedback('Dalabka waxaa loo calaamadeeyay inuu fashilmay.');
    } else {
      showFeedback(res.message);
    }
  };

  /* Package CRUD */
  const handleSavePackage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPackage) return;
    savePackage(editingPackage);
    setEditingPackage(null);
    loadData();
    onDataChanged();
    showFeedback('Xirmada waa la keydiyay.');
  };

  const handleDeletePackage = (id: string) => {
    if (confirm('Ma hubtaa inaad tirtirto xirmadan?')) {
      deletePackage(id);
      loadData();
      onDataChanged();
      showFeedback('Xirmada waa la tirtiray.');
    }
  };

  /* Payment Method Toggle */
  const handleSavePaymentMethod = (m: PaymentMethod) => {
    savePaymentMethod(m);
    loadData();
    onDataChanged();
    showFeedback(`Habka ${m.name} waa la cusbooneysiiyay.`);
  };

  /* Telegram Settings */
  const handleSaveTelegram = (e: React.FormEvent) => {
    e.preventDefault();
    saveTelegramSettings(telegramSettings);
    showFeedback('Dejimaha Telegram waa la keydiyay.');
  };

  const handleTestTelegram = async () => {
    setTelegramTestStatus({ loading: true });
    const res = await testTelegramConnection(telegramSettings.botToken, telegramSettings.chatId);
    setTelegramTestStatus({
      loading: false,
      message: res.message,
      success: res.success,
    });
  };

  // Filtered Orders
  const filteredOrders = orders.filter((o) => {
    if (orderFilterGame !== 'All' && o.game !== orderFilterGame) return false;
    if (orderFilterStatus !== 'All' && o.status !== orderFilterStatus) return false;
    if (orderSearchQuery.trim()) {
      const q = orderSearchQuery.toLowerCase();
      const matchId = o.id.toLowerCase().includes(q);
      const matchPlayer = o.playerId.toLowerCase().includes(q);
      const matchNick = o.playerNickname?.toLowerCase().includes(q);
      const matchEmail = o.email?.toLowerCase().includes(q);
      const matchPhone = o.senderPhoneNumber?.toLowerCase().includes(q);
      return matchId || matchPlayer || matchNick || matchEmail || matchPhone;
    }
    return true;
  });

  const handleApproveVerif = async (req: VerificationRequest) => {
    const res = await approveVerificationRequest(req.id);
    if (res.success) {
      showFeedback(`Codsiga ${req.id} si guul leh ayaa loo oggolaaday.`);
      await loadData();
      onDataChanged();
      setSelectedVerifReq(null);
    } else {
      showFeedback(res.message);
    }
  };

  const handleRejectVerif = async (req: VerificationRequest) => {
    const reason = verifRejectReasonInput.trim() || 'Koodhka aad gelisay kuma habboona xogta maamulaha.';
    const res = await rejectVerificationRequest(req.id, reason);
    if (res.success) {
      showFeedback(`Codsiga ${req.id} waa la diiday.`);
      await loadData();
      onDataChanged();
      setSelectedVerifReq(null);
      setVerifRejectReasonInput('');
    } else {
      showFeedback(res.message);
    }
  };

  // Filtered Verification Requests
  const filteredVerifRequests = verificationRequests.filter((r) => {
    if (verifFilterStatus !== 'All' && r.status !== verifFilterStatus) return false;
    if (verifSearchQuery.trim()) {
      const q = verifSearchQuery.toLowerCase();
      const matchId = r.id.toLowerCase().includes(q) || r.orderId.toLowerCase().includes(q);
      const matchEmail = r.email.toLowerCase().includes(q);
      const matchPlayer = r.playerId.toLowerCase().includes(q);
      const matchCode = r.submittedCode?.toLowerCase().includes(q);
      return matchId || matchEmail || matchPlayer || matchCode;
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex bg-black/40 backdrop-blur-xs overflow-hidden text-gray-900">
      {/* If NOT Authenticated, show Login Screen */}
      {!isAuthenticated ? (
        <div className="m-auto w-full max-w-sm bg-white rounded-2xl shadow-xl border border-gray-200 p-6 space-y-4">
          <div className="text-center space-y-1">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mx-auto text-blue-600">
              <Lock className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-gray-900">Gelitaanka Maamulka</h2>
            <p className="text-xs text-gray-500">
              Fadlan geli PIN-ka maamulka si aad u furto dashboard-ka.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                PIN-ka Maamulka (Default: admin1234)
              </label>
              <input
                type="password"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Geli PIN-ka..."
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
            </div>

            {loginError && (
              <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50"
              >
                Ka noqo
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white shadow-sm"
              >
                Gal
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Authenticated Admin Dashboard */
        <div className="flex w-full h-full bg-white">
          {/* Sidebar */}
          <aside className="w-60 bg-gray-50 border-r border-gray-200 flex flex-col shrink-0">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-sm">
                  S
                </div>
                <span className="font-bold text-gray-900 text-sm">SomTopUp Admin</span>
              </div>
            </div>

            <nav className="p-3 space-y-1 flex-1 overflow-y-auto text-xs font-semibold text-gray-600">
              <button
                onClick={() => setActiveTab('orders')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'orders'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'hover:bg-gray-200/60 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4" />
                  <span>Dalabaadka</span>
                </div>
                {underVerificationOrders + awaitingPaymentReview > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    activeTab === 'orders' ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'
                  }`}>
                    {underVerificationOrders + awaitingPaymentReview}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('efootball_verifications')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'efootball_verifications'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'hover:bg-gray-200/60 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Hubinta eFootball</span>
                </div>
                {verificationRequests.filter((r) => r.status === 'code_submitted_pending_admin').length > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    activeTab === 'efootball_verifications' ? 'bg-white text-blue-600' : 'bg-purple-600 text-white'
                  }`}>
                    {verificationRequests.filter((r) => r.status === 'code_submitted_pending_admin').length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('overview')}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'overview'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'hover:bg-gray-200/60 hover:text-gray-900'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dulmar Guud</span>
              </button>

              <button
                onClick={() => setActiveTab('packages')}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'packages'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'hover:bg-gray-200/60 hover:text-gray-900'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>Xirmooyinka</span>
              </button>

              <button
                onClick={() => setActiveTab('payments')}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'payments'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'hover:bg-gray-200/60 hover:text-gray-900'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Hababka Lacagta</span>
              </button>

              <button
                onClick={() => setActiveTab('telegram')}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'telegram'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'hover:bg-gray-200/60 hover:text-gray-900'
                }`}
              >
                <Send className="w-4 h-4" />
                <span>Telegram</span>
              </button>

              <button
                onClick={() => setActiveTab('analytics')}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'analytics'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'hover:bg-gray-200/60 hover:text-gray-900'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Xogta Booqdayaasha</span>
              </button>
            </nav>

            <div className="p-3 border-t border-gray-200 flex items-center justify-between text-xs">
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-red-600 flex items-center gap-1 cursor-pointer font-medium"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Ka bax</span>
              </button>
              <button onClick={onClose} className="text-blue-600 hover:underline cursor-pointer">
                Suuqa
              </button>
            </div>
          </aside>

          {/* Main Area */}
          <main className="flex-1 flex flex-col min-w-0 bg-white overflow-y-auto">
            {/* Top Bar */}
            <header className="p-4 border-b border-gray-200 flex items-center justify-between bg-white sticky top-0 z-20">
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-gray-900">
                  {activeTab === 'orders' && 'Maamulka Dalabaadka (PUBG & eFootball)'}
                  {activeTab === 'overview' && 'Dulmar Guud & Iibka'}
                  {activeTab === 'packages' && 'Maamulka Xirmooyinka'}
                  {activeTab === 'payments' && 'Hababka Lacag-bixinta'}
                  {activeTab === 'telegram' && 'Ogeysiisyada Telegram'}
                  {activeTab === 'analytics' && 'Xogta Booqashada'}
                </h1>
              </div>

              <div className="flex items-center gap-3">
                {actionFeedback && (
                  <span className="text-xs bg-green-50 border border-green-200 text-green-800 px-3 py-1 rounded-md">
                    {actionFeedback}
                  </span>
                )}
                <button
                  onClick={onClose}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span>Xir</span>
                </button>
              </div>
            </header>

            {/* Content Body */}
            <div className="p-5 sm:p-6 space-y-6">
              {/* TAB: ORDERS */}
              {activeTab === 'orders' && (
                <div className="space-y-5">
                  {/* Filters */}
                  <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-gray-50 border border-gray-200">
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={orderFilterGame}
                        onChange={(e) => setOrderFilterGame(e.target.value as any)}
                        className="bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-blue-600"
                      >
                        <option value="All">Dhammaan Ciyaaraha</option>
                        <option value="PUBG Mobile">PUBG Mobile</option>
                        <option value="eFootball">eFootball</option>
                      </select>

                      <select
                        value={orderFilterStatus}
                        onChange={(e) => setOrderFilterStatus(e.target.value)}
                        className="bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-blue-600"
                      >
                        <option value="All">Dhammaan Xaaladaha</option>
                        <option value="Hubin ku socoto">Hubin ku socoto (eFootball Code)</option>
                        <option value="Sugaya Hubin">Sugaya Hubin (Lacagta)</option>
                        <option value="Sugaya Xaqiijin">Sugaya Xaqiijin</option>
                        <option value="Sugaya Lacag-bixin">Sugaya Lacag-bixin</option>
                        <option value="Waa la shaqaynayaa">Waa la shaqaynayaa</option>
                        <option value="Waa la dhammaystiray">Waa la dhammaystiray</option>
                        <option value="Xaqiijintu way fashilantay">Xaqiijintu way fashilantay</option>
                        <option value="Wuu fashilmay">Wuu fashilmay</option>
                      </select>
                    </div>

                    <div className="relative min-w-[220px]">
                      <input
                        type="text"
                        value={orderSearchQuery}
                        onChange={(e) => setOrderSearchQuery(e.target.value)}
                        placeholder="Raadi Order ID, Player ID, Phone..."
                        className="w-full bg-white border border-gray-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-600"
                      />
                      <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  {/* Orders Table */}
                  <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                          <tr>
                            <th className="py-2.5 px-3">Tirsiga</th>
                            <th className="py-2.5 px-3">Ciyaarta</th>
                            <th className="py-2.5 px-3">Xirmo</th>
                            <th className="py-2.5 px-3">Qiimaha</th>
                            <th className="py-2.5 px-3">Player ID & Xogta</th>
                            <th className="py-2.5 px-3">Koodhka / Tel Diraha</th>
                            <th className="py-2.5 px-3">Xaaladda</th>
                            <th className="py-2.5 px-3 text-right">Ficil</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 font-medium">
                          {filteredOrders.map((o) => (
                            <tr
                              key={o.id}
                              className={`hover:bg-gray-50 transition-colors ${
                                selectedOrder?.id === o.id ? 'bg-blue-50/40' : ''
                              }`}
                            >
                              <td className="py-2.5 px-3 font-mono font-bold text-blue-600">{o.id}</td>
                              <td className="py-2.5 px-3">{o.game}</td>
                              <td className="py-2.5 px-3">{o.packageCredits}</td>
                              <td className="py-2.5 px-3 tabular-nums font-bold">${o.price.toFixed(2)}</td>
                              <td className="py-2.5 px-3">
                                <div className="font-mono text-gray-900">{o.playerId}</div>
                                {o.email && <div className="text-[11px] text-gray-500">{o.email}</div>}
                                {o.playerNickname && <div className="text-[11px] text-gray-500">Nick: {o.playerNickname}</div>}
                              </td>
                              <td className="py-2.5 px-3">
                                {o.submittedVerificationCode && (
                                  <div className="text-[11px] font-mono font-bold text-purple-700">
                                    Koodh: {o.submittedVerificationCode}
                                  </div>
                                )}
                                {o.senderPhoneNumber && (
                                  <div className="text-[11px] font-mono text-blue-700">
                                    Tel: {o.senderPhoneNumber}
                                  </div>
                                )}
                              </td>
                              <td className="py-2.5 px-3">
                                <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                                  o.status === 'Waa la dhammaystiray'
                                    ? 'bg-green-50 text-green-700'
                                    : o.status === 'Hubin ku socoto'
                                    ? 'bg-purple-50 text-purple-700'
                                    : o.status === 'Sugaya Hubin'
                                    ? 'bg-amber-50 text-amber-700'
                                    : o.status === 'Waa la shaqaynayaa'
                                    ? 'bg-blue-50 text-blue-700'
                                    : o.status === 'Wuu fashilmay' || o.status === 'Xaqiijintu way fashilantay'
                                    ? 'bg-red-50 text-red-700'
                                    : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {o.status}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => setSelectedOrder(o)}
                                  className="px-2.5 py-1 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold cursor-pointer"
                                >
                                  Faahfaahin
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {filteredOrders.length === 0 && (
                      <div className="py-8 text-center text-xs text-gray-500">
                        Lama helin dalab waafaqsan shuruudaha.
                      </div>
                    )}
                  </div>

                  {/* ORDER DETAIL VIEW (PART 10) */}
                  {selectedOrder && (
                    <div className="p-5 rounded-2xl bg-white border-2 border-blue-200 shadow-sm space-y-5">
                      <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-base font-bold text-blue-600">
                            {selectedOrder.id}
                          </span>
                          <span className="text-xs bg-gray-100 text-gray-800 font-semibold px-2 py-0.5 rounded">
                            {selectedOrder.game}
                          </span>
                          <span className="text-xs text-gray-500">· {selectedOrder.status}</span>
                        </div>
                        <button
                          onClick={() => setSelectedOrder(null)}
                          className="text-xs text-gray-400 hover:text-gray-700"
                        >
                          Xir faahfaahinta
                        </button>
                      </div>

                      {/* Sections: Summary, Customer, Verification, Payment */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        {/* A & B: Summary & Customer */}
                        <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
                          <span className="font-bold text-gray-700 uppercase tracking-wider block text-[11px]">
                            Xogta Dalabka & Macmiilka
                          </span>
                          <div>
                            <span className="text-gray-500">Xirmo: </span>
                            <span className="font-semibold text-gray-900">{selectedOrder.packageName}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Qiimaha: </span>
                            <span className="font-bold text-gray-900 tabular-nums">${selectedOrder.price.toFixed(2)} USD</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Player ID: </span>
                            <span className="font-mono font-semibold text-gray-900">{selectedOrder.playerId}</span>
                          </div>
                          {selectedOrder.playerNickname && (
                            <div>
                              <span className="text-gray-500">Nickname: </span>
                              <span className="font-semibold text-gray-900">{selectedOrder.playerNickname}</span>
                            </div>
                          )}
                          {selectedOrder.email && (
                            <div>
                              <span className="text-gray-500">Iimayl: </span>
                              <span className="font-semibold text-gray-900">{selectedOrder.email}</span>
                            </div>
                          )}
                          <div>
                            <span className="text-gray-500">Waqtiga: </span>
                            <span className="text-gray-700">{new Date(selectedOrder.createdAt).toLocaleString('so-SO')}</span>
                          </div>
                        </div>

                        {/* C: Verification Info (eFootball) */}
                        <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
                          <span className="font-bold text-gray-700 uppercase tracking-wider block text-[11px]">
                            Xogta Xaqiijinta Iimaylka (eFootball)
                          </span>
                          {selectedOrder.game === 'eFootball' ? (
                            <>
                              <div>
                                <span className="text-gray-500">Koodhka Macmiilku Soo Diray: </span>
                                {selectedOrder.submittedVerificationCode ? (
                                  <span className="font-mono font-bold text-purple-700 text-sm bg-purple-100 px-2 py-0.5 rounded">
                                    {selectedOrder.submittedVerificationCode}
                                  </span>
                                ) : (
                                  <span className="text-gray-400 italic">Weli lama soo dirin</span>
                                )}
                              </div>
                              <div>
                                <span className="text-gray-500">Go'aanka Maamulka: </span>
                                <span className="font-semibold text-gray-900">
                                  {selectedOrder.verificationDecision || 'Sugaya hubin'}
                                </span>
                              </div>
                              {selectedOrder.verificationRejectReason && (
                                <div className="text-red-700">
                                  <span className="text-gray-500">Sababta Diidmada: </span>
                                  <span>{selectedOrder.verificationRejectReason}</span>
                                </div>
                              )}

                              {/* Manual Verification Action Buttons */}
                              {(selectedOrder.status === 'Hubin ku socoto' || selectedOrder.status === 'Sugaya Xaqiijin') && (
                                <div className="pt-2 border-t border-gray-200 flex flex-col gap-2">
                                  <span className="text-[11px] text-gray-500">
                                    Fur Gmail si aad u hubiso koodhkii aad dirtay, kadibna dooro:
                                  </span>
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={handleApproveVerification}
                                      className="flex-1 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold text-xs cursor-pointer shadow-sm"
                                    >
                                      Oggolow Xaqiijinta
                                    </button>
                                    <button
                                      type="button"
                                      onClick={handleRejectVerification}
                                      className="flex-1 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-xs cursor-pointer shadow-sm"
                                    >
                                      Diid Xaqiijinta
                                    </button>
                                  </div>
                                </div>
                              )}
                            </>
                          ) : (
                            <p className="text-gray-400 italic">PUBG Mobile uma baahna xaqiijin iimayl.</p>
                          )}
                        </div>

                        {/* D: Payment Information */}
                        <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 space-y-2 md:col-span-2">
                          <span className="font-bold text-gray-700 uppercase tracking-wider block text-[11px]">
                            Xogta Lacag-bixinta
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div>
                              <span className="text-gray-500 block">Habka:</span>
                              <span className="font-medium text-gray-900">{selectedOrder.paymentMethodName || 'Lama dooran'}</span>
                            </div>
                            <div>
                              <span className="text-gray-500 block">Lambarka Laga Soo Diray:</span>
                              <span className="font-mono font-bold text-blue-700 text-sm">
                                {selectedOrder.senderPhoneNumber || 'Weli lama soo dirin'}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500 block">Xaaladda Bixinta:</span>
                              <span className="font-semibold text-gray-900">{selectedOrder.status}</span>
                            </div>
                          </div>

                          {/* Payment Review Actions */}
                          {selectedOrder.status === 'Sugaya Hubin' && (
                            <div className="pt-2 border-t border-gray-200 flex flex-col gap-2">
                              <span className="text-[11px] text-gray-500">
                                Hubi koontadaada lacagta lagu helay lambarka kor ku xusan, kadibna:
                              </span>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={handleConfirmPayment}
                                  className="flex-1 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs cursor-pointer shadow-sm"
                                >
                                  Xaqiiji Lacagta (U wareeji Shaqo)
                                </button>
                                <button
                                  type="button"
                                  onClick={handleFailOrder}
                                  className="flex-1 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-xs cursor-pointer shadow-sm"
                                >
                                  Diid Lacagta (Fashili)
                                </button>
                              </div>
                            </div>
                          )}

                          {selectedOrder.status === 'Waa la shaqaynayaa' && (
                            <div className="pt-2 border-t border-gray-200">
                              <button
                                type="button"
                                onClick={handleCompleteOrder}
                                className="w-full py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold text-xs cursor-pointer shadow-sm"
                              >
                                Dhammee Dalabka (Waa Lagu Shubay)
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Timeline */}
                      <div className="space-y-2 pt-2 border-t border-gray-200">
                        <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider block">
                          Taariikhda Isbeddelka Dalabka (Timeline)
                        </span>
                        <div className="border-l-2 border-gray-200 pl-3 space-y-1.5 text-xs ml-1">
                          {selectedOrder.history.map((h, i) => (
                            <div key={i} className="relative">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-900">{h.status}</span>
                                <span className="text-gray-400 text-[11px]">{new Date(h.timestamp).toLocaleString('so-SO')}</span>
                              </div>
                              {h.note && <p className="text-gray-500 text-[11px]">{h.note}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB: EFOOTBALL VERIFICATION REQUESTS */}
              {activeTab === 'efootball_verifications' && (
                <div className="space-y-4">
                  {/* Section Title & Subtitle */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-200">
                    <div>
                      <h2 className="text-base sm:text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-blue-600" />
                        <span>Codsiyada Hubinta Iimaylka ee eFootball</span>
                      </h2>
                      <p className="text-xs text-gray-500">
                        Maamuluhu wuxuu koodhka ku hubiyaa Gmail-ka uu macmiilka ugu diray, kadibna wuu oggolaanayaa ama diidayaa.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={loadData}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-xs font-semibold text-gray-700 cursor-pointer w-fit"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>Cusboonaysii</span>
                    </button>
                  </div>

                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                    <div className="p-3 rounded-xl bg-purple-50 border border-purple-200">
                      <span className="text-[11px] text-purple-700 font-semibold block">Koodh La Soo Diray</span>
                      <div className="text-xl font-black text-purple-900">
                        {verificationRequests.filter((r) => r.status === 'code_submitted_pending_admin').length}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                      <span className="text-[11px] text-blue-700 font-semibold block">Sugaya Koodhka</span>
                      <div className="text-xl font-black text-blue-900">
                        {verificationRequests.filter((r) => r.status === 'pending_email_code').length}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-green-50 border border-green-200">
                      <span className="text-[11px] text-green-700 font-semibold block">Xaqiijinta Guulaysatay</span>
                      <div className="text-xl font-black text-green-900">
                        {verificationRequests.filter((r) => r.status === 'verified').length}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                      <span className="text-[11px] text-red-700 font-semibold block">Way Fashilantay</span>
                      <div className="text-xl font-black text-red-900">
                        {verificationRequests.filter((r) => r.status === 'verification_failed').length}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                      <span className="text-[11px] text-gray-500 font-semibold block">Wadarta Codsiyada</span>
                      <div className="text-xl font-black text-gray-900">
                        {verificationRequests.length}
                      </div>
                    </div>
                  </div>

                  {/* Filters & Search */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-600">Xaaladda:</span>
                      <select
                        value={verifFilterStatus}
                        onChange={(e) => setVerifFilterStatus(e.target.value)}
                        className="bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-blue-600"
                      >
                        <option value="All">Dhammaan ({verificationRequests.length})</option>
                        <option value="code_submitted_pending_admin">Koodh La Soo Diray - Sugaya Maamulka</option>
                        <option value="pending_email_code">Sugaya Koodhka Macmiilka</option>
                        <option value="verified">Xaqiijinta Guulaysatay</option>
                        <option value="verification_failed">Way Fashilantay</option>
                        <option value="expired">Waqtigu Dhacay</option>
                      </select>
                    </div>

                    <div className="relative min-w-[240px]">
                      <input
                        type="text"
                        value={verifSearchQuery}
                        onChange={(e) => setVerifSearchQuery(e.target.value)}
                        placeholder="Raadi ID, Email, Player ID, Koodh..."
                        className="w-full bg-white border border-gray-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-600"
                      />
                      <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  {/* Rejection Modal / Prompt */}
                  {selectedVerifReq && (
                    <div className="p-4 rounded-xl bg-red-50 border border-red-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-red-900">
                          Diidmada Codsiga: {selectedVerifReq.id} ({selectedVerifReq.email})
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedVerifReq(null)}
                          className="text-xs text-gray-500 hover:text-gray-700"
                        >
                          Ka noqo
                        </button>
                      </div>
                      <input
                        type="text"
                        value={verifRejectReasonInput}
                        onChange={(e) => setVerifRejectReasonInput(e.target.value)}
                        placeholder="Geli sababta diidmada (tusaale: Koodhka ma saxna ama kuma jiro Gmail-ka)..."
                        className="w-full bg-white border border-red-300 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-red-600"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedVerifReq(null)}
                          className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs text-gray-700 hover:bg-white"
                        >
                          Ka noqo
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRejectVerif(selectedVerifReq)}
                          className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                        >
                          Xaqiiji Diidmada
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Table of Verification Requests */}
                  <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                          <tr>
                            <th className="py-2.5 px-3">Tirsiga Codsiga</th>
                            <th className="py-2.5 px-3">Iimaylka Macmiilka</th>
                            <th className="py-2.5 px-3">Player ID</th>
                            <th className="py-2.5 px-3">Xirmo & Qiime</th>
                            <th className="py-2.5 px-3">Koodhka La Soo Diray</th>
                            <th className="py-2.5 px-3">Xaaladda</th>
                            <th className="py-2.5 px-3">Waqtiga</th>
                            <th className="py-2.5 px-3 text-right">Ficilka Maamulka</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 font-medium">
                          {filteredVerifRequests.map((r) => (
                            <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                              <td className="py-2.5 px-3 font-mono">
                                <span className="font-bold text-blue-600 block">{r.id}</span>
                                <span className="text-[10px] text-gray-400">{r.orderId}</span>
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="font-semibold text-gray-900 block">{r.email}</span>
                              </td>
                              <td className="py-2.5 px-3 font-mono font-semibold text-gray-800">
                                {r.playerId}
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="font-bold text-gray-900 block">{r.packageCredits}</span>
                                <span className="text-[10px] text-gray-500">${r.price.toFixed(2)}</span>
                              </td>
                              <td className="py-2.5 px-3 font-mono">
                                {r.submittedCode ? (
                                  <span className="font-bold text-sm bg-purple-100 text-purple-800 px-2 py-0.5 rounded-md border border-purple-200">
                                    {r.submittedCode}
                                  </span>
                                ) : (
                                  <span className="text-gray-400 italic text-[11px]">Weli ma dirin</span>
                                )}
                              </td>
                              <td className="py-2.5 px-3">
                                <span
                                  className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                                    r.status === 'code_submitted_pending_admin'
                                      ? 'bg-purple-100 text-purple-800 animate-pulse'
                                      : r.status === 'verified'
                                      ? 'bg-green-100 text-green-800'
                                      : r.status === 'verification_failed'
                                      ? 'bg-red-100 text-red-800'
                                      : r.status === 'expired'
                                      ? 'bg-gray-100 text-gray-600'
                                      : 'bg-blue-100 text-blue-800'
                                  }`}
                                >
                                  {r.status === 'code_submitted_pending_admin'
                                    ? 'Koodh La Diray - Sugaya'
                                    : r.status === 'verified'
                                    ? 'Waa la Xaqiijiyay'
                                    : r.status === 'verification_failed'
                                    ? 'Waa la Diiday'
                                    : r.status === 'expired'
                                    ? 'Waqtigu Dhacay'
                                    : 'Sugaya Koodhka'}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-[11px] text-gray-500">
                                {new Date(r.createdAt).toLocaleTimeString('so-SO', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                {r.status === 'code_submitted_pending_admin' || r.status === 'pending_email_code' ? (
                                  <div className="flex justify-end gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleApproveVerif(r)}
                                      className="px-2.5 py-1 rounded-md bg-green-600 hover:bg-green-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                                      title="Oggolow Xaqiijinta"
                                    >
                                      Oggolow
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setSelectedVerifReq(r)}
                                      className="px-2.5 py-1 rounded-md bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                                      title="Diid Xaqiijinta"
                                    >
                                      Diid
                                    </button>
                                  </div>
                                ) : r.status === 'verified' ? (
                                  <span className="text-green-600 font-semibold text-xs">Oggolaansho</span>
                                ) : (
                                  <span className="text-red-500 font-semibold text-xs">Diidmo</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {filteredVerifRequests.length === 0 && (
                      <div className="py-8 text-center text-xs text-gray-500">
                        Lama helin codsiyo hubin oo buuxiyay shuruudaha.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                      <span className="text-xs text-gray-500 font-medium block">Wadarta Iibka</span>
                      <div className="text-2xl font-bold text-gray-900 tabular-nums">${verifiedSales.toFixed(2)}</div>
                    </div>
                    <div className="p-4 rounded-xl bg-purple-50 border border-purple-200">
                      <span className="text-xs text-purple-700 font-medium block">Hubin ku socoto (Koodh)</span>
                      <div className="text-2xl font-bold text-purple-900 tabular-nums">{underVerificationOrders}</div>
                    </div>
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                      <span className="text-xs text-amber-700 font-medium block">Sugaya Lacag-bixin</span>
                      <div className="text-2xl font-bold text-amber-900 tabular-nums">{awaitingPaymentReview}</div>
                    </div>
                    <div className="p-4 rounded-xl bg-green-50 border border-green-200">
                      <span className="text-xs text-green-700 font-medium block">Waa la dhammaystiray</span>
                      <div className="text-2xl font-bold text-green-900 tabular-nums">{completedOrders}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: PACKAGES */}
              {activeTab === 'packages' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-900">Xirmooyinka Ciyaaraha</h3>
                    <button
                      type="button"
                      onClick={() =>
                        setEditingPackage({
                          id: `pkg-${Date.now()}`,
                          game: 'PUBG Mobile',
                          name: 'Xirmo Cusub',
                          credits: '100 UC',
                          price: 1.5,
                          description: 'Faahfaahin',
                          active: true,
                          featured: false,
                          displayOrder: packages.length + 1,
                        })
                      }
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Ku dar</span>
                    </button>
                  </div>

                  {editingPackage && (
                    <form onSubmit={handleSavePackage} className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-gray-700 font-medium mb-1">Ciyaarta</label>
                          <select
                            value={editingPackage.game}
                            onChange={(e) => setEditingPackage({ ...editingPackage, game: e.target.value as any })}
                            className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5"
                          >
                            <option value="PUBG Mobile">PUBG Mobile</option>
                            <option value="eFootball">eFootball</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-gray-700 font-medium mb-1">Magaca</label>
                          <input
                            type="text"
                            value={editingPackage.name}
                            onChange={(e) => setEditingPackage({ ...editingPackage, name: e.target.value })}
                            className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 font-medium mb-1">Credits</label>
                          <input
                            type="text"
                            value={editingPackage.credits}
                            onChange={(e) => setEditingPackage({ ...editingPackage, credits: e.target.value })}
                            className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 font-medium mb-1">Qiimaha ($)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={editingPackage.price}
                            onChange={(e) => setEditingPackage({ ...editingPackage, price: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={() => setEditingPackage(null)} className="px-3 py-1.5 rounded-lg border border-gray-300">
                          Ka noqo
                        </button>
                        <button type="submit" className="px-3.5 py-1.5 rounded-lg bg-blue-600 text-white font-semibold">
                          Kaydi
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 border-b border-gray-200 font-semibold text-gray-600">
                        <tr>
                          <th className="py-2 px-3">Ciyaarta</th>
                          <th className="py-2 px-3">Magaca</th>
                          <th className="py-2 px-3">Credits</th>
                          <th className="py-2 px-3">Qiimaha</th>
                          <th className="py-2 px-3 text-right">Ficil</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {packages.map((p) => (
                          <tr key={p.id}>
                            <td className="py-2 px-3 font-semibold">{p.game}</td>
                            <td className="py-2 px-3">{p.name}</td>
                            <td className="py-2 px-3 font-mono text-blue-600">{p.credits}</td>
                            <td className="py-2 px-3 font-bold">${p.price.toFixed(2)}</td>
                            <td className="py-2 px-3 text-right space-x-1">
                              <button onClick={() => setEditingPackage(p)} className="p-1 text-blue-600 hover:text-blue-800">
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => handleDeletePackage(p.id)} className="p-1 text-red-600 hover:text-red-800">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB: PAYMENTS */}
              {activeTab === 'payments' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-900">Hababka Lacag-bixinta</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {paymentMethods.map((m) => (
                      <div key={m.id} className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-gray-900">{m.name}</span>
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={m.active}
                              onChange={(e) => handleSavePaymentMethod({ ...m, active: e.target.checked })}
                            />
                            <span>Shaqaynaya</span>
                          </label>
                        </div>
                        <div>
                          <label className="block text-gray-500 mb-0.5">Lambarka / Code:</label>
                          <input
                            type="text"
                            value={m.accountNumber}
                            onChange={(e) => handleSavePaymentMethod({ ...m, accountNumber: e.target.value })}
                            className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 font-mono text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-500 mb-0.5">Magaca Koontada:</label>
                          <input
                            type="text"
                            value={m.accountHolder}
                            onChange={(e) => handleSavePaymentMethod({ ...m, accountHolder: e.target.value })}
                            className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB: TELEGRAM */}
              {activeTab === 'telegram' && (
                <div className="space-y-4 max-w-lg">
                  <h3 className="text-sm font-bold text-gray-900">Ogeysiisyada Telegram</h3>
                  <form onSubmit={handleSaveTelegram} className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer font-bold">
                      <input
                        type="checkbox"
                        checked={telegramSettings.enabled}
                        onChange={(e) => setTelegramSettings({ ...telegramSettings, enabled: e.target.checked })}
                      />
                      <span>Shaqaysii Telegram Bot</span>
                    </label>

                    <div>
                      <label className="block text-gray-600 mb-1">Bot Token:</label>
                      <input
                        type="password"
                        value={telegramSettings.botToken}
                        onChange={(e) => setTelegramSettings({ ...telegramSettings, botToken: e.target.value })}
                        placeholder="123456:ABC-DEF..."
                        className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-600 mb-1">Chat ID:</label>
                      <input
                        type="text"
                        value={telegramSettings.chatId}
                        onChange={(e) => setTelegramSettings({ ...telegramSettings, chatId: e.target.value })}
                        placeholder="-100123456789"
                        className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 font-mono"
                      />
                    </div>

                    {telegramTestStatus.message && (
                      <div className={`p-2.5 rounded-lg text-xs ${
                        telegramTestStatus.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                      }`}>
                        {telegramTestStatus.message}
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={handleTestTelegram}
                        disabled={telegramTestStatus.loading}
                        className="px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-100 font-semibold cursor-pointer"
                      >
                        {telegramTestStatus.loading ? 'Waa la tijaabinayaa...' : 'Tijaabi'}
                      </button>
                      <button type="submit" className="px-3.5 py-1.5 rounded-lg bg-blue-600 text-white font-semibold cursor-pointer">
                        Kaydi
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB: ANALYTICS */}
              {activeTab === 'analytics' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-900">Xogta Booqdayaasha</h3>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                    <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                      <span className="text-gray-500 block">Booqashooyinka (Views)</span>
                      <span className="text-2xl font-bold text-gray-900">{analytics.pageViews}</span>
                    </div>
                    <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                      <span className="text-gray-500 block">Booqdayaasha Gaarka ah</span>
                      <span className="text-2xl font-bold text-blue-600">{analytics.uniqueVisitors}</span>
                    </div>
                    <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                      <span className="text-gray-500 block">Checkout La Bilaabay</span>
                      <span className="text-2xl font-bold text-gray-900">{analytics.checkoutStarts}</span>
                    </div>
                    <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                      <span className="text-gray-500 block">Checkout La Dhammeeyay</span>
                      <span className="text-2xl font-bold text-green-600">{analytics.checkoutCompletes}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      )}
    </div>
  );
};
