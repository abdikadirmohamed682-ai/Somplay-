import {
  GamePackage,
  Order,
  OrderStatus,
  PaymentMethod,
  PromoBanner,
  TelegramSettings,
  VisitorAnalyticsData,
  VerificationRequest,
  AdminNotification,
} from '../types';
import {
  INITIAL_BANNERS,
  INITIAL_ORDERS,
  INITIAL_PACKAGES,
  INITIAL_PAYMENT_METHODS,
  INITIAL_TELEGRAM_SETTINGS,
} from '../data/initialData';
import { sendTelegramNotification } from './telegram';

const STORAGE_KEYS = {
  PACKAGES: 'somtopup_packages_v2',
  BANNERS: 'somtopup_banners_v2',
  PAYMENT_METHODS: 'somtopup_payment_methods_v2',
  ORDERS: 'somtopup_orders_v2',
  VERIFICATIONS: 'somtopup_verifications_v2',
  NOTIFICATIONS: 'somtopup_notifications_v2',
  TELEGRAM: 'somtopup_telegram_v2',
  ANALYTICS: 'somtopup_analytics_v2',
  ADMIN_TOKEN: 'somtopup_admin_token',
  GUEST_SESSION: 'somtopup_guest_session_id',
  SESSION_ORDERS: 'somtopup_session_order_ids',
};

// Persistent Guest Session Helper for same-session tracking
export function getGuestSessionId(): string {
  try {
    let sid = localStorage.getItem(STORAGE_KEYS.GUEST_SESSION);
    if (!sid) {
      sid = 'gst_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 10);
      localStorage.setItem(STORAGE_KEYS.GUEST_SESSION, sid);
    }
    return sid;
  } catch (e) {
    return 'gst_fallback_' + Date.now();
  }
}

export function getSessionOrderIds(): string[] {
  return getFromStorage<string[]>(STORAGE_KEYS.SESSION_ORDERS, []);
}

export function addSessionOrderId(orderId: string): void {
  try {
    const list = getSessionOrderIds();
    const cleanId = orderId.trim().toUpperCase();
    if (!list.includes(cleanId)) {
      list.unshift(cleanId);
      saveToStorage(STORAGE_KEYS.SESSION_ORDERS, list);
    }
  } catch (e) {
    console.error('Failed to save session order id:', e);
  }
}

// Server admin synchronization helper
async function syncOrderStatusWithBackend(
  orderId: string,
  status: OrderStatus,
  adminNotes?: string,
  failureReason?: string
) {
  try {
    await fetch(`/api/admin/orders/${orderId}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer authorized_session',
      },
      body: JSON.stringify({ status, adminNotes, failureReason }),
    });
  } catch (e) {
    console.error('Error syncing order status with backend:', e);
  }
}

// Safe JSON parse helper
function getFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    console.error(`Error reading ${key} from storage:`, e);
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event('somtopup_storage_update'));
  } catch (e) {
    console.error(`Error saving ${key} to storage:`, e);
  }
}

/* ================== ADMIN AUTHORIZATION ================== */
const ADMIN_SECRET_PIN = 'admin1234';

export function isAdminAuthenticated(): boolean {
  return sessionStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN) === 'authorized_session';
}

export function adminLogin(pin: string): { success: boolean; message: string } {
  if (pin.trim() === ADMIN_SECRET_PIN) {
    sessionStorage.setItem(STORAGE_KEYS.ADMIN_TOKEN, 'authorized_session');
    sessionStorage.setItem('somtopup_admin_session', 'true');
    return { success: true, message: 'Si guul leh ayaad u soo gashay maamulka.' };
  }
  return { success: false, message: 'PIN-ka aad gelisay ma saxna.' };
}

export function adminLogout(): void {
  sessionStorage.removeItem(STORAGE_KEYS.ADMIN_TOKEN);
  sessionStorage.removeItem('somtopup_admin_session');
}

/* ================== PACKAGES ================== */
export function getPackages(): GamePackage[] {
  return getFromStorage<GamePackage[]>(STORAGE_KEYS.PACKAGES, INITIAL_PACKAGES);
}

export function savePackage(pkg: GamePackage): void {
  const packages = getPackages();
  const existingIdx = packages.findIndex((p) => p.id === pkg.id);
  if (existingIdx >= 0) {
    packages[existingIdx] = pkg;
  } else {
    packages.push(pkg);
  }
  saveToStorage(STORAGE_KEYS.PACKAGES, packages);
}

export function deletePackage(id: string): void {
  const packages = getPackages().filter((p) => p.id !== id);
  saveToStorage(STORAGE_KEYS.PACKAGES, packages);
}

/* ================== BANNERS ================== */
export function getBanners(): PromoBanner[] {
  return getFromStorage<PromoBanner[]>(STORAGE_KEYS.BANNERS, INITIAL_BANNERS);
}

export function saveBanner(banner: PromoBanner): void {
  const banners = getBanners();
  const existingIdx = banners.findIndex((b) => b.id === banner.id);
  if (existingIdx >= 0) {
    banners[existingIdx] = banner;
  } else {
    banners.push(banner);
  }
  saveToStorage(STORAGE_KEYS.BANNERS, banners);
}

export function deleteBanner(id: string): void {
  const banners = getBanners().filter((b) => b.id !== id);
  saveToStorage(STORAGE_KEYS.BANNERS, banners);
}

/* ================== PAYMENT METHODS ================== */
export function getPaymentMethods(): PaymentMethod[] {
  return getFromStorage<PaymentMethod[]>(STORAGE_KEYS.PAYMENT_METHODS, INITIAL_PAYMENT_METHODS);
}

export function savePaymentMethod(method: PaymentMethod): void {
  const methods = getPaymentMethods();
  const idx = methods.findIndex((m) => m.id === method.id);
  if (idx >= 0) {
    methods[idx] = method;
  } else {
    methods.push(method);
  }
  saveToStorage(STORAGE_KEYS.PAYMENT_METHODS, methods);
}

/* ================== TELEGRAM SETTINGS ================== */
export function getTelegramSettings(): TelegramSettings {
  return getFromStorage<TelegramSettings>(STORAGE_KEYS.TELEGRAM, INITIAL_TELEGRAM_SETTINGS);
}

export function saveTelegramSettings(settings: TelegramSettings): void {
  saveToStorage(STORAGE_KEYS.TELEGRAM, settings);
}

/* ================== ORDERS & WORKFLOWS ================== */
export function getOrders(): Order[] {
  return getFromStorage<Order[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
}

export function getOrderById(id: string): Order | undefined {
  const orders = getOrders();
  return orders.find((o) => o.id.toUpperCase() === id.trim().toUpperCase());
}

/**
 * Game Flow A: PUBG Mobile
 * Final order is created ONLY AFTER customer submits sender phone number.
 */
export async function createFinalPubgOrder(params: {
  packageId: string;
  packageName: string;
  packageCredits: string;
  price: number;
  playerId: string;
  playerNickname: string;
  paymentMethodId: string;
  paymentMethodName: string;
  senderPhoneNumber: string;
}): Promise<{ success: boolean; order?: Order; error?: string }> {
  const orders = getOrders();
  const cleanPhone = params.senderPhoneNumber.trim();

  if (!cleanPhone) {
    return { success: false, error: 'Fadlan geli lambarka aad lacagta ka dirtay.' };
  }

  const orderNumber = `SOM-PUB-${Math.floor(1000 + Math.random() * 9000)}`;
  const now = new Date().toISOString();

  const newOrder: Order = {
    id: orderNumber,
    game: 'PUBG Mobile',
    packageId: params.packageId,
    packageName: params.packageName,
    packageCredits: params.packageCredits,
    price: params.price,
    currency: 'USD',
    playerId: params.playerId.trim(),
    playerNickname: params.playerNickname.trim(),
    paymentMethodId: params.paymentMethodId,
    paymentMethodName: params.paymentMethodName,
    senderPhoneNumber: cleanPhone,
    paymentSubmittedAt: now,
    status: 'Sugaya Hubin', // Payment under review
    createdAt: now,
    updatedAt: now,
    history: [
      {
        status: 'Sugaya Hubin',
        timestamp: now,
        note: `Dalabka PUBG Mobile waa la gudbiyay. Lambarka lacagta laga diray: ${cleanPhone}. Sugaya hubinta maamulka.`,
      },
    ],
  };

  orders.unshift(newOrder);
  saveToStorage(STORAGE_KEYS.ORDERS, orders);

  // Notify Telegram
  const tgSettings = getTelegramSettings();
  sendTelegramNotification(tgSettings, 'pubg_final_order', newOrder).catch(console.error);

  trackCheckoutComplete();

  return { success: true, order: newOrder };
}

/**
 * Game Flow B: eFootball - Step 3:
 * Creates exactly ONE eFootball order as 'Sugaya Xaqiijin'.
 * The admin will manually send a verification code to customer's email via Gmail.
 */
export async function createEfootballOrder(params: {
  packageId: string;
  packageName: string;
  packageCredits: string;
  price: number;
  playerId: string;
  email: string;
}): Promise<{ success: boolean; order: Order }> {
  const orders = getOrders();
  const orderNumber = `SOM-EFB-${Math.floor(1000 + Math.random() * 9000)}`;
  const now = new Date().toISOString();

  const newOrder: Order = {
    id: orderNumber,
    game: 'eFootball',
    packageId: params.packageId,
    packageName: params.packageName,
    packageCredits: params.packageCredits,
    price: params.price,
    currency: 'USD',
    playerId: params.playerId.trim(),
    email: params.email.trim().toLowerCase(),
    status: 'Sugaya Xaqiijin', // Awaiting verification
    createdAt: now,
    updatedAt: now,
    history: [
      {
        status: 'Sugaya Xaqiijin',
        timestamp: now,
        note: 'Dalabka eFootball waa la diiwaangeliyay. Maamuluhu wuxuu koodhka ku soo diri doonaa Gmail.',
      },
    ],
  };

  orders.unshift(newOrder);
  saveToStorage(STORAGE_KEYS.ORDERS, orders);

  // Notify Telegram about new eFootball order
  const tgSettings = getTelegramSettings();
  sendTelegramNotification(tgSettings, 'new_efootball_order', newOrder).catch(console.error);

  return { success: true, order: newOrder };
}

/**
 * Game Flow B: eFootball - Step 5:
 * Customer enters the code received from the admin via Gmail.
 * Associates the submitted code with the SAME order.
 * Transitions status to 'Hubin ku socoto' (Under review).
 * NO AUTOMATIC COMPARISON. The admin will review it manually in the dashboard.
 */
export async function submitEfootballVerificationCode(
  orderId: string,
  enteredCode: string
): Promise<{ success: boolean; message: string; order?: Order }> {
  const cleanCode = enteredCode.trim();
  if (!cleanCode) {
    return { success: false, message: 'Fadlan geli koodhka aad heshay.' };
  }

  const orders = getOrders();
  const orderIdx = orders.findIndex((o) => o.id === orderId);
  if (orderIdx === -1) {
    return { success: false, message: 'Dalabka lama helin.' };
  }

  const now = new Date().toISOString();
  orders[orderIdx].submittedVerificationCode = cleanCode;
  orders[orderIdx].verificationCodeSubmittedAt = now;
  orders[orderIdx].status = 'Hubin ku socoto'; // Under review
  orders[orderIdx].updatedAt = now;

  orders[orderIdx].history.push({
    status: 'Hubin ku socoto',
    timestamp: now,
    note: `Macmiilku wuxuu soo gudbiyay koodhka: ${cleanCode}. Waxaa socota hubinta maamulaha.`,
  });

  saveToStorage(STORAGE_KEYS.ORDERS, orders);

  // Notify Telegram that customer submitted a code
  const tgSettings = getTelegramSettings();
  sendTelegramNotification(tgSettings, 'code_submitted', orders[orderIdx]).catch(console.error);

  return {
    success: true,
    message: 'Koodhkaaga waa la gudbiyay. Fadlan sug inta maamuluhu xaqiijinayo.',
    order: orders[orderIdx],
  };
}

/**
 * Game Flow B: eFootball - Step 8:
 * Admin manually clicks "Approve verification".
 * Backend authorizes admin, updates status to 'Sugaya Lacag-bixin'.
 */
export async function approveEfootballVerification(
  orderId: string,
  adminNotes?: string
): Promise<{ success: boolean; message: string; order?: Order }> {
  if (!isAdminAuthenticated()) {
    return { success: false, message: 'Ficilkan wuxuu u xiran yahay maamulaha kaliya.' };
  }

  const orders = getOrders();
  const orderIdx = orders.findIndex((o) => o.id === orderId);
  if (orderIdx === -1) {
    return { success: false, message: 'Dalabka lama helin.' };
  }

  const now = new Date().toISOString();
  orders[orderIdx].verificationDecision = 'approved';
  orders[orderIdx].verificationDecisionAt = now;
  orders[orderIdx].verificationDecisionBy = 'Maamule';
  orders[orderIdx].status = 'Sugaya Lacag-bixin'; // Customer can now proceed to payment
  orders[orderIdx].updatedAt = now;
  if (adminNotes) orders[orderIdx].adminNotes = adminNotes;

  orders[orderIdx].history.push({
    status: 'Sugaya Lacag-bixin',
    timestamp: now,
    note: adminNotes || 'Maamuluhu wuxuu si buuxda u oggolaaday xaqiijinta koodhka.',
  });

  saveToStorage(STORAGE_KEYS.ORDERS, orders);

  const tgSettings = getTelegramSettings();
  sendTelegramNotification(tgSettings, 'verification_approved', orders[orderIdx]).catch(console.error);

  return {
    success: true,
    message: 'Xaqiijinta si guul leh ayaa loo oggolaaday.',
    order: orders[orderIdx],
  };
}

/**
 * Game Flow B: eFootball - Step 9:
 * Admin manually clicks "Reject verification".
 * Updates status to 'Xaqiijintu way fashilantay'.
 */
export async function rejectEfootballVerification(
  orderId: string,
  reason: string
): Promise<{ success: boolean; message: string; order?: Order }> {
  if (!isAdminAuthenticated()) {
    return { success: false, message: 'Ficilkan wuxuu u xiran yahay maamulaha kaliya.' };
  }

  const orders = getOrders();
  const orderIdx = orders.findIndex((o) => o.id === orderId);
  if (orderIdx === -1) {
    return { success: false, message: 'Dalabka lama helin.' };
  }

  const now = new Date().toISOString();
  orders[orderIdx].verificationDecision = 'rejected';
  orders[orderIdx].verificationDecisionAt = now;
  orders[orderIdx].verificationDecisionBy = 'Maamule';
  orders[orderIdx].verificationRejectReason = reason.trim() || 'Koodhka aad gelisay kuma habboona xogtayada.';
  orders[orderIdx].status = 'Xaqiijintu way fashilantay';
  orders[orderIdx].updatedAt = now;

  orders[orderIdx].history.push({
    status: 'Xaqiijintu way fashilantay',
    timestamp: now,
    note: `Xaqiijinta waa la diiday: ${orders[orderIdx].verificationRejectReason}`,
  });

  saveToStorage(STORAGE_KEYS.ORDERS, orders);

  const tgSettings = getTelegramSettings();
  sendTelegramNotification(tgSettings, 'verification_rejected', orders[orderIdx], reason).catch(console.error);

  return {
    success: true,
    message: 'Xaqiijinta waa la diiday.',
    order: orders[orderIdx],
  };
}

/**
 * Game Flow B: eFootball - Step 10:
 * Customer submits sender phone number for the SAME order.
 * Transitions status to 'Sugaya Hubin'.
 */
export async function submitOrderPaymentPhone(params: {
  orderId: string;
  paymentMethodId: string;
  paymentMethodName: string;
  senderPhoneNumber: string;
}): Promise<{ success: boolean; message: string; order?: Order }> {
  const cleanPhone = params.senderPhoneNumber.trim();
  if (!cleanPhone) {
    return { success: false, message: 'Fadlan geli lambarka aad lacagta ka dirtay.' };
  }

  const orders = getOrders();
  const orderIdx = orders.findIndex((o) => o.id === params.orderId);
  if (orderIdx === -1) {
    return { success: false, message: 'Dalabka lama helin.' };
  }

  // Ensure customer cannot submit payment if verification is not approved
  if (
    orders[orderIdx].game === 'eFootball' &&
    orders[orderIdx].verificationDecision !== 'approved'
  ) {
    return {
      success: false,
      message: 'Lama bixin karo lacagta ka hor inta aan xaqiijinta la oggolaan.',
    };
  }

  const now = new Date().toISOString();
  orders[orderIdx].paymentMethodId = params.paymentMethodId;
  orders[orderIdx].paymentMethodName = params.paymentMethodName;
  orders[orderIdx].senderPhoneNumber = cleanPhone;
  orders[orderIdx].paymentSubmittedAt = now;
  orders[orderIdx].status = 'Sugaya Hubin'; // Payment under review
  orders[orderIdx].updatedAt = now;

  orders[orderIdx].history.push({
    status: 'Sugaya Hubin',
    timestamp: now,
    note: `Macmiilku wuxuu soo gudbiyay lambarka lacagta laga diray: ${cleanPhone}. Sugaya hubinta maamulaha.`,
  });

  saveToStorage(STORAGE_KEYS.ORDERS, orders);

  const tgSettings = getTelegramSettings();
  sendTelegramNotification(tgSettings, 'payment_submitted', orders[orderIdx]).catch(console.error);

  trackCheckoutComplete();

  return {
    success: true,
    message: 'Xogta lacag-bixinta si guul leh ayaa loo gudbiyay.',
    order: orders[orderIdx],
  };
}

/**
 * Admin action: Confirm Payment & Move to Processing
 */
export async function confirmOrderPayment(
  orderId: string,
  adminNotes?: string
): Promise<{ success: boolean; message: string; order?: Order }> {
  if (!isAdminAuthenticated()) {
    return { success: false, message: 'Ficilkan wuxuu u xiran yahay maamulaha kaliya.' };
  }

  const orders = getOrders();
  const orderIdx = orders.findIndex((o) => o.id === orderId);
  if (orderIdx === -1) return { success: false, message: 'Dalabka lama helin.' };

  const now = new Date().toISOString();
  orders[orderIdx].paymentConfirmedAt = now;
  orders[orderIdx].status = 'Waa la shaqaynayaa'; // Processing
  orders[orderIdx].updatedAt = now;
  if (adminNotes) orders[orderIdx].adminNotes = adminNotes;

  orders[orderIdx].history.push({
    status: 'Waa la shaqaynayaa',
    timestamp: now,
    note: adminNotes || 'Lacag-bixinta waa la xaqiijiyay. Shubista ayaa hadda socota.',
  });

  saveToStorage(STORAGE_KEYS.ORDERS, orders);

  // Sync with server database db.json
  syncOrderStatusWithBackend(orderId, 'Waa la shaqaynayaa', adminNotes);

  const tgSettings = getTelegramSettings();
  sendTelegramNotification(tgSettings, 'payment_confirmed', orders[orderIdx]).catch(console.error);

  return { success: true, message: 'Lacag-bixinta waa la xaqiijiyay.', order: orders[orderIdx] };
}

/**
 * Admin action: Mark Order as Completed
 */
export async function completeOrder(
  orderId: string,
  adminNotes?: string
): Promise<{ success: boolean; message: string; order?: Order }> {
  if (!isAdminAuthenticated()) {
    return { success: false, message: 'Ficilkan wuxuu u xiran yahay maamulaha kaliya.' };
  }

  const orders = getOrders();
  const orderIdx = orders.findIndex((o) => o.id === orderId);
  if (orderIdx === -1) return { success: false, message: 'Dalabka lama helin.' };

  const now = new Date().toISOString();
  orders[orderIdx].completedAt = now;
  orders[orderIdx].status = 'Waa la dhammaystiray';
  orders[orderIdx].updatedAt = now;
  if (adminNotes) orders[orderIdx].adminNotes = adminNotes;

  orders[orderIdx].history.push({
    status: 'Waa la dhammaystiray',
    timestamp: now,
    note: adminNotes || 'Dalabka si guul leh ayaa loo dhammaystiray.',
  });

  saveToStorage(STORAGE_KEYS.ORDERS, orders);

  // Sync with server database db.json
  syncOrderStatusWithBackend(orderId, 'Waa la dhammaystiray', adminNotes);

  const tgSettings = getTelegramSettings();
  sendTelegramNotification(tgSettings, 'status_changed', orders[orderIdx]).catch(console.error);

  return { success: true, message: 'Dalabka waa la dhammaystiray.', order: orders[orderIdx] };
}

/**
 * Admin action: Reject Payment or Fail Order
 */
export async function failOrder(
  orderId: string,
  failureReason: string
): Promise<{ success: boolean; message: string; order?: Order }> {
  if (!isAdminAuthenticated()) {
    return { success: false, message: 'Ficilkan wuxuu u xiran yahay maamulaha kaliya.' };
  }

  const orders = getOrders();
  const orderIdx = orders.findIndex((o) => o.id === orderId);
  if (orderIdx === -1) return { success: false, message: 'Dalabka lama helin.' };

  const now = new Date().toISOString();
  orders[orderIdx].status = 'Wuu fashilmay';
  orders[orderIdx].failureReason = failureReason.trim() || 'Lacagta lama helin ama xogta ma saxna.';
  orders[orderIdx].paymentRejectedAt = now;
  orders[orderIdx].updatedAt = now;

  orders[orderIdx].history.push({
    status: 'Wuu fashilmay',
    timestamp: now,
    note: `Dalabka wuu fashilmay: ${orders[orderIdx].failureReason}`,
  });

  saveToStorage(STORAGE_KEYS.ORDERS, orders);

  // Sync with server database db.json
  syncOrderStatusWithBackend(orderId, 'Wuu fashilmay', undefined, failureReason);

  const tgSettings = getTelegramSettings();
  sendTelegramNotification(tgSettings, 'status_changed', orders[orderIdx], failureReason).catch(console.error);

  return { success: true, message: 'Dalabka waxaa loo calaamadeeyay inuu fashilmay.', order: orders[orderIdx] };
}

/* ================== VISITOR ANALYTICS ================== */
const INITIAL_ANALYTICS: VisitorAnalyticsData = {
  pageViews: 142,
  uniqueVisitors: 89,
  checkoutStarts: 38,
  checkoutCompletes: 24,
  visitsByPage: {
    '/': 120,
    '/pubg': 78,
    '/efootball': 52,
  },
  visitsByGame: {
    'PUBG Mobile': 185,
    'eFootball': 142,
  },
  dailyVisits: [
    { date: '2026-10-04', views: 88, visitors: 42 },
    { date: '2026-10-05', views: 104, visitors: 58 },
    { date: '2026-10-06', views: 125, visitors: 71 },
    { date: '2026-10-07', views: 110, visitors: 62 },
    { date: '2026-10-08', views: 145, visitors: 83 },
    { date: '2026-10-09', views: 160, visitors: 94 },
    { date: '2026-10-10', views: 142, visitors: 89 },
  ],
};

export function getAnalytics(): VisitorAnalyticsData {
  return getFromStorage<VisitorAnalyticsData>(STORAGE_KEYS.ANALYTICS, INITIAL_ANALYTICS);
}

export function trackPageView(page: string, game?: string): void {
  if (sessionStorage.getItem('somtopup_admin_session')) return;

  const data = getAnalytics();
  data.pageViews += 1;

  if (!sessionStorage.getItem('somtopup_visited')) {
    sessionStorage.setItem('somtopup_visited', 'true');
    data.uniqueVisitors += 1;
  }

  data.visitsByPage[page] = (data.visitsByPage[page] || 0) + 1;
  if (game) {
    data.visitsByGame[game] = (data.visitsByGame[game] || 0) + 1;
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const todayEntry = data.dailyVisits.find((d) => d.date === todayStr);
  if (todayEntry) {
    todayEntry.views += 1;
  } else {
    data.dailyVisits.push({ date: todayStr, views: 1, visitors: 1 });
  }

  saveToStorage(STORAGE_KEYS.ANALYTICS, data);
}

export function trackCheckoutStart(): void {
  if (sessionStorage.getItem('somtopup_admin_session')) return;
  const data = getAnalytics();
  data.checkoutStarts += 1;
  saveToStorage(STORAGE_KEYS.ANALYTICS, data);
}

/* ================== VERIFICATION REQUESTS ================== */
export function getVerificationRequests(): VerificationRequest[] {
  return getFromStorage<VerificationRequest[]>(STORAGE_KEYS.VERIFICATIONS, []);
}

export function saveVerificationRequest(req: VerificationRequest): void {
  const list = getVerificationRequests();
  const idx = list.findIndex((r) => r.id === req.id);
  if (idx >= 0) {
    list[idx] = req;
  } else {
    list.unshift(req);
  }
  saveToStorage(STORAGE_KEYS.VERIFICATIONS, list);
}

export async function approveVerificationRequest(
  requestId: string,
  adminNotes?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('/api/admin/efootball/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer authorized_session',
      },
      body: JSON.stringify({ requestId, action: 'approve', adminNotes }),
    });
    if (res.ok) {
      const data = await res.json();
      return { success: true, message: 'Xaqiijinta si guul leh ayaa loo oggolaaday.' };
    }
  } catch (e) {
    console.warn('API error, applying storage fallback:', e);
  }

  // Fallback
  const list = getVerificationRequests();
  const req = list.find((r) => r.id === requestId);
  if (req) {
    req.status = 'verified';
    req.decisionBy = 'Maamule';
    req.decisionAt = new Date().toISOString();
    saveVerificationRequest(req);
    approveEfootballVerification(req.orderId, adminNotes);
    return { success: true, message: 'Xaqiijinta si guul leh ayaa loo oggolaaday.' };
  }
  return { success: false, message: 'Codsiga lama helin.' };
}

export async function rejectVerificationRequest(
  requestId: string,
  reason: string
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('/api/admin/efootball/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer authorized_session',
      },
      body: JSON.stringify({ requestId, action: 'reject', rejectReason: reason }),
    });
    if (res.ok) {
      return { success: true, message: 'Xaqiijinta waa la diiday.' };
    }
  } catch (e) {
    console.warn('API error, applying storage fallback:', e);
  }

  // Fallback
  const list = getVerificationRequests();
  const req = list.find((r) => r.id === requestId);
  if (req) {
    req.status = 'verification_failed';
    req.decisionBy = 'Maamule';
    req.decisionAt = new Date().toISOString();
    req.rejectReason = reason;
    saveVerificationRequest(req);
    rejectEfootballVerification(req.orderId, reason);
    return { success: true, message: 'Xaqiijinta waa la diiday.' };
  }
  return { success: false, message: 'Codsiga lama helin.' };
}

/* ================== ADMIN NOTIFICATIONS ================== */
export function getAdminNotifications(): AdminNotification[] {
  return getFromStorage<AdminNotification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
}

export function saveAdminNotification(notif: AdminNotification): void {
  const list = getAdminNotifications();
  list.unshift(notif);
  saveToStorage(STORAGE_KEYS.NOTIFICATIONS, list);
}

export async function markNotificationRead(id: string): Promise<void> {
  try {
    await fetch(`/api/admin/notifications/${id}/read`, {
      method: 'POST',
      headers: { Authorization: 'Bearer authorized_session' },
    });
  } catch (e) {}

  const list = getAdminNotifications();
  const notif = list.find((n) => n.id === id);
  if (notif) {
    notif.read = true;
    saveToStorage(STORAGE_KEYS.NOTIFICATIONS, list);
  }
}

export function trackCheckoutComplete(): void {
  if (sessionStorage.getItem('somtopup_admin_session')) return;
  const data = getAnalytics();
  data.checkoutCompletes += 1;
  saveToStorage(STORAGE_KEYS.ANALYTICS, data);
}
