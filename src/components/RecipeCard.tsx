import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Clock} from 'lucide-react-native';
import IconMaterial from 'react-native-vector-icons/MaterialCommunityIcons';
import { Recipe } from '../models/Recipe';

import { formatRelativeTime } from '../utils/dateUtils';

interface RecipeCardProps {
  recipe: Recipe;
  onPress: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  isMine?: boolean;
  onToggleFavorite?: () => void;
  showFavoriteBtn?: boolean;
}

export const RecipeCard = React.memo(({ recipe, onPress, onDelete, onEdit ,isMine = false,onToggleFavorite,showFavoriteBtn = false}: RecipeCardProps) => {
  return (
    <View style={styles.card}>
      <TouchableOpacity
        onLongPress={onDelete}
        delayLongPress={500}
        onPress={onPress}
        activeOpacity={0.9}
      >
        {/*Ảnh món*/}
        <Image 
          source={{ uri: recipe.image || 'https://via.placeholder.com/400' }} 
          style={styles.cardImage} 
        />

        {/*Đánh giá*/}
        <View style={styles.timingBadge}>
          <Text style={{ color: '#9CA3AF', fontSize: 11 }}>
                    {formatRelativeTime(recipe.createdAtRecipe)}
          </Text>
        </View>
        
        {/*Tên và thời gian làm */}
        <View style={styles.cardInfo}>
          <Text style={styles.recipeName} numberOfLines={1}>{recipe.name}</Text>
          <View style={styles.metaInfo}>
            <Clock size={12} color="#F97316" />
            <Text style={styles.metaText}>{recipe.prepTime} phút</Text>
          </View>
        </View>
      </TouchableOpacity>
      {isMine && (<>
        <TouchableOpacity 
            style={styles.editBtn}
            onPress={onEdit}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <IconMaterial name='book-edit' size={18} color="#511b1bff" />
        </TouchableOpacity>
        </>)}
        {showFavoriteBtn && (
            <TouchableOpacity 
                style={styles.favouriteBtn}
                onPress={onToggleFavorite}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
                <IconMaterial 
                name={recipe.isFavorite ? 'heart' : 'heart-outline'} 
                size={24} 
                color={recipe.isFavorite ? "#f51818" : '#f0f0f1ff'} 
                />
            </TouchableOpacity>
            )}
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    width: '48%', 
    marginBottom: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    overflow: 'hidden', 
    borderWidth:1,
    borderColor :'#F97316',
  },
  cardImage: {
    width: '100%',
    height: 140,
  },
  timingBadge: {
    position: 'absolute',
    left: 0,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderTopRightRadius: 15,
    borderTopLeftRadius:15,
    borderBottomRightRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  cardInfo: {
    padding: 10,
  },
  recipeName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: '#6B7280',
  },
  editBtn: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: '#FFEDD5',
    padding: 6,
    borderRadius: 8,
  },
  favouriteBtn: {
    position: 'absolute',
    padding: 3,
    borderRadius: 8,
    backgroundColor:'gray'
  },
});