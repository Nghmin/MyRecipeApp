import RNBlobUtil from 'react-native-blob-util';
import { decode } from 'base64-arraybuffer'; 
import { supabase } from '../config/supabaseConfig';
import { Platform } from 'react-native';

export const deleteImageFromSupabase = async (imageUrl: string) => {
  try {
    if (!imageUrl || !imageUrl.includes('supabase.co')) return;

    const bucketName = 'MyFirstApp';
    const searchStr = `/${bucketName}/`;
    const parts = imageUrl.split(searchStr);
    
    if (parts.length < 2) return;
    const filePath = parts[1].split('?')[0]; 

    console.log("Đang tiến hành xóa file:", filePath);

    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);

    if (error) {
      console.error("Lỗi từ Supabase Storage:", error.message);
      return;
    }

    console.log(" Đã xóa ảnh cũ thành công");
  } catch (error) {
    console.error(" Lỗi hệ thống khi xóa ảnh:", error);
  }
};

export const uploadImageToSupabase = async (uri: string, folder: string, userId: string) => {
  try {
    console.log("--- Bắt đầu Upload ---");
    console.log("Gốc URI:", uri);
    
    let cleanFilePath = uri;
    if (Platform.OS === 'android') {
      // Xử lý cả file:// và file:///
      cleanFilePath = uri.replace(/^file:\/\/\//, '/').replace(/^file:\/\//, '/');
      cleanFilePath = decodeURIComponent(cleanFilePath);
    }

    console.log("Đường dẫn sau khi làm sạch:", cleanFilePath);

    const fileExt = uri.split('?')[0].split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${userId}_${Date.now()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    let base64Data: string;
    try {
      base64Data = await RNBlobUtil.fs.readFile(cleanFilePath, 'base64');
    } catch (readErr: any) {
      console.error("Lỗi đọc file (FS):", readErr.message);
      // Thử lại với URI gốc nếu đường dẫn làm sạch thất bại
      try {
        base64Data = await RNBlobUtil.fs.readFile(uri, 'base64');
      } catch (finalErr: any) {
        throw new Error(`Không thể đọc file từ thiết bị: ${finalErr.message}`);
      }
    }

    const { data, error } = await supabase.storage
      .from('MyFirstApp') 
      .upload(filePath, decode(base64Data), { 
        contentType: `image/${fileExt === 'png' ? 'png' : 'jpeg'}`,
        upsert: true
      });

    if (error) {
      console.error("Lỗi từ phía Supabase:", error.message);
      throw error;
    }

    const { data: publicUrlData } = supabase.storage
      .from('MyFirstApp')
      .getPublicUrl(filePath);

    console.log("==> Upload thành công! URL:", publicUrlData.publicUrl);
    return publicUrlData.publicUrl;

  } catch (err: any) {
    console.error('--- UPLOAD THẤT BẠI ---');
    console.error('Chi tiết lỗi:', err.message || err);
    return null;
  }
};
