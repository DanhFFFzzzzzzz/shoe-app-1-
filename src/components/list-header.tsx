import { Link } from 'expo-router';
import {
  FlatList,
  GestureResponderEvent,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useCartStore } from '../store/cart-store';
import { supabase } from '../lib/supabase';
import { getProductsAndCategories } from '../api/api';
import { Tables } from '../types/database.types';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../providers/auth-provider';
import AsyncStorage from '@react-native-async-storage/async-storage';

const defaultAvatar = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

export const ListHeader = ({
  categories,
}: {
  categories: Tables<'category'>[];
}) => {
  const { getItemCount } = useCartStore();
  const { user } = useAuth();
  const [profile, setProfile] = useState<{ name: string; avatar_url: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentProducts, setRecentProducts] = useState<any[]>([]);

  useEffect(() => {
    if (!user || !user.id) {
      setProfile({ name: 'No Name', avatar_url: defaultAvatar });
      setLoading(false);
      return;
    }
    const fetchProfile = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('name, avatar_url')
        .eq('id', user.id)
        .single();
      if (!error && data) {
        setProfile({
          name: data.name || 'No Name',
          avatar_url: data.avatar_url || defaultAvatar,
        });
      } else {
        setProfile({ name: 'No Name', avatar_url: defaultAvatar });
      }
      setLoading(false);
    };
    fetchProfile();

    // Lấy sản phẩm đã xem gần đây từ AsyncStorage
    const fetchRecent = async () => {
      try {
        const json = await AsyncStorage.getItem('recently_viewed');
        if (json) setRecentProducts(JSON.parse(json));
      } catch {}
    };
    fetchRecent();
  }, [user?.id]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <View style={[styles.headerContainer]}>
      <View style={styles.headerTop}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarContainer}>
            {loading ? (
              <ActivityIndicator size="small" color="#0a3781" />
            ) : (
              <>
                <Image
                  source={{ uri: profile?.avatar_url || defaultAvatar }}
                  style={styles.avatarImage}
                />
                <Text style={styles.avatarText}>{profile?.name || 'No Name'}</Text>
              </>
            )}
          </View>
        </View>
        
        <View style={styles.headerRight}>
          <Link style={styles.cartContainer} href='/cart' asChild>
            <Pressable>
              {({ pressed }) => (
                <View>
                  <FontAwesome
                    name='shopping-cart'
                    size={25}
                    color='gray'
                    style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                  />

                  <View style={styles.badgeContainer}>
                    <Text style={styles.badgeText}>{getItemCount()}</Text>
                  </View>
                </View>
              )}
            </Pressable>
          </Link>
          <TouchableOpacity
            onPress={handleSignOut}
            style={styles.signOutButton}
          >
            <FontAwesome name='sign-out' size={25} color='red' />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.heroContainer}>
        <Image
          source={require('../../assets/images/hero.png')}
          style={styles.heroImage}
        />
        <View style={styles.bannerTextBox}>
          <Text style={styles.bannerTitle}>Shoe Discount Sale</Text>
          <Text style={styles.bannerSubtitle}>Hurry for 25% Discounts on all shoes!</Text>
        </View>
      </View>

      {/* Recently viewed section */}
      {recentProducts.length > 0 && (
        <View style={styles.recentSection}>
          <Text style={styles.recentTitle}>Đã xem gần đây</Text>
          <FlatList
            data={recentProducts}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => (
              <Link asChild href={`/product/${item.slug}`}>
                <Pressable style={styles.recentItem}>
                  <Image source={{ uri: item.heroImage }} style={styles.recentImage} />
                  <Text style={styles.recentName} numberOfLines={1}>{item.title}</Text>
                </Pressable>
              </Link>
            )}
            contentContainerStyle={styles.recentList}
          />
        </View>
      )}

      <View style={styles.categoriesContainer}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <FlatList
          data={categories}
          renderItem={({ item }) => (
            <Link asChild href={`/categories/${item.slug}`}>
              <Pressable style={styles.category}>
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.categoryImage}
                />
                <Text style={styles.categoryText}>{item.name}</Text>
              </Pressable>
            </Link>
          )}
          keyExtractor={item => item.name}
          horizontal
          showsHorizontalScrollIndicator={false}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    gap: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  cartContainer: {
    position: 'relative',
  },
  signOutButton: {
    padding: 5,
  },
  heroContainer: {
    width: '100%',
    height: 200,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    borderRadius: 20,
  },
  categoriesContainer: {
    paddingHorizontal: 10,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  category: {
    width: 100,
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  badgeContainer: {
    position: 'absolute',
    top: -5,
    right: 10,
    backgroundColor: '#1BC464',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  bannerTextBox: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  bannerSubtitle: {
    fontSize: 16,
    color: 'white',
  },
  recentSection: {
    padding: 10,
  },
  recentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  recentItem: {
    width: 100,
    alignItems: 'center',
    marginRight: 10,
  },
  recentImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 5,
  },
  recentName: {
    fontSize: 14,
    fontWeight: '500',
  },
  recentList: {
    paddingHorizontal: 10,
  },
});
