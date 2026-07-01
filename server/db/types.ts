export type BookingSource = 'appointment' | 'walk_in';
export type QueueStatus =
  | 'not_arrived'
  | 'waiting'
  | 'called'
  | 'in_service'
  | 'done'
  | 'skipped';

export interface BookingRecord {
  id: string;
  patientName: string;
  patientPhone: string;
  gender: 'female' | 'male' | 'undisclosed';
  birthDate: string;
  visitorCount: number;
  doctorId: string;
  treatmentId: string;
  date: string;
  timeSlot: string;
  symptoms?: string;
  wechatNotify?: boolean;
  wechatId?: string;
  createdTime: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  source?: BookingSource;
  queueCode?: string;
  queueSeq?: number;
  queueStatus?: QueueStatus;
  queuePriority?: boolean;
  checkedInAt?: string;
  calledAt?: string;
  recallCount?: number;
}

export interface PatientIdentity {
  patientName: string;
  patientPhone: string;
  gender: BookingRecord['gender'];
  birthDate: string;
  wechatId?: string;
}
