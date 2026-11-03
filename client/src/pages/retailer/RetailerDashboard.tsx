import { useState } from 'react';
import {
  Plus,
  Percent,
  Check,
  Wallet,
  ArrowRight,
  Sparkles,
  Search,
  ShoppingCart,
  Clock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SampleProduct {
  id: string;
  name: string;
  brand: string;
  category: string;
  packSize: string;
  mrp: number;
  rate: number;
  stock: number;
  scheme?: string;
}

const SAMPLE_PRODUCTS: SampleProduct[] = [
  {
    id: 'p1',
    name: 'Parle-G Glucose Biscuit (80g x 72 Pack)',
    brand: 'Parle',
    category: 'Biscuits',
    packSize: '72 Packets / Box',
    mrp: 720,
    rate: 610,
    stock: 450,
    scheme: '10+1 FREE',
  },
  {
    id: 'p2',
    name: 'Britannia Good Day Butter (100g x 48 Pack)',
    brand: 'Britannia',
    category: 'Biscuits',
    packSize: '48 Packets / Box',
    mrp: 960,
    rate: 815,
    stock: 220,
  },
  {
    id: 'p3',
    name: 'Nestlé Maggi 2-Minute Noodles (70g x 96 Pack)',
    brand: 'Nestlé',
    category: 'Noodles',
    packSize: '96 Packets / Case',
    mrp: 1344,
    rate: 1150,
    stock: 310,
    scheme: '12+1 FREE',
  },
  {
    id: 'p4',
    name: 'Fortune Refined Soyabean Oil (1L x 12 Pack)',
    brand: 'Fortune',
    category: 'Edible Oils',
    packSize: '12 Pouches / Box',
    mrp: 1680,
    rate: 1475,
    stock: 140,
  },
  {
    id: 'p5',
    name: 'Surf Excel Easy Wash Powder (500g x 36 Pack)',
    brand: 'Hindustan Unilever',
    category: 'Laundry',
    packSize: '36 Packs / Box',
    mrp: 2340,
    rate: 1980,
    stock: 95,
    scheme: '5% OFF on 5+ Boxes',
  },
  {
    id: 'p6',
    name: 'Tata Salt Vacuum Evaporated (1kg x 24 Pack)',
    brand: 'Tata Consumer',
    category: 'Staples',
    packSize: '24 Bags / Case',
    mrp: 672,
    rate: 580,
    stock: 180,
  },
];

export const RetailerDashboard = () => {
  const { user } = useAuth();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [cartCount, setCartCount] = useState(3);
  const [addedItem, setAddedItem] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const retailer = user?.retailer || {
    shopName: 'Shri Ganesh Kirana Store',
    creditLimit: 75000,
    outstandingBalance: 14200,
    city: 'Jabalpur',
  };

  const availableCredit = retailer.creditLimit - retailer.outstandingBalance;
  const creditPercent = Math.round((retailer.outstandingBalance / retailer.creditLimit) * 100);

  const handleAdd = (id: string) => {
    const qty = quantities[id] || 1;
    setCartCount((prev) => prev + qty);
    setAddedItem(id);
    setTimeout(() => setAddedItem(null), 1500);
  };

  const filtered = SAMPLE_PRODUCTS.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.brand.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner: Retailer Welcome & Credit Khata Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Welcome & Shop Info */}
        <div className="lg:col-span-7 bg-white dark:bg-[#16181E] rounded-2xl p-5 border border-slate-200/80 dark:border-[#222631] shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/20">
                Verified Retailer
              </span>
              <span className="text-xs text-slate-400">Jabalpur Beat #4</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {retailer.shopName}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Owner: {user?.name} &bull; Sarafa Chowk, Lordganj, Jabalpur
            </p>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-[#222631] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <Clock className="h-4 w-4 text-emerald-500" />
              <span>Next Delivery: <strong>Tomorrow Morning (9:30 AM)</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-emerald-500 to-teal-400 text-white shadow-sm flex items-center gap-1.5 hover:opacity-95 transition-all">
                <ShoppingCart className="h-3.5 w-3.5" />
                <span>View Cart ({cartCount})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Khata / Credit Limit Widget (Matching the sleek mockup cards) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#16181E] rounded-2xl p-5 border border-slate-200/80 dark:border-[#222631] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-sm">
                <Wallet className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400">Distributor Credit Khata</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">
                  ₹{availableCredit.toLocaleString('en-IN')}{' '}
                  <span className="text-xs font-normal text-slate-400">Available</span>
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              Good Standing
            </span>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Outstanding: ₹{retailer.outstandingBalance.toLocaleString('en-IN')}</span>
              <span>Limit: ₹{retailer.creditLimit.toLocaleString('en-IN')}</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-[#202530] overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(creditPercent, 100)}%` }}
              />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#222631] flex items-center justify-between text-[11px] text-slate-400">
            <span>Payment Due Date: 10th of every month</span>
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
              Paste your handwritten list or WhatsApp message in Hindi or English (e.g. "Parle G 10 peti, Maggi 5 case").
            </p>
          </div>
        </div>

        <button className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-emerald-500 to-teal-400 text-white shadow-[0_4px_14px_rgba(16,185,129,0.35)] flex items-center gap-2 hover:opacity-95 transition-all flex-shrink-0">
          <span>Open AI Order Pad</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Product Catalogue Section */}
      <div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              FMCG Product Catalogue
            </h2>
            <p className="text-xs text-slate-400">
              Personalized distributor wholesale rates & active schemes for your shop
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search biscuits, oil, soaps..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-[#16181E] border border-slate-200/80 dark:border-[#222631] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
            />
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((product) => {
            const isJustAdded = addedItem === product.id;
            const currentQty = quantities[product.id] || 1;

            return (
              <div
                key={product.id}
                className="bg-white dark:bg-[#16181E] rounded-2xl p-4 border border-slate-200/80 dark:border-[#222631] hover:border-emerald-500/50 transition-all shadow-sm flex flex-col justify-between"
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-400 bg-slate-100 dark:bg-[#202530] px-2 py-0.5 rounded-md">
                      {product.brand}
                    </span>
                    {product.scheme && (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-500/20 flex items-center gap-1">
                        <Percent className="h-3 w-3" />
                        {product.scheme}
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                    {product.name}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1">{product.packSize}</p>

                  {/* Pricing Box */}
                  <div className="mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-[#1C2028] flex items-baseline justify-between">
                    <div>
                      <span className="text-xs text-slate-400">Wholesale Rate:</span>
                      <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                        ₹{product.rate}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-slate-400">MRP:</span>
                      <p className="text-xs line-through text-slate-400">₹{product.mrp}</p>
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#222631] flex items-center justify-between gap-2">
                  <div className="flex items-center border border-slate-200 dark:border-[#262B35] rounded-lg overflow-hidden bg-white dark:bg-[#16181E]">
                    <button
                      onClick={() =>
                        setQuantities((prev) => ({
                          ...prev,
                          [product.id]: Math.max(1, (prev[product.id] || 1) - 1),
                        }))
                      }
                      className="px-2 py-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-[#202530]"
                    >
                      -
                    </button>
                    <span className="px-2 text-xs font-semibold text-slate-900 dark:text-white">
                      {currentQty}
                    </span>
                    <button
                      onClick={() =>
                        setQuantities((prev) => ({
                          ...prev,
                          [product.id]: (prev[product.id] || 1) + 1,
                        }))
                      }
                      className="px-2 py-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-[#202530]"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => handleAdd(product.id)}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      isJustAdded
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gradient-to-r from-emerald-500 to-teal-400 text-white hover:opacity-95 shadow-[0_2px_8px_rgba(16,185,129,0.3)]'
                    }`}
                  >
                    {isJustAdded ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>Added!</span>
                      </>
                    ) : (
                      <>
                        <Plus className="h-3.5 w-3.5" />
                        <span>Add to Order</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
