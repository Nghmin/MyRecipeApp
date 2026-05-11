import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Image,
  Platform,
} from 'react-native';
import { X, Check } from 'lucide-react-native'; 
import { Recipe } from '../models/Recipe'; 

import Config from "react-native-config";

import { useTheme } from '../theme/ThemeContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const AVT_DEFAULT = Config.AVT_DEFAULT ;

interface ShareRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipes: Recipe[];
  sharedRecipeIds: string[];
  onShare: (recipe: Recipe) => void;
}

export function ShareRecipeModal({ isOpen, onClose, recipes, sharedRecipeIds, onShare }: ShareRecipeModalProps) {
  const [selectedRecipe, setSelectedRecipe] = useState<string | null>(null);
  const { currentTheme } = useTheme();

  const handleShare = () => {
    if (selectedRecipe) {
      const recipeToShare = recipes.find(r => r.idRecipe === selectedRecipe);
      if (recipeToShare) {
        onShare(recipeToShare);
        setSelectedRecipe(null);
        onClose();
      }
    }
  };

  return (
    <Modal
      visible={isOpen}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Backdrop - Click bên ngoài để đóng */}
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={onClose} 
        />

        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Đăng công thức</Text>
              <Text style={styles.headerSubtitle}>Chọn món ăn để chia sẻ với mọi người</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Recipe List */}
          <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
            {recipes.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Bạn chưa có công thức nào</Text>
                <Text style={styles.emptySubText}>Hãy thêm công thức mới để chia sẻ!</Text>
              </View>
            ) : (
              recipes.map((recipe) => {
                const isShared = sharedRecipeIds.includes(recipe.idRecipe);
                return (
                  <TouchableOpacity
                    key={recipe.idRecipe}
                    activeOpacity={isShared ? 1 : 0.7}
                    onPress={() => !isShared && setSelectedRecipe(recipe.idRecipe)}
                    disabled={isShared}
                    style={[
                      styles.recipeItem,
                      selectedRecipe === recipe.idRecipe ? [styles.selectedItem, { borderColor: currentTheme.primary }] : [styles.unselectedItem],
                      isShared && styles.sharedItem
                    ]}
                  >
                    <Image
                      source={{ uri: recipe.image || AVT_DEFAULT}}
                      style={[styles.recipeImage, isShared && { opacity: 0.5 }]}
                    />

                    <View style={styles.infoContainer}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={[styles.recipeName, isShared && { color: '#9CA3AF' }]} numberOfLines={1}>
                          {recipe.name}
                        </Text>
                        {isShared && (
                          <View style={styles.sharedBadge}>
                            <Text style={styles.sharedBadgeText}>Đã chia sẻ</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.recipeDesc, isShared && { color: '#D1D5DB' }]} numberOfLines={1}>
                        {recipe.description}
                      </Text>
                    </View>

                    {selectedRecipe === recipe.idRecipe && !isShared && (
                      <View style={[styles.checkBadge, { backgroundColor: currentTheme.primary }]}>
                        <Check size={14} color="white" strokeWidth={3} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>

          {/* Footer */}
          {recipes.length > 0 && (
            <View style={styles.footer}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelBtnText}>Hủy</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  [styles.shareBtn, { backgroundColor: currentTheme.primary }],
                  !selectedRecipe && [styles.disabledBtn]
                ]} 
                onPress={handleShare}
                disabled={!selectedRecipe}
              >
                <Text style={styles.shareBtnText}>Đăng bài</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    maxHeight: SCREEN_HEIGHT * 0.85,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  closeButton: {
    backgroundColor: '#F3F4F6',
    padding: 8,
    borderRadius: 20,
  },
  listContainer: {
    padding: 24,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
  },
  emptySubText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  recipeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 20,
    borderWidth: 2,
    marginBottom: 12,
  },
  selectedItem: {
    //borderColor: '#F97316',
    backgroundColor: '#FFF7ED',
  },
  unselectedItem: {
    borderColor: '#F3F4F6',
    backgroundColor: 'white',
  },
  sharedItem: {
    borderColor: '#F9FAFB',
    backgroundColor: '#F9FAFB',
    opacity: 0.7,
  },
  recipeImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  infoContainer: {
    flex: 1,
    marginLeft: 12,
  },
  recipeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  recipeDesc: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  sharedBadge: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  sharedBadgeText: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '600',
  },
  checkBadge: {
    //backgroundColor: '#F97316',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#4B5563',
    fontWeight: '600',
  },
  shareBtn: {
    flex: 1,
    //backgroundColor: '#F97316',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  shareBtnText: {
    color: 'white',
    fontWeight: 'bold',
  },
  disabledBtn: {
    backgroundColor: '#E5E7EB',
  }
});