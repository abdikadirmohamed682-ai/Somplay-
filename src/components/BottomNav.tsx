import React, { useState } from 'react';
import { Home, Gamepad2, ShoppingBag, User, MoreHorizontal, Phone, MessageCircle, X } from 'lucide-react';
import { useLanguage } from '../services/language.tsx';
import { GameType } from '../types';

interface BottomNavProps {
  onOpenTracking: () => void;
  onSelectGame: (game: 'All' | GameType) => void;
  currentPath?: string;
  onOpenAuth?: () => void;
}

type NavItemKey = 'home' | 'games' | 'orders' | 'profile' | 'more';

export const BottomNav: React.FC<BottomNavProps> = ({
  onOpenTracking,
  onSelectGame,
  currentPath = '/',
  onOpenAuth,
}) => {
  const [activeTab, setActiveTab] = useState<NavItemKey>('home');
  const [isMoreSheetOpen, setIsMoreSheetOpen] = useState(false);
  const { language, t } = useLanguage();

  React.useEffect(() => {
    const p = currentPath.toLowerCase();
    if (p.includes('/orders') || p.includes('/my-orders')) {
      setActiveTab('orders');
    } else if (p.includes('/games/') || p.includes('/pubg')) {
      setActiveTab('games');
    } else {
      setActiveTab('home');
    }
  }, [currentPath]);

  const handleTabClick = (key: NavItemKey) => {
    setActiveTab(key);

    if (key === 'home') {
      onSelectGame('All');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (key === 'games') {
      const el = document.getElementById('game-selection-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        onSelectGame('All');
        setTimeout(() => {
          const target = document.getElementById('game-selection-section');
          if (target) target.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } else if (key === 'orders') {
      onOpenTracking();
    } else if (key === 'profile') {
      if (onOpenAuth) onOpenAuth();
      else onOpenTracking();
    } else if (key === 'more') {
      setIsMoreSheetOpen(true);
    }
  };

  return (
    <>
      {/* Fixed Bottom Bar on Mobile (Red Active State) */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 pb-safe shadow-md"
      >
        <div className="grid grid-cols-5 items-center justify-around py-1 px-1">
          {/* 1. Hoy / Home */}
          <button
            type="button"
            onClick={() => handleTabClick('home')}
            className={`flex flex-col items-center justify-center py-1 px-1 cursor-pointer transition-colors ${
              activeTab === 'home' ? 'text-red-600 font-bold' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Home className="w-5 h-5 shrink-0" />
            <span className="text-[10px] mt-0.5 tracking-tight truncate">{t('home', 'Hoy')}</span>
          </button>

          {/* 2. Ciyaaraha / Games */}
          <button
            type="button"
            onClick={() => handleTabClick('games')}
            className={`flex flex-col items-center justify-center py-1 px-1 cursor-pointer transition-colors ${
              activeTab === 'games' ? 'text-red-600 font-bold' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Gamepad2 className="w-5 h-5 shrink-0" />
            <span className="text-[10px] mt-0.5 tracking-tight truncate">{t('games', 'Ciyaaraha')}</span>
          </button>

          {/* 3. Dalabyada / Orders */}
          <button
            type="button"
            onClick={() => handleTabClick('orders')}
            className={`flex flex-col items-center justify-center py-1 px-1 cursor-pointer transition-colors ${
              activeTab === 'orders' ? 'text-red-600 font-bold' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <ShoppingBag className="w-5 h-5 shrink-0" />
            <span className="text-[10px] mt-0.5 tracking-tight truncate">{t('orders', 'Dalabyada')}</span>
          </button>

          {/* 4. Akoon / Account */}
          <button
            type="button"
            onClick={() => handleTabClick('profile')}
            className={`flex flex-col items-center justify-center py-1 px-1 cursor-pointer transition-colors ${
              activeTab === 'profile' ? 'text-red-600 font-bold' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <User className="w-5 h-5 shrink-0" />
            <span className="text-[10px] mt-0.5 tracking-tight truncate">{t('account', 'Akoon')}</span>
          </button>

          {/* 5. Wax badan / More */}
          <button
            type="button"
            onClick={() => handleTabClick('more')}
            className={`flex flex-col items-center justify-center py-1 px-1 cursor-pointer transition-colors ${
              activeTab === 'more' ? 'text-red-600 font-bold' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <MoreHorizontal className="w-5 h-5 shrink-0" />
            <span className="text-[10px] mt-0.5 tracking-tight truncate">{t('more', 'Wax badan')}</span>
          </button>
        </div>
      </nav>

      {/* "Wax badan" Slide-up Sheet */}
      {isMoreSheetOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/30 backdrop-blur-xs flex items-end justify-center"
          onClick={() => setIsMoreSheetOpen(false)}
        >
          <div
            className="w-full bg-white rounded-t-2xl border-t border-gray-200 p-5 space-y-4 shadow-xl pb-safe"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <span className="text-sm font-bold text-gray-900">
                {language === 'so' ? 'Adeegyo Dheeraad ah' : 'More Services'}
              </span>
              <button
                type="button"
                onClick={() => setIsMoreSheetOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setIsMoreSheetOpen(false);
                  onOpenTracking();
                }}
                className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-800 font-medium cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4 text-red-600" />
                <span>{language === 'so' ? 'Raadi Xaaladda Dalabkaaga' : 'Track Your Order Status'}</span>
              </button>

              <a
                href="https://wa.me/252615482390"
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-green-200 bg-green-50/50 hover:bg-green-50 text-green-800 font-medium"
              >
                <MessageCircle className="w-4 h-4 text-green-600" />
                <span>WhatsApp (+252 61 5482390)</span>
              </a>

              <a
                href="tel:+252615482390"
                className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-800 font-medium"
              >
                <Phone className="w-4 h-4 text-red-600" />
                <span>{language === 'so' ? 'Wac Taageerada Tooska ah' : 'Call Support Directly'}</span>
              </a>
            </div>

            <div className="pt-2 text-center text-[11px] text-gray-400">
              SomTopUp — Suuqa Ciyaaraha Soomaaliyeed
            </div>
          </div>
        </div>
      )}
    </>
  );
};
