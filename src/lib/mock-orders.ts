import type { OrderDto } from './dto';
import type { Status } from './status';

const mockOrder = (overrides: Partial<OrderDto>): OrderDto => ({
  cliente: 'Cliente',
  direccion: 'Dirección',
  detalle: '1x Producto',
  total: 0,
  status: 'ENVIADO_AL_NEGOCIO',
  estimatedMinutes: null,
  deliveryFee: null,
  createdAt: new Date().toISOString(),
  ...overrides,
});

export const MOCK_ORDERS: OrderDto[] = [
  mockOrder({
    cliente: 'Juan Pérez',
    direccion: 'Av. Mcal. López 1234',
    detalle: '1x Empanada de pollo\n2x Coca 500ml',
    total: 22000,
    status: 'ENVIADO_AL_NEGOCIO',
    estimatedMinutes: null,
    createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
  }),
  mockOrder({
    cliente: 'María García',
    direccion: 'Av. Brasilia 567',
    detalle: '3x Torta de chocolate\n1x Café',
    total: 45000,
    status: 'ACEPTADO',
    estimatedMinutes: 25,
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  }),
  mockOrder({
    cliente: 'Carlos López',
    direccion: 'Senador Long 890',
    detalle: '2x Sandwich de milanesa',
    total: 15000,
    status: 'REPARTIDOR_EN_CAMINO',
    estimatedMinutes: 20,
    createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
  }),
  mockOrder({
    cliente: 'Ana Rodríguez',
    direccion: 'Av. Eusebio Ayala 234',
    detalle: '1x Wraps\n1x Jugo de naranja',
    total: 33000,
    status: 'ENTREGADO',
    estimatedMinutes: 30,
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  }),
  mockOrder({
    cliente: 'Luis Martínez',
    direccion: 'Av. España 789',
    detalle: '1x Café con leche',
    total: 8000,
    status: 'ACEPTADO',
    estimatedMinutes: 15,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  }),
];

export const STATUS_COLORS: Record<Status, { border: string; bg: string; badge: string }> = {
  ENVIADO_AL_NEGOCIO: { border: 'border-gray-300', bg: 'bg-gray-50', badge: 'bg-gray-100 text-gray-700' },
  ACEPTADO: { border: 'border-blue-500', bg: 'bg-blue-50', badge: 'bg-blue-100 text-blue-700' },
  REPARTIDOR_EN_CAMINO: { border: 'border-amber-500', bg: 'bg-amber-50', badge: 'bg-amber-100 text-amber-700' },
  ENTREGADO: { border: 'border-green-500', bg: 'bg-green-50', badge: 'bg-green-100 text-green-700' },
};