/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CalendarCheck2, Phone, ChevronDown } from 'lucide-react';
import { DEFAULTS, BOOKING_COPY } from '../data';
import { BilingualLine } from './BilingualLine';
import { NamecardBackdrop } from './NamecardBackdrop';

/** 品牌金（福和堂 / HOCK HOE TONG）— 与 --color-hero-gold 一致 */
const HERO_GOLD = '#FDD772';
const HERO_GOLD_EN = '#FDD772';
/** Slogan 香槟浅金 — 与品牌 #FDD772 区分 */
const HERO_GOLD_SLOGAN = '#FFF0C8';
const HERO_NAVY = '#10143A';

/** 轻阴影 ×3：仍偏「印在卡片上」，非厚重 3D */
const HERO_SHADOW_EN = '0 3px 6px rgba(16, 20, 58, 0.18)';
const HERO_SHADOW_TITLE =
  '0 3px 0 rgba(180, 140, 50, 1), 0 12px 36px rgba(16, 20, 58, 0.24)';
const HERO_SHADOW_SLOGAN = '0 3px 9px rgba(16, 20, 58, 0.15)';

/** 品牌主标题描边，浅色底上更清晰 */
const HERO_TEXT_OUTLINE: React.CSSProperties = {
  WebkitTextStroke: '2px #10143A',
  paintOrder: 'stroke fill',
};

export const Hero: React.FC = () => {
  const hero = BOOKING_COPY.hero;
  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const telHref = DEFAULTS.WHATSAPP_URL;

  return (
    <>
      <NamecardBackdrop
        variant="clinic"
        className="w-full min-h-[max(60vh,520px)] flex items-start justify-center pb-12"
      >
        <section
          id="hero-section"
          className="relative w-full flex items-start justify-center"
          style={{
            paddingTop: 'calc(var(--header-height, 88px) + var(--header-gap, 50px))',
            scrollMarginTop: 'var(--header-height, 88px)',
          }}
        >
          <div className="relative max-w-3xl mx-auto px-4 text-center w-full">
            <div className="rounded-[24px] p-8 md:p-10 border border-white/50 shadow-2xl backdrop-blur-xl mx-auto bg-white/25">
              <p
                className="font-sans font-bold text-xl md:text-3xl tracking-[0.2em] uppercase"
                style={{
                  color: HERO_GOLD_EN,
                  textShadow: HERO_SHADOW_EN,
                  ...HERO_TEXT_OUTLINE,
                }}
              >
                {DEFAULTS.CLINIC_ENGLISH}
              </p>
              <h1
                className="font-serif font-black text-3xl md:text-5xl tracking-wide mt-1"
                style={{
                  color: HERO_GOLD,
                  textShadow: HERO_SHADOW_TITLE,
                  ...HERO_TEXT_OUTLINE,
                }}
              >
                {DEFAULTS.CLINIC_NAME}
              </h1>

              <p
                className="font-hero-classical text-xl md:text-2xl mt-4 leading-snug"
                style={{
                  color: HERO_GOLD_SLOGAN,
                  textShadow: HERO_SHADOW_SLOGAN,
                  ...HERO_TEXT_OUTLINE,
                }}
              >
                {DEFAULTS.SLOGAN}
              </p>
              <p
                className="font-hero-motto text-base md:text-lg mt-2 tracking-wide"
                style={{ color: HERO_NAVY }}
              >
                {DEFAULTS.HERO_MOTTO}
              </p>

              <div
                className="mt-6 space-y-3 text-center max-w-lg mx-auto font-sans text-sm md:text-[15px] leading-relaxed"
                style={{ color: HERO_NAVY }}
              >
                <p className="font-bold underline underline-offset-2 decoration-[#10143A]/40">
                  {DEFAULTS.HERO_SUBHEAD}
                </p>
                <p>{DEFAULTS.HERO_INTRO}</p>
                <p className="font-bold underline underline-offset-2 decoration-[#10143A]/40">
                  {DEFAULTS.HERO_CREDENTIAL}
                </p>
                <p>{DEFAULTS.HERO_CLOSING}</p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
                <button
                  onClick={() => scrollTo('booking')}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 border-2 border-[#10143A]/25 bg-white/40 hover:bg-white/60 font-serif font-semibold px-6 py-3.5 rounded-full transition-all duration-500 min-h-[48px]"
                  style={{ color: HERO_NAVY }}
                >
                  <CalendarCheck2 size={18} className="shrink-0" />
                  <BilingualLine
                    zh={hero.bookSlotZh}
                    en={hero.bookSlotEn}
                    zhClassName="text-sm font-semibold leading-tight"
                    enClassName="text-[10px] font-sans font-normal opacity-85 mt-0.5 leading-tight"
                  />
                </button>
                <a
                  href={telHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#FBD7DE] hover:bg-[#f5c0c8] text-[#10143A] font-semibold px-6 py-3 rounded-full transition-all duration-500 min-h-[48px] shadow-md"
                >
                  <Phone size={18} className="shrink-0" />
                  <BilingualLine
                    zh={hero.phoneBookZh}
                    en={hero.phoneBookEn}
                    zhClassName="text-sm font-semibold leading-tight"
                    enClassName="text-[10px] font-sans font-normal opacity-85 mt-0.5 leading-tight"
                  />
                </a>
              </div>
              <div className="mt-3" style={{ color: HERO_NAVY }}>
                <BilingualLine
                  zh={BOOKING_COPY.senior.subtitleZh}
                  en={BOOKING_COPY.senior.subtitleEn}
                  zhClassName="text-sm font-sans leading-relaxed"
                  enClassName="text-xs font-sans opacity-85 mt-1 leading-relaxed"
                />
              </div>
              <div className="mt-2" style={{ color: HERO_NAVY }}>
                <BilingualLine
                  zh={hero.slotRulesZh}
                  en={hero.slotRulesEn}
                  zhClassName="text-xs font-mono opacity-90"
                  enClassName="text-[10px] font-sans opacity-80 mt-1 leading-snug"
                />
              </div>
            </div>

            <button
              onClick={() => scrollTo('about')}
              className="inline-flex flex-col items-center mt-8 text-white/70 hover:text-white transition-colors duration-500"
            >
              <span className="font-serif text-xs tracking-widest">了解更多</span>
              <ChevronDown
                size={18}
                className="mt-1 animate-[gentle-float_2.5s_ease-in-out_infinite]"
              />
            </button>
          </div>
        </section>
      </NamecardBackdrop>
      <div id="hero-sentinel" className="h-px w-full -mt-px" aria-hidden />
    </>
  );
};
