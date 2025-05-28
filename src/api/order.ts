import { supabase } from '../lib/supabase'; 

export const orderApi = {
  // ... existing code ...

  createVNPayPayment: async ({ orderId, amount }: { orderId: string; amount: number }) => {
    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/payment/vnpay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId,
        amount,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create VNPay payment');
    }

    return response.json();
  },
}; 