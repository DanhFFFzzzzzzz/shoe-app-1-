import { ReactNode } from 'react';
import { Product } from './product';

export type OrderStatus = 'Pending' | 'Completed' | 'Shipped' | 'InTransit';

export type Order = {
  description: ReactNode;
  created_at: string | number | Date;
  id: string;
  slug: string;
  item: string;
  details: string;
  status: OrderStatus;
  date: string;
  items: Product[];
};