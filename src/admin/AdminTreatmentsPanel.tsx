/**
 * 店员后台：治疗项目增删改（含图/视频）
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  staffFetchTreatmentsAdmin,
  staffCreateTreatment,
  staffUpdateTreatment,
  staffDeleteTreatment,
  staffUploadWellnessMedia,
} from '../api/admin';
import type { Treatment } from '../types';
import {
  Stethoscope,
  Plus,
  Save,
  Trash2,
  Eye,
  EyeOff,
  ImagePlus,
  Film,
  X,
} from 'lucide-react';
import { WellnessImageEditor } from './WellnessImageEditor';

const ICON_OPTIONS = [
  'Leaf',
  'Activity',
  'Flame',
  'CircleDot',
  'Baby',
  'UtensilsCrossed',
  'Heart',
  'Sparkles',
  'Hand',
];

const emptyForm = (): Treatment => ({
  id: '',
  name: '',
  nameEn: '',
  tagline: '',
  operation: '',
  effects: '',
  suitableFor: '',
  iconName: 'Activity',
  imageUrl: '',
  videoUrl: '',
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

export const AdminTreatmentsPanel: React.FC<Props> = ({ onMessage }) => {
  const [list, setList] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<'image' | 'video' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Treatment>(emptyForm());
  const [localMsg, setLocalMsg] = useState('');
  const [imageEditorSrc, setImageEditorSrc] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const load = () => {
    setLoading(true);
    staffFetchTreatmentsAdmin()
      .then(setList)
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
    const maxOrder = list.reduce((m, t) => Math.max(m, t.sortOrder ?? 0), -1);
    setEditingId('__new__');
    setForm({ ...emptyForm(), sortOrder: maxOrder + 1 });
    setLocalMsg('');
    scrollForm();
  };

  const startEdit = (t: Treatment) => {
    setEditingId(t.id);
    setForm({
      ...emptyForm(),
      ...t,
      nameEn: t.nameEn || '',
      tagline: t.tagline || '',
      imageUrl: t.imageUrl || '',
      videoUrl: t.videoUrl || '',
      sortOrder: t.sortOrder ?? 0,
      enabled: t.enabled !== false,
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
        await staffCreateTreatment(payload);
        onMessage?.('治疗项目已新增');
      } else if (editingId) {
        await staffUpdateTreatment(editingId, form);
        onMessage?.('治疗项目已保存');
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
    if (!confirm('确定删除该治疗项目？已有预约仍保留旧项目名显示。')) return;
    try {
      await staffDeleteTreatment(id);
      if (editingId === id) cancelEdit();
      load();
    } catch (e) {
      setLocalMsg(e instanceof Error ? e.message : '删除失败');
    }
  };

  const toggleEnabled = async (t: Treatment) => {
    try {
      await staffUpdateTreatment(t.id, { enabled: !t.enabled });
      load();
    } catch (e) {
      setLocalMsg(e instanceof Error ? e.message : '更新失败');
    }
  };

  const openImageEditor = async (file?: File) => {
    if (!file) return;
    try {
      setImageEditorSrc(await readFileAsDataUrl(file));
    } catch (e) {
      setLocalMsg(e instanceof Error ? e.message : '读取失败');
    }
  };

  const onCropConfirm = async (jpegDataUrl: string) => {
    setImageEditorSrc(null);
    setUploading('image');
    try {
      const url = await staffUploadWellnessMedia('image', jpegDataUrl, 'treatments');
      setForm((f) => ({ ...f, imageUrl: url }));
      setLocalMsg('图片已上传');
    } catch (e) {
      setLocalMsg(e instanceof Error ? e.message : '上传失败');
    } finally {
      setUploading(null);
    }
  };

  const handleVideo = async (file?: File) => {
    if (!file) return;
    setUploading('video');
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const url = await staffUploadWellnessMedia('video', dataUrl, 'treatments');
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
          previewTitle={form.name || '治疗项目'}
          onCancel={() => setImageEditorSrc(null)}
          onConfirm={onCropConfirm}
        />
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif font-bold text-stone-800 flex items-center gap-2">
          <Stethoscope size={18} className="text-[#FDD772]" />
          治疗项目
        </h2>
        <button
          type="button"
          onClick={startNew}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#10143A] text-[#FDD772] text-sm font-medium"
        >
          <Plus size={16} />
          新增项目
        </button>
      </div>
      <p className="text-xs text-stone-500">
        官网「治疗项目」列表与预约下拉同源；可加图/视频，隐藏后前台不显示。
      </p>

      {localMsg ? (
        <p className="text-sm bg-[#DEEAF4]/40 border rounded-lg px-3 py-2">{localMsg}</p>
      ) : null}

      {editingId && (
        <div
          ref={formRef}
          className="border border-[#FDD772]/40 rounded-xl p-4 space-y-3 bg-[#FAF8F5] scroll-mt-24"
        >
          <p className="text-sm font-semibold">
            {editingId === '__new__' ? '新增项目' : '编辑项目'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block text-xs">
              名称（中）*
              <input
                className="mt-1 w-full border rounded-lg px-2 py-1.5 text-sm"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </label>
            <label className="block text-xs">
              名称（英）
              <input
                className="mt-1 w-full border rounded-lg px-2 py-1.5 text-sm"
                value={form.nameEn || ''}
                onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))}
              />
            </label>
            <label className="block text-xs sm:col-span-2">
              标语（可选）
              <input
                className="mt-1 w-full border rounded-lg px-2 py-1.5 text-sm"
                value={form.tagline || ''}
                onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))}
              />
            </label>
            <label className="block text-xs sm:col-span-2">
              操作方式 *
              <textarea
                className="mt-1 w-full border rounded-lg px-2 py-1.5 text-sm min-h-[72px] whitespace-pre-wrap"
                value={form.operation}
                onChange={(e) => setForm((f) => ({ ...f, operation: e.target.value }))}
              />
            </label>
            <label className="block text-xs sm:col-span-2">
              功效作用 *
              <textarea
                className="mt-1 w-full border rounded-lg px-2 py-1.5 text-sm min-h-[72px] whitespace-pre-wrap"
                value={form.effects}
                onChange={(e) => setForm((f) => ({ ...f, effects: e.target.value }))}
              />
            </label>
            <label className="block text-xs sm:col-span-2">
              适合人群 *
              <textarea
                className="mt-1 w-full border rounded-lg px-2 py-1.5 text-sm min-h-[56px] whitespace-pre-wrap"
                value={form.suitableFor}
                onChange={(e) => setForm((f) => ({ ...f, suitableFor: e.target.value }))}
              />
            </label>
            <label className="block text-xs">
              图标
              <select
                className="mt-1 w-full border rounded-lg px-2 py-1.5 text-sm"
                value={form.iconName}
                onChange={(e) => setForm((f) => ({ ...f, iconName: e.target.value }))}
              >
                {ICON_OPTIONS.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs">
              排序
              <input
                type="number"
                className="mt-1 w-full border rounded-lg px-2 py-1.5 text-sm"
                value={form.sortOrder ?? 0}
                onChange={(e) =>
                  setForm((f) => ({ ...f, sortOrder: Number(e.target.value) || 0 }))
                }
              />
            </label>
            <label className="flex items-center gap-2 text-sm pt-5 sm:col-span-2">
              <input
                type="checkbox"
                checked={form.enabled !== false}
                onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))}
              />
              在官网显示
            </label>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-stone-500">图片 / 视频（可选）</p>
            <div className="flex flex-wrap gap-2">
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
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
                  void handleVideo(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
              <button
                type="button"
                disabled={uploading !== null}
                onClick={() => imageInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs"
              >
                <ImagePlus size={14} />
                {uploading === 'image' ? '上传中…' : '裁剪上传图片'}
              </button>
              <button
                type="button"
                disabled={uploading !== null}
                onClick={() => videoInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs"
              >
                <Film size={14} />
                {uploading === 'video' ? '上传中…' : '上传视频'}
              </button>
            </div>
            {form.imageUrl ? (
              <div className="relative inline-block">
                <img src={form.imageUrl} alt="" className="max-h-36 rounded-lg border" />
                <button
                  type="button"
                  className="absolute top-1 right-1 p-1 bg-white rounded-full border"
                  onClick={() => setForm((f) => ({ ...f, imageUrl: '' }))}
                >
                  <X size={14} />
                </button>
              </div>
            ) : null}
            {form.videoUrl ? (
              <div className="relative max-w-sm">
                <video src={form.videoUrl} controls className="w-full max-h-40 rounded-lg bg-black" />
                <button
                  type="button"
                  className="absolute top-1 right-1 p-1 bg-white rounded-full border"
                  onClick={() => setForm((f) => ({ ...f, videoUrl: '' }))}
                >
                  <X size={14} />
                </button>
              </div>
            ) : null}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={saving || uploading !== null}
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
          {list.map((t) => (
            <li
              key={t.id}
              className="border rounded-xl p-4 flex flex-col sm:flex-row gap-3 sm:items-start"
            >
              <div className="flex-1 min-w-0">
                <p className="font-serif font-semibold text-sm">{t.name}</p>
                <p className="text-[10px] text-stone-400 mt-0.5">
                  {t.nameEn} · #{t.sortOrder ?? 0}
                  {t.enabled === false ? ' · 已隐藏' : ''}
                  {t.imageUrl ? ' · 含图' : ''}
                  {t.videoUrl ? ' · 含视频' : ''}
                </p>
                <p className="text-xs text-stone-500 line-clamp-2 mt-1">{t.operation}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button type="button" className="p-2 border rounded-lg" onClick={() => toggleEnabled(t)}>
                  {t.enabled !== false ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
                <button
                  type="button"
                  className="px-3 py-2 border rounded-lg text-xs"
                  onClick={() => startEdit(t)}
                >
                  编辑
                </button>
                <button
                  type="button"
                  className="p-2 border border-red-200 text-red-600 rounded-lg"
                  onClick={() => handleDelete(t.id)}
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
