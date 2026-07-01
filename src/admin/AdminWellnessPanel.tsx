/**
 * 店员后台：养生知识增删改
 */

import React, { useEffect, useState } from 'react';
import {
  staffFetchWellnessTips,
  staffCreateWellnessTip,
  staffUpdateWellnessTip,
  staffDeleteWellnessTip,
} from '../api/admin';
import type { WellnessTip } from '../types';
import { Leaf, Plus, Save, Trash2, Eye, EyeOff } from 'lucide-react';

const emptyForm = (): Omit<WellnessTip, 'createdAt' | 'updatedAt'> => ({
  id: '',
  tagZh: '',
  tagEn: '',
  titleZh: '',
  titleEn: '',
  bodyZh: '',
  bodyEn: '',
  sortOrder: 0,
  enabled: true,
});

interface AdminWellnessPanelProps {
  onMessage?: (msg: string) => void;
}

export const AdminWellnessPanel: React.FC<AdminWellnessPanelProps> = ({ onMessage }) => {
  const [tips, setTips] = useState<WellnessTip[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [localMsg, setLocalMsg] = useState('');

  const load = () => {
    setLoading(true);
    staffFetchWellnessTips()
      .then(setTips)
      .catch((e) => {
        const msg = e instanceof Error ? e.message : '加载失败';
        setLocalMsg(msg);
        onMessage?.(msg);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const startNew = () => {
    const maxOrder = tips.reduce((m, t) => Math.max(m, t.sortOrder), -1);
    setEditingId('__new__');
    setForm({ ...emptyForm(), sortOrder: maxOrder + 1 });
    setLocalMsg('');
  };

  const startEdit = (tip: WellnessTip) => {
    setEditingId(tip.id);
    setForm({
      id: tip.id,
      tagZh: tip.tagZh,
      tagEn: tip.tagEn,
      titleZh: tip.titleZh,
      titleEn: tip.titleEn,
      bodyZh: tip.bodyZh,
      bodyEn: tip.bodyEn,
      sortOrder: tip.sortOrder,
      enabled: tip.enabled,
    });
    setLocalMsg('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm());
  };

  const handleSave = async () => {
    setSaving(true);
    setLocalMsg('');
    try {
      if (editingId === '__new__') {
        await staffCreateWellnessTip(form);
        setLocalMsg('已新增');
        onMessage?.('养生知识已新增');
      } else if (editingId) {
        await staffUpdateWellnessTip(editingId, form);
        setLocalMsg('已保存');
        onMessage?.('养生知识已保存');
      }
      cancelEdit();
      load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : '保存失败';
      setLocalMsg(msg);
      onMessage?.(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除这条养生知识？')) return;
    try {
      await staffDeleteWellnessTip(id);
      onMessage?.('已删除');
      if (editingId === id) cancelEdit();
      load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : '删除失败';
      setLocalMsg(msg);
    }
  };

  const toggleEnabled = async (tip: WellnessTip) => {
    try {
      await staffUpdateWellnessTip(tip.id, { enabled: !tip.enabled });
      load();
    } catch (e) {
      setLocalMsg(e instanceof Error ? e.message : '更新失败');
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif font-bold text-stone-800 flex items-center gap-2">
          <Leaf size={18} className="text-[#FDD772]" />
          养生知识
        </h2>
        <button
          type="button"
          onClick={startNew}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#10143A] text-[#FDD772] text-sm font-medium"
        >
          <Plus size={16} />
          新增一条
        </button>
      </div>

      <p className="text-xs text-stone-500">
        官网「养生知识」轮播每 30 秒自动切换；仅「显示」状态的条目会出现在前台。
      </p>

      {localMsg && (
        <p className="text-sm text-stone-700 bg-[#DEEAF4]/40 border border-[#10143A]/10 rounded-lg px-3 py-2">
          {localMsg}
        </p>
      )}

      {editingId && (
        <div className="border border-[#FDD772]/40 rounded-xl p-4 space-y-3 bg-[#FAF8F5]">
          <p className="text-sm font-semibold text-stone-800">
            {editingId === '__new__' ? '新增条目' : '编辑条目'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block text-xs">
              <span className="text-stone-500">标签（中）</span>
              <input
                className="mt-1 w-full border rounded-lg px-2 py-1.5 text-sm"
                value={form.tagZh}
                onChange={(e) => setForm((f) => ({ ...f, tagZh: e.target.value }))}
              />
            </label>
            <label className="block text-xs">
              <span className="text-stone-500">标签（英）</span>
              <input
                className="mt-1 w-full border rounded-lg px-2 py-1.5 text-sm"
                value={form.tagEn}
                onChange={(e) => setForm((f) => ({ ...f, tagEn: e.target.value }))}
              />
            </label>
            <label className="block text-xs sm:col-span-2">
              <span className="text-stone-500">标题（中）</span>
              <input
                className="mt-1 w-full border rounded-lg px-2 py-1.5 text-sm"
                value={form.titleZh}
                onChange={(e) => setForm((f) => ({ ...f, titleZh: e.target.value }))}
              />
            </label>
            <label className="block text-xs sm:col-span-2">
              <span className="text-stone-500">标题（英）</span>
              <input
                className="mt-1 w-full border rounded-lg px-2 py-1.5 text-sm"
                value={form.titleEn}
                onChange={(e) => setForm((f) => ({ ...f, titleEn: e.target.value }))}
              />
            </label>
            <label className="block text-xs sm:col-span-2">
              <span className="text-stone-500">正文（中）</span>
              <textarea
                className="mt-1 w-full border rounded-lg px-2 py-1.5 text-sm min-h-[88px]"
                value={form.bodyZh}
                onChange={(e) => setForm((f) => ({ ...f, bodyZh: e.target.value }))}
              />
            </label>
            <label className="block text-xs sm:col-span-2">
              <span className="text-stone-500">正文（英，可留空）</span>
              <textarea
                className="mt-1 w-full border rounded-lg px-2 py-1.5 text-sm min-h-[88px]"
                value={form.bodyEn}
                onChange={(e) => setForm((f) => ({ ...f, bodyEn: e.target.value }))}
              />
            </label>
            <label className="block text-xs">
              <span className="text-stone-500">排序（数字越小越靠前）</span>
              <input
                type="number"
                className="mt-1 w-full border rounded-lg px-2 py-1.5 text-sm"
                value={form.sortOrder}
                onChange={(e) =>
                  setForm((f) => ({ ...f, sortOrder: Number(e.target.value) || 0 }))
                }
              />
            </label>
            <label className="flex items-center gap-2 text-sm pt-5">
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))}
              />
              在官网显示
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-[#FDD772] text-stone-900 text-sm font-medium disabled:opacity-60"
            >
              <Save size={16} />
              {saving ? '保存中…' : '保存'}
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              className="px-4 py-2 rounded-lg border text-sm text-stone-600"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-stone-500">加载中…</p>
      ) : tips.length === 0 ? (
        <p className="text-sm text-stone-500">暂无条目，请点「新增一条」。</p>
      ) : (
        <ul className="space-y-3">
          {tips.map((tip) => (
            <li
              key={tip.id}
              className="border border-stone-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-start gap-3"
            >
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#DEEAF4]/50 text-[#10143A]">
                    {tip.tagZh}
                  </span>
                  {!tip.enabled && (
                    <span className="text-[10px] text-stone-400">（已隐藏）</span>
                  )}
                  <span className="text-[10px] text-stone-400 font-mono">#{tip.sortOrder}</span>
                </div>
                <p className="font-serif font-semibold text-stone-800 text-sm">{tip.titleZh}</p>
                <p className="text-xs text-stone-500 line-clamp-2">{tip.bodyZh}</p>
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => toggleEnabled(tip)}
                  className="p-2 rounded-lg border text-stone-600 hover:bg-stone-50"
                  title={tip.enabled ? '隐藏' : '显示'}
                >
                  {tip.enabled ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
                <button
                  type="button"
                  onClick={() => startEdit(tip)}
                  className="px-3 py-2 rounded-lg border text-xs font-medium text-stone-700"
                >
                  编辑
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(tip.id)}
                  className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
