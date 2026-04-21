import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { genAdminToken, genPublicId } from '@/lib/ids';
import { buildLinks } from '@/lib/links';

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
  id_chat: z.string().trim().min(1),
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

  const { detalle, direccion, total, cliente, id_chat } = parsed.data;

  const cutoff = new Date(Date.now() - IDEMPOTENCY_WINDOW_MS);
  const existing = await prisma.order.findFirst({
    where: { idChat: id_chat, total, detalle, createdAt: { gte: cutoff } },
  });
  if (existing) return NextResponse.json(buildLinks(existing));

  const order = await prisma.order.create({
    data: {
      publicId: genPublicId(),
      adminToken: genAdminToken(),
      cliente,
      detalle,
      direccion,
      total,
      idChat: id_chat,
    },
  });

  return NextResponse.json(buildLinks(order), { status: 201 });
}
