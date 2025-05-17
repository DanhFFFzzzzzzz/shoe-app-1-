import { ActivityIndicator, FlatList, StyleSheet, Text, View, Image } from 'react-native'
import React from 'react'
import { Redirect, Stack, useLocalSearchParams } from 'expo-router';
import { format } from 'date-fns';
import { getMyOrder } from '../../../api/api';

const OrderDetails = () => {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { data: order, error, isLoading } = getMyOrder(slug);

  if (isLoading) return <ActivityIndicator />;
  if (error || !order) return <Text>Error: {error?.message}</Text>;

  const orderItems = order.order_items.map((orderItem: any) => {
    return {
      id: orderItem.id,
      title: orderItem.products.title,
      heroImage: orderItem.products.heroImage,
      price: orderItem.products.price,
      quantity: orderItem.quantity,
    };
  });

  return (
    <>
      <Stack.Screen options={{ title: `${order.slug}` }} />
      <FlatList
        style={styles.container}
        data={orderItems}
        keyExtractor={item => item.id.toString()}
        ListHeaderComponent={
          <>
            <Text style={styles.orderTitle}>{order.slug}</Text>
            <Text style={styles.details}>{order.description}</Text>
            <View style={[styles.statusBadge, styles[`statusBadge_${order.status}`]]}>
              <Text style={styles.statusText}>{order.status}</Text>
            </View>
            <Text style={styles.date}>{format(new Date(order.created_at), 'MMM dd, yyyy')}</Text>
            {/* Thông tin khách hàng */}
            <View style={styles.customerInfo}>
              <Text style={styles.customerLabel}>Khách hàng: <Text style={styles.customerValue}>{order.customer_name}</Text></Text>
              <Text style={styles.customerLabel}>SĐT: <Text style={styles.customerValue}>{order.customer_phone}</Text></Text>
              <Text style={styles.customerLabel}>Địa chỉ: <Text style={styles.customerValue}>{order.customer_address}</Text></Text>
            </View>
            <Text style={styles.itemsTitle}>Items Ordered:</Text>
          </>
        }
        renderItem={({ item }) => (
          <View style={styles.orderItem}>
            <Image source={{ uri: item.heroImage }} style={styles.heroImage} />
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.title}</Text>
              <Text style={styles.itemPrice}>Giá: {item.price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 })}</Text>
              <Text style={styles.itemQuantity}>Số lượng: {item.quantity}</Text>
            </View>
          </View>
        )}
        ListFooterComponent={
          <Text style={styles.totalPrice}>Tổng tiền: {order.totalPrice?.toLocaleString('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 })}</Text>
        }
      />
    </>
  );
};

export default OrderDetails;

const styles: { [key: string]: any } = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  orderTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#222',
  },
  details: {
    fontSize: 16,
    marginBottom: 8,
    color: '#555',
  },
  statusBadge: {
    padding: 8,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  statusBadge_Pending: {
    backgroundColor: 'orange',
  },
  statusBadge_Completed: {
    backgroundColor: 'green',
  },
  statusBadge_Shipped: {
    backgroundColor: 'blue',
  },
  statusBadge_InTransit: {
    backgroundColor: 'purple',
  },
  statusText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  date: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
    marginBottom: 8,
  },
  customerInfo: {
    backgroundColor: '#f6f8fa',
    borderRadius: 10,
    padding: 12,
    marginVertical: 10,
  },
  customerLabel: {
    fontWeight: 'bold',
    color: '#222',
    fontSize: 15,
    marginBottom: 2,
  },
  customerValue: {
    fontWeight: 'normal',
    color: '#444',
  },
  itemsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    color: '#1a237e',
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginTop: 8,
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    marginBottom: 8,
  },
  heroImage: {
    width: 90,
    height: 90,
    borderRadius: 10,
    marginRight: 14,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
  },
  itemPrice: {
    fontSize: 14,
    marginTop: 4,
    color: '#1976d2',
    fontWeight: 'bold',
  },
  itemQuantity: {
    fontSize: 14,
    marginTop: 2,
    color: '#555',
  },
  totalPrice: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginTop: 18,
    textAlign: 'right',
  },
});