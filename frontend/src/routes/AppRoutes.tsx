import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/auth/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import DashboardPage from "@/pages/DashboardPage";
import FriendsPage from "@/features/friends/pages/FriendsPage";
import CreatePlanPage from "@/features/plans/pages/CreatePlanPage";
import CreatedPlansPage from "@/features/plans/pages/CreatedPlansPage";
import InvitedPlansPage from "@/features/plans/pages/InvitedPlansPage";
import PlanDetailsPage from "@/features/plans/pages/PlanDetailsPage";
import InvitationsPage from "@/features/invitations/pages/InvitationsPage";
import MapPage from "@/features/map/pages/MapPage";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/friends" element={<FriendsPage />} />
          <Route path="/plans/create" element={<CreatePlanPage />} />
          <Route path="/plans/created" element={<CreatedPlansPage />} />
          <Route path="/plans/invited" element={<InvitedPlansPage />} />
          <Route path="/plans/:planId" element={<PlanDetailsPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/invitations" element={<InvitationsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
