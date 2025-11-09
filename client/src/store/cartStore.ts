import { create } from 'zustand';
import { storeAxiosInstance } from '../utils/storeUtils';

export interface CartItem {
  id: number;
  name: string;
  price: number;
  stock: number;
  image: string | null;
  quantity: number;
}

interface CartResponse {
  data: {
    items: CartItem[];
    mobileNo: string;
  };
}

interface UpdateCartPayload {
  items: Array<{
    productId: number;
    quantity: number;
  }>;
}

interface CartStore {
  items: CartItem[];
  isLoading: boolean;
  error: string | null;
  mobileNo: string | null;
  fetchCart: (mobileNo: string) => Promise<void>;
  syncCartToAPI: (mobileNo: string) => Promise<void>;
  addItem: (product: Omit<CartItem, 'quantity'>) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  setCartItems: (items: CartItem[]) => void;
}

export const useCartStore = create<CartStore>()((set, get) => ({
  items: [],
  isLoading: false,
  error: null,
  mobileNo: null,

  fetchCart: async (mobileNo: string) => {
    set({ isLoading: true, error: null, mobileNo });
    try {
      const response = await storeAxiosInstance.get<CartResponse>(
        '/api/v1/store/cart',
        {
          params: { mobileNo },
        }
      );
      set({
        items: response.data.data.items,
        isLoading: false,
        mobileNo,
      });
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || error.message || 'Failed to fetch cart';
      console.error('Error fetching cart:', error);
      set({
        error: errorMessage,
        isLoading: false,
        items: [],
      });
    }
  },

  syncCartToAPI: async (mobileNo: string) => {
    const items = get().items;
    try {
      const payload: UpdateCartPayload = {
        items: items.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
        })),
      };

      await storeAxiosInstance.put('/api/v1/store/cart', payload, {
        params: { mobileNo },
      });
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || error.message || 'Failed to update cart';
      console.error('Error syncing cart to API:', error);
      set({ error: errorMessage });
      throw error;
    }
  },

  setCartItems: (items: CartItem[]) => {
    set({ items });
  },

  addItem: (product) => {
    const items = get().items;
    const existingItem = items.find((item) => item.id === product.id);

    let newItems: CartItem[];
    if (existingItem) {
      // If item exists, increase quantity
      newItems = items.map((item) =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    } else {
      // If item doesn't exist, add it with quantity 1
      newItems = [...items, { ...product, quantity: 1 }];
    }

    set({ items: newItems });

    // Sync to API if user is logged in
    const mobileNo = get().mobileNo;
    if (mobileNo) {
      get().syncCartToAPI(mobileNo).catch((err) => {
        console.error('Failed to sync cart after adding item:', err);
      });
    }
  },

  removeItem: (productId: number) => {
    const newItems = get().items.filter((item) => item.id !== productId);
    set({ items: newItems });

    // Sync to API if user is logged in
    const mobileNo = get().mobileNo;
    if (mobileNo) {
      get().syncCartToAPI(mobileNo).catch((err) => {
        console.error('Failed to sync cart after removing item:', err);
      });
    }
  },

  updateQuantity: (productId: number, quantity: number) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }

    const newItems = get().items.map((item) =>
      item.id === productId ? { ...item, quantity } : item
    );
    set({ items: newItems });

    // Sync to API if user is logged in
    const mobileNo = get().mobileNo;
    if (mobileNo) {
      get().syncCartToAPI(mobileNo).catch((err) => {
        console.error('Failed to sync cart after updating quantity:', err);
      });
    }
  },

  clearCart: () => {
    set({ items: [] });

    // Sync to API if user is logged in
    const mobileNo = get().mobileNo;
    if (mobileNo) {
      get().syncCartToAPI(mobileNo).catch((err) => {
        console.error('Failed to sync cart after clearing:', err);
      });
    }
  },

  getTotalItems: () => {
    return get().items.reduce((total, item) => total + item.quantity, 0);
  },

  getTotalPrice: () => {
    return get().items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  },
}));

