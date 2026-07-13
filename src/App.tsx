/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LoadingScreen } from './components/LoadingScreen';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { AboutSection } from './components/AboutSection';
import { TreatmentsPanel } from './components/TreatmentsPanel';
import { PhysicianSection } from './components/PhysicianSection';
import { WellnessSection } from './components/WellnessSection';
import { BookingForm } from './components/BookingForm';
import { BookingQuery } from './components/BookingQuery';
import { QueueCheck } from './components/QueueCheck';
import { TCMNotice } from './components/TCMNotice';
import { Reservation } from './types';
import { DEFAULTS, DEFAULT_DOCTOR_ID, BOOKING_COPY, ABOUT_COPY } from './data';
import { BilingualLine } from './components/BilingualLine';
import { isSearchBot } from './utils/isSearchBot';
import {
  ShieldCheck,
  CalendarRange,
  Sparkles,
  Building2,
  Smartphone,
  type LucideIcon,
} from 'lucide-react';

const TRUST_ICONS: LucideIcon[] = [ShieldCheck, CalendarRange, Sparkles, Smartphone];

export default function App() {
  /** Skip splash for crawlers so main text is available immediately for indexing */
  const [loading, setLoading] = useState(() => !isSearchBot());
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(DEFAULT_DOCTOR_ID);
  const [selectedTreatmentId, setSelectedTreatmentId] = useState<string>('');
  const [latestBooking, setLatestBooking] = useState<Reservation | null>(null);

  const handleSelectDoctor = (id: string) => {
    setSelectedDoctorId(id);
    document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSelectTreatment = (id: string) => {
    setSelectedTreatmentId(id);
    const element = document.getElementById('booking');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleBookingSuccess = (reservation: Reservation) => {
    setLatestBooking(reservation);
    // Refresh selections or auto query after successfully completing
  };

  if (loading) {
    return <LoadingScreen onComplete={() => setLoading(false)} />;
  }

  return (
    <div className="min-h-screen bg-warm-bg font-sans antialiased text-[#10143A]/85 selection:bg-[#FDD772]/30 selection:text-[#10143A]">
      {/* 1. Global Navigation Top Header */}
      <Navbar />

      {/* 2. Hero Section Area (First Screen 60vh) */}
      <Hero />

      {/* 3. Main Body Container (White card layout below hero) */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 pt-8">
        
        {/* Sub-header Highlights Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 bg-[#DEEAF4]/35 backdrop-blur-sm p-5 rounded-2xl shadow-sm border border-[#10143A]/10 text-[#10143A]/75">
          {BOOKING_COPY.trustHighlights.map((item, i) => {
            const Icon = TRUST_ICONS[i] ?? ShieldCheck;
            return (
              <div
                key={item.titleZh}
                className={`flex items-center gap-2 ${i > 0 ? 'border-l border-stone-200 pl-2 sm:pl-4' : ''}`}
              >
                <Icon className="icon-gold flex-shrink-0" size={18} />
                <div className="leading-tight min-w-0">
                  <BilingualLine
                    zh={item.titleZh}
                    en={item.titleEn}
                    zhClassName="font-serif text-xs text-[#10143A] font-bold leading-tight"
                    enClassName="text-[9px] text-[#10143A]/55 mt-0.5 leading-tight"
                  />
                  <BilingualLine
                    zh={item.subZh}
                    en={item.subEn}
                    className="mt-0.5"
                    zhClassName="text-[10px] text-[#10143A]/60 leading-tight"
                    enClassName="text-[9px] text-[#10143A]/45 mt-0.5 leading-tight"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Dynamic Column Split Layout (Mockup 1 Reference: Left Content, Right Booking Form Inline) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: BRAND & MEDICAL CONTENT SHIPS (7 of 12 columns) */}
          <div className="lg:col-span-7 space-y-12">
            {/* 3.1 About/Philosophy section */}
            <AboutSection />

            {/* 3.2 Dynamic Treatment panel selection grid */}
            <TreatmentsPanel 
              onSelectTreatment={handleSelectTreatment}
              selectedId={selectedTreatmentId}
            />

            {/* 3.3 Physicians schedule segment */}
            <PhysicianSection 
              onSelectDoctor={handleSelectDoctor}
              selectedId={selectedDoctorId}
            />

            {/* 3.4 养生知识轮播 */}
            <WellnessSection />
          </div>

          {/* RIGHT COLUMN: BOOKING CONTROLLER & PHONE LINK CARDS (5 of 12 columns) */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-8">
            
            {/* 3.5 Interactive Multi-step Online Booking */}
            <BookingForm 
              selectedDoctorId={selectedDoctorId}
              selectedTreatmentId={selectedTreatmentId}
              onBookingSuccess={handleBookingSuccess}
              onSelectDoctor={setSelectedDoctorId}
              onSelectTreatment={setSelectedTreatmentId}
            />

            {/* 3.6 Local Real-time Reservations Tracker Search Drawer */}
            <BookingQuery />

            <QueueCheck />

            {/* Quick Contact helper box */}
            <div className="bg-white p-5 rounded-[16px] shadow-sm border border-[#10143A]/10 space-y-3">
              <h4 className="font-serif font-bold text-[#10143A] text-sm flex items-center gap-2">
                <Building2 size={16} className="icon-gold" />
                <span>
                  {BOOKING_COPY.hotline.titleZh}{' '}
                  <span className="font-sans font-semibold text-stone-600">
                    {BOOKING_COPY.hotline.titleEn}
                  </span>
                </span>
              </h4>
              <BilingualLine
                zh={BOOKING_COPY.hotline.bodyZh}
                en={BOOKING_COPY.hotline.bodyEn}
                zhClassName="font-sans text-stone-600 text-xs leading-normal"
                enClassName="font-sans text-stone-500 text-[11px] leading-normal mt-1.5"
              />
              <ul className="space-y-2 pt-1 border-t border-stone-100">
                <li>
                  <BilingualLine
                    zh={BOOKING_COPY.hotline.hoursZh}
                    en={BOOKING_COPY.hotline.hoursEn}
                    zhClassName="text-xs text-stone-600"
                    enClassName="text-[11px] text-stone-400 mt-0.5"
                  />
                </li>
                <li>
                  <BilingualLine
                    zh={BOOKING_COPY.hotline.restZh}
                    en={BOOKING_COPY.hotline.restEn}
                    zhClassName="text-xs text-stone-600"
                    enClassName="text-[11px] text-stone-400 mt-0.5"
                  />
                </li>
                <li>
                  <a
                    href={DEFAULTS.WHATSAPP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono font-bold text-sm text-[#10143A] hover:underline inline-block"
                  >
                    {BOOKING_COPY.hotline.callZh} / {BOOKING_COPY.hotline.callEn}：{' '}
                    {DEFAULTS.PHONE_NUMBER}
                  </a>
                </li>
              </ul>
            </div>
          </div>

        </div>

        {/* 4. Global bottom medical/TCM compliance disclaimer banner */}
        <div className="mt-16">
          <TCMNotice />
        </div>
      </main>

      {/* 5. Footer Layout Container */}
      <footer className="bg-[#0F0D0B] border-t border-stone-800 text-stone-400 text-xs py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <div className="space-y-4 col-span-1 md:col-span-2">
            <span
              className="font-serif text-xl font-black tracking-wide block text-gold"
            >
              {DEFAULTS.CLINIC_ENGLISH}
            </span>
            <span className="font-serif text-lg text-white tracking-[0.4em] block mt-1">
              {DEFAULTS.CLINIC_NAME}
            </span>
            <span className="font-sans text-[10px] text-stone-500 block mt-1">
              SEJAK {DEFAULTS.ESTABLISHED} · {DEFAULTS.CLINIC_MALAY}
            </span>
            <p className="font-serif text-stone-400 text-sm leading-relaxed max-w-sm">
              {DEFAULTS.FOOTER_TAGLINE_1}
            </p>
            <p className="font-sans text-stone-500 text-xs leading-relaxed max-w-sm">
              {DEFAULTS.FOOTER_TAGLINE_2}
            </p>
            <div className="pt-2">
              <span className="font-serif text-gold block">诊前免责与合规提示：</span>
              <p className="font-sans text-[10px] text-stone-600 leading-normal mt-1">
                本官方页面的内容详情及专家医师简介主要用于中医文化陈列与看诊时间挂号，不应视作任何医疗治愈确定性承诺。面诊为准，病情危重者需遵从现代紧急医学妥当医治。
              </p>
            </div>
          </div>

          <div className="space-y-3 md:col-span-2">
            <span className="font-serif text-sm text-stone-300 tracking-wider block">
              地址与营业信息
            </span>
            <div className="space-y-2 font-sans text-stone-500 text-[11px] leading-relaxed">
              <p>
                <span className="text-stone-400">地址 Address：</span>
                <a
                  href={DEFAULTS.MAPS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-gold underline-offset-2 hover:underline"
                >
                  {DEFAULTS.ADDRESS}
                </a>
              </p>
              <p>
                <span className="text-stone-400">咨询热线 Contact Number：</span>
                <a
                  href={DEFAULTS.WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-gold"
                >
                  {DEFAULTS.PHONE_NUMBER}
                </a>
              </p>
              <p className="text-stone-400">营业时间 Business Hours：</p>
              <p>
                中药店营业时间 Chinese Medicine Shop Hours：{DEFAULTS.SHOP_HOURS}
              </p>
              <p>中医门诊时间 TCM Consultation Hours：{DEFAULTS.TCM_HOURS}</p>
              <p>{ABOUT_COPY.hours.restZh}：{ABOUT_COPY.hours.restValue}</p>
              <p className="text-stone-500">{ABOUT_COPY.hours.restEn}</p>
              <p>
                <span className="text-stone-400">主营业态：</span>
                {DEFAULTS.MAIN_BUSINESS}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <span className="font-serif text-sm text-stone-300 tracking-wider block">联系我们</span>
            <div className="flex flex-col gap-2 font-sans text-stone-500 text-[11px]">
              <p>
                <span className="text-stone-400">电话 / WhatsApp：</span>
                <a
                  href={DEFAULTS.WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-gold transition-colors"
                >
                  {DEFAULTS.PHONE_NUMBER}
                </a>
              </p>
              <p>
                <span className="text-stone-400">邮箱 Email：</span>
                <a
                  href={`mailto:${DEFAULTS.EMAIL}`}
                  className="hover:text-gold transition-colors break-all"
                >
                  {DEFAULTS.EMAIL}
                </a>
              </p>
            </div>
          </div>

        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-stone-800/80 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-stone-600 text-[11px]">
          <p>
            © {DEFAULTS.COPYRIGHT_YEAR} {DEFAULTS.CLINIC_NAME} {DEFAULTS.CLINIC_ENGLISH}
          </p>
          <BilingualLine
            zh="若您有任何疑问或希望预约，欢迎随时与我们联系，我们将竭诚为您服务。"
            en="If you have any questions or would like to make an appointment, please feel free to contact us. We are happy to assist you."
            className="text-center sm:text-right max-w-md"
            zhClassName="text-stone-500 text-[10px] leading-relaxed"
            enClassName="text-stone-600 text-[9px] mt-1 leading-relaxed"
          />
        </div>
      </footer>
    </div>
  );
}
