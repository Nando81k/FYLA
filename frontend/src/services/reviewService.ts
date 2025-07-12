import axios, { AxiosResponse } from 'axios';
import { Review } from '@/types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5002/api';

export interface CreateReviewRequest {
  appointmentId: number;
  providerId: number;
  rating: number;
  comment?: string;
}

export interface UpdateReviewRequest {
  rating?: number;
  comment?: string;
}

class ReviewService {
  private baseURL: string;

  constructor() {
    this.baseURL = `${API_BASE_URL}/reviews`;
  }

  async createReview(
    token: string,
    reviewData: CreateReviewRequest
  ): Promise<Review> {
    try {
      const response: AxiosResponse<Review> = await axios.post(
        this.baseURL,
        reviewData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateReview(
    token: string,
    reviewId: number,
    reviewData: UpdateReviewRequest
  ): Promise<Review> {
    try {
      const response: AxiosResponse<Review> = await axios.patch(
        `${this.baseURL}/${reviewId}`,
        reviewData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteReview(token: string, reviewId: number): Promise<void> {
    try {
      await axios.delete(`${this.baseURL}/${reviewId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getProviderReviews(
    token: string,
    providerId: number,
    page: number = 1,
    limit: number = 20
  ): Promise<{ reviews: Review[]; total: number; hasMore: boolean }> {
    try {
      const response: AxiosResponse<{
        reviews: Review[];
        total: number;
        hasMore: boolean;
      }> = await axios.get(`${this.baseURL}/provider/${providerId}`, {
        params: { page, limit },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getClientReviews(
    token: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ reviews: Review[]; total: number; hasMore: boolean }> {
    try {
      const response: AxiosResponse<{
        reviews: Review[];
        total: number;
        hasMore: boolean;
      }> = await axios.get(`${this.baseURL}/client`, {
        params: { page, limit },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Mock functions for development
  async createMockReview(reviewData: CreateReviewRequest): Promise<Review> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const mockReview: Review = {
      id: Math.floor(Math.random() * 1000),
      appointmentId: reviewData.appointmentId,
      clientId: 1, // Current user
      providerId: reviewData.providerId,
      rating: reviewData.rating,
      comment: reviewData.comment || '',
      createdAt: new Date().toISOString(),
      client: {
        id: 1,
        role: 'client' as any,
        fullName: 'Current User',
        email: 'user@example.com',
        phoneNumber: '+1234567890',
        profilePictureUrl: 'https://via.placeholder.com/150',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      provider: {
        id: reviewData.providerId,
        role: 'provider' as any,
        fullName: 'Provider Name',
        email: 'provider@example.com',
        phoneNumber: '+1234567890',
        profilePictureUrl: 'https://via.placeholder.com/150',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    return mockReview;
  }

  async getMockProviderReviews(
    providerId: number,
    page: number = 1,
    limit: number = 20
  ): Promise<{ reviews: Review[]; total: number; hasMore: boolean }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const mockReviews: Review[] = [
      {
        id: 1,
        appointmentId: 1,
        clientId: 2,
        providerId: providerId,
        rating: 5,
        comment: 'Excellent service! Very professional and skilled. The haircut came out exactly as I wanted.',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        client: {
          id: 2,
          role: 'client' as any,
          fullName: 'Emily Chen',
          email: 'emily@example.com',
          phoneNumber: '+1234567890',
          profilePictureUrl: 'https://images.unsplash.com/photo-1494790108755-2616b812b8c5?w=150',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        provider: {
          id: providerId,
          role: 'provider' as any,
          fullName: 'Provider Name',
          email: 'provider@example.com',
          phoneNumber: '+1234567890',
          profilePictureUrl: 'https://via.placeholder.com/150',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
      {
        id: 2,
        appointmentId: 2,
        clientId: 3,
        providerId: providerId,
        rating: 4,
        comment: 'Great experience overall. Very clean salon and friendly staff.',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        client: {
          id: 3,
          role: 'client' as any,
          fullName: 'Michael Rodriguez',
          email: 'michael@example.com',
          phoneNumber: '+1234567890',
          profilePictureUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        provider: {
          id: providerId,
          role: 'provider' as any,
          fullName: 'Provider Name',
          email: 'provider@example.com',
          phoneNumber: '+1234567890',
          profilePictureUrl: 'https://via.placeholder.com/150',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
    ];

    return {
      reviews: mockReviews.slice((page - 1) * limit, page * limit),
      total: mockReviews.length,
      hasMore: page * limit < mockReviews.length,
    };
  }

  private handleError(error: any): Error {
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.message || 'Review operation failed';
      return new Error(message);
    } else if (error.request) {
      // Request was made but no response received
      return new Error('Network error. Please check your connection.');
    } else {
      // Something else happened
      return new Error('An unexpected error occurred');
    }
  }
}

export const reviewService = new ReviewService();
