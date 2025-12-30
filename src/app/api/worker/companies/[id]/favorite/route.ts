import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/config/auth";
import { UserRole } from "@/types";
import { toggleFavoriteCompany } from "@/server/services/worker-companies";

const bodySchema = z.object({
  isFavorite: z.boolean(),
});

type Params = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: Params) {
  const session = await auth();
  const resolvedParams = await params;
  if (!session?.user || session.user.role !== UserRole.WORKER) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    const updated = await toggleFavoriteCompany(
      session.user.id,
      resolvedParams.id,
      parsed.data.isFavorite,
    );
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}
