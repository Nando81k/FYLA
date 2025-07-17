import axios, { AxiosResponse } from 'axios';
import { ServiceFactory } from './apiService';
import { FEATURE_FLAGS, API_ENDPOINTS } from '@/config/api';
import { 
  Appointment, 
  CreateAppointmentRequest, 
  TimeSlot, 
  AvailabilityRequest,
  AppointmentStatus,
  UpdateAppointmentRequest
} from '@/types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5002/api';

export interface AppointmentListResponse {
  appointments: Appointment[];
  total: number;
  hasMore: boolean;
}

class AppointmentService {
  private baseURL: string;

  constructor() {
    this.baseURL = `${API_BASE_URL}/appointments`;
  }

  // Get available time slots with backend integration
  async getAvailableTimeSlots(
    providerId: number,
    date: Date,
    serviceIds: number[]
  ): Promise<TimeSlot[]> {
    console.log('📅 getAvailableTimeSlots called - ALWAYS using REAL API');
    return await this.getAvailableTimeSlotsReal(providerId, date, serviceIds);
  }

  private async getAvailableTimeSlotsReal(
    providerId: number,
    date: Date,
    serviceIds: number[]
  ): Promise<TimeSlot[]> {
    try {
      const apiService = ServiceFactory.getApiService();
      const response = await apiService.get<TimeSlot[]>(API_ENDPOINTS.APPOINTMENTS.TIME_SLOTS, {
        params: {
          providerId,
          date: date.toISOString().split('T')[0], // YYYY-MM-DD format
          serviceIds: serviceIds.join(',')
        }
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Create appointment with backend integration
  async createAppointment(appointmentData: CreateAppointmentRequest): Promise<Appointment> {
    console.log('📅 createAppointment called - ALWAYS using REAL API');
    return await this.createAppointmentReal(appointmentData);
  }

  private async createAppointmentReal(appointmentData: CreateAppointmentRequest): Promise<Appointment> {
    try {
      const apiService = ServiceFactory.getApiService();
      const response = await apiService.post<Appointment>(
        API_ENDPOINTS.APPOINTMENTS.CREATE,
        appointmentData
      );
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get appointments list with backend integration
  async getAppointments(
    page: number = 1,
    limit: number = 20,
    status?: string
  ): Promise<AppointmentListResponse> {
    console.log('📅 getAppointments called - ALWAYS using REAL API');
    return await this.getAppointmentsReal(page, limit, status);
  }

  private async getAppointmentsReal(
    page: number,
    limit: number,
    status?: string
  ): Promise<AppointmentListResponse> {
    try {
      const apiService = ServiceFactory.getApiService();
      const response = await apiService.get<AppointmentListResponse>(
        API_ENDPOINTS.APPOINTMENTS.LIST,
        {
          params: { page, limit, status }
        }
      );
      // Map Notes to notes for each appointment
      if (response.appointments) {
        response.appointments = response.appointments.map(appt => ({
          ...appt,
          notes: appt.notes || appt.Notes || '',
        }));
      }
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Update appointment with backend integration
  async updateAppointment(
    appointmentId: number,
    updateData: UpdateAppointmentRequest
  ): Promise<Appointment> {
    return await ServiceFactory.executeWithFallback(
      FEATURE_FLAGS.USE_REAL_APPOINTMENT_API,
      () => this.updateAppointmentReal(appointmentId, updateData),
      () => this.updateMockAppointment(appointmentId, updateData)
    );
  }

  private async updateAppointmentReal(
    appointmentId: number,
    updateData: UpdateAppointmentRequest
  ): Promise<Appointment> {
    try {
      const apiService = ServiceFactory.getApiService();
      const response = await apiService.put<Appointment>(
        API_ENDPOINTS.APPOINTMENTS.UPDATE(appointmentId),
        updateData
      );
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Cancel appointment with backend integration
  async cancelAppointment(appointmentId: number): Promise<boolean> {
    return await ServiceFactory.executeWithFallback(
      FEATURE_FLAGS.USE_REAL_APPOINTMENT_API,
      () => this.cancelAppointmentReal(appointmentId),
      () => this.cancelMockAppointment(appointmentId)
    );
  }

  private async cancelAppointmentReal(appointmentId: number): Promise<boolean> {
    try {
      const apiService = ServiceFactory.getApiService();
      await apiService.delete(API_ENDPOINTS.APPOINTMENTS.CANCEL(appointmentId));
      return true;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get single appointment with backend integration
  async getAppointmentById(appointmentId: number): Promise<Appointment> {
    return await ServiceFactory.executeWithFallback(
      FEATURE_FLAGS.USE_REAL_APPOINTMENT_API,
      () => this.getAppointmentByIdReal(appointmentId),
      () => this.getMockAppointmentById(appointmentId)
    );
  }

  private async getAppointmentByIdReal(appointmentId: number): Promise<Appointment> {
    try {
      const apiService = ServiceFactory.getApiService();
      const response = await apiService.get<Appointment>(
        API_ENDPOINTS.APPOINTMENTS.GET(appointmentId)
      );
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Add appointment status update methods
  async updateAppointmentStatus(appointmentId: number, status: AppointmentStatus): Promise<Appointment> {
    return await ServiceFactory.executeWithFallback(
      FEATURE_FLAGS.USE_REAL_APPOINTMENT_API,
      () => this.updateAppointmentStatusReal(appointmentId, status),
      () => this.updateAppointmentStatusMock(appointmentId, status)
    );
  }

  private async updateAppointmentStatusReal(appointmentId: number, status: AppointmentStatus): Promise<Appointment> {
    try {
      const apiService = ServiceFactory.getApiService();
      let endpoint: string;
      
      // Use specific endpoints for different status updates
      switch (status) {
        case AppointmentStatus.CONFIRMED:
          endpoint = API_ENDPOINTS.APPOINTMENTS.CONFIRM(appointmentId);
          break;
        case AppointmentStatus.CANCELLED:
          endpoint = API_ENDPOINTS.APPOINTMENTS.CANCEL(appointmentId);
          break;
        case AppointmentStatus.COMPLETED:
          endpoint = API_ENDPOINTS.APPOINTMENTS.COMPLETE(appointmentId);
          break;
        case AppointmentStatus.NO_SHOW:
          endpoint = API_ENDPOINTS.APPOINTMENTS.NO_SHOW(appointmentId);
          break;
        default:
          // For other statuses, use the general update endpoint
          endpoint = API_ENDPOINTS.APPOINTMENTS.UPDATE(appointmentId);
          return await apiService.put<Appointment>(endpoint, { status });
      }

      return await apiService.patch<Appointment>(endpoint);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private async updateAppointmentStatusMock(appointmentId: number, status: AppointmentStatus): Promise<Appointment> {
    // Simulate API delay
    await ServiceFactory.getApiService().simulateMockDelay();
    
    console.log('Mock appointment status updated:', { appointmentId, status });
    
    // Return mock updated appointment
    return {
      id: appointmentId,
      clientId: 1,
      providerId: 1,
      scheduledStartTime: new Date().toISOString(),
      scheduledEndTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      status,
      notes: 'Mock appointment',
      totalPrice: 100,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      services: [],
    };
  }

  // Convenience methods for common appointment status updates
  async confirmAppointment(appointmentId: number): Promise<Appointment> {
    return this.updateAppointmentStatus(appointmentId, AppointmentStatus.CONFIRMED);
  }

  async completeAppointment(appointmentId: number): Promise<Appointment> {
    return this.updateAppointmentStatus(appointmentId, AppointmentStatus.COMPLETED);
  }

  async markAppointmentNoShow(appointmentId: number): Promise<Appointment> {
    return this.updateAppointmentStatus(appointmentId, AppointmentStatus.NO_SHOW);
  }

  async cancelAppointmentStatus(appointmentId: number): Promise<Appointment> {
    return this.updateAppointmentStatus(appointmentId, AppointmentStatus.CANCELLED);
  }

  // Mock functions for development
  async getMockAvailableTimeSlots(
    providerId: number,
    date: string
  ): Promise<TimeSlot[]> {
    // Simulate API delay
    await ServiceFactory.getApiService().simulateMockDelay();
    
    const mockSlots: TimeSlot[] = [];
    const startHour = 9; // 9 AM
    const endHour = 17; // 5 PM
    const slotDuration = 60; // 60 minutes
    
    for (let hour = startHour; hour < endHour; hour++) {
      // Skip lunch hour (12 PM)
      if (hour === 12) continue;
      
      const startTime = `${hour.toString().padStart(2, '0')}:00`;
      const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
      
      mockSlots.push({
        startTime,
        endTime,
        isAvailable: Math.random() > 0.3, // 70% availability
      });
    }
    
    return mockSlots;
  }

  async createMockAppointment(
    appointmentData: CreateAppointmentRequest
  ): Promise<Appointment> {
    // Simulate API delay
    await ServiceFactory.getApiService().simulateMockDelay();

    // Mock appointment response
    const mockAppointment: Appointment = {
      id: Math.floor(Math.random() * 1000) + 1,
      clientId: 1, // Mock client ID
      providerId: appointmentData.providerId,
      status: AppointmentStatus.CONFIRMED,
      scheduledStartTime: appointmentData.scheduledStartTime,
      scheduledEndTime: new Date(new Date(appointmentData.scheduledStartTime).getTime() + 60 * 60 * 1000).toISOString(), // 1 hour later
      totalPrice: 50.0, // Mock price
      notes: appointmentData.notes,
      services: appointmentData.serviceIds.map((serviceId, index) => ({
        appointmentId: Math.floor(Math.random() * 1000) + 1,
        serviceId,
        priceAtBooking: 50.0,
        service: {
          id: serviceId,
          providerId: appointmentData.providerId,
          name: `Service ${serviceId}`,
          description: `Description for service ${serviceId}`,
          price: 50.0,
          estimatedDurationMinutes: 60,
          isActive: true,
          createdAt: new Date().toISOString(),
        }
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log('Mock appointment created:', mockAppointment);
    return mockAppointment;
  }

  async getMockAppointments(
    page: number = 1,
    limit: number = 20,
    status?: string
  ): Promise<AppointmentListResponse> {
    // Simulate API delay
    await ServiceFactory.getApiService().simulateMockDelay();

    // Mock appointments data
    const mockAppointments: Appointment[] = [
      {
        id: 1,
        clientId: 1,
        providerId: 2,
        status: AppointmentStatus.CONFIRMED,
        scheduledStartTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        scheduledEndTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(), // Tomorrow + 1 hour
        totalPrice: 75.0,
        notes: 'Regular appointment',
        services: [{
          appointmentId: 1,
          serviceId: 1,
          priceAtBooking: 75.0,
          service: {
            id: 1,
            providerId: 2,
            name: 'Haircut',
            description: 'Professional haircut service',
            price: 75.0,
            estimatedDurationMinutes: 60,
            isActive: true,
            createdAt: new Date().toISOString(),
          }
        }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 2,
        clientId: 1,
        providerId: 3,
        status: AppointmentStatus.PENDING,
        scheduledStartTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // Day after tomorrow
        scheduledEndTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(), // Day after tomorrow + 2 hours
        totalPrice: 120.0,
        notes: 'Combo service',
        services: [
          {
            appointmentId: 2,
            serviceId: 2,
            priceAtBooking: 60.0,
            service: {
              id: 2,
              providerId: 3,
              name: 'Massage',
              description: 'Relaxing massage service',
              price: 60.0,
              estimatedDurationMinutes: 60,
              isActive: true,
              createdAt: new Date().toISOString(),
            }
          },
          {
            appointmentId: 2,
            serviceId: 3,
            priceAtBooking: 60.0,
            service: {
              id: 3,
              providerId: 3,
              name: 'Facial',
              description: 'Rejuvenating facial treatment',
              price: 60.0,
              estimatedDurationMinutes: 60,
              isActive: true,
              createdAt: new Date().toISOString(),
            }
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 3,
        clientId: 1,
        providerId: 2,
        status: AppointmentStatus.COMPLETED,
        scheduledStartTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
        scheduledEndTime: new Date(Date.now() - 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(), // Yesterday + 1 hour
        totalPrice: 75.0,
        notes: 'Completed service',
        services: [{
          appointmentId: 3,
          serviceId: 1,
          priceAtBooking: 75.0,
          service: {
            id: 1,
            providerId: 2,
            name: 'Haircut',
            description: 'Professional haircut service',
            price: 75.0,
            estimatedDurationMinutes: 60,
            isActive: true,
            createdAt: new Date().toISOString(),
          }
        }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    // Filter by status if provided
    let filteredAppointments = status 
      ? mockAppointments.filter(apt => apt.status === status)
      : mockAppointments;

    // Simulate pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedAppointments = filteredAppointments.slice(startIndex, endIndex);

    return {
      appointments: paginatedAppointments,
      total: filteredAppointments.length,
      hasMore: endIndex < filteredAppointments.length,
    };
  }

  async updateMockAppointment(
    appointmentId: number,
    updateData: UpdateAppointmentRequest
  ): Promise<Appointment> {
    // Simulate API delay
    await ServiceFactory.getApiService().simulateMockDelay();

    // Create a mock updated appointment
    const mockAppointment: Appointment = {
      id: appointmentId,
      clientId: 1,
      providerId: 2,
      scheduledStartTime: updateData.scheduledStartTime || new Date().toISOString(),
      scheduledEndTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      status: updateData.status || AppointmentStatus.CONFIRMED,
      totalPrice: 75.0,
      notes: updateData.notes || 'Updated appointment',
      services: [{
        appointmentId: appointmentId,
        serviceId: 1,
        priceAtBooking: 75.0,
        service: {
          id: 1,
          providerId: 2,
          name: 'Updated Service',
          description: 'Updated service description',
          price: 75.0,
          estimatedDurationMinutes: 60,
          isActive: true,
          createdAt: new Date().toISOString(),
        }
      }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log('Mock appointment updated:', mockAppointment);
    return mockAppointment;
  }

  async cancelMockAppointment(appointmentId: number): Promise<boolean> {
    // Simulate API delay
    await ServiceFactory.getApiService().simulateMockDelay();
    
    console.log('Mock appointment cancelled:', appointmentId);
    return true;
  }

  async getMockAppointmentById(appointmentId: number): Promise<Appointment> {
    // Simulate API delay
    await ServiceFactory.getApiService().simulateMockDelay();

    // Return a mock appointment
    const mockAppointment: Appointment = {
      id: appointmentId,
      clientId: 1,
      providerId: 2,
      scheduledStartTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      scheduledEndTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
      status: AppointmentStatus.CONFIRMED,
      totalPrice: 75.0,
      notes: 'Mock appointment details',
      services: [{
        appointmentId: appointmentId,
        serviceId: 1,
        priceAtBooking: 75.0,
        service: {
          id: 1,
          providerId: 2,
          name: 'Haircut',
          description: 'Professional haircut service',
          price: 75.0,
          estimatedDurationMinutes: 60,
          isActive: true,
          createdAt: new Date().toISOString(),
        }
      }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log('Mock appointment retrieved by ID:', mockAppointment);
    return mockAppointment;
  }

  private handleError(error: any): Error {
    if (error.response) {
      const message = error.response.data?.message || 'Appointment operation failed';
      return new Error(message);
    } else if (error.request) {
      return new Error('Network error. Please check your connection.');
    } else {
      return new Error('An unexpected error occurred');
    }
  }
}

export const appointmentService = new AppointmentService();
