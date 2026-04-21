'use client';

import { useState } from 'react';
import { useVisiblePoll } from '@/hooks/use-visible-poll';
import { OrderDisplay } from '@/components/order-display';
import type { OrderDto } from '@/lib/dto';
import { STATUSES, STATUS_LABELS, type Status } from '@/lib/status';

export function ControlView({
  initial,
  adminToken,
}: {
  initial: OrderDto;
  adminToken: string;
}) {
  const [order, setOrder] = useVisiblePoll<OrderDto>(
    `/api/admin/${adminToken}`,
    initial,
  );
  const [busy, setBusy] = useState(false);

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

    setBusy(true);
    try {
      const res = await fetch(`/api/admin/${adminToken}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) setOrder((await res.json()) as OrderDto);
    } finally {
      setBusy(false);
    }
  }

  return (
    <OrderDisplay
      order={order}
      controls={
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-600">
            Cambiar estado
          </h2>
          <div className="grid grid-cols-1 gap-2">
            {STATUSES.map((s) => {
              const active = s === order.status;
              return (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  disabled={busy}
                  className={[
                    'rounded-lg border px-3 py-2 text-left text-sm transition',
                    active
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-gray-300 bg-white hover:bg-gray-50',
                    'disabled:opacity-50',
                  ].join(' ')}
                >
                  {STATUS_LABELS[s]}
                </button>
              );
            })}
          </div>
          <p className="pt-2 text-xs text-gray-500">
            Esta es la vista de control del local. No la compartas con el cliente.
          </p>
        </section>
      }
    />
  );
}
