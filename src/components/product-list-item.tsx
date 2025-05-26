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
        <View style={[styles.card, { width: cardWidth }]}> 
          <View style={styles.imageBox}>
            <Image
              source={{ uri: product.heroImage }}
              style={styles.image}
              resizeMode="cover"
            />
          </View>
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
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    alignItems: 'center',
    marginRight: 14,
    padding: 10,
    width: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 8,
  },
  imageBox: {
    width: 110,
    height: 110,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#f2f2f2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    borderRadius: 14,
  },
  title: {
    fontSize: 15,
    color: '#222',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
    minHeight: 38,
  },
  price: {
    fontSize: 15,
    color: '#1976d2',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 2,
  },
  item: {
    marginHorizontal: 5,
    marginBottom: 10,
  },
});
