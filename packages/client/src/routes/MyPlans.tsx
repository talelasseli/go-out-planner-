import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import type { Plan } from "../lib/types";

export default function MyPlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const p = await api.getCreatedPlans();
    setPlans(p);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCancel = async (id: string) => {
    if (!confirm("Cancel this plan?")) return;
    await api.cancelPlan(id);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this plan?")) return;
    await api.deletePlan(id);
    load();
  };

  if (loading) return <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mt-20" />;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Plans</h1>
      {plans.length === 0 ? (
        <p className="text-gray-500 text-sm">No plans yet. <Link to="/plans/create" className="text-blue-600">Create one</Link>.</p>
      ) : (
        <div className="space-y-4">
          {plans.map((plan) => (
            <div key={plan.id} className="bg-white rounded-xl shadow-sm border p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-semibold text-lg">{plan.title}</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(plan.planDate).toLocaleDateString()} at {plan.planTime} &middot; {plan.place}
                  </p>
                  {plan.activities.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {plan.activities.map((a) => (
                        <span key={a.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{a.activityName}</span>
                      ))}
                    </div>
                  )}
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                  plan.status === "CANCELLED" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                }`}>{plan.status}</span>
              </div>
              <div className="flex gap-3 mt-4 pt-3 border-t">
                <Link to={`/plans/${plan.id}`}
                  className="text-sm text-blue-600 hover:underline">View</Link>
                {plan.status === "ACTIVE" && (
                  <>
                    <Link to={`/plans/${plan.id}/edit`}
                      className="text-sm text-gray-600 hover:underline">Edit</Link>
                    <button onClick={() => handleCancel(plan.id)}
                      className="text-sm text-orange-600 hover:underline cursor-pointer">Cancel</button>
                    <button onClick={() => handleDelete(plan.id)}
                      className="text-sm text-red-600 hover:underline cursor-pointer">Delete</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
