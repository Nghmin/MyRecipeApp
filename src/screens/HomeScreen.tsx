import { 
    StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, 
    Image, FlatList, ScrollView, Alert 
} from 'react-native';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { auth, db } from '../config/firebaseConfig';
import Config from "react-native-config"; 

import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

import { RecipeDetailModal } from '../components/RecipeDetailModal';
import { RecipeCard } from '../components/RecipeCard';
import { ShareRecipeModal } from '../components/ShareRecipeModal';
import { CommunityFeed } from '../components/CommunityFeed'; 

import { User } from '../models/User';
import { Recipe } from '../models/Recipe';

import IconMaterial from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';

import fetchRandomRecipeAPI from '../api/fetchRandomRecipeAPI';
import { FavoriteService } from '../services/favoriteService';

function HomeScreen() {
    const [userName, setUserName] = React.useState('...');
    const [userAvatar, setUserAvatar] = React.useState('');
    const [apiRecipes, setApiRecipes] = React.useState<Recipe[]>([]);
    const [isLoading, setIsLoading] = React.useState<boolean>(false);

    const [selectedRecipe, setSelectedRecipe] = React.useState<Recipe | null>(null);
    const [isDetalModalOpen, setIsDetalModalOpen] = React.useState(false);
    
    const [favoriteRecipes, setFavoriteRecipes] = React.useState<Recipe[]>([]);
    const [activeTab, setActiveTab] = React.useState('discover');

    // Các state bổ sung để chạy tính năng Share
    const [userRecipes, setUserRecipes] = React.useState<Recipe[]>([]);
    const [isShareModalOpen, setIsShareModalOpen] = React.useState(false);

    const AVT_DEFAULT = Config.AVT_DEFAULT!;
    
    useFocusEffect(
        React.useCallback(() => {
            const fetchData = async () => {
                try {
                    const currentUser = auth.currentUser;
                    if (currentUser) {
                        const userDocRef = doc(db, "Users", currentUser.uid);
                        const userDoc = await getDoc(userDocRef);
                        if (userDoc.exists()) {
                            const userData = userDoc.data() as User;
                            setUserName(userData.name || 'Người dùng');
                            const finalAvatar = userData.avatar && userData.avatar.trim() !== '' ? userData.avatar : AVT_DEFAULT;
                            setUserAvatar(finalAvatar);
                        }

                        const favData = await FavoriteService.getFavorites();
                        setFavoriteRecipes(favData);
                    }
                } catch (error) {
                    console.log("Lỗi khi tải dữ liệu Home:", error);
                }
            };
            fetchData();
        }, [])
    );

    // Lấy danh sách món ăn cá nhân để chọn khi share
    const fetchUserRecipes = async () => {
        const user = auth.currentUser;
        if (!user) return;
        try {
            const q = query(collection(db, "Recipes"), where("idUser", "==", user.uid));
            const querySnapshot = await getDocs(q);
            const data = querySnapshot.docs.map(doc => ({ idRecipe: doc.id, ...doc.data() } as Recipe));
            setUserRecipes(data);
        } catch (error) {
            console.log("Lỗi fetch món cá nhân:", error);
        }
    };

    const handleOpenShare = () => {
        fetchUserRecipes(); // Tải lại món cá nhân trước khi mở modal
        setIsShareModalOpen(true);
    };

    const handleToggleFavorite = async (item: Recipe) => {
        const isFav = favoriteRecipes.some(fav => fav.idRecipe === item.idRecipe);
        try {
            const result = await FavoriteService.toggleFavorite(item, isFav);
            if (result) {
                setFavoriteRecipes([{...item, isFavorite: true}, ...favoriteRecipes]);
            } else {
                setFavoriteRecipes(favoriteRecipes.filter(fav => fav.idRecipe !== item.idRecipe));
            }
        } catch (error) {
            console.log(error);
        }
    };

    const handleRecipeDetail = (recipe: Recipe) => {
        setSelectedRecipe(recipe);
        setIsDetalModalOpen(true);
    };

    const handleDiscover = async () => {
        setActiveTab('discover');
        setIsLoading(true);
        const data = await fetchRandomRecipeAPI();
        if (data) {
            setApiRecipes(prev => [data, ...prev]);
        }
        setIsLoading(false);
    };

    const handleShareToCommunity = async (recipe: Recipe) => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const checkQ = query(collection(db, "CommunityPosts"), where("idRecipe", "==", recipe.idRecipe), where("userId", "==", user.uid));
        const checkSnapshot = await getDocs(checkQ);
        if (!checkSnapshot.empty) {
          Alert.alert("Thông báo", "Bạn đã chia sẻ món ăn này rồi!");
          return;
        }

        const postData = {
          ...recipe,
          userId: user.uid,
          userName: userName, 
          userAvatar: userAvatar, 
          sharedAt: serverTimestamp(),
          likesCount: 0,
          likedBy: [] 
        };

        await addDoc(collection(db, "CommunityPosts"), postData);
        Alert.alert("Thành công", "Món ăn đã được đăng lên cộng đồng!");
        setIsShareModalOpen(false);
      } catch (error) {
        Alert.alert("Lỗi", "Không thể chia sẻ món ăn.");
        console.log(error);
      }
    };

    const renderContent = () => {
        if (isLoading && apiRecipes.length === 0 && activeTab === 'discover') {
            return <ActivityIndicator size="large" color="#F97316" style={{ marginTop: 50 }} />;
        }

        if (activeTab === 'discover') {
            if (apiRecipes.length === 0) {
                return (
                    <View style={styles.emptyContainer}>
                        <IconMaterial name="auto-fix" size={80} color="#FFEDD5" />
                        <Text style={styles.emptyText}>Bấm "Công thức gợi ý" để bắt đầu</Text>
                    </View>
                );
            }
            return (
                <FlatList
                    data={apiRecipes}
                    keyExtractor={(item, index) => item.idRecipe + index}
                    numColumns={2}
                    columnWrapperStyle={styles.row}
                    contentContainerStyle={styles.flatListContent}
                    renderItem={({ item }) => (
                        <RecipeCard 
                            recipe={item} 
                            onPress={() => handleRecipeDetail(item)} 
                            isMine={false} 
                        />
                    )}
                    ListFooterComponent={isLoading ? <ActivityIndicator color="#F97316" /> : null}
                />
            );
        }

        if (activeTab === 'community') {
            // SỬ DỤNG COMPONENT CỘNG ĐỒNG THẬT
            return (
                <CommunityFeed 
                    // userRecipes={userRecipes} 
                    onOpenShareModal={handleOpenShare}
                />
            );
        }

        if (activeTab === 'favorite') {
            if (favoriteRecipes.length === 0) {
                return (
                    <View style={styles.emptyContainer}>
                        <IconMaterial name="heart-outline" size={80} color="#FFEDD5" />
                        <Text style={styles.emptyText}>Bạn chưa có món ăn yêu thích nào</Text>
                    </View>
                );
            }
            return (
                <FlatList
                    data={favoriteRecipes}
                    keyExtractor={(item) => item.idRecipe}
                    numColumns={2}
                    columnWrapperStyle={styles.row}
                    contentContainerStyle={styles.flatListContent}
                    renderItem={({ item }) => {
                        const isFav = favoriteRecipes.some(fav => fav.idRecipe === item.idRecipe);
                        return (
                            <RecipeCard 
                                recipe={{ ...item, isFavorite: isFav }} 
                                onPress={() => handleRecipeDetail(item)} 
                                isMine={false} 
                                showFavoriteBtn={true} 
                                onToggleFavorite={() => handleToggleFavorite(item)} 
                            />
                        );
                    }}
                />
            );
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient
                colors={['#1e1b4b', '#4c1d95', '#1e3a8a']}
                style={StyleSheet.absoluteFill}
            />
            
            {/* Header giữ nguyên như cũ */}
            <LinearGradient
                colors={['#000428', '#004e92', '#0f0c29']} 
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.headerContainer}
            >
                <View style={styles.headerTop}>
                    <View style={styles.avatarHeader}> 
                        {userAvatar ? (
                            <Image source={{ uri: userAvatar }} style={styles.avatar} key={userAvatar} />
                        ) : (
                            <ActivityIndicator color="#F97316" />
                        )}
                    </View>
                    <View style={styles.buttonHeader}>
                        <TouchableOpacity style={styles.buttonSearch}>
                            <IconMaterial name='home-search' size={20} color='white' />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.buttonFavorite}>
                            <IconMaterial name='heart' size={20} color='white' />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.userInfo}>
                    <Text style={{color: '#F97316', fontSize: 20, fontWeight: 'bold'}}>
                        Hi, {userName}
                    </Text>
                </View>
            </LinearGradient>

            {/* Menu ngang */}
            <View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalMenu}>
                    <TouchableOpacity 
                        style={[styles.menuItem, activeTab === 'community' && styles.menuBtn]}
                        onPress={() => setActiveTab('community')}
                    >
                        <Text style={styles.menuText}>Món cộng đồng</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.menuItem, activeTab === 'favorite' && styles.menuBtn]}
                        onPress={() => setActiveTab('favorite')}
                    >
                        <Text style={styles.menuText}>Yêu thích</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={[styles.menuItem, activeTab === 'discover' && styles.menuBtn]} 
                        onPress={handleDiscover}
                    >
                        <Text style={styles.menuText}>Công thức gợi ý</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>

            <View style={{ flex: 1 }}>
                {renderContent()}
            </View>

            {/* Các Modals */}
            <RecipeDetailModal 
                isOpen={isDetalModalOpen}
                recipe={selectedRecipe}
                onBack={() => {
                    setIsDetalModalOpen(false);
                    setSelectedRecipe(null);
                }}
            />
            <ShareRecipeModal 
              isOpen={isShareModalOpen}
              onClose={() => setIsShareModalOpen(false)}
              recipes={userRecipes}
              onShare={ handleShareToCommunity}
            />
        </SafeAreaView>
    );
}
// Giữ nguyên Styles cũ của bạn bên dưới...
const styles = StyleSheet.create({
    container: { flex: 1 },
    headerContainer: {
        paddingTop: 10, 
        paddingHorizontal: 20,
        paddingBottom: 15,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        marginBottom: 10,
        elevation: 10,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    avatarHeader: {
        width: 70,
        height: 70,
        borderWidth: 2,
        borderColor: '#F97316',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        overflow: 'hidden', // Quan trọng để ảnh không tràn khỏi border radius
        marginBottom: 10,
    },
    avatar: { width: '100%', height: '100%' },
    buttonHeader: { flexDirection: "row", gap: 12 },
    buttonFavorite: {
        width: 42, height: 42, backgroundColor: '#F97316',
        borderRadius: 21, justifyContent: 'center', alignItems: 'center',
    },
    buttonSearch: {
        width: 42, height: 42, backgroundColor: '#F97316',
        borderRadius: 21, justifyContent: 'center', alignItems: 'center',
    },
    userInfo: { marginTop: 5 },
    horizontalMenu: { paddingVertical: 10, paddingLeft: 10 },
    menuItem: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 18, paddingVertical: 10,
        borderRadius: 25, marginRight: 12,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
    },
    menuBtn: { backgroundColor: '#F97316', borderColor: '#FFF' },
    menuText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
    flatListContent: { paddingBottom: 100, paddingTop: 5 },
    row: { justifyContent: 'space-between', paddingHorizontal: 15 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 80 },
    emptyText: { fontSize: 16, fontWeight: '600', color: '#E5E7EB', marginTop: 15 },
});

export default HomeScreen;