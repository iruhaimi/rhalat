export type DaySchedule = { closed: true } | { closed?: false; open: string; close: string };
export type WeekSchedule = Partial<Record<DayKey, DaySchedule>>;
export type DayKey = 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat';

export const DAY_ORDER: DayKey[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

export const DAY_LABELS_AR: Record<DayKey, string> = {
  sun: 'الأحد',
  mon: 'الاثنين',
  tue: 'الثلاثاء',
  wed: 'الأربعاء',
  thu: 'الخميس',
  fri: 'الجمعة',
  sat: 'السبت',
};

export const DAY_LABELS_EN: Record<DayKey, string> = {
  sun: 'Sun',
  mon: 'Mon',
  tue: 'Tue',
  wed: 'Wed',
  thu: 'Thu',
  fri: 'Fri',
  sat: 'Sat',
};

export function parseWorkingHours(raw: string | null | undefined): WeekSchedule | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed.startsWith('{')) return null;
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed === 'object') return parsed as WeekSchedule;
  } catch {
    return null;
  }
  return null;
}

function to12h(time: string, lang: 'ar' | 'en'): string {
  const [hStr, mStr] = time.split(':');
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr || '0', 10);
  const isAM = h < 12;
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  const mm = m === 0 ? '' : `:${m.toString().padStart(2, '0')}`;
  if (lang === 'ar') {
    return `${h}${mm} ${isAM ? 'ص' : 'م'}`;
  }
  return `${h}${mm} ${isAM ? 'AM' : 'PM'}`;
}

function sameSchedule(a: DaySchedule | undefined, b: DaySchedule | undefined): boolean {
  if (!a || !b) return false;
  if ('closed' in a && a.closed) return 'closed' in b && !!b.closed;
  if ('closed' in b && b.closed) return false;
  return (a as any).open === (b as any).open && (a as any).close === (b as any).close;
}

export function formatWorkingHours(schedule: WeekSchedule, lang: 'ar' | 'en' = 'ar'): string[] {
  const labels = lang === 'ar' ? DAY_LABELS_AR : DAY_LABELS_EN;
  const dash = ' - ';
  const closedWord = lang === 'ar' ? 'مغلق' : 'Closed';
  const lines: string[] = [];
  let i = 0;
  while (i < DAY_ORDER.length) {
    const day = DAY_ORDER[i];
    const sched = schedule[day];
    if (!sched) { i++; continue; }
    let j = i;
    while (j + 1 < DAY_ORDER.length && sameSchedule(schedule[DAY_ORDER[j + 1]], sched)) j++;
    const range = i === j ? labels[day] : `${labels[DAY_ORDER[i]]}${dash}${labels[DAY_ORDER[j]]}`;
    if ('closed' in sched && sched.closed) {
      lines.push(`${range}: ${closedWord}`);
    } else {
      const s = sched as { open: string; close: string };
      lines.push(`${range}: ${to12h(s.open, lang)}${dash}${to12h(s.close, lang)}`);
    }
    i = j + 1;
  }
  return lines;
}