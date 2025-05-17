import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { productApi } from '../../api/product';
import { Tables } from '../../types/database.types';

type ProductRecommendationsProps = {
  currentProductId: number;
};

export const ProductRecommendations = ({ currentProductId }: ProductRecommendationsProps) => {
  const [recommendations, setRecommendations] = useState<Tables<'product'>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        // Lấy danh sách tên sản phẩm gợi ý
        const recommendedTitles = await productApi.getProductRecommendations(currentProductId);
        // Lấy tất cả sản phẩm từ Supabase
        const allProducts = await productApi.getAllProducts();
        // Map tên sang sản phẩm chi tiết, chỉ lấy sản phẩm hợp lệ
        const recommendedProducts = allProducts
          .filter(
            (p: any) =>
              recommendedTitles.includes(p.title) &&
              p &&
              p.id !== undefined &&
              p.slug &&
              p.heroImage
          );
        setRecommendations(recommendedProducts);
      } catch (error) {
        console.error('Error fetching recommendations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [currentProductId]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Đang tải gợi ý...</Text>
      </View>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sản phẩm gợi ý</Text>
      <FlatList
        data={recommendations}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => (item && item.id !== undefined ? item.id.toString() : Math.random().toString())}
        renderItem={({ item }) =>
          item ? (
            <Link asChild href={`/product/${item.slug}`}>
              <Pressable style={styles.recommendationItem}>
                <Image source={{ uri: item.heroImage }} style={styles.image} />
                <Text style={styles.recommendationTitle} numberOfLines={2}>
                  {item.title}
                </Text>
              </Pressable>
            </Link>
          ) : null
        }
        contentContainerStyle={styles.recommendationsList}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  recommendationsList: {
    paddingVertical: 8,
  },
  recommendationItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginRight: 12,
    width: 140,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#eee',
  },
  recommendationTitle: {
    fontSize: 14,
    color: '#495057',
    textAlign: 'center',
  },
}); 