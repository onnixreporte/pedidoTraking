const fmt = new Intl.NumberFormat('es-PY');

export const formatGs = (n: number) => `Gs. ${fmt.format(n)}`;

const timeFmt = new Intl.DateTimeFormat('es-PY', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

export const formatTime = (iso: string) => timeFmt.format(new Date(iso));

export function formatTimeRange(
  baseIso: string,
  estimatedMinutes: number,
  windowMinutesBefore = 5,
  windowMinutesAfter = 10,
): string {
  const base = new Date(baseIso).getTime();
  const target = base + estimatedMinutes * 60_000;
  const from = new Date(target - windowMinutesBefore * 60_000);
  const to = new Date(target + windowMinutesAfter * 60_000);
  return `${timeFmt.format(from)} a ${timeFmt.format(to)}`;
}
