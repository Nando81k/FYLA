import { ServiceFactory } from './apiService';
import { FEATURE_FLAGS } from '@/config/api';
import { 
  SearchRequest, 
  SearchResponse, 
  SearchSuggestion, 
  RecentSearch,
  SavedSearch,
  ContentSearchRequest,
  ContentSearchResponse,
  LocationSearchRequest,
  LocationSearchResponse
} from '@/types/search';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5002/api';

class SearchService {
  private baseURL: string;
  private recentSearches: RecentSearch[] = [];
  private savedSearches: SavedSearch[] = [];

  constructor() {
    this.baseURL = `${API_BASE_URL}/search`;
    this.loadStoredData();
  }

  // Universal search across providers, content, and users
  async universalSearch(request: SearchRequest): Promise<SearchResponse> {
    console.log('🔍 universalSearch called - ALWAYS using REAL API');
    return await this.universalSearchReal(request);
  }

  private async universalSearchReal(request: SearchRequest): Promise<SearchResponse> {
    try {
      const apiService = ServiceFactory.getApiService();
      const response = await apiService.post<SearchResponse>('/search/universal', request);
      
      // Store in recent searches
      await this.addRecentSearch({
        query: request.query,
        type: 'universal',
        timestamp: new Date().toISOString(),
        filters: request.filters
      });

      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private async universalSearchMock(request: SearchRequest): Promise<SearchResponse> {
    await ServiceFactory.getApiService().simulateMockDelay();

    // Generate mock comprehensive search results
    const mockResponse: SearchResponse = {
      providers: [
        {
          id: 1,
          fullName: "Sarah Johnson",
          profilePictureUrl: "https://picsum.photos/100/100?random=1",
          bio: "Professional hair stylist with 8+ years experience",
          averageRating: 4.8,
          totalReviews: 127,
          distance: 2.3,
          isOnline: true,
          tags: [{ id: 1, name: "Hair Stylist" }, { id: 2, name: "Color Specialist" }],
          services: [
            { id: 1, name: "Haircut & Style", price: 65, estimatedDurationMinutes: 60 }
          ],
          locationLat: 40.7128,
          locationLng: -74.0060,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      ],
      content: [
        {
          id: "1",
          type: "post",
          authorId: 1,
          authorName: "Sarah Johnson",
          authorProfilePicture: "https://picsum.photos/40/40?random=1",
          caption: "Fresh cut and color transformation! ✨ #hairstyling #transformation",
          media: [
            {
              id: "1",
              type: "image",
              url: "https://picsum.photos/400/400?random=10",
              thumbnailUrl: "https://picsum.photos/200/200?random=10"
            }
          ],
          likesCount: 43,
          commentsCount: 8,
          isLiked: false,
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          updatedAt: new Date(Date.now() - 3600000).toISOString()
        }
      ],
      users: [
        {
          id: 2,
          fullName: "Emma Wilson",
          username: "emmaw_style",
          profilePictureUrl: "https://picsum.photos/100/100?random=2",
          bio: "Beauty enthusiast & makeup artist",
          isServiceProvider: true,
          isFollowing: false,
          stats: {
            postsCount: 89,
            followersCount: 1543,
            followingCount: 287
          }
        }
      ],
      locations: [
        {
          id: "1",
          name: "Downtown Beauty District",
          address: "123 Main St, Downtown",
          type: "district",
          latitude: 40.7580,
          longitude: -73.9855,
          providersCount: 12,
          distance: 1.2
        }
      ],
      suggestions: [
        {
          query: "hair color",
          type: "query",
          count: 234
        },
        {
          query: "nail art",
          type: "query", 
          count: 189
        }
      ],
      total: 15,
      hasMore: true
    };

    // Store in recent searches
    await this.addRecentSearch({
      query: request.query,
      type: 'universal',
      timestamp: new Date().toISOString(),
      filters: request.filters
    });

    return mockResponse;
  }

  // Content-specific search (posts, stories)
  async searchContent(request: ContentSearchRequest): Promise<ContentSearchResponse> {
    console.log('🔍 searchContent called - ALWAYS using REAL API');
    return await this.searchContentReal(request);
  }

  private async searchContentReal(request: ContentSearchRequest): Promise<ContentSearchResponse> {
    try {
      const apiService = ServiceFactory.getApiService();
      return await apiService.post<ContentSearchResponse>('/search/content', request);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private async searchContentMock(request: ContentSearchRequest): Promise<ContentSearchResponse> {
    await ServiceFactory.getApiService().simulateMockDelay();

    return {
      posts: [
        {
          id: "1",
          type: "post",
          authorId: 1,
          authorName: "Sarah Johnson",
          authorProfilePicture: "https://picsum.photos/40/40?random=1",
          caption: `Check out this amazing ${request.query} transformation! ✨`,
          media: [
            {
              id: "1",
              type: "image",
              url: "https://picsum.photos/400/400?random=20",
              thumbnailUrl: "https://picsum.photos/200/200?random=20"
            }
          ],
          likesCount: 76,
          commentsCount: 12,
          isLiked: false,
          createdAt: new Date(Date.now() - 7200000).toISOString(),
          updatedAt: new Date(Date.now() - 7200000).toISOString()
        }
      ],
      stories: [],
      total: 1,
      hasMore: false
    };
  }

  // Location-based search
  async searchByLocation(request: LocationSearchRequest): Promise<LocationSearchResponse> {
    console.log('🔍 searchByLocation called - ALWAYS using REAL API');
    return await this.searchByLocationReal(request);
  }

  private async searchByLocationReal(request: LocationSearchRequest): Promise<LocationSearchResponse> {
    try {
      const apiService = ServiceFactory.getApiService();
      return await apiService.post<LocationSearchResponse>('/search/location', request);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private async searchByLocationMock(request: LocationSearchRequest): Promise<LocationSearchResponse> {
    await ServiceFactory.getApiService().simulateMockDelay();

    return {
      providers: [
        {
          id: 1,
          fullName: "Sarah Johnson",
          profilePictureUrl: "https://picsum.photos/100/100?random=1",
          bio: "Professional hair stylist",
          averageRating: 4.8,
          totalReviews: 127,
          distance: request.radius ? Math.random() * request.radius : 2.3,
          isOnline: true,
          tags: [{ id: 1, name: "Hair Stylist" }],
          services: [],
          locationLat: request.latitude + (Math.random() - 0.5) * 0.01,
          locationLng: request.longitude + (Math.random() - 0.5) * 0.01,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      ],
      locations: [
        {
          id: "1",
          name: "Beauty Plaza",
          address: "456 Oak Ave",
          type: "plaza",
          latitude: request.latitude + 0.005,
          longitude: request.longitude + 0.005,
          providersCount: 8,
          distance: 0.8
        }
      ],
      total: 9
    };
  }

  // Get search suggestions
  async getSearchSuggestions(query: string): Promise<SearchSuggestion[]> {
    console.log('🔍 getSearchSuggestions called - ALWAYS using REAL API');
    return await this.getSearchSuggestionsReal(query);
  }

  private async getSearchSuggestionsReal(query: string): Promise<SearchSuggestion[]> {
    try {
      const apiService = ServiceFactory.getApiService();
      const response = await apiService.get<SearchSuggestion[]>(`/search/suggestions?q=${encodeURIComponent(query)}`);
      return response;
    } catch (error) {
      return [];
    }
  }

  private async getSearchSuggestionsMock(query: string): Promise<SearchSuggestion[]> {
    await new Promise(resolve => setTimeout(resolve, 100));

    const mockSuggestions = [
      { query: "hair color", type: "query", count: 234 },
      { query: "hair cut", type: "query", count: 189 },
      { query: "hair styling", type: "query", count: 156 },
      { query: "nail art", type: "query", count: 143 },
      { query: "nail design", type: "query", count: 98 },
      { query: "makeup artist", type: "query", count: 87 },
      { query: "eyebrow threading", type: "query", count: 76 },
      { query: "facial treatment", type: "query", count: 65 }
    ];

    return mockSuggestions
      .filter(suggestion => suggestion.query.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 5);
  }

  // Recent searches management
  async getRecentSearches(): Promise<RecentSearch[]> {
    return [...this.recentSearches].reverse().slice(0, 10);
  }

  async addRecentSearch(search: Omit<RecentSearch, 'id'>): Promise<void> {
    const newSearch: RecentSearch = {
      id: Date.now().toString(),
      ...search
    };

    // Remove duplicates
    this.recentSearches = this.recentSearches.filter(s => s.query !== search.query);
    
    // Add to beginning
    this.recentSearches.unshift(newSearch);
    
    // Keep only last 20
    this.recentSearches = this.recentSearches.slice(0, 20);
    
    await this.saveStoredData();
  }

  async clearRecentSearches(): Promise<void> {
    this.recentSearches = [];
    await this.saveStoredData();
  }

  async removeRecentSearch(id: string): Promise<void> {
    this.recentSearches = this.recentSearches.filter(s => s.id !== id);
    await this.saveStoredData();
  }

  // Saved searches management
  async getSavedSearches(): Promise<SavedSearch[]> {
    return [...this.savedSearches];
  }

  async saveSearch(search: Omit<SavedSearch, 'id' | 'createdAt'>): Promise<SavedSearch> {
    const newSavedSearch: SavedSearch = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      ...search
    };

    this.savedSearches.unshift(newSavedSearch);
    await this.saveStoredData();
    
    return newSavedSearch;
  }

  async removeSavedSearch(id: string): Promise<void> {
    this.savedSearches = this.savedSearches.filter(s => s.id !== id);
    await this.saveStoredData();
  }

  // Popular/trending searches
  async getTrendingSearches(): Promise<SearchSuggestion[]> {
    console.log('🔍 getTrendingSearches called - ALWAYS using REAL API');
    return await this.getTrendingSearchesReal();
  }

  private async getTrendingSearchesReal(): Promise<SearchSuggestion[]> {
    try {
      const apiService = ServiceFactory.getApiService();
      return await apiService.get<SearchSuggestion[]>('/search/trending');
    } catch (error) {
      return [];
    }
  }

  private async getTrendingSearchesMock(): Promise<SearchSuggestion[]> {
    await new Promise(resolve => setTimeout(resolve, 200));

    return [
      { query: "summer hair trends", type: "trending", count: 1234 },
      { query: "beach waves", type: "trending", count: 987 },
      { query: "pastel nails", type: "trending", count: 756 },
      { query: "bridal makeup", type: "trending", count: 654 },
      { query: "men's fade haircut", type: "trending", count: 543 }
    ];
  }

  // Local storage management
  private async loadStoredData(): Promise<void> {
    try {
      // In a real app, you'd use AsyncStorage or similar
      // For now, we'll simulate with in-memory storage
      const storedRecent = localStorage?.getItem('fyla_recent_searches');
      const storedSaved = localStorage?.getItem('fyla_saved_searches');

      if (storedRecent) {
        this.recentSearches = JSON.parse(storedRecent);
      }

      if (storedSaved) {
        this.savedSearches = JSON.parse(storedSaved);
      }
    } catch (error) {
      console.warn('Failed to load stored search data:', error);
    }
  }

  private async saveStoredData(): Promise<void> {
    try {
      // In a real app, you'd use AsyncStorage or similar
      localStorage?.setItem('fyla_recent_searches', JSON.stringify(this.recentSearches));
      localStorage?.setItem('fyla_saved_searches', JSON.stringify(this.savedSearches));
    } catch (error) {
      console.warn('Failed to save search data:', error);
    }
  }

  private handleError(error: any): Error {
    if (error.response) {
      const message = error.response.data?.message || 'Search operation failed';
      return new Error(message);
    } else if (error.request) {
      return new Error('Network error. Please check your connection.');
    } else {
      return new Error('An unexpected error occurred');
    }
  }
}

export const searchService = new SearchService();
