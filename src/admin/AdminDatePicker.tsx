import React from 'react';
import {
  TODAY,
  MAX_BOOK_DATE,
  getQuickDates,
  formatDayLabel,
} from './adminDateUtils';

interface AdminDatePickerProps {
  viewDate: string;
  onViewDateChange: (date: string) => void;
  label?: string;
  showQuickDays?: boolean;
}

export const AdminDatePicker: React.FC<AdminDatePickerProps> = ({
  viewDate,
  onViewDateChange,
  label = '选择日期',
  showQuickDays = true,
}) => {
  const quickDates = getQuickDates(7);

  return (
    <div className="space-y-3">
      <label className="text-xs text-stone-500 block">{label}</label>
      <input
        type="date"
        min={TODAY}
        max={MAX_BOOK_DATE}
        value={viewDate}
        onChange={(e) => onViewDateChange(e.target.value)}
        className="w-full border rounded-lg px-3 py-2.5 text-sm font-mono"
      />
      {showQuickDays && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {quickDates.map((dateStr, i) => (
            <button
              key={dateStr}
              type="button"
              onClick={() => onViewDateChange(dateStr)}
              className={`shrink-0 px-3 py-2 rounded-lg text-sm ${
                viewDate === dateStr
                  ? 'bg-[#FDD772] text-stone-900 font-bold'
                  : 'bg-stone-100 text-stone-600'
              }`}
            >
              {formatDayLabel(dateStr, i)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
