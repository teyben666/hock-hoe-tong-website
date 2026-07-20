/**
 * 店员后台：中医知识库增删改（支持换行、**加粗**、图片裁剪压缩/视频）
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  staffFetchWellnessTips,
  staffCreateWellnessTip,
  staffUpdateWellnessTip,
  staffDeleteWellnessTip,
  staffUploadWellnessMedia,
} from '../api/admin';
import type { WellnessTip } from '../types';
import { Leaf, Plus, Save, Trash2, Eye, EyeOff, ImagePlus, Film, X } from 'lucide-react';
import { WellnessImageEditor } from './WellnessImageEditor';

const emptyForm = (): Omit<WellnessTip, 'createdAt' | 'updatedAt'> => ({
  id: '',
  tagZh: '',
  tagEn: '',
  titleZh: '',
  titleEn: '',
  bodyZh: '',
  bodyEn: '',
  imageUrl: '',
  videoUrl: '',
  sortOrder: 0,
  enabled: true,
  allowCollapse: true,
});

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('读取文件失败'));
    reader.readAsDataURL(file);
  });
}

interface AdminWellnessPanelProps {
  onMessage?: (msg: string) => void;
}

export const AdminWellnessPanel: React.FC<AdminWellnessPanelProps> = ({ onMessage }) => {
  const [tips, setTips] = useState<WellnessTip[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<'image' | 'video' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [localMsg, setLocalMsg] = useState('');
  const [imageEditorSrc, setImageEditorSrc] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

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

  const scrollFormIntoView = () => {
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const startNew = () => {
    const maxOrder = tips.reduce((m, t) => Math.max(m, t.sortOrder), -1);
    setEditingId('__new__');
    setForm({ ...emptyForm(), sortOrder: maxOrder + 1 });
    setLocalMsg('');
    scrollFormIntoView();
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
      imageUrl: tip.imageUrl || '',
      videoUrl: tip.videoUrl || '',
      sortOrder: tip.sortOrder,
      enabled: tip.enabled,
      allowCollapse: tip.allowCollapse !== false,
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
        await staffCreateWellnessTip({ ...payload, id: '' });
        setLocalMsg('已新增');
        onMessage?.('中医知识库已新增');
      } else if (editingId) {
        await staffUpdateWellnessTip(editingId, form);
        setLocalMsg('已保存');
        onMessage?.('中医知识库已保存');
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
    if (!confirm('确定删除这条中医知识库？')) return;
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
    if (!tip.id) {
      setLocalMsg('该条目 ID 无效，请编辑保存一次或删除后重建');
      return;
    }
    try {
      await staffUpdateWellnessTip(tip.id, { enabled: !tip.enabled });
      load();
    } catch (e) {
      setLocalMsg(e instanceof Error ? e.message : '更新失败');
    }
  };

  const openImageEditor = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setLocalMsg('请选择图片文件');
      return;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setImageEditorSrc(dataUrl);
      setLocalMsg('');
    } catch (e) {
      setLocalMsg(e instanceof Error ? e.message : '读取图片失败');
    }
  };

  const handleImageEditorConfirm = async (jpegDataUrl: string) => {
    setImageEditorSrc(null);
    setUploading('image');
    setLocalMsg('');
    try {
      const url = await staffUploadWellnessMedia('image', jpegDataUrl);
      setForm((f) => ({ ...f, imageUrl: url }));
      setLocalMsg('图片已裁剪压缩并上传');
      onMessage?.('养生图片已上传');
    } catch (e) {
      setLocalMsg(e instanceof Error ? e.message : '上传失败');
    } finally {
      setUploading(null);
    }
  };

  const handleVideoFile = async (file: File | undefined) => {
    if (!file) return;
    setUploading('video');
    setLocalMsg('');
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const url = await staffUploadWellnessMedia('video', dataUrl);
      setForm((f) => ({ ...f, videoUrl: url }));
      setLocalMsg('视频已上传');
    } catch (e) {
      setLocalMsg(e instanceof Error ? e.message : '上传失败');
    } finally {
      setUploading(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border space-y-5">
      {imageEditorSrc ? (
        <WellnessImageEditor
          imageSrc={imageEditorSrc}
          previewTitle={form.titleZh || '中医知识库预览'}
          onCancel={() => setImageEditorSrc(null)}
          onConfirm={handleImageEditorConfirm}
        />
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif font-bold text-stone-800 flex items-center gap-2">
          <Leaf size={18} className="text-[#FDD772]" />
          中医知识库
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
        官网「中医知识库」轮播每 30 秒自动切换；仅「显示」状态的条目会出现在前台。
        正文过长时前台会显示「展开全文」；可勾选是否允许「收起」。
        正文可按 Enter 换行；用 <code className="bg-stone-100 px-1 rounded">**文字**</code> 加粗。
        图片可选裁剪（16:9 / 自由）并自动压缩；视频仅限大小上传。
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
              <span className="text-stone-500">正文（中）— Enter 换行，**加粗**</span>
              <textarea
                className="mt-1 w-full border rounded-lg px-2 py-1.5 text-sm min-h-[120px] whitespace-pre-wrap"
                value={form.bodyZh}
                onChange={(e) => setForm((f) => ({ ...f, bodyZh: e.target.value }))}
              />
            </label>
            <label className="block text-xs sm:col-span-2">
              <span className="text-stone-500">正文（英，可留空）</span>
              <textarea
                className="mt-1 w-full border rounded-lg px-2 py-1.5 text-sm min-h-[88px] whitespace-pre-wrap"
                value={form.bodyEn}
                onChange={(e) => setForm((f) => ({ ...f, bodyEn: e.target.value }))}
              />
            </label>

            <div className="sm:col-span-2 space-y-2">
              <p className="text-xs text-stone-500">图片 / 视频（可选）</p>
              <div className="flex flex-wrap gap-2">
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => {
                    void openImageEditor(e.target.files?.[0]);
                    e.target.value = '';
                  }}
                />
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  className="hidden"
                  onChange={(e) => {
                    void handleVideoFile(e.target.files?.[0]);
                    e.target.value = '';
                  }}
                />
                <button
                  type="button"
                  disabled={uploading !== null}
                  onClick={() => imageInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium text-stone-700 disabled:opacity-60"
                >
                  <ImagePlus size={14} />
                  {uploading === 'image' ? '上传中…' : '选择图片并裁剪'}
                </button>
                <button
                  type="button"
                  disabled={uploading !== null}
                  onClick={() => videoInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium text-stone-700 disabled:opacity-60"
                >
                  <Film size={14} />
                  {uploading === 'video' ? '上传中…' : '上传视频'}
                </button>
              </div>
              {form.imageUrl ? (
                <div className="relative inline-block max-w-full">
                  <img
                    src={form.imageUrl}
                    alt="预览"
                    className="max-h-40 rounded-lg border border-stone-200"
                  />
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, imageUrl: '' }))}
                    className="absolute top-1 right-1 p-1 rounded-full bg-white/90 border shadow-sm"
                    title="移除图片"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : null}
              {form.videoUrl ? (
                <div className="relative max-w-md">
                  <video
                    src={form.videoUrl}
                    controls
                    className="w-full rounded-lg border border-stone-200 max-h-48 bg-black"
                  />
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, videoUrl: '' }))}
                    className="absolute top-1 right-1 p-1 rounded-full bg-white/90 border shadow-sm"
                    title="移除视频"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : null}
            </div>

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
            <label className="flex items-start gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={form.allowCollapse !== false}
                onChange={(e) => setForm((f) => ({ ...f, allowCollapse: e.target.checked }))}
              />
              <span>
                展开全文后显示「收起」
                <span className="block text-[11px] text-stone-400 mt-0.5">
                  取消勾选则类似 Facebook：点「展开全文」后不可再收起（换下一条会重置）
                </span>
              </span>
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={saving || uploading !== null}
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
              key={tip.id || `broken-${tip.titleZh}-${tip.sortOrder}`}
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
                  {!tip.id && (
                    <span className="text-[10px] text-red-500">ID 缺失，请重新保存</span>
                  )}
                  <span className="text-[10px] text-stone-400 font-mono">#{tip.sortOrder}</span>
                  {tip.imageUrl ? (
                    <span className="text-[10px] text-stone-400">含图</span>
                  ) : null}
                  {tip.videoUrl ? (
                    <span className="text-[10px] text-stone-400">含视频</span>
                  ) : null}
                </div>
                <p className="font-serif font-semibold text-stone-800 text-sm">{tip.titleZh}</p>
                <p className="text-xs text-stone-500 line-clamp-2 whitespace-pre-line">
                  {tip.bodyZh}
                </p>
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
