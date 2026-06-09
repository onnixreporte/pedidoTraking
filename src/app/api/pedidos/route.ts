import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { SUCURSALES, resolveSucursal } from '@/lib/sucursales';
import { STATUSES_LINEAR_DELIVERY } from '@/lib/status';
import { createOrder, type PedidoInput } from '@/lib/orders/create';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

const numericish = z
  .union([z.number(), z.string().regex(/^\d+$/)])
  .transform((v) => (typeof v === 'number' ? v : Number(v)))
  .refine((n) => Number.isInteger(n) && n >= 0, 'total debe ser entero >= 0');

/**
 * Normaliza el payload del wire (Botmaker manda nombres largos en snake_case)
 * a los nombres internos, y el discriminador `tipo_pedido` (string libre,
 * case-insensitive) al enum interno `orderType`. Es el preprocess que envuelve
 * al discriminatedUnion. Centraliza el mapeo wire → DB en un solo lugar.
 */
function normalizeBotmakerPayload(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') return raw;
  const src = raw as Record<string, unknown>;
  const out: Record<string, unknown> = { ...src };

  // Aliases de campos comunes (acción Botmaker vieja usa nombres cortos).
  if (out.detalle === undefined && 'detalle_pedido' in src) out.detalle = src.detalle_pedido;
  if (out.total === undefined && 'monto_total' in src) out.total = src.monto_total;
  if (out.direccion === undefined && 'direccion_cliente' in src)
    out.direccion = src.direccion_cliente;
  if (out.aditionalnota === undefined && 'adicionalnota' in src)
    out.aditionalnota = src.adicionalnota;

  // Alias de sucursal.
  if (out.sucursal === undefined && 'sucursal_seleccionada' in src)
    out.sucursal = src.sucursal_seleccionada;

  // Sucursal: Botmaker manda el LABEL elegido por el cliente ("Villa Morra",
  // "Terrazas del Paseo la Galería"). Lo resolvemos al CÓDIGO canónico para que
  // z.enum(SUCURSALES) lo acepte. Si no resuelve, lo dejamos como vino y Zod
  // lo rechaza con SUCURSAL_INVALID.
  if (typeof out.sucursal === 'string') {
    const code = resolveSucursal(out.sucursal);
    if (code) out.sucursal = code;
  }

  // Discriminador: tipo_pedido (string libre) → orderType (enum interno).
  if (out.orderType === undefined) {
    const tp = src.tipo_pedido;
    if (typeof tp === 'string') {
      const v = tp.trim().toLowerCase();
      if (v === 'delivery') out.orderType = 'DELIVERY';
      else if (v === 'retiro' || v === 'pasar_a_retirar' || v === 'pasar a retirar') {
        out.orderType = 'PASAR_A_RETIRAR';
      } else {
        // valor desconocido: lo dejamos pasar tal cual y Zod lo rechaza con validation_error
        out.orderType = tp;
      }
    } else {
      // back-compat: sin tipo_pedido → DELIVERY
      out.orderType = 'DELIVERY';
    }
  }

  return out;
}

const BaseSchema = z.object({
  detalle: z.string().trim().min(1),
  total: numericish,
  cliente: z.string().trim().min(1),
  telefono: z.string().trim().min(6).max(40).optional(),
  aditionalnota: z.string().trim().max(500).optional(),
  id_chat: z.string().trim().min(1).optional(),
  // status inicial: solo estados del flow lineal delivery (back-compat).
  // PREPARANDO/PUEDE_PASAR_A_RETIRAR no son aceptados en creación (R28) — solo via PATCH.
  status: z.enum(STATUSES_LINEAR_DELIVERY).optional(),
  estimatedMinutes: z.number().int().positive().optional(),
});

const DeliverySchema = BaseSchema.extend({
  orderType: z.literal('DELIVERY'),
  direccion: z.string().trim().min(1),
  deliveryFee: z.number().int().nonnegative().optional(),
});

const RetiroSchema = BaseSchema.extend({
  orderType: z.literal('PASAR_A_RETIRAR'),
  direccion: z.string().trim().min(1).optional(),
  sucursal: z.enum(SUCURSALES),
  // wire: fecha_retiro / aviso / hora — internos: fechaRetiro / avisoCliente / horaRetiro
  fecha_retiro: z.coerce.date().optional(),
  aviso: z.boolean().optional(),
  hora: z.string().regex(HHMM).optional(),
  deliveryFee: z.never().optional(),
});

// z.discriminatedUnion exige que cada rama sea un ZodObject puro, por eso la regla
// aviso↔hora (R26) se aplica con superRefine sobre el union, no como .refine en la rama.
const PedidoSchema = z
  .discriminatedUnion('orderType', [DeliverySchema, RetiroSchema])
  .superRefine((d, ctx) => {
    if (d.orderType === 'PASAR_A_RETIRAR') {
      if (d.aviso === true && (d.hora == null || !HHMM.test(d.hora))) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'HORA_RETIRO_REQUIRED',
          path: ['hora'],
        });
      }
    }
  });

const FinalSchema = z.preprocess(normalizeBotmakerPayload, PedidoSchema);

/**
 * Traduce los issues de Zod a los códigos de error explícitos del contrato
 * (SUCURSAL_REQUIRED, SUCURSAL_INVALID, HORA_RETIRO_REQUIRED). Devuelve null si
 * no aplica ninguno y se debe usar el `validation_error` genérico.
 */
function explicitErrorFromIssues(issues: z.ZodIssue[]): { error: string; message: string } | null {
  for (const issue of issues) {
    const path = issue.path.join('.');
    if (path === 'sucursal') {
      // Falta el campo (undefined) → REQUIRED; valor fuera del catálogo → INVALID.
      if (issue.code === 'invalid_type') {
        return {
          error: 'SUCURSAL_REQUIRED',
          message: 'Elegí la sucursal para el pedido de retiro',
        };
      }
      return {
        error: 'SUCURSAL_INVALID',
        message: 'La sucursal seleccionada no es válida',
      };
    }
    if (issue.message === 'HORA_RETIRO_REQUIRED') {
      return {
        error: 'HORA_RETIRO_REQUIRED',
        message: 'Si aviso=true se debe enviar la hora de retiro',
      };
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = FinalSchema.safeParse(body);
  if (!parsed.success) {
    console.error('[POST /api/pedidos] validation failed', {
      received: body,
      issues: parsed.error.issues,
    });
    const explicit = explicitErrorFromIssues(parsed.error.issues);
    if (explicit) {
      return NextResponse.json(explicit, { status: 400 });
    }
    return NextResponse.json(
      { error: 'validation_error', details: parsed.error.issues },
      { status: 400 },
    );
  }

  const result = await createOrder(parsed.data as PedidoInput);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, message: result.message },
      { status: result.status },
    );
  }

  // Idempotencia: devolvemos los links del pedido existente con 200 (no 201).
  return NextResponse.json(result.links, { status: result.idempotent ? 200 : 201 });
}
