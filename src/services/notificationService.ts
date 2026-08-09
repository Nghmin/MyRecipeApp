import { db, auth } from '../config/firebaseConfig';
import { 
  collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, 
} from 'firebase/firestore';

export const NotificationService = {
  sendNotification: async (receiverId: string, senderName: string, senderAvatar: string, type: 'like' | 'comment' | 'system', relatedId: string) => {
    const user = auth.currentUser;
    if (!user || user.uid === receiverId) return; 
    try {
      await addDoc(collection(db, "Notifications"), {
        receiverId,
        senderId: user.uid,
        senderName,
        senderAvatar,
        type,
        relatedId,
        content: type === 'like' ? 'đã thích công thức của bạn.' : 'đã bình luận về bài viết của bạn.',
        isRead: false,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Lỗi gửi thông báo:", error);
    }
  },

  // Hàm lấy danh sách thông báo để hiện lên màn hình
  getNotifications: async () => {
    const user = auth.currentUser;
    if (!user) return [];

    try {
      const q = query(
        collection(db, "Notifications"),
        where("receiverId", "==", user.uid),
        orderBy("createdAt", "desc") // Thông báo mới nhất hiện lên đầu
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));
    } catch (error) {
      console.error("Lỗi lấy thông báo:", error);
      return [];
    }
  }
};