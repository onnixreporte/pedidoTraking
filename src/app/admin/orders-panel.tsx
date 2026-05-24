'use client';

import { useEffect, useMemo, useState } from 'react';
import { useVisiblePoll } from '@/hooks/use-visible-poll';
import { formatGs, formatTime } from '@/lib/format';
import type { OrderAdminDto } from '@/lib/dto';
import { STATUSES, STATUS_LABELS, type Status } from '@/lib/status';
import { OrderDetailDrawer } from './order-detail-drawer';

type FilterOption = Status | 'ALL';

type ListResponse = { items: OrderAdminDto[]; total: number };

const STATUS_BADGE: Record<Status, string> = {
  ENVIADO_AL_NEGOCIO: 'bg-gray-100 text-gray-700',
  ACEPTADO: 'bg-blue-100 text-blue-700',
  REPARTIDOR_EN_CAMINO: 'bg-amber-100 text-amber-700',
  ENTREGADO: 'bg-green-100 text-green-700',
  CANCELADO: 'bg-red-100 text-red-700',
};

const STATUS_BORDER: Record<Status, string> = {
  ENVIADO_AL_NEGOCIO: 'border-gray-300',
  ACEPTADO: 'border-blue-300',
  REPARTIDOR_EN_CAMINO: 'border-amber-300',
  ENTREGADO: 'border-green-300',
  CANCELADO: 'border-red-300',
};

export function OrdersPanel({ initial }: { initial: OrderAdminDto[] }) {
  const [filter, setFilter] = useState<FilterOption>('ALL');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const url = useMemo(() => {
    const params = new URLSearchParams();
    if (filter !== 'ALL') params.set('status', filter);
    if (search.trim()) params.set('search', search.trim());
    params.set('limit', '100');
    return `/api/orders?${params.toString()}`;
  }, [filter, search]);

  const initialResponse = useMemo<ListResponse>(
    () => ({ items: initial, total: initial.length }),
    [initial],
  );

  const [data, setData] = useVisiblePoll<ListResponse>(url, initialResponse);

  // Reset selection if it's no longer in the list
  useEffect(() => {
    if (selectedId && !data.items.find((o) => o.id === selectedId)) {
      setSelectedId(null);
    }
  }, [data.items, selectedId]);

  const selected = data.items.find((o) => o.id === selectedId) ?? null;

  const counts = useMemo(() => {
    const c: Record<FilterOption, number> = {
      ALL: data.items.length,
      ENVIADO_AL_NEGOCIO: 0,
      ACEPTADO: 0,
      REPARTIDOR_EN_CAMINO: 0,
      ENTREGADO: 0,
      CANCELADO: 0,
    };
    for (const o of data.items) c[o.status as Status]++;
    return c;
  }, [data.items]);

  function patched(order: OrderAdminDto) {
    setData((prev) => ({
      ...prev,
      items: prev.items.map((o) => (o.id === order.id ? order : o)),
    }));
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Pedidos</h1>
          <p className="text-sm text-gray-500">
            {data.items.length} pedido{data.items.length === 1 ? '' : 's'} en pantalla
          </p>
        </div>
        <input
          type="search"
          placeholder="Buscar por cliente, teléfono o dirección…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100 sm:max-w-xs"
        />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <FilterChip
          active={filter === 'ALL'}
          onClick={() => setFilter('ALL')}
          label="Todos"
          count={counts.ALL}
        />
        {STATUSES.map((s) => (
          <FilterChip
            key={s}
            active={filter === s}
            onClick={() => setFilter(s)}
            label={STATUS_LABELS[s]}
            count={counts[s]}
          />
        ))}
      </div>

      {data.items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-gray-300 bg-white py-12 text-center text-sm text-gray-400">
          Sin pedidos en este filtro
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {data.items.map((o) => (
            <button
              key={o.id}
              onClick={() => setSelectedId(o.id)}
              className={[
                'group rounded-2xl border-l-4 border border-gray-100 bg-white p-4 text-left shadow-sm transition hover:shadow-md',
                STATUS_BORDER[o.status as Status],
              ].join(' ')}
            >
              <div className="mb-2 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{o.cliente}</p>
                  {o.telefono && (
                    <p className="truncate text-xs text-gray-500">{o.telefono}</p>
                  )}
                </div>
                <span
                  className={[
                    'flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                    STATUS_BADGE[o.status as Status],
                  ].join(' ')}
                >
                  {STATUS_LABELS[o.status as Status]}
                </span>
              </div>
              <p className="mb-3 truncate text-sm text-gray-600">{o.direccion}</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">{formatTime(o.createdAt)}</span>
                <span className="font-mono font-semibold tabular-nums">
                  {formatGs(o.total + (o.deliveryFee ?? 0))}
                </span>
              </div>
              {o.internalNotes && (
                <p className="mt-2 truncate rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-800">
                  📝 {o.internalNotes}
                </p>
              )}
            </button>
          ))}
        </div>
      )}

      {selected && (
        <OrderDetailDrawer
          order={selected}
          onClose={() => setSelectedId(null)}
          onPatched={patched}
        />
      )}
    </main>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'rounded-full px-3 py-1.5 text-xs font-medium transition',
        active
          ? 'bg-pink-600 text-white shadow-sm'
          : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50',
      ].join(' ')}
    >
      {label} <span className="ml-1 opacity-70">({count})</span>
    </button>
  );
}
