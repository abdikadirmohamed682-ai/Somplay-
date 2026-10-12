import React, { useState, useEffect, useRef } from 'react';
import { GameType } from '../types';
import pubgBanner from '../assets/images/banner_pubg_special_1791667447343.jpg';
import efbImage from '../assets/images/game_efootball_coins_1791667436245.jpg';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

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
  title: string;
  description: string;
  image: string;
  badge: string;
  actionText: string;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  onOpenQuickTopUp,
  optionalAdvertisement,
}) => {
  // Configured slides: Slide 1: PUBG Mobile, Slide 2: eFootball, Slide 3: Optional Ad (if active)
  const slides: CarouselSlide[] = [
    {
      id: 'slide-pubg',
      game: 'PUBG Mobile',
      title: 'PUBG Mobile UC Top-Up',
      description: 'Ku shubo Unknown Cash (UC) degdeg ah adoo isticmaalaya Player ID.',
      image: pubgBanner,
      badge: 'PUBG Mobile',
      actionText: 'Shubo UC',
    },
    {
      id: 'slide-efootball',
      game: 'eFootball',
      title: 'eFootball Coins Top-Up',
      description: 'Ku shubo Coins koontadaada eFootball oo fur ciyaartooyda halyeeyada ah.',
      image: efbImage,
      badge: 'eFootball',
      actionText: 'Shubo Coins',
    },
  ];

  // Include optional advertisement slot ONLY if valid and active
  if (optionalAdvertisement && optionalAdvertisement.active && optionalAdvertisement.image) {
    slides.push({
      id: optionalAdvertisement.id || 'slide-ad',
      game: optionalAdvertisement.targetGame || 'PUBG Mobile',
      title: optionalAdvertisement.title,
      description: optionalAdvertisement.description,
      image: optionalAdvertisement.image,
      badge: 'Dalab Gaar ah',
      actionText: optionalAdvertisement.actionText || 'Eeg Dalabka',
    });
  }

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Automatic sliding interval (5 seconds), pauses on user interaction
  useEffect(() => {
    if (isPaused || slides.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [isPaused, slides.length]);

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  // Touch gesture handling for mobile swipe
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
    const threshold = 45; // Minimum swipe distance in px

    if (diff > threshold) {
      goToNext(); // Swiped left -> next slide
    } else if (diff < -threshold) {
      goToPrev(); // Swiped right -> prev slide
    }

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
      <div className="relative min-h-[140px] sm:min-h-[160px] md:min-h-[180px] flex items-center">
        {/* Background Artwork with Optical Light Scrim for WCAG AA readability */}
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={currentSlide.image}
            alt={currentSlide.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center transition-opacity duration-500 opacity-90"
          />
          {/* Light Scrim so dark text is readable on white/light theme */}
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-white/30 sm:to-transparent" />
        </div>

        {/* Text Content Overlay */}
        <div className="relative z-10 max-w-xs sm:max-w-md p-3.5 sm:p-5 md:p-6 space-y-1.5 sm:space-y-2">
          <span className="inline-block text-[10px] sm:text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md">
            {currentSlide.badge}
          </span>

          <h2 className="text-sm sm:text-lg md:text-xl font-extrabold text-gray-900 tracking-tight leading-tight">
            {currentSlide.title}
          </h2>

          <p className="text-[11px] sm:text-xs text-gray-600 line-clamp-2 leading-relaxed">
            {currentSlide.description}
          </p>

          <div className="pt-1">
            <button
              type="button"
              onClick={() => onOpenQuickTopUp(currentSlide.game)}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs tracking-wide transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-98"
            >
              <span>{currentSlide.actionText}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Quiet desktop chevron controls */}
        {slides.length > 1 && (
          <div className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 gap-1 z-20">
            <button
              type="button"
              onClick={goToPrev}
              className="p-1.5 rounded-full bg-white/80 hover:bg-white text-gray-700 border border-gray-200 shadow-xs transition-colors cursor-pointer"
              aria-label="Hore"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={goToNext}
              className="p-1.5 rounded-full bg-white/80 hover:bg-white text-gray-700 border border-gray-200 shadow-xs transition-colors cursor-pointer"
              aria-label="Xiga"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Subtle Pagination Dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-2.5 right-4 flex items-center gap-1.5 z-20">
          {slides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                currentIndex === idx ? 'w-5 bg-blue-600' : 'w-1.5 bg-gray-300'
              }`}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
