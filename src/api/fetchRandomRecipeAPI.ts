import {Recipe} from '../models/Recipe';
export const fetchRandomRecipeAPI = async (): Promise<Recipe | null> => {
  try {
    const response = await fetch('https://www.themealdb.com/api/json/v1/1/random.php');
    const json = await response.json();
    const meal = json.meals[0];
    return {
      idRecipe: meal.idMeal,
      name: meal.strMeal,
      image: meal.strMealThumb,
      description: `Món ăn từ vùng: ${meal.strArea}`,
      prepTime: 30, 
      difficulty: 'Trung bình',
      category: meal.strCategory,
      ingredients: [meal.strIngredient1, meal.strIngredient2].filter(Boolean),
      instructions: meal.strInstructions.split('\r\n').filter((i: string) => i.trim() !== ""),
      recipeCreator: "Cộng đồng",
      idUser: "api_source",
      rating: 5.0,
      reviews: 0,
      createdAtRecipe: Date.now(),
      isFavorite: false,
    };
  } catch (error) {
    console.error("Lỗi gọi API:", error);
    return null;
    }
};