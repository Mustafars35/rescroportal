const dayMs = 86_400_000;
function calendarDay(value: string): number | null {
  const local = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  const iso = /^(\d{4})-(\d{2})-(\d{2})(?:$|T)/.exec(value);
  if (!local && !iso) return null;
  const [year, month, day] = local ? [+local[3], +local[2], +local[1]] : [+iso![1], +iso![2], +iso![3]];
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? date.getTime() / dayMs : null;
}
export function completionEstimate(orderDate: string, finished: boolean, now = new Date()): string {
  if (finished) return "Tamamlandı";
  const start = calendarDay(orderDate);
  if (start === null) return "Sipariş tarihi eksik";
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  const remaining = start + 5 - calendarDay(today)!;
  if (remaining < 0) return `Sipariş ${-remaining} gün gecikti`;
  if (remaining === 0) return "Bugün tamamlanmalı";
  return `${remaining} gün kaldı`;
}
