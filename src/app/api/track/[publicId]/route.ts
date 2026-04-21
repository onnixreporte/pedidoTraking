import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { toOrderDto } from '@/lib/dto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ publicId: string }> },
) {
  const { publicId } = await params;
  const order = await prisma.order.findUnique({ where: { publicId } });
  if (!order) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json(toOrderDto(order), {
    headers: { 'Cache-Control': 'no-store' },
  });
}
