/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MapPin } from 'lucide-react';
import { DEFAULTS, ABOUT_COPY } from '../data';
import { BilingualLine } from './BilingualLine';
import { parseBoldMarkup } from '../utils/richText';
import { AboutGalleryCarousel } from './AboutGalleryCarousel';

export const AboutSection: React.FC = () => {
  return (
    <div id="about" className="space-y-8 scroll-mt-24">
      <div className="border-l-4 border-[#FDD772] pl-4">
        <span className="font-sans text-xs font-semibold uppercase tracking-widest text-gold">
          {ABOUT_COPY.tagline}
        </span>
        <h2 className="font-serif text-2xl font-black text-[#10143A] md:text-3xl mt-1">
          {DEFAULTS.CLINIC_NAME} · {DEFAULTS.CLINIC_ENGLISH}
        </h2>
      </div>

      <div className="bg-white rounded-2xl p-6 md:p-8 border border-stone-200/60 shadow-sm leading-relaxed space-y-6">
        <div className="pb-4">
          <AboutGalleryCarousel />
        </div>

        <div className="space-y-6 md:space-y-7 text-[#10143A]/90">
          {ABOUT_COPY.sections.map((section) => (
            <section key={section.titleZh} className="space-y-2">
              <h3 className="font-serif text-base md:text-lg font-bold text-[#10143A] border-l-2 border-[#FDD772] pl-3">
                {section.titleZh}
                <span className="block font-sans text-xs font-semibold text-[#10143A]/50 mt-0.5 tracking-wide">
                  {section.titleEn}
                </span>
              </h3>
              <p className="m-0 font-serif text-[15px] md:text-base leading-relaxed">
                {parseBoldMarkup(section.body)}
              </p>
            </section>
          ))}
        </div>

        <div className="p-4 rounded-xl bg-[#DEEAF4]/40 border border-[#10143A]/10 space-y-3 text-[#10143A]/80">
          <div className="flex items-start gap-2 min-w-0">
            <MapPin size={16} className="icon-gold flex-shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="font-serif text-sm font-medium text-[#10143A]">
                {ABOUT_COPY.address.labelZh}
                {ABOUT_COPY.address.labelEn}：
              </p>
              <a
                href={DEFAULTS.MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="block font-serif text-sm font-medium mt-0.5 hover:text-[#10143A] hover:underline lg:whitespace-nowrap"
              >
                {DEFAULTS.ADDRESS}
              </a>
            </div>
          </div>

          <div className="border-t border-[#FDD772]/15 pt-3 space-y-2.5 text-sm">
            <p className="font-serif font-semibold text-[#10143A]">
              {ABOUT_COPY.hours.titleZh}
              {ABOUT_COPY.hours.titleEn}：
            </p>
            <BilingualLine
              zh={`${ABOUT_COPY.hours.shopZh}：${ABOUT_COPY.hours.shopValue}`}
              en={`${ABOUT_COPY.hours.shopEn}：${ABOUT_COPY.hours.shopValue}`}
              zhClassName="font-sans text-stone-600"
              enClassName="font-sans text-stone-500 text-xs mt-0.5"
            />
            <BilingualLine
              zh={`${ABOUT_COPY.hours.tcmZh}：${ABOUT_COPY.hours.tcmValue}`}
              en={`${ABOUT_COPY.hours.tcmEn}：${ABOUT_COPY.hours.tcmValue}`}
              zhClassName="font-sans text-stone-600"
              enClassName="font-sans text-stone-500 text-xs mt-0.5"
            />
            <BilingualLine
              zh={`${ABOUT_COPY.hours.restZh}：${ABOUT_COPY.hours.restValue}`}
              en={ABOUT_COPY.hours.restEn}
              zhClassName="font-sans text-stone-600"
              enClassName="font-sans text-stone-500 text-xs mt-0.5"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
