import { useEffect, useState, type FormEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import type { Friendship } from "../lib/types";

export default function EditPlan() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [planDate, setPlanDate] = useState("");
  const [planTime, setPlanTime] = useState("");
  const [place, setPlace] = useState("");
  const [activities, setActivities] = useState<string[]>([]);
  const [activityInput, setActivityInput] = useState("");
  const [selectedFriends, setSelectedFriends] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api.getPlan(id),
      api.getFriends(),
    ]).then(([plan, f]) => {
      setTitle(plan.title);
      setPlanDate(plan.planDate.split("T")[0]);
      setPlanTime(plan.planTime);
      setPlace(plan.place);
      setActivities(plan.activities.map((a) => a.activityName));
      setSelectedFriends(new Set(plan.invitations.map((i) => i.invitedUserId)));
      setFriends(f);
    }).catch(() => navigate("/plans/mine"))
    .finally(() => setLoading(false));
  }, [id]);

  const addActivity = () => {
    const a = activityInput.trim();
    if (a && !activities.includes(a)) setActivities([...activities, a]);
    setActivityInput("");
  };

  const removeActivity = (index: number) => {
    setActivities(activities.filter((_, i) => i !== index));
  };

  const toggleFriend = (friendId: string) => {
    const next = new Set(selectedFriends);
    next.has(friendId) ? next.delete(friendId) : next.add(friendId);
    setSelectedFriends(next);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!id) return;

    setSubmitting(true);
    try {
      const plan = await api.editPlan(id, {
        title,
        planDate: new Date(planDate).toISOString(),
        planTime,
        place,
        activities,
        invitedFriendIds: Array.from(selectedFriends),
      });
      navigate(`/plans/${plan.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to update plan");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mt-20" />;

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Edit plan</h1>
      <form onSubmit={handleSubmit} className="space-y-5 bg-white rounded-xl shadow-sm border p-6">
        {error && <div className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</div>}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input type="date" required value={planDate} onChange={(e) => setPlanDate(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
            <input type="time" required value={planTime} onChange={(e) => setPlanTime(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Place</label>
          <input type="text" required value={place} onChange={(e) => setPlace(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Activities</label>
          <div className="flex gap-2">
            <input type="text" value={activityInput} onChange={(e) => setActivityInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addActivity())}
              className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <button type="button" onClick={addActivity}
              className="bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-300 cursor-pointer">Add</button>
          </div>
          {activities.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {activities.map((a, i) => (
                <span key={i} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-sm px-2.5 py-1 rounded-full">
                  {a}
                  <button type="button" onClick={() => removeActivity(i)} className="hover:text-red-600 cursor-pointer">&times;</button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Invite friends ({selectedFriends.size})</label>
          <div className="max-h-48 overflow-y-auto border rounded-lg divide-y">
            {friends.map((f) => (
              <label key={f.id}
                className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer text-sm ${selectedFriends.has(f.friendId) ? "bg-blue-50" : "hover:bg-gray-50"}`}>
                <input type="checkbox" checked={selectedFriends.has(f.friendId)}
                  onChange={() => toggleFriend(f.friendId)} className="rounded" />
                {f.friend.displayName || f.friend.username}
              </label>
            ))}
          </div>
        </div>

        <button type="submit" disabled={submitting}
          className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 cursor-pointer">
          {submitting ? "Saving..." : "Save changes"}
        </button>
      </form>
    </div>
  );
}
