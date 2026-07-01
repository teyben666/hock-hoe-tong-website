/**
 * 今日名单导出（CSV / JSON 供前端 PDF）
 */

import { readAllBookings, type BookingRecord, type QueueStatus } from './db.js';
import { getClinicToday } from './clinicTime.js';

const STATUS_ZH: Record<string, string> = {
  pending: '待确认',
  confirmed: '已确认',
  cancelled: '已取消',
};

const QUEUE_ZH: Record<QueueStatus, string> = {
  not_arrived: '未到',
  waiting: '等候',
  called: '已叫号',
  in_service: '就诊中',
  done: '完成',
  skipped: '过号',
};

const GENDER_ZH: Record<string, string> = {
  female: '女',
  male: '男',
  undisclosed: '不便透露',
};

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

function mapRow(b: BookingRecord): TodayExportRow {
  return {
    queueCode: b.queueCode ?? '—',
    timeSlot: b.timeSlot === 'walk-in' || !b.timeSlot ? '现场' : b.timeSlot,
    patientName: b.patientName,
    patientPhone: b.patientPhone,
    gender: GENDER_ZH[b.gender] ?? b.gender,
    status: STATUS_ZH[b.status] ?? b.status,
    queueStatus: b.queueStatus ? (QUEUE_ZH[b.queueStatus] ?? b.queueStatus) : '—',
    source: b.source === 'walk_in' ? '现场' : '预约',
    symptoms: (b.symptoms ?? '').replace(/\r?\n/g, ' '),
  };
}

export function getTodayExportData() {
  const date = getClinicToday();
  const rows = readAllBookings()
    .filter((b) => b.date === date)
    .sort((a, b) => {
      const t = (a.timeSlot || '').localeCompare(b.timeSlot || '');
      return t !== 0 ? t : a.createdTime.localeCompare(b.createdTime);
    })
    .map(mapRow);

  return {
    date,
    clinicName: process.env.CLINIC_NAME || '福和堂 HOCK HOE TONG',
    rows,
  };
}

function csvEscape(val: string): string {
  if (/[",\n\r]/.test(val)) return `"${val.replace(/"/g, '""')}"`;
  return val;
}

export function buildTodayCsv(): string {
  const { date, clinicName, rows } = getTodayExportData();
  const lines = [
    `诊所,${csvEscape(clinicName)}`,
    `日期,${date}`,
    '',
    '排队号,时段,姓名,手机,性别,预约状态,排队状态,来源,备注',
  ];
  for (const r of rows) {
    lines.push(
      [
        r.queueCode,
        r.timeSlot,
        r.patientName,
        r.patientPhone,
        r.gender,
        r.status,
        r.queueStatus,
        r.source,
        r.symptoms,
      ]
        .map(csvEscape)
        .join(',')
    );
  }
  if (rows.length === 0) {
    lines.push('（今日暂无记录）,,,,,,,,');
  }
  return lines.join('\r\n');
}
