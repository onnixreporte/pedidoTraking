import type { Order } from '@prisma/client';
import type { OrderType, Status } from './status';

export type OrderPublicDto = {
  cliente: string;
  direccion: string | null;
  detalle: string;
  total: number;
  status: Status;
  orderType: OrderType;
  sucursal: string | null;
  fechaRetiro: string | null;
  horaRetiro: string | null;
  avisoCliente: boolean | null;
  estimatedMinutes: number | null;
  deliveryFee: number | null;
  additionalNote: string | null;
  createdAt: string;
  acceptedAt: string | null;
  pickupAt: string | null;
  preparingAt: string | null;
  readyAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
};

export type OrderAdminDto = OrderPublicDto & {
  id: string;
  publicId: string;
  adminToken: string;
  telefono: string | null;
  cancelReason: string | null;
  internalNotes: string | null;
  updatedAt: string;
};

/**
 * @deprecated usar OrderPublicDto u OrderAdminDto según contexto.
 * Mantenido por compatibilidad con componentes que aún lo importan.
 */
export type OrderDto = OrderPublicDto;

export function toOrderPublicDto(order: Order): OrderPublicDto {
  return {
    cliente: order.cliente,
    direccion: order.direccion,
    detalle: order.detalle,
    total: order.total,
    status: order.status as Status,
    orderType: order.orderType as OrderType,
    sucursal: order.sucursal,
    fechaRetiro: order.fechaRetiro?.toISOString() ?? null,
    horaRetiro: order.horaRetiro,
    avisoCliente: order.avisoCliente,
    estimatedMinutes: order.estimatedMinutes,
    deliveryFee: order.deliveryFee,
    additionalNote: order.additionalNote,
    createdAt: order.createdAt.toISOString(),
    acceptedAt: order.acceptedAt?.toISOString() ?? null,
    pickupAt: order.pickupAt?.toISOString() ?? null,
    preparingAt: order.preparingAt?.toISOString() ?? null,
    readyAt: order.readyAt?.toISOString() ?? null,
    deliveredAt: order.deliveredAt?.toISOString() ?? null,
    cancelledAt: order.cancelledAt?.toISOString() ?? null,
  };
}

export function toOrderAdminDto(order: Order): OrderAdminDto {
  return {
    ...toOrderPublicDto(order),
    id: order.id,
    publicId: order.publicId,
    adminToken: order.adminToken,
    telefono: order.telefono,
    cancelReason: order.cancelReason,
    internalNotes: order.internalNotes,
    updatedAt: order.updatedAt.toISOString(),
  };
}

/** @deprecated usar toOrderPublicDto */
export const toOrderDto = toOrderPublicDto;
