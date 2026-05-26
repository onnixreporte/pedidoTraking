'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[admin error boundary]', error);
  }, [error]);

  return (
    <main className="mx-auto flex max-w-md flex-col items-center justify-center gap-4 px-4 py-20 text-center">
      <div className="text-4xl">😵</div>
      <h2 className="text-lg font-semibold">Algo falló</h2>
      <p className="text-sm text-gray-500">
        No pudimos cargar el panel. Probá recargar; si sigue, mirá los logs en Vercel.
      </p>
      <button
        onClick={reset}
        className="rounded-xl bg-[#066731] px-4 py-2 text-sm font-semibold text-white hover:bg-[#055527]"
      >
        Reintentar
      </button>
    </main>
  );
}
