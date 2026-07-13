/**
 * 养生知识媒体上传（图片 / 视频 → server/data/uploads/wellness）
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const UPLOADS_ROOT = path.join(__dirname, 'data', 'uploads');
export const WELLNESS_UPLOAD_DIR = path.join(UPLOADS_ROOT, 'wellness');

const IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

const VIDEO_TYPES: Record<string, string> = {
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
};

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_VIDEO_BYTES = 30 * 1024 * 1024;

function ensureDir() {
  if (!fs.existsSync(WELLNESS_UPLOAD_DIR)) {
    fs.mkdirSync(WELLNESS_UPLOAD_DIR, { recursive: true });
  }
}

/**
 * 解析 data URL，写入磁盘，返回公开路径 /uploads/wellness/xxx
 */
export function saveWellnessDataUrl(
  dataUrl: string,
  kind: 'image' | 'video'
): { url: string; bytes: number } {
  const match = /^data:([^;]+);base64,(.+)$/s.exec(String(dataUrl || '').trim());
  if (!match) throw new Error('无效的文件数据，请重新选择文件');

  const mime = match[1].toLowerCase();
  const b64 = match[2];
  const allowed = kind === 'image' ? IMAGE_TYPES : VIDEO_TYPES;
  const ext = allowed[mime];
  if (!ext) {
    throw new Error(
      kind === 'image'
        ? '仅支持 JPG / PNG / WebP / GIF 图片'
        : '仅支持 MP4 / WebM / MOV 视频'
    );
  }

  const buf = Buffer.from(b64, 'base64');
  const max = kind === 'image' ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
  if (buf.length > max) {
    throw new Error(
      kind === 'image' ? '图片请小于 5MB' : '视频请小于 30MB'
    );
  }

  ensureDir();
  const filename = `${kind}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
  fs.writeFileSync(path.join(WELLNESS_UPLOAD_DIR, filename), buf);
  return { url: `/uploads/wellness/${filename}`, bytes: buf.length };
}
