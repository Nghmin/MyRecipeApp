import React, { useState } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Dimensions
} from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, Lock, ArrowRight } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';

import { auth } from '../config/firebaseConfig';
import { getAuthErrorMessage } from '../config/authErrors';
import { signInWithEmailAndPassword } from 'firebase/auth';

const { width } = Dimensions.get('window');

const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const toastShow = (type: string, title: string, text: string) => {
    Toast.show({
      type: type,
      text1: title,
      text2: text,
      position: 'top',
      topOffset: 60,
      visibilityTime: 3000,
    });
  }

  const handleLogin = async () => {
    if (!email || !password) {
      toastShow('error', 'Lỗi nhập liệu', 'Vui lòng điền đầy đủ thông tin');
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toastShow('success', 'Thành công', 'Chào mừng nhà công thức tài ba👋');
    } catch (error: any) {
      toastShow('error', 'Đăng nhập thất bại', getAuthErrorMessage(error.code));
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Hình trang trí phía sau */}
      <View style={styles.circleDecor} />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Chào mừng bạn ✨{"\n"}nhà công thức tài ba!</Text>
            <Text style={styles.subtitle}>Hãy cùng khám phá những công thức nấu ăn mới lạ ngay thôi.</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={styles.inputWrapper}>
                <Mail size={20} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  placeholder="name@example.com"
                  style={styles.input}
                  placeholderTextColor="#94A3B8"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Mật khẩu</Text>
              <View style={styles.inputWrapper}>
                <Lock size={20} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  placeholder="••••••••"
                  secureTextEntry
                  style={styles.input}
                  placeholderTextColor="#94A3B8"
                  value={password}
                  onChangeText={setPassword}
                />
              </View>
            </View>

            <TouchableOpacity style={styles.forgotBtn}>
              <Text style={styles.forgotText}>Quên mật khẩu?</Text>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.8} onPress={handleLogin}>
              <LinearGradient
                colors={['#2e24edc9', '#F97316']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.loginBtn}
              >
                <Text style={styles.loginBtnText}>Đăng nhập</Text>
                <ArrowRight size={20} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Bạn là người mới? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.signUpText}>Tạo tài khoản</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  circleDecor: {
    position: 'absolute',
    top: -width * 0.2,
    right: -width * 0.2,
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: '#fdf7ecff',
    zIndex: -1,
  },
  scrollContent: { flexGrow: 1, paddingHorizontal: 28, justifyContent: 'center', paddingBottom: 20 },
  header: { marginBottom: 40 },
  title: { fontSize: 36, fontWeight: '800', color: '#F97316', lineHeight: 44 },
  subtitle: { fontSize: 16, color: '#F97316', marginTop: 12, lineHeight: 24 },
  form: { marginBottom: 30 },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 14, fontWeight: '700', color: '#475569', marginBottom: 8, marginLeft: 4 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 16,
    height: 64,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: '#1E293B', fontWeight: '500' },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 32 },
  forgotText: { color: '#F97316', fontWeight: '700', fontSize: 14 },
  loginBtn: {
    flexDirection: 'row',
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  loginBtnText: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 10 },
  footerText: { color: '#64748B', fontSize: 15 },
  signUpText: { color: '#F97316', fontWeight: '800', fontSize: 15 },
});

export default LoginScreen;