import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/Spinner";
import { EmptyState } from "@/components/EmptyState";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  getPlanDetails,
  cancelPlan,
  deletePlan,
  type PlanDetail,
} from "@/features/plans/api/plans";
import { authClient } from "@/lib/auth-client";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  AlertCircle,
  CalendarX,
  Trash2,
  XCircle,
} from "lucide-react";

const STYLE_URL = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

function MapPreview({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE_URL,
      center: [longitude, latitude],
      zoom: 13,
      scrollZoom: false,
      doubleClickZoom: false,
      dragRotate: false,
    });

    map.on("load", () => map.resize());

    new maplibregl.Marker().setLngLat([longitude, latitude]).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [latitude, longitude]);

  return (
    <div
      ref={containerRef}
      className="h-56 w-full overflow-hidden rounded-lg border"
    />
  );
}

export default function PlanDetailsPage() {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();
  const [plan, setPlan] = useState<PlanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<"cancel" | "delete" | null>(
    null,
  );
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!planId) return;
    let cancelled = false;

    async function load() {
      try {
        const res = await getPlanDetails(planId!);
        if (!cancelled) setPlan(res.plan);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load plan",
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
  }, [planId]);

  const isCreator = plan && session?.user.id === plan.creator.id;

  async function handleCancel() {
    if (!plan) return;
    setActionLoading(true);
    try {
      await cancelPlan(plan.id);
      setPlan({ ...plan, status: "CANCELLED" });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to cancel plan",
      );
    } finally {
      setActionLoading(false);
      setPendingAction(null);
    }
  }

  async function handleDelete() {
    if (!plan) return;
    setActionLoading(true);
    try {
      await deletePlan(plan.id);
      navigate("/plans/created");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete plan",
      );
      setActionLoading(false);
      setPendingAction(null);
    }
  }

  const date = plan ? new Date(plan.scheduledAt) : null;
  const formattedDate = date
    ? date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "";
  const formattedTime = date
    ? date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  if (loading) {
    return (
      <div className="mx-auto flex max-w-5xl items-center justify-center px-4 py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <AlertCircle className="size-8 text-destructive" />
            <p className="text-sm font-medium">Failed to load plan</p>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button
              variant="outline"
              onClick={() => navigate("/plans/created")}
            >
              Back to My Plans
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <EmptyState
          icon={<CalendarX className="size-6" />}
          title="Plan not found"
          description="This plan may have been deleted or the link is incorrect."
          actionLabel="Back to My Plans"
          onAction={() => navigate("/plans/created")}
        />
      </div>
    );
  }

  const acceptedCount = plan.invitations.filter(
    (i) => i.status === "ACCEPTED",
  ).length;
  const pendingCount = plan.invitations.filter(
    (i) => i.status === "PENDING",
  ).length;
  const declinedCount = plan.invitations.filter(
    (i) => i.status === "DECLINED",
  ).length;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8">
      {/* Hero Header Card */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-b from-primary/[0.04] to-background p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{plan.title}</h1>
                {plan.status === "CANCELLED" && (
                  <Badge variant="destructive" className="gap-1.5">
                    <span className="size-1.5 rounded-full bg-current" />
                    Cancelled
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Created by {plan.creator.name ?? plan.creator.username}
              </p>
            </div>
            {isCreator && (
              <div className="flex flex-wrap gap-2 max-sm:w-full max-sm:[&>button]:flex-1">
                {plan.status === "ACTIVE" && (
                  <Button
                    variant="outline"
                    onClick={() => setPendingAction("cancel")}
                  >
                    <XCircle className="size-4" />
                    Cancel Plan
                  </Button>
                )}
                <Button
                  variant={plan.status === "ACTIVE" ? "outline" : "destructive"}
                  onClick={() => setPendingAction("delete")}
                >
                  <Trash2 className="size-4" />
                  Delete
                </Button>
              </div>
            )}
          </div>
          <div className="mt-4 flex flex-wrap gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="size-4 shrink-0 text-primary" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="size-4 shrink-0 text-primary" />
              <span>{formattedTime}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="size-4 shrink-0 text-primary" />
              <span>{plan.place}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Plan Overview Card */}
          <Card>
            <CardHeader>
              <CardTitle>Plan Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="size-4 shrink-0 text-primary" />
                <span className="text-muted-foreground">Date:</span>
                <span className="font-medium">{formattedDate}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="size-4 shrink-0 text-primary" />
                <span className="text-muted-foreground">Time:</span>
                <span className="font-medium">{formattedTime}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="size-4 shrink-0 text-primary" />
                <span className="text-muted-foreground">Place:</span>
                <span className="font-medium">{plan.place}</span>
              </div>
              <Separator />
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Status:</span>
                {plan.status === "CANCELLED" ? (
                  <Badge variant="destructive" className="gap-1.5">
                    <span className="size-1.5 rounded-full bg-current" />
                    Cancelled
                  </Badge>
                ) : (
                  <Badge variant="default" className="gap-1.5">
                    <span className="size-1.5 rounded-full bg-current" />
                    Active
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Activities Card */}
          <Card>
            <CardHeader>
              <CardTitle>Activities</CardTitle>
            </CardHeader>
            <CardContent>
              {plan.activities.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {plan.activities.map((activity, i) => (
                    <Badge key={i} variant="secondary">
                      {activity}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No activities planned.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column / Sidebar */}
        <div className="flex flex-col gap-6">
          {/* Invitations Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="size-4" />
                Invitees
              </CardTitle>
              <CardDescription>
                {acceptedCount} accepted &middot; {pendingCount} pending &middot;{" "}
                {declinedCount} declined
              </CardDescription>
            </CardHeader>
            <CardContent>
              {plan.invitations.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No invitations sent yet.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {plan.invitations.map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between rounded-lg border px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          <AvatarFallback>
                            {inv.invitedUser.name?.charAt(0) ?? "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">
                            {inv.invitedUser.name}
                          </p>
                          {inv.invitedUser.username && (
                            <p className="text-xs text-muted-foreground">
                              @{inv.invitedUser.username}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge
                        variant={
                          inv.status === "ACCEPTED"
                            ? "default"
                            : inv.status === "PENDING"
                              ? "secondary"
                              : "outline"
                        }
                        className="gap-1.5"
                      >
                        <span className="size-1.5 rounded-full bg-current" />
                        {inv.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Location Card */}
          {plan.latitude != null && plan.longitude != null && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="size-4" />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <p className="text-sm text-muted-foreground">{plan.place}</p>
                <MapPreview
                  latitude={plan.latitude}
                  longitude={plan.longitude}
                />
                <p className="text-xs text-muted-foreground/60">
                  {plan.latitude.toFixed(6)}, {plan.longitude.toFixed(6)}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Confirm Dialog — Cancel */}
      <ConfirmDialog
        open={pendingAction === "cancel"}
        onOpenChange={(open) => {
          if (!open) setPendingAction(null);
        }}
        title="Cancel this plan?"
        description="This will mark the plan as cancelled."
        confirmLabel="Cancel plan"
        loading={actionLoading}
        onConfirm={handleCancel}
      />

      {/* Confirm Dialog — Delete */}
      <ConfirmDialog
        open={pendingAction === "delete"}
        onOpenChange={(open) => {
          if (!open) setPendingAction(null);
        }}
        title="Delete this plan?"
        description="This will permanently delete this plan. This cannot be undone."
        confirmLabel="Delete plan"
        destructive
        loading={actionLoading}
        onConfirm={handleDelete}
      />
    </div>
  );
}
