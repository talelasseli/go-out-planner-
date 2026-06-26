import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useSSE } from "@/hooks/useSSE";
import {
  getNotifications,
  markRead,
  markAllRead,
  type NotificationItem,
} from "@/features/notifications/api/notifications";

function timeAgo(dateString: string) {
  const diff = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NotificationBell() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useSSE();

  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => getNotifications(),
    refetchInterval: 30000,
  });

  const markReadMutation = useMutation({
    mutationFn: markRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const unreadCount = data?.unreadCount ?? 0;
  const items: NotificationItem[] = data?.items ?? [];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
            <Bell className="size-5" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-4 py-2">
          <span className="text-sm font-semibold">Notifications</span>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markAllReadMutation.mutate()}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Mark all read
            </button>
          )}
        </div>
        <DropdownMenuSeparator />
        {items.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            No notifications
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {items.map((notification) => (
              <div key={notification.id}>
                <DropdownMenuItem
                  className="p-0"
                  onClick={() => {
                    if (!notification.read) markReadMutation.mutate(notification.id);
                    if (notification.link) navigate(notification.link);
                  }}
                >
                  <div className="flex items-start gap-3 px-4 py-3 w-full">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {!notification.read && (
                          <span className="size-2 shrink-0 rounded-full bg-primary" />
                        )}
                        <p className="truncate text-sm font-medium">
                          {notification.title}
                        </p>
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                        {notification.message}
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground/60">
                        {timeAgo(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="last:hidden" />
              </div>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
