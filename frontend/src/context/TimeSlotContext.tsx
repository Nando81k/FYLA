import React, { createContext, useContext, useReducer, useCallback } from 'react';
import {
  TimeSlot,
  TimeSlotAvailability,
  BookingConflict,
  TimeSlotRequest,
  TimeSlotReservation,
  AvailabilityFilter,
  TimeSlotStats,
} from '../types/timeSlot';
import { timeSlotService } from '../services/timeSlotService';

// State interface
interface TimeSlotState {
  // Current availability data
  availability: { [key: string]: TimeSlotAvailability }; // key: providerId_date
  currentReservation: TimeSlotReservation | null;
  conflicts: BookingConflict[];
  stats: TimeSlotStats | null;
  
  // Loading states
  loading: {
    availability: boolean;
    conflicts: boolean;
    reserving: boolean;
    confirming: boolean;
    stats: boolean;
  };
  
  // UI state
  selectedDate: string | null;
  selectedProviderId: number | null;
  selectedSlot: TimeSlot | null;
  filter: AvailabilityFilter | null;
  
  error: string | null;
}

// Action types
type TimeSlotAction =
  | { type: 'SET_LOADING'; payload: { key: keyof TimeSlotState['loading']; value: boolean } }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_AVAILABILITY'; payload: { key: string; availability: TimeSlotAvailability } }
  | { type: 'SET_CONFLICTS'; payload: BookingConflict[] }
  | { type: 'SET_CURRENT_RESERVATION'; payload: TimeSlotReservation | null }
  | { type: 'SET_STATS'; payload: TimeSlotStats | null }
  | { type: 'SET_SELECTED_DATE'; payload: string | null }
  | { type: 'SET_SELECTED_PROVIDER'; payload: number | null }
  | { type: 'SET_SELECTED_SLOT'; payload: TimeSlot | null }
  | { type: 'SET_FILTER'; payload: AvailabilityFilter | null }
  | { type: 'UPDATE_SLOT_STATUS'; payload: { providerId: number; date: string; slotId: string; isAvailable: boolean; bookingId?: string } }
  | { type: 'CLEAR_AVAILABILITY' }
  | { type: 'RESET_STATE' };

// Initial state
const initialState: TimeSlotState = {
  availability: {},
  currentReservation: null,
  conflicts: [],
  stats: null,
  loading: {
    availability: false,
    conflicts: false,
    reserving: false,
    confirming: false,
    stats: false,
  },
  selectedDate: null,
  selectedProviderId: null,
  selectedSlot: null,
  filter: null,
  error: null,
};

// Reducer
function timeSlotReducer(state: TimeSlotState, action: TimeSlotAction): TimeSlotState {
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

    case 'SET_AVAILABILITY':
      return {
        ...state,
        availability: {
          ...state.availability,
          [action.payload.key]: action.payload.availability,
        },
      };

    case 'SET_CONFLICTS':
      return {
        ...state,
        conflicts: action.payload,
      };

    case 'SET_CURRENT_RESERVATION':
      return {
        ...state,
        currentReservation: action.payload,
      };

    case 'SET_STATS':
      return {
        ...state,
        stats: action.payload,
      };

    case 'SET_SELECTED_DATE':
      return {
        ...state,
        selectedDate: action.payload,
      };

    case 'SET_SELECTED_PROVIDER':
      return {
        ...state,
        selectedProviderId: action.payload,
      };

    case 'SET_SELECTED_SLOT':
      return {
        ...state,
        selectedSlot: action.payload,
      };

    case 'SET_FILTER':
      return {
        ...state,
        filter: action.payload,
      };

    case 'UPDATE_SLOT_STATUS':
      const { providerId, date, slotId, isAvailable, bookingId } = action.payload;
      const key = `${providerId}_${date}`;
      const availability = state.availability[key];
      
      if (!availability) return state;

      const updatedSlots = availability.slots.map(slot =>
        slot.id === slotId
          ? { ...slot, isAvailable, bookingId }
          : slot
      );

      return {
        ...state,
        availability: {
          ...state.availability,
          [key]: {
            ...availability,
            slots: updatedSlots,
          },
        },
      };

    case 'CLEAR_AVAILABILITY':
      return {
        ...state,
        availability: {},
      };

    case 'RESET_STATE':
      return initialState;

    default:
      return state;
  }
}

// Context interface
interface TimeSlotContextType extends TimeSlotState {
  // Availability management
  fetchAvailability: (providerId: number, date: string, filter?: AvailabilityFilter) => Promise<void>;
  clearAvailability: () => void;
  refreshAvailability: () => Promise<void>;
  
  // Booking conflict checking
  checkConflicts: (request: TimeSlotRequest) => Promise<BookingConflict[]>;
  clearConflicts: () => void;
  
  // Reservation management
  reserveSlot: (request: TimeSlotRequest) => Promise<TimeSlotReservation | null>;
  confirmReservation: () => Promise<string | null>; // Returns booking ID
  cancelReservation: () => Promise<boolean>;
  
  // Statistics
  fetchStats: (providerId: number, startDate: string, endDate: string) => Promise<void>;
  
  // UI state management
  setSelectedDate: (date: string | null) => void;
  setSelectedProvider: (providerId: number | null) => void;
  setSelectedSlot: (slot: TimeSlot | null) => void;
  setFilter: (filter: AvailabilityFilter | null) => void;
  
  // Utility functions
  clearError: () => void;
  getAvailabilityForProvider: (providerId: number, date: string) => TimeSlotAvailability | null;
  isSlotAvailable: (slot: TimeSlot) => boolean;
  formatSlotTime: (slot: TimeSlot) => string;
  resetState: () => void;
}

// Create context
const TimeSlotContext = createContext<TimeSlotContextType | undefined>(undefined);

// Provider component
interface TimeSlotProviderProps {
  children: React.ReactNode;
}

export const TimeSlotProvider: React.FC<TimeSlotProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(timeSlotReducer, initialState);

  // Helper function to set loading state
  const setLoading = useCallback((key: keyof TimeSlotState['loading'], value: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: { key, value } });
  }, []);

  // Helper function to set error
  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  // Fetch availability for a provider on a specific date
  const fetchAvailability = useCallback(async (
    providerId: number,
    date: string,
    filter?: AvailabilityFilter
  ): Promise<void> => {
    try {
      setLoading('availability', true);
      setError(null);

      const availability = await timeSlotService.getAvailableSlots(providerId, date, filter);
      const key = `${providerId}_${date}`;
      
      dispatch({ type: 'SET_AVAILABILITY', payload: { key, availability } });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch availability';
      setError(errorMessage);
    } finally {
      setLoading('availability', false);
    }
  }, []);

  // Clear all availability data
  const clearAvailability = useCallback(() => {
    dispatch({ type: 'CLEAR_AVAILABILITY' });
  }, []);

  // Refresh current availability
  const refreshAvailability = useCallback(async (): Promise<void> => {
    if (state.selectedProviderId && state.selectedDate) {
      await fetchAvailability(state.selectedProviderId, state.selectedDate, state.filter);
    }
  }, [state.selectedProviderId, state.selectedDate, state.filter, fetchAvailability]);

  // Check for booking conflicts
  const checkConflicts = useCallback(async (request: TimeSlotRequest): Promise<BookingConflict[]> => {
    try {
      setLoading('conflicts', true);
      setError(null);

      const conflicts = await timeSlotService.checkBookingConflicts(request);
      dispatch({ type: 'SET_CONFLICTS', payload: conflicts });
      
      return conflicts;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to check conflicts';
      setError(errorMessage);
      return [];
    } finally {
      setLoading('conflicts', false);
    }
  }, []);

  // Clear conflicts
  const clearConflicts = useCallback(() => {
    dispatch({ type: 'SET_CONFLICTS', payload: [] });
  }, []);

  // Reserve a time slot
  const reserveSlot = useCallback(async (request: TimeSlotRequest): Promise<TimeSlotReservation | null> => {
    try {
      setLoading('reserving', true);
      setError(null);

      // First check for conflicts
      const conflicts = await timeSlotService.checkBookingConflicts(request);
      if (conflicts.length > 0) {
        dispatch({ type: 'SET_CONFLICTS', payload: conflicts });
        setError('Cannot reserve slot due to conflicts');
        return null;
      }

      const reservation = await timeSlotService.reserveTimeSlot(request);
      dispatch({ type: 'SET_CURRENT_RESERVATION', payload: reservation });
      
      // Update slot status to reserved
      const date = new Date(request.requestedStartTime).toISOString().split('T')[0];
      dispatch({
        type: 'UPDATE_SLOT_STATUS',
        payload: {
          providerId: request.providerId,
          date,
          slotId: `slot_${request.providerId}_${new Date(request.requestedStartTime).getTime()}`,
          isAvailable: false,
          bookingId: reservation.id,
        },
      });

      return reservation;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reserve slot';
      setError(errorMessage);
      return null;
    } finally {
      setLoading('reserving', false);
    }
  }, []);

  // Confirm reservation
  const confirmReservation = useCallback(async (): Promise<string | null> => {
    if (!state.currentReservation) {
      setError('No reservation to confirm');
      return null;
    }

    try {
      setLoading('confirming', true);
      setError(null);

      const result = await timeSlotService.confirmReservation(state.currentReservation.id);
      
      if (result.success) {
        dispatch({ type: 'SET_CURRENT_RESERVATION', payload: null });
        return result.bookingId || null;
      } else {
        setError('Failed to confirm reservation');
        return null;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to confirm reservation';
      setError(errorMessage);
      return null;
    } finally {
      setLoading('confirming', false);
    }
  }, [state.currentReservation]);

  // Cancel reservation
  const cancelReservation = useCallback(async (): Promise<boolean> => {
    if (!state.currentReservation) {
      setError('No reservation to cancel');
      return false;
    }

    try {
      setError(null);

      const result = await timeSlotService.cancelReservation(state.currentReservation.id);
      
      if (result.success) {
        // Update slot status back to available
        const date = new Date(state.currentReservation.startTime).toISOString().split('T')[0];
        dispatch({
          type: 'UPDATE_SLOT_STATUS',
          payload: {
            providerId: state.currentReservation.providerId,
            date,
            slotId: state.currentReservation.timeSlotId,
            isAvailable: true,
          },
        });

        dispatch({ type: 'SET_CURRENT_RESERVATION', payload: null });
        return true;
      } else {
        setError('Failed to cancel reservation');
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to cancel reservation';
      setError(errorMessage);
      return false;
    }
  }, [state.currentReservation]);

  // Fetch statistics
  const fetchStats = useCallback(async (
    providerId: number,
    startDate: string,
    endDate: string
  ): Promise<void> => {
    try {
      setLoading('stats', true);
      setError(null);

      const stats = await timeSlotService.getTimeSlotStats(providerId, startDate, endDate);
      dispatch({ type: 'SET_STATS', payload: stats });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch statistics';
      setError(errorMessage);
    } finally {
      setLoading('stats', false);
    }
  }, []);

  // UI state setters
  const setSelectedDate = useCallback((date: string | null) => {
    dispatch({ type: 'SET_SELECTED_DATE', payload: date });
  }, []);

  const setSelectedProvider = useCallback((providerId: number | null) => {
    dispatch({ type: 'SET_SELECTED_PROVIDER', payload: providerId });
  }, []);

  const setSelectedSlot = useCallback((slot: TimeSlot | null) => {
    dispatch({ type: 'SET_SELECTED_SLOT', payload: slot });
  }, []);

  const setFilter = useCallback((filter: AvailabilityFilter | null) => {
    dispatch({ type: 'SET_FILTER', payload: filter });
  }, []);

  // Utility functions
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const getAvailabilityForProvider = useCallback((
    providerId: number,
    date: string
  ): TimeSlotAvailability | null => {
    const key = `${providerId}_${date}`;
    return state.availability[key] || null;
  }, [state.availability]);

  const isSlotAvailable = useCallback((slot: TimeSlot): boolean => {
    return slot.isAvailable && !slot.isBlocked && !slot.bookingId;
  }, []);

  const formatSlotTime = useCallback((slot: TimeSlot): string => {
    const startTime = new Date(slot.startTime);
    const endTime = new Date(slot.endTime);
    
    const formatTime = (date: Date) => {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    };

    return `${formatTime(startTime)} - ${formatTime(endTime)}`;
  }, []);

  const resetState = useCallback(() => {
    dispatch({ type: 'RESET_STATE' });
  }, []);

  const contextValue: TimeSlotContextType = {
    ...state,
    // Availability management
    fetchAvailability,
    clearAvailability,
    refreshAvailability,
    // Conflict checking
    checkConflicts,
    clearConflicts,
    // Reservation management
    reserveSlot,
    confirmReservation,
    cancelReservation,
    // Statistics
    fetchStats,
    // UI state management
    setSelectedDate,
    setSelectedProvider,
    setSelectedSlot,
    setFilter,
    // Utility functions
    clearError,
    getAvailabilityForProvider,
    isSlotAvailable,
    formatSlotTime,
    resetState,
  };

  return (
    <TimeSlotContext.Provider value={contextValue}>
      {children}
    </TimeSlotContext.Provider>
  );
};

// Hook to use the time slot context
export const useTimeSlot = (): TimeSlotContextType => {
  const context = useContext(TimeSlotContext);
  if (context === undefined) {
    throw new Error('useTimeSlot must be used within a TimeSlotProvider');
  }
  return context;
};

export default TimeSlotContext;
