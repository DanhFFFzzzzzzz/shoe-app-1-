import { Image, StyleSheet, Text, View, Dimensions, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { Tables } from '../types/database.types';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 30) / 2; 
// (width - tổng margin ngang) / 2 (vì 2 cột)

type ProductListItemProps = {
  product: Tables<'product'>;
};

export const ProductListItem = ({ product }: ProductListItemProps) => {
  return (
    <Link asChild href={`/product/${product.slug}`}>
      <Pressable style={styles.item}>
        <View style={styles.container}>
          <Image
            source={{ uri: product.heroImage }}
            style={styles.image}
            resizeMode="cover"
          />
          <Text style={styles.title}>{product.title}</Text>
          <Text style={styles.price}>${product.price.toFixed(2)}</Text>
        </View>
      </Pressable>
    </Link>
  );
};

const styles = StyleSheet.create({
  container: {
    width: ITEM_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    alignItems: 'center',
    marginBottom: 15,
  },
  item: {
    marginHorizontal: 5,
  },
  image: {
    width: '100%',
    height: 150,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
  },
  price: {
    fontSize: 14,
    color: 'gray',
    marginVertical: 8,
  },
});
