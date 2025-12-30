import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { UserRole } from "@/types";
import { updateCompanyWorkerRelation } from "@/server/services/company-workers";

const relationSchema = z
  .object({
    isPriority: z.boolean().optional(),
    isNarrowCollaboration: z.boolean().optional(),
    narrowGroupId: z.string().cuid().nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "No changes provided",
  });

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const session = await requireRole(UserRole.COMPANY);
  const resolvedParams = await params;
  const body = await request.json().catch(() => ({}));
  const parsed = relationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const input: {
    isPriority?: boolean;
    isNarrowCollaboration?: boolean;
    narrowGroupId?: string | null;
  } = {};
  if (parsed.data.isPriority !== undefined) input.isPriority = parsed.data.isPriority;
  if (parsed.data.isNarrowCollaboration !== undefined) {
    input.isNarrowCollaboration = parsed.data.isNarrowCollaboration;
  }
  if (parsed.data.narrowGroupId !== undefined) {
    input.narrowGroupId = parsed.data.narrowGroupId;
  }

  try {
    const relation = await updateCompanyWorkerRelation(
      session.user.id,
      resolvedParams.id,
      input,
    );
    return NextResponse.json(relation);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}
