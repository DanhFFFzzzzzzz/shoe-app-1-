import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, Text, ActivityIndicator, Image, Dimensions, Pressable, ScrollView } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getProductsAndCategories } from '../../api/api';
import { ProductListItem } from '../../components/product-list-item';
import { MaterialIcons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const CARD_MARGIN = 10;
const CARD_WIDTH = (width - CARD_MARGIN * 3) / 2;

const BANNERS = [
  { id: 1, url: 'https://get.pxhere.com/photo/hand-person-shoe-sky-tennis-shoe-footwear-computer-wallpaper-54408.jpg' },
  { id: 2, url: 'https://thietke6d.com/wp-content/uploads/2021/05/banner-quang-cao-giay-13.png' },
  { id: 3, url: 'https://img.freepik.com/free-psd/sneaker-sale-banner-template_23-2148985097.jpg' },
];

const Home = () => {
  const { data, error, isLoading } = useQuery({
    queryKey: ['productsAndCategories'],
    queryFn: getProductsAndCategories,
  });

  const [recentProducts, setRecentProducts] = useState<any[]>([]);
  const [currentBanner, setCurrentBanner] = useState(0);

  useEffect(() => {
    // Lấy sản phẩm đã xem gần đây từ AsyncStorage
    const fetchRecent = async () => {
      try {
        // Giả sử userId là 'guest' nếu chưa đăng nhập
        const key = `recently_viewed_guest`;
        const json = await AsyncStorage.getItem(key);
        let arr = json ? JSON.parse(json) : [];
        setRecentProducts(arr);
      } catch (error) {
        setRecentProducts([]);
      }
    };
    fetchRecent();
  }, []);

  // Auto slide banner
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBanner(prev => (prev + 1) % BANNERS.length);
    }, 2500); // 2.5 giây đổi ảnh
    return () => clearInterval(interval);
  }, []);

  if (isLoading) return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color="#1976d2" />
    </View>
  );
  if (error || !data) return (
    <View style={styles.centered}>
      <MaterialIcons name="error-outline" size={40} color="#e53935" />
      <Text style={styles.errorText}>Đã xảy ra lỗi: {error?.message || 'An error occured'}</Text>
    </View>
  );

  const products = Array.isArray((data as any).products) ? (data as any).products : [];
  const categories = Array.isArray((data as any).categories) ? (data as any).categories : [];
  const bestSellers = products.slice(0, 5);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f5f7fa' }}>
      {/* Banner auto-slide */}
      <View style={{ alignItems: 'center' }}>
        <Image
          source={{ uri: BANNERS[currentBanner].url }}
          style={styles.banner}
          resizeMode="cover"
        />
        {/* Indicator dots */}
        <View style={styles.dotsRow}>
          {BANNERS.map((b, idx) => (
            <View
              key={b.id}
              style={[
                styles.dot,
                idx === currentBanner && styles.dotActive
              ]}
            />
          ))}
        </View>
      </View>

      {/* Danh mục nổi bật */}
      <Text style={styles.sectionTitle}>Danh mục nổi bật</Text>
      <FlatList
        data={categories}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <Link asChild href={`/categories/${item.slug}`}>
            <Pressable style={styles.categoryCard}>
              <Image source={{ uri: item.imageUrl }} style={styles.categoryImage} />
              <Text style={styles.categoryText}>{item.name}</Text>
            </Pressable>
          </Link>
        )}
        contentContainerStyle={styles.categoryList}
      />

      {/* Sản phẩm bán chạy */}
      <Text style={styles.sectionTitle}>Bán chạy nhất</Text>
      <FlatList
        data={bestSellers}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <ProductListItem product={item} cardWidth={140} />
        )}
        contentContainerStyle={styles.bestSellerList}
      />

      {/* Sản phẩm đã xem gần đây */}
      {recentProducts.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Đã xem gần đây</Text>
          <FlatList
            data={recentProducts}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => (
              <Link asChild href={`/product/${item.slug}`}>
                <Pressable style={styles.recentCard}>
                  <Image source={{ uri: item.heroImage }} style={styles.recentImage} />
                  <Text style={styles.recentName} numberOfLines={1}>{item.title}</Text>
                </Pressable>
              </Link>
            )}
            contentContainerStyle={styles.recentList}
          />
        </>
      )}

      {/* Tất cả sản phẩm */}
      <Text style={styles.sectionTitle}>Tất cả sản phẩm</Text>
      <FlatList
        data={products}
        renderItem={({ item }) => <ProductListItem product={item} cardWidth={CARD_WIDTH} />}
        keyExtractor={item => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.flatListContent}
        columnWrapperStyle={styles.flatListColumn}
        scrollEnabled={false}
      />
    </ScrollView>
  );
};

export default Home;

const styles = StyleSheet.create({
  banner: {
    width: width - 28,
    height: 160,
    borderRadius: 18,
    margin: 14,
    marginRight: 0,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 3,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 4,
    marginTop: -10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#bdbdbd',
    marginHorizontal: 3,
  },
  dotActive: {
    backgroundColor: '#1976d2',
    width: 12,
    height: 8,
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#1a237e',
    marginLeft: 16,
    marginTop: 18,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  categoryList: {
    paddingLeft: 12,
    paddingBottom: 8,
  },
  categoryCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    alignItems: 'center',
    marginRight: 16,
    padding: 10,
    width: 90,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  categoryImage: {
    width: 50,
    height: 50,
    borderRadius: 10,
    marginBottom: 6,
    backgroundColor: '#f2f2f2',
  },
  categoryText: {
    fontSize: 13,
    color: '#222',
    fontWeight: '600',
    textAlign: 'center',
  },
  bestSellerList: {
    paddingLeft: 12,
    paddingBottom: 8,
  },
  recentList: {
    paddingLeft: 12,
    paddingBottom: 8,
  },
  recentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 14,
    padding: 8,
    width: 90,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  recentImage: {
    width: 50,
    height: 50,
    borderRadius: 10,
    marginBottom: 6,
    backgroundColor: '#f2f2f2',
  },
  recentName: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
    fontWeight: '500',
  },
  flatListContent: {
    paddingBottom: 30,
    paddingHorizontal: 6,
  },
  flatListColumn: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#e53935',
    marginTop: 10,
    textAlign: 'center',
  },
});