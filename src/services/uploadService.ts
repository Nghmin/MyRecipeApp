import RNBlobUtil from 'react-native-blob-util';
import { decode } from 'base64-arraybuffer'; 
import { supabase } from '../config/supabaseConfig';

export const deleteImageFromSupabase = async (imageUrl: string) => {
  try {
    // Kiểm tra đầu vào
    if (!imageUrl || !imageUrl.includes('supabase.co')) return;

    //Tách lấy filePath từ URL
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
    // ĐÃ FIX LỖI CÚ PHÁP Ở DÒNG NÀY
    console.error(" Lỗi hệ thống khi xóa ảnh:", error);
  }
};

export const uploadImageToSupabase = async (uri: string, folder: string, userId: string) => {
  try {
    const cleanFilePath = uri.replace('file://', '');
    
    const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${userId}_${Date.now()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const base64Data = await RNBlobUtil.fs.readFile(cleanFilePath, 'base64');

    // 4. Upload lên Supabase dùng ArrayBuffer
    const { data, error } = await supabase.storage
      .from('MyFirstApp') 
      .upload(filePath, decode(base64Data), { 
        contentType: `image/${fileExt === 'png' ? 'png' : 'jpeg'}`,
        upsert: true
      });
      console.log(data);

    if (error) throw error;

    const { data: publicUrlData } = supabase.storage
      .from('MyFirstApp')
      .getPublicUrl(filePath);

    console.log("==> Upload thành công! URL:", publicUrlData.publicUrl);
    return publicUrlData.publicUrl;

  } catch (err: any) {
    console.error('Upload failed:', err.message || err);
    return null;
  }
};