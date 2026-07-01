/**
 * 正式环境：托管 Vite 构建产物 dist/（官网 + /admin SPA）
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Express } from 'express';
import express from 'express';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const DIST_DIR = path.join(root, 'dist');

export function shouldServeStatic(): boolean {
  if (process.env.SERVE_STATIC === 'false') return false;
  const indexFile = path.join(DIST_DIR, 'index.html');
  if (!fs.existsSync(indexFile)) return false;
  if (process.env.SERVE_STATIC === 'true') return true;
  return process.env.NODE_ENV === 'production';
}

export function attachStaticSite(app: Express): boolean {
  if (!shouldServeStatic()) return false;

  app.use(
    express.static(DIST_DIR, {
      index: false,
      maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
    })
  );

  /** SPA：/admin 等前端路由回 index.html；/api 已由上文路由处理 */
  app.get(/^(?!\/api).*/, (req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    res.sendFile(path.join(DIST_DIR, 'index.html'), (err) => {
      if (err) next(err);
    });
  });

  return true;
}
