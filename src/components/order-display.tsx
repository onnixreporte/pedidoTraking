import { parseDetalle } from '@/lib/parse-detalle';
import { formatGs, formatTime, formatTimeRange } from '@/lib/format';
import type { OrderPublicDto } from '@/lib/dto';
import {
  stepperStatusesFor,
  STATUS_BANNER,
  STATUS_TIMELINE_DONE,
  STATUS_TIMELINE_FUTURE,
  STATUS_TITLE,
  type Status,
} from '@/lib/status';
import { SUCURSAL_LABELS, type Sucursal } from '@/lib/sucursales';
import { OrderTypeBadge } from './order-type-badge';
import { StateStepper } from './state-stepper';

const LOGO_SRC =
  'https://www.fiweex.com/sistema/img/logos/thumbnail/c6744fdc9907459976f35253c84964a5.jpeg';

function sucursalLabelOf(order: OrderPublicDto): string {
  if (!order.sucursal) return '';
  return SUCURSAL_LABELS[order.sucursal as Sucursal] ?? order.sucursal;
}

function fechaCorta(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('es-PY', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

/**
 * Subtítulo del bloque de retiro: combina fechaRetiro + horaRetiro + coletilla de aviso.
 * Si faltan fecha Y hora, devuelve '' y el subtítulo no se renderiza (R19/R23: en vista
 * cliente el opcional ausente se omite, no se muestra "No completado").
 */
function retiroSubtitulo(order: OrderPublicDto): string {
  const fecha = order.fechaRetiro ? fechaCorta(order.fechaRetiro) : '';
  const hora = order.horaRetiro ?? '';

  let base = '';
  if (fecha && hora) base = `${fecha} a las ${hora}`;
  else if (fecha) base = fecha;
  else if (hora) base = `a las ${hora}`;

  if (!base) return '';

  if (order.avisoCliente === true) base += ' · te avisamos';
  else if (order.avisoCliente === false) base += ' · retiro sin aviso previo';

  return base;
}

function StatusIcon({ status }: { status: Status }) {
  // Iconos por estado para la "pill" inferior del bloque principal
  switch (status) {
    case 'REPARTIDOR_EN_CAMINO':
      return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M3 6.75A2.75 2.75 0 0 1 5.75 4h7.5A2.75 2.75 0 0 1 16 6.75V8h2.382a2 2 0 0 1 1.788 1.106l1.618 3.236A2 2 0 0 1 22 13.236V17a2 2 0 0 1-2 2h-.535a2.5 2.5 0 0 1-4.93 0H9.465a2.5 2.5 0 0 1-4.93 0H4a1 1 0 0 1-1-1V6.75ZM5 17h.535a2.5 2.5 0 0 1 4.93 0h3.535V6.75A.75.75 0 0 0 13.25 6h-7.5a.75.75 0 0 0-.75.75V17Zm11 0h.535a2.5 2.5 0 0 1 4.93 0H20v-3.764L18.382 10H16v7Z" />
        </svg>
      );
    case 'PUEDE_PASAR_A_RETIRAR':
      return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M4 4h16a1 1 0 0 1 1 1v3a3 3 0 0 1-2 2.83V19a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-8.17A3 3 0 0 1 3 8V5a1 1 0 0 1 1-1Zm3 6.83V18h10v-7.17a3.01 3.01 0 0 1-2-1.16 3 3 0 0 1-5 0 3.01 3.01 0 0 1-3 1.16Z" />
        </svg>
      );
    case 'PREPARANDO':
    case 'ACEPTADO':
      return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12.5 3a8.5 8.5 0 1 1-.001 17.001A8.5 8.5 0 0 1 12.5 3Zm-.5 4a1 1 0 0 0-1 1v4.586l-1.293 1.293a1 1 0 0 0 1.414 1.414l1.586-1.586A1 1 0 0 0 13 13V8a1 1 0 0 0-1-1Z" />
        </svg>
      );
    case 'ENTREGADO':
      return (
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
          <path
            fillRule="evenodd"
            d="M16.704 5.29a1 1 0 0 1 .006 1.415l-7.5 7.55a1 1 0 0 1-1.42 0L3.29 9.755a1 1 0 1 1 1.42-1.41l3.79 3.81 6.79-6.84a1 1 0 0 1 1.414-.025Z"
            clipRule="evenodd"
          />
        </svg>
      );
    case 'CANCELADO':
      return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm-5 9h10v2H7v-2Z" />
        </svg>
      );
    default:
      return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 5v6h5v2h-7V7h2Z" />
        </svg>
      );
  }
}

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
  const isDelivered = order.status === 'ENTREGADO';
  const isRetiro = order.orderType === 'PASAR_A_RETIRAR';

  const steps = stepperStatusesFor(order.orderType);
  const currentIdx = steps.indexOf(order.status as (typeof steps)[number]);
  const showTimeRange =
    !isCancelled &&
    !isRetiro &&
    order.estimatedMinutes != null &&
    currentIdx >= steps.indexOf('ACEPTADO');
  const rangeAnchor = order.acceptedAt ?? order.createdAt;

  // Timestamp por paso, cubre ambos flows (los pasos del otro tipo simplemente no aparecen).
  const stepTime: Record<Status, string | null> = {
    ENVIADO_AL_NEGOCIO: order.createdAt,
    ACEPTADO: order.acceptedAt,
    REPARTIDOR_EN_CAMINO: order.pickupAt,
    PREPARANDO: order.preparingAt,
    PUEDE_PASAR_A_RETIRAR: order.readyAt,
    ENTREGADO: order.deliveredAt,
    CANCELADO: order.cancelledAt,
  };

  const accentColor = isCancelled ? '#b4191e' : '#066731';
  const subtitulo = isRetiro ? retiroSubtitulo(order) : '';
  const sucursal = sucursalLabelOf(order);

  return (
    <main className="mx-auto max-w-md">
      {/* Sticky brand header */}
      <header className="sticky top-0 z-20 border-b border-black/5 bg-[#fcf9f2]/90 backdrop-blur-md">
        <div className="flex items-center justify-center gap-2 px-4 py-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={LOGO_SRC}
            alt="Café de Acá"
            className="h-8 w-8 rounded-full object-cover ring-1 ring-black/5"
          />
          <span className="text-lg font-bold tracking-tight text-[#066731]">Café de Acá</span>
        </div>

        {/* Dirección con pin (delivery) o sucursal (retiro) */}
        <div className="flex items-center justify-center gap-2 border-t border-black/5 px-4 py-2.5 text-sm text-[#5a5a5a]">
          {isRetiro ? (
            <span className="truncate">🏪 {sucursal || 'Retiro en el local'}</span>
          ) : (
            <>
              <svg
                className="h-4 w-4 flex-shrink-0 text-[#5a5a5a]"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden
              >
                <path
                  fillRule="evenodd"
                  d="M12 2C7.589 2 4 5.589 4 10c0 5.6 7.2 11.4 7.5 11.65a.75.75 0 0 0 1 0C12.8 21.4 20 15.6 20 10c0-4.411-3.589-8-8-8Zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="truncate">{order.direccion ?? 'Sin dirección'}</span>
            </>
          )}
        </div>
      </header>

      <div className="space-y-4 p-4 sm:p-6">
        {/* Bloque principal: hora + banner + pill */}
        <section
          className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-[var(--shadow-card)]"
          style={{ borderTop: `4px solid ${accentColor}` }}
        >
          <div className="flex flex-col items-center px-5 py-7 text-center">
            {isRetiro && !isCancelled ? (
              <>
                <OrderTypeBadge type={order.orderType} variant="prominent" />
                <p
                  className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl"
                  style={{ color: accentColor }}
                >
                  {sucursal || 'Tu pedido'}
                </p>
                {subtitulo && <p className="mt-2 text-sm text-[#5a5a5a]">{subtitulo}</p>}
                <p className="mt-3 text-base font-semibold leading-snug text-[#1f1f1f] sm:text-lg">
                  {STATUS_BANNER[order.status as Status]}
                </p>
              </>
            ) : showTimeRange ? (
              <>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8a8a8a]">
                  Hora estimada de entrega
                </p>
                <p
                  className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl"
                  style={{ color: accentColor }}
                >
                  {formatTimeRange(rangeAnchor, order.estimatedMinutes!)}
                </p>
                <p className="mt-3 text-base font-semibold leading-snug text-[#1f1f1f] sm:text-lg">
                  {STATUS_BANNER[order.status as Status]}
                </p>
              </>
            ) : (
              <p className="text-lg font-semibold leading-snug text-[#1f1f1f] sm:text-xl">
                {STATUS_BANNER[order.status as Status]}
              </p>
            )}

            <div
              className="mt-5 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
              style={{
                backgroundColor: `${accentColor}14`,
                color: accentColor,
                border: `1px solid ${accentColor}33`,
              }}
            >
              <StatusIcon status={order.status as Status} />
              {STATUS_TITLE[order.status as Status]}
            </div>
          </div>
        </section>

        {/* Stepper horizontal */}
        {!isCancelled && (
          <section className="card">
            <StateStepper current={order.status as Status} orderType={order.orderType} />
          </section>
        )}

        {/* Timeline vertical */}
        <section className="card">
          <ol className="space-y-3">
            {steps.map((s, i) => {
              const done = isDelivered ? i <= currentIdx : i < currentIdx;
              const active = !isDelivered && i === currentIdx;
              const ts = stepTime[s];
              const timeLabel = ts ? formatTime(ts) : '';
              const text = done || active ? STATUS_TIMELINE_DONE[s] : STATUS_TIMELINE_FUTURE[s];

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

                  <span className="w-14 text-xs tabular-nums text-[#8a8a8a]">{timeLabel}</span>
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

        {/* Nota adicional del cliente */}
        {order.additionalNote && (
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-amber-700">
              Nota especial
            </h3>
            <p className="text-sm text-amber-900">{order.additionalNote}</p>
          </section>
        )}

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
                  <span className="font-mono tabular-nums">{formatGs(order.deliveryFee!)}</span>
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
      </div>
    </main>
  );
}
