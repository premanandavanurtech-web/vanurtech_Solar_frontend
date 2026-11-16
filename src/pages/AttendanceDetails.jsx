
// pages/AttendanceDetails.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  Box,
  Stack,
  Grid,
  Paper,
  Chip,
  Avatar,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  useTheme,
  useMediaQuery,
  Slide,
  Fade,
  CircularProgress,
  alpha,
  Menu,
  ListItemIcon,
  ListItemText,
  Divider,
} from "@mui/material";
import {
  Close,
  LocationOn,
  Edit,
  Delete,
  Save,
  Cancel,
  Person,
  CalendarToday,
  CheckCircle,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Login,
  Logout,
  FileDownload,
  Print,
  ContentCopy,
  ExpandMore,
  Phone,
  Email,
  AccessTime,
  TouchApp,
  FiberManualRecord,
} from "@mui/icons-material";
import { useAttendance } from "../hooks/useAttendance";
import { format } from "date-fns";
import { toBackendAssetUrl } from "../utils/backendAssetUrl";

// ─── Theme Colors supporting Light & Dark Mode ─────────────────────────────
const getDialogTheme = (isDark) => ({
  dialogBg: isDark ? "#0b1222" : "#ffffff",
  cardBg: isDark ? "#111b33" : "#f8fafc",
  cardBorder: isDark ? "rgba(255, 255, 255, 0.08)" : "#e2e8f0",
  inputBg: isDark ? "#0c1527" : "#ffffff",
  textPrimary: isDark ? "#f8fafc" : "#0f172a",
  textSecondary: isDark ? "#94a3b8" : "#64748b",
  textMuted: isDark ? "#64748b" : "#94a3b8",
  headerBg: isDark ? "rgba(255, 255, 255, 0.02)" : "#f8fafc",
  blue: "#2563eb",
  sky: isDark ? "#38bdf8" : "#0284c7",
  green: isDark ? "#10b981" : "#059669",
  greenLight: isDark ? "#34d399" : "#16a34a",
  greenCardBg: isDark ? "rgba(16, 185, 129, 0.05)" : "rgba(16, 185, 129, 0.06)",
  greenCardBorder: isDark ? "rgba(16, 185, 129, 0.25)" : "rgba(16, 185, 129, 0.25)",
  orange: isDark ? "#f59e0b" : "#d97706",
  orangeLight: isDark ? "#fbbf24" : "#ea580c",
  orangeCardBg: isDark ? "rgba(245, 158, 11, 0.05)" : "rgba(245, 158, 11, 0.06)",
  orangeCardBorder: isDark ? "rgba(245, 158, 11, 0.25)" : "rgba(245, 158, 11, 0.25)",
  red: "#ef4444",
  purple: "#a855f7",
  divider: isDark ? "rgba(255, 255, 255, 0.06)" : "#f1f5f9",
  closeBtnBg: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.04)",
  btnBorder: isDark ? "rgba(255, 255, 255, 0.12)" : "#cbd5e1",
  btnBg: isDark ? "rgba(255, 255, 255, 0.04)" : "#f1f5f9",
  btnHoverBg: isDark ? "rgba(255, 255, 255, 0.08)" : "#e2e8f0",
});

export const getAllStatusConfigs = (isDark = false) => ({
  present: {
    bg: isDark ? "rgba(16, 185, 129, 0.12)" : "#d1fae5",
    color: isDark ? "#34d399" : "#065f46",
    border: isDark ? "rgba(16, 185, 129, 0.3)" : "#a7f3d0",
    iconColor: isDark ? "#34d399" : "#059669",
    icon: <CheckCircle sx={{ fontSize: 16 }} />,
    label: "Present",
  },
  punch_in_mobile: {
    bg: isDark ? "rgba(6, 182, 212, 0.12)" : "#cffafe",
    color: isDark ? "#22d3ee" : "#0e7490",
    border: isDark ? "rgba(6, 182, 212, 0.3)" : "#a5f3fc",
    iconColor: isDark ? "#22d3ee" : "#0891b2",
    icon: <TouchApp sx={{ fontSize: 16 }} />,
    label: "Punch In (Mobile)",
  },
  absent: {
    bg: isDark ? "rgba(239, 68, 68, 0.12)" : "#fee2e2",
    color: isDark ? "#f87171" : "#991b1b",
    border: isDark ? "rgba(239, 68, 68, 0.3)" : "#fecaca",
    iconColor: isDark ? "#f87171" : "#dc2626",
    icon: <ErrorIcon sx={{ fontSize: 16 }} />,
    label: "Absent",
  },
  late: {
    bg: isDark ? "rgba(245, 158, 11, 0.12)" : "#fef3c7",
    color: isDark ? "#fbbf24" : "#92400e",
    border: isDark ? "rgba(245, 158, 11, 0.3)" : "#fde68a",
    iconColor: isDark ? "#fbbf24" : "#d97706",
    icon: <WarningIcon sx={{ fontSize: 16 }} />,
    label: "Late",
  },
  leave: {
    bg: isDark ? "rgba(168, 85, 247, 0.12)" : "#f3e8ff",
    color: isDark ? "#c084fc" : "#6b21a8",
    border: isDark ? "rgba(168, 85, 247, 0.3)" : "#e9d5ff",
    iconColor: isDark ? "#c084fc" : "#9333ea",
    icon: <Person sx={{ fontSize: 16 }} />,
    label: "Leave",
  },
  holiday: {
    bg: isDark ? "rgba(59, 130, 246, 0.12)" : "#dbeafe",
    color: isDark ? "#60a5fa" : "#1e40af",
    border: isDark ? "rgba(59, 130, 246, 0.3)" : "#bfdbfe",
    iconColor: isDark ? "#60a5fa" : "#2563eb",
    icon: <CalendarToday sx={{ fontSize: 16 }} />,
    label: "Holiday",
  },
  "half-day": {
    bg: isDark ? "rgba(245, 158, 11, 0.12)" : "#fef3c7",
    color: isDark ? "#fbbf24" : "#92400e",
    border: isDark ? "rgba(245, 158, 11, 0.3)" : "#fde68a",
    iconColor: isDark ? "#fbbf24" : "#d97706",
    icon: <WarningIcon sx={{ fontSize: 16 }} />,
    label: "Half Day",
  },
});

export const STATUS_CONFIG = getAllStatusConfigs(false);

export const getStatusConfig = (status, isDark = false) => {
  const norm = String(status || "present").toLowerCase().replace(/\s+/g, "_");
  const configs = getAllStatusConfigs(isDark);
  return configs[norm] || configs.present;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDateFull = (ts) => {
  if (!ts) return "—";
  try {
    return new Date(ts).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "—";
  }
};

const fmtTimeSec = (ts) => {
  if (!ts) return "—";
  try {
    return new Date(ts).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  } catch {
    return "—";
  }
};

const fmtDateTime = (ts) => {
  if (!ts) return "—";
  try {
    return format(new Date(ts), "dd MMM yyyy, hh:mm a");
  } catch {
    return "—";
  }
};

const resolveAddress = (addr) => {
  if (!addr) return "No location recorded";
  if (typeof addr === "string") return addr;
  return addr.full || addr.short || "No location recorded";
};

// ─── StatusChip Component ─────────────────────────────────────────────────────
const StatusChip = ({ status }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const cfg = getStatusConfig(status, isDark);
  return (
    <Chip
      size="small"
      label={cfg.label}
      icon={React.cloneElement(cfg.icon, { sx: { fontSize: 16, color: `${cfg.iconColor} !important` } })}
      sx={{
        bgcolor: cfg.bg,
        color: cfg.color,
        fontWeight: 800,
        fontSize: "0.75rem",
        borderRadius: "999px",
        border: `1px solid ${cfg.border}`,
        px: 0.5,
        height: 28,
        "& .MuiChip-icon": { color: `${cfg.iconColor} !important`, ml: 0.5 },
      }}
    />
  );
};

// ─── Export & Format Utilities ───────────────────────────────────────────────
const fmtShortDate = (ts) => {
  if (!ts) return "N/A";
  try {
    return new Date(ts).toLocaleDateString();
  } catch {
    return String(ts);
  }
};

const fmtShortTime = (ts) => {
  if (!ts) return "N/A";
  try {
    return new Date(ts).toLocaleTimeString();
  } catch {
    return String(ts);
  }
};

export const downloadFile = (content, fileName, mimeType) => {
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const generateCSV = (records) => {
  const list = Array.isArray(records) ? records : (records ? [records] : []);

  const headers = [
    "Record ID", "Employee Name", "Employee ID", "Employee Email", "Employee Phone",
    "Date", "Status", "Work Hours", "Total Minutes",
    "Punch In Time", "Punch In Address", "Punch In Lat", "Punch In Lng",
    "Punch Out Time", "Punch Out Address", "Punch Out Lat", "Punch Out Lng",
    "Remarks", "Created At", "Updated At",
  ];

  const escape = (val) => {
    const s = val == null ? "" : String(val);
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? '"' + s.replace(/"/g, '""') + '"' : s;
  };

  const rows = list.map((a) => [
    a._id || a.id || "",
    a.user?.name || a.userName || "",
    a.user?.employeeId || a.employeeId || "",
    a.user?.email || a.userEmail || "",
    a.user?.phone || a.user?.phoneNumber || a.userPhone || "",
    fmtShortDate(a.date),
    a.status || "",
    a.workHoursFormatted || "",
    a.workHours || "",
    fmtShortTime(a.punchIn?.time),
    resolveAddress(a.punchIn?.address),
    a.punchIn?.location?.lat || a.punchIn?.latitude || "",
    a.punchIn?.location?.lng || a.punchIn?.longitude || "",
    fmtShortTime(a.punchOut?.time),
    resolveAddress(a.punchOut?.address),
    a.punchOut?.location?.lat || a.punchOut?.latitude || "",
    a.punchOut?.location?.lng || a.punchOut?.longitude || "",
    a.remarks || "",
    fmtDateTime(a.createdAt),
    fmtDateTime(a.updatedAt),
  ]);

  return [headers, ...rows].map((row) => row.map(escape).join(",")).join("\n");
};

export const generateJSON = (records) => {
  const list = Array.isArray(records) ? records : (records ? [records] : []);
  const enriched = list.map((a) => {
    const clone = JSON.parse(JSON.stringify(a || {}));
    if (clone.date) clone.date_formatted = fmtShortDate(a.date);
    if (clone.punchIn?.time) clone.punchIn.time_formatted = fmtDateTime(a.punchIn.time);
    if (clone.punchOut?.time) clone.punchOut.time_formatted = fmtDateTime(a.punchOut.time);
    if (clone.createdAt) clone.createdAt_formatted = fmtDateTime(a.createdAt);
    if (clone.updatedAt) clone.updatedAt_formatted = fmtDateTime(a.updatedAt);
    return clone;
  });
  return JSON.stringify(list.length === 1 ? enriched[0] : enriched, null, 2);
};

export const printRecord = (a) => {
  if (!a) return;
  const win = window.open("", "_blank");
  if (!win) {
    alert("Please allow pop-ups to print");
    return;
  }

  win.document.write(`
    <html>
      <head>
        <title>Attendance Record – ${a.user?.name || "Employee"}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; background: #fff; padding: 40px; }
          h1 { font-size: 22px; color: #0f1f3d; margin-bottom: 4px; }
          .sub { color: #888; font-size: 13px; margin-bottom: 24px; }
          .card { border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px 20px; margin-bottom: 16px; }
          .card-title { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 10px; font-weight: 700; }
          .row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
          .row:last-child { border-bottom: none; }
          .label { color: #64748b; font-weight: 600; }
          .value { font-weight: 600; text-align: right; max-width: 60%; }
          .punch-in { border-left: 4px solid #22c55e; }
          .punch-out { border-left: 4px solid #f59e0b; }
          .footer { margin-top: 24px; font-size: 11px; color: #aaa; }
        </style>
      </head>
      <body>
        <h1>Attendance Record</h1>
        <div class="sub">Exported on ${new Date().toLocaleString()}</div>

        <div class="card">
          <div class="card-title">Employee & Summary</div>
          <div class="row"><span class="label">Employee</span><span class="value">${a.user?.name || "N/A"}</span></div>
          <div class="row"><span class="label">Employee ID</span><span class="value">${a.user?.employeeId || "N/A"}</span></div>
          <div class="row"><span class="label">Email</span><span class="value">${a.user?.email || "N/A"}</span></div>
          <div class="row"><span class="label">Date</span><span class="value">${fmtDateFull(a.date)}</span></div>
          <div class="row"><span class="label">Status</span><span class="value">${a.status || "N/A"}</span></div>
          <div class="row"><span class="label">Work Hours</span><span class="value">${a.workHoursFormatted || a.workHours || "N/A"}</span></div>
        </div>

        <div class="card punch-in">
          <div class="card-title">Punch In</div>
          <div class="row"><span class="label">Time</span><span class="value">${fmtTimeSec(a.punchIn?.time)}</span></div>
          <div class="row"><span class="label">Address</span><span class="value">${resolveAddress(a.punchIn?.address)}</span></div>
          ${a.punchIn?.location ? `<div class="row"><span class="label">Coordinates</span><span class="value">${a.punchIn.location.lat}, ${a.punchIn.location.lng}</span></div>` : ""}
        </div>

        <div class="card punch-out">
          <div class="card-title">Punch Out</div>
          <div class="row"><span class="label">Time</span><span class="value">${fmtTimeSec(a.punchOut?.time)}</span></div>
          <div class="row"><span class="label">Address</span><span class="value">${resolveAddress(a.punchOut?.address)}</span></div>
          ${a.punchOut?.location ? `<div class="row"><span class="label">Coordinates</span><span class="value">${a.punchOut.location.lat}, ${a.punchOut.location.lng}</span></div>` : ""}
        </div>

        ${a.remarks ? `<div class="card"><div class="card-title">Remarks</div><p style="font-size:13px">${a.remarks}</p></div>` : ""}

        <div class="footer">
          Record ID: ${a._id || a.id || "N/A"} &nbsp;|&nbsp;
          Created: ${fmtDateTime(a.createdAt)} &nbsp;|&nbsp;
          Updated: ${fmtDateTime(a.updatedAt)}
        </div>
      </body>
    </html>
  `);
  win.document.close();
  win.print();
};

const ActionExportMenu = ({ attendance, onSnack }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const T = getDialogTheme(isDark);
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const ts = format(new Date(), "yyyyMMdd_HHmmss");
  const id = attendance?._id || attendance?.id || "record";

  const handle = (fn) => () => {
    setAnchorEl(null);
    fn();
  };

  const exportCSV = handle(() => {
    try {
      downloadFile(generateCSV(attendance), `attendance_${id}_${ts}.csv`, "text/csv");
      onSnack("Exported as CSV");
    } catch {
      onSnack("Export failed", "error");
    }
  });

  const exportJSON = handle(() => {
    try {
      downloadFile(generateJSON(attendance), `attendance_${id}_${ts}.json`, "application/json");
      onSnack("Exported as JSON");
    } catch {
      onSnack("Export failed", "error");
    }
  });

  const copyClip = handle(() => {
    try {
      navigator.clipboard.writeText(generateJSON(attendance));
      onSnack("Copied to clipboard");
    } catch {
      onSnack("Copy failed", "error");
    }
  });

  const print = handle(() => {
    try {
      printRecord(attendance);
      onSnack("Print preview opened");
    } catch {
      onSnack("Print failed", "error");
    }
  });

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<FileDownload sx={{ fontSize: 16 }} />}
        endIcon={<ExpandMore sx={{ fontSize: 16 }} />}
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{
          borderRadius: "10px",
          borderColor: T.btnBorder,
          bgcolor: T.btnBg,
          color: T.textPrimary,
          fontWeight: 700,
          fontSize: "0.82rem",
          textTransform: "none",
          px: 1.8,
          py: 0.8,
          "&:hover": { bgcolor: T.btnHoverBg, borderColor: isDark ? "rgba(255, 255, 255, 0.2)" : "#94a3b8" },
        }}
      >
        Export
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        PaperProps={{
          sx: {
            mt: 1,
            borderRadius: "12px",
            minWidth: 180,
            bgcolor: isDark ? "#111b33" : "#ffffff",
            border: `1px solid ${T.cardBorder}`,
            color: T.textPrimary,
            boxShadow: isDark ? "0 12px 32px rgba(0,0,0,0.5)" : "0 10px 25px rgba(15,23,42,0.12)",
          },
        }}
        transformOrigin={{ horizontal: "left", vertical: "bottom" }}
        anchorOrigin={{ horizontal: "left", vertical: "top" }}
      >
        <Box sx={{ px: 2, pt: 1.5, pb: 0.5 }}>
          <Typography
            variant="caption"
            sx={{
              color: T.textMuted,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 0.5,
              fontSize: "0.65rem",
            }}
          >
            Export This Record
          </Typography>
        </Box>
        <MenuItem onClick={exportCSV} sx={{ py: 1, "&:hover": { bgcolor: isDark ? "rgba(255, 255, 255, 0.06)" : "#f1f5f9" } }}>
          <ListItemIcon><FileDownload fontSize="small" sx={{ color: T.greenLight }} /></ListItemIcon>
          <ListItemText primary="Export as CSV" primaryTypographyProps={{ fontSize: "0.82rem", fontWeight: 600, color: T.textPrimary }} />
        </MenuItem>
        <MenuItem onClick={exportJSON} sx={{ py: 1, "&:hover": { bgcolor: isDark ? "rgba(255, 255, 255, 0.06)" : "#f1f5f9" } }}>
          <ListItemIcon><FileDownload fontSize="small" sx={{ color: T.sky }} /></ListItemIcon>
          <ListItemText primary="Export as JSON" primaryTypographyProps={{ fontSize: "0.82rem", fontWeight: 600, color: T.textPrimary }} />
        </MenuItem>
        <Divider sx={{ my: 0.5, borderColor: T.cardBorder }} />
        <MenuItem onClick={copyClip} sx={{ py: 1, "&:hover": { bgcolor: isDark ? "rgba(255, 255, 255, 0.06)" : "#f1f5f9" } }}>
          <ListItemIcon><ContentCopy fontSize="small" sx={{ color: T.textSecondary }} /></ListItemIcon>
          <ListItemText primary="Copy to Clipboard" primaryTypographyProps={{ fontSize: "0.82rem", fontWeight: 600, color: T.textPrimary }} />
        </MenuItem>
        <MenuItem onClick={print} sx={{ py: 1, "&:hover": { bgcolor: isDark ? "rgba(255, 255, 255, 0.06)" : "#f1f5f9" } }}>
          <ListItemIcon><Print fontSize="small" sx={{ color: T.textSecondary }} /></ListItemIcon>
          <ListItemText primary="Print" primaryTypographyProps={{ fontSize: "0.82rem", fontWeight: 600, color: T.textPrimary }} />
        </MenuItem>
      </Menu>
    </>
  );
};

// ─── Main AttendanceDetails Modal Component ──────────────────────────────────
export default function AttendanceDetails({
  open,
  onClose,
  attendance,
  canEdit = true,
  canDelete = true,
  onEdit,
  onDelete,
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const T = useMemo(() => getDialogTheme(isDark), [isDark]);
  const statusConfigs = useMemo(() => getAllStatusConfigs(isDark), [isDark]);
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { updateAttendance } = useAttendance();

  const [editMode, setEditMode] = useState(false);
  const [editLoad, setEditLoad] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const showSnack = useCallback((message, severity = "success") =>
    setSnackbar({ open: true, message, severity }), []);

  // Form State
  const [formData, setFormData] = useState({
    status: "present",
    punchInTime: "09:00",
    punchOutTime: "18:00",
    workHours: "0",
    remarks: "",
  });

  // Reset editMode whenever dialog opens or attendance changes
  useEffect(() => {
    setEditMode(false);
  }, [attendance, open]);

  // Populate edit fields when attendance changes or editMode is triggered
  useEffect(() => {
    if (!attendance) return;

    let inTime = "";
    if (attendance.punchIn?.time) {
      try {
        const d = new Date(attendance.punchIn.time);
        inTime = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
      } catch {}
    }

    let outTime = "";
    if (attendance.punchOut?.time) {
      try {
        const d = new Date(attendance.punchOut.time);
        outTime = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
      } catch {}
    }

    const normStatus = String(attendance.status || "present").toLowerCase().replace(/\s+/g, "_");

    setFormData({
      status: normStatus in statusConfigs ? normStatus : "present",
      punchInTime: inTime || "09:00",
      punchOutTime: outTime || "18:30",
      workHours: String(attendance.workHours || 0),
      remarks: attendance.remarks || "",
    });
  }, [attendance, statusConfigs]);

  // Auto-calculate work hours whenever punchInTime or punchOutTime changes
  const calculateWorkHours = (inTime, outTime) => {
    if (!inTime || !outTime) return;
    const [hIn, mIn] = inTime.split(":").map(Number);
    const [hOut, mOut] = outTime.split(":").map(Number);
    if (Number.isFinite(hIn) && Number.isFinite(hOut)) {
      let diff = (hOut * 60 + mOut) - (hIn * 60 + mIn);
      if (diff < 0) diff += 24 * 60; // next day wrap
      const calculatedHours = (diff / 60).toFixed(1);
      setFormData((prev) => ({
        ...prev,
        workHours: calculatedHours.endsWith(".0") ? String(Math.round(diff / 60)) : calculatedHours,
      }));
    }
  };

  const handlePunchInTimeChange = (e) => {
    const val = e.target.value;
    setFormData((p) => ({ ...p, punchInTime: val }));
    calculateWorkHours(val, formData.punchOutTime);
  };

  const handlePunchOutTimeChange = (e) => {
    const val = e.target.value;
    setFormData((p) => ({ ...p, punchOutTime: val }));
    calculateWorkHours(formData.punchInTime, val);
  };

  if (!attendance) return null;

  const a = attendance;
  const targetUser = a.user || {};
  const userName =
    targetUser.name ||
    [targetUser.firstName, targetUser.lastName].filter(Boolean).join(" ") ||
    targetUser.email ||
    "Team Member";
  const userInitial = (userName || "D").charAt(0).toUpperCase();
  const userPhone = targetUser.phoneNumber || targetUser.phone || "—";
  const userEmail = targetUser.email || "—";

  // Work Hours format
  const hoursNum = Number(a.workHours || 0);
  const h = Math.floor(hoursNum);
  const m = Math.round((hoursNum - h) * 60);
  const workHoursDisplay = a.workHoursFormatted || `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

  const punchInTimeDisplay = a.punchIn?.time ? fmtTimeSec(a.punchIn.time) : "Not recorded";
  const punchOutTimeDisplay = a.punchOut?.time
    ? fmtTimeSec(a.punchOut.time)
    : a.punchIn?.time
    ? "Ongoing"
    : "No punch out recorded";

  const handleEditSave = async () => {
    setEditLoad(true);
    try {
      const id = a._id || a.id || "new";

      // Build Date objects for Punch In & Punch Out based on the record's date
      const baseDate = a.date || a.createdAt || new Date().toISOString();
      const baseDateStr = format(new Date(baseDate), "yyyy-MM-dd");

      const payload = {
        userId: a.user?._id || a.user?.id || (typeof a.user === "string" ? a.user : undefined),
        date: baseDate,
        status: formData.status,
        remarks: formData.remarks,
        workHours: Number(formData.workHours) || 0,
      };

      const isPresent = formData.status === "present" || formData.status === "late" || formData.status === "half-day";

      if (formData.punchInTime && isPresent) {
        payload.punchIn = {
          time: new Date(`${baseDateStr}T${formData.punchInTime}:00`).toISOString(),
          address: a.punchIn?.address || "Marked by Admin",
          location: {
            lat: Number(a.punchIn?.location?.lat || 0),
            lng: Number(a.punchIn?.location?.lng || 0),
          },
          battery: {
            percentage: Number(a.punchIn?.battery?.percentage ?? 100),
            isCharging: Boolean(a.punchIn?.battery?.isCharging ?? false),
          },
        };
      } else {
        payload.punchIn = {
          time: null,
          address: "Marked absent by Admin",
          location: { lat: 0, lng: 0 },
          battery: { percentage: 0, isCharging: false },
        };
      }

      if (formData.punchOutTime && isPresent) {
        payload.punchOut = {
          time: new Date(`${baseDateStr}T${formData.punchOutTime}:00`).toISOString(),
          address: a.punchOut?.address || "Marked by Admin",
          location: {
            lat: Number(a.punchOut?.location?.lat || 0),
            lng: Number(a.punchOut?.location?.lng || 0),
          },
          battery: {
            percentage: Number(a.punchOut?.battery?.percentage ?? 100),
            isCharging: Boolean(a.punchOut?.battery?.isCharging ?? false),
          },
        };
      } else {
        payload.punchOut = {
          time: null,
          address: "Marked absent by Admin",
          location: { lat: 0, lng: 0 },
          battery: { percentage: 0, isCharging: false },
        };
      }

      const res = await updateAttendance(id, payload);
      if (res?.success) {
        showSnack("Attendance record updated successfully!");
        setEditMode(false);
        if (onEdit) onEdit(res.data || { ...a, ...payload });
      } else {
        showSnack(res?.error || "Update failed", "error");
      }
    } catch (err) {
      showSnack(err?.message || "Failed to update attendance", "error");
    } finally {
      setEditLoad(false);
    }
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this attendance record?")) {
      if (onDelete) onDelete(a);
      onClose();
    }
  };

  const handleClose = () => {
    setEditMode(false);
    onClose();
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : "22px",
            bgcolor: T.dialogBg,
            color: T.textPrimary,
            border: `1px solid ${T.cardBorder}`,
            boxShadow: isDark
              ? "0 24px 64px rgba(0, 0, 0, 0.65)"
              : "0 20px 48px rgba(15, 23, 42, 0.12)",
            overflow: "hidden",
            maxHeight: isMobile ? "100%" : "92vh",
          },
        }}
        TransitionComponent={isMobile ? Slide : Fade}
        TransitionProps={isMobile ? { direction: "up" } : {}}
      >
        {/* Header */}
        <DialogTitle
          sx={{
            px: { xs: 2, sm: 3 },
            py: 2.2,
            borderBottom: `1px solid ${T.cardBorder}`,
            bgcolor: T.headerBg,
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            {/* Left: Avatar + Title + Date */}
            <Stack direction="row" spacing={1.8} alignItems="center">
              <Avatar
                sx={{
                  bgcolor: T.blue,
                  color: "#fff",
                  width: 44,
                  height: 44,
                  fontWeight: 800,
                  fontSize: "1.15rem",
                  boxShadow: "0 4px 14px rgba(37, 99, 235, 0.35)",
                }}
              >
                {userInitial}
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={800} sx={{ color: T.textPrimary, fontSize: "1.1rem", lineHeight: 1.2 }}>
                  Attendance Details
                </Typography>
                <Typography variant="caption" sx={{ color: T.textSecondary, fontSize: "0.8rem", mt: 0.2, display: "block" }}>
                  {fmtDateFull(a.date || a.createdAt)}
                </Typography>
              </Box>
            </Stack>

            {/* Right: Status badge + Close Button */}
            <Stack direction="row" spacing={1.2} alignItems="center">
              <StatusChip status={a.status} />
              <IconButton
                onClick={handleClose}
                size="small"
                sx={{
                  color: T.textSecondary,
                  bgcolor: T.closeBtnBg,
                  border: `1px solid ${T.cardBorder}`,
                  width: 32,
                  height: 32,
                  "&:hover": { bgcolor: isDark ? "rgba(255,255,255,0.12)" : "#e2e8f0", color: T.textPrimary },
                }}
              >
                <Close sx={{ fontSize: 18 }} />
              </IconButton>
            </Stack>
          </Stack>
        </DialogTitle>

        {/* Content */}
        <DialogContent sx={{ px: { xs: 2, sm: 3 }, py: 2.5 }}>
          <Stack spacing={2.2}>
            {/* ── Row 1: Summary Cards (Work Hours, Phone, Email) ── */}
            <Grid container spacing={1.5}>
              {/* Work Hours */}
              <Grid item xs={12} sm={4}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: "14px",
                    bgcolor: T.cardBg,
                    border: `1px solid ${T.cardBorder}`,
                    height: "100%",
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <AccessTime sx={{ fontSize: 16, color: T.sky }} />
                    <Typography variant="caption" fontWeight={700} sx={{ color: T.textSecondary, letterSpacing: "0.05em" }}>
                      WORK HOURS
                    </Typography>
                  </Stack>
                  <Typography variant="h5" fontWeight={800} sx={{ color: T.sky, letterSpacing: "-0.02em" }}>
                    {workHoursDisplay}
                  </Typography>
                </Paper>
              </Grid>

              {/* Phone */}
              <Grid item xs={12} sm={4}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: "14px",
                    bgcolor: T.cardBg,
                    border: `1px solid ${T.cardBorder}`,
                    height: "100%",
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <Phone sx={{ fontSize: 16, color: T.textSecondary }} />
                    <Typography variant="caption" fontWeight={700} sx={{ color: T.textSecondary, letterSpacing: "0.05em" }}>
                      PHONE
                    </Typography>
                  </Stack>
                  <Typography variant="body1" fontWeight={700} sx={{ color: T.textPrimary }}>
                    {userPhone}
                  </Typography>
                </Paper>
              </Grid>

              {/* Email */}
              <Grid item xs={12} sm={4}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: "14px",
                    bgcolor: T.cardBg,
                    border: `1px solid ${T.cardBorder}`,
                    height: "100%",
                    overflow: "hidden",
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <Email sx={{ fontSize: 16, color: T.textSecondary }} />
                    <Typography variant="caption" fontWeight={700} sx={{ color: T.textSecondary, letterSpacing: "0.05em" }}>
                      EMAIL
                    </Typography>
                  </Stack>
                  <Typography variant="body1" fontWeight={700} sx={{ color: T.textPrimary }} noWrap title={userEmail}>
                    {userEmail}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            {/* ── Row 2: Punch In & Punch Out Cards ── */}
            <Grid container spacing={1.8}>
              {/* Punch In Card (Green) */}
              <Grid item xs={12} sm={6}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.2,
                    borderRadius: "16px",
                    bgcolor: T.greenCardBg,
                    border: `1px solid ${T.greenCardBorder}`,
                    height: "100%",
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: "10px",
                        bgcolor: isDark ? "rgba(16, 185, 129, 0.15)" : "rgba(16, 185, 129, 0.12)",
                        color: T.greenLight,
                        display: "grid",
                        placeItems: "center",
                      }}
                    >
                      <Login sx={{ fontSize: 18 }} />
                    </Box>
                    <Box>
                      <Typography variant="caption" fontWeight={800} sx={{ color: T.green, letterSpacing: "0.05em" }}>
                        PUNCH IN
                      </Typography>
                      <Typography variant="h6" fontWeight={800} sx={{ color: T.greenLight, lineHeight: 1.1 }}>
                        {punchInTimeDisplay}
                      </Typography>
                    </Box>
                  </Stack>

                  {/* Location Address */}
                  <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ mt: 1.5 }}>
                    <LocationOn sx={{ fontSize: 15, color: T.textMuted, mt: 0.2, flexShrink: 0 }} />
                    <Box>
                      <Typography variant="caption" sx={{ color: T.textSecondary, lineHeight: 1.4, display: "block" }}>
                        {resolveAddress(a.punchIn?.address)}
                      </Typography>
                      {a.punchIn?.location && (
                        <Typography variant="caption" sx={{ color: T.textMuted, fontSize: "0.72rem", display: "block", mt: 0.3 }}>
                          {a.punchIn.location.lat?.toFixed(5)}, {a.punchIn.location.lng?.toFixed(5)}
                        </Typography>
                      )}
                    </Box>
                  </Stack>
                </Paper>
              </Grid>

              {/* Punch Out Card (Orange) */}
              <Grid item xs={12} sm={6}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.2,
                    borderRadius: "16px",
                    bgcolor: T.orangeCardBg,
                    border: `1px solid ${T.orangeCardBorder}`,
                    height: "100%",
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: "10px",
                        bgcolor: isDark ? "rgba(245, 158, 11, 0.15)" : "rgba(245, 158, 11, 0.12)",
                        color: T.orangeLight,
                        display: "grid",
                        placeItems: "center",
                      }}
                    >
                      <Logout sx={{ fontSize: 18 }} />
                    </Box>
                    <Box>
                      <Typography variant="caption" fontWeight={800} sx={{ color: T.orange, letterSpacing: "0.05em" }}>
                        PUNCH OUT
                      </Typography>
                      <Typography variant="h6" fontWeight={800} sx={{ color: T.orangeLight, lineHeight: 1.1 }}>
                        {punchOutTimeDisplay}
                      </Typography>
                    </Box>
                  </Stack>

                  {/* Location Address */}
                  <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ mt: 1.5 }}>
                    <LocationOn sx={{ fontSize: 15, color: T.textMuted, mt: 0.2, flexShrink: 0 }} />
                    <Box>
                      <Typography variant="caption" sx={{ color: T.textSecondary, lineHeight: 1.4, display: "block" }}>
                        {a.punchOut?.address ? resolveAddress(a.punchOut.address) : (punchOutTimeDisplay === "Ongoing" ? "No punch out location recorded" : "No punch out location recorded")}
                      </Typography>
                      {a.punchOut?.location && (
                        <Typography variant="caption" sx={{ color: T.textMuted, fontSize: "0.72rem", display: "block", mt: 0.3 }}>
                          {a.punchOut.location.lat?.toFixed(5)}, {a.punchOut.location.lng?.toFixed(5)}
                        </Typography>
                      )}
                    </Box>
                  </Stack>
                </Paper>
              </Grid>
            </Grid>

            {/* ── Row 3: Record Metadata (RECORD ID, CREATED, LAST UPDATED) ── */}
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: "14px",
                bgcolor: T.cardBg,
                border: `1px solid ${T.cardBorder}`,
              }}
            >
              <Stack spacing={1.2}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="caption" fontWeight={700} sx={{ color: T.textMuted, letterSpacing: "0.06em" }}>
                    RECORD ID
                  </Typography>
                  <Typography variant="body2" fontWeight={800} sx={{ color: T.textPrimary, fontFamily: "monospace" }}>
                    {(a._id || a.id || "—").slice(-10)}
                  </Typography>
                </Stack>
                <Divider sx={{ borderColor: T.divider }} />
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="caption" fontWeight={700} sx={{ color: T.textMuted, letterSpacing: "0.06em" }}>
                    CREATED
                  </Typography>
                  <Typography variant="body2" fontWeight={700} sx={{ color: T.textPrimary }}>
                    {fmtDateTime(a.createdAt || a.date)}
                  </Typography>
                </Stack>
                <Divider sx={{ borderColor: T.divider }} />
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="caption" fontWeight={700} sx={{ color: T.textMuted, letterSpacing: "0.06em" }}>
                    LAST UPDATED
                  </Typography>
                  <Typography variant="body2" fontWeight={700} sx={{ color: T.textPrimary }}>
                    {fmtDateTime(a.updatedAt || a.createdAt || a.date)}
                  </Typography>
                </Stack>
              </Stack>
            </Paper>

            {/* ── Row 4: Edit Attendance Record Box ── */}
            {editMode && (
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: "16px",
                  bgcolor: isDark ? "rgba(16, 185, 129, 0.03)" : "rgba(16, 185, 129, 0.04)",
                  border: `1px solid ${isDark ? "rgba(16, 185, 129, 0.35)" : "rgba(16, 185, 129, 0.25)"}`,
                  boxShadow: isDark ? "0 8px 24px rgba(16, 185, 129, 0.08)" : "0 4px 12px rgba(16, 185, 129, 0.05)",
                }}
              >
                {/* Header with green dot */}
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                  <FiberManualRecord sx={{ fontSize: 10, color: T.green }} />
                  <Typography variant="subtitle1" fontWeight={800} sx={{ color: T.green, fontSize: "0.95rem" }}>
                    Edit Attendance Record
                  </Typography>
                </Stack>

                <Stack spacing={2.2}>
                  {/* Status Dropdown */}
                  <FormControl fullWidth size="small">
                    <InputLabel sx={{ color: T.green, "&.Mui-focused": { color: T.greenLight } }}>
                      Status
                    </InputLabel>
                    <Select
                      value={formData.status}
                      onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value }))}
                      label="Status"
                      sx={{
                        borderRadius: "10px",
                        bgcolor: T.inputBg,
                        color: T.textPrimary,
                        fontSize: "0.88rem",
                        fontWeight: 700,
                        "& .MuiOutlinedInput-notchedOutline": { borderColor: isDark ? "rgba(16, 185, 129, 0.4)" : "#86efac" },
                        "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: T.greenLight },
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: T.green },
                        "& .MuiSvgIcon-root": { color: T.textPrimary },
                      }}
                      MenuProps={{
                        PaperProps: {
                          sx: {
                            bgcolor: isDark ? "#0d1629" : "#ffffff",
                            border: `1px solid ${T.cardBorder}`,
                            color: T.textPrimary,
                            borderRadius: "12px",
                            boxShadow: isDark ? "0 12px 36px rgba(0,0,0,0.6)" : "0 10px 25px rgba(15,23,42,0.12)",
                          },
                        },
                      }}
                    >
                      {Object.entries(statusConfigs).map(([key, item]) => (
                        <MenuItem
                          key={key}
                          value={key}
                          sx={{
                            py: 1.2,
                            px: 2,
                            "&:hover": { bgcolor: isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9" },
                            "&.Mui-selected": { bgcolor: isDark ? "rgba(16, 185, 129, 0.15)" : "rgba(16, 185, 129, 0.1)" },
                          }}
                        >
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            {item.icon}
                            <Typography variant="body2" fontWeight={700} sx={{ color: item.color }}>
                              {item.label}
                            </Typography>
                          </Stack>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* 3 Inputs Grid: Punch In, Punch Out, Work Hours */}
                  <Grid container spacing={1.5}>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        label="Punch In Time"
                        type="time"
                        size="small"
                        fullWidth
                        value={formData.punchInTime}
                        onChange={handlePunchInTimeChange}
                        InputLabelProps={{ shrink: true, sx: { color: T.textSecondary } }}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            bgcolor: T.inputBg,
                            borderRadius: "10px",
                            color: T.textPrimary,
                            "& fieldset": { borderColor: T.cardBorder },
                            "&:hover fieldset": { borderColor: isDark ? "rgba(255,255,255,0.2)" : "#94a3b8" },
                          },
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <TextField
                        label="Punch Out Time"
                        type="time"
                        size="small"
                        fullWidth
                        value={formData.punchOutTime}
                        onChange={handlePunchOutTimeChange}
                        InputLabelProps={{ shrink: true, sx: { color: T.textSecondary } }}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            bgcolor: T.inputBg,
                            borderRadius: "10px",
                            color: T.textPrimary,
                            "& fieldset": { borderColor: T.cardBorder },
                            "&:hover fieldset": { borderColor: isDark ? "rgba(255,255,255,0.2)" : "#94a3b8" },
                          },
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <TextField
                        label="Work Hours"
                        type="number"
                        size="small"
                        fullWidth
                        value={formData.workHours}
                        onChange={(e) => setFormData((p) => ({ ...p, workHours: e.target.value }))}
                        InputLabelProps={{ shrink: true, sx: { color: T.textSecondary } }}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            bgcolor: T.inputBg,
                            borderRadius: "10px",
                            color: T.textPrimary,
                            "& fieldset": { borderColor: T.cardBorder },
                            "&:hover fieldset": { borderColor: isDark ? "rgba(255,255,255,0.2)" : "#94a3b8" },
                          },
                        }}
                      />
                    </Grid>
                  </Grid>

                  {/* Remarks Textarea */}
                  <Box>
                    <TextField
                      placeholder="Remarks"
                      label="Remarks"
                      multiline
                      rows={3}
                      fullWidth
                      value={formData.remarks}
                      onChange={(e) => setFormData((p) => ({ ...p, remarks: e.target.value }))}
                      inputProps={{ maxLength: 250 }}
                      InputLabelProps={{ shrink: true, sx: { color: T.textSecondary } }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          bgcolor: T.inputBg,
                          borderRadius: "10px",
                          color: T.textPrimary,
                          "& fieldset": { borderColor: T.cardBorder },
                          "&:hover fieldset": { borderColor: isDark ? "rgba(255,255,255,0.2)" : "#94a3b8" },
                        },
                      }}
                    />
                    <Typography variant="caption" sx={{ color: T.textMuted, display: "block", textAlign: "right", mt: 0.5 }}>
                      {formData.remarks.length}/250
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            )}
          </Stack>
        </DialogContent>

        {/* Footer Actions */}
        <DialogActions
          sx={{
            px: { xs: 2, sm: 3 },
            py: 2,
            borderTop: `1px solid ${T.cardBorder}`,
            bgcolor: T.headerBg,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 1.5,
          }}
        >
          {/* Left: Export & Close */}
          <Stack direction="row" spacing={1.2}>
            <ActionExportMenu attendance={a} onSnack={showSnack} />
            <Button
              variant="outlined"
              onClick={handleClose}
              sx={{
                borderRadius: "10px",
                borderColor: T.btnBorder,
                bgcolor: T.btnBg,
                color: T.textPrimary,
                fontWeight: 700,
                fontSize: "0.82rem",
                textTransform: "none",
                px: 2,
                "&:hover": { bgcolor: T.btnHoverBg },
              }}
            >
              Close
            </Button>
          </Stack>

          {/* Right: Actions based on editMode */}
          {editMode ? (
            <Stack direction="row" spacing={1.2}>
              {/* Cancel Button */}
              <Button
                variant="outlined"
                startIcon={<Close sx={{ fontSize: 16 }} />}
                onClick={() => setEditMode(false)}
                disabled={editLoad}
                sx={{
                  borderRadius: "10px",
                  borderColor: T.btnBorder,
                  bgcolor: T.btnBg,
                  color: T.textPrimary,
                  fontWeight: 700,
                  fontSize: "0.82rem",
                  textTransform: "none",
                  px: 2,
                  "&:hover": { bgcolor: T.btnHoverBg },
                }}
              >
                Cancel
              </Button>

              {/* Save Changes Button */}
              <Button
                variant="contained"
                startIcon={editLoad ? <CircularProgress size={16} color="inherit" /> : <Save sx={{ fontSize: 16 }} />}
                onClick={handleEditSave}
                disabled={editLoad}
                sx={{
                  borderRadius: "10px",
                  bgcolor: T.blue,
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: "0.82rem",
                  textTransform: "none",
                  px: 2.5,
                  boxShadow: "0 4px 14px rgba(37, 99, 235, 0.4)",
                  "&:hover": { bgcolor: "#1d4ed8" },
                }}
              >
                {editLoad ? "Saving..." : "Save Changes"}
              </Button>
            </Stack>
          ) : (
            <Stack direction="row" spacing={1.2}>
              {/* Edit Button */}
              {canEdit && (
                <Button
                  variant="outlined"
                  startIcon={<Edit sx={{ fontSize: 16, color: isDark ? "#fbbf24" : "#d97706" }} />}
                  onClick={() => setEditMode(true)}
                  sx={{
                    borderRadius: "10px",
                    borderColor: isDark ? "rgba(245, 158, 11, 0.5)" : "#f59e0b",
                    bgcolor: isDark ? "rgba(245, 158, 11, 0.08)" : "#fffbeb",
                    color: isDark ? "#fbbf24" : "#b45309",
                    fontWeight: 800,
                    fontSize: "0.82rem",
                    textTransform: "none",
                    px: 2.2,
                    boxShadow: isDark ? "0 2px 8px rgba(245, 158, 11, 0.15)" : "none",
                    "&:hover": {
                      bgcolor: isDark ? "rgba(245, 158, 11, 0.18)" : "#fef3c7",
                      borderColor: isDark ? "#fbbf24" : "#d97706",
                    },
                  }}
                >
                  Edit
                </Button>
              )}

              {/* Delete Button */}
              {canDelete && (
                <Button
                  variant="contained"
                  startIcon={<Delete sx={{ fontSize: 16 }} />}
                  onClick={handleDelete}
                  sx={{
                    borderRadius: "10px",
                    bgcolor: T.red,
                    color: "#fff",
                    fontWeight: 800,
                    fontSize: "0.82rem",
                    textTransform: "none",
                    px: 2,
                    boxShadow: "0 4px 14px rgba(239, 68, 68, 0.25)",
                    "&:hover": { bgcolor: "#dc2626" },
                  }}
                >
                  Delete
                </Button>
              )}
            </Stack>
          )}
        </DialogActions>
      </Dialog>

      {/* Snackbar alerts */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3500}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          sx={{ borderRadius: "10px", fontWeight: 700 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
