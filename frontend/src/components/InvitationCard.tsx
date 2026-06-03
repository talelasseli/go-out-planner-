import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Spinner } from "@/components/Spinner"
import { Calendar, MapPin, Check, X } from "lucide-react"

interface InvitationCardProps {
  id: string
  planTitle: string
  scheduledAt: string
  place: string
  planStatus: "ACTIVE" | "CANCELLED"
  invitationStatus: "PENDING" | "ACCEPTED" | "DECLINED"
  onAccept: (id: string) => void
  onDecline: (id: string) => void
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
  const [acceptLoading, setAcceptLoading] = useState(false)
  const [declineLoading, setDeclineLoading] = useState(false)

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

  const isCancelled = planStatus === "CANCELLED"
  const isPending = invitationStatus === "PENDING"
  const isResponded = invitationStatus === "ACCEPTED" || invitationStatus === "DECLINED"

  const handleAccept = async () => {
    setAcceptLoading(true)
    await onAccept(id)
    setAcceptLoading(false)
  }

  const handleDecline = async () => {
    setDeclineLoading(true)
    await onDecline(id)
    setDeclineLoading(false)
  }

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <CardTitle>{planTitle}</CardTitle>
          {isCancelled && (
            <Badge variant="destructive" className="gap-1 shrink-0">
              <span className="size-1.5 rounded-full bg-current" />
              Cancelled
            </Badge>
          )}
          {isResponded && (
            <Badge
              variant={invitationStatus === "ACCEPTED" ? "default" : "outline"}
              className="gap-1 shrink-0"
            >
              <span className="size-1.5 rounded-full bg-current" />
              {invitationStatus === "ACCEPTED" ? "Accepted" : "Declined"}
            </Badge>
          )}
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
      {isPending && !isCancelled && (
        <CardFooter>
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={acceptLoading || declineLoading}
              onClick={handleAccept}
            >
              {acceptLoading ? (
                <Spinner size="sm" />
              ) : (
                <Check className="size-3.5" />
              )}
              Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={acceptLoading || declineLoading}
              onClick={handleDecline}
            >
              {declineLoading ? (
                <Spinner size="sm" />
              ) : (
                <X className="size-3.5" />
              )}
              Decline
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  )
}
