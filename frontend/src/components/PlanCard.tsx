import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Calendar, MapPin, XCircle, Trash2 } from "lucide-react"

interface PlanCardProps {
  id: string
  title: string
  scheduledAt: string
  place: string
  status: "ACTIVE" | "CANCELLED"
  invitationStatus?: "PENDING" | "ACCEPTED" | "DECLINED"
  isCreator?: boolean
  onCancel?: (id: string) => void
  onDelete?: (id: string) => void
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
  const date = new Date(scheduledAt)
  const formattedDate = date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  })
  const formattedTime = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  })

  const invitationBadge = () => {
    if (!invitationStatus || status !== "ACTIVE") return null
    return (
      <Badge
        variant={
          invitationStatus === "PENDING"
            ? "secondary"
            : invitationStatus === "ACCEPTED"
              ? "default"
              : "outline"
        }
        className="gap-1"
      >
        <span className="size-1.5 rounded-full bg-current" />
        {invitationStatus === "PENDING"
          ? "Pending"
          : invitationStatus === "ACCEPTED"
            ? "Accepted"
            : "Declined"}
      </Badge>
    )
  }

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <CardTitle>
              <Link
                to={`/plans/${id}`}
                className="hover:text-primary transition-colors"
              >
                {title}
              </Link>
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              {status === "CANCELLED" && (
                <Badge variant="destructive" className="gap-1">
                  <span className="size-1.5 rounded-full bg-current" />
                  Cancelled
                </Badge>
              )}
              {invitationBadge()}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="size-3.5 shrink-0" />
            <span>
              {formattedDate} at {formattedTime}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="size-3.5 shrink-0" />
            <span>{place}</span>
          </div>
        </div>
      </CardContent>
      {(isCreator && onCancel) || (isCreator && onDelete) ? (
        <CardFooter>
          <div className="flex gap-2">
            {isCreator && status === "ACTIVE" && onCancel && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onCancel(id)}
              >
                <XCircle className="size-3.5" />
                Cancel
              </Button>
            )}
            {isCreator && onDelete && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDelete(id)}
              >
                <Trash2 className="size-3.5" />
                Delete
              </Button>
            )}
          </div>
        </CardFooter>
      ) : null}
    </Card>
  )
}
