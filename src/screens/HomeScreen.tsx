import {
    StyleSheet, Text, TouchableOpacity, View, ActivityIndicator,
    Image, FlatList, ScrollView, ImageBackground, StatusBar, Alert
} from 'react-native';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { auth, db } from '../components/config/firebaseConfig';
import Config from "react-native-config";
import Toast from 'react-native-toast-message';


import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, deleteDoc } from 'firebase/firestore';

import { RecipeDetailModal } from '../components/RecipeDetailModal';
import { RecipeCard } from '../components/RecipeCard';
import { ShareRecipeModal } from '../components/ShareRecipeModal';
import { CommunityFeed } from '../components/CommunityFeed';
import AiComponentModal from '../components/AiModal';

import { Recipe } from '../models/Recipe';

import IconMaterial from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';

import { FavoriteService } from '../services/favoriteService';

import { useTheme } from '../theme/ThemeContext';
import { useUser } from '../theme/UserContext';

const AVT_DEFAULT = Config.AVT_DEFAULT!;
const HomeBackground = require('../assets/themeHome.jpg');
const HeaderHomeBackground = require('../assets/themeHeaderHome.jpg');

// Biến toàn cục để quản lý timer thông báo like
function HomeScreen({ navigation }: any) {
    const { currentTheme } = useTheme();
    const { userProfile } = useUser();

    const [apiRecipes, setApiRecipes] = React.useState<Recipe[]>([]);

    const [selectedRecipe, setSelectedRecipe] = React.useState<Recipe | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = React.useState(false);

    const [favoriteRecipes, setFavoriteRecipes] = React.useState<any[]>([]);
    const [activeTab, setActiveTab] = React.useState('community');

    const [userRecipes, setUserRecipes] = React.useState<Recipe[]>([]);
    const [sharedRecipeIds, setSharedRecipeIds] = React.useState<string[]>([]);
    const [isShareModalOpen, setIsShareModalOpen] = React.useState(false);

    const [isAiModalVisible, setAiModalVisible] = React.useState(false);
    //const [userIngredients, setUserIngredients] = React.useState(''); 

    const userName = userProfile?.name || 'Người dùng';
    const userAvatar = userProfile?.avatar || AVT_DEFAULT;

    useFocusEffect(
        React.useCallback(() => {
            const fetchData = async () => {
                try {
                    if (userProfile) {
                        // Lấy danh sách yêu thích
                        const favData = await FavoriteService.getFavorites();
                        setFavoriteRecipes(favData);

                        // Tải danh sách món AI gợi ý của người dùng
                        const aiQuery = query(
                            collection(db, "Recipes"),
                            where("idUser", "==", userProfile.uid),
                            where("isAI", "==", true)
                        );
                        const aiSnapshot = await getDocs(aiQuery);
                        const aiData = aiSnapshot.docs.map(d => ({
                            idRecipe: d.id,
                            ...d.data()
                        } as Recipe));
                        setApiRecipes(aiData);
                    }
                } catch (error) {
                    console.log("Lỗi khi tải dữ liệu Home:", error);
                }
            };
            fetchData();
        }, [userProfile])
    );

    const handleOpenShare = async () => {
        const user = auth.currentUser;
        if (!user) return;
        try {
            // Lấy món cá nhân
            const q = query(collection(db, "Recipes"), where("idUser", "==", user.uid));
            const querySnapshot = await getDocs(q);
            const data = querySnapshot.docs.map(d => ({ idRecipe: d.id, ...d.data() } as Recipe));
            setUserRecipes(data);

            // Lấy danh sách ID đã chia sẻ
            const sharedQ = query(collection(db, "CommunityPosts"), where("idUser", "==", user.uid));
            const sharedSnapshot = await getDocs(sharedQ);
            const sharedIds = sharedSnapshot.docs.map(d => d.data().idRecipe);
            setSharedRecipeIds(sharedIds);

            setIsShareModalOpen(true);
        } catch (error) {
            console.log("Lỗi chuẩn bị chia sẻ:", error);
        }
    };


    const toastShow = async (type: string, title: string, text: string) => {
        Toast.show({
            type: type,
            text1: title,
            text2: text,
            position: 'top',
            topOffset: 60,
            visibilityTime: 3000,
        });
    }

    // Xử lý yêu thích 
    const handleToggleFavorite = async (item: any) => {
        const isFav = favoriteRecipes.some(fav => fav.postId === item.postId);
        try {
            const result = await FavoriteService.toggleFavorite(item, isFav);
            if (result) {
                setFavoriteRecipes(prev => [{ ...item, isFavorite: true }, ...prev]);
            } else {
                setFavoriteRecipes(prev => prev.filter(fav => fav.postId !== item.postId));
            }
        } catch (error) {
            console.log("Lỗi đồng bộ yêu thích tại Home:", error);
        }
    };

    const handleRecipeDetail = (recipe: Recipe) => {
        setSelectedRecipe(recipe);
        setIsDetailModalOpen(true);
    };

    const handleShareToCommunity = async (recipe: Recipe) => {
        try {
            if (!userProfile) return;

            const checkQ = query(
                collection(db, "CommunityPosts"),
                where("idRecipe", "==", recipe.idRecipe),
                where("idUser", "==", userProfile.uid));
            const checkSnapshot = await getDocs(checkQ);
            if (!checkSnapshot.empty) {
                toastShow(
                    'error',
                    'Đăng bài thất bại!',
                    'Bạn đã chia sẻ món ăn này rồi!',
                )
                return;
            }

            const postData = {
                ...recipe,
                idUser: userProfile.uid,
                userName: userName,
                userAvatar: userAvatar,
                sharedAt: serverTimestamp(),
                likesCount: 0,
                commentsCount: 0,
                likedBy: []
            };

            await addDoc(collection(db, "CommunityPosts"), postData);
            toastShow(
                'success',
                'Đăng bài thành công!',
                'Mọi người sẽ thấy được món ngon từ bạn🎉.',
            )
            setIsShareModalOpen(false);
        } catch (error) {
            toastShow(
                'error',
                'Đăng bài thất bại!',
                'Không thể chia sẻ món ăn!',
            )
            console.log(error);
        }
    };

    const handleAskAI = async (recipe: Recipe) => {
        if (!recipe) return;

        try {
            const user = auth.currentUser;
            if (user) {
                // Tự động lưu vào Database Recipes của người dùng
                const recipeData = {
                    ...recipe,
                    idUser: user.uid,
                    createdAt: serverTimestamp(),
                    isAI: true // Đánh dấu món do AI tạo
                };

                const docRef = await addDoc(collection(db, "Recipes"), recipeData);
                const newRecipe = { ...recipeData, idRecipe: docRef.id };

                // Cập nhật lên giao diện
                setApiRecipes(prev => [newRecipe, ...prev]);
                toastShow('success', 'Đã lưu!', `Món ${recipe.name} đã được lưu vào sổ tay của bạn.`);
            }
        } catch (error) {
            console.log("Lỗi khi lưu món AI:", error);
            setApiRecipes(prev => [{ ...recipe, idRecipe: Date.now().toString() }, ...prev]);
        }
    };

    const handleDeleteAiRecipe = (id: string) => {
        Alert.alert(
            "Xác nhận xóa",
            "Bạn có chắc chắn muốn xóa công thức này vĩnh viễn không?",
            [
                { text: "Hủy", style: "cancel" },
                {
                    text: "Xóa",
                    style: "destructive",
                    onPress: async () => {
                        setApiRecipes(prev => prev.filter(r => r.idRecipe !== id));
                        try {
                            await deleteDoc(doc(db, "Recipes", id));
                            toastShow('success', 'Đã xóa', 'Món ăn đã được gỡ bỏ khỏi dữ liệu.');
                        } catch (error) {
                            console.log("Lỗi khi xóa món AI:", error);
                            toastShow('error', 'Lỗi', 'Không thể xóa món ăn khỏi máy chủ.');
                        }
                    }
                }
            ]
        );
    };

    const renderHeader = () => (
        <View>
            {/* Header */}
            <LinearGradient
                colors={['rgba(33, 37, 76, 0.8)', 'rgba(0, 78, 146, 0.6)']}
                style={styles.headerContainer}
            >
                <ImageBackground
                    source={HeaderHomeBackground}
                    style={[styles.headerbackground]}
                    resizeMode="cover"
                    imageStyle={{ opacity: 0.6 }}
                >
                    <View style={styles.headerTop}>
                        <View style={[styles.avatarHeader, { borderColor: currentTheme.primary }]} >
                            {userAvatar ? (
                                <Image source={{ uri: userAvatar }} style={styles.avatar} key={userAvatar} />
                            ) : (
                                <ActivityIndicator color={currentTheme.primary} />
                            )}
                        </View>
                        <View style={styles.buttonHeader}>
                            <TouchableOpacity style={[styles.buttonSearch, { backgroundColor: currentTheme.primary }]}>
                                <IconMaterial name='home-search' size={26} color='white' />
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.buttonFavorite, { backgroundColor: currentTheme.primary }]} onPress={() => navigation.navigate('MyPosts')}>
                                <IconMaterial name='bag-personal' size={26} color='white' />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.userInfo}>
                        <Text style={styles.greetingText}>Xin chào,</Text>
                        <Text style={[styles.userNameText, { color: currentTheme.primary }]}>{userName} 👋</Text>
                    </View>
                </ImageBackground>
            </LinearGradient>

            {/* Menu ngang */}
            <View style={styles.menuWrapper}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalMenu}>
                    <TouchableOpacity
                        style={[[styles.menuItem, { borderColor: currentTheme.primary }], activeTab === 'community' && [styles.menuBtn, { backgroundColor: currentTheme.primary }]]}
                        onPress={() => setActiveTab('community')}
                    >
                        <Text style={styles.menuText}>Cộng đồng</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[[styles.menuItem, { borderColor: currentTheme.primary }], activeTab === 'favorite' && [styles.menuBtn, { backgroundColor: currentTheme.primary }]]}
                        onPress={() => setActiveTab('favorite')}
                    >
                        <Text style={styles.menuText}>Yêu thích</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[[styles.menuItem, { borderColor: currentTheme.primary }], activeTab === 'discover' && [styles.menuBtn, { backgroundColor: currentTheme.primary }]]}
                        onPress={() => {
                            setActiveTab('discover');
                        }}
                    >
                        <Text style={styles.menuText}>AI gợi ý</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        </View>
    );

    const renderContent = () => {
        return (
            <View style={{ flex: 1 }}>
                {/* Tab Cộng đồng */}
                <View style={{ flex: 1, display: activeTab === 'community' ? 'flex' : 'none' }}>
                    <CommunityFeed
                        onOpenShareModal={handleOpenShare}
                        mode="all"
                        onPressDetailPost={handleRecipeDetail}
                        onFavoriteChange={handleToggleFavorite}
                        ListHeaderComponent={renderHeader()}
                    />
                </View>

                {/* Tab AI Gợi ý */}
                <View style={{ flex: 1, display: activeTab === 'discover' ? 'flex' : 'none' }}>
                    <FlatList
                        data={apiRecipes}
                        keyExtractor={(item, index) => item.idRecipe + index}
                        numColumns={2}
                        columnWrapperStyle={styles.row}
                        contentContainerStyle={styles.flatListContent}
                        ListHeaderComponent={<View style={styles.headerWrapper}>{renderHeader()}</View>}
                        renderItem={({ item }) => (
                            <RecipeCard
                                recipe={item}
                                onPress={() => handleRecipeDetail(item)}
                                onDelete={() => handleDeleteAiRecipe(item.idRecipe)}
                                isMine={false}
                                isAIGenerated={true}
                            />
                        )}
                        ListEmptyComponent={() => (
                            <View style={styles.emptyContainer}>
                                <IconMaterial name="robot-confused" size={60} color="#FFEDD5" />
                                <Text style={styles.emptyText}>Nhập nguyên liệu để AI gợi ý món ăn cho bạn!</Text>
                                <TouchableOpacity
                                    style={[styles.aiButton, { backgroundColor: currentTheme.primary }]}
                                    onPress={() => setAiModalVisible(true)}
                                >
                                    <Text style={styles.aiButtonText}>Thử ngay</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    />
                    {/* Nút nổi để hỏi thêm món khác */}
                    <TouchableOpacity
                        style={styles.fabAi}
                        onPress={() => setAiModalVisible(true)}
                    >
                        <View
                            style={[styles.fabAiGradient, { backgroundColor: currentTheme.primary }]}
                        >
                            <IconMaterial name="robot" size={28} color="#fff" />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Tab Yêu thích */}
                <View style={{ flex: 1, display: activeTab === 'favorite' ? 'flex' : 'none' }}>
                    <CommunityFeed
                        mode="favorites"
                        onPressDetailPost={handleRecipeDetail}
                        onFavoriteChange={handleToggleFavorite}
                        ListHeaderComponent={renderHeader()}
                    />
                </View>
            </View>
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#000' }}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            <ImageBackground
                source={HomeBackground}
                style={styles.background}
                resizeMode="cover"
                blurRadius={10}
            >
                <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.4)' }]} />

                <SafeAreaView style={styles.container}>
                    {/* Top Overlay for Status Bar visibility */}
                    <LinearGradient
                        colors={['rgba(0,0,0,0.7)', 'transparent']}
                        style={{ height: 100, position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1 }}
                        pointerEvents="none"
                    />

                    <View style={{ flex: 1 }}>
                        {renderContent()}
                    </View>

                    <RecipeDetailModal
                        isOpen={isDetailModalOpen}
                        recipe={selectedRecipe}
                        onBack={() => {
                            setIsDetailModalOpen(false);
                            setSelectedRecipe(null);
                        }}
                        showSocialFeatures={activeTab === 'community' || activeTab === 'favorite'}
                    />

                    <AiComponentModal
                        visible={isAiModalVisible}
                        onClose={() => setAiModalVisible(false)}
                        onRecipeGenerated={handleAskAI}
                    />
                    <ShareRecipeModal
                        isOpen={isShareModalOpen}
                        onClose={() => setIsShareModalOpen(false)}
                        recipes={userRecipes}
                        sharedRecipeIds={sharedRecipeIds}
                        onShare={handleShareToCommunity}
                    />



                </SafeAreaView>
            </ImageBackground>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingBottom: 30,
    },
    background: {
        flex: 1,

    },
    headerContainer: {
        borderRadius: 25,
        marginTop: 10,
        marginBottom: 15,
        elevation: 10,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    headerbackground: {
        width: '100%',
        paddingTop: 5,
        paddingBottom: 20,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 15,
    },
    avatarHeader: {
        width: 80,
        height: 80,
        borderWidth: 3,
        //borderColor: '#F97316',
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        overflow: 'hidden',
    },
    avatar: { width: '100%', height: '100%' },
    buttonHeader: { flexDirection: "row", gap: 12 },
    buttonFavorite: {
        width: 44, height: 44, //backgroundColor: 'rgba(249, 115, 22, 0.8)',
        borderRadius: 14, justifyContent: 'center', alignItems: 'center',
    },
    buttonSearch: {
        width: 44, height: 44, //backgroundColor: 'rgba(249, 115, 22, 0.8)',
        borderRadius: 14, justifyContent: 'center', alignItems: 'center',
    },
    userInfo: { marginTop: 10, paddingHorizontal: 20 },
    greetingText: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '600' },
    userNameText: { //color: '#F97316',
        fontSize: 24, fontWeight: '800'
    },
    menuWrapper: {
        marginBottom: 10,
        marginHorizontal: 5,
    },
    headerWrapper: {
        marginRight: 15,
        marginLeft: 15,
    },
    horizontalMenu: {
        paddingLeft: 10,
    },
    menuItem: {
        backgroundColor: 'rgba(22, 11, 11, 0.54)',
        paddingHorizontal: 20, paddingVertical: 10,
        borderRadius: 20, marginRight: 10,
        borderWidth: 1, //borderColor: 'rgba(255, 255, 255, 0.15)',
    },
    menuBtn: { //backgroundColor: '#F97316',
        borderColor: '#FFF',
        borderWidth: 1,
    },
    menuText: { color: 'white', fontWeight: 'bold', fontSize: 13 },
    flatListContent: { paddingBottom: 100 },
    row: { justifyContent: 'space-between', paddingHorizontal: 15 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 80 },
    emptyText: {
        fontSize: 16, fontWeight: '600', color: '#f4f2f0ff', marginTop: 15,
        backgroundColor: 'rgba(48, 40, 40, 0.36)',
        padding: 8,
        borderRadius: 15,
    },

    fabAi: {
        position: 'absolute',
        right: 20,
        bottom: 90,
        zIndex: 999,
    },
    fabAiGradient: {
        width: 55,
        height: 55,
        top: 20,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    aiButton: {
        //backgroundColor: '#F97316',
        paddingHorizontal: 25,
        paddingVertical: 12,
        borderRadius: 25,
        marginTop: 15,
    },
    aiButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default HomeScreen;