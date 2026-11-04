import React from 'react';
import { Search, X, CheckCircle2 } from 'lucide-react';
import { CategorySummary } from '../../types';

interface ProductSearchAndFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categories: CategorySummary[];
  inStockOnly: boolean;
  onInStockChange: (inStock: boolean) => void;
  totalProductsCount: number;
}

export const ProductSearchAndFilter: React.FC<ProductSearchAndFilterProps> = ({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
  inStockOnly,
  onInStockChange,
  totalProductsCount,
}) => {
  return (
    <div className="space-y-4 mb-6">
      {/* Search Input Bar & Quick Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by product name, brand, SKU code (e.g. Parle, Maggi, Tea)..."
            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-[#262c3b] bg-white dark:bg-[#151922] text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all shadow-xs"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* In-Stock Filter Pill */}
        <button
          type="button"
          onClick={() => onInStockChange(!inStockOnly)}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all cursor-pointer select-none ${
            inStockOnly
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/50 text-emerald-700 dark:text-emerald-400'
              : 'bg-white dark:bg-[#151922] border-slate-200 dark:border-[#262c3b] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1a202c]'
          }`}
        >
          <CheckCircle2
            className={`w-4 h-4 ${inStockOnly ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}
          />
          <span>In Stock Only</span>
        </button>
      </div>

      {/* Category Pills (Horizontal Scrollable) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => onCategoryChange('All')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer ${
            selectedCategory === 'All'
              ? 'bg-slate-900 text-white dark:bg-emerald-500 dark:text-slate-950 shadow-xs'
              : 'bg-white dark:bg-[#151922] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-[#262c3b] hover:bg-slate-50 dark:hover:bg-[#1a202c]'
          }`}
        >
          All Items ({totalProductsCount})
        </button>

        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.name;
          return (
            <button
              key={cat.name}
              type="button"
              onClick={() => onCategoryChange(cat.name)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-slate-900 text-white dark:bg-emerald-500 dark:text-slate-950 shadow-xs'
                  : 'bg-white dark:bg-[#151922] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-[#262c3b] hover:bg-slate-50 dark:hover:bg-[#1a202c]'
              }`}
            >
              <span>{cat.name}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isSelected
                    ? 'bg-white/20 dark:bg-slate-950/20 text-white dark:text-slate-950'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}
              >
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
