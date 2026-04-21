'use client';

import { useVisiblePoll } from '@/hooks/use-visible-poll';
import { OrderDisplay } from '@/components/order-display';
import type { OrderDto } from '@/lib/dto';

export function TrackingView({
  initial,
  publicId,
}: {
  initial: OrderDto;
  publicId: string;
}) {
  const [order] = useVisiblePoll<OrderDto>(`/api/track/${publicId}`, initial);
  return <OrderDisplay order={order} />;
}
