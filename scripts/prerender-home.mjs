/**
 * Phase 2 SEO：构建后把首页静态 HTML 注入 dist/index.html 的 #root
 * 用法：vite build 之后自动执行（见 package.json build）
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PrerenderHome } from '../src/seo/PrerenderHome.tsx';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const indexPath = path.join(root, 'dist', 'index.html');

if (!fs.existsSync(indexPath)) {
  console.error('[prerender] 未找到 dist/index.html，请先执行 vite build');
  process.exit(1);
}

const markup = renderToStaticMarkup(createElement(PrerenderHome));
let html = fs.readFileSync(indexPath, 'utf-8');

const replaced = html.replace(
  /<div id="root">[\s\S]*?<\/div>/,
  `<div id="root">${markup}</div>`
);

if (replaced === html) {
  console.error('[prerender] 未能匹配 <div id="root">…</div>，请检查 dist/index.html');
  process.exit(1);
}

fs.writeFileSync(indexPath, replaced, 'utf-8');
console.log('[prerender] 已写入首页预渲染 HTML → dist/index.html');
