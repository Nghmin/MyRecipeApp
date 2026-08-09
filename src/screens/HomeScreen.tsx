import {
    StyleSheet, Text, TouchableOpacity, View,
    Image, ScrollView, StatusBar
} from 'react-native';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { auth, db } from '../config/firebaseConfig';
import Config from "react-native-config";
import Toast from 'react-native-toast-message';

import { collection, addDoc, serverTimestamp, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';

import { RecipeDetailModal } from '../components/RecipeDetailModal';
import { ShareRecipeModal } from '../components/ShareRecipeModal';
import { CommunityFeed } from '../components/CommunityFeed';
import AIComponentModal from '../components/AiModal';

import { Recipe } from '../models/Recipe';

import IconMaterial from 'react-native-vector-icons/MaterialCommunityIcons';

import { FavoriteService } from '../services/favoriteService';

import { useTheme } from '../theme/ThemeContext';
import { useUser } from '../theme/UserContext';

const AVT_DEFAULT = Config.AVT_DEFAULT!;

function HomeScreen({ navigation }: any) {
    const { currentTheme } = useTheme();
    const { userProfile } = useUser();

    const [selectedRecipe, setSelectedRecipe] = React.useState<Recipe | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = React.useState(false);

    const [aiRecipes, setAiRecipes] = React.useState<Recipe[]>([]);
    const [favoriteRecipes, setFavoriteRecipes] = React.useState<any[]>([]);
    const [activeTab, setActiveTab] = React.useState('community');
    const [isAIModalVisible, setIsAIModalVisible] = React.useState(false);

    const [userRecipes, setUserRecipes] = React.useState<Recipe[]>([]);
    const [sharedRecipeIds, setSharedRecipeIds] = React.useState<string[]>([]);
    const [isShareModalOpen, setIsShareModalOpen] = React.useState(false);

    const userName = userProfile?.name || 'Người dùng';
    const userAvatar = userProfile?.avatar || AVT_DEFAULT;

    useFocusEffect(
        React.useCallback(() => {
            const fetchData = async () => {
                try {
                    if (userProfile) {
                        const favData = await FavoriteService.getFavorites();
                        setFavoriteRecipes(favData);

                        const aiQ = query(
                            collection(db, "Recipes"),
                            where("idUser", "==", userProfile.uid),
                            where("isAI", "==", true)
                        );
                        const aiSnapshot = await getDocs(aiQ);
                        const aiData = aiSnapshot.docs.map(d => ({
                            idRecipe: d.id,
                            ...d.data()
                        } as Recipe));
                        setAiRecipes(aiData);
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
            const q = query(collection(db, "Recipes"), where("idUser", "==", user.uid));
            const querySnapshot = await getDocs(q);
            const data = querySnapshot.docs.map(d => ({ idRecipe: d.id, ...d.data() } as Recipe));
            setUserRecipes(data);

            const sharedQ = query(collection(db, "CommunityPosts"), where("idUser", "==", user.uid));
            const sharedSnapshot = await getDocs(sharedQ);
            const sharedIds = sharedSnapshot.docs.map(d => d.data().idRecipe);
            setSharedRecipeIds(sharedIds);

            setIsShareModalOpen(true);
        } catch (error) {
            console.log("Lỗi chuẩn bị chia sẻ:", error);
        }
    };

    const toastShow = (type: string, title: string, text: string) => {
        Toast.show({
            type: type,
            text1: title,
            text2: text,
            position: 'top',
            topOffset: 60,
            visibilityTime: 3000,
            props: { primaryColor: currentTheme.primary }
        });
    }

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

    const handleAIRecipeGenerated = async (recipe: any) => {
        if (!userProfile) return;

        try {
            const recipeData = {
                ...recipe,
                idUser: userProfile.uid,
                createdAt: serverTimestamp(),
                isAI: true
            };

            const docRef = await addDoc(collection(db, "Recipes"), recipeData);
            const newRecipe = { ...recipeData, idRecipe: docRef.id };

            setAiRecipes(prev => [newRecipe, ...prev]);
            setSelectedRecipe(newRecipe);
            setIsDetailModalOpen(true);

            toastShow('success', 'Đã lưu!', `Món ${recipe.name} đã được lưu vào sổ tay AI.`);
        } catch (error) {
            console.log("Lỗi khi lưu món AI:", error);
            setAiRecipes(prev => [recipe, ...prev]);
            setSelectedRecipe(recipe);
            setIsDetailModalOpen(true);
        }
    };

    const handleDeleteAIRecipe = async (recipeId: string, recipeName: string) => {
        Toast.show({
            type: 'confirm',
            text1: 'Xác nhận xóa',
            text2: `Bạn có chắc chắn muốn xóa công thức "${recipeName}" khỏi lịch sử không?`,
            position: 'top',
            topOffset: 60,
            props: {
                primaryColor: currentTheme.primary,
                onConfirm: async () => {
                    try {
                        // Thực hiện xóa trong DB
                        await deleteDoc(doc(db, "Recipes", recipeId));


                        if (isDetailModalOpen) {
                            setIsDetailModalOpen(false);
                            setSelectedRecipe(null);
                        }

                        // Cập nhật state local
                        setAiRecipes(prev => prev.filter(r => r.idRecipe !== recipeId));

                        // Hiển thị thông báo thành công sau khi Modal đã đóng hẳn (để dùng Toast của HomeScreen)
                        setTimeout(() => {
                            toastShow('success', 'Đã xóa', `Đã xóa món ${recipeName} khỏi lịch sử.`);
                        }, 500);

                    } catch (error) {
                        console.log("Lỗi khi xóa món AI:", error);
                        toastShow('error', 'Lỗi', 'Không thể xóa món ăn này.');
                    }
                }
            }
        });
    };

    const handleClearAIHistory = async () => {
        if (!userProfile) return;

        Toast.show({
            type: 'confirm',
            text1: 'Xác nhận xóa tất cả',
            text2: 'Bạn có chắc muốn xóa toàn bộ lịch sử gợi ý AI không? Hành động này không thể hoàn tác.',
            position: 'top',
            topOffset: 60,
            props: {
                primaryColor: currentTheme.primary,
                onConfirm: async () => {
                    try {
                        const q = query(
                            collection(db, "Recipes"),
                            where("idUser", "==", userProfile.uid),
                            where("isAI", "==", true)
                        );
                        const snapshot = await getDocs(q);
                        const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, "Recipes", d.id)));
                        await Promise.all(deletePromises);

                        setAiRecipes([]);
                        toastShow('success', 'Thành công', 'Đã xóa sạch lịch sử gợi ý AI.');
                    } catch (error) {
                        console.log("Lỗi xóa lịch sử AI:", error);
                        toastShow('error', 'Lỗi', 'Không thể xóa lịch sử lúc này.');
                    }
                }
            }
        });
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
                toastShow('error', 'Đăng bài thất bại!', 'Bạn đã chia sẻ món ăn này rồi!');
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
            toastShow('success', 'Đăng bài thành công!', 'Mọi người sẽ thấy được món ngon từ bạn🎉.');
            setIsShareModalOpen(false);
        } catch (error) {
            toastShow('error', 'Đăng bài thất bại!', 'Không thể chia sẻ món ăn!');
            console.log(error);
        }
    };

    const renderHeader = () => (
        <View style={styles.headerWrapper}>
            <View style={styles.topHeader}>
                <View style={styles.userInfoLeft}>
                    <TouchableOpacity style={styles.avatarContainer}>
                        <Image source={{ uri: userAvatar }} style={styles.avatarImg} />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.helloText}>Hello, {userName}</Text>
                        <Text style={styles.subHelloText}>Let's find something delicious</Text>
                    </View>
                </View>
                <View style={styles.headerRightActions}>
                    <TouchableOpacity
                        style={styles.topMenuBtn}
                        onPress={() => navigation.navigate('MyPosts')}
                    >
                        <IconMaterial name="briefcase-variant" size={26} color="#1E293B" />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.menuWrapper}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalMenu}>
                    <TouchableOpacity
                        style={[styles.menuItem, activeTab === 'community' && { backgroundColor: currentTheme.primary, borderColor: currentTheme.primary }]}
                        onPress={() => setActiveTab('community')}
                    >
                        <Text style={[styles.menuText, activeTab === 'community' && styles.menuTextActive]}>Cộng đồng</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.menuItem, activeTab === 'favorite' && { backgroundColor: currentTheme.primary, borderColor: currentTheme.primary }]}
                        onPress={() => setActiveTab('favorite')}
                    >
                        <Text style={[styles.menuText, activeTab === 'favorite' && styles.menuTextActive]}>Yêu thích</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.menuItem, activeTab === 'ai' && { backgroundColor: currentTheme.primary, borderColor: currentTheme.primary }]}
                        onPress={() => setActiveTab('ai')}
                    >
                        <Text style={[styles.menuText, activeTab === 'ai' && styles.menuTextActive]}>Gợi ý AI</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        </View>
    );

    const renderContent = () => {
        return (
            <View style={{ flex: 1 }}>
                <View style={{ flex: 1, display: activeTab === 'community' ? 'flex' : 'none' }}>
                    <CommunityFeed
                        onOpenShareModal={handleOpenShare}
                        mode="all"
                        onPressDetailPost={handleRecipeDetail}
                        onFavoriteChange={handleToggleFavorite}
                        ListHeaderComponent={renderHeader()}
                    />
                </View>

                <View style={{ flex: 1, display: activeTab === 'favorite' ? 'flex' : 'none' }}>
                    <CommunityFeed
                        mode="favorites"
                        onPressDetailPost={handleRecipeDetail}
                        onFavoriteChange={handleToggleFavorite}
                        ListHeaderComponent={renderHeader()}
                    />
                </View>

                <View style={{ flex: 1, display: activeTab === 'ai' ? 'flex' : 'none', paddingHorizontal: 15 }}>
                    <ScrollView showsVerticalScrollIndicator={false}>
                        {renderHeader()}

                        {aiRecipes.length === 0 ? (
                            <View style={styles.aiCardContainer}>
                                <TouchableOpacity
                                    style={styles.aiCard}
                                    onPress={() => setIsAIModalVisible(true)}
                                    activeOpacity={0.9}
                                >
                                    <View style={styles.aiCardIconWrapper}>
                                        <IconMaterial name="robot" size={40} color={currentTheme.primary} />
                                    </View>
                                    <View style={styles.aiCardContent}>
                                        <Text style={styles.aiCardTitle}>Trợ lý AI Chef</Text>
                                        <Text style={styles.aiCardDesc}>Nhập nguyên liệu bạn có, AI sẽ gợi ý công thức nấu ăn ngon nhất!</Text>
                                        <View style={[styles.aiCardBadge, { backgroundColor: currentTheme.primary }]}>
                                            <Text style={styles.aiCardBadgeText}>Bắt đầu ngay</Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={{ paddingHorizontal: 10, paddingBottom: 100 }}>
                                <View style={styles.aiListHeader}>
                                    <Text style={styles.aiListTitle}>Công thức AI của bạn</Text>
                                    <TouchableOpacity
                                        onPress={handleClearAIHistory}
                                        style={styles.clearAiBtn}
                                    >
                                        <Text style={styles.clearAiText}>Xóa lịch sử</Text>
                                    </TouchableOpacity>
                                </View>

                                {aiRecipes.map((item, index) => (
                                    <TouchableOpacity
                                        key={item.idRecipe || index}
                                        style={styles.recipeListItem}
                                        onPress={() => handleRecipeDetail(item)}
                                        activeOpacity={0.7}
                                    >
                                        <Image source={{ uri: item.image }} style={styles.recipeListImg} />
                                        <View style={styles.recipeListContent}>
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Text style={[styles.recipeListTitle, { flex: 1 }]} numberOfLines={1}>{item.name}</Text>
                                                <TouchableOpacity
                                                    onPress={() => handleDeleteAIRecipe(item.idRecipe!, item.name)}
                                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                                >
                                                    <IconMaterial name="close-circle-outline" size={20} color="#94A3B8" />
                                                </TouchableOpacity>
                                            </View>
                                            <Text style={styles.recipeListDesc} numberOfLines={2}>{item.description}</Text>
                                            <View style={styles.recipeListFooter}>
                                                <View style={styles.recipeListTag}>
                                                    <IconMaterial name="robot" size={10} color={currentTheme.primary} style={{ marginRight: 4 }} />
                                                    <Text style={[styles.recipeListTagText, { color: currentTheme.primary }]}>AI Chef</Text>
                                                </View>
                                                <Text style={styles.recipeListTime}>{item.cookTime || '20 phút'}</Text>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </ScrollView>

                    <TouchableOpacity
                        style={[styles.aiFabBtn, { backgroundColor: currentTheme.primary }]}
                        onPress={() => setIsAIModalVisible(true)}
                        activeOpacity={0.8}
                    >
                        <IconMaterial name="robot" size={28} color="white" />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#E2E8F0' }}>
            <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
            <SafeAreaView style={styles.container}>
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
                    onDeleteRecipe={(id, name) => {
                        handleDeleteAIRecipe(id, name);
                    }}
                />

                <ShareRecipeModal
                    isOpen={isShareModalOpen}
                    onClose={() => setIsShareModalOpen(false)}
                    recipes={userRecipes}
                    sharedRecipeIds={sharedRecipeIds}
                    onShare={handleShareToCommunity}
                />

                <AIComponentModal
                    visible={isAIModalVisible}
                    onClose={() => setIsAIModalVisible(false)}
                    onRecipeGenerated={handleAIRecipeGenerated}
                />
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingBottom: 30,
    },
    headerWrapper: {
        paddingTop: 10,
        marginBottom: 10,
    },
    topHeader: {
        borderBottomWidth: 1,
        borderColor: '#1e1817',
        borderRadius: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 10,
        marginBottom: 20,
    },
    userInfoLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatarContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        overflow: 'hidden',
        backgroundColor: '#FFF',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    avatarImg: {
        width: '100%',
        height: '100%',
    },
    helloText: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1E293B',
    },
    headerRightActions: {
        flexDirection: 'row',
        gap: 10,
        alignItems: 'center',
    },
    subHelloText: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '500',
        marginTop: 2,
    },
    topMenuBtn: {
        width: 46,
        height: 46,
        borderRadius: 14,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    menuWrapper: {
        marginBottom: 10,
        marginHorizontal: 5,
    },
    horizontalMenu: {
        paddingLeft: 10,
    },
    menuItem: {
        backgroundColor: 'rgba(30, 41, 59, 0.05)',
        paddingHorizontal: 22,
        paddingVertical: 10,
        borderRadius: 20,
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    menuText: {
        color: '#64748B',
        fontWeight: '700',
        fontSize: 14,
    },
    menuTextActive: {
        color: '#FFF',
    },
    aiCardContainer: {
        padding: 20,
    },
    aiCard: {
        backgroundColor: '#1E293B',
        borderRadius: 24,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    aiCardIconWrapper: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    aiCardContent: {
        flex: 1,
        marginLeft: 15,
    },
    aiCardTitle: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    aiCardDesc: {
        color: '#94A3B8',
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 10,
    },
    aiCardBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    aiCardBadgeText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    aiFabBtn: {
        position: 'absolute',
        bottom: 130,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        zIndex: 999,
    },
    aiListHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    aiListTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    clearAiBtn: {
        padding: 5,
    },
    clearAiText: {
        color: '#64748B',
        fontSize: 13,
    },
    recipeListItem: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        borderRadius: 20,
        marginBottom: 15,
        padding: 10,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    recipeListImg: {
        width: 90,
        height: 90,
        borderRadius: 16,
    },
    recipeListContent: {
        flex: 1,
        marginLeft: 15,
        justifyContent: 'space-between',
        paddingVertical: 2,
    },
    recipeListTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1E293B',
    },
    recipeListDesc: {
        fontSize: 12,
        color: '#64748B',
        lineHeight: 16,
    },
    recipeListFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    recipeListTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF7ED',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#FFEDD5',
    },
    recipeListTagText: {
        fontSize: 11,
        fontWeight: 'bold',
    },
    recipeListTime: {
        fontSize: 11,
        color: '#94A3B8',
        fontWeight: '500',
    },
});

export default HomeScreen;