import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { genAdminToken, genPublicId } from '@/lib/ids';
import { buildLinks } from '@/lib/links';
import { notifyNewOrder } from '@/lib/notifications';
import { STATUSES_LINEAR } from '@/lib/status';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const numericish = z
  .union([z.number(), z.string().regex(/^\d+$/)])
  .transform((v) => (typeof v === 'number' ? v : Number(v)))
  .refine((n) => Number.isInteger(n) && n >= 0, 'total debe ser entero >= 0');

const PedidoSchema = z.object({
  detalle: z.string().trim().min(1),
  direccion: z.string().trim().min(1),
  total: numericish,
  cliente: z.string().trim().min(1),
  telefono: z.string().trim().min(6).max(40).optional(),
  aditionalnota: z.string().trim().max(500).optional(),
  id_chat: z.string().trim().min(1).optional(),
  status: z.enum(STATUSES_LINEAR).optional(),
  estimatedMinutes: z.number().int().positive().optional(),
  deliveryFee: z.number().int().nonnegative().optional(),
});

const IDEMPOTENCY_WINDOW_MS = 5 * 60 * 1000;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = PedidoSchema.safeParse(body);
  if (!parsed.success) {
    console.error('[POST /api/pedidos] validation failed', {
      received: body,
      issues: parsed.error.issues,
    });
    return NextResponse.json(
      { error: 'validation_error', details: parsed.error.issues },
      { status: 400 },
    );
  }

  const {
    detalle,
    direccion,
    total,
    cliente,
    telefono,
    aditionalnota,
    id_chat,
    status,
    estimatedMinutes,
    deliveryFee,
  } = parsed.data;

  if (status && status !== 'ENVIADO_AL_NEGOCIO' && estimatedMinutes == null) {
    return NextResponse.json(
      {
        error: 'ESTIMATED_MINUTES_REQUIRED',
        message: 'Cargá el tiempo estimado para crear el pedido en este estado',
      },
      { status: 400 },
    );
  }
  if (
    status &&
    (status === 'REPARTIDOR_EN_CAMINO' || status === 'ENTREGADO') &&
    deliveryFee == null
  ) {
    return NextResponse.json(
      {
        error: 'DELIVERY_FEE_REQUIRED',
        message: 'Cargá el costo del delivery para crear el pedido en este estado',
      },
      { status: 400 },
    );
  }

  if (id_chat) {
    const cutoff = new Date(Date.now() - IDEMPOTENCY_WINDOW_MS);
    const existing = await prisma.order.findFirst({
      where: { idChat: id_chat, total, detalle, createdAt: { gte: cutoff } },
    });
    if (existing) return NextResponse.json(buildLinks(existing));
  }

  const now = new Date();
  const order = await prisma.order.create({
    data: {
      publicId: genPublicId(),
      adminToken: genAdminToken(),
      cliente,
      telefono: telefono ?? null,
      detalle,
      direccion,
      total,
      additionalNote: aditionalnota ?? null,
      idChat: id_chat ?? null,
      ...(status ? { status } : {}),
      ...(estimatedMinutes != null ? { estimatedMinutes } : {}),
      ...(deliveryFee != null ? { deliveryFee } : {}),
      ...(status === 'ACEPTADO' || status === 'REPARTIDOR_EN_CAMINO' || status === 'ENTREGADO'
        ? { acceptedAt: now }
        : {}),
      ...(status === 'REPARTIDOR_EN_CAMINO' || status === 'ENTREGADO' ? { pickupAt: now } : {}),
      ...(status === 'ENTREGADO' ? { deliveredAt: now } : {}),
    },
  });

  console.log('[POST /api/pedidos] created', {
    id: order.id,
    publicId: order.publicId,
    cliente: order.cliente,
    total: order.total,
  });

  await notifyNewOrder(order);

  return NextResponse.json(buildLinks(order), { status: 201 });
}
