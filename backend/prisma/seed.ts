import "dotenv/config";

import { PrismaClient } from "./generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding user data...");

  const alice = await prisma.user.upsert({
    where: { email: "alice@example.com" },
    update: {},
    create: {
      name: "Alice",
      email: "alice@example.com",
      passwordHash: "placeholder-hash-replace-in-production",
    },
  });

  const robert = await prisma.user.upsert({
    where: { email: "robert@example.com" },
    update: {},
    create: {
      name: "Robert",
      email: "robert@example.com",
      passwordHash: "placeholder-hash-replace-in-production",
    },
  });

  console.log("✅ Seeded users:", { alice, robert });
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
