// Catálogo fijo de sucursales para pedidos PASAR_A_RETIRAR.
// Confirmado por el dueño (2026-06-09). Solo code + label, sin dirección.
// Vive en código (no en DB) para no requerir migración al cambiar el catálogo.

export const SUCURSALES = [
  'VILLA_MORRA',
  'TEXTILIA',
  'LOS_LAURELES',
  'TERRAZAS_LA_GALERIA',
] as const;

export type Sucursal = (typeof SUCURSALES)[number];

export const SUCURSAL_LABELS: Record<Sucursal, string> = {
  VILLA_MORRA: 'Villa Morra',
  TEXTILIA: 'Textilia',
  LOS_LAURELES: 'Los Laureles',
  TERRAZAS_LA_GALERIA: 'Terrazas del Paseo la Galería',
};

// Normaliza un string quitando acentos, colapsando espacios/underscores y
// bajando a lowercase, para comparar de forma robusta tanto el código como el label.
function norm(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // saca acentos (rango de diacríticos combinantes)
    .replace(/[\s_]+/g, ' ') // colapsa espacios/underscores
    .trim()
    .toLowerCase();
}

// Mapa de búsqueda: code normalizado + label normalizado → code canónico.
const SUCURSAL_LOOKUP: Record<string, Sucursal> = (() => {
  const map: Record<string, Sucursal> = {};
  for (const code of SUCURSALES) {
    map[norm(code)] = code; // 'villa morra' (desde VILLA_MORRA)
    map[norm(SUCURSAL_LABELS[code])] = code; // 'villa morra' (desde label)
  }
  return map;
})();

/**
 * Resuelve un valor entrante (código O label, con/sin acentos) al código canónico.
 * Devuelve null si no matchea ninguna sucursal del catálogo.
 *
 * Botmaker manda el LABEL elegido por el cliente ("Villa Morra", "Terrazas del Paseo
 * la Galería"), así que esta resolución tolerante es necesaria.
 */
export function resolveSucursal(value: unknown): Sucursal | null {
  if (typeof value !== 'string') return null;
  return SUCURSAL_LOOKUP[norm(value)] ?? null;
}

export function isSucursal(value: unknown): value is Sucursal {
  return typeof value === 'string' && (SUCURSALES as readonly string[]).includes(value);
}
