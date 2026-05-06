/*
  Warnings:

  - You are about to drop the column `promotion_id` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `promotion_snapshot` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `created_by` on the `promotions` table. All the data in the column will be lost.
  - You are about to drop the column `discount` on the `promotions` table. All the data in the column will be lost.
  - You are about to drop the column `end_date` on the `promotions` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `promotions` table. All the data in the column will be lost.
  - You are about to drop the column `start_date` on the `promotions` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `promotions` table. All the data in the column will be lost.
  - You are about to drop the column `usage_limits` on the `promotions` table. All the data in the column will be lost.
  - You are about to drop the `promotion_products` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `updated_at` to the `categories` table without a default value. This is not possible if the table is not empty.
  - Added the required column `final_amount` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subtotal_amount` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `starts_at` to the `promotions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `promotions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `value` to the `promotions` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PromotionType" AS ENUM ('percentage', 'fixed_amount');

-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'delivered';

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'admin';

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_promotion_id_fkey";

-- DropForeignKey
ALTER TABLE "promotion_products" DROP CONSTRAINT "promotion_products_product_id_fkey";

-- DropForeignKey
ALTER TABLE "promotion_products" DROP CONSTRAINT "promotion_products_promotion_id_fkey";

-- DropForeignKey
ALTER TABLE "promotions" DROP CONSTRAINT "promotions_created_by_fkey";

-- DropIndex
DROP INDEX "promotions_code_key";

-- DropIndex
DROP INDEX "promotions_created_by_idx";

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "promotion_id",
DROP COLUMN "promotion_snapshot",
ADD COLUMN     "discount_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "final_amount" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "subtotal_amount" DECIMAL(10,2) NOT NULL;

-- AlterTable
ALTER TABLE "promotions" DROP COLUMN "created_by",
DROP COLUMN "discount",
DROP COLUMN "end_date",
DROP COLUMN "name",
DROP COLUMN "start_date",
DROP COLUMN "status",
DROP COLUMN "usage_limits",
ADD COLUMN     "ends_at" TIMESTAMP(3),
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "max_discount" DECIMAL(10,2),
ADD COLUMN     "min_order_value" DECIMAL(10,2),
ADD COLUMN     "starts_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "type" "PromotionType" NOT NULL,
ADD COLUMN     "usage_limit" INTEGER,
ADD COLUMN     "value" DECIMAL(10,2) NOT NULL;

-- DropTable
DROP TABLE "promotion_products";

-- CreateTable
CREATE TABLE "order_promotions" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "promotion_id" TEXT,
    "promotion_code" TEXT,
    "discount_type" "PromotionType" NOT NULL,
    "discount_value" DECIMAL(10,2) NOT NULL,
    "applied_amount" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "order_promotions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "order_promotions_order_id_idx" ON "order_promotions"("order_id");

-- CreateIndex
CREATE INDEX "order_promotions_promotion_id_idx" ON "order_promotions"("promotion_id");

-- AddForeignKey
ALTER TABLE "order_promotions" ADD CONSTRAINT "order_promotions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_promotions" ADD CONSTRAINT "order_promotions_promotion_id_fkey" FOREIGN KEY ("promotion_id") REFERENCES "promotions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
