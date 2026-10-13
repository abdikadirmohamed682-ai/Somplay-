import React, { useState } from 'react';
import { GameType } from '../types';
import pubgIcon from '../assets/images/game_pubg_mobile_1791667426125.jpg';
import efbIcon from '../assets/images/game_efootball_coins_1791667436245.jpg';
import freeFireIcon from '../assets/images/game_free_fire_1791830199849.jpg';
import codIcon from '../assets/images/game_cod_mobile_1791830215046.jpg';
import { ArrowRight, Lock, AlertCircle } from 'lucide-react';
import { useLanguage } from '../services/language.tsx';

interface GameSwitcherProps {
  selectedGame: 'All' | GameType;
  onSelectGame: (game: 'All' | GameType) => void;
  onOpenGameCheckout: (game: GameType) => void;
}

interface GameCardConfig {
  id: GameType;
  title: string;
  subtitleSo: string;
  subtitleEn: string;
  image: string;
  status: 'available' | 'coming_soon';
  availableBadgeSo: string;
  availableBadgeEn: string;
}

export const GameSwitcher: React.FC<GameSwitcherProps> = ({
  onOpenGameCheckout,
}) => {
  const { language, t } = useLanguage();
  const [lockedNoticeGame, setLockedNoticeGame] = useState<string | null>(null);

  const games: GameCardConfig[] = [
    {
      id: 'PUBG Mobile',
      title: 'PUBG Mobile',
      subtitleSo: 'Ku shubo Unknown Cash (UC)',
      subtitleEn: 'Top up Unknown Cash (UC)',
      image: pubgIcon,
      status: 'available',
      availableBadgeSo: 'DIYAAR',
      availableBadgeEn: 'AVAILABLE',
    },
    {
      id: 'eFootball',
      title: 'eFootball',
      subtitleSo: 'Coins & Xirmooyin Ciyaareed',
      subtitleEn: 'Coins & Game Packages',
      image: efbIcon,
      status: 'coming_soon',
      availableBadgeSo: 'DHAWAAN',
      availableBadgeEn: 'COMING SOON',
    },
    {
      id: 'Free Fire',
      title: 'Free Fire',
      subtitleSo: 'Diamonds & Battle Pass',
      subtitleEn: 'Diamonds & Battle Pass',
      image: freeFireIcon,
      status: 'coming_soon',
      availableBadgeSo: 'DHAWAAN',
      availableBadgeEn: 'COMING SOON',
    },
    {
      id: 'Call of Duty: Mobile',
      title: 'Call of Duty: Mobile',
      subtitleSo: 'CP & Xirmooyinka Hubka',
      subtitleEn: 'CP & Weapon Crates',
      image: codIcon,
      status: 'coming_soon',
      availableBadgeSo: 'DHAWAAN',
      availableBadgeEn: 'COMING SOON',
    },
  ];

  const handleCardClick = (game: GameCardConfig) => {
    if (game.status === 'available' && game.id === 'PUBG Mobile') {
      onOpenGameCheckout('PUBG Mobile');
    } else {
      setLockedNoticeGame(game.title);
      setTimeout(() => setLockedNoticeGame(null), 3500);
    }
  };

  return (
    <section id="game-selection-section" className="w-full space-y-3 sm:space-y-4">
      {/* Section Heading */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-base sm:text-xl font-extrabold text-gray-900 tracking-tight">
          {t('chooseGame', 'Dooro Ciyaarta')}
        </h2>
        <span className="text-xs text-gray-500 font-medium">
          {t('gamesCount', '4 Ciyaarood')}
        </span>
      </div>

      {/* Temporary locked game feedback toast */}
      {lockedNoticeGame && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2 animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            {language === 'so'
              ? `${lockedNoticeGame}: Ciyaartan dhawaan ayay diyaar noqon doontaa. Kaliya PUBG Mobile ayaa hadda diyaar u ah shubasho.`
              : `${lockedNoticeGame}: This game will be available soon. Only PUBG Mobile is currently available for top-up.`}
          </span>
        </div>
      )}

      {/* 4 Games Grid (2 columns on mobile, 4 columns on tablet & desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
        {games.map((g) => {
          const isAvailable = g.status === 'available';

          return (
            <div
              key={g.id}
              onClick={() => handleCardClick(g)}
              className={`rounded-2xl border transition-all duration-200 p-3 sm:p-4 flex flex-col justify-between shadow-xs ${
                isAvailable
                  ? 'bg-white border-gray-200 hover:border-red-500 hover:shadow-md cursor-pointer active:scale-[0.99] group'
                  : 'bg-gray-50/70 border-gray-200 opacity-90 cursor-default select-none'
              }`}
            >
              <div className="w-full space-y-2 sm:space-y-3">
                {/* Game Image Container */}
                <div className="w-full aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-100 relative">
                  <img
                    src={g.image}
                    alt={g.title}
                    referrerPolicy="no-referrer"
                    className={`w-full h-full object-cover transition-transform duration-300 ${
                      isAvailable ? 'group-hover:scale-105' : 'filter grayscale-15'
                    }`}
                  />

                  {/* Top Subtle Overlay Status Label */}
                  <div className="absolute top-2 left-2 z-10">
                    {isAvailable ? (
                      <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-red-600 text-white shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        {language === 'so' ? g.availableBadgeSo : g.availableBadgeEn}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-gray-900/80 backdrop-blur-xs text-white">
                        <Lock className="w-2.5 h-2.5 text-gray-300" />
                        {language === 'so' ? g.availableBadgeSo : g.availableBadgeEn}
                      </span>
                    )}
                  </div>
                </div>

                {/* Game Title & Neat Subtitle */}
                <div className="text-left space-y-0.5">
                  <div className="flex items-center justify-between">
                    <h3
                      className={`text-sm sm:text-base font-extrabold tracking-tight truncate ${
                        isAvailable
                          ? 'text-gray-900 group-hover:text-red-600 transition-colors'
                          : 'text-gray-700'
                      }`}
                    >
                      {g.title}
                    </h3>
                  </div>
                  <p className="text-[11px] sm:text-xs text-gray-500 truncate">
                    {language === 'so' ? g.subtitleSo : g.subtitleEn}
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2.5 sm:pt-3 w-full">
                {isAvailable ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenGameCheckout('PUBG Mobile');
                    }}
                    className="w-full py-2 sm:py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-xs sm:text-sm transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-98"
                  >
                    <span>{t('topUpNow', 'Shubo')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled
                    aria-disabled="true"
                    className="w-full py-2 sm:py-2.5 px-3 rounded-xl bg-gray-200 text-gray-500 font-semibold text-xs sm:text-xs border border-gray-300/60 cursor-not-allowed flex items-center justify-center gap-1"
                  >
                    <Lock className="w-3 h-3 text-gray-400" />
                    <span>{language === 'so' ? 'DHAWAAN' : 'COMING SOON'}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
