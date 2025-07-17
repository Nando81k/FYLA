import { ServiceFactory } from './apiService';
import { API_ENDPOINTS, FEATURE_FLAGS } from '../config/api';
import { ContentPost, ContentFeed, CreateContentPost, CreateContentComment, ContentComment } from '../types/content';

export const contentService = {
  // Content Posts
  async createPost(token: string, postData: CreateContentPost): Promise<ContentPost> {
    const apiService = ServiceFactory.getApiService();
    const response = await apiService.post('/content', postData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  async getPost(postId: number, token?: string): Promise<ContentPost> {
    const apiService = ServiceFactory.getApiService();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await apiService.get(`/content/${postId}`, { headers });
    return response.data;
  },

  async updatePost(token: string, postId: number, postData: CreateContentPost): Promise<ContentPost> {
    const apiService = ServiceFactory.getApiService();
    const response = await apiService.put(`/content/${postId}`, postData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  async deletePost(token: string, postId: number): Promise<void> {
    const apiService = ServiceFactory.getApiService();
    await apiService.delete(`/content/${postId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  // Content Feed
  async getFeed(page: number = 1, pageSize: number = 10, token?: string): Promise<ContentFeed> {
    try {
      const apiService = ServiceFactory.getApiService();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      console.log('Making request to /content/feed with params:', { page, pageSize });
      console.log('Using headers:', headers);
      
      const response = await apiService.get('/content/feed', {
        params: { page, pageSize },
        headers
      }) as { data: ContentFeed };
      
      console.log('Content feed response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error in getFeed:', error);
      throw error;
    }
  },

  async getProviderContent(providerId: number, page: number = 1, pageSize: number = 10, token?: string): Promise<ContentFeed> {
    const apiService = ServiceFactory.getApiService();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await apiService.get(`/content/provider/${providerId}`, {
      params: { page, pageSize },
      headers
    });
    return response.data;
  },

  // Likes
  async toggleLike(token: string, postId: number): Promise<{ isLiked: boolean }> {
    const apiService = ServiceFactory.getApiService();
    const response = await apiService.post(`/content/${postId}/like`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  async getLikesCount(postId: number): Promise<number> {
    const apiService = ServiceFactory.getApiService();
    const response = await apiService.get(`/content/${postId}/likes/count`);
    return response.data;
  },

  // Comments
  async addComment(token: string, postId: number, commentData: CreateContentComment): Promise<ContentComment> {
    const apiService = ServiceFactory.getApiService();
    const response = await apiService.post(`/content/${postId}/comments`, commentData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  async getComments(postId: number, page: number = 1, pageSize: number = 20): Promise<ContentComment[]> {
    const apiService = ServiceFactory.getApiService();
    const response = await apiService.get(`/content/${postId}/comments`, {
      params: { page, pageSize }
    });
    return response.data;
  },

  async updateComment(token: string, commentId: number, commentData: CreateContentComment): Promise<ContentComment> {
    const apiService = ServiceFactory.getApiService();
    const response = await apiService.put(`/content/comments/${commentId}`, commentData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  async deleteComment(token: string, commentId: number): Promise<void> {
    const apiService = ServiceFactory.getApiService();
    await apiService.delete(`/content/comments/${commentId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }
};
