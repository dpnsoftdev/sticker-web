-- campaign_items
ALTER TABLE "campaign_items"
ALTER COLUMN "stock_on_hand" SET DEFAULT 0;

ALTER TABLE "campaign_items"
ALTER COLUMN "stock_reserved" SET DEFAULT 0;

-- variants
ALTER TABLE "variants"
ALTER COLUMN "stock_on_hand" SET DEFAULT 0;

ALTER TABLE "variants"
ALTER COLUMN "stock_reserved" SET DEFAULT 0;