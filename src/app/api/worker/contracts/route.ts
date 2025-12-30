import { NextResponse } from "next/server";
import { auth } from "@/config/auth";
import { UserRole } from "@/types";
import { listWorkerContracts } from "@/server/services/contracts";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.WORKER) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contracts = await listWorkerContracts(session.user.id);
  return NextResponse.json(contracts);
}

