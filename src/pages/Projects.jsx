import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  alpha,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  LinearProgress,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Popover,
  Select,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import {
  Add,
  AssignmentTurnedIn,
  Bolt,
  Build,
  CalendarMonth,
  Call,
  CloudUpload,
  Description,
  DescriptionOutlined,
  DirectionsCar,
  Edit,
  ElectricBolt,
  FactCheck,
  FilterAlt,
  FilterAltOff,
  Handshake,
  MoreVert,
  OpenInNew,
  Receipt,
  Refresh,
  Search,
  SolarPower,
  TableChart,
  TaskAlt,
  TrendingUp,
  ViewKanban,
  Visibility,
  Workspaces,
  EmailOutlined,
  ReceiptLongOutlined,
  PaidOutlined,
  FactCheckOutlined,
  SpeedOutlined,
  AccountBalanceOutlined,
  PriceCheckOutlined,
  VerifiedOutlined,
  RedeemOutlined,
  MonetizationOnOutlined,
} from "@mui/icons-material";
import { format, isThisWeek, parseISO } from "date-fns";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getProjectStage } from "../utils/projectStage";
import { getAcceptedOrLatestQuotation } from "../utils/quotationStorage";

// ── Design tokens ──────────────────────────────────────────────
const NAVY     = "#1e3a5f";
const NAVY_MID = "#1a3360";
const NAVY_LT  = "#243b6b";
const AMBER    = "#f59e0b";
const AMBER_LT = "#fcd34d";
const EMERALD  = "#059669";
const BLUE     = "#2563eb";
const RED      = "#ef4444";
const SURFACE  = "#f8fafd";
const BORDER   = "#e4eaf5";

// ── Stage config (now with icons) ───────────────────────────────
const PROJECT_STAGES = [
  { key: "lead_converted",        label: "Lead Converted",          color: EMERALD,   icon: Workspaces },
  { key: "registration",          label: "DISCOM Registration",     color: "#8b5cf6", icon: FactCheck },
  { key: "document",              label: "Document",                color: "#06b6d4", icon: DescriptionOutlined },
  { key: "payment",               label: "Payment",                 color: "#6366f1", icon: Receipt },
  { key: "loan_pending",          label: "Loan Pending",            color: AMBER,     icon: CalendarMonth },
  { key: "disbursement",          label: "Phase 1 Disbursement",    color: "#f97316", icon: TrendingUp },
  { key: "installation",          label: "Installation",            color: "#0ea5e9", icon: Bolt },
  { key: "dcr_generation",        label: "DCR Generation",          color: "#14b8a6", icon: TaskAlt },
  { key: "notification_email",    label: "Notification Email",      color: "#3b82f6", icon: EmailOutlined },
  { key: "demand_note",           label: "Demand Note",             color: "#8b5cf6", icon: ReceiptLongOutlined },
  { key: "demand_note_payment",   label: "Demand Note Payment",     color: "#10b981", icon: PaidOutlined },
  { key: "inspection",            label: "Inspection",              color: "#ec4899", icon: FactCheckOutlined },
  { key: "meter_installation",    label: "Meter Installation",      color: "#0284c7", icon: SpeedOutlined },
  { key: "phase2_disbursement",   label: "Phase 2 Disbursement",    color: "#f59e0b", icon: AccountBalanceOutlined },
  { key: "final_payment",         label: "Final Payment",           color: "#6366f1", icon: PriceCheckOutlined },
  { key: "project_commissioning",  label: "Project Commissioning",   color: "#10b981", icon: VerifiedOutlined },
  { key: "discom_approval",       label: "DISCOM Approval",         color: "#059669", icon: TaskAlt },
  { key: "subsidy_redeemed",      label: "Subsidy Redeemed",        color: "#f97316", icon: RedeemOutlined },
  { key: "subsidy_received",      label: "Subsidy Received",        color: "#059669", icon: MonetizationOnOutlined },
];

const PROJECT_PIPELINE_STAGES = [
  ...PROJECT_STAGES,
  { key: "ready_handover", label: "Ready Handover", color: EMERALD, icon: AssignmentTurnedIn },
];

const PROJECT_TYPE_FILTERS = [
  { key: "all", label: "All Projects", color: "#3b82f6", icon: Workspaces },
  { key: "residential", label: "Residential", color: "#10b981", icon: SolarPower },
  { key: "commercial", label: "Commercial", color: "#06b6d4", icon: ElectricBolt },
  { key: "ula_1kw_on_grid", label: "ULA 1KW On-Grid", color: "#a855f7", icon: Bolt },
  { key: "maintenance", label: "Maintenance", color: "#f59e0b", icon: Build },
  { key: "others", label: "Other", color: "#f97316", icon: Description },
];

const NEXT_ACTIONS = {
  lead_converted: "Lead converted to project",
  registration: "Registration completed or in progress",
  document:     "Document review or submission in progress",
  payment:      "Payment process started",
  loan_pending: "Loan approval or pending bank action",
  disbursement: "Phase 1 disbursement stage active",
  installation: "Installation work is in progress",
  dcr_generation: "DCR generation & module verification",
  notification_email: "Send notification email to DISCOM",
  demand_note: "Demand note generation & verification",
  demand_note_payment: "Demand note payment clearance",
  inspection: "Site inspection by RESCO / DISCOM",
  meter_installation: "Net meter installation & testing",
  phase2_disbursement: "Phase 2 loan / grant disbursement",
  final_payment: "Final customer settlement & payment",
  project_commissioning: "Plant commissioning & synchronization",
  discom_approval: "Final DISCOM approval certificate",
  subsidy_redeemed: "Subsidy redemption process",
  subsidy_received: "Subsidy credited to consumer",
  ready_handover: "Project completed — Customer handover done",
};

const PROJECT_STAGE_ROUTES = {
  lead_converted: "/all-leads",
  registration: "/registration",
  document: "/document-submission",
  payment: "/bank-loan-apply",
  loan_pending: "/bank-at-pending",
  disbursement: "/disbursement",
  installation: "/installation-completion",
  dcr_generation: "/projects",
  notification_email: "/projects",
  demand_note: "/projects",
  demand_note_payment: "/projects",
  inspection: "/projects",
  meter_installation: "/projects",
  phase2_disbursement: "/projects",
  final_payment: "/projects",
  project_commissioning: "/projects",
  discom_approval: "/projects",
  subsidy_redeemed: "/projects",
  subsidy_received: "/projects",
  ready_handover: "/projects",
};

const AMOUNT_RANGES = [
  { key: "all",      label: "Any amount", test: () => true },
  { key: "lt2",      label: "Below ₹2L",   test: (v) => v < 200000 },
  { key: "2to5",     label: "₹2L – ₹5L",   test: (v) => v >= 200000 && v < 500000 },
  { key: "5to10",    label: "₹5L – ₹10L",  test: (v) => v >= 500000 && v < 1000000 },
  { key: "gt10",     label: "Above ₹10L",  test: (v) => v >= 1000000 },
];

const ACTIVITY_FILTERS = [
  { key: "all",    label: "All projects" },
  { key: "stuck",  label: "Stuck 5+ days" },
  { key: "week",   label: "Installing this week" },
];

// ── Helpers ────────────────────────────────────────────────────
const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatDate = (value, pattern = "dd MMM yyyy") => {
  if (!value) return "Not set";
  try {
    return format(typeof value === "string" ? parseISO(value) : new Date(value), pattern);
  } catch { return "Not set"; }
};

const getProjectAmount = (p) => {
  if (!p) return 0;
  const quote = p?._id ? getAcceptedOrLatestQuotation(p._id) : null;
  const quoteCost = Number(quote?.totalCost) || Number(quote?.form?.totalCost) || 0;
  return Number(
    p.finalPaymentCost ||
    p.projectSaleValue ||
    p.totalProjectCost ||
    (quoteCost > 0 ? quoteCost : null) ||
    p.agreedPrice ||
    p.totalAmount ||
    p.projectValue ||
    p.quotationAmount ||
    p.loanAmount ||
    p.disbursementAmount ||
    p.paymentAmount ||
    0
  );
};

const getProjectDueAmount = (p) => {
  if (!p) return 0;
  // If due payment is cleared or project is in handover / subsidy received stages
  if (
    p.duePaymentCleared === "Yes" ||
    p.pipelineStage === "ready_handover" ||
    p.currentStage === "ready_handover" ||
    p.currentStage === "subsidy_received" ||
    p.status === "Handover" ||
    p.status === "ready_handover" ||
    p.status === "Subsidy Received"
  ) {
    return 0;
  }

  if (p.finalPaymentDue !== null && p.finalPaymentDue !== undefined && p.finalPaymentDue !== "") {
    return Math.max(0, Number(p.finalPaymentDue));
  }
  if (p.dueAmount !== null && p.dueAmount !== undefined && p.dueAmount !== "") {
    return Math.max(0, Number(p.dueAmount));
  }

  const total = getProjectAmount(p);
  if (total <= 0) return 0;

  // Calculate sum of payments recorded (Excluding demand note which is a separate DISCOM fee)
  const p1 = Number(p.paymentAmount || 0);
  const p2 = (p.disbursementStatus === "completed" || p.disbursementDate) ? Number(p.disbursementAmount || 0) : 0;
  const p4 = (p.phase2DisbursementPaid === "Yes" || p.phase2DisbursementDate) ? Number(p.phase2DisbursementAmount || 0) : 0;
  const calculatedReceived = p1 + p2 + p4;

  const totalReceived = Number(p.totalPaymentReceived || p.finalPaymentTotalReceived || 0);
  const received = totalReceived > 0 ? totalReceived : calculatedReceived;

  return Math.max(0, total - received);
};

const getDynamicNextAction = (project, stageKey) => {
  if (project?.nextAction && String(project.nextAction).trim()) return project.nextAction;
  if (project?.nextFollowUpAction && String(project.nextFollowUpAction).trim()) return project.nextFollowUpAction;
  if (project?.nextFollowUpNote && String(project.nextFollowUpNote).trim()) return project.nextFollowUpNote;

  const resolvedStage = stageKey || normalizeProjectStage(project);

  switch (resolvedStage) {
    case "lead_converted":
      return "Complete consumer portal registration";
    case "registration":
      if (project?.registrationStatus === "completed" || project?.consumerAccountNo) {
        return "Upload Aadhaar, PAN & electricity documents";
      }
      return "Registration completed or in progress";
    case "document":
      if (project?.documentStatus === "submitted" || project?.documentStatus === "approved") {
        return "Proceed to Bank Loan / Advance Payment";
      }
      return "Document review or submission in progress";
    case "payment":
      if (project?.paymentType === "Cash" || project?.paymentStatus === "completed") {
        return "Advance payment received — Schedule installation";
      }
      if (project?.loanStatus === "approved") {
        return "Bank loan approved — Await sanction letter";
      }
      return "Payment process started";
    case "loan_pending":
      if (project?.bankAtPendingStatus === "approved") {
        return "Bank sanctioned — Issue material & start installation";
      }
      return "Loan approval or pending bank action";
    case "installation":
      if (project?.installationStatus === "installation_completed") {
        return "Net meter installation & DISCOM commissioning";
      }
      if (project?.installationStatus === "sent_for_jee_verification" || project?.installationStatus === "jee_verified") {
        return "Awaiting JEE site verification & inspection";
      }
      if (project?.installationStatus === "meter_charge") {
        return "Pay DISCOM meter charges";
      }
      return "Installation work is in progress";
    case "disbursement":
      if (project?.disbursementStatus === "completed") {
        return "Phase 1 disbursement received — Ready for execution";
      }
      return "Phase 1 disbursement in progress";
    case "installation":
      if (project?.installationStatus === "installation_completed") {
        return "Installation completed — Proceed to DCR";
      }
      if (project?.installationStatus === "sent_for_jee_verification" || project?.installationStatus === "jee_verified") {
        return "Awaiting JEE site verification & inspection";
      }
      if (project?.installationStatus === "meter_charge") {
        return "Pay DISCOM meter charges";
      }
      return "Installation work is in progress";
    case "dcr_generation":
      return "Generate DCR certificate & upload serial numbers";
    case "notification_email":
      return "Submit notification email with work completion details";
    case "demand_note":
      return "Generate & verify DISCOM demand note";
    case "demand_note_payment":
      return "Process demand note fee payment";
    case "inspection":
      return "Schedule and complete technical site inspection";
    case "meter_installation":
      return "Install bidirectional / net solar meter";
    case "phase2_disbursement":
      return "Claim and process Phase 2 loan disbursement";
    case "final_payment":
      return "Collect remaining customer dues & settle final payment";
    case "project_commissioning":
      return "Commission the solar plant and energize system";
    case "discom_approval":
      return "Obtain official DISCOM commissioning report";
    case "subsidy_redeemed":
      return "Submit subsidy redemption on national portal";
    case "subsidy_received":
      return "Subsidy disbursed & credited to customer account";
    case "ready_handover":
    case "handover":
      return "Project completed — Customer handover done";
    default:
      return NEXT_ACTIONS[resolvedStage] || "Review and proceed to next project task";
  }
};

const getStageMeta = (key) => PROJECT_STAGES.find((s) => s.key === key) || PROJECT_STAGES[0];
const getPipelineStageMeta = (key) => PROJECT_PIPELINE_STAGES.find((s) => s.key === key) || PROJECT_PIPELINE_STAGES[0];
const normalizeProjectStage = (projectOrStage) => {
  const rawStage = typeof projectOrStage === "string" ? projectOrStage : getProjectStage(projectOrStage);
  if (rawStage === "visit") return "lead_converted";
  if (rawStage === "bank_loan") return "payment";
  if (rawStage === "handover") return "ready_handover";
  return rawStage;
};
const normalizePipelineStage = (projectOrStage) => {
  const rawStage = typeof projectOrStage === "string" ? projectOrStage : getProjectStage(projectOrStage);
  if (rawStage === "visit") return "lead_converted";
  if (rawStage === "bank_loan") return "payment";
  if (rawStage === "handover") return "ready_handover";
  return rawStage;
};
const getInitials   = (p) => `${p.firstName?.[0] || ""}${p.lastName?.[0] || ""}`.toUpperCase() || "P";
const getAssignedPerson = (project) => {
  const person = project.assignedUser || project.assignedManager;
  if (!person) return null;
  return {
    name: [person.firstName, person.lastName].filter(Boolean).join(" ") || "Unknown",
    role: person.role || "",
  };
};
const getRegistrationDateValue = (project) => project.dateOfRegistration || project.createdAt || project.updatedAt;
const getRegistrationStatusMeta = (status) => {
  const value = String(status || "").toLowerCase();
  if (value === "completed" || value === "approved" || value === "approval") {
    return { label: "Approval", bg: alpha(EMERALD, 0.12), color: EMERALD, icon: <AssignmentTurnedIn sx={{ fontSize: 14 }} /> };
  }
  if (value === "rejected") {
    return { label: "Rejected", bg: alpha(RED, 0.1), color: RED, icon: <DescriptionOutlined sx={{ fontSize: 14 }} /> };
  }
  return { label: "Pending", bg: alpha(AMBER, 0.12), color: "#9a6700", icon: <CalendarMonth sx={{ fontSize: 14 }} /> };
};
const getLeadStatusMeta = (status) => {
  const stage = normalizeProjectStage({ status });
  const meta = getStageMeta(stage);
  const LeadIcon = meta.icon;
  return {
    label: status || meta.label,
    bg: alpha(meta.color, 0.12),
    color: meta.color,
    icon: <LeadIcon sx={{ fontSize: 14 }} />,
  };
};
const isStuck = (p) => {
  const ref = p.updatedAt || p.projectConvertedAt || p.createdAt;
  if (!ref) return false;
  return Math.floor((Date.now() - new Date(ref).getTime()) / 86400000) > 5 && getProjectStage(p) !== "handover";
};

const getProjectName = (project) =>
  project?.projectType || project?.leadType || project?.requirementType || "Project type not selected";

const normalizeProjectType = (project) => {
  const raw = String(project?.projectType || project?.leadType || project?.requirementType || "").toLowerCase();
  if (raw.includes("residential")) return "residential";
  if (raw.includes("commercial")) return "commercial";
  if (raw.includes("ula") || raw.includes("1kw")) return "ula_1kw_on_grid";
  if (raw.includes("maintenance")) return "maintenance";
  if (raw.includes("other")) return "others";
  return "others";
};

const getProjectTypeMeta = (key) => PROJECT_TYPE_FILTERS.find((type) => type.key === key) || PROJECT_TYPE_FILTERS[0];

const getPersonName = (person) =>
  [person?.firstName, person?.lastName].filter(Boolean).join(" ") || "";

const mapWorksheetProjects = (worksheets = []) =>
  worksheets.flatMap((worksheet) => {
    const projects = Array.isArray(worksheet?.projects) ? worksheet.projects : [];
    return projects.map((project, index) => {
      const projectId = project?._id || `${worksheet?._id || "worksheet"}-${index}`;
      const customerName = project?.consumerName || project?.siteLocation || "APK Project";
      const createdDate = worksheet?.workDate || worksheet?.createdAt || new Date().toISOString();
      const projectCode = `APP-${formatDate(createdDate, "ddMMyy")}-${String(index + 1).padStart(2, "0")}`;

      return {
        ...project,
        _id: `worksheet-${worksheet?._id || "unknown"}-${projectId}`,
        source: "installerWorksheet",
        sourceLabel: "APK",
        worksheetId: worksheet?._id,
        worksheetProjectId: project?._id,
        projectCode,
        firstName: customerName,
        lastName: "",
        phone: project?.contactNo || "",
        city: project?.section || "",
        address: project?.address || project?.siteLocation || project?.gpsLocation?.address || "",
        email: "",
        status: "Visit",
        installationStatus: "",
        installationDate: worksheet?.workDate,
        projectConvertedAt: worksheet?.createdAt,
        createdAt: worksheet?.createdAt || worksheet?.workDate,
        updatedAt: worksheet?.updatedAt || worksheet?.createdAt || worksheet?.workDate,
        capacity: project?.capacityKw ? `${project.capacityKw} KW` : "",
        solarRequirement: project?.capacityKw ? `${project.capacityKw} KW` : project?.projectType,
        consumerAccountNo: project?.consumerAccountNo || "",
        assignedUser: project?.supervisor || worksheet?.user,
        assignedManager: worksheet?.user,
        supervisorName: getPersonName(project?.supervisor),
        createdByName: getPersonName(worksheet?.user),
        teammates: Array.isArray(project?.teammates) ? project.teammates : [],
      };
    });
  });

const stageIndex = (key) => PROJECT_STAGES.findIndex((s) => s.key === key);

const getProjectSortTime = (p) => {
  if (!p) return 0;
  const dates = [
    p.projectConvertedAt,
    p.createdAt,
    p.updatedAt,
    p.installationDate,
    p.workDate,
  ]
    .filter(Boolean)
    .map((d) => {
      const t = new Date(d).getTime();
      return isNaN(t) ? 0 : t;
    })
    .filter((t) => t > 0);

  if (dates.length > 0) {
    const primary = p.projectConvertedAt ? new Date(p.projectConvertedAt).getTime() : 0;
    const created = p.createdAt ? new Date(p.createdAt).getTime() : 0;
    const best = Math.max(isNaN(primary) ? 0 : primary, isNaN(created) ? 0 : created);
    if (best > 0) return best;
    return Math.max(...dates);
  }

  if (p.projectCode && typeof p.projectCode === "string") {
    const prjMatch = p.projectCode.match(/PRJ-(\d{4})(\d{2})-(\d+)/i);
    if (prjMatch) {
      const year = parseInt(prjMatch[1], 10);
      const month = parseInt(prjMatch[2], 10) - 1;
      const seq = parseInt(prjMatch[3], 10) || 0;
      return new Date(year, month, 1).getTime() + seq * 1000;
    }
    const appMatch = p.projectCode.match(/APP-(\d{2})(\d{2})(\d{2})-(\d+)/i);
    if (appMatch) {
      const day = parseInt(appMatch[1], 10);
      const month = parseInt(appMatch[2], 10) - 1;
      const year = 2000 + parseInt(appMatch[3], 10);
      const seq = parseInt(appMatch[4], 10) || 0;
      return new Date(year, month, day).getTime() + seq * 1000;
    }
  }

  return 0;
};

// ── Compact metric card ────────────────────────────────────────
const MetricCard = ({ icon, label, value, note, color, onClick }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Card
      onClick={onClick}
      sx={{
        borderRadius: "16px",
        border: isDark ? `1px solid ${alpha(color, 0.25)}` : `1px solid ${alpha(color, 0.18)}`,
        boxShadow: isDark ? `0 4px 20px ${alpha(color, 0.15)}` : "none",
        cursor: onClick ? "pointer" : "default",
        transition: "transform 0.15s, box-shadow 0.15s",
        "&:hover": onClick ? { transform: "translateY(-2px)", boxShadow: `0 8px 24px ${alpha(color, 0.25)}` } : {},
        bgcolor: isDark ? "#0b0e1a" : "#fff",
        color: isDark ? "#f8fafc" : "inherit",
      }}
    >
      <CardContent sx={{ p: "12px 16px !important" }}>
        <Stack direction="row" spacing={2} alignItems="flex-start">
          <Box
            sx={{
              width: 36, height: 36, borderRadius: "10px",
              bgcolor: isDark ? alpha(color, 0.2) : alpha(color, 0.1), color,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h5" fontWeight={800} color={isDark ? "#f8fafc" : NAVY} lineHeight={1}>
              {value}
            </Typography>
            <Typography variant="subtitle2" fontWeight={700} color={isDark ? "#f8fafc" : NAVY} sx={{ mt: 0.25 }}>
              {label}
            </Typography>
            <Typography variant="caption" color={isDark ? "#94a3b8" : "text.secondary"} sx={{ mt: 0.5, display: "block" }}>
              {note}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

// ── Row / card action menu ─────────────────────────────────────
const ActionMenu = ({ project, onOpen, onCall, onEdit, color }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [anchor, setAnchor] = useState(null);
  const close = () => setAnchor(null);

  return (
    <>
      <Tooltip title="More actions">
        <IconButton
          size="small"
          onClick={(e) => { e.stopPropagation(); setAnchor(e.currentTarget); }}
          sx={{ color: alpha(NAVY, 0.55), "&:hover": { bgcolor: alpha(NAVY, 0.06), color: NAVY } }}
        >
          <MoreVert sx={{ fontSize: 18 }} />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={close}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{ sx: { borderRadius: "12px", minWidth: 190, border: `1px solid ${BORDER}`, boxShadow: "0 12px 32px rgba(15,31,61,0.12)" } }}
      >
        <MenuItem onClick={() => { close(); onOpen(project); }} sx={{ fontSize: 13.5, fontWeight: 600, py: 1 }}>
          <ListItemIcon><OpenInNew sx={{ fontSize: 18, color: NAVY_LT }} /></ListItemIcon>
          <ListItemText>Open project</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { close(); onEdit?.(project); }} sx={{ fontSize: 13.5, fontWeight: 600, py: 1 }}>
          <ListItemIcon><Edit sx={{ fontSize: 18, color: NAVY_LT }} /></ListItemIcon>
          <ListItemText>Edit details</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { close(); onCall?.(project); }} sx={{ fontSize: 13.5, fontWeight: 600, py: 1 }}>
          <ListItemIcon><Call sx={{ fontSize: 18, color: EMERALD }} /></ListItemIcon>
          <ListItemText>Call customer</ListItemText>
        </MenuItem>
        <Divider sx={{ my: 0.5 }} />
        <MenuItem onClick={close} sx={{ fontSize: 13.5, fontWeight: 600, py: 1 }}>
          <ListItemIcon><TaskAlt sx={{ fontSize: 18, color }} /></ListItemIcon>
          <ListItemText>Mark stage complete</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};

// ── Kanban project card ────────────────────────────────────────
const RegistrationActionMenu = ({ project, onView, onEdit, onUpload }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [anchor, setAnchor] = useState(null);
  const close = () => setAnchor(null);

  return (
    <>
      <IconButton
        size="small"
        onClick={(event) => {
          event.stopPropagation();
          setAnchor(event.currentTarget);
        }}
        sx={{
          color: alpha(NAVY, 0.65),
          "&:hover": { bgcolor: alpha(NAVY, 0.06), color: NAVY },
        }}
      >
        <MoreVert sx={{ fontSize: 18 }} />
      </IconButton>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={close}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          sx: {
            borderRadius: "12px",
            minWidth: 190,
            border: `1px solid ${BORDER}`,
            boxShadow: "0 12px 32px rgba(15,31,61,0.12)",
          },
        }}
      >
        <MenuItem
          onClick={() => {
            close();
            onView(project);
          }}
          sx={{ fontSize: 13.5, fontWeight: 600, py: 1 }}
        >
          <ListItemIcon><OpenInNew sx={{ fontSize: 18, color: NAVY_LT }} /></ListItemIcon>
          <ListItemText>Open registration</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            close();
            onEdit(project);
          }}
          sx={{ fontSize: 13.5, fontWeight: 600, py: 1 }}
        >
          <ListItemIcon><Edit sx={{ fontSize: 18, color: BLUE }} /></ListItemIcon>
          <ListItemText>Edit registration</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            close();
            onUpload(project);
          }}
          sx={{ fontSize: 13.5, fontWeight: 600, py: 1 }}
        >
          <ListItemIcon><CloudUpload sx={{ fontSize: 18, color: EMERALD }} /></ListItemIcon>
          <ListItemText>Upload documents</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};

const RegistrationProjectRow = ({ project, highlight, onView, onEdit, onUpload, onCall }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const stageKey = normalizeProjectStage(project);
  const progress = ((stageIndex(stageKey) + 1) / PROJECT_STAGES.length) * 100;

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 1.75, md: 2.25 },
        borderRadius: 0,
        borderBottom: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${alpha(BORDER, 0.8)}`,
        bgcolor: highlight ? (isDark ? "rgba(16,185,129,0.1)" : alpha(EMERALD, 0.04)) : (isDark ? "#0e1220" : "#fff"),
        color: isDark ? "#f8fafc" : "inherit",
      }}
    >
      <Stack
        direction={{ xs: "column", lg: "row" }}
        spacing={{ xs: 1.75, lg: 2.5 }}
        alignItems={{ xs: "flex-start", lg: "center" }}
      >
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
          sx={{ width: { xs: "100%", lg: 320 }, minWidth: 0 }}
        >
          <Avatar
            sx={{
              width: 48,
              height: 48,
              fontSize: 18,
              fontWeight: 800,
              bgcolor: alpha("#8b5cf6", 0.12),
              color: "#6d28d9",
              flexShrink: 0,
            }}
          >
            {getInitials(project)}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={800} color={isDark ? "#f8fafc" : NAVY} noWrap>
              {project.projectCode || "Project"}
            </Typography>
            <Typography variant="caption" fontWeight={800} color="#8b5cf6" noWrap sx={{ display: "block", mt: 0.2 }}>
              {getProjectName(project)}
            </Typography>
            <Typography variant="h6" fontWeight={700} color={isDark ? "#f8fafc" : NAVY_LT} sx={{ lineHeight: 1.15 }}>
              {[project.firstName, project.lastName].filter(Boolean).join(" ") || "—"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {project.phone || "No phone"}
            </Typography>
          </Box>
        </Stack>

        <Box sx={{ width: { xs: "100%", lg: 240 }, minWidth: 0 }}>
          {(() => {
            const stage = getStageMeta(stageKey);
            const StageIcon = stage.icon;
            return (
              <>
                <Chip
                  icon={<StageIcon sx={{ fontSize: "14px !important", color: `${stage.color} !important` }} />}
                  label={stage.label}
                  size="small"
                  sx={{
                    bgcolor: alpha(stage.color, 0.10),
                    color: stage.color,
                    fontWeight: 700,
                    mb: 1.1,
                  }}
                />
                <LinearProgress
                  variant="determinate"
                  value={progress}
                  sx={{
                    height: 5,
                    borderRadius: 999,
                    bgcolor: alpha(stage.color, 0.12),
                    "& .MuiLinearProgress-bar": {
                      bgcolor: stage.color,
                      borderRadius: 999,
                    },
                  }}
                />
              </>
            );
          })()}
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h6" fontWeight={700} color={isDark ? "#f8fafc" : NAVY} sx={{ lineHeight: 1.2 }}>
            {getDynamicNextAction(project, stageKey)}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35 }}>
            Updated {formatDate(project.updatedAt || getRegistrationDateValue(project))}
          </Typography>
        </Box>

        <Box sx={{ minWidth: 100, textAlign: { xs: "left", lg: "right" } }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: 10.5, fontWeight: 700 }}>
            AMOUNT
          </Typography>
          <Typography variant="subtitle2" fontWeight={800} color={isDark ? "#f8fafc" : NAVY}>
            {formatCurrency(getProjectAmount(project))}
          </Typography>
        </Box>

        <Box sx={{ minWidth: 100, textAlign: { xs: "left", lg: "right" } }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: 10.5, fontWeight: 700 }}>
            DUE AMOUNT
          </Typography>
          {(() => {
            const due = getProjectDueAmount(project);
            const total = getProjectAmount(project);
            if (total > 0 && due === 0) {
              return (
                <Chip
                  label="Paid"
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: 10,
                    fontWeight: 800,
                    bgcolor: alpha(EMERALD, isDark ? 0.25 : 0.12),
                    color: isDark ? "#4ade80" : EMERALD,
                  }}
                />
              );
            }
            return (
              <Typography variant="subtitle2" fontWeight={800} color={due > 0 ? (isDark ? "#f87171" : RED) : "text.secondary"}>
                {formatCurrency(due)}
              </Typography>
            );
          })()}
        </Box>

        <Stack
          direction="row"
          spacing={0.5}
          alignItems="center"
          justifyContent="flex-end"
          sx={{ ml: { lg: "auto" } }}
        >
          <Tooltip title="Open registration">
            <IconButton
              size="small"
              onClick={() => onView(project)}
              sx={{ color: NAVY_LT, "&:hover": { bgcolor: alpha(NAVY, 0.08) } }}
            >
              <OpenInNew sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
          <RegistrationActionMenu
            project={project}
            onView={onView}
            onEdit={onEdit}
            onUpload={onUpload}
          />
        </Stack>
      </Stack>
    </Paper>
  );
};

const ProjectCard = ({ project, onOpen, onCall, onEdit }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const stage    = getStageMeta(normalizeProjectStage(project));
  const progress = ((stageIndex(stage.key) + 1) / PROJECT_STAGES.length) * 100;
  const stuck    = isStuck(project);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2, borderRadius: "14px",
        border: `1px solid ${stuck ? alpha(RED, 0.4) : isDark ? "rgba(255,255,255,0.08)" : alpha(stage.color, 0.16)}`,
        bgcolor: isDark ? "#0e1220" : "#fff",
        color: isDark ? "#f8fafc" : "inherit",
        transition: "box-shadow 0.15s, transform 0.15s",
        "&:hover": { boxShadow: isDark ? `0 6px 20px ${alpha(stage.color, 0.25)}` : `0 6px 20px ${alpha(stage.color, 0.14)}`, transform: "translateY(-1px)" },
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
        <Avatar
          sx={{
            width: 36, height: 36, fontSize: 13, fontWeight: 800,
            bgcolor: alpha(stage.color, 0.12), color: stage.color,
          }}
        >
          {getInitials(project)}
        </Avatar>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="subtitle2" fontWeight={800} noWrap color={isDark ? "#f8fafc" : NAVY}>
            {project.projectCode || "Project"}
          </Typography>
          <Typography variant="caption" fontWeight={800} color={stage.color} noWrap sx={{ display: "block", mt: 0.2 }}>
            {getProjectName(project)}
          </Typography>
          <Typography variant="caption" color={isDark ? "#94a3b8" : "text.secondary"} noWrap>
            {[project.firstName, project.lastName].filter(Boolean).join(" ") || "—"}
          </Typography>
        </Box>
        {stuck && (
          <Tooltip title="No activity for 5+ days">
            <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: RED, flexShrink: 0 }} />
          </Tooltip>
        )}
        <ActionMenu project={project} onOpen={onOpen} onCall={onCall} onEdit={onEdit} color={stage.color} />
      </Stack>

      <Typography variant="caption" color={isDark ? "#94a3b8" : "text.secondary"} sx={{ display: "block", mb: 1.25, lineHeight: 1.4, minHeight: 32 }}>
        {getDynamicNextAction(project, stage.key)}
      </Typography>

      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{
          height: 4, borderRadius: 999, mb: 1.5,
          bgcolor: alpha(stage.color, 0.12),
          "& .MuiLinearProgress-bar": { bgcolor: stage.color, borderRadius: 999 },
        }}
      />

      <Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ mb: 1 }}>
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: 10.5, fontWeight: 700 }}>
            AMOUNT
          </Typography>
          <Typography variant="subtitle2" fontWeight={800} color={isDark ? "#f8fafc" : NAVY}>
            {formatCurrency(getProjectAmount(project))}
          </Typography>
        </Box>
        <Box sx={{ textAlign: "right" }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: 10.5, fontWeight: 700 }}>
            DUE AMOUNT
          </Typography>
          {(() => {
            const due = getProjectDueAmount(project);
            const total = getProjectAmount(project);
            if (total > 0 && due === 0) {
              return (
                <Chip
                  label="Paid"
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: 10,
                    fontWeight: 800,
                    bgcolor: alpha(EMERALD, isDark ? 0.25 : 0.12),
                    color: isDark ? "#4ade80" : EMERALD,
                  }}
                />
              );
            }
            return (
              <Typography variant="subtitle2" fontWeight={800} color={due > 0 ? (isDark ? "#f87171" : RED) : "text.secondary"}>
                {formatCurrency(due)}
              </Typography>
            );
          })()}
        </Box>
      </Stack>

      <Stack direction="row" justifyContent="flex-end" alignItems="center">
        <Button
          size="small"
          endIcon={<OpenInNew sx={{ fontSize: "14px !important" }} />}
          onClick={() => onOpen(project)}
          sx={{
            fontSize: 12, fontWeight: 700, color: stage.color,
            "&:hover": { bgcolor: alpha(stage.color, 0.08) },
          }}
        >
          Open
        </Button>
      </Stack>
    </Paper>
  );
};

// ── Filter popover content ─────────────────────────────────────
const FilterPanel = ({
  amountRange, setAmountRange,
  activityFilter, setActivityFilter,
  onClear,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Box sx={{ p: 2.5, width: 280, bgcolor: isDark ? "#0b0e1a" : "#fff", color: isDark ? "#f8fafc" : "inherit" }}>
      <Typography variant="subtitle2" fontWeight={800} color={isDark ? "#f8fafc" : NAVY} sx={{ mb: 1.5 }}>
        Refine results
      </Typography>

    <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: "block", mb: 0.75 }}>
      DEAL SIZE
    </Typography>
    <Select
      fullWidth
      size="small"
      value={amountRange}
      onChange={(e) => setAmountRange(e.target.value)}
      sx={{ mb: 2, borderRadius: "10px", fontSize: 13.5, bgcolor: isDark ? "#0e1220" : "#fff", color: isDark ? "#f8fafc" : "inherit", "& .MuiOutlinedInput-notchedOutline": { borderColor: isDark ? "rgba(255,255,255,0.12)" : BORDER } }}
    >
      {AMOUNT_RANGES.map((r) => (
        <MenuItem key={r.key} value={r.key} sx={{ fontSize: 13.5 }}>{r.label}</MenuItem>
      ))}
    </Select>

    <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: "block", mb: 0.75 }}>
      ACTIVITY
    </Typography>
    <Select
      fullWidth
      size="small"
      value={activityFilter}
      onChange={(e) => setActivityFilter(e.target.value)}
      sx={{ mb: 2.5, borderRadius: "10px", fontSize: 13.5, bgcolor: isDark ? "#0e1220" : "#fff", color: isDark ? "#f8fafc" : "inherit", "& .MuiOutlinedInput-notchedOutline": { borderColor: isDark ? "rgba(255,255,255,0.12)" : BORDER } }}
    >
      {ACTIVITY_FILTERS.map((f) => (
        <MenuItem key={f.key} value={f.key} sx={{ fontSize: 13.5 }}>{f.label}</MenuItem>
      ))}
    </Select>

    <Button
      fullWidth
      size="small"
      startIcon={<FilterAltOff sx={{ fontSize: 16 }} />}
      onClick={onClear}
      sx={{
        fontWeight: 700, fontSize: 12.5, borderRadius: "10px",
        color: NAVY_LT, border: `1px solid ${BORDER}`,
        "&:hover": { bgcolor: alpha(NAVY, 0.04) },
      }}
    >
      Clear filters
    </Button>
    </Box>
  );
};

// ── Main component ─────────────────────────────────────────────
function Projects() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { fetchAPI } = useAuth();
  const navigate     = useNavigate();
  const location     = useLocation();

  const [projects,         setProjects]         = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [viewMode,         setViewMode]         = useState("table");
  const [searchTerm,       setSearchTerm]       = useState("");
  const [selectedStage,    setSelectedStage]    = useState("all");
  const [selectedProjectType, setSelectedProjectType] = useState("all");
  const [selectedSection, setSelectedSection] = useState("all");
  const [amountRange,      setAmountRange]      = useState("all");
  const [activityFilter,   setActivityFilter]   = useState("all");
  const [filterAnchor,     setFilterAnchor]      = useState(null);
  const [page,             setPage]             = useState(0);
  const [rowsPerPage,      setRowsPerPage]      = useState(10);
  const [highlightId,      setHighlightId]      = useState(null);
  const [snackbar,         setSnackbar]         = useState({ open: false, message: "", severity: "success" });

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const [leadResult, worksheetResult] = await Promise.allSettled([
        fetchAPI("/lead/getAll?isProject=true&limit=500&sortBy=projectConvertedAt&sortOrder=desc"),
        fetchAPI("/installer-worksheets?limit=500"),
      ]);

      if (leadResult.status === "rejected" && worksheetResult.status === "rejected") {
        throw leadResult.reason || worksheetResult.reason;
      }

      const leadProjects = leadResult.status === "fulfilled"
        ? leadResult.value?.result?.leads || []
        : [];
      const worksheetProjects = worksheetResult.status === "fulfilled"
        ? mapWorksheetProjects(worksheetResult.value?.result || worksheetResult.value?.data || [])
        : [];

      const combined = [...leadProjects, ...worksheetProjects].sort((a, b) => {
        return getProjectSortTime(b) - getProjectSortTime(a);
      });
      setProjects(combined);
    } catch (err) {
      setSnackbar({ open: true, message: err.message || "Failed to load projects", severity: "error" });
    } finally {
      setLoading(false);
    }
  }, [fetchAPI]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  useEffect(() => {
    const nextStage = location.state?.stageFilter;
    const nextHighlightId = location.state?.highlightProjectId;

    const normalizedNextStage = nextStage === "all" ? "all" : normalizeProjectStage(nextStage);
    if (nextStage && (normalizedNextStage === "all" || PROJECT_STAGES.some((stage) => stage.key === normalizedNextStage))) {
      setSelectedStage(normalizedNextStage);
      setPage(0);
    }

    if (nextHighlightId) {
      setHighlightId(nextHighlightId);
      setSnackbar({
        open: true,
        message: location.state?.message || "Lead converted to project",
        severity: "success",
      });
    }

    if (nextStage || nextHighlightId) {
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.pathname, location.state, navigate]);

  const enriched = useMemo(
    () => projects.map((p) => ({
      ...p,
      currentStage: normalizeProjectStage(p),
      pipelineStage: normalizePipelineStage(p),
      projectTypeKey: normalizeProjectType(p),
    })),
    [projects],
  );

  const selectedTypeProjects = useMemo(
    () => enriched.filter((p) => selectedProjectType === "all" || p.projectTypeKey === selectedProjectType),
    [enriched, selectedProjectType],
  );

  const sectionOptions = useMemo(
    () =>
      Array.from(new Set(selectedTypeProjects.map((p) => p.section || p.city).filter(Boolean)))
        .sort((a, b) => String(a).localeCompare(String(b))),
    [selectedTypeProjects],
  );

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const rangeTest = AMOUNT_RANGES.find((r) => r.key === amountRange)?.test || (() => true);
    const list = enriched.filter((p) => {
      if (selectedStage === "ready_handover" && p.pipelineStage !== "ready_handover") return false;
      if (selectedStage !== "all" && selectedStage !== "ready_handover" && p.currentStage !== selectedStage) return false;
      if (selectedProjectType !== "all" && p.projectTypeKey !== selectedProjectType) return false;
      if (selectedSection !== "all" && (p.section || p.city) !== selectedSection) return false;
      if (!rangeTest(getProjectAmount(p))) return false;
      if (activityFilter === "stuck" && !isStuck(p)) return false;
      if (activityFilter === "week" && !(p.installationDate && isThisWeek(new Date(p.installationDate)))) return false;
      if (!q) return true;
      return [p.projectCode, getProjectName(p), p.projectType, p.firstName, p.lastName, p.consumerName, p.consumerAccountNo, p.phone, p.email, p.city, p.section, p.address, p.siteLocation]
        .filter(Boolean).join(" ").toLowerCase().includes(q);
    });

    return list.sort((a, b) => {
      if (highlightId) {
        const aIsHL = a._id === highlightId || a.worksheetProjectId === highlightId;
        const bIsHL = b._id === highlightId || b.worksheetProjectId === highlightId;
        if (aIsHL && !bIsHL) return -1;
        if (!aIsHL && bIsHL) return 1;
      }
      return getProjectSortTime(b) - getProjectSortTime(a);
    });
  }, [enriched, searchTerm, selectedStage, selectedProjectType, selectedSection, amountRange, activityFilter, highlightId]);

  const paged = useMemo(() => filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage), [filtered, page, rowsPerPage]);
  const showRegistrationRows = false;

  const summary = useMemo(() => {
    const counts = PROJECT_STAGES.reduce((acc, s) => {
      acc[s.key] = enriched.filter((p) => p.currentStage === s.key).length;
      return acc;
    }, {});
    const active = enriched.filter((p) => p.currentStage !== "handover");
    const typeCounts = PROJECT_TYPE_FILTERS.reduce((acc, type) => {
      if (type.key !== "all") acc[type.key] = enriched.filter((p) => p.projectTypeKey === type.key).length;
      return acc;
    }, {});
    const pipelineCounts = PROJECT_PIPELINE_STAGES.reduce((acc, stage) => {
      acc[stage.key] = selectedTypeProjects.filter((p) => p.pipelineStage === stage.key).length;
      return acc;
    }, {});
    return {
      total:   enriched.length,
      active:  active.length,
      inFlight: active.reduce((sum, p) => sum + getProjectAmount(p), 0),
      stuck:   enriched.filter(isStuck).length,
      thisWeek: enriched.filter((p) => p.installationDate && isThisWeek(new Date(p.installationDate))).length,
      awaitingComm: counts.installation || 0,
      readyHandover: enriched.filter((p) => p.pipelineStage === "ready_handover" || p.currentStage === "subsidy_received" || p.currentStage === "subsidy_redeemed" || p.currentStage === "final_payment").length,
      counts,
      typeCounts,
      pipelineCounts,
    };
  }, [enriched, selectedTypeProjects]);

  const activeFilterCount =
    (selectedStage !== "all" ? 1 : 0) +
    (selectedProjectType !== "all" ? 1 : 0) +
    (selectedSection !== "all" ? 1 : 0) +
    (amountRange !== "all" ? 1 : 0) +
    (activityFilter !== "all" ? 1 : 0);

  const clearAllFilters = () => {
    setSelectedStage("all");
    setSelectedProjectType("all");
    setSelectedSection("all");
    setAmountRange("all");
    setActivityFilter("all");
    setPage(0);
  };

  const openProject = useCallback(
    (p) => {
      const stage = normalizeProjectStage(p);
      const state = {
        fromProjects: true,
        projectStage: stage,
        projectId: p?._id || null,
        leadId: p?._id || null,
        project: p,
      };
      navigate(`/projects/${p._id}`, { state });
    },
    [navigate],
  );

  const callCustomer = useCallback((p) => {
    if (p.phone) window.location.href = `tel:${p.phone}`;
  }, []);

  const editLead = useCallback(
    (p) => {
      if (p?.source === "installerWorksheet") {
        setSnackbar({
          open: true,
          message: "APK-created projects can be edited from the APK project screen.",
          severity: "info",
        });
        return;
      }
      navigate(`/all-leads/${p._id}`, { state: { lead: p, edit: true } });
    },
    [navigate],
  );

  const openRegistrationAction = useCallback(
    (project, action) => {
      navigate("/registration", {
        state: {
          registrationAction: action,
          registrationId: project?._id || null,
        },
      });
    },
    [navigate],
  );

  return (
    <Box sx={{ p: { xs: 1, sm: 1.5 }, bgcolor: "transparent" }}>

      {/* ── Header ── */}
      <Paper
        elevation={0}
        sx={{
          mb: 1.5, borderRadius: "14px", overflow: "hidden",
          border: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${BORDER}`,
          background: isDark ? "#0b0e1a" : `linear-gradient(135deg, #0f1f3d 0%, #1a237e 100%)`,
          position: "relative",
        }}
      >
        {/* decorative glow */}
        <Box sx={{
          position: "absolute", top: -60, right: -60,
          width: 260, height: 260, borderRadius: "50%",
          background: `radial-gradient(circle, ${alpha(AMBER, 0.18)} 0%, transparent 70%)`,
          pointerEvents: "none",
        }} />
        <Box sx={{
          position: "absolute", bottom: -80, left: 80,
          width: 200, height: 200, borderRadius: "50%",
          background: `radial-gradient(circle, ${alpha(BLUE, 0.15)} 0%, transparent 70%)`,
          pointerEvents: "none",
        }} />

        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "center" }}
          spacing={2}
          sx={{ p: { xs: 1.5, md: 2 }, position: "relative" }}
        >
          <Box>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
              <Box sx={{
                width: 36, height: 36, borderRadius: "10px",
                bgcolor: alpha(AMBER, 0.2), color: AMBER,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <ElectricBolt sx={{ fontSize: 20 }} />
              </Box>
              <Typography variant="overline" sx={{ color: alpha("#fff", 0.55), letterSpacing: "0.14em", fontSize: 11 }}>
                Operations · Pipeline
              </Typography>
            </Stack>

            <Typography variant="h5" fontWeight={800} color="#fff" sx={{ lineHeight: 1.1, mb: 0.25 }}>
              Projects
            </Typography>

            <Stack direction="row" spacing={2} alignItems="center">
              <Chip
                label={`${summary.active} active`}
                size="small"
                sx={{ bgcolor: alpha(AMBER, 0.18), color: AMBER_LT, fontWeight: 700, fontSize: 12 }}
              />
              <Typography variant="body2" sx={{ color: alpha("#fff", 0.6) }}>
                {formatCurrency(summary.inFlight)} in flight
              </Typography>
            </Stack>
          </Box>

        </Stack>
      </Paper>



      {/* ── Pipeline stages (with icons) ── */}
      <Box sx={{ mb: 1.5 }}>
        <Typography variant="caption" fontWeight={900} color={isDark ? "#94a3b8" : NAVY} sx={{ mb: 0.5, display: "block", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Project Type
        </Typography>
        <Box sx={{ width: "100%", overflowX: "auto", pb: 0.75 }}>
          <Stack direction="row" spacing={1} alignItems="stretch" sx={{ minWidth: 960 }}>
            {PROJECT_TYPE_FILTERS.map((type) => {
              const active = selectedProjectType === type.key;
              const TypeIcon = type.icon;
              const count = type.key === "all" ? summary.total : summary.typeCounts[type.key] || 0;
              return (
                <Box
                  key={type.key}
                  onClick={() => { setSelectedProjectType(type.key); setSelectedStage("all"); setSelectedSection("all"); setPage(0); }}
                  sx={{
                    flex: 1,
                    minHeight: 52,
                    px: 1.5,
                    py: 0.75,
                    borderRadius: "12px",
                    cursor: "pointer",
                    border: active
                      ? `1.5px solid ${type.color}`
                      : (isDark ? `1px solid ${alpha(type.color, 0.2)}` : `1px solid ${BORDER}`),
                    background: active
                      ? (isDark
                          ? `linear-gradient(135deg, ${alpha(type.color, 0.28)} 0%, ${alpha(type.color, 0.12)} 100%)`
                          : `linear-gradient(135deg, ${type.color} 0%, ${alpha(type.color, 0.85)} 100%)`)
                      : (isDark ? "#0b0e1a" : "#fff"),
                    boxShadow: active
                      ? `0 8px 24px ${alpha(type.color, isDark ? 0.35 : 0.25)}`
                      : "0 2px 8px rgba(0,0,0,0.04)",
                    transition: "all 0.2s ease",
                    position: "relative",
                    "&:hover": {
                      transform: "translateY(-2px)",
                      borderColor: type.color,
                      boxShadow: `0 8px 20px ${alpha(type.color, 0.25)}`,
                    },
                    "&::after": active ? {
                      content: '""',
                      position: "absolute",
                      left: "50%",
                      bottom: 6,
                      width: 36,
                      height: 3,
                      borderRadius: 99,
                      bgcolor: type.color,
                      boxShadow: `0 0 10px ${type.color}`,
                      transform: "translateX(-50%)",
                    } : {},
                  }}
                >
                  <Stack spacing={0.75} alignItems="center" justifyContent="center">
                    <Stack direction="row" spacing={0.8} alignItems="center" justifyContent="center" sx={{ width: "100%" }}>
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          borderRadius: "6px",
                          bgcolor: active ? alpha("#fff", 0.2) : alpha(type.color, 0.12),
                          color: active ? "#fff" : type.color,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <TypeIcon sx={{ fontSize: 15 }} />
                      </Box>
                      <Typography variant="body2" fontWeight={800} color={active ? "#fff" : (isDark ? "#f8fafc" : NAVY)} noWrap>
                        {type.label}
                      </Typography>
                    </Stack>
                    <Typography variant="h6" fontWeight={900} color={active ? "#fff" : (isDark ? type.color : NAVY)} sx={{ lineHeight: 1 }}>
                      {count}
                    </Typography>
                  </Stack>
                </Box>
              );
            })}
          </Stack>
        </Box>

        <Paper elevation={0} sx={{ mt: 1, p: 1.25, borderRadius: "8px", border: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${alpha(BLUE, 0.3)}`, bgcolor: isDark ? "#0b0e1a" : "#fff" }}>
          <Typography variant="caption" fontWeight={900} color={isDark ? "#94a3b8" : NAVY} sx={{ mb: 0.75, display: "block", textTransform: "uppercase" }}>
            {getProjectTypeMeta(selectedProjectType).label} Pipeline Stages
          </Typography>
          <Box sx={{ width: "100%", overflowX: "auto", pb: 0.5, "&::-webkit-scrollbar": { height: 6 }, "&::-webkit-scrollbar-thumb": { bgcolor: alpha(NAVY, 0.2), borderRadius: 3 } }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: "max-content", py: 0.25 }}>
              {PROJECT_PIPELINE_STAGES.map((stage, index) => {
                const StageIcon = stage.icon;
                const active = selectedStage === stage.key;
                return (
                  <React.Fragment key={stage.key}>
                    <Box
                      onClick={() => { setSelectedStage(stage.key); setPage(0); }}
                      sx={{
                        minWidth: 165,
                        flexShrink: 0,
                        minHeight: 54,
                        px: 1.25,
                        py: 1,
                        borderRadius: "8px",
                        border: `1px solid ${active ? alpha(stage.color, 0.55) : (isDark ? "rgba(255,255,255,0.08)" : BORDER)}`,
                        bgcolor: active ? alpha(stage.color, isDark ? 0.2 : 0.08) : (isDark ? "#0e1220" : "#fff"),
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        "&:hover": {
                          borderColor: stage.color,
                          bgcolor: alpha(stage.color, isDark ? 0.25 : 0.12),
                          transform: "translateY(-1px)",
                        },
                      }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Box sx={{
                          width: 30,
                          height: 30,
                          borderRadius: "8px",
                          bgcolor: alpha(stage.color, 0.13),
                          color: stage.color,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}>
                          <StageIcon sx={{ fontSize: 16 }} />
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="caption" fontWeight={900} color={isDark ? "#f8fafc" : NAVY} noWrap sx={{ display: "block" }}>
                            {stage.label}
                          </Typography>
                          <Typography variant="h6" fontWeight={900} color={isDark ? "#f8fafc" : NAVY} sx={{ lineHeight: 1.05 }}>
                            {summary.pipelineCounts[stage.key] || 0}
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>
                    {index < PROJECT_PIPELINE_STAGES.length - 1 && (
                      <Typography variant="caption" color="text.disabled" fontWeight={900} sx={{ px: 0.25 }}>
                        +
                      </Typography>
                    )}
                  </React.Fragment>
                );
              })}
            </Stack>
          </Box>
        </Paper>
      </Box>

      {/* ── Main content panel ── */}
      <Paper elevation={0} sx={{ borderRadius: "14px", border: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${BORDER}`, overflow: "hidden", bgcolor: isDark ? "#0b0e1a" : "#fff" }}>

        {/* Search / filter bar */}
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.5}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", md: "center" }}
          sx={{ p: 1.5, borderBottom: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${BORDER}` }}
        >
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ flex: 1 }}>
            <TextField
              size="small"
              placeholder="Search by project code, customer, city…"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
              sx={{
                minWidth: { md: 340 },
                "& .MuiOutlinedInput-root": {
                  borderRadius: "10px",
                  fontSize: 14,
                  bgcolor: isDark ? "#0e1220" : "#fff",
                  color: isDark ? "#f8fafc" : "inherit",
                  "& fieldset": { borderColor: isDark ? "rgba(255,255,255,0.12)" : BORDER },
                  "&:hover fieldset": { borderColor: isDark ? "#3b82f6" : alpha(NAVY, 0.3) },
                  "&.Mui-focused fieldset": { borderColor: "#3b82f6" },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: "text.secondary", fontSize: 18 }} />
                  </InputAdornment>
                ),
              }}
            />

            <Select
              size="small"
              value={selectedProjectType}
              onChange={(e) => { setSelectedProjectType(e.target.value); setSelectedStage("all"); setSelectedSection("all"); setPage(0); }}
              displayEmpty
              sx={{
                minWidth: 170,
                borderRadius: "10px",
                fontSize: 13,
                fontWeight: 700,
                "& .MuiOutlinedInput-notchedOutline": { borderColor: isDark ? "rgba(255,255,255,0.12)" : BORDER }, bgcolor: isDark ? "#0e1220" : "#fff", color: isDark ? "#f8fafc" : "inherit",
              }}
            >
              {PROJECT_TYPE_FILTERS.map((type) => (
                <MenuItem key={type.key} value={type.key} sx={{ fontSize: 13 }}>
                  Project Type: {type.label}
                </MenuItem>
              ))}
            </Select>

            <Select
              size="small"
              value={selectedStage}
              onChange={(e) => { setSelectedStage(e.target.value); setPage(0); }}
              displayEmpty
              sx={{
                minWidth: 130,
                borderRadius: "10px",
                fontSize: 13,
                fontWeight: 700,
                "& .MuiOutlinedInput-notchedOutline": { borderColor: isDark ? "rgba(255,255,255,0.12)" : BORDER }, bgcolor: isDark ? "#0e1220" : "#fff", color: isDark ? "#f8fafc" : "inherit",
              }}
            >
              <MenuItem value="all" sx={{ fontSize: 13 }}>Stage: All</MenuItem>
              {PROJECT_PIPELINE_STAGES.map((stage) => (
                <MenuItem key={stage.key} value={stage.key} sx={{ fontSize: 13 }}>
                  Stage: {stage.label}
                </MenuItem>
              ))}
            </Select>

            <Select
              size="small"
              value={selectedSection}
              onChange={(e) => { setSelectedSection(e.target.value); setPage(0); }}
              displayEmpty
              sx={{
                minWidth: 130,
                borderRadius: "10px",
                fontSize: 13,
                fontWeight: 700,
                "& .MuiOutlinedInput-notchedOutline": { borderColor: isDark ? "rgba(255,255,255,0.12)" : BORDER }, bgcolor: isDark ? "#0e1220" : "#fff", color: isDark ? "#f8fafc" : "inherit",
              }}
            >
              <MenuItem value="all" sx={{ fontSize: 13 }}>Section: All</MenuItem>
              {sectionOptions.map((section) => (
                <MenuItem key={section} value={section} sx={{ fontSize: 13 }}>
                  Section: {section}
                </MenuItem>
              ))}
            </Select>

            <Button
              size="small"
              variant="outlined"
              onClick={(e) => setFilterAnchor(e.currentTarget)}
              startIcon={<FilterAlt sx={{ fontSize: 17 }} />}
              sx={{
                borderRadius: "10px", fontWeight: 700, fontSize: 13, px: 1.75,
                borderColor: activeFilterCount ? "#3b82f6" : (isDark ? "rgba(255,255,255,0.15)" : BORDER),
                color: activeFilterCount ? "#60a5fa" : (isDark ? "#f8fafc" : alpha(NAVY, 0.7)),
                bgcolor: activeFilterCount ? (isDark ? "rgba(59,130,246,0.15)" : alpha(NAVY, 0.05)) : "transparent",
                "&:hover": { borderColor: NAVY, bgcolor: alpha(NAVY, 0.05) },
              }}
            >
              Filters
              {activeFilterCount > 0 && (
                <Chip
                  label={activeFilterCount}
                  size="small"
                  sx={{ ml: 1, height: 18, fontSize: 11, fontWeight: 800, bgcolor: NAVY, color: "#fff" }}
                />
              )}
            </Button>

            <Popover
              open={Boolean(filterAnchor)}
              anchorEl={filterAnchor}
              onClose={() => setFilterAnchor(null)}
              anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
              PaperProps={{ sx: { borderRadius: "16px", border: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${BORDER}`, bgcolor: isDark ? "#0b0e1a" : "#fff", boxShadow: isDark ? "0 16px 40px rgba(0,0,0,0.5)" : "0 16px 40px rgba(15,31,61,0.14)", mt: 1 } }}
            >
              <FilterPanel
                amountRange={amountRange} setAmountRange={(v) => { setAmountRange(v); setPage(0); }}
                activityFilter={activityFilter} setActivityFilter={(v) => { setActivityFilter(v); setPage(0); }}
                onClear={() => { clearAllFilters(); setFilterAnchor(null); }}
              />
            </Popover>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: "wrap" }}>
            {selectedStage !== "all" && (
              <Chip
                label={getPipelineStageMeta(selectedStage).label}
                onDelete={() => { setSelectedStage("all"); setPage(0); }}
                size="small"
                sx={{
                  bgcolor: alpha(getPipelineStageMeta(selectedStage).color, 0.1),
                  color: getPipelineStageMeta(selectedStage).color,
                  fontWeight: 700,
                }}
              />
            )}
            {selectedProjectType !== "all" && (
              <Chip
                label={getProjectTypeMeta(selectedProjectType).label}
                onDelete={() => { setSelectedProjectType("all"); setPage(0); }}
                size="small"
                sx={{
                  bgcolor: alpha(getProjectTypeMeta(selectedProjectType).color, 0.1),
                  color: getProjectTypeMeta(selectedProjectType).color,
                  fontWeight: 700,
                }}
              />
            )}
            {amountRange !== "all" && (
              <Chip
                label={AMOUNT_RANGES.find((r) => r.key === amountRange)?.label}
                onDelete={() => { setAmountRange("all"); setPage(0); }}
                size="small"
                sx={{ bgcolor: alpha(BLUE, 0.1), color: BLUE, fontWeight: 700 }}
              />
            )}
            {activityFilter !== "all" && (
              <Chip
                label={ACTIVITY_FILTERS.find((f) => f.key === activityFilter)?.label}
                onDelete={() => { setActivityFilter("all"); setPage(0); }}
                size="small"
                sx={{ bgcolor: alpha(AMBER, 0.12), color: "#92660a", fontWeight: 700 }}
              />
            )}
            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
              <b style={{ color: isDark ? "#f8fafc" : NAVY }}>{filtered.length}</b>{" "}
              {selectedStage === "registration"
                ? `registration${filtered.length !== 1 ? "s" : ""}`
                : `project${filtered.length !== 1 ? "s" : ""}`}
            </Typography>
          </Stack>
        </Stack>

        {/* Loading */}
        {loading && <LinearProgress sx={{ "& .MuiLinearProgress-bar": { bgcolor: NAVY } }} />}

        {/* Kanban */}
        {!loading && viewMode === "kanban" && (
          <Box sx={{ p: 2.5, overflowX: "auto" }}>
            <Stack direction="row" spacing={2} sx={{ minWidth: 1100, alignItems: "flex-start" }}>
              {PROJECT_STAGES
                .filter((s) => selectedStage === "all" || selectedStage === s.key || (selectedStage === "ready_handover" && s.key === "disbursement"))
                .map((stage) => {
                  const cols = filtered.filter((p) => p.currentStage === stage.key);
                  const StageIcon = stage.icon;
                  return (
                    <Box key={stage.key} sx={{ width: 290, flexShrink: 0 }}>
                      {/* Column header */}
                      <Box
                        sx={{
                          px: 2, py: 1.25, mb: 1.5, borderRadius: "12px",
                          bgcolor: alpha(stage.color, 0.08),
                          border: `1px solid ${alpha(stage.color, 0.2)}`,
                        }}
                      >
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Stack direction="row" spacing={1} alignItems="center">
                            <StageIcon sx={{ fontSize: 16, color: stage.color }} />
                            <Typography variant="subtitle2" fontWeight={800} color={stage.color}>
                              {stage.label}
                            </Typography>
                          </Stack>
                          <Chip
                            label={cols.length}
                            size="small"
                            sx={{ bgcolor: alpha(stage.color, 0.12), color: stage.color, fontWeight: 800, height: 20, fontSize: 11 }}
                          />
                        </Stack>
                      </Box>

                      <Stack spacing={1.25}>
                        {cols.length === 0 ? (
                          <Box sx={{ p: 2.5, borderRadius: "12px", border: `1.5px dashed ${BORDER}`, textAlign: "center" }}>
                            <Typography variant="caption" color="text.disabled">No projects</Typography>
                          </Box>
                        ) : cols.map((p) => (
                          <ProjectCard key={p._id} project={p} onOpen={openProject} onCall={callCustomer} onEdit={editLead} />
                        ))}
                      </Stack>
                    </Box>
                  );
                })}
            </Stack>
          </Box>
        )}

        {/* Empty state */}
        {!loading && viewMode === "table" && filtered.length === 0 && (
          <Box sx={{ py: 8, textAlign: "center" }}>
            <Box sx={{
              width: 72, height: 72, borderRadius: "20px",
              bgcolor: alpha(NAVY, 0.05), mx: "auto", mb: 2,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Description sx={{ fontSize: 32, color: alpha(NAVY, 0.3) }} />
            </Box>
            <Typography variant="h6" fontWeight={700} color={NAVY}>
              No projects found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
              Try adjusting filters, convert a lead, or create a project from the APK.
            </Typography>
            {activeFilterCount > 0 && (
              <Button
                size="small"
                onClick={clearAllFilters}
                startIcon={<FilterAltOff sx={{ fontSize: 16 }} />}
                sx={{ fontWeight: 700, color: NAVY_LT, borderRadius: "10px", border: `1px solid ${BORDER}` }}
              >
                Clear filters
              </Button>
            )}
          </Box>
        )}

        {!loading && viewMode === "table" && showRegistrationRows && (
          <>
            <Box>
              {paged.map((project) => (
                <RegistrationProjectRow
                  key={project._id}
                  project={project}
                  highlight={highlightId === project._id}
                  onView={(item) => openRegistrationAction(item, "view")}
                  onEdit={(item) => openRegistrationAction(item, "edit")}
                  onUpload={(item) => openRegistrationAction(item, "upload")}
                  onCall={callCustomer}
                />
              ))}
            </Box>

            <TablePagination
              component="div"
              count={filtered.length}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
              rowsPerPageOptions={[5, 10, 25]}
              sx={{ borderTop: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${BORDER}`, color: isDark ? "#f8fafc" : alpha(NAVY, 0.7), bgcolor: isDark ? "#0b0e1a" : "#fff" }}
            />
          </>
        )}

        {/* Registration table */}
        {!loading && false && viewMode === "table" && showRegistrationRows && (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: isDark ? "#0e1220" : "#fafbfe" }}>
                    {["Customer", "Date", "Solar Requirement", "Status", "Lead Status", "Assigned To", "Actions"].map((col, i) => (
                      <TableCell
                        key={i}
                        align={i === 6 ? "right" : "left"}
                        sx={{
                          fontWeight: 800, fontSize: 12,
                          color: isDark ? "#94a3b8" : alpha(NAVY, 0.6),
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          borderBottom: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${BORDER}`,
                          py: 1.5,
                        }}
                      >
                        {col}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {paged.map((project) => {
                    const registrationMeta = getRegistrationStatusMeta(project.registrationStatus);
                    const leadMeta = getLeadStatusMeta(project.status);
                    const assignedPerson = getAssignedPerson(project);
                    const highlight = highlightId === project._id;

                    return (
                      <TableRow
                        key={project._id}
                        sx={{
                          bgcolor: highlight ? (isDark ? "rgba(16,185,129,0.1)" : alpha(EMERALD, 0.04)) : "transparent",
                          "&:hover": { bgcolor: isDark ? "rgba(255,255,255,0.04)" : alpha(NAVY, 0.02) },
                          "& td": { borderBottom: isDark ? "1px solid rgba(255,255,255,0.06)" : `1px solid ${alpha(BORDER, 0.6)}` },
                        }}
                      >
                        <TableCell>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Avatar
                              sx={{
                                width: 38, height: 38, fontSize: 13, fontWeight: 800,
                                bgcolor: alpha("#1d4ed8", 0.12), color: NAVY_LT,
                              }}
                            >
                              {getInitials(project)}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2" fontWeight={800} color={isDark ? "#f8fafc" : NAVY}>
                                {[project.firstName, project.lastName].filter(Boolean).join(" ") || "—"}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {project.phone || "No phone"}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>

                        <TableCell>
                          <Typography variant="body2" fontWeight={600} color={NAVY}>
                            {formatDate(getRegistrationDateValue(project))}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <SolarPower sx={{ fontSize: 18, color: alpha(NAVY, 0.75) }} />
                            <Typography variant="body2" fontWeight={600} color={NAVY}>
                              {project.solarRequirement || project.capacity || "—"}
                            </Typography>
                          </Stack>
                        </TableCell>

                        <TableCell>
                          <Chip
                            icon={registrationMeta.icon}
                            label={registrationMeta.label}
                            size="small"
                            sx={{
                              bgcolor: registrationMeta.bg,
                              color: registrationMeta.color,
                              fontWeight: 700,
                              "& .MuiChip-icon": { color: `${registrationMeta.color} !important` },
                            }}
                          />
                        </TableCell>

                        <TableCell>
                          <Chip
                            icon={leadMeta.icon}
                            label={leadMeta.label}
                            size="small"
                            sx={{
                              bgcolor: leadMeta.bg,
                              color: leadMeta.color,
                              fontWeight: 700,
                              "& .MuiChip-icon": { color: `${leadMeta.color} !important` },
                            }}
                          />
                        </TableCell>

                        <TableCell>
                          <Typography variant="subtitle2" fontWeight={700} color={NAVY}>
                            {assignedPerson?.name || "Unassigned"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {(assignedPerson?.role || "Team").toUpperCase()}
                          </Typography>
                        </TableCell>

                        <TableCell align="right">
                          <Stack direction="row" spacing={0.75} justifyContent="flex-end" alignItems="center">
                            <Tooltip title="View details">
                              <IconButton
                                size="small"
                                onClick={() => openRegistrationAction(project, "view")}
                                sx={{ color: NAVY_LT, bgcolor: alpha(NAVY, 0.06), "&:hover": { bgcolor: alpha(NAVY, 0.12) } }}
                              >
                                <Visibility sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Upload documents">
                              <IconButton
                                size="small"
                                onClick={() => openRegistrationAction(project, "upload")}
                                sx={{ color: EMERALD, bgcolor: alpha(EMERALD, 0.1), "&:hover": { bgcolor: alpha(EMERALD, 0.16) } }}
                              >
                                <CloudUpload sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={filtered.length}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
              rowsPerPageOptions={[5, 10, 25]}
              sx={{ borderTop: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${BORDER}`, color: isDark ? "#f8fafc" : alpha(NAVY, 0.7), bgcolor: isDark ? "#0b0e1a" : "#fff" }}
            />
          </>
        )}

        {/* Table */}
        {!loading && viewMode === "table" && !showRegistrationRows && filtered.length > 0 && (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: isDark ? "#0e1220" : "#fafbfe" }}>
                    {["Project", "Stage", "Next Action", "Amount", "Due Amount", "Actions"].map((col, i) => (
                      <TableCell
                        key={i}
                        align={i === 5 ? "right" : "left"}
                        sx={{
                          fontWeight: 800, fontSize: 12,
                          color: isDark ? "#94a3b8" : alpha(NAVY, 0.6),
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          borderBottom: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${BORDER}`,
                          py: 1.5,
                        }}
                      >
                        {col}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {paged.map((project) => {
                    const stage     = getStageMeta(project.currentStage);
                    const StageIcon = stage.icon;
                    const progress  = ((stageIndex(project.currentStage) + 1) / PROJECT_STAGES.length) * 100;
                    const highlight = highlightId === project._id;
                    const stuck     = isStuck(project);
                    const amount    = getProjectAmount(project);
                    const dueAmount = getProjectDueAmount(project);

                    return (
                      <TableRow
                        key={project._id}
                        sx={{
                          bgcolor: highlight ? (isDark ? "rgba(16,185,129,0.1)" : alpha(EMERALD, 0.04)) : "transparent",
                          "&:hover": { bgcolor: isDark ? "rgba(255,255,255,0.04)" : alpha(NAVY, 0.02) },
                          "& td": { borderBottom: isDark ? "1px solid rgba(255,255,255,0.06)" : `1px solid ${alpha(BORDER, 0.6)}` },
                        }}
                      >
                        {/* Project info */}
                        <TableCell>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Avatar
                              sx={{
                                width: 38, height: 38, fontSize: 13, fontWeight: 800,
                                bgcolor: alpha(stage.color, 0.1), color: stage.color,
                              }}
                            >
                              {getInitials(project)}
                            </Avatar>
                            <Box sx={{ minWidth: 0 }}>
                              <Stack direction="row" spacing={0.75} alignItems="center">
                                <Box sx={{ minWidth: 0 }}>
                                  <Typography variant="subtitle2" fontWeight={800} color={isDark ? "#f8fafc" : NAVY} noWrap>
                                    {project.projectCode || "Project"}
                                  </Typography>
                                  <Typography variant="caption" fontWeight={800} color={stage.color} noWrap sx={{ display: "block", mt: 0.15 }}>
                                    {getProjectName(project)}
                                  </Typography>
                                </Box>
                                {highlight && <Chip label="New" size="small" color="success" sx={{ height: 18, fontSize: 10 }} />}
                                {stuck && (
                                  <Tooltip title="No activity for 5+ days">
                                    <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: RED }} />
                                  </Tooltip>
                                )}
                              </Stack>
                              <Typography variant="body2" fontWeight={600} color={isDark ? "#f8fafc" : alpha(NAVY, 0.75)}>
                                {[project.firstName, project.lastName].filter(Boolean).join(" ") || "—"}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {[project.city, project.phone].filter(Boolean).join(" · ") || "No location"}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>

                        {/* Stage + progress */}
                        <TableCell sx={{ minWidth: 190 }}>
                          <Chip
                            icon={<StageIcon sx={{ fontSize: "14px !important", color: `${stage.color} !important` }} />}
                            label={stage.label}
                            size="small"
                            sx={{
                              mb: 0.75, fontWeight: 700, fontSize: 11,
                              bgcolor: alpha(stage.color, 0.08), color: stage.color,
                            }}
                          />
                          <LinearProgress
                            variant="determinate"
                            value={progress}
                            sx={{
                              height: 4, borderRadius: 999,
                              bgcolor: alpha(stage.color, 0.1),
                              "& .MuiLinearProgress-bar": { bgcolor: stage.color, borderRadius: 999 },
                            }}
                          />
                        </TableCell>

                        {/* Next action */}
                        <TableCell sx={{ maxWidth: 260 }}>
                          <Typography variant="body2" fontWeight={600} color={isDark ? "#f8fafc" : NAVY} sx={{ mb: 0.25 }}>
                            {getDynamicNextAction(project, project.currentStage)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Updated {formatDate(project.updatedAt)}
                          </Typography>
                        </TableCell>

                        {/* Amount */}
                        <TableCell>
                          <Typography variant="subtitle2" fontWeight={800} color={isDark ? "#f8fafc" : NAVY}>
                            {formatCurrency(amount)}
                          </Typography>
                        </TableCell>

                        {/* Due Amount */}
                        <TableCell>
                          {(() => {
                            if (amount > 0 && dueAmount === 0) {
                              return (
                                <Chip
                                  label="Paid"
                                  size="small"
                                  sx={{
                                    height: 22,
                                    fontSize: 11,
                                    fontWeight: 800,
                                    bgcolor: alpha(EMERALD, isDark ? 0.25 : 0.12),
                                    color: isDark ? "#4ade80" : EMERALD,
                                  }}
                                />
                              );
                            }
                            if (dueAmount > 0) {
                              return (
                                <Typography variant="subtitle2" fontWeight={800} color={isDark ? "#f87171" : RED}>
                                  {formatCurrency(dueAmount)}
                                </Typography>
                              );
                            }
                            return (
                              <Typography variant="body2" color="text.secondary">
                                ₹0
                              </Typography>
                            );
                          })()}
                        </TableCell>

                        {/* Actions */}
                        <TableCell align="right">
                          <Stack direction="row" spacing={0.5} justifyContent="flex-end" alignItems="center">
                            <Tooltip title="Open project">
                              <IconButton
                                size="small"
                                onClick={() => openProject(project)}
                                sx={{ color: NAVY_LT, "&:hover": { bgcolor: alpha(NAVY, 0.06) } }}
                              >
                                <OpenInNew sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Tooltip>
                            <ActionMenu project={project} onOpen={openProject} onCall={callCustomer} onEdit={editLead} color={stage.color} />
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={filtered.length}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
              rowsPerPageOptions={[5, 10, 25]}
              sx={{ borderTop: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${BORDER}`, color: isDark ? "#f8fafc" : alpha(NAVY, 0.7), bgcolor: isDark ? "#0b0e1a" : "#fff" }}
            />
          </>
        )}
      </Paper>

      {/* ── Snackbar ── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
          sx={{ borderRadius: "12px", fontWeight: 600 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Projects;
