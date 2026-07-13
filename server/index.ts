/**
 * 福和堂 HOCK HOE TONG — Booking API Server
 */

import './loadEnv.js';
import express from 'express';
import cors from 'cors';
import { createBooking, cancelBooking, getBookingsByPhone, confirmBooking } from './db.js';
import {
  getPublicAvailabilityForDate,
  getPublicAvailabilityRange,
} from './slots.js';
import { getOffWeekdays, getOffDates } from './offDays.js';
import { adminRouter } from './adminRoutes.js';
import { verifyStaffToken, extractBearerToken } from './auth.js';
import { getCorsOptions, corsOriginsLabel } from './corsConfig.js';
import { createWalkIn, getQueueBoard, getQueueStatusByPhone } from './queue.js';
import { parsePatientIdentity } from './patientValidation.js';
import { getPublicWellnessTips } from './wellnessTips.js';
import { attachStaticSite, shouldServeStatic } from './serveStatic.js';
import { UPLOADS_ROOT } from './wellnessUpload.js';

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(cors(getCorsOptions()));
/** 养生上传用 base64，需提高 JSON 体积上限 */
app.use(express.json({ limit: '35mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, clinic: '福和堂 HOCK HOE TONG', since: 1987 });
});

app.get('/api/config', (_req, res) => {
  res.json({
    clinicName: '福和堂',
    clinicEnglish: 'HOCK HOE TONG',
    clinicMalay: 'KEDAI UBAT CINA',
    established: '1987',
    phone: process.env.CLINIC_PHONE || '013-6268626',
    hours: '中药店每天 9:30 AM – 7:30 PM；门诊 10:00 AM – 7:30 PM',
    slogan: '辨证施治，一人一方',
    slotIntervalMinutes: 20,
    maxVisitors: 4,
    bookingDaysAhead: 7,
    offWeekdays: getOffWeekdays(),
    offDates: getOffDates(),
  });
});

app.use('/api/admin', adminRouter);

/** 养生上传的图片/视频（须在 SPA 回退之前） */
app.use(
  '/uploads',
  express.static(UPLOADS_ROOT, {
    maxAge: process.env.NODE_ENV === 'production' ? '7d' : 0,
  })
);

app.get('/api/slots', (req, res) => {
  const date = req.query.date as string;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Invalid date format YYYY-MM-DD' });
  }
  res.json(getPublicAvailabilityForDate(date));
});

app.get('/api/slots/range', (req, res) => {
  const days = Math.min(14, Math.max(1, Number(req.query.days) || 7));
  res.json({ days: getPublicAvailabilityRange(days) });
});

app.get('/api/wellness', (_req, res) => {
  res.json({ tips: getPublicWellnessTips() });
});

app.get('/api/queue/today', (_req, res) => {
  res.json(getQueueBoard());
});

app.get('/api/queue/status', (req, res) => {
  const phone = String(req.query.phone ?? '').trim();
  if (!phone) return res.status(400).json({ error: '请提供手机号' });
  res.json(getQueueStatusByPhone(phone));
});

/** 公众现场取号（无需登录） */
app.post('/api/queue/walk-in', (req, res) => {
  const parsed = parsePatientIdentity(req.body || {});
  if (parsed.ok === false) return res.status(400).json({ error: parsed.error });

  try {
    const booking = createWalkIn({
      ...parsed.data,
      symptoms: '[自助现场取号]',
    });
    res.status(201).json({
      success: true,
      queueCode: booking.queueCode,
      booking,
    });
  } catch (e) {
    if (e instanceof Error && e.message === 'WALK_IN_EXISTS') {
      return res.status(409).json({
        error: '该手机号今日已有现场号码，请使用上方「查我的号」查看',
      });
    }
    console.error(e);
    res.status(500).json({ error: '取号失败，请联系店员' });
  }
});

app.get('/api/bookings', (req, res) => {
  const phone = req.query.phone as string;
  if (!phone) {
    return res.status(400).json({ error: 'phone query required' });
  }
  res.json({ bookings: getBookingsByPhone(phone) });
});

app.post('/api/bookings', (req, res) => {
  const {
    visitorCount,
    doctorId,
    treatmentId,
    date,
    timeSlot,
    symptoms,
    wechatNotify,
    wechatId,
    patientName,
    patientPhone,
    gender,
    birthDate,
  } = req.body;

  const parsed = parsePatientIdentity({ patientName, patientPhone, gender, birthDate });
  if (parsed.ok === false) return res.status(400).json({ error: parsed.error });

  if (!date || !timeSlot) {
    return res.status(400).json({ error: '请选择日期和时段' });
  }
  if (!doctorId || !treatmentId) {
    return res.status(400).json({ error: '请选择医师和项目' });
  }
  const count = Number(visitorCount) || 1;
  if (count !== 1) {
    return res.status(400).json({ error: '每次预约仅限 1 位就诊人' });
  }

  try {
    const booking = createBooking({
      ...parsed.data,
      visitorCount: count,
      doctorId,
      treatmentId,
      date,
      timeSlot,
      symptoms: symptoms?.trim(),
      wechatNotify: Boolean(wechatNotify),
      wechatId: wechatId?.trim(),
    });
    res.status(201).json({
      success: true,
      message: '预约成功，我们将通过电话或短信确认',
      booking,
    });
  } catch (e) {
    if (e instanceof Error && e.message === 'OFF_DAY') {
      return res.status(400).json({ error: '该日为休息日，请选择其他日期' });
    }
    if (e instanceof Error && e.message === 'OFF_SLOT') {
      return res.status(400).json({ error: '该时段为休息时间，请选择其他时间' });
    }
    if (e instanceof Error && e.message === 'SLOT_PAST') {
      return res.status(400).json({ error: '该时段已过，请选择稍后的时间或其他日期' });
    }
    if (e instanceof Error && e.message === 'SLOT_TAKEN') {
      return res.status(409).json({ error: '该时段已被预约，请选择其他时间' });
    }
    console.error(e);
    res.status(500).json({ error: '服务器错误，请稍后重试' });
  }
});

app.delete('/api/bookings/:id', (req, res) => {
  const token = extractBearerToken(req.headers.authorization);
  if (!verifyStaffToken(token)) {
    return res.status(401).json({ error: '取消预约需店员权限' });
  }
  const ok = cancelBooking(req.params.id);
  if (!ok) return res.status(404).json({ error: '预约不存在' });
  res.json({ success: true, message: '预约已取消' });
});

app.patch('/api/bookings/:id/confirm', (req, res) => {
  const token = extractBearerToken(req.headers.authorization);
  if (!verifyStaffToken(token)) {
    return res.status(401).json({ error: '需店员权限' });
  }
  const booking = confirmBooking(req.params.id);
  if (!booking) return res.status(404).json({ error: '预约不存在' });
  res.json({ success: true, booking });
});

const staticEnabled = attachStaticSite(app);

const server = app.listen(PORT, '0.0.0.0', () => {
  const base = `http://localhost:${PORT}`;
  const publicUrl = process.env.PUBLIC_URL?.trim().replace(/\/$/, '');
  if (staticEnabled) {
    console.log(`福和堂 正式环境: ${base}`);
    if (publicUrl) {
      console.log(`  对外访问: ${publicUrl}/`);
      console.log(`  店员后台: ${publicUrl}/admin`);
    } else {
      console.log(`  官网: ${base}/`);
      console.log(`  店员后台: ${base}/admin`);
      console.log(`  （可在 .env.local 设 PUBLIC_URL=https://你的域名）`);
    }
    console.log(`  API: ${base}/api/health`);
  } else {
    console.log(`福和堂 API server running at ${base}`);
    console.log(`店员后台 API: ${base}/api/admin`);
    if (process.env.NODE_ENV === 'production') {
      console.warn('[prod] dist/ 不存在，仅 API 模式。请先 npm run build');
    }
  }
  console.log(`CORS 允许来源: ${corsOriginsLabel()}`);
});

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n[api] 端口 ${PORT} 已被占用。`);
    console.error(
      `  Get-NetTCPConnection -LocalPort ${PORT} | Select -Expand OwningProcess -Unique | % { Stop-Process -Id $_ -Force }`
    );
    process.exit(1);
  }
  throw err;
});
