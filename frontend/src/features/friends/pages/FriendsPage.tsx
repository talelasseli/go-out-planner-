import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Spinner } from "@/components/Spinner";
import { EmptyState } from "@/components/EmptyState";
import {
  searchUsers,
  sendFriendRequest,
  getReceivedFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriends,
  type UserResult,
  type FriendRequestItem,
  type FriendItem,
} from "@/features/friends/api/friends";
import {
  Search,
  Mail,
  Users,
  AlertCircle,
  UserPlus,
} from "lucide-react";

export default function FriendsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);

  const [requests, setRequests] = useState<FriendRequestItem[]>([]);
  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("my-friends");

  useEffect(() => {
    let cancelled = false;

    Promise.all([getReceivedFriendRequests(), getFriends()])
      .then(([reqRes, friendsRes]) => {
        if (cancelled) return;
        setRequests(reqRes.requests);
        setFriends(friendsRes.friends);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Failed to load data",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function refreshData() {
    Promise.all([getReceivedFriendRequests(), getFriends()])
      .then(([reqRes, friendsRes]) => {
        setRequests(reqRes.requests);
        setFriends(friendsRes.friends);
      })
      .catch((err) => {
        setError(
          err instanceof Error ? err.message : "Failed to load data",
        );
      });
  }

  const handleSearch = useCallback(async () => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await searchUsers(q);
      setSearchResults(res.users);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    const timer = setTimeout(handleSearch, 300);
    return () => clearTimeout(timer);
  }, [handleSearch]);

  const handleSendRequest = async (receiverId: string) => {
    try {
      await sendFriendRequest(receiverId);
      setSearchResults((prev) =>
        prev.map((u) =>
          u.id === receiverId
            ? {
                ...u,
                relationship: "REQUEST_SENT" as const,
                pendingRequestId: null,
              }
            : u,
        ),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to send request",
      );
    }
  };

  const handleAcceptFromSearch = async (
    requestId: string,
    userId: string,
  ) => {
    try {
      await acceptFriendRequest(requestId);
      setSearchResults((prev) =>
        prev.map((u) =>
          u.id === userId
            ? {
                ...u,
                relationship: "FRIENDS" as const,
                pendingRequestId: null,
              }
            : u,
        ),
      );
      refreshData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to accept request",
      );
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await acceptFriendRequest(requestId);
      refreshData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to accept request",
      );
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await rejectFriendRequest(requestId);
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to reject request",
      );
    }
  };

  function renderSearchResult(user: UserResult) {
    let button: React.ReactNode | null = null;

    if (user.relationship === "NONE") {
      button = (
        <Button size="sm" onClick={() => handleSendRequest(user.id)}>
          <UserPlus className="size-3.5" />
          Send Request
        </Button>
      );
    } else if (user.relationship === "REQUEST_SENT") {
      button = (
        <Button size="sm" variant="outline" disabled>
          Request Sent
        </Button>
      );
    } else if (user.relationship === "REQUEST_RECEIVED") {
      button = (
        <Button
          size="sm"
          onClick={() =>
            user.pendingRequestId &&
            handleAcceptFromSearch(user.pendingRequestId, user.id)
          }
        >
          Accept
        </Button>
      );
    } else if (user.relationship === "FRIENDS") {
      button = (
        <Button size="sm" variant="ghost" disabled>
          Friends
        </Button>
      );
    }

    return (
      <div
        key={user.id}
        className="flex items-center justify-between rounded-lg border px-4 py-3"
      >
        <div className="flex items-center gap-3">
          <Avatar className="size-9">
            <AvatarFallback>
              {user.name?.charAt(0) ?? "?"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{user.name}</p>
            {user.username && (
              <p className="text-xs text-muted-foreground">
                @{user.username}
              </p>
            )}
          </div>
        </div>
        {button}
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8">
      {/* Header */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-b from-primary/[0.04] to-background p-6">
          <h1 className="text-2xl font-bold">Friends</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Find people, manage requests, and build your night-out crew.
          </p>
          {(friends.length > 0 || requests.length > 0) && (
            <div className="mt-3 flex gap-4">
              {friends.length > 0 && (
                <div className="flex items-center gap-1.5 text-sm">
                  <Users className="size-3.5 text-primary" />
                  <span className="font-medium">{friends.length}</span>
                  <span className="text-muted-foreground">friends</span>
                </div>
              )}
              {requests.length > 0 && (
                <div className="flex items-center gap-1.5 text-sm">
                  <span className="size-1.5 rounded-full bg-amber-500" />
                  <span className="font-medium">{requests.length}</span>
                  <span className="text-muted-foreground">pending</span>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Error */}
      {error && (
        <Card>
          <CardContent className="flex items-center gap-2 py-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full">
          <TabsTrigger value="my-friends" className="flex-1">
            My Friends
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex-1">
            Requests
            {requests.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {requests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="find-friends" className="flex-1">
            Find Friends
          </TabsTrigger>
        </TabsList>

        {/* My Friends Tab */}
        <TabsContent value="my-friends" className="flex flex-col gap-2">
          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : friends.length === 0 ? (
            <EmptyState
              icon={<Users className="size-6" />}
              title="No friends yet"
              description="Find friends to start planning nights out together."
              actionLabel="Find Friends"
              onAction={() => setActiveTab("find-friends")}
            />
          ) : (
            friends.map((friend) => (
              <div
                key={friend.id}
                className="flex items-center gap-3 rounded-lg border px-4 py-3"
              >
                <Avatar className="size-9">
                  <AvatarFallback>
                    {friend.name?.charAt(0) ?? "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{friend.name}</p>
                  {friend.username && (
                    <p className="text-xs text-muted-foreground">
                      @{friend.username}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </TabsContent>

        {/* Requests Tab */}
        <TabsContent value="requests" className="flex flex-col gap-2">
          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : requests.length === 0 ? (
            <EmptyState
              icon={<Mail className="size-6" />}
              title="No pending requests"
              description="You're all caught up."
            />
          ) : (
            requests.map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between rounded-lg border px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="size-9">
                    <AvatarFallback>
                      {req.sender.name?.charAt(0) ?? "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">
                      {req.sender.name}
                    </p>
                    {req.sender.username && (
                      <p className="text-xs text-muted-foreground">
                        @{req.sender.username}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleAcceptRequest(req.id)}
                  >
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRejectRequest(req.id)}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))
          )}
        </TabsContent>

        {/* Find Friends Tab */}
        <TabsContent value="find-friends" className="flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or username..."
              className="pl-9"
            />
          </div>
          {searching ? (
            <div className="flex justify-center py-8">
              <Spinner size="md" />
            </div>
          ) : searchQuery.trim().length >= 2 &&
            searchResults.length === 0 ? (
            <EmptyState
              icon={<Search className="size-6" />}
              title="No users found"
              description="Try a different search term."
            />
          ) : searchQuery.trim().length < 2 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Type at least 2 characters to search.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {searchResults.map(renderSearchResult)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
