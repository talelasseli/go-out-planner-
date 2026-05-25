import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { Plan } from "../lib/types";

export default function PlanDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const p = await api.getPlan(id);
      setPlan(p);
    } catch (err: any) {
      setError(err.message || "Plan not found");
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const handleCancel = async () => {
    if (!id || !confirm("Cancel this plan?")) return;
    await api.cancelPlan(id);
    load();
  };

  const handleDelete = async () => {
    if (!id || !confirm("Delete this plan permanently?")) return;
    await api.deletePlan(id);
    navigate("/plans/mine");
  };

  if (loading) return <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mt-20" />;
  if (error) return <p className="text-red-600">{error}</p>;
  if (!plan) return null;

  const accepted = plan.invitations.filter((i) => i.status === "ACCEPTED");
  const declined = plan.invitations.filter((i) => i.status === "DECLINED");
  const pending = plan.invitations.filter((i) => i.status === "PENDING");

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{plan.title}</h1>
          {plan.creator && (
            <p className="text-sm text-gray-500 mt-1">
              Created by {plan.creator.displayName || plan.creator.username}
            </p>
          )}
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
          plan.status === "CANCELLED" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
        }`}>{plan.status}</span>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Date</span>
            <p className="font-medium">{new Date(plan.planDate).toLocaleDateString()}</p>
          </div>
          <div>
            <span className="text-gray-500">Time</span>
            <p className="font-medium">{plan.planTime}</p>
          </div>
          <div className="col-span-2">
            <span className="text-gray-500">Place</span>
            <p className="font-medium">{plan.place}</p>
          </div>
        </div>

        {plan.activities.length > 0 && (
          <div>
            <span className="text-sm text-gray-500">Activities</span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {plan.activities.map((a) => (
                <span key={a.id} className="text-sm bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">{a.activityName}</span>
              ))}
            </div>
          </div>
        )}

        <div>
          <span className="text-sm text-gray-500">Invitations</span>
          <div className="space-y-1.5 mt-1">
            {accepted.map((inv) => (
              <div key={inv.id} className="flex justify-between text-sm py-1">
                <span>{inv.invitee?.displayName || inv.invitee?.username}</span>
                <span className="text-green-600 font-medium">Accepted</span>
              </div>
            ))}
            {pending.map((inv) => (
              <div key={inv.id} className="flex justify-between text-sm py-1">
                <span>{inv.invitee?.displayName || inv.invitee?.username}</span>
                <span className="text-yellow-600 font-medium">Pending</span>
              </div>
            ))}
            {declined.map((inv) => (
              <div key={inv.id} className="flex justify-between text-sm py-1">
                <span>{inv.invitee?.displayName || inv.invitee?.username}</span>
                <span className="text-red-600 font-medium">Declined</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {plan.status === "ACTIVE" && (
        <div className="flex gap-3 mt-6">
          <Link to={`/plans/${plan.id}/edit`}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
            Edit plan
          </Link>
          <button onClick={handleCancel}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 cursor-pointer">
            Cancel plan
          </button>
          <button onClick={handleDelete}
            className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 cursor-pointer">
            Delete plan
          </button>
        </div>
      )}
    </div>
  );
}
