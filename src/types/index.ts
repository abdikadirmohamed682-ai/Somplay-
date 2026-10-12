export type GameType = 'PUBG Mobile' | 'eFootball';

export type VerificationStatus =
  | 'pending_email_code'
  | 'code_submitted_pending_admin'
  | 'verified'
  | 'verification_failed'
  | 'expired';

export interface VerificationRequest {
  id: string; // e.g. EFB-VR-3910
  orderId: string; // e.g. SOM-EFB-3910
  clientToken: string; // Secure unguessable token for public customer
  game: 'eFootball';
  packageId: string;
  packageName: string;
  packageCredits: string;
  price: number;
  currency: string;
  playerId: string;
  email: string;
  submittedCode?: string;
  codeSubmittedAt?: string;
  attemptsCount: number;
  status: VerificationStatus;
  decisionBy?: string;
  decisionAt?: string;
  rejectReason?: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}

export interface AdminNotification {
  id: string;
  type: 'efootball_new_request' | 'efootball_code_submitted' | 'payment_submitted' | 'pubg_order';
  title: string;
  message: string;
  referenceId: string; // Order or Verification ID
  createdAt: string;
  read: boolean;
}

export type OrderStatus =
  | 'Sugaya Xaqiijin'          // Verification Pending (eFootball created)
  | 'Hubin ku socoto'          // Under Review (eFootball customer submitted code)
  | 'Sugaya Lacag-bixin'        // Awaiting Payment (Verification approved)
  | 'Xaqiijintu way fashilantay'// Verification Rejected
  | 'Sugaya Hubin'              // Payment Under Review (Sender phone submitted)
  | 'Waa la shaqaynayaa'        // Processing (Payment confirmed, top-up in progress)
  | 'Waa la dhammaystiray'      // Completed (Top-up fulfilled)
  | 'Wuu fashilmay';            // Failed (Payment rejected or fulfillment failed)

export interface OrderStatusHistory {
  status: OrderStatus;
  timestamp: string;
  note?: string;
}

export interface Order {
  id: string; // e.g. SOM-PUB-8291, SOM-EFB-3490
  game: GameType;
  packageId: string;
  packageName: string;
  packageCredits: string; // e.g. "60 UC" or "130 Coins"
  price: number; // in USD
  currency: string; // "USD"
  
  // Customer info
  playerId: string;
  playerNickname?: string; // PUBG Mobile specific
  email?: string;          // eFootball specific
  
  // Manual eFootball Verification fields
  submittedVerificationCode?: string; // Exact code submitted by customer
  verificationCodeSubmittedAt?: string;
  verificationDecision?: 'approved' | 'rejected';
  verificationDecisionAt?: string;
  verificationDecisionBy?: string;
  verificationRejectReason?: string;
  
  // Payment info
  paymentMethodId?: string;
  paymentMethodName?: string;
  walletProvider?: 'hormuud' | 'sahal';
  senderPhoneNumber?: string; // Lambarka aad lacagta ka dirtay
  receiptImage?: string; // Optional uploaded transfer receipt image (base64 or URL)
  paymentSubmittedAt?: string;
  paymentConfirmedAt?: string;
  paymentRejectedAt?: string;
  
  // Status & timestamps
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  
  // Admin fields
  adminNotes?: string;
  failureReason?: string;
  history: OrderStatusHistory[];

  // Session association
  guestSessionId?: string;
}

/**
 * Public, privacy-safe Order summary returned to customer-facing views.
 * Strictly excludes emails, player IDs, verification codes, phone numbers, and admin notes.
 */
export interface PublicOrderSummary {
  id: string;
  game: GameType;
  packageId?: string;
  packageName: string;
  packageCredits: string;
  price: number;
  currency: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface GamePackage {
  id: string;
  game: GameType;
  name: string;
  credits: string; // e.g. "60 UC"
  price: number;
  originalPrice?: number;
  badge?: string; // e.g. "Caanka ah", "Dalab Gaar ah"
  description: string;
  image?: string;
  active: boolean;
  featured: boolean;
  displayOrder: number;
}

export interface PromoBanner {
  id: string;
  title: string;
  description: string;
  tag?: string;
  image: string;
  targetGame: GameType | 'All';
  targetPackageId?: string;
  active: boolean;
  displayOrder: number;
  startDate?: string;
  endDate?: string;
}

export interface PaymentMethod {
  id: string;
  name: string; // e.g. "Hormuud (EVC Plus)"
  walletProvider?: 'hormuud' | 'sahal';
  serviceCode?: string; // e.g. "*712*" or specific USSD prefix
  merchantWallet?: string; // e.g. "615948077"
  accountNumber: string; // e.g. "*712*615948077*AMOUNT#"
  accountHolder: string; // e.g. "SomTopUp Merchant"
  instructions: string; // in Somali
  iconType: 'evc' | 'zaad' | 'sahal' | 'edahab' | 'bank';
  active: boolean;
  minAmount?: number;
}

export interface TelegramSettings {
  botToken: string;
  chatId: string;
  enabled: boolean;
  notifyOnNewEfootballOrder: boolean;
  notifyOnCodeSubmitted: boolean;
  notifyOnVerificationApproved: boolean;
  notifyOnVerificationRejected: boolean;
  notifyOnPaymentSubmitted: boolean;
  notifyOnFinalPubgOrder: boolean;
  notifyOnPaymentConfirmed: boolean;
  notifyOnOrderCompleted: boolean;
  notifyOnOrderFailed: boolean;
}

export interface VisitorAnalyticsData {
  pageViews: number;
  uniqueVisitors: number;
  checkoutStarts: number;
  checkoutCompletes: number;
  visitsByPage: Record<string, number>;
  visitsByGame: Record<string, number>;
  dailyVisits: { date: string; views: number; visitors: number }[];
}
