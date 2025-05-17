import React from 'react';
import { View, FlatList, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { getProductsAndCategories } from '../../../api/api';
import { useQuery } from '@tanstack/react-query';
import { ProductListItem } from '../../../components/product-list-item';
import { SearchBar } from '../../../components/search-bar';
import { ProductRecommendationsByKeyword } from '../../../components/product/ProductRecommendationsByKeyword';

const SearchResult = () => {
  const { q } = useLocalSearchParams();
  const { data, error, isLoading } = useQuery({
    queryKey: ['productsAndCategories'],
    queryFn: getProductsAndCategories,
  });

  if (isLoading) return <ActivityIndicator />;
  if (error || !data) return <Text>Error {error?.message || 'An error occured'}</Text>;

  // Đảm bảo data.products tồn tại và là mảng
  const products = Array.isArray((data as any).products) ? (data as any).products : [];
  const filteredProducts = products.filter((p: any) =>
    p.title.toLowerCase().includes((q || '').toString().toLowerCase())
  );

  return (
    <View style={{ flex: 1 }}>
      <SearchBar />
      {q ? <Text style={styles.title}>Kết quả cho: "{q}"</Text> : null}
      {q ? <ProductRecommendationsByKeyword keyword={q.toString()} /> : null}
      <FlatList
        data={filteredProducts}
        renderItem={({ item }) => <ProductListItem product={item} />}
        keyExtractor={item => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.flatListContent}
        columnWrapperStyle={styles.flatListColumn}
        style={{ paddingHorizontal: 10, paddingVertical: 5 }}
      />
    </View>
  );
};

export default SearchResult;

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    margin: 16,
  },
  flatListContent: {
    paddingBottom: 20,
  },
  flatListColumn: {
    justifyContent: 'space-between',
  },
}); 