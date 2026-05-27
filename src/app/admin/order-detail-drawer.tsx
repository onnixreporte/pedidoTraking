'use client';

import { useEffect, useRef, useState } from 'react';
import { parseDetalle } from '@/lib/parse-detalle';
import { formatGs, formatTime } from '@/lib/format';
import type { OrderAdminDto } from '@/lib/dto';
import {
  ALLOWED_TRANSITIONS,
  STATUSES_LINEAR,
  STATUS_LABELS,
  type Status,
} from '@/lib/status';

const STATUS_ACTION_LABEL: Record<Status, string> = {
  ENVIADO_AL_NEGOCIO: 'Volver a solicitud',
  ACEPTADO: 'Aceptar',
  REPARTIDOR_EN_CAMINO: 'Pasar al repartidor',
  ENTREGADO: 'Marcar entregado',
  CANCELADO: 'Cancelar',
};

function trackingUrl(publicId: string) {
  if (typeof window === 'undefined') return `/t/${publicId}`;
  return `${window.location.origin}/t/${publicId}`;
}
function adminUrl(adminToken: string) {
  if (typeof window === 'undefined') return `/c/${adminToken}`;
  return `${window.location.origin}/c/${adminToken}`;
}

export type DrawerFocus = 'minutes' | 'delivery' | 'edit' | null;

type SaveFlash = 'minutes' | 'delivery' | 'notes' | 'edit' | null;

export function OrderDetailDrawer({
  order,
  initialFocus,
  onClose,
  onPatched,
}: {
  order: OrderAdminDto;
  initialFocus?: DrawerFocus;
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
  const [detalleDraft, setDetalleDraft] = useState(order.detalle);
  const [totalDraft, setTotalDraft] = useState(String(order.total));

  const minutesRef = useRef<HTMLInputElement>(null);
  const deliveryRef = useRef<HTMLInputElement>(null);
  const detalleRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setMinutesDraft(order.estimatedMinutes != null ? String(order.estimatedMinutes) : '');
    setDeliveryDraft(order.deliveryFee != null ? String(order.deliveryFee) : '');
    setNotesDraft(order.internalNotes ?? '');
    setDetalleDraft(order.detalle);
    setTotalDraft(String(order.total));
  }, [
    order.id,
    order.estimatedMinutes,
    order.deliveryFee,
    order.internalNotes,
    order.detalle,
    order.total,
  ]);

  // Focus inicial cuando el drawer se abre desde una quick action
  useEffect(() => {
    if (!initialFocus) return;
    const tick = setTimeout(() => {
      if (initialFocus === 'minutes') minutesRef.current?.focus();
      else if (initialFocus === 'delivery') deliveryRef.current?.focus();
      else if (initialFocus === 'edit') detalleRef.current?.focus();
    }, 50);
    return () => clearTimeout(tick);
  }, [initialFocus]);

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
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        const msg = errBody?.message ?? 'No se pudo guardar el cambio';
        window.alert(msg);
        return null;
      }
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

    // Validación cliente: bloquea con foco al input necesario
    if (next === 'ACEPTADO' && order.estimatedMinutes == null && !minutesDraft.trim()) {
      window.alert('Cargá el tiempo estimado abajo antes de aceptar el pedido.');
      minutesRef.current?.focus();
      return;
    }
    if (
      next === 'REPARTIDOR_EN_CAMINO' &&
      order.deliveryFee == null &&
      !deliveryDraft.trim()
    ) {
      window.alert('Cargá el costo del delivery abajo antes de despachar.');
      deliveryRef.current?.focus();
      return;
    }

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

  async function saveOrderEdit() {
    if (busy) return;
    const detalle = detalleDraft.trim();
    if (detalle === '') {
      window.alert('El detalle no puede quedar vacío');
      return;
    }
    const total = parseInt(totalDraft.replace(/[^\d]/g, ''), 10);
    if (!Number.isInteger(total) || total < 0) {
      window.alert('Total inválido');
      return;
    }
    await patch({ detalle, total });
    flashSaved('edit');
  }

  async function copyToClipboard(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      window.alert(`${label} copiado al portapapeles`);
    } catch {
      window.prompt(`Copiá manualmente — ${label}:`, text);
    }
  }

  // Sugerencia de total: suma los precios "Gs. X" del detalle editado
  function suggestedTotal(): number {
    const matches = detalleDraft.match(/Gs\.?\s*[\d.,]+/gi) ?? [];
    let sum = 0;
    for (const m of matches) {
      const n = parseInt(m.replace(/[^\d]/g, ''), 10);
      if (Number.isFinite(n)) sum += n;
    }
    return sum;
  }

  const items = parseDetalle(order.detalle);
  const grandTotal = order.total + (order.deliveryFee ?? 0);

  const minutesDirty =
    minutesDraft !== (order.estimatedMinutes != null ? String(order.estimatedMinutes) : '');
  const deliveryDirty =
    deliveryDraft !== (order.deliveryFee != null ? String(order.deliveryFee) : '');
  const notesDirty = notesDraft !== (order.internalNotes ?? '');
  const editDirty = detalleDraft !== order.detalle || totalDraft !== String(order.total);

  const suggested = suggestedTotal();
  const totalNum = parseInt(totalDraft.replace(/[^\d]/g, ''), 10) || 0;
  const showSuggestion =
    editDirty && suggested > 0 && suggested !== totalNum;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <aside className="relative ml-auto flex h-full w-full max-w-md flex-col overflow-y-auto bg-[#fcf9f2] shadow-2xl">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-black/5 bg-white/85 px-4 py-3 backdrop-blur-md">
          <div className="min-w-0">
            <p className="truncate font-semibold text-[#1f1f1f]">{order.cliente}</p>
            <p className="truncate text-xs text-[#8a8a8a]">
              {formatTime(order.createdAt)} · {STATUS_LABELS[order.status as Status]}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-[#8a8a8a] transition hover:bg-black/5 hover:text-[#1f1f1f]"
            aria-label="Cerrar"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.225 4.811a1 1 0 0 0-1.414 1.414L8.586 10l-3.775 3.775a1 1 0 1 0 1.414 1.414L10 11.414l3.775 3.775a1 1 0 0 0 1.414-1.414L11.414 10l3.775-3.775a1 1 0 0 0-1.414-1.414L10 8.586 6.225 4.811Z" />
            </svg>
          </button>
        </header>

        <div className="space-y-4 p-4">
          {/* Cliente */}
          <section className="card">
            <h3 className="card-section-title">Cliente</h3>
            <p className="font-semibold text-[#1f1f1f]">{order.cliente}</p>
            {order.telefono && (
              <a
                href={`tel:${order.telefono}`}
                className="mt-1 inline-flex items-center gap-1 text-sm text-[#066731] hover:underline"
              >
                📞 {order.telefono}
              </a>
            )}
            <p className="mt-2 text-sm text-[#5a5a5a]">{order.direccion}</p>
          </section>

          {/* Nota del cliente */}
          {order.additionalNote && (
            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-amber-700">
                Nota especial del cliente
              </h3>
              <p className="text-sm text-amber-900">{order.additionalNote}</p>
            </section>
          )}

          {/* Pedido actual */}
          <section className="card">
            <h3 className="card-section-title">Pedido</h3>
            <ul className="divide-y divide-black/5">
              {items.map((it, i) => (
                <li key={i} className="flex gap-3 py-2 text-sm">
                  <span className="flex-1 text-[#1f1f1f]">{it.product}</span>
                  {it.price && (
                    <span className="font-mono tabular-nums text-[#5a5a5a]">{it.price}</span>
                  )}
                </li>
              ))}
              <li className="flex gap-3 pt-2 text-sm text-[#5a5a5a]">
                <span className="flex-1">Subtotal</span>
                <span className="font-mono tabular-nums">{formatGs(order.total)}</span>
              </li>
              {order.deliveryFee != null && order.deliveryFee > 0 && (
                <li className="flex gap-3 py-1 text-sm text-[#5a5a5a]">
                  <span className="flex-1">Delivery 🏍️</span>
                  <span className="font-mono tabular-nums">{formatGs(order.deliveryFee)}</span>
                </li>
              )}
              <li className="mt-1 flex gap-3 border-t border-black/10 pt-2 text-base font-bold text-[#1f1f1f]">
                <span className="flex-1">Total</span>
                <span className="font-mono tabular-nums">{formatGs(grandTotal)}</span>
              </li>
            </ul>
          </section>

          {/* Editar pedido */}
          {order.status !== 'CANCELADO' && order.status !== 'ENTREGADO' && (
            <InlineEditSection
              title="Editar pedido"
              saved={flash === 'edit'}
              hint="Una línea por item. Formato: cantidadx producto - Gs. precio"
            >
              <textarea
                ref={detalleRef}
                value={detalleDraft}
                onChange={(e) => setDetalleDraft(e.target.value)}
                rows={5}
                maxLength={2000}
                className="input-base w-full font-mono text-xs"
              />
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs font-medium text-[#5a5a5a]">Total Gs.</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={totalDraft}
                  onChange={(e) => setTotalDraft(e.target.value)}
                  className="input-base flex-1 !py-1.5 text-sm"
                />
                {showSuggestion && (
                  <button
                    type="button"
                    onClick={() => setTotalDraft(String(suggested))}
                    className="text-xs text-[#066731] underline whitespace-nowrap"
                    title="Aplicar suma calculada"
                  >
                    Usar {formatGs(suggested)}
                  </button>
                )}
              </div>
              <button
                onClick={saveOrderEdit}
                disabled={busy || !editDirty}
                className="btn-primary mt-2"
              >
                Guardar pedido
              </button>
            </InlineEditSection>
          )}

          {/* Avance de estado */}
          {order.status !== 'CANCELADO' && order.status !== 'ENTREGADO' && (
            <section className="card">
              <h3 className="card-section-title">Avanzar estado</h3>

              <div className="mb-3 rounded-lg bg-[#fcf9f2] px-3 py-2 text-xs text-[#5a5a5a]">
                Estado actual:{' '}
                <span className="font-semibold text-[#1f1f1f]">
                  {STATUS_LABELS[order.status as Status]}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {ALLOWED_TRANSITIONS[order.status as Status]
                  .filter((s) => s !== 'CANCELADO' && STATUSES_LINEAR.includes(s as never))
                  .map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatus(s)}
                      disabled={busy}
                      className="rounded-xl border border-[#066731] bg-[#066731] px-3 py-2.5 text-left text-sm font-semibold text-white shadow-sm transition hover:bg-[#055527] disabled:opacity-50"
                    >
                      {STATUS_ACTION_LABEL[s]} →
                    </button>
                  ))}
              </div>
            </section>
          )}

          {/* Tiempo estimado */}
          {order.status !== 'CANCELADO' && (
            <InlineEditSection
              title="Tiempo estimado de entrega"
              saved={flash === 'minutes'}
              hint="En minutos (ej: 30). Obligatorio para aceptar el pedido."
            >
              <div className="flex gap-2">
                <input
                  ref={minutesRef}
                  type="number"
                  inputMode="numeric"
                  min={1}
                  step={1}
                  value={minutesDraft}
                  onChange={(e) => setMinutesDraft(e.target.value)}
                  placeholder="30"
                  disabled={busy}
                  className="input-base flex-1 disabled:opacity-50"
                />
                <button
                  onClick={saveMinutes}
                  disabled={busy || !minutesDirty}
                  className="btn-primary"
                >
                  Guardar
                </button>
              </div>
            </InlineEditSection>
          )}

          {/* Delivery */}
          {order.status !== 'CANCELADO' && (
            <InlineEditSection
              title="Costo de delivery"
              saved={flash === 'delivery'}
              hint="En Gs. (ej: 10000). Obligatorio para despachar."
            >
              <div className="flex gap-2">
                <input
                  ref={deliveryRef}
                  type="text"
                  inputMode="numeric"
                  value={deliveryDraft}
                  onChange={(e) => setDeliveryDraft(e.target.value)}
                  placeholder="0"
                  disabled={busy}
                  className="input-base flex-1 disabled:opacity-50"
                />
                <button
                  onClick={saveDelivery}
                  disabled={busy || !deliveryDirty}
                  className="btn-primary"
                >
                  Guardar
                </button>
              </div>
            </InlineEditSection>
          )}

          {/* Notas internas */}
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
              className="input-base w-full"
            />
            <button
              onClick={saveNotes}
              disabled={busy || !notesDirty}
              className="btn-primary mt-2"
            >
              Guardar nota
            </button>
          </InlineEditSection>

          {/* Links */}
          <section className="card">
            <h3 className="card-section-title">Links</h3>
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

          {/* Zona peligrosa */}
          {order.status !== 'CANCELADO' && (
            <section className="rounded-2xl border border-[#b4191e]/20 bg-white p-4 shadow-[var(--shadow-card)]">
              <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#b4191e]">
                Zona peligrosa
              </h3>
              <button
                onClick={cancelOrder}
                disabled={busy}
                className="w-full rounded-xl border border-[#b4191e]/30 bg-white px-3 py-2 text-sm font-medium text-[#b4191e] transition hover:bg-[#b4191e]/5 disabled:opacity-50"
              >
                Cancelar pedido
              </button>
            </section>
          )}

          {order.status === 'CANCELADO' && order.cancelReason && (
            <section className="rounded-2xl border border-[#b4191e]/20 bg-[#b4191e]/5 p-4">
              <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#b4191e]">
                Motivo de cancelación
              </h3>
              <p className="text-sm text-[#1f1f1f]">{order.cancelReason}</p>
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
    <section className="card">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="card-section-title !mb-0">{title}</h3>
        {saved && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-[#066731]">
            ✓ Guardado
          </span>
        )}
      </div>
      {hint && <p className="mb-2 text-xs text-[#8a8a8a]">{hint}</p>}
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
    <div className="mb-3 last:mb-0">
      <p className="mb-1 text-xs text-[#8a8a8a]">{label}</p>
      <div className="flex gap-2">
        <input
          readOnly
          value={url}
          className="flex-1 truncate rounded-lg border border-black/10 bg-[#fcf9f2] px-2 py-1.5 text-xs text-[#1f1f1f]"
          onClick={(e) => (e.target as HTMLInputElement).select()}
        />
        <button onClick={() => onCopy(url)} className="btn-primary">
          Copiar
        </button>
      </div>
    </div>
  );
}
