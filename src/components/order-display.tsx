import { parseDetalle } from '@/lib/parse-detalle';
import { formatGs } from '@/lib/format';
import type { OrderDto } from '@/lib/dto';
import { StateStepper } from './state-stepper';

export function OrderDisplay({
  order,
  controls,
}: {
  order: OrderDto;
  controls?: React.ReactNode;
}) {
  const items = parseDetalle(order.detalle);

  return (
    <main className="mx-auto max-w-md space-y-6 p-4 sm:p-6">
      <div className="flex flex-col items-center text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://www.fiweex.com/sistema/img/logos/thumbnail/c6744fdc9907459976f35253c84964a5.jpeg"
          alt="Café de Acá"
          className="h-20 w-20 rounded-full object-cover shadow-sm"
        />
        <p className="mt-2 text-base font-semibold tracking-wide">
          Café de Acá
        </p>
      </div>

      <header>
        <h1 className="text-2xl font-semibold">Hola {order.cliente} 👋</h1>
        <p className="text-gray-600">
          Gracias por tu orden — envío a domicilio 🏍️
        </p>
      </header>

      <StateStepper current={order.status} />

      <section className="space-y-1 rounded-lg bg-gray-50 p-3 text-sm">
        <div>
          <span className="text-gray-500">Dirección: </span>
          <span className="font-medium">{order.direccion}</span>
        </div>
        {order.estimatedMinutes != null && (
          <div>
            <span className="text-gray-500">Tiempo estimado de entrega: </span>
            <span className="font-medium">{order.estimatedMinutes} min</span>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-600">
          Tu pedido
        </h2>
        <ul className="divide-y divide-gray-200 overflow-hidden rounded-lg border border-gray-200">
          {items.map((it, i) => (
            <li key={i} className="flex gap-3 px-3 py-2 text-sm">
              <span className="flex-1">{it.product}</span>
              {it.price && (
                <span className="text-right font-mono tabular-nums">
                  {it.price}
                </span>
              )}
            </li>
          ))}
          <li className="flex gap-3 bg-gray-50 px-3 py-2 font-semibold">
            <span className="flex-1">Total</span>
            <span className="text-right font-mono tabular-nums">
              {formatGs(order.total)}
            </span>
          </li>
        </ul>
      </section>

      {controls}
    </main>
  );
}
