import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, 
  KeyboardAvoidingView, Platform, ScrollView, Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth , db} from '../config/firebaseConfig';
import Config from "react-native-config"; 

import { createUserWithEmailAndPassword } from 'firebase/auth';
import { User } from '../models/User';
import { doc, setDoc } from 'firebase/firestore';


const RegisterScreen = ({ navigation } : any) => {

  const [user, setUser] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
// Kiểm tra tính hợp lệ của dữ liệu đăng ký
  const checkValidRegister = async () => {
    if(!user.trim() && !email.trim() && !password.trim()){
      Alert.alert("Lỗi Đăng Ký", "Vui lòng điền đầy đủ thông tin.");
      return false;
    }
    else if(!user.trim()){
      Alert.alert("Lỗi Đăng Ký", "Vui lòng nhập tên người dùng.");
      return false;
    }
    else if(!email.trim() ){
      Alert.alert("Lỗi Đăng Ký", "Vui lòng nhập email.");
      return false;
    }
    else if(!password.trim()){
      Alert.alert("Lỗi Đăng Ký", "Vui lòng nhập mật khẩu.");
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    const isValid = await checkValidRegister();
    if (!isValid) return;
    try{
    const userCreate = await createUserWithEmailAndPassword(auth, email, password);
    const AVT_DEFAULT = Config.AVT_DEFAULT!;
    // Tạo đối tượng User mới theo mô hình User.ts
    const newUser: User = {
        idUser: userCreate.user.uid,
        name: user,
        email: email,
        avatar:AVT_DEFAULT,
        createdAtUser: Date.now(),
        password :password,
      }; 
      // Lưu thông tin user mới vào Firestore với ID User là id từ Firebase Auth
      await setDoc(doc(db, 'Users', newUser.idUser!), newUser);
    Alert.alert("Đăng ký thành công", "Chào mừng " + newUser.name);
    console.log(newUser);
    } catch (error: any) {
      let msg = error.message;
      if (error.code === 'auth/weak-password' ) msg = "Mật khẩu phải dài hơn 6 kí tự!";
      if (error.code === 'auth/email-already-in-use' ) msg = "Email này đã được sử dụng!";
      if (error.code === 'auth/invalid-email') msg = "Email không hợp lệ!";
      Alert.alert("Đăng ký thất bại", msg);
    }
  };  

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>

          <View style={styles.header}>
            <Text style={styles.title}>Tạo tài khoản</Text>
            <Text style={styles.subtitle}>Bắt đầu hành trình mới cùng chúng tôi ngay hôm nay.</Text>
          </View>

          <View style={styles.form}>
            {/* Input Họ Tên */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Họ và tên</Text>
              <TextInput 
                placeholder="Tên đăng nhập" 
                style={styles.input}
                value={user}
                onChangeText={setUser}
              />
            </View>

            {/* Input Email */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Email</Text>
              <TextInput 
                placeholder="example@gmail.com" 
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
                value={email}
                onChangeText={setEmail}
              />
            </View>

            {/* Input Mật khẩu */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Mật khẩu</Text>
              <TextInput 
                placeholder="••••••••" 
                secureTextEntry
                style={styles.input}
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <Text style={styles.termsText}>
              Bằng cách đăng ký, bạn đồng ý với 
              <Text style={styles.linkText}> Điều khoản </Text> & 
              <Text style={styles.linkText}> Chính sách</Text> của chúng tôi.
            </Text>

            <TouchableOpacity style={styles.registerBtn} onPress={handleRegister}>
              <Text style={styles.registerBtnText}>Đăng ký ngay</Text>
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
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  backIcon: { fontSize: 24, color: '#1A1A1A' },
  header: { marginTop: 20, marginBottom: 30 },
  title: { fontSize: 32, fontWeight: '800', color: '#1A1A1A' },
  subtitle: { fontSize: 16, color: '#666', marginTop: 8, lineHeight: 22 },
  form: { marginTop: 10 },
  inputWrapper: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#1A1A1A', marginBottom: 8 },
  input: { 
    backgroundColor: '#F8F9FA', 
    borderWidth: 1, 
    borderColor: '#E9ECEF',
    borderRadius: 12, 
    height: 56, 
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1A1A1A'
  },
  termsText: { fontSize: 13, color: '#888', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  linkText: { color: '#4F46E5', fontWeight: '600' },
  registerBtn: { 
    backgroundColor: '#4F46E5', 
    borderRadius: 14, 
    height: 58, 
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  registerBtnText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 30 },
  footerText: { color: '#666', fontSize: 15 },
  loginLink: { color: '#4F46E5', fontSize: 15, fontWeight: '700' },
});

export default RegisterScreen;
