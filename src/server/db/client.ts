import { PrismaClient } from "@prisma/client";
import { PHASE_PRODUCTION_BUILD } from "next/constants";

function createClient() {
  const message =
    "DATABASE_URL is not set. Update your .env file before starting the app.";
  const isBuild = process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD;
  if (!process.env.DATABASE_URL) {
    if (isBuild) {
      console.warn(message);
      return new Proxy(
        {},
        {
          get() {
            throw new Error(message);
          },
        },
      ) as PrismaClient;
    }
    console.error(message);
    throw new Error(message);
  }
  try {
    return new PrismaClient({
      log:
        process.env.NODE_ENV === "development"
          ? ["query", "error", "warn"]
          : ["error"],
    });
  } catch (error) {
    console.error(
      "Failed to initialize Prisma Client. Ensure `prisma generate` ran and DATABASE_URL is valid.",
    );
    throw error;
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
