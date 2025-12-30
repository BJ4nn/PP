import { redirect } from "next/navigation";
import { auth } from "@/config/auth";
import { UserRole } from "@/types";

export async function requireSession() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/login");
  }
  return session;
}

export async function requireRole(role: UserRole | UserRole[]) {
  const session = await requireSession();
  const allowedRoles = Array.isArray(role) ? role : [role];

  if (!allowedRoles.includes(session.user.role)) {
    redirect("/");
  }

  return session;
}
