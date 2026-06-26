import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { PlanCard } from "@/components/PlanCard";
import { InvitationCard } from "@/components/InvitationCard";
import { EmptyState } from "@/components/EmptyState";
import { Spinner } from "@/components/Spinner";
import {
  CalendarPlus,
  Calendar,
  Mail,
  Users,
  Clock,
  AlertCircle,
} from "lucide-react";
import {
  getCreatedPlans,
  getInvitedPlans,
  type PlanSummary,
  type InvitedPlan,
} from "@/features/plans/api/plans";
import {
  getInvitations,
  acceptInvitation,
  declineInvitation,
  type InvitationItem,
} from "@/features/invitations/api/invitations";
import { getFriends, type FriendItem } from "@/features/friends/api/friends";

interface DashboardData {
  createdPlans: PlanSummary[];
  invitedPlans: InvitedPlan[];
  invitations: InvitationItem[];
  friends: FriendItem[];
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { data: session, isPending: sessionPending } = authClient.useSession();

  const [data, setData] = useState<DashboardData>({
    createdPlans: [],
    invitedPlans: [],
    invitations: [],
    friends: [],
  });
  const [loading, setLoading] = useState(true);
  const [allFailed, setAllFailed] = useState(false);
  const [sectionErrors, setSectionErrors] = useState({
    createdPlans: false,
    invitedPlans: false,
    invitations: false,
    friends: false,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [created, invited, invs, friendsList] = await Promise.allSettled([
        getCreatedPlans(),
        getInvitedPlans(),
        getInvitations(),
        getFriends(),
      ]);

      if (cancelled) return;

      const errors = {
        createdPlans: false,
        invitedPlans: false,
        invitations: false,
        friends: false,
      };

      if (created.status === "fulfilled") {
        setData((prev) => ({ ...prev, createdPlans: created.value.plans }));
      } else {
        errors.createdPlans = true;
      }

      if (invited.status === "fulfilled") {
        setData((prev) => ({ ...prev, invitedPlans: invited.value.plans }));
      } else {
        errors.invitedPlans = true;
      }

      if (invs.status === "fulfilled") {
        setData((prev) => ({ ...prev, invitations: invs.value.invitations }));
      } else {
        errors.invitations = true;
      }

      if (friendsList.status === "fulfilled") {
        setData((prev) => ({ ...prev, friends: friendsList.value.friends }));
      } else {
        errors.friends = true;
      }

      setSectionErrors(errors);
      setAllFailed(Object.values(errors).every(Boolean));
      setLoading(false);
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const pendingInvitations = data.invitations.filter(
    (inv) => inv.status === "PENDING",
  );

  const upcomingPlans = [
    ...data.createdPlans
      .filter((p) => p.status === "ACTIVE")
      .map((p) => ({ plan: p, kind: "created" as const })),
    ...data.invitedPlans
      .filter((p) => p.status === "ACTIVE")
      .map((p) => ({ plan: p, kind: "invited" as const })),
  ]
    .sort(
      (a, b) =>
        new Date(a.plan.scheduledAt).getTime() -
        new Date(b.plan.scheduledAt).getTime(),
    )
    .slice(0, 3);

  const handleAcceptInvitation = async (invitationId: string) => {
    await acceptInvitation(invitationId);
    setData((prev) => ({
      ...prev,
      invitations: prev.invitations.map((inv) =>
        inv.id === invitationId ? { ...inv, status: "ACCEPTED" as const } : inv,
      ),
    }));
  };

  const handleDeclineInvitation = async (invitationId: string) => {
    await declineInvitation(invitationId);
    setData((prev) => ({
      ...prev,
      invitations: prev.invitations.map((inv) =>
        inv.id === invitationId ? { ...inv, status: "DECLINED" as const } : inv,
      ),
    }));
  };

  if (sessionPending || loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-8">
      {/* Hero */}
      <section className="flex flex-col items-center gap-4 rounded-xl border bg-gradient-to-b from-primary/[0.04] to-background px-6 py-12 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <CalendarPlus className="size-6" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          Ready for your next night out
          {session?.user?.name ? `, ${session.user.name}` : ""}?
        </h1>
        <p className="max-w-md text-balance text-muted-foreground">
          Plan something memorable, invite your friends, and keep everyone in
          sync.
        </p>
        <div className="mt-2 flex gap-3">
          <Link to="/plans/create">
            <Button>Create a Plan</Button>
          </Link>
          <Link to="/invitations">
            <Button variant="outline">View Invitations</Button>
          </Link>
        </div>
      </section>

      {/* Summary stats */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={<Calendar className="size-4" />}
          value={
            sectionErrors.createdPlans
              ? "—"
              : String(data.createdPlans.length)
          }
          label="Plans created"
        />
        <StatCard
          icon={<Users className="size-4" />}
          value={
            sectionErrors.invitedPlans
              ? "—"
              : String(data.invitedPlans.length)
          }
          label="Plans invited"
        />
        <StatCard
          icon={<Mail className="size-4" />}
          value={
            sectionErrors.invitations
              ? "—"
              : String(pendingInvitations.length)
          }
          label="Pending invites"
        />
        <StatCard
          icon={<Users className="size-4" />}
          value={sectionErrors.friends ? "—" : String(data.friends.length)}
          label="Friends"
        />
      </section>

      {/* All-failed error */}
      {allFailed && (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed px-6 py-8 text-sm text-muted-foreground">
          <AlertCircle className="size-4" />
          <span>Couldn't load dashboard data. Try refreshing.</span>
        </div>
      )}

      {/* Two-column: Upcoming + Pending */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Upcoming plans */}
        <section className="flex flex-col gap-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Clock className="size-4 text-primary" />
            Upcoming Plans
          </h2>
          {sectionErrors.createdPlans && sectionErrors.invitedPlans ? (
            <EmptyState
              icon={<AlertCircle className="size-6" />}
              title="Couldn't load plans"
            />
          ) : upcomingPlans.length === 0 ? (
            <EmptyState
              icon={<Calendar className="size-6" />}
              title="No upcoming plans"
              description="Create a plan to get started."
              actionLabel="Create a Plan"
              onAction={() => navigate("/plans/create")}
            />
          ) : (
            <div className="flex flex-col gap-3">
              {upcomingPlans.map(({ plan, kind }) => (
                <PlanCard
                  key={plan.id}
                  id={plan.id}
                  title={plan.title}
                  scheduledAt={plan.scheduledAt}
                  place={plan.place}
                  status={plan.status}
                  invitationStatus={
                    kind === "invited"
                      ? (plan as InvitedPlan).invitationStatus
                      : undefined
                  }
                  isCreator={kind === "created"}
                />
              ))}
            </div>
          )}
        </section>

        {/* Pending invitations */}
        <section className="flex flex-col gap-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Mail className="size-4 text-primary" />
            Pending Invitations
          </h2>
          {sectionErrors.invitations ? (
            <EmptyState
              icon={<AlertCircle className="size-6" />}
              title="Couldn't load invitations"
            />
          ) : pendingInvitations.length === 0 ? (
            <EmptyState
              icon={<Mail className="size-6" />}
              title="No pending invitations"
              description="You're all caught up."
            />
          ) : (
            <div className="flex flex-col gap-3">
              {pendingInvitations.slice(0, 3).map((inv) => (
                <InvitationCard
                  key={inv.id}
                  id={inv.id}
                  planTitle={inv.plan.title}
                  scheduledAt={inv.plan.scheduledAt}
                  place={inv.plan.place}
                  planStatus={inv.plan.status}
                  invitationStatus={inv.status}
                  onAccept={handleAcceptInvitation}
                  onDecline={handleDeclineInvitation}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-3 pb-0">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        <span className="text-2xl font-bold">{value}</span>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
