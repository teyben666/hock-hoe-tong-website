/**
 * 正式启动：NODE_ENV=production，由 Express 同时提供 dist/ 与 /api
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distIndex = path.join(root, 'dist', 'index.html');

if (!fs.existsSync(distIndex)) {
  console.error('[prod] 未找到 dist/index.html，请先运行: npm run build');
  process.exit(1);
}

process.env.NODE_ENV = 'production';
if (!process.env.SERVE_STATIC) process.env.SERVE_STATIC = 'true';

const r = spawnSync('npx', ['tsx', 'server/index.ts'], {
  stdio: 'inherit',
  env: process.env,
  shell: true,
  cwd: root,
});

process.exit(r.status === null ? 1 : r.status);
