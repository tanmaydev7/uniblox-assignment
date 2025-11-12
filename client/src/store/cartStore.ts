import { create } from 'zustand';

export interface CartItem {
  id: number;
  name: string;
  price: number;
  stock: number;
  image: string | null;
  quantity: number;
}

interface AppliedCoupon {
  code: string;
  discountPercent: number;
}

interface CartStore {
  items: CartItem[];
  appliedCoupon: AppliedCoupon | null;
  increaseQuantity: (product: Omit<CartItem, 'quantity'>) => void;
  decreaseQuantity: (productId: number) => void;
  clearCart: () => void;
  setCart: (items: CartItem[]) => void;
  applyCoupon: (coupon: AppliedCoupon) => void;
  removeCoupon: () => void;
}

export const useCartStore = create<CartStore>()((set, get) => ({
  items: [],
  appliedCoupon: null,

  increaseQuantity: (product) => {
    const items = get().items;
    const existingItem = items.find((item) => item.id === product.id);

    if (existingItem) {
      // If item exists, increase quantity
      set({
        items: items.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ),
      });
    } else {
      // If item doesn't exist, add it with quantity 1
      set({
        items: [...items, { ...product, quantity: 1 }],
      });
    }
  },

  decreaseQuantity: (productId: number) => {
    const items = get().items;
    const existingItem = items.find((item) => item.id === productId);

    if (existingItem) {
      if (existingItem.quantity > 1) {
        // Decrease quantity
        set({
          items: items.map((item) =>
            item.id === productId
              ? { ...item, quantity: item.quantity - 1 }
              : item
          ),
        });
      } else {
        // Remove item if quantity is 1
        set({
          items: items.filter((item) => item.id !== productId),
        });
      }
    }
  },

  clearCart: () => {
    set({ items: [], appliedCoupon: null });
  },

  setCart: (items: CartItem[]) => {
    set({ items });
  },

  applyCoupon: (coupon: AppliedCoupon) => {
    set({ appliedCoupon: coupon });
  },

  removeCoupon: () => {
    set({ appliedCoupon: null });
  },
}));

