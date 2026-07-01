import { useState, useCallback, useEffect, useRef } from 'react';
import { staffFetchSummary } from '../api/admin';
import { AdminSummary } from '../types';
import type { AdminTab } from './useAdminSync';

const POLL_MS = 45_000;

export function useAdminSummary(tab: AdminTab) {
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  const refreshSummary = useCallback(async (silent = false) => {
    if (silent) setSyncing(true);
    else setLoading(true);
    try {
      const data = await staffFetchSummary();
      setSummary(data);
      setLastSyncedAt(new Date());
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, []);

  const active = tab === 'dashboard';
  const refreshRef = useRef(refreshSummary);
  refreshRef.current = refreshSummary;

  useEffect(() => {
    if (!active) return;
    refreshRef.current(false).catch(() => {});
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => {
      refreshRef.current(true).catch(() => {});
    }, POLL_MS);
    return () => clearInterval(id);
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        refreshRef.current(true).catch(() => {});
      }
    };
    const onFocus = () => {
      refreshRef.current(true).catch(() => {});
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onFocus);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onFocus);
    };
  }, [active]);

  return {
    summary,
    setSummary,
    loading,
    syncing,
    lastSyncedAt,
    refreshSummary,
  };
}
