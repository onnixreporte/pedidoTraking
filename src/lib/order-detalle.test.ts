import { describe, it, expect } from 'vitest';
import {
  autoTotal,
  emptyRow,
  isRowFilled,
  rowCantidad,
  rowPrecio,
  serializeDetalle,
  validateRows,
  type DetalleRow,
} from './order-detalle';
import { parseDetalle } from './parse-detalle';

const row = (cantidad: string, producto: string, precio: string): DetalleRow => ({
  cantidad,
  producto,
  precio,
});

describe('emptyRow', () => {
  it('starts blank', () => {
    expect(emptyRow()).toEqual({ cantidad: '', producto: '', precio: '' });
  });
});

describe('rowCantidad', () => {
  it('defaults to 1 when empty, invalid or below 1', () => {
    expect(rowCantidad(row('', 'X', '100'))).toBe(1);
    expect(rowCantidad(row('abc', 'X', '100'))).toBe(1);
    expect(rowCantidad(row('0', 'X', '100'))).toBe(1);
  });

  it('uses the loaded number when valid', () => {
    expect(rowCantidad(row('3', 'X', '100'))).toBe(3);
  });
});

describe('rowPrecio', () => {
  it('strips non-digits (thousands separators)', () => {
    expect(rowPrecio(row('1', 'X', '12.000'))).toBe(12000);
    expect(rowPrecio(row('1', 'X', 'Gs. 8.500'))).toBe(8500);
  });

  it('returns 0 when no number', () => {
    expect(rowPrecio(row('1', 'X', ''))).toBe(0);
  });
});

describe('autoTotal', () => {
  it('sums line prices of all rows (line total, not unit x qty)', () => {
    const rows = [row('1', 'Empanada de pollo', '12.000'), row('2', 'Coca 500ml', '10.000')];
    expect(autoTotal(rows)).toBe(22000);
  });

  it('ignores rows without a price', () => {
    const rows = [row('1', 'Empanada', '12.000'), row('1', '', '')];
    expect(autoTotal(rows)).toBe(12000);
  });

  it('is 0 for empty editor', () => {
    expect(autoTotal([emptyRow()])).toBe(0);
  });
});

describe('isRowFilled', () => {
  it('requires producto non-empty and precio > 0', () => {
    expect(isRowFilled(row('1', 'Empanada', '12.000'))).toBe(true);
    expect(isRowFilled(row('1', '', '12.000'))).toBe(false);
    expect(isRowFilled(row('1', '   ', '12.000'))).toBe(false);
    expect(isRowFilled(row('1', 'Empanada', ''))).toBe(false);
    expect(isRowFilled(row('1', 'Empanada', '0'))).toBe(false);
  });
});

describe('serializeDetalle', () => {
  it('produces "{cant}x {producto} - Gs. {precio}" one line per item', () => {
    const out = serializeDetalle([
      row('1', 'Empanada de pollo', '12.000'),
      row('2', 'Coca 500ml', '10.000'),
    ]);
    expect(out).toBe('1x Empanada de pollo - Gs. 12.000\n2x Coca 500ml - Gs. 10.000');
  });

  it('defaults cantidad to 1 and formats price with es-PY thousands separator', () => {
    const out = serializeDetalle([row('', 'Café con leche', '8500')]);
    expect(out).toBe('1x Café con leche - Gs. 8.500');
  });

  it('drops rows without producto or precio', () => {
    const out = serializeDetalle([
      row('1', 'Empanada', '12.000'),
      row('1', '', ''),
      row('2', 'Coca', '10.000'),
    ]);
    expect(out).toBe('1x Empanada - Gs. 12.000\n2x Coca - Gs. 10.000');
  });

  it('round-trips through parseDetalle (same wire contract)', () => {
    const str = serializeDetalle([
      row('1', 'Empanada de pollo', '12.000'),
      row('2', 'Coca 500ml', '10.000'),
    ]);
    const parsed = parseDetalle(str);
    expect(parsed).toEqual([
      { product: '1x Empanada de pollo', price: 'Gs. 12.000' },
      { product: '2x Coca 500ml', price: 'Gs. 10.000' },
    ]);
  });
});

describe('validateRows', () => {
  it('passes when at least one row has producto + precio', () => {
    expect(validateRows([row('1', 'Empanada', '12.000')])).toEqual({ ok: true });
  });

  it('fails when no row is filled', () => {
    const result = validateRows([emptyRow(), row('1', 'Solo nombre', '')]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/al menos un ítem/i);
  });
});
