import axios, { AxiosResponse } from 'axios';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5002/api';

export interface RegisterPushTokenRequest {
  token: string;
  userId: number;
  deviceInfo?: {
    platform: string;
    deviceId: string;
    appVersion: string;
  };
}

export interface NotificationRequest {
  userIds: number[];
  title: string;
  body: string;
  data?: any;
  scheduledFor?: Date;
}

class PushNotificationService {
  private baseURL: string;

  constructor() {
    this.baseURL = `${API_BASE_URL}/notifications`;
  }

  async registerPushToken(
    token: string,
    userId: number,
    authToken: string,
    deviceInfo?: any
  ): Promise<void> {
    try {
      await axios.post(
        `${this.baseURL}/register-token`,
        {
          token,
          userId,
          deviceInfo
        },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (error) {
      console.error('Failed to register push token:', error);
      throw this.handleError(error);
    }
  }

  async unregisterPushToken(token: string, authToken: string): Promise<void> {
    try {
      await axios.delete(
        `${this.baseURL}/unregister-token`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
          data: { token }
        }
      );
    } catch (error) {
      console.error('Failed to unregister push token:', error);
      // Don't throw on unregister errors
    }
  }

  async sendNotification(
    notification: NotificationRequest,
    authToken: string
  ): Promise<void> {
    try {
      await axios.post(
        `${this.baseURL}/send`,
        notification,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (error) {
      console.error('Failed to send notification:', error);
      throw this.handleError(error);
    }
  }

  async getNotificationHistory(
    userId: number,
    authToken: string,
    page: number = 1,
    limit: number = 20
  ): Promise<any[]> {
    try {
      const response: AxiosResponse<{ notifications: any[]; total: number }> = await axios.get(
        `${this.baseURL}/history`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
          params: {
            userId,
            page,
            limit
          }
        }
      );
      return response.data.notifications;
    } catch (error) {
      console.error('Failed to get notification history:', error);
      throw this.handleError(error);
    }
  }

  async updateNotificationPreferences(
    userId: number,
    preferences: any,
    authToken: string
  ): Promise<void> {
    try {
      await axios.put(
        `${this.baseURL}/preferences`,
        {
          userId,
          preferences
        },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
      throw this.handleError(error);
    }
  }

  private handleError(error: any): Error {
    if (error.response) {
      const message = error.response.data?.message || 'Notification operation failed';
      return new Error(message);
    } else if (error.request) {
      return new Error('Network error. Please check your connection.');
    } else {
      return new Error('An unexpected error occurred');
    }
  }
}

export const pushNotificationService = new PushNotificationService();
