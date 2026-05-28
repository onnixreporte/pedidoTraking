import { describe, it, expect } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  signSession,
  verifySessionToken,
} from './auth';

describe('hashPassword + verifyPassword', () => {
  it('hashPassword returns a string different from the plaintext', async () => {
    const hash = await hashPassword('secret123');
    expect(hash).not.toBe('secret123');
    expect(hash.length).toBeGreaterThan(20);
  });

  it('verifyPassword returns true with matching password', async () => {
    const hash = await hashPassword('s3cret!Pa55');
    expect(await verifyPassword('s3cret!Pa55', hash)).toBe(true);
  });

  it('verifyPassword returns false with non-matching password', async () => {
    const hash = await hashPassword('s3cret!Pa55');
    expect(await verifyPassword('wrong-password', hash)).toBe(false);
  });
});

describe('signSession + verifySessionToken', () => {
  it('round-trip preserves sub and email', async () => {
    const token = await signSession({ sub: 'usr_abc', email: 'a@b.com' });
    const payload = await verifySessionToken(token);
    expect(payload).not.toBeNull();
    expect(payload?.sub).toBe('usr_abc');
    expect(payload?.email).toBe('a@b.com');
  });

  it('verifySessionToken returns null for malformed token', async () => {
    expect(await verifySessionToken('not.a.jwt')).toBeNull();
    expect(await verifySessionToken('')).toBeNull();
  });

  it('verifySessionToken returns null for token signed with different secret', async () => {
    const original = process.env.JWT_SECRET!;
    const token = await signSession({ sub: 'x', email: 'x@y.com' });
    process.env.JWT_SECRET = 'a-different-secret-that-is-also-long-enough-to-pass-32-chars';
    // Re-import? Not easily — the verify function reads env at call time.
    const payload = await verifySessionToken(token);
    process.env.JWT_SECRET = original;
    expect(payload).toBeNull();
  });
});
