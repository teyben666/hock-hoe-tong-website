/**
 * CORS：读取 .env.local 的 CORS_ORIGIN
 * 未配置时等同原先 origin: true（开发方便）
 */

import type { CorsOptions } from 'cors';

function normalizeOrigin(url: string): string {
  return url.trim().replace(/\/$/, '');
}

export function getCorsOptions(): CorsOptions {
  const raw = process.env.CORS_ORIGIN?.trim();

  if (!raw) {
    return { origin: true, credentials: true };
  }

  const origins = raw
    .split(',')
    .map(normalizeOrigin)
    .filter(Boolean);

  if (origins.length === 0) {
    return { origin: true, credentials: true };
  }

  return {
    origin: origins.length === 1 ? origins[0] : origins,
    credentials: true,
  };
}

export function corsOriginsLabel(): string {
  const raw = process.env.CORS_ORIGIN?.trim();
  if (!raw) return '全部来源（开发模式，未设置 CORS_ORIGIN）';
  return raw
    .split(',')
    .map(normalizeOrigin)
    .filter(Boolean)
    .join(', ');
}
