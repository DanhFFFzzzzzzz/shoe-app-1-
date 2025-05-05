import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Platform,
  TouchableOpacity,
  FlatList,
  Image,
} from 'react-native';
import { useCartStore } from '../store/cart-store';
import { StatusBar } from 'expo-status-bar';
import { createOrder, createOrderItem } from '../api/api';
import * as Linking from 'expo-linking';
//import { openStripeCheckout, setupStripePaymentSheet } from '../lib/stripe';

type CartItemType = {
  id: number;
  title: string;
  heroImage: string;
  price: number;
  quantity: number;
  maxQuantity: number;
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
        <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
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
        <Text style={styles.removeButtonText}>Remove</Text>
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

  // Lắng nghe callback từ PayPal (deep link)
  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      const url = event.url;
      if (url.startsWith('myshoesapp://paypal-success')) {
        Alert.alert('Thanh toán thành công qua PayPal!');
        resetCart();
      } else if (url.startsWith('myshoesapp://paypal-cancel')) {
        Alert.alert('Bạn đã hủy thanh toán PayPal.');
      }
    };
    const subscription = Linking.addEventListener('url', handleDeepLink);
    return () => {
      subscription.remove();
    };
  }, []);

  const handleCheckout = async () => {
    if (!items || items.length === 0) {
      Alert.alert('Thông báo', 'Giỏ hàng của bạn đang trống!');
      return;
    }
    const totalPrice = parseFloat(getTotalPrice().toFixed(2));
    try {
      const order = await createSupabaseOrder({ totalPrice });
      if (!order || !order.id) {
        throw new Error('Không thể tạo đơn hàng. Vui lòng thử lại!');
      }
      await createSupabaseOrderItem(
        items.map(item => ({
          orderId: order.id,
          productId: item.id,
          quantity: item.quantity,
        }))
      );
      alert('Order created successfully');
      resetCart();
    } catch (error) {
      let message = (error instanceof Error ? error.message : String(error)) || 'Failed to process your order. Please try again.';
      if (message.includes('Function not implemented')) {
        message = 'Lỗi hệ thống: Chức năng trừ số lượng sản phẩm chưa được cấu hình trên máy chủ. Vui lòng liên hệ quản trị viên hoặc thử lại sau!';
      }
      Alert.alert('Error', message);
    }
  };

  // Thêm hàm thanh toán PayPal với return/cancel URL
  const handlePayPal = async () => {
    const total = getTotalPrice();
    const returnUrl = encodeURIComponent('myshoesapp://paypal-success');
    const cancelUrl = encodeURIComponent('myshoesapp://paypal-cancel');
    // Thay business email bằng email PayPal sandbox của bạn
    const paypalUrl = `https://www.sandbox.paypal.com/cgi-bin/webscr?cmd=_xclick&business=sb-xxxxxxx@business.example.com&item_name=Order&amount=${total}&currency_code=USD&return=${returnUrl}&cancel_return=${cancelUrl}`;
    Linking.openURL(paypalUrl);
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

      <FlatList
        data={items}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <CartItem
            item={item}
            onRemove={removeItem}
            onIncrement={incrementItem}
            onDecrement={decrementItem}
          />
        )}
        contentContainerStyle={styles.cartList}
      />

      <View style={styles.footer}>
        <Text style={styles.totalText}>Total: ${getTotalPrice()}</Text>
        <TouchableOpacity
          onPress={handleCheckout}
          style={styles.checkoutButton}
        >
          <Text style={styles.checkoutButtonText}>Thanh toán</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handlePayPal}
          style={[styles.checkoutButton, { backgroundColor: '#ffc439', marginTop: 8 }]}
        >
          <Text style={[styles.checkoutButtonText, { color: '#222' }]}>Pay with PayPal</Text>
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
  },
  checkoutButton: {
    backgroundColor: '#28a745',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
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
});

function setupStripePaymentSheet(arg0: number) {
  throw new Error('Function not implemented.');
}
function openStripeCheckout() {
  throw new Error('Function not implemented.');
}

