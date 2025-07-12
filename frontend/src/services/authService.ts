import axios, { AxiosResponse } from 'axios';
import { LoginRequest, User, UserRole } from '@/types';
import { ServiceFactory } from './apiService';
import { FEATURE_FLAGS, API_ENDPOINTS } from '@/config/api';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5002/api';

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phoneNumber: string;
  role: UserRole;
}

class AuthService {
  private baseURL: string;

  constructor() {
    this.baseURL = `${API_BASE_URL}/auth`;
  }

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    console.log('🚀 authService.login called with feature flag:', FEATURE_FLAGS.USE_REAL_AUTH_API);
    return await ServiceFactory.executeWithFallback(
      FEATURE_FLAGS.USE_REAL_AUTH_API,
      () => this.loginReal(credentials),
      () => this.loginMock(credentials)
    );
  }

  private async loginReal(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      console.log('🔐 loginReal called with EXACT credentials:', {
        email: `"${credentials.email}"`,
        password: `"${credentials.password}"`,
        emailLength: credentials.email?.length,
        passwordLength: credentials.password?.length,
        endpoint: API_ENDPOINTS.AUTH.LOGIN,
        flagStatus: FEATURE_FLAGS.USE_REAL_AUTH_API,
        apiBaseUrl: API_BASE_URL,
        fullUrl: `${API_BASE_URL}${API_ENDPOINTS.AUTH.LOGIN}`
      });
      
      const apiService = ServiceFactory.getApiService();
      console.log('🌐 API Service created, making request to:', `${API_BASE_URL}${API_ENDPOINTS.AUTH.LOGIN}`);
      console.log('📤 Sending exact payload:', JSON.stringify(credentials, null, 2));
      
      const response = await apiService.post<AuthResponse>(
        API_ENDPOINTS.AUTH.LOGIN,
        credentials
      );
      
      console.log('✅ loginReal response received:', {
        hasUser: !!response.user,
        userId: response.user?.id,
        userRole: response.user?.role,
        hasToken: !!response.token
      });
      
      return response;
    } catch (error) {
      console.error('❌ loginReal error:', error);
      console.error('❌ loginReal error details:', {
        message: (error as any)?.message,
        response: (error as any)?.response?.data,
        status: (error as any)?.response?.status,
        config: (error as any)?.config
      });
      throw this.handleError(error);
    }
  }

  private async loginMock(credentials: LoginRequest): Promise<AuthResponse> {
    // Simulate API delay
    await ServiceFactory.getApiService().simulateMockDelay();

    // Mock authentication logic
    if (credentials.email === 'client@example.com' && credentials.password === 'password') {
      return {
        user: {
          id: 1,
          role: UserRole.CLIENT,
          fullName: 'John Doe',
          email: credentials.email,
          phoneNumber: '+1234567890',
          profilePictureUrl: 'https://via.placeholder.com/150',
          bio: 'Mock client user',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        token: 'mock_jwt_token_client',
        refreshToken: 'mock_refresh_token_client',
      };
    } else if (credentials.email === 'provider@example.com' && credentials.password === 'password') {
      return {
        user: {
          id: 2,
          role: UserRole.PROVIDER,
          fullName: 'Jane Smith',
          email: credentials.email,
          phoneNumber: '+0987654321',
          profilePictureUrl: 'https://via.placeholder.com/150',
          bio: 'Mock provider user',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        token: 'mock_jwt_token_provider',
        refreshToken: 'mock_refresh_token_provider',
      };
    } else {
      throw new Error('Invalid email or password');
    }
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    console.log('🚀 authService.register called with feature flag:', FEATURE_FLAGS.USE_REAL_AUTH_API);
    return await ServiceFactory.executeWithFallback(
      FEATURE_FLAGS.USE_REAL_AUTH_API,
      () => this.registerReal(userData),
      () => this.registerMock(userData)
    );
  }

  private async registerReal(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      console.log('📝 registerReal called with:', {
        fullName: userData.fullName,
        email: userData.email,
        hasPassword: !!userData.password,
        role: userData.role,
        endpoint: API_ENDPOINTS.AUTH.REGISTER,
        flagStatus: FEATURE_FLAGS.USE_REAL_AUTH_API
      });
      
      const apiService = ServiceFactory.getApiService();
      // Backend expects ConfirmPassword with capital C
      const backendData = {
        FullName: userData.fullName,
        Email: userData.email,
        Password: userData.password,
        ConfirmPassword: userData.confirmPassword,
        PhoneNumber: userData.phoneNumber,
        Role: userData.role
      };
      
      console.log('🌐 Making registration request...');
      const response = await apiService.post<AuthResponse>(
        API_ENDPOINTS.AUTH.REGISTER,
        backendData
      );
      
      console.log('✅ registerReal response received:', {
        hasUser: !!response.user,
        userId: response.user?.id,
        userRole: response.user?.role,
        hasToken: !!response.token
      });
      
      return response;
    } catch (error) {
      console.error('❌ registerReal error:', error);
      throw this.handleError(error);
    }
  }

  private async registerMock(userData: RegisterRequest): Promise<AuthResponse> {
    // Simulate API delay
    await ServiceFactory.getApiService().simulateMockDelay();

    // Remove confirmPassword for mock registration (not needed)
    const { confirmPassword, ...mockData } = userData;

    // Mock registration logic
    const newUser: User = {
      id: Math.floor(Math.random() * 1000) + 100,
      role: userData.role,
      fullName: userData.fullName,
      email: userData.email,
      phoneNumber: userData.phoneNumber,
      profilePictureUrl: 'https://via.placeholder.com/150',
      bio: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return {
      user: newUser,
      token: `mock_jwt_token_${userData.role}_${newUser.id}`,
      refreshToken: `mock_refresh_token_${userData.role}_${newUser.id}`,
    };
  }

  async refreshToken(token: string): Promise<AuthResponse> {
    return await ServiceFactory.executeWithFallback(
      FEATURE_FLAGS.USE_REAL_AUTH_API,
      () => this.refreshTokenReal(token),
      () => this.refreshTokenMock(token)
    );
  }

  private async refreshTokenReal(token: string): Promise<AuthResponse> {
    try {
      const apiService = ServiceFactory.getApiService();
      const response = await apiService.post<AuthResponse>(
        API_ENDPOINTS.AUTH.REFRESH_TOKEN,
        { token }
      );
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private async refreshTokenMock(token: string): Promise<AuthResponse> {
    // Simulate API delay
    await ServiceFactory.getApiService().simulateMockDelay();

    // Mock token refresh logic
    if (token.startsWith('mock_refresh_token_')) {
      const parts = token.split('_');
      const role = parts[3] as UserRole;
      const userId = parseInt(parts[4]);

      const user: User = {
        id: userId,
        role,
        fullName: role === UserRole.CLIENT ? 'John Doe' : 'Jane Smith',
        email: role === UserRole.CLIENT ? 'client@example.com' : 'provider@example.com',
        phoneNumber: role === UserRole.CLIENT ? '+1234567890' : '+0987654321',
        profilePictureUrl: 'https://via.placeholder.com/150',
        bio: `Mock ${role} user`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return {
        user,
        token: `mock_jwt_token_${role}_${userId}`,
        refreshToken: `mock_refresh_token_${role}_${userId}`,
      };
    } else {
      throw new Error('Invalid refresh token');
    }
  }

  async logout(token: string): Promise<void> {
    if (FEATURE_FLAGS.USE_REAL_AUTH_API && ServiceFactory.getApiService().isOnline()) {
      try {
        const apiService = ServiceFactory.getApiService();
        await apiService.post(API_ENDPOINTS.AUTH.LOGOUT, {}, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (error) {
        // Don't throw on logout errors, just log them
        console.warn('Logout error:', error);
      }
    } else {
      // Mock logout - just simulate delay
      await ServiceFactory.getApiService().simulateMockDelay();
    }
  }

  async validateToken(token: string): Promise<User> {
    return await ServiceFactory.executeWithFallback(
      FEATURE_FLAGS.USE_REAL_AUTH_API,
      () => this.validateTokenReal(token),
      () => this.validateTokenMock(token)
    );
  }

  private async validateTokenReal(token: string): Promise<User> {
    try {
      const apiService = ServiceFactory.getApiService();
      const response = await apiService.get<User>(API_ENDPOINTS.AUTH.VALIDATE, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private async validateTokenMock(token: string): Promise<User> {
    // Simulate API delay
    await ServiceFactory.getApiService().simulateMockDelay();

    // Mock token validation
    if (token.startsWith('mock_jwt_token_')) {
      const parts = token.split('_');
      const role = parts[3] as UserRole;
      const userId = parseInt(parts[4]);

      return {
        id: userId,
        role,
        fullName: role === UserRole.CLIENT ? 'John Doe' : 'Jane Smith',
        email: role === UserRole.CLIENT ? 'client@example.com' : 'provider@example.com',
        phoneNumber: role === UserRole.CLIENT ? '+1234567890' : '+0987654321',
        profilePictureUrl: 'https://via.placeholder.com/150',
        bio: `Mock ${role} user`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } else {
      throw new Error('Invalid token');
    }
  }

  private handleError(error: any): Error {
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.message || 'Authentication failed';
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

export const authService = new AuthService();
