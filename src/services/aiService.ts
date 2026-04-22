import { aiModel } from "../config/geminiConfig";

export const aiService = {
  chatHistory: [] as any[],

  resetChat: () => {
    aiService.chatHistory = [];
  },

  getDishSuggestions: async (ingredients: string) => {
    try {
      const prompt = `Người dùng có: ${ingredients}. Gợi ý 3 món ăn. Trả về JSON: [{"name": "Tên món", "brief": "Mô tả ngắn"}]. Không nói gì thêm.`;
      const result = await aiModel.generateContent(prompt);
      const text = result.response.text().trim();
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (error) {
      console.error("Lỗi gợi ý món:", error);
      return null;
    }
  },

  getRecipeDetails: async (dishName: string) => {
    try {
      const prompt = `Cung cấp công thức cho món: ${dishName}.
      YÊU CẦU CỰC KỲ NGẮN GỌN (Tối đa 3 bước).
      JSON thuần túy:
      {
        "name": "${dishName}",
        "englishKeywords": "English dish name",
        "description": "Mô tả ngắn",
        "ingredients": ["Nguyên liệu + định lượng"],
        "instructions": ["Bước 1", "Bước 2", "Bước 3"],
        "cookTime": "20 phút",
        "difficulty": "Dễ",
        "aiChefMessage": "Lời chúc"
      }`;

      const result = await aiModel.generateContent(prompt);
      let text = result.response.text().trim();

      // Loại bỏ Markdown nếu có
      text = text.replace(/```json/g, "").replace(/```/g, "").trim();

      const startIndex = text.indexOf('{');
      if (startIndex === -1) throw new Error("Không tìm thấy JSON");
      let jsonContent = text.substring(startIndex);

      // BỘ VÁ LỖI JSON MẠNH MẼ (Version 4.0 - Chống lỗi Expect ':')
      const fixJson = (str: string) => {
        let fixed = str.trim();

        // Nếu kết thúc bằng dấu hai chấm dở dang: "key":
        if (fixed.endsWith(':')) fixed += ' ""';

        // Đóng dấu ngoặc kép nếu lẻ
        const quoteCount = (fixed.match(/"/g) || []).length;
        if (quoteCount % 2 !== 0) fixed += '"';

        // Xóa dấu phẩy thừa ở cuối trước khi đóng ngoặc
        fixed = fixed.replace(/,\s*$/, "");

        let openBraces = (fixed.match(/\{/g) || []).length;
        let closeBraces = (fixed.match(/\}/g) || []).length;
        let openBrackets = (fixed.match(/\[/g) || []).length;
        let closeBrackets = (fixed.match(/\]/g) || []).length;

        // Đóng mảng
        while (openBrackets > closeBrackets) {
            fixed = fixed.replace(/,\s*$/, "");
            fixed += ']';
            closeBrackets++;
        }
        // Đóng đối tượng
        while (openBraces > closeBraces) {
            fixed = fixed.replace(/,\s*$/, "");
            fixed += '}';
            closeBraces++;
        }
        return fixed;
      };

      const cleanJson = fixJson(jsonContent);
      console.log("--- CLEANED JSON ---");
      console.log(cleanJson);

      const data = JSON.parse(cleanJson);

      const query = encodeURIComponent(`${data.englishKeywords || dishName} food recipe`);
      const imageUrl = `https://tse1.mm.bing.net/th?q=${query}&w=800&h=600&c=7&rs=1&p=0&dpr=2`;

      return {
        ...data,
        image: imageUrl,
        isAI: true
      };
    } catch (error) {
      console.error("Lỗi lấy chi tiết công thức:", error);
      return {
          name: dishName,
          description: "Món ăn ngon gợi ý bởi AI",
          ingredients: ["Vui lòng thử lại"],
          instructions: ["AI đang bận, hãy chọn lại món này"],
          isAI: true,
          image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c"
      };
    }
  }
};