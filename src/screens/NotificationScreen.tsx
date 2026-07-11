import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Heart, MessageCircle, Bell, ChevronRight, ChevronLeft } from 'lucide-react-native';
import { db, auth } from '../config/firebaseConfig';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { useTheme } from '../theme/ThemeContext';
import { formatNotificationTime } from '../utils/dateUtils';
import { Config } from 'react-native-config';

const AVT_DEFAULT = Config.AVT_DEFAULT!;

export const NotificationScreen = ({ navigation }: any) => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentTheme } = useTheme();

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // Lắng nghe thông báo Realtime
    const q = query(
      collection(db, "Notifications"),
      where("receiverId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));
      setNotifications(list);
      setLoading(false);
    }, (error) => {
      console.error("Lỗi lắng nghe thông báo:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleNotificationPress = async (item: any) => {
    try {
      // 1. Đánh dấu đã đọc trên Firestore
      if (!item.isRead) {
        const notiRef = doc(db, "Notifications", item.id);
        await updateDoc(notiRef, { isRead: true });
      }

      // 2. Điều hướng đến bài viết liên quan
      if (item.relatedId) {
        navigation.navigate('RecipeDetail', { idRecipe: item.relatedId });
      }
    } catch (error) {
      console.log("Lỗi xử lý nhấn thông báo:", error);
    }
  };

  const renderIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart size={14} color="#fff" fill="#fff" />;
      case 'comment':
        return <MessageCircle size={14} color="#fff" fill="#fff" />;
      default:
        return <Bell size={14} color="#fff" fill="#fff" />;
    }
  };

  const getIconBgColor = (type: string) => {
    if (type === 'like') return '#EF4444'; // Đỏ cho like
    if (type === 'comment') return '#3B82F6'; // Xanh dương cho comment
    return currentTheme.primary; // Màu theme cho hệ thống
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        { backgroundColor: item.isRead ? 'transparent' : 'rgba(255,255,255,0.03)' }
      ]}
      onPress={() => handleNotificationPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        <Image
          source={{ uri: item.senderAvatar || AVT_DEFAULT }}
          style={styles.avatar}
        />
        <View style={[styles.badgeIcon, { backgroundColor: getIconBgColor(item.type) }]}>
          {renderIcon(item.type)}
        </View>
      </View>

      <View style={styles.contentContainer}>
        <Text style={styles.contentText} numberOfLines={2}>
          <Text style={styles.senderName}>{item.senderName} </Text>
          <Text style={styles.actionText}>{item.content}</Text>
        </Text>
        <Text style={styles.timeText}>
          {item.createdAt ? formatNotificationTime(item.createdAt.toDate()) : 'Vừa xong'}
        </Text>
      </View>

      {!item.isRead && (
        <View style={[styles.unreadDot, { backgroundColor: currentTheme.primary }]} />
      )}

      <ChevronRight size={16} color="#4B5563" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={currentTheme.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft color="white" size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thông báo</Text>
        {notifications.filter(n => !n.isRead).length > 0 && (
          <View style={[styles.countBadge, { backgroundColor: currentTheme.primary }]}>
            <Text style={styles.countText}>{notifications.filter(n => !n.isRead).length}</Text>
          </View>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Bell size={64} color="#374151" />
            <Text style={styles.emptyText}>Chưa có thông báo nào</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    gap: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  countText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  listContent: {
    paddingBottom: 100,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#1F2937',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 55,
    height: 55,
    borderRadius: 20,
    backgroundColor: '#374151',
  },
  badgeIcon: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  contentContainer: {
    flex: 1,
    marginLeft: 15,
    marginRight: 10,
  },
  contentText: {
    fontSize: 15,
    lineHeight: 20,
  },
  senderName: {
    color: '#fff',
    fontWeight: 'bold',
  },
  actionText: {
    color: '#D1D5DB',
  },
  timeText: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  emptyContainer: {
    marginTop: 100,
    alignItems: 'center',
    gap: 15,
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 16,
  },
});