import axios from 'axios';
import { API_CONFIG, FEATURE_FLAGS } from '@/config/api';

export interface ServiceRecommendation {
  serviceId: number;
  serviceName: string;
  providerId: number;
  providerName: string;
  providerImage?: string;
  confidence: number; // 0-1 confidence score
  reason: string;
  estimatedPrice: number;
  estimatedDuration: number;
  availableSlots: string[];
  rating: number;
  reviewCount: number;
  distance?: number;
  specialOffers?: SpecialOffer[];
}

export interface SpecialOffer {
  id: string;
  title: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  validUntil: string;
  conditions?: string;
}

export interface BookingRecommendationRequest {
  serviceCategory?: string;
  preferredDateTime?: string;
  maxPrice?: number;
  maxDistance?: number;
  preferredProviderIds?: number[];
  userLocation?: {
    latitude: number;
    longitude: number;
  };
  previousBookings?: {
    serviceId: number;
    providerId: number;
    satisfaction: number;
  }[];
}

export interface TimeSlotRecommendation {
  datetime: string;
  confidence: number;
  reason: string;
  providerAvailability: 'high' | 'medium' | 'low';
  priceMultiplier: number;
  estimatedDuration: number;
}

export interface PersonalizedBookingFlow {
  recommendedServices: ServiceRecommendation[];
  suggestedTimeSlots: TimeSlotRecommendation[];
  personalizedOffers: SpecialOffer[];
  bookingTips: string[];
  estimatedBookingTime: number;
}

class AIBookingService {
  private baseURL: string;

  constructor() {
    this.baseURL = `${API_CONFIG.baseURL}/ai-booking`;
  }

  /**
   * Get personalized service recommendations based on user preferences and history
   */
  async getServiceRecommendations(
    token: string,
    request: BookingRecommendationRequest
  ): Promise<ServiceRecommendation[]> {
    if (!FEATURE_FLAGS.USE_REAL_BOOKING_API) {
      return this.getMockServiceRecommendations(request);
    }

    try {
      const response = await axios.post(
        `${this.baseURL}/recommendations/services`,
        request,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: API_CONFIG.timeout,
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error getting service recommendations:', error);
      // Fallback to mock data if API fails
      return this.getMockServiceRecommendations(request);
    }
  }

  /**
   * Get smart time slot suggestions based on AI analysis
   */
  async getTimeSlotRecommendations(
    token: string,
    serviceId: number,
    providerId: number,
    preferredDate?: string
  ): Promise<TimeSlotRecommendation[]> {
    if (!FEATURE_FLAGS.USE_REAL_BOOKING_API) {
      return this.getMockTimeSlotRecommendations();
    }

    try {
      const response = await axios.get(
        `${this.baseURL}/recommendations/time-slots`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            serviceId,
            providerId,
            preferredDate,
          },
          timeout: API_CONFIG.timeout,
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error getting time slot recommendations:', error);
      return this.getMockTimeSlotRecommendations();
    }
  }

  /**
   * Get personalized booking flow with AI-powered suggestions
   */
  async getPersonalizedBookingFlow(
    token: string,
    request: BookingRecommendationRequest
  ): Promise<PersonalizedBookingFlow> {
    if (!FEATURE_FLAGS.USE_REAL_BOOKING_API) {
      return this.getMockPersonalizedBookingFlow(request);
    }

    try {
      const response = await axios.post(
        `${this.baseURL}/personalized-flow`,
        request,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: API_CONFIG.timeout,
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error getting personalized booking flow:', error);
      return this.getMockPersonalizedBookingFlow(request);
    }
  }

  /**
   * Get AI-optimized pricing suggestions
   */
  async getPricingOptimization(
    token: string,
    serviceId: number,
    providerId: number,
    requestedDateTime: string
  ): Promise<{
    originalPrice: number;
    optimizedPrice: number;
    savingsAmount: number;
    savingsPercentage: number;
    reason: string;
  }> {
    if (!FEATURE_FLAGS.USE_REAL_BOOKING_API) {
      return this.getMockPricingOptimization();
    }

    try {
      const response = await axios.get(
        `${this.baseURL}/pricing-optimization`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            serviceId,
            providerId,
            requestedDateTime,
          },
          timeout: API_CONFIG.timeout,
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error getting pricing optimization:', error);
      return this.getMockPricingOptimization();
    }
  }

  // Mock data methods for development and fallback
  private getMockServiceRecommendations(request: BookingRecommendationRequest): ServiceRecommendation[] {
    return [
      {
        serviceId: 1,
        serviceName: 'Premium Hair Styling',
        providerId: 101,
        providerName: 'Isabella Romano',
        providerImage: 'https://via.placeholder.com/100x100?text=IR',
        confidence: 0.95,
        reason: 'Based on your previous bookings and 5-star reviews',
        estimatedPrice: 85,
        estimatedDuration: 90,
        availableSlots: ['2025-07-12T10:00:00Z', '2025-07-12T14:30:00Z', '2025-07-13T09:00:00Z'],
        rating: 4.9,
        reviewCount: 247,
        distance: 1.2,
        specialOffers: [
          {
            id: 'offer1',
            title: '15% Off First Visit',
            description: 'Special discount for new clients',
            discountType: 'percentage',
            discountValue: 15,
            validUntil: '2025-07-31T23:59:59Z',
          }
        ],
      },
      {
        serviceId: 2,
        serviceName: 'Relaxing Massage',
        providerId: 102,
        providerName: 'Marcus Thompson',
        providerImage: 'https://via.placeholder.com/100x100?text=MT',
        confidence: 0.88,
        reason: 'Popular choice for stress relief in your area',
        estimatedPrice: 120,
        estimatedDuration: 60,
        availableSlots: ['2025-07-12T11:00:00Z', '2025-07-12T16:00:00Z'],
        rating: 4.7,
        reviewCount: 189,
        distance: 2.1,
      },
      {
        serviceId: 3,
        serviceName: 'Personal Fitness Training',
        providerId: 103,
        providerName: 'Sarah Johnson',
        providerImage: 'https://via.placeholder.com/100x100?text=SJ',
        confidence: 0.82,
        reason: 'Matches your fitness goals and schedule preferences',
        estimatedPrice: 75,
        estimatedDuration: 60,
        availableSlots: ['2025-07-12T07:00:00Z', '2025-07-12T18:00:00Z'],
        rating: 4.8,
        reviewCount: 156,
        distance: 0.8,
      },
    ];
  }

  private getMockTimeSlotRecommendations(): TimeSlotRecommendation[] {
    return [
      {
        datetime: '2025-07-12T10:00:00Z',
        confidence: 0.92,
        reason: 'Optimal time based on your schedule and provider availability',
        providerAvailability: 'high',
        priceMultiplier: 1.0,
        estimatedDuration: 90,
      },
      {
        datetime: '2025-07-12T14:30:00Z',
        confidence: 0.85,
        reason: 'Good afternoon slot with moderate demand',
        providerAvailability: 'medium',
        priceMultiplier: 1.1,
        estimatedDuration: 90,
      },
      {
        datetime: '2025-07-13T09:00:00Z',
        confidence: 0.78,
        reason: 'Early morning slot with potential savings',
        providerAvailability: 'high',
        priceMultiplier: 0.9,
        estimatedDuration: 90,
      },
    ];
  }

  private getMockPersonalizedBookingFlow(request: BookingRecommendationRequest): PersonalizedBookingFlow {
    return {
      recommendedServices: this.getMockServiceRecommendations(request),
      suggestedTimeSlots: this.getMockTimeSlotRecommendations(),
      personalizedOffers: [
        {
          id: 'combo1',
          title: 'Hair + Makeup Combo',
          description: 'Save 20% when you book both services together',
          discountType: 'percentage',
          discountValue: 20,
          validUntil: '2025-07-31T23:59:59Z',
          conditions: 'Valid for same-day bookings only',
        },
      ],
      bookingTips: [
        'Book 24 hours in advance for the best prices',
        'Morning slots typically have better availability',
        'Consider combo packages for multiple services',
      ],
      estimatedBookingTime: 3, // minutes to complete booking
    };
  }

  private getMockPricingOptimization() {
    return {
      originalPrice: 85,
      optimizedPrice: 76.50,
      savingsAmount: 8.50,
      savingsPercentage: 10,
      reason: 'Off-peak timing discount available',
    };
  }

  private handleError(error: any): never {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message;
      throw new Error(`AI Booking Service Error: ${message}`);
    }
    throw error;
  }
}

export const aiBookingService = new AIBookingService();
