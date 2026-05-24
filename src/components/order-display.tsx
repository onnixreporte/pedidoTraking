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
      <h1 className="text-center text-lg font-semibold">Estado del Pedido</h1>

      <section className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={LOGO_SRC}
          alt="Café de Acá"
          className="h-12 w-12 rounded-xl object-cover"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">Café de Acá</p>
          <p className="truncate text-sm text-gray-500">{order.direccion}</p>
        </div>
      </section>

      <section
        className={[
          'flex items-start gap-2 rounded-2xl px-3 py-3 text-sm',
          isCancelled ? 'bg-red-50' : 'bg-blue-50',
        ].join(' ')}
      >
        <svg
          className={[
            'mt-0.5 h-5 w-5 flex-shrink-0',
            isCancelled ? 'text-red-600' : 'text-blue-600',
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
        <p className={isCancelled ? 'font-medium text-red-900' : 'font-medium text-blue-900'}>
          {STATUS_BANNER[order.status as Status]}
        </p>
      </section>

      {showTimeRange && (
        <section className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={LOGO_SRC}
            alt=""
            className="h-12 w-12 rounded-xl object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="text-lg font-semibold">
              {formatTimeRange(rangeAnchor, order.estimatedMinutes!)}
            </p>
            <p className="text-sm text-gray-500">Hora estimada de entrega</p>
          </div>
        </section>
      )}

      {!isCancelled && (
        <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <StateStepper current={order.status as Status} />
        </section>
      )}

      <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <p className="mb-3 text-center text-base font-semibold">
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
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-500 text-white">
                    <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                      <path
                        fillRule="evenodd"
                        d="M16.704 5.29a1 1 0 0 1 .006 1.415l-7.5 7.55a1 1 0 0 1-1.42 0L3.29 9.755a1 1 0 1 1 1.42-1.41l3.79 3.81 6.79-6.84a1 1 0 0 1 1.414-.025Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                )}
                {active && (
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-pink-600">
                    <span className="h-2 w-2 rounded-full bg-white" />
                  </span>
                )}
                {!done && !active && (
                  <span className="h-6 w-6 flex-shrink-0 rounded-full border-2 border-gray-300 bg-white" />
                )}

                <span className="w-14 text-xs tabular-nums text-gray-500">
                  {timeLabel}
                </span>
                <span
                  className={[
                    'flex-1 text-sm',
                    done && 'text-green-600',
                    active && 'font-semibold text-pink-600',
                    !done && !active && 'text-gray-400',
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

      <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-600">
          Pedido de {order.cliente}
        </h2>
        <ul className="divide-y divide-gray-100">
          {items.map((it, i) => (
            <li key={i} className="flex gap-3 py-2 text-sm">
              <span className="flex-1">{it.product}</span>
              {it.price && (
                <span className="text-right font-mono tabular-nums text-gray-700">
                  {it.price}
                </span>
              )}
            </li>
          ))}
          {hasDelivery && (
            <>
              <li className="flex gap-3 py-2 text-sm text-gray-600">
                <span className="flex-1">Subtotal</span>
                <span className="text-right font-mono tabular-nums">
                  {formatGs(order.total)}
                </span>
              </li>
              <li className="flex gap-3 py-2 text-sm text-gray-600">
                <span className="flex-1">Delivery 🏍️</span>
                <span className="text-right font-mono tabular-nums">
                  {formatGs(order.deliveryFee!)}
                </span>
              </li>
            </>
          )}
          <li className="flex gap-3 pt-3 text-base font-semibold">
            <span className="flex-1">Total</span>
            <span className="text-right font-mono tabular-nums">
              {formatGs(grandTotal)}
            </span>
          </li>
        </ul>
      </section>

      {controls}
    </main>
  );
}
