import { useState, useEffect } from 'react';
import {
  Wallet,
  CheckCircle2,
  XCircle,
  FileText,
  Building2,
  TrendingUp,
  RefreshCw,
  AlertTriangle,
  FileSpreadsheet,
  Search,
  Check,
  Package,
} from 'lucide-react';
import { Order, OrderDeskMetrics } from '../../types';
import { OrderService } from '../../services/orderService';

export const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<'pending' | 'hold' | 'approved' | 'all'>('pending');
  const [orders, setOrders] = useState<Order[]>([]);
  const [metrics, setMetrics] = useState<OrderDeskMetrics>({
    totalOrdersToday: 412,
    pendingOrders: 38,
    approvedOrders: 374,
    rejectedOrders: 0,
    totalGmv: 842500,
    creditHoldCount: 6,
    activeSalesmenCount: 18,
  });
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [fetchedOrders, fetchedMetrics] = await Promise.all([
        OrderService.listOrders(),
        OrderService.getDeskMetrics(),
      ]);
      setOrders(fetchedOrders);
      setMetrics(fetchedMetrics);
      if (fetchedOrders.length > 0 && !selectedOrder) {
        setSelectedOrder(fetchedOrders[0]);
      }
    } catch (err) {
      console.error('Error loading order desk data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (orderId: string) => {
    try {
      const updated = await OrderService.approveOrder(orderId, 'Approved by Ramesh Gupta');
      setActionSuccessMessage(`Order ${updated.orderNumber} approved successfully!`);
      setTimeout(() => setActionSuccessMessage(null), 3500);

      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(updated);
      }
      loadData();
    } catch (err) {
      alert('Failed to approve order');
    }
  };

  const handleReject = async (orderId: string) => {
    const reason = prompt('Please enter rejection reason:', 'Credit limit exceeded / Out of beat zone');
    if (!reason) return;

    try {
      const updated = await OrderService.rejectOrder(orderId, reason);
      setActionSuccessMessage(`Order ${updated.orderNumber} rejected`);
      setTimeout(() => setActionSuccessMessage(null), 3500);

      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(updated);
      }
      loadData();
    } catch (err) {
      alert('Failed to reject order');
    }
  };

  const handleExportTallyCsv = async () => {
    setIsExporting(true);
    try {
      const token = localStorage.getItem('supplysetu-auth-token');
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiBase}/exports/tally.csv`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        throw new Error('Failed to generate Tally CSV export');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const today = new Date().toISOString().split('T')[0];
      a.download = `TALLY_ORDERS_${today}_BATCH.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setActionSuccessMessage('Tally ERP compatible CSV downloaded successfully!');
      setTimeout(() => setActionSuccessMessage(null), 4000);
    } catch (err: any) {
      console.error('Tally export error:', err);
      alert('Could not download Tally export from server. Please verify backend is running.');
    } finally {
      setIsExporting(false);
    }
  };

  // Filter orders by tab
  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.retailer.shopName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.retailer.ownerName.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === 'pending') return o.status === 'PENDING' && o.creditStatus !== 'HOLD';
    if (activeTab === 'hold') return o.status === 'PENDING' && o.creditStatus === 'HOLD';
    if (activeTab === 'approved') return o.status === 'APPROVED';
    return true; // 'all'
  });

  return (
    <div className="space-y-6 pb-8">
      {/* Action Notification Banner */}
      {actionSuccessMessage && (
        <div className="p-3 bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center justify-between shadow-md animate-slideDown">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{actionSuccessMessage}</span>
          </div>
          <button onClick={() => setActionSuccessMessage(null)} className="opacity-80 hover:opacity-100">
            &times;
          </button>
        </div>
      )}

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#16181E] rounded-2xl p-4 border border-slate-200/80 dark:border-[#222631] shadow-xs">
          <p className="text-xs font-semibold text-slate-400">Today's Orders Target</p>
          <div className="mt-1 flex items-baseline justify-between">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {metrics.totalOrdersToday} / 600
            </p>
            <span className="text-xs font-semibold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
              {Math.round((metrics.totalOrdersToday / 600) * 100)}%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {metrics.activeSalesmenCount} Beat Salesmen in Field
          </p>
        </div>

        <div className="bg-white dark:bg-[#16181E] rounded-2xl p-4 border border-slate-200/80 dark:border-[#222631] shadow-xs">
          <p className="text-xs font-semibold text-slate-400">Today's GMV Booked</p>
          <div className="mt-1 flex items-baseline justify-between">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              ₹{metrics.totalGmv.toLocaleString('en-IN')}
            </p>
            <span className="text-xs font-semibold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md flex items-center gap-0.5">
              <TrendingUp className="h-3 w-3" /> +14%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Target: ₹12,00,000</p>
        </div>

        <div className="bg-white dark:bg-[#16181E] rounded-2xl p-4 border border-slate-200/80 dark:border-[#222631] shadow-xs">
          <p className="text-xs font-semibold text-slate-400">Pending Review Queue</p>
          <div className="mt-1 flex items-baseline justify-between">
            <p className="text-2xl font-bold text-amber-500">{metrics.pendingOrders} Orders</p>
            <span className="text-xs font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md">
              {metrics.creditHoldCount} Credit Holds
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Requires office approval</p>
        </div>

        <div className="bg-white dark:bg-[#16181E] rounded-2xl p-4 border border-slate-200/80 dark:border-[#222631] shadow-xs">
          <p className="text-xs font-semibold text-slate-400">Tally ERP Batch Export</p>
          <div className="mt-1 flex items-baseline justify-between">
            <p className="text-2xl font-bold text-emerald-500">Ready</p>
            <button
              onClick={handleExportTallyCsv}
              disabled={isExporting}
              className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm transition-all cursor-pointer"
            >
              <FileSpreadsheet className={`h-3.5 w-3.5 ${isExporting ? 'animate-spin' : ''}`} />
              <span>{isExporting ? 'Generating...' : 'Export CSV'}</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">{metrics.approvedOrders} Approved batches</p>
        </div>
      </div>

      {/* Main Order Desk Workspace: 12 Cols Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column: Distributor Ledger / Beat Outstanding (3 Cols) */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="bg-white dark:bg-[#16181E] rounded-2xl p-5 border border-slate-200/80 dark:border-[#222631] shadow-xs">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400">Distributor Collection Ledger</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">₹47,74,800</p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#222631] flex flex-col gap-2">
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Total Active Retailers:</span>
                <span className="font-bold text-slate-900 dark:text-white">1,820 Shops</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Jabalpur FMCG Hub:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">Operational</span>
              </div>
            </div>
          </div>

          {/* Beat Highlights */}
          <div className="bg-white dark:bg-[#16181E] rounded-2xl p-4 border border-slate-200/80 dark:border-[#222631] space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Beat Outstanding Highlights
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center p-2 rounded-lg bg-slate-50 dark:bg-[#1C2028]">
                <span>Beat #1 Gorakhpur</span>
                <span className="font-semibold text-slate-900 dark:text-white">₹3,45,000</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-lg bg-slate-50 dark:bg-[#1C2028]">
                <span>Beat #4 Lordganj</span>
                <span className="font-semibold text-slate-900 dark:text-white">₹5,12,800</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-lg bg-slate-50 dark:bg-[#1C2028]">
                <span>Beat #7 Wright Town</span>
                <span className="font-semibold text-slate-900 dark:text-white">₹2,88,400</span>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Column: Live Incoming Order Queue (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Incoming Orders Queue</span>
                <button
                  onClick={loadData}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
                  title="Refresh Queue"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </h3>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-1 bg-slate-100 dark:bg-[#202530] p-0.5 rounded-lg text-xs overflow-x-auto">
              <button
                onClick={() => setActiveTab('pending')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  activeTab === 'pending'
                    ? 'bg-white dark:bg-[#16181E] text-slate-900 dark:text-white shadow-xs font-bold'
                    : 'text-slate-500'
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setActiveTab('hold')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  activeTab === 'hold'
                    ? 'bg-white dark:bg-[#16181E] text-amber-500 shadow-xs font-bold'
                    : 'text-slate-500'
                }`}
              >
                Credit Hold
              </button>
              <button
                onClick={() => setActiveTab('approved')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  activeTab === 'approved'
                    ? 'bg-white dark:bg-[#16181E] text-emerald-500 shadow-xs font-bold'
                    : 'text-slate-500'
                }`}
              >
                Approved
              </button>
              <button
                onClick={() => setActiveTab('all')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  activeTab === 'all'
                    ? 'bg-white dark:bg-[#16181E] text-slate-900 dark:text-white shadow-xs font-bold'
                    : 'text-slate-500'
                }`}
              >
                All
              </button>
            </div>
          </div>

          {/* Quick Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by Order # or Kirana shop name..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-[#16181E] border border-slate-200/80 dark:border-[#222631] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden"
            />
          </div>

          {/* Orders Scrollable List */}
          <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
            {filteredOrders.length === 0 ? (
              <div className="py-12 text-center text-slate-400 border border-dashed rounded-xl border-slate-200 dark:border-slate-800">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs">No orders in this queue</p>
              </div>
            ) : (
              filteredOrders.map((order) => {
                const isSelected = selectedOrder?.id === order.id;
                const isCreditHold = order.creditStatus === 'HOLD';
                const isApproved = order.status === 'APPROVED';

                return (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className={`rounded-xl p-3.5 border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-emerald-500 ring-1 ring-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/20'
                        : 'border-slate-200/80 dark:border-[#222631] bg-white dark:bg-[#16181E] hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs flex-shrink-0 mt-0.5 ${
                            isApproved
                              ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300'
                              : isCreditHold
                              ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-300'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {isApproved ? <Check className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {order.retailer.shopName}
                            </span>
                            <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 px-1 rounded text-slate-500">
                              {order.orderNumber}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {order.items.map((i) => i.product?.name || 'Item').join(', ')}
                          </p>

                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[10px] text-slate-400">
                              {order.createdVia === 'AI_CAPTURE'
                                ? '🤖 AI WhatsApp'
                                : order.createdVia === 'SALESMAN_APP'
                                ? '📱 Beat Salesman'
                                : '💻 Retailer Portal'}
                            </span>
                            <span>•</span>
                            <span className="text-[10px] text-slate-400">
                              {order.items.reduce((s, i) => s + i.quantity, 0)} boxes
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Amount & Quick Actions */}
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          ₹{order.finalAmount.toFixed(0)}
                        </p>

                        <div className="mt-1">
                          {isCreditHold ? (
                            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/50 px-1.5 py-0.5 rounded border border-amber-500/20">
                              Credit Hold
                            </span>
                          ) : isApproved ? (
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-500/20">
                              Approved
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                              Pending
                            </span>
                          )}
                        </div>

                        {order.status === 'PENDING' && (
                          <div className="flex gap-1 mt-2 justify-end" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleApprove(order.id)}
                              className="h-6 w-6 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-100 transition-colors"
                              title="Approve Order"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleReject(order.id)}
                              className="h-6 w-6 rounded bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-100 transition-colors"
                              title="Reject Order"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Order Detail & Audit Stepper (4 Cols) */}
        <div className="lg:col-span-4">
          {selectedOrder ? (
            <div className="bg-white dark:bg-[#16181E] rounded-2xl p-5 border border-slate-200/80 dark:border-[#222631] shadow-xs flex flex-col justify-between h-full space-y-4">
              <div>
                {/* Header */}
                <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-[#222631]">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Order Details & Verification
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                      {selectedOrder.orderNumber}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {selectedOrder.retailer.shopName} &bull; {selectedOrder.retailer.city}
                    </p>
                  </div>

                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                      selectedOrder.status === 'APPROVED'
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
                        : selectedOrder.status === 'REJECTED'
                        ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400'
                        : 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400'
                    }`}
                  >
                    {selectedOrder.status}
                  </span>
                </div>

                {/* Credit Check Card */}
                <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-[#1C2028] border border-slate-200/60 dark:border-slate-800 text-xs space-y-1.5">
                  <div className="flex justify-between items-center font-bold">
                    <span className="text-slate-600 dark:text-slate-300">Retailer Khata Status:</span>
                    <span
                      className={
                        selectedOrder.creditStatus === 'HOLD'
                          ? 'text-rose-500 flex items-center gap-1'
                          : 'text-emerald-500 flex items-center gap-1'
                      }
                    >
                      {selectedOrder.creditStatus === 'HOLD' ? (
                        <>
                          <AlertTriangle className="w-3.5 h-3.5" /> Credit Overdrawn
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" /> Within Credit Line
                        </>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>Approved Credit Limit:</span>
                    <span>₹{selectedOrder.retailer.creditLimit.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>Current Outstanding:</span>
                    <span>₹{selectedOrder.retailer.outstandingBalance.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Itemized Table */}
                <div className="mt-4 space-y-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider block">
                    Ordered SKU Items ({selectedOrder.items.length})
                  </span>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {selectedOrder.items.map((item) => (
                      <div
                        key={item.id}
                        className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-[#151922] text-xs flex justify-between items-center"
                      >
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {item.product?.name || 'Product'}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {item.quantity} {item.unit}s @ ₹{item.unitPrice.toFixed(1)}
                            {item.freeQuantity > 0 && ` (+${item.freeQuantity} Free Box)`}
                          </p>
                        </div>
                        <div className="text-right font-bold text-slate-900 dark:text-white">
                          ₹{item.totalPrice.toFixed(0)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#222736] space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>Taxable Value</span>
                    <span>₹{selectedOrder.totalAmount.toFixed(2)}</span>
                  </div>
                  {selectedOrder.discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Trade Discounts</span>
                      <span>-₹{selectedOrder.discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                    <span>GST (CGST + SGST)</span>
                    <span>₹{selectedOrder.gstAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-slate-800">
                    <span>Total Order Amount</span>
                    <span className="text-emerald-500">₹{selectedOrder.finalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              {selectedOrder.status === 'PENDING' ? (
                <div className="pt-3 border-t border-slate-100 dark:border-[#222736] flex gap-2">
                  <button
                    onClick={() => handleReject(selectedOrder.id)}
                    className="flex-1 py-2 rounded-xl border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 font-bold text-xs hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                  >
                    Reject Order
                  </button>
                  <button
                    onClick={() => handleApprove(selectedOrder.id)}
                    className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve & Pack</span>
                  </button>
                </div>
              ) : (
                <div className="pt-2 text-center text-xs text-slate-400">
                  Order status: <strong>{selectedOrder.status}</strong>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-[#16181E] rounded-2xl p-8 border border-slate-200/80 dark:border-[#222631] text-center text-slate-400 flex flex-col items-center justify-center h-full">
              <Package className="w-12 h-12 stroke-1 mb-2 opacity-50" />
              <p className="text-sm font-semibold">Select an order</p>
              <p className="text-xs mt-1">Click any order in the queue to inspect items & verify credit.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
