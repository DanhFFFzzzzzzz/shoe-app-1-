import { Category } from './types/category';
import { PRODUCTS } from './products';

export const CATEGORIES: Category[] = [
  {
    name: 'Shoes',
    slug: 'shoes',
    imageUrl:
      'https://images.pexels.com/photos/8159427/pexels-photo-8159427.jpeg',
    products: PRODUCTS.filter(product => product.category.slug === 'shoes'),
  },
  {
    name: 'Sneakers',
    slug: 'sneakers',
    imageUrl:
      'https://images.pexels.com/photos/30313904/pexels-photo-30313904.jpeg',
    products: PRODUCTS.filter(product => product.category.slug === 'sneakers'),
  },
  {
    name: 'Sandals',
    slug: 'sandals',
    imageUrl:
      'https://images.pexels.com/photos/13912070/pexels-photo-13912070.jpeg',
    products: PRODUCTS.filter(product => product.category.slug === 'sandals'),
  },
  {
    name: 'Slippers',
    slug: 'slippers',
    imageUrl:
      'https://images.pexels.com/photos/1756086/pexels-photo-1756086.jpeg',
    products: PRODUCTS.filter(
      product => product.category.slug === 'slippers'),
  },
];
