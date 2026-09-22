// pages/LeadOverview.jsx (Updated Modals Design)

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  TablePagination,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Snackbar,
  useMediaQuery,
  Tabs,
  Tab,
  useTheme,
  Grid,
  Checkbox,
  Divider,
  Stack,
  FormHelperText,
  Card,
  CardContent,
  Skeleton,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Badge,
  SwipeableDrawer,
  Collapse,
  Fab,
  Zoom,
  Fade,
  Slide,
  BottomNavigation,
  BottomNavigationAction,
  alpha,
  LinearProgress,
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  Person,
  Search,
  Visibility,
  Refresh,
  Clear,
  Close,
  Assignment,
  AssignmentInd,
  SupervisorAccount,
  Groups,
  Description,
  Save,
  DeleteForever,
  ArrowDropDown,
  ArrowDropUp,
  Email,
  Phone,
  CalendarToday,
  AccessTime,
  Business,
  AccountCircle,
  Security,
  AdminPanelSettings,
  WorkspacePremium,
  HowToReg,
  CheckCircle,
  Cancel,
  Pending,
  TableChart,
  GridView,
  ViewList,
  DateRange,
  Timeline,
  Send,
  SortByAlpha,
  Sort,
  ExpandMore,
  Home,
  LocationOn,
  FolderOpen,
  AccountBalance,
  ReceiptLong,
  Build,
  OpenInNew,
  CreditCard,
  PictureAsPdf,
  Money,
  Event,
  AttachFile,
  Note,
  LocalAtm,
  FilterAlt,
  Dashboard,
  Schedule,
  TrendingUp,
  Warning,
  Info,
  ExpandLess,
  ErrorOutline,
  PersonRemove,
  MoreVert,
  ContentCopy,
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";
import { format, parseISO, isValid } from "date-fns";
import { useLocation, useNavigate } from "react-router-dom";
import ConvertProjectDialog from "../components/ConvertProjectDialog";
import { getQuotationsForLead, setCurrentQuotation } from "../utils/quotationStorage";
import { resolveVisitStatus } from "../utils/visitStatus";

// ========== CONSTANTS & UTILITIES ==========
const PRIMARY_COLOR = "#2563eb";
const SECONDARY_COLOR = "#0f1f3d";
const GRADIENT_MAIN = "linear-gradient(135deg, #0f1f3d 0%, #1a3a6b 60%, #2563eb 100%)";
const GRADIENT_BLUE = "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)";
const GRADIENT_CARD = "linear-gradient(135deg, #f8faff, #eff6ff)";
const GRADIENT_DARK = "linear-gradient(135deg, #0f1f3d, #2563eb)";
const GRADIENT_SOFT_BLUE = "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)";
const GRADIENT_SOFT_AMBER = "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)";
const GRADIENT_SOFT_GREEN = "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)";
const FOCUS_RING = "0 0 0 3px rgba(37,99,235,.12)";

const LEAD_STATUS_OPTIONS = [
  "Contacted",
  "Qualified",
  "Visit",
  "Proposal Sent",
  "Won",
  "Lost",
  "Registration",
  "Bank Loan Apply",
  "Document Submission",
  "Bank at Pending",
  "Disbursement",
  "Installation Completion",
  "Missed Leads",
  "New",
];

const PERIOD_OPTIONS = [
  { value: "Today", label: "Today", icon: <CalendarToday /> },
  { value: "This Week", label: "This Week", icon: <DateRange /> },
  { value: "This Month", label: "This Month", icon: <DateRange /> },
  { value: "All", label: "All time", icon: <DateRange /> },  // ← only this skips date filter
];

export const normalizeUserRole = (role) => {
  const r = String(role || "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (["admin", "admin_panel", "head_office", "super_admin", "superadmin", "owner"].includes(r)) {
    return "Admin_panel";
  }
  if (["zsm", "project_head", "manager", "operation_lead", "operations_lead"].includes(r)) {
    return "ZSM";
  }
  if (["incharge", "supervisor", "lead_incharge"].includes(r)) {
    return "Incharge";
  }
  return "TEAM";
};

const adminPerms = {
  view: true, edit: true, assign: true, delete: true, bulkActions: true,
  export: true, settings: true, color: PRIMARY_COLOR,
  icon: <AdminPanelSettings />, label: "Admin Panel", level: 1, canAssignTo: ["Incharge", "TEAM"],
};

const zsmPerms = {
  view: true, edit: true, assign: true, delete: false, bulkActions: true,
  export: true, settings: false, color: PRIMARY_COLOR,
  icon: <WorkspacePremium />, label: "Operation Lead", level: 2, canAssignTo: ["Incharge", "TEAM"],
};

const inchargePerms = {
  view: true, edit: true, assign: true, delete: false, bulkActions: true,
  export: false, settings: false, color: PRIMARY_COLOR,
  icon: <Groups />, label: "Installer", level: 3, canAssignTo: ["TEAM"],
};

const teamPerms = {
  view: true, edit: true, assign: false, delete: false, bulkActions: false,
  export: false, settings: false, color: PRIMARY_COLOR,
  icon: <Groups />, label: "Installer", level: 4, canAssignTo: [],
};

export const ROLE_PERMISSIONS = {
  Admin_panel: adminPerms,
  ADMIN: adminPerms,
  Admin: adminPerms,
  admin: adminPerms,
  HEAD_OFFICE: adminPerms,
  head_office: adminPerms,
  SUPER_ADMIN: adminPerms,
  super_admin: adminPerms,
  ZSM: zsmPerms,
  PROJECT_HEAD: zsmPerms,
  Incharge: inchargePerms,
  INCHARGE: inchargePerms,
  SUPERVISOR: inchargePerms,
  supervisor: inchargePerms,
  TEAM: teamPerms,
  team: teamPerms,
  INSTALLER: teamPerms,
};

const getStatusColor = (status) => {
  const colorMap = {
    Visit: {
      bg: "linear-gradient(135deg, rgba(37,99,235,0.18) 0%, rgba(96,165,250,0.28) 100%)",
      color: "#1d4ed8",
      icon: <Person />,
      avatar: "linear-gradient(135deg, #1d4ed8 0%, #60a5fa 100%)",
      border: alpha("#2563eb", 0.18),
    },
    Registration: {
      bg: "linear-gradient(135deg, rgba(59,130,246,0.16) 0%, rgba(147,197,253,0.3) 100%)",
      color: "#1d4ed8",
      icon: <HowToReg />,
      avatar: "linear-gradient(135deg, #2563eb 0%, #60a5fa 100%)",
      border: alpha("#3b82f6", 0.18),
    },
    "Bank Loan Apply": {
      bg: "linear-gradient(135deg, rgba(245,158,11,0.14) 0%, rgba(253,224,71,0.32) 100%)",
      color: "#b45309",
      icon: <Business />,
      avatar: "linear-gradient(135deg, #d97706 0%, #fbbf24 100%)",
      border: alpha("#f59e0b", 0.18),
    },
    "Document Submission": {
      bg: "linear-gradient(135deg, rgba(14,165,233,0.14) 0%, rgba(125,211,252,0.28) 100%)",
      color: "#0369a1",
      icon: <Description />,
      avatar: "linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)",
      border: alpha("#0ea5e9", 0.18),
    },
    "Bank at Pending": {
      bg: "linear-gradient(135deg, rgba(251,191,36,0.16) 0%, rgba(253,230,138,0.32) 100%)",
      color: "#b45309",
      icon: <Pending />,
      avatar: "linear-gradient(135deg, #d97706 0%, #fbbf24 100%)",
      border: alpha("#f59e0b", 0.18),
    },
    Disbursement: {
      bg: "linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(110,231,183,0.32) 100%)",
      color: "#047857",
      icon: <Assignment />,
      avatar: "linear-gradient(135deg, #059669 0%, #34d399 100%)",
      border: alpha("#10b981", 0.18),
    },
    "Installation Completion": {
      bg: "linear-gradient(135deg, rgba(34,197,94,0.15) 0%, rgba(134,239,172,0.32) 100%)",
      color: "#15803d",
      icon: <CheckCircle />,
      avatar: "linear-gradient(135deg, #16a34a 0%, #4ade80 100%)",
      border: alpha("#22c55e", 0.18),
    },
    "Missed Leads": {
      bg: "linear-gradient(135deg, rgba(239,68,68,0.14) 0%, rgba(252,165,165,0.3) 100%)",
      color: "#dc2626",
      icon: <Cancel />,
      avatar: "linear-gradient(135deg, #dc2626 0%, #f87171 100%)",
      border: alpha("#ef4444", 0.18),
    },
    New: {
      bg: "linear-gradient(135deg, rgba(34,197,94,0.14) 0%, rgba(134,239,172,0.3) 100%)",
      color: "#15803d",
      icon: <Add />,
      avatar: "linear-gradient(135deg, #16a34a 0%, #4ade80 100%)",
      border: alpha("#22c55e", 0.18),
    },
  };
  return colorMap[status] || {
    bg: "linear-gradient(135deg, rgba(37,99,235,0.16) 0%, rgba(191,219,254,0.3) 100%)",
    color: PRIMARY_COLOR,
    icon: <Pending />,
    avatar: GRADIENT_BLUE,
    border: alpha(PRIMARY_COLOR, 0.18),
  };
};

const getRoleColor = (role) => {
  const config = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.TEAM;
  return { bg: `${config.color}15`, color: config.color, icon: config.icon };
};

const formatDate = (dateString, formatStr = "MMM dd, yyyy hh:mm a") => {
  if (!dateString) return "Not set";
  try {
    const parsedDate = parseISO(dateString);
    return isValid(parsedDate) ? format(parsedDate, formatStr) : "Invalid date";
  } catch { return "Invalid date"; }
};

const toDateInputValue = (date) => {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const getPeriodDateRange = (period) => {
  const now = new Date();
  const end = new Date(now);

  if (period === "All") {
    return {}; // no date filter — intentional
  }

  if (period === "This Week") {
    const start = new Date(now);
    const day = start.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    start.setDate(start.getDate() + diff);
    return { fromDate: toDateInputValue(start), toDate: toDateInputValue(end) };
  }

  if (period === "This Month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { fromDate: toDateInputValue(start), toDate: toDateInputValue(end) };
  }

  // Fallback to a one-day window for explicit "Today" or unexpected values.
  return { fromDate: toDateInputValue(now), toDate: toDateInputValue(now) };
};

const formatTimelineValue = (value) => {
  if (!value || value === "Empty") return "Empty";
  return value;
};

const buildTimelineStageDetails = (timeline) => {
  const snapshot = timeline?.snapshot || {};
  const changeMap = (timeline?.changes || []).reduce((acc, change) => {
    if (change?.field) acc[change.field] = change.newValue;
    return acc;
  }, {});

  const pick = (key, fallback = null) => {
    if (snapshot[key] !== undefined && snapshot[key] !== null && snapshot[key] !== "") {
      return snapshot[key];
    }
    if (changeMap[key] !== undefined && changeMap[key] !== null && changeMap[key] !== "") {
      return changeMap[key];
    }
    return fallback;
  };

  const toDetail = (label, value) => {
    if (value === undefined || value === null || value === "" || value === "Not set" || value === "Empty") {
      return null;
    }
    return { label, value };
  };

  const stageDetails = {
    Visit: [
      toDetail("Visit status", pick("visitStatus", timeline?.stage === "Visit" ? "Pending" : null)),
      toDetail("Visit date", pick("visitDate") ? formatDate(pick("visitDate"), "dd MMM yyyy") : formatDate(timeline?.updatedAt, "dd MMM yyyy")),
    ].filter(Boolean),
    Registration: [
      toDetail("Registration status", pick("registrationStatus")),
      toDetail("Registration date", pick("dateOfRegistration") ? formatDate(pick("dateOfRegistration"), "dd MMM yyyy") : formatDate(timeline?.updatedAt, "dd MMM yyyy")),
    ].filter(Boolean),
    "Bank Loan Apply": [
      toDetail("Loan status", pick("loanStatus")),
      toDetail("Loan date", pick("loanApprovalDate") ? formatDate(pick("loanApprovalDate"), "dd MMM yyyy") : formatDate(timeline?.updatedAt, "dd MMM yyyy")),
    ].filter(Boolean),
    "Document Submission": [
      toDetail("Document status", pick("documentStatus")),
      toDetail("Document date", pick("documentSubmissionDate") ? formatDate(pick("documentSubmissionDate"), "dd MMM yyyy") : formatDate(timeline?.updatedAt, "dd MMM yyyy")),
    ].filter(Boolean),
    "Bank at Pending": [
      toDetail("Bank status", pick("bankAtPendingStatus")),
      toDetail("Bank date", pick("bankAtPendingDate") ? formatDate(pick("bankAtPendingDate"), "dd MMM yyyy") : formatDate(timeline?.updatedAt, "dd MMM yyyy")),
    ].filter(Boolean),
    Disbursement: [
      toDetail("Disbursement status", pick("disbursementStatus")),
      toDetail("Disbursement date", pick("disbursementDate") ? formatDate(pick("disbursementDate"), "dd MMM yyyy") : formatDate(timeline?.updatedAt, "dd MMM yyyy")),
    ].filter(Boolean),
    "Installation Completion": [
      toDetail("Installation status", pick("installationStatus")),
      toDetail("Installation date", pick("installationDate") ? formatDate(pick("installationDate"), "dd MMM yyyy") : formatDate(timeline?.updatedAt, "dd MMM yyyy")),
    ].filter(Boolean),
  };

  return stageDetails[timeline?.stage] || [];
};

const getAssignedPerson = (lead) => {
  const person = lead?.assignedUser || lead?.assignedManager;
  if (!person) return null;

  if (typeof person === "string") {
    return {
      name: "Assigned",
      role: lead?.assignedUser ? "User" : "Manager",
      initial: "A",
    };
  }

  const name =
    `${person.firstName || ""} ${person.lastName || ""}`.trim() ||
    person.email ||
    person.phone ||
    "Assigned";

  return {
    name,
    role: person.role || (lead?.assignedUser ? "User" : "Manager"),
    initial: name.charAt(0),
  };
};

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validatePhone = (phone) => /^[0-9]{10}$/.test(phone.replace(/\D/g, ""));
const formatDateTimeLocalValue = (value) => {
  if (!value) return "";
  try {
    const date = typeof value === "string" ? parseISO(value) : new Date(value);
    if (!isValid(date)) return "";
    const pad = (num) => String(num).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  } catch {
    return "";
  }
};

const handleDownload = (url, filename) => {
  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.download = filename || "document";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

const gradientIconBoxSx = {
  width: { xs: 44, sm: 52 },
  height: { xs: 44, sm: 52 },
  borderRadius: 2.5,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "1px solid rgba(255,255,255,0.22)",
  boxShadow: "0 12px 28px rgba(15,31,61,0.18)",
  flexShrink: 0,
};

const getModalSectionSx = (isDark) => ({
  p: 2.5,
  borderRadius: 3,
  border: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${alpha(PRIMARY_COLOR, 0.16)}`,
  background: isDark ? "#111c30" : GRADIENT_CARD,
  boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.3)" : "inset 0 1px 0 rgba(255,255,255,0.72)",
});

const getFieldSx = (isDark) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: 2,
    bgcolor: isDark ? "#172338" : "#f8fafd",
    color: isDark ? "#f8fafc" : "#1e293b",
    "& input, & textarea": {
      color: isDark ? "#f8fafc" : "#1e293b",
    },
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)",
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: PRIMARY_COLOR,
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: PRIMARY_COLOR,
    },
  },
  "& .MuiInputLabel-root": {
    color: isDark ? "#94a3b8" : "text.secondary",
    "&.Mui-focused": { color: PRIMARY_COLOR },
  },
  "& .MuiFormHelperText-root": {
    color: isDark ? "#94a3b8" : "text.secondary",
  },
});

const modalSectionSx = {
  p: 2.5,
  borderRadius: 3,
  border: `1px solid ${alpha(PRIMARY_COLOR, 0.16)}`,
  background: GRADIENT_CARD,
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.72)",
};

const getTableHeaderCellSx = (isDark) => ({
  background: isDark ? "#090f1d" : "linear-gradient(180deg, #f8faff, #f0f6ff)",
  fontWeight: 700,
  fontSize: "0.78rem",
  letterSpacing: ".05em",
  textTransform: "uppercase",
  color: isDark ? "#64748b" : "#5f6b80",
  borderBottom: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : `1px solid ${alpha(PRIMARY_COLOR, 0.1)}`,
});

// ========== SHARED MODAL HEADER ==========
const ModalHeader = ({ icon, title, subtitle, color = PRIMARY_COLOR, onClose, iconGradient = GRADIENT_BLUE }) => (
  <Box
    sx={{
      position: "relative",
      background: `linear-gradient(135deg, ${SECONDARY_COLOR} 0%, ${color} 100%)`,
      px: { xs: 2.5, sm: 3.5 },
      pt: { xs: 2.5, sm: 3 },
      pb: { xs: 3, sm: 3.5 },
      overflow: "hidden",
      "&::before": {
        content: '""', position: "absolute", top: -40, right: -40,
        width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,0.08)",
      },
      "&::after": {
        content: '""', position: "absolute", bottom: -20, left: "30%",
        width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.05)",
      },
    }}
  >
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative", zIndex: 1 }}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Box sx={{ ...gradientIconBoxSx, background: iconGradient, backdropFilter: "blur(10px)" }}>
          {React.cloneElement(icon, { sx: { color: "#fff", fontSize: { xs: 22, sm: 26 } } })}
        </Box>
        <Box>
          <Typography variant="h6" fontWeight={700} color="#fff"
            sx={{ fontSize: { xs: "1rem", sm: "1.15rem" }, lineHeight: 1.2 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.78)", fontSize: { xs: "0.7rem", sm: "0.75rem" } }}>
              {subtitle}
            </Typography>
          )}
        </Box>
      </Stack>
      <IconButton onClick={onClose} size="small" sx={{
        color: "rgba(255,255,255,0.85)", bgcolor: "rgba(255,255,255,0.12)",
        "&:hover": { bgcolor: "rgba(255,255,255,0.22)" }, width: 32, height: 32,
      }}>
        <Close fontSize="small" />
      </IconButton>
    </Box>
  </Box>
);

// ========== REUSABLE COMPONENTS ==========
const MobileFilterDrawer = ({
  open, onClose, period, setPeriod, statusFilter, setStatusFilter,
  handleClearFilters, searchQuery, setSearchQuery, activeFilterCount,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [expandedSection, setExpandedSection] = useState("search");
  const toggleSection = (section) => setExpandedSection(expandedSection === section ? null : section);

  return (
    <SwipeableDrawer anchor="bottom" open={open} onClose={onClose} onOpen={() => {}}
      disableSwipeToOpen={false}
      PaperProps={{
        sx: {
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          maxHeight: "90vh",
          overflow: "hidden",
          bgcolor: isDark ? "#0e1626" : "#ffffff",
          backgroundImage: "none",
        },
      }}>
      <Box sx={{ position: "relative" }}>
        <Box sx={{ width: 40, height: 4, bgcolor: isDark ? "rgba(255,255,255,0.2)" : "grey.300", borderRadius: 2, mx: "auto", my: 1.5 }} />
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: 3, pb: 2, borderBottom: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${alpha(PRIMARY_COLOR, 0.1)}` }}>
          <Box>
            <Typography variant="h6" fontWeight="700" color={PRIMARY_COLOR}>Filter Leads</Typography>
            <Typography variant="caption" color="text.secondary">{activeFilterCount} active filter{activeFilterCount !== 1 && "s"}</Typography>
          </Box>
          <IconButton onClick={onClose} size="small" sx={{ bgcolor: isDark ? "rgba(255,255,255,0.06)" : alpha(PRIMARY_COLOR, 0.1), color: isDark ? "#94a3b8" : "inherit" }}><Close /></IconButton>
        </Box>
        <Box sx={{ maxHeight: "calc(90vh - 120px)", overflow: "auto", p: 3 }}>
          <Stack spacing={2.5}>
            {[
              { key: "search", label: "Search", icon: <Search sx={{ color: PRIMARY_COLOR, fontSize: 20 }} />, content: (
                <TextField fullWidth size="small" placeholder="Search by name, email, phone..." value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ color: "text.secondary", fontSize: 20 }} /></InputAdornment>,
                    endAdornment: searchQuery && <InputAdornment position="end"><IconButton size="small" onClick={() => setSearchQuery("")}><Close fontSize="small" /></IconButton></InputAdornment> }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 999,
                      bgcolor: isDark ? "#172338" : "#fff",
                      color: isDark ? "#f8fafc" : "#1e293b",
                      "& input": { color: isDark ? "#f8fafc" : "#1e293b" },
                      "& .MuiOutlinedInput-notchedOutline": { borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)" },
                      transition: "box-shadow .2s ease, border-color .2s ease",
                      "&.Mui-focused": { boxShadow: FOCUS_RING },
                    },
                  }} />
              )},
              { key: "period", label: "Time Period", icon: <DateRange sx={{ color: PRIMARY_COLOR, fontSize: 20 }} />, content: (
                <Grid container spacing={1}>
                  {PERIOD_OPTIONS.map((option) => (
                    <Grid item xs={6} key={option.value}>
                      <Button fullWidth variant="text" onClick={() => setPeriod(option.value)} startIcon={option.icon} size="small"
                        sx={{
                          borderRadius: 999,
                          border: `1px solid ${period === option.value ? "transparent" : isDark ? "rgba(255,255,255,0.1)" : alpha(PRIMARY_COLOR, 0.16)}`,
                          background: period === option.value ? GRADIENT_BLUE : isDark ? "#172338" : "#fff",
                          color: period === option.value ? "#fff" : isDark ? "#94a3b8" : PRIMARY_COLOR,
                          boxShadow: period === option.value ? "0 12px 24px rgba(37,99,235,0.18)" : "none",
                        }}>
                        {option.label}
                      </Button>
                    </Grid>
                  ))}
                </Grid>
              )},
              { key: "status", label: "Lead Status", icon: <FilterAlt sx={{ color: PRIMARY_COLOR, fontSize: 20 }} />, content: (
                <FormControl fullWidth size="small">
                  <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} displayEmpty
                    sx={{
                      borderRadius: 2,
                      bgcolor: isDark ? "#172338" : "#fff",
                      color: isDark ? "#f8fafc" : "#1e293b",
                      "& .MuiOutlinedInput-notchedOutline": { borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)" },
                      "& .MuiSelect-icon": { color: isDark ? "#94a3b8" : "inherit" },
                    }}>
                    <MenuItem value="all">All Statuses</MenuItem>
                    {LEAD_STATUS_OPTIONS.map((status) => (
                      <MenuItem key={status} value={status}>
                        <Stack direction="row" alignItems="center" spacing={1}>{getStatusColor(status).icon}<span>{status}</span></Stack>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )},
            ].map(({ key, label, icon, content }) => (
              <Paper key={key} elevation={0} sx={{ border: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${alpha(PRIMARY_COLOR, 0.1)}`, borderRadius: 2, overflow: "hidden", bgcolor: isDark ? "#111c30" : "inherit" }}>
                <Box sx={{ p: 2, bgcolor: isDark ? "#172338" : alpha(PRIMARY_COLOR, 0.02), display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }} onClick={() => toggleSection(key)}>
                  <Stack direction="row" spacing={1} alignItems="center">{icon}<Typography variant="subtitle2" fontWeight={600} color={isDark ? "#f8fafc" : "inherit"}>{label}</Typography></Stack>
                  {expandedSection === key ? <ExpandLess /> : <ExpandMore />}
                </Box>
                <Collapse in={expandedSection === key}><Box sx={{ p: 2 }}>{content}</Box></Collapse>
              </Paper>
            ))}
          </Stack>
        </Box>
        <Box sx={{ p: 3, borderTop: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${alpha(PRIMARY_COLOR, 0.1)}`, bgcolor: isDark ? "#0e1626" : "#fff" }}>
          <Stack direction="row" spacing={2}>
            <Button fullWidth variant="outlined" onClick={() => { handleClearFilters(); onClose(); }} startIcon={<Clear />}
              sx={{ borderColor: isDark ? "rgba(255,255,255,0.18)" : PRIMARY_COLOR, color: isDark ? "#94a3b8" : PRIMARY_COLOR }}>Clear All</Button>
            <Button fullWidth variant="contained" onClick={onClose} sx={{ background: GRADIENT_BLUE, boxShadow: "0 12px 24px rgba(37,99,235,0.2)", "&:hover": { background: GRADIENT_BLUE } }}>Apply Filters</Button>
          </Stack>
        </Box>
      </Box>
    </SwipeableDrawer>
  );
};

const LoadingSkeleton = ({ count = 5, isMobile = false }) => (
  <Box>{Array.from({ length: count }).map((_, index) => (
    <Skeleton key={index} variant="rectangular" height={isMobile ? 80 : 70} sx={{ mb: 2, borderRadius: 2 }} />
  ))}</Box>
);

const EmptyState = ({ title, description, icon: Icon = Person, action }) => (
  <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={8} px={2}>
    <Box sx={{ width: 120, height: 120, borderRadius: "50%", bgcolor: alpha(PRIMARY_COLOR, 0.1), display: "flex", alignItems: "center", justifyContent: "center", mb: 3 }}>
      <Icon sx={{ fontSize: 60, color: PRIMARY_COLOR }} />
    </Box>
    <Typography variant="h6" color="text.secondary" gutterBottom align="center">{title}</Typography>
    <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3, maxWidth: 400 }}>{description}</Typography>
    {action}
  </Box>
);

const RoleBadge = ({ role }) => {
  const config = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.TEAM;
  return (
    <Chip icon={config.icon} label={config.label} size="small"
      sx={{
        background: "linear-gradient(135deg, rgba(37,99,235,0.12) 0%, rgba(96,165,250,0.24) 100%)",
        color: config.color,
        fontWeight: 700,
        border: `1px solid ${alpha(config.color, 0.12)}`,
        "& .MuiChip-icon": { color: config.color },
      }} />
  );
};

const PermissionIndicator = ({ permission, label }) => (
  <Box display="flex" alignItems="center" gap={1}>
    {permission ? <CheckCircle sx={{ color: "#4caf50", fontSize: 16 }} /> : <Cancel sx={{ color: "#f44336", fontSize: 16 }} />}
    <Typography variant="caption" color="text.secondary">{label}</Typography>
  </Box>
);

const InfoRow = ({ label, value, icon, subValue, action, chip, chipColor }) => (
  <Box display="flex" alignItems="center" justifyContent="space-between" gap={2}>
    <Box display="flex" alignItems="center" gap={2} flex={1}>
      <Box sx={{ color: "primary.main", minWidth: 24 }}>{icon}</Box>
      <Box sx={{ flex: 1 }}>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
        {chip ? (
          <Chip label={value} size="small" sx={{ background: chipColor?.bg, color: chipColor?.color, fontWeight: 700, mt: 0.5, border: `1px solid ${chipColor?.border || alpha(chipColor?.color || PRIMARY_COLOR, 0.14)}` }} />
        ) : (
          <Typography variant="body1" fontWeight={500}>{value}</Typography>
        )}
        {subValue && <Box sx={{ mt: 0.5 }}>{subValue}</Box>}
      </Box>
    </Box>
    {action && <Box>{action}</Box>}
  </Box>
);

const DocumentCard = ({ title, url, icon, filename }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  return (
    <Card variant="outlined" sx={{ p: 2, borderRadius: 2.5, background: isDark ? "#172338" : GRADIENT_CARD, borderColor: isDark ? "rgba(255,255,255,0.08)" : alpha(PRIMARY_COLOR, 0.14) }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
        {icon}<Typography variant="body2" fontWeight={600} noWrap color={isDark ? "#f8fafc" : "inherit"}>{title}</Typography>
      </Box>
      <Button fullWidth size="small" variant="outlined" startIcon={<OpenInNew />} onClick={() => handleDownload(url, filename || title)} sx={{ borderColor: isDark ? "rgba(255,255,255,0.18)" : alpha(PRIMARY_COLOR, 0.2), color: PRIMARY_COLOR }}>
        View Document
      </Button>
    </Card>
  );
};

const LeadActionMenu = ({
  lead,
  permissions,
  onEdit,
  onQuickView,
  onViewDetails,
  onCreateQuote,
  onAssign,
  onConvertToProject,
  onViewVisitPipeline,
  onUnsupportedAction,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const closeMenu = () => setAnchorEl(null);

  const runAction = (handler) => {
    closeMenu();
    handler?.(lead);
  };

  const menuItemSx = {
    gap: 1.25,
    minHeight: 42,
    px: 2.25,
    color: isDark ? "#cbd5e1" : "#5f6b80",
    fontSize: "0.92rem",
    "&:hover": { bgcolor: isDark ? "rgba(255,255,255,0.06)" : alpha(PRIMARY_COLOR, 0.04) },
    "& .MuiSvgIcon-root": {
      fontSize: 18,
      color: PRIMARY_COLOR,
    },
  };

  return (
    <>
      <Tooltip title="Actions">
        <IconButton
          size="small"
          onClick={(event) => {
            event.stopPropagation();
            setAnchorEl(event.currentTarget);
          }}
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            bgcolor: open ? alpha(PRIMARY_COLOR, 0.12) : isDark ? "rgba(255,255,255,0.06)" : alpha("#64748b", 0.08),
            color: isDark ? "#e2e8f0" : "#0f172a",
            "&:hover": { bgcolor: alpha(PRIMARY_COLOR, 0.12) },
          }}
        >
          <MoreVert fontSize="small" />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={closeMenu}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          elevation: 0,
          sx: {
            mt: 0.5,
            minWidth: 224,
            borderRadius: 3,
            border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #eef2f7",
            bgcolor: isDark ? "#0e1626" : "#ffffff",
            backgroundImage: "none",
            boxShadow: isDark ? "0 18px 40px rgba(0,0,0,0.5)" : "0 18px 40px rgba(15, 23, 42, 0.12)",
            overflow: "hidden",
            py: 1,
          },
        }}
      >
        <MenuItem sx={menuItemSx} onClick={() => runAction(onQuickView)}>
          <Visibility />
          Quick View
        </MenuItem>
        <MenuItem sx={menuItemSx} onClick={() => runAction(onViewDetails)}>
          <OpenInNew />
          View Details
        </MenuItem>
        <MenuItem sx={menuItemSx} onClick={() => runAction(onViewVisitPipeline)}>
          <CalendarToday />
          Visit Pipeline
        </MenuItem>
        <MenuItem sx={menuItemSx} onClick={() => runAction(onCreateQuote)}>
          <Description />
          Create Quote
        </MenuItem>
        <MenuItem sx={menuItemSx} onClick={() => runAction(onConvertToProject)}>
          <Assignment />
          {lead?.isProject ? "Open Project" : "Convert to Project"}
        </MenuItem>

        {permissions.assign && (
          <Box sx={{ borderTop: "1px solid #eef2f7", mt: 0.75, pt: 0.75 }}>
            <MenuItem sx={menuItemSx} onClick={() => runAction(onAssign)}>
              <AssignmentInd />
              Assign Agent
            </MenuItem>
          </Box>
        )}

        <Box sx={{ borderTop: "1px solid #eef2f7", mt: 0.75, pt: 0.75 }}>
          <MenuItem sx={menuItemSx} onClick={() => runAction(() => onUnsupportedAction("Mark as Duplicate"))}>
            <ContentCopy />
            Mark as Duplicate
          </MenuItem>
          <MenuItem
            sx={{
              ...menuItemSx,
              "& .MuiSvgIcon-root": { fontSize: 18, color: "#ef4444" },
            }}
            onClick={() => runAction(() => onUnsupportedAction("Mark as Junk"))}
          >
            <ErrorOutline />
            Mark as Junk
          </MenuItem>
          <MenuItem sx={menuItemSx} onClick={() => runAction(() => onUnsupportedAction("Not Interested"))}>
            <PersonRemove />
            Not Interested
          </MenuItem>
        </Box>
      </Menu>
    </>
  );
};

const MobileLeadCard = ({ lead, onView, onEdit, onAssign, onDelete, onConvertToProject, permissions }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [expanded, setExpanded] = useState(false);
  const statusColor = getStatusColor(lead.status);
  const initials = `${lead.firstName?.[0] || ""}${lead.lastName?.[0] || ""}`;

  const handleDeleteClick = () => {
    if (window.confirm(`Are you sure you want to delete ${lead.firstName} ${lead.lastName}?`)) onDelete(lead._id);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        mb: 1.5,
        borderRadius: 3,
        border: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : `1px solid ${alpha(PRIMARY_COLOR, 0.1)}`,
        bgcolor: isDark ? "#0e1526" : "#ffffff",
        color: isDark ? "#f8fafc" : "inherit",
        overflow: "hidden",
        boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.35)" : "0 2px 10px rgba(37,99,235,0.05)",
        transition: "all 0.2s ease-in-out",
        "&:hover": {
          borderColor: isDark ? "rgba(96, 165, 250, 0.35)" : alpha(PRIMARY_COLOR, 0.25),
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
          <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
            <Avatar sx={{ background: statusColor.avatar, color: "#fff", width: 48, height: 48, fontWeight: 700, boxShadow: isDark ? "0 4px 14px rgba(0,0,0,0.4)" : "0 10px 20px rgba(37,99,235,0.18)" }}>{initials}</Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight="700" sx={{ color: isDark ? "#f8fafc" : PRIMARY_COLOR }}>{lead.firstName} {lead.lastName}</Typography>
              <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "text.secondary" }}>ID: {lead._id?.slice(-8) || "N/A"}</Typography>
            </Box>
          </Box>
          <IconButton size="small" onClick={() => setExpanded(!expanded)} sx={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.3s", bgcolor: isDark ? "rgba(59, 130, 246, 0.15)" : alpha(PRIMARY_COLOR, 0.1), color: isDark ? "#60a5fa" : PRIMARY_COLOR }}>
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>
        <Grid container spacing={1} sx={{ mb: 1.5 }}>
          <Grid item xs={6}><Stack direction="row" spacing={0.5} alignItems="center"><Phone sx={{ fontSize: 14, color: isDark ? "#60a5fa" : alpha(PRIMARY_COLOR, 0.6) }} /><Typography variant="caption" sx={{ color: isDark ? "#cbd5e1" : "text.secondary" }} noWrap>{lead.phone || "No phone"}</Typography></Stack></Grid>
          <Grid item xs={6}><Stack direction="row" spacing={0.5} alignItems="center"><Email sx={{ fontSize: 14, color: isDark ? "#60a5fa" : alpha(PRIMARY_COLOR, 0.6) }} /><Typography variant="caption" sx={{ color: isDark ? "#cbd5e1" : "text.secondary" }} noWrap>{lead.email || "No email"}</Typography></Stack></Grid>
        </Grid>
        <Box sx={{ mb: 1.5 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
            <CalendarToday sx={{ fontSize: 14, color: isDark ? "#60a5fa" : alpha(PRIMARY_COLOR, 0.6) }} />
            <Typography variant="body2" fontWeight={500} sx={{ color: isDark ? "#e2e8f0" : "inherit" }}>{formatDate(lead.createdAt, "dd MMM yyyy")}</Typography>
          </Stack>
        </Box>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Chip label={lead.status} icon={statusColor.icon} size="small" sx={{ background: isDark ? (lead.status === "Missed Leads" ? "rgba(239, 68, 68, 0.2)" : "rgba(37, 99, 235, 0.2)") : statusColor.bg, color: isDark ? (lead.status === "Missed Leads" ? "#fca5a5" : "#93c5fd") : statusColor.color, fontWeight: 700, height: 24, fontSize: "0.7rem", border: `1px solid ${isDark ? (lead.status === "Missed Leads" ? "rgba(239, 68, 68, 0.4)" : "rgba(59, 130, 246, 0.4)") : statusColor.border}`, "& .MuiChip-icon": { fontSize: 14, color: isDark ? (lead.status === "Missed Leads" ? "#fca5a5" : "#93c5fd") : statusColor.color } }} />
        </Box>
        <Collapse in={expanded}>
          <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : alpha(PRIMARY_COLOR, 0.1)}` }}>
            {(() => {
              const assignedPerson = getAssignedPerson(lead);
              return assignedPerson ? (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "text.secondary" }} display="block">Assigned To</Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Avatar sx={{ width: 24, height: 24, fontSize: 12, background: GRADIENT_BLUE, color: "#fff" }}>{assignedPerson.initial}</Avatar>
                    <Typography variant="body2" sx={{ color: isDark ? "#f8fafc" : "inherit" }}>{assignedPerson.name}</Typography>
                    <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "text.secondary" }}>({assignedPerson.role})</Typography>
                  </Box>
                </Box>
              ) : permissions.assign ? (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "text.secondary" }} display="block">Assigned To</Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => onAssign(lead)}
                    sx={{
                      mt: 0.75,
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 2,
                      borderStyle: "dashed",
                      borderColor: isDark ? "rgba(96, 165, 250, 0.6)" : alpha(PRIMARY_COLOR, 0.45),
                      color: isDark ? "#60a5fa" : PRIMARY_COLOR,
                      fontWeight: 600,
                      textTransform: "none",
                      "&:hover": {
                        borderStyle: "dashed",
                        borderColor: isDark ? "#60a5fa" : PRIMARY_COLOR,
                        bgcolor: isDark ? "rgba(59, 130, 246, 0.1)" : alpha(PRIMARY_COLOR, 0.05),
                      },
                    }}
                  >
                    + Assign
                  </Button>
                </Box>
              ) : null;
            })()}
            <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: "wrap", gap: 1 }}>
              <Button fullWidth size="small" variant="contained" startIcon={<Visibility sx={{ ml: 1 }} />} onClick={() => onView(lead)} sx={{ background: isDark ? "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)" : GRADIENT_DARK, "&:hover": { background: isDark ? "linear-gradient(135deg, #334155 0%, #1e293b 100%)" : GRADIENT_DARK }, border: isDark ? "1px solid rgba(255,255,255,0.12)" : "none", color: "#fff", flex: 1, minWidth: "90px" }} />
              {permissions.edit && (<Button fullWidth size="small" variant="contained" startIcon={<Edit sx={{ ml: 1 }} />} onClick={() => onEdit(lead)} sx={{ background: isDark ? "rgba(37, 99, 235, 0.25)" : "linear-gradient(135deg, #dbeafe 0%, #93c5fd 100%)", color: isDark ? "#93c5fd" : "#1d4ed8", border: isDark ? "1px solid rgba(59, 130, 246, 0.35)" : "none", flex: 1, minWidth: "90px" }} />)}
              <Button fullWidth size="small" variant="outlined" startIcon={<Assignment sx={{ ml: 1 }} />} onClick={() => onConvertToProject(lead)} sx={{ borderColor: isDark ? "rgba(59, 130, 246, 0.5)" : PRIMARY_COLOR, color: isDark ? "#60a5fa" : PRIMARY_COLOR, "&:hover": { borderColor: isDark ? "#60a5fa" : PRIMARY_COLOR, bgcolor: isDark ? "rgba(59, 130, 246, 0.1)" : alpha(PRIMARY_COLOR, 0.05) }, flex: 1, minWidth: "100px" }}>
                {lead?.isProject ? "Open Project" : "Convert"}
              </Button>
              {permissions.assign && (<Button fullWidth size="small" variant="outlined" startIcon={<AssignmentInd sx={{ ml: 1 }} />} onClick={() => onAssign(lead)} sx={{ borderColor: isDark ? "rgba(59, 130, 246, 0.5)" : PRIMARY_COLOR, color: isDark ? "#60a5fa" : PRIMARY_COLOR, "&:hover": { borderColor: isDark ? "#60a5fa" : PRIMARY_COLOR, bgcolor: isDark ? "rgba(59, 130, 246, 0.1)" : alpha(PRIMARY_COLOR, 0.05) }, flex: 1, minWidth: "90px" }} />)}
              {permissions.delete && (<Button fullWidth size="small" variant="outlined" color="error" startIcon={<Delete sx={{ ml: 1 }} />} onClick={handleDeleteClick} sx={{ borderColor: isDark ? "rgba(239, 68, 68, 0.6)" : "#f44336", color: isDark ? "#f87171" : "#f44336", "&:hover": { borderColor: "#ef4444", bgcolor: isDark ? "rgba(239, 68, 68, 0.1)" : alpha("#ef4444", 0.05) }, flex: 1, minWidth: "90px" }} />)}
            </Stack>
          </Box>
        </Collapse>
      </Box>
    </Paper>
  );
};

// ========== REDESIGNED MODAL COMPONENTS ==========

// ---- VIEW LEAD MODAL ----
const ViewLeadModal = React.memo(({ open, onClose, lead, userRole }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { fetchAPI } = useAuth();

  const [loading, setLoading] = useState(false);
  const [leadDetails, setLeadDetails] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [expandedTimelineStage, setExpandedTimelineStage] = useState(null);

  const permissions = ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS.TEAM;

  useEffect(() => {
    if (open && lead) { fetchLeadDetails(); }
    else { setLeadDetails(null); setError(null); setActiveTab(0); setExpandedTimelineStage(null); }
  }, [open, lead]);

  const fetchLeadDetails = async () => {
    if (!lead?._id) { setError("No lead selected"); return; }
    try {
      setLoading(true); setError(null);
      const response = await fetchAPI(`/lead/getLeadById/${lead._id}`);
      if (response.success) setLeadDetails(response.result);
      else throw new Error(response.message || "Failed to fetch lead details");
    } catch (error) {
      setError(error.message || "Failed to load lead details");
    } finally { setLoading(false); }
  };

  const availableTabs = [
    { label: "Basic Info", icon: <Person /> },
    { label: "Visit Info", icon: <CalendarToday /> },
    { label: "Registration", icon: <HowToReg /> },
    { label: "Loan Info", icon: <AccountBalance /> },
    { label: "Documents", icon: <FolderOpen /> },
    { label: "Bank", icon: <LocalAtm /> },
    { label: "Disbursement", icon: <AccountBalance /> },
    { label: "Installation", icon: <Build /> },
    { label: "Timeline", icon: <Timeline /> },
  ].filter((tab, i) => {
    if (userRole === "TEAM" && (i === 3 || i === 5)) return false;
    return true;
  });

  const tabKeys = ["basic", "visit", "registration", "loan", "documents", "bank", "disbursement", "installation", "timeline"]
    .filter((_, i) => !(userRole === "TEAM" && (i === 3 || i === 5)));

  const activeTabKey = tabKeys[activeTab] || "basic";

  if (loading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth fullScreen={isMobile}
        PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3, overflow: "hidden" } }}>
        <ModalHeader icon={<Visibility />} title="Lead Details" subtitle="Loading..." color={PRIMARY_COLOR} onClose={onClose} />
        <DialogContent sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 300 }}>
          <Stack alignItems="center" spacing={2}>
            <CircularProgress sx={{ color: PRIMARY_COLOR }} />
            <Typography variant="body2" color="text.secondary">Loading lead details...</Typography>
          </Stack>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth fullScreen={isMobile}
        PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3, overflow: "hidden" } }}>
        <ModalHeader icon={<ErrorOutline />} title="Error" subtitle="Could not load lead" color="#c62828" onClose={onClose} />
        <DialogContent sx={{ p: 3 }}>
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>
          <Button onClick={fetchLeadDetails} variant="outlined" fullWidth sx={{ borderColor: PRIMARY_COLOR, color: PRIMARY_COLOR }}>Retry</Button>
        </DialogContent>
      </Dialog>
    );
  }

  if (!leadDetails) return null;

  const statusColor = getStatusColor(leadDetails.status);
  const orderedTimeline = [...(leadDetails.stageTimeline || [])].sort(
    (a, b) => new Date(a.updatedAt || 0) - new Date(b.updatedAt || 0)
  );
  const groupedTimeline = orderedTimeline.reduce((groups, entry) => {
    const existingGroup = groups.find((group) => group.stage === entry.stage);
    if (existingGroup) {
      existingGroup.entries.push(entry);
      existingGroup.latestUpdatedAt = entry.updatedAt;
      existingGroup.latestUpdatedBy = entry.updatedBy;
      existingGroup.latestUpdatedRole = entry.updatedRole;
    } else {
      groups.push({
        stage: entry.stage,
        entries: [entry],
        latestUpdatedAt: entry.updatedAt,
        latestUpdatedBy: entry.updatedBy,
        latestUpdatedRole: entry.updatedRole,
      });
    }
    return groups;
  }, []);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 3,
          maxHeight: "92vh",
          overflow: "hidden",
          bgcolor: isDark ? "#0e1626" : "#ffffff",
          backgroundImage: "none",
          boxShadow: isDark ? "0 24px 64px rgba(0,0,0,0.6)" : `0 24px 64px ${alpha(PRIMARY_COLOR, 0.18)}`,
        },
      }}
      TransitionComponent={isMobile ? Slide : Fade} transitionDuration={300}>

      <ModalHeader
        icon={<Visibility />}
        title={`${leadDetails.firstName} ${leadDetails.lastName}`}
        subtitle={`${leadDetails.email || "No email"} · ID: ${leadDetails._id?.slice(-8)}`}
        color={PRIMARY_COLOR}
        onClose={onClose}
      />

      {/* Status strip */}
      <Box sx={{
        px: 3,
        py: 1.5,
        bgcolor: isDark ? "#111c30" : "#fafbff",
        borderBottom: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${alpha(PRIMARY_COLOR, 0.08)}`,
        display: "flex",
        alignItems: "center",
        gap: 2,
        flexWrap: "wrap",
      }}>
        <Chip label={leadDetails.status} icon={statusColor.icon} size="small"
          sx={{ background: statusColor.bg, color: statusColor.color, fontWeight: 700, fontSize: "0.75rem", border: `1px solid ${statusColor.border}`, "& .MuiChip-icon": { color: statusColor.color } }} />
        {leadDetails.assignedUser && (
          <Stack direction="row" spacing={0.75} alignItems="center">
            <Typography variant="caption" color="text.secondary">Assigned to</Typography>
            <Avatar sx={{ width: 20, height: 20, fontSize: 10, background: GRADIENT_BLUE, color: "#fff" }}>{leadDetails.assignedUser.firstName?.[0]}</Avatar>
            <Typography variant="caption" fontWeight={600} color={isDark ? "#f8fafc" : "inherit"}>{leadDetails.assignedUser.firstName} {leadDetails.assignedUser.lastName}</Typography>
          </Stack>
        )}
        <Typography variant="caption" color="text.secondary" sx={{ ml: "auto" }}>
          Created {formatDate(leadDetails.createdAt, "dd MMM yyyy")}
        </Typography>
      </Box>

      <Box sx={{ borderBottom: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${alpha(PRIMARY_COLOR, 0.1)}`, bgcolor: isDark ? "#0e1626" : "#fff" }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant="scrollable" scrollButtons="auto"
          sx={{
            "& .MuiTab-root": {
              minHeight: { xs: 44, sm: 52 },
              fontSize: { xs: "0.72rem", sm: "0.8rem" },
              fontWeight: 600,
              textTransform: "none",
              color: isDark ? "#94a3b8" : "inherit",
            },
            "& .MuiTabs-indicator": { bgcolor: PRIMARY_COLOR, height: 3, borderRadius: "3px 3px 0 0" },
            "& .Mui-selected": { color: `${PRIMARY_COLOR} !important` },
          }}>
          {availableTabs.map((tab, i) => (
            <Tab key={i} icon={React.cloneElement(tab.icon, { sx: { fontSize: { xs: 16, sm: 18 } } })} label={tab.label} iconPosition="start" />
          ))}
        </Tabs>
      </Box>

      <DialogContent sx={{ p: { xs: 2, sm: 3 }, bgcolor: isDark ? "#0b101b" : "#fafbff", maxHeight: { xs: "calc(100vh - 260px)", sm: "55vh" }, overflow: "auto" }}>
        {/* Basic */}
        {activeTabKey === "basic" && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={getModalSectionSx(isDark)}>
                <Typography variant="subtitle2" fontWeight={700} color={PRIMARY_COLOR} sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}><Person fontSize="small" /> Personal Information</Typography>
                <Stack spacing={2}>
                  <InfoRow label="Full Name" value={`${leadDetails.firstName} ${leadDetails.lastName}`} icon={<AccountCircle sx={{ color: alpha(PRIMARY_COLOR, 0.6) }} />} />
                  <InfoRow label="Email" value={leadDetails.email || "Not set"} icon={<Email sx={{ color: alpha(PRIMARY_COLOR, 0.6) }} />} />
                  <InfoRow label="Phone" value={leadDetails.phone || "Not set"} icon={<Phone sx={{ color: alpha(PRIMARY_COLOR, 0.6) }} />} />
                  <InfoRow label="Address" value={leadDetails.address || "Not set"} icon={<Home sx={{ color: alpha(PRIMARY_COLOR, 0.6) }} />} />
                  <InfoRow label="Pincode" value={leadDetails.pincode || "Not set"} icon={<LocationOn sx={{ color: alpha(PRIMARY_COLOR, 0.6) }} />} />
                  <InfoRow label="Solar Requirement" value={leadDetails.solarRequirement || "Not set"} icon={<Build sx={{ color: alpha(PRIMARY_COLOR, 0.6) }} />} />
                </Stack>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={getModalSectionSx(isDark)}>
                <Typography variant="subtitle2" fontWeight={700} color={PRIMARY_COLOR} sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}><Timeline fontSize="small" /> Assignment & Status</Typography>
                <Stack spacing={2}>
                  <InfoRow label="Status" value={leadDetails.status} icon={statusColor.icon} chip chipColor={statusColor} />
                  <InfoRow label="Installation Status" value={leadDetails.installationStatus || "Not set"} icon={<Build sx={{ color: alpha(PRIMARY_COLOR, 0.6) }} />} />
                  {leadDetails.assignedManager && <InfoRow label="Assigned Manager" value={`${leadDetails.assignedManager.firstName} ${leadDetails.assignedManager.lastName}`} icon={<SupervisorAccount sx={{ color: alpha(PRIMARY_COLOR, 0.6) }} />} subValue={<RoleBadge role={leadDetails.assignedManager.role} />} />}
                  {leadDetails.assignedUser && <InfoRow label="Assigned To" value={`${leadDetails.assignedUser.firstName} ${leadDetails.assignedUser.lastName}`} icon={<AssignmentInd sx={{ color: alpha(PRIMARY_COLOR, 0.6) }} />} subValue={<RoleBadge role={leadDetails.assignedUser.role} />} />}
                  {leadDetails.createdBy && <InfoRow label="Created By" value={`${leadDetails.createdBy.firstName} ${leadDetails.createdBy.lastName}`} icon={<HowToReg sx={{ color: alpha(PRIMARY_COLOR, 0.6) }} />} subValue={<RoleBadge role={leadDetails.createdBy.role} />} />}
                </Stack>
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <Paper elevation={0} sx={getModalSectionSx(isDark)}>
                <Typography variant="subtitle2" fontWeight={700} color={PRIMARY_COLOR} sx={{ mb: 1.5, display: "flex", alignItems: "center", gap: 1 }}><Note fontSize="small" /> Notes</Typography>
                <Box sx={{ p: 2, borderRadius: 2.5, background: isDark ? "#172338" : GRADIENT_SOFT_BLUE, border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : alpha(PRIMARY_COLOR, 0.12)}` }}>
                  <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", color: leadDetails.notes ? (isDark ? "#f8fafc" : "text.primary") : "text.disabled" }}>
                    {leadDetails.notes || "No notes available"}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        )}

        {/* Visit */}
        {activeTabKey === "visit" && (
          <Paper elevation={0} sx={getModalSectionSx(isDark)}>
            <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
              <Typography variant="subtitle2" fontWeight={700} color={PRIMARY_COLOR} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CalendarToday fontSize="small" /> Visit Information
              </Typography>
              <Button
                size="small"
                variant="outlined"
                startIcon={<OpenInNew sx={{ fontSize: 15 }} />}
                onClick={() => {
                  onClose();
                  navigate("/total-visits", { state: { highlightLeadId: leadDetails?._id } });
                }}
                sx={{
                  borderRadius: 2,
                  borderColor: isDark ? "rgba(59, 130, 246, 0.4)" : alpha(PRIMARY_COLOR, 0.4),
                  color: isDark ? "#60a5fa" : PRIMARY_COLOR,
                  fontWeight: 700,
                  fontSize: "0.78rem",
                  textTransform: "none",
                  "&:hover": {
                    borderColor: isDark ? "#60a5fa" : PRIMARY_COLOR,
                    bgcolor: isDark ? "rgba(59, 130, 246, 0.1)" : alpha(PRIMARY_COLOR, 0.06),
                  },
                }}
              >
                Open Visit Pipeline
              </Button>
            </Box>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}><Stack spacing={2}>
                <InfoRow label="Visit Status" value={resolveVisitStatus(leadDetails)} icon={<CheckCircle sx={{ color: alpha(PRIMARY_COLOR, 0.6) }} />} />
                <InfoRow label="Visit Date" value={formatDate(leadDetails.visitDate)} icon={<Event sx={{ color: alpha(PRIMARY_COLOR, 0.6) }} />} />
                <InfoRow label="Visit Time" value={leadDetails.visitTime || "Not set"} icon={<AccessTime sx={{ color: alpha(PRIMARY_COLOR, 0.6) }} />} />
                <InfoRow label="Visit Location" value={leadDetails.visitLocation || "Not set"} icon={<LocationOn sx={{ color: alpha(PRIMARY_COLOR, 0.6) }} />} />
              </Stack></Grid>
              <Grid item xs={12} md={6}><InfoRow label="Visit Notes" value={leadDetails.visitNotes || "No notes available"} icon={<Note sx={{ color: alpha(PRIMARY_COLOR, 0.6) }} />} /></Grid>
            </Grid>
          </Paper>
        )}

        {/* Registration */}
        {activeTabKey === "registration" && (
          <Paper elevation={0} sx={getModalSectionSx(isDark)}>
            <Typography variant="subtitle2" fontWeight={700} color={PRIMARY_COLOR} sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}><HowToReg fontSize="small" /> Registration Information</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}><Stack spacing={2}>
                <InfoRow label="Registration Date" value={formatDate(leadDetails.dateOfRegistration)} icon={<Event sx={{ color: alpha(PRIMARY_COLOR, 0.6) }} />} />
                <InfoRow label="Registration Status" value={leadDetails.registrationStatus || "Pending"} icon={<CheckCircle sx={{ color: alpha(PRIMARY_COLOR, 0.6) }} />} chip chipColor={{ bg: isDark ? "rgba(37,99,235,0.18)" : alpha(PRIMARY_COLOR, 0.08), color: PRIMARY_COLOR }} />
                {leadDetails.uploadDocument?.url && <InfoRow label="Registration Document" value="View Document" icon={<AttachFile sx={{ color: alpha(PRIMARY_COLOR, 0.6) }} />} action={<Button size="small" variant="outlined" startIcon={<OpenInNew />} onClick={() => handleDownload(leadDetails.uploadDocument.url, "registration-document")} sx={{ borderColor: isDark ? "rgba(255,255,255,0.18)" : undefined }}>View</Button>} />}
              </Stack></Grid>
              <Grid item xs={12} md={6}><InfoRow label="Registration Notes" value={leadDetails.registrationNotes || "No notes available"} icon={<Note sx={{ color: alpha(PRIMARY_COLOR, 0.6) }} />} /></Grid>
            </Grid>
          </Paper>
        )}

        {/* Loan */}
        {activeTabKey === "loan" && (
          <Paper elevation={0} sx={getModalSectionSx(isDark)}>
            <Typography variant="subtitle2" fontWeight={700} color={PRIMARY_COLOR} sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}><AccountBalance fontSize="small" /> Loan Information</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}><Stack spacing={2}>
                <InfoRow label="Loan Amount" value={leadDetails.loanAmount ? `₹${leadDetails.loanAmount.toLocaleString()}` : "Not set"} icon={<Money sx={{ color: alpha(PRIMARY_COLOR, 0.6) }} />} />
                <InfoRow label="Bank" value={leadDetails.bank || "Not set"} icon={<AccountBalance sx={{ color: alpha(PRIMARY_COLOR, 0.6) }} />} />
                <InfoRow label="Branch Name" value={leadDetails.branchName || "Not set"} icon={<AccountBalance sx={{ color: alpha(PRIMARY_COLOR, 0.6) }} />} />
                <InfoRow label="Loan Status" value={leadDetails.loanStatus || "Not Applied"} icon={<CheckCircle sx={{ color: alpha(PRIMARY_COLOR, 0.6) }} />} chip chipColor={{ bg: isDark ? "rgba(37,99,235,0.18)" : alpha(PRIMARY_COLOR, 0.08), color: PRIMARY_COLOR }} />
              </Stack></Grid>
              <Grid item xs={12} md={6}><Stack spacing={2}>
                <InfoRow label="Loan Approval Date" value={formatDate(leadDetails.loanApprovalDate)} icon={<Event sx={{ color: alpha(PRIMARY_COLOR, 0.6) }} />} />
                <InfoRow label="Loan Notes" value={leadDetails.loanNotes || "No notes available"} icon={<Note sx={{ color: alpha(PRIMARY_COLOR, 0.6) }} />} />
              </Stack></Grid>
            </Grid>
          </Paper>
        )}

        {/* Documents */}
        {activeTabKey === "documents" && (
          <Paper elevation={0} sx={getModalSectionSx(isDark)}>
            <Typography variant="subtitle2" fontWeight={700} color={PRIMARY_COLOR} sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}><FolderOpen fontSize="small" /> Documents</Typography>
            <Grid container spacing={2}>
              {leadDetails.aadhaar?.url && <Grid item xs={12} sm={6} md={4}><DocumentCard title="Aadhaar Card" url={leadDetails.aadhaar.url} icon={<PictureAsPdf sx={{ color: "#f57c00" }} />} filename="aadhaar-card" /></Grid>}
              {leadDetails.panCard?.url && <Grid item xs={12} sm={6} md={4}><DocumentCard title="PAN Card" url={leadDetails.panCard.url} icon={<CreditCard sx={{ color: PRIMARY_COLOR }} />} filename="pan-card" /></Grid>}
              {leadDetails.passbook?.url && <Grid item xs={12} sm={6} md={4}><DocumentCard title="Bank Passbook" url={leadDetails.passbook.url} icon={<ReceiptLong sx={{ color: "#388e3c" }} />} filename="passbook" /></Grid>}
              {leadDetails.otherDocuments?.map((doc, i) => (
                <Grid item xs={12} sm={6} md={4} key={i}><DocumentCard title={doc.name || `Document ${i + 1}`} url={doc.url} icon={<PictureAsPdf sx={{ color: "#d32f2f" }} />} filename={doc.name} /></Grid>
              ))}
            </Grid>
            <Box sx={{ mt: 3 }}>
              <Stack spacing={2}>
                <InfoRow label="Document Status" value={leadDetails.documentStatus || "Pending"} icon={<CheckCircle sx={{ color: alpha(PRIMARY_COLOR, 0.6) }} />} chip chipColor={{ bg: isDark ? "rgba(37,99,235,0.18)" : alpha(PRIMARY_COLOR, 0.08), color: PRIMARY_COLOR }} />
                <InfoRow label="Document Submission Date" value={formatDate(leadDetails.documentSubmissionDate, "dd MMM yyyy, HH:mm:ss")} icon={<Event sx={{ color: alpha(PRIMARY_COLOR, 0.6) }} />} />
                <InfoRow label="Document Notes" value={leadDetails.documentNotes || "No notes available"} icon={<Note sx={{ color: alpha(PRIMARY_COLOR, 0.6) }} />} />
              </Stack>
            </Box>
          </Paper>
        )}

        {/* Bank */}
        {activeTabKey === "bank" && (
          <Paper elevation={0} sx={getModalSectionSx(isDark)}>
            <Typography variant="subtitle2" fontWeight={700} color={PRIMARY_COLOR} sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}><Pending fontSize="small" /> Bank at Pending</Typography>
            <Stack spacing={2}>
              <InfoRow label="Status" value={leadDetails.bankAtPendingStatus || "Pending"} icon={<CheckCircle sx={{ color: alpha(PRIMARY_COLOR, 0.6) }} />} chip chipColor={{ bg: isDark ? "rgba(37,99,235,0.18)" : alpha(PRIMARY_COLOR, 0.08), color: PRIMARY_COLOR }} />
              <InfoRow label="Date" value={formatDate(leadDetails.bankAtPendingDate)} icon={<Event sx={{ color: alpha(PRIMARY_COLOR, 0.6) }} />} />
              <InfoRow label="Reason" value={leadDetails.reason || "No reason provided"} icon={<Note sx={{ color: alpha(PRIMARY_COLOR, 0.6) }} />} />
              <InfoRow label="Notes" value={leadDetails.bankAtPendingNotes || "No notes available"} icon={<Note sx={{ color: alpha(PRIMARY_COLOR, 0.6) }} />} />
            </Stack>
          </Paper>
        )}

        {/* Disbursement */}
        {activeTabKey === "disbursement" && (
          <Paper elevation={0} sx={getModalSectionSx(isDark)}>
            <Typography variant="subtitle2" fontWeight={700} color={PRIMARY_COLOR} sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}><LocalAtm fontSize="small" /> Disbursement Information</Typography>
            <Stack spacing={2}>
              <InfoRow label="Disbursement Amount" value={leadDetails.disbursementAmount ? `₹${leadDetails.disbursementAmount.toLocaleString()}` : "Not set"} icon={<Money sx={{ color: alpha(PRIMARY_COLOR, 0.6) }} />} />
              <InfoRow label="Disbursement Date" value={formatDate(leadDetails.disbursementDate)} icon={<Event sx={{ color: alpha(PRIMARY_COLOR, 0.6) }} />} />
              <InfoRow label="Disbursement Status" value={leadDetails.disbursementStatus || "Pending"} icon={<CheckCircle sx={{ color: alpha(PRIMARY_COLOR, 0.6) }} />} chip chipColor={{ bg: isDark ? "rgba(37,99,235,0.18)" : alpha(PRIMARY_COLOR, 0.08), color: PRIMARY_COLOR }} />
              {leadDetails.disbursementBankDetails && <>
                <InfoRow label="Disbursement Bank" value={leadDetails.disbursementBankDetails.bank || "Not set"} icon={<AccountBalance sx={{ color: alpha(PRIMARY_COLOR, 0.6) }} />} />
                <InfoRow label="Disbursement Branch" value={leadDetails.disbursementBankDetails.branchName || "Not set"} icon={<AccountBalance sx={{ color: alpha(PRIMARY_COLOR, 0.6) }} />} />
              </>}
              <InfoRow label="Disbursement Notes" value={leadDetails.disbursementNotes || "No notes available"} icon={<Note sx={{ color: alpha(PRIMARY_COLOR, 0.6) }} />} />
            </Stack>
          </Paper>
        )}

        {/* Installation */}
        {activeTabKey === "installation" && (
          <Paper elevation={0} sx={getModalSectionSx(isDark)}>
            <Typography variant="subtitle2" fontWeight={700} color={PRIMARY_COLOR} sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}><Build fontSize="small" /> Installation Information</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}><Stack spacing={2}>
                <InfoRow label="Installation Date" value={formatDate(leadDetails.installationDate)} icon={<Event sx={{ color: alpha(PRIMARY_COLOR, 0.6) }} />} />
                <InfoRow label="Installation Status" value={leadDetails.installationStatus || "pending"} icon={<CheckCircle sx={{ color: alpha(PRIMARY_COLOR, 0.6) }} />} chip chipColor={{ bg: isDark ? "rgba(37,99,235,0.18)" : alpha(PRIMARY_COLOR, 0.08), color: PRIMARY_COLOR }} />
              </Stack></Grid>
              <Grid item xs={12} md={6}><InfoRow label="Installation Notes" value={leadDetails.installationNotes || "No notes available"} icon={<Note sx={{ color: alpha(PRIMARY_COLOR, 0.6) }} />} /></Grid>
            </Grid>
          </Paper>
        )}

        {/* Timeline */}
        {activeTabKey === "timeline" && (
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 2.5, border: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${alpha(PRIMARY_COLOR, 0.1)}`, bgcolor: isDark ? "#111c30" : "#fff" }}>
            <Typography variant="subtitle2" fontWeight={700} color={PRIMARY_COLOR} sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}><Timeline fontSize="small" /> Lead Timeline ({leadDetails.stageTimeline?.length || 0} updates)</Typography>
            {leadDetails.stageTimeline?.length > 0 ? (
              <List sx={{ maxHeight: 420, overflow: "auto" }}>
                {groupedTimeline.map((group, index) => {
                  const sc = getStatusColor(group.stage);
                  const isExpanded = expandedTimelineStage === group.stage;
                  return (
                    <ListItem key={index} sx={{ px: 0, py: 1.5, borderBottom: isDark ? "1px solid rgba(255,255,255,0.06)" : `1px solid ${alpha(PRIMARY_COLOR, 0.06)}`, alignItems: "flex-start" }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: sc.bg, color: sc.color, width: 36, height: 36 }}>{React.cloneElement(sc.icon, { sx: { fontSize: 18 } })}</Avatar>
                      </ListItemAvatar>
                      <Box sx={{ flex: 1 }}>
                        <Box
                          onClick={() => setExpandedTimelineStage(isExpanded ? null : group.stage)}
                          sx={{ cursor: "pointer", borderRadius: 2, p: 1, mx: -1, mt: -0.5, "&:hover": { bgcolor: isDark ? "rgba(255,255,255,0.04)" : alpha(PRIMARY_COLOR, 0.03) } }}
                        >
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1 }}>
                            <Box>
                              <Typography variant="body2" fontWeight={700} color={isDark ? "#f8fafc" : "inherit"}>{group.stage}</Typography>
                              <Typography variant="body2" sx={{ mt: 0.5, color: isDark ? "#cbd5e1" : "text.primary" }}>
                                {group.entries.length > 1 ? `${group.entries.length} updates in this stage` : group.entries[0]?.notes}
                              </Typography>
                            </Box>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Typography variant="caption" color="text.secondary">{formatDate(group.latestUpdatedAt, "dd MMM, HH:mm")}</Typography>
                              {isExpanded ? <ExpandLess sx={{ fontSize: 18, color: PRIMARY_COLOR }} /> : <ExpandMore sx={{ fontSize: 18, color: PRIMARY_COLOR }} />}
                            </Stack>
                          </Box>
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.75 }}>
                            Updated by: {group.latestUpdatedRole || "System"} • {group.latestUpdatedBy?.firstName || "System"}
                          </Typography>
                        </Box>
                        <Collapse in={isExpanded}>
                          <Box sx={{ pt: 1.25, display: "grid", gap: 1 }}>
                            {group.entries.map((timeline, entryIndex) => {
                              const stageDetails = buildTimelineStageDetails(timeline);
                              return (
                                <Box key={`${group.stage}-${timeline.updatedAt || entryIndex}`} sx={{ p: 1.25, borderRadius: 2.5, background: isDark ? "#172338" : GRADIENT_SOFT_BLUE, border: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${alpha(PRIMARY_COLOR, 0.12)}` }}>
                                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 1, mb: 1 }}>
                                    <Box>
                                      <Typography variant="body2" fontWeight={700} color={isDark ? "#f8fafc" : "inherit"}>{timeline.notes}</Typography>
                                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                                        Updated by: {timeline.updatedRole || "System"} • {timeline.updatedBy?.firstName || "System"}
                                      </Typography>
                                    </Box>
                                    <Typography variant="caption" color="text.secondary">{formatDate(timeline.updatedAt, "dd MMM, HH:mm")}</Typography>
                                  </Box>

                                  {stageDetails.length > 0 && (
                                    <Grid container spacing={1.25}>
                                      {stageDetails.map((detail, detailIndex) => (
                                        <Grid item xs={12} sm={6} key={`${group.stage}-${entryIndex}-${detail.label}-${detailIndex}`}>
                                          <Typography variant="caption" color="text.secondary" display="block">{detail.label}</Typography>
                                          <Typography variant="body2" sx={{ fontWeight: 600, color: isDark ? "#f8fafc" : "inherit" }}>{detail.value || "Not set"}</Typography>
                                        </Grid>
                                      ))}
                                    </Grid>
                                  )}
                                </Box>
                              );
                            })}
                          </Box>
                        </Collapse>
                      </Box>
                    </ListItem>
                  );
                })}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>No timeline data available</Typography>
            )}
          </Paper>
        )}
      </DialogContent>

      <DialogActions sx={{ px: { xs: 2.5, sm: 3.5 }, py: 2.5, borderTop: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${alpha(PRIMARY_COLOR, 0.08)}`, bgcolor: isDark ? "#0e1626" : "#fff" }}>
        <Button
          onClick={onClose}
          variant="contained"
          fullWidth={isMobile}
          sx={{ background: GRADIENT_DARK, borderRadius: 2, fontWeight: 700, px: 3, boxShadow: "0 12px 24px rgba(15,31,61,0.18)", "&:hover": { background: GRADIENT_DARK } }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
});
ViewLeadModal.displayName = "ViewLeadModal";

export const EditLeadModal = React.memo(({ open, onClose, lead, onSave, userRole }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { fetchAPI } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingLead, setLoadingLead] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    status: "Visit",
    address: "",
    city: "",
    pincode: "",
    solarRequirement: "",
    visitStatus: "Not Assigned",
    visitDate: "",
    followUpAction: "",
    followUpDate: "",
    followUpNotes: "",
  });

  const permissions = ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS.TEAM;
  const canEdit = permissions.edit;

  const buildFormData = useCallback((leadData) => ({
    firstName: leadData?.firstName || "",
    lastName: leadData?.lastName || "",
    email: leadData?.email || "",
    phone: leadData?.phone || "",
    status: leadData?.status || "Visit",
    address: leadData?.address || "",
    city: leadData?.city || "",
    pincode: leadData?.pincode || "",
    solarRequirement: leadData?.solarRequirement || "",
    visitStatus: leadData?.visitStatus || "Not Assigned",
    visitDate: formatDateTimeLocalValue(leadData?.visitDate),
    followUpAction: leadData?.followUpAction || "",
    followUpDate: formatDateTimeLocalValue(leadData?.followUpDate),
    followUpNotes: leadData?.followUpNotes || "",
  }), []);

  useEffect(() => {
    if (!open || !lead?._id) return;

    let active = true;
    const loadLead = async () => {
      setLoadingLead(true);
      setErrors({});
      try {
        const response = await fetchAPI(`/lead/getLeadById/${lead._id}`);
        const sourceLead = response.success ? response.result : lead;
        if (active) setFormData(buildFormData(sourceLead));
      } catch {
        if (active) setFormData(buildFormData(lead));
      } finally {
        if (active) setLoadingLead(false);
      }
    };

    loadLead();
    return () => { active = false; };
  }, [open, lead, fetchAPI, buildFormData]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
    if (formData.email.trim() && !validateEmail(formData.email)) newErrors.email = "Invalid email format";
    if (!formData.phone.trim()) newErrors.phone = "Phone is required";
    else if (!validatePhone(formData.phone)) newErrors.phone = "Phone must be 10 digits";
    if (formData.pincode && !/^[0-9]{6}$/.test(formData.pincode)) newErrors.pincode = "Pincode must be 6 digits";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      const payload = {
        ...formData,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim() || undefined,
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim(),
        address: formData.address.trim() || undefined,
        city: formData.city.trim() || undefined,
        pincode: formData.pincode.trim() || undefined,
        solarRequirement: formData.solarRequirement.trim() || undefined,
        followUpNotes: formData.followUpNotes.trim() || undefined,
        visitDate: formData.visitDate ? new Date(formData.visitDate).toISOString() : null,
        followUpDate: formData.followUpDate ? new Date(formData.followUpDate).toISOString() : null,
      };

      const response = await fetchAPI(`/lead/updateLead/${lead._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.success) {
        onSave(response.result);
        onClose();
      } else {
        throw new Error(response.message || "Failed to update lead");
      }
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field) => (event) => {
    let value = event.target.value;
    if (field === "phone") value = value.replace(/\D/g, "").slice(0, 10);
    if (field === "pincode") value = value.replace(/\D/g, "").slice(0, 6);
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  if (!canEdit) {
    return (
      <Dialog open={open} onClose={onClose} fullScreen={isMobile} PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3, overflow: "hidden", bgcolor: isDark ? "#0e1626" : "#ffffff" } }}>
        <ModalHeader icon={<Security />} title="Access Denied" subtitle="Insufficient permissions" color="#c62828" onClose={onClose} />
        <DialogContent sx={{ p: 3, bgcolor: isDark ? "#0b101b" : "inherit" }}>
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            <Typography variant="body1" fontWeight={600}>You do not have permission to edit leads</Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>Your role ({ROLE_PERMISSIONS[userRole]?.label}) only allows viewing leads.</Typography>
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: isDark ? "#0e1626" : "inherit" }}><Button onClick={onClose} variant="contained" sx={{ bgcolor: PRIMARY_COLOR }}>Close</Button></DialogActions>
      </Dialog>
    );
  }

  const fieldSx = getFieldSx(isDark);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 3,
          overflow: "hidden",
          bgcolor: isDark ? "#0e1626" : "#ffffff",
          backgroundImage: "none",
          boxShadow: isDark ? "0 24px 64px rgba(0,0,0,0.6)" : `0 24px 64px ${alpha(PRIMARY_COLOR, 0.18)}`,
        },
      }}
      TransitionComponent={isMobile ? Slide : Fade} transitionDuration={300}>

      <ModalHeader
        icon={<Edit />}
        title="Edit Lead"
        subtitle={lead ? `${lead.firstName || ""} ${lead.lastName || ""} · ${lead.status || "Lead"}`.trim() : ""}
        color={PRIMARY_COLOR}
        onClose={onClose}
        iconGradient={GRADIENT_BLUE}
      />
      {(loading || loadingLead) && <LinearProgress sx={{ height: 3, bgcolor: alpha(PRIMARY_COLOR, 0.1), "& .MuiLinearProgress-bar": { bgcolor: PRIMARY_COLOR } }} />}

      {(formData.followUpAction || formData.followUpDate) && (
        <Box sx={{
          px: { xs: 2.5, sm: 3.5 },
          py: 1.25,
          borderBottom: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${alpha(PRIMARY_COLOR, 0.08)}`,
          background: isDark ? "rgba(37,99,235,0.08)" : alpha(PRIMARY_COLOR, 0.02),
        }}>
          <Chip
            label={formData.followUpAction ? `Follow-up: ${formData.followUpAction}` : `Follow-up set for ${formatDate(formData.followUpDate)}`}
            size="small"
            sx={{
              background: "linear-gradient(135deg, rgba(37,99,235,0.18) 0%, rgba(96,165,250,0.3) 100%)",
              color: PRIMARY_COLOR,
              fontWeight: 700,
              border: `1px solid ${alpha(PRIMARY_COLOR, 0.14)}`,
            }}
          />
        </Box>
      )}

      <DialogContent sx={{ py: 3, px: { xs: 2.5, sm: 3.5 }, bgcolor: isDark ? "#0b101b" : "#fafbff" }}>
        {errors.submit && <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }} icon={<ErrorOutline />}>{errors.submit}</Alert>}
        <Stack spacing={2.5}>
          <Paper elevation={0} sx={{ ...getModalSectionSx(isDark), p: 2.25 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, color: PRIMARY_COLOR }}>Basic Information</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="First Name" value={formData.firstName} onChange={handleChange("firstName")} error={!!errors.firstName} helperText={errors.firstName} required size={isMobile ? "small" : "medium"} sx={fieldSx} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Last Name" value={formData.lastName} onChange={handleChange("lastName")} size={isMobile ? "small" : "medium"} sx={fieldSx} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Email" type="email" value={formData.email} onChange={handleChange("email")} error={!!errors.email} helperText={errors.email || "Optional"} size={isMobile ? "small" : "medium"}
                  InputProps={{ startAdornment: <InputAdornment position="start"><Email sx={{ color: alpha(PRIMARY_COLOR, 0.5), fontSize: 20 }} /></InputAdornment> }} sx={fieldSx} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Phone" value={formData.phone} onChange={handleChange("phone")} error={!!errors.phone} helperText={errors.phone || "10 digits"} required size={isMobile ? "small" : "medium"} inputProps={{ maxLength: 10 }}
                  InputProps={{ startAdornment: <InputAdornment position="start"><Phone sx={{ color: alpha(PRIMARY_COLOR, 0.5), fontSize: 20 }} /></InputAdornment> }} sx={fieldSx} />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth size={isMobile ? "small" : "medium"} required>
                  <InputLabel sx={{ color: isDark ? "#94a3b8" : "text.secondary", "&.Mui-focused": { color: PRIMARY_COLOR } }}>Lead Status</InputLabel>
                  <Select value={formData.status} onChange={handleChange("status")} label="Lead Status"
                    sx={{
                      borderRadius: 2,
                      bgcolor: isDark ? "#172338" : "#f8fafd",
                      color: isDark ? "#f8fafc" : "#1e293b",
                      "& .MuiOutlinedInput-notchedOutline": { borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)" },
                      "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: PRIMARY_COLOR },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: PRIMARY_COLOR },
                      "& .MuiSelect-icon": { color: isDark ? "#94a3b8" : "inherit" },
                    }}>
                    {LEAD_STATUS_OPTIONS.map((status) => {
                      const sc = getStatusColor(status);
                      return (
                        <MenuItem key={status} value={status}>
                          <Box display="flex" alignItems="center" gap={1.5}>
                            <Box sx={{ color: sc.color, display: "flex" }}>{sc.icon}</Box>
                            <Typography variant="body2">{status}</Typography>
                          </Box>
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>

          <Paper elevation={0} sx={{ ...getModalSectionSx(isDark), p: 2.25 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, color: PRIMARY_COLOR }}>Address & Requirement</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField fullWidth label="Address" value={formData.address} onChange={handleChange("address")} multiline minRows={2} size={isMobile ? "small" : "medium"} sx={fieldSx} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="City" value={formData.city} onChange={handleChange("city")}
                  InputProps={{ startAdornment: <InputAdornment position="start"><LocationOn sx={{ color: alpha(PRIMARY_COLOR, 0.5), fontSize: 20 }} /></InputAdornment> }} size={isMobile ? "small" : "medium"} sx={fieldSx} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Pincode" value={formData.pincode} onChange={handleChange("pincode")} error={!!errors.pincode} helperText={errors.pincode || "6 digits"} inputProps={{ maxLength: 6 }} size={isMobile ? "small" : "medium"} sx={fieldSx} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Solar Requirement" value={formData.solarRequirement} onChange={handleChange("solarRequirement")}
                  InputProps={{ startAdornment: <InputAdornment position="start"><Description sx={{ color: alpha(PRIMARY_COLOR, 0.5), fontSize: 20 }} /></InputAdornment> }} size={isMobile ? "small" : "medium"} sx={fieldSx} />
              </Grid>
            </Grid>
          </Paper>

        </Stack>
      </DialogContent>

      <DialogActions sx={{
        px: { xs: 2.5, sm: 3.5 },
        py: 2.5,
        borderTop: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${alpha(PRIMARY_COLOR, 0.08)}`,
        bgcolor: isDark ? "#0e1626" : "#fff",
        gap: 1.5,
        flexDirection: { xs: "column-reverse", sm: "row" },
      }}>
        <Button onClick={onClose} variant="outlined" fullWidth={isMobile} disabled={loading || loadingLead}
          sx={{
            borderRadius: 2,
            borderColor: isDark ? "rgba(255,255,255,0.18)" : alpha(PRIMARY_COLOR, 0.35),
            color: isDark ? "#94a3b8" : PRIMARY_COLOR,
            fontWeight: 600,
            px: 3,
            "&:hover": {
              borderColor: PRIMARY_COLOR,
              bgcolor: isDark ? "rgba(255,255,255,0.04)" : alpha(PRIMARY_COLOR, 0.04),
            },
          }}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" fullWidth={isMobile} disabled={loading || loadingLead}
          startIcon={loading ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : <Save />}
          sx={{ background: GRADIENT_BLUE, borderRadius: 2, fontWeight: 700, px: 3, boxShadow: "0 12px 24px rgba(37,99,235,0.2)", "&:hover": { background: GRADIENT_BLUE } }}>
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
});
EditLeadModal.displayName = "EditLeadModal";

// ---- ASSIGN LEAD MODAL ----
const AssignLeadModal = React.memo(({ open, onClose, lead, onAssign, userRole, isBulkAssign = false, bulkLeads = [], showSnackbar }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { fetchAPI, user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [InchargeUsers, setInchargeUsers] = useState([]);
  const [teamUsers, setTeamUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [fetchingUsers, setFetchingUsers] = useState(false);
  const [error, setError] = useState(null);
  const [assignToRole, setAssignToRole] = useState("");
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [availableRoles, setAvailableRoles] = useState([]);

  const activeRole = userRole || user?.role;
  const normalizedRole = normalizeUserRole(activeRole);
  const permissions = ROLE_PERMISSIONS[activeRole] || ROLE_PERMISSIONS[normalizedRole] || ROLE_PERMISSIONS.Admin_panel;
  const canAssign = permissions.assign !== false;

  useEffect(() => {
    if (open && canAssign) {
      resetModal();
      const roles = permissions.canAssignTo || ["Incharge", "TEAM"];
      setAvailableRoles(roles);
      if (roles.length > 1) { setShowRoleSelection(true); setAssignToRole(""); }
      else if (roles.length === 1) { setAssignToRole(roles[0]); setShowRoleSelection(false); fetchUsers(roles[0]); }
    } else { resetModal(); }
  }, [open, canAssign, permissions]);

  const resetModal = () => {
    setInchargeUsers([]); setTeamUsers([]); setSelectedUserId(""); setError(null);
    setAssignToRole(""); setShowRoleSelection(false); setAvailableRoles([]);
  };

  const fetchUsers = async (roleToFetch = assignToRole) => {
    if (!canAssign || !roleToFetch) return;
    try {
      setFetchingUsers(true); setError(null);
      let endpoint = "", queryParams = "?page=1&limit=100";
      const normRole = normalizeUserRole(userRole || user?.role);
      if (normRole === "Admin_panel" || normRole === "ZSM" || permissions.assign) {
        endpoint = roleToFetch === "Incharge" ? "/user/managerList" : "/user/getManagerUnderUserList";
      } else if (normRole === "Incharge" && roleToFetch === "TEAM") {
        endpoint = "/user/getManagerUnderUserList";
        queryParams = `?page=1&limit=100&supervisorId=${user._id}`;
      }
      if (!endpoint) { setError(`No endpoint configured for ${roleToFetch} from ${userRole}`); return; }
      const response = await fetchAPI(`${endpoint}${queryParams}`);
      if (response?.success) {
        let usersData = response.result?.users || (Array.isArray(response.result) ? response.result : response.result?.data || (response.result ? [response.result] : []));
        const filteredUsers = usersData.filter((u) => {
          const hasRole = u.role === roleToFetch, isActive = u.status === "active";
          let supervised = true;
          if (userRole === "Incharge" && roleToFetch === "TEAM") supervised = u.supervisor?._id === user._id || u.supervisorId === user._id || u.supervisor === user._id;
          return hasRole && isActive && supervised;
        });
        if (roleToFetch === "Incharge") setInchargeUsers(filteredUsers);
        else if (roleToFetch === "TEAM") setTeamUsers(filteredUsers);
        if (filteredUsers.length === 0) setError(`No active ${roleToFetch === "Incharge" ? "Incharges" : "team members"} available.`);
        else setError(null);
      } else setError(response?.message || `Failed to load ${roleToFetch} users.`);
    } catch (error) { setError(error.message || "Failed to load users. Please try again."); }
    finally { setFetchingUsers(false); }
  };

  const handleRoleChange = async (event) => {
    const role = event.target.value;
    setAssignToRole(role); setSelectedUserId("");
    if (role === "Incharge") setInchargeUsers([]); else if (role === "TEAM") setTeamUsers([]);
    setError(null); await fetchUsers(role);
  };

  const handleSubmit = async () => {
    if (!selectedUserId) { setError("Please select a user to assign"); return; }
    if (!assignToRole) { setError("Please select a role to assign to"); return; }
    setLoading(true);
    try {
      if (isBulkAssign) {
        const response = await fetchAPI("/lead/bulk-assign", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ leadIds: bulkLeads.map((l) => l._id), targetId: selectedUserId, targetRole: assignToRole }) });
        if (response.success) { onAssign(response.result); onClose(); showSnackbar?.(`${bulkLeads.length} leads assigned successfully`, "success"); }
        else throw new Error(response.message || "Failed to bulk assign leads");
      } else {
        const assignData = { leadId: lead._id, targetId: selectedUserId, targetRole: assignToRole };
        if (assignToRole === "Incharge") assignData.managerId = selectedUserId;
        else if (assignToRole === "TEAM") assignData.userId = selectedUserId;
        const response = await fetchAPI("/lead/assign", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(assignData) });
        if (response.success) { onAssign(response.result); onClose(); showSnackbar?.("Lead assigned successfully", "success"); }
        else throw new Error(response.message || "Failed to assign lead");
      }
    } catch (error) { setError(error.message); showSnackbar?.(error.message || "Failed to assign lead", "error"); }
    finally { setLoading(false); }
  };

  const getAvailableUsers = () => assignToRole === "Incharge" ? InchargeUsers : assignToRole === "TEAM" ? teamUsers : [];
  const getSelectedUser = () => getAvailableUsers().find((u) => u._id === selectedUserId);

  if (!canAssign) {
    return (
      <Dialog open={open} onClose={onClose} fullScreen={isMobile} PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3, overflow: "hidden", bgcolor: isDark ? "#0e1626" : "#ffffff" } }}>
        <ModalHeader icon={<Security />} title="Access Denied" subtitle="Insufficient permissions" color="#c62828" onClose={onClose} />
        <DialogContent sx={{ p: 3, bgcolor: isDark ? "#0b101b" : "inherit" }}>
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            <Typography variant="body1" fontWeight={600}>You do not have permission to assign leads</Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>Your role ({permissions.label}) does not have assignment privileges.</Typography>
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: isDark ? "#0e1626" : "inherit" }}><Button onClick={onClose} variant="contained" sx={{ bgcolor: PRIMARY_COLOR }}>Close</Button></DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 3,
          overflow: "hidden",
          bgcolor: isDark ? "#0e1626" : "#ffffff",
          backgroundImage: "none",
          boxShadow: isDark ? "0 24px 64px rgba(0,0,0,0.6)" : "0 24px 64px rgba(0,188,212,0.15)",
        },
      }}
      TransitionComponent={isMobile ? Slide : Fade} transitionDuration={300}>

      <ModalHeader
        icon={<AssignmentInd />}
        title={isBulkAssign ? "Bulk Assign Leads" : "Assign Lead"}
        subtitle={isBulkAssign ? `${bulkLeads.length} leads selected` : (lead ? `${lead.firstName} ${lead.lastName}` : "")}
        color="#00838f"
        onClose={onClose}
      />

      <DialogContent sx={{ py: 3, px: { xs: 2.5, sm: 3.5 }, bgcolor: isDark ? "#0b101b" : "#f5fdfe" }}>
        {/* Lead preview */}
        {isBulkAssign ? (
          <Box sx={{ p: 2, mb: 3, borderRadius: 2.5, border: `1.5px solid ${isDark ? "rgba(0,188,212,0.3)" : alpha("#00bcd4", 0.2)}`, bgcolor: isDark ? "#111c30" : "#fff" }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, color: "#00838f" }}>Bulk Assignment — {bulkLeads.length} leads</Typography>
            <Stack spacing={0.75} sx={{ maxHeight: 130, overflow: "auto" }}>
              {bulkLeads.slice(0, 5).map((l) => (
                <Box key={l._id} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Avatar sx={{ bgcolor: alpha("#00bcd4", 0.15), color: "#00838f", width: 24, height: 24, fontSize: 11, fontWeight: 700 }}>{l.firstName?.[0]}</Avatar>
                  <Typography variant="body2" color={isDark ? "#f8fafc" : "inherit"}>{l.firstName} {l.lastName}</Typography>
                  <Chip label={l.status} size="small" sx={{ ml: "auto", height: 18, fontSize: "0.65rem", bgcolor: getStatusColor(l.status).bg, color: getStatusColor(l.status).color }} />
                </Box>
              ))}
              {bulkLeads.length > 5 && <Typography variant="caption" color="text.secondary" sx={{ pl: 4 }}>...and {bulkLeads.length - 5} more</Typography>}
            </Stack>
          </Box>
        ) : lead && (
          <Box sx={{ p: 2, mb: 3, borderRadius: 2.5, border: `1.5px solid ${isDark ? "rgba(0,188,212,0.3)" : alpha("#00bcd4", 0.2)}`, bgcolor: isDark ? "#111c30" : "#fff", display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar sx={{ bgcolor: alpha("#00bcd4", 0.15), color: "#00838f", width: 48, height: 48, fontWeight: 700, fontSize: "1.1rem" }}>{lead.firstName?.[0]}{lead.lastName?.[0]}</Avatar>
            <Box flex={1}>
              <Typography variant="subtitle1" fontWeight={700} color={isDark ? "#f8fafc" : "inherit"}>{lead.firstName} {lead.lastName}</Typography>
              <Typography variant="caption" color="text.secondary">{lead.email} · {lead.phone}</Typography>
              <Box sx={{ mt: 0.5 }}><Chip label={lead.status} size="small" sx={{ bgcolor: getStatusColor(lead.status).bg, color: getStatusColor(lead.status).color, fontWeight: 600, fontSize: "0.65rem", height: 20 }} /></Box>
            </Box>
          </Box>
        )}

        {error && !fetchingUsers && (
          <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }} action={<Button color="inherit" size="small" onClick={() => fetchUsers(assignToRole)}>Retry</Button>}>{error}</Alert>
        )}

        {fetchingUsers ? (
          <Box display="flex" flexDirection="column" alignItems="center" py={4} gap={1.5}>
            <CircularProgress size={32} sx={{ color: "#00838f" }} />
            <Typography variant="body2" color="text.secondary">Loading available users...</Typography>
          </Box>
        ) : (
          <Stack spacing={2.5}>
            {showRoleSelection && (
              <Box>
                <Typography variant="subtitle2" fontWeight={700} color={isDark ? "#f8fafc" : "text.primary"} sx={{ mb: 1 }}>Assign To Role</Typography>
                <Stack direction="row" spacing={1.5}>
                  {availableRoles.map((role) => {
                    const users = role === "Incharge" ? InchargeUsers : teamUsers;
                    const selected = assignToRole === role;
                    const icon = role === "Incharge" ? <SupervisorAccount /> : <Groups />;
                    return (
                      <Box key={role} onClick={() => handleRoleChange({ target: { value: role } })}
                        sx={{
                          flex: 1,
                          p: 1.5,
                          borderRadius: 2,
                          border: `2px solid ${selected ? "#00bcd4" : isDark ? "rgba(255,255,255,0.08)" : alpha("#00bcd4", 0.2)}`,
                          bgcolor: selected ? (isDark ? "rgba(0,188,212,0.18)" : alpha("#00bcd4", 0.06)) : (isDark ? "#111c30" : "#fff"),
                          cursor: "pointer",
                          transition: "all 0.2s",
                          "&:hover": { borderColor: alpha("#00bcd4", 0.5) },
                        }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Box sx={{ color: selected ? "#00bcd4" : "text.secondary", display: "flex" }}>{icon}</Box>
                          <Box>
                            <Typography variant="body2" fontWeight={selected ? 700 : 500} color={isDark ? "#f8fafc" : "inherit"}>{role === "Incharge" ? "Incharge" : "Team"}</Typography>
                            {users.length > 0 && <Typography variant="caption" color="text.secondary">{users.length} available</Typography>}
                          </Box>
                          {selected && <Box sx={{ ml: "auto", color: "#00bcd4", display: "flex" }}><CheckCircle fontSize="small" /></Box>}
                        </Stack>
                      </Box>
                    );
                  })}
                </Stack>
              </Box>
            )}

            {(assignToRole || !showRoleSelection) && (
              <Box>
                <Typography variant="subtitle2" fontWeight={700} color={isDark ? "#f8fafc" : "text.primary"} sx={{ mb: 1 }}>
                  Select {assignToRole === "TEAM" ? "Team Member" : assignToRole || "User"}
                </Typography>
                {getAvailableUsers().length === 0 && !fetchingUsers && assignToRole ? (
                  <Box sx={{ p: 3, borderRadius: 2, border: `1.5px dashed ${alpha("#00bcd4", 0.3)}`, textAlign: "center", bgcolor: isDark ? "#111c30" : "inherit" }}>
                    <Groups sx={{ color: alpha("#00bcd4", 0.4), fontSize: 36, mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">No {assignToRole === "TEAM" ? "team members" : "Incharge users"} available</Typography>
                  </Box>
                ) : (
                  <Stack spacing={1} sx={{ maxHeight: 220, overflow: "auto" }}>
                    {getAvailableUsers().map((userData) => {
                      const selected = selectedUserId === userData._id;
                      const rc = getRoleColor(userData.role);
                      return (
                        <Box key={userData._id} onClick={() => setSelectedUserId(userData._id)}
                          sx={{
                            p: 1.5,
                            borderRadius: 2,
                            border: `2px solid ${selected ? "#00bcd4" : isDark ? "rgba(255,255,255,0.08)" : alpha("#00bcd4", 0.15)}`,
                            bgcolor: selected ? (isDark ? "rgba(0,188,212,0.18)" : alpha("#00bcd4", 0.06)) : (isDark ? "#111c30" : "#fff"),
                            cursor: "pointer",
                            transition: "all 0.2s",
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                            "&:hover": { borderColor: alpha("#00bcd4", 0.5), bgcolor: isDark ? "rgba(0,188,212,0.1)" : alpha("#00bcd4", 0.04) },
                          }}>
                          <Avatar sx={{ bgcolor: rc.color, width: 36, height: 36, fontWeight: 700, fontSize: "0.875rem" }}>{userData.firstName?.[0]}{userData.lastName?.[0]}</Avatar>
                          <Box flex={1}>
                            <Typography variant="body2" fontWeight={selected ? 700 : 500} color={isDark ? "#f8fafc" : "inherit"}>{userData.firstName} {userData.lastName}</Typography>
                            <Typography variant="caption" color="text.secondary">{userData.email}</Typography>
                          </Box>
                          <Box sx={{ width: 22, height: 22, borderRadius: "50%", border: `2px solid ${selected ? "#00bcd4" : alpha("#00bcd4", 0.3)}`, bgcolor: selected ? "#00bcd4" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s" }}>
                            {selected && <CheckCircle sx={{ fontSize: 14, color: "#fff" }} />}
                          </Box>
                        </Box>
                      );
                    })}
                  </Stack>
                )}
              </Box>
            )}

            {selectedUserId && assignToRole && (
              <Box sx={{ p: 2, borderRadius: 2, bgcolor: isDark ? "rgba(0,188,212,0.12)" : alpha("#00bcd4", 0.06), border: `1px solid ${isDark ? "rgba(0,188,212,0.3)" : alpha("#00bcd4", 0.2)}`, display: "flex", gap: 1, alignItems: "flex-start" }}>
                <CheckCircle sx={{ color: "#00bcd4", fontSize: 18, flexShrink: 0, mt: 0.1 }} />
                <Typography variant="caption" color={isDark ? "#e0f2fe" : "#00838f"}>
                  {isBulkAssign ? `${bulkLeads.length} lead(s)` : "This lead"} will be assigned to <strong>{getSelectedUser()?.firstName} {getSelectedUser()?.lastName}</strong> ({assignToRole}).
                </Typography>
              </Box>
            )}
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{
        px: { xs: 2.5, sm: 3.5 },
        py: 2.5,
        borderTop: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${alpha("#00bcd4", 0.12)}`,
        bgcolor: isDark ? "#0e1626" : "#fff",
        gap: 1.5,
        flexDirection: { xs: "column-reverse", sm: "row" },
      }}>
        <Button onClick={onClose} variant="outlined" fullWidth={isMobile} disabled={loading || fetchingUsers}
          sx={{
            borderRadius: 2,
            borderColor: isDark ? "rgba(255,255,255,0.18)" : alpha("#00bcd4", 0.4),
            color: isDark ? "#94a3b8" : "#00838f",
            fontWeight: 600,
            px: 3,
            "&:hover": { borderColor: "#00bcd4", bgcolor: isDark ? "rgba(0,188,212,0.08)" : alpha("#00bcd4", 0.04) },
          }}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" fullWidth={isMobile}
          disabled={loading || fetchingUsers || !selectedUserId || !assignToRole || getAvailableUsers().length === 0}
          startIcon={loading ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : <AssignmentInd />}
          sx={{ bgcolor: "#00838f", borderRadius: 2, fontWeight: 700, px: 3, boxShadow: `0 4px 14px ${alpha("#00bcd4", 0.35)}`, "&:hover": { bgcolor: "#006064" }, "&.Mui-disabled": { bgcolor: alpha("#00bcd4", 0.3), color: "#fff" } }}>
          {loading ? "Assigning..." : isBulkAssign ? "Assign Leads" : "Assign Lead"}
        </Button>
      </DialogActions>
    </Dialog>
  );
});
AssignLeadModal.displayName = "AssignLeadModal";

// ---- DELETE CONFIRMATION DIALOG ----
const DeleteConfirmationDialog = React.memo(({ open, onClose, leadsToDelete, onDelete, userRole }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const permissions = ROLE_PERMISSIONS[userRole] || ROLE_PERMISSIONS.TEAM;
  const canDelete = permissions.delete;
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const isMultiple = leadsToDelete.length > 1;
  const isConfirmed = isMultiple
    ? confirmText === String(leadsToDelete.length)
    : confirmText.toLowerCase() === "delete";

  const handleClose = () => { setConfirmText(""); onClose(); };
  const handleDelete = async () => {
    setDeleting(true);
    await onDelete();
    setDeleting(false);
    setConfirmText("");
  };

  if (!canDelete) {
    return (
      <Dialog open={open} onClose={onClose} fullScreen={isMobile} PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3, overflow: "hidden", bgcolor: isDark ? "#0e1626" : "#ffffff" } }}>
        <ModalHeader icon={<Security />} title="Access Denied" subtitle="Delete permission required" color="#c62828" onClose={onClose} />
        <DialogContent sx={{ p: 3, bgcolor: isDark ? "#0b101b" : "inherit" }}>
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            <Typography variant="body1" fontWeight={600}>Delete permission required</Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>Only Admin Panel administrators can delete leads. Your role ({permissions.label}) does not have delete privileges.</Typography>
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: isDark ? "#0e1626" : "inherit" }}><Button onClick={onClose} variant="contained" sx={{ bgcolor: PRIMARY_COLOR }}>Close</Button></DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 3,
          overflow: "hidden",
          bgcolor: isDark ? "#0e1626" : "#ffffff",
          backgroundImage: "none",
          boxShadow: isDark ? "0 24px 64px rgba(0,0,0,0.6)" : "0 24px 64px rgba(244,67,54,0.18)",
        },
      }}
      TransitionComponent={isMobile ? Slide : Fade} transitionDuration={300}>

      <ModalHeader
        icon={<DeleteForever />}
        title={isMultiple ? `Delete ${leadsToDelete.length} Leads` : "Delete Lead"}
        subtitle="This action is permanent and cannot be undone"
        color="#c62828"
        onClose={handleClose}
      />

      <DialogContent sx={{ py: 3, px: { xs: 2.5, sm: 3 }, bgcolor: isDark ? "#0b101b" : "#fff9f9" }}>
        <Stack spacing={2.5}>
          {/* Warning */}
          <Box sx={{ display: "flex", gap: 1.5, p: 2, borderRadius: 2, bgcolor: isDark ? "rgba(244,67,54,0.12)" : alpha("#f44336", 0.06), border: `1px solid ${isDark ? "rgba(244,67,54,0.3)" : alpha("#f44336", 0.2)}` }}>
            <ErrorOutline sx={{ color: isDark ? "#f87171" : "#c62828", fontSize: 20, flexShrink: 0, mt: 0.1 }} />
            <Typography variant="body2" color={isDark ? "#fca5a5" : "#c62828"} fontWeight={500}>
              {isMultiple
                ? `All ${leadsToDelete.length} selected leads and their associated data will be permanently erased.`
                : "All data associated with this lead will be permanently erased."}
            </Typography>
          </Box>

          {/* Lead count/summary card */}
          <Box sx={{ p: 2, borderRadius: 2.5, border: `1.5px solid ${isDark ? "rgba(244,67,54,0.25)" : alpha("#f44336", 0.2)}`, bgcolor: isDark ? "#111c30" : "#fff", display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: alpha("#f44336", 0.15), display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <DeleteForever sx={{ color: isDark ? "#f87171" : "#c62828", fontSize: 24 }} />
            </Box>
            <Box>
              <Typography fontWeight={700} variant="subtitle1" color={isDark ? "#f87171" : "#c62828"}>
                {isMultiple ? `${leadsToDelete.length} Leads` : "1 Lead"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {isMultiple ? "Multiple leads will be permanently deleted" : "Will be permanently deleted"}
              </Typography>
            </Box>
          </Box>

          {/* Confirm input */}
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Type <strong style={{ color: isDark ? "#f87171" : "#c62828" }}>{isMultiple ? leadsToDelete.length : "delete"}</strong> to confirm:
            </Typography>
            <TextField
              fullWidth size="small"
              placeholder={isMultiple ? `Type "${leadsToDelete.length}" to confirm` : `Type "delete" to confirm`}
              value={confirmText} onChange={(e) => setConfirmText(e.target.value)}
              error={confirmText.length > 0 && !isConfirmed}
              helperText={confirmText.length > 0 && !isConfirmed ? "Text doesn't match" : ""}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  bgcolor: isDark ? "#172338" : "#fff",
                  color: isDark ? "#f8fafc" : "#1e293b",
                  "& input": { color: isDark ? "#f8fafc" : "#1e293b" },
                  "& .MuiOutlinedInput-notchedOutline": { borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)" },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: isConfirmed ? "#4caf50" : "#f44336" },
                },
              }}
              InputProps={{ endAdornment: isConfirmed ? <InputAdornment position="end"><CheckCircle sx={{ color: "#4caf50" }} /></InputAdornment> : null }}
            />
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{
        px: { xs: 2.5, sm: 3 },
        py: 2.5,
        borderTop: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${alpha("#f44336", 0.1)}`,
        bgcolor: isDark ? "#0e1626" : "#fff",
        gap: 1.5,
        flexDirection: { xs: "column-reverse", sm: "row" },
      }}>
        <Button onClick={handleClose} variant="outlined" fullWidth={isMobile} disabled={deleting}
          sx={{
            borderRadius: 2,
            borderColor: isDark ? "rgba(255,255,255,0.18)" : alpha("#f44336", 0.35),
            color: isDark ? "#94a3b8" : "#c62828",
            fontWeight: 600,
            px: 3,
            "&:hover": { borderColor: "#f44336", bgcolor: isDark ? "rgba(244,67,54,0.08)" : alpha("#f44336", 0.04) },
          }}>
          Cancel
        </Button>
        <Button onClick={handleDelete} variant="contained" fullWidth={isMobile}
          disabled={!isConfirmed || deleting}
          startIcon={deleting ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : <DeleteForever />}
          sx={{ bgcolor: "#c62828", borderRadius: 2, fontWeight: 700, px: 3, boxShadow: isConfirmed ? `0 4px 14px ${alpha("#f44336", 0.4)}` : "none", "&:hover": { bgcolor: "#b71c1c" }, "&.Mui-disabled": { bgcolor: alpha("#f44336", 0.3), color: "#fff" } }}>
          {deleting ? "Deleting..." : isMultiple ? `Delete ${leadsToDelete.length} Leads` : "Delete Lead"}
        </Button>
      </DialogActions>
    </Dialog>
  );
});
DeleteConfirmationDialog.displayName = "DeleteConfirmationDialog";

const PIPELINE_STAGES = [
  { key: "all", label: "All", icon: <Dashboard />, status: null },
  { key: "new", label: "New", icon: <Add />, status: "New" },
  { key: "contacted", label: "Contacted", icon: <Phone />, status: "Contacted" },
  { key: "qualified", label: "Qualified", icon: <CheckCircle />, status: "Qualified" },
  { key: "siteVisitScheduled", label: "Site Visit Sched", icon: <CalendarToday />, status: "Visit" },
  { key: "proposalSent", label: "Proposal Sent", icon: <Description />, status: "Proposal Sent" },
  { key: "won", label: "Won", icon: <WorkspacePremium />, status: "Won" },
  { key: "lost", label: "Lost", icon: <Cancel />, status: "Lost" },
  { key: "projectConverted", label: "Project Converted", icon: <Assignment />, status: null },
];

const PIPELINE_STAGE_STYLE = {
  all: { bg: "#33465f", text: "#ffffff", icon: "#ffffff", flex: 1.1 },
  new: { bg: "#43a46f", text: "#ffffff", icon: "#ffffff", flex: 1.06 },
  contacted: { bg: "#fae7bc", text: "#172033", icon: "#64748b", flex: 1.08 },
  qualified: { bg: "#f8e3b2", text: "#172033", icon: "#6d5bd0", flex: 1.08 },
  siteVisitScheduled: { bg: "#dcefed", text: "#172033", icon: "#3b82f6", flex: 1.16 },
  proposalSent: { bg: "#f2bd55", text: "#172033", icon: "#9a650f", flex: 1.14 },
  won: { bg: "#c9e8de", text: "#172033", icon: "#047857", flex: 0.98 },
  lost: { bg: "#e6e8ee", text: "#172033", icon: "#b91c1c", flex: 0.98 },
  projectConverted: { bg: "#e8ebf2", text: "#172033", icon: PRIMARY_COLOR, flex: 1.18 },
};

const EMPTY_PIPELINE_COUNTS = {
  all: 0,
  new: 0,
  contacted: 0,
  qualified: 0,
  siteVisitScheduled: 0,
  proposalSent: 0,
  won: 0,
  lost: 0,
  projectConverted: 0,
};

const hasLeadDocuments = (lead = {}) =>
  Boolean(
    lead.uploadDocument?.url ||
      lead.aadhaar?.url ||
      lead.panCard?.url ||
      lead.passbook?.url ||
      (Array.isArray(lead.otherDocuments) && lead.otherDocuments.some((doc) => doc?.url))
  );

const hasSiteSurveyData = (lead = {}) => {
  const siteSurvey = lead.siteSurvey;
  if (!siteSurvey || typeof siteSurvey !== "object") return false;
  return Boolean(
    siteSurvey.savedAt ||
      siteSurvey.status ||
      siteSurvey.general ||
      siteSurvey.locationName ||
      (Array.isArray(siteSurvey.photos) && siteSurvey.photos.length > 0)
  );
};

const getPipelineBucket = (lead = {}) => {
  const status = String(lead.status || "").trim().toLowerCase();
  const visitStatus = String(lead.visitStatus || "").trim().toLowerCase();

  if (lead.isProject) return "projectConverted";
  if (status === "missed leads" || status === "lost") return "lost";
  if (status === "installation completion" || status === "won") return "won";
  if (["proposal sent", "bank at pending", "disbursement"].includes(status) || hasSiteSurveyData(lead)) return "proposalSent";
  if (status === "visit" || status === "site visit" || lead.visitDate || ["scheduled", "completed"].includes(visitStatus)) return "siteVisitScheduled";
  if (status === "qualified" || ["registration", "bank loan apply", "document submission"].includes(status) || hasLeadDocuments(lead)) return "qualified";
  if (status === "contacted" || lead.lastContactedAt || lead.followUpAction || lead.followUpNotes) return "contacted";
  return "new";
};

const buildPipelineCountsFromLeads = (items = []) =>
  items.reduce(
    (counts, lead) => {
      const bucket = getPipelineBucket(lead);
      counts.all += 1;
      counts[bucket] = (counts[bucket] || 0) + 1;
      return counts;
    },
    { ...EMPTY_PIPELINE_COUNTS }
  );

const applyPipelineStageToRows = (items = [], stageKey = "") => {
  if (!stageKey || stageKey === "all") return items;
  return items.filter((lead) => getPipelineBucket(lead) === stageKey);
};

// ========== MAIN COMPONENT ==========
const LeadOverview = () => {
  const { fetchAPI, user } = useAuth();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));
  const navigate = useNavigate();
  const location = useLocation();

  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(isMobile ? 5 : isTablet ? 8 : 10);
  const [totalLeads, setTotalLeads] = useState(0);
  const [overviewStats, setOverviewStats] = useState({
    totalLeads: 0,
    activeLeads: 0,
    newLeads: 0,
    convertedLeads: 0,
    conversionRate: 0,
    followUpToday: 0,
    pipelineThisQuarter: {
      all: 0,
      new: 0,
      contacted: 0,
      qualified: 0,
      siteVisitScheduled: 0,
      proposalSent: 0,
      won: 0,
      lost: 0,
      projectConverted: 0,
    },
  });
  const [visitSummary, setVisitSummary] = useState({
    totalVisits: 0,
    completedVisits: 0,
    scheduledVisits: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [quickFilter, setQuickFilter] = useState("");
  const [viewMode, setViewMode] = useState(isMobile ? "grid" : "table");
  const [showRoleInfo, setShowRoleInfo] = useState(false);
  const [period, setPeriod] = useState("All");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [leadsToDelete, setLeadsToDelete] = useState([]);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [leadToAssign, setLeadToAssign] = useState(null);
  const [bulkAssignDialogOpen, setBulkAssignDialogOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [leadToEdit, setLeadToEdit] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [leadToView, setLeadToView] = useState(null);
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [projectDialogLead, setProjectDialogLead] = useState(null);
  const [projectDialogSubmitting, setProjectDialogSubmitting] = useState(false);

  const [selectedLeads, setSelectedLeads] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [todayFollowUpLeads, setTodayFollowUpLeads] = useState([]);
  const containerRef = useRef(null);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const hasFilters = useMemo(() => searchTerm || statusFilter !== "all" || period !== "All" || quickFilter, [searchTerm, statusFilter, period, quickFilter]);
  const selectedCount = useMemo(() => selectedLeads.length, [selectedLeads]);
  const activeRole = user?.role || "Admin_panel";
  const normalizedRole = normalizeUserRole(activeRole);
  const userRole = normalizedRole;
  const permissions = ROLE_PERMISSIONS[activeRole] || ROLE_PERMISSIONS[normalizedRole] || ROLE_PERMISSIONS.Admin_panel;
  const selectedLeadsData = useMemo(() => leads.filter((lead) => selectedLeads.includes(lead._id)), [leads, selectedLeads]);
  const periodRange = useMemo(() => getPeriodDateRange(period), [period]);
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (statusFilter !== "all") count++;
    if (period !== "All") count++;
    if (quickFilter) count++;
    return count;
  }, [searchTerm, statusFilter, period, quickFilter]);

  const isDueTodayOrEarlier = (value) => {
    if (!value) return false;
    const date = typeof value === "string" ? parseISO(value) : new Date(value);
    if (!isValid(date)) return false;
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    return date.getTime() <= endOfToday.getTime();
  };

  const leadHasActiveFollowUpToday = (lead = {}) => {
    const followUpDateDue = Boolean(lead.followUpDate) && isDueTodayOrEarlier(lead.followUpDate);

    const hasActiveReminderActivity =
      Array.isArray(lead.leadActivities) &&
      lead.leadActivities.some((activity) => {
        const type = String(activity?.type || activity?.activityType || "").trim().toLowerCase();
        if (type !== "reminder") return false;
        if (activity?.completedAt) return false;
        return isDueTodayOrEarlier(activity?.scheduledAt);
      });

    return followUpDateDue || hasActiveReminderActivity;
  };

  const addLeads = () => navigate("/add-lead");
  const showSnackbar = useCallback((message, severity = "success") => setSnackbar({ open: true, message, severity }), []);

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);

      if (quickFilter === "followUpToday") {
        const leadData = await fetchAPI(`/lead/getAll?isProject=false&limit=1000&sortBy=followUpDate&sortOrder=asc`);
        if (leadData.success) {
          const allLeads = leadData.result?.leads || [];
          const filtered = allLeads.filter(leadHasActiveFollowUpToday);
          setLeads(filtered);
          setTotalLeads(filtered.length);
        } else {
          showSnackbar(leadData.message || "Failed to fetch leads", "error");
          setLeads([]);
          setTotalLeads(0);
        }
        return;
      }

      const params = new URLSearchParams({
        page: (page + 1).toString(),
        limit: rowsPerPage.toString(),
        sortBy,
        sortOrder,
      });

      const pipelineStageKey = quickFilter.startsWith("pipeline:")
        ? quickFilter.replace("pipeline:", "")
        : "";

      if (pipelineStageKey !== "projectConverted") params.append("isProject", "false");
      if (debouncedSearchTerm) params.append("search", debouncedSearchTerm);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (pipelineStageKey) params.append("pipelineStage", pipelineStageKey);

      const today = toDateInputValue(new Date());
      const fromDate = periodRange.fromDate ?? today;
      const toDate = periodRange.toDate ?? today;

      if (period !== "All") {
        params.append("fromDate", fromDate);
        params.append("toDate", toDate);
      }

      const data = await fetchAPI(`/lead/getAll?${params.toString()}`);
      if (data.success) {
        const rows = data.result.leads || [];
        const visibleRows = applyPipelineStageToRows(rows, pipelineStageKey);

        setLeads(visibleRows);
        setTotalLeads(pipelineStageKey ? visibleRows.length : data.result.pagination?.total || 0);
      } else {
        showSnackbar(data.message || "Failed to fetch leads", "error");
      }
    } catch (error) {
      showSnackbar(error.message || "Failed to fetch leads", "error");
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, [fetchAPI, page, rowsPerPage, debouncedSearchTerm, statusFilter, quickFilter, sortBy, sortOrder, periodRange, period, showSnackbar]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const fetchOverviewStats = useCallback(async () => {
    try {
      const ts = Date.now();
      const data = await fetchAPI(`/lead/stats?page=1&limit=1&_ts=${ts}`);
      if (data.success) {
        const stats = data.result?.stats || {};
        let pipelineThisQuarter = stats.pipelineThisQuarter || { ...EMPTY_PIPELINE_COUNTS };
        let totalStatsLeads = stats.totalLeads || 0;

        let allLeads = null;
        try {
          const leadData = await fetchAPI("/lead/getAll?isProject=false&limit=1000&sortBy=createdAt&sortOrder=desc");
          if (leadData.success) {
            allLeads = leadData.result?.leads || [];
            totalStatsLeads = leadData.result?.pagination?.total ?? allLeads.length;
          }
        } catch {
          // fall back to backend stats below if this fails
        }

        if (Array.isArray(allLeads)) {
          pipelineThisQuarter = buildPipelineCountsFromLeads(allLeads);
        }

        let followUpToday = stats.followUpToday || 0;
        let followUpLeads = [];
        if (Array.isArray(allLeads)) {
          followUpLeads = allLeads.filter((lead) => !lead?.isProject && leadHasActiveFollowUpToday(lead));
          followUpToday = followUpLeads.length;
        } else {
          try {
            const followUpData = await fetchAPI(`/lead/getAll?page=1&limit=1&followUpDue=today&_ts=${ts}`);
            if (followUpData?.success) followUpToday = followUpData.result?.pagination?.total || 0;
          } catch {}
        }

        setTodayFollowUpLeads(followUpLeads);
        setOverviewStats({
          totalLeads: totalStatsLeads,
          activeLeads: stats.activeLeads || 0,
          newLeads: stats.newLeads || stats.activeLeads || 0,
          convertedLeads: stats.convertedLeads || 0,
          conversionRate: stats.conversionRate || 0,
          followUpToday,
          pipelineThisQuarter,
        });
      }
    } catch {
      setOverviewStats((prev) => prev);
    }
  }, [fetchAPI]);

  const fetchVisitSummary = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page: "1", limit: "1" });
      if (periodRange.fromDate) params.append("fromDate", periodRange.fromDate);
      if (periodRange.toDate) params.append("toDate", periodRange.toDate);
      const data = await fetchAPI(`/lead/visitSummary?${params.toString()}`);
      if (data.success) {
        setVisitSummary({
          totalVisits: data.result?.summary?.totalVisits || 0,
          completedVisits: data.result?.summary?.completedVisits || 0,
          scheduledVisits: data.result?.summary?.scheduledVisits || 0,
        });
      }
    } catch {
      setVisitSummary({ totalVisits: 0, completedVisits: 0, scheduledVisits: 0 });
    }
  }, [fetchAPI, periodRange]);

  useEffect(() => {
    fetchOverviewStats();
  }, [fetchOverviewStats]);

  // Refresh stats when user returns to this page (e.g. after adding a reminder in LeadDetailsPage)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchOverviewStats();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [fetchOverviewStats]);

  // Also refresh stats on every navigation back to this page (React Router SPA navigation)
  useEffect(() => {
    fetchOverviewStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  useEffect(() => {
    fetchVisitSummary();
  }, [fetchVisitSummary]);

  const handleAssignLead = useCallback(async () => { showSnackbar("Lead assigned successfully", "success"); await fetchLeads(); setSelectedLeads([]); setSelectAll(false); }, [fetchLeads, showSnackbar]);
  const handleBulkAssign = useCallback(async (assignData) => { showSnackbar(`${assignData.leadIds?.length || 0} leads assigned successfully`, "success"); setSelectedLeads([]); setSelectAll(false); await fetchLeads(); }, [fetchLeads, showSnackbar]);

  const handleDeleteLeads = useCallback(async () => {
    try {
      if (!leadsToDelete || leadsToDelete.length === 0) {
        showSnackbar("No leads selected for deletion", "error");
        return;
      }
      for (const leadId of leadsToDelete) {
        await fetchAPI(`/lead/deleteLead/${leadId}`, { method: "DELETE" });
      }
      showSnackbar(`${leadsToDelete.length} lead(s) deleted successfully`, "success");
      setDeleteDialogOpen(false);
      setLeadsToDelete([]);
      setSelectedLeads([]);
      setSelectAll(false);
      await fetchLeads();
    } catch (error) {
      showSnackbar(error.message || "Failed to delete leads", "error");
    }
  }, [fetchAPI, fetchLeads, showSnackbar, leadsToDelete]);

  const handleDeleteSingleLead = useCallback(async (leadId) => {
    try {
      if (!leadId) { showSnackbar("Invalid lead ID", "error"); return; }
      const response = await fetchAPI(`/lead/deleteLead/${leadId}`, { method: "DELETE" });
      if (response.success) {
        showSnackbar("Lead deleted successfully", "success");
        await fetchLeads();
      } else {
        throw new Error(response.message || "Failed to delete lead");
      }
    } catch (error) {
      showSnackbar(error.message || "Failed to delete lead", "error");
    }
  }, [fetchAPI, fetchLeads, showSnackbar]);

  const handleUpdateLead = useCallback(async () => { showSnackbar("Lead updated successfully", "success"); await fetchLeads(); }, [fetchLeads, showSnackbar]);

  const handleSelectAll = useCallback((event) => { const isChecked = event.target.checked; setSelectAll(isChecked); setSelectedLeads(isChecked ? leads.map((lead) => lead._id) : []); }, [leads]);
  const handleSelectLead = useCallback((leadId) => setSelectedLeads((prev) => prev.includes(leadId) ? prev.filter((id) => id !== leadId) : [...prev, leadId]), []);
  const handleClearSelection = useCallback(() => { setSelectedLeads([]); setSelectAll(false); }, []);

  const openAssignDialog = useCallback((lead) => { setLeadToAssign(lead); setAssignDialogOpen(true); }, []);
  const openBulkAssignDialog = useCallback(() => setBulkAssignDialogOpen(true), []);
  const openEditDialog = useCallback((lead) => { setLeadToEdit(lead); setEditModalOpen(true); }, []);
  const openViewDialog = useCallback((lead) => { setLeadToView(lead); setViewModalOpen(true); }, []);
  const openLeadDetailsPage = useCallback((lead) => { if (lead?._id) navigate(`/all-leads/${lead._id}`, { state: { lead } }); }, [navigate]);
  const openDeleteDialog = useCallback(() => { setLeadsToDelete(selectedLeads); setDeleteDialogOpen(true); }, [selectedLeads]);

  useEffect(() => {
    const leadFromState = location.state?.openEditLead;
    if (!leadFromState?._id) return;

    setLeadToEdit(leadFromState);
    setEditModalOpen(true);
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.pathname, location.state, navigate]);

  const handleSort = useCallback((column) => { if (sortBy === column) setSortOrder(sortOrder === "asc" ? "desc" : "asc"); else { setSortBy(column); setSortOrder("asc"); } }, [sortBy, sortOrder]);
  const handleResetFilters = useCallback(() => { setSearchTerm(""); setStatusFilter("all"); setQuickFilter(""); setPeriod("All"); setPage(0); setSelectedLeads([]); setSelectAll(false); }, []);
  const handleClearFiltersMobile = useCallback(() => { setSearchTerm(""); setStatusFilter("all"); setQuickFilter(""); setPeriod("All"); }, []);

  const handleViewTodayFollowUps = useCallback(() => {
  if (todayFollowUpLeads.length === 1) {
    const lead = todayFollowUpLeads[0];
    navigate(`/all-leads/${lead._id}`, {
      state: { lead, initialTab: "reminders" },
    });
    return;
  }

  setSearchTerm("");
  setStatusFilter("all");
  setQuickFilter("followUpToday");
  setPeriod("All");
  setPage(0);
  setSelectedLeads([]);
  setSelectAll(false);
}, [navigate, todayFollowUpLeads]);

  const handleViewNewLeads = useCallback(() => {
    setSearchTerm("");
    setStatusFilter("New");
    setQuickFilter("");
    setPeriod("All");
    setPage(0);
    setSelectedLeads([]);
    setSelectAll(false);
  }, []);

  const handleViewVisitCalendar = useCallback(() => {
    navigate("/total-visits");
  }, [navigate]);

  const handlePipelineStageFilter = useCallback((card) => {
    setSearchTerm("");
    setPeriod("All");
    setPage(0);
    setSelectedLeads([]);
    setSelectAll(false);

    if (card.key === "all") {
      setStatusFilter("all");
      setQuickFilter("");
      return;
    }

    if (card.key === "siteVisitScheduled") {
      navigate("/total-visits");
      return;
    }

    if (card.key === "projectConverted") {
      navigate("/projects");
      return;
    }

    setStatusFilter("all");
    if ((card.value || 0) === 0) {
      setLeads([]);
      setTotalLeads(0);
    }
    setQuickFilter(`pipeline:${card.key}`);
  }, [navigate]);

  const handleCreateQuote = useCallback((lead) => {
    navigate("/quotation/create", { state: { mode: "create", lead } });
  }, [navigate]);

  const closeProjectDialog = useCallback(() => {
    if (projectDialogSubmitting) return;
    setProjectDialogOpen(false);
    setProjectDialogLead(null);
  }, [projectDialogSubmitting]);

  const completeProjectConversion = useCallback(async (lead, quotation = null, projectDetails = {}) => {
    if (!lead?._id) {
      showSnackbar("Invalid lead selected", "error");
      return;
    }

    try {
      setProjectDialogSubmitting(true);
      const response = await fetchAPI(`/lead/updateLead/${lead._id}`, {
        method: "PUT",
        body: JSON.stringify({ isProject: true, projectType: projectDetails.projectType }),
      });
      if (response?.success === false) {
        throw new Error(response.message || "Failed to convert lead to project");
      }
      if (quotation) {
        setCurrentQuotation(quotation);
      }
      showSnackbar("Lead converted to project", "success");
      setProjectDialogOpen(false);
      setProjectDialogLead(null);
      await fetchLeads();
      navigate("/total-visits", {
        state: {
          highlightLeadId: lead._id,
          quotationId: quotation?.id || null,
          quotationData: quotation || null,
        },
      });
    } catch (error) {
      showSnackbar(error.message || "Failed to convert lead to project", "error");
    } finally {
      setProjectDialogSubmitting(false);
    }
  }, [fetchAPI, fetchLeads, navigate, showSnackbar]);

  const handleConvertToProject = useCallback((lead) => {
    if (!lead?._id) {
      showSnackbar("Invalid lead selected", "error");
      return;
    }

    if (lead.isProject) {
      navigate("/projects", { state: { highlightProjectId: lead._id } });
      return;
    }

    setProjectDialogLead(lead);
    setProjectDialogOpen(true);
  }, [navigate, showSnackbar]);

  const handleProjectDialogCreateQuotation = useCallback(() => {
    if (!projectDialogLead) return;
    setProjectDialogOpen(false);
    setProjectDialogLead(null);
    navigate("/quotation/create", { state: { mode: "create", lead: projectDialogLead } });
  }, [navigate, projectDialogLead]);

  const projectDialogQuotations = useMemo(
    () => (projectDialogLead?._id ? getQuotationsForLead(projectDialogLead._id) : []),
    [projectDialogLead],
  );

  const handleUnsupportedLeadAction = useCallback((actionLabel) => {
    showSnackbar(`${actionLabel} is not connected yet.`, "info");
  }, [showSnackbar]);

  const handleExport = useCallback(async () => {
    try {
      const params = new URLSearchParams({ sortBy, sortOrder });
      if (debouncedSearchTerm) params.append("search", debouncedSearchTerm);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (periodRange.fromDate) params.append("fromDate", periodRange.fromDate);
      if (periodRange.toDate) params.append("toDate", periodRange.toDate);
      const response = await fetchAPI(`/lead/export?${params.toString()}`);
      if (response.success && response.result?.url) {
        const link = document.createElement("a");
        link.href = response.result.url;
        link.download = `leads_${format(new Date(), "yyyy-MM-dd")}.csv`;
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
        showSnackbar("Export completed successfully", "success");
      } else throw new Error(response.message || "Failed to export leads");
    } catch (error) { showSnackbar(error.message || "Failed to export leads", "error"); }
  }, [fetchAPI, showSnackbar, sortBy, sortOrder, debouncedSearchTerm, statusFilter, periodRange]);

  const handleChangePage = (event, newPage) => { setPage(newPage); if (containerRef.current) containerRef.current.scrollIntoView({ behavior: "smooth" }); };

  const renderTableRow = useCallback((lead) => {
    const isSelected = selectedLeads.includes(lead._id);
    const statusColor = getStatusColor(lead.status);
    return (
      <TableRow key={lead._id} hover selected={isSelected} sx={{
        "&:hover": { bgcolor: isDark ? "rgba(37, 99, 235, 0.12)" : alpha(PRIMARY_COLOR, 0.02) },
        "&.Mui-selected": { bgcolor: isDark ? "rgba(37, 99, 235, 0.2)" : alpha(PRIMARY_COLOR, 0.08) },
        "& td": { borderBottom: isDark ? "1px solid rgba(255, 255, 255, 0.06)" : `1px solid ${alpha(PRIMARY_COLOR, 0.06)}`, color: isDark ? "#f8fafc" : "inherit" }
      }}>
        <TableCell padding="checkbox">{permissions.bulkActions && <Checkbox checked={isSelected} onChange={() => handleSelectLead(lead._id)} sx={{ color: isDark ? "#60a5fa" : PRIMARY_COLOR, "&.Mui-checked": { color: isDark ? "#60a5fa" : PRIMARY_COLOR } }} />}</TableCell>
        <TableCell>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ background: statusColor.avatar, boxShadow: "0 12px 24px rgba(37,99,235,0.15)" }}>{lead.firstName?.[0]}</Avatar>
            <Box><Typography variant="body1" fontWeight={600} sx={{ color: isDark ? "#f8fafc" : "inherit" }}>{lead.firstName} {lead.lastName}</Typography><Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "text.secondary" }}>{lead.email}</Typography></Box>
          </Box>
        </TableCell>
        <TableCell><Box display="flex" alignItems="center" gap={1}><Phone fontSize="small" sx={{ color: isDark ? "#94a3b8" : "text.secondary" }} /><Typography variant="body2" sx={{ color: isDark ? "#e2e8f0" : "inherit" }}>{lead.phone || "Not set"}</Typography></Box></TableCell>
        <TableCell><Chip label={lead.status} icon={statusColor.icon} size="small" sx={{ background: statusColor.bg, color: statusColor.color, fontWeight: 700, border: `1px solid ${statusColor.border}`, "& .MuiChip-icon": { color: statusColor.color } }} /></TableCell>
        <TableCell>
          {(() => {
            const assignedPerson = getAssignedPerson(lead);
            return assignedPerson ? (
              <Box display="flex" alignItems="center" gap={1}>
                <Avatar sx={{ width: 24, height: 24, fontSize: 12, background: GRADIENT_BLUE, color: "#fff" }}>{assignedPerson.initial}</Avatar>
                <Box><Typography variant="body2" sx={{ color: isDark ? "#f8fafc" : "inherit" }}>{assignedPerson.name}</Typography><Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "text.secondary" }}>{assignedPerson.role}</Typography></Box>
              </Box>
            ) : permissions.assign ? (
              <Button
                size="small"
                variant="outlined"
                onClick={() => openAssignDialog(lead)}
                sx={{
                  minWidth: 96,
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 2,
                  borderStyle: "dashed",
                  borderColor: isDark ? "rgba(59, 130, 246, 0.45)" : alpha(PRIMARY_COLOR, 0.45),
                  color: isDark ? "#60a5fa" : PRIMARY_COLOR,
                  fontWeight: 600,
                  textTransform: "none",
                  "&:hover": {
                    borderStyle: "dashed",
                    borderColor: isDark ? "#60a5fa" : PRIMARY_COLOR,
                    bgcolor: isDark ? "rgba(59, 130, 246, 0.1)" : alpha(PRIMARY_COLOR, 0.05),
                  },
                }}
              >
                + Assign
              </Button>
            ) : (
              <Button
                size="small"
                variant="outlined"
                onClick={() => openAssignDialog(lead)}
                sx={{
                  minWidth: 100,
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 2,
                  borderStyle: "dashed",
                  borderColor: isDark ? "rgba(59, 130, 246, 0.5)" : alpha(PRIMARY_COLOR, 0.5),
                  color: isDark ? "#60a5fa" : PRIMARY_COLOR,
                  bgcolor: isDark ? "rgba(59, 130, 246, 0.08)" : alpha(PRIMARY_COLOR, 0.04),
                  fontWeight: 700,
                  fontSize: "0.8rem",
                  textTransform: "none",
                  "&:hover": {
                    borderStyle: "dashed",
                    borderColor: isDark ? "#60a5fa" : PRIMARY_COLOR,
                    bgcolor: isDark ? "rgba(59, 130, 246, 0.18)" : alpha(PRIMARY_COLOR, 0.12),
                  },
                }}
              >
                + Assign
              </Button>
            );
          })()}
        </TableCell>
        <TableCell><Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "inherit" }}>{formatDate(lead.createdAt, "MMM dd, yyyy")}</Typography></TableCell>
        <TableCell align="center">
          <LeadActionMenu
            lead={lead}
            permissions={permissions}
            onEdit={openEditDialog}
            onQuickView={openViewDialog}
            onViewDetails={openLeadDetailsPage}
            onViewVisitPipeline={(item) => navigate("/total-visits", { state: { highlightLeadId: item._id } })}
            onCreateQuote={handleCreateQuote}
            onAssign={openAssignDialog}
            onConvertToProject={handleConvertToProject}
            onUnsupportedAction={handleUnsupportedLeadAction}
          />
        </TableCell>
      </TableRow>
    );
  }, [selectedLeads, permissions, handleSelectLead, openLeadDetailsPage, openViewDialog, openAssignDialog, handleCreateQuote, handleConvertToProject, handleUnsupportedLeadAction, navigate, isDark]);

  const renderCardView = useCallback(() => {
    if (loading) return <LoadingSkeleton count={6} isMobile={isMobile} />;
    if (leads.length === 0) return <EmptyState title={hasFilters ? "No matching leads found" : "No leads yet"} description={hasFilters ? "Try adjusting your filters" : "Get started by creating your first lead"} icon={hasFilters ? Search : Person} action={hasFilters && <Button onClick={handleResetFilters} variant="outlined" sx={{ borderColor: PRIMARY_COLOR, color: PRIMARY_COLOR }}>Clear Filters</Button>} />;
    return (
      <Box sx={{ p: { xs: 1, sm: 2 } }}>
        {leads.map((lead) => <MobileLeadCard key={lead._id} lead={lead} onView={openViewDialog} onEdit={openEditDialog} onAssign={openAssignDialog} onDelete={handleDeleteSingleLead} onConvertToProject={handleConvertToProject} permissions={permissions} />)}
      </Box>
    );
  }, [loading, leads, hasFilters, permissions, openViewDialog, openEditDialog, openAssignDialog, handleDeleteSingleLead, handleConvertToProject, isMobile, handleResetFilters]);

  const summaryCards = useMemo(() => ([
    {
      label: "Need follow-up today",
      value: overviewStats.followUpToday || 0,
      caption: "Reminders due today or overdue",
      action: "View list",
      icon: <Warning />,
      gradientBorder: "linear-gradient(135deg, #f97316 0%, #3b82f6 35%, #60a5fa 70%, #818cf8 100%)",
      backgroundDark: "radial-gradient(circle at 40% 40%, #1e3a8a 0%, #0d1a3e 50%, #070d1a 100%)",
      backgroundLight: "#fff",
      borderColorLight: alpha("#f97316", 0.3),
      actionColor: "#f97316",
      textOnDark: true,
      onClick: handleViewTodayFollowUps,
    },
    {
      label: "New leads",
      value: overviewStats.newLeads || overviewStats.activeLeads || 0,
      caption: "Fresh in the pipeline - assign & engage",
      action: "Assign now",
      icon: <AssignmentInd />,
      gradientBorder: "linear-gradient(135deg, #3b82f6 0%, #60a5fa 50%, #38bdf8 100%)",
      backgroundDark: "radial-gradient(circle at 40% 40%, #1d4ed8 0%, #0d1a3e 50%, #070d1a 100%)",
      backgroundLight: "#fff",
      borderColorLight: alpha("#94a3b8", 0.25),
      actionColor: isDark ? "#60a5fa" : "#1d4ed8",
      textOnDark: isDark,
      onClick: handleViewNewLeads,
    },
    {
      label: "Site visits scheduled",
      value: visitSummary.scheduledVisits || 0,
      caption: "Inspector visits coming up",
      action: "View calendar",
      icon: <CalendarToday />,
      gradientBorder: "linear-gradient(135deg, #10b981 0%, #34d399 50%, #38bdf8 100%)",
      backgroundDark: "radial-gradient(circle at 40% 40%, #047857 0%, #092820 50%, #070d1a 100%)",
      backgroundLight: "#fff",
      borderColorLight: alpha("#94a3b8", 0.25),
      actionColor: isDark ? "#34d399" : "#047857",
      textOnDark: isDark,
      onClick: handleViewVisitCalendar,
    },
  ]), [handleViewNewLeads, handleViewTodayFollowUps, handleViewVisitCalendar, overviewStats, visitSummary.scheduledVisits, isDark]);

  const pipelineQuarterCards = useMemo(() => {
    const counts = overviewStats.pipelineThisQuarter || {};
    const total = counts.all || 0;
    return PIPELINE_STAGES.map((stage) => ({
      ...stage,
      value: counts[stage.key] || 0,
      total,
      percent: total > 0 ? Math.round(((counts[stage.key] || 0) / total) * 100) : 0,
    }));
  }, [overviewStats.pipelineThisQuarter]);

  const selectedPipelineStage = useMemo(() => {
    if (!quickFilter.startsWith("pipeline:")) return null;
    const selectedKey = quickFilter.replace("pipeline:", "");
    return pipelineQuarterCards.find((card) => card.key === selectedKey) || null;
  }, [pipelineQuarterCards, quickFilter]);

  const isPipelineCardActive = useCallback((card) => {
    if (card.key === "all") return statusFilter === "all" && !quickFilter;
    return quickFilter === `pipeline:${card.key}` || (quickFilter === "" && statusFilter === card.status);
  }, [quickFilter, statusFilter]);

  return (
    <Box ref={containerRef} sx={{ p: { xs: 1.5, sm: 2, md: 3 }, minHeight: "100vh", pb: { xs: 8, sm: 3 }, bgcolor: isDark ? "#06090e" : "#f8fafc" }}>
      <MobileFilterDrawer open={mobileFilterOpen} onClose={() => setMobileFilterOpen(false)} period={period} setPeriod={setPeriod} statusFilter={statusFilter} setStatusFilter={setStatusFilter} handleClearFilters={handleClearFiltersMobile} searchQuery={searchTerm} setSearchQuery={setSearchTerm} activeFilterCount={activeFilterCount} />
      <ConvertProjectDialog
        open={projectDialogOpen}
        lead={projectDialogLead}
        quotations={projectDialogQuotations}
        submitting={projectDialogSubmitting}
        onClose={closeProjectDialog}
        onCreateQuotation={handleProjectDialogCreateQuotation}
        onCreateWithoutQuotation={(projectDetails) => completeProjectConversion(projectDialogLead, null, projectDetails)}
        onContinueWithQuotation={(quotation, projectDetails) => completeProjectConversion(projectDialogLead, quotation, projectDetails)}
      />

      {/* Header */}
      <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, mb: 3, borderRadius: 4, background: isDark ? "linear-gradient(135deg, #0b1329 0%, #0d1b3e 100%)" : GRADIENT_MAIN, border: isDark ? "1px solid rgba(59, 130, 246, 0.25)" : "none", color: "#fff", boxShadow: "0 24px 44px rgba(15,31,61,0.18)" }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }}>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ background: "linear-gradient(135deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.08) 100%)", color: "#fff", width: 52, height: 52, border: "1px solid rgba(255,255,255,0.18)" }}><Groups /></Avatar>
            <Box>
              <Typography variant={isMobile ? "h6" : "h5"} fontWeight={800} gutterBottom>Lead Management</Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, fontSize: { xs: "0.75rem", sm: "0.875rem" } }}>Total {totalLeads} leads • {permissions.label} view</Typography>
            </Box>
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            {isMobile && (
              <Button variant="contained" startIcon={<FilterAlt />} onClick={() => setMobileFilterOpen(true)} size="small" sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "#fff", "&:hover": { bgcolor: "rgba(255,255,255,0.3)" }, position: "relative" }}>
                Filter
                {activeFilterCount > 0 && <Badge badgeContent={activeFilterCount} color="error" sx={{ position: "absolute", top: -8, right: -8, "& .MuiBadge-badge": { fontSize: "0.6rem", minWidth: 16, height: 16 } }} />}
              </Button>
            )}
            <Button variant="contained" startIcon={<Add />} onClick={addLeads} size={isMobile ? "small" : "medium"} sx={{ background: "linear-gradient(45deg, #f97316 0%, #ea580c 100%)", color: "#fff", fontWeight: 700, borderRadius: 2.5, "&:hover": { background: "linear-gradient(45deg, #ea580c 0%, #c2410c 100%)" } }}>+ Add Lead</Button>
          </Box>
        </Stack>
      </Paper>

      <Grid container spacing={2.25} sx={{ mb: 3 }}>
        {summaryCards.map((card) => (
          <Grid item xs={12} md={4} key={card.label}>
            <Paper
              elevation={0}
              onClick={card.onClick}
              sx={{
                overflow: "hidden",
                borderRadius: "16px",
                px: { xs: 2.25, sm: 2.5 },
                py: { xs: 2.25, sm: 2.5 },
                minHeight: 154,
                position: "relative",
                background: isDark
                  ? `${card.backgroundDark} padding-box, ${card.gradientBorder} border-box`
                  : card.backgroundLight,
                border: isDark
                  ? "1.5px solid transparent"
                  : `1px solid ${card.borderColorLight}`,
                boxShadow: isDark
                  ? "0 18px 40px rgba(5, 10, 24, 0.65), inset 0 1px 1px rgba(255, 255, 255, 0.12)"
                  : "0 14px 30px rgba(15,23,42,0.04)",
                cursor: "pointer",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
                "&:hover": {
                  transform: "translateY(-3px)",
                  boxShadow: isDark
                    ? "0 22px 50px rgba(30, 58, 138, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.18)"
                    : "0 18px 36px rgba(15,23,42,0.08)",
                },
              }}
            >
              <Stack direction="row" spacing={2} alignItems="flex-start">
                <Box
                  sx={{
                    width: 54,
                    height: 54,
                    borderRadius: "50%",
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                    bgcolor: isDark ? "rgba(255, 255, 255, 0.08)" : alpha(card.actionColor, 0.1),
                    border: isDark ? "1px solid rgba(255, 255, 255, 0.16)" : "none",
                    boxShadow: isDark ? "inset 0 0 12px rgba(255, 255, 255, 0.05), 0 4px 12px rgba(0,0,0,0.3)" : "none",
                  }}
                >
                  {React.cloneElement(card.icon, { sx: { color: isDark ? "#fff" : card.actionColor, fontSize: 24 } })}
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{
                    fontSize: { xs: "2.1rem", sm: "2.35rem" },
                    fontWeight: 900,
                    lineHeight: 1,
                    color: isDark ? "#fff" : "#0f172a",
                  }}>
                    {card.value}
                  </Typography>
                  <Typography sx={{
                    mt: 0.5, fontSize: "1.02rem", fontWeight: 800, lineHeight: 1.25,
                    color: isDark ? "#fff" : "#020617",
                  }}>
                    {card.label}
                  </Typography>
                  <Typography sx={{
                    mt: 0.7, fontSize: "0.84rem", lineHeight: 1.4,
                    color: isDark ? "rgba(203, 213, 225, 0.8)" : "#64748b",
                  }}>
                    {card.caption}
                  </Typography>
                  <Button
                    size="small"
                    endIcon={<OpenInNew sx={{ fontSize: 13 }} />}
                    onClick={(event) => { event.stopPropagation(); card.onClick(); }}
                    sx={{
                      mt: 0.8, p: 0, minWidth: 0,
                      color: card.actionColor,
                      fontWeight: 900, fontSize: "0.85rem", textTransform: "none",
                      "& .MuiButton-endIcon": { ml: 0.4 },
                      "&:hover": { bgcolor: "transparent", textDecoration: "underline" },
                    }}
                  >
                    {card.action}
                  </Button>
                </Box>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Paper
        elevation={0}
        sx={{
          mb: 3,
          p: { xs: 2, md: 3 },
          borderRadius: "14px",
          bgcolor: isDark ? "#0b101c" : "#fff",
          border: isDark ? "1px solid rgba(59, 130, 246, 0.15)" : `1px solid ${alpha("#94a3b8", 0.28)}`,
          boxShadow: "none",
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2} sx={{ mb: 2.3 }}>
          <Box>
            <Typography sx={{ fontSize: "1rem", fontWeight: 900, color: isDark ? "#f8fafc" : "#0f172a", lineHeight: 1.2 }}>
              Lead pipeline
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.25} alignItems="center">
            <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: isDark ? "#94a3b8" : "#475569" }}>
              Click a stage to filter
            </Typography>
            {(statusFilter !== "all" || quickFilter) && (
              <Button
                size="small"
                startIcon={<Close sx={{ fontSize: 14 }} />}
                onClick={handleResetFilters}
                sx={{ color: isDark ? "#60a5fa" : PRIMARY_COLOR, fontWeight: 800, fontSize: "0.76rem", textTransform: "none", px: 0.75 }}
              >
                Clear
              </Button>
            )}
          </Stack>
        </Stack>

        <Box sx={{ overflowX: "auto", scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" } }}>
          <Stack direction="row" spacing={1} sx={{ minWidth: { xs: 1120, lg: "100%" } }}>
            {pipelineQuarterCards.map((card) => {
              const isActive = isPipelineCardActive(card);
              const style = PIPELINE_STAGE_STYLE[card.key] || PIPELINE_STAGE_STYLE.all;
              const isAll = card.key === "all";
              const activeDark = isAll && isActive;

              return (
                <Tooltip
                  key={card.key}
                  title={`${card.label} - ${card.value} lead${card.value !== 1 ? "s" : ""}${card.total ? ` (${card.percent}%)` : ""}`}
                >
                  <Box
                    onClick={() => handlePipelineStageFilter(card)}
                    sx={{
                      flex: style.flex,
                      minWidth: card.key === "projectConverted" ? 152 : 136,
                      px: 1.35,
                      py: 1.1,
                      borderRadius: "12px",
                      cursor: "pointer",
                      border: isDark
                        ? `1.5px solid ${isActive ? "#2563eb" : "#1c2842"}`
                        : `1.5px solid ${isActive && !activeDark ? style.icon : "#dbe3ef"}`,
                      bgcolor: isDark
                        ? (isActive ? "rgba(37, 99, 235, 0.25)" : "#0c1322")
                        : (activeDark ? "#263d63" : isActive ? alpha(style.icon, 0.07) : "#fafbfe"),
                      color: isDark ? "#f8fafc" : (activeDark ? "#fff" : "#0f172a"),
                      transition: "all 0.15s ease",
                      "&:hover": {
                        borderColor: isDark ? "#2563eb" : (activeDark ? "#263d63" : style.icon),
                        bgcolor: isDark ? "rgba(37, 99, 235, 0.3)" : (activeDark ? "#263d63" : alpha(style.icon, 0.06)),
                      },
                    }}
                  >
                    <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.5, minWidth: 0 }}>
                      <Box
                        sx={{
                          width: 22,
                          height: 22,
                          borderRadius: "7px",
                          bgcolor: activeDark ? "transparent" : (isDark ? "rgba(59, 130, 246, 0.2)" : alpha(style.icon, 0.14)),
                          color: activeDark ? "#fff" : (isDark ? "#60a5fa" : style.icon),
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {React.cloneElement(card.icon, {
                          sx: { fontSize: 13, color: "inherit" },
                        })}
                      </Box>
                      <Typography sx={{ fontSize: "1.25rem", fontWeight: 900, color: activeDark ? "#fff" : (isDark ? "#60a5fa" : style.icon), lineHeight: 1 }}>
                        {card.value}
                      </Typography>
                    </Stack>

                    <Typography
                      sx={{
                        fontSize: "0.73rem",
                        fontWeight: 800,
                        color: isDark ? "#94a3b8" : (activeDark ? alpha("#fff", 0.86) : "#334155"),
                        lineHeight: 1.15,
                        display: "-webkit-box",
                        overflow: "hidden",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {isAll ? "All Leads" : card.label}
                    </Typography>
                  </Box>
                </Tooltip>
              );
            })}
          </Stack>
        </Box>
      </Paper>
    {/* ===== DESKTOP FILTERS ===== */}
{!isMobile && (
  <Card sx={{ mb: 3, borderRadius: 4, bgcolor: isDark ? "#0b101c" : "#fff", border: isDark ? "1px solid rgba(59, 130, 246, 0.15)" : `1px solid ${alpha(PRIMARY_COLOR, 0.08)}`, boxShadow: "none" }}>
    <CardContent sx={{ p: "16px 20px !important" }}>

      {/* Row 1: Search · Period pills · Status select · View toggle */}
      <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">

        {/* Search */}
        <TextField
          placeholder="Search leads by name, email, phone…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          sx={{
            flex: 1, minWidth: 220,
            "& .MuiOutlinedInput-root": {
              borderRadius: 999,
              bgcolor: isDark ? "#0e1628" : alpha("#64748b", 0.06),
              color: isDark ? "#f8fafc" : "inherit",
              "& fieldset": { borderColor: isDark ? "rgba(59, 130, 246, 0.2)" : alpha(PRIMARY_COLOR, 0.12) },
              "&:hover fieldset": { borderColor: isDark ? "#2563eb" : alpha(PRIMARY_COLOR, 0.3) },
              "&.Mui-focused fieldset": { borderColor: "#2563eb", borderWidth: 1 },
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ fontSize: 18, color: isDark ? "#64748b" : "text.secondary" }} />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchTerm("")} edge="end">
                  <Close fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        {/* Period pills */}
        <Stack direction="row" spacing={0.75}>
          {PERIOD_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              size="small"
              onClick={() => { setPeriod(opt.value); setPage(0); }}
              sx={{
                borderRadius: 999,
                px: 1.75,
                height: 34,
                fontSize: "0.75rem",
                fontWeight: 600,
                textTransform: "none",
                border: `1px solid ${period === opt.value ? "transparent" : isDark ? "rgba(59, 130, 246, 0.2)" : alpha(PRIMARY_COLOR, 0.14)}`,
                background: period === opt.value ? GRADIENT_BLUE : (isDark ? "#0e1628" : alpha("#64748b", 0.06)),
                color: period === opt.value ? "#fff" : (isDark ? "#94a3b8" : PRIMARY_COLOR),
                boxShadow: "none",
                "&:hover": {
                  background: period === opt.value ? GRADIENT_BLUE : (isDark ? "rgba(59, 130, 246, 0.15)" : alpha(PRIMARY_COLOR, 0.08)),
                  boxShadow: "none",
                },
              }}
            >
              {opt.label}
            </Button>
          ))}
        </Stack>

        {/* Status select */}
        <FormControl size="small" sx={{ minWidth: 170 }}>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            displayEmpty
            sx={{
              borderRadius: 999,
              bgcolor: isDark ? "#0e1628" : alpha("#64748b", 0.06),
              color: isDark ? "#f8fafc" : "inherit",
              fontSize: "0.8rem",
              "& .MuiOutlinedInput-notchedOutline": { borderColor: isDark ? "rgba(59, 130, 246, 0.2)" : alpha(PRIMARY_COLOR, 0.12) },
              "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: isDark ? "#2563eb" : alpha(PRIMARY_COLOR, 0.3) },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#2563eb", borderWidth: 1 },
            }}
          >
            <MenuItem value="all">All statuses</MenuItem>
            {LEAD_STATUS_OPTIONS.map((s) => (
              <MenuItem key={s} value={s}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box sx={{ color: getStatusColor(s).color, display: "flex", fontSize: 16 }}>
                    {getStatusColor(s).icon}
                  </Box>
                  {s}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* View toggle + refresh */}
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Tooltip title="Table view">
            <IconButton
              size="small"
              onClick={() => setViewMode("table")}
              sx={{
                width: 34, height: 34, borderRadius: 2,
                bgcolor: viewMode === "table" ? alpha(PRIMARY_COLOR, 0.1) : alpha("#64748b", 0.06),
                color: viewMode === "table" ? PRIMARY_COLOR : "text.secondary",
                border: `0.5px solid ${viewMode === "table" ? alpha(PRIMARY_COLOR, 0.2) : alpha("#64748b", 0.12)}`,
              }}
            >
              <TableChart sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Grid view">
            <IconButton
              size="small"
              onClick={() => setViewMode("grid")}
              sx={{
                width: 34, height: 34, borderRadius: 2,
                bgcolor: viewMode === "grid" ? alpha(PRIMARY_COLOR, 0.1) : alpha("#64748b", 0.06),
                color: viewMode === "grid" ? PRIMARY_COLOR : "text.secondary",
                border: `0.5px solid ${viewMode === "grid" ? alpha(PRIMARY_COLOR, 0.2) : alpha("#64748b", 0.12)}`,
              }}
            >
              <GridView sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          <Box sx={{ width: "1px", height: 24, bgcolor: alpha("#64748b", 0.15), mx: 0.5 }} />
          <Tooltip title="Refresh">
            <IconButton size="small" onClick={fetchLeads}
              sx={{ width: 34, height: 34, borderRadius: 2, bgcolor: alpha("#64748b", 0.06), border: `0.5px solid ${alpha("#64748b", 0.12)}` }}>
              <Refresh sx={{ fontSize: 18, color: "text.secondary" }} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {/* Row 2: Active filter chips */}
      {activeFilterCount > 0 && (
        <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap"
          sx={{ mt: 1.5, pt: 1.5, borderTop: `0.5px solid ${alpha("#64748b", 0.1)}` }}>
          <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>
            Filters:
          </Typography>
          {searchTerm && (
            <Chip
              label={`Search: ${searchTerm}`}
              size="small"
              onDelete={() => setSearchTerm("")}
              sx={{ height: 26, fontSize: "0.72rem", bgcolor: "#eff6ff", color: PRIMARY_COLOR,
                border: `0.5px solid ${alpha(PRIMARY_COLOR, 0.2)}`, "& .MuiChip-deleteIcon": { color: alpha(PRIMARY_COLOR, 0.5) } }}
            />
          )}
          {statusFilter !== "all" && (
            <Chip
              label={`Status: ${statusFilter}`}
              size="small"
              onDelete={() => setStatusFilter("all")}
              sx={{ height: 26, fontSize: "0.72rem", bgcolor: "#eff6ff", color: PRIMARY_COLOR,
                border: `0.5px solid ${alpha(PRIMARY_COLOR, 0.2)}`, "& .MuiChip-deleteIcon": { color: alpha(PRIMARY_COLOR, 0.5) } }}
            />
          )}
          {period !== "All" && (
            <Chip
              label={`Period: ${period}`}
              size="small"
              onDelete={() => setPeriod("All")}
              sx={{ height: 26, fontSize: "0.72rem", bgcolor: "#eff6ff", color: PRIMARY_COLOR,
                border: `0.5px solid ${alpha(PRIMARY_COLOR, 0.2)}`, "& .MuiChip-deleteIcon": { color: alpha(PRIMARY_COLOR, 0.5) } }}
            />
          )}
          {quickFilter === "followUpToday" && (
            <Chip
              label="Follow-up: Today"
              size="small"
              onDelete={() => setQuickFilter("")}
              sx={{ height: 26, fontSize: "0.72rem", bgcolor: "#fff7ed", color: "#c2410c",
                border: `0.5px solid ${alpha("#f97316", 0.25)}`, "& .MuiChip-deleteIcon": { color: alpha("#c2410c", 0.5) } }}
            />
          )}
          {selectedPipelineStage && (
            <Chip
              label={`Pipeline: ${selectedPipelineStage.label}`}
              size="small"
              onDelete={() => setQuickFilter("")}
              sx={{ height: 26, fontSize: "0.72rem", bgcolor: "#eff6ff", color: PRIMARY_COLOR,
                border: `0.5px solid ${alpha(PRIMARY_COLOR, 0.2)}`, "& .MuiChip-deleteIcon": { color: alpha(PRIMARY_COLOR, 0.5) } }}
            />
          )}
          <Chip
            label="Clear all"
            size="small"
            variant="outlined"
            onClick={handleResetFilters}
            sx={{ height: 26, fontSize: "0.72rem", borderColor: alpha(PRIMARY_COLOR, 0.3), color: PRIMARY_COLOR,
              cursor: "pointer", "&:hover": { bgcolor: alpha(PRIMARY_COLOR, 0.05) } }}
          />
        </Stack>
      )}

      {/* Row 3: Bulk action bar */}
      {selectedCount > 0 && (
        <Box sx={{
          mt: 1.5, px: 2, py: 1.25, borderRadius: 2,
          bgcolor: "#eff6ff",
          border: `1px solid ${alpha(PRIMARY_COLOR, 0.14)}`,
          display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1.5,
        }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2" fontWeight={600} color={PRIMARY_COLOR}>
              {selectedCount} lead{selectedCount !== 1 ? "s" : ""} selected
            </Typography>
            <Button size="small" onClick={handleClearSelection} startIcon={<Clear sx={{ fontSize: 14 }} />}
              sx={{ color: "text.secondary", minWidth: 0, textTransform: "none", fontSize: "0.75rem" }}>
              Clear
            </Button>
          </Stack>
          <Stack direction="row" spacing={1}>
            {permissions.assign && (
              <Button size="small" variant="outlined" startIcon={<AssignmentInd sx={{ fontSize: 15 }} />}
                onClick={openBulkAssignDialog}
                sx={{ height: 30, fontSize: "0.75rem", borderRadius: 1.5, borderColor: alpha(PRIMARY_COLOR, 0.3),
                  color: PRIMARY_COLOR, textTransform: "none", "&:hover": { borderColor: PRIMARY_COLOR } }}>
                Assign selected
              </Button>
            )}
            {permissions.export && (
              <Button size="small" variant="outlined" startIcon={<Send sx={{ fontSize: 15 }} />}
                onClick={handleExport}
                sx={{ height: 30, fontSize: "0.75rem", borderRadius: 1.5, borderColor: alpha(PRIMARY_COLOR, 0.3),
                  color: PRIMARY_COLOR, textTransform: "none", "&:hover": { borderColor: PRIMARY_COLOR } }}>
                Export
              </Button>
            )}
            {permissions.delete && (
              <Button size="small" variant="outlined" startIcon={<Delete sx={{ fontSize: 15 }} />}
                onClick={openDeleteDialog}
                sx={{ height: 30, fontSize: "0.75rem", borderRadius: 1.5, borderColor: alpha("#ef4444", 0.3),
                  color: "#dc2626", textTransform: "none", "&:hover": { borderColor: "#ef4444", bgcolor: alpha("#ef4444", 0.04) } }}>
                Delete selected
              </Button>
            )}
          </Stack>
        </Box>
      )}

    </CardContent>
  </Card>
)}

      {/* Mobile Search */}
      {isMobile && (
        <Box sx={{ mb: 2 }}>
          <TextField fullWidth size="small" placeholder="Search leads..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment>, endAdornment: searchTerm && <InputAdornment position="end"><IconButton size="small" onClick={() => setSearchTerm("")}><Close /></IconButton></InputAdornment> }}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 999, bgcolor: "#fff", "&.Mui-focused": { boxShadow: FOCUS_RING } } }} />
        </Box>
      )}

      {/* Content */}
      <Paper elevation={0} sx={{ borderRadius: 3, overflow: "hidden", bgcolor: isDark ? "#0b101c" : "#fff", border: isDark ? "1px solid rgba(59, 130, 246, 0.15)" : "none" }}>
        <Box sx={{ p: { xs: 2, sm: 3 }, borderBottom: 1, borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "divider", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2, bgcolor: isDark ? "#090f1d" : "#fff" }}>
          <Typography variant="h6" fontWeight={700} sx={{ fontSize: { xs: "1rem", sm: "1.25rem" }, color: isDark ? "#f8fafc" : "inherit" }}>
            {viewMode === "table" ? "Lead List" : "Lead Cards"}
            <Chip label={`${totalLeads} total`} size="small" sx={{ ml: 1, background: isDark ? "rgba(37, 99, 235, 0.25)" : "linear-gradient(135deg, rgba(37,99,235,0.14) 0%, rgba(96,165,250,0.24) 100%)", color: isDark ? "#60a5fa" : PRIMARY_COLOR, border: `1px solid ${isDark ? "rgba(59, 130, 246, 0.3)" : alpha(PRIMARY_COLOR, 0.12)}` }} />
          </Typography>
          {!isMobile && viewMode === "table" && (
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="body2" sx={{ color: isDark ? "#94a3b8" : "text.secondary" }}>Rows per page:</Typography>
              <Select size="small" value={rowsPerPage} onChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} sx={{ minWidth: 80, bgcolor: isDark ? "#0e1628" : "inherit", color: isDark ? "#f8fafc" : "inherit" }}>
                {[5, 10, 25, 50].map((option) => <MenuItem key={option} value={option}>{option}</MenuItem>)}
              </Select>
            </Stack>
          )}
        </Box>

        {viewMode === "table" && !isMobile ? (
          <>
            <TableContainer>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox" sx={getTableHeaderCellSx(isDark)}>{permissions.bulkActions && <Checkbox indeterminate={selectedCount > 0 && selectedCount < leads.length} checked={selectAll} onChange={handleSelectAll} sx={{ color: isDark ? "#60a5fa" : PRIMARY_COLOR, "&.Mui-checked": { color: isDark ? "#60a5fa" : PRIMARY_COLOR } }} />}</TableCell>
                    {[{ label: "Lead", key: "firstName", sortable: true }, { label: "Contact", sortable: false }, { label: "Status", key: "status", sortable: true }, { label: "Assigned To", key: "assignedUser", sortable: true }, { label: "Created Date", key: "createdAt", sortable: true }, { label: "Actions", sortable: false }].map((col) => (
                      <TableCell key={col.label} sx={getTableHeaderCellSx(isDark)}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="subtitle2" fontWeight={700} sx={{ color: isDark ? "#94a3b8" : "#5f6b80" }}>{col.label}</Typography>
                          {col.sortable && <IconButton size="small" onClick={() => handleSort(col.key)} sx={{ color: sortBy === col.key ? (isDark ? "#60a5fa" : PRIMARY_COLOR) : "inherit" }}><Sort /></IconButton>}
                        </Box>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? <TableRow><TableCell colSpan={7}><LoadingSkeleton count={rowsPerPage} /></TableCell></TableRow>
                    : leads.length === 0 ? <TableRow><TableCell colSpan={7}><EmptyState title={hasFilters ? "No matching leads found" : "No leads yet"} description={hasFilters ? "Try adjusting your filters" : "Get started by creating your first lead"} icon={hasFilters ? Search : Person} action={hasFilters && <Button onClick={handleResetFilters} variant="outlined" sx={{ borderColor: PRIMARY_COLOR, color: PRIMARY_COLOR }}>Clear Filters</Button>} /></TableCell></TableRow>
                    : leads.map(renderTableRow)}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination component="div" count={totalLeads} page={page} onPageChange={handleChangePage} rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} rowsPerPageOptions={[5, 10, 25, 50]} sx={{ borderTop: 1, borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "divider", color: isDark ? "#94a3b8" : "inherit" }} />
          </>
        ) : renderCardView()}
      </Paper>

      {/* Role Info Button */}
      {!isMobile && (
        <Box sx={{ position: "fixed", bottom: 16, right: 16, zIndex: 10 }}>
          <Tooltip title="View Role Permissions">
            <Button variant="contained" onClick={() => setShowRoleInfo(true)} startIcon={<Security />} sx={{ borderRadius: 999, px: 2, py: 0.8, background: "linear-gradient(45deg, #f97316 0%, #ea580c 100%)", color: "#fff", fontWeight: 700, textTransform: "none", boxShadow: "0 6px 18px rgba(249, 115, 22, 0.4)", "&:hover": { background: "linear-gradient(45deg, #ea580c 0%, #c2410c 100%)" } }}>{permissions.label}</Button>
          </Tooltip>
        </Box>
      )}

      {/* Role Info Dialog */}
      <Dialog open={showRoleInfo} onClose={() => setShowRoleInfo(false)} maxWidth="sm" fullWidth fullScreen={isMobile}
        PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3, overflow: "hidden" } }}
        TransitionComponent={isMobile ? Slide : Fade} transitionDuration={300}>
        <ModalHeader icon={<Security />} title={`Your Permissions`} subtitle={permissions.label} color={PRIMARY_COLOR} onClose={() => setShowRoleInfo(false)} />
        <DialogContent sx={{ py: 3, px: { xs: 2.5, sm: 3.5 }, bgcolor: "#fafbff" }}>
          <Grid container spacing={2}>
            <Grid item xs={6}><PermissionIndicator permission={permissions.view} label="View Leads" /></Grid>
            <Grid item xs={6}><PermissionIndicator permission={permissions.edit} label="Edit Leads" /></Grid>
            <Grid item xs={6}><PermissionIndicator permission={permissions.assign} label="Assign Leads" /></Grid>
            <Grid item xs={6}><PermissionIndicator permission={permissions.delete} label="Delete Leads" /></Grid>
            <Grid item xs={6}><PermissionIndicator permission={permissions.bulkActions} label="Bulk Actions" /></Grid>
            <Grid item xs={6}><PermissionIndicator permission={permissions.export} label="Export" /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: { xs: 2.5, sm: 3.5 }, py: 2.5, borderTop: `1px solid ${alpha(PRIMARY_COLOR, 0.08)}`, bgcolor: "#fff" }}>
          <Button onClick={() => setShowRoleInfo(false)} variant="contained" sx={{ bgcolor: PRIMARY_COLOR, borderRadius: 2, fontWeight: 700, boxShadow: `0 4px 14px ${alpha(PRIMARY_COLOR, 0.35)}` }}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Modals */}
      <ViewLeadModal open={viewModalOpen} onClose={() => setViewModalOpen(false)} lead={leadToView} userRole={userRole} />
      <EditLeadModal open={editModalOpen} onClose={() => setEditModalOpen(false)} lead={leadToEdit} onSave={handleUpdateLead} userRole={userRole} />
      <AssignLeadModal open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)} lead={leadToAssign} onAssign={handleAssignLead} userRole={userRole} showSnackbar={showSnackbar} />
      <AssignLeadModal open={bulkAssignDialogOpen} onClose={() => setBulkAssignDialogOpen(false)} lead={null} onAssign={handleBulkAssign} userRole={userRole} isBulkAssign={true} bulkLeads={selectedLeadsData} showSnackbar={showSnackbar} />
      <DeleteConfirmationDialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} leadsToDelete={leadsToDelete} onDelete={handleDeleteLeads} userRole={userRole} />

      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))} anchorOrigin={{ vertical: isMobile ? "top" : "bottom", horizontal: isMobile ? "center" : "right" }}>
        <Alert onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))} severity={snackbar.severity} variant="filled" sx={{ width: "100%", borderRadius: 2, color: "#fff" }}>{snackbar.message}</Alert>
      </Snackbar>

      {/* Mobile FAB */}
      {isMobile && (
        <Zoom in={true}>
          <Fab color="primary" aria-label="filter" onClick={() => setMobileFilterOpen(true)}
            sx={{ position: "fixed", bottom: 80, right: 16, zIndex: 1000, bgcolor: PRIMARY_COLOR, "&:hover": { bgcolor: SECONDARY_COLOR }, boxShadow: `0 4px 12px ${alpha(PRIMARY_COLOR, 0.3)}` }}>
            <Badge badgeContent={activeFilterCount} color="error" max={9} sx={{ "& .MuiBadge-badge": { fontSize: "0.6rem", minWidth: 16, height: 16 } }}><FilterAlt /></Badge>
          </Fab>
        </Zoom>
      )}
    </Box>
  );
};

export default LeadOverview;
