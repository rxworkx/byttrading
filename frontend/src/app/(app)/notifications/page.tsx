"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { notificationsApi, type Notification } from "@/lib/dashboard-api";
import { formatDateTime } from "@/lib/utils";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[] | null>(null);

  const load = useCallback(() => {
    notificationsApi.mine().then(setNotifications);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function markAllRead() {
    await notificationsApi.markAllRead();
    load();
  }

  async function markRead(id: string) {
    await notificationsApi.markRead(id);
    load();
  }

  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Notifications</h1>
        {unreadCount > 0 ? (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            Mark all read
          </Button>
        ) : null}
      </div>

      <div className="space-y-2">
        {!notifications ? (
          <Skeleton className="h-16 w-full rounded-xl" />
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-hairline bg-surface p-8 text-center">
            <Bell className="size-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">You&apos;re all caught up.</p>
          </div>
        ) : (
          notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => !n.isRead && markRead(n.id)}
              className={`flex w-full items-start gap-3 rounded-xl border border-hairline p-4 text-left ${
                n.isRead ? "bg-surface" : "bg-surface-raised"
              }`}
            >
              {n.isRead ? (
                <Bell className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              ) : (
                <BellRing className="mt-0.5 size-4 shrink-0 text-primary" />
              )}
              <div>
                <p className="font-medium">{n.title}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>
                <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(n.createdAt)}</p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
