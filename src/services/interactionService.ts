import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db,  } from '../config/firebaseConfig';
import { NotificationService } from './notificationService';
// Quản lý các bộ đếm thời gian cho việc gửi thông báo
const likeTimers = new Map<string, any>();

export const InteractionService = {
  handleLikeLogic: async (post: any, currentUser: any, senderName?: string, senderAvatar?: string) => {
    if (!currentUser) return;
    
    const isLiked = post.likedBy?.includes(currentUser.uid);
    const postId = post.postId;

    try {
      const postRef = doc(db, "CommunityPosts", postId);
      await updateDoc(postRef, {
        likedBy: isLiked ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid),
        likesCount: isLiked ? Math.max(0, (post.likesCount || 1) - 1) : (post.likesCount || 0) + 1
      });

      if (!isLiked) {
        if (likeTimers.has(postId)) clearTimeout(likeTimers.get(postId));

        const timer = setTimeout(async () => {
          if (post.idUser !== currentUser.uid) {
            await NotificationService.sendNotification(
              post.idUser,
              senderName || currentUser.displayName || 'Người dùng',
              senderAvatar || currentUser.photoURL || '',
              'like',
              postId
            );
          }
          likeTimers.delete(postId);
        }, 3000);

        likeTimers.set(postId, timer);
      } else {
        if (likeTimers.has(postId)) {
          clearTimeout(likeTimers.get(postId));
          likeTimers.delete(postId);
        }
      }
    } catch (error) {
      console.error("Lỗi tại InteractionService:", error);
      throw error;
    }
  }
};