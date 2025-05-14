import { Redirect, Stack, useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useToast } from 'react-native-toast-notifications';
import { useCartStore } from '../../store/cart-store';
import { useState, useEffect } from 'react';
import { PRODUCTS } from '../../../assets/products';
import { getProduct } from '../../api/api';
import { ProductWithSizes } from '../../types/database.types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const IMAGE_SIZE = 90;
const SIZE_BUTTON = 48;

const ProductDetails = () => {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const toast = useToast();

  const { data: product, error, isLoading } = getProduct(slug) as { data: ProductWithSizes, error: any, isLoading: boolean };

  const { items, addItem, incrementItem, decrementItem } = useCartStore();

  const cartItem = items.find(item => item.id === product?.id);

  const initialQuantity = cartItem ? cartItem.quantity : 0;

  const [quantity, setQuantity] = useState(initialQuantity);
  const [selectedSize, setSelectedSize] = useState<number | null>(null);

  // Lưu sản phẩm đã xem gần đây
  useEffect(() => {
    if (!product) return;
    const saveRecent = async () => {
      try {
        const json = await AsyncStorage.getItem('recently_viewed');
        let arr = json ? JSON.parse(json) : [];
        arr = arr.filter((p: any) => p.id !== product.id); // remove if exists
        arr.unshift({ id: product.id, slug: product.slug, title: product.title, heroImage: product.heroImage });
        if (arr.length > 10) arr = arr.slice(0, 10);
        await AsyncStorage.setItem('recently_viewed', JSON.stringify(arr));
      } catch {}
    };
    saveRecent();
  }, [product?.id]);

  if (isLoading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#007bff" />;
  if (error) return <Text style={{ color: 'red', textAlign: 'center', marginTop: 40 }}>Error: {error.message}</Text>;
  if (!product) return <Redirect href='/404' />;

  // Lấy size từ product.sizes
  const availableSizesData = Array.isArray(product.sizes) ? product.sizes : [];
  const selectedSizeObj = availableSizesData.find((s: any) => s.size === selectedSize);
  const maxQuantity = selectedSizeObj ? selectedSizeObj.quantity : 0;

  const increseQuantity = () => {
    if (quantity < maxQuantity) {
      setQuantity((prev) => prev + 1);
    } else {
      toast.show('Không thể vượt quá số lượng tối đa cho size này', {
        type: 'warning',
        placement: 'top',
        duration: 1500,
      });
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  const addToCart = () => {
    if (!selectedSize) {
      toast.show('Vui lòng chọn size', {
        type: 'warning',
        placement: 'top',
        duration: 1500,
      });
      return;
    }

    addItem({
      id: product.id,
      title: product.title,
      heroImage: product.heroImage, 
      price: product.price,
      quantity,
      maxQuantity: product.maxQuantity,
      size: selectedSize,
    });
    toast.show('Đã thêm vào giỏ hàng', {
      type: 'success',
      placement: 'top',
      duration: 1500,
    });
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
        <View style={styles.sizeContainer}>
          <Text style={styles.sizeTitle}>Chọn size:</Text>
          <View style={styles.sizeList}>
            {availableSizesData.length > 0 ? (
              availableSizesData.map((s) => (
                <TouchableOpacity
                  key={s.size}
                  style={[
                    styles.sizeButton,
                    selectedSize === s.size && styles.selectedSizeButton,
                    s.quantity === 0 && styles.disabledSizeButton,
                  ]}
                  onPress={() => {
                    if (s.quantity > 0) {
                      setSelectedSize(s.size);
                      setQuantity(1);
                    }
                  }}
                  disabled={s.quantity === 0}
                >
                  <Text
                    style={[
                      styles.sizeText,
                      selectedSize === s.size && styles.selectedSizeText,
                      s.quantity === 0 && styles.disabledSizeText,
                    ]}
                  >
                    {s.size}
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={{ color: 'red' }}>Không có size nào khả dụng</Text>
            )}
          </View>
        </View>

        {/* Giá và tổng tiền */}
        <View style={styles.priceRow}>
          <View style={styles.priceBox}>
            <Text style={styles.priceLabel}>Giá</Text>
            <Text style={styles.priceValue}>{product.price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 })}</Text>
          </View>
          <View style={styles.priceBox}>
            <Text style={styles.priceLabel}>Tổng</Text>
            <Text style={styles.priceValue}>{totalPrice.toLocaleString('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 })}</Text>
          </View>
        </View>

        {/* Nút thêm vào giỏ hàng */}
        <View style={styles.cartRow}>
          <TouchableOpacity
            style={[styles.quantityButton, quantity <= 1 && styles.disabledBtn]}
            onPress={decreaseQuantity}
            disabled={quantity <= 1}
          >
            <Text style={styles.quantityButtonText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.quantity}>{quantity}</Text>
          <TouchableOpacity
            style={[styles.quantityButton, quantity >= maxQuantity && styles.disabledBtn]}
            onPress={increseQuantity}
            disabled={quantity >= maxQuantity}
          >
            <Text style={styles.quantityButtonText}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.addToCartButton, (quantity === 0 || !selectedSize) && styles.disabledAddBtn]}
            onPress={addToCart}
            disabled={quantity === 0 || !selectedSize}
          >
            <Text style={styles.addToCartText}>Thêm vào giỏ hàng</Text>
          </TouchableOpacity>
        </View>
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
  sizeContainer: {
    marginBottom: 18,
  },
  sizeTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#222',
  },
  sizeList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  sizeButton: {
    width: SIZE_BUTTON,
    height: SIZE_BUTTON,
    borderRadius: SIZE_BUTTON / 2,
    backgroundColor: '#f0f4fa',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    marginBottom: 8,
  },
  selectedSizeButton: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
    shadowColor: '#007bff',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  disabledSizeButton: {
    backgroundColor: '#eee',
    borderColor: '#ddd',
    opacity: 0.5,
  },
  sizeText: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },
  selectedSizeText: {
    color: '#fff',
  },
  disabledSizeText: {
    color: '#aaa',
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
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007bff',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
    shadowColor: '#007bff',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  quantityButtonText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  quantity: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 8,
    minWidth: 24,
    textAlign: 'center',
    color: '#222',
  },
  addToCartButton: {
    flex: 1,
    backgroundColor: '#28a745',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    shadowColor: '#28a745',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  addToCartText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  disabledBtn: {
    opacity: 0.5,
  },
  disabledAddBtn: {
    backgroundColor: '#b7e1c6',
    opacity: 0.7,
  },
});