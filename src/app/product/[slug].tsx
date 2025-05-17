import { Redirect, Stack, useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  View,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useToast } from 'react-native-toast-notifications';
import { useCartStore } from '../../store/cart-store';
import { useState, useEffect } from 'react';
import { ProductWithSizes } from '../../types/database.types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { productApi } from '../../api/product';
import { SizeSelector } from '../../components/product/SizeSelector';
import { QuantitySelector } from '../../components/product/QuantitySelector';
import { AddToCartButton } from '../../components/product/AddToCartButton';
import { supabase } from '../../lib/supabase';
import { ProductRecommendations } from '../../components/product/ProductRecommendations';

const { width } = Dimensions.get('window');
const IMAGE_SIZE = 90;

const ProductDetails = () => {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const toast = useToast();
  const [product, setProduct] = useState<ProductWithSizes | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { items, addItem } = useCartStore();

  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<number | null>(null);

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await productApi.getProductBySlug(slug);
        setProduct(data);
      } catch (err: any) {
        setError(err.message || 'Có lỗi xảy ra khi tải dữ liệu sản phẩm');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [slug]);

  // Lưu sản phẩm đã xem gần đây
  useEffect(() => {
    if (!product) return;
    const saveRecent = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !user.id) return;

        const key = `recently_viewed_${user.id}`;
        const json = await AsyncStorage.getItem(key);
        let arr = json ? JSON.parse(json) : [];
        
        arr = arr.filter((p: any) => p.id !== product.id);
        arr.unshift({
          id: product.id,
          slug: product.slug,
          title: product.title,
          heroImage: product.heroImage,
          price: product.price
        });
        
        if (arr.length > 10) arr = arr.slice(0, 10);
        
        await AsyncStorage.setItem(key, JSON.stringify(arr));
      } catch (error) {
        console.error('Lỗi lưu sản phẩm đã xem:', error);
      }
    };
    saveRecent();
  }, [product?.id]);

  if (isLoading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#007bff" />;
  if (error) return <Text style={{ color: 'red', textAlign: 'center', marginTop: 40 }}>Error: {error}</Text>;
  if (!product) return <Redirect href='/404' />;

  // Lấy size từ product.sizes
  const availableSizesData = Array.isArray(product.sizes) ? product.sizes : [];

  // Kiểm tra xem size đã chọn có còn hàng không
  const isSizeOutOfStock = (size: number) => {
    const sizeObj = availableSizesData.find((s: any) => s.size === size);
    if (!sizeObj) return true;
    
    const cartItem = items.find(item => item.id === product.id && item.size === size);
    const cartQuantity = cartItem ? cartItem.quantity : 0;
    
    return cartQuantity >= sizeObj.quantity;
  };

  // Lấy số lượng tồn kho của size đã chọn
  const getAvailableQuantity = (size: number) => {
    const sizeObj = availableSizesData.find((s: any) => s.size === size);
    if (!sizeObj) return 0;
    
    const cartItem = items.find(item => item.id === product.id && item.size === size);
    const cartQuantity = cartItem ? cartItem.quantity : 0;
    
    return sizeObj.quantity - cartQuantity;
  };

  const handleIncreaseQuantity = () => {
    if (!selectedSize) return;
    
    const availableQuantity = getAvailableQuantity(selectedSize);
    if (quantity < availableQuantity) {
      setQuantity((prev) => prev + 1);
    } else {
      toast.show(`Chỉ còn ${availableQuantity} sản phẩm trong kho`, {
        type: 'warning',
        placement: 'top',
        duration: 1500,
      });
    }
  };

  const handleDecreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  const handleAddToCart = async () => {
    if (!selectedSize) {
      toast.show('Vui lòng chọn size', {
        type: 'warning',
        placement: 'top',
        duration: 1500,
      });
      return;
    }

    const availableQuantity = getAvailableQuantity(selectedSize);
    if (availableQuantity <= 0) {
      toast.show('Size này đã hết hàng', {
        type: 'warning',
        placement: 'top',
        duration: 1500,
      });
      return;
    }

    if (quantity > availableQuantity) {
      toast.show(`Chỉ còn ${availableQuantity} sản phẩm trong kho`, {
        type: 'warning',
        placement: 'top',
        duration: 1500,
      });
      return;
    }

    try {
      // Cập nhật số lượng trong database
      await productApi.updateProductQuantity(product.id, selectedSize, quantity);

      // Thêm vào giỏ hàng
      addItem({
        id: product.id,
        title: product.title,
        heroImage: product.heroImage, 
        price: product.price,
        quantity,
        maxQuantity: product.maxQuantity,
        size: selectedSize,
      });

      // Refresh lại dữ liệu sản phẩm
      const updatedSizes = await productApi.getProductQuantity(product.id);
      const availableSizes = (updatedSizes || []).filter((s: any) => s.quantity > 0);
      setProduct(prev => prev ? { ...prev, sizes: availableSizes } : null);

      // Reset quantity và selectedSize
      setQuantity(1);
      setSelectedSize(null);

      toast.show('Đã thêm vào giỏ hàng', {
        type: 'success',
        placement: 'top',
        duration: 1500,
      });
    } catch (error: any) {
      console.error('Lỗi khi cập nhật số lượng:', error);
      toast.show(error.message || 'Có lỗi xảy ra khi thêm vào giỏ hàng', {
        type: 'error',
        placement: 'top',
        duration: 1500,
      });
    }
  };

  const totalPrice = product.price * quantity;

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: product.title }} />

      <Image source={{uri: product.heroImage}} style={styles.heroImage} />

      <View style={styles.contentBox}>
        <Text style={styles.title}>{product.title}</Text>
        <Text style={styles.description}>{product.description}</Text>

        {/* Hình ảnh nhỏ */}
        {Array.isArray(product.imagesUrl) && product.imagesUrl.length > 0 && (
          <FlatList
            data={product.imagesUrl}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <Image source={{uri: item}} style={styles.imageThumb} />
            )}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.imagesContainer}
          />
        )}

        {/* Bảng chọn size */}
        <SizeSelector
          sizes={availableSizesData}
          selectedSize={selectedSize}
          onSelectSize={setSelectedSize}
          getAvailableQuantity={getAvailableQuantity}
          isSizeOutOfStock={isSizeOutOfStock}
        />

        {/* Giá và tổng tiền */}
        <View style={styles.priceRow}>
          <View style={styles.priceBox}>
            <Text style={styles.priceLabel}>Giá</Text>
            <Text style={styles.priceValue}>
              {product.price.toLocaleString('vi-VN', { 
                style: 'currency', 
                currency: 'VND', 
                maximumFractionDigits: 0 
              })}
            </Text>
          </View>
          <View style={styles.priceBox}>
            <Text style={styles.priceLabel}>Tổng</Text>
            <Text style={styles.priceValue}>
              {totalPrice.toLocaleString('vi-VN', { 
                style: 'currency', 
                currency: 'VND', 
                maximumFractionDigits: 0 
              })}
            </Text>
          </View>
        </View>

        {/* Nút thêm vào giỏ hàng */}
        <View style={styles.cartRow}>
          <QuantitySelector
            quantity={quantity}
            maxQuantity={selectedSize ? getAvailableQuantity(selectedSize) : 0}
            onIncrease={handleIncreaseQuantity}
            onDecrease={handleDecreaseQuantity}
          />
          <AddToCartButton
            onPress={handleAddToCart}
            disabled={!selectedSize || getAvailableQuantity(selectedSize) <= 0}
          />
        </View>

        {/* Sản phẩm gợi ý */}
        <ProductRecommendations currentProductId={product.id} />
      </View>
    </ScrollView>
  );
};

export default ProductDetails;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  heroImage: {
    width: '100%',
    height: 270,
    resizeMode: 'cover',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  contentBox: {
    backgroundColor: '#fff',
    borderRadius: 18,
    margin: 12,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 8,
    textAlign: 'left',
  },
  description: {
    fontSize: 15,
    color: '#555',
    marginBottom: 16,
    lineHeight: 22,
    textAlign: 'left',
  },
  imagesContainer: {
    flexDirection: 'row',
    marginBottom: 18,
    gap: 10,
  },
  imageThumb: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: 14,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fafbfc',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
    marginTop: 6,
  },
  priceBox: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f6f8fa',
    borderRadius: 12,
    marginHorizontal: 4,
  },
  priceLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 2,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007bff',
  },
  cartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
});