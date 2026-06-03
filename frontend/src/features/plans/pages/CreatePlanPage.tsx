import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/Spinner";
import { createPlan } from "@/features/plans/api/plans";
import MapPicker from "@/components/MapPicker";
import { getFriends, type FriendItem } from "@/features/friends/api/friends";
import {
  Calendar as CalendarIcon,
  MapPin,
  Plus,
  X,
  Users,
  AlertCircle,
} from "lucide-react";

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const hours = Math.floor(i / 2)
    .toString()
    .padStart(2, "0");
  const minutes = i % 2 === 0 ? "00" : "30";
  return `${hours}:${minutes}`;
});

function combineToISO(date: Date, time: string): string {
  const parts = time.split(":").map(Number);
  const hours = parts[0] ?? 0;
  const minutes = parts[1] ?? 0;
  const d = new Date(date);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
}

export default function CreatePlanPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState("19:00");
  const [place, setPlace] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [activities, setActivities] = useState<string[]>([]);
  const [activityInput, setActivityInput] = useState("");
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
    const trimmed = activityInput.trim();
    if (!trimmed) return;
    if (activities.includes(trimmed)) return;
    setActivities([...activities, trimmed]);
    setActivityInput("");
  }

  function removeActivity(index: number) {
    setActivities(activities.filter((_, i) => i !== index));
  }

  function toggleFriend(id: string) {
    setSelectedFriends((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id],
    );
  }

  function validate(): boolean {
    const errors: Record<string, string> = {};

    if (
      !title.trim() ||
      title.trim().length < 3 ||
      title.trim().length > 150
    ) {
      errors.title = "Title must be between 3 and 150 characters";
    }

    if (!selectedDate) {
      errors.date = "Date is required";
    } else if (!selectedTime) {
      errors.time = "Time is required";
    } else {
      const combined = combineToISO(selectedDate!, selectedTime);
      if (new Date(combined) <= new Date()) {
        errors.scheduledAt = "Date must be in the future";
      }
    }

    if (
      !place.trim() ||
      place.trim().length < 2 ||
      place.trim().length > 255
    ) {
      errors.place = "Place must be between 2 and 255 characters";
    }

    if (activities.length < 1) {
      errors.activities = "At least one activity is required";
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
        scheduledAt: combineToISO(selectedDate!, selectedTime),
        place: place.trim(),
        ...(latitude != null && longitude != null
          ? { latitude, longitude }
          : {}),
        activities: activities.map((a) => a.trim()),
        invitedUserIds: selectedFriends,
      });
      navigate("/plans/created");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create plan",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6">
      {/* Compact Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">Create a Plan</h1>
        <p className="text-sm text-muted-foreground">
          Choose a place, invite friends, and plan something memorable.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex-1">
        <div className="grid min-h-[560px] gap-6 lg:min-h-[calc(100vh-220px)] lg:grid-cols-2">
          {/* Left Column — Map */}
          <Card className="flex h-full flex-col overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="size-4" />
                Pick a Location
              </CardTitle>
              <CardDescription>
                Click on the map to set a location for your plan.
              </CardDescription>
            </CardHeader>
            <CardContent className="min-h-0 flex-1 p-0">
              <div className="h-full [&>div]:!h-full">
                <MapPicker
                  latitude={latitude}
                  longitude={longitude}
                  onPick={(lat, lng) => {
                    setLatitude(lat);
                    setLongitude(lng);
                  }}
                />
              </div>
            </CardContent>
            {latitude != null && longitude != null && (
              <CardFooter className="flex items-center justify-between border-t px-4 py-2.5">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="size-3.5 shrink-0 text-primary" />
                  <span className="font-medium">
                    {place || "Selected location"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {latitude.toFixed(4)}, {longitude.toFixed(4)}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setLatitude(null);
                      setLongitude(null);
                    }}
                    className="text-xs text-destructive hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </CardFooter>
            )}
          </Card>

          {/* Right Column — Form */}
          <Card className="flex h-full flex-col overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="size-4" />
                Plan Setup
              </CardTitle>
              <CardDescription>
                Add the details and invite your friends.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-4 overflow-y-auto">
              {/* Section 1: Title & Place */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Go out for pizza"
                  />
                  {fieldErrors.title && (
                    <p className="text-xs text-destructive">
                      {fieldErrors.title}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="place">Place</Label>
                  <Input
                    id="place"
                    value={place}
                    onChange={(e) => setPlace(e.target.value)}
                    placeholder="City Center"
                  />
                  {fieldErrors.place && (
                    <p className="text-xs text-destructive">
                      {fieldErrors.place}
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              {/* Section 2: Date & Time */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Popover>
                    <PopoverTrigger
                      className={cn(
                        "flex w-full items-center gap-2 rounded-lg border border-input bg-background px-4 py-2 text-sm shadow-sm",
                        "hover:bg-accent hover:text-accent-foreground",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        !selectedDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="size-4" />
                      {selectedDate
                        ? format(selectedDate, "PPP")
                        : "Pick a date"}
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        disabled={(date) =>
                          date <
                          new Date(new Date().setHours(0, 0, 0, 0))
                        }
                      />
                    </PopoverContent>
                  </Popover>
                  {fieldErrors.date && (
                    <p className="text-xs text-destructive">
                      {fieldErrors.date}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Time</Label>
                  <Select
                    value={selectedTime}
                    onValueChange={(value) => {
                      if (value) setSelectedTime(value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a time" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldErrors.time && (
                    <p className="text-xs text-destructive">
                      {fieldErrors.time}
                    </p>
                  )}
                </div>
              </div>
              {fieldErrors.scheduledAt && (
                <p className="text-xs text-destructive">
                  {fieldErrors.scheduledAt}
                </p>
              )}

              <Separator />

              {/* Section 3: Activities */}
              <div className="space-y-3">
                <Label>Activities</Label>
                <div className="flex gap-2">
                  <Input
                    value={activityInput}
                    onChange={(e) => setActivityInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addActivity();
                      }
                    }}
                    placeholder="Add an activity..."
                  />
                  <Button type="button" size="sm" onClick={addActivity}>
                    <Plus className="size-4" />
                    Add
                  </Button>
                </div>
                {activities.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {activities.map((activity, i) => (
                      <Badge
                        key={i}
                        variant="secondary"
                        className="gap-1 pr-1"
                      >
                        {activity}
                        <button
                          type="button"
                          onClick={() => removeActivity(i)}
                          className="ml-0.5 rounded-sm p-0.5 hover:bg-muted-foreground/20"
                          aria-label={`Remove ${activity}`}
                        >
                          <X className="size-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No activities added yet.
                  </p>
                )}
                {fieldErrors.activities && (
                  <p className="text-xs text-destructive">
                    {fieldErrors.activities}
                  </p>
                )}
              </div>

              <Separator />

              {/* Section 4: Invite Friends */}
              <div className="flex flex-1 flex-col gap-2 min-h-0">
                <Label className="flex items-center gap-2">
                  <Users className="size-4" />
                  Invite Friends
                  {selectedFriends.length > 0 && (
                    <span className="text-xs font-normal text-muted-foreground">
                      ({selectedFriends.length} selected)
                    </span>
                  )}
                </Label>
                {friendsLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Spinner size="md" />
                  </div>
                ) : friends.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    You have no friends to invite. Add friends first.
                  </p>
                ) : (
                  <div className="max-h-[180px] overflow-y-auto space-y-0.5 rounded-lg border p-1">
                    {friends.map((friend) => (
                      <label
                        key={friend.id}
                        className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-1.5 hover:bg-muted"
                      >
                        <Checkbox
                          id={`friend-${friend.id}`}
                          checked={selectedFriends.includes(friend.id)}
                          onCheckedChange={() => toggleFriend(friend.id)}
                        />
                        <Avatar className="size-7">
                          <AvatarFallback className="text-xs">
                            {friend.name?.charAt(0) ?? "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col leading-tight">
                          <span className="text-sm font-medium">
                            {friend.name}
                          </span>
                          {friend.username && (
                            <span className="text-xs text-muted-foreground">
                              @{friend.username}
                            </span>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                )}
                {fieldErrors.invitedUserIds && (
                  <p className="text-xs text-destructive">
                    {fieldErrors.invitedUserIds}
                  </p>
                )}
              </div>

              {/* Submit */}
              <div className="mt-auto space-y-3 border-t pt-4">
                {error && (
                  <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                    <AlertCircle className="size-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
                <Button type="submit" disabled={loading} className="w-full">
                  {loading && <Spinner size="sm" />}
                  {loading ? "Creating plan..." : "Create Plan"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
