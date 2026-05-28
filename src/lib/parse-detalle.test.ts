import { describe, it, expect } from 'vitest';
import { parseDetalle } from './parse-detalle';

describe('parseDetalle', () => {
  it('parses newline-separated items with prices', () => {
    const out = parseDetalle(
      '1x Empanada de pollo - Gs. 12.000\n2x Coca 500ml - Gs. 10.000',
    );
    expect(out).toEqual([
      { product: '1x Empanada de pollo', price: 'Gs. 12.000' },
      { product: '2x Coca 500ml', price: 'Gs. 10.000' },
    ]);
  });

  it('splits comma-separated items when followed by qty pattern', () => {
    const out = parseDetalle(
      '1x Empanada - Gs. 12.000, 2x Coca - Gs. 10.000',
    );
    expect(out).toHaveLength(2);
    expect(out[0].product).toBe('1x Empanada');
    expect(out[1].product).toBe('2x Coca');
  });

  it('filters empty lines', () => {
    const out = parseDetalle('1x Item - Gs. 5.000\n\n  \n2x Otro - Gs. 3.000');
    expect(out).toHaveLength(2);
  });

  it('returns price=null for lines without " - " separator', () => {
    const out = parseDetalle('1x Empanada de pollo al horno');
    expect(out).toEqual([
      { product: '1x Empanada de pollo al horno', price: null },
    ]);
  });

  it('uses LAST " - " as separator', () => {
    const out = parseDetalle('1x Café con leche - Gs. 8.000');
    expect(out[0].product).toBe('1x Café con leche');
    expect(out[0].price).toBe('Gs. 8.000');
  });

  it('returns empty array for empty input', () => {
    expect(parseDetalle('')).toEqual([]);
    expect(parseDetalle('\n\n  \n')).toEqual([]);
  });
});
