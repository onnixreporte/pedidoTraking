'use client';

import { useState } from 'react';
import { useVisiblePoll } from '@/hooks/use-visible-poll';
import { OrderDisplay } from '@/components/order-display';
import type { OrderAdminDto } from '@/lib/dto';
import { ALLOWED_TRANSITIONS, STATUSES_LINEAR, STATUS_LABELS, type Status } from '@/lib/status';

const STATUS_ACTION_LABEL: Record<Status, string> = {
  ENVIADO_AL_NEGOCIO: 'Volver a solicitud',
  ACEPTADO: 'Aceptar',
  REPARTIDOR_EN_CAMINO: 'Pasar al repartidor',
  ENTREGADO: 'Marcar entregado',
  CANCELADO: 'Cancelar',
};

export function ControlView({
  initial,
  adminToken,
}: {
  initial: OrderAdminDto;
  adminToken: string;
}) {
  const [order, setOrder] = useVisiblePoll<OrderAdminDto>(`/api/admin/${adminToken}`, initial);
  const [busy, setBusy] = useState(false);

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/${adminToken}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setOrder((await res.json()) as OrderAdminDto);
      } else {
        const err = await res.json().catch(() => ({}));
        window.alert(err?.message ?? 'No se pudo actualizar el estado');
      }
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(next: Status) {
    if (busy) return;

    const body: { status: Status; estimatedMinutes?: number; cancelReason?: string } = {
      status: next,
    };

    if (next === 'ACEPTADO') {
      const raw = window.prompt('Tiempo estimado (minutos):', String(order.estimatedMinutes ?? 30));
      if (raw === null) return;
      const n = parseInt(raw, 10);
      if (Number.isInteger(n) && n > 0) body.estimatedMinutes = n;
    }

    if (next === 'REPARTIDOR_EN_CAMINO' && order.deliveryFee == null) {
      window.alert('Cargá primero el costo del delivery abajo.');
      return;
    }

    if (next === 'CANCELADO') {
      const reason = window.prompt('Motivo de cancelación (mínimo 3 caracteres):');
      if (reason === null) return;
      const trimmed = reason.trim();
      if (trimmed.length < 3) {
        window.alert('Motivo demasiado corto');
        return;
      }
      body.cancelReason = trimmed;
    }

    await patch(body);
  }

  async function editDelivery() {
    if (busy) return;
    const raw = window.prompt(
      'Costo del delivery en Gs. (vacío para quitar):',
      String(order.deliveryFee ?? ''),
    );
    if (raw === null) return;

    const trimmed = raw.trim();
    if (trimmed === '') {
      await patch({ deliveryFee: null });
      return;
    }

    const cleaned = trimmed.replace(/[^\d]/g, '');
    const n = parseInt(cleaned, 10);
    if (!Number.isInteger(n) || n < 0) {
      window.alert('Monto inválido');
      return;
    }
    await patch({ deliveryFee: n });
  }

  const isTerminal = order.status === 'ENTREGADO' || order.status === 'CANCELADO';
  const allowedNext = ALLOWED_TRANSITIONS[order.status as Status];
  const linearNext = allowedNext.filter(
    (s) => s !== 'CANCELADO' && STATUSES_LINEAR.includes(s as never),
  );
  const canCancel = allowedNext.includes('CANCELADO');

  return (
    <OrderDisplay
      order={order}
      controls={
        <>
          {!isTerminal && linearNext.length > 0 && (
            <section className="card">
              <h2 className="card-section-title">Avanzar estado</h2>
              <div className="mb-3 rounded-lg bg-[#fcf9f2] px-3 py-2 text-xs text-[#5a5a5a]">
                Estado actual:{' '}
                <span className="font-semibold text-[#1f1f1f]">
                  {STATUS_LABELS[order.status as Status]}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {linearNext.map((s) => (
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

          {!isTerminal && (
            <section className="card">
              <h2 className="card-section-title">Delivery</h2>
              <button
                onClick={editDelivery}
                disabled={busy}
                className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-left text-sm text-[#1f1f1f] transition hover:bg-[#fcf9f2] disabled:opacity-50"
              >
                {order.deliveryFee != null
                  ? `Costo: Gs. ${order.deliveryFee.toLocaleString('es-PY')} — tocá para editar`
                  : 'Sin delivery — tocá para agregar costo'}
              </button>
            </section>
          )}

          {canCancel && (
            <section className="rounded-2xl border border-[#b4191e]/20 bg-white p-4 shadow-[var(--shadow-card)]">
              <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#b4191e]">
                Zona peligrosa
              </h2>
              <button
                onClick={() => setStatus('CANCELADO')}
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

          <p className="px-2 text-center text-xs text-[#8a8a8a]">
            Vista de control del pedido. No la compartas con el cliente.
          </p>
        </>
      }
    />
  );
}
