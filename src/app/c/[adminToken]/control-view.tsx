'use client';

import { useState } from 'react';
import { useVisiblePoll } from '@/hooks/use-visible-poll';
import { OrderDisplay } from '@/components/order-display';
import type { OrderAdminDto } from '@/lib/dto';
import { STATUSES, STATUS_LABELS, type Status } from '@/lib/status';

export function ControlView({
  initial,
  adminToken,
}: {
  initial: OrderAdminDto;
  adminToken: string;
}) {
  const [order, setOrder] = useVisiblePoll<OrderAdminDto>(
    `/api/admin/${adminToken}`,
    initial,
  );
  const [busy, setBusy] = useState(false);

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/${adminToken}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) setOrder((await res.json()) as OrderAdminDto);
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(next: Status) {
    if (busy) return;

    const body: { status: Status; estimatedMinutes?: number } = { status: next };

    if (next === 'ACEPTADO') {
      const raw = window.prompt(
        'Tiempo estimado (minutos):',
        String(order.estimatedMinutes ?? 30),
      );
      if (raw === null) return;
      const n = parseInt(raw, 10);
      if (Number.isInteger(n) && n > 0) body.estimatedMinutes = n;
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

  return (
    <OrderDisplay
      order={order}
      controls={
        <>
          <section className="card">
            <h2 className="card-section-title">Cambiar estado</h2>
            <div className="grid grid-cols-1 gap-2">
              {STATUSES.map((s) => {
                const active = s === order.status;
                return (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    disabled={busy}
                    className={[
                      'rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition disabled:opacity-50',
                      active
                        ? 'border-[#b4191e] bg-[#b4191e] text-white shadow-sm'
                        : 'border-black/10 bg-white text-[#1f1f1f] hover:bg-[#fcf9f2]',
                    ].join(' ')}
                  >
                    {STATUS_LABELS[s]}
                  </button>
                );
              })}
            </div>
          </section>

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

          <p className="px-2 text-center text-xs text-[#8a8a8a]">
            Vista de control del local. No la compartas con el cliente.
          </p>
        </>
      }
    />
  );
}
