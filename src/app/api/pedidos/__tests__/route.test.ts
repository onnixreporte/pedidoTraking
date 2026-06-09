import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// --- Mocks ---
// vi.hoisted: el mock se eleva junto a vi.mock, evitando el TDZ de variables de módulo.
const prismaMock = vi.hoisted(() => ({
  order: {
    findFirst: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }));
vi.mock('@/lib/notifications', () => ({ notifyNewOrder: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/lib/ids', () => ({
  genPublicId: () => 'pub12345',
  genAdminToken: () => 'admintoken0123456789x',
}));

import { POST } from '../route';

// Devuelve un Order "creado" reflejando los campos enviados a prisma.create.
function buildCreatedOrder(data: Record<string, unknown>) {
  return {
    id: 'order_1',
    publicId: 'pub12345',
    adminToken: 'admintoken0123456789x',
    orderType: 'DELIVERY',
    cliente: 'Ana',
    telefono: null,
    detalle: '1x Café',
    direccion: null,
    total: 20000,
    idChat: null,
    sucursal: null,
    fechaRetiro: null,
    horaRetiro: null,
    avisoCliente: null,
    status: 'ENVIADO_AL_NEGOCIO',
    estimatedMinutes: null,
    deliveryFee: null,
    acceptedAt: null,
    pickupAt: null,
    preparingAt: null,
    readyAt: null,
    deliveredAt: null,
    cancelledAt: null,
    cancelReason: null,
    internalNotes: null,
    additionalNote: null,
    createdAt: new Date('2026-06-09T10:00:00Z'),
    updatedAt: new Date('2026-06-09T10:00:00Z'),
    ...data,
  };
}

function makeReq(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/pedidos', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.APP_BASE_URL = 'https://pedidos.test';
  prismaMock.order.findFirst.mockResolvedValue(null);
  prismaMock.order.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) =>
    buildCreatedOrder(data),
  );
});

describe('POST /api/pedidos — wire-aliases y back-compat', () => {
  it('POST_sin_tipo_pedido_crea_delivery', async () => {
    const res = await POST(
      makeReq({ cliente: 'Ana', direccion: 'Calle 1', detalle: '1x Café', total: 20000 }),
    );
    expect(res.status).toBe(201);
    const callArg = prismaMock.order.create.mock.calls[0][0].data;
    expect(callArg.orderType).toBe('DELIVERY');
    expect(callArg.direccion).toBe('Calle 1');
  });

  it('POST_delivery_sin_direccion_rechaza_400', async () => {
    const res = await POST(makeReq({ cliente: 'Ana', detalle: '1x Café', total: 20000 }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('validation_error');
    expect(prismaMock.order.create).not.toHaveBeenCalled();
  });

  it('POST_acepta_alias_direccion_cliente', async () => {
    const res = await POST(
      makeReq({
        cliente: 'Ana',
        direccion_cliente: 'Av. Mcal 123',
        detalle: '1x Café',
        total: 20000,
      }),
    );
    expect(res.status).toBe(201);
    expect(prismaMock.order.create.mock.calls[0][0].data.direccion).toBe('Av. Mcal 123');
  });

  it('POST_acepta_alias_detalle_pedido_monto_total', async () => {
    const res = await POST(
      makeReq({
        cliente: 'Ana',
        direccion: 'Calle 1',
        detalle_pedido: '2x Empanada',
        monto_total: '35000',
      }),
    );
    expect(res.status).toBe(201);
    const data = prismaMock.order.create.mock.calls[0][0].data;
    expect(data.detalle).toBe('2x Empanada');
    expect(data.total).toBe(35000);
  });

  it('POST_tipo_pedido_case_insensitive', async () => {
    const r1 = await POST(
      makeReq({
        tipo_pedido: 'Delivery',
        cliente: 'Ana',
        direccion: 'C1',
        detalle: 'x',
        total: 1000,
      }),
    );
    expect(r1.status).toBe(201);
    expect(prismaMock.order.create.mock.calls[0][0].data.orderType).toBe('DELIVERY');

    const r2 = await POST(
      makeReq({
        tipo_pedido: 'RETIRO',
        cliente: 'Ana',
        sucursal_seleccionada: 'Villa Morra',
        detalle: 'x',
        total: 1000,
      }),
    );
    expect(r2.status).toBe(201);
    expect(prismaMock.order.create.mock.calls[1][0].data.orderType).toBe('PASAR_A_RETIRAR');
  });
});

describe('POST /api/pedidos — retiro', () => {
  const baseRetiro = {
    tipo_pedido: 'retiro',
    cliente: 'Ana',
    detalle: '1x Café',
    total: 20000,
  };

  it('POST_retiro_sin_sucursal_devuelve_SUCURSAL_REQUIRED', async () => {
    const res = await POST(makeReq({ ...baseRetiro }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('SUCURSAL_REQUIRED');
    expect(prismaMock.order.create).not.toHaveBeenCalled();
  });

  it('POST_retiro_con_sucursal_invalida_devuelve_SUCURSAL_INVALID', async () => {
    const res = await POST(makeReq({ ...baseRetiro, sucursal_seleccionada: 'Sucursal Fantasma' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('SUCURSAL_INVALID');
    expect(prismaMock.order.create).not.toHaveBeenCalled();
  });

  it('POST_retiro_acepta_sucursal_seleccionada', async () => {
    const res = await POST(makeReq({ ...baseRetiro, sucursal_seleccionada: 'Villa Morra' }));
    expect(res.status).toBe(201);
    const data = prismaMock.order.create.mock.calls[0][0].data;
    expect(data.orderType).toBe('PASAR_A_RETIRAR');
    expect(data.sucursal).toBe('VILLA_MORRA'); // resuelto label → código
  });

  it('POST_retiro_acepta_sin_direccion', async () => {
    const res = await POST(makeReq({ ...baseRetiro, sucursal_seleccionada: 'VILLA_MORRA' }));
    expect(res.status).toBe(201);
    expect(prismaMock.order.create.mock.calls[0][0].data.direccion).toBeNull();
  });

  it('POST_retiro_hora_mal_formada_rechaza', async () => {
    const res = await POST(
      makeReq({ ...baseRetiro, sucursal_seleccionada: 'VILLA_MORRA', hora: '25:99' }),
    );
    expect(res.status).toBe(400);
    expect(prismaMock.order.create).not.toHaveBeenCalled();
  });

  it('POST_retiro_aviso_true_sin_hora_devuelve_HORA_RETIRO_REQUIRED', async () => {
    const res = await POST(
      makeReq({ ...baseRetiro, sucursal_seleccionada: 'VILLA_MORRA', aviso: true }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('HORA_RETIRO_REQUIRED');
    expect(prismaMock.order.create).not.toHaveBeenCalled();
  });

  it('POST_retiro_aviso_true_con_hora_valida_crea', async () => {
    const res = await POST(
      makeReq({
        ...baseRetiro,
        sucursal_seleccionada: 'VILLA_MORRA',
        aviso: true,
        hora: '14:30',
      }),
    );
    expect(res.status).toBe(201);
    const data = prismaMock.order.create.mock.calls[0][0].data;
    expect(data.avisoCliente).toBe(true);
    expect(data.horaRetiro).toBe('14:30');
  });

  it('POST_retiro_aviso_false_sin_hora_crea', async () => {
    const res = await POST(
      makeReq({ ...baseRetiro, sucursal_seleccionada: 'VILLA_MORRA', aviso: false }),
    );
    expect(res.status).toBe(201);
    const data = prismaMock.order.create.mock.calls[0][0].data;
    expect(data.avisoCliente).toBe(false);
    expect(data.horaRetiro).toBeNull();
  });
});

describe('POST /api/pedidos — idempotencia', () => {
  it('POST_idempotencia_se_preserva_para_retiro', async () => {
    const existing = buildCreatedOrder({
      id: 'order_existing',
      orderType: 'PASAR_A_RETIRAR',
      sucursal: 'VILLA_MORRA',
      publicId: 'existingpub',
      adminToken: 'existingadmintoken00',
    });
    prismaMock.order.findFirst.mockResolvedValueOnce(existing);

    const body = {
      tipo_pedido: 'retiro',
      cliente: 'Ana',
      sucursal_seleccionada: 'VILLA_MORRA',
      detalle: '1x Café',
      total: 20000,
      id_chat: 'chat-1',
    };
    const res = await POST(makeReq(body));
    expect(res.status).toBe(200); // idempotente → no 201
    const links = await res.json();
    expect(links.link_tracking).toContain('existingpub');
    expect(prismaMock.order.create).not.toHaveBeenCalled();
  });
});
