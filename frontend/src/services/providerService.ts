import axios, { AxiosResponse } from 'axios';
import { ServiceFactory } from './apiService';
import { FEATURE_FLAGS, API_ENDPOINTS } from '@/config/api';
import { ProviderProfile, ProviderSearchRequest, ProviderSearchResponse, ServiceProviderTag } from '@/types';
import { Post } from '@/types/content';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5002/api';

class ProviderService {
  private baseURL: string;

  constructor() {
    this.baseURL = `${API_BASE_URL}/providers`;
  }

  // Search providers with backend integration
  async searchProviders(request: ProviderSearchRequest): Promise<ProviderSearchResponse> {
    console.log('🔍 searchProviders called with flag:', FEATURE_FLAGS.USE_REAL_PROVIDER_API);
    return await ServiceFactory.executeWithFallback(
      FEATURE_FLAGS.USE_REAL_PROVIDER_API,
      () => this.searchProvidersReal(request),
      () => this.searchProvidersMock(request)
    );
  }

  private async searchProvidersReal(request: ProviderSearchRequest): Promise<ProviderSearchResponse> {
    console.log('🌐 Using REAL provider API');
    console.log('🔍 Search request params:', {
      query: request.query,
      tags: request.tags,
      location: request.latitude && request.longitude ? `${request.latitude},${request.longitude}` : 'none',
      radius: request.radius,
      minRating: request.minRating,
      sortBy: request.sortBy,
      page: request.page,
      limit: request.limit
    });
    
    try {
      const apiService = ServiceFactory.getApiService();
      const params = new URLSearchParams();
      
      if (request.query) params.append('query', request.query);
      if (request.tags && request.tags.length > 0) {
        request.tags.forEach(tag => params.append('tags', tag.toString()));
      }
      if (request.latitude) params.append('latitude', request.latitude.toString());
      if (request.longitude) params.append('longitude', request.longitude.toString());
      if (request.radius) params.append('radius', request.radius.toString());
      if (request.minRating) params.append('minRating', request.minRating.toString());
      if (request.sortBy) params.append('sortBy', request.sortBy);
      if (request.page) params.append('page', request.page.toString());
      if (request.limit) params.append('limit', request.limit.toString());

      const response = await apiService.get<ProviderSearchResponse>(
        `${API_ENDPOINTS.PROVIDERS.SEARCH}?${params.toString()}`
      );
      
      console.log('✅ REAL provider API response:', {
        totalProviders: response.providers?.length || 0,
        total: response.total,
        page: response.page,
        firstProvider: response.providers?.[0]?.fullName || 'none',
        providerNames: response.providers?.map(p => p.fullName).slice(0, 3) || []
      });
      
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get provider by ID with backend integration
  async getProviderById(providerId: number): Promise<ProviderProfile> {
    return await ServiceFactory.executeWithFallback(
      FEATURE_FLAGS.USE_REAL_PROVIDER_API,
      () => this.getProviderByIdReal(providerId),
      () => this.getProviderByIdMock(providerId)
    );
  }

  private async getProviderByIdReal(providerId: number): Promise<ProviderProfile> {
    try {
      const apiService = ServiceFactory.getApiService();
      const response = await apiService.get<ProviderProfile>(
        API_ENDPOINTS.PROVIDERS.PROFILE(providerId)
      );
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get nearby providers with backend integration
  async getNearbyProviders(
    latitude: number,
    longitude: number,
    radius: number = 10
  ): Promise<ProviderProfile[]> {
    return await ServiceFactory.executeWithFallback(
      FEATURE_FLAGS.USE_REAL_PROVIDER_API,
      () => this.getNearbyProvidersReal(latitude, longitude, radius),
      () => this.getNearbyProvidersMock(latitude, longitude, radius)
    );
  }

  private async getNearbyProvidersReal(
    latitude: number,
    longitude: number,
    radius: number = 10
  ): Promise<ProviderProfile[]> {
    try {
      const apiService = ServiceFactory.getApiService();
      const response = await apiService.get<ProviderProfile[]>(
        `/providers/nearby?latitude=${latitude}&longitude=${longitude}&radius=${radius}`
      );
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get service provider tags with backend integration
  async getServiceProviderTags(): Promise<ServiceProviderTag[]> {
    return await ServiceFactory.executeWithFallback(
      FEATURE_FLAGS.USE_REAL_PROVIDER_API,
      () => this.getServiceProviderTagsReal(),
      () => this.getServiceProviderTagsMock()
    );
  }

  private async getServiceProviderTagsReal(): Promise<ServiceProviderTag[]> {
    try {
      const apiService = ServiceFactory.getApiService();
      const response = await apiService.get<ServiceProviderTag[]>('/tags');
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Mock methods for development
  async getProviderByIdMock(providerId: number): Promise<ProviderProfile> {
    // Simulate API delay
    await ServiceFactory.getApiService().simulateMockDelay();

    const mockProviders = this.getMockProviders();
    const provider = mockProviders.find(p => p.id === providerId);
    
    if (!provider) {
      throw new Error('Provider not found');
    }
    
    return provider;
  }

  async getNearbyProvidersMock(
    latitude: number,
    longitude: number,
    radius: number = 10
  ): Promise<ProviderProfile[]> {
    // Simulate API delay
    await ServiceFactory.getApiService().simulateMockDelay();

    const mockProviders = this.getMockProviders();
    // For mock, just return all providers
    return mockProviders;
  }

  async getServiceProviderTagsMock(): Promise<ServiceProviderTag[]> {
    // Simulate API delay
    await ServiceFactory.getApiService().simulateMockDelay();

    return [
      { id: 1, name: "Hair Stylist" },
      { id: 2, name: "Nail Technician" },
      { id: 3, name: "Barber" },
      { id: 4, name: "Massage Therapist" },
      { id: 5, name: "Esthetician" },
    ];
  }

  private generateMockPosts(providerId: number, count: number = 3): Post[] {
    const posts: Post[] = [];
    const sampleImages = [
      'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300',
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300', 
      'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=300',
      'https://images.unsplash.com/photo-1615398349754-cee7d9d8dc4e?w=300',
      'https://images.unsplash.com/photo-1559599101-f09722fb4948?w=300',
      'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=300',
    ];

    for (let i = 0; i < count; i++) {
      posts.push({
        id: `provider_${providerId}_post_${i + 1}`,
        userId: providerId,
        caption: `Professional work by our team #${i + 1}`,
        media: [{
          id: `media_${providerId}_${i + 1}`,
          url: sampleImages[i % sampleImages.length],
          type: 'image' as const,
        }],
        likesCount: Math.floor(Math.random() * 50) + 10,
        commentsCount: Math.floor(Math.random() * 20) + 2,
        isLiked: false,
        isSaved: false,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        user: {
          id: providerId,
          fullName: '', // Will be filled by provider data
          profilePictureUrl: '',
        },
      });
    }

    return posts;
  }

  private getMockProviders(): ProviderProfile[] {
    return [
      {
        id: 1,
        fullName: "Sarah Johnson",
        email: "sarah@example.com",
        phoneNumber: "+1234567890",
        profilePictureUrl: "https://images.unsplash.com/photo-1494790108755-2616b812b8c5?w=150",
        bio: "Professional hair stylist with 8 years of experience. Specializing in color and cuts.",
        locationLat: 40.7128,
        locationLng: -74.0060,
        averageRating: 4.8,
        totalReviews: 127,
        distance: 2.3,
        isOnline: true,
        tags: [{ id: 1, name: "Hair Stylist" }],
        services: [
          {
            id: 1,
            providerId: 1,
            name: "Haircut & Style",
            description: "Professional haircut with styling",
            price: 75,
            estimatedDurationMinutes: 60,
            isActive: true,
            createdAt: "2024-01-01T00:00:00Z",
          }
        ],
        businessHours: [],
        posts: this.generateMockPosts(1, 4),
        createdAt: "2024-01-01T00:00:00Z",
      },
      {
        id: 2,
        fullName: "Maria Garcia",
        email: "maria@example.com",
        phoneNumber: "+1234567891",
        profilePictureUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150",
        bio: "Licensed nail technician offering manicures, pedicures, and nail art.",
        locationLat: 40.7589,
        locationLng: -73.9851,
        averageRating: 4.9,
        totalReviews: 203,
        distance: 4.1,
        isOnline: true,
        tags: [{ id: 2, name: "Nail Technician" }],
        services: [
          {
            id: 2,
            providerId: 2,
            name: "Gel Manicure",
            description: "Long-lasting gel manicure",
            price: 45,
            estimatedDurationMinutes: 45,
            isActive: true,
            createdAt: "2024-01-01T00:00:00Z",
          }
        ],
        businessHours: [],
        posts: this.generateMockPosts(2, 5),
        createdAt: "2024-01-01T00:00:00Z",
      },
      {
        id: 3,
        fullName: "Alex Thompson",
        email: "alex@example.com",
        phoneNumber: "+1234567892",
        profilePictureUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
        bio: "Master barber specializing in traditional and modern cuts.",
        locationLat: 40.7505,
        locationLng: -73.9934,
        averageRating: 4.7,
        totalReviews: 89,
        distance: 1.8,
        isOnline: false,
        tags: [{ id: 3, name: "Barber" }],
        services: [
          {
            id: 3,
            providerId: 3,
            name: "Classic Haircut",
            description: "Traditional barber haircut",
            price: 35,
            estimatedDurationMinutes: 30,
            isActive: true,
            createdAt: "2024-01-01T00:00:00Z",
          }
        ],
        businessHours: [],
        posts: this.generateMockPosts(3, 3),
        createdAt: "2024-01-01T00:00:00Z",
      },
    ];
  }

  // Mock data for development - replace with real API calls
  async searchProvidersMock(request: ProviderSearchRequest): Promise<ProviderSearchResponse> {
    console.log('🎭 Using MOCK provider API');
    // Simulate API delay
    await ServiceFactory.getApiService().simulateMockDelay();

    const mockProviders = this.getMockProviders();

    // Apply filters
    let filteredProviders = [...mockProviders];

    if (request.query) {
      const query = request.query.toLowerCase();
      filteredProviders = filteredProviders.filter(provider =>
        provider.fullName.toLowerCase().includes(query) ||
        provider.bio?.toLowerCase().includes(query) ||
        provider.tags.some(tag => tag.name.toLowerCase().includes(query))
      );
    }

    if (request.minRating) {
      filteredProviders = filteredProviders.filter(provider =>
        provider.averageRating >= request.minRating!
      );
    }

    // Sort results
    if (request.sortBy) {
      switch (request.sortBy) {
        case 'distance':
          filteredProviders.sort((a, b) => (a.distance || 0) - (b.distance || 0));
          break;
        case 'rating':
          filteredProviders.sort((a, b) => b.averageRating - a.averageRating);
          break;
        case 'popularity':
          filteredProviders.sort((a, b) => b.totalReviews - a.totalReviews);
          break;
      }
    }

    const page = request.page || 1;
    const limit = request.limit || 10;
    const startIndex = (page - 1) * limit;
    const paginatedProviders = filteredProviders.slice(startIndex, startIndex + limit);

    return {
      providers: paginatedProviders,
      total: filteredProviders.length,
      page,
      totalPages: Math.ceil(filteredProviders.length / limit),
    };
  }

  private handleError(error: any): Error {
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.message || 'Provider search failed';
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

export const providerService = new ProviderService();
