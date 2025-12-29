const fetchRandomRecipeAPI = async () => {
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
      ingredients: [meal.strIngredient], 
      instructions: [meal.strInstructions],
      recipeCreator: "Cộng đồng",
      idUser: "api_source"
    };
  } catch (error) {
    console.error("Lỗi gọi API:", error);
    return null;
    }
}
export default fetchRandomRecipeAPI;