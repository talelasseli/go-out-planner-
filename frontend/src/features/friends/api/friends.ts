import { httpClient } from "@/lib/http";

export interface UserResult {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  relationship: "NONE" | "REQUEST_SENT" | "REQUEST_RECEIVED" | "FRIENDS";
  pendingRequestId: string | null;
}

export interface FriendRequestItem {
  id: string;
  status: string;
  createdAt: string;
  sender: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
}

export interface FriendItem {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
}

export function searchUsers(query: string) {
  return httpClient<{ users: UserResult[] }>(
    `/api/users/search?query=${encodeURIComponent(query)}`,
  );
}

export function sendFriendRequest(receiverId: string) {
  return httpClient<{ message: string }>("/api/friend-requests", {
    method: "POST",
    body: JSON.stringify({ receiverId }),
  });
}

export function getReceivedFriendRequests() {
  return httpClient<{ requests: FriendRequestItem[] }>(
    "/api/friend-requests/received",
  );
}

export function acceptFriendRequest(requestId: string) {
  return httpClient<{ message: string }>(
    `/api/friend-requests/${requestId}/accept`,
    { method: "PATCH" },
  );
}

export function rejectFriendRequest(requestId: string) {
  return httpClient<{ message: string }>(
    `/api/friend-requests/${requestId}/reject`,
    { method: "PATCH" },
  );
}

export function getFriends() {
  return httpClient<{ friends: FriendItem[] }>("/api/friends");
}
