import React, { useState, useEffect, useMemo } from 'react';
import { GamePackage, GameType, Order, PaymentMethod, PublicOrderSummary } from './types';
import {
  getPackages,
  getPaymentMethods,
  trackPageView,
  trackCheckoutStart,
} from './services/storage';
import { useLanguage } from './services/language.tsx';
import { Header } from './components/Header';
import { HeroBanner } from './components/HeroBanner';
import { GameSwitcher } from './components/GameSwitcher';
import { HomeStorefrontSections } from './components/HomeStorefrontSections';
import { GamePackagePage } from './components/GamePackagePage';
import { PubgCheckoutPage } from './components/PubgCheckoutPage';
import { MyOrdersPage } from './components/MyOrdersPage';
import { PackageCard } from './components/PackageCard';
import { BottomNav } from './components/BottomNav';
import { OrderTrackingModal } from './components/OrderTrackingModal';
import { CustomerAuthModal } from './components/CustomerAuthModal';
import { AdminDashboard } from './components/AdminDashboard';
import { Footer } from './components/Footer';
import { Search, ArrowLeft } from 'lucide-react';

export default function App() {
  const { language, t } = useLanguage();
  const [packages, setPackages] = useState<GamePackage[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  // Path-based routing state
  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Selected package passed to checkout flow
  const [activePackage, setActivePackage] = useState<GamePackage | undefined>(undefined);
  const [trackingOrderId, setTrackingOrderId] = useState<string | undefined>(undefined);
  const [resumingOrder, setResumingOrder] = useState<Order | null>(null);

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

  // Lock future games: redirect any legacy or direct url attempts for other games to home
  useEffect(() => {
    const norm = currentPath.toLowerCase();
    if (
      norm.includes('/efootball') ||
      norm.includes('/free-fire') ||
      norm.includes('/cod') ||
      norm.includes('/call-of-duty')
    ) {
      navigate('/');
    }
  }, [currentPath]);

  // Determine if a dedicated game catalogue page is active (PUBG Mobile ONLY)
  const currentGamePage: GameType | null = useMemo(() => {
    const normalized = currentPath.toLowerCase();
    if (
      normalized.includes('/games/pubg-mobile') ||
      normalized === '/pubg-mobile' ||
      normalized === '/pubg'
    ) {
      return 'PUBG Mobile';
    }
    return null;
  }, [currentPath]);

  // Determine if a dedicated checkout page is active (PUBG Mobile ONLY)
  const currentCheckoutGame: GameType | null = useMemo(() => {
    const normalized = currentPath.toLowerCase();
    if (
      normalized.includes('/checkout/pubg-mobile') ||
      normalized.includes('/checkout/pubg')
    ) {
      return 'PUBG Mobile';
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
    if (currentCheckoutGame === 'PUBG Mobile' && packages.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const pkgId = params.get('package');
      if (pkgId) {
        const found = packages.find((p) => p.id === pkgId && p.game === 'PUBG Mobile' && p.active);
        if (found) {
          setActivePackage(found);
          return;
        }
      }
      if (!activePackage || activePackage.game !== 'PUBG Mobile') {
        const defaultPkg = packages.find((p) => p.game === 'PUBG Mobile' && p.active);
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

  // Handle clicking a package: NAVIGATE TO FULL CHECKOUT PAGE (PUBG ONLY)
  const handleSelectPackage = (pkg: GamePackage) => {
    if (pkg.game !== 'PUBG Mobile') {
      return;
    }
    trackCheckoutStart();
    setActivePackage(pkg);
    navigate(`/checkout/pubg-mobile?package=${pkg.id}`);
  };

  // Navigate to dedicated game page or home
  const handleOpenGamePage = (game: 'All' | GameType) => {
    if (game === 'PUBG Mobile') {
      navigate('/games/pubg-mobile');
    } else {
      navigate('/');
    }
  };

  const handleOrderCreatedOrUpdated = (order: Order) => {
    setTrackingOrderId(order.id);
  };

  // Resume unpaid or interrupted order
  const handleResumeOrder = async (orderSummary: PublicOrderSummary) => {
    try {
      const res = await fetch(`/api/orders/${orderSummary.id}`);
      let fullOrder = orderSummary as unknown as Order;
      if (res.ok) {
        const data = await res.json();
        if (data.order) fullOrder = data.order;
      }
      setResumingOrder(fullOrder);
      const matchedPkg =
        packages.find((p) => fullOrder.packageId && p.id === fullOrder.packageId) ||
        packages.find((p) => p.credits === fullOrder.packageCredits) ||
        packages.find((p) => p.game === 'PUBG Mobile' && p.active) ||
        packages[0];

      setActivePackage(matchedPkg);
      navigate(`/checkout/pubg-mobile?order=${fullOrder.id}`);
    } catch {
      navigate('/checkout/pubg-mobile');
    }
  };

  // Search filtered packages (Filter only active PUBG packages for purchasing)
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
    if (activePackage && activePackage.game === 'PUBG Mobile') return activePackage;
    if (currentCheckoutGame === 'PUBG Mobile') {
      return packages.find((p) => p.game === 'PUBG Mobile' && p.active);
    }
    return undefined;
  }, [activePackage, currentCheckoutGame, packages]);

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col font-sans overflow-x-hidden w-full">
      {/* 1. Header (Red & White Theme with Language Switcher) */}
      <Header
        onSearch={setSearchQuery}
        searchQuery={searchQuery}
        onOpenTracking={() => {
          navigate('/orders');
        }}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onSelectGame={(game) => {
          if (game === 'PUBG Mobile') {
            navigate('/games/pubg-mobile');
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
                  title={language === 'so' ? 'Dib ugu noqo' : 'Go back'}
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-1.5">
                    <Search className="w-4 h-4 text-red-600" />
                    <span>{t('searchResult', 'Natiijada Raadinta')}: "{searchQuery}"</span>
                  </h2>
                  <p className="text-xs text-gray-500">
                    {language === 'so'
                      ? `Waxaa la helay ${searchResults.length} xirmo`
                      : `Found ${searchResults.length} packages`}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                {t('clearSearch', 'Tir Raadinta')}
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
                <h3 className="text-sm font-bold text-gray-900">
                  {language === 'so' ? 'Lama helin xirmo ku habboon' : 'No matching packages found'}
                </h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  {language === 'so'
                    ? 'Fadlan hubi xarfaha aad qortay ama raadi xirmooyinka "UC".'
                    : 'Please check your search spelling or search for "UC" packages.'}
                </p>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold cursor-pointer shadow-xs"
                >
                  {language === 'so' ? 'Dib ugu Noqo' : 'Clear Search'}
                </button>
              </div>
            )}
          </section>
        ) : currentCheckoutGame === 'PUBG Mobile' && checkoutPackage ? (
          /* DEDICATED FULL-PAGE CHECKOUT: PUBG Mobile (/checkout/pubg-mobile) */
          <PubgCheckoutPage
            packageItem={checkoutPackage}
            paymentMethods={paymentMethods}
            onBack={() => {
              setResumingOrder(null);
              navigate('/games/pubg-mobile');
            }}
            onOrderCreated={(order) => {
              setResumingOrder(null);
              handleOrderCreatedOrUpdated(order);
            }}
            onViewOrders={() => {
              setResumingOrder(null);
              navigate('/orders');
            }}
            resumeOrder={resumingOrder}
          />
        ) : isOrdersPage ? (
          /* DEDICATED CUSTOMER MY ORDERS PAGE (/orders) */
          <MyOrdersPage
            onBack={() => {
              setResumingOrder(null);
              navigate('/');
            }}
            onSelectGame={(game) => {
              setResumingOrder(null);
              if (game === 'PUBG Mobile') navigate('/games/pubg-mobile');
              else navigate('/');
            }}
            onResumeOrder={handleResumeOrder}
          />
        ) : currentGamePage === 'PUBG Mobile' ? (
          /* Dedicated Game Package Page Mode (/games/pubg-mobile) */
          <GamePackagePage
            game={currentGamePage}
            packages={packages}
            onBack={() => navigate('/')}
            onSelectPackage={handleSelectPackage}
          />
        ) : (
          /* Standard Homepage Storefront Landing Mode */
          <>
            {/* 2. Promotional Carousel (Red & White Theme) */}
            <HeroBanner
              onOpenQuickTopUp={handleOpenGamePage}
              optionalAdvertisement={null}
            />

            {/* 3. Prominent Game Selection (4 Games with Small Status Badges & Locked Future Games) */}
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

      {/* Footer */}
      <Footer
        onOpenTracking={() => {
          navigate('/orders');
        }}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onSelectGame={(game) => {
          handleOpenGamePage(game);
        }}
      />

      {/* 5. Fixed Bottom Navigation on Mobile (Red Active Accent) */}
      <BottomNav
        currentPath={currentPath}
        onOpenTracking={() => {
          navigate('/orders');
        }}
        onOpenAuth={() => setIsAuthModalOpen(true)}
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

      {/* Customer Account & PEP Rewards Modal */}
      <CustomerAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onNavigateToOrders={() => {
          setIsAuthModalOpen(false);
          navigate('/orders');
        }}
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
