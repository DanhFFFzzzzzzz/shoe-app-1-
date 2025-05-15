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
} from 'react-native';
import { useCartStore } from '../store/cart-store';
import { StatusBar } from 'expo-status-bar';
import { createOrder, createOrderItem } from '../api/api';
import * as Linking from 'expo-linking';
import * as Location from 'expo-location';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';
import { productApi } from '../api/product';

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
  onRemove: (id: number) => void;
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
        onPress={() => onRemove(item.id)}
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
    if (!items || items.length === 0) {
      Alert.alert('Thông báo', 'Giỏ hàng của bạn đang trống!');
      return;
    }
    if (!customerName || !customerPhone || !customerAddress) {
      Alert.alert('Yêu cầu thông tin', 'Vui lòng nhập đầy đủ thông tin nhận hàng.');
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

      // Gọi API cập nhật trạng thái đơn hàng là đã thanh toán
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';
      if (!token) throw new Error('Không tìm thấy phiên đăng nhập');
      // Giả sử backend có endpoint xác nhận thanh toán
      const response = await fetch(`http://192.168.1.4:3000/api/orders/${order.id}/confirm`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Không thể xác nhận thanh toán');

      Alert.alert('Thanh toán thành công!', 'Cảm ơn bạn đã mua hàng.');
      resetCart();
      return order.id;
    } catch (error) {
      let message = (error instanceof Error ? error.message : String(error)) || 'Lỗi xử lý đơn hàng. Vui lòng thử lại.';
      if (message.includes('Function not implemented')) {
        message = 'Lỗi hệ thống: Chức năng trừ số lượng sản phẩm chưa được cấu hình trên máy chủ. Vui lòng liên hệ quản trị viên hoặc thử lại sau!';
      }
      Alert.alert('Lỗi', message);
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

  // Thêm lại hàm handleVNPay
  const handleVNPay = useCallback(async () => {
    if (!customerName || !customerPhone || !customerAddress) {
      Alert.alert('Yêu cầu thông tin', 'Vui lòng nhập đầy đủ thông tin nhận hàng trước khi thanh toán.');
      return;
    }
    if (!items || items.length === 0) {
      Alert.alert('Thông báo', 'Giỏ hàng của bạn đang trống!');
      return;
    }

    try {
      // 1. Tạo đơn hàng trước
      const orderId = await handleCheckout();
      if (!orderId) {
        throw new Error('Không thể tạo đơn hàng');
      }

      // 2. Lưu orderId để xử lý callback - chuyển đổi thành string
      await AsyncStorage.setItem('pendingOrderId', orderId.toString());

      // 3. Lấy token mới nhất
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';
      if (!token) {
        throw new Error('Không tìm thấy phiên đăng nhập');
      }

      const totalAmount = getTotalPrice();
      // 4. Gọi API backend để lấy URL thanh toán VNPay
      const response = await fetch('http://192.168.1.4:3000/api/vnpay/create_payment_url', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: totalAmount,
          orderId: orderId.toString(),
          orderDescription: `Thanh toan don hang ${orderId}`,
        }),
      });

      const contentType = response.headers.get('content-type');
      let data;
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        // Xóa đơn hàng tạm nếu có lỗi
        try {
          await fetch(`http://192.168.1.4:3000/api/orders/${orderId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
        } catch (deleteError) {
          console.error('Lỗi xóa đơn hàng tạm:', deleteError);
        }
        Alert.alert('Lỗi', 'Không thể kết nối với cổng thanh toán. Vui lòng thử lại sau hoặc liên hệ hỗ trợ.');
        return;
      }

      if (data && data.paymentUrl) {
        let paymentUrl = data.paymentUrl;
        // Đảm bảo luôn dùng sandbox.vnpayment.vn
        try {
          const urlObj = new URL(paymentUrl);
          if (urlObj.hostname !== 'sandbox.vnpayment.vn') {
            urlObj.hostname = 'sandbox.vnpayment.vn';
            paymentUrl = urlObj.toString();
          }
        } catch (e) {
          // Nếu lỗi khi parse URL, vẫn dùng paymentUrl gốc
        }
        const canOpen = await Linking.canOpenURL(paymentUrl);
        if (canOpen) {
          await Linking.openURL(paymentUrl);
        } else {
          throw new Error('Không thể mở URL thanh toán');
        }
      } else {
        throw new Error('Không nhận được URL thanh toán từ VNPay');
      }
    } catch (error) {
      // Xóa pendingOrderId nếu có lỗi
      try {
        await AsyncStorage.removeItem('pendingOrderId');
      } catch (e) {
        console.error('Lỗi xóa pendingOrderId:', e);
      }
      Alert.alert('Lỗi', 'Không thể khởi tạo thanh toán VNPay. Vui lòng thử lại sau hoặc liên hệ hỗ trợ.');
    }
  }, [customerName, customerPhone, customerAddress, items, getTotalPrice, handleCheckout]);

  // Hàm xóa sản phẩm khỏi giỏ hàng và trả lại số lượng tồn kho
  const handleRemoveFromCart = async (item: CartItemType) => {
    try {
      await productApi.incrementProductQuantity(item.id, item.size, item.quantity);
      removeItem(item.id);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể trả lại số lượng sản phẩm. Vui lòng thử lại!');
    }
  };

  if (!items || items.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
        <Text style={{ textAlign: 'center', marginTop: 40, fontSize: 18 }}>
          Giỏ hàng của bạn đang trống!
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />

      {/* Form nhập thông tin khách hàng */}
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

      {/* Danh sách sản phẩm trong giỏ */}
      <FlatList
        data={items}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <CartItem
            item={item}
            onRemove={() => handleRemoveFromCart(item)}
            onIncrement={incrementItem}
            onDecrement={decrementItem}
          />
        )}
        contentContainerStyle={styles.cartList}
      />

      <View style={styles.footer}>
        <Text style={styles.totalText}>Tổng tiền: {getTotalPrice().toLocaleString('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 })}</Text>
        
        {/* Nút thanh toán thông thường */}
        <TouchableOpacity
          onPress={handleCheckout}
          style={[styles.checkoutButton, styles.normalButton]}
        >
          <Text style={styles.checkoutButtonText}>Thanh toán</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleVNPay}
          style={[styles.checkoutButton, styles.vnpayButton]}
        >
          <Text style={[styles.checkoutButtonText, styles.vnpayButtonText]}>Thanh toán qua VNPay</Text>
        </TouchableOpacity>
      </View>
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
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
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
  vnpayButton: {
    backgroundColor: '#005baa',
  },
  vnpayButtonText: {
    color: '#fff',
  },
});

