import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../providers/auth-provider';
import { generateOrderSlug } from '../utils/utils';
import { Tables } from '../types/database.types';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';

// Định nghĩa kiểu dữ liệu cho response của API lấy sản phẩm và danh mục
type ProductsAndCategories = {
  products: Tables<'product'>[];
  categories: Tables<'category'>[];
};

/**
 * Lấy danh sách sản phẩm và danh mục từ database
 * @returns Promise chứa danh sách sản phẩm và danh mục
 */
export const getProductsAndCategories = async (): Promise<ProductsAndCategories> => {
  // Gọi đồng thời 2 query để lấy sản phẩm và danh mục
  const [products, categories] = await Promise.all([
    supabase.from('product').select('*'),
    supabase.from('category').select('*'),
  ]);

  // Kiểm tra lỗi từ cả 2 query
  if (products.error || categories.error) {
    throw new Error(
      `An error occurred while fetching data: ${products.error?.message || ''} ${categories.error?.message || ''}`
    );
  }

  return { products: products.data, categories: categories.data };
};

/**
 * Hook để lấy thông tin chi tiết của một sản phẩm theo slug
 * @param slug - Slug của sản phẩm cần lấy
 * @returns Query hook chứa thông tin sản phẩm và các size có sẵn
 */
export const getProduct = (slug: string) => {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      // Lấy thông tin cơ bản của sản phẩm
      const { data: product, error } = await supabase
        .from('product')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error || !product) {
        throw new Error(
          'An error occurred while fetching data: ' + error?.message
        );
      }

      // Lấy thông tin về các size và số lượng tồn kho
      const { data: sizes, error: sizeError } = await supabase
        .from('product_size')
        .select('size, quantity')
        .eq('product', product.id);

      if (sizeError) {
        throw new Error('An error occurred while fetching sizes: ' + sizeError.message);
      }

      // Trả về thông tin sản phẩm kèm danh sách size
      return { ...product, sizes: sizes || [] };
    },
  });
};

/**
 * Hook để lấy thông tin danh mục và các sản phẩm thuộc danh mục đó
 * @param categorySlug - Slug của danh mục cần lấy
 * @returns Query hook chứa thông tin danh mục và danh sách sản phẩm
 */
export const getCategoryAndProducts = (categorySlug: string) => {
  return useQuery({
    queryKey: ['categoryAndProducts', categorySlug],
    queryFn: async () => {
      // Lấy thông tin danh mục
      const { data: category, error: categoryError } = await supabase
        .from('category')
        .select('*')
        .eq('slug', categorySlug)
        .single();

      if (categoryError || !category) {
        throw new Error('An error occurred while fetching category data');
      }

      // Lấy danh sách sản phẩm thuộc danh mục
      const { data: products, error: productsError } = await supabase
        .from('product')
        .select('*')
        .eq('category', category.id);

      if (productsError) {
        throw new Error('An error occurred while fetching products data');
      }

      return { category, products };
    },
  });
};

/**
 * Hook để lấy danh sách đơn hàng của người dùng hiện tại
 * @returns Query hook chứa danh sách đơn hàng
 */
export const getMyOrders = () => {
  const { user } = useAuth();
  const router = useRouter();
  if (!user || !user.id) {
    return { data: [], isLoading: false, error: null };
  }
  return useQuery({
    queryKey: ['orders', user.id],
    queryFn: async () => {
      // Kiểm tra phiên đăng nhập
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Không tìm thấy phiên đăng nhập');
      }
      // Lấy danh sách đơn hàng của user, sắp xếp theo thời gian tạo mới nhất
      const { data, error } = await supabase
        .from('order')
        .select('*')
        .order('created_at', { ascending: false })
        .eq('user', user.id);
      if (error) {
        if (error.message && error.message.toLowerCase().includes('jwt expired')) {
          Alert.alert('Phiên đăng nhập đã hết hạn', 'Vui lòng đăng nhập lại.');
          await supabase.auth.signOut();
          router.replace('/auth');
        }
        console.error('Lỗi lấy danh sách đơn hàng:', error);
        throw new Error('Không thể lấy danh sách đơn hàng: ' + error.message);
      }
      return data;
    },
    refetchInterval: 5000,
  });
};

/**
 * Hook để tạo đơn hàng mới
 * @returns Mutation hook để tạo đơn hàng
 */
export const createOrder = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    async mutationFn({
      totalPrice,
      customer_name,
      customer_phone,
      customer_address,
    }: {
      totalPrice: number;
      customer_name: string;
      customer_phone: string;
      customer_address: string;
    }) {
      // Kiểm tra đăng nhập
      if (!user?.id) {
        throw new Error('Bạn cần đăng nhập để đặt hàng.');
      }

      // Kiểm tra phiên đăng nhập
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Không tìm thấy phiên đăng nhập');
      }

      // Không generateOrderSlug ở client, không truyền slug
      const { data, error } = await supabase
        .from('order')
        .insert({
          totalPrice,
          user: user.id,
          status: 'Pending',
          customer_name,
          customer_phone,
          customer_address,
        })
        .select('*')
        .single();

      if (error) {
        console.error('Lỗi tạo đơn hàng:', error);
        throw new Error('Không thể tạo đơn hàng: ' + error.message);
      }

      // Nếu cần dùng slug, lấy từ data.slug
      return data;
    },

    // Sau khi tạo đơn hàng thành công, cập nhật lại danh sách đơn hàng
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};

/**
 * Hook để tạo các mục trong đơn hàng và cập nhật số lượng tồn kho
 * @returns Mutation hook để tạo chi tiết đơn hàng
 */
export const createOrderItem = () => {
  return useMutation({
    async mutationFn(
      insertData: {
        orderId: number;
        productId: number;
        quantity: number;
        size: number;
      }[]
    ) {
      // Thêm các mục vào bảng order_item
      const { data, error } = await supabase
        .from('order_item')
        .insert(
          insertData.map(({ orderId, quantity, productId, size }) => ({
            order: orderId,
            product: productId,
            quantity,
            size,
          }))
        )
        .select('*');

      if (error)
        throw new Error(
          'An error occurred while creating order item: ' + error.message
        );

      return data;
    },
  });
};

/**
 * Hook để lấy thông tin chi tiết của một đơn hàng
 * @param slug - Slug của đơn hàng cần lấy
 * @returns Query hook chứa thông tin chi tiết đơn hàng
 */
export const getMyOrder = (slug: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['orders', slug],
    queryFn: async () => {
      // Kiểm tra đăng nhập
      if (!user?.id) {
        throw new Error('Bạn cần đăng nhập để xem đơn hàng.');
      }

      // Kiểm tra phiên đăng nhập
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Không tìm thấy phiên đăng nhập');
      }

      // Lấy thông tin đơn hàng kèm chi tiết sản phẩm
      const { data, error } = await supabase
        .from('order')
        .select('*, order_items:order_item(*, products:product(*))')
        .eq('slug', slug)
        .eq('user', user.id)
        .single();

      if (error) {
        console.error('Lỗi lấy thông tin đơn hàng:', error);
        throw new Error('Không thể lấy thông tin đơn hàng: ' + error.message);
      }

      if (!data) {
        throw new Error('Không tìm thấy đơn hàng');
      }

      return data;
    },
  });
};

/**
 * Hàm cập nhật số lượng tồn kho của sản phẩm
 * @param productId - ID của sản phẩm
 * @param size - Size cần cập nhật
 * @param quantity - Số lượng cần cập nhật
 * @returns Promise chứa kết quả cập nhật
 */
export const updateProductQuantity = async (productId: number, size: number, quantity: number) => {
  // Kiểm tra phiên đăng nhập
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  
  if (!token) {
    throw new Error('Không tìm thấy phiên đăng nhập');
  }

  // Gọi API cập nhật số lượng
  const response = await fetch(`http://192.168.1.4:3000/api/products/${productId}/update-quantity`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      size,
      quantity
    })
  });

  if (!response.ok) {
    throw new Error('Không thể cập nhật số lượng sản phẩm');
  }

  return response.json();
};

/**
 * Hook để hủy đơn hàng (cập nhật trạng thái thành 'CancelRequested')
 * @param slug - Slug của đơn hàng cần hủy
 * @returns Mutation hook để hủy đơn hàng
 */
export const useCancelOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    async mutationFn(slug: string) {
      const { data, error } = await supabase
        .from('order')
        .update({ status: 'CancelRequested' })
        .eq('slug', slug);
      if (error) {
        throw new Error('Không thể gửi yêu cầu hủy đơn hàng: ' + error.message);
      }
      return data;
    },
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};