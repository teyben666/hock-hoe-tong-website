/**
 * About 区相册（JSON 持久化，官网约 30 秒轮播）
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const FILE = path.join(DATA_DIR, 'about-gallery.json');

export interface AboutGalleryItem {
  id: string;
  imageUrl: string;
  captionZh: string;
  captionEn: string;
  sortOrder: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

function nowIso() {
  return new Date().toISOString();
}

function newId() {
  return `ag_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function resolveId(rawId: unknown, existingId?: string): string {
  const fromRaw = String(rawId ?? '').trim();
  if (fromRaw) return fromRaw;
  const fromExisting = String(existingId ?? '').trim();
  if (fromExisting) return fromExisting;
  return newId();
}

function normalize(
  raw: Partial<AboutGalleryItem>,
  existing?: AboutGalleryItem,
  touch = false
): AboutGalleryItem {
  const t = nowIso();
  return {
    id: resolveId(raw.id, existing?.id),
    imageUrl: String(raw.imageUrl ?? existing?.imageUrl ?? '').trim(),
    captionZh: String(raw.captionZh ?? existing?.captionZh ?? '').trim(),
    captionEn: String(raw.captionEn ?? existing?.captionEn ?? '').trim(),
    sortOrder: Number(raw.sortOrder ?? existing?.sortOrder ?? 0),
    enabled: raw.enabled !== undefined ? Boolean(raw.enabled) : (existing?.enabled ?? true),
    createdAt: existing?.createdAt ?? raw.createdAt ?? t,
    updatedAt: touch || !existing ? t : (existing.updatedAt ?? t),
  };
}

function seed(): AboutGalleryItem[] {
  const t = nowIso();
  return [
    {
      id: 'ag_logo',
      imageUrl: '/logo-brand.png',
      captionZh: '',
      captionEn: '',
      sortOrder: 0,
      enabled: true,
      createdAt: t,
      updatedAt: t,
    },
  ];
}

function readAll(): AboutGalleryItem[] {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(FILE)) {
    const seeded = seed();
    fs.writeFileSync(FILE, JSON.stringify(seeded, null, 2), 'utf-8');
    return seeded;
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(FILE, 'utf-8')) as AboutGalleryItem[];
    if (!Array.isArray(parsed) || parsed.length === 0) return seed();
    let dirty = false;
    const items = parsed.map((item) => {
      const before = String(item.id ?? '').trim();
      const n = normalize(item, item, false);
      if (!before || before !== n.id) dirty = true;
      return n;
    });
    if (dirty) writeAll(items);
    return items;
  } catch {
    const seeded = seed();
    fs.writeFileSync(FILE, JSON.stringify(seeded, null, 2), 'utf-8');
    return seeded;
  }
}

function writeAll(items: AboutGalleryItem[]) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(items, null, 2), 'utf-8');
}

export function getPublicAboutGallery(): AboutGalleryItem[] {
  return readAll()
    .filter((i) => i.enabled && i.imageUrl)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt));
}

export function getAllAboutGallery(): AboutGalleryItem[] {
  return readAll().sort(
    (a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt)
  );
}

export function validateAboutGalleryInput(
  input: Partial<AboutGalleryItem>
): string | null {
  if (!String(input.imageUrl ?? '').trim()) return '请上传图片';
  return null;
}

export function createAboutGalleryItem(
  input: Partial<AboutGalleryItem>
): AboutGalleryItem {
  const err = validateAboutGalleryInput(input);
  if (err) throw new Error(err);
  const all = readAll();
  const maxOrder = all.reduce((m, t) => Math.max(m, t.sortOrder), -1);
  const item = normalize(
    {
      ...input,
      id: String(input.id ?? '').trim() || undefined,
      sortOrder: input.sortOrder ?? maxOrder + 1,
      enabled: input.enabled !== false,
    } as Partial<AboutGalleryItem>,
    undefined,
    true
  );
  writeAll([...all, item]);
  return item;
}

export function updateAboutGalleryItem(
  id: string,
  input: Partial<AboutGalleryItem>
): AboutGalleryItem | null {
  const all = readAll();
  const idx = all.findIndex((t) => t.id === id);
  if (idx < 0) return null;
  const merged = { ...all[idx], ...input, id: all[idx].id };
  const err = validateAboutGalleryInput(merged);
  if (err) throw new Error(err);
  const updated = normalize(merged, all[idx], true);
  all[idx] = updated;
  writeAll(all);
  return updated;
}

export function deleteAboutGalleryItem(id: string): boolean {
  const all = readAll();
  const next = all.filter((t) => t.id !== id);
  if (next.length === all.length) return false;
  writeAll(next);
  return true;
}
