// import { useState } from 'react';
// import { ArrowLeft, Clock, ChefHat, Star } from 'lucide-react-native';
// import { motion } from 'motion/react';
// import { ImageWithFallback } from './figma/ImageWithFallback';
// import type { Recipe } from './RecipeScreen';

// interface RecipeDetailProps {
//   recipe: Recipe;
//   onBack: () => void;
// }

// interface Review {
//   id: string;
//   userName: string;
//   rating: number;
//   comment: string;
//   date: string;
// }

// const mockReviews: Review[] = [
//   {
//     id: '1',
//     userName: 'Nguyễn Anh',
//     rating: 5,
//     comment: 'Rất ngon! Công thức dễ làm và rõ ràng. Cả nhà đều thích.',
//     date: '2 ngày trước'
//   },
//   {
//     id: '2',
//     userName: 'Trần Minh',
//     rating: 4,
//     comment: 'Món ăn ngon, nhưng mình cần thêm một chút thời gian để chuẩn bị.',
//     date: '5 ngày trước'
//   },
//   {
//     id: '3',
//     userName: 'Lê Thu',
//     rating: 5,
//     comment: 'Tuyệt vời! Đây là công thức tốt nhất mình từng thử.',
//     date: '1 tuần trước'
//   }
// ];

// export function RecipeDetail({ recipe, onBack }: RecipeDetailProps) {
//   const [userRating, setUserRating] = useState(0);
//   const [hoverRating, setHoverRating] = useState(0);

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-amber-50">
//       <div className="max-w-md mx-auto pb-24">
//         {/* Header Image */}
//         <div className="relative h-72 overflow-hidden">
//           <ImageWithFallback
//             src={recipe.image}
//             alt={recipe.name}
//             className="w-full h-full object-cover"
//           />
//           <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
//           {/* Back Button */}
//           <button
//             onClick={onBack}
//             className="absolute top-4 left-4 w-10 h-10 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
//           >
//             <ArrowLeft size={20} className="text-gray-800" />
//           </button>

//           {/* Recipe Title */}
//           <div className="absolute bottom-4 left-4 right-4">
//             <h1 className="text-white mb-2">{recipe.name}</h1>
//             <div className="flex items-center gap-4">
//               <div className="flex items-center gap-1.5">
//                 <Clock size={16} className="text-white/90" />
//                 <span className="text-sm text-white/90">{recipe.prepTime} phút</span>
//               </div>
//               <div className="flex items-center gap-1.5">
//                 <ChefHat size={16} className="text-white/90" />
//                 <span className="text-sm text-white/90">{recipe.difficulty}</span>
//               </div>
//               <div className="flex items-center gap-1.5">
//                 <Star size={16} className="text-yellow-400 fill-yellow-400" />
//                 <span className="text-sm text-white/90">{recipe.rating}</span>
//               </div>
//             </div>
//           </div>
//         </div>

//         <div className="px-4 py-6 space-y-6">
//           {/* Description */}
//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             className="bg-white rounded-2xl p-5 shadow-md"
//           >
//             <h2 className="text-gray-900 mb-3">Mô tả</h2>
//             <p className="text-gray-600">{recipe.description}</p>
//           </motion.div>

//           {/* Ingredients */}
//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: 0.1 }}
//             className="bg-white rounded-2xl p-5 shadow-md"
//           >
//             <h2 className="text-gray-900 mb-4">Nguyên liệu</h2>
//             <ul className="space-y-2.5">
//               {recipe.ingredients.map((ingredient, index) => (
//                 <li key={index} className="flex items-start gap-3">
//                   <div className="w-2 h-2 rounded-full bg-gradient-to-br from-orange-500 to-red-500 mt-2 flex-shrink-0" />
//                   <span className="text-gray-700">{ingredient}</span>
//                 </li>
//               ))}
//             </ul>
//           </motion.div>

//           {/* Instructions */}
//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: 0.2 }}
//             className="bg-white rounded-2xl p-5 shadow-md"
//           >
//             <h2 className="text-gray-900 mb-4">Cách làm</h2>
//             <ol className="space-y-4">
//               {recipe.instructions.map((instruction, index) => (
//                 <li key={index} className="flex gap-4">
//                   <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0 shadow-md">
//                     <span className="text-white text-sm">{index + 1}</span>
//                   </div>
//                   <p className="text-gray-700 pt-1">{instruction}</p>
//                 </li>
//               ))}
//             </ol>
//           </motion.div>

//           {/* User Rating Section */}
//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: 0.3 }}
//             className="bg-white rounded-2xl p-5 shadow-md"
//           >
//             <h2 className="text-gray-900 mb-4">Đánh giá của bạn</h2>
//             <div className="flex gap-2 mb-4">
//               {[1, 2, 3, 4, 5].map((star) => (
//                 <button
//                   key={star}
//                   onClick={() => setUserRating(star)}
//                   onMouseEnter={() => setHoverRating(star)}
//                   onMouseLeave={() => setHoverRating(0)}
//                   className="transition-transform hover:scale-110"
//                 >
//                   <Star
//                     size={32}
//                     className={
//                       star <= (hoverRating || userRating)
//                         ? 'text-yellow-500 fill-yellow-500'
//                         : 'text-gray-300'
//                     }
//                   />
//                 </button>
//               ))}
//             </div>
//             {userRating > 0 && (
//               <motion.div
//                 initial={{ opacity: 0, height: 0 }}
//                 animate={{ opacity: 1, height: 'auto' }}
//                 className="space-y-3"
//               >
//                 <textarea
//                   placeholder="Chia sẻ đánh giá của bạn..."
//                   className="w-full p-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-orange-500"
//                   rows={3}
//                 />
//                 <button className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:shadow-lg transition-shadow">
//                   Gửi đánh giá
//                 </button>
//               </motion.div>
//             )}
//           </motion.div>

//           {/* Reviews */}
//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: 0.4 }}
//             className="bg-white rounded-2xl p-5 shadow-md"
//           >
//             <h2 className="text-gray-900 mb-4">Đánh giá ({mockReviews.length})</h2>
//             <div className="space-y-4">
//               {mockReviews.map((review) => (
//                 <div key={review.id} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
//                   <div className="flex items-center justify-between mb-2">
//                     <span className="text-gray-900">{review.userName}</span>
//                     <span className="text-sm text-gray-500">{review.date}</span>
//                   </div>
//                   <div className="flex items-center gap-1 mb-2">
//                     {[1, 2, 3, 4, 5].map((star) => (
//                       <Star
//                         key={star}
//                         size={14}
//                         className={
//                           star <= review.rating
//                             ? 'text-yellow-500 fill-yellow-500'
//                             : 'text-gray-300'
//                         }
//                       />
//                     ))}
//                   </div>
//                   <p className="text-gray-600 text-sm">{review.comment}</p>
//                 </div>
//               ))}
//             </div>
//           </motion.div>
//         </div>
//       </div>
//     </div>
//   );
// }
