import { ServiceFactory } from './apiService';
import { FEATURE_FLAGS, API_ENDPOINTS } from '@/config/api';
import {
  Booking,
  BookingRequest,
  BookingResponse,
  BookingFilter,
  BookingStats,
  BookingStatus,
  BookingType,
  PaymentStatus,
  BookingActionResponse,
  AvailabilityQuery,
  AvailabilityResponse,
  TimeSlot,
  BookingCalendar,
  WaitlistEntry,
  WaitlistStatus,
  BookingPackage,
  ServiceDetails,
  AvailabilityRule,
  AvailabilityOverride,
  RecurrenceConfig,
  PackageConfig,
  BookingValidation,
  PriceBreakdown,
  ReminderRecord,
  CalendarEvent,
} from '@/types/booking';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5002/api';

class AdvancedBookingService {
  private baseURL: string;

  constructor() {
    this.baseURL = `${API_BASE_URL}/bookings`;
  }

  // ========================================
  // BOOKING CRUD OPERATIONS
  // ========================================

  /**
   * Create a new booking (single, recurring, or package)
   */
  async createBooking(bookingRequest: BookingRequest): Promise<BookingActionResponse> {
    return await ServiceFactory.executeWithFallback(
      FEATURE_FLAGS.USE_REAL_BOOKING_API,
      () => this.createBookingReal(bookingRequest),
      () => this.createBookingMock(bookingRequest)
    );
  }

  private async createBookingReal(bookingRequest: BookingRequest): Promise<BookingActionResponse> {
    try {
      const apiService = ServiceFactory.getApiService();
      return await apiService.post<BookingActionResponse>(
        `${this.baseURL}/create`,
        bookingRequest
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get bookings with advanced filtering and pagination
   */
  async getBookings(filter: BookingFilter): Promise<BookingResponse> {
    return await ServiceFactory.executeWithFallback(
      FEATURE_FLAGS.USE_REAL_BOOKING_API,
      () => this.getBookingsReal(filter),
      () => this.getBookingsMock(filter)
    );
  }

  private async getBookingsReal(filter: BookingFilter): Promise<BookingResponse> {
    try {
      const apiService = ServiceFactory.getApiService();
      return await apiService.get<BookingResponse>(`${this.baseURL}`, {
        params: filter
      });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get a specific booking by ID
   */
  async getBookingById(bookingId: string): Promise<Booking> {
    return await ServiceFactory.executeWithFallback(
      FEATURE_FLAGS.USE_REAL_BOOKING_API,
      () => this.getBookingByIdReal(bookingId),
      () => this.getBookingByIdMock(bookingId)
    );
  }

  private async getBookingByIdReal(bookingId: string): Promise<Booking> {
    try {
      const apiService = ServiceFactory.getApiService();
      return await apiService.get<Booking>(`${this.baseURL}/${bookingId}`);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update booking status (confirm, cancel, reschedule, etc.)
   */
  async updateBookingStatus(
    bookingId: string, 
    status: BookingStatus, 
    reason?: string
  ): Promise<BookingActionResponse> {
    return await ServiceFactory.executeWithFallback(
      FEATURE_FLAGS.USE_REAL_BOOKING_API,
      () => this.updateBookingStatusReal(bookingId, status, reason),
      () => this.updateBookingStatusMock(bookingId, status, reason)
    );
  }

  private async updateBookingStatusReal(
    bookingId: string, 
    status: BookingStatus, 
    reason?: string
  ): Promise<BookingActionResponse> {
    try {
      const apiService = ServiceFactory.getApiService();
      return await apiService.patch<BookingActionResponse>(
        `${this.baseURL}/${bookingId}/status`,
        { status, reason }
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Reschedule a booking to a new date/time
   */
  async rescheduleBooking(
    bookingId: string, 
    newDateTime: string
  ): Promise<BookingActionResponse> {
    return await ServiceFactory.executeWithFallback(
      FEATURE_FLAGS.USE_REAL_BOOKING_API,
      () => this.rescheduleBookingReal(bookingId, newDateTime),
      () => this.rescheduleBookingMock(bookingId, newDateTime)
    );
  }

  private async rescheduleBookingReal(
    bookingId: string, 
    newDateTime: string
  ): Promise<BookingActionResponse> {
    try {
      const apiService = ServiceFactory.getApiService();
      return await apiService.patch<BookingActionResponse>(
        `${this.baseURL}/${bookingId}/reschedule`,
        { newDateTime }
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ========================================
  // AVAILABILITY & CALENDAR MANAGEMENT
  // ========================================

  /**
   * Get provider availability for date range
   */
  async getAvailability(query: AvailabilityQuery): Promise<AvailabilityResponse> {
    return await ServiceFactory.executeWithFallback(
      FEATURE_FLAGS.USE_REAL_BOOKING_API,
      () => this.getAvailabilityReal(query),
      () => this.getAvailabilityMock(query)
    );
  }

  private async getAvailabilityReal(query: AvailabilityQuery): Promise<AvailabilityResponse> {
    try {
      const apiService = ServiceFactory.getApiService();
      return await apiService.get<AvailabilityResponse>(
        `${this.baseURL}/availability`,
        { params: query }
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get provider calendar view for a specific month
   */
  async getCalendarView(
    providerId: number, 
    year: number, 
    month: number
  ): Promise<BookingCalendar[]> {
    return await ServiceFactory.executeWithFallback(
      FEATURE_FLAGS.USE_REAL_BOOKING_API,
      () => this.getCalendarViewReal(providerId, year, month),
      () => this.getCalendarViewMock(providerId, year, month)
    );
  }

  private async getCalendarViewReal(
    providerId: number, 
    year: number, 
    month: number
  ): Promise<BookingCalendar[]> {
    try {
      const apiService = ServiceFactory.getApiService();
      return await apiService.get<BookingCalendar[]>(
        `${this.baseURL}/calendar/${providerId}`,
        { params: { year, month } }
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Set provider availability rules
   */
  async setAvailabilityRules(
    providerId: number, 
    rules: AvailabilityRule[]
  ): Promise<AvailabilityRule[]> {
    return await ServiceFactory.executeWithFallback(
      FEATURE_FLAGS.USE_REAL_BOOKING_API,
      () => this.setAvailabilityRulesReal(providerId, rules),
      () => this.setAvailabilityRulesMock(providerId, rules)
    );
  }

  private async setAvailabilityRulesReal(
    providerId: number, 
    rules: AvailabilityRule[]
  ): Promise<AvailabilityRule[]> {
    try {
      const apiService = ServiceFactory.getApiService();
      return await apiService.post<AvailabilityRule[]>(
        `${this.baseURL}/availability/rules/${providerId}`,
        { rules }
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Set availability override for specific date
   */
  async setAvailabilityOverride(
    override: AvailabilityOverride
  ): Promise<AvailabilityOverride> {
    return await ServiceFactory.executeWithFallback(
      FEATURE_FLAGS.USE_REAL_BOOKING_API,
      () => this.setAvailabilityOverrideReal(override),
      () => this.setAvailabilityOverrideMock(override)
    );
  }

  private async setAvailabilityOverrideReal(
    override: AvailabilityOverride
  ): Promise<AvailabilityOverride> {
    try {
      const apiService = ServiceFactory.getApiService();
      return await apiService.post<AvailabilityOverride>(
        `${this.baseURL}/availability/override`,
        override
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ========================================
  // BOOKING VALIDATION & PRICING
  // ========================================

  /**
   * Validate booking request before creation
   */
  async validateBooking(bookingRequest: BookingRequest): Promise<BookingValidation> {
    return await ServiceFactory.executeWithFallback(
      FEATURE_FLAGS.USE_REAL_BOOKING_API,
      () => this.validateBookingReal(bookingRequest),
      () => this.validateBookingMock(bookingRequest)
    );
  }

  private async validateBookingReal(bookingRequest: BookingRequest): Promise<BookingValidation> {
    try {
      const apiService = ServiceFactory.getApiService();
      return await apiService.post<BookingValidation>(
        `${this.baseURL}/validate`,
        bookingRequest
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Calculate pricing for booking request
   */
  async calculatePricing(bookingRequest: BookingRequest): Promise<PriceBreakdown> {
    return await ServiceFactory.executeWithFallback(
      FEATURE_FLAGS.USE_REAL_BOOKING_API,
      () => this.calculatePricingReal(bookingRequest),
      () => this.calculatePricingMock(bookingRequest)
    );
  }

  private async calculatePricingReal(bookingRequest: BookingRequest): Promise<PriceBreakdown> {
    try {
      const apiService = ServiceFactory.getApiService();
      return await apiService.post<PriceBreakdown>(
        `${this.baseURL}/pricing`,
        bookingRequest
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ========================================
  // WAITLIST MANAGEMENT
  // ========================================

  /**
   * Add client to waitlist for a time slot
   */
  async addToWaitlist(
    clientId: number,
    providerId: number,
    serviceIds: string[],
    preferredDateTime?: string,
    preferredDateRange?: { startDate: string; endDate: string },
    preferredTimeSlots?: string[]
  ): Promise<WaitlistEntry> {
    return await ServiceFactory.executeWithFallback(
      FEATURE_FLAGS.USE_REAL_BOOKING_API,
      () => this.addToWaitlistReal(clientId, providerId, serviceIds, preferredDateTime, preferredDateRange, preferredTimeSlots),
      () => this.addToWaitlistMock(clientId, providerId, serviceIds, preferredDateTime, preferredDateRange, preferredTimeSlots)
    );
  }

  private async addToWaitlistReal(
    clientId: number,
    providerId: number,
    serviceIds: string[],
    preferredDateTime?: string,
    preferredDateRange?: { startDate: string; endDate: string },
    preferredTimeSlots?: string[]
  ): Promise<WaitlistEntry> {
    try {
      const apiService = ServiceFactory.getApiService();
      return await apiService.post<WaitlistEntry>(
        `${this.baseURL}/waitlist`,
        {
          clientId,
          providerId,
          serviceIds,
          preferredDateTime,
          preferredDateRange,
          preferredTimeSlots
        }
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get waitlist entries for a client or provider
   */
  async getWaitlistEntries(
    clientId?: number,
    providerId?: number,
    status?: WaitlistStatus
  ): Promise<WaitlistEntry[]> {
    return await ServiceFactory.executeWithFallback(
      FEATURE_FLAGS.USE_REAL_BOOKING_API,
      () => this.getWaitlistEntriesReal(clientId, providerId, status),
      () => this.getWaitlistEntriesMock(clientId, providerId, status)
    );
  }

  private async getWaitlistEntriesReal(
    clientId?: number,
    providerId?: number,
    status?: WaitlistStatus
  ): Promise<WaitlistEntry[]> {
    try {
      const apiService = ServiceFactory.getApiService();
      return await apiService.get<WaitlistEntry[]>(
        `${this.baseURL}/waitlist`,
        { params: { clientId, providerId, status } }
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Remove from waitlist
   */
  async removeFromWaitlist(waitlistId: string): Promise<BookingActionResponse> {
    return await ServiceFactory.executeWithFallback(
      FEATURE_FLAGS.USE_REAL_BOOKING_API,
      () => this.removeFromWaitlistReal(waitlistId),
      () => this.removeFromWaitlistMock(waitlistId)
    );
  }

  private async removeFromWaitlistReal(waitlistId: string): Promise<BookingActionResponse> {
    try {
      const apiService = ServiceFactory.getApiService();
      return await apiService.delete<BookingActionResponse>(
        `${this.baseURL}/waitlist/${waitlistId}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ========================================
  // PACKAGE BOOKINGS
  // ========================================

  /**
   * Get available booking packages
   */
  async getBookingPackages(providerId: number): Promise<BookingPackage[]> {
    return await ServiceFactory.executeWithFallback(
      FEATURE_FLAGS.USE_REAL_BOOKING_API,
      () => this.getBookingPackagesReal(providerId),
      () => this.getBookingPackagesMock(providerId)
    );
  }

  private async getBookingPackagesReal(providerId: number): Promise<BookingPackage[]> {
    try {
      const apiService = ServiceFactory.getApiService();
      return await apiService.get<BookingPackage[]>(
        `${this.baseURL}/packages/${providerId}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Purchase a booking package
   */
  async purchasePackage(
    clientId: number,
    packageId: string,
    paymentMethod: string
  ): Promise<BookingActionResponse> {
    return await ServiceFactory.executeWithFallback(
      FEATURE_FLAGS.USE_REAL_BOOKING_API,
      () => this.purchasePackageReal(clientId, packageId, paymentMethod),
      () => this.purchasePackageMock(clientId, packageId, paymentMethod)
    );
  }

  private async purchasePackageReal(
    clientId: number,
    packageId: string,
    paymentMethod: string
  ): Promise<BookingActionResponse> {
    try {
      const apiService = ServiceFactory.getApiService();
      return await apiService.post<BookingActionResponse>(
        `${this.baseURL}/packages/purchase`,
        { clientId, packageId, paymentMethod }
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Create a new booking package (provider only)
   */
  async createBookingPackage(packageData: Omit<BookingPackage, 'id' | 'createdAt'>): Promise<BookingPackage> {
    return await ServiceFactory.executeWithFallback(
      FEATURE_FLAGS.USE_REAL_BOOKING_API,
      () => this.createBookingPackageReal(packageData),
      () => this.createBookingPackageMock(packageData)
    );
  }

  private async createBookingPackageReal(packageData: Omit<BookingPackage, 'id' | 'createdAt'>): Promise<BookingPackage> {
    try {
      const apiService = ServiceFactory.getApiService();
      return await apiService.post<BookingPackage>(
        `${this.baseURL}/packages`,
        packageData
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private async createBookingPackageMock(packageData: Omit<BookingPackage, 'id' | 'createdAt'>): Promise<BookingPackage> {
    const newPackage: BookingPackage = {
      ...packageData,
      id: `pkg_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    return newPackage;
  }

  /**
   * Update a booking package (provider only)
   */
  async updateBookingPackage(packageId: string, updates: Partial<BookingPackage>): Promise<BookingPackage> {
    return await ServiceFactory.executeWithFallback(
      FEATURE_FLAGS.USE_REAL_BOOKING_API,
      () => this.updateBookingPackageReal(packageId, updates),
      () => this.updateBookingPackageMock(packageId, updates)
    );
  }

  private async updateBookingPackageReal(packageId: string, updates: Partial<BookingPackage>): Promise<BookingPackage> {
    try {
      const apiService = ServiceFactory.getApiService();
      return await apiService.put<BookingPackage>(
        `${this.baseURL}/packages/${packageId}`,
        updates
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private async updateBookingPackageMock(packageId: string, updates: Partial<BookingPackage>): Promise<BookingPackage> {
    // Mock implementation - would need state management for real data persistence
    const mockPackage: BookingPackage = {
      id: packageId,
      providerId: 1,
      name: 'Updated Package',
      description: 'Updated package description',
      serviceIds: [],
      totalSessions: 10,
      validityDays: 90,
      price: 500,
      discountPercentage: 15,
      isTransferrable: false,
      terms: 'Updated terms',
      isActive: true,
      createdAt: new Date().toISOString(),
      ...updates,
    };
    return mockPackage;
  }

  /**
   * Delete a booking package (provider only)
   */
  async deleteBookingPackage(packageId: string): Promise<BookingActionResponse> {
    return await ServiceFactory.executeWithFallback(
      FEATURE_FLAGS.USE_REAL_BOOKING_API,
      () => this.deleteBookingPackageReal(packageId),
      () => this.deleteBookingPackageMock(packageId)
    );
  }

  private async deleteBookingPackageReal(packageId: string): Promise<BookingActionResponse> {
    try {
      const apiService = ServiceFactory.getApiService();
      return await apiService.delete<BookingActionResponse>(
        `${this.baseURL}/packages/${packageId}`
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private async deleteBookingPackageMock(packageId: string): Promise<BookingActionResponse> {
    return {
      success: true,
      message: `Package ${packageId} deleted successfully`,
    };
  }

  // ========================================
  // RECURRING BOOKINGS
  // ========================================

  /**
   * Create recurring booking series
   */
  async createRecurringBooking(
    bookingRequest: BookingRequest,
    recurrenceConfig: RecurrenceConfig
  ): Promise<BookingActionResponse> {
    return await ServiceFactory.executeWithFallback(
      FEATURE_FLAGS.USE_REAL_BOOKING_API,
      () => this.createRecurringBookingReal(bookingRequest, recurrenceConfig),
      () => this.createRecurringBookingMock(bookingRequest, recurrenceConfig)
    );
  }

  private async createRecurringBookingReal(
    bookingRequest: BookingRequest,
    recurrenceConfig: RecurrenceConfig
  ): Promise<BookingActionResponse> {
    try {
      const apiService = ServiceFactory.getApiService();
      return await apiService.post<BookingActionResponse>(
        `${this.baseURL}/recurring`,
        { ...bookingRequest, recurrenceConfig }
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get recurring booking series
   */
  async getRecurringBookings(
    parentBookingId?: string,
    clientId?: number,
    providerId?: number
  ): Promise<Booking[]> {
    return await ServiceFactory.executeWithFallback(
      FEATURE_FLAGS.USE_REAL_BOOKING_API,
      () => this.getRecurringBookingsReal(parentBookingId, clientId, providerId),
      () => this.getRecurringBookingsMock(parentBookingId, clientId, providerId)
    );
  }

  private async getRecurringBookingsReal(
    parentBookingId?: string,
    clientId?: number,
    providerId?: number
  ): Promise<Booking[]> {
    try {
      const apiService = ServiceFactory.getApiService();
      return await apiService.get<Booking[]>(
        `${this.baseURL}/recurring`,
        { params: { parentBookingId, clientId, providerId } }
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Cancel recurring booking series
   */
  async cancelRecurringBookings(
    parentBookingId: string,
    cancelFutureOnly: boolean = true,
    reason?: string
  ): Promise<BookingActionResponse> {
    return await ServiceFactory.executeWithFallback(
      FEATURE_FLAGS.USE_REAL_BOOKING_API,
      () => this.cancelRecurringBookingsReal(parentBookingId, cancelFutureOnly, reason),
      () => this.cancelRecurringBookingsMock(parentBookingId, cancelFutureOnly, reason)
    );
  }

  private async cancelRecurringBookingsReal(
    parentBookingId: string,
    cancelFutureOnly: boolean,
    reason?: string
  ): Promise<BookingActionResponse> {
    try {
      const apiService = ServiceFactory.getApiService();
      return await apiService.patch<BookingActionResponse>(
        `${this.baseURL}/recurring/${parentBookingId}/cancel`,
        { cancelFutureOnly, reason }
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ========================================
  // ANALYTICS & REPORTING
  // ========================================

  /**
   * Get booking statistics for provider
   */
  async getBookingStats(
    providerId: number,
    dateFrom: string,
    dateTo: string
  ): Promise<BookingStats> {
    return await ServiceFactory.executeWithFallback(
      FEATURE_FLAGS.USE_REAL_BOOKING_API,
      () => this.getBookingStatsReal(providerId, dateFrom, dateTo),
      () => this.getBookingStatsMock(providerId, dateFrom, dateTo)
    );
  }

  private async getBookingStatsReal(
    providerId: number,
    dateFrom: string,
    dateTo: string
  ): Promise<BookingStats> {
    try {
      const apiService = ServiceFactory.getApiService();
      return await apiService.get<BookingStats>(
        `${this.baseURL}/stats/${providerId}`,
        { params: { dateFrom, dateTo } }
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ========================================
  // SERVICES & PROVIDERS
  // ========================================

  /**
   * Get service details for booking
   */
  async getServiceDetails(serviceIds: string[]): Promise<ServiceDetails[]> {
    return await ServiceFactory.executeWithFallback(
      FEATURE_FLAGS.USE_REAL_BOOKING_API,
      () => this.getServiceDetailsReal(serviceIds),
      () => this.getServiceDetailsMock(serviceIds)
    );
  }

  private async getServiceDetailsReal(serviceIds: string[]): Promise<ServiceDetails[]> {
    try {
      const apiService = ServiceFactory.getApiService();
      return await apiService.get<ServiceDetails[]>(
        `${this.baseURL}/services`,
        { params: { ids: serviceIds.join(',') } }
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ========================================
  // REMINDERS & NOTIFICATIONS
  // ========================================

  /**
   * Schedule reminder for booking
   */
  async scheduleReminder(
    bookingId: string,
    type: 'email' | 'sms' | 'push',
    hoursBeforeAppointment: number
  ): Promise<ReminderRecord> {
    return await ServiceFactory.executeWithFallback(
      FEATURE_FLAGS.USE_REAL_BOOKING_API,
      () => this.scheduleReminderReal(bookingId, type, hoursBeforeAppointment),
      () => this.scheduleReminderMock(bookingId, type, hoursBeforeAppointment)
    );
  }

  private async scheduleReminderReal(
    bookingId: string,
    type: 'email' | 'sms' | 'push',
    hoursBeforeAppointment: number
  ): Promise<ReminderRecord> {
    try {
      const apiService = ServiceFactory.getApiService();
      return await apiService.post<ReminderRecord>(
        `${this.baseURL}/${bookingId}/reminders`,
        { type, hoursBeforeAppointment }
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ========================================
  // CALENDAR EVENTS
  // ========================================

  /**
   * Add calendar event (holiday, vacation, etc.)
   */
  async addCalendarEvent(
    providerId: number,
    event: Omit<CalendarEvent, 'id'>
  ): Promise<CalendarEvent> {
    return await ServiceFactory.executeWithFallback(
      FEATURE_FLAGS.USE_REAL_BOOKING_API,
      () => this.addCalendarEventReal(providerId, event),
      () => this.addCalendarEventMock(providerId, event)
    );
  }

  private async addCalendarEventReal(
    providerId: number,
    event: Omit<CalendarEvent, 'id'>
  ): Promise<CalendarEvent> {
    try {
      const apiService = ServiceFactory.getApiService();
      return await apiService.post<CalendarEvent>(
        `${this.baseURL}/calendar/${providerId}/events`,
        event
      );
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ========================================
  // MOCK DATA IMPLEMENTATIONS
  // ========================================

  private async createBookingMock(bookingRequest: BookingRequest): Promise<BookingActionResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const mockBooking: Booking = {
      id: `booking_${Date.now()}`,
      clientId: bookingRequest.clientId,
      providerId: bookingRequest.providerId,
      serviceIds: bookingRequest.serviceIds,
      services: await this.getServiceDetailsMock(bookingRequest.serviceIds),
      status: BookingStatus.PENDING,
      type: bookingRequest.type,
      scheduledDateTime: bookingRequest.requestedDateTime,
      duration: bookingRequest.duration,
      client: {
        id: bookingRequest.clientId,
        fullName: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
      },
      provider: {
        id: bookingRequest.providerId,
        businessName: 'Sample Business',
        fullName: 'Jane Provider',
        email: 'jane@provider.com',
        phone: '+0987654321',
        address: '123 Business St, City, State 12345',
      },
      notes: bookingRequest.notes,
      specialRequests: bookingRequest.specialRequests,
      addOns: [],
      recurrenceConfig: bookingRequest.recurrenceConfig,
      packageConfig: bookingRequest.packageConfig,
      paymentStatus: PaymentStatus.PENDING,
      totalAmount: bookingRequest.estimatedTotal,
      paidAmount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      remindersSent: [],
    };

    return {
      success: true,
      booking: mockBooking,
      message: 'Booking created successfully',
      nextSteps: ['Confirm booking', 'Process payment', 'Send confirmation'],
    };
  }

  private async getBookingsMock(filter: BookingFilter): Promise<BookingResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const mockBookings: Booking[] = [
      // Add mock bookings here based on filter
    ];

    const mockStats: BookingStats = {
      totalBookings: 45,
      confirmedBookings: 38,
      pendingBookings: 5,
      cancelledBookings: 2,
      completedBookings: 35,
      noShowBookings: 1,
      revenue: {
        total: 12750,
        pending: 850,
        confirmed: 11900,
      },
      averageBookingValue: 283.33,
      popularServices: [
        {
          serviceId: 'service_1',
          serviceName: 'Hair Cut',
          bookingCount: 15,
          revenue: 4500,
        },
      ],
      peakHours: [
        { hour: 14, bookingCount: 8 },
        { hour: 15, bookingCount: 7 },
      ],
      clientRetention: {
        newClients: 12,
        returningClients: 26,
        retentionRate: 68.4,
      },
    };

    return {
      bookings: mockBookings,
      total: mockBookings.length,
      hasMore: false,
      stats: mockStats,
    };
  }

  private async getBookingByIdMock(bookingId: string): Promise<Booking> {
    // Return mock booking
    throw new Error('Mock implementation not yet available');
  }

  private async updateBookingStatusMock(
    bookingId: string, 
    status: BookingStatus, 
    reason?: string
  ): Promise<BookingActionResponse> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      message: `Booking status updated to ${status}`,
      nextSteps: status === BookingStatus.CONFIRMED ? ['Send confirmation', 'Schedule reminders'] : [],
    };
  }

  private async rescheduleBookingMock(
    bookingId: string, 
    newDateTime: string
  ): Promise<BookingActionResponse> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      message: 'Booking rescheduled successfully',
      nextSteps: ['Send notification', 'Update calendar'],
    };
  }

  private async getAvailabilityMock(query: AvailabilityQuery): Promise<AvailabilityResponse> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const mockTimeSlots: TimeSlot[] = [
      {
        startTime: '2024-01-15T09:00:00.000Z',
        endTime: '2024-01-15T10:00:00.000Z',
        isAvailable: true,
        isBooked: false,
      },
      {
        startTime: '2024-01-15T10:00:00.000Z',
        endTime: '2024-01-15T11:00:00.000Z',
        isAvailable: true,
        isBooked: false,
      },
    ];

    const mockCalendar: BookingCalendar[] = [
      {
        date: '2024-01-15',
        dayOfWeek: 1,
        isAvailable: true,
        timeSlots: mockTimeSlots,
        totalBookings: 3,
        totalRevenue: 450,
      },
    ];

    return {
      calendar: mockCalendar,
      availability: mockTimeSlots,
      conflicts: [],
      suggestions: mockTimeSlots,
    };
  }

  private async getCalendarViewMock(
    providerId: number, 
    year: number, 
    month: number
  ): Promise<BookingCalendar[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return mock calendar data for the month
    return [];
  }

  private async setAvailabilityRulesMock(
    providerId: number, 
    rules: AvailabilityRule[]
  ): Promise<AvailabilityRule[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return rules;
  }

  private async setAvailabilityOverrideMock(
    override: AvailabilityOverride
  ): Promise<AvailabilityOverride> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return override;
  }

  private async validateBookingMock(bookingRequest: BookingRequest): Promise<BookingValidation> {
    await new Promise(resolve => setTimeout(resolve, 300));

    return {
      isValid: true,
      errors: [],
      warnings: [],
      conflicts: [],
      estimatedTotal: bookingRequest.estimatedTotal,
      breakdown: await this.calculatePricingMock(bookingRequest),
    };
  }

  private async calculatePricingMock(bookingRequest: BookingRequest): Promise<PriceBreakdown> {
    const services = await this.getServiceDetailsMock(bookingRequest.serviceIds);
    
    const serviceBreakdown = services.map(service => ({
      serviceId: service.id,
      serviceName: service.name,
      price: service.price,
      duration: service.duration,
    }));

    const subtotal = serviceBreakdown.reduce((sum, service) => sum + service.price, 0);
    const taxes = subtotal * 0.08; // 8% tax
    const fees = 5; // $5 booking fee
    const discounts = 0;
    const total = subtotal + taxes + fees - discounts;

    return {
      services: serviceBreakdown,
      addOns: [],
      subtotal,
      taxes,
      fees,
      discounts,
      total,
    };
  }

  private async addToWaitlistMock(
    clientId: number,
    providerId: number,
    serviceIds: string[],
    preferredDateTime?: string,
    preferredDateRange?: { startDate: string; endDate: string },
    preferredTimeSlots?: string[]
  ): Promise<WaitlistEntry> {
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      id: `waitlist_${Date.now()}`,
      clientId,
      providerId,
      serviceIds,
      preferredDateTime,
      preferredDateRange,
      preferredTimeSlots: preferredTimeSlots || ['morning'],
      status: WaitlistStatus.ACTIVE,
      priority: 1,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    };
  }

  private async getWaitlistEntriesMock(
    clientId?: number,
    providerId?: number,
    status?: WaitlistStatus
  ): Promise<WaitlistEntry[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return [];
  }

  private async removeFromWaitlistMock(waitlistId: string): Promise<BookingActionResponse> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      message: 'Removed from waitlist successfully',
    };
  }

  private async getBookingPackagesMock(providerId: number): Promise<BookingPackage[]> {
    await new Promise(resolve => setTimeout(resolve, 500));

    return [
      {
        id: `package_${providerId}_1`,
        providerId,
        name: '5-Session Hair Package',
        description: 'Get 5 haircuts and save 20%',
        serviceIds: ['haircut'],
        totalSessions: 5,
        validityDays: 365,
        price: 400,
        discountPercentage: 20,
        isTransferrable: false,
        terms: 'Package expires in 1 year. Non-refundable.',
        isActive: true,
        createdAt: new Date().toISOString(),
      },
    ];
  }

  private async purchasePackageMock(
    clientId: number,
    packageId: string,
    paymentMethod: string
  ): Promise<BookingActionResponse> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      message: 'Package purchased successfully',
      nextSteps: ['Package activated', 'Book first session'],
    };
  }

  private async createRecurringBookingMock(
    bookingRequest: BookingRequest,
    recurrenceConfig: RecurrenceConfig
  ): Promise<BookingActionResponse> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      message: 'Recurring booking series created successfully',
      nextSteps: ['Confirm each booking', 'Set up reminders'],
    };
  }

  private async getRecurringBookingsMock(
    parentBookingId?: string,
    clientId?: number,
    providerId?: number
  ): Promise<Booking[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return [];
  }

  private async cancelRecurringBookingsMock(
    parentBookingId: string,
    cancelFutureOnly: boolean,
    reason?: string
  ): Promise<BookingActionResponse> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      message: `Recurring bookings cancelled ${cancelFutureOnly ? '(future only)' : '(all)'}`,
    };
  }

  private async getBookingStatsMock(
    providerId: number,
    dateFrom: string,
    dateTo: string
  ): Promise<BookingStats> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      totalBookings: 45,
      confirmedBookings: 38,
      pendingBookings: 5,
      cancelledBookings: 2,
      completedBookings: 35,
      noShowBookings: 1,
      revenue: {
        total: 12750,
        pending: 850,
        confirmed: 11900,
      },
      averageBookingValue: 283.33,
      popularServices: [],
      peakHours: [],
      clientRetention: {
        newClients: 12,
        returningClients: 26,
        retentionRate: 68.4,
      },
    };
  }

  private async getServiceDetailsMock(serviceIds: string[]): Promise<ServiceDetails[]> {
    await new Promise(resolve => setTimeout(resolve, 300));

    return serviceIds.map((id, index) => ({
      id,
      name: `Service ${index + 1}`,
      description: `Description for service ${index + 1}`,
      duration: 60,
      price: 100,
      category: 'Hair',
      providerId: 1,
      isActive: true,
      bookingBuffer: 15,
      advanceBookingDays: 30,
      cancellationPolicy: {
        id: 'policy_1',
        name: 'Standard Policy',
        description: '24 hour cancellation policy',
        noticePeriodHours: 24,
        penaltyPercentage: 50,
        refundPolicy: '50% refund with 24+ hours notice',
      },
    }));
  }

  private async scheduleReminderMock(
    bookingId: string,
    type: 'email' | 'sms' | 'push',
    hoursBeforeAppointment: number
  ): Promise<ReminderRecord> {
    await new Promise(resolve => setTimeout(resolve, 300));

    return {
      id: `reminder_${Date.now()}`,
      type,
      sentAt: new Date().toISOString(),
      hoursBeforeAppointment,
      content: `Reminder: You have an appointment in ${hoursBeforeAppointment} hours`,
      status: 'sent',
    };
  }

  private async addCalendarEventMock(
    providerId: number,
    event: Omit<CalendarEvent, 'id'>
  ): Promise<CalendarEvent> {
    await new Promise(resolve => setTimeout(resolve, 300));

    return {
      id: `event_${Date.now()}`,
      ...event,
    };
  }

  // ========================================
  // ERROR HANDLING
  // ========================================

  private handleError(error: any): Error {
    console.error('Advanced Booking Service Error:', error);
    
    if (error.response) {
      // API error response
      const message = error.response.data?.message || 'An error occurred with the booking service';
      return new Error(message);
    } else if (error.request) {
      // Network error
      return new Error('Network error. Please check your connection and try again.');
    } else {
      // Other error
      return new Error(error.message || 'An unexpected error occurred');
    }
  }
}

export const advancedBookingService = new AdvancedBookingService();
export default advancedBookingService;
