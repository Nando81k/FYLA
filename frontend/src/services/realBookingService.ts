import { ServiceFactory } from './apiService';

// Booking interfaces
export interface BookingTimeSlot {
  id: string;
  startTime: string; // HH:MM format
  endTime: string;   // HH:MM format
  date: string;      // YYYY-MM-DD format
  isAvailable: boolean;
  providerId: number;
  reason?: string;   // Reason if not available
}

export interface BookingRequest {
  id?: string;
  clientId: number;
  providerId: number;
  serviceIds: number[];
  scheduledStartTime: string; // ISO string
  totalPrice?: number;
  totalDuration?: number; // in minutes
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
}

export interface BookingResponse {
  id: string;
  clientId: number;
  providerId: number;
  scheduledStartTime: string;
  scheduledEndTime: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  totalPrice: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // Navigation properties
  client?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  provider?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  services: {
    id: number;
    serviceId: number;
    priceAtBooking: number;
    service: {
      id: number;
      name: string;
      description?: string;
      duration: number;
      price: number;
    };
  }[];
  // Computed properties for compatibility
  timeSlot: BookingTimeSlot;
  totalDuration: number;
  clientName: string;
  providerName: string;
  serviceNames: string[];
}

export interface AvailabilityRequest {
  providerId: number;
  date: string; // YYYY-MM-DD format
  serviceIds?: number[];
}

export interface AvailabilityResponse {
  date: string;
  providerId: number;
  slots: BookingTimeSlot[];
}

export class ComprehensiveBookingService {
  private apiService = ServiceFactory.getApiService();

  /**
   * Get available time slots for a provider on a specific date
   * Takes into account existing bookings and service duration
   */
  async getAvailableSlots(request: AvailabilityRequest): Promise<AvailabilityResponse> {
    try {
      const params = new URLSearchParams({
        providerId: request.providerId.toString(),
        date: request.date,
      });

      // Add serviceIds if provided
      if (request.serviceIds && request.serviceIds.length > 0) {
        params.append('serviceIds', request.serviceIds.join(','));
      }

      const response = await this.apiService.get<BookingTimeSlot[]>(`/api/appointments/time-slots?${params}`);
      
      // Transform API response to match our interface
      const slots: BookingTimeSlot[] = response.map((slot: any) => ({
        id: `${request.date}-${slot.startTime}`,
        startTime: slot.startTime,
        endTime: slot.endTime,
        date: request.date,
        isAvailable: slot.isAvailable,
        providerId: request.providerId,
        reason: slot.reason,
      }));

      return {
        date: request.date,
        providerId: request.providerId,
        slots,
      };
    } catch (error) {
      console.error('Error fetching available slots:', error);
      throw new Error('Failed to fetch available time slots');
    }
  }

  /**
   * Create a new booking request
   */
  async createBooking(booking: BookingRequest): Promise<BookingResponse> {
    try {
      const requestData = {
        providerId: booking.providerId,
        serviceIds: booking.serviceIds,
        scheduledStartTime: booking.scheduledStartTime,
        notes: booking.notes,
      };

      const response = await this.apiService.post<any>(`/api/appointments`, requestData);
      return this.transformAppointmentToBookingResponse(response);
    } catch (error) {
      console.error('Error creating booking:', error);
      throw new Error('Failed to create booking');
    }
  }

  /**
   * Confirm a pending booking (provider action)
   */
  async confirmBooking(bookingId: string): Promise<BookingResponse> {
    try {
      const response = await this.apiService.patch<any>(`/api/appointments/${bookingId}`, { 
        status: 'confirmed' 
      });
      return this.transformAppointmentToBookingResponse(response);
    } catch (error) {
      console.error('Error confirming booking:', error);
      throw new Error('Failed to confirm booking');
    }
  }

  /**
   * Cancel a booking
   */
  async cancelBooking(bookingId: string, reason?: string): Promise<BookingResponse> {
    try {
      const response = await this.apiService.patch<any>(`/api/appointments/${bookingId}`, { 
        status: 'cancelled',
        notes: reason 
      });
      return this.transformAppointmentToBookingResponse(response);
    } catch (error) {
      console.error('Error cancelling booking:', error);
      throw new Error('Failed to cancel booking');
    }
  }

  /**
   * Get bookings for a provider (provider dashboard)
   */
  async getProviderBookings(providerId: number, status?: string): Promise<BookingResponse[]> {
    try {
      const params = new URLSearchParams();
      if (status) {
        params.append('status', status);
      }
      
      const response = await this.apiService.get<any>(`/api/appointments?${params}`);
      
      // Filter by provider ID (API returns all appointments for authenticated user)
      const appointments = response.appointments || response;
      const providerAppointments = appointments.filter((apt: any) => apt.providerId === providerId);
      
      return providerAppointments.map((apt: any) => this.transformAppointmentToBookingResponse(apt));
    } catch (error) {
      console.error('Error fetching provider bookings:', error);
      throw new Error('Failed to fetch provider bookings');
    }
  }

  /**
   * Get bookings for a client
   */
  async getClientBookings(clientId: number): Promise<BookingResponse[]> {
    try {
      const response = await this.apiService.get<any>(`/api/appointments`);
      
      // Filter by client ID (API returns all appointments for authenticated user)
      const appointments = response.appointments || response;
      const clientAppointments = appointments.filter((apt: any) => apt.clientId === clientId);
      
      return clientAppointments.map((apt: any) => this.transformAppointmentToBookingResponse(apt));
    } catch (error) {
      console.error('Error fetching client bookings:', error);
      throw new Error('Failed to fetch client bookings');
    }
  }

  /**
   * Transform API appointment response to BookingResponse format
   */
  private transformAppointmentToBookingResponse(appointment: any): BookingResponse {
    // Calculate duration from services
    const totalDuration = appointment.services?.reduce(
      (total: number, service: any) => total + (service.service?.duration || 0), 
      0
    ) || 60;

    // Calculate total price
    const totalPrice = appointment.services?.reduce(
      (total: number, service: any) => total + service.priceAtBooking, 
      0
    ) || appointment.totalPrice || 0;

    // Create time slot
    const startTime = new Date(appointment.scheduledStartTime);
    const endTime = new Date(appointment.scheduledEndTime);
    
    const timeSlot: BookingTimeSlot = {
      id: `${appointment.id}-slot`,
      startTime: this.formatTimeToString(startTime),
      endTime: this.formatTimeToString(endTime),
      date: startTime.toISOString().split('T')[0],
      isAvailable: false, // Booked slots are not available
      providerId: appointment.providerId,
    };

    return {
      id: appointment.id.toString(),
      clientId: appointment.clientId,
      providerId: appointment.providerId,
      scheduledStartTime: appointment.scheduledStartTime,
      scheduledEndTime: appointment.scheduledEndTime,
      status: appointment.status,
      totalPrice,
      notes: appointment.notes,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt,
      client: appointment.client,
      provider: appointment.provider,
      services: appointment.services || [],
      // Computed properties for compatibility
      timeSlot,
      totalDuration,
      clientName: appointment.client 
        ? `${appointment.client.firstName} ${appointment.client.lastName}` 
        : 'Unknown Client',
      providerName: appointment.provider 
        ? `${appointment.provider.firstName} ${appointment.provider.lastName}` 
        : 'Unknown Provider',
      serviceNames: appointment.services?.map((s: any) => s.service?.name || 'Unknown Service') || [],
    };
  }

  /**
   * Format Date to HH:MM string
   */
  private formatTimeToString(date: Date): string {
    return date.toTimeString().substring(0, 5); // HH:MM
  }

  /**
   * Check for booking conflicts
   */
  async checkBookingConflicts(request: {
    providerId: number;
    startTime: string;
    endTime: string;
    date: string;
    excludeBookingId?: string;
  }): Promise<{ hasConflicts: boolean; conflicts: BookingResponse[] }> {
    try {
      // Get all provider bookings for the date
      const allBookings = await this.getProviderBookings(request.providerId);
      
      // Filter to the specific date
      const dateBookings = allBookings.filter(booking => 
        booking.timeSlot.date === request.date &&
        booking.status !== 'cancelled' &&
        booking.id !== request.excludeBookingId
      );

      // Check for time conflicts
      const requestStart = this.timeStringToMinutes(request.startTime);
      const requestEnd = this.timeStringToMinutes(request.endTime);

      const conflicts = dateBookings.filter(booking => {
        const bookingStart = this.timeStringToMinutes(booking.timeSlot.startTime);
        const bookingEnd = this.timeStringToMinutes(booking.timeSlot.endTime);

        // Check if times overlap
        return (requestStart < bookingEnd && requestEnd > bookingStart);
      });

      return {
        hasConflicts: conflicts.length > 0,
        conflicts,
      };
    } catch (error) {
      console.error('Error checking booking conflicts:', error);
      // In case of error, assume no conflicts to prevent blocking
      return { hasConflicts: false, conflicts: [] };
    }
  }

  /**
   * Convert time string (HH:MM) to minutes since midnight
   */
  private timeStringToMinutes(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }
}

// Export singleton instance
export const comprehensiveBookingService = new ComprehensiveBookingService();
