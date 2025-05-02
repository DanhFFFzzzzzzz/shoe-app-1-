import { Product } from './types/product';

export const PRODUCTS: Product[] = [
  {
    id: 1,
    title: 'Sandal Adidas',
    slug: 'sandal-adidas',
    heroImage: require('../assets/images/sandal-adidas-1.jpg'),
    imagesUrl: [
      require('../assets/images/sandal-adidas-1.jpg'),
      require('../assets/images/sandal-adidas-2.jpg'),
      require('../assets/images/sandal-adidas-3.jpg'),
    ],
    price: 899.99,
    category: {
      imageUrl: require('../assets/images/sandal-adidas-1.jpg'),
      name: 'Sandals',
      slug: 'sandals',
    },
    maxQuantity: 5,
  },
  {
    id: 5,
    title: 'Sandal Nike',
    slug: 'sandal-nike',
    heroImage: require('../assets/images/sandal-nike-1.jpg'),
    imagesUrl: [
      require('../assets/images/sandal-nike-1.jpg'),
      require('../assets/images/sandal-nike-2.jpg'),
    ],
    price: 1099.99,
    category: {
      imageUrl: require('../assets/images/sandal-nike-1.jpg'),
      name: 'Sandals',
      slug: 'sandals',
    },
    maxQuantity: 7,
  },
  {
    id: 2,
    title: 'Sneaker Adidas',
    slug: 'sneaker-adidas',
    heroImage: require('../assets/images/sneaker-adidas-1.jpg'),
    imagesUrl: [
      require('../assets/images/sneaker-adidas-1.jpg'),
      require('../assets/images/sneaker-adidas-2.jpg'),
    ],
    price: 999.99,
    category: {
      imageUrl: require('../assets/images/sneaker-adidas-1.jpg'),
      name: 'Sneakers',
      slug: 'sneakers',
    },
    maxQuantity: 10,
  },
  {
    id: 6,
    title: 'Sneaker Nike',
    slug: 'sneaker-nike',
    heroImage: require('../assets/images/sneaker-nike-1.jpg'),
    imagesUrl: [
      require('../assets/images/sneaker-nike-1.jpg'),
      require('../assets/images/sneaker-nike-2.jpg'),
    ],
    price: 799.99,
    category: {
      imageUrl: require('../assets/images/sneaker-nike-1.jpg'),
      name: 'Sneakers',
      slug: 'sneakers',
    },
    maxQuantity: 12,
  },
  {
    id: 3,
    title: 'Shoes',
    slug: 'shoes',
    heroImage: require('../assets/images/shoe-1.jpg'),
    imagesUrl: [
      require('../assets/images/shoe-1.jpg'),
      require('../assets/images/shoe-2.jpg'),
    ],
    price: 499.99,
    category: {
      imageUrl: require('../assets/images/shoe-1.jpg'),
      name: 'Shoes',
      slug: 'shoes',
    },
    maxQuantity: 15,
  },
  {
    id: 4,
    title: 'Slippers',
    slug: 'slpippers',
    heroImage: require('../assets/images/slippers-1.jpg'),
    imagesUrl: [
      require('../assets/images/slippers-1.jpg'),
      require('../assets/images/slippers-2.jpg'),
      require('../assets/images/slippers-3.jpg'),
    ],
    price: 699.99,
    category: {
      imageUrl: require('../assets/images/slippers-1.jpg'),
      name: 'Slippers',
      slug: 'slippers',
    },
    maxQuantity: 3,
  },
  {
    id: 7,
    title: 'Sneaker Puma',
    slug: 'sneaker-puma',
    heroImage: require('../assets/images/sneaker-puma-1.jpg'),
    imagesUrl: [
      require('../assets/images/sneaker-puma-1.jpg'),
      require('../assets/images/sneaker-puma-2.jpg'),
    ],
    price: 299.99,
    category: {
      imageUrl: require('../assets/images/sneaker-puma-1.jpg'),
      name: 'Sneakers',
      slug: 'sneakers',
    },
    maxQuantity: 8,
  },
];