import { useState, useEffect } from "react";
import { PlanCard } from "@/components/PlanCard";
import { Skeleton } from "@/components/ui/skeleton";
import { getInvitedPlans, type InvitedPlan } from "@/features/plans/api/plans";

export default function InvitedPlansPage() {
  const [plans, setPlans] = useState<InvitedPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await getInvitedPlans();
        if (!cancelled) setPlans(res.plans);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load plans");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => { cancelled = true; };
  }, []);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold">Invited Plans</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Plans you have been invited to
        </p>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      {loading ? (
        <Skeleton className="h-4 w-3/4" />
      ) : plans.length === 0 ? (
        <p className="text-muted-foreground text-sm">No plans yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              id={plan.id}
              title={plan.title}
              scheduledAt={plan.scheduledAt}
              place={plan.place}
              status={plan.status}
              invitationStatus={plan.invitationStatus}
            />
          ))}
        </div>
      )}
    </div>
  );
}
