import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';

export const toastConfig = {
  success: ({ text1, text2 }: any) => (
    <View style={styles.toastContainer}>
      <View style={styles.sideBar} />
      <View style={styles.iconCircle}>
        <Icon name="check-decagram" size={28} color="rgba(13, 233, 20, 0.88)" />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{text1}</Text>
        <Text style={styles.message}>{text2}</Text>
      </View> 

    </View>
  ),

  confirm: ({ text1, text2, props }: any) => (
    <View style={styles.confirmBox}>
      <View style={styles.confirmIconCircle}>
        <Icon name="chat-question" size={32} color="#F97316" />
      </View>
      
      <Text style={styles.confirmTitle}>{text1}</Text>
      <Text style={styles.confirmMessage}>{text2}</Text>
      
      <View style={styles.buttonGroup}>
        <TouchableOpacity 
          style={styles.btnCancel} 
          onPress={() => Toast.hide()}
        >
          <Text style={styles.textCancel}>Đóng</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.btnConfirm} 
          onPress={() => {
            if (props.onConfirm) props.onConfirm();
            Toast.hide();
          }}
        >
          <Text style={styles.textConfirm}>Xác nhận</Text>
        </TouchableOpacity>
      </View>
    </View>
  ),


  optionMenu: ({ text1, text2, props }: any) => (
    <View style={styles.menuBox}>
      <Text style={styles.menuTitle}>{text1}</Text>
      {text2 && <Text style={styles.menuMessage}>{text2}</Text>}

      <View style={styles.buttonStack}>
       
        {props.onEdit && (
          <TouchableOpacity 
            style={[styles.menuBtn, styles.editBtn]} 
            onPress={() => { props.onEdit(); Toast.hide(); }}
          >
            <Icon name="pencil-outline" size={18} color="#4F46E5" />
            <Text style={[styles.menuBtnText, { color: '#4F46E5' }]}>Sửa bình luận</Text>
          </TouchableOpacity>
        )}

        {props.onDelete && (
          <TouchableOpacity 
            style={[styles.menuBtn, styles.deleteBtn]} 
            onPress={() => { props.onDelete(); Toast.hide(); }}
          >
            <Icon name="trash-can-outline" size={18} color="#EF4444" />
            <Text style={[styles.menuBtnText, { color: '#EF4444' }]}>Xóa bình luận</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.cancelBtn} onPress={() => Toast.hide()}>
          <Text style={styles.cancelBtnText}>Hủy bỏ</Text>
        </TouchableOpacity>
      </View>
    </View>
  ),

  error: ({ text1, text2 }: any) => (
    <View style={[styles.toastContainer, { borderColor: '#FF4B4B' }]}>
       <Icon name="alert-circle-outline" size={28} color="#FF4B4B" style={{marginRight: 10}} />
       <View style={styles.content}>
          <Text style={[styles.title, {color: '#FF4B4B'}]}>{text1}</Text>
          <Text style={styles.message}>{text2}</Text>
       </View>
    </View>
  )
};

const styles = StyleSheet.create({
  toastContainer: {
    height: 95,
    width: '90%',
    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 2,
    borderColor: 'rgba(13, 233, 20, 0.88)', 
  },
  sideBar: {
    position: 'absolute',
    left: 0,
    height: '60%',
    width: 6,
    backgroundColor: 'rgba(13, 233, 20, 0.88)',
    borderTopRightRadius: 5,
    borderBottomRightRadius: 5,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(249, 115, 22, 0.1)', 
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  message: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },

  // Style confirm 
  confirmBox: {
    width: '80%', 
    backgroundColor: '#f4e8e8f6',
    borderRadius: 24,
    padding: 10,
    alignItems: 'center',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  confirmIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 5,
  },
  confirmMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 5,
    paddingHorizontal: 10,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  btnCancel: {
    flex: 1,
    height: 44,
    backgroundColor: '#F5F5F7',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnConfirm: {
    flex: 1,
    height: 44,
    backgroundColor: '#F97316',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  textCancel: { 
    color: '#8E8E93', 
    fontWeight: '600',
    fontSize: 15 
  },
  textConfirm: { 
    color: '#FFF', 
    fontWeight: '700',
    fontSize: 15 
  },

  //optionMenu
  menuBox: {
    width: '75%',
    backgroundColor: '#FFF',
    borderRadius: 20, 
    padding: 15, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F1F1', 
    elevation: 15,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  menuTitle: { 
    fontSize: 16,
    fontWeight: '800', 
    color: '#333', 
    marginBottom: 2 
  },
  menuMessage: { 
    fontSize: 12, 
    color: '#999', 
    marginBottom: 15,
    textAlign: 'center' 
  },
  buttonStack: { 
    width: '100%', 
    gap: 8 
  },
  menuBtn: { 
    flexDirection: 'row', 
    height: 40, 
    borderRadius: 10, 
    justifyContent: 'center', 
    alignItems: 'center', 
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.03)', 
  },
  editBtn: { 
    backgroundColor: 'rgba(79, 70, 229, 0.08)', 
    borderWidth: 0.5,
    borderColor: 'rgba(79, 70, 229, 0.2)'
  }, 
  deleteBtn: { 
    backgroundColor: 'rgba(239, 68, 68, 0.08)', 
    borderWidth: 0.5,
    borderColor: 'rgba(239, 68, 68, 0.2)'
  }, 
  menuBtnText: { 
    fontSize: 14, 
    fontWeight: '700' 
  },
  cancelBtn: { 
    marginTop: 5,
    height: 30, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  cancelBtnText: { 
    color: '#BBB', 
    fontWeight: '600', 
    fontSize: 13 
  },

});
