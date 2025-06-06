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
    description: 'Sandal Adidas với thiết kế thoáng khí, đế cao su chống trượt, phù hợp cho mọi hoạt động ngoài trời. Chất liệu bền bỉ, êm ái khi mang.'
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
    description: 'Sandal Nike với công nghệ đệm êm ái, thiết kế thời trang và chất liệu bền bỉ. Phù hợp cho các hoạt động thể thao và thời trang hàng ngày.'
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
    description: 'Sneaker Adidas với công nghệ Boost, đệm êm ái và thiết kế thời trang. Phù hợp cho chạy bộ và thời trang đường phố.'
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
    description: 'Sneaker Nike với công nghệ Air, đệm êm ái và thiết kế thời trang. Phù hợp cho chạy bộ và thời trang đường phố.'
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
    description: 'Giày da cao cấp với thiết kế sang trọng, chất liệu da thật và đế cao su chống trượt. Phù hợp cho công sở và các dịp quan trọng.'
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
    description: 'Dép đi trong nhà với chất liệu êm ái, thiết kế đơn giản và tiện lợi. Phù hợp cho sử dụng trong nhà và các hoạt động thư giãn.'
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
    description: 'Sneaker Puma với thiết kế thể thao, đệm êm ái và chất liệu bền bỉ. Phù hợp cho các hoạt động thể thao và thời trang hàng ngày.'
  },
];