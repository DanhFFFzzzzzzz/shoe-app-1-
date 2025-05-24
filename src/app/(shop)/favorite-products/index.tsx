import { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, Pressable, StyleSheet } from 'react-native';
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'expo-router';

export default function FavoriteProductsScreen() {
  const [products, setProducts] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    // Lấy danh sách id sản phẩm đã thích
    const { data: favs } = await supabase
      .from('favorite_product')
      .select('product')
      .eq('user', user.id);
    const ids = favs?.map(f => f.product) || [];
    if (ids.length === 0) {
      setProducts([]);
      return;
    }
    // Lấy thông tin sản phẩm
    const { data: productsData } = await supabase
      .from('product')
      .select('*')
      .in('id', ids);
    setProducts(productsData || []);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Danh sách yêu thích</Text>
      {products.length === 0 ? (
        <Text style={styles.empty}>Bạn chưa thích sản phẩm nào.</Text>
      ) : (
        <FlatList
          data={products}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <Pressable
              style={styles.item}
              onPress={() => router.push(`/product/${item.slug}`)}
            >
              <Image source={{ uri: item.heroImage }} style={styles.image} />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.title}</Text>
                <Text style={styles.price}>
                  {item.price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 })}
                </Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16, color: '#1976d2', textAlign: 'center' },
  empty: { color: '#888', textAlign: 'center', marginTop: 40 },
  item: { flexDirection: 'row', alignItems: 'center', marginBottom: 18, backgroundColor: '#f8f9fa', borderRadius: 12, padding: 10, elevation: 1 },
  image: { width: 70, height: 70, borderRadius: 10, marginRight: 14, backgroundColor: '#eee' },
  name: { fontWeight: 'bold', fontSize: 16, color: '#222' },
  price: { color: '#e53935', fontWeight: 'bold', marginTop: 4 },
}); 