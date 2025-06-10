import { supabase } from '../lib/supabase';
import { ProductWithSizes } from '../types/database.types';

// Lấy API_BASE từ biến môi trường, fallback về IP cứng nếu không có
const API_BASE = process.env.NEXT_PUBLIC_RECOMMENDATION_API || "http://192.168.1.5:5555/api";

export const productApi = {
  // Lấy thông tin chi tiết của một sản phẩm dựa trên slug
  getProductBySlug: async (slug: string): Promise<ProductWithSizes> => {
    const { data, error } = await supabase
      .from('product')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) throw error;

    const { data: sizes, error: sizeError } = await supabase
      .from('product_size')
      .select('size, quantity')
      .eq('product', data.id);

    if (sizeError) throw sizeError;

    return { ...data, sizes: sizes || [] };
  },

  // Cập nhật số lượng sản phẩm (giảm số lượng tồn kho)
  updateProductQuantity: async (productId: number, size: number, quantity: number) => {
    const { error } = await supabase.rpc('decrement_product_quantity', {
      p_product_id: productId,
      p_size: size,
      p_quantity: quantity
    });

    if (error) throw error;
  },

  // Lấy số lượng tồn kho
  getProductQuantity: async (productId: number) => {
    const { data, error } = await supabase
      .from('product_size')
      .select('size, quantity')
      .eq('product', productId);

    if (error) throw error;
    return data;
  },

  // Tăng lại số lượng (thêm sản phẩm vào kho)
  incrementProductQuantity: async (productId: number, size: number, quantity: number) => {
    const { error } = await supabase.rpc('increment_product_quantity', {
      p_product_id: productId,
      p_size: size,
      p_quantity: quantity
    });
    if (error) throw error;
  },

  // ✅ Gợi ý sản phẩm  dựa trên nội dung (dùng biến môi trường cho IP)
  getProductRecommendations: async (productId: number) => {
    try {
      console.log('Gọi gợi ý với productId:', productId);
      if (!API_BASE) {
        console.error('❌ Biến môi trường NEXT_PUBLIC_RECOMMENDATION_API chưa được thiết lập!');
        return [];
      }
      const id = Number(productId);
      if (isNaN(id)) {
        console.error('❌ productId không phải là số:', productId);
        return [];
      }
      const url = `${API_BASE}/content-based?id=${id}`;
      console.log('🌐 Gọi API:', url);
      const response = await fetch(url);
      console.log('📡 Response status:', response.status);
      const data = await response.json();
      console.log('📦 Dữ liệu trả về:', data);
      if (data.error) {
        console.error('❌ Lỗi từ backend:', data.error);
        return [];
      }
      return data['goi_y_noi_dung'] || [];
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      return [];
    }
  },

  // Lấy tất cả sản phẩm
  getAllProducts: async () => {
    const { data, error } = await supabase.from('product').select('*');
    if (error) throw error;
    return data;
  },

  // Cập nhật tổng số lượng tồn kho maxQuantity
  updateProductMaxQuantity: async (productId: number) => {
    const { data: sizes, error } = await supabase
      .from('product_size')
      .select('quantity')
      .eq('product', productId);

    if (error) throw error;

    const total = (sizes || []).reduce((sum, s) => sum + (s.quantity || 0), 0);

    const { error: updateError } = await supabase
      .from('product')
      .update({ maxQuantity: total })
      .eq('id', productId);

    if (updateError) throw updateError;
  },
// Lấy gợi ý sản phẩm dựa trên sở thích người dùng (collaborative filtering)
  getCollaborativeRecommendations: async (userId: string) => {
    try {
      console.log('Gọi gợi ý collaborative với userId:', userId);
      if (!API_BASE) {
        console.error('❌ Biến môi trường NEXT_PUBLIC_RECOMMENDATION_API chưa được thiết lập!');
        return [];
      }
      const url = `${API_BASE}/collaborative?user=${userId}`;
      console.log('🌐 Gọi API:', url);
      const response = await fetch(url);
      console.log('📡 Response status:', response.status);
      const data = await response.json();
      console.log('📦 Dữ liệu trả về:', data);
      if (data.error) {
        console.error('❌ Lỗi từ backend:', data.error);
        return [];
      }
      return data['goi_y_cong_tac'] || [];
    } catch (error) {
      console.error('Error fetching collaborative recommendations:', error);
      return [];
    }
  }
};
