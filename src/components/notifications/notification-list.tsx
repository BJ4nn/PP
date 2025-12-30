"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { sk } from "date-fns/locale";
import type { Notification } from "@/types";
import { NotificationType } from "@/types";
import { Button } from "@/components/ui/button";

export function NotificationList() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  const markRead = async (ids: string[]) => {
    if (ids.length === 0) return;
    try {
      await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
        keepalive: true,
      });
    } catch {
      // ignore
    }
  };

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/notifications");
      if (!response.ok) {
        setItems([]);
      } else {
        const data = await response.json();
        setItems(Array.isArray(data) ? data : []);
      }
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAll = async () => {
    if (items.length === 0) return;
    setMarking(true);
    try {
      await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: items.map((item) => item.id) }),
      });
      await loadNotifications();
    } catch {
      // ignore
    } finally {
      setMarking(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-20 animate-pulse rounded-2xl bg-muted/60" />
        <div className="h-20 animate-pulse rounded-2xl bg-muted/60" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="space-y-4 text-center text-sm text-muted-foreground">
        <p>Zatiaľ tu nie sú žiadne oznámenia.</p>
        <Button variant="outline" size="sm" onClick={loadNotifications}>
          Obnoviť
        </Button>
      </div>
    );
  }

  const buildHref = (item: Notification) => {
    const meta = item.meta as
      | { jobId?: string; jobDateKey?: string; jobMonthKey?: string; contractId?: string }
      | undefined;
    const jobId = meta?.jobId;
    const contractId = meta?.contractId;
    if (contractId) {
      if (
        item.type === NotificationType.WORKER_CONTRACT_READY
      ) {
        return `/worker/contracts/${contractId}`;
      }
      if (
        item.type === NotificationType.COMPANY_CONTRACT_READY ||
        item.type === NotificationType.COMPANY_CONTRACT_COMPLETED
      ) {
        return `/company/contracts/${contractId}`;
      }
      if (item.type === NotificationType.WORKER_APPLICATION_CONFIRMED) {
        return `/worker/contracts/${contractId}`;
      }
    }
    if (!jobId) return null;
    if (
      item.type === NotificationType.COMPANY_NEW_APPLICATION ||
      item.type === NotificationType.COMPANY_APPLICATION_CANCELED_BY_WORKER ||
      item.type === NotificationType.COMPANY_APPLICATION_CANCELED_LATE_BY_WORKER
    ) {
      if (meta?.jobDateKey && /^\d{4}-\d{2}-\d{2}$/.test(meta.jobDateKey)) {
        const month = meta.jobMonthKey && /^\d{4}-\d{2}$/.test(meta.jobMonthKey)
          ? meta.jobMonthKey
          : meta.jobDateKey.slice(0, 7);
        return `/company/calendar?month=${month}&day=${meta.jobDateKey}&jobId=${jobId}`;
      }
      return `/company/jobs/${jobId}`;
    }
    if (
      item.type === NotificationType.WORKER_APPLICATION_CONFIRMED ||
      item.type === NotificationType.WORKER_APPLICATION_REJECTED ||
      item.type === NotificationType.WORKER_APPLICATION_CANCELED_BY_COMPANY ||
      item.type === NotificationType.WORKER_APPLICATION_CANCELED_LATE_BY_COMPANY ||
      item.type === NotificationType.WORKER_JOB_CANCELED
    ) {
      return `/worker/jobs/${jobId}`;
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Zobrazujeme posledných {items.length} aktualít.
        </p>
        <Button
          size="sm"
          variant="outline"
          onClick={handleMarkAll}
          disabled={marking}
        >
          {marking ? "Označujeme..." : "Označiť všetko ako prečítané"}
        </Button>
      </div>
      <ul className="space-y-3">
        {items.map((item) => (
          <li
            key={item.id}
            className={`rounded-3xl border border-border p-4 text-sm ${item.isRead ? "bg-card" : "bg-primary/5"}`}
          >
            <p className="font-semibold text-foreground">{item.title}</p>
            <p className="mt-1 text-muted-foreground">{item.body}</p>
            {buildHref(item) ? (
              <Link
                href={buildHref(item) as string}
                className="mt-2 inline-flex text-xs font-semibold text-primary underline-offset-2 hover:underline"
                onClick={() => void markRead([item.id])}
              >
                Otvoriť detail
              </Link>
            ) : null}
            <div className="mt-2 text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(item.createdAt), {
                addSuffix: true,
                locale: sk,
              })}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
