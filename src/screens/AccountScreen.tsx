import React, { useEffect } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TouchableOpacity, Image, ImageBackground
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import LinearGradient from 'react-native-linear-gradient';
import { 
  Heart, Settings, Bell, Info, LogOut, ChevronRight, Moon, Users
} from 'lucide-react-native';
import Animated, { FadeInUp, FadeInLeft } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';

import { User } from '../models/User';
import { EditProfileModal } from '../components/EditProfileModal';

import { auth, db } from '../config/firebaseConfig';
import Config from "react-native-config"; 


import { signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, getDoc, } from 'firebase/firestore';

const menuItems = [
  { icon: Users, label: 'Thông tin cá nhân', desc: 'Chỉnh sửa thông tin', colors: ['#3b82f6', '#06b6d4'] },
  { icon: Heart, label: 'Yêu thích', desc: 'Số món ăn yêu thích', colors: ['#ec4899', '#f43f5e'] },
  { icon: Bell, label: 'Thông báo', desc: 'Cài đặt nhắc nhở', colors: ['#a855f7', '#ec4899'] },
  { icon: Moon, label: 'Giao diện', desc: 'Chế độ sáng/tối', colors: ['#6366f1', '#a855f7'] },
  { icon: Settings, label: 'Cài đặt', desc: 'Tùy chỉnh ứng dụng', colors: ['#4b5563', '#374151'] },
  { icon: Info, label: 'Trợ giúp', desc: 'Câu hỏi thường gặp', colors: ['#14b8a6', '#06b6d4'] },
];

const AccountBackground = require('../assets/themeAccount.jpg');


export default function AccountScreen() {
  const [recipeCount, setRecipeCount] = React.useState(0);
  const [isDetalModalOpen, setIsDetalModalOpen] = React.useState(false);
  const [userData, setUserData] = React.useState<User | null>(null);
  const [totalLikes, setTotalLikes] = React.useState(0);
  const [userPosts, setUserPosts] = React.useState([]);
  const AVT_DEFAULT = Config.AVT_DEFAULT!;



  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const qRecipes = query(
      collection(db, "Recipes"), 
      where("idUser", "==", user.uid)
    );
    const unsubscribeRecipes = onSnapshot(qRecipes, (snapshot) => setRecipeCount(snapshot.size));
    const qPosts = query(
      collection(db, "CommunityPosts"), 
      where("idUser", "==", user.uid)
    );
    const unsubscribePosts = onSnapshot(qPosts, (snapshot) => {
      let totalLikesCount = 0;
      const postsList: any = [];

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        totalLikesCount += data.likesCount || 0;
        postsList.push({ id: doc.id, name: data.name }); 
      });
      setTotalLikes(totalLikesCount);
      setUserPosts(postsList);
    })
    return () => {unsubscribeRecipes();unsubscribePosts();};
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      refreshData();
    }, [])
  );
  

  const refreshData = async () => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const userDoc = await getDoc(doc(db, "Users", currentUser.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data() as User);
        }
      }
    } catch (error) {
      console.log("Lỗi khi refresh dữ liệu:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Lỗi đăng xuất:", error);
    }
  };

  return (
    
    <SafeAreaView style={{ flex: 1 }}>
      <ImageBackground 
      source={AccountBackground}
      style = {styles.background}
      resizeMode="cover" 
    >    
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header Profile */}
        <Animated.View entering={FadeInUp.delay(200)} style={styles.header}>
          <View style={styles.avatarWrapper}>
            <Image 
              key={userData?.avatar} 
              source={{ 
                uri: (userData?.avatar && userData.avatar.trim() !== "") 
                  ? userData.avatar 
                  : AVT_DEFAULT 
              }}    
              style={styles.avatar} 
            />
          </View>
          <Text style={styles.userName}>{userData?.name || "Đang tải..."}</Text>
          <Text style={styles.userEmail}>{userData?.email || ""}</Text>

          {/* Stats Cards */}
          <View style={styles.statsContainer}>
            <StatCard value={recipeCount.toString()} label="Công thức" />
            <StatCard value={userPosts.length.toString()} label="Số lượt đăng" />
            <StatCard value={totalLikes.toString()} label="Số lượt thích" />
          </View>
        </Animated.View>

        {/* Menu List */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <Animated.View 
              key={index} 
              entering={FadeInLeft.delay(100 * index)}>
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => {
                  if (item.label === 'Thông tin cá nhân') setIsDetalModalOpen(true);
                }}>
                <LinearGradient colors={item.colors} style={styles.iconBox}>
                  <item.icon size={22} color="white" />
                </LinearGradient>
                <View style={styles.menuText}>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <Text style={styles.menuDesc}>{item.desc}</Text>
                </View>
                <ChevronRight size={20} color="rgba(255,255,255,0.3)" />
              </TouchableOpacity>
            </Animated.View>
          ))}

          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut size={20} color="#fd0505ff" />
            <Text style={styles.logoutText}>Đăng xuất</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <EditProfileModal 
        isOpen={isDetalModalOpen}
        onClose={() => setIsDetalModalOpen(false)}
        userData={userData}
        onUpdateSuccess={refreshData}
      />
      </ImageBackground>
    </SafeAreaView>
  );
}

const StatCard = ({ value, label }: { value: string, label: string }) => (
  <View style={styles.statCard}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  background:{
    flex: 1,
  },
  scrollContent: { paddingBottom: 100, paddingTop: 40 },
  header: { 
    alignItems: 'center', 
    marginBottom: 30,
    borderWidth: 1,
    borderRadius: 15,
    paddingBottom: 15,
    paddingTop: 10, 
    marginLeft:10 ,
    marginRight:10,
    borderColor: '#F97316',
    backgroundColor: 'rgba(10, 6, 6, 0.38)',
  },
  avatarWrapper: {
    width: 110, height: 110,
    borderRadius: 55,
    borderWidth: 4, borderColor: '#F97316',
    marginBottom: 15,
    overflow: 'hidden', 
    backgroundColor: 'rgba(255,255,255,0.1)'
  },
  avatar: { width: '100%', height: '100%' },
  userName: { color: 'white', fontSize: 24, fontWeight: 'bold' },
  userEmail: { color: 'rgba(249, 242, 242, 1)', fontSize: 14, marginTop: 4 },
  statsContainer: {
    flexDirection: 'row', gap: 10,
    marginTop: 25, paddingHorizontal: 20
  },
  statCard: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 15, borderRadius: 16,
    alignItems: 'center', borderWidth: 1, borderColor: '#F97316'
  },
  statValue: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  statLabel: { color: 'rgba(249, 242, 242, 1)', fontSize: 12 },
  menuContainer: { paddingHorizontal: 20, gap: 12 , },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(10, 6, 6, 0.38)',
    padding: 12, borderRadius: 18,
    borderWidth: 1, borderColor: '#F97316'
  },
  iconBox: {
    width: 48, height: 48,
    borderRadius: 14, justifyContent: 'center', alignItems: 'center'
  },
  menuText: { flex: 1, marginLeft: 15 },
  menuLabel: { color: 'white', fontSize: 16, fontWeight: '600' },
  menuDesc: { color: 'rgba(249, 242, 242, 1)', fontSize: 13 },
  logoutButton: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.38)',
    padding: 16, borderRadius: 18,
    marginTop: 20, gap: 10,
    borderWidth: 1, borderColor: '#F97316'
  },
  logoutText: { color: '#f40707ff', fontSize: 16, fontWeight: 'bold' },
});