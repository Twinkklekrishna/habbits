export function getStartOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  const start = new Date(d.setDate(diff));
  start.setHours(0, 0, 0, 0);
  return start;
}

export function formatISO(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getWeekDays(start: Date) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

export function isToday(date: Date) {
  return formatISO(date) === formatISO(new Date());
}

export function getDayName(date: Date) {
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

export function getMonthName(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'long' });
}
