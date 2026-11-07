import React, { useState } from 'react';
import {
  X,
  Truck,
  Package,
  Printer,
  Phone,
  MapPin,
  FileSpreadsheet,
} from 'lucide-react';

interface VanLoadingItem {
  skuCode: string;
  productName: string;
  brand: string;
  packSize: string;
  totalQuantity: number;
  freeQuantity: number;
  totalBoxesToLoad: number;
  unit: string;
  allocatedOrdersCount: number;
}

interface VanDeliveryStop {
  stopNumber: number;
  orderNumber: string;
  shopName: string;
  ownerName: string;
  address: string;
  city: string;
  phone: string;
  totalBoxes: number;
  invoiceAmount: number;
  itemSummary: string;
}

interface VanLoadingManifest {
  manifestId: string;
  generatedAt: string;
  vehicleNumber: string;
  routeBeat: string;
  driverName: string;
  totalApprovedOrders: number;
  totalBoxesToLoad: number;
  totalWeightEstimatedKg: number;
  loadingItems: VanLoadingItem[];
  deliveryStops: VanDeliveryStop[];
}

interface VanLoadingModalProps {
  isOpen: boolean;
  onClose: () => void;
  manifestData: VanLoadingManifest | null;
  loading: boolean;
  onDownloadCsv: () => void;
}

export const VanLoadingModal: React.FC<VanLoadingModalProps> = ({
  isOpen,
  onClose,
  manifestData,
  loading,
  onDownloadCsv,
}) => {
  const [activeTab, setActiveTab] = useState<'warehouse' | 'drops'>('warehouse');

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-[#16181E] border border-slate-200 dark:border-[#222631] rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-scaleUp">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-200/80 dark:border-[#222631] flex items-center justify-between bg-slate-50/70 dark:bg-[#1B1F27]/60">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Vehicle Dispatch & Van Loading Manifest
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  Daily Dispatch Sheet
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Jabalpur FMCG Distribution Hub &bull; Warehouse Packing & Route Delivery Manifest
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Vehicle & Beat KPI Banner */}
        <div className="p-4 bg-slate-100/60 dark:bg-[#14161C] border-b border-slate-200/60 dark:border-[#222631] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Assigned Vehicle</span>
            <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1 mt-0.5">
              <Truck className="w-3.5 h-3.5 text-blue-500" />
              <span>{manifestData?.vehicleNumber || 'MP-20-GB-4819 (Tata 407)'}</span>
            </span>
          </div>

          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Route & Beat</span>
            <span className="font-bold text-slate-900 dark:text-white truncate block mt-0.5">
              {manifestData?.routeBeat || 'Beat #4 Lordganj & Sarafa'}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Driver Assigned</span>
            <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1 mt-0.5">
              <Phone className="w-3 h-3 text-emerald-500" />
              <span>{manifestData?.driverName || 'Manoj Verma'}</span>
            </span>
          </div>

          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Total Cases to Pack</span>
            <span className="font-black text-sm text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 block">
              {manifestData?.totalBoxesToLoad || 0} Cases (~{manifestData?.totalWeightEstimatedKg || 0} kg)
            </span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200/80 dark:border-[#222631] bg-white dark:bg-[#16181E] px-4 pt-2 gap-4">
          <button
            onClick={() => setActiveTab('warehouse')}
            className={`pb-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'warehouse'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>1. Warehouse Packing Summary ({manifestData?.loadingItems?.length || 0} SKUs)</span>
          </button>

          <button
            onClick={() => setActiveTab('drops')}
            className={`pb-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'drops'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>2. Delivery Drops ({manifestData?.deliveryStops?.length || 0} Kirana Shops)</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="py-20 text-center text-slate-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2" />
              <p className="text-xs font-semibold">Generating Consolidated Vehicle Loading Manifest...</p>
            </div>
          ) : activeTab === 'warehouse' ? (
            <div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
                Load cases into the van in this exact consolidated count. Free promotional goods are included in totals.
              </p>
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-[#222631]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-[#1A1D24] text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-[#222631]">
                    <tr>
                      <th className="py-2.5 px-3">SKU Code</th>
                      <th className="py-2.5 px-3">Product Name</th>
                      <th className="py-2.5 px-3">Brand</th>
                      <th className="py-2.5 px-3">Pack Size</th>
                      <th className="py-2.5 px-3 text-right">Order Qty</th>
                      <th className="py-2.5 px-3 text-right">Free Scheme</th>
                      <th className="py-2.5 px-3 text-right font-black text-blue-600 dark:text-blue-400">
                        Total Cases to Load
                      </th>
                      <th className="py-2.5 px-3 text-center">Unit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {manifestData?.loadingItems?.map((it) => (
                      <tr key={it.skuCode} className="hover:bg-slate-50/50 dark:hover:bg-[#1C2028]">
                        <td className="py-2 px-3 font-mono font-bold text-slate-900 dark:text-white">
                          {it.skuCode}
                        </td>
                        <td className="py-2 px-3 font-medium text-slate-800 dark:text-slate-200">
                          {it.productName}
                        </td>
                        <td className="py-2 px-3 text-slate-500">{it.brand}</td>
                        <td className="py-2 px-3 text-slate-400 text-[11px]">{it.packSize}</td>
                        <td className="py-2 px-3 text-right font-mono">{it.totalQuantity}</td>
                        <td className="py-2 px-3 text-right font-mono text-emerald-600">
                          {it.freeQuantity > 0 ? `+${it.freeQuantity}` : '—'}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-black text-blue-600 dark:text-blue-400 text-sm">
                          {it.totalBoxesToLoad}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {it.unit}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
                Sequential delivery stops for the delivery driver along Beat #4 route.
              </p>
              <div className="space-y-2.5">
                {manifestData?.deliveryStops?.map((stop) => (
                  <div
                    key={stop.stopNumber}
                    className="p-3.5 rounded-xl bg-slate-50/60 dark:bg-[#1A1D24] border border-slate-200/60 dark:border-[#222631] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-black flex items-center justify-center flex-shrink-0 text-xs">
                        #{stop.stopNumber}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 dark:text-white">{stop.shopName}</h4>
                          <span className="text-[10px] font-mono text-slate-400">{stop.orderNumber}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {stop.address}, {stop.city} &bull; Contact: {stop.ownerName} ({stop.phone})
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono mt-1">
                          Items: {stop.itemSummary}
                        </p>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 sm:border-l border-slate-200 dark:border-slate-800 sm:pl-4">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider">Unload Count</p>
                      <p className="font-black text-sm text-blue-600 dark:text-blue-400 font-mono">
                        {stop.totalBoxes} Cases
                      </p>
                      <p className="text-[11px] font-bold text-emerald-600 mt-0.5">
                        ₹{stop.invoiceAmount.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 border-t border-slate-200/80 dark:border-[#222631] bg-slate-50/70 dark:bg-[#1B1F27]/60 flex items-center justify-between gap-3">
          <div className="text-[11px] text-slate-400 hidden sm:block">
            Manifest ID: <span className="font-mono text-slate-600 dark:text-slate-300">{manifestData?.manifestId}</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Manifest</span>
            </button>

            <button
              onClick={onDownloadCsv}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Download CSV Sheet</span>
            </button>

            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
