// src/App.jsx - Cấu hình React Router toàn bộ dự án
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";

// Auth pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

// Public pages
import Home from "./pages/public/Home";
import PlayerLeaderboard from "./pages/public/PlayerLeaderboard";
import TeamStandings from "./pages/public/TeamStandings";
import MatchSchedule from "./pages/public/MatchSchedule";
import MatchHistory from "./pages/public/MatchHistory";
import MatchDetail from "./pages/public/MatchDetail";
import TransferHistory from "./pages/public/TransferHistory";
import PlayerProfile from "./pages/public/PlayerProfile";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import RosterForm from "./pages/admin/RosterForm";
import TransferForm from "./pages/admin/TransferForm";
import RosterViewer from "./pages/admin/RosterViewer";
import SeasonForm from "./pages/admin/SeasonForm";
import SeasonTeamForm from "./pages/admin/SeasonTeamForm";
import MatchResultForm from "./pages/admin/MatchResultForm";
import PlayerManagement from "./pages/admin/PlayerManagement";
import RegisterSeasonTeams from "./pages/admin/RegisterSeasonTeams";

// Analyst pages
import AnalystDashboard from "./pages/analyst/AnalystDashboard";
import PlayerFormChart from "./pages/analyst/PlayerFormChart";
import ComparePlayers from "./pages/analyst/ComparePlayers";
import TeamH2H from "./pages/analyst/TeamH2H";
import MetaTrends from "./pages/analyst/MetaTrends";
import SeasonReport from "./pages/analyst/SeasonReport";
import PredictMatch from "./pages/analyst/PredictMatch";

// Layout với Navbar + Sidebar
const AppLayout = ({ children }) => (
  <div className="min-h-screen bg-[#050c18] flex flex-col">
    <Navbar />
    <div className="flex flex-1">
      <Sidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Auth — không có sidebar */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Layout chung cho tất cả các trang khác */}
          <Route
            path="/*"
            element={
              <AppLayout>
                <Routes>
                  {/* ── PUBLIC ── */}
                  <Route index element={<Home />} />
                  <Route
                    path="leaderboard/players"
                    element={<PlayerLeaderboard />}
                  />
                  <Route path="players/:id" element={<PlayerProfile />} />
                  <Route path="standings" element={<TeamStandings />} />
                  <Route path="schedule" element={<MatchSchedule />} />
                  <Route path="matches" element={<MatchHistory />} />
                  <Route path="matches/:matchId" element={<MatchDetail />} />
                  <Route path="transfers" element={<TransferHistory />} />
                  {/* ── ADMIN ONLY ── */}
                  <Route
                    path="admin"
                    element={
                      <ProtectedRoute requiredRole="ADMIN">
                        <AdminDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="admin/season"
                    element={
                      <ProtectedRoute requiredRole="ADMIN">
                        <SeasonForm />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="admin/season-teams"
                    element={
                      <ProtectedRoute requiredRole="ADMIN">
                        <SeasonTeamForm />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="admin/roster"
                    element={
                      <ProtectedRoute requiredRole="ADMIN">
                        <RosterForm />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="admin/transfer"
                    element={
                      <ProtectedRoute requiredRole="ADMIN">
                        <TransferForm />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="admin/roster-view"
                    element={
                      <ProtectedRoute requiredRole="ADMIN">
                        <RosterViewer />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="admin/match"
                    element={
                      <ProtectedRoute requiredRole="ADMIN">
                        <MatchResultForm />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="admin/players"
                    element={
                      <ProtectedRoute requiredRole="ADMIN">
                        <PlayerManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="admin/season-teams"
                    element={<RegisterSeasonTeams />}
                  />
                  {/* ── ANALYST / COACH / ADMIN ── */}
                  <Route
                    path="analyst"
                    element={
                      <ProtectedRoute requiredRole="ANALYST">
                        <AnalystDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="analyst/form"
                    element={
                      <ProtectedRoute requiredRole="ANALYST">
                        <PlayerFormChart />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="analyst/compare"
                    element={
                      <ProtectedRoute requiredRole="ANALYST">
                        <ComparePlayers />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="analyst/h2h"
                    element={
                      <ProtectedRoute requiredRole="ANALYST">
                        <TeamH2H />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="analyst/meta"
                    element={
                      <ProtectedRoute requiredRole="ANALYST">
                        <MetaTrends />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="analyst/report"
                    element={
                      <ProtectedRoute requiredRole="ANALYST">
                        <SeasonReport />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="analyst/predict" element={<PredictMatch />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </AppLayout>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
