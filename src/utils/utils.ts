import { nanoid } from 'nanoid';

//tạo ra một chuỗi định danh duy nhất cho đơn hàng.

export const generateOrderSlug = () => {
  const randomString = nanoid(4);
  const timestamp = new Date().getTime();
  return `order-${randomString}-${timestamp}`;
};