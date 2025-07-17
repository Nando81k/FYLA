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

      const response = await this.apiService.get<BookingTimeSlot[]>(`/appointments/time-slots?${params}`);
      
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
        ProviderId: booking.providerId,
        ServiceIds: booking.serviceIds,
        ScheduledStartTime: booking.scheduledStartTime,
        Notes: booking.notes || '',
      };

      console.log('🔍 Creating booking with data:', {
        ProviderId: requestData.ProviderId,
        ServiceIds: requestData.ServiceIds,
        ScheduledStartTime: requestData.ScheduledStartTime,
        scheduledStartTimeType: typeof requestData.ScheduledStartTime,
        Notes: requestData.Notes,
      });

      const response = await this.apiService.post<any>(`/appointments`, requestData);
      return this.transformAppointmentToBookingResponse(response);
    } catch (error: any) {
      console.error('Error creating booking:', error);
      
      // Extract specific error message from API response
      if (error?.response?.data?.errorMessage) {
        throw new Error(error.response.data.errorMessage);
      } else if (error?.message) {
        throw new Error(error.message);
      }
      
      throw new Error('Failed to create booking');
    }
  }

  /**
   * Confirm a pending booking (provider action)
   */
  async confirmBooking(bookingId: string, notes?: string): Promise<BookingResponse> {
    try {
      const requestData = { 
        Status: 1, // Confirmed enum value
        Notes: notes 
      };
      
      console.log('Confirming booking with data:', requestData);
      
      const response = await this.apiService.put<any>(`/appointments/${bookingId}`, requestData);
      
      console.log('Booking confirmation response:', response);
      
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
      const requestData = { 
        Status: 2, // Cancelled enum value
        Notes: reason 
      };
      
      console.log('Cancelling booking with data:', requestData);
      
      const response = await this.apiService.put<any>(`/appointments/${bookingId}`, requestData);
      
      console.log('Booking cancellation response:', response);
      
      return this.transformAppointmentToBookingResponse(response);
    } catch (error) {
      console.error('Error cancelling booking:', error);
      throw new Error('Failed to cancel booking');
    }
  }

  /**
   * Update appointment with notes and/or status
   */
  async updateAppointment(bookingId: string, updates: { status?: string, notes?: string }): Promise<BookingResponse> {
    try {
      const updateData: any = {};
      
      if (updates.status) {
        // Map string status to enum value
        const statusMap: { [key: string]: number } = {
          'pending': 0,
          'confirmed': 1,
          'cancelled': 2,
          'completed': 3,
          'noshow': 4
        };
        updateData.Status = statusMap[updates.status.toLowerCase()] ?? 0;
      }
      
      if (updates.notes) {
        updateData.Notes = updates.notes;
      }

      const response = await this.apiService.put<any>(`/appointments/${bookingId}`, updateData);
      return this.transformAppointmentToBookingResponse(response);
    } catch (error) {
      console.error('Error updating appointment:', error);
      throw new Error('Failed to update appointment');
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
      
      const response = await this.apiService.get<any>(`/appointments?${params}`);
      
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
      const response = await this.apiService.get<any>(`/appointments`);
      
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

    // Handle status conversion (enum to lowercase string)
    const statusMapping: { [key: number]: string } = {
      0: 'pending',
      1: 'confirmed', 
      2: 'cancelled',
      3: 'completed'
    };
    
    const status = typeof appointment.status === 'number' 
      ? statusMapping[appointment.status] || 'pending'
      : appointment.status?.toLowerCase() || 'pending';

    // Transform client and provider objects for compatibility
    const client = appointment.client ? {
      id: appointment.client.id,
      firstName: appointment.client.fullName?.split(' ')[0] || '',
      lastName: appointment.client.fullName?.split(' ').slice(1).join(' ') || '',
      email: appointment.client.email || '',
    } : undefined;

    const provider = appointment.provider ? {
      id: appointment.provider.id,
      firstName: appointment.provider.fullName?.split(' ')[0] || '',
      lastName: appointment.provider.fullName?.split(' ').slice(1).join(' ') || '',
      email: appointment.provider.email || '',
    } : undefined;

    return {
      id: appointment.id.toString(),
      clientId: appointment.clientId,
      providerId: appointment.providerId,
      scheduledStartTime: appointment.scheduledStartTime,
      scheduledEndTime: appointment.scheduledEndTime,
      status: status as 'pending' | 'confirmed' | 'cancelled' | 'completed',
      totalPrice,
      notes: appointment.notes,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt,
      client,
      provider,
      services: appointment.services || [],
      // Computed properties for compatibility
      timeSlot,
      totalDuration,
      clientName: appointment.client?.fullName || 'Unknown Client',
      providerName: appointment.provider?.fullName || 'Unknown Provider',
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

  /**
   * Convert time slot to ISO datetime string
   */
  static convertTimeSlotToISOString(timeSlot: BookingTimeSlot): string {
    // Parse the date (YYYY-MM-DD) and time (HH:MM)
    const [year, month, day] = timeSlot.date.split('-').map(Number);
    const [hours, minutes] = timeSlot.startTime.split(':').map(Number);
    
    // Create a date object (month is 0-indexed in Date constructor)
    const dateTime = new Date(year, month - 1, day, hours, minutes);
    
    // Return ISO string
    return dateTime.toISOString();
  }

  /**
   * Create a booking from a selected time slot
   */
  async createBookingFromTimeSlot(params: {
    timeSlot: BookingTimeSlot;
    clientId: number;
    serviceIds: number[];
    notes?: string;
  }): Promise<BookingResponse> {
    const scheduledStartTime = ComprehensiveBookingService.convertTimeSlotToISOString(params.timeSlot);
    
    const booking: BookingRequest = {
      clientId: params.clientId,
      providerId: params.timeSlot.providerId,
      serviceIds: params.serviceIds,
      scheduledStartTime,
      notes: params.notes,
    };

    console.log('🔍 Creating booking from time slot:', {
      originalTimeSlot: params.timeSlot,
      convertedISOString: scheduledStartTime,
      booking,
    });

    return this.createBooking(booking);
  }
}

// Export singleton instance
export const comprehensiveBookingService = new ComprehensiveBookingService();
