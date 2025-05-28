import { useLocalSearchParams } from 'expo-router';
import { WebView } from 'react-native-webview';
import { StyleSheet, View } from 'react-native';

export default function VNPayPaymentScreen() {
  const { url } = useLocalSearchParams<{ url: string }>();

  return (
    <View style={styles.container}>
      <WebView 
        source={{ uri: url }} 
        style={styles.webview}
        onNavigationStateChange={(navState) => {
          // Xử lý khi người dùng hoàn thành thanh toán
          if (navState.url.includes('vnp_ResponseCode=00')) {
            // Thanh toán thành công
            // Cập nhật trạng thái đơn hàng
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
}); 