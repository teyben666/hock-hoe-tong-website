# 用 https://hockhoetong.dpdns.org 访问（不打开 localhost）

正式环境在本机跑 **`npm run prod`**（监听 `PORT`，默认 **3001**），再用隧道把公网域名指到这个端口。

## 第一步：启动正式服务

```bash
cd 项目根目录
npm run prod
```

终端应出现类似：

```text
福和堂 正式环境: http://localhost:3001
  官网: http://localhost:3001/
  店员后台: http://localhost:3001/admin
```

**不要关这个窗口。** 本地 `localhost` 只是自检；对外用域名访问。

## 第二步：隧道指向 3001

任选你正在用的方式，目标都是 **`http://127.0.0.1:3001`**（与 `.env.local` 里 `PORT` 一致）。

### A. Cloudflare Tunnel（推荐，自带 HTTPS）

1. 安装 [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/)
2. 登录并创建隧道（Dashboard 或 CLI）
3. 公网主机名：`hockhoetong.dpdns.org`（或你在 dpdns 绑定的子域）
4. **Service URL**：`http://localhost:3001`
5. 运行隧道（示例）：

```bash
cloudflared tunnel --config tunnel/cloudflared.config.example.yml run
```

将 `cloudflared.config.example.yml` 里的 `tunnel` ID、`credentials-file` 换成你自己的（Cloudflare 控制台下载）。

### B. 其它面板 / dpdns 端口转发

- 若面板里是「内网 IP + 端口」：填 `127.0.0.1:3001`
- 若只转 HTTP：确保外网 `https://hockhoetong.dpdns.org` 最终落到本机 **3001**

## 第三步：浏览器访问

- 官网：https://hockhoetong.dpdns.org/
- 后台：https://hockhoetong.dpdns.org/admin
- 健康检查：https://hockhoetong.dpdns.org/api/health

`.env.local` 已设 `CORS_ORIGIN=https://hockhoetong.dpdns.org`，**不要**设置 `VITE_API_URL`（走同域 `/api`）。

## 常见问题

| 现象 | 处理 |
|------|------|
| NXDOMAIN / 打不开 | 隧道未运行或 DNS 未指到隧道 |
| 502 / Bad Gateway | `npm run prod` 未启动或 `PORT` 与隧道不一致 |
| 只有 API 没有页面 | 未 `npm run build` 或 `SERVE_STATIC` 未 true |
| 改文案不生效 | 改代码后重新 `npm run build` 再 `npm run prod` |

## 与 dev 的区别

| | `npm run dev` | `npm run prod` + 隧道 |
|--|---------------|------------------------|
| 用途 | 改代码热更新 | 对外演示 / 日常使用 |
| 访问 | localhost:3000 | https://hockhoetong.dpdns.org |
| 进程 | Vite + API | 单进程 API + dist |
