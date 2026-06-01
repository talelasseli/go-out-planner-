import { Link } from "react-router-dom";
import { authClient } from "@/lib/auth-client";

const links = [
  { to: "/friends", label: "Friends", desc: "Search users, manage friends" },
  { to: "/plans/create", label: "Create Plan", desc: "Plan a new outing" },
  { to: "/plans/created", label: "My Plans", desc: "View plans you created" },
  { to: "/plans/invited", label: "Invited Plans", desc: "Plans you're invited to" },
  { to: "/invitations", label: "Invitations", desc: "Respond to invitations" },
];

export default function DashboardPage() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) return null;

  return (
    <div className="mx-auto flex max-w-2xl flex-1 flex-col items-center justify-center gap-8 px-4">
      <div className="text-center">
        <h2 className="text-3xl font-bold">
          Welcome{session?.user.name ? `, ${session.user.name}` : ""}!
        </h2>
        <p className="text-muted-foreground mt-2">
          You're signed in and ready to plan.
        </p>
      </div>

      <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="rounded-lg border p-4 transition-colors hover:bg-gray-50"
          >
            <h3 className="font-semibold">{link.label}</h3>
            <p className="text-muted-foreground mt-1 text-sm">{link.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
