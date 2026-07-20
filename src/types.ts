/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum TreatmentCategory {
  ACUPUNCTURE = '针灸调理',
  HERBAL_MEDICINE = '中草药调理',
  MASSAGE_TUINA = '中医推拿',
  MOXIBUSTION = '温通温灸',
  CUPPING_GUASHA = '拔罐刮痧',
}

export type Gender = 'female' | 'male' | 'undisclosed';

export type BookingSource = 'appointment' | 'walk_in';

export type QueueStatus =
  | 'not_arrived'
  | 'waiting'
  | 'called'
  | 'in_service'
  | 'done'
  | 'skipped';

export type QueueCallMode = 'standard' | 'appointment' | 'walkin';

export interface Doctor {
  id: string;
  name: string;
  title: string;
  avatar: string;
  intro: string;
  specialties: string[];
  treatmentPlans: string[];
  schedule: string[];
  restDays: string;
  rating: number;
}

export interface Treatment {
  id: string;
  /** 英文副标题（可选） */
  nameEn?: string;
  /** 短标语（可选） */
  tagline?: string;
  name: string;
  operation: string;
  effects: string;
  suitableFor: string;
  iconName: string;
  imageUrl?: string;
  videoUrl?: string;
  sortOrder?: number;
  enabled?: boolean;
}

export interface AboutGalleryItem {
  id: string;
  imageUrl: string;
  captionZh?: string;
  captionEn?: string;
  sortOrder: number;
  enabled: boolean;
}

export interface Reservation {
  id: string;
  patientName: string;
  patientPhone: string;
  gender: Gender;
  birthDate: string;
  visitorCount: number;
  age?: number;
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

export type QueueAnnouncementKind = 'call' | 'recall';

export interface QueueAnnouncement {
  bookingId: string;
  queueCode: string;
  at: string;
  kind: QueueAnnouncementKind;
}

export interface QueueBoardCurrent {
  id: string;
  queueCode?: string;
  maskedName: string;
  source: BookingSource;
  queueStatus: QueueStatus;
}

export interface QueueBoardEntry {
  id: string;
  queueCode?: string;
  timeSlot?: string | null;
  maskedName: string;
  queuePriority?: boolean;
  queueStatus: QueueStatus;
  patientName?: string;
  patientPhone?: string;
  gender?: Gender;
  birthDate?: string;
  source?: BookingSource;
}

export interface QueueBoard {
  date: string;
  mode: QueueCallMode;
  nowMinutes: number;
  lastAnnouncement?: QueueAnnouncement | null;
  current: QueueBoardCurrent | null;
  waitingAppointment: QueueBoardEntry[];
  waitingWalkIn: QueueBoardEntry[];
  upcomingAppointment: QueueBoardEntry[];
  skippedToday?: QueueBoardEntry[];
  calledWaiting?: QueueBoardEntry[];
  allToday: QueueBoardEntry[];
}

export interface QueueStatusEntry {
  id: string;
  queueCode?: string;
  source: BookingSource;
  timeSlot: string | null;
  queueStatus: QueueStatus;
  queuePriority?: boolean;
  ahead: number | null;
  callable: boolean;
  patientName: string;
}

export interface QueuePhoneStatus {
  found: boolean;
  date: string;
  mode?: QueueCallMode;
  current?: QueueBoardCurrent | null;
  entries?: QueueStatusEntry[];
}

export interface Feedback {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  treatmentName: string;
  date: string;
}

export interface WellnessTip {
  id: string;
  tagZh: string;
  tagEn: string;
  titleZh: string;
  titleEn: string;
  bodyZh: string;
  bodyEn: string;
  imageUrl?: string;
  videoUrl?: string;
  sortOrder: number;
  enabled: boolean;
  /** 展开全文后是否显示「收起」；false = Facebook 式仅展开不可收起 */
  allowCollapse?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TimeSlot {
  time: string;
  booked: boolean;
  closed?: boolean;
}

export interface SlotAvailability {
  date: string;
  closed?: boolean;
  partialClosed?: boolean;
  slots: TimeSlot[];
}

export interface TimeBlock {
  id: string;
  weekday?: number;
  date?: string;
  start: string;
  end: string;
  note?: string;
}

export interface ScheduleConfig {
  weekdays: number[];
  dates: string[];
  blocks: TimeBlock[];
}

/** 店员后台「总览」 */
export interface AdminSummary {
  today: string;
  isOffDay: boolean;
  todayBooked: number;
  todayDone: number;
  todayWaiting: number;
  queueCurrent: { code: string; maskedName: string } | null;
  nextAppointment: { timeSlot: string; maskedName: string } | null;
  lifetime: {
    systemDone: number;
    historicalBaseline: number;
    totalDisplayed: number;
    systemSince: string | null;
  };
  monthDone: number;
  todayNotArrived: number;
  todaySkipped: number;
  todayWalkIn: number;
  queueMode: QueueCallMode;
  queueModeLabel: string;
  nextAppointments: { id: string; timeSlot: string; maskedName: string }[];
  todaySlots: { booked: number; available: number; total: number; closed: boolean };
  tomorrow: { date: string; isOffDay: boolean; booked: number };
  weekAhead: { date: string; booked: number; isOffDay: boolean }[];
  recentDone: { queueCode?: string; maskedName: string; finishedAt: string }[];
  todayByTreatment: { treatmentId: string; name: string; count: number }[];
  todayCancelled: number;
  todayUniquePatients: number;
  todayVisitCount: number;
  avgWaitMinutes: number | null;
  monthCompare: {
    thisMonth: number;
    lastMonth: number;
    delta: number;
    deltaPercent: number;
  };
  wellness: { enabledCount: number; totalCount: number };
  nextOffDay: { date: string; label: string } | null;
}

export type AdminTrendRange = '7d' | '30d' | 'month' | 'year';

export interface AdminTrendPoint {
  label: string;
  date: string;
  done: number;
}

export interface AdminTrendPayload {
  range: AdminTrendRange;
  points: AdminTrendPoint[];
}

export interface TodayExportRow {
  queueCode: string;
  timeSlot: string;
  patientName: string;
  patientPhone: string;
  gender: string;
  status: string;
  queueStatus: string;
  source: string;
  symptoms: string;
}

export interface TodayExportPayload {
  date: string;
  clinicName: string;
  rows: TodayExportRow[];
}
