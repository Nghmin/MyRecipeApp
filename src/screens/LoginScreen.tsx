import React ,{useState} from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, 
  KeyboardAvoidingView, Platform, ScrollView, Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../config/firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';

const LoginScreen = ({ navigation} : any) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async () => {
    try {
        await signInWithEmailAndPassword(auth, email, password);
        // navigation.navigate('TabView');
    }
    catch (error: any) {
        Alert.alert("Đăng nhập thất bại", error.message);
    }
}
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Chào mừng bạn!</Text>
            <Text style={styles.subtitle}>Đăng nhập để tiếp tục hành trình cùng chúng tôi.</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <TextInput 
                placeholder="Email của bạn" 
                style={styles.input}
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput 
                placeholder="Mật khẩu" 
                secureTextEntry
                style={styles.input}
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <TouchableOpacity style={styles.forgotBtn}>
              <Text style={styles.forgotText}>Quên mật khẩu?</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} >
              <Text style={styles.loginBtnText}>Đăng nhập</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Chưa có tài khoản? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.signUpText}>Đăng ký ngay</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, justifyContent: 'center' },
  header: { marginBottom: 40 },
  title: { fontSize: 32, fontWeight: '800', color: '#1A1A1A', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#666', lineHeight: 24 },
  form: { marginBottom: 30 },
  inputContainer: { 
    backgroundColor: '#F5F6FA', 
    borderRadius: 16, 
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 60,
    justifyContent: 'center',
  },
  input: { fontSize: 16, color: '#1A1A1A' },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 30 },
  forgotText: { color: '#4F46E5', fontWeight: '600' },
  loginBtn: { 
    backgroundColor: '#4F46E5', 
    borderRadius: 16, 
    height: 60, 
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  loginBtnText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  footerText: { color: '#666' },
  signUpText: { color: '#4F46E5', fontWeight: '700' },
});

export default LoginScreen;