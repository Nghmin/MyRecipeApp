// import { collection, doc, setDoc, deleteDoc, getDocs, query, orderBy } from 'firebase/firestore';
// import { db, auth } from '../config/firebaseConfig';
// import { Recipe } from '../models/Recipe';

// export const FavoriteService = {
 
//   getFavorites: async (): Promise<Recipe[]> => {
//     const user = auth.currentUser;
//     if (!user) return [];

//     try {
//       const favRef = collection(db, "Users", user.uid, "Favorites");
//       // Sắp xếp theo thời gian lưu mới nhất lên đầu
//       const q = query(favRef, orderBy("savedAt", "desc"));
//       const querySnapshot = await getDocs(q);
      
//       return querySnapshot.docs.map(doc => doc.data() as Recipe);
//     } catch (error) {
//       console.error("Lỗi fetch favorites:", error);
//       return [];
//     }
//   },

//   //  Hàm thêm/xóa yêu thích
//   toggleFavorite: async (recipe: Recipe, isFavorite: boolean) => {
//     const user = auth.currentUser;
//     if (!user) throw new Error("User not logged in");

//     const favDocRef = doc(db, "Users", user.uid, "Favorites", recipe.idRecipe);

//     if (isFavorite) {
//       // Nếu đang thích rồi thì Xóa
//       await deleteDoc(favDocRef);
//       return false; 
//     } else {
//       // Nếu chưa thì Thêm
//       const favData = {
//         ...recipe,
//         isFavorite: true,
//         savedAt: new Date().toISOString(),
//       };
//       await setDoc(favDocRef, favData);
//       return true;
//     }
//   }
// };



import { db, auth } from '../config/firebaseConfig';
import { 
  collection, doc, setDoc, deleteDoc, getDocs, query, 
} from 'firebase/firestore';

export const FavoriteService = {
  toggleFavorite: async (item: any, isFavorite: boolean) => {
    const user = auth.currentUser;
    if (!user) return false;
    
    const favRef = doc(db, "Users", user.uid, "Favorites", item.postId);

    try {
      if (!isFavorite) {
       
        await setDoc(favRef, {
          ...item,
          isCommunityPost: true,
          addedAt: new Date()
        });
        return true;
      } else {
        await deleteDoc(favRef);
        return false;
      }
    } catch (error) {
      console.error("Lỗi toggle favorite:", error);
      throw error;
    }
  },

  // 2. Lấy danh sách yêu thích
  getFavorites: async () => {
    const user = auth.currentUser;
    if (!user) return [];

    try {
      const favRef = collection(db, "Users", user.uid, "Favorites");
      const q = query(favRef);
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        ...doc.data(),
        isFavorite: true 
      }));
    } catch (error) {
      console.error("Lỗi get favorites:", error);
      return [];
    }
  }
};