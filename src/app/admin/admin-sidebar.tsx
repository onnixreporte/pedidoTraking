'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SidebarNav } from './sidebar-nav';
import { ChangePasswordModal } from './change-password-modal';

export function AdminSidebar({ email }: { email: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false); // drawer mobile
  const [busy, setBusy] = useState(false); // logout en curso
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Cerrar drawer con Escape (R14, R15)
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

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
    <>
      {/* Topbar mobile compacta (solo < md) */}
      <div className="flex items-center gap-2 border-b border-black/5 bg-[#fcf9f2]/85 px-4 py-3 backdrop-blur-md md:hidden">
        <button
          onClick={() => setOpen(true)}
          aria-label="Abrir menú"
          aria-expanded={open}
          className="rounded-lg border border-black/10 bg-white p-1.5 text-[#1f1f1f] transition hover:bg-[#fcf9f2]"
        >
          <svg
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            aria-hidden
          >
            <path d="M3 5h14M3 10h14M3 15h14" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <span className="text-sm font-bold text-[#1f1f1f]">Café de Acá</span>
      </div>

      {/* Overlay (solo mobile, cuando open) */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      {/* Aside: fijo en desktop, drawer translate-x en mobile */}
      <aside
        role="dialog"
        aria-label="Navegación del panel"
        className={[
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-black/5 bg-[#fcf9f2]',
          'transition-transform md:static md:z-auto md:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        {/* Header del sidebar: logo + marca */}
        <Link
          href="/admin/pedidos"
          className="flex items-center gap-3 px-4 py-4"
          onClick={() => setOpen(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://www.fiweex.com/sistema/img/logos/thumbnail/c6744fdc9907459976f35253c84964a5.jpeg"
            alt=""
            className="h-9 w-9 rounded-lg object-cover ring-1 ring-black/5"
          />
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-bold text-[#1f1f1f]">Café de Acá</span>
            <span className="text-[11px] font-medium uppercase tracking-wider text-[#066731]">
              Panel
            </span>
          </div>
        </Link>

        {/* Navegación (client chico con usePathname) */}
        <SidebarNav onNavigate={() => setOpen(false)} />

        {/* Footer: usuario + acciones */}
        <div className="mt-auto border-t border-black/5 p-3">
          <p className="mb-2 truncate px-1 text-[11px] text-[#8a8a8a]" title={email}>
            {email}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPasswordModal(true)}
              disabled={busy}
              aria-label="Cambiar contraseña"
              title="Cambiar contraseña"
              className="rounded-lg border border-black/10 bg-white p-1.5 text-[#1f1f1f] transition hover:bg-[#fcf9f2] disabled:opacity-50"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path d="M10 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                <path d="M3.465 14.493a1.23 1.23 0 0 0 .41 1.412A9.957 9.957 0 0 0 10 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 0 0-13.074.003Z" />
              </svg>
            </button>
            <button
              onClick={logout}
              disabled={busy}
              className="flex-1 rounded-lg border border-black/10 bg-white px-3 py-1.5 text-sm font-medium text-[#1f1f1f] transition hover:bg-[#fcf9f2] disabled:opacity-50"
            >
              Salir
            </button>
          </div>
        </div>
      </aside>

      {showPasswordModal && <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />}
    </>
  );
}
