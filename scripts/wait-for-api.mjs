/**
 * 等 API /api/health 就绪后再启动 Vite，避免代理 ECONNREFUSED
 */
const url = process.env.API_HEALTH_URL || 'http://127.0.0.1:3001/api/health';
const timeoutMs = Number(process.env.API_WAIT_TIMEOUT_MS || 60_000);
const intervalMs = 300;
const start = Date.now();

async function ready() {
  const res = await fetch(url);
  return res.ok;
}

while (Date.now() - start < timeoutMs) {
  try {
    if (await ready()) {
      console.log(`[dev] API 已就绪: ${url}`);
      process.exit(0);
    }
  } catch {
    // API 尚未监听
  }
  await new Promise((r) => setTimeout(r, intervalMs));
}

console.error(`[dev] 等待 API 超时 (${timeoutMs}ms): ${url}`);
console.error('[dev] 请确认另一终端里 api 已启动，或端口 3001 未被占用。');
process.exit(1);
