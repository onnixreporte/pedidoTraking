'use client';

import { useEffect, useMemo, useState } from 'react';
import { useVisiblePoll } from '@/hooks/use-visible-poll';
import { formatGs, formatTime } from '@/lib/format';
import type { OrderAdminDto } from '@/lib/dto';
import { STATUSES, STATUS_LABELS, type Status } from '@/lib/status';
import { OrderDetailDrawer } from './order-detail-drawer';

type FilterStatus = Status | 'ALL';
type DateRange = 'today' | 'yesterday' | 'last7' | 'all' | 'custom';
type SortOrder = 'desc' | 'asc';

function todayIso(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

type ListResponse = { items: OrderAdminDto[]; total: number };

const STATUS_BADGE: Record<Status, string> = {
  ENVIADO_AL_NEGOCIO: 'bg-[#b4191e]/10 text-[#b4191e]',
  ACEPTADO: 'bg-blue-100 text-blue-800',
  REPARTIDOR_EN_CAMINO: 'bg-amber-100 text-amber-800',
  ENTREGADO: 'bg-[#066731]/12 text-[#066731]',
  CANCELADO: 'bg-gray-200 text-gray-600',
};

const STATUS_BORDER: Record<Status, string> = {
  ENVIADO_AL_NEGOCIO: 'border-l-[#b4191e]',
  ACEPTADO: 'border-l-blue-500',
  REPARTIDOR_EN_CAMINO: 'border-l-amber-500',
  ENTREGADO: 'border-l-[#066731]',
  CANCELADO: 'border-l-gray-400',
};

const DATE_RANGE_LABEL: Record<DateRange, string> = {
  today: 'Hoy',
  yesterday: 'Ayer',
  last7: 'Últimos 7 días',
  all: 'Todos',
  custom: 'Personalizado',
};

const QUICK_RANGES: readonly DateRange[] = ['today', 'yesterday', 'last7', 'all'] as const;

function isoOffset(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function presetDates(range: DateRange): { from: string; to: string } {
  const today = isoOffset(0);
  switch (range) {
    case 'today':
      return { from: today, to: today };
    case 'yesterday': {
      const y = isoOffset(1);
      return { from: y, to: y };
    }
    case 'last7':
      return { from: isoOffset(6), to: today };
    case 'all':
      return { from: '', to: '' };
    case 'custom':
    default:
      return { from: today, to: today };
  }
}

const ACTIVE_STATUSES: Status[] = ['ENVIADO_AL_NEGOCIO', 'ACEPTADO', 'REPARTIDOR_EN_CAMINO'];

export function OrdersPanel({ initial }: { initial: OrderAdminDto[] }) {
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('ALL');
  const [dateRange, setDateRange] = useState<DateRange>('today');
  const [fromDate, setFromDate] = useState<string>(todayIso());
  const [toDate, setToDate] = useState<string>(todayIso());
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
    if (dateRange === 'custom') {
      if (fromDate) params.set('from', fromDate);
      if (toDate) params.set('to', toDate);
    }
    params.set('sort', sort);
    params.set('limit', '100');
    return `/api/orders?${params.toString()}`;
  }, [statusFilter, activeOnly, search, dateRange, fromDate, toDate, sort]);

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
          <h1 className="text-3xl font-bold tracking-tight text-[#1f1f1f]">Pedidos</h1>
          <p className="mt-1 text-sm text-[#8a8a8a]">
            {data.items.length} pedido{data.items.length === 1 ? '' : 's'} ·{' '}
            {DATE_RANGE_LABEL[dateRange]}
            {activeOnly && ' · solo activos'}
          </p>
        </div>
        <div className="relative w-full sm:max-w-xs">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a8a8a]"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden
          >
            <path
              fillRule="evenodd"
              d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z"
              clipRule="evenodd"
            />
          </svg>
          <input
            type="search"
            placeholder="Buscar por cliente, teléfono o dirección…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-base w-full pl-9"
          />
        </div>
      </div>

      {/* Filtros: rango de fecha (chips rápidos) */}
      <div className="mb-3 flex flex-wrap gap-2">
        {QUICK_RANGES.map((r) => (
          <Chip
            key={r}
            active={dateRange === r}
            onClick={() => {
              setDateRange(r);
              const preset = presetDates(r);
              setFromDate(preset.from);
              setToDate(preset.to);
            }}
            label={DATE_RANGE_LABEL[r]}
            variant="date"
          />
        ))}
        {dateRange === 'custom' && (
          <span className="self-center rounded-full bg-[#066731]/10 px-3 py-1 text-xs font-medium text-[#066731]">
            Rango personalizado
          </span>
        )}
      </div>

      {/* Inputs de rango (siempre visibles) */}
      <div className="mb-3 flex flex-wrap items-center gap-3 rounded-2xl border border-black/5 bg-white p-3 shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-2">
          <label htmlFor="from" className="text-xs font-medium text-[#5a5a5a]">
            Desde
          </label>
          <input
            id="from"
            type="date"
            value={fromDate}
            max={toDate || undefined}
            onChange={(e) => {
              setFromDate(e.target.value);
              setDateRange('custom');
            }}
            className="input-base !py-1.5 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="to" className="text-xs font-medium text-[#5a5a5a]">
            Hasta
          </label>
          <input
            id="to"
            type="date"
            value={toDate}
            min={fromDate || undefined}
            max={todayIso()}
            onChange={(e) => {
              setToDate(e.target.value);
              setDateRange('custom');
            }}
            className="input-base !py-1.5 text-sm"
          />
        </div>
      </div>

      {/* Solo activos + orden */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-[#1f1f1f]">
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={(e) => setActiveOnly(e.target.checked)}
            className="h-4 w-4 rounded border-black/20 text-[#066731] focus:ring-[#066731]"
          />
          Solo activos
          <span className="text-xs font-normal text-[#8a8a8a]">
            (solicitud / aceptado / en camino)
          </span>
        </label>

        <div className="flex items-center gap-2 text-sm">
          <label htmlFor="sort" className="text-[#5a5a5a]">
            Orden:
          </label>
          <select
            id="sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOrder)}
            className="input-base !py-1.5"
          >
            <option value="desc">Más recientes primero ↓</option>
            <option value="asc">Más antiguos primero ↑</option>
          </select>
        </div>
      </div>

      {/* Chips por estado (solo si NO está "Solo activos") */}
      {!activeOnly && (
        <div className="mb-6 flex flex-wrap gap-2">
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
        <div className="card flex flex-col items-center gap-3 border-dashed py-16 text-center">
          <div className="text-4xl opacity-30">🍽️</div>
          <p className="text-sm font-medium text-[#5a5a5a]">Sin pedidos en este filtro</p>
          <p className="text-xs text-[#8a8a8a]">
            Probá cambiar el rango de fecha o quitar filtros
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {data.items.map((o) => (
            <OrderCard
              key={o.id}
              order={o}
              onClick={() => setSelectedId(o.id)}
            />
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

function OrderCard({
  order,
  onClick,
}: {
  order: OrderAdminDto;
  onClick: () => void;
}) {
  const hasDelivery = order.deliveryFee != null && order.deliveryFee > 0;

  return (
    <button
      onClick={onClick}
      className={[
        'card card-hover border-l-[5px] text-left',
        STATUS_BORDER[order.status as Status],
      ].join(' ')}
    >
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-[#1f1f1f]">{order.cliente}</p>
          {order.telefono && (
            <p className="truncate text-xs text-[#8a8a8a]">{order.telefono}</p>
          )}
        </div>
        <span
          className={[
            'flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
            STATUS_BADGE[order.status as Status],
          ].join(' ')}
        >
          {STATUS_LABELS[order.status as Status]}
        </span>
      </div>

      <p className="mb-3 truncate text-sm text-[#5a5a5a]">{order.direccion}</p>

      <div className="flex items-center justify-between text-sm">
        <span className="text-[#8a8a8a]">{formatTime(order.createdAt)}</span>
        <div className="flex items-center gap-1.5">
          {hasDelivery && (
            <span className="rounded-md bg-[#fcf9f2] px-1.5 py-0.5 text-[10px] font-medium text-[#5a5a5a]">
              🏍️ delivery
            </span>
          )}
          <span className="font-mono font-bold tabular-nums text-[#1f1f1f]">
            {formatGs(order.total + (order.deliveryFee ?? 0))}
          </span>
        </div>
      </div>

      {order.internalNotes && (
        <p className="mt-3 line-clamp-2 rounded-md bg-amber-50 px-2 py-1.5 text-xs text-amber-900">
          <span className="font-semibold">📝 Nota:</span> {order.internalNotes}
        </p>
      )}
    </button>
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
        'rounded-full px-3.5 py-1.5 text-xs font-medium transition',
        active
          ? activeClass
          : 'border border-black/10 bg-white text-[#1f1f1f] hover:bg-[#fcf9f2]',
      ].join(' ')}
    >
      {label}
      {typeof count === 'number' && (
        <span className="ml-1.5 opacity-70">({count})</span>
      )}
    </button>
  );
}
