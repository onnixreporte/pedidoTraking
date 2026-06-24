# Migraciones manuales

Migraciones que se aplican **a mano** porque tocan datos en producción o requieren
una ventana específica. NO las corre `prisma migrate deploy` automáticamente.

> ⚠️ **Esta carpeta vive en `prisma/manual-migrations/`, NO en `prisma/migrations/`.**
> El motor de Prisma escanea `prisma/migrations/` y exige que cada subcarpeta tenga un
> `migration.sql`. Si ponés estos archivos ahí, `prisma migrate deploy` (que corre en el
> build de Vercel) falla con **P3015**. Por eso van acá, fuera del alcance del motor.

## Cómo aplicar

```bash
psql "$DATABASE_URL" -f prisma/manual-migrations/<archivo>.sql
```

Después de aplicar cualquiera de estas, regenerá el client tipado:

```bash
npx prisma generate
```

## Reglas

- Todas son **idempotentes**: seguras para correr varias veces (usan `IF NOT EXISTS`,
  `ADD VALUE IF NOT EXISTS`, `EXCEPTION WHEN duplicate_object`, `DROP NOT NULL`).
- Si tenés dudas, corré primero contra una copia de la base.
- No las edites una vez aplicadas en prod. Si necesitás cambiar algo, creá un archivo nuevo.

## Archivos

### `2026-06-09_add_order_type_retiro.sql`

Feature **tipo-pedido-retiro**. Introduce el segundo tipo de pedido `PASAR_A_RETIRAR`:

- Crea el enum `OrderType` (`DELIVERY`, `PASAR_A_RETIRAR`).
- Extiende `OrderStatus` con `PREPARANDO` y `PUEDE_PASAR_A_RETIRAR`.
- Agrega a `Order`: `orderType` (NOT NULL DEFAULT `DELIVERY`), `sucursal`, `fechaRetiro`,
  `horaRetiro`, `avisoCliente`, `preparingAt`, `readyAt` (todos nullable salvo `orderType`).
- Relaja `Order.direccion` a nullable.
- Crea el índice combinado `(orderType, status, createdAt)`.

Verificación post-migración: los pedidos preexistentes quedan con `orderType='DELIVERY'`,
`direccion` no nula, y los campos de retiro (`sucursal`, `fechaRetiro`, etc.) en `NULL`.

> Nota PostgreSQL: `ALTER TYPE ... ADD VALUE` no es transaccional en algunas versiones
> antiguas. Como este script NO usa los valores nuevos del enum dentro de la misma
> transacción (solo agrega columnas/índice), corre bien dentro del `BEGIN/COMMIT`.
> Si tu versión de Postgres rechaza el `ADD VALUE` dentro de la transacción, corré las
> dos líneas `ALTER TYPE "OrderStatus" ADD VALUE ...` por separado, fuera del bloque.
