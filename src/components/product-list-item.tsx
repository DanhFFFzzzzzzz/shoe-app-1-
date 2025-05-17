import { Image, StyleSheet, Text, View, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { Tables } from '../types/database.types';

type ProductListItemProps = {
  product: Tables<'product'>;
  cardWidth?: number;
};

export const ProductListItem = ({ product, cardWidth = 170 }: ProductListItemProps) => {
  return (
    <Link asChild href={`/product/${product.slug}`}>
      <Pressable style={[styles.item, { width: cardWidth }]}> 
        <View style={[styles.container, { width: cardWidth }]}> 
          <Image
            source={{ uri: product.heroImage }}
            style={styles.image}
            resizeMode="cover"
          />
          <Text style={styles.title} numberOfLines={2}>{product.title}</Text>
          <Text style={styles.price}>
            {product.price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 })}
          </Text>
        </View>
      </Pressable>
    </Link>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    alignItems: 'center',
    marginBottom: 10,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  item: {
    marginHorizontal: 5,
    marginBottom: 10,
  },
  image: {
    width: '100%',
    height: 110,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: '#f2f2f2',
  },
  title: {
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#222',
    marginBottom: 4,
  },
  price: {
    fontSize: 14,
    color: '#1976d2',
    fontWeight: 'bold',
    marginBottom: 2,
  },
});
