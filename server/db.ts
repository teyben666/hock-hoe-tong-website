/**
 * SQLite persistence for bookings (Phase 1)
 */

import { isFullOffDay, isSlotClosed } from './scheduleConfig.js';
import { isSlotPast } from './clinicTime.js';
import { initDatabase, migrateFromLegacyJson } from './db/init.js';
import {
  cancelBookingInDb,
  confirmBookingInDb,
  importBookingRecords,
  insertBookingRecord,
  isSlotBookedInDb,
  replaceAllBookings,
  selectActiveBookings,
  selectAllBookings,
  selectBookingById,
  selectBookingsByDate,
  selectBookingsByPhone,
  updateBookingInDb,
  upsertPatientFromIdentity,
} from './db/bookingRepo.js';

initDatabase();

export type {
  BookingRecord,
  BookingSource,
  QueueStatus,
} from './db/types.js';

import type { BookingRecord } from './db/types.js';

export function readAllBookings(): BookingRecord[] {
  return selectAllBookings();
}

export function writeAllBookings(records: BookingRecord[]): void {
  replaceAllBookings(records);
}

export function getAllBookings(): BookingRecord[] {
  return selectActiveBookings();
}

export function getBookingsByPhone(phone: string): BookingRecord[] {
  return selectBookingsByPhone(phone);
}

export function getBookingsByDate(date: string): BookingRecord[] {
  return selectBookingsByDate(date);
}

export function findBooking(id: string): BookingRecord | undefined {
  return selectBookingById(id);
}

export function isSlotBooked(date: string, timeSlot: string): boolean {
  return isSlotBookedInDb(date, timeSlot);
}

export function insertBooking(record: BookingRecord): BookingRecord {
  return insertBookingRecord(record);
}

export function createBooking(
  data: Omit<BookingRecord, 'id' | 'createdTime' | 'status'>
): BookingRecord {
  if (isFullOffDay(data.date)) {
    throw new Error('OFF_DAY');
  }
  if (isSlotClosed(data.date, data.timeSlot)) {
    throw new Error('OFF_SLOT');
  }
  if (isSlotPast(data.date, data.timeSlot)) {
    throw new Error('SLOT_PAST');
  }
  if (isSlotBooked(data.date, data.timeSlot)) {
    throw new Error('SLOT_TAKEN');
  }

  const now = new Date().toISOString();
  upsertPatientFromIdentity(
    {
      patientName: data.patientName,
      patientPhone: data.patientPhone,
      gender: data.gender,
      birthDate: data.birthDate,
    },
    data.wechatId
  );

  const record: BookingRecord = {
    ...data,
    patientPhone: data.patientPhone.replace(/[\s-]/g, ''),
    id: `bk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdTime: now,
    status: 'pending',
    source: 'appointment',
    queueStatus: 'not_arrived',
    queuePriority: false,
  };

  try {
    return insertBookingRecord(record);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (message.includes('UNIQUE constraint failed')) {
      throw new Error('SLOT_TAKEN');
    }
    throw e;
  }
}

export function cancelBooking(id: string): boolean {
  return cancelBookingInDb(id);
}

export function confirmBooking(id: string): BookingRecord | null {
  return confirmBookingInDb(id);
}

export function updateBooking(
  id: string,
  patch: Partial<BookingRecord>
): BookingRecord | null {
  return updateBookingInDb(id, patch);
}

/** Standalone JSON → SQLite import (also runs automatically on first startup). */
export function migrateLegacyBookingsJson(): { imported: number } {
  return migrateFromLegacyJson();
}
