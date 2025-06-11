import React, { useState } from 'react';
import { View, FlatList, StyleSheet, Text, ActivityIndicator, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { getProductsAndCategories } from '../../../api/api';
import { useQuery } from '@tanstack/react-query';
import { ProductListItem } from '../../../components/product-list-item';
import { SearchBar } from '../../../components/search-bar';
import { ProductRecommendationsByKeyword } from '../../../components/product/ProductRecommendationsByKeyword';

const priceRanges = [
  { min: 0, max: 500000, label: 'Dưới 500.000₫' },
  { min: 500000, max: 1000000, label: '500.000₫ – 1.000.000₫' },
  { min: 1000000, max: 2000000, label: '1.000.000₫ – 2.000.000₫' },
  { min: 2000000, max: 5000000, label: '2.000.000₫ – 5.000.000₫' },
];

const SearchResult = () => {
  const { q } = useLocalSearchParams();
  const { data, error, isLoading } = useQuery({
    queryKey: ['productsAndCategories'],
    queryFn: getProductsAndCategories,
  });

  // State filter thực sự áp dụng
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedPrice, setSelectedPrice] = useState<number | null>(null);

  // State filter tạm thời trong modal
  const [pendingCategory, setPendingCategory] = useState<number | null>(null);
  const [pendingPrice, setPendingPrice] = useState<number | null>(null);

  const [showFilter, setShowFilter] = useState(false);

  // Khi mở modal, đồng bộ filter tạm thời với filter thực tế
  const openFilter = () => {
    setPendingCategory(selectedCategory);
    setPendingPrice(selectedPrice);
    setShowFilter(true);
  };

  if (isLoading) return <ActivityIndicator />;
  if (error || !data) return <Text>Error {error?.message || 'An error occured'}</Text>;

  const products = Array.isArray((data as any).products) ? (data as any).products : [];
  const categories = Array.isArray((data as any).categories) ? (data as any).categories : [];

  // Lọc theo search, category, price
  let filteredProducts = products.filter((p: any) =>
    p.title.toLowerCase().includes((q || '').toString().toLowerCase())
  );
  if (selectedCategory) {
    filteredProducts = filteredProducts.filter((p: any) => Number(p.category) === Number(selectedCategory));
  }
  if (selectedPrice !== null) {
    const { min, max } = priceRanges[selectedPrice];
    filteredProducts = filteredProducts.filter((p: any) => p.price >= min && p.price <= max);
  }

  return (
    <View style={{ flex: 1 }}>
      <SearchBar onFilterPress={openFilter} />
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
      {/* Modal filter */}
      <Modal visible={showFilter} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.filterTitle}>Lọc sản phẩm</Text>
            {/* Danh mục */}
            <Text style={styles.filterLabel}>Danh mục</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {categories.map((cat: any) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryButton,
                    pendingCategory === cat.id && styles.categoryButtonActive
                  ]}
                  onPress={() => setPendingCategory(pendingCategory === cat.id ? null : cat.id)}
                >
                  <Text style={pendingCategory === cat.id ? styles.categoryTextActive : {}}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {/* Giá */}
            <Text style={styles.filterLabel}>Khoảng giá</Text>
            {priceRanges.map((range, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.priceOption}
                onPress={() => setPendingPrice(pendingPrice === idx ? null : idx)}
              >
                <Text style={pendingPrice === idx ? styles.priceActive : {}}>
                  {range.label}
                </Text>
              </TouchableOpacity>
            ))}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
              <TouchableOpacity
                style={styles.applyBtn}
                onPress={() => {
                  setSelectedCategory(pendingCategory);
                  setSelectedPrice(pendingPrice);
                  setShowFilter(false);
                }}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Áp dụng</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.clearBtn}
                onPress={() => {
                  setPendingCategory(null);
                  setPendingPrice(null);
                  setSelectedCategory(null);
                  setSelectedPrice(null);
                  setShowFilter(false);
                }}
              >
                <Text style={{ color: '#ff5722', fontWeight: 'bold' }}>Xóa lọc</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowFilter(false)}>
              <Text style={{ color: '#888' }}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  filterLabel: {
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  categoryButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f2f2f2',
    marginRight: 8,
  },
  categoryButtonActive: {
    backgroundColor: '#ff5722',
  },
  categoryTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  priceOption: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  priceActive: {
    color: '#ff5722',
    fontWeight: 'bold',
  },
  applyBtn: {
    backgroundColor: '#ff5722',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  clearBtn: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ff5722',
    paddingVertical: 10,
    paddingHorizontal: 24,
    marginLeft: 8,
  },
  closeBtn: {
    marginTop: 10,
    alignSelf: 'center',
  },
}); 