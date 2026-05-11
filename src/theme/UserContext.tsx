import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../config/firebaseConfig';
import { onSnapshot, doc } from 'firebase/firestore';

interface UserProfile {
  uid: string;
  name: string;
  avatar: string;
  email?: string;
}

interface UserContextType {
  userProfile: UserProfile | null;
  loading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        // Lấy theo UID
        const userRef = doc(db, "Users", user.uid);

        const unsubscribeSnapshot = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            console.log("Dữ liệu User từ Firestore:", data);
            setUserProfile({
              uid: user.uid,
              // Ưu tiên lấy 'name'
              name: data.name || data.fullName || data.userName || user.displayName || 'Người dùng',
              avatar: data.avatar || data.avatarUrl || data.photoURL || user.photoURL || '',
              email: data.email || user.email || ''
            });
          } else {
            // Nếu không tìm thấy theo ID, thử tìm tài liệu có trường uid == user.uid
            console.log("Không tìm thấy ID tài liệu, thử query theo trường uid");
            setUserProfile({
              uid: user.uid,
              name: user.displayName || 'Người dùng',
              avatar: user.photoURL || '',
              email: user.email || ''
            });
          }
          setLoading(false);
        });

        return () => unsubscribeSnapshot();
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  return (
    <UserContext.Provider value={{ userProfile, loading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) throw new Error('useUser must be used within a UserProvider');
  return context;
};