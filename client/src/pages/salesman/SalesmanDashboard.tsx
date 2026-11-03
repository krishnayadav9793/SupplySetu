import { useState } from 'react';
import {
  CheckCircle,
  Clock,
  Plus,
  Wifi,
  WifiOff,
  Search,
  Store,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface BeatShop {
  id: string;
  name: string;
  owner: string;
  address: string;
  status: 'visited' | 'pending';
  lastOrder?: string;
  outstanding: number;
}

const BEAT_SHOPS: BeatShop[] = [
  {
    id: 's1',
    name: 'Shri Ganesh Kirana Store',
    owner: 'Anil Patel',
    address: 'Shop 14, Sarafa Chowk, Lordganj',
    status: 'visited',
    lastOrder: '₹11,850 (10 mins ago)',
    outstanding: 14200,
  },
  {
    id: 's2',
    name: 'Mahalaxmi Provision Store',
    owner: 'Dinesh Agarwal',
    address: 'Near Old Bus Stand, Lordganj',
    status: 'pending',
    lastOrder: '₹8,400 (3 days ago)',
    outstanding: 38200,
  },
  {
    id: 's3',
    name: 'Gupta Daily Needs & Dairy',
    owner: 'Sunil Gupta',
    address: '42 Subhash Marg, Lordganj',
    status: 'pending',
    lastOrder: '₹14,200 (Yesterday)',
    outstanding: 6500,
  },
  {
    id: 's4',
    name: 'Khandelwal Super Mart',
    owner: 'Mukesh Khandelwal',
    address: 'Main Market, Sarafa Bazaar',
    status: 'pending',
    lastOrder: '₹22,100 (5 days ago)',
    outstanding: 18900,
  },
  {
    id: 's5',
    name: 'Vijay General Store',
    owner: 'Vijay Sahu',
    address: 'Lane 3, Bada Fuhara',
    status: 'pending',
    lastOrder: '₹5,600 (1 week ago)',
    outstanding: 4200,
  },
];

export const SalesmanDashboard = () => {
  const { user } = useAuth();
  const [isOnline] = useState(true);
  const [search, setSearch] = useState('');

  const visitedCount = BEAT_SHOPS.filter((s) => s.status === 'visited').length;
  const progressPercent = Math.round((visitedCount / BEAT_SHOPS.length) * 100);

  const filtered = BEAT_SHOPS.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.owner.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Salesman Beat Header & Offline Badge */}
      <div className="bg-white dark:bg-[#16181E] rounded-2xl p-5 border border-slate-200/80 dark:border-[#222631] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/20">
              Active Beat #4
            </span>
            <span className="text-xs text-slate-400">Lordganj & Sarafa Sector</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            {user?.name}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Today's Target: 18 Kirana Visits &bull; Jabalpur Distribution Hub
          </p>
        </div>

        {/* Offline Status Indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#1C2028] border border-slate-200/80 dark:border-[#262B35] text-xs">
            {isOnline ? (
              <>
                <Wifi className="h-4 w-4 text-emerald-500" />
                <span className="text-slate-700 dark:text-slate-300 font-medium">Online Mode</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-amber-500" />
                <span className="text-amber-500 font-medium">Offline Sync Ready</span>
              </>
            )}
          </div>

          <button className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-emerald-500 to-teal-400 text-white shadow-[0_4px_14px_rgba(16,185,129,0.35)] flex items-center gap-2 hover:opacity-95 transition-all">
            <Plus className="h-4 w-4" />
            <span>Punch Order</span>
          </button>
        </div>
      </div>

      {/* Beat Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#16181E] rounded-2xl p-4 border border-slate-200/80 dark:border-[#222631]">
          <p className="text-xs font-semibold text-slate-400">Beat Coverage</p>
          <div className="mt-1 flex items-baseline justify-between">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {visitedCount} / {BEAT_SHOPS.length}
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
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            ₹34,450
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Daily Beat Target: ₹65,000</p>
        </div>

        <div className="bg-white dark:bg-[#16181E] rounded-2xl p-4 border border-slate-200/80 dark:border-[#222631]">
          <p className="text-xs font-semibold text-slate-400">Total Outstanding in Beat</p>
          <p className="text-2xl font-bold text-amber-500 mt-1">₹82,000</p>
          <p className="text-[11px] text-slate-400 mt-1">Across 5 mapped kirana accounts</p>
        </div>
      </div>

      {/* Beat Retailer Stores List */}
      <div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Today's Beat Sequence
          </h2>

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

        <div className="space-y-3">
          {filtered.map((shop) => {
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

                  <button className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-[#202530] dark:hover:bg-[#282E3B] text-slate-800 dark:text-white flex items-center gap-1 transition-colors">
                    <span>Take Order</span>
                    <ArrowRight className="h-3.5 w-3.5" />
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
