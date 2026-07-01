import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Plugin } from 'vite';
import { defineConfig, loadEnv } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function isTruthyEnv(value: string | undefined): boolean {
  const v = (value ?? '').trim().toLowerCase();
  return v === 'true' || v === '1' || v === 'yes';
}

function isHmrDisabled(env: Record<string, string>): boolean {
  return isTruthyEnv(env.DISABLE_HMR) || isTruthyEnv(process.env.DISABLE_HMR);
}

/** 隧道域名开发：需隧道转发 WebSocket；否则在 .env.local 设 DISABLE_HMR=true */
function resolveHmrOptions(env: Record<string, string>) {
  if (isHmrDisabled(env)) {
    return false as const;
  }

  const tunnelHost = env.VITE_DEV_TUNNEL_HOST?.trim();
  if (tunnelHost) {
    return {
      host: tunnelHost,
      protocol: 'wss' as const,
      clientPort: Number(env.VITE_DEV_TUNNEL_PORT || 443),
    };
  }

  return true;
}

const VITE_CLIENT_STUB = path.resolve(__dirname, 'dev/vite-client-stub.js');
const REACT_REFRESH_STUB = path.resolve(__dirname, 'dev/vite-react-refresh-stub.js');

/**
 * 关闭隧道开发时的 HMR WebSocket，但保留 CSS 注入所需的 updateStyle 等导出。
 */
function noHmrDevPlugin(disabled: boolean): Plugin {
  const clientStub = fs.readFileSync(VITE_CLIENT_STUB, 'utf-8');
  const refreshStub = fs.readFileSync(REACT_REFRESH_STUB, 'utf-8');

  return {
    name: 'no-hmr-dev',
    enforce: 'pre',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        if (!disabled) return html;
        return html.replace(
          /\s*<script type="module" src="\/@vite\/client"><\/script>\s*/gi,
          '\n'
        );
      },
    },
    configureServer(server) {
      if (!disabled) return;

      console.log('[vite] HMR 已关闭 (DISABLE_HMR) — 经隧道访问请手动刷新页面');

      server.middlewares.use((req, res, next) => {
        const pathOnly = (req.url ?? '').split('?')[0] ?? '';
        if (pathOnly === '/@vite/client' || pathOnly.startsWith('/@vite/client/')) {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
          res.setHeader('Cache-Control', 'no-store');
          res.end(clientStub);
          return;
        }
        if (pathOnly === '/@react-refresh' || pathOnly.startsWith('/@react-refresh')) {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
          res.setHeader('Cache-Control', 'no-store');
          res.end(refreshStub);
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const hmrDisabled = isHmrDisabled(env);
  const hmr = resolveHmrOptions(env);

  return {
    plugins: [
      noHmrDevPlugin(hmrDisabled),
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      allowedHosts: [
        'localhost',
        'hockhoetong.dpdns.org',
        '.dpdns.org',
      ],
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
      },
      hmr,
      watch: hmr === false ? null : {},
    },
  };
});
