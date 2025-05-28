import { StyleSheet, Text, View, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { orderApi } from '../../api/order';

type VNPayButtonProps = {
  orderId: string;
  amount: number;
  onSuccess?: () => void;
  onError?: (error: any) => void;
};

export const VNPayButton = ({ orderId, amount, onSuccess, onError }: VNPayButtonProps) => {
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: async () => {
      const response = await orderApi.createVNPayPayment({
        orderId,
        amount,
      });
      return response;
    },
    onSuccess: (data) => {
      // Mở URL thanh toán VNPay trong WebView hoặc browser
      if (data.paymentUrl) {
        router.push({
          pathname: '/payment/vnpay',
          params: { url: data.paymentUrl }
        });
      }
      onSuccess?.();
    },
    onError: (error) => {
      onError?.(error);
    },
  });

  return (
    <Pressable 
      style={[styles.button, mutation.status === 'pending' && styles.buttonDisabled]}
      onPress={() => mutation.mutate()}
      disabled={mutation.status === 'pending'}
    >
      <Image 
        source={require('../../../assets/images/vnpay.jpg')} 
        style={styles.logo}
      />
      <Text style={styles.text}>Thanh toán qua VNPay</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0055A4',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  logo: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  text: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 