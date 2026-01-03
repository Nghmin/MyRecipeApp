import { db, auth } from '../config/firebaseConfig';
import { 
  collection, doc, setDoc, deleteDoc, getDocs, query, where
} from 'firebase/firestore';

export const FavoriteService = {
  toggleFavorite: async (item: any, isFavorite: boolean) => {
    const user = auth.currentUser;
    if (!user) return false;
    
    
    const idToSave = item.postId;
    const favRef = doc(db, "Users", user.uid, "Favorites", idToSave);

    try {
      if (!isFavorite) {
        await setDoc(favRef, {
          postId: idToSave, 
          isCommunityPost: !!item.postId, 
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
  getFavorites: async () => {
    const user = auth.currentUser;
    if (!user) return [];

    try {
      const favRef = collection(db, "Users", user.uid, "Favorites");
      const querySnapshot = await getDocs(favRef);
     
      const favIds = querySnapshot.docs.map(doc => doc.id);
      if (favIds.length === 0) return [];

      const postsRef = collection(db, "CommunityPosts");
      const q = query(postsRef, where("__name__", "in", favIds)); 
      const postsSnapshot = await getDocs(q);

      return postsSnapshot.docs.map(doc => ({
        ...doc.data(),
        postId: doc.id,
        isFavorite: true 
      }));
    } catch (error) {
      console.error("Lỗi get favorites:", error);
      return [];
    }
  }
};