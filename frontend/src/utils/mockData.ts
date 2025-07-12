import { AnalyticsData, AppointmentStatus, AnalyticsPeriod } from '@/types';

export const mockAnalyticsData: AnalyticsData = {
  totalRevenue: 2450.00,
  totalAppointments: 34,
  averageRating: 4.8,
  completionRate: 92.5,
  noShowRate: 5.2,
  newClientsCount: 8,
  returningClientsCount: 26,
  
  mostBookedService: {
    id: 1,
    name: 'Haircut & Style',
    bookingCount: 12,
  },
  
  revenueByPeriod: [
    { period: '2025-07-01', revenue: 350.00, appointments: 5 },
    { period: '2025-07-02', revenue: 420.00, appointments: 6 },
    { period: '2025-07-03', revenue: 280.00, appointments: 4 },
    { period: '2025-07-04', revenue: 500.00, appointments: 7 },
    { period: '2025-07-05', revenue: 380.00, appointments: 5 },
    { period: '2025-07-06', revenue: 320.00, appointments: 4 },
    { period: '2025-07-07', revenue: 200.00, appointments: 3 },
  ],
  
  appointmentsByStatus: [
    {
      status: AppointmentStatus.COMPLETED,
      count: 28,
      percentage: 82.4,
    },
    {
      status: AppointmentStatus.CONFIRMED,
      count: 3,
      percentage: 8.8,
    },
    {
      status: AppointmentStatus.PENDING,
      count: 2,
      percentage: 5.9,
    },
    {
      status: AppointmentStatus.CANCELLED,
      count: 1,
      percentage: 2.9,
    },
    {
      status: AppointmentStatus.NO_SHOW,
      count: 0,
      percentage: 0,
    },
  ],
  
  topServices: [
    {
      serviceId: 1,
      serviceName: 'Haircut & Style',
      bookingCount: 12,
      totalRevenue: 900.00,
      averageRating: 4.8,
    },
    {
      serviceId: 2,
      serviceName: 'Hair Color',
      bookingCount: 8,
      totalRevenue: 800.00,
      averageRating: 4.9,
    },
    {
      serviceId: 3,
      serviceName: 'Beard Trim',
      bookingCount: 6,
      totalRevenue: 300.00,
      averageRating: 4.7,
    },
    {
      serviceId: 4,
      serviceName: 'Hair Wash',
      bookingCount: 5,
      totalRevenue: 250.00,
      averageRating: 4.6,
    },
    {
      serviceId: 5,
      serviceName: 'Styling',
      bookingCount: 3,
      totalRevenue: 200.00,
      averageRating: 4.5,
    },
  ],
  
  // Enhanced analytics fields
  revenueGrowth: 15.3,
  clientRetentionRate: 78.5,
  averageBookingValue: 72.06,
  peakBusinessHours: { start: '14:00', end: '17:00' },
  appointmentsByTime: Array.from({ length: 24 }, (_, hour) => ({
    hour,
    count: hour >= 9 && hour <= 17 ? Math.floor(Math.random() * 5) + 1 : 0,
  })),
  appointmentsByDay: [
    { day: 'Monday', count: 5 },
    { day: 'Tuesday', count: 6 },
    { day: 'Wednesday', count: 4 },
    { day: 'Thursday', count: 7 },
    { day: 'Friday', count: 8 },
    { day: 'Saturday', count: 4 },
    { day: 'Sunday', count: 0 },
  ],
  
  // Financial metrics
  monthlyRecurringRevenue: 1800.00,
  pendingPayouts: 540.50,
  availableForPayout: 890.25,
  
  // Goals and targets
  monthlyTarget: 3000,
  targetProgress: 81.7,
};
