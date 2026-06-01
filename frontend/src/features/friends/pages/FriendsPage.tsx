import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
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

export default function FriendsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);

  const [requests, setRequests] = useState<FriendRequestItem[]>([]);
  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        setError(err instanceof Error ? err.message : "Failed to load data");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  function refreshData() {
    setLoading(true);
    setError(null);
    Promise.all([getReceivedFriendRequests(), getFriends()])
      .then(([reqRes, friendsRes]) => {
        setRequests(reqRes.requests);
        setFriends(friendsRes.friends);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load data");
      })
      .finally(() => {
        setLoading(false);
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
            ? { ...u, relationship: "REQUEST_SENT" as const, pendingRequestId: null }
            : u,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send request");
    }
  };

  const handleAcceptFromSearch = async (requestId: string, userId: string) => {
    try {
      await acceptFriendRequest(requestId);
      setSearchResults((prev) =>
        prev.map((u) =>
          u.id === userId
            ? { ...u, relationship: "FRIENDS" as const, pendingRequestId: null }
            : u,
        ),
      );
      refreshData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept request");
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await acceptFriendRequest(requestId);
      refreshData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept request");
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await rejectFriendRequest(requestId);
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject request");
    }
  };

  const renderSearchResult = (user: UserResult) => {
    let button: React.ReactNode | null = null;

    if (user.relationship === "NONE") {
      button = (
        <Button size="sm" onClick={() => handleSendRequest(user.id)}>
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
            <AvatarFallback>{user.name?.charAt(0) ?? "?"}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{user.name}</p>
            {user.username && (
              <p className="text-muted-foreground text-xs">@{user.username}</p>
            )}
          </div>
        </div>
        {button}
      </div>
    );
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold">Friends</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Search for users and manage your friends
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Search Users</h2>
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name or username..."
        />
        {searching && (
          <Skeleton className="h-4 w-1/2" />
        )}
        {!searching && searchQuery.trim().length > 0 && searchResults.length === 0 && (
          <p className="text-muted-foreground text-sm">No users found.</p>
        )}
        <div className="flex flex-col gap-2">
          {searchResults.map(renderSearchResult)}
        </div>
      </div>

      {error && (
        <p className="text-destructive text-sm">{error}</p>
      )}

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">
          Received Requests
          {requests.length > 0 && (
            <span className="text-muted-foreground ml-2 text-sm font-normal">
              ({requests.length})
            </span>
          )}
        </h2>
        {loading ? (
          <Skeleton className="h-4 w-3/4" />
        ) : requests.length === 0 ? (
          <p className="text-muted-foreground text-sm">No pending requests.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {requests.map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between rounded-lg border px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="size-9">
                    <AvatarFallback>{req.sender.name?.charAt(0) ?? "?"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{req.sender.name}</p>
                    {req.sender.username && (
                      <p className="text-muted-foreground text-xs">
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
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">
          My Friends
          {friends.length > 0 && (
            <span className="text-muted-foreground ml-2 text-sm font-normal">
              ({friends.length})
            </span>
          )}
        </h2>
        {loading ? (
          <Skeleton className="h-4 w-3/4" />
        ) : friends.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            You have no friends yet.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {friends.map((friend) => (
              <div
                key={friend.id}
                className="flex items-center gap-3 rounded-lg border px-4 py-3"
              >
                <Avatar className="size-9">
                  <AvatarFallback>{friend.name?.charAt(0) ?? "?"}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{friend.name}</p>
                  {friend.username && (
                    <p className="text-muted-foreground text-xs">
                      @{friend.username}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
