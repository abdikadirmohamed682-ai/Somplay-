import React from 'react';
import {
  CheckCircle2,
  Clock,
  ShieldCheck,
  MessageCircle,
  Phone,
  Gamepad2,
  FileText,
  CreditCard,
  ArrowRight,
} from 'lucide-react';
import { GameType } from '../types';

interface HomeStorefrontSectionsProps {
  onSelectGame: (game: GameType) => void;
  onOpenTracking: () => void;
}

export const HomeStorefrontSections: React.FC<HomeStorefrontSectionsProps> = ({
  onSelectGame,
  onOpenTracking,
}) => {
  return (
    <div className="w-full space-y-8 sm:space-y-12 pt-2">
      {/* Section A: Maxaa SomTopUp Loo Doortaa? (Why Choose SomTopUp) */}
      <section className="w-full space-y-4">
        <div className="text-center sm:text-left space-y-1 px-1">
          <h2 className="text-base sm:text-xl font-extrabold text-gray-900 tracking-tight">
            Maxaa SomTopUp Loo Doortaa?
          </h2>
          <p className="text-xs sm:text-sm text-gray-500">
            Faa'iidooyinka aad ka helayso shubashada ciyaaraha
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-5">
          {/* Benefit 1: Dalab Fudud */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 flex items-start gap-3.5 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 mt-0.5">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-bold text-gray-900">
                Dalab Fudud
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Dooro ciyaartaada oo ku shubo dhowr tallaabo oo sahlan adigoo isticmaalaya Player ID ama Email.
              </p>
            </div>
          </div>

          {/* Benefit 2: Qiime Cad & Sugan */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 flex items-start gap-3.5 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 mt-0.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-bold text-gray-900">
                Qiime Cad & Sugan
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Dhammaan qiimayaasha xirmooyinka waa kuwo cad, oo aan lahayn wax kharashyo qarsoon ah.
              </p>
            </div>
          </div>

          {/* Benefit 3: La-socodka Xaaladda */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 flex items-start gap-3.5 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 mt-0.5">
              <Clock className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-bold text-gray-900">
                La-socodka Xaaladda
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Kala soco heerka uu marayo dalabkaaga wakhti kasta adigoo isticmaalaya tixraacaaga gaarka ah.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section B: Sida Loo Shubto (How It Works) */}
      <section className="w-full space-y-4">
        <div className="text-center sm:text-left space-y-1 px-1">
          <h2 className="text-base sm:text-xl font-extrabold text-gray-900 tracking-tight">
            Sida Loo Shubto
          </h2>
          <p className="text-xs sm:text-sm text-gray-500">
            3 tallaabo oo sahlan oo aad ku helayso UC ama Coins
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-5">
          {/* Step 1 */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 space-y-3 relative shadow-xs">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                1
              </div>
              <Gamepad2 className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-bold text-gray-900">
                Dooro Ciyaarta
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Dooro PUBG Mobile ama eFootball oo dooro xirmada kugu habboon.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 space-y-3 relative shadow-xs">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                2
              </div>
              <FileText className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-bold text-gray-900">
                Geli Xogtaada
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Geli Player ID ama Email-kaaga oo raac tilmaamaha ku qoran shaashadda.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 space-y-3 relative shadow-xs">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                3
              </div>
              <CreditCard className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-bold text-gray-900">
                Bixi Lacagta & La Soco
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Dhammaystir lacag-bixinta mobaylkaaga oo toos ula soco xaaladda dalabkaaga.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section C: Caawimaad Ma U Baahan Tahay? (Contact Us) */}
      <section className="w-full bg-blue-50/70 border border-blue-100 rounded-2xl p-5 sm:p-6 md:p-8 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
                Taageero Diyaar Ah
              </span>
            </div>
            <h2 className="text-base sm:text-xl font-extrabold text-gray-900 tracking-tight">
              Caawimaad Ma U Baahan Tahay?
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Haddii aad qabto wax su'aalo ah ama aad caawimaad uga baahan tahay dalabkaaga, fadlan toos nala soo xiriir.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            {/* WhatsApp Contact Button */}
            <a
              href="https://wa.me/252615482390"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-semibold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Nala Soo Xiriir WhatsApp</span>
            </a>

            {/* Direct Phone Call Button */}
            <a
              href="tel:+252615482390"
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 font-semibold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <Phone className="w-4 h-4 text-blue-600" />
              <span>061 5482390</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};
