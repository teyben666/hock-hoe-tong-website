/**
 * 常见问题 FAQ — 手风琴（同时仅展开一项）
 */

import React, { useEffect, useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { FAQ_SECTION } from '../data';
import { fetchFaqs } from '../api';
import { parseBoldMarkup } from '../utils/richText';
import type { FaqItem } from '../types';

export const FaqSection: React.FC = () => {
  const [items, setItems] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchFaqs()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div id="faq" className="space-y-6 scroll-mt-24">
      <div className="border-l-4 border-[#FDD772] pl-4">
        <span className="font-sans text-xs font-semibold uppercase tracking-widest text-gold">
          {FAQ_SECTION.tagline}
        </span>
        <h2 className="font-serif text-2xl font-black text-[#10143A] md:text-3xl mt-1">
          {FAQ_SECTION.title}
          <span className="font-sans text-base font-semibold text-stone-500 ml-2">
            {FAQ_SECTION.titleEn}
          </span>
        </h2>
      </div>

      <p className="font-sans text-sm text-stone-500 leading-relaxed">{FAQ_SECTION.intro}</p>

      {loading ? (
        <div className="rounded-2xl border border-stone-200/60 bg-[#F5F3EF]/60 p-8 text-center text-sm text-stone-500">
          加载常见问题…
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-stone-200/60 bg-[#F5F3EF]/60 p-8 text-center text-sm text-stone-500">
          暂无常见问题，请于店员后台添加。
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const isOpen = expandedId === item.id;
            const panelId = `faq-panel-${item.id}`;
            const headerId = `faq-header-${item.id}`;

            return (
              <div
                key={item.id}
                className={`rounded-2xl border bg-white overflow-hidden transition-shadow ${
                  isOpen
                    ? 'border-[#FDD772]/60 shadow-sm'
                    : 'border-stone-200/60 hover:border-[#FDD772]/35'
                }`}
              >
                <button
                  type="button"
                  id={headerId}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => toggle(item.id)}
                  className="w-full flex items-start gap-3 px-4 py-4 md:px-5 text-left"
                >
                  <HelpCircle size={18} className="icon-gold shrink-0 mt-0.5" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="font-serif font-bold text-[#10143A] text-sm md:text-base leading-snug">
                      {parseBoldMarkup(item.questionZh)}
                    </p>
                    {item.questionEn ? (
                      <p className="font-sans text-xs text-stone-500 mt-1 leading-snug">
                        {parseBoldMarkup(item.questionEn)}
                      </p>
                    ) : null}
                  </div>
                  <ChevronDown
                    size={18}
                    className={`shrink-0 mt-0.5 text-stone-400 transition-transform duration-300 ${
                      isOpen ? 'rotate-180 text-gold' : ''
                    }`}
                    aria-hidden
                  />
                </button>

                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={headerId}
                  className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                    isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="px-4 pb-4 md:px-5 md:pb-5 pt-0 border-t border-stone-100 sm:pl-[2.85rem]">
                      <p className="font-sans text-stone-600 text-[13px] md:text-sm leading-relaxed whitespace-pre-line mt-3">
                        {parseBoldMarkup(item.answerZh)}
                      </p>
                      {item.answerEn ? (
                        <p className="font-sans text-stone-500 text-xs mt-2 leading-relaxed whitespace-pre-line">
                          {parseBoldMarkup(item.answerEn)}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
