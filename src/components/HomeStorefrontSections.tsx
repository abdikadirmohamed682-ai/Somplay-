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
} from 'lucide-react';
import { GameType } from '../types';
import { useLanguage } from '../services/language.tsx';

interface HomeStorefrontSectionsProps {
  onSelectGame: (game: GameType) => void;
  onOpenTracking: () => void;
}

export const HomeStorefrontSections: React.FC<HomeStorefrontSectionsProps> = ({
  onSelectGame,
  onOpenTracking,
}) => {
  const { language, t } = useLanguage();

  return (
    <div className="w-full space-y-8 sm:space-y-12 pt-2">
      {/* Section A: Maxaa SomTopUp Loo Doortaa? (Why Choose SomTopUp) */}
      <section className="w-full space-y-4">
        <div className="text-center sm:text-left space-y-1 px-1">
          <h2 className="text-base sm:text-xl font-extrabold text-gray-900 tracking-tight">
            {language === 'so' ? 'Maxaa SomTopUp Loo Doortaa?' : 'Why Choose SomTopUp?'}
          </h2>
          <p className="text-xs sm:text-sm text-gray-500">
            {language === 'so'
              ? 'Faa\'iidooyinka aad ka helayso shubashada ciyaaraha Soomaaliya'
              : 'Reliable, fast and transparent gaming top-ups for Somali gamers'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-5">
          {/* Benefit 1 */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 flex items-start gap-3.5 shadow-xs hover:border-red-200 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 shrink-0 mt-0.5">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-bold text-gray-900">
                {language === 'so' ? 'Dalab Fudud' : 'Simple Top-Up'}
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                {language === 'so'
                  ? 'Dooro PUBG Mobile oo ku shubo daqiiqado gudahood adoo isticmaalaya Player ID.'
                  : 'Choose PUBG Mobile and top up quickly using your official Player ID.'}
              </p>
            </div>
          </div>

          {/* Benefit 2 */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 flex items-start gap-3.5 shadow-xs hover:border-red-200 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 shrink-0 mt-0.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-bold text-gray-900">
                {language === 'so' ? 'Qiime Cad & Sugan' : 'Transparent Pricing'}
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                {language === 'so'
                  ? 'Dhammaan qiimayaasha xirmooyinka waa kuwo cad oo aan lahayn wax lacag qarsoon ah.'
                  : 'All package prices are transparent and verified with zero hidden charges.'}
              </p>
            </div>
          </div>

          {/* Benefit 3 */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 flex items-start gap-3.5 shadow-xs hover:border-red-200 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 shrink-0 mt-0.5">
              <Clock className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-bold text-gray-900">
                {language === 'so' ? 'La-socodka Xaaladda' : 'Order Tracking'}
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                {language === 'so'
                  ? 'Kala soco heerka uu marayo dalabkaaga wakhti kasta adigoo isticmaalaya Order ID.'
                  : 'Check and follow your live order status anytime using your unique Order ID.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section B: Sida Loo Shubto (How It Works) */}
      <section className="w-full space-y-4">
        <div className="text-center sm:text-left space-y-1 px-1">
          <h2 className="text-base sm:text-xl font-extrabold text-gray-900 tracking-tight">
            {language === 'so' ? 'Sida Loo Shubto' : 'How It Works'}
          </h2>
          <p className="text-xs sm:text-sm text-gray-500">
            {language === 'so'
              ? '3 tallaabo oo sahlan oo aad ku helayso UC'
              : '3 easy steps to complete your game top-up'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-5">
          {/* Step 1 */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 space-y-3 relative shadow-xs">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-red-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                1
              </div>
              <Gamepad2 className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-bold text-gray-900">
                {language === 'so' ? 'Dooro PUBG Mobile' : 'Select PUBG Mobile'}
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                {language === 'so'
                  ? 'Dooro xirmada UC ee kugu habboon oo u gudub tallaabada xigta.'
                  : 'Choose the UC package that fits your needs and proceed to checkout.'}
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 space-y-3 relative shadow-xs">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-red-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                2
              </div>
              <FileText className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-bold text-gray-900">
                {language === 'so' ? 'Geli Player ID & Nickname' : 'Enter Player ID & Nickname'}
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                {language === 'so'
                  ? 'Geli Player ID-gaaga PUBG Mobile iyo magacaaga ciyaarta.'
                  : 'Input your official PUBG Mobile Player ID and in-game nickname.'}
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 space-y-3 relative shadow-xs">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-red-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                3
              </div>
              <CreditCard className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-bold text-gray-900">
                {language === 'so' ? 'Bixi Lacagta & Hubi' : 'Payment & Confirmation'}
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                {language === 'so'
                  ? 'Ku bixi Hormuud EVC Plus ama Sahal, geli lambarkaaga, una dir hubin.'
                  : 'Pay with Hormuud EVC Plus or Sahal, submit sender phone, and track your order.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section C: Caawimaad Ma U Baahan Tahay? (Contact Support) */}
      <section className="w-full bg-red-50/50 border border-red-100 rounded-2xl p-5 sm:p-6 md:p-8 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[11px] font-bold text-red-700 uppercase tracking-wider">
                {language === 'so' ? 'Taageero Diyaar Ah' : 'Support Available'}
              </span>
            </div>
            <h2 className="text-base sm:text-xl font-extrabold text-gray-900 tracking-tight">
              {language === 'so' ? 'Caawimaad Ma U Baahan Tahay?' : 'Need Help With Your Order?'}
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              {language === 'so'
                ? 'Haddii aad qabto wax su\'aalo ah ama aad caawimaad uga baahan tahay dalabkaaga, toos nala soo xiriir.'
                : 'If you have any questions or need assistance with your order, contact our support team.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            {/* WhatsApp Contact */}
            <a
              href="https://wa.me/252615482390"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-semibold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp (+252 61 5482390)</span>
            </a>

            {/* Direct Phone Call */}
            <a
              href="tel:+252615482390"
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 font-semibold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <Phone className="w-4 h-4 text-red-600" />
              <span>061 5482390</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};
