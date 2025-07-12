export interface TimeSlot {
  id: string;
  startTime: string; // ISO string format
  endTime: string; // ISO string format
  isAvailable: boolean;
  isBlocked: boolean; // For maintenance, breaks, etc.
  blockReason?: string; // Why it's blocked
  bookingId?: string; // If booked, reference to booking
  providerId: number;
  serviceId?: number; // Which service this slot is for
  duration: number; // Duration in minutes
  price?: number; // Price for this specific slot/service
}

export interface TimeSlotAvailability {
  date: string; // YYYY-MM-DD format
  providerId: number;
  slots: TimeSlot[];
  businessHours: {
    startTime: string; // HH:mm format
    endTime: string; // HH:mm format
    isOpen: boolean;
  };
  breaks: Array<{
    startTime: string;
    endTime: string;
    reason: string;
  }>;
}

export interface BookingConflict {
  type: 'overlap' | 'duration_conflict' | 'business_hours' | 'already_booked' | 'break_time';
  message: string;
  conflictingSlots?: TimeSlot[];
  suggestedAlternatives?: TimeSlot[];
}

export interface TimeSlotRequest {
  providerId: number;
  serviceId: number;
  requestedStartTime: string; // ISO string
  duration: number; // minutes
  clientId: number;
}

export interface TimeSlotReservation {
  id: string;
  timeSlotId: string;
  clientId: number;
  providerId: number;
  serviceId: number;
  startTime: string;
  endTime: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  reservedAt: string;
  expiresAt?: string; // Temporary reservation expiry
}

export interface AvailabilityFilter {
  date?: string;
  startDate?: string;
  endDate?: string;
  serviceId?: number;
  duration?: number;
  minPrice?: number;
  maxPrice?: number;
  timePreference?: 'morning' | 'afternoon' | 'evening';
}

export interface SlotGenerationConfig {
  providerId: number;
  date: string;
  businessHours: {
    startTime: string;
    endTime: string;
  };
  breaks: Array<{
    startTime: string;
    endTime: string;
    reason: string;
  }>;
  slotDuration: number; // Default slot duration in minutes
  bufferTime: number; // Buffer between appointments in minutes
  services: Array<{
    id: number;
    duration: number;
    price: number;
  }>;
}

export interface TimeSlotStats {
  totalSlots: number;
  availableSlots: number;
  bookedSlots: number;
  blockedSlots: number;
  utilizationRate: number; // Percentage
  peakHours: string[]; // Hours with most bookings
  revenue: number;
}
