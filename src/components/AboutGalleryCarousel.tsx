/**
 * About 区相册轮播（约 30 秒自动切换；可左右滑 / 按钮；点图看大图）
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchAboutGallery } from '../api';
import { ABOUT_COPY, DEFAULTS } from '../data';
import type { AboutGalleryItem } from '../types';
import { useHorizontalSwipe } from '../hooks/useHorizontalSwipe';
import { ImageLightbox, useLightboxTap, type LightboxItem } from './ImageLightbox';

const AUTO_MS = 30_000;

export const AboutGalleryCarousel: React.FC = () => {
  const [items, setItems] = useState<AboutGalleryItem[]>([]);
  const [index, setIndex] = useState(0);
  const [pauseToken, setPauseToken] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    fetchAboutGallery()
      .then((list) => {
        if (list.length > 0) setItems(list);
        else
          setItems([
            {
              id: 'fallback',
              imageUrl: ABOUT_COPY.logoSrc,
              sortOrder: 0,
              enabled: true,
            },
          ]);
      })
      .catch(() => {
        setItems([
          {
            id: 'fallback',
            imageUrl: ABOUT_COPY.logoSrc,
            sortOrder: 0,
            enabled: true,
          },
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  const count = items.length;
  const safeIndex = count > 0 ? ((index % count) + count) % count : 0;
  const current = count > 0 ? items[safeIndex] : null;

  const lightboxItems: LightboxItem[] = useMemo(
    () =>
      items.map((item) => ({
        src: item.imageUrl,
        alt:
          item.captionZh ||
          `${DEFAULTS.CLINIC_NAME} ${DEFAULTS.CLINIC_ENGLISH}`,
        caption: item.captionZh || item.captionEn || undefined,
      })),
    [items]
  );

  const bumpPause = useCallback(() => setPauseToken((t) => t + 1), []);

  const go = useCallback(
    (delta: number) => {
      if (count <= 1) return;
      setIndex((i) => (i + delta + count) % count);
      bumpPause();
    },
    [count, bumpPause]
  );

  const goTo = useCallback(
    (i: number) => {
      setIndex(i);
      bumpPause();
    },
    [bumpPause]
  );

  const openLightbox = useCallback(() => {
    setLightboxIndex(safeIndex);
    setLightboxOpen(true);
    bumpPause();
  }, [safeIndex, bumpPause]);

  const imageTap = useLightboxTap(openLightbox);

  useEffect(() => {
    if (count <= 1 || lightboxOpen) return;
    const timer = window.setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, AUTO_MS);
    return () => window.clearInterval(timer);
  }, [count, pauseToken, lightboxOpen]);

  useEffect(() => {
    if (index >= count && count > 0) setIndex(0);
  }, [count, index]);

  const swipe = useHorizontalSwipe(go, count > 1 && !lightboxOpen);

  if (loading) {
    return (
      <div className="flex justify-center">
        <div className="bg-black rounded-2xl px-4 py-8 sm:px-8 shadow-lg ring-2 ring-[#FDD772]/30 w-full max-w-xl text-center text-stone-400 text-sm">
          加载相册…
        </div>
      </div>
    );
  }

  if (!current) return null;

  return (
    <div className="relative flex justify-center pb-2">
      <div
        className="bg-black rounded-2xl px-4 py-3 sm:px-8 sm:py-4 shadow-lg ring-2 ring-[#FDD772]/30 w-full max-w-xl overflow-hidden select-none"
        onTouchStart={swipe.onTouchStart}
        onTouchEnd={swipe.onTouchEnd}
        style={swipe.style}
      >
        <button
          type="button"
          className="relative aspect-[16/10] w-full flex items-center justify-center cursor-zoom-in focus:outline-none"
          aria-label="查看大图"
          {...imageTap}
        >
          <img
            src={current.imageUrl}
            alt={
              current.captionZh ||
              `${DEFAULTS.CLINIC_NAME} ${DEFAULTS.CLINIC_ENGLISH}`
            }
            className="max-w-full max-h-full w-full h-full object-contain pointer-events-none"
            draggable={false}
          />
        </button>
        {(current.captionZh || current.captionEn) && (
          <div className="mt-2 text-center pb-1">
            {current.captionZh ? (
              <p className="text-stone-200 text-xs font-serif">{current.captionZh}</p>
            ) : null}
            {current.captionEn ? (
              <p className="text-stone-400 text-[10px] mt-0.5">{current.captionEn}</p>
            ) : null}
          </div>
        )}
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            className="absolute left-0 sm:left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 border border-stone-200 shadow flex items-center justify-center text-[#10143A] hover:border-[#FDD772]"
            aria-label="上一张"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            className="absolute right-0 sm:right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 border border-stone-200 shadow flex items-center justify-center text-[#10143A] hover:border-[#FDD772]"
            aria-label="下一张"
          >
            <ChevronRight size={18} />
          </button>
          <div className="absolute -bottom-5 left-0 right-0 flex justify-center gap-1.5">
            {items.map((item, i) => (
              <button
                key={item.id}
                type="button"
                onClick={() => goTo(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === safeIndex ? 'w-5 bg-[#FDD772]' : 'w-1.5 bg-stone-300'
                }`}
                aria-label={`第 ${i + 1} 张`}
              />
            ))}
          </div>
        </>
      )}

      {lightboxOpen && lightboxItems.length > 0 ? (
        <ImageLightbox
          items={lightboxItems}
          index={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
          onIndexChange={setLightboxIndex}
        />
      ) : null}
    </div>
  );
};
