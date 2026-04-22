import { formatGs } from '@/lib/format';
import { STATUS_LABELS } from '@/lib/status';
import { STATUS_COLORS } from '@/lib/mock-orders';
import type { OrderDto } from '@/lib/dto';
import type { Status } from '@/lib/status';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  return `hace ${hrs}h`;
}

export function OrderCard({ order }: { order: OrderDto }) {
  const colors = STATUS_COLORS[order.status as Status];

  return (
    <div
      className={`flex flex-col gap-3 rounded-lg border-l-4 ${colors.border} ${colors.bg} p-4`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-semibold leading-tight">{order.cliente}</p>
          <p className="truncate text-sm text-gray-500">{order.direccion}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${colors.badge}`}>
          {STATUS_LABELS[order.status as Status]}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-sm font-medium">{formatGs(order.total)}</span>
        <span className="text-xs text-gray-400">{timeAgo(order.createdAt)}</span>
      </div>

      {order.estimatedMinutes != null && (
        <div className="text-xs text-gray-500">
          ETA: {order.estimatedMinutes} min
        </div>
      )}
    </div>
  );
}