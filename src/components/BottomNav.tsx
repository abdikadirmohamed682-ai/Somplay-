import React, { useState } from 'react';
import { Home, Gamepad2, ShoppingBag, User, MoreHorizontal, Phone, MessageCircle, X } from 'lucide-react';

interface BottomNavProps {
  onOpenTracking: () => void;
  onSelectGame: (game: 'All' | 'PUBG Mobile' | 'eFootball') => void;
  currentPath?: string;
}

type NavItemKey = 'home' | 'games' | 'orders' | 'profile' | 'more';

export const BottomNav: React.FC<BottomNavProps> = ({
  onOpenTracking,
  onSelectGame,
  currentPath = '/',
}) => {
  const [activeTab, setActiveTab] = useState<NavItemKey>('home');
  const [isMoreSheetOpen, setIsMoreSheetOpen] = useState(false);

  // Derive active tab from current route
  React.useEffect(() => {
    const p = currentPath.toLowerCase();
    if (p.includes('/orders') || p.includes('/my-orders')) {
      setActiveTab('orders');
    } else if (p.includes('/games/') || p.includes('/pubg') || p.includes('/efootball')) {
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
      // In customer mobile view, profile directs to their order history / tracking
      onOpenTracking();
    } else if (key === 'more') {
      setIsMoreSheetOpen(true);
    }
  };

  return (
    <>
      {/* Fixed Bottom Bar on Mobile */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 pb-safe shadow-md"
      >
        <div className="grid grid-cols-5 items-center justify-around py-1 px-1">
          {/* 1. Hoy */}
          <button
            type="button"
            onClick={() => handleTabClick('home')}
            className={`flex flex-col items-center justify-center py-1 px-1 cursor-pointer transition-colors ${
              activeTab === 'home' ? 'text-blue-600 font-semibold' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Home className="w-5 h-5 shrink-0" />
            <span className="text-[10px] mt-0.5 tracking-tight truncate">Hoy</span>
          </button>

          {/* 2. Ciyaaraha */}
          <button
            type="button"
            onClick={() => handleTabClick('games')}
            className={`flex flex-col items-center justify-center py-1 px-1 cursor-pointer transition-colors ${
              activeTab === 'games' ? 'text-blue-600 font-semibold' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Gamepad2 className="w-5 h-5 shrink-0" />
            <span className="text-[10px] mt-0.5 tracking-tight truncate">Ciyaaraha</span>
          </button>

          {/* 3. Dalabyada */}
          <button
            type="button"
            onClick={() => handleTabClick('orders')}
            className={`flex flex-col items-center justify-center py-1 px-1 cursor-pointer transition-colors ${
              activeTab === 'orders' ? 'text-blue-600 font-semibold' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <ShoppingBag className="w-5 h-5 shrink-0" />
            <span className="text-[10px] mt-0.5 tracking-tight truncate">Dalabyada</span>
          </button>

          {/* 4. Akoon */}
          <button
            type="button"
            onClick={() => handleTabClick('profile')}
            className={`flex flex-col items-center justify-center py-1 px-1 cursor-pointer transition-colors ${
              activeTab === 'profile' ? 'text-blue-600 font-semibold' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <User className="w-5 h-5 shrink-0" />
            <span className="text-[10px] mt-0.5 tracking-tight truncate">Akoon</span>
          </button>

          {/* 5. Wax badan */}
          <button
            type="button"
            onClick={() => handleTabClick('more')}
            className={`flex flex-col items-center justify-center py-1 px-1 cursor-pointer transition-colors ${
              activeTab === 'more' ? 'text-blue-600 font-semibold' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <MoreHorizontal className="w-5 h-5 shrink-0" />
            <span className="text-[10px] mt-0.5 tracking-tight truncate">Wax badan</span>
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
              <span className="text-sm font-bold text-gray-900">Adeegyo Dheeraad ah</span>
              <button
                type="button"
                onClick={() => setIsMoreSheetOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
                aria-label="Xir"
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
                className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-800 font-medium"
              >
                <ShoppingBag className="w-4 h-4 text-blue-600" />
                <span>Raadi Xaaladda Dalabkaaga</span>
              </button>

              <a
                href="https://wa.me/252615482390"
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-green-200 bg-green-50/50 hover:bg-green-50 text-green-800 font-medium"
              >
                <MessageCircle className="w-4 h-4 text-green-600" />
                <span>Taageerada WhatsApp (+252 61 5482390)</span>
              </a>

              <a
                href="tel:+252615482390"
                className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-800 font-medium"
              >
                <Phone className="w-4 h-4 text-blue-600" />
                <span>Wac Taageerada Tooska ah</span>
              </a>
            </div>

            <div className="pt-2 text-center text-[11px] text-gray-400">
              SomTopUp v2.5 — Suuqa Ciyaaraha Soomaaliyeed
            </div>
          </div>
        </div>
      )}
    </>
  );
};
