import { useState, useCallback, useRef, useEffect } from 'react';
import {
  staffFetchBookings,
  staffFetchSlotByDate,
} from '../api/admin';
import { Reservation, SlotAvailability } from '../types';

const POLL_MS = 45_000;

export type AdminTab = 'dashboard' | 'list' | 'phone' | 'schedule' | 'queue' | 'wellness';

function activeBookings(list: Reservation[]) {
  return list.filter((b) => b.status !== 'cancelled');
}

export function formatSyncTime(d: Date): string {
  return d.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

interface RefreshOptions {
  silent?: boolean;
  keepSelectedSlot?: boolean;
}

export function useAdminSync(viewDate: string, tab: AdminTab) {
  const [bookings, setBookings] = useState<Reservation[]>([]);
  const [dayDetail, setDayDetail] = useState<SlotAvailability | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [newBookingCount, setNewBookingCount] = useState(0);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const viewDateRef = useRef(viewDate);
  viewDateRef.current = viewDate;

  const refreshAll = useCallback(
    async (opts?: RefreshOptions) => {
      const silent = opts?.silent ?? false;
      if (silent) setSyncing(true);
      else setInitialLoading(true);

      try {
        const list = await staffFetchBookings();
        const active = activeBookings(list);
        const newOnes = active.filter((b) => !seenIdsRef.current.has(b.id));
        const isFirstLoad = seenIdsRef.current.size === 0;

        if (!isFirstLoad && newOnes.length > 0) {
          setNewBookingCount((n) => n + newOnes.length);
        }
        active.forEach((b) => seenIdsRef.current.add(b.id));

        setBookings(list);

        const date = viewDateRef.current;
        if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
          const day = await staffFetchSlotByDate(date);
          setDayDetail(day);
        }

        setLastSyncedAt(new Date());
      } catch {
        /* caller may surface message */
        throw new Error('同步失败');
      } finally {
        setInitialLoading(false);
        setSyncing(false);
      }
    },
    []
  );

  const loadDaySlotsOnly = useCallback(async (date: string, silent = true) => {
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
    if (silent) setSyncing(true);
    try {
      setDayDetail(await staffFetchSlotByDate(date));
      setLastSyncedAt(new Date());
    } finally {
      if (silent) setSyncing(false);
    }
  }, []);

  const dismissNewBookingAlert = useCallback(() => setNewBookingCount(0), []);

  useEffect(() => {
    refreshAll().catch(() => {});
  }, [refreshAll]);

  useEffect(() => {
    if (viewDate) loadDaySlotsOnly(viewDate, true);
  }, [viewDate, loadDaySlotsOnly]);

  const shouldAutoSync = tab === 'list' || tab === 'phone' || tab === 'dashboard';

  useEffect(() => {
    if (!shouldAutoSync) return;
    const id = window.setInterval(() => {
      refreshAll({ silent: true, keepSelectedSlot: true }).catch(() => {});
    }, POLL_MS);
    return () => clearInterval(id);
  }, [shouldAutoSync, refreshAll]);

  useEffect(() => {
    if (!shouldAutoSync) return;
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        refreshAll({ silent: true, keepSelectedSlot: true }).catch(() => {});
      }
    };
    const onFocus = () => {
      refreshAll({ silent: true, keepSelectedSlot: true }).catch(() => {});
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onFocus);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onFocus);
    };
  }, [shouldAutoSync, refreshAll]);

  return {
    bookings,
    setBookings,
    dayDetail,
    setDayDetail,
    initialLoading,
    syncing,
    lastSyncedAt,
    newBookingCount,
    dismissNewBookingAlert,
    refreshAll,
    loadDaySlotsOnly,
  };
}
