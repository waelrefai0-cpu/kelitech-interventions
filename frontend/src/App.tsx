import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AppLayout } from "./layouts/AppLayout";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/admin/DashboardPage";
import { ReportsPage } from "./pages/admin/ReportsPage";
import { SettingsPage } from "./pages/admin/SettingsPage";
import { TicketDetailPage } from "./pages/admin/TicketDetailPage";
import { TicketsPage } from "./pages/admin/TicketsPage";
import { UsersPage } from "./pages/admin/UsersPage";
import { WaitingListPage } from "./pages/admin/WaitingListPage";
import { MyTicketsPage } from "./pages/user/MyTicketsPage";
import { NewTicketPage } from "./pages/user/NewTicketPage";
import { ProfilePage } from "./pages/user/ProfilePage";
import { UserTicketDetailPage } from "./pages/user/UserTicketDetailPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={["ADMIN", "TECHNICIAN"]}>
            <AppLayout variant="admin" />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="new-ticket" element={<NewTicketPage />} />
        <Route path="tickets" element={<TicketsPage />} />
        <Route path="tickets/:id" element={<TicketDetailPage />} />
        <Route path="waiting-list" element={<WaitingListPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route
          path="settings"
          element={
            <ProtectedRoute roles={["ADMIN"]}>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="users"
          element={
            <ProtectedRoute roles={["ADMIN"]}>
              <UsersPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route
        path="/user"
        element={
          <ProtectedRoute roles={["USER"]}>
            <AppLayout variant="user" />
          </ProtectedRoute>
        }
      >
        <Route index element={<MyTicketsPage />} />
        <Route path="new-ticket" element={<NewTicketPage />} />
        <Route path="waiting-list" element={<WaitingListPage />} />
        <Route path="tickets/:id" element={<UserTicketDetailPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
