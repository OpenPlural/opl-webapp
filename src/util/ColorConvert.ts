export function toColor(num: bigint): string {
  const number = Number(num);
  const r = (number >> 16) & 0xff;
  const g = (number >> 8) & 0xff;
  const b = number & 0xff;

  return rgbToHex(r, g, b);
}

export function toColorInt(color: string): bigint {
  const {r, g, b} = hexToRgb(color);
  return BigInt((r << 16) | (g << 8) | b);
}

export function hexToRgb(color: string): {r: number; g: number; b: number} {
  if (color.startsWith('#') && color.length === 7) {
    const r = parseInt(color.substring(1, 3), 16);
    const g = parseInt(color.substring(3, 5), 16);
    const b = parseInt(color.substring(5, 7), 16);
    return {r, g, b};
  }
  return {r: 255, g: 255, b: 255};
}

export function rgbToHex(r: number, g: number, b: number): string {
  const rx = r.toString(16).padStart(2, '0');
  const gx = g.toString(16).padStart(2, '0');
  const bx = b.toString(16).padStart(2, '0');

  return `#${rx}${gx}${bx}`;
}

export function rgbToHsl(r: number, g: number, b: number): {h: number, s: number, l: number} {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;

  let h = 0;
  if (diff !== 0) {
    switch (max) {
      case r:
        h = ((g - b) / diff) % 6;
        break;
      case g:
        h = (b - r) / diff + 2;
        break;
      case b:
        h = (r - g) / diff + 4;
        break;
    }
    h *= 60;
    if (h < 0) {
      h += 360;
    }
  }

  const s = max === 0 ? 0 : diff / max;
  return { h, s, l: max };
}
