import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator, ScrollView, Pressable, Modal } from 'react-native';
import { FontAwesome, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'expo-router';
import NetInfo from '@react-native-community/netinfo';

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

type MenuItemProps = {
  icon: React.ReactNode;
  label: string;
  last: boolean;
  onPress?: () => void;
};
// Hàm lấy thông tin người dùng
const AccountScreen = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changing, setChanging] = useState(false);
  const router = useRouter();

  // Lây thông tin người dùng từ Supabase
  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !user.id) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Lỗi lấy thông tin user:', error);
        Alert.alert('Lỗi', 'Không thể lấy thông tin người dùng!');
        setProfile(null);
      } else if (data) {
        setProfile({
          id: data.id,
          email: data.email,
          name: data.name || '',
          gender: data.gender || '',
          address: data.address || '',
          phone: data.phone || '',
          avatar_url: data.avatar_url || '',
        });
      }
    } catch (error) {
      console.error('Lỗi fetch profile:', error);
      Alert.alert('Lỗi', 'Không thể lấy thông tin người dùng!');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };
// Gọi hàm lấy thông tin người dùng khi component được render
  useEffect(() => {
    fetchProfile();
  }, []);
 // Lắng nghe sự thay đổi trạng thái đăng nhập
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        fetchProfile();
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);
// Hàm thay đổi ảnh đại diện
  const handleAvatarChange = async () => {
    try {
      // Check network connection
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        Alert.alert('Lỗi', 'Không có kết nối mạng. Vui lòng kiểm tra lại kết nối của bạn.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });
      if (!result.canceled && profile?.id) {
        const file = result.assets[0];
        const fileExt = file.uri.split('.').pop();
        const fileName = `${profile.id}.${fileExt}`;
        const response = await fetch(file.uri);
        const blob = await response.blob();
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, blob, { upsert: true });
        if (uploadError) {
          Alert.alert('Lỗi', 'Không thể tải lên ảnh đại diện!');
          return;
        }
        const { data: publicUrl } = supabase.storage.from('avatars').getPublicUrl(fileName);
        setProfile(p => p ? { ...p, avatar_url: publicUrl.publicUrl } : p);
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi thay đổi ảnh đại diện!');
    }
  };
// Hàm lưu thông tin người dùng
  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      // Check network connection
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        Alert.alert('Lỗi', 'Không có kết nối mạng. Vui lòng kiểm tra lại kết nối của bạn.');
        setSaving(false);
        return;
      }

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
        .eq('id', profile.id);
      
      if (!error) {
        Alert.alert('Thành công', 'Cập nhật thông tin thành công!');
        setIsEditing(false);
      } else {
        Alert.alert('Lỗi', 'Cập nhật thông tin thất bại!');
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi cập nhật thông tin!');
    } finally {
      setSaving(false);
    }
  };
  // Hàm đăng xuất
  const handleLogout = async () => {
    try {
      // Check network connection
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        Alert.alert('Lỗi', 'Không có kết nối mạng. Vui lòng kiểm tra lại kết nối của bạn.');
        return;
      }

      const { error } = await supabase.auth.signOut();
      if (error) {
        Alert.alert('Lỗi', 'Không thể đăng xuất!');
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi đăng xuất!');
    }
  };
// Hàm đổi mật khẩu
  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin!');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu mới không khớp!');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu mới phải có ít nhất 6 ký tự!');
      return;
    }

    setChanging(true);
    try {
      // Check network connection
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        Alert.alert('Lỗi', 'Không có kết nối mạng. Vui lòng kiểm tra lại kết nối của bạn.');
        setChanging(false);
        return;
      }

      // Verify old password first
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: profile?.email || '',
        password: oldPassword,
      });

      if (signInError) {
        Alert.alert('Lỗi', 'Mật khẩu cũ không đúng!');
        setChanging(false);
        return;
      }

      // Update password
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      
      if (!error) {
        Alert.alert('Thành công', 'Đổi mật khẩu thành công!');
        setShowChangePassword(false);
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        Alert.alert('Lỗi', error.message || 'Đổi mật khẩu thất bại!');
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi đổi mật khẩu!');
    } finally {
      setChanging(false);
    }
  };

  if (loading || !profile) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" color="#1976d2" />;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileBox}>
        <Image source={{ uri: profile.avatar_url || defaultAvatar }} style={styles.avatar} />
        <TouchableOpacity style={styles.cameraIcon} onPress={handleAvatarChange}>
          <FontAwesome name="camera" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.name}>{profile.name}</Text>
        <Text style={styles.email}>{profile.email}</Text>
      </View>

      {isEditing ? (
        <View style={styles.editBox}>
      <View style={styles.formGroup}>
            <Text style={styles.label}>Họ và tên:</Text>
        <TextInput style={styles.input} value={profile.name} onChangeText={v => setProfile(p => p ? { ...p, name: v } : p)} />
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
              <Text style={styles.saveBtnText}>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</Text>
        </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsEditing(false)}>
              <Text style={styles.cancelBtnText}>Hủy bỏ</Text>
        </TouchableOpacity>
      </View>
    </View>
      ) : (
        <View style={styles.menuBox}>
          <MenuItem 
            icon={<MaterialIcons name="edit" size={22} color="#1976d2" />} 
            label="Chỉnh sửa thông tin" 
            last={false}
            onPress={() => setIsEditing(true)}
          />
          <MenuItem 
            icon={<MaterialIcons name="shopping-bag" size={22} color="#1976d2" />} 
            label="Đơn hàng của tôi" 
            last={false}
            onPress={() => router.replace('/orders')}
          />
          <MenuItem 
            icon={<MaterialIcons name="favorite" size={22} color="#e53935" />} 
            label="Danh sách yêu thích" 
            last={false}
            onPress={() => router.push('/favorite-products')}
          />
          <MenuItem 
            icon={<FontAwesome5 name="user-lock" size={20} color="#1976d2" />} 
            label="Đổi mật khẩu" 
            last={false}
            onPress={() => setShowChangePassword(true)}
          />
          <MenuItem 
            icon={<MaterialIcons name="logout" size={22} color="#e53935" />} 
            label="Đăng xuất" 
            last={true}
            onPress={handleLogout}
          />
        </View>
      )}
      <Modal visible={showChangePassword} transparent animationType="slide">
        <View style={{ flex:1, backgroundColor:'rgba(0,0,0,0.3)', justifyContent:'center', alignItems:'center' }}>
          <View style={{ backgroundColor:'#fff', borderRadius:12, padding:24, width:'85%' }}>
            <Text style={{ fontSize:18, fontWeight:'bold', marginBottom:16 }}>Đổi mật khẩu</Text>
            <TextInput
              placeholder="Mật khẩu cũ"
              secureTextEntry
              style={styles.input}
              value={oldPassword}
              onChangeText={setOldPassword}
            />
            <TextInput
              placeholder="Mật khẩu mới"
              secureTextEntry
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <TextInput
              placeholder="Xác nhận mật khẩu mới"
              secureTextEntry
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            <View style={{ flexDirection:'row', marginTop:18 }}>
              <TouchableOpacity style={[styles.saveBtn, { flex:1 }]} onPress={handleChangePassword} disabled={changing}>
                <Text style={styles.saveBtnText}>{changing ? 'Đang đổi...' : 'Đổi mật khẩu'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.cancelBtn, { flex:1, marginLeft:8 }]} onPress={() => {
                setShowChangePassword(false);
                setOldPassword('');
                setNewPassword('');
                setConfirmPassword('');
              }}>
                <Text style={styles.cancelBtnText}>Hủy</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const MenuItem = ({ icon, label, last, onPress }: MenuItemProps) => (
  <Pressable style={[styles.menuItem, last && { borderBottomWidth: 0 }]} onPress={onPress}>
    <View style={styles.menuIcon}>{icon}</View>
    <Text style={styles.menuLabel}>{label}</Text>
    <MaterialIcons name="keyboard-arrow-right" size={22} color="#bdbdbd" />
  </Pressable>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  profileBox: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#1976d2',
  },
  cameraIcon: {
    position: 'absolute',
    top: 32 + 45 - 20,
    right: '50%',
    marginRight: -45,
    backgroundColor: '#1976d2',
    borderRadius: 20,
    padding: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 4,
  },
  email: {
    fontSize: 15,
    color: '#888',
    marginBottom: 2,
  },
  menuBox: {
    backgroundColor: '#fff',
    borderRadius: 18,
    marginHorizontal: 16,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
  },
  menuIcon: {
    marginRight: 16,
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    color: '#222',
    fontWeight: '500',
  },
  editBox: {
    backgroundColor: '#fff',
    borderRadius: 18,
    marginHorizontal: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#222',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
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
    backgroundColor: '#1976d2',
    padding: 14,
    borderRadius: 8,
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
    backgroundColor: '#e0e0e0',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
  },
  cancelBtnText: {
    color: '#666',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 

export default AccountScreen; 