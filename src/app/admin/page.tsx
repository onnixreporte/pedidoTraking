'use client';

import { useState } from 'react';
import { StatusFilter } from '@/components/admin/status-filter';
import { OrderCard } from '@/components/admin/order-card';
import { MOCK_ORDERS } from '@/lib/mock-orders';
import type { Status } from '@/lib/status';

type FilterOption = Status | 'TODOS';

const EMPTY_COUNTS: Record<FilterOption, number> = {
  TODOS: 0,
  ENVIADO_AL_NEGOCIO: 0,
  ACEPTADO: 0,
  REPARTIDOR_EN_CAMINO: 0,
  ENTREGADO: 0,
};

function countByStatus(orders: typeof MOCK_ORDERS): Record<FilterOption, number> {
  const counts = { ...EMPTY_COUNTS };
  counts.TODOS = orders.length;
  for (const o of orders) counts[o.status as Status]++;
  return counts;
}

export default function AdminDashboard() {
  const [filter, setFilter] = useState<FilterOption>('TODOS');
  const counts = countByStatus(MOCK_ORDERS);

  const filtered =
    filter === 'TODOS'
      ? MOCK_ORDERS
      : MOCK_ORDERS.filter((o) => o.status === filter);

  return (
    <main className="mx-auto max-w-md space-y-6 p-4 sm:p-6">
      <div className="flex flex-col items-center text-center">
        <img
          src="https://www.fiweex.com/sistema/img/logos/thumbnail/c6744fdc9907459976f35253c84964a5.jpeg"
          alt="Café de Acá"
          className="h-20 w-20 rounded-full object-cover shadow-sm"
        />
        <p className="mt-2 text-base font-semibold tracking-wide">Café de Acá</p>
      </div>

      <div>
        <h1 className="mb-4 text-2xl font-semibold">Panel de Pedidos</h1>
        <StatusFilter active={filter} onChange={setFilter} counts={counts} />
      </div>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-gray-400">Sin pedidos en este estado</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((order, i) => (
            <OrderCard key={i} order={order} />
          ))}
        </div>
      )}
    </main>
  );
}