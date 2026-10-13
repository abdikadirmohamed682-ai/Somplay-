import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'so' | 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, defaultText?: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  so: {
    // Nav & Common
    home: 'Hoy',
    games: 'Ciyaaraha',
    orders: 'Dalabyada',
    account: 'Akoon',
    more: 'Wax badan',
    trackOrder: 'Raadi Dalab',
    searchPlaceholder: 'Raadi xirmooyinka UC ama Games...',
    searchResult: 'Natiijada Raadinta',
    clearSearch: 'Tir Raadinta',
    back: 'Dib u noqo',
    chooseGame: 'Dooro Ciyaarta',
    gamesCount: '4 Ciyaarood',
    available: 'DIYAAR',
    comingSoon: 'DHAWAAN',
    comingSoonDesc: 'Ciyaartan dhawaan ayay diyaar noqon doontaa.',
    topUpNow: 'Shubo Hadda',
    lockedNotice: 'Kaliya PUBG Mobile ayaa hadda diyaar u ah shubasho.',

    // Terms requested to keep clear & short
    playerId: 'Player ID',
    username: 'Username',
    email: 'Email',
    orderId: 'Order ID',
    payment: 'Payment',
    
    // Exact requested label for main payment button
    payButtonLabel: 'ادفع',
    copyCode: 'Koobiyeey',
    codeCopied: 'La koobiyeeyay',

    // Statuses
    statusUnpaid: 'Sugaya Lacag-bixin (Unpaid)',
    statusVerificationPending: 'Sugaya Hubin (Payment Verification Pending)',
    statusPendingReview: 'Sugaya Hubin',
    statusProcessing: 'Waa la shaqaynayaa',
    statusCompleted: 'Waa la dhammaystiray',
    statusFailed: 'Wuu fashilmay',
    statusCancelled: 'Waa la kansalay',

    // Recovery Actions
    resumePayment: 'Sii wad Bixinta',
    retryVerification: 'Dib u Sax Tixraaca',
    cancelOrder: 'Kansal Dalabka',

    // Storefront features
    instantDeliveryTitle: 'Shubasho Degdeg ah',
    instantDeliveryDesc: 'Dalabkaaga waxaa laguugu shubayaa daqiiqado gudahood adoon sugin.',
    securePaymentTitle: 'Bixinta Lacagta ee Tooska ah',
    securePaymentDesc: 'Ku bixi si fudud Hormuud EVC Plus ama Sahal.',
    supportTitle: 'Taageero Joogto ah',
    supportDesc: 'Kooxdayadu waxay diyaar u tahay inay ku caawiso mar kasta.',
  },
  en: {
    // Nav & Common
    home: 'Home',
    games: 'Games',
    orders: 'My Orders',
    account: 'Account',
    more: 'More',
    trackOrder: 'Track Order',
    searchPlaceholder: 'Search UC packages or games...',
    searchResult: 'Search Results',
    clearSearch: 'Clear Search',
    back: 'Back',
    chooseGame: 'Select Game',
    gamesCount: '4 Games',
    available: 'AVAILABLE',
    comingSoon: 'COMING SOON',
    comingSoonDesc: 'This game will be available soon.',
    topUpNow: 'Top Up Now',
    lockedNotice: 'Only PUBG Mobile is currently available for top-up.',

    // Terms
    playerId: 'Player ID',
    username: 'Username',
    email: 'Email',
    orderId: 'Order ID',
    payment: 'Payment',

    // Exact requested label for main payment button
    payButtonLabel: 'Pay',
    copyCode: 'Copy Code',
    codeCopied: 'Copied',

    // Statuses
    statusUnpaid: 'Awaiting Payment (Unpaid)',
    statusVerificationPending: 'Payment Verification Pending',
    statusPendingReview: 'Under Review',
    statusProcessing: 'Processing',
    statusCompleted: 'Completed',
    statusFailed: 'Failed',
    statusCancelled: 'Cancelled',

    // Recovery Actions
    resumePayment: 'Resume Payment',
    retryVerification: 'Retry Verification',
    cancelOrder: 'Cancel Order',

    // Storefront features
    instantDeliveryTitle: 'Fast Delivery',
    instantDeliveryDesc: 'Your game credits are delivered within minutes directly to your account.',
    securePaymentTitle: 'Direct Local Payment',
    securePaymentDesc: 'Pay easily using Hormuud EVC Plus or Sahal.',
    supportTitle: '24/7 Support',
    supportDesc: 'Our customer support team is always ready to assist you on WhatsApp.',
  },
  ar: {
    // Nav & Common
    home: 'الرئيسية',
    games: 'الألعاب',
    orders: 'طلباتي',
    account: 'حسابي',
    more: 'المزيد',
    trackOrder: 'تتبع الطلب',
    searchPlaceholder: 'ابحث عن باقات UC أو الألعاب...',
    searchResult: 'نتائج البحث',
    clearSearch: 'مسح البحث',
    back: 'رجوع',
    chooseGame: 'اختر اللعبة',
    gamesCount: '4 ألعاب',
    available: 'متوفر',
    comingSoon: 'قريباً',
    comingSoonDesc: 'هذه اللعبة ستكون متوفرة قريباً.',
    topUpNow: 'شحن الآن',
    lockedNotice: 'ببجي موبايل هي اللعبة الوحيدة المتاحة للشحن حالياً.',

    // Terms
    playerId: 'Player ID',
    username: 'Username',
    email: 'Email',
    orderId: 'Order ID',
    payment: 'Payment',

    // Exact requested label for main payment button
    payButtonLabel: 'ادفع',
    copyCode: 'نسخ الرمز',
    codeCopied: 'تم النسخ',

    // Statuses
    statusUnpaid: 'في انتظار الدفع',
    statusVerificationPending: 'قيد التحقق من الدفع',
    statusPendingReview: 'قيد المراجعة',
    statusProcessing: 'جاري التنفيذ',
    statusCompleted: 'مكتمل',
    statusFailed: 'فشل',
    statusCancelled: 'ملغي',

    // Recovery Actions
    resumePayment: 'متابعة الدفع',
    retryVerification: 'إعادة إرسال التحقق',
    cancelOrder: 'إلغاء الطلب',

    // Storefront features
    instantDeliveryTitle: 'شحن فوري',
    instantDeliveryDesc: 'يتم شحن شداتك إلى حسابك خلال دقائق معدودة.',
    securePaymentTitle: 'دفع محلي مباشر',
    securePaymentDesc: 'ادفع بسهولة عبر هرمود EVC Plus أو سهل.',
    supportTitle: 'دعم على مدار الساعة',
    supportDesc: 'فريق الدعم الفني جاهز لمساعدتك عبر واتساب.',
  },
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'so',
  setLanguage: () => {},
  t: (key: string, defaultText?: string) => defaultText || key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('somtopup_lang');
      if (saved === 'en' || saved === 'so' || saved === 'ar') return saved as Language;
    } catch {}
    return 'so';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('somtopup_lang', lang);
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    } catch {}
  };

  useEffect(() => {
    try {
      document.documentElement.lang = language;
      document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    } catch {}
  }, [language]);

  const t = (key: string, defaultText?: string): string => {
    const dict = translations[language] || translations.so;
    return dict[key] || defaultText || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
