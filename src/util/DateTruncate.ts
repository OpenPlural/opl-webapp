export function truncateDate(date: Date): string {
  return date.toISOString().split('.')[0] + 'Z';
}

export function truncateCurrentDate(): string {
  return truncateDate(new Date());
}

export function truncateDateToInputValue(date: Date, timezone: boolean = true): string {
  date = new Date(date);
  if (timezone) {
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  }
  return date.toISOString().substring(0, 16);
}
