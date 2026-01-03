import React, { useState,useEffect, useCallback } from 'react';
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
  Alert,
} from 'react-native'; 
import { ArrowLeft, Clock, ChefHat, Star } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';

import { doc, getDoc ,deleteDoc} from 'firebase/firestore';

import { Recipe } from '../models/Recipe';

import { CommentItem } from './CommentItem';

import { auth, db } from '../config/firebaseConfig';
import Config from "react-native-config"; 

import { collection, query, orderBy, onSnapshot ,addDoc ,increment,updateDoc , serverTimestamp} from 'firebase/firestore';

const AVT_DEFAULT = Config.AVT_DEFAULT!;

interface RecipeDetailProps {
  isOpen: boolean;       
  recipe: (Recipe & { postId?: string }) | null;
  onBack: () => void;    
  showSocialFeatures: boolean;
}

export function RecipeDetailModal({ isOpen, recipe , onBack, showSocialFeatures }: RecipeDetailProps) {
  const [userRating, setUserRating] = useState(0);
  const [commentsList, setCommentsList] = useState<any[]>([]); 
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [inputComment, setInputComment] = useState('');
  

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
  },[recipe?.postId]);


  useEffect(() => {
    if (!recipe?.postId) return;
    const q = query(
      collection(db, "CommunityPosts", recipe.postId, "Comments"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCommentsList(list);
      updateGlobalPostRating(list);
    });

    return () => unsubscribe();
  }, [recipe?.postId, updateGlobalPostRating]);

  if (!recipe) return null;

  // const handleSendComment = async () => {
  //   const user = auth.currentUser;
  //   if (!inputComment.trim() || !user || !recipe?.postId) return;
    
  //   try {
  //     let finalName = 'Người dùng';
  //     let finalAvatar = AVT_DEFAULT;
  //     const userDocRef = doc(db, "Users", user.uid);
  //     const userDocSnap = await getDoc(userDocRef);
  //     if (userDocSnap.exists()) {
  //           const userData = userDocSnap.data();
  //           finalName = userData.name || userData.userName || 'Người dùng'; 
  //           finalAvatar = userData.avatar || userData.userAvatar || AVT_DEFAULT;
  //       }
  //     const commentData = {
  //       rating: userRating || 0,
  //       content: inputComment.trim(),
  //       userId: user.uid,
  //       userName: finalName,
  //       userAvatar:finalAvatar,
  //       createdAt: serverTimestamp()
  //     };  

  //     await addDoc(collection(db, "CommunityPosts", recipe.postId, "Comments"), commentData);
  //     setInputComment(''); 
  //     setUserRating(0);  
  //     const postRef = doc(db, "CommunityPosts", recipe.postId);
  //     await updateDoc(postRef, {
  //       commentsCount: increment(1) 
  //     });
  //   } catch (error) {
  //     console.error("Lỗi gửi bình luận:", error);
  //   }
  // };

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

        Alert.alert("Thành công", "Đã xóa bình luận.");
    } catch (error) {
        console.error("Lỗi khi xóa bình luận:", error);
        Alert.alert("Lỗi", "Không thể xóa bình luận lúc này.");
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
        Alert.alert("Thành công", "Đã cập nhật bình luận");
      } else {
        let finalName = 'Người dùng';
        let finalAvatar = AVT_DEFAULT;

        // Lấy thông tin từ bảng Users
        const userDocRef = doc(db, "Users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          finalName = userData.name || userData.userName || 'Người dùng';
          finalAvatar = userData.avatar || userData.userAvatar || AVT_DEFAULT;
        }

        const commentData = {
          rating: userRating || 0,
          content: inputComment.trim(),
          userId: user.uid,
          userName: finalName,
          userAvatar: finalAvatar,
          createdAt: serverTimestamp()
        };

        await addDoc(collection(db, "CommunityPosts", recipe.postId, "Comments"), commentData);
        await updateDoc(postRef, {
          commentsCount: increment(1)
        });
      }
      setInputComment('');
      setUserRating(0);
    } catch (error) {
      console.error("Lỗi thao tác bình luận:", error);
      Alert.alert("Lỗi", "Không thể thực hiện thao tác này.");
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
          {/* --- Phần Hình ảnh Header --- */}
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
                  <Text style={styles.infoText}>{recipe.prepTime || 0} phút</Text>
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
          <LinearGradient 
          colors={['#1e1b4b', '#4c1d95', '#1e3a8a']}
          style={styles.contentBody}>
            
            {/* Mô tả */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Mô tả</Text>
              <Text style={styles.descriptionText}>
                {recipe.description || 'Chưa có mô tả cho món ăn này.'}
              </Text>
            </View>

            {/* Nguyên liệu */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Nguyên liệu</Text>
              {recipe.ingredients && recipe.ingredients.length > 0 ? (
                recipe.ingredients.map((ingredient, index) => (
                  <View key={index} style={styles.ingredientItem}>
                    <View style={styles.bulletPoint} />
                    <Text style={styles.ingredientText}>{ingredient}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>Chưa cập nhật nguyên liệu.</Text>
              )}
            </View>

            {/* Cách làm */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Cách làm</Text>
              {recipe.instructions && recipe.instructions.length > 0 ? (
                recipe.instructions.map((step, index) => (
                  <View key={index} style={styles.stepRow}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.stepText}>{step}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>Chưa cập nhật các bước thực hiện.</Text>
              )}
            </View>

            {/* Đánh giá của người dùng */}
            {showSocialFeatures && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Đánh giá của bạn</Text>
                <View style={styles.starRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity key={star} onPress={() => setUserRating(star)}>
                      <Star 
                        size={35} 
                        color={star <= userRating ? "#F97316" : "#D1D5DB"} 
                        fill={star <= userRating ? "#F97316" : "transparent"} 
                      />
                    </TouchableOpacity>
                  ))}
                </View>
                {userRating > 0 && (<>
                  <View style={styles.reviewInputContainer}>
                    {editingCommentId && (<>
                      <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5}}>
                          <Text style={{color: '#F97316', fontWeight: 'bold'}}>Đang sửa bình luận...</Text>
                          <TouchableOpacity onPress={() => {
                              setEditingCommentId(null);
                              setInputComment('');
                              setUserRating(0);
                          }}>
                              <Text style={{color: '#EF4444'}}>Hủy sửa</Text>
                          </TouchableOpacity>
                      </View>
                    </>)}
                    <TextInput
                      placeholder="Chia sẻ cảm nghĩ của bạn..."
                      placeholderTextColor="#9CA3AF"
                      multiline
                      style={styles.input}
                      value={inputComment}
                      onChangeText={setInputComment}
                    />
                    <TouchableOpacity 
                        style={[styles.submitButton, editingCommentId && {backgroundColor: '#10B981'}]} 
                        onPress={handleActionComment}
                    >
                        <Text style={styles.submitButtonText}>
                            {editingCommentId ? "Cập nhật bình luận" : "Gửi đánh giá"}
                        </Text>
                    </TouchableOpacity>
                  </View>
                </>)}
                <View style={[styles.card, { marginBottom: 50 }]}>
                    <Text style={styles.sectionTitle}>Bình luận ({commentsList.length})</Text>
                    {commentsList.map((item) => (
                      <CommentItem 
                        key={item.id} 
                        comment={item} 
                        isMine ={item.userId === auth.currentUser?.uid} 
                        isPostOwner ={recipe?.idUser === auth.currentUser?.uid} 
                        onDelete={handleDeleteComment}
                        onEdit={handlePrepareEdit}
                      />
                    ))}
                  </View>
              </View>
            )}

          </LinearGradient>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FEF3C7' 
  },
  scrollContent: { 
    flexGrow: 1 
  },
  imageContainer: { 
    height: 380, 
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
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 10,
    borderRadius: 25,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  titleOverlay: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
  },
  recipeName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5
  },
  infoRow: { 
    flexDirection: 'row', 
    gap: 15 
  },
  infoItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  infoText: { 
    color: '#FFF', 
    fontSize: 13, 
    fontWeight: '600' 
  },
  contentBody: { 
    padding: 20, 
    marginTop: -30, 
    borderTopLeftRadius: 30, 
    borderTopRightRadius: 30, 
    backgroundColor: '#FEF3C7' 
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: '#1F2937', 
    marginBottom: 12 
  },
  descriptionText: { 
    fontSize: 15, 
    color: '#4B5563', 
    lineHeight: 22 
  },
  ingredientItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 10, 
    gap: 12 
  },
  bulletPoint: { 
    width: 6, 
    height: 6, 
    borderRadius: 3, 
    backgroundColor: '#F97316' 
  },
  ingredientText: { 
    fontSize: 15, 
    color: '#374151' 
  },
  stepRow: { 
    flexDirection: 'row', 
    marginBottom: 18, 
    gap: 14 
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F97316',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: { 
    color: '#FFF', 
    fontWeight: 'bold', 
    fontSize: 14 
  },
  stepText: { 
    flex: 1, 
    fontSize: 15, 
    color: '#374151', 
    lineHeight: 22 
  },
  starRow: { 
    flexDirection: 'row', 
    gap: 12, 
    justifyContent: 'center', 
    marginVertical: 10 
  },
  reviewInputContainer: { 
    marginTop: 15 
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    textAlignVertical: 'top',
    marginBottom: 12,
    color: '#1F2937'
  },
  submitButton: {
    backgroundColor: '#F97316',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: { 
    color: '#FFF', 
    fontWeight: 'bold', 
    fontSize: 16 
  },
  reviewItem: { 
    borderBottomWidth: 1, 
    borderBottomColor: '#F3F4F6', 
    paddingVertical: 12 
  },
  reviewHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 4 
  },
  userName: { 
    fontWeight: '700', 
    color: '#1F2937', 
    fontSize: 14 
  },
  reviewDate: { 
    fontSize: 11, 
    color: '#9CA3AF' 
  },
  reviewStars: { 
    flexDirection: 'row', 
    marginBottom: 6, 
    gap: 2 
  },
  reviewComment: { 
    fontSize: 13, 
    color: '#4B5563', 
    lineHeight: 18 
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic'
  },
  
});