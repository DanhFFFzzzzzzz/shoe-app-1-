import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Định nghĩa kiểu dữ liệu cho sản phẩm trong giỏ hàng
export type CartItemType = {
  id: number;
  title: string;
  heroImage: string;
  price: number;
  quantity: number;
  maxQuantity: number;
  size: number;
};

// Định nghĩa trạng thái và các hàm thao tác với giỏ hàng
type CartState = {
  items: CartItemType[];

  // Thêm sản phẩm vào giỏ
  addItem: (item: Partial<CartItemType> & Pick<CartItemType, 'id' | 'title' | 'heroImage' | 'price' | 'size'>) => void;

  // Xoá sản phẩm khỏi giỏ
  removeItem: (id: number, size: number) => void;

  // Tăng số lượng sản phẩm
  incrementItem: (id: number) => void;

  // Giảm số lượng sản phẩm
  decrementItem: (id: number) => void;

  // Tính tổng tiền
  getTotalPrice: () => number;

  // Tổng số lượng sản phẩm trong giỏ
  getItemCount: () => number;

  // Xoá toàn bộ giỏ hàng
  resetCart: () => void;
};

// Khởi tạo giỏ hàng rỗng ban đầu
const initialCartItems: CartItemType[] = [];

// Helper lấy userId hiện tại
async function getCurrentUserId() {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || 'guest';
}

export const useCartStore = create<CartState>((set, get) => ({
  items: initialCartItems,

  // Hàm thêm sản phẩm vào giỏ hàng
  addItem: async (item) => {
    const defaultItem: CartItemType = {
      ...item,
      quantity: item.quantity ?? 1,
      maxQuantity: item.maxQuantity ?? 10,
      size: item.size,
    };
    const userId = await getCurrentUserId();
    const key = `cart_items_${userId}`;
    const existingItem = get().items.find(i => i.id === item.id && i.size === item.size);
    if (existingItem) {
      const newQuantity = Math.min(existingItem.quantity + (defaultItem.quantity ?? 1), existingItem.maxQuantity);
      set(state => {
        const newItems = state.items.map(i =>
          i.id === item.id && i.size === item.size
            ? { ...i, quantity: newQuantity }
            : i
        );
        AsyncStorage.setItem(key, JSON.stringify(newItems));
        return { items: newItems };
      });
    } else {
      set(state => {
        const newItems = [...state.items, defaultItem];
        AsyncStorage.setItem(key, JSON.stringify(newItems));
        return { items: newItems };
      });
    }
  },

  // Xoá sản phẩm theo ID và size
  removeItem: async (id: number, size: number) => {
    const userId = await getCurrentUserId();
    const key = `cart_items_${userId}`;
    set(state => {
      const newItems = state.items.filter(item => !(item.id === id && item.size === size));
      AsyncStorage.setItem(key, JSON.stringify(newItems));
      return { items: newItems };
    });
  },

  // Tăng số lượng sản phẩm (nếu chưa đạt maxQuantity)
  incrementItem: async (id: number) => {
    const userId = await getCurrentUserId();
    const key = `cart_items_${userId}`;
    set(state => {
      const newItems = state.items.map(item =>
        item.id === id && item.quantity < item.maxQuantity
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
      AsyncStorage.setItem(key, JSON.stringify(newItems));
      return { items: newItems };
    });
  },

  // Giảm số lượng sản phẩm (tối thiểu là 1)
  decrementItem: async (id: number) => {
    const userId = await getCurrentUserId();
    const key = `cart_items_${userId}`;
    set(state => {
      const newItems = state.items.map(item =>
        item.id === id && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item
      );
      AsyncStorage.setItem(key, JSON.stringify(newItems));
      return { items: newItems };
    });
  },

  // Tính tổng tiền giỏ hàng
  getTotalPrice: () => {
    const { items } = get();
    return items.reduce((total, item) => total + item.price * item.quantity, 0);
  },

  // Tính tổng số lượng sản phẩm trong giỏ
  getItemCount: () => {
    const { items } = get();
    return items.reduce((count, item) => count + item.quantity, 0);
  },

  // Reset giỏ hàng
  resetCart: async () => {
    const userId = await getCurrentUserId();
    const key = `cart_items_${userId}`;
    AsyncStorage.setItem(key, JSON.stringify(initialCartItems));
    set({ items: initialCartItems });
  },
}));

// Đọc lại giỏ hàng từ AsyncStorage khi app khởi động hoặc khi user đổi
export const useCartStoreHydration = () => {
  useEffect(() => {
    const loadCart = async () => {
      const userId = await getCurrentUserId();
      const key = `cart_items_${userId}`;
      const json = await AsyncStorage.getItem(key);
      if (json) {
        const items = JSON.parse(json);
        useCartStore.setState({ items });
      } else {
        useCartStore.setState({ items: initialCartItems });
      }
    };
    loadCart();
    // Lắng nghe sự kiện đăng nhập/đăng xuất để load lại giỏ hàng
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadCart();
    });
    return () => {
      subscription?.unsubscribe();
    };
  }, []);
};
