import React, { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, CheckCheck, X } from "lucide-react";
import css from "./NotificationBell.module.css";

interface Notification {
  id: number; title: string; message: string; type: string;
  isRead: boolean; actionUrl: string | null; createdAt: string;
}

export const NotificationBell: React.FC = () => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await fetch("/_api/notifications?limit=10");
      if (!res.ok) return { notifications: [], unreadCount: 0 };
      const text = await res.text();
      const superjson = await import("superjson");
      return superjson.default.parse<{ notifications: Notification[]; unreadCount: number }>(text);
    },
    refetchInterval: 30000, // poll every 30s
  });

  const markReadMut = useMutation({
    mutationFn: async (ids: number[]) => {
      const superjson = await import("superjson");
      const res = await fetch("/_api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: superjson.default.stringify({ notificationIds: ids }),
      });
      return res.ok;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  const typeIcon: Record<string, string> = {
    info: "ℹ️", warning: "⚠️", success: "✅", rent: "🏠", investment: "💰", compliance: "📋",
  };

  return (
    <div className={css.bell} ref={ref}>
      <button className={css.bellBtn} onClick={() => setOpen(!open)} aria-label="Notifications">
        <Bell size={20} />
        {unreadCount > 0 && <span className={css.badge}>{unreadCount > 9 ? "9+" : unreadCount}</span>}
      </button>

      {open && (
        <div className={css.dropdown}>
          <div className={css.ddHeader}>
            <span className={css.ddTitle}>Notifications</span>
            {unreadCount > 0 && (
              <button className={css.markAll} onClick={() => markReadMut.mutate(notifications.filter(n => !n.isRead).map(n => n.id))}>
                <CheckCheck size={14} /> Mark all read
              </button>
            )}
          </div>
          <div className={css.ddList}>
            {notifications.length === 0 && <div className={css.empty}>No notifications</div>}
            {notifications.map(n => (
              <div key={n.id} className={`${css.item} ${!n.isRead ? css.unread : ""}`}>
                <span className={css.itemIcon}>{typeIcon[n.type] || "ℹ️"}</span>
                <div className={css.itemContent}>
                  <span className={css.itemTitle}>{n.title}</span>
                  <span className={css.itemMsg}>{n.message}</span>
                  <span className={css.itemTime}>{new Date(n.createdAt).toLocaleString()}</span>
                </div>
                {!n.isRead && (
                  <button className={css.markOne} onClick={() => markReadMut.mutate([n.id])} aria-label="Mark read">
                    <Check size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <a href="/notifications" className={css.ddFooter}>View All Notifications</a>
        </div>
      )}
    </div>
  );
};
