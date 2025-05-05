import { create } from 'zustand';

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
  removeItem: (id: number) => void;

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

export const useCartStore = create<CartState>((set, get) => ({
  items: initialCartItems,

  // Hàm thêm sản phẩm vào giỏ hàng
  addItem: (item) => {
    const defaultItem: CartItemType = {
      ...item,
      quantity: item.quantity ?? 1,
      maxQuantity: item.maxQuantity ?? 10,
      size: item.size,
    };

    const existingItem = get().items.find(i => i.id === item.id && i.size === item.size);

    if (existingItem) {
      // Nếu sản phẩm đã có trong giỏ, tăng số lượng nhưng không vượt quá giới hạn
      const newQuantity = Math.min(existingItem.quantity + (defaultItem.quantity ?? 1), existingItem.maxQuantity);
      set(state => ({
        items: state.items.map(i =>
          i.id === item.id && i.size === item.size
            ? { ...i, quantity: newQuantity }
            : i
        ),
      }));
    } else {
      // Nếu là sản phẩm mới, thêm vào giỏ
      set(state => ({ items: [...state.items, defaultItem] }));
    }
  },

  // Xoá sản phẩm theo ID
  removeItem: (id: number) =>
    set(state => ({
      items: state.items.filter(item => item.id !== id),
    })),

  // Tăng số lượng sản phẩm (nếu chưa đạt maxQuantity)
  incrementItem: (id: number) =>
    set(state => ({
      items: state.items.map(item =>
        item.id === id && item.quantity < item.maxQuantity
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ),
    })),

  // Giảm số lượng sản phẩm (tối thiểu là 1)
  decrementItem: (id: number) =>
    set(state => ({
      items: state.items.map(item =>
        item.id === id && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item
      ),
    })),

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
  resetCart: () => set({ items: initialCartItems }),
}));
