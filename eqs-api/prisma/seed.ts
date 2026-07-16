import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  await prisma.role.upsert({
    where: {
      name: "admin",
    },
    update: {
      description: "System administrator",
      isActive: true,
    },
    create: {
      name: "admin",
      description: "System administrator",
      isActive: true,
    },
  });

  await prisma.role.upsert({
    where: {
      name: "student",
    },
    update: {
      description: "Student user",
      isActive: true,
    },
    create: {
      name: "student",
      description: "Student user",
      isActive: true,
    },
  });

  console.log("Seed roles completed");
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });