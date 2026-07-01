/**
 * 店员后台「总览」— P1 + P2
 */

import React, { useState } from 'react';
import {
  LayoutDashboard,
  Megaphone,
  Phone,
  LayoutList,
  CalendarOff,
  Pencil,
  Check,
  X,
  Settings2,
  Clock,
} from 'lucide-react';
import { AdminSummary } from '../types';
import { staffSetHistoricalBaseline, staffCallNext } from '../api/admin';
import type { AdminTab } from './useAdminSync';
import { formatSyncTime } from './useAdminSync';
import { TODAY } from './adminDateUtils';
import { AdminDashboardTrends } from './AdminDashboardTrends';
import { AdminDashboardExports } from './AdminDashboardExports';

interface AdminDashboardPanelProps {
  summary: AdminSummary | null;
  loading: boolean;
  syncing: boolean;
  lastSyncedAt: Date | null;
  onRefresh: () => void;
  onTabChange: (tab: AdminTab) => void;
  onMessage: (msg: string) => void;
  onSummaryUpdate: (s: AdminSummary) => void;
  onAfterQueueAction?: () => void;
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-stone-200/80 bg-stone-50/80 p-4">
      <p className="text-[11px] text-stone-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-[#10143A] mt-1 tabular-nums">{value}</p>
      {sub && <p className="text-[10px] text-stone-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function formatShortDate(dateStr: string): string {
  if (dateStr === TODAY) return '今';
  const d = new Date(dateStr + 'T12:00:00');
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  return `${dateStr.slice(5)} 周${weekdays[d.getDay()]}`;
}

export const AdminDashboardPanel: React.FC<AdminDashboardPanelProps> = ({
  summary,
  loading,
  syncing,
  lastSyncedAt,
  onRefresh,
  onTabChange,
  onMessage,
  onSummaryUpdate,
  onAfterQueueAction,
}) => {
  const [editingBaseline, setEditingBaseline] = useState(false);
  const [baselineInput, setBaselineInput] = useState('');
  const [savingBaseline, setSavingBaseline] = useState(false);
  const [callingNext, setCallingNext] = useState(false);

  const startEditBaseline = () => {
    if (!summary) return;
    setBaselineInput(String(summary.lifetime.historicalBaseline));
    setEditingBaseline(true);
  };

  const cancelEditBaseline = () => {
    setEditingBaseline(false);
    setBaselineInput('');
  };

  const saveBaseline = async () => {
    const n = Math.floor(Number(baselineInput));
    if (!Number.isFinite(n) || n < 0) {
      onMessage('请输入不小于 0 的整数');
      return;
    }
    setSavingBaseline(true);
    onMessage('');
    try {
      const updated = await staffSetHistoricalBaseline(n);
      onSummaryUpdate(updated);
      setEditingBaseline(false);
      onMessage('历史基数已更新');
    } catch (e) {
      onMessage(e instanceof Error ? e.message : '保存失败');
    } finally {
      setSavingBaseline(false);
    }
  };

  const handleCallNext = async () => {
    setCallingNext(true);
    onMessage('');
    try {
      const result = await staffCallNext('standard');
      if (result.success && result.booking) {
        onMessage(`已叫号 ${result.booking.queueCode ?? ''}`);
      } else {
        onMessage(result.message ?? '暂无等候患者');
      }
      onAfterQueueAction?.();
    } catch (e) {
      onMessage(e instanceof Error ? e.message : '叫号失败');
    } finally {
      setCallingNext(false);
    }
  };

  if (loading && !summary) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-sm border text-center text-stone-500 text-sm">
        加载总览…
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-sm border text-center">
        <p className="text-stone-500 text-sm mb-3">无法加载总览</p>
        <button type="button" onClick={onRefresh} className="text-sm text-[#10143A] underline">
          重试
        </button>
      </div>
    );
  }

  const weekday = new Date(summary.today + 'T12:00:00').toLocaleDateString('zh-CN', {
    weekday: 'short',
  });

  const slotPct =
    summary.todaySlots.total > 0
      ? Math.round((summary.todaySlots.booked / summary.todaySlots.total) * 100)
      : 0;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl p-5 shadow-sm border">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="font-serif font-bold text-stone-800 flex items-center gap-2">
              <LayoutDashboard size={18} className="text-[#FDD772]" />
              今日一览
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              {summary.today}（{weekday}）
              {lastSyncedAt && (
                <span className="ml-2">
                  · 更新 {formatSyncTime(lastSyncedAt)}
                  {syncing ? ' · 同步中…' : ''}
                </span>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            disabled={syncing}
            className="text-xs px-3 py-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 disabled:opacity-50"
          >
            立即刷新
          </button>
        </div>

        {summary.isOffDay && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200/80 text-sm text-amber-900 flex items-center gap-2">
            <CalendarOff size={16} className="shrink-0" />
            今日为休息日 · 官网与代约将不可用
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="今日已约" value={summary.todayBooked} sub="未取消预约" />
          <StatCard label="等候中" value={summary.todayWaiting} sub="等候/叫号/就诊" />
          <StatCard
            label="当前号"
            value={summary.queueCurrent?.code ?? '—'}
            sub={summary.queueCurrent?.maskedName ?? '暂无叫号'}
          />
          <StatCard label="今日完成" value={summary.todayDone} sub="已标记完成" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
          <StatCard label="未到" value={summary.todayNotArrived} sub="已约未签到" />
          <StatCard label="过号" value={summary.todaySkipped} sub="可再次排队" />
          <StatCard label="现场取号" value={summary.todayWalkIn} sub="walk-in" />
          <StatCard label="叫号模式" value={summary.queueModeLabel} sub={summary.queueMode} />
        </div>

        <div className="mt-4 p-3 rounded-xl bg-stone-50 border border-stone-100">
          <p className="text-xs text-stone-500 mb-1">今日时段占用</p>
          {summary.todaySlots.closed ? (
            <p className="text-sm text-stone-600">今日休息，无可约时段</p>
          ) : (
            <>
              <p className="text-sm font-semibold text-[#10143A]">
                已约 {summary.todaySlots.booked} / 可约 {summary.todaySlots.available}（共{' '}
                {summary.todaySlots.total} 格）
              </p>
              <div className="mt-2 h-2 rounded-full bg-stone-200 overflow-hidden">
                <div
                  className="h-full bg-[#FDD772] transition-all"
                  style={{ width: `${slotPct}%` }}
                />
              </div>
            </>
          )}
        </div>

        <div className="mt-4">
          <p className="text-xs font-medium text-stone-600 mb-2">接下来 3 单</p>
          {summary.nextAppointments.length === 0 ? (
            <p className="text-sm text-stone-400">暂无待就诊预约</p>
          ) : (
            <ul className="space-y-1.5">
              {summary.nextAppointments.map((a) => (
                <li
                  key={a.id}
                  className="flex justify-between text-sm px-3 py-2 rounded-lg bg-stone-50 border border-stone-100"
                >
                  <span className="font-mono font-semibold text-[#10143A]">{a.timeSlot}</span>
                  <span className="text-stone-600">{a.maskedName}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="text-stone-500">
            {summary.todayUniquePatients} 位客人 · {summary.todayVisitCount} 人次
          </span>
          {summary.todayCancelled > 0 && (
            <span className="text-amber-700">· 今日取消 {summary.todayCancelled}</span>
          )}
          {summary.avgWaitMinutes != null ? (
            <span className="text-stone-500 flex items-center gap-1">
              <Clock size={12} /> 平均等候约 {summary.avgWaitMinutes} 分钟
            </span>
          ) : (
            <span className="text-stone-400">· 平均等候 —</span>
          )}
        </div>

        {summary.todayByTreatment.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {summary.todayByTreatment.map((t) => (
              <span
                key={t.treatmentId}
                className="text-[11px] px-2.5 py-1 rounded-full bg-[#10143A]/5 text-stone-700 border border-stone-200"
              >
                {t.name} {t.count}
              </span>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-stone-100">
          <button
            type="button"
            onClick={handleCallNext}
            disabled={callingNext}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#FDD772] text-stone-900 text-xs font-bold ring-1 ring-[#10143A]/20 disabled:opacity-50"
          >
            <Megaphone size={14} />
            {callingNext ? '叫号中…' : '叫下一位（标准）'}
          </button>
          <button
            type="button"
            onClick={() => onTabChange('queue')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#10143A] text-[#FDD772] text-xs font-semibold"
          >
            <Settings2 size={14} />
            叫号面板
          </button>
          <button
            type="button"
            onClick={() => onTabChange('phone')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-stone-200 text-stone-700 text-xs font-medium hover:bg-stone-50"
          >
            <Phone size={14} />
            电话代约
          </button>
          <button
            type="button"
            onClick={() => onTabChange('list')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-stone-200 text-stone-700 text-xs font-medium hover:bg-stone-50"
          >
            <LayoutList size={14} />
            日程
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border">
        <h3 className="font-serif font-bold text-stone-800 text-sm mb-3">明日与本周</h3>
        {summary.tomorrow.isOffDay ? (
          <p className="text-sm text-amber-800 bg-amber-50 px-3 py-2 rounded-lg mb-3">
            明日（{summary.tomorrow.date}）休息
          </p>
        ) : (
          <p className="text-sm text-stone-600 mb-3">
            明日 {summary.tomorrow.date} 已约 <strong>{summary.tomorrow.booked}</strong> 人
          </p>
        )}
        <div className="grid grid-cols-7 gap-1.5">
          {summary.weekAhead.map((d) => {
            const isToday = d.date === summary.today;
            return (
              <div
                key={d.date}
                className={`text-center rounded-lg py-2 px-0.5 text-[10px] border ${
                  d.isOffDay
                    ? 'bg-stone-100 text-stone-400 border-stone-200'
                    : isToday
                      ? 'bg-[#FDD772]/30 border-[#FDD772] text-stone-900 font-semibold'
                      : 'bg-white border-stone-200 text-stone-600'
                }`}
                title={d.date}
              >
                <div className="truncate">{formatShortDate(d.date)}</div>
                <div className="text-sm font-bold mt-0.5 tabular-nums">
                  {d.isOffDay ? '休' : d.booked}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <AdminDashboardTrends summary={summary} onTabChange={onTabChange} />

      <AdminDashboardExports onMessage={onMessage} />

      {summary.recentDone.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border">
          <h3 className="font-serif font-bold text-stone-800 text-sm mb-2">最近完成</h3>
          <ul className="space-y-1.5">
            {summary.recentDone.map((r, i) => (
              <li
                key={`${r.finishedAt}-${i}`}
                className="flex justify-between text-sm text-stone-600"
              >
                <span>
                  {r.queueCode ?? '—'} {r.maskedName}
                </span>
                <span className="text-[10px] text-stone-400">
                  {r.finishedAt.slice(11, 16) || r.finishedAt.slice(0, 10)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-white rounded-2xl p-5 shadow-sm border">
        <h3 className="font-serif font-bold text-stone-800 text-sm mb-1">累计完成就诊</h3>
        <p className="text-[11px] text-stone-500 mb-4">
          按人次统计（同一人多次各计 1 次）· 仅含已标记「完成」的记录
        </p>

        <p className="text-4xl sm:text-5xl font-bold text-[#10143A] tabular-nums">
          {summary.lifetime.totalDisplayed.toLocaleString('zh-CN')}
          <span className="text-lg font-normal text-stone-500 ml-2">人次</span>
        </p>

        <p className="text-xs text-stone-500 mt-3">
          系统记录 {summary.lifetime.systemDone.toLocaleString('zh-CN')} 人次
          {summary.lifetime.systemSince && (
            <span>（自 {summary.lifetime.systemSince}）</span>
          )}
          {' · '}
          历史基数 {summary.lifetime.historicalBaseline.toLocaleString('zh-CN')} 人次
        </p>

        <p className="text-xs text-stone-400 mt-2">
          今日 +{summary.todayDone} · 本月 +{summary.monthDone}
        </p>

        <div className="mt-4 pt-4 border-t border-stone-100">
          <p className="text-[11px] text-stone-500 mb-2">
            开业前纸质档案等人次可填入「历史基数」，与系统记录相加显示。
          </p>
          {editingBaseline ? (
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="number"
                min={0}
                step={1}
                value={baselineInput}
                onChange={(e) => setBaselineInput(e.target.value)}
                className="w-36 border rounded-lg px-3 py-2 text-sm"
                placeholder="历史基数"
                disabled={savingBaseline}
              />
              <button
                type="button"
                onClick={saveBaseline}
                disabled={savingBaseline}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-[#10143A] text-[#FDD772] text-xs font-semibold disabled:opacity-50"
              >
                <Check size={14} />
                {savingBaseline ? '保存中…' : '保存'}
              </button>
              <button
                type="button"
                onClick={cancelEditBaseline}
                disabled={savingBaseline}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border text-xs text-stone-600"
              >
                <X size={14} />
                取消
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={startEditBaseline}
              className="inline-flex items-center gap-1.5 text-xs text-[#10143A] font-medium hover:underline"
            >
              <Pencil size={14} />
              设置历史基数
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
