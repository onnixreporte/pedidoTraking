'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError(null);

    if (!currentPassword) return setError('Cargá tu contraseña actual');
    if (newPassword.length < 8) {
      return setError('La nueva contraseña debe tener al menos 8 caracteres');
    }
    if (newPassword !== confirmPassword) return setError('La confirmación no coincide');
    if (newPassword === currentPassword) {
      return setError('La nueva contraseña debe ser distinta de la actual');
    }

    setBusy(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (err?.error === 'INVALID_CURRENT_PASSWORD') {
          setError('La contraseña actual no es correcta');
        } else if (err?.error === 'RATE_LIMITED') {
          setError(err?.message ?? 'Demasiados intentos. Probá en 10 min.');
        } else {
          setError(err?.message ?? 'No se pudo actualizar la contraseña');
        }
        return;
      }

      setSuccess(true);
    } catch {
      setError('Error de red. Reintentá.');
    } finally {
      setBusy(false);
    }
  }

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />

      <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        {!success ? (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#1f1f1f]">Cambiar contraseña</h2>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-[#8a8a8a] hover:bg-black/5 hover:text-[#1f1f1f]"
                aria-label="Cerrar"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M6.225 4.811a1 1 0 0 0-1.414 1.414L8.586 10l-3.775 3.775a1 1 0 1 0 1.414 1.414L10 11.414l3.775 3.775a1 1 0 0 0 1.414-1.414L11.414 10l3.775-3.775a1 1 0 0 0-1.414-1.414L10 8.586 6.225 4.811Z" />
                </svg>
              </button>
            </div>

            <p className="mb-4 text-sm text-[#5a5a5a]">
              Ingresá tu contraseña actual y la nueva dos veces para confirmar.
            </p>

            <form onSubmit={submit} className="space-y-3">
              <Field label="Contraseña actual *">
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  disabled={busy}
                  autoComplete="current-password"
                  className="input-base w-full !py-2 text-sm"
                />
              </Field>

              <Field label="Nueva contraseña *" hint="Mínimo 8 caracteres">
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={busy}
                  autoComplete="new-password"
                  minLength={8}
                  className="input-base w-full !py-2 text-sm"
                />
              </Field>

              <Field label="Confirmar nueva contraseña *">
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={busy}
                  autoComplete="new-password"
                  minLength={8}
                  className="input-base w-full !py-2 text-sm"
                />
              </Field>

              {error && (
                <p className="rounded-lg bg-[#b4191e]/10 px-3 py-2 text-sm text-[#b4191e]">
                  {error}
                </p>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={busy}
                  className="flex-1 rounded-xl bg-[#066731] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#055527] disabled:opacity-50"
                >
                  {busy ? 'Actualizando…' : 'Cambiar contraseña'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={busy}
                  className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-[#5a5a5a] hover:bg-[#fcf9f2] disabled:opacity-50"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
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
                <h2 className="text-lg font-bold text-[#1f1f1f]">¡Contraseña actualizada!</h2>
                <p className="text-sm text-[#5a5a5a]">Ya podés usar tu nueva contraseña.</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full rounded-xl bg-[#1f1f1f] px-4 py-2.5 text-sm font-semibold text-white hover:bg-black"
            >
              Cerrar
            </button>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-[#1f1f1f]">{label}</label>
      {hint && <p className="mb-1 text-xs text-[#8a8a8a]">{hint}</p>}
      {children}
    </div>
  );
}
