import React, { useState, useEffect, useRef } from 'react';
import { GameType } from '../types';
import pubgBanner from '../assets/images/banner_pubg_special_1791667447343.jpg';
import efbImage from '../assets/images/game_efootball_coins_1791667436245.jpg';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../services/language.tsx';

export interface AdvertisementSlide {
  id: string;
  title: string;
  description: string;
  image: string;
  actionText?: string;
  targetGame?: GameType;
  active: boolean;
}

interface HeroBannerProps {
  onOpenQuickTopUp: (game: GameType) => void;
  optionalAdvertisement?: AdvertisementSlide | null;
}

interface CarouselSlide {
  id: string;
  game: GameType;
  titleSo: string;
  titleEn: string;
  descriptionSo: string;
  descriptionEn: string;
  image: string;
  badgeSo: string;
  badgeEn: string;
  actionTextSo: string;
  actionTextEn: string;
  isAvailable: boolean;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  onOpenQuickTopUp,
}) => {
  const { language, t } = useLanguage();

  const slides: CarouselSlide[] = [
    {
      id: 'slide-pubg',
      game: 'PUBG Mobile',
      titleSo: 'PUBG Mobile UC Top-Up',
      titleEn: 'PUBG Mobile UC Top-Up',
      descriptionSo: 'Ku shubo Unknown Cash (UC) degdeg ah adoo isticmaalaya Player ID.',
      descriptionEn: 'Instant Unknown Cash (UC) delivery with your Player ID and nickname.',
      image: pubgBanner,
      badgeSo: 'DIYAAR • PUBG Mobile',
      badgeEn: 'AVAILABLE • PUBG Mobile',
      actionTextSo: 'Shubo UC Hadda',
      actionTextEn: 'Top Up UC Now',
      isAvailable: true,
    },
    {
      id: 'slide-efootball',
      game: 'eFootball',
      titleSo: 'Ciyaaraha Cusub Ee Soo Socda',
      titleEn: 'Upcoming Games Coming Soon',
      descriptionSo: 'eFootball Coins, Free Fire Diamonds & Call of Duty CP dhawaan ayay diyaar noqon doonaan.',
      descriptionEn: 'eFootball Coins, Free Fire Diamonds & Call of Duty CP are launching soon.',
      image: efbImage,
      badgeSo: 'DHAWAAN • SOO SOCDA',
      badgeEn: 'COMING SOON • UPCOMING',
      actionTextSo: 'Diyaarso Koontada',
      actionTextEn: 'Coming Soon',
      isAvailable: false,
    },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  useEffect(() => {
    if (isPaused || slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [isPaused, slides.length]);

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    setIsPaused(false);
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 45) goToNext();
    else if (diff < -45) goToPrev();
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const currentSlide = slides[currentIndex] || slides[0];

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl bg-white border border-gray-200 shadow-xs"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Slide Container */}
      <div className="relative min-h-[145px] sm:min-h-[165px] md:min-h-[185px] flex items-center">
        {/* Background Artwork */}
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={currentSlide.image}
            alt={language === 'so' ? currentSlide.titleSo : currentSlide.titleEn}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center transition-opacity duration-500 opacity-90"
          />
          {/* Light Scrim for crisp text contrast */}
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 to-white/40 sm:to-transparent" />
        </div>

        {/* Content Overlay */}
        <div className="relative z-10 max-w-xs sm:max-w-md p-3.5 sm:p-5 md:p-6 space-y-1.5 sm:space-y-2">
          <span className="inline-block text-[10px] sm:text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md">
            {language === 'so' ? currentSlide.badgeSo : currentSlide.badgeEn}
          </span>

          <h2 className="text-sm sm:text-lg md:text-xl font-extrabold text-gray-900 tracking-tight leading-tight">
            {language === 'so' ? currentSlide.titleSo : currentSlide.titleEn}
          </h2>

          <p className="text-[11px] sm:text-xs text-gray-600 line-clamp-2 leading-relaxed">
            {language === 'so' ? currentSlide.descriptionSo : currentSlide.descriptionEn}
          </p>

          <div className="pt-1">
            {currentSlide.isAvailable ? (
              <button
                type="button"
                onClick={() => onOpenQuickTopUp('PUBG Mobile')}
                className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-xs tracking-wide transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-98"
              >
                <span>{language === 'so' ? currentSlide.actionTextSo : currentSlide.actionTextEn}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onOpenQuickTopUp('PUBG Mobile')}
                className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs tracking-wide transition-colors flex items-center gap-1.5 cursor-pointer border border-gray-200"
              >
                <span>{language === 'so' ? 'Ku shubo PUBG Mobile' : 'Top Up PUBG Mobile'}</span>
                <ArrowRight className="w-3.5 h-3.5 text-red-600" />
              </button>
            )}
          </div>
        </div>

        {/* Chevrons on desktop */}
        {slides.length > 1 && (
          <div className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 gap-1 z-20">
            <button
              type="button"
              onClick={goToPrev}
              className="p-1.5 rounded-full bg-white/90 hover:bg-white text-gray-700 border border-gray-200 shadow-xs transition-colors cursor-pointer"
              aria-label="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={goToNext}
              className="p-1.5 rounded-full bg-white/90 hover:bg-white text-gray-700 border border-gray-200 shadow-xs transition-colors cursor-pointer"
              aria-label="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Pagination Dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-2.5 right-4 flex items-center gap-1.5 z-20">
          {slides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                currentIndex === idx ? 'w-5 bg-red-600' : 'w-1.5 bg-gray-300'
              }`}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
