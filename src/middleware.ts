import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { UserRole } from "@/types";

const ROLE_ROUTE_MAP: Array<{ prefix: string; role: UserRole }> = [
  { prefix: "/worker", role: UserRole.WORKER },
  { prefix: "/company", role: UserRole.COMPANY },
  { prefix: "/admin", role: UserRole.ADMIN },
];

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const target = ROLE_ROUTE_MAP.find(({ prefix }) =>
    pathname.startsWith(prefix),
  );

  if (!target) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const role = token?.role as UserRole | undefined;

  if (!role) {
    const loginUrl = new URL("/auth/login", req.url);
    loginUrl.searchParams.set("callbackUrl", req.url);
    return NextResponse.redirect(loginUrl);
  }

  if (role !== target.role) {
    const redirectUrl =
      role === UserRole.WORKER
        ? "/worker/dashboard"
        : role === UserRole.COMPANY
          ? "/company/dashboard"
          : "/admin";
    return NextResponse.redirect(new URL(redirectUrl, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/worker/:path*", "/company/:path*", "/admin/:path*"],
};
