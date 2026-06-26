import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import type { NotificationItem } from "@/features/notifications/api/notifications";

const MAX_SEEN_IDS = 1000;

export function useSSE() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const seenIds = useRef(new Set<string>());

  useEffect(() => {
    const baseUrl = import.meta.env.VITE_AUTH_URL ?? "";
    const url = `${baseUrl}/api/notifications/stream`;
    const eventSource = new EventSource(url, { withCredentials: true });

    eventSource.addEventListener("connected", () => {
      // connection established — no-op
    });

    eventSource.addEventListener("initial", (e) => {
      const { notifications } = JSON.parse(e.data) as {
        notifications: NotificationItem[];
      };
      for (const n of notifications) {
        seenIds.current.add(n.id);
      }
      if (seenIds.current.size > MAX_SEEN_IDS) {
        const iter = seenIds.current.values();
        for (let i = 0; i < 100; i++) {
          const next = iter.next();
          if (next.done) break;
          seenIds.current.delete(next.value);
        }
      }
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    });

    eventSource.addEventListener("notification", (e) => {
      const { notification } = JSON.parse(e.data) as {
        notification: NotificationItem;
      };
      if (!seenIds.current.has(notification.id)) {
        seenIds.current.add(notification.id);
        if (seenIds.current.size > MAX_SEEN_IDS) {
          const iter = seenIds.current.values();
          for (let i = 0; i < 100; i++) {
            const next = iter.next();
            if (next.done) break;
            seenIds.current.delete(next.value);
          }
        }
        toast(notification.title, {
          description: notification.message,
          action: notification.link
            ? {
                label: "View",
                onClick: () => navigate(notification.link!),
              }
            : undefined,
        });
      }
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    });

    eventSource.onerror = () => {
      // EventSource auto-reconnects
    };

    return () => {
      eventSource.close();
    };
  }, [queryClient, navigate]);
}
