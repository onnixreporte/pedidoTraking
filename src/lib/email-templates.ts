import type { Order } from '@prisma/client';
import { formatGs } from './format';
import { parseDetalle } from './parse-detalle';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function adminLink(order: Pick<Order, 'adminToken'>): string {
  const base = (process.env.APP_BASE_URL ?? '').replace(/\/+$/, '');
  return `${base}/c/${order.adminToken}`;
}

export type NewOrderEmail = { subject: string; html: string };

export function renderNewOrderEmail(order: Order): NewOrderEmail {
  const total = (order.total ?? 0) + (order.deliveryFee ?? 0);
  const subject = `Nuevo pedido — ${order.cliente} — ${formatGs(total)}`;

  const items = parseDetalle(order.detalle)
    .map(
      (it) =>
        `<tr><td style="padding:6px 8px;border-bottom:1px solid #eee">${escapeHtml(it.product)}</td>` +
        `<td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right">${escapeHtml(it.price ?? '')}</td></tr>`,
    )
    .join('');

  const telefonoRow = order.telefono
    ? `<tr><td style="color:#666">Teléfono</td><td>${escapeHtml(order.telefono)}</td></tr>`
    : '';

  const deliveryRow =
    order.deliveryFee && order.deliveryFee > 0
      ? `<tr><td style="color:#666">Delivery</td><td>${formatGs(order.deliveryFee)}</td></tr>`
      : '';

  const html = `<!doctype html>
<html lang="es">
<head><meta charset="utf-8"><title>${escapeHtml(subject)}</title></head>
<body style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#fcf9f2;margin:0;padding:24px;color:#111">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,0.05);border-top:4px solid #066731">
    <h1 style="margin:0 0 4px;font-size:20px">📦 Nuevo pedido</h1>
    <p style="margin:0 0 20px;color:#666">Acabás de recibir un pedido nuevo de <b>${escapeHtml(order.cliente)}</b>.</p>

    <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:16px">
      <tr><td style="color:#666;width:120px">Cliente</td><td><b>${escapeHtml(order.cliente)}</b></td></tr>
      ${telefonoRow}
      <tr><td style="color:#666">Dirección</td><td>${escapeHtml(order.direccion)}</td></tr>
      ${deliveryRow}
      <tr><td style="color:#666">Total</td><td><b>${formatGs(total)}</b></td></tr>
    </table>

    <h2 style="font-size:14px;text-transform:uppercase;color:#666;margin:24px 0 8px">Items</h2>
    <table style="width:100%;border-collapse:collapse;font-size:14px;border:1px solid #eee;border-radius:8px;overflow:hidden">
      ${items}
    </table>

    <div style="margin-top:24px;text-align:center">
      <a href="${escapeHtml(adminLink(order))}" style="display:inline-block;background:#066731;color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:600">Abrir pedido</a>
    </div>

    <p style="margin-top:24px;color:#999;font-size:12px;text-align:center">
      Café de Acá · Sistema de pedidos
    </p>
  </div>
</body>
</html>`;

  return { subject, html };
}
