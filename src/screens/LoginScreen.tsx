import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity, Image,
  KeyboardAvoidingView, Platform, ScrollView, Dimensions, Animated
} from 'react-native';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';

// Firebase Import logic
import { auth } from '../config/firebaseConfig';
import { getAuthErrorMessage } from '../config/authErrors';
import { signInWithEmailAndPassword } from 'firebase/auth';

const { width } = Dimensions.get('window');

const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [secureText, setSecureText] = useState(true); // Trạng thái ẩn/hiện mật khẩu

  // Khởi tạo các giá trị Animated thuần
  const blob1Anim = useRef(new Animated.Value(0)).current;
  const blob2Anim = useRef(new Animated.Value(0)).current;
  const logoAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animation cho các khối màu nền chuyển động qua lại
    Animated.loop(
      Animated.sequence([
        Animated.timing(blob1Anim, { toValue: 1, duration: 10000, useNativeDriver: true }),
        Animated.timing(blob1Anim, { toValue: 0, duration: 10000, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(blob2Anim, { toValue: 1, duration: 9000, useNativeDriver: true }),
        Animated.timing(blob2Anim, { toValue: 0, duration: 9000, useNativeDriver: true }),
      ])
    ).start();

    // Animation lắc lư cho Logo mì 🍜
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(logoAnim, { toValue: -1, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, [blob1Anim, blob2Anim, logoAnim]);

  // Nội suy giá trị cho chuyển động
  const blob1X = blob1Anim.interpolate({ inputRange: [0, 1], outputRange: [0, 40] });
  const blob1Y = blob1Anim.interpolate({ inputRange: [0, 1], outputRange: [0, 60] });
  const blob1Scale = blob1Anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.2] });

  const blob2X = blob2Anim.interpolate({ inputRange: [0, 1], outputRange: [0, -50] });
  const blob2Y = blob2Anim.interpolate({ inputRange: [0, 1], outputRange: [0, -40] });

  const logoRotate = logoAnim.interpolate({ inputRange: [-1, 1], outputRange: ['-10deg', '10deg'] });
  const logoScale = logoAnim.interpolate({ inputRange: [-1, 0, 1], outputRange: [1, 1.1, 1] });

  const toastShow = (type: string, title: string, text: string) => {
    Toast.show({
      type: type,
      text1: title,
      text2: text,
      position: 'top',
      topOffset: 60,
      visibilityTime: 3000,
    });
  };

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
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* BACKGROUND GRADIENT */}
      <View style={styles.backgroundContainer}>
        <LinearGradient colors={['#fff7ed', '#fff1f2', '#fff7ed']} style={StyleSheet.absoluteFillObject} />

        {/* Blob 1 */}
        <Animated.View style={[
          styles.blob,
          styles.blob1,
          { transform: [{ translateX: blob1X }, { translateY: blob1Y }, { scale: blob1Scale }] }
        ]} />

        {/* Blob 2 */}
        <Animated.View style={[
          styles.blob,
          styles.blob2,
          { transform: [{ translateX: blob2X }, { translateY: blob2Y }] }
        ]} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardAvoid}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* LOGO ANIMATION */}
          <View style={styles.logoContainer}>
            <Animated.View style={{ transform: [{ rotate: logoRotate }, { scale: logoScale }], }}>
              <Image source={require('../assets/iconRecipe.png')} style={styles.logoImage} />

            </Animated.View>
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Chào mừng bạn! ✨</Text>
            <Text style={styles.subtitleSub}>nhà công thức tài ba</Text>
            <Text style={styles.subtitle}>Khám phá hương vị mới mỗi ngày</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Input Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={styles.inputShadowContainer}>
                <View style={[styles.inputWrapper, isEmailFocused && styles.inputWrapperEmailFocus]}>
                  <Mail size={20} color={isEmailFocused ? "#F97316" : "#94A3B8"} style={styles.inputIcon} />
                  <TextInput
                    placeholder="name@example.com"
                    style={styles.input}
                    placeholderTextColor="#94A3B8"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    onFocus={() => setIsEmailFocused(true)}
                    onBlur={() => setIsEmailFocused(false)}
                  />
                </View>
              </View>
            </View>

            {/* Input Mật khẩu */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Mật khẩu</Text>
              <View style={styles.inputShadowContainer}>
                <View style={[styles.inputWrapper, isPasswordFocused && styles.inputWrapperPasswordFocus]}>
                  <Lock size={20} color={isPasswordFocused ? "#E11D48" : "#94A3B8"} style={styles.inputIcon} />
                  <TextInput
                    placeholder="••••••••"
                    secureTextEntry={secureText} // Thay đổi theo state secureText
                    style={styles.input}
                    placeholderTextColor="#94A3B8"
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={() => setIsPasswordFocused(false)}
                  />
                  {/* Nút bật/tắt hiển thị mật khẩu bằng mắt */}
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setSecureText(!secureText)}
                    activeOpacity={0.6}
                  >
                    {secureText ? (
                      <EyeOff size={22} color={isPasswordFocused ? "#E11D48" : "#94A3B8"} />
                    ) : (
                      <Eye size={22} color={isPasswordFocused ? "#E11D48" : "#94A3B8"} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Quên mật khẩu */}
            <TouchableOpacity style={styles.forgotBtn}>
              <Text style={styles.forgotText}>Quên mật khẩu?</Text>
            </TouchableOpacity>

            {/* Nút Đăng nhập */}
            <TouchableOpacity activeOpacity={0.8} onPress={handleLogin}>
              <View style={styles.btnShadowWrapper}>
                <LinearGradient
                  colors={['#F97316', '#E11D48']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.loginBtn}
                >
                  <Text style={styles.loginBtnText}>Đăng nhập ngay</Text>
                  <ArrowRight size={20} color="#FFF" />
                </LinearGradient>
              </View>
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
  container: { flex: 1, backgroundColor: '#FFF' },
  backgroundContainer: { ...StyleSheet.absoluteFillObject, overflow: 'hidden', zIndex: -1 },
  blob: { position: 'absolute', width: width * 1.2, height: width * 1.2, borderRadius: (width * 1.2) / 2, opacity: 0.3 },
  logoContainer: { alignItems: 'center', marginTop: 20, marginBottom: 10 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, justifyContent: 'center', paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 32 },
  title: { fontSize: 32, fontWeight: '900', color: '#1E293B', textAlign: 'center' },
  subtitleSub: { fontSize: 20, fontWeight: '700', color: '#475569', marginTop: 4, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#64748B', marginTop: 6, textAlign: 'center' },
  form: { marginBottom: 20 },
  inputGroup: { marginBottom: 22 },
  inputLabel: { fontSize: 14, fontWeight: '700', color: '#475569', marginBottom: 8, marginLeft: 4 },
  inputShadowContainer: { position: 'relative', justifyContent: 'center' },
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
  eyeIcon: { padding: 4, marginLeft: 8 }, // CSS nhỏ cho nút con mắt
  input: { flex: 1, fontSize: 16, color: '#1E293B', fontWeight: '500' },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 28 },
  forgotText: { color: '#F97316', fontWeight: '700', fontSize: 14 },
  btnShadowWrapper: { position: 'relative' },
  loginBtn: { flexDirection: 'row', height: 60, borderRadius: 18, justifyContent: 'center', alignItems: 'center', gap: 10 },
  loginBtnText: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
  footerText: { color: '#64748B', fontSize: 15 },
  signUpText: { color: '#F97316', fontWeight: '800', fontSize: 15 },
  keyboardAvoid: { flex: 1 },
  blob1: { top: '-10%', right: '-10%', backgroundColor: 'rgba(251, 146, 60, 0.25)' },
  blob2: { bottom: '-10%', left: '-10%', backgroundColor: 'rgba(251, 113, 133, 0.25)' },
  logoImage: { width: 100, height: 100, resizeMode: 'contain' },
  inputWrapperEmailFocus: { borderColor: '#F97316', borderWidth: 1.5 },
  inputWrapperPasswordFocus: { borderColor: '#E11D48', borderWidth: 1.5 },
});

export default LoginScreen;