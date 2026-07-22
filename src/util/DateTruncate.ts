export function truncateDate(date: Date): string {
  return date.toISOString().split('.')[0] + 'Z';
}

export function truncateCurrentDate(): string {
  return truncateDate(new Date());
}

export function truncateDateToInputValue(date: Date): string {
  date = new Date(date);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().substring(0, 16);
}
