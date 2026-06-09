# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

Next.js 16 (App Router, React 19) + TypeScript strict + Tailwind + Prisma + Postgres. Auth via JWT (jose) in HttpOnly cookie. Vitest for tests. Sentry for errors (opt-in). Upstash Redis for rate limit (opt-in, fallback in-memory). Deploy: Vercel + Railway Postgres. CI via GitHub Actions.

## Commands

```bash
npm run dev                                  # next dev
npm run build                                # prisma generate + prisma migrate deploy + next build
npm run lint                                 # eslint .
npm run format                               # prettier --write .
npm test                                     # vitest run
npm run test:coverage                        # with coverage
bash harness-nestjs-next/init.sh             # full env verification (prisma+typecheck+lint+test+audit)
npx prisma migrate dev --name <name>         # new migration (local)
npx prisma migrate deploy                    # apply migrations (prod)
```

Tests live in `src/lib/*.test.ts`. `postinstall` runs `prisma generate`.

Required env: `DATABASE_URL`, `APP_BASE_URL` (no trailing slash, used to build tracking/admin links), `JWT_SECRET` (≥32 chars), `ADMIN_BOOTSTRAP_SECRET` (gates `POST /api/admin/users`). Optional: `ADMIN_EMAIL` (email notification stub target).

## Architecture

**Domain.** One model: `Order`. Two opaque link tokens per order:

- `publicId` (8-char nanoid, lowercase alphabet) → `/t/{publicId}` customer view (read-only).
- `adminToken` (21-char nanoid) → `/c/{adminToken}` per-order shop view (no login, capability URL). Different from the authenticated admin panel.

Linear status flow `ENVIADO_AL_NEGOCIO → ACEPTADO → REPARTIDOR_EN_CAMINO → ENTREGADO`, plus terminal `CANCELADO`. Defined in `src/lib/status.ts` with label maps (banner / title / timeline-done / timeline-future). Each transition stamps its own timestamp column (`acceptedAt`, `pickupAt`, `deliveredAt`, `cancelledAt`) — `PATCH /api/admin/[adminToken]` sets them server-side based on the new status (route.ts:62-68).

**Two distinct auth surfaces — do not conflate:**

1. **Capability tokens.** `/c/[adminToken]` and `/api/admin/[adminToken]` — anyone with the URL can read/PATCH that one order. No session.
2. **Authenticated admin panel.** `/admin/*` and `/api/orders*` — session cookie (`pedidos_session`) verified by `src/middleware.ts` (matcher `/admin/:path*`) and by `getSession()` in `src/lib/session.ts`. Login at `/admin/login` → `POST /api/auth/login` issues HS256 JWT (7-day TTL). New admins bootstrapped via `POST /api/admin/users` with `x-admin-bootstrap-secret` header.

**API surface.**

- `POST /api/pedidos` — public ingest from Botmaker. Idempotent 5-min window keyed on `(idChat, total, detalle)` (see `route.ts:43-49`). Returns `{ link_tracking, link_admin }`.
- `GET /api/track/[publicId]` — customer-safe DTO (`toOrderPublicDto`, no tokens).
- `GET|PATCH /api/admin/[adminToken]` — full admin DTO (`toOrderAdminDto`).
- `GET /api/orders` — paginated list, session-gated. `GET|PATCH /api/orders/[id]` similar.
- `POST /api/auth/login` / `POST /api/auth/logout` / `GET /api/auth/me`.

**DTO boundary.** Never return raw Prisma `Order` over HTTP. Use `toOrderPublicDto` (strips `adminToken`, `telefono`, `internalNotes`, `cancelReason`) for `/t/` and `/api/track/`; `toOrderAdminDto` everywhere admin (`src/lib/dto.ts`).

**Idempotency & input.** `POST /api/pedidos` accepts `total` as number OR digit-string (`numericish` in `src/app/api/pedidos/route.ts`). When extending the ingest schema, preserve that coercion — Botmaker sends strings. `detalle` is free-form text; parsed for display only by `src/lib/parse-detalle.ts` (splits on newline AND on `,\s*(?=\d+\s*x\s)`, price after last `-`).

**IDs.** Always use `genPublicId()` / `genAdminToken()` from `src/lib/ids.ts` — the public alphabet excludes confusable chars (`0/o/1/l/i`).

**Links.** Always build URLs with `buildLinks()` from `src/lib/links.ts` (strips trailing slash from `APP_BASE_URL`). Do not template URLs inline.

**Rate limit.** `src/lib/rate-limit.ts` uses Upstash Redis (`Ratelimit.slidingWindow`) when `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` are set, with an in-memory fallback otherwise. `rateLimit()` is **async** — callers MUST `await` it (`if (!(await rateLimit(...)))`); a missing `await` makes `!Promise` always `false`, silently disabling the limit (guarded now by the ESLint rule `@typescript-eslint/no-misused-promises`). Used by `POST /api/auth/login`, `POST /api/auth/change-password`, `POST /api/admin/users`. Without the Upstash env vars in prod the fallback is in-memory (no-op across serverless instances) — set them in Vercel for real protection.

**Notifications.** `src/lib/notifications.ts` is a logging stub — no provider wired. Must swallow errors (order creation must not fail because email failed).

**Routes.**

- `/` landing, `/t/[publicId]` customer tracking, `/c/[adminToken]` shop per-order page.
- `/admin` panel (orders list + detail drawer), `/admin/login`.

All route handlers use `runtime = 'nodejs'` + `dynamic = 'force-dynamic'` (bcrypt and Prisma need Node runtime; middleware uses `jose` which is Edge-safe).

## Conventions

- Language: code in English, user-facing strings + commit messages in Spanish.
- Prisma client singleton from `src/lib/prisma` — never `new PrismaClient()` elsewhere.
- Zod for every request body / query. Return `{ error: 'validation_error', details: parsed.error.issues }` on 400.
- Status changes must go through the PATCH handler so timestamps stay consistent. Do not write `acceptedAt` etc. from the client.
- When adding a status, update `STATUSES` / `STATUSES_LINEAR` and all four label maps in `src/lib/status.ts`, plus the timestamp switch in `src/app/api/admin/[adminToken]/route.ts`.

## Harness (proceso SDD)

Este proyecto adopta el harness `harness-nestjs-next/` (gitignored, vive como control plane encapsulado). Cuando el usuario diga "trabajemos con el harness" o "modo leader", leé `harness-nestjs-next/CLAUDE.md` y actuá según ese rol. El flujo SDD vive en:

- `harness-nestjs-next/feature_list.json` — cola de features
- `harness-nestjs-next/specs/<name>/` — requirements/design/tasks por feature
- `harness-nestjs-next/progress/{current,history}.md` — bitácora
- `harness-nestjs-next/docs/birth/` — RESCUE_PLAN, blueprint retroactivo

Para verificar el entorno: `cd harness-nestjs-next && ./init.sh` (lint + typecheck + prisma validate sobre el proyecto en `..`).
