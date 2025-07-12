import axios, { AxiosResponse } from 'axios';
import { BusinessHours, UpdateBusinessHoursRequest } from '@/types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5002/api';

class BusinessHoursService {
  private baseURL: string;

  constructor() {
    this.baseURL = `${API_BASE_URL}/business-hours`;
  }

  async getBusinessHours(token: string): Promise<BusinessHours[]> {
    try {
      const response: AxiosResponse<BusinessHours[]> = await axios.get(
        this.baseURL,
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

  async updateBusinessHours(
    token: string,
    businessHours: UpdateBusinessHoursRequest
  ): Promise<BusinessHours[]> {
    try {
      const response: AxiosResponse<BusinessHours[]> = await axios.put(
        this.baseURL,
        businessHours,
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

  async getProviderBusinessHours(
    token: string,
    providerId: number
  ): Promise<BusinessHours[]> {
    try {
      const response: AxiosResponse<BusinessHours[]> = await axios.get(
        `${this.baseURL}/provider/${providerId}`,
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

  private handleError(error: any): Error {
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.message || 'Business hours operation failed';
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

export const businessHoursService = new BusinessHoursService();
