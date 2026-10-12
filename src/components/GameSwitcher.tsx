import React from 'react';
import { GameType } from '../types';
import pubgIcon from '../assets/images/game_pubg_mobile_1791667426125.jpg';
import efbIcon from '../assets/images/game_efootball_coins_1791667436245.jpg';
import { ArrowRight } from 'lucide-react';

interface GameSwitcherProps {
  selectedGame: 'All' | GameType;
  onSelectGame: (game: 'All' | GameType) => void;
  onOpenGameCheckout: (game: GameType) => void;
}

export const GameSwitcher: React.FC<GameSwitcherProps> = ({
  onOpenGameCheckout,
}) => {
  return (
    <section id="game-selection-section" className="w-full space-y-3 sm:space-y-4">
      {/* Section Heading */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-base sm:text-xl font-extrabold text-gray-900 tracking-tight">
          Dooro Ciyaarta
        </h2>
        <span className="text-xs text-gray-500 font-medium">
          2 Ciyaarood
        </span>
      </div>

      {/* Exactly Two Prominent Primary Game Cards (Side-by-side on mobile and desktop) */}
      <div className="grid grid-cols-2 gap-3 sm:gap-6">
        {/* Card 1: PUBG Mobile */}
        <div
          onClick={() => onOpenGameCheckout('PUBG Mobile')}
          className="group bg-white rounded-2xl border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all duration-200 p-3 sm:p-5 flex flex-col justify-between cursor-pointer active:scale-[0.99] shadow-xs"
        >
          <div className="w-full space-y-2.5 sm:space-y-3">
            {/* Large Square Game Image */}
            <div className="w-full aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-100 relative">
              <img
                src={pubgIcon}
                alt="PUBG Mobile"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>

            {/* Game Title & Subtitle */}
            <div className="text-center sm:text-left">
              <h3 className="text-sm sm:text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors tracking-tight">
                PUBG Mobile
              </h3>
              <p className="text-[11px] sm:text-xs text-gray-500 truncate mt-0.5">
                Ku shubo Unknown Cash (UC)
              </p>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2 sm:pt-3 w-full">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenGameCheckout('PUBG Mobile');
              }}
              className="w-full py-2 sm:py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs sm:text-sm transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span>Shubo</span>
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>

        {/* Card 2: eFootball */}
        <div
          onClick={() => onOpenGameCheckout('eFootball')}
          className="group bg-white rounded-2xl border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all duration-200 p-3 sm:p-5 flex flex-col justify-between cursor-pointer active:scale-[0.99] shadow-xs"
        >
          <div className="w-full space-y-2.5 sm:space-y-3">
            {/* Large Square Game Image */}
            <div className="w-full aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-100 relative">
              <img
                src={efbIcon}
                alt="eFootball"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>

            {/* Game Title & Subtitle */}
            <div className="text-center sm:text-left">
              <h3 className="text-sm sm:text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors tracking-tight">
                eFootball
              </h3>
              <p className="text-[11px] sm:text-xs text-gray-500 truncate mt-0.5">
                Ku shubo Coins koontadaada
              </p>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2 sm:pt-3 w-full">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenGameCheckout('eFootball');
              }}
              className="w-full py-2 sm:py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs sm:text-sm transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span>Shubo</span>
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
