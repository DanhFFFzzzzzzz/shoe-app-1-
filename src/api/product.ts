import { supabase } from '../lib/supabase';
import { ProductWithSizes } from '../types/database.types';

const API_BASE = process.env.NEXT_PUBLIC_RECOMMENDATION_API;

// ✅ Log địa chỉ API để kiểm tra khi chạy
console.log('🌐 API Gợi ý sản phẩm:', API_BASE);

export const productApi = {
  // Lấy thông tin sản phẩm theo slug
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

  // Cập nhật số lượng sản phẩm
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

  // Tăng lại số lượng
  incrementProductQuantity: async (productId: number, size: number, quantity: number) => {
    const { error } = await supabase.rpc('increment_product_quantity', {
      p_product_id: productId,
      p_size: size,
      p_quantity: quantity
    });
    if (error) throw error;
  },

  // ✅ Gợi ý sản phẩm (dùng biến môi trường cho IP)
  getProductRecommendations: async (productId: number) => {
    try {
      if (!API_BASE) {
        console.error('❌ Biến môi trường NEXT_PUBLIC_RECOMMENDATION_API chưa được thiết lập!');
        return [];
      }

      const response = await fetch(`${API_BASE}?id=${productId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch recommendations: ${response.statusText}`);
      }

      const data = await response.json();
      return data['san pham goi y'];
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

  // Cập nhật maxQuantity
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
  }
};
