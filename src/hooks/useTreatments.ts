/**
 * 共享：官网 / 后台拉取治疗项目列表（失败时回退静态数据）
 */

import { useEffect, useState } from 'react';
import { fetchTreatments } from '../api';
import { TREATMENTS } from '../data';
import type { Treatment } from '../types';

export function useTreatments(enabledOnly = true) {
  const [treatments, setTreatments] = useState<Treatment[]>(TREATMENTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchTreatments()
      .then((list) => {
        if (cancelled) return;
        const next = enabledOnly ? list.filter((t) => t.enabled !== false) : list;
        if (next.length > 0) setTreatments(next);
      })
      .catch(() => {
        /* keep fallback TREATMENTS */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [enabledOnly]);

  return { treatments, loading };
}
