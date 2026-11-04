import React from 'react';
import {
  X,
  Trash2,
  Plus,
  Minus,
  Sparkles,
  ShoppingBag,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

export const CartDrawer: React.FC = () => {
  const {
    items,
    isCartDrawerOpen,
    setIsCartDrawerOpen,
    updateQuantity,
    removeFromCart,
    clearCart,
    subtotal,
    totalDiscount,
    totalGst,
    grandTotal,
    totalFreeUnits,
  } = useCart();

  const { user } = useAuth();
  const retailer = user?.retailer;

  if (!isCartDrawerOpen) return null;

  const creditLimit = retailer?.creditLimit ?? 75000;
  const outstandingBalance = retailer?.outstandingBalance ?? 14200;
  const availableCredit = Math.max(0, creditLimit - outstandingBalance);
  const exceedsCredit = grandTotal > availableCredit;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
        onClick={() => setIsCartDrawerOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-[#12151c] shadow-2xl flex flex-col border-l border-slate-200 dark:border-[#222736]">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-[#222736] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Shopping Cart
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {items.length} unique items selected
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {items.length > 0 && (
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-xs text-slate-400 hover:text-rose-500 p-1.5 transition-colors"
                  title="Clear Cart"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsCartDrawerOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <ShoppingBag className="w-12 h-12 mb-3 stroke-1 text-slate-300 dark:text-slate-600" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Your cart is empty
                </p>
                <p className="text-xs mt-1 max-w-xs text-slate-400">
                  Browse the FMCG catalogue to add products with your personalized dealer rates.
                </p>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.product.id}
                  className="rounded-xl border border-slate-200/80 dark:border-[#222736] p-3.5 bg-slate-50/50 dark:bg-[#161a23] relative group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider truncate">
                        {item.product.brand}
                      </div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">
                        {item.product.name}
                      </h4>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        ₹{item.unitPrice.toFixed(2)} / {item.product.unit} • {item.product.packSize}
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-bold text-slate-900 dark:text-white">
                        ₹{item.itemTotal.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        incl. {item.product.gstRate}% GST
                      </div>
                    </div>
                  </div>

                  {/* Scheme benefit highlight */}
                  {(item.freeQuantity > 0 || item.discountAmount > 0) && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded-md">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                      <span>
                        {item.freeQuantity > 0 && `+${item.freeQuantity} Free Box `}
                        {item.discountAmount > 0 && `(-₹${item.discountAmount.toFixed(2)} discount)`}
                      </span>
                    </div>
                  )}

                  {/* Quantity Controller & Delete */}
                  <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-[#222736] flex items-center justify-between">
                    <div className="flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 bg-white dark:bg-slate-900">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="w-6 h-6 rounded flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-xs font-bold text-slate-900 dark:text-white">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="w-6 h-6 rounded flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-slate-400 hover:text-rose-500 p-1 text-xs transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Drawer Footer with Price Breakdown & Credit Validation */}
          {items.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-[#222736] bg-slate-50/80 dark:bg-[#151922] space-y-3.5">
              {/* Cost Summary Breakdown */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Subtotal</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    ₹{subtotal.toFixed(2)}
                  </span>
                </div>

                {totalDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                    <span>Scheme Discounts</span>
                    <span>-₹{totalDiscount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>GST (CGST + SGST)</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    ₹{totalGst.toFixed(2)}
                  </span>
                </div>

                {totalFreeUnits > 0 && (
                  <div className="flex justify-between text-amber-600 dark:text-amber-400 font-semibold">
                    <span>Promotional Free Boxes</span>
                    <span>{totalFreeUnits} Boxes</span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between text-sm font-bold text-slate-900 dark:text-white">
                  <span>Grand Total</span>
                  <span className="text-emerald-600 dark:text-emerald-400">
                    ₹{grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Credit Limit Health Check */}
              <div
                className={`p-2.5 rounded-xl border text-xs ${
                  exceedsCredit
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/40 text-rose-700 dark:text-rose-300'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold">
                  {exceedsCredit ? (
                    <>
                      <ShieldAlert className="w-4 h-4 text-rose-500 flex-shrink-0" />
                      <span>Credit Limit Exceeded</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span>Credit Available: ₹{availableCredit.toLocaleString('en-IN')}</span>
                    </>
                  )}
                </div>
                <div className="text-[11px] mt-0.5 opacity-85">
                  {exceedsCredit
                    ? `Order total (₹${grandTotal.toFixed(0)}) exceeds remaining credit limit (₹${availableCredit.toLocaleString('en-IN')}). Will require distributor manager approval.`
                    : `Your order fits within the ₹${creditLimit.toLocaleString('en-IN')} approved credit line.`}
                </div>
              </div>

              {/* Checkout / Place Order Button */}
              <button
                type="button"
                onClick={() => {
                  alert(
                    `Order placement initialized with ${items.length} items totaling ₹${grandTotal.toFixed(
                      2
                    )}. (Phase 3 Cart & Scheme Engine will complete order persistence).`
                  );
                  setIsCartDrawerOpen(false);
                }}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
              >
                <span>Proceed to Order Confirmation</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
