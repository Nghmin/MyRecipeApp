import React, { useState, useEffect } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity, ActivityIndicator,
  ScrollView, StyleSheet, Platform, KeyboardAvoidingView, Image
} from 'react-native';
import { X, Plus, Trash2, Camera, Lightbulb, Check, Zap } from 'lucide-react-native';
import { auth, db } from './config/firebaseConfig';
import { toastConfig } from './config/ToastConfig';
import { doc, collection, setDoc, updateDoc } from 'firebase/firestore';
import { Recipe } from '../models/Recipe';
import { launchImageLibrary } from 'react-native-image-picker';
import Toast from 'react-native-toast-message';
import { uploadImageToSupabase, deleteImageFromSupabase } from '../services/uploadService';
import { useUser } from '../theme/UserContext';
import { useTheme } from '../theme/ThemeContext';
import { SAMPLE_RECIPES } from '../constants/sampleRecipes';

const CATEGORIES = ['Món chính', 'Khai vị', 'Tráng miệng', 'Đồ uống', 'Ăn vặt'];
const DIFFICULTIES = ['Dễ', 'Trung bình', 'Khó'];

const normalizeCategories = (cat: any): string[] => {
  if (!cat) return [];
  if (Array.isArray(cat)) return cat;
  if (typeof cat === 'string') return cat.split(',').map((c: string) => c.trim()).filter((c: string) => c !== '');
  return [];
};

interface AddRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddRecipe?: (recipe: Recipe) => void;
  initialData?: Recipe | null;
}

export function AddRecipeModal({ isOpen, onClose, onAddRecipe, initialData }: AddRecipeModalProps) {
  const { userProfile } = useUser();
  const { currentTheme } = useTheme();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [prepTime, setPrepTime] = useState('');
  const [difficulty, setDifficulty] = useState<'Dễ' | 'Trung bình' | 'Khó'>('Dễ');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [ingredients, setIngredients] = useState<string[]>(['']);
  const [instructions, setInstructions] = useState<string[]>(['']);
  const [proTips, setProTips] = useState('');

  // --- FEATURE: MAGIC FILL (Xóa khi xong) ---
  const handleMagicFill = () => {
    const random = SAMPLE_RECIPES[Math.floor(Math.random() * SAMPLE_RECIPES.length)];
    setName(random.name);
    setDescription(random.description);
    setPrepTime(random.prepTime);
    setDifficulty(random.difficulty as any);
    setSelectedCategories(random.categories);
    setIngredients(random.ingredients);
    setInstructions(random.instructions);
    setProTips(random.proTips);
    toastShow('success', '✨ Magic Fill', `Đã điền mẫu: ${random.name}. Nhớ thêm ảnh nhé!`);
  };
  // ------------------------------------------

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setDescription(initialData.description);
      setImageUri(initialData.image);
      setPrepTime(initialData.prepTime.toString());
      const cats = normalizeCategories(initialData.category);
      setSelectedCategories(cats.filter(c => c !== ''));
      setIngredients(initialData.ingredients);
      setInstructions(initialData.instructions);
      setDifficulty(initialData.difficulty);
      setProTips(initialData.proTips || '');
    } else {
      resetForm();
    }
  }, [initialData, isOpen]);

  const resetForm = () => {
    setName(''); setImageUri(null); setDescription('');
    setPrepTime(''); setSelectedCategories([]); setIngredients(['']);
    setInstructions(['']); setDifficulty('Dễ'); setProTips('');
  };

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const pickImage = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.7 }, (response) => {
      if (response.assets && response.assets.length > 0) {
        setImageUri(response.assets[0].uri || null);
      }
    });
  };

  const toastShow = (type: string, title: string, text: string) => {
    Toast.show({
      type: type,
      text1: title,
      text2: text,
      position: 'top',
      topOffset: 60,
    });
  };

  const handleAddField = (setter: React.Dispatch<React.SetStateAction<string[]>>) =>
    setter(prev => [...prev, '']);

  const handleRemoveField = (index: number, setter: React.Dispatch<React.SetStateAction<string[]>>, list: string[]) => {
    if (list.length > 1) setter(list.filter((_, i) => i !== index));
  };

  const handleUpdateField = (index: number, value: string, setter: React.Dispatch<React.SetStateAction<string[]>>, list: string[]) => {
    const newArr = [...list];
    newArr[index] = value;
    setter(newArr);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !description.trim() || !prepTime.trim() || selectedCategories.length === 0 || !imageUri) {
      toastShow('error', 'Thiếu thông tin!', 'Vui lòng nhập Tên, Ảnh, Mô tả, Thời gian và chọn ít nhất 1 Danh mục.');
      return;
    }

    const filteredIngredients = ingredients.filter(i => i.trim() !== '');
    const filteredInstructions = instructions.filter(i => i.trim() !== '');

    if (filteredIngredients.length === 0 || filteredInstructions.length === 0) {
      toastShow('error', 'Lỗi!', 'Vui lòng thêm ít nhất 1 nguyên liệu và 1 bước hướng dẫn.');
      return;
    }

    setIsSubmitting(true);

    try {
      const userId = userProfile?.uid || auth.currentUser?.uid;
      const creatorName = userProfile?.name || 'Người dùng';

      if (!userId) {
        toastShow('error', 'Lỗi!', 'Không tìm thấy ID người dùng. Vui lòng đăng nhập lại.');
        return;
      }

      let finalImageUrl = imageUri;
      if (imageUri.startsWith('file') || imageUri.startsWith('content')) {
        const remoteUrl = await uploadImageToSupabase(imageUri, 'recipe-images', userId);
        if (!remoteUrl) throw new Error('Upload ảnh thất bại');

        // Xóa ảnh cũ nếu có và là ảnh từ supabase
        if (initialData?.image && initialData.image.includes('supabase.co')) {
          await deleteImageFromSupabase(initialData.image);
        }
        finalImageUrl = remoteUrl;
      }

      const recipeData = {
        name,
        description,
        image: finalImageUrl,
        prepTime: parseInt(prepTime),
        difficulty,
        category: selectedCategories, // Lưu dạng mảng trực tiếp
        ingredients: filteredIngredients,
        instructions: filteredInstructions,
        proTips,
        updatedAt: Date.now(),
      };

      if (initialData) {
        const recipeRef = doc(db, "Recipes", initialData.idRecipe);
        await updateDoc(recipeRef, recipeData);
        toastShow('success', 'Thành công!', 'Đã cập nhật công thức.');
      } else {
        const recipeRef = doc(collection(db, "Recipes"));
        const newRecipe: Recipe = {
          ...recipeData,
          idRecipe: recipeRef.id,
          idUser: userId,
          recipeCreator: creatorName,
          rating: 5.0,
          reviews: 0,
          createdAtRecipe: Date.now(),
        } as Recipe;
        await setDoc(recipeRef, newRecipe);
        if (onAddRecipe) onAddRecipe(newRecipe);
        toastShow('success', 'Thành công!', 'Đã thêm công thức mới.');
      }

      onClose();
      resetForm();
    } catch (error) {
      console.error(error);
      toastShow('error', 'Lỗi!', 'Không thể lưu công thức. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={isOpen} animationType="slide" transparent={true} statusBarTranslucent={true}>
      <View style={styles.backdrop}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.header}>
              {/* Nút Magic Fill - Xóa khi xong */}
              <TouchableOpacity onPress={handleMagicFill} style={styles.magicBtn}>
                <Zap size={18} color="#F59E0B" fill="#F59E0B" />
                <Text style={styles.magicText}>Tự điền</Text>
              </TouchableOpacity>

              <Text style={styles.headerTitle}>{initialData ? 'Sửa' : 'Thêm Món'}</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X size={20} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
              {/* Image Picker */}
              <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                {imageUri ? (
                  <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Camera size={32} color="#9CA3AF" />
                    <Text style={styles.imagePlaceholderText}>Thêm ảnh món ăn</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Basic Info */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Tên món ăn / Đồ uống *</Text>
                <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="VD: Cà phê muối, Phở bò..." />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Mô tả ngắn *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={description} onChangeText={setDescription}
                  placeholder="Chia sẻ một chút về món này..." multiline
                />
              </View>

              {/* Category Chips (Chọn nhiều) */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Danh mục * (Chọn nhiều)</Text>
                <View style={styles.chipContainer}>
                  {CATEGORIES.map(cat => (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => toggleCategory(cat)}
                      style={[styles.chip, selectedCategories.includes(cat) && { backgroundColor: currentTheme.primary, borderColor: currentTheme.primary }]}
                    >
                      <Text style={[styles.chipText, selectedCategories.includes(cat) && { color: '#fff' }]}>{cat}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Thời gian & Độ khó (Giữ như cũ) */}
              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 15 }]}>
                  <Text style={styles.label}>Thời gian (phút) *</Text>
                  <TextInput style={styles.input} value={prepTime} onChangeText={setPrepTime} keyboardType="numeric" placeholder="30" />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Độ khó *</Text>
                  <View style={styles.difficultyRow}>
                    {DIFFICULTIES.map((level) => (
                      <TouchableOpacity
                        key={level}
                        style={[styles.diffBtn, difficulty === level && styles.diffBtnActive]}
                        onPress={() => setDifficulty(level as any)}
                      >
                        <Text style={[styles.diffText, difficulty === level && styles.diffTextActive]}>{level}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              {/* Ingredients */}
              <View style={styles.inputGroup}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.label}>Nguyên liệu</Text>
                  <TouchableOpacity onPress={() => handleAddField(setIngredients)}><Plus size={20} color={currentTheme.primary} /></TouchableOpacity>
                </View>
                {ingredients.map((item, index) => (
                  <View key={index} style={styles.dynamicRow}>
                    <TextInput style={{ flex: 1, ...styles.input }} value={item} onChangeText={(t) => handleUpdateField(index, t, setIngredients, ingredients)} placeholder={`Nguyên liệu ${index + 1}`} />
                    <TouchableOpacity onPress={() => handleRemoveField(index, setIngredients, ingredients)}><Trash2 size={18} color="#EF4444" /></TouchableOpacity>
                  </View>
                ))}
              </View>

              {/* Instructions */}
              <View style={styles.inputGroup}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.label}>Cách chế biến</Text>
                  <TouchableOpacity onPress={() => handleAddField(setInstructions)}><Plus size={20} color={currentTheme.primary} /></TouchableOpacity>
                </View>
                {instructions.map((item, index) => (
                  <View key={index} style={styles.dynamicRow}>
                    <Text style={styles.stepNum}>{index + 1}</Text>
                    <TextInput style={{ flex: 1, ...styles.input }} value={item} onChangeText={(t) => handleUpdateField(index, t, setInstructions, instructions)} placeholder={`Bước ${index + 1}`} multiline />
                    <TouchableOpacity onPress={() => handleRemoveField(index, setInstructions, instructions)}><Trash2 size={18} color="#EF4444" /></TouchableOpacity>
                  </View>
                ))}
              </View>

              {/* Pro-tips (Không bắt buộc) */}
              <View style={styles.inputGroup}>
                <View style={styles.tipHeader}>
                  <Lightbulb size={18} color="#FBBF24" />
                  <Text style={[styles.label, { marginBottom: 0, marginLeft: 6 }]}>Mẹo nhỏ (Không bắt buộc)</Text>
                </View>
                <TextInput
                  style={[styles.input, styles.textArea, { borderColor: '#FBBF24', marginTop: 8 }]}
                  value={proTips} onChangeText={setProTips}
                  placeholder="Bí quyết để món ăn ngon hơn..." multiline
                />
              </View>

              <View style={{ height: 100 }} />
            </ScrollView>

            <View style={styles.footer}>
              <TouchableOpacity style={[styles.submitBtn, { backgroundColor: currentTheme.primary, opacity: isSubmitting ? 0.6 : 1 }]} onPress={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? <ActivityIndicator color="#FFF" /> : (
                  <><Check color="#fff" size={22} /><Text style={styles.submitBtnText}>Lưu Công Thức</Text></>
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
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContainer: { width: '100%', height: '92%' },
  modalContent: { flex: 1, backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  magicBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  magicText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#D97706',
    marginLeft: 4,
  },
  closeBtn: { padding: 8, backgroundColor: '#F3F4F6', borderRadius: 20 },
  formContainer: { padding: 20 },
  inputGroup: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 12, fontSize: 15, color: '#111827', backgroundColor: '#F9FAFB' },
  textArea: { height: 80, textAlignVertical: 'top' },
  imagePicker: { height: 180, borderRadius: 20, borderStyle: 'dashed', borderWidth: 2, borderColor: '#E5E7EB', overflow: 'hidden', marginBottom: 20, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center' },
  imagePreview: { width: '100%', height: '100%', resizeMode: 'cover' },
  imagePlaceholder: { alignItems: 'center', gap: 8 },
  imagePlaceholderText: { fontSize: 14, color: '#9CA3AF' },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#fff' },
  chipText: { fontSize: 13, color: '#6B7280', fontWeight: '600' },
  row: { flexDirection: 'row', marginBottom: 20 },
  difficultyRow: { flexDirection: 'column', gap: 6 },
  diffBtn: { padding: 8, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, alignItems: 'center' },
  diffBtnActive: { backgroundColor: '#FFF7ED', borderColor: '#F97316' },
  diffText: { fontSize: 12, color: '#6B7280' },
  diffTextActive: { color: '#F97316', fontWeight: 'bold' },
  dynamicRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  stepNum: { width: 28, height: 28, backgroundColor: '#F3F4F6', borderRadius: 14, justifyContent: 'center', alignItems: 'center', textAlign: 'center', lineHeight: 28, fontSize: 12, fontWeight: 'bold', color: '#6B7280' },
  tipHeader: { flexDirection: 'row', alignItems: 'center' },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#F3F4F6', position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff' },
  submitBtn: { height: 56, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  submitBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
});