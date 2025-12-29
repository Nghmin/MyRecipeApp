import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  serverTimestamp 
} from 'firebase/firestore';
import { db, auth } from '../config/firebaseConfig';
import { Recipe } from '../models/Recipe';
import { User } from '../models/User';

export const CommunityService = {
  /**
   * Chia sẻ một món ăn cá nhân lên cộng đồng
   */
  shareRecipe: async (recipe: Recipe, currentUserData: User | null) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Chưa đăng nhập");

      // 1. Kiểm tra xem món này đã được chính user này share lên chưa (tránh trùng)
      const q = query(
        collection(db, "CommunityPosts"), 
        where("idRecipe", "==", recipe.idRecipe),
        where("userId", "==", user.uid)
      );
      
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        return { success: false, message: "Món ăn này đã có trên cộng đồng rồi!" };
      }

      // 2. Chuẩn bị dữ liệu bài đăng cộng đồng
      const communityPost = {
        // Giữ nguyên thông tin món ăn
        ...recipe,
        
        // Thêm thông tin người chia sẻ (Để hiện lên feed)
        userId: user.uid,
        userName: currentUserData?.name || "Đầu bếp ẩn danh",
        userAvatar: currentUserData?.avatar || "",
        
        // Thông tin tương tác
        likesCount: 0,
        commentsCount: 0,
        likedBy: [], // Danh sách UID những người đã like món này
        
        // Thời gian chia sẻ
        sharedAt: serverTimestamp(), 
      };

      // 3. Thêm vào collection CommunityPosts
      await addDoc(collection(db, "CommunityPosts"), communityPost);
      
      return { success: true, message: "Chia sẻ thành công!" };
    } catch (error) {
      console.error("Lỗi ShareRecipe:", error);
      return { success: false, message: "Có lỗi xảy ra khi chia sẻ." };
    }
  }
};