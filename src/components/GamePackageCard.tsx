import React from 'react';
import { GamePackage } from '../types';
import { ArrowRight, Coins, Zap } from 'lucide-react';

interface GamePackageCardProps {
  pkg: GamePackage;
  onSelect: (pkg: GamePackage) => void;
}

export const GamePackageCard: React.FC<GamePackageCardProps> = ({ pkg, onSelect }) => {
  const isPubg = pkg.game === 'PUBG Mobile';

  return (
    <div
      onClick={() => onSelect(pkg)}
      className="group bg-white rounded-2xl border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all duration-200 p-3.5 sm:p-4 flex flex-col justify-between cursor-pointer active:scale-[0.99] shadow-xs"
    >
      <div className="w-full space-y-3">
        {/* Top Currency Badge & Indicator */}
        <div className="flex items-center justify-between">
          <div
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-extrabold text-xs shadow-xs ${
              isPubg
                ? 'bg-amber-500 text-white'
                : 'bg-blue-600 text-white'
            }`}
          >
            {isPubg ? (
              <span className="tracking-tighter font-black text-xs">UC</span>
            ) : (
              <Coins className="w-5 h-5 text-amber-300" />
            )}
          </div>

          <span className="text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">
            {isPubg ? 'PUBG' : 'eFootball'}
          </span>
        </div>

        {/* Quantity and Package Name */}
        <div>
          <h3 className="text-base sm:text-lg font-extrabold text-gray-900 group-hover:text-blue-600 transition-colors tracking-tight">
            {pkg.credits}
          </h3>
          <p className="text-[11px] sm:text-xs text-gray-500 line-clamp-1 mt-0.5">
            {pkg.name}
          </p>
        </div>

        {/* Price Display */}
        <div className="pt-1">
          <div className="text-lg sm:text-xl font-black text-gray-900 tracking-tight tabular-nums">
            ${pkg.price.toFixed(2)}
          </div>
          <span className="text-[10px] text-green-600 font-medium">
            Diyaar ah
          </span>
        </div>
      </div>

      {/* Action Button */}
      <div className="pt-3 mt-2 border-t border-gray-100 w-full">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(pkg);
          }}
          className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs sm:text-sm transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
        >
          <span>Dooro</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
