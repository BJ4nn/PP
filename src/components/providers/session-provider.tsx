"use client";

import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import type { ReactNode } from "react";

type Props = {
  initialSession: Session | null;
  children: ReactNode;
};

export function AuthProvider({ initialSession, children }: Props) {
  return <SessionProvider session={initialSession}>{children}</SessionProvider>;
}
