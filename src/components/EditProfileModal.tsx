import React, { useState , useEffect} from 'react';
import { doc,updateDoc } from 'firebase/firestore';

import { launchImageLibrary  } from 'react-native-image-picker';
import { uploadImageToSupabase } from '../services/uploadService'; 

import { X, Camera,Check } from 'lucide-react-native';

import { auth , db} from '../config/firebaseConfig';
import Config from "react-native-config"; 

import { User } from '../models/User';

import { 
  Modal, View, Text, TextInput, TouchableOpacity,
   StyleSheet, Platform, KeyboardAvoidingView, Alert , Image, ActivityIndicator ,
} from 'react-native';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddUser?: (user: User) => void;
  onUpdateSuccess: () => void;
  userData?: User | null;
}

export function EditProfileModal({ isOpen, onClose, userData, onUpdateSuccess }: EditUserModalProps) {
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [avatarUri, setAvatarUri] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const AVT_DEFAULT = Config.AVATAR_DEFAULT ;;

  useEffect(() => {
    if (userData) {
      setName(userData.name || '');
      setEmail(userData.email || '');
      setAvatarUri(userData.avatar);
    }
  }, [userData, isOpen]);

  const pickImage = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.7 }, (response) => {
      if (response.assets && response.assets.length > 0) {
        setAvatarUri(response.assets[0].uri);
      }
    });
  };

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ các thông tin bắt buộc (*)!');
      return;
    }
    setIsSubmitting(true);
    try {
      const userId = auth.currentUser?.uid;
      if (!userId || !userData) return;

      let finalAvatarUrl = avatarUri;
      if (avatarUri && (avatarUri.startsWith('file') || avatarUri.startsWith('content'))) {
        const remoteUrl = await uploadImageToSupabase(avatarUri, 'user-images', userId);
        if (remoteUrl) finalAvatarUrl = remoteUrl;
      }
      const UserRef = doc(db, "Users", userData.idUser);
      const updatedData = {
        name: name,
        email: email,
        avatar: finalAvatarUrl, 
      };

      await updateDoc(UserRef, updatedData);
      
      Alert.alert("Thành công", "Đã cập nhật hồ sơ!");
      onUpdateSuccess(); // Hàm này sẽ gọi refreshData ở AccountScreen
      onClose();
    } catch (error: any) {
      console.error(error);
      Alert.alert("Lỗi", "Không thể cập nhật hồ sơ.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={isOpen} animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}><X color="#333" /></TouchableOpacity>
            <Text style={styles.title}>Chỉnh sửa hồ sơ</Text>
            <TouchableOpacity onPress={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? <ActivityIndicator size="small" color="#FF6347" /> : <Check color="#FF6347" />}
            </TouchableOpacity>
          </View>

          <View style={styles.avatarSection}>
            <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
              <Image 
                source={{ uri: avatarUri || AVT_DEFAULT }} 
                style={styles.avatar} 
              />
              <View style={styles.cameraIcon}>
                <Camera color="#fff" size={18} />
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Họ và tên</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Nhập tên của bạn" />

            <Text style={styles.label}>Email</Text>
            <TextInput 
              style={styles.input} 
              value={email} 
              onChangeText={setEmail} 
              placeholder="Nhập Email" 
              keyboardType="email-address"
            />
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  container: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, height: '80%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  title: { fontSize: 18, fontWeight: 'bold' },
  avatarSection: { alignItems: 'center', marginBottom: 30 },
  avatarContainer: { position: 'relative' },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#f0f0f0' },
  cameraIcon: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#FF6347', padding: 8, borderRadius: 20, borderWidth: 2, borderColor: '#fff' },
  form: { gap: 15 },
  label: { fontSize: 14, color: '#666', fontWeight: '500' },
  input: { borderBottomWidth: 1, borderBottomColor: '#eee', paddingVertical: 8, fontSize: 16 },
  textArea: { height: 80, textAlignVertical: 'top' }
});