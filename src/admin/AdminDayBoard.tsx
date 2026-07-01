/**
 * 按日日程：一眼看清每个时段有谁 / 空闲 / 休息
 */

import React, { useMemo, useState } from 'react';
import { Reservation, SlotAvailability } from '../types';
import { AdminDatePicker } from './AdminDatePicker';
import { AdminWeekStrip } from './AdminWeekStrip';
import { PhoneActions } from './PhoneActions';
import { Trash2, ChevronDown, ChevronUp, User } from 'lucide-react';
import { generateAdminTimeSlots } from './adminDateUtils';
import { formatPatientIdentity } from '../utils/patientLabels';

function needsCheckIn(booking: Reservation): boolean {
  if (booking.timeSlot === 'walk-in') return false;
  return (
    !booking.queueCode ||
    booking.queueStatus === 'not_arrived' ||
    !booking.queueStatus
  );
}

interface AdminDayBoardProps {
  viewDate: string;
  onViewDateChange: (date: string) => void;
  bookings: Reservation[];
  dayDetail: SlotAvailability | null;
  initialLoading: boolean;
  syncing: boolean;
  onCancel: (id: string) => void;
  onCheckIn: (id: string) => void | Promise<void>;
  isClinicToday: boolean;
  treatmentName: (id: string) => string;
  countByDate: Map<string, number>;
}

export const AdminDayBoard: React.FC<AdminDayBoardProps> = ({
  viewDate,
  onViewDateChange,
  bookings,
  dayDetail,
  initialLoading,
  syncing,
  onCancel,
  onCheckIn,
  isClinicToday,
  treatmentName,
  countByDate,
}) => {
  const [showAllList, setShowAllList] = useState(false);

  const dayBookings = useMemo(
    () =>
      bookings.filter((b) => b.date === viewDate && b.status !== 'cancelled'),
    [bookings, viewDate]
  );

  const bookingByTime = useMemo(() => {
    const m = new Map<string, Reservation>();
    dayBookings.forEach((b) => m.set(b.timeSlot, b));
    return m;
  }, [dayBookings]);

  const rows = useMemo(() => {
    const slots = dayDetail?.slots ?? generateAdminTimeSlots().map((time) => ({
      time,
      booked: bookingByTime.has(time),
      closed: false,
    }));
    return slots.map((slot) => ({
      ...slot,
      booking: bookingByTime.get(slot.time),
    }));
  }, [dayDetail, bookingByTime]);

  const dayClosed = dayDetail?.closed ?? false;
  const bookedCount = dayBookings.length;
  const freeCount = rows.filter((r) => !r.closed && !r.booking).length;
  const showSkeleton = initialLoading && bookings.length === 0;

  return (
    <div className="space-y-4">
      <AdminWeekStrip
        viewDate={viewDate}
        onSelectDate={onViewDateChange}
        countByDate={countByDate}
      />

      <AdminDatePicker
        viewDate={viewDate}
        onViewDateChange={onViewDateChange}
        label="查看哪一天的排班（含下月及以后）"
      />

      <div className="flex flex-wrap gap-2 text-xs items-center">
        <span className="px-2.5 py-1 rounded-full bg-[#FDD772]/20 text-stone-800 font-medium">
          {viewDate}
        </span>
        {syncing && (
          <span className="text-stone-400">更新中…</span>
        )}
        {dayClosed ? (
          <span className="px-2.5 py-1 rounded-full bg-stone-200 text-stone-600">全天休息</span>
        ) : (
          <>
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              已约 {bookedCount} 人
            </span>
            <span className="px-2.5 py-1 rounded-full bg-stone-100 text-stone-600">
              可约 {freeCount} 格
            </span>
          </>
        )}
      </div>

      {showSkeleton ? (
        <p className="text-center text-stone-400 py-10 bg-white rounded-xl border">首次加载…</p>
      ) : dayClosed ? (
        <p className="text-center text-stone-500 py-10 bg-stone-100 rounded-xl border">
          本日为休息日，无排班。可在「休息」页修改。
        </p>
      ) : (
        <div
          className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-opacity ${
            syncing ? 'opacity-90' : ''
          }`}
        >
          <div className="hidden sm:grid sm:grid-cols-[5rem_1fr_1fr_auto] gap-2 px-4 py-2.5 bg-[#10143A] text-white text-xs font-medium">
            <span>时段</span>
            <span>患者</span>
            <span>电话</span>
            <span className="text-right">操作</span>
          </div>
          <ul className="divide-y divide-stone-100">
            {rows.map((row) => {
              const closed = row.closed;
              const booked = Boolean(row.booking);
              return (
                <li
                  key={row.time}
                  className={`px-4 py-3 sm:grid sm:grid-cols-[5rem_1fr_1fr_auto] sm:gap-2 sm:items-center ${
                    closed
                      ? 'bg-stone-50'
                      : booked
                        ? 'bg-[#FFF8E7]/80'
                        : 'bg-white'
                  }`}
                >
                  <span className="font-mono text-sm font-bold text-[#10143A] sm:text-stone-800">
                    {row.time}
                  </span>
                  <div className="mt-1 sm:mt-0">
                    {closed ? (
                      <span className="text-sm text-stone-400">休息</span>
                    ) : booked && row.booking ? (
                      <div className="space-y-0.5">
                        <p className="text-sm font-bold text-stone-900 flex items-center gap-1">
                          <User size={14} className="text-[#FDD772] shrink-0" />
                          {formatPatientIdentity(
                            row.booking.patientName,
                            row.booking.gender,
                            row.booking.birthDate
                          )}
                        </p>
                        <p className="text-xs text-stone-500 sm:hidden">
                          <PhoneActions phone={row.booking.patientPhone} />
                        </p>
                        <p className="text-xs text-stone-500 hidden sm:block">
                          {treatmentName(row.booking.treatmentId)}
                          {row.booking.status === 'pending' ? ' · 待面诊' : ''}
                          {row.booking.queueCode ? (
                            <span className="ml-1 font-mono font-semibold text-[#10143A]">
                              · {row.booking.queueCode}
                              {row.booking.queueStatus === 'waiting'
                                ? ' 已签到'
                                : row.booking.queueStatus === 'skipped'
                                  ? ' 已过号'
                                  : ''}
                            </span>
                          ) : null}
                        </p>
                      </div>
                    ) : (
                      <span className="text-sm text-stone-400">空闲 — 可代约</span>
                    )}
                  </div>
                  <div className="hidden sm:flex items-center">
                    {booked && row.booking ? (
                      <PhoneActions phone={row.booking.patientPhone} />
                    ) : (
                      <span className="text-stone-300">—</span>
                    )}
                  </div>
                  <div className="mt-2 sm:mt-0 flex justify-end gap-1.5 flex-wrap">
                    {booked && row.booking ? (
                      <>
                        {isClinicToday && needsCheckIn(row.booking) && (
                          <button
                            type="button"
                            onClick={() => onCheckIn(row.booking!.id)}
                            className="px-2.5 py-1.5 rounded-lg border border-[#10143A]/20 bg-[#DEEAF4]/60 text-[#10143A] text-xs font-semibold"
                          >
                            签到发 A 号
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onCancel(row.booking!.id)}
                          className="flex items-center gap-1 text-red-600 hover:bg-red-50 px-2.5 py-1.5 rounded-lg border border-red-200 text-xs"
                        >
                          <Trash2 size={12} />
                          取消
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-stone-300 px-2">—</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowAllList((v) => !v)}
        className="w-full flex items-center justify-center gap-1 text-sm text-stone-500 py-2 hover:text-[#10143A]"
      >
        {showAllList ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        {showAllList ? '收起' : '展开'}全部预约记录（共 {bookings.length} 条）
      </button>

      {showAllList && (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {bookings.length === 0 ? (
            <p className="text-center text-stone-400 py-4 text-sm">暂无预约</p>
          ) : (
            bookings.map((b) => (
              <div
                key={b.id}
                className="bg-white rounded-lg px-3 py-2 border text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <span>
                  <span className="font-mono text-[#10143A]">{b.date} {b.timeSlot}</span>
                  {' · '}
                  {formatPatientIdentity(b.patientName, b.gender, b.birthDate)}{' '}
                </span>
                <div className="flex items-center justify-between gap-2">
                  <PhoneActions phone={b.patientPhone} />
                  {b.status !== 'cancelled' && (
                    <button
                      type="button"
                      onClick={() => onCancel(b.id)}
                      className="text-red-600 text-xs shrink-0"
                    >
                      取消
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
