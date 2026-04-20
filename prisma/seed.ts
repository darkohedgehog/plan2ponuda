import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

import { hashPassword } from "@/lib/auth/password";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to seed the database.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await hashPassword("change-me-password");

  await prisma.user.upsert({
    where: { email: "demo@plan2ponuda.local" },
    update: {},
    create: {
      email: "demo@plan2ponuda.local",
      name: "Demo Electrician",
      passwordHash,
      projects: {
        create: {
          name: "Demo apartment plan",
        },
      },
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
