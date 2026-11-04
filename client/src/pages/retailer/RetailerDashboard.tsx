import { useState, useEffect } from 'react';
import {
  Wallet,
  Sparkles,
  ArrowRight,
  Clock,
  ShoppingBag,
  RefreshCw,
  TrendingUp,
  Store,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { Product, CategorySummary } from '../../types';
import { ProductService } from '../../services/productService';
import { RetailerService } from '../../services/retailerService';
import { ProductCard } from '../../components/catalogue/ProductCard';
import { ProductSearchAndFilter } from '../../components/catalogue/ProductSearchAndFilter';
import { CartSummaryBar } from '../../components/cart/CartSummaryBar';
import { AiOrderPadModal } from '../../components/orders/AiOrderPadModal';

export interface RetailerDashboardProps {
  currentTab?: string;
  setCurrentTab?: (tab: string) => void;
}

export const RetailerDashboard: React.FC<RetailerDashboardProps> = ({ currentTab, setCurrentTab }) => {
  const { user } = useAuth();
  const { totalItemsCount, setIsCartDrawerOpen } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAiOrderPadOpen, setIsAiOrderPadOpen] = useState(false);

  useEffect(() => {
    if (currentTab === 'ai-pad') {
      setIsAiOrderPadOpen(true);
    } else if (currentTab === 'cart') {
      setIsCartDrawerOpen(true);
    }
  }, [currentTab, setIsCartDrawerOpen]);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [inStockOnly, setInStockOnly] = useState(false);

  // Retailer Profile / Credit
  const [creditProfile, setCreditProfile] = useState<{
    shopName: string;
    creditLimit: number;
    outstandingBalance: number;
    availableCredit: number;
    creditUtilization: number;
    priceTier: 'STANDARD' | 'TIER_1' | 'TIER_2' | 'WHOLESALE';
    salesman?: { id?: string; name: string; phone: string } | null;
  }>({
    shopName: user?.retailer?.shopName || 'Shri Ganesh Kirana & General Store',
    creditLimit: user?.retailer?.creditLimit || 75000,
    outstandingBalance: user?.retailer?.outstandingBalance || 14200,
    availableCredit: (user?.retailer?.creditLimit || 75000) - (user?.retailer?.outstandingBalance || 14200),
    creditUtilization: 19,
    priceTier: user?.retailer?.priceTier || 'TIER_1',
    salesman: user?.retailer?.salesman || { name: 'Vikram Sharma', phone: '9893000002' },
  });

  // Load initial data
  const loadCatalogue = async () => {
    setLoading(true);
    try {
      const [fetchedProducts, fetchedCategories, profile] = await Promise.all([
        ProductService.getProducts({
          search: searchTerm,
          category: selectedCategory,
          inStockOnly,
          tier: creditProfile.priceTier,
        }),
        ProductService.getCategories(),
        RetailerService.getMyProfile(),
      ]);

      setProducts(fetchedProducts);
      setCategories(fetchedCategories);
      if (profile) {
        setCreditProfile((prev) => ({
          ...prev,
          ...profile,
        }));
      }
    } catch (err) {
      console.error('Error loading catalogue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalogue();
  }, [searchTerm, selectedCategory, inStockOnly, creditProfile.priceTier]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner: Retailer Welcome & Credit Khata Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Welcome & Shop Info */}
        <div className="lg:col-span-7 bg-white dark:bg-[#16181E] rounded-2xl p-5 border border-slate-200/80 dark:border-[#222631] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/20 flex items-center gap-1">
                <Store className="w-3 h-3" /> Verified FMCG Retailer
              </span>
              <span className="text-xs text-slate-400">Jabalpur Beat #4 &bull; {creditProfile.priceTier} Pricing</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {creditProfile.shopName}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Owner: {user?.name || 'Anil Patel'} &bull; Sarafa Chowk, Lordganj, Jabalpur
            </p>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-[#222631] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <Clock className="h-4 w-4 text-emerald-500" />
              <span>Next Delivery: <strong>Tomorrow Morning (9:30 AM)</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCartDrawerOpen(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <ShoppingBag className="h-3.5 w-3.5" />
                <span>View Cart ({totalItemsCount})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Khata / Credit Limit Widget */}
        <div className="lg:col-span-5 bg-white dark:bg-[#16181E] rounded-2xl p-5 border border-slate-200/80 dark:border-[#222631] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm">
                <Wallet className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400">Distributor Credit Khata</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">
                  ₹{creditProfile.availableCredit.toLocaleString('en-IN')}{' '}
                  <span className="text-xs font-normal text-slate-400">Available</span>
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              Tier: {creditProfile.priceTier}
            </span>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Outstanding: ₹{creditProfile.outstandingBalance.toLocaleString('en-IN')}</span>
              <span>Limit: ₹{creditProfile.creditLimit.toLocaleString('en-IN')}</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-[#202530] overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(
                    (creditProfile.outstandingBalance / creditProfile.creditLimit) * 100,
                    100
                  )}%`,
                }}
              />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#222631] flex items-center justify-between text-[11px] text-slate-400">
            <span>Salesman: {creditProfile.salesman?.name} ({creditProfile.salesman?.phone})</span>
            <span className="text-emerald-500 font-semibold cursor-pointer hover:underline">
              Ledger &rarr;
            </span>
          </div>
        </div>
      </div>

      {/* AI Smart Order Capture Quick Prompt */}
      <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent dark:from-emerald-950/40 dark:via-teal-950/20 dark:to-transparent rounded-2xl p-4 sm:p-5 border border-emerald-500/20 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-[0_4px_16px_rgba(16,185,129,0.35)] flex-shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              AI WhatsApp / Voice Order Capture
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Paste your handwritten list or WhatsApp message in Hindi or English (e.g. &ldquo;Parle G 10 peti, Maggi 5 case&rdquo;).
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsAiOrderPadOpen(true)}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md flex items-center gap-2 hover:opacity-95 transition-all flex-shrink-0 cursor-pointer"
        >
          <span>Open AI Order Pad</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Product Catalogue Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>FMCG Product Catalogue</span>
              <span className="text-xs font-normal text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Personalized Rates
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Showing official distributor wholesale rates & active promotional schemes for your shop
            </p>
          </div>

          <button
            type="button"
            onClick={loadCatalogue}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Refresh catalogue"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Search, Filter Pills & In-stock toggle */}
        <ProductSearchAndFilter
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          categories={categories}
          inStockOnly={inStockOnly}
          onInStockChange={setInStockOnly}
          totalProductsCount={products.length}
        />

        {/* Products Grid */}
        {loading && products.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-emerald-500" />
            <p className="text-sm font-medium">Loading FMCG catalogue...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20">
            <TrendingUp className="w-10 h-10 mx-auto text-slate-400 mb-2 stroke-1" />
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              No products found
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Try adjusting your search terms or selecting a different category.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>

      {/* Floating Bottom Cart Bar */}
      <CartSummaryBar />

      {/* Interactive AI Order Capture Pad */}
      <AiOrderPadModal
        isOpen={isAiOrderPadOpen}
        onClose={() => {
          setIsAiOrderPadOpen(false);
          if (currentTab === 'ai-pad' && setCurrentTab) {
            setCurrentTab('shop');
          }
        }}
      />
    </div>
  );
};
