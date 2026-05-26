import { parseDetalle } from '@/lib/parse-detalle';
import { formatGs, formatTime, formatTimeRange } from '@/lib/format';
import type { OrderPublicDto } from '@/lib/dto';
import {
  STATUSES_LINEAR,
  STATUS_BANNER,
  STATUS_TIMELINE_DONE,
  STATUS_TIMELINE_FUTURE,
  STATUS_TITLE,
  type LinearStatus,
  type Status,
} from '@/lib/status';
import { StateStepper } from './state-stepper';

const LOGO_SRC =
  'https://www.fiweex.com/sistema/img/logos/thumbnail/c6744fdc9907459976f35253c84964a5.jpeg';

export function OrderDisplay({
  order,
  controls,
}: {
  order: OrderPublicDto;
  controls?: React.ReactNode;
}) {
  const items = parseDetalle(order.detalle);
  const hasDelivery = order.deliveryFee != null && order.deliveryFee > 0;
  const grandTotal = order.total + (order.deliveryFee ?? 0);
  const isCancelled = order.status === 'CANCELADO';
  const currentIdx = STATUSES_LINEAR.indexOf(order.status as LinearStatus);
  const showTimeRange =
    !isCancelled &&
    order.estimatedMinutes != null &&
    currentIdx >= STATUSES_LINEAR.indexOf('ACEPTADO');
  const rangeAnchor = order.acceptedAt ?? order.createdAt;

  const stepTime: Record<LinearStatus, string | null> = {
    ENVIADO_AL_NEGOCIO: order.createdAt,
    ACEPTADO: order.acceptedAt,
    REPARTIDOR_EN_CAMINO: order.pickupAt,
    ENTREGADO: order.deliveredAt,
  };

  return (
    <main className="mx-auto max-w-md space-y-4 p-4 sm:p-6">
      <h1 className="text-center text-base font-semibold tracking-tight text-[#1f1f1f]">
        Estado del Pedido
      </h1>

      {/* Local */}
      <section className="card flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={LOGO_SRC}
          alt="Café de Acá"
          className="h-12 w-12 rounded-xl object-cover ring-1 ring-black/5"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-[#1f1f1f]">Café de Acá</p>
          <p className="truncate text-sm text-[#8a8a8a]">{order.direccion}</p>
        </div>
      </section>

      {/* Banner contextual */}
      <section
        className={[
          'flex items-start gap-2.5 rounded-2xl px-4 py-3 text-sm',
          isCancelled
            ? 'bg-[#b4191e]/8 ring-1 ring-[#b4191e]/15'
            : 'bg-[#066731]/8 ring-1 ring-[#066731]/15',
        ].join(' ')}
      >
        <svg
          className={[
            'mt-0.5 h-5 w-5 flex-shrink-0',
            isCancelled ? 'text-[#b4191e]' : 'text-[#066731]',
          ].join(' ')}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
        >
          <path
            fillRule="evenodd"
            d="M18 10A8 8 0 1 1 2 10a8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a1 1 0 0 0 0 2v3a1 1 0 0 0 1 1h1a1 1 0 1 0 0-2v-3a1 1 0 0 0-1-1H9Z"
            clipRule="evenodd"
          />
        </svg>
        <p
          className={[
            'font-medium',
            isCancelled ? 'text-[#b4191e]' : 'text-[#066731]',
          ].join(' ')}
        >
          {STATUS_BANNER[order.status as Status]}
        </p>
      </section>

      {/* Hora estimada */}
      {showTimeRange && (
        <section className="card flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={LOGO_SRC}
            alt=""
            className="h-12 w-12 rounded-xl object-cover ring-1 ring-black/5"
          />
          <div className="min-w-0 flex-1">
            <p className="text-lg font-bold text-[#1f1f1f]">
              {formatTimeRange(rangeAnchor, order.estimatedMinutes!)}
            </p>
            <p className="text-sm text-[#8a8a8a]">Hora estimada de entrega</p>
          </div>
        </section>
      )}

      {/* Stepper horizontal */}
      {!isCancelled && (
        <section className="card">
          <StateStepper current={order.status as Status} />
        </section>
      )}

      {/* Timeline vertical */}
      <section className="card">
        <p className="mb-3 text-center text-base font-semibold text-[#1f1f1f]">
          {STATUS_TITLE[order.status as Status]}
        </p>
        <ol className="space-y-3">
          {STATUSES_LINEAR.map((s, i) => {
            const done = i < currentIdx;
            const active = i === currentIdx;
            const ts = stepTime[s];
            const timeLabel = ts ? formatTime(ts) : '';
            const text =
              done || active
                ? STATUS_TIMELINE_DONE[s]
                : STATUS_TIMELINE_FUTURE[s];

            return (
              <li key={s} className="flex items-center gap-3">
                {done && (
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#066731] text-white">
                    <svg
                      className="h-3.5 w-3.5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.704 5.29a1 1 0 0 1 .006 1.415l-7.5 7.55a1 1 0 0 1-1.42 0L3.29 9.755a1 1 0 1 1 1.42-1.41l3.79 3.81 6.79-6.84a1 1 0 0 1 1.414-.025Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                )}
                {active && (
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#b4191e]">
                    <span className="h-2 w-2 rounded-full bg-white" />
                  </span>
                )}
                {!done && !active && (
                  <span className="h-6 w-6 flex-shrink-0 rounded-full border-2 border-black/15 bg-white" />
                )}

                <span className="w-14 text-xs tabular-nums text-[#8a8a8a]">
                  {timeLabel}
                </span>
                <span
                  className={[
                    'flex-1 text-sm',
                    done && 'text-[#066731]',
                    active && 'font-semibold text-[#b4191e]',
                    !done && !active && 'text-[#8a8a8a]',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {text}
                </span>
              </li>
            );
          })}
        </ol>
      </section>

      {/* Detalle del pedido */}
      <section className="card">
        <h2 className="card-section-title">Pedido de {order.cliente}</h2>
        <ul className="divide-y divide-black/5">
          {items.map((it, i) => (
            <li key={i} className="flex gap-3 py-2 text-sm">
              <span className="flex-1 text-[#1f1f1f]">{it.product}</span>
              {it.price && (
                <span className="font-mono tabular-nums text-[#5a5a5a]">{it.price}</span>
              )}
            </li>
          ))}
          {hasDelivery && (
            <>
              <li className="flex gap-3 py-2 text-sm text-[#5a5a5a]">
                <span className="flex-1">Subtotal</span>
                <span className="font-mono tabular-nums">{formatGs(order.total)}</span>
              </li>
              <li className="flex gap-3 py-2 text-sm text-[#5a5a5a]">
                <span className="flex-1">Delivery 🏍️</span>
                <span className="font-mono tabular-nums">
                  {formatGs(order.deliveryFee!)}
                </span>
              </li>
            </>
          )}
          <li className="mt-1 flex gap-3 border-t border-black/10 pt-3 text-base font-bold text-[#1f1f1f]">
            <span className="flex-1">Total</span>
            <span className="font-mono tabular-nums">{formatGs(grandTotal)}</span>
          </li>
        </ul>
      </section>

      {controls}
    </main>
  );
}
