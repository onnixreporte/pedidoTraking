import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { toOrderDto } from '@/lib/dto';
import { STATUSES } from '@/lib/status';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PatchSchema = z
  .object({
    status: z.enum(STATUSES).optional(),
    estimatedMinutes: z.number().int().positive().nullable().optional(),
  })
  .refine(
    (d) => d.status !== undefined || d.estimatedMinutes !== undefined,
    'al menos un campo requerido',
  );

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ adminToken: string }> },
) {
  const { adminToken } = await params;
  const order = await prisma.order.findUnique({ where: { adminToken } });
  if (!order) {
    console.error('[GET /api/admin] not found', { adminToken, length: adminToken.length });
    return NextResponse.json({ error: 'not_found', adminToken }, { status: 404 });
  }
  return NextResponse.json(toOrderDto(order), {
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

  const order = await prisma.order
    .update({ where: { adminToken }, data: parsed.data })
    .catch((e) => {
      console.error('[PATCH /api/admin] update failed', { adminToken, error: e.message });
      return null;
    });

  if (!order) return NextResponse.json({ error: 'not_found', adminToken }, { status: 404 });
  return NextResponse.json(toOrderDto(order));
}
