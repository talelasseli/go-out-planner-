import { authClient } from "@/lib/auth-client";

export default function DashboardPage() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) return null;

  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="text-center">
        <h2 className="text-3xl font-bold">
          Welcome{session?.user.name ? `, ${session.user.name}` : ""}!
        </h2>
        <p className="text-muted-foreground mt-2">
          You're signed in and ready to plan.
        </p>
      </div>
    </div>
  );
}
