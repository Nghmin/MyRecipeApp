import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, 
  KeyboardAvoidingView, Platform, ScrollView, Dimensions
} from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User as UserIcon, Mail, Lock, UserPlus, ChevronLeft, ShieldCheck } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';

import { auth, db } from '../config/firebaseConfig';
import Config from "react-native-config";
import { getAuthErrorMessage } from '../config/authErrors';

import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { User } from '../models/User';
import { doc, setDoc } from 'firebase/firestore';

const { width } = Dimensions.get('window');
const AVT_DEFAULT = Config.AVT_DEFAULT;

const RegisterScreen = ({ navigation }: any) => {
  const [user, setUser] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>(''); // Bước 1: Thêm state mới

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

  const checkValidRegister = () => {
    
    if (!user.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      toastShow('error', 'Lỗi Đăng Ký', 'Vui lòng điền đầy đủ các trường.');
      return false;
    }
    if (password !== confirmPassword) {
      toastShow('error', 'Lỗi mật khẩu', 'Xác nhận mật khẩu không trùng khớp.');
      return false;
    }
    if (password.length < 6) {
      toastShow('error', 'Lỗi mật khẩu', 'Mật khẩu phải có ít nhất 6 ký tự.');
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    const isValid = checkValidRegister();
    if (!isValid) return;

    try {
      const userCreate = await createUserWithEmailAndPassword(auth, email, password);
      
      const newUser: User = {
        idUser: userCreate.user.uid,
        name: user,
        email: email,
        avatar: AVT_DEFAULT || '',
        createdAtUser: Date.now(),
        password: password,
      };

      await setDoc(doc(db, 'Users', newUser.idUser!), newUser);
      await signOut(auth);
      toastShow (
        'successLogin',
        'Đăng ký thành công!',
        'Hãy tạo ra thêm nhiều công thức của bạn ️🎉!',
      );
    } catch (error: any) {
      toastShow('error', 'Đăng ký thất bại!', getAuthErrorMessage(error.code));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.circleDecor} />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft size={28} color="#1E293B" />
        </TouchableOpacity>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Tạo tài khoản 🧑‍🍳</Text>
            <Text style={styles.subtitle}>Hãy tham gia cộng đồng yêu bếp và chia sẻ công thức của bạn.</Text>
          </View>

          <View style={styles.form}>
            {/* Input Họ Tên */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Họ và tên</Text>
              <View style={styles.inputWrapper}>
                <UserIcon size={20} color="#94A3B8" style={styles.inputIcon} />
                <TextInput 
                  placeholder="Tên của bạn" 
                  style={styles.input}
                  placeholderTextColor="#94A3B8"
                  value={user}
                  onChangeText={setUser}
                />
              </View>
            </View>

            {/* Input Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={styles.inputWrapper}>
                <Mail size={20} color="#94A3B8" style={styles.inputIcon} />
                <TextInput 
                  placeholder="example@gmail.com" 
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                  placeholderTextColor="#94A3B8"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            {/* Input Mật khẩu */}
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

            {/* Xác nhận mật khẩu */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Xác nhận mật khẩu</Text>
              <View style={styles.inputWrapper}>
                <ShieldCheck size={20} color="#94A3B8" style={styles.inputIcon} />
                <TextInput 
                  placeholder="Nhập lại mật khẩu" 
                  secureTextEntry
                  style={styles.input}
                  placeholderTextColor="#94A3B8"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </View>
            </View>

            <Text style={styles.termsText}>
              Bằng cách đăng ký, bạn đồng ý với 
              <Text style={styles.linkText}> Điều khoản </Text> & 
              <Text style={styles.linkText}> Chính sách</Text> của chúng tôi.
            </Text>
      
            <TouchableOpacity activeOpacity={0.8} onPress={handleRegister}>
              <LinearGradient
                colors={['#2e24edc9', '#F97316']} 
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.registerBtn}
              >
                <Text style={styles.registerBtnText}>Tạo tài khoản</Text>
                <UserPlus size={20} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Bạn đã có tài khoản? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Đăng nhập</Text>
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
    bottom: -width * 0.2,
    left: -width * 0.2,
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
    backgroundColor: '#fdf7ecff',
    zIndex: -1,
  },
  backButton: {
    padding: 12,
    marginLeft: 16,
    marginTop: 10,
    width: 50,
  },
  scrollContent: { paddingHorizontal: 28, paddingBottom: 40 },
  header: { marginTop: 10, marginBottom: 30 },
  title: { fontSize: 36, fontWeight: '900', color: '#F97316', lineHeight: 44 },
  subtitle: { fontSize: 16, color: '#F97316', marginTop: 10, lineHeight: 24 },
  form: { marginTop: 5 },
  inputGroup: { marginBottom: 18 },
  inputLabel: { fontSize: 14, fontWeight: '700', color: '#475569', marginBottom: 8, marginLeft: 4 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 16,
    height: 60,
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
  termsText: { fontSize: 13, color: '#888', textAlign: 'center', marginVertical: 20, lineHeight: 20 },
  linkText: { color: '#045cffff', fontWeight: '700' },
  registerBtn: { 
    flexDirection: 'row',
    height: 60, 
    borderRadius: 20, 
    justifyContent: 'center', 
    alignItems: 'center',
    gap: 10,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  registerBtnText: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 30 },
  footerText: { color: '#64748B', fontSize: 15 },
  loginLink: { color: '#F97316', fontSize: 15, fontWeight: '800' },
});

export default RegisterScreen;