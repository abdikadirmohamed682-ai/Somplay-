import React from 'react';
import { GamePackage } from '../types';
import { Check } from 'lucide-react';

interface PackageCardProps {
  pkg: GamePackage;
  onSelect: (pkg: GamePackage) => void;
}

export const PackageCard: React.FC<PackageCardProps> = ({ pkg, onSelect }) => {
  const isPubg = pkg.game === 'PUBG Mobile';
  const hasDiscount = pkg.originalPrice && pkg.originalPrice > pkg.price;
  const discountPercent = hasDiscount
    ? Math.round(((pkg.originalPrice! - pkg.price) / pkg.originalPrice!) * 100)
    : 0;

  return (
    <div
      onClick={() => onSelect(pkg)}
      className="group rounded-xl bg-white border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden cursor-pointer p-4"
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[11px] font-semibold text-blue-600">
            {pkg.game}
          </span>

          {pkg.badge && (
            <span className="text-[10px] font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
              {pkg.badge}
            </span>
          )}
          {!pkg.badge && hasDiscount && (
            <span className="text-[10px] font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded">
              -{discountPercent}%
            </span>
          )}
        </div>

        {/* Currency & Package Title */}
        <div className="flex items-center gap-3 my-2">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
              isPubg
                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                : 'bg-blue-50 text-blue-700 border border-blue-200'
            }`}
          >
            {isPubg ? 'UC' : 'COIN'}
          </div>

          <div className="min-w-0">
            <h3 className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors leading-tight">
              {pkg.credits}
            </h3>
            <p className="text-xs text-gray-500 truncate">{pkg.name}</p>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed min-h-[32px]">
          {pkg.description}
        </p>
      </div>

      {/* Price & Action */}
      <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2 mt-3">
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-gray-900 tabular-nums">
              ${pkg.price.toFixed(2)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-gray-400 line-through tabular-nums">
                ${pkg.originalPrice!.toFixed(2)}
              </span>
            )}
          </div>
          <span className="text-[10px] text-green-600 font-medium flex items-center gap-0.5">
            <Check className="w-3 h-3" /> La heli karo
          </span>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(pkg);
          }}
          className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors cursor-pointer"
        >
          Dooro
        </button>
      </div>
    </div>
  );
};
