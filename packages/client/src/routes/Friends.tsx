import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { Profile, FriendRequest, Friendship } from "../lib/types";

export default function Friends() {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [loading, setLoading] = useState(true);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  const loadData = async () => {
    setLoading(true);
    const [r, f] = await Promise.all([
      api.getReceivedRequests(),
      api.getFriends(),
    ]);
    setRequests(r);
    setFriends(f);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (!query.trim()) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await api.searchUsers(query);
        setSearchResults(results);
      } catch { setSearchResults([]); }
      setSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSendRequest = async (receiverId: string) => {
    try {
      await api.sendFriendRequest(receiverId);
      setSentIds((prev) => new Set(prev).add(receiverId));
    } catch {}
  };

  const handleAccept = async (id: string) => {
    await api.acceptFriendRequest(id);
    loadData();
  };

  const handleReject = async (id: string) => {
    await api.rejectFriendRequest(id);
    loadData();
  };

  const existingFriendIds = new Set(friends.map((f) => f.friendId));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Friends</h1>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Search users</h2>
        <input type="text" placeholder="Search by username or display name..." value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        {searching && <p className="text-sm text-gray-400 mt-2">Searching...</p>}
        {searchResults.length > 0 && (
          <div className="mt-3 space-y-2">
            {searchResults.map((p) => (
              <div key={p.id} className="flex items-center justify-between bg-white rounded-lg border px-4 py-3">
                <div>
                  <p className="font-medium">{p.displayName || p.username}</p>
                  <p className="text-sm text-gray-500">@{p.username}</p>
                </div>
                {existingFriendIds.has(p.id) ? (
                  <span className="text-sm text-gray-400">Friends</span>
                ) : sentIds.has(p.id) ? (
                  <span className="text-sm text-gray-400">Request sent</span>
                ) : (
                  <button onClick={() => handleSendRequest(p.id)}
                    className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 cursor-pointer">
                    Add friend
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">
          Requests {requests.length > 0 && <span className="text-blue-600">({requests.length})</span>}
        </h2>
        {loading ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : requests.length === 0 ? (
          <p className="text-sm text-gray-400">No pending requests</p>
        ) : (
          <div className="space-y-2">
            {requests.map((r) => (
              <div key={r.id} className="flex items-center justify-between bg-white rounded-lg border px-4 py-3">
                <p className="font-medium">{r.sender?.displayName || r.sender?.username}</p>
                <div className="flex gap-2">
                  <button onClick={() => handleAccept(r.id)}
                    className="text-sm bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 cursor-pointer">Accept</button>
                  <button onClick={() => handleReject(r.id)}
                    className="text-sm bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-300 cursor-pointer">Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Friends ({friends.length})</h2>
        {loading ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : friends.length === 0 ? (
          <p className="text-sm text-gray-400">No friends yet. Search for users above to get started.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {friends.map((f) => (
              <div key={f.id} className="bg-white rounded-lg border px-4 py-3">
                <p className="font-medium">{f.friend.displayName || f.friend.username}</p>
                <p className="text-sm text-gray-500">@{f.friend.username}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
