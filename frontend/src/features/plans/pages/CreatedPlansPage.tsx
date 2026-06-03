import { useState, useEffect } from "react";
import { PlanCard } from "@/components/PlanCard";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { getCreatedPlans, cancelPlan, deletePlan, type PlanSummary } from "@/features/plans/api/plans";

type ConfirmAction = { type: "cancel" | "delete"; planId: string } | null;

export default function CreatedPlansPage() {
  const [plans, setPlans] = useState<PlanSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmAction>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await getCreatedPlans();
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

  async function handleCancel(planId: string) {
    setConfirm({ type: "cancel", planId });
  }

  async function handleDelete(planId: string) {
    setConfirm({ type: "delete", planId });
  }

  async function executeConfirm() {
    if (!confirm) return;
    setConfirmLoading(true);

    try {
      if (confirm.type === "cancel") {
        await cancelPlan(confirm.planId);
        setPlans((prev) =>
          prev.map((p) =>
            p.id === confirm.planId ? { ...p, status: "CANCELLED" as const } : p,
          ),
        );
      } else {
        await deletePlan(confirm.planId);
        setPlans((prev) => prev.filter((p) => p.id !== confirm.planId));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel plan");
    } finally {
      setConfirmLoading(false);
      setConfirm(null);
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold">My Plans</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Plans you have created
        </p>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      {loading ? (
        <Skeleton className="h-4 w-3/4" />
      ) : plans.length === 0 ? (
        <p className="text-muted-foreground text-sm">You haven't created any plans yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              {...plan}
              isCreator
              onCancel={handleCancel}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(open) => { if (!open) setConfirm(null); }}
        title={
          confirm?.type === "cancel" ? "Cancel plan?" : "Delete plan?"
        }
        description={
          confirm?.type === "cancel"
            ? "Are you sure you want to cancel this plan?"
            : "Are you sure you want to delete this plan? This cannot be undone."
        }
        confirmLabel={confirm?.type === "cancel" ? "Cancel plan" : "Delete plan"}
        destructive={confirm?.type === "delete"}
        loading={confirmLoading}
        onConfirm={executeConfirm}
      />
    </div>
  );
}
