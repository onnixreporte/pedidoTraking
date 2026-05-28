import { describe, it, expect } from 'vitest';
import { formatGs, formatTime, formatTimeRange } from './format';

describe('formatGs', () => {
  it('formats integer in es-PY locale with thousand separators', () => {
    expect(formatGs(22000)).toBe('Gs. 22.000');
    expect(formatGs(1500000)).toBe('Gs. 1.500.000');
  });

  it('handles zero', () => {
    expect(formatGs(0)).toBe('Gs. 0');
  });
});

describe('formatTime', () => {
  it('formats ISO string to HH:MM in 24h', () => {
    const iso = new Date(2026, 4, 27, 9, 5).toISOString();
    expect(formatTime(iso)).toMatch(/^\d{2}:\d{2}$/);
  });
});

describe('formatTimeRange', () => {
  it('returns a range "HH:MM a HH:MM"', () => {
    const base = new Date(2026, 4, 27, 10, 0).toISOString();
    const range = formatTimeRange(base, 30);
    expect(range).toMatch(/^\d{2}:\d{2} a \d{2}:\d{2}$/);
  });

  it('accepts custom window offsets', () => {
    const base = new Date(2026, 4, 27, 10, 0).toISOString();
    const tight = formatTimeRange(base, 30, 0, 0);
    expect(tight).toMatch(/^\d{2}:\d{2} a \d{2}:\d{2}$/);
  });
});
