import axios, { AxiosResponse } from 'axios';
import { 
  AnalyticsData, 
  AnalyticsRequest,
  EarningsData,
  ClientInsight,
  AppointmentMetrics,
  AnalyticsPeriod
} from '@/types';
import { mockAnalyticsData } from '@/utils/mockData';
import { API_CONFIG, FEATURE_FLAGS } from '@/config/api';

const API_BASE_URL = API_CONFIG.baseURL;
const USE_MOCK_DATA = !FEATURE_FLAGS.USE_REAL_ANALYTICS_API;

class AnalyticsService {
  private baseURL: string;

  constructor() {
    this.baseURL = `${API_BASE_URL}/analytics`;
  }

  async getProviderAnalytics(
    token: string,
    request: AnalyticsRequest
  ): Promise<AnalyticsData> {
    // Return mock data if flag is set
    if (USE_MOCK_DATA) {
      return new Promise((resolve) => {
        setTimeout(() => resolve(mockAnalyticsData), 1000);
      });
    }

    try {
      const response: AxiosResponse<AnalyticsData> = await axios.get(
        `${this.baseURL}/provider`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: request,
        }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async exportAnalytics(
    token: string,
    request: AnalyticsRequest
  ): Promise<Blob> {
    try {
      const response = await axios.get(
        `${this.baseURL}/export`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: request,
          responseType: 'blob',
        }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Earnings Data
  async getEarningsData(token: string, period: AnalyticsPeriod): Promise<EarningsData> {
    if (USE_MOCK_DATA) {
      return new Promise((resolve) => {
        setTimeout(() => resolve(this.getMockEarningsData()), 800);
      });
    }

    try {
      const response: AxiosResponse<EarningsData> = await axios.get(
        `${this.baseURL}/earnings`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: { period },
        }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Client Insights
  async getClientInsights(token: string, limit: number = 10): Promise<ClientInsight[]> {
    if (USE_MOCK_DATA) {
      return new Promise((resolve) => {
        setTimeout(() => resolve(this.getMockClientInsights()), 600);
      });
    }

    try {
      const response: AxiosResponse<ClientInsight[]> = await axios.get(
        `${this.baseURL}/clients`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: { limit },
        }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Appointment Metrics
  async getAppointmentMetrics(token: string): Promise<AppointmentMetrics> {
    if (USE_MOCK_DATA) {
      return new Promise((resolve) => {
        setTimeout(() => resolve(this.getMockAppointmentMetrics()), 700);
      });
    }

    try {
      const response: AxiosResponse<AppointmentMetrics> = await axios.get(
        `${this.baseURL}/appointments`,
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

  // Mock Data Methods
  private getMockEarningsData(): EarningsData {
    return {
      totalEarnings: 12450.75,
      pendingPayouts: 2340.50,
      availableForPayout: 1890.25,
      lastPayoutDate: '2025-01-01',
      nextPayoutDate: '2025-01-15',
      
      dailyEarnings: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        amount: Math.random() * 500 + 100,
      })),
      
      weeklyEarnings: Array.from({ length: 12 }, (_, i) => ({
        week: `Week ${i + 1}`,
        amount: Math.random() * 2000 + 500,
      })),
      
      monthlyEarnings: Array.from({ length: 12 }, (_, i) => ({
        month: new Date(2024, i).toLocaleString('default', { month: 'long' }),
        amount: Math.random() * 5000 + 2000,
      })),
      
      platformFee: 342.50,
      processingFee: 156.75,
      netEarnings: 11951.50,
      
      totalTaxableIncome: 11951.50,
      estimatedTaxes: 2988.38,
    };
  }

  private getMockClientInsights(): ClientInsight[] {
    return [
      {
        clientId: 1,
        clientName: 'Sarah Johnson',
        profilePictureUrl: 'https://via.placeholder.com/50x50?text=SJ',
        totalAppointments: 8,
        totalSpent: 1240.00,
        lastAppointment: '2025-01-05',
        averageRating: 4.9,
        status: 'active',
        appointmentHistory: [
          { date: '2025-01-05', serviceName: 'Hair Cut & Style', amount: 150, status: 'completed' },
          { date: '2024-12-15', serviceName: 'Hair Color', amount: 240, status: 'completed' },
        ],
      },
      {
        clientId: 2,
        clientName: 'Emily Davis',
        profilePictureUrl: 'https://via.placeholder.com/50x50?text=ED',
        totalAppointments: 6,
        totalSpent: 890.00,
        lastAppointment: '2025-01-03',
        averageRating: 4.8,
        status: 'active',
        appointmentHistory: [
          { date: '2025-01-03', serviceName: 'Facial Treatment', amount: 120, status: 'completed' },
          { date: '2024-12-20', serviceName: 'Manicure', amount: 80, status: 'completed' },
        ],
      },
      {
        clientId: 3,
        clientName: 'Jessica Wilson',
        profilePictureUrl: 'https://via.placeholder.com/50x50?text=JW',
        totalAppointments: 12,
        totalSpent: 1890.00,
        lastAppointment: '2025-01-01',
        averageRating: 5.0,
        status: 'active',
        appointmentHistory: [
          { date: '2025-01-01', serviceName: 'Massage', amount: 120, status: 'completed' },
          { date: '2024-12-18', serviceName: 'Hair Cut & Style', amount: 150, status: 'completed' },
        ],
      },
    ];
  }

  private getMockAppointmentMetrics(): AppointmentMetrics {
    return {
      totalUpcoming: 23,
      totalToday: 6,
      totalThisWeek: 18,
      totalThisMonth: 87,
      
      confirmed: 25,
      pending: 12,
      completed: 45,
      cancelled: 4,
      noShow: 1,
      
      averageBookingLeadTime: 5.2,
      cancellationRate: 4.6,
      rescheduleRate: 8.3,
      
      upcomingRevenue: 3290.00,
      lostRevenue: 580.00,
    };
  }

  private handleError(error: any): Error {
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.message || 'Analytics operation failed';
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

export const analyticsService = new AnalyticsService();
