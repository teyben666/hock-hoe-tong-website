/**
 * 店员后台：休息日 & 时段休息设置
 */

import React, { useState, useEffect } from 'react';
import { staffFetchSchedule, staffSaveSchedule } from '../api/admin';
import { ScheduleConfig, TimeBlock } from '../types';
import { CalendarOff, Clock, Plus, Trash2, Save } from 'lucide-react';

const WEEK_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

const HOUR_OPTIONS = Array.from({ length: 12 }, (_, i) => {
  const h = 9 + i;
  return [`${String(h).padStart(2, '0')}:00`, `${String(h).padStart(2, '0')}:30`];
}).flat();

function newBlockId() {
  return `blk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

interface AdminSchedulePanelProps {
  onSaved?: () => void;
}

export const AdminSchedulePanel: React.FC<AdminSchedulePanelProps> = ({ onSaved }) => {
  const [config, setConfig] = useState<ScheduleConfig>({ weekdays: [], dates: [], blocks: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [newDate, setNewDate] = useState('');

  const [blockMode, setBlockMode] = useState<'weekday' | 'date'>('weekday');
  const [blockWeekday, setBlockWeekday] = useState(0);
  const [blockDate, setBlockDate] = useState('');
  const [blockStart, setBlockStart] = useState('12:00');
  const [blockEnd, setBlockEnd] = useState('14:00');
  const [blockNote, setBlockNote] = useState('');

  useEffect(() => {
    staffFetchSchedule()
      .then(setConfig)
      .catch((e) => {
        const msg = e instanceof Error ? e.message : '加载失败';
        setMessage(
          msg.includes('404') || msg.includes('Not Found')
            ? '无法连接营业设置接口，请重启 API：在项目目录运行 npm run dev 或 npm run dev:api'
            : msg
        );
      })
      .finally(() => setLoading(false));
  }, []);

  const toggleWeekday = (d: number) => {
    setConfig((c) => ({
      ...c,
      weekdays: c.weekdays.includes(d) ? c.weekdays.filter((x) => x !== d) : [...c.weekdays, d].sort(),
    }));
  };

  const addDate = () => {
    if (!newDate || !/^\d{4}-\d{2}-\d{2}$/.test(newDate)) {
      setMessage('请选择有效日期');
      return;
    }
    if (config.dates.includes(newDate)) {
      setMessage('该日期已在列表中');
      return;
    }
    setConfig((c) => ({ ...c, dates: [...c.dates, newDate].sort() }));
    setNewDate('');
    setMessage('');
  };

  const removeDate = (d: string) => {
    setConfig((c) => ({ ...c, dates: c.dates.filter((x) => x !== d) }));
  };

  const addBlock = () => {
    if (blockMode === 'date' && !blockDate) {
      setMessage('请选择指定日期');
      return;
    }
    if (blockStart >= blockEnd) {
      setMessage('结束时间须晚于开始时间');
      return;
    }
    const block: TimeBlock = {
      id: newBlockId(),
      start: blockStart,
      end: blockEnd,
      note: blockNote.trim() || undefined,
      ...(blockMode === 'weekday' ? { weekday: blockWeekday } : { date: blockDate }),
    };
    setConfig((c) => ({ ...c, blocks: [...c.blocks, block] }));
    setBlockNote('');
    setMessage('');
  };

  const removeBlock = (id: string) => {
    setConfig((c) => ({ ...c, blocks: c.blocks.filter((b) => b.id !== id) }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const saved = await staffSaveSchedule(config);
      setConfig(saved);
      setMessage('已保存，官网预约日历将立即生效');
      onSaved?.();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const blockLabel = (b: TimeBlock) => {
    const when =
      b.weekday !== undefined
        ? `每${WEEK_LABELS[b.weekday]}`
        : b.date
          ? b.date
          : '?';
    return `${when} ${b.start}–${b.end}${b.note ? `（${b.note}）` : ''}`;
  };

  if (loading) {
    return <p className="text-center text-stone-400 py-8">加载营业设置…</p>;
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border space-y-6">
      <div>
        <h2 className="font-serif font-bold text-stone-800 flex items-center gap-2">
          <CalendarOff size={18} className="text-[#FDD772]" />
          休息日 & 时段休息
        </h2>
        <p className="text-xs text-stone-500 mt-1">
          在此设置即可，无需改 .env。全天休息会显示「休息」；时段休息仅关闭对应半小时格。
        </p>
      </div>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-stone-700">每周固定休息日</h3>
        <div className="flex flex-wrap gap-2">
          {WEEK_LABELS.map((label, i) => (
            <button
              key={i}
              type="button"
              onClick={() => toggleWeekday(i)}
              className={`px-3 py-2 rounded-lg text-sm border ${
                config.weekdays.includes(i)
                  ? 'bg-stone-800 text-white border-stone-800'
                  : 'bg-stone-50 text-stone-600 border-stone-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-stone-700">指定某天全天休息</h3>
        <div className="flex gap-2">
          <input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="flex-1 border rounded-lg px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={addDate}
            className="px-4 py-2 rounded-lg bg-stone-100 text-sm font-medium hover:bg-stone-200"
          >
            <Plus size={16} className="inline mr-1" />
            添加
          </button>
        </div>
        {config.dates.length > 0 && (
          <ul className="space-y-1">
            {config.dates.map((d) => (
              <li
                key={d}
                className="flex items-center justify-between text-sm bg-stone-50 rounded-lg px-3 py-2"
              >
                <span className="font-mono">{d}</span>
                <button
                  type="button"
                  onClick={() => removeDate(d)}
                  className="text-red-600 p-1 hover:bg-red-50 rounded"
                  aria-label="删除"
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3 border-t pt-4">
        <h3 className="text-sm font-semibold text-stone-700 flex items-center gap-1">
          <Clock size={16} className="text-[#FDD772]" />
          时段休息（几小时）
        </h3>
        <p className="text-xs text-stone-500">
          例如午休 12:00–14:00：该时段内所有预约格显示「休息」，其余时段仍可约。
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <label className="text-xs text-stone-500">重复方式</label>
            <select
              value={blockMode}
              onChange={(e) => setBlockMode(e.target.value as 'weekday' | 'date')}
              className="w-full mt-1 border rounded-lg px-3 py-2"
            >
              <option value="weekday">每周固定（如每周日午休）</option>
              <option value="date">仅某一天</option>
            </select>
          </div>
          {blockMode === 'weekday' ? (
            <div>
              <label className="text-xs text-stone-500">星期</label>
              <select
                value={blockWeekday}
                onChange={(e) => setBlockWeekday(Number(e.target.value))}
                className="w-full mt-1 border rounded-lg px-3 py-2"
              >
                {WEEK_LABELS.map((l, i) => (
                  <option key={i} value={i}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="text-xs text-stone-500">日期</label>
              <input
                type="date"
                value={blockDate}
                onChange={(e) => setBlockDate(e.target.value)}
                className="w-full mt-1 border rounded-lg px-3 py-2"
              />
            </div>
          )}
          <div>
            <label className="text-xs text-stone-500">开始</label>
            <select
              value={blockStart}
              onChange={(e) => setBlockStart(e.target.value)}
              className="w-full mt-1 border rounded-lg px-3 py-2 font-mono"
            >
              {HOUR_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-stone-500">结束（不含该时刻）</label>
            <select
              value={blockEnd}
              onChange={(e) => setBlockEnd(e.target.value)}
              className="w-full mt-1 border rounded-lg px-3 py-2 font-mono"
            >
              {HOUR_OPTIONS.filter((t) => t > blockStart).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs text-stone-500">备注（选填）</label>
            <input
              value={blockNote}
              onChange={(e) => setBlockNote(e.target.value)}
              placeholder="如：午休、医师外出"
              className="w-full mt-1 border rounded-lg px-3 py-2"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={addBlock}
          className="text-sm px-4 py-2 rounded-lg border border-[#FDD772] text-[#10143A] hover:bg-[#FFF8E7]"
        >
          <Plus size={14} className="inline mr-1" />
          添加时段休息
        </button>

        {config.blocks.length > 0 && (
          <ul className="space-y-1">
            {config.blocks.map((b) => (
              <li
                key={b.id}
                className="flex items-center justify-between text-sm bg-amber-50/80 rounded-lg px-3 py-2 border border-amber-100"
              >
                <span>{blockLabel(b)}</span>
                <button
                  type="button"
                  onClick={() => removeBlock(b.id)}
                  className="text-red-600 p-1"
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {message && (
        <p
          className={`text-sm px-3 py-2 rounded-lg ${
            message.includes('已保存') ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-900'
          }`}
        >
          {message}
        </p>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 bg-[#10143A] text-[#FDD772] font-bold py-3.5 rounded-xl disabled:opacity-50"
      >
        <Save size={18} />
        {saving ? '保存中…' : '保存营业设置'}
      </button>
    </div>
  );
};
