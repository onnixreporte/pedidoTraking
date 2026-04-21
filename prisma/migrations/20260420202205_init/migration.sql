-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('ENVIADO_AL_NEGOCIO', 'ACEPTADO', 'REPARTIDOR_EN_CAMINO', 'ENVIADO', 'ENTREGADO');

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "adminToken" TEXT NOT NULL,
    "cliente" TEXT NOT NULL,
    "detalle" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "total" INTEGER NOT NULL,
    "idChat" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'ENVIADO_AL_NEGOCIO',
    "estimatedMinutes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Order_publicId_key" ON "Order"("publicId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_adminToken_key" ON "Order"("adminToken");

-- CreateIndex
CREATE INDEX "Order_idChat_total_createdAt_idx" ON "Order"("idChat", "total", "createdAt");
