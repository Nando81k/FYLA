import { FEATURE_FLAGS } from '../config/api';
import { ServiceFactory } from './apiService';
import {
  TimeSlot,
  TimeSlotAvailability,
  BookingConflict,
  TimeSlotRequest,
  TimeSlotReservation,
  AvailabilityFilter,
  SlotGenerationConfig,
  TimeSlotStats,
} from '../types/timeSlot';

export class TimeSlotService {
  private baseURL = '/time-slots';

  /**
   * Get available time slots for a provider on a specific date
   */
  async getAvailableSlots(
    providerId: number,
    date: string,
    filter?: AvailabilityFilter
  ): Promise<TimeSlotAvailability> {
    return await ServiceFactory.executeWithFallback(
      FEATURE_FLAGS.USE_REAL_BOOKING_API,
      () => this.getAvailableSlotsReal(providerId, date, filter),
      () => this.getAvailableSlotsMock(providerId, date, filter)
    );
  }

  private async getAvailableSlotsReal(
    providerId: number,
    date: string,
    filter?: AvailabilityFilter
  ): Promise<TimeSlotAvailability> {
    try {
      const apiService = ServiceFactory.getApiService();
      const params = new URLSearchParams({
        date,
        ...(filter?.serviceId && { serviceId: filter.serviceId.toString() }),
        ...(filter?.duration && { duration: filter.duration.toString() }),
        ...(filter?.minPrice && { minPrice: filter.minPrice.toString() }),
        ...(filter?.maxPrice && { maxPrice: filter.maxPrice.toString() }),
        ...(filter?.timePreference && { timePreference: filter.timePreference }),
      });

      return await apiService.get<TimeSlotAvailability>(
        `${this.baseURL}/providers/${providerId}/availability?${params}`
      );
    } catch (error) {
      throw new Error('Failed to fetch available time slots');
    }
  }

  private async getAvailableSlotsMock(
    providerId: number,
    date: string,
    filter?: AvailabilityFilter
  ): Promise<TimeSlotAvailability> {
    await ServiceFactory.getApiService().simulateMockDelay();

    // Generate mock time slots for the day
    const slots = this.generateMockTimeSlots(providerId, date, filter);

    return {
      date,
      providerId,
      slots,
      businessHours: {
        startTime: '09:00',
        endTime: '18:00',
        isOpen: true,
      },
      breaks: [
        {
          startTime: '12:00',
          endTime: '13:00',
          reason: 'Lunch Break',
        },
      ],
    };
  }

  /**
   * Check for booking conflicts before making a reservation
   */
  async checkBookingConflicts(request: TimeSlotRequest): Promise<BookingConflict[]> {
    return await ServiceFactory.executeWithFallback(
      FEATURE_FLAGS.USE_REAL_BOOKING_API,
      () => this.checkBookingConflictsReal(request),
      () => this.checkBookingConflictsMock(request)
    );
  }

  private async checkBookingConflictsReal(request: TimeSlotRequest): Promise<BookingConflict[]> {
    try {
      const apiService = ServiceFactory.getApiService();
      return await apiService.post<BookingConflict[]>(
        `${this.baseURL}/check-conflicts`,
        request
      );
    } catch (error) {
      throw new Error('Failed to check booking conflicts');
    }
  }

  private async checkBookingConflictsMock(request: TimeSlotRequest): Promise<BookingConflict[]> {
    await ServiceFactory.getApiService().simulateMockDelay();

    const conflicts: BookingConflict[] = [];
    const requestedTime = new Date(request.requestedStartTime);
    const hour = requestedTime.getHours();

    // Mock conflict scenarios
    if (hour === 12) {
      conflicts.push({
        type: 'break_time',
        message: 'This time slot conflicts with the lunch break (12:00-13:00)',
        suggestedAlternatives: this.generateAlternativeSlots(request),
      });
    }

    if (hour === 14 && requestedTime.getMinutes() === 30) {
      conflicts.push({
        type: 'already_booked',
        message: 'This time slot is already booked by another client',
        suggestedAlternatives: this.generateAlternativeSlots(request),
      });
    }

    if (hour < 9 || hour >= 18) {
      conflicts.push({
        type: 'business_hours',
        message: 'This time is outside business hours (9:00 AM - 6:00 PM)',
        suggestedAlternatives: this.generateAlternativeSlots(request),
      });
    }

    return conflicts;
  }

  /**
   * Reserve a time slot temporarily (holds for limited time)
   */
  async reserveTimeSlot(request: TimeSlotRequest): Promise<TimeSlotReservation> {
    return await ServiceFactory.executeWithFallback(
      FEATURE_FLAGS.USE_REAL_BOOKING_API,
      () => this.reserveTimeSlotReal(request),
      () => this.reserveTimeSlotMock(request)
    );
  }

  private async reserveTimeSlotReal(request: TimeSlotRequest): Promise<TimeSlotReservation> {
    try {
      const apiService = ServiceFactory.getApiService();
      return await apiService.post<TimeSlotReservation>(
        `${this.baseURL}/reserve`,
        request
      );
    } catch (error) {
      throw new Error('Failed to reserve time slot');
    }
  }

  private async reserveTimeSlotMock(request: TimeSlotRequest): Promise<TimeSlotReservation> {
    await ServiceFactory.getApiService().simulateMockDelay();

    const startTime = new Date(request.requestedStartTime);
    const endTime = new Date(startTime.getTime() + request.duration * 60000);

    return {
      id: `reservation_${Date.now()}`,
      timeSlotId: `slot_${Date.now()}`,
      clientId: request.clientId,
      providerId: request.providerId,
      serviceId: request.serviceId,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      status: 'pending',
      reservedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 15 * 60000).toISOString(), // 15 minutes
    };
  }

  /**
   * Confirm a reserved time slot (convert to actual booking)
   */
  async confirmReservation(reservationId: string): Promise<{ success: boolean; bookingId?: string }> {
    console.log('🎯 confirmReservation called - ALWAYS using REAL API');
    return await this.confirmReservationReal(reservationId);
  }

  private async confirmReservationReal(reservationId: string): Promise<{ success: boolean; bookingId?: string }> {
    try {
      const apiService = ServiceFactory.getApiService();
      return await apiService.post<{ success: boolean; bookingId?: string }>(
        `${this.baseURL}/reservations/${reservationId}/confirm`,
        {}
      );
    } catch (error) {
      throw new Error('Failed to confirm reservation');
    }
  }

  private async confirmReservationMock(reservationId: string): Promise<{ success: boolean; bookingId?: string }> {
    await ServiceFactory.getApiService().simulateMockDelay();

    return {
      success: true,
      bookingId: `booking_${Date.now()}`,
    };
  }

  /**
   * Cancel a reservation
   */
  async cancelReservation(reservationId: string): Promise<{ success: boolean }> {
    return await ServiceFactory.executeWithFallback(
      FEATURE_FLAGS.USE_REAL_BOOKING_API,
      () => this.cancelReservationReal(reservationId),
      () => this.cancelReservationMock(reservationId)
    );
  }

  private async cancelReservationReal(reservationId: string): Promise<{ success: boolean }> {
    try {
      const apiService = ServiceFactory.getApiService();
      return await apiService.delete<{ success: boolean }>(
        `${this.baseURL}/reservations/${reservationId}`
      );
    } catch (error) {
      throw new Error('Failed to cancel reservation');
    }
  }

  private async cancelReservationMock(reservationId: string): Promise<{ success: boolean }> {
    await ServiceFactory.getApiService().simulateMockDelay();
    return { success: true };
  }

  /**
   * Generate time slots for a provider on a specific date
   */
  async generateTimeSlots(config: SlotGenerationConfig): Promise<TimeSlot[]> {
    return await ServiceFactory.executeWithFallback(
      FEATURE_FLAGS.USE_REAL_BOOKING_API,
      () => this.generateTimeSlotsReal(config),
      () => this.generateTimeSlotsMock(config)
    );
  }

  private async generateTimeSlotsReal(config: SlotGenerationConfig): Promise<TimeSlot[]> {
    try {
      const apiService = ServiceFactory.getApiService();
      return await apiService.post<TimeSlot[]>(
        `${this.baseURL}/generate`,
        config
      );
    } catch (error) {
      throw new Error('Failed to generate time slots');
    }
  }

  private async generateTimeSlotsMock(config: SlotGenerationConfig): Promise<TimeSlot[]> {
    await ServiceFactory.getApiService().simulateMockDelay();
    return this.generateMockTimeSlots(config.providerId, config.date);
  }

  /**
   * Get time slot statistics for a provider
   */
  async getTimeSlotStats(
    providerId: number,
    startDate: string,
    endDate: string
  ): Promise<TimeSlotStats> {
    return await ServiceFactory.executeWithFallback(
      FEATURE_FLAGS.USE_REAL_BOOKING_API,
      () => this.getTimeSlotStatsReal(providerId, startDate, endDate),
      () => this.getTimeSlotStatsMock(providerId, startDate, endDate)
    );
  }

  private async getTimeSlotStatsReal(
    providerId: number,
    startDate: string,
    endDate: string
  ): Promise<TimeSlotStats> {
    try {
      const apiService = ServiceFactory.getApiService();
      const params = new URLSearchParams({ startDate, endDate });
      return await apiService.get<TimeSlotStats>(
        `${this.baseURL}/providers/${providerId}/stats?${params}`
      );
    } catch (error) {
      throw new Error('Failed to fetch time slot statistics');
    }
  }

  private async getTimeSlotStatsMock(
    providerId: number,
    startDate: string,
    endDate: string
  ): Promise<TimeSlotStats> {
    await ServiceFactory.getApiService().simulateMockDelay();

    return {
      totalSlots: 80,
      availableSlots: 32,
      bookedSlots: 40,
      blockedSlots: 8,
      utilizationRate: 60, // (booked / (total - blocked)) * 100
      peakHours: ['10:00', '14:00', '16:00'],
      revenue: 3200,
    };
  }

  /**
   * Helper method to generate mock time slots
   */
  private generateMockTimeSlots(
    providerId: number,
    date: string,
    filter?: AvailabilityFilter
  ): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const baseDate = new Date(date);
    
    // Generate slots from 9 AM to 6 PM with 30-minute intervals
    for (let hour = 9; hour < 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const startTime = new Date(baseDate);
        startTime.setHours(hour, minute, 0, 0);
        
        const endTime = new Date(startTime);
        endTime.setMinutes(startTime.getMinutes() + 30);

        const slotId = `slot_${providerId}_${startTime.getTime()}`;
        
        // Mock some slots as booked or blocked
        const isLunchTime = hour === 12;
        const isPopularTime = hour === 14 && minute === 30;
        const isMaintenanceTime = hour === 17 && minute === 30;

        slots.push({
          id: slotId,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          isAvailable: !isLunchTime && !isPopularTime && !isMaintenanceTime,
          isBlocked: isLunchTime || isMaintenanceTime,
          blockReason: isLunchTime ? 'Lunch Break' : isMaintenanceTime ? 'Cleaning' : undefined,
          bookingId: isPopularTime ? 'booking_123' : undefined,
          providerId,
          duration: 30,
          price: 50,
        });
      }
    }

    return slots;
  }

  /**
   * Helper method to generate alternative time slots
   */
  private generateAlternativeSlots(request: TimeSlotRequest): TimeSlot[] {
    const alternatives: TimeSlot[] = [];
    const requestedTime = new Date(request.requestedStartTime);
    
    // Generate 3 alternative slots: 1 hour before, 1 hour after, next day same time
    for (let i = 0; i < 3; i++) {
      const altTime = new Date(requestedTime);
      
      if (i === 0) {
        altTime.setHours(altTime.getHours() - 1); // 1 hour before
      } else if (i === 1) {
        altTime.setHours(altTime.getHours() + 1); // 1 hour after
      } else {
        altTime.setDate(altTime.getDate() + 1); // Next day
      }

      const endTime = new Date(altTime.getTime() + request.duration * 60000);

      alternatives.push({
        id: `alt_slot_${i}_${altTime.getTime()}`,
        startTime: altTime.toISOString(),
        endTime: endTime.toISOString(),
        isAvailable: true,
        isBlocked: false,
        providerId: request.providerId,
        serviceId: request.serviceId,
        duration: request.duration,
        price: 50,
      });
    }

    return alternatives;
  }
}

// Export singleton instance
export const timeSlotService = new TimeSlotService();
