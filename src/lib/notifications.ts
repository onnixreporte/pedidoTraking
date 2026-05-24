import type { Order } from '@prisma/client';
import { renderNewOrderEmail } from './email-templates';

export async function notifyNewOrder(order: Order): Promise<void> {
  try {
    const to = process.env.ADMIN_EMAIL;
    const { subject, html } = renderNewOrderEmail(order);

    if (!to) {
      console.warn('[notify] ADMIN_EMAIL no configurado — skip email');
      return;
    }

    // STUB: hasta que se decida proveedor (Resend / Nodemailer / SendGrid)
    // solo loguea el contenido. Reemplazar este bloque por la llamada real.
    console.log('[notify] would send email', {
      to,
      subject,
      htmlBytes: html.length,
      orderId: order.id,
      publicId: order.publicId,
    });

    // Cuando enchufes el servicio, ejemplo Resend:
    //
    //   import { Resend } from 'resend';
    //   const resend = new Resend(process.env.RESEND_API_KEY!);
    //   await resend.emails.send({ from: 'pedidos@cafedeaca.com', to, subject, html });
  } catch (err) {
    // Nunca tirar — el pedido ya se creó OK, el email es side effect
    console.error('[notify] failed', err);
  }
}
