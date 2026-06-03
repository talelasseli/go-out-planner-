import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getPlanDetails,
  cancelPlan,
  deletePlan,
  type PlanDetail,
} from "@/features/plans/api/plans";
import { authClient } from "@/lib/auth-client";

export default function PlanDetailsPage() {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();
  const [plan, setPlan] = useState<PlanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!planId) return;
    let cancelled = false;

    async function load() {
      try {
        const res = await getPlanDetails(planId!);
        if (!cancelled) setPlan(res.plan);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load plan");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => { cancelled = true; };
  }, [planId]);

  const isCreator = plan && session?.user.id === plan.creator.id;

  async function handleCancel() {
    if (!plan || !window.confirm("Cancel this plan?")) return;
    try {
      await cancelPlan(plan.id);
      setPlan({ ...plan, status: "CANCELLED" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel plan");
    }
  }

  async function handleDelete() {
    if (!plan || !window.confirm("Delete this plan permanently?")) return;
    try {
      await deletePlan(plan.id);
      navigate("/plans/created");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete plan");
    }
  }

  const date = plan ? new Date(plan.scheduledAt) : null;
  const formattedDate = date
    ? date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "";
  const formattedTime = date
    ? date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  if (loading) {
    return (
      <div className="mx-auto max-w-xl px-4 py-8">
        <Skeleton className="h-6 w-3/4" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-xl px-4 py-8">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="mx-auto max-w-xl px-4 py-8">
        <p className="text-muted-foreground">Plan not found.</p>
      </div>
    );
  }

  const acceptedCount = plan.invitations.filter((i) => i.status === "ACCEPTED").length;
  const pendingCount = plan.invitations.filter((i) => i.status === "PENDING").length;
  const declinedCount = plan.invitations.filter((i) => i.status === "DECLINED").length;

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 px-4 py-8">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{plan.title}</h1>
            {plan.status === "CANCELLED" && (
              <Badge variant="destructive" className="gap-1.5">
                <span className="size-1.5 rounded-full bg-current" />
                Cancelled
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            Created by {plan.creator.name ?? plan.creator.username}
          </p>
        </div>
        {isCreator && plan.status === "ACTIVE" && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel Plan
            </Button>
            <Button variant="outline" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        )}
        {isCreator && plan.status === "CANCELLED" && (
          <Button variant="outline" onClick={handleDelete}>
            Delete
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-3 rounded-lg border p-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-muted-foreground text-xs uppercase">Date</p>
            <p className="text-sm font-medium">{formattedDate}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs uppercase">Time</p>
            <p className="text-sm font-medium">{formattedTime}</p>
          </div>
          <div className="col-span-2">
            <p className="text-muted-foreground text-xs uppercase">Place</p>
            <p className="text-sm font-medium">{plan.place}</p>
          </div>
          {plan.latitude != null && plan.longitude != null && (
            <div className="col-span-2">
              <p className="text-muted-foreground text-xs uppercase">Coordinates</p>
              <p className="text-sm font-medium">
                {plan.latitude.toFixed(6)}, {plan.longitude.toFixed(6)}
              </p>
            </div>
          )}
        </div>
      </div>

      {plan.activities.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">Activities</h2>
          <div className="flex flex-wrap gap-2">
            {plan.activities.map((activity, i) => (
              <span
                key={i}
                className="rounded bg-muted px-3 py-1 text-sm"
              >
                {activity}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">
          Invitations
          <span className="text-muted-foreground ml-2 text-sm font-normal">
            {acceptedCount} accepted, {pendingCount} pending, {declinedCount} declined
          </span>
        </h2>
        {plan.invitations.length === 0 ? (
          <p className="text-muted-foreground text-sm">No invitations sent.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {plan.invitations.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between rounded-lg border px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="size-8">
                    <AvatarFallback>{inv.invitedUser.name?.charAt(0) ?? "?"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">
                      {inv.invitedUser.name}
                    </p>
                    {inv.invitedUser.username && (
                      <p className="text-muted-foreground text-xs">
                        @{inv.invitedUser.username}
                      </p>
                    )}
                  </div>
                </div>
                <Badge
                  variant={
                    inv.status === "PENDING"
                      ? "secondary"
                      : inv.status === "ACCEPTED"
                        ? "default"
                        : "outline"
                  }
                  className="gap-1.5"
                >
                  <span className="size-1.5 rounded-full bg-current" />
                  {inv.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
