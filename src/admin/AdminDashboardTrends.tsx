/**
 * 总览 — 完成就诊趋势（recharts）
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { staffFetchTrends } from '../api/admin';
import { AdminSummary, AdminTrendRange } from '../types';
import type { AdminTab } from './useAdminSync';
import { TrendingUp } from 'lucide-react';

const RANGES: { id: AdminTrendRange; label: string }[] = [
  { id: '7d', label: '7天' },
  { id: '30d', label: '30天' },
  { id: 'month', label: '本月' },
  { id: 'year', label: '本年' },
];

interface AdminDashboardTrendsProps {
  summary: AdminSummary;
  onTabChange: (tab: AdminTab) => void;
}

export const AdminDashboardTrends: React.FC<AdminDashboardTrendsProps> = ({
  summary,
  onTabChange,
}) => {
  const [range, setRange] = useState<AdminTrendRange>('7d');
  const [points, setPoints] = useState<{ label: string; done: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTrends = useCallback(async (r: AdminTrendRange) => {
    setLoading(true);
    try {
      const data = await staffFetchTrends(r);
      setPoints(data.points.map((p) => ({ label: p.label, done: p.done })));
    } catch {
      setPoints([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTrends(range);
  }, [range, loadTrends]);

  const { monthCompare } = summary;
  const deltaSign = monthCompare.delta >= 0 ? '+' : '';
  const pctSign = monthCompare.deltaPercent >= 0 ? '+' : '';

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <h3 className="font-serif font-bold text-stone-800 text-sm flex items-center gap-2">
          <TrendingUp size={16} className="text-[#FDD772]" />
          完成就诊趋势
        </h3>
        <div className="flex flex-wrap gap-1">
          {RANGES.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRange(r.id)}
              className={`text-[11px] px-2.5 py-1 rounded-lg border transition-colors ${
                range === r.id
                  ? 'bg-[#10143A] text-[#FDD772] border-[#10143A]'
                  : 'border-stone-200 text-stone-600 hover:bg-stone-50'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-stone-500 mb-3">
        同比上月：本月 {monthCompare.thisMonth} 人次，上月 {monthCompare.lastMonth} 人次
        <span
          className={
            monthCompare.delta >= 0 ? 'text-emerald-700 ml-1' : 'text-amber-700 ml-1'
          }
        >
          （{deltaSign}
          {monthCompare.delta}，{pctSign}
          {monthCompare.deltaPercent}%）
        </span>
      </p>

      <div className="h-48 sm:h-56">
        {loading ? (
          <p className="text-sm text-stone-400 text-center py-16">加载图表…</p>
        ) : points.every((p) => p.done === 0) ? (
          <p className="text-sm text-stone-400 text-center py-16">
            暂无完成记录，叫号标记「完成」后会出现数据
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={points} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10 }}
                interval={range === '30d' ? 4 : range === 'month' ? 2 : 0}
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 10 }} width={28} />
              <Tooltip
                formatter={(v) => [`${v ?? 0} 人次`, '完成']}
                labelFormatter={(l) => String(l)}
              />
              <Bar dataKey="done" fill="#FDD772" stroke="#10143A" strokeWidth={1} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-stone-100 flex flex-wrap gap-3 text-xs">
        <button
          type="button"
          onClick={() => onTabChange('wellness')}
          className="text-[#10143A] font-medium hover:underline"
        >
          养生知识：已启用 {summary.wellness.enabledCount}/{summary.wellness.totalCount} →
        </button>
        {summary.nextOffDay ? (
          <button
            type="button"
            onClick={() => onTabChange('schedule')}
            className="text-stone-600 hover:underline"
          >
            下次休息：{summary.nextOffDay.date}（{summary.nextOffDay.label}）→
          </button>
        ) : (
          <span className="text-stone-400">一年内未设置全天休息</span>
        )}
      </div>
    </div>
  );
};
