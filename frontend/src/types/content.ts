export interface Media {
  id: string;
  url: string;
  type: 'image' | 'video';
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  duration?: number; // for videos, in seconds
}

export interface Post {
  id: string;
  userId: number;
  caption: string;
  media: Media[];
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  isSaved: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    fullName: string;
    profilePictureUrl?: string;
    isServiceProvider: boolean;
    tags?: string[]; // For service providers
  };
  location?: {
    name: string;
    latitude?: number;
    longitude?: number;
  };
  tags?: string[]; // Hashtags
}

export interface Story {
  id: string;
  userId: number;
  media: Media;
  caption?: string;
  createdAt: string;
  expiresAt: string;
  isViewed: boolean;
  viewsCount: number;
  user: {
    id: number;
    fullName: string;
    profilePictureUrl?: string;
  };
}

export interface StoryGroup {
  userId: number;
  user: {
    id: number;
    fullName: string;
    profilePictureUrl?: string;
  };
  stories: Story[];
  hasUnviewedStories: boolean;
  latestStoryTime: string;
}

export interface Comment {
  id: string;
  postId: string;
  userId: number;
  content: string;
  createdAt: string;
  user: {
    id: number;
    fullName: string;
    profilePictureUrl?: string;
  };
  likesCount: number;
  isLiked: boolean;
}

export interface Like {
  id: string;
  userId: number;
  postId?: string;
  commentId?: string;
  createdAt: string;
  user: {
    id: number;
    fullName: string;
    profilePictureUrl?: string;
  };
}

export interface CreatePostRequest {
  caption: string;
  mediaFiles: {
    uri: string;
    type: 'image' | 'video';
    name?: string;
  }[];
  locationName?: string;
  latitude?: number;
  longitude?: number;
  tags?: string[];
}

export interface CreateStoryRequest {
  mediaFile: {
    uri: string;
    type: 'image' | 'video';
    name?: string;
  };
  caption?: string;
}

export interface FeedResponse {
  posts: Post[];
  stories: StoryGroup[];
  hasMore: boolean;
  nextCursor?: string;
}

export interface MediaUploadResponse {
  id: string;
  url: string;
  thumbnailUrl?: string;
  type: 'image' | 'video';
  width?: number;
  height?: number;
  duration?: number;
}

export interface Follow {
  id: string;
  followerId: number;
  followingId: number;
  createdAt: string;
  follower?: {
    id: number;
    fullName: string;
    profilePictureUrl?: string;
  };
  following?: {
    id: number;
    fullName: string;
    profilePictureUrl?: string;
    isServiceProvider: boolean;
  };
}

export interface UserProfile {
  id: number;
  fullName: string;
  email: string;
  profilePictureUrl?: string;
  bio?: string;
  isServiceProvider: boolean;
  tags?: string[];
  location?: {
    name: string;
    latitude?: number;
    longitude?: number;
  };
  stats: {
    postsCount: number;
    followersCount: number;
    followingCount: number;
  };
  isFollowing: boolean;
  isPrivate: boolean;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: number;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'story_view';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  relatedUser?: {
    id: number;
    fullName: string;
    profilePictureUrl?: string;
  };
  relatedPost?: {
    id: string;
    media: Media;
  };
}

export interface SavedPost {
  id: string;
  userId: number;
  postId: string;
  createdAt: string;
  post: Post;
}

export interface CreateCommentRequest {
  postId: string;
  content: string;
  parentCommentId?: string; // For replies
}

export interface GetCommentsResponse {
  comments: Comment[];
  total: number;
  hasMore: boolean;
}
