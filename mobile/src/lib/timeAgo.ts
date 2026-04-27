import i18n from 'i18next';

export function timeAgo(dateStr: string): string {
  const ms = Date.now() - new Date(dateStr).getTime();
  if (Number.isNaN(ms)) return '';
  const t = i18n.t.bind(i18n);
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return t('time.justNow', 'just now');
  const m = Math.floor(seconds / 60);
  if (m < 60) return t('time.minutesAgo', '{{count}}m ago', { count: m });
  const h = Math.floor(m / 60);
  if (h < 24) return t('time.hoursAgo', '{{count}}h ago', { count: h });
  const d = Math.floor(h / 24);
  if (d === 1) return t('time.yesterday', 'yesterday');
  if (d < 7) return t('time.daysAgo', '{{count}}d ago', { count: d });
  const w = Math.floor(d / 7);
  if (w < 5) return t('time.weeksAgo', '{{count}}w ago', { count: w });
  const mo = Math.floor(d / 30);
  if (mo < 12) return t('time.monthsAgo', '{{count}}mo ago', { count: mo });
  return t('time.yearsAgo', '{{count}}y ago', { count: Math.floor(mo / 12) });
}
