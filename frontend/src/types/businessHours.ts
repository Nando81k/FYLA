export interface BusinessHours {
  id: number;
  providerId: number;
  dayOfWeek: DayOfWeek;
  openTime: string; // Format: "HH:mm" (24-hour format)
  closeTime: string; // Format: "HH:mm" (24-hour format)
  isOpen: boolean;
  createdAt: string;
  updatedAt: string;
}

export enum DayOfWeek {
  Sunday = 0,
  Monday = 1,
  Tuesday = 2,
  Wednesday = 3,
  Thursday = 4,
  Friday = 5,
  Saturday = 6,
}

export interface BusinessHoursRequest {
  dayOfWeek: DayOfWeek;
  openTime: string;
  closeTime: string;
  isOpen: boolean;
}

export interface UpdateBusinessHoursRequest {
  businessHours: BusinessHoursRequest[];
}

export const dayNames = [
  'Sunday',
  'Monday', 
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export const defaultBusinessHours: BusinessHoursRequest[] = [
  { dayOfWeek: DayOfWeek.Sunday, openTime: '09:00', closeTime: '17:00', isOpen: false },
  { dayOfWeek: DayOfWeek.Monday, openTime: '09:00', closeTime: '17:00', isOpen: true },
  { dayOfWeek: DayOfWeek.Tuesday, openTime: '09:00', closeTime: '17:00', isOpen: true },
  { dayOfWeek: DayOfWeek.Wednesday, openTime: '09:00', closeTime: '17:00', isOpen: true },
  { dayOfWeek: DayOfWeek.Thursday, openTime: '09:00', closeTime: '17:00', isOpen: true },
  { dayOfWeek: DayOfWeek.Friday, openTime: '09:00', closeTime: '17:00', isOpen: true },
  { dayOfWeek: DayOfWeek.Saturday, openTime: '09:00', closeTime: '17:00', isOpen: false },
];
