'use client';

import { useEffect, useState } from 'react';
import type { OrderAdminDto } from '@/lib/dto';

function adminUrl(adminToken: string) {
  if (typeof window === 'undefined') return `/c/${adminToken}`;
  return `${window.location.origin}/c/${adminToken}`;
}

export function RepartidorHandoffModal({
  order,
  onClose,
}: {
  order: OrderAdminDto;
  onClose: () => void;
}) {
  const link = adminUrl(order.adminToken);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copiá manualmente el link:', link);
    }
  }

  async function shareLink() {
    const text = `Hola, te paso el pedido de ${order.cliente} (${order.direccion}). Marcá como entregado cuando llegues: ${link}`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Pedido para repartir',
          text,
          url: link,
        });
        return;
      } catch {
        // user canceled or share failed — caer a WhatsApp web
      }
    }
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />

      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#066731]/10 text-[#066731]">
            <svg className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path
                fillRule="evenodd"
                d="M16.704 5.29a1 1 0 0 1 .006 1.415l-7.5 7.55a1 1 0 0 1-1.42 0L3.29 9.755a1 1 0 1 1 1.42-1.41l3.79 3.81 6.79-6.84a1 1 0 0 1 1.414-.025Z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#1f1f1f]">Pedido listo para repartir</h2>
            <p className="text-sm text-[#5a5a5a]">
              {order.cliente} · {order.direccion}
            </p>
          </div>
        </div>

        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <p className="font-semibold">📋 Compartile este link al repartidor</p>
          <p className="mt-1 text-xs">
            Es el único que puede marcar el pedido como <strong>entregado</strong>.
          </p>
        </div>

        <div className="mb-4">
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-[#8a8a8a]">
            Link admin del pedido
          </p>
          <div className="flex gap-2">
            <input
              readOnly
              value={link}
              onClick={(e) => (e.target as HTMLInputElement).select()}
              className="flex-1 truncate rounded-lg border border-black/10 bg-[#fcf9f2] px-3 py-2 text-xs text-[#1f1f1f]"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            onClick={copyLink}
            className={[
              'flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition',
              copied
                ? 'bg-[#066731]/10 text-[#066731]'
                : 'bg-[#066731] text-white hover:bg-[#055527]',
            ].join(' ')}
          >
            {copied ? '✓ Copiado' : '📋 Copiar link'}
          </button>
          <button
            onClick={shareLink}
            className="flex-1 rounded-xl border border-[#066731] bg-white px-4 py-2.5 text-sm font-semibold text-[#066731] transition hover:bg-[#066731]/5"
          >
            📱 Compartir
          </button>
        </div>

        <button
          onClick={onClose}
          className="mt-3 w-full rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-medium text-[#5a5a5a] hover:bg-[#fcf9f2]"
        >
          Listo
        </button>
      </div>
    </div>
  );
}
