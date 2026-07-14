/**
 * 养生知识轮播（一条一屏；左右滑 / 按钮；点图看大图；约 30 秒自动下一条）
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Leaf } from 'lucide-react';
import { WELLNESS_SECTION } from '../data';
import { fetchWellnessTips } from '../api';
import { parseBoldMarkup } from '../utils/richText';
import { useHorizontalSwipe } from '../hooks/useHorizontalSwipe';
import { ImageLightbox, useLightboxTap, type LightboxItem } from './ImageLightbox';
import type { WellnessTip } from '../types';

const AUTO_MS = 30_000;

export const WellnessSection: React.FC = () => {
  const [tips, setTips] = useState<WellnessTip[]>([]);
  const [index, setIndex] = useState(0);
  const [pauseToken, setPauseToken] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    fetchWellnessTips()
      .then((list) => setTips(list))
      .catch(() => setTips([]))
      .finally(() => setLoading(false));
  }, []);

  const count = tips.length;
  const safeIndex = count > 0 ? ((index % count) + count) % count : 0;
  const current = count > 0 ? tips[safeIndex] : null;

  /** 同组：所有带图的养生条目 */
  const lightboxItems: LightboxItem[] = useMemo(
    () =>
      tips
        .filter((t) => t.imageUrl)
        .map((t) => ({
          src: t.imageUrl!,
          alt: t.titleZh,
          caption: t.titleZh,
        })),
    [tips]
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
    if (!current?.imageUrl) return;
    const imgIndex = lightboxItems.findIndex((item) => item.src === current.imageUrl);
    setLightboxIndex(imgIndex >= 0 ? imgIndex : 0);
    setLightboxOpen(true);
    bumpPause();
  }, [current, lightboxItems, bumpPause]);

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

  return (
    <div id="feedback" className="space-y-6 scroll-mt-24">
      <div className="border-l-4 border-[#FDD772] pl-4">
        <span className="font-sans text-xs font-semibold uppercase tracking-widest text-gold">
          {WELLNESS_SECTION.tagline}
        </span>
        <h2 className="font-serif text-2xl font-black text-[#10143A] md:text-3xl mt-1">
          {WELLNESS_SECTION.title}
        </h2>
      </div>

      <p className="font-sans text-sm text-stone-500 leading-relaxed">
        {WELLNESS_SECTION.intro}
      </p>

      {loading ? (
        <div className="rounded-2xl border border-stone-200/60 bg-[#F5F3EF]/60 p-8 text-center text-sm text-stone-500">
          加载养生知识…
        </div>
      ) : !current ? (
        <div className="rounded-2xl border border-stone-200/60 bg-[#F5F3EF]/60 p-8 text-center text-sm text-stone-500">
          暂无养生知识，请于店员后台添加。
        </div>
      ) : (
        <div className="relative">
          <div
            className="bg-[#F5F3EF]/60 rounded-2xl p-5 md:p-6 border border-stone-200/50 shadow-sm min-h-[200px] select-none"
            onTouchStart={swipe.onTouchStart}
            onTouchEnd={swipe.onTouchEnd}
            style={swipe.style}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <span className="inline-flex items-center gap-1.5 font-sans text-[11px] text-[#10143A]/85 bg-[#DEEAF4]/40 border border-[#10143A]/10 px-3 py-1 rounded-full">
                <Leaf size={12} className="icon-gold" />
                {current.tagZh}
                <span className="text-stone-400">·</span>
                <span className="text-stone-500">{current.tagEn}</span>
              </span>
              {count > 1 && (
                <span className="font-mono text-[11px] text-stone-400 shrink-0">
                  {safeIndex + 1} / {count}
                </span>
              )}
            </div>

            <div>
              <h3 className="font-serif font-bold text-[#10143A] text-base md:text-lg leading-snug">
                {parseBoldMarkup(current.titleZh)}
              </h3>
              {current.titleEn ? (
                <p className="font-sans text-stone-500 text-xs mt-1">
                  {parseBoldMarkup(current.titleEn)}
                </p>
              ) : null}
            </div>

            {(current.imageUrl || current.videoUrl) && (
              <div className="mt-4 space-y-3">
                {current.imageUrl ? (
                  <button
                    type="button"
                    className="block w-full cursor-zoom-in focus:outline-none"
                    aria-label="查看大图"
                    {...imageTap}
                  >
                    <img
                      src={current.imageUrl}
                      alt={current.titleZh}
                      className="w-full max-h-64 object-cover rounded-xl border border-stone-200/60 pointer-events-none"
                      draggable={false}
                    />
                  </button>
                ) : null}
                {current.videoUrl ? (
                  <video
                    src={current.videoUrl}
                    controls
                    playsInline
                    className="w-full max-h-72 rounded-xl border border-stone-200/60 bg-black"
                  />
                ) : null}
              </div>
            )}

            <div className="mt-4">
              <p className="font-sans text-stone-600 text-[13px] md:text-sm leading-relaxed whitespace-pre-line">
                {parseBoldMarkup(current.bodyZh)}
              </p>
              {current.bodyEn ? (
                <p className="font-sans text-stone-500 text-xs mt-2 leading-relaxed whitespace-pre-line">
                  {parseBoldMarkup(current.bodyEn)}
                </p>
              ) : null}
            </div>

            <p className="font-sans text-[11px] text-stone-400 mt-4 pt-3 border-t border-stone-200/40">
              {WELLNESS_SECTION.disclaimer}
            </p>
          </div>

          {count > 1 && (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 md:-translate-x-full md:left-0 w-10 h-10 rounded-full bg-white border border-stone-200 shadow-md flex items-center justify-center text-[#10143A] hover:border-[#FDD772] hover:text-gold transition-colors"
                aria-label="上一条"
              >
                <ChevronLeft size={22} />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 md:translate-x-full md:right-0 w-10 h-10 rounded-full bg-white border border-stone-200 shadow-md flex items-center justify-center text-[#10143A] hover:border-[#FDD772] hover:text-gold transition-colors"
                aria-label="下一条"
              >
                <ChevronRight size={22} />
              </button>
              <div className="flex justify-center gap-1.5 mt-4">
                {tips.map((t, i) => (
                  <button
                    key={t.id || `tip-${i}`}
                    type="button"
                    onClick={() => goTo(i)}
                    className={`h-2 rounded-full transition-all ${
                      i === safeIndex ? 'w-6 bg-[#FDD772]' : 'w-2 bg-stone-300 hover:bg-stone-400'
                    }`}
                    aria-label={`第 ${i + 1} 条`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
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
