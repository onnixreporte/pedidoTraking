import type { Order } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { genAdminToken, genPublicId } from '@/lib/ids';
import { buildLinks } from '@/lib/links';
import { notifyNewOrder } from '@/lib/notifications';
import type { Status } from '@/lib/status';

const IDEMPOTENCY_WINDOW_MS = 5 * 60 * 1000;

/**
 * Input ya parseado y normalizado (wire → interno) que recibe createOrder.
 * El handler POST se encarga del parse Zod (discriminatedUnion + preprocess);
 * este tipo refleja el shape post-parse de ambas ramas del union.
 */
export type PedidoInput = {
  orderType: 'DELIVERY' | 'PASAR_A_RETIRAR';
  detalle: string;
  total: number;
  cliente: string;
  telefono?: string;
  aditionalnota?: string;
  id_chat?: string;
  status?: Status;
  estimatedMinutes?: number;
  // Delivery
  direccion?: string;
  deliveryFee?: number;
  // Retiro
  sucursal?: string;
  fecha_retiro?: Date;
  aviso?: boolean;
  hora?: string;
};

export type OrderCreateResult =
  | { ok: true; order: Order; links: ReturnType<typeof buildLinks>; idempotent: boolean }
  | { ok: false; error: string; message: string; status: number };

/**
 * Lógica post-parse de creación de un pedido: validación de invariantes por estado,
 * idempotencia, generación de tokens, mapeo wire→DB por tipo, persistencia, stamping
 * inicial de timestamps según `status`, notificación y construcción de links.
 *
 * El handler POST /api/pedidos solo orquesta: parse → createOrder → response.
 */
export async function createOrder(input: PedidoInput): Promise<OrderCreateResult> {
  const {
    orderType,
    detalle,
    total,
    cliente,
    telefono,
    aditionalnota,
    id_chat,
    status,
    estimatedMinutes,
    direccion,
    deliveryFee,
    sucursal,
    fecha_retiro,
    aviso,
    hora,
  } = input;

  // Invariante: estados avanzados requieren tiempo estimado (ambos tipos).
  if (status && status !== 'ENVIADO_AL_NEGOCIO' && estimatedMinutes == null) {
    return {
      ok: false,
      error: 'ESTIMATED_MINUTES_REQUIRED',
      message: 'Cargá el tiempo estimado para crear el pedido en este estado',
      status: 400,
    };
  }

  // Invariante: delivery que arranca despachado/entregado requiere deliveryFee.
  // (Retiro no exige deliveryFee en ningún estado — R12.)
  if (
    orderType === 'DELIVERY' &&
    status &&
    (status === 'REPARTIDOR_EN_CAMINO' || status === 'ENTREGADO') &&
    deliveryFee == null
  ) {
    return {
      ok: false,
      error: 'DELIVERY_FEE_REQUIRED',
      message: 'Cargá el costo del delivery para crear el pedido en este estado',
      status: 400,
    };
  }

  // Idempotencia (R16): ventana de 5 min sobre (idChat, total, detalle), sin importar orderType.
  if (id_chat) {
    const cutoff = new Date(Date.now() - IDEMPOTENCY_WINDOW_MS);
    const existing = await prisma.order.findFirst({
      where: { idChat: id_chat, total, detalle, createdAt: { gte: cutoff } },
    });
    if (existing) {
      return { ok: true, order: existing, links: buildLinks(existing), idempotent: true };
    }
  }

  // Mapeo wire → DB por tipo. Los campos del otro tipo quedan null.
  const dbInput =
    orderType === 'PASAR_A_RETIRAR'
      ? {
          orderType: 'PASAR_A_RETIRAR' as const,
          direccion: direccion ?? null,
          sucursal: sucursal ?? null,
          fechaRetiro: fecha_retiro ?? null,
          horaRetiro: hora ?? null,
          avisoCliente: aviso ?? null,
          deliveryFee: null,
        }
      : {
          orderType: 'DELIVERY' as const,
          direccion: direccion ?? null,
          sucursal: null,
          fechaRetiro: null,
          horaRetiro: null,
          avisoCliente: null,
          deliveryFee: deliveryFee ?? null,
        };

  const now = new Date();
  const order = await prisma.order.create({
    data: {
      publicId: genPublicId(),
      adminToken: genAdminToken(),
      cliente,
      telefono: telefono ?? null,
      detalle,
      total,
      additionalNote: aditionalnota ?? null,
      idChat: id_chat ?? null,
      ...dbInput,
      ...(status ? { status } : {}),
      ...(estimatedMinutes != null ? { estimatedMinutes } : {}),
      ...(status === 'ACEPTADO' ||
      status === 'REPARTIDOR_EN_CAMINO' ||
      status === 'PREPARANDO' ||
      status === 'PUEDE_PASAR_A_RETIRAR' ||
      status === 'ENTREGADO'
        ? { acceptedAt: now }
        : {}),
      ...(status === 'REPARTIDOR_EN_CAMINO' || status === 'ENTREGADO' ? { pickupAt: now } : {}),
      ...(status === 'PREPARANDO' ? { preparingAt: now } : {}),
      ...(status === 'PUEDE_PASAR_A_RETIRAR' ? { readyAt: now } : {}),
      ...(status === 'ENTREGADO' ? { deliveredAt: now } : {}),
    },
  });

  console.log('[POST /api/pedidos] created', {
    id: order.id,
    publicId: order.publicId,
    orderType: order.orderType,
    sucursal: order.sucursal,
    cliente: order.cliente,
    total: order.total,
  });

  await notifyNewOrder(order);

  return { ok: true, order, links: buildLinks(order), idempotent: false };
}
