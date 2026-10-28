// pages/AppPermissionsPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Typography,
  Button,
  IconButton,
  Switch,
  Grid,
  Paper,
  Chip,
  Avatar,
  Divider,
  CircularProgress,
  TextField,
  InputAdornment,
  Tooltip,
  Alert,
  Stack,
  useTheme,
  alpha,
  Breadcrumbs,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Autocomplete,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Search as SearchIcon,
  Save as SaveIcon,
  RestartAlt as ResetIcon,
  PhoneAndroid as PhoneIcon,
  SupervisorAccount as SupervisorIcon,
  AdminPanelSettings as AdminIcon,
  Group as GroupIcon,
  Person as PersonIcon,
  People as PeopleIcon,
  CheckCircle as CheckCircleIcon,
  Clear as ClearIcon,
  Layers as LayersIcon,
  Widgets as WidgetsIcon,
  ViewAgenda as ViewAgendaIcon,
  Check as CheckIcon,
  AltRoute as RouteIcon,
  Navigation as NavigationIcon,
  Description as QuotationIcon,
  LocationOn as VisitIcon,
  PersonAdd as RegistrationIcon,
  AssignmentTurnedIn as DocumentIcon,
  AccountBalance as BankLoanIcon,
  HourglassEmpty as LoanPendingIcon,
  AttachMoney as DisbursementIcon,
  Build as InstallationIcon,
  ErrorOutline as MissedIcon,
  EventBusy as LeaveIcon,
  ReceiptLong as ExpenseIcon,
  SolarPower as ProjectIcon,
  Fingerprint as AttendanceIcon,
  NotificationsActive as NotificationIcon,
  Dashboard as DashboardIcon,
  NavigateNext as NavigateNextIcon,
  VerifiedUser as VerifiedIcon,
  Tune as TuneIcon,
  TableChart as TableChartIcon,
  ViewModule as ViewModuleIcon,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { API_BASE_URL } from "../utils/apiConfig";
import { toast } from "../components/useToast.jsx";

const PRIMARY_COLOR = "#0f1f3d";

// ─── 29 Complete APK Features Catalog ────────────────────────────────────────
export const ALL_APK_FEATURES = [
  // ── Field & GPS ──
  {
    id: "kmHistory",
    type: "menu",
    typeLabel: "Drawer Menu",
    category: "field",
    categoryLabel: "Field Operations",
    categoryColor: "#10b981",
    name: "Trip Management / KM History",
    desc: "GPS travel distance tracking, live logs & meter reading",
    icon: <RouteIcon />,
  },
  {
    id: "mapNavigation",
    type: "menu",
    typeLabel: "Drawer Menu",
    category: "field",
    categoryLabel: "Field Operations",
    categoryColor: "#10b981",
    name: "Map & GPS Route Navigation",
    desc: "Turn-by-turn map directions directly to client solar site",
    icon: <NavigationIcon />,
  },
  {
    id: "totalVisits",
    type: "menu",
    typeLabel: "Drawer Menu",
    category: "field",
    categoryLabel: "Field Operations",
    categoryColor: "#10b981",
    name: "Location Field Visits",
    desc: "Site visit check-in, remarks, photo upload and GPS tag",
    icon: <VisitIcon />,
  },
  {
    id: "installation",
    type: "menu",
    typeLabel: "Drawer Menu",
    category: "field",
    categoryLabel: "Field Operations",
    categoryColor: "#10b981",
    name: "Installation Execution",
    desc: "Site structure mounting, inverter setup & plant commissioning",
    icon: <InstallationIcon />,
  },

  // ── Sales & Leads ──
  {
    id: "allLeads",
    type: "menu",
    typeLabel: "Drawer Menu",
    category: "sales",
    categoryLabel: "Sales & Leads",
    categoryColor: "#6366f1",
    name: "All Customer Leads",
    desc: "Lead pipeline, contact details, stages and follow-up notes",
    icon: <PeopleIcon />,
  },
  {
    id: "quotations",
    type: "menu",
    typeLabel: "Drawer Menu",
    category: "sales",
    categoryLabel: "Sales & Leads",
    categoryColor: "#6366f1",
    name: "Solar Quotations",
    desc: "Inspect, share via WhatsApp and download solar PDF quotes",
    icon: <QuotationIcon />,
  },
  {
    id: "registration",
    type: "menu",
    typeLabel: "Drawer Menu",
    category: "sales",
    categoryLabel: "Sales & Leads",
    categoryColor: "#6366f1",
    name: "Customer Registration",
    desc: "Onboard new customer, roof photos & electricity bill upload",
    icon: <RegistrationIcon />,
  },
  {
    id: "missedLeads",
    type: "menu",
    typeLabel: "Drawer Menu",
    category: "sales",
    categoryLabel: "Sales & Leads",
    categoryColor: "#6366f1",
    name: "Missed / Urgent Leads",
    desc: "Uncontacted inquiries requiring immediate priority call follow-up",
    icon: <MissedIcon />,
  },

  // ── Finance & Loans ──
  {
    id: "document",
    type: "menu",
    typeLabel: "Drawer Menu",
    category: "finance",
    categoryLabel: "Finance & Loans",
    categoryColor: "#f59e0b",
    name: "Document Verification",
    desc: "Upload customer Aadhaar, PAN card and electricity bills",
    icon: <DocumentIcon />,
  },
  {
    id: "bankLoan",
    type: "menu",
    typeLabel: "Drawer Menu",
    category: "finance",
    categoryLabel: "Finance & Loans",
    categoryColor: "#f59e0b",
    name: "Bank Loan Apply",
    desc: "Submit solar loan financing applications to partnered banks",
    icon: <BankLoanIcon />,
  },
  {
    id: "loanPending",
    type: "menu",
    typeLabel: "Drawer Menu",
    category: "finance",
    categoryLabel: "Finance & Loans",
    categoryColor: "#f59e0b",
    name: "Bank Loan Pending Track",
    desc: "Track loan sanction status, credit approval and file progress",
    icon: <LoanPendingIcon />,
  },
  {
    id: "disbursement",
    type: "menu",
    typeLabel: "Drawer Menu",
    category: "finance",
    categoryLabel: "Finance & Loans",
    categoryColor: "#f59e0b",
    name: "Disbursement & Subsidy",
    desc: "Track government subsidy release and milestone disbursements",
    icon: <DisbursementIcon />,
  },

  // ── HR & Workflow ──
  {
    id: "attendance",
    type: "menu",
    typeLabel: "Drawer Menu",
    category: "hr",
    categoryLabel: "HR & Attendance",
    categoryColor: "#ec4899",
    name: "Attendance Punch-in",
    desc: "Daily selfie + GPS geo-fenced punch-in and punch-out logging",
    icon: <AttendanceIcon />,
  },
  {
    id: "leaveManagement",
    type: "menu",
    typeLabel: "Drawer Menu",
    category: "hr",
    categoryLabel: "HR & Attendance",
    categoryColor: "#ec4899",
    name: "Leave Requests",
    desc: "Apply for leaves, view balances & supervisor approval status",
    icon: <LeaveIcon />,
  },
  {
    id: "expense",
    type: "menu",
    typeLabel: "Drawer Menu",
    category: "hr",
    categoryLabel: "HR & Attendance",
    categoryColor: "#ec4899",
    name: "Expense Claims",
    desc: "Daily travel, fuel allowance and meal reimbursement claims",
    icon: <ExpenseIcon />,
  },
  {
    id: "projects",
    type: "menu",
    typeLabel: "Drawer Menu",
    category: "hr",
    categoryLabel: "HR & Attendance",
    categoryColor: "#ec4899",
    name: "Assigned Projects",
    desc: "Assigned customer worksheet cards and active solar job sites",
    icon: <ProjectIcon />,
  },

  // ── Core & Analytics ──
  {
    id: "home",
    type: "menu",
    typeLabel: "Drawer Menu",
    category: "core",
    categoryLabel: "Core & Analytics",
    categoryColor: "#06b6d4",
    name: "Home Dashboard & KPIs",
    desc: "KPI metrics, target progress bar, daily visit tally & announcements",
    icon: <DashboardIcon />,
  },
  {
    id: "notifications",
    type: "menu",
    typeLabel: "Drawer Menu",
    category: "core",
    categoryLabel: "Core & Analytics",
    categoryColor: "#06b6d4",
    name: "Push Notifications",
    desc: "Real-time alerts, lead reminders & head office broadcasts",
    icon: <NotificationIcon />,
  },

  // ── Quick Actions (Floating Action Button) ──
  {
    id: "newVisit",
    type: "quickAction",
    typeLabel: "Quick FAB",
    category: "quickAction",
    categoryLabel: "Floating Shortcuts",
    categoryColor: "#10b981",
    name: "Quick New Visit",
    desc: "Floating button: Start immediate customer site check-in",
    icon: <VisitIcon />,
  },
  {
    id: "mapNavigation",
    type: "quickAction",
    typeLabel: "Quick FAB",
    category: "quickAction",
    categoryLabel: "Floating Shortcuts",
    categoryColor: "#06b6d4",
    name: "Quick Map Navigation",
    desc: "Floating button: Launch GPS route directly to customer",
    icon: <NavigationIcon />,
  },
  {
    id: "registration",
    type: "quickAction",
    typeLabel: "Quick FAB",
    category: "quickAction",
    categoryLabel: "Floating Shortcuts",
    categoryColor: "#6366f1",
    name: "Quick New Registration",
    desc: "Floating button: Fast customer onboarding form",
    icon: <RegistrationIcon />,
  },
  {
    id: "bankLoan",
    type: "quickAction",
    typeLabel: "Quick FAB",
    category: "quickAction",
    categoryLabel: "Floating Shortcuts",
    categoryColor: "#f59e0b",
    name: "Quick Bank Loan Apply",
    desc: "Floating button: Fast bank financing inquiry",
    icon: <BankLoanIcon />,
  },
  {
    id: "document",
    type: "quickAction",
    typeLabel: "Quick FAB",
    category: "quickAction",
    categoryLabel: "Floating Shortcuts",
    categoryColor: "#ec4899",
    name: "Quick Document Upload",
    desc: "Floating button: Direct camera KYC upload",
    icon: <DocumentIcon />,
  },

  // ── Persistent Bottom Navigation Tabs ──
  {
    id: "home",
    type: "bottomTab",
    typeLabel: "Bottom Tab",
    category: "bottomTab",
    categoryLabel: "Bottom Navigation Bar",
    categoryColor: "#3b82f6",
    name: "Bottom Tab: Home Dashboard",
    desc: "Fixed footer: Primary KPI overview and daily agenda feed",
    icon: <DashboardIcon />,
    slot: "Slot 1",
  },
  {
    id: "allLeads",
    type: "bottomTab",
    typeLabel: "Bottom Tab",
    category: "bottomTab",
    categoryLabel: "Bottom Navigation Bar",
    categoryColor: "#6366f1",
    name: "Bottom Tab: All Leads",
    desc: "Fixed footer: Customer inquiries pipeline and follow-ups",
    icon: <PeopleIcon />,
    slot: "Slot 2",
  },
  {
    id: "attendance",
    type: "bottomTab",
    typeLabel: "Bottom Tab",
    category: "bottomTab",
    categoryLabel: "Bottom Navigation Bar",
    categoryColor: "#10b981",
    name: "Bottom Tab: Attendance",
    desc: "Fixed footer: Daily selfie + GPS punch-in & punch-out",
    icon: <AttendanceIcon />,
    slot: "Slot 3",
  },
  {
    id: "projects",
    type: "bottomTab",
    typeLabel: "Bottom Tab",
    category: "bottomTab",
    categoryLabel: "Bottom Navigation Bar",
    categoryColor: "#f59e0b",
    name: "Bottom Tab: Projects",
    desc: "Fixed footer: Assigned solar installation project sites",
    icon: <ProjectIcon />,
    slot: "Slot 4",
  },
  {
    id: "profile",
    type: "bottomTab",
    typeLabel: "Bottom Tab",
    category: "bottomTab",
    categoryLabel: "Bottom Navigation Bar",
    categoryColor: "#8b5cf6",
    name: "Bottom Tab: User Profile",
    desc: "Fixed footer: Employee ID card, settings and logout",
    icon: <PersonIcon />,
    slot: "Slot 5",
  },
  {
    id: "kmHistory",
    type: "bottomTab",
    typeLabel: "Bottom Tab",
    category: "bottomTab",
    categoryLabel: "Bottom Navigation Bar",
    categoryColor: "#ec4899",
    name: "Bottom Tab: KM History",
    desc: "Fixed footer: Daily odometer tracking & route logs",
    icon: <RouteIcon />,
    slot: "Slot 6",
  },
];

export const ROLE_DEFINITIONS = [
  {
    key: "Incharge",
    label: "Incharge / Field Team",
    shortLabel: "Incharge",
    badgeLabel: "Field Exec",
    color: "#10b981",
    icon: <GroupIcon sx={{ fontSize: 18 }} />,
    desc: "Field engineers & technicians focused on visits, installations and meter logs",
  },
  {
    key: "Supervisor",
    label: "Supervisor",
    shortLabel: "Supervisor",
    badgeLabel: "Site Lead",
    color: "#f59e0b",
    icon: <SupervisorIcon sx={{ fontSize: 18 }} />,
    desc: "Supervises field teams, verifies installations, reviews documents and project work",
  },
  {
    key: "ZSM",
    label: "Manager (ZSM)",
    shortLabel: "Manager",
    badgeLabel: "Area Lead",
    color: "#3b82f6",
    icon: <PersonIcon sx={{ fontSize: 18 }} />,
    desc: "Operational leaders & managers with elevated mobile oversight and tracking",
  },
  {
    key: "Admin_panel",
    label: "Admin Panel / Head Office",
    shortLabel: "Admin",
    badgeLabel: "Master Admin",
    color: "#8b5cf6",
    icon: <AdminIcon sx={{ fontSize: 18 }} />,
    desc: "Master system administrators with complete unrestricted access to all features",
  },
];

const getToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("authToken") ||
  localStorage.getItem("accessToken") ||
  "";

export default function AppPermissionsPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const navigate = useNavigate();
  const location = useLocation();

  const preselectedUser = location.state?.selectedUser || null;

  // Active Target: 'Incharge' | 'Supervisor' | 'ZSM' | 'Admin_panel' | 'employee' | 'matrix'
  const [activeTarget, setActiveTarget] = useState(preselectedUser ? "employee" : "Incharge");

  // Selected Employee ID & state
  const [selectedUserId, setSelectedUserId] = useState(preselectedUser?._id || "");
  const [userCustomEnabled, setUserCustomEnabled] = useState(false);
  const [userCustomData, setUserCustomData] = useState(null);

  // Users list
  const [allUsers, setAllUsers] = useState([]);

  // Role permissions dictionary: { Incharge: { menus: {}, quickActions: {}, bottomTabs: {} }, ... }
  const [rolePermissions, setRolePermissions] = useState({
    Incharge: { menus: {}, quickActions: {}, bottomTabs: {} },
    Supervisor: { menus: {}, quickActions: {}, bottomTabs: {} },
    ZSM: { menus: {}, quickActions: {}, bottomTabs: {} },
    Admin_panel: { menus: {}, quickActions: {}, bottomTabs: {} },
  });

  // Employee specific permissions: { menus: {}, quickActions: {}, bottomTabs: {} }
  const [employeePermissions, setEmployeePermissions] = useState({
    menus: {},
    quickActions: {},
    bottomTabs: {},
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSection, setSelectedSection] = useState("all"); // 'all' | 'menus' | 'quickActions' | 'bottomTabs'
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Fetch all users for clean autocomplete picker
  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/user/getAllUsers?page=1&limit=300`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (data.success && data.result?.users) {
        setAllUsers(data.result.users);
      }
    } catch (err) {
      console.warn("Could not load users list:", err);
    }
  }, []);

  // Fetch all role permissions from server
  const fetchRolePermissions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/app-permissions`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (data.success && data.result) {
        setRolePermissions(data.result);
      }
    } catch (err) {
      console.error("fetchRolePermissions error:", err);
      toast.error("Failed to load APK role permissions");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch specific employee custom permissions
  const fetchUserPermissions = useCallback(async (userId) => {
    if (!userId) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/app-permissions/user/${userId}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (data.success) {
        setUserCustomData(data);
        setUserCustomEnabled(Boolean(data.hasCustom));
        setEmployeePermissions({
          menus: data.permissions?.menus || {},
          quickActions: data.permissions?.quickActions || {},
          bottomTabs: data.permissions?.bottomTabs || {},
        });
      }
    } catch (err) {
      console.error("fetchUserPermissions error:", err);
      toast.error("Failed to load employee permissions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchRolePermissions();
    if (preselectedUser?._id) {
      setActiveTarget("employee");
      setSelectedUserId(preselectedUser._id);
      fetchUserPermissions(preselectedUser._id);
    }
  }, [fetchUsers, fetchRolePermissions, fetchUserPermissions, preselectedUser]);

  // Current selected user object
  const currentSelectedUser = useMemo(() => {
    return allUsers.find((u) => u._id === selectedUserId) || userCustomData?.user || preselectedUser || null;
  }, [allUsers, selectedUserId, userCustomData, preselectedUser]);

  // Check if feature is allowed for a given role
  const isFeatureAllowedForRole = (roleKey, feature) => {
    const rData = rolePermissions[roleKey];
    if (!rData) return false;
    if (feature.type === "menu") return Boolean(rData.menus?.[feature.id]);
    if (feature.type === "quickAction") return Boolean(rData.quickActions?.[feature.id]);
    if (feature.type === "bottomTab") return Boolean(rData.bottomTabs?.[feature.id]);
    return false;
  };

  // Toggle feature for a role
  const handleToggleRoleFeature = (roleKey, feature) => {
    setHasUnsavedChanges(true);
    setRolePermissions((prev) => {
      const prevRole = prev[roleKey] || { menus: {}, quickActions: {}, bottomTabs: {} };
      const groupKey = feature.type === "menu" ? "menus" : feature.type === "quickAction" ? "quickActions" : "bottomTabs";
      const currentVal = Boolean(prevRole[groupKey]?.[feature.id]);

      return {
        ...prev,
        [roleKey]: {
          ...prevRole,
          [groupKey]: {
            ...(prevRole[groupKey] || {}),
            [feature.id]: !currentVal,
          },
        },
      };
    });
  };

  // Check if feature is allowed for currently selected employee
  const isFeatureAllowedForEmployee = (feature) => {
    if (!userCustomEnabled && currentSelectedUser?.role) {
      const normRole = currentSelectedUser.role === "SUPERVISOR" ? "Supervisor" : currentSelectedUser.role === "ZSM" || currentSelectedUser.role === "MANAGER" ? "ZSM" : "Incharge";
      return isFeatureAllowedForRole(normRole, feature);
    }
    const groupKey = feature.type === "menu" ? "menus" : feature.type === "quickAction" ? "quickActions" : "bottomTabs";
    return Boolean(employeePermissions[groupKey]?.[feature.id]);
  };

  // Toggle feature for currently selected employee
  const handleToggleEmployeeFeature = (feature) => {
    setHasUnsavedChanges(true);
    if (!userCustomEnabled) setUserCustomEnabled(true);
    const groupKey = feature.type === "menu" ? "menus" : feature.type === "quickAction" ? "quickActions" : "bottomTabs";
    setEmployeePermissions((prev) => ({
      ...prev,
      [groupKey]: {
        ...(prev[groupKey] || {}),
        [feature.id]: !prev[groupKey]?.[feature.id],
      },
    }));
  };

  // Active target feature status checker
  const isFeatureAllowed = (feature) => {
    if (activeTarget === "employee") {
      return isFeatureAllowedForEmployee(feature);
    }
    return isFeatureAllowedForRole(activeTarget, feature);
  };

  // Toggle feature for whatever target is currently selected
  const handleToggleFeature = (feature) => {
    if (activeTarget === "employee") {
      handleToggleEmployeeFeature(feature);
    } else if (activeTarget !== "matrix") {
      handleToggleRoleFeature(activeTarget, feature);
    }
  };

  // Bulk enable / disable for the currently active view
  const handleBulkToggle = (enable = true, type = null) => {
    setHasUnsavedChanges(true);
    const targetFeatures = ALL_APK_FEATURES.filter((f) => !type || f.type === type);

    if (activeTarget === "employee") {
      if (!userCustomEnabled) setUserCustomEnabled(true);
      setEmployeePermissions((prev) => {
        const newMenus = { ...(prev.menus || {}) };
        const newQuick = { ...(prev.quickActions || {}) };
        const newTabs = { ...(prev.bottomTabs || {}) };

        targetFeatures.forEach((f) => {
          if (f.type === "menu") newMenus[f.id] = enable;
          if (f.type === "quickAction") newQuick[f.id] = enable;
          if (f.type === "bottomTab") newTabs[f.id] = enable;
        });

        return { menus: newMenus, quickActions: newQuick, bottomTabs: newTabs };
      });
    } else if (activeTarget !== "matrix") {
      setRolePermissions((prev) => {
        const prevRole = prev[activeTarget] || { menus: {}, quickActions: {}, bottomTabs: {} };
        const newMenus = { ...(prevRole.menus || {}) };
        const newQuick = { ...(prevRole.quickActions || {}) };
        const newTabs = { ...(prevRole.bottomTabs || {}) };

        targetFeatures.forEach((f) => {
          if (f.type === "menu") newMenus[f.id] = enable;
          if (f.type === "quickAction") newQuick[f.id] = enable;
          if (f.type === "bottomTab") newTabs[f.id] = enable;
        });

        return {
          ...prev,
          [activeTarget]: {
            ...prevRole,
            menus: newMenus,
            quickActions: newQuick,
            bottomTabs: newTabs,
          },
        };
      });
    }
  };

  // Save changes
  const handleSave = async () => {
    try {
      setSaving(true);
      if (activeTarget === "employee") {
        if (!selectedUserId) {
          toast.error("Please select an employee first");
          return;
        }
        const res = await fetch(`${API_BASE_URL}/app-permissions/user/${selectedUserId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({
            enabled: userCustomEnabled,
            menus: employeePermissions.menus,
            quickActions: employeePermissions.quickActions,
            bottomTabs: employeePermissions.bottomTabs,
          }),
        });
        const data = await res.json();
        if (data.success) {
          toast.success("Employee APK access permissions updated successfully!");
          await fetchUserPermissions(selectedUserId);
        } else {
          toast.error(data.message || "Failed to update employee permissions");
        }
      } else {
        // Save role permissions (single role or all roles)
        const payload = activeTarget === "matrix"
          ? { allRoles: rolePermissions }
          : {
              role: activeTarget,
              menus: rolePermissions[activeTarget]?.menus || {},
              quickActions: rolePermissions[activeTarget]?.quickActions || {},
              bottomTabs: rolePermissions[activeTarget]?.bottomTabs || {},
            };

        const res = await fetch(`${API_BASE_URL}/app-permissions`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success) {
          setHasUnsavedChanges(false);
          toast.success("Saved! Mobile APKs will update within seconds.");
          await fetchRolePermissions();
        } else {
          toast.error(data.message || "Failed to save permissions");
        }
      }
    } catch (err) {
      console.error("Save error:", err);
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  // Reset to factory defaults
  const handleResetDefaults = async () => {
    try {
      setSaving(true);
      if (activeTarget === "employee") {
        if (!selectedUserId) return;
        const res = await fetch(`${API_BASE_URL}/app-permissions/user/${selectedUserId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({ resetToDefault: true }),
        });
        const data = await res.json();
        if (data.success) {
          toast.success("Reverted employee to role default permissions");
          await fetchUserPermissions(selectedUserId);
        }
      } else {
        const rolesToReset = activeTarget === "matrix"
          ? ["Incharge", "Supervisor", "ZSM", "Admin_panel"]
          : [activeTarget];

        for (const r of rolesToReset) {
          await fetch(`${API_BASE_URL}/app-permissions/reset`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${getToken()}`,
            },
            body: JSON.stringify({ role: r }),
          });
        }
        toast.success(`Reset ${activeTarget === "matrix" ? "all roles" : activeTarget} to factory defaults`);
        await fetchRolePermissions();
      }
    } catch (err) {
      toast.error(err.message || "Reset failed");
    } finally {
      setSaving(false);
    }
  };

  // Filtered features list
  const filteredFeatures = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return ALL_APK_FEATURES.filter((f) => {
      const matchSection =
        selectedSection === "all" ||
        (selectedSection === "menus" && f.type === "menu") ||
        (selectedSection === "quickActions" && f.type === "quickAction") ||
        (selectedSection === "bottomTabs" && f.type === "bottomTab");

      const matchSearch =
        !q ||
        f.name.toLowerCase().includes(q) ||
        f.desc.toLowerCase().includes(q) ||
        f.id.toLowerCase().includes(q) ||
        f.categoryLabel.toLowerCase().includes(q);

      return matchSection && matchSearch;
    });
  }, [searchTerm, selectedSection]);

  // Counts
  const currentAllowedCount = useMemo(() => {
    return ALL_APK_FEATURES.filter((f) => isFeatureAllowed(f)).length;
  }, [activeTarget, rolePermissions, employeePermissions, userCustomEnabled, currentSelectedUser]);

  const activeRoleMeta = ROLE_DEFINITIONS.find((r) => r.key === activeTarget) || ROLE_DEFINITIONS[0];

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 3, md: 3.5 },
        bgcolor: isDark ? "#080c16" : "#f8fafc",
        minHeight: "100vh",
        maxWidth: 1600,
        mx: "auto",
        pb: 12,
      }}
    >
      {/* ── BREADCRUMBS ── */}
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" sx={{ color: "text.secondary" }} />} sx={{ mb: 2 }}>
        <Link
          underline="hover"
          color="inherit"
          sx={{ cursor: "pointer", display: "flex", alignItems: "center", fontSize: "0.84rem", fontWeight: 600 }}
          onClick={() => navigate("/user-management")}
        >
          User Management
        </Link>
        <Typography color="text.primary" sx={{ fontSize: "0.84rem", fontWeight: 700 }}>
          Mobile APK Permissions
        </Typography>
      </Breadcrumbs>

      {/* ── TOP HEADER BAR ── */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.2, sm: 2.8 },
          mb: 3,
          borderRadius: "16px",
          bgcolor: isDark ? "#0e1322" : "#ffffff",
          border: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid #e2e8f0",
          boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.3)" : "0 4px 20px rgba(15,23,42,0.03)",
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
        >
          <Box>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: "12px",
                  bgcolor: isDark ? "rgba(16, 185, 129, 0.15)" : "#ecfdf5",
                  color: "#10b981",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <PhoneIcon sx={{ fontSize: 24 }} />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: "-0.01em", color: isDark ? "#f8fafc" : "#0f172a" }}>
                  Mobile APK Permissions
                </Typography>
                <Typography variant="body2" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.85rem", mt: 0.2 }}>
                  Control which features and tabs each role or employee can access in the mobile app
                </Typography>
              </Box>
            </Stack>
          </Box>

          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexWrap: "wrap" }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon sx={{ fontSize: 16 }} />}
              onClick={() => navigate(-1)}
              sx={{
                color: isDark ? "#94a3b8" : "#64748b",
                borderColor: isDark ? "rgba(255, 255, 255, 0.15)" : "#cbd5e1",
                borderRadius: "10px",
                height: 38,
                px: 2,
                textTransform: "none",
                fontWeight: 700,
                fontSize: "0.82rem",
              }}
            >
              Back
            </Button>

            <Button
              variant="outlined"
              startIcon={<ResetIcon sx={{ fontSize: 16 }} />}
              onClick={handleResetDefaults}
              disabled={saving || loading}
              sx={{
                color: isDark ? "#f59e0b" : "#d97706",
                borderColor: isDark ? "rgba(245, 158, 11, 0.3)" : "rgba(217, 119, 6, 0.3)",
                bgcolor: isDark ? "rgba(245, 158, 11, 0.08)" : "rgba(245, 158, 11, 0.05)",
                borderRadius: "10px",
                height: 38,
                px: 2,
                textTransform: "none",
                fontWeight: 700,
                fontSize: "0.82rem",
              }}
            >
              Reset Defaults
            </Button>

            {hasUnsavedChanges && (
              <Chip
                label="⚠️ Unsaved Changes"
                color="warning"
                size="small"
                sx={{ height: 26, fontWeight: 800, fontSize: "0.72rem" }}
              />
            )}

            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon sx={{ fontSize: 16 }} />}
              onClick={handleSave}
              disabled={saving || loading}
              sx={{
                background: hasUnsavedChanges
                  ? "linear-gradient(135deg, #f59e0b 0%, #10b981 100%)"
                  : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                color: "#fff",
                borderRadius: "10px",
                height: 38,
                px: 2.8,
                fontWeight: 800,
                fontSize: "0.84rem",
                textTransform: "none",
                boxShadow: hasUnsavedChanges
                  ? "0 0 16px rgba(245, 158, 11, 0.5)"
                  : "0 4px 14px rgba(16, 185, 129, 0.3)",
                "&:hover": { background: "linear-gradient(135deg, #059669 0%, #047857 100%)" },
              }}
            >
              {saving ? "Saving..." : hasUnsavedChanges ? "Save Permissions *" : "Save Permissions"}
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* ── CLEAN TARGET SELECTOR BAR (ROLES vs EMPLOYEE vs MATRIX) ── */}
      <Paper
        elevation={0}
        sx={{
          p: 0.6,
          borderRadius: "14px",
          bgcolor: isDark ? "#0e1322" : "#f1f5f9",
          border: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid #e2e8f0",
          mb: 3,
        }}
      >
        <Grid container spacing={0.6}>
          {ROLE_DEFINITIONS.map((r) => {
            const isSelected = activeTarget === r.key;
            const allowedCount = ALL_APK_FEATURES.filter((f) => isFeatureAllowedForRole(r.key, f)).length;
            return (
              <Grid item xs={6} sm={4} md={2} key={r.key}>
                <Button
                  fullWidth
                  onClick={() => setActiveTarget(r.key)}
                  sx={{
                    py: 1,
                    px: 1.2,
                    borderRadius: "10px",
                    fontWeight: 800,
                    fontSize: "0.82rem",
                    textTransform: "none",
                    color: isSelected ? "#ffffff" : isDark ? "#94a3b8" : "#475569",
                    bgcolor: isSelected ? r.color : "transparent",
                    boxShadow: isSelected ? `0 2px 10px ${alpha(r.color, 0.4)}` : "none",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    transition: "all 0.18s ease",
                    "&:hover": {
                      bgcolor: isSelected
                        ? r.color
                        : isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.04)",
                    },
                  }}
                >
                  <Stack direction="row" spacing={0.8} alignItems="center" sx={{ minWidth: 0 }}>
                    <Box sx={{ color: isSelected ? "#ffffff" : r.color, display: "flex", fontSize: 18 }}>{r.icon}</Box>
                    <Typography variant="body2" fontWeight={800} sx={{ fontSize: "0.82rem", whiteSpace: "nowrap" }}>
                      {r.shortLabel}
                    </Typography>
                  </Stack>
                  <Chip
                    size="small"
                    label={`${allowedCount}/29`}
                    sx={{
                      height: 19,
                      fontSize: "0.66rem",
                      fontWeight: 800,
                      bgcolor: isSelected ? "rgba(255,255,255,0.25)" : isDark ? "rgba(255,255,255,0.06)" : "#e2e8f0",
                      color: isSelected ? "#ffffff" : "text.secondary",
                      ml: 0.5,
                    }}
                  />
                </Button>
              </Grid>
            );
          })}

          {/* Individual Employee Tab */}
          <Grid item xs={6} sm={4} md={2}>
            <Button
              fullWidth
              onClick={() => setActiveTarget("employee")}
              sx={{
                py: 1,
                px: 1.2,
                borderRadius: "10px",
                fontWeight: 800,
                fontSize: "0.82rem",
                textTransform: "none",
                color: activeTarget === "employee" ? "#ffffff" : isDark ? "#94a3b8" : "#475569",
                bgcolor: activeTarget === "employee" ? "#06b6d4" : "transparent",
                boxShadow: activeTarget === "employee" ? "0 2px 10px rgba(6,182,212,0.4)" : "none",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                transition: "all 0.18s ease",
                "&:hover": {
                  bgcolor: activeTarget === "employee"
                    ? "#0891b2"
                    : isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.04)",
                },
              }}
            >
              <Stack direction="row" spacing={0.8} alignItems="center" sx={{ minWidth: 0 }}>
                <PersonIcon sx={{ fontSize: 18, color: activeTarget === "employee" ? "#ffffff" : "#06b6d4" }} />
                <Typography variant="body2" fontWeight={800} sx={{ fontSize: "0.82rem", whiteSpace: "nowrap" }}>
                  Employee
                </Typography>
              </Stack>
              <Chip
                size="small"
                label={currentSelectedUser?.firstName ? (currentSelectedUser.firstName.length > 7 ? `${currentSelectedUser.firstName.slice(0, 6)}..` : currentSelectedUser.firstName) : "Custom"}
                sx={{
                  height: 19,
                  fontSize: "0.66rem",
                  fontWeight: 800,
                  bgcolor: activeTarget === "employee" ? "rgba(255,255,255,0.25)" : isDark ? "rgba(255,255,255,0.06)" : "#e2e8f0",
                  color: activeTarget === "employee" ? "#ffffff" : "text.secondary",
                  ml: 0.5,
                }}
              />
            </Button>
          </Grid>

          {/* Matrix Comparison View Tab */}
          <Grid item xs={6} sm={4} md={2}>
            <Button
              fullWidth
              onClick={() => setActiveTarget("matrix")}
              sx={{
                py: 1,
                px: 1.2,
                borderRadius: "10px",
                fontWeight: 800,
                fontSize: "0.82rem",
                textTransform: "none",
                color: activeTarget === "matrix" ? "#ffffff" : isDark ? "#94a3b8" : "#475569",
                bgcolor: activeTarget === "matrix" ? "#6366f1" : "transparent",
                boxShadow: activeTarget === "matrix" ? "0 2px 10px rgba(99,102,241,0.4)" : "none",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                transition: "all 0.18s ease",
                "&:hover": {
                  bgcolor: activeTarget === "matrix"
                    ? "#4f46e5"
                    : isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.04)",
                },
              }}
            >
              <Stack direction="row" spacing={0.8} alignItems="center" sx={{ minWidth: 0 }}>
                <TableChartIcon sx={{ fontSize: 18, color: activeTarget === "matrix" ? "#ffffff" : "#6366f1" }} />
                <Typography variant="body2" fontWeight={800} sx={{ fontSize: "0.82rem", whiteSpace: "nowrap" }}>
                  Matrix View
                </Typography>
              </Stack>
              <Chip
                size="small"
                label="All"
                sx={{
                  height: 19,
                  fontSize: "0.66rem",
                  fontWeight: 800,
                  bgcolor: activeTarget === "matrix" ? "rgba(255,255,255,0.25)" : isDark ? "rgba(255,255,255,0.06)" : "#e2e8f0",
                  color: activeTarget === "matrix" ? "#ffffff" : "text.secondary",
                  ml: 0.5,
                }}
              />
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* ── EMPLOYEE SELECTOR (CLEAN AUTOCOMPLETE - NO MESSY OVERFLOW) ── */}
      {activeTarget === "employee" && (
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: "16px",
            bgcolor: isDark ? "#0e1322" : "#ffffff",
            border: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid #e2e8f0",
            mb: 3,
          }}
        >
          <Grid container spacing={2.5} alignItems="center">
            {/* Clean Autocomplete Search */}
            <Grid item xs={12} md={5}>
              <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: "uppercase", display: "block", mb: 0.8 }}>
                Select Employee:
              </Typography>
              <Autocomplete
                options={allUsers}
                getOptionLabel={(option) => {
                  if (!option) return "";
                  const name = `${option.firstName || ""} ${option.lastName || ""}`.trim();
                  const empId = option.employeeId ? ` (${option.employeeId})` : "";
                  const role = option.role ? ` - ${option.role}` : "";
                  return `${name}${empId}${role}`;
                }}
                value={currentSelectedUser}
                onChange={(event, newValue) => {
                  if (newValue) {
                    setSelectedUserId(newValue._id);
                    fetchUserPermissions(newValue._id);
                  }
                }}
                filterOptions={(options, { inputValue }) => {
                  const q = inputValue.toLowerCase().trim();
                  if (!q) return options.slice(0, 40);
                  return options.filter((u) => {
                    const full = `${u.firstName || ""} ${u.lastName || ""} ${u.employeeId || ""} ${u.phoneNumber || ""} ${u.role || ""}`.toLowerCase();
                    return full.includes(q);
                  }).slice(0, 40);
                }}
                renderOption={(props, option) => (
                  <Box
                    component="li"
                    {...props}
                    key={option._id}
                    sx={{
                      py: 1,
                      px: 1.5,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderBottom: isDark ? "1px solid rgba(255,255,255,0.04)" : "1px solid #f1f5f9",
                    }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar sx={{ width: 28, height: 28, fontSize: "0.75rem", bgcolor: "#3b82f6", fontWeight: 700 }}>
                        {(option.firstName?.[0] || "U").toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={700}>
                          {option.firstName} {option.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.employeeId || option.phoneNumber || "No ID"}
                        </Typography>
                      </Box>
                    </Stack>
                    <Chip size="small" label={option.role} sx={{ height: 20, fontSize: "0.68rem", fontWeight: 700 }} />
                  </Box>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Search by name, ID or phone number..."
                    size="small"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <SearchIcon sx={{ fontSize: 18, color: "text.secondary", mr: 1, ml: 0.5 }} />
                          {params.InputProps.startAdornment}
                        </>
                      ),
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "12px",
                        bgcolor: isDark ? "#090d16" : "#f8fafc",
                      },
                    }}
                  />
                )}
                ListboxProps={{
                  sx: {
                    maxHeight: 250,
                    bgcolor: isDark ? "#0e1322" : "#ffffff",
                    "& .MuiAutocomplete-option": {
                      fontSize: "0.85rem",
                    },
                  },
                }}
              />
            </Grid>

            {/* Selected Employee Info & Custom Toggle Card */}
            <Grid item xs={12} md={7}>
              <Paper
                elevation={0}
                sx={{
                  p: 1.8,
                  borderRadius: "12px",
                  bgcolor: userCustomEnabled
                    ? isDark ? "rgba(16, 185, 129, 0.12)" : "#ecfdf5"
                    : isDark ? "#090d16" : "#f8fafc",
                  border: `1.5px solid ${userCustomEnabled ? "#10b981" : isDark ? "rgba(255,255,255,0.08)" : "#cbd5e1"}`,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 1.5,
                }}
              >
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <VerifiedIcon sx={{ fontSize: 19, color: userCustomEnabled ? "#10b981" : "text.secondary" }} />
                    <Typography variant="subtitle2" fontWeight={800} sx={{ color: userCustomEnabled ? "#10b981" : "inherit" }}>
                      {userCustomEnabled ? "Individual Custom Access Active" : "Inheriting Role Defaults"}
                    </Typography>
                    <Chip
                      size="small"
                      label={currentSelectedUser?.role || "Incharge"}
                      sx={{ height: 18, fontSize: "0.65rem", fontWeight: 700 }}
                    />
                  </Stack>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.2 }}>
                    {userCustomEnabled
                      ? `Custom permissions configured below apply specifically to ${currentSelectedUser?.firstName || "this employee"}.`
                      : `Using standard permissions for role ${currentSelectedUser?.role || "Incharge"}. Turn switch ON to customize.`}
                  </Typography>
                </Box>

                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Typography variant="caption" fontWeight={800}>
                    Custom Override:
                  </Typography>
                  <Switch
                    checked={userCustomEnabled}
                    onChange={(e) => setUserCustomEnabled(e.target.checked)}
                    color="success"
                  />
                  {userCustomEnabled && (
                    <Button
                      size="small"
                      variant="outlined"
                      color="inherit"
                      onClick={handleResetDefaults}
                      sx={{ fontSize: "0.72rem", py: 0.2, px: 1, textTransform: "none", fontWeight: 700, borderRadius: "6px" }}
                    >
                      Revert
                    </Button>
                  )}
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* ── ROLE TARGET INFO BANNER (WHEN IN SINGLE ROLE MODE) ── */}
      {activeTarget !== "employee" && activeTarget !== "matrix" && (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            px: 2.5,
            borderRadius: "14px",
            bgcolor: isDark ? "#0e1322" : "#ffffff",
            border: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid #e2e8f0",
            mb: 3,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 1.5,
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: "10px",
                bgcolor: alpha(activeRoleMeta.color, 0.14),
                color: activeRoleMeta.color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {activeRoleMeta.icon}
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={800} sx={{ lineHeight: 1.2 }}>
                Default Permissions for Role: {activeRoleMeta.label}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {activeRoleMeta.desc}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              size="small"
              label={`${currentAllowedCount} of 29 Features Active`}
              sx={{
                fontWeight: 800,
                fontSize: "0.74rem",
                bgcolor: alpha(activeRoleMeta.color, 0.15),
                color: activeRoleMeta.color,
              }}
            />
            <Button
              size="small"
              variant="outlined"
              onClick={() => handleBulkToggle(true)}
              sx={{ textTransform: "none", fontWeight: 700, fontSize: "0.75rem", borderRadius: "8px" }}
            >
              Enable All
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="inherit"
              onClick={() => handleBulkToggle(false)}
              sx={{ textTransform: "none", fontWeight: 700, fontSize: "0.75rem", borderRadius: "8px", color: "text.secondary" }}
            >
              Disable All
            </Button>
          </Stack>
        </Paper>
      )}

      {/* ── TOOLBAR: SECTION FILTER & SEARCH ── */}
      <Paper
        elevation={0}
        sx={{
          p: 1.5,
          px: 2.2,
          borderRadius: "14px",
          bgcolor: isDark ? "#0e1322" : "#ffffff",
          border: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid #e2e8f0",
          mb: 2.5,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 1.5,
        }}
      >
        {/* Section Pills */}
        <Stack direction="row" spacing={1} sx={{ overflowX: "auto", py: 0.2 }}>
          {[
            { key: "all", label: `All Features (${ALL_APK_FEATURES.length})` },
            { key: "menus", label: `Drawer Menus (18)` },
            { key: "quickActions", label: `Quick FAB Actions (5)` },
            { key: "bottomTabs", label: `Bottom Tabs (6)` },
          ].map((sec) => {
            const isSelected = selectedSection === sec.key;
            return (
              <Chip
                key={sec.key}
                label={sec.label}
                clickable
                onClick={() => setSelectedSection(sec.key)}
                sx={{
                  fontWeight: 700,
                  fontSize: "0.78rem",
                  borderRadius: "8px",
                  bgcolor: isSelected
                    ? isDark ? "#2563eb" : PRIMARY_COLOR
                    : isDark ? "rgba(255, 255, 255, 0.05)" : "#f1f5f9",
                  color: isSelected ? "#ffffff" : "text.secondary",
                  border: isSelected ? "none" : isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0",
                }}
              />
            );
          })}
        </Stack>

        {/* Search Input */}
        <TextField
          size="small"
          placeholder="Search features (e.g. Map, Leads, Loan)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 18, color: "text.secondary" }} />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchTerm("")}>
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{
            width: { xs: "100%", sm: 280 },
            "& .MuiOutlinedInput-root": {
              borderRadius: "10px",
              bgcolor: isDark ? "#090d16" : "#f8fafc",
            },
          }}
        />
      </Paper>

      {/* ── MAIN CONTENT VIEW (CLEAN CARDS LIST OR COMPARISON MATRIX) ── */}
      {activeTarget === "matrix" ? (
        // ═══ COMPARISON MATRIX TABLE ═══
        <Paper
          elevation={0}
          sx={{
            borderRadius: "16px",
            bgcolor: isDark ? "#0e1322" : "#ffffff",
            border: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid #e2e8f0",
            overflow: "hidden",
          }}
        >
          <TableContainer sx={{ maxHeight: 680 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow sx={{ "& th": { bgcolor: isDark ? "#090d16" : "#f1f5f9", fontWeight: 800, fontSize: "0.82rem", py: 1.5 } }}>
                  <TableCell sx={{ minWidth: 260 }}>APK Feature ({filteredFeatures.length})</TableCell>
                  <TableCell sx={{ width: 130 }}>Type</TableCell>
                  {ROLE_DEFINITIONS.map((r) => (
                    <TableCell key={r.key} align="center" sx={{ width: 170 }}>
                      <Stack direction="row" spacing={0.6} justifyContent="center" alignItems="center">
                        <Box sx={{ color: r.color, display: "flex" }}>{r.icon}</Box>
                        <Typography variant="subtitle2" fontWeight={800} sx={{ color: r.color, fontSize: "0.82rem" }}>
                          {r.shortLabel}
                        </Typography>
                      </Stack>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredFeatures.map((f) => (
                  <TableRow key={`${f.type}-${f.id}`} hover>
                    <TableCell sx={{ py: 1.2 }}>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box
                          sx={{
                            width: 34,
                            height: 34,
                            borderRadius: "8px",
                            bgcolor: alpha(f.categoryColor, 0.12),
                            color: f.categoryColor,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 18,
                          }}
                        >
                          {f.icon}
                        </Box>
                        <Box>
                          <Typography variant="body2" fontWeight={700} sx={{ fontSize: "0.85rem", lineHeight: 1.2 }}>
                            {f.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.72rem" }}>
                            {f.desc}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ py: 1.2 }}>
                      <Chip
                        size="small"
                        label={f.typeLabel}
                        sx={{
                          height: 20,
                          fontSize: "0.66rem",
                          fontWeight: 700,
                          bgcolor: alpha(f.categoryColor, 0.1),
                          color: f.categoryColor,
                        }}
                      />
                    </TableCell>
                    {ROLE_DEFINITIONS.map((r) => {
                      const isChecked = isFeatureAllowedForRole(r.key, f);
                      return (
                        <TableCell key={r.key} align="center" sx={{ py: 1.2 }}>
                          <Switch
                            size="small"
                            checked={isChecked}
                            onChange={() => handleToggleRoleFeature(r.key, f)}
                            color={r.key === "Incharge" ? "success" : r.key === "Supervisor" ? "warning" : "primary"}
                          />
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      ) : (
        // ═══ CLEAN FOCUSED PERMISSION CARDS (CLEAN UI) ═══
        <Grid container spacing={2}>
          {filteredFeatures.map((item) => {
            const isChecked = isFeatureAllowed(item);

            return (
              <Grid item xs={12} sm={6} md={4} key={`${item.type}-${item.id}`}>
                <Paper
                  elevation={0}
                  onClick={() => handleToggleFeature(item)}
                  sx={{
                    p: 2,
                    borderRadius: "14px",
                    border: `1.8px solid ${
                      isChecked
                        ? isDark
                          ? alpha(item.categoryColor, 0.6)
                          : item.categoryColor
                        : isDark
                        ? "rgba(255, 255, 255, 0.07)"
                        : "#e2e8f0"
                    }`,
                    bgcolor: isChecked
                      ? isDark
                        ? alpha(item.categoryColor, 0.1)
                        : alpha(item.categoryColor, 0.04)
                      : isDark
                      ? "#0e1322"
                      : "#ffffff",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    height: "100%",
                    minHeight: 125,
                    transition: "all 0.18s ease",
                    "&:hover": {
                      borderColor: item.categoryColor,
                      boxShadow: `0 4px 16px ${alpha(item.categoryColor, 0.15)}`,
                      transform: "translateY(-2px)",
                    },
                  }}
                >
                  <Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.2 }}>
                      <Stack direction="row" spacing={1.2} alignItems="center">
                        <Box
                          sx={{
                            width: 38,
                            height: 38,
                            borderRadius: "10px",
                            bgcolor: isChecked ? alpha(item.categoryColor, 0.18) : isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9",
                            color: isChecked ? item.categoryColor : "text.secondary",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 20,
                          }}
                        >
                          {item.icon}
                        </Box>
                        <Chip
                          size="small"
                          label={item.typeLabel}
                          sx={{
                            height: 20,
                            fontSize: "0.66rem",
                            fontWeight: 700,
                            bgcolor: isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9",
                            color: "text.secondary",
                          }}
                        />
                      </Stack>

                      <Stack direction="row" spacing={0.8} alignItems="center">
                        <Chip
                          size="small"
                          label={isChecked ? "Visible" : "Hidden"}
                          sx={{
                            height: 20,
                            fontSize: "0.66rem",
                            fontWeight: 800,
                            bgcolor: isChecked ? alpha(item.categoryColor, 0.18) : isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9",
                            color: isChecked ? item.categoryColor : "text.secondary",
                          }}
                        />
                        <Switch
                          size="small"
                          checked={isChecked}
                          onChange={() => handleToggleFeature(item)}
                          onClick={(e) => e.stopPropagation()}
                          color="primary"
                        />
                      </Stack>
                    </Box>

                    <Typography variant="subtitle2" fontWeight={800} sx={{ fontSize: "0.88rem", lineHeight: 1.25, mb: 0.5 }}>
                      {item.name}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        fontSize: "0.74rem",
                        lineHeight: 1.35,
                      }}
                    >
                      {item.desc}
                    </Typography>
                  </Box>

                  <Box sx={{ mt: 1.5, pt: 1, borderTop: isDark ? "1px solid rgba(255,255,255,0.05)" : "1px solid #f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="caption" sx={{ color: item.categoryColor, fontWeight: 700, fontSize: "0.7rem" }}>
                      {item.categoryLabel}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.68rem", fontFamily: "monospace" }}>
                      #{item.id}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      )}

      {filteredFeatures.length === 0 && (
        <Paper elevation={0} sx={{ p: 6, textAlign: "center", borderRadius: "14px", bgcolor: isDark ? "#0e1322" : "#ffffff" }}>
          <Typography variant="body1" fontWeight={700} color="text.secondary">
            No features match your search.
          </Typography>
          <Button size="small" onClick={() => { setSearchTerm(""); setSelectedSection("all"); }} sx={{ mt: 1 }}>
            Clear Search
          </Button>
        </Paper>
      )}

      {/* ── STICKY FOOTER ACTION BAR (CLEAN & MINIMAL) ── */}
      <Paper
        elevation={8}
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1100,
          py: 1.6,
          px: { xs: 2.5, sm: 4 },
          bgcolor: isDark ? "rgba(14, 19, 34, 0.95)" : "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(20px)",
          borderTop: isDark ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid #e2e8f0",
          boxShadow: isDark ? "0 -8px 30px rgba(0,0,0,0.6)" : "0 -8px 30px rgba(15,23,42,0.06)",
        }}
      >
        <Box sx={{ maxWidth: 1600, mx: "auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Typography variant="body2" fontWeight={800}>
              {activeTarget === "employee"
                ? `Custom: ${currentSelectedUser?.firstName || "Employee"}`
                : activeTarget === "matrix"
                ? "Comparison Matrix"
                : `Role: ${activeRoleMeta.label}`}
            </Typography>
            <Chip
              size="small"
              label={`${currentAllowedCount} of 29 Allowed`}
              sx={{ height: 22, fontSize: "0.72rem", fontWeight: 800, bgcolor: "#10b981", color: "#fff" }}
            />
          </Stack>

          <Stack direction="row" spacing={1.5} alignItems="center">
            {hasUnsavedChanges && (
              <Chip
                label="⚠️ Unsaved Changes - Click Apply & Save"
                color="warning"
                size="small"
                sx={{ height: 26, fontSize: "0.75rem", fontWeight: 800 }}
              />
            )}

            <Button
              variant="outlined"
              color="inherit"
              startIcon={<ResetIcon sx={{ fontSize: 16 }} />}
              onClick={handleResetDefaults}
              disabled={saving || loading}
              sx={{
                borderRadius: "10px",
                borderColor: isDark ? "rgba(255, 255, 255, 0.15)" : "#cbd5e1",
                textTransform: "none",
                fontWeight: 700,
                fontSize: "0.82rem",
                px: 2,
              }}
            >
              Reset
            </Button>

            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon sx={{ fontSize: 16 }} />}
              onClick={handleSave}
              disabled={saving || loading}
              sx={{
                background: hasUnsavedChanges
                  ? "linear-gradient(135deg, #f59e0b 0%, #10b981 100%)"
                  : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                borderRadius: "10px",
                px: 3.5,
                py: 0.8,
                fontWeight: 800,
                fontSize: "0.85rem",
                textTransform: "none",
                boxShadow: hasUnsavedChanges
                  ? "0 0 18px rgba(245, 158, 11, 0.6)"
                  : "0 4px 14px rgba(16, 185, 129, 0.35)",
                "&:hover": { background: "linear-gradient(135deg, #059669 0%, #047857 100%)" },
              }}
            >
              {saving ? "Saving Changes..." : hasUnsavedChanges ? "Apply & Save Permissions *" : "Apply & Save Permissions"}
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}
