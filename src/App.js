// App.js
import React, { useState, useEffect, useMemo } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import { AuthProvider } from "./contexts/AuthContext";
import { DashboardProvider } from "./contexts/DashboardContext";
import { ToastContainer } from "./components/useToast.jsx";
import ProtectedRoute from "./components/ProtectedRoute";
import MainLayout from "./components/MainLayout";
import Login from "./components/auth/Login";
import ForgotPassword from "./components/auth/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import TotalVisitsPage from "./pages/TotalVisits";
import Reports from "./pages/Reports";
import UserManagement from "./pages/UserManagement";
import UserDetailsPage from "./pages/UserDetailsPage";
import AddUserPage from "./pages/AddUserPage";
import ImportLead from "./pages/ImportLeads";
import AddLead from "./pages/AddLead";
import Expense from "./pages/Expense";
import LeadFunnelDashboard from "./pages/LeadFunnel";
import MissedLeads from "./pages/MissedLeads";
import LeadOverview from "./pages/LeadOverview";
import LeadDetailsPage from "./pages/LeadDetailsPage";
import Attandance from "./pages/Attandance";
import AttendanceHistoryPage from "./pages/AttendanceHistoryPage";
import VisitDetails from "./pages/AddVisit";
import TeamTracking from "./pages/TeamTracking";
import MemberVisitHistory from "./pages/Membervisithistory";
import TeamAttendance from "./pages/TeamAttendance";
import Notifications from "./pages/Notifications";
import LeaveManagement from "./pages/LeaveManagement";
import LeaveTypes from "./pages/LeaveTypes";
import HolidayManagement from "./pages/HolidayManagement";
import ThreeDDesign, { SharedThreeDDesignView, ThreeDDesignDashboard, ThreeDDesignPreview } from "./pages/ThreeDDesign";
import Quotation from "./pages/Quotation";
import QuotationEditor from "./pages/QuotationEditor";
import AllQuotes from "./pages/AllQuotes";
import PublicDocumentUpload from "./pages/PublicDocumentUpload";
import Projects from "./pages/Projects";
import ProjectDetails from "./pages/ProjectDetails";
import ProjectImagesPage from "./pages/ProjectImagesPage";
import WorkRegister from "./pages/WorkRegister";
import InventoryERP from "./pages/InventoryERP";
import SettingsPage from "./pages/Settings";
import AppPermissionsPage from "./pages/AppPermissionsPage";
import Salaries from "./pages/Salaries";
import Payroll from "./pages/Payroll";
import Payslips from "./pages/Payslips";
import PayrollPayments from "./pages/PayrollPayments";

const getAppTheme = (mode = "light") =>
  createTheme({
    palette: {
      mode,
      ...(mode === "dark"
        ? {
          primary: { main: "#3b82f6", light: "#60a5fa", dark: "#1d4ed8", contrastText: "#fff" },
          secondary: { main: "#818cf8", light: "#a5b4fc", dark: "#4338ca", contrastText: "#fff" },
          background: { default: "#050811", paper: "#0b0e1a" },
          text: { primary: "#f8fafc", secondary: "#94a3b8", disabled: "#64748b" },
          divider: "rgba(255, 255, 255, 0.08)",
        }
        : {
          primary: { main: "#3566bb", light: "#2172c9", dark: "#0a479b", contrastText: "#fff" },
          secondary: { main: "#1a237e", light: "#534bae", dark: "#000051", contrastText: "#fff" },
          background: { default: "#f8f9fa", paper: "#ffffff" },
          text: { primary: "#1a1a1a", secondary: "#666666", disabled: "#999999" },
          divider: "#e0e0e0",
        }),
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: { fontWeight: 700, fontSize: "2.5rem" },
      h2: { fontWeight: 700, fontSize: "2rem" },
      h3: { fontWeight: 600, fontSize: "1.75rem" },
      h4: { fontWeight: 600, fontSize: "1.5rem" },
      h5: { fontWeight: 600, fontSize: "1.25rem" },
      h6: { fontWeight: 600, fontSize: "1rem" },
      body1: { fontSize: "1rem", lineHeight: 1.5 },
      body2: { fontSize: "0.875rem", lineHeight: 1.43 },
      button: { fontWeight: 600, textTransform: "none" },
    },
    shape: { borderRadius: 12 },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: mode === "dark" ? "#050811" : "#f8f9fa",
            color: mode === "dark" ? "#f8fafc" : "#1a1a1a",
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: "none", borderRadius: 12, fontWeight: 600, boxShadow: "none",
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow: mode === "dark" ? "0 8px 32px rgba(0,0,0,0.5)" : "0 4px 20px rgba(0,0,0,0.08)",
            border: mode === "dark" ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid rgba(0,0,0,0.06)",
            backgroundImage: "none",
            backgroundColor: mode === "dark" ? "#0e1626" : "#ffffff",
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
            backgroundColor: mode === "dark" ? "#0e1626" : "#ffffff",
            border: mode === "dark" ? "1px solid rgba(255, 255, 255, 0.08)" : "none",
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderColor: mode === "dark" ? "rgba(255, 255, 255, 0.08)" : "#f0f0f0",
            color: mode === "dark" ? "#e2e8f0" : "inherit",
          },
          head: {
            fontWeight: 700,
            backgroundColor: mode === "dark" ? "#0a101d" : "#f8fafc",
            color: mode === "dark" ? "#94a3b8" : "#475569",
          },
        },
      },
      MuiDrawer: {
        styleOverrides: { paper: { borderRadius: "0 20px 20px 0", borderRight: "none", boxShadow: "4px 0 20px rgba(0,0,0,0.1)", backgroundColor: mode === "dark" ? "#060b13" : "#ffffff" } },
      },
    },
  });

function App() {
  const [themeMode, setThemeMode] = useState(() => {
    return localStorage.getItem("appThemeMode") || "dark";
  });

  useEffect(() => {
    const handleThemeChange = (e) => {
      setThemeMode(e.detail || localStorage.getItem("appThemeMode") || "dark");
    };
    window.addEventListener("themeModeChange", handleThemeChange);
    return () => window.removeEventListener("themeModeChange", handleThemeChange);
  }, []);

  const activeTheme = useMemo(() => getAppTheme(themeMode), [themeMode]);

  return (
    <ThemeProvider theme={activeTheme}>
      <CssBaseline />
      <AuthProvider>
        <DashboardProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/s" element={<SharedThreeDDesignView />} />
              <Route path="/solar-design/view" element={<SharedThreeDDesignView />} />
              <Route path="/q/:shareToken" element={<Quotation />} />
              <Route path="/documents/upload/:token" element={<PublicDocumentUpload />} />
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route
                path="/quotation/create"
                element={
                  <ProtectedRoute allowedRoles={["Admin_panel", "ZSM", "Incharge", "TEAM"]}>
                    <QuotationEditor initialMode="create" />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/quotation/edit"
                element={
                  <ProtectedRoute allowedRoles={["Admin_panel", "ZSM", "Incharge", "TEAM"]}>
                    <QuotationEditor />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Routes>
                        <Route path="dashboard" element={<ProtectedRoute allowedRoles={["Admin_panel", "ZSM", "Incharge", "TEAM"]}><Dashboard /></ProtectedRoute>} />
                        <Route path="total-visits" element={<ProtectedRoute allowedRoles={["Admin_panel", "ZSM", "Incharge", "TEAM"]}><TotalVisitsPage /></ProtectedRoute>} />
                        <Route path="reports" element={<ProtectedRoute allowedRoles={["Admin_panel", "ZSM", "Incharge", "TEAM"]}><Reports /></ProtectedRoute>} />
                        <Route path="work-register" element={<ProtectedRoute allowedRoles={["ADMIN", "PROJECT_HEAD", "MANAGER", "SUPERVISOR", "Admin_panel", "ZSM", "Incharge"]}><WorkRegister /></ProtectedRoute>} />
                        <Route path="user-management" element={<ProtectedRoute allowedRoles={["Admin_panel", "ZSM", "Incharge", "TEAM", "ADMIN", "PROJECT_HEAD", "MANAGER", "SUPERVISOR"]}><UserManagement /></ProtectedRoute>} />
                        <Route path="user-details/:userId" element={<ProtectedRoute allowedRoles={["Admin_panel", "ZSM", "Incharge", "TEAM", "ADMIN", "PROJECT_HEAD", "MANAGER", "SUPERVISOR"]}><UserDetailsPage /></ProtectedRoute>} />
                        <Route path="user-details" element={<ProtectedRoute allowedRoles={["Admin_panel", "ZSM", "Incharge", "TEAM", "ADMIN", "PROJECT_HEAD", "MANAGER", "SUPERVISOR"]}><UserDetailsPage /></ProtectedRoute>} />
                        <Route path="add-user" element={<ProtectedRoute allowedRoles={["Admin_panel", "ZSM", "Incharge"]}><AddUserPage /></ProtectedRoute>} />
                        <Route path="import-leads" element={<ProtectedRoute allowedRoles={["Admin_panel", "ZSM", "Incharge", "TEAM"]}><ImportLead /></ProtectedRoute>} />
                        <Route path="add-lead" element={<ProtectedRoute allowedRoles={["Admin_panel", "ZSM", "Incharge", "TEAM"]}><AddLead /></ProtectedRoute>} />
                        <Route path="expense" element={<ProtectedRoute allowedRoles={["Admin_panel", "ZSM", "Incharge", "TEAM"]}><Expense /></ProtectedRoute>} />
                        <Route path="lead-funnel" element={<ProtectedRoute allowedRoles={["Admin_panel", "ZSM", "Incharge", "TEAM"]}><LeadFunnelDashboard /></ProtectedRoute>} />
                        <Route path="missed-leads" element={<ProtectedRoute allowedRoles={["Admin_panel", "ZSM", "Incharge", "TEAM"]}><MissedLeads /></ProtectedRoute>} />
                        <Route path="3d-design" element={<ProtectedRoute allowedRoles={["Admin_panel", "ZSM", "Incharge", "TEAM"]}><ThreeDDesignDashboard /></ProtectedRoute>} />
                        <Route path="3d-design/new" element={<ProtectedRoute allowedRoles={["Admin_panel", "ZSM", "Incharge", "TEAM"]}><ThreeDDesign /></ProtectedRoute>} />
                        <Route path="3d-design/preview" element={<ProtectedRoute allowedRoles={["Admin_panel", "ZSM", "Incharge", "TEAM"]}><ThreeDDesignPreview /></ProtectedRoute>} />
                        <Route path="quotation" element={<ProtectedRoute allowedRoles={["Admin_panel", "ZSM", "Incharge", "TEAM"]}><Quotation /></ProtectedRoute>} />
                        <Route path="all-quotes" element={<ProtectedRoute allowedRoles={["Admin_panel", "ZSM", "Incharge", "TEAM"]}><AllQuotes /></ProtectedRoute>} />
                        <Route path="add-visit" element={<ProtectedRoute allowedRoles={["Admin_panel", "ZSM", "Incharge", "TEAM"]}><VisitDetails /></ProtectedRoute>} />
                        <Route
                          path="attendance"
                          element={
                            <ProtectedRoute allowedRoles={["Admin_panel", "ZSM", "Incharge", "TEAM"]}>
                              <Attandance />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="attendance/:userId"
                          element={
                            <ProtectedRoute allowedRoles={["Admin_panel", "ZSM", "Incharge"]}>
                              <Attandance />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="attendance-history/:userId"
                          element={
                            <ProtectedRoute allowedRoles={["Admin_panel", "ZSM", "Incharge", "TEAM"]}>
                              <AttendanceHistoryPage />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="team-attendance"
                          element={
                            <ProtectedRoute allowedRoles={["Admin_panel", "ZSM", "Incharge"]}>
                              <TeamAttendance />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="leave-management"
                          element={
                            <ProtectedRoute allowedRoles={["Admin_panel", "ZSM", "Incharge", "TEAM"]}>
                              <LeaveManagement />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="leave-types"
                          element={
                            <ProtectedRoute allowedRoles={["Admin_panel", "ZSM", "Incharge", "TEAM"]}>
                              <LeaveTypes />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="holiday-management"
                          element={
                            <ProtectedRoute allowedRoles={["Admin_panel", "ZSM", "Incharge", "TEAM"]}>
                              <HolidayManagement />
                            </ProtectedRoute>
                          }
                        />
                        <Route path="team-tracking" element={<ProtectedRoute allowedRoles={["Admin_panel", "ZSM", "Incharge", "TEAM"]}><TeamTracking /></ProtectedRoute>} />
                        <Route path="member-history/:userId" element={<ProtectedRoute allowedRoles={["Admin_panel", "ZSM", "Incharge", "TEAM"]}><MemberVisitHistory /></ProtectedRoute>} />
                        <Route path="notifications" element={<ProtectedRoute allowedRoles={["Admin_panel", "ZSM", "Incharge", "TEAM"]}><Notifications /></ProtectedRoute>} />
                        <Route path="all-leads/:leadId" element={<ProtectedRoute allowedRoles={["Admin_panel", "ZSM", "Incharge", "TEAM"]}><LeadDetailsPage /></ProtectedRoute>} />
                        <Route path="all-leads" element={<ProtectedRoute allowedRoles={["Admin_panel", "ZSM", "Incharge", "TEAM"]}><LeadOverview /></ProtectedRoute>} />
                        <Route path="projects/:projectId/images" element={<ProtectedRoute allowedRoles={["Admin_panel", "ZSM", "Incharge", "TEAM", "ADMIN", "PROJECT_HEAD", "MANAGER", "SUPERVISOR", "INSTALLER"]}><ProjectImagesPage /></ProtectedRoute>} />
                        <Route path="projects/:projectId" element={<ProtectedRoute allowedRoles={["Admin_panel", "ZSM", "Incharge", "TEAM"]}><ProjectDetails /></ProtectedRoute>} />
                        <Route path="projects" element={<ProtectedRoute allowedRoles={["Admin_panel", "ZSM", "Incharge", "TEAM"]}><Projects /></ProtectedRoute>} />
                        <Route path="inventory" element={<ProtectedRoute allowedRoles={["Admin_panel", "ZSM", "Incharge", "TEAM", "ADMIN", "PROJECT_HEAD", "MANAGER", "SUPERVISOR", "INSTALLER"]}><InventoryERP /></ProtectedRoute>} />
                        <Route path="inventory/:section" element={<ProtectedRoute allowedRoles={["Admin_panel", "ZSM", "Incharge", "TEAM", "ADMIN", "PROJECT_HEAD", "MANAGER", "SUPERVISOR", "INSTALLER"]}><InventoryERP /></ProtectedRoute>} />
                        <Route path="payroll" element={<ProtectedRoute allowedRoles={["Admin_panel", "ZSM", "Incharge", "TEAM", "ADMIN", "PROJECT_HEAD", "MANAGER", "SUPERVISOR", "INSTALLER"]}><Payroll /></ProtectedRoute>} />
                        <Route path="payroll/salaries" element={<ProtectedRoute allowedRoles={["Admin_panel", "ZSM", "Incharge", "TEAM", "ADMIN", "PROJECT_HEAD", "MANAGER", "SUPERVISOR", "INSTALLER"]}><Salaries /></ProtectedRoute>} />
                        <Route path="payroll/salary-structure" element={<ProtectedRoute allowedRoles={["Admin_panel", "ZSM", "Incharge", "TEAM", "ADMIN", "PROJECT_HEAD", "MANAGER", "SUPERVISOR", "INSTALLER"]}><Salaries /></ProtectedRoute>} />
                        <Route path="payroll/payslips" element={<ProtectedRoute allowedRoles={["Admin_panel", "ZSM", "Incharge", "TEAM", "ADMIN", "PROJECT_HEAD", "MANAGER", "SUPERVISOR", "INSTALLER"]}><Payslips /></ProtectedRoute>} />
                        <Route path="payroll/salary-slips" element={<ProtectedRoute allowedRoles={["Admin_panel", "ZSM", "Incharge", "TEAM", "ADMIN", "PROJECT_HEAD", "MANAGER", "SUPERVISOR", "INSTALLER"]}><Payslips /></ProtectedRoute>} />
                        <Route path="payroll/payments" element={<ProtectedRoute allowedRoles={["Admin_panel", "ZSM", "Incharge", "TEAM", "ADMIN", "PROJECT_HEAD", "MANAGER", "SUPERVISOR", "INSTALLER"]}><PayrollPayments /></ProtectedRoute>} />
                        <Route path="settings" element={<ProtectedRoute allowedRoles={["Admin_panel", "ZSM", "Incharge", "TEAM", "ADMIN", "PROJECT_HEAD", "MANAGER", "SUPERVISOR", "INSTALLER"]}><SettingsPage /></ProtectedRoute>} />
                        <Route path="apk-permissions" element={<ProtectedRoute allowedRoles={["Admin_panel", "ZSM", "Incharge", "TEAM", "ADMIN", "PROJECT_HEAD", "MANAGER", "SUPERVISOR", "INSTALLER"]}><AppPermissionsPage /></ProtectedRoute>} />
                        <Route path="app-permissions" element={<ProtectedRoute allowedRoles={["Admin_panel", "ZSM", "Incharge", "TEAM", "ADMIN", "PROJECT_HEAD", "MANAGER", "SUPERVISOR", "INSTALLER"]}><AppPermissionsPage /></ProtectedRoute>} />
                        <Route path="*" element={<Navigate to="/dashboard" replace />} />
                      </Routes>
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Router>
          <ToastContainer />
        </DashboardProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
