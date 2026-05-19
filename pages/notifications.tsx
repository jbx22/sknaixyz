import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import css from "./notifications.module.css";

export default function NotificationsPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["all-notifications"],
    queryFn: async () => {
      const superjson = await import("superjson");
      const res = await fetch("/_api/notifications?limit=50");
      if (!res.ok) throw new Error("Failed");
      return superjson.default.parse<{
        notifications: Array<{
          id: number; title: string; message: string; type: string;
          isRead: boolean; actionUrl: string | null; createdAt: string; metadata: any;
        }>;
        total: number; unreadCount: number; page: number; totalPages: number;
      }>(await res.text());
    },
  });

  const markReadMut = useMutation({
    mutationFn: async (ids: number[]) => {
      const superjson = await import("superjson");
      await fetch("/_api/notifications/mark-read", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: superjson.default.stringify({ notificationIds: ids }),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["all-notifications"] }),
  });

  const notifications = data?.notifications || [];
  const unread = data?.unreadCount || 0;

  const typeColors: Record<string, string> = {
    info: "#3b82f6", warning: "#f59e0b", success: "#10b981",
    rent: "#8b5cf6", investment: "#06b6d4", compliance: "#ec4899",
  };

  return (
    <div className={css.page}>
      <div className={css.header}>
        <div>
          <h1><Bell size={24} /> Notifications</h1>
          <p className={css.sub}>{unread} unread · {data?.total || 0} total</p>
        </div>
        {unread > 0 && (
          <button className={css.markAllBtn} onClick={() => markReadMut.mutate(notifications.filter(n => !n.isRead).map(n => n.id))}>
            <CheckCheck size={16} /> Mark all read
          </button>
        )}
      </div>

      {isLoading && <div className={css.loading}>Loading...</div>}

      <div className={css.list}>
        {notifications.map(n => (
          <div key={n.id} className={`${css.item} ${!n.isRead ? css.unread : ""}`}>
            <div className={css.dot} style={{ background: typeColors[n.type] || "#3b82f6" }} />
            <div className={css.content}>
              <div className={css.row}>
                <span className={css.title}>{n.title}</span>
                <span className={css.time}>{new Date(n.createdAt).toLocaleString()}</span>
              </div>
              <p className={css.msg}>{n.message}</p>
              {n.actionUrl && <a href={n.actionUrl} className={css.action}>View →</a>}
            </div>
            {!n.isRead && (
              <button className={css.readBtn} onClick={() => markReadMut.mutate([n.id])}>
                <CheckCheck size={14} /> Read
              </button>
            )}
          </div>
        ))}
        {notifications.length === 0 && !isLoading && (
          <div className={css.empty}>
            <Bell size={48} />
            <p>No notifications yet</p>
            <span>We'll notify you about rent due dates, payments, and important updates.</span>
          </div>
        )}
      </div>
    </div>
  );
}
