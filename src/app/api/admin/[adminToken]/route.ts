import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { toOrderAdminDto } from '@/lib/dto';
import { STATUSES, canTransition, type Status } from '@/lib/status';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PatchSchema = z
  .object({
    status: z.enum(STATUSES).optional(),
    estimatedMinutes: z.number().int().positive().nullable().optional(),
    deliveryFee: z.number().int().nonnegative().nullable().optional(),
    internalNotes: z.string().max(2000).nullable().optional(),
    cancelReason: z.string().trim().min(3).max(500).optional(),
  })
  .refine(
    (d) =>
      d.status !== undefined ||
      d.estimatedMinutes !== undefined ||
      d.deliveryFee !== undefined ||
      d.internalNotes !== undefined ||
      d.cancelReason !== undefined,
    'al menos un campo requerido',
  )
  .refine(
    (d) => d.status !== 'CANCELADO' || (d.cancelReason && d.cancelReason.trim().length >= 3),
    'cancelReason requerido al cancelar',
  );

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ adminToken: string }> },
) {
  const { adminToken } = await params;
  const order = await prisma.order.findUnique({ where: { adminToken } });
  if (!order) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  return NextResponse.json(toOrderAdminDto(order), {
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ adminToken: string }> },
) {
  const { adminToken } = await params;
  const body = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'validation_error', details: parsed.error.issues },
      { status: 400 },
    );
  }

  if (parsed.data.status) {
    const current = await prisma.order.findUnique({
      where: { adminToken },
      select: { status: true, estimatedMinutes: true, deliveryFee: true },
    });
    if (!current) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    if (!canTransition(current.status as Status, parsed.data.status)) {
      return NextResponse.json(
        {
          error: 'INVALID_TRANSITION',
          message: 'No se puede cambiar a ese estado desde el estado actual',
        },
        { status: 400 },
      );
    }

    if (parsed.data.status === 'ACEPTADO') {
      const finalMinutes =
        parsed.data.estimatedMinutes !== undefined
          ? parsed.data.estimatedMinutes
          : current.estimatedMinutes;
      if (finalMinutes == null) {
        return NextResponse.json(
          {
            error: 'ESTIMATED_MINUTES_REQUIRED',
            message: 'Cargá el tiempo estimado antes de aceptar el pedido',
          },
          { status: 400 },
        );
      }
    }

    if (parsed.data.status === 'REPARTIDOR_EN_CAMINO') {
      const finalDelivery =
        parsed.data.deliveryFee !== undefined
          ? parsed.data.deliveryFee
          : current.deliveryFee;
      if (finalDelivery == null) {
        return NextResponse.json(
          {
            error: 'DELIVERY_FEE_REQUIRED',
            message: 'Cargá el costo del delivery antes de pasar al repartidor',
          },
          { status: 400 },
        );
      }
    }
  }

  const data: Prisma.OrderUpdateInput = { ...parsed.data };
  if (parsed.data.status) {
    const now = new Date();
    if (parsed.data.status === 'ACEPTADO') data.acceptedAt = now;
    if (parsed.data.status === 'REPARTIDOR_EN_CAMINO') data.pickupAt = now;
    if (parsed.data.status === 'ENTREGADO') data.deliveredAt = now;
    if (parsed.data.status === 'CANCELADO') data.cancelledAt = now;
  }

  const order = await prisma.order
    .update({ where: { adminToken }, data })
    .catch((e) => {
      console.error('[PATCH /api/admin] update failed', { adminToken, error: e.message });
      return null;
    });

  if (!order) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json(toOrderAdminDto(order));
}
