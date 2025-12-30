import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/server/db/client";
import { registerSchema } from "@/lib/validators/auth";
import { enforceCsrfSameOrigin } from "@/server/security/csrf";
import { enforceRateLimit } from "@/server/security/rate-limit";
import { getClientIp } from "@/server/security/request";

export async function POST(request: Request) {
  const csrf = enforceCsrfSameOrigin(request);
  if (csrf) return csrf;

  const ip = getClientIp(request.headers);
  const ipLimit = await enforceRateLimit({
    key: `register:ip:${ip}`,
    limit: 10,
    windowMs: 60_000,
  });
  if (ipLimit) return ipLimit;

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json(
      { error: "Invalid registration data" },
      { status: 400 },
    );
  }
  const result = registerSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid registration data" },
      { status: 400 },
    );
  }

  const emailLimit = await enforceRateLimit({
    key: `register:email:${result.data.email}`,
    limit: 5,
    windowMs: 60_000,
  });
  if (emailLimit) return emailLimit;

  const existingUser = await prisma.user.findUnique({
    where: { email: result.data.email },
  });

  if (existingUser) {
    return NextResponse.json({ success: true });
  }

  const passwordHash = await bcrypt.hash(result.data.password, 10);

  await prisma.user.create({
    data: {
      email: result.data.email,
      passwordHash,
      role: result.data.role,
    },
  });

  return NextResponse.json({ success: true });
}
