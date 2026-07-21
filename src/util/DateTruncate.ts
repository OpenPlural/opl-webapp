export function truncateDate(date: Date): string {
  return date.toISOString().split('.')[0] + 'Z';
}

export function truncateCurrentDate(): string {
  return truncateDate(new Date());
}

export function truncateDateToInputValue(date: Date): string {
  return date.toISOString().substring(0, 16);
}
