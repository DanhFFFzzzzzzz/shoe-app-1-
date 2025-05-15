import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Size {
  size: number;
  quantity: number;
}

interface SizeSelectorProps {
  sizes: Size[];
  selectedSize: number | null;
  onSelectSize: (size: number) => void;
  getAvailableQuantity: (size: number) => number;
  isSizeOutOfStock: (size: number) => boolean;
}

export const SizeSelector: React.FC<SizeSelectorProps> = ({
  sizes,
  selectedSize,
  onSelectSize,
  getAvailableQuantity,
  isSizeOutOfStock,
}) => {
  return (
    <View style={styles.sizeContainer}>
      <Text style={styles.sizeTitle}>Chọn size:</Text>
      <View style={styles.sizeList}>
        {sizes.length > 0 ? (
          sizes.map((s) => {
            const isOutOfStock = isSizeOutOfStock(s.size);
            const availableQuantity = getAvailableQuantity(s.size);
            return (
              <TouchableOpacity
                key={s.size}
                style={[
                  styles.sizeButton,
                  selectedSize === s.size && styles.selectedSizeButton,
                  isOutOfStock && styles.disabledSizeButton,
                ]}
                onPress={() => {
                  if (!isOutOfStock) {
                    onSelectSize(s.size);
                  }
                }}
                disabled={isOutOfStock}
              >
                <Text
                  style={[
                    styles.sizeText,
                    selectedSize === s.size && styles.selectedSizeText,
                    isOutOfStock && styles.disabledSizeText,
                  ]}
                >
                  {s.size}
                </Text>
                <Text style={[
                  styles.quantityText,
                  isOutOfStock && styles.outOfStockText
                ]}>
                  {isOutOfStock ? 'Hết hàng' : `Còn ${availableQuantity}`}
                </Text>
              </TouchableOpacity>
            );
          })
        ) : (
          <Text style={{ color: 'red' }}>Không có size nào khả dụng</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sizeContainer: {
    marginBottom: 18,
  },
  sizeTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#222',
  },
  sizeList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  sizeButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f4fa',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    marginBottom: 8,
  },
  selectedSizeButton: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
    shadowColor: '#007bff',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  disabledSizeButton: {
    backgroundColor: '#eee',
    borderColor: '#ddd',
    opacity: 0.5,
  },
  sizeText: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },
  selectedSizeText: {
    color: '#fff',
  },
  disabledSizeText: {
    color: '#aaa',
  },
  quantityText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  outOfStockText: {
    color: '#dc3545',
  },
}); 