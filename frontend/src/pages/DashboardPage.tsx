import { useNavigate } from "react-router-dom";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { data: session, isPending } = authClient.useSession();

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => navigate("/login"),
      },
    });
  };

  if (isPending) return null;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-border flex items-center justify-between border-b px-6 py-4">
        <h1 className="text-xl font-bold">Go Out Planner</h1>
        <div className="flex items-center gap-4">
          <span className="text-muted-foreground text-sm">
            {session?.user.email}
          </span>
          <Button variant="outline" onClick={handleSignOut}>
            Sign out
          </Button>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <h2 className="text-3xl font-bold">
            Welcome{session?.user.name ? `, ${session.user.name}` : ""}!
          </h2>
          <p className="text-muted-foreground mt-2">
            You're signed in and ready to plan.
          </p>
        </div>
      </main>
    </div>
  );
}
