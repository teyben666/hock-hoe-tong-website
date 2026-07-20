/**
 * 中医知识库（JSON 持久化，Admin 可增删改）
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const TIPS_FILE = path.join(DATA_DIR, 'wellness-tips.json');

export interface WellnessTip {
  id: string;
  tagZh: string;
  tagEn: string;
  titleZh: string;
  titleEn: string;
  bodyZh: string;
  bodyEn: string;
  /** 可选：/uploads/wellness/... 或外链 */
  imageUrl: string;
  /** 可选：/uploads/wellness/... 或外链 */
  videoUrl: string;
  sortOrder: number;
  enabled: boolean;
  /** 展开全文后是否显示「收起」；false = 仅展开不可收起 */
  allowCollapse: boolean;
  createdAt: string;
  updatedAt: string;
}

const SEED_TIPS: Omit<WellnessTip, 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'w1',
    tagZh: '时令养生',
    tagEn: 'Seasonal Wellness',
    titleZh: '雨季祛湿与脾胃',
    titleEn: 'Damp Season & Digestive Balance',
    bodyZh:
      '马来西亚多雨潮湿，易出现疲倦、胃口差、肢体困重。日常宜少生冷油腻，可适量薏米、赤小豆、茯苓等配伍（需据体质）。若久湿不解或伴明显不适，宜请医师舌脉辨证，勿自行长期猛用苦寒祛湿方。',
    bodyEn:
      'Humid weather may bring fatigue, poor appetite, or heaviness. Prefer warm, light meals; herbal combinations such as coix seed or poria should suit your constitution. Persistent symptoms warrant a TCM consultation—avoid long-term aggressive “damp-clearing” formulas on your own.',
    imageUrl: '',
    videoUrl: '',
    sortOrder: 0,
    enabled: true,
    allowCollapse: true,
  },
  {
    id: 'w2',
    tagZh: '茶饮常识',
    tagEn: 'Herbal Drinks',
    titleZh: '凉茶与养生茶饮怎么选',
    titleEn: 'Choosing Herbal Teas Wisely',
    bodyZh:
      '本店有杂凉茶、夏桑菊、罗汉果菊等，多作清热生津、日常调理之用，不能替代中药汤剂治疗。儿童、孕妇、脾胃虚寒或正在服药者，选购前宜咨询店员或医师。症状持续或加重，请预约面诊。',
    bodyEn:
      'Shop teas such as herbal cooling blends are for daily wellness, not a substitute for prescribed decoctions. Children, pregnant clients, those with cold sensitivity, or on medication should ask staff or the physician first. Worsening symptoms—please book a visit.',
    imageUrl: '',
    videoUrl: '',
    sortOrder: 1,
    enabled: true,
    allowCollapse: true,
  },
  {
    id: 'w3',
    tagZh: '儿科养护',
    tagEn: 'Paediatric Care',
    titleZh: '小儿推拿与居家养护',
    titleEn: 'Paediatric Tuina & Home Care',
    bodyZh:
      '小儿推拿常用于健脾、助眠、增强抵抗力等，手法需专业、力度宜轻。居家可注意规律作息、饮食清淡，避免过饱过凉。发热、抽搐、精神差等急症，请立即就医，不宜仅依赖推拿延误诊治。',
    bodyEn:
      'Paediatric tuina supports digestion, sleep, and resilience when performed by trained hands with gentle pressure. At home: regular routines and mild meals. Fever, convulsions, or lethargy need emergency care—do not delay medical help relying on tuina alone.',
    imageUrl: '',
    videoUrl: '',
    sortOrder: 2,
    enabled: true,
    allowCollapse: true,
  },
];

function nowIso() {
  return new Date().toISOString();
}

function newId() {
  return `w_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/** 空字符串视为无 id，避免后台 emptyForm 的 id:'' 被存进库 */
function resolveId(rawId: unknown, existingId?: string): string {
  const fromRaw = String(rawId ?? '').trim();
  if (fromRaw) return fromRaw;
  const fromExisting = String(existingId ?? '').trim();
  if (fromExisting) return fromExisting;
  return newId();
}

function normalizeTip(
  raw: Partial<WellnessTip>,
  existing?: WellnessTip,
  touch = false
): WellnessTip {
  const t = nowIso();
  return {
    id: resolveId(raw.id, existing?.id),
    tagZh: String(raw.tagZh ?? existing?.tagZh ?? '').trim(),
    tagEn: String(raw.tagEn ?? existing?.tagEn ?? '').trim(),
    titleZh: String(raw.titleZh ?? existing?.titleZh ?? '').trim(),
    titleEn: String(raw.titleEn ?? existing?.titleEn ?? '').trim(),
    // trim 只去首尾空白，中间换行保留
    bodyZh: String(raw.bodyZh ?? existing?.bodyZh ?? '').trim(),
    bodyEn: String(raw.bodyEn ?? existing?.bodyEn ?? '').trim(),
    imageUrl: String(raw.imageUrl ?? existing?.imageUrl ?? '').trim(),
    videoUrl: String(raw.videoUrl ?? existing?.videoUrl ?? '').trim(),
    sortOrder: Number(raw.sortOrder ?? existing?.sortOrder ?? 0),
    enabled: raw.enabled !== undefined ? Boolean(raw.enabled) : (existing?.enabled ?? true),
    allowCollapse:
      raw.allowCollapse !== undefined
        ? Boolean(raw.allowCollapse)
        : (existing?.allowCollapse ?? true),
    createdAt: existing?.createdAt ?? raw.createdAt ?? t,
    updatedAt: touch || !existing ? t : (existing.updatedAt ?? t),
  };
}

function seedFile(): WellnessTip[] {
  const t = nowIso();
  return SEED_TIPS.map((s) => ({ ...s, createdAt: t, updatedAt: t }));
}

function readAll(): WellnessTip[] {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(TIPS_FILE)) {
    const seeded = seedFile();
    fs.writeFileSync(TIPS_FILE, JSON.stringify(seeded, null, 2), 'utf-8');
    return seeded;
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(TIPS_FILE, 'utf-8')) as WellnessTip[];
    if (!Array.isArray(parsed) || parsed.length === 0) return seedFile();
    let dirty = false;
    const tips = parsed.map((tip) => {
      const before = String(tip.id ?? '').trim();
      const normalized = normalizeTip(tip, tip, false);
      if (!before || before !== normalized.id) dirty = true;
      if (tip.imageUrl === undefined || tip.videoUrl === undefined) dirty = true;
      if (tip.allowCollapse === undefined) dirty = true;
      return normalized;
    });
    if (dirty) writeAll(tips);
    return tips;
  } catch {
    const seeded = seedFile();
    fs.writeFileSync(TIPS_FILE, JSON.stringify(seeded, null, 2), 'utf-8');
    return seeded;
  }
}

function writeAll(tips: WellnessTip[]) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(TIPS_FILE, JSON.stringify(tips, null, 2), 'utf-8');
}

export function getPublicWellnessTips(): WellnessTip[] {
  return readAll()
    .filter((t) => t.enabled)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt));
}

export function getAllWellnessTips(): WellnessTip[] {
  return readAll().sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt));
}

export function validateWellnessInput(
  input: Partial<WellnessTip>,
  isCreate: boolean
): string | null {
  if (!String(input.titleZh ?? '').trim()) return '请填写中文标题';
  if (!String(input.bodyZh ?? '').trim()) return '请填写中文正文';
  if (!String(input.tagZh ?? '').trim()) return '请填写中文标签';
  const id = String(input.id ?? '').trim();
  if (isCreate && id && readAll().some((t) => t.id === id)) {
    return 'ID 已存在';
  }
  return null;
}

export function createWellnessTip(input: Partial<WellnessTip>): WellnessTip {
  const err = validateWellnessInput(input, true);
  if (err) throw new Error(err);
  const all = readAll();
  const maxOrder = all.reduce((m, t) => Math.max(m, t.sortOrder), -1);
  // 强制丢弃空 id，由 resolveId → newId()
  const tip = normalizeTip(
    {
      ...input,
      id: String(input.id ?? '').trim() || undefined,
      sortOrder: input.sortOrder ?? maxOrder + 1,
      enabled: input.enabled !== false,
    } as Partial<WellnessTip>,
    undefined,
    true
  );
  writeAll([...all, tip]);
  return tip;
}

export function updateWellnessTip(id: string, input: Partial<WellnessTip>): WellnessTip | null {
  const all = readAll();
  const idx = all.findIndex((t) => t.id === id);
  if (idx < 0) return null;
  const err = validateWellnessInput({ ...all[idx], ...input }, false);
  if (err) throw new Error(err);
  const updated = normalizeTip(
    { ...all[idx], ...input, id: all[idx].id },
    all[idx],
    true
  );
  all[idx] = updated;
  writeAll(all);
  return updated;
}

export function deleteWellnessTip(id: string): boolean {
  const all = readAll();
  const next = all.filter((t) => t.id !== id);
  if (next.length === all.length) return false;
  writeAll(next);
  return true;
}
