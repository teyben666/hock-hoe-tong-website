/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { DOCTORS, DEFAULTS } from '../data';
import { Star, Award, CalendarDays, Stethoscope } from 'lucide-react';
import { NamecardBackdrop } from './NamecardBackdrop';
import { parseBoldMarkup } from '../utils/richText';

interface PhysicianSectionProps {
  onSelectDoctor: (doctorId: string) => void;
  selectedId?: string;
}

export const PhysicianSection: React.FC<PhysicianSectionProps> = ({
  onSelectDoctor,
  selectedId,
}) => {
  const doc = DOCTORS[0];

  useEffect(() => {
    if (doc) onSelectDoctor(doc.id);
  }, [doc, onSelectDoctor]);

  if (!doc) return null;

  const isSelected = selectedId === doc.id;

  return (
    <div id="doctors" className="space-y-6 scroll-mt-24">
      <div className="border-l-4 border-[#FDD772] pl-4">
        <span className="font-sans text-xs font-semibold uppercase tracking-widest text-gold">
          驻诊医师
        </span>
        <h2 className="font-serif text-2xl font-black text-[#10143A] md:text-3xl mt-1">
          {doc.name} 医师
        </h2>
      </div>

      <p className="font-sans text-sm text-stone-600 leading-relaxed">
        {DEFAULTS.CLINIC_NAME} 由 {doc.name} 医师面诊，四诊合参，辨证施治。
      </p>

      <NamecardBackdrop variant="doctor" className="rounded-3xl p-5 md:p-7">
        <div
          className={`rounded-2xl p-6 border transition-all duration-500 flex flex-col sm:flex-row gap-6 bg-white/85 backdrop-blur-sm ${
            isSelected
              ? 'border-[#FDD772]/40 shadow-md'
              : 'border-white/80 shadow-sm'
          }`}
        >
          <div className="flex-shrink-0 flex flex-col items-center sm:items-start text-center sm:text-left">
            <div className="relative w-28 h-28 rounded-full overflow-hidden border-2 border-white shadow-md ring-2 ring-[#FDD772]/25 bg-white">
              <img
                src={doc.avatar}
                alt={doc.name}
                className="w-full h-full object-cover object-top"
              />
            </div>
            <div className="mt-3 flex items-center gap-1">
              <Star size={14} className="fill-[#FDD772] text-[#FDD772]" />
              <span className="font-mono text-xs font-semibold text-stone-700">{doc.rating}</span>
              <span className="font-sans text-[11px] text-stone-500">患者口碑</span>
            </div>
          </div>

          <div className="flex-1 space-y-4">
            <div className="border-b border-stone-200/60 pb-3">
              <h3 className="font-serif font-bold text-[#10143A] text-xl">{doc.name}</h3>
              <p className="font-serif text-sm text-gold font-medium mt-0.5">{doc.title}</p>
            </div>

            <p className="font-sans text-stone-600 text-sm leading-relaxed">
              {parseBoldMarkup(doc.intro)}
            </p>

            <div className="flex flex-wrap gap-2 items-center">
              <span className="font-serif text-stone-500 text-xs flex items-center gap-1 mr-1 w-full sm:w-auto">
                <Award size={13} className="icon-gold" />
                诊疗专长
              </span>
              {doc.specialties.map((spec) => (
                <span
                  key={spec}
                  className="font-sans text-[11px] text-stone-700 bg-white/90 border border-white px-3 py-1 rounded-full shadow-sm"
                >
                  {spec}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              <span className="font-serif text-stone-500 text-xs flex items-center gap-1 mr-1 w-full sm:w-auto">
                <Stethoscope size={13} className="icon-gold" />
                治疗方案
              </span>
              {doc.treatmentPlans.map((plan) => (
                <span
                  key={plan}
                  className="font-sans text-[11px] text-[#10143A]/85 bg-[#DEEAF4]/40 border border-[#10143A]/10 px-3 py-1 rounded-full shadow-sm"
                >
                  {plan}
                </span>
              ))}
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex flex-wrap gap-2 items-center">
                <span className="font-serif text-stone-500 flex items-center gap-1 w-full sm:w-auto">
                  <CalendarDays size={13} className="icon-gold" />
                  出诊时间
                </span>
                {doc.schedule.map((slot) => (
                  <span
                    key={slot}
                    className="font-mono text-stone-600 bg-white/80 border border-stone-200/50 px-2.5 py-0.5 rounded-full"
                  >
                    {slot}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <span className="font-serif text-stone-500 flex items-center gap-1 w-full sm:w-auto">
                  <span className="gold-emoji" aria-hidden>
                    💤
                  </span>
                  休息日
                </span>
                <span className="font-sans text-[11px] text-[#10143A]/85 bg-[#DEEAF4]/40 border border-[#10143A]/10 px-3 py-1 rounded-full shadow-sm">
                  {doc.restDays}
                </span>
              </div>
            </div>
          </div>
        </div>
      </NamecardBackdrop>
    </div>
  );
};
