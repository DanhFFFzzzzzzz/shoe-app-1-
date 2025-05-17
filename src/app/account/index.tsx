import React from 'react';
import { View, Text, StyleSheet, Image, Pressable, ScrollView } from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';

const user = {
  name: 'Nguyễn Văn A',
  email: 'nguyenvana@gmail.com',
  avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
};

type MenuItemProps = {
  icon: React.ReactNode;
  label: string;
  last: boolean;
};

const AccountScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileBox}>
        <Image source={{ uri: user.avatar }} style={styles.avatar} />
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.email}>{user.email}</Text>
      </View>
      <View style={styles.menuBox}>
        <MenuItem icon={<MaterialIcons name="shopping-bag" size={22} color="#1976d2" />} label="Đơn hàng của tôi" last={false} />
        <MenuItem icon={<MaterialIcons name="location-on" size={22} color="#1976d2" />} label="Địa chỉ giao hàng" last={false} />
        <MenuItem icon={<FontAwesome5 name="user-lock" size={20} color="#1976d2" />} label="Đổi mật khẩu" last={false} />
        <MenuItem icon={<MaterialIcons name="logout" size={22} color="#e53935" />} label="Đăng xuất" last={true} />
      </View>
    </ScrollView>
  );
};

const MenuItem = ({ icon, label, last }: MenuItemProps) => (
  <Pressable style={[styles.menuItem, last && { borderBottomWidth: 0 }]}> 
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
});

export default AccountScreen; 