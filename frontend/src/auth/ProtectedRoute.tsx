import { Navigate, Outlet } from "react-router-dom";
import { authClient } from "@/lib/auth-client";
import { Spinner } from "@/components/Spinner";

export function ProtectedRoute() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!session) return <Navigate to="/login" replace />;

  return <Outlet />;
}
