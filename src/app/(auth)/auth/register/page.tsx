import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";
import { SiteHeader } from "@/components/layout/header";
import { UserRole } from "@/types";

export const metadata: Metadata = {
  title: "Registrácia · Warehouse Flex Portal",
};

type Props = {
  searchParams: Promise<{
    role?: string;
  }>;
};

export default async function RegisterPage({ searchParams }: Props) {
  const resolvedParams = await searchParams;
  const requestedRole = resolvedParams?.role?.toUpperCase();
  const initialRole =
    requestedRole === UserRole.COMPANY
      ? UserRole.COMPANY
      : requestedRole === UserRole.WORKER
        ? UserRole.WORKER
        : undefined;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-4xl flex-col items-center justify-center gap-8 px-4 py-12 text-center">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase text-primary">
            Warehouse Flex Portal
          </p>
          <h1 className="text-3xl font-semibold text-foreground">
            Vytvorte si účet pracovníka alebo firmy
          </h1>
          <p className="text-sm text-muted-foreground">
            Zvoľte si rolu a my vás prevedieme registráciou.
          </p>
        </div>
        <div className="w-full max-w-md">
          <RegisterForm initialRole={initialRole} />
        </div>
      </main>
    </>
  );
}
