import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react';
import { Product, CartItem, Scheme } from '../types';

interface CartContextType {
  items: CartItem[];
  totalUniqueItems: number;
  totalItemsCount: number;
  subtotal: number;
  totalDiscount: number;
  totalGst: number;
  grandTotal: number;
  totalFreeUnits: number;
  isCartDrawerOpen: boolean;
  setIsCartDrawerOpen: (open: boolean) => void;
  getItemQuantity: (productId: string) => number;
  addToCart: (product: Product, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'supplysetu-cart-items';

function calculateItemBenefits(product: Product, quantity: number) {
  const unitPrice = product.pricing?.rate ?? product.basePrice;
  let discountAmount = 0;
  let freeQuantity = 0;

  const scheme: Scheme | null | undefined = product.scheme;

  if (scheme && quantity >= scheme.minQuantity) {
    if (scheme.schemeType === 'BUY_X_GET_Y_FREE') {
      // e.g. Buy 10 Get 1 Free -> Math.floor(quantity / minQuantity) * freeQuantity
      const sets = Math.floor(quantity / scheme.minQuantity);
      freeQuantity = sets * scheme.freeQuantity;
    } else if (scheme.schemeType === 'PERCENTAGE_DISCOUNT') {
      // e.g. 5% off on total if quantity >= minQuantity
      discountAmount = Math.round(((unitPrice * quantity * scheme.discountPercent) / 100) * 100) / 100;
    } else if (scheme.schemeType === 'FLAT_DISCOUNT') {
      discountAmount = Math.round((scheme.discountPercent * quantity) * 100) / 100;
    }
  }

  const taxableAmount = Math.max(0, unitPrice * quantity - discountAmount);
  const gstRate = product.gstRate || 18.0;
  const gstAmount = Math.round(((taxableAmount * gstRate) / 100) * 100) / 100;
  const itemTotal = Math.round((taxableAmount + gstAmount) * 100) / 100;

  return {
    unitPrice,
    freeQuantity,
    discountAmount,
    gstAmount,
    itemTotal,
  };
}

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to parse saved cart:', e);
    }
    return [];
  });

  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('Failed to save cart to localStorage:', e);
    }
  }, [items]);

  const getItemQuantity = (productId: string): number => {
    const item = items.find((i) => i.product.id === productId);
    return item ? item.quantity : 0;
  };

  const addToCart = (product: Product, quantityToAdd: number = 1) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.product.id === product.id);

      if (existingIndex > -1) {
        const currentItem = prev[existingIndex];
        const newQty = currentItem.quantity + quantityToAdd;
        const benefits = calculateItemBenefits(product, newQty);

        const updated = [...prev];
        updated[existingIndex] = {
          product,
          quantity: newQty,
          ...benefits,
        };
        return updated;
      } else {
        const qty = Math.max(product.minOrderQty || 1, quantityToAdd);
        const benefits = calculateItemBenefits(product, qty);
        return [
          ...prev,
          {
            product,
            quantity: qty,
            ...benefits,
          },
        ];
      }
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setItems((prev) => {
      return prev.map((item) => {
        if (item.product.id === productId) {
          const benefits = calculateItemBenefits(item.product, quantity);
          return {
            ...item,
            quantity,
            ...benefits,
          };
        }
        return item;
      });
    });
  };

  const removeFromCart = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const totals = useMemo(() => {
    let totalItemsCount = 0;
    let subtotal = 0;
    let totalDiscount = 0;
    let totalGst = 0;
    let grandTotal = 0;
    let totalFreeUnits = 0;

    for (const item of items) {
      totalItemsCount += item.quantity;
      subtotal += item.unitPrice * item.quantity;
      totalDiscount += item.discountAmount;
      totalGst += item.gstAmount;
      grandTotal += item.itemTotal;
      totalFreeUnits += item.freeQuantity;
    }

    return {
      totalUniqueItems: items.length,
      totalItemsCount,
      subtotal: Math.round(subtotal * 100) / 100,
      totalDiscount: Math.round(totalDiscount * 100) / 100,
      totalGst: Math.round(totalGst * 100) / 100,
      grandTotal: Math.round(grandTotal * 100) / 100,
      totalFreeUnits,
    };
  }, [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        ...totals,
        isCartDrawerOpen,
        setIsCartDrawerOpen,
        getItemQuantity,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
