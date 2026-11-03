import { useState } from 'react';
import {
  PieChart,
  BarChart3,
  Wallet,
  Users,
  ShieldCheck,
  Briefcase,
  Layers,
  ArrowLeftRight,
  Settings,
  Tag,
  Search,
  Bell,
  Mail,
  ArrowDown,
  ArrowUpRight,
  FileText,
  SlidersHorizontal,
} from 'lucide-react';
import { ThemeToggle } from './components/common/ThemeToggle';

interface Asset {
  id: string;
  name: string;
  symbol: string;
  balance: string;
  valueUsd?: string;
  iconBg?: string;
}

const ASSETS: Asset[] = [
  { id: 'btc', name: 'Bitcoin', symbol: 'BTC', balance: '1.95232 BTC', valueUsd: '$47,748.42' },
  { id: 'eth', name: 'Ethereum', symbol: 'ETH', balance: '3 ETH', valueUsd: '$9,820.50' },
  { id: 'usdt', name: 'Tether', symbol: 'USDT', balance: '657.67 USDT', valueUsd: '$657.67' },
  { id: 'bnb', name: 'Binance Coin', symbol: 'BNB', balance: '5 BNB', valueUsd: '$1,845.20' },
  { id: 'matic', name: 'Polygon', symbol: 'MATIC', balance: '1,023 MATIC', valueUsd: '$716.10' },
  { id: 'etc', name: 'Ethereum Classic', symbol: 'ETC', balance: '657.67 ETC', valueUsd: '$13,811.00' },
  { id: 'dai', name: 'Dai', symbol: 'DAI', balance: '265.19 DAI', valueUsd: '$265.19' },
  { id: 'uni', name: 'Uniswap', symbol: 'UNI', balance: '7 UNI', valueUsd: '$73.50' },
  { id: 'ftm', name: 'Fantom', symbol: 'FTM', balance: '291.89 FTM', valueUsd: '$233.51' },
  { id: 'avax', name: 'Avalanche', symbol: 'AVAX', balance: '5 AVAX', valueUsd: '$175.40' },
];

export default function App() {
  const [selectedAsset, setSelectedAsset] = useState<string>('btc');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAssets = ASSETS.filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F4F6F9] dark:bg-[#0C0E12] text-slate-800 dark:text-[#E2E8F0] font-sans transition-colors duration-200 flex flex-col justify-center items-center p-2 sm:p-4 lg:p-6">
      {/* Outer Application Container Window */}
      <div className="w-full max-w-[1440px] bg-white dark:bg-[#121418] rounded-2xl shadow-xl dark:shadow-[0_20px_60px_rgba(0,0,0,0.6)] border border-slate-200/80 dark:border-[#222631] overflow-hidden flex flex-col">
        
        {/* Top Header Bar */}
        <header className="h-16 px-4 sm:px-6 border-b border-slate-100 dark:border-[#1E222A] flex items-center justify-between gap-4 bg-white dark:bg-[#121418]">
          {/* Logo & Search */}
          <div className="flex items-center gap-6 flex-1 max-w-xl">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-sm">
                <div className="h-4 w-4 border-2 border-white rotate-45 rounded-[2px]" />
              </div>
              <span className="font-semibold text-lg tracking-tight text-slate-900 dark:text-white hidden sm:inline">
                Supply<span className="text-emerald-500">Setu</span>
              </span>
            </div>

            {/* Global Search */}
            <div className="relative flex-1 hidden md:block">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-1.5 text-sm rounded-lg bg-slate-50 dark:bg-[#1A1D24] border border-slate-200/60 dark:border-[#262B35] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
              />
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Bell & Mail Icons */}
            <button className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 transition-colors">
              <Bell className="h-4 w-4" />
            </button>
            <button className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 transition-colors">
              <Mail className="h-4 w-4" />
            </button>

            {/* User Profile */}
            <div className="flex items-center gap-3 pl-2 sm:border-l border-slate-200/80 dark:border-[#262B35]">
              <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-amber-500 to-orange-400 p-0.5 flex-shrink-0">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                  alt="Austin Robertson"
                  className="h-full w-full rounded-full object-cover"
                />
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
                  Austin Robertson
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-400">
                  Marketing Administrator
                </p>
              </div>
            </div>

            {/* Dark/Light Theme Toggle (Matching Screenshot) */}
            <div className="flex items-center pl-1 sm:pl-2">
              <ThemeToggle />
            </div>

            {/* Country Flag Badge */}
            <div className="h-6 w-6 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 flex-shrink-0">
              <div className="w-full h-full bg-[#012169] relative flex items-center justify-center text-[10px] text-white font-bold">
                🇬🇧
              </div>
            </div>
          </div>
        </header>

        {/* Workspace Body Layout */}
        <div className="flex flex-1 overflow-hidden">
          
          {/* Left Vertical Nav Strip */}
          <aside className="w-16 border-r border-slate-100 dark:border-[#1E222A] bg-white dark:bg-[#121418] flex flex-col items-center py-4 gap-6 select-none flex-shrink-0">
            {/* Section: PAGES */}
            <div className="flex flex-col items-center gap-3 w-full">
              <span className="text-[9px] font-bold tracking-wider text-slate-400 dark:text-slate-400 uppercase">
                Pages
              </span>

              <button className="h-9 w-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1A1D24] transition-colors">
                <PieChart className="h-4 w-4" />
              </button>
              
              <button className="h-9 w-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1A1D24] transition-colors">
                <BarChart3 className="h-4 w-4" />
              </button>

              {/* Active Wallet Nav Item (Signature emerald gradient pill from screenshot) */}
              <button className="h-9 w-9 rounded-xl flex items-center justify-center bg-gradient-to-r from-emerald-500 to-teal-400 text-white shadow-[0_4px_16px_rgba(16,185,129,0.4)]">
                <Wallet className="h-4 w-4" />
              </button>

              <button className="h-9 w-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1A1D24] transition-colors">
                <Users className="h-4 w-4" />
              </button>

              <button className="h-9 w-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1A1D24] transition-colors">
                <ShieldCheck className="h-4 w-4" />
              </button>

              <button className="h-9 w-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1A1D24] transition-colors">
                <Briefcase className="h-4 w-4" />
              </button>
            </div>

            {/* Section: UI */}
            <div className="flex flex-col items-center gap-3 w-full pt-3 border-t border-slate-100 dark:border-[#1E222A]">
              <span className="text-[9px] font-bold tracking-wider text-slate-400 dark:text-slate-400 uppercase">
                UI
              </span>

              <button className="h-9 w-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1A1D24] transition-colors">
                <Layers className="h-4 w-4" />
              </button>
              <button className="h-9 w-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1A1D24] transition-colors">
                <Tag className="h-4 w-4" />
              </button>
              <button className="h-9 w-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1A1D24] transition-colors">
                <Settings className="h-4 w-4" />
              </button>
            </div>

            {/* Section: DOC */}
            <div className="flex flex-col items-center gap-3 w-full mt-auto pt-3 border-t border-slate-100 dark:border-[#1E222A]">
              <span className="text-[9px] font-bold tracking-wider text-slate-400 dark:text-slate-400 uppercase">
                Doc
              </span>
              <button className="h-9 w-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1A1D24] transition-colors">
                <FileText className="h-4 w-4" />
              </button>
            </div>
          </aside>

          {/* Main Dashboard Surface */}
          <main className="flex-1 p-4 sm:p-6 lg:p-7 overflow-y-auto bg-slate-50/50 dark:bg-[#0E1015]">
            {/* Page Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Crypto Wallet
              </h1>
            </div>

            {/* Grid Layout: Left List + Center Analytics + Right Details */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              
              {/* Left Column: Coins / Asset List (4 Cols) */}
              <div className="lg:col-span-4 flex flex-col gap-3">
                {/* Search Bar for Assets */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-[#16181E] border border-slate-200/80 dark:border-[#222631] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                  />
                </div>

                {/* Assets List */}
                <div className="space-y-2">
                  {filteredAssets.map((asset) => {
                    const isActive = selectedAsset === asset.id;
                    return (
                      <div
                        key={asset.id}
                        onClick={() => setSelectedAsset(asset.id)}
                        className={`cursor-pointer rounded-xl px-4 py-3 flex items-center justify-between transition-all duration-150 ${
                          isActive
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-white shadow-[0_4px_18px_rgba(16,185,129,0.35)]'
                            : 'bg-white dark:bg-[#16181E] hover:bg-slate-100/70 dark:hover:bg-[#1C2028] border border-slate-200/60 dark:border-[#222631] text-slate-900 dark:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-9 w-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                              isActive
                                ? 'bg-white/20 text-white'
                                : 'bg-slate-100 dark:bg-[#202530] text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {asset.symbol.slice(0, 1)}
                          </div>
                          <div>
                            <p
                              className={`text-sm font-semibold leading-snug ${
                                isActive ? 'text-white' : 'text-slate-900 dark:text-white'
                              }`}
                            >
                              {asset.name}
                            </p>
                            <p
                              className={`text-[11px] ${
                                isActive ? 'text-white/80' : 'text-slate-400 dark:text-slate-400'
                              }`}
                            >
                              Balance: {asset.balance}
                            </p>
                          </div>
                        </div>

                        {isActive && (
                          <div className="h-6 w-6 rounded-lg bg-white/20 flex items-center justify-center text-white">
                            <Settings className="h-3.5 w-3.5" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Center Column: Overview Chart + Pending & Completed Orders (5 Cols) */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                
                {/* Balance & Chart Card */}
                <div className="bg-white dark:bg-[#16181E] rounded-2xl p-5 border border-slate-200/80 dark:border-[#222631] shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                        ₿
                      </div>
                      <div>
                        <p className="text-sm font-bold text-amber-500">1.95232 BTC</p>
                        <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          $47,748.42
                        </p>
                      </div>
                    </div>

                    <button className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                      <SlidersHorizontal className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Sparkline Wave Chart & Buttons */}
                  <div className="mt-5 grid grid-cols-12 gap-3 items-center">
                    {/* Action buttons */}
                    <div className="col-span-4 flex flex-col gap-2">
                      <button className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-[#202530] text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-[#282E3B] transition-colors mb-1">
                        <ArrowLeftRight className="h-3.5 w-3.5" />
                      </button>
                      <button className="w-full py-1.5 px-3 rounded-lg text-xs font-semibold bg-gradient-to-r from-emerald-500 to-teal-400 text-white shadow-[0_4px_14px_rgba(16,185,129,0.35)] hover:opacity-95 transition-all">
                        Send
                      </button>
                      <button className="w-full py-1.5 px-3 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors">
                        Receive
                      </button>
                    </div>

                    {/* Chart Graphic Area */}
                    <div className="col-span-8 h-28 relative">
                      <svg
                        className="w-full h-full overflow-visible"
                        viewBox="0 0 240 80"
                        preserveAspectRatio="none"
                      >
                        <defs>
                          <linearGradient id="emeraldGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#10B981" stopOpacity="0.38" />
                            <stop offset="100%" stopColor="#10B981" stopOpacity="0.00" />
                          </linearGradient>
                        </defs>
                        {/* Area Fill */}
                        <path
                          d="M0,60 Q25,58 45,62 T85,55 T125,58 T165,40 T195,30 T220,18 T240,15 L240,80 L0,80 Z"
                          fill="url(#emeraldGradient)"
                        />
                        {/* Curve Line */}
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

                {/* Pending Execution */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2.5">
                    Pending Execution (1)
                  </h3>
                  <div className="bg-white dark:bg-[#16181E] rounded-xl p-3.5 border border-slate-200/80 dark:border-[#222631] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-[#202530] text-slate-500 dark:text-slate-400 flex items-center justify-center">
                        <ArrowDown className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          Buy USDT
                        </p>
                        <p className="text-[11px] text-amber-500 font-medium">In process</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-900 dark:text-white">1024.53</p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-400">-1005.96</p>
                    </div>
                  </div>
                </div>

                {/* Completed Execution */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2.5">
                    Completed (2)
                  </h3>
                  <div className="space-y-2">
                    {/* Featured/Active Completed Item with Emerald Gradient */}
                    <div className="rounded-xl p-3.5 bg-gradient-to-r from-emerald-500 to-teal-400 text-white shadow-[0_4px_16px_rgba(16,185,129,0.35)] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-white/20 text-white flex items-center justify-center">
                          <ArrowDown className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">Buy USDT</p>
                          <p className="text-[11px] text-white/80">23 Jul at 12:59 AM</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-white">7104.23</p>
                        <p className="text-[11px] text-white/80">-7050.47</p>
                      </div>
                    </div>

                    {/* Standard Completed Item 2 */}
                    <div className="bg-white dark:bg-[#16181E] rounded-xl p-3.5 border border-slate-200/80 dark:border-[#222631] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-[#202530] text-slate-500 dark:text-slate-400 flex items-center justify-center">
                          <ArrowDown className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">
                            Buy USDT
                          </p>
                          <p className="text-[11px] text-red-500 font-medium">Canceled</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-900 dark:text-white">601.77</p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-400">-598.63</p>
                      </div>
                    </div>

                    {/* Standard Completed Item 3 */}
                    <div className="bg-white dark:bg-[#16181E] rounded-xl p-3.5 border border-slate-200/80 dark:border-[#222631] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-[#202530] text-slate-500 dark:text-slate-400 flex items-center justify-center">
                          <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">
                            Transfer USDT
                          </p>
                          <p className="text-[11px] text-slate-400 dark:text-slate-400">
                            20 Jul at 12:00 AM
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-900 dark:text-white">863.12</p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-400">855.12</p>
                      </div>
                    </div>

                    {/* Standard Completed Item 4 */}
                    <div className="bg-white dark:bg-[#16181E] rounded-xl p-3.5 border border-slate-200/80 dark:border-[#222631] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-[#202530] text-slate-500 dark:text-slate-400 flex items-center justify-center">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">
                            Invoice
                          </p>
                          <p className="text-[11px] text-slate-400 dark:text-slate-400">
                            19 Jul at 12:00 AM
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-900 dark:text-white">123.74</p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-400">-120</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Buy Details & Stepper (3 Cols) */}
              <div className="lg:col-span-3">
                <div className="bg-white dark:bg-[#16181E] rounded-2xl p-5 border border-slate-200/80 dark:border-[#222631] shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
                    Buy Details
                  </h3>

                  <div className="space-y-3.5 text-xs">
                    <div>
                      <p className="text-[11px] text-slate-400 dark:text-slate-400">txHash:</p>
                      <p className="font-mono text-[11px] text-blue-500 dark:text-blue-400 break-all leading-relaxed">
                        0x68b75221026759c6588c714bed35db2bfa838ae...
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] text-slate-400 dark:text-slate-400">
                        TxReceipt Status:
                      </p>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        Pending execution
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] text-slate-400 dark:text-slate-400">
                        Purchased from the card:
                      </p>
                      <p className="font-semibold text-slate-900 dark:text-white">** 3232</p>
                    </div>

                    <div>
                      <p className="text-[11px] text-slate-400 dark:text-slate-400">
                        To USDT Wallet
                      </p>
                      <p className="font-semibold text-slate-900 dark:text-white">**98578hfms</p>
                    </div>
                  </div>

                  {/* Stepper Timeline */}
                  <div className="mt-6 pt-5 border-t border-slate-100 dark:border-[#222631]">
                    <div className="relative pl-6 space-y-5">
                      {/* Vertical line connecting nodes */}
                      <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-blue-500/30 dark:bg-blue-400/30" />

                      {/* Step 1 */}
                      <div className="relative">
                        <div className="absolute -left-6 top-1 h-3.5 w-3.5 rounded-full border-2 border-blue-500 bg-white dark:bg-[#16181E] flex items-center justify-center">
                          <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300">
                          NGN sent. Waiting for seller confirm
                        </p>
                      </div>

                      {/* Step 2 */}
                      <div className="relative">
                        <div className="absolute -left-6 top-1 h-3.5 w-3.5 rounded-full border-2 border-blue-500 bg-white dark:bg-[#16181E] flex items-center justify-center">
                          <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300">
                          Seller has confirmed receipt
                        </p>
                      </div>

                      {/* Step 3 */}
                      <div className="relative">
                        <div className="absolute -left-6 top-1 h-3.5 w-3.5 rounded-full border-2 border-blue-500 bg-white dark:bg-[#16181E] flex items-center justify-center">
                          <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300">
                          Seller has sent USDT
                        </p>
                      </div>

                      {/* Step 4 */}
                      <div className="relative">
                        <div className="absolute -left-6 top-1 h-3.5 w-3.5 rounded-full border-2 border-blue-500 bg-white dark:bg-[#16181E] flex items-center justify-center">
                          <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300">
                          Transaction complete
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
