import { ServiceFactory } from './apiService';
import { FEATURE_FLAGS } from '@/config/api';
import { Service, TimeSlot, Appointment, AppointmentStatus } from '@/types';

export interface CreateServiceRequest {
  name: string;
  description?: string;
  price: number;
  estimatedDurationMinutes: number;
  isActive?: boolean;
}

export interface TimeSlotRequest {
  date: string; // ISO date string
  providerId: number;
  serviceIds?: number[];
}

export interface CreateBookingRequest {
  providerId: number;
  scheduledStartTime: string; // ISO date string
  serviceIds: number[];
  notes?: string;
}

export interface ServiceListResponse {
  services: Service[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AvailableTimeSlotsResponse {
  date: string;
  providerId: number;
  providerName: string;
  timeSlots: TimeSlot[];
  services: Service[];
}

class ServiceService {
  
  // Provider Services Management
  async getProviderServices(providerId?: number): Promise<ServiceListResponse> {
    console.log('🔍 getProviderServices called with flag:', FEATURE_FLAGS.USE_REAL_PROVIDER_API);
    return await ServiceFactory.executeWithFallback(
      FEATURE_FLAGS.USE_REAL_PROVIDER_API,
      () => this.getProviderServicesReal(providerId),
      () => this.getProviderServicesMock(providerId)
    );
  }

  async createBooking(request: CreateBookingRequest): Promise<Appointment> {
    console.log('🔍 createBooking called with flag:', FEATURE_FLAGS.USE_REAL_APPOINTMENT_API);
    return await ServiceFactory.executeWithFallback(
      FEATURE_FLAGS.USE_REAL_APPOINTMENT_API,
      () => this.createBookingReal(request),
      () => this.createBookingMock(request)
    );
  }

  async getAvailableTimeSlots(request: TimeSlotRequest): Promise<AvailableTimeSlotsResponse> {
    console.log('🔍 getAvailableTimeSlots called with flag:', FEATURE_FLAGS.USE_REAL_APPOINTMENT_API);
    return await ServiceFactory.executeWithFallback(
      FEATURE_FLAGS.USE_REAL_APPOINTMENT_API,
      () => this.getAvailableTimeSlotsReal(request),
      () => this.getAvailableTimeSlotsMock(request)
    );
  }

  // REAL API METHODS
  private async getProviderServicesReal(providerId?: number): Promise<ServiceListResponse> {
    console.log('🌐 Using REAL services API');
    const apiService = ServiceFactory.getApiService();
    
    const endpoint = providerId 
      ? `/services/provider/${providerId}`
      : '/services/my-services';
    
    const response = await apiService.get<ServiceListResponse>(endpoint);
    console.log('✅ REAL services API response:', {
      servicesCount: response.services.length,
      total: response.total,
      firstService: response.services[0]?.name
    });
    
    return response;
  }

  private async createBookingReal(request: CreateBookingRequest): Promise<Appointment> {
    console.log('🌐 Creating booking via REAL API');
    const apiService = ServiceFactory.getApiService();
    return await apiService.post<Appointment>('/services/bookings', request);
  }

  private async getAvailableTimeSlotsReal(request: TimeSlotRequest): Promise<AvailableTimeSlotsResponse> {
    console.log('🌐 Getting time slots via REAL API');
    const apiService = ServiceFactory.getApiService();
    return await apiService.post<AvailableTimeSlotsResponse>('/services/time-slots', request);
  }

  // MOCK API METHODS
  private async getProviderServicesMock(providerId?: number): Promise<ServiceListResponse> {
    console.log('🎭 Using MOCK services API');
    await ServiceFactory.getApiService().simulateMockDelay();
    
    const mockServices: Service[] = [
      {
        id: 1,
        providerId: providerId || 1,
        name: 'Women\'s Haircut & Style',
        description: 'Professional haircut and styling for women. Includes wash, cut, and blow dry.',
        price: 75,
        estimatedDurationMinutes: 90,
        isActive: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 2,
        providerId: providerId || 1,
        name: 'Hair Color & Highlights',
        description: 'Full color service or highlights. Includes consultation, application, and styling.',
        price: 150,
        estimatedDurationMinutes: 180,
        isActive: true,
        createdAt: new Date().toISOString(),
      }
    ];

    return {
      services: mockServices,
      total: mockServices.length,
      page: 1,
      pageSize: 20
    };
  }

  private async createBookingMock(request: CreateBookingRequest): Promise<Appointment> {
    console.log('🎭 Creating booking via MOCK API');
    await ServiceFactory.getApiService().simulateMockDelay();
    
    const startTime = new Date(request.scheduledStartTime);
    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + 90);
    
    return {
      id: Math.floor(Math.random() * 1000),
      clientId: 1,
      providerId: request.providerId,
      clientName: 'Mock Client',
      providerName: 'Mock Provider',
      scheduledStartTime: startTime.toISOString(),
      scheduledEndTime: endTime.toISOString(),
      status: AppointmentStatus.PENDING,
      totalPrice: 100,
      notes: request.notes || '',
      services: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  private async getAvailableTimeSlotsMock(request: TimeSlotRequest): Promise<AvailableTimeSlotsResponse> {
    console.log('🎭 Getting time slots via MOCK API');
    await ServiceFactory.getApiService().simulateMockDelay();
    
    const date = new Date(request.date);
    const timeSlots: TimeSlot[] = [];
    
    // Generate mock time slots from 9 AM to 6 PM
    for (let hour = 9; hour < 18; hour++) {
      for (let minute of [0, 30]) {
        const startTime = new Date(date);
        startTime.setHours(hour, minute, 0, 0);
        const endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + 60);
        
        timeSlots.push({
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          isAvailable: Math.random() > 0.3, // 70% available
          reason: Math.random() > 0.3 ? undefined : 'Already booked',
          totalPrice: 100,
          totalDurationMinutes: 60
        });
      }
    }

    return {
      date: request.date,
      providerId: request.providerId,
      providerName: 'Mock Provider',
      timeSlots,
      services: []
    };
  }
}

export const serviceService = new ServiceService();
