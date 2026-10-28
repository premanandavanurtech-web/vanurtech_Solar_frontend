import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Autocomplete,
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
  ListSubheader,
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
  Add,
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
  DeleteOutline,
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
  CheckCircleOutline,
  MonetizationOnOutlined,
  RedeemOutlined,
  VerifiedOutlined,
  PriceCheckOutlined,
  AccountBalanceOutlined,
  SpeedOutlined,
  FactCheckOutlined,
  PaidOutlined,
  ReceiptLongOutlined,
  EmailOutlined,
  Inventory2Outlined,
  WhatsApp,
<<<<<<< HEAD
  Search,
  PeopleAlt,
  CalendarMonthOutlined,
  KeyboardArrowDownRounded,
=======
>>>>>>> origin/dipak
} from "@mui/icons-material";
import { format, parseISO } from "date-fns";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { toBackendAssetUrl } from "../utils/backendAssetUrl";
import { getProjectStage } from "../utils/projectStage";
import { getAcceptedOrLatestQuotation } from "../utils/quotationStorage";
import ProjectProfitabilityCard from "../components/ProjectProfitabilityCard";
import ProjectImagesWorkspace from "../components/ProjectImagesWorkspace";

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
  { key: "registration", label: "DISCOM Registration", icon: FactCheck },
  { key: "document", label: "Document", icon: DescriptionOutlined },
  { key: "payment", label: "Payment", icon: Payments },
  { key: "loan_pending", label: "Loan Status", icon: CalendarMonth },
  { key: "disbursement", label: "Phase 1 Disbursement", icon: TrendingUp },
  { key: "installation", label: "Installation", icon: Bolt },
  { key: "dcr_generation", label: "DCR Generation", icon: TaskAlt },
  { key: "notification_email", label: "Notification Email", icon: EmailOutlined },
  { key: "demand_note", label: "Demand Note", icon: ReceiptLongOutlined },
  { key: "demand_note_payment", label: "Demand Note Payment", icon: PaidOutlined },
  { key: "inspection", label: "Inspection", icon: FactCheckOutlined },
  { key: "meter_installation", label: "Meter Installation", icon: SpeedOutlined },
  { key: "phase2_disbursement", label: "Phase 2 Disbursement", icon: AccountBalanceOutlined },
  { key: "final_payment", label: "Final Payment", icon: PriceCheckOutlined },
  { key: "project_commissioning", label: "Project Commissioning", icon: VerifiedOutlined },
  { key: "discom_approval", label: "DISCOM Approval", icon: TaskAlt },
  { key: "subsidy_redeemed", label: "Subsidy Redeemed", icon: RedeemOutlined },
  { key: "subsidy_received", label: "Subsidy Received", icon: MonetizationOnOutlined },
];

const ACTION_STAGES = PROJECT_STAGES.filter((stage) => stage.key !== "lead_converted");

const WORKFLOW_TABS = [
  { key: "summary", label: "Summary", icon: Summarize },
  { key: "inventory", label: "Inventory & Profitability", icon: Inventory2Outlined },
  ...ACTION_STAGES,
];

const WORKFLOW_PHASES = [
  {
    id: "overview",
    title: "Overview & Analytics",
    shortName: "Overview & BOM",
    badge: "Dashboard",
    icon: Summarize,
    color: "#6366F1",
    stageKeys: ["summary", "inventory"],
  },
  {
    id: "phase1",
    title: "Phase 1: Onboarding & Approvals",
    shortName: "1. Onboarding & Approvals",
    badge: "Stages 1–6",
    icon: FactCheck,
    color: "#3B82F6",
    stageKeys: ["lead_converted", "registration", "document", "payment", "loan_pending", "disbursement"],
  },
  {
    id: "phase2",
    title: "Phase 2: Execution & DCR",
    shortName: "2. Execution & DCR",
    badge: "Stages 7–11",
    icon: Bolt,
    color: "#F59E0B",
    stageKeys: ["installation", "dcr_generation", "notification_email", "demand_note", "demand_note_payment"],
  },
  {
    id: "phase3",
    title: "Phase 3: Inspection & Metering",
    shortName: "3. Inspection & Metering",
    badge: "Stages 12–15",
    icon: SpeedOutlined,
    color: "#8B5CF6",
    stageKeys: ["inspection", "meter_installation", "phase2_disbursement", "final_payment"],
  },
  {
    id: "phase4",
    title: "Phase 4: Commissioning & Subsidy",
    shortName: "4. Commissioning & Subsidy",
    badge: "Stages 16–19",
    icon: RedeemOutlined,
    color: "#10B981",
    stageKeys: ["project_commissioning", "discom_approval", "subsidy_redeemed", "subsidy_received"],
  },
];

const getPhaseForStage = (stageKey) => {
  for (const phase of WORKFLOW_PHASES) {
    if (phase.stageKeys.includes(stageKey)) return phase.id;
  }
  return "phase1";
};

const getStageInfo = (key, customPaymentType = null) => {
  if (key === "summary") return { key: "summary", label: "Project Summary", icon: Summarize, stageNum: "Overview" };
  if (key === "inventory") return { key: "inventory", label: "Inventory & Profitability", icon: Inventory2Outlined, stageNum: "BOM" };
  if (key === "project_images") return { key: "project_images", label: "Project Images", icon: PhotoCameraOutlined, stageNum: "Media" };
  const effectivePayType = customPaymentType || "Bank Loan";
  const isBank = effectivePayType === "Bank Loan";
  const visibleStages = PROJECT_STAGES.filter((s) => {
    if (s.key === "loan_pending" && !isBank) return false;
    return true;
  });
  const idx = visibleStages.findIndex((s) => s.key === key);
  if (idx !== -1) {
    return {
      ...visibleStages[idx],
      stageNum: `Stage ${(idx + 1).toString().padStart(2, "0")}`,
      rawNum: idx + 1,
    };
  }
  return { key, label: key, icon: TaskAlt, stageNum: "Stage" };
};



const INSPECTION_STATUS_OPTIONS = [
  { value: "By RESCO", label: "By RESCO", description: "Inspection conducted by RESCO" },
  { value: "By Solar Coordinator", label: "By Solar Coordinator", description: "Inspection conducted by Solar Coordinator" },
  { value: "By DISCOM", label: "By DISCOM", description: "Inspection conducted by DISCOM" },
];

const PHASE2_LEAD_STATUS_OPTIONS = [
  { value: "Phase 2 Disbursement", label: "Phase 2 Disbursement", description: "Second installment disbursement completed" },
  { value: "Not Yet Disbursed", label: "Not Yet Disbursed", description: "Second installment awaiting disbursement" },
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
  "Other",
];

const REGISTRATION_STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "approval", label: "Approval" },
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
  { value: "pending_installation", label: "Pending Installation", description: "Installation work is pending or in progress" },
  { value: "installation_completed", label: "Completed Installation", description: "Installation completed successfully" },
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
  { value: "Disbursement", label: "Disbursement", description: "1st Installment / Disbursement in progress" },
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
  if (proj._id) return String(proj._id);
  if (proj.id) return String(proj.id);
  if (proj.source === "installerWorksheet") {
    return String(proj.worksheetProjectId || proj.worksheetId || "");
  }
  if (proj.leadId) return String(proj.leadId);
  return "";
};

const getCustomerName = (project) =>
  [project?.firstName, project?.lastName].filter(Boolean).join(" ") || project?.customerName || "Unnamed project";

const getSystemSize = (project) =>
  project?.solarRequirement || project?.systemSize || project?.capacity || project?.plantCapacity || "";

const getProjectValue = (project) => {
  if (!project) return 0;
  const quote = project?._id ? getAcceptedOrLatestQuotation(project._id) : null;
  const quoteCost = Number(quote?.totalCost) || Number(quote?.form?.totalCost) || 0;
  return (
    project?.finalPaymentCost ||
    project?.projectSaleValue ||
    project?.totalProjectCost ||
    (quoteCost > 0 ? quoteCost : null) ||
    project?.agreedPrice ||
    project?.totalAmount ||
    project?.projectValue ||
    project?.quotationAmount ||
    project?.paymentAmount ||
    project?.loanAmount ||
    project?.disbursementAmount ||
    0
  );
};

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
    if (project?.paymentType !== "Bank Loan") return true;
    return isCompletedStatus(project.bankAtPendingStatus);
  }
  if (stageKey === "disbursement") {
    if (project?.paymentType !== "Bank Loan") return true;
    return isCompletedStatus(project.disbursementStatus) || (hasValue(project.disbursementAmount) && hasValue(project.disbursementDate));
  }
  if (stageKey === "installation") {
    return isCompletedStatus(project.installationStatus) || hasValue(project.installationDate);
  }

  return false;
};

const getStrictWorkflowLock = () => ({
  locked: false,
  message: "",
});

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
        <Typography variant="h6" fontWeight={800} color="text.primary" lineHeight={1.15} letterSpacing="-0.01em">
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
<<<<<<< HEAD
          bgcolor: isDark ? "#0b0e1a" : PANEL,
          color: isDark ? "#f8fafc" : "inherit",
          border: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${BORDER}`,
        },
      }}
    >
      <DialogTitle sx={{ px: 3, py: 2.25, borderBottom: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${BORDER}`, bgcolor: isDark ? "#0e1322" : SURFACE }}>
=======
        },
      }}
    >
      <DialogTitle sx={{ px: 3, py: 2.25, borderBottom: `1px solid ${BORDER}`, bgcolor: SURFACE }}>
>>>>>>> origin/dipak
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
          <Stack direction="row" alignItems="center" spacing={1.25}>
            <Box sx={{ width: 34, height: 34, borderRadius: "9px", bgcolor: alpha(WARNING, 0.12), color: WARNING, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FactCheck sx={{ fontSize: 18 }} />
            </Box>
<<<<<<< HEAD
            <Typography variant="subtitle1" fontWeight={800} color={isDark ? "#f8fafc" : "text.primary"} letterSpacing="-0.01em">
=======
            <Typography variant="subtitle1" fontWeight={800} color="text.primary" letterSpacing="-0.01em">
>>>>>>> origin/dipak
              Site Survey Details
            </Typography>
            <Chip
              label={siteSurvey.status || "Completed"}
              size="small"
              sx={{ height: 23, bgcolor: alpha(SUCCESS, 0.12), color: SUCCESS, fontSize: 11, fontWeight: 800 }}
            />
          </Stack>
<<<<<<< HEAD
          <IconButton size="small" onClick={onClose} sx={{ color: isDark ? "#94a3b8" : MUTED }}>
=======
          <IconButton size="small" onClick={onClose} sx={{ color: MUTED }}>
>>>>>>> origin/dipak
            <Clear sx={{ fontSize: 20 }} />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
<<<<<<< HEAD
        <Grid container spacing={2} sx={{ p: 2, mb: 2.5, borderRadius: RADIUS_SM, border: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${BORDER}`, bgcolor: isDark ? "#0e1322" : SURFACE }}>
          <Grid item xs={12} md={4}>
            <Typography variant="caption" fontWeight={800} sx={{ color: isDark ? "#94a3b8" : MUTED_2, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Visit Date
            </Typography>
            <Typography variant="body2" fontWeight={800} color={isDark ? "#f8fafc" : "text.primary"}>
=======
        <Grid container spacing={2} sx={{ p: 2, mb: 2.5, borderRadius: RADIUS_SM, border: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${BORDER}`, bgcolor: SURFACE }}>
          <Grid item xs={12} md={4}>
            <Typography variant="caption" fontWeight={800} sx={{ color: MUTED_2, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Visit Date
            </Typography>
            <Typography variant="body2" fontWeight={800} color="text.primary">
>>>>>>> origin/dipak
              {formatDate(siteSurvey.savedAt || project?.visitDate, "dd MMM yyyy")}
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
<<<<<<< HEAD
            <Typography variant="caption" fontWeight={800} sx={{ color: isDark ? "#94a3b8" : MUTED_2, textTransform: "uppercase", letterSpacing: "0.05em" }}>
=======
            <Typography variant="caption" fontWeight={800} sx={{ color: MUTED_2, textTransform: "uppercase", letterSpacing: "0.05em" }}>
>>>>>>> origin/dipak
              Inspector
            </Typography>
            <Typography variant="body2" fontWeight={800} color={isDark ? "#f8fafc" : INK}>
              {getPersonName(project?.assignedUser || project?.assignedManager) || "Not assigned"}
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
<<<<<<< HEAD
            <Typography variant="caption" fontWeight={800} sx={{ color: isDark ? "#94a3b8" : MUTED_2, textTransform: "uppercase", letterSpacing: "0.05em" }}>
=======
            <Typography variant="caption" fontWeight={800} sx={{ color: MUTED_2, textTransform: "uppercase", letterSpacing: "0.05em" }}>
>>>>>>> origin/dipak
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
<<<<<<< HEAD
        <Divider sx={{ mb: 1.5, borderColor: isDark ? "rgba(255,255,255,0.08)" : BORDER }} />
=======
        <Divider sx={{ mb: 1.5, borderColor: BORDER }} />
>>>>>>> origin/dipak

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
<<<<<<< HEAD
                  bgcolor: isDark ? "#0e1322" : PANEL,
                  color: isDark ? "#f8fafc" : "inherit",
=======
                  bgcolor: isDark ? "#0b0e1a" : PANEL, color: isDark ? "#f8fafc" : "inherit",
>>>>>>> origin/dipak
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
<<<<<<< HEAD
                  <Typography variant="caption" fontWeight={800} sx={{ color: isDark ? "#94a3b8" : MUTED_2, textTransform: "uppercase", lineHeight: 1.2, letterSpacing: "0.03em" }}>
=======
                  <Typography variant="caption" fontWeight={800} sx={{ color: MUTED_2, textTransform: "uppercase", lineHeight: 1.2, letterSpacing: "0.03em" }}>
>>>>>>> origin/dipak
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
<<<<<<< HEAD
            <Stack direction="row" spacing={1.5} sx={{ minHeight: 74, p: 1.5, borderRadius: RADIUS_SM, border: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${BORDER}`, bgcolor: isDark ? "#0e1322" : PANEL }}>
=======
            <Stack direction="row" spacing={1.5} sx={{ minHeight: 74, p: 1.5, borderRadius: RADIUS_SM, border: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${BORDER}`, bgcolor: PANEL }}>
>>>>>>> origin/dipak
              <Box sx={{ width: 34, height: 34, flexShrink: 0, borderRadius: "9px", bgcolor: alpha(WARNING, 0.1), color: WARNING, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Typography variant="caption" fontWeight={800}>#</Typography>
              </Box>
              <Box sx={{ minWidth: 0 }}>
<<<<<<< HEAD
                <Typography variant="caption" fontWeight={800} sx={{ color: isDark ? "#94a3b8" : MUTED_2, textTransform: "uppercase", lineHeight: 1.2, letterSpacing: "0.03em" }}>
=======
                <Typography variant="caption" fontWeight={800} sx={{ color: MUTED_2, textTransform: "uppercase", lineHeight: 1.2, letterSpacing: "0.03em" }}>
>>>>>>> origin/dipak
                  GPS Longitude
                </Typography>
                <Typography variant="body2" fontWeight={800} color={isDark ? "#f8fafc" : INK} sx={{ mt: 0.45 }}>
                  {formatSurveyValue(siteSurvey.longitude)}
                </Typography>
              </Box>
            </Stack>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
<<<<<<< HEAD
            <Stack direction="row" spacing={1.5} sx={{ minHeight: 74, p: 1.5, borderRadius: RADIUS_SM, border: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${BORDER}`, bgcolor: isDark ? "#0e1322" : PANEL }}>
=======
            <Stack direction="row" spacing={1.5} sx={{ minHeight: 74, p: 1.5, borderRadius: RADIUS_SM, border: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${BORDER}`, bgcolor: PANEL }}>
>>>>>>> origin/dipak
              <Box sx={{ width: 34, height: 34, flexShrink: 0, borderRadius: "9px", bgcolor: alpha(WARNING, 0.1), color: WARNING, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Typography variant="caption" fontWeight={800}>#</Typography>
              </Box>
              <Box sx={{ minWidth: 0 }}>
<<<<<<< HEAD
                <Typography variant="caption" fontWeight={800} sx={{ color: isDark ? "#94a3b8" : MUTED_2, textTransform: "uppercase", lineHeight: 1.2, letterSpacing: "0.03em" }}>
=======
                <Typography variant="caption" fontWeight={800} sx={{ color: MUTED_2, textTransform: "uppercase", lineHeight: 1.2, letterSpacing: "0.03em" }}>
>>>>>>> origin/dipak
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
<<<<<<< HEAD
          <Box sx={{ mt: 2.5, p: 1.75, borderRadius: RADIUS_SM, border: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${BORDER}`, bgcolor: isDark ? "#0e1322" : SURFACE }}>
            <Typography variant="caption" fontWeight={800} sx={{ color: isDark ? "#94a3b8" : MUTED_2, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Notes
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.75, whiteSpace: "pre-wrap", wordBreak: "break-word", color: isDark ? "#f8fafc" : INK }}>
=======
          <Box sx={{ mt: 2.5, p: 1.75, borderRadius: RADIUS_SM, border: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${BORDER}`, bgcolor: SURFACE }}>
            <Typography variant="caption" fontWeight={800} sx={{ color: MUTED_2, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Notes
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.75, whiteSpace: "pre-wrap", wordBreak: "break-word", color: INK }}>
>>>>>>> origin/dipak
              {siteSurveyNotes}
            </Typography>
          </Box>
        )}
      </DialogContent>

<<<<<<< HEAD
      <DialogActions sx={{ px: 3, py: 2, borderTop: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${BORDER}` }}>
=======
      <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${BORDER}` }}>
>>>>>>> origin/dipak
        <Button
          size="small"
          variant="contained"
          startIcon={<LinkIcon sx={{ fontSize: 15 }} />}
          onClick={onOpenEditor}
<<<<<<< HEAD
          sx={{ mr: "auto", borderRadius: RADIUS_SM, bgcolor: isDark ? "rgba(255,255,255,0.08)" : "#EEF1F6", color: isDark ? "#f8fafc" : INK, boxShadow: "none", fontWeight: 800, textTransform: "none", "&:hover": { bgcolor: isDark ? "rgba(255,255,255,0.14)" : "#E3E7EF", boxShadow: "none" } }}
        >
          Open full editor
        </Button>
        <Button size="small" variant="outlined" onClick={onClose} sx={{ borderRadius: RADIUS_SM, borderColor: isDark ? "rgba(255,255,255,0.15)" : BORDER, color: isDark ? "#cbd5e1" : INK, textTransform: "none", fontWeight: 700 }}>
=======
          sx={{ mr: "auto", borderRadius: RADIUS_SM, bgcolor: "#EEF1F6", color: INK, boxShadow: "none", fontWeight: 800, textTransform: "none", "&:hover": { bgcolor: "#E3E7EF", boxShadow: "none" } }}
        >
          Open full editor
        </Button>
        <Button size="small" variant="outlined" onClick={onClose} sx={{ borderRadius: RADIUS_SM, borderColor: BORDER, color: INK, textTransform: "none", fontWeight: 700 }}>
>>>>>>> origin/dipak
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
<<<<<<< HEAD
                sx={{
                  borderRadius: RADIUS_SM,
                  borderColor: isDark ? "rgba(255,255,255,0.15)" : BORDER,
                  color: isDark ? "#cbd5e1" : INK,
                  fontWeight: 700,
                  textTransform: "none",
                  "&.Mui-disabled": {
                    borderColor: isDark ? "rgba(255,255,255,0.06)" : "#E2E8F0",
                    color: isDark ? "rgba(255,255,255,0.25)" : "#94a3b8",
                  },
                  "&:hover": { borderColor: alpha(BRAND, 0.4), bgcolor: alpha(BRAND, 0.04) },
                }}
=======
                sx={{ borderRadius: RADIUS_SM, borderColor: BORDER, color: INK, fontWeight: 700, textTransform: "none", "&:hover": { borderColor: alpha(BRAND, 0.4), bgcolor: alpha(BRAND, 0.04) } }}
>>>>>>> origin/dipak
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
<<<<<<< HEAD
                  <Typography variant="body2" fontWeight={800} sx={{ color: isDark ? "#94a3b8" : MUTED_2 }}>#</Typography>
                  <Typography variant="caption" fontWeight={800} sx={{ color: isDark ? "#94a3b8" : MUTED_2, textTransform: "uppercase", letterSpacing: "0.06em" }}>
=======
                  <Typography variant="body2" fontWeight={800} sx={{ color: MUTED_2 }}>#</Typography>
                  <Typography variant="caption" fontWeight={800} sx={{ color: MUTED_2, textTransform: "uppercase", letterSpacing: "0.06em" }}>
>>>>>>> origin/dipak
                    Project Code
                  </Typography>
                </Stack>
                <Typography variant="subtitle1" fontWeight={800} color={isDark ? "#f8fafc" : INK}>
                  {project?.projectCode || project?.leadId || project?._id?.slice(-8) || "Not set"}
                </Typography>
              </Box>

              <Box>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.8 }}>
<<<<<<< HEAD
                  <TaskAlt sx={{ fontSize: 17, color: isDark ? "#94a3b8" : MUTED_2 }} />
                  <Typography variant="caption" fontWeight={800} sx={{ color: isDark ? "#94a3b8" : MUTED_2, textTransform: "uppercase", letterSpacing: "0.06em" }}>
=======
                  <TaskAlt sx={{ fontSize: 17, color: MUTED_2 }} />
                  <Typography variant="caption" fontWeight={800} sx={{ color: MUTED_2, textTransform: "uppercase", letterSpacing: "0.06em" }}>
>>>>>>> origin/dipak
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
<<<<<<< HEAD
                    sx={{ width: 30, height: 30, border: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${BORDER}`, borderRadius: RADIUS_SM, color: isDark ? "#f8fafc" : INK, "&:hover": { borderColor: alpha(BRAND, 0.4), bgcolor: alpha(BRAND, 0.04) } }}
=======
                    sx={{ width: 30, height: 30, border: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${BORDER}`, borderRadius: RADIUS_SM, color: INK, "&:hover": { borderColor: alpha(BRAND, 0.4), bgcolor: alpha(BRAND, 0.04) } }}
>>>>>>> origin/dipak
                  >
                    <Edit sx={{ fontSize: 15 }} />
                  </IconButton>
                </Stack>
              </Box>

              <Box>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.8 }}>
<<<<<<< HEAD
                  <CalendarMonth sx={{ fontSize: 17, color: isDark ? "#94a3b8" : MUTED_2 }} />
                  <Typography variant="caption" fontWeight={800} sx={{ color: isDark ? "#94a3b8" : MUTED_2, textTransform: "uppercase", letterSpacing: "0.06em" }}>
=======
                  <CalendarMonth sx={{ fontSize: 17, color: MUTED_2 }} />
                  <Typography variant="caption" fontWeight={800} sx={{ color: MUTED_2, textTransform: "uppercase", letterSpacing: "0.06em" }}>
>>>>>>> origin/dipak
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
<<<<<<< HEAD
                      <Workspaces sx={{ fontSize: 17, color: isDark ? "#94a3b8" : MUTED_2 }} />
                      <Typography variant="caption" fontWeight={800} sx={{ color: isDark ? "#94a3b8" : MUTED_2, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        Created By
                      </Typography>
                    </Stack>
                    <Typography variant="subtitle1" fontWeight={700} sx={{ color: createdByName ? (isDark ? "#f8fafc" : INK) : (isDark ? "#64748b" : MUTED_2) }}>
=======
                      <Workspaces sx={{ fontSize: 17, color: MUTED_2 }} />
                      <Typography variant="caption" fontWeight={800} sx={{ color: MUTED_2, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        Created By
                      </Typography>
                    </Stack>
                    <Typography variant="subtitle1" fontWeight={700} sx={{ color: createdByName ? INK : MUTED_2 }}>
>>>>>>> origin/dipak
                      {createdByName || "Not available"}
                    </Typography>
                  </Box>

                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.8 }}>
<<<<<<< HEAD
                      <Build sx={{ fontSize: 17, color: isDark ? "#94a3b8" : MUTED_2 }} />
                      <Typography variant="caption" fontWeight={800} sx={{ color: isDark ? "#94a3b8" : MUTED_2, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        Supervisor
                      </Typography>
                    </Stack>
                    <Typography variant="subtitle1" fontWeight={700} sx={{ color: supervisorName ? (isDark ? "#f8fafc" : INK) : (isDark ? "#64748b" : MUTED_2) }}>
=======
                      <Build sx={{ fontSize: 17, color: MUTED_2 }} />
                      <Typography variant="caption" fontWeight={800} sx={{ color: MUTED_2, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        Supervisor
                      </Typography>
                    </Stack>
                    <Typography variant="subtitle1" fontWeight={700} sx={{ color: supervisorName ? INK : MUTED_2 }}>
>>>>>>> origin/dipak
                      {supervisorName || "Not assigned"}
                    </Typography>
                  </Box>

                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.8 }}>
<<<<<<< HEAD
                      <TaskAlt sx={{ fontSize: 17, color: isDark ? "#94a3b8" : MUTED_2 }} />
                      <Typography variant="caption" fontWeight={800} sx={{ color: isDark ? "#94a3b8" : MUTED_2, textTransform: "uppercase", letterSpacing: "0.06em" }}>
=======
                      <TaskAlt sx={{ fontSize: 17, color: MUTED_2 }} />
                      <Typography variant="caption" fontWeight={800} sx={{ color: MUTED_2, textTransform: "uppercase", letterSpacing: "0.06em" }}>
>>>>>>> origin/dipak
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
<<<<<<< HEAD
                            sx={{ borderRadius: "6px", bgcolor: isDark ? "rgba(79, 70, 229, 0.2)" : alpha(BRAND, 0.08), color: isDark ? "#a5b4fc" : INK, fontWeight: 700 }}
=======
                            sx={{ borderRadius: "6px", bgcolor: alpha(BRAND, 0.08), color: INK, fontWeight: 700 }}
>>>>>>> origin/dipak
                          />
                        ))}
                      </Stack>
                    ) : (
<<<<<<< HEAD
                      <Typography variant="subtitle1" fontWeight={700} sx={{ color: isDark ? "#64748b" : MUTED_2 }}>
=======
                      <Typography variant="subtitle1" fontWeight={700} sx={{ color: MUTED_2 }}>
>>>>>>> origin/dipak
                        No team members added
                      </Typography>
                    )}
                  </Box>
                </>
              )}

              {!isWorksheetProject && (
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.8 }}>
<<<<<<< HEAD
                    <Build sx={{ fontSize: 17, color: isDark ? "#94a3b8" : MUTED_2 }} />
                    <Typography variant="caption" fontWeight={800} sx={{ color: isDark ? "#94a3b8" : MUTED_2, textTransform: "uppercase", letterSpacing: "0.06em" }}>
=======
                    <Build sx={{ fontSize: 17, color: MUTED_2 }} />
                    <Typography variant="caption" fontWeight={800} sx={{ color: MUTED_2, textTransform: "uppercase", letterSpacing: "0.06em" }}>
>>>>>>> origin/dipak
                      Site Installer
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1.25} alignItems="center" flexWrap="wrap" useFlexGap>
<<<<<<< HEAD
                    <Typography variant="subtitle1" fontWeight={700} sx={{ color: installerName ? (isDark ? "#f8fafc" : INK) : (isDark ? "#64748b" : MUTED_2) }}>
=======
                    <Typography variant="subtitle1" fontWeight={700} sx={{ color: installerName ? INK : MUTED_2 }}>
>>>>>>> origin/dipak
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
<<<<<<< HEAD
            <Divider sx={{ my: 3, borderColor: isDark ? "rgba(255,255,255,0.08)" : BORDER_SOFT }} />
=======
            <Divider sx={{ my: 3, borderColor: BORDER_SOFT }} />
>>>>>>> origin/dipak

            <Stack spacing={2.5}>
              <Box>
                <Typography variant="subtitle2" fontWeight={900} color={isDark ? "#f8fafc" : INK} sx={{ mb: 1.5 }}>
                  Customer & Installation Details
                </Typography>
                <Grid container spacing={1.5}>
                  {worksheetFields.map((field) => (
                    <Grid item xs={12} sm={field.wide ? 12 : 6} md={field.wide ? 12 : 3} key={field.label}>
<<<<<<< HEAD
                      <Box sx={{ p: 1.5, borderRadius: RADIUS_SM, border: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${BORDER}`, bgcolor: isDark ? "#0e1322" : SURFACE, minHeight: 78 }}>
                        <Typography variant="caption" fontWeight={800} sx={{ color: isDark ? "#94a3b8" : MUTED_2, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          {field.label}
                        </Typography>
                        <Typography variant="body2" fontWeight={800} color={field.value ? (isDark ? "#f8fafc" : INK) : (isDark ? "#64748b" : MUTED_2)} sx={{ mt: 0.75, wordBreak: "break-word" }}>
=======
                      <Box sx={{ p: 1.5, borderRadius: RADIUS_SM, border: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${BORDER}`, bgcolor: isDark ? "#0e1220" : SURFACE, minHeight: 78 }}>
                        <Typography variant="caption" fontWeight={800} sx={{ color: MUTED_2, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          {field.label}
                        </Typography>
                        <Typography variant="body2" fontWeight={800} color={field.value ? INK : MUTED_2} sx={{ mt: 0.75, wordBreak: "break-word" }}>
>>>>>>> origin/dipak
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
<<<<<<< HEAD
                    <PhotoCameraOutlined sx={{ fontSize: 18, color: isDark ? "#94a3b8" : MUTED_2 }} />
                    <Typography variant="subtitle2" fontWeight={900} color={isDark ? "#f8fafc" : INK}>
                      Geo Tagged Photos
                    </Typography>
                    <Chip label={`${worksheetPhotos.length} photo${worksheetPhotos.length === 1 ? "" : "s"}`} size="small" sx={{ height: 22, borderRadius: "6px", bgcolor: isDark ? "rgba(79, 70, 229, 0.2)" : alpha(BRAND, 0.08), color: isDark ? "#a5b4fc" : BRAND, fontWeight: 800 }} />
                  </Stack>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<LocationOn sx={{ fontSize: 16 }} />}
                    onClick={() => worksheetGpsUrl && window.open(worksheetGpsUrl, "_blank", "noopener,noreferrer")}
                    disabled={!worksheetGpsUrl}
                    sx={{
                      borderRadius: RADIUS_SM,
                      textTransform: "none",
                      fontWeight: 800,
                      borderColor: isDark ? "rgba(255,255,255,0.15)" : BORDER,
                      color: isDark ? "#cbd5e1" : INK,
                      "&.Mui-disabled": {
                        borderColor: isDark ? "rgba(255,255,255,0.06)" : "#E2E8F0",
                        color: isDark ? "rgba(255,255,255,0.25)" : "#94a3b8",
                      },
                      "&:hover": {
                        bgcolor: isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9",
                        borderColor: isDark ? "rgba(255,255,255,0.3)" : BORDER,
                      },
                    }}
                  >
                    Open GPS Location
                  </Button>
=======
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
>>>>>>> origin/dipak
                </Stack>

                {worksheetPhotos.length > 0 ? (
                  <Stack direction="row" spacing={1.25} flexWrap="wrap" useFlexGap>
                    {worksheetPhotos.map(({ photo, url, index }) => {
                      const photoGpsUrl = getGpsMapUrl(photo);
                      return (
<<<<<<< HEAD
                        <Box key={`${url}-${index}`} sx={{ width: 148, border: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${BORDER}`, borderRadius: RADIUS_SM, overflow: "hidden", bgcolor: isDark ? "#0e1322" : PANEL }}>
=======
                        <Box key={`${url}-${index}`} sx={{ width: 148, border: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${BORDER}`, borderRadius: RADIUS_SM, overflow: "hidden", bgcolor: PANEL }}>
>>>>>>> origin/dipak
                          <Box
                            component="img"
                            src={url}
                            alt={`Geo tagged project photo ${index + 1}`}
                            onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
<<<<<<< HEAD
                            sx={{ width: "100%", aspectRatio: "4 / 3", objectFit: "cover", display: "block", cursor: "pointer", bgcolor: isDark ? "#070a12" : SURFACE }}
=======
                            sx={{ width: "100%", aspectRatio: "4 / 3", objectFit: "cover", display: "block", cursor: "pointer", bgcolor: SURFACE }}
>>>>>>> origin/dipak
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
<<<<<<< HEAD
                                sx={{ alignSelf: "flex-start", minWidth: 0, p: 0, color: isDark ? "#818cf8" : BRAND, fontSize: 12, fontWeight: 800, textTransform: "none" }}
=======
                                sx={{ alignSelf: "flex-start", minWidth: 0, p: 0, color: BRAND, fontSize: 12, fontWeight: 800, textTransform: "none" }}
>>>>>>> origin/dipak
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
<<<<<<< HEAD
                  <Box sx={{ p: 2, borderRadius: RADIUS_SM, border: isDark ? "1px dashed rgba(255,255,255,0.12)" : `1px dashed ${BORDER}`, bgcolor: isDark ? "rgba(255,255,255,0.03)" : SURFACE }}>
                    <Typography variant="body2" color={isDark ? "#94a3b8" : MUTED_2} fontWeight={700}>
=======
                  <Box sx={{ p: 2, borderRadius: RADIUS_SM, border: `1px dashed ${BORDER}`, bgcolor: SURFACE }}>
                    <Typography variant="body2" color={MUTED_2} fontWeight={700}>
>>>>>>> origin/dipak
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
<<<<<<< HEAD
            <AccessTime sx={{ fontSize: 20, color: isDark ? "#818cf8" : BRAND }} />
=======
            <AccessTime sx={{ fontSize: 20, color: BRAND }} />
>>>>>>> origin/dipak
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
<<<<<<< HEAD
                    color: active ? (isDark ? "#a5b4fc" : BRAND) : (isDark ? "#cbd5e1" : "#475569"),
                    bgcolor: active
                      ? (isDark ? "rgba(79, 70, 229, 0.2)" : alpha(BRAND, 0.08))
                      : (isDark ? "rgba(255, 255, 255, 0.06)" : "#F1F4F9"),
                    border: `1px solid ${active ? (isDark ? "rgba(99, 102, 241, 0.4)" : alpha(BRAND, 0.3)) : (isDark ? "rgba(255, 255, 255, 0.08)" : "transparent")}`,
                    fontWeight: 800,
                    textTransform: "none",
                    "&:hover": {
                      bgcolor: active
                        ? (isDark ? "rgba(79, 70, 229, 0.3)" : alpha(BRAND, 0.12))
                        : (isDark ? "rgba(255, 255, 255, 0.1)" : "#e2e8f0"),
                    },
=======
                    color: active ? BRAND : "#475569",
                    bgcolor: active ? alpha(BRAND, 0.08) : "#F1F4F9",
                    border: `1px solid ${active ? alpha(BRAND, 0.3) : "transparent"}`,
                    fontWeight: 800,
                    textTransform: "none",
>>>>>>> origin/dipak
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
<<<<<<< HEAD
                  <Typography variant="caption" fontWeight={800} sx={{ color: isDark ? "#94a3b8" : MUTED_2, minWidth: 92, letterSpacing: "0.04em" }}>
                    {groupLabel}
                  </Typography>
                  <Divider sx={{ flex: 1, borderColor: isDark ? "rgba(255,255,255,0.08)" : BORDER }} />
=======
                  <Typography variant="caption" fontWeight={800} sx={{ color: MUTED_2, minWidth: 92, letterSpacing: "0.04em" }}>
                    {groupLabel}
                  </Typography>
                  <Divider sx={{ flex: 1, borderColor: BORDER }} />
>>>>>>> origin/dipak
                </Stack>
                <Stack spacing={2}>
                  {entries.map((entry) => (
                    <Stack key={entry.id} direction="row" spacing={2} alignItems="flex-start">
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: "50%",
<<<<<<< HEAD
                          bgcolor: isDark ? "rgba(79, 70, 229, 0.18)" : alpha(BRAND, 0.08),
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: isDark ? "#818cf8" : BRAND,
=======
                          bgcolor: alpha(BRAND, 0.08),
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: BRAND,
>>>>>>> origin/dipak
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
<<<<<<< HEAD
                            sx={{ height: 21, bgcolor: isDark ? "rgba(255,255,255,0.08)" : "#EEF1F6", color: isDark ? "#cbd5e1" : "#475569", fontSize: 10.5, fontWeight: 800 }}
                          />
                        </Stack>
                        <Typography variant="body2" sx={{ color: isDark ? "#94a3b8" : MUTED, mt: 0.4 }}>
=======
                            sx={{ height: 21, bgcolor: "#EEF1F6", color: "#475569", fontSize: 10.5, fontWeight: 800 }}
                          />
                        </Stack>
                        <Typography variant="body2" sx={{ color: MUTED, mt: 0.4 }}>
>>>>>>> origin/dipak
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
<<<<<<< HEAD
          <Typography variant="body2" sx={{ color: isDark ? "#64748b" : MUTED_2, py: 3, textAlign: "center" }}>
=======
          <Typography variant="body2" sx={{ color: MUTED_2, py: 3, textAlign: "center" }}>
>>>>>>> origin/dipak
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

<<<<<<< HEAD
const LeadConvertedWorkspace = ({ project, onGoToStage }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const quote = getAcceptedOrLatestQuotation(project);
  const customerName = getCustomerName(project);
  const conversionDate = formatDate(project?.projectConvertedAt || project?.createdAt);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: RADIUS,
        border: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${BORDER}`,
        bgcolor: isDark ? "#0b0e1a" : PANEL,
        color: isDark ? "#f8fafc" : "inherit",
        boxShadow: SHADOW_SM,
      }}
    >
      <Stack spacing={3}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={2}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            {workspaceHeaderIcon(Workspaces)}
            <Box>
              <Typography variant="subtitle1" fontWeight={800} color={isDark ? "#f8fafc" : INK}>
                Lead Converted Workspace
              </Typography>
              <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : MUTED_2 }}>
                Initial project onboarding & lead conversion milestone
              </Typography>
            </Box>
          </Stack>
          <Chip
            icon={<CheckCircle sx={{ fontSize: 16, color: `${SUCCESS} !important` }} />}
            label="Converted to Project"
            size="small"
            sx={{
              height: 28,
              borderRadius: "8px",
              bgcolor: isDark ? "rgba(18, 128, 92, 0.18)" : alpha(SUCCESS, 0.1),
              color: isDark ? "#34d399" : SUCCESS,
              fontWeight: 800,
              px: 1,
            }}
          />
        </Stack>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ p: 2, borderRadius: RADIUS_SM, border: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${BORDER}`, bgcolor: isDark ? "#0e1322" : SURFACE, height: "100%" }}>
              <Typography variant="caption" fontWeight={800} sx={{ color: isDark ? "#94a3b8" : MUTED_2, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Customer Name
              </Typography>
              <Typography variant="subtitle2" fontWeight={800} color={isDark ? "#f8fafc" : INK} sx={{ mt: 0.5 }}>
                {customerName}
              </Typography>
              <Typography variant="caption" color={isDark ? "#94a3b8" : MUTED} sx={{ mt: 0.25, display: "block" }}>
                {project?.phone || project?.phoneNumber || "No phone"}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ p: 2, borderRadius: RADIUS_SM, border: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${BORDER}`, bgcolor: isDark ? "#0e1322" : SURFACE, height: "100%" }}>
              <Typography variant="caption" fontWeight={800} sx={{ color: isDark ? "#94a3b8" : MUTED_2, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                System Capacity
              </Typography>
              <Typography variant="subtitle2" fontWeight={800} color={isDark ? "#f8fafc" : INK} sx={{ mt: 0.5 }}>
                {project?.capacity || (project?.capacityKw ? `${project.capacityKw} kW` : "") || (quote?.systemCapacity ? `${quote.systemCapacity} kW` : "Not specified")}
              </Typography>
              <Typography variant="caption" color={isDark ? "#94a3b8" : MUTED} sx={{ mt: 0.25, display: "block" }}>
                {project?.projectType || project?.requirementType || "Rooftop Solar"}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ p: 2, borderRadius: RADIUS_SM, border: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${BORDER}`, bgcolor: isDark ? "#0e1322" : SURFACE, height: "100%" }}>
              <Typography variant="caption" fontWeight={800} sx={{ color: isDark ? "#94a3b8" : MUTED_2, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Project Value
              </Typography>
              <Typography variant="subtitle2" fontWeight={800} color={isDark ? "#38bdf8" : BRAND} sx={{ mt: 0.5 }}>
                {quote?.totalCost || quote?.finalPrice || project?.totalCost ? `₹${Number(quote?.totalCost || quote?.finalPrice || project?.totalCost || 0).toLocaleString("en-IN")}` : "₹0"}
              </Typography>
              <Typography variant="caption" color={isDark ? "#94a3b8" : MUTED} sx={{ mt: 0.25, display: "block" }}>
                Payment: {project?.paymentType || "Direct / Loan"}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ p: 2, borderRadius: RADIUS_SM, border: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${BORDER}`, bgcolor: isDark ? "#0e1322" : SURFACE, height: "100%" }}>
              <Typography variant="caption" fontWeight={800} sx={{ color: isDark ? "#94a3b8" : MUTED_2, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Converted On
              </Typography>
              <Typography variant="subtitle2" fontWeight={800} color={isDark ? "#f8fafc" : INK} sx={{ mt: 0.5 }}>
                {conversionDate}
              </Typography>
              <Typography variant="caption" color={isDark ? "#94a3b8" : MUTED} sx={{ mt: 0.25, display: "block" }}>
                Status: Active Project
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ p: 2.25, borderRadius: RADIUS_SM, bgcolor: isDark ? "rgba(59, 130, 246, 0.08)" : alpha(BRAND, 0.05), border: isDark ? "1px solid rgba(59, 130, 246, 0.2)" : `1px solid ${alpha(BRAND, 0.15)}` }}>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={2}>
            <Box>
              <Typography variant="subtitle2" fontWeight={800} color={isDark ? "#93c5fd" : BRAND}>
                Next Step: DISCOM Registration
              </Typography>
              <Typography variant="body2" sx={{ color: isDark ? "#cbd5e1" : MUTED, mt: 0.25, fontSize: "0.85rem" }}>
                Submit the customer and plant details to DISCOM portal for net-metering and load approval.
              </Typography>
            </Box>
            <Stack direction="row" spacing={1.25}>
              <Button
                variant="contained"
                onClick={() => onGoToStage?.("registration")}
                startIcon={<FactCheck sx={{ fontSize: 16 }} />}
                sx={{
                  borderRadius: RADIUS_SM,
                  bgcolor: BRAND,
                  color: "#fff",
                  fontWeight: 800,
                  textTransform: "none",
                  boxShadow: "none",
                  "&:hover": { bgcolor: BRAND_DARK, boxShadow: "none" },
                }}
              >
                Proceed to Registration
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Stack>
    </Paper>
  );
};

=======
>>>>>>> origin/dipak
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
        sx={{
          alignSelf: { xs: "flex-start", sm: "center" },
          borderRadius: RADIUS_SM,
          borderColor: isDark ? "rgba(255,255,255,0.15)" : BORDER,
          color: isDark ? "#cbd5e1" : INK,
          fontWeight: 700,
          textTransform: "none",
          "&:hover": {
            bgcolor: isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9",
          },
        }}
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
      <Grid item xs={12}>
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
      <Grid item xs={12}>
        <FormControl fullWidth size="small" error={!!errors.solarRequirement} disabled={readOnly}>
          <InputLabel>Solar Requirement *</InputLabel>
          <Select
            label="Solar Requirement *"
            value={
              SOLAR_REQUIREMENT_TYPES.includes(formData.solarRequirement)
                ? formData.solarRequirement
                : formData.solarRequirement
                ? "Other"
                : ""
            }
            onChange={(event) => {
              const val = event.target.value;
              onChange("solarRequirement", val);
              if (val !== "Other") {
                onChange("customSolarRequirement", "");
              }
            }}
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
      {(formData.solarRequirement === "Other" || (!SOLAR_REQUIREMENT_TYPES.filter(t => t !== "Other").includes(formData.solarRequirement) && Boolean(formData.solarRequirement))) && (
        <Grid item xs={12}>
          <TextField
            fullWidth
            size="small"
            label="Specify Solar Requirement *"
            placeholder="Enter custom solar requirement"
            value={formData.customSolarRequirement !== undefined ? formData.customSolarRequirement : (formData.solarRequirement === "Other" ? "" : formData.solarRequirement)}
            onChange={(event) => onChange("customSolarRequirement", event.target.value)}
            disabled={readOnly}
            error={!!errors.customSolarRequirement || (formData.solarRequirement === "Other" && !formData.customSolarRequirement && !!errors.solarRequirement)}
            helperText={errors.customSolarRequirement || (formData.solarRequirement === "Other" && !formData.customSolarRequirement ? errors.solarRequirement : "")}
          />
        </Grid>
      )}
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
            value={
              formData.registrationStatus === "completed" || formData.registrationStatus === "approved" || formData.registrationStatus === "approval"
                ? "approval"
                : "pending"
            }
            onChange={(event) => onChange("registrationStatus", event.target.value)}
          >
            {REGISTRATION_STATUS_OPTIONS.map((status) => (
              <MenuItem key={status.value} value={status.value}>{status.label}</MenuItem>
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
                sx={{
                  borderRadius: RADIUS_SM,
                  borderColor: isDark ? "rgba(255,255,255,0.15)" : BORDER,
                  color: isDark ? "#cbd5e1" : INK,
                  fontWeight: 700,
                  textTransform: "none",
                  "&:hover": {
                    bgcolor: isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9",
                  },
                }}
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
                ? "Cash payments move directly to 1st Disbursement (1st Installment) after saving"
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
          sx={{
            alignSelf: { xs: "flex-start", sm: "center" },
            borderRadius: RADIUS_SM,
            borderColor: isDark ? "rgba(255,255,255,0.15)" : BORDER,
            color: isDark ? "#cbd5e1" : INK,
            fontWeight: 700,
            textTransform: "none",
            "&:hover": {
              bgcolor: isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9",
            },
          }}
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
              <TextField fullWidth size="small" type="date" label="Payment Date *" value={formData.paymentDate || formatInputDate(new Date())} onChange={(event) => onChange("paymentDate", event.target.value)} error={!!errors.paymentDate} helperText={errors.paymentDate} InputLabelProps={{ shrink: true }} />
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
              <TextField fullWidth size="small" type="date" label="Payment Date *" value={formData.paymentDate || formatInputDate(new Date())} onChange={(event) => onChange("paymentDate", event.target.value)} error={!!errors.paymentDate} helperText={errors.paymentDate} InputLabelProps={{ shrink: true }} />
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
            <Button
              variant="outlined"
              onClick={onCancel}
              sx={{
                minWidth: 120,
                borderRadius: RADIUS_SM,
                borderColor: isDark ? "rgba(255,255,255,0.15)" : BORDER,
                color: isDark ? "#cbd5e1" : INK,
                fontWeight: 700,
                textTransform: "none",
                "&:hover": {
                  bgcolor: isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9",
                  borderColor: isDark ? "rgba(255,255,255,0.3)" : BORDER,
                },
              }}
            >
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

const workflowStatusHeader = (Icon, title, customerName, onCancel) => (
  <Stack
    direction="row"
    justifyContent="space-between"
    alignItems="center"
    sx={{
      p: 2.5,
      bgcolor: (theme) => (theme.palette.mode === "dark" ? "rgba(59,130,246,0.08)" : alpha(BRAND, 0.04)),
      borderBottom: (theme) => (theme.palette.mode === "dark" ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${BORDER}`),
    }}
  >
    <Stack direction="row" spacing={1.75} alignItems="center">
      <Box
        sx={{
          width: 46,
          height: 46,
          borderRadius: "13px",
          bgcolor: (theme) => (theme.palette.mode === "dark" ? "rgba(59,130,246,0.18)" : alpha(BRAND, 0.12)),
          color: (theme) => (theme.palette.mode === "dark" ? "#60a5fa" : BRAND),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon sx={{ fontSize: 24 }} />
      </Box>
      <Box>
        <Typography
          variant="h6"
          fontWeight={800}
          sx={{
            lineHeight: 1.15,
            color: (theme) => (theme.palette.mode === "dark" ? "#f8fafc" : INK),
          }}
          letterSpacing="-0.01em"
        >
          {title}
        </Typography>
        <Typography variant="body2" sx={{ color: (theme) => (theme.palette.mode === "dark" ? "#94a3b8" : MUTED) }}>
          {customerName}
        </Typography>
      </Box>
    </Stack>
    <IconButton size="small" onClick={onCancel} sx={{ color: (theme) => (theme.palette.mode === "dark" ? "#94a3b8" : MUTED_2) }}>
      <Clear sx={{ fontSize: 20 }} />
    </IconButton>
  </Stack>
);

const workflowFooter = (onCancel, onSave, saving, savingLabel, disabled) => (
  <Stack
    direction="row"
    justifyContent="flex-end"
    spacing={1.5}
    sx={{
      p: 2.25,
      borderTop: (theme) => (theme.palette.mode === "dark" ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${BORDER}`),
      bgcolor: (theme) => (theme.palette.mode === "dark" ? "#070b14" : PANEL),
    }}
  >
    <Button
      variant="outlined"
      onClick={onCancel}
      sx={{
        minWidth: 120,
        borderRadius: RADIUS_SM,
        borderColor: (theme) => (theme.palette.mode === "dark" ? "rgba(255,255,255,0.15)" : BORDER),
        color: (theme) => (theme.palette.mode === "dark" ? "#cbd5e1" : INK),
        fontWeight: 700,
        textTransform: "none",
        "&:hover": {
          bgcolor: (theme) => (theme.palette.mode === "dark" ? "rgba(255,255,255,0.06)" : "#f1f5f9"),
          borderColor: (theme) => (theme.palette.mode === "dark" ? "rgba(255,255,255,0.3)" : BORDER),
        },
      }}
    >
      Cancel
    </Button>
    <Button
      variant="contained"
      startIcon={<Save sx={{ fontSize: 17 }} />}
      onClick={onSave}
      disabled={disabled}
      sx={{
        minWidth: 170,
        borderRadius: RADIUS_SM,
        bgcolor: BRAND,
        color: "#ffffff",
        fontWeight: 800,
        textTransform: "none",
        boxShadow: "none",
        "&:hover": { bgcolor: BRAND_DARK, boxShadow: "none" },
        "&.Mui-disabled": {
          bgcolor: (theme) => (theme.palette.mode === "dark" ? "rgba(255,255,255,0.1)" : "#cbd5e1"),
          color: (theme) => (theme.palette.mode === "dark" ? "rgba(255,255,255,0.4)" : "#94a3b8"),
        },
      }}
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
  onUploadPhotos,
  onDeletePhoto,
  uploadingPhoto = false,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const fileInputRef = useRef(null);
  const [partnerDialogOpen, setPartnerDialogOpen] = useState(false);
  const [newPartnerName, setNewPartnerName] = useState("");
  const [previewPhoto, setPreviewPhoto] = useState(null);

  const currentStatusObj = INSTALLATION_STATUS_OPTIONS.find(
    (s) => s.value === formData.installationStatus || s.value === project?.installationStatus
  ) || (isCompletedStatus(project?.installationStatus) ? INSTALLATION_STATUS_OPTIONS[1] : INSTALLATION_STATUS_OPTIONS[0]);

<<<<<<< HEAD
  const isCompleted = currentStatusObj.value === "installation_completed";

=======
>>>>>>> origin/dipak
  const existingPartners = useMemo(() => {
    const defaultList = ["In-House Team", "Solar Pro Tech", "Apex Installations", "BrightSun Solar EPC", "SunRay Tech Partners"];
    if (formData.installationPartner && !defaultList.includes(formData.installationPartner)) {
      return [formData.installationPartner, ...defaultList];
    }
    return defaultList;
  }, [formData.installationPartner]);

  const photos = useMemo(() => {
    const list = [];
    if (Array.isArray(project?.installationPhotos)) {
      project.installationPhotos.forEach((p, idx) => {
        if (p?.url) list.push({ ...p, id: p._id || idx, index: idx });
      });
    }
    if (project?.installationDocument?.url && !list.some(p => p.url === project.installationDocument.url)) {
      list.unshift({
        name: "Installation Document / Photo",
        url: project.installationDocument.url,
        uploadedAt: project.installationDate || project.updatedAt,
        id: "doc_primary",
        index: -1,
      });
    }
    return list;
  }, [project?.installationDocument?.url, project?.installationPhotos, project?.installationDate, project?.updatedAt]);

  const handleAddPartnerSubmit = () => {
    if (newPartnerName.trim()) {
      onChange("installationPartner", newPartnerName.trim());
      setNewPartnerName("");
      setPartnerDialogOpen(false);
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
<<<<<<< HEAD
        borderRadius: 4,
        border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0",
        bgcolor: isDark ? "#0b0f19" : "#ffffff",
        color: isDark ? "#f8fafc" : "#0f172a",
        overflow: "hidden",
        boxShadow: isDark ? "0 20px 60px rgba(0,0,0,0.5)" : "0 20px 60px rgba(15, 23, 42, 0.12)",
      }}
    >
      {/* ── Dialog Header ── */}
      <Box
        sx={{
          px: { xs: 2.5, sm: 3.5 },
          py: 2.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #f1f5f9",
          bgcolor: isDark ? "#0b0f19" : "#ffffff",
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2.8,
              bgcolor: "#4f46e5",
              color: "#ffffff",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
              boxShadow: "0 6px 16px rgba(79, 70, 229, 0.35)",
            }}
          >
            <Build sx={{ fontSize: 22 }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: "1.22rem", fontWeight: 800, color: isDark ? "#f8fafc" : "#0f172a", lineHeight: 1.2 }}>
              Update Installation Status
            </Typography>
            <Typography sx={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.84rem", mt: 0.3 }}>
              Keep track of installation progress and update the current status.
            </Typography>
          </Box>
        </Stack>
        <IconButton
          onClick={onCancel}
          sx={{
            color: isDark ? "#94a3b8" : "#64748b",
            "&:hover": { color: isDark ? "#f8fafc" : "#0f172a", bgcolor: isDark ? "rgba(255,255,255,0.08)" : "#f1f5f9" },
          }}
        >
          <Clear sx={{ fontSize: 20 }} />
        </IconButton>
      </Box>

      {/* ── Content Body ── */}
      <Box sx={{ p: { xs: 2.5, sm: 3.5 }, bgcolor: isDark ? "#070a12" : "#f8fafc" }}>
        <Stack spacing={2.5}>
          {/* Top 2 Cards Row */}
          <Grid container spacing={2.5}>
            {/* Card 1: Current Installation Status */}
            <Grid item xs={12} md={6}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: 3,
                  border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0",
                  bgcolor: isDark ? "#0f1626" : "#ffffff",
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  height: "100%",
                }}
              >
                <Box>
                  <Typography sx={{ fontWeight: 800, color: isDark ? "#f8fafc" : "#0f172a", fontSize: "0.95rem", mb: 0.8 }}>
                    Current Installation Status
                  </Typography>
                  <Box
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 0.8,
                      px: 1.4,
                      py: 0.5,
                      borderRadius: 999,
                      bgcolor: isCompleted
                        ? isDark ? "rgba(34, 197, 94, 0.15)" : "#dcfce7"
                        : isDark ? "rgba(245, 158, 11, 0.15)" : "#fef3c7",
                      border: isCompleted
                        ? isDark ? "1px solid rgba(34, 197, 94, 0.3)" : "1px solid #bbf7d0"
                        : isDark ? "1px solid rgba(245, 158, 11, 0.3)" : "1px solid #fde68a",
                      color: isCompleted ? (isDark ? "#4ade80" : "#16a34a") : (isDark ? "#fbbf24" : "#d97706"),
                      fontWeight: 800,
                      fontSize: "0.8rem",
                    }}
                  >
                    {isCompleted ? <CheckCircleOutline sx={{ fontSize: 16 }} /> : <AccessTime sx={{ fontSize: 16 }} />}
                    {currentStatusObj.label}
                  </Box>
                </Box>

                {/* Installation Status Select */}
                <FormControl fullWidth error={!!errors.installationStatus}>
                  <Select
                    value={
                      formData.installationStatus === "installation_completed" || formData.installationStatus === "Completed Installation"
                        ? "installation_completed"
                        : "pending_installation"
                    }
                    onChange={(event) => onChange("installationStatus", event.target.value)}
                    IconComponent={KeyboardArrowDownRounded}
                    startAdornment={
                      <InputAdornment position="start" sx={{ pl: 0.5, mr: 1.2 }}>
                        <AccessTime sx={{ color: isDark ? "#818cf8" : "#4f46e5", fontSize: 22 }} />
                      </InputAdornment>
                    }
                    renderValue={(selected) => (
                      <Box sx={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
                        <Typography sx={{ fontSize: "0.7rem", color: isDark ? "#94a3b8" : "#64748b", fontWeight: 700, lineHeight: 1 }}>
                          Installation Status <Box component="span" sx={{ color: "#ef4444" }}>*</Box>
                        </Typography>
                        <Typography sx={{ fontSize: "0.92rem", color: isDark ? "#f8fafc" : "#0f172a", fontWeight: 800, mt: 0.3 }}>
                          {selected === "installation_completed" ? "Completed Installation" : "Pending Installation"}
                        </Typography>
                        <Typography sx={{ fontSize: "0.74rem", color: isDark ? "#94a3b8" : "#64748b" }}>
                          {selected === "installation_completed" ? "Installation work is fully complete" : "Installation work is pending or in progress"}
                        </Typography>
                      </Box>
                    )}
                    sx={{
                      minHeight: 62,
                      borderRadius: 2.5,
                      bgcolor: isDark ? "#0b0f19" : "#ffffff",
                      "& .MuiSelect-icon": { color: isDark ? "#94a3b8" : "#64748b" },
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: isDark ? "rgba(255,255,255,0.12)" : "#e2e8f0",
                        borderWidth: "1.5px",
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: isDark ? "#6366f1" : "#c7d2fe",
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#4f46e5" },
                    }}
                  >
                    {INSTALLATION_STATUS_OPTIONS.map((status) => (
                      <MenuItem key={status.value} value={status.value}>
                        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ py: 0.5 }}>
                          {status.value === "installation_completed" ? (
                            <CheckCircleOutline sx={{ fontSize: 20, color: "#16a34a" }} />
                          ) : (
                            <AccessTime sx={{ fontSize: 20, color: "#d97706" }} />
                          )}
                          <Box>
                            <Typography sx={{ fontWeight: 800, fontSize: "0.9rem", color: isDark ? "#f8fafc" : "#0f172a" }}>
                              {status.label}
                            </Typography>
                            <Typography sx={{ fontSize: "0.76rem", color: isDark ? "#94a3b8" : "#64748b" }}>
                              {status.description}
                            </Typography>
                          </Box>
                        </Stack>
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.installationStatus && <FormHelperText>{errors.installationStatus}</FormHelperText>}
                </FormControl>

                {/* Installation Date Input */}
                <Box
                  sx={{
                    p: "10px 14px",
                    borderRadius: 2.5,
                    border: isDark ? "1.5px solid rgba(255,255,255,0.12)" : "1.5px solid #e2e8f0",
                    display: "flex",
                    flexDirection: "column",
                    bgcolor: isDark ? "#0b0f19" : "#ffffff",
                    "&:focus-within": { borderColor: "#4f46e5" },
                  }}
                >
                  <Typography sx={{ fontSize: "0.7rem", color: isDark ? "#94a3b8" : "#64748b", fontWeight: 700, lineHeight: 1, mb: 0.5 }}>
                    Installation Date <Box component="span" sx={{ color: "#ef4444" }}>*</Box>
                  </Typography>
                  <Stack direction="row" spacing={1.2} alignItems="center">
                    <CalendarMonthOutlined sx={{ fontSize: 20, color: isDark ? "#94a3b8" : "#64748b" }} />
                    <Box
                      component="input"
                      type="date"
                      value={formData.installationDate || formatInputDate(new Date())}
                      onChange={(event) => onChange("installationDate", event.target.value)}
                      disabled={readOnly}
                      sx={{
                        border: "none",
                        outline: "none",
                        fontSize: "0.92rem",
                        fontWeight: 700,
                        color: isDark ? "#f8fafc" : "#0f172a",
                        colorScheme: isDark ? "dark" : "light",
                        bgcolor: "transparent",
                        width: "100%",
                        fontFamily: "inherit",
                        cursor: "pointer",
                      }}
                    />
                  </Stack>
                </Box>
              </Paper>
            </Grid>

            {/* Card 2: Assigned Partner */}
            <Grid item xs={12} md={6}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: 3,
                  border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0",
                  bgcolor: isDark ? "#0f1626" : "#ffffff",
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  height: "100%",
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Stack direction="row" spacing={1.2} alignItems="center">
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: 2,
                        bgcolor: isDark ? "rgba(79, 70, 229, 0.2)" : "#eef2ff",
                        color: isDark ? "#a5b4fc" : "#4f46e5",
                        display: "grid",
                        placeItems: "center",
                      }}
                    >
                      <PeopleAlt sx={{ fontSize: 18 }} />
                    </Box>
                    <Typography sx={{ fontWeight: 800, color: isDark ? "#f8fafc" : "#0f172a", fontSize: "0.95rem" }}>
                      Assigned Partner
                    </Typography>
                  </Stack>
                  <Box
                    sx={{
                      px: 1.4,
                      py: 0.4,
                      borderRadius: 999,
                      bgcolor: isDark ? "rgba(79, 70, 229, 0.2)" : "#eef2ff",
                      color: isDark ? "#a5b4fc" : "#4f46e5",
                      fontWeight: 700,
                      fontSize: "0.76rem",
                    }}
                  >
                    {formData.installationPartner || project?.installationPartner || "Not Assigned"}
                  </Box>
                </Stack>

                {/* Partner Name Search Input + Add Button */}
                <Box sx={{ display: "flex", gap: 1.2, alignItems: "center" }}>
                  <Box
                    sx={{
                      flex: 1,
                      p: "8px 14px",
                      borderRadius: 2.5,
                      border: isDark ? "1.5px solid rgba(255,255,255,0.12)" : "1.5px solid #e2e8f0",
                      bgcolor: isDark ? "#0b0f19" : "#ffffff",
                      display: "flex",
                      flexDirection: "column",
                      "&:focus-within": { borderColor: "#4f46e5" },
                    }}
                  >
                    <Typography sx={{ fontSize: "0.7rem", color: isDark ? "#94a3b8" : "#64748b", fontWeight: 700, lineHeight: 1, mb: 0.3 }}>
                      Installation Partner Name
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Search sx={{ fontSize: 18, color: isDark ? "#94a3b8" : "#64748b" }} />
                      <Autocomplete
                        freeSolo
                        options={existingPartners}
                        value={formData.installationPartner || ""}
                        onInputChange={(_, val) => onChange("installationPartner", val)}
                        sx={{ flex: 1 }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            variant="standard"
                            placeholder="Select or enter partner name"
                            InputProps={{
                              ...params.InputProps,
                              disableUnderline: true,
                              sx: { fontSize: "0.9rem", fontWeight: 600, color: isDark ? "#f8fafc" : "#0f172a" },
                            }}
                          />
                        )}
                      />
                    </Stack>
                  </Box>

                  <Button
                    variant="outlined"
                    onClick={() => setPartnerDialogOpen(true)}
                    sx={{
                      height: 52,
                      px: 2.4,
                      borderRadius: 2.5,
                      borderColor: isDark ? "#6366f1" : "#4f46e5",
                      bgcolor: isDark ? "rgba(79, 70, 229, 0.12)" : "transparent",
                      color: isDark ? "#818cf8" : "#4f46e5",
                      fontWeight: 800,
                      textTransform: "none",
                      fontSize: "0.88rem",
                      "&:hover": {
                        borderColor: isDark ? "#818cf8" : "#4338ca",
                        bgcolor: isDark ? "rgba(79, 70, 229, 0.25)" : "#eef2ff",
                      },
=======
        borderRadius: RADIUS,
        border: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${BORDER}`,
        bgcolor: isDark ? "#0b0e1a" : PANEL,
        color: isDark ? "#f8fafc" : "inherit",
        overflow: "hidden",
        boxShadow: SHADOW_SM,
      }}
    >
      {workflowStatusHeader(Build, "Update Installation Status", getCustomerName(project), onCancel)}

      <Box sx={{ p: { xs: 2, sm: 2.5 } }}>
        {/* Status Chip Banner */}
        <Grid container spacing={2} sx={{ mb: 2.5 }}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" fontWeight={800} color={isDark ? "#f8fafc" : INK} sx={{ mb: 0.75 }}>
              Current Installation Status
            </Typography>
            <Chip
              icon={currentStatusObj.value === "installation_completed" ? <CheckCircle sx={{ fontSize: "16px !important" }} /> : <AccessTime sx={{ fontSize: "16px !important" }} />}
              label={currentStatusObj.label}
              size="small"
              sx={{
                bgcolor: currentStatusObj.value === "installation_completed" ? alpha(SUCCESS, 0.15) : alpha(WARNING, 0.15),
                color: currentStatusObj.value === "installation_completed" ? SUCCESS : WARNING,
                fontWeight: 800,
                "& .MuiChip-icon": { color: `${currentStatusObj.value === "installation_completed" ? SUCCESS : WARNING} !important` }
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" fontWeight={800} color={isDark ? "#f8fafc" : INK} sx={{ mb: 0.75 }}>
              Assigned Partner
            </Typography>
            <Chip
              label={formData.installationPartner || project?.installationPartner || "Not Assigned"}
              size="small"
              sx={{ bgcolor: alpha(BRAND, 0.08), color: BRAND, fontWeight: 800 }}
            />
          </Grid>
        </Grid>

        <Stack spacing={2.5}>
          <Grid container spacing={2}>
            {/* 1. Installation Status */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small" error={!!errors.installationStatus}>
                <InputLabel>Installation Status *</InputLabel>
                <Select
                  label="Installation Status *"
                  value={
                    formData.installationStatus === "installation_completed" || formData.installationStatus === "Completed Installation"
                      ? "installation_completed"
                      : "pending_installation"
                  }
                  onChange={(event) => onChange("installationStatus", event.target.value)}
                  sx={{ borderRadius: RADIUS_SM }}
                >
                  {INSTALLATION_STATUS_OPTIONS.map((status) => (
                    <MenuItem key={status.value} value={status.value}>
                      <Stack direction="row" spacing={1.25} alignItems="center">
                        {status.value === "installation_completed" ? (
                          <CheckCircle sx={{ fontSize: 18, color: SUCCESS }} />
                        ) : (
                          <AccessTime sx={{ fontSize: 18, color: WARNING }} />
                        )}
                        <Box>
                          <Typography variant="body2" fontWeight={700}>{status.label}</Typography>
                          <Typography variant="caption" sx={{ color: MUTED }}>{status.description}</Typography>
                        </Box>
                      </Stack>
                    </MenuItem>
                  ))}
                </Select>
                {errors.installationStatus && <FormHelperText>{errors.installationStatus}</FormHelperText>}
              </FormControl>
            </Grid>

            {/* 2. Installation Partner Name */}
            <Grid item xs={12} md={6}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Autocomplete
                  freeSolo
                  fullWidth
                  size="small"
                  options={existingPartners}
                  value={formData.installationPartner || ""}
                  onInputChange={(_, newInputValue) => {
                    onChange("installationPartner", newInputValue);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Installation Partner Name"
                      placeholder="Select or enter partner name"
                      error={!!errors.installationPartner}
                      helperText={errors.installationPartner}
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <>
                            <InputAdornment position="start">
                              <Build sx={{ fontSize: 16, color: MUTED_2 }} />
                            </InputAdornment>
                            {params.InputProps.startAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
                <Tooltip title="Add New Partner Name">
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setPartnerDialogOpen(true)}
                    sx={{
                      minWidth: 40,
                      px: 1.5,
                      height: 40,
                      borderRadius: RADIUS_SM,
                      borderColor: BORDER,
                      color: BRAND,
                      fontWeight: 800,
                      textTransform: "none",
                      whiteSpace: "nowrap",
>>>>>>> origin/dipak
                    }}
                  >
                    + Add
                  </Button>
<<<<<<< HEAD
                </Box>

                {/* Installation Notes Input */}
                <Box
                  sx={{
                    p: "8px 14px",
                    borderRadius: 2.5,
                    border: isDark ? "1.5px solid rgba(255,255,255,0.12)" : "1.5px solid #e2e8f0",
                    bgcolor: isDark ? "#0b0f19" : "#ffffff",
                    display: "flex",
                    flexDirection: "column",
                    "&:focus-within": { borderColor: "#4f46e5" },
                  }}
                >
                  <Stack direction="row" spacing={0.8} alignItems="center" sx={{ mb: 0.5 }}>
                    <DescriptionOutlined sx={{ fontSize: 16, color: isDark ? "#94a3b8" : "#64748b" }} />
                    <Typography sx={{ fontSize: "0.7rem", color: isDark ? "#94a3b8" : "#64748b", fontWeight: 700, lineHeight: 1 }}>
                      Installation Notes
                    </Typography>
                  </Stack>
                  <TextField
                    multiline
                    minRows={2}
                    maxRows={3}
                    variant="standard"
                    placeholder="Enter any additional notes..."
                    value={formData.installationNotes || ""}
                    onChange={(e) => onChange("installationNotes", e.target.value)}
                    InputProps={{
                      disableUnderline: true,
                      sx: { fontSize: "0.88rem", color: isDark ? "#f8fafc" : "#0f172a" },
                    }}
                  />
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* Bottom Card: Installation Pictures */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 3,
              border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0",
              bgcolor: isDark ? "#0f1626" : "#ffffff",
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Stack direction="row" spacing={1.2} alignItems="center">
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 2,
                    bgcolor: isDark ? "rgba(79, 70, 229, 0.2)" : "#eef2ff",
                    color: isDark ? "#a5b4fc" : "#4f46e5",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <PhotoCameraOutlined sx={{ fontSize: 18 }} />
                </Box>
                <Typography sx={{ fontWeight: 800, color: isDark ? "#f8fafc" : "#0f172a", fontSize: "0.95rem" }}>
                  Installation Pictures (Post-Installation Photographs)
                </Typography>
                <Box
                  sx={{
                    px: 1.2,
                    py: 0.3,
                    borderRadius: 999,
                    bgcolor: isDark ? "rgba(79, 70, 229, 0.2)" : "#eef2ff",
                    color: isDark ? "#a5b4fc" : "#4f46e5",
                    fontWeight: 700,
                    fontSize: "0.75rem",
                  }}
                >
                  {`${photos.length} photo${photos.length === 1 ? "" : "s"}`}
                </Box>
=======
                </Tooltip>
              </Stack>
            </Grid>

            {/* 3. Installation Date */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Installation Date"
                value={formData.installationDate || formatInputDate(new Date())}
                onChange={(event) => onChange("installationDate", event.target.value)}
                disabled={readOnly}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* 4. Notes */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                label="Installation Notes"
                placeholder="Add notes about this installation..."
                value={formData.installationNotes || ""}
                onChange={(event) => onChange("installationNotes", event.target.value)}
              />
            </Grid>
          </Grid>

          {/* 5. 📸 Installation Pictures Upload Section */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: RADIUS_SM,
              border: isDark ? "1px solid rgba(255,255,255,0.06)" : `1px solid ${BORDER_SOFT}`,
              bgcolor: isDark ? "rgba(255,255,255,0.02)" : "#FAFBFC",
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <PhotoCameraOutlined sx={{ fontSize: 18, color: BRAND }} />
                <Typography variant="subtitle2" fontWeight={800} color={isDark ? "#f8fafc" : INK}>
                  Installation Pictures (Post-Installation Photographs)
                </Typography>
                <Chip
                  label={`${photos.length} photo${photos.length === 1 ? "" : "s"}`}
                  size="small"
                  sx={{ height: 20, fontSize: 10.5, fontWeight: 800, bgcolor: alpha(BRAND, 0.1), color: BRAND }}
                />
>>>>>>> origin/dipak
              </Stack>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                hidden
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    onUploadPhotos?.(e.target.files);
                    e.target.value = "";
                  }
                }}
              />

              <Button
                variant="contained"
<<<<<<< HEAD
                startIcon={<CloudUpload sx={{ fontSize: 17 }} />}
                disabled={uploadingPhoto || !project?._id}
                onClick={() => fileInputRef.current?.click()}
                sx={{
                  borderRadius: 999,
                  bgcolor: "#4f46e5",
                  fontWeight: 800,
                  fontSize: "0.85rem",
                  textTransform: "none",
                  px: 2.5,
                  py: 0.8,
                  boxShadow: "0 4px 14px rgba(79, 70, 229, 0.3)",
                  "&:hover": { bgcolor: "#4338ca" },
=======
                size="small"
                startIcon={<CloudUpload sx={{ fontSize: 16 }} />}
                disabled={uploadingPhoto || !project?._id}
                onClick={() => fileInputRef.current?.click()}
                sx={{
                  borderRadius: RADIUS_SM,
                  bgcolor: BRAND,
                  fontWeight: 800,
                  textTransform: "none",
                  boxShadow: "none",
                  "&:hover": { bgcolor: BRAND_DARK },
>>>>>>> origin/dipak
                }}
              >
                {uploadingPhoto ? "Uploading..." : "Upload Photos"}
              </Button>
            </Stack>

            {photos.length > 0 ? (
              <Grid container spacing={1.5}>
                {photos.map((photo, idx) => (
                  <Grid item xs={6} sm={4} md={3} key={photo.id || idx}>
                    <Box
                      sx={{
                        position: "relative",
<<<<<<< HEAD
                        borderRadius: 2.5,
                        overflow: "hidden",
                        border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0",
                        bgcolor: isDark ? "#0b0f19" : "#ffffff",
=======
                        borderRadius: RADIUS_SM,
                        overflow: "hidden",
                        border: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${BORDER}`,
                        bgcolor: isDark ? "#0e1220" : "#FFFFFF",
>>>>>>> origin/dipak
                        "&:hover .photo-overlay": { opacity: 1 },
                      }}
                    >
                      <Box
                        component="img"
                        src={toBackendAssetUrl(photo.url)}
                        alt={photo.name || `Installation Photo ${idx + 1}`}
                        onClick={() => setPreviewPhoto(photo)}
                        sx={{
                          width: "100%",
                          height: 120,
                          objectFit: "cover",
                          display: "block",
                          cursor: "pointer",
                          transition: "transform 0.2s ease",
                          "&:hover": { transform: "scale(1.03)" },
                        }}
                      />
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
<<<<<<< HEAD
                        sx={{ p: 1, bgcolor: isDark ? "#0b0f19" : "#ffffff" }}
=======
                        sx={{ p: 1, bgcolor: isDark ? "#0b0e1a" : "#FFFFFF" }}
>>>>>>> origin/dipak
                      >
                        <Typography
                          variant="caption"
                          fontWeight={700}
                          noWrap
<<<<<<< HEAD
                          sx={{ flex: 1, pr: 0.5, color: isDark ? "#f8fafc" : "#0f172a" }}
=======
                          sx={{ flex: 1, pr: 0.5, color: isDark ? "#f8fafc" : INK }}
>>>>>>> origin/dipak
                        >
                          {photo.name || `Photo ${idx + 1}`}
                        </Typography>
                        {photo.index >= 0 && (
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeletePhoto?.(photo.index);
                            }}
<<<<<<< HEAD
                            sx={{ width: 22, height: 22, color: "#ef4444", "&:hover": { bgcolor: "rgba(239, 68, 68, 0.1)" } }}
=======
                            sx={{ width: 22, height: 22, color: DANGER, "&:hover": { bgcolor: alpha(DANGER, 0.1) } }}
>>>>>>> origin/dipak
                          >
                            <DeleteOutline sx={{ fontSize: 15 }} />
                          </IconButton>
                        )}
                      </Stack>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box
                onClick={() => fileInputRef.current?.click()}
                sx={{
<<<<<<< HEAD
                  p: 4,
                  textAlign: "center",
                  borderRadius: 2.5,
                  border: isDark ? "1.5px dashed rgba(99, 102, 241, 0.35)" : "1.5px dashed #c7d2fe",
                  bgcolor: isDark ? "rgba(255,255,255,0.02)" : "#fbfcfe",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  "&:hover": {
                    borderColor: "#4f46e5",
                    bgcolor: isDark ? "rgba(79, 70, 229, 0.08)" : "#f5f7ff",
                  },
                }}
              >
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    bgcolor: isDark ? "rgba(79, 70, 229, 0.2)" : "#eef2ff",
                    color: isDark ? "#a5b4fc" : "#4f46e5",
                    display: "grid",
                    placeItems: "center",
                    mx: "auto",
                    mb: 1.2,
                  }}
                >
                  <CloudUpload sx={{ fontSize: 24 }} />
                </Box>
                <Typography sx={{ fontWeight: 800, color: isDark ? "#f8fafc" : "#0f172a", fontSize: "0.92rem" }}>
                  No installation photographs uploaded yet
                </Typography>
                <Typography sx={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.78rem", mt: 0.5 }}>
=======
                  p: 3,
                  textAlign: "center",
                  borderRadius: RADIUS_SM,
                  border: `1.5px dashed ${BORDER}`,
                  bgcolor: isDark ? "rgba(255,255,255,0.01)" : "#FFFFFF",
                  cursor: "pointer",
                  "&:hover": { borderColor: BRAND, bgcolor: alpha(BRAND, 0.02) },
                }}
              >
                <PhotoCameraOutlined sx={{ fontSize: 32, color: MUTED_2, mb: 1 }} />
                <Typography variant="body2" fontWeight={700} color={isDark ? "#f8fafc" : INK}>
                  No installation photographs uploaded yet
                </Typography>
                <Typography variant="caption" sx={{ color: MUTED, display: "block", mt: 0.5 }}>
>>>>>>> origin/dipak
                  Click here or use the "Upload Photos" button to attach on-site installation pictures
                </Typography>
              </Box>
            )}
          </Paper>

<<<<<<< HEAD
          {/* Information Alert Banner */}
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            sx={{
              p: 1.6,
              borderRadius: 2.5,
              bgcolor: isDark ? "rgba(79, 70, 229, 0.15)" : "#eef2ff",
              color: isDark ? "#e2e8f0" : "#0f172a",
            }}
          >
            <Box
              sx={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                bgcolor: "#4f46e5",
                color: "#ffffff",
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
                fontSize: "0.8rem",
                fontWeight: 800,
              }}
            >
              i
            </Box>
            <Typography sx={{ fontSize: "0.82rem", color: isDark ? "#cbd5e1" : "#1e293b", lineHeight: 1.4 }}>
              Marking status as <strong>Completed Installation</strong> updates the project to <strong>Installation Completion</strong> and advances to <strong>DCR Generation</strong>.
=======
          <Stack direction="row" spacing={1.25} alignItems="center" sx={{ p: 1.75, borderRadius: RADIUS_SM, bgcolor: alpha(BRAND, 0.06), color: INK }}>
            <InfoOutlined sx={{ fontSize: 20, color: BRAND }} />
            <Typography variant="body2">
              Marking status as <strong>Completed Installation</strong> updates the project to <strong>Installation Completion</strong> and advances to DCR Generation.
>>>>>>> origin/dipak
            </Typography>
          </Stack>
        </Stack>
      </Box>

<<<<<<< HEAD
      {/* ── Footer Actions ── */}
      <Stack
        direction="row"
        justifyContent="flex-end"
        spacing={1.5}
        sx={{
          p: 2.5,
          borderTop: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #f1f5f9",
          bgcolor: isDark ? "#0b0f19" : "#ffffff",
        }}
      >
        <Button
          variant="outlined"
          onClick={onCancel}
          sx={{
            minWidth: 110,
            px: 2.5,
            height: 42,
            borderRadius: 999,
            borderColor: isDark ? "rgba(255,255,255,0.2)" : "#cbd5e1",
            color: isDark ? "#cbd5e1" : "#0f172a",
            fontWeight: 700,
            fontSize: "0.88rem",
            textTransform: "none",
            bgcolor: isDark ? "transparent" : "#ffffff",
            "&:hover": {
              borderColor: isDark ? "rgba(255,255,255,0.4)" : "#94a3b8",
              bgcolor: isDark ? "rgba(255,255,255,0.06)" : "#f8fafc",
            },
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          startIcon={<Save sx={{ fontSize: 17 }} />}
          onClick={onSave}
          disabled={saving || !project?._id}
          sx={{
            minWidth: 150,
            px: 3,
            height: 42,
            borderRadius: 999,
            bgcolor: "#4f46e5",
            color: "#ffffff",
            fontWeight: 800,
            fontSize: "0.88rem",
            textTransform: "none",
            boxShadow: "0 6px 18px rgba(79, 70, 229, 0.3)",
            "&:hover": { bgcolor: "#4338ca" },
            "&.Mui-disabled": {
              bgcolor: isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0",
              color: isDark ? "#64748b" : "#94a3b8",
              boxShadow: "none",
            },
          }}
        >
          {saving ? "Updating..." : "Update Status"}
        </Button>
      </Stack>

=======
>>>>>>> origin/dipak
      {/* Manual Add Partner Modal */}
      <Dialog
        open={partnerDialogOpen}
        onClose={() => setPartnerDialogOpen(false)}
        maxWidth="xs"
        fullWidth
<<<<<<< HEAD
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 1,
            bgcolor: isDark ? "#111827" : "#ffffff",
            color: isDark ? "#f8fafc" : "#0f172a",
            border: isDark ? "1px solid rgba(255,255,255,0.1)" : "none",
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, pb: 1, color: isDark ? "#f8fafc" : "#0f172a" }}>
          Add Installation Partner
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: isDark ? "#94a3b8" : "#64748b", mb: 2 }}>
=======
        PaperProps={{ sx: { borderRadius: RADIUS_SM, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>Add Installation Partner</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color={MUTED} sx={{ mb: 2 }}>
>>>>>>> origin/dipak
            Enter the name of the installer / contractor partner for this project:
          </Typography>
          <TextField
            autoFocus
            fullWidth
            size="small"
            label="Partner Name"
            placeholder="e.g. Solar Team A / SunTech EPC"
            value={newPartnerName}
            onChange={(e) => setNewPartnerName(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
<<<<<<< HEAD
          <Button onClick={() => setPartnerDialogOpen(false)} sx={{ textTransform: "none", fontWeight: 700, color: isDark ? "#94a3b8" : "#64748b" }}>
=======
          <Button onClick={() => setPartnerDialogOpen(false)} sx={{ textTransform: "none", fontWeight: 700 }}>
>>>>>>> origin/dipak
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAddPartnerSubmit}
            disabled={!newPartnerName.trim()}
<<<<<<< HEAD
            sx={{ bgcolor: "#4f46e5", fontWeight: 800, textTransform: "none", borderRadius: 999 }}
=======
            sx={{ bgcolor: BRAND, fontWeight: 800, textTransform: "none" }}
>>>>>>> origin/dipak
          >
            Add Partner
          </Button>
        </DialogActions>
      </Dialog>

      {/* Lightbox Modal for Photo Preview */}
      <Dialog
        open={Boolean(previewPhoto)}
        onClose={() => setPreviewPhoto(null)}
        maxWidth="md"
        fullWidth
<<<<<<< HEAD
        PaperProps={{ sx: { borderRadius: 3, bgcolor: "#000", overflow: "hidden" } }}
=======
        PaperProps={{ sx: { borderRadius: RADIUS_SM, bgcolor: "#000", overflow: "hidden" } }}
>>>>>>> origin/dipak
      >
        {previewPhoto && (
          <>
            <DialogTitle sx={{ color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center", py: 1.5, px: 2 }}>
              <Typography variant="subtitle2" noWrap sx={{ color: "#fff", fontWeight: 700 }}>
                {previewPhoto.name || "Installation Photograph"}
              </Typography>
              <IconButton size="small" onClick={() => setPreviewPhoto(null)} sx={{ color: "#fff" }}>
                <Clear sx={{ fontSize: 18 }} />
              </IconButton>
            </DialogTitle>
            <DialogContent sx={{ p: 0, display: "flex", justifyContent: "center", alignItems: "center", maxHeight: "75vh", overflow: "auto" }}>
              <Box
                component="img"
                src={toBackendAssetUrl(previewPhoto.url)}
                alt="Installation photo preview"
                sx={{ maxWidth: "100%", maxHeight: "70vh", objectFit: "contain", display: "block" }}
              />
            </DialogContent>
          </>
        )}
      </Dialog>
<<<<<<< HEAD
=======

      {workflowFooter(onCancel, onSave, saving, "Updating...", saving || !project?._id)}
>>>>>>> origin/dipak
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
  const isBankLoan = (project?.paymentType || "Bank Loan") === "Bank Loan";
  const currentDisbursement =
    DISBURSEMENT_STATUS_OPTIONS.find((status) => status.value === project?.disbursementStatus)?.label ||
    formatStatusLabel(project?.disbursementStatus);

  return (
    <Paper elevation={0} sx={{ borderRadius: RADIUS, border: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${BORDER}`, bgcolor: isDark ? "#0b0e1a" : PANEL, color: isDark ? "#f8fafc" : "inherit", overflow: "hidden", boxShadow: SHADOW_SM }}>
      {workflowStatusHeader(Payments, isBankLoan ? "Phase 1 Loan Disbursement" : "1st Installment / Advance Payment", getCustomerName(project), onCancel)}

      <Box sx={{ p: 2.5 }}>
        <Grid container spacing={2} sx={{ mb: 2.5 }}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" fontWeight={800} color={isDark ? "#f8fafc" : INK} sx={{ mb: 0.75 }}>
              Current Status
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
              Payment Type
            </Typography>
            <Chip
              label={project?.paymentType || "Bank Loan"}
              size="small"
              sx={{ bgcolor: alpha(SUCCESS, 0.1), color: SUCCESS, fontWeight: 800 }}
            />
          </Grid>
        </Grid>

        <Stack spacing={2.5}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label={isBankLoan ? "1st Loan Disbursement Amount *" : "1st Installment / Advance Amount *"}
                placeholder="Enter amount (e.g. 4000)"
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
                label="Payment / Disbursement Date *"
                value={formData.disbursementDate || formatInputDate(new Date())}
                onChange={(event) => onChange("disbursementDate", event.target.value)}
                error={!!errors.disbursementDate}
                helperText={errors.disbursementDate}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth size="small" error={!!errors.disbursementStatus}>
                <InputLabel>Disbursement Status *</InputLabel>
                <Select
                  label="Disbursement Status *"
                  value={formData.disbursementStatus || "completed"}
                  onChange={(event) => onChange("disbursementStatus", event.target.value)}
                  sx={{ borderRadius: RADIUS_SM }}
                >
                  <MenuItem value="completed">
                    <Stack direction="row" spacing={1.25} alignItems="center">
                      <CheckCircle sx={{ fontSize: 17, color: SUCCESS }} />
                      <Box>
                        <Typography variant="body2" fontWeight={700}>Completed / Received</Typography>
                        <Typography variant="caption" sx={{ color: MUTED }}>Amount is received and confirmed</Typography>
                      </Box>
                    </Stack>
                  </MenuItem>
                  <MenuItem value="pending">
                    <Stack direction="row" spacing={1.25} alignItems="center">
                      <Payments sx={{ fontSize: 17, color: WARNING }} />
                      <Box>
                        <Typography variant="body2" fontWeight={700}>Pending</Typography>
                        <Typography variant="caption" sx={{ color: MUTED }}>Payment / loan release is awaiting confirmation</Typography>
                      </Box>
                    </Stack>
                  </MenuItem>
                  <MenuItem value="cancelled">
                    <Stack direction="row" spacing={1.25} alignItems="center">
                      <Clear sx={{ fontSize: 17, color: DANGER }} />
                      <Box>
                        <Typography variant="body2" fontWeight={700}>Cancelled</Typography>
                        <Typography variant="caption" sx={{ color: MUTED }}>Payment / disbursement cancelled</Typography>
                      </Box>
                    </Stack>
                  </MenuItem>
                </Select>
                {errors.disbursementStatus && <FormHelperText>{errors.disbursementStatus}</FormHelperText>}
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                minRows={3}
                size="small"
                label="Notes"
                placeholder="Add remarks or notes about this payment installment..."
                value={formData.disbursementNotes}
                onChange={(event) => onChange("disbursementNotes", event.target.value)}
              />
            </Grid>
          </Grid>
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


// =========================================================================
// STAGE WORKSPACE COMPONENTS (STAGES 8 TO 19)
// =========================================================================


const StageFileUploadCard = ({
  icon: Icon = CloudUpload,
  title,
  subtitle,
  document,
  onUpload,
  uploading,
  readOnly,
  accept = "image/jpeg,image/png,image/jpg,application/pdf",
}) => {
  const fileInputRef = useRef(null);
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const docUrl = document?.url ? toBackendAssetUrl(document.url) : "";
  const docName = document?.name || getFileNameFromUrl(document?.url) || "Document";

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: RADIUS_SM,
        borderColor: isDark ? "rgba(255,255,255,0.08)" : BORDER,
        bgcolor: isDark ? "rgba(255,255,255,0.02)" : "#FAFBFC",
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        hidden
        accept={accept}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file && onUpload) onUpload(file);
        }}
      />
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={1.5}
      >
        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: RADIUS_SM,
              bgcolor: alpha(BRAND, 0.1),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: BRAND,
              flexShrink: 0,
            }}
          >
            <Icon sx={{ fontSize: 20 }} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle2" fontWeight={800} color={isDark ? "#f8fafc" : INK} noWrap>
              {title}
            </Typography>
            <Typography variant="caption" sx={{ color: MUTED }}>
              {subtitle}
            </Typography>
          </Box>
        </Stack>
        <Button
          size="small"
          variant={docUrl ? "outlined" : "contained"}
          startIcon={<CloudUpload sx={{ fontSize: 16 }} />}
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || readOnly}
          sx={{
            borderRadius: RADIUS_SM,
            fontWeight: 700,
            textTransform: "none",
            bgcolor: docUrl ? "transparent" : BRAND,
            color: docUrl ? BRAND : "#fff",
            borderColor: docUrl ? BORDER : "transparent",
            "&:hover": { bgcolor: docUrl ? alpha(BRAND, 0.06) : BRAND_DARK },
          }}
        >
          {uploading ? "Uploading..." : docUrl ? "Replace File" : "Upload File"}
        </Button>
      </Stack>

      {docUrl && (
        <Box
          sx={{
            mt: 1.5,
            p: 1.25,
            borderRadius: RADIUS_SM,
            border: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${BORDER}`,
            bgcolor: isDark ? "#111827" : "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0, flex: 1 }}>
            <InsertDriveFileOutlined sx={{ fontSize: 22, color: BRAND }} />
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography variant="body2" fontWeight={700} color={isDark ? "#f8fafc" : INK} noWrap>
                {docName}
              </Typography>
              <Typography variant="caption" sx={{ color: MUTED_2 }}>
                {document.uploadedAt ? formatDate(document.uploadedAt, "dd MMM yyyy, hh:mm a") : "Uploaded"}
              </Typography>
            </Box>
          </Stack>
          <IconButton
            size="small"
            onClick={() => window.open(docUrl, "_blank", "noopener,noreferrer")}
            sx={{ color: BRAND, p: 0.75 }}
          >
            <OpenInNew sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
      )}
    </Paper>
  );
};

/* ── 8. DCR Generation Workspace ── */
const DcrGenerationWorkspace = ({
  project,
  formData,
  errors,
  saving,
  onChange,
  onCancel,
  onSave,
  onUploadDocument,
  uploadingDoc,
  readOnly = false,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Paper elevation={0} sx={{ borderRadius: RADIUS, border: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${BORDER}`, bgcolor: isDark ? "#0b0e1a" : PANEL, color: isDark ? "#f8fafc" : "inherit", overflow: "hidden", boxShadow: SHADOW_SM }}>
      {workflowStatusHeader(TaskAlt, "DCR Generation", getCustomerName(project), onCancel)}

      <Box sx={{ p: 2.5 }}>
        <Stack spacing={2.5}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small" disabled={readOnly}>
                <InputLabel>DCR Generated? *</InputLabel>
                <Select
                  label="DCR Generated? *"
                  value={formData.dcrGenerated || "No"}
                  onChange={(e) => onChange("dcrGenerated", e.target.value)}
                  sx={{ borderRadius: RADIUS_SM }}
                >
                  <MenuItem value="Yes">Yes</MenuItem>
                  <MenuItem value="No">No</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="DCR Date"
                value={formData.dcrDate || formatInputDate(new Date())}
                onChange={(e) => onChange("dcrDate", e.target.value)}
                disabled={readOnly}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>

          <StageFileUploadCard
            icon={TaskAlt}
            title="DCR Certificate"
            subtitle="Upload official DCR (Domestic Content Requirement) Certificate"
            document={formData.dcrCertificate || project?.dcrCertificate}
            onUpload={(file) => onUploadDocument("dcrCertificate", file)}
            uploading={uploadingDoc}
            readOnly={readOnly}
          />

          <TextField
            fullWidth
            multiline
            minRows={3}
            size="small"
            label="DCR Notes / Remarks"
            placeholder="Add any notes about DCR generation..."
            value={formData.dcrNotes || ""}
            onChange={(e) => onChange("dcrNotes", e.target.value)}
            disabled={readOnly}
          />
        </Stack>
      </Box>

      {workflowFooter(onCancel, onSave, saving, "Saving DCR...", saving || !project?._id)}
    </Paper>
  );
};

/* ── 9. Notification Email Workspace ── */
const NotificationEmailWorkspace = ({
  project,
  formData,
  errors,
  saving,
  onChange,
  onCancel,
  onSave,
  readOnly = false,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Paper elevation={0} sx={{ borderRadius: RADIUS, border: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${BORDER}`, bgcolor: isDark ? "#0b0e1a" : PANEL, color: isDark ? "#f8fafc" : "inherit", overflow: "hidden", boxShadow: SHADOW_SM }}>
      {workflowStatusHeader(EmailOutlined, "Notification Email", getCustomerName(project), onCancel)}

      <Box sx={{ p: 2.5 }}>
        <Stack spacing={2.5}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small" disabled={readOnly}>
                <InputLabel>Email Sent? *</InputLabel>
                <Select
                  label="Email Sent? *"
                  value={formData.notificationEmailSent || "No"}
                  onChange={(e) => onChange("notificationEmailSent", e.target.value)}
                  sx={{ borderRadius: RADIUS_SM }}
                >
                  <MenuItem value="Yes">Yes</MenuItem>
                  <MenuItem value="No">No</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                label="Notification Number (manual) *"
                placeholder="Enter notification number"
                value={formData.notificationNumber || ""}
                onChange={(e) => onChange("notificationNumber", e.target.value)}
                disabled={readOnly}
                error={!!errors.notificationNumber}
                helperText={errors.notificationNumber || "Manual notification reference number"}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Notification Date"
                value={formData.notificationEmailDate || formatInputDate(new Date())}
                onChange={(e) => onChange("notificationEmailDate", e.target.value)}
                disabled={readOnly}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>

          <TextField
            fullWidth
            multiline
            minRows={3}
            size="small"
            label="Notification Email Notes"
            placeholder="Add notes regarding notification email..."
            value={formData.notificationEmailNotes || ""}
            onChange={(e) => onChange("notificationEmailNotes", e.target.value)}
            disabled={readOnly}
          />
        </Stack>
      </Box>

      {workflowFooter(onCancel, onSave, saving, "Saving Notification...", saving || !project?._id)}
    </Paper>
  );
};

/* ── 10. Demand Note Workspace ── */
const DemandNoteWorkspace = ({
  project,
  formData,
  errors,
  saving,
  onChange,
  onCancel,
  onSave,
  readOnly = false,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Paper elevation={0} sx={{ borderRadius: RADIUS, border: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${BORDER}`, bgcolor: isDark ? "#0b0e1a" : PANEL, color: isDark ? "#f8fafc" : "inherit", overflow: "hidden", boxShadow: SHADOW_SM }}>
      {workflowStatusHeader(ReceiptLongOutlined, "Demand Note", getCustomerName(project), onCancel)}

      <Box sx={{ p: 2.5 }}>
        <Stack spacing={2.5}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small" disabled={readOnly}>
                <InputLabel>Demand Note Generated? *</InputLabel>
                <Select
                  label="Demand Note Generated? *"
                  value={formData.demandNoteGenerated || "No"}
                  onChange={(e) => onChange("demandNoteGenerated", e.target.value)}
                  sx={{ borderRadius: RADIUS_SM }}
                >
                  <MenuItem value="Yes">Yes</MenuItem>
                  <MenuItem value="No">No</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                label="Demand Note Number (manual) *"
                placeholder="Enter demand note number"
                value={formData.demandNoteNumber || ""}
                onChange={(e) => onChange("demandNoteNumber", e.target.value)}
                disabled={readOnly}
                error={!!errors.demandNoteNumber}
                helperText={errors.demandNoteNumber || "Manual demand note reference number"}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Demand Note Date"
                value={formData.demandNoteDate || formatInputDate(new Date())}
                onChange={(e) => onChange("demandNoteDate", e.target.value)}
                disabled={readOnly}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>

          <TextField
            fullWidth
            multiline
            minRows={3}
            size="small"
            label="Demand Note Notes"
            placeholder="Add remarks or instructions..."
            value={formData.demandNoteNotes || ""}
            onChange={(e) => onChange("demandNoteNotes", e.target.value)}
            disabled={readOnly}
          />
        </Stack>
      </Box>

      {workflowFooter(onCancel, onSave, saving, "Saving Demand Note...", saving || !project?._id)}
    </Paper>
  );
};

/* ── 11. Demand Note Payment Workspace ── */
const DemandNotePaymentWorkspace = ({
  project,
  formData,
  errors,
  saving,
  onChange,
  onCancel,
  onSave,
  onUploadDocument,
  uploadingDoc,
  readOnly = false,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Paper elevation={0} sx={{ borderRadius: RADIUS, border: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${BORDER}`, bgcolor: isDark ? "#0b0e1a" : PANEL, color: isDark ? "#f8fafc" : "inherit", overflow: "hidden", boxShadow: SHADOW_SM }}>
      {workflowStatusHeader(PaidOutlined, "Demand Note Payment", getCustomerName(project), onCancel)}

      <Box sx={{ p: 2.5 }}>
        <Stack spacing={2.5}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small" disabled={readOnly}>
                <InputLabel>Payment Paid? *</InputLabel>
                <Select
                  label="Payment Paid? *"
                  value={formData.demandNotePaymentPaid || "No"}
                  onChange={(e) => onChange("demandNotePaymentPaid", e.target.value)}
                  sx={{ borderRadius: RADIUS_SM }}
                >
                  <MenuItem value="Yes">Yes</MenuItem>
                  <MenuItem value="No">No</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Payment Amount (₹) *"
                placeholder="Enter paid amount"
                value={formData.demandNotePaymentAmount || ""}
                onChange={(e) => onChange("demandNotePaymentAmount", e.target.value)}
                disabled={readOnly}
                error={!!errors.demandNotePaymentAmount}
                helperText={errors.demandNotePaymentAmount}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><CurrencyRupee sx={{ fontSize: 16 }} /></InputAdornment>,
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Payment Date"
                value={formData.demandNotePaymentDate || formatInputDate(new Date())}
                onChange={(e) => onChange("demandNotePaymentDate", e.target.value)}
                disabled={readOnly}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>

          <StageFileUploadCard
            icon={PaidOutlined}
            title="Upload Payment Receipt"
            subtitle="Upload bank transfer slip, receipt, or acknowledgement for demand note payment"
            document={formData.demandNotePaymentReceipt || project?.demandNotePaymentReceipt}
            onUpload={(file) => onUploadDocument("demandNotePaymentReceipt", file)}
            uploading={uploadingDoc}
            readOnly={readOnly}
          />

          <TextField
            fullWidth
            multiline
            minRows={3}
            size="small"
            label="Payment Notes"
            placeholder="Add transaction reference or notes..."
            value={formData.demandNotePaymentNotes || ""}
            onChange={(e) => onChange("demandNotePaymentNotes", e.target.value)}
            disabled={readOnly}
          />
        </Stack>
      </Box>

      {workflowFooter(onCancel, onSave, saving, "Saving Payment...", saving || !project?._id)}
    </Paper>
  );
};

/* ── 12. Inspection Workspace ── */
const InspectionWorkspace = ({
  project,
  formData,
  errors,
  saving,
  onChange,
  onCancel,
  onSave,
  onUploadDocument,
  uploadingDoc,
  readOnly = false,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Paper elevation={0} sx={{ borderRadius: RADIUS, border: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${BORDER}`, bgcolor: isDark ? "#0b0e1a" : PANEL, color: isDark ? "#f8fafc" : "inherit", overflow: "hidden", boxShadow: SHADOW_SM }}>
      {workflowStatusHeader(FactCheckOutlined, "Inspection", getCustomerName(project), onCancel)}

      <Box sx={{ p: 2.5 }}>
        <Stack spacing={2.5}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small" error={!!errors.inspectionStatus} disabled={readOnly}>
                <InputLabel>Inspection Status *</InputLabel>
                <Select
                  label="Inspection Status *"
                  value={formData.inspectionStatus || "By RESCO"}
                  onChange={(e) => onChange("inspectionStatus", e.target.value)}
                  sx={{ borderRadius: RADIUS_SM }}
                >
                  {INSPECTION_STATUS_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      <Stack direction="row" spacing={1.25} alignItems="center">
                        <FactCheckOutlined sx={{ fontSize: 17, color: BRAND }} />
                        <Box>
                          <Typography variant="body2">{opt.label}</Typography>
                          <Typography variant="caption" sx={{ color: MUTED }}>{opt.description}</Typography>
                        </Box>
                      </Stack>
                    </MenuItem>
                  ))}
                </Select>
                {errors.inspectionStatus && <FormHelperText>{errors.inspectionStatus}</FormHelperText>}
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Inspection Date"
                value={formData.inspectionDate || formatInputDate(new Date())}
                onChange={(e) => onChange("inspectionDate", e.target.value)}
                disabled={readOnly}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>

          <StageFileUploadCard
            icon={FactCheckOutlined}
            title="Upload Inspection Document"
            subtitle="Upload signed inspection report, clearance certificate or approval doc"
            document={formData.inspectionDocument || project?.inspectionDocument}
            onUpload={(file) => onUploadDocument("inspectionDocument", file)}
            uploading={uploadingDoc}
            readOnly={readOnly}
          />

          <TextField
            fullWidth
            multiline
            minRows={3}
            size="small"
            label="Inspection Notes / Observations"
            placeholder="Add inspector comments, findings, or notes..."
            value={formData.inspectionNotes || ""}
            onChange={(e) => onChange("inspectionNotes", e.target.value)}
            disabled={readOnly}
          />
        </Stack>
      </Box>

      {workflowFooter(onCancel, onSave, saving, "Saving Inspection...", saving || !project?._id)}
    </Paper>
  );
};

/* ── 13. Meter Installation Workspace ── */
const MeterInstallationWorkspace = ({
  project,
  formData,
  errors,
  saving,
  onChange,
  onCancel,
  onSave,
  onUploadDocument,
  uploadingDoc,
  readOnly = false,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Paper elevation={0} sx={{ borderRadius: RADIUS, border: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${BORDER}`, bgcolor: isDark ? "#0b0e1a" : PANEL, color: isDark ? "#f8fafc" : "inherit", overflow: "hidden", boxShadow: SHADOW_SM }}>
      {workflowStatusHeader(SpeedOutlined, "Meter Installation", getCustomerName(project), onCancel)}

      <Box sx={{ p: 2.5 }}>
        <Stack spacing={2.5}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small" disabled={readOnly}>
                <InputLabel>Meter Installation Complete? *</InputLabel>
                <Select
                  label="Meter Installation Complete? *"
                  value={formData.meterInstallationComplete || "No"}
                  onChange={(e) => onChange("meterInstallationComplete", e.target.value)}
                  sx={{ borderRadius: RADIUS_SM }}
                >
                  <MenuItem value="Yes">Yes</MenuItem>
                  <MenuItem value="No">No</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {formData.meterInstallationComplete === "Yes" && (
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Meter Installation Date *"
                  value={formData.meterInstallationDate || formatInputDate(new Date())}
                  onChange={(e) => onChange("meterInstallationDate", e.target.value)}
                  disabled={readOnly}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            )}
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <StageFileUploadCard
                icon={PhotoCameraOutlined}
                title="Meter Photograph"
                subtitle="Upload photograph of installed bidirectional net meter"
                document={formData.meterPhotograph || project?.meterPhotograph}
                onUpload={(file) => onUploadDocument("meterPhotograph", file)}
                uploading={uploadingDoc}
                readOnly={readOnly}
                accept="image/jpeg,image/png,image/jpg"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <StageFileUploadCard
                icon={DescriptionOutlined}
                title="Meter Installation Report"
                subtitle="Upload official DISCOM commissioning / meter report"
                document={formData.meterInstallationReport || project?.meterInstallationReport}
                onUpload={(file) => onUploadDocument("meterInstallationReport", file)}
                uploading={uploadingDoc}
                readOnly={readOnly}
              />
            </Grid>
          </Grid>

          <TextField
            fullWidth
            multiline
            minRows={3}
            size="small"
            label="Meter Installation Notes"
            placeholder="Add meter serial number, final readings or remarks..."
            value={formData.meterInstallationNotes || ""}
            onChange={(e) => onChange("meterInstallationNotes", e.target.value)}
            disabled={readOnly}
          />
        </Stack>
      </Box>

      {workflowFooter(onCancel, onSave, saving, "Saving Meter Installation...", saving || !project?._id)}
    </Paper>
  );
};

/* ── 14. Phase 2 Disbursement Workspace ── */
const Phase2DisbursementWorkspace = ({
  project,
  formData,
  errors,
  saving,
  onChange,
  onCancel,
  onSave,
  readOnly = false,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Paper elevation={0} sx={{ borderRadius: RADIUS, border: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${BORDER}`, bgcolor: isDark ? "#0b0e1a" : PANEL, color: isDark ? "#f8fafc" : "inherit", overflow: "hidden", boxShadow: SHADOW_SM }}>
      {workflowStatusHeader(AccountBalanceOutlined, "Phase 2 Disbursement", getCustomerName(project), onCancel)}

      <Box sx={{ p: 2.5 }}>
        <Stack spacing={2.5}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small" disabled={readOnly}>
                <InputLabel>Second Installment Paid? *</InputLabel>
                <Select
                  label="Second Installment Paid? *"
                  value={formData.phase2DisbursementPaid || "No"}
                  onChange={(e) => onChange("phase2DisbursementPaid", e.target.value)}
                  sx={{ borderRadius: RADIUS_SM }}
                >
                  <MenuItem value="Yes">Yes</MenuItem>
                  <MenuItem value="No">No</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small" disabled={readOnly}>
                <InputLabel>Lead Status *</InputLabel>
                <Select
                  label="Lead Status *"
                  value={formData.phase2LeadStatus || "Phase 2 Disbursement"}
                  onChange={(e) => onChange("phase2LeadStatus", e.target.value)}
                  sx={{ borderRadius: RADIUS_SM }}
                >
                  {PHASE2_LEAD_STATUS_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      <Stack direction="row" spacing={1.25} alignItems="center">
                        <AccountBalanceOutlined sx={{ fontSize: 17, color: BRAND }} />
                        <Box>
                          <Typography variant="body2">{opt.label}</Typography>
                          <Typography variant="caption" sx={{ color: MUTED }}>{opt.description}</Typography>
                        </Box>
                      </Stack>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Disbursement Amount (₹) *"
                placeholder="Enter 2nd installment amount"
                value={formData.phase2DisbursementAmount || ""}
                onChange={(e) => onChange("phase2DisbursementAmount", e.target.value)}
                disabled={readOnly}
                error={!!errors.phase2DisbursementAmount}
                helperText={errors.phase2DisbursementAmount}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><CurrencyRupee sx={{ fontSize: 16 }} /></InputAdornment>,
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Disbursement Date"
                value={formData.phase2DisbursementDate || formatInputDate(new Date())}
                onChange={(e) => onChange("phase2DisbursementDate", e.target.value)}
                disabled={readOnly}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>

          <TextField
            fullWidth
            multiline
            minRows={3}
            size="small"
            label="Phase 2 Disbursement Notes"
            placeholder="Add bank settlement, loan release details or notes..."
            value={formData.phase2DisbursementNotes || ""}
            onChange={(e) => onChange("phase2DisbursementNotes", e.target.value)}
            disabled={readOnly}
          />
        </Stack>
      </Box>

      {workflowFooter(onCancel, onSave, saving, "Saving Phase 2...", saving || !project?._id)}
    </Paper>
  );
};


/* ── 15. Final Payment Workspace ── */
const FinalPaymentWorkspace = ({
  project,
  formData,
  errors,
  saving,
  onChange,
  onCancel,
  onSave,
  readOnly = false,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  // Itemized payment breakdown from stages
  const stage04Cost = Number(project?.paymentAmount || project?.loanAmount || 0);
  const payment1stInstallment = Number(project?.disbursementAmount || 0);
  const payment2ndInstallment = Number(project?.phase2DisbursementAmount || 0);

  // Installments collected from customer / bank (Demand Note is a DISCOM fee and not part of contract installments)
  const installmentsCollectedSum = payment1stInstallment + payment2ndInstallment;

  // Look up quotation cost for lead if available
  const quote = project?._id ? getAcceptedOrLatestQuotation(project._id) : null;
  const quoteCost = Number(quote?.totalCost) || Number(quote?.form?.totalCost) || 0;

  // Determine project cost
  const cost =
    Number(formData.finalPaymentCost) ||
    Number(project?.finalPaymentCost) ||
    Number(project?.projectSaleValue) ||
    Number(project?.totalProjectCost) ||
    (quoteCost > 0 ? quoteCost : 0) ||
    Number(project?.agreedPrice) ||
    (stage04Cost > 0 ? stage04Cost : 0) ||
    (installmentsCollectedSum > 0 ? installmentsCollectedSum : 0);

  // If installments were entered, default received is the sum of installments.
  // If no installments were entered but stage 04 was recorded as direct full payment, default is stage04Cost.
  const hasInstallments = payment1stInstallment > 0 || payment2ndInstallment > 0;
  const defaultReceived = hasInstallments
    ? installmentsCollectedSum
    : (stage04Cost > 0 ? stage04Cost : installmentsCollectedSum);

  const received =
    (formData.finalPaymentTotalReceived !== "" && formData.finalPaymentTotalReceived !== undefined)
      ? Number(formData.finalPaymentTotalReceived)
      : (Number(project?.finalPaymentTotalReceived) || Number(project?.totalPaymentReceived) || defaultReceived);

  const due = Math.max(0, cost - received);
  const isFullyCleared = due <= 0;

  const handleNewPaymentApply = (amount) => {
    const val = Number(amount) || 0;
    if (val <= 0) return;
    const newTotal = received + val;
    const newDue = Math.max(0, cost - newTotal);
    onChange("finalPaymentTotalReceived", newTotal);
    onChange("finalPaymentDue", newDue);
    if (newDue <= 0) {
      onChange("duePaymentCleared", "Yes");
      if (!formData.duePaymentClearanceDate) {
        onChange("duePaymentClearanceDate", format(new Date(), "yyyy-MM-dd"));
      }
    }
    onChange("newPaymentAmount", "");
  };

  const isBankLoan = (project?.paymentType || "Bank Loan") === "Bank Loan";

  const paymentItems = [
    ...(hasInstallments ? [] : [
      {
        title: "Stage 04: Full / Token Payment",
        amount: stage04Cost,
        date: project?.paymentDate,
        mode: project?.paymentType || "Cash / Online",
        ref: project?.paymentReference || project?.transactionId || project?.chequeNumber || "",
        notes: project?.loanNotes || "",
        status: project?.paymentStatus || "completed",
        icon: Payments,
        accent: "#3B82F6",
        show: stage04Cost > 0,
      }
    ]),
    {
      title: "Stage 05: 1st Installment / Advance Payment",
      amount: payment1stInstallment,
      date: project?.disbursementDate,
      mode: isBankLoan ? "Bank Disbursement" : "Customer 1st Installment (Cash / Online)",
      ref: project?.disbursementBankDetails?.bank ? `${project.disbursementBankDetails.bank} - ${project.disbursementBankDetails.branchName || ""}` : "",
      notes: project?.disbursementNotes || "",
      status: isCompletedStatus(project?.disbursementStatus) || payment1stInstallment > 0 ? "Paid" : "Pending",
      icon: AccountBalance,
      accent: "#10B981",
      show: payment1stInstallment > 0 || isCompletedStatus(project?.disbursementStatus),
    },
    {
      title: "Stage 13 / 14: 2nd Installment / Phase 2 Disbursement",
      amount: payment2ndInstallment,
      date: project?.phase2DisbursementDate,
      mode: isBankLoan ? "Bank 2nd Disbursement" : "Customer 2nd Installment",
      ref: "",
      notes: project?.phase2DisbursementNotes || "",
      status: project?.phase2DisbursementPaid === "Yes" || payment2ndInstallment > 0 ? "Paid" : "Pending",
      icon: PaidOutlined,
      accent: "#8B5CF6",
      show: payment2ndInstallment > 0 || project?.phase2DisbursementPaid === "Yes",
    },
  ].filter((item) => item.show !== false);

  return (
    <Paper elevation={0} sx={{ borderRadius: RADIUS, border: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${BORDER}`, bgcolor: isDark ? "#0b0e1a" : PANEL, color: isDark ? "#f8fafc" : "inherit", overflow: "hidden", boxShadow: SHADOW_SM }}>
      {workflowStatusHeader(PriceCheckOutlined, "Final Payment & Settlement", getCustomerName(project), onCancel)}

      <Box sx={{ p: 2.5 }}>
        <Stack spacing={2.5}>
          {/* Quick Metrics Cards */}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: RADIUS_SM, bgcolor: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc", textAlign: "center", border: `1.5px solid ${alpha(BRAND, 0.2)}` }}>
                <Typography variant="caption" fontWeight={700} sx={{ color: MUTED }}>Total Project Cost</Typography>
                <Typography variant="h6" fontWeight={800} sx={{ color: BRAND, mt: 0.5 }}>₹ {cost.toLocaleString("en-IN")}</Typography>
                <Typography variant="caption" sx={{ color: MUTED_2 }}>Agreed Project Value</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: RADIUS_SM, bgcolor: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc", textAlign: "center", border: `1.5px solid ${alpha(SUCCESS, 0.2)}` }}>
                <Typography variant="caption" fontWeight={700} sx={{ color: MUTED }}>Total Received (All Installments)</Typography>
                <Typography variant="h6" fontWeight={800} sx={{ color: SUCCESS, mt: 0.5 }}>₹ {received.toLocaleString("en-IN")}</Typography>
                <Typography variant="caption" sx={{ color: SUCCESS, fontWeight: 700 }}>
                  {cost > 0 ? `${Math.min(100, Math.round((received / cost) * 100))}%` : "100%"} Collected
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: RADIUS_SM, bgcolor: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc", textAlign: "center", border: `1.5px solid ${isFullyCleared ? alpha(SUCCESS, 0.2) : alpha(DANGER, 0.2)}` }}>
                <Typography variant="caption" fontWeight={700} sx={{ color: MUTED }}>Remaining Due Balance</Typography>
                <Typography variant="h6" fontWeight={800} sx={{ color: isFullyCleared ? SUCCESS : DANGER, mt: 0.5 }}>₹ {due.toLocaleString("en-IN")}</Typography>
                <Typography variant="caption" sx={{ color: isFullyCleared ? SUCCESS : DANGER, fontWeight: 700 }}>
                  {isFullyCleared ? "Fully Settled ✓" : "Payment Pending"}
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* 📋 Itemized Payment History & Breakdown Table */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: RADIUS_SM, bgcolor: isDark ? "rgba(255,255,255,0.02)" : "#FAFAFC" }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <ReceiptLongOutlined sx={{ fontSize: 20, color: BRAND }} />
                <Typography variant="subtitle2" fontWeight={800} color={isDark ? "#f8fafc" : INK}>
                  Payment Installments Given by Customer
                </Typography>
              </Stack>
              <Chip
                label={`Total Collected: ₹ ${received.toLocaleString("en-IN")}`}
                size="small"
                sx={{ fontWeight: 800, bgcolor: alpha(SUCCESS, 0.12), color: SUCCESS, borderRadius: RADIUS_SM }}
              />
            </Stack>

            <Stack spacing={1.25}>
              {paymentItems.map((item, idx) => {
                const ItemIcon = item.icon;
                const hasAmount = item.amount > 0;
                return (
                  <Paper
                    key={idx}
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      borderRadius: RADIUS_SM,
                      bgcolor: isDark ? (hasAmount ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.01)") : (hasAmount ? "#FFFFFF" : "#F4F5F8"),
                      border: `1px solid ${hasAmount ? alpha(item.accent, 0.3) : (isDark ? "rgba(255,255,255,0.06)" : BORDER_SOFT)}`,
                    }}
                  >
                    <Grid container spacing={1.5} alignItems="center">
                      <Grid item xs={12} sm={5}>
                        <Stack direction="row" spacing={1.25} alignItems="center">
                          <Box sx={{ width: 32, height: 32, borderRadius: 1, bgcolor: alpha(item.accent, 0.12), color: item.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <ItemIcon sx={{ fontSize: 18 }} />
                          </Box>
                          <Box>
                            <Typography variant="body2" fontWeight={800} color={isDark ? "#f8fafc" : INK}>
                              {item.title}
                            </Typography>
                            <Typography variant="caption" sx={{ color: MUTED_2 }}>
                              {item.mode} {item.ref ? `· ${item.ref}` : ""}
                            </Typography>
                          </Box>
                        </Stack>
                      </Grid>

                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" sx={{ color: MUTED_2, display: "block" }}>Date Recorded</Typography>
                        <Typography variant="caption" fontWeight={700} color={isDark ? "#f8fafc" : INK}>
                          {item.date ? formatDate(item.date) : "Not recorded"}
                        </Typography>
                      </Grid>

                      <Grid item xs={6} sm={4} sx={{ textAlign: { sm: "right" } }}>
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="flex-end" alignItems={{ sm: "center" }}>
                          <Typography variant="subtitle2" fontWeight={800} sx={{ color: hasAmount ? SUCCESS : MUTED_2 }}>
                            ₹ {item.amount.toLocaleString("en-IN")}
                          </Typography>
                          <Chip
                            label={hasAmount ? (item.status === "Paid" || item.status === "completed" ? "Paid ✓" : item.status) : "Not Paid"}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: 10,
                              fontWeight: 800,
                              bgcolor: hasAmount ? alpha(SUCCESS, 0.12) : alpha(MUTED_2, 0.12),
                              color: hasAmount ? SUCCESS : MUTED_2,
                            }}
                          />
                        </Stack>
                      </Grid>
                    </Grid>
                  </Paper>
                );
              })}
            </Stack>
          </Paper>

          {/* Form Inputs for Cost and Settlement */}
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Total Project Cost (₹) *"
                placeholder="e.g. 150000"
                value={formData.finalPaymentCost || ""}
                onChange={(e) => {
                  const newCost = e.target.value;
                  onChange("finalPaymentCost", newCost);
                  const c = Number(newCost) || 0;
                  const d = Math.max(0, c - received);
                  onChange("finalPaymentDue", d);
                  if (d <= 0 && c > 0) onChange("duePaymentCleared", "Yes");
                }}
                disabled={readOnly}
                helperText="Total agreed project / contract value"
                InputProps={{
                  startAdornment: <InputAdornment position="start"><CurrencyRupee sx={{ fontSize: 16 }} /></InputAdornment>,
                }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Total Payment Received (₹) *"
                value={formData.finalPaymentTotalReceived || ""}
                onChange={(e) => {
                  const newRec = e.target.value;
                  onChange("finalPaymentTotalReceived", newRec);
                  const r = Number(newRec) || 0;
                  const d = Math.max(0, cost - r);
                  onChange("finalPaymentDue", d);
                  if (d <= 0) {
                    onChange("duePaymentCleared", "Yes");
                  }
                }}
                disabled={readOnly}
                helperText="Sum of advance + installments collected"
                InputProps={{
                  startAdornment: <InputAdornment position="start"><CurrencyRupee sx={{ fontSize: 16 }} /></InputAdornment>,
                }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Due Payment (₹) (Auto-calculated)"
                value={due}
                disabled
                helperText={isFullyCleared ? "All payment cleared" : `₹ ${due.toLocaleString("en-IN")} pending`}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><CurrencyRupee sx={{ fontSize: 16 }} /></InputAdornment>,
                }}
              />
            </Grid>

            {/* Quick add payment entry */}
            {!readOnly && due > 0 && (
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: RADIUS_SM, bgcolor: alpha(BRAND, 0.04), borderColor: alpha(BRAND, 0.2) }}>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems="center">
                    <TextField
                      size="small"
                      type="number"
                      label="Record Additional Payment (₹)"
                      placeholder={`Remaining: ₹ ${due}`}
                      value={formData.newPaymentAmount || ""}
                      onChange={(e) => onChange("newPaymentAmount", e.target.value)}
                      sx={{ flex: 1 }}
                      InputProps={{
                        startAdornment: <InputAdornment position="start"><CurrencyRupee sx={{ fontSize: 16 }} /></InputAdornment>,
                      }}
                    />
                    <Button
                      variant="contained"
                      onClick={() => handleNewPaymentApply(formData.newPaymentAmount || due)}
                      disabled={Number(formData.newPaymentAmount || due) <= 0}
                      sx={{ borderRadius: RADIUS_SM, textTransform: "none", fontWeight: 700, bgcolor: BRAND }}
                    >
                      {formData.newPaymentAmount ? "Apply Payment" : `Clear Full Balance (₹ ${due})`}
                    </Button>
                  </Stack>
                  <Typography variant="caption" sx={{ color: MUTED, mt: 0.75, display: "block" }}>
                    Applying adds to Total Payment Received and automatically settles the Due Payment.
                  </Typography>
                </Paper>
              </Grid>
            )}

            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small" disabled={readOnly}>
                <InputLabel>Due Payment Cleared? *</InputLabel>
                <Select
                  label="Due Payment Cleared? *"
                  value={formData.duePaymentCleared || (due <= 0 ? "Yes" : "No")}
                  onChange={(e) => {
                    const nextVal = e.target.value;
                    onChange("duePaymentCleared", nextVal);
                    if (nextVal === "Yes" && !formData.duePaymentClearanceDate) {
                      onChange("duePaymentClearanceDate", format(new Date(), "yyyy-MM-dd"));
                    }
                  }}
                  sx={{ borderRadius: RADIUS_SM }}
                >
                  <MenuItem value="Yes">Yes (Fully Cleared)</MenuItem>
                  <MenuItem value="No">No (Balance Pending)</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Final Clearance Date"
                value={formData.duePaymentClearanceDate || formatInputDate(new Date())}
                onChange={(e) => onChange("duePaymentClearanceDate", e.target.value)}
                disabled={readOnly}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>

          <TextField
            fullWidth
            multiline
            minRows={3}
            size="small"
            label="Final Payment Notes / Settlement Remarks"
            placeholder="Add any payment clearance notes or bank settlement remarks..."
            value={formData.finalPaymentNotes || ""}
            onChange={(e) => onChange("finalPaymentNotes", e.target.value)}
            disabled={readOnly}
          />
        </Stack>
      </Box>

      {workflowFooter(onCancel, onSave, saving, "Saving Final Payment...", saving || !project?._id)}
    </Paper>
  );
};

/* ── 16. Project Commissioning Workspace ── */
const ProjectCommissioningWorkspace = ({
  project,
  formData,
  errors,
  saving,
  onChange,
  onCancel,
  onSave,
  readOnly = false,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Paper elevation={0} sx={{ borderRadius: RADIUS, border: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${BORDER}`, bgcolor: isDark ? "#0b0e1a" : PANEL, color: isDark ? "#f8fafc" : "inherit", overflow: "hidden", boxShadow: SHADOW_SM }}>
      {workflowStatusHeader(VerifiedOutlined, "Project Commissioning", getCustomerName(project), onCancel)}

      <Box sx={{ p: 2.5 }}>
        <Stack spacing={2.5}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small" disabled={readOnly}>
                <InputLabel>Project Commissioning Submit Status *</InputLabel>
                <Select
                  label="Project Commissioning Submit Status *"
                  value={formData.projectCommissioningStatus || "No"}
                  onChange={(e) => {
                    const nextVal = e.target.value;
                    onChange("projectCommissioningStatus", nextVal);
                    if (nextVal === "Yes" && !formData.projectCommissioningDate) {
                      onChange("projectCommissioningDate", format(new Date(), "yyyy-MM-dd"));
                    }
                  }}
                  sx={{ borderRadius: RADIUS_SM }}
                >
                  <MenuItem value="Yes">Yes</MenuItem>
                  <MenuItem value="No">No</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Commissioning Submit Date"
                value={formData.projectCommissioningDate || formatInputDate(new Date())}
                onChange={(e) => onChange("projectCommissioningDate", e.target.value)}
                disabled={readOnly}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>

          <TextField
            fullWidth
            multiline
            minRows={3}
            size="small"
            label="Commissioning Notes / Remarks"
            placeholder="Add project commissioning report notes or submission details..."
            value={formData.projectCommissioningNotes || ""}
            onChange={(e) => onChange("projectCommissioningNotes", e.target.value)}
            disabled={readOnly}
          />
        </Stack>
      </Box>

      {workflowFooter(onCancel, onSave, saving, "Saving Commissioning...", saving || !project?._id)}
    </Paper>
  );
};

/* ── 17. DISCOM Approval Workspace ── */
const DiscomApprovalWorkspace = ({
  project,
  formData,
  errors,
  saving,
  onChange,
  onCancel,
  onSave,
  readOnly = false,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Paper elevation={0} sx={{ borderRadius: RADIUS, border: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${BORDER}`, bgcolor: isDark ? "#0b0e1a" : PANEL, color: isDark ? "#f8fafc" : "inherit", overflow: "hidden", boxShadow: SHADOW_SM }}>
      {workflowStatusHeader(TaskAlt, "DISCOM Approval", getCustomerName(project), onCancel)}

      <Box sx={{ p: 2.5 }}>
        <Stack spacing={2.5}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small" disabled={readOnly}>
                <InputLabel>DISCOM Approval Status *</InputLabel>
                <Select
                  label="DISCOM Approval Status *"
                  value={formData.discomApprovalStatus || "No"}
                  onChange={(e) => {
                    const nextVal = e.target.value;
                    onChange("discomApprovalStatus", nextVal);
                    if (nextVal === "Yes" && !formData.discomApprovalDate) {
                      onChange("discomApprovalDate", format(new Date(), "yyyy-MM-dd"));
                    }
                  }}
                  sx={{ borderRadius: RADIUS_SM }}
                >
                  <MenuItem value="Yes">Yes</MenuItem>
                  <MenuItem value="No">No</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="DISCOM Approval Date"
                value={formData.discomApprovalDate || formatInputDate(new Date())}
                onChange={(e) => onChange("discomApprovalDate", e.target.value)}
                disabled={readOnly}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>

          <TextField
            fullWidth
            multiline
            minRows={3}
            size="small"
            label="DISCOM Approval Notes / Sanction Ref"
            placeholder="Add approval letter number, DISCOM division, or notes..."
            value={formData.discomApprovalNotes || ""}
            onChange={(e) => onChange("discomApprovalNotes", e.target.value)}
            disabled={readOnly}
          />
        </Stack>
      </Box>

      {workflowFooter(onCancel, onSave, saving, "Saving DISCOM Approval...", saving || !project?._id)}
    </Paper>
  );
};

/* ── 18. Subsidy Redeemed Workspace ── */
const SubsidyRedeemedWorkspace = ({
  project,
  formData,
  errors,
  saving,
  onChange,
  onCancel,
  onSave,
  readOnly = false,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Paper elevation={0} sx={{ borderRadius: RADIUS, border: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${BORDER}`, bgcolor: isDark ? "#0b0e1a" : PANEL, color: isDark ? "#f8fafc" : "inherit", overflow: "hidden", boxShadow: SHADOW_SM }}>
      {workflowStatusHeader(RedeemOutlined, "Subsidy Redeemed", getCustomerName(project), onCancel)}

      <Box sx={{ p: 2.5 }}>
        <Stack spacing={2.5}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small" disabled={readOnly}>
                <InputLabel>Subsidy Redeemed Status *</InputLabel>
                <Select
                  label="Subsidy Redeemed Status *"
                  value={formData.subsidyRedeemedStatus || "No"}
                  onChange={(e) => {
                    const nextVal = e.target.value;
                    onChange("subsidyRedeemedStatus", nextVal);
                    if (nextVal === "Yes" && !formData.subsidyRedeemedDate) {
                      onChange("subsidyRedeemedDate", format(new Date(), "yyyy-MM-dd"));
                    }
                  }}
                  sx={{ borderRadius: RADIUS_SM }}
                >
                  <MenuItem value="Yes">Yes</MenuItem>
                  <MenuItem value="No">No</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Subsidy Redeemed Date"
                value={formData.subsidyRedeemedDate || formatInputDate(new Date())}
                onChange={(e) => onChange("subsidyRedeemedDate", e.target.value)}
                disabled={readOnly}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>

          <TextField
            fullWidth
            multiline
            minRows={3}
            size="small"
            label="Subsidy Redemption Notes / Portal Claim Ref"
            placeholder="Add National Portal claim ID, redemption remarks..."
            value={formData.subsidyRedeemedNotes || ""}
            onChange={(e) => onChange("subsidyRedeemedNotes", e.target.value)}
            disabled={readOnly}
          />
        </Stack>
      </Box>

      {workflowFooter(onCancel, onSave, saving, "Saving Subsidy Redeemed...", saving || !project?._id)}
    </Paper>
  );
};

/* ── 19. Subsidy Received Workspace ── */
const SubsidyReceivedWorkspace = ({
  project,
  formData,
  errors,
  saving,
  onChange,
  onCancel,
  onSave,
  readOnly = false,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Paper elevation={0} sx={{ borderRadius: RADIUS, border: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${BORDER}`, bgcolor: isDark ? "#0b0e1a" : PANEL, color: isDark ? "#f8fafc" : "inherit", overflow: "hidden", boxShadow: SHADOW_SM }}>
      {workflowStatusHeader(MonetizationOnOutlined, "Subsidy Received", getCustomerName(project), onCancel)}

      <Box sx={{ p: 2.5 }}>
        <Stack spacing={2.5}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small" disabled={readOnly}>
                <InputLabel>Subsidy Received Status *</InputLabel>
                <Select
                  label="Subsidy Received Status *"
                  value={formData.subsidyReceivedStatus || "No"}
                  onChange={(e) => {
                    const nextVal = e.target.value;
                    onChange("subsidyReceivedStatus", nextVal);
                    if (nextVal === "Yes" && !formData.subsidyReceivedDate) {
                      onChange("subsidyReceivedDate", format(new Date(), "yyyy-MM-dd"));
                    }
                  }}
                  sx={{ borderRadius: RADIUS_SM }}
                >
                  <MenuItem value="Yes">Yes</MenuItem>
                  <MenuItem value="No">No</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Subsidy Amount Received (₹)"
                placeholder="Enter received subsidy"
                value={formData.subsidyReceivedAmount || ""}
                onChange={(e) => onChange("subsidyReceivedAmount", e.target.value)}
                disabled={readOnly}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><CurrencyRupee sx={{ fontSize: 16 }} /></InputAdornment>,
                }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Subsidy Received Date"
                value={formData.subsidyReceivedDate || formatInputDate(new Date())}
                onChange={(e) => onChange("subsidyReceivedDate", e.target.value)}
                disabled={readOnly}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>

          <TextField
            fullWidth
            multiline
            minRows={3}
            size="small"
            label="Subsidy Credit Notes / Bank Account Details"
            placeholder="Add DBT credit reference, bank credit date or notes..."
            value={formData.subsidyReceivedNotes || ""}
            onChange={(e) => onChange("subsidyReceivedNotes", e.target.value)}
            disabled={readOnly}
          />

          <Alert severity="success" icon={<CheckCircle sx={{ fontSize: 18 }} />} sx={{ borderRadius: RADIUS_SM, py: 0.75 }}>
            Updating this final stage completes the project workflow and transitions the project to <strong>Ready Handover</strong>.
          </Alert>
        </Stack>
      </Box>

      {workflowFooter(onCancel, onSave, saving, "Saving & Moving to Ready Handover...", saving || !project?._id)}
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
<<<<<<< HEAD
  const isWorksheetProject = initialProject?.source === "installerWorksheet" || String(projectId || "").startsWith("worksheet-");
=======
  const isWorksheetProject = initialProject?.source === "installerWorksheet";
>>>>>>> origin/dipak

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
    dateOfRegistration: formatInputDate(new Date()),
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
    paymentDate: formatInputDate(new Date()),
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
    installationDate: formatInputDate(new Date()),
    installationNotes: "",
  });
  const [installationErrors, setInstallationErrors] = useState({});
  const [savingInstallation, setSavingInstallation] = useState(false);
  const [disbursementForm, setDisbursementForm] = useState({
    disbursementStatus: "pending",
    status: "Disbursement",
    disbursementAmount: "",
    disbursementDate: formatInputDate(new Date()),
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

  const [dcrForm, setDcrForm] = useState({
    dcrGenerated: "No",
    dcrCertificate: null,
    dcrDate: formatInputDate(new Date()),
    dcrNotes: "",
  });
  const [dcrErrors, setDcrErrors] = useState({});
  const [savingDcr, setSavingDcr] = useState(false);

  const [notificationEmailForm, setNotificationEmailForm] = useState({
    notificationEmailSent: "No",
    notificationNumber: "",
    notificationEmailDate: formatInputDate(new Date()),
    notificationEmailNotes: "",
  });
  const [notificationEmailErrors, setNotificationEmailErrors] = useState({});
  const [savingNotificationEmail, setSavingNotificationEmail] = useState(false);

  const [demandNoteForm, setDemandNoteForm] = useState({
    demandNoteGenerated: "No",
    demandNoteNumber: "",
    demandNoteDate: formatInputDate(new Date()),
    demandNoteNotes: "",
  });
  const [demandNoteErrors, setDemandNoteErrors] = useState({});
  const [savingDemandNote, setSavingDemandNote] = useState(false);

  const [demandNotePaymentForm, setDemandNotePaymentForm] = useState({
    demandNotePaymentPaid: "No",
    demandNotePaymentAmount: "",
    demandNotePaymentReceipt: null,
    demandNotePaymentDate: formatInputDate(new Date()),
    demandNotePaymentNotes: "",
  });
  const [demandNotePaymentErrors, setDemandNotePaymentErrors] = useState({});
  const [savingDemandNotePayment, setSavingDemandNotePayment] = useState(false);

  const [inspectionForm, setInspectionForm] = useState({
    inspectionStatus: "By RESCO",
    inspectionDocument: null,
    inspectionDate: formatInputDate(new Date()),
    inspectionNotes: "",
  });
  const [inspectionErrors, setInspectionErrors] = useState({});
  const [savingInspection, setSavingInspection] = useState(false);

  const [meterInstallationForm, setMeterInstallationForm] = useState({
    meterInstallationComplete: "No",
    meterInstallationDate: formatInputDate(new Date()),
    meterPhotograph: null,
    meterInstallationReport: null,
    meterInstallationNotes: "",
  });
  const [meterInstallationErrors, setMeterInstallationErrors] = useState({});
  const [savingMeterInstallation, setSavingMeterInstallation] = useState(false);

  const [phase2DisbursementForm, setPhase2DisbursementForm] = useState({
    phase2DisbursementPaid: "No",
    phase2DisbursementAmount: "",
    phase2DisbursementDate: formatInputDate(new Date()),
    phase2LeadStatus: "Phase 2 Disbursement",
    phase2DisbursementNotes: "",
  });
  const [phase2DisbursementErrors, setPhase2DisbursementErrors] = useState({});
  const [savingPhase2Disbursement, setSavingPhase2Disbursement] = useState(false);

  const [finalPaymentForm, setFinalPaymentForm] = useState({
    finalPaymentCost: "",
    finalPaymentTotalReceived: "",
    finalPaymentDue: 0,
    duePaymentCleared: "No",
    duePaymentClearanceDate: formatInputDate(new Date()),
    finalPaymentNotes: "",
    newPaymentAmount: "",
  });
  const [finalPaymentErrors, setFinalPaymentErrors] = useState({});
  const [savingFinalPayment, setSavingFinalPayment] = useState(false);

  const [projectCommissioningForm, setProjectCommissioningForm] = useState({
    projectCommissioningStatus: "No",
    projectCommissioningDate: formatInputDate(new Date()),
    projectCommissioningNotes: "",
  });
  const [projectCommissioningErrors, setProjectCommissioningErrors] = useState({});
  const [savingProjectCommissioning, setSavingProjectCommissioning] = useState(false);

  const [discomApprovalForm, setDiscomApprovalForm] = useState({
    discomApprovalStatus: "No",
    discomApprovalDate: formatInputDate(new Date()),
    discomApprovalNotes: "",
  });
  const [discomApprovalErrors, setDiscomApprovalErrors] = useState({});
  const [savingDiscomApproval, setSavingDiscomApproval] = useState(false);

  const [subsidyRedeemedForm, setSubsidyRedeemedForm] = useState({
    subsidyRedeemedStatus: "No",
    subsidyRedeemedDate: formatInputDate(new Date()),
    subsidyRedeemedNotes: "",
  });
  const [subsidyRedeemedErrors, setSubsidyRedeemedErrors] = useState({});
  const [savingSubsidyRedeemed, setSavingSubsidyRedeemed] = useState(false);

  const [subsidyReceivedForm, setSubsidyReceivedForm] = useState({
    subsidyReceivedStatus: "No",
    subsidyReceivedDate: formatInputDate(new Date()),
    subsidyReceivedAmount: "",
    subsidyReceivedNotes: "",
  });
  const [subsidyReceivedErrors, setSubsidyReceivedErrors] = useState({});
  const [savingSubsidyReceived, setSavingSubsidyReceived] = useState(false);

  const [uploadingStageDoc, setUploadingStageDoc] = useState(false);
  const [documentUploadLinks, setDocumentUploadLinks] = useState([]);
  const [pendingUploadSlot, setPendingUploadSlot] = useState("");
  const [uploadingSlotKey, setUploadingSlotKey] = useState("");
  const [previewDoc, setPreviewDoc] = useState(null);
  const [previewImageZoomed, setPreviewImageZoomed] = useState(false);
  const documentFileInputRef = useRef(null);
  const hasInitialProjectRef = useRef(Boolean(location.state?.project));

  const fetchProject = useCallback(async () => {
<<<<<<< HEAD
    if (isWorksheetProject && hasInitialProjectRef.current) {
=======
    if (isWorksheetProject) {
>>>>>>> origin/dipak
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
    dateOfRegistration: formatInputDate(source?.dateOfRegistration || source?.createdAt) || formatInputDate(new Date()),
    registrationStatus: source?.registrationStatus || "inProgress",
    registrationNotes: source?.registrationNotes || "",
    status: source?.status || "Registration",
  }), []);

  const getPaymentForm = useCallback((source) => ({
    paymentType: source?.paymentType || "Bank Loan",
    paymentAmount: source?.paymentAmount ? String(source.paymentAmount) : "",
    paymentDate: formatInputDate(source?.paymentDate) || formatInputDate(new Date()),
    paymentReference: source?.paymentReference || "",
    paymentStatus: source?.paymentStatus || "pending",
    loanAmount: source?.loanAmount ? String(source.loanAmount) : "",
    bank: source?.bank || "",
    branchName: source?.branchName || "",
    loanStatus: source?.loanStatus || "pending",
    loanApprovalDate: formatInputDate(source?.loanApprovalDate) || formatInputDate(new Date()),
    loanReferenceNumber: source?.loanReferenceNumber || "",
    transactionId: source?.transactionId || "",
    chequeNumber: source?.chequeNumber || "",
    chequeDate: formatInputDate(source?.chequeDate) || formatInputDate(new Date()),
    loanNotes: source?.loanNotes || "",
    status: source?.paymentType === "Cash" ? "Disbursement" : source?.status || "Bank Loan Apply",
  }), []);

  const getInstallationForm = useCallback((source) => {
    let normStatus = source?.installationStatus || "pending_installation";
    if (["installation_completed", "Completed Installation", "completed", "final_payment"].includes(normStatus)) {
      normStatus = "installation_completed";
    } else {
      normStatus = "pending_installation";
    }
    return {
      installationStatus: normStatus,
      status: normStatus === "installation_completed" ? "Installation Completion" : (source?.status || "Pending Installation"),
      installationPartner: source?.installationPartner || source?.installerName || "",
      installationDate: formatInputDate(source?.installationDate) || formatInputDate(new Date()),
      installationNotes: source?.installationNotes || "",
    };
  }, []);

  const getDisbursementForm = useCallback((source) => ({
    disbursementStatus: source?.disbursementStatus || "completed",
    status: source?.status || "Installation Completion",
    disbursementAmount: source?.disbursementAmount ? String(source.disbursementAmount) : (source?.paymentAmount ? String(source.paymentAmount) : ""),
    disbursementDate: formatInputDate(source?.disbursementDate) || formatInputDate(new Date()),
    disbursementNotes: source?.disbursementNotes || "",
  }), []);

  const getLoanPendingForm = useCallback((source) => ({
    bankAtPendingStatus: source?.bankAtPendingStatus || "",
    status: source?.status || "Bank at Pending",
    reason: source?.reason || "",
    bankAtPendingNotes: source?.bankAtPendingNotes || "",
  }), []);

  const getDcrForm = useCallback((source) => ({
    dcrGenerated: source?.dcrGenerated || "No",
    dcrCertificate: source?.dcrCertificate || null,
    dcrDate: formatInputDate(source?.dcrDate) || formatInputDate(new Date()),
    dcrNotes: source?.dcrNotes || "",
  }), []);

  const getNotificationEmailForm = useCallback((source) => ({
    notificationEmailSent: source?.notificationEmailSent || "No",
    notificationNumber: source?.notificationNumber || "",
    notificationEmailDate: formatInputDate(source?.notificationEmailDate) || formatInputDate(new Date()),
    notificationEmailNotes: source?.notificationEmailNotes || "",
  }), []);

  const getDemandNoteForm = useCallback((source) => ({
    demandNoteGenerated: source?.demandNoteGenerated || "No",
    demandNoteNumber: source?.demandNoteNumber || "",
    demandNoteDate: formatInputDate(source?.demandNoteDate) || formatInputDate(new Date()),
    demandNoteNotes: source?.demandNoteNotes || "",
  }), []);

  const getDemandNotePaymentForm = useCallback((source) => ({
    demandNotePaymentPaid: source?.demandNotePaymentPaid || "No",
    demandNotePaymentAmount: source?.demandNotePaymentAmount ? String(source.demandNotePaymentAmount) : "",
    demandNotePaymentReceipt: source?.demandNotePaymentReceipt || null,
    demandNotePaymentDate: formatInputDate(source?.demandNotePaymentDate) || formatInputDate(new Date()),
    demandNotePaymentNotes: source?.demandNotePaymentNotes || "",
  }), []);

  const getInspectionForm = useCallback((source) => ({
    inspectionStatus: source?.inspectionStatus || "By RESCO",
    inspectionDocument: source?.inspectionDocument || null,
    inspectionDate: formatInputDate(source?.inspectionDate) || formatInputDate(new Date()),
    inspectionNotes: source?.inspectionNotes || "",
  }), []);

  const getMeterInstallationForm = useCallback((source) => ({
    meterInstallationComplete: source?.meterInstallationComplete || "No",
    meterInstallationDate: formatInputDate(source?.meterInstallationDate) || formatInputDate(new Date()),
    meterPhotograph: source?.meterPhotograph || null,
    meterInstallationReport: source?.meterInstallationReport || null,
    meterInstallationNotes: source?.meterInstallationNotes || "",
  }), []);

  const getPhase2DisbursementForm = useCallback((source) => ({
    phase2DisbursementPaid: source?.phase2DisbursementPaid || "No",
    phase2DisbursementAmount: source?.phase2DisbursementAmount ? String(source.phase2DisbursementAmount) : "",
    phase2DisbursementDate: formatInputDate(source?.phase2DisbursementDate) || formatInputDate(new Date()),
    phase2LeadStatus: source?.phase2LeadStatus || "Phase 2 Disbursement",
    phase2DisbursementNotes: source?.phase2DisbursementNotes || "",
  }), []);

  const getFinalPaymentForm = useCallback((source) => {
    const stage04Cost = Number(source?.paymentAmount || source?.loanAmount || 0);
    const p1st = Number(source?.disbursementAmount || 0);
    const p2nd = Number(source?.phase2DisbursementAmount || 0);
    const installmentsCollectedSum = p1st + p2nd;
    const hasInstallments = p1st > 0 || p2nd > 0;

    const defaultReceived = hasInstallments
      ? installmentsCollectedSum
      : (stage04Cost > 0 ? stage04Cost : installmentsCollectedSum);

    const quote = source?._id ? getAcceptedOrLatestQuotation(source._id) : null;
    const quoteCost = Number(quote?.totalCost) || Number(quote?.form?.totalCost) || 0;

    const costVal =
      source?.finalPaymentCost ??
      source?.projectSaleValue ??
      source?.totalProjectCost ??
      (quoteCost > 0 ? String(quoteCost) : null) ??
      source?.agreedPrice ??
      source?.quotationAmount ??
      source?.totalAmount ??
      source?.projectValue ??
      (stage04Cost > 0 ? String(stage04Cost) : "") ??
      (installmentsCollectedSum > 0 ? String(installmentsCollectedSum) : "");

    const recVal =
      source?.finalPaymentTotalReceived ??
      source?.totalPaymentReceived ??
      (defaultReceived > 0 ? String(defaultReceived) : "");

    const costNum = Number(costVal) || 0;
    const recNum = Number(recVal) || 0;
    const dueNum = Math.max(0, costNum - recNum);
    return {
      finalPaymentCost: costVal ? String(costVal) : (recNum > 0 ? String(recNum) : ""),
      finalPaymentTotalReceived: recVal ? String(recVal) : "",
      finalPaymentDue: dueNum,
      duePaymentCleared: source?.duePaymentCleared || (dueNum <= 0 && costNum > 0 ? "Yes" : "No"),
      duePaymentClearanceDate: formatInputDate(source?.duePaymentClearanceDate) || formatInputDate(new Date()),
      finalPaymentNotes: source?.finalPaymentNotes || "",
      newPaymentAmount: "",
    };
  }, []);

  const getProjectCommissioningForm = useCallback((source) => ({
    projectCommissioningStatus: source?.projectCommissioningStatus || "No",
    projectCommissioningDate: formatInputDate(source?.projectCommissioningDate) || formatInputDate(new Date()),
    projectCommissioningNotes: source?.projectCommissioningNotes || "",
  }), []);

  const getDiscomApprovalForm = useCallback((source) => ({
    discomApprovalStatus: source?.discomApprovalStatus || "No",
    discomApprovalDate: formatInputDate(source?.discomApprovalDate) || formatInputDate(new Date()),
    discomApprovalNotes: source?.discomApprovalNotes || "",
  }), []);

  const getSubsidyRedeemedForm = useCallback((source) => ({
    subsidyRedeemedStatus: source?.subsidyRedeemedStatus || "No",
    subsidyRedeemedDate: formatInputDate(source?.subsidyRedeemedDate) || formatInputDate(new Date()),
    subsidyRedeemedNotes: source?.subsidyRedeemedNotes || "",
  }), []);

  const getSubsidyReceivedForm = useCallback((source) => ({
    subsidyReceivedStatus: source?.subsidyReceivedStatus || "No",
    subsidyReceivedDate: formatInputDate(source?.subsidyReceivedDate) || formatInputDate(new Date()),
    subsidyReceivedAmount: source?.subsidyReceivedAmount ? String(source.subsidyReceivedAmount) : (source?.subsidyAmount ? String(source.subsidyAmount) : ""),
    subsidyReceivedNotes: source?.subsidyReceivedNotes || "",
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
    setDcrForm(getDcrForm(project));
    setDcrErrors({});
    setNotificationEmailForm(getNotificationEmailForm(project));
    setNotificationEmailErrors({});
    setDemandNoteForm(getDemandNoteForm(project));
    setDemandNoteErrors({});
    setDemandNotePaymentForm(getDemandNotePaymentForm(project));
    setDemandNotePaymentErrors({});
    setInspectionForm(getInspectionForm(project));
    setInspectionErrors({});
    setMeterInstallationForm(getMeterInstallationForm(project));
    setMeterInstallationErrors({});
    setPhase2DisbursementForm(getPhase2DisbursementForm(project));
    setPhase2DisbursementErrors({});
    setFinalPaymentForm(getFinalPaymentForm(project));
    setFinalPaymentErrors({});
    setProjectCommissioningForm(getProjectCommissioningForm(project));
    setProjectCommissioningErrors({});
    setDiscomApprovalForm(getDiscomApprovalForm(project));
    setDiscomApprovalErrors({});
    setSubsidyRedeemedForm(getSubsidyRedeemedForm(project));
    setSubsidyRedeemedErrors({});
    setSubsidyReceivedForm(getSubsidyReceivedForm(project));
    setSubsidyReceivedErrors({});
  }, [getDiscomApprovalForm, getFinalPaymentForm, getProjectCommissioningForm, getSubsidyReceivedForm, getSubsidyRedeemedForm, getDcrForm, getDemandNoteForm, getDemandNotePaymentForm, getDisbursementForm, getInspectionForm, getInstallationForm, getLoanPendingForm, getMeterInstallationForm, getNotificationEmailForm, getPaymentForm, getPhase2DisbursementForm, getRegistrationForm, project]);

  const effectivePaymentType = paymentForm?.paymentType || project?.paymentType || "Bank Loan";
  const isBankLoan = effectivePaymentType === "Bank Loan";

  const allVisibleStages = useMemo(() => {
    return PROJECT_STAGES.filter((s) => {
      if (s.key === "loan_pending" && !isBankLoan) return false;
      return true;
    });
  }, [isBankLoan]);

  const actionState = useMemo(() => {
    if (!project) return {};
    return {
      registration: project.registrationStatus || "",
      document: project.documentStatus || "",
      payment: project.loanStatus || project.paymentStatus || "",
      loan_pending: (!isBankLoan) ? "completed" : (project.bankAtPendingStatus || ""),
      disbursement: project.disbursementStatus || "",
      installation: project.installationStatus || "",
      dcr_generation: project.dcrGenerated === "Yes" ? "completed" : "",
      notification_email: project.notificationEmailSent === "Yes" ? "completed" : "",
      demand_note: project.demandNoteGenerated === "Yes" ? "completed" : "",
      demand_note_payment: project.demandNotePaymentPaid === "Yes" ? "completed" : "",
      inspection: project.inspectionStatus ? "completed" : "",
      meter_installation: project.meterInstallationComplete === "Yes" ? "completed" : "",
      phase2_disbursement: project.phase2DisbursementPaid === "Yes" ? "completed" : "",
      final_payment: (project.duePaymentCleared === "Yes" || project.status === "Final Payment" || (project.finalPaymentCost && Number(project.finalPaymentDue) <= 0)) ? "completed" : (project.status === "Final Payment" ? "completed" : ""),
      project_commissioning: project.projectCommissioningStatus === "Yes" || project.status === "Project Commissioning" ? "completed" : "",
      discom_approval: project.discomApprovalStatus === "Yes" || project.status === "DISCOM Approval" ? "completed" : "",
      subsidy_redeemed: project.subsidyRedeemedStatus === "Yes" || project.status === "Subsidy Redeemed" ? "completed" : "",
      subsidy_received: project.subsidyReceivedStatus === "Yes" || Boolean(project.subsidyReceivedAmount) || project.status === "Subsidy Received" ? "completed" : "",
    };
  }, [isBankLoan, project]);

  const completedStageCount = useMemo(() => {
    if (!project) return 0;
    return allVisibleStages.reduce((count, stage) => {
      if (stage.key === "lead_converted") {
        return project.projectConvertedAt || project.projectCode ? count + 1 : count;
      }
      return isCompletedStatus(actionState[stage.key]) ? count + 1 : count;
    }, 0);
  }, [actionState, allVisibleStages, project]);

  const progress = Math.round((completedStageCount / (allVisibleStages.length || 1)) * 100);

  const [activePhaseId, setActivePhaseId] = useState(() => getPhaseForStage(selectedWorkflowStage));

  useEffect(() => {
    setActivePhaseId(getPhaseForStage(selectedWorkflowStage));
  }, [selectedWorkflowStage]);

  const getVisibleStageKeys = useCallback(
    (stageKeys) => {
      return stageKeys.filter((key) => {
        if (key === "loan_pending" && !isBankLoan) {
          return false;
        }
        return true;
      });
    },
    [isBankLoan]
  );

  useEffect(() => {
    if (selectedWorkflowStage === "loan_pending" && !isBankLoan) {
      setSelectedWorkflowStage("disbursement");
    }
  }, [isBankLoan, selectedWorkflowStage]);

  const handlePhaseTabClick = (phaseId) => {
    setActivePhaseId(phaseId);
    const targetPhase = WORKFLOW_PHASES.find((p) => p.id === phaseId);
    if (targetPhase) {
      const visibleKeys = getVisibleStageKeys(targetPhase.stageKeys);
      if (!visibleKeys.includes(selectedWorkflowStage)) {
        setSelectedWorkflowStage(visibleKeys[0] || "summary");
      }
    }
  };

  const getPhaseStats = (phase) => {
    let completed = 0;
    let total = 0;
    const visibleKeys = getVisibleStageKeys(phase.stageKeys);
    visibleKeys.forEach((key) => {
      if (key === "summary" || key === "inventory" || key === "project_images") return;
      total += 1;
      if (stageState(key) === "done") {
        completed += 1;
      }
    });
    return { completed, total, allDone: total > 0 && completed === total };
  };


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
    setSelectedWorkflowStage(stageKey);
    return true;
  }, []);

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
    const finalSolarReq =
      registrationForm.solarRequirement === "Other"
        ? (registrationForm.customSolarRequirement || "").trim()
        : (registrationForm.customSolarRequirement || registrationForm.solarRequirement || "").trim();
    if (!finalSolarReq) errors.solarRequirement = "Solar requirement is required";
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
      const finalSolarReq =
        registrationForm.solarRequirement === "Other"
          ? (registrationForm.customSolarRequirement || "").trim()
          : (registrationForm.customSolarRequirement || registrationForm.solarRequirement || "").trim();

      const payload = {
        address: registrationForm.address.trim(),
        city: registrationForm.city.trim(),
        pincode: registrationForm.pincode?.trim?.() || "",
        solarRequirement: finalSolarReq,
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
      if (!paymentForm.paymentDate && !formatInputDate(new Date())) errors.paymentDate = "Payment date is required";
    } else if (paymentForm.paymentType === "Online Transfer") {
      if (!paymentForm.paymentAmount) errors.paymentAmount = "Payment amount is required";
      if (!paymentForm.paymentDate && !formatInputDate(new Date())) errors.paymentDate = "Payment date is required";
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
      paymentDate: formatInputDate(new Date()),
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
        payload.paymentDate = paymentForm.paymentDate || formatInputDate(new Date());
        payload.paymentReference = paymentForm.paymentReference.trim();
        payload.paymentStatus = "completed";
        payload.loanStatus = "submitted";
        payload.status = "Disbursement";
      } else if (paymentForm.paymentType === "Online Transfer") {
        payload.paymentAmount = parseFloat(paymentForm.paymentAmount);
        payload.paymentDate = paymentForm.paymentDate || formatInputDate(new Date());
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
      if (paymentForm.paymentType !== "Bank Loan") {
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

    const [uploadingInstallationPhoto, setUploadingInstallationPhoto] = useState(false);

  const handleUploadInstallationPhotos = useCallback(async (files) => {
    if (!project?._id || !files || files.length === 0) return;
    setUploadingInstallationPhoto(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("document", file);
        const res = await fetchAPI(`/lead/installation/${getValidLeadId(project)}/document-upload`, {
          method: "POST",
          body: formData,
        });
        if (res?.success && (res.result?.lead || res.result)) {
          setProject(res.result.lead || res.result);
        }
      }
      setSnackbar({ open: true, message: "Installation photo(s) uploaded successfully", severity: "success" });
    } catch (err) {
      setSnackbar({ open: true, message: err.message || "Failed to upload photo", severity: "error" });
    } finally {
      setUploadingInstallationPhoto(false);
    }
  }, [fetchAPI, project]);

  const handleDeleteInstallationPhoto = useCallback(async (indexToRemove) => {
    if (!project?._id) return;
    try {
      const updatedPhotos = (project.installationPhotos || []).filter((_, idx) => idx !== indexToRemove);
      const res = await fetchAPI(`/lead/updateLead/${getValidLeadId(project)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ installationPhotos: updatedPhotos }),
      });
      if (res?.success) {
        const updatedLead = res.result?.lead || res.result || { ...project, installationPhotos: updatedPhotos };
        setProject(updatedLead);
        setSnackbar({ open: true, message: "Photo removed", severity: "success" });
      }
    } catch (err) {
      setSnackbar({ open: true, message: "Failed to delete photo", severity: "error" });
    }
  }, [fetchAPI, project]);

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
      const isComplete = installationForm.installationStatus === "installation_completed";
      const payload = {
        installationStatus: installationForm.installationStatus,
        status: "Installation Completion",
        installationPartner: (installationForm.installationPartner || "").trim(),
        installationNotes: (installationForm.installationNotes || "").trim(),
        installationDate: installationForm.installationDate || formatInputDate(new Date()),
      };

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
      setSelectedWorkflowStage("dcr_generation");
      setActivePhaseId("phase2");
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
    if (!disbursementForm.disbursementAmount || Number(disbursementForm.disbursementAmount) <= 0) {
      errors.disbursementAmount = "Please enter disbursement / installment amount";
    }
    if (!disbursementForm.disbursementDate) {
      errors.disbursementDate = "Please select date";
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
      setSnackbar({ open: true, message: "Please enter the installment amount and date", severity: "error" });
      return;
    }

    setSavingDisbursement(true);
    try {
      const payload = {
        disbursementStatus: disbursementForm.disbursementStatus,
        status: disbursementForm.disbursementStatus === "completed" 
          ? "Installation Completion" 
          : (disbursementForm.disbursementStatus === "cancelled" ? "Missed Leads" : "Disbursement"),
        disbursementNotes: disbursementForm.disbursementNotes.trim(),
        disbursementAmount: parseFloat(disbursementForm.disbursementAmount) || 0,
        disbursementDate: disbursementForm.disbursementDate || formatInputDate(new Date()),
      };

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
      setSnackbar({ open: true, message: "1st Installment / Disbursement saved successfully", severity: "success" });
      setSelectedWorkflowStage("installation");
      setActivePhaseId("phase2");
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

  
  
  /* 🔹 Final Payment Handler */
  const handleFinalPaymentChange = useCallback((field, value) => {
    setFinalPaymentForm((prev) => ({ ...prev, [field]: value }));
    setFinalPaymentErrors((prev) => ({ ...prev, [field]: "" }));
  }, []);

  const saveFinalPayment = useCallback(async () => {
    if (!project?._id) return;
    setSavingFinalPayment(true);
    try {
      const recNum = finalPaymentForm.finalPaymentTotalReceived ? parseFloat(finalPaymentForm.finalPaymentTotalReceived) : 0;
      const costNum = finalPaymentForm.finalPaymentCost ? parseFloat(finalPaymentForm.finalPaymentCost) : (recNum || null);
      const dueNum = costNum !== null ? Math.max(0, costNum - recNum) : 0;

      const payload = {
        finalPaymentCost: costNum,
        finalPaymentTotalReceived: recNum,
        totalPaymentReceived: recNum,
        finalPaymentDue: dueNum,
        duePaymentCleared: finalPaymentForm.duePaymentCleared || (dueNum <= 0 ? "Yes" : "No"),
        finalPaymentNotes: (finalPaymentForm.finalPaymentNotes || "").trim(),
        status: "Final Payment",
      };
      payload.duePaymentClearanceDate = finalPaymentForm.duePaymentClearanceDate || formatInputDate(new Date());

      const res = await fetchAPI(`/lead/updateLead/${getValidLeadId(project)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res?.success) throw new Error(res?.message || "Failed to save final payment");
      const updated = res?.result?.lead || res?.result || { ...project, ...payload };
      setProject(updated);
      setSnackbar({ open: true, message: "Final Payment details saved successfully", severity: "success" });
      setSelectedWorkflowStage("project_commissioning");
      setActivePhaseId("phase4");
    } catch (err) {
      setSnackbar({ open: true, message: err.message || "Failed to save final payment", severity: "error" });
    } finally {
      setSavingFinalPayment(false);
    }
  }, [fetchAPI, finalPaymentForm, project]);

  /* 🔹 Project Commissioning Handler */
  const handleProjectCommissioningChange = useCallback((field, value) => {
    setProjectCommissioningForm((prev) => ({ ...prev, [field]: value }));
    setProjectCommissioningErrors((prev) => ({ ...prev, [field]: "" }));
  }, []);

  const saveProjectCommissioning = useCallback(async () => {
    if (!project?._id) return;
    setSavingProjectCommissioning(true);
    try {
      const payload = {
        projectCommissioningStatus: projectCommissioningForm.projectCommissioningStatus,
        projectCommissioningNotes: (projectCommissioningForm.projectCommissioningNotes || "").trim(),
        status: "Project Commissioning",
      };
      if (projectCommissioningForm.projectCommissioningDate) {
        payload.projectCommissioningDate = projectCommissioningForm.projectCommissioningDate;
      }

      const res = await fetchAPI(`/lead/updateLead/${getValidLeadId(project)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res?.success) throw new Error(res?.message || "Failed to save commissioning");
      const updated = res?.result?.lead || res?.result || { ...project, ...payload };
      setProject(updated);
      setSnackbar({ open: true, message: "Project Commissioning saved successfully", severity: "success" });
      setSelectedWorkflowStage("discom_approval");
      setActivePhaseId("phase4");
    } catch (err) {
      setSnackbar({ open: true, message: err.message || "Failed to save commissioning", severity: "error" });
    } finally {
      setSavingProjectCommissioning(false);
    }
  }, [fetchAPI, project, projectCommissioningForm]);

  /* 🔹 DISCOM Approval Handler */
  const handleDiscomApprovalChange = useCallback((field, value) => {
    setDiscomApprovalForm((prev) => ({ ...prev, [field]: value }));
    setDiscomApprovalErrors((prev) => ({ ...prev, [field]: "" }));
  }, []);

  const saveDiscomApproval = useCallback(async () => {
    if (!project?._id) return;
    setSavingDiscomApproval(true);
    try {
      const payload = {
        discomApprovalStatus: discomApprovalForm.discomApprovalStatus,
        discomApprovalNotes: (discomApprovalForm.discomApprovalNotes || "").trim(),
        status: "DISCOM Approval",
      };
      if (discomApprovalForm.discomApprovalDate) {
        payload.discomApprovalDate = discomApprovalForm.discomApprovalDate;
      }

      const res = await fetchAPI(`/lead/updateLead/${getValidLeadId(project)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res?.success) throw new Error(res?.message || "Failed to save DISCOM approval");
      const updated = res?.result?.lead || res?.result || { ...project, ...payload };
      setProject(updated);
      setSnackbar({ open: true, message: "DISCOM Approval saved successfully", severity: "success" });
      setSelectedWorkflowStage("subsidy_redeemed");
      setActivePhaseId("phase4");
    } catch (err) {
      setSnackbar({ open: true, message: err.message || "Failed to save DISCOM approval", severity: "error" });
    } finally {
      setSavingDiscomApproval(false);
    }
  }, [discomApprovalForm, fetchAPI, project]);

  /* 🔹 Subsidy Redeemed Handler */
  const handleSubsidyRedeemedChange = useCallback((field, value) => {
    setSubsidyRedeemedForm((prev) => ({ ...prev, [field]: value }));
    setSubsidyRedeemedErrors((prev) => ({ ...prev, [field]: "" }));
  }, []);

  const saveSubsidyRedeemed = useCallback(async () => {
    if (!project?._id) return;
    setSavingSubsidyRedeemed(true);
    try {
      const payload = {
        subsidyRedeemedStatus: subsidyRedeemedForm.subsidyRedeemedStatus,
        subsidyRedeemedNotes: (subsidyRedeemedForm.subsidyRedeemedNotes || "").trim(),
        status: "Subsidy Redeemed",
      };
      if (subsidyRedeemedForm.subsidyRedeemedDate) {
        payload.subsidyRedeemedDate = subsidyRedeemedForm.subsidyRedeemedDate;
      }

      const res = await fetchAPI(`/lead/updateLead/${getValidLeadId(project)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res?.success) throw new Error(res?.message || "Failed to save subsidy redeemed");
      const updated = res?.result?.lead || res?.result || { ...project, ...payload };
      setProject(updated);
      setSnackbar({ open: true, message: "Subsidy Redeemed saved successfully", severity: "success" });
      setSelectedWorkflowStage("subsidy_received");
    } catch (err) {
      setSnackbar({ open: true, message: err.message || "Failed to save subsidy redeemed", severity: "error" });
    } finally {
      setSavingSubsidyRedeemed(false);
    }
  }, [fetchAPI, project, subsidyRedeemedForm]);

  /* 🔹 Subsidy Received Handler */
  const handleSubsidyReceivedChange = useCallback((field, value) => {
    setSubsidyReceivedForm((prev) => ({ ...prev, [field]: value }));
    setSubsidyReceivedErrors((prev) => ({ ...prev, [field]: "" }));
  }, []);

  const saveSubsidyReceived = useCallback(async () => {
    if (!project?._id) return;
    setSavingSubsidyReceived(true);
    try {
      const payload = {
        subsidyReceivedStatus: subsidyReceivedForm.subsidyReceivedStatus || "Yes",
        subsidyReceivedAmount: subsidyReceivedForm.subsidyReceivedAmount ? parseFloat(subsidyReceivedForm.subsidyReceivedAmount) : null,
        subsidyReceivedNotes: (subsidyReceivedForm.subsidyReceivedNotes || "").trim(),
        status: "Handover",
        projectStage: "ready_handover",
        currentStage: "ready_handover",
        handoverStatus: "completed",
        handoverDate: formatInputDate(new Date()),
      };
      payload.subsidyReceivedDate = subsidyReceivedForm.subsidyReceivedDate || formatInputDate(new Date());

      const res = await fetchAPI(`/lead/updateLead/${getValidLeadId(project)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res?.success) throw new Error(res?.message || "Failed to save subsidy received");
      const updated = res?.result?.lead || res?.result || { ...project, ...payload };
      setProject(updated);
      setSnackbar({ open: true, message: "Subsidy Received updated! Project is now in Ready Handover stage.", severity: "success" });
      setTimeout(() => {
        navigate("/projects", { state: { stageFilter: "ready_handover" } });
      }, 800);
    } catch (err) {
      setSnackbar({ open: true, message: err.message || "Failed to save subsidy received", severity: "error" });
    } finally {
      setSavingSubsidyReceived(false);
    }
  }, [fetchAPI, navigate, project, subsidyReceivedForm]);

  /* 🔹 Stage Document Upload Handler */
  const handleUploadStageDoc = useCallback(async (docType, file) => {
    if (!project?._id || !file) return;
    const formDataToSend = new FormData();
    formDataToSend.append("document", file);

    try {
      setUploadingStageDoc(true);
      const res = await fetchAPI(`/lead/stage-upload/${getValidLeadId(project)}/${docType}`, {
        method: "POST",
        body: formDataToSend,
      });

      if (!res?.success) {
        throw new Error(res?.message || "Failed to upload document");
      }

      const updatedLead = res?.result?.lead || res?.result;
      if (updatedLead) {
        setProject(updatedLead);
      } else {
        await fetchProject();
      }
      setSnackbar({ open: true, message: "Document uploaded successfully", severity: "success" });
    } catch (err) {
      setSnackbar({ open: true, message: err.message || "Failed to upload document", severity: "error" });
    } finally {
      setUploadingStageDoc(false);
    }
  }, [fetchAPI, fetchProject, project]);

  /* 🔹 DCR Generation Handler */
  const handleDcrChange = useCallback((field, value) => {
    setDcrForm((prev) => ({ ...prev, [field]: value }));
    setDcrErrors((prev) => ({ ...prev, [field]: "" }));
  }, []);

  const saveDcr = useCallback(async () => {
    if (!project?._id) return;
    setSavingDcr(true);
    try {
      const payload = {
        dcrGenerated: dcrForm.dcrGenerated,
        dcrNotes: (dcrForm.dcrNotes || "").trim(),
        status: "DCR Generation",
      };
      payload.dcrDate = dcrForm.dcrDate || formatInputDate(new Date());

      const res = await fetchAPI(`/lead/updateLead/${getValidLeadId(project)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res?.success) throw new Error(res?.message || "Failed to save DCR");
      const updated = res?.result?.lead || res?.result || { ...project, ...payload };
      setProject(updated);
      setSnackbar({ open: true, message: "DCR Generation saved successfully", severity: "success" });
      setSelectedWorkflowStage("notification_email");
      setActivePhaseId("phase2");
    } catch (err) {
      setSnackbar({ open: true, message: err.message || "Failed to save DCR", severity: "error" });
    } finally {
      setSavingDcr(false);
    }
  }, [dcrForm, fetchAPI, project]);

  /* 🔹 Notification Email Handler */
  const handleNotificationEmailChange = useCallback((field, value) => {
    setNotificationEmailForm((prev) => ({ ...prev, [field]: value }));
    setNotificationEmailErrors((prev) => ({ ...prev, [field]: "" }));
  }, []);

  const saveNotificationEmail = useCallback(async () => {
    if (!project?._id) return;
    setSavingNotificationEmail(true);
    try {
      const payload = {
        notificationEmailSent: notificationEmailForm.notificationEmailSent,
        notificationNumber: (notificationEmailForm.notificationNumber || "").trim(),
        notificationEmailNotes: (notificationEmailForm.notificationEmailNotes || "").trim(),
        status: "Notification Email",
      };
      payload.notificationEmailDate = notificationEmailForm.notificationEmailDate || formatInputDate(new Date());

      const res = await fetchAPI(`/lead/updateLead/${getValidLeadId(project)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res?.success) throw new Error(res?.message || "Failed to save Notification Email");
      const updated = res?.result?.lead || res?.result || { ...project, ...payload };
      setProject(updated);
      setSnackbar({ open: true, message: "Notification Email details saved successfully", severity: "success" });
      setSelectedWorkflowStage("demand_note");
      setActivePhaseId("phase2");
    } catch (err) {
      setSnackbar({ open: true, message: err.message || "Failed to save notification email", severity: "error" });
    } finally {
      setSavingNotificationEmail(false);
    }
  }, [fetchAPI, notificationEmailForm, project]);

  /* 🔹 Demand Note Handler */
  const handleDemandNoteChange = useCallback((field, value) => {
    setDemandNoteForm((prev) => ({ ...prev, [field]: value }));
    setDemandNoteErrors((prev) => ({ ...prev, [field]: "" }));
  }, []);

  const saveDemandNote = useCallback(async () => {
    if (!project?._id) return;
    setSavingDemandNote(true);
    try {
      const payload = {
        demandNoteGenerated: demandNoteForm.demandNoteGenerated,
        demandNoteNumber: (demandNoteForm.demandNoteNumber || "").trim(),
        demandNoteNotes: (demandNoteForm.demandNoteNotes || "").trim(),
        status: "Demand Note",
      };
      payload.demandNoteDate = demandNoteForm.demandNoteDate || formatInputDate(new Date());

      const res = await fetchAPI(`/lead/updateLead/${getValidLeadId(project)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res?.success) throw new Error(res?.message || "Failed to save Demand Note");
      const updated = res?.result?.lead || res?.result || { ...project, ...payload };
      setProject(updated);
      setSnackbar({ open: true, message: "Demand Note saved successfully", severity: "success" });
      setSelectedWorkflowStage("demand_note_payment");
      setActivePhaseId("phase2");
    } catch (err) {
      setSnackbar({ open: true, message: err.message || "Failed to save demand note", severity: "error" });
    } finally {
      setSavingDemandNote(false);
    }
  }, [demandNoteForm, fetchAPI, project]);

  /* 🔹 Demand Note Payment Handler */
  const handleDemandNotePaymentChange = useCallback((field, value) => {
    setDemandNotePaymentForm((prev) => ({ ...prev, [field]: value }));
    setDemandNotePaymentErrors((prev) => ({ ...prev, [field]: "" }));
  }, []);

  const saveDemandNotePayment = useCallback(async () => {
    if (!project?._id) return;
    setSavingDemandNotePayment(true);
    try {
      const payload = {
        demandNotePaymentPaid: demandNotePaymentForm.demandNotePaymentPaid,
        demandNotePaymentAmount: demandNotePaymentForm.demandNotePaymentAmount ? parseFloat(demandNotePaymentForm.demandNotePaymentAmount) : null,
        demandNotePaymentNotes: (demandNotePaymentForm.demandNotePaymentNotes || "").trim(),
        status: "Demand Note Payment",
      };
      payload.demandNotePaymentDate = demandNotePaymentForm.demandNotePaymentDate || formatInputDate(new Date());

      const res = await fetchAPI(`/lead/updateLead/${getValidLeadId(project)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res?.success) throw new Error(res?.message || "Failed to save Demand Note Payment");
      const updated = res?.result?.lead || res?.result || { ...project, ...payload };
      setProject(updated);
      setSnackbar({ open: true, message: "Demand Note Payment saved successfully", severity: "success" });
      setSelectedWorkflowStage("inspection");
      setActivePhaseId("phase3");
    } catch (err) {
      setSnackbar({ open: true, message: err.message || "Failed to save demand note payment", severity: "error" });
    } finally {
      setSavingDemandNotePayment(false);
    }
  }, [demandNotePaymentForm, fetchAPI, project]);

  /* 🔹 Inspection Handler */
  const handleInspectionChange = useCallback((field, value) => {
    setInspectionForm((prev) => ({ ...prev, [field]: value }));
    setInspectionErrors((prev) => ({ ...prev, [field]: "" }));
  }, []);

  const saveInspection = useCallback(async () => {
    if (!project?._id) return;
    setSavingInspection(true);
    try {
      const payload = {
        inspectionStatus: inspectionForm.inspectionStatus,
        inspectionNotes: (inspectionForm.inspectionNotes || "").trim(),
        status: "Inspection",
      };
      payload.inspectionDate = inspectionForm.inspectionDate || formatInputDate(new Date());

      const res = await fetchAPI(`/lead/updateLead/${getValidLeadId(project)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res?.success) throw new Error(res?.message || "Failed to save Inspection");
      const updated = res?.result?.lead || res?.result || { ...project, ...payload };
      setProject(updated);
      setSnackbar({ open: true, message: "Inspection details saved successfully", severity: "success" });
      setSelectedWorkflowStage("meter_installation");
      setActivePhaseId("phase3");
    } catch (err) {
      setSnackbar({ open: true, message: err.message || "Failed to save inspection", severity: "error" });
    } finally {
      setSavingInspection(false);
    }
  }, [fetchAPI, inspectionForm, project]);

  /* 🔹 Meter Installation Handler */
  const handleMeterInstallationChange = useCallback((field, value) => {
    setMeterInstallationForm((prev) => ({ ...prev, [field]: value }));
    setMeterInstallationErrors((prev) => ({ ...prev, [field]: "" }));
  }, []);

  const saveMeterInstallation = useCallback(async () => {
    if (!project?._id) return;
    setSavingMeterInstallation(true);
    try {
      const payload = {
        meterInstallationComplete: meterInstallationForm.meterInstallationComplete,
        meterInstallationNotes: (meterInstallationForm.meterInstallationNotes || "").trim(),
        status: "Meter Installation",
      };
      payload.meterInstallationDate = meterInstallationForm.meterInstallationDate || formatInputDate(new Date());

      const res = await fetchAPI(`/lead/updateLead/${getValidLeadId(project)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res?.success) throw new Error(res?.message || "Failed to save Meter Installation");
      const updated = res?.result?.lead || res?.result || { ...project, ...payload };
      setProject(updated);
      setSnackbar({ open: true, message: "Meter Installation saved successfully", severity: "success" });
      setSelectedWorkflowStage("phase2_disbursement");
      setActivePhaseId("phase3");
    } catch (err) {
      setSnackbar({ open: true, message: err.message || "Failed to save meter installation", severity: "error" });
    } finally {
      setSavingMeterInstallation(false);
    }
  }, [fetchAPI, meterInstallationForm, project]);

  /* 🔹 Phase 2 Disbursement Handler */
  const handlePhase2DisbursementChange = useCallback((field, value) => {
    setPhase2DisbursementForm((prev) => ({ ...prev, [field]: value }));
    setPhase2DisbursementErrors((prev) => ({ ...prev, [field]: "" }));
  }, []);

  const savePhase2Disbursement = useCallback(async () => {
    if (!project?._id) return;
    setSavingPhase2Disbursement(true);
    try {
      const payload = {
        phase2DisbursementPaid: phase2DisbursementForm.phase2DisbursementPaid,
        phase2DisbursementAmount: phase2DisbursementForm.phase2DisbursementAmount ? parseFloat(phase2DisbursementForm.phase2DisbursementAmount) : null,
        phase2LeadStatus: phase2DisbursementForm.phase2LeadStatus,
        status: phase2DisbursementForm.phase2LeadStatus || "Phase 2 Disbursement",
        phase2DisbursementNotes: (phase2DisbursementForm.phase2DisbursementNotes || "").trim(),
      };
      payload.phase2DisbursementDate = phase2DisbursementForm.phase2DisbursementDate || formatInputDate(new Date());

      const res = await fetchAPI(`/lead/updateLead/${getValidLeadId(project)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res?.success) throw new Error(res?.message || "Failed to save Phase 2 Disbursement");
      const updated = res?.result?.lead || res?.result || { ...project, ...payload };
      setProject(updated);
      setSnackbar({ open: true, message: "Phase 2 Disbursement saved successfully", severity: "success" });
      setSelectedWorkflowStage("final_payment");
      setActivePhaseId("phase3");
    } catch (err) {
      setSnackbar({ open: true, message: err.message || "Failed to save phase 2 disbursement", severity: "error" });
    } finally {
      setSavingPhase2Disbursement(false);
    }
  }, [fetchAPI, phase2DisbursementForm, project]);

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

        <Stack direction="row" spacing={1} alignItems="center">
          <Button
            variant="contained"
            onClick={() => {
              const targetId = project?._id || projectId;
              navigate(`/projects/${targetId}/images`, { state: { project } });
            }}
            sx={{
              minHeight: 48,
              height: 48,
              px: 2.75,
              borderRadius: "12px",
              background: isDark
                ? "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)"
                : "linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)",
              color: "#ffffff",
              fontWeight: 800,
              fontSize: "0.925rem",
              letterSpacing: "0.01em",
              textTransform: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 1.25,
              border: selectedWorkflowStage === "project_images"
                ? "2px solid #93c5fd"
                : "1px solid rgba(255, 255, 255, 0.2)",
              boxShadow: isDark
                ? "0 4px 16px rgba(37, 99, 235, 0.4)"
                : "0 4px 16px rgba(30, 64, 175, 0.25)",
              transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              "&:hover": {
                background: isDark
                  ? "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
                  : "linear-gradient(135deg, #2563eb 0%, #1e3a8a 100%)",
                boxShadow: "0 8px 24px rgba(37, 99, 235, 0.38)",
                transform: "translateY(-1.5px)",
              },
              "&:active": {
                transform: "translateY(0)",
              },
            }}
          >
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: "8px",
                bgcolor: "rgba(255, 255, 255, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <PhotoCameraOutlined sx={{ fontSize: 18, color: "#ffffff" }} />
            </Box>
            <span>Project Images</span>
            {Array.isArray(project?.projectImages) && project.projectImages.length > 0 && (
              <Chip
                label={project.projectImages.length}
                size="small"
                sx={{
                  height: 20,
                  fontSize: 11,
                  fontWeight: 800,
                  bgcolor: "rgba(255, 255, 255, 0.25)",
                  color: "#ffffff",
                  ml: 0.5,
                }}
              />
            )}
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
          <MetricCard icon={<CalendarMonth />} label="Stages Complete" value={`${completedStageCount} of ${allVisibleStages.length}`} color={INK_2} />
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

      
      {/* ======================================================== */}
      {/* 🚀 MODERN 4-PHASE WORKFLOW HUB & QUICK SELECTOR          */}
      {/* ======================================================== */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, md: 2.5 },
          mb: 3,
          borderRadius: RADIUS,
          border: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${BORDER}`,
          bgcolor: isDark ? "#0b0e1a" : PANEL,
          color: isDark ? "#f8fafc" : "inherit",
          boxShadow: SHADOW_SM,
        }}
      >
        {/* Top Header: Title, Global Progress, Quick-Jump Select */}
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "center" }}
          spacing={2}
          sx={{ mb: 2 }}
        >
          <Box sx={{ minWidth: 260 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
              <Typography
                variant="caption"
                fontWeight={800}
                sx={{
                  color: isDark ? "#94a3b8" : MUTED_2,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Project Workflow Lifecycle
              </Typography>
              <Chip
                label={`${completedStageCount} / ${allVisibleStages.length} Completed`}
                size="small"
                sx={{
                  height: 20,
                  fontSize: 11,
                  fontWeight: 800,
                  bgcolor: alpha(SUCCESS, isDark ? 0.2 : 0.1),
                  color: isDark ? "#34d399" : SUCCESS,
                }}
              />
            </Stack>

            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Typography variant="h6" fontWeight={800} color={isDark ? "#f8fafc" : INK} sx={{ lineHeight: 1.2 }}>
                {getStageInfo(selectedWorkflowStage, effectivePaymentType)?.label || "Overview"}
              </Typography>
              <Chip
                label={`${progress}% Overall`}
                size="small"
                sx={{
                  fontWeight: 800,
                  bgcolor: alpha(BRAND, 0.12),
                  color: BRAND,
                  height: 24,
                }}
              />
            </Stack>
          </Box>

          {/* Quick-Jump Dropdown */}
          <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 280, md: 320 } }}>
            <InputLabel id="workflow-quick-jump-label" sx={{ fontWeight: 700 }}>
              Quick Jump to Any Stage...
            </InputLabel>
            <Select
              labelId="workflow-quick-jump-label"
              value={selectedWorkflowStage}
              label="Quick Jump to Any Stage..."
              onChange={(e) => selectWorkflowStage(e.target.value)}
              sx={{
                borderRadius: RADIUS_SM,
                bgcolor: isDark ? "rgba(255,255,255,0.03)" : "#FAFBFC",
                fontWeight: 700,
                fontSize: 13,
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: isDark ? "rgba(255,255,255,0.12)" : BORDER,
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: BRAND,
                },
              }}
            >
              <ListSubheader sx={{ fontWeight: 800, color: "#6366F1", bgcolor: isDark ? "#111827" : "#F8FAFC", lineHeight: "32px" }}>
                📊 DASHBOARD & OVERVIEW
              </ListSubheader>
              <MenuItem value="summary" sx={{ fontSize: 13, fontWeight: 600 }}>
                📋 Project Summary & Overview
              </MenuItem>
              <MenuItem value="inventory" sx={{ fontSize: 13, fontWeight: 600 }}>
                📦 Inventory Profitability & Materials
              </MenuItem>

              {WORKFLOW_PHASES.filter((p) => p.id !== "overview").map((phase) => (
                [
                  <ListSubheader
                    key={phase.id}
                    sx={{
                      fontWeight: 800,
                      color: phase.color,
                      bgcolor: isDark ? "#111827" : "#F8FAFC",
                      lineHeight: "32px",
                      borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : BORDER_SOFT}`,
                      mt: 0.5,
                    }}
                  >
                    {phase.title.toUpperCase()}
                  </ListSubheader>,
                  ...getVisibleStageKeys(phase.stageKeys).map((stageKey) => {
                    const info = getStageInfo(stageKey, effectivePaymentType);
                    const state = stageState(stageKey);
                    const isDone = state === "done";
                    const isCurrent = selectedWorkflowStage === stageKey;
                    return (
                      <MenuItem
                        key={stageKey}
                        value={stageKey}
                        sx={{
                          fontSize: 13,
                          fontWeight: isCurrent ? 800 : 600,
                          color: isCurrent ? BRAND : (isDark ? "#f8fafc" : INK),
                          bgcolor: isCurrent ? alpha(BRAND, 0.08) : "transparent",
                          display: "flex",
                          justifyContent: "space-between",
                          py: 0.75,
                        }}
                      >
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography variant="caption" sx={{ color: MUTED_2, fontWeight: 700, minWidth: 55 }}>
                            {info.stageNum}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: "inherit" }}>
                            {info.label}
                          </Typography>
                        </Stack>
                        {isDone ? (
                          <Chip label="Done" size="small" sx={{ height: 18, fontSize: 10, bgcolor: alpha(SUCCESS, 0.15), color: SUCCESS, fontWeight: 800 }} />
                        ) : isCurrent ? (
                          <Chip label="Active" size="small" sx={{ height: 18, fontSize: 10, bgcolor: alpha(BRAND, 0.15), color: BRAND, fontWeight: 800 }} />
                        ) : null}
                      </MenuItem>
                    );
                  }),
                ]
              ))}
            </Select>
          </FormControl>
        </Stack>

        {/* Global Progress Bar */}
        <Box sx={{ mb: 2 }}>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 6,
              borderRadius: 3,
              bgcolor: isDark ? "rgba(255,255,255,0.06)" : alpha(BRAND, 0.08),
              "& .MuiLinearProgress-bar": {
                background: "linear-gradient(90deg, #3450DB 0%, #06B6D4 50%, #10B981 100%)",
                borderRadius: 3,
              },
            }}
          />
        </Box>

        {/* Phase Navigation Tabs */}
        <Stack
          direction="row"
          spacing={1}
          sx={{
            overflowX: "auto",
            pb: 1,
            mb: 2,
            "&::-webkit-scrollbar": { height: 4 },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)",
              borderRadius: 2,
            },
          }}
        >
          {WORKFLOW_PHASES.map((phase) => {
            const PhaseIcon = phase.icon;
            const isPhaseActive = activePhaseId === phase.id;
            const stats = getPhaseStats(phase);
            return (
              <Button
                key={phase.id}
                onClick={() => handlePhaseTabClick(phase.id)}
                startIcon={<PhaseIcon sx={{ fontSize: 18, color: isPhaseActive ? phase.color : MUTED_2 }} />}
                sx={{
                  flexShrink: 0,
                  py: 1,
                  px: 2,
                  borderRadius: RADIUS_SM,
                  textTransform: "none",
                  fontWeight: isPhaseActive ? 800 : 700,
                  fontSize: 13,
                  color: isPhaseActive ? (isDark ? "#f8fafc" : INK) : MUTED,
                  bgcolor: isPhaseActive
                    ? isDark
                      ? alpha(phase.color, 0.15)
                      : alpha(phase.color, 0.08)
                    : isDark
                    ? "rgba(255,255,255,0.02)"
                    : "#F8FAFC",
                  border: `1.5px solid ${isPhaseActive ? phase.color : isDark ? "rgba(255,255,255,0.06)" : BORDER_SOFT}`,
                  boxShadow: isPhaseActive ? `0 2px 8px ${alpha(phase.color, 0.2)}` : "none",
                  transition: "all 0.18s ease",
                  "&:hover": {
                    bgcolor: isDark ? alpha(phase.color, 0.2) : alpha(phase.color, 0.12),
                    borderColor: phase.color,
                  },
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <span>{phase.shortName}</span>
                  {phase.id !== "overview" && (
                    <Chip
                      label={stats.allDone ? "All Done ✓" : `${stats.completed}/${stats.total}`}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: 10,
                        fontWeight: 800,
                        bgcolor: stats.allDone
                          ? alpha(SUCCESS, 0.2)
                          : isPhaseActive
                          ? alpha(phase.color, 0.2)
                          : isDark
                          ? "rgba(255,255,255,0.08)"
                          : "rgba(0,0,0,0.06)",
                        color: stats.allDone
                          ? (isDark ? "#34d399" : SUCCESS)
                          : isPhaseActive
                          ? phase.color
                          : MUTED,
                      }}
                    />
                  )}
                </Stack>
              </Button>
            );
          })}
        </Stack>

        {/* Stages Grid Cards Inside the Active Phase */}
        {(() => {
          const currentPhase = WORKFLOW_PHASES.find((p) => p.id === activePhaseId) || WORKFLOW_PHASES[1];
          const visibleStageKeys = getVisibleStageKeys(currentPhase.stageKeys);
          const effectivePayType = paymentForm?.paymentType || project?.paymentType || "Bank Loan";
          return (
            <Box sx={{ mt: 1 }}>
              <Grid container spacing={1.5}>
                {visibleStageKeys.map((stageKey) => {
                  const info = getStageInfo(stageKey, effectivePayType);
                  const Icon = info.icon;
                  const isSelected = selectedWorkflowStage === stageKey;
                  const state = stageState(stageKey);
                  const isDone = state === "done";

                  return (
                    <Grid item xs={12} sm={6} md={currentPhase.stageKeys.length <= 4 ? 3 : 4} key={stageKey}>
                      <Paper
                        elevation={0}
                        onClick={() => selectWorkflowStage(stageKey)}
                        sx={{
                          p: 1.75,
                          borderRadius: RADIUS_SM,
                          cursor: "pointer",
                          border: `1.5px solid ${isSelected ? BRAND : isDone ? alpha(SUCCESS, 0.4) : isDark ? "rgba(255,255,255,0.08)" : BORDER}`,
                          bgcolor: isSelected
                            ? isDark
                              ? alpha(BRAND, 0.16)
                              : alpha(BRAND, 0.05)
                            : isDark
                            ? "rgba(255,255,255,0.02)"
                            : "#FFFFFF",
                          boxShadow: isSelected
                            ? `0 4px 14px ${alpha(BRAND, 0.25)}`
                            : "none",
                          transition: "all 0.18s ease",
                          "&:hover": {
                            transform: "translateY(-2px)",
                            borderColor: BRAND,
                            boxShadow: `0 6px 18px ${alpha(BRAND, 0.14)}`,
                            bgcolor: isDark ? alpha(BRAND, 0.1) : alpha(BRAND, 0.03),
                          },
                        }}
                      >
                        {/* Card Header: Stage Number & Status Badge */}
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.25 }}>
                          <Typography
                            variant="caption"
                            fontWeight={800}
                            sx={{
                              color: isSelected ? BRAND : isDark ? "#94a3b8" : MUTED_2,
                              letterSpacing: "0.04em",
                              textTransform: "uppercase",
                              fontSize: 11,
                            }}
                          >
                            {info.stageNum}
                          </Typography>

                          {isDone ? (
                            <Chip
                              icon={<CheckCircle sx={{ fontSize: "14px !important" }} />}
                              label="Completed"
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: 10,
                                fontWeight: 800,
                                bgcolor: alpha(SUCCESS, isDark ? 0.2 : 0.12),
                                color: isDark ? "#34d399" : SUCCESS,
                                "& .MuiChip-icon": { color: `${isDark ? "#34d399" : SUCCESS} !important` },
                              }}
                            />
                          ) : isSelected ? (
                            <Chip
                              label="Active Stage"
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: 10,
                                fontWeight: 800,
                                bgcolor: BRAND,
                                color: "#fff",
                              }}
                            />
                          ) : (
                            <Chip
                              label="Pending"
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: 10,
                                fontWeight: 700,
                                bgcolor: isDark ? "rgba(255,255,255,0.06)" : alpha(NEUTRAL, 0.15),
                                color: isDark ? "#94a3b8" : MUTED,
                              }}
                            />
                          )}
                        </Stack>

                        {/* Card Body: Icon & Title */}
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Box
                            sx={{
                              width: 38,
                              height: 38,
                              borderRadius: "10px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              bgcolor: isDone
                                ? alpha(SUCCESS, 0.12)
                                : isSelected
                                ? alpha(BRAND, 0.15)
                                : isDark
                                ? "rgba(255,255,255,0.05)"
                                : alpha(currentPhase.color, 0.08),
                              color: isDone ? SUCCESS : isSelected ? BRAND : currentPhase.color,
                              flexShrink: 0,
                            }}
                          >
                            <Icon sx={{ fontSize: 20 }} />
                          </Box>
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography
                              variant="body2"
                              fontWeight={isSelected ? 800 : 700}
                              color={isSelected ? BRAND : isDark ? "#f8fafc" : INK}
                              sx={{
                                lineHeight: 1.25,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {info.label}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                color: isDark ? "#94a3b8" : MUTED,
                                display: "block",
                                mt: 0.25,
                                fontSize: 11,
                              }}
                            >
                              Click to view & update
                            </Typography>
                          </Box>
                        </Stack>
                      </Paper>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          );
        })()}
      </Paper>

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={selectedWorkflowStage === "summary" || selectedWorkflowStage === "inventory" || selectedWorkflowStage === "project_images" ? 12 : 8}>
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
          ) : selectedWorkflowStage === "inventory" ? (
            <ProjectProfitabilityCard
              projectId={project?._id || projectId}
              leadOrProject={project}
              onUpdate={(updatedData) => {
                if (updatedData?.financials?.projectSaleValue) {
                  setProject((prev) => ({
                    ...prev,
                    agreedPrice: updatedData.financials.projectSaleValue,
                    totalAmount: updatedData.financials.projectSaleValue,
                  }));
                }
              }}
            />
          ) : selectedWorkflowStage === "project_images" ? (
            <ProjectImagesWorkspace
              project={project}
              onUpdate={(updated) => setProject(updated)}
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
              onUploadPhotos={handleUploadInstallationPhotos}
              onDeletePhoto={handleDeleteInstallationPhoto}
              uploadingPhoto={uploadingInstallationPhoto}
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
          ) : selectedWorkflowStage === "dcr_generation" ? (
            <DcrGenerationWorkspace
              project={project}
              formData={dcrForm}
              errors={dcrErrors}
              saving={savingDcr}
              onChange={handleDcrChange}
              onCancel={() => setSelectedWorkflowStage("summary")}
              onSave={saveDcr}
              onUploadDocument={handleUploadStageDoc}
              uploadingDoc={uploadingStageDoc}
            />
          ) : selectedWorkflowStage === "notification_email" ? (
            <NotificationEmailWorkspace
              project={project}
              formData={notificationEmailForm}
              errors={notificationEmailErrors}
              saving={savingNotificationEmail}
              onChange={handleNotificationEmailChange}
              onCancel={() => setSelectedWorkflowStage("summary")}
              onSave={saveNotificationEmail}
            />
          ) : selectedWorkflowStage === "demand_note" ? (
            <DemandNoteWorkspace
              project={project}
              formData={demandNoteForm}
              errors={demandNoteErrors}
              saving={savingDemandNote}
              onChange={handleDemandNoteChange}
              onCancel={() => setSelectedWorkflowStage("summary")}
              onSave={saveDemandNote}
            />
          ) : selectedWorkflowStage === "demand_note_payment" ? (
            <DemandNotePaymentWorkspace
              project={project}
              formData={demandNotePaymentForm}
              errors={demandNotePaymentErrors}
              saving={savingDemandNotePayment}
              onChange={handleDemandNotePaymentChange}
              onCancel={() => setSelectedWorkflowStage("summary")}
              onSave={saveDemandNotePayment}
              onUploadDocument={handleUploadStageDoc}
              uploadingDoc={uploadingStageDoc}
            />
          ) : selectedWorkflowStage === "inspection" ? (
            <InspectionWorkspace
              project={project}
              formData={inspectionForm}
              errors={inspectionErrors}
              saving={savingInspection}
              onChange={handleInspectionChange}
              onCancel={() => setSelectedWorkflowStage("summary")}
              onSave={saveInspection}
              onUploadDocument={handleUploadStageDoc}
              uploadingDoc={uploadingStageDoc}
            />
          ) : selectedWorkflowStage === "meter_installation" ? (
            <MeterInstallationWorkspace
              project={project}
              formData={meterInstallationForm}
              errors={meterInstallationErrors}
              saving={savingMeterInstallation}
              onChange={handleMeterInstallationChange}
              onCancel={() => setSelectedWorkflowStage("summary")}
              onSave={saveMeterInstallation}
              onUploadDocument={handleUploadStageDoc}
              uploadingDoc={uploadingStageDoc}
            />
          ) : selectedWorkflowStage === "phase2_disbursement" ? (
            <Phase2DisbursementWorkspace
              project={project}
              formData={phase2DisbursementForm}
              errors={phase2DisbursementErrors}
              saving={savingPhase2Disbursement}
              onChange={handlePhase2DisbursementChange}
              onCancel={() => setSelectedWorkflowStage("summary")}
              onSave={savePhase2Disbursement}
            />
          ) : selectedWorkflowStage === "final_payment" ? (
            <FinalPaymentWorkspace
              project={project}
              formData={finalPaymentForm}
              errors={finalPaymentErrors}
              saving={savingFinalPayment}
              onChange={handleFinalPaymentChange}
              onCancel={() => setSelectedWorkflowStage("summary")}
              onSave={saveFinalPayment}
            />
          ) : selectedWorkflowStage === "project_commissioning" ? (
            <ProjectCommissioningWorkspace
              project={project}
              formData={projectCommissioningForm}
              errors={projectCommissioningErrors}
              saving={savingProjectCommissioning}
              onChange={handleProjectCommissioningChange}
              onCancel={() => setSelectedWorkflowStage("summary")}
              onSave={saveProjectCommissioning}
            />
          ) : selectedWorkflowStage === "discom_approval" ? (
            <DiscomApprovalWorkspace
              project={project}
              formData={discomApprovalForm}
              errors={discomApprovalErrors}
              saving={savingDiscomApproval}
              onChange={handleDiscomApprovalChange}
              onCancel={() => setSelectedWorkflowStage("summary")}
              onSave={saveDiscomApproval}
            />
          ) : selectedWorkflowStage === "subsidy_redeemed" ? (
            <SubsidyRedeemedWorkspace
              project={project}
              formData={subsidyRedeemedForm}
              errors={subsidyRedeemedErrors}
              saving={savingSubsidyRedeemed}
              onChange={handleSubsidyRedeemedChange}
              onCancel={() => setSelectedWorkflowStage("summary")}
              onSave={saveSubsidyRedeemed}
            />
          ) : selectedWorkflowStage === "subsidy_received" ? (
            <SubsidyReceivedWorkspace
              project={project}
              formData={subsidyReceivedForm}
              errors={subsidyReceivedErrors}
              saving={savingSubsidyReceived}
              onChange={handleSubsidyReceivedChange}
              onCancel={() => setSelectedWorkflowStage("summary")}
              onSave={saveSubsidyReceived}
            />
<<<<<<< HEAD
          ) : selectedWorkflowStage === "lead_converted" ? (
            <LeadConvertedWorkspace
              project={project}
              onGoToStage={(stg) => setSelectedWorkflowStage(stg)}
            />
          ) : (
            <Paper elevation={0} sx={{ minHeight: 220, p: 3, borderRadius: RADIUS, border: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${BORDER}`, bgcolor: isDark ? "#0b0e1a" : PANEL, color: isDark ? "#f8fafc" : "inherit", boxShadow: SHADOW_SM }}>
              <Stack alignItems="center" justifyContent="center" spacing={1.5} sx={{ minHeight: 170, textAlign: "center" }}>
                <Box sx={{ width: 56, height: 56, borderRadius: "50%", bgcolor: isDark ? "rgba(59, 130, 246, 0.12)" : alpha(BRAND, 0.08), display: "flex", alignItems: "center", justifyContent: "center", color: isDark ? "#60a5fa" : BRAND }}>
                  <TaskAlt sx={{ fontSize: 32 }} />
                </Box>
                <Typography variant="subtitle1" fontWeight={800} color={isDark ? "#f8fafc" : INK}>
                  {selectedWorkflow.label} Workspace
                </Typography>
                <Typography variant="body2" sx={{ color: isDark ? "#94a3b8" : MUTED, maxWidth: 520 }}>
=======
          ) : (
            <Paper elevation={0} sx={{ minHeight: 220, p: 3, borderRadius: RADIUS, border: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${BORDER}`, bgcolor: isDark ? "#0b0e1a" : PANEL, color: isDark ? "#f8fafc" : "inherit", boxShadow: SHADOW_SM }}>
              <Stack alignItems="center" justifyContent="center" spacing={1.25} sx={{ minHeight: 170, textAlign: "center" }}>
                <TaskAlt sx={{ fontSize: 44, color: alpha(INK, 0.25) }} />
                <Typography variant="subtitle1" fontWeight={800} color={isDark ? "#f8fafc" : INK}>
                  {selectedWorkflow.label} Workspace
                </Typography>
                <Typography variant="body2" sx={{ color: MUTED, maxWidth: 520 }}>
>>>>>>> origin/dipak
                  This stage is available in the project workflow. Open the full page when you need the detailed update tools.
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => openStagePage(selectedWorkflowStage)}
<<<<<<< HEAD
                  sx={{
                    mt: 1,
                    borderRadius: RADIUS_SM,
                    borderColor: isDark ? "rgba(255,255,255,0.2)" : BORDER,
                    color: isDark ? "#f8fafc" : INK,
                    fontWeight: 800,
                    textTransform: "none",
                    px: 2.5,
                    py: 0.75,
                    bgcolor: isDark ? "rgba(255,255,255,0.04)" : "transparent",
                    "&:hover": {
                      borderColor: isDark ? "rgba(255,255,255,0.4)" : BRAND,
                      bgcolor: isDark ? "rgba(255,255,255,0.08)" : alpha(BRAND, 0.04),
                    },
                  }}
=======
                  sx={{ mt: 1, borderRadius: RADIUS_SM, borderColor: BORDER, color: INK, fontWeight: 700, textTransform: "none" }}
>>>>>>> origin/dipak
                >
                  Open {selectedWorkflow.label}
                </Button>
              </Stack>
            </Paper>
          )}
        </Grid>
        {selectedWorkflowStage !== "summary" && selectedWorkflowStage !== "inventory" && (
        <Grid item xs={12} md={4}>
          <Stack spacing={2.5}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: RADIUS,
                border: isDark ? "1px solid rgba(255,255,255,0.08)" : `1px solid ${BORDER}`,
                bgcolor: isDark ? "#0b0e1a" : PANEL,
                color: isDark ? "#f8fafc" : "inherit",
                boxShadow: SHADOW_SM,
              }}
            >
              {/* Header with Progress */}
              <Box sx={{ mb: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: "7px",
                        bgcolor: alpha(BRAND, 0.1),
                        color: BRAND,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <FactCheck sx={{ fontSize: 16 }} />
                    </Box>
                    <Typography variant="subtitle2" fontWeight={800} color={isDark ? "#f8fafc" : INK}>
                      Workflow Progress
                    </Typography>
                  </Stack>
                  <Typography variant="caption" fontWeight={800} color={BRAND}>
                    {progress}%
                  </Typography>
                </Stack>

                <LinearProgress
                  variant="determinate"
                  value={progress}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    bgcolor: isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0",
                    "& .MuiLinearProgress-bar": {
                      borderRadius: 3,
                      bgcolor: progress >= 100 ? SUCCESS : BRAND,
                    },
                  }}
                />
                <Typography variant="caption" sx={{ color: MUTED_2, display: "block", mt: 0.75, fontSize: 11 }}>
                  {completedStageCount} of {allVisibleStages.length} stages completed
                </Typography>
              </Box>

              <Divider sx={{ mb: 1.5, borderColor: isDark ? "rgba(255,255,255,0.06)" : BORDER_SOFT }} />

              {/* Scrollable Stage List */}
              <Stack
                spacing={0.75}
                sx={{
                  maxHeight: 520,
                  overflowY: "auto",
                  pr: 0.5,
                  "&::-webkit-scrollbar": { width: 5 },
                  "&::-webkit-scrollbar-thumb": {
                    bgcolor: isDark ? "rgba(255,255,255,0.15)" : "#cbd5e1",
                    borderRadius: 3,
                  },
                }}
              >
                {allVisibleStages.map((stage, index) => {
                  const state = stageState(stage.key);
                  const isSelected = stage.key === selectedWorkflowStage;
                  const isDone = state === "done";
                  const isActive = state === "active" || isSelected;

                  return (
                    <Box
                      key={stage.key}
                      onClick={() => selectWorkflowStage(stage.key)}
                      sx={{
                        p: 1.1,
                        borderRadius: "10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                        border: isSelected
                          ? `1px solid ${BRAND}`
                          : isDark
                          ? "1px solid transparent"
                          : "1px solid transparent",
                        bgcolor: isSelected
                          ? alpha(BRAND, isDark ? 0.15 : 0.08)
                          : isDark
                          ? "rgba(255,255,255,0.02)"
                          : "transparent",
                        transition: "all 0.15s ease",
                        "&:hover": {
                          bgcolor: isSelected
                            ? alpha(BRAND, isDark ? 0.2 : 0.12)
                            : isDark
                            ? "rgba(255,255,255,0.06)"
                            : "#f8fafc",
                          transform: "translateX(2px)",
                        },
                      }}
                    >
                      <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0, flex: 1, mr: 1 }}>
                        <Box
                          sx={{
                            width: 24,
                            height: 24,
                            borderRadius: "6px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            bgcolor: isDone
                              ? alpha(SUCCESS, isDark ? 0.25 : 0.12)
                              : isSelected
                              ? alpha(BRAND, isDark ? 0.3 : 0.15)
                              : isDark
                              ? "rgba(255,255,255,0.05)"
                              : "#f1f5f9",
                            color: isDone ? SUCCESS : isSelected ? BRAND : isDark ? "#64748b" : "#94a3b8",
                            flexShrink: 0,
                          }}
                        >
                          {isDone ? (
                            <CheckCircle sx={{ fontSize: 14 }} />
                          ) : (
                            <Typography sx={{ fontSize: 10, fontWeight: 800 }}>
                              {index + 1}
                            </Typography>
                          )}
                        </Box>

                        <Typography
                          variant="caption"
                          noWrap
                          sx={{
                            color: isSelected ? (isDark ? "#ffffff" : BRAND) : isDark ? "#f8fafc" : INK,
                            fontWeight: isSelected ? 800 : isDone ? 600 : 500,
                            fontSize: "0.785rem",
                          }}
                        >
                          {stage.label}
                        </Typography>
                      </Stack>

                      {/* Status Chip */}
                      <Chip
                        label={isDone ? "Completed" : isActive ? "Active" : "Pending"}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: 10,
                          fontWeight: 800,
                          borderRadius: "5px",
                          bgcolor: isDone
                            ? alpha(SUCCESS, isDark ? 0.2 : 0.1)
                            : isActive
                            ? alpha(BRAND, isDark ? 0.25 : 0.12)
                            : isDark
                            ? "rgba(255,255,255,0.05)"
                            : "#f1f5f9",
                          color: isDone
                            ? (isDark ? "#4ade80" : SUCCESS)
                            : isActive
                            ? (isDark ? "#93c5fd" : BRAND)
                            : isDark
                            ? "#64748b"
                            : "#94a3b8",
                          border: isDone
                            ? `1px solid ${alpha(SUCCESS, 0.25)}`
                            : isActive
                            ? `1px solid ${alpha(BRAND, 0.3)}`
                            : "1px solid transparent",
                        }}
                      />
                    </Box>
                  );
                })}
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
