import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  alpha,
  Autocomplete,
  Avatar,
  Box,
  Breadcrumbs,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  Menu,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  Add,
  ArrowBack,
  ArrowForward,
  AssignmentTurnedIn,
  AccessTime,
  CameraAltOutlined,
  Cancel,
  CheckCircle,
  ChevronRight,
  Close,
  CloudUploadOutlined,
  ContentCopy,
  Delete,
  DeleteOutline,
  Description,
  DescriptionOutlined,
  DownloadRounded,
  Edit,
  Email,
  FileDownloadOutlined,
  GridViewOutlined,
  InsertDriveFileOutlined,
  Link as LinkIcon,
  LocationOn,
  MoreVert,
  OpenInNew,
  Phone,
  PhotoCameraOutlined,
  Groups,
  PictureAsPdfOutlined,
  SupervisorAccount,
  PlaceOutlined,
  RemoveRedEye,
  RemoveRedEyeOutlined,
  Restore,
  WhatsApp,
  Workspaces,
} from "@mui/icons-material";
import { format, isValid, parseISO } from "date-fns";
import { useAuth } from "../contexts/AuthContext";
import { toBackendAssetUrl } from "../utils/backendAssetUrl";
import {
  deleteQuotation,
  fetchQuotationsFromServer,
  getQuotationsForLead,
  setCurrentQuotation,
  updateQuotationStatus,
} from "../utils/quotationStorage";
import {
  buildVisitStatusInfo,
  hasVisitSiteSurvey,
  resolveVisitStatus,
} from "../utils/visitStatus";
import ConvertProjectDialog from "../components/ConvertProjectDialog";
import { EditLeadModal, AssignLeadModal, ROLE_PERMISSIONS, normalizeUserRole } from "./LeadOverview";

// ─── Design Tokens ────────────────────────────────────────────────────────────
const getIsDark = () => {
  try {
    const saved = localStorage.getItem("appThemeMode");
    if (saved) return saved === "dark";
  } catch {}
  return true;
};

const TOKEN = {
  get primary() { return "#3b82f6"; },
  get primaryLight() { return "#60a5fa"; },
  get primaryMuted() { return getIsDark() ? "rgba(59, 130, 246, 0.16)" : alpha("#3b5bdb", 0.10); },
  get accent() { return "#1971c2"; },
  get teal() { return "#0ca678"; },
  get tealMuted() { return getIsDark() ? "rgba(12, 166, 120, 0.18)" : alpha("#0ca678", 0.12); },
  get surface() { return getIsDark() ? "#0e1626" : "#ffffff"; },
  get surfaceAlt() { return getIsDark() ? "#050811" : "#f8f9fe"; },
  get border() { return getIsDark() ? "rgba(255, 255, 255, 0.08)" : "#e8ecf4"; },
  get borderMid() { return getIsDark() ? "rgba(255, 255, 255, 0.14)" : "#d4daf0"; },
  get text() { return getIsDark() ? "#f8fafc" : "#0f1b35"; },
  get textSub() { return getIsDark() ? "#cbd5e1" : "#4a5568"; },
  get textMuted() { return "#94a3b8"; },
  get shadow() { return getIsDark() ? "0 4px 20px rgba(0,0,0,0.4)" : "0 1px 3px rgba(15,27,53,0.06), 0 4px 16px rgba(15,27,53,0.04)"; },
  get shadowHover() { return getIsDark() ? "0 8px 24px rgba(0,0,0,0.5)" : "0 4px 20px rgba(59,91,219,0.12)"; },
  radius: 14,
  radiusSm: 10,
};

const GRADIENT_HEADER = "linear-gradient(135deg, #0e1626 0%, #172338 100%)";
const GRADIENT_SCORE  = "linear-gradient(135deg, #0e1626 0%, #172338 100%)";

const DETAIL_TABS = [
  { key: "activity",   label: "Activity"    },
  { key: "comments",   label: "Comments"    },
  { key: "documents",  label: "Documents"   },
  { key: "siteVisits", label: "Site visits" },
  { key: "siteSurvey", label: "Site survey" },
  { key: "quotations", label: "Quotations"  },
  { key: "threeDDesign", label: "3D Design"  },
  { key: "reminders",  label: "Reminders"   },
];

const PROJECT_TYPES = ["Residential", "Commercial", "ULA 1kw On-grid", "Maintenance", "Others"];

const PIPELINE_STAGES = [
  { key: "New",                    label: "New"                    },
  { key: "Visit",                  label: "Visit"                  },
  { key: "Registration",           label: "Registration"           },
  { key: "Bank Loan Apply",        label: "Bank Loan Apply"        },
  { key: "Document Submission",    label: "Document Submission"    },
  { key: "Bank at Pending",        label: "Bank at Pending"        },
  { key: "Disbursement",           label: "Disbursement"           },
  { key: "Installation Completion",label: "Installation Completion"},
];

const DEAL_PIPELINE_STAGES = [
  { key: "new", label: "New", icon: <Add />, sub: "Lead created" },
  { key: "contacted", label: "Contacted", icon: <Phone />, sub: "Initial contact" },
  { key: "qualified", label: "Qualified", icon: <AssignmentTurnedIn />, sub: "Needs confirmed" },
  { key: "site_visit_scheduled", label: "Site Visit", icon: <AccessTime />, sub: "Visit booked" },
  { key: "site_survey", label: "Site Survey", icon: <CameraAltOutlined />, sub: "Survey complete" },
  { key: "proposal_sent", label: "Proposal Sent", icon: <DescriptionOutlined />, sub: "Quote shared" },
  { key: "project_converted", label: "Project Converted", icon: <Workspaces />, sub: "Active project" },
];

// ─── Utilities ────────────────────────────────────────────────────────────────
const formatDate = (value, pattern = "dd MMM yyyy") => {
  if (!value) return "—";
  try {
    const parsed = typeof value === "string" ? parseISO(value) : new Date(value);
    return isValid(parsed) ? format(parsed, pattern) : "—";
  } catch { return "—"; }
};
const formatDateTime = (value) => formatDate(value, "dd MMM yyyy, hh:mm a");
const formatCurrency = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return "₹0";
  return `₹${Math.round(number).toLocaleString("en-IN")}`;
};
const formatDateTimeInputValue = (value) => {
  if (!value) return "";
  try {
    const parsed = typeof value === "string" ? parseISO(value) : new Date(value);
    if (!isValid(parsed)) return "";
    const pad = (num) => String(num).padStart(2, "0");
    return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}T${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`;
  } catch {
    return "";
  }
};

const formatDateInputValue = (value) => {
  if (!value) return "";
  try {
    const parsed = typeof value === "string" ? parseISO(value) : new Date(value);
    if (!isValid(parsed)) return "";
    return format(parsed, "yyyy-MM-dd");
  } catch {
    return "";
  }
};

const getSiteSurveyRecord = (lead) => {
  if (!lead?.siteSurvey || typeof lead.siteSurvey !== "object") return null;
  return lead.siteSurvey;
};

const normalizeActivityType = (type, activity = {}) => {
  const normalized = String(type || "").trim().toLowerCase();
  const text = String(
    activity?.message ??
    activity?.notes ??
    activity?.followUpNotes ??
    activity?.comment ??
    activity?.description ??
    ""
  ).trim().toLowerCase();
  const readableText = text.replace(/^[^\w]+/, "").trim();
  if (["log call", "call", "called", "call log", "phone call"].includes(normalized)) return "Log call";
  if (readableText.startsWith("call log:") || readableText.startsWith("called") || readableText.startsWith("phone call")) return "Log call";
  if (normalized === "note" || normalized === "comment") return "Comment";
  if (normalized === "message" || normalized === "email") return "Email";
  return type || "Comment";
};

const normalizeActivityMessage = (activity) => {
  const message = String(
    activity?.message ??
    activity?.notes ??
    activity?.followUpNotes ??
    activity?.comment ??
    activity?.description ??
    ""
  ).trim();
  return message
    .replace(/^call log:\s*/i, "")
    .replace(/^[^\w]*called\s*[·-]\s*[^,\n]+,\s*[^,\n]+\s*/i, "")
    .trim();
};

const isCallActivity = (entry) => normalizeActivityType(entry?.type, entry) === "Log call";

const normalizeLeadActivities = (activities) =>
  Array.isArray(activities)
    ? activities
        .filter((activity) => activity && typeof activity === "object" && activity.type !== "document_statuses")
        .map((activity, index) => ({
          ...activity,
          id: activity.id || activity._id || `activity-${index}`,
          type: normalizeActivityType(activity.type || activity.activityType || activity.followUpAction, activity),
          message: normalizeActivityMessage(activity),
          createdAt: activity.createdAt || activity.updatedAt || null,
        }))
    : [];

const getActivityDedupKey = (activity) => {
  const scheduledAt = activity?.scheduledAt ? new Date(activity.scheduledAt).getTime() : "";
  const createdAt = activity?.createdAt || activity?.updatedAt;
  const createdTime = createdAt ? new Date(createdAt).getTime() : NaN;
  const createdBucket = Number.isFinite(createdTime) ? Math.floor(createdTime / 60000) : "";
  return [
    normalizeActivityType(activity?.type || activity?.activityType || activity?.followUpAction, activity).toLowerCase(),
    normalizeActivityMessage(activity).toLowerCase(),
    String(activity?.subject || "").trim().toLowerCase(),
    String(activity?.location || "").trim().toLowerCase(),
    scheduledAt,
    String(activity?.assigneeId || "").trim(),
    String(activity?.actorName || "").trim().toLowerCase(),
    createdBucket,
  ].join("|");
};

const mergeLeadActivities = (...groups) => {
  const seen = new Set();
  return normalizeLeadActivities(groups.flat()).filter((activity) => {
    const key = getActivityDedupKey(activity);

    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const hasSiteSurveyRecord = (lead) => {
  return hasVisitSiteSurvey(lead);
};

const isNotAssignedLabel = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  return !normalized || normalized === "not assigned";
};

const formatSurveyValue = (value) => {
  if (Array.isArray(value)) return value.length ? value.join(", ") : "—";
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value.trim() || "—";
  return String(value);
};

const getSurveyPhotoUrl = (photo) => {
  if (!photo) return "";

  if (typeof photo === "string") {
    return toBackendAssetUrl(photo);
  }

  if (typeof photo === "object") {
    return toBackendAssetUrl(
      photo.url ||
        photo.uri ||
        photo.photoUrl ||
        photo.imageUrl ||
        photo.secure_url ||
        photo.downloadURL ||
        photo.path ||
        photo.location ||
        photo.filename ||
        photo.filePath ||
        photo.file_url ||
        photo.src ||
        ""
    );
  }

  return "";
};

const SITE_SURVEY_GENERAL_ROWS = [
  [
    { key: "roofType", label: "Roof Type" },
    { key: "roofMaterial", label: "Roof Material" },
  ],
  [
    { key: "roofCondition", label: "Roof Condition" },
    { key: "shadingIssues", label: "Shading Issues" },
  ],
  [
    { key: "siteAccess", label: "Site Access" },
    { key: "existingElectricalLoad", label: "Existing Electrical Load (kW)" },
  ],
  [
    { key: "kilowattEnhancement", label: "Kilowatt Enhancement (kW)" },
    { key: "mainDistributionBoardLocation", label: "Main Distribution Board Location" },
  ],
  [
    { key: "earthingAvailable", label: "Earthing Available" },
    { key: "phaseType", label: "Phase Type" },
  ],
  [
    { key: "recommendedPanelBrand", label: "Recommended Panel Brand" },
    { key: "panelCapacity", label: "Panel Capacity" },
  ],
  [
    { key: "recommendedInverterBrand", label: "Recommended Inverter Brand" },
    { key: "inverterCapacity", label: "Inverter Capacity" },
  ],
  [
    { key: "inverterType", label: "Inverter Type" },
    { key: "availableRoofArea", label: "Available Roof Area (sq ft)" },
  ],
  [
    { key: "usableRoofArea", label: "Usable Roof Area (sq ft)" },
    { key: "distanceFromRoofToDb", label: "Distance Roof to DB (meters)" },
  ],
];

const getPersonDisplayName = (person) => {
  const fullName = [person?.firstName, person?.lastName].filter(Boolean).join(" ").trim();
  return fullName || person?.name || person?.email || "Unknown";
};

const WORK_ORDER_SYSTEM_TYPES = ["On-Grid", "Off-Grid", "Hybrid"];

const WORK_ORDER_COMPONENT_BLUEPRINTS = [
  { name: "Solar Module", qty: ({ form }) => form.panelQty ? `${form.panelQty} NOS` : "", warranty: ({ form }) => form.panelWarrantyYears || "" },
  { name: "PCU / Inverter", qty: ({ form }) => form.inverterQty ? `${form.inverterQty} NOS` : "", warranty: ({ form }) => form.inverterWarrantyYears || "" },
  { name: "MM Structure", qty: ({ form, latestQuotation }) => form.structureCapacity || latestQuotation?.systemSize || form.systemSize || "", warranty: ({ form }) => form.bosWarrantyYears || "" },
  { name: "DC & AC Box", qty: ({ form }) => form.dcdbAcdb || "1 NOS", warranty: ({ form }) => form.bosWarrantyYears || "" },
  { name: "AC / DC Cables", qty: ({ form }) => [form.dcCableSpec, form.acCableSpec].filter(Boolean).join(" / ") || "Best in industry", warranty: ({ form }) => form.cableWarrantyYears || "" },
  { name: "Lightning + Earthing", qty: ({ form }) => [form.lightningArrestor, form.earthing].filter(Boolean).join(" / ") || "As per design", warranty: ({ form }) => form.bosWarrantyYears || "" },
  { name: "Accessories", qty: () => "1 NOS", warranty: ({ form }) => form.bosWarrantyYears || "" },
];

function loadLocalScript(src, globalCheck) {
  if (globalCheck()) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      existing.addEventListener("load", resolve, { once: true });
      existing.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

const sanitizeFileName = (value) =>
  String(value || "work-order")
    .trim()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "work-order";

const coerceDisplayValue = (value) => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

const buildLeadAddress = (lead) =>
  [
    lead?.address,
    lead?.city,
    lead?.state,
    lead?.pincode,
  ]
    .filter(Boolean)
    .join(", ");

const buildLeadName = (lead) =>
  lead?.customerName ||
  lead?.name ||
  lead?.fullName ||
  [lead?.firstName, lead?.lastName].filter(Boolean).join(" ").trim() ||
  "Customer";

const normalizeWorkOrderSystemType = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "on-grid" || normalized === "on grid") return "On-Grid";
  if (normalized === "off-grid" || normalized === "off grid") return "Off-Grid";
  if (normalized === "hybrid") return "Hybrid";
  return "On-Grid";
};

const buildInstallationLocation = (lead, siteSurveyRecord) =>
  siteSurveyRecord?.locationName ||
  lead?.installationAddress ||
  lead?.siteAddress ||
  buildLeadAddress(lead);

const buildWorkOrderComponents = (latestQuotation) => {
  const form = latestQuotation?.form || {};
  return WORK_ORDER_COMPONENT_BLUEPRINTS.map((item, index) => ({
    id: `component-${index + 1}`,
    name: item.name,
    qty: coerceDisplayValue(item.qty({ form, latestQuotation })),
    warranty: coerceDisplayValue(item.warranty({ form, latestQuotation })),
  }));
};

const buildInitialWorkOrder = ({ lead, quotations, siteSurveyRecord }) => {
  const latestQuotation = [...(quotations || [])].sort(
    (leftEntry, rightEntry) => new Date(rightEntry.savedAt || rightEntry.createdAt || 0) - new Date(leftEntry.savedAt || leftEntry.createdAt || 0),
  )[0] || null;
  const form = latestQuotation?.form || {};

  return {
    documentDate: formatDateInputValue(new Date()) || "",
    customerName: buildLeadName(lead),
    customerAddress: buildLeadAddress(lead),
    systemSizeKw: coerceDisplayValue(latestQuotation?.systemSize || form.systemSize),
    systemType: normalizeWorkOrderSystemType(form.systemType),
    grandTotal: coerceDisplayValue(latestQuotation?.totalCost || form.totalCost),
    gstRate: coerceDisplayValue(form.gstRate || "13.8"),
    installationLocation: buildInstallationLocation(lead, siteSurveyRecord),
    components: buildWorkOrderComponents(latestQuotation),
  };
};

const getWorkOrderMissingFields = (workOrder) => {
  const missingFields = [];
  if (!String(workOrder?.customerAddress || "").trim()) missingFields.push("Customer address");
  if (!String(workOrder?.systemSizeKw || "").trim()) missingFields.push("System size (kW)");
  if (!String(workOrder?.grandTotal || "").trim()) missingFields.push("Grand total");
  if (!String(workOrder?.installationLocation || "").trim()) missingFields.push("Installation location");
  const hasFallbackComponents = (workOrder?.components || []).some((component) => !String(component.qty || "").trim());
  if (hasFallbackComponents) {
    missingFields.push("Quotation components (some rows will show default fallbacks)");
  }
  return missingFields;
};

async function downloadNodeAsPdf(targetNode, fileName) {
  if (!targetNode) throw new Error("Work order preview is not ready.");

  await Promise.all([
    loadLocalScript("/vendor/jspdf.umd.min.js", () => window.jspdf?.jsPDF),
    loadLocalScript("/vendor/html2canvas.min.js", () => window.html2canvas),
  ]);

  const jsPDF = window.jspdf?.jsPDF;
  const html2canvas = window.html2canvas;
  if (!jsPDF || !html2canvas) throw new Error("PDF libraries failed to load.");

  if (document.fonts?.ready) {
    await document.fonts.ready;
  }

  const canvas = await html2canvas(targetNode, {
    scale: 2,
    useCORS: true,
    allowTaint: false,
    backgroundColor: "#ffffff",
    width: targetNode.scrollWidth,
    height: targetNode.scrollHeight,
    windowWidth: Math.max(targetNode.scrollWidth, document.documentElement.clientWidth),
    windowHeight: Math.max(targetNode.scrollHeight, document.documentElement.clientHeight),
  });

  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4", compress: true });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 18;
  const usableWidth = pageWidth - margin * 2;
  const usableHeight = pageHeight - margin * 2;
  const sliceHeight = Math.max(1, Math.floor((usableHeight * canvas.width) / usableWidth));
  let offsetY = 0;
  let pageIndex = 0;

  while (offsetY < canvas.height) {
    const pageCanvas = document.createElement("canvas");
    pageCanvas.width = canvas.width;
    pageCanvas.height = Math.min(sliceHeight, canvas.height - offsetY);

    const pageContext = pageCanvas.getContext("2d");
    if (!pageContext) {
      throw new Error("Could not prepare PDF page.");
    }

    pageContext.fillStyle = "#ffffff";
    pageContext.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
    pageContext.drawImage(
      canvas,
      0,
      offsetY,
      canvas.width,
      pageCanvas.height,
      0,
      0,
      canvas.width,
      pageCanvas.height,
    );

    if (pageIndex > 0) {
      pdf.addPage();
    }

    const imageHeight = (pageCanvas.height * usableWidth) / pageCanvas.width;
    pdf.addImage(pageCanvas.toDataURL("image/jpeg", 0.95), "JPEG", margin, margin, usableWidth, imageHeight);

    offsetY += pageCanvas.height;
    pageIndex += 1;
  }

  pdf.save(fileName);
}

function WorkOrderDialog({ open, onClose, lead, quotations, siteSurveyRecord, showSnackbar }) {
  const previewRef = React.useRef(null);
  const initialWorkOrder = useMemo(
    () => buildInitialWorkOrder({ lead, quotations, siteSurveyRecord }),
    [lead, quotations, siteSurveyRecord],
  );
  const [workOrder, setWorkOrder] = useState(initialWorkOrder);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setWorkOrder(initialWorkOrder);
  }, [initialWorkOrder, open]);

  const missingFields = useMemo(() => getWorkOrderMissingFields(workOrder), [workOrder]);

  const updateField = useCallback((field) => (event) => {
    const value = event.target.value;
    setWorkOrder((prev) => ({ ...prev, [field]: value }));
  }, []);

  const updateComponentField = useCallback((componentId, field) => (event) => {
    const value = event.target.value;
    setWorkOrder((prev) => ({
      ...prev,
      components: prev.components.map((component) => (
        component.id === componentId ? { ...component, [field]: value } : component
      )),
    }));
  }, []);

  const addComponent = useCallback(() => {
    setWorkOrder((prev) => ({
      ...prev,
      components: [
        ...prev.components,
        { id: `component-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name: "", qty: "", warranty: "" },
      ],
    }));
  }, []);

  const removeComponent = useCallback((componentId) => {
    setWorkOrder((prev) => ({
      ...prev,
      components: prev.components.filter((component) => component.id !== componentId),
    }));
  }, []);

  const handleDownload = useCallback(async () => {
    if (!previewRef.current) return;

    setDownloading(true);
    try {
      const fileName = `${sanitizeFileName(workOrder.customerName)}-work-order.pdf`;
      await downloadNodeAsPdf(previewRef.current, fileName);
      showSnackbar?.("Work order PDF downloaded.", "success");
    } catch (downloadError) {
      showSnackbar?.(downloadError.message || "Work order download failed.", "error");
    } finally {
      setDownloading(false);
    }
  }, [showSnackbar, workOrder.customerName]);

  return (
    <Dialog
      open={open}
      onClose={downloading ? undefined : onClose}
      fullWidth
      maxWidth="lg"
      PaperProps={{
        sx: {
          borderRadius: 3.5,
          overflow: "hidden",
          bgcolor: TOKEN.surfaceAlt,
          backgroundImage: "none",
          border: `1px solid ${TOKEN.border}`,
          boxShadow: TOKEN.shadow,
        },
      }}
    >
      <DialogTitle
        sx={{
          px: 3,
          py: 2,
          bgcolor: TOKEN.surface,
          borderBottom: `1px solid ${TOKEN.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1.5,
        }}
      >
        <Typography sx={{ fontSize: "1.2rem", fontWeight: 800, color: TOKEN.text }}>
          Work Order
        </Typography>
        <IconButton onClick={onClose} disabled={downloading} size="small" sx={{ color: TOKEN.textMuted }}>
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>

      <Box sx={{ p: { xs: 2, sm: 3 }, maxHeight: "78vh", overflowY: "auto" }}>
        <Box
          ref={previewRef}
          sx={{
            width: "100%",
            maxWidth: 980,
            mx: "auto",
            p: { xs: 2, sm: 2.5 },
            borderRadius: 3,
            bgcolor: TOKEN.surface,
            border: `1px solid ${TOKEN.border}`,
          }}
        >
          {missingFields.length ? (
            <Alert
              severity="warning"
              icon={false}
              sx={{
                mb: 2.25,
                alignItems: "flex-start",
                borderRadius: 2.5,
                bgcolor: getIsDark() ? "rgba(245, 158, 11, 0.1)" : "#fff7ed",
                color: getIsDark() ? "#fbbf24" : "#b45309",
                border: `1px solid ${alpha("#f59e0b", getIsDark() ? 0.3 : 0.18)}`,
                "& .MuiAlert-message": { width: "100%" },
              }}
            >
              <Typography sx={{ fontSize: "0.95rem", fontWeight: 700, mb: 0.6 }}>
                The PDF will be generated with blanks for:
              </Typography>
              <Box component="ul" sx={{ m: 0, pl: 2.2 }}>
                {missingFields.map((item) => (
                  <Box component="li" key={item} sx={{ fontSize: "0.82rem", lineHeight: 1.8 }}>
                    {item}
                  </Box>
                ))}
              </Box>
            </Alert>
          ) : null}

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
              gap: 1.6,
              mb: 2,
            }}
          >
            <TextField
              label="Document Date"
              type="date"
              size="small"
              value={workOrder.documentDate}
              onChange={updateField("documentDate")}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="System Size (kW)"
              size="small"
              value={workOrder.systemSizeKw}
              onChange={updateField("systemSizeKw")}
              placeholder="e.g. 3"
            />
            <TextField
              select
              label="System Type"
              size="small"
              value={workOrder.systemType}
              onChange={updateField("systemType")}
            >
              {WORK_ORDER_SYSTEM_TYPES.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Customer Name"
              size="small"
              value={workOrder.customerName}
              onChange={updateField("customerName")}
            />
            <TextField
              label="Grand Total (₹)"
              size="small"
              value={workOrder.grandTotal}
              onChange={updateField("grandTotal")}
              placeholder="Incl. GST"
            />
            <TextField
              label="GST Rate (%)"
              size="small"
              value={workOrder.gstRate}
              onChange={updateField("gstRate")}
            />
            <TextField
              label="Customer Address"
              size="small"
              value={workOrder.customerAddress}
              onChange={updateField("customerAddress")}
              multiline
              minRows={2}
              sx={{ gridColumn: { xs: "span 1", md: "span 2" } }}
            />
            <TextField
              label="Installation Location"
              size="small"
              value={workOrder.installationLocation}
              onChange={updateField("installationLocation")}
              placeholder="Where the plant is installed"
              multiline
              minRows={2}
            />
          </Box>

          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ mb: 1.15 }}
          >
            <Typography sx={{ fontSize: "1rem", fontWeight: 800, color: TOKEN.text }}>
              Components
            </Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Add sx={{ fontSize: 16 }} />}
              onClick={addComponent}
              sx={{
                borderRadius: 999,
                borderColor: TOKEN.borderMid,
                color: TOKEN.text,
                textTransform: "none",
                fontWeight: 700,
              }}
            >
              Add Component
            </Button>
          </Stack>

          <Box sx={{ border: `1px solid ${TOKEN.border}`, borderRadius: 2.5, overflow: "hidden" }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "48px 1.2fr 1fr 0.8fr 40px", md: "56px 1.6fr 1fr 0.95fr 44px" },
                gap: 0,
                bgcolor: TOKEN.surfaceAlt,
                borderBottom: `1px solid ${TOKEN.border}`,
              }}
            >
              {["#", "Component", "Qty", "Warranty", ""].map((label) => (
                <Box
                  key={label || "action"}
                  sx={{
                    px: 1.2,
                    py: 1.05,
                    fontSize: "0.7rem",
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: TOKEN.textMuted,
                  }}
                >
                  {label}
                </Box>
              ))}
            </Box>

            {(workOrder.components || []).map((component, index) => (
              <Box
                key={component.id}
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "48px 1.2fr 1fr 0.8fr 40px", md: "56px 1.6fr 1fr 0.95fr 44px" },
                  alignItems: "center",
                  borderBottom: index === workOrder.components.length - 1 ? "none" : `1px solid ${TOKEN.border}`,
                  bgcolor: index % 2 === 0 ? "#ffffff" : "#fcfdff",
                }}
              >
                <Box sx={{ px: 1.2, py: 1.05, fontSize: "0.85rem", color: TOKEN.textSub }}>
                  {index + 1}
                </Box>
                <Box sx={{ px: 0.6, py: 0.8 }}>
                  <TextField
                    size="small"
                    value={component.name}
                    onChange={updateComponentField(component.id, "name")}
                    placeholder="Component name"
                    fullWidth
                  />
                </Box>
                <Box sx={{ px: 0.6, py: 0.8 }}>
                  <TextField
                    size="small"
                    value={component.qty}
                    onChange={updateComponentField(component.id, "qty")}
                    placeholder="Qty"
                    fullWidth
                  />
                </Box>
                <Box sx={{ px: 0.6, py: 0.8 }}>
                  <TextField
                    size="small"
                    value={component.warranty}
                    onChange={updateComponentField(component.id, "warranty")}
                    placeholder="Years"
                    fullWidth
                  />
                </Box>
                <Box sx={{ px: 0.4, py: 0.8, display: "flex", justifyContent: "center" }}>
                  <IconButton
                    size="small"
                    onClick={() => removeComponent(component.id)}
                    disabled={workOrder.components.length <= 1}
                    sx={{ color: "#dc2626" }}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            ))}
          </Box>

          <Typography sx={{ mt: 0.95, fontSize: "0.72rem", color: TOKEN.textMuted }}>
            Tip: Warranty accepts plain numbers or text like 12 Years.
          </Typography>
        </Box>
      </Box>

      <DialogActions
        sx={{
          px: 3,
          py: 2,
          borderTop: `1px solid ${TOKEN.border}`,
          bgcolor: TOKEN.surface,
          justifyContent: "space-between",
        }}
      >
        <Typography sx={{ fontSize: "0.8rem", color: TOKEN.textMuted }}>
          Generate a PDF from the current form values.
        </Typography>
        <Stack direction="row" spacing={1.2}>
          <Button
            onClick={onClose}
            disabled={downloading}
            sx={{
              borderRadius: 2,
              px: 2.2,
              color: TOKEN.textSub,
              textTransform: "none",
              fontWeight: 700,
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            disableElevation
            onClick={handleDownload}
            disabled={downloading}
            startIcon={<PictureAsPdfOutlined fontSize="small" />}
            sx={{
              borderRadius: 2,
              px: 2.2,
              py: 1,
              bgcolor: getIsDark() ? TOKEN.primary : "#0f172a",
              color: "#ffffff",
              textTransform: "none",
              fontWeight: 800,
              "&:hover": { bgcolor: getIsDark() ? TOKEN.primaryLight : "#111827" },
            }}
          >
            {downloading ? "Generating PDF..." : "Download PDF"}
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}

const IMAGE_DOCUMENT_REGEX = /\.(jpg|jpeg|png|gif|bmp|webp)(\?.*)?$/i;
const PDF_DOCUMENT_REGEX = /\.pdf(\?.*)?$/i;
const CLOUDINARY_IMAGE_DOCUMENT_REGEX = /res\.cloudinary\.com\/.+\/image\/upload\//i;
const CLOUDINARY_PDF_DOCUMENT_REGEX = /res\.cloudinary\.com\/.+\/(?:image|raw)\/upload\/.+\.pdf(\?.*)?$/i;
const MAX_DOCUMENT_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_DOCUMENT_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/jpg",
  "application/pdf",
];

const isPdfDocumentUrl = (url) =>
  Boolean(url && (PDF_DOCUMENT_REGEX.test(url) || CLOUDINARY_PDF_DOCUMENT_REGEX.test(url)));
const isImageDocumentUrl = (url) =>
  Boolean(
    url &&
      !isPdfDocumentUrl(url) &&
      (IMAGE_DOCUMENT_REGEX.test(url) || CLOUDINARY_IMAGE_DOCUMENT_REGEX.test(url))
  );

const getFileNameFromUrl = (url) => {
  if (!url) return "";
  try {
    return decodeURIComponent(url.split("?")[0].split("/").pop() || "");
  } catch {
    return url.split("?")[0].split("/").pop() || "";
  }
};

const getFileExtension = (file) => {
  if (file?.name?.includes(".")) return file.name.slice(file.name.lastIndexOf("."));
  if (file?.type === "application/pdf") return ".pdf";
  if (file?.type === "image/png") return ".png";
  return ".jpg";
};

const createSlotFileName = (label, file) => {
  const base = label.replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "");
  return `${base || "document"}${getFileExtension(file)}`;
};

const normalizeDocumentText = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const STANDARD_DOCUMENT_SLOT_DEFINITIONS = [
  { key: "aadhaar", label: "Aadhaar Card", aliases: ["aadhaar", "adhar"], accent: "#22c55e" },
  { key: "panCard", label: "PAN Card", aliases: ["pan", "pan card"], accent: "#8b5cf6" },
  { key: "electricityBill", label: "Electricity Bill", aliases: ["electricity bill", "light bill", "power bill"], accent: "#f59e0b" },
  { key: "propertyTaxReceipt", label: "Property Tax Receipt", aliases: ["property tax", "tax receipt"], accent: "#14b8a6" },
  { key: "passportPhoto", label: "Passport Size Photo", aliases: ["passport photo", "passport size", "photo"], accent: "#06b6d4" },
  { key: "cancelledCheque", label: "Cancelled Cheque", aliases: ["cancelled cheque", "canceled cheque", "cheque"], accent: "#6366f1" },
  { key: "bankStatement", label: "Bank Statement", aliases: ["bank statement", "passbook", "bank passbook"], accent: "#3b82f6" },
  { key: "propertyOwnershipProof", label: "Property Ownership Proof", aliases: ["ownership proof", "property ownership", "sale deed", "property paper"], accent: "#f97316" },
  { key: "noc", label: "NOC from Society/Bank", aliases: ["noc", "society", "bank noc"], accent: "#0ea5e9" },
  { key: "signedWorkOrder", label: "Signed Work Order", aliases: ["work order"], accent: "#7c3aed" },
  { key: "signedVendorAgreement", label: "Signed Vendor Agreement", aliases: ["vendor agreement"], accent: "#10b981" },
  { key: "registrationDocument", label: "Registration Document", aliases: ["registration document", "registration"], accent: "#f59e0b" },
];

const DOCUMENT_SLOT_DEFINITIONS = [
  ...STANDARD_DOCUMENT_SLOT_DEFINITIONS,
  { key: "other", label: "Other", aliases: ["other"], accent: "#94a3b8" },
];

const pickMatchingDocument = (pool, aliases, usedIndexes) => {
  const normalizedAliases = aliases.map(normalizeDocumentText);
  const index = pool.findIndex((doc, docIndex) => {
    if (usedIndexes.has(docIndex)) return false;
    const haystack = normalizeDocumentText(doc.name || getFileNameFromUrl(doc.url));
    return normalizedAliases.some((alias) => haystack.includes(alias));
  });

  if (index === -1) return null;
  usedIndexes.add(index);
  return pool[index];
};

const resolveSlotStatus = (doc, slotKey, lead, localOverrides = {}) => {
  const activityMap = lead?.leadActivities?.find((a) => a?.type === "document_statuses")?.statuses || {};
  const statuses = {
    ...(lead?.documentStatuses || {}),
    ...activityMap,
    ...(localOverrides || {}),
  };

  if (slotKey && statuses[slotKey]) return String(statuses[slotKey]).toLowerCase();
  if (doc?.url && statuses[doc.url]) return String(statuses[doc.url]).toLowerCase();
  if (doc?.name && statuses[doc.name]) return String(statuses[doc.name]).toLowerCase();

  if (doc?.status) return String(doc.status).toLowerCase();

  if (slotKey === "aadhaar" && lead?.aadhaar?.status) return String(lead.aadhaar.status).toLowerCase();
  if (slotKey === "panCard" && lead?.panCard?.status) return String(lead.panCard.status).toLowerCase();
  if (slotKey === "bankStatement" && lead?.passbook?.status) return String(lead.passbook.status).toLowerCase();
  if (slotKey === "registrationDocument" && lead?.uploadDocument?.status) return String(lead.uploadDocument.status).toLowerCase();

  return "pending";
};

const getDocumentSlots = (lead, localOverrides = {}) => {
  const pooledDocuments = [];
  if (lead?.uploadDocument?.url) {
    pooledDocuments.push({
      name: "Registration Document",
      url: lead.uploadDocument.url,
      source: "uploadDocument",
    });
  }
  (lead?.otherDocuments || []).forEach((doc) => {
    if (doc?.url) {
      pooledDocuments.push({
        ...doc,
        name: doc.name || getFileNameFromUrl(doc.url),
        source: "otherDocuments",
      });
    }
  });

  const usedIndexes = new Set();

  const standardSlots = STANDARD_DOCUMENT_SLOT_DEFINITIONS.map((slot) => {
    let matchedDocument = null;

    if (slot.key === "aadhaar" && lead?.aadhaar?.url) {
      matchedDocument = { name: "Aadhaar Card", url: lead.aadhaar.url, source: "aadhaar" };
    } else if (slot.key === "panCard" && lead?.panCard?.url) {
      matchedDocument = { name: "PAN Card", url: lead.panCard.url, source: "panCard" };
    } else if (slot.key === "bankStatement" && lead?.passbook?.url) {
      matchedDocument = { name: "Bank Passbook", url: lead.passbook.url, source: "passbook" };
    } else {
      matchedDocument = pickMatchingDocument(pooledDocuments, slot.aliases, usedIndexes);
    }

    const url = matchedDocument?.url || "";
    const fileName = matchedDocument?.name || getFileNameFromUrl(url);
    const isImg = Boolean(
      (url && isImageDocumentUrl(url)) ||
      (fileName && IMAGE_DOCUMENT_REGEX.test(fileName)) ||
      (matchedDocument?.name && IMAGE_DOCUMENT_REGEX.test(matchedDocument.name))
    );
    const previewUrl = isImg ? toBackendAssetUrl(url) : "";
    const slotStatus = url ? resolveSlotStatus(matchedDocument, slot.key, lead, localOverrides) : "empty";

    return {
      ...slot,
      url,
      previewUrl,
      fileName,
      source: matchedDocument?.source || null,
      uploaded: Boolean(url),
      isImage: isImg,
      isPdf: isPdfDocumentUrl(url),
      isCustomOther: false,
      status: slotStatus,
    };
  });

  // Remaining documents in pooledDocuments that were not matched to the 12 standard slots
  const customOtherSlots = [];
  pooledDocuments.forEach((doc, docIndex) => {
    if (!usedIndexes.has(docIndex)) {
      usedIndexes.add(docIndex);
      const url = doc.url || "";
      const rawName = doc.name || getFileNameFromUrl(url);
      const cleanLabel = rawName ? rawName.replace(/\.[^/.]+$/, "") : `Document ${customOtherSlots.length + 1}`;
      const slotStatus = url ? resolveSlotStatus(doc, null, lead, localOverrides) : "empty";
      const isImg = Boolean(
        (url && isImageDocumentUrl(url)) ||
        (rawName && IMAGE_DOCUMENT_REGEX.test(rawName))
      );
      customOtherSlots.push({
        key: `other_${docIndex}_${url}`,
        label: cleanLabel || "Other Document",
        fileName: rawName,
        url,
        previewUrl: isImg ? toBackendAssetUrl(url) : "",
        source: doc.source || "otherDocuments",
        uploaded: true,
        isImage: isImg,
        isPdf: isPdfDocumentUrl(url),
        accent: "#94a3b8",
        isCustomOther: true,
        status: slotStatus,
      });
    }
  });

  // Always show an empty "Other" slot for adding new custom documents
  const emptyOtherSlot = {
    key: "other",
    label: "Other",
    fileName: "",
    url: "",
    previewUrl: "",
    source: null,
    uploaded: false,
    isImage: false,
    isPdf: false,
    accent: "#94a3b8",
    isCustomOther: true,
  };

  return [...standardSlots, ...customOtherSlots, emptyOtherSlot];
};

const getStatusStyles = (status) => {
  const map = {
    "New":                     { bg: alpha("#0ca678", 0.12), color: "#0b8a65",  dot: "#0ca678"  },
    "Visit":                   { bg: alpha("#3b5bdb", 0.10), color: "#3b5bdb",  dot: "#4c6ef5"  },
    "Registration":            { bg: alpha("#7c3aed", 0.10), color: "#6d28d9",  dot: "#8b5cf6"  },
    "Bank Loan Apply":         { bg: alpha("#0ea5e9", 0.10), color: "#0369a1",  dot: "#38bdf8"  },
    "Document Submission":     { bg: alpha("#6366f1", 0.10), color: "#4338ca",  dot: "#818cf8"  },
    "Bank at Pending":         { bg: alpha("#f59e0b", 0.12), color: "#b45309",  dot: "#fbbf24"  },
    "Disbursement":            { bg: alpha("#10b981", 0.12), color: "#047857",  dot: "#34d399"  },
    "Installation Completion": { bg: alpha("#22c55e", 0.12), color: "#15803d",  dot: "#4ade80"  },
    "Missed Leads":            { bg: alpha("#ef4444", 0.10), color: "#dc2626",  dot: "#f87171"  },
  };
  return map[status] || { bg: TOKEN.primaryMuted, color: TOKEN.primary, dot: TOKEN.primary };
};

const getLeadScore = (lead) => {
  if (!lead) return 0;
  const completed = [lead.firstName,lead.phone,lead.email,lead.address,lead.city,
    lead.pincode,lead.solarRequirement,lead.visitDate,
    lead.uploadDocument?.url,lead.aadhaar?.url,lead.panCard?.url,lead.passbook?.url,
  ].filter(Boolean).length;
  const completeness = Math.round((completed / 12) * 65);
  const stageIdx = Math.max(PIPELINE_STAGES.findIndex(s => s.key === lead.status), 0);
  const journey   = Math.round((stageIdx / Math.max(PIPELINE_STAGES.length - 1, 1)) * 35);
  return Math.min(100, completeness + journey);
};

const hasLeadDocuments = (lead) => {
  if (!lead) return false;

  return Boolean(
    lead.uploadDocument?.url ||
    lead.aadhaar?.url ||
    lead.panCard?.url ||
    lead.passbook?.url ||
    lead.installationDocument?.url ||
    (Array.isArray(lead.otherDocuments) && lead.otherDocuments.some((item) => item?.url))
  );
};

const buildSiteVisitEntries = (lead, customActivities = [], assignedPerson = null) => {
  const customSiteVisitEntries = customActivities
    .filter((entry) => entry.type === "Site visit")
    .map((entry) => ({
      id: entry.id || entry.createdAt,
      scheduledAt: entry.scheduledAt,
      location: entry.location,
      notes: entry.message,
      status: "Scheduled",
      assigneeName: entry.assigneeName || getPersonDisplayName(assignedPerson) || "Not assigned",
      source: "custom",
      siteSurvey: null,
    }));

  const backendSiteVisitEntry = lead?.visitDate ? {
    id: `lead-visit-${lead._id}`,
    scheduledAt: lead.visitDate,
    location: lead.visitLocation || [lead.address, lead.city].filter(Boolean).join(", "),
    notes: lead.visitNotes || "",
    status: resolveVisitStatus(lead),
    assigneeName: assignedPerson ? getPersonDisplayName(assignedPerson) : "Not assigned",
    source: "lead",
    siteSurvey: getSiteSurveyRecord(lead),
  } : null;

  const siteVisitEntries = [...customSiteVisitEntries];
  if (backendSiteVisitEntry) {
    const matchingCustomIndex = customSiteVisitEntries.findIndex((entry) =>
      entry.scheduledAt === backendSiteVisitEntry.scheduledAt &&
      String(entry.location || "") === String(backendSiteVisitEntry.location || ""),
    );
    if (matchingCustomIndex !== -1) {
      siteVisitEntries[matchingCustomIndex] = {
        ...siteVisitEntries[matchingCustomIndex],
        status: backendSiteVisitEntry.status,
        notes: backendSiteVisitEntry.notes || siteVisitEntries[matchingCustomIndex].notes,
        siteSurvey: backendSiteVisitEntry.siteSurvey,
      };
    } else {
      siteVisitEntries.push(backendSiteVisitEntry);
    }
  }

  return siteVisitEntries
    .map((entry) => {
      const visitStatusInfo = buildVisitStatusInfo({
        visitStatus: entry.status,
        visitDate: entry.scheduledAt,
        siteSurvey: entry.siteSurvey,
      });

      return {
        ...entry,
        status: visitStatusInfo.status,
        visitStatusInfo,
      };
    })
    .sort((a, b) => new Date(a.scheduledAt || 0) - new Date(b.scheduledAt || 0));
};

const getDealPipelineStageIndex = (lead, quotationEntries = []) => {
  if (!lead) return 0;
  if (lead.isProject) return 6;

  const status = String(lead.status || "").toLowerCase();
  const hasContacted = Boolean(
    String(lead.followUpAction || "").trim() ||
    String(lead.followUpNotes || "").trim() ||
    ["contacted", "qualified", "visit", "site visit", "registration", "bank loan apply", "document submission", "bank at pending", "disbursement", "installation completion"].includes(status)
  );
  const hasQualified =
    status === "qualified" ||
    hasLeadDocuments(lead) ||
    ["visit", "site visit", "registration", "bank loan apply", "document submission", "bank at pending", "disbursement", "installation completion"].includes(status);
  const hasVisitStage =
    status === "visit" ||
    status === "site visit" ||
    Boolean(lead.visitDate);
  const hasSiteSurvey = hasSiteSurveyRecord(lead);
  const hasProposalSent = Array.isArray(quotationEntries) && quotationEntries.length > 0;
  const hasPostProposalStage = ["bank at pending", "disbursement", "installation completion"].includes(status);

  if (hasPostProposalStage) {
    return 5;
  }

  if (hasProposalSent) return 5;
  if (hasSiteSurvey) return 4;
  if (hasVisitStage) return 3;
  if (hasQualified) return 2;
  if (hasContacted) return 1;
  return 0;
};

const PipelineActionBanner = ({ card, onAssignLead }) => {
  if (!card) return null;

  return (
    <Paper
      elevation={0}
      sx={{
        mb: 2.25,
        p: { xs: 1.35, md: 1.65 },
        borderRadius: TOKEN.radiusSm,
        border: `1px solid ${alpha("#f59e0b", getIsDark() ? 0.35 : 0.55)}`,
        bgcolor: getIsDark() ? "rgba(245, 158, 11, 0.08)" : "#fff7ed",
        boxShadow: `0 12px 24px ${alpha("#f97316", getIsDark() ? 0.04 : 0.08)}`,
      }}
    >
      <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ xs: "stretch", md: "center" }} justifyContent="space-between">
        <Stack direction="row" spacing={1.35} alignItems="center" sx={{ minWidth: 0 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: TOKEN.radiusSm,
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
              color: "#fff",
              bgcolor: "#d97706",
              boxShadow: `0 10px 18px ${alpha("#d97706", 0.18)}`,
            }}
          >
            {React.cloneElement(card.icon || <ArrowForward />, { sx: { fontSize: 20 } })}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                fontSize: "0.68rem",
                fontWeight: 900,
                letterSpacing: "0.12em",
                color: getIsDark() ? "#fbbf24" : "#b45309",
                textTransform: "uppercase",
                lineHeight: 1.3,
              }}
            >
              {card.eyebrow}
            </Typography>
            <Typography sx={{ mt: 0.25, fontSize: { xs: "0.95rem", md: "1.05rem" }, fontWeight: 900, color: TOKEN.text, lineHeight: 1.25 }}>
              {card.title}
            </Typography>
            <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mt: 0.2 }}>
              <Typography sx={{ fontSize: "0.78rem", color: TOKEN.textSub, lineHeight: 1.35 }}>
                {card.detail}
              </Typography>
              {card.needsAssignment && (
                <Box
                  onClick={onAssignLead}
                  sx={{
                    px: 0.9,
                    py: 0.25,
                    borderRadius: 999,
                    bgcolor: alpha("#dc2626", getIsDark() ? 0.18 : 0.08),
                    border: `1px solid ${alpha("#dc2626", 0.3)}`,
                    cursor: "pointer",
                    "&:hover": {
                      bgcolor: alpha("#dc2626", getIsDark() ? 0.28 : 0.15),
                    },
                  }}
                >
                  <Typography sx={{ fontSize: "0.68rem", fontWeight: 900, color: getIsDark() ? "#f87171" : "#b91c1c", lineHeight: 1.25 }}>
                    Assign the lead
                  </Typography>
                </Box>
              )}
            </Stack>
          </Box>
        </Stack>

        {card.showContactActions && (
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ flexShrink: 0 }}>
            <Button
              variant="outlined"
              startIcon={<Phone sx={{ fontSize: 15 }} />}
              disabled={!card.phone}
              onClick={() => { window.location.href = `tel:${card.phone}`; }}
              sx={{
                height: 38,
                borderRadius: TOKEN.radiusSm,
                px: 1.65,
                bgcolor: getIsDark() ? "#172338" : "#fff",
                color: TOKEN.text,
                borderColor: TOKEN.borderMid,
                fontWeight: 800,
                fontSize: "0.78rem",
                textTransform: "none",
                "&:hover": { bgcolor: getIsDark() ? "#1e2d48" : "#fff", borderColor: alpha("#d97706", 0.55) },
              }}
            >
              Call now
            </Button>
            <Button
              variant="contained"
              disableElevation
              startIcon={<WhatsApp sx={{ fontSize: 15 }} />}
              disabled={!card.phone}
              onClick={() => {
                const phone = String(card.phone || "").replace(/\D/g, "");
                if (phone) window.open(`https://wa.me/${phone}`, "_blank", "noopener,noreferrer");
              }}
              sx={{
                height: 38,
                borderRadius: TOKEN.radiusSm,
                px: 1.65,
                bgcolor: "#c2410c",
                color: "#fff",
                fontWeight: 900,
                fontSize: "0.78rem",
                textTransform: "none",
                boxShadow: `0 10px 18px ${alpha("#c2410c", 0.18)}`,
                "&:hover": { bgcolor: "#9a3412", boxShadow: `0 12px 22px ${alpha("#c2410c", 0.24)}` },
              }}
            >
              Send WhatsApp
            </Button>
          </Stack>
        )}
      </Stack>
    </Paper>
  );
};

const PipelineStepper = ({ currentIndex, stages, actionCard, onStageClick, onAssignLead }) => {
  const safeIdx = currentIndex < 0 ? 0 : currentIndex;
  const progressPct = stages.length > 1 ? Math.round((safeIdx / (stages.length - 1)) * 100) : 0;

  return (
    <Box sx={{ p: { xs: "14px 16px 18px", sm: "16px 20px 20px" } }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography sx={{ fontWeight: 600, fontSize: "0.7rem", letterSpacing: "0.06em", color: alpha(TOKEN.primary, 0.7), textTransform: "uppercase" }}>
          Pipeline · Deals
        </Typography>
        <Box sx={{ px: 1.25, py: 0.35, borderRadius: 999, bgcolor: TOKEN.primaryMuted, border: `0.5px solid ${alpha(TOKEN.primary, 0.15)}` }}>
          <Typography sx={{ fontSize: "0.68rem", fontWeight: 600, color: TOKEN.primary }}>
            Stage {safeIdx + 1} of {stages.length}
          </Typography>
        </Box>
      </Stack>

      {actionCard && <PipelineActionBanner card={actionCard} onAssignLead={onAssignLead} />}

      <Box sx={{ overflowX: "auto", overflowY: "visible", pb: 0.5, mx: -0.25, px: 0.25, scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" } }}>
        <Stack direction="row" alignItems="flex-start" sx={{ minWidth: stages.length * 104, py: "6px" }}>
          {stages.map((stage, idx) => {
            const isDone = idx < safeIdx;
            const isActive = idx === safeIdx;
            const showActionCard = actionCard?.stageKey === stage.key;

            return (
              <React.Fragment key={stage.key}>
                <Box
                  onClick={() => onStageClick?.(stage)}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "6px",
                    width: { xs: 68, sm: 80 },
                    flexShrink: 0,
                    cursor: onStageClick ? "pointer" : "default",
                  }}
                >
                  <Tooltip title={stage.label} placement="top" arrow>
                    <Box sx={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative",
                      flexShrink: 0,
                      transition: "all 0.2s",
                      ...(isDone   && { bgcolor: TOKEN.primary, color: "#fff", boxShadow: `0 4px 12px ${alpha(TOKEN.primary, 0.25)}` }),
                      ...(isActive && { bgcolor: TOKEN.surface, border: `2px solid ${TOKEN.primary}`, color: TOKEN.primary, boxShadow: `0 0 0 4px ${alpha(TOKEN.primary, 0.1)}` }),
                      ...(!isDone && !isActive && { bgcolor: TOKEN.surfaceAlt, border: `0.5px solid ${TOKEN.border}`, color: TOKEN.textMuted }),
                      "&:hover": { transform: onStageClick ? "scale(1.08)" : "none" },
                    }}>
                      {isDone
                        ? <CheckCircle sx={{ fontSize: 16, color: "#fff" }} />
                        : React.cloneElement(stage.icon, { sx: { fontSize: 15 } })}
                    </Box>
                  </Tooltip>

                  <Typography sx={{
                    fontSize: "0.68rem",
                    fontWeight: isActive || isDone || showActionCard ? 600 : 400,
                    color: isActive || showActionCard ? TOKEN.primary : isDone ? TOKEN.text : TOKEN.textMuted,
                    textAlign: "center",
                    lineHeight: 1.3,
                    maxWidth: showActionCard ? { xs: 188, sm: 210 } : { xs: 64, sm: 76 },
                  }}>
                    {stage.label}
                  </Typography>

                  <Typography sx={{ fontSize: "0.6rem", color: isActive || showActionCard ? alpha(TOKEN.primary, 0.7) : TOKEN.textMuted, fontWeight: isActive || showActionCard ? 500 : 400, textAlign: "center", mt: "-4px", lineHeight: 1.2 }}>
                    {showActionCard ? "Next action" : isActive ? "Currently here" : isDone ? stage.sub : "—"}
                  </Typography>

                </Box>

                {idx < stages.length - 1 && (
                  <Box sx={{
                    flex: 1,
                    height: 1.5,
                    borderRadius: 1,
                    mt: "22px",
                    mx: 0.5,
                    bgcolor: idx < safeIdx ? TOKEN.primary : idx === safeIdx ? alpha(TOKEN.primary, 0.2) : TOKEN.border,
                  }} />
                )}
              </React.Fragment>
            );
          })}
        </Stack>
      </Box>

      <Box sx={{ mt: 2 }}>
        <LinearProgress variant="determinate" value={progressPct} sx={{
          height: 3,
          borderRadius: 999,
          bgcolor: TOKEN.border,
          "& .MuiLinearProgress-bar": { bgcolor: TOKEN.primary, borderRadius: 999, transition: "transform 0.5s ease" },
        }} />
        <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.75 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.65rem" }}>{safeIdx} of {stages.length} completed</Typography>
          <Typography variant="caption" sx={{ fontSize: "0.65rem", fontWeight: 600, color: TOKEN.primary }}>{progressPct}%</Typography>
        </Stack>
      </Box>
    </Box>
  );
};

const getScoreBucket = (score) => {
  if (score >= 75) return { label: "Hot",  color: "#f59e0b", bg: alpha("#f59e0b", 0.18) };
  if (score >= 45) return { label: "Warm", color: "#3b82f6", bg: alpha("#3b82f6", 0.18) };
  return               { label: "Cold", color: "#94a3b8", bg: alpha("#94a3b8", 0.18) };
};

const getDocumentItems = (lead) => {
  const docs = [];
  if (lead?.aadhaar?.url)        docs.push({ label: "Aadhaar Card",           url: lead.aadhaar.url });
  if (lead?.panCard?.url)        docs.push({ label: "PAN Card",               url: lead.panCard.url });
  if (lead?.passbook?.url)       docs.push({ label: "Passbook",               url: lead.passbook.url });
  (lead?.otherDocuments || []).forEach((d, i) => {
    if (d?.url) docs.push({ label: d.name || `Document ${i + 1}`, url: d.url });
  });
  if (lead?.uploadDocument?.url) docs.push({ label: "Registration Document",  url: lead.uploadDocument.url });
  return docs;
};

// ─── Shared style helpers ─────────────────────────────────────────────────────
const card = (extra = {}) => ({
  elevation: 0,
  sx: {
    borderRadius: TOKEN.radius,
    border: `0.5px solid ${TOKEN.border}`,
    boxShadow: getIsDark() ? "0 4px 20px rgba(0,0,0,0.3)" : "0 0 0 0.5px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.05)",
    bgcolor: TOKEN.surface,
    backgroundImage: "none",
    overflow: "hidden",
    ...extra,
  },
});

// ─── Reverse Geocoding & Site Survey Address Helper ───────────────────────────
const surveyAddressCache = new Map();

const isCoordinateText = (text) => {
  if (!text || typeof text !== "string") return false;
  const clean = text.trim();
  return /^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/.test(clean) || /^-?\d+\.\d+$/.test(clean);
};

const resolveAddressFromCoords = async (lat, lng) => {
  if (!lat || !lng) return null;
  const numLat = Number(lat);
  const numLng = Number(lng);
  if (!Number.isFinite(numLat) || !Number.isFinite(numLng) || (numLat === 0 && numLng === 0)) return null;

  const key = `${numLat.toFixed(5)},${numLng.toFixed(5)}`;
  if (surveyAddressCache.has(key)) {
    return surveyAddressCache.get(key);
  }

  try {
    const cached = localStorage.getItem(`solar_rev_geo_${key}`);
    if (cached) {
      surveyAddressCache.set(key, cached);
      return cached;
    }
  } catch (e) {}

  // 1. Try BigDataCloud Client Reverse Geocode (free, fast, no CORS issues, reliable in India)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${numLat}&longitude=${numLng}&localityLanguage=en`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      const informative = (data.localityInfo?.informative || [])
        .map((i) => i.name)
        .filter((n) => n && !/india/i.test(n));
      const admin = (data.localityInfo?.administrative || [])
        .filter((a) => a.order >= 4)
        .map((a) => a.name)
        .filter((n) => n && !/india/i.test(n));
      const locality = data.locality || data.city || "";
      const state = data.principalSubdivision || "";
      const postcode = data.postcode || "";
      const country = data.countryName || "";

      const parts = Array.from(
        new Set([...informative, ...admin, locality, state, postcode, country])
      ).filter(Boolean);

      if (parts.length > 0) {
        const full = parts.join(", ");
        surveyAddressCache.set(key, full);
        try { localStorage.setItem(`solar_rev_geo_${key}`, full); } catch (e) {}
        return full;
      }
    }
  } catch (e) {}

  // 2. Try OpenStreetMap Nominatim
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${numLat}&lon=${numLng}&format=json&zoom=18&addressdetails=1`,
      { headers: { "Accept-Language": "en" }, signal: controller.signal }
    );
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      if (data?.display_name) {
        const a = data.address || {};
        const road = a.road || a.pedestrian || a.street || "";
        const neighbourhood = a.suburb || a.neighbourhood || a.residential || a.subdistrict || "";
        const city = a.city || a.town || a.village || a.municipality || "";
        const state = a.state || "";
        const postcode = a.postcode || "";
        const country = a.country || "";
        const parts = [road, neighbourhood, city, state, postcode, country].filter(Boolean);
        const full = parts.length >= 2 ? parts.join(", ") : data.display_name;
        surveyAddressCache.set(key, full);
        try { localStorage.setItem(`solar_rev_geo_${key}`, full); } catch (e) {}
        return full;
      }
    }
  } catch (e) {}

  // 3. Try Google Maps Geocoding API if key is present
  const googleApiKey =
    (typeof process !== "undefined" && process.env?.REACT_APP_GOOGLE_MAPS_API_KEY) ||
    (typeof process !== "undefined" && process.env?.VITE_GOOGLE_MAPS_API_KEY) ||
    "AIzaSyBtLSQIyNMFIy5PzrnzP3pGstDkLViwxiw";

  if (googleApiKey) {
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${numLat},${numLng}&key=${googleApiKey}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data?.results?.[0]?.formatted_address) {
          const full = data.results[0].formatted_address;
          surveyAddressCache.set(key, full);
          try { localStorage.setItem(`solar_rev_geo_${key}`, full); } catch (e) {}
          return full;
        }
      }
    } catch (e) {}
  }

  return null;
};

const SiteSurveyAddressCard = ({ siteSurveyRecord, leadDetails, onOpenMap }) => {
  const lat = siteSurveyRecord?.latitude;
  const lng = siteSurveyRecord?.longitude;

  const initialFallbackAddress = useMemo(() => {
    if (siteSurveyRecord?.address && !isCoordinateText(siteSurveyRecord.address)) {
      return siteSurveyRecord.address;
    }
    if (
      siteSurveyRecord?.locationName &&
      !isCoordinateText(siteSurveyRecord.locationName) &&
      !["site survey", "site visit"].includes(siteSurveyRecord.locationName.trim().toLowerCase())
    ) {
      return siteSurveyRecord.locationName;
    }
    const leadAddr = [
      leadDetails?.address,
      leadDetails?.installationAddress,
      leadDetails?.city,
      leadDetails?.state,
      leadDetails?.pincode,
    ].filter(Boolean).join(", ");
    return leadAddr || "";
  }, [siteSurveyRecord, leadDetails]);

  const [address, setAddress] = useState(initialFallbackAddress);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    if (lat && lng && Number.isFinite(Number(lat)) && Number.isFinite(Number(lng)) && Number(lat) !== 0 && Number(lng) !== 0) {
      const cacheKey = `${Number(lat).toFixed(5)},${Number(lng).toFixed(5)}`;
      if (surveyAddressCache.has(cacheKey)) {
        setAddress(surveyAddressCache.get(cacheKey));
        return;
      }

      setLoading(true);
      resolveAddressFromCoords(lat, lng)
        .then((resolved) => {
          if (active && resolved) {
            setAddress(resolved);
          }
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    } else if (initialFallbackAddress) {
      setAddress(initialFallbackAddress);
    }
    return () => { active = false; };
  }, [lat, lng, initialFallbackAddress]);

  const handleCopy = () => {
    if (!address) return;
    navigator.clipboard?.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasCoords = Boolean(lat && lng && Number(lat) !== 0 && Number(lng) !== 0);

  return (
    <Paper {...card({ p: 0, mb: 1.2 })}>
      <Box sx={{ px: 1.2, py: 0.9, borderBottom: `0.5px solid ${TOKEN.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Typography sx={{ fontSize: "0.64rem", fontWeight: 800, color: TOKEN.textMuted, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Site Location & Address
        </Typography>
        {hasCoords && (
          <Typography sx={{ fontSize: "0.65rem", fontWeight: 600, color: TOKEN.textMuted }}>
            GPS: {lat}, {lng}
          </Typography>
        )}
      </Box>

      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={1.25}
        alignItems={{ xs: "stretch", md: "center" }}
        justifyContent="space-between"
        sx={{ p: 1.25 }}
      >
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            px: 1.5,
            py: 1.2,
            borderRadius: 1.5,
            bgcolor: TOKEN.surfaceAlt,
            border: `0.5px solid ${TOKEN.border}`,
          }}
        >
          <Stack direction="row" spacing={1.2} alignItems="flex-start">
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 1.5,
                bgcolor: alpha("#0284c7", getIsDark() ? 0.2 : 0.1),
                color: getIsDark() ? "#38bdf8" : "#0284c7",
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
                mt: 0.1,
              }}
            >
              <PlaceOutlined sx={{ fontSize: 20 }} />
            </Box>

            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography sx={{ fontSize: "0.6rem", fontWeight: 800, color: TOKEN.textMuted, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Address
              </Typography>
              <Typography
                sx={{
                  mt: 0.35,
                  fontSize: "0.88rem",
                  fontWeight: 700,
                  color: TOKEN.text,
                  lineHeight: 1.45,
                  wordBreak: "break-word",
                }}
              >
                {loading && !address ? (
                  <Typography component="span" sx={{ fontSize: "0.82rem", color: TOKEN.textMuted, fontStyle: "italic" }}>
                    Fetching address from GPS coordinates...
                  </Typography>
                ) : (
                  address || (hasCoords ? `Coordinates: ${lat}, ${lng}` : "No address or GPS location recorded.")
                )}
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Stack direction="row" spacing={1} sx={{ flexShrink: 0, alignSelf: { xs: "flex-end", md: "center" } }}>
          {address && (
            <Tooltip title={copied ? "Address copied!" : "Copy address"}>
              <Button
                variant="outlined"
                size="small"
                startIcon={copied ? <CheckCircle sx={{ fontSize: 14 }} /> : <ContentCopy sx={{ fontSize: 14 }} />}
                onClick={handleCopy}
                sx={{
                  borderRadius: 999,
                  borderColor: copied ? "#10b981" : TOKEN.borderMid,
                  color: copied ? "#10b981" : TOKEN.text,
                  textTransform: "none",
                  fontWeight: 700,
                  fontSize: "0.72rem",
                  px: 1.25,
                  py: 0.7,
                }}
              >
                {copied ? "Copied" : "Copy"}
              </Button>
            </Tooltip>
          )}

          <Button
            variant="outlined"
            size="small"
            startIcon={<PlaceOutlined sx={{ fontSize: 14 }} />}
            onClick={onOpenMap}
            disabled={!hasCoords}
            sx={{
              borderRadius: 999,
              borderColor: TOKEN.borderMid,
              color: TOKEN.text,
              textTransform: "none",
              fontWeight: 700,
              fontSize: "0.72rem",
              px: 1.25,
              py: 0.7,
            }}
          >
            Open in Maps
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function LeadDetailsPage() {
  const { leadId }       = useParams();
  const navigate         = useNavigate();
  const location         = useLocation();
  const { fetchAPI, safeFetchAPI, user } = useAuth();

  const [loading,      setLoading]     = useState(!location.state?.lead);
  const [error,        setError]       = useState("");
  const [leadDetails,  setLeadDetails] = useState(location.state?.lead || null);
  const [tab,          setTab]         = useState(location.state?.initialTab || "activity");
  const [menuAnchor,   setMenuAnchor]  = useState(null);
  const [activityMode, setActivityMode] = useState("Comment");
  const [activityForm, setActivityForm] = useState({
    message: "",
    subject: "",
    scheduledAt: "",
    location: "",
  });
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const openAssignDialog = useCallback(() => setAssignDialogOpen(true), []);
  const closeAssignDialog = useCallback(() => setAssignDialogOpen(false), []);
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [projectDialogSubmitting, setProjectDialogSubmitting] = useState(false);
  const [projectTypeDialogOpen, setProjectTypeDialogOpen] = useState(false);
  const [revertProjectDialogOpen, setRevertProjectDialogOpen] = useState(false);
  const [projectRecoverySaving, setProjectRecoverySaving] = useState(false);
  const [recoveryProjectType, setRecoveryProjectType] = useState("");
  const [pendingUploadSlot, setPendingUploadSlot] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [previewImageZoomed, setPreviewImageZoomed] = useState(false);
  const [uploadingSlotKey, setUploadingSlotKey] = useState("");
  const [documentUploadLinks, setDocumentUploadLinks] = useState([]);
  const [customActivities, setCustomActivities] = useState([]);
  const [otherModalOpen, setOtherModalOpen] = useState(false);
  const [otherDocName, setOtherDocName] = useState("");
  const [otherDocFile, setOtherDocFile] = useState(null);
  const [otherDocError, setOtherDocError] = useState("");
  const [otherDocSubmitting, setOtherDocSubmitting] = useState(false);
  const [docStatusOverrides, setDocStatusOverrides] = useState(() => {
    try {
      const saved = localStorage.getItem("solar_doc_status_overrides");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    if (!leadDetails?._id) return;
    try {
      const stored = localStorage.getItem(`solar_doc_status_${leadDetails._id}`);
      const localMap = stored ? JSON.parse(stored) : {};
      const backendMap = leadDetails?.documentStatuses || {};
      const activityMap = leadDetails?.leadActivities?.find((a) => a?.type === "document_statuses")?.statuses || {};
      const merged = { ...backendMap, ...activityMap, ...localMap };
      if (Object.keys(merged).length > 0) {
        setDocStatusOverrides((prev) => ({ ...prev, ...merged }));
      }
    } catch {}
  }, [leadDetails]);
  const [savingActivity, setSavingActivity] = useState(false);
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);
  const [siteVisitDialogOpen, setSiteVisitDialogOpen] = useState(false);
  const [siteVisitUsers, setSiteVisitUsers] = useState([]);
  const [siteVisitUsersLoading, setSiteVisitUsersLoading] = useState(false);
  const [siteVisitUserError, setSiteVisitUserError] = useState("");
  const [siteVisitAssigneeId, setSiteVisitAssigneeId] = useState("");
  const [processingReminderId, setProcessingReminderId] = useState("");
  const [quotationEntries, setQuotationEntries] = useState([]);
  const [workOrderDialogOpen, setWorkOrderDialogOpen] = useState(false);
  const [loseLeadDialogOpen, setLoseLeadDialogOpen] = useState(false);
  const [loseReason, setLoseReason] = useState("");
  const [submittingLoseLead, setSubmittingLoseLead] = useState(false);
  const [snackbar,     setSnackbar]    = useState({ open: false, message: "", severity: "info" });
  const userRole = user?.role || "TEAM";
  const fileInputRef = React.useRef(null);
  const lastSyncedLeadIdRef = React.useRef("");
  const leadDetailsRef = React.useRef(leadDetails);

  useEffect(() => {
    leadDetailsRef.current = leadDetails;
  }, [leadDetails]);

  const fetchLeadDetails = useCallback(async (options = {}) => {
    const isSilent = typeof options === "boolean" ? options : Boolean(options?.silent);
    if (!leadId) { setError("Lead ID is missing."); setLoading(false); return; }
    const hasExistingData = Boolean(leadDetailsRef.current);
    try {
      if (!isSilent && !hasExistingData) {
        setLoading(true);
      }
      setError("");
      const res = await fetchAPI(`/lead/getLeadById/${leadId}`);
      if (res?.success && res?.result) {
        setLeadDetails(res.result);
      } else {
        throw new Error(res?.message || "Failed to load lead details");
      }
    } catch (err) {
      if (!hasExistingData) {
        setError(err?.message || "Failed to load lead details");
      } else {
        console.warn("Background lead update:", err?.message || err);
      }
    } finally {
      setLoading(false);
    }
  }, [fetchAPI, leadId]);

  const refreshQuotationEntries = useCallback(() => {
    const activeLeadId = leadDetails?._id || leadId;
    setQuotationEntries(activeLeadId ? getQuotationsForLead(activeLeadId) : []);
  }, [leadDetails?._id, leadId]);

  useEffect(() => { fetchLeadDetails(); }, [fetchLeadDetails]);
  useEffect(() => { refreshQuotationEntries(); }, [refreshQuotationEntries]);
  useEffect(() => {
    if (location.state?.initialTab) {
      setTab(location.state.initialTab);
    }
  }, [location.state]);
  useEffect(() => {
    setPreviewImageZoomed(false);
  }, [previewDoc?.url]);

  const documentSlots   = useMemo(() => getDocumentSlots(leadDetails, docStatusOverrides), [leadDetails, docStatusOverrides]);
  const siteSurveyRecord = useMemo(() => getSiteSurveyRecord(leadDetails), [leadDetails]);
  const hasSiteSurvey = useMemo(() => hasSiteSurveyRecord(leadDetails), [leadDetails]);
  const uploadedDocumentCount = useMemo(
    () => documentSlots.filter((slot) => slot.uploaded).length,
    [documentSlots],
  );
  const hasMinimumRequiredDocument = uploadedDocumentCount > 0;
  const documentCompletion = useMemo(
    () => (hasMinimumRequiredDocument ? 100 : 0),
    [hasMinimumRequiredDocument],
  );
  const timelineEntries = useMemo(() =>
    [...(leadDetails?.stageTimeline || [])].sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)),
    [leadDetails],
  );
  const activityStorageKey = useMemo(() => (leadId ? `lead-activity-${leadId}` : ""), [leadId]);
  const activityDraftKey = useMemo(() => (leadId ? `lead-activity-draft-${leadId}` : ""), [leadId]);
  const dealPipelineStageIndex = useMemo(
    () => getDealPipelineStageIndex(leadDetails, quotationEntries),
    [leadDetails, quotationEntries]
  );
  const assignedPerson = leadDetails?.assignedUser || leadDetails?.assignedManager || null;
  const resolvedLeadVisitStatus = useMemo(() => resolveVisitStatus(leadDetails), [leadDetails]);
  const siteVisitEntries = useMemo(
    () => buildSiteVisitEntries(leadDetails, customActivities, assignedPerson),
    [assignedPerson, customActivities, leadDetails]
  );
  const pipelineActionCard = useMemo(() => {
    if (!leadDetails || leadDetails.isProject) return null;

    const status = String(leadDetails.status || "").toLowerCase();
    const hasContacted = Boolean(
      String(leadDetails.followUpAction || "").trim() ||
      String(leadDetails.followUpNotes || "").trim() ||
      ["contacted", "qualified", "visit", "site visit", "registration", "bank loan apply", "document submission", "bank at pending", "disbursement", "installation completion"].includes(status)
    );
    const hasQualified = Boolean(
      status === "qualified" ||
      hasLeadDocuments(leadDetails) ||
      ["visit", "site visit", "registration", "bank loan apply", "document submission", "bank at pending", "disbursement", "installation completion"].includes(status)
    );
    const hasVisitStage = Boolean(
      status === "visit" ||
      status === "site visit" ||
      leadDetails.visitDate ||
      siteVisitEntries.length
    );
    const needsAssignment = !assignedPerson;
    const sourceName = leadDetails.source || "Manual";
    const assignmentText = needsAssignment ? "still unassigned" : "assigned";
    const baseCard = {
      needsAssignment,
      phone: leadDetails.phone || "",
    };

    if (!hasContacted) {
      return {
        ...baseCard,
        stageKey: "contacted",
        icon: <Phone />,
        eyebrow: "Next action - Contacted",
        title: "Contact the customer",
        detail: `Came in via ${sourceName} - ${assignmentText}`,
        showContactActions: true,
      };
    }

    if (!hasQualified) {
      return {
        ...baseCard,
        stageKey: "qualified",
        icon: <AssignmentTurnedIn />,
        eyebrow: "Next action - Qualified",
        title: "Qualify the lead",
        detail: "Confirm the customer requirement before booking a site visit.",
      };
    }

    if (!hasVisitStage) {
      return {
        ...baseCard,
        stageKey: "site_visit_scheduled",
        icon: <AccessTime />,
        eyebrow: "Next action - Site Visit",
        title: "Schedule site visit",
        detail: "Book the inspector visit for this customer.",
      };
    }

    if (!hasSiteSurvey) {
      return {
        ...baseCard,
        stageKey: "site_survey",
        icon: <CameraAltOutlined />,
        eyebrow: "Next action - Site Survey",
        title: "Complete site survey",
        detail: "Capture site survey details for this customer.",
      };
    }

    return null;
  }, [assignedPerson, hasSiteSurvey, leadDetails, siteVisitEntries.length]);
  const leadScore    = useMemo(() => getLeadScore(leadDetails),    [leadDetails]);
  const scoreBucket  = useMemo(() => getScoreBucket(leadScore),    [leadScore]);
  const statusStyles = useMemo(() => getStatusStyles(leadDetails?.status), [leadDetails?.status]);
  const fallbackSiteVisitUsers = useMemo(() => {
    const seen = new Set();
    const options = [];
    const normalizeRole = (role) => {
      const normalized = String(role || "").trim().toLowerCase().replace(/[\s-]+/g, "_");
      if (["team", "team_member", "field_executive"].includes(normalized)) return "TEAM";
      if (normalized === "admin_panel" || normalized === "head_office") return "Admin_panel";
      if (normalized === "zsm" || normalized === "operation_lead") return "ZSM";
      if (normalized === "incharge") return "Incharge";
      return role || "";
    };
    const isTeamMember = (person, fallbackRole = "") => normalizeRole(person?.role || fallbackRole) === "TEAM";
    const pushOption = (person, fallbackRole = "") => {
      if (!person?._id || seen.has(person._id) || !isTeamMember(person, fallbackRole)) return;
      seen.add(person._id);
      options.push({
        _id: person._id,
        firstName: person.firstName || "",
        lastName: person.lastName || "",
        email: person.email || "",
        role: "TEAM",
      });
    };

    pushOption(assignedPerson, leadDetails?.assignedUser ? "TEAM" : leadDetails?.assignedManager ? "Incharge" : "");
    if (normalizeRole(user?.role || userRole) === "TEAM") {
      pushOption(user, user?.role || userRole);
    }
    return options;
  }, [assignedPerson, leadDetails?.assignedManager, leadDetails?.assignedUser, user, userRole]);
  const siteVisitAssigneeOptions = siteVisitUsers.length ? siteVisitUsers : fallbackSiteVisitUsers;
  const selectedSiteVisitAssignee = useMemo(
    () => siteVisitAssigneeOptions.find((option) => option._id === siteVisitAssigneeId) || null,
    [siteVisitAssigneeOptions, siteVisitAssigneeId],
  );

  const persistCustomActivities = useCallback(async (updater) => {
    if (!leadDetails?._id) return [];

    const next = mergeLeadActivities(
      typeof updater === "function" ? updater(customActivities) : updater
    );
    setCustomActivities(next);

    const response = await fetchAPI(`/lead/updateLead/${leadDetails._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadActivities: next }),
    });

    if (response?.success === false) {
      throw new Error(response.message || "Failed to save activity.");
    }

    if (activityStorageKey) localStorage.removeItem(activityStorageKey);
    if (response?.result) setLeadDetails(response.result);
    return next;
  }, [activityStorageKey, customActivities, fetchAPI, leadDetails?._id]);

  const actorName = useMemo(() => {
    const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim();
    return fullName || user?.name || user?.email || "System";
  }, [user]);

  const reminderEntries = useMemo(() => {
    const customReminderEntries = customActivities
      .filter((item) => item.type === "Reminder" && !item.completedAt)
      .map((item) => ({
        ...item,
        source: "custom",
        reminderText: item.message || "Reminder",
        sortAt: item.scheduledAt || item.createdAt,
      }));

    const backendReminderDate = leadDetails?.followUpDate || null;
    const backendReminderText = String(leadDetails?.followUpNotes || "").trim();
    const hasMatchingCustomReminder = customReminderEntries.some((item) => (
      item.scheduledAt === backendReminderDate &&
      String(item.message || "").trim() === backendReminderText
    ));

    if (backendReminderDate && !hasMatchingCustomReminder) {
      customReminderEntries.push({
        id: `lead-followup-${leadDetails?._id || "default"}`,
        source: "lead",
        reminderText: backendReminderText || "Reminder",
        scheduledAt: backendReminderDate,
        createdAt: backendReminderDate,
        sortAt: backendReminderDate,
      });
    }

    return customReminderEntries.sort((a, b) => new Date(a.sortAt || 0) - new Date(b.sortAt || 0));
  }, [customActivities, leadDetails?._id, leadDetails?.followUpDate, leadDetails?.followUpNotes]);

    const combinedComments = useMemo(() => {
    const list = [...customActivities.filter(
      (item) => item.type === "Comment" || isCallActivity(item)
    )];

    if (leadDetails?.notes?.trim()) {
      const alreadyHasNotes = list.some((c) => c.message === leadDetails.notes);
      if (!alreadyHasNotes) {
        list.push({
          id: "lead-initial-note",
          message: leadDetails.notes.trim(),
          actorName: getPersonDisplayName(leadDetails.createdBy) || "Lead Notes",
          createdAt: leadDetails.createdAt || new Date(),
          type: "Comment",
        });
      }
    }

    return list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [customActivities, leadDetails]);

  const hasThreeDDesign = Boolean(leadDetails?.threeDDesign && Array.isArray(leadDetails.threeDDesign.points) && leadDetails.threeDDesign.points.length >= 3);

  const tabCounts = useMemo(() => ({
    activity: timelineEntries.length + customActivities.length,
    comments: combinedComments.length,
    documents: uploadedDocumentCount,
    siteVisits: siteVisitEntries.length,
    siteSurvey: hasSiteSurvey ? 1 : 0,
    quotations: quotationEntries.length,
    threeDDesign: hasThreeDDesign ? 1 : 0,
    reminders: reminderEntries.length,
  }), [combinedComments.length, customActivities, hasSiteSurvey, hasThreeDDesign, quotationEntries.length, reminderEntries.length, siteVisitEntries.length, timelineEntries.length, uploadedDocumentCount]);

  const showInfo = useCallback((msg) => {
    setSnackbar({ open: true, message: msg, severity: "info" });
  }, []);
  const isTeamRole = useCallback((role) => {
    const normalized = String(role || "").trim().toLowerCase().replace(/[\s-]+/g, "_");
    return ["team", "team_member", "field_executive"].includes(normalized);
  }, []);
  const resetActivityForm = useCallback(() => {
    setActivityForm({
      message: "",
      subject: "",
      scheduledAt: "",
      location: "",
    });
  }, []);

  const handleActivityFieldChange = useCallback((field) => (event) => {
    setActivityForm((prev) => ({ ...prev, [field]: event.target.value }));
  }, []);
  const openReminderDialog = useCallback(() => {
    setActivityMode("Reminder");
    setActivityForm((prev) => ({
      ...prev,
      subject: "",
      scheduledAt: "",
      location: "",
    }));
    setReminderDialogOpen(true);
  }, []);
  const closeReminderDialog = useCallback(() => {
    setReminderDialogOpen(false);
  }, []);
  const loadSiteVisitUsers = useCallback(async () => {
    const extractUsers = (response) => {
      if (!response) return [];
      const result = response?.result !== undefined ? response.result : response;
      if (Array.isArray(result?.users)) return result.users;
      if (Array.isArray(result?.data)) return result.data;
      if (Array.isArray(response.result)) return response.result;
      return response.result ? [response.result] : [];
    };
    const normalizeRole = (role) => {
      const normalized = String(role || "").trim().toLowerCase().replace(/[\s-]+/g, "_");
      if (["team", "team_member", "field_executive", "supervisor", "installer"].includes(normalized)) return "TEAM";
      if (normalized === "admin_panel" || normalized === "head_office") return "Admin_panel";
      if (["manager", "zsm", "operation_lead", "operationlead", "project_head", "incharge"].includes(normalized)) return "Incharge";

      return role || "";
    };
    const normalizeUsers = (usersData) => usersData
      .filter((entry) => {
        const status = String(entry?.status || "active").toLowerCase();
        const normRole = normalizeRole(entry?.role);
        return entry?._id && status === "active" && (normRole === "Incharge" || normRole === "TEAM");
      })
      .map((entry) => ({
        _id: entry._id,
        firstName: entry.firstName || "",
        lastName: entry.lastName || "",
        email: entry.email || "",
        role: normalizeRole(entry.role) === "Incharge" ? "Incharge" : "TEAM",
      }));






    try {
      setSiteVisitUsersLoading(true);
      setSiteVisitUserError("");
      const responses = [];

      const allUsersRes = await fetchAPI("/user/getAllUsers?page=1&limit=100");
      if (allUsersRes?.success) {
        responses.push({ items: normalizeUsers(extractUsers(allUsersRes)) });
      }

      const deduped = [];
      const seen = new Set();
      [...fallbackSiteVisitUsers, ...responses.flatMap((response) => response.items)].forEach((entry) => {
        if (!entry?._id || seen.has(entry._id)) return;
        seen.add(entry._id);
        deduped.push(entry);
      });

      setSiteVisitUsers(deduped);
      if (!deduped.length) {
        setSiteVisitUserError("No active team members available for scheduling site visits.");
      }
    } catch (error) {
      setSiteVisitUsers(fallbackSiteVisitUsers);
      setSiteVisitUserError(error.message || "Failed to load users for site visit scheduling.");
    } finally {
      setSiteVisitUsersLoading(false);
    }
  }, [fallbackSiteVisitUsers, safeFetchAPI, user?._id, userRole]);
  const openSiteVisitDialog = useCallback(() => {
    setActivityMode("Site visit");
    setActivityForm((prev) => ({
      ...prev,
      subject: "",
      scheduledAt: "",
      location: [leadDetails?.address, leadDetails?.city].filter(Boolean).join(", "),
    }));
    setSiteVisitAssigneeId(
      (isTeamRole(assignedPerson?.role) ? assignedPerson?._id : "") || (isTeamRole(user?.role) ? user?._id : "") || "",
    );
    setSiteVisitUserError("");
    setSiteVisitDialogOpen(true);
  }, [assignedPerson?._id, assignedPerson?.role, isTeamRole, leadDetails?.address, leadDetails?.city, user?._id, user?.role]);
  const closeSiteVisitDialog = useCallback(() => {
    setSiteVisitDialogOpen(false);
    setActivityMode("Comment");
    setSiteVisitUserError("");
    setActivityForm((prev) => ({
      ...prev,
      subject: "",
      scheduledAt: "",
      location: "",
    }));
  }, []);
  const openLeadEmail = useCallback(() => {
    const recipient = String(leadDetails?.email || "").trim();
    if (!recipient) {
      setSnackbar({ open: true, message: "Lead email address is not available.", severity: "error" });
      return;
    }
    window.location.href = `mailto:${recipient}`;
  }, [leadDetails?.email]);
  const handleActivityModeSelect = useCallback((mode) => {
    if (mode === "Reminder") {
      openReminderDialog();
      return;
    }
    if (mode === "Email") {
      openLeadEmail();
      return;
    }
    if (mode === "Site visit") {
      openSiteVisitDialog();
      return;
    }
    setActivityMode(mode);
  }, [openLeadEmail, openReminderDialog, openSiteVisitDialog]);
  useEffect(() => {
    if (!siteVisitDialogOpen) return;
    loadSiteVisitUsers();
  }, [loadSiteVisitUsers, siteVisitDialogOpen]);
  useEffect(() => {
    if (!siteVisitDialogOpen || siteVisitAssigneeId || !siteVisitAssigneeOptions.length) return;
    setSiteVisitAssigneeId(siteVisitAssigneeOptions[0]._id);
  }, [siteVisitAssigneeId, siteVisitAssigneeOptions, siteVisitDialogOpen]);

  const handleActivitySubmit = useCallback(async () => {
    if (!leadDetails?._id || savingActivity) return;

    const message = activityForm.message.trim();
    const subject = activityForm.subject.trim();
    const locationValue = activityForm.location.trim();
    const scheduledAt = activityForm.scheduledAt ? new Date(activityForm.scheduledAt) : null;
    const derivedVisitLocation = locationValue || [leadDetails?.address, leadDetails?.city].filter(Boolean).join(", ");
    const siteVisitSummary = selectedSiteVisitAssignee
      ? `Site visit scheduled for ${getPersonDisplayName(selectedSiteVisitAssignee)}`
      : "Site visit scheduled";

    if (!message && activityMode !== "Site visit") {
      setSnackbar({ open: true, message: "Please enter details before saving.", severity: "error" });
      return;
    }

    if ((activityMode === "Reminder" || activityMode === "Site visit") && !scheduledAt) {
      setSnackbar({ open: true, message: "Please select date and time.", severity: "error" });
      return;
    }

    if (activityMode === "Site visit" && !siteVisitAssigneeId) {
      setSnackbar({ open: true, message: "Please select a user for the site visit.", severity: "error" });
      return;
    }

    const customEntry = {
      id: `${Date.now()}`,
      type: activityMode,
      message: activityMode === "Email" && subject ? `${subject} — ${message}` : activityMode === "Site visit" ? (message || siteVisitSummary) : (message || locationValue),
      subject,
      location: activityMode === "Site visit" ? derivedVisitLocation : locationValue,
      scheduledAt: scheduledAt ? scheduledAt.toISOString() : null,
      assigneeId: activityMode === "Site visit" ? (selectedSiteVisitAssignee?._id || "") : "",
      assigneeName: activityMode === "Site visit" ? getPersonDisplayName(selectedSiteVisitAssignee) : "",
      actorName,
      actorRole: user?.role || userRole,
      createdAt: new Date().toISOString(),
    };

    const payload = {};
    if (activityMode === "Reminder") {
      payload.followUpAction = "Note";
      payload.followUpDate = scheduledAt.toISOString();
      payload.followUpNotes = message;
    } else if (activityMode === "Site visit") {
      payload.status = "Visit";
      payload.visitStatus = "Scheduled";
      payload.visitDate = scheduledAt.toISOString();
      payload.visitLocation = derivedVisitLocation || null;
      payload.visitNotes = message || siteVisitSummary;
    }

    try {
      setSavingActivity(true);
      if (
        activityMode === "Site visit" &&
        selectedSiteVisitAssignee?._id &&
        selectedSiteVisitAssignee._id !== assignedPerson?._id
      ) {
        const assignPayload = {
          leadId: leadDetails._id,
          targetId: selectedSiteVisitAssignee._id,
          targetRole: selectedSiteVisitAssignee.role,
        };
        if (selectedSiteVisitAssignee.role === "Incharge") assignPayload.managerId = selectedSiteVisitAssignee._id;
        if (selectedSiteVisitAssignee.role === "TEAM") assignPayload.userId = selectedSiteVisitAssignee._id;
        await fetchAPI("/lead/assign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(assignPayload),
        });
      }
      let response;
      if (activityMode === "Comment" || activityMode === "Log call" || activityMode === "Email" || activityMode === "Reminder") {
        response = await fetchAPI(`/lead/${leadDetails._id}/activity`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: activityMode,
            title: customEntry.type,
            message: customEntry.message,
            subject,
            location: customEntry.location,
            scheduledAt: customEntry.scheduledAt,
            status: activityMode === "Reminder" ? "pending" : leadDetails.status,
          }),
        });
      } else {
        response = await fetchAPI(`/lead/updateLead/${leadDetails._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        await fetchAPI(`/lead/${leadDetails._id}/activity`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "Site visit",
            title: "Site visit scheduled",
            message: customEntry.message,
            location: customEntry.location,
            scheduledAt: customEntry.scheduledAt,
            status: "Scheduled",
          }),
        });
      }
      if (response?.result) setLeadDetails(response.result);
      resetActivityForm();
      setReminderDialogOpen(false);
      setSiteVisitDialogOpen(false);
      if (activityMode === "Site visit") {
        setActivityMode("Comment");
      }
      if (activityDraftKey) localStorage.removeItem(activityDraftKey);
      await fetchLeadDetails();
      setSnackbar({ open: true, message: `${activityMode} saved successfully.`, severity: "success" });
    } catch (error) {
      setSnackbar({ open: true, message: error.message || `Failed to save ${activityMode.toLowerCase()}.`, severity: "error" });
    } finally {
      setSavingActivity(false);
    }
  }, [activityDraftKey, activityForm, activityMode, actorName, assignedPerson?._id, customActivities, fetchAPI, fetchLeadDetails, leadDetails?._id, leadDetails?.address, leadDetails?.city, persistCustomActivities, resetActivityForm, savingActivity, selectedSiteVisitAssignee, siteVisitAssigneeId, user?.role, userRole]);
  const handleCompleteReminder = useCallback(async (reminder) => {
    if (!leadDetails?._id || !reminder) return;

    const matchesLeadReminder = (
      reminder.scheduledAt === leadDetails?.followUpDate &&
      String(reminder.reminderText || reminder.message || "").trim() === String(leadDetails?.followUpNotes || "").trim()
    );

    try {
      setProcessingReminderId(reminder.id || "lead");

      if (matchesLeadReminder || reminder.source === "lead") {
        await fetchAPI(`/lead/updateLead/${leadDetails._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            followUpDate: null,
            followUpNotes: "",
          }),
        });
      }

      if (reminder.source === "custom") {
        await persistCustomActivities((prev) => prev.filter((item) => item.id !== reminder.id));
      }

      await fetchLeadDetails();
      setSnackbar({ open: true, message: "Reminder marked complete.", severity: "success" });
    } catch (error) {
      setSnackbar({ open: true, message: error.message || "Failed to complete reminder.", severity: "error" });
    } finally {
      setProcessingReminderId("");
    }
  }, [fetchAPI, fetchLeadDetails, leadDetails?._id, leadDetails?.followUpDate, leadDetails?.followUpNotes, persistCustomActivities]);
  const openEditDialog = useCallback(() => {
    if (leadDetails?._id) setEditModalOpen(true);
  }, [leadDetails?._id]);
  const openProjectMenu = useCallback((event) => {
    setMenuAnchor(event.currentTarget);
  }, []);
  const closeProjectMenu = useCallback(() => {
    setMenuAnchor(null);
  }, []);
  const closeProjectDialog = useCallback(() => {
    if (projectDialogSubmitting) return;
    setProjectDialogOpen(false);
  }, [projectDialogSubmitting]);

  const completeProjectConversion = useCallback(async (quotation = null, projectDetails = {}) => {
    if (!leadDetails?._id) {
      setSnackbar({ open: true, message: "Lead is not ready.", severity: "error" });
      return;
    }



    try {
      setProjectDialogSubmitting(true);
      const quotationCost = quotation ? (Number(quotation.totalCost) || Number(quotation.form?.totalCost) || 0) : 0;
      const response = await fetchAPI(`/lead/updateLead/${leadDetails._id}`, {
        method: "PUT",
        body: JSON.stringify({
          isProject: true,
          projectType: projectDetails.projectType,
          status: "Registration",
          projectStage: "registration",
          currentStage: "registration",
          registrationStatus: "inProgress",
          projectConvertedAt: new Date().toISOString(),
          ...(quotationCost > 0 && {
            projectSaleValue: quotationCost,
            finalPaymentCost: quotationCost,
            finalPaymentDue: quotationCost,
          }),
        }),
      });
      if (response?.success === false) {
        throw new Error(response.message || "Failed to convert lead to project.");
      }

      const updatedLead = response?.result || response?.lead || response || leadDetails;
      setLeadDetails((prev) => ({
        ...(prev || {}),
        ...updatedLead,
        isProject: true,
        status: "Registration",
        projectStage: "registration",
        currentStage: "registration",
        registrationStatus: "inProgress",
        projectConvertedAt: new Date().toISOString(),
        ...(quotationCost > 0 && {
          projectSaleValue: quotationCost,
          finalPaymentCost: quotationCost,
          finalPaymentDue: quotationCost,
        }),
      }));
      if (quotation) {
        updateQuotationStatus(quotation.id, "accepted");
        setCurrentQuotation(quotation);
      }
      setProjectDialogOpen(false);
      setSnackbar({ open: true, message: "Lead converted to project.", severity: "success" });
      navigate("/projects", {
        state: {
          stageFilter: "registration",
          projectStage: "registration",
          highlightProjectId: leadDetails._id,
          highlightLeadId: leadDetails._id,
          quotationId: quotation?.id || null,
          quotationData: quotation || null,
          message: "Lead converted to project. DISCOM Registration is now pending.",
        },
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || "Failed to convert lead to project.",
        severity: "error",
      });
    } finally {
      setProjectDialogSubmitting(false);
    }
  }, [fetchAPI, hasSiteSurvey, leadDetails, navigate]);

  const handleConvertToProject = useCallback(() => {
    if (!leadDetails?._id) {
      setSnackbar({ open: true, message: "Lead is not ready.", severity: "error" });
      return;
    }

    if (leadDetails.isProject) {
      navigate("/projects", { state: { stageFilter: "all", highlightProjectId: leadDetails._id } });
      return;
    }



    setProjectDialogOpen(true);
  }, [hasSiteSurvey, leadDetails, navigate]);

  const handleDealPipelineStageClick = useCallback((stage) => {
    if (!stage?.key) return;
    if (stage.key === "site_visit_scheduled") {
      setTab("siteVisits");
    } else if (stage.key === "site_survey") {
      setTab("siteSurvey");
    } else if (stage.key === "proposal_sent") {
      setTab("quotations");
    } else if (stage.key === "project_converted") {
      handleConvertToProject();
    } else if (stage.key === "new" || stage.key === "contacted" || stage.key === "qualified") {
      setTab("overview");
    }
  }, [handleConvertToProject]);

  const openProjectTypeDialog = useCallback(() => {
    setRecoveryProjectType(PROJECT_TYPES.includes(leadDetails?.projectType) ? leadDetails.projectType : "");
    setProjectTypeDialogOpen(true);
  }, [leadDetails?.projectType]);

  const handleSaveProjectType = useCallback(async () => {
    if (!leadDetails?._id || !recoveryProjectType) return;
    try {
      setProjectRecoverySaving(true);
      const response = await fetchAPI(`/lead/updateLead/${leadDetails._id}`, {
        method: "PUT",
        body: JSON.stringify({ projectType: recoveryProjectType }),
      });
      if (response?.success === false) {
        throw new Error(response.message || "Failed to update project type.");
      }
      const updatedLead = response?.result || response?.lead || response || {};
      setLeadDetails((prev) => ({ ...(prev || {}), ...updatedLead, projectType: recoveryProjectType }));
      setProjectTypeDialogOpen(false);
      setSnackbar({ open: true, message: "Project type updated.", severity: "success" });
      await fetchLeadDetails();
    } catch (error) {
      setSnackbar({ open: true, message: error.message || "Failed to update project type.", severity: "error" });
    } finally {
      setProjectRecoverySaving(false);
    }
  }, [fetchAPI, fetchLeadDetails, leadDetails?._id, recoveryProjectType]);

  const handleRevertProjectToLead = useCallback(async () => {
    if (!leadDetails?._id) return;
    try {
      setProjectRecoverySaving(true);
      const response = await fetchAPI(`/lead/updateLead/${leadDetails._id}`, {
        method: "PUT",
        body: JSON.stringify({ isProject: false }),
      });
      if (response?.success === false) {
        throw new Error(response.message || "Failed to move project back to lead.");
      }
      const updatedLead = response?.result || response?.lead || response || {};
      setLeadDetails((prev) => ({
        ...(prev || {}),
        ...updatedLead,
        isProject: false,
        projectType: undefined,
        projectCode: undefined,
        projectConvertedAt: null,
        projectConvertedBy: null,
      }));
      setRevertProjectDialogOpen(false);
      setSnackbar({ open: true, message: "Project moved back to lead.", severity: "success" });
      await fetchLeadDetails();
    } catch (error) {
      setSnackbar({ open: true, message: error.message || "Failed to move project back to lead.", severity: "error" });
    } finally {
      setProjectRecoverySaving(false);
    }
  }, [fetchAPI, fetchLeadDetails, leadDetails?._id]);

  const openThreeDDesign = useCallback(() => {
    if (!leadDetails?._id) return;
    navigate("/3d-design/new", {
      state: {
        lead: leadDetails,
        returnTo: `/all-leads/${leadDetails._id}`,
        initialLocation:
          siteSurveyRecord?.latitude && siteSurveyRecord?.longitude
            ? {
                lat: Number(siteSurveyRecord.latitude),
                lng: Number(siteSurveyRecord.longitude),
                locationName:
                  siteSurveyRecord.locationName ||
                  leadDetails?.address ||
                  [leadDetails?.city, leadDetails?.state, leadDetails?.pincode]
                    .filter(Boolean)
                    .join(", "),
              }
            : null,
      },
    });
  }, [leadDetails, navigate, siteSurveyRecord]);
  const viewThreeDDesignPreview = useCallback(() => {
    if (!leadDetails?._id || !leadDetails?.threeDDesign) return;
    navigate("/3d-design/preview", {
      state: {
        design: leadDetails.threeDDesign,
        lead: leadDetails,
        returnTo: `/all-leads/${leadDetails._id}`,
      },
    });
  }, [leadDetails, navigate]);
  const handleProjectAction = useCallback((actionKey) => {
    closeProjectMenu();

    if (actionKey === "site-survey") {
      setTab("siteSurvey");
      return;
    }

    if (actionKey === "3d-design") {
      openThreeDDesign();
      return;
    }

    if (actionKey === "vendor-agreement") {
      showInfo("Vendor Agreement is not connected yet.");
      return;
    }

    if (actionKey === "work-order") {
      setWorkOrderDialogOpen(true);
      return;
    }

    if (actionKey === "change-project-type") {
      openProjectTypeDialog();
      return;
    }

    if (actionKey === "move-back-to-lead") {
      setRevertProjectDialogOpen(true);
      return;
    }

    if (actionKey === "mark-as-lost") {
      if (leadDetails?.status === "Missed Leads") {
        handleReopenLead();
      } else {
        setLoseReason("");
        setLoseLeadDialogOpen(true);
      }
    }
  }, [closeProjectMenu, leadDetails, openProjectTypeDialog, openThreeDDesign, showInfo]);

  const handleMarkAsLost = useCallback(async () => {
    if (!leadDetails?._id) return;
    try {
      setSubmittingLoseLead(true);
      const payload = {
        status: "Missed Leads",
      };
      if (loseReason.trim()) {
        payload.reason = loseReason.trim();
        payload.notes = loseReason.trim();
      }
      const response = await fetchAPI(`/lead/updateLead/${leadDetails._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (response?.success === false) {
        throw new Error(response.message || "Failed to mark lead as lost.");
      }

      try {
        await fetchAPI(`/lead/${leadDetails._id}/activity`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "Comment",
            title: "Lead Marked as Lost",
            message: loseReason.trim() ? `Lead marked as lost. Reason: ${loseReason.trim()}` : "Lead marked as lost.",
          }),
        });
      } catch (e) {
        console.error("Failed to add activity log for lead loss", e);
      }

      setLeadDetails((prev) => ({ ...(prev || {}), status: "Missed Leads" }));
      setLoseLeadDialogOpen(false);
      setLoseReason("");
      setSnackbar({ open: true, message: "Lead marked as lost.", severity: "warning" });
      await fetchLeadDetails();
    } catch (err) {
      setSnackbar({ open: true, message: err.message || "Failed to mark lead as lost.", severity: "error" });
    } finally {
      setSubmittingLoseLead(false);
    }
  }, [fetchAPI, fetchLeadDetails, leadDetails?._id, loseReason]);

  const handleReopenLead = useCallback(async () => {
    if (!leadDetails?._id) return;
    try {
      const response = await fetchAPI(`/lead/updateLead/${leadDetails._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "New" }),
      });
      if (response?.success === false) {
        throw new Error(response.message || "Failed to reopen lead.");
      }

      try {
        await fetchAPI(`/lead/${leadDetails._id}/activity`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "Comment",
            title: "Lead Reopened",
            message: "Lead reopened from Missed Leads.",
          }),
        });
      } catch (e) {
        console.error("Failed to add activity log", e);
      }

      setLeadDetails((prev) => ({ ...(prev || {}), status: "New" }));
      setSnackbar({ open: true, message: "Lead reopened successfully.", severity: "success" });
      await fetchLeadDetails();
    } catch (err) {
      setSnackbar({ open: true, message: err.message || "Failed to reopen lead.", severity: "error" });
    }
  }, [fetchAPI, fetchLeadDetails, leadDetails?._id]);
  const handleEditSaved = useCallback(async (updatedLead) => {
    setLeadDetails((prev) => ({ ...(prev || {}), ...(updatedLead || {}) }));
    setSnackbar({ open: true, message: "Lead updated successfully", severity: "success" });
    await fetchLeadDetails();
  }, [fetchLeadDetails]);
  const openDocumentSubmission = useCallback(() => {
    navigate("/document-submission");
  }, [navigate]);
  const openSiteSurveyForm = useCallback(() => {
    navigate("/add-visit", { state: { lead: leadDetails, source: "lead-details-site-survey" } });
  }, [leadDetails, navigate]);
  const openSiteSurveyMap = useCallback(() => {
    if (!siteSurveyRecord?.latitude || !siteSurveyRecord?.longitude) return;
    window.open(
      `https://maps.google.com/?q=${siteSurveyRecord.latitude},${siteSurveyRecord.longitude}`,
      "_blank",
      "noopener,noreferrer",
    );
  }, [siteSurveyRecord?.latitude, siteSurveyRecord?.longitude]);
  const openQuotationBuilder = useCallback(() => {
    if (!leadDetails) return;
    navigate("/quotation/edit", {
      state: {
        lead: leadDetails,
        mode: "create",
        quotationTitle: leadDetails.customerName || leadDetails.name || leadDetails.fullName || "Quotation",
      },
    });
  }, [leadDetails, navigate]);
  const openQuotationPreview = useCallback((quotation, extraState = {}) => {
    if (!quotation) return;
    setCurrentQuotation(quotation);
    navigate(`/quotation?quoteId=${quotation.id}`, {
      state: {
        quotationId: quotation.id,
        quotationData: quotation,
        ...extraState,
      },
    });
  }, [navigate]);
  const openQuotationEditor = useCallback((quotation) => {
    if (!quotation) return;
    navigate("/quotation/edit", {
      state: {
        mode: "edit",
        lead: quotation.lead || leadDetails,
        quotationTitle: quotation.quotationTitle,
        quotationData: quotation,
      },
    });
  }, [leadDetails, navigate]);
  const handleQuotationStatusChange = useCallback(async (quotationId, status) => {
    const nextQuotations = updateQuotationStatus(quotationId, status);
    const activeLeadId = leadDetails?._id || leadId;
    setQuotationEntries(nextQuotations.filter((quotation) => quotation.leadId === activeLeadId));

    if (status === "accepted") {
      const acceptedQuote = nextQuotations.find((q) => q.id === quotationId);
      const quoteCost = acceptedQuote ? (Number(acceptedQuote.totalCost) || Number(acceptedQuote.form?.totalCost) || 0) : 0;
      if (quoteCost > 0 && activeLeadId) {
        try {
          await fetchAPI(`/lead/updateLead/${activeLeadId}`, {
            method: "PUT",
            body: JSON.stringify({
              projectSaleValue: quoteCost,
              finalPaymentCost: quoteCost,
            }),
          });
          setLeadDetails((prev) => ({
            ...(prev || {}),
            projectSaleValue: quoteCost,
            finalPaymentCost: quoteCost,
          }));
        } catch (e) {
          console.error("Failed to sync accepted quotation cost to lead", e);
        }
      }
    }

    setSnackbar({
      open: true,
      message: status === "accepted" ? "Quotation accepted." : "Quotation marked as sent.",
      severity: "success",
    });
  }, [fetchAPI, leadDetails?._id, leadId]);
  const handleQuotationDelete = useCallback((quotationId) => {
    if (!window.confirm("Delete this quotation?")) return;
    const nextQuotations = deleteQuotation(quotationId);
    const activeLeadId = leadDetails?._id || leadId;
    setQuotationEntries(nextQuotations.filter((quotation) => quotation.leadId === activeLeadId));
    setSnackbar({ open: true, message: "Quotation deleted.", severity: "success" });
  }, [leadDetails?._id, leadId]);
  const openDocumentFile = useCallback((url) => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  }, []);
  const downloadDocumentFile = useCallback((url, fileName) => {
    if (!url) return;
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.download = fileName || "document";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);
  const copyDocumentLink = useCallback(async (url) => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setSnackbar({ open: true, message: "Document link copied.", severity: "success" });
    } catch {
      setSnackbar({ open: true, message: "Could not copy document link.", severity: "error" });
    }
  }, []);
  const createDocumentUploadToken = useCallback((id) => (
    window.btoa(String(id)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
  ), []);
  const createDocumentUploadLink = useCallback(() => {
    if (!leadDetails?._id) {
      setSnackbar({ open: true, message: "Lead is not ready.", severity: "error" });
      return;
    }

    const token = createDocumentUploadToken(leadDetails._id);
    const link = `${window.location.origin}/documents/upload/${token}`;
    setDocumentUploadLinks([link]);
    setSnackbar({ open: true, message: "Upload link created.", severity: "success" });
  }, [createDocumentUploadToken, leadDetails?._id]);
  const shareDocumentUploadLink = useCallback((link) => {
    if (!link) return;
    const message = `Please upload your solar documents using this link: ${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  }, []);
  const getDocVerifyStatus = useCallback((slot) => {
    if (!slot?.uploaded) return "empty";
    const status = String(slot.status || "").toLowerCase();
    if (["verified", "approved", "completed", "submitted"].includes(status)) return "verified";
    if (status === "rejected") return "rejected";
    return "pending";
  }, []);
  const updateIndividualDocumentStatus = useCallback(async (slot, newStatus) => {
    if (!leadDetails?._id || !slot?.uploaded) return;

    const nextStatuses = {
      ...docStatusOverrides,
      ...(leadDetails.documentStatuses || {}),
      ...(slot.key ? { [slot.key]: newStatus } : {}),
      ...(slot.url ? { [slot.url]: newStatus } : {}),
      ...(slot.fileName ? { [slot.fileName]: newStatus } : {}),
      ...(slot.label ? { [slot.label]: newStatus } : {}),
    };

    // 1. Immediately update UI state without waiting for network
    setDocStatusOverrides(nextStatuses);

    // 2. Persist to localStorage synchronously
    try {
      localStorage.setItem(`solar_doc_status_${leadDetails._id}`, JSON.stringify(nextStatuses));
      localStorage.setItem("solar_doc_status_overrides", JSON.stringify(nextStatuses));
    } catch {}

    setSnackbar({
      open: true,
      message: `"${slot.label || slot.fileName || 'Document'}" marked as ${newStatus === "verified" ? "verified" : "rejected"}.`,
      severity: "success",
    });

    // 3. Persist to backend asynchronously
    try {
      const payload = {
        documentStatuses: nextStatuses,
      };

      // Also persist in leadActivities array so it persists in MongoDB
      const existingActivities = Array.isArray(leadDetails.leadActivities) ? leadDetails.leadActivities : [];
      const filteredActivities = existingActivities.filter((a) => a?.type !== "document_statuses");
      filteredActivities.push({
        type: "document_statuses",
        statuses: nextStatuses,
        updatedAt: new Date().toISOString(),
      });
      payload.leadActivities = filteredActivities;

      if (slot.source === "aadhaar") {
        payload.aadhaar = { ...(leadDetails.aadhaar || {}), url: slot.url, status: newStatus };
      } else if (slot.source === "panCard") {
        payload.panCard = { ...(leadDetails.panCard || {}), url: slot.url, status: newStatus };
      } else if (slot.source === "passbook") {
        payload.passbook = { ...(leadDetails.passbook || {}), url: slot.url, status: newStatus };
      } else if (slot.source === "uploadDocument") {
        payload.uploadDocument = { ...(leadDetails.uploadDocument || {}), url: slot.url, status: newStatus };
      } else if (slot.source === "otherDocuments") {
        payload.otherDocuments = (leadDetails.otherDocuments || []).map((doc) => {
          const docName = doc?.name || getFileNameFromUrl(doc?.url);
          const isTarget =
            (slot.url && doc?.url === slot.url) ||
            (slot.fileName && (docName === slot.fileName || doc?.name === slot.fileName));
          if (isTarget) {
            return {
              ...doc,
              name: doc.name || slot.fileName,
              url: doc.url || slot.url,
              status: newStatus,
            };
          }
          return doc;
        });
      }

      // Compute overall document status for lead
      const allUploaded = documentSlots.filter((s) => s.uploaded);
      const isAnyRejected = allUploaded.some((s) =>
        (s.key === slot.key || s.url === slot.url)
          ? newStatus === "rejected"
          : (nextStatuses[s.key] === "rejected" || nextStatuses[s.url] === "rejected" || s.status === "rejected")
      );
      const areAllVerified = allUploaded.length > 0 && allUploaded.every((s) =>
        (s.key === slot.key || s.url === slot.url)
          ? newStatus === "verified"
          : (nextStatuses[s.key] === "verified" || nextStatuses[s.url] === "verified" || s.status === "verified")
      );

      payload.documentStatus = isAnyRejected ? "rejected" : areAllVerified ? "submitted" : "pending";

      await fetchAPI(`/lead/updateLead/${leadDetails._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      await fetchLeadDetails();
    } catch (statusError) {
      console.warn("Could not save document status to backend:", statusError);
    }
  }, [docStatusOverrides, documentSlots, fetchAPI, fetchLeadDetails, leadDetails]);

  const handleVerify = useCallback((slot) => {
    updateIndividualDocumentStatus(slot, "verified");
  }, [updateIndividualDocumentStatus]);

  const handleReject = useCallback((slot) => {
    updateIndividualDocumentStatus(slot, "rejected");
  }, [updateIndividualDocumentStatus]);
  const handleDelete = useCallback(async (slot) => {
    if (!leadDetails?._id || !slot?.uploaded || !slot?.source) {
      setSnackbar({ open: true, message: "Document cannot be removed.", severity: "error" });
      return;
    }

    let payload = null;

    if (slot.source === "aadhaar") {
      payload = { aadhaar: { url: null } };
    } else if (slot.source === "panCard") {
      payload = { panCard: { url: null } };
    } else if (slot.source === "passbook") {
      payload = { passbook: { url: null } };
    } else if (slot.source === "uploadDocument") {
      payload = { uploadDocument: { url: null } };
    } else if (slot.source === "otherDocuments") {
      let removed = false;
      payload = {
        otherDocuments: (leadDetails.otherDocuments || []).filter((doc) => {
          const docUrl = doc?.url || "";
          const matches = (slot.url && docUrl === slot.url) || (doc?.name && doc.name === slot.fileName);
          if (matches && !removed) {
            removed = true;
            return false;
          }
          return true;
        }),
      };
    }

    if (!payload) {
      setSnackbar({ open: true, message: "Document cannot be removed.", severity: "error" });
      return;
    }

    try {
      const response = await fetchAPI(`/lead/updateLead/${leadDetails._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response?.success) {
        throw new Error(response?.message || "Failed to delete document");
      }

      setSnackbar({ open: true, message: "Document deleted successfully.", severity: "success" });
      if (previewDoc?.url === slot.url) {
        setPreviewDoc(null);
      }
      if (docStatusOverrides[slot.key] || (slot.url && docStatusOverrides[slot.url])) {
        const nextOverrides = { ...docStatusOverrides };
        if (slot.key) delete nextOverrides[slot.key];
        if (slot.url) delete nextOverrides[slot.url];
        if (slot.fileName) delete nextOverrides[slot.fileName];
        setDocStatusOverrides(nextOverrides);
        try {
          localStorage.setItem(`solar_doc_status_${leadDetails._id}`, JSON.stringify(nextOverrides));
        } catch {}
      }
      await fetchLeadDetails(true);
    } catch (deleteError) {
      setSnackbar({
        open: true,
        message: deleteError.message || "Failed to delete document",
        severity: "error",
      });
    }
  }, [fetchAPI, fetchLeadDetails, leadDetails?._id, leadDetails?.otherDocuments, previewDoc?.url]);
  const validateDocumentFile = useCallback((file) => {
    if (file.size > MAX_DOCUMENT_FILE_SIZE) {
      return "File size should be less than 5MB";
    }
    if (!ALLOWED_DOCUMENT_FILE_TYPES.includes(file.type)) {
      return "Only JPG, PNG and PDF files are allowed";
    }
    return "";
  }, []);
  const openDirectUploadPicker = useCallback((slotKey) => {
    setPendingUploadSlot(slotKey);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  }, []);
  const uploadDocumentForSlot = useCallback(async (slotKey, file) => {
    if (!leadDetails?._id) {
      setSnackbar({ open: true, message: "Lead is not ready for upload.", severity: "error" });
      return;
    }

    const slot = DOCUMENT_SLOT_DEFINITIONS.find((item) => item.key === slotKey);
    if (!slot) {
      setSnackbar({ open: true, message: "Unknown document slot.", severity: "error" });
      return;
    }

    const validationError = validateDocumentFile(file);
    if (validationError) {
      setSnackbar({ open: true, message: validationError, severity: "error" });
      return;
    }

    const formDataToSend = new FormData();
    const jsonData = {
      documentStatus: leadDetails.documentStatus || "pending",
    };

    if (leadDetails.documentNotes) {
      jsonData.documentNotes = leadDetails.documentNotes;
    }
    if (leadDetails.documentSubmissionDate) {
      jsonData.documentSubmissionDate = format(new Date(leadDetails.documentSubmissionDate), "yyyy-MM-dd");
    } else {
      jsonData.documentSubmissionDate = format(new Date(), "yyyy-MM-dd");
    }

    const directFieldMap = {
      aadhaar: "aadhaar",
      panCard: "panCard",
      bankStatement: "passbook",
    };

    if (directFieldMap[slotKey]) {
      formDataToSend.append(directFieldMap[slotKey], file);
    } else {
      const renamedFile = new File([file], createSlotFileName(slot.label, file), {
        type: file.type,
        lastModified: file.lastModified,
      });
      formDataToSend.append("otherDocuments", renamedFile);
    }

    formDataToSend.append("data", JSON.stringify(jsonData));

    try {
      setUploadingSlotKey(slotKey);
      const response = await fetchAPI(`/lead/upload/${leadDetails._id}/upload-documents`, {
        method: "PUT",
        body: formDataToSend,
      });

      if (!response?.success) {
        throw new Error(response?.message || "Failed to upload document");
      }

      setSnackbar({ open: true, message: `${slot.label} uploaded successfully.`, severity: "success" });
      const updatedLead = response?.result?.lead || response?.result || null;
      if (updatedLead) {
        setLeadDetails(updatedLead);
      }
      await fetchLeadDetails(true);
    } catch (uploadError) {
      setSnackbar({
        open: true,
        message: uploadError.message || "Failed to upload document",
        severity: "error",
      });
    } finally {
      setUploadingSlotKey("");
      setPendingUploadSlot(null);
    }
  }, [fetchAPI, fetchLeadDetails, leadDetails, validateDocumentFile]);
  const handleDirectFileSelection = useCallback(async (event) => {
    const file = event.target.files?.[0];
    const slotKey = pendingUploadSlot;
    event.target.value = "";
    if (!file || !slotKey) return;
    await uploadDocumentForSlot(slotKey, file);
  }, [pendingUploadSlot, uploadDocumentForSlot]);

  const openOtherDocumentModal = useCallback((prefillDoc = null) => {
    setOtherDocName(prefillDoc?.label || "");
    setOtherDocFile(null);
    setOtherDocError("");
    setOtherModalOpen(true);
  }, []);

  const closeOtherDocumentModal = useCallback(() => {
    if (otherDocSubmitting) return;
    setOtherModalOpen(false);
    setOtherDocName("");
    setOtherDocFile(null);
    setOtherDocError("");
  }, [otherDocSubmitting]);

  const handleOtherDocumentSubmit = useCallback(async () => {
    if (!otherDocName.trim()) {
      setOtherDocError("Please enter a document name");
      return;
    }
    if (!otherDocFile) {
      setOtherDocError("Please select a file to upload");
      return;
    }
    const validationError = validateDocumentFile(otherDocFile);
    if (validationError) {
      setOtherDocError(validationError);
      return;
    }
    if (!leadDetails?._id) {
      setOtherDocError("Lead details not ready");
      return;
    }

    setOtherDocSubmitting(true);
    setOtherDocError("");

    try {
      const ext = getFileExtension(otherDocFile);
      const cleanDocName = otherDocName.trim();
      const finalFileName = cleanDocName.toLowerCase().endsWith(ext.toLowerCase())
        ? cleanDocName
        : `${cleanDocName}${ext}`;

      const renamedFile = new File([otherDocFile], finalFileName, {
        type: otherDocFile.type,
        lastModified: otherDocFile.lastModified || Date.now(),
      });

      const formDataToSend = new FormData();
      const jsonData = {
        documentStatus: leadDetails.documentStatus || "pending",
        documentSubmissionDate: leadDetails.documentSubmissionDate
          ? format(new Date(leadDetails.documentSubmissionDate), "yyyy-MM-dd")
          : format(new Date(), "yyyy-MM-dd"),
      };
      if (leadDetails.documentNotes) {
        jsonData.documentNotes = leadDetails.documentNotes;
      }

      formDataToSend.append("otherDocuments", renamedFile);
      formDataToSend.append("data", JSON.stringify(jsonData));

      const response = await fetchAPI(`/lead/upload/${leadDetails._id}/upload-documents`, {
        method: "PUT",
        body: formDataToSend,
      });

      if (!response?.success) {
        throw new Error(response?.message || "Failed to upload document");
      }

      setSnackbar({
        open: true,
        message: `"${cleanDocName}" uploaded successfully.`,
        severity: "success",
      });

      setOtherModalOpen(false);
      setOtherDocName("");
      setOtherDocFile(null);
      const updatedLead = response?.result?.lead || response?.result || null;
      if (updatedLead) {
        setLeadDetails(updatedLead);
      }
      await fetchLeadDetails(true);
    } catch (err) {
      setOtherDocError(err.message || "Failed to upload document");
    } finally {
      setOtherDocSubmitting(false);
    }
  }, [fetchAPI, fetchLeadDetails, leadDetails, otherDocFile, otherDocName, validateDocumentFile]);

  // ── Tab content ─────────────────────────────────────────────────────────────
  const renderTabContent = () => {
    if (!leadDetails) return null;

    if (tab === "activity") {
      const actionItems = [
        { key: "Comment", icon: <WhatsApp sx={{ fontSize: 15 }} /> },
        { key: "Log call", icon: <Phone sx={{ fontSize: 15 }} /> },
        { key: "Email", icon: <Email sx={{ fontSize: 15 }} /> },
        { key: "Reminder", icon: <AccessTime sx={{ fontSize: 15 }} /> },
        { key: "Site visit", icon: <PlaceOutlined sx={{ fontSize: 15 }} /> },
      ];

      const getEntryMeta = (entry) => {
        if (entry.source === "custom") {
          if (isCallActivity(entry)) return { label: "CALL", color: "#e11d48", bg: alpha("#e11d48", 0.08), dot: "#fb7185" };
          if (entry.type === "Reminder") return { label: "REMINDER", color: "#d97706", bg: alpha("#d97706", 0.08), dot: "#fbbf24" };
          if (entry.type === "Site visit") return { label: "SITE VISIT", color: "#0f9f6e", bg: alpha("#0f9f6e", 0.08), dot: "#4ade80" };
          if (entry.type === "Email") return { label: "EMAIL", color: "#7c3aed", bg: alpha("#7c3aed", 0.08), dot: "#a78bfa" };
          return { label: "COMMENT", color: "#2563eb", bg: alpha("#2563eb", 0.08), dot: "#60a5fa" };
        }
        const activityType = String(entry.activityType || "").toLowerCase();
        if (activityType === "comment") return { label: "COMMENT", color: "#2563eb", bg: alpha("#2563eb", 0.08), dot: "#60a5fa" };
        if (activityType === "call") return { label: "CALL", color: "#e11d48", bg: alpha("#e11d48", 0.08), dot: "#fb7185" };
        if (activityType === "email") return { label: "EMAIL", color: "#7c3aed", bg: alpha("#7c3aed", 0.08), dot: "#a78bfa" };
        if (activityType === "document") return { label: "DOCUMENT", color: "#0891b2", bg: alpha("#0891b2", 0.08), dot: "#22d3ee" };
        if (activityType === "site_visit") return { label: "SITE VISIT", color: "#0f9f6e", bg: alpha("#0f9f6e", 0.08), dot: "#4ade80" };
        if (activityType === "site_survey") return { label: "SITE SURVEY", color: "#0f9f6e", bg: alpha("#0f9f6e", 0.08), dot: "#4ade80" };
        if (activityType === "quotation") return { label: "QUOTE", color: "#7c3aed", bg: alpha("#7c3aed", 0.08), dot: "#a78bfa" };
        if (activityType === "reminder") return { label: "REMINDER", color: "#d97706", bg: alpha("#d97706", 0.08), dot: "#fbbf24" };
        const timelineText = `${entry.stage || ""} ${entry.notes || ""}`.toLowerCase();
        if (timelineText.includes("assign")) return { label: "ASSIGNED", color: "#0f9f6e", bg: alpha("#0f9f6e", 0.08), dot: "#4ade80" };
        if (timelineText.includes("schedule") || timelineText.includes("reminder") || timelineText.includes("follow up")) {
          return { label: "SCHEDULED", color: "#d97706", bg: alpha("#d97706", 0.08), dot: "#fbbf24" };
        }
        return { label: "UPDATE", color: "#64748b", bg: alpha("#64748b", 0.08), dot: "#94a3b8" };
      };
      const seenActivityKeys = new Set();
      const allEntries = [
        ...customActivities.map((entry) => ({
          ...entry,
          source: "custom",
          updatedAt: entry.createdAt,
          notes: entry.type === "Site visit"
            ? `${entry.location}${entry.message ? ` • ${entry.message}` : ""}`
            : entry.message,
          updatedBy: { firstName: entry.actorName, lastName: "" },
          updatedRole: entry.actorRole,
        })),
        ...timelineEntries
          .map((entry) => ({ ...entry, source: "timeline" })),
      ].filter((entry) => {
        const time = entry.updatedAt || entry.createdAt;
        const timeBucket = time ? Math.floor(new Date(time).getTime() / 60000) : "";
        const text = String(entry.notes || entry.message || entry.title || "").trim().toLowerCase();
        const key = `${timeBucket}|${text}`;
        if (timeBucket && text) {
          if (seenActivityKeys.has(key)) return false;
          seenActivityKeys.add(key);
        }
        return true;
      }).sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));

      const getDayGroupLabel = (value) => {
        if (!value) return "UNKNOWN";
        const entryDate = new Date(value);
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const startOfEntry = new Date(entryDate);
        startOfEntry.setHours(0, 0, 0, 0);
        const diffDays = Math.round((startOfToday - startOfEntry) / (1000 * 60 * 60 * 24));
        const dateLabel = format(entryDate, "dd MMM").toUpperCase();
        if (diffDays === 0) return `TODAY · ${dateLabel}`;
        if (diffDays === 1) return `YESTERDAY · ${dateLabel}`;
        return `${diffDays} DAYS AGO · ${dateLabel}`;
      };

      const getEntryDisplayText = (entry) => {
        if (entry.source === "custom") {
          if (isCallActivity(entry)) {
            const callHeader = `📞 Called · ${formatDate(entry.updatedAt, "dd MMM, hh:mm a")}`;
            return entry.message ? `${callHeader}\n${entry.message}` : callHeader;
          }
          if (entry.type === "Reminder") {
            return entry.message || "Reminder";
          }
          if (entry.type === "Email") {
            return `Email sent${entry.subject ? ` · ${entry.subject}` : ""}${entry.message ? ` · ${entry.message}` : ""}`;
          }
          if (entry.type === "Site visit") {
            return `${entry.location}${entry.message ? ` · ${entry.message}` : ""}`;
          }
        }
        return entry.notes || entry.title || `${entry.stage} updated`;
      };

      const groupedEntries = allEntries.reduce((acc, entry) => {
        const label = getDayGroupLabel(entry.updatedAt);
        if (!acc[label]) acc[label] = [];
        acc[label].push(entry);
        return acc;
      }, {});

      const dayGroups = Object.entries(groupedEntries);
      const latestCallEntry = customActivities
        .filter(isCallActivity)
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0] || null;
      const activeCallTimestamp = latestCallEntry?.createdAt || new Date().toISOString();

      return (
        <Stack spacing={2.5}>
          <Paper {...card({ p: 0 })}>
            <Box sx={{ p: 1.5, borderBottom: `1px solid ${TOKEN.border}` }}>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {actionItems.map((item) => {
                  const selected = activityMode === item.key;
                  return (
                    <Button
                      key={item.key}
                      size="small"
                      disableElevation
                      startIcon={item.icon}
                      onClick={() => handleActivityModeSelect(item.key)}
                      sx={{
                        minWidth: "auto",
                        px: 1.5,
                        py: 0.65,
                        borderRadius: 2,
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        textTransform: "none",
                        color: selected ? "#fff" : TOKEN.textSub,
                        bgcolor: selected ? (item.color || TOKEN.primary) : "transparent",
                        "&:hover": {
                          bgcolor: selected
                            ? (item.color || TOKEN.primary)
                            : alpha(item.color || TOKEN.primary, 0.08),
                        },
                      }}
                    >
                      {item.label}
                    </Button>
                  );
                })}
              </Stack>
            </Box>

            {activityMode === "Log call" && (
              <Box sx={{ px: 2, py: 1.25, borderBottom: `1px solid ${TOKEN.border}` }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Phone sx={{ fontSize: 16, color: "#e11d48" }} />
                  <Typography variant="body2" sx={{ color: TOKEN.text, fontWeight: 700 }}>
                    Called · {formatDate(activeCallTimestamp, "dd MMM, hh:mm a")}
                  </Typography>
                </Stack>
              </Box>
            )}

            <Box sx={{ p: 2 }}>
              <TextField
                placeholder={
                  activityMode === "Comment"
                    ? `Add a comment about ${leadDetails.firstName || "this lead"} — context, next step, what was discussed...`
                    : activityMode === "Log call"
                    ? "Write the call summary, outcome, and next step..."
                    : activityMode === "Email"
                    ? "Write the email summary or message..."
                    : activityMode === "Reminder"
                    ? "Add the reminder note..."
                    : "Add visit notes..."
                }
                value={activityForm.message}
                onChange={handleActivityFieldChange("message")}
                multiline
                minRows={4}
                fullWidth
                sx={{
                  "& .MuiOutlinedInput-root": {
                    alignItems: "flex-start",
                    borderRadius: 0,
                    fontSize: "0.95rem",
                    bgcolor: TOKEN.surface,
                    color: TOKEN.text,
                    "& input, & textarea": { color: TOKEN.text },
                    "& fieldset": { border: "none" },
                  },
                }}
              />

              {activityMode === "Email" && (
                <TextField
                  placeholder="Email subject"
                  value={activityForm.subject}
                  onChange={handleActivityFieldChange("subject")}
                  fullWidth
                  sx={{ mt: 1.5, "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: TOKEN.surfaceAlt, color: TOKEN.text, "& input": { color: TOKEN.text } } }}
                />
              )}
            </Box>

            {(activityMode === "Comment" || activityMode === "Log call") && (
              <Box sx={{ px: 2, py: 1.5, bgcolor: getIsDark() ? "#111c30" : "#f1f5f9", display: "flex", justifyContent: "flex-end", borderTop: `1px solid ${TOKEN.border}` }}>
                <Button
                  variant="contained"
                  disableElevation
                  onClick={handleActivitySubmit}
                  disabled={savingActivity}
                  endIcon={<ArrowForward sx={{ fontSize: 15 }} />}
                  sx={{
                    borderRadius: 2,
                    bgcolor: getIsDark() ? "#3b82f6" : "#0f1f3d",
                    color: "#ffffff",
                    px: 2.75,
                    py: 1,
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    textTransform: "none",
                    boxShadow: "0 4px 12px rgba(15, 31, 61, 0.15)",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      bgcolor: getIsDark() ? "#2563eb" : "#1a237e",
                      boxShadow: "0 6px 18px rgba(15, 31, 61, 0.25)",
                      transform: "translateY(-1px)",
                    },
                    "&:disabled": {
                      opacity: 0.6,
                      transform: "none",
                    },
                  }}
                >
                  {savingActivity ? "Saving..." : activityMode === "Log call" ? "Save call log" : "Post comment"}
                </Button>
              </Box>
            )}
          </Paper>

          <Stack spacing={2}>
            {dayGroups.length > 0 ? dayGroups.map(([groupLabel, entries]) => (
              <Box key={groupLabel}>
                <Typography variant="caption" sx={{ color: "#64748b", fontSize: "0.95rem", fontWeight: 700, letterSpacing: "0.04em", display: "block", mb: 1.5 }}>
                  {groupLabel}
                </Typography>

                <Stack spacing={1.75}>
                  {entries.map((entry, index) => {
                    const meta = getEntryMeta(entry);
                    const actorName = `${entry.updatedBy?.firstName || "System"} ${entry.updatedBy?.lastName || ""}`.trim();

                    return (
                      <Box key={`${groupLabel}-${entry.updatedAt || index}`} sx={{ display: "flex", gap: 1.5 }}>
                        <Box sx={{ width: 28, display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                          <Box sx={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${meta.dot}`, bgcolor: TOKEN.surface, mt: 0.45 }} />
                          {index < entries.length - 1 ? <Box sx={{ width: 2, flex: 1, minHeight: 40, bgcolor: TOKEN.border, mt: 0.5 }} /> : null}
                        </Box>

                        <Box sx={{ flex: 1, pb: 0.5 }}>
                          <Stack direction={{ xs: "column", sm: "row" }} spacing={0.8} alignItems={{ xs: "flex-start", sm: "center" }} sx={{ mb: 0.45 }}>
                            <Typography variant="body2" sx={{ color: TOKEN.text, fontWeight: 800 }}>
                              {actorName}
                            </Typography>
                            <Typography variant="body2" sx={{ color: TOKEN.textMuted }}>
                              · {formatDate(entry.updatedAt, "hh:mm a")}
                            </Typography>
                            <Chip
                              label={meta.label}
                              size="small"
                              sx={{
                                height: 22,
                                bgcolor: meta.bg,
                                color: meta.color,
                                fontWeight: 700,
                                borderRadius: 999,
                                fontSize: "0.72rem",
                              }}
                            />
                          </Stack>

                          <Typography variant="body1" sx={{ color: TOKEN.text, lineHeight: 1.65, whiteSpace: "pre-wrap" }}>
                            {getEntryDisplayText(entry)}
                          </Typography>
                          {entry.scheduledAt ? (
                            <Typography variant="caption" sx={{ color: TOKEN.textMuted, display: "block", mt: 0.45 }}>
                              Scheduled for {formatDateTime(entry.scheduledAt)}
                            </Typography>
                          ) : null}
                          {entry.status ? (
                            <Typography variant="caption" sx={{ color: TOKEN.textMuted, display: "block", mt: 0.45 }}>
                              Status: {entry.status}
                            </Typography>
                          ) : null}
                          {Array.isArray(entry.attachments) && entry.attachments.length > 0 ? (
                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                              {entry.attachments.map((attachment, attachmentIndex) => (
                                <Button
                                  key={`${entry._id || entry.updatedAt}-attachment-${attachmentIndex}`}
                                  size="small"
                                  href={attachment.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  variant="outlined"
                                  sx={{ textTransform: "none", borderRadius: 2 }}
                                >
                                  {attachment.name || `Attachment ${attachmentIndex + 1}`}
                                </Button>
                              ))}
                            </Stack>
                          ) : null}
                        </Box>
                      </Box>
                    );
                  })}
                </Stack>
              </Box>
            )) : (
              <Paper {...card({ p: 3.5, textAlign: "center" })}>
                <Typography variant="body2" sx={{ color: TOKEN.textMuted }}>
                  No activity yet.
                </Typography>
              </Paper>
            )}
          </Stack>
        </Stack>
      );
    }

    if (tab === "comments") {
      const commentEntries = combinedComments;
      const latestEntry = commentEntries[0] || null;

      return (
        <Stack spacing={2.5}>
          <Paper {...card({ p: 0 })}>
            {latestEntry ? (
              <Box sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${TOKEN.border}` }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Phone sx={{ fontSize: 18, color: isCallActivity(latestEntry) ? "#e11d48" : TOKEN.primary }} />
                  <Typography variant="body1" sx={{ color: TOKEN.text, fontWeight: 700 }}>
                    {isCallActivity(latestEntry) ? "Called" : "Commented"} · {formatDate(latestEntry.createdAt, "dd MMM, hh:mm a")}
                  </Typography>
                </Stack>
              </Box>
            ) : null}

            <Box sx={{ p: 2 }}>
              <TextField
                value={activityForm.message}
                onChange={handleActivityFieldChange("message")}
                placeholder={`Add a comment about ${leadDetails.firstName || "this lead"}...`}
                multiline
                minRows={4}
                fullWidth
                sx={{
                  "& .MuiOutlinedInput-root": {
                    alignItems: "flex-start",
                    borderRadius: 0,
                    fontSize: "0.95rem",
                    bgcolor: TOKEN.surface,
                    color: TOKEN.text,
                    "& input, & textarea": { color: TOKEN.text },
                    "& fieldset": { border: "none" },
                  },
                }}
              />
            </Box>

            <Box sx={{ px: 2, py: 1.5, bgcolor: getIsDark() ? "#111c30" : "#f1f5f9", display: "flex", justifyContent: "flex-end", borderTop: `1px solid ${TOKEN.border}` }}>
              <Button
                variant="contained"
                disableElevation
                onClick={handleActivitySubmit}
                disabled={savingActivity}
                endIcon={<ArrowForward sx={{ fontSize: 15 }} />}
                sx={{
                  borderRadius: 2,
                  bgcolor: getIsDark() ? "#3b82f6" : "#0f1f3d",
                  color: "#ffffff",
                  px: 2.75,
                  py: 1,
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  textTransform: "none",
                  boxShadow: "0 4px 12px rgba(15, 31, 61, 0.15)",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    bgcolor: getIsDark() ? "#2563eb" : "#1a237e",
                    boxShadow: "0 6px 18px rgba(15, 31, 61, 0.25)",
                    transform: "translateY(-1px)",
                  },
                  "&:disabled": {
                    opacity: 0.6,
                    transform: "none",
                  },
                }}
              >
                {savingActivity ? "Saving..." : "Post comment"}
              </Button>
            </Box>
          </Paper>

          {commentEntries.length > 0 ? (
            <Stack spacing={1.5}>
              {commentEntries.map((entry) => (
                <Paper key={entry.id || entry.createdAt} {...card({ p: 2 })}>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={0.8} alignItems={{ xs: "flex-start", sm: "center" }} sx={{ mb: 0.75 }}>
                    <Typography variant="body2" sx={{ color: TOKEN.text, fontWeight: 800 }}>
                      {entry.actorName || "System"}
                    </Typography>
                    <Typography variant="body2" sx={{ color: TOKEN.textMuted }}>
                      · {formatDate(entry.createdAt, "dd MMM, hh:mm a")}
                    </Typography>
                    <Chip
                      label={isCallActivity(entry) ? "CALL" : "COMMENT"}
                      size="small"
                      sx={{
                        height: 22,
                        bgcolor: isCallActivity(entry) ? alpha("#e11d48", 0.08) : alpha(TOKEN.primary, 0.08),
                        color: isCallActivity(entry) ? "#e11d48" : TOKEN.primary,
                        fontWeight: 700,
                        borderRadius: 999,
                        fontSize: "0.72rem",
                      }}
                    />
                  </Stack>
                  <Typography variant="body1" sx={{ color: TOKEN.text, lineHeight: 1.65 }}>
                    {entry.message || "No details added."}
                  </Typography>
                </Paper>
              ))}
            </Stack>
          ) : (
            <Paper {...card({ p: 3.5, textAlign: "center" })}>
              <Typography variant="body2" sx={{ color: TOKEN.textMuted }}>
                No comments available.
              </Typography>
            </Paper>
          )}
        </Stack>
      );
    }

   if (tab === "documents") return (
  <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>

    {/* ── Header ── */}
    <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={1.5}>
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: alpha(TOKEN.primary, 0.1), display: "grid", placeItems: "center" }}>
          <Description sx={{ fontSize: 20, color: TOKEN.primary }} />
        </Box>
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: TOKEN.text }}>Documents</Typography>
          <Typography variant="caption" sx={{ color: TOKEN.textMuted }}>Upload at least one image or file to complete this step and move ahead.</Typography>
        </Box>
      </Stack>
      <Button variant="outlined" size="small" startIcon={<LinkIcon sx={{ fontSize: 14 }} />} onClick={createDocumentUploadLink}
        sx={{ borderRadius: 2, px: 1.75, py: 0.75, borderColor: TOKEN.borderMid, color: TOKEN.primary, fontWeight: 700, fontSize: "0.75rem", "&:hover": { borderColor: TOKEN.primary, bgcolor: TOKEN.primaryMuted } }}>
        Create upload link
      </Button>
    </Stack>

    {documentUploadLinks.length > 0 && (
      <Stack spacing={1}>
        <Stack direction="row" spacing={1} alignItems="center">
          <LinkIcon sx={{ fontSize: 14, color: TOKEN.textSub }} />
          <Typography variant="caption" sx={{ color: TOKEN.textSub, fontWeight: 700 }}>
            Active Upload Links
          </Typography>
        </Stack>
        {documentUploadLinks.map((link) => (
          <Paper key={link} elevation={0} sx={{ px: 1, py: 0.85, borderRadius: 2, border: `1px solid ${TOKEN.border}`, bgcolor: TOKEN.surfaceAlt }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <LinkIcon sx={{ fontSize: 14, color: TOKEN.primary, flexShrink: 0 }} />
              <Typography
                variant="caption"
                sx={{
                  flex: 1,
                  minWidth: 0,
                  color: "#d94675",
                  fontFamily: "monospace",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {link}
              </Typography>
              <IconButton size="small" onClick={() => copyDocumentLink(link)}
                sx={{ width: 32, height: 32, borderRadius: 2, bgcolor: "#eaf3ff", color: TOKEN.primary, "&:hover": { bgcolor: "#dbeafe" } }}>
                <ContentCopy sx={{ fontSize: 15 }} />
              </IconButton>
              <IconButton size="small" onClick={() => shareDocumentUploadLink(link)}
                sx={{ width: 32, height: 32, borderRadius: 2, bgcolor: "#eafaf1", color: "#16a34a", "&:hover": { bgcolor: "#dcfce7" } }}>
                <WhatsApp sx={{ fontSize: 16 }} />
              </IconButton>
            </Stack>
          </Paper>
        ))}
      </Stack>
    )}

    {/* ── Progress ── */}
    <Box>
      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}>
        <Typography variant="caption" sx={{ color: TOKEN.textMuted, fontWeight: 600 }}>Upload progress</Typography>
        <Typography variant="caption" sx={{ color: TOKEN.teal, fontWeight: 700 }}>
          {hasMinimumRequiredDocument ? "Step completed" : "1 file required"}
        </Typography>
      </Stack>
      <LinearProgress variant="determinate" value={documentCompletion}
        sx={{ height: 5, borderRadius: 999, bgcolor: TOKEN.border, "& .MuiLinearProgress-bar": { borderRadius: 999, bgcolor: TOKEN.teal } }} />
    </Box>

    {/* ── GPS pill ── */}
    <Chip icon={<PlaceOutlined sx={{ fontSize: 14 }} />} label="GPS active — photos will be location-stamped" size="small"
      sx={{ alignSelf: "flex-start", bgcolor: alpha(TOKEN.teal, 0.1), color: "#0b8a65", fontWeight: 600, fontSize: "0.72rem", borderRadius: 99, "& .MuiChip-icon": { color: "#0b8a65" } }} />

    {(() => {
      const uploadedSlots = documentSlots.filter((slot) => slot.uploaded);
      const unuploadedSlots = documentSlots.filter((slot) => !slot.uploaded);

      return (
        <>
          {/* ── Uploaded Documents Grid ── */}
          {uploadedSlots.length > 0 && (
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2,1fr)", md: "repeat(3,1fr)", lg: "repeat(4,1fr)" }, gap: 1.5, mb: unuploadedSlots.length > 0 ? 1 : 0 }}>
              {uploadedSlots.map((slot) => {
                const docStatus = getDocVerifyStatus(slot);
                const isVerified = docStatus === "verified";
                const isPending = docStatus === "pending";
                const isRejected = docStatus === "rejected";

                return (
                  <Paper key={slot.key} elevation={0}
                    onClick={() => setPreviewDoc(slot)}
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      borderRadius: "10px",
                      border: isVerified ? "1.5px solid #22c55e"
                        : isRejected ? "1.5px solid #ef4444"
                        : "1.5px solid #f59e0b",
                      overflow: "hidden", cursor: "pointer",
                      bgcolor: TOKEN.surface,
                      transition: "transform 0.15s, border-color 0.15s, box-shadow 0.15s",
                      "&:hover": {
                        transform: "translateY(-1px)",
                        borderColor: isVerified ? "#16a34a" : isRejected ? "#dc2626" : "#d97706",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                      },
                    }}>
                    {/* Thumbnail */}
                    <Box sx={{
                      height: 120, bgcolor: TOKEN.surfaceAlt,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      position: "relative", overflow: "hidden",
                      borderBottom: `1px solid ${TOKEN.border}`,
                    }}>
                      {slot.isImage && (slot.previewUrl || slot.url) ? (
                        <Box
                          component="img"
                          src={toBackendAssetUrl(slot.previewUrl || slot.url)}
                          alt={slot.label}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            const fb = e.currentTarget.parentElement?.querySelector(".lead-doc-fallback");
                            if (fb) fb.style.display = "flex";
                          }}
                          sx={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                          }}
                        />
                      ) : null}

                      {/* Fallback Icon Box */}
                      <Stack
                        className="lead-doc-fallback"
                        alignItems="center"
                        justifyContent="center"
                        spacing={0.5}
                        sx={{
                          display: slot.isImage && (slot.previewUrl || slot.url) ? "none" : "flex",
                          width: "100%",
                          height: "100%",
                        }}
                      >
                        {slot.isPdf ? (
                          <PictureAsPdfOutlined sx={{ fontSize: 32, color: "#ef4444" }} />
                        ) : (
                          <InsertDriveFileOutlined sx={{ fontSize: 32, color: TOKEN.primary }} />
                        )}
                        <Typography variant="caption" sx={{ color: TOKEN.textMuted, fontSize: "0.7rem", fontWeight: 700 }}>
                          {slot.isPdf ? "PDF Document" : "File uploaded"}
                        </Typography>
                      </Stack>

                      {/* Top Right Pill Badge */}
                      <Box
                        sx={{
                          position: "absolute",
                          top: 8,
                          right: 8,
                          bgcolor: isVerified ? "#16a34a" : isRejected ? "#ef4444" : "#f59e0b",
                          color: "#fff",
                          px: 1,
                          py: 0.25,
                          borderRadius: "999px",
                          fontSize: "0.65rem",
                          fontWeight: 700,
                          lineHeight: 1.3,
                          boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                        }}
                      >
                        {isVerified ? "Verified" : isRejected ? "Rejected" : "Pending"}
                      </Box>
                    </Box>

                    {/* Body */}
                    <Box sx={{ p: 1.5, flex: 1, display: "flex", flexDirection: "column" }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: TOKEN.text, fontSize: "0.85rem", lineHeight: 1.25, mb: 0.75 }} noWrap title={slot.label}>
                        {slot.label}
                      </Typography>

                      {/* Status row */}
                      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                        {isVerified ? (
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <CheckCircle sx={{ fontSize: 13, color: "#22c55e" }} />
                            <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: "#22c55e" }}>
                              Verified
                            </Typography>
                          </Stack>
                        ) : isRejected ? (
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <Close sx={{ fontSize: 13, color: "#ef4444" }} />
                            <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: "#ef4444" }}>
                              Rejected
                            </Typography>
                          </Stack>
                        ) : (
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <AccessTime sx={{ fontSize: 13, color: "#f59e0b" }} />
                            <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: "#f59e0b" }}>
                              Pending
                            </Typography>
                          </Stack>
                        )}

                        {/* Right action button */}
                        {isVerified ? (
                          <Button
                            size="small"
                            onClick={(e) => { e.stopPropagation(); handleReject(slot); }}
                            sx={{ color: TOKEN.textMuted, fontSize: "0.72rem", fontWeight: 600, textTransform: "none", p: 0, minWidth: 0, "&:hover": { color: "#ef4444" } }}
                          >
                            Reject
                          </Button>
                        ) : isRejected ? (
                          <Button
                            size="small"
                            onClick={(e) => { e.stopPropagation(); handleVerify(slot); }}
                            sx={{ color: "#22c55e", fontSize: "0.72rem", fontWeight: 700, textTransform: "none", p: 0, minWidth: 0, "&:hover": { color: "#16a34a" } }}
                          >
                            Re-verify
                          </Button>
                        ) : (
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Button
                              size="small"
                              onClick={(e) => { e.stopPropagation(); handleVerify(slot); }}
                              sx={{ color: "#22c55e", fontSize: "0.72rem", fontWeight: 700, textTransform: "none", p: 0, minWidth: 0, "&:hover": { color: "#16a34a" } }}
                            >
                              Verify
                            </Button>
                            <Button
                              size="small"
                              onClick={(e) => { e.stopPropagation(); handleReject(slot); }}
                              sx={{ color: "#ef4444", fontSize: "0.72rem", fontWeight: 700, textTransform: "none", p: 0, minWidth: 0, "&:hover": { color: "#dc2626" } }}
                            >
                              Reject
                            </Button>
                          </Stack>
                        )}
                      </Stack>

                      {/* Divider */}
                      <Box sx={{ borderTop: `1px solid ${TOKEN.border}`, my: 0.75 }} />

                      {/* Bottom 4 action icons */}
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 0.5, pt: 0.25 }}>
                        <Tooltip title="View document">
                          <IconButton
                            size="small"
                            onClick={(e) => { e.stopPropagation(); setPreviewDoc(slot); }}
                            sx={{ color: TOKEN.textMuted, p: 0.5, "&:hover": { color: TOKEN.primary } }}
                          >
                            <RemoveRedEyeOutlined sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Download document">
                          <IconButton
                            size="small"
                            onClick={(e) => { e.stopPropagation(); downloadDocumentFile(slot.url, slot.fileName || slot.label); }}
                            sx={{ color: TOKEN.textMuted, p: 0.5, "&:hover": { color: TOKEN.primary } }}
                          >
                            <FileDownloadOutlined sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Re-upload">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (slot.isCustomOther || slot.key === "other" || slot.key.startsWith("other")) {
                                openOtherDocumentModal(slot);
                              } else {
                                openDirectUploadPicker(slot.key);
                              }
                            }}
                            sx={{ color: TOKEN.textMuted, p: 0.5, "&:hover": { color: TOKEN.primary } }}
                          >
                            <CloudUploadOutlined sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Delete document">
                          <IconButton
                            size="small"
                            onClick={(e) => { e.stopPropagation(); handleDelete(slot); }}
                            sx={{ color: "#ef4444", p: 0.5, "&:hover": { color: "#dc2626" } }}
                          >
                            <DeleteOutline sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Box>
                  </Paper>
                );
              })}
            </Box>
          )}

          {/* ── PENDING / ADDITIONAL DOCUMENTS Heading ── */}
          {unuploadedSlots.length > 0 && (
            <Box sx={{ mt: uploadedSlots.length > 0 ? 3.5 : 0.5, mb: 1.5 }}>
              <Typography
                sx={{
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  color: "#818cf8",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                PENDING / ADDITIONAL DOCUMENTS ({unuploadedSlots.length})
              </Typography>
            </Box>
          )}

          {/* ── Unuploaded Documents Grid ── */}
          {unuploadedSlots.length > 0 && (
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2,1fr)", md: "repeat(3,1fr)", lg: "repeat(4,1fr)" }, gap: 1.5 }}>
              {unuploadedSlots.map((slot) => {
                return (
                  <Paper key={slot.key} elevation={0}
                    onClick={() => {
                      if (slot.isCustomOther || slot.key === "other" || slot.key.startsWith("other")) {
                        openOtherDocumentModal(slot);
                      } else {
                        openDirectUploadPicker(slot.key);
                      }
                    }}
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      borderRadius: "10px",
                      border: `1px solid ${TOKEN.border}`,
                      overflow: "hidden", cursor: "pointer",
                      bgcolor: TOKEN.surface,
                      transition: "transform 0.15s, border-color 0.15s, box-shadow 0.15s",
                      "&:hover": {
                        transform: "translateY(-1px)",
                        borderColor: TOKEN.primary,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                      },
                    }}>
                    {/* Top Colored Accent Stripe */}
                    <Box sx={{ height: 3, width: "100%", bgcolor: slot.accent || "#3b82f6" }} />

                    {/* Camera Placeholder Box */}
                    <Box
                      sx={{
                        height: 95,
                        bgcolor: TOKEN.surfaceAlt,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        borderBottom: `1px solid ${TOKEN.border}`,
                      }}
                    >
                      <PhotoCameraOutlined sx={{ fontSize: 24, color: TOKEN.textMuted, mb: 0.5 }} />
                      <Typography sx={{ fontSize: "0.7rem", color: TOKEN.textMuted, fontWeight: 600 }}>
                        No file uploaded
                      </Typography>
                    </Box>

                    {/* Card Body */}
                    <Box sx={{ p: 1.5, flex: 1, display: "flex", flexDirection: "column" }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: TOKEN.text, fontSize: "0.83rem", lineHeight: 1.25, mb: 1.5 }} noWrap title={slot.label}>
                        {slot.label}
                      </Typography>

                      <Box sx={{ mt: "auto" }}>
                        <Button
                          fullWidth
                          disabled={Boolean(uploadingSlotKey)}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (slot.isCustomOther || slot.key === "other" || slot.key.startsWith("other")) {
                              openOtherDocumentModal(slot);
                            } else {
                              openDirectUploadPicker(slot.key);
                            }
                          }}
                          sx={{
                            py: 0.65,
                            borderRadius: "999px",
                            border: `1px dashed ${getIsDark() ? "rgba(59, 130, 246, 0.4)" : "#93c5fd"}`,
                            bgcolor: getIsDark() ? "rgba(15, 23, 42, 0.6)" : TOKEN.surfaceAlt,
                            color: TOKEN.primary,
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            textTransform: "none",
                            gap: 0.75,
                            "&:hover": {
                              bgcolor: TOKEN.primaryMuted,
                              borderColor: TOKEN.primary,
                              borderStyle: "solid",
                            },
                          }}
                        >
                          {uploadingSlotKey === slot.key ? (
                            <CircularProgress size={13} color="inherit" />
                          ) : (
                            <CloudUploadOutlined sx={{ fontSize: 14 }} />
                          )}
                          {uploadingSlotKey === slot.key
                            ? "Uploading..."
                            : slot.key === "other"
                            ? "Upload other file"
                            : "Upload document"}
                        </Button>
                      </Box>
                    </Box>
                  </Paper>
                );
              })}
            </Box>
          )}
        </>
      );
    })()}

    {/* ── Preview Modal ── */}
    <Dialog
      open={Boolean(previewDoc)}
      onClose={() => setPreviewDoc(null)}
      maxWidth={previewDoc?.isImage ? "lg" : "sm"}
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          border: `0.5px solid ${TOKEN.border}`,
          overflow: "hidden",
        },
      }}
    >
      {previewDoc && (
        <>
          <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 1.75, px: 2.5, borderBottom: `0.5px solid ${TOKEN.border}` }}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: TOKEN.text, fontSize: "0.85rem" }} noWrap>
              {previewDoc.label}{previewDoc.fileName ? ` — ${previewDoc.fileName}` : ""}
            </Typography>
            <IconButton size="small" onClick={() => setPreviewDoc(null)}
              sx={{ width: 28, height: 28, borderRadius: 1.5, border: `0.5px solid ${TOKEN.border}`, bgcolor: TOKEN.surfaceAlt }}>
              <Close sx={{ fontSize: 15 }} />
            </IconButton>
          </DialogTitle>
          <Box>
            {previewDoc.isImage && previewDoc.url
              ? (
                <Box
                  sx={{
                    maxHeight: previewImageZoomed ? "78vh" : "68vh",
                    overflow: "auto",
                    bgcolor: "#0b1220",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    p: previewImageZoomed ? 2 : 0,
                  }}
                >
                  <Box
                    component="img"
                    src={previewDoc.url}
                    alt={previewDoc.label}
                    onClick={() => setPreviewImageZoomed((prev) => !prev)}
                    sx={{
                      width: "100%",
                      display: "block",
                      maxHeight: previewImageZoomed ? "none" : "68vh",
                      objectFit: "contain",
                      cursor: previewImageZoomed ? "zoom-out" : "zoom-in",
                      transform: previewImageZoomed ? "scale(1.6)" : "scale(1)",
                      transformOrigin: "center center",
                      transition: "transform 0.18s ease",
                    }}
                  />
                </Box>
              )
              : <Box sx={{ height: 280, bgcolor: TOKEN.surfaceAlt, display: "grid", placeItems: "center" }}>
                  <Stack alignItems="center" spacing={1}>
                    {previewDoc.isPdf
                      ? <PictureAsPdfOutlined sx={{ fontSize: 48, color: TOKEN.textMuted }} />
                      : <InsertDriveFileOutlined sx={{ fontSize: 48, color: TOKEN.textMuted }} />}
                    <Typography variant="caption" sx={{ color: TOKEN.textMuted }}>Preview not available</Typography>
                  </Stack>
                </Box>}
            <Box sx={{ bgcolor: alpha("#0f1b35", 0.88), px: 2, py: 1 }}>
              <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap>
                <Typography variant="caption" sx={{ color: "#fff", fontSize: "0.75rem" }}>
                  {format(new Date(), "dd MMM yyyy  hh:mm a")}
                </Typography>
                {(previewDoc.latitude && previewDoc.longitude) ? (
                  <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)", fontSize: "0.75rem" }}>
                    Lat: {previewDoc.latitude}, Lng: {previewDoc.longitude}
                  </Typography>
                ) : null}
              </Stack>
            </Box>
          </Box>
          <DialogActions sx={{ px: 2.5, py: 1.75, borderTop: `0.5px solid ${TOKEN.border}`, gap: 1 }}>
            {previewDoc.isImage ? (
              <Typography variant="caption" sx={{ color: TOKEN.textMuted, flex: 1 }}>
                Click image to {previewImageZoomed ? "zoom out" : "zoom in"}
              </Typography>
            ) : <Box sx={{ flex: 1 }} />}
            <Button onClick={() => setPreviewDoc(null)} sx={{ borderRadius: 2, border: `0.5px solid ${TOKEN.border}`, color: TOKEN.textSub, fontSize: "0.8rem", fontWeight: 600 }}>Close</Button>
            <Button startIcon={<DownloadRounded sx={{ fontSize: 14 }} />} onClick={() => downloadDocumentFile(previewDoc.url, previewDoc.fileName)}
              sx={{ borderRadius: 2, border: `0.5px solid ${TOKEN.border}`, bgcolor: TOKEN.surfaceAlt, color: TOKEN.text, fontSize: "0.8rem", fontWeight: 600 }}>Download</Button>
            <Button variant="contained" startIcon={<OpenInNew sx={{ fontSize: 14 }} />} onClick={() => openDocumentFile(previewDoc.url)}
              sx={{ borderRadius: 2, bgcolor: "#1e3a8a", color: "#fff", fontSize: "0.8rem", fontWeight: 700, "&:hover": { bgcolor: "#1e40af" } }}>Open in new tab</Button>
          </DialogActions>
        </>
      )}
    </Dialog>

    {/* ── Upload Other Document Modal ── */}
    <Dialog
      open={otherModalOpen}
      onClose={closeOtherDocumentModal}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "18px",
          bgcolor: TOKEN.surface,
          border: `1px solid ${TOKEN.border}`,
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.45)",
          overflow: "hidden",
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 3,
          py: 2.25,
          borderBottom: `1px solid ${TOKEN.border}`,
          bgcolor: TOKEN.surfaceAlt,
        }}
      >
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: "10px",
              bgcolor: alpha(TOKEN.primary, 0.12),
              color: TOKEN.primary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <DescriptionOutlined sx={{ fontSize: 20 }} />
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={700} sx={{ color: TOKEN.text, lineHeight: 1.2 }}>
              Upload Other Document
            </Typography>
            <Typography variant="caption" sx={{ color: TOKEN.textMuted }}>
              Add custom additional documents for this lead
            </Typography>
          </Box>
        </Stack>
        <IconButton
          size="small"
          onClick={closeOtherDocumentModal}
          disabled={otherDocSubmitting}
          sx={{
            width: 32,
            height: 32,
            borderRadius: "8px",
            border: `1px solid ${TOKEN.border}`,
            bgcolor: TOKEN.surface,
            color: TOKEN.textSub,
            "&:hover": { bgcolor: TOKEN.surfaceAlt },
          }}
        >
          <Close sx={{ fontSize: 16 }} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 3, py: 3, bgcolor: TOKEN.surface }}>
        <Stack spacing={2.5}>
          {otherDocError && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              {otherDocError}
            </Alert>
          )}

          {/* Field 1: Document Name */}
          <Box>
            <Typography variant="body2" fontWeight={700} sx={{ color: TOKEN.text, mb: 1 }}>
              Document Name <span style={{ color: "#ef4444" }}>*</span>
            </Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="e.g. Building Plan, Ration Card, Sanction Letter..."
              value={otherDocName}
              onChange={(e) => {
                setOtherDocName(e.target.value);
                if (otherDocError) setOtherDocError("");
              }}
              disabled={otherDocSubmitting}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "10px",
                  bgcolor: TOKEN.surfaceAlt,
                  color: TOKEN.text,
                  "& fieldset": { borderColor: TOKEN.borderMid },
                  "&:hover fieldset": { borderColor: TOKEN.primary },
                  "&.Mui-focused fieldset": { borderColor: TOKEN.primary },
                },
              }}
            />
          </Box>

          {/* Field 2: Upload File */}
          <Box>
            <Typography variant="body2" fontWeight={700} sx={{ color: TOKEN.text, mb: 1 }}>
              Upload File <span style={{ color: "#ef4444" }}>*</span>
            </Typography>

            <input
              id="other-doc-file-input"
              type="file"
              accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setOtherDocFile(file);
                  if (otherDocError) setOtherDocError("");
                  if (!otherDocName.trim()) {
                    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
                    setOtherDocName(nameWithoutExt);
                  }
                }
              }}
              disabled={otherDocSubmitting}
            />

            {!otherDocFile ? (
              <Box
                component="label"
                htmlFor="other-doc-file-input"
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  p: 3.5,
                  borderRadius: "12px",
                  border: `2px dashed ${TOKEN.borderMid}`,
                  bgcolor: TOKEN.surfaceAlt,
                  cursor: otherDocSubmitting ? "not-allowed" : "pointer",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    borderColor: TOKEN.primary,
                    bgcolor: alpha(TOKEN.primary, 0.04),
                  },
                }}
              >
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    bgcolor: alpha(TOKEN.primary, 0.1),
                    color: TOKEN.primary,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mb: 1.5,
                  }}
                >
                  <CloudUploadOutlined sx={{ fontSize: 26 }} />
                </Box>
                <Typography variant="body2" fontWeight={700} sx={{ color: TOKEN.text, mb: 0.5 }}>
                  Click to select a file
                </Typography>
                <Typography variant="caption" sx={{ color: TOKEN.textMuted }}>
                  Supported formats: JPG, PNG, PDF (Max 10MB)
                </Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  p: 2,
                  borderRadius: "12px",
                  border: `1.5px solid ${TOKEN.primary}`,
                  bgcolor: alpha(TOKEN.primary, 0.05),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0, flex: 1 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: "10px",
                      bgcolor: TOKEN.surface,
                      border: `1px solid ${TOKEN.border}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      color: TOKEN.primary,
                    }}
                  >
                    {otherDocFile.type === "application/pdf" ? (
                      <PictureAsPdfOutlined sx={{ fontSize: 22, color: "#ef4444" }} />
                    ) : (
                      <InsertDriveFileOutlined sx={{ fontSize: 22 }} />
                    )}
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={700} sx={{ color: TOKEN.text }} noWrap>
                      {otherDocFile.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: TOKEN.textMuted }}>
                      {(otherDocFile.size / 1024).toFixed(1)} KB
                    </Typography>
                  </Box>
                </Stack>

                <Button
                  size="small"
                  component="label"
                  htmlFor="other-doc-file-input"
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    fontSize: "0.78rem",
                    color: TOKEN.primary,
                    ml: 1,
                  }}
                >
                  Change
                </Button>
              </Box>
            )}
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          py: 2,
          borderTop: `1px solid ${TOKEN.border}`,
          bgcolor: TOKEN.surfaceAlt,
          gap: 1.25,
        }}
      >
        <Button
          onClick={closeOtherDocumentModal}
          disabled={otherDocSubmitting}
          variant="outlined"
          sx={{
            borderRadius: "10px",
            px: 2.5,
            py: 0.9,
            textTransform: "none",
            fontWeight: 600,
            color: TOKEN.textSub,
            borderColor: TOKEN.borderMid,
            "&:hover": { borderColor: TOKEN.text, bgcolor: TOKEN.surface },
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleOtherDocumentSubmit}
          disabled={otherDocSubmitting || !otherDocName.trim() || !otherDocFile}
          startIcon={otherDocSubmitting ? <CircularProgress size={16} color="inherit" /> : <CloudUploadOutlined />}
          sx={{
            borderRadius: "10px",
            px: 3,
            py: 0.9,
            textTransform: "none",
            fontWeight: 700,
            bgcolor: TOKEN.primary,
            color: "#fff",
            "&:hover": { bgcolor: TOKEN.accent },
          }}
        >
          {otherDocSubmitting ? "Uploading..." : "Upload Document"}
        </Button>
      </DialogActions>
    </Dialog>
  </Box>
);
    if (tab === "siteVisits") {
      const scheduledCount = siteVisitEntries.filter((entry) => String(entry.visitStatusInfo?.status || entry.status || "").toLowerCase() === "scheduled").length;

      return (
        <Stack spacing={2.5}>
          <Paper {...card({ p: 0 })}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.5}
              alignItems={{ xs: "flex-start", sm: "center" }}
              justifyContent="space-between"
              sx={{ px: 3, py: 3 }}
            >
              <Box>
                <Typography variant="h6" sx={{ color: TOKEN.text, fontWeight: 800, lineHeight: 1.15 }}>
                  Site visits
                </Typography>
                <Typography variant="body2" sx={{ color: TOKEN.textMuted, mt: 0.4 }}>
                  {scheduledCount} scheduled · inspector visits and on-site assessments
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <Button
                  variant="outlined"
                  startIcon={<OpenInNew sx={{ fontSize: 15 }} />}
                  onClick={() => navigate("/total-visits", { state: { highlightLeadId: leadDetails?._id } })}
                  sx={{
                    borderRadius: 2.5,
                    px: 2,
                    py: 1.1,
                    borderColor: TOKEN.borderMid,
                    color: TOKEN.text,
                    fontWeight: 700,
                    textTransform: "none",
                    "&:hover": { borderColor: TOKEN.primary, color: TOKEN.primary },
                  }}
                >
                  Visit Pipeline
                </Button>
                <Button
                  variant="contained"
                  disableElevation
                  startIcon={<AccessTime sx={{ fontSize: 16 }} />}
                  onClick={openSiteVisitDialog}
                  sx={{
                    borderRadius: 2.5,
                    px: 2.5,
                    py: 1.1,
                    bgcolor: "#d97706",
                    color: "#fff",
                    fontWeight: 800,
                    textTransform: "none",
                    boxShadow: "0 10px 24px rgba(217, 119, 6, 0.22)",
                    "&:hover": { bgcolor: "#b45309" },
                  }}
                >
                  Schedule
                </Button>
              </Stack>
            </Stack>

            <Box sx={{ px: 3, pb: 3 }}>
              {siteVisitEntries.length > 0 ? (
                <Stack spacing={1.5}>
                  {siteVisitEntries.map((entry) => {
                    const statusInfo = entry.visitStatusInfo || buildVisitStatusInfo({
                      visitStatus: entry.status,
                      visitDate: entry.scheduledAt,
                      siteSurvey: entry.siteSurvey,
                    });
                    const inspectorNotAssigned = isNotAssignedLabel(entry.assigneeName);

                    const chipStyles = statusInfo.isOverdue
                      ? {
                          bgcolor: alpha("#ef4444", 0.08),
                          color: "#dc2626",
                          border: `1px solid ${alpha("#ef4444", 0.22)}`,
                        }
                      : statusInfo.status === "Completed"
                        ? {
                            bgcolor: alpha("#10b981", 0.10),
                            color: "#047857",
                            border: `1px solid ${alpha("#10b981", 0.22)}`,
                          }
                        : statusInfo.status === "Pending"
                          ? {
                              bgcolor: alpha("#f59e0b", 0.10),
                              color: "#b45309",
                              border: `1px solid ${alpha("#f59e0b", 0.22)}`,
                            }
                          : {
                              bgcolor: alpha("#2563eb", 0.08),
                              color: "#2563eb",
                              border: `1px solid ${alpha("#2563eb", 0.18)}`,
                            };

                    return (
                      <Paper
                        key={entry.id}
                        elevation={0}
                        sx={{
                          p: 2.5,
                          borderRadius: 3,
                          border: `1px solid ${TOKEN.border}`,
                          bgcolor: TOKEN.surface,
                        }}
                      >
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }}>
                          <Stack spacing={1} sx={{ minWidth: 0 }}>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <AccessTime sx={{ fontSize: 17, color: TOKEN.textSub }} />
                              <Typography variant="h6" sx={{ color: TOKEN.text, fontWeight: 800, fontSize: "1.05rem" }}>
                                {entry.scheduledAt ? formatDate(entry.scheduledAt, "dd MMM yyyy") : "Date not set"}
                              </Typography>
                            </Stack>
                            <Typography variant="body1" sx={{ color: TOKEN.textSub, lineHeight: 1.6 }}>
                              On-Site Estimate · Inspector:{" "}
                              {inspectorNotAssigned ? (
                                <Box
                                  component="span"
                                  sx={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    px: 0.9,
                                    py: 0.25,
                                    borderRadius: 1,
                                    bgcolor: alpha("#ef4444", 0.1),
                                    color: "#b91c1c",
                                    border: `1px solid ${alpha("#ef4444", 0.35)}`,
                                    fontWeight: 800,
                                    lineHeight: 1.4,
                                  }}
                                >
                                  Assign the lead
                                </Box>
                              ) : (
                                <Box component="span" sx={{ color: TOKEN.text, fontWeight: 700 }}>
                                  {entry.assigneeName}
                                </Box>
                              )}
                              {entry.location ? ` · ${entry.location}` : ""}
                            </Typography>
                            {entry.notes ? (
                              <Typography variant="body2" sx={{ color: TOKEN.textMuted }}>
                                {entry.notes}
                              </Typography>
                            ) : null}
                          </Stack>
                          <Stack spacing={0.6} alignItems={{ xs: "flex-start", sm: "flex-end" }}>
                            <Chip
                              label={statusInfo.status || "Scheduled"}
                              size="small"
                              sx={{
                                height: 28,
                                borderRadius: 999,
                                fontWeight: 700,
                                fontSize: "0.82rem",
                                ...chipStyles,
                                "& .MuiChip-label": { px: 1.25 },
                              }}
                            />
                            {statusInfo.helperText ? (
                              <Typography
                                sx={{
                                  fontSize: "0.72rem",
                                  color: statusInfo.isOverdue ? "#dc2626" : TOKEN.textMuted,
                                  fontWeight: statusInfo.isOverdue ? 700 : 600,
                                  textDecoration: statusInfo.isOverdue ? "underline" : "none",
                                  textUnderlineOffset: "0.18em",
                                }}
                              >
                                {statusInfo.helperText}
                              </Typography>
                            ) : null}
                          </Stack>
                        </Stack>
                      </Paper>
                    );
                  })}
                </Stack>
              ) : (
                <Paper {...card({ p: 3.5, textAlign: "center" })}>
                  <Typography variant="body2" sx={{ color: TOKEN.textMuted }}>
                    No site visits scheduled.
                  </Typography>
                </Paper>
              )}
            </Box>
          </Paper>
        </Stack>
      );
    }
    if (tab === "siteSurvey") {
      const surveyPhotos = siteSurveyRecord?.photos || [];
      const surveyGeneral = siteSurveyRecord?.general || {};

      if (!hasSiteSurvey) {
        return (
          <Paper
            {...card({
              p: 0,
              minHeight: 355,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            })}
          >
            <Stack spacing={2.25} alignItems="center" textAlign="center" sx={{ px: 3, py: 5, maxWidth: 560 }}>
              <Box
                sx={{
                  width: 70,
                  height: 70,
                  borderRadius: 3,
                  bgcolor: "#eef2f7",
                  color: "#8fa1bf",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <DescriptionOutlined sx={{ fontSize: 30 }} />
              </Box>
              <Box>
                <Typography variant="h5" sx={{ color: TOKEN.text, fontWeight: 800, mb: 0.75 }}>
                  Site Survey
                </Typography>
                <Typography variant="body1" sx={{ color: TOKEN.textSub, lineHeight: 1.7 }}>
                  Capture detailed roof, electrical, and structural info on a dedicated form.
                </Typography>
              </Box>
              <Button
                variant="contained"
                disableElevation
                endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
                onClick={openSiteSurveyForm}
                sx={{
                  borderRadius: 2.5,
                  px: 2.75,
                  py: 1.15,
                  bgcolor: "#ca9f6f",
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: "1rem",
                  textTransform: "none",
                  boxShadow: "0 10px 24px rgba(217, 119, 6, 0.22)",
                  "&:hover": { bgcolor: "#b45309" },
                }}
              >
                Open site survey form
              </Button>
            </Stack>
          </Paper>
        );
      }

      return (
        <Paper {...card({ p: 0, overflow: "hidden" })}>
          <Stack spacing={1.2}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.5}
              alignItems={{ xs: "flex-start", sm: "center" }}
              justifyContent="space-between"
              sx={{ px: 2.5, pt: 2.25 }}
            >
              <Box>
                <Typography sx={{ fontSize: "0.95rem", fontWeight: 800, color: TOKEN.text }}>
                  {leadDetails?.companyName || `${leadDetails?.firstName || ""} ${leadDetails?.lastName || ""}`.trim() || "Site Survey"}
                </Typography>
                <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mt: 0.45 }}>
                  <Typography sx={{ fontSize: "0.72rem", color: TOKEN.textMuted }}>
                    {formatDate(siteSurveyRecord?.savedAt)}
                  </Typography>
                  <Chip
                    label={siteSurveyRecord?.status || "Completed"}
                    size="small"
                    sx={{
                      height: 20,
                      borderRadius: 999,
                      bgcolor: alpha("#2563eb", 0.08),
                      color: "#2563eb",
                      fontWeight: 700,
                      fontSize: "0.7rem",
                    }}
                  />
                </Stack>
              </Box>

              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  startIcon={<Edit sx={{ fontSize: 14 }} />}
                  onClick={openSiteSurveyForm}
                  sx={{
                    borderRadius: 2,
                    borderColor: TOKEN.borderMid,
                    color: TOKEN.text,
                    textTransform: "none",
                    fontWeight: 700,
                    fontSize: "0.78rem",
                  }}
                >
                  Edit form
                </Button>
              </Stack>
            </Stack>

            <Box sx={{ px: 1.5, pb: 1.5 }}>
              <SiteSurveyAddressCard
                siteSurveyRecord={siteSurveyRecord}
                leadDetails={leadDetails}
                onOpenMap={openSiteSurveyMap}
              />

              <Paper {...card({ p: 0, mb: 1.2 })}>
                <Box sx={{ px: 1.2, py: 0.9, borderBottom: `0.5px solid ${TOKEN.border}` }}>
                  <Typography sx={{ fontSize: "0.64rem", fontWeight: 800, color: TOKEN.textMuted, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    General
                  </Typography>
                </Box>
                <Stack divider={<Divider flexItem sx={{ borderColor: TOKEN.border }} />}>
                  {SITE_SURVEY_GENERAL_ROWS.map((row) => (
                    <Stack key={row.map((item) => item.key).join("-")} direction={{ xs: "column", md: "row" }} spacing={0} sx={{ px: 1.2, py: 1.05 }}>
                      {row.map((item) => (
                        <Box key={item.key} sx={{ flex: 1, minWidth: 0 }}>
                          <Typography sx={{ fontSize: "0.72rem", color: TOKEN.textMuted }}>
                            {item.label}
                          </Typography>
                          <Typography sx={{ fontSize: "0.84rem", fontWeight: 700, color: TOKEN.text, mt: 0.35 }}>
                            {formatSurveyValue(surveyGeneral?.[item.key])}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  ))}

                  {siteSurveyRecord?.remarks ? (
                    <Box sx={{ px: 1.2, py: 1.05 }}>
                      <Typography sx={{ fontSize: "0.72rem", color: TOKEN.textMuted }}>
                        Additional Notes
                      </Typography>
                      <Typography sx={{ fontSize: "0.84rem", color: TOKEN.text, mt: 0.35, lineHeight: 1.7 }}>
                        {siteSurveyRecord.remarks}
                      </Typography>
                    </Box>
                  ) : null}
                </Stack>
              </Paper>

              <Paper {...card({ p: 0 })}>
                <Box sx={{ px: 1.2, py: 0.9, borderBottom: `0.5px solid ${TOKEN.border}` }}>
                  <Typography sx={{ fontSize: "0.64rem", fontWeight: 800, color: TOKEN.textMuted, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    Site Photos {surveyPhotos.length ? surveyPhotos.length : ""}
                  </Typography>
                </Box>
                <Box sx={{ p: 1.2 }}>
                  {surveyPhotos.length ? (
                    <Stack direction="row" spacing={1.2} flexWrap="wrap" useFlexGap>
                      {surveyPhotos.map((photo, index) => {
                        const photoUrl = getSurveyPhotoUrl(photo);
                        if (!photoUrl) return null;
                        return (
                          <Box
                            key={photoUrl || index}
                            onClick={() =>
                              setPreviewDoc({
                                label: `Site Photo ${index + 1}`,
                                fileName: getFileNameFromUrl(photoUrl) || `site-photo-${index + 1}.jpg`,
                                url: photoUrl,
                                isImage: true,
                                isPdf: false,
                                latitude: siteSurveyRecord?.latitude,
                                longitude: siteSurveyRecord?.longitude,
                              })
                            }
                            sx={{
                              width: 74,
                              height: 74,
                              borderRadius: 2,
                              overflow: "hidden",
                              border: `0.5px solid ${TOKEN.border}`,
                              bgcolor: TOKEN.surfaceAlt,
                              cursor: "pointer",
                            }}
                          >
                            <Box
                              component="img"
                              src={photoUrl}
                              alt={`Site photo ${index + 1}`}
                              sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                            />
                          </Box>
                        );
                      })}
                    </Stack>
                  ) : (
                    <Typography sx={{ fontSize: "0.82rem", color: TOKEN.textMuted }}>
                      No site photos uploaded.
                    </Typography>
                  )}
                </Box>
              </Paper>
            </Box>
          </Stack>
        </Paper>
      );
    }
    if (tab === "quotations") {
      return (
        <Paper
          {...card({
            p: 0,
            minHeight: 355,
            overflow: "hidden",
          })}
        >
          <Stack sx={{ minHeight: 355 }}>
            <Box sx={{ display: "flex", justifyContent: "flex-end", px: 2.5, pt: 2.25 }}>
              <Button
                variant="contained"
                disableElevation
                startIcon={<Add sx={{ fontSize: 17 }} />}
                onClick={openQuotationBuilder}
                sx={{
                  borderRadius: 2.5,
                  px: 2.1,
                  py: 1.1,
                  bgcolor: "#d97706",
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: "0.96rem",
                  textTransform: "none",
                  boxShadow: "0 12px 28px rgba(217, 119, 6, 0.22)",
                  "&:hover": { bgcolor: "#b45309" },
                }}
              >
                Create Quotation
              </Button>
            </Box>
            <Box sx={{ flex: 1, px: 3, pb: 3, pt: 2 }}>
              {quotationEntries.length ? (
                <Stack spacing={1.6}>
                  {quotationEntries.map((quotation) => {
                    const isSent = quotation.status === "sent" || quotation.status === "accepted";
                    const isAccepted = quotation.status === "accepted";

                    return (
                      <Paper
                        key={quotation.id}
                        elevation={0}
                        sx={{
                          borderRadius: 2.75,
                          border: `0.5px solid ${TOKEN.border}`,
                          px: 1.7,
                          py: 1.35,
                          display: "flex",
                          alignItems: { xs: "flex-start", md: "center" },
                          justifyContent: "space-between",
                          gap: 1.6,
                          flexWrap: "wrap",
                        }}
                      >
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ fontSize: "1.02rem", fontWeight: 800, color: TOKEN.text }}>
                            {quotation.quotationNumber || "Quotation"}
                          </Typography>
                          <Typography sx={{ mt: 0.35, fontSize: "0.84rem", color: TOKEN.textSub }}>
                            {`${Number(quotation.systemSize || 0).toFixed(2)} kW - ${formatCurrency(quotation.totalCost)}`}
                          </Typography>
                        </Box>

                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap justifyContent="flex-end">
                          <Button
                            size="small"
                            onClick={() => handleQuotationStatusChange(quotation.id, "sent")}
                            sx={{
                              minWidth: 0,
                              borderRadius: 999,
                              px: 1.4,
                              py: 0.45,
                              textTransform: "none",
                              fontSize: "0.78rem",
                              fontWeight: 700,
                              color: isSent ? (getIsDark() ? "#60a5fa" : "#2563eb") : TOKEN.textSub,
                              bgcolor: isSent
                                ? alpha("#2563eb", getIsDark() ? 0.22 : 0.10)
                                : (getIsDark() ? "rgba(255, 255, 255, 0.04)" : "#fff"),
                              border: `1px solid ${isSent ? alpha("#2563eb", 0.45) : TOKEN.border}`,
                              boxShadow: "none",
                              "&:hover": {
                                borderColor: isSent ? alpha("#2563eb", 0.65) : TOKEN.borderMid,
                                bgcolor: isSent
                                  ? alpha("#2563eb", getIsDark() ? 0.32 : 0.16)
                                  : (getIsDark() ? "rgba(255, 255, 255, 0.08)" : TOKEN.surfaceAlt),
                                boxShadow: "none",
                              },
                            }}
                          >
                            Sent
                          </Button>
                          <Button
                            size="small"
                            onClick={() => handleQuotationStatusChange(quotation.id, "accepted")}
                            sx={{
                              minWidth: 0,
                              borderRadius: 999,
                              px: 1.4,
                              py: 0.45,
                              textTransform: "none",
                              fontSize: "0.78rem",
                              fontWeight: 700,
                              color: isAccepted ? (getIsDark() ? "#4ade80" : "#16a34a") : TOKEN.textSub,
                              bgcolor: isAccepted
                                ? alpha("#16a34a", getIsDark() ? 0.22 : 0.10)
                                : (getIsDark() ? "rgba(255, 255, 255, 0.04)" : "#fff"),
                              border: `1px solid ${isAccepted ? alpha("#16a34a", 0.45) : TOKEN.border}`,
                              boxShadow: "none",
                              "&:hover": {
                                borderColor: isAccepted ? alpha("#16a34a", 0.65) : TOKEN.borderMid,
                                bgcolor: isAccepted
                                  ? alpha("#16a34a", getIsDark() ? 0.32 : 0.16)
                                  : (getIsDark() ? "rgba(255, 255, 255, 0.08)" : TOKEN.surfaceAlt),
                                boxShadow: "none",
                              },
                            }}
                          >
                            Accept
                          </Button>
                          <Button
                            size="small"
                            startIcon={<Edit sx={{ fontSize: 15 }} />}
                            onClick={() => openQuotationEditor(quotation)}
                            sx={{
                              borderRadius: 999,
                              px: 1.4,
                              textTransform: "none",
                              color: TOKEN.text,
                              border: `0.5px solid ${TOKEN.border}`,
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            size="small"
                            startIcon={<OpenInNew sx={{ fontSize: 15 }} />}
                            onClick={() => openQuotationPreview(quotation, { autoPrint: true })}
                            sx={{
                              borderRadius: 999,
                              px: 1.4,
                              textTransform: "none",
                              color: TOKEN.text,
                              border: `0.5px solid ${TOKEN.border}`,
                            }}
                          >
                            Print
                          </Button>
                          <Button
                            size="small"
                            startIcon={<PictureAsPdfOutlined sx={{ fontSize: 15 }} />}
                            onClick={() => openQuotationPreview(quotation, { autoDownload: true })}
                            sx={{
                              borderRadius: 999,
                              px: 1.4,
                              textTransform: "none",
                              color: TOKEN.text,
                              border: `0.5px solid ${TOKEN.border}`,
                            }}
                          >
                            PDF
                          </Button>
                          <Button
                            size="small"
                            startIcon={<Delete sx={{ fontSize: 15 }} />}
                            onClick={() => handleQuotationDelete(quotation.id)}
                            sx={{
                              borderRadius: 999,
                              px: 1.2,
                              textTransform: "none",
                              color: "#dc2626",
                              border: `0.5px solid ${TOKEN.border}`,
                            }}
                          >
                            Delete
                          </Button>
                        </Stack>
                      </Paper>
                    );
                  })}
                </Stack>
              ) : (
                <Box sx={{ flex: 1, display: "grid", placeItems: "center", px: 3, py: 5 }}>
                  <Stack spacing={2.25} alignItems="center" textAlign="center" sx={{ maxWidth: 420 }}>
                    <Box
                      sx={{
                        width: 72,
                        height: 72,
                        borderRadius: 3,
                        bgcolor: "#eef2f7",
                        color: "#8fa1bf",
                        display: "grid",
                        placeItems: "center",
                      }}
                    >
                      <DescriptionOutlined sx={{ fontSize: 31 }} />
                    </Box>
                    <Box>
                      <Typography variant="h5" sx={{ color: TOKEN.text, fontWeight: 800, mb: 0.75 }}>
                        No quotations yet
                      </Typography>
                      <Typography variant="body1" sx={{ color: TOKEN.textSub, lineHeight: 1.7 }}>
                        Create a quotation and it will appear here for this lead.
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              )}
            </Box>
          </Stack>
        </Paper>
      );
    }
    if (tab === "threeDDesign") {
      const design = leadDetails?.threeDDesign || null;
      const pointCount = Array.isArray(design?.points) ? design.points.length : 0;
      const panelCount = Number(design?.solarLayout?.count || 0);
      const updatedAt = design?.updatedAt ? new Date(design.updatedAt) : null;
      const updatedLabel = updatedAt && !Number.isNaN(updatedAt.getTime()) ? format(updatedAt, "dd MMM yyyy, hh:mm a") : "Not saved yet";

      return (
        <Paper {...card({ p: 0, minHeight: 355, overflow: "hidden" })}>
          <Stack sx={{ minHeight: 355 }}>
            <Box sx={{ display: "flex", justifyContent: "flex-end", px: 2.5, pt: 2.25 }}>
              <Button
                variant="contained"
                disableElevation
                startIcon={<GridViewOutlined sx={{ fontSize: 17 }} />}
                onClick={openThreeDDesign}
                sx={{
                  borderRadius: 2.5,
                  px: 2.1,
                  py: 1.1,
                  bgcolor: TOKEN.primary,
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: "0.96rem",
                  textTransform: "none",
                  boxShadow: "0 12px 28px rgba(59, 91, 219, 0.22)",
                  "&:hover": { bgcolor: TOKEN.primaryLight },
                }}
              >
                {hasThreeDDesign ? "Open 3D Design" : "Create 3D Design"}
              </Button>
            </Box>

            <Box sx={{ flex: 1, px: 3.5, pb: 3.5, pt: 1.5 }}>
              {hasThreeDDesign ? (
                <Stack direction={{ xs: "column", md: "row" }} spacing={2.5} alignItems="stretch">
                  <Box
                    sx={{
                      width: { xs: "100%", md: 320 },
                      minHeight: 190,
                      borderRadius: 3,
                      border: `1px solid ${TOKEN.border}`,
                      bgcolor: TOKEN.surfaceAlt,
                      overflow: "hidden",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    {design?.captureImage ? (
                      <Box component="img" src={design.captureImage} alt="Saved 3D design" sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <Stack spacing={1} alignItems="center" sx={{ color: TOKEN.textMuted }}>
                        <GridViewOutlined sx={{ fontSize: 42 }} />
                        <Typography variant="body2" fontWeight={700}>3D design saved</Typography>
                      </Stack>
                    )}
                  </Box>

                  <Stack spacing={1.5} sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="h6" sx={{ color: TOKEN.text, fontWeight: 900 }}>
                      Saved 3D Solar Design
                    </Typography>
                    <Typography variant="body2" sx={{ color: TOKEN.textSub }}>
                      This design is stored with this lead and can be opened again from here.
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      <Chip size="small" label={`${pointCount} roof points`} />
                      <Chip size="small" label={`${panelCount} solar panels`} />
                      <Chip size="small" label={design?.status || "saved"} />
                    </Stack>
                    <Typography variant="caption" sx={{ color: TOKEN.textMuted }}>
                      Last saved: {updatedLabel}
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      <Button
                        size="small"
                        variant="contained"
                        disableElevation
                        startIcon={<RemoveRedEye sx={{ fontSize: 16 }} />}
                        onClick={viewThreeDDesignPreview}
                        sx={{ borderRadius: 2, bgcolor: TOKEN.primary, textTransform: "none", fontWeight: 800, "&:hover": { bgcolor: TOKEN.primaryLight } }}
                      >
                        View 3D Preview
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Edit sx={{ fontSize: 16 }} />}
                        onClick={openThreeDDesign}
                        sx={{ borderRadius: 2, borderColor: TOKEN.border, color: TOKEN.text, textTransform: "none", fontWeight: 800 }}
                      >
                        Edit Design
                      </Button>
                    </Stack>
                  </Stack>
                </Stack>
              ) : (
                <Box sx={{ minHeight: 250, display: "grid", placeItems: "center", textAlign: "center" }}>
                  <Stack spacing={1.4} alignItems="center">
                    <Box sx={{ width: 54, height: 54, borderRadius: "50%", bgcolor: TOKEN.primaryMuted, color: TOKEN.primary, display: "grid", placeItems: "center" }}>
                      <GridViewOutlined sx={{ fontSize: 28 }} />
                    </Box>
                    <Typography variant="h6" sx={{ color: TOKEN.text, fontWeight: 900 }}>No 3D design saved yet</Typography>
                    <Typography variant="body2" sx={{ color: TOKEN.textSub, maxWidth: 420 }}>
                      Create a 3D solar design for this lead. After you click Save in the 3D designer, it will be stored here.
                    </Typography>
                  </Stack>
                </Box>
              )}
            </Box>
          </Stack>
        </Paper>
      );
    }
    if (tab === "reminders") {
      const getReminderStatus = (scheduledAt) => {
        const scheduledDate = scheduledAt ? new Date(scheduledAt) : null;
        if (!scheduledDate || Number.isNaN(scheduledDate.getTime())) {
          return {
            label: "UPCOMING",
            color: "#f59e0b",
            soft: alpha("#f59e0b", 0.12),
          };
        }
        return scheduledDate.getTime() < Date.now()
          ? { label: "OVERDUE", color: "#ef4444", soft: alpha("#ef4444", 0.10) }
          : { label: "UPCOMING", color: "#f59e0b", soft: alpha("#f59e0b", 0.12) };
      };

      return (
        <Paper
          {...card({
            p: 0,
            minHeight: 355,
            overflow: "hidden",
          })}
        >
          <Stack sx={{ minHeight: 355 }}>
            <Box sx={{ display: "flex", justifyContent: "flex-end", px: 2.5, pt: 2.25 }}>
              <Button
                variant="contained"
                disableElevation
                startIcon={<Add sx={{ fontSize: 17 }} />}
                onClick={openReminderDialog}
                sx={{
                  borderRadius: 2.5,
                  px: 2.1,
                  py: 1.1,
                  bgcolor: "#d97706",
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: "0.96rem",
                  textTransform: "none",
                  boxShadow: "0 12px 28px rgba(217, 119, 6, 0.22)",
                  "&:hover": { bgcolor: "#b45309" },
                }}
              >
                Add reminder
              </Button>
            </Box>

            <Box sx={{ flex: 1, px: 3.5, pb: 3.5, pt: 1.5 }}>
              {reminderEntries.length ? (
                <Stack spacing={2.3}>
                  {reminderEntries.map((entry, index) => {
                    const status = getReminderStatus(entry.scheduledAt);
                    const reminderKey = entry.id || `${entry.source}-${entry.scheduledAt}`;
                    const isProcessing = processingReminderId === reminderKey || processingReminderId === entry.id;

                    return (
                      <Stack key={reminderKey} direction="row" spacing={2.2} alignItems="flex-start" justifyContent="space-between">
                        <Stack direction="row" spacing={2.1} sx={{ flex: 1, minWidth: 0 }}>
                          <Box sx={{ position: "relative", width: 28, minWidth: 28, display: "flex", justifyContent: "center", pt: 0.55 }}>
                            <Box
                              sx={{
                                width: 24,
                                height: 24,
                                borderRadius: "50%",
                                border: `2px solid ${status.color}`,
                                bgcolor: TOKEN.surface,
                                position: "relative",
                                zIndex: 1,
                              }}
                            />
                            {index < reminderEntries.length - 1 && (
                              <Box
                                sx={{
                                  position: "absolute",
                                  top: 28,
                                  bottom: -30,
                                  left: "50%",
                                  transform: "translateX(-50%)",
                                  width: 1,
                                  bgcolor: TOKEN.border,
                                }}
                              />
                            )}
                          </Box>

                          <Stack spacing={0.55} sx={{ minWidth: 0, pt: 0.1 }}>
                            <Stack direction="row" spacing={1.1} alignItems="center" flexWrap="wrap" useFlexGap>
                              <Typography sx={{ fontWeight: 800, color: TOKEN.text, fontSize: "1rem" }}>
                                {formatDate(entry.scheduledAt, "dd MMM yyyy")}
                              </Typography>
                              <Typography sx={{ color: "#8aa0bf", fontSize: "0.98rem" }}>
                                {formatDate(entry.scheduledAt, "hh:mm a").toLowerCase()}
                              </Typography>
                              <Chip
                                label={status.label}
                                size="small"
                                sx={{
                                  height: 22,
                                  borderRadius: 999,
                                  bgcolor: status.soft,
                                  color: status.color,
                                  fontWeight: 800,
                                  fontSize: "0.76rem",
                                  "& .MuiChip-label": { px: 0.9 },
                                }}
                              />
                            </Stack>
                            <Typography sx={{ color: TOKEN.text, fontSize: "1rem", fontWeight: 500 }}>
                              {entry.reminderText || "Reminder"}
                            </Typography>
                          </Stack>
                        </Stack>

                        <Button
                          variant="outlined"
                          onClick={() => handleCompleteReminder(entry)}
                          disabled={isProcessing}
                          startIcon={<CheckCircle sx={{ fontSize: 18 }} />}
                          sx={{
                            mt: 0.15,
                            minWidth: 154,
                            borderRadius: 2,
                            px: 2,
                            py: 0.9,
                            borderColor: TOKEN.borderMid,
                            color: TOKEN.text,
                            fontWeight: 700,
                            fontSize: "0.98rem",
                            textTransform: "none",
                            bgcolor: getIsDark() ? "#172338" : "#fff",
                            "&:hover": {
                              borderColor: TOKEN.borderMid,
                              bgcolor: getIsDark() ? "#1e2d48" : alpha(TOKEN.primary, 0.03),
                            },
                          }}
                        >
                          {isProcessing ? "Updating..." : "Mark complete"}
                        </Button>
                      </Stack>
                    );
                  })}
                </Stack>
              ) : (
                <Stack spacing={2.25} alignItems="center" textAlign="center" sx={{ py: 8 }}>
                  <Box
                    sx={{
                      width: 72,
                      height: 72,
                      borderRadius: 3,
                      bgcolor: "#eef2f7",
                      color: "#8fa1bf",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <AccessTime sx={{ fontSize: 31 }} />
                  </Box>
                  <Box>
                    <Typography variant="h5" sx={{ color: TOKEN.text, fontWeight: 800, mb: 0.75 }}>
                      No reminders yet
                    </Typography>
                    <Typography variant="body1" sx={{ color: TOKEN.textSub, lineHeight: 1.7 }}>
                      Add a reminder to track the next follow-up for this lead.
                    </Typography>
                  </Box>
                </Stack>
              )}
            </Box>
          </Stack>
        </Paper>
      );
    }
    const placeholderByTab = {
      comments:   leadDetails.notes || "No comments available.",
      siteVisits: leadDetails.visitDate  ? `Visit scheduled on ${formatDateTime(leadDetails.visitDate)}.`     : "No site visits scheduled.",
      siteSurvey: "No site survey data available.",
      quotations: "No quotations linked yet.",
    };
    return (
      <Paper {...card({ p: 3.5 })}>
        <Typography variant="body2" sx={{ color: TOKEN.textMuted }}>{placeholderByTab[tab]}</Typography>
      </Paper>
    );
  };

  // ── Loading / Error states ──────────────────────────────────────────────────
  if (loading) return (
    <Box sx={{ minHeight: "70vh", display: "grid", placeItems: "center", bgcolor: TOKEN.surfaceAlt }}>
      <Stack spacing={2} alignItems="center">
        <CircularProgress sx={{ color: TOKEN.primary }} thickness={3} size={38} />
        <Typography variant="body2" sx={{ color: TOKEN.textMuted, fontWeight: 500 }}>Loading lead details…</Typography>
      </Stack>
    </Box>
  );

  if (error) return (
    <Box sx={{ p: 3 }}>
      <Alert
        severity="error"
        action={<Button color="inherit" size="small" onClick={fetchLeadDetails} sx={{ fontWeight: 700 }}>Retry</Button>}
        sx={{ borderRadius: TOKEN.radiusSm }}
      >
        {error}
      </Alert>
    </Box>
  );

  if (!leadDetails) return null;

  // ── Main render ─────────────────────────────────────────────────────────────
  return (
    <Box sx={{ p: { xs: 2, md: 2.5 }, bgcolor: TOKEN.surfaceAlt, minHeight: "100vh" }}>

      <Breadcrumbs separator={<ChevronRight sx={{ fontSize: 13, color: TOKEN.textMuted }} />} sx={{ mb: 2 }}>
        <Typography sx={{ fontSize: "0.75rem", color: TOKEN.textMuted, cursor: "pointer", "&:hover": { color: TOKEN.primary } }} onClick={() => navigate("/all-leads")}>
          Leads
        </Typography>
        <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, color: TOKEN.text }}>
          {leadDetails.firstName} {leadDetails.lastName}
        </Typography>
      </Breadcrumbs>

      <Paper {...card({ mb: 2 })}>
        <Box sx={{ background: GRADIENT_HEADER, px: { xs: 2, md: 2.5 }, pt: 2, pb: 2.5 }}>
          <Stack direction={{ xs: "column", lg: "row" }} spacing={2} justifyContent="space-between" alignItems={{ xs: "flex-start", lg: "center" }}>
            <Stack direction="row" spacing={1.75} alignItems="flex-start">
              <IconButton
                onClick={() => navigate("/all-leads")}
                sx={{ border: "0.5px solid rgba(255,255,255,0.15)", width: 32, height: 32, borderRadius: TOKEN.radiusSm, color: "#fff", bgcolor: "rgba(255,255,255,0.08)", "&:hover": { bgcolor: "rgba(255,255,255,0.14)" }, flexShrink: 0 }}
              >
                <ArrowBack sx={{ fontSize: 14 }} />
              </IconButton>
              <Avatar sx={{ width: 44, height: 44, fontWeight: 600, fontSize: "1rem", bgcolor: TOKEN.teal, color: "#fff", border: "1.5px solid rgba(255,255,255,0.2)" }}>
                {`${leadDetails.firstName?.[0] || ""}${leadDetails.lastName?.[0] || ""}` || "L"}
              </Avatar>
              <Box>
                <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.5 }}>
                  <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.65rem", fontWeight: 500, letterSpacing: "0.08em" }}>
                    LD-{leadDetails._id?.slice(-5) || "00000"}
                  </Typography>
                  <Chip
                    label={leadDetails.isProject ? "Project Converted" : (leadDetails.status || "Lead")}
                    size="small"
                    sx={{
                      bgcolor: leadDetails.isProject ? "rgba(16, 185, 129, 0.25)" : "rgba(255,255,255,0.12)",
                      color: leadDetails.isProject ? "#34d399" : "#fff",
                      fontWeight: 600,
                      height: 20,
                      fontSize: "0.65rem",
                      border: leadDetails.isProject ? "1px solid rgba(52, 211, 153, 0.4)" : "none",
                    }}
                  />
                </Stack>
                <Typography sx={{ fontWeight: 600, color: "#fff", fontSize: "1.15rem", letterSpacing: "-0.01em", lineHeight: 1.15 }}>
                  {leadDetails.firstName} {leadDetails.lastName}
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 0.5 }}>
                  {[`Score ${leadScore}/100`, leadDetails.city || "No city", `Created ${formatDate(leadDetails.createdAt)}`].map((text, i, arr) => (
                    <React.Fragment key={text}>
                      <Typography sx={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.5)" }}>{text}</Typography>
                      {i < arr.length - 1 && <Typography sx={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.2)" }}>·</Typography>}
                    </React.Fragment>
                  ))}
                </Stack>
              </Box>
            </Stack>

            <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap sx={{ justifyContent: { xs: "flex-start", lg: "flex-end" } }}>
              <Button
                variant="outlined"
                startIcon={<Edit sx={{ fontSize: 13 }} />}
                onClick={openEditDialog}
                sx={{
                  height: 36,
                  borderRadius: 999,
                  px: 2,
                  borderColor: "#f97316",
                  color: "#f97316",
                  bgcolor: "rgba(249, 115, 22, 0.08)",
                  fontWeight: 700,
                  fontSize: "0.78rem",
                  textTransform: "none",
                  "&:hover": {
                    borderColor: "#ea580c",
                    bgcolor: "rgba(249, 115, 22, 0.16)",
                  },
                }}
              >
                Edit
              </Button>
              {leadDetails?.status === "Missed Leads" ? (
                <Button
                  variant="outlined"
                  startIcon={<Restore sx={{ fontSize: 13 }} />}
                  onClick={handleReopenLead}
                  sx={{
                    height: 36,
                    borderRadius: 999,
                    px: 2,
                    borderColor: "#10b981",
                    color: "#10b981",
                    bgcolor: "rgba(16, 185, 129, 0.08)",
                    fontWeight: 700,
                    fontSize: "0.78rem",
                    textTransform: "none",
                    "&:hover": {
                      borderColor: "#059669",
                      bgcolor: "rgba(16, 185, 129, 0.16)",
                    },
                  }}
                >
                  Reopen
                </Button>
              ) : (
                <Button
                  variant="outlined"
                  startIcon={<Cancel sx={{ fontSize: 13 }} />}
                  onClick={() => {
                    setLoseReason("");
                    setLoseLeadDialogOpen(true);
                  }}
                  sx={{
                    height: 36,
                    borderRadius: 999,
                    px: 2,
                    borderColor: "#ef4444",
                    color: "#ef4444",
                    bgcolor: "rgba(239, 68, 68, 0.08)",
                    fontWeight: 700,
                    fontSize: "0.78rem",
                    textTransform: "none",
                    "&:hover": {
                      borderColor: "#dc2626",
                      bgcolor: "rgba(239, 68, 68, 0.16)",
                    },
                  }}
                >
                  Lose
                </Button>
              )}
              <Button
                variant="contained"
                disableElevation
                endIcon={<ArrowForward sx={{ fontSize: 15 }} />}
                onClick={handleConvertToProject}
                sx={{
                  height: 36,
                  minWidth: { xs: 196, sm: 216 },
                  borderRadius: 999,
                  px: 2.25,
                  background: "linear-gradient(45deg, #f97316 0%, #ea580c 100%)",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "0.78rem",
                  textTransform: "none",
                  boxShadow: "0 4px 14px rgba(249, 115, 22, 0.35)",
                  "&:hover": {
                    background: "linear-gradient(45deg, #ea580c 0%, #c2410c 100%)",
                    boxShadow: "0 6px 18px rgba(249, 115, 22, 0.45)",
                  },
                  "& .MuiButton-endIcon": { color: "#fff", ml: 0.75 },
                }}
              >
                {leadDetails?.isProject ? "Open project" : "Convert to project"}
              </Button>
              <IconButton
                onClick={openProjectMenu}
                sx={{ width: 36, height: 36, borderRadius: 999, color: "#fff", bgcolor: "rgba(255,255,255,0.08)", border: "0.5px solid rgba(255,255,255,0.16)", "&:hover": { bgcolor: "rgba(255,255,255,0.14)" } }}
              >
                <MoreVert sx={{ fontSize: 16 }} />
              </IconButton>
            </Stack>
          </Stack>
        </Box>

        <PipelineStepper
          currentIndex={dealPipelineStageIndex}
          stages={DEAL_PIPELINE_STAGES}
          actionCard={pipelineActionCard}
          onStageClick={handleDealPipelineStageClick}
          onAssignLead={openAssignDialog}
        />
      </Paper>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "260px minmax(0,1fr)" }, gap: 2 }}>

        {/* ── Left sidebar ───────────────────────────────────────────────────── */}
        <Stack spacing={1.5}>

          {/* Contact card */}
          <Paper {...card({ p: 0 })}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2, py: 1.25, borderBottom: `0.5px solid ${TOKEN.border}` }}>
              <Typography sx={{ fontSize: "0.65rem", fontWeight: 600, color: TOKEN.textMuted, letterSpacing: "0.08em", textTransform: "uppercase" }}>Contact</Typography>
              <Button
                size="small"
                startIcon={<Edit sx={{ fontSize: 11 }} />}
                onClick={openEditDialog}
                sx={{ color: TOKEN.primary, fontWeight: 500, fontSize: "0.72rem", borderRadius: TOKEN.radiusSm, px: 0.75, minHeight: 0, py: 0.4 }}
              >
                Edit
              </Button>
            </Stack>
            <Stack>
              {[
                { label: "Phone",   value: leadDetails.phone || "—", icon: <Phone sx={{ fontSize: 13 }} /> },
                { label: "Email",   value: leadDetails.email || "—", icon: <Email sx={{ fontSize: 13 }} /> },
                { label: "Source",  value: leadDetails.source || "Manual Entry", icon: <Workspaces sx={{ fontSize: 13 }} /> },
                { label: "Status",  value: leadDetails.isProject ? "Project Converted" : (leadDetails.status || "New"), icon: <CheckCircle sx={{ fontSize: 13 }} /> },
                { label: "Address", value: leadDetails.city || leadDetails.address || "—", icon: <LocationOn sx={{ fontSize: 13 }} /> },
              ].map((item) => (
                <Stack key={item.label} direction="row" spacing={1.25} alignItems="flex-start" sx={{ py: 1.25, px: 2, borderBottom: `0.5px solid ${TOKEN.border}`, "&:last-of-type": { borderBottom: "none" } }}>
                  <Box sx={{ width: 26, height: 26, borderRadius: TOKEN.radiusSm, bgcolor: TOKEN.primaryMuted, color: TOKEN.primary, display: "grid", placeItems: "center", flexShrink: 0 }}>
                    {item.icon}
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontSize: "0.62rem", color: TOKEN.textMuted, fontWeight: 500, letterSpacing: "0.04em", mb: 0.15 }}>{item.label}</Typography>
                    <Typography sx={{ fontSize: "0.8rem", fontWeight: 500, color: TOKEN.text, wordBreak: "break-word" }}>{item.value}</Typography>
                  </Box>
                </Stack>
              ))}
            </Stack>
          </Paper>

          {/* Lead score card */}
          <Paper
            elevation={0}
            sx={{
              p: 2.25,
              borderRadius: TOKEN.radius,
              background: GRADIENT_SCORE,
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 6px 20px rgba(15, 31, 61, 0.18)",
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.25 }}>
              <Typography sx={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.8)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Lead Score
              </Typography>
              <Chip
                label={scoreBucket.label}
                size="small"
                sx={{
                  bgcolor: alpha(scoreBucket.color, 0.28),
                  color: "#fff",
                  fontWeight: 700,
                  height: 22,
                  fontSize: "0.72rem",
                  border: `1px solid ${alpha(scoreBucket.color, 0.5)}`,
                }}
              />
            </Stack>

            <Stack direction="row" alignItems="baseline" spacing={0.75} sx={{ mb: 1.5 }}>
              <Typography sx={{ fontWeight: 700, fontSize: "2.4rem", color: "#ffffff", lineHeight: 1, letterSpacing: "-0.03em" }}>
                {leadScore}
              </Typography>
              <Typography sx={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.55)", fontWeight: 500 }}>
                / 100
              </Typography>
            </Stack>

            <LinearProgress
              variant="determinate"
              value={leadScore}
              sx={{
                height: 5,
                borderRadius: 999,
                bgcolor: "rgba(255,255,255,0.18)",
                mb: 1.5,
                "& .MuiLinearProgress-bar": {
                  borderRadius: 999,
                  background:
                    leadScore >= 75
                      ? "linear-gradient(90deg, #f59e0b, #ef4444)"
                      : leadScore >= 45
                      ? "linear-gradient(90deg, #38bdf8, #3b82f6)"
                      : "linear-gradient(90deg, #94a3b8, #cbd5e1)",
                },
              }}
            />

            <Typography sx={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.55)", lineHeight: 1.45 }}>
              Auto-computed from profile completeness and journey stage.
            </Typography>
          </Paper>

          {/* Salesperson card */}
          <Paper {...card({ p: 0 })}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2, py: 1.25, borderBottom: `0.5px solid ${TOKEN.border}` }}>
              <Typography sx={{ fontSize: "0.65rem", fontWeight: 600, color: TOKEN.textMuted, letterSpacing: "0.08em", textTransform: "uppercase" }}>Salesperson</Typography>
              <Button size="small" onClick={openAssignDialog} sx={{ color: TOKEN.primary, fontWeight: 500, fontSize: "0.72rem", borderRadius: TOKEN.radiusSm, px: 0.75, minHeight: 0, py: 0.4 }}>Change</Button>
            </Stack>
            {assignedPerson ? (
              <Stack direction="row" spacing={1.25} alignItems="center" sx={{ px: 2, py: 1.5 }}>
                <Avatar sx={{ width: 32, height: 32, bgcolor: TOKEN.primaryMuted, color: TOKEN.primary, fontSize: "0.82rem", fontWeight: 600 }}>
                  {assignedPerson.firstName?.[0] || assignedPerson.lastName?.[0] || "S"}
                </Avatar>
                <Box>
                  <Typography sx={{ fontSize: "0.82rem", fontWeight: 600, color: TOKEN.text }}>
                    {[assignedPerson.firstName, assignedPerson.lastName].filter(Boolean).join(" ") || "Assigned"}
                  </Typography>
                  <Typography sx={{ fontSize: "0.7rem", color: TOKEN.textMuted }}>{assignedPerson.role || "Sales Executive"}</Typography>
                </Box>
              </Stack>
            ) : (
              <Box sx={{ px: 2, py: 1.5 }}>
                <Box
                  onClick={openAssignDialog}
                  sx={{
                    px: 1.5,
                    py: 1,
                    borderRadius: TOKEN.radiusSm,
                    bgcolor: "rgba(249, 115, 22, 0.08)",
                    border: "1px solid #ea580c",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    "&:hover": {
                      bgcolor: "rgba(249, 115, 22, 0.16)",
                    },
                  }}
                >
                  <Typography sx={{ fontSize: "0.82rem", color: "#ea580c", fontWeight: 800, textAlign: "center" }}>
                    Assign the lead
                  </Typography>
                </Box>
              </Box>
            )}
          </Paper>

          {/* Tags card */}
          <Paper {...card({ p: 0 })}>
            <Box sx={{ px: 2, py: 1.25, borderBottom: `0.5px solid ${TOKEN.border}` }}>
              <Typography sx={{ fontSize: "0.65rem", fontWeight: 600, color: TOKEN.textMuted, letterSpacing: "0.08em", textTransform: "uppercase" }}>Tags</Typography>
            </Box>
            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ px: 2, py: 1.25 }}>
              {[leadDetails.status, leadDetails.city, resolvedLeadVisitStatus].filter(Boolean).map((tag) => (
                <Chip key={tag} label={tag} size="small" variant="outlined" sx={{ borderColor: TOKEN.border, color: TOKEN.textSub, fontWeight: 500, fontSize: "0.7rem", height: 22, borderRadius: TOKEN.radiusSm }} />
              ))}
              <Button size="small" startIcon={<Add sx={{ fontSize: 11 }} />} onClick={() => showInfo("Tags are not connected yet.")}
                sx={{ color: TOKEN.primary, fontWeight: 500, fontSize: "0.7rem", borderRadius: TOKEN.radiusSm, px: 0.75, minHeight: 0, py: 0.3 }}
              >
                Add tag
              </Button>
            </Stack>
          </Paper>
        </Stack>

        {/* ── Right: tabs panel ──────────────────────────────────────────────── */}
        <Paper {...card({ overflow: "hidden" })}>
          <Box sx={{ px: 2, pt: 0, borderBottom: `0.5px solid ${TOKEN.border}` }}>
            <Tabs
              value={tab}
              onChange={(_, v) => {
                setTab(v);
                if (v === "comments") setActivityMode("Comment");
              }}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                minHeight: 40,
                "& .MuiTab-root": {
                  minHeight: 40,
                  textTransform: "none",
                  fontSize: "0.78rem",
                  fontWeight: 500,
                  px: 1.25,
                  color: TOKEN.textMuted,
                  "&.Mui-selected": { color: TOKEN.primary, fontWeight: 600 },
                },
                "& .MuiTabs-indicator": { bgcolor: TOKEN.primary, height: 2, borderRadius: "2px 2px 0 0" },
              }}
            >
              {DETAIL_TABS.map((item) => (
                <Tab
                  key={item.key}
                  value={item.key}
                  label={
                    <Stack direction="row" spacing={0.6} alignItems="center">
                      <span>{item.label}</span>
                      {(tabCounts[item.key] > 0 || item.key === "quotations") && (
                        <Box sx={{
                          minWidth: 16, height: 16, borderRadius: 99,
                          bgcolor: tab === item.key ? TOKEN.primaryMuted : alpha(TOKEN.textMuted, 0.1),
                          color: tab === item.key ? TOKEN.primary : TOKEN.textMuted,
                          fontSize: "0.58rem", fontWeight: 600,
                          display: "grid", placeItems: "center", px: 0.5,
                        }}>
                          {tabCounts[item.key]}
                        </Box>
                      )}
                    </Stack>
                  }
                />
              ))}
            </Tabs>
          </Box>
          <Box sx={{ p: 2.25 }}>{renderTabContent()}</Box>
        </Paper>
      </Box>

      {/* ── Overflow menu ──────────────────────────────────────────────────────── */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={closeProjectMenu}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          sx: {
            mt: 1.25,
            minWidth: 300,
            borderRadius: 3.5,
            border: `1px solid ${TOKEN.border}`,
            boxShadow: "0 24px 50px rgba(15,27,53,0.16)",
            overflow: "hidden",
          },
        }}
        MenuListProps={{ sx: { py: 1.25, px: 1.25 } }}
      >
        {[ 
          { key: "site-survey", label: "Site Survey Form", icon: <DescriptionOutlined fontSize="small" />, color: "#4ea4ef" },
          { key: "3d-design", label: "3D Design", icon: <GridViewOutlined fontSize="small" />, color: "#5a6cb2" },
          ...(leadDetails?.isProject
            ? [
                { key: "change-project-type", label: "Change Project Type", icon: <Edit fontSize="small" />, color: "#f59f00", dividerBefore: true },
                { key: "move-back-to-lead", label: "Move Back to Lead", icon: <Workspaces fontSize="small" />, color: "#ef4444" },
              ]
            : []),
          { key: "vendor-agreement", label: "Vendor Agreement", icon: <ContentCopy fontSize="small" />, color: "#59c7b4", dividerBefore: true },
          { key: "work-order", label: "Work Order", icon: <AssignmentTurnedIn fontSize="small" />, color: "#59c7b4" },
          { key: "mark-as-lost", label: leadDetails?.status === "Missed Leads" ? "Reopen Lead" : "Mark Lead as Lost", icon: leadDetails?.status === "Missed Leads" ? <Restore fontSize="small" /> : <Cancel fontSize="small" />, color: leadDetails?.status === "Missed Leads" ? "#10b981" : "#ef4444", dividerBefore: true },
        ].map((item) => (
          <Box key={item.key}>
            {item.dividerBefore && <Divider sx={{ my: 1, borderColor: TOKEN.border }} />}
            <MenuItem
              onClick={() => handleProjectAction(item.key)}
              sx={{
                px: 1.25,
                py: 1.55,
                borderRadius: 2.5,
                gap: 1.5,
                color: "#667085",
                fontSize: "0.9rem",
                fontWeight: 500,
                "&:hover": { bgcolor: alpha(TOKEN.primary, 0.05) },
              }}
            >
              <Box sx={{ color: item.color, display: "grid", placeItems: "center" }}>
                {item.icon}
              </Box>
              {item.label}
            </MenuItem>
          </Box>
        ))}
      </Menu>

      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.pdf"
        style={{ display: "none" }}
        onChange={handleDirectFileSelection}
      />

      <Dialog
        open={projectTypeDialogOpen}
        onClose={projectRecoverySaving ? undefined : () => setProjectTypeDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: TOKEN.radius } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Change Project Type</DialogTitle>
        <Box sx={{ px: 3, pb: 1 }}>
          <TextField
            select
            fullWidth
            label="Project Type"
            value={recoveryProjectType}
            onChange={(event) => setRecoveryProjectType(event.target.value)}
            disabled={projectRecoverySaving}
          >
            {PROJECT_TYPES.map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </TextField>
        </Box>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setProjectTypeDialogOpen(false)} disabled={projectRecoverySaving}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSaveProjectType} disabled={projectRecoverySaving || !recoveryProjectType}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={revertProjectDialogOpen}
        onClose={projectRecoverySaving ? undefined : () => setRevertProjectDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: TOKEN.radius } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Move Project Back to Lead?</DialogTitle>
        <Box sx={{ px: 3, pb: 1 }}>
          <Typography sx={{ color: TOKEN.textSub, lineHeight: 1.7 }}>
            This will remove the project conversion from this record and return it to the lead flow. Use this only when the lead was converted by mistake.
          </Typography>
        </Box>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setRevertProjectDialogOpen(false)} disabled={projectRecoverySaving}>
            Cancel
          </Button>
          <Button color="error" variant="contained" onClick={handleRevertProjectToLead} disabled={projectRecoverySaving}>
            Move Back to Lead
          </Button>
        </DialogActions>
      </Dialog>

      <ConvertProjectDialog
        open={projectDialogOpen}
        lead={leadDetails}
        quotations={quotationEntries}
        submitting={projectDialogSubmitting}
        onClose={closeProjectDialog}
        onCreateQuotation={openQuotationBuilder}
        onCreateWithoutQuotation={(projectDetails) => completeProjectConversion(null, projectDetails)}
        onContinueWithQuotation={(quotation, projectDetails) => completeProjectConversion(quotation, projectDetails)}
      />

      <WorkOrderDialog
        open={workOrderDialogOpen}
        onClose={() => setWorkOrderDialogOpen(false)}
        lead={leadDetails}
        quotations={quotationEntries}
        siteSurveyRecord={siteSurveyRecord}
        showSnackbar={(message, severity = "info") => setSnackbar({ open: true, message, severity })}
      />

      {/* ── Snackbar ───────────────────────────────────────────────────────────── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3500}
        onClose={() => setSnackbar(c => ({ ...c, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar(c => ({ ...c, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ borderRadius: TOKEN.radiusSm, boxShadow: TOKEN.shadowHover }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Dialog
        open={reminderDialogOpen}
        onClose={closeReminderDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            overflow: "hidden",
            border: `1px solid ${TOKEN.border}`,
            bgcolor: TOKEN.surface,
            backgroundImage: "none",
            boxShadow: TOKEN.shadow,
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 3.5,
            py: 2.5,
            fontWeight: 800,
            color: TOKEN.text,
            borderBottom: `1px solid ${TOKEN.border}`,
          }}
        >
          Add Reminder
          <IconButton onClick={closeReminderDialog} size="small" sx={{ color: TOKEN.textMuted }}>
            <Close />
          </IconButton>
        </DialogTitle>

        <Box sx={{ px: 3.5, py: 3, bgcolor: TOKEN.surface }}>
          <Stack spacing={3}>
            <Box>
              <Typography sx={{ mb: 1, fontSize: "1rem", color: TOKEN.textSub, fontWeight: 500 }}>
                Description
              </Typography>
              <TextField
                fullWidth
                value={activityForm.message}
                onChange={handleActivityFieldChange("message")}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2.5,
                    bgcolor: getIsDark() ? "#172338" : "#fff",
                    color: TOKEN.text,
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: TOKEN.borderMid },
                  },
                }}
              />
            </Box>

            <Box>
              <Typography sx={{ mb: 1, fontSize: "1rem", color: TOKEN.textSub, fontWeight: 500 }}>
                Date
              </Typography>
              <TextField
                fullWidth
                type="date"
                value={activityForm.scheduledAt ? activityForm.scheduledAt.slice(0, 10) : ""}
                onChange={(event) => {
                  const value = event.target.value;
                  setActivityForm((prev) => ({
                    ...prev,
                    scheduledAt: value ? `${value}T09:00` : "",
                  }));
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2.5,
                    bgcolor: getIsDark() ? "#172338" : "#fff",
                    color: TOKEN.text,
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: TOKEN.borderMid },
                  },
                }}
              />
            </Box>
          </Stack>
        </Box>

        <DialogActions
          sx={{
            px: 3.5,
            py: 2.75,
            borderTop: `1px solid ${TOKEN.border}`,
            bgcolor: getIsDark() ? "#0e1626" : "#f8fafc",
            gap: 1.25,
          }}
        >
          <Button
            onClick={closeReminderDialog}
            sx={{
              borderRadius: 2,
              px: 2.5,
              py: 1,
              color: TOKEN.textSub,
              border: `1px solid ${TOKEN.borderMid}`,
              bgcolor: getIsDark() ? "#172338" : "#fff",
              fontWeight: 700,
              textTransform: "none",
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleActivitySubmit}
            disabled={savingActivity}
            sx={{
              borderRadius: 2,
              px: 2.5,
              py: 1,
              bgcolor: getIsDark() ? TOKEN.primary : "#2d3748",
              color: "#fff",
              fontWeight: 700,
              textTransform: "none",
              "&:hover": { bgcolor: getIsDark() ? TOKEN.primaryLight : "#1f2937" },
            }}
          >
            {savingActivity ? "Saving..." : "Set Reminder"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={siteVisitDialogOpen}
        onClose={closeSiteVisitDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            overflow: "hidden",
            border: `1px solid ${TOKEN.border}`,
            bgcolor: TOKEN.surface,
            backgroundImage: "none",
            boxShadow: TOKEN.shadow,
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 3.5,
            py: 2.5,
            fontWeight: 800,
            color: TOKEN.text,
            borderBottom: `1px solid ${TOKEN.border}`,
          }}
        >
          Schedule Site Visit
          <IconButton onClick={closeSiteVisitDialog} size="small" sx={{ color: TOKEN.textMuted }}>
            <Close />
          </IconButton>
        </DialogTitle>

        <Box sx={{ px: 3.5, py: 3, bgcolor: TOKEN.surface }}>
          <Stack spacing={3}>
            {siteVisitUserError && (
              <Alert severity="warning" sx={{ borderRadius: 2 }}>
                {siteVisitUserError}
              </Alert>
            )}

            <Box>
              <Typography sx={{ mb: 1, fontSize: "1rem", color: TOKEN.textSub, fontWeight: 500 }}>
                Assign To *
              </Typography>
              <Autocomplete
                options={siteVisitAssigneeOptions}
                value={selectedSiteVisitAssignee}
                loading={siteVisitUsersLoading}
                onChange={(_, value) => setSiteVisitAssigneeId(value?._id || "")}
                getOptionLabel={(option) => getPersonDisplayName(option)}
                isOptionEqualToValue={(option, value) => option._id === value._id}
                noOptionsText="No users found"
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Search user..."
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2.5,
                        bgcolor: getIsDark() ? "#172338" : "#fff",
                        color: TOKEN.text,
                        "& .MuiOutlinedInput-notchedOutline": { borderColor: TOKEN.borderMid },
                      },
                    }}
                  />
                )}
              />
            </Box>

            <Box>
              <Typography sx={{ mb: 1, fontSize: "1rem", color: TOKEN.textSub, fontWeight: 500 }}>
                Site Visit Date *
              </Typography>
              <TextField
                fullWidth
                type="date"
                value={activityForm.scheduledAt ? activityForm.scheduledAt.slice(0, 10) : ""}
                onChange={(event) => {
                  const value = event.target.value;
                  setActivityForm((prev) => ({
                    ...prev,
                    scheduledAt: value ? `${value}T09:00` : "",
                  }));
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2.5,
                    bgcolor: getIsDark() ? "#172338" : "#fff",
                    color: TOKEN.text,
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: TOKEN.borderMid },
                  },
                }}
              />
            </Box>
          </Stack>
        </Box>

        <DialogActions
          sx={{
            px: 3.5,
            py: 2.75,
            borderTop: `1px solid ${TOKEN.border}`,
            bgcolor: getIsDark() ? "#0e1626" : "#f8fafc",
            gap: 1.25,
          }}
        >
          <Button
            onClick={closeSiteVisitDialog}
            sx={{
              borderRadius: 2,
              px: 2.5,
              py: 1,
              color: TOKEN.textSub,
              border: `1px solid ${TOKEN.borderMid}`,
              bgcolor: getIsDark() ? "#172338" : "#fff",
              fontWeight: 700,
              textTransform: "none",
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleActivitySubmit}
            disabled={savingActivity}
            sx={{
              borderRadius: 2,
              px: 2.5,
              py: 1,
              bgcolor: getIsDark() ? TOKEN.primary : "#2d3748",
              color: "#fff",
              fontWeight: 700,
              textTransform: "none",
              "&:hover": { bgcolor: getIsDark() ? TOKEN.primaryLight : "#1f2937" },
            }}
          >
            {savingActivity ? "Saving..." : "Schedule Site Visit"}
          </Button>
        </DialogActions>
      </Dialog>

      <EditLeadModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        lead={leadDetails}
        onSave={handleEditSaved}
        userRole={userRole}
      />

      <AssignLeadModal
        open={assignDialogOpen}
        onClose={closeAssignDialog}
        lead={leadDetails}
        onAssign={fetchLeadDetails}
        userRole={userRole}
        showSnackbar={(msg, sev) => setSnackbar({ open: true, message: msg, severity: sev })}
      />

      {/* Lose Lead Confirmation Dialog */}
      <Dialog
        open={loseLeadDialogOpen}
        onClose={() => !submittingLoseLead && setLoseLeadDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "16px",
            p: 0,
            overflow: "hidden",
            boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
            bgcolor: TOKEN.surface,
            backgroundImage: "none",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 3,
            py: 2,
            bgcolor: alpha("#ef4444", getIsDark() ? 0.12 : 0.05),
            borderBottom: `1px solid ${alpha("#ef4444", 0.18)}`,
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                bgcolor: alpha("#ef4444", 0.15),
                color: "#ef4444",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Cancel sx={{ fontSize: 20 }} />
            </Box>
            <Typography variant="h6" fontWeight={700} fontSize="1.05rem" color={TOKEN.text}>
              Mark Lead as Lost
            </Typography>
          </Stack>
          <IconButton size="small" onClick={() => setLoseLeadDialogOpen(false)} disabled={submittingLoseLead} sx={{ color: TOKEN.textMuted }}>
            <Close sx={{ fontSize: 18 }} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ px: 3, pt: 2.5, pb: 1, bgcolor: TOKEN.surface }}>
          <Typography variant="body2" color={TOKEN.textSub} sx={{ mb: 2, lineHeight: 1.6, fontSize: "0.875rem" }}>
            Are you sure you want to mark <strong>{leadDetails?.firstName} {leadDetails?.lastName}</strong> as lost? This will update the lead status to <strong>Missed Leads</strong>.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Reason for loss (Optional)"
            placeholder="e.g. Budget constraints, selected competitor, lost interest..."
            value={loseReason}
            onChange={(e) => setLoseReason(e.target.value)}
            variant="outlined"
            size="small"
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "10px",
                bgcolor: getIsDark() ? "#172338" : "#f8fafc",
                color: TOKEN.text,
                fontSize: "0.875rem",
                "& .MuiOutlinedInput-notchedOutline": { borderColor: TOKEN.borderMid },
              },
              "& .MuiInputLabel-root": { color: TOKEN.textMuted },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${TOKEN.border}`, bgcolor: getIsDark() ? "#0e1626" : "#fafafa", gap: 1 }}>
          <Button
            onClick={() => setLoseLeadDialogOpen(false)}
            disabled={submittingLoseLead}
            variant="outlined"
            sx={{
              textTransform: "none",
              fontWeight: 600,
              color: TOKEN.textSub,
              borderColor: TOKEN.borderMid,
              borderRadius: "8px",
              px: 2,
              "&:hover": { borderColor: TOKEN.textMuted, bgcolor: getIsDark() ? "rgba(255,255,255,0.04)" : "#f1f5f9" },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleMarkAsLost}
            variant="contained"
            disabled={submittingLoseLead}
            sx={{
              bgcolor: "#dc2626",
              color: "#fff",
              fontWeight: 700,
              textTransform: "none",
              borderRadius: "8px",
              px: 2.5,
              boxShadow: "0 4px 12px rgba(220, 38, 38, 0.25)",
              "&:hover": { bgcolor: "#b91c1c" },
            }}
          >
            {submittingLoseLead ? "Marking..." : "Confirm Lose"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
