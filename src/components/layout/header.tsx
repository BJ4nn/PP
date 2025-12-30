"use client";

import Link from "next/link";
import { siteConfig } from "@/config/site";

export function SiteHeader() {
  return (
    <header className="w-full border-b border-transparent bg-white/70 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/"
          className="font-display text-base font-semibold tracking-tight text-slate-900"
        >
          {siteConfig.name}
        </Link>
        <nav className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:gap-3 sm:text-sm">
          <Link
            href="/auth/login"
            className="rounded-full px-3 py-2 text-center leading-snug transition hover:text-slate-900"
          >
            Prihlásiť sa
          </Link>
          <Link
            href="/auth/register"
            className="rounded-full border border-slate-200 bg-white/80 px-3 py-2 text-center leading-snug text-slate-700 transition hover:border-emerald-200 hover:text-emerald-700"
          >
            Registrácia
          </Link>
        </nav>
      </div>
    </header>
  );
}
