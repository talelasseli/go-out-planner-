import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { PlanCard } from "@/components/PlanCard";
import { Spinner } from "@/components/Spinner";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Mail, Clock, CheckCircle, XCircle, AlertCircle, ArrowRight } from "lucide-react";
import { getInvitedPlans, type InvitedPlan } from "@/features/plans/api/plans";

type Filter = "all" | "PENDING" | "ACCEPTED" | "DECLINED";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "ACCEPTED", label: "Accepted" },
  { value: "DECLINED", label: "Declined" },
];

const FILTER_LABELS: Record<Filter, string> = {
  all: "",
  PENDING: "pending",
  ACCEPTED: "accepted",
  DECLINED: "declined",
};

export default function InvitedPlansPage() {
  const [plans, setPlans] = useState<InvitedPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<Filter>("all");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await getInvitedPlans();
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

  const pendingCount = plans.filter(
    (p) => p.invitationStatus === "PENDING",
  ).length;
  const acceptedCount = plans.filter(
    (p) => p.invitationStatus === "ACCEPTED",
  ).length;
  const declinedCount = plans.filter(
    (p) => p.invitationStatus === "DECLINED",
  ).length;

  const filteredPlans =
    activeFilter === "all"
      ? plans
      : plans.filter((p) => p.invitationStatus === activeFilter);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
      {/* Header */}
      <section className="flex flex-col gap-4 rounded-xl border bg-gradient-to-b from-primary/[0.04] to-background p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold">Invited Plans</h1>
          <p className="text-sm text-muted-foreground">
            See where you've been invited and keep track of your responses.
          </p>
        </div>
        <Link to="/invitations">
          <Button variant="outline">
            View Invitations
            <ArrowRight className="size-4" />
          </Button>
        </Link>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-4 gap-3">
        <StatCard
          icon={<Mail className="size-4" />}
          value={plans.length}
          label="Total invited"
        />
        <StatCard
          icon={<Clock className="size-4" />}
          value={pendingCount}
          label="Pending"
        />
        <StatCard
          icon={<CheckCircle className="size-4" />}
          value={acceptedCount}
          label="Accepted"
        />
        <StatCard
          icon={<XCircle className="size-4" />}
          value={declinedCount}
          label="Declined"
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
          icon={<Mail className="size-6" />}
          title={`No ${FILTER_LABELS[activeFilter]} invitations`}
          description="Try switching to a different filter."
        />
      ) : filteredPlans.length === 0 ? (
        <EmptyState
          icon={<Mail className="size-6" />}
          title="No invited plans yet"
          description="When friends invite you, their plans will appear here."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {filteredPlans.map((plan) => (
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
