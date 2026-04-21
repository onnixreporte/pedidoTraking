import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { toOrderDto } from '@/lib/dto';
import { ControlView } from './control-view';

export const dynamic = 'force-dynamic';

export default async function Page({
  params,
}: {
  params: Promise<{ adminToken: string }>;
}) {
  const { adminToken } = await params;
  const order = await prisma.order.findUnique({ where: { adminToken } });
  if (!order) notFound();
  return <ControlView initial={toOrderDto(order)} adminToken={adminToken} />;
}
