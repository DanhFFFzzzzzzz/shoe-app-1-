import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

const getOrderStatusVN = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'pending':
      return 'Chờ xác nhận';
    case 'completed':
    case 'delivered':
      return 'Đã giao';
    case 'shipped':
      return 'Đã gửi hàng';
    case 'intransit':
      return 'Đang vận chuyển';
    case 'processing':
      return 'Đang xử lý';
    case 'cancelled':
      return 'Đã hủy';
    default:
      return status;
  }
};

export default function OrderSuccessScreen() {
  const router = useRouter();
  // Lấy thông tin đơn hàng từ params (hoặc có thể lấy từ state tuỳ logic app)
  const params = useLocalSearchParams();
  const {
    slug,
    status,
    created_at,
    totalPrice,
    customer_name,
    customer_phone,
    customer_address,
  } = params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Đặt hàng thành công!</Text>
      <View style={styles.infoBox}>
        <Text style={styles.label}>Mã đơn:</Text>
        <Text style={styles.value}>{slug}</Text>
        <Text style={styles.label}>Trạng thái:</Text>
        <Text style={styles.value}>{getOrderStatusVN(status as string)}</Text>
        <Text style={styles.label}>Ngày đặt:</Text>
        <Text style={styles.value}>{created_at ? new Date(created_at as string).toLocaleDateString('vi-VN') : ''}</Text>
        <Text style={styles.label}>Tổng tiền:</Text>
        <Text style={styles.value}>{totalPrice ? Number(totalPrice).toLocaleString('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }) : ''}</Text>
        <Text style={styles.label}>Tên người nhận:</Text>
        <Text style={styles.value}>{customer_name}</Text>
        <Text style={styles.label}>SĐT:</Text>
        <Text style={styles.value}>{customer_phone}</Text>
        <Text style={styles.label}>Địa chỉ:</Text>
        <Text style={styles.value}>{customer_address}</Text>
      </View>
      <TouchableOpacity style={styles.button} onPress={() => router.replace('/orders')}>
        <Text style={styles.buttonText}>Xác nhận</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 24,
  },
  infoBox: {
    width: '100%',
    backgroundColor: '#f5f7fa',
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  label: {
    fontWeight: 'bold',
    color: '#222',
    marginTop: 8,
  },
  value: {
    color: '#444',
    fontSize: 16,
    marginBottom: 2,
  },
  button: {
    backgroundColor: '#1976d2',
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
}); 