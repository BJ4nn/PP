import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { JobWaveStage, UserRole } from "@/types";
import { updateJobWaveStage } from "@/server/services/jobs/company";

const waveSchema = z.object({
  waveStage: z.nativeEnum(JobWaveStage),
});

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const session = await requireRole(UserRole.COMPANY);
  const resolvedParams = await params;
  const body = await request.json().catch(() => ({}));
  const parsed = waveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    const updated = await updateJobWaveStage(
      session.user.id,
      resolvedParams.id,
      parsed.data.waveStage,
    );
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}
