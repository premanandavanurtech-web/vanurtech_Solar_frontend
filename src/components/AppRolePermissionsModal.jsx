// components/AppRolePermissionsModal.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  IconButton,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
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
  Badge,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import {
  Close as CloseIcon,
  PhoneAndroid as PhoneIcon,
  Security as SecurityIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  RestartAlt as ResetIcon,
  Save as SaveIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  SupervisorAccount as SupervisorIcon,
  AdminPanelSettings as AdminIcon,
  Dashboard as DashboardIcon,
  AltRoute as RouteIcon,
  Navigation as NavigationIcon,
  People as LeadsIcon,
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
  TouchApp as ActionIcon,
  ViewCarousel as TabIcon,
  Check as CheckIcon,
  Tune as TuneIcon,
  InfoOutlined as InfoIcon,
} from "@mui/icons-material";
import { API_BASE_URL } from "../utils/apiConfig";
import { toast } from "./useToast.jsx";

const PRIMARY_COLOR = "#0f1f3d";
const ACCENT_COLOR = "#3b82f6";

// Catalog of all APK options
export const APK_MENU_DEFINITIONS = [
  { id: "home", label: "Dashboard / Home", description: "KPI metrics, target progress, visit overview & stats", category: "Core", icon: <DashboardIcon /> },
  { id: "kmHistory", label: "Trip Management / KM History", description: "GPS travel distance tracking, live logs & meter reading", category: "Field", icon: <RouteIcon /> },
  { id: "mapNavigation", label: "Map / GPS Navigation", description: "Turn-by-turn map guidance directly to client site", category: "Field", icon: <NavigationIcon /> },
  { id: "allLeads", label: "All Leads", description: "Customer pipeline, inquiries, stages & assignments", category: "Sales", icon: <LeadsIcon /> },
  { id: "quotations", label: "Quotations", description: "Create, inspect, share & download solar quotations", category: "Sales", icon: <QuotationIcon /> },
  { id: "totalVisits", label: "Location Visits", description: "Site visits, GPS customer check-in, remarks & photos", category: "Field", icon: <VisitIcon /> },
  { id: "registration", label: "Customer Registration", description: "New customer onboarding, roof details & electricity bill", category: "Sales", icon: <RegistrationIcon /> },
  { id: "document", label: "Document Verification", description: "Inspect and upload customer KYC & Aadhaar docs", category: "Operations", icon: <DocumentIcon /> },
  { id: "bankLoan", label: "Bank Loan Apply", description: "Solar financing loan applications with partnered banks", category: "Finance", icon: <BankLoanIcon /> },
  { id: "loanPending", label: "Bank Loan Pending", description: "Track loan sanction approvals & bank disbursement stages", category: "Finance", icon: <LoanPendingIcon /> },
  { id: "disbursement", label: "Disbursement", description: "Track subsidy release and vendor loan payments", category: "Finance", icon: <DisbursementIcon /> },
  { id: "installation", label: "Installation Work", description: "Site execution, structure mounting & plant commissioning", category: "Operations", icon: <InstallationIcon /> },
  { id: "missedLeads", label: "Missed Leads", description: "Uncontacted leads requiring urgent follow-up call", category: "Sales", icon: <MissedIcon /> },
  { id: "leaveManagement", label: "Leave Management", description: "Apply for leaves, view balances & track manager approvals", category: "HR", icon: <LeaveIcon /> },
  { id: "expense", label: "Expense Claims", description: "Daily travel, fuel & meal expense reimbursement claims", category: "HR", icon: <ExpenseIcon /> },
  { id: "projects", label: "Projects", description: "Assigned solar installations & customer worksheet cards", category: "Operations", icon: <ProjectIcon /> },
  { id: "attendance", label: "Attendance Tracking", description: "Daily selfie + GPS geo-fenced punch-in & punch-out", category: "HR", icon: <AttendanceIcon /> },
  { id: "notifications", label: "Notifications & Alerts", description: "Real-time push notifications & head office broadcasts", category: "Core", icon: <NotificationIcon /> },
];

export const APK_QUICK_ACTIONS = [
  { id: "newVisit", label: "New Visit", description: "Start new field visit record", icon: <VisitIcon /> },
  { id: "mapNavigation", label: "Map Navigation", description: "Open GPS route finder", icon: <NavigationIcon /> },
  { id: "registration", label: "New Registration", description: "Register new customer quickly", icon: <RegistrationIcon /> },
  { id: "bankLoan", label: "Bank Loan", description: "Quick bank loan submission", icon: <BankLoanIcon /> },
  { id: "document", label: "Document Upload", description: "Fast customer document check", icon: <DocumentIcon /> },
];

export const APK_BOTTOM_TABS = [
  { id: "home", label: "Home", icon: <DashboardIcon /> },
  { id: "allLeads", label: "All Leads", icon: <LeadsIcon /> },
  { id: "attendance", label: "Attendance", icon: <AttendanceIcon /> },
  { id: "projects", label: "Projects", icon: <ProjectIcon /> },
  { id: "profile", label: "Profile", icon: <PersonIcon /> },
  { id: "kmHistory", label: "KM History", icon: <RouteIcon /> },
];

export const ROLE_TABS = [
  { key: "Incharge", label: "Incharge / Field Team", icon: <GroupIcon />, color: "#10b981", desc: "Field technicians & site engineers" },
  { key: "Supervisor", label: "Supervisor", icon: <SupervisorIcon />, color: "#f59e0b", desc: "Field supervisors & team leads" },
  { key: "ZSM", label: "Manager (ZSM)", icon: <PersonIcon />, color: "#3b82f6", desc: "Area managers & operational leads" },
  { key: "Admin_panel", label: "Admin Panel", icon: <AdminIcon />, color: "#8b5cf6", desc: "Head office & administrative leaders" },
];

const getToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("authToken") ||
  localStorage.getItem("accessToken") ||
  "";

export default function AppRolePermissionsModal({
  open,
  onClose,
  initialUser = null, // If passed, opens directly on that user's custom settings
  allUsers = [], // List of users to choose from for individual custom settings
  onPermissionsUpdated = () => {},
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  // Tab mode: 'role' or 'user'
  const [activeTabMode, setActiveTabMode] = useState(initialUser ? "user" : "role");
  const [selectedRole, setSelectedRole] = useState(initialUser?.role ? initialUser.role : "Incharge");
  const [selectedUserId, setSelectedUserId] = useState(initialUser?._id || "");
  const [userSearchTerm, setUserSearchTerm] = useState("");

  // Role permissions dictionary: { Incharge: {...}, Supervisor: {...}, ZSM: {...}, Admin_panel: {...} }
  const [rolePermissions, setRolePermissions] = useState({});
  // User custom permissions: { hasCustom: bool, permissions: {...}, roleDefaults: {...} }
  const [userCustomData, setUserCustomData] = useState(null);
  const [userCustomEnabled, setUserCustomEnabled] = useState(false);

  // Active editable state
  const [activeMenus, setActiveMenus] = useState({});
  const [activeQuickActions, setActiveQuickActions] = useState({});
  const [activeBottomTabs, setActiveBottomTabs] = useState({});

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [filterQuery, setFilterQuery] = useState("");

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

  // Fetch specific employee permissions
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
        setActiveMenus(data.permissions?.menus || {});
        setActiveQuickActions(data.permissions?.quickActions || {});
        setActiveBottomTabs(data.permissions?.bottomTabs || {});
      }
    } catch (err) {
      console.error("fetchUserPermissions error:", err);
      toast.error("Failed to load employee permissions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchRolePermissions();
      if (initialUser?._id) {
        setActiveTabMode("user");
        setSelectedUserId(initialUser._id);
        fetchUserPermissions(initialUser._id);
      } else {
        setActiveTabMode("role");
      }
    }
  }, [open, initialUser, fetchRolePermissions, fetchUserPermissions]);

  // When switching role or rolePermissions update, update active permissions
  useEffect(() => {
    if (activeTabMode === "role" && rolePermissions[selectedRole]) {
      const p = rolePermissions[selectedRole];
      setActiveMenus(p.menus || {});
      setActiveQuickActions(p.quickActions || {});
      setActiveBottomTabs(p.bottomTabs || {});
    }
  }, [selectedRole, rolePermissions, activeTabMode]);

  // Filtered users for employee selection
  const filteredUsersList = useMemo(() => {
    const term = userSearchTerm.trim().toLowerCase();
    if (!term) return allUsers;
    return allUsers.filter((u) => {
      const fullName = `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase();
      const phone = (u.phoneNumber || "").toLowerCase();
      const empId = (u.employeeId || "").toLowerCase();
      const role = (u.role || "").toLowerCase();
      return fullName.includes(term) || phone.includes(term) || empId.includes(term) || role.includes(term);
    });
  }, [allUsers, userSearchTerm]);

  // Selected user object
  const currentSelectedUser = useMemo(() => {
    return allUsers.find((u) => u._id === selectedUserId) || userCustomData?.user || null;
  }, [allUsers, selectedUserId, userCustomData]);

  // Toggle handlers
  const handleToggleMenu = (menuId) => {
    setActiveMenus((prev) => ({ ...prev, [menuId]: !prev[menuId] }));
  };

  const handleToggleQuickAction = (actionId) => {
    setActiveQuickActions((prev) => ({ ...prev, [actionId]: !prev[actionId] }));
  };

  const handleToggleBottomTab = (tabId) => {
    setActiveBottomTabs((prev) => ({ ...prev, [tabId]: !prev[tabId] }));
  };

  const handleSelectAllMenus = (enable = true) => {
    const updated = {};
    APK_MENU_DEFINITIONS.forEach((m) => {
      updated[m.id] = enable;
    });
    setActiveMenus(updated);
  };

  const handleSelectAllActions = (enable = true) => {
    const updated = {};
    APK_QUICK_ACTIONS.forEach((a) => {
      updated[a.id] = enable;
    });
    setActiveQuickActions(updated);
  };

  // Reset to default
  const handleResetDefaults = async () => {
    if (activeTabMode === "role") {
      try {
        setSaving(true);
        const res = await fetch(`${API_BASE_URL}/app-permissions/reset`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({ role: selectedRole }),
        });
        const data = await res.json();
        if (data.success) {
          toast.success(`Reset ${selectedRole} permissions to defaults`);
          await fetchRolePermissions();
          onPermissionsUpdated();
        } else {
          toast.error(data.message || "Failed to reset");
        }
      } catch (err) {
        toast.error(err.message || "Reset failed");
      } finally {
        setSaving(false);
      }
    } else {
      // Revert employee to role defaults
      try {
        setSaving(true);
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
          toast.success(data.message || "Reverted employee to role defaults");
          await fetchUserPermissions(selectedUserId);
          onPermissionsUpdated();
        }
      } catch (err) {
        toast.error(err.message || "Revert failed");
      } finally {
        setSaving(false);
      }
    }
  };

  // Save changes
  const handleSave = async () => {
    try {
      setSaving(true);
      if (activeTabMode === "role") {
        const payload = {
          role: selectedRole,
          menus: activeMenus,
          quickActions: activeQuickActions,
          bottomTabs: activeBottomTabs,
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
          toast.success(`Saved APK access permissions for role: ${selectedRole}!`);
          await fetchRolePermissions();
          onPermissionsUpdated();
        } else {
          toast.error(data.message || "Failed to save permissions");
        }
      } else {
        // Saving for specific employee
        const payload = {
          enabled: userCustomEnabled,
          menus: activeMenus,
          quickActions: activeQuickActions,
          bottomTabs: activeBottomTabs,
        };
        const res = await fetch(`${API_BASE_URL}/app-permissions/user/${selectedUserId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success) {
          toast.success(data.message || "Employee APK access permissions updated!");
          await fetchUserPermissions(selectedUserId);
          onPermissionsUpdated();
        } else {
          toast.error(data.message || "Failed to update employee permissions");
        }
      }
    } catch (err) {
      console.error("Save error:", err);
      toast.error(err.message || "Failed to save permissions");
    } finally {
      setSaving(false);
    }
  };

  // Filter menus by search and category
  const categories = useMemo(() => {
    const cats = new Set(APK_MENU_DEFINITIONS.map((m) => m.category));
    return ["all", ...Array.from(cats)];
  }, []);

  const displayedMenus = useMemo(() => {
    return APK_MENU_DEFINITIONS.filter((m) => {
      const matchCat = activeCategory === "all" || m.category === activeCategory;
      const matchQuery =
        !filterQuery.trim() ||
        m.label.toLowerCase().includes(filterQuery.toLowerCase()) ||
        m.description.toLowerCase().includes(filterQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [activeCategory, filterQuery]);

  // Count active stats
  const activeMenusCount = useMemo(() => {
    return Object.values(activeMenus).filter(Boolean).length;
  }, [activeMenus]);

  const activeQuickCount = useMemo(() => {
    return Object.values(activeQuickActions).filter(Boolean).length;
  }, [activeQuickActions]);

  const activeTabsCount = useMemo(() => {
    return Object.values(activeBottomTabs).filter(Boolean).length;
  }, [activeBottomTabs]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "24px",
          bgcolor: isDark ? "#080c16" : "#ffffff",
          backgroundImage: "none",
          boxShadow: isDark ? "0 25px 70px rgba(0,0,0,0.85)" : "0 20px 60px rgba(0,0,0,0.15)",
          overflow: "hidden",
          maxHeight: "92vh",
        },
      }}
    >
      {/* ── HEADER ── */}
      <Box
        sx={{
          background: isDark
            ? "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)"
            : `linear-gradient(135deg, ${PRIMARY_COLOR} 0%, #1e40af 100%)`,
          px: { xs: 2.5, sm: 3.5 },
          py: 2.5,
          color: "#ffffff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: isDark ? "1px solid rgba(255,255,255,0.08)" : "none",
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: "14px",
              bgcolor: "rgba(255,255,255,0.15)",
              backdropFilter: "blur(8px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid rgba(255,255,255,0.25)",
            }}
          >
            <PhoneIcon sx={{ fontSize: 28, color: "#ffffff" }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={800} sx={{ letterSpacing: "-0.01em", lineHeight: 1.2 }}>
              Mobile APK Access & Permissions
            </Typography>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.75)" }}>
              Select what menus, quick action buttons, and tabs employees see in the mobile app
            </Typography>
          </Box>
        </Stack>

        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            color: "#ffffff",
            bgcolor: "rgba(255,255,255,0.12)",
            "&:hover": { bgcolor: "rgba(255,255,255,0.25)" },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* ── TOP TABS: ROLE VS EMPLOYEE ── */}
      <Box
        sx={{
          px: { xs: 2, sm: 3.5 },
          pt: 1.5,
          bgcolor: isDark ? "#0d1322" : "#f8fafc",
          borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0"}`,
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 1.5,
        }}
      >
        <Tabs
          value={activeTabMode}
          onChange={(_, val) => setActiveTabMode(val)}
          sx={{
            minHeight: 46,
            "& .MuiTab-root": {
              fontWeight: 700,
              fontSize: "0.85rem",
              textTransform: "none",
              minHeight: 46,
              color: isDark ? "#94a3b8" : "#64748b",
              "&.Mui-selected": { color: isDark ? "#60a5fa" : ACCENT_COLOR },
            },
          }}
        >
          <Tab
            value="role"
            icon={<SecurityIcon sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label="Configure by Role (Defaults)"
          />
          <Tab
            value="user"
            icon={<PersonIcon sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label="Configure by Employee (Custom Access)"
          />
        </Tabs>

        {/* Live Permission Counter Pill */}
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            size="small"
            icon={<CheckCircleIcon sx={{ fontSize: "14px !important" }} />}
            label={`${activeMenusCount}/${APK_MENU_DEFINITIONS.length} Menus`}
            sx={{
              fontWeight: 700,
              fontSize: "0.72rem",
              bgcolor: isDark ? "rgba(59, 130, 246, 0.15)" : "#eff6ff",
              color: isDark ? "#93c5fd" : "#1d4ed8",
            }}
          />
          <Chip
            size="small"
            label={`${activeQuickCount}/${APK_QUICK_ACTIONS.length} Quick Actions`}
            sx={{
              fontWeight: 700,
              fontSize: "0.72rem",
              bgcolor: isDark ? "rgba(16, 185, 129, 0.15)" : "#ecfdf5",
              color: isDark ? "#6ee7b7" : "#047857",
            }}
          />
          <Chip
            size="small"
            label={`${activeTabsCount}/${APK_BOTTOM_TABS.length} Bottom Tabs`}
            sx={{
              fontWeight: 700,
              fontSize: "0.72rem",
              bgcolor: isDark ? "rgba(245, 158, 11, 0.15)" : "#fffbeb",
              color: isDark ? "#fcd34d" : "#b45309",
            }}
          />
        </Stack>
      </Box>

      {/* ── TARGET SELECTION BANNER ── */}
      <Box sx={{ px: { xs: 2.5, sm: 3.5 }, py: 2, bgcolor: isDark ? "#0b101c" : "#ffffff" }}>
        {activeTabMode === "role" ? (
          /* Role Selector Pills */
          <Grid container spacing={1.5}>
            {ROLE_TABS.map((r) => {
              const isSelected = selectedRole === r.key;
              return (
                <Grid item xs={6} sm={3} key={r.key}>
                  <Paper
                    elevation={0}
                    onClick={() => setSelectedRole(r.key)}
                    sx={{
                      p: 1.5,
                      borderRadius: "14px",
                      border: `2px solid ${isSelected ? r.color : isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0"}`,
                      bgcolor: isSelected
                        ? isDark
                          ? alpha(r.color, 0.15)
                          : alpha(r.color, 0.08)
                        : isDark
                        ? "#101626"
                        : "#f8fafc",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      textAlign: "left",
                      display: "flex",
                      alignItems: "center",
                      gap: 1.25,
                      "&:hover": {
                        borderColor: r.color,
                        transform: "translateY(-1px)",
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: "10px",
                        bgcolor: alpha(r.color, 0.15),
                        color: r.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {r.icon}
                    </Box>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography
                        variant="subtitle2"
                        fontWeight={700}
                        sx={{
                          fontSize: "0.82rem",
                          color: isSelected ? r.color : isDark ? "#f1f5f9" : "#0f172a",
                          lineHeight: 1.2,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {r.label}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          fontSize: "0.68rem",
                          color: "text.secondary",
                          display: "block",
                          lineHeight: 1.2,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {r.desc}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        ) : (
          /* Employee Selector & Custom Toggle */
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: "16px",
              bgcolor: isDark ? "#101626" : "#f1f5f9",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0"}`,
            }}
          >
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={5}>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ fontWeight: 600 }}>Select Employee</InputLabel>
                  <Select
                    value={selectedUserId}
                    label="Select Employee"
                    onChange={(e) => {
                      setSelectedUserId(e.target.value);
                      fetchUserPermissions(e.target.value);
                    }}
                    sx={{
                      borderRadius: "12px",
                      bgcolor: isDark ? "#0b101c" : "#ffffff",
                    }}
                  >
                    {filteredUsersList.map((u) => (
                      <MenuItem key={u._id} value={u._id}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Avatar sx={{ width: 26, height: 26, fontSize: "0.75rem", bgcolor: ACCENT_COLOR }}>
                            {(u.firstName?.[0] || "U").toUpperCase()}
                          </Avatar>
                          <Typography variant="body2" fontWeight={600}>
                            {u.firstName} {u.lastName}
                          </Typography>
                          <Chip
                            size="small"
                            label={u.role}
                            sx={{ height: 18, fontSize: "0.65rem", fontWeight: 700 }}
                          />
                        </Stack>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Employee Custom Override Switch */}
              <Grid item xs={12} sm={6} md={7}>
                <Stack direction="row" spacing={2} alignItems="center" justifyContent={{ sm: "flex-end" }}>
                  <Box sx={{ textAlign: { sm: "right" } }}>
                    <Typography variant="subtitle2" fontWeight={700}>
                      {userCustomEnabled ? "Custom Access Enabled" : "Using Role Defaults"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {userCustomEnabled
                        ? "This employee has unique APK permissions configured"
                        : `Inherits all standard permissions for role: ${currentSelectedUser?.role || "Incharge"}`}
                    </Typography>
                  </Box>
                  <Switch
                    checked={userCustomEnabled}
                    onChange={(e) => setUserCustomEnabled(e.target.checked)}
                    color="primary"
                  />
                </Stack>
              </Grid>
            </Grid>
          </Paper>
        )}
      </Box>

      <Divider sx={{ borderColor: isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9" }} />

      {/* ── MAIN CONTENT: SCROLLABLE SECTIONS ── */}
      <DialogContent sx={{ p: { xs: 2, sm: 3.5 }, overflowY: "auto" }}>
        {loading ? (
          <Box sx={{ py: 8, display: "flex", justifyContent: "center", alignItems: "center" }}>
            <CircularProgress size={36} />
          </Box>
        ) : (
          <Stack spacing={3.5}>
            {/* ═══ SECTION 1: NAVIGATION MENUS ═══ */}
            <Box>
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 1.5,
                  gap: 1,
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="h6" fontWeight={800} sx={{ fontSize: "1rem" }}>
                    1. Mobile App Navigation Menus
                  </Typography>
                  <Chip
                    size="small"
                    label={`${activeMenusCount} Active`}
                    color="primary"
                    sx={{ height: 20, fontSize: "0.7rem", fontWeight: 700 }}
                  />
                </Stack>

                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    variant="text"
                    onClick={() => handleSelectAllMenus(true)}
                    sx={{ fontSize: "0.75rem", fontWeight: 700 }}
                  >
                    Select All
                  </Button>
                  <Button
                    size="small"
                    variant="text"
                    color="inherit"
                    onClick={() => handleSelectAllMenus(false)}
                    sx={{ fontSize: "0.75rem", fontWeight: 700, color: "text.secondary" }}
                  >
                    Deselect All
                  </Button>
                </Stack>
              </Box>

              {/* Category Filter Chips & Search */}
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2, alignItems: "center" }}>
                <TextField
                  size="small"
                  placeholder="Filter menus..."
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ width: { xs: "100%", sm: 220 }, "& .MuiInputBase-root": { borderRadius: "10px" } }}
                />

                <Stack direction="row" spacing={0.75} sx={{ overflowX: "auto", py: 0.5 }}>
                  {categories.map((cat) => (
                    <Chip
                      key={cat}
                      label={cat === "all" ? "All Categories" : cat}
                      clickable
                      onClick={() => setActiveCategory(cat)}
                      variant={activeCategory === cat ? "filled" : "outlined"}
                      color={activeCategory === cat ? "primary" : "default"}
                      size="small"
                      sx={{ fontWeight: 600, textTransform: "capitalize" }}
                    />
                  ))}
                </Stack>
              </Box>

              {/* Grid of Menu Toggles */}
              <Grid container spacing={1.5}>
                {displayedMenus.map((item) => {
                  const isChecked = Boolean(activeMenus[item.id]);
                  return (
                    <Grid item xs={12} sm={6} md={4} key={item.id}>
                      <Paper
                        elevation={0}
                        onClick={() => handleToggleMenu(item.id)}
                        sx={{
                          p: 1.5,
                          borderRadius: "14px",
                          border: `1.5px solid ${
                            isChecked
                              ? isDark
                                ? "#3b82f6"
                                : "#2563eb"
                              : isDark
                              ? "rgba(255,255,255,0.06)"
                              : "#e2e8f0"
                          }`,
                          bgcolor: isChecked
                            ? isDark
                              ? "rgba(37, 99, 235, 0.12)"
                              : "#eff6ff"
                            : isDark
                            ? "#0c1220"
                            : "#ffffff",
                          cursor: "pointer",
                          transition: "all 0.18s ease",
                          display: "flex",
                          alignItems: "flex-start",
                          justifyContent: "space-between",
                          gap: 1.25,
                          "&:hover": {
                            borderColor: ACCENT_COLOR,
                            transform: "translateY(-1px)",
                            boxShadow: isDark
                              ? "0 4px 16px rgba(0,0,0,0.4)"
                              : "0 4px 16px rgba(37, 99, 235, 0.08)",
                          },
                        }}
                      >
                        <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ minWidth: 0, flex: 1 }}>
                          <Box
                            sx={{
                              width: 36,
                              height: 36,
                              borderRadius: "10px",
                              bgcolor: isChecked
                                ? isDark
                                  ? "#1e3a8a"
                                  : "#dbeafe"
                                : isDark
                                ? "rgba(255,255,255,0.05)"
                                : "#f1f5f9",
                              color: isChecked ? (isDark ? "#93c5fd" : "#1d4ed8") : "text.secondary",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                              mt: 0.2,
                            }}
                          >
                            {item.icon}
                          </Box>
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography
                              variant="subtitle2"
                              fontWeight={700}
                              sx={{
                                fontSize: "0.84rem",
                                color: isChecked
                                  ? isDark
                                    ? "#ffffff"
                                    : "#0f172a"
                                  : isDark
                                  ? "#94a3b8"
                                  : "#64748b",
                                lineHeight: 1.25,
                              }}
                            >
                              {item.label}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                fontSize: "0.7rem",
                                color: "text.secondary",
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                                mt: 0.3,
                                lineHeight: 1.3,
                              }}
                            >
                              {item.description}
                            </Typography>
                          </Box>
                        </Stack>

                        <Switch
                          size="small"
                          checked={isChecked}
                          onChange={() => handleToggleMenu(item.id)}
                          onClick={(e) => e.stopPropagation()}
                          color="primary"
                        />
                      </Paper>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>

            <Divider sx={{ borderColor: isDark ? "rgba(255,255,255,0.06)" : "#e2e8f0" }} />

            {/* ═══ SECTION 2: QUICK ACTION BUTTONS ═══ */}
            <Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 1.5,
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="h6" fontWeight={800} sx={{ fontSize: "1rem" }}>
                    2. Quick Action Buttons (Floating Menu)
                  </Typography>
                  <Chip
                    size="small"
                    label={`${activeQuickCount} Active`}
                    color="success"
                    sx={{ height: 20, fontSize: "0.7rem", fontWeight: 700 }}
                  />
                </Stack>

                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    variant="text"
                    onClick={() => handleSelectAllActions(true)}
                    sx={{ fontSize: "0.75rem", fontWeight: 700 }}
                  >
                    Select All
                  </Button>
                  <Button
                    size="small"
                    variant="text"
                    color="inherit"
                    onClick={() => handleSelectAllActions(false)}
                    sx={{ fontSize: "0.75rem", fontWeight: 700, color: "text.secondary" }}
                  >
                    Deselect All
                  </Button>
                </Stack>
              </Box>

              <Grid container spacing={1.5}>
                {APK_QUICK_ACTIONS.map((action) => {
                  const isChecked = Boolean(activeQuickActions[action.id]);
                  return (
                    <Grid item xs={12} sm={6} md={2.4} key={action.id}>
                      <Paper
                        elevation={0}
                        onClick={() => handleToggleQuickAction(action.id)}
                        sx={{
                          p: 1.75,
                          borderRadius: "14px",
                          border: `1.5px solid ${
                            isChecked
                              ? isDark
                                ? "#10b981"
                                : "#059669"
                              : isDark
                              ? "rgba(255,255,255,0.06)"
                              : "#e2e8f0"
                          }`,
                          bgcolor: isChecked
                            ? isDark
                              ? "rgba(16, 185, 129, 0.12)"
                              : "#ecfdf5"
                            : isDark
                            ? "#0c1220"
                            : "#ffffff",
                          cursor: "pointer",
                          textAlign: "center",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          transition: "all 0.18s ease",
                          "&:hover": {
                            borderColor: "#10b981",
                            transform: "translateY(-1px)",
                          },
                        }}
                      >
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: "12px",
                            bgcolor: isChecked
                              ? isDark
                                ? "rgba(16, 185, 129, 0.25)"
                                : "#d1fae5"
                              : isDark
                              ? "rgba(255,255,255,0.05)"
                              : "#f1f5f9",
                            color: isChecked ? "#10b981" : "text.secondary",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            mb: 1,
                          }}
                        >
                          {action.icon}
                        </Box>
                        <Typography variant="subtitle2" fontWeight={700} sx={{ fontSize: "0.82rem", mb: 0.5 }}>
                          {action.label}
                        </Typography>
                        <Switch
                          size="small"
                          checked={isChecked}
                          onChange={() => handleToggleQuickAction(action.id)}
                          onClick={(e) => e.stopPropagation()}
                          color="success"
                        />
                      </Paper>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>

            <Divider sx={{ borderColor: isDark ? "rgba(255,255,255,0.06)" : "#e2e8f0" }} />

            {/* ═══ SECTION 3: BOTTOM NAVIGATION TABS ═══ */}
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="h6" fontWeight={800} sx={{ fontSize: "1rem" }}>
                    3. Persistent Bottom Navigation Tabs
                  </Typography>
                  <Chip
                    size="small"
                    label={`${activeTabsCount} Active`}
                    color="warning"
                    sx={{ height: 20, fontSize: "0.7rem", fontWeight: 700 }}
                  />
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  Recommended: 4 to 5 tabs for ideal mobile ergonomics
                </Typography>
              </Box>

              <Grid container spacing={1.5}>
                {APK_BOTTOM_TABS.map((tab) => {
                  const isChecked = Boolean(activeBottomTabs[tab.id]);
                  return (
                    <Grid item xs={6} sm={4} md={2} key={tab.id}>
                      <Paper
                        elevation={0}
                        onClick={() => handleToggleBottomTab(tab.id)}
                        sx={{
                          p: 1.5,
                          borderRadius: "14px",
                          border: `1.5px solid ${
                            isChecked
                              ? isDark
                                ? "#f59e0b"
                                : "#d97706"
                              : isDark
                              ? "rgba(255,255,255,0.06)"
                              : "#e2e8f0"
                          }`,
                          bgcolor: isChecked
                            ? isDark
                              ? "rgba(245, 158, 11, 0.12)"
                              : "#fffbeb"
                            : isDark
                            ? "#0c1220"
                            : "#ffffff",
                          cursor: "pointer",
                          textAlign: "center",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          transition: "all 0.18s ease",
                          "&:hover": {
                            borderColor: "#f59e0b",
                            transform: "translateY(-1px)",
                          },
                        }}
                      >
                        <Box
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: "10px",
                            bgcolor: isChecked
                              ? isDark
                                ? "rgba(245, 158, 11, 0.25)"
                                : "#fef3c7"
                              : isDark
                              ? "rgba(255,255,255,0.05)"
                              : "#f1f5f9",
                            color: isChecked ? "#f59e0b" : "text.secondary",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            mb: 1,
                          }}
                        >
                          {tab.icon}
                        </Box>
                        <Typography variant="caption" fontWeight={700} sx={{ mb: 0.5 }}>
                          {tab.label}
                        </Typography>
                        <Switch
                          size="small"
                          checked={isChecked}
                          onChange={() => handleToggleBottomTab(tab.id)}
                          onClick={(e) => e.stopPropagation()}
                          color="warning"
                        />
                      </Paper>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          </Stack>
        )}
      </DialogContent>

      {/* ── FOOTER ACTIONS ── */}
      <DialogActions
        sx={{
          px: { xs: 2.5, sm: 3.5 },
          py: 2,
          bgcolor: isDark ? "#080c16" : "#f8fafc",
          borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0"}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Button
          variant="outlined"
          color="inherit"
          startIcon={<ResetIcon />}
          onClick={handleResetDefaults}
          disabled={saving || loading}
          sx={{
            borderRadius: "12px",
            borderColor: isDark ? "rgba(255,255,255,0.15)" : "#cbd5e1",
            fontWeight: 600,
            fontSize: "0.82rem",
          }}
        >
          {activeTabMode === "role" ? "Reset Role to Defaults" : "Revert to Role Defaults"}
        </Button>

        <Stack direction="row" spacing={1.5}>
          <Button
            onClick={onClose}
            sx={{
              borderRadius: "12px",
              color: "text.secondary",
              fontWeight: 600,
              px: 2.5,
            }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
            onClick={handleSave}
            disabled={saving || loading}
            sx={{
              background: `linear-gradient(135deg, ${PRIMARY_COLOR} 0%, #2563eb 100%)`,
              borderRadius: "12px",
              px: 3.5,
              fontWeight: 700,
              boxShadow: "0 4px 16px rgba(37, 99, 235, 0.3)",
              "&:hover": {
                background: `linear-gradient(135deg, #0a172e 0%, #1d4ed8 100%)`,
              },
            }}
          >
            {saving ? "Saving Changes..." : "Apply & Save Permissions"}
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
