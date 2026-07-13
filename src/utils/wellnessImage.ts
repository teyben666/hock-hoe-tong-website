/**
 * 养生图片：按裁剪区域导出 + 压缩（最长边 / 质量）
 */

export type PixelCrop = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.8;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('图片加载失败'));
    img.src = src;
  });
}

/** 从原图按像素裁剪区域导出 canvas */
export async function cropImageToCanvas(
  imageSrc: string,
  crop: PixelCrop
): Promise<HTMLCanvasElement> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement('canvas');
  const w = Math.max(1, Math.round(crop.width));
  const h = Math.max(1, Math.round(crop.height));
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('无法处理图片');
  ctx.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, w, h);
  return canvas;
}

/** 最长边缩放到 maxEdge，导出 JPEG data URL */
export function compressCanvasToJpeg(
  source: HTMLCanvasElement,
  maxEdge = MAX_EDGE,
  quality = JPEG_QUALITY
): string {
  let { width, height } = source;
  const longest = Math.max(width, height);
  if (longest > maxEdge) {
    const scale = maxEdge / longest;
    width = Math.max(1, Math.round(width * scale));
    height = Math.max(1, Math.round(height * scale));
  }

  const out = document.createElement('canvas');
  out.width = width;
  out.height = height;
  const ctx = out.getContext('2d');
  if (!ctx) throw new Error('无法压缩图片');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(source, 0, 0, width, height);

  return out.toDataURL('image/jpeg', quality);
}

export async function cropAndCompressImage(
  imageSrc: string,
  crop: PixelCrop
): Promise<string> {
  const canvas = await cropImageToCanvas(imageSrc, crop);
  return compressCanvasToJpeg(canvas);
}
