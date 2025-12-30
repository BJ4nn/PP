import { NextResponse } from "next/server";
import { prisma } from "@/server/db/client";

export async function GET() {
  let dbStatus: "ok" | "error" = "ok";
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    console.error("Healthcheck DB ping failed:", error);
    dbStatus = "error";
  }

  return NextResponse.json(
    {
      status: dbStatus === "ok" ? "ok" : "error",
      db: dbStatus,
      timestamp: new Date().toISOString(),
    },
    { status: dbStatus === "ok" ? 200 : 503 },
  );
}
