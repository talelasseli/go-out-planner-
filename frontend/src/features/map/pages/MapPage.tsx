import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import MapView from "@/components/MapView";
import {
  getCreatedPlans,
  getInvitedPlans,
  type PlanSummary,
} from "@/features/plans/api/plans";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

interface MappablePlan extends PlanSummary {
  latitude: number;
  longitude: number;
}

export default function MapPage() {
  const [plans, setPlans] = useState<MappablePlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getCreatedPlans(), getInvitedPlans()])
      .then(([created, invited]) => {
        const all = [...created.plans, ...invited.plans];
        const unique = Array.from(
          new Map(all.map((p) => [p.id, p])).values(),
        );
        const mappable = unique.filter(
          (p): p is MappablePlan =>
            p.latitude != null && p.longitude != null,
        );
        setPlans(mappable);
      })
      .catch((err) => console.error("Failed to load plans:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
    
        <div className="flex min-h-0 flex-1">
          <Skeleton className="flex-1 rounded-none" />
        </div>
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-4">
        
        <p className="text-muted-foreground">
          No plans on the map yet. Create a plan and drop a pin to see it here.
        </p>
        <Link to="/plans/create">
          <Button>Create a Plan</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      
      <div className="flex flex-1 min-h-0">
        <MapView plans={plans} />
      </div>
    </div>
  );
}
