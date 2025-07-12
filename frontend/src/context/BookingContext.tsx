import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import {
  Booking,
  BookingRequest,
  BookingFilter,
  BookingStats,
  BookingStatus,
  WaitlistEntry,
  BookingPackage,
  AvailabilityQuery,
  AvailabilityResponse,
  BookingValidation,
  RecurrenceConfig,
  PackageConfig,
  ServiceDetails,
  AvailabilityRule,
  AvailabilityOverride,
  CalendarEvent,
} from '@/types/booking';
import { advancedBookingService } from '@/services/advancedBookingService';

// State interface
interface BookingState {
  // Bookings
  bookings: Booking[];
  currentBooking: Booking | null;
  bookingStats: BookingStats | null;
  
  // Availability & Calendar
  availability: AvailabilityResponse | null;
  availabilityRules: AvailabilityRule[];
  calendarEvents: CalendarEvent[];
  
  // Waitlist & Packages
  waitlistEntries: WaitlistEntry[];
  packages: BookingPackage[];
  
  // Services
  services: ServiceDetails[];
  
  // Loading states
  loading: {
    bookings: boolean;
    availability: boolean;
    creating: boolean;
    updating: boolean;
    validating: boolean;
  };
  
  // Error handling
  error: string | null;
  
  // Filters and preferences
  currentFilter: BookingFilter;
  selectedServices: string[];
  selectedDate: string | null;
}

// Action types
type BookingAction =
  | { type: 'SET_LOADING'; payload: { key: keyof BookingState['loading']; value: boolean } }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_BOOKINGS'; payload: Booking[] }
  | { type: 'SET_CURRENT_BOOKING'; payload: Booking | null }
  | { type: 'SET_BOOKING_STATS'; payload: BookingStats }
  | { type: 'SET_AVAILABILITY'; payload: AvailabilityResponse }
  | { type: 'SET_AVAILABILITY_RULES'; payload: AvailabilityRule[] }
  | { type: 'SET_CALENDAR_EVENTS'; payload: CalendarEvent[] }
  | { type: 'SET_WAITLIST_ENTRIES'; payload: WaitlistEntry[] }
  | { type: 'SET_PACKAGES'; payload: BookingPackage[] }
  | { type: 'SET_SERVICES'; payload: ServiceDetails[] }
  | { type: 'SET_FILTER'; payload: BookingFilter }
  | { type: 'SET_SELECTED_SERVICES'; payload: string[] }
  | { type: 'SET_SELECTED_DATE'; payload: string | null }
  | { type: 'ADD_BOOKING'; payload: Booking }
  | { type: 'UPDATE_BOOKING'; payload: { id: string; updates: Partial<Booking> } }
  | { type: 'REMOVE_BOOKING'; payload: string }
  | { type: 'ADD_WAITLIST_ENTRY'; payload: WaitlistEntry }
  | { type: 'REMOVE_WAITLIST_ENTRY'; payload: string }
  | { type: 'RESET_STATE' };

// Initial state
const initialState: BookingState = {
  bookings: [],
  currentBooking: null,
  bookingStats: null,
  availability: null,
  availabilityRules: [],
  calendarEvents: [],
  waitlistEntries: [],
  packages: [],
  services: [],
  loading: {
    bookings: false,
    availability: false,
    creating: false,
    updating: false,
    validating: false,
  },
  error: null,
  currentFilter: {},
  selectedServices: [],
  selectedDate: null,
};

// Reducer function
function bookingReducer(state: BookingState, action: BookingAction): BookingState {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.payload.key]: action.payload.value,
        },
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };

    case 'SET_BOOKINGS':
      return {
        ...state,
        bookings: action.payload,
      };

    case 'SET_CURRENT_BOOKING':
      return {
        ...state,
        currentBooking: action.payload,
      };

    case 'SET_BOOKING_STATS':
      return {
        ...state,
        bookingStats: action.payload,
      };

    case 'SET_AVAILABILITY':
      return {
        ...state,
        availability: action.payload,
      };

    case 'SET_AVAILABILITY_RULES':
      return {
        ...state,
        availabilityRules: action.payload,
      };

    case 'SET_CALENDAR_EVENTS':
      return {
        ...state,
        calendarEvents: action.payload,
      };

    case 'SET_WAITLIST_ENTRIES':
      return {
        ...state,
        waitlistEntries: action.payload,
      };

    case 'SET_PACKAGES':
      return {
        ...state,
        packages: action.payload,
      };

    case 'SET_SERVICES':
      return {
        ...state,
        services: action.payload,
      };

    case 'SET_FILTER':
      return {
        ...state,
        currentFilter: action.payload,
      };

    case 'SET_SELECTED_SERVICES':
      return {
        ...state,
        selectedServices: action.payload,
      };

    case 'SET_SELECTED_DATE':
      return {
        ...state,
        selectedDate: action.payload,
      };

    case 'ADD_BOOKING':
      return {
        ...state,
        bookings: [action.payload, ...state.bookings],
      };

    case 'UPDATE_BOOKING':
      return {
        ...state,
        bookings: state.bookings.map(booking =>
          booking.id === action.payload.id
            ? { ...booking, ...action.payload.updates }
            : booking
        ),
        currentBooking:
          state.currentBooking?.id === action.payload.id
            ? { ...state.currentBooking, ...action.payload.updates }
            : state.currentBooking,
      };

    case 'REMOVE_BOOKING':
      return {
        ...state,
        bookings: state.bookings.filter(booking => booking.id !== action.payload),
        currentBooking:
          state.currentBooking?.id === action.payload ? null : state.currentBooking,
      };

    case 'ADD_WAITLIST_ENTRY':
      return {
        ...state,
        waitlistEntries: [action.payload, ...state.waitlistEntries],
      };

    case 'REMOVE_WAITLIST_ENTRY':
      return {
        ...state,
        waitlistEntries: state.waitlistEntries.filter(entry => entry.id !== action.payload),
      };

    case 'RESET_STATE':
      return initialState;

    default:
      return state;
  }
}

// Context interface
interface BookingContextType extends BookingState {
  // Booking CRUD operations
  createBooking: (request: BookingRequest) => Promise<Booking | null>;
  updateBookingStatus: (bookingId: string, status: BookingStatus, reason?: string) => Promise<boolean>;
  rescheduleBooking: (bookingId: string, newDateTime: string) => Promise<boolean>;
  cancelBooking: (bookingId: string, reason?: string) => Promise<boolean>;
  
  // Data fetching
  fetchBookings: (filter?: BookingFilter) => Promise<void>;
  fetchBookingById: (bookingId: string) => Promise<void>;
  fetchBookingStats: (providerId: number, dateFrom: string, dateTo: string) => Promise<void>;
  
  // Availability management
  fetchAvailability: (query: AvailabilityQuery) => Promise<void>;
  setAvailabilityRules: (providerId: number, rules: AvailabilityRule[]) => Promise<void>;
  setAvailabilityOverride: (override: AvailabilityOverride) => Promise<void>;
  
  // Booking validation
  validateBooking: (request: BookingRequest) => Promise<BookingValidation | null>;
  
  // Waitlist management
  addToWaitlist: (
    clientId: number,
    providerId: number,
    serviceIds: string[],
    preferences?: {
      preferredDateTime?: string;
      preferredDateRange?: { startDate: string; endDate: string };
      preferredTimeSlots?: string[];
    }
  ) => Promise<boolean>;
  removeFromWaitlist: (waitlistId: string) => Promise<boolean>;
  fetchWaitlistEntries: (clientId?: number, providerId?: number) => Promise<void>;
  
  // Package management
  fetchPackages: (providerId: number) => Promise<void>;
  createPackage: (packageData: Omit<BookingPackage, 'id' | 'createdAt'>) => Promise<boolean>;
  updatePackage: (packageId: string, updates: Partial<BookingPackage>) => Promise<boolean>;
  deletePackage: (packageId: string) => Promise<boolean>;
  purchasePackage: (clientId: number, packageId: string, paymentMethod: string) => Promise<boolean>;
  
  // Recurring bookings
  createRecurringBooking: (request: BookingRequest, recurrenceConfig: RecurrenceConfig) => Promise<boolean>;
  cancelRecurringBookings: (parentBookingId: string, cancelFutureOnly?: boolean, reason?: string) => Promise<boolean>;
  
  // Calendar events
  addCalendarEvent: (providerId: number, event: Omit<CalendarEvent, 'id'>) => Promise<boolean>;
  
  // Utility functions
  clearError: () => void;
  setFilter: (filter: BookingFilter) => void;
  setSelectedServices: (serviceIds: string[]) => void;
  setSelectedDate: (date: string | null) => void;
  resetState: () => void;
}

// Create context
const BookingContext = createContext<BookingContextType | undefined>(undefined);

// Provider component
interface BookingProviderProps {
  children: ReactNode;
}

export const BookingProvider: React.FC<BookingProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(bookingReducer, initialState);

  // Utility functions
  const setLoading = useCallback((key: keyof BookingState['loading'], value: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: { key, value } });
  }, []);

  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
  }, []);

  // Booking CRUD operations
  const createBooking = useCallback(async (request: BookingRequest): Promise<Booking | null> => {
    try {
      setLoading('creating', true);
      setError(null);

      const response = await advancedBookingService.createBooking(request);
      
      if (response.success && response.booking) {
        dispatch({ type: 'ADD_BOOKING', payload: response.booking });
        return response.booking;
      } else {
        setError(response.message || 'Failed to create booking');
        return null;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setError(errorMessage);
      return null;
    } finally {
      setLoading('creating', false);
    }
  }, []);

  const updateBookingStatus = useCallback(async (
    bookingId: string, 
    status: BookingStatus, 
    reason?: string
  ): Promise<boolean> => {
    try {
      setLoading('updating', true);
      setError(null);

      const response = await advancedBookingService.updateBookingStatus(bookingId, status, reason);
      
      if (response.success) {
        dispatch({
          type: 'UPDATE_BOOKING',
          payload: { id: bookingId, updates: { status, updatedAt: new Date().toISOString() } },
        });
        return true;
      } else {
        setError(response.message || 'Failed to update booking status');
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setError(errorMessage);
      return false;
    } finally {
      setLoading('updating', false);
    }
  }, []);

  const rescheduleBooking = useCallback(async (
    bookingId: string, 
    newDateTime: string
  ): Promise<boolean> => {
    try {
      setLoading('updating', true);
      setError(null);

      const response = await advancedBookingService.rescheduleBooking(bookingId, newDateTime);
      
      if (response.success) {
        dispatch({
          type: 'UPDATE_BOOKING',
          payload: { 
            id: bookingId, 
            updates: { 
              scheduledDateTime: newDateTime, 
              status: BookingStatus.RESCHEDULED,
              updatedAt: new Date().toISOString() 
            } 
          },
        });
        return true;
      } else {
        setError(response.message || 'Failed to reschedule booking');
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setError(errorMessage);
      return false;
    } finally {
      setLoading('updating', false);
    }
  }, []);

  const cancelBooking = useCallback(async (
    bookingId: string, 
    reason?: string
  ): Promise<boolean> => {
    return updateBookingStatus(bookingId, BookingStatus.CANCELLED, reason);
  }, [updateBookingStatus]);

  // Data fetching
  const fetchBookings = useCallback(async (filter: BookingFilter = {}): Promise<void> => {
    try {
      setLoading('bookings', true);
      setError(null);

      const response = await advancedBookingService.getBookings(filter);
      dispatch({ type: 'SET_BOOKINGS', payload: response.bookings });
      
      if (response.stats) {
        dispatch({ type: 'SET_BOOKING_STATS', payload: response.stats });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch bookings';
      setError(errorMessage);
    } finally {
      setLoading('bookings', false);
    }
  }, []);

  const fetchBookingById = useCallback(async (bookingId: string): Promise<void> => {
    try {
      setLoading('bookings', true);
      setError(null);

      const booking = await advancedBookingService.getBookingById(bookingId);
      dispatch({ type: 'SET_CURRENT_BOOKING', payload: booking });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch booking';
      setError(errorMessage);
    } finally {
      setLoading('bookings', false);
    }
  }, []);

  const fetchBookingStats = useCallback(async (
    providerId: number, 
    dateFrom: string, 
    dateTo: string
  ): Promise<void> => {
    try {
      setError(null);

      const stats = await advancedBookingService.getBookingStats(providerId, dateFrom, dateTo);
      dispatch({ type: 'SET_BOOKING_STATS', payload: stats });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch booking stats';
      setError(errorMessage);
    }
  }, []);

  // Availability management
  const fetchAvailability = useCallback(async (query: AvailabilityQuery): Promise<void> => {
    try {
      setLoading('availability', true);
      setError(null);

      const availability = await advancedBookingService.getAvailability(query);
      dispatch({ type: 'SET_AVAILABILITY', payload: availability });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch availability';
      setError(errorMessage);
    } finally {
      setLoading('availability', false);
    }
  }, []);

  const setAvailabilityRules = useCallback(async (
    providerId: number, 
    rules: AvailabilityRule[]
  ): Promise<void> => {
    try {
      setError(null);

      const updatedRules = await advancedBookingService.setAvailabilityRules(providerId, rules);
      dispatch({ type: 'SET_AVAILABILITY_RULES', payload: updatedRules });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to set availability rules';
      setError(errorMessage);
    }
  }, []);

  const setAvailabilityOverride = useCallback(async (override: AvailabilityOverride): Promise<void> => {
    try {
      setError(null);

      await advancedBookingService.setAvailabilityOverride(override);
      // Refresh availability if needed
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to set availability override';
      setError(errorMessage);
    }
  }, []);

  // Booking validation
  const validateBooking = useCallback(async (request: BookingRequest): Promise<BookingValidation | null> => {
    try {
      setLoading('validating', true);
      setError(null);

      const validation = await advancedBookingService.validateBooking(request);
      return validation;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to validate booking';
      setError(errorMessage);
      return null;
    } finally {
      setLoading('validating', false);
    }
  }, []);

  // Waitlist management
  const addToWaitlist = useCallback(async (
    clientId: number,
    providerId: number,
    serviceIds: string[],
    preferences?: {
      preferredDateTime?: string;
      preferredDateRange?: { startDate: string; endDate: string };
      preferredTimeSlots?: string[];
    }
  ): Promise<boolean> => {
    try {
      setError(null);

      const entry = await advancedBookingService.addToWaitlist(
        clientId,
        providerId,
        serviceIds,
        preferences?.preferredDateTime,
        preferences?.preferredDateRange,
        preferences?.preferredTimeSlots
      );

      dispatch({ type: 'ADD_WAITLIST_ENTRY', payload: entry });
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add to waitlist';
      setError(errorMessage);
      return false;
    }
  }, []);

  const removeFromWaitlist = useCallback(async (waitlistId: string): Promise<boolean> => {
    try {
      setError(null);

      const response = await advancedBookingService.removeFromWaitlist(waitlistId);
      
      if (response.success) {
        dispatch({ type: 'REMOVE_WAITLIST_ENTRY', payload: waitlistId });
        return true;
      } else {
        setError(response.message || 'Failed to remove from waitlist');
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove from waitlist';
      setError(errorMessage);
      return false;
    }
  }, []);

  const fetchWaitlistEntries = useCallback(async (
    clientId?: number, 
    providerId?: number
  ): Promise<void> => {
    try {
      setError(null);

      const entries = await advancedBookingService.getWaitlistEntries(clientId, providerId);
      dispatch({ type: 'SET_WAITLIST_ENTRIES', payload: entries });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch waitlist entries';
      setError(errorMessage);
    }
  }, []);

  // Package management
  const fetchPackages = useCallback(async (providerId: number): Promise<void> => {
    try {
      setError(null);

      const packages = await advancedBookingService.getBookingPackages(providerId);
      dispatch({ type: 'SET_PACKAGES', payload: packages });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch packages';
      setError(errorMessage);
    }
  }, []);

  const purchasePackage = useCallback(async (
    clientId: number, 
    packageId: string, 
    paymentMethod: string
  ): Promise<boolean> => {
    try {
      setError(null);

      const response = await advancedBookingService.purchasePackage(clientId, packageId, paymentMethod);
      return response.success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to purchase package';
      setError(errorMessage);
      return false;
    }
  }, []);

  // Package CRUD operations (for providers)
  const createPackage = useCallback(async (
    packageData: Omit<BookingPackage, 'id' | 'createdAt'>
  ): Promise<boolean> => {
    try {
      setError(null);

      const newPackage = await advancedBookingService.createBookingPackage(packageData);
      dispatch({ type: 'SET_PACKAGES', payload: [...state.packages, newPackage] });
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create package';
      setError(errorMessage);
      return false;
    }
  }, [state.packages]);

  const updatePackage = useCallback(async (
    packageId: string, 
    updates: Partial<BookingPackage>
  ): Promise<boolean> => {
    try {
      setError(null);

      const updatedPackage = await advancedBookingService.updateBookingPackage(packageId, updates);
      const updatedPackages = state.packages.map(pkg => 
        pkg.id === packageId ? updatedPackage : pkg
      );
      dispatch({ type: 'SET_PACKAGES', payload: updatedPackages });
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update package';
      setError(errorMessage);
      return false;
    }
  }, [state.packages]);

  const deletePackage = useCallback(async (packageId: string): Promise<boolean> => {
    try {
      setError(null);

      const response = await advancedBookingService.deleteBookingPackage(packageId);
      if (response.success) {
        const updatedPackages = state.packages.filter(pkg => pkg.id !== packageId);
        dispatch({ type: 'SET_PACKAGES', payload: updatedPackages });
        return true;
      }
      return false;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete package';
      setError(errorMessage);
      return false;
    }
  }, [state.packages]);

  // Recurring bookings
  const createRecurringBooking = useCallback(async (
    request: BookingRequest, 
    recurrenceConfig: RecurrenceConfig
  ): Promise<boolean> => {
    try {
      setLoading('creating', true);
      setError(null);

      const response = await advancedBookingService.createRecurringBooking(request, recurrenceConfig);
      return response.success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create recurring booking';
      setError(errorMessage);
      return false;
    } finally {
      setLoading('creating', false);
    }
  }, []);

  const cancelRecurringBookings = useCallback(async (
    parentBookingId: string, 
    cancelFutureOnly: boolean = true, 
    reason?: string
  ): Promise<boolean> => {
    try {
      setLoading('updating', true);
      setError(null);

      const response = await advancedBookingService.cancelRecurringBookings(
        parentBookingId, 
        cancelFutureOnly, 
        reason
      );
      return response.success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to cancel recurring bookings';
      setError(errorMessage);
      return false;
    } finally {
      setLoading('updating', false);
    }
  }, []);

  // Calendar events
  const addCalendarEvent = useCallback(async (
    providerId: number, 
    event: Omit<CalendarEvent, 'id'>
  ): Promise<boolean> => {
    try {
      setError(null);

      const newEvent = await advancedBookingService.addCalendarEvent(providerId, event);
      dispatch({ type: 'SET_CALENDAR_EVENTS', payload: [...state.calendarEvents, newEvent] });
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add calendar event';
      setError(errorMessage);
      return false;
    }
  }, [state.calendarEvents]);

  // Utility functions
  const setFilter = useCallback((filter: BookingFilter) => {
    dispatch({ type: 'SET_FILTER', payload: filter });
  }, []);

  const setSelectedServices = useCallback((serviceIds: string[]) => {
    dispatch({ type: 'SET_SELECTED_SERVICES', payload: serviceIds });
  }, []);

  const setSelectedDate = useCallback((date: string | null) => {
    dispatch({ type: 'SET_SELECTED_DATE', payload: date });
  }, []);

  const resetState = useCallback(() => {
    dispatch({ type: 'RESET_STATE' });
  }, []);

  const contextValue: BookingContextType = {
    ...state,
    // Booking CRUD operations
    createBooking,
    updateBookingStatus,
    rescheduleBooking,
    cancelBooking,
    // Data fetching
    fetchBookings,
    fetchBookingById,
    fetchBookingStats,
    // Availability management
    fetchAvailability,
    setAvailabilityRules,
    setAvailabilityOverride,
    // Booking validation
    validateBooking,
    // Waitlist management
    addToWaitlist,
    removeFromWaitlist,
    fetchWaitlistEntries,
    // Package management
    fetchPackages,
    createPackage,
    updatePackage,
    deletePackage,
    purchasePackage,
    // Recurring bookings
    createRecurringBooking,
    cancelRecurringBookings,
    // Calendar events
    addCalendarEvent,
    // Utility functions
    clearError,
    setFilter,
    setSelectedServices,
    setSelectedDate,
    resetState,
  };

  return (
    <BookingContext.Provider value={contextValue}>
      {children}
    </BookingContext.Provider>
  );
};

// Hook to use the booking context
export const useBooking = (): BookingContextType => {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};

export default BookingContext;
