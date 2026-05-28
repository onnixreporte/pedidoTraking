import { describe, it, expect } from 'vitest';
import {
  ALLOWED_TRANSITIONS,
  canTransition,
  STATUSES,
  STATUSES_LINEAR,
  type Status,
} from './status';

describe('canTransition', () => {
  it('returns true for identity transitions (from === to)', () => {
    for (const s of STATUSES) {
      expect(canTransition(s, s)).toBe(true);
    }
  });

  it('allows the entire linear flow forward', () => {
    expect(canTransition('ENVIADO_AL_NEGOCIO', 'ACEPTADO')).toBe(true);
    expect(canTransition('ACEPTADO', 'REPARTIDOR_EN_CAMINO')).toBe(true);
    expect(canTransition('REPARTIDOR_EN_CAMINO', 'ENTREGADO')).toBe(true);
  });

  it('allows cancel from any active status', () => {
    expect(canTransition('ENVIADO_AL_NEGOCIO', 'CANCELADO')).toBe(true);
    expect(canTransition('ACEPTADO', 'CANCELADO')).toBe(true);
    expect(canTransition('REPARTIDOR_EN_CAMINO', 'CANCELADO')).toBe(true);
  });

  it('blocks backwards transitions once REPARTIDOR_EN_CAMINO is reached', () => {
    expect(canTransition('REPARTIDOR_EN_CAMINO', 'ACEPTADO')).toBe(false);
    expect(canTransition('REPARTIDOR_EN_CAMINO', 'ENVIADO_AL_NEGOCIO')).toBe(false);
  });

  it('terminal states cannot transition out', () => {
    const others: Status[] = ['ENVIADO_AL_NEGOCIO', 'ACEPTADO', 'REPARTIDOR_EN_CAMINO'];
    for (const target of others) {
      expect(canTransition('ENTREGADO', target)).toBe(false);
      expect(canTransition('CANCELADO', target)).toBe(false);
    }
  });

  it('ALLOWED_TRANSITIONS covers every status', () => {
    for (const s of STATUSES) {
      expect(Array.isArray(ALLOWED_TRANSITIONS[s])).toBe(true);
    }
  });

  it('STATUSES_LINEAR contains the 4 active states in order', () => {
    expect(STATUSES_LINEAR).toEqual([
      'ENVIADO_AL_NEGOCIO',
      'ACEPTADO',
      'REPARTIDOR_EN_CAMINO',
      'ENTREGADO',
    ]);
  });
});
