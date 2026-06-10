import { httpClient } from "@/lib/http";

export interface CreatePlanInput {
  title: string;
  scheduledAt: string;
  place: string;
  latitude?: number;
  longitude?: number;
  activities: string[];
  invitedUserIds: string[];
}

export interface PlanSummary {
  id: string;
  title: string;
  scheduledAt: string;
  place: string;
  latitude?: number | null;
  longitude?: number | null;
  status: "ACTIVE" | "CANCELLED";
  createdAt: string;
}

export interface InvitedPlan extends PlanSummary {
  invitationStatus: "PENDING" | "ACCEPTED" | "DECLINED";
}

export interface PlanDetail {
  id: string;
  title: string;
  scheduledAt: string;
  place: string;
  latitude?: number | null;
  longitude?: number | null;
  status: "ACTIVE" | "CANCELLED";
  createdAt: string;
  updatedAt: string;
  creator: { id: string; name: string | null; username: string | null; image: string | null };
  activities: string[];
  invitations: Array<{
    id: string;
    status: "PENDING" | "ACCEPTED" | "DECLINED";
    invitedUser: { id: string; name: string | null; username: string | null; image: string | null };
  }>;
}

export function createPlan(data: CreatePlanInput) {
  return httpClient<{ plan: PlanDetail }>("/api/plans", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function getCreatedPlans() {
  return httpClient<{ plans: PlanSummary[] }>("/api/plans/created");
}

export function getInvitedPlans() {
  return httpClient<{ plans: InvitedPlan[] }>("/api/plans/invited");
}

export function getPlanDetails(planId: string) {
  return httpClient<{ plan: PlanDetail }>(`/api/plans/${planId}`);
}

export function cancelPlan(planId: string) {
  return httpClient<{ message: string }>(`/api/plans/${planId}/cancel`, {
    method: "PATCH",
  });
}

export function deletePlan(planId: string) {
  return httpClient<{ message: string }>(`/api/plans/${planId}`, {
    method: "DELETE",
  });
}
