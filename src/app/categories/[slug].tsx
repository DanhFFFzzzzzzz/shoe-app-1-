import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Redirect, Stack, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Tables } from '../../types/database.types';

import { ProductListItem } from '../../components/product-list-item';
import { getProductsAndCategories } from '../../api/api';

type ProductsAndCategories = {
  products: Tables<'product'>[];
  categories: Tables<'category'>[];
};

const Category = () => {
  const { slug } = useLocalSearchParams<{ slug: string }>();

  const { data, error, isLoading } = useQuery<ProductsAndCategories>({
    queryKey: ['productsAndCategories'],
    queryFn: getProductsAndCategories,
  });

  if (isLoading) return <ActivityIndicator />;
  if (error || !data) return <Text>Error: {error?.message ?? String(error)}</Text>;

  const category = data.categories.find((cat: Tables<'category'>) => cat.slug === slug);
  if (!category) return <Redirect href='/404' />;

  const products = data.products.filter((product: Tables<'product'>) => product.category === category.id);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: category.name }} />
      <Image source={{ uri: category.imageUrl }} style={styles.categoryImage} />
      <Text style={styles.categoryName}>{category.name}</Text>
      <FlatList
        data={products}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => <ProductListItem product={item} />}
        numColumns={2}
        columnWrapperStyle={styles.productRow}
        contentContainerStyle={styles.productsList}
      />
    </View>
  );
};

export default Category;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  categoryImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
    borderRadius: 8,
    marginBottom: 16,
  },
  categoryName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  productsList: {
    flexGrow: 1,
  },
  productRow: {
    justifyContent: 'space-between',
  },
  productContainer: {
    flex: 1,
    margin: 8,
  },
  productImage: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
    borderRadius: 8,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
  },
  productPrice: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
});