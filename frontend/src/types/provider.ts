import { ServiceProviderTag, Service, BusinessHours } from './index';
import { Post } from './content';

export interface ProviderProfile {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  profilePictureUrl?: string;
  bio?: string;
  locationLat?: number;
  locationLng?: number;
  averageRating: number;
  totalReviews: number;
  distance?: number; // In kilometers
  isOnline: boolean;
  tags: ServiceProviderTag[];
  services: Service[];
  businessHours: BusinessHours[];
  posts?: Post[]; // Recent posts for display on cards
  createdAt: string;
}

export interface ProviderSearchRequest {
  query?: string;
  tags?: number[]; // Array of tag IDs
  latitude?: number;
  longitude?: number;
  radius?: number; // In kilometers
  minRating?: number;
  sortBy?: 'distance' | 'rating' | 'popularity' | 'newest';
  page?: number;
  limit?: number;
}

export interface ProviderSearchResponse {
  providers: ProviderProfile[];
  total: number;
  page: number;
  totalPages: number;
}

export interface FilterOptions {
  tags: ServiceProviderTag[];
  maxDistance: number;
  minRating: number;
  sortBy: 'distance' | 'rating' | 'popularity' | 'newest';
}
