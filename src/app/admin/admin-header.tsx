'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function AdminHeader({ email }: { email: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/admin/login');
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-black/5 bg-[#fcf9f2]/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/admin" className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://www.fiweex.com/sistema/img/logos/thumbnail/c6744fdc9907459976f35253c84964a5.jpeg"
            alt=""
            className="h-9 w-9 rounded-lg object-cover ring-1 ring-black/5"
          />
          <div className="hidden flex-col leading-tight sm:flex">
            <span className="text-sm font-bold text-[#1f1f1f]">Café de Acá</span>
            <span className="text-[11px] font-medium uppercase tracking-wider text-[#066731]">
              Panel de pedidos
            </span>
          </div>
          <span className="font-semibold sm:hidden">Panel</span>
        </Link>

        <div className="flex items-center gap-3 text-sm">
          <span className="hidden text-[#8a8a8a] md:inline">{email}</span>
          <button
            onClick={logout}
            disabled={busy}
            className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-sm font-medium text-[#1f1f1f] transition hover:bg-[#fcf9f2] disabled:opacity-50"
          >
            Salir
          </button>
        </div>
      </div>
    </header>
  );
}
