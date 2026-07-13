/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { TREATMENTS_SECTION } from '../data';
import * as Icons from 'lucide-react';
import { useTreatments } from '../hooks/useTreatments';

interface TreatmentsPanelProps {
  onSelectTreatment: (treatmentId: string) => void;
  selectedId?: string;
}

const DETAIL_ROWS = [
  { label: '操作方式', key: 'operation' as const },
  { label: '功效作用', key: 'effects' as const },
  { label: '适合人群', key: 'suitableFor' as const },
];

export const TreatmentsPanel: React.FC<TreatmentsPanelProps> = ({
  onSelectTreatment,
  selectedId,
}) => {
  const { treatments, loading } = useTreatments(true);

  return (
    <div id="treatments" className="space-y-6 scroll-mt-24">
      <div className="border-l-4 border-[#FDD772] pl-4">
        <span className="font-sans text-xs font-semibold uppercase tracking-widest text-gold">
          {TREATMENTS_SECTION.tagline}
        </span>
        <h2 className="font-serif text-2xl font-black text-[#10143A] md:text-3xl mt-1">
          {TREATMENTS_SECTION.title}
        </h2>
      </div>

      <p className="font-sans text-sm text-stone-600 leading-relaxed">
        {TREATMENTS_SECTION.intro}
      </p>

      {loading && treatments.length === 0 ? (
        <p className="text-sm text-stone-500">加载治疗项目…</p>
      ) : (
        <div className="space-y-4">
          {treatments.map((t, index) => {
            const IconComponent =
              (Icons as Record<string, React.ComponentType<{ size?: number; className?: string }>>)[
                t.iconName
              ] || Icons.Activity;
            const isSelected = selectedId === t.id;
            const letter = String.fromCharCode(97 + index);

            return (
              <div
                key={t.id}
                id={`treatment-card-${t.id}`}
                className={`bg-white rounded-2xl p-6 border transition-all duration-300 ${
                  isSelected
                    ? 'border-[#FDD772] ring-2 ring-[#FDD772]/10 shadow-md'
                    : 'border-stone-200/60 hover:border-[#FDD772]/40 hover:shadow-md'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2.5 rounded-xl shrink-0 transition-colors ${
                      isSelected ? 'bg-[#FDD772] text-white' : 'bg-[#FDD772]/10'
                    }`}
                  >
                    <IconComponent size={22} className={isSelected ? '' : 'icon-gold'} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-serif font-bold text-[#10143A] text-lg">
                      <span className="text-gold mr-1.5">{letter}.</span>
                      {t.name}
                    </h3>
                    {t.nameEn && (
                      <p className="font-sans text-xs text-stone-500 mt-0.5 tracking-wide">
                        {t.nameEn}
                      </p>
                    )}
                    {t.tagline && (
                      <p className="font-serif text-sm text-[#10143A]/75 mt-1">{t.tagline}</p>
                    )}
                  </div>
                </div>

                {(t.imageUrl || t.videoUrl) && (
                  <div className="mt-4 space-y-3 sm:pl-14">
                    {t.imageUrl ? (
                      <img
                        src={t.imageUrl}
                        alt={t.name}
                        className="w-full max-h-52 object-cover rounded-xl border border-stone-200/60"
                      />
                    ) : null}
                    {t.videoUrl ? (
                      <video
                        src={t.videoUrl}
                        controls
                        playsInline
                        className="w-full max-h-56 rounded-xl border border-stone-200/60 bg-black"
                      />
                    ) : null}
                  </div>
                )}

                <dl className="mt-4 space-y-3 sm:pl-14">
                  {DETAIL_ROWS.map(({ label, key }) => (
                    <div key={key} className="text-sm leading-relaxed">
                      <dt className="font-serif font-semibold text-gold text-xs mb-0.5">
                        {label}
                      </dt>
                      <dd className="font-sans text-stone-600 whitespace-pre-line">{t[key]}</dd>
                    </div>
                  ))}
                </dl>

                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => onSelectTreatment(t.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-serif tracking-widest transition-all ${
                      isSelected
                        ? 'bg-[#10143A] text-white shadow'
                        : 'bg-stone-50 text-[#10143A]/80 hover:bg-[#DEEAF4]/50 hover:text-[#10143A] border border-stone-200'
                    }`}
                  >
                    {isSelected ? '✓ 已选中治疗项目' : '选择此治疗项目 ⇀'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
