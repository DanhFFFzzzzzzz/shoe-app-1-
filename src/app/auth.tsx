import React from 'react';
import {View, Text, ImageBackground, TextInput, TouchableOpacity, Image, StyleSheet} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import * as zod from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Redirect, Stack } from 'expo-router';
import { supabase } from '../lib/supabase';
import { Toast } from 'react-native-toast-notifications';
import { useAuth } from '../providers/auth-provider';

// Xác định schema cho các form đăng nhập và đăng ký
const signInSchema = zod.object({
    email: zod.string().email({message: 'Địa chỉ email không hợp lệ'}),
    password: zod.string().min(6, {message: 'Password phải ít nhất 6 ký tự'}),
});
const signUpSchema = zod.object({
    name: zod.string().min(2, {message: 'Vui lòng nhập tên'}),
    email: zod.string().email({message: 'Địa chỉ email không hợp lệ'}),
    password: zod.string().min(6, {message: 'Password phải ít nhất 6 ký tự'}),
    gender: zod.string().min(1, {message: 'Vui lòng nhập giới tính'}),
    address: zod.string().min(2, {message: 'Vui lòng nhập địa chỉ'}),
    phone: zod.string().min(8, {message: 'Vui lòng nhập số điện thoại'}),
});

export default function Auth(){
  const {session} = useAuth();
  if(session) return <Redirect href = '/' />;

  const [isSignUp, setIsSignUp] = useState(false);

  // Định nghĩa type cho từng form
  type SignInForm = zod.infer<typeof signInSchema>;
  type SignUpForm = zod.infer<typeof signUpSchema>;

  const signInForm = useForm<SignInForm>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });
  const signUpForm = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      gender: '',
      address: '',
      phone: '',
    },
  });

  const signIn = async (data: SignInForm) => {
    // Gọi API đăng nhập của Supabase
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    if (error) {
      alert(error.message);
    } else {
      Toast.show('Đăng nhập thành công', {
        type: 'success',
        placement: 'top',
        duration: 1500,
      });
    }
  };
  const signUp = async (data: SignUpForm) => {
    const { data: signUpData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.name,
          gender: data.gender,
          address: data.address,
          phone: data.phone,
        }
      }
    });
    if (error) {
      alert(error.message);
    } else if (signUpData?.user?.id) {
      // Đăng ký thành công, lưu thông tin người dùng vào bảng profile
      Toast.show('Signed up successfully', {
        type: 'success',
        placement: 'top',
        duration: 1500,
      });
      setIsSignUp(false);
      setTimeout(() => {
        signUpForm.reset();
      }, 0);
    }
  };

  // Đảm bảo reset form khi chuyển chế độ
  const handleSwitchMode = () => {
    setIsSignUp((prev) => {
      const next = !prev;
      setTimeout(() => {
        if (next) {
          // Chuyển sang Sign Up => reset Sign In form
          signInForm.reset();
        } else {
          // Chuyển sang Sign In => reset Sign Up form
          signUpForm.reset();
        }
      }, 0);
      return next;
    });
  };

  return (
    <ImageBackground
      source={{
        uri: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
      }}
      style={styles.backgroundImage}
    >
      <View style={[styles.overlay, { pointerEvents: 'none' }]} />
      <View style={styles.container}>
        <View style={styles.formContainer}>
          <View style={styles.logoContainer}>
            <Image 
              source={{uri: 'https://static.vecteezy.com/system/resources/previews/029/607/055/non_2x/men-s-shoe-logo-template-design-for-running-or-sport-logo-for-shoe-shop-fashion-and-business-free-vector.jpg'}}
              style={styles.logo}
            />
            <Text style={styles.title}>Shoe Shop</Text>
          </View>
          
          <Text style={styles.subtitle}>{isSignUp ? 'Tạo tài khoản mới' : 'Chào mừng quay lại'}</Text>

          {!isSignUp ? (
            <View key="sign-in" style={styles.form}>
              <Controller
                control={signInForm.control}
                name='email'
                render={({
                  field: { value, onChange, onBlur },
                  fieldState: { error },
                }) => (
                  <View style={styles.inputContainer}>
                    <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
                    <TextInput
                      placeholder='Email'
                      style={styles.input}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholderTextColor='#666'
                      autoCapitalize='none'
                      editable={!signInForm.formState.isSubmitting}
                    />
                    {error && <Text style={styles.error}>{error.message}</Text>}
                  </View>
                )}
              />
              <Controller
                control={signInForm.control}
                name='password'
                render={({
                  field: { value, onChange, onBlur },
                  fieldState: { error },
                }) => (
                  <View style={styles.inputContainer}>
                    <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                    <TextInput
                      placeholder='Password'
                      style={styles.input}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      secureTextEntry
                      placeholderTextColor='#666'
                      autoCapitalize='none'
                      editable={!signInForm.formState.isSubmitting}
                    />
                    {error && <Text style={styles.error}>{error.message}</Text>}
                  </View>
                )}
              />
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={signInForm.handleSubmit(signIn)}
                disabled={signInForm.formState.isSubmitting}
              >
                <Text style={styles.buttonText}>Đăng Nhập</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View key="sign-up" style={styles.form}>
              <Controller
                control={signUpForm.control}
                name='name'
                render={({
                  field: { value, onChange, onBlur },
                  fieldState: { error },
                }) => (
                  <View style={styles.inputContainer}>
                    <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
                    <TextInput
                      placeholder='Họ và Tên'
                      style={styles.input}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholderTextColor='#666'
                      autoCapitalize='words'
                      editable={!signUpForm.formState.isSubmitting}
                    />
                    {error && <Text style={styles.error}>{error.message}</Text>}
                  </View>
                )}
              />
              <Controller
                control={signUpForm.control}
                name='email'
                render={({
                  field: { value, onChange, onBlur },
                  fieldState: { error },
                }) => (
                  <View style={styles.inputContainer}>
                    <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
                    <TextInput
                      placeholder='Email'
                      style={styles.input}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholderTextColor='#666'
                      autoCapitalize='none'
                      editable={!signUpForm.formState.isSubmitting}
                    />
                    {error && <Text style={styles.error}>{error.message}</Text>}
                  </View>
                )}
              />
              <Controller
                control={signUpForm.control}
                name='password'
                render={({
                  field: { value, onChange, onBlur },
                  fieldState: { error },
                }) => (
                  <View style={styles.inputContainer}>
                    <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                    <TextInput
                      placeholder='Password'
                      style={styles.input}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      secureTextEntry
                      placeholderTextColor='#666'
                      autoCapitalize='none'
                      editable={!signUpForm.formState.isSubmitting}
                    />
                    {error && <Text style={styles.error}>{error.message}</Text>}
                  </View>
                )}
              />
              <Controller
                control={signUpForm.control}
                name='gender'
                render={({
                  field: { value, onChange, onBlur },
                  fieldState: { error },
                }) => (
                  <View style={styles.inputContainer}>
                    <Ionicons name="transgender-outline" size={20} color="#666" style={styles.inputIcon} />
                    <TextInput
                      placeholder='Giới Tính'
                      style={styles.input}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholderTextColor='#666'
                      autoCapitalize='words'
                      editable={!signUpForm.formState.isSubmitting}
                    />
                    {error && <Text style={styles.error}>{error.message}</Text>}
                  </View>
                )}
              />
              <Controller
                control={signUpForm.control}
                name='address'
                render={({
                  field: { value, onChange, onBlur },
                  fieldState: { error },
                }) => (
                  <View style={styles.inputContainer}>
                    <Ionicons name="location-outline" size={20} color="#666" style={styles.inputIcon} />
                    <TextInput
                      placeholder='Địa Chỉ'
                      style={styles.input}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholderTextColor='#666'
                      autoCapitalize='words'
                      editable={!signUpForm.formState.isSubmitting}
                    />
                    {error && <Text style={styles.error}>{error.message}</Text>}
                  </View>
                )}
              />
              <Controller
                control={signUpForm.control}
                name='phone'
                render={({
                  field: { value, onChange, onBlur },
                  fieldState: { error },
                }) => (
                  <View style={styles.inputContainer}>
                    <Ionicons name="call-outline" size={20} color="#666" style={styles.inputIcon} />
                    <TextInput
                      placeholder='Số Điện Thoại'
                      style={styles.input}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholderTextColor='#666'
                      keyboardType='phone-pad'
                      editable={!signUpForm.formState.isSubmitting}
                    />
                    {error && <Text style={styles.error}>{error.message}</Text>}
                  </View>
                )}
              />
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={signUpForm.handleSubmit(signUp)}
                disabled={signUpForm.formState.isSubmitting}
              >
                <Text style={styles.buttonText}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          )}
          
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleSwitchMode}
            disabled={signInForm.formState.isSubmitting || signUpForm.formState.isSubmitting}
          >
            <Text style={styles.secondaryButtonText}>
              {isSignUp ? 'Đã có tài khoản? Đăng nhập' : "Chua có tài khoản? Đăng ký"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
    backgroundImage: {
      flex: 1,
      resizeMode: 'cover',
      justifyContent: 'center',
      alignItems: 'center',
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
      padding: 20,
    },
    formContainer: {
      width: '100%',
      maxWidth: 400,
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderRadius: 20,
      padding: 30,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    logoContainer: {
      alignItems: 'center',
      marginBottom: 20,
    },
    logo: {
      width: 80,
      height: 80,
      marginBottom: 10,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: '#333',
      marginBottom: 5,
    },
    subtitle: {
      fontSize: 16,
      color: '#666',
      textAlign: 'center',
      marginBottom: 30,
    },
    form: {
      width: '100%',
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#f5f5f5',
      borderRadius: 10,
      marginBottom: 15,
      paddingHorizontal: 15,
    },
    inputIcon: {
      marginRight: 10,
    },
    input: {
      flex: 1,
      padding: 15,
      fontSize: 16,
      color: '#333',
    },
    button: {
      padding: 15,
      borderRadius: 10,
      marginBottom: 15,
      width: '100%',
      alignItems: 'center',
    },
    primaryButton: {
      backgroundColor: '#FF6B6B',
    },
    secondaryButton: {
      backgroundColor: 'transparent',
    },
    buttonText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#fff',
    },
    secondaryButtonText: {
      fontSize: 14,
      color: '#666',
      textAlign: 'center',
    },
    error: {
      color: '#FF6B6B',
      fontSize: 12,
      marginTop: 5,
      marginLeft: 5,
    },
  });


