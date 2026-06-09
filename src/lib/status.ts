// Enum completo de estados (refleja prisma OrderStatus).
export const STATUSES = [
  'ENVIADO_AL_NEGOCIO',
  'ACEPTADO',
  'REPARTIDOR_EN_CAMINO',
  'PREPARANDO',
  'PUEDE_PASAR_A_RETIRAR',
  'ENTREGADO',
  'CANCELADO',
] as const;

export type Status = (typeof STATUSES)[number];

export type OrderType = 'DELIVERY' | 'PASAR_A_RETIRAR';

// Secuencias lineales por tipo (excluyen CANCELADO porque es transversal).
export const STATUSES_LINEAR_DELIVERY = [
  'ENVIADO_AL_NEGOCIO',
  'ACEPTADO',
  'REPARTIDOR_EN_CAMINO',
  'ENTREGADO',
] as const;

export const STATUSES_LINEAR_RETIRO = [
  'ENVIADO_AL_NEGOCIO',
  'ACEPTADO',
  'PREPARANDO',
  'PUEDE_PASAR_A_RETIRAR',
  'ENTREGADO',
] as const;

/**
 * @deprecated usar stepperStatusesFor(orderType).
 * Alias hacia la secuencia DELIVERY para no romper imports existentes.
 */
export const STATUSES_LINEAR = STATUSES_LINEAR_DELIVERY;

export type LinearStatus = (typeof STATUSES_LINEAR_DELIVERY)[number];

export function stepperStatusesFor(orderType: OrderType): readonly Status[] {
  return orderType === 'PASAR_A_RETIRAR' ? STATUSES_LINEAR_RETIRO : STATUSES_LINEAR_DELIVERY;
}

export const STATUS_LABELS: Record<Status, string> = {
  ENVIADO_AL_NEGOCIO: 'Solicitud de pedido',
  ACEPTADO: 'Aceptado',
  REPARTIDOR_EN_CAMINO: 'Repartidor en camino',
  PREPARANDO: 'Preparando',
  PUEDE_PASAR_A_RETIRAR: 'Puede pasar a retirar',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
};

export const STATUS_SHORT_LABELS: Record<Status, string> = {
  ENVIADO_AL_NEGOCIO: 'Solicitud',
  ACEPTADO: 'Aceptado',
  REPARTIDOR_EN_CAMINO: 'En camino',
  PREPARANDO: 'Preparando',
  PUEDE_PASAR_A_RETIRAR: 'Para retirar',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
};

export const STATUS_BANNER: Record<Status, string> = {
  ENVIADO_AL_NEGOCIO: 'Recibimos tu solicitud de pedido',
  ACEPTADO: 'El local está preparando tu pedido',
  REPARTIDOR_EN_CAMINO: 'Tu driver ya está en camino con tu pedido',
  PREPARANDO: 'El local está preparando tu pedido',
  PUEDE_PASAR_A_RETIRAR: 'Tu pedido está listo para retirar',
  ENTREGADO: '¡Tu pedido fue entregado!',
  CANCELADO: 'Este pedido fue cancelado',
};

export const STATUS_TITLE: Record<Status, string> = {
  ENVIADO_AL_NEGOCIO: 'Esperando confirmación del local',
  ACEPTADO: 'El local lo está preparando',
  REPARTIDOR_EN_CAMINO: 'El repartidor lo está llevando',
  PREPARANDO: 'Preparando tu pedido',
  PUEDE_PASAR_A_RETIRAR: 'Listo para retirar',
  ENTREGADO: 'Pedido entregado',
  CANCELADO: 'Pedido cancelado',
};

export const STATUS_TIMELINE_DONE: Record<Status, string> = {
  ENVIADO_AL_NEGOCIO: 'Recibimos tu solicitud',
  ACEPTADO: 'El local lo está preparando',
  REPARTIDOR_EN_CAMINO: 'Estamos llevando tu pedido',
  PREPARANDO: 'El local preparó tu pedido',
  PUEDE_PASAR_A_RETIRAR: 'Tu pedido quedó listo',
  ENTREGADO: '¡Entregamos tu pedido!',
  CANCELADO: 'Pedido cancelado',
};

export const STATUS_TIMELINE_FUTURE: Record<Status, string> = {
  ENVIADO_AL_NEGOCIO: 'Solicitud de pedido',
  ACEPTADO: 'El local recibirá tu pedido',
  REPARTIDOR_EN_CAMINO: 'Estamos llevando tu pedido',
  PREPARANDO: 'El local va a preparar tu pedido',
  PUEDE_PASAR_A_RETIRAR: 'Te avisaremos cuando esté listo',
  ENTREGADO: '¡Entregamos tu pedido!',
  CANCELADO: 'Pedido cancelado',
};

/**
 * Transiciones permitidas para pedidos DELIVERY.
 * Una vez en REPARTIDOR_EN_CAMINO no se puede volver atrás — solo avanzar o cancelar.
 * PREPARANDO y PUEDE_PASAR_A_RETIRAR no aplican a delivery (entradas vacías).
 */
export const ALLOWED_TRANSITIONS_DELIVERY: Record<Status, readonly Status[]> = {
  ENVIADO_AL_NEGOCIO: ['ACEPTADO', 'CANCELADO'],
  ACEPTADO: ['REPARTIDOR_EN_CAMINO', 'CANCELADO'],
  REPARTIDOR_EN_CAMINO: ['ENTREGADO', 'CANCELADO'],
  PREPARANDO: [],
  PUEDE_PASAR_A_RETIRAR: [],
  ENTREGADO: [],
  CANCELADO: [],
};

/**
 * Transiciones permitidas para pedidos PASAR_A_RETIRAR (flow de 5 pasos).
 * REPARTIDOR_EN_CAMINO no aplica a retiro (entrada vacía).
 */
export const ALLOWED_TRANSITIONS_RETIRO: Record<Status, readonly Status[]> = {
  ENVIADO_AL_NEGOCIO: ['ACEPTADO', 'CANCELADO'],
  ACEPTADO: ['PREPARANDO', 'CANCELADO'],
  PREPARANDO: ['PUEDE_PASAR_A_RETIRAR', 'CANCELADO'],
  PUEDE_PASAR_A_RETIRAR: ['ENTREGADO', 'CANCELADO'],
  REPARTIDOR_EN_CAMINO: [],
  ENTREGADO: [],
  CANCELADO: [],
};

export function transitionsFor(orderType: OrderType): Record<Status, readonly Status[]> {
  return orderType === 'PASAR_A_RETIRAR'
    ? ALLOWED_TRANSITIONS_RETIRO
    : ALLOWED_TRANSITIONS_DELIVERY;
}

export function canTransition(from: Status, to: Status, orderType: OrderType): boolean {
  if (from === to) return true;
  return transitionsFor(orderType)[from].includes(to);
}

/**
 * @deprecated usar transitionsFor(orderType).
 * Alias hacia la matriz DELIVERY para no romper imports existentes.
 */
export const ALLOWED_TRANSITIONS = ALLOWED_TRANSITIONS_DELIVERY;
