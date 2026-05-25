import { Navigate, Outlet } from "react-router-dom";
import { authClient } from "../lib/authClient";
import FullScreenSpinner from "./FullScreenSpinner";

export default function ProtectedRoute() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) return <FullScreenSpinner />;
  if (!session) return <Navigate to="/login" replace />;

  return <Outlet />;
}
