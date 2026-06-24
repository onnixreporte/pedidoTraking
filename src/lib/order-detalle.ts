// Editor estructurado del detalle (carga manual del modal Nuevo pedido).
// Cada fila = cantidad + producto + precio de línea (TOTAL de la línea, no unitario).
// Estas funciones son puras para poder testearlas en node y mantener el componente fino.
// El contrato de datos hacia el endpoint/Botmaker NO cambia: al serializar producimos el
// mismo string que hoy entiende parse-detalle: "{cant}x {producto} - Gs. {precio}".

const fmt = new Intl.NumberFormat('es-PY');

export type DetalleRow = {
  /** Cantidad como texto del input (controlado). Vacío permitido mientras se edita. */
  cantidad: string;
  /** Nombre del producto. */
  producto: string;
  /** Precio TOTAL de la línea como texto del input (controlado). */
  precio: string;
};

export function emptyRow(): DetalleRow {
  return { cantidad: '', producto: '', precio: '' };
}

/** Extrae solo dígitos y los parsea; null si no hay número válido. */
function toInt(value: string): number | null {
  const digits = value.replace(/[^\d]/g, '');
  if (!digits) return null;
  const n = parseInt(digits, 10);
  return Number.isFinite(n) ? n : null;
}

/** Cantidad efectiva de una fila: el número cargado, o 1 por defecto (>= 1). */
export function rowCantidad(row: DetalleRow): number {
  const n = toInt(row.cantidad);
  if (n === null || n < 1) return 1;
  return n;
}

/** Precio de línea efectivo: el número cargado o 0. */
export function rowPrecio(row: DetalleRow): number {
  return toInt(row.precio) ?? 0;
}

/** Total auto-calculado: suma de los precios de línea de todas las filas. */
export function autoTotal(rows: DetalleRow[]): number {
  return rows.reduce((sum, row) => sum + rowPrecio(row), 0);
}

/** Una fila es "real" (cuenta para submit/validación) si tiene producto y precio > 0. */
export function isRowFilled(row: DetalleRow): boolean {
  return row.producto.trim().length > 0 && rowPrecio(row) > 0;
}

/**
 * Serializa las filas con producto + precio al string del formato actual,
 * una línea por ítem: "{cant}x {producto} - Gs. {precio}".
 * El precio se formatea con separador de miles es-PY (ej. 12000 -> "12.000").
 */
export function serializeDetalle(rows: DetalleRow[]): string {
  return rows
    .filter(isRowFilled)
    .map((row) => `${rowCantidad(row)}x ${row.producto.trim()} - Gs. ${fmt.format(rowPrecio(row))}`)
    .join('\n');
}

export type DetalleValidation = { ok: true } | { ok: false; error: string };

/**
 * Reglas de aceptación: al menos 1 fila con producto no vacío y precio > 0; cantidad >= 1.
 * (rowCantidad ya garantiza >= 1, así que solo puede fallar por falta de filas reales.)
 */
export function validateRows(rows: DetalleRow[]): DetalleValidation {
  if (!rows.some(isRowFilled)) {
    return { ok: false, error: 'Cargá al menos un ítem con producto y precio' };
  }
  return { ok: true };
}
