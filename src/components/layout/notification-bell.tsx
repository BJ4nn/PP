"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export function NotificationBell() {
  const [count, setCount] = useState<number>(0);
  const { data: session } = useSession();
  const userId = session?.user?.id;

  useEffect(() => {
    if (!userId) return;

    let isMounted = true;
    const fetchUnread = async () => {
      try {
        const response = await fetch("/api/notifications?onlyUnread=true");
        if (!response.ok) return;
        const data = await response.json();
        if (isMounted) {
          setCount(Array.isArray(data) ? data.length : 0);
        }
      } catch {
        // ignore
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [userId]);

  if (!userId) return null;

  return (
    <Link
      href="/notifications"
      className="relative inline-flex min-h-[2.5rem] min-w-[2.5rem] items-center justify-center rounded-full border border-border bg-background p-2 text-sm text-foreground shadow-sm transition hover:border-primary hover:text-primary"
      aria-label="Oznámenia"
    >
      <span aria-hidden="true">🔔</span>
      {count > 0 ? (
        <span className="absolute -right-1 -top-1 inline-flex min-h-[1rem] min-w-[1rem] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
          {count > 9 ? "9+" : count}
        </span>
      ) : null}
    </Link>
  );
}
