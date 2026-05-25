import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { authClient } from "../lib/authClient";
import { api, ApiError } from "../lib/api";
import type { Profile } from "../lib/types";

export default function Dashboard() {
  const { data: session } = authClient.useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  useEffect(() => {
    api.getMe().then(setProfile).catch((err) => {
      if (err instanceof ApiError && err.status === 404) setProfile(null);
    }).finally(() => setLoading(false));
  }, []);

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    setCreating(true);
    try {
      const p = await api.createProfile({ username, displayName: displayName || undefined });
      setProfile(p);
    } catch (err: any) {
      setCreateError(err.message || "Failed to create profile");
    } finally {
      setCreating(false);
    }
  };

  const userDisplay = session?.user?.name || session?.user?.email;

  if (loading) {
    return <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mt-20" />;
  }

  if (!profile) {
    return (
      <div className="max-w-md mx-auto mt-10">
        <h1 className="text-xl font-bold mb-2">Welcome, {userDisplay}!</h1>
        <p className="text-gray-500 text-sm mb-6">Set up your profile to get started.</p>
        <form onSubmit={handleCreateProfile} className="space-y-4 bg-white rounded-xl shadow-sm border p-6">
          {createError && <div className="text-red-600 text-sm">{createError}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Display name (optional)</label>
            <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button type="submit" disabled={creating}
            className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 cursor-pointer">
            {creating ? "Creating..." : "Create profile"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Welcome back, {profile.displayName || profile.username}!</h1>
      <p className="text-gray-500 text-sm mb-6">{profile.username}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card href="/friends" title="Friends" description="Search users and manage friendships" />
        <Card href="/plans/create" title="New Plan" description="Create a go-out plan" />
        <Card href="/plans/mine" title="My Plans" description="View and manage your plans" />
        <Card href="/invitations" title="Invitations" description="Respond to plan invitations" />
      </div>
    </div>
  );
}

function Card({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <Link to={href}
      className="block bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition">
      <h2 className="font-semibold text-blue-600 mb-1">{title}</h2>
      <p className="text-sm text-gray-500">{description}</p>
    </Link>
  );
}
