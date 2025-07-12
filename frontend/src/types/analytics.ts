export interface AnalyticsData {
  totalRevenue: number;
  totalAppointments: number;
  averageRating: number;
  completionRate: number;
  noShowRate: number;
  newClientsCount: number;
  returningClientsCount: number;
  
  mostBookedService: {
    id: number;
    name: string;
    bookingCount: number;
  } | null;
  
  revenueByPeriod: RevenueData[];
  appointmentsByStatus: AppointmentStatusData[];
  topServices: ServiceAnalytics[];
  
  // Enhanced analytics
  revenueGrowth: number; // Percentage change from previous period
  clientRetentionRate: number;
  averageBookingValue: number;
  peakBusinessHours: { start: string; end: string };
  appointmentsByTime: { hour: number; count: number }[];
  appointmentsByDay: { day: string; count: number }[];
  
  // Financial metrics
  monthlyRecurringRevenue: number;
  pendingPayouts: number;
  availableForPayout: number;
  
  // Goals and targets
  monthlyTarget?: number;
  targetProgress: number;
}

export interface RevenueData {
  period: string; // Date string (YYYY-MM-DD)
  revenue: number;
  appointments: number;
}

export interface AppointmentStatusData {
  status: import('./index').AppointmentStatus;
  count: number;
  percentage: number;
}

export interface ServiceAnalytics {
  serviceId: number;
  serviceName: string;
  bookingCount: number;
  totalRevenue: number;
  averageRating: number;
}

export enum AnalyticsPeriod {
  WEEK = 'week',
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year',
}

export interface AnalyticsRequest {
  period: AnalyticsPeriod;
  startDate?: string;
  endDate?: string;
}

export interface EarningsData {
  totalEarnings: number;
  pendingPayouts: number;
  availableForPayout: number;
  lastPayoutDate?: string;
  nextPayoutDate?: string;
  
  // Breakdown by period
  dailyEarnings: { date: string; amount: number }[];
  weeklyEarnings: { week: string; amount: number }[];
  monthlyEarnings: { month: string; amount: number }[];
  
  // Payment methods and fees
  platformFee: number;
  processingFee: number;
  netEarnings: number;
  
  // Tax information
  totalTaxableIncome: number;
  estimatedTaxes: number;
}

export interface ClientInsight {
  clientId: number;
  clientName: string;
  profilePictureUrl?: string;
  totalAppointments: number;
  totalSpent: number;
  lastAppointment: string;
  averageRating: number;
  status: 'active' | 'inactive' | 'new';
  appointmentHistory: {
    date: string;
    serviceName: string;
    amount: number;
    status: string;
  }[];
}

export interface AppointmentMetrics {
  totalUpcoming: number;
  totalToday: number;
  totalThisWeek: number;
  totalThisMonth: number;
  
  // Status breakdown
  confirmed: number;
  pending: number;
  completed: number;
  cancelled: number;
  noShow: number;
  
  // Time-based metrics
  averageBookingLeadTime: number;
  cancellationRate: number;
  rescheduleRate: number;
  
  // Revenue impact
  upcomingRevenue: number;
  lostRevenue: number;
}
