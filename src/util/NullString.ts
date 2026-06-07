export function nullableField(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  value = value.trim();
  if (value.length === 0) {
    return null;
  }
  return value;
}
