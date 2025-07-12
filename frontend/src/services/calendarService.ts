import axios, { AxiosResponse } from 'axios';
import { UserRole, AppointmentStatus } from '@/types';
import { Appointment } from '@/types/appointment';
import { ServiceFactory } from './apiService';
import { FEATURE_FLAGS } from '@/config/api';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5002/api';

export interface TimeSlot {
  id: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  isAvailable: boolean;
  isBooked: boolean;
  appointmentId?: number;
}

export interface CalendarDay {
  date: string; // YYYY-MM-DD format
  timeSlots: TimeSlot[];
  isAvailable: boolean;
}

export interface AvailabilitySettings {
  workingDays: number[]; // 0-6 (Sunday-Saturday)
  workingHours: {
    start: string; // HH:MM format
    end: string; // HH:MM format
  };
  slotDuration: number; // in minutes
  breakTime: number; // in minutes between slots
  bufferTime: number; // in minutes before/after appointments
}

export interface CreateAvailabilityRequest {
  date: string; // YYYY-MM-DD
  timeSlots: {
    startTime: string; // HH:MM
    endTime: string; // HH:MM
  }[];
}

export interface CreateAppointmentRequest {
  providerId: number;
  serviceIds: number[];
  scheduledStartTime: string; // ISO string
  notes?: string;
}

export interface UpdateAvailabilityRequest {
  availabilityId: number;
  isAvailable: boolean;
}

class CalendarService {
  private baseURL: string;

  constructor() {
    this.baseURL = `${API_BASE_URL}/appointments`;
  }

  // Get available time slots for a provider on a specific date
  async getAvailableTimeSlots(
    token: string,
    providerId: number,
    date: string,
    serviceIds?: number[]
  ): Promise<TimeSlot[]> {
    return await ServiceFactory.executeWithFallback(
      FEATURE_FLAGS.USE_REAL_CALENDAR_API,
      () => this.getAvailableTimeSlotsReal(token, providerId, date, serviceIds),
      () => this.getAvailableTimeSlotsMock(providerId, date, serviceIds)
    );
  }

  private async getAvailableTimeSlotsReal(
    token: string,
    providerId: number,
    date: string,
    serviceIds?: number[]
  ): Promise<TimeSlot[]> {
    try {
      console.log('🌐 getAvailableTimeSlotsReal called:', {
        providerId,
        date,
        serviceIds,
        endpoint: `/appointments/available-slots`,
        hasToken: !!token
      });

      const apiService = ServiceFactory.getApiService();
      const params: any = {
        ProviderId: providerId,
        Date: date,
      };
      
      if (serviceIds && serviceIds.length > 0) {
        params.ServiceIds = serviceIds;
      }

      const response = await apiService.get<TimeSlot[]>(
        `/appointments/available-slots`,
        {
          params,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('✅ getAvailableTimeSlotsReal response:', {
        slotsCount: response?.length || 0
      });

      return response || [];
    } catch (error) {
      console.error('❌ getAvailableTimeSlotsReal error:', error);
      throw this.handleError(error);
    }
  }

  private async getAvailableTimeSlotsMock(
    providerId: number,
    date: string,
    serviceIds?: number[]
  ): Promise<TimeSlot[]> {
    // Simulate API delay
    await ServiceFactory.getApiService().simulateMockDelay();
    
    console.log('📝 Mock time slots generated for provider:', providerId, 'on date:', date);
    
    // Generate mock time slots for the day
    const slots: TimeSlot[] = [];
    const startTime = new Date(date + 'T09:00:00');
    const endTime = new Date(date + 'T17:00:00');
    
    while (startTime < endTime) {
      const slotEnd = new Date(startTime);
      slotEnd.setHours(slotEnd.getHours() + 1);
      
      if (slotEnd > endTime) break;
      
      const isPast = slotEnd <= new Date();
      const isBooked = Math.random() < 0.3; // 30% chance of being booked
      
      slots.push({
        id: `${date}-${startTime.getHours()}-${startTime.getMinutes()}`,
        startTime: startTime.toISOString(),
        endTime: slotEnd.toISOString(),
        isAvailable: !isPast && !isBooked,
        isBooked,
      });
      
      startTime.setHours(startTime.getHours() + 1);
    }
    
    return slots;
  }

  // Get provider's calendar for a specific month
  async getProviderCalendar(
    token: string, 
    providerId: number, 
    year: number, 
    month: number
  ): Promise<CalendarDay[]> {
    console.log('🗓️ calendarService.getProviderCalendar called with feature flag:', FEATURE_FLAGS.USE_REAL_CALENDAR_API);
    return await ServiceFactory.executeWithFallback(
      FEATURE_FLAGS.USE_REAL_CALENDAR_API,
      () => this.getProviderCalendarReal(token, providerId, year, month),
      () => this.getMockProviderCalendar(providerId, year, month)
    );
  }

  private async getProviderCalendarReal(
    token: string, 
    providerId: number, 
    year: number, 
    month: number
  ): Promise<CalendarDay[]> {
    try {
      console.log('🌐 getProviderCalendarReal called:', {
        providerId,
        year,
        month,
        endpoint: `/calendar/provider/${providerId}/${year}/${month}`,
        hasToken: !!token
      });

      const apiService = ServiceFactory.getApiService();
      const response = await apiService.get<{ calendar: CalendarDay[] }>(
        `/calendar/provider/${providerId}/${year}/${month}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('✅ getProviderCalendarReal response:', {
        calendarDays: response.calendar?.length || 0
      });

      return response.calendar;
    } catch (error) {
      console.error('❌ getProviderCalendarReal error:', error);
      throw this.handleError(error);
    }
  }

  // Get provider's appointments for a date range
  async getProviderAppointments(
    token: string,
    providerId: number,
    startDate: string,
    endDate: string
  ): Promise<Appointment[]> {
    console.log('📅 calendarService.getProviderAppointments called with feature flag:', FEATURE_FLAGS.USE_REAL_APPOINTMENT_API);
    return await ServiceFactory.executeWithFallback(
      FEATURE_FLAGS.USE_REAL_APPOINTMENT_API,
      () => this.getProviderAppointmentsReal(token, providerId, startDate, endDate),
      () => this.getMockProviderAppointments(providerId, startDate, endDate)
    );
  }

  private async getProviderAppointmentsReal(
    token: string,
    providerId: number,
    startDate: string,
    endDate: string
  ): Promise<Appointment[]> {
    try {
      console.log('🌐 getProviderAppointmentsReal called:', {
        providerId,
        startDate,
        endDate,
        endpoint: `/appointments`,
        hasToken: !!token
      });

      const apiService = ServiceFactory.getApiService();
      const response = await apiService.get<{ appointments: Appointment[]; total: number; hasMore: boolean }>(
        `/appointments`,
        {
          params: { 
            page: 1, 
            limit: 100, // Get all appointments for the date range
            // Note: Backend doesn't seem to support date filtering in the current implementation
            // May need to filter client-side or enhance backend
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('✅ getProviderAppointmentsReal response:', {
        appointmentCount: response.appointments?.length || 0,
        total: response.total
      });

      // Filter appointments by date range (client-side filtering for now)
      const filteredAppointments = response.appointments?.filter(apt => {
        const aptDate = new Date(apt.scheduledStartTime).toISOString().split('T')[0];
        return aptDate >= startDate && aptDate <= endDate;
      }) || [];

      return filteredAppointments;
    } catch (error) {
      console.error('❌ getProviderAppointmentsReal error:', error);
      throw this.handleError(error);
    }
  }

  // Create a new appointment
  async createAppointment(
    token: string,
    request: CreateAppointmentRequest
  ): Promise<Appointment> {
    return await ServiceFactory.executeWithFallback(
      FEATURE_FLAGS.USE_REAL_APPOINTMENT_API,
      () => this.createAppointmentReal(token, request),
      () => this.createAppointmentMock(token, request)
    );
  }

  private async createAppointmentReal(
    token: string,
    request: CreateAppointmentRequest
  ): Promise<Appointment> {
    try {
      console.log('🌐 createAppointmentReal called:', {
        providerId: request.providerId,
        serviceIds: request.serviceIds,
        scheduledStartTime: request.scheduledStartTime,
        endpoint: `/appointments`,
        hasToken: !!token
      });

      const apiService = ServiceFactory.getApiService();
      
      // Convert frontend request to backend DTO format
      const backendRequest = {
        ProviderId: request.providerId,
        ServiceIds: request.serviceIds,
        ScheduledStartTime: request.scheduledStartTime,
        Notes: request.notes
      };

      const response = await apiService.post<Appointment>(
        `/appointments`,
        backendRequest,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('✅ createAppointmentReal success:', {
        appointmentId: response.id,
        status: response.status
      });

      return response;
    } catch (error) {
      console.error('❌ createAppointmentReal error:', error);
      throw this.handleError(error);
    }
  }

  private async createAppointmentMock(
    token: string,
    request: CreateAppointmentRequest
  ): Promise<Appointment> {
    // Simulate API delay
    await ServiceFactory.getApiService().simulateMockDelay();
    
    console.log('📝 Mock appointment created:', request);
    
    // Return mock appointment
    return {
      id: Math.floor(Math.random() * 1000),
      clientId: 563, // Current user ID from logs
      providerId: request.providerId,
      scheduledStartTime: request.scheduledStartTime,
      scheduledEndTime: new Date(new Date(request.scheduledStartTime).getTime() + 60 * 60 * 1000).toISOString(),
      status: AppointmentStatus.CONFIRMED,
      notes: request.notes || 'Mock appointment',
      totalPrice: 100,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      services: [],
      client: {
        id: 563,
        fullName: 'Fernando Martinez',
        email: 'nando81k@gmail.com',
        phoneNumber: '(555) 123-4567',
        role: UserRole.CLIENT,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };
  }

  // Create availability slots for a provider
  async createAvailability(
    token: string,
    providerId: number,
    request: CreateAvailabilityRequest
  ): Promise<void> {
    console.log('🕒 calendarService.createAvailability called with feature flag:', FEATURE_FLAGS.USE_REAL_CALENDAR_API);
    return await ServiceFactory.executeWithFallback(
      FEATURE_FLAGS.USE_REAL_CALENDAR_API,
      () => this.createAvailabilityReal(token, providerId, request),
      () => this.createAvailabilityMock(token, providerId, request)
    );
  }

  private async createAvailabilityReal(
    token: string,
    providerId: number,
    request: CreateAvailabilityRequest
  ): Promise<void> {
    try {
      console.log('🌐 createAvailabilityReal called:', {
        providerId,
        date: request.date,
        slotsCount: request.timeSlots?.length || 0,
        endpoint: `/calendar/provider/${providerId}/availability`,
        hasToken: !!token
      });

      const apiService = ServiceFactory.getApiService();
      await apiService.post(
        `/calendar/provider/${providerId}/availability`,
        request,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('✅ createAvailabilityReal success');
    } catch (error) {
      console.error('❌ createAvailabilityReal error:', error);
      throw this.handleError(error);
    }
  }

  private async createAvailabilityMock(
    token: string,
    providerId: number,
    request: CreateAvailabilityRequest
  ): Promise<void> {
    // Simulate API delay
    await ServiceFactory.getApiService().simulateMockDelay();
    console.log('📝 Mock availability created for provider:', providerId, 'on date:', request.date);
  }

  // Update appointment status
  async updateAppointmentStatus(
    token: string,
    appointmentId: number,
    status: AppointmentStatus
  ): Promise<Appointment> {
    console.log('📝 calendarService.updateAppointmentStatus called with feature flag:', FEATURE_FLAGS.USE_REAL_APPOINTMENT_API);
    return await ServiceFactory.executeWithFallback(
      FEATURE_FLAGS.USE_REAL_APPOINTMENT_API,
      () => this.updateAppointmentStatusReal(token, appointmentId, status),
      () => this.updateAppointmentStatusMock(token, appointmentId, status)
    );
  }

  private async updateAppointmentStatusReal(
    token: string,
    appointmentId: number,
    status: AppointmentStatus
  ): Promise<Appointment> {
    try {
      console.log('🌐 updateAppointmentStatusReal called:', {
        appointmentId,
        status,
        endpoint: `/appointments/${appointmentId}`,
        hasToken: !!token
      });

      const apiService = ServiceFactory.getApiService();
      
      // Use the backend's update appointment endpoint
      const response = await apiService.put<Appointment>(
        `/appointments/${appointmentId}`,
        { Status: status }, // Backend expects Pascal case
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('✅ updateAppointmentStatusReal success:', {
        appointmentId: response.id,
        newStatus: response.status
      });

      return response;
    } catch (error) {
      console.error('❌ updateAppointmentStatusReal error:', error);
      throw this.handleError(error);
    }
  }

  private async updateAppointmentStatusMock(
    token: string,
    appointmentId: number,
    status: AppointmentStatus
  ): Promise<Appointment> {
    // Simulate API delay
    await ServiceFactory.getApiService().simulateMockDelay();
    
    console.log('📝 Mock appointment status updated:', { appointmentId, status });
    
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
      client: {
        id: 1,
        fullName: 'Mock Client',
        email: 'mock@example.com',
        phoneNumber: '(555) 123-4567',
        role: UserRole.CLIENT,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };
  }

  // Generate time slots based on availability settings
  generateTimeSlots(
    date: string,
    settings: AvailabilitySettings,
    existingAppointments: Appointment[] = []
  ): TimeSlot[] {
    const dayOfWeek = new Date(date).getDay();
    
    // Check if day is in working days
    if (!settings.workingDays.includes(dayOfWeek)) {
      return [];
    }

    const slots: TimeSlot[] = [];
    const [startHour, startMinute] = settings.workingHours.start.split(':').map(Number);
    const [endHour, endMinute] = settings.workingHours.end.split(':').map(Number);
    
    const startTime = new Date(date);
    startTime.setHours(startHour, startMinute, 0, 0);
    
    const endTime = new Date(date);
    endTime.setHours(endHour, endMinute, 0, 0);
    
    const currentTime = new Date(startTime);
    
    while (currentTime < endTime) {
      const slotEnd = new Date(currentTime);
      slotEnd.setMinutes(slotEnd.getMinutes() + settings.slotDuration);
      
      if (slotEnd > endTime) break;
      
      // Check if slot conflicts with existing appointments
      const isBooked = existingAppointments.some(appointment => {
        const appointmentStart = new Date(appointment.scheduledStartTime);
        const appointmentEnd = new Date(appointment.scheduledEndTime);
        
        return (
          (currentTime >= appointmentStart && currentTime < appointmentEnd) ||
          (slotEnd > appointmentStart && slotEnd <= appointmentEnd) ||
          (currentTime <= appointmentStart && slotEnd >= appointmentEnd)
        );
      });
      
      // Check if slot is in the past
      const now = new Date();
      const isPast = slotEnd <= now;
      
      slots.push({
        id: `${date}-${currentTime.getHours()}-${currentTime.getMinutes()}`,
        startTime: currentTime.toISOString(),
        endTime: slotEnd.toISOString(),
        isAvailable: !isPast && !isBooked,
        isBooked,
        appointmentId: isBooked ? existingAppointments.find(apt => {
          const appointmentStart = new Date(apt.scheduledStartTime);
          return currentTime.getTime() === appointmentStart.getTime();
        })?.id : undefined,
      });
      
      // Move to next slot with break time
      currentTime.setMinutes(currentTime.getMinutes() + settings.slotDuration + settings.breakTime);
    }
    
    return slots;
  }

  // Mock functions for demo purposes
  async getMockProviderCalendar(
    providerId: number,
    year: number,
    month: number
  ): Promise<CalendarDay[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const calendar: CalendarDay[] = [];
    const daysInMonth = new Date(year, month, 0).getDate();
    
    const defaultSettings: AvailabilitySettings = {
      workingDays: [1, 2, 3, 4, 5], // Monday to Friday
      workingHours: { start: '09:00', end: '17:00' },
      slotDuration: 60, // 1 hour slots
      breakTime: 0,
      bufferTime: 15,
    };
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const timeSlots = this.generateTimeSlots(date, defaultSettings, []);
      
      calendar.push({
        date,
        timeSlots,
        isAvailable: timeSlots.some(slot => slot.isAvailable),
      });
    }
    
    return calendar;
  }

  async getMockProviderAppointments(
    providerId: number,
    startDate: string,
    endDate: string
  ): Promise<Appointment[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Mock appointments
    const mockAppointments: Appointment[] = [
      {
        id: 1,
        clientId: 1,
        providerId,
        scheduledStartTime: new Date().toISOString(),
        scheduledEndTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour later
        status: AppointmentStatus.CONFIRMED,
        notes: 'Regular checkup',
        totalPrice: 100,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        services: [
          {
            id: 1,
            appointmentId: 1,
            serviceId: 1,
            priceAtBooking: 100,
            service: {
              id: 1,
              providerId,
              name: 'Consultation',
              description: 'Initial consultation',
              price: 100,
              estimatedDurationMinutes: 60,
              isActive: true,
              createdAt: new Date().toISOString(),
            },
          },
        ],
        client: {
          id: 1,
          fullName: 'John Doe',
          email: 'john@example.com',
          phoneNumber: '(555) 123-4567',
          role: UserRole.CLIENT,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
    ];
    
    return mockAppointments.filter(apt => {
      const aptDate = new Date(apt.scheduledStartTime).toISOString().split('T')[0];
      return aptDate >= startDate && aptDate <= endDate;
    });
  }

  private handleError(error: any): Error {
    if (error.response) {
      const message = error.response.data?.message || 'Calendar operation failed';
      return new Error(message);
    } else if (error.request) {
      return new Error('Network error. Please check your connection.');
    } else {
      return new Error('An unexpected error occurred');
    }
  }

  // Utility functions
  formatTime(date: string): string {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  isToday(date: string): boolean {
    const today = new Date().toISOString().split('T')[0];
    return date === today;
  }

  isSameWeek(date1: string, date2: string): boolean {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    
    const firstDayOfWeek1 = new Date(d1);
    firstDayOfWeek1.setDate(d1.getDate() - d1.getDay());
    
    const firstDayOfWeek2 = new Date(d2);
    firstDayOfWeek2.setDate(d2.getDate() - d2.getDay());
    
    return firstDayOfWeek1.getTime() === firstDayOfWeek2.getTime();
  }
}

export const calendarService = new CalendarService();
