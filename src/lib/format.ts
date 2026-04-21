const fmt = new Intl.NumberFormat('es-PY');

export const formatGs = (n: number) => `Gs. ${fmt.format(n)}`;
