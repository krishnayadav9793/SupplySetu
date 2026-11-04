import React from 'react';
import { Plus, Minus, Check, Package, Sparkles, AlertCircle } from 'lucide-react';
import { Product } from '../../types';
import { useCart } from '../../context/CartContext';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { getItemQuantity, addToCart, updateQuantity } = useCart();
  const quantityInCart = getItemQuantity(product.id);

  const rate = product.pricing?.rate ?? product.basePrice;
  const mrp = product.pricing?.mrp ?? product.mrp;
  const marginPercent = product.pricing?.marginPercent ?? Math.round(((mrp - rate) / mrp) * 100);
  const gstRate = product.gstRate || 18.0;

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 20;

  const handleIncrement = () => {
    if (quantityInCart >= product.stock) return;
    if (quantityInCart === 0) {
      addToCart(product, Math.max(1, product.minOrderQty || 1));
    } else {
      updateQuantity(product.id, quantityInCart + 1);
    }
  };

  const handleDecrement = () => {
    if (quantityInCart > 0) {
      updateQuantity(product.id, quantityInCart - 1);
    }
  };

  const handleDirectInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (isNaN(val) || val <= 0) {
      updateQuantity(product.id, 0);
    } else {
      const clamped = Math.min(val, product.stock);
      updateQuantity(product.id, clamped);
    }
  };

  // Scheme calculation preview for badge
  const scheme = product.scheme;
  let schemeBadgeText: string | null = null;
  if (scheme) {
    if (scheme.schemeType === 'BUY_X_GET_Y_FREE') {
      schemeBadgeText = `Buy ${scheme.minQuantity} Get ${scheme.freeQuantity} FREE`;
    } else if (scheme.schemeType === 'PERCENTAGE_DISCOUNT') {
      schemeBadgeText = `${scheme.discountPercent}% OFF on ${scheme.minQuantity}+ ${product.unit}s`;
    } else if (scheme.schemeType === 'FLAT_DISCOUNT') {
      schemeBadgeText = `₹${scheme.discountPercent} OFF per ${product.unit}`;
    }
  }

  // Free items earned preview
  let freeUnitsEarned = 0;
  if (scheme && scheme.schemeType === 'BUY_X_GET_Y_FREE' && quantityInCart >= scheme.minQuantity) {
    freeUnitsEarned = Math.floor(quantityInCart / scheme.minQuantity) * scheme.freeQuantity;
  }

  return (
    <div
      className={`group relative flex flex-col justify-between rounded-xl border bg-white dark:bg-[#151922] p-4 transition-all duration-200 hover:shadow-lg ${
        quantityInCart > 0
          ? 'border-emerald-500/60 dark:border-emerald-500/40 ring-1 ring-emerald-500/20'
          : 'border-slate-200/80 dark:border-[#262c3b] hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      {/* Top Meta: Brand & Badges */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400">
            {product.brand}
          </span>

          {/* Stock Availability Pill */}
          {isOutOfStock ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 text-[11px] font-medium text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-800/40">
              <AlertCircle className="w-3 h-3" /> Out of Stock
            </span>
          ) : isLowStock ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/40">
              Low Stock ({product.stock})
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              In Stock ({product.stock})
            </span>
          )}
        </div>

        {/* Product Title */}
        <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug">
          {product.name}
        </h3>

        {/* Packaging info & SKU */}
        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1">
            <Package className="w-3 h-3 text-slate-400" />
            {product.packSize}
          </span>
          <span>•</span>
          <span className="font-mono text-[11px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">
            {product.skuCode}
          </span>
        </div>

        {/* Active Promotional Scheme Banner */}
        {schemeBadgeText && (
          <div className="mt-2.5 flex items-center gap-1.5 rounded-md bg-amber-500/10 dark:bg-amber-400/10 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-300 border border-amber-500/20">
            <Sparkles className="w-3.5 h-3.5 flex-shrink-0 text-amber-500" />
            <span className="truncate">{schemeBadgeText}</span>
          </div>
        )}
      </div>

      {/* Pricing & Cart Action Area */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#222736]">
        <div className="flex items-baseline justify-between mb-3">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                ₹{rate.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
              </span>
              <span className="text-xs text-slate-400 line-through">
                MRP ₹{mrp.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              per {product.unit} (excl. {gstRate}% GST)
            </div>
          </div>

          {/* Retailer Margin Tag */}
          <div className="text-right">
            <span className="inline-block rounded-md bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
              {marginPercent}% Margin
            </span>
            {product.pricing?.tierDiscountPercent ? (
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                {product.pricing.tier} (-{product.pricing.tierDiscountPercent}%)
              </div>
            ) : null}
          </div>
        </div>

        {/* Action Button / Stepper */}
        {quantityInCart === 0 ? (
          <button
            type="button"
            disabled={isOutOfStock}
            onClick={handleIncrement}
            className={`w-full py-2.5 px-3 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold transition-all duration-150 ${
              isOutOfStock
                ? 'bg-slate-100 dark:bg-slate-800/60 text-slate-400 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white shadow-sm shadow-emerald-600/30'
            }`}
          >
            <Plus className="w-4 h-4" />
            {isOutOfStock ? 'Unavailable' : 'Add to Cart'}
          </button>
        ) : (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between rounded-lg border border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/20 p-1">
              <button
                type="button"
                onClick={handleDecrement}
                className="w-8 h-8 rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 flex items-center justify-center shadow-xs transition-transform"
                title="Decrease quantity"
              >
                <Minus className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1 px-2">
                <input
                  type="number"
                  min="0"
                  max={product.stock}
                  value={quantityInCart}
                  onChange={handleDirectInput}
                  className="w-14 text-center font-bold text-slate-900 dark:text-white bg-transparent focus:outline-hidden text-sm"
                />
                <span className="text-xs text-slate-500 dark:text-slate-400 uppercase">
                  {product.unit}
                </span>
              </div>

              <button
                type="button"
                disabled={quantityInCart >= product.stock}
                onClick={handleIncrement}
                className={`w-8 h-8 rounded-md flex items-center justify-center shadow-xs transition-transform active:scale-95 ${
                  quantityInCart >= product.stock
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
                title="Increase quantity"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Scheme bonus notification */}
            {freeUnitsEarned > 0 ? (
              <div className="flex items-center justify-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 animate-fadeIn">
                <Check className="w-3 h-3" />
                <span>Includes {freeUnitsEarned} FREE {product.unit}(s)!</span>
              </div>
            ) : scheme && scheme.schemeType === 'BUY_X_GET_Y_FREE' ? (
              <div className="text-center text-[10px] text-slate-400">
                Add {scheme.minQuantity - quantityInCart} more to get {scheme.freeQuantity} FREE
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};
