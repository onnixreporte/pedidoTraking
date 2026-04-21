import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { toOrderDto } from '@/lib/dto';
import { TrackingView } from './tracking-view';

export const dynamic = 'force-dynamic';

export default async function Page({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;
  const order = await prisma.order.findUnique({ where: { publicId } });
  if (!order) {
    console.error('[GET /t/:publicId] not found', { publicId });
    notFound();
  }
  return <TrackingView initial={toOrderDto(order)} publicId={publicId} />;
}
