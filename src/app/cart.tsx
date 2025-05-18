import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Platform,
  TouchableOpacity,
  FlatList,
  Image,
  TextInput,
  ScrollView,
} from 'react-native';
import { useCartStore } from '../store/cart-store';
import { StatusBar } from 'expo-status-bar';
import { createOrder, createOrderItem } from '../api/api';
import * as Linking from 'expo-linking';
import * as Location from 'expo-location';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { productApi } from '../api/product';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

type CartItemType = {
  id: number;
  title: string;
  heroImage: string;
  price: number;
  quantity: number;
  maxQuantity: number;
  size: number;
};

type CartItemProps = {
  item: CartItemType;
  onRemove: (item: CartItemType) => void;
  onIncrement: (id: number) => void;
  onDecrement: (id: number) => void;
};

const CartItem = ({
  item,
  onDecrement,
  onIncrement,
  onRemove,
}: CartItemProps) => {
  return (
    <View style={styles.cartItem}>
      <Image source={{ uri: item.heroImage }} style={styles.itemImage} />
      <View style={styles.itemDetails}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.itemPrice}>{item.price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 })}</Text>
        <Text style={styles.itemSize}>Size: {item.size}</Text>
        <View style={styles.quantityContainer}>
          <TouchableOpacity
            onPress={() => onDecrement(item.id)}
            style={styles.quantityButton}
          >
            <Text style={styles.quantityButtonText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.itemQuantity}>{item.quantity}</Text>
          <TouchableOpacity
            onPress={() => onIncrement(item.id)}
            style={styles.quantityButton}
          >
            <Text style={styles.quantityButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
      <TouchableOpacity
        onPress={() => onRemove(item)}
        style={styles.removeButton}
      >
        <Text style={styles.removeButtonText}>Xóa</Text>
      </TouchableOpacity>
    </View>
  );
};

export default function Cart() {
  const {
    items,
    removeItem,
    incrementItem,
    decrementItem,
    getTotalPrice,
    resetCart,
  } = useCartStore();

  const { mutateAsync: createSupabaseOrder } = createOrder();
  const { mutateAsync: createSupabaseOrderItem } = createOrderItem();

  // Thông tin khách hàng
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();

  // Hàm lấy vị trí hiện tại và reverse geocode
  const handlePickLocation = async () => {
    setLoadingLocation(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Lỗi', 'Bạn cần cấp quyền truy cập vị trí!');
        setLoadingLocation(false);
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      let geocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      if (geocode && geocode.length > 0) {
        const addr = `${geocode[0].street || ''}, ${geocode[0].district || ''}, ${geocode[0].city || geocode[0].region || ''}`;
        setCustomerAddress(addr);
      }
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể lấy vị trí!');
    }
    setLoadingLocation(false);
  };

  const handleCheckout = async () => {
    if (isSubmitting) return; // Chặn double submit
    setIsSubmitting(true);
    if (!items || items.length === 0) {
      Alert.alert('Thông báo', 'Giỏ hàng của bạn đang trống!');
      setIsSubmitting(false);
      return;
    }
    if (!customerName || !customerPhone || !customerAddress) {
      Alert.alert('Yêu cầu thông tin', 'Vui lòng nhập đầy đủ thông tin nhận hàng.');
      setIsSubmitting(false);
      return;
    }
    const totalPrice = parseFloat(getTotalPrice().toFixed(2));
    try {
      const order = await createSupabaseOrder({
        totalPrice,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_address: customerAddress,
      });
      if (!order || !order.id) {
        throw new Error('Không thể tạo đơn hàng. Vui lòng thử lại!');
      }
      await createSupabaseOrderItem(
        items.map(item => ({
          orderId: order.id,
          productId: item.id,
          quantity: item.quantity,
          size: item.size,
        }))
      );
      // Trừ tồn kho thực tế sau khi tạo order item thành công
      for (const item of items) {
        await productApi.updateProductQuantity(item.id, item.size, item.quantity);
      }
      router.replace({
        pathname: '/orders/success',
        params: {
          slug: order.slug,
          status: order.status,
          created_at: order.created_at,
          totalPrice: order.totalPrice,
          customer_name: order.customer_name,
          customer_phone: order.customer_phone,
          customer_address: order.customer_address,
        }
      });
      resetCart();
      setIsSubmitting(false);
      return order.id;
    } catch (error) {
      let message = (error instanceof Error ? error.message : String(error)) || 'Lỗi xử lý đơn hàng. Vui lòng thử lại.';
      if (message.includes('Function not implemented')) {
        message = 'Lỗi hệ thống: Chức năng trừ số lượng sản phẩm chưa được cấu hình trên máy chủ. Vui lòng liên hệ quản trị viên hoặc thử lại sau!';
      }
      Alert.alert('Lỗi', message);
      setIsSubmitting(false);
      return null;
    }
  };

  // Thêm hàm kiểm tra và lấy token
  const getValidToken = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token || '';
    } catch (error) {
      console.error('Lỗi lấy token:', error);
      return '';
    }
  };

  // Thêm lại useEffect lắng nghe callback từ VNPay
  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      const url = event.url;
      if (url.includes('vnpay-return')) { 
        try {
          const params = new URLSearchParams(url.split('?')[1] || '');
          const responseCode = params.get('vnp_ResponseCode');
          const txnRef = params.get('vnp_TxnRef');
          const pendingOrderId = await AsyncStorage.getItem('pendingOrderId');

          if (!pendingOrderId) {
            throw new Error('Không tìm thấy thông tin đơn hàng');
          }

          const { data: { session } } = await supabase.auth.getSession();
          const token = session?.access_token || '';
          if (!token) {
            throw new Error('Không tìm thấy phiên đăng nhập');
          }

          if (responseCode === '00') {
            // Cập nhật trạng thái đơn hàng thành công
            const response = await fetch(`http://192.168.1.4:3000/api/orders/${pendingOrderId}/confirm`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });

            if (!response.ok) {
              throw new Error('Không thể cập nhật trạng thái đơn hàng');
            }

            Alert.alert('Thanh toán VNPay thành công!', `Mã giao dịch: ${txnRef}`);
            resetCart();
          } else {
            // Xóa đơn hàng tạm nếu thanh toán thất bại
            await fetch(`http://192.168.1.4:3000/api/orders/${pendingOrderId}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            Alert.alert('Thanh toán VNPay thất bại', `Mã lỗi: ${responseCode}. Vui lòng thử lại.`);
          }
        } catch (error) {
          console.error('Lỗi xử lý callback VNPay:', error);
          Alert.alert('Lỗi', 'Không thể xử lý kết quả thanh toán. Vui lòng liên hệ hỗ trợ.');
        } finally {
          // Xóa pendingOrderId trong mọi trường hợp
          await AsyncStorage.removeItem('pendingOrderId');
        }
      }
    };
    const subscription = Linking.addEventListener('url', handleDeepLink);
    return () => {
      subscription.remove();
    };
  }, [resetCart]);

  // Hàm xóa sản phẩm khỏi giỏ hàng và trả lại số lượng tồn kho
  const handleRemoveFromCart = (item: CartItemType) => {
    removeItem(item.id, item.size);
  };

  // Lọc sản phẩm hợp lệ (không chứa ảnh bản đồ)
  const validItems = items.filter(item => {
    if (!item.heroImage) return false;
    const lower = item.heroImage.toLowerCase();
    // Loại bỏ các ảnh bản đồ hoặc chứa từ khóa không hợp lệ
    return !lower.includes('austria map') && !lower.includes('map') && !lower.includes('flag') && !lower.includes('country') && !lower.includes('vienna');
  });

  useEffect(() => {
    // Xóa triệt để các sản phẩm có ảnh bản đồ khỏi giỏ hàng khi vào trang cart
    items.forEach(item => {
      if (item.heroImage) {
        const lower = item.heroImage.toLowerCase();
        if (
          lower.includes('austria map') ||
          lower.includes('map') ||
          lower.includes('flag') ||
          lower.includes('country') ||
          lower.includes('vienna')
        ) {
          removeItem(item.id, item.size);
        }
      }
    });
  }, [items, removeItem]);

  if (!validItems || validItems.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.headerBox}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerIconBtn}>
            <Ionicons name="arrow-back" size={26} color="#222" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Giỏ hàng</Text>
          <MaterialIcons name="shopping-cart" size={26} color="#1976d2" style={styles.headerCartIcon} />
        </View>
        <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <Text style={{ textAlign: 'center', marginTop: 40, fontSize: 18 }}>
            Giỏ hàng của bạn đang trống!
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* <View style={styles.headerBox}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerIconBtn}>
          <Ionicons name="arrow-back" size={26} color="#222" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Giỏ hàng</Text>
        <MaterialIcons name="shopping-cart" size={26} color="#1976d2" style={styles.headerCartIcon} />
      </View> */}
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <View style={styles.customerForm}>
          <Text style={styles.formTitle}>Thông tin nhận hàng</Text>
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Họ tên</Text>
            <TextInput
              style={styles.formInput}
              value={customerName}
              onChangeText={setCustomerName}
              placeholder="Nhập họ tên"
            />
          </View>
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Số điện thoại</Text>
            <TextInput
              style={styles.formInput}
              value={customerPhone}
              onChangeText={setCustomerPhone}
              placeholder="Nhập số điện thoại"
              keyboardType="phone-pad"
            />
          </View>
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Địa chỉ</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TextInput
                style={[styles.formInput, { flex: 1 }]}
                value={customerAddress}
                onChangeText={setCustomerAddress}
                placeholder="Nhập địa chỉ hoặc chọn trên bản đồ"
              />
              <TouchableOpacity
                style={styles.mapButton}
                onPress={handlePickLocation}
                disabled={loadingLocation}
              >
                <Text style={styles.mapButtonText}>{loadingLocation ? '...' : '📍'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        {/* Danh sách sản phẩm hợp lệ trong giỏ */}
        <FlatList
          data={validItems}
          keyExtractor={item => item.id.toString() + '-' + item.size}
          renderItem={({ item }) => (
            <CartItem
              item={item}
              onRemove={handleRemoveFromCart}
              onIncrement={incrementItem}
              onDecrement={decrementItem}
            />
          )}
          contentContainerStyle={styles.cartList}
          scrollEnabled={false}
        />
        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.totalText}>Tổng tiền: {getTotalPrice().toLocaleString('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 })}</Text>
          <TouchableOpacity
            onPress={handleCheckout}
            style={[styles.checkoutButton, styles.normalButton, isSubmitting && { opacity: 0.5 }]}
            disabled={isSubmitting}
          >
            <Text style={styles.checkoutButtonText}>{isSubmitting ? 'Đang xử lý...' : 'Thanh toán'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
  },
  cartList: {
    paddingVertical: 16,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  itemDetails: {
    flex: 1,
    marginLeft: 16,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 16,
    color: '#888',
    marginBottom: 4,
  },
  itemSize: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 14,
    color: '#666',
  },
  removeButton: {
    padding: 8,
    backgroundColor: '#ff5252',
    borderRadius: 8,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  footer: {
    borderTopWidth: 1,
    borderColor: '#ddd',
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  totalText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  checkoutButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
    width: '90%',
    alignItems: 'center',
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  normalButton: {
    backgroundColor: '#28a745',
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 15,
    backgroundColor: '#ddd',
    marginHorizontal: 5,
  },
  quantityButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  customerForm: {
    padding: 16,
    borderTopWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  formInput: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fafbfc',
    fontSize: 16,
  },
  mapButton: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginLeft: 8,
    backgroundColor: '#e6f0ff',
  },
  mapButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007bff',
  },
  headerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 48 : 18,
    paddingBottom: 12,
    backgroundColor: '#fff',
    zIndex: 10,
  },
  headerIconBtn: {
    padding: 6,
    marginLeft: 2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
    flex: 1,
    textAlign: 'center',
    marginLeft: -32, // Để căn giữa khi có 2 icon
  },
  headerCartIcon: {
    marginRight: 8,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
});

