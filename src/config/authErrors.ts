export const getAuthErrorMessage = (errorCode : any) => {
  switch (errorCode) {
    // LỖI ĐĂNG NHẬP (LOGIN)
    case 'auth/invalid-email':
      return 'Email không đúng định dạng. Vui lòng kiểm tra lại.';
    case 'auth/user-disabled':
      return 'Tài khoản này đã bị khóa hoặc vô hiệu hóa.';
    case 'auth/user-not-found':
      return 'Tài khoản không tồn tại trên hệ thống.';
    case 'auth/wrong-password':
      return 'Mật khẩu không chính xác.';
    case 'auth/invalid-credential':
      return 'Email hoặc mật khẩu không chính xác.';

    // LỖI ĐĂNG KÝ (REGISTER) 
    case 'auth/email-already-in-use':
      return 'Email này đã được sử dụng. Hãy thử đăng nhập hoặc dùng email khác.';
    case 'auth/weak-password':
      return 'Mật khẩu quá yếu. Bạn nên dùng ít nhất 6 ký tự.';
    case 'auth/missing-password':
      return 'Vui lòng nhập mật khẩu.';

    // LỖI HỆ THỐNG & KẾT NỐI 
    case 'auth/network-request-failed':
      return 'Lỗi kết nối mạng. Vui lòng kiểm tra lại wifi/4G.';
    case 'auth/too-many-requests':
      return 'Hành động bị chặn do thử quá nhiều lần. Hãy quay lại sau ít phút.';
    case 'auth/operation-not-allowed':
      return 'Phương thức đăng nhập này chưa được quản trị viên cho phép.';
    case 'auth/internal-error':
      return 'Lỗi hệ thống nội bộ. Vui lòng thử lại sau.';

    default:
      console.log("Mã lỗi Firebase chưa bắt:", errorCode);
      return 'Đã có lỗi xảy ra. Vui lòng thử lại sau.';
  }
};
