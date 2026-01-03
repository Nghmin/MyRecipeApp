import { formatDistanceToNow } from 'date-fns';
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
    return'';
  }
};