'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

export function LoginForm() {
  const search = useSearchParams();
  const nextPath = search.get('next') ?? '/admin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;

    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        // Hard navigation para garantizar que la cookie viaje en la próxima request
        // (evita race condition con middleware en soft-navigation de Next router)
        window.location.href = nextPath;
        return;
      }

      if (res.status === 401) setError('Email o contraseña incorrectos');
      else if (res.status === 429) setError('Demasiados intentos. Probá en 10 min.');
      else setError('No se pudo iniciar sesión. Intentalo de nuevo.');
    } catch {
      setError('Error de red. Verificá tu conexión.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="pl-1 text-sm font-normal text-[#838383]">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={busy}
          className="h-14 w-full rounded-full border-2 border-black/10 bg-white px-6 text-base text-[#333] shadow-[0_4px_5.6px_0_rgba(0,0,0,0.1)] outline-none transition-colors focus:border-[#476e45] disabled:opacity-50 lg:h-[52px]"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="pl-1 text-sm font-normal text-[#838383]">
          Contraseña
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={busy}
          className="h-14 w-full rounded-full border-2 border-black/10 bg-white px-6 text-base text-[#333] shadow-[0_4px_5.6px_0_rgba(0,0,0,0.1)] outline-none transition-colors focus:border-[#476e45] disabled:opacity-50 lg:h-[52px]"
        />
      </div>

      {error && <p className="rounded-2xl bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      <button
        type="submit"
        disabled={busy}
        className="mt-2 h-14 w-full cursor-pointer rounded-full border-4 border-[#335232] bg-gradient-to-r from-[#476e45] to-[#325131] text-lg font-normal tracking-wide text-[#f7f7f7] shadow-[0_4px_4px_rgba(0,0,0,0.08)] transition-all duration-150 hover:brightness-110 active:scale-[0.98] disabled:opacity-60 lg:h-[52px]"
      >
        {busy ? 'Entrando…' : 'Iniciar sesión'}
      </button>

      <p className="text-center text-sm text-[#838383]">
        ¿Necesitas asistencia?{' '}
        <a
          href="mailto:soporte@cafedeaca.com"
          className="text-[#7a85d7] underline underline-offset-2 transition-opacity hover:opacity-80"
        >
          tocá acá
        </a>
      </p>
    </form>
  );
}
