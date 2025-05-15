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
  }
}; 