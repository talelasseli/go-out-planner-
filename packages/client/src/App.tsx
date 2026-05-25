import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./routes/Login";
import Register from "./routes/Register";
import Dashboard from "./routes/Dashboard";
import Friends from "./routes/Friends";
import CreatePlan from "./routes/CreatePlan";
import MyPlans from "./routes/MyPlans";
import Invitations from "./routes/Invitations";
import PlanDetails from "./routes/PlanDetails";
import EditPlan from "./routes/EditPlan";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/friends" element={<Friends />} />
            <Route path="/plans/create" element={<CreatePlan />} />
            <Route path="/plans/mine" element={<MyPlans />} />
            <Route path="/plans/:id" element={<PlanDetails />} />
            <Route path="/plans/:id/edit" element={<EditPlan />} />
            <Route path="/invitations" element={<Invitations />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
