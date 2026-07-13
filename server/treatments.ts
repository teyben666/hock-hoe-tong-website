/**
 * 治疗项目（JSON 持久化，Admin 可增删改 + 图/视频）
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const FILE = path.join(DATA_DIR, 'treatments.json');

export interface TreatmentItem {
  id: string;
  name: string;
  nameEn: string;
  tagline: string;
  operation: string;
  effects: string;
  suitableFor: string;
  iconName: string;
  imageUrl: string;
  videoUrl: string;
  sortOrder: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

const SEED: Omit<TreatmentItem, 'createdAt' | 'updatedAt'>[] = [
  {
    id: 't1',
    name: '中药',
    nameEn: 'Chinese Herbal Medicine',
    tagline: '',
    operation:
      '根据舌脉辨证，一人一方精准配伍。提供有偿代煎服务，慢火熬制，确保药效充分释放，绝不浪费。',
    effects: '调理体质、扶正祛邪，改善脏腑功能，促进整体平衡。',
    suitableFor: '体质虚弱、慢性病患者、需长期调理者。',
    iconName: 'Leaf',
    imageUrl: '',
    videoUrl: '',
    sortOrder: 0,
    enabled: true,
  },
  {
    id: 't2',
    name: '针刺治疗',
    nameEn: 'Acupuncture',
    tagline: '',
    operation: '以细针刺激经络穴位，调和气血。',
    effects: '缓解疼痛、改善睡眠、调节免疫功能。',
    suitableFor: '颈肩腰腿痛、失眠、消化不良、亚健康人群。',
    iconName: 'Activity',
    imageUrl: '',
    videoUrl: '',
    sortOrder: 1,
    enabled: true,
  },
  {
    id: 't3',
    name: '艾灸',
    nameEn: 'Moxibustion',
    tagline: '',
    operation: '燃烧艾条或艾柱温热刺激穴位，温通经络。',
    effects: '驱寒祛湿、温阳补气、增强抵抗力。',
    suitableFor: '体寒怕冷、免疫力低下、妇科调理。',
    iconName: 'Flame',
    imageUrl: '',
    videoUrl: '',
    sortOrder: 2,
    enabled: true,
  },
  {
    id: 't4',
    name: '拔罐',
    nameEn: 'Cupping',
    tagline: '',
    operation: '利用负压吸附于皮肤，促进气血运行。',
    effects: '祛风散寒、舒筋活络、缓解肌肉酸痛。',
    suitableFor: '肩颈僵硬、运动损伤、风湿痹痛。',
    iconName: 'CircleDot',
    imageUrl: '',
    videoUrl: '',
    sortOrder: 3,
    enabled: true,
  },
  {
    id: 't5',
    name: '小儿推拿',
    nameEn: 'Pediatric TuiNa',
    tagline: '',
    operation: '通过特定手法按摩小儿经络穴位。',
    effects: '调理脾胃、增强免疫力、促进生长发育。',
    suitableFor: '婴幼儿及儿童，常见于消化不良、咳嗽、体弱易感冒。',
    iconName: 'Baby',
    imageUrl: '',
    videoUrl: '',
    sortOrder: 4,
    enabled: true,
  },
  {
    id: 't6',
    name: '颐玥臻膳',
    nameEn: 'Moonwell Nourish',
    tagline: '东方食养 · 现代月膳',
    operation:
      '以东方草本智慧结合现代产后调理理念，从体质出发，温和滋养，帮助妈妈在月子期间循序恢复元气与气血。',
    effects:
      '传统食养结合温补理念，帮助产后妈妈调理气血、恢复体力、促进子宫修复与乳汁分泌，让身体从「失血、耗气、劳累」的状态慢慢恢复。精选天然药材与营养食材，温和滋补、暖身养身，让妈妈在月子期间更好地恢复元气、提升精神与身体状态，安心迎接产后新生活。',
    suitableFor: '产后恢复中、月子调理的妈妈。',
    iconName: 'UtensilsCrossed',
    imageUrl: '',
    videoUrl: '',
    sortOrder: 5,
    enabled: true,
  },
];

function nowIso() {
  return new Date().toISOString();
}

function newId() {
  return `t_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function resolveId(rawId: unknown, existingId?: string): string {
  const fromRaw = String(rawId ?? '').trim();
  if (fromRaw) return fromRaw;
  const fromExisting = String(existingId ?? '').trim();
  if (fromExisting) return fromExisting;
  return newId();
}

function normalize(
  raw: Partial<TreatmentItem>,
  existing?: TreatmentItem,
  touch = false
): TreatmentItem {
  const t = nowIso();
  return {
    id: resolveId(raw.id, existing?.id),
    name: String(raw.name ?? existing?.name ?? '').trim(),
    nameEn: String(raw.nameEn ?? existing?.nameEn ?? '').trim(),
    tagline: String(raw.tagline ?? existing?.tagline ?? '').trim(),
    operation: String(raw.operation ?? existing?.operation ?? '').trim(),
    effects: String(raw.effects ?? existing?.effects ?? '').trim(),
    suitableFor: String(raw.suitableFor ?? existing?.suitableFor ?? '').trim(),
    iconName: String(raw.iconName ?? existing?.iconName ?? 'Activity').trim() || 'Activity',
    imageUrl: String(raw.imageUrl ?? existing?.imageUrl ?? '').trim(),
    videoUrl: String(raw.videoUrl ?? existing?.videoUrl ?? '').trim(),
    sortOrder: Number(raw.sortOrder ?? existing?.sortOrder ?? 0),
    enabled: raw.enabled !== undefined ? Boolean(raw.enabled) : (existing?.enabled ?? true),
    createdAt: existing?.createdAt ?? raw.createdAt ?? t,
    updatedAt: touch || !existing ? t : (existing.updatedAt ?? t),
  };
}

function seedFile(): TreatmentItem[] {
  const t = nowIso();
  return SEED.map((s) => ({ ...s, createdAt: t, updatedAt: t }));
}

function readAll(): TreatmentItem[] {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(FILE)) {
    const seeded = seedFile();
    fs.writeFileSync(FILE, JSON.stringify(seeded, null, 2), 'utf-8');
    return seeded;
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(FILE, 'utf-8')) as TreatmentItem[];
    if (!Array.isArray(parsed) || parsed.length === 0) return seedFile();
    let dirty = false;
    const items = parsed.map((item) => {
      const before = String(item.id ?? '').trim();
      const n = normalize(item, item, false);
      if (!before || before !== n.id) dirty = true;
      if (item.imageUrl === undefined || item.videoUrl === undefined) dirty = true;
      return n;
    });
    if (dirty) writeAll(items);
    return items;
  } catch {
    const seeded = seedFile();
    fs.writeFileSync(FILE, JSON.stringify(seeded, null, 2), 'utf-8');
    return seeded;
  }
}

function writeAll(items: TreatmentItem[]) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(items, null, 2), 'utf-8');
}

export function getPublicTreatments(): TreatmentItem[] {
  return readAll()
    .filter((t) => t.enabled)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt));
}

export function getAllTreatments(): TreatmentItem[] {
  return readAll().sort(
    (a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt)
  );
}

export function validateTreatmentInput(input: Partial<TreatmentItem>): string | null {
  if (!String(input.name ?? '').trim()) return '请填写项目名称';
  if (!String(input.operation ?? '').trim()) return '请填写操作方式';
  if (!String(input.effects ?? '').trim()) return '请填写功效作用';
  if (!String(input.suitableFor ?? '').trim()) return '请填写适合人群';
  return null;
}

export function createTreatment(input: Partial<TreatmentItem>): TreatmentItem {
  const err = validateTreatmentInput(input);
  if (err) throw new Error(err);
  const all = readAll();
  const maxOrder = all.reduce((m, t) => Math.max(m, t.sortOrder), -1);
  const tip = normalize(
    {
      ...input,
      id: String(input.id ?? '').trim() || undefined,
      sortOrder: input.sortOrder ?? maxOrder + 1,
      enabled: input.enabled !== false,
    } as Partial<TreatmentItem>,
    undefined,
    true
  );
  writeAll([...all, tip]);
  return tip;
}

export function updateTreatment(
  id: string,
  input: Partial<TreatmentItem>
): TreatmentItem | null {
  const all = readAll();
  const idx = all.findIndex((t) => t.id === id);
  if (idx < 0) return null;
  const merged = { ...all[idx], ...input, id: all[idx].id };
  const err = validateTreatmentInput(merged);
  if (err) throw new Error(err);
  const updated = normalize(merged, all[idx], true);
  all[idx] = updated;
  writeAll(all);
  return updated;
}

export function deleteTreatment(id: string): boolean {
  const all = readAll();
  const next = all.filter((t) => t.id !== id);
  if (next.length === all.length) return false;
  writeAll(next);
  return true;
}
