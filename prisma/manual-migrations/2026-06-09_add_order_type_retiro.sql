-- Migración manual idempotente: tipo de pedido PASAR_A_RETIRAR
-- Feature: tipo-pedido-retiro (harness specs/tipo-pedido-retiro)
-- Fecha: 2026-06-09
--
-- Aplicar con:  psql "$DATABASE_URL" -f prisma/manual-migrations/2026-06-09_add_order_type_retiro.sql
--
-- Es idempotente: seguro para correr varias veces. No destruye filas existentes.
-- Después de aplicar, correr `npx prisma generate` para refrescar el client tipado.

BEGIN;

-- 1. Crear enum OrderType (idempotente vía EXCEPTION duplicate_object)
DO $$ BEGIN
  CREATE TYPE "OrderType" AS ENUM ('DELIVERY', 'PASAR_A_RETIRAR');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. Extender enum OrderStatus con los dos nuevos valores (sin tocar el orden existente)
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'PREPARANDO';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'PUEDE_PASAR_A_RETIRAR';

-- 3. Agregar columnas a Order (idempotente con IF NOT EXISTS)
--    orderType NOT NULL DEFAULT 'DELIVERY' → registros existentes quedan como delivery.
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "orderType"    "OrderType" NOT NULL DEFAULT 'DELIVERY';
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "sucursal"     TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "fechaRetiro"  TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "horaRetiro"   TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "avisoCliente" BOOLEAN;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "preparingAt"  TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "readyAt"      TIMESTAMP(3);

-- 4. Relajar direccion a nullable (idempotente: DROP NOT NULL no falla si ya es nullable)
ALTER TABLE "Order" ALTER COLUMN "direccion" DROP NOT NULL;

-- 5. Índice combinado (idempotente con IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS "Order_orderType_status_createdAt_idx"
  ON "Order"("orderType", "status", "createdAt");

COMMIT;
