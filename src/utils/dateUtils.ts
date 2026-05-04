import { formatDistanceToNow, format, differenceInDays } from 'date-fns';
import { vi } from 'date-fns/locale'; 

export const formatRelativeTime = (timestamp: any) => {
  if (!timestamp) return '';
  const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
  try {
    return formatDistanceToNow(date, { 
      addSuffix: true, 
      locale: vi      
    });
  } catch (error) {
    console.log(error);
    return '';
  }
};

// Hàm dành riêng cho thông báo theo yêu cầu của bạn
export const formatNotificationTime = (timestamp: any) => {
  if (!timestamp) return 'Vừa xong';

  // Chuyển đổi timestamp từ Firebase hoặc Date thường
  const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
  const now = new Date();

  // Tính toán độ lệch (giây)
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  // 1. Xử lý lỗi lệch thời gian server (nếu thời gian gửi > thời gian hiện tại hoặc quá mới)
  if (diffInSeconds < 60) {
    return 'Vừa xong';
  }

  // 2. Nếu dưới 7 ngày (1 tuần) -> Hiện thời gian tương đối
  const diffInDays = differenceInDays(now, date);
  if (diffInDays < 7) {
    return formatDistanceToNow(date, {
      addSuffix: true,
      locale: vi
    });
  }

  // 3. Nếu trên 1 tuần -> Hiện ngày tháng năm và giờ
  // Định dạng: 15/05/2024 14:30
  return format(date, 'dd/MM/yyyy HH:mm', { locale: vi });
};