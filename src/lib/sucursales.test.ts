import { describe, it, expect } from 'vitest';
import {
  SUCURSALES,
  SUCURSAL_LABELS,
  resolveSucursal,
  isSucursal,
  type Sucursal,
} from './sucursales';

// T4 — Cubre R4
describe('catálogo de sucursales', () => {
  it('SUCURSALES_y_SUCURSAL_LABELS_estan_sincronizados', () => {
    for (const code of SUCURSALES) {
      expect(SUCURSAL_LABELS[code]).toBeTruthy();
      expect(typeof SUCURSAL_LABELS[code]).toBe('string');
    }
    // No hay labels huérfanos (mismo cardinal en ambos lados).
    expect(Object.keys(SUCURSAL_LABELS).length).toBe(SUCURSALES.length);
  });

  it('isSucursal_rechaza_codigos_desconocidos', () => {
    expect(isSucursal('VILLA_MORRA')).toBe(true);
    expect(isSucursal('CENTRO')).toBe(false);
    expect(isSucursal('villa_morra')).toBe(false); // case-sensitive: guarda el code exacto
    expect(isSucursal(123)).toBe(false);
    expect(isSucursal(null)).toBe(false);
    expect(isSucursal(undefined)).toBe(false);
  });
});

// T3b — Cubre R4, R5
describe('resolveSucursal', () => {
  it('resuelve el código exacto', () => {
    expect(resolveSucursal('VILLA_MORRA')).toBe('VILLA_MORRA');
    expect(resolveSucursal('TEXTILIA')).toBe('TEXTILIA');
    expect(resolveSucursal('LOS_LAURELES')).toBe('LOS_LAURELES');
    expect(resolveSucursal('TERRAZAS_LA_GALERIA')).toBe('TERRAZAS_LA_GALERIA');
  });

  it('resuelve el label exacto', () => {
    expect(resolveSucursal('Villa Morra')).toBe('VILLA_MORRA');
    expect(resolveSucursal('Textilia')).toBe('TEXTILIA');
    expect(resolveSucursal('Los Laureles')).toBe('LOS_LAURELES');
    expect(resolveSucursal('Terrazas del Paseo la Galería')).toBe('TERRAZAS_LA_GALERIA');
  });

  it('resuelve el label sin acentos (Botmaker puede mandarlo sin tilde)', () => {
    expect(resolveSucursal('Terrazas del Paseo la Galeria')).toBe('TERRAZAS_LA_GALERIA');
  });

  it('es case-insensitive', () => {
    expect(resolveSucursal('villa morra')).toBe('VILLA_MORRA');
    expect(resolveSucursal('VILLA MORRA')).toBe('VILLA_MORRA');
    expect(resolveSucursal('los LAURELES')).toBe('LOS_LAURELES');
  });

  it('tolera espacios extra y underscores en el label', () => {
    expect(resolveSucursal('  Villa   Morra  ')).toBe('VILLA_MORRA');
    expect(resolveSucursal('los_laureles')).toBe('LOS_LAURELES');
  });

  it('devuelve null para basura', () => {
    expect(resolveSucursal('Sucursal Inexistente')).toBeNull();
    expect(resolveSucursal('')).toBeNull();
    expect(resolveSucursal(42)).toBeNull();
    expect(resolveSucursal(null)).toBeNull();
    expect(resolveSucursal(undefined)).toBeNull();
  });

  it('el código devuelto siempre pertenece al catálogo', () => {
    const code = resolveSucursal('Villa Morra');
    expect(code).not.toBeNull();
    expect(SUCURSALES).toContain(code as Sucursal);
  });
});
