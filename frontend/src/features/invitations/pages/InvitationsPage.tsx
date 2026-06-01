import { useState, useEffect } from "react";
import { InvitationCard } from "@/components/InvitationCard";
import {
  getInvitations,
  acceptInvitation,
  declineInvitation,
  type InvitationItem,
} from "@/features/invitations/api/invitations";

export default function InvitationsPage() {
  const [invitations, setInvitations] = useState<InvitationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await getInvitations();
        if (!cancelled) setInvitations(res.invitations);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load invitations");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => { cancelled = true; };
  }, []);

  async function handleAccept(invitationId: string) {
    try {
      await acceptInvitation(invitationId);
      setInvitations((prev) =>
        prev.map((inv) =>
          inv.id === invitationId ? { ...inv, status: "ACCEPTED" as const } : inv,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept invitation");
    }
  }

  async function handleDecline(invitationId: string) {
    try {
      await declineInvitation(invitationId);
      setInvitations((prev) =>
        prev.map((inv) =>
          inv.id === invitationId ? { ...inv, status: "DECLINED" as const } : inv,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to decline invitation");
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold">Invitations</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Respond to plan invitations
        </p>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : invitations.length === 0 ? (
        <p className="text-muted-foreground text-sm">No invitations yet.</p>
      ) : (
        <div className="space-y-2">
          {invitations.map((inv) => (
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
          ))}
        </div>
      )}
    </div>
  );
}
