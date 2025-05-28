import { VNPayButton } from '../../app/payment/vnpay-button';

const order = { id: '123', totalPrice: 100000 };
<VNPayButton
  orderId={order.id}
  amount={order.totalPrice}
  onSuccess={() => {
    // Có thể show thông báo hoặc chuyển hướng
  }}
  onError={(err) => {
    // Xử lý lỗi
  }}
/> 