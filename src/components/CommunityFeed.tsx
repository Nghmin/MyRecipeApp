import React, { useState, useEffect ,useRef } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, 
  FlatList, Image
} from 'react-native';
import { Users, Plus, Heart, Bookmark, Star,MessageCircle , Trash2 , ChevronUp ,SearchX
 } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { collection, query, orderBy, onSnapshot, doc, 
  updateDoc, arrayUnion, arrayRemove ,where, deleteDoc , getDoc ,limit ,documentId ,getDocs
} from 'firebase/firestore';

import { db, auth } from '../config/firebaseConfig';
import Config from "react-native-config"; 

import { CommunityPost } from '../models/CommunityPost';

import {FilterBar} from './FilterBar';

import { FavoriteService } from '../services/favoriteService'

import { formatRelativeTime } from '../utils/dateUtils';

import Toast from 'react-native-toast-message';

const AVT_DEFAULT = Config.AVATAR_DEFAULT ;

interface CommunityFeedProps {
  onOpenShareModal?: () => void;
  mode?: 'all' | 'favorites' | 'mine';
  onPressDetailPost?: (post: CommunityPost) => void;
  onFavoriteChange?: (post: any) => void;
}

export function CommunityFeed({ onOpenShareModal ,mode = 'all',onPressDetailPost, onFavoriteChange}: CommunityFeedProps) {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('newest');

  const listRef = useRef<FlatList>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);

  const currentUser = auth.currentUser;
  
  useEffect(() => {
    const fetchFavs = async () => {
      const favs = await FavoriteService.getFavorites();
      setFavoriteIds(favs.map((f: any) => f.postId));
    };
    fetchFavs();
  }, []);

  useEffect(() => {
    let unsubscribe: () => void;
    const user = auth.currentUser;
    if (!user) return;

    if (mode === 'favorites') {
      const favRef = collection(db, "Users", user.uid, "Favorites");
      unsubscribe = onSnapshot(favRef, async (snapshot) => {
        const favIds = snapshot.docs.map(doc => doc.id);
        
        if (favIds.length > 0) {
          const qPosts = query(
            collection(db, "CommunityPosts"), 
            where(documentId(), "in", favIds) 
          );  
          const postSnap = await getDocs(qPosts);
          const data = postSnap.docs.map(doc => ({ 
            postId: doc.id,
            ...doc.data() 
          })) as CommunityPost[];
          setPosts(data);
        } else {
          setPosts([]);
        }
        setLoading(false);
      });
    } else {
      let q = mode === 'mine' 
        ? query(collection(db, "CommunityPosts"), where("idUser", "==", user.uid), orderBy("sharedAt", "desc"))
        : query(collection(db, "CommunityPosts"), orderBy("sharedAt", "desc"), limit(10));

      unsubscribe = onSnapshot(q, (snapshot) => {
        const feedData = snapshot.docs.map(doc => ({ postId: doc.id, ...doc.data() })) as CommunityPost[];
        setPosts(feedData);
        setLoading(false);
      });
    }

    return () => unsubscribe?.();
  }, [mode]);

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
  const toastConfirmShow = async ( type: string,title : string,text: string , props?: any) => {
      Toast.show({
          type: type,       
          text1: title ,
          text2: text,
          position: 'top',    
          autoHide: false,
          props: props 
      });
  }

  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setShowBackToTop(offsetY > 500);
  };

  const scrollToTop = () => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const handleLike = async (post: CommunityPost) => {
    if (!currentUser) return;
    const isLiked = post.likedBy?.includes(currentUser.uid);
    const updatedData = {
      likedBy: isLiked ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid),
      likesCount: isLiked ? Math.max(0, (post.likesCount || 1) - 1) : (post.likesCount || 0) + 1
    };
    try {
      const postRef = doc(db, "CommunityPosts", post.postId);
      await updateDoc(postRef, updatedData);

      const favRef = doc(db, "Users", currentUser.uid, "Favorites", post.postId);
      const favSnap = await getDoc(favRef);

      if (favSnap.exists()) {
    
      await updateDoc(favRef, updatedData);
    }

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
        toastShow(
            'success',
            'Thành công!',
            'Bạn đã thêm bài đăng vào danh sách yêu thích.',
        )
      } else {
        setFavoriteIds(prev => prev.filter(id => id !== post.postId));
        toastShow(
            'success',
            'Thành công!',
            'Bạn đã xóa bài đăng trong danh sách yêu thích.',
        )
      }
      
    } catch (error) {
      toastShow(
            'error',
            'Lỗi!',
            'Không thể cập nhật danh sách yêu thích.',
      )
      console.log(error)
    }
  };

  const handleDeletePost = async (postId: string) => {
    toastConfirmShow(
      'confirm',              
      'Xác nhận xóa bài?',
      'Bài đăng này sẽ bị xóa vĩnh viễn khỏi cộng đồng.',
      {
        onConfirm: async () => {
          try {
            await deleteDoc(doc(db, "CommunityPosts", postId));
            toastShow(
              'success',
              'Thành công!',
              'Bạn đã xóa bài viết khỏi cộng đồng',
            )
          } catch (e) { 
            console.log(e);
            toastShow('error', 'Lỗi', 'Không thể xóa bài đăng lúc này.');
          }
        }
      }
    );
  };

  const filteredPosts = posts.filter(post => {
    const name = post?.name || "";
    return name.toLowerCase().includes(searchQuery.toLowerCase())
  }).sort((a, b) => {
    switch (activeFilter) {
      case 'likes':
        return (b.likesCount || 0) - (a.likesCount || 0);
      case 'comments':
        return (b.commentsCount || 0) - (a.commentsCount || 0);
      case 'rating':
        return (b.rating || 0) - (a.rating || 0);
      default:
        return (b.sharedAt?.seconds || 0) - (a.sharedAt?.seconds || 0);
    }
  });

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
        data={filteredPosts}
        ref={listRef}
        onScroll={handleScroll}
        keyExtractor={(item) => item.postId}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        initialNumToRender={5} 
        maxToRenderPerBatch={10}
        windowSize={5}
        ListHeaderComponent={
          <FilterBar 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />
        }
        ListEmptyComponent={() => (
          <View style={{ alignItems: 'center', marginTop: 100, paddingHorizontal: 40 }}>
            <SearchX size={50} color="#ee6103ff" />
            <Text style={{ color: 'hsla(27, 98%, 48%, 1.00)', fontSize: 16, marginTop: 15, textAlign: 'center' }}>
              {searchQuery 
                ? `Không tìm thấy kết quả cho "${searchQuery}"` 
                : "Chưa có bài đăng nào trong mục này."}
            </Text>
          </View>
        )}

        renderItem={({ item, index }) => {
          const isMine = item.idUser === currentUser?.uid;
          const isLiked = item.likedBy?.includes(currentUser?.uid || '');
          return(
            <Animated.View entering={FadeInUp.delay(index * 100)}>
              <PostCard 
                post={item} 
                onPress={() => onPressDetailPost?.(item)}
                onLike={() => handleLike(item)}
                isLiked={isLiked}
                onSave={() => {
                  handleToggleSave(item)
                  onFavoriteChange?.(item)
                }}
                isSaved={favoriteIds.includes(item.postId)}
                isMine ={isMine}
                onDelete={() => handleDeletePost(item.postId)}
              />
            </Animated.View>
          )
        }}
      />

      {showBackToTop && (
        <TouchableOpacity 
          style={styles.backToTopBtn} 
          onPress={scrollToTop}
          activeOpacity={0.8}
        >
          <ChevronUp color="white" size={30} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const PostCard = ({ post, onLike, isLiked ,onSave, isSaved ,onPress ,isMine ,onDelete}: {
   post: CommunityPost, 
   onLike: () => void, 
   isLiked: boolean , 
   onSave: () => void,
   isSaved: boolean ,
   onPress?: () => void,
   isMine: boolean,
   onDelete : () => void,
}) => (
  <View style={cardStyles.card}>
    <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
      <View style={cardStyles.userInfo}>
        <Image source={{ uri: post.userAvatar || AVT_DEFAULT }} style={cardStyles.avatar} />
        <Text style={cardStyles.userName}>{post.userName}</Text>
        <View style={cardStyles.ratingContainer}>
          <Text style={cardStyles.userRating}>{post.rating}</Text>
          <Star style={cardStyles.starContainer} size ={10} color ='#FBBF24' fill ='#FBBF24'/>
        </View>
        <Text style={{ color: '#ebeff5ff', fontSize: 11 }}>
          {formatRelativeTime(post.sharedAt)}
        </Text>
        
        {isMine &&  (
          <TouchableOpacity style ={cardStyles.deleteBnt} onPress ={onDelete}>
            <Trash2 size={22} color= '#F97316' />
          </TouchableOpacity>
        )}
      </View>

      <Image source={{ uri: post.image }} style={cardStyles.postImage} />
    </TouchableOpacity>

    <View style={cardStyles.footer}>
      <View style={cardStyles.actions}>
        <TouchableOpacity style={cardStyles.actionBtn} onPress={onLike}>
          <Heart size={22} color={isLiked ? "#EF4444" : "#E5E7EB"} fill={isLiked ? "#EF4444" : "none"} />
          <Text style={cardStyles.actionText}>{post.likesCount || 0}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={cardStyles.actionBtn} onPress={onPress}>
          <MessageCircle size={22} color="#E5E7EB" />
          <Text style={cardStyles.actionText}>{post.commentsCount || 0}</Text>
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
    padding : 5,
    backgroundColor: 'rgba(45, 48, 49, 0.88)', 
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#F97316',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  title: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  subtitle: { color: '#f3ececff', fontSize: 12 },
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
  backToTopBtn: {
    position: 'absolute',
    bottom: 35,
    right: 20,
    backgroundColor: '#F97316',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
  },
  
});

const cardStyles = StyleSheet.create({
  card: { 
    backgroundColor: 'rgba(39, 76, 87, 0.88)', 
    borderRadius: 20, 
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#F97316',
  },
  
  userInfo: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  deleteBnt: {position: 'absolute',right: 15},
  avatar: { width: 35, height: 35, borderRadius: 17.5 , },
  userName: { color: 'white', fontWeight: '600' },
  ratingContainer:{
    flexDirection: 'row',
    alignItems: 'center',
  },
  starContainer: {
    marginLeft: 0,
    gap: 2, 
  },
  userRating:{
    color: 'white',
    fontSize: 12,
    fontWeight: '400',
    paddingRight: 2,
  },
  postImage: { width: '100%', height: 250 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, alignItems: 'center' },
  actions: { flexDirection: 'row', gap: 15 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionText: { color: 'white', fontSize: 14 },
  content: { paddingHorizontal: 12, paddingBottom: 15 ,  },
  recipeName: { color: 'white', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  description: { color: '#f3f4f5ff', fontSize: 13 },
  
});