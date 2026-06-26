import { httpClient } from "@/lib/http";

export interface NotificationItem {
  id: string;
  userId: string;
  type: "FRIEND_REQUEST" | "INVITATION" | "INVITATION_RESPONSE";
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export interface ListNotificationsResponse {
  items: NotificationItem[];
  nextCursor: string | null;
  unreadCount: number;
}

export function getNotifications(cursor?: string, limit = 20) {
  const params = new URLSearchParams();
  if (cursor) params.set("cursor", cursor);
  params.set("limit", String(limit));
  return httpClient<ListNotificationsResponse>(
    `/api/notifications?${params.toString()}`,
  );
}

export function getUnreadCount() {
  return httpClient<{ unreadCount: number }>("/api/notifications/unread-count");
}

export function markRead(id: string) {
  return httpClient<{ message: string }>(`/api/notifications/${id}/read`, {
    method: "PATCH",
  });
}

export function markAllRead() {
  return httpClient<{ message: string }>("/api/notifications/read-all", {
    method: "PATCH",
  });
}
