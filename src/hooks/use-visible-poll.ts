'use client';

import { useEffect, useState } from 'react';

export function useVisiblePoll<T>(url: string, initial: T, intervalMs = 5000) {
  const [data, setData] = useState<T>(initial);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;

    const fetchOnce = async () => {
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) return;
        const json = (await res.json()) as T;
        if (!cancelled) setData(json);
      } catch {
        // swallow — siguiente tick reintenta
      }
    };

    const start = () => {
      if (interval !== null) return;
      void fetchOnce();
      interval = setInterval(fetchOnce, intervalMs);
    };

    const stop = () => {
      if (interval !== null) {
        clearInterval(interval);
        interval = null;
      }
    };

    const onVisChange = () => {
      if (document.visibilityState === 'visible') start();
      else stop();
    };

    if (document.visibilityState === 'visible') start();
    document.addEventListener('visibilitychange', onVisChange);

    return () => {
      cancelled = true;
      stop();
      document.removeEventListener('visibilitychange', onVisChange);
    };
  }, [url, intervalMs]);

  return [data, setData] as const;
}
