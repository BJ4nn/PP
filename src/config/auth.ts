import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/server/db/client";
import { loginSchema } from "@/lib/validators/auth";
import { UserRole } from "@/types";
import { incrementWorkerActivityByUserId } from "@/server/services/worker";
import { enforceRateLimit } from "@/server/security/rate-limit";
import { getClientIp } from "@/server/security/request";

const nextAuthSecret = process.env.NEXTAUTH_SECRET;

if (process.env.NODE_ENV === "production" && !nextAuthSecret) {
  throw new Error("NEXTAUTH_SECRET must be set in production");
}

export const authConfig = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/login",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const headers = request?.headers ?? new Headers();
        const ip = getClientIp(headers);
        const ipLimit = await enforceRateLimit({
          key: `login:ip:${ip}`,
          limit: 30,
          windowMs: 60_000,
        });
        if (ipLimit) {
          throw new Error("RATE_LIMITED");
        }
        const comboLimit = await enforceRateLimit({
          key: `login:ip_email:${ip}:${parsed.data.email}`,
          limit: 10,
          windowMs: 60_000,
        });
        if (comboLimit) {
          throw new Error("RATE_LIMITED");
        }

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });

        if (!user) {
          return null;
        }

        const passwordMatch = await bcrypt.compare(
          parsed.data.password,
          user.passwordHash,
        );

        if (!passwordMatch) {
          return null;
        }

        if (user.role === UserRole.WORKER) {
          await incrementWorkerActivityByUserId(user.id, "LOGIN");
        }

        return {
          id: user.id,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: UserRole }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
  },
  ...(nextAuthSecret ? { secret: nextAuthSecret } : {}),
} satisfies Parameters<typeof NextAuth>[0];

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
