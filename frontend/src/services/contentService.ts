import { ServiceFactory } from './apiService';
import { FEATURE_FLAGS } from '@/config/api';
import {
  Post,
  Story,
  StoryGroup,
  Comment,
  CreatePostRequest,
  CreateStoryRequest,
  FeedResponse,
  MediaUploadResponse,
  Media,
  CreateCommentRequest,
  GetCommentsResponse,
  UserProfile,
  Follow,
  Notification,
  SavedPost,
} from '@/types/content';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5002/api';

class ContentService {
  private baseURL: string;

  constructor() {
    this.baseURL = `${API_BASE_URL}/content`;
  }

  // Get feed with posts and stories
  async getFeed(
    token: string,
    cursor?: string,
    limit: number = 20
  ): Promise<FeedResponse> {
    console.log('📱 contentService.getFeed called with feature flag:', FEATURE_FLAGS.USE_REAL_CONTENT_API);
    return await ServiceFactory.executeWithFallback(
      FEATURE_FLAGS.USE_REAL_CONTENT_API,
      () => this.getFeedReal(token, cursor, limit),
      () => this.getFeedMock(cursor, limit)
    );
  }

  private async getFeedReal(
    token: string,
    cursor?: string,
    limit: number = 20
  ): Promise<FeedResponse> {
    try {
      console.log('🌐 getFeedReal called:', {
        cursor,
        limit,
        endpoint: '/content/feed',
        hasToken: !!token
      });

      const apiService = ServiceFactory.getApiService();
      const params: any = { limit };
      if (cursor) params.cursor = cursor;

      const response = await apiService.get<FeedResponse>(
        '/content/feed',
        {
          params,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('✅ getFeedReal response:', {
        postsCount: response.posts?.length || 0,
        storiesCount: response.stories?.length || 0,
        hasMore: response.hasMore
      });

      return response;
    } catch (error) {
      console.error('❌ getFeedReal error:', error);
      throw this.handleError(error);
    }
  }

  private async getFeedMock(
    cursor?: string,
    limit: number = 20
  ): Promise<FeedResponse> {
    // Simulate API delay
    await ServiceFactory.getApiService().simulateMockDelay();
    
    console.log('📝 Mock feed generated');
    
    // Generate mock posts
    const mockPosts: Post[] = Array.from({ length: Math.min(limit, 10) }, (_, index) => ({
      id: `post_${Date.now()}_${index}`,
      userId: Math.floor(Math.random() * 100) + 1,
      caption: this.generateMockCaption(),
      media: [this.generateMockMedia()],
      likesCount: Math.floor(Math.random() * 200),
      commentsCount: Math.floor(Math.random() * 50),
      isLiked: Math.random() > 0.7,
      isSaved: Math.random() > 0.8,
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
      user: {
        id: Math.floor(Math.random() * 100) + 1,
        fullName: this.generateMockName(),
        profilePictureUrl: `https://picsum.photos/100/100?random=${index}`,
        isServiceProvider: true, // Make most feed posts from service providers
        tags: ['Barber', 'Hair Stylist', 'Beauty Expert'],
      },
      location: Math.random() > 0.5 ? {
        name: 'Downtown Beauty Studio',
        latitude: 37.7749,
        longitude: -122.4194,
      } : undefined,
      tags: Math.random() > 0.5 ? ['haircut', 'style', 'beauty'] : undefined,
    }));

    // Generate mock story groups
    const mockStories: StoryGroup[] = Array.from({ length: 5 }, (_, index) => ({
      userId: index + 1,
      user: {
        id: index + 1,
        fullName: this.generateMockName(),
        profilePictureUrl: `https://picsum.photos/100/100?random=${index + 100}`,
      },
      stories: Array.from({ length: Math.floor(Math.random() * 3) + 1 }, (_, storyIndex) => ({
        id: `story_${index}_${storyIndex}`,
        userId: index + 1,
        media: this.generateMockMedia(),
        caption: Math.random() > 0.5 ? 'Working on a new look! ✨' : undefined,
        createdAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        isViewed: Math.random() > 0.7,
        viewsCount: Math.floor(Math.random() * 100),
        user: {
          id: index + 1,
          fullName: this.generateMockName(),
          profilePictureUrl: `https://picsum.photos/100/100?random=${index + 100}`,
        },
      })),
      hasUnviewedStories: Math.random() > 0.5,
      latestStoryTime: new Date().toISOString(),
    }));

    return {
      posts: mockPosts,
      stories: mockStories,
      hasMore: Math.random() > 0.5,
      nextCursor: cursor ? undefined : 'next_page_cursor',
    };
  }

  // Create a new post
  async createPost(
    token: string,
    request: CreatePostRequest
  ): Promise<Post> {
    console.log('📝 contentService.createPost called with feature flag:', FEATURE_FLAGS.USE_REAL_CONTENT_API);
    return await ServiceFactory.executeWithFallback(
      FEATURE_FLAGS.USE_REAL_CONTENT_API,
      () => this.createPostReal(token, request),
      () => this.createPostMock(request)
    );
  }

  private async createPostReal(
    token: string,
    request: CreatePostRequest
  ): Promise<Post> {
    try {
      console.log('🌐 createPostReal called:', {
        caption: request.caption,
        mediaCount: request.mediaFiles.length,
        endpoint: '/content/posts',
        hasToken: !!token
      });

      // First upload media files
      const uploadedMedia: Media[] = [];
      for (const mediaFile of request.mediaFiles) {
        const uploadedMediaResponse = await this.uploadMedia(token, mediaFile);
        uploadedMedia.push({
          id: uploadedMediaResponse.id,
          url: uploadedMediaResponse.url,
          type: uploadedMediaResponse.type,
          thumbnailUrl: uploadedMediaResponse.thumbnailUrl,
          width: uploadedMediaResponse.width,
          height: uploadedMediaResponse.height,
          duration: uploadedMediaResponse.duration,
        });
      }

      const apiService = ServiceFactory.getApiService();
      const postData = {
        Caption: request.caption,
        MediaIds: uploadedMedia.map(m => m.id),
        LocationName: request.locationName,
        Latitude: request.latitude,
        Longitude: request.longitude,
        Tags: request.tags,
      };

      const response = await apiService.post<Post>(
        '/content/posts',
        postData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('✅ createPostReal success:', {
        postId: response.id,
        mediaCount: response.media.length
      });

      return response;
    } catch (error) {
      console.error('❌ createPostReal error:', error);
      throw this.handleError(error);
    }
  }

  private async createPostMock(request: CreatePostRequest): Promise<Post> {
    // Simulate API delay
    await ServiceFactory.getApiService().simulateMockDelay();
    
    console.log('📝 Mock post created:', request.caption);
    
    return {
      id: `mock_post_${Date.now()}`,
      userId: 563, // Current user ID
      caption: request.caption,
      media: request.mediaFiles.map((file, index) => ({
        id: `mock_media_${Date.now()}_${index}`,
        url: file.uri,
        type: file.type,
        thumbnailUrl: file.type === 'video' ? file.uri : undefined,
      })),
      likesCount: 0,
      commentsCount: 0,
      isLiked: false,
      isSaved: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      user: {
        id: 563,
        fullName: 'Fernando Martinez',
        profilePictureUrl: 'https://picsum.photos/100/100?random=563',
        isServiceProvider: false,
      },
      location: request.locationName ? {
        name: request.locationName,
        latitude: request.latitude,
        longitude: request.longitude,
      } : undefined,
      tags: request.tags,
    };
  }

  // Upload media file
  async uploadMedia(
    token: string,
    mediaFile: { uri: string; type: 'image' | 'video'; name?: string }
  ): Promise<MediaUploadResponse> {
    console.log('📤 contentService.uploadMedia called with feature flag:', FEATURE_FLAGS.USE_REAL_CONTENT_API);
    return await ServiceFactory.executeWithFallback(
      FEATURE_FLAGS.USE_REAL_CONTENT_API,
      () => this.uploadMediaReal(token, mediaFile),
      () => this.uploadMediaMock(mediaFile)
    );
  }

  private async uploadMediaReal(
    token: string,
    mediaFile: { uri: string; type: 'image' | 'video'; name?: string }
  ): Promise<MediaUploadResponse> {
    try {
      console.log('🌐 uploadMediaReal called:', {
        type: mediaFile.type,
        hasName: !!mediaFile.name,
        endpoint: '/content/media/upload',
        hasToken: !!token
      });

      const formData = new FormData();
      formData.append('file', {
        uri: mediaFile.uri,
        type: mediaFile.type === 'image' ? 'image/jpeg' : 'video/mp4',
        name: mediaFile.name || `${mediaFile.type}_${Date.now()}.${mediaFile.type === 'image' ? 'jpg' : 'mp4'}`,
      } as any);
      formData.append('type', mediaFile.type);

      const apiService = ServiceFactory.getApiService();
      const response = await apiService.post<MediaUploadResponse>(
        '/content/media/upload',
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      console.log('✅ uploadMediaReal success:', {
        mediaId: response.id,
        type: response.type
      });

      return response;
    } catch (error) {
      console.error('❌ uploadMediaReal error:', error);
      throw this.handleError(error);
    }
  }

  private async uploadMediaMock(
    mediaFile: { uri: string; type: 'image' | 'video'; name?: string }
  ): Promise<MediaUploadResponse> {
    // Simulate API delay
    await ServiceFactory.getApiService().simulateMockDelay();
    
    console.log('📝 Mock media uploaded:', mediaFile.type);
    
    return {
      id: `mock_media_${Date.now()}`,
      url: mediaFile.uri, // In real app, this would be a server URL
      type: mediaFile.type,
      thumbnailUrl: mediaFile.type === 'video' ? mediaFile.uri : undefined,
      width: 1080,
      height: 1080,
      duration: mediaFile.type === 'video' ? 30 : undefined,
    };
  }

  // Like/Unlike a post
  async toggleLike(token: string, postId: string): Promise<{ isLiked: boolean; likesCount: number }> {
    console.log('❤️ contentService.toggleLike called with feature flag:', FEATURE_FLAGS.USE_REAL_CONTENT_API);
    return await ServiceFactory.executeWithFallback(
      FEATURE_FLAGS.USE_REAL_CONTENT_API,
      () => this.toggleLikeReal(token, postId),
      () => this.toggleLikeMock(postId)
    );
  }

  private async toggleLikeReal(token: string, postId: string): Promise<{ isLiked: boolean; likesCount: number }> {
    try {
      console.log('🌐 toggleLikeReal called:', {
        postId,
        endpoint: `/content/posts/${postId}/like`,
        hasToken: !!token
      });

      const apiService = ServiceFactory.getApiService();
      const response = await apiService.post<{ isLiked: boolean; likesCount: number }>(
        `/content/posts/${postId}/like`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('✅ toggleLikeReal success:', response);
      return response;
    } catch (error) {
      console.error('❌ toggleLikeReal error:', error);
      throw this.handleError(error);
    }
  }

  private async toggleLikeMock(postId: string): Promise<{ isLiked: boolean; likesCount: number }> {
    // Simulate API delay
    await ServiceFactory.getApiService().simulateMockDelay();
    
    const isLiked = Math.random() > 0.5;
    const likesCount = Math.floor(Math.random() * 200) + (isLiked ? 1 : 0);
    
    console.log('📝 Mock like toggled:', { postId, isLiked, likesCount });
    return { isLiked, likesCount };
  }

  // Get comments for a post
  async getComments(
    token: string,
    postId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<GetCommentsResponse> {
    console.log('💬 contentService.getComments called with feature flag:', FEATURE_FLAGS.USE_REAL_CONTENT_API);
    return await ServiceFactory.executeWithFallback(
      FEATURE_FLAGS.USE_REAL_CONTENT_API,
      () => this.getCommentsReal(token, postId, page, limit),
      () => this.getCommentsMock(postId, page, limit)
    );
  }

  private async getCommentsReal(
    token: string,
    postId: string,
    page: number,
    limit: number
  ): Promise<GetCommentsResponse> {
    try {
      console.log('🌐 getCommentsReal called:', {
        postId,
        page,
        limit,
        endpoint: `/content/posts/${postId}/comments`,
        hasToken: !!token
      });

      const apiService = ServiceFactory.getApiService();
      const response = await apiService.get<GetCommentsResponse>(
        `/content/posts/${postId}/comments`,
        {
          params: { page, limit },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('✅ getCommentsReal response:', {
        commentsCount: response.comments?.length || 0,
        total: response.total
      });

      return response;
    } catch (error) {
      console.error('❌ getCommentsReal error:', error);
      throw this.handleError(error);
    }
  }

  private async getCommentsMock(
    postId: string,
    page: number,
    limit: number
  ): Promise<GetCommentsResponse> {
    // Simulate API delay
    await ServiceFactory.getApiService().simulateMockDelay();
    
    console.log('📝 Mock comments generated for post:', postId);
    
    const mockComments: Comment[] = Array.from({ length: Math.min(limit, 8) }, (_, index) => ({
      id: `comment_${postId}_${page}_${index}`,
      postId,
      userId: Math.floor(Math.random() * 100) + 1,
      content: this.generateMockComment(),
      createdAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
      user: {
        id: Math.floor(Math.random() * 100) + 1,
        fullName: this.generateMockName(),
        profilePictureUrl: `https://picsum.photos/40/40?random=${index + page * 10}`,
      },
      likesCount: Math.floor(Math.random() * 20),
      isLiked: Math.random() > 0.7,
    }));

    return {
      comments: mockComments,
      total: Math.floor(Math.random() * 50) + 20,
      hasMore: page < 3,
    };
  }

  // Create a comment
  async createComment(
    token: string,
    request: CreateCommentRequest
  ): Promise<Comment> {
    console.log('💬 contentService.createComment called with feature flag:', FEATURE_FLAGS.USE_REAL_CONTENT_API);
    return await ServiceFactory.executeWithFallback(
      FEATURE_FLAGS.USE_REAL_CONTENT_API,
      () => this.createCommentReal(token, request),
      () => this.createCommentMock(request)
    );
  }

  private async createCommentReal(
    token: string,
    request: CreateCommentRequest
  ): Promise<Comment> {
    try {
      console.log('🌐 createCommentReal called:', {
        postId: request.postId,
        content: request.content,
        endpoint: `/content/posts/${request.postId}/comments`,
        hasToken: !!token
      });

      const apiService = ServiceFactory.getApiService();
      const response = await apiService.post<Comment>(
        `/content/posts/${request.postId}/comments`,
        {
          Content: request.content,
          ParentCommentId: request.parentCommentId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('✅ createCommentReal success:', {
        commentId: response.id,
      });

      return response;
    } catch (error) {
      console.error('❌ createCommentReal error:', error);
      throw this.handleError(error);
    }
  }

  private async createCommentMock(request: CreateCommentRequest): Promise<Comment> {
    // Simulate API delay
    await ServiceFactory.getApiService().simulateMockDelay();
    
    console.log('📝 Mock comment created:', request.content);
    
    return {
      id: `mock_comment_${Date.now()}`,
      postId: request.postId,
      userId: 563, // Current user ID
      content: request.content,
      createdAt: new Date().toISOString(),
      user: {
        id: 563,
        fullName: 'Fernando Martinez',
        profilePictureUrl: 'https://picsum.photos/40/40?random=563',
      },
      likesCount: 0,
      isLiked: false,
    };
  }

  // Follow/Unfollow a user
  async toggleFollow(token: string, userId: number): Promise<{ isFollowing: boolean; followersCount: number }> {
    console.log('👥 contentService.toggleFollow called with feature flag:', FEATURE_FLAGS.USE_REAL_CONTENT_API);
    return await ServiceFactory.executeWithFallback(
      FEATURE_FLAGS.USE_REAL_CONTENT_API,
      () => this.toggleFollowReal(token, userId),
      () => this.toggleFollowMock(userId)
    );
  }

  private async toggleFollowReal(token: string, userId: number): Promise<{ isFollowing: boolean; followersCount: number }> {
    try {
      console.log('🌐 toggleFollowReal called:', {
        userId,
        endpoint: `/users/${userId}/follow`,
        hasToken: !!token
      });

      const apiService = ServiceFactory.getApiService();
      const response = await apiService.post<{ isFollowing: boolean; followersCount: number }>(
        `/users/${userId}/follow`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('✅ toggleFollowReal success:', response);
      return response;
    } catch (error) {
      console.error('❌ toggleFollowReal error:', error);
      throw this.handleError(error);
    }
  }

  private async toggleFollowMock(userId: number): Promise<{ isFollowing: boolean; followersCount: number }> {
    // Simulate API delay
    await ServiceFactory.getApiService().simulateMockDelay();
    
    const isFollowing = Math.random() > 0.5;
    const followersCount = Math.floor(Math.random() * 1000) + (isFollowing ? 1 : 0);
    
    console.log('📝 Mock follow toggled:', { userId, isFollowing, followersCount });
    return { isFollowing, followersCount };
  }

  // Get user profile
  async getUserProfile(token: string, userId: number): Promise<UserProfile> {
    console.log('👤 contentService.getUserProfile called with feature flag:', FEATURE_FLAGS.USE_REAL_CONTENT_API);
    return await ServiceFactory.executeWithFallback(
      FEATURE_FLAGS.USE_REAL_CONTENT_API,
      () => this.getUserProfileReal(token, userId),
      () => this.getUserProfileMock(userId)
    );
  }

  private async getUserProfileReal(token: string, userId: number): Promise<UserProfile> {
    try {
      console.log('🌐 getUserProfileReal called:', {
        userId,
        endpoint: `/users/${userId}/profile`,
        hasToken: !!token
      });

      const apiService = ServiceFactory.getApiService();
      const response = await apiService.get<UserProfile>(
        `/users/${userId}/profile`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('✅ getUserProfileReal success:', {
        userId: response.id,
        fullName: response.fullName
      });

      return response;
    } catch (error) {
      console.error('❌ getUserProfileReal error:', error);
      throw this.handleError(error);
    }
  }

  private async getUserProfileMock(userId: number): Promise<UserProfile> {
    // Simulate API delay
    await ServiceFactory.getApiService().simulateMockDelay();
    
    console.log('📝 Mock user profile generated for:', userId);
    
    // Make certain user IDs always service providers for testing
    const isServiceProvider = userId % 3 === 0 || userId <= 10; // Every 3rd user OR users 1-10 are service providers
    
    return {
      id: userId,
      fullName: this.generateMockName(),
      email: 'user@example.com',
      profilePictureUrl: `https://picsum.photos/200/200?random=${userId}`,
      bio: isServiceProvider 
        ? 'Professional hair stylist with 10+ years experience. Specializing in modern cuts and color treatments. Book your appointment today!' 
        : 'Beauty enthusiast and regular client. Love trying new looks!',
      isServiceProvider,
      tags: isServiceProvider ? ['Hair Stylist', 'Colorist', 'Beauty Expert'] : undefined,
      location: {
        name: 'Downtown Beauty District',
        latitude: 37.7749,
        longitude: -122.4194,
      },
      stats: {
        postsCount: Math.floor(Math.random() * 200) + 10,
        followersCount: Math.floor(Math.random() * 5000) + 100,
        followingCount: Math.floor(Math.random() * 1000) + 50,
      },
      isFollowing: Math.random() > 0.5,
      isPrivate: Math.random() > 0.8,
      createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
    };
  }

  // Save/Unsave a post
  async toggleSave(token: string, postId: string): Promise<{ isSaved: boolean }> {
    console.log('🔖 contentService.toggleSave called with feature flag:', FEATURE_FLAGS.USE_REAL_CONTENT_API);
    return await ServiceFactory.executeWithFallback(
      FEATURE_FLAGS.USE_REAL_CONTENT_API,
      () => this.toggleSaveReal(token, postId),
      () => this.toggleSaveMock(postId)
    );
  }

  private async toggleSaveReal(token: string, postId: string): Promise<{ isSaved: boolean }> {
    try {
      console.log('🌐 toggleSaveReal called:', {
        postId,
        endpoint: `/content/posts/${postId}/save`,
        hasToken: !!token
      });

      const apiService = ServiceFactory.getApiService();
      const response = await apiService.post<{ isSaved: boolean }>(
        `/content/posts/${postId}/save`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('✅ toggleSaveReal success:', response);
      return response;
    } catch (error) {
      console.error('❌ toggleSaveReal error:', error);
      throw this.handleError(error);
    }
  }

  private async toggleSaveMock(postId: string): Promise<{ isSaved: boolean }> {
    // Simulate API delay
    await ServiceFactory.getApiService().simulateMockDelay();
    
    const isSaved = Math.random() > 0.5;
    console.log('📝 Mock save toggled:', { postId, isSaved });
    return { isSaved };
  }

  // Get user's notifications
  async getNotifications(token: string, page: number = 1, limit: number = 20): Promise<{
    notifications: Notification[];
    unreadCount: number;
    hasMore: boolean;
  }> {
    console.log('🔔 contentService.getNotifications called with feature flag:', FEATURE_FLAGS.USE_REAL_CONTENT_API);
    return await ServiceFactory.executeWithFallback(
      FEATURE_FLAGS.USE_REAL_CONTENT_API,
      () => this.getNotificationsReal(token, page, limit),
      () => this.getNotificationsMock(page, limit)
    );
  }

  private async getNotificationsReal(token: string, page: number, limit: number): Promise<{
    notifications: Notification[];
    unreadCount: number;
    hasMore: boolean;
  }> {
    try {
      console.log('🌐 getNotificationsReal called:', {
        page,
        limit,
        endpoint: '/notifications',
        hasToken: !!token
      });

      const apiService = ServiceFactory.getApiService();
      const response = await apiService.get<{
        notifications: Notification[];
        unreadCount: number;
        hasMore: boolean;
      }>(
        '/notifications',
        {
          params: { page, limit },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('✅ getNotificationsReal success:', {
        notificationsCount: response.notifications?.length || 0,
        unreadCount: response.unreadCount
      });

      return response;
    } catch (error) {
      console.error('❌ getNotificationsReal error:', error);
      throw this.handleError(error);
    }
  }

  private async getNotificationsMock(page: number, limit: number): Promise<{
    notifications: Notification[];
    unreadCount: number;
    hasMore: boolean;
  }> {
    // Simulate API delay
    await ServiceFactory.getApiService().simulateMockDelay();
    
    console.log('📝 Mock notifications generated');
    
    const mockNotifications: Notification[] = Array.from({ length: Math.min(limit, 10) }, (_, index) => {
      const types: Notification['type'][] = ['like', 'comment', 'follow', 'mention'];
      const type = types[Math.floor(Math.random() * types.length)];
      
      return {
        id: `notification_${page}_${index}`,
        userId: 563,
        type,
        title: this.generateNotificationTitle(type),
        message: this.generateNotificationMessage(type),
        isRead: Math.random() > 0.3,
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        relatedUser: {
          id: Math.floor(Math.random() * 100) + 1,
          fullName: this.generateMockName(),
          profilePictureUrl: `https://picsum.photos/40/40?random=${index + 200}`,
        },
        relatedPost: type === 'like' || type === 'comment' ? {
          id: `post_${index}`,
          media: this.generateMockMedia(),
        } : undefined,
      };
    });

    return {
      notifications: mockNotifications,
      unreadCount: mockNotifications.filter(n => !n.isRead).length,
      hasMore: page < 3,
    };
  }

  // Get user's saved posts
  async getSavedPosts(token: string, cursor?: string): Promise<FeedResponse> {
    console.log('🔖 contentService.getSavedPosts called with feature flag:', FEATURE_FLAGS.USE_REAL_CONTENT_API);
    return await ServiceFactory.executeWithFallback(
      FEATURE_FLAGS.USE_REAL_CONTENT_API,
      () => this.getSavedPostsReal(token, cursor),
      () => this.getSavedPostsMock(cursor)
    );
  }

  private async getSavedPostsReal(token: string, cursor?: string): Promise<FeedResponse> {
    try {
      console.log('🌐 getSavedPostsReal called:', {
        cursor,
        endpoint: '/posts/saved',
        hasToken: !!token
      });

      const apiService = ServiceFactory.getApiService();
      const response = await apiService.get<FeedResponse>(
        '/posts/saved',
        {
          params: cursor ? { cursor } : {},
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('✅ getSavedPostsReal success:', {
        postsCount: response.posts?.length || 0,
        hasMore: response.hasMore
      });

      return response;
    } catch (error) {
      console.error('❌ getSavedPostsReal error:', error);
      throw this.handleError(error);
    }
  }

  private async getSavedPostsMock(cursor?: string): Promise<FeedResponse> {
    // Simulate API delay
    await ServiceFactory.getApiService().simulateMockDelay();
    
    console.log('📝 Mock saved posts generated');
    
    const mockPosts: Post[] = Array.from({ length: 10 }, (_, index) => ({
      id: `saved_post_${index}`,
      userId: Math.floor(Math.random() * 100) + 1,
      caption: `This is a saved post caption ${index + 1}. Lorem ipsum dolor sit amet, consectetur adipiscing elit.`,
      media: [this.generateMockMedia()],
      likesCount: Math.floor(Math.random() * 1000),
      commentsCount: Math.floor(Math.random() * 100),
      isLiked: Math.random() > 0.5,
      isSaved: true, // All saved posts are saved by definition
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
      user: {
        id: Math.floor(Math.random() * 100) + 1,
        fullName: this.generateMockName(),
        profilePictureUrl: `https://picsum.photos/40/40?random=${index + 300}`,
        isServiceProvider: Math.random() > 0.5,
        tags: Math.random() > 0.5 ? ['Beauty', 'Wellness'] : undefined,
      },
      location: Math.random() > 0.5 ? {
        name: `Location ${index + 1}`,
        latitude: 40.7128 + (Math.random() - 0.5) * 0.1,
        longitude: -74.0060 + (Math.random() - 0.5) * 0.1,
      } : undefined,
      tags: Math.random() > 0.5 ? ['beauty', 'wellness', 'selfcare'] : undefined,
    }));

    return {
      posts: mockPosts,
      stories: [], // No stories in saved posts
      hasMore: !cursor, // Only first page has more
      nextCursor: cursor ? undefined : 'next_saved_cursor'
    };
  }

  // Get posts by specific user
  async getUserPosts(token: string, userId: number, cursor?: string): Promise<FeedResponse> {
    console.log('👤 contentService.getUserPosts called with feature flag:', FEATURE_FLAGS.USE_REAL_CONTENT_API);
    return await ServiceFactory.executeWithFallback(
      FEATURE_FLAGS.USE_REAL_CONTENT_API,
      () => this.getUserPostsReal(token, userId, cursor),
      () => this.getUserPostsMock(userId, cursor)
    );
  }

  private async getUserPostsReal(token: string, userId: number, cursor?: string): Promise<FeedResponse> {
    try {
      console.log('🌐 getUserPostsReal called:', {
        userId,
        cursor,
        endpoint: `/users/${userId}/posts`,
        hasToken: !!token
      });

      const apiService = ServiceFactory.getApiService();
      const response = await apiService.get<FeedResponse>(
        `/users/${userId}/posts`,
        {
          params: cursor ? { cursor } : {},
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('✅ getUserPostsReal success:', {
        postsCount: response.posts?.length || 0,
        hasMore: response.hasMore
      });

      return response;
    } catch (error) {
      console.error('❌ getUserPostsReal error:', error);
      throw this.handleError(error);
    }
  }

  private async getUserPostsMock(userId: number, cursor?: string): Promise<FeedResponse> {
    // Simulate API delay
    await ServiceFactory.getApiService().simulateMockDelay();
    
    console.log('📝 Mock user posts generated for user:', userId);
    
    // Only service providers have posts
    const isServiceProvider = userId % 3 === 0 || userId <= 10; // Same logic as getUserProfileMock
    
    if (!isServiceProvider) {
      return {
        posts: [],
        stories: [],
        hasMore: false,
        nextCursor: undefined
      };
    }
    
    const mockPosts: Post[] = Array.from({ length: 12 }, (_, index) => ({
      id: `user_${userId}_post_${index}`,
      userId: userId,
      caption: `Professional post ${index + 1} by service provider ${userId}. ${this.generateMockCaption()}`,
      media: [this.generateMockMedia()],
      likesCount: Math.floor(Math.random() * 1000),
      commentsCount: Math.floor(Math.random() * 100),
      isLiked: Math.random() > 0.5,
      isSaved: Math.random() > 0.7,
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
      user: {
        id: userId,
        fullName: this.generateMockName(),
        profilePictureUrl: `https://picsum.photos/40/40?random=${userId}`,
        isServiceProvider: true,
        tags: ['Beauty', 'Wellness', 'Professional'],
      },
      location: Math.random() > 0.5 ? {
        name: `Studio Location ${index + 1}`,
        latitude: 40.7128 + (Math.random() - 0.5) * 0.1,
        longitude: -74.0060 + (Math.random() - 0.5) * 0.1,
      } : undefined,
      tags: ['beauty', 'wellness', 'professional', 'beforeafter'],
    }));

    return {
      posts: mockPosts,
      stories: [], // No stories in user posts
      hasMore: !cursor, // Only first page has more
      nextCursor: cursor ? undefined : `user_${userId}_next_cursor`
    };
  }

  // Helper methods for mock data
  private generateMockCaption(): string {
    const captions = [
      'Fresh cut for the weekend! ✂️ #haircut #fresh #style',
      'New nail art design 💅 What do you think?',
      'Before and after transformation! Amazing work 🔥',
      'Loving this new color! Thank you to my amazing stylist 💜',
      'Ready for the day! Feeling confident ✨',
      'Behind the scenes at the studio 🎬',
      'Another satisfied client! Book your appointment today 📅',
    ];
    return captions[Math.floor(Math.random() * captions.length)];
  }

  private generateMockName(): string {
    const firstNames = ['Alex', 'Jordan', 'Taylor', 'Casey', 'Morgan', 'Riley', 'Avery', 'Quinn'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];
    return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
  }

  private generateMockMedia(): Media {
    const isVideo = Math.random() > 0.8;
    const imageId = Math.floor(Math.random() * 1000);
    
    return {
      id: `mock_media_${Date.now()}_${Math.random()}`,
      url: `https://picsum.photos/400/400?random=${imageId}`,
      type: isVideo ? 'video' : 'image',
      thumbnailUrl: isVideo ? `https://picsum.photos/400/400?random=${imageId}` : undefined,
      width: 400,
      height: 400,
      duration: isVideo ? Math.floor(Math.random() * 60) + 15 : undefined,
    };
  }

  private generateMockComment(): string {
    const comments = [
      'This looks amazing! 😍',
      'Love this style! Where did you get it done?',
      'Gorgeous work! 💯',
      'Can I book an appointment? This is exactly what I want!',
      'Stunning! You always do such beautiful work ✨',
      'Goals! 🔥',
      'Wow, the transformation is incredible!',
      'This color is perfect for you! 💜',
      'Amazing skills! Following for more inspo',
      'Beautiful! How long did this take?',
    ];
    return comments[Math.floor(Math.random() * comments.length)];
  }

  private generateNotificationTitle(type: Notification['type']): string {
    switch (type) {
      case 'like':
        return 'New Like';
      case 'comment':
        return 'New Comment';
      case 'follow':
        return 'New Follower';
      case 'mention':
        return 'You were mentioned';
      case 'story_view':
        return 'Story View';
      default:
        return 'New Activity';
    }
  }

  private generateNotificationMessage(type: Notification['type']): string {
    const name = this.generateMockName();
    switch (type) {
      case 'like':
        return `${name} liked your post`;
      case 'comment':
        return `${name} commented on your post`;
      case 'follow':
        return `${name} started following you`;
      case 'mention':
        return `${name} mentioned you in a comment`;
      case 'story_view':
        return `${name} viewed your story`;
      default:
        return `${name} interacted with your content`;
    }
  }

  private handleError(error: any): Error {
    if (error.response) {
      const message = error.response.data?.message || 'Content operation failed';
      return new Error(message);
    } else if (error.request) {
      return new Error('Network error. Please check your connection.');
    } else {
      return new Error('An unexpected error occurred');
    }
  }
}

export const contentService = new ContentService();
