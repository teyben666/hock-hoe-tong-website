/**
 * 养生知识轮播（一条一屏，左右切换，约 30 秒自动下一条）
 */

import React, { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Leaf } from 'lucide-react';
import { WELLNESS_SECTION } from '../data';
import { fetchWellnessTips } from '../api';
import { BilingualLine } from './BilingualLine';
import type { WellnessTip } from '../types';

const AUTO_MS = 30_000;

export const WellnessSection: React.FC = () => {
  const [tips, setTips] = useState<WellnessTip[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWellnessTips()
      .then((list) => setTips(list))
      .catch(() => setTips([]))
      .finally(() => setLoading(false));
  }, []);

  const count = tips.length;
  const safeIndex = count > 0 ? ((index % count) + count) % count : 0;
  const current = count > 0 ? tips[safeIndex] : null;

  const go = useCallback(
    (delta: number) => {
      if (count === 0) return;
      setIndex((i) => (i + delta + count) % count);
    },
    [count]
  );

  useEffect(() => {
    if (count <= 1) return;
    const timer = window.setInterval(() => go(1), AUTO_MS);
    return () => window.clearInterval(timer);
  }, [count, go]);

  useEffect(() => {
    if (index >= count && count > 0) setIndex(0);
  }, [count, index]);

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
          <div className="bg-[#F5F3EF]/60 rounded-2xl p-5 md:p-6 border border-stone-200/50 shadow-sm min-h-[200px]">
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

            <BilingualLine
              zh={current.titleZh}
              en={current.titleEn}
              zhClassName="font-serif font-bold text-[#10143A] text-base md:text-lg leading-snug"
              enClassName="font-sans text-stone-500 text-xs mt-1"
            />

            <BilingualLine
              zh={current.bodyZh}
              en={current.bodyEn}
              className="mt-4"
              zhClassName="font-sans text-stone-600 text-[13px] md:text-sm leading-relaxed"
              enClassName="font-sans text-stone-500 text-xs mt-2 leading-relaxed"
            />

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
                    key={t.id}
                    type="button"
                    onClick={() => setIndex(i)}
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
    </div>
  );
};
