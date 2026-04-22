import React from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native';
import { Star } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { formatRelativeTime } from '../utils/dateUtils';
import Config from 'react-native-config';
import { useTheme } from '../theme/ThemeContext';

const AVT_DEFAULT = Config.AVT_DEFAULT!;

interface MenuProps {
  onEdit?: (() => void) | null;
  onDelete?: (() => void) | null;
}

interface CommentProps {
  comment: {
    id: string;
    userAvatar?: string;
    userName: string;
    content: string;
    rating: number,
    createdAt: any;
    userId: string;
  };
  isMine: boolean;
  isPostOwner: boolean;
  onDelete?: (commentId: string) => void;
  onEdit?: (comment: any) => void;
}

export const CommentItem = ({ comment, isMine, isPostOwner, onDelete, onEdit }: CommentProps) => {
  const { currentTheme } = useTheme();

  const handleLongPress = () => {
    if (!isMine && !isPostOwner) return;

    const menuOptions: MenuProps = {
      onEdit: isMine ? () => onEdit?.(comment) : null,
      onDelete: (isMine || isPostOwner) ? () => onDelete?.(comment.id) : null,
    };

    Toast.show({
      type: 'optionMenu',
      text1: 'Quản lý bình luận',
      text2: 'Chọn thao tác bạn muốn thực hiện',
      position: 'top',
      autoHide: false,
      props: menuOptions
    });
  };

  const renderStars = (rating: number) => {
    return (
      <View style={styles.starContainer}>
        {[...Array(5)].map((_, index) => (
          <Star
            key={index}
            size={10}
            color={index < rating ? "#FBBF24" : "#4B5563"}
            fill={index < rating ? "#FBBF24"   : "transparent"}
          />
        ))}
      </View>
    );
  };

  return (
    <TouchableOpacity onLongPress={handleLongPress} delayLongPress={500} activeOpacity={0.7}>
      <View style={styles.commentRow}>
        <Image
          source={{ uri: comment.userAvatar || AVT_DEFAULT }}
          style={styles.miniAvatar}
        />
        <View style={styles.commentBody}>
          <View style={styles.userInfo}>
            <Text style={[styles.commentUser, { color: currentTheme.primary }]}>
              {comment.userName}
            </Text>
            {renderStars(comment.rating)}
            <Text style={styles.commentTime}>
              {formatRelativeTime(comment.createdAt)}
            </Text>
          </View>
          <Text style={styles.commentText}>{comment.content}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  commentRow: {
    flexDirection: 'row',
    marginBottom: 15,
    gap: 10
  },
  miniAvatar: {
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: '#374151'
  },
  commentBody: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    flex: 1,
    paddingHorizontal: 2,
    paddingVertical: 5,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  starContainer: {
    flexDirection: 'row',
    marginLeft: 8,
    gap: 2,
  },
  commentUser: {
    fontWeight: 'bold',
    fontSize: 13,

  },
  commentText: {
    //color: '#F97316', 
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  commentTime: {
    color: '#6B7280',
    fontSize: 10,
    paddingLeft: 5,
    marginLeft: 'auto',
  }
});