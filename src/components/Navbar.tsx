/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Logo } from './Logo';
import { BOOKING_COPY, DEFAULTS } from '../data';
import { Phone, CalendarCheck2, Menu, X } from 'lucide-react';

/** 顶栏配色：浅蓝底 #DEEAF4 + 导航字 #10143A */
const NAV_BG = '#DEEAF4';
const NAV_LINK = '#10143A';

const NAV_LINKS = [
  { id: 'about', zh: '药材店介绍', en: 'Store Introduction' },
  { id: 'doctors', zh: '医师介绍', en: 'TCM Practitioner Profile' },
  { id: 'treatments', zh: '治疗项目', en: 'Treatment Services' },
  { id: 'feedback', zh: '养生知识', en: 'Wellness Knowledge' },
] as const;

const navLinkClass =
  'font-serif text-[14px] 2xl:text-[15px] leading-snug text-[#10143A] transition-colors hover:opacity-75 text-center px-1 2xl:px-2 py-1 whitespace-nowrap';

const pinkBtnClass =
  'flex items-center justify-center gap-2 font-semibold rounded-full transition-all min-h-[48px] shadow-sm bg-[#FBD7DE] hover:bg-[#f5c0c8] text-stone-900';

function BilingualNavLink({
  zh,
  en,
  onClick,
  className = navLinkClass,
  showEn = false,
}: {
  zh: string;
  en: string;
  onClick: () => void;
  className?: string;
  showEn?: boolean;
}) {
  return (
    <button onClick={onClick} className={className}>
      <span className="block text-[#10143A]">{zh}</span>
      <span
        className={`font-sans text-[11px] font-normal tracking-wide text-[#10143A]/90 mt-0.5 ${
          showEn ? 'block' : 'hidden 2xl:block'
        }`}
      >
        {en}
      </span>
    </button>
  );
}

function BilingualPinkBtn({
  zh,
  en,
  icon,
  onClick,
  href,
  className = '',
  showEn = false,
}: {
  zh: string;
  en: string;
  icon: React.ReactNode;
  onClick?: () => void;
  href?: string;
  className?: string;
  showEn?: boolean;
}) {
  const inner = (
    <>
      {icon}
      <span className="flex flex-col items-center leading-tight text-center">
        <span className="font-sans text-[inherit] leading-snug whitespace-nowrap">{zh}</span>
        <span
          className={`font-sans text-[11px] font-normal opacity-90 leading-tight ${
            showEn ? 'block' : 'hidden 2xl:block'
          }`}
        >
          {en}
        </span>
      </span>
    </>
  );

  const cls = `${pinkBtnClass} ${className}`;

  if (href) {
    const external = href.startsWith('http');
    return (
      <a
        href={href}
        className={cls}
        aria-label={`${zh} ${en}`}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {inner}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}

function syncHeaderHeight(el: HTMLElement | null) {
  if (!el) return;
  document.documentElement.style.setProperty('--header-height', `${el.offsetHeight}px`);
}

export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    const update = () => syncHeaderHeight(el);
    update();

    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener('resize', update);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [isScrolled]);

  useEffect(() => {
    const sentinel = document.getElementById('hero-sentinel');
    if (!sentinel) {
      const onScroll = () => setIsScrolled(window.scrollY > 200);
      window.addEventListener('scroll', onScroll, { passive: true });
      return () => window.removeEventListener('scroll', onScroll);
    }

    const observer = new IntersectionObserver(
      ([entry]) => setIsScrolled(!entry.isIntersecting),
      { threshold: 0, rootMargin: '-80px 0px 0px 0px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const telHref = DEFAULTS.WHATSAPP_URL;

  return (
    <header
      ref={headerRef}
      id="site-header"
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 border-b border-[#10143A]/20 bg-[#DEEAF4] ${
        isScrolled ? 'shadow-md py-3' : 'py-4'
      }`}
    >
      {/* 宽屏单行：Logo | 导航(中间) | 按钮 — 三栏网格防止向左盖住 Logo */}
      <div className="hidden xl:grid w-full max-w-[min(100%,1536px)] mx-auto px-2 sm:px-4 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2 2xl:gap-x-4">
        <Logo size={isScrolled ? 44 : 48} onClick={scrollToTop} />

        <nav className="flex items-center justify-center gap-x-2 2xl:gap-x-4 min-w-0 overflow-hidden">
          {NAV_LINKS.map((item) => (
            <React.Fragment key={item.id}>
              <BilingualNavLink
                zh={item.zh}
                en={item.en}
                onClick={() => scrollToSection(item.id)}
              />
            </React.Fragment>
          ))}
        </nav>

        <div className="flex items-center justify-end gap-1.5 2xl:gap-2 shrink-0">
          <BilingualPinkBtn
            href={telHref}
            zh={BOOKING_COPY.hero.phoneBookZh}
            en={BOOKING_COPY.hero.phoneBookEn}
            icon={<Phone size={18} strokeWidth={2.5} className="shrink-0" />}
            className="px-2.5 py-2 text-[12px] 2xl:px-4 2xl:py-2.5 2xl:text-[14px]"
          />
          <BilingualPinkBtn
            zh="网上预约"
            en="Online Booking"
            icon={<CalendarCheck2 size={16} className="shrink-0" />}
            onClick={() => scrollToSection('booking')}
            className="px-3 py-2 2xl:px-5 2xl:py-2.5 whitespace-nowrap text-[12px] 2xl:text-[14px]"
          />
        </div>
      </div>

      {/* 窄屏：仅 Logo + 电话 + 菜单 */}
      <div className="flex xl:hidden w-full max-w-[min(100%,1536px)] mx-auto px-2 sm:px-4 items-center justify-between gap-2">
        <Logo compact size={isScrolled ? 44 : 48} onClick={scrollToTop} />
        <div className="flex items-center gap-2 shrink-0">
          <a
            href={telHref}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 rounded-full bg-[#FBD7DE] hover:bg-[#f5c0c8] text-stone-900 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="WhatsApp 预约"
          >
            <Phone size={20} strokeWidth={2.5} />
          </a>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-[#10143A]"
            aria-label="菜单"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 border-t border-[#10143A]/25 bg-[#DEEAF4] shadow-xl py-5 px-5 flex flex-col gap-3 xl:hidden">
          <BilingualPinkBtn
            href={telHref}
            zh={BOOKING_COPY.hero.phoneBookZh}
            en={BOOKING_COPY.hero.phoneBookEn}
            icon={<Phone size={20} />}
            className="py-4 rounded-xl"
            showEn
          />
          <BilingualPinkBtn
            zh="网上预约"
            en="Online Booking"
            icon={<CalendarCheck2 size={20} />}
            onClick={() => scrollToSection('booking')}
            className="py-4 rounded-xl"
            showEn
          />
          <p className="text-center text-xs text-[#10143A] -mt-1 px-2 leading-relaxed">
            {BOOKING_COPY.senior.subtitleZh}
            <span className="block text-[10px] opacity-80 mt-1">
              {BOOKING_COPY.senior.subtitleEn}
            </span>
          </p>
          {NAV_LINKS.map((item) => (
            <React.Fragment key={item.id}>
              <BilingualNavLink
                zh={item.zh}
                en={item.en}
                onClick={() => scrollToSection(item.id)}
                className={`${navLinkClass} text-left py-2 border-b border-[#10143A]/25 w-full`}
                showEn
              />
            </React.Fragment>
          ))}
        </div>
      )}
    </header>
  );
};
