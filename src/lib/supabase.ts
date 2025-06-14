import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as aesjs from 'aes-js';
import 'react-native-get-random-values';
import { Database } from '../types/database.types';
import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

const supabaseUrl = "https://alzndhssbtncurvytlqe.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsem5kaHNzYnRuY3Vydnl0bHFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU5NDQ5NjcsImV4cCI6MjA2MTUyMDk2N30.2JUUiNeIZ7-ZNpcwyHxvQV52b9rw-f1i3YFZw_43FIg";

// As Expo's SecureStore does not support values larger than 2048
// bytes, an AES-256 key is generated and stored in SecureStore, while
// it is used to encrypt/decrypt values stored in AsyncStorage.
class LargeSecureStore {
  // Lưu trữ phiên an toàn bằng sử dụng SecureStore và AsyncStorage
  private async _encrypt(key: string, value: string) {
    const encryptionKey = crypto.getRandomValues(new Uint8Array(256 / 8));

    const cipher = new aesjs.ModeOfOperation.ctr(
      encryptionKey,
      new aesjs.Counter(1)
    );
    const encryptedBytes = cipher.encrypt(aesjs.utils.utf8.toBytes(value));

    await SecureStore.setItemAsync(
      key,
      aesjs.utils.hex.fromBytes(encryptionKey)
    );

    return aesjs.utils.hex.fromBytes(encryptedBytes);
  }

  private async _decrypt(key: string, value: string) {
    const encryptionKeyHex = await SecureStore.getItemAsync(key);
    if (!encryptionKeyHex) {
      return encryptionKeyHex;
    }

    const cipher = new aesjs.ModeOfOperation.ctr(
      aesjs.utils.hex.toBytes(encryptionKeyHex),
      new aesjs.Counter(1)
    );
    const decryptedBytes = cipher.decrypt(aesjs.utils.hex.toBytes(value));

    return aesjs.utils.utf8.fromBytes(decryptedBytes);
  }

  async getItem(key: string) {
    const encrypted = await AsyncStorage.getItem(key);
    if (!encrypted) {
      return encrypted;
    }

    return await this._decrypt(key, encrypted);
  }

  async removeItem(key: string) {
    await AsyncStorage.removeItem(key);
    await SecureStore.deleteItemAsync(key);
  }

  async setItem(key: string, value: string) {
    const encrypted = await this._encrypt(key, value);
    await AsyncStorage.setItem(key, encrypted);
  }
}

// Create Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: new LargeSecureStore(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
    },
  },
});

// Hook to check network connection
export const useNetworkStatus = () => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
    });

    // Initial check
    NetInfo.fetch().then(state => {
      setIsConnected(state.isConnected);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return isConnected;
};

// Hook to handle Supabase operations with network check
export const useSupabase = () => {
  const isConnected = useNetworkStatus();

  const executeWithNetworkCheck = async <T>(
    operation: () => Promise<T>,
    errorMessage: string = 'Không có kết nối mạng. Vui lòng kiểm tra lại kết nối của bạn.'
  ): Promise<T> => {
    if (!isConnected) {
      throw new Error(errorMessage);
    }
    return operation();
  };

  return {
    supabase,
    executeWithNetworkCheck,
    isConnected,
  };
};

// Helper function to check network before making requests
export const checkNetworkAndExecute = async <T>(
  operation: () => Promise<T>,
  errorMessage: string = 'Không có kết nối mạng. Vui lòng kiểm tra lại kết nối của bạn.'
): Promise<T> => {
  const netInfo = await NetInfo.fetch();
  if (!netInfo.isConnected) {
    throw new Error(errorMessage);
  }
  return operation();
};

// Helper function to wrap Supabase queries with network check
export const withNetworkCheck = async <T>(
  query: () => Promise<T>,
  errorMessage?: string
): Promise<T> => {
  return checkNetworkAndExecute(query, errorMessage);
};