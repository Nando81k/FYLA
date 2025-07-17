import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';

// API Configuration and Environment Management
const isDevelopment = __DEV__;

// Multiple fallback URLs for different environments
const FALLBACK_URLS = [
  'http://10.0.12.121:5002/api',   // Current working IP - prioritized
  'http://192.168.1.185:5002/api', // Previous IP - kept as fallback
  'http://192.168.1.201:5002/api', // Older IP - kept as fallback
  'http://localhost:5002/api',     // Localhost - may work for some simulators
  'http://127.0.0.1:5002/api',     // Loopback - alternative for simulator
  // Add more IPs if needed
];

// Use environment variable or default to first fallback
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || FALLBACK_URLS[0];

export const API_CONFIG = {
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  fallbackUrls: FALLBACK_URLS,
};

// Feature flags to control mock vs real API usage
export const FEATURE_FLAGS = {
  // Set to true to use real API data for production-ready features
  USE_REAL_AUTH_API: true,
  USE_REAL_USER_API: true,
  USE_REAL_PROVIDER_API: true,
  USE_REAL_APPOINTMENT_API: true,
  USE_REAL_BOOKING_API: true, // Advanced booking system - now using real API
  USE_REAL_CHAT_API: true,
  USE_REAL_SOCIAL_API: true, // Social features - now using real API
  USE_REAL_REVIEW_API: true,
  USE_REAL_CALENDAR_API: true,
  USE_REAL_NOTIFICATION_API: true,
  USE_REAL_ANALYTICS_API: true,
  USE_REAL_CONTENT_API: true, // Using real API for content
  USE_REAL_SEARCH_API: true, // Using real API for search
  
  // WebSocket configuration
  USE_REAL_WEBSOCKET: true,
  WEBSOCKET_URL: process.env.EXPO_PUBLIC_WEBSOCKET_URL || 'ws://10.0.12.121:5002/chathub',
  
  // Push notification configuration
  USE_REAL_PUSH_NOTIFICATIONS: true,
};

// API Endpoints
export const API_ENDPOINTS = {
  BASE_URL: API_BASE_URL.replace('/api', ''), // Remove /api suffix for SignalR hub connection
  
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH_TOKEN: '/auth/refresh-token',
    LOGOUT: '/auth/logout',
    VALIDATE: '/auth/validate',
  },
  
  // User Management
  USERS: {
    PROFILE: '/users/profile',
    UPDATE_PROFILE: '/users/profile',
    UPLOAD_AVATAR: '/users/avatar',
  },
  
  // Provider Services
  PROVIDERS: {
    SEARCH: '/providers/search',
    PROFILE: (id: number) => `/providers/${id}`,
    SERVICES: (id: number) => `/providers/${id}/services`,
    REVIEWS: (id: number) => `/providers/${id}/reviews`,
    CALENDAR: (id: number) => `/providers/${id}/calendar`,
    ANALYTICS: (id: number) => `/providers/${id}/analytics`,
  },
  
  // Services
  SERVICES: {
    LIST: '/services',
    CREATE: '/services',
    UPDATE: (id: number) => `/services/${id}`,
    DELETE: (id: number) => `/services/${id}`,
    TOGGLE_STATUS: (id: number) => `/services/${id}/toggle-status`,
  },
  
  // Appointments
  APPOINTMENTS: {
    LIST: '/appointments',
    CREATE: '/appointments',
    GET: (id: number) => `/appointments/${id}`,
    UPDATE: (id: number) => `/appointments/${id}`,
    CANCEL: (id: number) => `/appointments/${id}/cancel`,
    CONFIRM: (id: number) => `/appointments/${id}/confirm`,
    COMPLETE: (id: number) => `/appointments/${id}/complete`,
    NO_SHOW: (id: number) => `/appointments/${id}/no-show`,
    TIME_SLOTS: '/appointments/time-slots',
  },
  
  // Chat & Messaging
  CHAT: {
    CONVERSATIONS: '/chat/conversations',
    MESSAGES: '/chat/messages',
    CONVERSATION_MESSAGES: (conversationId: number) => `/chat/conversations/${conversationId}/messages`,
    MARK_MESSAGE_READ: (messageId: number) => `/chat/messages/${messageId}/read`,
    MARK_CONVERSATION_READ: (conversationId: number) => `/chat/conversations/${conversationId}/read`,
  },
  
  // Social Features
  SOCIAL: {
    FOLLOW: '/social/follow',
    FOLLOWERS: (userId: number) => `/social/users/${userId}/followers`,
    FOLLOWING: (userId: number) => `/social/users/${userId}/following`,
    STATS: (userId: number) => `/social/users/${userId}/stats`,
    IS_FOLLOWING: (userId: number) => `/social/users/${userId}/is-following`,
    MUTUAL_FOLLOWS: (userId: number) => `/social/users/${userId}/mutual-follows`,
    SUGGESTED_USERS: '/social/suggested-users',
    MY_FOLLOWING: '/social/my-following',
    MY_FOLLOWERS: '/social/my-followers',
  },

  // Content & Feed
  CONTENT: {
    FEED: '/content/feed',
    POSTS: '/content/posts',
    STORIES: '/content/stories',
    USER_POSTS: (userId: number) => `/content/users/${userId}/posts`,
    SAVED_POSTS: '/content/saved',
  },

  // Bookings (Advanced)
  BOOKINGS: {
    LIST: '/bookings',
    CREATE: '/bookings/create',
    GET: (id: string) => `/bookings/${id}`,
    UPDATE: (id: string) => `/bookings/${id}`,
    CANCEL: (id: string) => `/bookings/${id}/cancel`,
    VALIDATE: '/bookings/validate',
  },
  
  // Reviews
  REVIEWS: {
    CREATE: '/reviews',
    LIST: '/reviews',
    PROVIDER_REVIEWS: (providerId: number) => `/reviews/provider/${providerId}`,
    UPDATE: (id: number) => `/reviews/${id}`,
    DELETE: (id: number) => `/reviews/${id}`,
  },
  
  // Calendar
  CALENDAR: {
    GET_CALENDAR: '/calendar',
    SET_AVAILABILITY: '/calendar/availability',
    GET_APPOINTMENTS: '/calendar/appointments',
    UPDATE_AVAILABILITY: '/calendar/availability',
  },
  
  // Notifications
  NOTIFICATIONS: {
    REGISTER_TOKEN: '/notifications/register-token',
    UNREGISTER_TOKEN: '/notifications/unregister-token',
    SEND: '/notifications/send',
    HISTORY: '/notifications/history',
    PREFERENCES: '/notifications/preferences',
  },
  
  // Analytics
  ANALYTICS: {
    DASHBOARD: '/analytics/dashboard',
    REVENUE: '/analytics/revenue',
    APPOINTMENTS: '/analytics/appointments',
    REVIEWS: '/analytics/reviews',
  },
  
  // Health checks
  HEALTH: {
    GENERAL: '/health',
    APPOINTMENTS: '/health/appointments',
    AUTH: '/health/auth',
  },
};

// Development helpers
export const DEV_CONFIG = {
  ENABLE_API_LOGGING: isDevelopment,
  ENABLE_MOCK_DELAYS: true,
  MOCK_DELAY_MS: 1000,
  ENABLE_ERROR_SIMULATION: false,
  ERROR_SIMULATION_RATE: 0.1, // 10% chance of simulated errors
};

// API Status monitoring
export interface ApiHealthStatus {
  isOnline: boolean;
  lastChecked: Date;
  responseTime: number;
  features: {
    auth: boolean;
    chat: boolean;
    appointments: boolean;
    notifications: boolean;
  };
}

export const getDefaultApiHealthStatus = (): ApiHealthStatus => ({
  isOnline: false,
  lastChecked: new Date(),
  responseTime: 0,
  features: {
    auth: false,
    chat: false,
    appointments: false,
    notifications: false,
  },
});

// Environment detection
export const getEnvironmentInfo = () => ({
  isDevelopment,
  platform: Platform.OS,
  appVersion: Constants.expoConfig?.version || '1.0.0',
  buildNumber: Constants.expoConfig?.ios?.buildNumber || Constants.expoConfig?.android?.versionCode || '1',
  apiBaseUrl: API_BASE_URL,
  isPhysicalDevice: Device.isDevice,
});
