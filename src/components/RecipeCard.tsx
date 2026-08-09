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
    marginBottom: 20,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: 'rgba(30, 41, 59, 0.95)',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  imageContainer: {
    width: '100%',
    height: 140,
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
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timingText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '600',
  },
  cardInfo: {
    padding: 12,
  },
  recipeName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  aiBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
    elevation: 4,
  },
  aiBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  editBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  favBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});