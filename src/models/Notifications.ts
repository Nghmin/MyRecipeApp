export interface Notification {
  idNotification: string;
  idReceiver: string;
  idSender: string; 
  receiverName: string;
  senderName: string;
  type: 'like' | 'comment' | 'follow' | 'share'; 
  postId: string;
  message: string; 
  isRead: false; 
  createdAtNotification?: number;
}