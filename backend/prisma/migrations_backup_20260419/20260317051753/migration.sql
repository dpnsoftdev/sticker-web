/*
  Warnings:

  - You are about to alter the column `discount_value` on the `order_promotions` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Integer`.
  - You are about to alter the column `applied_amount` on the `order_promotions` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Integer`.
  - You are about to alter the column `discount_amount` on the `orders` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Integer`.
  - You are about to alter the column `final_amount` on the `orders` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Integer`.
  - You are about to alter the column `subtotal_amount` on the `orders` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Integer`.
  - You are about to drop the column `preorder` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `stock` on the `products` table. All the data in the column will be lost.
  - You are about to alter the column `max_discount` on the `promotions` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Integer`.
  - You are about to alter the column `min_order_value` on the `promotions` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Integer`.
  - You are about to alter the column `value` on the `promotions` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Integer`.
  - A unique constraint covering the columns `[campaign_id,variant_id]` on the table `campaign_items` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sku]` on the table `variants` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updated_at` to the `campaign_items` table without a default value. This is not possible if the table is not empty.
  - Made the column `variant_id` on table `campaign_items` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `product_name` to the `order_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unit_price` to the `order_items` table without a default value. This is not possible if the table is not empty.
  - Made the column `variant_id` on table `order_items` required. This step will fail if there are existing NULL values in that column.
  - Made the column `max_discount` on table `promotions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `min_order_value` on table `promotions` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `updated_at` to the `variants` table without a default value. This is not possible if the table is not empty.
  - Made the column `price` on table `variants` required. This step will fail if there are existing NULL values in that column.
  - Made the column `stock` on table `variants` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('active', 'inactive', 'archived');

-- CreateEnum
CREATE TYPE "VariantStatus" AS ENUM ('active', 'inactive', 'archived');

-- DropForeignKey
ALTER TABLE "campaign_items" DROP CONSTRAINT "campaign_items_variant_id_fkey";

-- DropForeignKey
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_variant_id_fkey";

-- DropIndex
DROP INDEX "campaign_items_campaign_id_product_id_variant_id_key";

-- AlterTable
ALTER TABLE "campaign_items" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'VND',
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "variant_id" SET NOT NULL,
ALTER COLUMN "campaign_image" DROP NOT NULL;

-- AlterTable
ALTER TABLE "order_items" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'VND',
ADD COLUMN     "image" TEXT,
ADD COLUMN     "product_name" TEXT NOT NULL,
ADD COLUMN     "unit_price" INTEGER NOT NULL,
ADD COLUMN     "variant_name" TEXT,
ALTER COLUMN "variant_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "order_promotions" ALTER COLUMN "discount_value" SET DATA TYPE INTEGER,
ALTER COLUMN "applied_amount" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'VND',
ALTER COLUMN "discount_amount" SET DEFAULT 0,
ALTER COLUMN "discount_amount" SET DATA TYPE INTEGER,
ALTER COLUMN "final_amount" SET DATA TYPE INTEGER,
ALTER COLUMN "subtotal_amount" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "products" DROP COLUMN "preorder",
DROP COLUMN "price",
DROP COLUMN "stock",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "preorder_ends_at" TIMESTAMP(3),
ADD COLUMN     "preorder_starts_at" TIMESTAMP(3),
ADD COLUMN     "status" "ProductStatus" NOT NULL DEFAULT 'active';

-- AlterTable
ALTER TABLE "promotions" ALTER COLUMN "max_discount" SET NOT NULL,
ALTER COLUMN "max_discount" SET DATA TYPE INTEGER,
ALTER COLUMN "min_order_value" SET NOT NULL,
ALTER COLUMN "min_order_value" SET DATA TYPE INTEGER,
ALTER COLUMN "value" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "variants" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "is_default" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sku" TEXT,
ADD COLUMN     "status" "VariantStatus" NOT NULL DEFAULT 'active',
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "price" SET NOT NULL,
ALTER COLUMN "stock" SET NOT NULL;

-- CreateIndex
CREATE INDEX "campaign_items_variant_id_idx" ON "campaign_items"("variant_id");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_items_campaign_id_variant_id_key" ON "campaign_items"("campaign_id", "variant_id");

-- CreateIndex
CREATE INDEX "order_items_variant_id_idx" ON "order_items"("variant_id");

-- CreateIndex
CREATE UNIQUE INDEX "variants_sku_key" ON "variants"("sku");

-- AddForeignKey
ALTER TABLE "campaign_items" ADD CONSTRAINT "campaign_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
