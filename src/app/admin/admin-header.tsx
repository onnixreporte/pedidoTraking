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
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/admin" className="flex items-center gap-2 text-sm font-semibold tracking-wide">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://www.fiweex.com/sistema/img/logos/thumbnail/c6744fdc9907459976f35253c84964a5.jpeg"
            alt=""
            className="h-8 w-8 rounded-lg object-cover"
          />
          <span className="hidden sm:inline">Café de Acá · Panel</span>
          <span className="sm:hidden">Panel</span>
        </Link>

        <div className="flex items-center gap-3 text-sm">
          <span className="hidden text-gray-500 md:inline">{email}</span>
          <button
            onClick={logout}
            disabled={busy}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            Salir
          </button>
        </div>
      </div>
    </header>
  );
}
