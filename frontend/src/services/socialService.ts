import { ServiceFactory } from './apiService';
import { API_ENDPOINTS, FEATURE_FLAGS } from '../config/api';

// Types for social features
export interface FollowToggleResponse {
  isFollowing: boolean;
  followersCount: number;
  message: string;
}

export interface UserSocialStats {
  userId: number;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isPrivate: boolean;
}

export interface UserFollow {
  id: number;
  fullName: string;
  email: string;
  profilePictureUrl?: string;
  bio?: string;
  isServiceProvider: boolean;
  isFollowing: boolean;
  followersCount: number;
  followingCount: number;
  tags?: string[];
}

class SocialService {
  // Toggle follow/unfollow a user
  async toggleFollow(token: string, userId: number): Promise<FollowToggleResponse> {
    return await ServiceFactory.executeWithFallback(
      FEATURE_FLAGS.USE_REAL_SOCIAL_API,
      () => this.toggleFollowReal(token, userId),
      () => this.toggleFollowMock(userId)
    );
  }

  // Get user followers
  async getUserFollowers(token: string, userId: number, page: number = 1, pageSize: number = 20): Promise<UserFollow[]> {
    return await ServiceFactory.executeWithFallback(
      FEATURE_FLAGS.USE_REAL_SOCIAL_API,
      () => this.getUserFollowersReal(token, userId, page, pageSize),
      () => this.getUserFollowersMock(userId, page, pageSize)
    );
  }

  // Get users that a user is following
  async getUserFollowing(token: string, userId: number, page: number = 1, pageSize: number = 20): Promise<UserFollow[]> {
    return await ServiceFactory.executeWithFallback(
      FEATURE_FLAGS.USE_REAL_SOCIAL_API,
      () => this.getUserFollowingReal(token, userId, page, pageSize),
      () => this.getUserFollowingMock(userId, page, pageSize)
    );
  }

  // Get user social statistics
  async getUserSocialStats(token: string, userId: number): Promise<UserSocialStats> {
    return await ServiceFactory.executeWithFallback(
      FEATURE_FLAGS.USE_REAL_SOCIAL_API,
      () => this.getUserSocialStatsReal(token, userId),
      () => this.getUserSocialStatsMock(userId)
    );
  }

  // Check if current user is following another user
  async isFollowing(token: string, userId: number): Promise<boolean> {
    return await ServiceFactory.executeWithFallback(
      FEATURE_FLAGS.USE_REAL_SOCIAL_API,
      () => this.isFollowingReal(token, userId),
      () => this.isFollowingMock(userId)
    );
  }

  // Get suggested users to follow
  async getSuggestedUsers(token: string, limit: number = 10): Promise<UserFollow[]> {
    return await ServiceFactory.executeWithFallback(
      FEATURE_FLAGS.USE_REAL_SOCIAL_API,
      () => this.getSuggestedUsersReal(token, limit),
      () => this.getSuggestedUsersMock(limit)
    );
  }

  // Get mutual follows between current user and another user
  async getMutualFollows(token: string, userId: number): Promise<UserFollow[]> {
    return await ServiceFactory.executeWithFallback(
      FEATURE_FLAGS.USE_REAL_SOCIAL_API,
      () => this.getMutualFollowsReal(token, userId),
      () => this.getMutualFollowsMock(userId)
    );
  }

  // Real API implementations
  private async toggleFollowReal(token: string, userId: number): Promise<FollowToggleResponse> {
    try {
      const apiService = ServiceFactory.getApiService();
      const response = await apiService.post<FollowToggleResponse>(
        API_ENDPOINTS.SOCIAL.FOLLOW,
        { userId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private async getUserFollowersReal(token: string, userId: number, page: number, pageSize: number): Promise<UserFollow[]> {
    try {
      const apiService = ServiceFactory.getApiService();
      const response = await apiService.get<UserFollow[]>(
        `${API_ENDPOINTS.SOCIAL.FOLLOWERS(userId)}?page=${page}&pageSize=${pageSize}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private async getUserFollowingReal(token: string, userId: number, page: number, pageSize: number): Promise<UserFollow[]> {
    try {
      const apiService = ServiceFactory.getApiService();
      const response = await apiService.get<UserFollow[]>(
        `${API_ENDPOINTS.SOCIAL.FOLLOWING(userId)}?page=${page}&pageSize=${pageSize}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private async getUserSocialStatsReal(token: string, userId: number): Promise<UserSocialStats> {
    try {
      const apiService = ServiceFactory.getApiService();
      const response = await apiService.get<UserSocialStats>(
        API_ENDPOINTS.SOCIAL.STATS(userId),
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private async isFollowingReal(token: string, userId: number): Promise<boolean> {
    try {
      const apiService = ServiceFactory.getApiService();
      const response = await apiService.get<{ isFollowing: boolean }>(
        API_ENDPOINTS.SOCIAL.IS_FOLLOWING(userId),
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.isFollowing;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private async getSuggestedUsersReal(token: string, limit: number): Promise<UserFollow[]> {
    try {
      const apiService = ServiceFactory.getApiService();
      const response = await apiService.get<UserFollow[]>(
        `${API_ENDPOINTS.SOCIAL.SUGGESTED_USERS}?limit=${limit}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private async getMutualFollowsReal(token: string, userId: number): Promise<UserFollow[]> {
    try {
      const apiService = ServiceFactory.getApiService();
      const response = await apiService.get<UserFollow[]>(
        API_ENDPOINTS.SOCIAL.MUTUAL_FOLLOWS(userId),
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Mock implementations for development
  private async toggleFollowMock(userId: number): Promise<FollowToggleResponse> {
    await ServiceFactory.getApiService().simulateMockDelay();
    
    // Simulate toggle behavior
    const wasFollowing = Math.random() > 0.5;
    const isNowFollowing = !wasFollowing;
    
    return {
      isFollowing: isNowFollowing,
      followersCount: Math.floor(Math.random() * 1000) + 50,
      message: isNowFollowing ? 'Following user' : 'Unfollowed user'
    };
  }

  private async getUserFollowersMock(userId: number, page: number, pageSize: number): Promise<UserFollow[]> {
    await ServiceFactory.getApiService().simulateMockDelay();
    
    const mockFollowers: UserFollow[] = Array.from({ length: Math.min(pageSize, 10) }, (_, index) => ({
      id: (page - 1) * pageSize + index + 1,
      fullName: `Follower ${(page - 1) * pageSize + index + 1}`,
      email: `follower${(page - 1) * pageSize + index + 1}@example.com`,
      profilePictureUrl: `https://images.unsplash.com/photo-${1500000000000 + index}?w=150`,
      bio: `This is a sample bio for follower ${(page - 1) * pageSize + index + 1}`,
      isServiceProvider: Math.random() > 0.5,
      isFollowing: Math.random() > 0.5,
      followersCount: Math.floor(Math.random() * 500) + 10,
      followingCount: Math.floor(Math.random() * 300) + 5,
      tags: Math.random() > 0.5 ? ['Hair Stylist', 'Colorist'] : undefined
    }));
    
    return mockFollowers;
  }

  private async getUserFollowingMock(userId: number, page: number, pageSize: number): Promise<UserFollow[]> {
    await ServiceFactory.getApiService().simulateMockDelay();
    
    const mockFollowing: UserFollow[] = Array.from({ length: Math.min(pageSize, 8) }, (_, index) => ({
      id: (page - 1) * pageSize + index + 100,
      fullName: `Following ${(page - 1) * pageSize + index + 1}`,
      email: `following${(page - 1) * pageSize + index + 1}@example.com`,
      profilePictureUrl: `https://images.unsplash.com/photo-${1600000000000 + index}?w=150`,
      bio: `Professional service provider ${(page - 1) * pageSize + index + 1}`,
      isServiceProvider: true,
      isFollowing: true,
      followersCount: Math.floor(Math.random() * 2000) + 100,
      followingCount: Math.floor(Math.random() * 500) + 20,
      tags: ['Beauty Expert', 'Wellness Coach']
    }));
    
    return mockFollowing;
  }

  private async getUserSocialStatsMock(userId: number): Promise<UserSocialStats> {
    await ServiceFactory.getApiService().simulateMockDelay();
    
    return {
      userId,
      followersCount: Math.floor(Math.random() * 5000) + 100,
      followingCount: Math.floor(Math.random() * 1000) + 50,
      postsCount: Math.floor(Math.random() * 200) + 10,
      isPrivate: Math.random() > 0.8
    };
  }

  private async isFollowingMock(userId: number): Promise<boolean> {
    await ServiceFactory.getApiService().simulateMockDelay();
    return Math.random() > 0.5;
  }

  private async getSuggestedUsersMock(limit: number): Promise<UserFollow[]> {
    await ServiceFactory.getApiService().simulateMockDelay();
    
    const mockSuggested: UserFollow[] = Array.from({ length: Math.min(limit, 8) }, (_, index) => ({
      id: 1000 + index,
      fullName: `Suggested User ${index + 1}`,
      email: `suggested${index + 1}@fylapro.com`,
      profilePictureUrl: `https://images.unsplash.com/photo-${1700000000000 + index}?w=150`,
      bio: `Talented service provider specializing in beauty and wellness`,
      isServiceProvider: true,
      isFollowing: false,
      followersCount: Math.floor(Math.random() * 1500) + 50,
      followingCount: Math.floor(Math.random() * 400) + 10,
      tags: ['Nail Tech', 'Skincare', 'Massage']
    }));
    
    return mockSuggested;
  }

  private async getMutualFollowsMock(userId: number): Promise<UserFollow[]> {
    await ServiceFactory.getApiService().simulateMockDelay();
    
    const mockMutual: UserFollow[] = Array.from({ length: 3 }, (_, index) => ({
      id: 2000 + index,
      fullName: `Mutual Friend ${index + 1}`,
      email: `mutual${index + 1}@example.com`,
      profilePictureUrl: `https://images.unsplash.com/photo-${1800000000000 + index}?w=150`,
      bio: `Common connection with great taste in service providers`,
      isServiceProvider: Math.random() > 0.5,
      isFollowing: true,
      followersCount: Math.floor(Math.random() * 800) + 30,
      followingCount: Math.floor(Math.random() * 300) + 15,
      tags: Math.random() > 0.5 ? ['Barber', 'Grooming'] : undefined
    }));
    
    return mockMutual;
  }

  private handleError(error: any): Error {
    if (error.response?.data?.message) {
      return new Error(error.response.data.message);
    }
    if (error.message) {
      return new Error(error.message);
    }
    return new Error('An unexpected error occurred while processing social request');
  }
}

export const socialService = new SocialService();
