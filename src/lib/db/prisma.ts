// src/lib/db/prisma.ts
import { PrismaClient } from "../../../generated/prisma/client";

const PRISMA_CLIENT_SCHEMA_VERSION = "20260430123000_add_password_reset_tokens";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaClientSchemaVersion?: string;
};

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

const hasCurrentPrismaClient =
  globalForPrisma.prismaClientSchemaVersion === PRISMA_CLIENT_SCHEMA_VERSION;

export const prisma =
  hasCurrentPrismaClient && globalForPrisma.prisma
    ? globalForPrisma.prisma
    : createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaClientSchemaVersion = PRISMA_CLIENT_SCHEMA_VERSION;
}

export function getPrismaClient(): PrismaClient {
  return prisma;
}
