import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";
import { SiteHeader } from "@/components/layout/header";

export const metadata: Metadata = {
  title: "Prihlásenie · Warehouse Flex Portal",
};

type Props = {
  searchParams: Promise<{ callbackUrl?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  return (
    <>
      <SiteHeader />
      <main className="relative mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-4xl flex-col items-center justify-center gap-8 px-4 py-12 text-center">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        >
          <div className="absolute -top-24 right-[-12%] h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.25),transparent_70%)] blur-3xl" />
          <div className="absolute left-[-18%] top-20 h-80 w-80 rounded-full bg-[radial-gradient(circle_at_center,rgba(14,116,144,0.22),transparent_70%)] blur-3xl" />
          <div className="absolute bottom-[-12%] right-10 h-60 w-60 rounded-[32%] bg-[radial-gradient(circle_at_center,rgba(251,146,60,0.22),transparent_65%)] blur-2xl" />
        </div>

        <div className="hero-surface w-full rounded-[32px] border border-white/60 bg-white/80 px-6 py-10 shadow-[0_24px_70px_rgba(15,23,42,0.12)] backdrop-blur-sm sm:px-10">
          <div className="mx-auto flex w-full max-w-md flex-col items-center gap-6">
            <div className="animate-rise space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Warehouse Flex Portal
              </p>
              <h1 className="font-display text-3xl font-semibold text-slate-900 sm:text-4xl">
                Vitajte späť
              </h1>
              <p className="text-sm text-slate-600">
                Prihláste sa a spojte sa so skladmi alebo pracovníkmi.
              </p>
            </div>
            <div className="animate-rise animate-delay-150 w-full">
              <LoginForm callbackUrl={params?.callbackUrl} />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
