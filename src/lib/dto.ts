import type { Order } from '@prisma/client';
import type { Status } from './status';

export type OrderDto = {
  cliente: string;
  direccion: string;
  detalle: string;
  total: number;
  status: Status;
  estimatedMinutes: number | null;
  deliveryFee: number | null;
  createdAt: string;
};

export function toOrderDto(order: Order): OrderDto {
  return {
    cliente: order.cliente,
    direccion: order.direccion,
    detalle: order.detalle,
    total: order.total,
    status: order.status as Status,
    estimatedMinutes: order.estimatedMinutes,
    deliveryFee: order.deliveryFee,
    createdAt: order.createdAt.toISOString(),
  };
}
