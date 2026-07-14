/**
 * 全屏图片预览：遮罩 / × 关闭；多图时箭头与左右滑
 */

import React, { useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useHorizontalSwipe } from '../hooks/useHorizontalSwipe';

export type LightboxItem = {
  src: string;
  alt?: string;
  caption?: string;
};

interface ImageLightboxProps {
  items: LightboxItem[];
  index: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({
  items,
  index,
  onClose,
  onIndexChange,
}) => {
  const count = items.length;
  const safeIndex = count > 0 ? ((index % count) + count) % count : 0;
  const current = count > 0 ? items[safeIndex] : null;

  const go = useCallback(
    (delta: number) => {
      if (count <= 1) return;
      onIndexChange((safeIndex + delta + count) % count);
    },
    [count, onIndexChange, safeIndex]
  );

  const swipe = useHorizontalSwipe(go, count > 1);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, onClose]);

  if (!current || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="图片预览"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-3 right-3 z-20 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center"
        aria-label="关闭"
      >
        <X size={22} />
      </button>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              go(-1);
            }}
            className="absolute left-2 sm:left-4 z-20 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center"
            aria-label="上一张"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              go(1);
            }}
            className="absolute right-2 sm:right-4 z-20 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center"
            aria-label="下一张"
          >
            <ChevronRight size={22} />
          </button>
          <p className="absolute bottom-4 left-0 right-0 text-center text-white/70 text-xs font-mono z-20 pointer-events-none">
            {safeIndex + 1} / {count}
          </p>
        </>
      )}

      <div
        className="relative max-w-[min(96vw,1100px)] max-h-[88vh] w-full flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={swipe.onTouchStart}
        onTouchEnd={swipe.onTouchEnd}
        style={swipe.style}
      >
        <img
          src={current.src}
          alt={current.alt || '预览图'}
          className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl select-none"
          draggable={false}
        />
        {current.caption ? (
          <p className="mt-3 text-center text-white/85 text-sm font-serif max-w-lg px-2">
            {current.caption}
          </p>
        ) : null}
      </div>
    </div>,
    document.body
  );
};

/** 轻点打开（滑动不算点击） */
export function useLightboxTap(onOpen: () => void) {
  const startRef = useRef<{ x: number; y: number } | null>(null);

  return {
    onPointerDown: (e: React.PointerEvent) => {
      startRef.current = { x: e.clientX, y: e.clientY };
    },
    onPointerUp: (e: React.PointerEvent) => {
      const start = startRef.current;
      startRef.current = null;
      if (!start) return;
      const dist = Math.hypot(e.clientX - start.x, e.clientY - start.y);
      if (dist < 14) onOpen();
    },
    onPointerCancel: () => {
      startRef.current = null;
    },
  };
}
