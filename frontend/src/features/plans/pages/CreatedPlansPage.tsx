import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PlanCard } from "@/components/PlanCard";
import { Spinner } from "@/components/Spinner";
import { EmptyState } from "@/components/EmptyState";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Calendar, Clock, XCircle, AlertCircle, Plus } from "lucide-react";
import {
  getCreatedPlans,
  cancelPlan,
  deletePlan,
  type PlanSummary,
} from "@/features/plans/api/plans";

type Filter = "all" | "ACTIVE" | "CANCELLED";
type ConfirmAction = { type: "cancel" | "delete"; planId: string } | null;

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "ACTIVE", label: "Active" },
  { value: "CANCELLED", label: "Cancelled" },
];

export default function CreatedPlansPage() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<PlanSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<Filter>("all");
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
          setError(
            err instanceof Error ? err.message : "Failed to load plans",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const activeCount = plans.filter((p) => p.status === "ACTIVE").length;
  const cancelledCount = plans.filter((p) => p.status === "CANCELLED").length;

  const filteredPlans =
    activeFilter === "all"
      ? plans
      : plans.filter((p) => p.status === activeFilter);

  const handleCancel = (planId: string) => {
    setConfirm({ type: "cancel", planId });
  };

  const handleDelete = (planId: string) => {
    setConfirm({ type: "delete", planId });
  };

  async function executeConfirm() {
    if (!confirm) return;
    setConfirmLoading(true);

    try {
      if (confirm.type === "cancel") {
        await cancelPlan(confirm.planId);
        setPlans((prev) =>
          prev.map((p) =>
            p.id === confirm.planId
              ? { ...p, status: "CANCELLED" as const }
              : p,
          ),
        );
      } else {
        await deletePlan(confirm.planId);
        setPlans((prev) => prev.filter((p) => p.id !== confirm.planId));
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to cancel plan",
      );
    } finally {
      setConfirmLoading(false);
      setConfirm(null);
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
      {/* Header */}
      <section className="flex flex-col gap-4 rounded-xl border bg-gradient-to-b from-primary/[0.04] to-background p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold">My Plans</h1>
          <p className="text-sm text-muted-foreground">
            Manage the nights out you created and keep everyone in sync.
          </p>
        </div>
        <Link to="/plans/create">
          <Button>
            <Plus className="size-4" />
            Create a Plan
          </Button>
        </Link>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-3 gap-3">
        <StatCard
          icon={<Calendar className="size-4" />}
          value={plans.length}
          label="Total plans"
        />
        <StatCard
          icon={<Clock className="size-4" />}
          value={activeCount}
          label="Upcoming"
        />
        <StatCard
          icon={<XCircle className="size-4" />}
          value={cancelledCount}
          label="Cancelled"
        />
      </section>

      {/* Filters */}
      <div className="flex gap-2">
        {FILTERS.map((f) => (
          <Button
            key={f.value}
            variant={activeFilter === f.value ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveFilter(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-1 items-center justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed px-6 py-8 text-sm text-muted-foreground">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : filteredPlans.length === 0 && activeFilter !== "all" ? (
        <EmptyState
          icon={<Calendar className="size-6" />}
          title={`No ${activeFilter.toLowerCase()} plans`}
          description="Try switching to a different filter."
        />
      ) : filteredPlans.length === 0 ? (
        <EmptyState
          icon={<Calendar className="size-6" />}
          title="No plans created yet"
          description="Start by creating a plan and inviting your friends."
          actionLabel="Create a Plan"
          onAction={() => navigate("/plans/create")}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {filteredPlans.map((plan) => (
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

      {/* Confirm dialog */}
      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(open) => {
          if (!open) setConfirm(null);
        }}
        title={confirm?.type === "cancel" ? "Cancel plan?" : "Delete plan?"}
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

function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-0">
        <span className="text-2xl font-bold">{value}</span>
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
