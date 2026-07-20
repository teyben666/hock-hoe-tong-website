/**
 * 店员后台 API（需登录）
 */

import { Router, type Request, type Response, type NextFunction } from 'express';
import {
  verifyStaffCredentials,
  createStaffToken,
  verifyStaffToken,
  extractBearerToken,
} from './auth.js';
import { getAllBookings, cancelBooking, confirmBooking, createBooking } from './db.js';
import { getAvailabilityForDate, getAvailabilityRange } from './slots.js';
import {
  getScheduleConfig,
  saveScheduleConfig,
  validateScheduleInput,
  type ScheduleConfig,
} from './scheduleConfig.js';
import {
  callBookingById,
  callNext,
  checkInAppointment,
  createWalkIn,
  getQueueBoard,
  getQueueCallMode,
  setQueueCallMode,
  setQueuePriority,
  setQueueStatus,
  recallBooking,
  requeueBooking,
  type QueueCallMode,
} from './queue.js';
import type { QueueStatus } from './db.js';
import { parsePatientIdentity } from './patientValidation.js';
import {
  getAllWellnessTips,
  createWellnessTip,
  updateWellnessTip,
  deleteWellnessTip,
} from './wellnessTips.js';
import { saveMediaDataUrl, type UploadFolder } from './wellnessUpload.js';
import {
  getAllAboutGallery,
  createAboutGalleryItem,
  updateAboutGalleryItem,
  deleteAboutGalleryItem,
} from './aboutGallery.js';
import {
  getAllTreatments,
  createTreatment,
  updateTreatment,
  deleteTreatment,
} from './treatments.js';
import { buildAdminSummary } from './adminSummary.js';
import { setHistoricalBaseline } from './clinicStats.js';
import { buildAdminTrends, type TrendRange } from './adminTrends.js';
import { buildTodayCsv, getTodayExportData } from './adminExport.js';

export const adminRouter = Router();

function requireStaff(req: Request, res: Response, next: NextFunction) {
  const token = extractBearerToken(req.headers.authorization);
  if (!verifyStaffToken(token)) {
    return res.status(401).json({ error: '请先登录店员后台' });
  }
  next();
}

adminRouter.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!verifyStaffCredentials(String(username ?? ''), String(password ?? ''))) {
    return res.status(401).json({ error: '账号或密码错误' });
  }
  res.json({
    success: true,
    token: createStaffToken(),
    expiresInHours: 24,
  });
});

adminRouter.get('/me', requireStaff, (_req, res) => {
  res.json({ ok: true, role: 'staff' });
});

/** 总览：今日快照 + 累计完成就诊 */
adminRouter.get('/summary', requireStaff, (_req, res) => {
  res.json(buildAdminSummary());
});

adminRouter.get('/summary/trends', requireStaff, (req, res) => {
  const range = String(req.query.range ?? '7d');
  const allowed: TrendRange[] = ['7d', '30d', 'month', 'year'];
  if (!allowed.includes(range as TrendRange)) {
    return res.status(400).json({ error: 'range 须为 7d | 30d | month | year' });
  }
  res.json(buildAdminTrends(range as TrendRange));
});

adminRouter.get('/export/today', requireStaff, (req, res) => {
  const format = String(req.query.format ?? 'csv');
  const data = getTodayExportData();
  if (format === 'json') {
    return res.json(data);
  }
  if (format === 'csv') {
    const csv = buildTodayCsv();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="fht-${data.date}.csv"`
    );
    return res.send('\ufeff' + csv);
  }
  return res.status(400).json({
    error: '请使用 format=csv 或 format=json（PDF 在总览页由浏览器生成）',
  });
});

adminRouter.patch('/summary/baseline', requireStaff, (req, res) => {
  const raw = req.body?.historicalBaseline;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) {
    return res.status(400).json({ error: '请输入不小于 0 的整数' });
  }
  try {
    setHistoricalBaseline(n);
    res.json({ success: true, summary: buildAdminSummary() });
  } catch {
    res.status(400).json({ error: '保存失败' });
  }
});

adminRouter.get('/bookings', requireStaff, (_req, res) => {
  const bookings = getAllBookings().sort((a, b) => {
    const d = a.date.localeCompare(b.date);
    return d !== 0 ? d : a.timeSlot.localeCompare(b.timeSlot);
  });
  res.json({ bookings });
});

adminRouter.get('/slots', requireStaff, (req, res) => {
  const date = req.query.date as string;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: '请提供日期 YYYY-MM-DD' });
  }
  res.json(getAvailabilityForDate(date));
});

adminRouter.get('/slots/range', requireStaff, (req, res) => {
  const days = Math.min(90, Math.max(1, Number(req.query.days) || 7));
  res.json({ days: getAvailabilityRange(days) });
});

/** 读取 / 保存休息日 & 时段休息 */
adminRouter.get('/schedule', requireStaff, (_req, res) => {
  res.json({ schedule: getScheduleConfig() });
});

adminRouter.put('/schedule', requireStaff, (req, res) => {
  const body = req.body as ScheduleConfig;
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ error: '无效配置' });
  }
  const err = validateScheduleInput(body);
  if (err) return res.status(400).json({ error: err });
  const saved = saveScheduleConfig(body);
  res.json({ success: true, schedule: saved });
});

/** 中医知识库 */
adminRouter.get('/wellness', requireStaff, (_req, res) => {
  res.json({ tips: getAllWellnessTips() });
});

adminRouter.post('/wellness/upload', requireStaff, (req, res) => {
  try {
    const kind = req.body?.kind === 'video' ? 'video' : 'image';
    const folder = (['wellness', 'about', 'treatments'].includes(req.body?.folder)
      ? req.body.folder
      : 'wellness') as UploadFolder;
    const dataUrl = String(req.body?.dataUrl ?? '');
    const saved = saveMediaDataUrl(dataUrl, kind, folder);
    res.status(201).json({ success: true, url: saved.url, bytes: saved.bytes });
  } catch (e) {
    const msg = e instanceof Error ? e.message : '上传失败';
    res.status(400).json({ error: msg });
  }
});

adminRouter.post('/wellness', requireStaff, (req, res) => {
  try {
    const tip = createWellnessTip(req.body || {});
    res.status(201).json({ success: true, tip });
  } catch (e) {
    const msg = e instanceof Error ? e.message : '保存失败';
    res.status(400).json({ error: msg });
  }
});

adminRouter.put('/wellness/:id', requireStaff, (req, res) => {
  try {
    const tip = updateWellnessTip(req.params.id, req.body || {});
    if (!tip) return res.status(404).json({ error: '条目不存在' });
    res.json({ success: true, tip });
  } catch (e) {
    const msg = e instanceof Error ? e.message : '保存失败';
    res.status(400).json({ error: msg });
  }
});

adminRouter.delete('/wellness/:id', requireStaff, (req, res) => {
  const ok = deleteWellnessTip(req.params.id);
  if (!ok) return res.status(404).json({ error: '条目不存在' });
  res.json({ success: true });
});

/** About 相册 */
adminRouter.get('/about-gallery', requireStaff, (_req, res) => {
  res.json({ items: getAllAboutGallery() });
});

adminRouter.post('/about-gallery', requireStaff, (req, res) => {
  try {
    const item = createAboutGalleryItem(req.body || {});
    res.status(201).json({ success: true, item });
  } catch (e) {
    const msg = e instanceof Error ? e.message : '保存失败';
    res.status(400).json({ error: msg });
  }
});

adminRouter.put('/about-gallery/:id', requireStaff, (req, res) => {
  try {
    const item = updateAboutGalleryItem(req.params.id, req.body || {});
    if (!item) return res.status(404).json({ error: '条目不存在' });
    res.json({ success: true, item });
  } catch (e) {
    const msg = e instanceof Error ? e.message : '保存失败';
    res.status(400).json({ error: msg });
  }
});

adminRouter.delete('/about-gallery/:id', requireStaff, (req, res) => {
  const ok = deleteAboutGalleryItem(req.params.id);
  if (!ok) return res.status(404).json({ error: '条目不存在' });
  res.json({ success: true });
});

/** 治疗项目 */
adminRouter.get('/treatments', requireStaff, (_req, res) => {
  res.json({ treatments: getAllTreatments() });
});

adminRouter.post('/treatments', requireStaff, (req, res) => {
  try {
    const treatment = createTreatment(req.body || {});
    res.status(201).json({ success: true, treatment });
  } catch (e) {
    const msg = e instanceof Error ? e.message : '保存失败';
    res.status(400).json({ error: msg });
  }
});

adminRouter.put('/treatments/:id', requireStaff, (req, res) => {
  try {
    const treatment = updateTreatment(req.params.id, req.body || {});
    if (!treatment) return res.status(404).json({ error: '条目不存在' });
    res.json({ success: true, treatment });
  } catch (e) {
    const msg = e instanceof Error ? e.message : '保存失败';
    res.status(400).json({ error: msg });
  }
});

adminRouter.delete('/treatments/:id', requireStaff, (req, res) => {
  const ok = deleteTreatment(req.params.id);
  if (!ok) return res.status(404).json({ error: '条目不存在' });
  res.json({ success: true });
});

/** 店员电话代约 */
adminRouter.post('/bookings', requireStaff, (req, res) => {
  const {
    date,
    timeSlot,
    treatmentId = 't2',
    doctorId = 'd1',
    visitorCount = 1,
    symptoms,
    patientName,
    patientPhone,
    gender,
    birthDate,
  } = req.body || {};

  const parsed = parsePatientIdentity({ patientName, patientPhone, gender, birthDate });
  if (parsed.ok === false) return res.status(400).json({ error: parsed.error });
  if (!date || !timeSlot) return res.status(400).json({ error: '请选择日期和时段' });

  try {
    const booking = createBooking({
      ...parsed.data,
      visitorCount: 1,
      doctorId,
      treatmentId,
      date,
      timeSlot,
      symptoms: `[店员电话代约] ${symptoms || ''}`.trim(),
    });
    res.status(201).json({
      success: true,
      message: '代约成功，时段已占用',
      booking,
    });
  } catch (e) {
    if (e instanceof Error && e.message === 'OFF_DAY') {
      return res.status(400).json({ error: '该日为休息日，无法代约' });
    }
    if (e instanceof Error && e.message === 'OFF_SLOT') {
      return res.status(400).json({ error: '该时段为休息时间，无法代约' });
    }
    if (e instanceof Error && e.message === 'SLOT_PAST') {
      return res.status(400).json({ error: '该时段已过，无法代约' });
    }
    if (e instanceof Error && e.message === 'SLOT_TAKEN') {
      return res.status(409).json({ error: '该时段已被预约' });
    }
    console.error(e);
    res.status(500).json({ error: '服务器错误' });
  }
});

adminRouter.delete('/bookings/:id', requireStaff, (req, res) => {
  const ok = cancelBooking(req.params.id);
  if (!ok) return res.status(404).json({ error: '预约不存在' });
  res.json({ success: true, message: '已取消，时段已释放' });
});

adminRouter.patch('/bookings/:id/confirm', requireStaff, (req, res) => {
  const booking = confirmBooking(req.params.id);
  if (!booking) return res.status(404).json({ error: '预约不存在' });
  res.json({ success: true, booking });
});

/** —— 叫号 —— */
adminRouter.get('/queue/today', requireStaff, (_req, res) => {
  res.json({ board: getQueueBoard() });
});

adminRouter.get('/queue/mode', requireStaff, (_req, res) => {
  res.json({ mode: getQueueCallMode() });
});

adminRouter.put('/queue/mode', requireStaff, (req, res) => {
  const mode = req.body?.mode as QueueCallMode;
  if (!['standard', 'appointment', 'walkin'].includes(mode)) {
    return res.status(400).json({ error: '无效模式' });
  }
  res.json({ mode: setQueueCallMode(mode) });
});

adminRouter.post('/queue/check-in/:id', requireStaff, (req, res) => {
  try {
    const booking = checkInAppointment(req.params.id);
    res.json({ success: true, booking });
  } catch (e) {
    if (e instanceof Error && e.message === 'NOT_FOUND') {
      return res.status(404).json({ error: '预约不存在' });
    }
    if (e instanceof Error && e.message === 'NOT_TODAY') {
      return res.status(400).json({ error: '只能签到今日预约' });
    }
    if (e instanceof Error && e.message === 'ALREADY_CHECKED_IN') {
      return res.status(400).json({ error: '该预约已签到，请勿重复操作' });
    }
    res.status(400).json({ error: '签到失败' });
  }
});

adminRouter.post('/queue/recall/:id', requireStaff, (req, res) => {
  try {
    const booking = recallBooking(req.params.id);
    res.json({ success: true, booking });
  } catch (e) {
    if (e instanceof Error && e.message === 'NOT_FOUND') {
      return res.status(404).json({ error: '记录不存在' });
    }
    if (e instanceof Error && e.message === 'NOT_RECALLABLE') {
      return res.status(400).json({ error: '仅已叫号或就诊中可重叫' });
    }
    res.status(400).json({ error: '重叫失败' });
  }
});

adminRouter.post('/queue/requeue/:id', requireStaff, (req, res) => {
  try {
    const booking = requeueBooking(req.params.id);
    res.json({ success: true, booking });
  } catch (e) {
    if (e instanceof Error && e.message === 'NOT_FOUND') {
      return res.status(404).json({ error: '记录不存在' });
    }
    if (e instanceof Error && e.message === 'NOT_REQUEUEABLE') {
      return res.status(400).json({ error: '仅过号患者可再次排队' });
    }
    res.status(400).json({ error: '再次排队失败' });
  }
});

adminRouter.post('/queue/walk-in', requireStaff, (req, res) => {
  const { treatmentId, doctorId, symptoms, patientName, patientPhone, gender, birthDate } =
    req.body || {};
  const parsed = parsePatientIdentity({ patientName, patientPhone, gender, birthDate });
  if (parsed.ok === false) return res.status(400).json({ error: parsed.error });
  try {
    const booking = createWalkIn({
      ...parsed.data,
      treatmentId,
      doctorId,
      symptoms,
    });
    res.status(201).json({ success: true, booking });
  } catch (e) {
    if (e instanceof Error && e.message === 'WALK_IN_EXISTS') {
      return res.status(409).json({ error: '该手机号今日已有现场号码' });
    }
    console.error(e);
    res.status(500).json({ error: '取号失败' });
  }
});

adminRouter.post('/queue/call-next', requireStaff, (req, res) => {
  const mode = req.body?.mode as QueueCallMode | undefined;
  const result = callNext(mode);
  if (!result.booking) {
    return res.json({ success: false, message: '暂无等候患者', mode: result.mode });
  }
  res.json({ success: true, booking: result.booking, mode: result.mode });
});

adminRouter.post('/queue/call-appointment', requireStaff, (_req, res) => {
  const result = callNext('appointment');
  if (!result.booking) {
    return res.json({ success: false, message: '暂无预约可叫', mode: 'appointment' });
  }
  res.json({ success: true, booking: result.booking, mode: 'appointment' });
});

adminRouter.post('/queue/call-walk-in', requireStaff, (_req, res) => {
  const result = callNext('walkin');
  if (!result.booking) {
    return res.json({ success: false, message: '暂无现场等候', mode: 'walkin' });
  }
  res.json({ success: true, booking: result.booking, mode: 'walkin' });
});

adminRouter.post('/queue/call/:id', requireStaff, (req, res) => {
  try {
    const booking = callBookingById(req.params.id);
    res.json({ success: true, booking });
  } catch (e) {
    if (e instanceof Error && e.message === 'NOT_FOUND') {
      return res.status(404).json({ error: '记录不存在' });
    }
    if (e instanceof Error && e.message === 'NOT_WAITING') {
      return res.status(400).json({ error: '该患者不在等候状态' });
    }
    res.status(400).json({ error: '叫号失败' });
  }
});

adminRouter.post('/queue/priority/:id', requireStaff, (req, res) => {
  try {
    const booking = setQueuePriority(req.params.id, true);
    res.json({ success: true, booking });
  } catch (e) {
    if (e instanceof Error && e.message === 'NOT_FOUND') {
      return res.status(404).json({ error: '记录不存在' });
    }
    res.status(400).json({ error: '仅等候中可设优先' });
  }
});

adminRouter.patch('/queue/:id/status', requireStaff, (req, res) => {
  const queueStatus = req.body?.queueStatus as QueueStatus;
  const allowed: QueueStatus[] = [
    'waiting',
    'called',
    'in_service',
    'done',
    'skipped',
    'not_arrived',
  ];
  if (!allowed.includes(queueStatus)) {
    return res.status(400).json({ error: '无效状态' });
  }
  try {
    const booking = setQueueStatus(req.params.id, queueStatus);
    res.json({ success: true, booking });
  } catch (e) {
    if (e instanceof Error && e.message === 'NOT_FOUND') {
      return res.status(404).json({ error: '记录不存在' });
    }
    res.status(400).json({ error: '更新失败' });
  }
});
