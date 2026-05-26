import { NextResponse, type NextRequest } from 'next/server';
import type { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { toOrderAdminDto } from '@/lib/dto';
import { STATUSES } from '@/lib/status';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DateRange = z.enum(['today', 'yesterday', 'last7', 'all', 'custom']);
const SortOrder = z.enum(['desc', 'asc']);
const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const QuerySchema = z.object({
  status: z.union([z.enum(STATUSES), z.literal('ALL')]).default('ALL'),
  search: z.string().trim().min(1).optional(),
  dateRange: DateRange.default('today'),
  from: IsoDate.optional(),
  to: IsoDate.optional(),
  activeOnly: z
    .union([z.literal('true'), z.literal('false')])
    .default('false')
    .transform((v) => v === 'true'),
  sort: SortOrder.default('desc'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

const ACTIVE_STATUSES = ['ENVIADO_AL_NEGOCIO', 'ACEPTADO', 'REPARTIDOR_EN_CAMINO'] as const;

function dateRangeBounds(
  range: z.infer<typeof DateRange>,
  from?: string,
  to?: string,
): { gte?: Date; lt?: Date } {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (range) {
    case 'today': {
      const tomorrow = new Date(startOfToday);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return { gte: startOfToday, lt: tomorrow };
    }
    case 'yesterday': {
      const yesterday = new Date(startOfToday);
      yesterday.setDate(yesterday.getDate() - 1);
      return { gte: yesterday, lt: startOfToday };
    }
    case 'last7': {
      const sevenAgo = new Date(startOfToday);
      sevenAgo.setDate(sevenAgo.getDate() - 6);
      return { gte: sevenAgo };
    }
    case 'custom': {
      if (!from && !to) return {};
      const bounds: { gte?: Date; lt?: Date } = {};
      if (from) bounds.gte = new Date(`${from}T00:00:00`);
      if (to) {
        const toEnd = new Date(`${to}T00:00:00`);
        toEnd.setDate(toEnd.getDate() + 1);
        bounds.lt = toEnd;
      }
      return bounds;
    }
    case 'all':
    default:
      return {};
  }
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const url = req.nextUrl;
  const parsed = QuerySchema.safeParse({
    status: url.searchParams.get('status') ?? undefined,
    search: url.searchParams.get('search') ?? undefined,
    dateRange: url.searchParams.get('dateRange') ?? undefined,
    from: url.searchParams.get('from') ?? undefined,
    to: url.searchParams.get('to') ?? undefined,
    activeOnly: url.searchParams.get('activeOnly') ?? undefined,
    sort: url.searchParams.get('sort') ?? undefined,
    page: url.searchParams.get('page') ?? undefined,
    limit: url.searchParams.get('limit') ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 });
  }

  const { status, search, dateRange, from, to, activeOnly, sort, page, limit } = parsed.data;

  const where: Prisma.OrderWhereInput = {};

  if (activeOnly) {
    where.status = { in: [...ACTIVE_STATUSES] };
  } else if (status !== 'ALL') {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { cliente: { contains: search, mode: 'insensitive' } },
      { telefono: { contains: search, mode: 'insensitive' } },
      { direccion: { contains: search, mode: 'insensitive' } },
    ];
  }

  const bounds = dateRangeBounds(dateRange, from, to);
  if (bounds.gte || bounds.lt) {
    where.createdAt = {};
    if (bounds.gte) where.createdAt.gte = bounds.gte;
    if (bounds.lt) where.createdAt.lt = bounds.lt;
  }

  // Counts: misma fecha + búsqueda, pero SIN filtro de status/activeOnly,
  // para que las chips muestren la distribución real por estado.
  const countsWhere: Prisma.OrderWhereInput = {};
  if (where.OR) countsWhere.OR = where.OR;
  if (where.createdAt) countsWhere.createdAt = where.createdAt;

  const [total, orders, grouped] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy: { createdAt: sort },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.groupBy({
      by: ['status'],
      where: countsWhere,
      _count: { _all: true },
    }),
  ]);

  const counts = {
    ENVIADO_AL_NEGOCIO: 0,
    ACEPTADO: 0,
    REPARTIDOR_EN_CAMINO: 0,
    ENTREGADO: 0,
    CANCELADO: 0,
    ALL: 0,
  };
  for (const g of grouped) {
    counts[g.status as keyof typeof counts] = g._count._all;
    counts.ALL += g._count._all;
  }

  return NextResponse.json(
    {
      items: orders.map(toOrderAdminDto),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      counts,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
