/**
 * 叫号模式与最近一次广播（供大屏提示音 / 重叫）
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getClinicToday } from './clinicTime.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATE_FILE = path.join(__dirname, 'data', 'queue-state.json');

export type QueueCallMode = 'standard' | 'appointment' | 'walkin';
export type QueueAnnouncementKind = 'call' | 'recall';

export interface QueueAnnouncement {
  bookingId: string;
  queueCode: string;
  at: string;
  kind: QueueAnnouncementKind;
}

interface QueueStateFile {
  date: string;
  mode: QueueCallMode;
  lastAnnouncement?: QueueAnnouncement | null;
}

function readFile(): QueueStateFile {
  try {
    if (!fs.existsSync(STATE_FILE)) return { date: '', mode: 'standard' };
    const raw = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8')) as QueueStateFile;
    return {
      date: raw.date ?? '',
      mode: raw.mode ?? 'standard',
      lastAnnouncement: raw.lastAnnouncement ?? null,
    };
  } catch {
    return { date: '', mode: 'standard' };
  }
}

function writeFile(state: QueueStateFile): void {
  const dir = path.dirname(STATE_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
}

function ensureTodayState(): QueueStateFile {
  const today = getClinicToday();
  const state = readFile();
  if (state.date !== today) {
    const fresh: QueueStateFile = { date: today, mode: 'standard', lastAnnouncement: null };
    writeFile(fresh);
    return fresh;
  }
  return state;
}

export function getQueueCallMode(): QueueCallMode {
  return ensureTodayState().mode;
}

export function setQueueCallMode(mode: QueueCallMode): QueueCallMode {
  const state = ensureTodayState();
  writeFile({ ...state, mode });
  return mode;
}

export function getLastAnnouncement(): QueueAnnouncement | null {
  return ensureTodayState().lastAnnouncement ?? null;
}

export function recordAnnouncement(
  bookingId: string,
  queueCode: string,
  kind: QueueAnnouncementKind
): QueueAnnouncement {
  const state = ensureTodayState();
  const announcement: QueueAnnouncement = {
    bookingId,
    queueCode,
    at: new Date().toISOString(),
    kind,
  };
  writeFile({ ...state, lastAnnouncement: announcement });
  return announcement;
}
