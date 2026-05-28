# Pedidos — Tracking + Panel admin

Sistema de tracking de pedidos a domicilio para 1 sucursal (Café de Acá). Botmaker postea cada pedido vía API, se generan 2 links únicos (cliente y admin), y el local los gestiona desde un panel autenticado.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript strict · Prisma · Postgres (Railway) · Tailwind · JWT cookies (jose) · bcryptjs · Vitest. Deploy en Vercel.

## Setup local

```bash
npm install
cp .env.example .env   # editar las env vars
npx prisma generate
npm run dev            # http://localhost:3000
```

## Variables de entorno

| Variable | Obligatoria | Propósito |
|---|---|---|
| `DATABASE_URL` | sí | Postgres connection string (Railway) |
| `APP_BASE_URL` | sí | URL pública (sin trailing slash) |
| `JWT_SECRET` | sí | ≥32 chars para firmar cookies de sesión |
| `ADMIN_BOOTSTRAP_SECRET` | sí | Header secret de `POST /api/admin/users` |
| `ADMIN_EMAIL` | opcional | Notificaciones (stub) |
| `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` | opcional | Rate limit persistente serverless |
| `SENTRY_DSN` | opcional | Error tracking (no-op si vacío) |

Generar secrets: `openssl rand -base64 48` (JWT) y `openssl rand -base64 32` (bootstrap).

## Endpoints

| Método | Path | Auth | Descripción |
|---|---|---|---|
| POST | `/api/pedidos` | público | Ingestión desde Botmaker (idempotente 5 min) |
| GET | `/api/track/{publicId}` | público | DTO cliente sin tokens |
| GET/PATCH | `/api/admin/{adminToken}` | URL secreta | Control por pedido (sin login) |
| GET/PATCH | `/api/orders[/...]` | cookie | Panel autenticado |
| POST | `/api/auth/login` | público (rate-limited) | Login admin |
| POST | `/api/admin/users` | header secret | Crear admin (bootstrap) |
| GET | `/api/health` | público | Healthcheck (200 / 503) |

## Vistas

- `/t/{publicId}` — cliente, tracking read-only.
- `/c/{adminToken}` — local/repartidor, control por pedido (capability URL).
- `/admin` — staff, panel autenticado.
- `/admin/login` — login email + password.

## Primer admin (bootstrap)

```bash
curl -X POST https://tu-app.vercel.app/api/admin/users \
  -H "x-admin-bootstrap-secret: <SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"email":"dueno@local.com","password":"PasswordFuerte123!"}'
```

## Comandos

```bash
npm run dev              # next dev
npm run build            # prisma generate + migrate deploy + next build
npm run lint             # eslint .
npm run format           # prettier --write .
npm test                 # vitest
npm run test:coverage    # vitest + coverage
```

## Verificación de entorno

```bash
bash harness-nestjs-next/init.sh
```

Corre prisma generate + typecheck + lint + tests + prisma validate. Tiene que terminar verde.

## Deploy

Push a `main` → Vercel deploya. CI corre en cada PR (`.github/workflows/ci.yml`).

## Más docs

- `CLAUDE.md` — arquitectura para Claude Code.
- `CONTRIBUTING.md` — cómo contribuir.
- `harness-nestjs-next/docs/birth/PROJECT_BLUEPRINT.md` — blueprint retroactivo.
- `harness-nestjs-next/docs/birth/RESCUE_PLAN.md` — historial del rescate.
- `harness-nestjs-next/docs/birth/ENFORCEMENT_SETUP.md` — config de tooling.
