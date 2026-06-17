export function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

export function formatDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDaysToDateOnly(value: string, days: number): string {
  const date = parseDateOnly(value);
  date.setDate(date.getDate() + days);
  return formatDateOnly(date);
}

export function startOfWeekMonday(date = new Date()): string {
  const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0);
  const day = localDate.getDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;
  localDate.setDate(localDate.getDate() - daysSinceMonday);
  return formatDateOnly(localDate);
}

export function buildWeekDays(weekStart: string): string[] {
  return Array.from({ length: 7 }, (_, index) => addDaysToDateOnly(weekStart, index));
}

