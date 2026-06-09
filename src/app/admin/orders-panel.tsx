'use client';

import { useEffect, useMemo, useState } from 'react';
import { useVisiblePoll } from '@/hooks/use-visible-poll';
import { formatGs, formatTime } from '@/lib/format';
import type { OrderAdminDto } from '@/lib/dto';
import { STATUSES, STATUS_LABELS, type Status } from '@/lib/status';
import { SUCURSAL_LABELS, type Sucursal } from '@/lib/sucursales';
import { OrderTypeBadge } from '@/components/order-type-badge';
import { OrderDetailDrawer, type DrawerFocus } from './order-detail-drawer';
import { RepartidorHandoffModal } from './repartidor-handoff-modal';
import { NewOrderModal } from './new-order-modal';

// Siguiente paso por estado para cada tipo de pedido. El quick-action de la card
// usa este mapa según order.orderType.
const NEXT_STEP_DELIVERY: Partial<Record<Status, { next: Status; label: string }>> = {
  ENVIADO_AL_NEGOCIO: { next: 'ACEPTADO', label: 'Aceptar' },
  ACEPTADO: { next: 'REPARTIDOR_EN_CAMINO', label: 'Pasar al repartidor' },
  REPARTIDOR_EN_CAMINO: { next: 'ENTREGADO', label: 'Marcar entregado' },
};

const NEXT_STEP_RETIRO: Partial<Record<Status, { next: Status; label: string }>> = {
  ENVIADO_AL_NEGOCIO: { next: 'ACEPTADO', label: 'Aceptar' },
  ACEPTADO: { next: 'PREPARANDO', label: 'Empezar a preparar' },
  PREPARANDO: { next: 'PUEDE_PASAR_A_RETIRAR', label: 'Marcar listo para retirar' },
  PUEDE_PASAR_A_RETIRAR: { next: 'ENTREGADO', label: 'Marcar entregado' },
};

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

type ListResponse = {
  items: OrderAdminDto[];
  total: number;
  counts?: Record<FilterStatus, number>;
};

const EMPTY_COUNTS: Record<FilterStatus, number> = {
  ALL: 0,
  ENVIADO_AL_NEGOCIO: 0,
  ACEPTADO: 0,
  REPARTIDOR_EN_CAMINO: 0,
  PREPARANDO: 0,
  PUEDE_PASAR_A_RETIRAR: 0,
  ENTREGADO: 0,
  CANCELADO: 0,
};

const STATUS_BADGE: Record<Status, string> = {
  ENVIADO_AL_NEGOCIO: 'bg-[#b4191e]/10 text-[#b4191e]',
  ACEPTADO: 'bg-blue-100 text-blue-800',
  REPARTIDOR_EN_CAMINO: 'bg-amber-100 text-amber-800',
  PREPARANDO: 'bg-blue-100 text-blue-800',
  PUEDE_PASAR_A_RETIRAR: 'bg-amber-100 text-amber-800',
  ENTREGADO: 'bg-[#066731]/12 text-[#066731]',
  CANCELADO: 'bg-gray-200 text-gray-600',
};

const STATUS_BORDER: Record<Status, string> = {
  ENVIADO_AL_NEGOCIO: 'border-l-[#b4191e]',
  ACEPTADO: 'border-l-blue-500',
  REPARTIDOR_EN_CAMINO: 'border-l-amber-500',
  PREPARANDO: 'border-l-blue-500',
  PUEDE_PASAR_A_RETIRAR: 'border-l-amber-500',
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

export function OrdersPanel({ initial }: { initial: OrderAdminDto[] }) {
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('ALL');
  const [dateRange, setDateRange] = useState<DateRange>('today');
  const [fromDate, setFromDate] = useState<string>(todayIso());
  const [toDate, setToDate] = useState<string>(todayIso());
  const [activeOnly, setActiveOnly] = useState(false);
  const [sort, setSort] = useState<SortOrder>('desc');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerFocus, setDrawerFocus] = useState<DrawerFocus>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [advancingId, setAdvancingId] = useState<string | null>(null);
  const [handoffOrder, setHandoffOrder] = useState<OrderAdminDto | null>(null);
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [fetchTrigger, setFetchTrigger] = useState(0);

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
    if (fetchTrigger > 0) params.set('_t', String(fetchTrigger));
    return `/api/orders?${params.toString()}`;
  }, [statusFilter, activeOnly, search, dateRange, fromDate, toDate, sort, fetchTrigger]);

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

  // counts vienen del servidor (groupBy ignorando filtro de status).
  // Fallback a 0 si el fetch inicial todavia no llego.
  const counts = data.counts ?? EMPTY_COUNTS;

  function patched(order: OrderAdminDto) {
    // Detectar transición a REPARTIDOR_EN_CAMINO para disparar el handoff modal
    const previous = data.items.find((o) => o.id === order.id);
    const justWentToRepartidor =
      previous &&
      previous.status !== 'REPARTIDOR_EN_CAMINO' &&
      order.status === 'REPARTIDOR_EN_CAMINO';

    setData((prev) => ({
      ...prev,
      items: prev.items.map((o) => (o.id === order.id ? order : o)),
    }));

    if (justWentToRepartidor) {
      setHandoffOrder(order);
    }
  }

  function openDrawer(id: string, focus: DrawerFocus = null) {
    setDrawerFocus(focus);
    setSelectedId(id);
  }

  function closeDrawer() {
    setSelectedId(null);
    setDrawerFocus(null);
  }

  async function advanceOrder(
    orderId: string,
    body: { status: Status; estimatedMinutes?: number; deliveryFee?: number },
  ): Promise<boolean> {
    setAdvancingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const updated = (await res.json()) as OrderAdminDto;
        patched(updated);
        return true;
      }
      const err = await res.json().catch(() => ({}));
      window.alert(err?.message ?? 'No se pudo cambiar el estado');
      return false;
    } finally {
      setAdvancingId(null);
    }
  }

  async function quickCopyLink(order: OrderAdminDto) {
    const url = `${window.location.origin}/t/${order.publicId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(order.id);
      setTimeout(() => setCopiedId((cur) => (cur === order.id ? null : cur)), 1800);
    } catch {
      window.prompt('Copiá manualmente el link:', url);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start justify-between gap-3 sm:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#1f1f1f]">Pedidos</h1>
            <p className="mt-1 text-sm text-[#8a8a8a]">
              {data.items.length} pedido{data.items.length === 1 ? '' : 's'} ·{' '}
              {DATE_RANGE_LABEL[dateRange]}
              {activeOnly && ' · solo activos'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowNewOrder(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#066731] px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#055527] sm:hidden"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 0 1 1 1v5h5a1 1 0 1 1 0 2h-5v5a1 1 0 1 1-2 0v-5H4a1 1 0 1 1 0-2h5V4a1 1 0 0 1 1-1Z"
                clipRule="evenodd"
              />
            </svg>
            Nuevo
          </button>
        </div>
        <div className="flex w-full items-center gap-2 sm:max-w-md">
          <div className="relative flex-1">
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
          <button
            type="button"
            onClick={() => setShowNewOrder(true)}
            className="hidden items-center gap-1.5 rounded-xl bg-[#066731] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#055527] sm:inline-flex"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 0 1 1 1v5h5a1 1 0 1 1 0 2h-5v5a1 1 0 1 1-2 0v-5H4a1 1 0 1 1 0-2h5V4a1 1 0 0 1 1-1Z"
                clipRule="evenodd"
              />
            </svg>
            Nuevo pedido
          </button>
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
          <p className="text-xs text-[#8a8a8a]">Probá cambiar el rango de fecha o quitar filtros</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {data.items.map((o) => (
            <OrderCard
              key={o.id}
              order={o}
              copied={copiedId === o.id}
              advancing={advancingId === o.id}
              onOpen={() => openDrawer(o.id)}
              onAdvance={(body) => advanceOrder(o.id, body)}
              onCopyLink={() => quickCopyLink(o)}
            />
          ))}
        </div>
      )}

      {selected && (
        <OrderDetailDrawer
          order={selected}
          initialFocus={drawerFocus}
          onClose={closeDrawer}
          onPatched={patched}
        />
      )}

      {handoffOrder && (
        <RepartidorHandoffModal order={handoffOrder} onClose={() => setHandoffOrder(null)} />
      )}

      {showNewOrder && (
        <NewOrderModal
          onClose={() => setShowNewOrder(false)}
          onCreated={() => setFetchTrigger((n) => n + 1)}
        />
      )}
    </main>
  );
}

type AdvanceBody = {
  status: Status;
  estimatedMinutes?: number;
  deliveryFee?: number;
};

function OrderCard({
  order,
  copied,
  advancing,
  onOpen,
  onAdvance,
  onCopyLink,
}: {
  order: OrderAdminDto;
  copied: boolean;
  advancing: boolean;
  onOpen: () => void;
  onAdvance: (body: AdvanceBody) => Promise<boolean>;
  onCopyLink: () => void;
}) {
  const hasDelivery = order.deliveryFee != null && order.deliveryFee > 0;
  const isRetiro = order.orderType === 'PASAR_A_RETIRAR';
  const nextStepMap = isRetiro ? NEXT_STEP_RETIRO : NEXT_STEP_DELIVERY;
  const step = nextStepMap[order.status as Status];

  const needsMinutes = step?.next === 'ACEPTADO' && order.estimatedMinutes == null;
  const needsDelivery = step?.next === 'REPARTIDOR_EN_CAMINO' && order.deliveryFee == null;
  const needsData = needsMinutes || needsDelivery;

  const [showForm, setShowForm] = useState(false);
  const [inputValue, setInputValue] = useState('');

  function handleCardClick(e: React.MouseEvent) {
    if ((e.target as HTMLElement).closest('[data-stop-card]')) return;
    onOpen();
  }

  async function handleAdvanceClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (!step) return;

    if (needsData) {
      setInputValue(needsMinutes ? '30' : '');
      setShowForm(true);
      return;
    }

    await onAdvance({ status: step.next });
  }

  async function handleConfirm() {
    if (!step) return;
    if (needsMinutes) {
      const n = parseInt(inputValue.trim(), 10);
      if (!Number.isInteger(n) || n <= 0) {
        window.alert('Ingresá un número entero mayor a 0');
        return;
      }
      const ok = await onAdvance({ status: 'ACEPTADO', estimatedMinutes: n });
      if (ok) setShowForm(false);
    } else if (needsDelivery) {
      const cleaned = inputValue.replace(/[^\d]/g, '');
      const n = parseInt(cleaned, 10);
      if (!Number.isInteger(n) || n < 0) {
        window.alert('Monto inválido');
        return;
      }
      const ok = await onAdvance({ status: 'REPARTIDOR_EN_CAMINO', deliveryFee: n });
      if (ok) setShowForm(false);
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
      className={[
        'card card-hover cursor-pointer border-l-[5px] text-left focus:outline-none focus:ring-2 focus:ring-[#066731]/30',
        STATUS_BORDER[order.status as Status],
      ].join(' ')}
    >
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-[#1f1f1f]">{order.cliente}</p>
          {order.telefono && <p className="truncate text-xs text-[#8a8a8a]">{order.telefono}</p>}
        </div>
        <div className="flex flex-shrink-0 flex-col items-end gap-1">
          <OrderTypeBadge type={order.orderType} variant="compact" />
          <span
            className={[
              'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
              STATUS_BADGE[order.status as Status],
            ].join(' ')}
          >
            {STATUS_LABELS[order.status as Status]}
          </span>
        </div>
      </div>

      <p className="mb-3 truncate text-sm text-[#5a5a5a]">
        {isRetiro
          ? `🏪 ${order.sucursal ? (SUCURSAL_LABELS[order.sucursal as Sucursal] ?? order.sucursal) : 'Retiro'}`
          : (order.direccion ?? 'Sin dirección')}
      </p>

      <div className="flex items-center justify-between text-sm">
        <span className="text-[#8a8a8a]">{formatTime(order.createdAt)}</span>
        <div className="flex items-center gap-1.5">
          {hasDelivery && (
            <span className="rounded-md bg-[#fcf9f2] px-1.5 py-0.5 text-[10px] font-medium text-[#5a5a5a]">
              💰 {formatGs(order.deliveryFee!)}
            </span>
          )}
          <span className="font-mono font-bold tabular-nums text-[#1f1f1f]">
            {formatGs(order.total + (order.deliveryFee ?? 0))}
          </span>
        </div>
      </div>

      {order.additionalNote && (
        <p className="mt-3 line-clamp-2 rounded-md bg-amber-50 px-2 py-1.5 text-xs text-amber-900">
          <span className="font-semibold">💬 Cliente:</span> {order.additionalNote}
        </p>
      )}

      {order.internalNotes && (
        <p className="mt-2 line-clamp-2 rounded-md bg-amber-50 px-2 py-1.5 text-xs text-amber-900">
          <span className="font-semibold">📝 Nota interna:</span> {order.internalNotes}
        </p>
      )}

      {/* Quick actions */}
      <div data-stop-card className="mt-3 flex items-center gap-2 border-t border-black/5 pt-3">
        {step && (
          <button
            type="button"
            onClick={handleAdvanceClick}
            disabled={advancing}
            className="flex-1 rounded-lg bg-[#066731] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#055527] disabled:opacity-50"
          >
            {advancing ? '…' : `${step.label} →`}
          </button>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onCopyLink();
          }}
          title="Copiar link de tracking del cliente"
          className={[
            'flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition',
            copied
              ? 'border-[#066731] bg-[#066731]/10 text-[#066731]'
              : 'border-black/10 bg-white text-[#1f1f1f] hover:bg-[#fcf9f2]',
            !step && 'flex-1 justify-center',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {copied ? '✓ Copiado' : '🔗 Link'}
        </button>
      </div>

      {/* Inline form que se expande debajo del boton de avance */}
      {showForm && step && (
        <div
          data-stop-card
          className="mt-2 rounded-xl border border-[#066731]/30 bg-[#066731]/5 p-3"
        >
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#066731]">
            {needsMinutes ? 'Tiempo estimado (minutos)' : 'Costo de delivery (Gs.)'}
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void handleConfirm();
              }
              if (e.key === 'Escape') setShowForm(false);
            }}
            autoFocus
            placeholder={needsMinutes ? '30' : '15000'}
            disabled={advancing}
            className="input-base mt-1 w-full !py-1.5 text-sm disabled:opacity-50"
          />
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={advancing || !inputValue.trim()}
              className="flex-1 rounded-lg bg-[#066731] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#055527] disabled:opacity-50"
            >
              {advancing ? '…' : `Confirmar ${step.label} →`}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              disabled={advancing}
              className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-medium text-[#1f1f1f] hover:bg-[#fcf9f2] disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
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
    variant === 'date' ? 'bg-[#066731] text-white shadow-sm' : 'bg-[#b4191e] text-white shadow-sm';

  return (
    <button
      onClick={onClick}
      className={[
        'rounded-full px-3.5 py-1.5 text-xs font-medium transition',
        active ? activeClass : 'border border-black/10 bg-white text-[#1f1f1f] hover:bg-[#fcf9f2]',
      ].join(' ')}
    >
      {label}
      {typeof count === 'number' && <span className="ml-1.5 opacity-70">({count})</span>}
    </button>
  );
}
