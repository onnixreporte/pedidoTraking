export type DetalleLine = { product: string; price: string | null };

export function parseDetalle(text: string): DetalleLine[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const idx = line.lastIndexOf(' - ');
      if (idx === -1) return { product: line, price: null };
      return {
        product: line.slice(0, idx).trim(),
        price: line.slice(idx + 3).trim(),
      };
    });
}
