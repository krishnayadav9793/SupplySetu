import { useState } from 'react';
import {
  Wallet,
  ArrowDown,
  ArrowUpRight,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  FileText,
  SlidersHorizontal,
  ArrowLeftRight,
  Building2,
  TrendingUp,
} from 'lucide-react';

export const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<'pending' | 'approved'>('pending');

  return (
    <div className="space-y-6">
      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#16181E] rounded-2xl p-4 border border-slate-200/80 dark:border-[#222631] shadow-sm">
          <p className="text-xs font-semibold text-slate-400">Today's Orders Target</p>
          <div className="mt-1 flex items-baseline justify-between">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">412 / 600</p>
            <span className="text-xs font-semibold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
              68.6%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">18 Salesmen Active in Beat</p>
        </div>

        <div className="bg-white dark:bg-[#16181E] rounded-2xl p-4 border border-slate-200/80 dark:border-[#222631] shadow-sm">
          <p className="text-xs font-semibold text-slate-400">Today's GMV Booked</p>
          <div className="mt-1 flex items-baseline justify-between">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">₹8,42,500</p>
            <span className="text-xs font-semibold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md flex items-center gap-0.5">
              <TrendingUp className="h-3 w-3" /> +12%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Target: ₹12,00,000</p>
        </div>

        <div className="bg-white dark:bg-[#16181E] rounded-2xl p-4 border border-slate-200/80 dark:border-[#222631] shadow-sm">
          <p className="text-xs font-semibold text-slate-400">Order Desk Queue</p>
          <div className="mt-1 flex items-baseline justify-between">
            <p className="text-2xl font-bold text-amber-500">38 Pending</p>
            <span className="text-xs font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md">
              Needs Review
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">6 with credit limit warnings</p>
        </div>

        <div className="bg-white dark:bg-[#16181E] rounded-2xl p-4 border border-slate-200/80 dark:border-[#222631] shadow-sm">
          <p className="text-xs font-semibold text-slate-400">Tally Sync Export</p>
          <div className="mt-1 flex items-baseline justify-between">
            <p className="text-2xl font-bold text-emerald-500">Ready</p>
            <button className="text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm transition-all">
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">374 Approved batches</p>
        </div>
      </div>

      {/* Main Grid matching reference layout: Financials/Wallet + Orders + Detail Stepper */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column: Distributor Financials & Portfolio Card (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-white dark:bg-[#16181E] rounded-2xl p-5 border border-slate-200/80 dark:border-[#222631] shadow-sm">
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
              <button className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <SlidersHorizontal className="h-4 w-4" />
              </button>
            </div>

            {/* Sparkline Wave Chart & Buttons */}
            <div className="mt-5 grid grid-cols-12 gap-3 items-center">
              <div className="col-span-5 flex flex-col gap-2">
                <button className="h-7 w-7 rounded-lg bg-slate-100 dark:bg-[#202530] text-slate-600 dark:text-slate-300 flex items-center justify-center mb-1">
                  <ArrowLeftRight className="h-3.5 w-3.5" />
                </button>
                <button className="w-full py-1.5 px-3 rounded-lg text-xs font-semibold bg-gradient-to-r from-emerald-500 to-teal-400 text-white shadow-[0_4px_14px_rgba(16,185,129,0.35)] hover:opacity-95 transition-all">
                  Remit
                </button>
                <button className="w-full py-1.5 px-3 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-500/20 transition-colors">
                  Collect
                </button>
              </div>

              <div className="col-span-7 h-28 relative">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 240 80" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="adminEmeraldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#10B981" stopOpacity="0.38" />
                      <stop offset="100%" stopColor="#10B981" stopOpacity="0.00" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0,60 Q25,58 45,62 T85,55 T125,58 T165,40 T195,30 T220,18 T240,15 L240,80 L0,80 Z"
                    fill="url(#adminEmeraldGrad)"
                  />
                  <path
                    d="M0,60 Q25,58 45,62 T85,55 T125,58 T165,40 T195,30 T220,18 T240,15"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Quick Bank & Credit Overview */}
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

        {/* Center Column: Order Desk Review List (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Incoming Orders Queue (38)
            </h3>
            <div className="flex gap-1 bg-slate-100 dark:bg-[#202530] p-0.5 rounded-lg text-xs">
              <button
                onClick={() => setActiveTab('pending')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  activeTab === 'pending'
                    ? 'bg-white dark:bg-[#16181E] text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500'
                }`}
              >
                Pending (38)
              </button>
              <button
                onClick={() => setActiveTab('approved')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  activeTab === 'approved'
                    ? 'bg-white dark:bg-[#16181E] text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500'
                }`}
              >
                Approved (374)
              </button>
            </div>
          </div>

          <div className="space-y-2.5">
            {/* Active Selected Order with Signature Emerald Gradient */}
            <div className="rounded-xl p-3.5 bg-gradient-to-r from-emerald-500 to-teal-400 text-white shadow-[0_4px_16px_rgba(16,185,129,0.35)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-white/20 text-white flex items-center justify-center">
                  <ArrowDown className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Shri Ganesh Kirana (ORD-1042)</p>
                  <p className="text-[11px] text-white/80">Parle-G (10 Boxes) + Maggi (5 Cases)</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-white">₹11,850</p>
                <span className="text-[10px] font-semibold bg-white/20 px-2 py-0.5 rounded">
                  Credit OK
                </span>
              </div>
            </div>

            {/* Standard Order 2 */}
            <div className="bg-white dark:bg-[#16181E] rounded-xl p-3.5 border border-slate-200/80 dark:border-[#222631] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-[#202530] text-slate-500 dark:text-slate-400 flex items-center justify-center">
                  <Building2 className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    Mahalaxmi Provision (ORD-1043)
                  </p>
                  <p className="text-[11px] text-amber-500 font-medium">
                    Credit Limit Warning (₹4,200 over)
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-slate-900 dark:text-white">₹18,400</p>
                <div className="flex gap-1 mt-1 justify-end">
                  <button className="h-5 w-5 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-100">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </button>
                  <button className="h-5 w-5 rounded bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100">
                    <XCircle className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Standard Order 3 */}
            <div className="bg-white dark:bg-[#16181E] rounded-xl p-3.5 border border-slate-200/80 dark:border-[#222631] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-[#202530] text-slate-500 dark:text-slate-400 flex items-center justify-center">
                  <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    Khandelwal Traders (ORD-1044)
                  </p>
                  <p className="text-[11px] text-slate-400">Fortune Oil (10 Boxes) &bull; Salesman Beat #2</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-slate-900 dark:text-white">₹14,750</p>
                <p className="text-[11px] text-emerald-500 font-semibold">Ready to Pack</p>
              </div>
            </div>

            {/* Standard Order 4 */}
            <div className="bg-white dark:bg-[#16181E] rounded-xl p-3.5 border border-slate-200/80 dark:border-[#222631] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-[#202530] text-slate-500 dark:text-slate-400 flex items-center justify-center">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    Apna Super Bazaar (ORD-1045)
                  </p>
                  <p className="text-[11px] text-slate-400">Created via AI WhatsApp Voice Note</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-slate-900 dark:text-white">₹24,300</p>
                <p className="text-[11px] text-slate-400">Scheme 10+1 Applied</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Order Details & Approval Stepper (3 Cols) */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-[#16181E] rounded-2xl p-5 border border-slate-200/80 dark:border-[#222631] shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
              Order Details (ORD-1042)
            </h3>

            <div className="space-y-3.5 text-xs">
              <div>
                <p className="text-[11px] text-slate-400">Retailer:</p>
                <p className="font-semibold text-slate-900 dark:text-white">
                  Shri Ganesh Kirana Store
                </p>
              </div>

              <div>
                <p className="text-[11px] text-slate-400">FMCG Brands:</p>
                <p className="text-slate-600 dark:text-slate-300">
                  Parle, Nestlé India
                </p>
              </div>

              <div>
                <p className="text-[11px] text-slate-400">Total Invoice Amount:</p>
                <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                  ₹11,850.00
                </p>
              </div>

              <div>
                <p className="text-[11px] text-slate-400">Tally Voucher Ref:</p>
                <p className="font-mono text-[11px] text-blue-500 dark:text-blue-400">
                  VCH-2026-JBP-08492
                </p>
              </div>
            </div>

            {/* Stepper Timeline matching reference design */}
            <div className="mt-6 pt-5 border-t border-slate-100 dark:border-[#222631]">
              <div className="relative pl-6 space-y-5">
                <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-blue-500/30 dark:bg-blue-400/30" />

                <div className="relative">
                  <div className="absolute -left-6 top-1 h-3.5 w-3.5 rounded-full border-2 border-blue-500 bg-white dark:bg-[#16181E] flex items-center justify-center">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Order captured & validated
                  </p>
                </div>

                <div className="relative">
                  <div className="absolute -left-6 top-1 h-3.5 w-3.5 rounded-full border-2 border-blue-500 bg-white dark:bg-[#16181E] flex items-center justify-center">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Credit limit verified (OK)
                  </p>
                </div>

                <div className="relative">
                  <div className="absolute -left-6 top-1 h-3.5 w-3.5 rounded-full border-2 border-blue-500 bg-white dark:bg-[#16181E] flex items-center justify-center">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Approved for warehouse packing
                  </p>
                </div>

                <div className="relative">
                  <div className="absolute -left-6 top-1 h-3.5 w-3.5 rounded-full border-2 border-blue-500 bg-white dark:bg-[#16181E] flex items-center justify-center">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Ready for Tally export
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
