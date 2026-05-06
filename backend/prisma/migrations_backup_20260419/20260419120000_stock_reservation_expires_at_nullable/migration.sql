-- Allow unlimited reservations: NULL expires_at means no automatic expiry.
ALTER TABLE "stock_reservations" ALTER COLUMN "expires_at" DROP NOT NULL;
