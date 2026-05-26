import { prisma } from '@/lib/prisma';
import { toOrderAdminDto } from '@/lib/dto';
import { OrdersPanel } from './orders-panel';

export const dynamic = 'force-dynamic';

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function startOfTomorrow(): Date {
  const t = startOfToday();
  t.setDate(t.getDate() + 1);
  return t;
}

export default async function AdminDashboard() {
  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: startOfToday(), lt: startOfTomorrow() },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return <OrdersPanel initial={orders.map(toOrderAdminDto)} />;
}
