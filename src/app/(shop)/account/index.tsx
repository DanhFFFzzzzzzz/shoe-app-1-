import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../providers/auth-provider';

const defaultAvatar = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

type UserProfile = {
  id: string;
  email: string;
  name: string;
  gender: string;
  address: string;
  phone: string;
  avatar_url: string;
  [key: string]: any;
};

const AccountScreen = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      if (!error && data) {
        const d: any = data;
        setProfile({
          id: d.id,
          email: d.email,
          name: d.name || '',
          gender: d.gender || '',
          address: d.address || '',
          phone: d.phone || '',
          avatar_url: d.avatar_url || '',
        });
      } else {
        Alert.alert('Lỗi', 'Không thể lấy thông tin người dùng!');
      }
      setLoading(false);
    };
    if (user?.id) fetchProfile();
  }, [user?.id]);

  const handleAvatarChange = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled) {
      const file = result.assets[0];
      const fileExt = file.uri.split('.').pop();
      const fileName = `${user.id}.${fileExt}`;
      const response = await fetch(file.uri);
      const blob = await response.blob();
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob, { upsert: true });
      if (uploadError) {
        Alert.alert('Lỗi', 'Không thể upload ảnh đại diện!');
        return;
      }
      const { data: publicUrl } = supabase.storage.from('avatars').getPublicUrl(fileName);
      setProfile(p => p ? { ...p, avatar_url: publicUrl.publicUrl } : p);
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    const updates = {
      name: profile.name,
      gender: profile.gender,
      address: profile.address,
      phone: profile.phone,
      avatar_url: profile.avatar_url,
    };
    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id);
    setSaving(false);
    if (!error) {
      Alert.alert('Thành công', 'Cập nhật thông tin thành công!');
    } else {
      Alert.alert('Lỗi', 'Cập nhật thất bại!');
    }
  };

  if (loading || !profile) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" color="#0a3781" />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Thông tin cá nhân</Text>
      <View style={styles.avatarContainer}>
        <Image source={{ uri: profile.avatar_url || defaultAvatar }} style={styles.avatar} />
        <TouchableOpacity style={styles.cameraIcon} onPress={handleAvatarChange}>
          <FontAwesome name="camera" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      <View style={styles.formGroup}>
        <Text style={styles.label}>Tên:</Text>
        <TextInput style={styles.input} value={profile.name} onChangeText={v => setProfile(p => p ? { ...p, name: v } : p)} />
      </View>
      <View style={styles.formGroup}>
        <Text style={styles.label}>Email:</Text>
        <TextInput style={styles.input} value={profile.email} editable={false} />
      </View>
      <View style={styles.formGroup}>
        <Text style={styles.label}>Giới tính:</Text>
        <TextInput style={styles.input} value={profile.gender} onChangeText={v => setProfile(p => p ? { ...p, gender: v } : p)} />
      </View>
      <View style={styles.formGroup}>
        <Text style={styles.label}>Địa chỉ:</Text>
        <TextInput style={styles.input} value={profile.address} onChangeText={v => setProfile(p => p ? { ...p, address: v } : p)} />
      </View>
      <View style={styles.formGroup}>
        <Text style={styles.label}>Số điện thoại:</Text>
        <TextInput style={styles.input} value={profile.phone} onChangeText={v => setProfile(p => p ? { ...p, phone: v } : p)} keyboardType="phone-pad" />
      </View>
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          <Text style={styles.saveBtnText}>{saving ? 'Đang lưu...' : 'Lưu'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => {}}>
          <Text style={styles.cancelBtnText}>Hủy</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default AccountScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0a3781',
    marginBottom: 16,
    alignSelf: 'center',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#0a3781',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 120 / 2 - 20,
    backgroundColor: '#0a3781',
    borderRadius: 20,
    padding: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  formGroup: {
    marginBottom: 12,
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 8,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: '#0a3781',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginRight: 8,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#aaa',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginLeft: 8,
  },
  cancelBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 