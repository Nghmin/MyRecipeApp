import React, { useState, useRef, useEffect } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, FlatList,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import IconMaterial from 'react-native-vector-icons/MaterialCommunityIcons';
import { aiService } from '../services/aiService';

//const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  suggestions?: any[]; 
}

interface AIComponentModalProps {
  visible: boolean;
  onClose: () => void;
  onRecipeGenerated: (recipe: any) => void;
}

const AIComponentModal = ({ visible, onClose, onRecipeGenerated }: AIComponentModalProps) => {
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Xin chào! Tôi là trợ lý AI Cook. Bạn đang có nguyên liệu gì trong bếp nhỉ?',
      sender: 'ai'
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Cuộn xuống cuối khi có tin nhắn mới
  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, isTyping]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), text: inputText, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = inputText;
    setInputText('');
    setIsTyping(true);

    try {
      const suggestions = await aiService.getDishSuggestions(currentInput);
      if (suggestions && Array.isArray(suggestions)) {
        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          text: `Dựa trên ${currentInput}, tôi gợi ý cho bạn một số món sau. Bạn muốn xem công thức món nào?`,
          sender: 'ai',
          suggestions: suggestions
        };
        setMessages(prev => [...prev, aiMsg]);
      } else {
        throw new Error();
      }
    } catch (error) {
        console.log("Lỗi khi lấy gợi ý món ăn:", error);
        setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            text: 'Rất tiếc, tôi gặp chút trục trặc. Bạn có thể thử lại với nguyên liệu khác không?',
            sender: 'ai'
        }]);
      
    } finally {
      setIsTyping(false);
    }
  };

  const handleSelectDish = async (dishName: string) => {
    if (isTyping) return; // Chống nhấn 2 lần hoặc nhấn khi đang xử lý

    setIsTyping(true);
    setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: `Tôi chọn món: ${dishName}`,
        sender: 'user'
    }]);

    try {
      const recipe = await aiService.getRecipeDetails(dishName);
      if (recipe) {
        // Gửi lời chúc của AI trước khi đóng
        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          text: recipe.aiChefMessage || `Xong rồi đây! Tôi đã tạo công thức món ${dishName} cho bạn. Chúc bạn ngon miệng nhé!`,
          sender: 'ai'
        };
        setMessages(prev => [...prev, aiMsg]);
        setIsTyping(false);

        // Chờ 2.5 giây để người dùng đọc lời chúc rồi mới đóng
        setTimeout(() => {
          onRecipeGenerated(recipe);
          onClose();
          // Reset chat cho lần sau sau khi modal đã đóng hẳn
          setTimeout(() => {
              setMessages([{
                  id: '1',
                  text: 'Xin chào! Tôi là trợ lý AI Cook. Bạn đang có nguyên liệu gì nhỉ?',
                  sender: 'ai'
              }]);
              aiService.resetChat();
          }, 500);
        }, 2500);
      }
    } catch (error) {
        console.log("Lỗi khi lấy chi tiết món ăn:", error);
        setIsTyping(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[styles.messageRow, item.sender === 'user' ? styles.userRow : styles.aiRow]}>
      {item.sender === 'ai' && (
        <View style={styles.aiAvatar}>
          <IconMaterial name="robot" size={20} color="#fff" />
        </View>
      )}
      <View style={[styles.bubble, item.sender === 'user' ? styles.userBubble : styles.aiBubble]}>
        <Text style={styles.messageText}>{item.text}</Text>

        {item.suggestions && (
          <View style={styles.suggestionsContainer}>
            {item.suggestions.map((s, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.suggestionItem, isTyping && { opacity: 0.5 }]}
                onPress={() => handleSelectDish(s.name)}
                disabled={isTyping}
              >
                <Text style={styles.suggestionTitle}>{s.name}</Text>
                <Text style={styles.suggestionBrief}>{s.brief}</Text>
                <IconMaterial name="chevron-right" size={20} color="#F97316" />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <LinearGradient
          colors={['rgba(15, 23, 42, 0.98)', 'rgba(30, 41, 59, 0.98)']}
          style={styles.container}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>AI Chef Chat</Text>
              <View style={styles.statusRow}>
                <View style={styles.onlineDot} />
                <Text style={styles.statusText}>Đang trực tuyến</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <IconMaterial name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Chat Content */}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={item => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.chatList}
            showsVerticalScrollIndicator={false}
          />

          {isTyping && (
            <View style={styles.typingIndicator}>
              <ActivityIndicator size="small" color="#F97316" />
              <Text style={styles.typingText}>Đầu bếp đang suy nghĩ...</Text>
            </View>
          )}

          {/* Input Area */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
          >
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Nhập nguyên liệu..."
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={inputText}
                onChangeText={setInputText}
                multiline
              />
              <TouchableOpacity
                style={[styles.sendBtn, !inputText.trim() && styles.disabledBtn]}
                onPress={handleSendMessage}
              >
                <LinearGradient colors={['#F97316', '#EA580C']} style={styles.sendGradient}>
                  <IconMaterial name="send" size={22} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </LinearGradient>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  container: {
    flex: 1,
    marginTop: 60,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  header: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22C55E', marginRight: 6 },
  statusText: { fontSize: 12, color: '#94A3B8' },
  closeBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12 },

  chatList: { padding: 20, paddingBottom: 40 },
  messageRow: { flexDirection: 'row', marginBottom: 20, maxWidth: '85%' },
  userRow: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  aiRow: { alignSelf: 'flex-start' },

  aiAvatar: {
    width: 36, height: 36, borderRadius: 12, backgroundColor: '#F97316',
    justifyContent: 'center', alignItems: 'center', marginRight: 10, elevation: 5
  },
  bubble: { padding: 14, borderRadius: 20 },
  userBubble: {
    backgroundColor: '#F97316',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  messageText: { color: '#fff', fontSize: 15, lineHeight: 22 },

  suggestionsContainer: { marginTop: 15, gap: 10 },
  suggestionItem: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 12,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  suggestionTitle: { flex: 1, color: '#F97316', fontWeight: 'bold', fontSize: 14 },
  suggestionBrief: { flex: 2, color: '#CBD5E1', fontSize: 12, marginRight: 10 },

  typingIndicator: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 25, marginBottom: 10 },
  typingText: { color: '#94A3B8', fontSize: 12, marginLeft: 8, fontStyle: 'italic' },

  inputWrapper: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 10,
    color: '#fff',
    maxHeight: 100,
    fontSize: 15
  },
  sendBtn: { marginLeft: 12 },
  sendGradient: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  disabledBtn: { opacity: 0.5 },
});

export default AIComponentModal;