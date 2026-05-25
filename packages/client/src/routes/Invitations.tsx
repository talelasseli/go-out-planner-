import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { Invitation } from "../lib/types";

export default function Invitations() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const invs = await api.getInvitations();
    setInvitations(invs);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleAccept = async (id: string) => {
    await api.acceptInvitation(id);
    load();
  };

  const handleDecline = async (id: string) => {
    await api.declineInvitation(id);
    load();
  };

  if (loading) return <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mt-20" />;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Invitations</h1>
      {invitations.length === 0 ? (
        <p className="text-gray-500 text-sm">No invitations yet.</p>
      ) : (
        <div className="space-y-4">
          {invitations.map((inv) => (
            <div key={inv.id} className="bg-white rounded-xl shadow-sm border p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-semibold text-lg">{inv.plan.title}</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    By {inv.plan.creator.displayName || inv.plan.creator.username}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(inv.plan.planDate).toLocaleDateString()} at {inv.plan.planTime} &middot; {inv.plan.place}
                  </p>
                  {inv.plan.activities.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {inv.plan.activities.map((a) => (
                        <span key={a.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{a.activityName}</span>
                      ))}
                    </div>
                  )}
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                  inv.status === "ACCEPTED" ? "bg-green-100 text-green-700" :
                  inv.status === "DECLINED" ? "bg-red-100 text-red-700" :
                  "bg-yellow-100 text-yellow-700"
                }`}>{inv.status}</span>
              </div>
              {inv.status === "PENDING" && (
                <div className="flex gap-3 mt-4 pt-3 border-t">
                  <button onClick={() => handleAccept(inv.id)}
                    className="text-sm bg-green-600 text-white px-4 py-1.5 rounded-lg hover:bg-green-700 cursor-pointer">Accept</button>
                  <button onClick={() => handleDecline(inv.id)}
                    className="text-sm bg-gray-200 text-gray-700 px-4 py-1.5 rounded-lg hover:bg-gray-300 cursor-pointer">Decline</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
