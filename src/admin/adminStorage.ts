import { TODAY } from './adminDateUtils';

const VIEW_DATE_KEY = 'fht_admin_view_date';

export function loadStoredViewDate(): string {
  try {
    const s = localStorage.getItem(VIEW_DATE_KEY);
    if (s && /^\d{4}-\d{2}-\d{2}$/.test(s) && s >= TODAY) return s;
  } catch {
    /* ignore */
  }
  return TODAY;
}

export function saveViewDate(date: string): void {
  try {
    localStorage.setItem(VIEW_DATE_KEY, date);
  } catch {
    /* ignore */
  }
}
