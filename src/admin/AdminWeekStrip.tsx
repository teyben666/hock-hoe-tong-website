import React, { useMemo } from 'react';
import { getQuickDates, formatDayLabel, TODAY } from './adminDateUtils';

interface AdminWeekStripProps {
  viewDate: string;
  onSelectDate: (date: string) => void;
  countByDate: Map<string, number>;
  days?: number;
}

export const AdminWeekStrip: React.FC<AdminWeekStripProps> = ({
  viewDate,
  onSelectDate,
  countByDate,
  days = 14,
}) => {
  const dates = useMemo(() => getQuickDates(days), [days]);

  return (
    <div className="space-y-1.5">
      <p className="text-xs text-stone-500">近 {days} 天预约概览（数字为当日已约人数）</p>
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {dates.map((dateStr, i) => {
          const count = countByDate.get(dateStr) ?? 0;
          const selected = viewDate === dateStr;
          const isToday = dateStr === TODAY;
          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => onSelectDate(dateStr)}
              className={`shrink-0 flex flex-col items-center min-w-[3.25rem] px-2 py-2 rounded-xl border text-center transition-all ${
                selected
                  ? 'bg-[#FDD772] border-[#10143A] text-stone-900 shadow-sm'
                  : 'bg-white border-stone-200 text-stone-600 hover:border-[#FDD772]/60'
              }`}
            >
              <span className="text-[10px] leading-tight opacity-80">
                {isToday ? '今天' : formatDayLabel(dateStr, i).replace(/^周/, '')}
              </span>
              <span className="text-[10px] font-mono mt-0.5">{dateStr.slice(5)}</span>
              <span
                className={`mt-1 text-xs font-bold tabular-nums ${
                  count > 0 ? (selected ? 'text-stone-900' : 'text-[#10143A]') : 'text-stone-300'
                }`}
              >
                {count > 0 ? count : '·'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
