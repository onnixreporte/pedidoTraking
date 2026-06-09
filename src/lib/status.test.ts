import { describe, it, expect } from 'vitest';
import {
  ALLOWED_TRANSITIONS_DELIVERY,
  ALLOWED_TRANSITIONS_RETIRO,
  canTransition,
  stepperStatusesFor,
  STATUSES,
  STATUSES_LINEAR_DELIVERY,
  STATUSES_LINEAR_RETIRO,
  type Status,
} from './status';

// T7 — Cubre R10, R11, R20, R28
describe('canTransition (DELIVERY)', () => {
  it('returns true for identity transitions (from === to)', () => {
    for (const s of STATUSES) {
      expect(canTransition(s, s, 'DELIVERY')).toBe(true);
    }
  });

  it('canTransition_delivery_acepta_repartidor', () => {
    expect(canTransition('ACEPTADO', 'REPARTIDOR_EN_CAMINO', 'DELIVERY')).toBe(true);
  });

  it('allows the entire linear delivery flow forward', () => {
    expect(canTransition('ENVIADO_AL_NEGOCIO', 'ACEPTADO', 'DELIVERY')).toBe(true);
    expect(canTransition('ACEPTADO', 'REPARTIDOR_EN_CAMINO', 'DELIVERY')).toBe(true);
    expect(canTransition('REPARTIDOR_EN_CAMINO', 'ENTREGADO', 'DELIVERY')).toBe(true);
  });

  it('canTransition_delivery_rechaza_preparando', () => {
    expect(canTransition('ACEPTADO', 'PREPARANDO', 'DELIVERY')).toBe(false);
    expect(canTransition('ACEPTADO', 'PUEDE_PASAR_A_RETIRAR', 'DELIVERY')).toBe(false);
  });

  it('blocks backwards transitions once REPARTIDOR_EN_CAMINO is reached', () => {
    expect(canTransition('REPARTIDOR_EN_CAMINO', 'ACEPTADO', 'DELIVERY')).toBe(false);
    expect(canTransition('REPARTIDOR_EN_CAMINO', 'ENVIADO_AL_NEGOCIO', 'DELIVERY')).toBe(false);
  });

  it('terminal states cannot transition out (delivery)', () => {
    const others: Status[] = ['ENVIADO_AL_NEGOCIO', 'ACEPTADO', 'REPARTIDOR_EN_CAMINO'];
    for (const target of others) {
      expect(canTransition('ENTREGADO', target, 'DELIVERY')).toBe(false);
      expect(canTransition('CANCELADO', target, 'DELIVERY')).toBe(false);
    }
  });
});

describe('canTransition (PASAR_A_RETIRAR)', () => {
  it('canTransition_retiro_rechaza_repartidor', () => {
    expect(canTransition('ACEPTADO', 'REPARTIDOR_EN_CAMINO', 'PASAR_A_RETIRAR')).toBe(false);
  });

  it('canTransition_retiro_aceptado_a_preparando', () => {
    expect(canTransition('ACEPTADO', 'PREPARANDO', 'PASAR_A_RETIRAR')).toBe(true);
  });

  it('canTransition_retiro_preparando_a_puede_pasar_a_retirar', () => {
    expect(canTransition('PREPARANDO', 'PUEDE_PASAR_A_RETIRAR', 'PASAR_A_RETIRAR')).toBe(true);
  });

  it('canTransition_retiro_puede_pasar_a_retirar_a_entregado', () => {
    expect(canTransition('PUEDE_PASAR_A_RETIRAR', 'ENTREGADO', 'PASAR_A_RETIRAR')).toBe(true);
  });

  it('canTransition_retiro_rechaza_saltar_pasos', () => {
    expect(canTransition('ACEPTADO', 'ENTREGADO', 'PASAR_A_RETIRAR')).toBe(false);
    expect(canTransition('ENVIADO_AL_NEGOCIO', 'PREPARANDO', 'PASAR_A_RETIRAR')).toBe(false);
    expect(canTransition('PREPARANDO', 'ENTREGADO', 'PASAR_A_RETIRAR')).toBe(false);
  });

  it('terminal states cannot transition out (retiro)', () => {
    const others: Status[] = [
      'ENVIADO_AL_NEGOCIO',
      'ACEPTADO',
      'PREPARANDO',
      'PUEDE_PASAR_A_RETIRAR',
    ];
    for (const target of others) {
      expect(canTransition('ENTREGADO', target, 'PASAR_A_RETIRAR')).toBe(false);
      expect(canTransition('CANCELADO', target, 'PASAR_A_RETIRAR')).toBe(false);
    }
  });
});

describe('canTransition (cancelación transversal)', () => {
  it('canTransition_ambos_permiten_cancelado', () => {
    // Delivery
    expect(canTransition('ENVIADO_AL_NEGOCIO', 'CANCELADO', 'DELIVERY')).toBe(true);
    expect(canTransition('ACEPTADO', 'CANCELADO', 'DELIVERY')).toBe(true);
    expect(canTransition('REPARTIDOR_EN_CAMINO', 'CANCELADO', 'DELIVERY')).toBe(true);
    // Retiro
    expect(canTransition('ENVIADO_AL_NEGOCIO', 'CANCELADO', 'PASAR_A_RETIRAR')).toBe(true);
    expect(canTransition('ACEPTADO', 'CANCELADO', 'PASAR_A_RETIRAR')).toBe(true);
    expect(canTransition('PREPARANDO', 'CANCELADO', 'PASAR_A_RETIRAR')).toBe(true);
    expect(canTransition('PUEDE_PASAR_A_RETIRAR', 'CANCELADO', 'PASAR_A_RETIRAR')).toBe(true);
  });
});

describe('matrices y secuencias', () => {
  it('ALLOWED_TRANSITIONS_* cubren todos los estados', () => {
    for (const s of STATUSES) {
      expect(Array.isArray(ALLOWED_TRANSITIONS_DELIVERY[s])).toBe(true);
      expect(Array.isArray(ALLOWED_TRANSITIONS_RETIRO[s])).toBe(true);
    }
  });

  it('stepperStatusesFor_delivery_tiene_4_pasos', () => {
    expect(stepperStatusesFor('DELIVERY')).toEqual([
      'ENVIADO_AL_NEGOCIO',
      'ACEPTADO',
      'REPARTIDOR_EN_CAMINO',
      'ENTREGADO',
    ]);
    expect(STATUSES_LINEAR_DELIVERY).toHaveLength(4);
  });

  it('stepperStatusesFor_retiro_tiene_5_pasos', () => {
    expect(stepperStatusesFor('PASAR_A_RETIRAR')).toEqual([
      'ENVIADO_AL_NEGOCIO',
      'ACEPTADO',
      'PREPARANDO',
      'PUEDE_PASAR_A_RETIRAR',
      'ENTREGADO',
    ]);
    expect(STATUSES_LINEAR_RETIRO).toHaveLength(5);
  });

  it('retiro no incluye REPARTIDOR_EN_CAMINO en el stepper', () => {
    expect(stepperStatusesFor('PASAR_A_RETIRAR')).not.toContain('REPARTIDOR_EN_CAMINO');
  });

  it('delivery no incluye PREPARANDO ni PUEDE_PASAR_A_RETIRAR en el stepper', () => {
    expect(stepperStatusesFor('DELIVERY')).not.toContain('PREPARANDO');
    expect(stepperStatusesFor('DELIVERY')).not.toContain('PUEDE_PASAR_A_RETIRAR');
  });
});
