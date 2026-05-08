export type DetalleLine = { product: string; price: string | null };

export function parseDetalle(text: string): DetalleLine[] {
  const out: DetalleLine[] = [];

  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;

    const subItems = line.split(/,\s*(?=\d+\s*x\s)/i);

    for (const sub of subItems) {
      const trimmed = sub.trim();
      if (!trimmed) continue;

      const idx = trimmed.lastIndexOf(' - ');
      if (idx === -1) {
        out.push({ product: trimmed, price: null });
      } else {
        out.push({
          product: trimmed.slice(0, idx).trim(),
          price: trimmed.slice(idx + 3).trim(),
        });
      }
    }
  }

  return out;
}
