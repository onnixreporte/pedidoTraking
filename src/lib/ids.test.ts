import { describe, it, expect } from 'vitest';
import { genPublicId, genAdminToken } from './ids';

const PUBLIC_ALPHABET = /^[23456789abcdefghjkmnpqrstuvwxyz]+$/;

describe('genPublicId', () => {
  it('produces 8-char ID with the public alphabet (no confusable chars)', () => {
    for (let i = 0; i < 100; i++) {
      const id = genPublicId();
      expect(id).toHaveLength(8);
      expect(id).toMatch(PUBLIC_ALPHABET);
    }
  });

  it('produces different IDs across calls (no collision in small sample)', () => {
    const set = new Set<string>();
    for (let i = 0; i < 100; i++) set.add(genPublicId());
    expect(set.size).toBe(100);
  });
});

describe('genAdminToken', () => {
  it('produces 21-char nanoid', () => {
    const t = genAdminToken();
    expect(t).toHaveLength(21);
  });

  it('produces different tokens', () => {
    const set = new Set<string>();
    for (let i = 0; i < 100; i++) set.add(genAdminToken());
    expect(set.size).toBe(100);
  });
});
