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
} from 'react-native';
import { useToast } from 'react-native-toast-notifications';
import { useCartStore } from '../../store/cart-store';
import { useState } from 'react';
import { PRODUCTS } from '../../../assets/products';
import { getProduct } from '../../api/api';
import { Tables } from '../../types/database.types';

// Hàm chuyển text hoặc array thành mảng số (hỗ trợ cả JSON dạng '[{"size":34,"quantity":10},...]')
function parseAvailableSizesData(sizes: any): {size: number, quantity: number}[] {
  if (!sizes) return [];
  if (Array.isArray(sizes)) {
    if (sizes.length > 0 && typeof sizes[0] === 'object' && sizes[0] !== null && 'size' in sizes[0]) {
      return sizes;
    }
    // Nếu là mảng số, chuyển thành object với quantity mặc định 99
    return sizes.map((s: any) => ({ size: Number(s), quantity: 99 }));
  }
  try {
    const arr = JSON.parse(sizes);
    if (Array.isArray(arr) && arr.length > 0 && typeof arr[0] === 'object' && arr[0] !== null && 'size' in arr[0]) {
      return arr;
    }
  } catch {}
  // Nếu là chuỗi dạng {34,35,36}
  let cleaned = String(sizes).replace(/[\{\}\[\]"]/g, '');
  return cleaned
    .split(',')
    .map(s => ({ size: parseInt(s.trim(), 10), quantity: 99 }))
    .filter(obj => !isNaN(obj.size));
}

const ProductDetails = () => {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const toast = useToast();

  const { data: product, error, isLoading } = getProduct(slug);

  const { items, addItem, incrementItem, decrementItem } = useCartStore();

  const cartItem = items.find(item => item.id === product?.id);

  const initialQuantity = cartItem ? cartItem.quantity : 0;

  const [quantity, setQuantity] = useState(initialQuantity);
  const [selectedSize, setSelectedSize] = useState<number | null>(null);

  if (isLoading) return <ActivityIndicator />;
  if (error) return <Text>Error: {error.message}</Text>;
  if (!product) return <Redirect href='/404' />;

  // Parse mảng object size-quantity
  const availableSizesData = parseAvailableSizesData(product.availableSizes);
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

  const totalPrice = (product.price * quantity).toFixed(2);

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: product.title }} />

      <Image source={{uri: product.heroImage}} style={styles.heroImage} />

      <View style={{ padding: 16, flex: 1 }}>
        <Text style={styles.title}>{product.title}</Text>
        <Text style={styles.description}>{product.description}</Text>

        <View style={styles.priceContainer}>
          <Text style={styles.price}>Giá: ${product.price.toFixed(2)}</Text>
          <Text style={styles.price}>Tổng: ${totalPrice}</Text>
        </View>

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
                  ]}
                  onPress={() => {
                    setSelectedSize(s.size);
                    setQuantity(1); // Reset về 1 khi đổi size
                  }}
                >
                  <Text
                    style={[
                      styles.sizeText,
                      selectedSize === s.size && styles.selectedSizeText,
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

        {Array.isArray(product.imagesUrl) && product.imagesUrl.length > 0 && (
          <FlatList
            data={product.imagesUrl}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <Image source={{uri: item}} style={styles.image} />
            )}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.imagesContainer}
          />
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={decreaseQuantity}
            disabled={quantity <= 1}
          >
            <Text style={styles.quantityButtonText}>-</Text>
          </TouchableOpacity>

          <Text style={styles.quantity}>{quantity}</Text>

          <TouchableOpacity
            style={styles.quantityButton}
            onPress={increseQuantity}
            disabled={quantity >= maxQuantity}
          >
            <Text style={styles.quantityButtonText}>+</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.addToCartButton,
              { opacity: quantity === 0 ? 0.5 : 1 },
            ]}
            onPress={addToCart}
            disabled={quantity === 0}
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
    backgroundColor: '#fff',
  },
  heroImage: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    lineHeight: 24,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  price: {
    fontWeight: 'bold',
    color: '#000',
    fontSize: 18,
  },
  sizeContainer: {
    marginBottom: 16,
  },
  sizeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sizeList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sizeButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedSizeButton: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  sizeText: {
    fontSize: 16,
    color: '#333',
  },
  selectedSizeText: {
    color: '#fff',
  },
  imagesContainer: {
    marginBottom: 16,
  },
  image: {
    width: 100,
    height: 100,
    marginRight: 8,
    borderRadius: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007bff',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  quantityButtonText: {
    fontSize: 24,
    color: '#fff',
  },
  quantity: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 16,
  },
  addToCartButton: {
    flex: 1,
    backgroundColor: '#28a745',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  addToCartText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});