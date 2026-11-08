import { useState, useEffect } from 'react';
import {
  CheckCircle,
  Clock,
  Plus,
  Wifi,
  WifiOff,
  Search,
  Store,
  ArrowRight,
  RefreshCw,
  Database,
  X,
  ShoppingBag,
  ShoppingCart,
  Send,
  TrendingUp,
  Target,
  Award,
  DollarSign,
  CheckCircle2,
  Percent,
  Package,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SyncService } from '../../offline/syncService';
import { OfflineOrderRecord } from '../../offline/db';
import { ProductService } from '../../services/productService';
import { RetailerService } from '../../services/retailerService';
import { Product, RetailerProfile, Scheme, SalesmanPerformanceRecord } from '../../types';
import { AnalyticsService } from '../../services/analyticsService';

interface BeatShop {
  id: string;
  name: string;
  owner: string;
  address: string;
  status: 'visited' | 'pending';
  lastOrder?: string;
  outstanding: number;
}

interface SalesmanDashboardProps {
  currentTab?: string;
  setCurrentTab?: (tab: string) => void;
}

export const SalesmanDashboard = ({
  currentTab = 'beat',
  setCurrentTab,
}: SalesmanDashboardProps) => {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState<boolean>(SyncService.isOnline());
  const [isSimulatedOffline, setIsSimulatedOffline] = useState(false);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [search, setSearch] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  // Beat Shops & Products cache (Dexie + Real DB)
  const [beatShops, setBeatShops] = useState<BeatShop[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingShops, setLoadingShops] = useState(true);

  // Modals
  const [showPunchModal, setShowPunchModal] = useState(false);
  const [selectedShop, setSelectedShop] = useState<BeatShop | null>(null);
  const [showQueueModal, setShowQueueModal] = useState(false);
  const [pendingOrders, setPendingOrders] = useState<OfflineOrderRecord[]>([]);

  // Task 7: Performance & Schemes state
  const [performanceData, setPerformanceData] = useState<SalesmanPerformanceRecord | null>(null);
  const [schemes, setSchemes] = useState<Scheme[]>([]);

  // Punch order state
  const [orderItems, setOrderItems] = useState<{ [productId: string]: number }>({});
  const [productSearch, setProductSearch] = useState('');
  const [orderNotes, setOrderNotes] = useState('');

  const mapRetailersToBeatShops = (retailers: RetailerProfile[]): BeatShop[] => {
    return retailers.map((r, idx) => ({
      id: r.id || `ret-${idx}`,
      name: r.shopName,
      owner: r.ownerName,
      address: r.address ? `${r.address}, ${r.city}` : `${r.city || 'Jabalpur'}`,
      status: idx === 0 ? 'visited' : 'pending',
      outstanding: r.outstandingBalance || 0,
      lastOrder:
        r.outstandingBalance > 0
          ? `₹${r.outstandingBalance.toLocaleString('en-IN')} (Khata)`
          : 'Cleared',
    }));
  };

  // Subscribe to offline sync updates
  useEffect(() => {
    const unsubscribe = SyncService.subscribe((count, online) => {
      setPendingCount(count);
      setIsOnline(online);
    });

    // Initial catalogue & retailer loading with Dexie IndexedDB caching
    const initData = async () => {
      setLoadingShops(true);
      try {
        const [prodList, retailerList] = await Promise.all([
          ProductService.getProducts(),
          RetailerService.getAllRetailers(),
        ]);

        setProducts(prodList);

        if (retailerList && retailerList.length > 0) {
          const shops = mapRetailersToBeatShops(retailerList);
          setBeatShops(shops);
          // Cache both into local Dexie IndexedDB for full offline resilience
          await SyncService.cacheCatalogueData(prodList, retailerList);
        }

        // Fetch salesman performance & schemes
        try {
          const [perfList, schemeList] = await Promise.all([
            AnalyticsService.getSalesmanPerformance(user?.id),
            ProductService.listSchemes(),
          ]);
          if (perfList && perfList.length > 0) {
            setPerformanceData(perfList[0]);
          }
          setSchemes(schemeList);
        } catch (e) {
          console.warn('Analytics or schemes error:', e);
        }
      } catch (err) {
        console.warn('Network offline or backend unreachable, loading from Dexie IndexedDB:', err);
        const [cachedProds, cachedRetailers] = await Promise.all([
          SyncService.getCachedProducts(),
          SyncService.getCachedRetailers(),
        ]);

        setProducts(cachedProds);
        if (cachedRetailers && cachedRetailers.length > 0) {
          setBeatShops(mapRetailersToBeatShops(cachedRetailers));
        }
      } finally {
        setLoadingShops(false);
      }
    };

    initData();

    return () => unsubscribe();
  }, []);

  const handleToggleOfflineMode = () => {
    const nextState = !isSimulatedOffline;
    setIsSimulatedOffline(nextState);
    SyncService.setSimulatedOffline(nextState);
    setIsOnline(!nextState);
  };

  const handleSyncNow = async () => {
    if (!isOnline) {
      alert('Cannot sync while in offline mode. Please switch back to online mode first.');
      return;
    }
    setIsSyncing(true);
    setSyncStatusMsg('Synchronizing pending orders to distributor hub...');
    try {
      const result = await SyncService.syncPendingOrders();
      setSyncStatusMsg(`Sync complete! ${result.synced} order(s) pushed, ${result.failed} failed.`);
      setTimeout(() => setSyncStatusMsg(null), 4000);
      const orders = await SyncService.getPendingOrders();
      setPendingOrders(orders);
    } catch (err: any) {
      setSyncStatusMsg(`Sync error: ${err?.message || 'Failed'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleOpenQueueModal = async () => {
    const orders = await SyncService.getPendingOrders();
    setPendingOrders(orders);
    setShowQueueModal(true);
  };

  const handleOpenPunchModal = (shop?: BeatShop) => {
    setSelectedShop(shop || beatShops[0] || null);
    setOrderItems({});
    setOrderNotes('');
    setShowPunchModal(true);
  };

  // Auto-open order punch pad when user navigates to Punch Order tab
  useEffect(() => {
    if (currentTab === 'punch' && beatShops.length > 0) {
      handleOpenPunchModal(selectedShop || beatShops[0]);
    }
  }, [currentTab, beatShops.length]);

  const handleQuantityChange = (productId: string, qty: number) => {
    if (qty <= 0) {
      const updated = { ...orderItems };
      delete updated[productId];
      setOrderItems(updated);
    } else {
      setOrderItems((prev) => ({ ...prev, [productId]: qty }));
    }
  };

  // Calculate order totals
  const selectedCartItems = Object.entries(orderItems).map(([pId, qty]) => {
    const product = products.find((p) => p.id === pId);
    const unitPrice = product ? product.pricing?.rate || product.basePrice : 0;
    const gstRate = product?.gstRate || 0;
    const subtotal = Math.round(unitPrice * qty * 100) / 100;
    const gstAmount = Math.round(((subtotal * gstRate) / 100) * 100) / 100;
    const totalPrice = Math.round((subtotal + gstAmount) * 100) / 100;

    // Check scheme
    let freeQuantity = 0;
    if (
      product?.scheme &&
      product.scheme.schemeType === 'BUY_X_GET_Y_FREE' &&
      qty >= product.scheme.minQuantity
    ) {
      const multiples = Math.floor(qty / product.scheme.minQuantity);
      freeQuantity = multiples * product.scheme.freeQuantity;
    }

    return {
      productId: pId,
      productName: product?.name || 'Item',
      skuCode: product?.skuCode || 'SKU',
      unit: product?.unit || 'UNIT',
      quantity: qty,
      unitPrice,
      gstRate,
      freeQuantity,
      subtotal,
      gstAmount,
      totalPrice,
    };
  });

  const cartSubtotal = selectedCartItems.reduce((acc, i) => acc + i.subtotal, 0);
  const cartGst = selectedCartItems.reduce((acc, i) => acc + i.gstAmount, 0);
  const cartTotal = selectedCartItems.reduce((acc, i) => acc + i.totalPrice, 0);

  const handleSubmitOrder = async () => {
    if (!selectedShop) return;
    if (selectedCartItems.length === 0) {
      alert('Please add at least 1 product to punch order.');
      return;
    }

    try {
      const offlineRecord = await SyncService.queueOfflineOrder({
        retailerId: selectedShop.id,
        retailerName: selectedShop.name,
        salesmanId: user?.id,
        items: selectedCartItems.map((i) => ({
          productId: i.productId,
          productName: i.productName,
          skuCode: i.skuCode,
          quantity: i.quantity,
          unit: i.unit,
          unitPrice: i.unitPrice,
          gstRate: i.gstRate,
          freeQuantity: i.freeQuantity,
          totalPrice: i.totalPrice,
        })),
        notes: orderNotes,
      });

      setShowPunchModal(false);
      setOrderItems({});

      if (isOnline) {
        setSyncStatusMsg(
          `Order for ${selectedShop.name} synced directly to Distributor Hub (Client ID: ${offlineRecord.clientOrderId})`
        );
      } else {
        setSyncStatusMsg(
          `Order saved offline in Dexie IndexedDB (Client ID: ${offlineRecord.clientOrderId}). It will auto-sync when online!`
        );
      }
      setTimeout(() => setSyncStatusMsg(null), 5000);
    } catch (err: any) {
      alert(`Failed to save order: ${err?.message}`);
    }
  };

  const visitedCount = beatShops.filter((s) => s.status === 'visited').length;
  const progressPercent =
    beatShops.length > 0 ? Math.round((visitedCount / beatShops.length) * 100) : 0;
  const totalOutstanding = beatShops.reduce((sum, s) => sum + s.outstanding, 0);

  const filteredShops = beatShops.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.owner.toLowerCase().includes(search.toLowerCase())
  );

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.skuCode.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.brand.toLowerCase().includes(productSearch.toLowerCase())
  );

  // ==========================================
  // TAB: BEAT PERFORMANCE & FIELD TARGETS (TASK 7)
  // ==========================================
  if (currentTab === 'performance') {
    const dailyTarget = performanceData?.dailyTargetGmv || 45000;
    const gmvToday = performanceData?.gmvToday || 38400;
    const targetAchieved = Math.round((gmvToday / dailyTarget) * 1000) / 10;
    const commissionEst = Math.round(gmvToday * 0.015);

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/20">
                Beat #4 Lordganj
              </span>
              <span className="text-xs text-slate-400">Jabalpur FMCG Sector</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
              Field Beat Targets & Incentive Meter
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Track daily sales quota realization, visit strike rates, and spot incentives
            </p>
          </div>

          {setCurrentTab && (
            <button
              onClick={() => setCurrentTab('beat')}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Store className="w-4 h-4" />
              <span>Punch Next Kirana</span>
            </button>
          )}
        </div>

        {/* 4 Performance Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-[#16181E] border border-slate-200/80 dark:border-[#222631] shadow-xs">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span className="font-semibold uppercase tracking-wider text-[10px]">
                Today's Target
              </span>
              <Target className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
              ₹{dailyTarget.toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Daily Beat Quota</p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#16181E] border border-slate-200/80 dark:border-[#222631] shadow-xs">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span className="font-semibold uppercase tracking-wider text-[10px]">
                Achieved Today
              </span>
              <DollarSign className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              ₹{gmvToday.toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
              {targetAchieved}% Realized
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#16181E] border border-slate-200/80 dark:border-[#222631] shadow-xs">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span className="font-semibold uppercase tracking-wider text-[10px]">
                Beat Strike Rate
              </span>
              <TrendingUp className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
              {visitedCount} / {beatShops.length || 18}
            </div>
            <p className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold mt-1">
              {progressPercent}% Shops Covered
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#16181E] border border-slate-200/80 dark:border-[#222631] shadow-xs">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span className="font-semibold uppercase tracking-wider text-[10px]">
                Est. Spot Commission
              </span>
              <Award className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
              ₹{commissionEst.toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-1">
              1.5% Spot Incentive
            </p>
          </div>
        </div>

        {/* Target Realization Progress Bar */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#16181E] border border-slate-200/80 dark:border-[#222631] shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-800 dark:text-slate-200">Daily Quota Realization:</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">
              ₹{gmvToday.toLocaleString('en-IN')} of ₹{dailyTarget.toLocaleString('en-IN')} (
              {targetAchieved}%)
            </span>
          </div>
          <div className="h-3 w-full bg-slate-100 dark:bg-[#222631] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(5, targetAchieved))}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400">
            {targetAchieved >= 100
              ? '🎉 Quota smashed! Eligible for 2.0% accelerated tier incentive today.'
              : `Punch ₹${Math.max(0, dailyTarget - gmvToday).toLocaleString('en-IN')} more to unlock your daily bonus.`}
          </p>
        </div>

        {/* Today's Route Kiranas Checklist */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#16181E] border border-slate-200/80 dark:border-[#222631] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Today's Beat Route Checklist
            </h3>
            <span className="text-xs text-slate-400">
              {visitedCount} Visited, {beatShops.length - visitedCount} Pending
            </span>
          </div>

          <div className="space-y-2">
            {beatShops.map((shop) => (
              <div
                key={shop.id}
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                  shop.status === 'visited'
                    ? 'bg-emerald-500/5 border-emerald-500/20'
                    : 'bg-slate-50 dark:bg-[#1C2028] border-slate-100 dark:border-[#222631]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`h-7 w-7 rounded-lg flex items-center justify-center ${
                      shop.status === 'visited'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                    }`}
                  >
                    {shop.status === 'visited' ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-xs text-slate-900 dark:text-white">{shop.name}</p>
                    <p className="text-[10px] text-slate-400">
                      {shop.owner} &bull; {shop.address}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      shop.status === 'visited'
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                        : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {shop.status === 'visited' ? 'ORDER PUNCHED' : 'PENDING VISIT'}
                  </span>
                  {shop.status !== 'visited' && (
                    <button
                      onClick={() => {
                        handleOpenPunchModal(shop);
                        if (setCurrentTab) setCurrentTab('beat');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-xs cursor-pointer"
                    >
                      Punch
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // TAB: TRADE SCHEMES & DEALS FOR SALESMEN
  // ==========================================
  if (currentTab === 'schemes') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Percent className="w-5 h-5 text-emerald-500" />
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                Active FMCG Trade Schemes
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Current promotional deals to pitch during kirana visits
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(schemes.length > 0
            ? schemes
            : [
                {
                  id: '1',
                  name: 'Parle-G 10+1 Bumper Deal',
                  schemeType: 'BUY_X_GET_Y_FREE',
                  minQuantity: 10,
                  freeQuantity: 1,
                  discountPercent: 0,
                },
                {
                  id: '2',
                  name: 'Surf Excel 5% Bulk Discount',
                  schemeType: 'PERCENTAGE_DISCOUNT',
                  minQuantity: 5,
                  freeQuantity: 0,
                  discountPercent: 5,
                },
                {
                  id: '3',
                  name: 'Good Day Butter 12+1 Free',
                  schemeType: 'BUY_X_GET_Y_FREE',
                  minQuantity: 12,
                  freeQuantity: 1,
                  discountPercent: 0,
                },
              ]
          ).map((s) => (
            <div
              key={s.id}
              className="p-5 rounded-2xl bg-white dark:bg-[#16181E] border border-slate-200/80 dark:border-[#222631] shadow-xs space-y-3 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 px-2.5 py-1 bg-emerald-500 text-white text-[10px] font-black rounded-bl-xl uppercase tracking-wider">
                Active Scheme
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white pt-2">{s.name}</h3>
              <div className="p-3 bg-slate-50 dark:bg-[#1C2028] rounded-xl text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                {s.schemeType === 'BUY_X_GET_Y_FREE'
                  ? `Buy ${s.minQuantity} Boxes -> Get ${s.freeQuantity} Box Free!`
                  : `Get ${s.discountPercent}% Instant Off on orders of ${s.minQuantity}+ units`}
              </div>
              {setCurrentTab && (
                <button
                  onClick={() => setCurrentTab('beat')}
                  className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>Pitch to Shop on Beat</span>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ==========================================
  // TAB: FMCG CATALOGUE FOR SALESMEN
  // ==========================================
  if (currentTab === 'catalogue') {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-500" />
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                FMCG Product Catalogue
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live dealer rates and warehouse inventory for Beat #4
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search SKU or Brand..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-[#16181E] border border-slate-200 dark:border-[#222631] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((p) => (
            <div
              key={p.id}
              className="p-4 rounded-2xl bg-white dark:bg-[#16181E] border border-slate-200/80 dark:border-[#222631] shadow-xs flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {p.brand}
                </span>
                <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                  {p.name}
                </h4>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                  Pack: {p.packSize} &bull; MRP: ₹{p.mrp}
                </p>
              </div>

              <div className="text-right flex-shrink-0">
                <p className="font-black text-sm text-emerald-600 dark:text-emerald-400 font-mono">
                  ₹{p.basePrice}
                </p>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full inline-block mt-0.5">
                  In Stock
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ==========================================
  // DEFAULT TAB: MY BEAT & PUNCH ORDER
  // ==========================================
  return (
    <div className="space-y-6">
      {/* Top Banner: Sync & Offline Status */}
      {syncStatusMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 px-4 py-2.5 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 flex-shrink-0" />
            <span>{syncStatusMsg}</span>
          </div>
          <button
            onClick={() => setSyncStatusMsg(null)}
            className="text-emerald-600 dark:text-emerald-400"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Offline Pending Queue Banner */}
      {pendingCount > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold">
                {pendingCount} Offline Order{pendingCount > 1 ? 's' : ''} Stored Locally in Dexie
                IndexedDB
              </h4>
              <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-0.5">
                Orders are safely queued with idempotent keys. Ready to synchronize with Jabalpur
                Distributor Hub.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenQueueModal}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-800 dark:text-amber-200 transition-colors"
            >
              View Orders
            </button>
            <button
              onClick={handleSyncNow}
              disabled={isSyncing || !isOnline}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg text-white flex items-center gap-1.5 transition-all ${
                !isOnline
                  ? 'bg-slate-400 cursor-not-allowed opacity-60'
                  : 'bg-amber-600 hover:bg-amber-700 shadow-sm cursor-pointer'
              }`}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Punch Mode Banner */}
      {currentTab === 'punch' && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 p-3.5 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShoppingCart className="w-5 h-5 text-emerald-500" />
            <div>
              <p className="font-bold text-xs">Punch Order Mode Active</p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                Tap on any Kirana shop below to open the fast order punching pad.
              </p>
            </div>
          </div>
          <button
            onClick={() => handleOpenPunchModal()}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
          >
            Open Order Pad
          </button>
        </div>
      )}

      {/* Salesman Beat Header & Controls */}
      <div className="bg-white dark:bg-[#16181E] rounded-2xl p-5 border border-slate-200/80 dark:border-[#222631] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/20">
              Active Beat #4
            </span>
            <span className="text-xs text-slate-400">Lordganj & Sarafa Sector</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            {user?.name || 'Sales Representative'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Today's Target: 18 Kirana Visits &bull; Offline-First Dexie Storage Active
          </p>
        </div>

        {/* Network & Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Offline Simulator Switch */}
          <button
            onClick={handleToggleOfflineMode}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              isOnline
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                : 'bg-amber-50 dark:bg-amber-950/30 border-amber-500/30 text-amber-600 dark:text-amber-400'
            }`}
            title="Click to toggle simulated offline beat mode"
          >
            {isOnline ? (
              <>
                <Wifi className="h-3.5 w-3.5 text-emerald-500" />
                <span>Online (Click to go Offline)</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3.5 w-3.5 text-amber-500" />
                <span>Offline Mode (Click to go Online)</span>
              </>
            )}
          </button>

          {/* Punch Order Button */}
          <button
            onClick={() => handleOpenPunchModal()}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-emerald-500 to-teal-400 text-white shadow-[0_4px_14px_rgba(16,185,129,0.35)] flex items-center gap-2 hover:opacity-95 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Punch Beat Order</span>
          </button>
        </div>
      </div>

      {/* Beat Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#16181E] rounded-2xl p-4 border border-slate-200/80 dark:border-[#222631]">
          <p className="text-xs font-semibold text-slate-400">Beat Coverage</p>
          <div className="mt-1 flex items-baseline justify-between">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {visitedCount} / {beatShops.length}
            </p>
            <span className="text-xs font-bold text-emerald-500">{progressPercent}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 dark:bg-[#202530] rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-[#16181E] rounded-2xl p-4 border border-slate-200/80 dark:border-[#222631]">
          <p className="text-xs font-semibold text-slate-400">Beat Orders Booked</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">₹34,450</p>
          <p className="text-[11px] text-slate-400 mt-1">Daily Beat Target: ₹65,000</p>
        </div>

        <div className="bg-white dark:bg-[#16181E] rounded-2xl p-4 border border-slate-200/80 dark:border-[#222631]">
          <p className="text-xs font-semibold text-slate-400">Total Outstanding Khata</p>
          <p className="text-2xl font-bold text-amber-500 mt-1">
            ₹{totalOutstanding.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Across {beatShops.length} mapped kirana accounts
          </p>
        </div>
      </div>

      {/* Beat Retailer Stores List */}
      <div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Today's Beat Sequence
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Orders taken offline are stored in Dexie IndexedDB and synced automatically.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search shop or merchant..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-[#16181E] border border-slate-200/80 dark:border-[#222631] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
            />
          </div>
        </div>

        {loadingShops && beatShops.length === 0 ? (
          <div className="py-12 text-center text-slate-400 border border-dashed rounded-2xl border-slate-200 dark:border-slate-800">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-emerald-500" />
            <p className="text-xs font-medium">Loading Beat #4 shops & syncing Dexie cache...</p>
          </div>
        ) : filteredShops.length === 0 ? (
          <div className="py-12 text-center text-slate-400 border border-dashed rounded-2xl border-slate-200 dark:border-slate-800">
            <Store className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs font-medium">No shops found matching your search</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredShops.map((shop) => {
              const isVisited = shop.status === 'visited';
              return (
                <div
                  key={shop.id}
                  className={`rounded-2xl p-4 border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isVisited
                      ? 'bg-white dark:bg-[#16181E] border-emerald-500/30'
                      : 'bg-white dark:bg-[#16181E] border-slate-200/80 dark:border-[#222631]'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div
                      className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isVisited
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-[#202530] text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      <Store className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                          {shop.name}
                        </h3>
                        {isVisited ? (
                          <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" /> Visited
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Clock className="h-3 w-3" /> Due Next
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {shop.owner} &bull; {shop.address}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-5 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100 dark:border-[#222631]">
                    <div className="text-left sm:text-right">
                      <p className="text-[11px] text-slate-400">Outstanding Khata</p>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        ₹{shop.outstanding.toLocaleString('en-IN')}
                      </p>
                    </div>

                    <button
                      onClick={() => handleOpenPunchModal(shop)}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>Take Order</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL: Offline Order Punch Pad */}
      {showPunchModal && selectedShop && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#16181E] border border-slate-200 dark:border-[#222631] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200/80 dark:border-[#222631] flex items-center justify-between bg-slate-50 dark:bg-[#1A1D24]">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 flex items-center justify-center text-white">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Punch Order: {selectedShop.name}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        isOnline
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                          : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                      }`}
                    >
                      {isOnline ? 'Online Sync' : 'Offline Dexie Queue'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Owner: {selectedShop.owner} &bull; Outstanding Khata: ₹
                    {selectedShop.outstanding.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowPunchModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body: Two columns (Products catalogue left, Cart invoice right) */}
            <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-hidden">
              {/* Product selection list (7 cols) */}
              <div className="md:col-span-7 p-4 border-r border-slate-200/80 dark:border-[#222631] flex flex-col overflow-hidden">
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search cached products (Parle, Maggi, Tata...)"
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-[#1A1D24] border border-slate-200 dark:border-[#222631] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                  />
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {filteredProducts.map((p) => {
                    const qty = orderItems[p.id] || 0;
                    const price = p.pricing?.rate || p.basePrice;
                    return (
                      <div
                        key={p.id}
                        className="p-3 rounded-xl border border-slate-200/80 dark:border-[#222631] bg-slate-50/50 dark:bg-[#181B22] flex items-center justify-between gap-3"
                      >
                        <div className="flex-1">
                          <p className="text-xs font-bold text-slate-900 dark:text-white">
                            {p.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                            <span>SKU: {p.skuCode}</span>
                            <span>&bull;</span>
                            <span>
                              Rate: ₹{price.toFixed(2)}/{p.unit}
                            </span>
                            <span>&bull;</span>
                            <span>GST: {p.gstRate}%</span>
                          </div>
                          {p.scheme && (
                            <span className="inline-block mt-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">
                              {p.scheme.name}
                            </span>
                          )}
                        </div>

                        {/* Quantity controls */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(p.id, qty - 1)}
                            disabled={qty === 0}
                            className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-[#252A36] text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center hover:bg-slate-300 dark:hover:bg-[#303644] disabled:opacity-40 transition-colors"
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-xs font-bold text-slate-900 dark:text-white">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(p.id, qty + 1)}
                            className="w-7 h-7 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Order Cart / Invoice Summary (5 cols) */}
              <div className="md:col-span-5 p-4 flex flex-col bg-slate-50/60 dark:bg-[#16181E] overflow-hidden">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Order Summary ({selectedCartItems.length} items)
                </h4>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {selectedCartItems.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs py-8">
                      <ShoppingBag className="h-8 w-8 mb-2 opacity-40" />
                      <span>Select products from the list to start booking order</span>
                    </div>
                  ) : (
                    selectedCartItems.map((item) => (
                      <div
                        key={item.productId}
                        className="p-2.5 rounded-xl bg-white dark:bg-[#1C2028] border border-slate-200/80 dark:border-[#262B35] text-xs"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white">
                              {item.productName}
                            </span>
                            <div className="text-[11px] text-slate-400">
                              {item.quantity} {item.unit} &times; ₹{item.unitPrice.toFixed(2)}
                              {item.freeQuantity ? (
                                <span className="ml-1 text-emerald-500 font-bold">
                                  (+{item.freeQuantity} Free)
                                </span>
                              ) : null}
                            </div>
                          </div>
                          <span className="font-bold text-slate-900 dark:text-white">
                            ₹{item.totalPrice.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Notes Input */}
                <div className="mt-3">
                  <input
                    type="text"
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="Order notes / delivery instructions..."
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-[#1A1D24] border border-slate-200 dark:border-[#222631] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                  />
                </div>

                {/* Totals Breakdown */}
                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-[#222631] space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Taxable Subtotal:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      ₹{cartSubtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Total GST:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      ₹{cartGst.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-white pt-1 border-t border-dashed border-slate-200 dark:border-[#222631]">
                    <span>Total Amount:</span>
                    <span className="text-emerald-600 dark:text-emerald-400">
                      ₹{cartTotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="button"
                  onClick={handleSubmitOrder}
                  disabled={selectedCartItems.length === 0}
                  className="mt-4 w-full py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-emerald-500 to-teal-400 hover:opacity-95 shadow-md flex items-center justify-center gap-2 disabled:opacity-50 transition-all cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{isOnline ? 'Punch & Send to Hub' : 'Save to Offline IndexedDB'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Offline Queue Inspector */}
      {showQueueModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#16181E] border border-slate-200 dark:border-[#222631] rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-200/80 dark:border-[#222631] flex items-center justify-between bg-slate-50 dark:bg-[#1A1D24]">
              <div className="flex items-center gap-2.5">
                <Database className="h-5 w-5 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Offline IndexedDB Queue ({pendingOrders.length} records)
                </h3>
              </div>
              <button
                onClick={() => setShowQueueModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-3">
              {pendingOrders.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No orders currently waiting in offline queue.
                </div>
              ) : (
                pendingOrders.map((ord) => (
                  <div
                    key={ord.clientOrderId}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-[#222631] bg-slate-50/50 dark:bg-[#181B22] space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {ord.retailerName}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                        {ord.status}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 flex flex-wrap gap-x-3 gap-y-1">
                      <span>
                        Idempotency Key:{' '}
                        <code className="text-slate-600 dark:text-slate-300">
                          {ord.clientOrderId}
                        </code>
                      </span>
                      <span>
                        Total:{' '}
                        <strong className="text-emerald-600 dark:text-emerald-400">
                          ₹{ord.finalAmount.toFixed(2)}
                        </strong>
                      </span>
                      <span>Items: {ord.items.length}</span>
                      <span>Created: {new Date(ord.createdAt).toLocaleTimeString()}</span>
                    </div>

                    <div className="bg-white dark:bg-[#1C2028] p-2 rounded-lg border border-slate-200/50 dark:border-[#262B35] text-[11px] text-slate-500">
                      {ord.items.map((it) => (
                        <div key={it.productId} className="flex justify-between">
                          <span>
                            {it.quantity}x {it.productName}
                          </span>
                          <span>₹{it.totalPrice.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-slate-200/80 dark:border-[#222631] bg-slate-50 dark:bg-[#1A1D24] flex items-center justify-between">
              <span className="text-xs text-slate-400">Backed by browser IndexedDB (Dexie)</span>
              <button
                onClick={handleSyncNow}
                disabled={isSyncing || !isOnline || pendingOrders.length === 0}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Sync All to Hub</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
