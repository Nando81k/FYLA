import axios, { AxiosResponse } from 'axios';
import { User, UserRole } from '@/types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5002/api';

export interface UpdateProfileRequest {
  fullName?: string;
  bio?: string;
  phoneNumber?: string;
  profilePictureUrl?: string;
  locationLat?: number;
  locationLng?: number;
}

export interface ServiceProviderProfile extends UpdateProfileRequest {
  tags?: number[]; // Array of tag IDs
  businessHours?: BusinessHours;
  isAvailable?: boolean;
}

export interface BusinessHours {
  monday?: DaySchedule;
  tuesday?: DaySchedule;
  wednesday?: DaySchedule;
  thursday?: DaySchedule;
  friday?: DaySchedule;
  saturday?: DaySchedule;
  sunday?: DaySchedule;
}

export interface DaySchedule {
  isOpen: boolean;
  openTime?: string; // "09:00"
  closeTime?: string; // "17:00"
}

class UserService {
  private baseURL: string;

  constructor() {
    this.baseURL = `${API_BASE_URL}/users`;
  }

  async getProfile(token: string): Promise<User> {
    try {
      const response: AxiosResponse<User> = await axios.get(
        `${this.baseURL}/profile`,
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

  async updateProfile(token: string, profileData: UpdateProfileRequest): Promise<User> {
    try {
      const response: AxiosResponse<User> = await axios.put(
        `${this.baseURL}/profile`,
        profileData,
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

  async updateServiceProviderProfile(
    token: string, 
    profileData: ServiceProviderProfile
  ): Promise<User> {
    try {
      const response: AxiosResponse<User> = await axios.put(
        `${this.baseURL}/provider-profile`,
        profileData,
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

  async uploadProfilePicture(token: string, imageUri: string): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'profile.jpg',
      } as any);

      const response: AxiosResponse<{ url: string }> = await axios.post(
        `${this.baseURL}/upload-avatar`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data.url;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getServiceProviderTags(): Promise<Array<{ id: number; name: string }>> {
    try {
      const response: AxiosResponse<Array<{ id: number; name: string }>> = await axios.get(
        `${this.baseURL}/provider-tags`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private handleError(error: any): Error {
    if (error.response) {
      const message = error.response.data?.message || 'Request failed';
      return new Error(message);
    } else if (error.request) {
      return new Error('Network error. Please check your connection.');
    } else {
      return new Error('An unexpected error occurred');
    }
  }
}

export const userService = new UserService();
