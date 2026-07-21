/**
 * 治疗项目面板 — 手风琴：默认收起，点标题展开；选中项目时自动展开
 */

import React, { useEffect, useMemo, useState } from 'react';
import { TREATMENTS_SECTION } from '../data';
import * as Icons from 'lucide-react';
import { ChevronDown } from 'lucide-react';
import { useTreatments } from '../hooks/useTreatments';
import { ImageLightbox, type LightboxItem } from './ImageLightbox';

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
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  /** 预约区选中某项目时，自动展开对应卡片 */
  useEffect(() => {
    if (selectedId) setExpandedId(selectedId);
  }, [selectedId]);

  const lightboxItems: LightboxItem[] = useMemo(
    () =>
      treatments
        .filter((t) => t.imageUrl)
        .map((t) => ({
          src: t.imageUrl!,
          alt: t.name,
          caption: t.name,
        })),
    [treatments]
  );

  const openTreatmentImage = (imageUrl: string) => {
    const i = lightboxItems.findIndex((item) => item.src === imageUrl);
    setLightboxIndex(i >= 0 ? i : 0);
    setLightboxOpen(true);
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

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
        <div className="space-y-3">
          {treatments.map((t, index) => {
            const IconComponent =
              (Icons as Record<string, React.ComponentType<{ size?: number; className?: string }>>)[
                t.iconName
              ] || Icons.Activity;
            const isSelected = selectedId === t.id;
            const isExpanded = expandedId === t.id;
            const letter = String.fromCharCode(97 + index);
            const panelId = `treatment-panel-${t.id}`;
            const headerId = `treatment-header-${t.id}`;

            return (
              <div
                key={t.id}
                id={`treatment-card-${t.id}`}
                className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${
                  isSelected
                    ? 'border-[#FDD772] ring-2 ring-[#FDD772]/10 shadow-md'
                    : 'border-stone-200/60 hover:border-[#FDD772]/40 hover:shadow-md'
                }`}
              >
                <button
                  type="button"
                  id={headerId}
                  aria-expanded={isExpanded}
                  aria-controls={panelId}
                  onClick={() => toggleExpand(t.id)}
                  className="w-full flex items-start gap-3 p-5 md:p-6 text-left"
                >
                  <div
                    className={`p-2.5 rounded-xl shrink-0 transition-colors ${
                      isSelected || isExpanded ? 'bg-[#FDD772] text-white' : 'bg-[#FDD772]/10'
                    }`}
                  >
                    <IconComponent
                      size={22}
                      className={isSelected || isExpanded ? '' : 'icon-gold'}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
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
                  <ChevronDown
                    size={20}
                    className={`shrink-0 mt-1 text-stone-400 transition-transform duration-300 ${
                      isExpanded ? 'rotate-180 text-gold' : ''
                    }`}
                    aria-hidden
                  />
                </button>

                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={headerId}
                  className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                    isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="px-5 pb-5 md:px-6 md:pb-6 pt-0 space-y-4 border-t border-stone-100">
                      {(t.imageUrl || t.videoUrl) && (
                        <div className="mt-4 space-y-3 sm:pl-14">
                          {t.imageUrl ? (
                            <button
                              type="button"
                              className="block w-full cursor-zoom-in focus:outline-none"
                              aria-label={`查看${t.name}大图`}
                              onClick={() => openTreatmentImage(t.imageUrl!)}
                            >
                              <img
                                src={t.imageUrl}
                                alt={t.name}
                                className="w-full max-h-52 object-cover rounded-xl border border-stone-200/60 pointer-events-none"
                                draggable={false}
                              />
                            </button>
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

                      <dl className="mt-1 space-y-3 sm:pl-14">
                        {DETAIL_ROWS.map(({ label, key }) => (
                          <div key={key} className="text-sm leading-relaxed">
                            <dt className="font-serif font-semibold text-gold text-xs mb-0.5">
                              {label}
                            </dt>
                            <dd className="font-sans text-stone-600 whitespace-pre-line">
                              {t[key]}
                            </dd>
                          </div>
                        ))}
                      </dl>

                      <div className="flex justify-end sm:pl-14">
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
                  </div>
                </div>
              </div>
            );
          })}
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
