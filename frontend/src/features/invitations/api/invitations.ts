import { httpClient } from "@/lib/http";

export interface InvitationItem {
  id: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED";
  plan: {
    id: string;
    title: string;
    scheduledAt: string;
    place: string;
    status: "ACTIVE" | "CANCELLED";
  };
}

export function getInvitations() {
  return httpClient<{ invitations: InvitationItem[] }>("/api/invitations");
}

export function acceptInvitation(invitationId: string) {
  return httpClient<{ message: string }>(
    `/api/invitations/${invitationId}/accept`,
    { method: "PATCH" },
  );
}

export function declineInvitation(invitationId: string) {
  return httpClient<{ message: string }>(
    `/api/invitations/${invitationId}/decline`,
    { method: "PATCH" },
  );
}
