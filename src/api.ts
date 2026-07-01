/**
 * API client for booking backend
 */

import {
  QueueBoard,
  QueuePhoneStatus,
  Reservation,
  SlotAvailability,
  WellnessTip,
} from './types';

const API_BASE = import.meta.env.VITE_API_URL || '';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `请求失败 ${res.status}`);
  }
  return data as T;
}

export async function fetchSlotsRange(days = 7): Promise<SlotAvailability[]> {
  const data = await request<{ days: SlotAvailability[] }>(
    `/api/slots/range?days=${days}`
  );
  return data.days;
}

export async function createBooking(
  payload: Omit<Reservation, 'id' | 'createdTime' | 'status'>
): Promise<Reservation> {
  const data = await request<{ booking: Reservation }>('/api/bookings', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data.booking;
}

export async function queryBookingsByPhone(phone: string): Promise<Reservation[]> {
  const data = await request<{ bookings: Reservation[] }>(
    `/api/bookings?phone=${encodeURIComponent(phone)}`
  );
  return data.bookings;
}

export async function cancelBooking(id: string): Promise<void> {
  await request(`/api/bookings/${id}`, { method: 'DELETE' });
}

export async function fetchWellnessTips(): Promise<WellnessTip[]> {
  const data = await request<{ tips: WellnessTip[] }>('/api/wellness');
  return data.tips;
}

export async function fetchQueueBoard(): Promise<QueueBoard> {
  return request<QueueBoard>('/api/queue/today');
}

export async function submitPublicWalkIn(payload: {
  patientName: string;
  patientPhone: string;
  gender: Reservation['gender'];
  birthDate: string;
}): Promise<{ queueCode: string; booking: Reservation }> {
  const data = await request<{
    success: boolean;
    queueCode: string;
    booking: Reservation;
  }>('/api/queue/walk-in', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return { queueCode: data.queueCode, booking: data.booking };
}

export async function fetchQueueStatusByPhone(phone: string): Promise<QueuePhoneStatus> {
  return request<QueuePhoneStatus>(
    `/api/queue/status?phone=${encodeURIComponent(phone)}`
  );
}

export async function checkApiHealth(): Promise<boolean> {
  try {
    await request<{ ok: boolean }>('/api/health');
    return true;
  } catch {
    return false;
  }
}
