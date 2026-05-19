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

export const STATUS_SHORT_LABELS: Record<Status, string> = {
  ENVIADO_AL_NEGOCIO: 'Enviado',
  ACEPTADO: 'Aceptado',
  REPARTIDOR_EN_CAMINO: 'En camino',
  ENTREGADO: 'Entregado',
};

export const STATUS_BANNER: Record<Status, string> = {
  ENVIADO_AL_NEGOCIO: 'Tu pedido fue enviado al negocio',
  ACEPTADO: 'El local está preparando tu pedido',
  REPARTIDOR_EN_CAMINO: 'Tu driver ya está en camino con tu pedido',
  ENTREGADO: '¡Tu pedido fue entregado!',
};

export const STATUS_TITLE: Record<Status, string> = {
  ENVIADO_AL_NEGOCIO: 'Esperando confirmación del local',
  ACEPTADO: 'El local lo está preparando',
  REPARTIDOR_EN_CAMINO: 'El repartidor lo está llevando',
  ENTREGADO: 'Pedido entregado',
};

export const STATUS_TIMELINE_DONE: Record<Status, string> = {
  ENVIADO_AL_NEGOCIO: 'El local recibió tu pedido',
  ACEPTADO: 'El local lo está preparando',
  REPARTIDOR_EN_CAMINO: 'Estamos llevando tu pedido',
  ENTREGADO: '¡Entregamos tu pedido!',
};

export const STATUS_TIMELINE_FUTURE: Record<Status, string> = {
  ENVIADO_AL_NEGOCIO: 'Enviado al negocio',
  ACEPTADO: 'El local recibirá tu pedido',
  REPARTIDOR_EN_CAMINO: 'Estamos llevando tu pedido',
  ENTREGADO: '¡Entregamos tu pedido!',
};
