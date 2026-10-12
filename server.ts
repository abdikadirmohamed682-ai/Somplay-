import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const DB_FILE = path.resolve(__dirname, 'data/db.json');

// Real server-validated packages data
const SERVER_PACKAGES = [
  // PUBG Mobile Packages
  { id: 'pubg-60-uc', game: 'PUBG Mobile', credits: '60 UC', price: 0.99 },
  { id: 'pubg-325-uc', game: 'PUBG Mobile', credits: '325 UC', price: 4.85 },
  { id: 'pubg-660-uc', game: 'PUBG Mobile', credits: '660 UC', price: 9.60 },
  { id: 'pubg-1800-uc', game: 'PUBG Mobile', credits: '1,800 UC', price: 24.00 },
  { id: 'pubg-3850-uc', game: 'PUBG Mobile', credits: '3,850 UC', price: 48.50 },
  { id: 'pubg-8100-uc', game: 'PUBG Mobile', credits: '8,100 UC', price: 97.00 },
  // eFootball Packages
  { id: 'efb-130-coins', game: 'eFootball', credits: '130 Coins', price: 1.20 },
  { id: 'efb-320-coins', game: 'eFootball', credits: '320 Coins', price: 2.85 },
  { id: 'efb-550-coins', game: 'eFootball', credits: '550 Coins', price: 4.80 },
  { id: 'efb-1050-coins', game: 'eFootball', credits: '1,050 Coins', price: 8.90 },
  { id: 'efb-2130-coins', game: 'eFootball', credits: '2,130 Coins', price: 17.50 },
  { id: 'efb-3280-coins', game: 'eFootball', credits: '3280 Coins', price: 26.80 },
];

interface WalletConfig {
  provider: 'hormuud' | 'sahal';
  name: string;
  serviceCode: string;
  merchantWallet: string;
  instructions: string;
  active: boolean;
}

interface DBStructure {
  orders: any[];
  verificationRequests: any[];
  notifications: any[];
  wallets?: Record<string, WalletConfig>;
}

const DEFAULT_WALLETS: Record<string, WalletConfig> = {
  hormuud: {
    provider: 'hormuud',
    name: 'Hormuud (EVC Plus)',
    serviceCode: '712',
    merchantWallet: '615948077',
    instructions: 'Garaac koodhka tooska ah ee USSD ama u wareeji lacagta lambarka koontada kor ku xusan.',
    active: true,
  },
  sahal: {
    provider: 'sahal',
    name: 'Sahal (Golis)',
    serviceCode: '', // Service code not yet confirmed for Sahal in production
    merchantWallet: '678123490',
    instructions: 'U wareeji lacagta akoonka Sahal ee kor ku xusan adoo isticmaalaya adeegga Sahal.',
    active: true,
  },
};

function readDb(): DBStructure {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initial: DBStructure = { orders: [], verificationRequests: [], notifications: [], wallets: DEFAULT_WALLETS };
      fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2));
      return initial;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!parsed.wallets) {
      parsed.wallets = DEFAULT_WALLETS;
    }
    return parsed;
  } catch (e) {
    console.error('Error reading db.json:', e);
    return { orders: [], verificationRequests: [], notifications: [], wallets: DEFAULT_WALLETS };
  }
}

function writeDb(data: DBStructure) {
  try {
    fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Error writing db.json:', e);
  }
}

// Telegram helper for server-side dispatches
async function dispatchTelegram(text: string) {
  try {
    // Read telegram settings if present in data/telegram.json or storage
    const telegramFile = path.resolve(__dirname, 'data/telegram.json');
    if (fs.existsSync(telegramFile)) {
      const cfg = JSON.parse(fs.readFileSync(telegramFile, 'utf-8'));
      if (cfg.enabled && cfg.botToken && cfg.chatId) {
        await fetch(`https://api.telegram.org/bot${cfg.botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: cfg.chatId,
            text,
            parse_mode: 'HTML',
          }),
        });
      }
    }
  } catch (e) {
    console.error('Server telegram dispatch error:', e);
  }
}

function checkAdminAuth(req: Request): boolean {
  const authHeader = req.headers.authorization;
  if (authHeader === 'Bearer authorized_session') return true;
  const pin = req.headers['x-admin-pin'] || (req.body && req.body.adminPin);
  return pin === 'admin1234';
}

async function startServer() {
  const app = express();
  app.use(express.json());

  /* ---------------- API ROUTES ---------------- */

  // 1. Health check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', serverTime: new Date().toISOString() });
  });

  // 2. PUBG Mobile - Direct order creation
  app.post('/api/checkout/pubg', (req: Request, res: Response) => {
    const {
      packageId,
      price,
      playerId,
      playerNickname,
      paymentMethodId,
      paymentMethodName,
      walletProvider,
      senderPhoneNumber,
      receiptImage,
      guestSessionId,
    } = req.body;

    if (!playerId || !playerId.trim()) {
      return res.status(400).json({ error: 'Player ID waa waajib.' });
    }
    if (!playerNickname || !playerNickname.trim()) {
      return res.status(400).json({ error: 'In-game nickname waa waajib.' });
    }
    if (!senderPhoneNumber || !senderPhoneNumber.trim()) {
      return res.status(400).json({ error: 'Fadlan geli lambarka aad lacagta ka dirtay.' });
    }

    // Server-side package and price validation
    const serverPkg = SERVER_PACKAGES.find((p) => p.id === packageId && p.game === 'PUBG Mobile');
    if (!serverPkg) {
      return res.status(400).json({ error: 'Xirmo PUBG Mobile oo sax ah lama helin.' });
    }
    if (Math.abs(serverPkg.price - Number(price)) > 0.01) {
      return res.status(400).json({ error: 'Qiimaha xirmada waa la khalkhaliyay.' });
    }

    const db = readDb();
    const orderId = `SOM-PUB-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();

    const order = {
      id: orderId,
      game: 'PUBG Mobile',
      packageId: serverPkg.id,
      packageName: `Xirmo ${serverPkg.credits}`,
      packageCredits: serverPkg.credits,
      price: serverPkg.price,
      currency: 'USD',
      playerId: playerId.trim(),
      playerNickname: playerNickname.trim(),
      paymentMethodId: paymentMethodId || 'pay-hormuud',
      paymentMethodName: paymentMethodName || 'Hormuud (EVC Plus)',
      walletProvider: walletProvider || (paymentMethodId?.includes('sahal') ? 'sahal' : 'hormuud'),
      senderPhoneNumber: senderPhoneNumber.trim(),
      receiptImage: receiptImage || undefined,
      paymentSubmittedAt: now,
      status: 'Sugaya Hubin',
      createdAt: now,
      updatedAt: now,
      guestSessionId: guestSessionId ? String(guestSessionId).trim() : undefined,
      history: [
        {
          status: 'Sugaya Hubin',
          timestamp: now,
          note: `Dalabka PUBG Mobile (${serverPkg.credits}) waa la gudbiyay. Tel diraha: ${senderPhoneNumber.trim()}${receiptImage ? ' (Sawirka rasiidka waa la lifaaqay)' : ''}`,
        },
      ],
    };

    db.orders.unshift(order);

    // Add persistent admin notification
    db.notifications.unshift({
      id: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: 'pubg_order',
      title: `Dalab Cusub: ${order.id} (PUBG Mobile)`,
      message: `${order.playerId} (${order.playerNickname}) wuxuu dalbaday ${order.packageCredits} ($${order.price}). Tel: ${order.senderPhoneNumber}${receiptImage ? ' [Rasiid lifaaqan]' : ''}`,
      referenceId: order.id,
      createdAt: now,
      read: false,
    });

    writeDb(db);
    dispatchTelegram(`🎮 <b>Dalab Cusub oo PUBG Mobile ah!</b>\nOrder: ${order.id}\nPlayer ID: ${order.playerId}\nNick: ${order.playerNickname}\nXirmo: ${order.packageCredits} ($${order.price})\nTel Diraha: ${order.senderPhoneNumber}${receiptImage ? '\n📸 Rasiid waa la soo lifaaqay' : ''}`);

    return res.json({ success: true, order });
  });

  // 3. eFootball - Step 1: Initiate verification request
  app.post('/api/checkout/efootball/initiate', (req: Request, res: Response) => {
    const { packageId, price, playerId, email, guestSessionId } = req.body;

    if (!playerId || !playerId.trim()) {
      return res.status(400).json({ error: 'Player ID waa waajib.' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      return res.status(400).json({ error: 'Fadlan geli cinwaan iimayl sax ah.' });
    }

    // Server-side package validation
    const serverPkg = SERVER_PACKAGES.find((p) => p.id === packageId && p.game === 'eFootball');
    if (!serverPkg) {
      return res.status(400).json({ error: 'Xirmo eFootball oo sax ah lama helin.' });
    }
    if (Math.abs(serverPkg.price - Number(price)) > 0.01) {
      return res.status(400).json({ error: 'Qiimaha xirmada waa la khalkhaliyay.' });
    }

    const db = readDb();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPlayerId = playerId.trim();
    const cleanSessionId = guestSessionId ? String(guestSessionId).trim() : undefined;

    // Check for existing uncompleted request in the last 10 minutes to prevent duplicates
    const existingReq = db.verificationRequests.find(
      (r) =>
        r.email === cleanEmail &&
        r.playerId === cleanPlayerId &&
        r.status === 'pending_email_code' &&
        new Date(r.expiresAt).getTime() > Date.now()
    );

    if (existingReq) {
      return res.json({
        success: true,
        requestId: existingReq.id,
        orderId: existingReq.orderId,
        clientToken: existingReq.clientToken,
        resumed: true,
      });
    }

    const orderId = `SOM-EFB-${Math.floor(1000 + Math.random() * 9000)}`;
    const requestId = `VR-${orderId.replace('SOM-', '')}`;
    const clientToken = crypto.randomUUID();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes validity

    const newVerificationRequest = {
      id: requestId,
      orderId,
      clientToken,
      game: 'eFootball',
      packageId: serverPkg.id,
      packageName: `Xirmo ${serverPkg.credits}`,
      packageCredits: serverPkg.credits,
      price: serverPkg.price,
      currency: 'USD',
      playerId: cleanPlayerId,
      email: cleanEmail,
      attemptsCount: 0,
      status: 'pending_email_code',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      guestSessionId: cleanSessionId,
    };

    const newOrder = {
      id: orderId,
      game: 'eFootball',
      packageId: serverPkg.id,
      packageName: `Xirmo ${serverPkg.credits}`,
      packageCredits: serverPkg.credits,
      price: serverPkg.price,
      currency: 'USD',
      playerId: cleanPlayerId,
      email: cleanEmail,
      status: 'Sugaya Xaqiijin',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      guestSessionId: cleanSessionId,
      history: [
        {
          status: 'Sugaya Xaqiijin',
          timestamp: now.toISOString(),
          note: `Dalabka eFootball waa la diiwaangeliyay. Iimaylka: ${cleanEmail}. Koodhka hubinta waxaa ku soo diri doona maamulaha.`,
        },
      ],
    };

    db.verificationRequests.unshift(newVerificationRequest);
    db.orders.unshift(newOrder);

    // Persistent admin notification
    db.notifications.unshift({
      id: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: 'efootball_new_request',
      title: `Codsiga Hubinta Iimaylka: ${orderId}`,
      message: `Macmiilka ${cleanEmail} (ID: ${cleanPlayerId}) wuxuu sugayaa in koodhka loo diro. Xirmo: ${serverPkg.credits}.`,
      referenceId: requestId,
      createdAt: now.toISOString(),
      read: false,
    });

    writeDb(db);
    dispatchTelegram(`⚽ <b>Codsiga Hubinta eFootball Cusub!</b>\nCodsi: ${requestId}\nOrder: ${orderId}\nEmail: ${cleanEmail}\nPlayer ID: ${cleanPlayerId}\nXirmo: ${serverPkg.credits} ($${serverPkg.price})\nFadlan koodhka ku dir Gmail!`);

    return res.json({
      success: true,
      requestId,
      orderId,
      clientToken,
    });
  });

  // 4. eFootball - Step 2: Customer submits verification code
  app.post('/api/checkout/efootball/submit-code', (req: Request, res: Response) => {
    const { requestId, clientToken, code } = req.body;

    if (!requestId || !code || !code.trim()) {
      return res.status(400).json({ error: 'Fadlan geli koodhka aad heshay.' });
    }

    const db = readDb();
    const vReq = db.verificationRequests.find((r) => r.id === requestId);

    if (!vReq) {
      return res.status(404).json({ error: 'Codsiga xaqiijinta lama helin.' });
    }

    // Security check: Only customer holding clientToken can submit code
    if (vReq.clientToken !== clientToken) {
      return res.status(403).json({ error: 'Idan uma lihid codsigan.' });
    }

    // Check expiry
    if (new Date(vReq.expiresAt).getTime() < Date.now()) {
      vReq.status = 'expired';
      writeDb(db);
      return res.status(400).json({ error: 'Waqtigii koodhka wuu dhacay. Fadlan mar kale bilaab.' });
    }

    // Check rate limit attempt count
    if (vReq.attemptsCount >= 5) {
      vReq.status = 'verification_failed';
      vReq.rejectReason = 'Waxaad dhaaftay tirada la oggol yahay ee tijaabooyinka (5 jeer).';
      writeDb(db);
      return res.status(400).json({ error: 'Waxaad dhaaftay xadka tijaabada koodhka.' });
    }

    const cleanCode = code.trim();
    const now = new Date().toISOString();

    vReq.submittedCode = cleanCode;
    vReq.codeSubmittedAt = now;
    vReq.attemptsCount += 1;
    vReq.status = 'code_submitted_pending_admin';
    vReq.updatedAt = now;

    // Update corresponding order
    const order = db.orders.find((o) => o.id === vReq.orderId);
    if (order) {
      order.submittedVerificationCode = cleanCode;
      order.verificationCodeSubmittedAt = now;
      order.status = 'Hubin ku socoto';
      order.updatedAt = now;
      order.history.push({
        status: 'Hubin ku socoto',
        timestamp: now,
        note: `Macmiilku wuxuu soo gudbiyay koodhka: ${cleanCode}. Sugaya hubinta maamulaha.`,
      });
    }

    // Update persistent admin notification
    db.notifications.unshift({
      id: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: 'efootball_code_submitted',
      title: `Koodh La Soo Diray: ${vReq.id} (${vReq.email})`,
      message: `Macmiilku wuxuu soo gudbiyay koodhka: ${cleanCode}. Fadlan ku hubi Gmail si aad u oggolaato ama u diiddo.`,
      referenceId: vReq.id,
      createdAt: now,
      read: false,
    });

    writeDb(db);
    dispatchTelegram(`📩 <b>Koodh Hubin Cusub oo eFootball ah!</b>\nCodsi: ${vReq.id}\nEmail: ${vReq.email}\nKoodhka Macmiilku Soo Diray: <b>${cleanCode}</b>\nFadlan gal dashboard-ka maamulka si aad u xaqiijiso!`);

    return res.json({
      success: true,
      message: 'Koodhkaaga waa la gudbiyay. Waxaan sugaynaa xaqiijinta maamulka.',
      status: vReq.status,
    });
  });

  // 5. eFootball - Step 3: Customer waiting status poll
  app.get('/api/checkout/efootball/status/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const clientToken = req.headers['x-client-token'];
    const isAdmin = checkAdminAuth(req);

    const db = readDb();
    const vReq = db.verificationRequests.find((r) => r.id === id || r.orderId === id);

    if (!vReq) {
      return res.status(404).json({ error: 'Codsiga lama helin.' });
    }

    // Access control: only owner with clientToken or admin
    if (!isAdmin && vReq.clientToken !== clientToken) {
      return res.status(403).json({ error: 'Idan uma lihid codsigan.' });
    }

    // Auto-timeout check: if still pending after 5 minutes from code submit, flag timeout
    const now = Date.now();
    const codeSubmittedTime = vReq.codeSubmittedAt ? new Date(vReq.codeSubmittedAt).getTime() : 0;
    const isFiveMinuteTimeout = vReq.status === 'code_submitted_pending_admin' && codeSubmittedTime > 0 && now - codeSubmittedTime > 5 * 60 * 1000;

    return res.json({
      id: vReq.id,
      orderId: vReq.orderId,
      status: vReq.status,
      canPay: vReq.status === 'verified',
      rejectReason: vReq.rejectReason,
      expiresAt: vReq.expiresAt,
      isTimeout: isFiveMinuteTimeout,
      updatedAt: vReq.updatedAt,
      game: vReq.game,
      packageCredits: vReq.packageCredits,
      price: vReq.price,
    });
  });

  // 6. Admin Verification Action (Approve / Reject)
  app.post('/api/admin/efootball/verify', (req: Request, res: Response) => {
    if (!checkAdminAuth(req)) {
      return res.status(401).json({ error: 'Ficilkan wuxuu u xiran yahay maamulaha kaliya.' });
    }

    const { requestId, action, rejectReason, adminNotes } = req.body;
    if (!requestId || !action) {
      return res.status(400).json({ error: 'RequestId iyo Action waa waajib.' });
    }

    const db = readDb();
    const vReq = db.verificationRequests.find((r) => r.id === requestId);
    if (!vReq) {
      return res.status(404).json({ error: 'Codsiga lama helin.' });
    }

    // Eligibility check: cannot approve an already finalized or expired request
    if (vReq.status === 'verified' && action === 'approve') {
      return res.json({ success: true, message: 'Codsigan mar hore ayaa la oggolaaday.', request: vReq });
    }

    const now = new Date().toISOString();
    vReq.updatedAt = now;
    vReq.decisionBy = 'Maamule';
    vReq.decisionAt = now;

    const order = db.orders.find((o) => o.id === vReq.orderId);

    if (action === 'approve') {
      vReq.status = 'verified';
      if (order) {
        order.status = 'Sugaya Lacag-bixin';
        order.verificationDecision = 'approved';
        order.verificationDecisionAt = now;
        order.verificationDecisionBy = 'Maamule';
        order.updatedAt = now;
        order.history.push({
          status: 'Sugaya Lacag-bixin',
          timestamp: now,
          note: adminNotes || 'Maamuluhu wuxuu si buuxda u xaqiijiyay koodhka macmiilka.',
        });
      }
      dispatchTelegram(`✅ <b>Xaqiijinta eFootball Waa La Oggolaaday!</b>\nCodsi: ${vReq.id}\nOrder: ${vReq.orderId}\nEmail: ${vReq.email}\nMacmiilku hadda wuxuu u gudbi karaa lacag-bixinta.`);
    } else {
      vReq.status = 'verification_failed';
      vReq.rejectReason = rejectReason || 'Koodhka aad gelisay kuma habboona xogta maamulaha.';
      if (order) {
        order.status = 'Xaqiijintu way fashilantay';
        order.verificationDecision = 'rejected';
        order.verificationDecisionAt = now;
        order.verificationRejectReason = vReq.rejectReason;
        order.updatedAt = now;
        order.history.push({
          status: 'Xaqiijintu way fashilantay',
          timestamp: now,
          note: `Xaqiijinta waa la diiday: ${vReq.rejectReason}`,
        });
      }
      dispatchTelegram(`❌ <b>Xaqiijinta eFootball Waa La Diiday!</b>\nCodsi: ${vReq.id}\nOrder: ${vReq.orderId}\nEmail: ${vReq.email}\nSababta: ${vReq.rejectReason}`);
    }

    writeDb(db);
    return res.json({ success: true, request: vReq, order });
  });

  // 7. Payment Submission (PUBG or verified eFootball)
  app.post('/api/checkout/payment', (req: Request, res: Response) => {
    const { orderId, clientToken, paymentMethodId, paymentMethodName, walletProvider, senderPhoneNumber, receiptImage } = req.body;

    if (!orderId || !senderPhoneNumber || !senderPhoneNumber.trim()) {
      return res.status(400).json({ error: 'Fadlan geli lambarka aad lacagta ka dirtay.' });
    }

    const db = readDb();
    const order = db.orders.find((o) => o.id === orderId);
    if (!order) {
      return res.status(404).json({ error: 'Dalabka lama helin.' });
    }

    // eFootball strict check: MUST BE VERIFIED
    if (order.game === 'eFootball') {
      const vReq = db.verificationRequests.find((r) => r.orderId === orderId);
      if (!vReq || vReq.status !== 'verified') {
        return res.status(403).json({ error: 'Lama bixin karo lacagta ka hor inta aan xaqiijinta la oggolaan.' });
      }
      if (vReq.clientToken !== clientToken && !checkAdminAuth(req)) {
        return res.status(403).json({ error: 'Idan uma lihid dalabkan.' });
      }
    }

    const now = new Date().toISOString();
    order.paymentMethodId = paymentMethodId || 'pay-hormuud';
    order.paymentMethodName = paymentMethodName || 'Hormuud (EVC Plus)';
    order.walletProvider = walletProvider || (paymentMethodId?.includes('sahal') ? 'sahal' : 'hormuud');
    order.senderPhoneNumber = senderPhoneNumber.trim();
    if (receiptImage) {
      order.receiptImage = receiptImage;
    }
    order.paymentSubmittedAt = now;
    order.status = 'Sugaya Hubin';
    order.updatedAt = now;
    order.history.push({
      status: 'Sugaya Hubin',
      timestamp: now,
      note: `Macmiilku wuxuu xaqiijiyay bixinta lacagta. Lambarka diraha: ${senderPhoneNumber.trim()}.${receiptImage ? ' Rasiidka lacagta waa la lifaaqay.' : ''}`,
    });

    db.notifications.unshift({
      id: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: 'payment_submitted',
      title: `Lacag-bixin La Soo Diray: ${order.id}`,
      message: `${order.game} (${order.packageCredits}) - Tel Diraha: ${order.senderPhoneNumber}.${receiptImage ? ' [Rasiid lifaaqan]' : ''} Sugaya hubinta maamulaha.`,
      referenceId: order.id,
      createdAt: now,
      read: false,
    });

    writeDb(db);
    dispatchTelegram(`💰 <b>Lacag-bixin Cusub oo La Soo Diray!</b>\nOrder: ${order.id}\nCiyaarta: ${order.game}\nXirmo: ${order.packageCredits} ($${order.price})\nTel Diraha: ${order.senderPhoneNumber}${receiptImage ? '\n📸 Rasiid waa la soo lifaaqay' : ''}\nFadlan hubi Akoonka ${order.walletProvider === 'sahal' ? 'Sahal' : 'Hormuud'}!`);

    return res.json({ success: true, order });
  });

  /* ---------------- PUBLIC CUSTOMER "MY ORDERS" & TRACKING ---------------- */

  // Privacy-safe order sanitizer: returns ONLY tracking fields
  // Never exposes email, playerId, nickname, verification codes, sender phone, or admin notes.
  function sanitizeOrderForCustomer(order: any) {
    return {
      id: order.id,
      game: order.game,
      packageId: order.packageId,
      packageName: order.packageName,
      packageCredits: order.packageCredits,
      price: order.price,
      currency: order.currency || 'USD',
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      completedAt: order.completedAt,
    };
  }

  // In-memory rate limiting map for identifier lookups (max 10 requests / 60 seconds per IP)
  const lookupRateLimits = new Map<string, { count: number; resetAt: number }>();

  function checkLookupRateLimit(ipOrKey: string): boolean {
    const now = Date.now();
    const entry = lookupRateLimits.get(ipOrKey);
    if (!entry || entry.resetAt < now) {
      lookupRateLimits.set(ipOrKey, { count: 1, resetAt: now + 60 * 1000 });
      return true;
    }
    if (entry.count >= 10) {
      return false; // Exceeded limit
    }
    entry.count += 1;
    return true;
  }

  // 8. Same-Session Orders: retrieve orders matching guestSessionId or stored orderIds
  app.get('/api/orders/session', (req: Request, res: Response) => {
    const guestSessionId = (req.query.guestSessionId as string) || '';
    const orderIdsParam = (req.query.orderIds as string) || '';
    const orderIds = orderIdsParam
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);

    if (!guestSessionId && orderIds.length === 0) {
      return res.json({ success: true, orders: [] });
    }

    const db = readDb();
    const matching = db.orders.filter((o) => {
      if (guestSessionId && o.guestSessionId === guestSessionId) return true;
      if (orderIds.includes(o.id?.toUpperCase())) return true;
      return false;
    });

    const sanitized = matching.map(sanitizeOrderForCustomer);
    return res.json({ success: true, orders: sanitized });
  });

  // 9. Returning Customers: Identifier-based Lookup (PUBG: Player ID | eFootball: Email)
  app.post('/api/orders/lookup', (req: Request, res: Response) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    if (!checkLookupRateLimit(ip)) {
      return res.status(429).json({
        error: 'Waxaad samaysay baarisyo badan. Fadlan sug 1 daqiiqo ka hor intaadan mar kale raadin.',
      });
    }

    const { game, identifier } = req.body;
    if (!game || !identifier || typeof identifier !== 'string') {
      return res.status(400).json({ error: 'Fadlan dooro ciyaarta oo geli xogta saxda ah.' });
    }

    const cleanInput = identifier.trim();
    if (!cleanInput) {
      return res.status(400).json({ error: 'Fadlan geli xogta baadhitaanka.' });
    }

    const db = readDb();

    if (game === 'PUBG Mobile') {
      // Validate Player ID format: 5 to 15 digits
      if (!/^\d{5,15}$/.test(cleanInput)) {
        return res.status(400).json({
          error: 'Player ID-ga PUBG waa inuu ka koobnaadaa 5 ilaa 15 tiro (tusaale: 5123456789).',
        });
      }

      // Strictly return ONLY PUBG Mobile orders matching this Player ID
      const matching = db.orders.filter(
        (o) => o.game === 'PUBG Mobile' && o.playerId === cleanInput
      );

      const sanitized = matching.map(sanitizeOrderForCustomer);
      return res.json({ success: true, orders: sanitized, count: sanitized.length });
    } else if (game === 'eFootball') {
      // Validate Email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const cleanEmail = cleanInput.toLowerCase();
      if (!emailRegex.test(cleanEmail)) {
        return res.status(400).json({
          error: 'Fadlan geli cinwaan iimayl sax ah (tusaale: magac@gmail.com).',
        });
      }

      // Strictly return ONLY eFootball orders matching this email
      const matching = db.orders.filter(
        (o) => o.game === 'eFootball' && o.email?.toLowerCase() === cleanEmail
      );

      const sanitized = matching.map(sanitizeOrderForCustomer);
      return res.json({ success: true, orders: sanitized, count: sanitized.length });
    } else {
      return res.status(400).json({ error: 'Ciyaar aan la aqoonsan.' });
    }
  });

  // 10. Admin APIs (Requests, Orders, Notifications, Status updates)
  app.post('/api/admin/orders/:id/status', (req: Request, res: Response) => {
    if (!checkAdminAuth(req)) {
      return res.status(401).json({ error: 'Ficilkan wuxuu u xiran yahay maamulaha kaliya.' });
    }

    const { id } = req.params;
    const { status, adminNotes, failureReason } = req.body;

    const db = readDb();
    const order = db.orders.find((o) => o.id === id);
    if (!order) {
      return res.status(404).json({ error: 'Dalabka lama helin.' });
    }

    const now = new Date().toISOString();
    order.status = status;
    order.updatedAt = now;
    if (adminNotes) order.adminNotes = adminNotes;
    if (failureReason) order.failureReason = failureReason;
    if (status === 'Waa la dhammaystiray') order.completedAt = now;
    if (status === 'Waa la shaqaynayaa' && !order.paymentConfirmedAt) order.paymentConfirmedAt = now;

    if (!order.history) order.history = [];
    order.history.push({
      status,
      timestamp: now,
      note: adminNotes || `Xaaladda dalabka waxaa loo beddelay: ${status}`,
    });

    writeDb(db);
    return res.json({ success: true, order });
  });
  app.get('/api/admin/efootball/requests', (req: Request, res: Response) => {
    if (!checkAdminAuth(req)) {
      return res.status(401).json({ error: 'Ma lihid idan.' });
    }
    const db = readDb();
    res.json({ requests: db.verificationRequests });
  });

  app.get('/api/admin/orders', (req: Request, res: Response) => {
    if (!checkAdminAuth(req)) {
      return res.status(401).json({ error: 'Ma lihid idan.' });
    }
    const db = readDb();
    res.json({ orders: db.orders });
  });

  app.get('/api/admin/notifications', (req: Request, res: Response) => {
    if (!checkAdminAuth(req)) {
      return res.status(401).json({ error: 'Ma lihid idan.' });
    }
    const db = readDb();
    const unreadCount = db.notifications.filter((n) => !n.read).length;
    res.json({ notifications: db.notifications, unreadCount });
  });

  app.post('/api/admin/notifications/:id/read', (req: Request, res: Response) => {
    if (!checkAdminAuth(req)) {
      return res.status(401).json({ error: 'Ma lihid idan.' });
    }
    const { id } = req.params;
    const db = readDb();
    const notif = db.notifications.find((n) => n.id === id);
    if (notif) notif.read = true;
    writeDb(db);
    res.json({ success: true });
  });

  /* ---------------- VITE MIDDLEWARE (DEV) / STATIC (PROD) ---------------- */
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SomTopUp Full-Stack Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
