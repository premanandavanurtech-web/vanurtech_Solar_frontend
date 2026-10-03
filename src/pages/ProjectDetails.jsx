import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  alpha,
  Box,
  Button,
  Card,
  Chip,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import {
  AccessTime,
  AccountBalance,
  ArrowBack,
  Bolt,
  Build,
  CalendarMonth,
  CheckCircle,
  Clear,
  CloudUpload,
  DescriptionOutlined,
  Download,
  Edit,
  FactCheck,
  InfoOutlined,
  Link as LinkIcon,
  LocationOn,
  PhotoCameraOutlined,
  Payments,
  CurrencyRupee,
  ContentCopy,
  Save,
  Summarize,
  TaskAlt,
  TrendingUp,
  Workspaces,
  InsertDriveFileOutlined,
  OpenInNew,
  PictureAsPdfOutlined,
  WhatsApp,
} from "@mui/icons-material";
import { format, parseISO } from "date-fns";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { toBackendAssetUrl } from "../utils/backendAssetUrl";
import { getProjectStage } from "../utils/projectStage";

// ---- Design tokens ---------------------------------------------------
// A refined, professional palette: a deep navy ink, a single confident
// indigo accent used for every interactive/active state, and semantic
// status colors reserved for meaning (done / active / pending / warning).
const INK = "#0B1220";        // primary text & headings
const INK_2 = "#111A2E";      // secondary dark surface (hero panel)
const SURFACE = "#F5F7FA";    // page background
const PANEL = "#FFFFFF";      // card surface
const BORDER = "#E4E8F0";     // hairlines
const BORDER_SOFT = "#EDF0F5";
const MUTED = "#5B6472";      // secondary text
const MUTED_2 = "#8A93A3";    // tertiary / placeholder text
const BRAND = "#3450DB";      // the one accent: interactive + "active" state
const BRAND_DARK = "#2A3FB8";
const SUCCESS = "#12805C";    // completed
const WARNING = "#B4650F";    // attention / subsidy
const NEUTRAL = "#9AA4B2";    // pending / inactive
const DANGER = "#C0392B";

// Consistent elevation system used across every card/panel so the page
// reads as one considered surface, not a stack of ad-hoc boxes.
const SHADOW_SM = "0 1px 2px rgba(15, 23, 42, 0.04), 0 1px 1px rgba(15, 23, 42, 0.03)";
const SHADOW_MD = "0 6px 20px rgba(15, 23, 42, 0.06), 0 1px 3px rgba(15, 23, 42, 0.04)";
const SHADOW_LG = "0 20px 48px rgba(11, 18, 32, 0.14)";
const RADIUS = "14px";
const RADIUS_SM = "10px";

const PROJECT_STAGES = [
  { key: "lead_converted", label: "Lead Converted", icon: Workspaces },
  { key: "registration", label: "Registration", icon: FactCheck },
  { key: "document", label: "Document", icon: DescriptionOutlined },
  { key: "payment", label: "Payment", icon: Payments },
  { key: "loan_pending", label: "Loan Pending", icon: CalendarMonth },
  { key: "disbursement", label: "Disbursement", icon: TrendingUp },
  { key: "installation", label: "Installation", icon: Bolt },
];

const ACTION_STAGES = PROJECT_STAGES.filter((stage) => stage.key !== "lead_converted");

// The Summary tab is a read-only overview, not an actual project stage,
// so it lives alongside ACTION_STAGES only for tab navigation purposes.
const WORKFLOW_TABS = [
  { key: "summary", label: "Summary", icon: Summarize },
  ...ACTION_STAGES,
];

const STRICT_WORKFLOW_STAGES = [
  "registration",
  "document",
  "payment",
  "loan_pending",
  "disbursement",
  "installation",
];

const SOLAR_REQUIREMENT_TYPES = [
  "PMSG On Grid",
  "PMSG Residential(1-10k)",
  "Commercial (10kW  & above)",
  "Industrial (50+ kW)",
];

const REGISTRATION_STATUS_OPTIONS = [
  { value: "inProgress", label: "In Progress" },
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
];

const LEAD_STATUS_OPTIONS = ["Registration", "Document Submission", "Missed Leads"];

const PAYMENT_TYPE_OPTIONS = ["Bank Loan", "Cash", "Online Transfer", "Cheque"];
const PAYMENT_STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
  { value: "cancelled", label: "Cancelled" },
];

const LOAN_STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "submitted", label: "Submitted" },
];

const PAYMENT_LEAD_STATUS_OPTIONS = ["Bank Loan Apply", "Bank at Pending", "Missed Leads"];

const INSTALLATION_STATUS_OPTIONS = [
  { value: "installation_progress", label: "BOQ" },
  { value: "installation_completed", label: "Complete" },
  { value: "sent_for_jee_verification", label: "JEE Verification" },
  { value: "jee_verified", label: "JEE Verified" },
  { value: "meter_charge", label: "Approve Subsidy" },
  { value: "final_payment", label: "Final Payment" },
];

const INSTALLATION_LEAD_STATUS_OPTIONS = [
  {
    value: "Installation Completion",
    label: "Installation Completion",
    description: "Installation completed successfully",
  },
  {
    value: "Missed Leads",
    label: "Missed Leads",
    description: "Lead was not converted",
  },
];

const DISBURSEMENT_STATUS_OPTIONS = [
  { value: "pending", label: "Pending", description: "Disbursement is pending" },
  { value: "completed", label: "Completed", description: "Disbursement completed successfully" },
  { value: "cancelled", label: "Cancelled", description: "Disbursement cancelled" },
];

const DISBURSEMENT_LEAD_STATUS_OPTIONS = [
  { value: "Disbursement", label: "Disbursement", description: "Loan disbursement in progress" },
  { value: "Installation Completion", label: "Installation Completion", description: "Installation completed" },
  { value: "Missed Leads", label: "Missed Leads", description: "Lead was not converted" },
];

const BANK_STATUS_OPTIONS = [
  { value: "pending", label: "Pending", description: "Waiting for bank approval" },
  { value: "approved", label: "Approved", description: "Bank approval received" },
  { value: "rejected", label: "Rejected", description: "Bank rejected the application" },
];

const BANK_LEAD_STATUS_OPTIONS = [
  { value: "Bank at Pending", label: "Bank at Pending", description: "Awaiting bank approval" },
  { value: "Disbursement", label: "Disbursement", description: "Loan disbursement stage" },
  { value: "Missed Leads", label: "Missed Leads", description: "Lead was not converted" },
];

const BANK_LIST = [
  "State Bank of India",
  "HDFC Bank",
  "ICICI Bank",
  "Axis Bank",
  "Punjab National Bank",
  "Bank of Baroda",
  "Canara Bank",
  "Union Bank of India",
  "Bank of India",
  "IndusInd Bank",
  "Kotak Mahindra Bank",
  "Yes Bank",
  "IDFC First Bank",
  "Other",
];

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

const DOCUMENT_REQUIREMENTS = [
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
  { key: "other", label: "Other", aliases: ["other"], accent: "#94a3b8" },
];

const STAGE_ROUTES = {
  registration: "/registration",
  document: "/document-submission",
  payment: "/bank-loan-apply",
  loan_pending: "/bank-at-pending",
  installation: "/installation-completion",
  disbursement: "/disbursement",
};

// State-based color: this is what makes the pipeline read as one coherent
// system rather than seven unrelated hues.
const stateColor = (state) => {
  if (state === "done") return SUCCESS;
  if (state === "active") return BRAND;
  return NEUTRAL;
};

const normalizeProjectStage = (projectOrStage) => {
  const rawStage = typeof projectOrStage === "string" ? projectOrStage : getProjectStage(projectOrStage);
  if (rawStage === "visit") return "lead_converted";
  if (rawStage === "bank_loan") return "payment";
  if (rawStage === "handover") return "disbursement";
  return rawStage || "lead_converted";
};

const formatDate = (value, pattern = "dd MMM yyyy") => {
  if (!value) return "Not available";
  try {
    return format(typeof value === "string" ? parseISO(value) : new Date(value), pattern);
  } catch {
    return "Not available";
  }
};

const formatMoney = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const hasValue = (value) => value !== undefined && value !== null && value !== "";

const formatOptionalMoney = (value) => (hasValue(value) ? formatMoney(value) : "Not available");

const getValidLeadId = (proj) => {
  if (!proj) return "";
  if (proj.source === "installerWorksheet") {
    return String(proj.worksheetProjectId || proj.worksheetId || "");
  }
  if (proj.leadId) return String(proj.leadId);
  if (proj._id) return String(proj._id);
  if (proj.id) return String(proj.id);
  return "";
};

const getCustomerName = (project) =>
  [project?.firstName, project?.lastName].filter(Boolean).join(" ") || project?.customerName || "Unnamed project";

const getSystemSize = (project) =>
  project?.solarRequirement || project?.systemSize || project?.capacity || project?.plantCapacity || "";

const getProjectValue = (project) =>
  project?.projectValue || project?.totalProjectCost || project?.quotationAmount || project?.loanAmount || project?.disbursementAmount;

const getProjectTitle = (project) => {
  const parts = [
    getCustomerName(project),
    getSystemSize(project),
    project?.projectType || project?.leadType || project?.requirementType,
  ].filter(Boolean);
  return parts.join(" · ");
};

const getProjectSubtitle = (project) => {
  const parts = [project?.city || project?.address, project?.phone].filter(Boolean);
  return parts.length ? parts.join(" · ") : "No location or phone available";
};

const getNextActionLabel = (project, stage) =>
  project?.nextAction ||
  project?.nextActionTitle ||
  project?.nextFollowUpAction ||
  project?.nextFollowUpNote ||
  (stage?.key === "lead_converted" ? "No workflow action available" : `Update ${stage?.label || "current stage"}`);

const isCompletedStatus = (value) => {
  const normalized = String(value || "").toLowerCase().replace(/[_-]/g, " ");
  return ["done", "complete", "completed", "approved", "verified", "paid", "success", "submitted"].some((item) =>
    normalized.includes(item)
  );
};

const isStrictWorkflowStageComplete = (project, stageKey) => {
  if (!project) return false;

  if (stageKey === "registration") {
    return isCompletedStatus(project.registrationStatus);
  }
  if (stageKey === "document") {
    return isCompletedStatus(project.documentStatus) || getUploadedDocuments(project).length > 0;
  }
  if (stageKey === "payment") {
    return (
      isCompletedStatus(project.paymentStatus) ||
      isCompletedStatus(project.loanStatus) ||
      (hasValue(project.loanAmount) && hasValue(project.bank) && hasValue(project.branchName))
    );
  }
  if (stageKey === "loan_pending") {
    if (project.paymentType === "Cash") return true;
    return isCompletedStatus(project.bankAtPendingStatus);
  }
  if (stageKey === "disbursement") {
    return isCompletedStatus(project.disbursementStatus) || (hasValue(project.disbursementAmount) && hasValue(project.disbursementDate));
  }
  if (stageKey === "installation") {
    return isCompletedStatus(project.installationStatus) || hasValue(project.installationDate);
  }

  return false;
};

const getStrictWorkflowLock = (project, stageKey) => {
  return { locked: false, message: "" };
};

const getFirstAvailableWorkflowStage = (project) => {
  const firstIncomplete = STRICT_WORKFLOW_STAGES.find((stageKey) => !isStrictWorkflowStageComplete(project, stageKey));
  return firstIncomplete || STRICT_WORKFLOW_STAGES[STRICT_WORKFLOW_STAGES.length - 1];
};

const getStageMeta = (key) => PROJECT_STAGES.find((stage) => stage.key === key) || PROJECT_STAGES[0];

const formatInputDate = (value) => {
  if (!value) return "";
  try {
    return format(typeof value === "string" ? parseISO(value) : new Date(value), "yyyy-MM-dd");
  } catch {
    return "";
  }
};

const formatStatusLabel = (value) => {
  const normalized = String(value || "")
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .trim();
  return normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : "Not available";
};

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

const getDocumentSlots = (project) => {
  const pooledDocuments = [];
  if (project?.uploadDocument?.url) {
    pooledDocuments.push({
      name: "Registration Document",
      url: project.uploadDocument.url,
      source: "uploadDocument",
    });
  }
  (project?.otherDocuments || []).forEach((doc) => {
    if (doc?.url) {
      pooledDocuments.push({
        ...doc,
        name: doc.name || getFileNameFromUrl(doc.url),
        source: "otherDocuments",
      });
    }
  });

  const usedIndexes = new Set();

  return DOCUMENT_REQUIREMENTS.map((slot) => {
    let matchedDocument = null;

    if (slot.key === "aadhaar" && project?.aadhaar?.url) {
      matchedDocument = { name: "Aadhaar Card", url: project.aadhaar.url, source: "aadhaar" };
    } else if (slot.key === "panCard" && project?.panCard?.url) {
      matchedDocument = { name: "PAN Card", url: project.panCard.url, source: "panCard" };
    } else if (slot.key === "bankStatement" && project?.passbook?.url) {
      matchedDocument = { name: "Bank Passbook", url: project.passbook.url, source: "passbook" };
    } else if (slot.key === "other") {
      const remainingIndex = pooledDocuments.findIndex((_, docIndex) => !usedIndexes.has(docIndex));
      if (remainingIndex !== -1) {
        usedIndexes.add(remainingIndex);
        matchedDocument = pooledDocuments[remainingIndex];
      }
    } else {
      matchedDocument = pickMatchingDocument(pooledDocuments, slot.aliases, usedIndexes);
    }

    const url = matchedDocument?.url || "";

    return {
      ...slot,
      url,
      previewUrl: isImageDocumentUrl(url) ? toBackendAssetUrl(url) : "",
      fileName: matchedDocument?.name || getFileNameFromUrl(url),
      source: matchedDocument?.source || null,
      uploaded: Boolean(url),
      isImage: isImageDocumentUrl(url),
      isPdf: isPdfDocumentUrl(url),
    };
  });
};

const getUploadedDocuments = (project) =>
  getDocumentSlots(project).filter((requirement) => requirement.uploaded);

const getPersonName = (person) => {
  if (!person) return "";
  if (typeof person === "string") return person;
  return [person.firstName, person.lastName].filter(Boolean).join(" ") || person.name || person.email || "";
};

const getPersonListNames = (people = []) =>
  (Array.isArray(people) ? people : [])
    .map(getPersonName)
    .filter(Boolean);

const getSiteSurvey = (project) =>
  project?.siteSurvey && typeof project.siteSurvey === "object" ? project.siteSurvey : null;

const hasSiteSurveyData = (project) => {
  const siteSurvey = getSiteSurvey(project);
  if (!siteSurvey) return false;
  return Boolean(
    siteSurvey.savedAt ||
      siteSurvey.status ||
      siteSurvey.general ||
      siteSurvey.locationName ||
      siteSurvey.latitude ||
      siteSurvey.longitude ||
      (Array.isArray(siteSurvey.photos) && siteSurvey.photos.length > 0)
  );
};

const formatSurveyValue = (value) => {
  if (Array.isArray(value)) return value.length ? value.join(", ") : "-";
  if (value === null || value === undefined) return "-";
  if (typeof value === "string") return value.trim() || "-";
  return String(value);
};

const getPhotoUrl = (photo) => {
  if (!photo) return "";
  if (typeof photo === "string") return toBackendAssetUrl(photo);
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
};

const getSurveyPhotoUrls = (siteSurvey) =>
  (Array.isArray(siteSurvey?.photos) ? siteSurvey.photos : [])
    .map(getPhotoUrl)
    .filter((url, index, arr) => url && arr.indexOf(url) === index);

const getWorksheetPhotoItems = (project) =>
  (Array.isArray(project?.photos) ? project.photos : [])
    .map((photo, index) => ({
      photo,
      url: getPhotoUrl(photo),
      index,
    }))
    .filter((item) => item.url);

const getGpsMapUrl = (location) => {
  const lat = Number(location?.latitude ?? location?.lat);
  const lng = Number(location?.longitude ?? location?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return "";
  return `https://www.google.com/maps?q=${lat},${lng}`;
};

const getSiteSurveyNotes = (siteSurvey) => {
  const notes = siteSurvey?.remarks || siteSurvey?.notes || siteSurvey?.comment || "";
  const normalized = String(notes || "").trim();
  return normalized.toLowerCase().startsWith("site survey summary") ? "" : normalized;
};

const SITE_SURVEY_FIELDS = [
  ["roofType", "Roof Type"],
  ["roofMaterial", "Roof Material"],
  ["roofCondition", "Roof Condition"],
  ["shadingIssues", "Shading Issues"],
  ["siteAccess", "Site Access"],
  ["mainDistributionBoardLocation", "Main Distribution Board Location"],
  ["earthingAvailable", "Earthing Available"],
  ["phaseType", "Phase Type"],
  ["recommendedPanelBrand", "Recommended Panel Brand"],
  ["recommendedInverterBrand", "Recommended Inverter Brand"],
  ["inverterType", "Inverter Type"],
  ["availableRoofArea", "Available Roof Area (sq ft)"],
  ["usableRoofArea", "Usable Roof Area (sq ft)"],
  ["distanceFromRoofToDb", "Distance from Roof to DB (m)"],
  ["customerExpectations", "Customer Expectations"],
  ["specialRequirements", "Special Requirements"],
  ["challengesConcerns", "Challenges / Concerns"],
];

const getTimelineCategory = (entry = {}) => {
  const text = `${entry.stage || ""} ${entry.notes || ""} ${(entry.changes || [])
    .map((change) => `${change.field || ""} ${change.label || ""}`)
    .join(" ")}`.toLowerCase();

  if (text.includes("document") || text.includes("aadhaar") || text.includes("pan") || text.includes("passbook")) {
    return "documents";
  }
  if (
    text.includes("payment") ||
    text.includes("loan") ||
    text.includes("bank") ||
    text.includes("disbursement") ||
    text.includes("amount")
  ) {
    return "finance";
  }
  if (text.includes("comment") || text.includes("note")) return "comments";
  return "status";
};

const getTimelineTitle = (entry = {}) => {
  const statusChange = (entry.changes || []).find((change) =>
    String(change.field || change.label || "").toLowerCase().includes("status")
  );

  if (statusChange?.oldValue || statusChange?.newValue) {
    return `Status changed from '${formatStatusLabel(statusChange.oldValue)}' to '${formatStatusLabel(statusChange.newValue)}'`;
  }

  return entry.notes || `${entry.stage || "Project"} updated`;
};

const getTimelineTag = (entry = {}, category = "status") => {
  if (category === "documents") return "DOCUMENT_UPDATED";
  if (category === "finance") return "PAYMENT_RECORDED";
  if (category === "comments") return "COMMENT";
  if ((entry.changes || []).some((change) => String(change.field || "").toLowerCase().includes("status"))) {
    return "STATUS_UPDATED";
  }
  return String(entry.stage || "UPDATED").replace(/\s+/g, "_").toUpperCase();
};

const getActivityGroupLabel = (value) => {
  if (!value) return "UNKNOWN";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "UNKNOWN";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const entryDay = new Date(date);
  entryDay.setHours(0, 0, 0, 0);
  const diffDays = Math.round((today - entryDay) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "TODAY";
  if (diffDays === 1) return "YESTERDAY";
  return `${diffDays} DAYS AGO`;
};

const buildProjectActivityEntries = (project) => {
  const entries = [];
  const timelineSources = [
    ...(Array.isArray(project?.stageTimeline) ? project.stageTimeline : []),
    ...(Array.isArray(project?.activityTimeline) ? project.activityTimeline : []),
    ...(Array.isArray(project?.activities) ? project.activities : []),
    ...(Array.isArray(project?.auditLogs) ? project.auditLogs : []),
  ];

  timelineSources.forEach((entry, index) => {
    const category = getTimelineCategory(entry);
    const date = entry.updatedAt || entry.createdAt || entry.date || entry.timestamp;
    entries.push({
      id: entry._id || entry.id || `timeline-${date || index}`,
      title: entry.title || entry.message || getTimelineTitle(entry),
      tag: getTimelineTag(entry, category),
      category,
      actor: getPersonName(entry.updatedBy || entry.user || entry.actor) || entry.updatedRole || entry.role || "",
      date,
    });
  });

  return entries
    .filter((entry) => entry.date)
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
    .filter((entry, index, list) => {
      const key = `${entry.title}-${new Date(entry.date || 0).getTime()}`;
      return list.findIndex((item) => `${item.title}-${new Date(item.date || 0).getTime()}` === key) === index;
    });
};

const MetricCard = ({ icon, label, value, color }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
  <Card
    elevation={0}
    sx={{
      height: "100%",
      borderRadius: RADIUS,
      border: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${BORDER}`,
      bgcolor: isDark ? "#0b0e1a" : PANEL, color: isDark ? "#f8fafc" : "inherit",
      boxShadow: SHADOW_SM,
      transition: "box-shadow 0.2s ease, transform 0.2s ease",
      "&:hover": { boxShadow: SHADOW_MD, transform: "translateY(-2px)" },
    }}
  >
    <Stack spacing={1.5} sx={{ p: 2.5 }}>
      <Box
        sx={{
          width: 42,
          height: 42,
          borderRadius: "11px",
          bgcolor: alpha(color, 0.1),
          color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="h6" fontWeight={800} color={isDark ? "#f8fafc" : INK} lineHeight={1.15} letterSpacing="-0.01em">
          {value}
        </Typography>
        <Typography variant="caption" fontWeight={700} sx={{ color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {label}
        </Typography>
      </Box>
    </Stack>
  </Card>
  );
};

const SurveyDetailModal = ({ open, project, onClose, onOpenEditor }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const siteSurvey = getSiteSurvey(project);
  const surveyGeneral = siteSurvey?.general || {};
  const photoUrls = getSurveyPhotoUrls(siteSurvey);
  const siteSurveyNotes = getSiteSurveyNotes(siteSurvey);

  if (!siteSurvey) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
      PaperProps={{
        sx: {
          borderRadius: RADIUS,
          overflow: "hidden",
          boxShadow: SHADOW_LG,
        },
      }}
    >
      <DialogTitle sx={{ px: 3, py: 2.25, borderBottom: `1px solid ${BORDER}`, bgcolor: SURFACE }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
          <Stack direction="row" alignItems="center" spacing={1.25}>
            <Box sx={{ width: 34, height: 34, borderRadius: "9px", bgcolor: alpha(WARNING, 0.12), color: WARNING, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FactCheck sx={{ fontSize: 18 }} />
            </Box>
            <Typography variant="subtitle1" fontWeight={800} color={isDark ? "#f8fafc" : INK} letterSpacing="-0.01em">
              Site Survey Details
            </Typography>
            <Chip
              label={siteSurvey.status || "Completed"}
              size="small"
              sx={{ height: 23, bgcolor: alpha(SUCCESS, 0.12), color: SUCCESS, fontSize: 11, fontWeight: 800 }}
            />
          </Stack>
          <IconButton size="small" onClick={onClose} sx={{ color: MUTED }}>
            <Clear sx={{ fontSize: 20 }} />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Grid container spacing={2} sx={{ p: 2, mb: 2.5, borderRadius: RADIUS_SM, border: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${BORDER}`, bgcolor: SURFACE }}>
          <Grid item xs={12} md={4}>
            <Typography variant="caption" fontWeight={800} sx={{ color: MUTED_2, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Visit Date
            </Typography>
            <Typography variant="body2" fontWeight={800} color={isDark ? "#f8fafc" : INK}>
              {formatDate(siteSurvey.savedAt || project?.visitDate, "dd MMM yyyy")}
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="caption" fontWeight={800} sx={{ color: MUTED_2, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Inspector
            </Typography>
            <Typography variant="body2" fontWeight={800} color={isDark ? "#f8fafc" : INK}>
              {getPersonName(project?.assignedUser || project?.assignedManager) || "Not assigned"}
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="caption" fontWeight={800} sx={{ color: MUTED_2, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Customer
            </Typography>
            <Typography variant="body2" fontWeight={800} color={isDark ? "#f8fafc" : INK}>
              {getCustomerName(project)}
            </Typography>
          </Grid>
        </Grid>

        <Typography variant="caption" fontWeight={800} color={isDark ? "#f8fafc" : INK} sx={{ display: "block", mb: 1.25, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          General
        </Typography>
        <Divider sx={{ mb: 1.5, borderColor: BORDER }} />

        <Grid container spacing={1.5}>
          {SITE_SURVEY_FIELDS.map(([key, label]) => (
            <Grid item xs={12} sm={6} md={3} key={key}>
              <Stack
                direction="row"
                spacing={1.5}
                sx={{
                  minHeight: 74,
                  p: 1.5,
                  borderRadius: RADIUS_SM,
                  border: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${BORDER}`,
                  bgcolor: isDark ? "#0b0e1a" : PANEL, color: isDark ? "#f8fafc" : "inherit",
                }}
              >
                <Box
                  sx={{
                    width: 34,
                    height: 34,
                    flexShrink: 0,
                    borderRadius: "9px",
                    bgcolor: alpha(WARNING, 0.1),
                    color: WARNING,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {["availableRoofArea", "usableRoofArea", "distanceFromRoofToDb"].includes(key) ? (
                    <Typography variant="caption" fontWeight={800}>#</Typography>
                  ) : (
                    <Edit sx={{ fontSize: 15 }} />
                  )}
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="caption" fontWeight={800} sx={{ color: MUTED_2, textTransform: "uppercase", lineHeight: 1.2, letterSpacing: "0.03em" }}>
                    {label}
                  </Typography>
                  <Typography variant="body2" fontWeight={800} color={isDark ? "#f8fafc" : INK} sx={{ mt: 0.45, wordBreak: "break-word" }}>
                    {formatSurveyValue(surveyGeneral[key])}
                  </Typography>
                </Box>
              </Stack>
            </Grid>
          ))}
          <Grid item xs={12} sm={6} md={3}>
            <Stack direction="row" spacing={1.5} sx={{ minHeight: 74, p: 1.5, borderRadius: RADIUS_SM, border: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${BORDER}`, bgcolor: PANEL }}>
              <Box sx={{ width: 34, height: 34, flexShrink: 0, borderRadius: "9px", bgcolor: alpha(WARNING, 0.1), color: WARNING, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Typography variant="caption" fontWeight={800}>#</Typography>
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" fontWeight={800} sx={{ color: MUTED_2, textTransform: "uppercase", lineHeight: 1.2, letterSpacing: "0.03em" }}>
                  GPS Longitude
                </Typography>
                <Typography variant="body2" fontWeight={800} color={isDark ? "#f8fafc" : INK} sx={{ mt: 0.45 }}>
                  {formatSurveyValue(siteSurvey.longitude)}
                </Typography>
              </Box>
            </Stack>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Stack direction="row" spacing={1.5} sx={{ minHeight: 74, p: 1.5, borderRadius: RADIUS_SM, border: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${BORDER}`, bgcolor: PANEL }}>
              <Box sx={{ width: 34, height: 34, flexShrink: 0, borderRadius: "9px", bgcolor: alpha(WARNING, 0.1), color: WARNING, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Typography variant="caption" fontWeight={800}>#</Typography>
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" fontWeight={800} sx={{ color: MUTED_2, textTransform: "uppercase", lineHeight: 1.2, letterSpacing: "0.03em" }}>
                  GPS Latitude
                </Typography>
                <Typography variant="body2" fontWeight={800} color={isDark ? "#f8fafc" : INK} sx={{ mt: 0.45 }}>
                  {formatSurveyValue(siteSurvey.latitude)}
                </Typography>
              </Box>
            </Stack>
          </Grid>
        </Grid>

        {photoUrls.length > 0 && (
          <Box sx={{ mt: 2.5 }}>
            <Typography variant="caption" fontWeight={800} color={isDark ? "#f8fafc" : INK} sx={{ display: "block", mb: 1.25, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Photos
            </Typography>
            <Stack direction="row" spacing={1.25} flexWrap="wrap" useFlexGap>
              {photoUrls.map((photoUrl, index) => (
                <Box
                  key={`${photoUrl}-${index}`}
                  component="img"
                  src={photoUrl}
                  alt={`Site survey ${index + 1}`}
                  onClick={() => window.open(photoUrl, "_blank", "noopener,noreferrer")}
                  sx={{
                    width: 112,
                    height: 88,
                    borderRadius: RADIUS_SM,
                    objectFit: "cover",
                    cursor: "pointer",
                    border: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${BORDER}`,
                    transition: "transform 0.15s ease",
                    "&:hover": { transform: "scale(1.03)" },
                  }}
                />
              ))}
            </Stack>
          </Box>
        )}

        {siteSurveyNotes && (
          <Box sx={{ mt: 2.5, p: 1.75, borderRadius: RADIUS_SM, border: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${BORDER}`, bgcolor: SURFACE }}>
            <Typography variant="caption" fontWeight={800} sx={{ color: MUTED_2, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Notes
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.75, whiteSpace: "pre-wrap", wordBreak: "break-word", color: INK }}>
              {siteSurveyNotes}
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${BORDER}` }}>
        <Button
          size="small"
          variant="contained"
          startIcon={<LinkIcon sx={{ fontSize: 15 }} />}
          onClick={onOpenEditor}
          sx={{ mr: "auto", borderRadius: RADIUS_SM, bgcolor: "#EEF1F6", color: INK, boxShadow: "none", fontWeight: 800, textTransform: "none", "&:hover": { bgcolor: "#E3E7EF", boxShadow: "none" } }}
        >
          Open full editor
        </Button>
        <Button size="small" variant="outlined" onClick={onClose} sx={{ borderRadius: RADIUS_SM, borderColor: BORDER, color: INK, textTransform: "none", fontWeight: 700 }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const SummaryWorkspace = ({ project, onGoToStage, onOpenSurveyEditor }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [surveyOpen, setSurveyOpen] = useState(false);
  const [activityFilter, setActivityFilter] = useState("all");
  const siteSurveyReady = hasSiteSurveyData(project);
  const activityEntries = useMemo(() => buildProjectActivityEntries(project), [project]);
  const filteredActivityEntries = useMemo(
    () => activityFilter === "all" ? activityEntries : activityEntries.filter((entry) => entry.category === activityFilter),
    [activityEntries, activityFilter]
  );
  const groupedEntries = useMemo(
    () =>
      filteredActivityEntries.reduce((acc, entry) => {
        const label = getActivityGroupLabel(entry.date);
        if (!acc[label]) acc[label] = [];
        acc[label].push(entry);
        return acc;
      }, {}),
    [filteredActivityEntries]
  );
  const installerName = getPersonName(project?.siteInstaller || project?.assignedInstaller || project?.installationUser);
  const isWorksheetProject = project?.source === "installerWorksheet";
  const createdByName = project?.createdByName || getPersonName(project?.assignedManager);
  const supervisorName = project?.supervisorName || getPersonName(project?.assignedUser);
  const teammateNames = getPersonListNames(project?.teammates);
  const worksheetPhotos = getWorksheetPhotoItems(project);
  const worksheetGpsUrl = getGpsMapUrl(project?.gpsLocation);
  const worksheetFields = [
    { label: "Customer Name", value: project?.consumerName || [project?.firstName, project?.lastName].filter(Boolean).join(" ") },
    { label: "Project Type", value: project?.projectType || project?.leadType || project?.requirementType },
    { label: "Capacity", value: project?.capacity || (project?.capacityKw ? `${project.capacityKw} KW` : "") || project?.plantCapacity },
    { label: "Installation Day", value: project?.installationDay ? `Day ${project.installationDay}` : "" },
    { label: "Section", value: project?.section || project?.ulaSection || project?.city },
    { label: "Consumer A/C No.", value: project?.consumerAccountNo },
    { label: "Contact Number", value: project?.contactNo || project?.phone || project?.phoneNumber },
    { label: "Address", value: project?.address || project?.siteLocation || project?.gpsLocation?.address, wide: true },
  ];
  const statusLabel = formatStatusLabel(project?.status || project?.registrationStatus);
  const activityFilters = [
    { key: "all", label: "All" },
    { key: "status", label: "Status" },
    { key: "documents", label: "Documents" },
    { key: "finance", label: "Finance" },
    { key: "comments", label: "Comments" },
  ];

  return (
    <Stack spacing={2.5}>
      <Paper elevation={0} sx={{ p: 3, borderRadius: RADIUS, border: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${BORDER}`, bgcolor: isDark ? "#0b0e1a" : PANEL, color: isDark ? "#f8fafc" : "inherit", boxShadow: SHADOW_SM }}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={2} sx={{ mb: 3 }}>
          <Stack direction="row" spacing={1.25} alignItems="center">
            <InfoOutlined sx={{ fontSize: 20, color: BRAND }} />
            <Typography variant="h6" fontWeight={800} color={isDark ? "#f8fafc" : INK} letterSpacing="-0.01em">
              Project Details
            </Typography>
          </Stack>
          <Tooltip title={siteSurveyReady ? "View site survey details" : "No site survey created for this project"}>
            <span>
              <Button
                variant="outlined"
                startIcon={<FactCheck sx={{ fontSize: 17 }} />}
                onClick={() => setSurveyOpen(true)}
                disabled={!siteSurveyReady}
                sx={{ borderRadius: RADIUS_SM, borderColor: BORDER, color: INK, fontWeight: 700, textTransform: "none", "&:hover": { borderColor: alpha(BRAND, 0.4), bgcolor: alpha(BRAND, 0.04) } }}
              >
                Site Survey
              </Button>
            </span>
          </Tooltip>
        </Stack>

        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Stack spacing={3}>
              <Box>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.8 }}>
                  <Typography variant="body2" fontWeight={800} sx={{ color: MUTED_2 }}>#</Typography>
                  <Typography variant="caption" fontWeight={800} sx={{ color: MUTED_2, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Project Code
                  </Typography>
                </Stack>
                <Typography variant="subtitle1" fontWeight={800} color={isDark ? "#f8fafc" : INK}>
                  {project?.projectCode || project?.leadId || project?._id?.slice(-8) || "Not set"}
                </Typography>
              </Box>

              <Box>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.8 }}>
                  <TaskAlt sx={{ fontSize: 17, color: MUTED_2 }} />
                  <Typography variant="caption" fontWeight={800} sx={{ color: MUTED_2, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Status
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip
                    label={statusLabel}
                    size="small"
                    sx={{ height: 28, borderRadius: "6px", bgcolor: alpha(BRAND, 0.1), color: BRAND, fontSize: 13, fontWeight: 800 }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => onGoToStage?.(normalizeProjectStage(project))}
                    sx={{ width: 30, height: 30, border: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${BORDER}`, borderRadius: RADIUS_SM, color: INK, "&:hover": { borderColor: alpha(BRAND, 0.4), bgcolor: alpha(BRAND, 0.04) } }}
                  >
                    <Edit sx={{ fontSize: 15 }} />
                  </IconButton>
                </Stack>
              </Box>

              <Box>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.8 }}>
                  <CalendarMonth sx={{ fontSize: 17, color: MUTED_2 }} />
                  <Typography variant="caption" fontWeight={800} sx={{ color: MUTED_2, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Created
                  </Typography>
                </Stack>
                <Typography variant="subtitle1" fontWeight={800} color={isDark ? "#f8fafc" : INK}>
                  {formatDate(project?.projectConvertedAt || project?.createdAt)}
                </Typography>
              </Box>
            </Stack>
          </Grid>

          <Grid item xs={12} md={6}>
            <Stack spacing={3}>
              {isWorksheetProject && (
                <>
                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.8 }}>
                      <Workspaces sx={{ fontSize: 17, color: MUTED_2 }} />
                      <Typography variant="caption" fontWeight={800} sx={{ color: MUTED_2, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        Created By
                      </Typography>
                    </Stack>
                    <Typography variant="subtitle1" fontWeight={700} sx={{ color: createdByName ? INK : MUTED_2 }}>
                      {createdByName || "Not available"}
                    </Typography>
                  </Box>

                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.8 }}>
                      <Build sx={{ fontSize: 17, color: MUTED_2 }} />
                      <Typography variant="caption" fontWeight={800} sx={{ color: MUTED_2, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        Supervisor
                      </Typography>
                    </Stack>
                    <Typography variant="subtitle1" fontWeight={700} sx={{ color: supervisorName ? INK : MUTED_2 }}>
                      {supervisorName || "Not assigned"}
                    </Typography>
                  </Box>

                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.8 }}>
                      <TaskAlt sx={{ fontSize: 17, color: MUTED_2 }} />
                      <Typography variant="caption" fontWeight={800} sx={{ color: MUTED_2, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        Team Members
                      </Typography>
                    </Stack>
                    {teammateNames.length > 0 ? (
                      <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                        {teammateNames.map((name) => (
                          <Chip
                            key={name}
                            label={name}
                            size="small"
                            sx={{ borderRadius: "6px", bgcolor: alpha(BRAND, 0.08), color: INK, fontWeight: 700 }}
                          />
                        ))}
                      </Stack>
                    ) : (
                      <Typography variant="subtitle1" fontWeight={700} sx={{ color: MUTED_2 }}>
                        No team members added
                      </Typography>
                    )}
                  </Box>
                </>
              )}

              {!isWorksheetProject && (
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.8 }}>
                    <Build sx={{ fontSize: 17, color: MUTED_2 }} />
                    <Typography variant="caption" fontWeight={800} sx={{ color: MUTED_2, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Site Installer
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1.25} alignItems="center" flexWrap="wrap" useFlexGap>
                    <Typography variant="subtitle1" fontWeight={700} sx={{ color: installerName ? INK : MUTED_2 }}>
                      {installerName || "Not assigned"}
                    </Typography>
                    {!installerName && (
                      <Button
                        size="small"
                        onClick={() => onGoToStage?.("installation")}
                        startIcon={<Typography component="span" fontWeight={800}>+</Typography>}
                        sx={{ minWidth: 0, px: 1.25, py: 0.5, borderRadius: "6px", bgcolor: alpha(WARNING, 0.1), color: WARNING, fontWeight: 800, textTransform: "none" }}
                      >
                        Assign
                      </Button>
                    )}
                  </Stack>
                </Box>
              )}
            </Stack>
          </Grid>
        </Grid>

        {isWorksheetProject && (
          <>
            <Divider sx={{ my: 3, borderColor: BORDER_SOFT }} />

            <Stack spacing={2.5}>
              <Box>
                <Typography variant="subtitle2" fontWeight={900} color={isDark ? "#f8fafc" : INK} sx={{ mb: 1.5 }}>
                  Customer & Installation Details
                </Typography>
                <Grid container spacing={1.5}>
                  {worksheetFields.map((field) => (
                    <Grid item xs={12} sm={field.wide ? 12 : 6} md={field.wide ? 12 : 3} key={field.label}>
                      <Box sx={{ p: 1.5, borderRadius: RADIUS_SM, border: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${BORDER}`, bgcolor: isDark ? "#0e1220" : SURFACE, minHeight: 78 }}>
                        <Typography variant="caption" fontWeight={800} sx={{ color: MUTED_2, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          {field.label}
                        </Typography>
                        <Typography variant="body2" fontWeight={800} color={field.value ? INK : MUTED_2} sx={{ mt: 0.75, wordBreak: "break-word" }}>
                          {field.value || "Not available"}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>

              <Box>
                <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={1.5} sx={{ mb: 1.5 }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <PhotoCameraOutlined sx={{ fontSize: 18, color: MUTED_2 }} />
                    <Typography variant="subtitle2" fontWeight={900} color={isDark ? "#f8fafc" : INK}>
                      Geo Tagged Photos
                    </Typography>
                    <Chip label={`${worksheetPhotos.length} photo${worksheetPhotos.length === 1 ? "" : "s"}`} size="small" sx={{ height: 22, borderRadius: "6px", bgcolor: alpha(BRAND, 0.08), color: BRAND, fontWeight: 800 }} />
                  </Stack>
                  {worksheetGpsUrl && (
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<LocationOn sx={{ fontSize: 16 }} />}
                      onClick={() => window.open(worksheetGpsUrl, "_blank", "noopener,noreferrer")}
                      sx={{ borderRadius: RADIUS_SM, textTransform: "none", fontWeight: 800, borderColor: BORDER, color: INK }}
                    >
                      Open GPS Location
                    </Button>
                  )}
                </Stack>

                {worksheetPhotos.length > 0 ? (
                  <Stack direction="row" spacing={1.25} flexWrap="wrap" useFlexGap>
                    {worksheetPhotos.map(({ photo, url, index }) => {
                      const photoGpsUrl = getGpsMapUrl(photo);
                      return (
                        <Box key={`${url}-${index}`} sx={{ width: 148, border: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${BORDER}`, borderRadius: RADIUS_SM, overflow: "hidden", bgcolor: PANEL }}>
                          <Box
                            component="img"
                            src={url}
                            alt={`Geo tagged project photo ${index + 1}`}
                            onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
                            sx={{ width: "100%", aspectRatio: "4 / 3", objectFit: "cover", display: "block", cursor: "pointer", bgcolor: SURFACE }}
                          />
                          <Stack spacing={0.5} sx={{ p: 1 }}>
                            <Typography variant="caption" fontWeight={800} color={isDark ? "#f8fafc" : INK}>
                              Photo {index + 1}
                            </Typography>
                            <Typography variant="caption" color={isDark ? "#94a3b8" : MUTED} sx={{ lineHeight: 1.35 }}>
                              {photo?.capturedAt ? formatDate(photo.capturedAt, "dd MMM yyyy, hh:mm a") : "Capture time not available"}
                            </Typography>
                            {photoGpsUrl && (
                              <Button
                                size="small"
                                startIcon={<LocationOn sx={{ fontSize: 14 }} />}
                                onClick={() => window.open(photoGpsUrl, "_blank", "noopener,noreferrer")}
                                sx={{ alignSelf: "flex-start", minWidth: 0, p: 0, color: BRAND, fontSize: 12, fontWeight: 800, textTransform: "none" }}
                              >
                                Map
                              </Button>
                            )}
                          </Stack>
                        </Box>
                      );
                    })}
                  </Stack>
                ) : (
                  <Box sx={{ p: 2, borderRadius: RADIUS_SM, border: `1px dashed ${BORDER}`, bgcolor: SURFACE }}>
                    <Typography variant="body2" color={MUTED_2} fontWeight={700}>
                      No geo tagged photos uploaded for this project.
                    </Typography>
                  </Box>
                )}
              </Box>
            </Stack>
          </>
        )}
      </Paper>

      <Paper elevation={0} sx={{ p: 3, borderRadius: RADIUS, border: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${BORDER}`, bgcolor: isDark ? "#0b0e1a" : PANEL, color: isDark ? "#f8fafc" : "inherit", boxShadow: SHADOW_SM }}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }} spacing={2} sx={{ mb: 2.5 }}>
          <Stack direction="row" spacing={1.25} alignItems="center">
            <AccessTime sx={{ fontSize: 20, color: BRAND }} />
            <Typography variant="h6" fontWeight={800} color={isDark ? "#f8fafc" : INK} letterSpacing="-0.01em">
              Activity Timeline
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {activityFilters.map((filter) => {
              const active = activityFilter === filter.key;
              return (
                <Button
                  key={filter.key}
                  size="small"
                  onClick={() => setActivityFilter(filter.key)}
                  sx={{
                    minWidth: 0,
                    px: 2,
                    borderRadius: "999px",
                    color: active ? BRAND : "#475569",
                    bgcolor: active ? alpha(BRAND, 0.08) : "#F1F4F9",
                    border: `1px solid ${active ? alpha(BRAND, 0.3) : "transparent"}`,
                    fontWeight: 800,
                    textTransform: "none",
                  }}
                >
                  {filter.label}
                </Button>
              );
            })}
          </Stack>
        </Stack>

        {Object.entries(groupedEntries).length > 0 ? (
          <Stack spacing={2.5}>
            {Object.entries(groupedEntries).map(([groupLabel, entries]) => (
              <Box key={groupLabel}>
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5 }}>
                  <Typography variant="caption" fontWeight={800} sx={{ color: MUTED_2, minWidth: 92, letterSpacing: "0.04em" }}>
                    {groupLabel}
                  </Typography>
                  <Divider sx={{ flex: 1, borderColor: BORDER }} />
                </Stack>
                <Stack spacing={2}>
                  {entries.map((entry) => (
                    <Stack key={entry.id} direction="row" spacing={2} alignItems="flex-start">
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: "50%",
                          bgcolor: alpha(BRAND, 0.08),
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: BRAND,
                          flexShrink: 0,
                        }}
                      >
                        <TaskAlt sx={{ fontSize: 18 }} />
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Stack direction="row" spacing={1.25} alignItems="center" flexWrap="wrap" useFlexGap>
                          <Typography variant="subtitle2" fontWeight={800} color={isDark ? "#f8fafc" : INK} sx={{ wordBreak: "break-word" }}>
                            {entry.title}
                          </Typography>
                          <Chip
                            label={entry.tag}
                            size="small"
                            sx={{ height: 21, bgcolor: "#EEF1F6", color: "#475569", fontSize: 10.5, fontWeight: 800 }}
                          />
                        </Stack>
                        <Typography variant="body2" sx={{ color: MUTED, mt: 0.4 }}>
                          {entry.actor || "System"} · {formatDate(entry.date, "dd MMM, hh:mm a")}
                        </Typography>
                      </Box>
                    </Stack>
                  ))}
                </Stack>
              </Box>
            ))}
          </Stack>
        ) : (
          <Typography variant="body2" sx={{ color: MUTED_2, py: 3, textAlign: "center" }}>
            No activity available.
          </Typography>
        )}
      </Paper>

      <SurveyDetailModal
        open={surveyOpen}
        project={project}
        onClose={() => setSurveyOpen(false)}
        onOpenEditor={onOpenSurveyEditor}
      />
    </Stack>
  );
};

const workspaceHeaderIcon = (Icon) => (
  <Box sx={{ width: 36, height: 36, borderRadius: "10px", bgcolor: alpha(BRAND, 0.1), color: BRAND, display: "flex", alignItems: "center", justifyContent: "center" }}>
    <Icon sx={{ fontSize: 18 }} />
  </Box>
);

const RegistrationWorkspace = ({
  project,
  formData,
  errors,
  saving,
  onChange,
  onClear,
  onCancel,
  onSave,
  readOnly = false,
  onEdit,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
  <Paper elevation={0} sx={{ p: 2.5, borderRadius: RADIUS, border: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${BORDER}`, bgcolor: isDark ? "#0b0e1a" : PANEL, color: isDark ? "#f8fafc" : "inherit", boxShadow: SHADOW_SM }}>
    <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1.5} sx={{ mb: 2.5 }}>
      <Stack direction="row" spacing={1.5} alignItems="center">
        {workspaceHeaderIcon(FactCheck)}
        <Box>
          <Typography variant="subtitle2" fontWeight={800} color={isDark ? "#f8fafc" : INK}>
            Registration Workspace
          </Typography>
          <Typography variant="caption" sx={{ color: MUTED }}>
            {readOnly ? "Registration details are locked. Click Edit to make changes." : "Fill in the registration details below"}
          </Typography>
        </Box>
      </Stack>
      <Button
        size="small"
        variant="outlined"
        startIcon={readOnly ? <Edit sx={{ fontSize: 16 }} /> : <Clear sx={{ fontSize: 16 }} />}
        onClick={readOnly ? onEdit : onClear}
        sx={{ alignSelf: { xs: "flex-start", sm: "center" }, borderRadius: RADIUS_SM, borderColor: BORDER, color: INK, fontWeight: 700, textTransform: "none" }}
      >
        {readOnly ? "Edit" : "Clear Form"}
      </Button>
    </Stack>

    <Grid container spacing={2}>
      <Grid item xs={12}>
        <TextField
          fullWidth
          multiline
          minRows={2}
          size="small"
          label="Address *"
          placeholder="Enter full address"
          value={formData.address}
          onChange={(event) => onChange("address", event.target.value)}
          disabled={readOnly}
          error={!!errors.address}
          helperText={errors.address}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          size="small"
          label="City *"
          placeholder="Enter city"
          value={formData.city}
          onChange={(event) => onChange("city", event.target.value)}
          disabled={readOnly}
          error={!!errors.city}
          helperText={errors.city}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          size="small"
          label="Pincode *"
          placeholder="Enter pincode"
          value={formData.pincode}
          onChange={(event) => onChange("pincode", event.target.value)}
          disabled={readOnly}
          inputProps={{ maxLength: 6 }}
          error={!!errors.pincode}
          helperText={errors.pincode}
        />
      </Grid>
      <Grid item xs={12}>
        <FormControl fullWidth size="small" error={!!errors.solarRequirement} disabled={readOnly}>
          <InputLabel>Solar Requirement *</InputLabel>
          <Select
            label="Solar Requirement *"
            value={formData.solarRequirement}
            onChange={(event) => onChange("solarRequirement", event.target.value)}
          >
            <MenuItem value="">
              <em>Select solar requirement</em>
            </MenuItem>
            {SOLAR_REQUIREMENT_TYPES.map((type) => (
              <MenuItem key={type} value={type}>{type}</MenuItem>
            ))}
          </Select>
          {errors.solarRequirement && <FormHelperText>{errors.solarRequirement}</FormHelperText>}
        </FormControl>
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          size="small"
          type="date"
          label="Registration Date"
          value={formData.dateOfRegistration}
          onChange={(event) => onChange("dateOfRegistration", event.target.value)}
          disabled={readOnly}
          InputLabelProps={{ shrink: true }}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <FormControl fullWidth size="small" disabled={readOnly}>
          <InputLabel>Registration Status</InputLabel>
          <Select
            label="Registration Status"
            value={formData.registrationStatus}
            onChange={(event) => onChange("registrationStatus", event.target.value)}
          >
            {REGISTRATION_STATUS_OPTIONS.map((status) => (
              <MenuItem key={status.value} value={status.value}>{status.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12}>
        <FormControl fullWidth size="small" disabled={readOnly}>
          <InputLabel>Lead Status</InputLabel>
          <Select
            label="Lead Status"
            value={formData.status}
            onChange={(event) => onChange("status", event.target.value)}
          >
            {LEAD_STATUS_OPTIONS.map((status) => (
              <MenuItem key={status} value={status}>{status}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} md={8}>
        <TextField
          fullWidth
          multiline
          minRows={2}
          size="small"
          label="Registration Notes"
          placeholder="Add notes about this registration..."
          value={formData.registrationNotes}
          disabled={readOnly}
          onChange={(event) => onChange("registrationNotes", event.target.value)}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <Stack direction={{ xs: "column", sm: "row", md: "row" }} spacing={1} sx={{ height: "100%" }} alignItems="flex-end">
          {readOnly ? (
            <Button
              fullWidth
              variant="contained"
              startIcon={<Edit sx={{ fontSize: 16 }} />}
              onClick={onEdit}
              sx={{ borderRadius: RADIUS_SM, bgcolor: BRAND, fontWeight: 800, textTransform: "none", boxShadow: "none", "&:hover": { bgcolor: BRAND_DARK, boxShadow: "none" } }}
            >
              Edit
            </Button>
          ) : (
            <>
              <Button
                fullWidth
                variant="outlined"
                onClick={onCancel}
                sx={{ borderRadius: RADIUS_SM, borderColor: BORDER, color: INK, fontWeight: 700, textTransform: "none" }}
              >
                Cancel
              </Button>
              <Button
                fullWidth
                variant="contained"
                startIcon={<Save sx={{ fontSize: 16 }} />}
                onClick={onSave}
                disabled={saving || !project?._id}
                sx={{ borderRadius: RADIUS_SM, bgcolor: BRAND, fontWeight: 800, textTransform: "none", boxShadow: "none", "&:hover": { bgcolor: BRAND_DARK, boxShadow: "none" } }}
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </>
          )}
        </Stack>
      </Grid>
    </Grid>
  </Paper>
  );
};

const DocumentWorkspace = ({
  project,
  documentSlots,
  documentUploadLinks,
  previewDoc,
  previewImageZoomed,
  uploadingSlotKey,
  onCreateLink,
  onCopyLink,
  onShareLink,
  onUpload,
  onPreview,
  onClosePreview,
  onTogglePreviewZoom,
  onOpenDocument,
  onDownloadDocument,
  onVerify,
  onReject,
  onDelete,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const uploadedCount = documentSlots.filter((slot) => slot.uploaded).length;
  const progress = uploadedCount > 0 ? 100 : 0;

  return (
    <Paper elevation={0} sx={{ p: 2.5, borderRadius: RADIUS, border: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${BORDER}`, bgcolor: isDark ? "#0b0e1a" : PANEL, color: isDark ? "#f8fafc" : "inherit", boxShadow: SHADOW_SM }}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1.5} sx={{ mb: 2.5 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          {workspaceHeaderIcon(DescriptionOutlined)}
          <Box>
            <Typography variant="subtitle2" fontWeight={800} color={isDark ? "#f8fafc" : INK}>
              Documents
            </Typography>
            <Typography variant="caption" sx={{ color: MUTED }}>
              Upload at least one image or file to complete this step and move ahead.
            </Typography>
          </Box>
        </Stack>
        <Button
          size="small"
          variant="outlined"
          startIcon={<LinkIcon sx={{ fontSize: 16 }} />}
          onClick={onCreateLink}
          sx={{ alignSelf: { xs: "flex-start", sm: "center" }, borderRadius: "999px", borderColor: alpha(BRAND, 0.35), color: BRAND, fontWeight: 800, textTransform: "none" }}
        >
          Create upload link
        </Button>
      </Stack>

      {documentUploadLinks.length > 0 && (
        <Stack spacing={1} sx={{ mb: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <LinkIcon sx={{ fontSize: 14, color: MUTED }} />
            <Typography variant="caption" sx={{ color: MUTED, fontWeight: 800 }}>
              Active Upload Links
            </Typography>
          </Stack>
          {documentUploadLinks.map((link) => (
            <Paper key={link} elevation={0} sx={{ px: 1, py: 0.85, borderRadius: 2, border: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${BORDER}`, bgcolor: "#f8fafc" }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <LinkIcon sx={{ fontSize: 14, color: BRAND, flexShrink: 0 }} />
                <Typography
                  variant="caption"
                  sx={{ flex: 1, minWidth: 0, color: "#d94675", fontFamily: "monospace", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                >
                  {link}
                </Typography>
                <IconButton size="small" onClick={() => onCopyLink(link)} sx={{ width: 32, height: 32, borderRadius: 2, bgcolor: "#eaf3ff", color: BRAND }}>
                  <ContentCopy sx={{ fontSize: 15 }} />
                </IconButton>
                <IconButton size="small" onClick={() => onShareLink(link)} sx={{ width: 32, height: 32, borderRadius: 2, bgcolor: "#eafaf1", color: "#16a34a" }}>
                  <WhatsApp sx={{ fontSize: 16 }} />
                </IconButton>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}

      <Stack spacing={0.75} sx={{ mb: 2 }}>
        <Stack direction="row" justifyContent="space-between" spacing={1}>
          <Typography variant="caption" fontWeight={800} sx={{ color: MUTED }}>
            Upload progress
          </Typography>
          <Typography variant="caption" fontWeight={800} sx={{ color: SUCCESS }}>
            {uploadedCount > 0 ? "Step completed" : "1 file required"}
          </Typography>
        </Stack>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 6,
            borderRadius: 999,
            bgcolor: alpha(NEUTRAL, 0.18),
            "& .MuiLinearProgress-bar": { bgcolor: SUCCESS, borderRadius: 999 },
          }}
        />
      </Stack>

      <Chip
        icon={<LocationOn sx={{ fontSize: "15px !important" }} />}
        label="GPS active - photos will be location-stamped"
        size="small"
        sx={{
          mb: 2.5,
          bgcolor: alpha(SUCCESS, 0.1),
          color: SUCCESS,
          fontWeight: 800,
          "& .MuiChip-icon": { color: `${SUCCESS} !important` },
        }}
      />

      <Grid container spacing={1.5}>
        {documentSlots.map((slot) => {
          const uploaded = slot.uploaded;
          const normalizedStatus = String(project?.documentStatus || "").toLowerCase();
          const isVerified = uploaded && ["verified", "approved", "completed", "submitted"].includes(normalizedStatus);
          const isRejected = uploaded && normalizedStatus === "rejected";
          const isPending = uploaded && !isVerified && !isRejected;
          const displayUrl = toBackendAssetUrl(slot.url);

          return (
            <Grid item xs={12} sm={6} lg={3} key={slot.key}>
              <Card
                elevation={0}
                onClick={() => uploaded ? onPreview(slot) : onUpload(slot.key)}
                sx={{
                  height: "100%",
                  borderRadius: RADIUS_SM,
                  border: isVerified ? `1.5px solid ${SUCCESS}` : isRejected ? `1.5px solid ${DANGER}` : `1px solid ${BORDER}`,
                  bgcolor: isDark ? "#0b0e1a" : PANEL, color: isDark ? "#f8fafc" : "inherit",
                  overflow: "hidden",
                  transition: "box-shadow 0.2s ease",
                  cursor: "pointer",
                  "&:hover": { boxShadow: SHADOW_MD },
                }}
              >
                <Stack
                  alignItems="center"
                  justifyContent="center"
                  spacing={0.75}
                  sx={{
                    minHeight: 108,
                    bgcolor: uploaded ? alpha(SUCCESS, 0.06) : alpha(NEUTRAL, 0.08),
                    color: uploaded ? SUCCESS : NEUTRAL,
                    position: "relative",
                    overflow: "hidden",
                    ...(slot.previewUrl ? { backgroundImage: `url(${slot.previewUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : {}),
                  }}
                >
                  {!slot.previewUrl && (
                    <>
                      {slot.isPdf ? <PictureAsPdfOutlined sx={{ fontSize: 28 }} /> : uploaded ? <InsertDriveFileOutlined sx={{ fontSize: 28 }} /> : <PhotoCameraOutlined sx={{ fontSize: 28 }} />}
                      <Typography variant="caption" fontWeight={700}>
                        {uploaded ? "File uploaded" : "No file uploaded"}
                      </Typography>
                    </>
                  )}
                  {isVerified && (
                    <Box sx={{ position: "absolute", top: 8, right: 8, width: 26, height: 26, borderRadius: "50%", bgcolor: SUCCESS, display: "grid", placeItems: "center" }}>
                      <CheckCircle sx={{ fontSize: 15, color: "#fff" }} />
                    </Box>
                  )}
                </Stack>
                <Stack spacing={1.25} sx={{ p: 1.5 }}>
                  <Typography variant="subtitle2" fontWeight={800} color={isDark ? "#f8fafc" : INK} sx={{ lineHeight: 1.2 }}>
                    {slot.label}
                  </Typography>
                  {slot.fileName && (
                    <Typography variant="caption" sx={{ color: MUTED_2 }} noWrap>
                      {slot.fileName}
                    </Typography>
                  )}
                  {uploaded && (
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ flexWrap: "wrap", gap: 0.5 }}>
                      <Chip
                        size="small"
                        icon={isVerified ? <CheckCircle sx={{ fontSize: 12 }} /> : <AccessTime sx={{ fontSize: 12 }} />}
                        label={isVerified ? "Verified" : isRejected ? "Rejected" : "Pending"}
                        sx={{
                          height: 22,
                          borderRadius: 99,
                          fontSize: "0.68rem",
                          fontWeight: 800,
                          bgcolor: isVerified ? "#dcfce7" : isRejected ? "#fff1f2" : "#fef9c3",
                          color: isVerified ? SUCCESS : isRejected ? DANGER : "#854d0e",
                          "& .MuiChip-icon": { color: isVerified ? SUCCESS : isRejected ? DANGER : "#854d0e" },
                        }}
                      />
                      <Typography variant="caption" sx={{ color: MUTED_2, fontWeight: 700 }}>
                        {project?.companyName || "SAHOO CONSTRUCTION"}
                      </Typography>
                    </Stack>
                  )}
                  <Divider sx={{ borderColor: BORDER }} />
                  {uploaded ? (
                    <>
                      <Stack direction="row" alignItems="center" spacing={0.75}>
                        {isPending && (
                          <Button size="small" startIcon={<CheckCircle sx={{ fontSize: 13 }} />} onClick={(event) => { event.stopPropagation(); onVerify(slot); }} sx={{ flex: 1, fontSize: "0.7rem", fontWeight: 800, py: 0.8, borderRadius: 1.5, bgcolor: "#f0fdf4", color: SUCCESS, border: "1px solid #bbf7d0" }}>
                            Verify
                          </Button>
                        )}
                        <Button size="small" startIcon={<Clear sx={{ fontSize: 13 }} />} onClick={(event) => { event.stopPropagation(); onReject(slot); }} sx={{ flex: 1, fontSize: "0.7rem", fontWeight: 800, py: 0.8, borderRadius: 1.5, bgcolor: "#fff1f2", color: DANGER, border: "1px solid #fecdd3" }}>
                          Reject
                        </Button>
                        <IconButton size="small" onClick={(event) => { event.stopPropagation(); onDownloadDocument(displayUrl, slot.fileName || slot.label); }} sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: isDark ? "#0e1220" : SURFACE, border: `0.5px solid ${BORDER}` }}>
                          <Download sx={{ fontSize: 14, color: MUTED }} />
                        </IconButton>
                      </Stack>
                      <Stack direction="row" justifyContent="space-around" sx={{ pt: 0.5 }}>
                        <Button size="small" startIcon={<Clear sx={{ fontSize: 13 }} />} onClick={(event) => { event.stopPropagation(); onDelete(slot); }} sx={{ fontSize: "0.7rem", color: DANGER, fontWeight: 700 }}>
                          Delete
                        </Button>
                        <Button size="small" startIcon={<CloudUpload sx={{ fontSize: 13 }} />} onClick={(event) => { event.stopPropagation(); onUpload(slot.key); }} sx={{ fontSize: "0.7rem", color: MUTED, fontWeight: 700 }}>
                          Re-upload
                        </Button>
                      </Stack>
                    </>
                  ) : (
                    <Button
                      fullWidth
                      size="small"
                      variant="outlined"
                      startIcon={<CloudUpload sx={{ fontSize: 16 }} />}
                      disabled={uploadingSlotKey === slot.key}
                      onClick={(event) => { event.stopPropagation(); onUpload(slot.key); }}
                      sx={{
                        borderRadius: "999px",
                        borderStyle: "dashed",
                        borderColor: alpha(BRAND, 0.35),
                        color: BRAND,
                        fontWeight: 800,
                        textTransform: "none",
                        bgcolor: alpha(BRAND, 0.02),
                      }}
                    >
                      {uploadingSlotKey === slot.key ? "Uploading..." : "Upload document"}
                    </Button>
                  )}
                </Stack>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Dialog open={Boolean(previewDoc)} onClose={onClosePreview} maxWidth={previewDoc?.isImage ? "lg" : "sm"} fullWidth PaperProps={{ sx: { borderRadius: 3, border: `0.5px solid ${BORDER}`, overflow: "hidden" } }}>
        {previewDoc && (
          <>
            <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 1.75, px: 2.5, borderBottom: `0.5px solid ${BORDER}` }}>
              <Typography variant="body2" sx={{ fontWeight: 800, color: INK, fontSize: "0.85rem" }} noWrap>
                {previewDoc.label}{previewDoc.fileName ? ` - ${previewDoc.fileName}` : ""}
              </Typography>
              <IconButton size="small" onClick={onClosePreview} sx={{ width: 28, height: 28, borderRadius: 1.5, border: `0.5px solid ${BORDER}`, bgcolor: SURFACE }}>
                <Clear sx={{ fontSize: 15 }} />
              </IconButton>
            </DialogTitle>
            <DialogContent sx={{ p: 0 }}>
              {previewDoc.isImage && previewDoc.url ? (
                <Box sx={{ maxHeight: previewImageZoomed ? "78vh" : "68vh", overflow: "auto", bgcolor: "#0b1220", display: "flex", alignItems: "center", justifyContent: "center", p: previewImageZoomed ? 2 : 0 }}>
                  <Box
                    component="img"
                    src={toBackendAssetUrl(previewDoc.url)}
                    alt={previewDoc.label}
                    onClick={onTogglePreviewZoom}
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
              ) : (
                <Box sx={{ height: 280, bgcolor: isDark ? "#0e1220" : SURFACE, display: "grid", placeItems: "center" }}>
                  <Stack alignItems="center" spacing={1}>
                    {previewDoc.isPdf ? <PictureAsPdfOutlined sx={{ fontSize: 48, color: MUTED_2 }} /> : <InsertDriveFileOutlined sx={{ fontSize: 48, color: MUTED_2 }} />}
                    <Typography variant="caption" sx={{ color: MUTED_2 }}>Preview not available</Typography>
                  </Stack>
                </Box>
              )}
            </DialogContent>
            <DialogActions sx={{ px: 2.5, py: 1.75, borderTop: `0.5px solid ${BORDER}`, gap: 1 }}>
              {previewDoc.isImage ? (
                <Typography variant="caption" sx={{ color: MUTED_2, flex: 1 }}>
                  Click image to {previewImageZoomed ? "zoom out" : "zoom in"}
                </Typography>
              ) : <Box sx={{ flex: 1 }} />}
              <Button onClick={onClosePreview} sx={{ borderRadius: 2, border: `0.5px solid ${BORDER}`, color: MUTED, fontSize: "0.8rem", fontWeight: 700 }}>Close</Button>
              <Button startIcon={<Download sx={{ fontSize: 14 }} />} onClick={() => onDownloadDocument(toBackendAssetUrl(previewDoc.url), previewDoc.fileName)} sx={{ borderRadius: 2, border: `0.5px solid ${BORDER}`, bgcolor: isDark ? "#0e1220" : SURFACE, color: INK, fontSize: "0.8rem", fontWeight: 700 }}>Download</Button>
              <Button variant="contained" startIcon={<OpenInNew sx={{ fontSize: 14 }} />} onClick={() => onOpenDocument(toBackendAssetUrl(previewDoc.url))} sx={{ borderRadius: 2, bgcolor: BRAND, color: "#fff", fontSize: "0.8rem", fontWeight: 800, boxShadow: "none" }}>Open in new tab</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Paper>
  );
};

const PaymentWorkspace = ({
  project,
  formData,
  errors,
  saving,
  onChange,
  onClear,
  onCancel,
  onSave,
  readOnly = false,
  onEdit,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const paymentType = formData.paymentType || "Bank Loan";
  const isCash = paymentType === "Cash";
  const isBankLoan = paymentType === "Bank Loan";
  const isOnlineTransfer = paymentType === "Online Transfer";
  const isCheque = paymentType === "Cheque";
  const moneyAdornment = {
    startAdornment: (
      <InputAdornment position="start">
        <CurrencyRupee sx={{ fontSize: 16 }} />
      </InputAdornment>
    ),
  };

  return (
    <Paper elevation={0} sx={{ p: 2.5, borderRadius: RADIUS, border: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${BORDER}`, bgcolor: isDark ? "#0b0e1a" : PANEL, color: isDark ? "#f8fafc" : "inherit", boxShadow: SHADOW_SM }}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1.5} sx={{ mb: 2.5 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          {workspaceHeaderIcon(Payments)}
          <Box>
            <Typography variant="subtitle2" fontWeight={800} color={isDark ? "#f8fafc" : INK}>
              Payment Workspace
            </Typography>
            <Typography variant="caption" sx={{ color: MUTED }}>
              {isCash
                ? "Cash payments move directly to Disbursement after saving"
                : isBankLoan
                  ? "Bank loan payments move through Loan Pending before Disbursement"
                  : "Fill in only the payment fields required for this payment type"}
            </Typography>
          </Box>
        </Stack>
        <Button
          size="small"
          variant="outlined"
          startIcon={readOnly ? <Edit sx={{ fontSize: 16 }} /> : <Clear sx={{ fontSize: 16 }} />}
        onClick={readOnly ? onEdit : onClear}
          sx={{ alignSelf: { xs: "flex-start", sm: "center" }, borderRadius: RADIUS_SM, borderColor: BORDER, color: INK, fontWeight: 700, textTransform: "none" }}
        >
        {readOnly ? "Edit" : "Clear Form"}
      </Button>
      </Stack>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth size="small">
            <InputLabel>Payment Type</InputLabel>
            <Select
              label="Payment Type"
              value={paymentType}
              onChange={(event) => onChange("paymentType", event.target.value)}
            >
              {PAYMENT_TYPE_OPTIONS.map((type) => (
                <MenuItem key={type} value={type}>
                  {type === "Online Transfer" ? "Online Transfer (UPI/NEFT/RTGS/IMPS)" : type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {isCash && (
          <>
            <Grid item xs={12} md={6}>
              <TextField fullWidth size="small" type="number" label="Payment Amount *" value={formData.paymentAmount} onChange={(event) => onChange("paymentAmount", event.target.value)} error={!!errors.paymentAmount} helperText={errors.paymentAmount} InputProps={moneyAdornment} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth size="small" type="date" label="Payment Date *" value={formData.paymentDate} onChange={(event) => onChange("paymentDate", event.target.value)} error={!!errors.paymentDate} helperText={errors.paymentDate} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth size="small" label="Payment Reference" value={formData.paymentReference} onChange={(event) => onChange("paymentReference", event.target.value)} />
            </Grid>
          </>
        )}

        {isBankLoan && (
          <>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small" error={!!errors.bank}>
                <InputLabel>Bank *</InputLabel>
                <Select label="Bank *" value={formData.bank} onChange={(event) => onChange("bank", event.target.value)}>
                  <MenuItem value=""><em>Select Bank</em></MenuItem>
                  {BANK_LIST.map((bank) => <MenuItem key={bank} value={bank}>{bank}</MenuItem>)}
                </Select>
                {errors.bank && <FormHelperText>{errors.bank}</FormHelperText>}
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth size="small" label="Branch *" value={formData.branchName} onChange={(event) => onChange("branchName", event.target.value)} error={!!errors.branchName} helperText={errors.branchName} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth size="small" type="number" label="Loan Amount *" value={formData.loanAmount} onChange={(event) => onChange("loanAmount", event.target.value)} error={!!errors.loanAmount} helperText={errors.loanAmount} InputProps={moneyAdornment} />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Loan Status</InputLabel>
                <Select label="Loan Status" value={formData.loanStatus} onChange={(event) => onChange("loanStatus", event.target.value)}>
                  {LOAN_STATUS_OPTIONS.map((status) => <MenuItem key={status.value} value={status.value}>{status.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth size="small" type="date" label="Loan Approval Date" value={formData.loanApprovalDate} onChange={(event) => onChange("loanApprovalDate", event.target.value)} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth size="small" label="Loan Reference Number" value={formData.loanReferenceNumber} onChange={(event) => onChange("loanReferenceNumber", event.target.value)} />
            </Grid>
          </>
        )}

        {isOnlineTransfer && (
          <>
            <Grid item xs={12} md={6}>
              <TextField fullWidth size="small" type="number" label="Payment Amount *" value={formData.paymentAmount} onChange={(event) => onChange("paymentAmount", event.target.value)} error={!!errors.paymentAmount} helperText={errors.paymentAmount} InputProps={moneyAdornment} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth size="small" type="date" label="Payment Date *" value={formData.paymentDate} onChange={(event) => onChange("paymentDate", event.target.value)} error={!!errors.paymentDate} helperText={errors.paymentDate} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth size="small" label="Transaction ID (UTR) *" value={formData.transactionId} onChange={(event) => onChange("transactionId", event.target.value)} error={!!errors.transactionId} helperText={errors.transactionId} />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Payment Status</InputLabel>
                <Select label="Payment Status" value={formData.paymentStatus} onChange={(event) => onChange("paymentStatus", event.target.value)}>
                  {PAYMENT_STATUS_OPTIONS.map((status) => <MenuItem key={status.value} value={status.value}>{status.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
          </>
        )}

        {isCheque && (
          <>
            <Grid item xs={12} md={6}>
              <TextField fullWidth size="small" label="Cheque Number *" value={formData.chequeNumber} onChange={(event) => onChange("chequeNumber", event.target.value)} error={!!errors.chequeNumber} helperText={errors.chequeNumber} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth size="small" label="Bank Name *" value={formData.bank} onChange={(event) => onChange("bank", event.target.value)} error={!!errors.bank} helperText={errors.bank} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth size="small" type="date" label="Cheque Date *" value={formData.chequeDate} onChange={(event) => onChange("chequeDate", event.target.value)} error={!!errors.chequeDate} helperText={errors.chequeDate} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth size="small" type="number" label="Payment Amount *" value={formData.paymentAmount} onChange={(event) => onChange("paymentAmount", event.target.value)} error={!!errors.paymentAmount} helperText={errors.paymentAmount} InputProps={moneyAdornment} />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Payment Status</InputLabel>
                <Select label="Payment Status" value={formData.paymentStatus} onChange={(event) => onChange("paymentStatus", event.target.value)}>
                  {PAYMENT_STATUS_OPTIONS.map((status) => <MenuItem key={status.value} value={status.value}>{status.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
          </>
        )}

        <Grid item xs={12} md={6}>
          <TextField fullWidth multiline minRows={2} size="small" label="Notes" value={formData.loanNotes} onChange={(event) => onChange("loanNotes", event.target.value)} placeholder="Add any comments or notes about this payment..." />
        </Grid>

        <Grid item xs={12}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="flex-end">
            <Button variant="outlined" onClick={onCancel} sx={{ minWidth: 120, borderRadius: RADIUS_SM, borderColor: BORDER, color: INK, fontWeight: 700, textTransform: "none" }}>
              Cancel
            </Button>
            <Button variant="contained" startIcon={<Save sx={{ fontSize: 16 }} />} onClick={onSave} disabled={saving || !project?._id} sx={{ minWidth: 150, borderRadius: RADIUS_SM, bgcolor: BRAND, fontWeight: 800, textTransform: "none", boxShadow: "none", "&:hover": { bgcolor: BRAND_DARK, boxShadow: "none" } }}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </Stack>
        </Grid>
      </Grid>
    </Paper>
  );
};

const workflowStatusHeader = (Icon, title, customerName, onCancel, isDark = false) => (
  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 2.5, bgcolor: alpha(BRAND, 0.04), borderBottom: `1px solid ${BORDER}` }}>
    <Stack direction="row" spacing={1.75} alignItems="center">
      <Box sx={{ width: 46, height: 46, borderRadius: "13px", bgcolor: alpha(BRAND, 0.12), color: BRAND, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon sx={{ fontSize: 24 }} />
      </Box>
      <Box>
        <Typography variant="h6" fontWeight={800} color={isDark ? "#f8fafc" : INK} sx={{ lineHeight: 1.15 }} letterSpacing="-0.01em">
          {title}
        </Typography>
        <Typography variant="body2" sx={{ color: MUTED }}>
          {customerName}
        </Typography>
      </Box>
    </Stack>
    <IconButton size="small" onClick={onCancel} sx={{ color: MUTED_2 }}>
      <Clear sx={{ fontSize: 20 }} />
    </IconButton>
  </Stack>
);

const workflowFooter = (onCancel, onSave, saving, savingLabel, disabled) => (
  <Stack direction="row" justifyContent="flex-end" spacing={1.5} sx={{ p: 2.25, borderTop: `1px solid ${BORDER}`, bgcolor: PANEL }}>
    <Button
      variant="outlined"
      onClick={onCancel}
      sx={{ minWidth: 120, borderRadius: RADIUS_SM, borderColor: BORDER, color: INK, fontWeight: 700, textTransform: "none" }}
    >
      Cancel
    </Button>
    <Button
      variant="contained"
      startIcon={<Save sx={{ fontSize: 17 }} />}
      onClick={onSave}
      disabled={disabled}
      sx={{ minWidth: 170, borderRadius: RADIUS_SM, bgcolor: BRAND, fontWeight: 800, textTransform: "none", boxShadow: "none", "&:hover": { bgcolor: BRAND_DARK, boxShadow: "none" } }}
    >
      {saving ? savingLabel : "Update Status"}
    </Button>
  </Stack>
);

const InstallationWorkspace = ({
  project,
  formData,
  errors,
  saving,
  onChange,
  onCancel,
  onSave,
  readOnly = false,
  onEdit,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const currentInstallation =
    INSTALLATION_STATUS_OPTIONS.find((status) => status.value === project?.installationStatus)?.label ||
    formatStatusLabel(project?.installationStatus);
  const currentLead = project?.status || "";

  return (
    <Paper elevation={0} sx={{ borderRadius: RADIUS, border: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${BORDER}`, bgcolor: isDark ? "#0b0e1a" : PANEL, color: isDark ? "#f8fafc" : "inherit", overflow: "hidden", boxShadow: SHADOW_SM }}>
      {workflowStatusHeader(Build, "Update Installation Status", getCustomerName(project), onCancel)}

      <Box sx={{ p: 2.5 }}>
        <Grid container spacing={2} sx={{ mb: 2.5 }}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" fontWeight={800} color={isDark ? "#f8fafc" : INK} sx={{ mb: 0.75 }}>
              Current Installation Status
            </Typography>
            <Chip
              icon={<Payments sx={{ fontSize: "16px !important" }} />}
              label={currentInstallation}
              size="small"
              sx={{ bgcolor: alpha(BRAND, 0.08), color: BRAND, fontWeight: 800, "& .MuiChip-icon": { color: `${BRAND} !important` } }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" fontWeight={800} color={isDark ? "#f8fafc" : INK} sx={{ mb: 0.75 }}>
              Current Lead Status
            </Typography>
            <Chip
              icon={<CheckCircle sx={{ fontSize: "16px !important" }} />}
              label={currentLead}
              size="small"
              sx={{ bgcolor: alpha(BRAND, 0.08), color: BRAND, fontWeight: 800, "& .MuiChip-icon": { color: `${BRAND} !important` } }}
            />
          </Grid>
        </Grid>

        <Stack spacing={2}>
          <FormControl fullWidth size="small" error={!!errors.installationStatus}>
            <InputLabel>New Installation Status *</InputLabel>
            <Select
              label="New Installation Status *"
              value={formData.installationStatus}
              onChange={(event) => onChange("installationStatus", event.target.value)}
              sx={{ borderRadius: RADIUS_SM }}
            >
              <MenuItem value="">
                <em>Select status</em>
              </MenuItem>
              {INSTALLATION_STATUS_OPTIONS.map((status) => (
                <MenuItem key={status.value} value={status.value}>{status.label}</MenuItem>
              ))}
            </Select>
            {errors.installationStatus && <FormHelperText>{errors.installationStatus}</FormHelperText>}
          </FormControl>

          <FormControl fullWidth size="small">
            <InputLabel>Lead Status *</InputLabel>
            <Select
              label="Lead Status *"
              value={formData.status}
              onChange={(event) => onChange("status", event.target.value)}
              sx={{ borderRadius: RADIUS_SM }}
            >
              {INSTALLATION_LEAD_STATUS_OPTIONS.map((status) => (
                <MenuItem key={status.value} value={status.value}>
                  <Stack direction="row" spacing={1.25} alignItems="center">
                    <CheckCircle sx={{ fontSize: 17, color: BRAND }} />
                    <Box>
                      <Typography variant="body2">{status.label}</Typography>
                      <Typography variant="caption" sx={{ color: MUTED }}>{status.description}</Typography>
                    </Box>
                  </Stack>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            size="small"
            type="date"
            label="Installation Date"
            value={formData.installationDate}
            onChange={(event) => onChange("installationDate", event.target.value)}
            disabled={readOnly}
          InputLabelProps={{ shrink: true }}
          />

          <TextField
            fullWidth
            multiline
            minRows={4}
            size="small"
            label="Installation Notes"
            placeholder="Add notes about this installation..."
            value={formData.installationNotes}
            onChange={(event) => onChange("installationNotes", event.target.value)}
          />

          <Stack direction="row" spacing={1.25} alignItems="center" sx={{ p: 1.75, borderRadius: RADIUS_SM, bgcolor: alpha(BRAND, 0.06), color: INK }}>
            <InfoOutlined sx={{ fontSize: 20, color: BRAND }} />
            <Typography variant="body2">
              When marked as final payment, installation will be considered completed.
            </Typography>
          </Stack>
        </Stack>
      </Box>

      {workflowFooter(onCancel, onSave, saving, "Updating...", saving || !project?._id)}
    </Paper>
  );
};

const DisbursementWorkspace = ({
  project,
  formData,
  errors,
  saving,
  onChange,
  onCancel,
  onSave,
  readOnly = false,
  onEdit,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const currentDisbursement =
    DISBURSEMENT_STATUS_OPTIONS.find((status) => status.value === project?.disbursementStatus)?.label ||
    formatStatusLabel(project?.disbursementStatus);
  const currentLead = project?.status || "";
  const selectedStatus = DISBURSEMENT_STATUS_OPTIONS.find((status) => status.value === formData.disbursementStatus);
  const selectedLead = DISBURSEMENT_LEAD_STATUS_OPTIONS.find((status) => status.value === formData.status);

  return (
    <Paper elevation={0} sx={{ borderRadius: RADIUS, border: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${BORDER}`, bgcolor: isDark ? "#0b0e1a" : PANEL, color: isDark ? "#f8fafc" : "inherit", overflow: "hidden", boxShadow: SHADOW_SM }}>
      {workflowStatusHeader(Payments, "Update Disbursement Status", getCustomerName(project), onCancel)}

      <Box sx={{ p: 2.5 }}>
        <Grid container spacing={2} sx={{ mb: 2.5 }}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" fontWeight={800} color={isDark ? "#f8fafc" : INK} sx={{ mb: 0.75 }}>
              Current Disbursement Status
            </Typography>
            <Chip
              icon={<Payments sx={{ fontSize: "16px !important" }} />}
              label={currentDisbursement}
              size="small"
              sx={{ bgcolor: alpha(BRAND, 0.08), color: BRAND, fontWeight: 800, "& .MuiChip-icon": { color: `${BRAND} !important` } }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" fontWeight={800} color={isDark ? "#f8fafc" : INK} sx={{ mb: 0.75 }}>
              Current Lead Status
            </Typography>
            <Chip
              icon={<Payments sx={{ fontSize: "16px !important" }} />}
              label={currentLead}
              size="small"
              sx={{ bgcolor: alpha(BRAND, 0.08), color: BRAND, fontWeight: 800, "& .MuiChip-icon": { color: `${BRAND} !important` } }}
            />
          </Grid>
        </Grid>

        <Stack spacing={2}>
          <FormControl fullWidth size="small" error={!!errors.disbursementStatus}>
            <InputLabel>New Disbursement Status *</InputLabel>
            <Select
              label="New Disbursement Status *"
              value={formData.disbursementStatus}
              onChange={(event) => onChange("disbursementStatus", event.target.value)}
              sx={{ borderRadius: RADIUS_SM }}
            >
              {DISBURSEMENT_STATUS_OPTIONS.map((status) => (
                <MenuItem key={status.value} value={status.value}>
                  <Stack direction="row" spacing={1.25} alignItems="center">
                    <Payments sx={{ fontSize: 17, color: BRAND }} />
                    <Box>
                      <Typography variant="body2">{status.label}</Typography>
                      <Typography variant="caption" sx={{ color: MUTED }}>{status.description}</Typography>
                    </Box>
                  </Stack>
                </MenuItem>
              ))}
            </Select>
            {errors.disbursementStatus && <FormHelperText>{errors.disbursementStatus}</FormHelperText>}
          </FormControl>

          <FormControl fullWidth size="small" error={!!errors.status}>
            <InputLabel>Lead Status *</InputLabel>
            <Select
              label="Lead Status *"
              value={formData.status}
              onChange={(event) => onChange("status", event.target.value)}
              sx={{ borderRadius: RADIUS_SM }}
            >
              {DISBURSEMENT_LEAD_STATUS_OPTIONS.map((status) => (
                <MenuItem key={status.value} value={status.value}>
                  <Stack direction="row" spacing={1.25} alignItems="center">
                    <Payments sx={{ fontSize: 17, color: BRAND }} />
                    <Box>
                      <Typography variant="body2">{status.label}</Typography>
                      <Typography variant="caption" sx={{ color: MUTED }}>{status.description}</Typography>
                    </Box>
                  </Stack>
                </MenuItem>
              ))}
            </Select>
            {errors.status && <FormHelperText>{errors.status}</FormHelperText>}
          </FormControl>

          {formData.disbursementStatus === "completed" && (
            <Grid container spacing={1.5}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Disbursement Amount *"
                  value={formData.disbursementAmount}
                  onChange={(event) => onChange("disbursementAmount", event.target.value)}
                  error={!!errors.disbursementAmount}
                  helperText={errors.disbursementAmount}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CurrencyRupee sx={{ fontSize: 16 }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Disbursement Date *"
                  value={formData.disbursementDate}
                  onChange={(event) => onChange("disbursementDate", event.target.value)}
                  error={!!errors.disbursementDate}
                  helperText={errors.disbursementDate}
                  disabled={readOnly}
          InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          )}

          <TextField
            fullWidth
            multiline
            minRows={4}
            size="small"
            label="Notes"
            placeholder="Add any remarks or internal notes..."
            value={formData.disbursementNotes}
            onChange={(event) => onChange("disbursementNotes", event.target.value)}
          />

          <Stack direction="row" spacing={1.25} alignItems="center" sx={{ p: 1.75, borderRadius: RADIUS_SM, bgcolor: alpha(BRAND, 0.06), color: INK }}>
            <InfoOutlined sx={{ fontSize: 20, color: BRAND }} />
            <Typography variant="body2">
              Lead remains in → {selectedLead?.label || "Disbursement"} stage
              {selectedStatus ? ` (${selectedStatus.description.toLowerCase()})` : ""}
            </Typography>
          </Stack>
        </Stack>
      </Box>

      {workflowFooter(onCancel, onSave, saving, "Updating...", saving || !project?._id)}
    </Paper>
  );
};

const LoanPendingWorkspace = ({
  project,
  formData,
  errors,
  saving,
  onChange,
  onCancel,
  onSave,
  readOnly = false,
  onEdit,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const currentBank =
    BANK_STATUS_OPTIONS.find((status) => status.value === project?.bankAtPendingStatus)?.label ||
    formatStatusLabel(project?.bankAtPendingStatus);
  const currentBankDescription =
    BANK_STATUS_OPTIONS.find((status) => status.value === project?.bankAtPendingStatus)?.description ||
    "No bank status details available";
  const currentLead = project?.status || "";
  const currentLeadDescription =
    BANK_LEAD_STATUS_OPTIONS.find((status) => status.value === currentLead)?.description ||
    "No lead status details available";
  const selectedLead =
    BANK_LEAD_STATUS_OPTIONS.find((status) => status.value === formData.status) || BANK_LEAD_STATUS_OPTIONS[0];

  return (
    <Paper elevation={0} sx={{ borderRadius: RADIUS, border: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${BORDER}`, bgcolor: isDark ? "#0b0e1a" : PANEL, color: isDark ? "#f8fafc" : "inherit", overflow: "hidden", boxShadow: SHADOW_SM }}>
      {workflowStatusHeader(AccountBalance, "Update Bank Status", getCustomerName(project), onCancel)}

      <Box sx={{ p: 2.5 }}>
        <Stack spacing={2.5}>
          <Box>
            <Typography variant="subtitle2" fontWeight={800} color={isDark ? "#f8fafc" : INK} sx={{ mb: 0.75 }}>
              Current Bank Status
            </Typography>
            <Chip
              icon={<AccountBalance sx={{ fontSize: "16px !important" }} />}
              label={currentBank}
              size="small"
              sx={{ bgcolor: alpha(BRAND, 0.08), color: BRAND, fontWeight: 800, "& .MuiChip-icon": { color: `${BRAND} !important` } }}
            />
            <Typography variant="body2" sx={{ color: MUTED, mt: 1 }}>
              {currentBankDescription}
            </Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" fontWeight={800} color={isDark ? "#f8fafc" : INK} sx={{ mb: 0.75 }}>
              Current Lead Status
            </Typography>
            <Chip
              icon={<AccountBalance sx={{ fontSize: "16px !important" }} />}
              label={currentLead}
              size="small"
              sx={{ bgcolor: alpha(BRAND, 0.08), color: BRAND, fontWeight: 800, "& .MuiChip-icon": { color: `${BRAND} !important` } }}
            />
            <Typography variant="body2" sx={{ color: MUTED, mt: 1 }}>
              {currentLeadDescription}
            </Typography>
          </Box>

          <FormControl fullWidth size="small" error={!!errors.bankAtPendingStatus}>
            <InputLabel>New Bank Status *</InputLabel>
            <Select
              label="New Bank Status *"
              value={formData.bankAtPendingStatus}
              onChange={(event) => onChange("bankAtPendingStatus", event.target.value)}
              sx={{ borderRadius: RADIUS_SM }}
            >
              <MenuItem value="">
                <em>Select bank status</em>
              </MenuItem>
              {BANK_STATUS_OPTIONS.map((status) => (
                <MenuItem key={status.value} value={status.value}>
                  <Stack direction="row" spacing={1.25} alignItems="center">
                    <AccountBalance sx={{ fontSize: 17, color: BRAND }} />
                    <Box>
                      <Typography variant="body2">{status.label}</Typography>
                      <Typography variant="caption" sx={{ color: MUTED }}>{status.description}</Typography>
                    </Box>
                  </Stack>
                </MenuItem>
              ))}
            </Select>
            {errors.bankAtPendingStatus && <FormHelperText>{errors.bankAtPendingStatus}</FormHelperText>}
          </FormControl>

          <FormControl fullWidth size="small" error={!!errors.status}>
            <InputLabel>Lead Status *</InputLabel>
            <Select
              label="Lead Status *"
              value={formData.status}
              onChange={(event) => onChange("status", event.target.value)}
              sx={{ borderRadius: RADIUS_SM }}
            >
              {BANK_LEAD_STATUS_OPTIONS.map((status) => (
                <MenuItem key={status.value} value={status.value}>
                  <Stack direction="row" spacing={1.25} alignItems="center">
                    <AccountBalance sx={{ fontSize: 17, color: BRAND }} />
                    <Box>
                      <Typography variant="body2">{status.label}</Typography>
                      <Typography variant="caption" sx={{ color: MUTED }}>{status.description}</Typography>
                    </Box>
                  </Stack>
                </MenuItem>
              ))}
            </Select>
            {errors.status && <FormHelperText>{errors.status}</FormHelperText>}
          </FormControl>

          {formData.bankAtPendingStatus === "rejected" && (
            <TextField
              fullWidth
              size="small"
              label="Rejection Reason *"
              placeholder="Enter reason for rejection..."
              value={formData.reason}
              onChange={(event) => onChange("reason", event.target.value)}
              error={!!errors.reason}
              helperText={errors.reason}
            />
          )}

          <TextField
            fullWidth
            multiline
            minRows={4}
            size="small"
            label="Status Notes"
            placeholder="Add notes about this status update..."
            value={formData.bankAtPendingNotes}
            onChange={(event) => onChange("bankAtPendingNotes", event.target.value)}
          />

          <Stack direction="row" spacing={1.25} alignItems="center" sx={{ p: 1.75, borderRadius: RADIUS_SM, bgcolor: alpha(BRAND, 0.06), color: INK }}>
            <InfoOutlined sx={{ fontSize: 20, color: BRAND }} />
            <Typography variant="body2">
              When pending, lead will stay in {selectedLead.label} stage.
            </Typography>
          </Stack>
        </Stack>
      </Box>

      {workflowFooter(onCancel, onSave, saving, "Updating...", saving || !project?._id)}
    </Paper>
  );
};

function ProjectDetails() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { projectId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { fetchAPI } = useAuth();
  const initialProject = location.state?.project || null;
  const isWorksheetProject = initialProject?.source === "installerWorksheet";

  const [project, setProject] = useState(initialProject);
  const [loading, setLoading] = useState(!initialProject);
  const [error, setError] = useState("");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });
  const [selectedWorkflowStage, setSelectedWorkflowStage] = useState(() => {
    const initialStage = normalizeProjectStage(location.state?.projectStage);
    return ACTION_STAGES.some((stage) => stage.key === initialStage) ? initialStage : "summary";
  });
  const [registrationForm, setRegistrationForm] = useState({
    address: "",
    city: "",
    pincode: "",
    solarRequirement: "",
    dateOfRegistration: "",
    registrationStatus: "inProgress",
    registrationNotes: "",
    status: "Registration",
  });
  const [registrationErrors, setRegistrationErrors] = useState({});
  const [savingRegistration, setSavingRegistration] = useState(false);
  const [registrationEditMode, setRegistrationEditMode] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    paymentType: "Bank Loan",
    paymentAmount: "",
    paymentDate: "",
    paymentReference: "",
    paymentStatus: "pending",
    loanAmount: "",
    bank: "",
    branchName: "",
    loanStatus: "pending",
    loanApprovalDate: "",
    loanReferenceNumber: "",
    transactionId: "",
    chequeNumber: "",
    chequeDate: "",
    loanNotes: "",
    status: "Bank Loan Apply",
  });
  const [paymentErrors, setPaymentErrors] = useState({});
  const [savingPayment, setSavingPayment] = useState(false);
  const [installationForm, setInstallationForm] = useState({
    installationStatus: "",
    status: "Installation Completion",
    installationDate: "",
    installationNotes: "",
  });
  const [installationErrors, setInstallationErrors] = useState({});
  const [savingInstallation, setSavingInstallation] = useState(false);
  const [disbursementForm, setDisbursementForm] = useState({
    disbursementStatus: "pending",
    status: "Disbursement",
    disbursementAmount: "",
    disbursementDate: "",
    disbursementNotes: "",
  });
  const [disbursementErrors, setDisbursementErrors] = useState({});
  const [savingDisbursement, setSavingDisbursement] = useState(false);
  const [loanPendingForm, setLoanPendingForm] = useState({
    bankAtPendingStatus: "",
    status: "Bank at Pending",
    reason: "",
    bankAtPendingNotes: "",
  });
  const [loanPendingErrors, setLoanPendingErrors] = useState({});
  const [savingLoanPending, setSavingLoanPending] = useState(false);
  const [documentUploadLinks, setDocumentUploadLinks] = useState([]);
  const [pendingUploadSlot, setPendingUploadSlot] = useState("");
  const [uploadingSlotKey, setUploadingSlotKey] = useState("");
  const [previewDoc, setPreviewDoc] = useState(null);
  const [previewImageZoomed, setPreviewImageZoomed] = useState(false);
  const documentFileInputRef = useRef(null);
  const hasInitialProjectRef = useRef(Boolean(location.state?.project));

  const fetchProject = useCallback(async () => {
    if (isWorksheetProject) {
      setError("");
      setLoading(false);
      return;
    }

    if (!projectId) {
      setError("Project ID is missing.");
      setLoading(false);
      return;
    }

    try {
      setLoading(!hasInitialProjectRef.current);
      setError("");
      const res = await fetchAPI(`/lead/getLeadById/${projectId}`);
      const nextProject = res?.result?.lead || res?.result;
      if (res?.success && nextProject) {
        setProject(nextProject);
        hasInitialProjectRef.current = true;
      } else {
        throw new Error(res?.message || "Failed to load project");
      }
    } catch (err) {
      setError(err.message || "Failed to load project");
    } finally {
      setLoading(false);
    }
  }, [fetchAPI, isWorksheetProject, projectId]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  useEffect(() => {
    setPreviewImageZoomed(false);
  }, [previewDoc?.url]);

  const currentStageKey = normalizeProjectStage(project || location.state?.projectStage);
  const currentStage = getStageMeta(currentStageKey);
  const selectedWorkflow = getStageMeta(selectedWorkflowStage);
  const registrationReadOnly = isStrictWorkflowStageComplete(project, "registration") && !registrationEditMode;
  const documentSlots = useMemo(() => getDocumentSlots(project), [project]);
  const firstAvailableWorkflowStage = useMemo(() => getFirstAvailableWorkflowStage(project), [project]);
  const selectedWorkflowLock = useMemo(
    () => getStrictWorkflowLock(project, selectedWorkflowStage),
    [project, selectedWorkflowStage],
  );

  const getRegistrationForm = useCallback((source) => ({
    address: source?.address || "",
    city: source?.city || "",
    pincode: source?.pincode || "",
    solarRequirement: source?.solarRequirement || "",
    dateOfRegistration: formatInputDate(source?.dateOfRegistration || source?.createdAt),
    registrationStatus: source?.registrationStatus || "inProgress",
    registrationNotes: source?.registrationNotes || "",
    status: source?.status || "Registration",
  }), []);

  const getPaymentForm = useCallback((source) => ({
    paymentType: source?.paymentType || "Bank Loan",
    paymentAmount: source?.paymentAmount ? String(source.paymentAmount) : "",
    paymentDate: formatInputDate(source?.paymentDate),
    paymentReference: source?.paymentReference || "",
    paymentStatus: source?.paymentStatus || "pending",
    loanAmount: source?.loanAmount ? String(source.loanAmount) : "",
    bank: source?.bank || "",
    branchName: source?.branchName || "",
    loanStatus: source?.loanStatus || "pending",
    loanApprovalDate: formatInputDate(source?.loanApprovalDate),
    loanReferenceNumber: source?.loanReferenceNumber || "",
    transactionId: source?.transactionId || "",
    chequeNumber: source?.chequeNumber || "",
    chequeDate: formatInputDate(source?.chequeDate),
    loanNotes: source?.loanNotes || "",
    status: source?.paymentType === "Cash" ? "Disbursement" : source?.status || "Bank Loan Apply",
  }), []);

  const getInstallationForm = useCallback((source) => ({
    installationStatus: source?.installationStatus || "",
    status: source?.status || "Installation Completion",
    installationDate: formatInputDate(source?.installationDate),
    installationNotes: source?.installationNotes || "",
  }), []);

  const getDisbursementForm = useCallback((source) => ({
    disbursementStatus: source?.disbursementStatus || "pending",
    status: source?.status || "Disbursement",
    disbursementAmount: source?.disbursementAmount ? String(source.disbursementAmount) : "",
    disbursementDate: formatInputDate(source?.disbursementDate),
    disbursementNotes: source?.disbursementNotes || "",
  }), []);

  const getLoanPendingForm = useCallback((source) => ({
    bankAtPendingStatus: source?.bankAtPendingStatus || "",
    status: source?.status || "Bank at Pending",
    reason: source?.reason || "",
    bankAtPendingNotes: source?.bankAtPendingNotes || "",
  }), []);

  useEffect(() => {
    setRegistrationForm(getRegistrationForm(project));
    setRegistrationErrors({});
    setPaymentForm(getPaymentForm(project));
    setPaymentErrors({});
    setInstallationForm(getInstallationForm(project));
    setInstallationErrors({});
    setDisbursementForm(getDisbursementForm(project));
    setDisbursementErrors({});
    setLoanPendingForm(getLoanPendingForm(project));
    setLoanPendingErrors({});
  }, [getDisbursementForm, getInstallationForm, getLoanPendingForm, getPaymentForm, getRegistrationForm, project]);

  const actionState = useMemo(() => {
    if (!project) return {};
    return {
      registration: project.registrationStatus || "",
      document: project.documentStatus || "",
      payment: project.loanStatus || project.paymentStatus || "",
      loan_pending: project.bankAtPendingStatus || "",
      installation: project.installationStatus || "",
      disbursement: project.disbursementStatus || "",
    };
  }, [project]);

  const completedStageCount = useMemo(() => {
    if (!project) return 0;
    return PROJECT_STAGES.reduce((count, stage) => {
      if (stage.key === "lead_converted") {
        return project.projectConvertedAt || project.projectCode ? count + 1 : count;
      }
      return isCompletedStatus(actionState[stage.key]) ? count + 1 : count;
    }, 0);
  }, [actionState, project]);

  const progress = Math.round((completedStageCount / PROJECT_STAGES.length) * 100);

  const stageState = useCallback(
    (stageKey) => {
      if (stageKey === "lead_converted") {
        return project?.projectConvertedAt || project?.projectCode ? "done" : "pending";
      }
      if (isCompletedStatus(actionState[stageKey])) return "done";
      if (stageKey === firstAvailableWorkflowStage) return "active";
      return "pending";
    },
    [actionState, firstAvailableWorkflowStage, project?.projectCode, project?.projectConvertedAt],
  );

  const selectWorkflowStage = useCallback((stageKey) => {
    const lock = getStrictWorkflowLock(project, stageKey);
    if (lock.locked) {
      setSnackbar({ open: true, message: lock.message, severity: "warning" });
      return false;
    }
    setSelectedWorkflowStage(stageKey);
    return true;
  }, [project]);

  useEffect(() => {
    if (selectedWorkflowLock.locked) {
      setSelectedWorkflowStage(firstAvailableWorkflowStage || "summary");
    }
  }, [firstAvailableWorkflowStage, selectedWorkflowLock.locked]);

  const openStagePage = (stageKey) => {
    const path = STAGE_ROUTES[stageKey];
    if (!path || !project?._id) return;
    navigate(path, {
      state: {
        fromProjects: true,
        projectStage: stageKey,
        projectId: project._id,
        leadId: project._id,
        project,
      },
    });
  };

  const openSurveyEditor = useCallback(() => {
    if (!project?._id) return;
    navigate("/add-visit", {
      state: {
        lead: project,
        source: "project-details-site-survey",
      },
    });
  }, [navigate, project]);

  const validateRegistrationForm = useCallback(() => {
    const errors = {};
    if (!registrationForm.address.trim()) errors.address = "Address is required";
    if (!registrationForm.city.trim()) errors.city = "City is required";
    if (!registrationForm.pincode.trim()) {
      errors.pincode = "Pincode is required";
    } else if (!/^\d{6}$/.test(registrationForm.pincode.trim())) {
      errors.pincode = "Pincode must be 6 digits";
    }
    if (!registrationForm.solarRequirement.trim()) errors.solarRequirement = "Solar requirement is required";
    setRegistrationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [registrationForm]);

  const handleRegistrationFieldChange = useCallback((field, value) => {
    setRegistrationForm((prev) => ({ ...prev, [field]: value }));
    setRegistrationErrors((prev) => ({ ...prev, [field]: "" }));
  }, []);

  const clearRegistrationForm = useCallback(() => {
    setRegistrationForm({
      address: "",
      city: "",
      pincode: "",
      solarRequirement: "",
      dateOfRegistration: "",
      registrationStatus: "inProgress",
      registrationNotes: "",
      status: "Registration",
    });
    setRegistrationErrors({});
  }, []);

  const resetRegistrationForm = useCallback(() => {
    setRegistrationForm(getRegistrationForm(project));
    setRegistrationErrors({});
    setRegistrationEditMode(false);
  }, [getRegistrationForm, project]);

  const saveRegistration = useCallback(async () => {
    if (!project?._id) return;
    if (!validateRegistrationForm()) {
      setSnackbar({ open: true, message: "Please complete the required registration fields", severity: "error" });
      return;
    }

    setSavingRegistration(true);
    try {
      const payload = {
        address: registrationForm.address.trim(),
        city: registrationForm.city.trim(),
        pincode: registrationForm.pincode.trim(),
        solarRequirement: registrationForm.solarRequirement.trim(),
        registrationStatus: "completed",
        registrationNotes: registrationForm.registrationNotes.trim(),
        status: "Document Submission",
      };

      if (registrationForm.dateOfRegistration) {
        payload.dateOfRegistration = registrationForm.dateOfRegistration;
      }

      const response = await fetchAPI(`/lead/updateLead/${getValidLeadId(project)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response?.success) {
        throw new Error(response?.message || "Failed to update registration");
      }

      const updatedProject = response?.result?.lead || response?.result || { ...project, ...payload };
      setProject(updatedProject);
      setRegistrationEditMode(false);
      setSelectedWorkflowStage("document");
      setSnackbar({ open: true, message: "Registration updated successfully", severity: "success" });
    } catch (err) {
      setSnackbar({ open: true, message: err.message || "Failed to update registration", severity: "error" });
    } finally {
      setSavingRegistration(false);
    }
  }, [fetchAPI, project, registrationForm, validateRegistrationForm]);

  const validatePaymentForm = useCallback(() => {
    const errors = {};
    if (paymentForm.paymentType === "Bank Loan") {
      if (!paymentForm.bank) errors.bank = "Bank name is required";
      if (!paymentForm.branchName.trim()) errors.branchName = "Branch name is required";
      if (!paymentForm.loanAmount) errors.loanAmount = "Loan amount is required";
    } else if (paymentForm.paymentType === "Cash") {
      if (!paymentForm.paymentAmount) errors.paymentAmount = "Payment amount is required";
      if (!paymentForm.paymentDate) errors.paymentDate = "Payment date is required";
    } else if (paymentForm.paymentType === "Online Transfer") {
      if (!paymentForm.paymentAmount) errors.paymentAmount = "Payment amount is required";
      if (!paymentForm.paymentDate) errors.paymentDate = "Payment date is required";
      if (!paymentForm.transactionId.trim()) errors.transactionId = "Transaction ID is required";
    } else if (paymentForm.paymentType === "Cheque") {
      if (!paymentForm.chequeNumber.trim()) errors.chequeNumber = "Cheque number is required";
      if (!paymentForm.bank.trim()) errors.bank = "Bank name is required";
      if (!paymentForm.chequeDate) errors.chequeDate = "Cheque date is required";
      if (!paymentForm.paymentAmount) errors.paymentAmount = "Payment amount is required";
    }
    setPaymentErrors(errors);
    return Object.keys(errors).length === 0;
  }, [paymentForm]);

  const handlePaymentFieldChange = useCallback((field, value) => {
    setPaymentForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "paymentType") {
        next.status = value === "Cash" ? "Disbursement" : "Bank Loan Apply";
        next.paymentStatus = value === "Cash" ? "completed" : "pending";
        next.loanStatus = value === "Bank Loan" ? prev.loanStatus || "pending" : "submitted";
      }
      return next;
    });
    setPaymentErrors((prev) => ({ ...prev, [field]: "" }));
  }, []);

  const clearPaymentForm = useCallback(() => {
    setPaymentForm({
      paymentType: "Bank Loan",
      paymentAmount: "",
      paymentDate: "",
      paymentReference: "",
      paymentStatus: "pending",
      loanAmount: "",
      bank: "",
      branchName: "",
      loanStatus: "pending",
      loanApprovalDate: "",
      loanReferenceNumber: "",
      transactionId: "",
      chequeNumber: "",
      chequeDate: "",
      loanNotes: "",
      status: "Bank Loan Apply",
    });
    setPaymentErrors({});
  }, []);

  const resetPaymentForm = useCallback(() => {
    setPaymentForm(getPaymentForm(project));
    setPaymentErrors({});
  }, [getPaymentForm, project]);

  const savePayment = useCallback(async () => {
    if (!project?._id) return;
    if (!validatePaymentForm()) {
      setSnackbar({ open: true, message: "Please complete the required payment fields", severity: "error" });
      return;
    }

    setSavingPayment(true);
    try {
      const payload = {
        paymentType: paymentForm.paymentType,
        loanNotes: paymentForm.loanNotes.trim(),
      };

      if (paymentForm.paymentType === "Bank Loan") {
        payload.bank = paymentForm.bank.trim();
        payload.branchName = paymentForm.branchName.trim();
        payload.loanAmount = parseFloat(paymentForm.loanAmount);
        payload.loanStatus = paymentForm.loanStatus;
        payload.loanReferenceNumber = paymentForm.loanReferenceNumber.trim();
        payload.status = "Bank Loan Apply";
      } else if (paymentForm.paymentType === "Cash") {
        payload.paymentAmount = parseFloat(paymentForm.paymentAmount);
        payload.paymentDate = paymentForm.paymentDate;
        payload.paymentReference = paymentForm.paymentReference.trim();
        payload.paymentStatus = "completed";
        payload.loanStatus = "submitted";
        payload.status = "Disbursement";
      } else if (paymentForm.paymentType === "Online Transfer") {
        payload.paymentAmount = parseFloat(paymentForm.paymentAmount);
        payload.paymentDate = paymentForm.paymentDate;
        payload.transactionId = paymentForm.transactionId.trim();
        payload.paymentStatus = paymentForm.paymentStatus;
        payload.loanStatus = "submitted";
        payload.status = "Bank Loan Apply";
      } else if (paymentForm.paymentType === "Cheque") {
        payload.chequeNumber = paymentForm.chequeNumber.trim();
        payload.bank = paymentForm.bank.trim();
        payload.chequeDate = paymentForm.chequeDate;
        payload.paymentAmount = parseFloat(paymentForm.paymentAmount);
        payload.paymentStatus = paymentForm.paymentStatus;
        payload.loanStatus = "submitted";
        payload.status = "Bank Loan Apply";
      }

      if (paymentForm.paymentType === "Bank Loan" && paymentForm.loanApprovalDate) {
        payload.loanApprovalDate = paymentForm.loanApprovalDate;
      }

      const response = await fetchAPI(`/lead/updateLead/${getValidLeadId(project)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response?.success) {
        throw new Error(response?.message || "Failed to update payment");
      }

      const updatedProject = response?.result?.lead || response?.result || { ...project, ...payload };
      setProject(updatedProject);
      setSnackbar({ open: true, message: "Payment updated successfully", severity: "success" });
      if (paymentForm.paymentType === "Cash") {
        setSelectedWorkflowStage("disbursement");
      }
    } catch (err) {
      setSnackbar({ open: true, message: err.message || "Failed to update payment", severity: "error" });
    } finally {
      setSavingPayment(false);
    }
  }, [fetchAPI, paymentForm, project, validatePaymentForm]);

  const validateInstallationForm = useCallback(() => {
    const errors = {};
    if (!installationForm.installationStatus) {
      errors.installationStatus = "Please select installation status";
    }
    setInstallationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [installationForm]);

  const handleInstallationFieldChange = useCallback((field, value) => {
    setInstallationForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "installationStatus" && value === "final_payment") {
        next.status = "Installation Completion";
      }
      return next;
    });
    setInstallationErrors((prev) => ({ ...prev, [field]: "" }));
  }, []);

  const resetInstallationForm = useCallback(() => {
    setInstallationForm(getInstallationForm(project));
    setInstallationErrors({});
  }, [getInstallationForm, project]);

  const saveInstallation = useCallback(async () => {
    if (!project?._id) return;
    if (!validateInstallationForm()) {
      setSnackbar({ open: true, message: "Please select installation status", severity: "error" });
      return;
    }

    setSavingInstallation(true);
    try {
      const payload = {
        installationStatus: installationForm.installationStatus,
        status: installationForm.status,
        installationNotes: installationForm.installationNotes.trim(),
      };

      if (installationForm.installationDate) {
        payload.installationDate = installationForm.installationDate;
      }

      const response = await fetchAPI(`/lead/updateLead/${getValidLeadId(project)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response?.success) {
        throw new Error(response?.message || "Failed to update installation");
      }

      const updatedProject = response?.result?.lead || response?.result || { ...project, ...payload };
      setProject(updatedProject);
      setSnackbar({ open: true, message: "Installation status updated successfully", severity: "success" });
    } catch (err) {
      setSnackbar({ open: true, message: err.message || "Failed to update installation", severity: "error" });
    } finally {
      setSavingInstallation(false);
    }
  }, [fetchAPI, installationForm, project, validateInstallationForm]);

  const validateDisbursementForm = useCallback(() => {
    const errors = {};
    if (!disbursementForm.disbursementStatus) {
      errors.disbursementStatus = "Please select disbursement status";
    }
    if (!disbursementForm.status) {
      errors.status = "Please select lead status";
    }
    if (disbursementForm.disbursementStatus === "completed") {
      if (!disbursementForm.disbursementAmount) {
        errors.disbursementAmount = "Disbursement amount is required";
      } else if (Number(disbursementForm.disbursementAmount) <= 0) {
        errors.disbursementAmount = "Enter a valid amount";
      }
      if (!disbursementForm.disbursementDate) {
        errors.disbursementDate = "Disbursement date is required";
      }
    }
    setDisbursementErrors(errors);
    return Object.keys(errors).length === 0;
  }, [disbursementForm]);

  const handleDisbursementFieldChange = useCallback((field, value) => {
    setDisbursementForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "disbursementStatus" && value === "completed") {
        next.status = "Installation Completion";
      }
      if (field === "disbursementStatus" && value !== "completed" && prev.status === "Installation Completion") {
        next.status = "Disbursement";
      }
      return next;
    });
    setDisbursementErrors((prev) => ({ ...prev, [field]: "" }));
  }, []);

  const resetDisbursementForm = useCallback(() => {
    setDisbursementForm(getDisbursementForm(project));
    setDisbursementErrors({});
  }, [getDisbursementForm, project]);

  const saveDisbursement = useCallback(async () => {
    if (!project?._id) return;
    if (!validateDisbursementForm()) {
      setSnackbar({ open: true, message: "Please complete the required disbursement fields", severity: "error" });
      return;
    }

    setSavingDisbursement(true);
    try {
      const payload = {
        disbursementStatus: disbursementForm.disbursementStatus,
        status: disbursementForm.status,
        disbursementNotes: disbursementForm.disbursementNotes.trim(),
      };

      if (disbursementForm.disbursementStatus === "completed") {
        payload.disbursementAmount = parseFloat(disbursementForm.disbursementAmount);
        payload.disbursementDate = disbursementForm.disbursementDate;
      }

      const response = await fetchAPI(`/lead/updateLead/${getValidLeadId(project)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response?.success) {
        throw new Error(response?.message || "Failed to update disbursement");
      }

      const updatedProject = response?.result?.lead || response?.result || { ...project, ...payload };
      setProject(updatedProject);
      setSnackbar({ open: true, message: "Disbursement status updated successfully", severity: "success" });
    } catch (err) {
      setSnackbar({ open: true, message: err.message || "Failed to update disbursement", severity: "error" });
    } finally {
      setSavingDisbursement(false);
    }
  }, [disbursementForm, fetchAPI, project, validateDisbursementForm]);

  const validateLoanPendingForm = useCallback(() => {
    const errors = {};
    if (!loanPendingForm.bankAtPendingStatus) {
      errors.bankAtPendingStatus = "Please select a bank status";
    }
    if (!loanPendingForm.status) {
      errors.status = "Please select a lead status";
    }
    if (loanPendingForm.bankAtPendingStatus === "rejected" && !loanPendingForm.reason.trim()) {
      errors.reason = "Reason is required for rejection";
    }
    setLoanPendingErrors(errors);
    return Object.keys(errors).length === 0;
  }, [loanPendingForm]);

  const handleLoanPendingFieldChange = useCallback((field, value) => {
    setLoanPendingForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "bankAtPendingStatus") {
        if (value === "approved") next.status = "Disbursement";
        if (value === "rejected") next.status = "Missed Leads";
        if (value === "pending") next.status = "Bank at Pending";
      }
      return next;
    });
    setLoanPendingErrors((prev) => ({ ...prev, [field]: "" }));
  }, []);

  const resetLoanPendingForm = useCallback(() => {
    setLoanPendingForm(getLoanPendingForm(project));
    setLoanPendingErrors({});
  }, [getLoanPendingForm, project]);

  const saveLoanPending = useCallback(async () => {
    if (!project?._id) return;
    if (!validateLoanPendingForm()) {
      setSnackbar({ open: true, message: "Please complete the required bank status fields", severity: "error" });
      return;
    }

    setSavingLoanPending(true);
    try {
      const payload = {
        bankAtPendingStatus: loanPendingForm.bankAtPendingStatus,
        status: loanPendingForm.status,
        reason: loanPendingForm.bankAtPendingStatus === "rejected" ? loanPendingForm.reason.trim() : "",
        bankAtPendingNotes: loanPendingForm.bankAtPendingNotes.trim(),
      };

      const response = await fetchAPI(`/lead/updateLead/${getValidLeadId(project)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response?.success) {
        throw new Error(response?.message || "Failed to update bank status");
      }

      const updatedProject = response?.result?.lead || response?.result || { ...project, ...payload };
      setProject(updatedProject);
      setSnackbar({ open: true, message: "Bank status updated successfully", severity: "success" });
    } catch (err) {
      setSnackbar({ open: true, message: err.message || "Failed to update bank status", severity: "error" });
    } finally {
      setSavingLoanPending(false);
    }
  }, [fetchAPI, loanPendingForm, project, validateLoanPendingForm]);

  const editProject = () => {
    if (!project?._id) return;
    navigate(`/all-leads/${project._id}`, { state: { lead: project, edit: true } });
  };

  const createDocumentUploadToken = useCallback(
    (id) => window.btoa(String(id)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, ""),
    [],
  );

  const createDocumentUploadLink = useCallback(() => {
    if (!project?._id) {
      setSnackbar({ open: true, message: "Project is not ready for document upload", severity: "error" });
      return;
    }

    const token = createDocumentUploadToken(project._id);
    const link = `${window.location.origin}/documents/upload/${token}`;
    setDocumentUploadLinks([link]);
    setSnackbar({ open: true, message: "Upload link created", severity: "success" });
  }, [createDocumentUploadToken, project?._id]);

  const copyDocumentUploadLink = useCallback(async (link) => {
    if (!link) return;
    try {
      await navigator.clipboard?.writeText(link);
      setSnackbar({ open: true, message: "Document link copied", severity: "success" });
    } catch {
      setSnackbar({ open: true, message: "Could not copy document link", severity: "error" });
    }
  }, []);

  const shareDocumentUploadLink = useCallback((link) => {
    if (!link) return;
    const message = `Please upload your solar documents using this link: ${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  }, []);

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

  const updateDocumentStatus = useCallback(async (nextStatus) => {
    if (!project?._id) {
      setSnackbar({ open: true, message: "Project is not ready", severity: "error" });
      return;
    }

    try {
      const response = await fetchAPI(`/lead/updateLead/${getValidLeadId(project)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentStatus: nextStatus }),
      });

      if (!response?.success) {
        throw new Error(response?.message || "Failed to update document status");
      }

      const updatedProject = response?.result?.lead || response?.result || { ...project, documentStatus: nextStatus };
      setProject(updatedProject);
      setSnackbar({
        open: true,
        message: nextStatus === "rejected" ? "Document marked as rejected" : "Document marked as verified",
        severity: "success",
      });
    } catch (err) {
      setSnackbar({ open: true, message: err.message || "Failed to update document status", severity: "error" });
    }
  }, [fetchAPI, project]);

  const handleDocumentVerify = useCallback((slot) => {
    if (!slot?.uploaded) return;
    updateDocumentStatus("submitted");
  }, [updateDocumentStatus]);

  const handleDocumentReject = useCallback((slot) => {
    if (!slot?.uploaded) return;
    updateDocumentStatus("rejected");
  }, [updateDocumentStatus]);

  const handleDocumentDelete = useCallback(async (slot) => {
    if (!project?._id || !slot?.uploaded || !slot?.source) {
      setSnackbar({ open: true, message: "Document cannot be removed", severity: "error" });
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
        otherDocuments: (project.otherDocuments || []).filter((doc) => {
          const docName = doc?.name || getFileNameFromUrl(doc?.url);
          const matches = doc?.url === slot.url && docName === slot.fileName;
          if (matches && !removed) {
            removed = true;
            return false;
          }
          return true;
        }),
      };
    }

    if (!payload) {
      setSnackbar({ open: true, message: "Document cannot be removed", severity: "error" });
      return;
    }

    try {
      const response = await fetchAPI(`/lead/updateLead/${getValidLeadId(project)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response?.success) {
        throw new Error(response?.message || "Failed to delete document");
      }

      const updatedProject = response?.result?.lead || response?.result || { ...project, ...payload };
      setProject(updatedProject);
      if (previewDoc?.url === slot.url) {
        setPreviewDoc(null);
      }
      setSnackbar({ open: true, message: "Document deleted successfully", severity: "success" });
    } catch (err) {
      setSnackbar({ open: true, message: err.message || "Failed to delete document", severity: "error" });
    }
  }, [fetchAPI, previewDoc?.url, project]);

  const validateDocumentFile = useCallback((file) => {
    if (file.size > MAX_DOCUMENT_FILE_SIZE) {
      return "File size should be less than 5MB";
    }
    if (!ALLOWED_DOCUMENT_FILE_TYPES.includes(file.type)) {
      return "Only JPG, PNG and PDF files are allowed";
    }
    return "";
  }, []);

  const openDirectDocumentUpload = useCallback((slotKey) => {
    setPendingUploadSlot(slotKey);
    if (documentFileInputRef.current) {
      documentFileInputRef.current.value = "";
      documentFileInputRef.current.click();
    }
  }, []);

  const uploadDocumentForSlot = useCallback(async (slotKey, file) => {
    if (!project?._id) {
      setSnackbar({ open: true, message: "Project is not ready for upload", severity: "error" });
      return;
    }

    const slot = DOCUMENT_REQUIREMENTS.find((item) => item.key === slotKey);
    if (!slot) {
      setSnackbar({ open: true, message: "Unknown document slot", severity: "error" });
      return;
    }

    const validationError = validateDocumentFile(file);
    if (validationError) {
      setSnackbar({ open: true, message: validationError, severity: "error" });
      return;
    }

    const formDataToSend = new FormData();
    const jsonData = {
      documentStatus: project.documentStatus || "pending",
      documentSubmissionDate: project.documentSubmissionDate
        ? format(new Date(project.documentSubmissionDate), "yyyy-MM-dd")
        : format(new Date(), "yyyy-MM-dd"),
    };

    if (project.documentNotes) {
      jsonData.documentNotes = project.documentNotes;
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
      const response = await fetchAPI(`/lead/upload/${getValidLeadId(project)}/upload-documents`, {
        method: "PUT",
        body: formDataToSend,
      });

      if (!response?.success) {
        throw new Error(response?.message || "Failed to upload document");
      }

      const updatedProject = response?.result?.lead || response?.result || null;
      if (updatedProject) {
        setProject(updatedProject);
      } else {
        await fetchProject();
      }
      setSnackbar({ open: true, message: `${slot.label} uploaded successfully`, severity: "success" });
    } catch (err) {
      setSnackbar({ open: true, message: err.message || "Failed to upload document", severity: "error" });
    } finally {
      setUploadingSlotKey("");
      setPendingUploadSlot("");
    }
  }, [fetchAPI, fetchProject, project, validateDocumentFile]);

  const handleDirectDocumentFileSelection = useCallback(async (event) => {
    const file = event.target.files?.[0];
    const slotKey = pendingUploadSlot;
    event.target.value = "";
    if (!file || !slotKey) return;
    await uploadDocumentForSlot(slotKey, file);
  }, [pendingUploadSlot, uploadDocumentForSlot]);

  if (loading && !project) {
    return (
      <Box sx={{ p: { xs: 1.5, md: 3 }, bgcolor: isDark ? "#050811" : SURFACE }}>
        <Skeleton variant="rounded" height={90} sx={{ mb: 2, borderRadius: RADIUS }} />
        <Skeleton variant="rounded" height={120} sx={{ mb: 2, borderRadius: RADIUS }} />
        <Skeleton variant="rounded" height={260} sx={{ borderRadius: RADIUS }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: isDark ? "#050811" : SURFACE }}>
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 2.5 }}>
        <Box>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : MUTED_2 }}>Projects</Typography>
            <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : MUTED_2 }}>/</Typography>
            <Typography variant="caption" fontWeight={700} color={isDark ? "#f8fafc" : INK}>
              {project?.projectCode || project?.leadId || projectId}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 1.25 }}>
            <Tooltip title="Back to projects">
              <IconButton size="small" onClick={() => navigate("/projects")} sx={{ border: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${BORDER}`, bgcolor: isDark ? "#0b0e1a" : PANEL, color: isDark ? "#f8fafc" : "inherit", "&:hover": { bgcolor: isDark ? "#0e1220" : SURFACE } }}>
                <ArrowBack sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            <Chip
              label={currentStage.label.toUpperCase()}
              size="small"
              sx={{
                bgcolor: alpha(BRAND, 0.1),
                color: BRAND,
                fontWeight: 800,
                letterSpacing: "0.03em",
              }}
            />
            <Typography variant="caption" sx={{ color: MUTED_2 }}>
              Created {formatDate(project?.projectConvertedAt || project?.createdAt)}
            </Typography>
          </Stack>
          <Typography variant="h5" fontWeight={800} color={isDark ? "#f8fafc" : INK} sx={{ lineHeight: 1.15 }} letterSpacing="-0.015em">
            {getProjectTitle(project)}
          </Typography>
          <Typography variant="body2" sx={{ color: isDark ? "#94a3b8" : MUTED, mt: 0.75 }}>
            {getProjectSubtitle(project)}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} alignItems="flex-start">
          <Button
            size="small"
            variant="outlined"
            startIcon={<Edit sx={{ fontSize: 16 }} />}
            onClick={editProject}
            sx={{ borderRadius: RADIUS_SM, borderColor: isDark ? "rgba(255,255,255,0.12)" : BORDER, color: isDark ? "#f8fafc" : INK, fontWeight: 700, textTransform: "none", bgcolor: isDark ? "#0b0e1a" : PANEL, "&:hover": { borderColor: "#3b82f6", bgcolor: isDark ? "#0e1220" : alpha(BRAND, 0.04) } }}
          >
            Edit
          </Button>
        </Stack>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: RADIUS_SM }}>{error}</Alert>}

      <Grid container spacing={2} sx={{ mb: 2.5 }}>
        <Grid item xs={12} md={3}>
          <MetricCard icon={<Bolt />} label="System Size" value={getSystemSize(project) || "Not available"} color={BRAND} />
        </Grid>
        <Grid item xs={12} md={3}>
          <MetricCard icon={<AccountBalance />} label="Project Value" value={formatOptionalMoney(getProjectValue(project))} color={SUCCESS} />
        </Grid>
        <Grid item xs={12} md={3}>
          <MetricCard icon={<Payments />} label="Subsidy" value={formatOptionalMoney(project?.subsidyAmount || project?.subsidy)} color={WARNING} />
        </Grid>
        <Grid item xs={12} md={3}>
          <MetricCard icon={<CalendarMonth />} label="Stages Complete" value={`${completedStageCount} of ${PROJECT_STAGES.length}`} color={INK_2} />
        </Grid>
      </Grid>

      <Paper
        elevation={0}
        sx={{
          p: 2.75,
          mb: 2.5,
          borderRadius: RADIUS,
          border: `1px solid ${alpha(INK, 0.06)}`,
          background: `linear-gradient(135deg, ${INK} 0%, ${INK_2} 65%, #16213D 100%)`,
          color: "#fff",
          boxShadow: SHADOW_MD,
        }}
      >
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} alignItems={{ xs: "flex-start", md: "center" }}>
          <Stack direction="row" spacing={1.75} alignItems="center">
            <Box sx={{ width: 46, height: 46, borderRadius: RADIUS_SM, bgcolor: alpha("#fff", 0.12), display: "flex", alignItems: "center", justifyContent: "center" }}>
              <TaskAlt />
            </Box>
            <Box>
              <Typography variant="caption" fontWeight={800} sx={{ letterSpacing: "0.08em", opacity: 0.7 }}>
                NEXT ACTION
              </Typography>
              <Typography variant="subtitle1" fontWeight={800} letterSpacing="-0.01em">
                {getNextActionLabel(project, currentStage)}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                Last updated {formatDate(project?.updatedAt)}
              </Typography>
            </Box>
          </Stack>
          <Button
            size="small"
            variant="contained"
            onClick={() => selectWorkflowStage(firstAvailableWorkflowStage)}
            disabled={!project?._id}
            sx={{
              bgcolor: "#ea580c",
              color: "#ffffff",
              fontWeight: 800,
              textTransform: "none",
              borderRadius: RADIUS_SM,
              boxShadow: "none",
              "&:hover": { bgcolor: "#c2410c", boxShadow: "0 4px 14px rgba(234,88,12,0.4)" },
              "&.Mui-disabled": { bgcolor: alpha("#fff", 0.25), color: alpha("#fff", 0.5) },
            }}
          >
            Open next stage
          </Button>
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ p: 2.5, mb: 2.5, borderRadius: RADIUS, border: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${BORDER}`, bgcolor: isDark ? "#0b0e1a" : PANEL, color: isDark ? "#f8fafc" : "inherit", boxShadow: SHADOW_SM }}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1} sx={{ mb: 2.5 }}>
          <Box>
            <Typography variant="caption" fontWeight={800} sx={{ color: MUTED_2, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Stage Progress
            </Typography>
            <Typography variant="subtitle2" fontWeight={800} color={isDark ? "#f8fafc" : INK}>
              Lifecycle status of every project stage
            </Typography>
          </Box>
          <Chip label={`${progress}%`} size="small" sx={{ alignSelf: { xs: "flex-start", md: "center" }, bgcolor: alpha(BRAND, 0.1), color: BRAND, fontWeight: 800 }} />
        </Stack>

        <Box sx={{ overflowX: "auto", pb: 0.5 }}>
          <Stack direction="row" alignItems="flex-start" sx={{ minWidth: 920 }}>
            {PROJECT_STAGES.map((stage, index) => {
              const Icon = stage.icon;
              const state = stageState(stage.key);
              const color = stateColor(state);
              const done = state === "done";
              const active = state === "active";
              return (
                <React.Fragment key={stage.key}>
                  <Stack alignItems="center" spacing={0.75} sx={{ width: 128, flexShrink: 0 }}>
                    <Box
                      sx={{
                        width: 34,
                        height: 34,
                        borderRadius: "50%",
                        bgcolor: done || active ? color : (isDark ? "#1e293b" : "#fff"),
                        border: `1px solid ${done || active ? color : (isDark ? "rgba(255,255,255,0.12)" : BORDER)}`,
                        color: done || active ? "#fff" : (isDark ? "#94a3b8" : NEUTRAL),
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: active ? `0 0 0 5px ${alpha(color, 0.14)}` : "none",
                        transition: "box-shadow 0.2s ease",
                      }}
                    >
                      <Icon sx={{ fontSize: 16 }} />
                    </Box>
                    <Typography variant="caption" sx={{ color: MUTED_2 }} fontWeight={700}>
                      Stage {index + 1}
                    </Typography>
                    <Typography variant="caption" color={isDark ? "#f8fafc" : INK} fontWeight={800} textAlign="center" sx={{ lineHeight: 1.2 }}>
                      {stage.label}
                    </Typography>
                    <Chip
                      label={done ? "Done" : active ? "Now" : "Pending"}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: 10,
                        fontWeight: 800,
                        bgcolor: alpha(color, 0.1),
                        color,
                      }}
                    />
                  </Stack>
                  {index < PROJECT_STAGES.length - 1 && (
                    <Divider sx={{ flex: 1, minWidth: 42, mt: 2.1, borderColor: done ? (isDark ? "#10b981" : alpha(SUCCESS, 0.4)) : (isDark ? "rgba(255,255,255,0.12)" : BORDER) }} />
                  )}
                </React.Fragment>
              );
            })}
          </Stack>
        </Box>
      </Paper>

      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1.5} sx={{ mb: 1.5 }}>
        <Box>
          <Typography variant="caption" fontWeight={800} sx={{ color: MUTED_2, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Project Workflow
          </Typography>
          <Typography variant="subtitle2" fontWeight={800} color={isDark ? "#f8fafc" : INK}>
            {completedStageCount} of {PROJECT_STAGES.length} stages complete
          </Typography>
        </Box>
        <Typography variant="subtitle2" fontWeight={800} sx={{ color: BRAND }}>
          {progress}%
        </Typography>
      </Stack>

      <Paper elevation={0} sx={{ p: 1.5, mb: 2.5, borderRadius: RADIUS, border: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${BORDER}`, bgcolor: isDark ? "#0b0e1a" : PANEL, color: isDark ? "#f8fafc" : "inherit", boxShadow: SHADOW_SM }}>
        <Stack direction="row" spacing={1} sx={{ overflowX: "auto", pb: 0.5 }}>
          {WORKFLOW_TABS.map((stage) => {
            const Icon = stage.icon;
            const active = selectedWorkflowStage === stage.key;
            const lock = getStrictWorkflowLock(project, stage.key);
            return (
              <Tooltip key={stage.key} title={lock.locked ? lock.message : ""}>
                <span>
                  <Button
                    size="small"
                    startIcon={<Icon sx={{ fontSize: 15 }} />}
                    disabled={lock.locked}
                    onClick={() => selectWorkflowStage(stage.key)}
                    sx={{
                      flexShrink: 0,
                      minWidth: 132,
                      justifyContent: "flex-start",
                      borderRadius: RADIUS_SM,
                      px: 1.5,
                      py: 0.9,
                      fontSize: 11,
                      fontWeight: 800,
                      color: active ? BRAND : INK,
                      border: `1px solid ${active ? alpha(BRAND, 0.35) : BORDER}`,
                      bgcolor: active ? alpha(BRAND, 0.06) : PANEL,
                      textTransform: "none",
                      "&:hover": { bgcolor: alpha(BRAND, 0.06), borderColor: alpha(BRAND, 0.35) },
                      "&.Mui-disabled": {
                        color: MUTED_2,
                        borderColor: BORDER_SOFT,
                        bgcolor: isDark ? "#0e1220" : SURFACE,
                      },
                    }}
                  >
                    <Box component="span" sx={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
                      {stage.label}
                    </Box>
                  </Button>
                </span>
              </Tooltip>
            );
          })}
        </Stack>
      </Paper>

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={selectedWorkflowStage === "summary" ? 12 : 8}>
          <input
            ref={documentFileInputRef}
            type="file"
            hidden
            accept="image/jpeg,image/png,image/jpg,application/pdf"
            onChange={handleDirectDocumentFileSelection}
          />
          {selectedWorkflowStage === "summary" ? (
            <SummaryWorkspace
              project={project}
              onGoToStage={selectWorkflowStage}
              onOpenSurveyEditor={openSurveyEditor}
            />
          ) : selectedWorkflowStage === "registration" ? (
            <RegistrationWorkspace
              project={project}
              formData={registrationForm}
              errors={registrationErrors}
              saving={savingRegistration}
              onChange={handleRegistrationFieldChange}
              onClear={clearRegistrationForm}
              onCancel={resetRegistrationForm}
              onSave={saveRegistration}
              readOnly={registrationReadOnly}
              onEdit={() => setRegistrationEditMode(true)}
            />
          ) : selectedWorkflowStage === "document" ? (
            <DocumentWorkspace
              project={project}
              documentSlots={documentSlots}
              documentUploadLinks={documentUploadLinks}
              previewDoc={previewDoc}
              previewImageZoomed={previewImageZoomed}
              uploadingSlotKey={uploadingSlotKey}
              onUpload={openDirectDocumentUpload}
              onCreateLink={createDocumentUploadLink}
              onCopyLink={copyDocumentUploadLink}
              onShareLink={shareDocumentUploadLink}
              onPreview={setPreviewDoc}
              onClosePreview={() => setPreviewDoc(null)}
              onTogglePreviewZoom={() => setPreviewImageZoomed((prev) => !prev)}
              onOpenDocument={openDocumentFile}
              onDownloadDocument={downloadDocumentFile}
              onVerify={handleDocumentVerify}
              onReject={handleDocumentReject}
              onDelete={handleDocumentDelete}
            />
          ) : selectedWorkflowStage === "payment" ? (
            <PaymentWorkspace
              project={project}
              formData={paymentForm}
              errors={paymentErrors}
              saving={savingPayment}
              onChange={handlePaymentFieldChange}
              onClear={clearPaymentForm}
              onCancel={resetPaymentForm}
              onSave={savePayment}
            />
          ) : selectedWorkflowStage === "installation" ? (
            <InstallationWorkspace
              project={project}
              formData={installationForm}
              errors={installationErrors}
              saving={savingInstallation}
              onChange={handleInstallationFieldChange}
              onCancel={resetInstallationForm}
              onSave={saveInstallation}
            />
          ) : selectedWorkflowStage === "disbursement" ? (
            <DisbursementWorkspace
              project={project}
              formData={disbursementForm}
              errors={disbursementErrors}
              saving={savingDisbursement}
              onChange={handleDisbursementFieldChange}
              onCancel={resetDisbursementForm}
              onSave={saveDisbursement}
            />
          ) : selectedWorkflowStage === "loan_pending" ? (
            <LoanPendingWorkspace
              project={project}
              formData={loanPendingForm}
              errors={loanPendingErrors}
              saving={savingLoanPending}
              onChange={handleLoanPendingFieldChange}
              onCancel={resetLoanPendingForm}
              onSave={saveLoanPending}
            />
          ) : (
            <Paper elevation={0} sx={{ minHeight: 220, p: 3, borderRadius: RADIUS, border: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${BORDER}`, bgcolor: isDark ? "#0b0e1a" : PANEL, color: isDark ? "#f8fafc" : "inherit", boxShadow: SHADOW_SM }}>
              <Stack alignItems="center" justifyContent="center" spacing={1.25} sx={{ minHeight: 170, textAlign: "center" }}>
                <TaskAlt sx={{ fontSize: 44, color: alpha(INK, 0.25) }} />
                <Typography variant="subtitle1" fontWeight={800} color={isDark ? "#f8fafc" : INK}>
                  {selectedWorkflow.label} Workspace
                </Typography>
                <Typography variant="body2" sx={{ color: MUTED, maxWidth: 520 }}>
                  This stage is available in the project workflow. Open the full page when you need the detailed update tools.
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => openStagePage(selectedWorkflowStage)}
                  sx={{ mt: 1, borderRadius: RADIUS_SM, borderColor: BORDER, color: INK, fontWeight: 700, textTransform: "none" }}
                >
                  Open {selectedWorkflow.label}
                </Button>
              </Stack>
            </Paper>
          )}
        </Grid>
        {selectedWorkflowStage !== "summary" && (
        <Grid item xs={12} md={4}>
          <Stack spacing={2.5}>
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: RADIUS, border: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${BORDER}`, bgcolor: isDark ? "#0b0e1a" : PANEL, color: isDark ? "#f8fafc" : "inherit", boxShadow: SHADOW_SM }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                <InfoOutlined sx={{ fontSize: 18, color: BRAND }} />
                <Typography variant="subtitle2" fontWeight={800} color={isDark ? "#f8fafc" : INK}>
                  Current Stage Info
                </Typography>
              </Stack>
              <Stack spacing={1.25}>
                {ACTION_STAGES.map((stage) => (
                  <Stack key={stage.key} direction="row" justifyContent="space-between" spacing={1}>
                    <Typography variant="caption" sx={{ color: MUTED }} fontWeight={700}>
                      {stage.label}
                    </Typography>
                    <Typography variant="caption" sx={{ color: stage.key === selectedWorkflowStage ? BRAND : INK }} fontWeight={800}>
                      {formatStatusLabel(actionState[stage.key])}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Paper>
          </Stack>
        </Grid>
        )}
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert severity={snackbar.severity} sx={{ width: "100%", borderRadius: RADIUS_SM }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default ProjectDetails;
