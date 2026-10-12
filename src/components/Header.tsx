import React, { useState } from 'react';
import { Search, ShoppingBag, Menu, X, PhoneCall } from 'lucide-react';

interface HeaderProps {
  onSearch: (query: string) => void;
  searchQuery: string;
  onOpenTracking: () => void;
  onSelectGame: (game: 'All' | 'PUBG Mobile' | 'eFootball') => void;
  selectedGame: 'All' | 'PUBG Mobile' | 'eFootball';
}

export const Header: React.FC<HeaderProps> = ({
  onSearch,
  searchQuery,
  onOpenTracking,
  onSelectGame,
  selectedGame,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-3">
        {/* Brand Logo & Wordmark */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              onSelectGame('All');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-2 text-left focus:outline-none group cursor-pointer"
            aria-label="SomTopUp Bogga Hore"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-base shadow-xs group-hover:bg-blue-700 transition-colors">
              S
            </div>
            <div>
              <span className="text-lg sm:text-xl font-extrabold tracking-tight text-gray-900 group-hover:text-blue-600 transition-colors">
                Som<span className="text-blue-600">TopUp</span>
              </span>
            </div>
          </button>
        </div>

        {/* Search Bar on Desktop / Tablet */}
        <div className="flex-1 max-w-sm sm:max-w-md mx-2 hidden sm:block">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Raadi xirmooyinka UC ama Coins..."
              className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-8 py-1.5 sm:py-2 text-base sm:text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600 transition-all"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            {searchQuery && (
              <button
                onClick={() => onSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-semibold cursor-pointer"
              >
                Tir
              </button>
            )}
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-5 text-xs font-semibold text-gray-600">
          <button
            onClick={() => {
              onSelectGame('All');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`transition-colors cursor-pointer ${
              selectedGame === 'All' ? 'text-blue-600' : 'hover:text-gray-900'
            }`}
          >
            Hoy
          </button>
          <button
            onClick={() => onSelectGame('PUBG Mobile')}
            className={`transition-colors cursor-pointer ${
              selectedGame === 'PUBG Mobile' ? 'text-blue-600' : 'hover:text-gray-900'
            }`}
          >
            PUBG Mobile
          </button>
          <button
            onClick={() => onSelectGame('eFootball')}
            className={`transition-colors cursor-pointer ${
              selectedGame === 'eFootball' ? 'text-blue-600' : 'hover:text-gray-900'
            }`}
          >
            eFootball
          </button>
          <button
            onClick={onOpenTracking}
            className="hover:text-blue-600 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />
            <span>Dalabyada</span>
          </button>
        </nav>

        {/* Customer Primary Action & Mobile Menu Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenTracking}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Raadi Dalab</span>
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg border border-gray-200 text-gray-600 md:hidden cursor-pointer hover:bg-gray-50"
            aria-label="Fur liiska"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Search input below header bar */}
      <div className="px-4 pb-2.5 sm:hidden">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Raadi xirmooyinka UC ama Coins..."
            className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-8 pr-8 py-2 text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-600 focus:bg-white"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          {searchQuery && (
            <button
              onClick={() => onSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-semibold cursor-pointer"
            >
              Tir
            </button>
          )}
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white px-4 py-3 space-y-2.5 shadow-sm">
          <div className="grid grid-cols-2 gap-2 text-center text-xs font-medium">
            <button
              onClick={() => {
                onSelectGame('PUBG Mobile');
                setMobileMenuOpen(false);
              }}
              className="py-2 px-3 rounded-lg border border-gray-200 text-gray-800 hover:border-blue-600 hover:text-blue-600 cursor-pointer"
            >
              PUBG Mobile
            </button>
            <button
              onClick={() => {
                onSelectGame('eFootball');
                setMobileMenuOpen(false);
              }}
              className="py-2 px-3 rounded-lg border border-gray-200 text-gray-800 hover:border-blue-600 hover:text-blue-600 cursor-pointer"
            >
              eFootball
            </button>
          </div>

          <div className="pt-1.5 border-t border-gray-100 space-y-1 text-xs text-gray-600">
            <button
              onClick={() => {
                onOpenTracking();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-between py-2 text-left hover:text-blue-600 cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-blue-600" /> Dalabyadayda (My Orders)
              </span>
              <span className="text-[11px] text-gray-400">Raac</span>
            </button>

            <a
              href="https://wa.me/252615482390"
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center justify-between py-2 text-left text-green-700 hover:text-green-800"
            >
              <span className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4" /> Caawin WhatsApp
              </span>
              <span className="text-[11px]">+252 61 5482390</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
