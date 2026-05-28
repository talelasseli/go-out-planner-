import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import type { Friendship } from "../lib/types";
import MapPicker from "../components/MapPicker";
import { useLocalStorage } from "../lib/useLocalStorage";

export default function CreatePlan() {
  const navigate = useNavigate();
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [title, setTitle] = useLocalStorage("createPlan_title", "");
  const [planDate, setPlanDate] = useLocalStorage("createPlan_date", "");
  const [planTime, setPlanTime] = useLocalStorage("createPlan_time", "");
  const [place, setPlace] = useLocalStorage("createPlan_place", "");
  const [latitude, setLatitude] = useLocalStorage<number | null>("createPlan_lat", null);
  const [longitude, setLongitude] = useLocalStorage<number | null>("createPlan_lng", null);
  const [meetupPlace, setMeetupPlace] = useLocalStorage("createPlan_meetupPlace", "");
  const [activities, setActivities] = useLocalStorage<string[]>("createPlan_activities", []);
  const [activityInput, setActivityInput] = useState("");
  const [selectedFriends, setSelectedFriends] = useLocalStorage<string[]>("createPlan_friendIds", []);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const selectedSet = new Set(selectedFriends);

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
    setSelectedFriends((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id],
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (selectedSet.size === 0) { setError("Select at least one friend to invite"); return; }

    setSubmitting(true);
    try {
      const plan = await api.createPlan({
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
      localStorage.removeItem("createPlan_title");
      localStorage.removeItem("createPlan_date");
      localStorage.removeItem("createPlan_time");
      localStorage.removeItem("createPlan_place");
      localStorage.removeItem("createPlan_lat");
      localStorage.removeItem("createPlan_lng");
      localStorage.removeItem("createPlan_meetupPlace");
      localStorage.removeItem("createPlan_activities");
      localStorage.removeItem("createPlan_friendIds");
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
          {friends.length === 0 ? (
            <p className="text-sm text-gray-400">No friends yet. Add friends first.</p>
          ) : (
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
