import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface InvitationCardProps {
  id: string;
  planTitle: string;
  scheduledAt: string;
  place: string;
  planStatus: "ACTIVE" | "CANCELLED";
  invitationStatus: "PENDING" | "ACCEPTED" | "DECLINED";
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
}

export function InvitationCard({
  id,
  planTitle,
  scheduledAt,
  place,
  planStatus,
  invitationStatus,
  onAccept,
  onDecline,
}: InvitationCardProps) {
  const date = new Date(scheduledAt);
  const formattedDate = date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const formattedTime = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const isCancelled = planStatus === "CANCELLED";
  const isPending = invitationStatus === "PENDING";
  const isResponded = invitationStatus === "ACCEPTED" || invitationStatus === "DECLINED";

  return (
    <div className="flex items-center justify-between rounded-lg border px-4 py-3">
      <div>
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">{planTitle}</p>
          {isCancelled && (
            <Badge variant="destructive" className="gap-1.5">
              <span className="size-1.5 rounded-full bg-current" />
              Cancelled
            </Badge>
          )}
          {isResponded && (
            <Badge variant={invitationStatus === "ACCEPTED" ? "default" : "outline"} className="gap-1.5">
              <span className="size-1.5 rounded-full bg-current" />
              {invitationStatus === "ACCEPTED" ? "Accepted" : "Declined"}
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground mt-0.5 text-xs">
          {formattedDate} at {formattedTime} &middot; {place}
        </p>
      </div>
      {isPending && !isCancelled && (
        <div className="flex gap-2">
          <Button size="sm" onClick={() => onAccept(id)}>
            Accept
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDecline(id)}
          >
            Decline
          </Button>
        </div>
      )}
    </div>
  );
}
