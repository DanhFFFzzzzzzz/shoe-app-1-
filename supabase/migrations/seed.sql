-- Insert categories
INSERT INTO public.category (name, imageUrl, slug) VALUES
('Sandals', 'https://example.com/sandals.jpg', 'sandals'),
('Sneakers', 'https://example.com/sneakers.jpg', 'sneakers'),
('Shoes', 'https://example.com/shoes.jpg', 'shoes'),
('Slippers', 'https://example.com/slippers.jpg', 'slippers');

-- Insert products
INSERT INTO public.product (title, slug, imagesUrl, price, heroImage, category, maxQuantity, description, availableSizes) VALUES
('Sandal Adidas', 'sandal-adidas', ARRAY['https://example.com/sandal-adidas-1.jpg', 'https://example.com/sandal-adidas-2.jpg'], 899.99, 'https://example.com/sandal-adidas-1.jpg', 1, 5, 'Sandal Adidas với thiết kế thoáng khí, đế cao su chống trượt, phù hợp cho mọi hoạt động ngoài trời. Chất liệu bền bỉ, êm ái khi mang.', ARRAY[34,35,36,37,38,39,40,41,42,43,44,45]),

('Sandal Nike', 'sandal-nike', ARRAY['https://example.com/sandal-nike-1.jpg', 'https://example.com/sandal-nike-2.jpg'], 1099.99, 'https://example.com/sandal-nike-1.jpg', 1, 7, 'Sandal Nike với công nghệ đệm êm ái, thiết kế thời trang và chất liệu bền bỉ. Phù hợp cho các hoạt động thể thao và thời trang hàng ngày.', ARRAY[34,35,36,37,38,39,40,41,42,43,44,45]),

('Sneaker Adidas', 'sneaker-adidas', ARRAY['https://example.com/sneaker-adidas-1.jpg', 'https://example.com/sneaker-adidas-2.jpg'], 999.99, 'https://example.com/sneaker-adidas-1.jpg', 2, 10, 'Sneaker Adidas với công nghệ Boost, đệm êm ái và thiết kế thời trang. Phù hợp cho chạy bộ và thời trang đường phố.', ARRAY[34,35,36,37,38,39,40,41,42,43,44,45]),

('Sneaker Nike', 'sneaker-nike', ARRAY['https://example.com/sneaker-nike-1.jpg', 'https://example.com/sneaker-nike-2.jpg'], 799.99, 'https://example.com/sneaker-nike-1.jpg', 2, 12, 'Sneaker Nike với công nghệ Air, đệm êm ái và thiết kế thời trang. Phù hợp cho chạy bộ và thời trang đường phố.', ARRAY[34,35,36,37,38,39,40,41,42,43,44,45]),

('Shoes', 'shoes', ARRAY['https://example.com/shoe-1.jpg', 'https://example.com/shoe-2.jpg'], 499.99, 'https://example.com/shoe-1.jpg', 3, 15, 'Giày da cao cấp với thiết kế sang trọng, chất liệu da thật và đế cao su chống trượt. Phù hợp cho công sở và các dịp quan trọng.', ARRAY[34,35,36,37,38,39,40,41,42,43,44,45]),

('Slippers', 'slippers', ARRAY['https://example.com/slippers-1.jpg', 'https://example.com/slippers-2.jpg'], 699.99, 'https://example.com/slippers-1.jpg', 4, 3, 'Dép đi trong nhà với chất liệu êm ái, thiết kế đơn giản và tiện lợi. Phù hợp cho sử dụng trong nhà và các hoạt động thư giãn.', ARRAY[34,35,36,37,38,39,40,41,42,43,44,45]),

('Sneaker Puma', 'sneaker-puma', ARRAY['https://example.com/sneaker-puma-1.jpg', 'https://example.com/sneaker-puma-2.jpg'], 299.99, 'https://example.com/sneaker-puma-1.jpg', 2, 8, 'Sneaker Puma với thiết kế thể thao, đệm êm ái và chất liệu bền bỉ. Phù hợp cho các hoạt động thể thao và thời trang hàng ngày.', ARRAY[34,35,36,37,38,39,40,41,42,43,44,45]); 