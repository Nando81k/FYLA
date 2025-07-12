import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, FEATURE_FLAGS, DEV_CONFIG, ApiHealthStatus, getDefaultApiHealthStatus } from '@/config/api';

class ApiService {
  private client: AxiosInstance;
  private healthStatus: ApiHealthStatus = getDefaultApiHealthStatus();
  private healthCheckInterval?: NodeJS.Timeout;
  private currentBaseURL: string = API_CONFIG.baseURL;
  private fallbackUrls: string[] = API_CONFIG.fallbackUrls || [API_CONFIG.baseURL];

  constructor() {
    this.client = axios.create({
      ...API_CONFIG,
      baseURL: this.currentBaseURL,
    });
    this.setupInterceptors();
    this.initializeConnection();
  }

  // Initialize connection by finding the best working URL
  private async initializeConnection(): Promise<void> {
    console.log('🚀 Initializing API connection...');
    const workingUrl = await this.findWorkingBaseUrl();
    if (workingUrl) {
      await this.updateBaseUrl(workingUrl);
      this.startHealthCheck();
    } else {
      console.warn('⚠️ No working API URL found during initialization, will retry on first request');
      // Still start health check with current URL, might work later
      this.startHealthCheck();
    }
  }

  // Try to find a working base URL from the fallback list
  private async findWorkingBaseUrl(): Promise<string | null> {
    console.log('🔍 Searching for working base URL...');
    
    for (const url of this.fallbackUrls) {
      try {
        console.log(`🌐 Testing connection to: ${url}`);
        const testClient = axios.create({
          baseURL: url,
          timeout: 5000, // Short timeout for testing
        });
        
        await testClient.get('/health');
        console.log(`✅ Successfully connected to: ${url}`);
        return url;
      } catch (error) {
        console.log(`❌ Failed to connect to: ${url}`, (error as any).message);
      }
    }
    
    console.log('😞 No working base URL found');
    return null;
  }

  // Update the base URL and recreate the client
  private async updateBaseUrl(newUrl: string): Promise<void> {
    if (newUrl !== this.currentBaseURL) {
      console.log(`🔄 Updating base URL from ${this.currentBaseURL} to ${newUrl}`);
      this.currentBaseURL = newUrl;
      this.client = axios.create({
        ...API_CONFIG,
        baseURL: newUrl,
      });
      this.setupInterceptors();
    }
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      async (config) => {
        // Add auth token if available
        const token = await this.getStoredToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log('🔑 Auth token added to request headers');
        } else {
          console.log('⚠️ No auth token found');
        }

        // Log requests in development
        if (DEV_CONFIG.ENABLE_API_LOGGING) {
          console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        }

        return config;
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        // Log responses in development
        if (DEV_CONFIG.ENABLE_API_LOGGING) {
          console.log(`API Response: ${response.status} ${response.config.url}`);
        }

        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config;

        // Handle 401 errors (unauthorized)
        if (error.response?.status === 401 && originalRequest && !(originalRequest as any)._retry) {
          (originalRequest as any)._retry = true;

          try {
            // Try to refresh token
            const refreshToken = await this.getStoredRefreshToken();
            if (refreshToken) {
              const response = await this.refreshToken(refreshToken);
              if (response.token) {
                await this.setStoredToken(response.token);
                originalRequest.headers!.Authorization = `Bearer ${response.token}`;
                return this.client(originalRequest);
              }
            }
          } catch (refreshError) {
            // Refresh failed, redirect to login
            await this.handleAuthFailure();
          }
        }

        // Log errors in development
        console.error('🚨 API Error Details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
          code: error.code,
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL,
          fullUrl: `${error.config?.baseURL}${error.config?.url}`,
        });
        
        if (DEV_CONFIG.ENABLE_API_LOGGING) {
          console.error('API Error:', error.response?.status, error.response?.data);
        }

        return Promise.reject(error);
      }
    );
  }

  private startHealthCheck() {
    // Check API health every 30 seconds
    this.healthCheckInterval = setInterval(() => {
      this.checkApiHealth();
    }, 30000);

    // Initial health check
    this.checkApiHealth();
  }

  private async checkApiHealth(): Promise<void> {
    const startTime = Date.now();
    const healthUrl = `${API_CONFIG.baseURL}/health`;
    
    console.log('🔍 API Health Check starting...', {
      healthUrl,
      baseURL: API_CONFIG.baseURL
    });
    
    try {
      const response = await axios.get(healthUrl, { timeout: 5000 });
      const responseTime = Date.now() - startTime;

      console.log('✅ API Health Check success:', {
        status: response.status,
        responseTime,
        data: response.data
      });

      this.healthStatus = {
        isOnline: response.status === 200,
        lastChecked: new Date(),
        responseTime,
        features: response.data?.features || {
          auth: false,
          chat: false,
          appointments: false,
          notifications: false,
        },
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      console.error('❌ API Health Check failed:', {
        error: (error as any)?.message,
        code: (error as any)?.code,
        status: (error as any)?.response?.status,
        responseTime,
        healthUrl
      });

      this.healthStatus = {
        ...getDefaultApiHealthStatus(),
        lastChecked: new Date(),
        responseTime,
      };
    }
  }

  // Generic API methods with fallback URL support
  async get<T>(url: string, config?: any): Promise<T> {
    return this.requestWithFallback('get', url, undefined, config);
  }

  async post<T>(url: string, data?: any, config?: any): Promise<T> {
    return this.requestWithFallback('post', url, data, config);
  }

  async put<T>(url: string, data?: any, config?: any): Promise<T> {
    return this.requestWithFallback('put', url, data, config);
  }

  async delete<T>(url: string, config?: any): Promise<T> {
    return this.requestWithFallback('delete', url, undefined, config);
  }

  async patch<T>(url: string, data?: any, config?: any): Promise<T> {
    return this.requestWithFallback('patch', url, data, config);
  }

  // Try the request with the current URL, if it fails, try other URLs
  private async requestWithFallback<T>(
    method: 'get' | 'post' | 'put' | 'delete' | 'patch',
    url: string,
    data?: any,
    config?: any
  ): Promise<T> {
    console.log(`🌐 ${method.toUpperCase()} request to: ${this.currentBaseURL}${url}`);

    try {
      const response: AxiosResponse<T> = await this.client[method](url, ...(data !== undefined ? [data] : []), config);
      console.log(`✅ ${method.toUpperCase()} request successful`);
      return response.data;
    } catch (error) {
      console.warn(`❌ ${method.toUpperCase()} request failed with current URL (${this.currentBaseURL}), trying fallbacks...`);
      
      // Try to find and use a working base URL
      const workingUrl = await this.findWorkingBaseUrl();
      if (workingUrl && workingUrl !== this.currentBaseURL) {
        await this.updateBaseUrl(workingUrl);
        // Retry with the new URL
        const response: AxiosResponse<T> = await this.client[method](url, ...(data !== undefined ? [data] : []), config);
        console.log(`✅ ${method.toUpperCase()} request successful with fallback URL: ${workingUrl}`);
        return response.data;
      }
      
      // If no fallback worked, throw the original error
      console.error(`🚨 All fallback URLs failed for ${method.toUpperCase()} ${url}:`, error);
      throw error;
    }
  }

  // Authentication helpers
  private async getStoredToken(): Promise<string | null> {
    try {
      const token = await AsyncStorage.getItem('token');
      console.log('🔍 getStoredToken result:', token ? `${token.substring(0, 20)}...` : 'null');
      return token;
    } catch (error) {
      console.error('Error getting stored token:', error);
      return null;
    }
  }

  private async getStoredRefreshToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('refreshToken');
    } catch (error) {
      console.error('Error getting stored refresh token:', error);
      return null;
    }
  }

  private async setStoredToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem('token', token);
      console.log('💾 Token stored successfully');
    } catch (error) {
      console.error('Error storing token:', error);
    }
  }

  private async refreshToken(refreshToken: string): Promise<{ token: string }> {
    // This would call your refresh token endpoint
    throw new Error('Token refresh not implemented');
  }

  private async handleAuthFailure(): Promise<void> {
    try {
      // Clear stored tokens
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('refreshToken');
      await AsyncStorage.removeItem('user');
      console.log('🚪 Authentication failed, tokens cleared');
    } catch (error) {
      console.error('Error clearing tokens during auth failure:', error);
    }
  }

  // Utility methods
  isOnline(): boolean {
    return this.healthStatus.isOnline;
  }

  getHealthStatus(): ApiHealthStatus {
    return { ...this.healthStatus };
  }

  isFeatureAvailable(feature: keyof ApiHealthStatus['features']): boolean {
    return this.healthStatus.features[feature];
  }

  getCurrentBaseUrl(): string {
    return this.currentBaseURL;
  }

  // Get available fallback URLs for debugging
  getFallbackUrls(): string[] {
    return [...this.fallbackUrls];
  }

  // Mock data simulation
  async simulateMockDelay(): Promise<void> {
    if (DEV_CONFIG.ENABLE_MOCK_DELAYS) {
      await new Promise(resolve => setTimeout(resolve, DEV_CONFIG.MOCK_DELAY_MS));
    }
  }

  shouldSimulateError(): boolean {
    return DEV_CONFIG.ENABLE_ERROR_SIMULATION && 
           Math.random() < DEV_CONFIG.ERROR_SIMULATION_RATE;
  }

  // Cleanup
  destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
  }
}

// Service factory that decides between mock and real API
export class ServiceFactory {
  private static apiService = new ApiService();

  static getApiService(): ApiService {
    return this.apiService;
  }

  static async executeWithFallback<T>(
    featureFlag: boolean,
    realApiCall: () => Promise<T>,
    mockCall: () => Promise<T>
  ): Promise<T> {
    const isOnline = this.apiService.isOnline();
    
    console.log('🔀 ServiceFactory.executeWithFallback:', {
      featureFlag,
      isOnline,
      willUseRealApi: featureFlag, // Force real API if feature flag is true
      healthStatus: this.apiService.getHealthStatus()
    });

    // Temporarily bypass health check for development - if feature flag is true, try real API
    if (featureFlag) {
      try {
        console.log('🌐 Attempting real API call (bypassing health check)...');
        const result = await realApiCall();
        console.log('✅ Real API call successful');
        return result;
      } catch (error) {
        console.warn('❌ Real API call failed, falling back to mock data:', error);
        return await mockCall();
      }
    } else {
      console.log('📱 Using mock data due to feature flag disabled');
      return await mockCall();
    }
  }

  static shouldUseMockData(featureFlag: boolean): boolean {
    return !featureFlag || !this.apiService.isOnline();
  }
}

export const apiService = new ApiService();
