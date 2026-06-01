import { Outlet, Link, useNavigate } from "react-router-dom";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export default function AppLayout() {
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => navigate("/login"),
      },
    });
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-border bg-background px-6 py-4 shadow-sm">
        <Link to="/dashboard">
          <h1 className="text-xl font-bold text-primary">Go Out Planner</h1>
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-muted-foreground text-sm">
            {session?.user.email}
          </span>
          <Link to="/friends">
            <Button variant="ghost">Friends</Button>
          </Link>
          <Link to="/plans/create">
            <Button variant="ghost">New Plan</Button>
          </Link>
          <Link to="/plans/created">
            <Button variant="ghost">My Plans</Button>
          </Link>
          <Link to="/plans/invited">
            <Button variant="ghost">Invited</Button>
          </Link>
          <Link to="/invitations">
            <Button variant="ghost">Invitations</Button>
          </Link>
          <Button variant="outline" onClick={handleSignOut}>
            Sign out
          </Button>
        </div>
      </header>
      <main className="flex flex-1 flex-col">
        <Outlet />
      </main>
    </div>
  );
}
