import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { createPlan } from "@/features/plans/api/plans";
import MapPicker from "@/components/MapPicker";
import { getFriends, type FriendItem } from "@/features/friends/api/friends";

export default function CreatePlanPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [place, setPlace] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [activities, setActivities] = useState<string[]>([""]);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [friendsLoading, setFriendsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    getFriends()
      .then((res) => setFriends(res.friends))
      .catch(() => setError("Failed to load friends list"))
      .finally(() => setFriendsLoading(false));
  }, []);

  function addActivity() {
    if (activities.length < 10) {
      setActivities([...activities, ""]);
    }
  }

  function removeActivity(index: number) {
    if (activities.length > 1) {
      setActivities(activities.filter((_, i) => i !== index));
    }
  }

  function updateActivity(index: number, value: string) {
    const updated = [...activities];
    updated[index] = value;
    setActivities(updated);
  }

  function toggleFriend(id: string) {
    setSelectedFriends((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id],
    );
  }

  function validate(): boolean {
    const errors: Record<string, string> = {};

    if (!title.trim() || title.trim().length < 3 || title.trim().length > 150) {
      errors.title = "Title must be between 3 and 150 characters";
    }

    if (!scheduledAt) {
      errors.scheduledAt = "Date and time is required";
    } else if (new Date(scheduledAt) <= new Date()) {
      errors.scheduledAt = "Date must be in the future";
    }

    if (!place.trim() || place.trim().length < 2 || place.trim().length > 255) {
      errors.place = "Place must be between 2 and 255 characters";
    }

    const validActivities = activities.filter((a) => a.trim().length > 0);
    if (validActivities.length < 1) {
      errors.activities = "At least one activity is required";
    }
    for (const a of activities) {
      if (a.trim().length > 100) {
        errors.activities = "Each activity must be 100 characters or less";
        break;
      }
    }

    if (selectedFriends.length < 1) {
      errors.invitedUserIds = "Select at least one friend";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!validate()) return;

    setLoading(true);

    try {
      await createPlan({
        title: title.trim(),
        scheduledAt: new Date(scheduledAt).toISOString(),
        place: place.trim(),
        ...(latitude != null && longitude != null ? { latitude, longitude } : {}),
        activities: activities.filter((a) => a.trim().length > 0).map((a) => a.trim()),
        invitedUserIds: selectedFriends,
      });
      navigate("/plans/created");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create plan");
    } finally {
      setLoading(false);
    }
  }

  const now = new Date();
  const offset = now.getTimezoneOffset();
  const localNow = new Date(now.getTime() - offset * 60000);
  const minDatetime = localNow.toISOString().slice(0, 16);

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold">Create Plan</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Plan your next outing with friends
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="title" className="text-sm font-medium">Title</label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Go out for pizza"
          />
          {fieldErrors.title && (
            <p className="text-destructive text-xs">{fieldErrors.title}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="scheduledAt" className="text-sm font-medium">Date & Time</label>
          <Input
            id="scheduledAt"
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            min={minDatetime}
          />
          {fieldErrors.scheduledAt && (
            <p className="text-destructive text-xs">{fieldErrors.scheduledAt}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="place" className="text-sm font-medium">Place</label>
          <Input
            id="place"
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            placeholder="City Center"
          />
          {fieldErrors.place && (
            <p className="text-destructive text-xs">{fieldErrors.place}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Pick Location on Map</label>
          <MapPicker
            latitude={latitude}
            longitude={longitude}
            onPick={(lat, lng) => {
              setLatitude(lat);
              setLongitude(lng);
            }}
          />
          {latitude != null && longitude != null && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Lat: {latitude.toFixed(4)}</span>
              <span>Lng: {longitude.toFixed(4)}</span>
              <button
                type="button"
                onClick={() => { setLatitude(null); setLongitude(null); }}
                className="ml-auto text-destructive hover:underline"
              >
                Remove pin
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Activities</label>
            {activities.length < 10 && (
              <Button type="button" size="sm" variant="outline" onClick={addActivity}>
                Add Activity
              </Button>
            )}
          </div>
          <div className="flex flex-col gap-2">
            {activities.map((activity, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={activity}
                  onChange={(e) => updateActivity(index, e.target.value)}
                  placeholder={`Activity ${index + 1}`}
                />
                {activities.length > 1 && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => removeActivity(index)}
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
          </div>
          {fieldErrors.activities && (
            <p className="text-destructive text-xs">{fieldErrors.activities}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">
            Invite Friends
            {selectedFriends.length > 0 && (
              <span className="text-muted-foreground ml-1">
                ({selectedFriends.length} selected)
              </span>
            )}
          </label>
          {friendsLoading ? (
            <Skeleton className="h-4 w-1/3" />
          ) : friends.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              You have no friends to invite. Add friends first.
            </p>
          ) : (
            <div className="max-h-48 flex flex-col gap-1 overflow-y-auto rounded-lg border p-2">
              {friends.map((friend) => (
                <label
                  key={friend.id}
                  className="flex cursor-pointer items-center gap-3 rounded px-2 py-1.5 hover:bg-muted"
                >
                  <input
                    type="checkbox"
                    checked={selectedFriends.includes(friend.id)}
                    onChange={() => toggleFriend(friend.id)}
                    className="h-4 w-4"
                  />
                  <div className="flex items-center gap-2">
                    <Avatar className="size-7">
                      <AvatarFallback className="text-xs">{friend.name?.charAt(0) ?? "?"}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm">{friend.name}</p>
                      {friend.username && (
                        <p className="text-muted-foreground text-xs">
                          @{friend.username}
                        </p>
                      )}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
          {fieldErrors.invitedUserIds && (
            <p className="text-destructive text-xs">{fieldErrors.invitedUserIds}</p>
          )}
        </div>

        {error && <p className="text-destructive text-sm">{error}</p>}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Creating plan..." : "Create Plan"}
        </Button>
      </form>
    </div>
  );
}
