import React from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet,
  FlatList, Pressable,
  Platform
} from 'react-native';
import { X, Check, Palette } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';


interface ThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: any;
  onSelectTheme: (theme: any) => void;
}

export const menuColors = [
  { id: 'orange', name: 'Cam Cháy', primary: '#F97316', secondary: '#FB923C' },
  { id: 'green', name: 'Lá Xanh', primary: '#22C55E', secondary: '#4ADE80' },
  { id: 'blue', name: 'Xanh Biển', primary: '#3B82F6', secondary: '#60A5FA' },
  { id: 'rose', name: 'Hồng Tình', primary: '#E11D48', secondary: '#FB7185' },
  { id: 'violet', name: 'Tím Khói', primary: '#A855F7', secondary: '#C084FC' },
];


export function ThemeSelectionModal({ isOpen, onClose, currentTheme, onSelectTheme }: ThemeModalProps) {
  
  return (
    <Modal visible={isOpen} animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <Pressable style={styles.dismissArea} onPress={onClose} />
        
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Palette size={20} color={currentTheme.primary} style={{ marginRight: 8 }} />
              <Text style={styles.title}>Giao diện ứng dụng</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X color="rgba(255,255,255,0.5)" size={20} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subTitle}>Chọn màu chủ đạo cho ứng dụng của bạn</Text>

          {/* List Color Options */}
          <FlatList
            data={menuColors}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.listContainer}
            renderItem={({ item }) => {
              const isSelected = currentTheme.id === item.id;
              return (
                <TouchableOpacity 
                  style={[
                    styles.colorCard, 
                    isSelected && { borderColor: item.primary, backgroundColor: 'rgba(255,255,255,0.1)' }
                  ]}
                  onPress={() => onSelectTheme(item)}
                >
                  <LinearGradient
                    colors={[item.primary, item.secondary]}
                    style={styles.colorCircle}
                  >
                    {isSelected && <Check color="white" size={16} strokeWidth={3} />}
                  </LinearGradient>
                  <Text style={[styles.colorName, isSelected && { color: item.primary }]}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />

          <TouchableOpacity 
            style={[styles.doneBtn, { backgroundColor: currentTheme.primary }]} 
            onPress={onClose}
          >
            <Text style={styles.doneBtnText}>Hoàn tất</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.7)', 
    justifyContent: 'flex-end' 
  },
  dismissArea: { flex: 1 },
  container: { 
    backgroundColor: '#1E293B', 
    borderTopLeftRadius: 30, 
    borderTopRightRadius: 30, 
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 10 
  },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  subTitle: { fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 20 },
  closeBtn: { padding: 4 },
  listContainer: { gap: 12 },
  colorCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    margin: 6,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.05)',
    backgroundColor: 'rgba(255,255,255,0.03)'
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10
  },
  colorName: { color: '#CBD5E1', fontWeight: '600', fontSize: 14 },
  doneBtn: {
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 5
  },
  doneBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});