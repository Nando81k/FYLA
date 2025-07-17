// User roles
export enum UserRole {
  CLIENT = 'Client',
  PROVIDER = 'ServiceProvider'
}

// Auth types
export interface User {
  id: number;
  role: UserRole;
  fullName: string;
  email: string;
  phoneNumber: string;
  profilePictureUrl?: string;
  bio?: string;
  locationLat?: number;
  locationLng?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phoneNumber: string;
  role: UserRole;
}

// Service Provider types
export interface ServiceProviderTag {
  id: number;
  name: string;
}

export interface Service {
  id: number;
  providerId: number;
  name: string;
  description: string;
  price: number;
  estimatedDurationMinutes: number;
  isActive: boolean;
  createdAt: string;
}

export interface Post {
  id: number;
  providerId: number;
  imageUrl: string;
  caption: string;
  createdAt: string;
  provider: User;
}

export interface Story {
  id: number;
  providerId: number;
  mediaUrl: string;
  createdAt: string;
  expiresAt: string;
  provider: User;
}

// Appointment types
export enum AppointmentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  NO_SHOW = 'no_show',
}

export interface Appointment {
  id: number;
  clientId: number;
  providerId: number;
  scheduledStartTime: string;
  scheduledEndTime: string;
  status: AppointmentStatus;
  totalPrice?: number;
  createdAt: string;
  updatedAt: string;
  client?: User;
  provider?: User;
  services: AppointmentService[];
  notes?: string;
  review?: Review;
}

export interface AppointmentService {
  appointmentId: number;
  serviceId: number;
  priceAtBooking: number;
  service: Service;
}

// Review types
export interface Review {
  id: number;
  appointmentId: number;
  clientId: number;
  providerId: number;
  rating: number;
  comment: string;
  createdAt: string;
  client: User;
  provider: User;
}

// Analytics types
export interface BusinessAnalyticsSnapshot {
  id: number;
  providerId: number;
  date: string;
  totalRevenue: number;
  mostRequestedServiceId: number;
  totalAppointments: number;
  createdAt: string;
  mostRequestedService: Service;
}

// Navigation types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: { userType: UserRole };
};

export type ClientTabParamList = {
  Feed: undefined;
  Search: undefined;
  Bookings: undefined;
  Messages: undefined;
  Profile: undefined;
};

export type ClientFeedStackParamList = {
  FeedHome: undefined;
  UserProfile: { userId: number };
  Comments: { postId: string };
  PostDetail: { postId: string };
  SavedPosts: undefined;
  Notifications: undefined;
  NotificationPreferences: undefined;
  CreatePost: undefined;
  CreateContent: undefined;
  ProviderDetail: { providerId: number };
  AIBooking: undefined;
};

export type ClientSearchStackParamList = {
  SearchHome: undefined;
  ProviderDetail: { providerId: number };
  UserProfile: { userId: number };
  PostDetail: { postId: string };
  Chat: { conversationId: number; otherUser: User };
  AIBooking: undefined;
};

export type MessagesStackParamList = {
  MessagesList: undefined;
  Chat: { conversationId: number; otherUser: User };
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
  NotificationSettings: undefined;
  DeveloperSettings: undefined;
  SavedPosts: undefined;
  Notifications: undefined;
  NotificationPreferences: undefined;
};

export type ProviderTabParamList = {
  Dashboard: undefined;
  Feed: undefined;
  Services: undefined;
  Bookings: undefined;
  Messages: undefined;
  Profile: undefined;
};

export type ProviderFeedStackParamList = {
  FeedHome: undefined;
  CreateContent: undefined;
  UserProfile: { userId: number };
  Comments: { postId: string };
  PostDetail: { postId: string };
};

export type ProviderDashboardStackParamList = {
  DashboardHome: undefined;
  Analytics: undefined;
  AvailabilityManagement: undefined;
  BookingManagement: undefined;
  PackageManagement: undefined;
  ClientManagement: undefined;
  CreateContent: undefined;
};

// Business Hours
export * from './businessHours';

// Analytics
export * from './analytics';

// Provider Discovery
export * from './provider';

// Appointments
export * from './appointment';

// Chat
export * from './chat';

// Search & Discovery
export * from './search';
