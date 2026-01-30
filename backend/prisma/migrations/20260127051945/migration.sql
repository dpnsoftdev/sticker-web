/*
  Warnings:

  - The values [draft] on the enum `PromotionStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `promotion` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `all_products` on the `promotions` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `promotions` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `promotions` table. All the data in the column will be lost.
  - You are about to drop the `promotion_variants` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PromotionStatus_new" AS ENUM ('active', 'inactive');
ALTER TABLE "public"."promotions" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "promotions" ALTER COLUMN "status" TYPE "PromotionStatus_new" USING ("status"::text::"PromotionStatus_new");
ALTER TYPE "PromotionStatus" RENAME TO "PromotionStatus_old";
ALTER TYPE "PromotionStatus_new" RENAME TO "PromotionStatus";
DROP TYPE "public"."PromotionStatus_old";
ALTER TABLE "promotions" ALTER COLUMN "status" SET DEFAULT 'active';
COMMIT;

-- DropForeignKey
ALTER TABLE "promotion_variants" DROP CONSTRAINT "promotion_variants_promotion_id_fkey";

-- DropForeignKey
ALTER TABLE "promotion_variants" DROP CONSTRAINT "promotion_variants_variant_id_fkey";

-- DropIndex
DROP INDEX "campaign_items_variant_id_idx";

-- DropIndex
DROP INDEX "campaigns_created_by_idx";

-- DropIndex
DROP INDEX "campaigns_slug_idx";

-- DropIndex
DROP INDEX "order_items_variant_id_idx";

-- DropIndex
DROP INDEX "orders_created_at_idx";

-- DropIndex
DROP INDEX "orders_promotion_id_idx";

-- AlterTable
ALTER TABLE "campaigns" ALTER COLUMN "type" SET DEFAULT 'preorder';

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "promotion",
ADD COLUMN     "promotion_snapshot" JSONB;

-- AlterTable
ALTER TABLE "promotions" DROP COLUMN "all_products",
DROP COLUMN "metadata",
DROP COLUMN "type",
ADD COLUMN     "used_count" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "status" SET DEFAULT 'active';

-- DropTable
DROP TABLE "promotion_variants";

-- DropEnum
DROP TYPE "PromotionType";
