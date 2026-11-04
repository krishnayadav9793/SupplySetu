import React from 'react';
import { ShoppingBag, ArrowRight, Sparkles } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export const CartSummaryBar: React.FC = () => {
  const {
    totalItemsCount,
    totalUniqueItems,
    grandTotal,
    totalFreeUnits,
    setIsCartDrawerOpen,
  } = useCart();

  if (totalItemsCount === 0) return null;

  return (
    <aside
      aria-label="Cart Overview Bar"
      className="sticky bottom-4 z-40 mt-6 mx-auto w-full max-w-4xl"
    >
      <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-900 text-white p-3.5 sm:p-4 shadow-2xl shadow-slate-950/40 border border-slate-800 animate-slideUp">
        {/* Left: Item count & Free goods info */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/30">
            <ShoppingBag className="w-5 h-5" />
            <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-extrabold text-white">
              {totalUniqueItems}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-100">
                {totalItemsCount} {totalItemsCount === 1 ? 'Box' : 'Boxes'} in Cart
              </span>
              {totalFreeUnits > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-2 py-0.5 text-[11px] font-semibold text-amber-300 border border-amber-400/30">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  +{totalFreeUnits} Free!
                </span>
              )}
            </div>
            <div className="text-xs text-slate-400">
              Tax invoice preview ready
            </div>
          </div>
        </div>

        {/* Right: Total Amount & Review Button */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-slate-400 uppercase tracking-wider font-medium">
              Est. Total
            </div>
            <div className="text-base sm:text-lg font-bold text-emerald-400">
              ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsCartDrawerOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-bold px-4 py-2.5 text-sm transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
          >
            <span>Review Cart</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
