import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding user data...");

  // Seed users with upsert to avoid duplicates
  const alice = await prisma.user.upsert({
    where: { email: "alice@example.com" },
    update: {},
    create: {
      name: "Alice",
      email: "alice@example.com",
      age: 42,
    },
  });

  const robert = await prisma.user.upsert({
    where: { email: "robert@example.com" },
    update: {},
    create: {
      name: "Robert",
      email: "robert@example.com",
      age: 21,
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
