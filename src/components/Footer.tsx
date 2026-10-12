import React from 'react';
import { MessageCircle, Phone, ShoppingBag, ShieldCheck } from 'lucide-react';

interface FooterProps {
  onOpenTracking: () => void;
  onOpenAdmin: () => void;
  onSelectGame: (game: 'PUBG Mobile' | 'eFootball') => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenTracking,
  onOpenAdmin,
}) => {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-12 text-gray-600 text-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-gray-200">
          {/* Brand & Wordmark */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-xs shadow-xs">
              S
            </div>
            <span className="text-base font-extrabold tracking-tight text-gray-900">
              Som<span className="text-blue-600">TopUp</span>
            </span>
          </div>

          {/* Useful Concise Links */}
          <nav className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-gray-600">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="hover:text-blue-600 transition-colors cursor-pointer"
            >
              Hoy
            </button>
            <button
              onClick={onOpenTracking}
              className="hover:text-blue-600 transition-colors cursor-pointer flex items-center gap-1"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />
              <span>Raadi Dalab</span>
            </button>
            <a
              href="https://wa.me/252615482390"
              target="_blank"
              rel="noreferrer"
              className="hover:text-green-700 transition-colors flex items-center gap-1 text-green-700 font-medium"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Taageero (+252 61 5482390)</span>
            </a>
            <button
              onClick={onOpenAdmin}
              className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              Maamulka
            </button>
          </nav>
        </div>

        {/* Bottom Copyright Strip */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-gray-500 text-center sm:text-left">
          <p>© 2026 SomTopUp. Dhammaan xuquuqaha way dhowran yihiin.</p>
          <p>Suuqa Ciyaaraha Soomaaliyeed (PUBG Mobile & eFootball)</p>
        </div>
      </div>
    </footer>
  );
};
