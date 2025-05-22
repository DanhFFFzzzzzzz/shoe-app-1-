import { supabase } from '../lib/supabase';
import { ProductWithSizes } from '../types/database.types';

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

    // Không lọc size nữa, để hiển thị tất cả size
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

  // Lấy số lượng tồn kho của sản phẩm
  getProductQuantity: async (productId: number) => {
    const { data, error } = await supabase
      .from('product_size')
      .select('size, quantity')
      .eq('product', productId);

    if (error) throw error;
    return data;
  },

  // Tăng lại số lượng sản phẩm khi xóa khỏi giỏ hàng
  incrementProductQuantity: async (productId: number, size: number, quantity: number) => {
    const { error } = await supabase.rpc('increment_product_quantity', {
      p_product_id: productId,
      p_size: size,
      p_quantity: quantity
    });
    if (error) throw error;
  },

  // Lấy sản phẩm đề xuất
  getProductRecommendations: async (productId: number) => {
    try {
      const response = await fetch(`http://192.168.1.4:5555/api?id=${productId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
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

  // Hàm cập nhật maxQuantity cho sản phẩm
  updateProductMaxQuantity: async (productId: number) => {
    // Lấy tổng số lượng còn lại của tất cả size
    const { data: sizes, error } = await supabase
      .from('product_size')
      .select('quantity')
      .eq('product', productId);

    if (error) throw error;

    const total = (sizes || []).reduce((sum, s) => sum + (s.quantity || 0), 0);

    // Cập nhật maxQuantity
    const { error: updateError } = await supabase
      .from('product')
      .update({ maxQuantity: total })
      .eq('id', productId);

    if (updateError) throw updateError;
  }
}; 