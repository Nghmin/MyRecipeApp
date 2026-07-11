import React, { useEffect, useState } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity, Image, ImageBackground, StatusBar
} from 'react-native';

import { useTheme } from '../theme/ThemeContext';
import { useUser } from '../theme/UserContext';

import { SafeAreaView } from 'react-native-safe-area-context';

import LinearGradient from 'react-native-linear-gradient';
import {
  Heart, Settings, Bell, Info, LogOut, ChevronRight, Moon, Users
} from 'lucide-react-native';
import Animated, { FadeInUp, FadeInLeft } from 'react-native-reanimated';

import { EditProfileModal } from '../components/EditProfileModal';
import { ThemeSelectionModal } from '../components/ThemeSelectionModal';

import { auth, db } from '../config/firebaseConfig';
import Config from "react-native-config";

import { signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot, } from 'firebase/firestore';

const menuItems = [
  { icon: Users, label: 'Thông tin cá nhân', desc: 'Chỉnh sửa thông tin' },
  { icon: Heart, label: 'Bài đăng', desc: 'Lưu trữ bài đăng của bạn' },
  { icon: Bell, label: 'Thông báo', desc: 'Thông báo đến bạn' },
  { icon: Moon, label: 'Giao diện', desc: 'Chọn màu chủ đạo' },
  { icon: Settings, label: 'Cài đặt', desc: 'Tùy chỉnh ứng dụng' },
  { icon: Info, label: 'Trợ giúp', desc: 'Câu hỏi thường gặp' },
];

const AccountBackground = require('../assets/themeAccount.jpg');

export default function AccountScreen({ navigation }: any) {
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const { currentTheme, setTheme } = useTheme();
  const { userProfile } = useUser();
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [recipeCount, setRecipeCount] = useState(0);
  const [totalLikes, setTotalLikes] = useState(0);
  const [userPosts, setUserPosts] = useState([]);

  const AVT_DEFAULT = Config.AVT_DEFAULT!;

  // Theo dõi dữ liệu bài viết và công thức theo thời gian thực
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // Truy vấn đếm số lượng công thức
    const qRecipes = query(
      collection(db, "Recipes"),
      where("idUser", "==", user.uid)
    );
    const unsubscribeRecipes = onSnapshot(qRecipes, (snapshot) => setRecipeCount(snapshot.size));

    // Truy vấn bài viết cộng đồng và tổng lượt thích
    const qPosts = query(
      collection(db, "CommunityPosts"),
      where("idUser", "==", user.uid)
    );
    const unsubscribePosts = onSnapshot(qPosts, (snapshot) => {
      let totalLikesCount = 0;
      const postsList: any = [];

      snapshot.docs.forEach(d => {
        const data = d.data();
        totalLikesCount += data.likesCount || 0;
        postsList.push({ id: d.id, name: data.name });
      });
      setTotalLikes(totalLikesCount);
      setUserPosts(postsList);
    });

    return () => {
      unsubscribeRecipes();
      unsubscribePosts();
    };
  }, []);

  const handleThemeSelect = (theme: any) => {
    setTheme(theme);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Lỗi đăng xuất:", error);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <ImageBackground
        source={AccountBackground}
        style={styles.background}
        resizeMode="cover"
        blurRadius={15}
      >
        {/* Lớp phủ tối  */}
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.45)' }]} />

        {/* Gradient mờ ở phần đầu trang */}
        <LinearGradient
          colors={['rgba(0,0,0,0.7)', 'transparent']}
          style={{ height: 100, position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}
        />

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Header Profile */}
          <Animated.View entering={FadeInUp.delay(200)} style={styles.header}>
            <View style={[styles.avatarWrapper, { borderColor: currentTheme.primary }]}>
              <Image
                key={userProfile?.avatar}
                source={{
                  uri: (userProfile?.avatar && userProfile.avatar.trim() !== "")
                    ? userProfile.avatar
                    : AVT_DEFAULT
                }}
                style={styles.avatar}
              />
            </View>
            <Text style={styles.userName}>{userProfile?.name || "Đang tải..."}</Text>
            <Text style={styles.userEmail}>{userProfile?.email || ""}</Text>

            {/* Thống kê người dùng với màu chủ đạo động */}
            <View style={styles.statsContainer}>
              <StatCard value={recipeCount.toString()} label="Công thức" color={currentTheme.primary} />
              <StatCard value={userPosts.length.toString()} label="Bài viết" color={currentTheme.primary} />
              <StatCard value={totalLikes.toString()} label="Lượt thích" color={currentTheme.primary} />
            </View>
          </Animated.View>

          {/* Danh sách Menu tùy chỉnh */}
          <View style={styles.menuContainer}>
            {menuItems.map((item, index) => (
              <Animated.View
                key={index}
                entering={FadeInLeft.delay(100 * index)}>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    if (item.label === 'Thông tin cá nhân') setIsDetailModalOpen(true);
                    else if (item.label === 'Bài đăng') navigation.navigate('MyPosts');
                    else if (item.label === 'Giao diện') setIsThemeModalOpen(true);
                    else if (item.label === 'Thông báo') navigation.navigate('Notifications');

                  }}>
                  {/* Icon Box thay đổi màu theo theme đã chọn */}
                  <LinearGradient
                    colors={[currentTheme.primary, currentTheme.secondary]}
                    style={styles.iconBox}
                  >
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

            {/* Nút Đăng xuất */}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <LogOut size={20} color="#ff4d4d" />
              <Text style={styles.logoutText}>Đăng xuất</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Modal chỉnh sửa thông tin */}
        <EditProfileModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          userData={userProfile as any}
          onUpdateSuccess={() => { }}
        />

        {/* Modal tùy chọn giao diện màu sắc */}
        <ThemeSelectionModal
          isOpen={isThemeModalOpen}
          onClose={() => setIsThemeModalOpen(false)}
          currentTheme={currentTheme}
          onSelectTheme={handleThemeSelect}
        />
      </ImageBackground>
    </SafeAreaView>
  );
}

// Thành phần hiển thị chỉ số thống kê
const StatCard = ({ value, label, color }: { value: string, label: string, color: string }) => (
  <View style={styles.statCard}>
    <Text style={[styles.statValue, { color: color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  background: { flex: 1 },
  scrollContent: { paddingBottom: 100, paddingTop: 10 },
  header: {
    alignItems: 'center', marginBottom: 20, borderWidth: 1, borderRadius: 24,
    paddingBottom: 10, paddingTop: 10, marginHorizontal: 15,
    borderColor: 'rgba(255, 255, 255, 0.12)', backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  avatarWrapper: {
    width: 120, height: 120, borderRadius: 60,
    borderWidth: 3, marginBottom: 5,
    overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.05)',
  },
  avatar: { width: '100%', height: '100%' },
  userName: { color: 'white', fontSize: 27, fontWeight: '600', letterSpacing: 0.5 },
  userEmail: { color: 'rgba(255, 255, 255, 0.5)', fontSize: 15, marginTop: 2 },
  statsContainer: { flexDirection: 'row', gap: 12, marginTop: 10, paddingHorizontal: 15 },
  statCard: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 15, borderRadius: 20,
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)'
  },
  statValue: { fontSize: 22, fontWeight: 'bold' },
  statLabel: { color: 'rgba(255, 255, 255, 0.6)', fontSize: 11, fontWeight: '600', marginTop: 2 },
  menuContainer: { paddingHorizontal: 20, gap: 15 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 14, borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)'
  },
  iconBox: { width: 46, height: 46, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  menuText: { flex: 1, marginLeft: 15 },
  menuLabel: { color: 'white', fontSize: 16, fontWeight: '700' },
  menuDesc: { color: 'rgba(255, 255, 255, 0.4)', fontSize: 13, marginTop: 2 },
  logoutButton: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)', padding: 18, borderRadius: 22,
    marginTop: 20, gap: 10, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)'
  },
  logoutText: { color: '#ff4d4d', fontSize: 16, fontWeight: 'bold' },
});