import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, Text, ActivityIndicator, Image, Dimensions, Pressable, ScrollView, TouchableOpacity, Platform, Alert } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getProductsAndCategories } from '../../api/api';
import { ProductListItem } from '../../components/product-list-item';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';
import { useCartStore } from '../../store/cart-store';
import { productApi } from '../../api/product';
import { useAuth } from '../../providers/auth-provider';

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
  const { getItemCount } = useCartStore();
  const { user } = useAuth();

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

  // Lấy sản phẩm collaborative recommendation
  const { data: collaborativeRecommendations, isLoading: isLoadingCollaborative } = useQuery({
    queryKey: ['collaborativeRecommendations', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      // Lấy danh sách title từ collaborative API
      const titles = await productApi.getCollaborativeRecommendations(user.id);
      if (!titles.length) return [];
      // Lấy chi tiết sản phẩm từ Supabase theo title
      const { data: products, error } = await supabase
        .from('product')
        .select('*')
        .in('title', titles);
      if (error) return [];
      // Sắp xếp lại theo thứ tự titles
      return titles.map((title: string) => products.find((p: any) => p.title === title)).filter(Boolean);
    },
    enabled: !!user?.id,
  });

  // Lấy sản phẩm gợi ý content-based cho user (dựa trên sản phẩm đầu tiên)
  const { data: contentBasedRecommendations, isLoading: isLoadingContentBased } = useQuery({
    queryKey: ['contentBasedRecommendations', data?.products?.[0]?.id],
    queryFn: async () => {
      if (!data?.products?.length) return [];
      // Lấy gợi ý theo sản phẩm đầu tiên
      const titles = await productApi.getProductRecommendations(data.products[0].id);
      if (!titles.length) return [];
      // Lấy chi tiết sản phẩm từ Supabase theo title
      const { data: productsData, error } = await supabase
        .from('product')
        .select('*')
        .in('title', titles);
      if (error) return [];
      // Sắp xếp lại theo thứ tự titles
      return titles.map((title: string) => productsData.find((p: any) => p.title === title)).filter(Boolean);
    },
    enabled: !!data?.products?.length,
  });

  // Hàm đăng xuất
  const handleSignOut = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất khỏi ứng dụng?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: () => {
            (async () => {
              try {
                await supabase.auth.signOut();
                router.replace('/auth');
              } catch (e) {
                Alert.alert('Lỗi', 'Không thể đăng xuất. Vui lòng thử lại!');
              }
            })();
          },
        },
      ]
    );
  };

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
    <View style={{ flex: 1, backgroundColor: '#f5f7fa' }}>
      {/* Header cố định trên cùng */}
      <View style={styles.headerBox}>
        <TouchableOpacity onPress={handleSignOut} style={styles.headerSignOutBtn} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={28} color="#e53935" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trang chủ</Text>
        <TouchableOpacity onPress={() => router.push('/cart')} style={styles.headerIconBtn}>
          <View>
            <MaterialIcons name="shopping-cart" size={26} color="#1976d2" />
            {getItemCount() > 0 && (
              <View style={{
                position: 'absolute',
                top: -6,
                right: -6,
                backgroundColor: '#1BC464',
                borderRadius: 10,
                width: 20,
                height: 20,
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 1,
              }}>
                <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>{getItemCount()}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>
      {/* Nội dung có thể kéo */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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
          keyExtractor={(item, index) => `${item.id}_${index}`}
          renderItem={({ item }) => (
            <Link asChild href={`/categories/${item.slug}`}>
              <Pressable style={styles.categoryCard}>
                <Image source={{ uri: item.imageUrl }} style={styles.categoryImage} />
                <Text style={styles.categoryText}>{item.name}</Text>
              </Pressable>
            </Link>
          )}
          contentContainerStyle={styles.categoryList}
          style={{ marginBottom: 8 }}
        />
        {/* Sản phẩm bán chạy */}
        <Text style={styles.sectionTitle}>Bán chạy nhất</Text>
        <FlatList
          data={bestSellers}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, index) => `${item.id}_${index}`}
          renderItem={({ item }) => (
            <ProductListItem product={item} cardWidth={140} />
          )}
          contentContainerStyle={styles.bestSellerList}
          style={{ marginBottom: 8 }}
        />
        {/* Gợi ý cho bạn (content-based) */}
        {contentBasedRecommendations && contentBasedRecommendations.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Gợi ý cho bạn</Text>
            <FlatList
              data={contentBasedRecommendations}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item, index) => `${item.id}_${index}`}
              renderItem={({ item }) => (
                <ProductListItem product={item} cardWidth={140} />
              )}
              contentContainerStyle={styles.bestSellerList}
              style={{ marginBottom: 8 }}
            />
          </>
        )}
        {/* Sản phẩm đã xem gần đây */}
        {recentProducts.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Đã xem gần đây</Text>
            <FlatList
              data={recentProducts}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item, index) => `${item.id}_${item.slug || index}`}
              renderItem={({ item }) => (
                <Link asChild href={`/product/${item.slug}`}>
                  <Pressable style={styles.recentCard}>
                    <Image source={{ uri: item.heroImage }} style={styles.recentImage} />
                    <Text style={styles.recentName} numberOfLines={1}>{item.title}</Text>
                  </Pressable>
                </Link>
              )}
              contentContainerStyle={styles.recentList}
              style={{ marginBottom: 8 }}
            />
          </>
        )}
        {/* Tất cả sản phẩm */}
        <Text style={styles.sectionTitle}>Tất cả sản phẩm</Text>
        <FlatList
          data={products}
          renderItem={({ item }) => <ProductListItem product={item} cardWidth={CARD_WIDTH} />}
          keyExtractor={(item, index) => `${item.id}_${item.slug || index}`}
          numColumns={2}
          contentContainerStyle={styles.flatListContent}
          columnWrapperStyle={styles.flatListColumn}
          scrollEnabled={false}
          style={{ marginBottom: 24 }}
        />
      </ScrollView>
    </View>
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
  headerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 48 : 18,
    paddingBottom: 12,
    backgroundColor: '#fff',
    zIndex: 10,
  },
  headerIconBtn: {
    padding: 6,
    marginLeft: 2,
    marginRight: 2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
    flex: 1,
    textAlign: 'center',
    marginLeft: -32, // Để căn giữa khi có 2 icon
  },
  scrollContent: {
    paddingBottom: 32,
    paddingTop: 0,
  },
  headerSignOutBtn: {
    padding: 8,
    marginLeft: 2,
    backgroundColor: '#fff0f0',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#e53935',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#e53935',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
});