'use client';

import { useEffect, useMemo, useState } from 'react';
import { useVisiblePoll } from '@/hooks/use-visible-poll';
import { formatGs, formatTime } from '@/lib/format';
import type { OrderAdminDto } from '@/lib/dto';
import { STATUSES, STATUS_LABELS, type Status } from '@/lib/status';
import { OrderDetailDrawer } from './order-detail-drawer';

type FilterStatus = Status | 'ALL';
type DateRange = 'today' | 'yesterday' | 'last7' | 'all';
type SortOrder = 'desc' | 'asc';

type ListResponse = { items: OrderAdminDto[]; total: number };

const STATUS_BADGE: Record<Status, string> = {
  ENVIADO_AL_NEGOCIO: 'bg-gray-100 text-gray-700',
  ACEPTADO: 'bg-blue-100 text-blue-700',
  REPARTIDOR_EN_CAMINO: 'bg-amber-100 text-amber-700',
  ENTREGADO: 'bg-green-100 text-green-700',
  CANCELADO: 'bg-red-100 text-red-700',
};

const STATUS_BORDER: Record<Status, string> = {
  ENVIADO_AL_NEGOCIO: 'border-l-gray-400',
  ACEPTADO: 'border-l-blue-500',
  REPARTIDOR_EN_CAMINO: 'border-l-amber-500',
  ENTREGADO: 'border-l-green-500',
  CANCELADO: 'border-l-red-500',
};

const DATE_RANGE_LABEL: Record<DateRange, string> = {
  today: 'Hoy',
  yesterday: 'Ayer',
  last7: 'Últimos 7 días',
  all: 'Todos',
};

const ACTIVE_STATUSES: Status[] = ['ENVIADO_AL_NEGOCIO', 'ACEPTADO', 'REPARTIDOR_EN_CAMINO'];

export function OrdersPanel({ initial }: { initial: OrderAdminDto[] }) {
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('ALL');
  const [dateRange, setDateRange] = useState<DateRange>('today');
  const [activeOnly, setActiveOnly] = useState(false);
  const [sort, setSort] = useState<SortOrder>('desc');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const url = useMemo(() => {
    const params = new URLSearchParams();
    if (!activeOnly && statusFilter !== 'ALL') params.set('status', statusFilter);
    if (activeOnly) params.set('activeOnly', 'true');
    if (search.trim()) params.set('search', search.trim());
    params.set('dateRange', dateRange);
    params.set('sort', sort);
    params.set('limit', '100');
    return `/api/orders?${params.toString()}`;
  }, [statusFilter, activeOnly, search, dateRange, sort]);

  const initialResponse = useMemo<ListResponse>(
    () => ({ items: initial, total: initial.length }),
    [initial],
  );

  const [data, setData] = useVisiblePoll<ListResponse>(url, initialResponse);

  useEffect(() => {
    if (selectedId && !data.items.find((o) => o.id === selectedId)) {
      setSelectedId(null);
    }
  }, [data.items, selectedId]);

  const selected = data.items.find((o) => o.id === selectedId) ?? null;

  const counts = useMemo(() => {
    const c: Record<FilterStatus, number> = {
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
            {data.items.length} pedido{data.items.length === 1 ? '' : 's'} ·{' '}
            {DATE_RANGE_LABEL[dateRange]}
            {activeOnly && ' · solo activos'}
          </p>
        </div>
        <input
          type="search"
          placeholder="Buscar por cliente, teléfono o dirección…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#066731] focus:ring-2 focus:ring-[#066731]/20 sm:max-w-xs"
        />
      </div>

      {/* Filtros: rango de fecha */}
      <div className="mb-3 flex flex-wrap gap-2">
        {(Object.keys(DATE_RANGE_LABEL) as DateRange[]).map((r) => (
          <Chip
            key={r}
            active={dateRange === r}
            onClick={() => setDateRange(r)}
            label={DATE_RANGE_LABEL[r]}
            variant="date"
          />
        ))}
      </div>

      {/* Toggle activos + orden */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-700">
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={(e) => setActiveOnly(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-[#066731] focus:ring-[#066731]"
          />
          Solo activos
          <span className="text-xs font-normal text-gray-400">
            (solicitud / aceptado / en camino)
          </span>
        </label>

        <div className="flex items-center gap-2 text-sm">
          <label htmlFor="sort" className="text-gray-500">
            Orden:
          </label>
          <select
            id="sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOrder)}
            className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-sm outline-none focus:border-[#066731] focus:ring-2 focus:ring-[#066731]/20"
          >
            <option value="desc">Más recientes primero ↓</option>
            <option value="asc">Más antiguos primero ↑</option>
          </select>
        </div>
      </div>

      {/* Chips por estado (solo si NO está "Solo activos") */}
      {!activeOnly && (
        <div className="mb-4 flex flex-wrap gap-2">
          <Chip
            active={statusFilter === 'ALL'}
            onClick={() => setStatusFilter('ALL')}
            label="Todos"
            count={counts.ALL}
          />
          {STATUSES.map((s) => (
            <Chip
              key={s}
              active={statusFilter === s}
              onClick={() => setStatusFilter(s)}
              label={STATUS_LABELS[s]}
              count={counts[s]}
            />
          ))}
        </div>
      )}

      {/* Cards */}
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
                'group rounded-2xl border border-l-4 border-gray-100 bg-white p-4 text-left shadow-sm transition hover:shadow-md',
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

function Chip({
  active,
  onClick,
  label,
  count,
  variant = 'status',
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count?: number;
  variant?: 'status' | 'date';
}) {
  const activeClass =
    variant === 'date'
      ? 'bg-[#066731] text-white shadow-sm'
      : 'bg-[#b4191e] text-white shadow-sm';

  return (
    <button
      onClick={onClick}
      className={[
        'rounded-full px-3 py-1.5 text-xs font-medium transition',
        active ? activeClass : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50',
      ].join(' ')}
    >
      {label}
      {typeof count === 'number' && <span className="ml-1 opacity-70">({count})</span>}
    </button>
  );
}
