'use client';

import { useEffect, useState } from 'react';
import { parseDetalle } from '@/lib/parse-detalle';
import { formatGs, formatTime } from '@/lib/format';
import type { OrderAdminDto } from '@/lib/dto';
import { STATUSES_LINEAR, STATUS_LABELS, type Status } from '@/lib/status';

function trackingUrl(publicId: string) {
  if (typeof window === 'undefined') return `/t/${publicId}`;
  return `${window.location.origin}/t/${publicId}`;
}
function adminUrl(adminToken: string) {
  if (typeof window === 'undefined') return `/c/${adminToken}`;
  return `${window.location.origin}/c/${adminToken}`;
}

type SaveFlash = 'minutes' | 'delivery' | 'notes' | null;

export function OrderDetailDrawer({
  order,
  onClose,
  onPatched,
}: {
  order: OrderAdminDto;
  onClose: () => void;
  onPatched: (next: OrderAdminDto) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<SaveFlash>(null);

  const [minutesDraft, setMinutesDraft] = useState(
    order.estimatedMinutes != null ? String(order.estimatedMinutes) : '',
  );
  const [deliveryDraft, setDeliveryDraft] = useState(
    order.deliveryFee != null ? String(order.deliveryFee) : '',
  );
  const [notesDraft, setNotesDraft] = useState(order.internalNotes ?? '');

  useEffect(() => {
    setMinutesDraft(order.estimatedMinutes != null ? String(order.estimatedMinutes) : '');
    setDeliveryDraft(order.deliveryFee != null ? String(order.deliveryFee) : '');
    setNotesDraft(order.internalNotes ?? '');
  }, [order.id, order.estimatedMinutes, order.deliveryFee, order.internalNotes]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  function flashSaved(which: SaveFlash) {
    setFlash(which);
    setTimeout(() => setFlash(null), 1800);
  }

  async function patch(body: Record<string, unknown>): Promise<OrderAdminDto | null> {
    setBusy(true);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) return null;
      const next = (await res.json()) as OrderAdminDto;
      onPatched(next);
      return next;
    } catch {
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(next: Status) {
    if (busy) return;
    await patch({ status: next });
  }

  async function cancelOrder() {
    if (busy) return;
    const reason = window.prompt('Motivo de cancelación (mínimo 3 caracteres):');
    if (reason === null) return;
    const trimmed = reason.trim();
    if (trimmed.length < 3) {
      window.alert('Motivo demasiado corto');
      return;
    }
    await patch({ status: 'CANCELADO', cancelReason: trimmed });
  }

  async function saveMinutes() {
    if (busy) return;
    const trimmed = minutesDraft.trim();
    if (trimmed === '') {
      await patch({ estimatedMinutes: null });
      flashSaved('minutes');
      return;
    }
    const n = parseInt(trimmed, 10);
    if (!Number.isInteger(n) || n <= 0) {
      window.alert('Ingresá un número entero mayor a 0');
      return;
    }
    await patch({ estimatedMinutes: n });
    flashSaved('minutes');
  }

  async function saveDelivery() {
    if (busy) return;
    const trimmed = deliveryDraft.trim();
    if (trimmed === '') {
      await patch({ deliveryFee: null });
      flashSaved('delivery');
      return;
    }
    const n = parseInt(trimmed.replace(/[^\d]/g, ''), 10);
    if (!Number.isInteger(n) || n < 0) {
      window.alert('Monto inválido');
      return;
    }
    await patch({ deliveryFee: n });
    flashSaved('delivery');
  }

  async function saveNotes() {
    if (busy) return;
    const value = notesDraft.trim();
    await patch({ internalNotes: value === '' ? null : value });
    flashSaved('notes');
  }

  async function copyToClipboard(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      window.alert(`${label} copiado al portapapeles`);
    } catch {
      window.prompt(`Copiá manualmente — ${label}:`, text);
    }
  }

  const items = parseDetalle(order.detalle);
  const grandTotal = order.total + (order.deliveryFee ?? 0);

  const minutesDirty = minutesDraft !== (order.estimatedMinutes != null ? String(order.estimatedMinutes) : '');
  const deliveryDirty = deliveryDraft !== (order.deliveryFee != null ? String(order.deliveryFee) : '');
  const notesDirty = notesDraft !== (order.internalNotes ?? '');

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <aside className="relative ml-auto flex h-full w-full max-w-md flex-col overflow-y-auto bg-gray-50 shadow-2xl">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
          <div className="min-w-0">
            <p className="truncate font-semibold">{order.cliente}</p>
            <p className="truncate text-xs text-gray-500">
              {formatTime(order.createdAt)} · {STATUS_LABELS[order.status as Status]}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
            aria-label="Cerrar"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.225 4.811a1 1 0 0 0-1.414 1.414L8.586 10l-3.775 3.775a1 1 0 1 0 1.414 1.414L10 11.414l3.775 3.775a1 1 0 0 0 1.414-1.414L11.414 10l3.775-3.775a1 1 0 0 0-1.414-1.414L10 8.586 6.225 4.811Z" />
            </svg>
          </button>
        </header>

        <div className="space-y-4 p-4">
          <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Cliente
            </h3>
            <p className="font-medium">{order.cliente}</p>
            {order.telefono && (
              <a
                href={`tel:${order.telefono}`}
                className="mt-1 inline-block text-sm text-blue-600 underline"
              >
                📞 {order.telefono}
              </a>
            )}
            <p className="mt-1 text-sm text-gray-600">{order.direccion}</p>
          </section>

          <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Pedido
            </h3>
            <ul className="divide-y divide-gray-100">
              {items.map((it, i) => (
                <li key={i} className="flex gap-3 py-2 text-sm">
                  <span className="flex-1">{it.product}</span>
                  {it.price && (
                    <span className="font-mono tabular-nums text-gray-700">{it.price}</span>
                  )}
                </li>
              ))}
              <li className="flex gap-3 pt-2 text-sm text-gray-600">
                <span className="flex-1">Subtotal</span>
                <span className="font-mono tabular-nums">{formatGs(order.total)}</span>
              </li>
              {order.deliveryFee != null && order.deliveryFee > 0 && (
                <li className="flex gap-3 py-1 text-sm text-gray-600">
                  <span className="flex-1">Delivery 🏍️</span>
                  <span className="font-mono tabular-nums">{formatGs(order.deliveryFee)}</span>
                </li>
              )}
              <li className="flex gap-3 border-t border-gray-200 pt-2 font-semibold">
                <span className="flex-1">Total</span>
                <span className="font-mono tabular-nums">{formatGs(grandTotal)}</span>
              </li>
            </ul>
          </section>

          {order.status !== 'CANCELADO' && (
            <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Cambiar estado
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {STATUSES_LINEAR.map((s) => {
                  const active = s === order.status;
                  return (
                    <button
                      key={s}
                      onClick={() => setStatus(s)}
                      disabled={busy}
                      className={[
                        'rounded-xl border px-3 py-2 text-left text-sm font-medium transition disabled:opacity-50',
                        active
                          ? 'border-pink-600 bg-pink-600 text-white'
                          : 'border-gray-200 bg-white hover:bg-gray-50',
                      ].join(' ')}
                    >
                      {STATUS_LABELS[s]}
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {order.status !== 'CANCELADO' && (
            <InlineEditSection
              title="Tiempo estimado de entrega"
              saved={flash === 'minutes'}
              hint="En minutos (ej: 30). Dejá vacío para quitar."
            >
              <div className="flex gap-2">
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  step={1}
                  value={minutesDraft}
                  onChange={(e) => setMinutesDraft(e.target.value)}
                  placeholder="30"
                  disabled={busy}
                  className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100 disabled:opacity-50"
                />
                <button
                  onClick={saveMinutes}
                  disabled={busy || !minutesDirty}
                  className="rounded-lg bg-gray-900 px-3 py-2 text-xs font-semibold text-white hover:bg-gray-800 disabled:opacity-40"
                >
                  Guardar
                </button>
              </div>
            </InlineEditSection>
          )}

          <InlineEditSection
            title="Costo de delivery"
            saved={flash === 'delivery'}
            hint="En Gs. (ej: 10000). Dejá vacío para quitar."
          >
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                value={deliveryDraft}
                onChange={(e) => setDeliveryDraft(e.target.value)}
                placeholder="0"
                disabled={busy}
                className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100 disabled:opacity-50"
              />
              <button
                onClick={saveDelivery}
                disabled={busy || !deliveryDirty}
                className="rounded-lg bg-gray-900 px-3 py-2 text-xs font-semibold text-white hover:bg-gray-800 disabled:opacity-40"
              >
                Guardar
              </button>
            </div>
          </InlineEditSection>

          <InlineEditSection
            title="Nota interna"
            saved={flash === 'notes'}
            hint="Visible solo en este panel, no para el cliente."
          >
            <textarea
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              placeholder="Ej: cliente pidió tocar timbre 2 veces"
              rows={3}
              maxLength={2000}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
            />
            <button
              onClick={saveNotes}
              disabled={busy || !notesDirty}
              className="mt-2 rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-800 disabled:opacity-40"
            >
              Guardar nota
            </button>
          </InlineEditSection>

          <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Links
            </h3>
            <LinkRow
              label="Tracking del cliente"
              url={trackingUrl(order.publicId)}
              onCopy={(u) => copyToClipboard(u, 'Link de tracking')}
            />
            <LinkRow
              label="Control admin (URL secreta)"
              url={adminUrl(order.adminToken)}
              onCopy={(u) => copyToClipboard(u, 'Link de admin')}
            />
          </section>

          {order.status !== 'CANCELADO' && (
            <section className="rounded-2xl border border-red-200 bg-white p-4 shadow-sm">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-red-600">
                Zona peligrosa
              </h3>
              <button
                onClick={cancelOrder}
                disabled={busy}
                className="w-full rounded-xl border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
              >
                Cancelar pedido
              </button>
            </section>
          )}

          {order.status === 'CANCELADO' && order.cancelReason && (
            <section className="rounded-2xl border border-red-200 bg-red-50 p-4">
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-red-700">
                Motivo de cancelación
              </h3>
              <p className="text-sm text-red-900">{order.cancelReason}</p>
            </section>
          )}
        </div>
      </aside>
    </div>
  );
}

function InlineEditSection({
  title,
  hint,
  saved,
  children,
}: {
  title: string;
  hint?: string;
  saved: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</h3>
        {saved && <span className="text-xs text-green-600">✓ Guardado</span>}
      </div>
      {hint && <p className="mb-2 text-xs text-gray-400">{hint}</p>}
      {children}
    </section>
  );
}

function LinkRow({
  label,
  url,
  onCopy,
}: {
  label: string;
  url: string;
  onCopy: (url: string) => void;
}) {
  return (
    <div className="mb-2 last:mb-0">
      <p className="mb-1 text-xs text-gray-500">{label}</p>
      <div className="flex gap-2">
        <input
          readOnly
          value={url}
          className="flex-1 truncate rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-xs"
          onClick={(e) => (e.target as HTMLInputElement).select()}
        />
        <button
          onClick={() => onCopy(url)}
          className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-800"
        >
          Copiar
        </button>
      </div>
    </div>
  );
}
