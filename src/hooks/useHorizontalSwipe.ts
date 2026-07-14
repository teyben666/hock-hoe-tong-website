/**
 * 横向滑动切换轮播；明显左右滑才触发，避免干扰页面上下滚动。
 */

import { useCallback, useRef, type TouchEvent } from 'react';

const MIN_DX = 40;

export function useHorizontalSwipe(
  onSwipe: (direction: -1 | 1) => void,
  enabled = true
) {
  const startRef = useRef<{ x: number; y: number } | null>(null);

  const onTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!enabled) return;
      const t = e.changedTouches[0];
      if (!t) return;
      startRef.current = { x: t.clientX, y: t.clientY };
    },
    [enabled]
  );

  const onTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (!enabled || !startRef.current) return;
      const t = e.changedTouches[0];
      if (!t) {
        startRef.current = null;
        return;
      }
      const dx = t.clientX - startRef.current.x;
      const dy = t.clientY - startRef.current.y;
      startRef.current = null;
      if (Math.abs(dx) < MIN_DX) return;
      // 纵向滑动更大时当作翻页滚动，不切换
      if (Math.abs(dx) <= Math.abs(dy) * 1.15) return;
      // 左滑 → 下一项；右滑 → 上一项
      onSwipe(dx < 0 ? 1 : -1);
    },
    [enabled, onSwipe]
  );

  return {
    onTouchStart,
    onTouchEnd,
    style: { touchAction: 'pan-y' as const },
  };
}
