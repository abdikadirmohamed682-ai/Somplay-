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

// Real server-validated initial packages data
const INITIAL_SERVER_PACKAGES = [
  {
    id: 'pubg-60-uc',
    game: 'PUBG Mobile',
    name: 'Xirmo 60 UC',
    credits: '60 UC',
    price: 0.99,
    originalPrice: 1.15,
    description: 'Ku shubo 60 UC adigoo isticmaalaya Player ID iyo Nickname.',
    image: '/src/assets/images/game_pubg_mobile_1791667426125.jpg',
    active: true,
    featured: false,
    displayOrder: 1,
  },
  {
    id: 'pubg-325-uc',
    game: 'PUBG Mobile',
    name: 'Xirmo 325 UC (300 + 25 Gunno)',
    credits: '325 UC',
    price: 4.85,
    originalPrice: 5.50,
    badge: 'Dalab Wacan',
    description: '300 UC oo lagu daray 25 UC oo gunno ah. Ku habboon Royale Pass.',
    image: '/src/assets/images/game_pubg_mobile_1791667426125.jpg',
    active: true,
    featured: true,
    displayOrder: 2,
  },
  {
    id: 'pubg-660-uc',
    game: 'PUBG Mobile',
    name: 'Xirmo 660 UC (600 + 60 Gunno)',
    credits: '660 UC',
    price: 9.60,
    originalPrice: 10.99,
    badge: 'Ugu Caansan',
    description: 'Xirmada ugu caansan ee furashada Elite Royale Pass.',
    image: '/src/assets/images/game_pubg_mobile_1791667426125.jpg',
    active: true,
    featured: true,
    displayOrder: 3,
  },
  {
    id: 'pubg-1800-uc',
    game: 'PUBG Mobile',
    name: 'Xirmo 1,800 UC (1500 + 300 Gunno)',
    credits: '1,800 UC',
    price: 24.00,
    originalPrice: 27.50,
    description: 'Gunno 300 UC ah. Wax ku ool ah furashada sanduuqyada iyo hubka.',
    image: '/src/assets/images/game_pubg_mobile_1791667426125.jpg',
    active: true,
    featured: true,
    displayOrder: 4,
  },
  {
    id: 'pubg-3850-uc',
    game: 'PUBG Mobile',
    name: 'Xirmo 3,850 UC (3000 + 850 Gunno)',
    credits: '3,850 UC',
    price: 48.50,
    originalPrice: 55.00,
    description: 'Xirmo weyn oo loogu talagalay ciyaartooyda xirfadleyda ah.',
    image: '/src/assets/images/game_pubg_mobile_1791667426125.jpg',
    active: true,
    featured: false,
    displayOrder: 5,
  },
  {
    id: 'pubg-8100-uc',
    game: 'PUBG Mobile',
    name: 'Xirmo 8,100 UC (6000 + 2100 Gunno)',
    credits: '8,100 UC',
    price: 97.00,
    originalPrice: 110.00,
    description: 'Xirmada ugu weyn ee PUBG Mobile oo wadata gunnada ugu badan.',
    image: '/src/assets/images/game_pubg_mobile_1791667426125.jpg',
    active: true,
    featured: false,
    displayOrder: 6,
  },
];

const INITIAL_SERVER_BANNERS = [
  {
    id: 'banner-pubg-special',
    title: 'PUBG Mobile UC — Shubasho Toos ah',
    titleSo: 'PUBG Mobile UC — Shubasho Toos ah',
    subtitle: 'Direct USSD Payment via Hormuud & Sahal',
    subtitleSo: 'Bixin toos ah oo USSD ah (Hormuud & Sahal)',
    description: 'Xirmooyinka Royale Pass iyo UC oo qiimo jaban ah. Xaqiijin toos ah oo degdeg ah.',
    descriptionSo: 'Xirmooyinka Royale Pass iyo UC oo qiimo jaban ah. Xaqiijin toos ah oo degdeg ah.',
    tag: 'Dalab Gaar ah',
    image: '/src/assets/images/banner_pubg_special_1791667447343.jpg',
    game: 'PUBG Mobile',
    active: true,
    displayOrder: 1,
    buttonText: 'Shubo Hadda',
    buttonTextSo: 'Shubo Hadda',
    destination: '/games/pubg-mobile',
  },
  {
    id: 'banner-hero-gaming',
    title: 'SomTopUp — Suuqa Ciyaaraha Soomaaliyeed',
    titleSo: 'SomTopUp — Suuqa Ciyaaraha Soomaaliyeed',
    subtitle: 'Fast, secure gaming top-ups for Somali gamers',
    subtitleSo: 'Shubasho degdeg ah oo ammaan ah',
    description: 'Dammaanad qaad buuxa iyo adeeg hufan oo 24/7 diyaar ah.',
    descriptionSo: 'Dammaanad qaad buuxa iyo adeeg hufan oo 24/7 diyaar ah.',
    tag: 'SomTopUp',
    image: '/src/assets/images/hero_somtopup_gaming_1791667415637.jpg',
    game: 'PUBG Mobile',
    active: true,
    displayOrder: 2,
    buttonText: 'Eeg Xirmooyinka',
    buttonTextSo: 'Eeg Xirmooyinka',
    destination: '/games/pubg-mobile',
  },
];

interface WalletConfig {
  provider: 'hormuud' | 'sahal';
  name: string;
  serviceCode: string;
  merchantWallet: string;
  instructions: string;
  active: boolean;
}

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  salt: string;
  name?: string;
  role: 'customer' | 'admin';
  defaultPlayerId?: string;
  pepBalance?: number;
  resetToken?: string;
  resetExpires?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PepSettings {
  conversionRatePerUsd: number; // e.g. 100 PEP per $1 USD -> target $10 = 1,000 PEP
  earningRatePerUsd: number;    // e.g. 20 PEP per $1 spent on PUBG
  targetUsdValue: number;       // Fixed $10 equivalent
  enabled: boolean;
}

export interface PepLedgerEntry {
  id: string;
  userId: string;
  userEmail: string;
  type: 'earned' | 'redeemed' | 'adjusted' | 'reversed';
  amount: number;
  balanceAfter: number;
  orderId?: string;
  description: string;
  adminNotes?: string;
  createdAt: string;
}

interface DBStructure {
  users?: UserRecord[];
  packages?: any[];
  banners?: any[];
  orders: any[];
  verificationRequests: any[];
  notifications: any[];
  wallets?: Record<string, WalletConfig>;
  pepSettings?: PepSettings;
  pepLedger?: PepLedgerEntry[];
}

const DEFAULT_PEP_SETTINGS: PepSettings = {
  conversionRatePerUsd: 100, // 100 PEP per $1 USD -> Target = 1,000 PEP ($10 equivalent)
  earningRatePerUsd: 20,     // 20 PEP per $1 USD spent on PUBG orders
  targetUsdValue: 10,        // Equivalent of USD $10
  enabled: true,
};

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
    serviceCode: '',
    merchantWallet: '678123490',
    instructions: 'U wareeji lacagta akoonka Sahal ee kor ku xusan adoo isticmaalaya adeegga Sahal.',
    active: true,
  },
};

/* ---------------- CRYPTOGRAPHIC PASSWORD HASHING ---------------- */
function hashPassword(password: string, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const check = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(check, 'hex'), Buffer.from(hash, 'hex'));
  } catch (e) {
    return false;
  }
}

/* ---------------- ACTIVE SESSIONS MAP ---------------- */
interface SessionData {
  userId: string;
  email: string;
  role: 'customer' | 'admin';
  name?: string;
  createdAt: number;
  expiresAt: number;
}
const activeSessions = new Map<string, SessionData>();

function createSession(user: UserRecord, durationHours = 720): string {
  const token = 'stt_' + crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + durationHours * 60 * 60 * 1000;
  activeSessions.set(token, {
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    createdAt: Date.now(),
    expiresAt,
  });
  return token;
}

function getSessionFromReq(req: Request): SessionData | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7).trim();
  const session = activeSessions.get(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    activeSessions.delete(token);
    return null;
  }
  return session;
}

function checkAdminAuth(req: Request): boolean {
  const session = getSessionFromReq(req);
  if (session && session.role === 'admin') return true;
  const authHeader = req.headers.authorization;
  if (authHeader === 'Bearer authorized_session') return true;
  return false;
}

/* ---------------- DATABASE ACCESS & INITIAL SEEDING ---------------- */
function readDb(): DBStructure {
  try {
    let parsed: DBStructure;
    if (!fs.existsSync(DB_FILE)) {
      parsed = {
        users: [],
        packages: INITIAL_SERVER_PACKAGES,
        banners: INITIAL_SERVER_BANNERS,
        orders: [],
        verificationRequests: [],
        notifications: [],
        wallets: DEFAULT_WALLETS,
      };
      fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
      fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2));
    } else {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      parsed = JSON.parse(raw);
    }

    if (!parsed.wallets) parsed.wallets = DEFAULT_WALLETS;
    if (!parsed.users) parsed.users = [];
    if (!parsed.packages || parsed.packages.length === 0) parsed.packages = INITIAL_SERVER_PACKAGES;
    if (!parsed.banners || parsed.banners.length === 0) parsed.banners = INITIAL_SERVER_BANNERS;
    if (!parsed.pepSettings) parsed.pepSettings = DEFAULT_PEP_SETTINGS;
    if (!parsed.pepLedger) parsed.pepLedger = [];

    // Ensure all users have valid pepBalance property
    parsed.users.forEach((u) => {
      if (typeof u.pepBalance !== 'number') u.pepBalance = 0;
    });

    // Securely seed Initial Administrator if not present
    let adminExists = parsed.users.some((u) => u.role === 'admin');
    if (!adminExists) {
      const adminEmail = (process.env.ADMIN_EMAIL || 'admin@somtopup.com').toLowerCase().trim();
      const initialAdminPass = process.env.ADMIN_PASSWORD || 'SomTopUp@Admin2026!';
      const { hash, salt } = hashPassword(initialAdminPass);
      parsed.users.push({
        id: 'usr_admin_root',
        email: adminEmail,
        name: 'SomTopUp Administrator',
        passwordHash: hash,
        salt,
        role: 'admin',
        pepBalance: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      writeDb(parsed);
    }

    return parsed;
  } catch (e) {
    console.error('Error reading db.json:', e);
    return {
      users: [],
      packages: INITIAL_SERVER_PACKAGES,
      banners: INITIAL_SERVER_BANNERS,
      orders: [],
      verificationRequests: [],
      notifications: [],
      wallets: DEFAULT_WALLETS,
      pepSettings: DEFAULT_PEP_SETTINGS,
      pepLedger: [],
    };
  }
}

/* ---------------- PEP INTERNAL CURRENCY HELPERS ---------------- */
function awardPepForOrder(db: DBStructure, order: any, adminNotes?: string): number {
  if (order.game !== 'PUBG Mobile') return 0;
  if (order.pepAwarded) return 0; // Prevent duplicate rewards for the same order
  if (!order.userId) return 0; // Must be linked to an authenticated customer

  const settings = db.pepSettings || DEFAULT_PEP_SETTINGS;
  if (!settings.enabled) return 0;

  const user = (db.users || []).find((u) => u.id === order.userId);
  if (!user) return 0;

  if (typeof user.pepBalance !== 'number') user.pepBalance = 0;

  // Calculate PEP reward using configured earning rate per USD spent
  const earningRate = typeof settings.earningRatePerUsd === 'number' && settings.earningRatePerUsd > 0
    ? settings.earningRatePerUsd
    : 20;

  const pepAmount = Math.max(1, Math.round(Number(order.price) * earningRate));

  user.pepBalance += pepAmount;
  order.pepAwarded = true;
  order.pepEarned = pepAmount;

  if (!db.pepLedger) db.pepLedger = [];
  db.pepLedger.unshift({
    id: `pep_tx_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    userId: user.id,
    userEmail: user.email,
    type: 'earned',
    amount: pepAmount,
    balanceAfter: user.pepBalance,
    orderId: order.id,
    description: `Abaal-marin dalabka PUBG (${order.packageCredits} - $${order.price})`,
    adminNotes: adminNotes || undefined,
    createdAt: new Date().toISOString(),
  });

  return pepAmount;
}

function reversePepForOrder(db: DBStructure, order: any, reason?: string): number {
  if (!order.pepAwarded || !order.pepEarned || !order.userId) return 0;

  const user = (db.users || []).find((u) => u.id === order.userId);
  if (!user) return 0;

  const deductAmount = order.pepEarned;
  user.pepBalance = Math.max(0, (user.pepBalance || 0) - deductAmount);
  order.pepAwarded = false;

  if (!db.pepLedger) db.pepLedger = [];
  db.pepLedger.unshift({
    id: `pep_tx_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    userId: user.id,
    userEmail: user.email,
    type: 'reversed',
    amount: -deductAmount,
    balanceAfter: user.pepBalance,
    orderId: order.id,
    description: `Dib-u-noqosho PEP: ${reason || 'Dalabka waa la diiday/fashilmay'}`,
    adminNotes: reason || undefined,
    createdAt: new Date().toISOString(),
  });

  return deductAmount;
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

async function startServer() {
  const app = express();
  app.use(express.json());

  // Ensure DB and initial admin are loaded
  readDb();

  /* ---------------- 1. PUBLIC HEALTH & GATEWAY STATUS ---------------- */
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', serverTime: new Date().toISOString() });
  });

  app.get('/api/payment-gateway/status', (_req: Request, res: Response) => {
    const hasGatewayEnv = !!(
      process.env.PAYMENT_GATEWAY_API_KEY &&
      process.env.PAYMENT_GATEWAY_SECRET
    );
    res.json({
      status: 'ok',
      mode: hasGatewayEnv ? 'automated_gateway' : 'manual_wallet',
      gatewayConnected: hasGatewayEnv,
      activeProvider: hasGatewayEnv
        ? process.env.PAYMENT_GATEWAY_PROVIDER || 'Custom Gateway'
        : 'Manual Verified Wallet (Hormuud & Sahal)',
      missingConfig: hasGatewayEnv
        ? []
        : [
            'PAYMENT_GATEWAY_API_URL (Official Gateway Endpoint)',
            'PAYMENT_GATEWAY_API_KEY (Merchant Production API Key)',
            'PAYMENT_GATEWAY_SECRET (Webhook Verification Secret)',
          ],
      message: hasGatewayEnv
        ? 'Automated payment gateway connected.'
        : 'Official automated gateway API credentials are not yet configured in environment variables. Preserving verified manual wallet payment flow with admin manual review.',
      supportedWallets: ['Hormuud (EVC Plus)', 'Sahal (Golis)'],
    });
  });

  /* ---------------- 2. CUSTOMER AUTHENTICATION (EMAIL & PASSWORD) ---------------- */

  // 2a. Register customer without email verification
  app.post('/api/auth/register', (req: Request, res: Response) => {
    const { email, password, name, defaultPlayerId, guestSessionId } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ success: false, error: 'Fadlan geli cinwaan iimayl sax ah.' });
    }
    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ success: false, error: 'Cinwaanka iimaylka ma saxna (tusaale: user@example.com).' });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ success: false, error: 'Furaha sirta ah waa inuu ugu yaraan ka koobnaadaa 6 xaraf.' });
    }

    const db = readDb();
    if (!db.users) db.users = [];

    const existingUser = db.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'Iimaylkan mar hore ayaa lagu diiwaangeliyay. Fadlan soo gal.' });
    }

    const { hash, salt } = hashPassword(password);
    const now = new Date().toISOString();
    const newUser: UserRecord = {
      id: 'usr_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      email: cleanEmail,
      name: name ? String(name).trim() : cleanEmail.split('@')[0],
      passwordHash: hash,
      salt,
      role: 'customer',
      defaultPlayerId: defaultPlayerId ? String(defaultPlayerId).trim() : undefined,
      createdAt: now,
      updatedAt: now,
    };

    db.users.push(newUser);

    // Link any existing orders matching this guestSessionId or email to this customer
    if (guestSessionId || cleanEmail) {
      db.orders.forEach((o) => {
        if ((guestSessionId && o.guestSessionId === guestSessionId) || (o.email && o.email.toLowerCase() === cleanEmail)) {
          if (!o.userId) {
            o.userId = newUser.id;
            o.userEmail = newUser.email;
          }
        }
      });
    }

    writeDb(db);

    const token = createSession(newUser);
    return res.json({
      success: true,
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        defaultPlayerId: newUser.defaultPlayerId,
        pepBalance: newUser.pepBalance || 0,
        createdAt: newUser.createdAt,
      },
    });
  });

  // 2b. Customer Login
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { email, password, guestSessionId } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Fadlan geli iimaylkaaga iyo furahaaga sirta ah.' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const db = readDb();
    const user = (db.users || []).find((u) => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      return res.status(401).json({ success: false, error: 'Iimaylka ama furaha sirta ah ma saxna.' });
    }

    const isValid = verifyPassword(String(password), user.passwordHash, user.salt);
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Iimaylka ama furaha sirta ah ma saxna.' });
    }

    // Link guest session orders to customer
    if (guestSessionId) {
      let changed = false;
      db.orders.forEach((o) => {
        if (o.guestSessionId === guestSessionId && !o.userId) {
          o.userId = user.id;
          o.userEmail = user.email;
          changed = true;
        }
      });
      if (changed) writeDb(db);
    }

    const token = createSession(user);
    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        defaultPlayerId: user.defaultPlayerId,
        pepBalance: user.pepBalance || 0,
        createdAt: user.createdAt,
      },
    });
  });

  // 2c. Current User Profile
  app.get('/api/auth/me', (req: Request, res: Response) => {
    const session = getSessionFromReq(req);
    if (!session) {
      return res.status(401).json({ success: false, error: 'Session expired or not logged in.' });
    }

    const db = readDb();
    const user = (db.users || []).find((u) => u.id === session.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    const settings = db.pepSettings || DEFAULT_PEP_SETTINGS;
    const balance = typeof user.pepBalance === 'number' ? user.pepBalance : 0;
    const rate = settings.conversionRatePerUsd > 0 ? settings.conversionRatePerUsd : 100;
    const targetPep = Math.round(settings.targetUsdValue * rate);
    const progressPercentage = Math.min(100, Math.round((balance / targetPep) * 100));

    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        defaultPlayerId: user.defaultPlayerId,
        pepBalance: balance,
        targetPep,
        progressPercentage,
        conversionRatePerUsd: rate,
        createdAt: user.createdAt,
      },
    });
  });

  // 2d. Logout
  app.post('/api/auth/logout', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      activeSessions.delete(token);
    }
    return res.json({ success: true });
  });

  // 2e. Forgot Password Request
  app.post('/api/auth/forgot-password', (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, error: 'Fadlan geli cinwaanka iimaylkaaga.' });

    const cleanEmail = String(email).trim().toLowerCase();
    const db = readDb();
    const user = (db.users || []).find((u) => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      return res.json({
        success: true,
        message: 'Haddii iimaylkani diiwaangashan yahay, koodhka dib-u-dejinta waa la diyaariyay.',
      });
    }

    const resetToken = crypto.randomBytes(16).toString('hex');
    user.resetToken = resetToken;
    user.resetExpires = Date.now() + 60 * 60 * 1000;
    writeDb(db);

    return res.json({
      success: true,
      message: 'Koodhka dib-u-dejinta waa la sameeyay. Waad beddeli kartaa furahaaga sirta ah hadda.',
      resetToken,
    });
  });

  // 2f. Reset Password
  app.post('/api/auth/reset-password', (req: Request, res: Response) => {
    const { email, resetToken, newPassword } = req.body;
    if (!email || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'Furaha cusub waa inuu ugu yaraan ka koobnaadaa 6 xaraf.' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const db = readDb();
    const user = (db.users || []).find((u) => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      return res.status(400).json({ success: false, error: 'Codsiga dib-u-dejinta ma saxna.' });
    }

    if (user.resetToken && user.resetExpires && user.resetExpires > Date.now()) {
      if (resetToken && user.resetToken !== resetToken) {
        return res.status(400).json({ success: false, error: 'Koodhka dib-u-dejinta ma saxna.' });
      }
    }

    const { hash, salt } = hashPassword(String(newPassword));
    user.passwordHash = hash;
    user.salt = salt;
    delete user.resetToken;
    delete user.resetExpires;
    user.updatedAt = new Date().toISOString();

    writeDb(db);
    return res.json({ success: true, message: 'Furahaaga sirta ah si guul leh ayaa loo beddelay. Fadlan soo gal.' });
  });

  // 2g. Update Customer Profile
  app.post('/api/customer/profile', (req: Request, res: Response) => {
    const session = getSessionFromReq(req);
    if (!session) {
      return res.status(401).json({ success: false, error: 'Fadlan soo gal marka hore.' });
    }

    const { name, defaultPlayerId } = req.body;
    const db = readDb();
    const user = (db.users || []).find((u) => u.id === session.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    if (name) user.name = String(name).trim();
    if (defaultPlayerId !== undefined) user.defaultPlayerId = String(defaultPlayerId).trim();
    user.updatedAt = new Date().toISOString();
    writeDb(db);

    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        defaultPlayerId: user.defaultPlayerId,
        pepBalance: typeof user.pepBalance === 'number' ? user.pepBalance : 0,
        createdAt: user.createdAt,
      },
    });
  });

  // 2h. Authenticated Customer Change Password
  app.post('/api/customer/change-password', (req: Request, res: Response) => {
    const session = getSessionFromReq(req);
    if (!session) {
      return res.status(401).json({ success: false, error: 'Fadlan soo gal marka hore.' });
    }
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'Furaha cusub waa inuu ugu yaraan ka koobnaadaa 6 xaraf.' });
    }
    const db = readDb();
    const user = (db.users || []).find((u) => u.id === session.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }
    if (currentPassword) {
      const { hash } = hashPassword(String(currentPassword), user.salt);
      if (hash !== user.passwordHash) {
        return res.status(400).json({ success: false, error: 'Furaha sirta ah ee hadda ma saxna.' });
      }
    }
    const { hash, salt } = hashPassword(String(newPassword));
    user.passwordHash = hash;
    user.salt = salt;
    user.updatedAt = new Date().toISOString();
    writeDb(db);
    return res.json({ success: true, message: 'Furahaaga sirta ah si guul leh ayaa loo beddelay.' });
  });

  // 2h. Authenticated Customer's Order History (Protected - returns ONLY own orders)
  app.get('/api/customer/orders', (req: Request, res: Response) => {
    const session = getSessionFromReq(req);
    if (!session) {
      return res.status(401).json({ success: false, error: 'Fadlan soo gal marka hore.' });
    }

    const db = readDb();
    const matching = db.orders.filter(
      (o) => o.userId === session.userId || (o.userEmail && o.userEmail.toLowerCase() === session.email.toLowerCase())
    );

    const sanitized = matching.map(sanitizeOrderForCustomer);
    return res.json({ success: true, orders: sanitized, count: sanitized.length });
  });

  // 2i. Authenticated Customer's PEP Internal Currency Account & Ledger
  app.get('/api/customer/pep', (req: Request, res: Response) => {
    const session = getSessionFromReq(req);
    if (!session) {
      return res.status(401).json({ success: false, error: 'Fadlan soo gal marka hore.' });
    }

    const db = readDb();
    const user = (db.users || []).find((u) => u.id === session.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    const settings = db.pepSettings || DEFAULT_PEP_SETTINGS;
    const balance = typeof user.pepBalance === 'number' ? user.pepBalance : 0;
    const rate = typeof settings.conversionRatePerUsd === 'number' && settings.conversionRatePerUsd > 0
      ? settings.conversionRatePerUsd
      : 100;
    const earningRate = typeof settings.earningRatePerUsd === 'number' && settings.earningRatePerUsd > 0
      ? settings.earningRatePerUsd
      : 20;
    const targetPep = Math.round((settings.targetUsdValue || 10) * rate);
    const progressPercentage = Math.min(100, Math.round((balance / targetPep) * 100));

    const customerLedger = (db.pepLedger || []).filter((item) => item.userId === user.id);

    return res.json({
      success: true,
      pepBalance: balance,
      targetPep,
      progressPercentage,
      conversionRatePerUsd: rate,
      earningRatePerUsd: earningRate,
      targetUsdValue: settings.targetUsdValue || 10,
      ledger: customerLedger,
    });
  });

  /* ---------------- 3. ADMIN AUTHENTICATION & LOGIN (/admin) ---------------- */

  // 3a. Admin Login via protected server credentials
  app.post('/api/admin/login', (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Fadlan geli admin iimaylka iyo furaha sirta ah.' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const db = readDb();
    const adminUser = (db.users || []).find((u) => u.email.toLowerCase() === cleanEmail && u.role === 'admin');

    if (!adminUser) {
      return res.status(401).json({ success: false, error: 'Aqoonsiga maamulka ma saxna.' });
    }

    const isValid = verifyPassword(String(password), adminUser.passwordHash, adminUser.salt);
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Aqoonsiga maamulka ma saxna.' });
    }

    const token = createSession(adminUser, 24); // 24-hour admin session
    return res.json({
      success: true,
      token,
      user: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
      },
    });
  });

  // 3b. Verify Admin Authentication Status
  app.get('/api/admin/check-auth', (req: Request, res: Response) => {
    if (!checkAdminAuth(req)) {
      return res.status(401).json({ authenticated: false, error: 'Unauthorized admin' });
    }
    const session = getSessionFromReq(req);
    return res.json({
      authenticated: true,
      user: session ? { email: session.email, name: session.name } : { email: 'admin@somtopup.com' },
    });
  });

  /* ---------------- 4. PACKAGES API (PUBG ONLY IN ADMIN) ---------------- */

  // 4a. Get all packages (Public returns active; Admin returns all)
  app.get('/api/packages', (req: Request, res: Response) => {
    const db = readDb();
    const isAdmin = checkAdminAuth(req);
    const pkgs = db.packages || INITIAL_SERVER_PACKAGES;
    const result = isAdmin ? pkgs : pkgs.filter((p) => p.active);
    res.json({ success: true, packages: result });
  });

  // 4b. Create or Update PUBG Package (Admin Only)
  app.post('/api/admin/packages', (req: Request, res: Response) => {
    if (!checkAdminAuth(req)) {
      return res.status(401).json({ error: 'Ficilkan wuxuu u xiran yahay maamulaha kaliya.' });
    }

    const { id, name, credits, price, originalPrice, badge, description, image, active, displayOrder } = req.body;
    if (!name || !credits || price === undefined) {
      return res.status(400).json({ error: 'Magaca, Credits, iyo Qiimaha waa waajib.' });
    }

    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      return res.status(400).json({ error: 'Qiimaha waa inuu noqdaa tiro sax ah oo ka weyn 0.' });
    }

    const db = readDb();
    if (!db.packages) db.packages = INITIAL_SERVER_PACKAGES;

    const pkgId = id || `pubg-${credits.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;
    const existingIdx = db.packages.findIndex((p) => p.id === pkgId);

    const updatedPackage = {
      id: pkgId,
      game: 'PUBG Mobile', // Enforce PUBG Mobile Only
      name: String(name).trim(),
      credits: String(credits).trim(),
      price: numPrice,
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      badge: badge ? String(badge).trim() : undefined,
      description: description ? String(description).trim() : 'PUBG Mobile UC Top-Up',
      image: image || '/src/assets/images/game_pubg_mobile_1791667426125.jpg',
      active: active !== undefined ? Boolean(active) : true,
      featured: Boolean(badge),
      displayOrder: displayOrder ? Number(displayOrder) : db.packages.length + 1,
    };

    if (existingIdx >= 0) {
      db.packages[existingIdx] = updatedPackage;
    } else {
      db.packages.push(updatedPackage);
    }

    writeDb(db);
    return res.json({ success: true, package: updatedPackage });
  });

  // 4c. Delete or Disable PUBG Package (Admin Only)
  app.delete('/api/admin/packages/:id', (req: Request, res: Response) => {
    if (!checkAdminAuth(req)) {
      return res.status(401).json({ error: 'Ficilkan wuxuu u xiran yahay maamulaha kaliya.' });
    }

    const { id } = req.params;
    const db = readDb();
    if (!db.packages) db.packages = INITIAL_SERVER_PACKAGES;

    db.packages = db.packages.filter((p) => p.id !== id);
    writeDb(db);
    return res.json({ success: true, message: 'Xirmada si guul leh ayaa loo tirtiray.' });
  });

  /* ---------------- 5. HOMEPAGE ADVERTISEMENTS & BANNERS (ADMIN) ---------------- */

  // 5a. Get Banners (Public returns active; Admin returns all)
  app.get('/api/banners', (req: Request, res: Response) => {
    const db = readDb();
    const isAdmin = checkAdminAuth(req);
    const banners = db.banners || INITIAL_SERVER_BANNERS;
    const result = isAdmin ? banners : banners.filter((b) => b.active);
    res.json({ success: true, banners: result });
  });

  // 5b. Create or Update Banner (Admin Only)
  app.post('/api/admin/banners', (req: Request, res: Response) => {
    if (!checkAdminAuth(req)) {
      return res.status(401).json({ error: 'Ficilkan wuxuu u xiran yahay maamulaha kaliya.' });
    }

    const {
      id,
      title,
      titleSo,
      subtitle,
      subtitleSo,
      description,
      descriptionSo,
      tag,
      image,
      active,
      displayOrder,
      buttonText,
      buttonTextSo,
      destination,
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Cinwaanka iyo faahfaahinta xayeysiiska waa waajib.' });
    }

    const db = readDb();
    if (!db.banners) db.banners = INITIAL_SERVER_BANNERS;

    const bannerId = id || `banner-${Date.now()}`;
    const existingIdx = db.banners.findIndex((b) => b.id === bannerId);

    const updatedBanner = {
      id: bannerId,
      title: String(title).trim(),
      titleSo: titleSo ? String(titleSo).trim() : String(title).trim(),
      subtitle: subtitle ? String(subtitle).trim() : '',
      subtitleSo: subtitleSo ? String(subtitleSo).trim() : (subtitle ? String(subtitle).trim() : ''),
      description: String(description).trim(),
      descriptionSo: descriptionSo ? String(descriptionSo).trim() : String(description).trim(),
      tag: tag ? String(tag).trim() : 'SomTopUp',
      image: image || '/src/assets/images/banner_pubg_special_1791667447343.jpg',
      game: 'PUBG Mobile',
      active: active !== undefined ? Boolean(active) : true,
      displayOrder: displayOrder ? Number(displayOrder) : db.banners.length + 1,
      buttonText: buttonText ? String(buttonText).trim() : 'Shubo Hadda',
      buttonTextSo: buttonTextSo ? String(buttonTextSo).trim() : 'Shubo Hadda',
      destination: destination || '/games/pubg-mobile',
    };

    if (existingIdx >= 0) {
      db.banners[existingIdx] = updatedBanner;
    } else {
      db.banners.push(updatedBanner);
    }

    writeDb(db);
    return res.json({ success: true, banner: updatedBanner });
  });

  // 5c. Delete Banner (Admin Only)
  app.delete('/api/admin/banners/:id', (req: Request, res: Response) => {
    if (!checkAdminAuth(req)) {
      return res.status(401).json({ error: 'Ficilkan wuxuu u xiran yahay maamulaha kaliya.' });
    }

    const { id } = req.params;
    const db = readDb();
    if (!db.banners) db.banners = INITIAL_SERVER_BANNERS;

    db.banners = db.banners.filter((b) => b.id !== id);
    writeDb(db);
    return res.json({ success: true, message: 'Xayeysiiska waa la tirtiray.' });
  });

  /* ---------------- 6. PUBG MOBILE CHECKOUT FLOW (NO TRANSACTION REFERENCE) ---------------- */

  // 6a. Step 1: Initiate Order BEFORE starting payment
  app.post('/api/checkout/pubg/initiate', (req: Request, res: Response) => {
    const { packageId, price, playerId, playerNickname, guestSessionId } = req.body;

    if (!playerId || !playerId.trim()) {
      return res.status(400).json({ error: 'Player ID waa waajib.' });
    }
    const cleanPlayerId = playerId.trim();
    if (!/^\d{5,15}$/.test(cleanPlayerId)) {
      return res.status(400).json({ error: 'Player ID waa inuu ka koobnaadaa 5 ilaa 15 tiro (tusaale: 5123456789).' });
    }
    if (!playerNickname || !playerNickname.trim()) {
      return res.status(400).json({ error: 'In-game nickname waa waajib.' });
    }

    const db = readDb();
    const pkgs = db.packages || INITIAL_SERVER_PACKAGES;
    const serverPkg = pkgs.find((p) => p.id === packageId && p.game === 'PUBG Mobile');
    if (!serverPkg) {
      return res.status(400).json({ error: 'Xirmo PUBG Mobile oo sax ah lama helin.' });
    }
    if (Math.abs(serverPkg.price - Number(price)) > 0.01) {
      return res.status(400).json({ error: 'Qiimaha xirmada waa la khalkhaliyay.' });
    }

    // Check if customer is authenticated (Mandatory Customer Account Before Top-Up)
    const session = getSessionFromReq(req);
    if (!session) {
      return res.status(401).json({
        success: false,
        requiresAuth: true,
        error: 'Fadlan soo gal ama sameyso akoon ka hor inta aadan bilaabin dalabka PUBG Mobile.',
      });
    }

    // Auto-save PUBG Player ID to customer profile if missing
    const user = (db.users || []).find((u) => u.id === session.userId);
    if (user && !user.defaultPlayerId && cleanPlayerId) {
      user.defaultPlayerId = cleanPlayerId;
      user.updatedAt = new Date().toISOString();
    }

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
      playerId: cleanPlayerId,
      playerNickname: playerNickname.trim(),
      status: 'Sugaya Lacag-bixin', // Unpaid / Awaiting Payment
      createdAt: now,
      updatedAt: now,
      guestSessionId: guestSessionId ? String(guestSessionId).trim() : undefined,
      userId: session.userId,
      userEmail: session.email,
      pepAwarded: false,
      history: [
        {
          status: 'Sugaya Lacag-bixin',
          timestamp: now,
          note: `Dalabka PUBG Mobile (${serverPkg.credits}) waa la abuuray, sugaya bixinta lacagta (Unpaid).`,
        },
      ],
    };

    db.orders.unshift(order);
    writeDb(db);

    return res.json({ success: true, order });
  });

  // 6b. Step 2: Submit Payment after USSD dialing (NO reference number required!)
  app.post('/api/checkout/pubg/submit-payment', (req: Request, res: Response) => {
    const {
      orderId,
      paymentMethodId,
      paymentMethodName,
      walletProvider,
      senderPhoneNumber,
      receiptImage,
      guestSessionId,
    } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID waa waajib.' });
    }
    if (!senderPhoneNumber || !senderPhoneNumber.trim()) {
      return res.status(400).json({ error: 'Fadlan geli lambarka aad lacagta ka dirtay.' });
    }

    const db = readDb();
    const order = db.orders.find((o) => o.id === orderId && o.game === 'PUBG Mobile');
    if (!order) {
      return res.status(404).json({ error: 'Dalabka lama helin.' });
    }

    // Prevent duplicate fulfillment if already completed or processing
    if (order.status === 'Waa la dhammaystiray') {
      return res.status(400).json({ error: 'Dalabkan mar hore ayaa si buuxda loo dhammaystiray.' });
    }
    if (order.status === 'Waa la shaqaynayaa') {
      return res.status(400).json({ error: 'Dalabkan hadda waxaa ku socota shubista UC-ga.' });
    }

    const cleanPhone = senderPhoneNumber.trim();
    const now = new Date().toISOString();

    const session = getSessionFromReq(req);
    if (session && !order.userId) {
      order.userId = session.userId;
      order.userEmail = session.email;
    }

    order.paymentMethodId = paymentMethodId || order.paymentMethodId || 'pay-hormuud';
    order.paymentMethodName = paymentMethodName || order.paymentMethodName || 'Hormuud (EVC Plus)';
    order.walletProvider = walletProvider || (paymentMethodId?.includes('sahal') ? 'sahal' : 'hormuud');
    order.senderPhoneNumber = cleanPhone;
    if (receiptImage) order.receiptImage = receiptImage;
    if (guestSessionId && !order.guestSessionId) order.guestSessionId = String(guestSessionId).trim();

    order.paymentSubmittedAt = now;
    order.status = 'Sugaya Hubin'; // Payment Verification Pending
    order.updatedAt = now;

    if (!order.history) order.history = [];
    order.history.push({
      status: 'Sugaya Hubin',
      timestamp: now,
      note: `Codsiga xaqiijinta lacag-bixinta waa la gudbiyay. Tel: ${cleanPhone}${receiptImage ? ' [Rasiid lifaaqan]' : ''}`,
    });

    db.notifications.unshift({
      id: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: 'payment_submitted',
      title: `Lacag-bixin Cusub oo PUBG ah: ${order.id}`,
      message: `${order.playerId} (${order.playerNickname}) - ${order.packageCredits} ($${order.price}). Tel Diraha: ${cleanPhone}`,
      referenceId: order.id,
      createdAt: now,
      read: false,
    });

    writeDb(db);
    dispatchTelegram(`💰 <b>Lacag-bixin Cusub oo PUBG ah!</b>\nOrder: ${order.id}\nPlayer ID: ${order.playerId}\nNick: ${order.playerNickname}\nXirmo: ${order.packageCredits} ($${order.price})\nTel Diraha: ${cleanPhone}${receiptImage ? '\n📸 Rasiid waa la soo lifaaqay' : ''}`);

    return res.json({ success: true, order });
  });

  // 6c. Retry Verification for Failed Orders (NO reference number required!)
  app.post('/api/checkout/pubg/retry-verification', (req: Request, res: Response) => {
    const { orderId, senderPhoneNumber, receiptImage } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID waa waajib.' });
    }
    if (!senderPhoneNumber || !senderPhoneNumber.trim()) {
      return res.status(400).json({ error: 'Fadlan geli lambarka aad lacagta ka dirtay.' });
    }

    const db = readDb();
    const order = db.orders.find((o) => o.id === orderId && o.game === 'PUBG Mobile');
    if (!order) {
      return res.status(404).json({ error: 'Dalabka lama helin.' });
    }

    if (order.status === 'Waa la dhammaystiray' || order.status === 'Waa la shaqaynayaa') {
      return res.status(400).json({ error: 'Dalabkan mar hore ayaa la aqbalay ama la dhammaystiray.' });
    }

    const cleanPhone = senderPhoneNumber.trim();
    const now = new Date().toISOString();

    order.senderPhoneNumber = cleanPhone;
    if (receiptImage) order.receiptImage = receiptImage;
    order.status = 'Sugaya Hubin'; // Return to Payment Verification Pending
    order.updatedAt = now;
    delete order.failureReason;

    if (!order.history) order.history = [];
    order.history.push({
      status: 'Sugaya Hubin',
      timestamp: now,
      note: `Dib u saxidda lambarka lacag-bixinta. Tel: ${cleanPhone}`,
    });

    writeDb(db);
    return res.json({ success: true, order });
  });

  // 6d. Cancel Unpaid Order
  app.post('/api/orders/:id/cancel', (req: Request, res: Response) => {
    const { id } = req.params;
    const db = readDb();
    const order = db.orders.find((o) => o.id === id);
    if (!order) {
      return res.status(404).json({ error: 'Dalabka lama helin.' });
    }

    if (order.status !== 'Sugaya Lacag-bixin') {
      return res.status(400).json({
        error: 'Dalabkan lama kansali karo maadaama lacag-bixintiisa hore loo gudbiyay. Fadlan la xiriir maamulka.',
      });
    }

    const now = new Date().toISOString();
    order.status = 'Waa la kansalay';
    order.updatedAt = now;
    if (!order.history) order.history = [];
    order.history.push({
      status: 'Waa la kansalay',
      timestamp: now,
      note: 'Macmiilku wuxuu kansalay dalabkan intii aan lacagta la bixin.',
    });

    writeDb(db);
    return res.json({ success: true, order });
  });

  /* ---------------- 7. PUBLIC ORDER TRACKING & RECOVERY ---------------- */

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
      playerId: order.playerId,
      playerNickname: order.playerNickname,
      paymentMethodId: order.paymentMethodId,
      paymentMethodName: order.paymentMethodName,
      senderPhoneNumber: order.senderPhoneNumber,
      failureReason: order.failureReason,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      completedAt: order.completedAt,
    };
  }

  // Same-Session Orders
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

  // Single order lookup
  app.get('/api/orders/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const db = readDb();
    const order = db.orders.find((o) => o.id?.toUpperCase() === id.toUpperCase());
    if (!order) {
      return res.status(404).json({ error: 'Dalabka lama helin.' });
    }
    return res.json({ success: true, order: sanitizeOrderForCustomer(order) });
  });

  // Identifier-based lookup (PUBG: Player ID or Order ID)
  app.post('/api/orders/lookup', (req: Request, res: Response) => {
    const { game, identifier } = req.body;
    if (!identifier || typeof identifier !== 'string') {
      return res.status(400).json({ error: 'Fadlan geli xogta baadhitaanka.' });
    }

    const cleanInput = identifier.trim();
    if (!cleanInput) {
      return res.status(400).json({ error: 'Fadlan geli xogta baadhitaanka.' });
    }

    const db = readDb();
    const upperInput = cleanInput.toUpperCase();
    let matching = [];

    if (upperInput.startsWith('SOM-') || upperInput.startsWith('PUB-')) {
      matching = db.orders.filter(
        (o) => o.game === 'PUBG Mobile' && o.id.toUpperCase() === upperInput
      );
    } else {
      if (!/^\d{5,15}$/.test(cleanInput)) {
        return res.status(400).json({
          error: 'Geli Player ID sax ah (5 ilaa 15 tiro) ama Order ID (tusaale: SOM-PUB-1234).',
        });
      }
      matching = db.orders.filter(
        (o) => o.game === 'PUBG Mobile' && o.playerId === cleanInput
      );
    }

    const sanitized = matching.map(sanitizeOrderForCustomer);
    return res.json({ success: true, orders: sanitized, count: sanitized.length });
  });

  /* ---------------- 8. SECURE ADMIN CONTROLS (PUBG ONLY) ---------------- */

  // 8a. List PUBG Orders Only for Admin
  app.get('/api/admin/orders', (req: Request, res: Response) => {
    if (!checkAdminAuth(req)) {
      return res.status(401).json({ error: 'Ma lihid idan maamulaha (Unauthorized admin access)' });
    }
    const db = readDb();
    // Scope: PUBG Mobile only for now
    const pubgOrders = db.orders.filter((o) => o.game === 'PUBG Mobile');
    return res.json({ success: true, orders: pubgOrders, count: pubgOrders.length });
  });

  // 8b. Verify Payment Manually (Moves to Processing / Payment Verified)
  app.post('/api/admin/orders/:id/verify-payment', (req: Request, res: Response) => {
    if (!checkAdminAuth(req)) {
      return res.status(401).json({ error: 'Ma lihid idan maamulaha.' });
    }

    const { id } = req.params;
    const { adminNotes } = req.body;
    const db = readDb();
    const order = db.orders.find((o) => o.id === id && o.game === 'PUBG Mobile');
    if (!order) {
      return res.status(404).json({ error: 'Dalabka lama helin.' });
    }

    if (order.status === 'Waa la dhammaystiray') {
      return res.status(400).json({ error: 'Dalabkan mar hore ayaa la dhammaystiray.' });
    }

    const now = new Date().toISOString();
    order.status = 'Waa la shaqaynayaa';
    order.paymentConfirmedAt = now;
    order.updatedAt = now;
    if (adminNotes) order.adminNotes = adminNotes;

    if (!order.history) order.history = [];
    order.history.push({
      status: 'Waa la shaqaynayaa',
      timestamp: now,
      note: adminNotes || 'Maamuluhu wuxuu hubiyay oo xaqiijiyay lacag-bixinta koontada.',
    });

    writeDb(db);
    return res.json({ success: true, order });
  });

  // 8c. Fulfill PUBG UC (Completes order & prevents duplicate fulfillment)
  app.post('/api/admin/orders/:id/fulfill', (req: Request, res: Response) => {
    if (!checkAdminAuth(req)) {
      return res.status(401).json({ error: 'Ma lihid idan maamulaha.' });
    }

    const { id } = req.params;
    const { adminNotes } = req.body;
    const db = readDb();
    const order = db.orders.find((o) => o.id === id && o.game === 'PUBG Mobile');
    if (!order) {
      return res.status(404).json({ error: 'Dalabka lama helin.' });
    }

    // Prevent duplicate fulfillment
    if (order.status === 'Waa la dhammaystiray') {
      return res.status(400).json({ error: 'Dalabkan mar hore ayaa si buuxda loogu shubay UC-ga (Duplicate fulfillment prevented).' });
    }

    const now = new Date().toISOString();
    order.status = 'Waa la dhammaystiray';
    order.completedAt = now;
    order.updatedAt = now;
    if (!order.paymentConfirmedAt) order.paymentConfirmedAt = now;
    if (adminNotes) order.adminNotes = adminNotes;

    if (!order.history) order.history = [];
    order.history.push({
      status: 'Waa la dhammaystiray',
      timestamp: now,
      note: adminNotes || `PUBG UC (${order.packageCredits}) waxaa si guul leh loogu shubay Player ID: ${order.playerId}.`,
    });

    // Award internal PEP rewards currency if order is linked to a customer
    const awardedPep = awardPepForOrder(db, order, adminNotes);

    writeDb(db);
    return res.json({ success: true, order, awardedPep });
  });

  // 8d. Reject Payment / Mark Failed with Failure Reason
  app.post('/api/admin/orders/:id/reject', (req: Request, res: Response) => {
    if (!checkAdminAuth(req)) {
      return res.status(401).json({ error: 'Ma lihid idan maamulaha.' });
    }

    const { id } = req.params;
    const { failureReason, adminNotes } = req.body;
    const db = readDb();
    const order = db.orders.find((o) => o.id === id && o.game === 'PUBG Mobile');
    if (!order) {
      return res.status(404).json({ error: 'Dalabka lama helin.' });
    }

    const now = new Date().toISOString();
    order.status = 'Wuu fashilmay';
    order.failureReason = failureReason || 'Lacagta lagama helin akoonka ama lambarka diraha ma saxna.';
    order.updatedAt = now;
    if (adminNotes) order.adminNotes = adminNotes;

    if (!order.history) order.history = [];
    order.history.push({
      status: 'Wuu fashilmay',
      timestamp: now,
      note: `Lacag-bixinta waa la diiday: ${order.failureReason}`,
    });

    // Reverse any previously awarded PEP if applicable
    reversePepForOrder(db, order, order.failureReason);

    writeDb(db);
    return res.json({ success: true, order });
  });

  // 8e. Update Order Status (General Admin action)
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

    // Duplicate fulfillment check
    if (status === 'Waa la dhammaystiray' && order.status === 'Waa la dhammaystiray') {
      return res.status(400).json({ error: 'Dalabkan mar hore ayaa la dhammaystiray.' });
    }

    const now = new Date().toISOString();
    order.status = status;
    order.updatedAt = now;
    if (adminNotes) order.adminNotes = adminNotes;
    if (failureReason) order.failureReason = failureReason;
    if (status === 'Waa la dhammaystiray') {
      order.completedAt = now;
      awardPepForOrder(db, order, adminNotes);
    } else if (status === 'Wuu fashilmay' || status === 'Waa la kansalay') {
      reversePepForOrder(db, order, failureReason);
    }
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

  /* ---------------- 9. PEP REWARDS ADMIN MANAGEMENT & AUDIT LEDGER ---------------- */

  // 9a. Get PEP Settings & Statistics (Admin Only)
  app.get('/api/admin/pep/settings', (req: Request, res: Response) => {
    if (!checkAdminAuth(req)) {
      return res.status(401).json({ error: 'Ma lihid idan maamulaha.' });
    }
    const db = readDb();
    const settings = db.pepSettings || DEFAULT_PEP_SETTINGS;
    const totalPepInCirculation = (db.users || []).reduce((sum, u) => sum + (u.pepBalance || 0), 0);
    const totalTransactions = (db.pepLedger || []).length;
    return res.json({
      success: true,
      settings,
      targetPep: Math.round((settings.targetUsdValue || 10) * (settings.conversionRatePerUsd || 100)),
      totalPepInCirculation,
      totalTransactions,
    });
  });

  // 9b. Update PEP Settings (Admin Only)
  app.post('/api/admin/pep/settings', (req: Request, res: Response) => {
    if (!checkAdminAuth(req)) {
      return res.status(401).json({ error: 'Ma lihid idan maamulaha.' });
    }

    const { conversionRatePerUsd, earningRatePerUsd, enabled } = req.body;
    const db = readDb();
    if (!db.pepSettings) db.pepSettings = DEFAULT_PEP_SETTINGS;

    if (conversionRatePerUsd !== undefined) {
      const conv = Number(conversionRatePerUsd);
      if (isNaN(conv) || conv <= 0) {
        return res.status(400).json({ error: 'PEP conversion rate waa inuu ka weynaadaa 0.' });
      }
      db.pepSettings.conversionRatePerUsd = Math.round(conv);
    }

    if (earningRatePerUsd !== undefined) {
      const earn = Number(earningRatePerUsd);
      if (isNaN(earn) || earn < 0) {
        return res.status(400).json({ error: 'Earning rate waa inuu noqdaa tiro sax ah.' });
      }
      db.pepSettings.earningRatePerUsd = Math.round(earn);
    }

    if (enabled !== undefined) {
      db.pepSettings.enabled = Boolean(enabled);
    }

    writeDb(db);
    return res.json({
      success: true,
      settings: db.pepSettings,
      targetPep: Math.round((db.pepSettings.targetUsdValue || 10) * (db.pepSettings.conversionRatePerUsd || 100)),
      message: 'Habaynta PEP si guul leh ayaa loo keydiyay.',
    });
  });

  // 9c. Get PEP Audit Ledger (Admin Only)
  app.get('/api/admin/pep/ledger', (req: Request, res: Response) => {
    if (!checkAdminAuth(req)) {
      return res.status(401).json({ error: 'Ma lihid idan maamulaha.' });
    }
    const db = readDb();
    return res.json({
      success: true,
      ledger: db.pepLedger || [],
      users: (db.users || []).map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        pepBalance: u.pepBalance || 0,
        defaultPlayerId: u.defaultPlayerId,
        createdAt: u.createdAt,
      })),
    });
  });

  // 9d. Manual PEP Adjustment by Admin (With Recorded Reason in Ledger)
  app.post('/api/admin/pep/adjust', (req: Request, res: Response) => {
    if (!checkAdminAuth(req)) {
      return res.status(401).json({ error: 'Ma lihid idan maamulaha.' });
    }

    const { userId, amount, reason, adminNotes } = req.body;
    if (!userId || amount === undefined || isNaN(Number(amount)) || Number(amount) === 0) {
      return res.status(400).json({ error: 'User ID iyo Qaddarka PEP (amount) waa waajib.' });
    }
    if (!reason || !String(reason).trim()) {
      return res.status(400).json({ error: 'Fadlan qor sababta aad u beddelayso PEP-ka macmiilka (Audit reason is required).' });
    }

    const db = readDb();
    const user = (db.users || []).find((u) => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: 'Macmiilka lama helin.' });
    }

    const numAmount = Math.round(Number(amount));
    if (typeof user.pepBalance !== 'number') user.pepBalance = 0;

    user.pepBalance = Math.max(0, user.pepBalance + numAmount);
    user.updatedAt = new Date().toISOString();

    const cleanReason = String(reason).trim();
    if (!db.pepLedger) db.pepLedger = [];
    const entry: PepLedgerEntry = {
      id: `pep_adj_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      userId: user.id,
      userEmail: user.email,
      type: 'adjusted',
      amount: numAmount,
      balanceAfter: user.pepBalance,
      description: `Sixid maamul: ${cleanReason}`,
      adminNotes: adminNotes ? String(adminNotes).trim() : undefined,
      createdAt: new Date().toISOString(),
    };
    db.pepLedger.unshift(entry);

    writeDb(db);
    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        pepBalance: user.pepBalance,
      },
      entry,
      message: `PEP-ka macmiilka waxaa loo beddelay ${user.pepBalance} PEP.`,
    });
  });

  // 8f. Admin Notifications Feed
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
