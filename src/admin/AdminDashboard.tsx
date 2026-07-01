/**
 * 店员后台：日程 / 电话代约 / 休息设置
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  staffCancelBooking,
  staffCreateBooking,
  staffCheckIn,
  clearStaffToken,
} from '../api/admin';
import { Reservation } from '../types';
import { TREATMENTS, DEFAULTS } from '../data';
import { AdminSchedulePanel } from './AdminSchedulePanel';
import { AdminWellnessPanel } from './AdminWellnessPanel';
import { AdminQueuePanel } from './AdminQueuePanel';
import { AdminDashboardPanel } from './AdminDashboardPanel';
import { useAdminSummary } from './useAdminSummary';
import { AdminDayBoard } from './AdminDayBoard';
import { AdminDatePicker } from './AdminDatePicker';
import { AdminWeekStrip } from './AdminWeekStrip';
import { AdminSyncControls, AdminNewBookingAlert } from './AdminSyncBar';
import { useAdminSync, AdminTab } from './useAdminSync';
import { loadStoredViewDate, saveViewDate } from './adminStorage';
import { TODAY } from './adminDateUtils';
import {
  PatientIdentityFields,
  PatientIdentityValues,
  validatePatientIdentityClient,
} from '../components/PatientIdentityFields';
import { formatPatientIdentity } from '../utils/patientLabels';
import {
  LogOut,
  Phone,
  UserPlus,
  LayoutList,
  LayoutDashboard,
  CalendarOff,
  Megaphone,
  Leaf,
} from 'lucide-react';

const emptyPhoneIdentity: PatientIdentityValues = {
  patientName: '',
  patientPhone: '',
  gender: 'female',
  birthDate: '',
};

const ADMIN_NAV: { id: AdminTab; label: string; Icon: typeof LayoutList }[] = [
  { id: 'dashboard', label: '总览', Icon: LayoutDashboard },
  { id: 'list', label: '日程', Icon: LayoutList },
  { id: 'queue', label: '叫号', Icon: Megaphone },
  { id: 'phone', label: '代约', Icon: Phone },
  { id: 'schedule', label: '休息', Icon: CalendarOff },
  { id: 'wellness', label: '养生', Icon: Leaf },
];

interface AdminDashboardProps {
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [tab, setTab] = useState<AdminTab>('dashboard');
  const [viewDate, setViewDateState] = useState(loadStoredViewDate);
  const [message, setMessage] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [phoneIdentity, setPhoneIdentity] = useState<PatientIdentityValues>(emptyPhoneIdentity);
  const [phoneIdentityErrors, setPhoneIdentityErrors] = useState<
    Partial<Record<keyof PatientIdentityValues, string>>
  >({});
  const [symptoms, setSymptoms] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const {
    bookings,
    setBookings,
    dayDetail,
    initialLoading,
    syncing,
    lastSyncedAt,
    newBookingCount,
    dismissNewBookingAlert,
    refreshAll,
  } = useAdminSync(viewDate, tab);

  const {
    summary,
    setSummary,
    loading: summaryLoading,
    syncing: summarySyncing,
    lastSyncedAt: summarySyncedAt,
    refreshSummary,
  } = useAdminSummary(tab);

  const setViewDate = useCallback((date: string) => {
    saveViewDate(date);
    setViewDateState(date);
    setSelectedSlot('');
  }, []);

  const countByDate = useMemo(() => {
    const m = new Map<string, number>();
    bookings
      .filter((b) => b.status !== 'cancelled')
      .forEach((b) => m.set(b.date, (m.get(b.date) ?? 0) + 1));
    return m;
  }, [bookings]);

  const bookingByTime = useMemo(() => {
    const m = new Map<string, Reservation>();
    bookings
      .filter((b) => b.date === viewDate && b.status !== 'cancelled')
      .forEach((b) => m.set(b.timeSlot, b));
    return m;
  }, [bookings, viewDate]);

  const handleTabChange = (t: AdminTab) => {
    setTab(t);
    if (t === 'dashboard') {
      refreshSummary(true).catch(() => {});
    }
    if (t === 'list' || t === 'phone') {
      refreshAll({ silent: true, keepSelectedSlot: true }).catch(() => {});
    }
  };

  const syncNow = () => {
    refreshAll({ silent: false, keepSelectedSlot: true })
      .then(() => setMessage('已同步最新预约'))
      .catch((e) => setMessage(e instanceof Error ? e.message : '同步失败'));
  };

  const handleLogout = () => {
    clearStaffToken();
    onLogout();
  };

  const handleCheckIn = async (id: string) => {
    setMessage('');
    try {
      const b = await staffCheckIn(id);
      setMessage(`已签到 ${b.queueCode ?? ''}`);
      await refreshAll({ silent: true, keepSelectedSlot: true });
    } catch (e) {
      setMessage(e instanceof Error ? e.message : '签到失败');
    }
  };

  const handleCancel = async (id: string) => {
    if (!window.confirm('确定取消此预约？时段将重新开放。')) return;
    const snapshot = bookings;
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: 'cancelled' as const } : b))
    );
    setMessage('');
    try {
      await staffCancelBooking(id);
      setMessage('已取消预约');
      await refreshAll({ silent: true, keepSelectedSlot: true });
    } catch (e) {
      setBookings(snapshot);
      setMessage(e instanceof Error ? e.message : '取消失败');
    }
  };

  const handlePhoneBook = async (e: React.FormEvent) => {
    e.preventDefault();
    const clientErrors = validatePatientIdentityClient(phoneIdentity);
    if (!viewDate || !selectedSlot) {
      setMessage('请选择日期和时段');
      return;
    }
    if (Object.keys(clientErrors).length > 0) {
      setPhoneIdentityErrors(clientErrors);
      setMessage('请完整填写患者信息');
      return;
    }
    setPhoneIdentityErrors({});
    setSubmitting(true);
    setMessage('');
    try {
      const created = await staffCreateBooking({
        patientName: phoneIdentity.patientName.trim(),
        patientPhone: phoneIdentity.patientPhone.replace(/[\s-]/g, ''),
        gender: phoneIdentity.gender,
        birthDate: phoneIdentity.birthDate,
        date: viewDate,
        timeSlot: selectedSlot,
        symptoms,
      });
      setBookings((prev) => [...prev, created]);
      setMessage(
        `已登记：${formatPatientIdentity(
          phoneIdentity.patientName,
          phoneIdentity.gender,
          phoneIdentity.birthDate
        )} ${viewDate} ${selectedSlot}`
      );
      setPhoneIdentity(emptyPhoneIdentity);
      setSymptoms('');
      setSelectedSlot('');
      await refreshAll({ silent: true, keepSelectedSlot: true });
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '代约失败');
    } finally {
      setSubmitting(false);
    }
  };

  const dayClosed = dayDetail?.closed ?? false;
  const treatmentName = (id: string) => TREATMENTS.find((t) => t.id === id)?.name || id;
  const todayBookedCount = countByDate.get(TODAY) ?? 0;

  return (
    <div className="min-h-screen bg-[#F5F3EF] flex">
      <aside className="w-[4.25rem] sm:w-44 shrink-0 bg-[#10143A] text-white flex flex-col sticky top-0 h-screen z-20 shadow-lg">
        <div className="px-2 sm:px-4 py-4 border-b border-white/10">
          <h1 className="font-serif font-bold text-sm leading-tight hidden sm:block">
            {DEFAULTS.CLINIC_NAME}
          </h1>
          <p className="text-[10px] text-white/55 mt-0.5 hidden sm:block">店员后台</p>
          <span
            className="sm:hidden font-serif font-bold text-[#FDD772] text-center block text-xs"
            aria-hidden
          >
            福
          </span>
        </div>

        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {ADMIN_NAV.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => handleTabChange(id)}
              title={label}
              className={`w-full flex items-center justify-center sm:justify-start gap-2 px-2 sm:px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                tab === id
                  ? 'bg-[#FDD772] text-stone-900'
                  : 'text-white/85 hover:bg-white/10'
              }`}
            >
              <Icon size={18} className="shrink-0" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </nav>

        <div className="p-2 border-t border-white/10 space-y-1">
          <a
            href="/"
            className="flex items-center justify-center sm:justify-start gap-2 px-2 sm:px-3 py-2 rounded-lg text-xs text-white/70 hover:bg-white/10 hover:text-white"
          >
            <span className="hidden sm:inline">← 返回官网</span>
            <span className="sm:hidden" aria-label="返回官网">
              ←
            </span>
          </a>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center sm:justify-start gap-2 px-2 sm:px-3 py-2 rounded-lg text-xs text-white/70 hover:bg-white/10 hover:text-white"
          >
            <LogOut size={16} className="shrink-0" />
            <span className="hidden sm:inline">退出登录</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <header className="bg-white border-b border-stone-200/80 px-4 py-3 sticky top-0 z-10 shrink-0">
          <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-serif font-bold text-[#10143A] text-base sm:text-lg">
                {ADMIN_NAV.find((n) => n.id === tab)?.label ?? '后台'}
              </p>
              <p className="text-[11px] text-stone-500">登录 24 小时有效 · 预约每 45 秒自动同步</p>
            </div>
            {(tab === 'list' || tab === 'phone') && (
              <AdminSyncControls
                lastSyncedAt={lastSyncedAt}
                syncing={syncing}
                onSyncNow={syncNow}
              />
            )}
            {tab === 'dashboard' && (
              <AdminSyncControls
                lastSyncedAt={summarySyncedAt}
                syncing={summarySyncing}
                onSyncNow={() => {
                  refreshSummary(false)
                    .then(() => setMessage('总览已更新'))
                    .catch((e) =>
                      setMessage(e instanceof Error ? e.message : '刷新失败')
                    );
                }}
              />
            )}
          </div>
          {(tab === 'list' || tab === 'phone' || tab === 'dashboard') && (
            <div className="max-w-4xl mx-auto mt-2">
              <AdminNewBookingAlert
                count={newBookingCount}
                onDismiss={dismissNewBookingAlert}
              />
            </div>
          )}
        </header>

        <main className="flex-1 max-w-4xl w-full mx-auto p-4 pb-12">
        {message && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-white border border-[#FDD772]/40 text-sm text-stone-700">
            {message}
          </div>
        )}

        {tab === 'dashboard' && (
          <AdminDashboardPanel
            summary={summary}
            loading={summaryLoading}
            syncing={summarySyncing}
            lastSyncedAt={summarySyncedAt}
            onRefresh={() => {
              refreshSummary(false).catch(() => {});
              refreshAll({ silent: true }).catch(() => {});
            }}
            onTabChange={handleTabChange}
            onMessage={setMessage}
            onSummaryUpdate={setSummary}
            onAfterQueueAction={() => {
              refreshSummary(true).catch(() => {});
              refreshAll({ silent: true }).catch(() => {});
            }}
          />
        )}

        {tab === 'list' && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border">
            <h2 className="font-serif font-bold text-stone-800 mb-4">当日排班一览</h2>
            <AdminDayBoard
              viewDate={viewDate}
              onViewDateChange={setViewDate}
              bookings={bookings}
              dayDetail={dayDetail}
              initialLoading={initialLoading}
              syncing={syncing}
              onCancel={handleCancel}
              onCheckIn={handleCheckIn}
              isClinicToday={viewDate === TODAY}
              treatmentName={treatmentName}
              countByDate={countByDate}
            />
            <p className="text-xs text-stone-400 mt-4 text-center">
              今天已约 {todayBookedCount} 人 · 数据自动同步，无需频繁手动刷新
            </p>
          </div>
        )}

        {tab === 'phone' && (
          <form onSubmit={handlePhoneBook} className="bg-white rounded-2xl p-5 shadow-sm border space-y-4">
            <h2 className="font-serif font-bold text-stone-800 flex items-center gap-2">
              <UserPlus size={18} className="text-[#FDD772]" />
              电话一键代约
            </h2>
            <p className="text-xs text-stone-500">
              与「日程」共用日期。已约格显示姓名；每 45 秒自动同步官网新预约。
            </p>

            <PatientIdentityFields
              values={phoneIdentity}
              onChange={(patch) => setPhoneIdentity((prev) => ({ ...prev, ...patch }))}
              errors={phoneIdentityErrors}
            />

            <AdminWeekStrip
              viewDate={viewDate}
              onSelectDate={setViewDate}
              countByDate={countByDate}
            />

            <AdminDatePicker
              viewDate={viewDate}
              onViewDateChange={setViewDate}
              label="选择日期（可预约至一年内任意日）"
            />

            <div>
              <label className="text-xs text-stone-500 mb-2 block">选择空闲时段代约</label>
              {initialLoading && !dayDetail ? (
                <p className="text-sm text-stone-400 py-4 text-center">首次加载…</p>
              ) : dayClosed ? (
                <p className="text-sm text-stone-500 py-4 text-center bg-stone-100 rounded-lg">
                  休息日无法代约
                </p>
              ) : (
                <div
                  className={`grid grid-cols-3 sm:grid-cols-4 gap-2 transition-opacity ${
                    syncing ? 'opacity-80' : ''
                  }`}
                >
                  {(dayDetail?.slots ?? []).map((slot) => {
                    const booked = bookingByTime.get(slot.time);
                    const disabled = slot.booked || slot.closed || Boolean(booked);
                    return (
                      <button
                        key={slot.time}
                        type="button"
                        disabled={disabled}
                        onClick={() => setSelectedSlot(slot.time)}
                        className={`py-2 px-1 rounded-lg text-xs min-h-[52px] flex flex-col items-center justify-center ${
                          slot.closed
                            ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                            : disabled
                              ? 'bg-stone-100 text-stone-500 cursor-not-allowed border border-stone-200'
                              : selectedSlot === slot.time
                                ? 'bg-[#FDD772] text-stone-900 font-bold ring-2 ring-[#10143A]'
                                : 'border border-stone-200 hover:border-[#FDD772]'
                        }`}
                      >
                        <span className="font-mono font-semibold">{slot.time}</span>
                        {slot.closed ? (
                          <span className="text-[10px] mt-0.5">休息</span>
                        ) : booked ? (
                          <span className="text-[10px] mt-0.5 truncate max-w-full px-0.5 font-medium leading-tight">
                            {formatPatientIdentity(
                              booked.patientName,
                              booked.gender,
                              booked.birthDate
                            )}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <input
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="备注（选填）"
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />

            <button
              type="submit"
              disabled={submitting || !selectedSlot || dayClosed}
              className="w-full bg-[#10143A] text-[#FDD772] font-bold py-3.5 rounded-xl disabled:opacity-50"
            >
              {submitting ? '提交中…' : `确认代约 ${viewDate} ${selectedSlot || ''}`}
            </button>
          </form>
        )}

        {tab === 'queue' && <AdminQueuePanel onMessage={setMessage} />}

        {tab === 'schedule' && (
          <AdminSchedulePanel
            onSaved={() => {
              refreshAll({ silent: true, keepSelectedSlot: true }).catch(() => {});
            }}
          />
        )}

        {tab === 'wellness' && <AdminWellnessPanel onMessage={setMessage} />}
        </main>
      </div>
    </div>
  );
};
