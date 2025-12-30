import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/config/auth";
import { UserRole } from "@/types";

const ROLE_ROUTE_MAP: Array<{ prefix: string; role: UserRole }> = [
  { prefix: "/worker", role: UserRole.WORKER },
  { prefix: "/company", role: UserRole.COMPANY },
  { prefix: "/admin", role: UserRole.ADMIN },
];

type AuthRequest = NextRequest & {
  auth?: { user?: { role?: UserRole } } | null;
};

export default auth((req: AuthRequest) => {
  const { pathname } = req.nextUrl;
  const target = ROLE_ROUTE_MAP.find(({ prefix }) =>
    pathname.startsWith(prefix),
  );

  if (!target) {
    return NextResponse.next();
  }

  const session = req.auth;

  if (!session?.user) {
    const loginUrl = new URL("/auth/login", req.url);
    loginUrl.searchParams.set("callbackUrl", req.url);
    return NextResponse.redirect(loginUrl);
  }

  if (session.user.role !== target.role) {
    const redirectUrl =
      session.user.role === UserRole.WORKER
        ? "/worker/dashboard"
        : session.user.role === UserRole.COMPANY
          ? "/company/dashboard"
          : "/admin";
    return NextResponse.redirect(new URL(redirectUrl, req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/worker/:path*", "/company/:path*", "/admin/:path*"],
};
