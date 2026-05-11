import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Clock, Sparkles } from 'lucide-react-native';
import IconMaterial from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { Recipe } from '../models/Recipe';
import { formatRelativeTime } from '../utils/dateUtils';

import {useTheme} from '../theme/ThemeContext';

interface RecipeCardProps {
  recipe: Recipe;
  onPress: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  isMine?: boolean;
  isAIGenerated?: boolean;
  onToggleFavorite?: () => void;
  showFavoriteBtn?: boolean;
}

export const RecipeCard = React.memo(({
    recipe,
    onPress,
    onDelete,
    onEdit,
    isMine = false,
    isAIGenerated = false,
    onToggleFavorite,
    showFavoriteBtn = false
}: RecipeCardProps) => {
  const { currentTheme } = useTheme();
  return (
    <TouchableOpacity
      style={styles.container}
      onLongPress={onDelete}
      delayLongPress={800}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.12)', 'rgba(255, 255, 255, 0.04)']}
        style={[styles.card, { borderColor: currentTheme.primary }]}
      >
        {/* Ảnh món với viền mờ */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: recipe.image || 'https://via.placeholder.com/400' }}
            style={styles.cardImage}
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.6)']}
            style={[styles.imageOverlay, { borderColor: currentTheme.primary }]}
          />

          {/* Thời gian đăng */}
          {!isAIGenerated && (
            <View style={styles.timingBadge}>
              <Text style={styles.timingText}>
                {formatRelativeTime(recipe.createdAtRecipe || new Date())}
              </Text>
            </View>
          )}
        </View>
        
        {/* Thông tin món ăn */}
        <View style={styles.cardInfo}>
          <Text style={styles.recipeName} numberOfLines={1}>{recipe.name}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Clock size={12} color= {currentTheme.primary} />
              {!isAIGenerated ?
                (<Text style={styles.metaText}>{recipe.prepTime || '20'} phút</Text>)
                :
                (<Text style={styles.metaText}>{recipe.cookTime || '30'} phút</Text>)
              }
            </View>
            <View style={[styles.metaItem, { marginLeft: 10 }]}>
              <IconMaterial name="signal" size={12} color={currentTheme.primary} />
              <Text style={styles.metaText}>{recipe.difficulty || 'Dễ'}</Text>
            </View>
          </View>
        </View>

        {/* Badge AI */}
        {isAIGenerated && (
          <View style={[styles.aiBadge, { backgroundColor: currentTheme.primary }]}>         
            <Sparkles size={10} color="#FFF" />
            <Text style={styles.aiBadgeText}>AI CHEF</Text>
          </View>
        )}

        {/* Nút chỉnh sửa */}
        {isMine && (
          <TouchableOpacity 
            style={[styles.editBtn , { backgroundColor: currentTheme.primary, borderColor: currentTheme.primary } ]}
            onPress={onEdit}
          >
            <IconMaterial name='pencil' size={16} color="#FFF" />
          </TouchableOpacity>
        )}

        {/* Nút yêu thích */}
        {showFavoriteBtn && (
          <TouchableOpacity
            style={styles.favBtn}
            onPress={onToggleFavorite}
          >
            <IconMaterial
              name={recipe.isFavorite ? 'heart' : 'heart-outline'}
              size={20}
              color={recipe.isFavorite ? "#EF4444" : '#FFF'}
            />
          </TouchableOpacity>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '48%',
    marginBottom: 16,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor:  'rgba(255, 140, 0, 0.4)',
    overflow: 'hidden',
    backgroundColor:'rgba(15, 23, 42, 0.85)',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  imageContainer: {
    width: '100%',
    height: 130,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  timingBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  timingText: {
    color: '#CBD5E1',
    fontSize: 9,
    fontWeight: '600',
  },
  cardInfo: {
    padding: 8,
  },
  recipeName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 10,
    color: '#94A3B8',
  },
  aiBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
    elevation: 4,
  },
  aiBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
  },
  editBtn: {
    position: 'absolute',
    //bottom: 55,
    right: 8,
    backgroundColor:'#F97316',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  favBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});