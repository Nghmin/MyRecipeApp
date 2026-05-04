import { GoogleGenerativeAI } from "@google/generative-ai";
import Config from "react-native-config";

// Lấy key từ .env
const apiKey = Config.GEMINI_API_KEY || "";

if (!apiKey || apiKey === "undefined" || apiKey === "") {
  console.warn("Chưa tìm thấy GEMINI_API_KEY !");
} else {
  console.log(`Nạp Gemini API Key: ${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`);
}

const genAI = new GoogleGenerativeAI(apiKey);

// Hàm kiểm tra các model khả dụng
// export const listAvailableModels = async () => {
//   try {
//     const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
//     const data = await response.json();
//     console.log("--- DANH SÁCH MODELS KHẢ DỤNG ---");
//     if (data.models) {
//       data.models.forEach((m: any) => {
//         console.log(`- Name: ${m.name}`);
//       });
//     } else {
//       console.log("Không lấy được danh sách model:", JSON.stringify(data));
//     }
//     console.log("---------------------------------");
//   } catch (error) {
//     console.error("Lỗi listModels:", error);
//   }
// };

export const aiModel = genAI.getGenerativeModel({
  model: "gemini-flash-latest",
  generationConfig: {
    maxOutputTokens: 1000,
    temperature: 0.7,    
  },
});