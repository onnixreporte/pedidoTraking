export const STATUSES = [
  'ENVIADO_AL_NEGOCIO',
  'ACEPTADO',
  'REPARTIDOR_EN_CAMINO',
  'ENTREGADO',
] as const;

export type Status = (typeof STATUSES)[number];

export const STATUS_LABELS: Record<Status, string> = {
  ENVIADO_AL_NEGOCIO: 'Enviado al negocio',
  ACEPTADO: 'Aceptado',
  REPARTIDOR_EN_CAMINO: 'Repartidor en camino',
  ENTREGADO: 'Entregado',
};
