import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Pressable } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export const SearchBar = ({ onFilterPress }: { onFilterPress?: () => void }) => {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSearch = () => {
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Tìm kiếm"
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={handleSearch}
        returnKeyType="search"
      />
      <Pressable style={styles.iconContainer} onPress={handleSearch}>
        <FontAwesome name="search" size={20} color="#fff" />
      </Pressable>
      <Pressable style={styles.filterIconContainer} onPress={onFilterPress}>
        <FontAwesome name="filter" size={20} color="#ff5722" />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 6,
    margin: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 24,
    backgroundColor: 'transparent',
  },
  iconContainer: {
    backgroundColor: '#ff5722',
    borderRadius: 20,
    padding: 8,
    marginLeft: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterIconContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 8,
    marginLeft: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ff5722',
  },
}); 