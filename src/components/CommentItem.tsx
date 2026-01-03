import React from 'react';
import { StyleSheet, Text, View, Image ,TouchableOpacity ,Alert , } from 'react-native';

import { Star } from 'lucide-react-native';

import { formatRelativeTime } from '../utils/dateUtils';


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
  onEdit?:(comment: any) => void;
}

const renderStars = (rating: number) => {
    return (
      <View style={styles.starContainer}>
        {[...Array(5)].map((_, index) => (
          <Star
            key={index}
            size={10} 
            color={index < rating ? "#FBBF24" : "#4B5563"} 
            fill={index < rating ? "#FBBF24" : "transparent"} 
          />
        ))}
      </View>
    );
};

  


export const CommentItem = ({ comment , isMine, isPostOwner, onDelete , onEdit }: CommentProps) => {
    
    const handleLongPress = () => {
        const options = [];
        if (isMine || isPostOwner){ 
            options.push({ 
                text: "Xóa bình luận", 
                style: "destructive" as const, 
                onPress: () => onDelete?.(comment.id) 
            });
        }
        if (isMine) {
            options.push({ 
                text: "Sửa bình luận", 
                onPress: () => onEdit?.(comment) 
            });
        }
        if (options.length > 0) {
            options.push({ 
                text: "Hủy", 
                style: "cancel" as const,
            });
            Alert.alert("Quản lý bình luận", "Chọn thao tác bạn muốn thực hiện", options);
        }
    };

    // const handleDeleteComment = async (commentId: string) => {
    //     try {
    //         const commentRef = doc(db, "CommunityPosts", selectedPost.id, "Comments", commentId);
    //         await deleteDoc(commentRef);
    //         const postRef = doc(db, "CommunityPosts", selectedPost.id);
    //         await updateDoc(postRef, {
    //         commentsCount: increment(-1)
    //         });
            
    //     } catch (error) {
    //         console.log("Lỗi khi xóa bình luận:", error);
    //     }
    // };

    return (
        <TouchableOpacity onLongPress={handleLongPress} delayLongPress={500} activeOpacity={0.7}>
        <View style={styles.commentRow}>
            <Image 
            source={{ uri: comment.userAvatar || 'https://via.placeholder.com/150' }} 
            style={styles.miniAvatar} 
            />
            <View style={styles.commentBody}>
                <View style = {styles.userInfo}>
                    <Text style={styles.commentUser}>{comment.userName}</Text>
                    {renderStars(comment.rating)}
                    <Text style={styles.commentTime}>{formatRelativeTime(comment.createdAt)}</Text>
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
    borderRadius:16,
    backgroundColor:'#374151' 
  },
  commentBody: { 
    backgroundColor: 'rgba(255,255,255,0.05)', 
    borderRadius: 12, 
    flex: 1,
    paddingHorizontal: 2, 
    paddingVertical: 5,
  },
  userInfo:{
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
    color: '#F97316', 
    fontWeight: 'bold', 
    fontSize: 13 ,
  },
  commentText: { 
    color:'#F97316', 
    fontSize: 14, 
    lineHeight: 20 ,
    flex: 1,
  },
  commentTime: { 
    color: '#6B7280',
    fontSize: 10, 
    paddingLeft: 5,
    marginLeft: 'auto',
  }
});