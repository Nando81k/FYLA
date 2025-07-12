import { User, Service, AppointmentStatus } from './index';

export interface Appointment {
  id: number;
  clientId: number;
  providerId: number;
  scheduledStartTime: string;
  scheduledEndTime: string;
  status: AppointmentStatus;
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
  client?: User;
  provider?: User;
  services: AppointmentService[];
  notes?: string;
  review?: import('./index').Review; // Reference to review if appointment has been reviewed
}

export interface AppointmentService {
  id: number;
  appointmentId: number;
  serviceId: number;
  priceAtBooking: number;
  service: Service;
}

export interface CreateAppointmentRequest {
  providerId: number;
  serviceIds: number[];
  scheduledStartTime: string;
  notes?: string;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  reason?: string; // e.g., "Already booked", "Outside business hours"
}

export interface AvailabilityRequest {
  providerId: number;
  date: string; // Format: YYYY-MM-DD
  serviceIds?: number[];
}

export interface UpdateAppointmentRequest {
  status?: AppointmentStatus;
  notes?: string;
  scheduledStartTime?: string;
}
