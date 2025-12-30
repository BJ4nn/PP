import { UserRole } from "@/types";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      role: UserRole;
    };
  }

  interface User {
    id: string;
    role: UserRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
  }
}
