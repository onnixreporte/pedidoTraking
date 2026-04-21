# Pedidos — Tracking MVP

Tracking de pedidos a domicilio. Botmaker postea el pedido y se generan dos links:
uno público para el cliente y uno privado para el local.

Spec completo: [docs/superpowers/specs/2026-04-20-pedidos-tracking-design.md](docs/superpowers/specs/2026-04-20-pedidos-tracking-design.md)

## Stack

Next.js 15 (App Router) + Postgres (Railway) + Prisma + Tailwind. Deploy en Vercel.

## Setup local

```bash
npm install
cp .env.example .env   # editar DATABASE_URL y APP_BASE_URL
npx prisma migrate dev --name init
npm run dev
```

Variables:
- `DATABASE_URL` — connection string de Postgres (Railway).
- `APP_BASE_URL` — base sin trailing slash (ej. `http://localhost:3000` o `https://tu-app.vercel.app`). Se usa para construir los links de respuesta.

## Endpoints

| Método | Path | Descripción |
|---|---|---|
| `POST` | `/api/pedidos` | Crear pedido (idempotente 5 min) |
| `GET` | `/api/track/{publicId}` | Estado para el cliente |
| `GET` | `/api/admin/{adminToken}` | Estado para el local |
| `PATCH` | `/api/admin/{adminToken}` | Cambiar estado / tiempo estimado |

## Probar el POST

```bash
curl -X POST http://localhost:3000/api/pedidos \
  -H "Content-Type: application/json" \
  -d '{
    "detalle": "1x Empanada de pollo - Gs. 12.000\n2x Coca 500ml - Gs. 10.000",
    "direccion": "Av. Mcal. López 1234",
    "total": 22000,
    "cliente": "Juan Pérez",
    "id_chat": "wa_595981234567"
  }'
```

Respuesta:
```json
{
  "link_tracking": "http://localhost:3000/t/a3f9k2x8",
  "link_admin":    "http://localhost:3000/c/Xk7pN2vQ8rT4mY9wZ3cF5"
}
```

## Deploy en Vercel

1. Push a GitHub, importar el repo en Vercel.
2. Configurar env vars: `DATABASE_URL`, `APP_BASE_URL`.
3. En Railway, crear DB Postgres y copiar la connection string.
4. Primera vez: correr `npx prisma migrate deploy` apuntando a la DB de prod (o usar el dashboard de Vercel para correrlo).

`prisma generate` corre solo en cada build (`postinstall` + `build` script).
