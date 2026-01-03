import {Recipe} from './Recipe';
export interface CommunityPost extends Recipe {
  postId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  likesCount: number;
  commentsCount: number;
  likedBy: string[];
  sharedAt: any;
}
