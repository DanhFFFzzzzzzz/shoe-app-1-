import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface QuantitySelectorProps {
  quantity: number;
  maxQuantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
}

export const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  quantity,
  maxQuantity,
  onIncrease,
  onDecrease,
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, quantity <= 1 && styles.disabledButton]}
        onPress={onDecrease}
        disabled={quantity <= 1}
      >
        <Text style={styles.buttonText}>-</Text>
      </TouchableOpacity>
      <Text style={styles.quantity}>{quantity}</Text>
      <TouchableOpacity
        style={[styles.button, quantity >= maxQuantity && styles.disabledButton]}
        onPress={onIncrease}
        disabled={quantity >= maxQuantity}
      >
        <Text style={styles.buttonText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007bff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007bff',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  quantity: {
    fontSize: 18,
    fontWeight: 'bold',
    minWidth: 24,
    textAlign: 'center',
    color: '#222',
  },
  disabledButton: {
    opacity: 0.5,
  },
}); 