/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldCheck, HeartPulse, Scale, AlertOctagon } from 'lucide-react';

export const TCMNotice: React.FC = () => {
  return (
    <div id="compliance-notice" className="bg-[#DEEAF4]/25 rounded-2xl p-6 border border-[#10143A]/10 space-y-4">
      <div className="flex items-center gap-2 border-b border-stone-200/60 pb-2">
        <Scale size={18} className="icon-gold" />
        <h3 className="font-serif font-bold text-[#10143A] text-sm">倡导声明</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="flex gap-2.5 items-start">
          <ShieldCheck size={16} className="text-stone-400 mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <h4 className="font-serif font-semibold text-[#10143A]">辩证面诊合规</h4>
            <p className="font-sans text-stone-500 leading-normal">
              本馆严禁任何远程“无面诊开方”或盲目售售行为，中药汤药及针刺必须经过主治医生四诊辩证合参，视面诊具体体征结果设计理疗方案。
            </p>
          </div>
        </div>

        <div className="flex gap-2.5 items-start">
          <HeartPulse size={16} className="text-stone-400 mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <h4 className="font-serif font-semibold text-[#10143A]">调理辅助界定</h4>
            <p className="font-sans text-stone-500 leading-normal">
              本医馆所有宣传用词坚决杜绝“保证根除”、“100%治愈”、“永不复发”等绝对化承诺。所有草药调理与经穴手段均为扶正气、调脏腑气血之辅助手段。
            </p>
          </div>
        </div>

        <div className="flex gap-2.5 items-start">
          <AlertOctagon size={16} className="text-stone-400 mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <h4 className="font-serif font-semibold text-[#10143A]">危重症就医指引</h4>
            <p className="font-sans text-stone-500 leading-normal">
              突发急性创伤、重度心脑血管栓塞及急性传染病，请立即拨打 999 前往正规医院进行抢救，以免延误主要治疗黄金时机。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
