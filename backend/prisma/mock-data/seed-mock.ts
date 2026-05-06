/**
 * Seed script: load mock categories and products (with variants) into the database.
 *
 * Usage:
 *   pnpm tsx prisma/mock-data/seed-mock.ts
 *   # or: pnpm run db:seed-mock
 *
 * If tables are missing, runs `prisma migrate deploy` (same as production) to create
 * the schema, then continues. Ensure DATABASE_URL and/or DATABASE_URL_LOCAL (see
 * prisma.config.ts) are set in .env.
 */

import "dotenv/config";

import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";

import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

import { mockCategories } from "./categories.js";
import { mockProducts } from "./products.js";
import type { MockProduct, MockVariant } from "./products.js";

/** `prisma/mock-data` -> backend app root (where `prisma.config.ts` and `node_modules` live) */
const BACKEND_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

/**
 * Listings need at least one variant (see getDefaultVariant). For mock rows with `variants: []`,
 * we synthesize one variant from the product-level price/stock (same as admin "single product" flow).
 */
function resolveVariants(p: MockProduct): MockVariant[] {
  if (p.variants.length > 0) {
    return p.variants;
  }
  return [
    {
      name: p.name,
      description: p.priceNote ?? null,
      price: p.price ?? 0,
      stock: p.productType === "preorder" ? 0 : (p.stock ?? 0),
      images: [],
    },
  ];
}

/**
 * If the schema is empty (e.g. fresh database), create tables from SQL migrations
 * by delegating to the Prisma CLI. Do not hand-author DDL here; stay aligned with
 * `prisma/schema.prisma` and `prisma/migrations`.
 */
async function ensureMigrationsApplied(prisma: PrismaClient): Promise<void> {
  const result = (await prisma.$queryRawUnsafe(`SELECT to_regclass('public.categories')::text AS reg`)) as Array<{
    reg: string | null;
  }>;
  if (result[0]?.reg) {
    return;
  }

  console.log(
    "  ℹ Database has no `categories` table yet. Running `npx prisma migrate deploy` to apply migrations...\n",
  );

  const env: NodeJS.ProcessEnv = {
    ...process.env,
    // prisma.config.ts uses DATABASE_URL_LOCAL; seed scripts use DATABASE_URL — align for the CLI
    DATABASE_URL_LOCAL: process.env.DATABASE_URL_LOCAL ?? process.env.DATABASE_URL,
  };
  if (!env.DATABASE_URL_LOCAL) {
    throw new Error("DATABASE_URL or DATABASE_URL_LOCAL is required to run migrations (see prisma.config.ts and .env)");
  }

  execSync("npx prisma migrate deploy", { cwd: BACKEND_ROOT, stdio: "inherit", env });
  console.log("  ✓ Migrations applied.\n");
}

const connectionString = process.env.DATABASE_URL ?? process.env.DATABASE_URL_LOCAL;
if (!connectionString) {
  throw new Error("DATABASE_URL or DATABASE_URL_LOCAL is required");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding mock categories and products...\n");

  await ensureMigrationsApplied(prisma);

  // 1. Create categories and build slug -> id map
  const categoryIdsBySlug: Record<string, string> = {};

  for (const cat of mockCategories) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description, images: cat.images },
      create: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        images: cat.images,
      },
    });
    categoryIdsBySlug[cat.slug] = created.id;
    console.log("  ✓ Category:", created.name);
  }

  console.log("\n📦 Seeding products and variants...\n");

  // 2. Create products and their variants
  for (const p of mockProducts) {
    const categoryId = categoryIdsBySlug[p.categorySlug];
    if (!categoryId) {
      console.warn("  ⚠ Skipping product (unknown category slug):", p.slug, "→", p.categorySlug);
      continue;
    }

    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        categoryId,
        productType: p.productType,
        currency: p.currency ?? "VND",
        priceNote: p.priceNote,
        shippingNote: p.shippingNote,
        viewCount: p.viewCount ?? 0,
        sellerName: p.sellerName,
        sizeDescription: p.sizeDescription,
        packageDescription: p.packageDescription,
        preorderDescription: p.preorderDescription,
        images: p.images,
      },
      create: {
        name: p.name,
        slug: p.slug,
        categoryId,
        productType: p.productType,
        currency: p.currency ?? "VND",
        priceNote: p.priceNote,
        shippingNote: p.shippingNote,
        viewCount: p.viewCount ?? 0,
        sellerName: p.sellerName,
        sizeDescription: p.sizeDescription,
        packageDescription: p.packageDescription,
        preorderDescription: p.preorderDescription,
        images: p.images,
      },
    });

    // Delete existing variants for this product so we don't duplicate on re-run
    await prisma.variant.deleteMany({ where: { productId: product.id } });

    const variantRows = resolveVariants(p);
    for (let i = 0; i < variantRows.length; i++) {
      const v = variantRows[i]!;
      await prisma.variant.create({
        data: {
          productId: product.id,
          name: v.name,
          description: v.description,
          price: v.price ?? 0,
          stockOnHand: v.stock ?? 0,
          stockReserved: 0,
          images: v.images,
          isDefault: i === 0,
        },
      });
    }

    const variantCount = variantRows.length;
    console.log(`  ✓ Product: ${p.name} (${variantCount} variant(s))`);
  }

  console.log("\n✅ Mock data seeded successfully.");
  console.log(`   Categories: ${mockCategories.length}`);
  console.log(`   Products: ${mockProducts.length}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
