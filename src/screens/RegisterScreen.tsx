import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Dimensions, Animated, Image
} from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User as UserIcon, Mail, Lock, UserPlus, ChevronLeft, ShieldCheck, Eye, EyeOff } from 'lucide-react-native';
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
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  // Quản lý trạng thái Focus của các ô nhập liệu
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  // Quản lý trạng thái ẩn/hiện mật khẩu
  const [securePassword, setSecurePassword] = useState(true);
  const [secureConfirmPassword, setSecureConfirmPassword] = useState(true);

  // Khởi tạo Animated cho khối nền và Logo đầu bếp
  const blob1Anim = useRef(new Animated.Value(0)).current;
  const logoAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Chuyển động nhẹ nhàng của khối màu nền phía dưới
    Animated.loop(
      Animated.sequence([
        Animated.timing(blob1Anim, { toValue: 1, duration: 10000, useNativeDriver: true }),
        Animated.timing(blob1Anim, { toValue: 0, duration: 10000, useNativeDriver: true }),
      ])
    ).start();

    // Hiệu ứng nhúc nhích nhẹ cho emoji đầu bếp ở tiêu đề
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(logoAnim, { toValue: -1, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, [ blob1Anim, logoAnim ]);

  // Nội suy giá trị cho chuyển động nền
  const blob1X = blob1Anim.interpolate({ inputRange: [0, 1], outputRange: [0, -30] });
  const blob1Y = blob1Anim.interpolate({ inputRange: [0, 1], outputRange: [0, -50] });
  const blob1Scale = blob1Anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] });

  const logoRotate = logoAnim.interpolate({ inputRange: [-1, 1], outputRange: ['-8deg', '8deg'] });

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
      toastShow(
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
      {/* BACKGROUND  */}
      <View style={styles.backgroundContainer}>
        <LinearGradient colors={['#fff7ed', '#fff1f2', '#fff7ed']} style={StyleSheet.absoluteFillObject} />
        <Animated.View style={[
          styles.circleDecor, 
          { transform: [{ translateX: blob1X }, { translateY: blob1Y }, { scale: blob1Scale }] }
        ]} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.6}
        >
          <ChevronLeft size={28} color="#1E293B" />
        </TouchableOpacity>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.title}>Tạo tài khoản </Text>
              <Animated.View style={{ transform: [{ rotate: logoRotate }] }}>
                <Image source={require('../assets/iconRecipe.png')} style={{ width: 60, height: 60 , resizeMode: 'contain'  }} />              
              </Animated.View>
            </View>
            <Text style={styles.subtitle}>Hãy tham gia cộng đồng yêu bếp và chia sẻ công thức của bạn.</Text>
          </View>

          <View style={styles.form}>
            {/* Input Họ Tên */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Họ và tên</Text>
              <View style={[styles.inputWrapper, focusedInput === 'user' && { borderColor: '#F97316', borderWidth: 1.5 }]}>
                <UserIcon size={20} color={focusedInput === 'user' ? '#F97316' : '#94A3B8'} style={styles.inputIcon} />
                <TextInput
                  placeholder="Tên của bạn"
                  style={styles.input}
                  placeholderTextColor="#94A3B8"
                  value={user}
                  onChangeText={setUser}
                  onFocus={() => setFocusedInput('user')}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>
            </View>

            {/* Input Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={[styles.inputWrapper, focusedInput === 'email' && { borderColor: '#F97316', borderWidth: 1.5 }]}>
                <Mail size={20} color={focusedInput === 'email' ? '#F97316' : '#94A3B8'} style={styles.inputIcon} />
                <TextInput
                  placeholder="example@gmail.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                  placeholderTextColor="#94A3B8"
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setFocusedInput('email')}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>
            </View>

            {/* Input Mật khẩu */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Mật khẩu</Text>
              <View style={[styles.inputWrapper, focusedInput === 'password' && { borderColor: '#E11D48', borderWidth: 1.5 }]}>
                <Lock size={20} color={focusedInput === 'password' ? '#E11D48' : '#94A3B8'} style={styles.inputIcon} />
                <TextInput
                  placeholder="••••••••"
                  secureTextEntry={securePassword}
                  style={styles.input}
                  placeholderTextColor="#94A3B8"
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setFocusedInput('password')}
                  onBlur={() => setFocusedInput(null)}
                />
                <TouchableOpacity 
                  style={styles.eyeIcon} 
                  onPress={() => setSecurePassword(!securePassword)}
                  activeOpacity={0.6}
                >
                  {securePassword ? (
                    <EyeOff size={22} color={focusedInput === 'password' ? '#E11D48' : '#94A3B8'} />
                  ) : (
                    <Eye size={22} color={focusedInput === 'password' ? '#E11D48' : '#94A3B8'} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Xác nhận mật khẩu */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Xác nhận mật khẩu</Text>
              <View style={[styles.inputWrapper, focusedInput === 'confirm' && { borderColor: '#E11D48', borderWidth: 1.5 }]}>
                <ShieldCheck size={20} color={focusedInput === 'confirm' ? '#E11D48' : '#94A3B8'} style={styles.inputIcon} />
                <TextInput
                  placeholder="Nhập lại mật khẩu"
                  secureTextEntry={secureConfirmPassword}
                  style={styles.input}
                  placeholderTextColor="#94A3B8"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  onFocus={() => setFocusedInput('confirm')}
                  onBlur={() => setFocusedInput(null)}
                />
                <TouchableOpacity 
                  style={styles.eyeIcon} 
                  onPress={() => setSecureConfirmPassword(!secureConfirmPassword)}
                  activeOpacity={0.6}
                >
                  {secureConfirmPassword ? (
                    <EyeOff size={22} color={focusedInput === 'confirm' ? '#E11D48' : '#94A3B8'} />
                  ) : (
                    <Eye size={22} color={focusedInput === 'confirm' ? '#E11D48' : '#94A3B8'} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.termsText}>
              Bằng cách đăng ký, bạn đồng ý với
              <Text style={styles.linkText}> Điều khoản </Text> &
              <Text style={styles.linkText}> Chính sách</Text> của chúng tôi.
            </Text>

            <TouchableOpacity activeOpacity={0.8} onPress={handleRegister}>
              <LinearGradient
                colors={['#F97316', '#E11D48']}
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
  container: { flex: 1, backgroundColor: '#FFF' },
  backgroundContainer: { ...StyleSheet.absoluteFillObject, overflow: 'hidden', zIndex: -1 },
  circleDecor: {
    position: 'absolute',
    bottom: -width * 0.2,
    left: -width * 0.2,
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: (width * 0.8) / 2,
    backgroundColor: 'rgba(251, 146, 60, 0.2)',
  },
  backButton: {
    padding: 12,
    marginLeft: 12,
    marginTop: 10,
    width: 50,
  },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  header: { marginTop: 10, marginBottom: 28 },
  title: { fontSize: 34, fontWeight: '900', color: '#1E293B', lineHeight: 44 },
  titleIcon: { fontSize: 34 },
  subtitle: { fontSize: 15, color: '#64748B', marginTop: 10, lineHeight: 22 },
  form: { marginTop: 5 },
  inputGroup: { marginBottom: 18 },
  inputLabel: { fontSize: 14, fontWeight: '700', color: '#475569', marginBottom: 8, marginLeft: 4 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 18,
    paddingHorizontal: 16,
    height: 60,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  inputIcon: { marginRight: 12 },
  eyeIcon: { padding: 4, marginLeft: 8 },
  input: { flex: 1, fontSize: 16, color: '#1E293B', fontWeight: '500' },
  termsText: { fontSize: 13, color: '#888', textAlign: 'center', marginVertical: 20, lineHeight: 20 },
  linkText: { color: '#045cffff', fontWeight: '700' },
  registerBtn: {
    flexDirection: 'row',
    height: 60,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  registerBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { color: '#64748B', fontSize: 15 },
  loginLink: { color: '#F97316', fontSize: 15, fontWeight: '800' },
});

export default RegisterScreen;