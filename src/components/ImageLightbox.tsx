/**
 * 全屏图片预览：整张图适配屏幕并居中；遮罩 / × 关闭；多图时箭头与左右滑
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
      className="fixed inset-0 z-[100] bg-black/90"
      role="dialog"
      aria-modal="true"
      aria-label="图片预览"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-3 right-3 z-30 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center"
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
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center"
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
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center"
            aria-label="下一张"
          >
            <ChevronRight size={22} />
          </button>
        </>
      )}

      {/*
        预览安全区：绝对定位在视口内，四周留钮/说明空间。
        图片用 absolute + max-w/h-full + object-contain，横竖/16:9 都能完整居中。
      */}
      <div
        className="absolute z-10 left-12 right-12 top-14 bottom-16 sm:left-16 sm:right-16"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={swipe.onTouchStart}
        onTouchEnd={swipe.onTouchEnd}
        style={swipe.style}
      >
        <img
          key={current.src}
          src={current.src}
          alt={current.alt || '预览图'}
          className="absolute inset-0 m-auto max-w-full max-h-full w-auto h-auto object-contain select-none rounded-md shadow-2xl"
          draggable={false}
        />
      </div>

      <div
        className="absolute bottom-3 left-0 right-0 z-20 px-4 text-center pointer-events-none"
        onClick={(e) => e.stopPropagation()}
      >
        {current.caption ? (
          <p className="text-white/90 text-sm font-serif leading-snug line-clamp-2 max-w-lg mx-auto">
            {current.caption}
          </p>
        ) : null}
        {count > 1 ? (
          <p className="text-white/55 text-xs font-mono mt-0.5">
            {safeIndex + 1} / {count}
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
