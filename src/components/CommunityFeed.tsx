import React, { useState, useEffect, useRef, useCallback, memo, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,
  FlatList, Image
} from 'react-native';
import {
  Users, Plus, Heart, Bookmark, Star, MessageCircle, Trash2, ChevronUp, SearchX
} from 'lucide-react-native';
import Animated, {
  FadeInUp,
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  withSpring,
  withTiming
} from 'react-native-reanimated';
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

const AVT_DEFAULT = Config.AVT_DEFAULT!;

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 15 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 20,
    borderWidth: 1,
  },
  headerMain: { marginTop: 10, marginHorizontal: 0, borderWidth: 1.5 },
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
    bottom: 110,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  newPostsContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
    elevation: 20,
  },
  newPostsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 30,
    backgroundColor: '#3B82F6',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.5)',
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
    backgroundColor: 'rgba(30, 41, 59, 0.95)',
    borderRadius: 28,
    marginBottom: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  userInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)' },
  userName: { color: 'white', fontWeight: '700', fontSize: 15 },
  sharedAt: { color: '#94A3B8', fontSize: 12, marginTop: 2 },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 280,
  },
  postImage: { width: '100%', height: '100%', borderRadius: 0 },
  likeCircle: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  deleteBtnTop: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: { padding: 16 },
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  recipeName: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  ratingContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  userRating: { color: '#FBBF24', fontSize: 12, fontWeight: 'bold' },
  description: { color: '#CBD5E1', fontSize: 13, lineHeight: 18, marginBottom: 12 },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: { color: '#94A3B8', fontSize: 12, fontWeight: '600' },
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
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [displayLimit, setDisplayLimit] = useState(10);
  const [hasMore, setHasMore] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('newest');

  const listRef = useRef<FlatList>(null);
  const scrollY = useSharedValue(0);
  const headerHeight = useSharedValue(0);

  const { currentTheme } = useTheme();
  const { userProfile } = useUser();
  const currentUserId = userProfile?.uid;

  useEffect(() => {
    const fetchFavs = async () => {
      if (!currentUserId) return;
      try {
        const favs = await FavoriteService.getFavorites();
        setFavoriteIds(favs.map((f: any) => f.postId));
      } catch (e) {
        console.log("Error fetching favorites:", e);
      }
    };
    fetchFavs();
  }, [currentUserId]);

  useEffect(() => {
    let unsubscribe: () => void;

    const forceStopLoading = setTimeout(() => {
      setLoading(false);
    }, 4000);

    if (!currentUserId) {
      setLoading(false);
      return () => clearTimeout(forceStopLoading);
    }

    setLoading(true);
    if (mode === 'favorites') {
      const favRef = collection(db, "Users", currentUserId, "Favorites");
      unsubscribe = onSnapshot(favRef, async (snapshot) => {
        try {
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
        } catch (err) {
            console.log("Error loading favorites feed:", err);
        } finally {
            setLoading(false);
        }
      }, (error) => {
          console.log("Favorite snapshot error:", error);
          setLoading(false);
      });
    } else {
      let q = mode === 'mine'
        ? query(collection(db, "CommunityPosts"), where("idUser", "==", currentUserId), orderBy("sharedAt", "desc"))
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

                if (item.idUser === currentUserId) {
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

            if (toBuffer.length > 0) {
              setNewPostsBuffer(prev => {
                const combined = [...toBuffer, ...prev];
                return Array.from(new Map(combined.map(i => [i.postId, i])).values());
              });
            }

            const updatedExisting = currentPosts.map(p => {
              const match = incomingData.find(i => i.postId === p.postId);
              return match ? { ...p, ...match } : p;
            });

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
      }, (error) => {
          console.log("Feed snapshot error:", error);
          setLoading(false);
          setLoadingMore(false);
      });
    }

    return () => {
      unsubscribe?.();
      clearTimeout(forceStopLoading);
    };
  }, [mode, displayLimit, currentUserId]);

  const handleApplyNewPosts = useCallback(() => {
    if (newPostsBuffer.length > 0) {
      setPosts(prev => [...newPostsBuffer, ...prev]);
      setNewPostsBuffer([]);
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
      scrollY.value = 0;
    }
  }, [newPostsBuffer , scrollY]);

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

  const onScroll = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const animatedNewPostsStyle = useAnimatedStyle(() => {
    const stickyTop = 10;
    const startTop = headerHeight.value > 0 ? headerHeight.value - 45 : 350;
    const currentTop = startTop - scrollY.value;
    const isDeepDown = scrollY.value > 800;

    return {
      top: currentTop < stickyTop ? stickyTop : currentTop,
      opacity: withTiming((newPostsBuffer.length > 0 && !isDeepDown) ? 1 : 0),
      transform: [
        { scale: withSpring((newPostsBuffer.length > 0 && !isDeepDown) ? 1.05 : 0.8) }
      ],
    };
  }, [newPostsBuffer.length]);

  const animatedBackToTopStyle = useAnimatedStyle(() => {
    const isVisible = scrollY.value > 500;
    return {
      opacity: withTiming(isVisible ? 1 : 0),
      transform: [{ scale: withSpring(isVisible ? 1 : 0) }],
    };
  });

  const scrollToTop = useCallback(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  const handleLike = useCallback(async (post: CommunityPost) => {
    try {
      await InteractionService.handleLikeLogic(
        post,
        auth.currentUser,
        userProfile?.name,
        userProfile?.avatar
      );
    } catch (error) {
      console.log("Lỗi khi tương tác:", error);
    }
  }, [userProfile]);

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
    const isMine = item.idUser === currentUserId;
    const isLiked = item.likedBy?.includes(currentUserId || '');
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
  }, [currentUserId, favoriteIds, currentTheme, onPressDetailPost, handleLike, handleToggleSave, onFavoriteChange, handleDeletePost]);

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
      {loading ? (
        <ActivityIndicator size="large" color={currentTheme.primary} style={{ marginTop: 20 }} />
      ) : (
        <>
          <SearchX size={50} color={currentTheme.primary} />
          <Text style={styles.emptyText}>
            {searchQuery
              ? `Không tìm thấy kết quả cho "${searchQuery}"`
              : "Chưa có bài đăng nào trong mục này."}
          </Text>
        </>
      )}
    </View>
  ), [searchQuery, currentTheme.primary, loading]);

  return (
    <View style={styles.container}>
      <Animated.FlatList
        data={filteredPosts}
        ref={listRef as any}
        onScroll={onScroll}
        scrollEventThrottle={16}
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
          <View onLayout={(e) => { headerHeight.value = e.nativeEvent.layout.height; }}>
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
                <TouchableOpacity
                  onPress={onOpenShareModal}
                  style={[styles.shareButton, { backgroundColor: currentTheme.primary }]}
                  activeOpacity={0.8}
                >
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
          </View>
        }
        ListEmptyComponent={renderEmpty}
      />

      <Animated.View
        style={[styles.newPostsContainer, animatedNewPostsStyle]}
        pointerEvents={newPostsBuffer.length > 0 ? 'auto' : 'none'}
      >
        <TouchableOpacity
          style={[styles.newPostsBtn, { backgroundColor: currentTheme.primary }]}
          onPress={handleApplyNewPosts}
          activeOpacity={0.9}
        >
          <Text style={styles.newPostsText}>✨ Có bài viết mới</Text>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View
        style={[
          styles.backToTopBtn,
          { backgroundColor: currentTheme.primary },
          animatedBackToTopStyle
        ]}
      >
        <TouchableOpacity
          onPress={scrollToTop}
          activeOpacity={0.8}
          style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}
        >
          <ChevronUp color="white" size={28} />
          {newPostsBuffer.length > 0 && (
            <View style={styles.notificationBadge} />
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const PostCard = memo(({ post, onLike, isLiked, onSave, isSaved, onPress, isMine, onDelete, currentTheme }: any) => (
  <View style={[cardStyles.card, { borderColor: 'rgba(255,255,255,0.05)' }]}>
    <View style={cardStyles.userInfo}>
      <View style={cardStyles.userInfoLeft}>
        <Image source={{ uri: post.userAvatar || AVT_DEFAULT }} style={cardStyles.avatar} />
        <View>
          <Text style={cardStyles.userName}>{post.userName}</Text>
          <Text style={cardStyles.sharedAt}>{formatRelativeTime(post.sharedAt)}</Text>
        </View>
      </View>

      <View style={cardStyles.headerActions}>
        <TouchableOpacity style={cardStyles.actionCircle} onPress={onSave}>
          <Bookmark size={18} color={isSaved ? "#FBBF24" : "#FFF"} fill={isSaved ? "#FBBF24" : "none"} />
        </TouchableOpacity>
      </View>
    </View>

    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={cardStyles.imageContainer}>
      <Image source={{ uri: post.image }} style={cardStyles.postImage} resizeMode="cover" />

      <TouchableOpacity style={cardStyles.likeCircle} onPress={onLike}>
        <Heart size={26} color={isLiked ? "#EF4444" : "#FFF"} fill={isLiked ? "#EF4444" : "none"} />
      </TouchableOpacity>

      {isMine && (
        <TouchableOpacity style={cardStyles.deleteBtnTop} onPress={onDelete}>
          <Trash2 size={16} color='white' />
        </TouchableOpacity>
      )}
    </TouchableOpacity>

    <View style={cardStyles.content}>
      <View style={cardStyles.contentHeader}>
        <Text style={cardStyles.recipeName}>{post.name}</Text>
        <View style={cardStyles.ratingContainer}>
          <Star size={14} color='#FBBF24' fill='#FBBF24' />
          <Text style={cardStyles.userRating}>{post.rating || '5.0'}</Text>
        </View>
      </View>

      <Text style={cardStyles.description} numberOfLines={2}>
        {post.description || 'Không có mô tả cho món ăn này.'}
      </Text>

      <View style={cardStyles.statsRow}>
        <View style={cardStyles.statItem}>
          <MessageCircle size={16} color="#94A3B8" />
          <Text style={cardStyles.statText}>{post.commentsCount || 0}</Text>
        </View>
        <View style={cardStyles.statItem}>
          <Heart size={16} color="#94A3B8" />
          <Text style={cardStyles.statText}>{post.likesCount || 0}</Text>
        </View>
      </View>
    </View>
  </View>
));
