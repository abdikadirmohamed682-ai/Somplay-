import React from 'react';
import { MessageCircle, Phone, ShoppingBag, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../services/language.tsx';
import { GameType } from '../types';

interface FooterProps {
  onOpenTracking: () => void;
  onSelectGame: (game: 'All' | GameType) => void;
  onOpenAdmin?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenTracking,
  onOpenAdmin,
}) => {
  const { language, t } = useLanguage();

  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-12 text-gray-600 text-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-gray-200">
          {/* Brand & Wordmark (Red Theme) */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-red-600 flex items-center justify-center font-bold text-white text-xs shadow-xs">
              S
            </div>
            <span className="text-base font-extrabold tracking-tight text-gray-900">
              Som<span className="text-red-600">TopUp</span>
            </span>
          </div>

          {/* Useful Concise Links */}
          <nav className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-gray-600">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="hover:text-red-600 transition-colors cursor-pointer"
            >
              {t('home', 'Hoy')}
            </button>
            <button
              onClick={onOpenTracking}
              className="hover:text-red-600 transition-colors cursor-pointer flex items-center gap-1"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-red-600" />
              <span>{t('trackOrder', 'Raadi Dalab')}</span>
            </button>
            <a
              href="https://wa.me/252615482390"
              target="_blank"
              rel="noreferrer"
              className="hover:text-green-700 transition-colors flex items-center gap-1 text-green-700 font-medium"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp (+252 61 5482390)</span>
            </a>
          </nav>
        </div>

        {/* Bottom Copyright Strip */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-gray-500 text-center sm:text-left">
          <p>
            {language === 'so'
              ? '© 2026 SomTopUp. Dhammaan xuquuqaha way dhowran yihiin.'
              : '© 2026 SomTopUp. All rights reserved.'}
          </p>
          <div className="flex items-center gap-3">
            <span>
              {language === 'so'
                ? 'Suuqa Ciyaaraha Soomaaliyeed (PUBG Mobile)'
                : 'Somali Gaming Top-Up Platform (PUBG Mobile)'}
            </span>
            {onOpenAdmin && (
              <button
                type="button"
                onClick={onOpenAdmin}
                className="text-gray-400 hover:text-red-600 transition-colors cursor-pointer text-[10px] uppercase font-bold tracking-wider"
              >
                Admin
              </button>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};
