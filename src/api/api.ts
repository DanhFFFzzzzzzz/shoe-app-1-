import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../providers/auth-provider';
import { generateOrderSlug } from '../utils/utils';
import { Tables } from '../types/database.types';

type ProductsAndCategories = {
  products: Tables<'product'>[];
  categories: Tables<'category'>[];
};

export const getProductsAndCategories = async (): Promise<ProductsAndCategories> => {
  const [products, categories] = await Promise.all([
    supabase.from('product').select('*'),
    supabase.from('category').select('*'),
  ]);

  if (products.error || categories.error) {
    throw new Error(
      `An error occurred while fetching data: ${products.error?.message || ''} ${categories.error?.message || ''}`
    );
  }

  return { products: products.data, categories: categories.data };
};

export const getProduct = (slug: string) => {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
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

      const { data: sizes, error: sizeError } = await supabase
        .from('product_size')
        .select('size, quantity')
        .eq('product', product.id);

      if (sizeError) {
        throw new Error('An error occurred while fetching sizes: ' + sizeError.message);
      }

      return { ...product, sizes: sizes || [] };
    },
  });
};

export const getCategoryAndProducts = (categorySlug: string) => {
  return useQuery({
    queryKey: ['categoryAndProducts', categorySlug],
    queryFn: async () => {
      const { data: category, error: categoryError } = await supabase
        .from('category')
        .select('*')
        .eq('slug', categorySlug)
        .single();

      if (categoryError || !category) {
        throw new Error('An error occurred while fetching category data');
      }

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

export const getMyOrders = () => {
  const { user } = useAuth();
  if (!user || !user.id) {
    return { data: [], isLoading: false, error: null };
  }
  return useQuery({
    queryKey: ['orders', user.id],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Không tìm thấy phiên đăng nhập');
      }

      const { data, error } = await supabase
        .from('order')
        .select('*')
        .order('created_at', { ascending: false })
        .eq('user', user.id);

      if (error) {
        console.error('Lỗi lấy danh sách đơn hàng:', error);
        throw new Error('Không thể lấy danh sách đơn hàng: ' + error.message);
      }

      return data;
    },
  });
};

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
      if (!user?.id) {
        throw new Error('Bạn cần đăng nhập để đặt hàng.');
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Không tìm thấy phiên đăng nhập');
      }

      const slug = generateOrderSlug();

      const { data, error } = await supabase
        .from('order')
        .insert({
          totalPrice,
          slug,
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

      return data;
    },

    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};

export const createOrderItem = () => {
  return useMutation({
    async mutationFn(
      insertData: {
        orderId: number;
        productId: number;
        quantity: number;
      }[]
    ) {
      const { data, error } = await supabase
        .from('order_item')
        .insert(
          insertData.map(({ orderId, quantity, productId }) => ({
            order: orderId,
            product: productId,
            quantity,
          }))
        )
        .select('*');

      await Promise.all(
        insertData.map(item =>
          supabase.rpc('decrement_product_quantity', {
            product_id: item.productId,
            quantity: item.quantity,
          })
        )
      );

      if (error)
        throw new Error(
          'An error occurred while creating order item: ' + error.message
        );

      return data;
    },
  });
};

export const getMyOrder = (slug: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['orders', slug],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('Bạn cần đăng nhập để xem đơn hàng.');
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Không tìm thấy phiên đăng nhập');
      }

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

export const updateProductQuantity = async (productId: number, size: number, quantity: number) => {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  
  if (!token) {
    throw new Error('Không tìm thấy phiên đăng nhập');
  }

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