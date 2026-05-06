-- Stock reservation flow: Variant stock -> stockOnHand/stockReserved, new StockReservation model, CampaignItem stock fields.

-- CreateEnum
CREATE TYPE "StockReservationStatus" AS ENUM ('active', 'confirmed', 'released', 'expired');

-- Variants: add new columns, migrate data, drop old stock
ALTER TABLE "variants" ADD COLUMN "stock_on_hand" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "variants" ADD COLUMN "stock_reserved" INTEGER NOT NULL DEFAULT 0;
UPDATE "variants" SET "stock_on_hand" = "stock", "stock_reserved" = 0 WHERE "stock" IS NOT NULL;
UPDATE "variants" SET "stock_on_hand" = 0, "stock_reserved" = 0 WHERE "stock" IS NULL;
ALTER TABLE "variants" ALTER COLUMN "stock_on_hand" DROP DEFAULT;
ALTER TABLE "variants" ALTER COLUMN "stock_reserved" DROP DEFAULT;
ALTER TABLE "variants" DROP COLUMN "stock";

-- CampaignItem: add stock fields (campaign_stock remains as campaign cap/limit)
ALTER TABLE "campaign_items" ADD COLUMN "stock_on_hand" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "campaign_items" ADD COLUMN "stock_reserved" INTEGER NOT NULL DEFAULT 0;
UPDATE "campaign_items" SET "stock_on_hand" = "campaign_stock", "stock_reserved" = 0;
ALTER TABLE "campaign_items" ALTER COLUMN "stock_on_hand" DROP DEFAULT;
ALTER TABLE "campaign_items" ALTER COLUMN "stock_reserved" DROP DEFAULT;

-- StockReservation table
CREATE TABLE "stock_reservations" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "variant_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "status" "StockReservationStatus" NOT NULL DEFAULT 'active',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_reservations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "stock_reservations_order_id_idx" ON "stock_reservations"("order_id");
CREATE INDEX "stock_reservations_variant_id_idx" ON "stock_reservations"("variant_id");
CREATE INDEX "stock_reservations_status_idx" ON "stock_reservations"("status");
CREATE INDEX "stock_reservations_expires_at_idx" ON "stock_reservations"("expires_at");

ALTER TABLE "stock_reservations" ADD CONSTRAINT "stock_reservations_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "stock_reservations" ADD CONSTRAINT "stock_reservations_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
