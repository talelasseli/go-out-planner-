import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
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
        <p className="text-muted-foreground">Loading...</p>
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
    <div className="mx-auto max-w-xl space-y-6 px-4 py-8">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{plan.title}</h1>
            {plan.status === "CANCELLED" && (
              <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                Cancelled
              </span>
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

      <div className="space-y-3 rounded-lg border p-4">
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
        </div>
      </div>

      {plan.activities.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Activities</h2>
          <div className="flex flex-wrap gap-2">
            {plan.activities.map((activity, i) => (
              <span
                key={i}
                className="rounded bg-gray-100 px-3 py-1 text-sm"
              >
                {activity}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">
          Invitations
          <span className="text-muted-foreground ml-2 text-sm font-normal">
            {acceptedCount} accepted, {pendingCount} pending, {declinedCount} declined
          </span>
        </h2>
        {plan.invitations.length === 0 ? (
          <p className="text-muted-foreground text-sm">No invitations sent.</p>
        ) : (
          <div className="space-y-2">
            {plan.invitations.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between rounded-lg border px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-muted flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium">
                    {inv.invitedUser.name?.charAt(0) ?? "?"}
                  </div>
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
                <span
                  className={`rounded px-2 py-0.5 text-xs font-medium ${
                    inv.status === "PENDING"
                      ? "bg-yellow-100 text-yellow-700"
                      : inv.status === "ACCEPTED"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {inv.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
