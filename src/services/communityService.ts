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
  shareRecipe: async (recipe: Recipe, currentUserData: User | null) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Chưa đăng nhập");

      // Kiểm tra tránh trùng
      const q = query(
        collection(db, "CommunityPosts"), 
        where("idRecipe", "==", recipe.idRecipe),
        where("userId", "==", user.uid)
      );
      
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        return { success: false, message: "Món ăn này đã có trên cộng đồng rồi!" };
      }

      const communityPost = {
        ...recipe,
        userId: user.uid,
        userName: currentUserData?.name || "Đầu bếp ẩn danh",
        userAvatar: currentUserData?.avatar || "",
        likesCount: 0,
        commentsCount: 0,
        likedBy: [], 
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