import { useEffect, useState, type FormEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import type { Friendship } from "../lib/types";
import MapPicker from "../components/MapPicker";
import { useLocalStorage } from "../lib/useLocalStorage";

export default function EditPlan() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useLocalStorage(`editPlan_${id}_title`, "");
  const [planDate, setPlanDate] = useLocalStorage(`editPlan_${id}_date`, "");
  const [planTime, setPlanTime] = useLocalStorage(`editPlan_${id}_time`, "");
  const [place, setPlace] = useLocalStorage(`editPlan_${id}_place`, "");
  const [latitude, setLatitude] = useLocalStorage<number | null>(`editPlan_${id}_lat`, null);
  const [longitude, setLongitude] = useLocalStorage<number | null>(`editPlan_${id}_lng`, null);
  const [meetupPlace, setMeetupPlace] = useLocalStorage(`editPlan_${id}_meetupPlace`, "");
  const [activities, setActivities] = useLocalStorage<string[]>(`editPlan_${id}_activities`, []);
  const [activityInput, setActivityInput] = useState("");
  const [selectedFriends, setSelectedFriends] = useLocalStorage<string[]>(`editPlan_${id}_friendIds`, []);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const selectedSet = new Set(selectedFriends);

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
      setLatitude(plan.latitude);
      setLongitude(plan.longitude);
      setMeetupPlace(plan.meetupPlace ?? "");
      setActivities(plan.activities.map((a) => a.activityName));
      setSelectedFriends(plan.invitations.map((i) => i.invitedUserId));
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
    setSelectedFriends((prev) =>
      prev.includes(friendId) ? prev.filter((f) => f !== friendId) : [...prev, friendId],
    );
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
        latitude: latitude ?? undefined,
        longitude: longitude ?? undefined,
        meetupPlace: meetupPlace || undefined,
        activities,
        invitedFriendIds: selectedFriends,
      });
      const prefix = `editPlan_${id}`;
      localStorage.removeItem(`${prefix}_title`);
      localStorage.removeItem(`${prefix}_date`);
      localStorage.removeItem(`${prefix}_time`);
      localStorage.removeItem(`${prefix}_place`);
      localStorage.removeItem(`${prefix}_lat`);
      localStorage.removeItem(`${prefix}_lng`);
      localStorage.removeItem(`${prefix}_meetupPlace`);
      localStorage.removeItem(`${prefix}_activities`);
      localStorage.removeItem(`${prefix}_friendIds`);
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
          <MapPicker
            place={place}
            latitude={latitude}
            longitude={longitude}
            onPlaceChange={setPlace}
            onLatLngChange={(lat, lng) => { setLatitude(lat); setLongitude(lng); }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Meetup spot (optional)</label>
          <input type="text" value={meetupPlace} onChange={(e) => setMeetupPlace(e.target.value)}
            placeholder="e.g. main entrance, fountain, table 5..."
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
          <label className="block text-sm font-medium text-gray-700 mb-2">Invite friends ({selectedSet.size})</label>
          <div className="max-h-48 overflow-y-auto border rounded-lg divide-y">
            {friends.map((f) => (
              <label key={f.id}
                className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer text-sm ${selectedSet.has(f.friendId) ? "bg-blue-50" : "hover:bg-gray-50"}`}>
                <input type="checkbox" checked={selectedSet.has(f.friendId)}
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
