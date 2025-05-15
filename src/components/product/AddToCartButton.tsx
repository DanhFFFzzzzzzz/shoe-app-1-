import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface AddToCartButtonProps {
  onPress: () => void;
  disabled: boolean;
}

export const AddToCartButton: React.FC<AddToCartButtonProps> = ({
  onPress,
  disabled,
}) => {
  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.disabledButton]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.text}>Thêm vào giỏ hàng</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flex: 1,
    backgroundColor: '#28a745',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    shadowColor: '#28a745',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  text: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  disabledButton: {
    backgroundColor: '#b7e1c6',
    opacity: 0.7,
  },
}); 