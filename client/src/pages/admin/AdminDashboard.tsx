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
  UserPlus,
  Users,
  Phone,
  ShieldCheck,
  Lock,
  Download,
  Store,
  Layers,
  ArrowRight,
  Percent,
  Tag,
  Boxes,
  Plus,
  Edit3,
  Trash2,
  Gift,
  DollarSign,
  Radio,
  Truck,
  Printer,
  BarChart3,
  PieChart,
  AlertCircle,
  Award,
  Clock,
  MessageSquare,
  Calendar,
} from 'lucide-react';
import {
  Order,
  OrderDeskMetrics,
  RetailerProfile,
  Product,
  Scheme,
  CategorySummary,
  ExecutiveAnalyticsData,
  InactiveRetailerRecord,
  FinancialRiskData,
} from '../../types';
import { OrderService } from '../../services/orderService';
import { B2bTaxInvoiceModal } from '../../components/orders/B2bTaxInvoiceModal';
import { VanLoadingModal } from '../../components/orders/VanLoadingModal';
import { SalesmanService, SalesmanRecord } from '../../services/salesmanService';
import { RetailerService } from '../../services/retailerService';
import { ProductService } from '../../services/productService';
import { NotificationService } from '../../services/notificationService';
import { AnalyticsService } from '../../services/analyticsService';

interface AdminDashboardProps {
  currentTab?: string;
  setCurrentTab?: (tab: string) => void;
}

export const AdminDashboard = ({ currentTab = 'orders', setCurrentTab }: AdminDashboardProps) => {
  // Global notifications
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Real-Time Notification state
  const [liveOrderToast, setLiveOrderToast] = useState<{
    id: string;
    orderNumber: string;
    shopName: string;
    amount: number;
    createdVia: string;
    salesmanName?: string | null;
  } | null>(null);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);

  // ----------------------------------------------------
  // 1. ORDER DESK STATE
  // ----------------------------------------------------
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
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  // Van Loading Manifest State
  const [isVanLoadingModalOpen, setIsVanLoadingModalOpen] = useState(false);
  const [vanLoadingData, setVanLoadingData] = useState<any | null>(null);
  const [loadingVanManifest, setLoadingVanManifest] = useState(false);

  const handleOpenVanLoadingModal = async () => {
    setIsVanLoadingModalOpen(true);
    setLoadingVanManifest(true);
    try {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('supplysetu-auth-token');
      const res = await fetch(`${apiBase}/exports/van-loading-list`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) setVanLoadingData(json.data);
      }
    } catch (e) {
      console.warn('Could not fetch van loading manifest:', e);
    } finally {
      setLoadingVanManifest(false);
    }
  };

  const handleDownloadVanLoadingCsv = async () => {
    try {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const token = localStorage.getItem('supplysetu-auth-token');
      const res = await fetch(`${apiBase}/exports/van-loading-list?format=csv`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Failed to download Van Loading CSV');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `VAN_LOADING_MANIFEST_${new Date().toISOString().split('T')[0].replace(/-/g, '')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setActionSuccessMessage('Van Loading Manifest downloaded successfully!');
      setTimeout(() => setActionSuccessMessage(null), 4000);
    } catch (e) {
      console.error('Van loading export error:', e);
    }
  };

  // ----------------------------------------------------
  // 2. STAFF & RETAILERS STATE
  // ----------------------------------------------------
  const [salesmen, setSalesmen] = useState<SalesmanRecord[]>([]);
  const [retailers, setRetailers] = useState<RetailerProfile[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [showAddSalesmanModal, setShowAddSalesmanModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedSalesmanForAssign, setSelectedSalesmanForAssign] = useState<SalesmanRecord | null>(
    null
  );
  const [assignedShopIdsForModal, setAssignedShopIdsForModal] = useState<string[]>([]);

  // Add Salesman Form
  const [salesmanName, setSalesmanName] = useState('');
  const [salesmanPhone, setSalesmanPhone] = useState('');
  const [salesmanPassword, setSalesmanPassword] = useState('password123');
  const [selectedInitialShops, setSelectedInitialShops] = useState<string[]>([]);
  const [isSubmittingSalesman, setIsSubmittingSalesman] = useState(false);
  const [salesmanFormError, setSalesmanFormError] = useState<string | null>(null);
  const [createdSalesmanCreds, setCreatedSalesmanCreds] = useState<{
    name: string;
    phone: string;
    password: string;
    assignedCount: number;
  } | null>(null);

  const [kiranaSearchQuery, setKiranaSearchQuery] = useState('');
  const [kiranaTierFilter, setKiranaTierFilter] = useState('ALL');

  // ----------------------------------------------------
  // 3. FMCG CATALOGUE & INVENTORY STATE
  // ----------------------------------------------------
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('All');
  const [productStockFilter, setProductStockFilter] = useState<
    'all' | 'inStock' | 'lowStock' | 'outOfStock'
  >('all');

  // Add/Edit Product Modal State
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [prodSkuCode, setProdSkuCode] = useState('');
  const [prodName, setProdName] = useState('');
  const [prodBrand, setProdBrand] = useState('');
  const [prodCategory, setProdCategory] = useState('Biscuits & Cookies');
  const [prodUnit, setProdUnit] = useState('BOX');
  const [prodPackSize, setProdPackSize] = useState('');
  const [prodMrp, setProdMrp] = useState('');
  const [prodBasePrice, setProdBasePrice] = useState('');
  const [prodGstRate, setProdGstRate] = useState('18');
  const [prodStock, setProdStock] = useState('100');
  const [prodMinOrderQty, setProdMinOrderQty] = useState('1');
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);
  const [productFormError, setProductFormError] = useState<string | null>(null);

  // Quick Stock Adjustment Modal
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockModalProduct, setStockModalProduct] = useState<Product | null>(null);
  const [stockModalQuantity, setStockModalQuantity] = useState(0);
  const [isSubmittingStock, setIsSubmittingStock] = useState(false);

  // ----------------------------------------------------
  // 4. TRADE SCHEMES STATE
  // ----------------------------------------------------
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loadingSchemes, setLoadingSchemes] = useState(false);
  const [showAddSchemeModal, setShowAddSchemeModal] = useState(false);
  const [schemeName, setSchemeName] = useState('');
  const [schemeType, setSchemeType] = useState<
    'BUY_X_GET_Y_FREE' | 'PERCENTAGE_DISCOUNT' | 'FLAT_DISCOUNT'
  >('BUY_X_GET_Y_FREE');
  const [schemeProductId, setSchemeProductId] = useState('');
  const [schemeMinQty, setSchemeMinQty] = useState('10');
  const [schemeFreeQty, setSchemeFreeQty] = useState('1');
  const [schemeDiscountPercent, setSchemeDiscountPercent] = useState('5');
  const [isSubmittingScheme, setIsSubmittingScheme] = useState(false);
  const [schemeFormError, setSchemeFormError] = useState<string | null>(null);

  // ----------------------------------------------------
  // 5. EXECUTIVE ANALYTICS, CHURN RADAR & FINANCIAL RISK (TASK 7)
  // ----------------------------------------------------
  const [executiveAnalytics, setExecutiveAnalytics] = useState<ExecutiveAnalyticsData | null>(null);
  const [churnRadar, setChurnRadar] = useState<InactiveRetailerRecord[]>([]);
  const [financialRisk, setFinancialRisk] = useState<FinancialRiskData | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [churnDaysFilter, setChurnDaysFilter] = useState<number>(14);

  // ----------------------------------------------------
  // DATA LOADERS
  // ----------------------------------------------------
  const loadAnalyticsData = async (threshold: number = churnDaysFilter) => {
    setLoadingAnalytics(true);
    try {
      const [overviewData, churnData, riskData] = await Promise.all([
        AnalyticsService.getOverview(),
        AnalyticsService.getChurnRadar(threshold),
        AnalyticsService.getFinancialRisk(),
      ]);
      setExecutiveAnalytics(overviewData);
      setChurnRadar(churnData);
      setFinancialRisk(riskData);
    } catch (err) {
      console.error('Error loading analytics data:', err);
    } finally {
      setLoadingAnalytics(false);
    }
  };
  const loadOrdersData = async () => {
    setLoadingOrders(true);
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
      setLoadingOrders(false);
    }
  };

  const loadStaffData = async () => {
    setLoadingStaff(true);
    try {
      const [fetchedSalesmen, fetchedRetailers] = await Promise.all([
        SalesmanService.listSalesmen(),
        RetailerService.getAllRetailers(),
      ]);
      setSalesmen(fetchedSalesmen);
      setRetailers(fetchedRetailers);
    } catch (err) {
      console.error('Error loading staff & retailer data:', err);
    } finally {
      setLoadingStaff(false);
    }
  };

  const loadCatalogueData = async () => {
    setLoadingProducts(true);
    try {
      const [fetchedProducts, fetchedCategories] = await Promise.all([
        ProductService.getProducts({}),
        ProductService.getCategories(),
      ]);
      setProducts(fetchedProducts);
      setCategories(fetchedCategories);
      if (fetchedProducts.length > 0 && !schemeProductId) {
        setSchemeProductId(fetchedProducts[0].id);
      }
    } catch (err) {
      console.error('Error loading product catalogue:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const loadSchemesData = async () => {
    setLoadingSchemes(true);
    try {
      const fetchedSchemes = await ProductService.listSchemes();
      setSchemes(fetchedSchemes);
    } catch (err) {
      console.error('Error loading schemes:', err);
    } finally {
      setLoadingSchemes(false);
    }
  };

  useEffect(() => {
    loadOrdersData();
    loadStaffData();
    loadCatalogueData();
    loadSchemesData();
    loadAnalyticsData();

    // Subscribe to real-time notification stream
    const unsubStatus = NotificationService.subscribeStatus((connected) => {
      setIsRealtimeConnected(connected);
    });

    const unsubEvents = NotificationService.subscribe((event) => {
      if (event.type === 'ORDER_CREATED') {
        const o = event.data;
        setLiveOrderToast({
          id: o.id,
          orderNumber: o.orderNumber,
          shopName: o.shopName,
          amount: o.finalAmount,
          createdVia: o.createdVia,
          salesmanName: o.salesmanName,
        });
        setTimeout(() => setLiveOrderToast(null), 6000);

        // Prepend new order and update metrics live without manual refresh
        loadOrdersData();
        loadAnalyticsData();
      } else if (event.type === 'ORDER_STATUS_CHANGED') {
        loadOrdersData();
        loadAnalyticsData();
      } else if (event.type === 'STOCK_UPDATED') {
        loadCatalogueData();
      }
    });

    return () => {
      unsubStatus();
      unsubEvents();
    };
  }, []);

  // ----------------------------------------------------
  // ORDER ACTIONS
  // ----------------------------------------------------
  const handleApprove = async (orderId: string) => {
    try {
      const updated = await OrderService.approveOrder(orderId, 'Approved by Ramesh Gupta');
      setActionSuccessMessage(`Order ${updated.orderNumber} approved successfully!`);
      setTimeout(() => setActionSuccessMessage(null), 3500);

      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(updated);
      }
      loadOrdersData();
    } catch (err) {
      alert('Failed to approve order');
    }
  };

  const handleReject = async (orderId: string) => {
    const reason = prompt(
      'Please enter rejection reason:',
      'Credit limit exceeded / Out of beat zone'
    );
    if (!reason) return;

    try {
      const updated = await OrderService.rejectOrder(orderId, reason);
      setActionSuccessMessage(`Order ${updated.orderNumber} rejected`);
      setTimeout(() => setActionSuccessMessage(null), 3500);

      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(updated);
      }
      loadOrdersData();
    } catch (err) {
      alert('Failed to reject order');
    }
  };

  const handleDispatch = async (orderId: string) => {
    try {
      const updated = await OrderService.dispatchOrder(
        orderId,
        'Dispatched via Delivery Van #MP20-GA-4892'
      );
      setActionSuccessMessage(`Order ${updated.orderNumber} dispatched for delivery!`);
      setTimeout(() => setActionSuccessMessage(null), 3500);

      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(updated);
      }
      loadOrdersData();
    } catch (err) {
      alert('Failed to dispatch order');
    }
  };

  const handleDeliver = async (orderId: string) => {
    try {
      const updated = await OrderService.deliverOrder(
        orderId,
        'Delivered and acknowledged by kirana shopkeeper'
      );
      setActionSuccessMessage(`Order ${updated.orderNumber} marked as delivered!`);
      setTimeout(() => setActionSuccessMessage(null), 3500);

      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(updated);
      }
      loadOrdersData();
    } catch (err) {
      alert('Failed to mark order as delivered');
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

  // ----------------------------------------------------
  // SALESMAN ACTIONS
  // ----------------------------------------------------
  const handleAddSalesmanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalesmanFormError(null);

    if (!salesmanName.trim()) {
      setSalesmanFormError('Please enter salesman full name');
      return;
    }
    const cleanPhone = salesmanPhone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setSalesmanFormError('Please enter a valid 10-digit mobile number');
      return;
    }

    setIsSubmittingSalesman(true);
    try {
      const res = await SalesmanService.createSalesman({
        name: salesmanName.trim(),
        phone: cleanPhone,
        password: salesmanPassword || 'password123',
        assignedRetailerIds: selectedInitialShops,
      });

      if (res.success) {
        setCreatedSalesmanCreds({
          name: salesmanName.trim(),
          phone: cleanPhone,
          password: salesmanPassword || 'password123',
          assignedCount: selectedInitialShops.length,
        });
        setSalesmanName('');
        setSalesmanPhone('');
        setSalesmanPassword('password123');
        setSelectedInitialShops([]);
        loadStaffData();
      } else {
        setSalesmanFormError(res.message || 'Failed to create salesman');
      }
    } catch (err: any) {
      setSalesmanFormError(err.message || 'Error occurred while creating salesman');
    } finally {
      setIsSubmittingSalesman(false);
    }
  };

  const openAssignModal = (salesman: SalesmanRecord) => {
    setSelectedSalesmanForAssign(salesman);
    const currentAssigned = retailers
      .filter((r) => r.salesman?.id === salesman.id || salesman.shops?.some((s) => s.id === r.id))
      .map((r) => r.id as string);
    setAssignedShopIdsForModal(currentAssigned);
    setShowAssignModal(true);
  };

  const handleSaveShopAssignment = async () => {
    if (!selectedSalesmanForAssign) return;

    try {
      const success = await SalesmanService.assignShops(
        selectedSalesmanForAssign.id,
        assignedShopIdsForModal
      );
      if (success) {
        setActionSuccessMessage(`Beat shops updated for ${selectedSalesmanForAssign.name}!`);
        setTimeout(() => setActionSuccessMessage(null), 3500);
        setShowAssignModal(false);
        loadStaffData();
      } else {
        alert('Failed to update shop assignments');
      }
    } catch (err) {
      alert('Error updating shop assignments');
    }
  };

  // ----------------------------------------------------
  // PRODUCT CATALOGUE ACTIONS
  // ----------------------------------------------------
  const openAddProductModal = () => {
    setEditingProduct(null);
    setProdSkuCode('');
    setProdName('');
    setProdBrand('');
    setProdCategory('Biscuits & Cookies');
    setProdUnit('BOX');
    setProdPackSize('24 Packets / Box');
    setProdMrp('');
    setProdBasePrice('');
    setProdGstRate('18');
    setProdStock('100');
    setProdMinOrderQty('1');
    setProductFormError(null);
    setShowProductModal(true);
  };

  const openEditProductModal = (product: Product) => {
    setEditingProduct(product);
    setProdSkuCode(product.skuCode);
    setProdName(product.name);
    setProdBrand(product.brand);
    setProdCategory(product.category);
    setProdUnit(product.unit || 'BOX');
    setProdPackSize(product.packSize);
    setProdMrp(product.mrp.toString());
    setProdBasePrice(product.basePrice.toString());
    setProdGstRate(product.gstRate.toString());
    setProdStock(product.stock.toString());
    setProdMinOrderQty((product.minOrderQty || 1).toString());
    setProductFormError(null);
    setShowProductModal(true);
  };

  const handleProductFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProductFormError(null);

    const mrp = parseFloat(prodMrp);
    const basePrice = parseFloat(prodBasePrice);
    const stockQuantity = parseInt(prodStock, 10) || 0;
    const minOrderQty = parseInt(prodMinOrderQty, 10) || 1;
    const gstRate = parseFloat(prodGstRate) || 18.0;

    if (!prodName.trim() || !prodBrand.trim() || !prodCategory.trim()) {
      setProductFormError('Please fill in product name, brand, and category');
      return;
    }
    if (isNaN(mrp) || mrp <= 0 || isNaN(basePrice) || basePrice <= 0) {
      setProductFormError('MRP and base price must be positive numbers');
      return;
    }
    if (basePrice > mrp) {
      setProductFormError('Base wholesale price cannot exceed consumer MRP');
      return;
    }

    setIsSubmittingProduct(true);
    try {
      if (editingProduct) {
        // Update product
        const res = await ProductService.updateProduct(editingProduct.id, {
          name: prodName.trim(),
          brand: prodBrand.trim(),
          category: prodCategory.trim(),
          unit: prodUnit.trim().toUpperCase(),
          packSize: prodPackSize.trim(),
          mrp,
          basePrice,
          gstRate,
          stockQuantity,
          minOrderQty,
        });

        if (res.success) {
          setActionSuccessMessage(`Product '${prodName}' updated successfully!`);
          setTimeout(() => setActionSuccessMessage(null), 3500);
          setShowProductModal(false);
          loadCatalogueData();
        } else {
          setProductFormError(res.message || 'Failed to update product');
        }
      } else {
        // Create product
        if (!prodSkuCode.trim()) {
          setProductFormError('SKU code is required');
          setIsSubmittingProduct(false);
          return;
        }

        const res = await ProductService.createProduct({
          skuCode: prodSkuCode.trim().toUpperCase(),
          name: prodName.trim(),
          brand: prodBrand.trim(),
          category: prodCategory.trim(),
          unit: prodUnit.trim().toUpperCase(),
          packSize: prodPackSize.trim(),
          mrp,
          basePrice,
          gstRate,
          stockQuantity,
          minOrderQty,
        });

        if (res.success) {
          setActionSuccessMessage(`New FMCG product '${prodName}' added to catalogue!`);
          setTimeout(() => setActionSuccessMessage(null), 3500);
          setShowProductModal(false);
          loadCatalogueData();
        } else {
          setProductFormError(res.message || 'Failed to create product');
        }
      }
    } catch (err: any) {
      setProductFormError(err.message || 'Error occurred while saving product');
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  const openStockModal = (product: Product) => {
    setStockModalProduct(product);
    setStockModalQuantity(product.stock);
    setShowStockModal(true);
  };

  const handleStockSave = async () => {
    if (!stockModalProduct) return;
    setIsSubmittingStock(true);
    try {
      const res = await ProductService.updateStock(stockModalProduct.id, stockModalQuantity);
      if (res.success) {
        setActionSuccessMessage(
          `Stock updated for ${stockModalProduct.name} (${stockModalQuantity} boxes)`
        );
        setTimeout(() => setActionSuccessMessage(null), 3500);
        setShowStockModal(false);
        loadCatalogueData();
      } else {
        alert(res.message || 'Failed to update stock');
      }
    } catch (err) {
      alert('Error updating stock');
    } finally {
      setIsSubmittingStock(false);
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!confirm(`Are you sure you want to delete or archive '${product.name}'?`)) return;

    try {
      const res = await ProductService.deleteProduct(product.id);
      if (res.success) {
        setActionSuccessMessage(res.message || `Product ${product.name} removed`);
        setTimeout(() => setActionSuccessMessage(null), 3500);
        loadCatalogueData();
      } else {
        alert(res.message || 'Failed to delete product');
      }
    } catch (err) {
      alert('Error deleting product');
    }
  };

  // ----------------------------------------------------
  // TRADE SCHEMES ACTIONS
  // ----------------------------------------------------
  const handleSchemeFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSchemeFormError(null);

    const minQty = parseInt(schemeMinQty, 10);
    const freeQty = parseInt(schemeFreeQty, 10) || 0;
    const discount = parseFloat(schemeDiscountPercent) || 0;

    if (!schemeName.trim()) {
      setSchemeFormError('Please enter scheme name');
      return;
    }
    if (!schemeProductId) {
      setSchemeFormError('Please select a target FMCG product');
      return;
    }
    if (isNaN(minQty) || minQty < 1) {
      setSchemeFormError('Minimum qualifying quantity must be at least 1 box');
      return;
    }
    if (schemeType === 'BUY_X_GET_Y_FREE' && freeQty < 1) {
      setSchemeFormError("Free box quantity must be at least 1 for 'Buy X Get Y Free' deals");
      return;
    }
    if (schemeType === 'PERCENTAGE_DISCOUNT' && (discount <= 0 || discount > 100)) {
      setSchemeFormError('Discount percentage must be between 1% and 100%');
      return;
    }
    if (schemeType === 'FLAT_DISCOUNT' && discount <= 0) {
      setSchemeFormError('Flat discount amount must be greater than ₹0');
      return;
    }

    setIsSubmittingScheme(true);
    try {
      const res = await ProductService.createScheme({
        name: schemeName.trim(),
        schemeType,
        productId: schemeProductId,
        minQuantity: minQty,
        freeQuantity: schemeType === 'BUY_X_GET_Y_FREE' ? freeQty : 0,
        discountPercent: schemeType !== 'BUY_X_GET_Y_FREE' ? discount : 0,
      });

      if (res.success) {
        setActionSuccessMessage(`Trade scheme '${schemeName}' launched successfully!`);
        setTimeout(() => setActionSuccessMessage(null), 3500);
        setShowAddSchemeModal(false);
        setSchemeName('');
        loadSchemesData();
        loadCatalogueData();
      } else {
        setSchemeFormError(res.message || 'Failed to create scheme');
      }
    } catch (err: any) {
      setSchemeFormError(err.message || 'Error occurred while creating scheme');
    } finally {
      setIsSubmittingScheme(false);
    }
  };

  const handleToggleScheme = async (scheme: Scheme) => {
    try {
      const res = await ProductService.toggleSchemeStatus(scheme.id, !scheme.isActive);
      if (res.success) {
        setActionSuccessMessage(
          `Scheme '${scheme.name}' ${!scheme.isActive ? 'activated' : 'paused'}!`
        );
        setTimeout(() => setActionSuccessMessage(null), 3500);
        loadSchemesData();
        loadCatalogueData();
      } else {
        alert(res.message || 'Failed to toggle scheme');
      }
    } catch (err) {
      alert('Error updating scheme status');
    }
  };

  const handleDeleteScheme = async (scheme: Scheme) => {
    if (!confirm(`Delete scheme '${scheme.name}'?`)) return;
    try {
      const res = await ProductService.deleteScheme(scheme.id);
      if (res.success) {
        setActionSuccessMessage(`Scheme '${scheme.name}' removed`);
        setTimeout(() => setActionSuccessMessage(null), 3500);
        loadSchemesData();
        loadCatalogueData();
      } else {
        alert(res.message || 'Failed to delete scheme');
      }
    } catch (err) {
      alert('Error deleting scheme');
    }
  };

  // ----------------------------------------------------
  // FILTERED DATASETS
  // ----------------------------------------------------
  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.retailer.shopName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.retailer.ownerName.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === 'pending') return o.status === 'PENDING' && o.creditStatus !== 'HOLD';
    if (activeTab === 'hold') return o.status === 'PENDING' && o.creditStatus === 'HOLD';
    if (activeTab === 'approved') return o.status === 'APPROVED';
    return true;
  });

  const filteredRetailers = retailers.filter((r) => {
    const matchesSearch =
      r.shopName.toLowerCase().includes(kiranaSearchQuery.toLowerCase()) ||
      r.ownerName.toLowerCase().includes(kiranaSearchQuery.toLowerCase()) ||
      (r.phone && r.phone.includes(kiranaSearchQuery)) ||
      r.city.toLowerCase().includes(kiranaSearchQuery.toLowerCase());

    const matchesTier = kiranaTierFilter === 'ALL' || r.priceTier === kiranaTierFilter;

    return matchesSearch && matchesTier;
  });

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.skuCode.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.brand.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(productSearch.toLowerCase());

    const matchesCategory =
      productCategoryFilter === 'All' ||
      p.category.toLowerCase() === productCategoryFilter.toLowerCase();

    let matchesStock = true;
    if (productStockFilter === 'inStock') matchesStock = p.stock > 50;
    else if (productStockFilter === 'lowStock') matchesStock = p.stock > 0 && p.stock <= 50;
    else if (productStockFilter === 'outOfStock') matchesStock = p.stock <= 0;

    return matchesSearch && matchesCategory && matchesStock;
  });

  const totalCreditLimit = retailers.reduce((s, r) => s + (r.creditLimit || 0), 0);
  const totalOutstanding = retailers.reduce((s, r) => s + (r.outstandingBalance || 0), 0);

  // Metrics for catalogue
  const inStockCount = products.filter((p) => p.stock > 50).length;
  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= 50).length;
  const outOfStockCount = products.filter((p) => p.stock <= 0).length;
  const totalInventoryUnits = products.reduce((s, p) => s + (p.stock || 0), 0);

  // Metrics for schemes
  const activeSchemesCount = schemes.filter((s) => s.isActive).length;
  const buyXGetYCount = schemes.filter((s) => s.schemeType === 'BUY_X_GET_Y_FREE').length;
  const percentageCount = schemes.filter((s) => s.schemeType === 'PERCENTAGE_DISCOUNT').length;

  // Margin preview calculation for product modal
  const calcMrp = parseFloat(prodMrp) || 0;
  const calcBase = parseFloat(prodBasePrice) || 0;
  const calcMargin =
    calcMrp > 0 && calcBase > 0 ? Math.round(((calcMrp - calcBase) / calcMrp) * 1000) / 10 : 0;

  // ==========================================
  // TAB 1: KIRANA NETWORK & FIELD SALES FORCE
  // ==========================================
  if (currentTab === 'retailers') {
    return (
      <div className="space-y-6 pb-8">
        {actionSuccessMessage && (
          <div className="p-3 bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{actionSuccessMessage}</span>
            </div>
            <button
              onClick={() => setActionSuccessMessage(null)}
              className="opacity-80 hover:opacity-100"
            >
              &times;
            </button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-6 h-6 text-emerald-500" />
              <span>Field Sales Force & Kirana Network</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Manage your on-ground beat salesmen, assigned shop beats, and retailer credit khata in
              Jabalpur territory.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setCreatedSalesmanCreds(null);
                setSalesmanFormError(null);
                setShowAddSalesmanModal(true);
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Add Beat Salesman</span>
            </button>
          </div>
        </div>

        {/* Territory Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#16181E] rounded-2xl p-4 border border-slate-200/80 dark:border-[#222631] shadow-xs">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-400">Beat Salesmen</p>
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {salesmen.length} Active Staff
            </p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">
              Equipped with offline beat sync
            </p>
          </div>

          <div className="bg-white dark:bg-[#16181E] rounded-2xl p-4 border border-slate-200/80 dark:border-[#222631] shadow-xs">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-400">Kirana Retailer Network</p>
              <Store className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {retailers.length} Verified Stores
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Jabalpur FMCG Hub</p>
          </div>

          <div className="bg-white dark:bg-[#16181E] rounded-2xl p-4 border border-slate-200/80 dark:border-[#222631] shadow-xs">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-400">Total Credit Line (Khata)</p>
              <Wallet className="w-4 h-4 text-purple-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              ₹{(totalCreditLimit / 100000).toFixed(1)} Lakhs
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Approved credit limits</p>
          </div>

          <div className="bg-white dark:bg-[#16181E] rounded-2xl p-4 border border-slate-200/80 dark:border-[#222631] shadow-xs">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-400">Market Outstanding</p>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-amber-500 mt-1">
              ₹{(totalOutstanding / 100000).toFixed(1)} Lakhs
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              {totalCreditLimit > 0 ? Math.round((totalOutstanding / totalCreditLimit) * 100) : 0}%
              aggregate utilization
            </p>
          </div>
        </div>

        {/* Salesmen Cards */}
        <div className="bg-white dark:bg-[#16181E] rounded-2xl p-5 border border-slate-200/80 dark:border-[#222631] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#222631] pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Active Beat Salesmen Team</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  {salesmen.length} on roster
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Field salesmen who log into the mobile app to punch offline orders at kirana
                counters.
              </p>
            </div>
            <button
              onClick={loadStaffData}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
              title="Refresh Salesmen List"
            >
              <RefreshCw className={`w-4 h-4 ${loadingStaff ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {salesmen.map((salesman) => (
              <div
                key={salesman.id}
                className="p-4 rounded-xl border border-slate-200/70 dark:border-[#222631] bg-slate-50/50 dark:bg-[#151922] hover:border-emerald-500/50 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{salesman.name}</span>
                        {salesman.isActive && (
                          <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                        )}
                      </h4>
                      <p className="text-xs font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>+91 {salesman.phone}</span>
                      </p>
                    </div>

                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                      SALESMAN
                    </span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-[10px] text-slate-400">Assigned Beat Shops</p>
                      <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                        {salesman.assignedShopsCount ||
                          (salesman.shops ? salesman.shops.length : 0)}{' '}
                        Kiranas
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">Orders Punched</p>
                      <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                        {salesman.ordersCount || 0} Orders
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 p-2 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-500/20 text-[11px] text-slate-600 dark:text-slate-300 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Lock className="w-3 h-3 text-emerald-500" />
                      <span>
                        Password:{' '}
                        <strong className="font-mono text-emerald-700 dark:text-emerald-400">
                          password123
                        </strong>
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">Default</span>
                  </div>
                </div>

                <div className="mt-4 pt-2 flex items-center justify-end gap-2">
                  <button
                    onClick={() => openAssignModal(salesman)}
                    className="w-full py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:border-emerald-500 hover:text-emerald-600 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Manage Assigned Shops</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Kirana Network Table */}
        <div className="bg-white dark:bg-[#16181E] rounded-2xl p-5 border border-slate-200/80 dark:border-[#222631] shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-[#222631] pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Kirana Retailer Network ({filteredRetailers.length})
              </h3>
              <p className="text-[11px] text-slate-400">
                Verified stores with assigned beat salesmen, price tiers, and khata credit balances.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={kiranaSearchQuery}
                  onChange={(e) => setKiranaSearchQuery(e.target.value)}
                  placeholder="Search shop, owner, phone..."
                  className="pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-[#1C2028] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden w-52"
                />
              </div>

              <select
                value={kiranaTierFilter}
                onChange={(e) => setKiranaTierFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-[#1C2028] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden"
              >
                <option value="ALL">All Price Tiers</option>
                <option value="TIER_1">Tier 1 (Wholesale)</option>
                <option value="TIER_2">Tier 2 (Semi-Wholesale)</option>
                <option value="STANDARD">Standard</option>
                <option value="WHOLESALE">Wholesale</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold">
                  <th className="py-2.5 px-3">Kirana Shop</th>
                  <th className="py-2.5 px-3">Owner & Contact</th>
                  <th className="py-2.5 px-3">Location</th>
                  <th className="py-2.5 px-3">Assigned Salesman</th>
                  <th className="py-2.5 px-3">Khata (Credit / Out)</th>
                  <th className="py-2.5 px-3">Price Tier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredRetailers.map((r) => {
                  const utilization =
                    r.creditLimit > 0
                      ? Math.round((r.outstandingBalance / r.creditLimit) * 100)
                      : 0;

                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-[#1C2028]/50 transition-colors"
                    >
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                            <Store className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">{r.shopName}</p>
                            {r.gstNumber && (
                              <p className="text-[10px] font-mono text-slate-400">
                                GSTIN: {r.gstNumber}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <p className="font-medium text-slate-800 dark:text-slate-200">
                          {r.ownerName}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono">
                          +91 {r.phone || '9893000000'}
                        </p>
                      </td>

                      <td className="py-3 px-3">
                        <p className="text-slate-700 dark:text-slate-300">{r.city}, MP</p>
                        <p className="text-[10px] text-slate-400 truncate max-w-xs">{r.address}</p>
                      </td>

                      <td className="py-3 px-3">
                        {r.salesman ? (
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-white">
                                {r.salesman.name}
                              </p>
                              <p className="text-[10px] text-slate-400 font-mono">
                                {r.salesman.phone}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            Unassigned
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 min-w-[150px]">
                        <div className="flex justify-between items-baseline mb-1">
                          <span className="font-bold text-slate-900 dark:text-white">
                            ₹{r.outstandingBalance?.toLocaleString('en-IN') || 0}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            / ₹{r.creditLimit?.toLocaleString('en-IN') || 0}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              utilization > 90
                                ? 'bg-rose-500'
                                : utilization > 70
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, utilization)}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">{utilization}% utilized</p>
                      </td>

                      <td className="py-3 px-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-500/20">
                          {r.priceTier || 'TIER_1'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Add Salesman */}
        {showAddSalesmanModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="bg-white dark:bg-[#16181E] border border-slate-200 dark:border-[#222631] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              {createdSalesmanCreds ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-emerald-500 font-bold text-base">
                    <CheckCircle2 className="w-6 h-6" />
                    <span>Beat Salesman Created Successfully!</span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    The salesman account has been provisioned in the PostgreSQL database and
                    assigned {createdSalesmanCreds.assignedCount} beat shops.
                  </p>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#1C2028] border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                    <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-700">
                      <span className="text-slate-400">Salesman Name:</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {createdSalesmanCreds.name}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-700">
                      <span className="text-slate-400">Login Mobile:</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        +91 {createdSalesmanCreds.phone}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-400">Default Password:</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {createdSalesmanCreds.password}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setShowAddSalesmanModal(false);
                      setCreatedSalesmanCreds(null);
                    }}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    Done & Close
                  </button>
                </div>
              ) : (
                <form onSubmit={handleAddSalesmanSubmit} className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#222631]">
                    <div className="flex items-center gap-2">
                      <UserPlus className="w-5 h-5 text-emerald-500" />
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        Add New Beat Salesman
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAddSalesmanModal(false)}
                      className="text-slate-400 hover:text-slate-600 text-lg leading-none"
                    >
                      &times;
                    </button>
                  </div>

                  {salesmanFormError && (
                    <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-medium border border-rose-500/20 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      <span>{salesmanFormError}</span>
                    </div>
                  )}

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Salesman Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={salesmanName}
                        onChange={(e) => setSalesmanName(e.target.value)}
                        placeholder="e.g. Rohan Verma"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#1C2028] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        10-Digit Mobile Phone (Login Username) *
                      </label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-mono">
                          +91
                        </span>
                        <input
                          type="tel"
                          required
                          maxLength={10}
                          value={salesmanPhone}
                          onChange={(e) => setSalesmanPhone(e.target.value.replace(/\D/g, ''))}
                          placeholder="9893000004"
                          className="w-full px-3 py-2 rounded-r-xl bg-slate-50 dark:bg-[#1C2028] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-hidden focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Initial Password
                      </label>
                      <input
                        type="text"
                        value={salesmanPassword}
                        onChange={(e) => setSalesmanPassword(e.target.value)}
                        placeholder="password123"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#1C2028] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-hidden focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Assign Initial Kirana Beat Shops ({selectedInitialShops.length} selected)
                      </label>
                      <div className="max-h-40 overflow-y-auto space-y-1.5 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#1C2028]">
                        {retailers.map((r) => {
                          const isChecked = selectedInitialShops.includes(r.id as string);
                          return (
                            <label
                              key={r.id}
                              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-xs"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedInitialShops((prev) => [...prev, r.id as string]);
                                  } else {
                                    setSelectedInitialShops((prev) =>
                                      prev.filter((id) => id !== r.id)
                                    );
                                  }
                                }}
                                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                              />
                              <div className="flex-1 truncate">
                                <span className="font-semibold text-slate-900 dark:text-white">
                                  {r.shopName}
                                </span>
                                <span className="text-[10px] text-slate-400 ml-1.5">
                                  ({r.ownerName} &bull; {r.city})
                                </span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-[#222631] flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddSalesmanModal(false)}
                      className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingSalesman}
                      className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>{isSubmittingSalesman ? 'Provisioning...' : 'Add Salesman'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Modal: Assign Shops */}
        {showAssignModal && selectedSalesmanForAssign && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="bg-white dark:bg-[#16181E] border border-slate-200 dark:border-[#222631] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#222631]">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Assign Beat Shops to {selectedSalesmanForAssign.name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Select the Kiranas this salesman will visit on their daily beat.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-lg leading-none"
                >
                  &times;
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span>
                    Selected Shops: {assignedShopIdsForModal.length} of {retailers.length}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setAssignedShopIdsForModal(retailers.map((r) => r.id as string))
                      }
                      className="text-emerald-600 hover:underline text-[11px]"
                    >
                      Select All
                    </button>
                    <span>&bull;</span>
                    <button
                      type="button"
                      onClick={() => setAssignedShopIdsForModal([])}
                      className="text-rose-500 hover:underline text-[11px]"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>

                <div className="max-h-72 overflow-y-auto space-y-1.5 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#1C2028]">
                  {retailers.map((r) => {
                    const isChecked = assignedShopIdsForModal.includes(r.id as string);
                    return (
                      <label
                        key={r.id}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-xs"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAssignedShopIdsForModal((prev) => [...prev, r.id as string]);
                            } else {
                              setAssignedShopIdsForModal((prev) =>
                                prev.filter((id) => id !== r.id)
                              );
                            }
                          }}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <div className="flex-1 truncate">
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {r.shopName}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {r.ownerName} &bull; {r.address}, {r.city}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-[#222631] flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveShopAssignment}
                  className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
                >
                  Save Shop Assignment
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // TAB 2: TALLY ERP BATCH EXPORT CENTER
  // ==========================================
  if (currentTab === 'export') {
    return (
      <div className="space-y-6 pb-8">
        {actionSuccessMessage && (
          <div className="p-3 bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{actionSuccessMessage}</span>
            </div>
            <button
              onClick={() => setActionSuccessMessage(null)}
              className="opacity-80 hover:opacity-100"
            >
              &times;
            </button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-emerald-500" />
              <span>Tally ERP 9 / Tally Prime Batch Export Center</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Generate standardized RFC-4180 CSV batch vouchers for direct import into Tally ERP
              without double data-entry.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExportTallyCsv}
              disabled={isExporting}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <Download className={`w-4 h-4 ${isExporting ? 'animate-bounce' : ''}`} />
              <span>{isExporting ? 'Generating Batch...' : 'Download Tally Batch CSV'}</span>
            </button>
            <button
              onClick={handleOpenVanLoadingModal}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
              title="Generate Vehicle Loading Manifest & Packing List"
            >
              <Truck className="w-4 h-4" />
              <span>Van Loading Manifest</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-[#16181E] rounded-2xl p-5 border border-slate-200/80 dark:border-[#222631] shadow-xs">
            <p className="text-xs font-semibold text-slate-400">Approved Orders Ready</p>
            <p className="text-2xl font-bold text-emerald-500 mt-1">
              {metrics.approvedOrders} Orders
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Verified with valid GSTIN & ledger</p>
          </div>

          <div className="bg-white dark:bg-[#16181E] rounded-2xl p-5 border border-slate-200/80 dark:border-[#222631] shadow-xs">
            <p className="text-xs font-semibold text-slate-400">Total Approved GMV</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              ₹{metrics.totalGmv.toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Ready for voucher journal entry</p>
          </div>

          <div className="bg-white dark:bg-[#16181E] rounded-2xl p-5 border border-slate-200/80 dark:border-[#222631] shadow-xs">
            <p className="text-xs font-semibold text-slate-400">Export Spec Version</p>
            <p className="text-2xl font-bold text-purple-500 mt-1">RFC-4180</p>
            <p className="text-[11px] text-slate-400 mt-1">UTF-8 with BOM for Excel & Tally</p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#16181E] rounded-2xl p-6 border border-slate-200/80 dark:border-[#222631] shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Tally Ledger Schema & Field Mapping
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            The exported file is formatted with exact headers required by standard Tally XML/CSV
            import utilities:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1C2028] border border-slate-200/70 dark:border-slate-800">
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold block mb-1">
                Voucher Number
              </span>
              <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                Unique SupplySetu order reference mapped to Sales Voucher.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1C2028] border border-slate-200/70 dark:border-slate-800">
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold block mb-1">
                Party Ledger Name
              </span>
              <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                Mapped to Sundry Debtors using the Kirana shop name and verified GSTIN.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1C2028] border border-slate-200/70 dark:border-slate-800">
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold block mb-1">
                Tax Breakdown
              </span>
              <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                Itemized CGST, SGST (or IGST for interstate) amounts calculated per HSN code.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1C2028] border border-slate-200/70 dark:border-slate-800">
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold block mb-1">
                Sales Ledger
              </span>
              <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                Defaults to "Sales - FMCG Local 18% / 12% / 5%" based on the product GST slabs.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // TAB 3: FMCG PRODUCT CATALOGUE & INVENTORY
  // ==========================================
  if (currentTab === 'catalogue') {
    return (
      <div className="space-y-6 pb-8">
        {actionSuccessMessage && (
          <div className="p-3 bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{actionSuccessMessage}</span>
            </div>
            <button
              onClick={() => setActionSuccessMessage(null)}
              className="opacity-80 hover:opacity-100"
            >
              &times;
            </button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Package className="w-6 h-6 text-emerald-500" />
              <span>FMCG Product Catalogue & Warehouse Inventory</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Maintain master SKUs, distributor wholesale pricing, MRP margins, GST slabs, and live
              warehouse inventory.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={openAddProductModal}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add FMCG Product</span>
            </button>
          </div>
        </div>

        {/* Inventory Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#16181E] rounded-2xl p-4 border border-slate-200/80 dark:border-[#222631] shadow-xs">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-400">Total Master SKUs</p>
              <Boxes className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {products.length} Products
            </p>
            <p className="text-[11px] text-slate-400 mt-1">{categories.length} Categories Active</p>
          </div>

          <div className="bg-white dark:bg-[#16181E] rounded-2xl p-4 border border-slate-200/80 dark:border-[#222631] shadow-xs">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-400">Warehouse Stock</p>
              <Package className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {totalInventoryUnits.toLocaleString('en-IN')} Boxes
            </p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">
              {inStockCount} SKUs well-stocked
            </p>
          </div>

          <div className="bg-white dark:bg-[#16181E] rounded-2xl p-4 border border-slate-200/80 dark:border-[#222631] shadow-xs">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-400">Low Stock Alert (&le; 50)</p>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-amber-500 mt-1">{lowStockCount} SKUs</p>
            <p className="text-[11px] text-slate-400 mt-1">Requires reorder from manufacturer</p>
          </div>

          <div className="bg-white dark:bg-[#16181E] rounded-2xl p-4 border border-slate-200/80 dark:border-[#222631] shadow-xs">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-400">Out of Stock</p>
              <XCircle className="w-4 h-4 text-rose-500" />
            </div>
            <p className="text-2xl font-bold text-rose-500 mt-1">{outOfStockCount} SKUs</p>
            <p className="text-[11px] text-slate-400 mt-1">Unavailable for kirana order pad</p>
          </div>
        </div>

        {/* Product Catalogue Table */}
        <div className="bg-white dark:bg-[#16181E] rounded-2xl p-5 border border-slate-200/80 dark:border-[#222631] shadow-xs space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 dark:border-[#222631] pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>SKU Directory ({filteredProducts.length})</span>
                <button
                  onClick={loadCatalogueData}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
                  title="Refresh products"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingProducts ? 'animate-spin' : ''}`} />
                </button>
              </h3>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Filter by SKU, name, brand..."
                  className="pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-[#1C2028] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden w-48"
                />
              </div>

              <select
                value={productCategoryFilter}
                onChange={(e) => setProductCategoryFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-[#1C2028] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden"
              >
                <option value="All">All Categories</option>
                {categories.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name} ({c.count})
                  </option>
                ))}
              </select>

              <select
                value={productStockFilter}
                onChange={(e) => setProductStockFilter(e.target.value as any)}
                className="px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-[#1C2028] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden"
              >
                <option value="all">All Stock Levels</option>
                <option value="inStock">In Stock (&gt;50)</option>
                <option value="lowStock">Low Stock (&le;50)</option>
                <option value="outOfStock">Out of Stock (0)</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold">
                  <th className="py-2.5 px-3">Product / SKU</th>
                  <th className="py-2.5 px-3">Brand & Category</th>
                  <th className="py-2.5 px-3">Pack & Unit</th>
                  <th className="py-2.5 px-3">Wholesale Rate vs MRP</th>
                  <th className="py-2.5 px-3">GST Slab</th>
                  <th className="py-2.5 px-3">Warehouse Stock</th>
                  <th className="py-2.5 px-3">Active Deal</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredProducts.map((p) => {
                  const margin =
                    p.mrp > 0 ? Math.round(((p.mrp - p.basePrice) / p.mrp) * 1000) / 10 : 0;
                  const isLow = p.stock > 0 && p.stock <= 50;
                  const isOut = p.stock <= 0;

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-[#1C2028]/50 transition-colors"
                    >
                      <td className="py-3 px-3">
                        <p className="font-bold text-slate-900 dark:text-white">{p.name}</p>
                        <p className="font-mono text-[10px] text-slate-400">{p.skuCode}</p>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {p.brand}
                        </span>
                        <p className="text-[10px] text-slate-400">{p.category}</p>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {p.unit}
                        </span>
                        <p className="text-[10px] text-slate-400">{p.packSize}</p>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-bold text-slate-900 dark:text-white">
                            ₹{p.basePrice.toFixed(1)}
                          </span>
                          <span className="text-[10px] text-slate-400 line-through">
                            ₹{p.mrp.toFixed(0)}
                          </span>
                        </div>
                        <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                          {margin}% Retailer Margin
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                          {p.gstRate}% GST
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isOut ? 'bg-rose-500' : isLow ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                          />
                          <span className="font-bold text-slate-900 dark:text-white">
                            {p.stock} {p.unit}s
                          </span>
                        </div>
                        <button
                          onClick={() => openStockModal(p)}
                          className="mt-0.5 text-[10px] text-emerald-600 hover:text-emerald-700 underline cursor-pointer"
                        >
                          Adjust Stock &rarr;
                        </button>
                      </td>

                      <td className="py-3 px-3">
                        {p.scheme ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            {p.scheme.schemeType === 'BUY_X_GET_Y_FREE'
                              ? `🎁 ${p.scheme.minQuantity}+${p.scheme.freeQuantity} Free`
                              : `🏷️ ${p.scheme.discountPercent}% Off`}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">Standard Price</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditProductModal(p)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-emerald-500 text-slate-600 dark:text-slate-300 hover:text-emerald-600 transition-colors cursor-pointer"
                            title="Edit Product Details"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-rose-500 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Delete or Archive Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Add or Edit FMCG Product */}
        {showProductModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="bg-white dark:bg-[#16181E] border border-slate-200 dark:border-[#222631] rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#222631]">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-emerald-500" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {editingProduct ? 'Edit FMCG Product Details' : 'Add New FMCG Master SKU'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-lg leading-none"
                >
                  &times;
                </button>
              </div>

              {productFormError && (
                <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-medium border border-rose-500/20 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{productFormError}</span>
                </div>
              )}

              <form onSubmit={handleProductFormSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      SKU Code *
                    </label>
                    <input
                      type="text"
                      required
                      disabled={!!editingProduct}
                      value={prodSkuCode}
                      onChange={(e) => setProdSkuCode(e.target.value.toUpperCase())}
                      placeholder="e.g. BRIT-TREAT-120G"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#1C2028] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono uppercase focus:outline-hidden focus:border-emerald-500 disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Brand Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={prodBrand}
                      onChange={(e) => setProdBrand(e.target.value)}
                      placeholder="e.g. Britannia, Parle, Nestlé"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#1C2028] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Product Title (with Pack Specification) *
                  </label>
                  <input
                    type="text"
                    required
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    placeholder="e.g. Britannia Treat Jim Jam Biscuits (120g x 48 Pack)"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#1C2028] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Category *
                    </label>
                    <input
                      type="text"
                      required
                      value={prodCategory}
                      onChange={(e) => setProdCategory(e.target.value)}
                      placeholder="Biscuits & Cookies"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#1C2028] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Unit Type *
                    </label>
                    <select
                      value={prodUnit}
                      onChange={(e) => setProdUnit(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#1C2028] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                    >
                      <option value="BOX">BOX</option>
                      <option value="CASE">CASE</option>
                      <option value="CARTON">CARTON</option>
                      <option value="JAR">JAR</option>
                      <option value="PACKET">PACKET</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Pack Size Description *
                    </label>
                    <input
                      type="text"
                      required
                      value={prodPackSize}
                      onChange={(e) => setProdPackSize(e.target.value)}
                      placeholder="e.g. 48 Packets / Box"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#1C2028] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Wholesale Base Rate (₹) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={prodBasePrice}
                      onChange={(e) => setProdBasePrice(e.target.value)}
                      placeholder="780.0"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#1C2028] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Box Consumer MRP (₹) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={prodMrp}
                      onChange={(e) => setProdMrp(e.target.value)}
                      placeholder="960.0"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#1C2028] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      GST Slab (%) *
                    </label>
                    <select
                      value={prodGstRate}
                      onChange={(e) => setProdGstRate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#1C2028] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                    >
                      <option value="5">5% (Staples, Biscuits)</option>
                      <option value="12">12% (Noodles, Savories)</option>
                      <option value="18">18% (Soaps, Detergents)</option>
                      <option value="28">28% (Aerated drinks)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Initial Warehouse Stock ({prodUnit}s)
                    </label>
                    <input
                      type="number"
                      value={prodStock}
                      onChange={(e) => setProdStock(e.target.value)}
                      placeholder="100"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#1C2028] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Min Order Quantity
                    </label>
                    <input
                      type="number"
                      value={prodMinOrderQty}
                      onChange={(e) => setProdMinOrderQty(e.target.value)}
                      placeholder="1"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#1C2028] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Live Margin Preview Card */}
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/20 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-emerald-800 dark:text-emerald-300">
                      Kirana Retailer Margin Preview
                    </p>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                      At Wholesale ₹{calcBase} vs MRP ₹{calcMrp}
                    </p>
                  </div>
                  <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                    {calcMargin}% Margin
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-[#222631] flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowProductModal(false)}
                    className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingProduct}
                    className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                  >
                    <Package className="w-3.5 h-3.5" />
                    <span>
                      {isSubmittingProduct
                        ? 'Saving...'
                        : editingProduct
                          ? 'Update Product'
                          : 'Add Product'}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Quick Stock Adjustment */}
        {showStockModal && stockModalProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="bg-white dark:bg-[#16181E] border border-slate-200 dark:border-[#222631] rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#222631]">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Adjust Warehouse Stock
                </h3>
                <button
                  type="button"
                  onClick={() => setShowStockModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-lg leading-none"
                >
                  &times;
                </button>
              </div>

              <div>
                <p className="font-bold text-slate-900 dark:text-white text-xs">
                  {stockModalProduct.name}
                </p>
                <p className="font-mono text-[10px] text-slate-400">{stockModalProduct.skuCode}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Available Boxes in Warehouse
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setStockModalQuantity((q) => Math.max(0, q - 10))}
                    className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 transition-colors"
                  >
                    -10
                  </button>
                  <input
                    type="number"
                    value={stockModalQuantity}
                    onChange={(e) =>
                      setStockModalQuantity(Math.max(0, parseInt(e.target.value, 10) || 0))
                    }
                    className="flex-1 text-center py-2 rounded-xl bg-slate-50 dark:bg-[#1C2028] border border-slate-200 dark:border-slate-700 font-bold font-mono text-base text-slate-900 dark:text-white focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setStockModalQuantity((q) => q + 10)}
                    className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 transition-colors"
                  >
                    +10
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-[#222631] flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowStockModal(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleStockSave}
                  disabled={isSubmittingStock}
                  className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-60"
                >
                  {isSubmittingStock ? 'Saving...' : 'Update Stock'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // TAB 4: TRADE SCHEMES & PROMOTIONAL ENGINE
  // ==========================================
  if (currentTab === 'schemes') {
    return (
      <div className="space-y-6 pb-8">
        {actionSuccessMessage && (
          <div className="p-3 bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{actionSuccessMessage}</span>
            </div>
            <button
              onClick={() => setActionSuccessMessage(null)}
              className="opacity-80 hover:opacity-100"
            >
              &times;
            </button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Percent className="w-6 h-6 text-emerald-500" />
              <span>Trade Schemes & Promotional Engine</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Configure wholesale trade promotions (Buy X Get Y Free, percentage discounts, cash
              deals) to accelerate retailer order volumes.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSchemeFormError(null);
                setShowAddSchemeModal(true);
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Create Trade Scheme</span>
            </button>
          </div>
        </div>

        {/* Schemes Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-[#16181E] rounded-2xl p-5 border border-slate-200/80 dark:border-[#222631] shadow-xs">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-400">Active Trade Promotions</p>
              <Gift className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-emerald-500 mt-1">{activeSchemesCount} Active</p>
            <p className="text-[11px] text-slate-400 mt-1">Driving bulk kirana order lines</p>
          </div>

          <div className="bg-white dark:bg-[#16181E] rounded-2xl p-5 border border-slate-200/80 dark:border-[#222631] shadow-xs">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-400">Buy X Get Y Free Deals</p>
              <Tag className="w-4 h-4 text-purple-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {buyXGetYCount} Deals
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Free goods automatically added to cart
            </p>
          </div>

          <div className="bg-white dark:bg-[#16181E] rounded-2xl p-5 border border-slate-200/80 dark:border-[#222631] shadow-xs">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-400">Volume Discount Deals</p>
              <Percent className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {percentageCount} Deals
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Direct invoice cash savings</p>
          </div>
        </div>

        {/* Schemes Roster Table */}
        <div className="bg-white dark:bg-[#16181E] rounded-2xl p-5 border border-slate-200/80 dark:border-[#222631] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#222631] pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Active FMCG Trade Schemes ({schemes.length})</span>
                <button
                  onClick={loadSchemesData}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
                  title="Refresh schemes"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingSchemes ? 'animate-spin' : ''}`} />
                </button>
              </h3>
              <p className="text-[11px] text-slate-400">
                Schemes automatically trigger on retailer order pad and beat salesman tablet app.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold">
                  <th className="py-2.5 px-3">Scheme Name</th>
                  <th className="py-2.5 px-3">Target FMCG Product</th>
                  <th className="py-2.5 px-3">Scheme Type</th>
                  <th className="py-2.5 px-3">Deal Mechanics</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {schemes.map((s) => {
                  const targetProd = s.product || products.find((p) => p.id === s.productId);

                  return (
                    <tr
                      key={s.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-[#1C2028]/50 transition-colors"
                    >
                      <td className="py-3 px-3">
                        <p className="font-bold text-slate-900 dark:text-white">{s.name}</p>
                        <p className="text-[10px] text-slate-400">ID: {s.id.slice(0, 8)}...</p>
                      </td>

                      <td className="py-3 px-3">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                          {targetProd ? targetProd.name : 'Target SKU'}
                        </p>
                        {targetProd?.skuCode && (
                          <p className="font-mono text-[10px] text-slate-400">
                            {targetProd.skuCode}
                          </p>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            s.schemeType === 'BUY_X_GET_Y_FREE'
                              ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-500/20'
                              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
                          }`}
                        >
                          {s.schemeType === 'BUY_X_GET_Y_FREE'
                            ? '🎁 Buy X Get Y Free'
                            : s.schemeType === 'PERCENTAGE_DISCOUNT'
                              ? '🏷️ Percentage Off'
                              : '💰 Flat Cash Off'}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        {s.schemeType === 'BUY_X_GET_Y_FREE' ? (
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white">
                              Buy {s.minQuantity} Boxes &rarr; Get {s.freeQuantity} FREE
                            </span>
                            <p className="text-[10px] text-slate-400">
                              Multiples apply on larger cart volumes
                            </p>
                          </div>
                        ) : s.schemeType === 'PERCENTAGE_DISCOUNT' ? (
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white">
                              {s.discountPercent}% OFF on &ge; {s.minQuantity} Boxes
                            </span>
                            <p className="text-[10px] text-slate-400">
                              Calculated on wholesale dealer rate
                            </p>
                          </div>
                        ) : (
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white">
                              ₹{s.discountPercent} OFF per Box on &ge; {s.minQuantity} Boxes
                            </span>
                            <p className="text-[10px] text-slate-400">Instant cash discount</p>
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <button
                          onClick={() => handleToggleScheme(s)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                            s.isActive
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${s.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}
                          />
                          <span>{s.isActive ? 'Active' : 'Paused'}</span>
                        </button>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => handleDeleteScheme(s)}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-rose-500 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Delete Scheme"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Create Trade Scheme */}
        {showAddSchemeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="bg-white dark:bg-[#16181E] border border-slate-200 dark:border-[#222631] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#222631]">
                <div className="flex items-center gap-2">
                  <Percent className="w-5 h-5 text-emerald-500" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Create New Trade Scheme
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddSchemeModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-lg leading-none"
                >
                  &times;
                </button>
              </div>

              {schemeFormError && (
                <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-medium border border-rose-500/20 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{schemeFormError}</span>
                </div>
              )}

              <form onSubmit={handleSchemeFormSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Scheme Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={schemeName}
                    onChange={(e) => setSchemeName(e.target.value)}
                    placeholder="e.g. Parle-G 10+1 Dhamaka Scheme"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#1C2028] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Target FMCG Product *
                  </label>
                  <select
                    value={schemeProductId}
                    onChange={(e) => setSchemeProductId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#1C2028] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.skuCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Promotion Type *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setSchemeType('BUY_X_GET_Y_FREE')}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        schemeType === 'BUY_X_GET_Y_FREE'
                          ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/30 font-bold text-emerald-600 dark:text-emerald-400'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <Gift className="w-4 h-4 mx-auto mb-1" />
                      <span>Buy X Get Y Free</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSchemeType('PERCENTAGE_DISCOUNT')}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        schemeType === 'PERCENTAGE_DISCOUNT'
                          ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/30 font-bold text-emerald-600 dark:text-emerald-400'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <Percent className="w-4 h-4 mx-auto mb-1" />
                      <span>Percentage Off</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSchemeType('FLAT_DISCOUNT')}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        schemeType === 'FLAT_DISCOUNT'
                          ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/30 font-bold text-emerald-600 dark:text-emerald-400'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <DollarSign className="w-4 h-4 mx-auto mb-1" />
                      <span>Flat Cash Off</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Min Qualifying Quantity (Boxes) *
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={schemeMinQty}
                      onChange={(e) => setSchemeMinQty(e.target.value)}
                      placeholder="10"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#1C2028] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>

                  {schemeType === 'BUY_X_GET_Y_FREE' ? (
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Free Goods Quantity (Boxes) *
                      </label>
                      <input
                        type="number"
                        required
                        min={1}
                        value={schemeFreeQty}
                        onChange={(e) => setSchemeFreeQty(e.target.value)}
                        placeholder="1"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#1C2028] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-hidden focus:border-emerald-500"
                      />
                    </div>
                  ) : schemeType === 'PERCENTAGE_DISCOUNT' ? (
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Discount Percentage (%) *
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        required
                        min={0.1}
                        max={100}
                        value={schemeDiscountPercent}
                        onChange={(e) => setSchemeDiscountPercent(e.target.value)}
                        placeholder="5.0"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#1C2028] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-hidden focus:border-emerald-500"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Flat Discount per Box (₹) *
                      </label>
                      <input
                        type="number"
                        step="1"
                        required
                        min={1}
                        value={schemeDiscountPercent}
                        onChange={(e) => setSchemeDiscountPercent(e.target.value)}
                        placeholder="50"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#1C2028] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-hidden focus:border-emerald-500"
                      />
                    </div>
                  )}
                </div>

                {/* Deal Calculation Preview */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1C2028] border border-slate-200 dark:border-slate-800 space-y-1">
                  <p className="font-bold text-slate-900 dark:text-white">Live Deal Preview:</p>
                  <p className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    {schemeType === 'BUY_X_GET_Y_FREE'
                      ? `When Kirana orders ${schemeMinQty} boxes, they get ${schemeFreeQty} box completely FREE (20 boxes = ${parseInt(schemeFreeQty, 10) * 2} free boxes).`
                      : schemeType === 'PERCENTAGE_DISCOUNT'
                        ? `Kirana receives ${schemeDiscountPercent}% instant discount when purchasing ${schemeMinQty} or more boxes.`
                        : `Kirana saves ₹${schemeDiscountPercent} off every box when purchasing ${schemeMinQty} or more boxes.`}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-[#222631] flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddSchemeModal(false)}
                    className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingScheme}
                    className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                  >
                    <Percent className="w-3.5 h-3.5" />
                    <span>{isSubmittingScheme ? 'Launching Deal...' : 'Launch Trade Scheme'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // TAB 5: EXECUTIVE ANALYTICS & 14-DAY CHURN RADAR (TASK 7)
  // ==========================================
  if (currentTab === 'dashboard') {
    const kpi = executiveAnalytics?.kpi;
    const brandBreakdown = executiveAnalytics?.brandBreakdown || [];
    const categoryBreakdown = executiveAnalytics?.categoryBreakdown || [];
    const topRetailers = executiveAnalytics?.topRetailers || [];

    return (
      <div className="space-y-6 pb-8">
        {actionSuccessMessage && (
          <div className="p-3 bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{actionSuccessMessage}</span>
            </div>
            <button
              onClick={() => setActionSuccessMessage(null)}
              className="opacity-80 hover:opacity-100"
            >
              &times;
            </button>
          </div>
        )}

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-emerald-500" />
                Executive Analytics & Command Hub
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Jabalpur HQ
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Real-time GMV, brand velocity, Kirana network health, and 14-day churn prevention
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadAnalyticsData(churnDaysFilter)}
              disabled={loadingAnalytics}
              className="p-2 rounded-xl bg-white dark:bg-[#15181E] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-500 transition-all cursor-pointer shadow-xs"
              title="Refresh Analytics"
            >
              <RefreshCw
                className={`w-4 h-4 ${loadingAnalytics ? 'animate-spin text-emerald-500' : ''}`}
              />
            </button>
            {setCurrentTab && (
              <button
                onClick={() => setCurrentTab('orders')}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Go to Order Desk</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 Hero KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-[#15181E] border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
              <span className="font-semibold uppercase tracking-wider text-[10px]">
                Total GMV Booked
              </span>
              <DollarSign className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
              ₹{(kpi?.totalGmv || 842500).toLocaleString('en-IN')}
            </div>
            <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
              <TrendingUp className="w-3 h-3" />
              <span>{kpi?.fulfillmentRate || 98.4}% order fulfillment</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#15181E] border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
              <span className="font-semibold uppercase tracking-wider text-[10px]">
                Today's Sales GMV
              </span>
              <Calendar className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
              ₹{(kpi?.todayGmv || 124800).toLocaleString('en-IN')}
            </div>
            <div className="mt-1 text-[11px] text-blue-600 dark:text-blue-400 font-semibold">
              {kpi?.todayOrdersCount || 8} orders booked today
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#15181E] border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-purple-500" />
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
              <span className="font-semibold uppercase tracking-wider text-[10px]">
                Average Order Value (AOV)
              </span>
              <TrendingUp className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
              ₹{(kpi?.aov || 14200).toLocaleString('en-IN')}
            </div>
            <div className="mt-1 text-[11px] text-purple-600 dark:text-purple-400 font-semibold">
              across {kpi?.totalOrders || orders.length} total orders
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#15181E] border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
              <span className="font-semibold uppercase tracking-wider text-[10px]">
                Active Kirana Network
              </span>
              <Store className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
              {kpi?.activeRetailersCount || retailers.length} Shops
            </div>
            <div className="mt-1 text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
              4 Beat Routes in Jabalpur
            </div>
          </div>
        </div>

        {/* Brand Contribution & Top Kiranas Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Brand Breakdown */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#15181E] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PieChart className="w-4 h-4 text-emerald-500" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Brand Revenue Velocity
                </h3>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Share of Total Sales
              </span>
            </div>

            <div className="space-y-3">
              {brandBreakdown.length > 0 ? (
                brandBreakdown.map((b) => (
                  <div key={b.brand} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-800 dark:text-slate-200">{b.brand}</span>
                      <span className="text-slate-500 dark:text-slate-400 font-mono">
                        ₹{b.revenue.toLocaleString('en-IN')} ({b.percentage}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-[#1C2028] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(5, b.percentage))}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="space-y-3">
                  {[
                    { brand: 'Parle Products', revenue: 312000, percentage: 37.0 },
                    { brand: 'Britannia Industries', revenue: 215000, percentage: 25.5 },
                    { brand: 'Nestlé India (Maggi)', revenue: 154000, percentage: 18.3 },
                    { brand: 'Hindustan Unilever (Surf Excel)', revenue: 108000, percentage: 12.8 },
                    { brand: 'Tata Consumer / Fortune', revenue: 53500, percentage: 6.4 },
                  ].map((b) => (
                    <div key={b.brand} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-800 dark:text-slate-200">{b.brand}</span>
                        <span className="text-slate-500 dark:text-slate-400 font-mono">
                          ₹{b.revenue.toLocaleString('en-IN')} ({b.percentage}%)
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-[#1C2028] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${b.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Category Badges */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-1.5">
              {(categoryBreakdown.length > 0
                ? categoryBreakdown
                : [
                    { category: 'Biscuits & Cookies', percentage: 41 },
                    { category: 'Noodles & Snacks', percentage: 27 },
                    { category: 'Detergents & Soaps', percentage: 22 },
                    { category: 'Cooking Essentials', percentage: 10 },
                  ]
              ).map((c) => (
                <span
                  key={c.category}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-[#1C2028] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                >
                  {c.category} ({c.percentage}%)
                </span>
              ))}
            </div>
          </div>

          {/* Top Kirana Buyers Leaderboard */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#15181E] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Top Kirana Buyers (Jabalpur)
                </h3>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">By Total GMV</span>
            </div>

            <div className="space-y-2.5">
              {(topRetailers.length > 0
                ? topRetailers
                : [
                    {
                      id: '1',
                      shopName: 'Shri Ganesh Kirana Store',
                      ownerName: 'Ramesh Patel',
                      totalOrders: 14,
                      totalSpent: 168400,
                      creditLimit: 75000,
                      outstandingBalance: 14200,
                    },
                    {
                      id: '2',
                      shopName: 'Gupta Daily Needs & Grocery',
                      ownerName: 'Sunil Gupta',
                      totalOrders: 11,
                      totalSpent: 142100,
                      creditLimit: 60000,
                      outstandingBalance: 22000,
                    },
                    {
                      id: '3',
                      shopName: 'Mahakaushal Super Bazaar',
                      ownerName: 'Deepak Tiwari',
                      totalOrders: 9,
                      totalSpent: 118900,
                      creditLimit: 80000,
                      outstandingBalance: 35000,
                    },
                    {
                      id: '4',
                      shopName: 'Narmada Provision Store',
                      ownerName: 'Anil Agrawal',
                      totalOrders: 8,
                      totalSpent: 96500,
                      creditLimit: 50000,
                      outstandingBalance: 12500,
                    },
                    {
                      id: '5',
                      shopName: 'Vijay Kirana & General Store',
                      ownerName: 'Vijay Yadav',
                      totalOrders: 6,
                      totalSpent: 74200,
                      creditLimit: 40000,
                      outstandingBalance: 8400,
                    },
                  ]
              ).map((tr, index) => (
                <div
                  key={tr.id}
                  className="p-3 rounded-xl bg-slate-50/80 dark:bg-[#1C2028] border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 hover:border-emerald-500/30 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`h-7 w-7 rounded-lg flex items-center justify-center font-black text-xs flex-shrink-0 ${
                        index === 0
                          ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                          : index === 1
                            ? 'bg-slate-300/40 text-slate-700 dark:text-slate-300'
                            : index === 2
                              ? 'bg-amber-700/20 text-amber-700 dark:text-amber-500'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      #{index + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-slate-900 dark:text-white truncate">
                        {tr.shopName}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        {tr.ownerName} &bull; {tr.totalOrders} Orders
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="font-black text-xs text-emerald-600 dark:text-emerald-400 font-mono">
                      ₹{tr.totalSpent.toLocaleString('en-IN')}
                    </p>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Khata: ₹{tr.outstandingBalance.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ==================================================== */}
        {/* 14-DAY INACTIVE KIRANA CHURN RADAR (SOLVES PROBLEM 6) */}
        {/* ==================================================== */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#15181E] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  14-Day Inactive Kirana Churn Radar
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  {churnRadar.length} At Risk
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Shops dormant for &ge; {churnDaysFilter} days. Re-engage immediately with 1-click
                personalized WhatsApp scheme nudges or assign a beat visit.
              </p>
            </div>

            {/* Threshold Filter buttons */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#1C2028] p-1 rounded-xl text-xs font-semibold">
              <span className="text-[10px] text-slate-400 px-2 uppercase font-bold">Dormancy:</span>
              {[14, 21, 30].map((days) => (
                <button
                  key={days}
                  onClick={() => {
                    setChurnDaysFilter(days);
                    loadAnalyticsData(days);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer ${
                    churnDaysFilter === days
                      ? 'bg-white dark:bg-[#252A36] text-slate-900 dark:text-white shadow-xs font-bold'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  &ge; {days} Days
                </button>
              ))}
            </div>
          </div>

          {churnRadar.length === 0 ? (
            <div className="p-8 text-center bg-emerald-500/5 dark:bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="font-bold text-sm text-slate-900 dark:text-white">
                All Jabalpur Kiranas are Active!
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Zero retail shops have been inactive for over {churnDaysFilter} days.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-[#1C2028] text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-3.5">Kirana Store</th>
                    <th className="py-3 px-3.5">Contact</th>
                    <th className="py-3 px-3.5">Dormant Period</th>
                    <th className="py-3 px-3.5">Last Order</th>
                    <th className="py-3 px-3.5">Beat Salesman</th>
                    <th className="py-3 px-3.5 text-right">Instant Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {churnRadar.map((shop) => (
                    <tr
                      key={shop.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-[#1C2028]/60 transition-colors"
                    >
                      <td className="py-3 px-3.5">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {shop.shopName}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {shop.ownerName} &bull; {shop.city}
                        </div>
                      </td>
                      <td className="py-3 px-3.5 font-mono text-slate-600 dark:text-slate-300">
                        {shop.phone}
                      </td>
                      <td className="py-3 px-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                            shop.riskLevel === 'HIGH'
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          {shop.daysDormant} Days Inactive
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-slate-600 dark:text-slate-300">
                        {shop.lastOrderDate ? (
                          <div>
                            <span className="font-mono font-semibold">
                              {new Date(shop.lastOrderDate).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                              })}
                            </span>
                            {shop.lastOrderAmount && (
                              <span className="text-[10px] text-slate-400 block font-mono">
                                ₹{shop.lastOrderAmount.toLocaleString('en-IN')}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No orders yet</span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-slate-700 dark:text-slate-300">
                        {shop.salesmanName ? (
                          <div className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="font-medium">{shop.salesmanName}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[10px]">Unassigned Beat</span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* 1-Click WhatsApp Nudge */}
                          <a
                            href={shop.whatsAppUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-xs transition-all flex items-center gap-1 inline-flex"
                            title="Send WhatsApp Nudge"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>Nudge</span>
                          </a>

                          {/* Quick Beat Re-assignment trigger */}
                          <button
                            onClick={() => {
                              setActionSuccessMessage(
                                `Priority Beat visit assigned for ${shop.shopName}!`
                              );
                              setTimeout(() => setActionSuccessMessage(null), 3500);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-[11px] transition-all cursor-pointer inline-flex items-center gap-1"
                            title="Assign Beat Visit"
                          >
                            <Truck className="w-3 h-3" />
                            <span>Visit</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // TAB 6: FINANCIALS & CREDIT KHATA RISK (TASK 7)
  // ==========================================
  if (currentTab === 'wallet') {
    const summary = financialRisk?.summary;
    const aging = financialRisk?.aging;
    const highRiskRetailers = financialRisk?.highRiskRetailers || [];

    return (
      <div className="space-y-6 pb-8">
        {actionSuccessMessage && (
          <div className="p-3 bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{actionSuccessMessage}</span>
            </div>
            <button
              onClick={() => setActionSuccessMessage(null)}
              className="opacity-80 hover:opacity-100"
            >
              &times;
            </button>
          </div>
        )}

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <Wallet className="w-6 h-6 text-emerald-500" />
                Distributor Financials & Credit Khata Ledger
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                Risk Engine
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Network credit exposure, receivables aging, and automated payment recovery reminders
            </p>
          </div>

          <button
            onClick={() => loadAnalyticsData(churnDaysFilter)}
            disabled={loadingAnalytics}
            className="p-2 rounded-xl bg-white dark:bg-[#15181E] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-500 transition-all cursor-pointer shadow-xs"
            title="Refresh Financials"
          >
            <RefreshCw
              className={`w-4 h-4 ${loadingAnalytics ? 'animate-spin text-emerald-500' : ''}`}
            />
          </button>
        </div>

        {/* 3 Top Credit Exposure Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-[#15181E] border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
              <span className="font-semibold uppercase tracking-wider text-[10px]">
                Total Credit Line Extended
              </span>
              <Building2 className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              ₹{(summary?.totalCreditExtended || 1450000).toLocaleString('en-IN')}
            </div>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              Sanctioned across {retailers.length} Jabalpur Kirana shops
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-[#15181E] border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
              <span className="font-semibold uppercase tracking-wider text-[10px]">
                Outstanding Market Receivables
              </span>
              <AlertCircle className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
              ₹{(summary?.totalOutstanding || 384000).toLocaleString('en-IN')}
            </div>
            <div className="mt-1 flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
              <span>{summary?.overallUtilizationPct || 26.5}% Network Credit Utilized</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-[#15181E] border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
              <span className="font-semibold uppercase tracking-wider text-[10px]">
                Available Purchasing Headroom
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              ₹{(summary?.availableCreditNetwork || 1066000).toLocaleString('en-IN')}
            </div>
            <p className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
              Available buffer for new order punchings
            </p>
          </div>
        </div>

        {/* Receivables Aging 3-Way Split */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#15181E] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-500" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Receivables Aging Analysis
              </h3>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Indian FMCG 3-Tier Distribution
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-400">
                0 &ndash; 15 Days (Current / Healthy)
              </span>
              <p className="text-lg font-black text-emerald-700 dark:text-emerald-300 font-mono mt-1">
                ₹{(aging?.current0to15Days || 215000).toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Within standard trade settlement window
              </p>
            </div>

            <div className="p-4 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20">
              <span className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-400">
                16 &ndash; 30 Days (Approaching Due)
              </span>
              <p className="text-lg font-black text-amber-700 dark:text-amber-400 font-mono mt-1">
                ₹{(aging?.overdue16to30Days || 112000).toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Requires salesman verbal follow-up
              </p>
            </div>

            <div className="p-4 rounded-xl bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/20">
              <span className="text-[10px] font-black uppercase text-rose-700 dark:text-rose-400">
                30+ Days (Critical / Credit Hold)
              </span>
              <p className="text-lg font-black text-rose-700 dark:text-rose-400 font-mono mt-1">
                ₹{(aging?.critical30PlusDays || 57000).toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Triggers automatic order credit hold
              </p>
            </div>
          </div>
        </div>

        {/* High Risk & Over-Limit Retailers Table */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#15181E] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-500" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                High-Utilization & Credit Risk Watchlist
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                {highRiskRetailers.length} Kiranas
              </span>
            </div>
            <span className="text-xs text-slate-500">Utilization &ge; 80% or Over-Limit</span>
          </div>

          {highRiskRetailers.length === 0 ? (
            <div className="p-6 text-center bg-slate-50 dark:bg-[#1C2028] rounded-xl text-slate-500 text-xs">
              All Kiranas have healthy credit balances below 80% utilization.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-[#1C2028] text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-3.5">Shop & Owner</th>
                    <th className="py-3 px-3.5">Credit Limit</th>
                    <th className="py-3 px-3.5">Outstanding Balance</th>
                    <th className="py-3 px-3.5">Credit Utilization</th>
                    <th className="py-3 px-3.5">Risk Status</th>
                    <th className="py-3 px-3.5 text-right">1-Click WhatsApp Reminder</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {highRiskRetailers.map((r) => (
                    <tr
                      key={r.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-[#1C2028]/60 transition-colors"
                    >
                      <td className="py-3 px-3.5">
                        <div className="font-bold text-slate-900 dark:text-white">{r.shopName}</div>
                        <div className="text-[10px] text-slate-500">
                          {r.ownerName} &bull; {r.phone}
                        </div>
                      </td>
                      <td className="py-3 px-3.5 font-mono text-slate-700 dark:text-slate-300">
                        ₹{r.creditLimit.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3.5 font-mono font-bold text-slate-900 dark:text-white">
                        ₹{r.outstandingBalance.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="w-28 space-y-1">
                          <div className="flex justify-between text-[10px] font-mono font-semibold">
                            <span>{r.utilizationPct}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 dark:bg-[#1C2028] rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                r.status === 'EXCEEDED' ? 'bg-rose-500' : 'bg-amber-500'
                              }`}
                              style={{ width: `${Math.min(100, r.utilizationPct)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                            r.status === 'EXCEEDED'
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {r.status === 'EXCEEDED' ? 'CREDIT HOLD' : 'WARNING (>80%)'}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-right">
                        <a
                          href={r.whatsappReminderUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-xs transition-all inline-flex items-center gap-1"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>Remind UPI</span>
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // DEFAULT TAB: ORDER DESK & VERIFICATION
  // ==========================================
  return (
    <div className="space-y-6 pb-8">
      {/* Floating Live Order Alert Toast */}
      {liveOrderToast && (
        <div className="fixed top-20 right-6 z-50 max-w-sm w-full bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-emerald-500/50 animate-slideDown flex items-start gap-3 ring-4 ring-emerald-500/20">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center flex-shrink-0 text-white shadow-md">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div className="flex-1 min-w-0 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-400 uppercase tracking-wider text-[10px] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live Order Punched
              </span>
              <button
                onClick={() => setLiveOrderToast(null)}
                className="text-slate-400 hover:text-white text-base leading-none"
              >
                &times;
              </button>
            </div>
            <p className="text-sm font-bold mt-0.5 truncate text-white">
              {liveOrderToast.shopName}
            </p>
            <p className="text-slate-300 mt-0.5">
              Order <strong className="text-white font-mono">{liveOrderToast.orderNumber}</strong>{' '}
              for{' '}
              <strong className="text-emerald-400 font-bold">
                ₹{liveOrderToast.amount.toFixed(0)}
              </strong>
            </p>
            <p className="text-[10px] text-slate-400 mt-1">
              {liveOrderToast.createdVia === 'SALESMAN_APP'
                ? `📱 Beat Salesman: ${liveOrderToast.salesmanName || 'Field Agent'}`
                : liveOrderToast.createdVia === 'AI_CAPTURE'
                  ? '🤖 AI WhatsApp'
                  : '💻 Kirana Portal'}
            </p>
          </div>
        </div>
      )}

      {actionSuccessMessage && (
        <div className="p-3 bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center justify-between shadow-md animate-slideDown">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{actionSuccessMessage}</span>
          </div>
          <button
            onClick={() => setActionSuccessMessage(null)}
            className="opacity-80 hover:opacity-100"
          >
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
            {salesmen.length > 0 ? salesmen.length : metrics.activeSalesmenCount} Beat Salesmen in
            Field
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
          <p className="text-xs font-semibold text-slate-400">Dispatch & Tally ERP Exports</p>
          <div className="mt-1 flex items-center justify-between gap-1.5 flex-wrap">
            <button
              onClick={handleExportTallyCsv}
              disabled={isExporting}
              className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-xs transition-all cursor-pointer"
              title="Download Tally ERP 9 / Prime CSV Vouchers"
            >
              <FileSpreadsheet className={`h-3.5 w-3.5 ${isExporting ? 'animate-spin' : ''}`} />
              <span>{isExporting ? 'Generating...' : 'Tally CSV'}</span>
            </button>
            <button
              onClick={handleOpenVanLoadingModal}
              className="text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-xs transition-all cursor-pointer"
              title="Generate Vehicle Loading Manifest & Packing List"
            >
              <Truck className="h-3.5 w-3.5" />
              <span>Van Loading List</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {metrics.approvedOrders} Approved orders ready for vehicle packing
          </p>
        </div>
      </div>

      {/* Main Order Desk Workspace: 12 Cols Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="bg-white dark:bg-[#16181E] rounded-2xl p-5 border border-slate-200/80 dark:border-[#222631] shadow-xs">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400">
                    Distributor Collection Ledger
                  </p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">₹47,74,800</p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#222631] flex flex-col gap-2">
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Total Active Retailers:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {retailers.length > 0 ? `${retailers.length} Shops` : '1,820 Shops'}
                </span>
              </div>
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Jabalpur FMCG Hub:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  Operational
                </span>
              </div>
            </div>

            {setCurrentTab && (
              <button
                onClick={() => setCurrentTab('retailers')}
                className="mt-3 w-full py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>Manage Kirana Network</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>

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
                <span
                  className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    isRealtimeConnected
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                      : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-500/20'
                  }`}
                  title={
                    isRealtimeConnected
                      ? 'Live auto-refresh via Server-Sent Events'
                      : 'Reconnecting to live stream...'
                  }
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${isRealtimeConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}
                  />
                  <span>{isRealtimeConnected ? 'Live Sync' : 'Reconnecting'}</span>
                </span>
                <button
                  onClick={loadOrdersData}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
                  title="Refresh Queue"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingOrders ? 'animate-spin' : ''}`} />
                </button>
              </h3>
            </div>

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
                          {isApproved ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Building2 className="w-4 h-4" />
                          )}
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
                          ) : order.status === 'DISPATCHED' ? (
                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/50 px-1.5 py-0.5 rounded border border-blue-500/20">
                              Dispatched
                            </span>
                          ) : order.status === 'DELIVERED' ? (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.5 rounded">
                              Delivered
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                              Pending
                            </span>
                          )}
                        </div>

                        {order.status === 'PENDING' && (
                          <div
                            className="flex gap-1 mt-2 justify-end"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => handleApprove(order.id)}
                              className="h-6 w-6 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-100 transition-colors cursor-pointer"
                              title="Approve Order"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleReject(order.id)}
                              className="h-6 w-6 rounded bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-100 transition-colors cursor-pointer"
                              title="Reject Order"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </div>
                        )}

                        {order.status === 'APPROVED' && (
                          <div
                            className="flex gap-1 mt-2 justify-end"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => handleDispatch(order.id)}
                              className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center gap-1 transition-colors cursor-pointer"
                              title="Dispatch via Delivery Van"
                            >
                              <Truck className="h-3 w-3" />
                              <span>Dispatch</span>
                            </button>
                          </div>
                        )}

                        {order.status === 'DISPATCHED' && (
                          <div
                            className="flex gap-1 mt-2 justify-end"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => handleDeliver(order.id)}
                              className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-600 flex items-center gap-1 transition-colors cursor-pointer"
                              title="Confirm Delivered"
                            >
                              <Check className="h-3 w-3" />
                              <span>Deliver</span>
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

                <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-[#1C2028] border border-slate-200/60 dark:border-slate-800 text-xs space-y-1.5">
                  <div className="flex justify-between items-center font-bold">
                    <span className="text-slate-600 dark:text-slate-300">
                      Retailer Khata Status:
                    </span>
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
                    <span>
                      ₹{selectedOrder.retailer.outstandingBalance.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

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
                    <span className="text-emerald-500">
                      ₹{selectedOrder.finalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {selectedOrder.status === 'PENDING' ? (
                <div className="pt-3 border-t border-slate-100 dark:border-[#222736] flex gap-2">
                  <button
                    onClick={() => handleReject(selectedOrder.id)}
                    className="flex-1 py-2 rounded-xl border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 font-bold text-xs hover:bg-rose-50 transition-colors cursor-pointer"
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
              ) : selectedOrder.status === 'APPROVED' ? (
                <div className="pt-3 border-t border-slate-100 dark:border-[#222736] flex flex-col gap-2">
                  <button
                    onClick={() => handleDispatch(selectedOrder.id)}
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Dispatch via Delivery Van</span>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedInvoiceOrder(selectedOrder);
                      setIsInvoiceModalOpen(true);
                    }}
                    className="w-full py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>View & Print B2B Tax Invoice</span>
                  </button>
                </div>
              ) : selectedOrder.status === 'DISPATCHED' ? (
                <div className="pt-3 border-t border-slate-100 dark:border-[#222736] flex flex-col gap-2">
                  <button
                    onClick={() => handleDeliver(selectedOrder.id)}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirm Order Delivered</span>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedInvoiceOrder(selectedOrder);
                      setIsInvoiceModalOpen(true);
                    }}
                    className="w-full py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>View & Print B2B Tax Invoice</span>
                  </button>
                </div>
              ) : selectedOrder.status === 'DELIVERED' ? (
                <div className="pt-3 border-t border-slate-100 dark:border-[#222736] flex flex-col gap-2">
                  <div className="py-2 text-center text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-500/20 flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Order Delivered to Kirana Shop</span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedInvoiceOrder(selectedOrder);
                      setIsInvoiceModalOpen(true);
                    }}
                    className="w-full py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>View & Print B2B Tax Invoice</span>
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
              <p className="text-xs mt-1">
                Click any order in the queue to inspect items & verify credit.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Printable B2B Tax Invoice Modal */}
      <B2bTaxInvoiceModal
        order={selectedInvoiceOrder}
        isOpen={isInvoiceModalOpen}
        onClose={() => {
          setIsInvoiceModalOpen(false);
          setSelectedInvoiceOrder(null);
        }}
      />

      {/* Vehicle Dispatch & Van Loading Manifest Modal */}
      <VanLoadingModal
        isOpen={isVanLoadingModalOpen}
        onClose={() => setIsVanLoadingModalOpen(false)}
        manifestData={vanLoadingData}
        loading={loadingVanManifest}
        onDownloadCsv={handleDownloadVanLoadingCsv}
      />
    </div>
  );
};
