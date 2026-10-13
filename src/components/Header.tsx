import React, { useState, useEffect } from 'react';
import { Search, ShoppingBag, Menu, X, Globe, PhoneCall, User } from 'lucide-react';
import { useLanguage } from '../services/language.tsx';
import { GameType } from '../types';
import { getCurrentCustomer } from '../services/customerAuth';

interface HeaderProps {
  onSearch: (query: string) => void;
  searchQuery: string;
  onOpenTracking: () => void;
  onOpenAuth?: () => void;
  onSelectGame: (game: 'All' | GameType) => void;
  selectedGame: 'All' | GameType;
}

export const Header: React.FC<HeaderProps> = ({
  onSearch,
  searchQuery,
  onOpenTracking,
  onOpenAuth,
  onSelectGame,
  selectedGame,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [customer, setCustomer] = useState(getCurrentCustomer());
  const { language, setLanguage, t } = useLanguage();

  useEffect(() => {
    const handleAuthChange = () => {
      setCustomer(getCurrentCustomer());
    };
    window.addEventListener('somtopup_customer_auth_change', handleAuthChange);
    return () => {
      window.removeEventListener('somtopup_customer_auth_change', handleAuthChange);
    };
  }, []);

  const toggleLanguage = () => {
    if (language === 'so') setLanguage('en');
    else if (language === 'en') setLanguage('ar');
    else setLanguage('so');
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-3">
        {/* Brand Logo & Wordmark (Red & White Theme) */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              onSelectGame('All');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-2 text-left focus:outline-none group cursor-pointer"
            aria-label="SomTopUp Home"
          >
            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center font-bold text-white text-base shadow-xs group-hover:bg-red-700 transition-colors">
              S
            </div>
            <div>
              <span className="text-lg sm:text-xl font-extrabold tracking-tight text-gray-900 group-hover:text-red-600 transition-colors">
                Som<span className="text-red-600">TopUp</span>
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
              placeholder={t('searchPlaceholder', 'Raadi xirmooyinka UC ama Games...')}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-8 py-1.5 sm:py-2 text-base sm:text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-600 focus:bg-white focus:ring-1 focus:ring-red-600 transition-all"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            {searchQuery && (
              <button
                onClick={() => onSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-semibold cursor-pointer"
              >
                {t('clearSearch', 'Tir')}
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
              selectedGame === 'All' ? 'text-red-600 font-bold' : 'hover:text-gray-900'
            }`}
          >
            {t('home', 'Hoy')}
          </button>
          <button
            onClick={() => onSelectGame('PUBG Mobile')}
            className={`transition-colors cursor-pointer flex items-center gap-1 ${
              selectedGame === 'PUBG Mobile' ? 'text-red-600 font-bold' : 'hover:text-gray-900'
            }`}
          >
            <span>PUBG Mobile</span>
            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-red-50 text-red-700 border border-red-200">
              {t('available', 'DIYAAR')}
            </span>
          </button>
          <button
            onClick={onOpenTracking}
            className="hover:text-red-600 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-red-600" />
            <span>{t('orders', 'Dalabyada')}</span>
          </button>
        </nav>

        {/* Action Buttons & Language Switcher */}
        <div className="flex items-center gap-2">
          {/* Language Switcher Button (SO / EN) */}
          <button
            type="button"
            onClick={toggleLanguage}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 hover:border-red-300 bg-gray-50 hover:bg-red-50 text-xs font-bold text-gray-700 hover:text-red-700 transition-colors cursor-pointer"
            title={language === 'so' ? 'Switch to English' : 'U beddel Af-Soomaali'}
          >
            <Globe className="w-3.5 h-3.5 text-red-600" />
            <span className="uppercase font-bold">{language === 'so' ? 'EN' : language === 'en' ? 'AR' : 'SO'}</span>
          </button>

          {/* Customer Account Button */}
          {onOpenAuth && (
            <button
              type="button"
              onClick={onOpenAuth}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-colors cursor-pointer shadow-2xs ${
                customer
                  ? 'border-green-300 bg-green-50 text-green-800 hover:bg-green-100'
                  : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700 hover:text-red-600'
              }`}
              title={customer ? `Akoonka: ${customer.email}` : 'Gal ama Sameyso Akoon'}
            >
              <User className={`w-3.5 h-3.5 ${customer ? 'text-green-600' : 'text-gray-500'}`} />
              <span className="hidden sm:inline max-w-[100px] truncate">
                {customer ? (customer.name || customer.email.split('@')[0]) : (language === 'so' ? 'Akoon' : 'Account')}
              </span>
            </button>
          )}

          {/* Customer Primary Action */}
          <button
            onClick={onOpenTracking}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs active:scale-98"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>{t('trackOrder', 'Raadi Dalab')}</span>
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg border border-gray-200 text-gray-600 md:hidden cursor-pointer hover:bg-gray-50"
            aria-label="Menu"
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
            placeholder={t('searchPlaceholder', 'Raadi xirmooyinka UC ama Games...')}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-8 pr-8 py-2 text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-600 focus:bg-white"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          {searchQuery && (
            <button
              onClick={() => onSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-semibold cursor-pointer"
            >
              {t('clearSearch', 'Tir')}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white px-4 py-3 space-y-2.5 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <span className="text-xs text-gray-500 font-medium">Luuqadda / Language:</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setLanguage('so')}
                className={`px-2 py-0.5 rounded text-xs font-bold ${
                  language === 'so' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                SO
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2 py-0.5 rounded text-xs font-bold ${
                  language === 'en' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLanguage('ar')}
                className={`px-2 py-0.5 rounded text-xs font-bold ${
                  language === 'ar' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                AR
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center text-xs font-medium">
            <button
              onClick={() => {
                onSelectGame('PUBG Mobile');
                setMobileMenuOpen(false);
              }}
              className="py-2 px-3 rounded-lg border border-red-200 bg-red-50/50 text-red-700 font-bold hover:bg-red-50 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>PUBG Mobile</span>
              <span className="text-[9px] bg-red-600 text-white px-1 rounded">{t('available', 'DIYAAR')}</span>
            </button>
            <div className="py-2 px-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-400 font-medium cursor-not-allowed flex items-center justify-center gap-1">
              <span>Ciyaaraha Kale</span>
              <span className="text-[9px] bg-gray-200 text-gray-600 px-1 rounded">{t('comingSoon', 'DHAWAAN')}</span>
            </div>
          </div>

          <div className="pt-1.5 border-t border-gray-100 space-y-1 text-xs text-gray-600">
            {onOpenAuth && (
              <button
                onClick={() => {
                  onOpenAuth();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-between py-2 text-left hover:text-red-600 cursor-pointer font-bold text-gray-800"
              >
                <span className="flex items-center gap-2">
                  <User className={`w-4 h-4 ${customer ? 'text-green-600' : 'text-red-600'}`} />
                  <span>{customer ? `${customer.name || customer.email.split('@')[0]} (Akoonkayga)` : (language === 'so' ? 'Gal / Sameyso Koonto' : 'Login / Register')}</span>
                </span>
                <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded border border-red-200">
                  {customer ? 'Active' : 'Account'}
                </span>
              </button>
            )}

            <button
              onClick={() => {
                onOpenTracking();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-between py-2 text-left hover:text-red-600 cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-red-600" /> {t('orders', 'Dalabyada')} ({t('trackOrder', 'Track Order')})
              </span>
              <span className="text-[11px] text-gray-400 font-mono">Order ID</span>
            </button>

            <a
              href="https://wa.me/252615482390"
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center justify-between py-2 text-left text-green-700 hover:text-green-800"
            >
              <span className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4" /> WhatsApp Taageero
              </span>
              <span className="text-[11px] font-mono">+252 61 5482390</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
