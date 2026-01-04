import React, { useState , useEffect} from 'react';
import { 
  Modal, View, Text, TextInput, TouchableOpacity, ActivityIndicator, 
  ScrollView, StyleSheet, Platform, KeyboardAvoidingView, Image
} from 'react-native';
import { X, Plus, Trash2 ,Camera } from 'lucide-react-native';
import { auth , db} from '../config/firebaseConfig';
import { toastConfig } from '../config/ToastConfig';

import { doc, getDoc , setDoc, collection ,updateDoc } from 'firebase/firestore';
import { User } from '../models/User';
import { Recipe } from '../models/Recipe';
import { launchImageLibrary  } from 'react-native-image-picker';

import Toast from 'react-native-toast-message';

import { uploadImageToSupabase , deleteImageFromSupabase} from '../services/uploadService';
 
interface AddRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddRecipe?: (recipe: Recipe) => void;
  initialData?: Recipe | null;
}

export function AddRecipeModal({ isOpen, onClose, onAddRecipe , initialData }: AddRecipeModalProps) {

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [prepTime, setPrepTime] = useState('');
  const [difficulty, setDifficulty] = useState<'Dễ' | 'Trung bình' | 'Khó'>('Dễ');
  const [category, setCategory] = useState('');
  const [ingredients, setIngredients] = useState<string[]>(['']);
  const [instructions, setInstructions] = useState<string[]>(['']);
  const [idUser , setIdUser] = React.useState('...');
  const [recipeCreator , setRecipeCreator] = React.useState('...');

  // Lấy thông tin từ firebase
  useEffect(() => {
      const fetchUserName = async () => {
        try { 
          const currentUser = auth.currentUser;
          if(currentUser) {
            const userDocRef = doc(db,"Users", currentUser.uid);
            const userDoc = await getDoc (userDocRef);
            if(userDoc.exists()) {
              const userData = userDoc.data() as User;
              setIdUser (userData.idUser || '...');
              setRecipeCreator (userData.name);
            }
          }
        } catch (error) {
            console.log("Lỗi khi lấy thông tin người dùng:", error);
          }
      };
      fetchUserName();
    }, []);
    //
    useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setDescription(initialData.description);
      setImageUri(initialData.image);
      setPrepTime(initialData.prepTime.toString());
      setCategory(initialData.category);
      setIngredients(initialData.ingredients);
      setInstructions(initialData.instructions);
      setDifficulty(initialData.difficulty);
    } else {
      setName(''); setImageUri(null);
    }
  }, [initialData, isOpen]);
    // Hàm chọn ảnh
    const pickImage = () => {
        launchImageLibrary({ mediaType: 'photo', quality: 0.7 }, (response) => {
            if (response.didCancel) return;
            if (response.errorCode) {
            console.log('ImagePicker Error: ', response.errorMessage);
            } else if (response.assets && response.assets.length > 0) {
            setImageUri(response.assets[0].uri || null);
            }
        });
    };

  const toastShow = async ( type: string,title : string,text: string ) => {
    Toast.show({
          type: type,       
          text1: title ,
          text2: text,
          position: 'top',    
          topOffset: 60,
          visibilityTime: 3000,
    });
  }

  // Hàm thêm ô nhập
  const handleAddIngredient = () => setIngredients([...ingredients, '']);
  
  // Hàm bỏ đi một ô nhập
  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleIngredientChange = (index: number, value: string) => {
    const newArr = [...ingredients];
    newArr[index] = value;
    setIngredients(newArr);
  };

  const handleAddInstruction = () => setInstructions([...instructions, '']);
  const handleRemoveInstruction = (index: number) => {
    setInstructions(instructions.filter((_, i) => i !== index));
  };
  const handleInstructionChange = (index: number, value: string) => {
    const newArr = [...instructions];
    newArr[index] = value;
    setInstructions(newArr);
  };

  // Hàm kiểm tra và xác nhận submit
  const handleSubmit = async () => {
    
    if (!name.trim() || !description.trim() || !prepTime.trim() || !category.trim()) {
      toastShow(
        'error',
        'Lỗi thêm món!',
        'Vui lòng điền đầy đủ các thông tin bắt buộc.',
      );
      return;
    }

    //Loại bỏ ô mà người dùng ko nhập
    const filteredIngredients = ingredients.filter(i => i.trim() !== '');
    const filteredInstructions = instructions.filter(i => i.trim() !== '');

    if (filteredIngredients.length === 0 || filteredInstructions.length === 0) {
      toastShow(
        'error',
        'Lỗi thêm món!',
        'Vui lòng thêm ít nhất 1 nguyên liệu và 1 bước hướng dẫn.',
      );
      return;
    }
    if (!imageUri) { 
      toastShow(
        'error',
        'Lỗi thêm món!',
        'Vui lòng thêm ảnh.',
      );
      return;
    }
    setIsSubmitting(true);

    try {
    const currentId = auth.currentUser;
    if (!currentId) {
      toastShow(
        'error',
        'Thông báo!',
        'Bạn cần đăng nhập để sử dụng chức năng này.',
      );
      return;
    }

    let finalImageUrl = imageUri
    if (imageUri.startsWith('file') || imageUri.startsWith('content')) {
      const remoteUrl = await uploadImageToSupabase(imageUri, 'recipe-images' , idUser);
      
      if (!remoteUrl) {
        setIsSubmitting(false);
        toastShow(
          'error',
          'Lỗi!',
          'Không thể upload ảnh lên. Vui lòng thử lại.',
        );
        return;
      }
      if (initialData && initialData.image) {
          await deleteImageFromSupabase(initialData.image);
      }
      finalImageUrl = remoteUrl;
    }

    if (initialData ) {
      // LOGIC CẬP NHẬT (EDIT)
      const recipeRef = doc(db, "Recipes", initialData.idRecipe);
      const updatedData = {
        name, 
        description, 
        image: finalImageUrl, 
        prepTime: parseInt(prepTime), 
        difficulty, 
        category, 
        ingredients: filteredIngredients, 
        instructions: filteredInstructions 
      };
      await updateDoc(recipeRef, updatedData);
      toastShow(
        'succses',
        'Thành công!',
        `Bạn đã cập nhật công thức ${name}.`
      );
    } else {
      const recipeRef = doc(collection(db, "Recipes"));
      const recipeId = recipeRef.id;
      const newRecipe: Recipe = {
        idRecipe :recipeId,
        idUser: idUser,
        recipeCreator : recipeCreator,
        name :name,
        image: finalImageUrl || 'images.unsplash.com',
        rating: 5.0,
        reviews: 0,
        prepTime: parseInt(prepTime),
        difficulty: difficulty,
        category: category,
        ingredients: filteredIngredients,
        instructions: filteredInstructions,
        description: description,
        createdAtRecipe: Date.now(),
      };
      await setDoc(recipeRef, newRecipe);
      if (onAddRecipe) onAddRecipe(newRecipe);
      toastShow(
        'succses',
        'Thành công!',
        'Bạn đã thêm một công thức mới.',
      );
    }
      // Reset Form
      setName(''); setImageUri('') ; setDescription(''); setIsSubmitting(false); setPrepTime('');
      setCategory(''); setIngredients(['']); setInstructions(['']);
      onClose();
    } catch (error: any) {
      console.error("Lỗi khi thêm công thức:", error);
      toastShow(
        'error',
        'Lỗi!',
        'Không thể lưu công thức. Vui lòng thử lại.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <Modal visible={isOpen} animationType="slide" transparent={true} onRequestClose={onClose}  statusBarTranslucent={true}>
      <View style={styles.backdrop}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Thêm Công Thức Mới</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X size={20} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Form Fields */}
            <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
              {/* Tên món */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Tên món ăn *</Text>
                <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="VD: Phở Bò" />
              </View>
              {/* Ảnh món */}
              <View style={styles.inputGroup}>
              <Text style={styles.label}>Hình ảnh món ăn *</Text>
                <TouchableOpacity 
                style={[styles.input, styles.imageUploadBox, imageUri && { borderStyle: 'solid' }]} 
                onPress={pickImage}
                >
                {imageUri ? (
                    <View style={styles.imagePreviewWrapper}>
                    <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                    <View style={styles.imageBadge}><Text style={styles.imageBadgeText}>Đổi ảnh</Text></View>
                    </View>
                ) : (
                    <View style={styles.imagePlaceholder}>
                    <Camera size={24} color="#9CA3AF" />
                    <Text style={styles.imagePlaceholderText}>Nhấn để tải ảnh lên</Text>
                    </View>
                )}
                </TouchableOpacity>
              </View>
              {/* Mô tả */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Mô tả *</Text>
                <TextInput 
                  style={[styles.input, styles.textArea]} 
                  value={description} 
                  onChangeText={setDescription} 
                  placeholder="Mô tả ngắn về món ăn..."
                  multiline numberOfLines={3}
                />
              </View>
              {/* Thời gian nấu */}
              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                  <Text style={styles.label}>Thời gian (phút) *</Text>
                  <TextInput style={styles.input} value={prepTime} onChangeText={setPrepTime} keyboardType="numeric" placeholder="30" />
                </View>
                {/* Độ khó */}
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Độ khó *</Text>
                  <View style={styles.difficultyRow}>
                    {(['Dễ', 'Trung bình', 'Khó'] as const).map((level) => (
                      <TouchableOpacity 
                        key={level} 
                        style={[styles.diffBtn, difficulty === level && styles.diffBtnActive]}
                        onPress={() => setDifficulty(level)}
                      >
                        <Text style={[styles.diffText, difficulty === level && styles.diffTextActive]}>{level}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
              {/* Danh mục */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Danh mục *</Text>
                <TextInput style={styles.input} value={category} onChangeText={setCategory} placeholder="Món chính, Khai vị..." />
              </View>
              {/* Nguyên liêu */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nguyên liệu</Text>
                {ingredients.map((item, index) => (
                  <View key={index} style={styles.dynamicRow}>
                    <TextInput style={[styles.input, { flex: 1 }]} value={item} onChangeText={(t) => handleIngredientChange(index, t)} placeholder={`Nguyên liệu ${index+1}`} />
                    {ingredients.length > 1 && (
                      <TouchableOpacity onPress={() => handleRemoveIngredient(index)} style={styles.removeBtn}>
                        <Trash2 size={18} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
                <TouchableOpacity style={styles.addBtn} onPress={handleAddIngredient}>
                  <Plus size={18} color="#F97316" />
                  <Text style={styles.addBtnText}>Thêm nguyên liệu</Text>
                </TouchableOpacity>
              </View>
              {/* Bước làm */}
              <View style={[styles.inputGroup, { marginBottom: 50 }]}>
                <Text style={styles.label}>Cách làm</Text>
                {instructions.map((item, index) => (
                  <View key={index} style={styles.dynamicRow}>
                    <View style={styles.stepNum}><Text style={styles.stepNumText}>{index+1}</Text></View>
                    <TextInput style={[styles.input, styles.textArea, { flex: 1 }]} value={item} onChangeText={(t) => handleInstructionChange(index, t)} placeholder={`Bước ${index+1}`} multiline />
                    {instructions.length > 1 && (
                      <TouchableOpacity onPress={() => handleRemoveInstruction(index)} style={styles.removeBtn}>
                        <Trash2 size={18} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
                <TouchableOpacity style={styles.addBtn} onPress={handleAddInstruction}>
                  <Plus size={18} color="#F97316" />
                  <Text style={styles.addBtnText}>Thêm bước thực hiện</Text>
                </TouchableOpacity>
              </View>

            </ScrollView>

            {/* Footer Buttons */}
            <View style={styles.footer}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelBtnText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                    <ActivityIndicator color="#FFF" /> 
                ) : (
                    <Text style={styles.submitBtnText}>Thêm món</Text>
                )}

              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
      <Toast config={toastConfig} /> 
    </Modal>
  );
}

const styles = StyleSheet.create({
  // KHUNG MODAL
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    width: '100%',
    height: '92%',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },

  //  TIÊU ĐỀ (HEADER)
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  closeBtn: {
    padding: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
  },

  // FORM CHUNG 
  formContainer: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: '#111827',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },

  // STYLE RIÊNG CHO ẢNH (IMAGE UPLOAD) 
  imageUploadBox: {
    height: 160,
    borderStyle: 'dashed',
    padding: 0, 
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  imagePlaceholder: {
    alignItems: 'center',
    gap: 8,
  },
  imagePlaceholderText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  imagePreviewWrapper: {
    width: '100%',
    height: '100%',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(17, 24, 39, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  imageBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },

  // THÔNG SỐ (THỜI GIAN/ĐỘ KHÓ)
  row: {
    flexDirection: 'row',
  },
  difficultyRow: {
    flexDirection: 'column',
    gap: 6,
  },
  diffBtn: {
    padding: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    alignItems: 'center',
  },
  diffBtnActive: {
    backgroundColor: '#FFF7ED',
    borderColor: '#F97316',
  },
  diffText: {
    fontSize: 12,
    color: '#6B7280',
  },
  diffTextActive: {
    color: '#F97316',
    fontWeight: 'bold',
  },

  // DYNAMC ROWS
  dynamicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  removeBtn: {
    width: 40,
    height: 40,
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#F97316',
    borderRadius: 12,
    marginTop: 5,
  },
  addBtnText: {
    color: '#F97316',
    marginLeft: 8,
    fontWeight: '600',
  },
  stepNum: {
    width: 28,
    height: 28,
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6B7280',
  },

  // NÚT BẤM DƯỚI CÙNG (FOOTER)
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 15,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#4B5563',
    fontWeight: '600',
  },
  submitBtn: {
    flex: 2,
    padding: 16,
    backgroundColor: '#F97316',
    borderRadius: 15,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});