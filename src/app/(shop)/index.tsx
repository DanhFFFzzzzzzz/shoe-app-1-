import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  View,
  Text,
} from 'react-native';
import React, { useCallback } from 'react';

import { PRODUCTS } from '../../../assets/products';
import { ProductListItem } from '../../components/product-list-item';
import { ListHeader } from '../../components/list-header';
import { getProductsAndCategories } from '../../api/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const Home = () => {
  const queryClient = useQueryClient();
  const { data, error, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['productsAndCategories'],
    queryFn: getProductsAndCategories,
  });

  const onRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['productsAndCategories'] });
  }, [queryClient]);

  if (isLoading) return <ActivityIndicator />;

  if (error || !data)
    return <Text>Error {error?.message || 'An error occured'}</Text>;

  return (
    <View>
      <FlatList
        data={data.products}
        renderItem={({ item }) => <ProductListItem product={item} />}
        keyExtractor={item => item.id.toString()}
        numColumns={2}
        ListHeaderComponent={<ListHeader categories={data.categories} />}
        contentContainerStyle={styles.flatListContent}
        columnWrapperStyle={styles.flatListColumn}
        style={{ paddingHorizontal: 10, paddingVertical: 5 }}
        refreshing={isFetching}
        onRefresh={onRefresh}
      />
    </View>
  );
};

export default Home;

const styles = StyleSheet.create({
  flatListContent: {
    paddingBottom: 20,
  },
  flatListColumn: {
    justifyContent: 'space-between',
  },
});