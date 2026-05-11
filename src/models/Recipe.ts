export interface Recipe {
  idRecipe: string; 
  recipeCreator: string ;
  idUser: string;
  name: string;
  image: string;
  rating: number; 
  reviews: number;
  prepTime: number;
  cookTime?: string; // Thời gian nấu (từ AI)
  difficulty: 'Dễ' | 'Trung bình' | 'Khó';
  category: string[];
  ingredients: string[]; // Danh sách nguyên liệu
  instructions: string[]; // Các bước thực hiện
  description: string; 
  proTips?: string; // Mẹo nhỏ
  createdAtRecipe?: number;
  isFavorite?: boolean;
}
