import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import Config from "react-native-config";

const firebaseConfig = {
  apiKey:Config.FIREBASE_API_KEY!,
  authDomain:Config.FIREBASE_AUTH_DOMAIN!,
  projectId:Config.FIREBASE_PROJECT_ID!,
  storageBucket:Config.FIREBASE_STORAGE_BUCKET!,
  messagingSenderId:Config.FIREBASE_MESSAGING_SENDER_ID!,
  appId:Config.FIREBASE_APP_ID!,
  measurementId:Config.FIREBASE_MEASUREMENT_ID!
};
console.log("Firebase :",Config.FIREBASE_API_KEY);
// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig); // Khởi tạo ứng dụng Firebase để sử dụng trong toàn bộ app
//const analytics = getAnalytics(firebaseApp); // Analytics là tùy chọn, dùng để theo dõi và phân tích người dùng hoạt động trong app
const auth = getAuth(firebaseApp); // Dùng để xác thực người dùng (đăng nhập, đăng ký, quản lý phiên đăng nhập, v.v.)
const db = getFirestore(firebaseApp);// Dùng để tương tác với Firestore (cơ sở dữ liệu NoSQL thời gian thực của Firebase)
export { auth, db };