/**
 * 养生图片编辑：裁剪（16:9 / 自由）+ 卡片预览 + 自动压缩
 */

import React, { useCallback, useEffect, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';
import { X, Check, RotateCcw } from 'lucide-react';
import { cropAndCompressImage, cropImageToCanvas, compressCanvasToJpeg } from '../utils/wellnessImage';

type AspectMode = '16:9' | 'free';

interface WellnessImageEditorProps {
  imageSrc: string;
  /** 卡片预览用的标题（可选） */
  previewTitle?: string;
  onCancel: () => void;
  onConfirm: (jpegDataUrl: string) => void;
}

export const WellnessImageEditor: React.FC<WellnessImageEditorProps> = ({
  imageSrc,
  previewTitle = '养生知识预览',
  onCancel,
  onConfirm,
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspectMode, setAspectMode] = useState<AspectMode>('16:9');
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const aspect = aspectMode === '16:9' ? 16 / 9 : undefined;

  const onCropComplete = useCallback((_area: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  // 裁剪变化时更新右侧/下方卡片预览（未最终压缩尺寸，但比例一致）
  useEffect(() => {
    if (!croppedAreaPixels) return;
    let cancelled = false;
    (async () => {
      try {
        const canvas = await cropImageToCanvas(imageSrc, croppedAreaPixels);
        const url = compressCanvasToJpeg(canvas, 800, 0.85);
        if (!cancelled) setPreviewUrl(url);
      } catch {
        /* 预览失败不打断编辑 */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [croppedAreaPixels, imageSrc]);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) {
      setError('请先调整裁剪区域');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const dataUrl = await cropAndCompressImage(imageSrc, croppedAreaPixels);
      onConfirm(dataUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : '处理图片失败');
    } finally {
      setBusy(false);
    }
  };

  const resetView = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
      <div
        className="bg-white w-full sm:max-w-3xl sm:rounded-2xl shadow-xl max-h-[95vh] overflow-y-auto flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label="裁剪养生图片"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b sticky top-0 bg-white z-10">
          <h3 className="font-serif font-bold text-stone-800 text-sm sm:text-base">
            裁剪图片
          </h3>
          <button
            type="button"
            onClick={onCancel}
            className="p-2 rounded-lg hover:bg-stone-100 text-stone-500"
            aria-label="关闭"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-stone-500">比例</span>
            <button
              type="button"
              onClick={() => {
                setAspectMode('16:9');
                resetView();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                aspectMode === '16:9'
                  ? 'bg-[#10143A] text-[#FDD772] border-[#10143A]'
                  : 'bg-white text-stone-600 border-stone-200'
              }`}
            >
              16:9（推荐）
            </button>
            <button
              type="button"
              onClick={() => {
                setAspectMode('free');
                resetView();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                aspectMode === 'free'
                  ? 'bg-[#10143A] text-[#FDD772] border-[#10143A]'
                  : 'bg-white text-stone-600 border-stone-200'
              }`}
            >
              自由裁剪
            </button>
            <button
              type="button"
              onClick={resetView}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs border text-stone-600 ml-auto"
            >
              <RotateCcw size={12} />
              重置
            </button>
          </div>

          <div className="relative w-full h-[240px] sm:h-[320px] bg-stone-900 rounded-xl overflow-hidden">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              objectFit="contain"
              showGrid
            />
          </div>

          <label className="block text-xs text-stone-500">
            缩放
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="mt-1 w-full accent-[#FDD772]"
            />
          </label>

          <div className="space-y-2">
            <p className="text-xs font-medium text-stone-600">官网卡片效果预览</p>
            <div className="bg-[#F5F3EF]/80 rounded-xl border border-stone-200/60 p-3 max-w-md">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="预览"
                  className="w-full max-h-40 object-cover rounded-lg border border-stone-200/60"
                />
              ) : (
                <div className="h-28 rounded-lg bg-stone-200/50 flex items-center justify-center text-xs text-stone-400">
                  调整裁剪后显示预览
                </div>
              )}
              <p className="font-serif font-bold text-[#10143A] text-sm mt-2 truncate">
                {previewTitle}
              </p>
              <p className="text-[11px] text-stone-500 mt-0.5">
                确认后会自动压缩再上传（最长边约 1600px）
              </p>
            </div>
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </div>

        <div className="flex flex-wrap gap-2 justify-end px-4 py-3 border-t sticky bottom-0 bg-white">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="px-4 py-2 rounded-lg border text-sm text-stone-600"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={busy || !croppedAreaPixels}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#FDD772] text-stone-900 text-sm font-medium disabled:opacity-60"
          >
            <Check size={16} />
            {busy ? '处理中…' : '确认并上传'}
          </button>
        </div>
      </div>
    </div>
  );
};
