import React, { useMemo } from 'react';
import { GamePackage, GameType } from '../types';
import { GamePackageCard } from './GamePackageCard';
import pubgIcon from '../assets/images/game_pubg_mobile_1791667426125.jpg';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '../services/language.tsx';

interface GamePackagePageProps {
  game: GameType;
  packages: GamePackage[];
  onBack: () => void;
  onSelectPackage: (pkg: GamePackage) => void;
}

export const GamePackagePage: React.FC<GamePackagePageProps> = ({
  game,
  packages,
  onBack,
  onSelectPackage,
}) => {
  const { language } = useLanguage();
  const isPubg = game === 'PUBG Mobile';

  // Strict data separation: ONLY packages matching this specific game
  const gamePackages = useMemo(() => {
    return packages
      .filter((pkg) => pkg.game === game && pkg.active)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }, [packages, game]);

  const handlePackageClick = (pkg: GamePackage) => {
    if (pkg.game !== game) {
      console.error('Invalid game package selection');
      return;
    }
    onSelectPackage(pkg);
  };

  return (
    <div className="w-full space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Game Page Header (Compact & Red Accents) */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-xs space-y-4">
        {/* Navigation & Back Button */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs sm:text-sm font-semibold transition-colors cursor-pointer shadow-xs active:scale-98"
          >
            <ArrowLeft className="w-4 h-4 text-red-600" />
            <span>{language === 'so' ? 'Dib u noqo' : 'Back'}</span>
          </button>

          <span className="text-xs text-gray-500 font-medium">
            {language === 'so' ? `${gamePackages.length} Xirmo diyaar ah` : `${gamePackages.length} Available Packages`}
          </span>
        </div>

        {/* Game Title, Icon, and Subtitle */}
        <div className="flex items-center gap-3.5 sm:gap-5 pt-1">
          {/* Game Icon */}
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 shrink-0 shadow-xs">
            <img
              src={pubgIcon}
              alt={game}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Titles */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md">
                PUBG Mobile UC
              </span>
            </div>
            <h1 className="text-lg sm:text-2xl font-black text-gray-900 tracking-tight mt-0.5">
              {language === 'so' ? 'Xirmooyinka PUBG Mobile' : 'PUBG Mobile Packages'}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5 leading-relaxed">
              {language === 'so'
                ? 'Dooro xirmada Unknown Cash (UC) ee aad rabto inaad ku shubato Player ID-gaaga.'
                : 'Select the Unknown Cash (UC) package you want to deliver to your Player ID.'}
            </p>
          </div>
        </div>
      </div>

      {/* Responsive Package Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm sm:text-base font-extrabold text-gray-900 tracking-tight">
            {language === 'so' ? 'Dooro Xirmadaada' : 'Choose Your Package'}
          </h2>
          <span className="text-xs text-gray-500">
            {language === 'so' ? 'Riix xirmo si aad u gasho shubashada' : 'Click a package to proceed'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
          {gamePackages.map((pkg) => (
            <GamePackageCard
              key={pkg.id}
              pkg={pkg}
              onSelect={handlePackageClick}
            />
          ))}
        </div>
      </section>
    </div>
  );
};
