# 福和堂 HOCK HOE TONG · 官网

自 **1987** 年（SEJAK 1987）传承的中医馆单页官网，含在线预约后端与长辈电话预约通道。

## 功能

- 门店招牌还原 Logo（深蓝圆底、白手捧莲、粉莲、七星）
- 半透顶栏 → 滚动后纯白（Intersection Observer）
- 60vh 首屏 + Hero 玻璃卡 + 四枚服务胶囊
- **电话预约（推荐长辈）**：顶栏 / Hero / 预约区 / 页脚
- 7 天 × 30 分钟时段网格 + 内联表单（姓名、性别、生日、手机、人数）
- Express API + SQLite 持久化预约数据（第 1 期：`patients` + `bookings`）
- 手机号查询 / 取消预约

## 本地运行

```bash
npm install
cp .env.example .env.local
# 编辑 .env.local 填入真实电话 CLINIC_PHONE / VITE_CLINIC_PHONE
npm run dev
```

- 前端：http://localhost:3000  
- API：http://localhost:3001（Vite 代理 `/api`）

仅前端：`npm run dev:web`  
仅后端：`npm run dev:api`

## 正式环境（推荐，不用 dev）

单进程同时提供 **官网静态页**（`dist/`）和 **API**（`/api`），适合隧道只开一个端口。

```bash
npm ci
# 编辑 .env.local：STAFF_*、CORS_ORIGIN、VITE_* 等；建议 SERVE_STATIC=true
npm run prod
```

或分两步：

```bash
npm run build
npm start
```

- 默认监听 `PORT`（`.env.local` 里常为 **3001**）
- 浏览器：`http://localhost:3001/` · 后台 `http://localhost:3001/admin`
- 隧道请转发到 **同一端口**（例如 `3001` → `https://hockhoetong.dpdns.org`）
- **不要**设 `VITE_API_URL`（前端请求同域 `/api`）
- 改前端文案/电话后需重新 `npm run build`

### 用域名访问（不用 localhost）

1. 本机执行 **`npm run prod`**（保持运行）
2. 隧道 / Cloudflare / dpdns 面板把 **`https://hockhoetong.dpdns.org` → `http://127.0.0.1:3001`**
3. 浏览器打开 **https://hockhoetong.dpdns.org** 与 **/admin**

详见 **[tunnel/README.md](tunnel/README.md)** 与 `tunnel/cloudflared.config.example.yml`。

仅 API、不托管网页：`SERVE_STATIC=false` 后 `npm run start:api`

有 Nginx 时也可：Nginx 发 `dist/` + 反代 `/api`，此时 `npm run start:api` 即可，不必 `SERVE_STATIC`。

## 替换清单

| 项 | 文件 |
|----|------|
| 电话 | `.env.local` → `VITE_CLINIC_PHONE` |
| 地址 | `src/data.ts` → `DEFAULTS.ADDRESS` |
| 招牌图 | `public/signboard.png` |
| 医师/项目 | `src/data.ts` |

## 店员后台 `/admin`

1. 在 `.env.local` 配置：
   ```env
   STAFF_USERNAME=admin
   STAFF_PASSWORD=你的强密码
   ADMIN_SECRET=随机长字符串
   ```
2. 运行 `npm run dev` 后打开：**http://localhost:3000/admin**
3. 功能：
   - **总览**（登录默认页）：今日已约 / 等候 / 未到 / 过号 / 现场 / 时段占用 / 下 3 单 / 本周 / 明日 / 叫下一位（标准）/ 项目分布 / 累计人次；可设置「历史基数」
   - **电话代约**：姓名 + 手机 + 选时段，提交后网站格子变「已约」
   - **全部预约**：查看列表、取消预约（释放时段）
4. 登录 token 有效期 **24 小时**（存在浏览器 localStorage）

### 总览统计口径

| 指标 | 规则 |
|------|------|
| 今日已约 | 当日未取消的预约条数 |
| 等候中 | 当日 `queueStatus` 为等候 / 已叫号 / 就诊中 |
| 累计人次 | 全库 `queueStatus === done` 且未取消，**按人次**（同号多次各计 1） |
| 显示总数 | 系统完成人次 + **历史基数**（`server/data/clinic-stats.json`） |

历史基数可在总览页 **「设置历史基数」** 填写（1987 年至系统上线前的估算人次）；也可直接编辑 JSON 中的 `historicalBaseline`。

总览还支持：**recharts 趋势图**（7/30/月/年）、**同比上月**、**养生/下次休息** 快捷入口、**CSV / PDF 导出今日名单**（含手机号，请勿外传）。

默认密码（未配置时）：`admin` / `fht1987` — **上线前务必修改**。

## 休息日 & 时段休息

登录 **店员后台** → **休息** 页（`/admin`）：

1. **每周固定休息日**：点选周日～周六  
2. **指定某天全天休息**：选日期后添加（如公共假期）  
3. **时段休息**：如午休 `12:00–14:00`，仅关闭该几小时，其余时段仍可约  

保存后写入 `server/data/schedule.json`，立即生效，**无需改 .env**。

若曾用 `.env` 的 `OFF_WEEKDAYS` / `OFF_DATES`，首次启动会自动迁入上述 JSON。

## API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 健康检查 |
| GET | `/api/slots/range?days=7` | 7 天时段占用 |
| POST | `/api/bookings` | 顾客创建预约 |
| GET | `/api/bookings?phone=` | 顾客按手机号查询 |
| POST | `/api/admin/login` | 店员登录 |
| GET | `/api/admin/bookings` | 店员查看全部（需 token） |
| GET | `/api/admin/summary` | 总览（今日 + 累计 + 同比/养生/休息，需 token） |
| GET | `/api/admin/summary/trends?range=7d\|30d\|month\|year` | 完成就诊趋势 |
| GET | `/api/admin/export/today?format=csv\|json` | 今日名单导出（PDF 在总览页生成） |
| PATCH | `/api/admin/summary/baseline` | 更新历史基数 `{ historicalBaseline }` |
| POST | `/api/admin/bookings` | 店员电话代约 |
| DELETE | `/api/admin/bookings/:id` | 店员取消 |

数据文件：`server/data/clinic.db`（主库）、`server/data/schedule.json`、`server/data/clinic-stats.json`  
旧版 `bookings.json` 首次启动会自动导入 SQLite 并备份为 `bookings.json.bak`。

### 数据库（SQLite 第 1 期）

- 主库：`server/data/clinic.db`（预约 + 患者档案）
- 环境变量：`DB_PATH`（可选，默认 `server/data/clinic.db`）
- 首次启动：若存在 `bookings.json` 且库为空，自动导入并清空 JSON
- 手动迁移：`npm run db:migrate`
- 驱动：Node.js 内置 `node:sqlite`（需 Node 22+，无需编译 native 模块）
- 备份：定期复制 `clinic.db`（含 `-wal` / `-shm` 时先正常关闭 API）

其余配置仍用 JSON：`schedule.json`、`wellness-tips.json`、`clinic-stats.json`、`queue-state.json`（第 2 期再迁入 DB）。

## 上线 / CORS

`.env.local` 里的 **`CORS_ORIGIN` 之前代码没有读取**；现已生效。重启 API 后终端会打印 `CORS 允许来源: ...`。

| 场景 | 建议 |
|------|------|
| 前后端同域（Nginx 把 `/api` 反代到 Node） | **不必**设 `CORS_ORIGIN`，前端 `VITE_API_URL` 留空，请求走 `/api` |
| 前端域名 + API 另一端口/机器 | 设置 `CORS_ORIGIN=https://你的域名`，本地调试加 `,http://localhost:3000` |
| 只写了生产域名 | 本地 `localhost:3000` 会 CORS 失败 |

注意：API 的 `PORT` 应为 **3001**（或反代目标端口），不要写成 **3000**（Vite 占用）。

```env
PORT=3001
CORS_ORIGIN=https://hockhoetong.dpdns.org,http://localhost:3000
```

## 合规

本站信息仅供参考，不构成医疗诊断建议，请以面诊为准。
