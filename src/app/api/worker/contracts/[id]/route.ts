import { NextResponse } from "next/server";
import { auth } from "@/config/auth";
import { UserRole } from "@/types";
import { getWorkerContract } from "@/server/services/contracts";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.WORKER) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  try {
    const doc = await getWorkerContract(session.user.id, id);
    return NextResponse.json(doc);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 404 });
  }
}

