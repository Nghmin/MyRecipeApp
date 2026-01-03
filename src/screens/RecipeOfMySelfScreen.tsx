import React, { useState, useEffect } from 'react';
import { 
  StyleSheet,ImageBackground ,Text, View, TouchableOpacity, ActivityIndicator, Alert, FlatList ,TextInput
} from 'react-native';
// import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
// import LinearGradient from 'react-native-linear-gradient';
import { ChefHat, Plus } from 'lucide-react-native';
import IconMaterial from 'react-native-vector-icons/MaterialCommunityIcons';
//
import { collection, query, where, onSnapshot, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '../config/firebaseConfig'; 
//
import { Recipe } from '../models/Recipe';
 
//
import { AddRecipeModal } from '../components/AddRecipeModal';
import { RecipeDetailModal } from '../components/RecipeDetailModal';
import { RecipeCard } from '../components/RecipeCard';

import { FavoriteService } from '../services/favoriteService';
import { deleteImageFromSupabase } from '../services/uploadService';

const MyRecipeBackground = require('../assets/themeMyRecipe.jpg');

export default function RecipeOfMySelfScreen() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetalModalOpen, setIsDetalModalOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  const [searchQuery, setSearchQuery]= useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  const [favoriteRecipes,setFavoriteRecipes] =React.useState<Recipe[]>([]);

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
      querySnapshot.forEach((doc) => {
        recipesData.push({
          ...doc.data(),
          idRecipe: doc.id  
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
    setIsDetalModalOpen(true);
  };

  const handleAddRecipeSuccess = () => {
    setEditingRecipe(null);
    setIsAddModalOpen(false);
  };

  const handleEditPress = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setIsAddModalOpen(true);
  };

  const handleDeleteRecipe = (idRecipe: string, recipeName: string , imageUrl :string) => {
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
          setFavoriteRecipes([{...item, isFavorite: true}, ...favoriteRecipes]);
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
    return <ActivityIndicator size="large" color="#F97316" style={{ marginTop: 50 }} />;
  }

  // Trường hợp 1: Không có món nào
  if (recipes.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <ChefHat size={80} color="#FFEDD5" /> 
          <Text style={styles.emptyText}>Chưa có công thức nào.</Text>
          <Text style={styles.emptySubText}>Bấm nút "+" để bắt đầu nấu nhé!</Text>
      </View>
    );
  }

  // Trường hợp 2: Có món trong Storage nhưng ko tìm thấy món
  if (filteredRecipes.length === 0 && searchQuery.length > 0) {
    return (
      <View style={styles.emptyContainer}>
        <IconMaterial name="database-search-outline" size={80} color="#fb8e00ff" />
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
      renderItem={({ item }) =>{ 
        const isFav = favoriteRecipes.some(fav => fav.idRecipe === item.idRecipe);
        return(
          <RecipeCard 
            recipe={{ ...item, isFavorite: isFav }}
            onPress={() => handleRecipeDetail(item)}
            onDelete={() => handleDeleteRecipe(item.idRecipe, item.name ,item.image)}
            onEdit={() => handleEditPress(item)}
            isMine={true} 
            showFavoriteBtn={false}
            onToggleFavorite={() => handleToggleFavorite(item)} 
          />
        )
      }}
    />
  );
};

  return (
    <ImageBackground 
            source={MyRecipeBackground} 
            style={styles.background}
            resizeMode="cover" 
        >
      <SafeAreaView style={styles.container}>
        
        {/* <LinearGradient
          colors={['#1e1b4b', '#4c1d95', '#1e3a8a']}
          style={StyleSheet.absoluteFill}
        /> */}
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <ChefHat size={28} color="#FFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Công Thức Của Tôi</Text>
            <Text style={styles.headerSubtitle}>Lưu giữ hương vị riêng của bạn</Text>
          </View>
          <TouchableOpacity 
          style={styles.findingButtonHeader}
          onPress ={() =>{
            setIsSearchVisible(!isSearchVisible)
            if(isSearchVisible) setSearchQuery('')
          }}>
            <IconMaterial name={isSearchVisible ? 'close' : 'book-search'} size={isSearchVisible ? 24 : 30} color='white' />
          </TouchableOpacity>
        </View>
        {isSearchVisible && (
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <IconMaterial name="magnify" size={24} color="#6B7280" />
              <TextInput
                placeholder="Tìm kiếm công thức của bạn ..."
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
          <Plus size={32} color="#FFF" strokeWidth={3} />
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
          isOpen={isDetalModalOpen}
          recipe={selectedRecipe}
          onBack={() => {
            setIsDetalModalOpen(false);
            setSelectedRecipe(null);
          }}
          showSocialFeatures={false}
        />
      </SafeAreaView>
    </ImageBackground>
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
    paddingVertical: 15,
    gap: 12,
    backgroundColor: 'rgba(234, 223, 210, 0.9)',
  },
  headerIcon: {
    width: 50,
    height: 50,
    backgroundColor: '#F97316',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  findingButtonHeader: {
    width: 45,
    height: 45,
    backgroundColor: '#F97316',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flatListContent: {
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 100, 
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
    color: '#fffefdff',
    marginTop: 10,
    
  },
  emptySubText: {
    fontSize: 16,
    color: '#ffffffff',
    textAlign: 'center',
  },
  buttonAddRecipe: {
    position: 'absolute',
    bottom: 95,
    right: 25,
    width: 55,
    height: 55,
    backgroundColor: '#F97316',
    borderRadius: 33,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },

  searchContainer: {
    backgroundColor: 'rgba(234, 223, 210, 0.9)',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 45,
    // Đổ bóng cho thanh search
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#1F2937',
    paddingVertical: 0,
  }
});