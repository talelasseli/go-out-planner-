import { useState, useEffect } from "react";
import { toast } from "sonner";
import { InvitationCard } from "@/components/InvitationCard";
import { Spinner } from "@/components/Spinner";
import { EmptyState } from "@/components/EmptyState";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  getInvitations,
  acceptInvitation,
  declineInvitation,
  type InvitationItem,
} from "@/features/invitations/api/invitations";
import {
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

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

export default function InvitationsPage() {
  const [invitations, setInvitations] = useState<InvitationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("pending");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await getInvitations();
        if (!cancelled) setInvitations(res.invitations);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load invitations",
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

  async function handleAccept(invitationId: string) {
    try {
      await acceptInvitation(invitationId);
      setInvitations((prev) =>
        prev.map((inv) =>
          inv.id === invitationId
            ? { ...inv, status: "ACCEPTED" as const }
            : inv,
        ),
      );
      toast.success("Invitation accepted");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to accept invitation";
      setError(msg);
      toast.error(msg);
    }
  }

  async function handleDecline(invitationId: string) {
    try {
      await declineInvitation(invitationId);
      setInvitations((prev) =>
        prev.map((inv) =>
          inv.id === invitationId
            ? { ...inv, status: "DECLINED" as const }
            : inv,
        ),
      );
      toast.success("Invitation declined");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to decline invitation";
      setError(msg);
      toast.error(msg);
    }
  }

  const pendingCount = invitations.filter(
    (i) => i.status === "PENDING",
  ).length;
  const acceptedCount = invitations.filter(
    (i) => i.status === "ACCEPTED",
  ).length;
  const declinedCount = invitations.filter(
    (i) => i.status === "DECLINED",
  ).length;

  function renderInvitationCard(inv: InvitationItem) {
    return (
      <InvitationCard
        key={inv.id}
        id={inv.id}
        planTitle={inv.plan.title}
        scheduledAt={inv.plan.scheduledAt}
        place={inv.plan.place}
        planStatus={inv.plan.status}
        invitationStatus={inv.status}
        onAccept={handleAccept}
        onDecline={handleDecline}
      />
    );
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8">
      {/* Header */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-b from-primary/[0.04] to-background p-6">
          <h1 className="text-2xl font-bold">Invitations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review plan invites from friends and keep your nights out organized.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              icon={<Mail className="size-4" />}
              value={invitations.length}
              label="Total"
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
          </div>
        </div>
      </Card>

      {/* Error */}
      {error && (
        <Card>
          <CardContent className="flex items-center gap-2 py-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : (
        /* Tabs */
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-2 sm:grid-cols-4">
            <TabsTrigger value="pending" className="flex-1">
              Pending
              {pendingCount > 0 && (
                <span className="ml-1 inline-flex size-5 items-center justify-center rounded-full bg-primary/10 text-[11px] font-medium text-primary">
                  {pendingCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="all" className="flex-1">
              All
            </TabsTrigger>
            <TabsTrigger value="accepted" className="flex-1">
              Accepted
            </TabsTrigger>
            <TabsTrigger value="declined" className="flex-1">
              Declined
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="flex flex-col gap-2">
            {pendingCount === 0 ? (
              <EmptyState
                icon={<Clock className="size-6" />}
                title="No pending invitations"
                description="You're all caught up. New invites from friends will appear here."
              />
            ) : (
              invitations
                .filter((i) => i.status === "PENDING")
                .map(renderInvitationCard)
            )}
          </TabsContent>

          <TabsContent value="all" className="flex flex-col gap-2">
            {invitations.length === 0 ? (
              <EmptyState
                icon={<Mail className="size-6" />}
                title="No invitations yet"
                description="When friends invite you to plans, they'll appear here."
              />
            ) : (
              invitations.map(renderInvitationCard)
            )}
          </TabsContent>

          <TabsContent value="accepted" className="flex flex-col gap-2">
            {acceptedCount === 0 ? (
              <EmptyState
                icon={<CheckCircle className="size-6" />}
                title="No accepted invitations"
              />
            ) : (
              invitations
                .filter((i) => i.status === "ACCEPTED")
                .map(renderInvitationCard)
            )}
          </TabsContent>

          <TabsContent value="declined" className="flex flex-col gap-2">
            {declinedCount === 0 ? (
              <EmptyState
                icon={<XCircle className="size-6" />}
                title="No declined invitations"
              />
            ) : (
              invitations
                .filter((i) => i.status === "DECLINED")
                .map(renderInvitationCard)
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
