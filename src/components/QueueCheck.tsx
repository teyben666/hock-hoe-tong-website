/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BOOKING_COPY } from '../data';
import { BilingualLine } from './BilingualLine';
import { ListOrdered, ExternalLink } from 'lucide-react';

const Q = BOOKING_COPY.queue;

/** 官网侧边：引导至门口扫码页（查号 + 取号） */
export const QueueCheck: React.FC = () => {
  return (
    <div className="bg-white p-5 rounded-[16px] shadow-sm border border-[#10143A]/10 space-y-3">
      <h4 className="font-serif font-bold text-[#10143A] text-sm flex items-center gap-2">
        <ListOrdered size={16} className="icon-gold shrink-0" />
        <BilingualLine
          zh={Q.titleZh}
          en={Q.titleEn}
          zhClassName="text-sm font-bold leading-tight"
          enClassName="text-[10px] font-sans font-normal text-[#10143A]/60 mt-0.5 leading-tight"
        />
      </h4>
      <BilingualLine
        zh={Q.bodyZh}
        en={Q.bodyEn}
        zhClassName="text-xs text-[#10143A]/70 leading-relaxed"
        enClassName="text-[10px] text-[#10143A]/55 mt-1 leading-relaxed"
      />
      <a
        href="/walk-in"
        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#10143A] text-gold-on-dark font-semibold text-sm min-h-[48px]"
      >
        <span className="flex flex-col items-center leading-tight">
          <span>{Q.openZh}</span>
          <span className="text-[10px] font-normal opacity-90 mt-0.5">{Q.openEn}</span>
        </span>
        <ExternalLink size={16} className="shrink-0" />
      </a>
    </div>
  );
};
