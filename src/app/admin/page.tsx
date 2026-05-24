import { prisma } from '@/lib/prisma';
import { toOrderAdminDto } from '@/lib/dto';
import { OrdersPanel } from './orders-panel';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return <OrdersPanel initial={orders.map(toOrderAdminDto)} />;
}
