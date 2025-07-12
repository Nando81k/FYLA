// Advanced Booking & Scheduling System Types

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
  RESCHEDULED = 'rescheduled',
}

export enum RecurrenceType {
  NONE = 'none',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
  MONTHLY = 'monthly',
  CUSTOM = 'custom',
}

export enum BookingType {
  SINGLE = 'single',
  RECURRING = 'recurring',
  PACKAGE = 'package',
  MULTIPLE_SERVICES = 'multiple_services',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PARTIAL = 'partial',
  PAID = 'paid',
  REFUNDED = 'refunded',
  FAILED = 'failed',
}

export enum WaitlistStatus {
  ACTIVE = 'active',
  NOTIFIED = 'notified',
  EXPIRED = 'expired',
  CONVERTED = 'converted',
}

export interface ServiceDetails {
  id: string;
  name: string;
  description: string;
  duration: number; // in minutes
  price: number;
  category: string;
  providerId: number;
  isActive: boolean;
  bookingBuffer: number; // minutes between bookings
  advanceBookingDays: number; // how far in advance can be booked
  cancellationPolicy: CancellationPolicy;
  addOns?: ServiceAddOn[];
}

export interface ServiceAddOn {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number; // additional time
  isRequired: boolean;
}

export interface CancellationPolicy {
  id: string;
  name: string;
  description: string;
  noticePeriodHours: number; // minimum hours notice required
  penaltyPercentage: number; // 0-100
  refundPolicy: string;
}

export interface TimeSlot {
  startTime: string; // ISO string
  endTime: string; // ISO string
  isAvailable: boolean;
  isBooked: boolean;
  bookingId?: string;
  price?: number; // dynamic pricing
  reason?: string; // if not available
}

export interface AvailabilityRule {
  id: string;
  providerId: number;
  dayOfWeek: number; // 0-6, Sunday = 0
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  isActive: boolean;
  effectiveFrom: string;
  effectiveTo?: string;
  timezone: string;
  breakIntervals?: BreakInterval[];
}

export interface BreakInterval {
  id: string;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  name: string; // e.g., "Lunch Break"
  isRecurring: boolean;
}

export interface AvailabilityOverride {
  id: string;
  providerId: number;
  date: string; // YYYY-MM-DD
  isAvailable: boolean;
  customHours?: {
    startTime: string;
    endTime: string;
  };
  reason: string;
}

export interface BookingRequest {
  id?: string;
  clientId: number;
  providerId: number;
  serviceIds: string[];
  requestedDateTime: string;
  duration: number; // total duration in minutes
  type: BookingType;
  notes?: string;
  specialRequests?: string;
  addOnIds?: string[];
  recurrenceConfig?: RecurrenceConfig;
  packageConfig?: PackageConfig;
  paymentMethod?: string;
  estimatedTotal: number;
}

export interface RecurrenceConfig {
  type: RecurrenceType;
  interval: number; // every X days/weeks/months
  daysOfWeek?: number[]; // for weekly/biweekly
  endDate?: string;
  maxOccurrences?: number;
  customPattern?: string;
}

export interface PackageConfig {
  packageId: string;
  totalSessions: number;
  sessionsUsed: number;
  expiryDate?: string;
  transferrable: boolean;
}

export interface Booking {
  id: string;
  clientId: number;
  providerId: number;
  serviceIds: string[];
  services: ServiceDetails[];
  status: BookingStatus;
  type: BookingType;
  
  // Timing
  scheduledDateTime: string;
  duration: number;
  actualStartTime?: string;
  actualEndTime?: string;
  
  // Client & Provider info
  client: {
    id: number;
    fullName: string;
    email: string;
    phone: string;
    profilePictureUrl?: string;
    preferences?: ClientPreferences;
  };
  
  provider: {
    id: number;
    businessName: string;
    fullName: string;
    email: string;
    phone: string;
    profilePictureUrl?: string;
    address: string;
  };
  
  // Booking details
  notes?: string;
  specialRequests?: string;
  addOns: ServiceAddOn[];
  
  // Recurrence & Package
  recurrenceConfig?: RecurrenceConfig;
  packageConfig?: PackageConfig;
  parentBookingId?: string; // for recurring bookings
  childBookingIds?: string[]; // for parent booking
  
  // Payment
  paymentStatus: PaymentStatus;
  totalAmount: number;
  paidAmount: number;
  paymentDetails?: PaymentDetails;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  
  // Reminders
  remindersSent: ReminderRecord[];
  
  // Reviews
  clientReview?: Review;
  providerReview?: Review;
}

export interface ClientPreferences {
  preferredTimeSlots: string[]; // ['morning', 'afternoon', 'evening']
  communicationMethod: 'email' | 'sms' | 'push' | 'all';
  reminderSchedule: number[]; // hours before appointment [24, 2]
  specialInstructions?: string;
  allergies?: string[];
  accessibilityNeeds?: string;
}

export interface PaymentDetails {
  id: string;
  method: 'card' | 'cash' | 'bank_transfer' | 'wallet';
  transactionId?: string;
  cardLast4?: string;
  depositAmount?: number;
  depositPaidAt?: string;
  balanceAmount?: number;
  balancePaidAt?: string;
  refundAmount?: number;
  refundedAt?: string;
}

export interface ReminderRecord {
  id: string;
  type: 'email' | 'sms' | 'push';
  sentAt: string;
  hoursBeforeAppointment: number;
  content: string;
  status: 'sent' | 'delivered' | 'failed';
}

export interface Review {
  id: string;
  rating: number; // 1-5
  comment?: string;
  photos?: string[];
  createdAt: string;
  criteria?: ReviewCriteria;
}

export interface ReviewCriteria {
  quality: number;
  punctuality: number;
  communication: number;
  cleanliness: number;
  value: number;
}

export interface WaitlistEntry {
  id: string;
  clientId: number;
  providerId: number;
  serviceIds: string[];
  preferredDateTime?: string;
  preferredDateRange?: {
    startDate: string;
    endDate: string;
  };
  preferredTimeSlots: string[]; // ['morning', 'afternoon']
  status: WaitlistStatus;
  priority: number; // higher number = higher priority
  createdAt: string;
  notifiedAt?: string;
  expiresAt: string;
  notes?: string;
}

export interface BookingPackage {
  id: string;
  providerId: number;
  name: string;
  description: string;
  serviceIds: string[];
  totalSessions: number;
  validityDays: number; // how long package is valid
  price: number;
  discountPercentage: number;
  isTransferrable: boolean;
  terms: string;
  isActive: boolean;
  createdAt: string;
}

export interface BookingCalendar {
  date: string; // YYYY-MM-DD
  dayOfWeek: number;
  isAvailable: boolean;
  timeSlots: TimeSlot[];
  totalBookings: number;
  totalRevenue: number;
  specialEvents?: CalendarEvent[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  type: 'holiday' | 'vacation' | 'special_hours' | 'maintenance';
  startDate: string;
  endDate?: string;
  allDay: boolean;
  description?: string;
  affectsAvailability: boolean;
}

export interface BookingStats {
  totalBookings: number;
  confirmedBookings: number;
  pendingBookings: number;
  cancelledBookings: number;
  completedBookings: number;
  noShowBookings: number;
  revenue: {
    total: number;
    pending: number;
    confirmed: number;
  };
  averageBookingValue: number;
  popularServices: Array<{
    serviceId: string;
    serviceName: string;
    bookingCount: number;
    revenue: number;
  }>;
  peakHours: Array<{
    hour: number;
    bookingCount: number;
  }>;
  clientRetention: {
    newClients: number;
    returningClients: number;
    retentionRate: number;
  };
}

export interface BookingFilter {
  providerId?: number;
  clientId?: number;
  status?: BookingStatus[];
  type?: BookingType[];
  serviceIds?: string[];
  dateFrom?: string;
  dateTo?: string;
  paymentStatus?: PaymentStatus[];
  limit?: number;
  offset?: number;
  sortBy?: 'date' | 'created' | 'amount' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface AvailabilityQuery {
  providerId: number;
  serviceIds: string[];
  dateFrom: string;
  dateTo: string;
  duration?: number;
  preferredTimes?: string[]; // ['morning', 'afternoon', 'evening']
  excludeBookingId?: string; // for rescheduling
}

export interface BookingConflict {
  type: 'overlap' | 'buffer_violation' | 'outside_hours' | 'unavailable';
  message: string;
  conflictingBookingId?: string;
  suggestedAlternatives?: TimeSlot[];
}

export interface BookingValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  conflicts: BookingConflict[];
  estimatedTotal: number;
  breakdown: PriceBreakdown;
}

export interface PriceBreakdown {
  services: Array<{
    serviceId: string;
    serviceName: string;
    price: number;
    duration: number;
  }>;
  addOns: Array<{
    addOnId: string;
    addOnName: string;
    price: number;
  }>;
  subtotal: number;
  taxes: number;
  fees: number;
  discounts: number;
  total: number;
}

// API Response types
export interface BookingResponse {
  bookings: Booking[];
  total: number;
  hasMore: boolean;
  stats?: BookingStats;
}

export interface AvailabilityResponse {
  calendar: BookingCalendar[];
  availability: TimeSlot[];
  conflicts: BookingConflict[];
  suggestions: TimeSlot[];
}

export interface BookingActionResponse {
  success: boolean;
  booking?: Booking;
  message: string;
  errors?: string[];
  nextSteps?: string[];
}
