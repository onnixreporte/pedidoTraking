'use client';

import { useEffect, useState } from 'react';
import type { OrderAdminDto } from '@/lib/dto';

function adminUrl(adminToken: string) {
  if (typeof window === 'undefined') return `/c/${adminToken}`;
  return `${window.location.origin}/c/${adminToken}`;
}
function trackingUrl(publicId: string) {
  if (typeof window === 'undefined') return `/t/${publicId}`;
  return `${window.location.origin}/t/${publicId}`;
}

type LinkKey = 'admin' | 'customer';

export function RepartidorHandoffModal({
  order,
  onClose,
}: {
  order: OrderAdminDto;
  onClose: () => void;
}) {
  const adminLink = adminUrl(order.adminToken);
  const customerLink = trackingUrl(order.publicId);

  const [copied, setCopied] = useState<LinkKey | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function copyLink(key: LinkKey, url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(key);
      setTimeout(() => setCopied((cur) => (cur === key ? null : cur)), 2000);
    } catch {
      window.prompt('Copiá manualmente el link:', url);
    }
  }

  async function shareAdmin() {
    const text = `Hola, te paso el pedido de ${order.cliente} (${order.direccion}). Marcá como entregado cuando llegues: ${adminLink}`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Pedido para repartir',
          text,
          url: adminLink,
        });
        return;
      } catch {
        // usuario cancelo o share fallo — fallback a wa.me
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
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-[#1f1f1f]">Pedido listo para repartir</h2>
            <p className="truncate text-sm text-[#5a5a5a]">
              {order.cliente} · {order.direccion}
            </p>
          </div>
        </div>

        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <p className="font-semibold">📋 Compartí ambos links</p>
          <p className="mt-1 text-xs">
            Al <strong>repartidor</strong> para que marque como entregado, y al{' '}
            <strong>cliente</strong> para que siga su pedido en vivo.
          </p>
        </div>

        <LinkRow
          icon="🚚"
          label="Para el repartidor"
          hint="Control del pedido — puede marcar como entregado"
          url={adminLink}
          copied={copied === 'admin'}
          onCopy={() => copyLink('admin', adminLink)}
        />

        <LinkRow
          icon="👤"
          label="Para el cliente"
          hint="Solo tracking — sin permisos de control"
          url={customerLink}
          copied={copied === 'customer'}
          onCopy={() => copyLink('customer', customerLink)}
        />

        <button
          onClick={shareAdmin}
          className="mt-4 w-full rounded-xl border border-[#066731] bg-white px-4 py-2.5 text-sm font-semibold text-[#066731] transition hover:bg-[#066731]/5"
        >
          📱 Compartir link del repartidor por WhatsApp
        </button>

        <button
          onClick={onClose}
          className="mt-2 w-full rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-medium text-[#5a5a5a] hover:bg-[#fcf9f2]"
        >
          Listo
        </button>
      </div>
    </div>
  );
}

function LinkRow({
  icon,
  label,
  hint,
  url,
  copied,
  onCopy,
}: {
  icon: string;
  label: string;
  hint: string;
  url: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="mb-3">
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#5a5a5a]">
          {icon} {label}
        </p>
      </div>
      <p className="mb-1.5 text-xs text-[#8a8a8a]">{hint}</p>
      <div className="flex gap-2">
        <input
          readOnly
          value={url}
          onClick={(e) => (e.target as HTMLInputElement).select()}
          className="flex-1 truncate rounded-lg border border-black/10 bg-[#fcf9f2] px-3 py-2 text-xs text-[#1f1f1f]"
        />
        <button
          onClick={onCopy}
          className={[
            'rounded-lg px-3 py-2 text-xs font-semibold transition',
            copied
              ? 'bg-[#066731]/10 text-[#066731]'
              : 'bg-[#066731] text-white hover:bg-[#055527]',
          ].join(' ')}
        >
          {copied ? '✓ Copiado' : 'Copiar'}
        </button>
      </div>
    </div>
  );
}
