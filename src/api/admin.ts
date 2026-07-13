/**
 * 店员后台 API 客户端
 */

import {
  Reservation,
  SlotAvailability,
  ScheduleConfig,
  QueueBoard,
  QueueCallMode,
  QueueStatus,
  WellnessTip,
  AdminSummary,
  AdminTrendRange,
  AdminTrendPayload,
  TodayExportPayload,
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '';
const TOKEN_KEY = 'fht_staff_token';

export function getStaffToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStaffToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStaffToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function adminRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getStaffToken();
  const res = await fetch(`${API_BASE}/api/admin${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    clearStaffToken();
    throw new Error('登录已过期，请重新登录');
  }
  if (!res.ok) {
    const errMsg = (data as { error?: string }).error || `请求失败 ${res.status}`;
    if (res.status === 404) {
      throw new Error(
        `${errMsg}（404）— 请重启 API 服务：在项目目录运行 npm run dev 或 npm run dev:api`
      );
    }
    throw new Error(errMsg);
  }
  return data as T;
}

export async function staffLogin(username: string, password: string): Promise<string> {
  const data = await fetch(`${API_BASE}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const json = await data.json().catch(() => ({}));
  if (!data.ok) {
    throw new Error((json as { error?: string }).error || '登录失败');
  }
  const token = (json as { token: string }).token;
  setStaffToken(token);
  return token;
}

export async function staffVerifySession(): Promise<boolean> {
  if (!getStaffToken()) return false;
  try {
    await adminRequest('/me');
    return true;
  } catch {
    return false;
  }
}

export async function staffFetchBookings(): Promise<Reservation[]> {
  const data = await adminRequest<{ bookings: Reservation[] }>('/bookings');
  return data.bookings;
}

export async function staffFetchSummary(): Promise<AdminSummary> {
  return adminRequest<AdminSummary>('/summary');
}

export async function staffSetHistoricalBaseline(
  historicalBaseline: number
): Promise<AdminSummary> {
  const data = await adminRequest<{ success: boolean; summary: AdminSummary }>(
    '/summary/baseline',
    {
      method: 'PATCH',
      body: JSON.stringify({ historicalBaseline }),
    }
  );
  return data.summary;
}

export async function staffFetchTrends(
  range: AdminTrendRange
): Promise<AdminTrendPayload> {
  return adminRequest<AdminTrendPayload>(
    `/summary/trends?range=${encodeURIComponent(range)}`
  );
}

export async function staffFetchTodayExportData(): Promise<TodayExportPayload> {
  return adminRequest<TodayExportPayload>('/export/today?format=json');
}

export async function staffDownloadTodayCsv(): Promise<void> {
  const token = getStaffToken();
  const res = await fetch(`${API_BASE}/api/admin/export/today?format=csv`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (res.status === 401) {
    clearStaffToken();
    throw new Error('登录已过期，请重新登录');
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error || `下载失败 ${res.status}`);
  }
  const blob = await res.blob();
  const date = new Date().toISOString().slice(0, 10);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `fht-${date}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export async function staffFetchSlots(days = 7): Promise<SlotAvailability[]> {
  const data = await adminRequest<{ days: SlotAvailability[] }>(`/slots/range?days=${days}`);
  return data.days;
}

/** 任意日期时段（可预约下个月及以后） */
export async function staffFetchSlotByDate(date: string): Promise<SlotAvailability> {
  return adminRequest<SlotAvailability>(`/slots?date=${encodeURIComponent(date)}`);
}

export async function staffCreateBooking(payload: {
  patientName: string;
  patientPhone: string;
  gender: Reservation['gender'];
  birthDate: string;
  date: string;
  timeSlot: string;
  treatmentId?: string;
  symptoms?: string;
}): Promise<Reservation> {
  const data = await adminRequest<{ booking: Reservation }>('/bookings', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data.booking;
}

export async function staffCancelBooking(id: string): Promise<void> {
  await adminRequest(`/bookings/${id}`, { method: 'DELETE' });
}

export async function staffFetchSchedule(): Promise<ScheduleConfig> {
  const data = await adminRequest<{ schedule: ScheduleConfig }>('/schedule');
  return data.schedule;
}

export async function staffSaveSchedule(schedule: ScheduleConfig): Promise<ScheduleConfig> {
  const data = await adminRequest<{ schedule: ScheduleConfig }>('/schedule', {
    method: 'PUT',
    body: JSON.stringify(schedule),
  });
  return data.schedule;
}

export async function staffFetchWellnessTips(): Promise<WellnessTip[]> {
  const data = await adminRequest<{ tips: WellnessTip[] }>('/wellness');
  return data.tips;
}

export async function staffCreateWellnessTip(
  payload: Omit<WellnessTip, 'createdAt' | 'updatedAt'>
): Promise<WellnessTip> {
  const data = await adminRequest<{ tip: WellnessTip }>('/wellness', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data.tip;
}

export async function staffUpdateWellnessTip(
  id: string,
  payload: Partial<WellnessTip>
): Promise<WellnessTip> {
  const data = await adminRequest<{ tip: WellnessTip }>(`/wellness/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return data.tip;
}

export async function staffDeleteWellnessTip(id: string): Promise<void> {
  await adminRequest(`/wellness/${id}`, { method: 'DELETE' });
}

export async function staffUploadWellnessMedia(
  kind: 'image' | 'video',
  dataUrl: string
): Promise<string> {
  const data = await adminRequest<{ url: string }>('/wellness/upload', {
    method: 'POST',
    body: JSON.stringify({ kind, dataUrl }),
  });
  return data.url;
}

export async function staffFetchQueueBoard(): Promise<QueueBoard> {
  const data = await adminRequest<{ board: QueueBoard }>('/queue/today');
  return data.board;
}

export async function staffGetQueueMode(): Promise<QueueCallMode> {
  const data = await adminRequest<{ mode: QueueCallMode }>('/queue/mode');
  return data.mode;
}

export async function staffSetQueueMode(mode: QueueCallMode): Promise<QueueCallMode> {
  const data = await adminRequest<{ mode: QueueCallMode }>('/queue/mode', {
    method: 'PUT',
    body: JSON.stringify({ mode }),
  });
  return data.mode;
}

export async function staffCheckIn(id: string): Promise<Reservation> {
  const data = await adminRequest<{ booking: Reservation }>(`/queue/check-in/${id}`, {
    method: 'POST',
  });
  return data.booking;
}

export async function staffCreateWalkIn(payload: {
  patientName: string;
  patientPhone: string;
  gender: Reservation['gender'];
  birthDate: string;
  treatmentId?: string;
  symptoms?: string;
}): Promise<Reservation> {
  const data = await adminRequest<{ booking: Reservation }>('/queue/walk-in', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data.booking;
}

export async function staffCallNext(mode?: QueueCallMode): Promise<{
  success: boolean;
  booking?: Reservation;
  message?: string;
  mode: QueueCallMode;
}> {
  return adminRequest('/queue/call-next', {
    method: 'POST',
    body: JSON.stringify(mode ? { mode } : {}),
  });
}

export async function staffCallAppointment(): Promise<{
  success: boolean;
  booking?: Reservation;
  message?: string;
}> {
  return adminRequest('/queue/call-appointment', { method: 'POST' });
}

export async function staffCallWalkIn(): Promise<{
  success: boolean;
  booking?: Reservation;
  message?: string;
}> {
  return adminRequest('/queue/call-walk-in', { method: 'POST' });
}

export async function staffCallById(id: string): Promise<Reservation> {
  const data = await adminRequest<{ booking: Reservation }>(`/queue/call/${id}`, {
    method: 'POST',
  });
  return data.booking;
}

export async function staffSetQueuePriority(id: string): Promise<Reservation> {
  const data = await adminRequest<{ booking: Reservation }>(`/queue/priority/${id}`, {
    method: 'POST',
  });
  return data.booking;
}

export async function staffSetQueueStatus(
  id: string,
  queueStatus: QueueStatus
): Promise<Reservation> {
  const data = await adminRequest<{ booking: Reservation }>(`/queue/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ queueStatus }),
  });
  return data.booking;
}

export async function staffRecallQueue(id: string): Promise<Reservation> {
  const data = await adminRequest<{ booking: Reservation }>(`/queue/recall/${id}`, {
    method: 'POST',
  });
  return data.booking;
}

export async function staffRequeue(id: string): Promise<Reservation> {
  const data = await adminRequest<{ booking: Reservation }>(`/queue/requeue/${id}`, {
    method: 'POST',
  });
  return data.booking;
}
