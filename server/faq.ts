/**
 * 常见问题 FAQ（JSON 持久化，Admin 可增删改）
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const FAQ_FILE = path.join(DATA_DIR, 'faq.json');

export interface FaqItem {
  id: string;
  questionZh: string;
  questionEn: string;
  answerZh: string;
  answerEn: string;
  sortOrder: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

const SEED_FAQ: Omit<FaqItem, 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'faq1',
    questionZh: '如何预约就诊？',
    questionEn: 'How do I book an appointment?',
    answerZh:
      '可通过官网在线预约（每 20 分钟 1 人），或拨打 / WhatsApp **013-6268626** 电话预约。长辈可直接电话，由店员代为登记。',
    answerEn:
      'Book online (one patient every 20 minutes), or call / WhatsApp **013-6268626**. Seniors may phone us and our staff will register the appointment.',
    sortOrder: 0,
    enabled: true,
  },
  {
    id: 'faq2',
    questionZh: '营业时间与门诊时间？',
    questionEn: 'What are your opening hours?',
    answerZh:
      '中药店营业时间 **9:30am–7:30pm**；中医门诊时间 **10:00am–7:30pm**。以当日可约时段为准。',
    answerEn:
      'Chinese medicine shop: **9:30am–7:30pm**. TCM consultation: **10:00am–7:30pm**. Available slots for the day take priority.',
    sortOrder: 1,
    enabled: true,
  },
  {
    id: 'faq3',
    questionZh: '休息日是哪天？',
    questionEn: 'When are you closed?',
    answerZh:
      '每两周的**周三与周四**休息。具体休息日以官网预约日历与店内公告为准；后台亦可临时设置全天或时段休息。',
    answerEn:
      'Closed every other **Wednesday & Thursday**. Check the booking calendar or in-store notices; staff may also set temporary full-day or partial closures.',
    sortOrder: 2,
    enabled: true,
  },
  {
    id: 'faq4',
    questionZh: '可以现场取号吗？',
    questionEn: 'Can I walk in without an appointment?',
    answerZh:
      '可以。现场可取 **W 号**排队，预约患者为 **A 号**。可用手机打开官网「现场取号 / 查号」页面，或店内扫码。',
    answerEn:
      'Yes. Walk-in tickets use **W** numbers; appointments use **A**. Open the walk-in / queue page on your phone, or scan the in-store QR.',
    sortOrder: 3,
    enabled: true,
  },
  {
    id: 'faq5',
    questionZh: '医馆在哪里？',
    questionEn: 'Where is the clinic?',
    answerZh:
      '**福和堂（HOCK HOE TONG）**位于新山（JB）Ulu Tiram：34, Jalan Beladau 8, Taman Puteri Wangsa, 81800, Ulu Tiram, Johor. 可于 Google Maps 搜索「福和堂 JB」或「Hock Hoe Tong JB」。',
    answerEn:
      '**Hock Hoe Tong** is in JB (Johor Bahru), Ulu Tiram: 34, Jalan Beladau 8, Taman Puteri Wangsa, 81800. Search “Hock Hoe Tong JB” or “福和堂 JB” on Google Maps.',
    sortOrder: 4,
    enabled: true,
  },
  {
    id: 'faq6',
    questionZh: '如何取消或改期？',
    questionEn: 'How do I cancel or reschedule?',
    answerZh:
      '在官网「预约查询 / 改期」输入预约手机号即可查询与取消；改期也可直接电话 / WhatsApp 联系我们。',
    answerEn:
      'Use “View / Reschedule Appointment” on the website with your booking mobile number. You may also call / WhatsApp us to reschedule.',
    sortOrder: 5,
    enabled: true,
  },
];

function nowIso() {
  return new Date().toISOString();
}

function newId() {
  return `faq_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function resolveId(rawId: unknown, existingId?: string): string {
  const fromRaw = String(rawId ?? '').trim();
  if (fromRaw) return fromRaw;
  const fromExisting = String(existingId ?? '').trim();
  if (fromExisting) return fromExisting;
  return newId();
}

function normalizeItem(
  raw: Partial<FaqItem>,
  existing?: FaqItem,
  touch = false
): FaqItem {
  const t = nowIso();
  return {
    id: resolveId(raw.id, existing?.id),
    questionZh: String(raw.questionZh ?? existing?.questionZh ?? '').trim(),
    questionEn: String(raw.questionEn ?? existing?.questionEn ?? '').trim(),
    answerZh: String(raw.answerZh ?? existing?.answerZh ?? '').trim(),
    answerEn: String(raw.answerEn ?? existing?.answerEn ?? '').trim(),
    sortOrder: Number(raw.sortOrder ?? existing?.sortOrder ?? 0),
    enabled: raw.enabled !== undefined ? Boolean(raw.enabled) : (existing?.enabled ?? true),
    createdAt: existing?.createdAt ?? raw.createdAt ?? t,
    updatedAt: touch || !existing ? t : (existing.updatedAt ?? t),
  };
}

function seedFile(): FaqItem[] {
  const t = nowIso();
  return SEED_FAQ.map((s) => ({ ...s, createdAt: t, updatedAt: t }));
}

function readAll(): FaqItem[] {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(FAQ_FILE)) {
    const seeded = seedFile();
    fs.writeFileSync(FAQ_FILE, JSON.stringify(seeded, null, 2), 'utf-8');
    return seeded;
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(FAQ_FILE, 'utf-8')) as FaqItem[];
    if (!Array.isArray(parsed) || parsed.length === 0) return seedFile();
    let dirty = false;
    const items = parsed.map((item) => {
      const before = String(item.id ?? '').trim();
      const normalized = normalizeItem(item, item, false);
      if (!before || before !== normalized.id) dirty = true;
      return normalized;
    });
    if (dirty) writeAll(items);
    return items;
  } catch {
    const seeded = seedFile();
    fs.writeFileSync(FAQ_FILE, JSON.stringify(seeded, null, 2), 'utf-8');
    return seeded;
  }
}

function writeAll(items: FaqItem[]) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(FAQ_FILE, JSON.stringify(items, null, 2), 'utf-8');
}

export function getPublicFaqs(): FaqItem[] {
  return readAll()
    .filter((t) => t.enabled)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt));
}

export function getAllFaqs(): FaqItem[] {
  return readAll().sort(
    (a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt)
  );
}

export function validateFaqInput(input: Partial<FaqItem>, isCreate: boolean): string | null {
  if (!String(input.questionZh ?? '').trim()) return '请填写中文问题';
  if (!String(input.answerZh ?? '').trim()) return '请填写中文答案';
  const id = String(input.id ?? '').trim();
  if (isCreate && id && readAll().some((t) => t.id === id)) {
    return 'ID 已存在';
  }
  return null;
}

export function createFaqItem(input: Partial<FaqItem>): FaqItem {
  const err = validateFaqInput(input, true);
  if (err) throw new Error(err);
  const all = readAll();
  const maxOrder = all.reduce((m, t) => Math.max(m, t.sortOrder), -1);
  const item = normalizeItem(
    {
      ...input,
      id: String(input.id ?? '').trim() || undefined,
      sortOrder: input.sortOrder ?? maxOrder + 1,
      enabled: input.enabled !== false,
    } as Partial<FaqItem>,
    undefined,
    true
  );
  writeAll([...all, item]);
  return item;
}

export function updateFaqItem(id: string, input: Partial<FaqItem>): FaqItem | null {
  const all = readAll();
  const idx = all.findIndex((t) => t.id === id);
  if (idx < 0) return null;
  const err = validateFaqInput({ ...all[idx], ...input }, false);
  if (err) throw new Error(err);
  const updated = normalizeItem({ ...all[idx], ...input, id: all[idx].id }, all[idx], true);
  all[idx] = updated;
  writeAll(all);
  return updated;
}

export function deleteFaqItem(id: string): boolean {
  const all = readAll();
  const next = all.filter((t) => t.id !== id);
  if (next.length === all.length) return false;
  writeAll(next);
  return true;
}
