"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  disabled?: boolean;
};

type Props = {
  navItems: NavItem[];
  homeHref: string;
  navButtonClass?: string | undefined;
};

const isActivePath = (pathname: string, href: string) => {
  if (href === "/") return pathname === "/";
  if (pathname === href) return true;
  return pathname.startsWith(`${href}/`);
};

export function AppShellNav({ navItems, homeHref, navButtonClass }: Props) {
  const pathname = usePathname();
  const [openPathname, setOpenPathname] = useState<string | null>(null);
  const hasHomeItem = useMemo(
    () => navItems.some((item) => item.href === homeHref),
    [navItems, homeHref],
  );
  const open = openPathname === pathname;
  const canUseDom = typeof document !== "undefined";

  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  const linkClass = (active: boolean, layout: "desktop" | "drawer") =>
    cn(
      navButtonClass,
      layout === "drawer"
        ? "w-full justify-start text-left whitespace-normal"
        : "whitespace-nowrap",
      active
        ? "border border-primary/20 bg-primary/10 text-primary hover:bg-primary/15"
        : "text-foreground/80",
    );

  const activeLabel = useMemo(() => {
    const activeItem = navItems.find((item) => isActivePath(pathname, item.href));
    if (activeItem) return activeItem.label;
    return !hasHomeItem && isActivePath(pathname, homeHref) ? "Domov" : null;
  }, [navItems, pathname, homeHref, hasHomeItem]);

  const drawer = open ? (
    <div className="fixed inset-0 z-[9999] sm:hidden" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50"
        onClick={() => setOpenPathname(null)}
        aria-label="Zatvoriť menu"
      />
      <div className="relative h-full w-[85vw] max-w-sm bg-white px-4 pb-6 pt-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">Menu</p>
          <button
            type="button"
            className="rounded-full p-1 text-muted-foreground hover:text-foreground"
            onClick={() => setOpenPathname(null)}
            aria-label="Zatvoriť menu"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
        <div className="mt-4 flex max-h-[calc(100vh-5rem)] flex-col gap-2 overflow-y-auto pr-1">
          {hasHomeItem ? null : (
            <Button
              asChild
              variant="ghost"
              size="sm"
              className={linkClass(isActivePath(pathname, homeHref), "drawer")}
              aria-current={isActivePath(pathname, homeHref) ? "page" : undefined}
              onClick={() => setOpenPathname(null)}
            >
              <Link href={homeHref}>Domov</Link>
            </Button>
          )}
          {navItems.map((item) =>
            item.disabled ? (
              <span
                key={item.href}
                className="inline-flex min-h-[2.25rem] items-center justify-start rounded-full border border-border bg-transparent px-4 text-xs font-semibold text-muted-foreground opacity-50"
                aria-disabled="true"
              >
                {item.label}
              </span>
            ) : (
              <Button
                key={item.href}
                asChild
                variant="ghost"
                size="sm"
                className={linkClass(isActivePath(pathname, item.href), "drawer")}
                aria-current={isActivePath(pathname, item.href) ? "page" : undefined}
                onClick={() => setOpenPathname(null)}
              >
                <Link href={item.href}>{item.label}</Link>
              </Button>
            ),
          )}
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between sm:hidden">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => setOpenPathname(pathname)}
        >
          <Menu className="size-4" aria-hidden="true" />
          Menu
        </Button>
        {activeLabel ? (
          <span className="text-xs font-semibold text-muted-foreground">
            {activeLabel}
          </span>
        ) : null}
      </div>

      <nav className="scrollbar-hidden -mx-4 hidden items-center gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex sm:flex-wrap sm:overflow-visible sm:px-0">
        {hasHomeItem ? null : (
          <Button
            asChild
            variant="ghost"
            size="sm"
            className={linkClass(isActivePath(pathname, homeHref), "desktop")}
            aria-current={isActivePath(pathname, homeHref) ? "page" : undefined}
          >
            <Link href={homeHref}>Domov</Link>
          </Button>
        )}
        {navItems.map((item) =>
          item.disabled ? (
            <span
              key={item.href}
              className="inline-flex min-h-[2.25rem] items-center justify-center whitespace-nowrap rounded-full border border-border bg-transparent px-4 text-xs font-semibold text-muted-foreground opacity-50"
              aria-disabled="true"
            >
              {item.label}
            </span>
          ) : (
            <Button
              key={item.href}
              asChild
              variant="ghost"
              size="sm"
              className={linkClass(isActivePath(pathname, item.href), "desktop")}
              aria-current={isActivePath(pathname, item.href) ? "page" : undefined}
            >
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ),
        )}
      </nav>

      {canUseDom && drawer ? createPortal(drawer, document.body) : null}
    </div>
  );
}
