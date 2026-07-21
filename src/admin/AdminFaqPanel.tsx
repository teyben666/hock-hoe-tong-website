/**
 * 店员后台：常见问题 FAQ 增删改（支持换行、**加粗**）
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  staffFetchFaqs,
  staffCreateFaq,
  staffUpdateFaq,
  staffDeleteFaq,
} from '../api/admin';
import type { FaqItem } from '../types';
import { HelpCircle, Plus, Save, Trash2, Eye, EyeOff } from 'lucide-react';

const emptyForm = (): Omit<FaqItem, 'createdAt' | 'updatedAt'> => ({
  id: '',
  questionZh: '',
  questionEn: '',
  answerZh: '',
  answerEn: '',
  sortOrder: 0,
  enabled: true,
});

interface AdminFaqPanelProps {
  onMessage?: (msg: string) => void;
}

export const AdminFaqPanel: React.FC<AdminFaqPanelProps> = ({ onMessage }) => {
  const [items, setItems] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [localMsg, setLocalMsg] = useState('');
  const formRef = useRef<HTMLDivElement>(null);

  const load = () => {
    setLoading(true);
    staffFetchFaqs()
      .then(setItems)
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

  const scrollFormIntoView = () => {
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const startNew = () => {
    const maxOrder = items.reduce((m, t) => Math.max(m, t.sortOrder), -1);
    setEditingId('__new__');
    setForm({ ...emptyForm(), sortOrder: maxOrder + 1 });
    setLocalMsg('');
    scrollFormIntoView();
  };

  const startEdit = (item: FaqItem) => {
    setEditingId(item.id);
    setForm({
      id: item.id,
      questionZh: item.questionZh,
      questionEn: item.questionEn,
      answerZh: item.answerZh,
      answerEn: item.answerEn,
      sortOrder: item.sortOrder,
      enabled: item.enabled,
    });
    setLocalMsg('');
    scrollFormIntoView();
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
        const { id: _omitId, ...payload } = form;
        await staffCreateFaq({ ...payload, id: '' });
        setLocalMsg('已新增');
        onMessage?.('FAQ 已新增');
      } else if (editingId) {
        await staffUpdateFaq(editingId, form);
        setLocalMsg('已保存');
        onMessage?.('FAQ 已保存');
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
    if (!id) {
      setLocalMsg('该条目 ID 无效，请删除后重新新增');
      return;
    }
    if (!confirm('确定删除这条 FAQ？')) return;
    try {
      await staffDeleteFaq(id);
      onMessage?.('已删除');
      if (editingId === id) cancelEdit();
      load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : '删除失败';
      setLocalMsg(msg);
    }
  };

  const toggleEnabled = async (item: FaqItem) => {
    if (!item.id) {
      setLocalMsg('该条目 ID 无效，请编辑保存一次或删除后重建');
      return;
    }
    try {
      await staffUpdateFaq(item.id, { enabled: !item.enabled });
      load();
    } catch (e) {
      setLocalMsg(e instanceof Error ? e.message : '更新失败');
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif font-bold text-stone-800 flex items-center gap-2">
          <HelpCircle size={18} className="text-[#FDD772]" />
          常见问题 FAQ
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

      <p className="text-xs text-stone-500 leading-relaxed">
        官网「常见问题」为手风琴展示；仅「显示」状态会出现在前台。
        答案可按 Enter 换行；用 <code className="bg-stone-100 px-1 rounded">**文字**</code> 加粗。
      </p>

      {localMsg && (
        <p className="text-sm text-stone-700 bg-[#DEEAF4]/40 border border-[#10143A]/10 rounded-lg px-3 py-2">
          {localMsg}
        </p>
      )}

      {editingId && (
        <div
          ref={formRef}
          className="border border-[#FDD772]/40 rounded-xl p-4 space-y-3 bg-[#FAF8F5] scroll-mt-24"
        >
          <p className="text-sm font-semibold text-stone-800">
            {editingId === '__new__' ? '新增 FAQ' : '编辑 FAQ'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block text-xs sm:col-span-2">
              <span className="text-stone-500">问题（中）</span>
              <input
                className="mt-1 w-full border rounded-lg px-2 py-1.5 text-sm"
                value={form.questionZh}
                onChange={(e) => setForm((f) => ({ ...f, questionZh: e.target.value }))}
              />
            </label>
            <label className="block text-xs sm:col-span-2">
              <span className="text-stone-500">问题（英，可留空）</span>
              <input
                className="mt-1 w-full border rounded-lg px-2 py-1.5 text-sm"
                value={form.questionEn}
                onChange={(e) => setForm((f) => ({ ...f, questionEn: e.target.value }))}
              />
            </label>
            <label className="block text-xs sm:col-span-2">
              <span className="text-stone-500">答案（中）— Enter 换行，**加粗**</span>
              <textarea
                className="mt-1 w-full border rounded-lg px-2 py-1.5 text-sm min-h-[120px] whitespace-pre-wrap"
                value={form.answerZh}
                onChange={(e) => setForm((f) => ({ ...f, answerZh: e.target.value }))}
              />
            </label>
            <label className="block text-xs sm:col-span-2">
              <span className="text-stone-500">答案（英，可留空）</span>
              <textarea
                className="mt-1 w-full border rounded-lg px-2 py-1.5 text-sm min-h-[88px] whitespace-pre-wrap"
                value={form.answerEn}
                onChange={(e) => setForm((f) => ({ ...f, answerEn: e.target.value }))}
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
      ) : items.length === 0 ? (
        <p className="text-sm text-stone-500">暂无条目，请点「新增一条」。</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.id || `broken-${item.questionZh}-${item.sortOrder}`}
              className="border border-stone-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-start gap-3"
            >
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  {!item.enabled && (
                    <span className="text-[10px] text-stone-400">（已隐藏）</span>
                  )}
                  {!item.id && (
                    <span className="text-[10px] text-red-500">ID 缺失，请重新保存</span>
                  )}
                  <span className="text-[10px] text-stone-400 font-mono">#{item.sortOrder}</span>
                </div>
                <p className="font-serif font-semibold text-stone-800 text-sm">
                  {item.questionZh}
                </p>
                <p className="text-xs text-stone-500 line-clamp-2 whitespace-pre-line">
                  {item.answerZh}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => toggleEnabled(item)}
                  className="p-2 rounded-lg border text-stone-600 hover:bg-stone-50"
                  title={item.enabled ? '隐藏' : '显示'}
                >
                  {item.enabled ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
                <button
                  type="button"
                  onClick={() => startEdit(item)}
                  className="px-3 py-2 rounded-lg border text-xs font-medium text-stone-700"
                >
                  编辑
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
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
