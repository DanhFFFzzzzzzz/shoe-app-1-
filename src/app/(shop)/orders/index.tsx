import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link, Stack } from 'expo-router';
import { format } from 'date-fns';
import { getMyOrders } from '../../../api/api';

const Orders = () => {
  const { data: orders, error, isLoading } = getMyOrders();

  if (isLoading) return <ActivityIndicator />;
  if (error || !orders) return <Text>Error: {error?.message}</Text>;
  if (!orders.length)
    return (
      <Text style={{ fontSize: 16, color: '#555', textAlign: 'center', padding: 10 }}>
        No orders created yet
      </Text>
    );

  // Thêm hàm chuyển đổi trạng thái (hỗ trợ nhiều biến thể)
  const getOrderStatusVN = (status: string) => {
    if (!status) return '';
    const s = status.trim().toLowerCase();
    if (['pending', 'chờ xác nhận'].includes(s)) return 'Chờ xác nhận';
    if (['processing', 'in progress', 'đang xử lý'].includes(s)) return 'Đang xử lý';
    if (['completed', 'delivered', 'đã giao'].includes(s)) return 'Đã giao';
    if (['shipped', 'đã gửi hàng'].includes(s)) return 'Đã gửi hàng';
    if (['intransit', 'đang vận chuyển'].includes(s)) return 'Đang vận chuyển';
    if (['cancelled', 'đã hủy'].includes(s)) return 'Đã hủy';
    return status;
  };

  // Hàm lấy style cho badge trạng thái
  const getStatusBadgeStyle = (status: string) => {
    const s = status.trim().toLowerCase();
    if (s === 'pending' || s === 'chờ xác nhận') return styles.statusBadge_Pending;
    if (s === 'processing' || s === 'in progress' || s === 'đang xử lý') return styles.statusBadge_Processing;
    if (s === 'completed' || s === 'delivered' || s === 'đã giao') return styles.statusBadge_Completed;
    if (s === 'shipped' || s === 'đã gửi hàng') return styles.statusBadge_Shipped;
    if (s === 'intransit' || s === 'đang vận chuyển') return styles.statusBadge_InTransit;
    if (s === 'cancelled' || s === 'đã hủy') return styles.statusBadge_Cancelled;
    return styles.statusBadge;
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Orders' }} />
      <FlatList
        data={orders}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <Link href={`/orders/${item.slug}`} asChild>
            <Pressable style={styles.orderContainer}>
              <View style={styles.orderContent}>
                <View style={styles.orderDetailsContainer}>
                  <Text style={styles.orderItem}>{item.slug}</Text>
                  <Text style={styles.orderDetails}>{item.description}</Text>
                  <Text style={styles.orderDate}>
                    {format(new Date(item.created_at), 'MMM dd, yyyy')}
                  </Text>
                </View>
                <View style={[styles.statusBadge, getStatusBadgeStyle(item.status)]}>
                  <Text style={[
                    styles.statusText,
                    ['pending','chờ xác nhận','processing','in progress','đang xử lý'].includes(item.status.trim().toLowerCase()) ? { color: '#222' } : { color: '#fff' }
                  ]}>
                    {getOrderStatusVN(item.status)}
                  </Text>
                </View>
              </View>
            </Pressable>
          </Link>
        )}
      />
    </View>
  );
};

export default Orders;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  orderContainer: { backgroundColor: '#f8f8f8', padding: 16, marginVertical: 8, borderRadius: 8 },
  orderContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderDetailsContainer: { flex: 1 },
  orderItem: { fontSize: 18, fontWeight: 'bold' },
  orderDetails: { fontSize: 14, color: '#555' },
  orderDate: { fontSize: 12, color: '#888', marginTop: 4 },
  statusBadge: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 4, alignSelf: 'flex-start' },
  statusText: { fontSize: 12, fontWeight: 'bold', color: '#fff' },
  statusBadge_Pending: { backgroundColor: '#ffcc00' },
  statusBadge_Processing: { backgroundColor: '#90caf9' },
  statusBadge_Completed: { backgroundColor: '#4caf50' },
  statusBadge_Shipped: { backgroundColor: '#7e57c2' },
  statusBadge_InTransit: { backgroundColor: '#ff9800' },
  statusBadge_Cancelled: { backgroundColor: '#e53935' },
});