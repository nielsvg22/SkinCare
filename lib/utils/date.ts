const DUTCH_WEEKDAYS_LONG = [
  "zondag",
  "maandag",
  "dinsdag",
  "woensdag",
  "donderdag",
  "vrijdag",
  "zaterdag",
];

const DUTCH_MONTHS = [
  "januari",
  "februari",
  "maart",
  "april",
  "mei",
  "juni",
  "juli",
  "augustus",
  "september",
  "oktober",
  "november",
  "december",
];

/** Local YYYY-MM-DD, never UTC — a "day" is defined by the device's local clock. */
export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function todayKey(): string {
  return toDateKey(new Date());
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function addDaysToKey(key: string, days: number): string {
  return toDateKey(addDays(parseDateKey(key), days));
}

/** Monday of the week containing `date` (ISO week start). */
export function getWeekStart(date: Date): Date {
  const day = date.getDay(); // 0 = zondag
  const diff = day === 0 ? -6 : 1 - day;
  const monday = addDays(date, diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export function getWeekStartKey(date: Date): string {
  return toDateKey(getWeekStart(date));
}

export function formatDisplayDate(date: Date): string {
  const weekday = DUTCH_WEEKDAYS_LONG[date.getDay()];
  const day = date.getDate();
  const month = DUTCH_MONTHS[date.getMonth()];
  const capitalized = weekday.charAt(0).toUpperCase() + weekday.slice(1);
  return `${capitalized} ${day} ${month}`;
}

export function getGreeting(date: Date = new Date()): string {
  const hour = date.getHours();
  if (hour < 6) return "Goedenavond";
  if (hour < 12) return "Goedemorgen";
  if (hour < 18) return "Goedemiddag";
  return "Goedenavond";
}

export function isDateKeyToday(key: string): boolean {
  return key === todayKey();
}

export function daysBetween(a: string, b: string): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const diff = parseDateKey(b).getTime() - parseDateKey(a).getTime();
  return Math.round(diff / msPerDay);
}
