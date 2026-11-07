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
  Package,
  Calendar,
  Repeat,
  FileText,
  CheckCircle2,
  QrCode,
  ArrowUpRight,
  ArrowDownLeft,
  Check,
  X,
  Percent,
  ShoppingCart,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { Product, CategorySummary, Order, KhataLedgerResponse, Scheme } from '../../types';
import { ProductService } from '../../services/productService';
import { RetailerService } from '../../services/retailerService';
import { OrderService } from '../../services/orderService';
import { ProductCard } from '../../components/catalogue/ProductCard';
import { ProductSearchAndFilter } from '../../components/catalogue/ProductSearchAndFilter';
import { CartSummaryBar } from '../../components/cart/CartSummaryBar';
import { AiOrderPadModal } from '../../components/orders/AiOrderPadModal';
import { B2bTaxInvoiceModal } from '../../components/orders/B2bTaxInvoiceModal';

export interface RetailerDashboardProps {
  currentTab?: string;
  setCurrentTab?: (tab: string) => void;
}

export const RetailerDashboard: React.FC<RetailerDashboardProps> = ({ currentTab = 'shop', setCurrentTab }) => {
  const { user } = useAuth();
  const { totalItemsCount, setIsCartDrawerOpen, addToCart } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAiOrderPadOpen, setIsAiOrderPadOpen] = useState(false);

  // B2B Tax Invoice Modal State
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  // Repeating Order State
  const [repeatingOrderId, setRepeatingOrderId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Khata Ledger State
  const [khataData, setKhataData] = useState<KhataLedgerResponse | null>(null);
  const [loadingKhata, setLoadingKhata] = useState(false);
  const [isUpiModalOpen, setIsUpiModalOpen] = useState(false);
  const [upiPaymentAmount, setUpiPaymentAmount] = useState<number>(0);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // Active Trade Schemes State
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loadingSchemes, setLoadingSchemes] = useState(false);

  const loadSchemes = async () => {
    setLoadingSchemes(true);
    try {
      const list = await ProductService.listSchemes();
      setSchemes(list);
    } catch (e) {
      console.warn('Failed to load schemes:', e);
    } finally {
      setLoadingSchemes(false);
    }
  };

  useEffect(() => {
    if (currentTab === 'ai-pad') {
      setIsAiOrderPadOpen(true);
    } else if (currentTab === 'cart') {
      setIsCartDrawerOpen(true);
    } else if (currentTab === 'credit') {
      loadKhata();
    } else if (currentTab === 'schemes') {
      loadSchemes();
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
      const [fetchedProducts, fetchedCategories, profile, orders] = await Promise.all([
        ProductService.getProducts({
          search: searchTerm,
          category: selectedCategory,
          inStockOnly,
          tier: creditProfile.priceTier,
        }),
        ProductService.getCategories(),
        RetailerService.getMyProfile(),
        OrderService.listOrders(),
      ]);

      setProducts(fetchedProducts);
      setCategories(fetchedCategories);
      setMyOrders(orders);
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

  const loadKhata = async () => {
    setLoadingKhata(true);
    try {
      const data = await RetailerService.getKhata();
      setKhataData(data);
      setUpiPaymentAmount(data.retailer.outstandingBalance);
    } catch (err) {
      console.warn('Failed to load Khata statement:', err);
    } finally {
      setLoadingKhata(false);
    }
  };

  useEffect(() => {
    loadCatalogue();
  }, [searchTerm, selectedCategory, inStockOnly, creditProfile.priceTier]);

  // Handle 1-Click Repeat Order
  const handleRepeatOrder = async (order: Order) => {
    setRepeatingOrderId(order.id);
    try {
      // Re-add all items into active cart for retailer review
      for (const item of order.items) {
        const prod = await ProductService.getProductById(item.productId);
        if (prod) {
          addToCart(prod, item.quantity);
        }
      }
      setToastMessage(`✓ Added all items from ${order.orderNumber} to your shopping cart!`);
      setTimeout(() => setToastMessage(null), 4000);
      setIsCartDrawerOpen(true);
    } catch (err) {
      console.error('Failed to repeat order:', err);
      alert('Unable to load items to cart. Please verify stock availability.');
    } finally {
      setRepeatingOrderId(null);
    }
  };

  // Handle Khata Repayment via UPI
  const handleConfirmUpiPayment = async () => {
    if (upiPaymentAmount <= 0) return;
    setIsSubmittingPayment(true);
    try {
      const refNo = `UPI-${Date.now().toString().slice(-6)}`;
      await RetailerService.recordPayment(creditProfile.shopName, {
        amount: upiPaymentAmount,
        paymentMode: 'UPI_DIRECT',
        referenceNo: refNo,
        notes: `Instant UPI payment for Khata balance settlement`,
      });

      setToastMessage(`✓ Payment of ₹${upiPaymentAmount.toLocaleString('en-IN')} recorded! Khata balance updated.`);
      setTimeout(() => setToastMessage(null), 4000);
      setIsUpiModalOpen(false);
      await Promise.all([loadCatalogue(), loadKhata()]);
    } catch (err) {
      console.error('Payment record error:', err);
      alert('Failed to record payment');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-5 z-50 animate-slideDown bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl border border-slate-700 flex items-center gap-3 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-slate-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Banner: Retailer Welcome & Credit Khata Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Welcome & Shop Info */}
        <div className="lg:col-span-7 bg-white dark:bg-[#16181E] rounded-2xl p-5 border border-slate-200/80 dark:border-[#222631] shadow-xs flex flex-col justify-between">
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
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <ShoppingBag className="h-3.5 w-3.5" />
                <span>View Cart ({totalItemsCount})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Khata / Credit Limit Widget */}
        <div className="lg:col-span-5 bg-white dark:bg-[#16181E] rounded-2xl p-5 border border-slate-200/80 dark:border-[#222631] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-xs">
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
                className={`h-full rounded-full transition-all duration-500 ${
                  creditProfile.creditUtilization > 85 ? 'bg-rose-500' : 'bg-emerald-500'
                }`}
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
            <span
              onClick={() => setCurrentTab && setCurrentTab('credit')}
              className="text-emerald-500 font-semibold cursor-pointer hover:underline flex items-center gap-1"
            >
              <span>View Full Khata</span> &rarr;
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
              AI Multimodal WhatsApp & Slip Order Capture
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Snap a photo of your handwritten paper slip (&ldquo;Parchi&rdquo;), paste WhatsApp text, or record voice note in Hindi.
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

      {/* ---------------------------------------------------------------- */}
      {/* TAB 1: RETAILER KHATA / CREDIT STATEMENT                         */}
      {/* ---------------------------------------------------------------- */}
      {currentTab === 'credit' ? (
        <div className="space-y-5 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Distributor Khata & Credit Passbook</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Weekly Settlement
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Official statement of B2B invoices, UPI repayments, credit limits, and running balance
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsUpiModalOpen(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <QrCode className="w-4 h-4" />
                <span>Pay via UPI / QR</span>
              </button>
              <button
                type="button"
                onClick={() => setCurrentTab && setCurrentTab('shop')}
                className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Back to Catalogue
              </button>
            </div>
          </div>

          {/* Khata Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-xl border border-slate-200/80 dark:border-[#222631] bg-white dark:bg-[#16181E]">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Credit Limit</span>
              <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                ₹{creditProfile.creditLimit.toLocaleString('en-IN')}
              </p>
              <span className="text-[10px] text-slate-400">Assigned by Distributor</span>
            </div>

            <div className="p-4 rounded-xl border border-slate-200/80 dark:border-[#222631] bg-white dark:bg-[#16181E]">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Current Outstanding</span>
              <p className="text-lg font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                ₹{creditProfile.outstandingBalance.toLocaleString('en-IN')}
              </p>
              <span className="text-[10px] text-slate-400">Payable within 7 days</span>
            </div>

            <div className="p-4 rounded-xl border border-slate-200/80 dark:border-[#222631] bg-white dark:bg-[#16181E]">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Available Credit Line</span>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                ₹{creditProfile.availableCredit.toLocaleString('en-IN')}
              </p>
              <span className="text-[10px] text-slate-400">Usable for new orders</span>
            </div>

            <div className="p-4 rounded-xl border border-slate-200/80 dark:border-[#222631] bg-white dark:bg-[#16181E]">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Khata Health</span>
              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Good Standing
              </p>
              <span className="text-[10px] text-slate-400">{creditProfile.creditUtilization}% Limit Utilized</span>
            </div>
          </div>

          {/* Passbook Transaction Table */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-[#222631] bg-white dark:bg-[#16181E] overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 dark:border-[#222631] flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <span>Khata Transaction Ledger</span>
                <span className="text-xs font-normal text-slate-400">
                  ({khataData?.transactions.length || 4} entries)
                </span>
              </h3>
              <button
                type="button"
                onClick={loadKhata}
                className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingKhata ? 'animate-spin' : ''}`} />
                <span>Refresh Passbook</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-[#1a1e27] text-slate-500 dark:text-slate-400 font-bold border-b border-slate-100 dark:border-[#222631]">
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">Voucher / Ref</th>
                    <th className="py-3 px-4">Particulars</th>
                    <th className="py-3 px-3 text-right text-rose-500">Debit (+)</th>
                    <th className="py-3 px-3 text-right text-emerald-500">Credit (-)</th>
                    <th className="py-3 px-4 text-right">Balance</th>
                    <th className="py-3 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#222631]">
                  {(khataData?.transactions || []).map((txn) => {
                    const isInvoice = txn.type === 'INVOICE';
                    return (
                      <tr key={txn.id} className="hover:bg-slate-50/50 dark:hover:bg-[#1a1e27]/50">
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {new Date(txn.date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase flex items-center gap-1 w-fit ${
                              isInvoice
                                ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
                                : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                            }`}
                          >
                            {isInvoice ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
                            {isInvoice ? 'Invoice' : 'Payment'}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                          {txn.referenceNo}
                        </td>
                        <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                          {txn.description}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-semibold text-rose-600 dark:text-rose-400">
                          {txn.debit > 0 ? `₹${txn.debit.toFixed(2)}` : '-'}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                          {txn.credit > 0 ? `₹${txn.credit.toFixed(2)}` : '-'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                          ₹{txn.runningBalance.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {txn.orderId && (
                            <button
                              type="button"
                              onClick={() => {
                                const ord = myOrders.find((o) => o.id === txn.orderId);
                                if (ord) {
                                  setSelectedInvoiceOrder(ord);
                                  setIsInvoiceModalOpen(true);
                                } else {
                                  alert(`Invoice ${txn.referenceNo} can be viewed in My Orders.`);
                                }
                              }}
                              className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 underline cursor-pointer"
                            >
                              Tax Invoice
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : /* ---------------------------------------------------------------- */
      /* TAB 2: MY PLACED ORDERS & TAX INVOICES                           */
      /* ---------------------------------------------------------------- */
      currentTab === 'my-orders' ? (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">My Placed Orders</h2>
              <p className="text-xs text-slate-400">Track order approvals, dispatch status, and download tax invoices</p>
            </div>
            <button
              onClick={() => setCurrentTab && setCurrentTab('shop')}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Back to Catalogue
            </button>
          </div>

          <div className="space-y-3">
            {myOrders.length === 0 ? (
              <div className="py-16 text-center text-slate-400 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-semibold">No previous orders found</p>
                <p className="text-xs mt-1">Place an order from the catalogue or AI pad to see it here.</p>
              </div>
            ) : (
              myOrders.map((order) => {
                const isDelivered = order.status === 'DELIVERED';
                const isDispatched = order.status === 'DISPATCHED';
                const isApproved = order.status === 'APPROVED';
                const isRejected = order.status === 'REJECTED';

                return (
                  <div
                    key={order.id}
                    className="rounded-2xl border border-slate-200/80 dark:border-[#222631] p-4 bg-white dark:bg-[#16181E] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                        <Package className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                            {order.orderNumber}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              isDelivered
                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
                                : isDispatched
                                ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400'
                                : isApproved
                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
                                : isRejected
                                ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400'
                                : 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400'
                            }`}
                          >
                            {order.status}
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                          {order.items.map((i) => `${i.product?.name || 'Product'} (${i.quantity} ${i.unit})`).join(', ')}
                        </p>

                        {/* Order Progress Timeline */}
                        <div className="flex items-center gap-2 my-2 text-[11px] font-semibold">
                          <div className="flex items-center gap-1 text-emerald-600">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span>Placed</span>
                          </div>
                          <span className="text-slate-300 dark:text-slate-600">&rarr;</span>
                          <div
                            className={`flex items-center gap-1 ${
                              isApproved || isDispatched || isDelivered
                                ? 'text-emerald-600'
                                : isRejected
                                ? 'text-rose-500'
                                : 'text-slate-400'
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                isApproved || isDispatched || isDelivered
                                  ? 'bg-emerald-500'
                                  : isRejected
                                  ? 'bg-rose-500'
                                  : 'bg-slate-300 dark:bg-slate-700'
                              }`}
                            />
                            <span>{isRejected ? 'Rejected' : 'Approved'}</span>
                          </div>
                          <span className="text-slate-300 dark:text-slate-600">&rarr;</span>
                          <div
                            className={`flex items-center gap-1 ${
                              isDispatched || isDelivered ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                isDispatched || isDelivered ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-700'
                              }`}
                            />
                            <span>Dispatched</span>
                          </div>
                          <span className="text-slate-300 dark:text-slate-600">&rarr;</span>
                          <div
                            className={`flex items-center gap-1 ${
                              isDelivered ? 'text-emerald-600' : 'text-slate-400'
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                isDelivered ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                              }`}
                            />
                            <span>Delivered</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(order.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          <span>•</span>
                          <span>
                            {order.createdVia === 'AI_CAPTURE'
                              ? 'AI WhatsApp'
                              : order.createdVia === 'SALESMAN_APP'
                              ? 'Salesman Punch'
                              : order.createdVia === 'REPEAT_ORDER'
                              ? '1-Click Reorder'
                              : 'Direct Portal'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right sm:border-l sm:border-slate-100 dark:sm:border-slate-800 sm:pl-6 w-full sm:w-auto flex sm:flex-col justify-between items-center sm:items-end gap-2">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Total Amount</span>
                        <span className="text-base font-bold text-slate-900 dark:text-white">
                          ₹{order.finalAmount.toFixed(2)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        {/* 1-Click Repeat Order */}
                        <button
                          type="button"
                          disabled={repeatingOrderId === order.id}
                          onClick={() => handleRepeatOrder(order)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-300 hover:text-emerald-600 flex items-center gap-1 transition-all cursor-pointer"
                          title="Load exact items to active shopping cart"
                        >
                          <Repeat className={`w-3.5 h-3.5 ${repeatingOrderId === order.id ? 'animate-spin' : ''}`} />
                          <span>Reorder</span>
                        </button>

                        {/* View Tax Invoice */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedInvoiceOrder(order);
                            setIsInvoiceModalOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Invoice</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : currentTab === 'schemes' ? (
        /* ---------------------------------------------------------------- */
        /* TAB: ACTIVE B2B TRADE SCHEMES FOR RETAILERS                      */
        /* ---------------------------------------------------------------- */
        <div className="space-y-4 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Percent className="w-5 h-5 text-emerald-500" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Active B2B Trade Schemes</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Wholesale Savings
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Official distributor promotions &mdash; Buy X Get Y Free and Bulk Margin slabs
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={loadSchemes}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Refresh active schemes"
              >
                <RefreshCw className={`w-4 h-4 ${loadingSchemes ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setCurrentTab && setCurrentTab('shop')}
                className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Back to Catalogue
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {schemes.map((scheme) => {
              const matchedProduct = products.find((p) => p.id === scheme.productId) || products[0];
              const isBuyXGetY = scheme.schemeType === 'BUY_X_GET_Y_FREE';
              const isPercentage = scheme.schemeType === 'PERCENTAGE_DISCOUNT';

              return (
                <div
                  key={scheme.id}
                  className="p-4 rounded-2xl bg-white dark:bg-[#16181E] border border-slate-200/80 dark:border-[#222631] shadow-xs flex flex-col justify-between gap-3 hover:border-emerald-500/40 transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        {isBuyXGetY ? 'Buy X Get Y Free' : isPercentage ? `${scheme.discountPercent}% Bulk Discount` : 'Special FMCG Deal'}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-2">
                      {scheme.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {isBuyXGetY ? `Order minimum ${scheme.minQuantity} units to get ${scheme.freeQuantity} unit free!` : `Order minimum ${scheme.minQuantity} units to get ${scheme.discountPercent}% flat discount!`}
                    </p>

                    {matchedProduct && (
                      <div className="mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-[#1A1D24] border border-slate-200/60 dark:border-[#262B35] flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
                          {matchedProduct.brand ? matchedProduct.brand.substring(0, 2) : 'SKU'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {matchedProduct.name}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            Rate: ₹{matchedProduct.basePrice} &bull; MRP: ₹{matchedProduct.mrp}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                      Min Qty: {scheme.minQuantity || 10}
                    </span>
                    <button
                      onClick={() => {
                        if (matchedProduct) {
                          const qty = scheme.minQuantity || 10;
                          addToCart(matchedProduct, qty);
                          setToastMessage(`Scheme Applied: Added ${qty} units of ${matchedProduct.name} to cart!`);
                          setTimeout(() => setToastMessage(null), 3000);
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>Add Deal to Cart</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ---------------------------------------------------------------- */
        /* TAB 3: PRODUCT CATALOGUE (DEFAULT)                              */
        /* ---------------------------------------------------------------- */
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
      )}

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

      {/* Printable B2B GST Tax Invoice Modal */}
      <B2bTaxInvoiceModal
        order={selectedInvoiceOrder}
        isOpen={isInvoiceModalOpen}
        onClose={() => {
          setIsInvoiceModalOpen(false);
          setSelectedInvoiceOrder(null);
        }}
      />

      {/* UPI QR Payment Modal */}
      {isUpiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-[#16181E] border border-slate-200 dark:border-[#222631] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#222631]">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Pay Khata Balance via UPI</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsUpiModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center space-y-3">
              {/* Synthetic UPI QR Code */}
              <div className="mx-auto w-48 h-48 rounded-xl bg-white p-3 border-2 border-emerald-500 shadow-md flex flex-col items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  {/* Outer Frame */}
                  <rect width="100" height="100" fill="white" />
                  {/* Corner Position Detection Patterns */}
                  <rect x="5" y="5" width="28" height="28" fill="#0f172a" rx="4" />
                  <rect x="9" y="9" width="20" height="20" fill="white" rx="2" />
                  <rect x="13" y="13" width="12" height="12" fill="#0f172a" rx="2" />

                  <rect x="67" y="5" width="28" height="28" fill="#0f172a" rx="4" />
                  <rect x="71" y="9" width="20" height="20" fill="white" rx="2" />
                  <rect x="75" y="13" width="12" height="12" fill="#0f172a" rx="2" />

                  <rect x="5" y="67" width="28" height="28" fill="#0f172a" rx="4" />
                  <rect x="9" y="71" width="20" height="20" fill="white" rx="2" />
                  <rect x="13" y="75" width="12" height="12" fill="#0f172a" rx="2" />

                  {/* Synthetic Data Pixels */}
                  <rect x="38" y="10" width="8" height="8" fill="#10b981" />
                  <rect x="50" y="10" width="8" height="8" fill="#0f172a" />
                  <rect x="42" y="22" width="6" height="6" fill="#0f172a" />
                  <rect x="52" y="22" width="8" height="8" fill="#10b981" />

                  <rect x="10" y="38" width="8" height="8" fill="#0f172a" />
                  <rect x="22" y="42" width="8" height="8" fill="#10b981" />
                  <rect x="38" y="38" width="10" height="10" fill="#0f172a" />
                  <rect x="52" y="42" width="12" height="8" fill="#0f172a" />
                  <rect x="70" y="38" width="8" height="8" fill="#10b981" />
                  <rect x="82" y="42" width="8" height="8" fill="#0f172a" />

                  <rect x="38" y="55" width="8" height="12" fill="#10b981" />
                  <rect x="52" y="55" width="8" height="8" fill="#0f172a" />
                  <rect x="70" y="55" width="14" height="6" fill="#0f172a" />

                  <rect x="38" y="72" width="12" height="8" fill="#0f172a" />
                  <rect x="55" y="72" width="8" height="14" fill="#10b981" />
                  <rect x="70" y="72" width="10" height="8" fill="#0f172a" />
                  <rect x="84" y="80" width="8" height="8" fill="#10b981" />
                </svg>
              </div>

              <div>
                <p className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                  supplysetu.distributor@icici
                </p>
                <p className="text-[11px] text-slate-500">
                  SupplySetu FMCG Distributors Pvt Ltd &bull; Jabalpur
                </p>
              </div>

              {/* Amount Input */}
              <div className="text-left space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Payment Settlement Amount (₹):
                </label>
                <input
                  type="number"
                  value={upiPaymentAmount}
                  onChange={(e) => setUpiPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full text-base font-bold p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                />
                <span className="text-[11px] text-slate-400 block">
                  Total Outstanding Dues: ₹{creditProfile.outstandingBalance.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsUpiModalOpen(false)}
                className="w-1/2 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingPayment || upiPaymentAmount <= 0}
                onClick={handleConfirmUpiPayment}
                className="w-1/2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isSubmittingPayment ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>Record Paid (₹{upiPaymentAmount.toLocaleString('en-IN')})</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
