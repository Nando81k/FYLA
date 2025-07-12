import { ProviderProfile } from './provider';
import { ServiceProviderTag } from './index';
import { Post, Story, UserProfile } from './content';

// Enhanced search request types
export interface SearchRequest {
  query: string;
  type?: 'all' | 'providers' | 'content' | 'users' | 'locations';
  filters?: SearchFilters;
  location?: LocationFilter;
  pagination?: PaginationRequest;
}

export interface SearchFilters {
  tags?: number[];
  rating?: {
    min?: number;
    max?: number;
  };
  price?: {
    min?: number;
    max?: number;
  };
  priceRange?: {
    min?: number;
    max?: number;
  };
  distance?: {
    max?: number;
  };
  maxDistance?: number;
  availability?: {
    date?: string;
    timeSlots?: string[];
  };
  categories?: string[];
  minRating?: number;
  nearMe?: boolean;
  sortBy?: 'relevance' | 'distance' | 'rating' | 'price' | 'price_low' | 'price_high' | 'newest' | 'popularity';
  contentType?: 'posts' | 'stories' | 'all';
  dateRange?: {
    from?: string;
    to?: string;
  };
}

// Export type aliases for easier usage
export type SortOption = SearchFilters['sortBy'];
export type PriceRange = NonNullable<SearchFilters['priceRange']>;

export interface LocationFilter {
  latitude: number;
  longitude: number;
  radius?: number; // in kilometers
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

export interface PaginationRequest {
  page?: number;
  limit?: number;
  offset?: number;
}

// Search response types
export interface SearchResponse {
  providers: ProviderProfile[];
  content: ContentSearchResult[];
  users: UserSearchResult[];
  locations: LocationSearchResult[];
  suggestions: SearchSuggestion[];
  total: number;
  hasMore: boolean;
  searchTime?: number;
  appliedFilters?: SearchFilters;
}

export interface ContentSearchResult {
  id: string;
  type: 'post' | 'story';
  authorId: number;
  authorName: string;
  authorProfilePicture?: string;
  caption?: string;
  media: MediaItem[];
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  createdAt: string;
  updatedAt: string;
  relevanceScore?: number;
}

export interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  duration?: number;
}

export interface UserSearchResult {
  id: number;
  fullName: string;
  username?: string;
  profilePictureUrl?: string;
  bio?: string;
  isServiceProvider: boolean;
  isFollowing: boolean;
  stats: {
    postsCount: number;
    followersCount: number;
    followingCount: number;
  };
  tags?: ServiceProviderTag[];
  relevanceScore?: number;
}

export interface LocationSearchResult {
  id: string;
  name: string;
  address: string;
  type: 'business' | 'district' | 'landmark' | 'plaza' | 'mall';
  latitude: number;
  longitude: number;
  providersCount: number;
  distance?: number;
  rating?: number;
  priceRange?: 'low' | 'medium' | 'high';
}

// Specialized search types
export interface ContentSearchRequest {
  query: string;
  type?: 'posts' | 'stories' | 'all';
  authorId?: number;
  tags?: string[];
  dateRange?: {
    from: string;
    to: string;
  };
  mediaType?: 'image' | 'video' | 'all';
  sortBy?: 'relevance' | 'newest' | 'popular' | 'trending';
  pagination?: PaginationRequest;
}

export interface ContentSearchResponse {
  posts: ContentSearchResult[];
  stories: ContentSearchResult[];
  total: number;
  hasMore: boolean;
}

export interface LocationSearchRequest {
  latitude: number;
  longitude: number;
  radius?: number;
  query?: string;
  filters?: {
    tags?: number[];
    rating?: number;
    priceRange?: 'low' | 'medium' | 'high';
  };
  sortBy?: 'distance' | 'rating' | 'popularity';
}

export interface LocationSearchResponse {
  providers: ProviderProfile[];
  locations: LocationSearchResult[];
  total: number;
}

// Search suggestions and history
export interface SearchSuggestion {
  query: string;
  type: 'query' | 'provider' | 'tag' | 'location' | 'trending';
  count?: number;
  icon?: string;
  category?: string;
}

export interface RecentSearch {
  id: string;
  query: string;
  type: 'universal' | 'providers' | 'content' | 'users';
  timestamp: string;
  filters?: SearchFilters;
  resultCount?: number;
}

export interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters?: SearchFilters;
  location?: LocationFilter;
  createdAt: string;
  notifyOnNew?: boolean;
  isActive?: boolean;
}

// Search analytics and insights
export interface SearchAnalytics {
  popularQueries: SearchSuggestion[];
  trendingTags: ServiceProviderTag[];
  regionPopularity: {
    location: string;
    searchCount: number;
    topQueries: string[];
  }[];
  searchVolume: {
    date: string;
    count: number;
  }[];
}

// Advanced filter options
export interface AdvancedFilters {
  availability: {
    date: string;
    timeRange: {
      start: string;
      end: string;
    };
  };
  pricing: {
    min: number;
    max: number;
    currency: string;
  };
  experience: {
    minYears: number;
    certifications: string[];
  };
  features: {
    homeService: boolean;
    instantBooking: boolean;
    onlineConsultation: boolean;
    groupBooking: boolean;
  };
  accessibility: {
    wheelchairAccessible: boolean;
    signLanguage: boolean;
    brailleMenus: boolean;
  };
}

// Search context and personalization
export interface SearchContext {
  userId?: number;
  location?: LocationFilter;
  recentActivity: {
    viewedProviders: number[];
    searchedQueries: string[];
    bookedServices: number[];
  };
  preferences: {
    preferredTags: number[];
    priceRange: 'low' | 'medium' | 'high';
    maxTravelDistance: number;
    availableHours: string[];
  };
  searchHistory: RecentSearch[];
}

// Discovery features
export interface DiscoveryRequest {
  type: 'trending' | 'nearMe' | 'newProviders' | 'topRated' | 'recommended';
  location?: LocationFilter;
  limit?: number;
  excludeIds?: number[];
}

export interface DiscoveryResponse {
  title: string;
  subtitle?: string;
  providers: ProviderProfile[];
  content: ContentSearchResult[];
  hasMore: boolean;
  refreshable: boolean;
}

// Search result categories
export interface SearchCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  tags: number[];
  popularQueries: string[];
  estimatedProviders: number;
}

export interface PopularSearches {
  trending: SearchSuggestion[];
  nearYou: SearchSuggestion[];
  categories: SearchCategory[];
  seasonalSuggestions: SearchSuggestion[];
}
