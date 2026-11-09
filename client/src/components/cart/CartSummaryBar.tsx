import React from 'react';
import { ShoppingBag, ArrowRight, Sparkles } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export const CartSummaryBar: React.FC = () => {
  const { totalItemsCount, totalUniqueItems, grandTotal, totalFreeUnits, setIsCartDrawerOpen } =
    useCart();

  if (totalItemsCount === 0) return null;

  return (
    <aside
      aria-label="Cart Overview Bar"
      className="sticky bottom-18 sm:bottom-4 z-30 mt-6 mx-auto w-full max-w-4xl px-2 sm:px-0"
    >
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 rounded-2xl bg-slate-900 text-white p-3.5 sm:p-4 shadow-2xl shadow-slate-950/40 border border-slate-800 animate-slideUp">
        {/* Left / Top on mobile: Item count & Free goods info */}
        <div className="flex items-center justify-between sm:justify-start gap-3 min-w-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="relative flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/30 flex-shrink-0">
              <ShoppingBag className="w-5 h-5" />
              <span className="absolute -top-1.5 -right-1.5 flex h-4.5 w-4.5 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-rose-500 text-[9px] sm:text-[10px] font-extrabold text-white">
                {totalUniqueItems}
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-bold text-slate-100 whitespace-nowrap">
                  {totalItemsCount} {totalItemsCount === 1 ? 'Box' : 'Boxes'} in Cart
                </span>
                {totalFreeUnits > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold text-amber-300 border border-amber-400/30 whitespace-nowrap">
                    <Sparkles className="w-3 h-3 text-amber-400" />+{totalFreeUnits} Free!
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                Jabalpur FMCG depot ready for delivery
              </div>
            </div>
          </div>

          {/* On mobile: display total right beside count */}
          <div className="sm:hidden text-right flex-shrink-0 pl-2">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Total</span>
            <span className="text-sm font-extrabold text-emerald-400 whitespace-nowrap">
              ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Right / Bottom on mobile: Total Amount & Review Button */}
        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">
          <div className="hidden sm:block text-right">
            <div className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-wider font-medium">
              Est. Invoice Total
            </div>
            <div className="text-base sm:text-lg font-black text-emerald-400 whitespace-nowrap">
              ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsCartDrawerOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-bold px-4 py-2.5 text-xs sm:text-sm transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
          >
            <span>Review Cart &amp; Order</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
