export const STATUSES_LINEAR = [
  'ENVIADO_AL_NEGOCIO',
  'ACEPTADO',
  'REPARTIDOR_EN_CAMINO',
  'ENTREGADO',
] as const;

export const STATUSES = [...STATUSES_LINEAR, 'CANCELADO'] as const;

export type LinearStatus = (typeof STATUSES_LINEAR)[number];
export type Status = (typeof STATUSES)[number];

export const STATUS_LABELS: Record<Status, string> = {
  ENVIADO_AL_NEGOCIO: 'Solicitud de pedido',
  ACEPTADO: 'Aceptado',
  REPARTIDOR_EN_CAMINO: 'Repartidor en camino',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
};

export const STATUS_SHORT_LABELS: Record<Status, string> = {
  ENVIADO_AL_NEGOCIO: 'Solicitud',
  ACEPTADO: 'Aceptado',
  REPARTIDOR_EN_CAMINO: 'En camino',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
};

export const STATUS_BANNER: Record<Status, string> = {
  ENVIADO_AL_NEGOCIO: 'Recibimos tu solicitud de pedido',
  ACEPTADO: 'El local está preparando tu pedido',
  REPARTIDOR_EN_CAMINO: 'Tu driver ya está en camino con tu pedido',
  ENTREGADO: '¡Tu pedido fue entregado!',
  CANCELADO: 'Este pedido fue cancelado',
};

export const STATUS_TITLE: Record<Status, string> = {
  ENVIADO_AL_NEGOCIO: 'Esperando confirmación del local',
  ACEPTADO: 'El local lo está preparando',
  REPARTIDOR_EN_CAMINO: 'El repartidor lo está llevando',
  ENTREGADO: 'Pedido entregado',
  CANCELADO: 'Pedido cancelado',
};

export const STATUS_TIMELINE_DONE: Record<Status, string> = {
  ENVIADO_AL_NEGOCIO: 'Recibimos tu solicitud',
  ACEPTADO: 'El local lo está preparando',
  REPARTIDOR_EN_CAMINO: 'Estamos llevando tu pedido',
  ENTREGADO: '¡Entregamos tu pedido!',
  CANCELADO: 'Pedido cancelado',
};

export const STATUS_TIMELINE_FUTURE: Record<Status, string> = {
  ENVIADO_AL_NEGOCIO: 'Solicitud de pedido',
  ACEPTADO: 'El local recibirá tu pedido',
  REPARTIDOR_EN_CAMINO: 'Estamos llevando tu pedido',
  ENTREGADO: '¡Entregamos tu pedido!',
  CANCELADO: 'Pedido cancelado',
};
