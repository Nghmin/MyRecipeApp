import React, { useState, useEffect } from 'react';
import {
  StyleSheet, ImageBackground, Text, View, TouchableOpacity, ActivityIndicator, Alert, FlatList, TextInput, StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { ChefHat, Plus } from 'lucide-react-native';
import IconMaterial from 'react-native-vector-icons/MaterialCommunityIcons';
//
import { collection, query, where, onSnapshot, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '../components/config/firebaseConfig';
//
import { Recipe } from '../models/Recipe';

//
import { AddRecipeModal } from '../components/AddRecipeModal';
import { RecipeDetailModal } from '../components/RecipeDetailModal';
import { RecipeCard } from '../components/RecipeCard';

import { FavoriteService } from '../services/favoriteService';
import { deleteImageFromSupabase } from '../services/uploadService';

import { useTheme } from '../theme/ThemeContext';


const MyRecipeBackground = require('../assets/themeMyRecipe.jpg');

export default function RecipeOfMySelfScreen() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  const [favoriteRecipes, setFavoriteRecipes] = React.useState<Recipe[]>([]);

  const { currentTheme } = useTheme();

  // Lắng nghe dữ liệu thời gian thực từ Firestore
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }
    const q = query(
      collection(db, "Recipes"),
      where("idUser", "==", user.uid),
      orderBy('createdAtRecipe', 'desc')
    );
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const recipesData: Recipe[] = [];
      querySnapshot.forEach((d) => {
        recipesData.push({
          ...d.data(),
          idRecipe: d.id
        } as Recipe);
      });
      setRecipes(recipesData);
      setLoading(false);
    }, (error) => {
      console.error("Lỗi lắng nghe dữ liệu:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // useFocusEffect(
  //       React.useCallback(() => {
  //         const loadFavs = async () => {
  //           const data = await FavoriteService.getFavorites();
  //           setFavoriteRecipes(data);
  //         };
  //         loadFavs();
  //       }, [])
  //   );

  const handleRecipeDetail = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setIsDetailModalOpen(true);
  };

  const handleAddRecipeSuccess = () => {
    setEditingRecipe(null);
    setIsAddModalOpen(false);
  };

  const handleEditPress = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setIsAddModalOpen(true);
  };

  const handleDeleteRecipe = (idRecipe: string, recipeName: string, imageUrl: string) => {
    const user = auth.currentUser;
    Alert.alert(
      "Xác nhận xóa",
      `Bạn có chắc chắn muốn xóa món "${recipeName}" không?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              if (imageUrl && imageUrl.includes('supabase.co')) {
                await deleteImageFromSupabase(imageUrl);
              }
              await deleteDoc(doc(db, "Recipes", idRecipe));
              if (user) {
                await deleteDoc(doc(db, "Users", user.uid, "Favorites", idRecipe));
              }
            } catch (error) {
              console.error("Lỗi khi xóa món:", error);
              Alert.alert("Lỗi", "Không thể xóa món ăn lúc này.");
            }
          }
        }
      ]
    );
  };



  const handleToggleFavorite = async (item: Recipe) => {
    const isFav = favoriteRecipes.some(fav => fav.idRecipe === item.idRecipe);
    try {
      const result = await FavoriteService.toggleFavorite(item, isFav);

      if (result) {
        setFavoriteRecipes([{ ...item, isFavorite: true }, ...favoriteRecipes]);
      } else {
        setFavoriteRecipes(favoriteRecipes.filter(fav => fav.idRecipe !== item.idRecipe));
      }
    } catch (error) {
      console.log(error);
    }
  };

  const filteredRecipes = recipes.filter(recipe =>
    recipe.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderContent = () => {
    if (loading) {
      return <ActivityIndicator size="large" color={currentTheme.primary} style={{ marginTop: 50 }} />;
    }

    // Trường hợp 1: Không có món nào
    if (recipes.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <ChefHat size={80} color="#FFEDD5" />
          <Text style={styles.emptyText}>Chưa có công thức nào.</Text>
          <Text style={styles.emptySubText}>Bấm nút "+" để lưu giữ công thức của riêng bạn!</Text>
        </View>
      );
    }

    // Trường hợp 2: Có món trong Storage nhưng ko tìm thấy món
    if (filteredRecipes.length === 0 && searchQuery.length > 0) {
      return (
        <View style={styles.emptyContainer}>
          <IconMaterial name="database-search-outline" size={80} color={currentTheme.primary} />
          <Text style={styles.emptyText}>Không tìm thấy món "{searchQuery}"</Text>
          <Text style={styles.emptySubText}>Hãy thử tìm tên khác xem sao nhé!</Text>
        </View>
      );
    }

    // Trường hợp 3: Hiển thị danh sách (Gốc hoặc đã lọc)
    return (
      <FlatList
        data={filteredRecipes}
        keyExtractor={(item) => item.idRecipe}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.flatListContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const isFav = favoriteRecipes.some(fav => fav.idRecipe === item.idRecipe);
          return (
            <RecipeCard
              recipe={{ ...item, isFavorite: isFav }}
              onPress={() => handleRecipeDetail(item)}
              onDelete={() => handleDeleteRecipe(item.idRecipe, item.name, item.image)}
              onEdit={() => handleEditPress(item)}
              isMine={true}
              isAIGenerated={false}
              showFavoriteBtn={false}
              onToggleFavorite={() => handleToggleFavorite(item)}
            />
          )
        }}
      />
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <ImageBackground
        source={MyRecipeBackground}
        style={styles.background}
        resizeMode="cover"
        blurRadius={10}
      >
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.4)' }]} />

        <SafeAreaView style={styles.container}>
          {/* Top Gradient for Status Bar clarity */}
          <LinearGradient
            colors={['rgba(0,0,0,0.6)', 'transparent']}
            style={{ height: 100, position: 'absolute', top: 0, left: 0, right: 0 }}
          />

          {/* Header */}
          <View style={styles.header}>
            <LinearGradient colors={[currentTheme.primary, currentTheme.secondary]} style={styles.headerIcon}>
              <ChefHat size={26} color="#FFF" />
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Công Thức Của Tôi</Text>
              <Text style={styles.headerSubtitle}>Lưu giữ hương vị riêng của bạn</Text>
            </View>
            <TouchableOpacity
              style={[styles.findingButtonHeader, { backgroundColor: currentTheme.primary, borderColor: currentTheme.primary }]}
              onPress={() => {
                setIsSearchVisible(!isSearchVisible)
                if (isSearchVisible) setSearchQuery('')
              }}>
              <IconMaterial name={isSearchVisible ? 'close' : 'book-search'} size={isSearchVisible ? 24 : 30} color='white' />
            </TouchableOpacity>
          </View>

          {isSearchVisible && (
            <View style={styles.searchContainer}>
              <View style={styles.searchBar}>
                <IconMaterial name="magnify" size={24} color="#9CA3AF" />
                <TextInput
                  placeholder="Tìm kiếm công thức ..."
                  placeholderTextColor="#9CA3AF"
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus={true}
                />
              </View>
            </View>
          )}

          {renderContent()}

          {/* Floating Action Button */}
          <TouchableOpacity
            onPress={() => setIsAddModalOpen(true)}
            style={styles.buttonAddRecipe}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[currentTheme.primary, currentTheme.secondary]}
              style={styles.fabGradient}
            >
              <Plus size={32} color="#FFF" strokeWidth={3} />
            </LinearGradient>
          </TouchableOpacity>

          {/* Modals */}
          <AddRecipeModal
            isOpen={isAddModalOpen}
            initialData={editingRecipe}
            onClose={() => {
              setIsAddModalOpen(false);
              setEditingRecipe(null);
            }}
            onAddRecipe={handleAddRecipeSuccess}
          />

          <RecipeDetailModal
            isOpen={isDetailModalOpen}
            recipe={selectedRecipe}
            onBack={() => {
              setIsDetailModalOpen(false);
              setSelectedRecipe(null);
            }}
            showSocialFeatures={false}
          />
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,

  },
  background: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 2,
  },
  findingButtonHeader: {
    width: 42,
    height: 42,
    backgroundColor: '#F97316',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.4)',
  },
  flatListContent: {
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 120,
  },
  row: {
    justifyContent: 'space-between',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
    marginTop: 15,
  },
  emptySubText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginTop: 5,
  },
  buttonAddRecipe: {
    position: 'absolute',
    bottom: 100,
    right: 25,
    elevation: 10,
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    zIndex: 999,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },

  searchContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 46,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: '#FFF',
    paddingVertical: 0,
  }
});