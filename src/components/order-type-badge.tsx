import type { OrderType } from '@/lib/status';

type BadgeConfig = {
  icon: string;
  label: string;
  bg: string;
  text: string;
};

const CONFIG: Record<OrderType, BadgeConfig> = {
  PASAR_A_RETIRAR: {
    icon: '🏪',
    label: 'Retiro',
    bg: 'bg-[#066731]/10',
    text: 'text-[#066731]',
  },
  DELIVERY: {
    icon: '🛵',
    label: 'Delivery',
    bg: 'bg-[#fcf9f2]',
    text: 'text-[#5a5a5a]',
  },
};

/**
 * Badge reusable de tipo de pedido.
 * - `compact`: pill chica con emoji + label (cards, drawer, vista control).
 * - `prominent`: eyebrow uppercase (vista cliente). Solo se usa para retiro,
 *   donde acompaña al título grande de la sucursal.
 */
export function OrderTypeBadge({
  type,
  variant = 'compact',
}: {
  type: OrderType;
  variant?: 'compact' | 'prominent';
}) {
  const config = CONFIG[type];

  if (variant === 'prominent') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#066731]">
        <span aria-hidden>{config.icon}</span>
        Retiro en
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${config.bg} ${config.text}`}
    >
      <span aria-hidden>{config.icon}</span>
      {config.label}
    </span>
  );
}
