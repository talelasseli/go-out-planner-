import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PlanCardProps {
  id: string;
  title: string;
  scheduledAt: string;
  place: string;
  status: "ACTIVE" | "CANCELLED";
  invitationStatus?: "PENDING" | "ACCEPTED" | "DECLINED";
  isCreator?: boolean;
  onCancel?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function PlanCard({
  id,
  title,
  scheduledAt,
  place,
  status,
  invitationStatus,
  isCreator,
  onCancel,
  onDelete,
}: PlanCardProps) {
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

  return (
    <div className="flex items-center justify-between rounded-lg border px-4 py-3">
      <Link to={`/plans/${id}`} className="flex-1">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">{title}</p>
            {status === "CANCELLED" && (
              <Badge variant="destructive" className="gap-1.5">
                <span className="size-1.5 rounded-full bg-current" />
                Cancelled
              </Badge>
            )}
            {invitationStatus && status === "ACTIVE" && (
              <Badge
                variant={
                  invitationStatus === "PENDING"
                    ? "secondary"
                    : invitationStatus === "ACCEPTED"
                      ? "default"
                      : "outline"
                }
                className="gap-1.5"
              >
                <span className="size-1.5 rounded-full bg-current" />
                {invitationStatus}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-0.5 text-xs">
            {formattedDate} at {formattedTime} &middot; {place}
          </p>
        </div>
      </Link>
      <div className="flex gap-2">
        {isCreator && status === "ACTIVE" && onCancel && (
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.preventDefault();
              onCancel(id);
            }}
          >
            Cancel
          </Button>
        )}
        {isCreator && onDelete && (
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.preventDefault();
              onDelete(id);
            }}
          >
            Delete
          </Button>
        )}
      </div>
    </div>
  );
}
