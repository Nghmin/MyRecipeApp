import React from 'react';
import { View, Text, StyleSheet,TouchableOpacity , ImageBackground } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';

import { CommunityFeed } from '../components/CommunityFeed';
import { RecipeDetailModal } from '../components/RecipeDetailModal';

import {Recipe} from '../models/Recipe';
import { SafeAreaView } from 'react-native-safe-area-context';
const HomeBackground = require('../assets/themeHome.jpg');
export default function MyPostsScreen({navigation}:any) {
    const [selectedRecipe, setSelectedRecipe] = React.useState<Recipe | null>(null);
    const [isDetalModalOpen, setIsDetalModalOpen] = React.useState(false);

    const handleRecipeDetail = (recipe: Recipe) => {
            setSelectedRecipe(recipe);
            setIsDetalModalOpen(true);
    };
    
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }}>
        <ImageBackground 
            source={HomeBackground} 
            style={styles.background}
            resizeMode="cover" 
        >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft color="white" size={28} />
        </TouchableOpacity>
        <Text style={styles.title}>Bài đăng của tôi</Text>
        <View style={{ width: 28 }} /> 
      </View>
      

      <CommunityFeed
        onPressDetailPost={handleRecipeDetail}  
        mode="mine" 
      />

      <RecipeDetailModal 
            isOpen={isDetalModalOpen}
            recipe={selectedRecipe}
            onBack={() => {
                setIsDetalModalOpen(false);
                setSelectedRecipe(null);
            }}
            showSocialFeatures= {true}
        />
        </ImageBackground>
    </SafeAreaView>

    
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1, 
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    padding: 20, 
    alignItems: 'center' ,
    backgroundColor: 'rgba(29, 8, 8, 0.56)',
  },
  title: { color: 'white', fontSize: 20, fontWeight: 'bold' }
});