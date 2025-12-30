import React, { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, 
  FlatList, Image, Alert
} from 'react-native';
import { Users, Plus, Heart, Bookmark, MessageCircle } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

import { db, auth } from '../config/firebaseConfig';

import { Recipe } from '../models/Recipe';

import { FavoriteService } from '../services/favoriteService'

interface CommunityPost extends Recipe {
  postId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  likesCount: number;
  likedBy: string[];
  sharedAt: any;
}

interface CommunityFeedProps {
  onOpenShareModal?: () => void;
  mode?: 'all' | 'favorites';
  onPressDetailPost?: (post: CommunityPost) => void;
  onFavoriteChange?: (post: any) => void;
}

export function CommunityFeed({ onOpenShareModal ,mode = 'all',onPressDetailPost, onFavoriteChange}: CommunityFeedProps) {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const currentUser = auth.currentUser;

  useEffect(() => {
    const fetchFavs = async () => {
      const favs = await FavoriteService.getFavorites();
      setFavoriteIds(favs.map((f: any) => f.postId));
    };
    fetchFavs();
  }, []);

  useEffect(() => {
    let q;
    if (mode === 'favorites'){
      q = query(collection(db, "Users", auth.currentUser?.uid || '', "Favorites"), orderBy("addedAt", "desc"));
    } else {
      q = query(collection(db, "CommunityPosts"), orderBy("sharedAt", "desc"));
    }
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const feedData = snapshot.docs.map(doc => ({
        postId: doc.id,
        ...doc.data()
      })) as CommunityPost[];
      
      setPosts(feedData);
      setLoading(false);
    }, (error) => {
      console.error("Lỗi lấy feed:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [mode]);

  const handleLike = async (post: CommunityPost) => {
    if (!currentUser) return;
    const postRef = doc(db, "CommunityPosts", post.postId);
    const isLiked = post.likedBy?.includes(currentUser.uid);

    try {
      await updateDoc(postRef, {
        likedBy: isLiked ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid),
        likesCount: isLiked ? Math.max(0, post.likesCount - 1) : (post.likesCount || 0) + 1
      });
    } catch (error) {
      console.error("Lỗi khi like:", error);
    }
  };

  const handleToggleSave = async (post: CommunityPost) => {
    const isSaved = favoriteIds.includes(post.postId);
    try {
      const result = await FavoriteService.toggleFavorite(post, isSaved);
      if (result) {
        setFavoriteIds(prev => [...prev, post.postId]);
      } else {
        setFavoriteIds(prev => prev.filter(id => id !== post.postId));
      }
    } catch (error) {
      Alert.alert("Lỗi", "Không thể cập nhật danh sách yêu thích");
      console.log(error)
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#F97316" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {mode === 'all' && (
      <>{/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <LinearGradient colors={['#F97316', '#FF6347']} style={styles.iconBox}>
              <Users size={20} color="white" />
            </LinearGradient>
            <View>
              <Text style={styles.title}>Cộng đồng</Text>
              <Text style={styles.subtitle}>Công thức từ mọi người</Text>
            </View>
          </View>

          <TouchableOpacity onPress={() => onOpenShareModal?.()} style={styles.shareButton}>
            <Plus size={18} color="white" />
            <Text style={styles.shareText}>Đăng bài</Text>
          </TouchableOpacity>
        </View>
      </>)}

      {/* List Posts */}
      <FlatList
        data={posts}
        keyExtractor={(item) => item.postId}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInUp.delay(index * 100)}>
            <PostCard 
              post={item} 
              onPress={() => onPressDetailPost?.(item)}
              onLike={() => handleLike(item)}
              isLiked={item.likedBy?.includes(currentUser?.uid || '')}
              onSave={() => {
                handleToggleSave(item)
                onFavoriteChange?.(item)
              }}
              isSaved={favoriteIds.includes(item.postId)}
              
            />
          </Animated.View>
        )}
      />
    </View>
  );
}

// --- Component Card cho từng bài đăng ---
const PostCard = ({ post, onLike, isLiked ,onSave, isSaved ,onPress}: {
   post: CommunityPost, 
   onLike: () => void, 
   isLiked: boolean , 
   onSave: () => void,
   isSaved: boolean 
   onPress?: () => void
}) => (
  <View style={cardStyles.card}>
    <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
      <View style={cardStyles.userInfo}>
        <Image source={{ uri: post.userAvatar || 'https://via.placeholder.com/150' }} style={cardStyles.avatar} />
        <Text style={cardStyles.userName}>{post.userName}</Text>
      </View>

      <Image source={{ uri: post.image }} style={cardStyles.postImage} />
    </TouchableOpacity>

    <View style={cardStyles.footer}>
      <View style={cardStyles.actions}>
        <TouchableOpacity style={cardStyles.actionBtn} onPress={onLike}>
          <Heart size={22} color={isLiked ? "#EF4444" : "#E5E7EB"} fill={isLiked ? "#EF4444" : "none"} />
          <Text style={cardStyles.actionText}>{post.likesCount || 0}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={cardStyles.actionBtn}>
          <MessageCircle size={22} color="#E5E7EB" />
          <Text style={cardStyles.actionText}>0</Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity onPress={onSave}>
        <Bookmark size={22} 
          color={isSaved ? "#F97316" : "#E5E7EB"} 
          fill={isSaved ? "#F97316" : "none"} />
      </TouchableOpacity>
    </View>

    <View style={cardStyles.content}>
      <Text style={cardStyles.recipeName}>{post.name}</Text>
      <Text style={cardStyles.description} numberOfLines={2}>{post.description}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 15 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginVertical: 15 
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  title: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  subtitle: { color: '#9CA3AF', fontSize: 12 },
  shareButton: { 
    flexDirection: 'row', 
    backgroundColor: '#F97316', 
    paddingHorizontal: 15, 
    paddingVertical: 8, 
    borderRadius: 10,
    alignItems: 'center',
    gap: 5
  },
  shareText: { color: 'white', fontWeight: 'bold' },
});

const cardStyles = StyleSheet.create({
  card: { 
    backgroundColor: 'rgba(255,255,255,0.1)', 
    borderRadius: 20, 
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  userInfo: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  avatar: { width: 35, height: 35, borderRadius: 17.5 },
  userName: { color: 'white', fontWeight: '600' },
  postImage: { width: '100%', height: 250 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, alignItems: 'center' },
  actions: { flexDirection: 'row', gap: 15 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionText: { color: 'white', fontSize: 14 },
  content: { paddingHorizontal: 12, paddingBottom: 15 },
  recipeName: { color: 'white', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  description: { color: '#D1D5DB', fontSize: 13 },
});