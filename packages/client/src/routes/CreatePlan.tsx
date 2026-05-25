import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import type { Friendship } from "../lib/types";

export default function CreatePlan() {
  const navigate = useNavigate();
  const [friends, setFriends] = useState<Friendship[]>([]);
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
    api.getFriends().then(setFriends);
  }, []);

  const addActivity = () => {
    const a = activityInput.trim();
    if (a && !activities.includes(a)) setActivities([...activities, a]);
    setActivityInput("");
  };

  const removeActivity = (index: number) => {
    setActivities(activities.filter((_, i) => i !== index));
  };

  const toggleFriend = (id: string) => {
    const next = new Set(selectedFriends);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedFriends(next);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (selectedFriends.size === 0) { setError("Select at least one friend to invite"); return; }

    setSubmitting(true);
    try {
      const plan = await api.createPlan({
        title,
        planDate: new Date(planDate).toISOString(),
        planTime,
        place,
        activities,
        invitedFriendIds: Array.from(selectedFriends),
      });
      navigate(`/plans/${plan.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to create plan");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create a plan</h1>
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
          {friends.length === 0 ? (
            <p className="text-sm text-gray-400">No friends yet. Add friends first.</p>
          ) : (
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
          )}
        </div>

        <button type="submit" disabled={submitting}
          className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 cursor-pointer">
          {submitting ? "Creating..." : "Create plan"}
        </button>
      </form>
    </div>
  );
}
