export function nullableField(value: string | null | undefined): string | null {
  if (value && value.trim().length === 0) {
    return null;
  }
  return value || null;
}
