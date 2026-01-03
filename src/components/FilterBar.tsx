import React from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet,ScrollView } from 'react-native';
import {Search, Heart, MessageCircle, Star, Clock } from 'lucide-react-native';

interface FilterBarProps {
  searchQuery: string;
  setSearchQuery: (text: string) => void;
  activeFilter: string; // 'newest' | 'likes' | 'comments' | 'rating'
  onFilterChange: (filter: any) => void;
}

export const FilterBar = ({ searchQuery, setSearchQuery,activeFilter ,onFilterChange  }: FilterBarProps) => {
    const filters = [
        { id: 'newest', label: 'Mới nhất', icon: <Clock size={16} color={activeFilter === 'newest' ? '#2e2b2bff' : '#F97316'} /> },
        { id: 'likes', label: 'Yêu thích nhất', icon: <Heart size={16} color={activeFilter === 'likes' ? '#fff' : '#EF4444'} /> },
        { id: 'comments', label: 'Bình luận nhiều', icon: <MessageCircle size={16} color={activeFilter === 'comments' ? '#fff' : '#10B981'} /> },
        { id: 'rating', label: 'Đánh giá cao', icon: <Star size={16} color={activeFilter === 'rating' ? '#fff' : '#FBBF24'} /> },
    ];
    
    return (
    <View style={styles.container}>
      {/* Thanh tìm kiếm */}
      <View style={styles.searchBox}>
        <Search size={18} color="#9CA3AF" />
        <TextInput
          style={styles.input}
          placeholder="Tìm món ăn..."
          placeholderTextColor="#ecf1faff"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Nút lọc thời gian */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContainer}
      >
        {filters.map((item) => (
          <TouchableOpacity 
            key={item.id}
            style={[
              styles.filterChip, 
              activeFilter === item.id && styles.activeChip
            ]}
            onPress={() => onFilterChange(item.id)}
          >
            {item.icon}
            <Text style={[styles.chipText, activeFilter === item.id && styles.activeText]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { paddingVertical: 10 },
  searchBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(22, 11, 11, 0.54)',
    borderRadius: 15,
    marginHorizontal: 15,
    paddingHorizontal: 15,
    height: 45,
    alignItems: 'center',
    marginBottom: 10,
  },
  input: { flex: 1, color: 'white', marginLeft: 10},
  scrollContainer: {
    paddingHorizontal:5 ,
    gap: 10, 
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(29, 26, 26, 0.67)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 6,
  },
  activeChip: {
    backgroundColor: '#F97316',
    borderColor: '#F97316',
  },
  chipText: { color: '#f3f7feff', fontSize: 13, fontWeight: '500' },
  activeText: { color: '#fff', fontWeight: 'bold' },
});