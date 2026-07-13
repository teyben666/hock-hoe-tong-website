/**
 * 店员后台：About 区相册（30 秒轮播）
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  staffFetchAboutGallery,
  staffCreateAboutGalleryItem,
  staffUpdateAboutGalleryItem,
  staffDeleteAboutGalleryItem,
  staffUploadWellnessMedia,
} from '../api/admin';
import type { AboutGalleryItem } from '../types';
import { Images, Plus, Save, Trash2, Eye, EyeOff, ImagePlus, X } from 'lucide-react';
import { WellnessImageEditor } from './WellnessImageEditor';

const emptyForm = () => ({
  id: '',
  imageUrl: '',
  captionZh: '',
  captionEn: '',
  sortOrder: 0,
  enabled: true,
});

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('读取文件失败'));
    reader.readAsDataURL(file);
  });
}

interface Props {
  onMessage?: (msg: string) => void;
}

export const AdminAboutGalleryPanel: React.FC<Props> = ({ onMessage }) => {
  const [items, setItems] = useState<AboutGalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [localMsg, setLocalMsg] = useState('');
  const [imageEditorSrc, setImageEditorSrc] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const load = () => {
    setLoading(true);
    staffFetchAboutGallery()
      .then(setItems)
      .catch((e) => setLocalMsg(e instanceof Error ? e.message : '加载失败'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const scrollForm = () =>
    requestAnimationFrame(() =>
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    );

  const startNew = () => {
    const maxOrder = items.reduce((m, t) => Math.max(m, t.sortOrder), -1);
    setEditingId('__new__');
    setForm({ ...emptyForm(), sortOrder: maxOrder + 1 });
    setLocalMsg('');
    scrollForm();
  };

  const startEdit = (item: AboutGalleryItem) => {
    setEditingId(item.id);
    setForm({
      id: item.id,
      imageUrl: item.imageUrl,
      captionZh: item.captionZh || '',
      captionEn: item.captionEn || '',
      sortOrder: item.sortOrder,
      enabled: item.enabled,
    });
    setLocalMsg('');
    scrollForm();
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
        const { id: _id, ...payload } = form;
        await staffCreateAboutGalleryItem(payload);
        onMessage?.('相册已新增');
      } else if (editingId) {
        await staffUpdateAboutGalleryItem(editingId, form);
        onMessage?.('相册已保存');
      }
      cancelEdit();
      load();
    } catch (e) {
      setLocalMsg(e instanceof Error ? e.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除这张照片？')) return;
    try {
      await staffDeleteAboutGalleryItem(id);
      if (editingId === id) cancelEdit();
      load();
    } catch (e) {
      setLocalMsg(e instanceof Error ? e.message : '删除失败');
    }
  };

  const toggleEnabled = async (item: AboutGalleryItem) => {
    try {
      await staffUpdateAboutGalleryItem(item.id, { enabled: !item.enabled });
      load();
    } catch (e) {
      setLocalMsg(e instanceof Error ? e.message : '更新失败');
    }
  };

  const openEditor = async (file?: File) => {
    if (!file) return;
    try {
      setImageEditorSrc(await readFileAsDataUrl(file));
    } catch (e) {
      setLocalMsg(e instanceof Error ? e.message : '读取失败');
    }
  };

  const onCropConfirm = async (jpegDataUrl: string) => {
    setImageEditorSrc(null);
    setUploading(true);
    try {
      const url = await staffUploadWellnessMedia('image', jpegDataUrl, 'about');
      setForm((f) => ({ ...f, imageUrl: url }));
      setLocalMsg('图片已上传');
    } catch (e) {
      setLocalMsg(e instanceof Error ? e.message : '上传失败');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border space-y-5">
      {imageEditorSrc ? (
        <WellnessImageEditor
          imageSrc={imageEditorSrc}
          previewTitle={form.captionZh || 'About 相册'}
          onCancel={() => setImageEditorSrc(null)}
          onConfirm={onCropConfirm}
        />
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif font-bold text-stone-800 flex items-center gap-2">
          <Images size={18} className="text-[#FDD772]" />
          About 相册
        </h2>
        <button
          type="button"
          onClick={startNew}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#10143A] text-[#FDD772] text-sm font-medium"
        >
          <Plus size={16} />
          新增照片
        </button>
      </div>
      <p className="text-xs text-stone-500">
        官网「关于我们」上方每 30 秒自动切换；可放 logo、店面、诊室、药材等照片。
      </p>

      {localMsg ? (
        <p className="text-sm bg-[#DEEAF4]/40 border rounded-lg px-3 py-2">{localMsg}</p>
      ) : null}

      {editingId && (
        <div ref={formRef} className="border border-[#FDD772]/40 rounded-xl p-4 space-y-3 bg-[#FAF8F5] scroll-mt-24">
          <p className="text-sm font-semibold">{editingId === '__new__' ? '新增照片' : '编辑照片'}</p>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              void openEditor(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => imageInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs"
          >
            <ImagePlus size={14} />
            {uploading ? '上传中…' : '选择并裁剪图片'}
          </button>
          {form.imageUrl ? (
            <div className="relative inline-block">
              <img src={form.imageUrl} alt="" className="max-h-40 rounded-lg border" />
              <button
                type="button"
                className="absolute top-1 right-1 p-1 bg-white rounded-full border"
                onClick={() => setForm((f) => ({ ...f, imageUrl: '' }))}
              >
                <X size={14} />
              </button>
            </div>
          ) : null}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block text-xs">
              说明（中，可空）
              <input
                className="mt-1 w-full border rounded-lg px-2 py-1.5 text-sm"
                value={form.captionZh}
                onChange={(e) => setForm((f) => ({ ...f, captionZh: e.target.value }))}
              />
            </label>
            <label className="block text-xs">
              说明（英，可空）
              <input
                className="mt-1 w-full border rounded-lg px-2 py-1.5 text-sm"
                value={form.captionEn}
                onChange={(e) => setForm((f) => ({ ...f, captionEn: e.target.value }))}
              />
            </label>
            <label className="block text-xs">
              排序
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
          <div className="flex gap-2">
            <button
              type="button"
              disabled={saving || uploading}
              onClick={handleSave}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-[#FDD772] text-sm font-medium disabled:opacity-60"
            >
              <Save size={16} />
              {saving ? '保存中…' : '保存'}
            </button>
            <button type="button" onClick={cancelEdit} className="px-4 py-2 rounded-lg border text-sm">
              取消
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-stone-500">加载中…</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="border rounded-xl p-3 flex flex-col sm:flex-row gap-3 sm:items-center"
            >
              <img
                src={item.imageUrl}
                alt=""
                className="w-full sm:w-28 h-20 object-cover rounded-lg border bg-black"
              />
              <div className="flex-1 min-w-0 text-sm">
                <p className="font-medium truncate">{item.captionZh || '（无说明）'}</p>
                <p className="text-[10px] text-stone-400">
                  #{item.sortOrder}
                  {!item.enabled ? ' · 已隐藏' : ''}
                </p>
              </div>
              <div className="flex gap-2">
                <button type="button" className="p-2 border rounded-lg" onClick={() => toggleEnabled(item)}>
                  {item.enabled ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
                <button
                  type="button"
                  className="px-3 py-2 border rounded-lg text-xs"
                  onClick={() => startEdit(item)}
                >
                  编辑
                </button>
                <button
                  type="button"
                  className="p-2 border border-red-200 text-red-600 rounded-lg"
                  onClick={() => handleDelete(item.id)}
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
