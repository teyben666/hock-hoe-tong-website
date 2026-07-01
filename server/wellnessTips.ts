/**
 * 养生知识（JSON 持久化，Admin 可增删改）
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
  sortOrder: number;
  enabled: boolean;
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
    sortOrder: 0,
    enabled: true,
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
    sortOrder: 1,
    enabled: true,
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
    sortOrder: 2,
    enabled: true,
  },
];

function nowIso() {
  return new Date().toISOString();
}

function newId() {
  return `w_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeTip(raw: Partial<WellnessTip>, existing?: WellnessTip): WellnessTip {
  const t = nowIso();
  return {
    id: String(raw.id ?? existing?.id ?? newId()),
    tagZh: String(raw.tagZh ?? existing?.tagZh ?? '').trim(),
    tagEn: String(raw.tagEn ?? existing?.tagEn ?? '').trim(),
    titleZh: String(raw.titleZh ?? existing?.titleZh ?? '').trim(),
    titleEn: String(raw.titleEn ?? existing?.titleEn ?? '').trim(),
    bodyZh: String(raw.bodyZh ?? existing?.bodyZh ?? '').trim(),
    bodyEn: String(raw.bodyEn ?? existing?.bodyEn ?? '').trim(),
    sortOrder: Number(raw.sortOrder ?? existing?.sortOrder ?? 0),
    enabled: raw.enabled !== undefined ? Boolean(raw.enabled) : (existing?.enabled ?? true),
    createdAt: existing?.createdAt ?? raw.createdAt ?? t,
    updatedAt: t,
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
    return parsed.map((tip) => normalizeTip(tip, tip));
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
  if (isCreate && input.id && readAll().some((t) => t.id === input.id)) {
    return 'ID 已存在';
  }
  return null;
}

export function createWellnessTip(input: Partial<WellnessTip>): WellnessTip {
  const err = validateWellnessInput(input, true);
  if (err) throw new Error(err);
  const all = readAll();
  const maxOrder = all.reduce((m, t) => Math.max(m, t.sortOrder), -1);
  const tip = normalizeTip({
    ...input,
    sortOrder: input.sortOrder ?? maxOrder + 1,
    enabled: input.enabled !== false,
  });
  writeAll([...all, tip]);
  return tip;
}

export function updateWellnessTip(id: string, input: Partial<WellnessTip>): WellnessTip | null {
  const all = readAll();
  const idx = all.findIndex((t) => t.id === id);
  if (idx < 0) return null;
  const err = validateWellnessInput({ ...all[idx], ...input }, false);
  if (err) throw new Error(err);
  const updated = normalizeTip({ ...all[idx], ...input }, all[idx]);
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
