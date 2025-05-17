import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { productApi } from '../../api/product';
import { Tables } from '../../types/database.types';

interface ProductRecommendationsByKeywordProps {
  keyword: string;
}

export const ProductRecommendationsByKeyword = ({ keyword }: ProductRecommendationsByKeywordProps) => {
  const [recommendations, setRecommendations] = useState<Tables<'product'>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        // Lấy tất cả sản phẩm từ Supabase
        const allProducts = await productApi.getAllProducts();
        // Lọc sản phẩm liên quan đến từ khóa (tìm trong title, description)
        const keywordLower = keyword.toLowerCase();
        const recommendedProducts = allProducts
          .filter(
            (p: any) =>
              (p.title && p.title.toLowerCase().includes(keywordLower)) ||
              (p.description && p.description.toLowerCase().includes(keywordLower))
          )
          .slice(0, 10); // Giới hạn 10 sản phẩm gợi ý
        setRecommendations(recommendedProducts);
      } catch (error) {
        console.error('Error fetching recommendations by keyword:', error);
      } finally {
        setLoading(false);
      }
    };
    if (keyword && keyword.length > 0) {
      fetchRecommendations();
    } else {
      setRecommendations([]);
      setLoading(false);
    }
  }, [keyword]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Đang tải gợi ý...</Text>
      </View>
    );
  }

  if (!keyword || recommendations.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Có thể bạn quan tâm</Text>
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
    marginTop: 18,
    marginBottom: 8,
    paddingHorizontal: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#222',
    letterSpacing: 0.2,
  },
  recommendationsList: {
    paddingVertical: 6,
  },
  recommendationItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    marginRight: 14,
    width: 120,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  image: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginBottom: 7,
    backgroundColor: '#f2f2f2',
  },
  recommendationTitle: {
    fontSize: 13,
    color: '#333',
    textAlign: 'center',
    fontWeight: '500',
    marginTop: 2,
  },
}); 