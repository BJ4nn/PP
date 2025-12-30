import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/layout/notification-bell";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { AppShellNav } from "@/components/layout/app-shell-nav";
import { auth } from "@/config/auth";
import { UserRole } from "@/types";

type Props = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  homeHref?: string;
  variant?: "default" | "hero";
};

type NavItem = {
  href: string;
  label: string;
  disabled?: boolean;
};

export async function AppShell({
  title,
  subtitle,
  actions,
  children,
  className,
  homeHref = "/",
  variant = "default",
}: Props) {
  const session = await auth();
  const role = session?.user?.role as UserRole | undefined;
  const isHero = variant === "hero";
  const navButtonClass = isHero ? "text-slate-600 hover:bg-white/70" : undefined;

  const navItems: NavItem[] = (() => {
    if (!role) return [];
    if (role === UserRole.WORKER) {
      return [
        { href: "/worker/onboarding", label: "Profil" },
        { href: "/worker/jobs", label: "Dostupné smeny" },
        { href: "/worker/companies", label: "Moje firmy" },
        { href: "/worker/assigned", label: "Nahodené smeny" },
        { href: "/worker/invoices", label: "Faktúry (Beta)" },
        { href: "/worker/billing", label: "Fakturácia (Beta)" },
        { href: "/worker/contracts", label: "Zmluvy (Beta)" },
        { href: "/worker/calendar", label: "Môj kalendár" },
        { href: "/worker/history", label: "História" },
      ];
    }
    if (role === UserRole.COMPANY) {
      return [
        { href: "/company/onboarding", label: "Profil" },
        { href: "/company/dashboard", label: "Prehľad" },
        { href: "/company/calendar", label: "Môj kalendár" },
        { href: "/company/jobs", label: "Zmeny" },
        { href: "/company/workers", label: "Pracovníci" },
        { href: "/company/contracts", label: "Zmluvy (Beta)" },
        { href: "/company/invoices", label: "Prijaté faktúry (Beta)" },
        { href: "/company/settings", label: "Nastavenia (Beta)" },
      ];
    }
    if (role === UserRole.ADMIN) {
      return [{ href: "/admin", label: "Monitor" }];
    }
    return [];
  })();

  return (
    <div className={cn("min-h-screen", isHero ? "bg-slate-50" : "bg-muted/40")}>
      <header
        className={cn(
          "relative overflow-hidden border-b",
          isHero ? "border-transparent bg-white/70 backdrop-blur" : "bg-background",
        )}
      >
        {isHero ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
          >
            <div className="absolute -top-20 right-[-10%] h-60 w-60 rounded-full bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.18),transparent_70%)] blur-3xl" />
            <div className="absolute left-[-16%] top-10 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,rgba(14,116,144,0.16),transparent_70%)] blur-3xl" />
          </div>
        ) : null}
        <div
          className={cn(
            "mx-auto flex w-full flex-col gap-4 px-4 py-6",
            isHero ? "max-w-6xl" : "max-w-5xl",
          )}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p
                className={cn(
                  "text-xs font-semibold uppercase",
                  isHero ? "text-emerald-700" : "text-primary",
                )}
              >
                Warehouse Flex Portal
              </p>
              <h1
                className={cn(
                  "text-2xl font-semibold",
                  isHero ? "font-display text-slate-900 sm:text-3xl" : "text-foreground",
                )}
              >
                {title}
              </h1>
              {subtitle ? (
                <p
                  className={cn(
                    "text-sm",
                    isHero ? "text-slate-600" : "text-muted-foreground",
                  )}
                >
                  {subtitle}
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <NotificationBell />
              {actions}
              {session?.user ? <SignOutButton /> : null}
            </div>
          </div>
          <AppShellNav
            navItems={navItems}
            homeHref={homeHref}
            navButtonClass={navButtonClass}
          />
        </div>
      </header>
      <main
        className={cn(
          "safe-bottom mx-auto w-full px-4 pt-8 pb-10 md:pt-12 md:pb-14",
          isHero ? "max-w-6xl" : "max-w-5xl",
          className,
        )}
      >
        {children}
      </main>
    </div>
  );
}
