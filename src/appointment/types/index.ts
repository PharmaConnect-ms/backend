import { User } from '@/users/user.entity';

export interface IDoctorSchedule {
  id: string;
  doctor: User;
  date: Date;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  isActive: boolean;
  timeSlots?: ITimeSlot[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ITimeSlot {
  id: string;
  doctorSchedule: IDoctorSchedule;
  date: Date;
  startTime: string;
  endTime: string;
  status: TimeSlotStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAppointment {
  id: string;
  appointmentNo: string;
  type: string;
  patient: User;
  doctor: User;
  timeSlot: ITimeSlot;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum TimeSlotStatus {
  AVAILABLE = 'available',
  BOOKED = 'booked',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

// Helper types for better type safety
export type DoctorScheduleCreateInput = Omit<IDoctorSchedule, 'id' | 'createdAt' | 'updatedAt' | 'timeSlots'>;
export type TimeSlotCreateInput = Omit<ITimeSlot, 'id' | 'createdAt' | 'updatedAt'>;

// Response DTOs with proper typing
export interface ITimeSlotWithAppointment extends ITimeSlot {
  appointment?: {
    id: string;
    appointmentNo: string;
    type: string;
    patient: {
      id: number;
      username: string;
    };
  } | null;
}

// Type for appointment data fetched from database
export interface AppointmentData {
  id: string;
  appointmentNo: number;
  type: string;
  patient: {
    id: number;
    username: string;
  };
}
