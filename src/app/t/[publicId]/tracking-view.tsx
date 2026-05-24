'use client';

import { useVisiblePoll } from '@/hooks/use-visible-poll';
import { OrderDisplay } from '@/components/order-display';
import type { OrderPublicDto } from '@/lib/dto';

export function TrackingView({
  initial,
  publicId,
}: {
  initial: OrderPublicDto;
  publicId: string;
}) {
  const [order] = useVisiblePoll<OrderPublicDto>(`/api/track/${publicId}`, initial);
  return <OrderDisplay order={order} />;
}
