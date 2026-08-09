import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Modal,
  StatusBar,
} from 'react-native';
import { ArrowLeft, Clock, ChefHat, Star } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';

import { doc, deleteDoc } from 'firebase/firestore';

import { Recipe } from '../models/Recipe';

import { CommentItem } from './CommentItem';

import { auth, db } from '../config/firebaseConfig';
import Config from "react-native-config";
import Toast from 'react-native-toast-message';

import { useTheme } from '../theme/ThemeContext';
import { useUser } from '../theme/UserContext';
import { NotificationService } from '../services/notificationService';

import { collection, query, orderBy, onSnapshot, addDoc, increment, updateDoc, serverTimestamp } from 'firebase/firestore';

const AVT_DEFAULT = Config.AVT_DEFAULT!;

const normalizeCategories = (cat: any): string[] => {
  if (!cat) return [];
  if (Array.isArray(cat)) return cat;
  if (typeof cat === 'string') return cat.split(',').map((c: string) => c.trim()).filter((c: string) => c !== '');
  return [];
};

interface RecipeDetailProps {
  isOpen: boolean;
  recipe: (Recipe & { postId?: string }) | null;
  onBack: () => void;
  showSocialFeatures: boolean;
  onDeleteRecipe?: (id: string, name: string) => void;
}

export function RecipeDetailModal({ isOpen, recipe, onBack, showSocialFeatures, onDeleteRecipe }: RecipeDetailProps) {
  const [userRating, setUserRating] = useState(0);
  const [commentsList, setCommentsList] = useState<any[]>([]);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [inputComment, setInputComment] = useState('');

  const { currentTheme } = useTheme();
  const { userProfile } = useUser();

  const updateGlobalPostRating = useCallback(async (list: any[]) => {
    if (!recipe?.postId) return;
    try {
      const ratedComments = list.filter(c => c.rating > 0);
      let finalRating = 5.0;
      if (ratedComments.length > 0) {
        const total = ratedComments.reduce((sum, item) => sum + item.rating, 0);
        finalRating = parseFloat((total / ratedComments.length).toFixed(1));
      }
      const postRef = doc(db, "CommunityPosts", recipe.postId);
      await updateDoc(postRef, {
        rating: finalRating
      });

      console.log("Đã cập nhật Rating Firestore:", finalRating);
    } catch (error) {
      console.error("Lỗi cập nhật Global Rating:", error);
    }
  }, [recipe?.postId]);


  useEffect(() => {
    if (!recipe?.postId) return;
    const q = query(
      collection(db, "CommunityPosts", recipe.postId, "Comments"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setCommentsList(list);
      updateGlobalPostRating(list);
    });

    return () => unsubscribe();
  }, [recipe?.postId, updateGlobalPostRating]);

  const toastShow = (type: string, title: string, text: string) => {
    Toast.show({
      type: type,
      text1: title,
      text2: text,
      position: 'top',
      topOffset: 60,
      visibilityTime: 3000,
      props: { primaryColor: currentTheme.primary }
    });
  }

  if (!recipe) return null;

  const calculateAverageRating = () => {
    if (commentsList.length === 0) return recipe.rating || 5.0;
    const ratedComments = commentsList.filter(c => c.rating > 0);
    if (ratedComments.length === 0) return recipe.rating || 5.0;

    const total = ratedComments.reduce((sum, item) => sum + item.rating, 0);
    return (total / ratedComments.length).toFixed(1);
  };


  const averageRating = calculateAverageRating();

  const handleDeleteComment = async (commentId: string) => {
    try {
      if (!recipe?.postId) return;

      const commentRef = doc(db, "CommunityPosts", recipe.postId, "Comments", commentId);
      await deleteDoc(commentRef);

      const postRef = doc(db, "CommunityPosts", recipe.postId);
      await updateDoc(postRef, {
        commentsCount: increment(-1)
      });
      toastShow(
        'success',
        'Thành công!',
        'Đã xóa bình luận 🎉.',
      )
    } catch (error) {
      console.error("Lỗi khi xóa bình luận:", error);
      toastShow(
        'error',
        'Lỗi!',
        'Không thể xóa bình luận lúc này.',
      )
    }
  };
  const handlePrepareEdit = (comment: any) => {
    setInputComment(comment.content);
    setUserRating(comment.rating);
    setEditingCommentId(comment.id);
  };

  const handleActionComment = async () => {
    const user = auth.currentUser;
    if (!inputComment.trim() || !user || !recipe?.postId) return;

    try {
      const postRef = doc(db, "CommunityPosts", recipe.postId);

      if (editingCommentId) {
        // Sửa comment
        const commentRef = doc(db, "CommunityPosts", recipe.postId, "Comments", editingCommentId);
        await updateDoc(commentRef, {
          content: inputComment.trim(),
          rating: userRating,
          updatedAt: serverTimestamp()
        });
        setEditingCommentId(null);
        toastShow(
          'success',
          'Thành công!',
          'Đã cập nhật bình luận 🎉.',
        )
      } else {
        const commentData = {
          rating: userRating || 0,
          content: inputComment.trim(),
          userId: user.uid,
          userName: userProfile?.name || 'Người dùng',
          userAvatar: userProfile?.avatar || AVT_DEFAULT,
          createdAt: serverTimestamp()
        };

        await addDoc(collection(db, "CommunityPosts", recipe.postId, "Comments"), commentData);
        await updateDoc(postRef, {
          commentsCount: increment(1)
        });

        // Gửi thông báo cho chủ bài viết
        if (recipe.idUser !== user.uid) {
          await NotificationService.sendNotification(
            recipe.idUser,
            userProfile?.name || 'Người dùng',
            userProfile?.avatar || AVT_DEFAULT,
            'comment',
            recipe.postId
          );
        }
      }
      setInputComment('');
      setUserRating(0);
    } catch (error) {
      console.error("Lỗi thao tác bình luận:", error);
      toastShow(
        'error',
        'Lỗi!',
        'Không thể thực hiện thao tác này.',
      )
    }
  };

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onBack}
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Phần Hình ảnh Header */}
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: recipe.image || AVT_DEFAULT }}
              style={styles.headerImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['rgba(0,0,0,0.4)', 'transparent', 'rgba(0,0,0,0.8)']}
              style={styles.gradientOverlay}
            />
            {/* Nút Quay lại */}
            <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
              <ArrowLeft size={24} color="#1F2937" />
            </TouchableOpacity>

            {/* Thông tin tiêu đề nằm trên ảnh */}
            <View style={styles.titleOverlay}>
              <Text style={styles.recipeName}>{recipe.name}</Text>
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Clock size={16} color="#FFF" />
                  {recipe.cookTime ? (
                    <Text style={styles.infoText}>
                      {recipe.cookTime.includes('phút') ? recipe.cookTime : `${recipe.cookTime} phút`}
                    </Text>
                  ) : (
                    <Text style={styles.infoText}>{recipe.prepTime || '0'} phút</Text>
                  )}
                </View>
                <View style={styles.infoItem}>
                  <ChefHat size={16} color="#FFF" />
                  <Text style={styles.infoText}>{recipe.difficulty || 'Dễ'}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Star size={16} color="#FBBF24" fill="#FBBF24" />
                  <Text style={styles.infoText}>{averageRating}</Text>
                </View>
              </View>
            </View>
          </View>

          {/*Nội dung */}
          <View style={styles.contentBody}>

            {/* Mô tả */}
            <View style={styles.card}>
              <Text style={[styles.sectionTitle, { color: '#FFF' }]}>Mô tả</Text>
              <Text style={styles.descriptionText}>
                {recipe.description || 'Chưa có mô tả cho món ăn này.'}
              </Text>
            </View>

            {/* Danh mục */}
            {(normalizeCategories(recipe.category).length > 0) && (
              <View style={styles.card}>
                <Text style={[styles.sectionTitle, { color: '#FFF' }]}>Danh mục</Text>
                <View style={styles.categoriesContainer}>
                  {normalizeCategories(recipe.category).map((category: any, index: number) => (
                    <View key={index} style={[styles.categoryItem, { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)', borderWidth: 1 }]}>
                      <Text style={[styles.categoryText, { color: '#CBD5E1', fontWeight: 'bold' }]}>{category}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Nguyên liệu */}
            <View style={styles.card}>
              <Text style={[styles.sectionTitle, { color: '#FFF' }]}>Nguyên liệu</Text>
              {recipe.ingredients && recipe.ingredients.length > 0 ? (
                recipe.ingredients.map((ingredient, index) => (
                  <View key={index} style={styles.ingredientItem}>
                    <View style={[styles.bulletPoint, { backgroundColor: currentTheme.primary }]} />
                    <Text style={styles.ingredientText}>{ingredient}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>Chưa cập nhật nguyên liệu.</Text>
              )}
            </View>

            {/* Cách làm */}
            <View style={styles.card}>
              <Text style={[styles.sectionTitle, { color: '#FFF' }]}>Cách làm</Text>
              {recipe.instructions && recipe.instructions.length > 0 ? (
                recipe.instructions.map((step, index) => (
                  <View key={index} style={styles.stepRow}>
                    <View style={[styles.stepNumber, { backgroundColor: currentTheme.primary }]}>
                      <Text style={styles.stepNumberText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.stepText}>{step}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>Chưa cập nhật các bước thực hiện.</Text>
              )}
            </View>

            {/* Nút xóa cho món AI */}
            {(!showSocialFeatures && recipe.idRecipe) && (
              <TouchableOpacity
                style={styles.deleteRecipeBtn}
                onPress={() => onDeleteRecipe && onDeleteRecipe(recipe.idRecipe!, recipe.name)}
              >
                <Text style={styles.deleteRecipeText}>Xóa công thức này khỏi lịch sử</Text>
              </TouchableOpacity>
            )}

            {/* Đánh giá của người dùng */}
            {showSocialFeatures && (
              <View style={styles.card}>
                <Text style={[styles.sectionTitle, { color: '#FFF' }]}>Đánh giá của bạn</Text>
                <View style={styles.starRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity key={star} onPress={() => setUserRating(star)}>
                      <Star
                        size={35}
                        color={star <= userRating ? "#FBBF24" : "rgba(255,255,255,0.2)"}
                        fill={star <= userRating ? "#FBBF24" : "transparent"}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
                {userRating > 0 && (<>
                  <View style={styles.reviewInputContainer}>
                    {editingCommentId && (<>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                        <Text style={{ color: "#FBBF24", fontWeight: 'bold' }}>Đang sửa bình luận...</Text>
                        <TouchableOpacity onPress={() => {
                          setEditingCommentId(null);
                          setInputComment('');
                          setUserRating(0);
                        }}>
                          <Text style={{ color: '#EF4444' }}>Hủy sửa</Text>
                        </TouchableOpacity>
                      </View>
                    </>)}
                    <TextInput
                      placeholder="Chia sẻ cảm nghĩ của bạn..."
                      placeholderTextColor="#94A3B8"
                      multiline
                      style={styles.input}
                      value={inputComment}
                      onChangeText={setInputComment}
                    />
                    <TouchableOpacity
                      style={[styles.submitButton, {backgroundColor: currentTheme.primary}, editingCommentId && { backgroundColor: '#10B981' }]}
                      onPress={handleActionComment}
                    >
                      <Text style={styles.submitButtonText}>
                        {editingCommentId ? "Cập nhật bình luận" : "Gửi đánh giá"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>)}
                <View style={[styles.commentSection, { marginTop: 20 }]}>
                  <Text style={[styles.sectionTitle, { color: '#FFF' }]}>Bình luận ({commentsList.length})</Text>
                  {commentsList.map((item) => (
                    <CommentItem
                      key={item.id}
                      comment={item}
                      isMine={item.userId === auth.currentUser?.uid}
                      isPostOwner={recipe?.idUser === auth.currentUser?.uid}
                      onDelete={handleDeleteComment}
                      onEdit={handlePrepareEdit}
                      isDark={true}
                    />
                  ))}
                </View>
              </View>
            )}

          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E2E8F0'
  },
  scrollContent: {
    flexGrow: 1
  },
  imageContainer: {
    height: 420,
    width: '100%',
    position: 'relative'
  },
  headerImage: {
    width: '100%',
    height: '100%'
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 10,
    borderRadius: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  titleOverlay: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
  },
  recipeName: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFF',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 6
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  infoText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700'
  },
  contentBody: {
    padding: 20,
    marginTop: -40,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    backgroundColor: '#E2E8F0',
    paddingBottom: 100,
  },
  card: {
    backgroundColor: 'rgba(30, 41, 59, 0.95)',
    borderRadius: 28,
    padding: 24,
    marginBottom: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  descriptionText: {
    fontSize: 15,
    color: '#CBD5E1',
    lineHeight: 24,
    fontWeight: '400',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 13,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 12,
    borderRadius: 16,
  },
  bulletPoint: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  ingredientText: {
    fontSize: 15,
    color: '#E2E8F0',
    fontWeight: '500',
  },
  stepRow: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 16,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 14
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    color: '#E2E8F0',
    lineHeight: 24,
  },
  starRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    marginVertical: 15
  },
  reviewInputContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    height: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
    color: '#FFF',
    fontSize: 15,
  },
  submitButton: {
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  commentSection: {
    width: '100%',
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  deleteRecipeBtn: {
    padding: 15,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    alignItems: 'center',
    marginBottom: 20,
  },
  deleteRecipeText: {
    color: '#EF4444',
    fontWeight: '700',
    fontSize: 14,
  },
});
