-- AlterTable
ALTER TABLE "orders" ADD COLUMN "user_id" TEXT;

-- CreateIndex
CREATE INDEX "orders_user_id_idx" ON "orders"("user_id");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
