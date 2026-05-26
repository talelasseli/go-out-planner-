export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const BASE = import.meta.env.VITE_API_URL ?? "";

async function request<T>(path: string, { headers, ...rest }: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...headers as Record<string, string> },
    ...rest,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(res.status, body.error || "Request failed");
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  getMe: () => request<Profile>("/users/me"),
  createProfile: (data: { username: string; displayName?: string }) =>
    request<Profile>("/users/profile", { method: "POST", body: JSON.stringify(data) }),
  searchUsers: (query: string) =>
    request<Profile[]>(`/users/search?query=${encodeURIComponent(query)}`),

  sendFriendRequest: (receiverId: string) =>
    request<FriendRequest>("/friend-requests", { method: "POST", body: JSON.stringify({ receiverId }) }),
  getReceivedRequests: () => request<FriendRequest[]>("/friend-requests/received"),
  acceptFriendRequest: (id: string) =>
    request<unknown>(`/friend-requests/${id}/accept`, { method: "PATCH" }),
  rejectFriendRequest: (id: string) =>
    request<FriendRequest>(`/friend-requests/${id}/reject`, { method: "PATCH" }),
  getFriends: () => request<Friendship[]>("/friends"),

  createPlan: (data: CreatePlanInput) =>
    request<Plan>("/plans", { method: "POST", body: JSON.stringify(data) }),
  getCreatedPlans: () => request<Plan[]>("/plans/created"),
  getInvitedPlans: () => request<Plan[]>("/plans/invited"),
  getPlan: (id: string) => request<Plan>(`/plans/${id}`),
  editPlan: (id: string, data: EditPlanInput) =>
    request<Plan>(`/plans/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  cancelPlan: (id: string) =>
    request<Plan>(`/plans/${id}/cancel`, { method: "PATCH" }),
  deletePlan: (id: string) =>
    request<void>(`/plans/${id}`, { method: "DELETE" }),

  getInvitations: () => request<Invitation[]>("/invitations"),
  acceptInvitation: (id: string) =>
    request<PlanInvitation>(`/invitations/${id}/accept`, { method: "PATCH" }),
  declineInvitation: (id: string) =>
    request<PlanInvitation>(`/invitations/${id}/decline`, { method: "PATCH" }),
};

import type { Profile, FriendRequest, Friendship, Plan, PlanInvitation, Invitation, CreatePlanInput, EditPlanInput } from "./types";
