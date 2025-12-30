import { NextResponse } from "next/server";
import { auth } from "@/config/auth";
import { UserRole } from "@/types";
import { listCompanyContracts } from "@/server/services/contracts";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== UserRole.COMPANY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contracts = await listCompanyContracts(session.user.id);
  return NextResponse.json(contracts);
}

