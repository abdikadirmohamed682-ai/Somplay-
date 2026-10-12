import React, { useMemo } from 'react';
import { GamePackage, GameType } from '../types';
import { GamePackageCard } from './GamePackageCard';
import pubgIcon from '../assets/images/game_pubg_mobile_1791667426125.jpg';
import efbIcon from '../assets/images/game_efootball_coins_1791667436245.jpg';
import { ArrowLeft, ShieldCheck, Zap, MessageCircle } from 'lucide-react';

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
  const isPubg = game === 'PUBG Mobile';
  const gameIcon = isPubg ? pubgIcon : efbIcon;

  // Strict data separation: ONLY packages matching this specific game
  const gamePackages = useMemo(() => {
    return packages
      .filter((pkg) => pkg.game === game && pkg.active)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }, [packages, game]);

  const handlePackageClick = (pkg: GamePackage) => {
    // Strict runtime validation
    if (pkg.game !== game) {
      console.error('Invalid game package selection');
      return;
    }
    onSelectPackage(pkg);
  };

  return (
    <div className="w-full space-y-6 sm:space-y-8 animate-fadeIn">
      {/* 5. Game Page Header (Compact & Consistent) */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-xs space-y-4">
        {/* Navigation & Back Button */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs sm:text-sm font-semibold transition-colors cursor-pointer shadow-xs active:scale-98"
          >
            <ArrowLeft className="w-4 h-4 text-blue-600" />
            <span>Dib u noqo</span>
          </button>

          <span className="text-xs text-gray-500 font-medium">
            {gamePackages.length} Xirmo diyaar ah
          </span>
        </div>

        {/* Game Title, Icon, and Subtitle */}
        <div className="flex items-center gap-3.5 sm:gap-5 pt-1">
          {/* Game Icon */}
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 shrink-0 shadow-xs">
            <img
              src={gameIcon}
              alt={game}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Titles */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                {isPubg ? 'PUBG Mobile UC' : 'eFootball Coins'}
              </span>
            </div>
            <h1 className="text-lg sm:text-2xl font-black text-gray-900 tracking-tight mt-0.5">
              {isPubg ? 'Xirmooyinka PUBG Mobile' : 'Xirmooyinka eFootball'}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5 leading-relaxed">
              {isPubg
                ? 'Dooro xirmada Unknown Cash (UC) ee aad rabto inaad ku shubato Player ID-gaaga.'
                : 'Dooro xirmada Coins ee aad rabto inaad ku shubato koontadaada eFootball.'}
            </p>
          </div>
        </div>
      </div>

      {/* 6. Responsive Package Grid (2 columns mobile, 3 tablet, 4 desktop) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm sm:text-base font-extrabold text-gray-900 tracking-tight">
            Dooro Xirmadaada
          </h2>
          <span className="text-xs text-gray-500">
            Riix xirmo si aad u gasho shubashada
          </span>
        </div>

        {gamePackages.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4 lg:gap-5">
            {gamePackages.map((pkg) => (
              <GamePackageCard
                key={pkg.id}
                pkg={pkg}
                onSelect={handlePackageClick}
              />
            ))}
          </div>
        ) : (
          <div className="p-8 sm:p-12 text-center rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
            <p className="text-sm font-bold text-gray-900">
              Ma jiraan xirmooyin la heli karo hadda ciyaartan.
            </p>
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer shadow-xs"
            >
              Ku noqo Bogga Hore
            </button>
          </div>
        )}
      </section>

      {/* Reassurance & Support Notice */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-gray-900">
              Shubasho Toos ah & Sugan
            </h4>
            <p className="text-[11px] sm:text-xs text-gray-500">
              Dooro xirmadaada, geli xogtaada, oo ku bixi EVC Plus, Zaad, Sahal ama e-Dahab.
            </p>
          </div>
        </div>

        <a
          href="https://wa.me/252615482390"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-gray-100 border border-gray-200 text-green-700 text-xs font-semibold transition-colors shrink-0 shadow-xs"
        >
          <MessageCircle className="w-4 h-4 text-green-600" />
          <span>Taageerada WhatsApp</span>
        </a>
      </div>
    </div>
  );
};
