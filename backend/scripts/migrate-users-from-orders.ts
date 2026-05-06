/**
 * Migrate users from existing orders (guest checkout — no login yet).
 *
 * ## Schema context
 * - User: name, email (unique), passwordHash (required), phone optional, role/status, etc.
 * - Order: no userId; contact + shippingInfo are JSON (see orderModel ContactSchema / ShippingInfoSchema).
 *
 * ## Rules (identity & deduplication)
 * 1. **Primary key**: Normalized email = `trim` + lowercase of `contact.email`. One User per email.
 * 2. **Source row per email**: Among all orders sharing that email, use the **most recent** by
 *    `order.createdAt` to read `contact` and `shippingInfo` (latest checkout wins).
 * 3. **Skip** orders where `contact.email` is missing or not a plausible email string.
 * 4. **Skip** creating a user if a User with that email already exists (idempotent re-runs).
 *
 * ## Field mapping
 * - **name**: `shippingInfo.receiver_name` (trimmed) from the chosen order; if empty, fall back to
 *   the part before `@` in the email; if still empty, `"Customer"`.
 * - **phone**: Prefer `contact.phone` from the chosen order; if normalization fails, try
 *   `shippingInfo.receiver_phone`. Store `null` if nothing usable.
 * - **passwordHash**: bcrypt hash of a **cryptographically random** secret (not loginable). Owners
 *   should use "forgot password" (or a future invite flow) to set a real password. Optional override:
 *   set env `IMPORT_USERS_FROM_ORDERS_TEMP_PASSWORD` to hash a known temporary password (dev only).
 *
 * ## Usage
 *   DATABASE_URL=... pnpm exec tsx scripts/migrate-users-from-orders.ts
 *   DRY_RUN=1 pnpm exec tsx scripts/migrate-users-from-orders.ts
 *
 * Requires: `pnpm exec prisma generate` so `prisma/generated` exists.
 */
import "dotenv/config";
import { randomBytes } from "node:crypto";

import bcrypt from "bcryptjs";
import { PrismaClient } from "../prisma/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

import { normalizeVietnamPhone } from "../src/common/utils/otpVerification";

const SALT_ROUNDS = 10;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const DRY_RUN = process.env.DRY_RUN === "1" || process.argv.includes("--dry-run");

type ContactJson = {
  social_link?: string;
  email?: string;
  phone?: string;
};

type ShippingJson = {
  receiver_name?: string;
  receiver_phone?: string;
  address?: string;
  notes?: string | null;
};

function asRecord(v: unknown): Record<string, unknown> | null {
  return v !== null && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function parseContact(raw: unknown): ContactJson {
  const o = asRecord(raw);
  if (!o) return {};
  return {
    social_link: typeof o.social_link === "string" ? o.social_link : undefined,
    email: typeof o.email === "string" ? o.email : undefined,
    phone: typeof o.phone === "string" ? o.phone : undefined,
  };
}

function parseShipping(raw: unknown): ShippingJson {
  const o = asRecord(raw);
  if (!o) return {};
  return {
    receiver_name: typeof o.receiver_name === "string" ? o.receiver_name : undefined,
    receiver_phone: typeof o.receiver_phone === "string" ? o.receiver_phone : undefined,
    address: typeof o.address === "string" ? o.address : undefined,
    notes: o.notes === null || typeof o.notes === "string" ? (o.notes as string | null) : undefined,
  };
}

function normalizeEmail(raw: string | undefined): string | null {
  if (!raw || typeof raw !== "string") return null;
  const n = raw.trim().toLowerCase();
  if (!n) return null;
  // pragmatic check aligned with app usage (Zod email is stricter; DB may have legacy rows)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(n)) return null;
  return n;
}

function displayName(shipping: ShippingJson, email: string): string {
  const r = shipping.receiver_name?.trim();
  if (r) return r;
  const local = email.split("@")[0]?.trim();
  if (local) return local;
  return "Customer";
}

function pickPhone(contact: ContactJson, shipping: ShippingJson): string | null {
  const candidates = [contact.phone, shipping.receiver_phone];
  for (const c of candidates) {
    if (!c?.trim()) continue;
    const norm = normalizeVietnamPhone(c.trim());
    if (norm.ok) return norm.phone.local;
  }
  const fallback = contact.phone?.trim() || shipping.receiver_phone?.trim();
  return fallback || null;
}

async function buildPasswordHash(): Promise<string> {
  const temp = process.env.IMPORT_USERS_FROM_ORDERS_TEMP_PASSWORD?.trim();
  if (temp) {
    return bcrypt.hash(temp, SALT_ROUNDS);
  }
  const secret = randomBytes(32).toString("hex");
  return bcrypt.hash(secret, SALT_ROUNDS);
}

async function main() {
  const passwordHash = await buildPasswordHash();

  const orders = await prisma.order.findMany({
    select: {
      id: true,
      createdAt: true,
      contact: true,
      shippingInfo: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const byEmail = new Map<string, { createdAt: Date; contact: ContactJson; shipping: ShippingJson }>();

  let skippedNoEmail = 0;

  for (const o of orders) {
    const contact = parseContact(o.contact);
    const email = normalizeEmail(contact.email);
    if (!email) {
      skippedNoEmail += 1;
      continue;
    }
    const existing = byEmail.get(email);
    if (!existing || o.createdAt > existing.createdAt) {
      byEmail.set(email, {
        createdAt: o.createdAt,
        contact,
        shipping: parseShipping(o.shippingInfo),
      });
    }
  }

  let usersCreated = 0;
  let usersSkippedExists = 0;

  const emailsToConsider = [...byEmail.keys()];
  const existingRows = await prisma.user.findMany({
    where: { email: { in: emailsToConsider } },
    select: { email: true },
  });
  const existingEmails = new Set(existingRows.map((r) => r.email));

  for (const [email, snap] of byEmail) {
    if (existingEmails.has(email)) {
      usersSkippedExists += 1;
      continue;
    }

    const name = displayName(snap.shipping, email);
    const phone = pickPhone(snap.contact, snap.shipping);

    if (DRY_RUN) {
      console.log("[dry-run] would create", { email, name, phone });
      usersCreated += 1;
      continue;
    }

    await prisma.user.create({
      data: {
        email,
        name,
        phone,
        passwordHash,
        role: "customer",
        status: "active",
        emailVerified: false,
        phoneVerified: false,
      },
    });
    usersCreated += 1;
  }

  console.log(
    JSON.stringify(
      {
        dryRun: DRY_RUN,
        ordersScanned: orders.length,
        distinctEmailsFromOrders: byEmail.size,
        skippedNoEmail,
        usersCreated,
        usersSkippedExists,
      },
      null,
      2,
    ),
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
