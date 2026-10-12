import React, { useState, useEffect, useMemo } from 'react';
import { GamePackage, GameType, Order, PaymentMethod } from './types';
import {
  getPackages,
  getPaymentMethods,
  trackPageView,
  trackCheckoutStart,
} from './services/storage';
import { Header } from './components/Header';
import { HeroBanner } from './components/HeroBanner';
import { GameSwitcher } from './components/GameSwitcher';
import { HomeStorefrontSections } from './components/HomeStorefrontSections';
import { GamePackagePage } from './components/GamePackagePage';
import { PubgCheckoutPage } from './components/PubgCheckoutPage';
import { EfootballCheckoutPage } from './components/EfootballCheckoutPage';
import { MyOrdersPage } from './components/MyOrdersPage';
import { PackageCard } from './components/PackageCard';
import { BottomNav } from './components/BottomNav';
import { OrderTrackingModal } from './components/OrderTrackingModal';
import { AdminDashboard } from './components/AdminDashboard';
import { Footer } from './components/Footer';
import { Search, ArrowLeft } from 'lucide-react';

export default function App() {
  const [packages, setPackages] = useState<GamePackage[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  // Path-based routing state
  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Selected package passed to checkout flow
  const [activePackage, setActivePackage] = useState<GamePackage | undefined>(undefined);
  const [trackingOrderId, setTrackingOrderId] = useState<string | undefined>(undefined);

  // Load and subscribe to storage changes
  const refreshData = () => {
    setPackages(getPackages());
    setPaymentMethods(getPaymentMethods());
  };

  // Browser back/forward navigation support
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Programmatic full-page navigation
  const navigate = (path: string) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    setCurrentPath(path);
    setSearchQuery('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Determine if a dedicated game catalogue page is active
  const currentGamePage: GameType | null = useMemo(() => {
    const normalized = currentPath.toLowerCase();
    if (normalized.includes('/games/pubg-mobile') || normalized === '/pubg-mobile' || normalized === '/pubg') {
      return 'PUBG Mobile';
    }
    if (normalized.includes('/games/efootball') || normalized === '/efootball') {
      return 'eFootball';
    }
    return null;
  }, [currentPath]);

  // Determine if a dedicated checkout page is active
  const currentCheckoutGame: GameType | null = useMemo(() => {
    const normalized = currentPath.toLowerCase();
    if (normalized.includes('/checkout/pubg-mobile') || normalized.includes('/checkout/pubg')) {
      return 'PUBG Mobile';
    }
    if (normalized.includes('/checkout/efootball')) {
      return 'eFootball';
    }
    return null;
  }, [currentPath]);

  // Determine if Customer My Orders page is active
  const isOrdersPage: boolean = useMemo(() => {
    const normalized = currentPath.toLowerCase();
    return (
      normalized.includes('/orders') ||
      normalized.includes('/my-orders') ||
      normalized === '/dalabyada'
    );
  }, [currentPath]);

  // Sync active package from URL parameters or defaults
  useEffect(() => {
    if (currentCheckoutGame && packages.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const pkgId = params.get('package');
      if (pkgId) {
        const found = packages.find((p) => p.id === pkgId && p.game === currentCheckoutGame && p.active);
        if (found) {
          setActivePackage(found);
          return;
        }
      }
      if (!activePackage || activePackage.game !== currentCheckoutGame) {
        const defaultPkg = packages.find((p) => p.game === currentCheckoutGame && p.active);
        if (defaultPkg) setActivePackage(defaultPkg);
      }
    }
  }, [currentPath, currentCheckoutGame, packages]);

  useEffect(() => {
    refreshData();
    trackPageView(currentPath, currentCheckoutGame || currentGamePage || undefined);

    const handleStorageUpdate = () => {
      refreshData();
    };

    window.addEventListener('somtopup_storage_update', handleStorageUpdate);
    return () => {
      window.removeEventListener('somtopup_storage_update', handleStorageUpdate);
    };
  }, [currentPath, currentGamePage, currentCheckoutGame]);

  // Handle clicking a package: NAVIGATE TO FULL CHECKOUT PAGE
  const handleSelectPackage = (pkg: GamePackage) => {
    trackCheckoutStart();
    setActivePackage(pkg);

    if (pkg.game === 'PUBG Mobile') {
      navigate(`/checkout/pubg-mobile?package=${pkg.id}`);
    } else if (pkg.game === 'eFootball') {
      navigate(`/checkout/efootball?package=${pkg.id}`);
    } else {
      console.error('Lama yaqaanno ciyaarta xirmadan:', pkg);
    }
  };

  // Navigate to dedicated full game page
  const handleOpenGamePage = (game: 'All' | GameType) => {
    if (game === 'PUBG Mobile') {
      navigate('/games/pubg-mobile');
    } else if (game === 'eFootball') {
      navigate('/games/efootball');
    } else {
      navigate('/');
    }
  };

  const handleOrderCreatedOrUpdated = (order: Order) => {
    setTrackingOrderId(order.id);
  };

  // Search filtered packages
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return packages.filter((p) => {
      if (!p.active) return false;
      const matchName = p.name.toLowerCase().includes(query);
      const matchCredits = p.credits.toLowerCase().includes(query);
      const matchGame = p.game.toLowerCase().includes(query);
      const matchDesc = p.description.toLowerCase().includes(query);
      return matchName || matchCredits || matchGame || matchDesc;
    });
  }, [packages, searchQuery]);

  // Resolved checkout package
  const checkoutPackage = useMemo(() => {
    if (activePackage) return activePackage;
    if (currentCheckoutGame) {
      return packages.find((p) => p.game === currentCheckoutGame && p.active);
    }
    return undefined;
  }, [activePackage, currentCheckoutGame, packages]);

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col font-sans overflow-x-hidden w-full">
      {/* 1. Header (Compact, natural Somali navigation) */}
      <Header
        onSearch={setSearchQuery}
        searchQuery={searchQuery}
        onOpenTracking={() => {
          navigate('/orders');
        }}
        onSelectGame={(game) => {
          if (game === 'PUBG Mobile') {
            navigate('/games/pubg-mobile');
          } else if (game === 'eFootball') {
            navigate('/games/efootball');
          } else {
            navigate('/');
          }
        }}
        selectedGame={isOrdersPage ? 'All' : (currentCheckoutGame || currentGamePage || 'All')}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-6 sm:space-y-8 pb-24 md:pb-8">
        {/* Search Results Mode */}
        {searchQuery.trim() ? (
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 cursor-pointer"
                  title="Dib ugu noqo"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-1.5">
                    <Search className="w-4 h-4 text-blue-600" />
                    <span>Natiijada Raadinta: "{searchQuery}"</span>
                  </h2>
                  <p className="text-xs text-gray-500">
                    Waxaa la helay {searchResults.length} xirmo
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Tir Raadinta
              </button>
            </div>

            {searchResults.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4">
                {searchResults.map((pkg) => (
                  <PackageCard key={pkg.id} pkg={pkg} onSelect={handleSelectPackage} />
                ))}
              </div>
            ) : (
              <div className="p-8 text-center rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
                <Search className="w-8 h-8 text-gray-400 mx-auto" />
                <h3 className="text-sm font-bold text-gray-900">Lama helin xirmo ku habboon</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  Fadlan hubi xarfaha aad qortay ama raadi xirmooyinka "UC" ama "Coins".
                </p>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer shadow-xs"
                >
                  Dib ugu Noqo
                </button>
              </div>
            )}
          </section>
        ) : currentCheckoutGame === 'PUBG Mobile' && checkoutPackage ? (
          /* DEDICATED FULL-PAGE CHECKOUT: PUBG Mobile (/checkout/pubg-mobile) */
          <PubgCheckoutPage
            packageItem={checkoutPackage}
            paymentMethods={paymentMethods}
            onBack={() => navigate('/games/pubg-mobile')}
            onOrderCreated={handleOrderCreatedOrUpdated}
            onViewOrders={() => navigate('/orders')}
          />
        ) : currentCheckoutGame === 'eFootball' && checkoutPackage ? (
          /* DEDICATED FULL-PAGE CHECKOUT: eFootball (/checkout/efootball) */
          <EfootballCheckoutPage
            packageItem={checkoutPackage}
            paymentMethods={paymentMethods}
            onBack={() => navigate('/games/efootball')}
            onOrderCreated={handleOrderCreatedOrUpdated}
            onViewOrders={() => navigate('/orders')}
          />
        ) : isOrdersPage ? (
          /* DEDICATED CUSTOMER MY ORDERS PAGE (/orders) */
          <MyOrdersPage
            onBack={() => navigate('/')}
            onSelectGame={(game) => {
              if (game === 'PUBG Mobile') navigate('/games/pubg-mobile');
              else if (game === 'eFootball') navigate('/games/efootball');
              else navigate('/');
            }}
          />
        ) : currentGamePage ? (
          /* Dedicated Game Package Page Mode (/games/pubg-mobile or /games/efootball) */
          <GamePackagePage
            game={currentGamePage}
            packages={packages}
            onBack={() => navigate('/')}
            onSelectPackage={handleSelectPackage}
          />
        ) : (
          /* Standard Homepage Storefront Landing Mode */
          <>
            {/* 2. Promotional Carousel (Compact, PUBG Mobile & eFootball slides) */}
            <HeroBanner
              onOpenQuickTopUp={handleOpenGamePage}
              optionalAdvertisement={null}
            />

            {/* 3. Prominent Game Selection (Exactly TWO large cards side-by-side) */}
            <GameSwitcher
              selectedGame={currentGamePage || 'All'}
              onSelectGame={handleOpenGamePage}
              onOpenGameCheckout={handleOpenGamePage}
            />

            {/* 4. Storefront Sections:
                 Section A: Maxaa SomTopUp Loo Doortaa? (Why Choose SomTopUp - 3 benefits)
                 Section B: Sida Loo Shubto (How It Works - 3 steps)
                 Section C: Caawimaad Ma U Baahan Tahay? (Contact Support - WhatsApp & Phone) */}
            <HomeStorefrontSections
              onSelectGame={handleOpenGamePage}
              onOpenTracking={() => {
                navigate('/orders');
              }}
            />
          </>
        )}
      </main>

      {/* Section D: Compact Footer */}
      <Footer
        onOpenTracking={() => {
          navigate('/orders');
        }}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onSelectGame={(game) => {
          handleOpenGamePage(game);
        }}
      />

      {/* 5. Fixed Bottom Navigation on Mobile (Hoy, Ciyaaraha, Dalabyada, Akoon, Wax badan) */}
      <BottomNav
        currentPath={currentPath}
        onOpenTracking={() => {
          navigate('/orders');
        }}
        onSelectGame={(game) => {
          if (game === 'All') {
            navigate('/');
          } else {
            handleOpenGamePage(game);
          }
        }}
      />

      {/* Customer Order Tracking Modal */}
      <OrderTrackingModal
        isOpen={isTrackingModalOpen}
        onClose={() => {
          setIsTrackingModalOpen(false);
          setTrackingOrderId(undefined);
        }}
        defaultOrderId={trackingOrderId}
      />

      {/* Admin Dashboard */}
      <AdminDashboard
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        onDataChanged={refreshData}
      />
    </div>
  );
}
