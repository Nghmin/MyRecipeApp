import React, { useState, useEffect, useRef, useCallback, memo, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,
  FlatList, Image
} from 'react-native';
import {
  Users, Plus, Heart, Bookmark, Star, MessageCircle, Trash2, ChevronUp, SearchX
} from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import {
  collection, query, orderBy, onSnapshot, doc,
  where, deleteDoc, limit, documentId, getDocs
} from 'firebase/firestore';

import { db, auth } from '../config/firebaseConfig';
import Config from "react-native-config";
import { CommunityPost } from '../models/CommunityPost';
import { FilterBar } from './FilterBar';
import { FavoriteService } from '../services/favoriteService';
import { InteractionService } from '../services/interactionService';
import { formatRelativeTime } from '../utils/dateUtils';
import Toast from 'react-native-toast-message';
import { useTheme } from '../theme/ThemeContext';
import { useUser } from '../theme/UserContext';

const AVT_DEFAULT = Config.AVATAR_DEFAULT;

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 15 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(45, 48, 49, 0.88)',
    borderRadius: 15,
    borderWidth: 1,
  },
  headerMain: { marginTop: 10, marginHorizontal: 0, borderWidth: 2 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  title: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  subtitle: { color: '#f3ececff', fontSize: 12 },
  shareButton: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    gap: 5
  },
  shareText: { color: 'white', fontWeight: 'bold' },
  backToTopBtn: {
    position: 'absolute',
    bottom: 70,
    right: 20,
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
  newPostsContainer: {
    position: 'absolute',
    top: 130,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 99999,
    elevation: 100,
  },
  newPostsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    backgroundColor: '#3B82F6',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  newPostsText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  listContent: { paddingBottom: 100 },
  footerLoader: { paddingVertical: 20 },
  emptyContainer: { alignItems: 'center', marginTop: 100, paddingHorizontal: 40 },
  emptyText: { color: 'white', fontSize: 16, marginTop: 15, textAlign: 'center' },
});

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(39, 76, 87, 0.88)',
    borderRadius: 20,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 2,
  },
  userInfo: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  deleteBtn: { position: 'absolute', right: 15 },
  avatar: { width: 35, height: 35, borderRadius: 17.5 },
  userName: { color: 'white', fontWeight: '600' },
  ratingContainer: { flexDirection: 'row', alignItems: 'center' },
  starIcon: { marginLeft: 0, gap: 2 },
  userRating: { color: 'white', fontSize: 12, fontWeight: '400', paddingRight: 2 },
  sharedAt: { color: '#ebeff5ff', fontSize: 11 },
  postImage: { width: '100%', height: 250 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, alignItems: 'center' },
  actions: { flexDirection: 'row', gap: 15 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionText: { color: 'white', fontSize: 14 },
  content: { paddingHorizontal: 12, paddingBottom: 15 },
  recipeName: { color: 'white', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  description: { color: '#f3f4f5ff', fontSize: 13 },
});

interface CommunityFeedProps {
  onOpenShareModal?: () => void;
  mode?: 'all' | 'favorites' | 'mine';
  onPressDetailPost?: (post: CommunityPost) => void;
  onFavoriteChange?: (post: any) => void;
  ListHeaderComponent?: React.ReactElement;
}

export function CommunityFeed({
  onOpenShareModal,
  mode = 'all',
  onPressDetailPost,
  onFavoriteChange,
  ListHeaderComponent
}: CommunityFeedProps) {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [newPostsBuffer, setNewPostsBuffer] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [displayLimit, setDisplayLimit] = useState(10);
  const [hasMore, setHasMore] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('newest');

  const listRef = useRef<FlatList>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);

  const { currentTheme } = useTheme();
  const { userProfile } = useUser();
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
    if (!currentUser) return;

    if (mode === 'favorites') {
      const favRef = collection(db, "Users", currentUser.uid, "Favorites");
      unsubscribe = onSnapshot(favRef, async (snapshot) => {
        const favIds = snapshot.docs.map(d => d.id);
        if (favIds.length > 0) {
          const chunks = [];
          for (let i = 0; i < favIds.length; i += 30) {
            chunks.push(favIds.slice(i, i + 30));
          }

          const allPosts: CommunityPost[] = [];
          for (const chunk of chunks) {
            const qPosts = query(
              collection(db, "CommunityPosts"),
              where(documentId(), "in", chunk)
            );
            const postSnap = await getDocs(qPosts);
            const chunkData = postSnap.docs.map(d => ({
              postId: d.id,
              ...d.data()
            })) as CommunityPost[];
            allPosts.push(...chunkData);
          }
          setPosts(allPosts);
        } else {
          setPosts([]);
        }
        setLoading(false);
      });
    } else {
      let q = mode === 'mine'
        ? query(collection(db, "CommunityPosts"), where("idUser", "==", currentUser.uid), orderBy("sharedAt", "desc"))
        : query(collection(db, "CommunityPosts"), orderBy("sharedAt", "desc"), limit(displayLimit));

      unsubscribe = onSnapshot(q, (snapshot) => {
        const incomingData = snapshot.docs.map(d => ({ postId: d.id, ...d.data() })) as CommunityPost[];

        if (mode === 'all') {
          setPosts(currentPosts => {
            if (currentPosts.length === 0) return incomingData;

            const existingIds = new Set(currentPosts.map(p => p.postId));
            const topTimestamp = currentPosts[0]?.sharedAt?.seconds || 0;

            const toBuffer: CommunityPost[] = [];
            const toAppend: CommunityPost[] = [];
            const toShowImmediately: CommunityPost[] = [];

            incomingData.forEach(item => {
              if (!existingIds.has(item.postId)) {
                const itemTime = item.sharedAt?.seconds;

                // CHỈ cho hiện ngay nếu là bài của mình
                if (item.idUser === currentUser?.uid) {
                  toShowImmediately.push(item);
                }
                else if (itemTime === undefined || itemTime >= topTimestamp) {
                  toBuffer.push(item);
                }
                else {
                  toAppend.push(item);
                }
              }
            });

            // Nếu có bài mới (không phải của mình), cập nhật buffer
            if (toBuffer.length > 0) {
              setNewPostsBuffer(prev => {
                const combined = [...toBuffer, ...prev];
                return Array.from(new Map(combined.map(i => [i.postId, i])).values());
              });
            }

            // Đồng bộ dữ liệu Like/Comment cho các bài cũ
            const updatedExisting = currentPosts.map(p => {
              const match = incomingData.find(i => i.postId === p.postId);
              return match ? { ...p, ...match } : p;
            });

            // Chỉ đẩy bài của mình vào nếu có
            let nextPosts = [...updatedExisting];
            if (toShowImmediately.length > 0) {
              nextPosts = [...toShowImmediately, ...nextPosts];
            }
            if (toAppend.length > 0) {
              nextPosts = [...nextPosts, ...toAppend];
            }

            return nextPosts;
          });
          setHasMore(incomingData.length >= displayLimit);
        } else {
          setPosts(incomingData);
        }
        setLoading(false);
        setLoadingMore(false);
      });
    }

    return () => unsubscribe?.();
  }, [mode, displayLimit, currentUser]);

  const handleApplyNewPosts = useCallback(() => {
    if (newPostsBuffer.length > 0) {
      setPosts(prev => [...newPostsBuffer, ...prev]);
      setNewPostsBuffer([]);
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
    }
  }, [newPostsBuffer]);

  const handleLoadMore = useCallback(() => {
    if (!loading && !loadingMore && hasMore && mode === 'all') {
      setLoadingMore(true);
      setDisplayLimit(prev => prev + 10);
    }
  }, [loading, loadingMore, hasMore, mode]);

  const toastShow = useCallback((type: string, title: string, text: string) => {
    Toast.show({
      type: type,
      text1: title,
      text2: text,
      position: 'top',
      topOffset: 60,
      visibilityTime: 3000,
    });
  }, []);

  const toastConfirmShow = useCallback((type: string, title: string, text: string, props?: any) => {
    Toast.show({
      type: type,
      text1: title,
      text2: text,
      position: 'top',
      autoHide: false,
      props: props
    });
  }, []);

  const handleScroll = useCallback((event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setShowBackToTop(offsetY > 500);
  }, []);

  const scrollToTop = useCallback(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  const handleLike = useCallback(async (post: CommunityPost) => {
    try {
      await InteractionService.handleLikeLogic(
        post,
        currentUser,
        userProfile?.name,
        userProfile?.avatar
      );
    } catch (error) {
      console.log("Lỗi khi tương tác:", error);
    }
  }, [currentUser, userProfile?.name, userProfile?.avatar]);

  const handleToggleSave = useCallback(async (post: CommunityPost) => {
    const isSaved = favoriteIds.includes(post.postId);
    try {
      const result = await FavoriteService.toggleFavorite(post, isSaved);
      if (result) {
        setFavoriteIds(prev => [...prev, post.postId]);
        toastShow('success', 'Thành công!', 'Bạn đã thêm bài đăng vào danh sách yêu thích.');
      } else {
        setFavoriteIds(prev => prev.filter(id => id !== post.postId));
        toastShow('success', 'Thành công!', 'Bạn đã xóa bài đăng trong danh sách yêu thích.');
      }
    } catch (error) {
      toastShow('error', 'Lỗi!', 'Không thể cập nhật danh sách yêu thích.');
      console.log(error);
    }
  }, [favoriteIds, toastShow]);

  const handleDeletePost = useCallback(async (postId: string) => {
    toastConfirmShow(
      'confirm',
      'Xác nhận xóa bài?',
      'Bài đăng này sẽ bị xóa vĩnh viễn khỏi cộng đồng.',
      {
        onConfirm: async () => {
          try {
            await deleteDoc(doc(db, "CommunityPosts", postId));
            toastShow('success', 'Thành công!', 'Bạn đã xóa bài viết khỏi cộng đồng');
          } catch (e) {
            console.log(e);
            toastShow('error', 'Lỗi', 'Không thể xóa bài đăng lúc này.');
          }
        }
      }
    );
  }, [toastConfirmShow, toastShow]);

  const filteredPosts = useMemo(() => {
    const filtered = posts.filter(post => {
      const name = post?.name || "";
      return name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    if (activeFilter === 'newest') {
      // Sắp xếp theo thời gian, bài mới chưa có timestamp (đang sync) luôn ở trên cùng
      return [...filtered].sort((a, b) => {
        const timeA = a.sharedAt?.seconds ?? Number.MAX_SAFE_INTEGER;
        const timeB = b.sharedAt?.seconds ?? Number.MAX_SAFE_INTEGER;
        return timeB - timeA;
      });
    }

    return [...filtered].sort((a, b) => {
      switch (activeFilter) {
        case 'likes': return (b.likesCount || 0) - (a.likesCount || 0);
        case 'comments': return (b.commentsCount || 0) - (a.commentsCount || 0);
        case 'rating': return (b.rating || 0) - (a.rating || 0);
        default: return 0;
      }
    });
  }, [posts, searchQuery, activeFilter]);

  const renderItem = useCallback(({ item, index }: { item: CommunityPost, index: number }) => {
    const isMine = item.idUser === currentUser?.uid;
    const isLiked = item.likedBy?.includes(currentUser?.uid || '');
    return (
      <Animated.View entering={FadeInUp.delay(index * 100)}>
        <PostCard
          post={item}
          onPress={() => onPressDetailPost?.(item)}
          onLike={() => handleLike(item)}
          isLiked={isLiked}
          onSave={() => {
            handleToggleSave(item);
            onFavoriteChange?.(item);
          }}
          isSaved={favoriteIds.includes(item.postId)}
          isMine={isMine}
          onDelete={() => handleDeletePost(item.postId)}
          currentTheme={currentTheme}
        />
      </Animated.View>
    );
  }, [currentUser?.uid, favoriteIds, currentTheme, onPressDetailPost, handleLike, handleToggleSave, onFavoriteChange, handleDeletePost]);

  const renderFooter = useCallback(() => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator color={currentTheme.primary} />
      </View>
    );
  }, [loadingMore, currentTheme.primary]);

  const renderEmpty = useCallback(() => (
    <View style={styles.emptyContainer}>
      <SearchX size={50} color={currentTheme.primary} />
      <Text style={styles.emptyText}>
        {searchQuery
          ? `Không tìm thấy kết quả cho "${searchQuery}"`
          : "Chưa có bài đăng nào trong mục này."}
      </Text>
    </View>
  ), [searchQuery, currentTheme.primary]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={currentTheme.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredPosts}
        ref={listRef}
        onScroll={handleScroll}
        keyExtractor={(snapDoc) => snapDoc.postId}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        initialNumToRender={5}
        maxToRenderPerBatch={10}
        windowSize={5}
        renderItem={renderItem}
        ListFooterComponent={renderFooter}
        ListHeaderComponent={
          <>
            {ListHeaderComponent}
            {mode === 'all' && (
              <View style={[styles.header, styles.headerMain, { borderColor: currentTheme.primary }]}>
                <View style={styles.headerLeft}>
                  <View style={[styles.iconBox, { backgroundColor: currentTheme.primary }]}>
                    <Users size={20} color="white" />
                  </View>
                  <View>
                    <Text style={styles.title}>Cộng đồng</Text>
                    <Text style={styles.subtitle}>Công thức từ mọi người</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={onOpenShareModal} style={[styles.shareButton, { backgroundColor: currentTheme.primary }]} activeOpacity={0.8}>
                  <Plus size={18} color="white" />
                  <Text style={styles.shareText}>Đăng bài</Text>
                </TouchableOpacity>
              </View>
            )}
            <FilterBar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
            />
          </>
        }
        ListEmptyComponent={renderEmpty}
      />

      {newPostsBuffer.length > 0 && (
        <Animated.View entering={FadeInUp} style={styles.newPostsContainer}>
          <TouchableOpacity
            style={[styles.newPostsBtn, { backgroundColor: currentTheme.primary }]}
            onPress={handleApplyNewPosts}
            activeOpacity={0.9}
          >
            <Text style={styles.newPostsText}>✨ Có bài viết mới</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {showBackToTop && (
        <TouchableOpacity
          style={[styles.backToTopBtn, { backgroundColor: currentTheme.primary }]}
          onPress={scrollToTop}
          activeOpacity={0.8}
        >
          <ChevronUp color="white" size={30} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const PostCard = memo(({ post, onLike, isLiked, onSave, isSaved, onPress, isMine, onDelete, currentTheme }: any) => (
  <View style={[cardStyles.card, { borderColor: currentTheme.primary }]}>
    <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
      <View style={cardStyles.userInfo}>
        <Image source={{ uri: post.userAvatar || AVT_DEFAULT }} style={cardStyles.avatar} />
        <Text style={cardStyles.userName}>{post.userName}</Text>
        <View style={cardStyles.ratingContainer}>
          <Text style={cardStyles.userRating}>{post.rating}</Text>
          <Star style={cardStyles.starIcon} size={10} color='#FBBF24' fill='#FBBF24' />
        </View>
        <Text style={cardStyles.sharedAt}>
          {formatRelativeTime(post.sharedAt)}
        </Text>
        {isMine && (
          <TouchableOpacity style={cardStyles.deleteBtn} onPress={onDelete}>
            <Trash2 size={22} color='red' />
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
        <Bookmark size={22} color={isSaved ? "#FBBF24" : "#E5E7EB"} fill={isSaved ? "#FBBF24" : "none"} />
      </TouchableOpacity>
    </View>

    <View style={cardStyles.content}>
      <Text style={cardStyles.recipeName}>{post.name}</Text>
      <Text style={cardStyles.description} numberOfLines={2}>{post.description}</Text>
    </View>
  </View>
));
