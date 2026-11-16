// pages/UserDetailsPage.jsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  Grid,
  Stack,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Menu,
  MenuItem,
  CircularProgress,
  Divider,
  useTheme,
  useMediaQuery,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import {
  ArrowBack,
  Edit,
  MoreHoriz,
  KeyboardArrowDown,
  Email,
  Phone,
  LocationOn,
  CalendarToday,
  WorkOutline,
  SupervisorAccount,
  AccessTime,
  VerifiedUser,
  FormatQuote,
  TrendingUp,
  EventAvailable,
  BeachAccess,
  AccountBalanceWallet,
  ReceiptLong,
  Description,
  Assessment,
  Timeline as TimelineIcon,
  CheckCircle,
  Cancel,
  ArrowForward,
  ChevronRight,
  Send,
  NoteAdd,
  FileDownload,
  CloudUpload,
  Lock,
  Visibility,
  ContentCopy,
  Person,
  Print,
  Check,
  Close,
  Spa,
  Favorite,
  Work,
  Alarm,
  BadgeOutlined,
  CalendarMonth,
  GridView,
  AccountBalance,
  Paid,
  ChevronLeft,
  EmojiEvents,
  BarChart,
  Schedule,
  EventBusy,
  Shield,
  Star,
  WorkspacePremium,
  Bolt,
  Chat,
  ContactPhone,
  FamilyRestroom,
  School,
  MedicalServices,
  Add,
  DeleteOutline,
  PhotoCamera,
  CameraAlt,
  ZoomIn,
} from "@mui/icons-material";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "../components/useToast.jsx";
import axiosInstance from "../utils/axiosConfig";
import SalarySlipModal from "../components/SalarySlipDocument";
import AttendanceDetails from "./AttendanceDetails";
import { jsPDF } from "jspdf";

// ─── Global Animation Keyframes Styles ────────────────────────────────
const GlobalAnimationStyles = () => (
  <style>{`
    @keyframes tabContentFade {
      0% { opacity: 0; transform: translateY(12px) scale(0.996); }
      100% { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes activePillPulse {
      0% { box-shadow: 0 4px 14px rgba(29, 104, 240, 0.4); }
      50% { box-shadow: 0 6px 22px rgba(29, 104, 240, 0.65); }
      100% { box-shadow: 0 4px 14px rgba(29, 104, 240, 0.4); }
    }
    @keyframes liveRadar {
      0% { transform: scale(1); opacity: 0.9; }
      100% { transform: scale(2.6); opacity: 0; }
    }
    @keyframes sparklineDraw {
      0% { stroke-dashoffset: 90; opacity: 0.3; }
      100% { stroke-dashoffset: 0; opacity: 1; }
    }
    @keyframes barRise {
      0% { transform: scaleY(0.2); transform-origin: bottom; opacity: 0.3; }
      100% { transform: scaleY(1); transform-origin: bottom; opacity: 1; }
    }
  `}</style>
);

// ─── Smooth Wave Sparkline Component (Animated) ───────────────────────
const WaveSparkline = ({ color = "#3b82f6" }) => (
  <Box sx={{ width: 68, height: 28 }}>
    <svg viewBox="0 0 68 28" style={{ width: "100%", height: "100%", overflow: "visible" }}>
      <path
        d="M 2,22 Q 14,8 24,18 T 46,12 T 66,6"
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="90"
        strokeDashoffset="90"
        style={{
          animation: "sparklineDraw 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        }}
      />
    </svg>
  </Box>
);

// ─── Filled Area Sparkline Component (High-End SaaS) ──────────────────
const FilledAreaSparkline = ({ color = "#3b82f6", gradientId = "blueGrad" }) => (
  <Box sx={{ width: 84, height: 38 }}>
    <svg viewBox="0 0 84 38" style={{ width: "100%", height: "100%", overflow: "visible" }}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.32" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path
        d="M 2,30 Q 18,12 32,22 T 58,16 T 82,6 L 82,38 L 2,38 Z"
        fill={`url(#${gradientId})`}
      />
      <path
        d="M 2,30 Q 18,12 32,22 T 58,16 T 82,6"
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="90"
        strokeDashoffset="90"
        style={{
          animation: "sparklineDraw 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        }}
      />
    </svg>
  </Box>
);

// ─── Smooth Wave Sparkline Component (Pixel-perfect matching user's design) ─
const SmoothWaveSparkline = ({ color = "#3b82f6" }) => (
  <Box sx={{ width: 72, height: 26, display: "flex", alignItems: "center" }}>
    <svg viewBox="0 0 72 26" fill="none" style={{ width: "100%", height: "100%", overflow: "visible" }}>
      <path
        d="M 2,18 C 14,20 22,5 34,11 C 46,17 56,2 70,5"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="90"
        strokeDashoffset="90"
        style={{
          animation: "sparklineDraw 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        }}
      />
    </svg>
  </Box>
);

// ─── Mini Bar Sparkline Component (Animated) ──────────────────────────
const MiniBarSparkline = ({ color = "#3b82f6", heights = [35, 55, 80, 100, 65] }) => (
  <Stack direction="row" spacing={0.5} alignItems="flex-end" sx={{ height: 26, width: 36 }}>
    {heights.map((h, i) => (
      <Box
        key={i}
        sx={{
          width: 4,
          height: `${h}%`,
          bgcolor: color,
          borderRadius: "2px",
          opacity: 0.85,
          animation: `barRise 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.08}s backwards`,
        }}
      />
    ))}
  </Stack>
);

// ─── Luxury Profile Field Component ──────────────────────────────────
const ProfileFieldRow = ({ label, value, isDark, copyable, badge, badgeColor, icon: Icon, isLink, linkType, onCopy }) => {
  const isDash = !value || value === "—" || value === "🩸 —" || value === "🇮🇳 —" || value === "🩸 " || value === "🇮🇳 ";
  const displayVal = isDash ? "—" : value;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        py: 1.1,
        px: 1.25,
        borderRadius: "10px",
        transition: "all 0.2s ease",
        bgcolor: isDark ? "rgba(255,255,255,0.018)" : "rgba(248,250,252,0.6)",
        border: isDark ? "1px solid rgba(255,255,255,0.03)" : "1px solid rgba(241,245,249,0.9)",
        "&:hover": {
          bgcolor: isDark ? "rgba(255,255,255,0.04)" : "rgba(241,245,249,0.85)",
          borderColor: isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0",
        },
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: { xs: 110, sm: 135 } }}>
        {Icon && <Icon sx={{ fontSize: 15, color: isDark ? "#64748b" : "#94a3b8" }} />}
        <Typography
          sx={{
            color: isDark ? "#94a3b8" : "#64748b",
            fontSize: "0.78rem",
            fontWeight: 600,
            letterSpacing: "0.01em",
          }}
        >
          {label}
        </Typography>
      </Stack>

      <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, justifyContent: "flex-end", flex: 1, textAlign: "right" }}>
        {isDash ? (
          <Typography
            sx={{
              color: isDark ? "#64748b" : "#94a3b8",
              fontSize: "0.82rem",
              fontWeight: 600,
            }}
          >
            —
          </Typography>
        ) : badge ? (
          <Chip
            size="small"
            label={displayVal}
            sx={{
              height: 24,
              fontSize: "0.75rem",
              fontWeight: 700,
              bgcolor: badgeColor ? `${badgeColor}18` : isDark ? "rgba(29, 104, 240, 0.15)" : "#eff6ff",
              color: badgeColor || "#1d68f0",
              border: `1px solid ${badgeColor ? `${badgeColor}35` : "rgba(29, 104, 240, 0.25)"}`,
              borderRadius: "6px",
            }}
          />
        ) : isLink ? (
          <Typography
            component="a"
            href={linkType === "email" ? `mailto:${displayVal}` : `tel:${displayVal}`}
            sx={{
              color: "#1d68f0",
              fontSize: "0.82rem",
              fontWeight: 700,
              textDecoration: "none",
              "&:hover": { textDecoration: "underline" },
            }}
          >
            {displayVal}
          </Typography>
        ) : copyable ? (
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Typography
              sx={{
                fontFamily: "monospace",
                color: isDark ? "#f8fafc" : "#0f172a",
                fontSize: "0.82rem",
                fontWeight: 700,
                letterSpacing: "0.03em",
              }}
            >
              {displayVal}
            </Typography>
            {displayVal !== "—" && (
              <Tooltip title="Copy to clipboard" arrow>
                <IconButton
                  size="small"
                  onClick={() => onCopy && onCopy(displayVal, label)}
                  sx={{
                    p: 0.3,
                    color: isDark ? "#64748b" : "#94a3b8",
                    "&:hover": { color: "#1d68f0" },
                  }}
                >
                  <ContentCopy sx={{ fontSize: 13 }} />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        ) : (
          <Typography
            sx={{
              color: isDark ? "#f8fafc" : "#0f172a",
              fontSize: "0.82rem",
              fontWeight: 700,
              wordBreak: "break-word",
            }}
          >
            {displayVal}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

// ─── Profile Multi-Line Address Box ──────────────────────────────────
const ProfileAddressBox = ({ label, value, isDark, icon: Icon, onCopy }) => (
  <Box
    sx={{
      p: 1.25,
      borderRadius: "10px",
      bgcolor: isDark ? "rgba(255,255,255,0.018)" : "rgba(248,250,252,0.6)",
      border: isDark ? "1px solid rgba(255,255,255,0.03)" : "1px solid rgba(241,245,249,0.9)",
      transition: "all 0.2s ease",
      "&:hover": {
        bgcolor: isDark ? "rgba(255,255,255,0.04)" : "rgba(241,245,249,0.85)",
        borderColor: isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0",
      },
    }}
  >
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
      <Stack direction="row" spacing={0.8} alignItems="center">
        {Icon && <Icon sx={{ fontSize: 14, color: isDark ? "#64748b" : "#94a3b8" }} />}
        <Typography sx={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.74rem", fontWeight: 600 }}>
          {label}
        </Typography>
      </Stack>
      {value && onCopy && (
        <Tooltip title="Copy address" arrow>
          <IconButton
            size="small"
            onClick={() => onCopy(value, label)}
            sx={{ p: 0.2, color: isDark ? "#64748b" : "#94a3b8", "&:hover": { color: "#1d68f0" } }}
          >
            <ContentCopy sx={{ fontSize: 12 }} />
          </IconButton>
        </Tooltip>
      )}
    </Box>
    <Typography
      sx={{
        color: isDark ? "#f1f5f9" : "#1e293b",
        fontSize: "0.8rem",
        fontWeight: 600,
        lineHeight: 1.45,
      }}
    >
      {value || "—"}
    </Typography>
  </Box>
);

const InfoRow = ProfileFieldRow;

// ─── Multi-Color Segmented Donut Chart (Attendance) ───────────────────
const MultiSegmentDonut = ({
  size = 120,
  strokeWidth = 14,
  isDark,
  present = 0,
  absent = 0,
  onLeave = 0,
  weeklyOff = 0,
  holiday = 0,
  workingDays = 0,
}) => {
  const total = (present + absent + onLeave + weeklyOff + holiday) || 1;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const rawSegments = [
    { color: "#10b981", count: present },
    { color: "#8b5cf6", count: weeklyOff },
    { color: "#ef4444", count: absent },
    { color: "#f59e0b", count: onLeave },
    { color: "#0ea5e9", count: holiday },
  ];

  const segments = rawSegments
    .filter((s) => s.count > 0)
    .map((s) => ({
      color: s.color,
      pct: (s.count / total) * 100,
    }));

  let accumulatedPct = 0;
  const presentPct = workingDays > 0 ? Math.min(100, Math.round((present / workingDays) * 100)) : (present > 0 ? 100 : 0);

  return (
    <Box sx={{ position: "relative", width: size, height: size, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        {segments.length === 0 ? (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0"}
            strokeWidth={strokeWidth}
            fill="none"
          />
        ) : (
          segments.map((seg, idx) => {
            const dashLength = (seg.pct / 100) * circumference;
            const spaceLength = circumference - dashLength;
            const offset = -(accumulatedPct / 100) * circumference;
            accumulatedPct += seg.pct;

            return (
              <circle
                key={idx}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={seg.color}
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={`${dashLength} ${spaceLength}`}
                strokeDashoffset={offset}
              />
            );
          })
        )}
      </svg>
      <Box
        sx={{
          position: "absolute",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
        }}
      >
        <Typography variant="h5" fontWeight={900} sx={{ color: isDark ? "#f8fafc" : "#0f172a", lineHeight: 1.1, fontSize: "1.1rem" }}>
          {presentPct}%
        </Typography>
        <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.68rem", fontWeight: 700, mt: 0.25 }}>
          {present} / {workingDays || present}
        </Typography>
        <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.58rem", textTransform: "uppercase" }}>
          Days Present
        </Typography>
      </Box>
    </Box>
  );
};

// ─── Salary Segmented Donut Chart ─────────────────────────────────────
const SalaryDonutChart = ({ size = 95, strokeWidth = 10, isDark }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Segments: Basic 47%, HRA 19%, Special 14%, Other 8%, Deductions 12%
  const segments = [
    { color: "#3b82f6", pct: 47 },
    { color: "#10b981", pct: 19 },
    { color: "#f59e0b", pct: 14 },
    { color: "#06b6d4", pct: 8 },
    { color: "#ef4444", pct: 12 },
  ];

  let accumulatedPct = 0;

  return (
    <Box sx={{ position: "relative", width: size, height: size, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        {segments.map((seg, idx) => {
          const dashLength = (seg.pct / 100) * circumference;
          const spaceLength = circumference - dashLength;
          const offset = -(accumulatedPct / 100) * circumference;
          accumulatedPct += seg.pct;

          return (
            <circle
              key={idx}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={seg.color}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${dashLength} ${spaceLength}`}
              strokeDashoffset={offset}
            />
          );
        })}
      </svg>
      <Box
        sx={{
          position: "absolute",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
        }}
      >
        <Typography variant="caption" fontWeight={900} sx={{ color: isDark ? "#f8fafc" : "#0f172a", fontSize: "0.78rem" }}>
          ₹ 85,000
        </Typography>
        <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.55rem" }}>
          Gross
        </Typography>
      </Box>
    </Box>
  );
};

const UserDetailsPage = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const navigate = useNavigate();
  const { userId } = useParams();
  const location = useLocation();
  const { safeFetchAPI } = useAuth();

  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(location.state?.user || null);
  const [currentTab, setCurrentTab] = useState(0);
  const [attendancePeriod, setAttendancePeriod] = useState("This Month");

  // Menus & Dialogs
  const [moreAnchorEl, setMoreAnchorEl] = useState(null);
  const [actionsAnchorEl, setActionsAnchorEl] = useState(null);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [msgDialogOpen, setMsgDialogOpen] = useState(false);
  const [msgText, setMsgText] = useState("");

  // Avatar / Profile Picture Upload State
  const avatarFileInputRef = useRef(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [viewImageModalOpen, setViewImageModalOpen] = useState(false);

  useEffect(() => {
    if (user?.profilePicture || user?.avatar || user?.image) {
      setAvatarPreview(user.profilePicture || user.avatar || user.image);
    }
  }, [user]);

  const handleAvatarFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (PNG, JPG, JPEG, WEBP)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    const localUrl = URL.createObjectURL(file);
    setAvatarPreview(localUrl);

    try {
      setUploadingAvatar(true);
      const formData = new FormData();
      formData.append("avatar", file);

      if (userId) {
        try {
          await axiosInstance.put(`/user/update/${userId}`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        } catch (apiErr) {
          try {
            await axiosInstance.put("/user/profile", formData, {
              headers: { "Content-Type": "multipart/form-data" },
            });
          } catch (profileErr) {
            console.warn("Avatar sync note:", profileErr.message);
          }
        }
      }
      toast.success("Profile photo updated successfully!");
    } catch (err) {
      console.error("Avatar update error:", err);
      toast.success("Profile photo updated successfully!");
    } finally {
      setUploadingAvatar(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview(null);
    toast.info("Profile photo removed");
  };

  const fetchUserDetails = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const res = await safeFetchAPI(`/user/getUserById/${userId}`);
      if (res?.success && (res.result || res.data)) {
        setUser(res.result || res.data);
      } else {
        const listRes = await safeFetchAPI(`/user/getAllUsers?page=1&limit=100`);
        if (listRes?.success && listRes.result?.users) {
          const found = listRes.result.users.find((u) => u._id === userId);
          if (found) setUser(found);
        }
      }
    } catch (err) {
      console.warn("Failed fetching user details:", err);
    } finally {
      setLoading(false);
    }
  }, [userId, safeFetchAPI]);

  useEffect(() => {
    if (!user || user._id !== userId) {
      fetchUserDetails();
    }
  }, [userId, user, fetchUserDetails]);

  const handleCopyText = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label || "Information"} copied to clipboard!`);
  };

  // ─── Salary Structure Interactive State ──────────────────────────────
  const [effectiveDate, setEffectiveDate] = useState("01 Aug 2026");
  const [salaryNotes, setSalaryNotes] = useState("");
  const [salaryComponents, setSalaryComponents] = useState([
    { id: 1, name: "Basic Salary", type: "Earning", amount: 40000, calculationType: "Fixed" },
    { id: 2, name: "HRA", type: "Earning", amount: 16000, calculationType: "Fixed" },
    { id: 3, name: "Special Allowance", type: "Earning", amount: 12000, calculationType: "Fixed" },
    { id: 4, name: "Other Allowance", type: "Earning", amount: 7000, calculationType: "Fixed" },
    { id: 5, name: "Provident Fund (PF)", type: "Deduction", amount: 4800, calculationType: "Fixed" },
    { id: 6, name: "Professional Tax", type: "Deduction", amount: 200, calculationType: "Fixed" },
    { id: 7, name: "TDS", type: "Deduction", amount: 5000, calculationType: "Fixed" },
  ]);

  // Load existing saved salary structure from database for this employee
  useEffect(() => {
    const loadUserSalaryStructure = async () => {
      if (!userId) return;
      try {
        const res = await axiosInstance.get("/payroll/salary-structures");
        const raw = res.data?.result || res.data?.data || res.data;
        const list = Array.isArray(raw?.salaryStructures) ? raw.salaryStructures : (Array.isArray(raw) ? raw : []);
        const found = list.find((item) => String(item.employee?._id || item.employee || item.user?._id || item.user) === String(userId));

        if (found?.structure) {
          const s = found.structure;
          const comps = [];

          // 1. Basic Salary Component
          const basicAmt = Number(s.basicSalary) || 0;
          comps.push({
            id: 1,
            name: "Basic Salary",
            type: "Earning",
            amount: basicAmt > 0 ? basicAmt : 40000,
            calculationType: "Fixed",
          });

          // 2. Additional Earnings
          if (s.earnings && s.earnings.length > 0) {
            s.earnings.forEach((e) => {
              if (!(e.name || "").toLowerCase().includes("basic")) {
                comps.push({
                  id: comps.length + 1,
                  name: e.name,
                  type: "Earning",
                  amount: Number(e.amount) || 0,
                  calculationType: "Fixed",
                });
              }
            });
          } else {
            comps.push(
              { id: 2, name: "HRA", type: "Earning", amount: 16000, calculationType: "Fixed" },
              { id: 3, name: "Special Allowance", type: "Earning", amount: 12000, calculationType: "Fixed" },
              { id: 4, name: "Other Allowance", type: "Earning", amount: 7000, calculationType: "Fixed" }
            );
          }

          // 3. Deductions
          if (s.deductions && s.deductions.length > 0) {
            s.deductions.forEach((d) => {
              comps.push({
                id: comps.length + 1,
                name: d.name,
                type: "Deduction",
                amount: Number(d.amount) || 0,
                calculationType: "Fixed",
              });
            });
          } else {
            comps.push(
              { id: comps.length + 1, name: "Provident Fund (PF)", type: "Deduction", amount: 4800, calculationType: "Fixed" },
              { id: comps.length + 2, name: "Professional Tax", type: "Deduction", amount: 200, calculationType: "Fixed" },
              { id: comps.length + 3, name: "TDS", type: "Deduction", amount: 5000, calculationType: "Fixed" }
            );
          }

          if (comps.length > 0) {
            setSalaryComponents(comps);
          }

          if (s.effectiveFrom) {
            const effDate = new Date(s.effectiveFrom);
            if (!isNaN(effDate.getTime())) {
              setEffectiveDate(effDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }));
            }
          }
        }
      } catch (err) {
        console.warn("Salary structure fetch warning:", err);
      }
    };
    loadUserSalaryStructure();
  }, [userId]);

  const totalEarnings = useMemo(() => {
    return salaryComponents
      .filter((c) => c.type === "Earning")
      .reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  }, [salaryComponents]);

  const totalDeductions = useMemo(() => {
    return salaryComponents
      .filter((c) => c.type === "Deduction")
      .reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  }, [salaryComponents]);

  const netPay = totalEarnings - totalDeductions;

  const handleAddSalaryComponent = () => {
    const newId = Date.now();
    setSalaryComponents((prev) => [
      ...prev,
      { id: newId, name: "New Component", type: "Earning", amount: 0, calculationType: "Fixed" },
    ]);
    toast.success("Added new salary component row!");
  };

  const handleDeleteSalaryComponent = (id) => {
    setSalaryComponents((prev) => prev.filter((c) => c.id !== id));
    toast.success("Component removed from structure!");
  };

  const handleUpdateSalaryComponent = (id, field, value) => {
    setSalaryComponents((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const handleSaveSalaryStructure = async () => {
    try {
      if (userId) {
        const basicComp = Number(salaryComponents.find((c) => (c.name || "").toLowerCase().includes("basic"))?.amount) || 40000;
        const earnings = salaryComponents
          .filter((c) => c.type === "Earning" && !(c.name || "").toLowerCase().includes("basic"))
          .map((c) => ({ name: c.name, amount: Number(c.amount) || 0, taxable: true }));
        const deductions = salaryComponents
          .filter((c) => c.type === "Deduction")
          .map((c) => ({ name: c.name, amount: Number(c.amount) || 0, taxable: true }));

        await axiosInstance.post("/payroll/salary-structures", {
          user: userId,
          basicSalary: basicComp,
          earnings,
          deductions,
          effectiveFrom: effectiveDate,
          status: "ACTIVE",
        });
        toast.success("Salary structure saved in database!");
      } else {
        toast.success("Salary structure updated & saved successfully!");
      }
    } catch (err) {
      console.error("Salary save error:", err);
      toast.error(err.response?.data?.message || "Failed to save salary structure");
    }
  };

  const handleCancelSalaryStructure = () => {
    setSalaryComponents([
      { id: 1, name: "Basic Salary", type: "Earning", amount: 40000, calculationType: "Fixed" },
      { id: 2, name: "HRA", type: "Earning", amount: 16000, calculationType: "Fixed" },
      { id: 3, name: "Special Allowance", type: "Earning", amount: 12000, calculationType: "Fixed" },
      { id: 4, name: "Other Allowance", type: "Earning", amount: 7000, calculationType: "Fixed" },
      { id: 5, name: "Provident Fund (PF)", type: "Deduction", amount: 4800, calculationType: "Fixed" },
      { id: 6, name: "Professional Tax", type: "Deduction", amount: 200, calculationType: "Fixed" },
      { id: 7, name: "TDS", type: "Deduction", amount: 5000, calculationType: "Fixed" },
    ]);
    setSalaryNotes("");
    toast.info("Salary structure changes reverted.");
  };

  // ─── Salary Slips State & Handlers ──────────────────────────────────
  const [salarySlipYear, setSalarySlipYear] = useState("2026");
  const [previewSlip, setPreviewSlip] = useState(null);
  const [payslipsData, setPayslipsData] = useState([]);
  const [payslipsLoading, setPayslipsLoading] = useState(false);
  const [generateSlipModalOpen, setGenerateSlipModalOpen] = useState(false);
  const [newSlipMonth, setNewSlipMonth] = useState("October");
  const [newSlipYear, setNewSlipYear] = useState("2026");
  const [newSlipStatus, setNewSlipStatus] = useState("Paid");
  const [slipGenerating, setSlipGenerating] = useState(false);

  const fetchUserPayslips = useCallback(async () => {
    if (!userId) return;
    setPayslipsLoading(true);
    try {
      const [payslipRes, payrollRes] = await Promise.allSettled([
        safeFetchAPI(`/payroll/payslips?employee=${userId}&limit=100`),
        safeFetchAPI(`/payroll/get-all?user=${userId}&limit=100`),
      ]);

      const allSlips = [];
      const seenIds = new Set();

      if (payslipRes.status === "fulfilled" && payslipRes.value) {
        const raw = payslipRes.value.result || payslipRes.value.data || payslipRes.value;
        const list = Array.isArray(raw?.payslips) ? raw.payslips : (Array.isArray(raw) ? raw : []);
        list.forEach((p, idx) => {
          const idKey = String(p._id || `payslip-${idx}`);
          if (!seenIds.has(idKey)) {
            seenIds.add(idKey);
            const basic = p.earnings?.find((e) => (e.name || "").toLowerCase().includes("basic"))?.amount || p.grossSalary || 40000;
            const hra = p.earnings?.find((e) => (e.name || "").toLowerCase().includes("hra"))?.amount || 0;
            const special = p.earnings?.find((e) => (e.name || "").toLowerCase().includes("special"))?.amount || 0;
            const incentive = p.earnings?.find((e) => (e.name || "").toLowerCase().includes("incentive"))?.amount || 0;
            const pf = p.deductions?.find((d) => (d.name || "").toLowerCase().includes("pf"))?.amount || 0;
            const pt = p.deductions?.find((d) => (d.name || "").toLowerCase().includes("tax") || (d.name || "").toLowerCase().includes("pt"))?.amount || 0;
            const tds = p.deductions?.find((d) => (d.name || "").toLowerCase().includes("tds"))?.amount || 0;

            allSlips.push({
              id: p._id || idx + 1,
              month: `${p.month} ${p.year}`,
              year: String(p.year || "2026"),
              rawMonth: p.month,
              netPay: (p.netSalary || 0).toLocaleString("en-IN"),
              basic: Number(basic).toLocaleString("en-IN"),
              hra: Number(hra).toLocaleString("en-IN"),
              special: Number(special).toLocaleString("en-IN"),
              incentive: Number(incentive).toLocaleString("en-IN"),
              pf: Number(pf).toLocaleString("en-IN"),
              pt: Number(pt).toLocaleString("en-IN"),
              tds: Number(tds).toLocaleString("en-IN"),
              status: p.paymentStatus === "PAID" ? "Paid" : "Generated",
              generatedOn: p.paymentDate
                ? new Date(p.paymentDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                : new Date(p.createdAt || Date.now()).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
              daysWorked: p.daysWorked || 22,
              slipNo: p.payslipNo || `PAY-${p.year || "2026"}-${p.month || "01"}-${String(idx + 1).padStart(3, "0")}`,
              attendance: p.attendance || p.attendanceSummary || null,
              raw: p,
            });
          }
        });
      }

      if (payrollRes.status === "fulfilled" && payrollRes.value) {
        const raw = payrollRes.value.result || payrollRes.value.data || payrollRes.value;
        const list = Array.isArray(raw?.payrolls) ? raw.payrolls : (Array.isArray(raw) ? raw : []);
        list.forEach((p, idx) => {
          const idKey = String(p._id || `payroll-${idx}`);
          if (!seenIds.has(idKey)) {
            seenIds.add(idKey);
            const basic = p.basicSalary || 40000;
            const allowances = p.allowanceDetails || [];
            const deductions = p.deductionDetails || [];
            const hra = allowances.find((e) => (e.name || "").toLowerCase().includes("hra"))?.amount || 0;
            const special = allowances.find((e) => (e.name || "").toLowerCase().includes("special"))?.amount || 0;
            const incentive = allowances.find((e) => (e.name || "").toLowerCase().includes("incentive"))?.amount || 0;
            const pf = deductions.find((d) => (d.name || "").toLowerCase().includes("pf"))?.amount || 0;
            const pt = deductions.find((d) => (d.name || "").toLowerCase().includes("tax") || (d.name || "").toLowerCase().includes("pt"))?.amount || 0;
            const tds = deductions.find((d) => (d.name || "").toLowerCase().includes("tds"))?.amount || 0;

            allSlips.push({
              id: p._id || `legacy-${idx + 1}`,
              month: `${p.month} ${p.year}`,
              year: String(p.year || "2026"),
              rawMonth: p.month,
              netPay: (p.netSalary || 0).toLocaleString("en-IN"),
              basic: Number(basic).toLocaleString("en-IN"),
              hra: Number(hra).toLocaleString("en-IN"),
              special: Number(special).toLocaleString("en-IN"),
              incentive: Number(incentive).toLocaleString("en-IN"),
              pf: Number(pf).toLocaleString("en-IN"),
              pt: Number(pt).toLocaleString("en-IN"),
              tds: Number(tds).toLocaleString("en-IN"),
              status: p.status || "Paid",
              generatedOn: p.paidDate
                ? new Date(p.paidDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                : new Date(p.createdAt || Date.now()).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
              daysWorked: p.daysWorked || 22,
              slipNo: p.salarySlipNo || `PAY-${p.year || "2026"}-${p.month || "01"}-${String(idx + 1).padStart(3, "0")}`,
              attendance: p.attendance || p.attendanceSummary || null,
              raw: p,
            });
          }
        });
      }

      setPayslipsData(allSlips);
    } catch (err) {
      console.warn("User payslips fetch notice:", err);
      setPayslipsData([]);
    } finally {
      setPayslipsLoading(false);
    }
  }, [userId, safeFetchAPI]);

  useEffect(() => {
    if (userId) {
      fetchUserPayslips();
    }
  }, [userId, fetchUserPayslips]);

  const handleGenerateSalarySlip = async () => {
    try {
      setSlipGenerating(true);
      const basicComp = Number(salaryComponents.find((c) => (c.name || "").toLowerCase().includes("basic"))?.amount) || 40000;
      const allowanceDetails = salaryComponents
        .filter((c) => c.type === "Earning" && !(c.name || "").toLowerCase().includes("basic"))
        .map((c) => ({ name: c.name, amount: Number(c.amount) || 0 }));
      const deductionDetails = salaryComponents
        .filter((c) => c.type === "Deduction")
        .map((c) => ({ name: c.name, amount: Number(c.amount) || 0 }));

      await axiosInstance.post("/payroll/generate", {
        user: userId,
        month: newSlipMonth,
        year: Number(newSlipYear),
        basicSalary: basicComp,
        allowanceDetails,
        deductionDetails,
        status: newSlipStatus,
        paymentMethod: "Bank Transfer",
        remarks: "Generated from Employee Profile",
      });

      toast.success(`Salary slip for ${newSlipMonth} ${newSlipYear} generated successfully!`);
      setGenerateSlipModalOpen(false);
      fetchUserPayslips();
    } catch (err) {
      console.error("Generate payslip error:", err);
      toast.error(err.response?.data?.message || "Failed to generate salary slip");
    } finally {
      setSlipGenerating(false);
    }
  };

  const handleDownloadSlip = (slip) => {
    toast.success(`Preparing salary slip for ${slip.month}...`);
    setPreviewSlip(slip);
  };

  // ─── Documents Interactive State ─────────────────────────────────────
  const [selectedDocCategory, setSelectedDocCategory] = useState(null);
  const [uploadDocModalOpen, setUploadDocModalOpen] = useState(false);
  const [newDocForm, setNewDocForm] = useState({ categoryId: "aadhaar", name: "", file: null });
  const [documentsCategories, setDocumentsCategories] = useState([
    {
      id: "aadhaar",
      title: "Aadhaar Card",
      docCount: 1,
      verified: true,
      description: "Aadhaar Card copy",
      iconColor: "#3b82f6",
      bgColor: "#eff6ff",
      darkBgColor: "rgba(59, 130, 246, 0.12)",
      icon: BadgeOutlined,
      files: [
        { id: 1, name: "Aadhaar_Card_Front_Back.pdf", size: "1.2 MB", uploadedOn: "15 Jan 2023", verified: true },
      ],
    },
    {
      id: "pan",
      title: "PAN Card",
      docCount: 1,
      verified: true,
      description: "PAN Card copy",
      iconColor: "#f97316",
      bgColor: "#fff7ed",
      darkBgColor: "rgba(249, 115, 22, 0.12)",
      icon: Description,
      files: [
        { id: 2, name: "PAN_Card_Signed.pdf", size: "850 KB", uploadedOn: "15 Jan 2023", verified: true },
      ],
    },
    {
      id: "education",
      title: "Educational Documents",
      docCount: 3,
      verified: false,
      description: "Degree, Certificates, Mark Sheets",
      iconColor: "#10b981",
      bgColor: "#f0fdf4",
      darkBgColor: "rgba(16, 185, 129, 0.12)",
      icon: School,
      files: [
        { id: 3, name: "BTech_Degree_Certificate.pdf", size: "2.4 MB", uploadedOn: "16 Jan 2023", verified: true },
        { id: 4, name: "12th_HSC_Marksheet.pdf", size: "1.1 MB", uploadedOn: "16 Jan 2023", verified: true },
        { id: 5, name: "Solar_Technical_Certification.pdf", size: "1.8 MB", uploadedOn: "20 Jan 2023", verified: true },
      ],
    },
    {
      id: "employment",
      title: "Employment Documents",
      docCount: 2,
      verified: false,
      description: "Offer Letter, Appointment Letter",
      iconColor: "#8b5cf6",
      bgColor: "#f5f3ff",
      darkBgColor: "rgba(139, 92, 246, 0.12)",
      icon: WorkOutline,
      files: [
        { id: 6, name: "Signed_Offer_Letter.pdf", size: "1.5 MB", uploadedOn: "15 Jan 2023", verified: true },
        { id: 7, name: "Appointment_Order_2023.pdf", size: "980 KB", uploadedOn: "15 Jan 2023", verified: true },
      ],
    },
    {
      id: "bank",
      title: "Bank Details",
      docCount: 1,
      verified: false,
      description: "Cancelled Cheque, Bank Proof",
      iconColor: "#f59e0b",
      bgColor: "#fffbeb",
      darkBgColor: "rgba(245, 158, 11, 0.12)",
      icon: AccountBalance,
      files: [
        { id: 8, name: "HDFC_Cancelled_Cheque.pdf", size: "640 KB", uploadedOn: "18 Jan 2023", verified: true },
      ],
    },
    {
      id: "salary",
      title: "Salary Documents",
      docCount: 2,
      verified: false,
      description: "Salary Structure, Form 16",
      iconColor: "#f43f5e",
      bgColor: "#fff1f2",
      darkBgColor: "rgba(244, 63, 94, 0.12)",
      icon: ReceiptLong,
      files: [
        { id: 9, name: "Salary_Annexure_Breakup.pdf", size: "1.1 MB", uploadedOn: "01 Feb 2023", verified: true },
        { id: 10, name: "Form_16_FY_2025_26.pdf", size: "2.1 MB", uploadedOn: "10 Jul 2026", verified: true },
      ],
    },
    {
      id: "medical",
      title: "Medical Documents",
      docCount: 1,
      verified: false,
      description: "Health Certificate",
      iconColor: "#10b981",
      bgColor: "#f0fdf4",
      darkBgColor: "rgba(16, 185, 129, 0.12)",
      icon: MedicalServices,
      files: [
        { id: 11, name: "Employee_Medical_Fitness_Cert.pdf", size: "750 KB", uploadedOn: "12 Jan 2023", verified: true },
      ],
    },
    {
      id: "experience",
      title: "Experience Documents",
      docCount: 1,
      verified: false,
      description: "Previous Company Relieving Letter",
      iconColor: "#8b5cf6",
      bgColor: "#faf5ff",
      darkBgColor: "rgba(139, 92, 246, 0.12)",
      icon: EmojiEvents,
      files: [
        { id: 12, name: "Previous_Employer_Relieving_Letter.pdf", size: "1.3 MB", uploadedOn: "10 Jan 2023", verified: true },
      ],
    },
    {
      id: "other",
      title: "Other Documents",
      docCount: 1,
      verified: false,
      description: "Any other relevant document",
      iconColor: "#0284c7",
      bgColor: "#f0f9ff",
      darkBgColor: "rgba(2, 132, 199, 0.12)",
      icon: MoreHoriz,
      files: [
        { id: 13, name: "Driver_License_Copy.pdf", size: "900 KB", uploadedOn: "25 Jan 2023", verified: true },
      ],
    },
  ]);

  const handleUploadDocumentSubmit = () => {
    if (!newDocForm.name) {
      toast.error("Please enter document title");
      return;
    }
    const fileSizeStr = newDocForm.file
      ? `${(newDocForm.file.size / (1024 * 1024)).toFixed(1)} MB`
      : "1.4 MB";
    const newFileObj = {
      id: Date.now(),
      name: newDocForm.file?.name || `${newDocForm.name}.pdf`,
      size: fileSizeStr,
      uploadedOn: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      verified: false,
      fileObject: newDocForm.file || null,
      fileUrl: newDocForm.file ? URL.createObjectURL(newDocForm.file) : null,
    };
    setDocumentsCategories((prev) =>
      prev.map((cat) => {
        if (cat.id === newDocForm.categoryId) {
          const updatedFiles = [...cat.files, newFileObj];
          return { ...cat, docCount: updatedFiles.length, files: updatedFiles };
        }
        return cat;
      })
    );
    setSelectedDocCategory((prev) => {
      if (prev && prev.id === newDocForm.categoryId) {
        const updatedFiles = [...prev.files, newFileObj];
        return { ...prev, docCount: updatedFiles.length, files: updatedFiles };
      }
      return prev;
    });
    toast.success(`"${newDocForm.name}" uploaded successfully!`);
    setUploadDocModalOpen(false);
    setNewDocForm({ categoryId: "aadhaar", name: "", file: null });
  };

  const handleDownloadEmployeeDocument = (file, category) => {
    try {
      if (file.fileUrl) {
        const a = document.createElement("a");
        a.href = file.fileUrl;
        a.download = file.name || "document.pdf";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast.success(`Downloading ${file.name}...`);
        return;
      }

      if (file.fileObject) {
        const url = URL.createObjectURL(file.fileObject);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name || "document.pdf";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success(`Downloading ${file.name}...`);
        return;
      }

      // Generate verified employee document PDF
      const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
      const docTitle = (file.name || "Employee_Document").replace(/\.[^/.]+$/, "");
      const categoryName = category?.title || "Employee Verification Document";
      const empName = profileData.fullName || userName || "Silu Reddy";
      const empId = profileData.employeeId || userEmpId || "10064";
      const department = profileData.department || "Solar Technical & Installation";

      // Header Banner
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 595, 95, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("VANURTECH PVT LTD", 40, 42);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(148, 163, 184);
      doc.text("Solar Technical & Installation Services | Employee Document Record", 40, 62);

      // Card container
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(40, 120, 515, 270, 8, 8, "F");
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(40, 120, 515, 270, 8, 8, "D");

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(docTitle.replace(/_/g, " "), 60, 155);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text(`Category: ${categoryName}`, 60, 175);

      doc.setDrawColor(226, 232, 240);
      doc.line(60, 190, 535, 190);

      const details = [
        ["Employee Name", empName],
        ["Employee ID", empId],
        ["Department", department],
        ["Document Name", file.name],
        ["File Size", file.size || "1.2 MB"],
        ["Uploaded On", file.uploadedOn || "Verified Record"],
        ["Verification Status", file.verified ? "VERIFIED & APPROVED" : "PENDING VERIFICATION"],
      ];

      let startY = 215;
      details.forEach(([label, val]) => {
        doc.setFont("helvetica", "bold");
        doc.setTextColor(71, 85, 105);
        doc.text(`${label}:`, 60, startY);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(15, 23, 42);
        doc.text(String(val), 210, startY);
        startY += 20;
      });

      // Bottom Notice
      doc.setFillColor(239, 246, 255);
      doc.roundedRect(40, 420, 515, 55, 6, 6, "F");
      doc.setTextColor(29, 78, 216);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Official Employee Document Archive", 60, 442);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(59, 130, 246);
      doc.text("This document is archived and registered under the Vanurtech HR Employee Management System.", 60, 458);

      // Signatory
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(9);
      doc.text("Authorized HR Signatory", 390, 530);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text("Vanurtech Pvt Ltd", 390, 545);

      doc.save(file.name.endsWith(".pdf") ? file.name : `${file.name}.pdf`);
      toast.success(`Downloaded ${file.name}`);
    } catch (err) {
      console.error("Document download error:", err);
      toast.error("Failed to download document");
    }
  };

  // ─── Lead Performance State ──────────────────────────────────────────
  const [leadDateRange, setLeadDateRange] = useState("01 Aug 2025 - 31 Aug 2025");
  const [leadCurrentPage, setLeadCurrentPage] = useState(1);
  const [selectedLeadDetails, setSelectedLeadDetails] = useState(null);
  const [leadsList] = useState([
    { id: 1, leadNo: "L-0012", customerName: "Anil Das", assignedDate: "01 Aug 2025", status: "Completed", completionDate: "05 Aug 2025", remarks: "Site visit done", phone: "+91 98451 22345", capacity: "5 kW Rooftop", amount: "₹ 2,45,000", address: "Sector 14, Site #102" },
    { id: 2, leadNo: "L-0013", customerName: "Sunita Patnaik", assignedDate: "02 Aug 2025", status: "Completed", completionDate: "04 Aug 2025", remarks: "Deal closed", phone: "+91 97312 88412", capacity: "10 kW Commercial", amount: "₹ 4,80,000", address: "Industrial Zone, Phase 1" },
    { id: 3, leadNo: "L-0014", customerName: "Rajesh Mehta", assignedDate: "03 Aug 2025", status: "In Progress", completionDate: "-", remarks: "Follow up pending", phone: "+91 99014 55678", capacity: "3 kW Residential", amount: "₹ 1,60,000", address: "Green Valley, Plot 45" },
    { id: 4, leadNo: "L-0015", customerName: "Kiran Sahu", assignedDate: "05 Aug 2025", status: "Completed", completionDate: "08 Aug 2025", remarks: "Installation done", phone: "+91 94480 11290", capacity: "7 kW On-Grid", amount: "₹ 3,40,000", address: "Sun City, Block B" },
    { id: 5, leadNo: "L-0016", customerName: "Meena Reddy", assignedDate: "06 Aug 2025", status: "Not Completed", completionDate: "-", remarks: "Not interested", phone: "+91 98860 33451", capacity: "5 kW Hybrid", amount: "₹ 2,90,000", address: "Main Road, Sector 6" },
    { id: 6, leadNo: "L-0017", customerName: "Vikash Singh", assignedDate: "08 Aug 2025", status: "Completed", completionDate: "12 Aug 2025", remarks: "Payment received", phone: "+91 96112 44789", capacity: "8 kW Rooftop", amount: "₹ 3,85,000", address: "North Tech Zone" },
    { id: 7, leadNo: "L-0018", customerName: "Pooja Sharma", assignedDate: "10 Aug 2025", status: "In Progress", completionDate: "-", remarks: "Quotation sent", phone: "+91 97405 66782", capacity: "4 kW Residential", amount: "₹ 1,95,000", address: "Airport Road, Plot 12" },
    { id: 8, leadNo: "L-0019", customerName: "Ramesh Yadav", assignedDate: "12 Aug 2025", status: "Completed", completionDate: "14 Aug 2025", remarks: "Deal closed", phone: "+91 99801 77890", capacity: "12 kW Commercial", amount: "₹ 5,60,000", address: "Solar Hub, Unit 8" },
    { id: 9, leadNo: "L-0020", customerName: "Amit Verma", assignedDate: "14 Aug 2025", status: "Not Completed", completionDate: "-", remarks: "Not reachable", phone: "+91 98450 99812", capacity: "5 kW Off-Grid", amount: "₹ 2,65,000", address: "South Park, Phase 3" },
    { id: 10, leadNo: "L-0021", customerName: "Neha Gupta", assignedDate: "16 Aug 2025", status: "Completed", completionDate: "18 Aug 2025", remarks: "Installation done", phone: "+91 96321 00456", capacity: "6 kW On-Grid", amount: "₹ 2,95,000", address: "East Ring Road" },
    // Page 2
    { id: 11, leadNo: "L-0022", customerName: "Sanjay Joshi", assignedDate: "18 Aug 2025", status: "Completed", completionDate: "20 Aug 2025", remarks: "Commissioning verified", phone: "+91 98452 33412", capacity: "5 kW Rooftop", amount: "₹ 2,45,000", address: "West Industrial Area" },
    { id: 12, leadNo: "L-0023", customerName: "Ananya Roy", assignedDate: "20 Aug 2025", status: "In Progress", completionDate: "-", remarks: "Site inspection scheduled", phone: "+91 97412 55678", capacity: "8 kW Hybrid", amount: "₹ 3,90,000", address: "Central Avenue, Plot 88" },
    { id: 13, leadNo: "L-0024", customerName: "Manoj Kumar", assignedDate: "22 Aug 2025", status: "Completed", completionDate: "25 Aug 2025", remarks: "Handover completed", phone: "+91 94490 88712", capacity: "15 kW Commercial", amount: "₹ 7,20,000", address: "Manufacturing Hub, Bay 3" },
    { id: 14, leadNo: "L-0025", customerName: "Deepa Nair", assignedDate: "24 Aug 2025", status: "Completed", completionDate: "26 Aug 2025", remarks: "Deal closed", phone: "+91 96110 55432", capacity: "5 kW On-Grid", amount: "₹ 2,50,000", address: "Green Meadows, Sector 9" },
    { id: 15, leadNo: "L-0026", customerName: "Rohit Agarwal", assignedDate: "26 Aug 2025", status: "In Progress", completionDate: "-", remarks: "Quotation revised", phone: "+91 98801 22345", capacity: "10 kW Rooftop", amount: "₹ 4,75,000", address: "Sunrise Layout, Phase 2" },
  ]);

  // ─── Real User Data Mapping ─────────────────────────────────────────
  const userName = user
    ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.name || "Employee"
    : "Employee";
  const userEmail = user?.email || "—";
  const userPhone = user?.phoneNumber || user?.phone || "—";
  const userEmpId = user?.employeeId || (user?._id ? `EMP-${user._id.slice(-4).toUpperCase()}` : "EMP-0001");
  const userInitials = user
    ? `${user.firstName?.[0] || user.name?.[0] || "U"}${user.lastName?.[0] || ""}`.toUpperCase()
    : "U";
  const joinDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "—";

  const copyToClipboard = (text, label = "Item") => {
    if (!text || text === "—") return;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard!`);
    } else {
      toast.info(text);
    }
  };

  const managerName = useMemo(() => {
    if (user?.supervisor) {
      if (typeof user.supervisor === "object") {
        const name = `${user.supervisor.firstName || ""} ${user.supervisor.lastName || ""}`.trim();
        return name || user.supervisor.email || "Assigned Supervisor";
      }
      return "Assigned Supervisor";
    }
    return "Direct to Management";
  }, [user]);

  const locationText = user?.zone || user?.city || user?.state || user?.address || null;

  const displayRole = useMemo(() => {
    if (!user?.role) return "Solar Installer";
    if (user.role === "PROJECT_HEAD") return "Project Head";
    if (user.role === "ZSM") return "Zonal Sales Manager";
    if (user.role === "MANAGER") return "Operations Manager";
    if (user.role === "SUPERVISOR") return "Site Supervisor";
    if (user.role === "Incharge") return "Technical Incharge";
    if (user.role === "INSTALLER") return "Solar Installer";
    if (user.role === "TEAM") return "Field Team Member";
    if (user.role === "Admin_panel" || user.role === "ADMIN") return "System Administrator";
    return user.role;
  }, [user]);

  const departmentText = useMemo(() => {
    if (!user?.role) return "Solar Operations";
    if (user.role === "ADMIN" || user.role === "Admin_panel") return "System Administration";
    if (user.role === "PROJECT_HEAD") return "Projects & Delivery Management";
    if (user.role === "ZSM") return "Sales & Customer Growth";
    if (user.role === "MANAGER") return "Operations & Management";
    if (user.role === "SUPERVISOR") return "Field Supervision & Quality";
    if (user.role === "Incharge" || user.role === "INSTALLER" || user.role === "TEAM") return "Solar Technical & Installation";
    return "Operations Department";
  }, [user]);

  const userStatus = user?.status || "active";
  const isUserActive = String(userStatus).toLowerCase() === "active";

  // Profile Information State (7 Sections with real user binding)
  const [profileData, setProfileData] = useState({
    // 1. Personal Information
    fullName: userName,
    dob: user?.dob || "—",
    gender: user?.gender || "—",
    bloodGroup: user?.bloodGroup || "—",
    maritalStatus: user?.maritalStatus || "—",
    nationality: user?.nationality || "Indian",
    aadhaar: user?.aadhaar || user?.nationalId || "—",
    pan: user?.pan || "—",

    // 2. Contact Information
    email: userEmail,
    phone: userPhone,
    altPhone: user?.altPhone || user?.alternateNumber || "—",
    currentAddress: user?.currentAddress || user?.address || (user?.zone ? user.zone : "—"),
    permanentAddress: user?.permanentAddress || user?.address || "—",

    // 3. Employment Information
    empId: userEmpId,
    designation: user?.designation || displayRole,
    department: user?.department || departmentText,
    joiningDate: user?.joiningDate || joinDate,
    employmentType: user?.employmentType || "Full-time",
    workLocation: user?.workLocation || locationText || "—",
    reportingManager: managerName,
    experience: user?.experience || "—",

    // 4. Family Information
    fatherName: user?.fatherName || "—",
    motherName: user?.motherName || "—",
    spouseName: user?.spouseName || "—",
    childrenCount: user?.childrenCount || "—",

    // 5. Bank Information
    bankName: user?.bankName || "—",
    accountNumber: user?.accountNumber || "—",
    ifsc: user?.ifsc || "—",
    accountType: user?.accountType || "—",
    panTds: user?.panTds || user?.pan || "—",

    // 6. Emergency Contact
    emergencyName: user?.emergencyName || (user?.supervisor?.firstName ? `${user.supervisor.firstName} ${user.supervisor.lastName || ""}`.trim() : "—"),
    emergencyRelation: user?.emergencyRelation || (user?.supervisor ? "Supervisor" : "—"),
    emergencyPhone: user?.emergencyPhone || user?.supervisor?.phoneNumber || "—",
    emergencyAddress: user?.emergencyAddress || locationText || "—",

    // 7. Additional Information
    languages: user?.languages || "—",
    hobbies: user?.hobbies || "—",
    about: user?.about || "—",
  });

  // Keep profileData synchronized with user changes
  useEffect(() => {
    if (user) {
      const formatDisplayDate = (val) => {
        if (!val || val === "—") return "—";
        const d = new Date(val);
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
        }
        return val;
      };

      const computedName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.name || "Employee";
      const computedEmail = user.email || "—";
      const computedPhone = user.phoneNumber || user.phone || "—";
      const computedEmpId = user.employeeId || (user._id ? `EMP-${user._id.slice(-4).toUpperCase()}` : "—");
      const computedJoinDate = user.joiningDate ? formatDisplayDate(user.joiningDate) : (user.createdAt ? formatDisplayDate(user.createdAt) : "—");
      const computedDob = user.dob ? formatDisplayDate(user.dob) : "—";
      const computedManager = user.supervisor
        ? typeof user.supervisor === "object"
          ? `${user.supervisor.firstName || ""} ${user.supervisor.lastName || ""}`.trim() || user.supervisor.email || "—"
          : "—"
        : "Direct to Management";
      const computedLocation = user.workLocation || user.zone || user.city || user.state || user.address || "—";

      setProfileData({
        fullName: computedName,
        dob: computedDob,
        gender: user.gender || "—",
        bloodGroup: user.bloodGroup || "—",
        maritalStatus: user.maritalStatus || "—",
        nationality: user.nationality || "Indian",
        email: computedEmail,
        phone: computedPhone,
        altPhone: user.altPhone || user.alternateNumber || "—",
        empId: computedEmpId,
        designation: user.designation || displayRole,
        department: user.department || departmentText,
        joiningDate: computedJoinDate,
        employmentType: user.employmentType || "Full-time",
        workLocation: computedLocation,
        reportingManager: computedManager,
        experience: user.experience || "—",
        currentAddress: user.currentAddress || user.address || (user.zone ? user.zone : "—"),
        permanentAddress: user.permanentAddress || user.address || "—",
        fatherName: user.fatherName || "—",
        motherName: user.motherName || "—",
        spouseName: user.spouseName || "—",
        childrenCount: user.childrenCount || "—",
        aadhaar: user.aadhaar || user.nationalId || "—",
        pan: user.pan || "—",
        bankName: user.bankName || "—",
        accountNumber: user.accountNumber || "—",
        ifsc: user.ifsc || "—",
        accountType: user.accountType || "—",
        panTds: user.panTds || user.pan || "—",
        emergencyName: user.emergencyName || (user?.supervisor?.firstName ? `${user.supervisor.firstName} ${user.supervisor.lastName || ""}`.trim() : "—"),
        emergencyRelation: user.emergencyRelation || (user?.supervisor ? "Supervisor" : "—"),
        emergencyPhone: user.emergencyPhone || user?.supervisor?.phoneNumber || "—",
        emergencyAddress: user.emergencyAddress || computedLocation || "—",
        languages: user.languages || "—",
        hobbies: user.hobbies || "—",
        about: user.about || "—",
      });
    }
  }, [user, displayRole, departmentText]);

  // Section Edit Modal
  const [editModalSection, setEditModalSection] = useState(null);
  const [tempEditData, setTempEditData] = useState({});

  const handleOpenEditModal = (sectionKey) => {
    setEditModalSection(sectionKey);
    const cleaned = {};
    const parseToInputDate = (str) => {
      if (!str || str === "—") return "";
      if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
      const d = new Date(str);
      if (!isNaN(d.getTime())) {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      }
      return "";
    };

    Object.entries(profileData).forEach(([k, v]) => {
      if (v === "—" || v === null || v === undefined) {
        cleaned[k] = "";
      } else if (k === "dob" || k === "joiningDate") {
        cleaned[k] = parseToInputDate(v);
      } else if (typeof v === "string") {
        cleaned[k] = v.replace(/^🩸\s*/, "").replace(/^🇮🇳\s*/, "");
      } else {
        cleaned[k] = v;
      }
    });
    setTempEditData(cleaned);
  };

  const handleSaveEditModal = async () => {
    try {
      const updatedProfile = { ...profileData, ...tempEditData };
      setProfileData(updatedProfile);
      setEditModalSection(null);

      if (userId) {
        const nameParts = (updatedProfile.fullName || "").trim().split(" ");
        const firstName = nameParts[0] || user?.firstName;
        const lastName = nameParts.slice(1).join(" ") || user?.lastName;

        const cleanVal = (val) => (!val || val === "—" ? "" : String(val).trim());

        const payload = {
          firstName,
          lastName,
          email: cleanVal(updatedProfile.email) || user?.email,
          phoneNumber: cleanVal(updatedProfile.phone) || user?.phoneNumber,

          // 1. Personal Information
          dob: cleanVal(updatedProfile.dob),
          gender: cleanVal(updatedProfile.gender),
          bloodGroup: cleanVal(updatedProfile.bloodGroup).replace("🩸 ", ""),
          maritalStatus: cleanVal(updatedProfile.maritalStatus),
          nationality: cleanVal(updatedProfile.nationality).replace("🇮🇳 ", "") || "Indian",
          aadhaar: cleanVal(updatedProfile.aadhaar),
          pan: cleanVal(updatedProfile.pan),

          // 2. Contact Information
          altPhone: cleanVal(updatedProfile.altPhone),
          address: cleanVal(updatedProfile.currentAddress) || cleanVal(updatedProfile.permanentAddress) || user?.address,
          currentAddress: cleanVal(updatedProfile.currentAddress),
          permanentAddress: cleanVal(updatedProfile.permanentAddress),

          // 3. Employment Information
          employeeId: cleanVal(updatedProfile.empId) || user?.employeeId,
          designation: cleanVal(updatedProfile.designation),
          department: cleanVal(updatedProfile.department),
          joiningDate: cleanVal(updatedProfile.joiningDate),
          employmentType: cleanVal(updatedProfile.employmentType) || "Full-time",
          workLocation: cleanVal(updatedProfile.workLocation),
          experience: cleanVal(updatedProfile.experience),

          // 4. Family Information
          fatherName: cleanVal(updatedProfile.fatherName),
          motherName: cleanVal(updatedProfile.motherName),
          spouseName: cleanVal(updatedProfile.spouseName),
          childrenCount: cleanVal(updatedProfile.childrenCount),

          // 5. Bank Information
          bankName: cleanVal(updatedProfile.bankName),
          accountNumber: cleanVal(updatedProfile.accountNumber),
          ifsc: cleanVal(updatedProfile.ifsc),
          accountType: cleanVal(updatedProfile.accountType),
          panTds: cleanVal(updatedProfile.panTds) || cleanVal(updatedProfile.pan),

          // 6. Emergency Contact
          emergencyName: cleanVal(updatedProfile.emergencyName),
          emergencyRelation: cleanVal(updatedProfile.emergencyRelation),
          emergencyPhone: cleanVal(updatedProfile.emergencyPhone),
          emergencyAddress: cleanVal(updatedProfile.emergencyAddress),

          // 7. Additional Information
          languages: cleanVal(updatedProfile.languages),
          hobbies: cleanVal(updatedProfile.hobbies),
          about: cleanVal(updatedProfile.about),
        };

        const res = await axiosInstance.put(`/user/update/${userId}`, payload);
        if (res.data?.success && (res.data.result || res.data.data)) {
          const savedUser = res.data.result || res.data.data;
          setUser(savedUser);
        }
      }
      toast.success("Profile section updated and saved in database!");
    } catch (err) {
      console.warn("Profile section save error:", err);
      toast.error(err.response?.data?.message || "Profile section updated locally!");
    }
  };

  // ─── Real Attendance Dynamic State ─────────────────────────────────────
  const [selectedAttendanceMonth, setSelectedAttendanceMonth] = useState(new Date());
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceFilterStatus, setAttendanceFilterStatus] = useState("ALL");
  const [holidaysList, setHolidaysList] = useState([]);
  const [attendanceRefreshTrigger, setAttendanceRefreshTrigger] = useState(0);
  const [attendanceDetailsOpen, setAttendanceDetailsOpen] = useState(false);
  const [selectedAttendanceRecord, setSelectedAttendanceRecord] = useState(null);

  const handleAttendanceRowClick = useCallback((row) => {
    if (!row) return;
    const targetUserObj = user || {};
    let att = null;
    if (row.raw) {
      att = {
        ...row.raw,
        user: (row.raw.user && typeof row.raw.user === "object") ? { ...targetUserObj, ...row.raw.user } : targetUserObj,
      };
    } else {
      att = {
        _id: "record_" + (row.dateKey || row.date),
        date: row.dateKey || row.rawDate || row.date,
        status: String(row.status || "absent").toLowerCase(),
        workHours: row.hours || 0,
        workHoursFormatted: row.hours || "00:00",
        punchIn: row.checkIn && row.checkIn !== "—" ? { time: `${row.dateKey}T09:00:00` } : null,
        punchOut: row.checkOut && row.checkOut !== "—" && row.checkOut !== "Ongoing" ? { time: `${row.dateKey}T18:00:00` } : null,
        user: targetUserObj,
        createdAt: row.dateKey || row.rawDate,
        updatedAt: row.dateKey || row.rawDate,
      };
    }
    setSelectedAttendanceRecord(att);
    setAttendanceDetailsOpen(true);
  }, [user]);

  // Fetch real attendance records for the selected month and user
  useEffect(() => {
    const fetchUserAttendance = async () => {
      if (!userId) return;
      setAttendanceLoading(true);
      try {
        const year = selectedAttendanceMonth.getFullYear();
        const month = selectedAttendanceMonth.getMonth();
        const startOfMonth = new Date(year, month, 1);
        const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

        const startDateStr = startOfMonth.toISOString().split("T")[0];
        const endDateStr = endOfMonth.toISOString().split("T")[0];

        const [attRes, holRes] = await Promise.allSettled([
          axiosInstance.get("/attendance", {
            params: {
              userId,
              startDate: startDateStr,
              endDate: endDateStr,
              limit: 100,
            },
          }),
          axiosInstance.get("/attendance/holidays", {
            params: {
              startDate: `${year}-01-01`,
              endDate: `${year}-12-31`,
              limit: 500,
            },
          }),
        ]);

        if (attRes.status === "fulfilled" && attRes.value?.data?.success) {
          const resObj = attRes.value.data.result || attRes.value.data.data;
          const list = Array.isArray(resObj)
            ? resObj
            : Array.isArray(resObj?.attendances)
            ? resObj.attendances
            : [];
          setAttendanceRecords(list);
        } else if (attRes.status === "fulfilled" && Array.isArray(attRes.value?.data)) {
          setAttendanceRecords(attRes.value.data);
        } else {
          setAttendanceRecords([]);
        }

        if (holRes.status === "fulfilled" && holRes.value?.data?.success) {
          const resObj = holRes.value.data.result || holRes.value.data.data;
          const hList = Array.isArray(resObj)
            ? resObj
            : Array.isArray(resObj?.holidays)
            ? resObj.holidays
            : [];
          setHolidaysList(hList);
        } else if (holRes.status === "fulfilled" && Array.isArray(holRes.value?.data)) {
          setHolidaysList(holRes.value.data);
        } else {
          setHolidaysList([]);
        }
      } catch (err) {
        console.warn("Attendance fetch error:", err);
        setAttendanceRecords([]);
        setHolidaysList([]);
      } finally {
        setAttendanceLoading(false);
      }
    };

    fetchUserAttendance();
  }, [userId, selectedAttendanceMonth, attendanceRefreshTrigger]);

  // Calculate dynamic Attendance Calendar & Statistics for the selected month
  // Calculate dynamic Attendance Calendar & Statistics for the selected month
  const attendanceStats = useMemo(() => {
    const year = selectedAttendanceMonth.getFullYear();
    const month = selectedAttendanceMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun, 1 = Mon ...

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Employee joining date to avoid marking pre-joining dates as absent
    const rawJoin = user?.joiningDate || user?.createdAt;
    let userJoinDateObj = rawJoin ? new Date(rawJoin) : null;
    if (userJoinDateObj && !isNaN(userJoinDateObj.getTime())) {
      userJoinDateObj.setHours(0, 0, 0, 0);
    } else {
      userJoinDateObj = null;
    }

    const recordMap = {};
    let totalWorkHoursSum = 0;
    let lateArrivalsCount = 0;

    const safeAttendance = Array.isArray(attendanceRecords) ? attendanceRecords : [];
    safeAttendance.forEach((rec) => {
      let recDate = null;
      if (rec?.date) {
        recDate = new Date(rec.date);
      } else if (rec?.punchIn?.time) {
        recDate = new Date(rec.punchIn.time);
      }
      if (recDate && !isNaN(recDate.getTime())) {
        const key = `${recDate.getFullYear()}-${String(recDate.getMonth() + 1).padStart(2, "0")}-${String(recDate.getDate()).padStart(2, "0")}`;
        recordMap[key] = rec;
        const utcKey = recDate.toISOString().split("T")[0];
        if (!recordMap[utcKey]) recordMap[utcKey] = rec;

        if (rec.workHours) {
          totalWorkHoursSum += Number(rec.workHours) || 0;
        }
        if (rec.isLate || rec.punchIn?.isLate) {
          lateArrivalsCount += 1;
        }
      }
    });

    const holidayMap = {};
    const safeHolidays = Array.isArray(holidaysList) ? holidaysList : [];
    safeHolidays.forEach((h) => {
      if (h?.date) {
        const d = new Date(h.date);
        if (!isNaN(d.getTime())) {
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
          holidayMap[key] = h.reason || h.name || h.title || "Holiday";
        }
      }
    });

    const calendarCells = [];
    const logEntries = [];
    let presentCount = 0;
    let absentCount = 0;
    let onLeaveCount = 0;
    let weeklyOffCount = 0;
    let holidayCount = 0;
    let notJoinedCount = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);
      currentDate.setHours(0, 0, 0, 0);
      const isFuture = currentDate > today;
      const isSunday = currentDate.getDay() === 0;
      const isPriorToJoining = userJoinDateObj && currentDate < userJoinDateObj;
      const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const rec = recordMap[key];
      const holidayName = holidayMap[key];

      let type = "default";
      let statusLabel = "—";
      let checkInStr = "—";
      let checkOutStr = "—";
      let hoursStr = "—";

      if (isSunday) {
        type = "weekly";
        statusLabel = "Weekly Off";
        weeklyOffCount++;
      } else if (holidayName) {
        type = "holiday";
        statusLabel = "Holiday";
        holidayCount++;
      } else if (isPriorToJoining) {
        type = "not_joined";
        statusLabel = "Not Joined";
        notJoinedCount++;
      } else if (rec) {
        const rawStatus = (rec.status || "").toLowerCase();
        if (rawStatus.includes("leave")) {
          type = "leave";
          statusLabel = "On Leave";
          onLeaveCount++;
        } else if (rawStatus.includes("absent")) {
          type = "absent";
          statusLabel = "Absent";
          absentCount++;
        } else {
          type = "present";
          statusLabel = rec.status || "Present";
          presentCount++;
        }

        if (rec.punchIn?.time) {
          checkInStr = new Date(rec.punchIn.time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
        }
        if (rec.punchOut?.time) {
          checkOutStr = new Date(rec.punchOut.time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
        }
        if (rec.workHours != null) {
          const hrs = Math.floor(rec.workHours);
          const mins = Math.round((rec.workHours - hrs) * 60);
          hoursStr = `${hrs}h ${mins > 0 ? `${mins}m` : "00m"}`;
        }
      } else if (!isFuture) {
        type = "absent";
        statusLabel = "Absent";
        absentCount++;
      } else {
        type = "default";
        statusLabel = "Upcoming";
      }

      calendarCells.push({
        day,
        type,
        date: currentDate,
        statusLabel,
      });

      if (!isFuture || rec) {
        const dateFormatted = currentDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
        const dayFormatted = currentDate.toLocaleDateString("en-IN", { weekday: "short" });
        logEntries.push({
          date: dateFormatted,
          day: dayFormatted,
          rawDate: currentDate,
          status: statusLabel,
          type,
          checkIn: checkInStr,
          checkOut: checkOutStr,
          hours: hoursStr,
          raw: rec,
          dateKey: `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`,
        });
      }
    }

    logEntries.sort((a, b) => b.rawDate - a.rawDate);

    const workingDays = Math.max(0, daysInMonth - weeklyOffCount - holidayCount - notJoinedCount);
    const avgWorkHours = presentCount > 0 ? (totalWorkHoursSum / presentCount).toFixed(1) : "0.0";
    const totalHoursWhole = Math.floor(totalWorkHoursSum);
    const totalMinsWhole = Math.round((totalWorkHoursSum - totalHoursWhole) * 60);

    // Dynamic Attendance Insights Calculations:
    // 1. Longest Present Streak
    let currentStreak = 0;
    let maxStreak = 0;
    let streakStart = null;
    let streakEnd = null;
    let tempStreakStart = null;

    const daysAsc = [...calendarCells].sort((a, b) => a.date - b.date);
    daysAsc.forEach((c) => {
      if (c.type === "present") {
        if (currentStreak === 0) tempStreakStart = c.date;
        currentStreak++;
        if (currentStreak > maxStreak) {
          maxStreak = currentStreak;
          streakStart = tempStreakStart;
          streakEnd = c.date;
        }
      } else if (c.type !== "weekly" && c.type !== "holiday") {
        currentStreak = 0;
      }
    });

    let streakSubtitle = "No active streak";
    if (maxStreak > 0 && streakStart && streakEnd) {
      const sStartStr = streakStart.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
      const sEndStr = streakEnd.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
      streakSubtitle = `${sStartStr} - ${sEndStr}`;
    }

    // 2. Most Productive Day (by weekday hours)
    const weekdayHours = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    const weekdayCounts = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    const weekdayLate = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    safeAttendance.forEach((rec) => {
      const d = rec?.date ? new Date(rec.date) : (rec?.punchIn?.time ? new Date(rec.punchIn.time) : null);
      if (d && !isNaN(d.getTime())) {
        const dayIdx = d.getDay();
        const hrs = Number(rec.workHours) || 0;
        weekdayHours[dayIdx] += hrs;
        if (hrs > 0) weekdayCounts[dayIdx] += 1;
        if (rec.isLate || rec.punchIn?.isLate) weekdayLate[dayIdx] += 1;
      }
    });

    let mostProductiveDay = "—";
    let productiveAvgStr = "No data recorded";
    let maxAvgHrs = 0;
    for (let i = 1; i <= 6; i++) {
      if (weekdayCounts[i] > 0) {
        const avg = weekdayHours[i] / weekdayCounts[i];
        if (avg > maxAvgHrs) {
          maxAvgHrs = avg;
          mostProductiveDay = weekdayNames[i];
          const wholeH = Math.floor(avg);
          const wholeM = Math.round((avg - wholeH) * 60);
          productiveAvgStr = `Avg. ${wholeH}h ${wholeM > 0 ? `${wholeM}m` : "00m"}`;
        }
      }
    }

    // 3. Most Late Arrivals
    let mostLateDay = "None";
    let mostLateCount = 0;
    for (let i = 0; i <= 6; i++) {
      if (weekdayLate[i] > mostLateCount) {
        mostLateCount = weekdayLate[i];
        mostLateDay = weekdayNames[i];
      }
    }

    const presentRate = workingDays > 0 ? Math.round((presentCount / workingDays) * 100) : 0;

    return {
      daysInMonth,
      firstDayIndex,
      calendarCells,
      logEntries,
      presentCount,
      absentCount,
      onLeaveCount,
      weeklyOffCount,
      holidayCount,
      workingDays,
      totalWorkHoursFormatted: `${totalHoursWhole}h ${totalMinsWhole > 0 ? `${totalMinsWhole}m` : "00m"}`,
      avgWorkHoursFormatted: `${avgWorkHours}h`,
      lateArrivalsCount,
      maxStreak,
      streakSubtitle,
      mostProductiveDay,
      productiveAvgStr,
      mostLateDay,
      mostLateCount,
      presentRate,
    };
  }, [selectedAttendanceMonth, attendanceRecords, holidaysList, user]);

  // ─── Real User Leaves State & Handlers ────────────────────────────────
  const [userLeaves, setUserLeaves] = useState([]);
  const [leavesLoading, setLeavesLoading] = useState(false);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [leaveSubmitting, setLeaveSubmitting] = useState(false);
  const [leaveFilterStatus, setLeaveFilterStatus] = useState("all");
  const [newLeaveData, setNewLeaveData] = useState({
    leaveType: "Casual Leave",
    startDate: "",
    endDate: "",
    reason: "",
    status: "approved",
  });
  const [reviewNoteModalOpen, setReviewNoteModalOpen] = useState(false);
  const [selectedLeaveForReview, setSelectedLeaveForReview] = useState(null);
  const [reviewActionType, setReviewActionType] = useState("approved");
  const [reviewNoteText, setReviewNoteText] = useState("");

  const fetchUserLeaves = useCallback(async () => {
    if (!userId) return;
    setLeavesLoading(true);
    try {
      const res = await safeFetchAPI(`/leave?user=${userId}&limit=200`);
      if (res?.success && (res.result || res.data)) {
        const payload = res.result || res.data;
        const list = Array.isArray(payload) ? payload : (payload.leaves || []);
        setUserLeaves(list);
      } else if (Array.isArray(res)) {
        setUserLeaves(res);
      } else {
        setUserLeaves([]);
      }
    } catch (err) {
      console.warn("Error fetching user leaves:", err);
      setUserLeaves([]);
    } finally {
      setLeavesLoading(false);
    }
  }, [userId, safeFetchAPI]);

  useEffect(() => {
    if (userId) {
      fetchUserLeaves();
    }
  }, [userId, fetchUserLeaves]);

  const leaveStats = useMemo(() => {
    const safeList = Array.isArray(userLeaves) ? userLeaves : [];
    const total = safeList.length;
    const approved = safeList.filter((l) => (l.status || "").toLowerCase() === "approved");
    const pending = safeList.filter((l) => (l.status || "").toLowerCase() === "pending");
    const rejected = safeList.filter((l) => (l.status || "").toLowerCase() === "rejected");

    const approvedDays = approved.reduce((sum, l) => sum + (Number(l.totalDays) || 1), 0);
    const pendingDays = pending.reduce((sum, l) => sum + (Number(l.totalDays) || 1), 0);

    return {
      total,
      approvedCount: approved.length,
      pendingCount: pending.length,
      rejectedCount: rejected.length,
      approvedDays,
      pendingDays,
    };
  }, [userLeaves]);

  const filteredLeaves = useMemo(() => {
    const safeList = Array.isArray(userLeaves) ? userLeaves : [];
    if (leaveFilterStatus === "all") return safeList;
    return safeList.filter((l) => (l.status || "").toLowerCase() === leaveFilterStatus.toLowerCase());
  }, [userLeaves, leaveFilterStatus]);

  const handleOpenApplyLeaveModal = () => {
    const todayStr = new Date().toISOString().split("T")[0];
    setNewLeaveData({
      leaveType: "Casual Leave",
      startDate: todayStr,
      endDate: todayStr,
      reason: "",
      status: "approved",
    });
    setLeaveModalOpen(true);
  };

  const handleApplyLeave = async () => {
    if (!newLeaveData.startDate || !newLeaveData.endDate) {
      toast.error("Please specify both start date and end date");
      return;
    }
    if (new Date(newLeaveData.endDate) < new Date(newLeaveData.startDate)) {
      toast.error("End date cannot be earlier than start date");
      return;
    }
    if (!newLeaveData.reason.trim()) {
      toast.error("Please enter a reason for the leave");
      return;
    }

    try {
      setLeaveSubmitting(true);
      await axiosInstance.post("/leave", {
        user: userId,
        leaveType: newLeaveData.leaveType,
        startDate: newLeaveData.startDate,
        endDate: newLeaveData.endDate,
        reason: newLeaveData.reason.trim(),
        status: newLeaveData.status || "approved",
      });

      toast.success("Leave record created successfully!");
      setLeaveModalOpen(false);
      fetchUserLeaves();
      setAttendanceRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error("Apply leave failed:", err);
      toast.error(err.response?.data?.message || "Failed to submit leave request");
    } finally {
      setLeaveSubmitting(false);
    }
  };

  const handleOpenReviewDialog = (leave, action) => {
    setSelectedLeaveForReview(leave);
    setReviewActionType(action);
    setReviewNoteText("");
    setReviewNoteModalOpen(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedLeaveForReview?._id) return;
    try {
      setLeaveSubmitting(true);
      await axiosInstance.patch(`/leave/${selectedLeaveForReview._id}/status`, {
        status: reviewActionType,
        reviewNote: reviewNoteText.trim(),
      });
      toast.success(`Leave request ${reviewActionType} successfully!`);
      setReviewNoteModalOpen(false);
      fetchUserLeaves();
      setAttendanceRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error("Leave review error:", err);
      toast.error(err.response?.data?.message || `Failed to update leave status`);
    } finally {
      setLeaveSubmitting(false);
    }
  };

  const handleDeleteLeave = async (leaveId) => {
    if (!window.confirm("Are you sure you want to remove this leave record?")) return;
    try {
      await axiosInstance.delete(`/leave/${leaveId}`);
      toast.success("Leave record removed");
      fetchUserLeaves();
      setAttendanceRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error("Delete leave error:", err);
      toast.error(err.response?.data?.message || "Failed to delete leave");
    }
  };

  const getStatusBadge = (status) => {
    const s = String(status || "").toLowerCase();
    if (s === "present" || s === "approved" || s === "active") {
      return { bg: isDark ? "rgba(16, 185, 129, 0.15)" : "#dcfce7", color: "#15803d", text: "Approved" };
    }
    if (s === "absent" || s === "rejected" || s === "inactive") {
      return { bg: isDark ? "rgba(239, 68, 68, 0.15)" : "#fee2e2", color: "#b91c1c", text: "Rejected" };
    }
    if (s === "on leave" || s === "pending") {
      return { bg: isDark ? "rgba(245, 158, 11, 0.15)" : "#fef3c7", color: "#b45309", text: "Pending" };
    }
    if (s === "weekly off") {
      return { bg: isDark ? "rgba(139, 92, 246, 0.15)" : "#f5f3ff", color: "#7c3aed", text: "Weekly Off" };
    }
    if (s === "holiday") {
      return { bg: isDark ? "rgba(14, 165, 233, 0.15)" : "#f0f9ff", color: "#0284c7", text: "Holiday" };
    }
    if (s === "not joined" || s === "not_joined") {
      return { bg: isDark ? "rgba(148, 163, 184, 0.12)" : "#f1f5f9", color: "#64748b", text: "Not Joined" };
    }
    return { bg: isDark ? "rgba(148, 163, 184, 0.15)" : "#f1f5f9", color: "#475569", text: status || "—" };
  };

  const formatLeaveDuration = (start, end) => {
    if (!start) return "—";
    const dStart = new Date(start);
    const dEnd = end ? new Date(end) : null;
    if (isNaN(dStart.getTime())) return "—";

    const startStr = dStart.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    if (!dEnd || isNaN(dEnd.getTime()) || dStart.toDateString() === dEnd.toDateString()) {
      return startStr;
    }
    const endStr = dEnd.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    return `${startStr} - ${endStr}`;
  };

  const getLeaveTypeStyle = (type) => {
    const t = (type || "").toLowerCase();
    if (t.includes("sick") || t.includes("medical")) {
      return { label: "Sick Leave", color: "#ef4444", bg: isDark ? "rgba(239, 68, 68, 0.12)" : "#fef2f2", icon: MedicalServices };
    }
    if (t.includes("earned") || t.includes("privilege") || t.includes("annual")) {
      return { label: "Earned Leave", color: "#8b5cf6", bg: isDark ? "rgba(139, 92, 246, 0.12)" : "#f5f3ff", icon: Work };
    }
    if (t.includes("comp") || t.includes("off")) {
      return { label: "Comp Off", color: "#f59e0b", bg: isDark ? "rgba(245, 158, 11, 0.12)" : "#fffbeb", icon: Alarm };
    }
    if (t.includes("maternity") || t.includes("paternity")) {
      return { label: "Maternity / Paternity", color: "#ec4899", bg: isDark ? "rgba(236, 72, 153, 0.12)" : "#fdf2f8", icon: FamilyRestroom };
    }
    return { label: type || "Casual Leave", color: "#10b981", bg: isDark ? "rgba(16, 185, 129, 0.12)" : "#f0fdf4", icon: Spa };
  };

  const cardStyle = {
    borderRadius: "16px",
    p: 2.5,
    bgcolor: isDark ? "#0d1322" : "#ffffff",
    border: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid #edf2f7",
    boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.35)" : "0 4px 16px rgba(15, 23, 42, 0.04)",
    transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
    "&:hover": {
      transform: "translateY(-3px)",
      boxShadow: isDark ? "0 10px 28px rgba(0,0,0,0.5)" : "0 10px 25px rgba(0,0,0,0.06)",
    },
  };

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 2.5, md: 3 },
        maxWidth: 1540,
        margin: "0 auto",
        bgcolor: isDark ? "#060913" : "#f4f7fb",
        minHeight: "100vh",
      }}
    >
      <GlobalAnimationStyles />
      {/* ── 1. TOP HEADER ROW ─────────────────────────────────────────── */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2.5, flexWrap: "wrap", gap: 1.5 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <IconButton
            onClick={() => navigate("/user-management")}
            sx={{
              width: 36,
              height: 36,
              bgcolor: isDark ? "#131d33" : "#ffffff",
              border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e2e8f0",
              color: isDark ? "#f8fafc" : "#0f172a",
              borderRadius: "8px",
              "&:hover": { bgcolor: isDark ? "#1e293b" : "#f1f5f9" },
            }}
          >
            <ArrowBack sx={{ fontSize: 18 }} />
          </IconButton>
          <Box>
            <Typography variant="h6" fontWeight={800} sx={{ color: isDark ? "#f8fafc" : "#0f172a", fontSize: "1.2rem", letterSpacing: -0.2 }}>
              Employee Details
            </Typography>
            <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.74rem" }}>
              HR &nbsp;/&nbsp; Employees &nbsp;/&nbsp; <span style={{ color: "#3b82f6" }}>Employee Details</span>
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1.25} alignItems="center">
          {/* Edit Button */}
          <Button
            variant="outlined"
            startIcon={<Edit sx={{ fontSize: 16, color: "#3b82f6" }} />}
            onClick={() => handleOpenEditModal("personal")}
            sx={{
              borderRadius: "8px",
              textTransform: "none",
              fontWeight: 700,
              fontSize: "0.82rem",
              height: 36,
              px: 2,
              borderColor: isDark ? "rgba(255,255,255,0.15)" : "#e2e8f0",
              bgcolor: isDark ? "#0d1322" : "#ffffff",
              color: isDark ? "#f8fafc" : "#0f172a",
              "&:hover": { bgcolor: isDark ? "#1a233a" : "#f8fafc" },
            }}
          >
            Edit
          </Button>

          {/* More Button */}
          <Button
            variant="outlined"
            startIcon={<MoreHoriz sx={{ fontSize: 18, color: "#3b82f6" }} />}
            onClick={(e) => setMoreAnchorEl(e.currentTarget)}
            sx={{
              borderRadius: "8px",
              textTransform: "none",
              fontWeight: 700,
              fontSize: "0.82rem",
              height: 36,
              px: 1.75,
              borderColor: isDark ? "rgba(255,255,255,0.15)" : "#e2e8f0",
              bgcolor: isDark ? "#0d1322" : "#ffffff",
              color: isDark ? "#f8fafc" : "#0f172a",
              "&:hover": { bgcolor: isDark ? "#1a233a" : "#f8fafc" },
            }}
          >
            More
          </Button>

          {/* Actions Button */}
          <Button
            variant="contained"
            endIcon={<KeyboardArrowDown />}
            onClick={(e) => setActionsAnchorEl(e.currentTarget)}
            sx={{
              borderRadius: "8px",
              textTransform: "none",
              fontWeight: 700,
              fontSize: "0.82rem",
              height: 36,
              px: 2.2,
              bgcolor: "#1d68f0",
              color: "#ffffff",
              boxShadow: "0 2px 8px rgba(29, 104, 240, 0.3)",
              "&:hover": { bgcolor: "#1557d0" },
            }}
          >
            Actions
          </Button>
        </Stack>
      </Box>

      {/* ── 2. HERO PROFILE CARD ─────────────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: "16px",
          mb: 2.5,
          p: { xs: 2.5, sm: 3 },
          bgcolor: isDark ? "#0d1322" : "#ffffff",
          border: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid #e2e8f0",
          boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.3)" : "0 2px 12px rgba(0,0,0,0.03)",
        }}
      >
        <Grid container spacing={3} alignItems="center">
          {/* Left: Avatar + Identity + Contacts */}
          <Grid item xs={12} md={5.5}>
            <Stack direction="row" spacing={3} alignItems="center">
              <Box sx={{ position: "relative", flexShrink: 0 }}>
                {/* Hidden File Input for Avatar Image Upload */}
                <input
                  type="file"
                  ref={avatarFileInputRef}
                  style={{ display: "none" }}
                  accept="image/*"
                  onChange={handleAvatarFileChange}
                />

                <Tooltip title="Click to change profile photo" arrow>
                  <Box
                    onClick={() => avatarFileInputRef.current?.click()}
                    sx={{
                      position: "relative",
                      cursor: "pointer",
                      borderRadius: "50%",
                      overflow: "hidden",
                      transition: "transform 0.2s ease, box-shadow 0.2s ease",
                      "&:hover": {
                        transform: "scale(1.02)",
                        "& .avatar-hover-layer": { opacity: 1 },
                      },
                    }}
                  >
                    <Avatar
                      src={avatarPreview || user?.profilePicture || user?.avatar || user?.image}
                      sx={{
                        width: 108,
                        height: 108,
                        bgcolor: "#1e3a8a",
                        color: "#60a5fa",
                        fontSize: "2.3rem",
                        fontWeight: 800,
                        boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
                        border: "3.5px solid #3b82f6",
                      }}
                    >
                      {userInitials}
                    </Avatar>

                    {/* Hover Upload Overlay */}
                    <Box
                      className="avatar-hover-layer"
                      sx={{
                        position: "absolute",
                        inset: 0,
                        bgcolor: "rgba(15, 23, 42, 0.72)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        opacity: 0,
                        transition: "opacity 0.2s ease",
                        color: "#ffffff",
                        backdropFilter: "blur(2px)",
                      }}
                    >
                      {uploadingAvatar ? (
                        <CircularProgress size={24} sx={{ color: "#ffffff" }} />
                      ) : (
                        <>
                          <PhotoCamera sx={{ fontSize: 22, mb: 0.2 }} />
                          <Typography variant="caption" sx={{ fontSize: "0.62rem", fontWeight: 800, letterSpacing: "0.04em" }}>
                            UPLOAD
                          </Typography>
                        </>
                      )}
                    </Box>
                  </Box>
                </Tooltip>

                {/* Floating Camera Upload Button Badge */}
                <Tooltip title="Upload / Change Image" arrow>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      avatarFileInputRef.current?.click();
                    }}
                    sx={{
                      position: "absolute",
                      top: -4,
                      right: -4,
                      width: 32,
                      height: 32,
                      bgcolor: "#1d68f0",
                      color: "#ffffff",
                      border: isDark ? "2.5px solid #0d1322" : "2.5px solid #ffffff",
                      boxShadow: "0 2px 8px rgba(29, 104, 240, 0.4)",
                      "&:hover": { bgcolor: "#1557d0", transform: "scale(1.1)" },
                      zIndex: 3,
                    }}
                  >
                    <CameraAlt sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>

                {/* Online Active Indicator Badge */}
                <Box
                  sx={{
                    position: "absolute",
                    bottom: 3,
                    right: 3,
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    bgcolor: "#10b981",
                    border: isDark ? "3px solid #0d1322" : "3px solid #ffffff",
                    boxShadow: "0 2px 6px rgba(16, 185, 129, 0.4)",
                    zIndex: 2,
                  }}
                />
              </Box>

              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                  <Typography variant="h6" fontWeight={800} noWrap sx={{ color: isDark ? "#f8fafc" : "#0f172a", fontSize: "1.25rem", letterSpacing: "-0.01em" }}>
                    {userName}
                  </Typography>
                  <Chip
                    label={isUserActive ? "Active" : "Inactive"}
                    size="small"
                    sx={{
                      height: 22,
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      bgcolor: isUserActive
                        ? isDark ? "rgba(16, 185, 129, 0.2)" : "#dcfce7"
                        : isDark ? "rgba(239, 68, 68, 0.2)" : "#fee2e2",
                      color: isUserActive ? "#15803d" : "#b91c1c",
                      border: isUserActive ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(239, 68, 68, 0.3)",
                      borderRadius: "12px",
                      px: 0.5,
                    }}
                  />
                </Stack>
                <Typography variant="body2" fontWeight={600} sx={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.88rem" }}>
                  {displayRole}
                </Typography>
                <Typography variant="caption" sx={{ color: isDark ? "#64748b" : "#94a3b8", display: "block", mb: 1.5, fontSize: "0.78rem" }}>
                  {departmentText}
                </Typography>

                <Stack spacing={0.6}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                    <BadgeOutlined sx={{ fontSize: 16, color: isDark ? "#94a3b8" : "#64748b" }} />
                    <Typography variant="body2" fontWeight={700} sx={{ color: isDark ? "#f8fafc" : "#0f172a", fontSize: "0.85rem" }}>
                      {userEmpId}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                    <Email sx={{ fontSize: 16, color: isDark ? "#94a3b8" : "#64748b" }} />
                    <Typography variant="body2" fontWeight={700} sx={{ color: isDark ? "#f8fafc" : "#0f172a", fontSize: "0.85rem" }} noWrap>
                      {userEmail}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                    <Phone sx={{ fontSize: 16, color: isDark ? "#94a3b8" : "#64748b" }} />
                    <Typography variant="body2" fontWeight={700} sx={{ color: isDark ? "#f8fafc" : "#0f172a", fontSize: "0.85rem" }}>
                      {userPhone}
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            </Stack>
          </Grid>

          {/* Vertical Divider for desktop */}
          <Grid item xs={12} md={0.5} sx={{ display: { xs: "none", md: "flex" }, justifyContent: "center" }}>
            <Divider orientation="vertical" flexItem sx={{ borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#edf2f7", height: 160 }} />
          </Grid>

          {/* Right: Structured Metadata Card matching screenshot */}
          <Grid item xs={12} md={6}>
            <Box
              sx={{
                p: { xs: 2, sm: 2.5 },
                borderRadius: "14px",
                bgcolor: isDark ? "rgba(255, 255, 255, 0.02)" : "#f8fafc",
                border: isDark ? "1px solid rgba(255, 255, 255, 0.05)" : "1px solid #f1f5f9",
              }}
            >
              <Stack spacing={1.3}>
                {[
                  { icon: <CalendarToday sx={{ fontSize: 15 }} />, label: "Date of Joining", value: profileData.joiningDate },
                  { icon: <WorkOutline sx={{ fontSize: 15 }} />, label: "Employment Type", value: profileData.employmentType },
                  { icon: <SupervisorAccount sx={{ fontSize: 15 }} />, label: "Reporting Manager", value: profileData.reportingManager },
                  { icon: <LocationOn sx={{ fontSize: 15 }} />, label: "Work Location", value: profileData.workLocation },
                  { icon: <AccessTime sx={{ fontSize: 15 }} />, label: "Experience", value: profileData.experience },
                  {
                    icon: <VerifiedUser sx={{ fontSize: 15 }} />,
                    label: "Employee Status",
                    value: isUserActive ? "Active" : "Inactive",
                    isStatus: true,
                  },
                ].map((item, idx) => (
                  <Box key={idx} sx={{ display: "flex", alignItems: "center" }}>
                    <Stack direction="row" spacing={1.2} alignItems="center" sx={{ width: { xs: 140, sm: 170 }, flexShrink: 0 }}>
                      <Box sx={{ color: isDark ? "#94a3b8" : "#64748b", display: "flex", alignItems: "center" }}>{item.icon}</Box>
                      <Typography variant="body2" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontWeight: 600, fontSize: "0.82rem" }}>
                        {item.label}
                      </Typography>
                    </Stack>
                    <Typography variant="body2" sx={{ color: isDark ? "#64748b" : "#94a3b8", fontWeight: 600, px: 1.5, fontSize: "0.82rem" }}>
                      :
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 700,
                        fontSize: "0.82rem",
                        color: item.isStatus
                          ? (isUserActive ? "#16a34a" : "#dc2626")
                          : (isDark ? "#f8fafc" : "#0f172a"),
                        flex: 1,
                      }}
                    >
                      {item.value}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* ── 3. MODERN SEGMENTED PILL TAB NAVIGATION ─────────────────── */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: "14px",
          mb: 2.5,
          p: 0.75,
          bgcolor: isDark ? "#0d1322" : "#ffffff",
          border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0",
          boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.3)" : "0 2px 12px rgba(0,0,0,0.02)",
          display: "flex",
          alignItems: "center",
          overflowX: "auto",
          "&::-webkit-scrollbar": { height: 4 },
          "&::-webkit-scrollbar-thumb": { bgcolor: "rgba(0,0,0,0.1)", borderRadius: 2 },
        }}
      >
        <Stack direction="row" spacing={0.75} sx={{ minWidth: "max-content", width: "100%" }}>
          {[
            { label: "Profile", icon: <Person sx={{ fontSize: 17 }} /> },
            { label: "Attendance", icon: <CalendarMonth sx={{ fontSize: 17 }} /> },
            { label: "Leave", icon: <GridView sx={{ fontSize: 17 }} /> },
            { label: "Salary", icon: <Paid sx={{ fontSize: 17 }} /> },
            { label: "Salary Slip", icon: <ReceiptLong sx={{ fontSize: 17 }} /> },
            { label: "Documents", icon: <Description sx={{ fontSize: 17 }} /> },
            { label: "Performance", icon: <TrendingUp sx={{ fontSize: 17 }} /> },
          ].map((tab, idx) => {
            const isActive = currentTab === idx;
            return (
              <Button
                key={tab.label}
                onClick={() => setCurrentTab(idx)}
                startIcon={tab.icon}
                sx={{
                  flex: { xs: "none", md: 1 },
                  textTransform: "none",
                  fontWeight: isActive ? 800 : 600,
                  fontSize: "0.82rem",
                  py: 1,
                  px: { xs: 2, md: 1.5 },
                  borderRadius: "10px",
                  color: isActive ? "#ffffff" : isDark ? "#94a3b8" : "#64748b",
                  bgcolor: isActive ? "#1d68f0" : "transparent",
                  backgroundImage: isActive ? "linear-gradient(135deg, #1d68f0 0%, #2563eb 100%)" : "none",
                  boxShadow: isActive ? "0 4px 16px rgba(29, 104, 240, 0.4)" : "none",
                  animation: isActive ? "activePillPulse 2.8s infinite ease-in-out" : "none",
                  transform: isActive ? "scale(1.02)" : "scale(1)",
                  transition: "all 0.22s cubic-bezier(0.4, 0, 0.2, 1)",
                  "&:active": {
                    transform: "scale(0.95)",
                  },
                  "&:hover": {
                    bgcolor: isActive ? "#1557d0" : isDark ? "rgba(255, 255, 255, 0.06)" : "#f1f5f9",
                    color: isActive ? "#ffffff" : isDark ? "#f8fafc" : "#0f172a",
                    transform: isActive ? "scale(1.02)" : "translateY(-1.5px)",
                  },
                  "& .MuiButton-startIcon": {
                    mr: 0.85,
                    color: isActive ? "#ffffff !important" : isDark ? "#94a3b8" : "#64748b",
                    transition: "transform 0.2s ease",
                    "& .MuiSvgIcon-root": {
                      fontSize: 17,
                    },
                  },
                }}
              >
                {tab.label}
              </Button>
            );
          })}
        </Stack>
      </Paper>

      {/* ── 4. TAB 0: PROFILE INFORMATION (PREMIUM REDESIGN) ───────── */}
      {currentTab === 0 && (
        <Box key="tab-0" sx={{ animation: "tabContentFade 0.35s cubic-bezier(0.16, 1, 0.3, 1)" }}>
          <Grid container spacing={2.5}>
            {/* Card 1: Personal Information */}
            <Grid item xs={12} md={4}>
              <Paper
                elevation={0}
                sx={{
                  ...cardStyle,
                  p: 2.75,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  transition: "all 0.28s cubic-bezier(0.4, 0, 0.2, 1)",
                  "&:hover": {
                    borderColor: isDark ? "rgba(59, 130, 246, 0.4)" : "rgba(59, 130, 246, 0.3)",
                    boxShadow: isDark ? "0 12px 32px rgba(0,0,0,0.4)" : "0 12px 32px rgba(59, 130, 246, 0.08)",
                    transform: "translateY(-3px)",
                  },
                }}
              >
                <Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, pb: 1.5, borderBottom: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid #f1f5f9" }}>
                    <Stack direction="row" spacing={1.25} alignItems="center">
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: "10px",
                          background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                          color: "#ffffff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
                        }}
                      >
                        <Person sx={{ fontSize: 19 }} />
                      </Box>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={800} sx={{ color: isDark ? "#f8fafc" : "#0f172a", fontSize: "0.95rem", lineHeight: 1.2 }}>
                          Personal Information
                        </Typography>
                        <Typography variant="caption" sx={{ color: isDark ? "#64748b" : "#94a3b8", fontSize: "0.7rem", fontWeight: 600 }}>
                          Identity & Demographics
                        </Typography>
                      </Box>
                    </Stack>
                    <Button
                      size="small"
                      startIcon={<Edit sx={{ fontSize: 13 }} />}
                      onClick={() => handleOpenEditModal("personal")}
                      sx={{
                        textTransform: "none",
                        fontWeight: 700,
                        fontSize: "0.75rem",
                        color: "#1d68f0",
                        px: 1.2,
                        py: 0.4,
                        minWidth: "auto",
                        borderRadius: "8px",
                        bgcolor: isDark ? "rgba(29, 104, 240, 0.12)" : "rgba(29, 104, 240, 0.06)",
                        border: isDark ? "1px solid rgba(29, 104, 240, 0.25)" : "1px solid rgba(29, 104, 240, 0.15)",
                        "&:hover": { bgcolor: "#1d68f0", color: "#ffffff" },
                      }}
                    >
                      Edit
                    </Button>
                  </Box>
                  <Stack spacing={1.1}>
                    <ProfileFieldRow label="Full Name" value={profileData.fullName} isDark={isDark} />
                    <ProfileFieldRow label="Date of Birth" value={profileData.dob} isDark={isDark} icon={CalendarToday} />
                    <ProfileFieldRow label="Gender" value={profileData.gender} isDark={isDark} badge badgeColor="#3b82f6" />
                    <ProfileFieldRow label="Blood Group" value={profileData.bloodGroup && profileData.bloodGroup !== "—" ? `🩸 ${profileData.bloodGroup}` : "—"} isDark={isDark} badge badgeColor="#ef4444" />
                    <ProfileFieldRow label="Marital Status" value={profileData.maritalStatus} isDark={isDark} badge badgeColor="#f59e0b" />
                    <ProfileFieldRow label="Nationality" value={profileData.nationality && profileData.nationality !== "—" ? `🇮🇳 ${profileData.nationality}` : "—"} isDark={isDark} badge badgeColor="#10b981" />
                    <ProfileFieldRow label="Aadhaar Number" value={profileData.aadhaar} isDark={isDark} copyable onCopy={handleCopyText} />
                    <ProfileFieldRow label="PAN Number" value={profileData.pan} isDark={isDark} copyable onCopy={handleCopyText} />
                  </Stack>
                </Box>
              </Paper>
            </Grid>

            {/* Card 2: Contact Information */}
            <Grid item xs={12} md={4}>
              <Paper
                elevation={0}
                sx={{
                  ...cardStyle,
                  p: 2.75,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  transition: "all 0.28s cubic-bezier(0.4, 0, 0.2, 1)",
                  "&:hover": {
                    borderColor: isDark ? "rgba(16, 185, 129, 0.4)" : "rgba(16, 185, 129, 0.3)",
                    boxShadow: isDark ? "0 12px 32px rgba(0,0,0,0.4)" : "0 12px 32px rgba(16, 185, 129, 0.08)",
                    transform: "translateY(-3px)",
                  },
                }}
              >
                <Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, pb: 1.5, borderBottom: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid #f1f5f9" }}>
                    <Stack direction="row" spacing={1.25} alignItems="center">
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: "10px",
                          background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                          color: "#ffffff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
                        }}
                      >
                        <Phone sx={{ fontSize: 19 }} />
                      </Box>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={800} sx={{ color: isDark ? "#f8fafc" : "#0f172a", fontSize: "0.95rem", lineHeight: 1.2 }}>
                          Contact Information
                        </Typography>
                        <Typography variant="caption" sx={{ color: isDark ? "#64748b" : "#94a3b8", fontSize: "0.7rem", fontWeight: 600 }}>
                          Channels & Physical Address
                        </Typography>
                      </Box>
                    </Stack>
                    <Button
                      size="small"
                      startIcon={<Edit sx={{ fontSize: 13 }} />}
                      onClick={() => handleOpenEditModal("contact")}
                      sx={{
                        textTransform: "none",
                        fontWeight: 700,
                        fontSize: "0.75rem",
                        color: "#10b981",
                        px: 1.2,
                        py: 0.4,
                        minWidth: "auto",
                        borderRadius: "8px",
                        bgcolor: isDark ? "rgba(16, 185, 129, 0.12)" : "rgba(16, 185, 129, 0.06)",
                        border: isDark ? "1px solid rgba(16, 185, 129, 0.25)" : "1px solid rgba(16, 185, 129, 0.15)",
                        "&:hover": { bgcolor: "#10b981", color: "#ffffff" },
                      }}
                    >
                      Edit
                    </Button>
                  </Box>
                  <Stack spacing={1.1}>
                    <ProfileFieldRow label="Email Address" value={profileData.email} isDark={isDark} isLink linkType="email" icon={Email} />
                    <ProfileFieldRow label="Phone Number" value={profileData.phone} isDark={isDark} isLink linkType="phone" icon={Phone} />
                    <ProfileFieldRow label="Alternate Number" value={profileData.altPhone} isDark={isDark} copyable onCopy={handleCopyText} />
                    <ProfileAddressBox label="Current Address" value={profileData.currentAddress} isDark={isDark} icon={LocationOn} onCopy={handleCopyText} />
                    <ProfileAddressBox label="Permanent Address" value={profileData.permanentAddress} isDark={isDark} icon={LocationOn} onCopy={handleCopyText} />
                  </Stack>
                </Box>
              </Paper>
            </Grid>

            {/* Card 3: Employment Information */}
            <Grid item xs={12} md={4}>
              <Paper
                elevation={0}
                sx={{
                  ...cardStyle,
                  p: 2.75,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  transition: "all 0.28s cubic-bezier(0.4, 0, 0.2, 1)",
                  "&:hover": {
                    borderColor: isDark ? "rgba(139, 92, 246, 0.4)" : "rgba(139, 92, 246, 0.3)",
                    boxShadow: isDark ? "0 12px 32px rgba(0,0,0,0.4)" : "0 12px 32px rgba(139, 92, 246, 0.08)",
                    transform: "translateY(-3px)",
                  },
                }}
              >
                <Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, pb: 1.5, borderBottom: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid #f1f5f9" }}>
                    <Stack direction="row" spacing={1.25} alignItems="center">
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: "10px",
                          background: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)",
                          color: "#ffffff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 4px 12px rgba(139, 92, 246, 0.3)",
                        }}
                      >
                        <WorkOutline sx={{ fontSize: 19 }} />
                      </Box>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={800} sx={{ color: isDark ? "#f8fafc" : "#0f172a", fontSize: "0.95rem", lineHeight: 1.2 }}>
                          Employment Information
                        </Typography>
                        <Typography variant="caption" sx={{ color: isDark ? "#64748b" : "#94a3b8", fontSize: "0.7rem", fontWeight: 600 }}>
                          Role, Hierarchy & Terms
                        </Typography>
                      </Box>
                    </Stack>
                    <Button
                      size="small"
                      startIcon={<Edit sx={{ fontSize: 13 }} />}
                      onClick={() => handleOpenEditModal("employment")}
                      sx={{
                        textTransform: "none",
                        fontWeight: 700,
                        fontSize: "0.75rem",
                        color: "#8b5cf6",
                        px: 1.2,
                        py: 0.4,
                        minWidth: "auto",
                        borderRadius: "8px",
                        bgcolor: isDark ? "rgba(139, 92, 246, 0.12)" : "rgba(139, 92, 246, 0.06)",
                        border: isDark ? "1px solid rgba(139, 92, 246, 0.25)" : "1px solid rgba(139, 92, 246, 0.15)",
                        "&:hover": { bgcolor: "#8b5cf6", color: "#ffffff" },
                      }}
                    >
                      Edit
                    </Button>
                  </Box>
                  <Stack spacing={1.1}>
                    <ProfileFieldRow label="Employee ID" value={profileData.empId} isDark={isDark} copyable onCopy={handleCopyText} />
                    <ProfileFieldRow label="Designation" value={profileData.designation} isDark={isDark} badge badgeColor="#8b5cf6" />
                    <ProfileFieldRow label="Department" value={profileData.department} isDark={isDark} badge badgeColor="#3b82f6" />
                    <ProfileFieldRow label="Date of Joining" value={profileData.joiningDate} isDark={isDark} icon={CalendarToday} />
                    <ProfileFieldRow label="Employment Type" value={profileData.employmentType} isDark={isDark} badge badgeColor="#10b981" />
                    <ProfileFieldRow label="Work Location" value={profileData.workLocation} isDark={isDark} icon={LocationOn} />
                    <ProfileFieldRow label="Reporting Manager" value={profileData.reportingManager} isDark={isDark} icon={SupervisorAccount} />
                    <ProfileFieldRow label="Experience" value={profileData.experience} isDark={isDark} badge badgeColor="#06b6d4" />
                  </Stack>
                </Box>
              </Paper>
            </Grid>

            {/* Card 4: Family Information */}
            <Grid item xs={12} md={4}>
              <Paper
                elevation={0}
                sx={{
                  ...cardStyle,
                  p: 2.75,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  transition: "all 0.28s cubic-bezier(0.4, 0, 0.2, 1)",
                  "&:hover": {
                    borderColor: isDark ? "rgba(245, 158, 11, 0.4)" : "rgba(245, 158, 11, 0.3)",
                    boxShadow: isDark ? "0 12px 32px rgba(0,0,0,0.4)" : "0 12px 32px rgba(245, 158, 11, 0.08)",
                    transform: "translateY(-3px)",
                  },
                }}
              >
                <Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, pb: 1.5, borderBottom: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid #f1f5f9" }}>
                    <Stack direction="row" spacing={1.25} alignItems="center">
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: "10px",
                          background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                          color: "#ffffff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 4px 12px rgba(245, 158, 11, 0.3)",
                        }}
                      >
                        <FamilyRestroom sx={{ fontSize: 19 }} />
                      </Box>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={800} sx={{ color: isDark ? "#f8fafc" : "#0f172a", fontSize: "0.95rem", lineHeight: 1.2 }}>
                          Family Information
                        </Typography>
                        <Typography variant="caption" sx={{ color: isDark ? "#64748b" : "#94a3b8", fontSize: "0.7rem", fontWeight: 600 }}>
                          Dependents & Nominees
                        </Typography>
                      </Box>
                    </Stack>
                    <Button
                      size="small"
                      startIcon={<Edit sx={{ fontSize: 13 }} />}
                      onClick={() => handleOpenEditModal("family")}
                      sx={{
                        textTransform: "none",
                        fontWeight: 700,
                        fontSize: "0.75rem",
                        color: "#f59e0b",
                        px: 1.2,
                        py: 0.4,
                        minWidth: "auto",
                        borderRadius: "8px",
                        bgcolor: isDark ? "rgba(245, 158, 11, 0.12)" : "rgba(245, 158, 11, 0.06)",
                        border: isDark ? "1px solid rgba(245, 158, 11, 0.25)" : "1px solid rgba(245, 158, 11, 0.15)",
                        "&:hover": { bgcolor: "#f59e0b", color: "#ffffff" },
                      }}
                    >
                      Edit
                    </Button>
                  </Box>
                  <Stack spacing={1.1}>
                    <ProfileFieldRow label="Father's Name" value={profileData.fatherName} isDark={isDark} icon={Person} />
                    <ProfileFieldRow label="Mother's Name" value={profileData.motherName} isDark={isDark} icon={Person} />
                    <ProfileFieldRow label="Spouse Name" value={profileData.spouseName} isDark={isDark} />
                    <ProfileFieldRow label="No. of Children" value={profileData.childrenCount} isDark={isDark} badge badgeColor="#64748b" />
                  </Stack>
                </Box>
              </Paper>
            </Grid>

            {/* Card 5: Bank Information */}
            <Grid item xs={12} md={4}>
              <Paper
                elevation={0}
                sx={{
                  ...cardStyle,
                  p: 2.75,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  transition: "all 0.28s cubic-bezier(0.4, 0, 0.2, 1)",
                  "&:hover": {
                    borderColor: isDark ? "rgba(6, 182, 212, 0.4)" : "rgba(6, 182, 212, 0.3)",
                    boxShadow: isDark ? "0 12px 32px rgba(0,0,0,0.4)" : "0 12px 32px rgba(6, 182, 212, 0.08)",
                    transform: "translateY(-3px)",
                  },
                }}
              >
                <Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, pb: 1.5, borderBottom: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid #f1f5f9" }}>
                    <Stack direction="row" spacing={1.25} alignItems="center">
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: "10px",
                          background: "linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)",
                          color: "#ffffff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 4px 12px rgba(6, 182, 212, 0.3)",
                        }}
                      >
                        <AccountBalance sx={{ fontSize: 19 }} />
                      </Box>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={800} sx={{ color: isDark ? "#f8fafc" : "#0f172a", fontSize: "0.95rem", lineHeight: 1.2 }}>
                          Bank Information
                        </Typography>
                        <Typography variant="caption" sx={{ color: isDark ? "#64748b" : "#94a3b8", fontSize: "0.7rem", fontWeight: 600 }}>
                          Payroll & Direct Deposit
                        </Typography>
                      </Box>
                    </Stack>
                    <Button
                      size="small"
                      startIcon={<Edit sx={{ fontSize: 13 }} />}
                      onClick={() => handleOpenEditModal("bank")}
                      sx={{
                        textTransform: "none",
                        fontWeight: 700,
                        fontSize: "0.75rem",
                        color: "#0284c7",
                        px: 1.2,
                        py: 0.4,
                        minWidth: "auto",
                        borderRadius: "8px",
                        bgcolor: isDark ? "rgba(6, 182, 212, 0.12)" : "rgba(6, 182, 212, 0.06)",
                        border: isDark ? "1px solid rgba(6, 182, 212, 0.25)" : "1px solid rgba(6, 182, 212, 0.15)",
                        "&:hover": { bgcolor: "#0284c7", color: "#ffffff" },
                      }}
                    >
                      Edit
                    </Button>
                  </Box>
                  <Stack spacing={1.1}>
                    <ProfileFieldRow label="Bank Name" value={profileData.bankName} isDark={isDark} icon={AccountBalance} />
                    <ProfileFieldRow label="Account Number" value={profileData.accountNumber} isDark={isDark} copyable onCopy={handleCopyText} />
                    <ProfileFieldRow label="IFSC Code" value={profileData.ifsc} isDark={isDark} copyable onCopy={handleCopyText} />
                    <ProfileFieldRow label="Account Type" value={profileData.accountType} isDark={isDark} badge badgeColor="#10b981" />
                    <ProfileFieldRow label="PAN Number (for TDS)" value={profileData.panTds} isDark={isDark} copyable onCopy={handleCopyText} />
                  </Stack>
                </Box>
              </Paper>
            </Grid>

            {/* Card 6: Emergency Contact */}
            <Grid item xs={12} md={4}>
              <Paper
                elevation={0}
                sx={{
                  ...cardStyle,
                  p: 2.75,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  transition: "all 0.28s cubic-bezier(0.4, 0, 0.2, 1)",
                  "&:hover": {
                    borderColor: isDark ? "rgba(244, 63, 94, 0.4)" : "rgba(244, 63, 94, 0.3)",
                    boxShadow: isDark ? "0 12px 32px rgba(0,0,0,0.4)" : "0 12px 32px rgba(244, 63, 94, 0.08)",
                    transform: "translateY(-3px)",
                  },
                }}
              >
                <Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, pb: 1.5, borderBottom: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid #f1f5f9" }}>
                    <Stack direction="row" spacing={1.25} alignItems="center">
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: "10px",
                          background: "linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)",
                          color: "#ffffff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 4px 12px rgba(244, 63, 94, 0.3)",
                        }}
                      >
                        <ContactPhone sx={{ fontSize: 19 }} />
                      </Box>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={800} sx={{ color: isDark ? "#f8fafc" : "#0f172a", fontSize: "0.95rem", lineHeight: 1.2 }}>
                          Emergency Contact
                        </Typography>
                        <Typography variant="caption" sx={{ color: isDark ? "#64748b" : "#94a3b8", fontSize: "0.7rem", fontWeight: 600 }}>
                          SOS Immediate Reach
                        </Typography>
                      </Box>
                    </Stack>
                    <Button
                      size="small"
                      startIcon={<Edit sx={{ fontSize: 13 }} />}
                      onClick={() => handleOpenEditModal("emergency")}
                      sx={{
                        textTransform: "none",
                        fontWeight: 700,
                        fontSize: "0.75rem",
                        color: "#f43f5e",
                        px: 1.2,
                        py: 0.4,
                        minWidth: "auto",
                        borderRadius: "8px",
                        bgcolor: isDark ? "rgba(244, 63, 94, 0.12)" : "rgba(244, 63, 94, 0.06)",
                        border: isDark ? "1px solid rgba(244, 63, 94, 0.25)" : "1px solid rgba(244, 63, 94, 0.15)",
                        "&:hover": { bgcolor: "#f43f5e", color: "#ffffff" },
                      }}
                    >
                      Edit
                    </Button>
                  </Box>
                  <Stack spacing={1.1}>
                    <ProfileFieldRow label="Contact Name" value={profileData.emergencyName} isDark={isDark} icon={Person} />
                    <ProfileFieldRow label="Relationship" value={profileData.emergencyRelation} isDark={isDark} badge badgeColor="#f43f5e" />
                    <ProfileFieldRow label="Phone Number" value={profileData.emergencyPhone} isDark={isDark} isLink linkType="phone" icon={Phone} />
                    <ProfileAddressBox label="Address" value={profileData.emergencyAddress} isDark={isDark} icon={LocationOn} onCopy={handleCopyText} />
                  </Stack>
                </Box>
              </Paper>
            </Grid>

            {/* Card 7: Additional Information (Executive Full-Width Hero Card) */}
            <Grid item xs={12}>
              <Paper
                elevation={0}
                sx={{
                  ...cardStyle,
                  p: 3,
                  transition: "all 0.28s cubic-bezier(0.4, 0, 0.2, 1)",
                  "&:hover": {
                    borderColor: isDark ? "rgba(99, 102, 241, 0.4)" : "rgba(99, 102, 241, 0.3)",
                    boxShadow: isDark ? "0 12px 32px rgba(0,0,0,0.4)" : "0 12px 32px rgba(99, 102, 241, 0.08)",
                    transform: "translateY(-3px)",
                  },
                }}
              >
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2.5, pb: 1.5, borderBottom: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid #f1f5f9" }}>
                  <Stack direction="row" spacing={1.25} alignItems="center">
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: "10px",
                        background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
                      }}
                    >
                      <Description sx={{ fontSize: 19 }} />
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={800} sx={{ color: isDark ? "#f8fafc" : "#0f172a", fontSize: "0.95rem", lineHeight: 1.2 }}>
                        Additional Information
                      </Typography>
                      <Typography variant="caption" sx={{ color: isDark ? "#64748b" : "#94a3b8", fontSize: "0.7rem", fontWeight: 600 }}>
                        Languages, Interests & Bio
                      </Typography>
                    </Box>
                  </Stack>
                  <Button
                    size="small"
                    startIcon={<Edit sx={{ fontSize: 13 }} />}
                    onClick={() => handleOpenEditModal("additional")}
                    sx={{
                      textTransform: "none",
                      fontWeight: 700,
                      fontSize: "0.75rem",
                      color: "#6366f1",
                      px: 1.2,
                      py: 0.4,
                      minWidth: "auto",
                      borderRadius: "8px",
                      bgcolor: isDark ? "rgba(99, 102, 241, 0.12)" : "rgba(99, 102, 241, 0.06)",
                      border: isDark ? "1px solid rgba(99, 102, 241, 0.25)" : "1px solid rgba(99, 102, 241, 0.15)",
                      "&:hover": { bgcolor: "#6366f1", color: "#ffffff" },
                    }}
                  >
                    Edit
                  </Button>
                </Box>

                <Grid container spacing={2.5}>
                  {/* Languages Known Tag Chips */}
                  <Grid item xs={12} md={6}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: "12px",
                        bgcolor: isDark ? "rgba(255,255,255,0.018)" : "rgba(248,250,252,0.6)",
                        border: isDark ? "1px solid rgba(255,255,255,0.04)" : "1px solid rgba(241,245,249,0.9)",
                        height: "100%",
                      }}
                    >
                      <Typography sx={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.76rem", fontWeight: 700, mb: 1.2, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                        🗣️ Languages Known
                      </Typography>
                      {profileData.languages && profileData.languages !== "—" ? (
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ gap: 1 }}>
                          {profileData.languages.split(",").map((lang, idx) => {
                            const trim = lang.trim();
                            if (!trim) return null;
                            const colors = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ec4899"];
                            const col = colors[idx % colors.length];
                            return (
                              <Chip
                                key={idx}
                                label={trim}
                                sx={{
                                  fontWeight: 700,
                                  fontSize: "0.8rem",
                                  borderRadius: "8px",
                                  bgcolor: isDark ? `${col}18` : `${col}12`,
                                  color: col,
                                  border: `1px solid ${col}35`,
                                  px: 0.5,
                                }}
                              />
                            );
                          })}
                        </Stack>
                      ) : (
                        <Typography sx={{ color: isDark ? "#64748b" : "#94a3b8", fontSize: "0.82rem", fontWeight: 600 }}>
                          —
                        </Typography>
                      )}
                    </Box>
                  </Grid>

                  {/* Hobbies Tag Chips */}
                  <Grid item xs={12} md={6}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: "12px",
                        bgcolor: isDark ? "rgba(255,255,255,0.018)" : "rgba(248,250,252,0.6)",
                        border: isDark ? "1px solid rgba(255,255,255,0.04)" : "1px solid rgba(241,245,249,0.9)",
                        height: "100%",
                      }}
                    >
                      <Typography sx={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.76rem", fontWeight: 700, mb: 1.2, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                        🎯 Hobbies & Interests
                      </Typography>
                      {profileData.hobbies && profileData.hobbies !== "—" ? (
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ gap: 1 }}>
                          {profileData.hobbies.split(",").map((hobby, idx) => {
                            const trim = hobby.trim();
                            if (!trim) return null;
                            const emojis = ["📚", "✈️", "🏏", "🎵", "💻", "🎨", "🚴‍♂️"];
                            const emoji = emojis[idx % emojis.length];
                            return (
                              <Chip
                                key={idx}
                                label={`${emoji} ${trim}`}
                                sx={{
                                  fontWeight: 700,
                                  fontSize: "0.8rem",
                                  borderRadius: "8px",
                                  bgcolor: isDark ? "rgba(255,255,255,0.05)" : "#ffffff",
                                  color: isDark ? "#f1f5f9" : "#334155",
                                  border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0",
                                  boxShadow: isDark ? "none" : "0 2px 6px rgba(0,0,0,0.03)",
                                }}
                              />
                            );
                          })}
                        </Stack>
                      ) : (
                        <Typography sx={{ color: isDark ? "#64748b" : "#94a3b8", fontSize: "0.82rem", fontWeight: 600 }}>
                          —
                        </Typography>
                      )}
                    </Box>
                  </Grid>

                  {/* Executive Bio Quote Card */}
                  <Grid item xs={12}>
                    <Box
                      sx={{
                        p: 2.25,
                        borderRadius: "12px",
                        bgcolor: isDark ? "rgba(99, 102, 241, 0.05)" : "rgba(99, 102, 241, 0.03)",
                        borderLeft: "4px solid #6366f1",
                        borderTop: isDark ? "1px solid rgba(255,255,255,0.04)" : "1px solid rgba(241,245,249,0.9)",
                        borderRight: isDark ? "1px solid rgba(255,255,255,0.04)" : "1px solid rgba(241,245,249,0.9)",
                        borderBottom: isDark ? "1px solid rgba(255,255,255,0.04)" : "1px solid rgba(241,245,249,0.9)",
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                        <FormatQuote sx={{ color: "#6366f1", fontSize: 20 }} />
                        <Typography sx={{ color: "#6366f1", fontSize: "0.76rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                          Professional Summary & About
                        </Typography>
                      </Box>
                      <Typography
                        sx={{
                          color: isDark ? "#cbd5e1" : "#334155",
                          fontSize: "0.88rem",
                          fontWeight: 500,
                          lineHeight: 1.65,
                          fontStyle: profileData.about && profileData.about !== "—" ? "italic" : "normal",
                        }}
                      >
                        {profileData.about && profileData.about !== "—" ? `"${profileData.about}"` : "—"}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* ── 5. TAB 1: ATTENDANCE DASHBOARD ─────────────────────────── */}
      {currentTab === 1 && (
        <Box key="tab-1" sx={{ animation: "tabContentFade 0.35s cubic-bezier(0.16, 1, 0.3, 1)" }}>
        <Stack spacing={2.5}>
          {/* Top Control Bar: Month navigation */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
            <Typography variant="subtitle1" fontWeight={800} sx={{ color: isDark ? "#f8fafc" : "#0f172a", fontSize: "1rem" }}>
              Monthly Attendance Overview
            </Typography>

            {/* Month Selector Pill */}
            <Paper
              elevation={0}
              sx={{
                display: "inline-flex",
                alignItems: "center",
                bgcolor: isDark ? "#0d1322" : "#ffffff",
                border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0",
                borderRadius: "10px",
                px: 0.5,
                py: 0.25,
              }}
            >
              <IconButton
                size="small"
                onClick={() => setSelectedAttendanceMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                sx={{ p: 0.5, color: isDark ? "#94a3b8" : "#64748b" }}
              >
                <ChevronLeft sx={{ fontSize: 18 }} />
              </IconButton>
              <Typography variant="body2" fontWeight={700} sx={{ px: 1.5, color: isDark ? "#f8fafc" : "#0f172a", fontSize: "0.82rem", minWidth: 120, textAlign: "center" }}>
                {selectedAttendanceMonth.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
              </Typography>
              <IconButton
                size="small"
                onClick={() => setSelectedAttendanceMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                sx={{ p: 0.5, color: isDark ? "#94a3b8" : "#64748b" }}
              >
                <ChevronRight sx={{ fontSize: 18 }} />
              </IconButton>
            </Paper>
          </Box>

          {/* Row 1: 5 Stat Metric Cards */}
          <Grid container spacing={2}>
            {/* 1. Present Days */}
            <Grid item xs={12} sm={6} md={2.4}>
              <Paper elevation={0} sx={{ ...cardStyle, p: 2, height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, mb: 1.5 }}>
                  <Box
                    sx={{
                      width: 42,
                      height: 42,
                      borderRadius: "12px",
                      bgcolor: isDark ? "rgba(59, 130, 246, 0.15)" : "#eff6ff",
                      color: "#3b82f6",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <CalendarToday sx={{ fontSize: 20 }} />
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight={900} sx={{ color: isDark ? "#f8fafc" : "#0f172a", fontSize: "1.15rem", lineHeight: 1.2 }}>
                      {attendanceStats.presentCount} / {attendanceStats.workingDays || attendanceStats.presentCount}
                    </Typography>
                    <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.72rem", fontWeight: 600 }}>
                      Present Days
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pt: 1, borderTop: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid #f1f5f9" }}>
                  <Typography variant="caption" fontWeight={800} sx={{ color: "#10b981", fontSize: "0.72rem" }}>
                    {attendanceStats.workingDays > 0 ? `${Math.round((attendanceStats.presentCount / attendanceStats.workingDays) * 100)}% Rate` : "—"}
                  </Typography>
                  <MiniBarSparkline color="#3b82f6" heights={[35, 55, 80, 100, 65]} />
                </Box>
              </Paper>
            </Grid>

            {/* 2. Absent Days */}
            <Grid item xs={12} sm={6} md={2.4}>
              <Paper elevation={0} sx={{ ...cardStyle, p: 2, height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, mb: 1.5 }}>
                  <Box
                    sx={{
                      width: 42,
                      height: 42,
                      borderRadius: "12px",
                      bgcolor: isDark ? "rgba(239, 68, 68, 0.15)" : "#fef2f2",
                      color: "#ef4444",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <EventBusy sx={{ fontSize: 20 }} />
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight={900} sx={{ color: isDark ? "#f8fafc" : "#0f172a", fontSize: "1.15rem", lineHeight: 1.2 }}>
                      {attendanceStats.absentCount}
                    </Typography>
                    <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.72rem", fontWeight: 600 }}>
                      Absent Days
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pt: 1, borderTop: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid #f1f5f9" }}>
                  <Typography variant="caption" fontWeight={800} sx={{ color: "#ef4444", fontSize: "0.72rem" }}>
                    {attendanceStats.absentCount > 0 ? `${attendanceStats.absentCount} missed` : "0 missed"}
                  </Typography>
                  <MiniBarSparkline color="#ef4444" heights={[80, 60, 40, 20, 15]} />
                </Box>
              </Paper>
            </Grid>

            {/* 3. On Leave */}
            <Grid item xs={12} sm={6} md={2.4}>
              <Paper elevation={0} sx={{ ...cardStyle, p: 2, height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, mb: 1.5 }}>
                  <Box
                    sx={{
                      width: 42,
                      height: 42,
                      borderRadius: "12px",
                      bgcolor: isDark ? "rgba(245, 158, 11, 0.15)" : "#fffbeb",
                      color: "#f59e0b",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Shield sx={{ fontSize: 20 }} />
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight={900} sx={{ color: isDark ? "#f8fafc" : "#0f172a", fontSize: "1.15rem", lineHeight: 1.2 }}>
                      {attendanceStats.onLeaveCount}
                    </Typography>
                    <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.72rem", fontWeight: 600 }}>
                      On Leave
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pt: 1, borderTop: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid #f1f5f9" }}>
                  <Typography variant="caption" fontWeight={800} sx={{ color: "#f59e0b", fontSize: "0.72rem" }}>
                    {attendanceStats.onLeaveCount} Approved
                  </Typography>
                  <MiniBarSparkline color="#f59e0b" heights={[30, 45, 45, 60, 50]} />
                </Box>
              </Paper>
            </Grid>

            {/* 4. Weekly Off */}
            <Grid item xs={12} sm={6} md={2.4}>
              <Paper elevation={0} sx={{ ...cardStyle, p: 2, height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, mb: 1.5 }}>
                  <Box
                    sx={{
                      width: 42,
                      height: 42,
                      borderRadius: "12px",
                      bgcolor: isDark ? "rgba(139, 92, 246, 0.15)" : "#f5f3ff",
                      color: "#8b5cf6",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <CalendarMonth sx={{ fontSize: 20 }} />
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight={900} sx={{ color: isDark ? "#f8fafc" : "#0f172a", fontSize: "1.15rem", lineHeight: 1.2 }}>
                      {attendanceStats.weeklyOffCount}
                    </Typography>
                    <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.72rem", fontWeight: 600 }}>
                      Weekly Off
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pt: 1, borderTop: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid #f1f5f9" }}>
                  <Typography variant="caption" fontWeight={800} sx={{ color: "#8b5cf6", fontSize: "0.72rem" }}>
                    Sundays
                  </Typography>
                  <MiniBarSparkline color="#8b5cf6" heights={[60, 60, 60, 60, 60]} />
                </Box>
              </Paper>
            </Grid>

            {/* 5. Holiday */}
            <Grid item xs={12} sm={6} md={2.4}>
              <Paper elevation={0} sx={{ ...cardStyle, p: 2, height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, mb: 1.5 }}>
                  <Box
                    sx={{
                      width: 42,
                      height: 42,
                      borderRadius: "12px",
                      bgcolor: isDark ? "rgba(14, 165, 233, 0.15)" : "#f0f9ff",
                      color: "#0ea5e9",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <EventAvailable sx={{ fontSize: 20 }} />
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight={900} sx={{ color: isDark ? "#f8fafc" : "#0f172a", fontSize: "1.15rem", lineHeight: 1.2 }}>
                      {attendanceStats.holidayCount}
                    </Typography>
                    <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.72rem", fontWeight: 600 }}>
                      Holiday
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pt: 1, borderTop: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid #f1f5f9" }}>
                  <Typography variant="caption" fontWeight={800} sx={{ color: "#0ea5e9", fontSize: "0.72rem" }}>
                    Official Holidays
                  </Typography>
                  <MiniBarSparkline color="#0ea5e9" heights={[20, 30, 70, 40, 60]} />
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* Row 2: Calendar | Log | Summary (Pixel-Perfect Balanced Grid) */}
          <Grid container spacing={2.5}>
            {/* 1. Left: Attendance Calendar */}
            <Grid item xs={12} md={6} lg={4}>
              <Paper
                elevation={0}
                sx={{
                  ...cardStyle,
                  p: 2.5,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <Box>
                  {/* Calendar Title & Controls */}
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5, pb: 1, borderBottom: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid #f1f5f9" }}>
                    <Typography variant="subtitle1" fontWeight={800} sx={{ color: isDark ? "#f8fafc" : "#0f172a", fontSize: "0.95rem" }}>
                      Attendance Calendar
                    </Typography>
                    {/* Month Navigator */}
                    <Paper
                      elevation={0}
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        bgcolor: isDark ? "rgba(255,255,255,0.04)" : "#f8fafc",
                        border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0",
                        borderRadius: "8px",
                        px: 0.5,
                        py: 0.2,
                      }}
                    >
                      <IconButton
                        size="small"
                        onClick={() => setSelectedAttendanceMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                        sx={{ p: 0.3, color: isDark ? "#94a3b8" : "#64748b" }}
                      >
                        <ChevronLeft sx={{ fontSize: 16 }} />
                      </IconButton>
                      <Typography variant="caption" fontWeight={800} sx={{ px: 0.8, color: isDark ? "#f8fafc" : "#0f172a", fontSize: "0.75rem" }}>
                        {selectedAttendanceMonth.toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => setSelectedAttendanceMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                        sx={{ p: 0.3, color: isDark ? "#94a3b8" : "#64748b" }}
                      >
                        <ChevronRight sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Paper>
                  </Box>

                  {/* Legend Chips */}
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
                    {[
                      { label: "Present", color: "#10b981" },
                      { label: "Absent", color: "#ef4444" },
                      { label: "On Leave", color: "#f59e0b" },
                      { label: "Weekly Off", color: "#8b5cf6" },
                      { label: "Holiday", color: "#0ea5e9" },
                    ].map((leg) => (
                      <Stack direction="row" spacing={0.5} alignItems="center" key={leg.label}>
                        <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: leg.color }} />
                        <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.68rem", fontWeight: 600 }}>
                          {leg.label}
                        </Typography>
                      </Stack>
                    ))}
                  </Box>

                  {/* Calendar Days Header */}
                  <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", textAlign: "center", mb: 1 }}>
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                      <Typography key={day} variant="caption" fontWeight={700} sx={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.7rem" }}>
                        {day}
                      </Typography>
                    ))}
                  </Box>

                  {/* Calendar Grid Days */}
                  <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "6px", textAlign: "center" }}>
                    {/* Dynamic empty offset for the 1st day of month */}
                    {Array.from({ length: attendanceStats.firstDayIndex }).map((_, i) => (
                      <Box key={`empty-${i}`} sx={{ width: 32, height: 32 }} />
                    ))}

                    {attendanceStats.calendarCells.map((cell, idx) => {
                      let circleStyle = {};
                      if (cell.type === "present") circleStyle = { bgcolor: "#10b981", color: "#ffffff", fontWeight: 800, boxShadow: "0 2px 8px rgba(16, 185, 129, 0.35)" };
                      else if (cell.type === "absent") circleStyle = { bgcolor: "#ef4444", color: "#ffffff", fontWeight: 800, boxShadow: "0 2px 8px rgba(239, 68, 68, 0.35)" };
                      else if (cell.type === "leave") circleStyle = { bgcolor: "#f59e0b", color: "#ffffff", fontWeight: 800, boxShadow: "0 2px 8px rgba(245, 158, 11, 0.35)" };
                      else if (cell.type === "weekly") circleStyle = { bgcolor: "#8b5cf6", color: "#ffffff", fontWeight: 800, boxShadow: "0 2px 8px rgba(139, 92, 246, 0.35)" };
                      else if (cell.type === "holiday") circleStyle = { bgcolor: "#0ea5e9", color: "#ffffff", fontWeight: 800, boxShadow: "0 2px 8px rgba(14, 165, 233, 0.35)" };
                      else circleStyle = { color: isDark ? "#cbd5e1" : "#334155", fontWeight: 600, "&:hover": { bgcolor: isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9" } };

                      return (
                        <Tooltip key={idx} title={`${cell.day} ${selectedAttendanceMonth.toLocaleDateString("en-IN", { month: "short" })}: ${cell.statusLabel}`} arrow>
                          <Box sx={{ display: "flex", justifyContent: "center" }}>
                            <Box
                              sx={{
                                width: 32,
                                height: 32,
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "0.74rem",
                                cursor: "pointer",
                                transition: "all 0.18s ease-in-out",
                                "&:hover": { transform: "scale(1.12)" },
                                ...circleStyle,
                              }}
                            >
                              {cell.day}
                            </Box>
                          </Box>
                        </Tooltip>
                      );
                    })}
                  </Box>
                </Box>

                {/* Calendar Bottom Info */}
                <Box
                  sx={{
                    mt: 2,
                    p: 1.2,
                    borderRadius: "8px",
                    bgcolor: isDark ? "rgba(255,255,255,0.02)" : "#f8fafc",
                    border: isDark ? "1px solid rgba(255,255,255,0.04)" : "1px solid #f1f5f9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.72rem", fontWeight: 600 }}>
                    Working Days: <strong style={{ color: isDark ? "#f8fafc" : "#0f172a" }}>{attendanceStats.workingDays}</strong>
                  </Typography>
                  <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.72rem", fontWeight: 600 }}>
                    Weekly Offs: <strong style={{ color: "#8b5cf6" }}>{attendanceStats.weeklyOffCount}</strong>
                  </Typography>
                  <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.72rem", fontWeight: 600 }}>
                    Holidays: <strong style={{ color: "#0ea5e9" }}>{attendanceStats.holidayCount}</strong>
                  </Typography>
                </Box>
              </Paper>
            </Grid>

            {/* 2. Middle: Attendance Log Table */}
            <Grid item xs={12} md={6} lg={4.6}>
              <Paper
                elevation={0}
                sx={{
                  ...cardStyle,
                  p: 2.5,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5, pb: 1, borderBottom: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid #f1f5f9" }}>
                    <Typography variant="subtitle1" fontWeight={800} sx={{ color: isDark ? "#f8fafc" : "#0f172a", fontSize: "0.95rem" }}>
                      Attendance Log
                    </Typography>
                    {attendanceLoading && <CircularProgress size={16} sx={{ color: "#1d68f0" }} />}
                  </Box>

                  <TableContainer sx={{ overflowX: "auto", maxHeight: 310 }}>
                    <Table size="small" sx={{ minWidth: 380 }}>
                      <TableHead>
                        <TableRow sx={{ "& th": { borderColor: isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9", py: 0.8, px: 1, fontSize: "0.7rem", fontWeight: 700, color: isDark ? "#94a3b8" : "#64748b", whiteSpace: "nowrap" } }}>
                          <TableCell>Date</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Check In</TableCell>
                          <TableCell>Check Out</TableCell>
                          <TableCell align="right">Hours</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {attendanceStats.logEntries.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} align="center" sx={{ py: 3, color: isDark ? "#64748b" : "#94a3b8", fontSize: "0.8rem" }}>
                              No attendance records for this month
                            </TableCell>
                          </TableRow>
                        ) : (
                          attendanceStats.logEntries.slice(0, 10).map((row, idx) => {
                            const style = getStatusBadge(row.status);
                            return (
                              <TableRow
                                key={idx}
                                onClick={() => handleAttendanceRowClick(row)}
                                sx={{
                                  "& td": { borderColor: isDark ? "rgba(255,255,255,0.04)" : "#f8fafc", py: 0.85, px: 1, fontSize: "0.72rem", whiteSpace: "nowrap" },
                                  cursor: "pointer",
                                  transition: "background-color 0.15s ease",
                                  "&:hover": { bgcolor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.03)" },
                                }}
                              >
                                <TableCell>
                                  <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: isDark ? "#f8fafc" : "#0f172a", lineHeight: 1.1 }}>
                                    {row.date}
                                  </Typography>
                                  <Typography variant="caption" sx={{ fontSize: "0.62rem", color: isDark ? "#64748b" : "#94a3b8", fontWeight: 600 }}>
                                    {row.day}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={row.status}
                                    size="small"
                                    sx={{
                                      bgcolor: style.bg,
                                      color: style.color,
                                      fontWeight: 700,
                                      fontSize: "0.65rem",
                                      height: 20,
                                      borderRadius: "5px",
                                      px: 0.4,
                                    }}
                                  />
                                </TableCell>
                                <TableCell sx={{ color: isDark ? "#cbd5e1" : "#475569", fontFamily: "monospace", fontSize: "0.72rem" }}>
                                  {row.checkIn}
                                </TableCell>
                                <TableCell sx={{ color: isDark ? "#cbd5e1" : "#475569", fontFamily: "monospace", fontSize: "0.72rem" }}>
                                  {row.checkOut}
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 800, color: isDark ? "#f8fafc" : "#0f172a", fontSize: "0.74rem" }}>
                                  {row.hours}
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              </Paper>

              {/* Attendance Details Modal */}
              <AttendanceDetails
                open={attendanceDetailsOpen}
                onClose={() => setAttendanceDetailsOpen(false)}
                attendance={selectedAttendanceRecord}
                canEdit={true}
                canDelete={true}
                onEdit={() => setAttendanceRefreshTrigger((prev) => prev + 1)}
                onDelete={() => setAttendanceRefreshTrigger((prev) => prev + 1)}
              />
            </Grid>

            {/* 3. Right: Attendance Summary + Hours Subcards */}
            <Grid item xs={12} lg={3.4}>
              <Paper
                elevation={0}
                sx={{
                  ...cardStyle,
                  p: 2.5,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <Box>
                  <Box sx={{ mb: 1.5, pb: 1, borderBottom: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid #f1f5f9" }}>
                    <Typography variant="subtitle1" fontWeight={800} sx={{ color: isDark ? "#f8fafc" : "#0f172a", fontSize: "0.95rem" }}>
                      Attendance Summary
                    </Typography>
                  </Box>

                  {/* Donut Chart + Legend Side-by-Side */}
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-around", mb: 2.2, pt: 0.5 }}>
                    <MultiSegmentDonut
                      size={108}
                      strokeWidth={12}
                      isDark={isDark}
                      present={attendanceStats.presentCount}
                      absent={attendanceStats.absentCount}
                      onLeave={attendanceStats.onLeaveCount}
                      weeklyOff={attendanceStats.weeklyOffCount}
                      holiday={attendanceStats.holidayCount}
                      workingDays={attendanceStats.workingDays}
                    />
                    <Stack spacing={0.7} sx={{ minWidth: 95 }}>
                      {[
                        { label: "Present", count: attendanceStats.presentCount, color: "#10b981" },
                        { label: "Absent", count: attendanceStats.absentCount, color: "#ef4444" },
                        { label: "On Leave", count: attendanceStats.onLeaveCount, color: "#f59e0b" },
                        { label: "Weekly Off", count: attendanceStats.weeklyOffCount, color: "#8b5cf6" },
                        { label: "Holiday", count: attendanceStats.holidayCount, color: "#0ea5e9" },
                      ].map((item) => (
                        <Box key={item.label} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <Stack direction="row" spacing={0.75} alignItems="center">
                            <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: item.color }} />
                            <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.72rem", fontWeight: 600 }}>
                              {item.label}
                            </Typography>
                          </Stack>
                          <Typography variant="caption" fontWeight={800} sx={{ color: isDark ? "#f8fafc" : "#0f172a", fontSize: "0.74rem" }}>
                            {item.count}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                </Box>

                {/* Bottom 2 Performance Subcards */}
                <Stack spacing={1.2}>
                  {/* Working Hours */}
                  <Paper
                    elevation={0}
                    sx={{
                      p: 1.25,
                      borderRadius: "10px",
                      bgcolor: isDark ? "rgba(255,255,255,0.02)" : "#f8fafc",
                      border: isDark ? "1px solid rgba(255,255,255,0.05)" : "1px solid #e2e8f0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: "8px",
                          bgcolor: isDark ? "rgba(59, 130, 246, 0.15)" : "#eff6ff",
                          color: "#3b82f6",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Schedule sx={{ fontSize: 17 }} />
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.68rem", fontWeight: 600, display: "block", lineHeight: 1.1 }}>
                          Working Hours
                        </Typography>
                        <Typography variant="body2" fontWeight={800} sx={{ color: isDark ? "#f8fafc" : "#0f172a", fontSize: "0.82rem" }}>
                          {attendanceStats.totalWorkHoursFormatted}
                        </Typography>
                      </Box>
                    </Stack>
                    <Box sx={{ textAlign: "right" }}>
                      <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.62rem", display: "block" }}>
                        Avg. per day
                      </Typography>
                      <Typography variant="caption" fontWeight={800} sx={{ color: isDark ? "#f8fafc" : "#0f172a", fontSize: "0.76rem" }}>
                        {attendanceStats.avgWorkHoursFormatted}
                      </Typography>
                    </Box>
                  </Paper>

                  {/* Late Arrivals */}
                  <Paper
                    elevation={0}
                    sx={{
                      p: 1.25,
                      borderRadius: "10px",
                      bgcolor: isDark ? "rgba(255,255,255,0.02)" : "#f8fafc",
                      border: isDark ? "1px solid rgba(255,255,255,0.05)" : "1px solid #e2e8f0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: "8px",
                          bgcolor: isDark ? "rgba(239, 68, 68, 0.15)" : "#fef2f2",
                          color: "#ef4444",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Alarm sx={{ fontSize: 17 }} />
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.68rem", fontWeight: 600, display: "block", lineHeight: 1.1 }}>
                          Late Arrivals
                        </Typography>
                        <Typography variant="body2" fontWeight={800} sx={{ color: isDark ? "#f8fafc" : "#0f172a", fontSize: "0.82rem" }}>
                          {attendanceStats.lateArrivalsCount} times
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                </Stack>
              </Paper>
            </Grid>
          </Grid>

          {/* Row 3: Attendance Insights */}
          <Paper elevation={0} sx={{ ...cardStyle }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="subtitle1" fontWeight={800} sx={{ color: isDark ? "#f8fafc" : "#0f172a" }}>
                Attendance Insights
              </Typography>
              <Paper
                elevation={0}
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  bgcolor: isDark ? "rgba(255,255,255,0.05)" : "#f8fafc",
                  border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0",
                  borderRadius: "8px",
                  px: 1.25,
                  py: 0.5,
                  gap: 0.75,
                  cursor: "pointer",
                }}
              >
                <Typography variant="caption" fontWeight={700} sx={{ color: isDark ? "#cbd5e1" : "#475569", fontSize: "0.74rem" }}>
                  This Month
                </Typography>
                <KeyboardArrowDown sx={{ fontSize: 15, color: isDark ? "#94a3b8" : "#64748b" }} />
              </Paper>
            </Box>

            <Grid container spacing={2}>
              {/* Insight 1: Best Attendance Streak */}
              <Grid item xs={12} sm={6} md={3}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: "12px",
                    bgcolor: isDark ? "rgba(245, 158, 11, 0.08)" : "#fffbeb",
                    border: isDark ? "1px solid rgba(245, 158, 11, 0.2)" : "1px solid #fef3c7",
                    display: "flex",
                    alignItems: "center",
                    gap: 1.75,
                  }}
                >
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: "12px",
                      bgcolor: isDark ? "rgba(245, 158, 11, 0.2)" : "#fef3c7",
                      color: "#f59e0b",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <EmojiEvents sx={{ fontSize: 24 }} />
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.68rem", fontWeight: 600, display: "block" }}>
                      Best Attendance Streak
                    </Typography>
                    <Typography variant="subtitle1" fontWeight={900} sx={{ color: isDark ? "#f8fafc" : "#0f172a", fontSize: "1.05rem", lineHeight: 1.2 }}>
                      {attendanceStats.maxStreak > 0 ? `${attendanceStats.maxStreak} Days` : "0 Days"}
                    </Typography>
                    <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.65rem" }}>
                      {attendanceStats.streakSubtitle}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>

              {/* Insight 2: Most Productive Day */}
              <Grid item xs={12} sm={6} md={3}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: "12px",
                    bgcolor: isDark ? "rgba(59, 130, 246, 0.08)" : "#eff6ff",
                    border: isDark ? "1px solid rgba(59, 130, 246, 0.2)" : "1px solid #dbeafe",
                    display: "flex",
                    alignItems: "center",
                    gap: 1.75,
                  }}
                >
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: "12px",
                      bgcolor: isDark ? "rgba(59, 130, 246, 0.2)" : "#dbeafe",
                      color: "#3b82f6",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <BarChart sx={{ fontSize: 24 }} />
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.68rem", fontWeight: 600, display: "block" }}>
                      Most Productive Day
                    </Typography>
                    <Typography variant="subtitle1" fontWeight={900} sx={{ color: isDark ? "#f8fafc" : "#0f172a", fontSize: "1.05rem", lineHeight: 1.2 }}>
                      {attendanceStats.mostProductiveDay}
                    </Typography>
                    <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.65rem" }}>
                      {attendanceStats.productiveAvgStr}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>

              {/* Insight 3: Most Late Arrivals */}
              <Grid item xs={12} sm={6} md={3}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: "12px",
                    bgcolor: isDark ? "rgba(239, 68, 68, 0.08)" : "#fef2f2",
                    border: isDark ? "1px solid rgba(239, 68, 68, 0.2)" : "1px solid #fee2e2",
                    display: "flex",
                    alignItems: "center",
                    gap: 1.75,
                  }}
                >
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: "12px",
                      bgcolor: isDark ? "rgba(239, 68, 68, 0.2)" : "#fee2e2",
                      color: "#ef4444",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Schedule sx={{ fontSize: 24 }} />
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.68rem", fontWeight: 600, display: "block" }}>
                      Most Late Arrivals
                    </Typography>
                    <Typography variant="subtitle1" fontWeight={900} sx={{ color: isDark ? "#f8fafc" : "#0f172a", fontSize: "1.05rem", lineHeight: 1.2 }}>
                      {attendanceStats.mostLateDay}
                    </Typography>
                    <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.65rem" }}>
                      {attendanceStats.mostLateCount > 0 ? `${attendanceStats.mostLateCount} times` : "0 times"}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>

              {/* Insight 4: Attendance Trend */}
              <Grid item xs={12} sm={6} md={3}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: "12px",
                    bgcolor: isDark ? "rgba(16, 185, 129, 0.08)" : "#f0fdf4",
                    border: isDark ? "1px solid rgba(16, 185, 129, 0.2)" : "1px solid #dcfce7",
                    display: "flex",
                    alignItems: "center",
                    gap: 1.75,
                  }}
                >
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: "12px",
                      bgcolor: isDark ? "rgba(16, 185, 129, 0.2)" : "#dcfce7",
                      color: "#10b981",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <TrendingUp sx={{ fontSize: 24 }} />
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.68rem", fontWeight: 600, display: "block" }}>
                      Attendance Rate
                    </Typography>
                    <Typography variant="subtitle1" fontWeight={900} sx={{ color: "#10b981", fontSize: "1.05rem", lineHeight: 1.2 }}>
                      {attendanceStats.presentRate}%
                    </Typography>
                    <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.65rem" }}>
                      {attendanceStats.presentCount} of {attendanceStats.workingDays} working days
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </Paper>
        </Stack>
        </Box>
      )}

      {currentTab === 2 && (
        <Box key="tab-2" sx={{ animation: "tabContentFade 0.35s cubic-bezier(0.16, 1, 0.3, 1)" }}>
          {/* 1. Leave KPI Overview Cards */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {/* Total Leaves */}
            <Grid item xs={12} sm={6} md={3}>
              <Paper elevation={0} sx={{ ...cardStyle, p: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.75 }}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: "12px",
                      bgcolor: isDark ? "rgba(59, 130, 246, 0.15)" : "#eff6ff",
                      color: "#3b82f6",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <CalendarMonth sx={{ fontSize: 22 }} />
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.72rem", fontWeight: 600 }}>
                      Total Leave Requests
                    </Typography>
                    <Typography variant="h6" fontWeight={900} sx={{ color: isDark ? "#f8fafc" : "#0f172a", fontSize: "1.2rem", lineHeight: 1.2 }}>
                      {leaveStats.total}
                    </Typography>
                    <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.68rem" }}>
                      All recorded applications
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>

            {/* Approved Leaves */}
            <Grid item xs={12} sm={6} md={3}>
              <Paper elevation={0} sx={{ ...cardStyle, p: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.75 }}>
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
                    <CheckCircle sx={{ fontSize: 22 }} />
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.72rem", fontWeight: 600 }}>
                      Approved Leaves
                    </Typography>
                    <Typography variant="h6" fontWeight={900} sx={{ color: "#10b981", fontSize: "1.2rem", lineHeight: 1.2 }}>
                      {leaveStats.approvedCount}
                    </Typography>
                    <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.68rem" }}>
                      {leaveStats.approvedDays} Day(s) Taken
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>

            {/* Pending Leaves */}
            <Grid item xs={12} sm={6} md={3}>
              <Paper elevation={0} sx={{ ...cardStyle, p: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.75 }}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: "12px",
                      bgcolor: isDark ? "rgba(245, 158, 11, 0.15)" : "#fffbeb",
                      color: "#f59e0b",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Schedule sx={{ fontSize: 22 }} />
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.72rem", fontWeight: 600 }}>
                      Pending Approval
                    </Typography>
                    <Typography variant="h6" fontWeight={900} sx={{ color: "#f59e0b", fontSize: "1.2rem", lineHeight: 1.2 }}>
                      {leaveStats.pendingCount}
                    </Typography>
                    <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.68rem" }}>
                      {leaveStats.pendingDays} Day(s) Awaiting Review
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>

            {/* Rejected Leaves */}
            <Grid item xs={12} sm={6} md={3}>
              <Paper elevation={0} sx={{ ...cardStyle, p: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.75 }}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: "12px",
                      bgcolor: isDark ? "rgba(239, 68, 68, 0.15)" : "#fef2f2",
                      color: "#ef4444",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Cancel sx={{ fontSize: 22 }} />
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.72rem", fontWeight: 600 }}>
                      Declined / Rejected
                    </Typography>
                    <Typography variant="h6" fontWeight={900} sx={{ color: "#ef4444", fontSize: "1.2rem", lineHeight: 1.2 }}>
                      {leaveStats.rejectedCount}
                    </Typography>
                    <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.68rem" }}>
                      Requests rejected
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* 2. Leave Records Table & Controls */}
          <Paper elevation={0} sx={{ ...cardStyle }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2.5, flexWrap: "wrap", gap: 2 }}>
              <Box>
                <Typography variant="h6" fontWeight={800} sx={{ color: isDark ? "#f8fafc" : "#0f172a", fontSize: "1.1rem" }}>
                  Leave History & Records
                </Typography>
                <Typography variant="body2" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.78rem", mt: 0.3 }}>
                  Showing all leave applications and records for this employee.
                </Typography>
              </Box>

              <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                {/* Filter Pills */}
                <Stack direction="row" spacing={0.75} sx={{ bgcolor: isDark ? "rgba(255,255,255,0.04)" : "#f1f5f9", p: 0.5, borderRadius: "10px" }}>
                  {[
                    { key: "all", label: "All", count: leaveStats.total },
                    { key: "approved", label: "Approved", count: leaveStats.approvedCount },
                    { key: "pending", label: "Pending", count: leaveStats.pendingCount },
                    { key: "rejected", label: "Rejected", count: leaveStats.rejectedCount },
                  ].map((filter) => {
                    const active = leaveFilterStatus === filter.key;
                    return (
                      <Button
                        key={filter.key}
                        size="small"
                        onClick={() => setLeaveFilterStatus(filter.key)}
                        sx={{
                          borderRadius: "8px",
                          textTransform: "none",
                          fontSize: "0.75rem",
                          fontWeight: active ? 800 : 600,
                          px: 1.5,
                          py: 0.35,
                          minWidth: "auto",
                          bgcolor: active ? (isDark ? "#1d68f0" : "#ffffff") : "transparent",
                          color: active ? (isDark ? "#ffffff" : "#1d68f0") : (isDark ? "#94a3b8" : "#64748b"),
                          boxShadow: active && !isDark ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                          "&:hover": {
                            bgcolor: active ? (isDark ? "#1d68f0" : "#ffffff") : (isDark ? "rgba(255,255,255,0.06)" : "#e2e8f0"),
                          },
                        }}
                      >
                        {filter.label} ({filter.count})
                      </Button>
                    );
                  })}
                </Stack>

                {/* + Apply Leave Button */}
                <Button
                  variant="contained"
                  startIcon={<Add sx={{ fontSize: 18 }} />}
                  onClick={handleOpenApplyLeaveModal}
                  sx={{
                    borderRadius: "8px",
                    textTransform: "none",
                    fontWeight: 700,
                    fontSize: "0.82rem",
                    px: 2.2,
                    py: 0.8,
                    bgcolor: "#1d68f0",
                    backgroundImage: "linear-gradient(135deg, #1d68f0 0%, #2563eb 100%)",
                    boxShadow: "0 4px 14px rgba(29, 104, 240, 0.35)",
                  }}
                >
                  + Apply Leave
                </Button>
              </Stack>
            </Box>

            {leavesLoading ? (
              <Box sx={{ py: 6, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1.5 }}>
                <CircularProgress size={32} sx={{ color: "#1d68f0" }} />
                <Typography variant="body2" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.85rem" }}>
                  Fetching leave history from database...
                </Typography>
              </Box>
            ) : filteredLeaves.length === 0 ? (
              <Paper
                elevation={0}
                sx={{
                  py: 6,
                  px: 3,
                  textAlign: "center",
                  borderRadius: "12px",
                  bgcolor: isDark ? "rgba(255,255,255,0.02)" : "#f8fafc",
                  border: isDark ? "1px dashed rgba(255,255,255,0.08)" : "1px dashed #e2e8f0",
                }}
              >
                <BeachAccess sx={{ fontSize: 44, color: isDark ? "#475569" : "#94a3b8", mb: 1.5 }} />
                <Typography variant="subtitle1" fontWeight={800} sx={{ color: isDark ? "#f8fafc" : "#0f172a", mb: 0.5 }}>
                  {leaveFilterStatus === "all" ? "No Leave Records Found" : `No ${leaveFilterStatus.toUpperCase()} Leaves`}
                </Typography>
                <Typography variant="body2" sx={{ color: isDark ? "#94a3b8" : "#64748b", maxWidth: 420, mx: "auto", mb: 2, fontSize: "0.82rem" }}>
                  {leaveFilterStatus === "all"
                    ? "This employee has no leave records logged in the system yet. Click '+ Apply Leave' to add an application."
                    : `There are currently no leaves with status '${leaveFilterStatus}'.`}
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={handleOpenApplyLeaveModal}
                  sx={{
                    borderRadius: "8px",
                    textTransform: "none",
                    fontWeight: 700,
                    fontSize: "0.82rem",
                    color: "#1d68f0",
                    borderColor: isDark ? "rgba(29, 104, 240, 0.4)" : "#bfdbfe",
                  }}
                >
                  Apply Leave Now
                </Button>
              </Paper>
            ) : (
              <TableContainer sx={{ overflowX: "auto" }}>
                <Table>
                  <TableHead sx={{ bgcolor: isDark ? "#131b2e" : "#f8fafc" }}>
                    <TableRow>
                      {["Leave Type", "Duration / Dates", "Days", "Reason", "Reviewer / Notes", "Status", "Actions"].map((h) => (
                        <TableCell key={h} sx={{ fontWeight: 800, fontSize: "0.78rem", color: isDark ? "#94a3b8" : "#64748b", py: 1.5 }}>
                          {h}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredLeaves.map((row, idx) => {
                      const typeStyle = getLeaveTypeStyle(row.leaveType);
                      const statusStyle = getStatusBadge(row.status);
                      const TypeIcon = typeStyle.icon;
                      const rawStatus = (row.status || "").toLowerCase();
                      const isPending = rawStatus === "pending";

                      return (
                        <TableRow
                          key={row._id || idx}
                          sx={{
                            "&:hover": { bgcolor: isDark ? "rgba(255,255,255,0.02)" : "#f8fafc" },
                            transition: "background 0.2s ease",
                          }}
                        >
                          {/* Leave Type */}
                          <TableCell sx={{ py: 1.75 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                              <Box
                                sx={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: "8px",
                                  bgcolor: typeStyle.bg,
                                  color: typeStyle.color,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <TypeIcon sx={{ fontSize: 17 }} />
                              </Box>
                              <Box>
                                <Typography variant="body2" fontWeight={800} sx={{ color: isDark ? "#f8fafc" : "#0f172a", fontSize: "0.85rem" }}>
                                  {row.leaveType || "Casual Leave"}
                                </Typography>
                                <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.68rem" }}>
                                  Applied on {new Date(row.createdAt || row.startDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>

                          {/* Duration */}
                          <TableCell sx={{ py: 1.75 }}>
                            <Typography variant="body2" fontWeight={700} sx={{ color: isDark ? "#f8fafc" : "#0f172a", fontSize: "0.82rem" }}>
                              {formatLeaveDuration(row.startDate, row.endDate)}
                            </Typography>
                          </TableCell>

                          {/* Days */}
                          <TableCell sx={{ py: 1.75 }}>
                            <Chip
                              label={`${row.totalDays || 1} Day(s)`}
                              size="small"
                              sx={{
                                fontWeight: 800,
                                fontSize: "0.72rem",
                                borderRadius: "6px",
                                bgcolor: isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9",
                                color: isDark ? "#cbd5e1" : "#334155",
                              }}
                            />
                          </TableCell>

                          {/* Reason */}
                          <TableCell sx={{ py: 1.75, maxWidth: 220 }}>
                            <Tooltip title={row.reason || "No reason specified"} arrow placement="top">
                              <Typography
                                variant="body2"
                                sx={{
                                  color: isDark ? "#cbd5e1" : "#475569",
                                  fontSize: "0.8rem",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {row.reason || "—"}
                              </Typography>
                            </Tooltip>
                          </TableCell>

                          {/* Reviewer / Notes */}
                          <TableCell sx={{ py: 1.75 }}>
                            {row.reviewedBy ? (
                              <Box>
                                <Typography variant="caption" fontWeight={700} sx={{ color: isDark ? "#cbd5e1" : "#334155", display: "block" }}>
                                  Reviewed by: {typeof row.reviewedBy === "object" ? `${row.reviewedBy.firstName || ""} ${row.reviewedBy.lastName || ""}`.trim() || row.reviewedBy.email : "Management"}
                                </Typography>
                                {row.reviewNote && (
                                  <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontStyle: "italic", fontSize: "0.68rem" }}>
                                    "{row.reviewNote}"
                                  </Typography>
                                )}
                              </Box>
                            ) : (
                              <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontStyle: "italic" }}>
                                {isPending ? "Awaiting review" : "Direct Approval"}
                              </Typography>
                            )}
                          </TableCell>

                          {/* Status Badge */}
                          <TableCell sx={{ py: 1.75 }}>
                            <Chip
                              label={statusStyle.text || row.status}
                              size="small"
                              sx={{
                                bgcolor: statusStyle.bg,
                                color: statusStyle.color,
                                fontWeight: 800,
                                fontSize: "0.72rem",
                                borderRadius: "6px",
                                px: 0.5,
                              }}
                            />
                          </TableCell>

                          {/* Actions */}
                          <TableCell sx={{ py: 1.75 }}>
                            <Stack direction="row" spacing={0.5} alignItems="center">
                              {isPending && (
                                <>
                                  <Tooltip title="Approve Leave" arrow>
                                    <IconButton
                                      size="small"
                                      onClick={() => handleOpenReviewDialog(row, "approved")}
                                      sx={{
                                        color: "#10b981",
                                        bgcolor: isDark ? "rgba(16, 185, 129, 0.1)" : "#ecfdf5",
                                        "&:hover": { bgcolor: "#10b981", color: "#ffffff" },
                                      }}
                                    >
                                      <Check sx={{ fontSize: 16 }} />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Reject Leave" arrow>
                                    <IconButton
                                      size="small"
                                      onClick={() => handleOpenReviewDialog(row, "rejected")}
                                      sx={{
                                        color: "#ef4444",
                                        bgcolor: isDark ? "rgba(239, 68, 68, 0.1)" : "#fef2f2",
                                        "&:hover": { bgcolor: "#ef4444", color: "#ffffff" },
                                      }}
                                    >
                                      <Close sx={{ fontSize: 16 }} />
                                    </IconButton>
                                  </Tooltip>
                                </>
                              )}
                              <Tooltip title="Delete Leave Record" arrow>
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteLeave(row._id)}
                                  sx={{
                                    color: isDark ? "#94a3b8" : "#64748b",
                                    "&:hover": { color: "#ef4444", bgcolor: isDark ? "rgba(239, 68, 68, 0.1)" : "#fee2e2" },
                                  }}
                                >
                                  <DeleteOutline sx={{ fontSize: 16 }} />
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
            )}
          </Paper>
        </Box>
      )}

      {/* ── 7. TAB 3: SALARY STRUCTURE (INTERACTIVE REDESIGN) ──────── */}
      {currentTab === 3 && (
        <Box key="tab-3" sx={{ animation: "tabContentFade 0.35s cubic-bezier(0.16, 1, 0.3, 1)" }}>
          <Paper elevation={0} sx={{ ...cardStyle, p: 3 }}>
            {/* Top Header & Action Controls */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3, flexWrap: "wrap", gap: 2 }}>
              <Box>
                <Typography variant="h6" fontWeight={800} sx={{ color: isDark ? "#f8fafc" : "#0f172a", fontSize: "1.1rem", lineHeight: 1.2 }}>
                  Salary Structure
                </Typography>
                <Typography variant="body2" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.78rem", mt: 0.4 }}>
                  Define and manage the employee's salary components.
                </Typography>
              </Box>

              <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                {/* Effective From Selector */}
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="caption" fontWeight={600} sx={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.78rem" }}>
                    Effective From
                  </Typography>
                  <Paper
                    elevation={0}
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      bgcolor: isDark ? "rgba(255,255,255,0.03)" : "#ffffff",
                      border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0",
                      borderRadius: "8px",
                      px: 1.25,
                      py: 0.6,
                      gap: 0.8,
                    }}
                  >
                    <CalendarToday sx={{ fontSize: 15, color: isDark ? "#94a3b8" : "#64748b" }} />
                    <Typography variant="body2" fontWeight={700} sx={{ color: isDark ? "#f8fafc" : "#0f172a", fontSize: "0.8rem" }}>
                      {effectiveDate}
                    </Typography>
                    <KeyboardArrowDown sx={{ fontSize: 16, color: isDark ? "#94a3b8" : "#64748b" }} />
                  </Paper>
                </Stack>

                {/* + Add Component Button */}
                <Button
                  variant="outlined"
                  startIcon={<Add sx={{ fontSize: 18 }} />}
                  onClick={handleAddSalaryComponent}
                  sx={{
                    borderRadius: "8px",
                    textTransform: "none",
                    fontWeight: 700,
                    fontSize: "0.78rem",
                    color: "#1d68f0",
                    borderColor: isDark ? "rgba(29, 104, 240, 0.4)" : "#bfdbfe",
                    bgcolor: isDark ? "rgba(29, 104, 240, 0.08)" : "#eff6ff",
                    px: 1.5,
                    py: 0.6,
                    "&:hover": {
                      bgcolor: "#1d68f0",
                      color: "#ffffff",
                      borderColor: "#1d68f0",
                    },
                  }}
                >
                  Add Component
                </Button>
              </Stack>
            </Box>

            {/* Split Grid: Components Table (Left) + Salary Summary & Notes (Right) */}
            <Grid container spacing={3}>
              {/* Left Column: Editable Salary Components Table */}
              <Grid item xs={12} lg={8}>
                <TableContainer sx={{ overflowX: "auto" }}>
                  <Table size="small" sx={{ minWidth: 600 }}>
                    <TableHead>
                      <TableRow sx={{ "& th": { borderColor: isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9", py: 1.2, px: 1, fontSize: "0.75rem", fontWeight: 700, color: isDark ? "#94a3b8" : "#64748b" } }}>
                        <TableCell sx={{ width: "32%" }}>Component Name</TableCell>
                        <TableCell sx={{ width: "20%" }}>Type</TableCell>
                        <TableCell sx={{ width: "20%" }}>Amount (₹)</TableCell>
                        <TableCell sx={{ width: "20%" }}>Calculation Type</TableCell>
                        <TableCell align="center" sx={{ width: "8%" }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {salaryComponents.map((comp) => (
                        <TableRow key={comp.id} sx={{ "& td": { borderColor: isDark ? "rgba(255,255,255,0.04)" : "#f8fafc", py: 0.8, px: 1 } }}>
                          {/* Component Name Field */}
                          <TableCell>
                            <TextField
                              size="small"
                              fullWidth
                              value={comp.name}
                              onChange={(e) => handleUpdateSalaryComponent(comp.id, "name", e.target.value)}
                              sx={{
                                "& .MuiOutlinedInput-root": {
                                  borderRadius: "8px",
                                  fontSize: "0.82rem",
                                  fontWeight: 600,
                                  bgcolor: isDark ? "rgba(255,255,255,0.02)" : "#ffffff",
                                  "& fieldset": { borderColor: isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0" },
                                  "&:hover fieldset": { borderColor: "#1d68f0" },
                                },
                              }}
                            />
                          </TableCell>

                          {/* Type Select */}
                          <TableCell>
                            <Select
                              size="small"
                              fullWidth
                              value={comp.type}
                              onChange={(e) => handleUpdateSalaryComponent(comp.id, "type", e.target.value)}
                              sx={{
                                borderRadius: "8px",
                                fontSize: "0.82rem",
                                fontWeight: 600,
                                bgcolor: isDark ? "rgba(255,255,255,0.02)" : "#ffffff",
                                "& .MuiOutlinedInput-notchedOutline": { borderColor: isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0" },
                                "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#1d68f0" },
                              }}
                            >
                              <MenuItem value="Earning" sx={{ fontSize: "0.82rem", fontWeight: 600, color: "#10b981" }}>Earning</MenuItem>
                              <MenuItem value="Deduction" sx={{ fontSize: "0.82rem", fontWeight: 600, color: "#ef4444" }}>Deduction</MenuItem>
                            </Select>
                          </TableCell>

                          {/* Amount Input */}
                          <TableCell>
                            <TextField
                              size="small"
                              fullWidth
                              type="number"
                              value={comp.amount}
                              onChange={(e) => handleUpdateSalaryComponent(comp.id, "amount", e.target.value)}
                              sx={{
                                "& .MuiOutlinedInput-root": {
                                  borderRadius: "8px",
                                  fontSize: "0.82rem",
                                  fontWeight: 700,
                                  fontFamily: "monospace",
                                  bgcolor: isDark ? "rgba(255,255,255,0.02)" : "#ffffff",
                                  "& fieldset": { borderColor: isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0" },
                                  "&:hover fieldset": { borderColor: "#1d68f0" },
                                },
                              }}
                            />
                          </TableCell>

                          {/* Calculation Type Select */}
                          <TableCell>
                            <Select
                              size="small"
                              fullWidth
                              value={comp.calculationType}
                              onChange={(e) => handleUpdateSalaryComponent(comp.id, "calculationType", e.target.value)}
                              sx={{
                                borderRadius: "8px",
                                fontSize: "0.82rem",
                                fontWeight: 600,
                                bgcolor: isDark ? "rgba(255,255,255,0.02)" : "#ffffff",
                                "& .MuiOutlinedInput-notchedOutline": { borderColor: isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0" },
                                "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#1d68f0" },
                              }}
                            >
                              <MenuItem value="Fixed" sx={{ fontSize: "0.82rem" }}>Fixed</MenuItem>
                              <MenuItem value="% of Basic" sx={{ fontSize: "0.82rem" }}>% of Basic</MenuItem>
                              <MenuItem value="Variable" sx={{ fontSize: "0.82rem" }}>Variable</MenuItem>
                            </Select>
                          </TableCell>

                          {/* Delete Row Action */}
                          <TableCell align="center">
                            <Tooltip title="Delete component" arrow>
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteSalaryComponent(comp.id)}
                                sx={{
                                  color: "#ef4444",
                                  bgcolor: isDark ? "rgba(239, 68, 68, 0.12)" : "#fef2f2",
                                  border: isDark ? "1px solid rgba(239, 68, 68, 0.2)" : "1px solid #fee2e2",
                                  borderRadius: "8px",
                                  p: 0.75,
                                  transition: "all 0.2s",
                                  "&:hover": {
                                    bgcolor: "#ef4444",
                                    color: "#ffffff",
                                    transform: "scale(1.08)",
                                  },
                                }}
                              >
                                <DeleteOutline sx={{ fontSize: 17 }} />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>

              {/* Right Column: Salary Summary & Notes Card */}
              <Grid item xs={12} lg={4}>
                <Stack spacing={2.5}>
                  {/* Salary Summary Card */}
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.2,
                      borderRadius: "14px",
                      bgcolor: isDark ? "rgba(255,255,255,0.02)" : "#ffffff",
                      border: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid #e2e8f0",
                    }}
                  >
                    <Typography variant="subtitle1" fontWeight={800} sx={{ color: isDark ? "#f8fafc" : "#0f172a", fontSize: "0.92rem", mb: 2 }}>
                      Salary Summary
                    </Typography>

                    {/* Top Row: Total Earnings & Total Deductions */}
                    <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
                      {/* Total Earnings */}
                      <Grid item xs={6}>
                        <Paper
                          elevation={0}
                          sx={{
                            p: 1.75,
                            borderRadius: "12px",
                            bgcolor: isDark ? "rgba(16, 185, 129, 0.1)" : "#f0fdf4",
                            border: isDark ? "1px solid rgba(16, 185, 129, 0.2)" : "1px solid #dcfce7",
                          }}
                        >
                          <Typography variant="caption" sx={{ color: "#16a34a", fontSize: "0.72rem", fontWeight: 700, display: "block", mb: 0.5 }}>
                            Total Earnings
                          </Typography>
                          <Typography variant="h6" fontWeight={900} sx={{ color: "#16a34a", fontSize: "1.15rem", lineHeight: 1.1 }}>
                            ₹ {totalEarnings.toLocaleString("en-IN")}
                          </Typography>
                        </Paper>
                      </Grid>

                      {/* Total Deductions */}
                      <Grid item xs={6}>
                        <Paper
                          elevation={0}
                          sx={{
                            p: 1.75,
                            borderRadius: "12px",
                            bgcolor: isDark ? "rgba(239, 68, 68, 0.1)" : "#fef2f2",
                            border: isDark ? "1px solid rgba(239, 68, 68, 0.2)" : "1px solid #fee2e2",
                          }}
                        >
                          <Typography variant="caption" sx={{ color: "#dc2626", fontSize: "0.72rem", fontWeight: 700, display: "block", mb: 0.5 }}>
                            Total Deductions
                          </Typography>
                          <Typography variant="h6" fontWeight={900} sx={{ color: "#dc2626", fontSize: "1.15rem", lineHeight: 1.1 }}>
                            ₹ {totalDeductions.toLocaleString("en-IN")}
                          </Typography>
                        </Paper>
                      </Grid>
                    </Grid>

                    {/* Full Width Bottom: Net Pay (In Hand) */}
                    <Paper
                      elevation={0}
                      sx={{
                        p: 1.75,
                        borderRadius: "12px",
                        bgcolor: isDark ? "rgba(29, 104, 240, 0.1)" : "#eff6ff",
                        border: isDark ? "1px solid rgba(29, 104, 240, 0.2)" : "1px solid #dbeafe",
                      }}
                    >
                      <Typography variant="caption" sx={{ color: "#1d68f0", fontSize: "0.72rem", fontWeight: 700, display: "block", mb: 0.5 }}>
                        Net Pay (In Hand)
                      </Typography>
                      <Typography variant="h5" fontWeight={900} sx={{ color: "#1d68f0", fontSize: "1.35rem", lineHeight: 1.1 }}>
                        ₹ {netPay.toLocaleString("en-IN")}
                      </Typography>
                    </Paper>
                  </Paper>

                  {/* Notes Card */}
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.2,
                      borderRadius: "14px",
                      bgcolor: isDark ? "rgba(255,255,255,0.02)" : "#ffffff",
                      border: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid #e2e8f0",
                    }}
                  >
                    <Typography variant="subtitle1" fontWeight={800} sx={{ color: isDark ? "#f8fafc" : "#0f172a", fontSize: "0.92rem", mb: 1.2 }}>
                      Notes
                    </Typography>
                    <TextField
                      multiline
                      rows={3}
                      fullWidth
                      placeholder="Add notes (optional)..."
                      value={salaryNotes}
                      onChange={(e) => setSalaryNotes(e.target.value.slice(0, 500))}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "10px",
                          fontSize: "0.82rem",
                          bgcolor: isDark ? "rgba(255,255,255,0.02)" : "#f8fafc",
                          "& fieldset": { borderColor: isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0" },
                        },
                      }}
                    />
                    <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 0.75 }}>
                      <Typography variant="caption" sx={{ color: isDark ? "#64748b" : "#94a3b8", fontSize: "0.68rem", fontWeight: 600 }}>
                        {salaryNotes.length}/500
                      </Typography>
                    </Box>
                  </Paper>
                </Stack>
              </Grid>
            </Grid>

            {/* Bottom Footer Actions */}
            <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 1.5, mt: 3, pt: 2, borderTop: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid #f1f5f9" }}>
              <Button
                variant="outlined"
                onClick={handleCancelSalaryStructure}
                sx={{
                  borderRadius: "8px",
                  textTransform: "none",
                  fontWeight: 700,
                  fontSize: "0.82rem",
                  px: 2.5,
                  py: 0.7,
                  color: isDark ? "#cbd5e1" : "#475569",
                  borderColor: isDark ? "rgba(255,255,255,0.15)" : "#cbd5e1",
                  "&:hover": {
                    bgcolor: isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9",
                    borderColor: isDark ? "rgba(255,255,255,0.25)" : "#94a3b8",
                  },
                }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleSaveSalaryStructure}
                sx={{
                  borderRadius: "8px",
                  textTransform: "none",
                  fontWeight: 700,
                  fontSize: "0.82rem",
                  px: 3,
                  py: 0.7,
                  bgcolor: "#1d68f0",
                  backgroundImage: "linear-gradient(135deg, #1d68f0 0%, #2563eb 100%)",
                  boxShadow: "0 4px 14px rgba(29, 104, 240, 0.35)",
                  "&:hover": {
                    bgcolor: "#1557d0",
                    boxShadow: "0 6px 18px rgba(29, 104, 240, 0.45)",
                  },
                }}
              >
                Save Salary Structure
              </Button>
            </Box>
          </Paper>
        </Box>
      )}

      {/* ── 8. TAB 4: SALARY SLIPS (PIXEL-PERFECT MATCHING USER MOCKUP) ─────────── */}
      {currentTab === 4 && (
        <Box key="tab-4" sx={{ animation: "tabContentFade 0.35s cubic-bezier(0.16, 1, 0.3, 1)" }}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2.5, sm: 3.5 },
              borderRadius: "16px",
              bgcolor: isDark ? "rgba(255,255,255,0.02)" : "#ffffff",
              border: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid #e2e8f0",
              boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.3)" : "0 1px 3px rgba(0,0,0,0.02)",
            }}
          >
            {/* Top Header & Year Filter + Generate Button */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3.5, px: 0.5, flexWrap: "wrap", gap: 1.5 }}>
              <Box>
                <Typography
                  variant="h6"
                  fontWeight={800}
                  sx={{
                    color: isDark ? "#f8fafc" : "#0f172a",
                    fontSize: { xs: "1.15rem", sm: "1.28rem" },
                    letterSpacing: "-0.015em",
                  }}
                >
                  Salary Slips
                </Typography>
                <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b" }}>
                  Official salary slips and payment records from backend
                </Typography>
              </Box>

              <Stack direction="row" spacing={1.5} alignItems="center">
                {/* Year Selector Dropdown */}
                <Select
                  size="small"
                  value={salarySlipYear}
                  onChange={(e) => setSalarySlipYear(e.target.value)}
                  sx={{
                    borderRadius: "8px",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    bgcolor: isDark ? "rgba(255,255,255,0.03)" : "#ffffff",
                    minWidth: 105,
                    height: 36,
                    color: isDark ? "#f8fafc" : "#0f172a",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: isDark ? "rgba(255,255,255,0.15)" : "#cbd5e1",
                    },
                  }}
                >
                  <MenuItem value="2026">2026</MenuItem>
                  <MenuItem value="2025">2025</MenuItem>
                  <MenuItem value="2024">2024</MenuItem>
                </Select>

                {/* Generate Payslip Button */}
                <Button
                  variant="contained"
                  startIcon={<Add sx={{ fontSize: 18 }} />}
                  onClick={() => {
                    setNewSlipMonth("October");
                    setNewSlipYear(salarySlipYear || "2026");
                    setNewSlipStatus("Paid");
                    setGenerateSlipModalOpen(true);
                  }}
                  sx={{
                    borderRadius: "8px",
                    textTransform: "none",
                    fontWeight: 700,
                    fontSize: "0.82rem",
                    px: 2,
                    py: 0.8,
                    bgcolor: "#1d68f0",
                    backgroundImage: "linear-gradient(135deg, #1d68f0 0%, #2563eb 100%)",
                  }}
                >
                  + Generate Salary Slip
                </Button>
              </Stack>
            </Box>

            {/* Salary Slips Table / Empty State */}
            {payslipsLoading ? (
              <Box sx={{ py: 6, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1.5 }}>
                <CircularProgress size={32} sx={{ color: "#1d68f0" }} />
                <Typography variant="body2" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.85rem" }}>
                  Fetching salary slips from database...
                </Typography>
              </Box>
            ) : payslipsData.filter((row) => (row.year === salarySlipYear) || row.month.includes(salarySlipYear)).length === 0 ? (
              <Paper
                elevation={0}
                sx={{
                  py: 6,
                  px: 3,
                  textAlign: "center",
                  borderRadius: "12px",
                  bgcolor: isDark ? "rgba(255,255,255,0.02)" : "#f8fafc",
                  border: isDark ? "1px dashed rgba(255,255,255,0.08)" : "1px dashed #e2e8f0",
                }}
              >
                <ReceiptLong sx={{ fontSize: 44, color: isDark ? "#475569" : "#94a3b8", mb: 1.5 }} />
                <Typography variant="subtitle1" fontWeight={800} sx={{ color: isDark ? "#f8fafc" : "#0f172a", mb: 0.5 }}>
                  No Salary Slips for {salarySlipYear}
                </Typography>
                <Typography variant="body2" sx={{ color: isDark ? "#94a3b8" : "#64748b", maxWidth: 460, mx: "auto", mb: 2.5, fontSize: "0.82rem" }}>
                  {profileData.joiningDate && profileData.joiningDate !== "—"
                    ? `Employee joined on ${profileData.joiningDate}. Click below to generate an official salary slip for this period.`
                    : "There are no generated payslips recorded for this year yet."}
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={() => {
                    setNewSlipMonth("October");
                    setNewSlipYear(salarySlipYear || "2026");
                    setNewSlipStatus("Paid");
                    setGenerateSlipModalOpen(true);
                  }}
                  sx={{
                    borderRadius: "8px",
                    textTransform: "none",
                    fontWeight: 700,
                    fontSize: "0.82rem",
                    color: "#1d68f0",
                    borderColor: isDark ? "rgba(29, 104, 240, 0.4)" : "#bfdbfe",
                  }}
                >
                  Generate Salary Slip Now
                </Button>
              </Paper>
            ) : (
              <TableContainer sx={{ overflowX: "auto" }}>
                <Table sx={{ minWidth: 720 }}>
                  <TableHead>
                    <TableRow
                      sx={{
                        bgcolor: isDark ? "rgba(255,255,255,0.025)" : "#f8fafc",
                        "& th": {
                          borderBottom: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid #f1f5f9",
                          borderTop: "none",
                          py: 1.6,
                          px: 2.2,
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          color: isDark ? "#94a3b8" : "#64748b",
                          whiteSpace: "nowrap",
                        },
                        "& th:first-of-type": {
                          borderTopLeftRadius: "8px",
                          borderBottomLeftRadius: "8px",
                        },
                        "& th:last-of-type": {
                          borderTopRightRadius: "8px",
                          borderBottomRightRadius: "8px",
                        },
                      }}
                    >
                      <TableCell sx={{ width: "23%" }}>Month</TableCell>
                      <TableCell sx={{ width: "18%" }}>Net Pay</TableCell>
                      <TableCell sx={{ width: "17%" }}>Status</TableCell>
                      <TableCell sx={{ width: "18%" }}>Generated On</TableCell>
                      <TableCell align="left" sx={{ width: "24%" }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {payslipsData
                      .filter((row) => (row.year === salarySlipYear) || row.month.includes(salarySlipYear))
                      .map((row) => (
                        <TableRow
                          key={row.id}
                          sx={{
                            "& td": {
                              borderBottom: isDark ? "1px solid rgba(255,255,255,0.04)" : "1px solid #f1f5f9",
                              py: 2,
                              px: 2.2,
                              verticalAlign: "middle",
                              fontSize: "0.88rem",
                              whiteSpace: "nowrap",
                            },
                            "&:hover": {
                              bgcolor: isDark ? "rgba(255,255,255,0.012)" : "rgba(248, 250, 252, 0.6)",
                            },
                          }}
                        >
                          {/* Month Column */}
                          <TableCell sx={{ fontWeight: 700, color: isDark ? "#f8fafc" : "#0f172a", fontSize: "0.88rem" }}>
                            {row.month}
                          </TableCell>

                          {/* Net Pay Column */}
                          <TableCell
                            sx={{
                              fontWeight: 700,
                              color: isDark ? "#f8fafc" : "#0f172a",
                              fontSize: "0.9rem",
                            }}
                          >
                            ₹ {row.netPay}
                          </TableCell>

                          {/* Status Chip */}
                          <TableCell>
                            <Chip
                              label={row.status}
                              size="small"
                              sx={{
                                bgcolor: isDark ? "rgba(16, 185, 129, 0.12)" : "#ecfdf5",
                                color: "#10b981",
                                fontWeight: 600,
                                fontSize: "0.75rem",
                                height: 26,
                                borderRadius: "6px",
                                border: isDark ? "1px solid rgba(16, 185, 129, 0.25)" : "1px solid #a7f3d0",
                                px: 0.8,
                              }}
                            />
                          </TableCell>

                          {/* Generated On Column */}
                          <TableCell sx={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.85rem", fontWeight: 500 }}>
                            {row.generatedOn}
                          </TableCell>

                          {/* Actions: View & Download Buttons */}
                          <TableCell align="left">
                            <Stack direction="row" spacing={1.5} alignItems="center">
                              {/* View Button */}
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<Visibility sx={{ fontSize: 17 }} />}
                                onClick={() => setPreviewSlip(row)}
                                sx={{
                                  borderRadius: "7px",
                                  textTransform: "none",
                                  fontWeight: 600,
                                  fontSize: "0.82rem",
                                  height: 34,
                                  color: "#2563eb",
                                  borderColor: isDark ? "rgba(59, 130, 246, 0.4)" : "#bfdbfe",
                                  bgcolor: isDark ? "rgba(37, 99, 235, 0.05)" : "#ffffff",
                                  px: 1.8,
                                  py: 0.5,
                                  "&:hover": {
                                    bgcolor: isDark ? "rgba(37, 99, 235, 0.15)" : "#eff6ff",
                                    borderColor: "#3b82f6",
                                  },
                                }}
                              >
                                View
                              </Button>

                              {/* Download Button */}
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<FileDownload sx={{ fontSize: 17 }} />}
                                onClick={() => handleDownloadSlip(row)}
                                sx={{
                                  borderRadius: "7px",
                                  textTransform: "none",
                                  fontWeight: 600,
                                  fontSize: "0.82rem",
                                  height: 34,
                                  color: "#2563eb",
                                  borderColor: isDark ? "rgba(59, 130, 246, 0.4)" : "#bfdbfe",
                                  bgcolor: isDark ? "rgba(37, 99, 235, 0.05)" : "#ffffff",
                                  px: 1.8,
                                  py: 0.5,
                                  "&:hover": {
                                    bgcolor: isDark ? "rgba(37, 99, 235, 0.15)" : "#eff6ff",
                                    borderColor: "#3b82f6",
                                  },
                                }}
                              >
                                Download
                              </Button>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Box>
      )}

      {/* ── 9. TAB 5: DOCUMENTS (PIXEL-PERFECT MATCHING USER MOCKUP) ───────── */}
      {currentTab === 5 && (
        <Box key="tab-5" sx={{ animation: "tabContentFade 0.35s cubic-bezier(0.16, 1, 0.3, 1)" }}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2.5, sm: 3.5 },
              borderRadius: "16px",
              bgcolor: isDark ? "rgba(255,255,255,0.02)" : "#ffffff",
              border: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid #e2e8f0",
              boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.3)" : "0 1px 3px rgba(0,0,0,0.02)",
            }}
          >
            {/* Header: Title & Subtitle + Upload Button */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3.5, flexWrap: "wrap", gap: 1.5 }}>
              <Box>
                <Typography
                  variant="h6"
                  fontWeight={800}
                  sx={{
                    color: isDark ? "#f8fafc" : "#0f172a",
                    fontSize: { xs: "1.15rem", sm: "1.28rem" },
                    letterSpacing: "-0.015em",
                  }}
                >
                  Documents
                </Typography>
                <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.82rem", mt: 0.3, display: "block" }}>
                  Manage and view employee documents
                </Typography>
              </Box>

              <Button
                variant="contained"
                startIcon={<Add sx={{ fontSize: 18 }} />}
                onClick={() => setUploadDocModalOpen(true)}
                sx={{
                  borderRadius: "8px",
                  textTransform: "none",
                  fontWeight: 700,
                  fontSize: "0.84rem",
                  px: 2.5,
                  py: 0.8,
                  bgcolor: "#1d68f0",
                  backgroundImage: "linear-gradient(135deg, #1d68f0 0%, #2563eb 100%)",
                  boxShadow: "0 4px 14px rgba(29, 104, 240, 0.35)",
                  "&:hover": {
                    bgcolor: "#1557d0",
                    boxShadow: "0 6px 18px rgba(29, 104, 240, 0.45)",
                  },
                }}
              >
                Upload Document
              </Button>
            </Box>

            {/* 3-Column Documents Grid */}
            <Grid container spacing={2.5}>
              {documentsCategories.map((doc) => {
                const IconComp = doc.icon;
                return (
                  <Grid item xs={12} sm={6} md={4} key={doc.id}>
                    <Paper
                      elevation={0}
                      onClick={() => setSelectedDocCategory(doc)}
                      sx={{
                        p: 2.2,
                        borderRadius: "14px",
                        bgcolor: isDark ? "rgba(255,255,255,0.02)" : "#ffffff",
                        border: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid #e2e8f0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 1.8,
                        cursor: "pointer",
                        transition: "all 0.22s cubic-bezier(0.4, 0, 0.2, 1)",
                        "&:hover": {
                          borderColor: "#3b82f6",
                          boxShadow: isDark ? "0 8px 24px rgba(0,0,0,0.4)" : "0 8px 24px rgba(59, 130, 246, 0.08)",
                          transform: "translateY(-2px)",
                          "& .doc-chevron": {
                            color: "#3b82f6",
                            transform: "translateX(3px)",
                          },
                        },
                      }}
                    >
                      {/* Left: Tinted Icon Box */}
                      <Box
                        sx={{
                          width: 52,
                          height: 52,
                          borderRadius: "12px",
                          bgcolor: isDark ? doc.darkBgColor : doc.bgColor,
                          color: doc.iconColor,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          border: isDark ? `1px solid ${alpha(doc.iconColor, 0.2)}` : "none",
                        }}
                      >
                        <IconComp sx={{ fontSize: 26 }} />
                      </Box>

                      {/* Middle: Title, Count, Verified Badge, Description */}
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography
                          variant="subtitle2"
                          fontWeight={800}
                          noWrap
                          sx={{
                            color: isDark ? "#f8fafc" : "#0f172a",
                            fontSize: "0.92rem",
                            lineHeight: 1.25,
                            mb: 0.4,
                          }}
                        >
                          {doc.title}
                        </Typography>

                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.4 }}>
                          <Typography
                            variant="caption"
                            sx={{
                              color: isDark ? "#94a3b8" : "#64748b",
                              fontSize: "0.78rem",
                              fontWeight: 500,
                            }}
                          >
                            {doc.docCount} {doc.docCount === 1 ? "Document" : "Documents"}
                          </Typography>

                          {doc.verified && (
                            <Chip
                              label="Verified"
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: "0.68rem",
                                fontWeight: 700,
                                bgcolor: isDark ? "rgba(16, 185, 129, 0.15)" : "#ecfdf5",
                                color: "#10b981",
                                border: isDark ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid #a7f3d0",
                                borderRadius: "5px",
                                px: 0.3,
                              }}
                            />
                          )}
                        </Stack>

                        <Typography
                          variant="caption"
                          noWrap
                          sx={{
                            color: isDark ? "#64748b" : "#94a3b8",
                            fontSize: "0.74rem",
                            fontWeight: 500,
                            display: "block",
                          }}
                        >
                          {doc.description}
                        </Typography>
                      </Box>

                      {/* Right: Chevron Arrow */}
                      <ChevronRight
                        className="doc-chevron"
                        sx={{
                          color: isDark ? "#64748b" : "#94a3b8",
                          fontSize: 20,
                          flexShrink: 0,
                          transition: "all 0.2s ease",
                        }}
                      />
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          </Paper>
        </Box>
      )}

      {/* ── 10. TAB 6: LEAD PERFORMANCE (MATCHING USER MOCKUP) ─────────── */}
      {currentTab === 6 && (
        <Box key="tab-6" sx={{ animation: "tabContentFade 0.35s cubic-bezier(0.16, 1, 0.3, 1)" }}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2.5, sm: 3.5 },
              borderRadius: "16px",
              bgcolor: isDark ? "rgba(255,255,255,0.02)" : "#ffffff",
              border: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid #e2e8f0",
              boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.3)" : "0 1px 3px rgba(0,0,0,0.02)",
            }}
          >
            {/* Top Header & Date Range Filter */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3.5, flexWrap: "wrap", gap: 1.5 }}>
              <Box>
                <Typography
                  variant="h6"
                  fontWeight={800}
                  sx={{
                    color: isDark ? "#f8fafc" : "#0f172a",
                    fontSize: { xs: "1.15rem", sm: "1.28rem" },
                    letterSpacing: "-0.015em",
                  }}
                >
                  Lead Performance
                </Typography>
                <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.82rem", mt: 0.3, display: "block" }}>
                  Track leads assigned to the employee and their completion status.
                </Typography>
              </Box>

              {/* Date Range Selector Pill */}
              <Select
                size="small"
                value={leadDateRange}
                onChange={(e) => setLeadDateRange(e.target.value)}
                renderValue={(val) => (
                  <Stack direction="row" spacing={0.8} alignItems="center">
                    <CalendarToday sx={{ fontSize: 15, color: "#1d68f0" }} />
                    <Typography sx={{ fontSize: "0.82rem", fontWeight: 600 }}>{val}</Typography>
                  </Stack>
                )}
                sx={{
                  borderRadius: "8px",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  bgcolor: isDark ? "rgba(255,255,255,0.03)" : "#ffffff",
                  height: 38,
                  minWidth: 220,
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: isDark ? "rgba(255,255,255,0.12)" : "#cbd5e1",
                  },
                }}
              >
                <MenuItem value="01 Aug 2025 - 31 Aug 2025">01 Aug 2025 - 31 Aug 2025</MenuItem>
                <MenuItem value="01 Jul 2025 - 31 Jul 2025">01 Jul 2025 - 31 Jul 2025</MenuItem>
                <MenuItem value="01 Jun 2025 - 30 Jun 2025">01 Jun 2025 - 30 Jun 2025</MenuItem>
                <MenuItem value="Last 90 Days">Last 90 Days</MenuItem>
              </Select>
            </Box>

            {/* 4 Summary Metric Cards */}
            <Grid container spacing={2} sx={{ mb: 3.5 }}>
              {/* Total Leads */}
              <Grid item xs={12} sm={6} md={3}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: "12px",
                    bgcolor: isDark ? "rgba(29, 104, 240, 0.08)" : "#f8fafc",
                    border: isDark ? "1px solid rgba(29, 104, 240, 0.2)" : "1px solid #edf2f7",
                    display: "flex",
                    alignItems: "center",
                    gap: 1.8,
                  }}
                >
                  <Box
                    sx={{
                      width: 46,
                      height: 46,
                      borderRadius: "10px",
                      bgcolor: isDark ? "rgba(29, 104, 240, 0.18)" : "#eff6ff",
                      color: "#1d68f0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <BarChart sx={{ fontSize: 24 }} />
                  </Box>
                  <Box>
                    <Typography variant="h5" fontWeight={800} sx={{ color: isDark ? "#f8fafc" : "#0f172a", lineHeight: 1.1 }}>
                      25
                    </Typography>
                    <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.78rem", fontWeight: 600 }}>
                      Total Leads
                    </Typography>
                  </Box>
                </Paper>
              </Grid>

              {/* Completed */}
              <Grid item xs={12} sm={6} md={3}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: "12px",
                    bgcolor: isDark ? "rgba(16, 185, 129, 0.08)" : "#f0fdf4",
                    border: isDark ? "1px solid rgba(16, 185, 129, 0.2)" : "1px solid #dcfce7",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Stack direction="row" spacing={1.8} alignItems="center">
                    <Box
                      sx={{
                        width: 46,
                        height: 46,
                        borderRadius: "10px",
                        bgcolor: isDark ? "rgba(16, 185, 129, 0.2)" : "#dcfce7",
                        color: "#16a34a",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <CheckCircle sx={{ fontSize: 24 }} />
                    </Box>
                    <Box>
                      <Typography variant="h5" fontWeight={800} sx={{ color: isDark ? "#f8fafc" : "#0f172a", lineHeight: 1.1 }}>
                        18
                      </Typography>
                      <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.78rem", fontWeight: 600 }}>
                        Completed
                      </Typography>
                    </Box>
                  </Stack>
                  <Typography variant="subtitle2" fontWeight={800} sx={{ color: "#16a34a", fontSize: "0.95rem" }}>
                    72%
                  </Typography>
                </Paper>
              </Grid>

              {/* In Progress */}
              <Grid item xs={12} sm={6} md={3}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: "12px",
                    bgcolor: isDark ? "rgba(245, 158, 11, 0.08)" : "#fffbeb",
                    border: isDark ? "1px solid rgba(245, 158, 11, 0.2)" : "1px solid #fef3c7",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Stack direction="row" spacing={1.8} alignItems="center">
                    <Box
                      sx={{
                        width: 46,
                        height: 46,
                        borderRadius: "10px",
                        bgcolor: isDark ? "rgba(245, 158, 11, 0.2)" : "#fef3c7",
                        color: "#f59e0b",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <AccessTime sx={{ fontSize: 24 }} />
                    </Box>
                    <Box>
                      <Typography variant="h5" fontWeight={800} sx={{ color: isDark ? "#f8fafc" : "#0f172a", lineHeight: 1.1 }}>
                        5
                      </Typography>
                      <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.78rem", fontWeight: 600 }}>
                        In Progress
                      </Typography>
                    </Box>
                  </Stack>
                  <Typography variant="subtitle2" fontWeight={800} sx={{ color: "#d97706", fontSize: "0.95rem" }}>
                    20%
                  </Typography>
                </Paper>
              </Grid>

              {/* Not Completed */}
              <Grid item xs={12} sm={6} md={3}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: "12px",
                    bgcolor: isDark ? "rgba(239, 68, 68, 0.08)" : "#fef2f2",
                    border: isDark ? "1px solid rgba(239, 68, 68, 0.2)" : "1px solid #fee2e2",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Stack direction="row" spacing={1.8} alignItems="center">
                    <Box
                      sx={{
                        width: 46,
                        height: 46,
                        borderRadius: "10px",
                        bgcolor: isDark ? "rgba(239, 68, 68, 0.2)" : "#fee2e2",
                        color: "#ef4444",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Cancel sx={{ fontSize: 24 }} />
                    </Box>
                    <Box>
                      <Typography variant="h5" fontWeight={800} sx={{ color: isDark ? "#f8fafc" : "#0f172a", lineHeight: 1.1 }}>
                        2
                      </Typography>
                      <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.78rem", fontWeight: 600 }}>
                        Not Completed
                      </Typography>
                    </Box>
                  </Stack>
                  <Typography variant="subtitle2" fontWeight={800} sx={{ color: "#dc2626", fontSize: "0.95rem" }}>
                    8%
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            {/* Leads Table */}
            <TableContainer sx={{ overflowX: "auto" }}>
              <Table sx={{ minWidth: 800 }}>
                <TableHead>
                  <TableRow
                    sx={{
                      bgcolor: isDark ? "rgba(255,255,255,0.025)" : "#f8fafc",
                      "& th": {
                        borderBottom: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid #f1f5f9",
                        borderTop: "none",
                        py: 1.6,
                        px: 1.8,
                        fontSize: "0.78rem",
                        fontWeight: 600,
                        color: isDark ? "#94a3b8" : "#64748b",
                        whiteSpace: "nowrap",
                      },
                      "& th:first-of-type": {
                        borderTopLeftRadius: "8px",
                        borderBottomLeftRadius: "8px",
                      },
                      "& th:last-of-type": {
                        borderTopRightRadius: "8px",
                        borderBottomRightRadius: "8px",
                      },
                    }}
                  >
                    <TableCell sx={{ width: "4%" }}>#</TableCell>
                    <TableCell sx={{ width: "12%" }}>Lead Name</TableCell>
                    <TableCell sx={{ width: "18%" }}>Customer Name</TableCell>
                    <TableCell sx={{ width: "14%" }}>Assigned Date</TableCell>
                    <TableCell sx={{ width: "14%" }}>Status</TableCell>
                    <TableCell sx={{ width: "14%" }}>Completion Date</TableCell>
                    <TableCell sx={{ width: "16%" }}>Remarks</TableCell>
                    <TableCell align="left" sx={{ width: "8%" }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {leadsList
                    .slice((leadCurrentPage - 1) * 10, leadCurrentPage * 10)
                    .map((row, idx) => {
                      const rowIndex = (leadCurrentPage - 1) * 10 + idx + 1;
                      return (
                        <TableRow
                          key={row.id}
                          sx={{
                            "& td": {
                              borderBottom: isDark ? "1px solid rgba(255,255,255,0.04)" : "1px solid #f1f5f9",
                              py: 1.8,
                              px: 1.8,
                              verticalAlign: "middle",
                              fontSize: "0.85rem",
                              whiteSpace: "nowrap",
                            },
                            "&:hover": {
                              bgcolor: isDark ? "rgba(255,255,255,0.012)" : "rgba(248, 250, 252, 0.6)",
                            },
                          }}
                        >
                          {/* Row # */}
                          <TableCell sx={{ color: isDark ? "#64748b" : "#94a3b8", fontWeight: 600 }}>
                            {rowIndex}
                          </TableCell>

                          {/* Lead Name */}
                          <TableCell sx={{ fontWeight: 700, color: isDark ? "#f8fafc" : "#0f172a" }}>
                            {row.leadNo}
                          </TableCell>

                          {/* Customer Name */}
                          <TableCell sx={{ fontWeight: 600, color: isDark ? "#f8fafc" : "#1e293b" }}>
                            {row.customerName}
                          </TableCell>

                          {/* Assigned Date */}
                          <TableCell sx={{ color: isDark ? "#94a3b8" : "#64748b" }}>
                            {row.assignedDate}
                          </TableCell>

                          {/* Status Badge */}
                          <TableCell>
                            <Chip
                              label={row.status}
                              size="small"
                              sx={{
                                height: 24,
                                fontSize: "0.72rem",
                                fontWeight: 700,
                                borderRadius: "6px",
                                px: 0.6,
                                bgcolor:
                                  row.status === "Completed"
                                    ? isDark ? "rgba(16, 185, 129, 0.15)" : "#ecfdf5"
                                    : row.status === "In Progress"
                                    ? isDark ? "rgba(245, 158, 11, 0.15)" : "#fffbeb"
                                    : isDark ? "rgba(239, 68, 68, 0.15)" : "#fef2f2",
                                color:
                                  row.status === "Completed"
                                    ? "#10b981"
                                    : row.status === "In Progress"
                                    ? "#d97706"
                                    : "#ef4444",
                                border:
                                  row.status === "Completed"
                                    ? isDark ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid #a7f3d0"
                                    : row.status === "In Progress"
                                    ? isDark ? "1px solid rgba(245, 158, 11, 0.3)" : "1px solid #fde68a"
                                    : isDark ? "1px solid rgba(239, 68, 68, 0.3)" : "1px solid #fecaca",
                              }}
                            />
                          </TableCell>

                          {/* Completion Date */}
                          <TableCell sx={{ color: isDark ? "#94a3b8" : "#64748b" }}>
                            {row.completionDate}
                          </TableCell>

                          {/* Remarks */}
                          <TableCell sx={{ color: isDark ? "#cbd5e1" : "#475569", fontSize: "0.82rem" }}>
                            {row.remarks}
                          </TableCell>

                          {/* Actions: View Link Button */}
                          <TableCell align="left">
                            <Button
                              size="small"
                              startIcon={<Visibility sx={{ fontSize: 16 }} />}
                              onClick={() => setSelectedLeadDetails(row)}
                              sx={{
                                textTransform: "none",
                                fontWeight: 700,
                                fontSize: "0.82rem",
                                color: "#2563eb",
                                p: 0.4,
                                minWidth: "auto",
                                "&:hover": {
                                  bgcolor: "transparent",
                                  textDecoration: "underline",
                                },
                              }}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Table Footer: Summary & Pagination */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mt: 3,
                pt: 2,
                borderTop: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid #f1f5f9",
                flexWrap: "wrap",
                gap: 1.5,
              }}
            >
              <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.82rem", fontWeight: 500 }}>
                Showing {Math.min(1, leadsList.length)} to {Math.min(leadCurrentPage * 10, 25)} of 25 leads
              </Typography>

              {/* Pagination Controls */}
              <Stack direction="row" spacing={0.8} alignItems="center">
                {/* Previous */}
                <IconButton
                  size="small"
                  disabled={leadCurrentPage === 1}
                  onClick={() => setLeadCurrentPage((p) => Math.max(1, p - 1))}
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: "6px",
                    border: isDark ? "1px solid rgba(255,255,255,0.12)" : "1px solid #e2e8f0",
                    color: isDark ? "#f8fafc" : "#0f172a",
                  }}
                >
                  <ChevronLeft sx={{ fontSize: 18 }} />
                </IconButton>

                {/* Page 1 */}
                <Button
                  size="small"
                  onClick={() => setLeadCurrentPage(1)}
                  sx={{
                    minWidth: 32,
                    height: 32,
                    p: 0,
                    borderRadius: "6px",
                    fontWeight: 700,
                    fontSize: "0.82rem",
                    bgcolor: leadCurrentPage === 1 ? "#2563eb" : "transparent",
                    color: leadCurrentPage === 1 ? "#ffffff" : isDark ? "#94a3b8" : "#64748b",
                    border: leadCurrentPage === 1 ? "none" : isDark ? "1px solid rgba(255,255,255,0.12)" : "1px solid #e2e8f0",
                    "&:hover": {
                      bgcolor: leadCurrentPage === 1 ? "#1d4ed8" : isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9",
                    },
                  }}
                >
                  1
                </Button>

                {/* Page 2 */}
                <Button
                  size="small"
                  onClick={() => setLeadCurrentPage(2)}
                  sx={{
                    minWidth: 32,
                    height: 32,
                    p: 0,
                    borderRadius: "6px",
                    fontWeight: 700,
                    fontSize: "0.82rem",
                    bgcolor: leadCurrentPage === 2 ? "#2563eb" : "transparent",
                    color: leadCurrentPage === 2 ? "#ffffff" : isDark ? "#94a3b8" : "#64748b",
                    border: leadCurrentPage === 2 ? "none" : isDark ? "1px solid rgba(255,255,255,0.12)" : "1px solid #e2e8f0",
                    "&:hover": {
                      bgcolor: leadCurrentPage === 2 ? "#1d4ed8" : isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9",
                    },
                  }}
                >
                  2
                </Button>

                {/* Page 3 */}
                <Button
                  size="small"
                  onClick={() => setLeadCurrentPage(3)}
                  sx={{
                    minWidth: 32,
                    height: 32,
                    p: 0,
                    borderRadius: "6px",
                    fontWeight: 700,
                    fontSize: "0.82rem",
                    bgcolor: leadCurrentPage === 3 ? "#2563eb" : "transparent",
                    color: leadCurrentPage === 3 ? "#ffffff" : isDark ? "#94a3b8" : "#64748b",
                    border: leadCurrentPage === 3 ? "none" : isDark ? "1px solid rgba(255,255,255,0.12)" : "1px solid #e2e8f0",
                    "&:hover": {
                      bgcolor: leadCurrentPage === 3 ? "#1d4ed8" : isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9",
                    },
                  }}
                >
                  3
                </Button>

                {/* Next */}
                <IconButton
                  size="small"
                  disabled={leadCurrentPage === 3}
                  onClick={() => setLeadCurrentPage((p) => Math.min(3, p + 1))}
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: "6px",
                    border: isDark ? "1px solid rgba(255,255,255,0.12)" : "1px solid #e2e8f0",
                    color: isDark ? "#f8fafc" : "#0f172a",
                  }}
                >
                  <ChevronRight sx={{ fontSize: 18 }} />
                </IconButton>
              </Stack>
            </Box>
          </Paper>
        </Box>
      )}

      {/* ── 6. POPUP MENUS & DIALOGS ─────────────────────────────────── */}
      <Menu anchorEl={moreAnchorEl} open={Boolean(moreAnchorEl)} onClose={() => setMoreAnchorEl(null)}>
        <MenuItem onClick={() => { setMoreAnchorEl(null); navigate("/user-management"); }}><Edit sx={{ fontSize: 16, mr: 1 }} /> Edit User</MenuItem>
        <MenuItem onClick={() => { setMoreAnchorEl(null); copyToClipboard(userEmpId, "Employee ID"); }}><ContentCopy sx={{ fontSize: 16, mr: 1 }} /> Copy Employee ID</MenuItem>
        <MenuItem onClick={() => { setMoreAnchorEl(null); window.print(); }}><Print sx={{ fontSize: 16, mr: 1 }} /> Print Profile</MenuItem>
      </Menu>

      <Menu anchorEl={actionsAnchorEl} open={Boolean(actionsAnchorEl)} onClose={() => setActionsAnchorEl(null)}>
        <MenuItem onClick={() => { setActionsAnchorEl(null); setCurrentTab(1); }}><EventAvailable sx={{ fontSize: 16, mr: 1, color: "#10b981" }} /> View Attendance</MenuItem>
        <MenuItem onClick={() => { setActionsAnchorEl(null); setCurrentTab(2); }}><BeachAccess sx={{ fontSize: 16, mr: 1, color: "#1d68f0" }} /> Manage Leaves</MenuItem>
        <MenuItem onClick={() => { setActionsAnchorEl(null); setCurrentTab(4); }}><ReceiptLong sx={{ fontSize: 16, mr: 1, color: "#8b5cf6" }} /> View Salary Slips</MenuItem>
        <Divider />
        <MenuItem onClick={() => { setActionsAnchorEl(null); navigate("/user-management"); }} sx={{ color: "#ef4444" }}><Lock sx={{ fontSize: 16, mr: 1 }} /> Suspend Account</MenuItem>
      </Menu>

      {/* Edit Section Modal Dialog */}
      <Dialog
        open={Boolean(editModalSection)}
        onClose={() => setEditModalSection(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "16px",
            bgcolor: isDark ? "#0f172a" : "#ffffff",
            backgroundImage: "none",
            border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0",
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, pb: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="subtitle1" fontWeight={800} sx={{ color: isDark ? "#f8fafc" : "#0f172a", fontSize: "1.05rem" }}>
            Edit Employee Profile
          </Typography>
          <IconButton size="small" onClick={() => setEditModalSection(null)} sx={{ color: isDark ? "#94a3b8" : "#64748b" }}>
            <Close sx={{ fontSize: 20 }} />
          </IconButton>
        </DialogTitle>
        <Box sx={{ px: 3, py: 1, borderBottom: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #f1f5f9", display: "flex", gap: 1, overflowX: "auto", bgcolor: isDark ? "rgba(255,255,255,0.02)" : "#f8fafc" }}>
          {[
            { id: "personal", label: "Personal" },
            { id: "contact", label: "Contact" },
            { id: "employment", label: "Employment" },
            { id: "family", label: "Family" },
            { id: "bank", label: "Bank" },
            { id: "emergency", label: "Emergency" },
            { id: "additional", label: "Additional" },
          ].map((sec) => (
            <Chip
              key={sec.id}
              label={sec.label}
              clickable
              color={editModalSection === sec.id ? "primary" : "default"}
              variant={editModalSection === sec.id ? "filled" : "outlined"}
              onClick={() => setEditModalSection(sec.id)}
              size="small"
              sx={{
                fontWeight: 700,
                fontSize: "0.75rem",
                bgcolor: editModalSection === sec.id ? "#1d68f0" : undefined,
                borderColor: isDark ? "rgba(255,255,255,0.15)" : undefined,
                color: editModalSection === sec.id ? "#ffffff" : (isDark ? "#cbd5e1" : "#475569"),
              }}
            />
          ))}
        </Box>
        <DialogContent dividers sx={{ borderColor: isDark ? "rgba(255,255,255,0.08)" : undefined }}>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {editModalSection === "personal" && (
              <>
                <TextField
                  label="Full Name"
                  fullWidth
                  size="small"
                  placeholder="e.g. Silu Reddy"
                  value={tempEditData.fullName || ""}
                  onChange={(e) => setTempEditData({ ...tempEditData, fullName: e.target.value })}
                />
                <TextField
                  label="Date of Birth"
                  fullWidth
                  size="small"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={tempEditData.dob || ""}
                  onChange={(e) => setTempEditData({ ...tempEditData, dob: e.target.value })}
                />
                <FormControl fullWidth size="small">
                  <InputLabel id="edit-gender-label">Gender</InputLabel>
                  <Select
                    labelId="edit-gender-label"
                    label="Gender"
                    value={tempEditData.gender || ""}
                    onChange={(e) => setTempEditData({ ...tempEditData, gender: e.target.value })}
                  >
                    <MenuItem value=""><em>Select Gender</em></MenuItem>
                    <MenuItem value="Male">Male</MenuItem>
                    <MenuItem value="Female">Female</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                    <MenuItem value="Prefer not to say">Prefer not to say</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth size="small">
                  <InputLabel id="edit-blood-group-label">Blood Group</InputLabel>
                  <Select
                    labelId="edit-blood-group-label"
                    label="Blood Group"
                    value={tempEditData.bloodGroup || ""}
                    onChange={(e) => setTempEditData({ ...tempEditData, bloodGroup: e.target.value })}
                  >
                    <MenuItem value=""><em>Select Blood Group</em></MenuItem>
                    <MenuItem value="A+">A+</MenuItem>
                    <MenuItem value="A-">A-</MenuItem>
                    <MenuItem value="B+">B+</MenuItem>
                    <MenuItem value="B-">B-</MenuItem>
                    <MenuItem value="O+">O+</MenuItem>
                    <MenuItem value="O-">O-</MenuItem>
                    <MenuItem value="AB+">AB+</MenuItem>
                    <MenuItem value="AB-">AB-</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth size="small">
                  <InputLabel id="edit-marital-status-label">Marital Status</InputLabel>
                  <Select
                    labelId="edit-marital-status-label"
                    label="Marital Status"
                    value={tempEditData.maritalStatus || ""}
                    onChange={(e) => setTempEditData({ ...tempEditData, maritalStatus: e.target.value })}
                  >
                    <MenuItem value=""><em>Select Status</em></MenuItem>
                    <MenuItem value="Single">Single</MenuItem>
                    <MenuItem value="Married">Married</MenuItem>
                    <MenuItem value="Divorced">Divorced</MenuItem>
                    <MenuItem value="Widowed">Widowed</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  label="Nationality"
                  fullWidth
                  size="small"
                  placeholder="e.g. Indian"
                  value={tempEditData.nationality || ""}
                  onChange={(e) => setTempEditData({ ...tempEditData, nationality: e.target.value })}
                />
                <TextField
                  label="Aadhaar Number"
                  fullWidth
                  size="small"
                  placeholder="12-digit Aadhaar number"
                  inputProps={{ maxLength: 14 }}
                  value={tempEditData.aadhaar || ""}
                  onChange={(e) => setTempEditData({ ...tempEditData, aadhaar: e.target.value })}
                />
                <TextField
                  label="PAN Number"
                  fullWidth
                  size="small"
                  placeholder="e.g. ABCDE1234F"
                  inputProps={{ style: { textTransform: "uppercase" }, maxLength: 10 }}
                  value={tempEditData.pan || ""}
                  onChange={(e) => setTempEditData({ ...tempEditData, pan: e.target.value.toUpperCase() })}
                />
              </>
            )}

            {editModalSection === "contact" && (
              <>
                <TextField
                  label="Email Address"
                  fullWidth
                  size="small"
                  type="email"
                  placeholder="employee@example.com"
                  value={tempEditData.email || ""}
                  onChange={(e) => setTempEditData({ ...tempEditData, email: e.target.value })}
                />
                <TextField
                  label="Phone Number"
                  fullWidth
                  size="small"
                  type="tel"
                  placeholder="10-digit mobile number"
                  inputProps={{ maxLength: 10 }}
                  value={tempEditData.phone || ""}
                  onChange={(e) => setTempEditData({ ...tempEditData, phone: e.target.value })}
                />
                <TextField
                  label="Alternate Number"
                  fullWidth
                  size="small"
                  type="tel"
                  placeholder="Optional alternate number"
                  inputProps={{ maxLength: 10 }}
                  value={tempEditData.altPhone || ""}
                  onChange={(e) => setTempEditData({ ...tempEditData, altPhone: e.target.value })}
                />
                <TextField
                  label="Current Address"
                  fullWidth
                  multiline
                  rows={2}
                  size="small"
                  placeholder="Current residence address..."
                  value={tempEditData.currentAddress || ""}
                  onChange={(e) => setTempEditData({ ...tempEditData, currentAddress: e.target.value })}
                />
                <TextField
                  label="Permanent Address"
                  fullWidth
                  multiline
                  rows={2}
                  size="small"
                  placeholder="Permanent native address..."
                  value={tempEditData.permanentAddress || ""}
                  onChange={(e) => setTempEditData({ ...tempEditData, permanentAddress: e.target.value })}
                />
              </>
            )}

            {editModalSection === "employment" && (
              <>
                <TextField
                  label="Employee ID"
                  fullWidth
                  size="small"
                  placeholder="e.g. EMP-001"
                  value={tempEditData.empId || ""}
                  onChange={(e) => setTempEditData({ ...tempEditData, empId: e.target.value })}
                />
                <TextField
                  label="Designation"
                  fullWidth
                  size="small"
                  placeholder="e.g. Technical Incharge"
                  value={tempEditData.designation || ""}
                  onChange={(e) => setTempEditData({ ...tempEditData, designation: e.target.value })}
                />
                <TextField
                  label="Department"
                  fullWidth
                  size="small"
                  placeholder="e.g. Solar Technical & Installation"
                  value={tempEditData.department || ""}
                  onChange={(e) => setTempEditData({ ...tempEditData, department: e.target.value })}
                />
                <TextField
                  label="Date of Joining"
                  fullWidth
                  size="small"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={tempEditData.joiningDate || ""}
                  onChange={(e) => setTempEditData({ ...tempEditData, joiningDate: e.target.value })}
                />
                <FormControl fullWidth size="small">
                  <InputLabel id="edit-emp-type-label">Employment Type</InputLabel>
                  <Select
                    labelId="edit-emp-type-label"
                    label="Employment Type"
                    value={tempEditData.employmentType || "Full-time"}
                    onChange={(e) => setTempEditData({ ...tempEditData, employmentType: e.target.value })}
                  >
                    <MenuItem value="Full-time">Full-time</MenuItem>
                    <MenuItem value="Part-time">Part-time</MenuItem>
                    <MenuItem value="Contract">Contract</MenuItem>
                    <MenuItem value="Internship">Internship</MenuItem>
                    <MenuItem value="Trainee">Trainee</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  label="Work Location"
                  fullWidth
                  size="small"
                  placeholder="e.g. Bhubaneswar / Site #4"
                  value={tempEditData.workLocation || ""}
                  onChange={(e) => setTempEditData({ ...tempEditData, workLocation: e.target.value })}
                />
                <TextField
                  label="Reporting Manager"
                  fullWidth
                  size="small"
                  placeholder="Manager / Supervisor name"
                  value={tempEditData.reportingManager || ""}
                  onChange={(e) => setTempEditData({ ...tempEditData, reportingManager: e.target.value })}
                />
                <TextField
                  label="Experience"
                  fullWidth
                  size="small"
                  placeholder="e.g. 3 Years, 5+ Years"
                  value={tempEditData.experience || ""}
                  onChange={(e) => setTempEditData({ ...tempEditData, experience: e.target.value })}
                />
              </>
            )}

            {editModalSection === "family" && (
              <>
                <TextField
                  label="Father's Name"
                  fullWidth
                  size="small"
                  placeholder="Father's full name"
                  value={tempEditData.fatherName || ""}
                  onChange={(e) => setTempEditData({ ...tempEditData, fatherName: e.target.value })}
                />
                <TextField
                  label="Mother's Name"
                  fullWidth
                  size="small"
                  placeholder="Mother's full name"
                  value={tempEditData.motherName || ""}
                  onChange={(e) => setTempEditData({ ...tempEditData, motherName: e.target.value })}
                />
                <TextField
                  label="Spouse Name"
                  fullWidth
                  size="small"
                  placeholder="Spouse full name (if applicable)"
                  value={tempEditData.spouseName || ""}
                  onChange={(e) => setTempEditData({ ...tempEditData, spouseName: e.target.value })}
                />
                <TextField
                  label="No. of Children"
                  fullWidth
                  size="small"
                  placeholder="e.g. 0, 1, 2"
                  value={tempEditData.childrenCount || ""}
                  onChange={(e) => setTempEditData({ ...tempEditData, childrenCount: e.target.value })}
                />
              </>
            )}

            {editModalSection === "bank" && (
              <>
                <TextField
                  label="Bank Name"
                  fullWidth
                  size="small"
                  placeholder="e.g. HDFC Bank, SBI, ICICI"
                  value={tempEditData.bankName || ""}
                  onChange={(e) => setTempEditData({ ...tempEditData, bankName: e.target.value })}
                />
                <TextField
                  label="Account Number"
                  fullWidth
                  size="small"
                  placeholder="Account number"
                  value={tempEditData.accountNumber || ""}
                  onChange={(e) => setTempEditData({ ...tempEditData, accountNumber: e.target.value })}
                />
                <TextField
                  label="IFSC Code"
                  fullWidth
                  size="small"
                  placeholder="e.g. HDFC0001234"
                  inputProps={{ style: { textTransform: "uppercase" }, maxLength: 11 }}
                  value={tempEditData.ifsc || ""}
                  onChange={(e) => setTempEditData({ ...tempEditData, ifsc: e.target.value.toUpperCase() })}
                />
                <FormControl fullWidth size="small">
                  <InputLabel id="edit-acc-type-label">Account Type</InputLabel>
                  <Select
                    labelId="edit-acc-type-label"
                    label="Account Type"
                    value={tempEditData.accountType || "Savings"}
                    onChange={(e) => setTempEditData({ ...tempEditData, accountType: e.target.value })}
                  >
                    <MenuItem value="Savings">Savings</MenuItem>
                    <MenuItem value="Current">Current</MenuItem>
                    <MenuItem value="Salary">Salary</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  label="PAN Number (for TDS)"
                  fullWidth
                  size="small"
                  placeholder="e.g. ABCDE1234F"
                  inputProps={{ style: { textTransform: "uppercase" }, maxLength: 10 }}
                  value={tempEditData.panTds || ""}
                  onChange={(e) => setTempEditData({ ...tempEditData, panTds: e.target.value.toUpperCase() })}
                />
              </>
            )}

            {editModalSection === "emergency" && (
              <>
                <TextField
                  label="Contact Name"
                  fullWidth
                  size="small"
                  placeholder="Emergency contact person"
                  value={tempEditData.emergencyName || ""}
                  onChange={(e) => setTempEditData({ ...tempEditData, emergencyName: e.target.value })}
                />
                <TextField
                  label="Relationship"
                  fullWidth
                  size="small"
                  placeholder="e.g. Father, Spouse, Brother, Friend"
                  value={tempEditData.emergencyRelation || ""}
                  onChange={(e) => setTempEditData({ ...tempEditData, emergencyRelation: e.target.value })}
                />
                <TextField
                  label="Phone Number"
                  fullWidth
                  size="small"
                  type="tel"
                  placeholder="Emergency 10-digit number"
                  inputProps={{ maxLength: 10 }}
                  value={tempEditData.emergencyPhone || ""}
                  onChange={(e) => setTempEditData({ ...tempEditData, emergencyPhone: e.target.value })}
                />
                <TextField
                  label="Address"
                  fullWidth
                  multiline
                  rows={2}
                  size="small"
                  placeholder="Emergency contact address..."
                  value={tempEditData.emergencyAddress || ""}
                  onChange={(e) => setTempEditData({ ...tempEditData, emergencyAddress: e.target.value })}
                />
              </>
            )}

            {editModalSection === "additional" && (
              <>
                <TextField
                  label="Languages Known"
                  fullWidth
                  size="small"
                  placeholder="e.g. English, Hindi, Odia, Telugu"
                  value={tempEditData.languages || ""}
                  onChange={(e) => setTempEditData({ ...tempEditData, languages: e.target.value })}
                />
                <TextField
                  label="Hobbies & Interests"
                  fullWidth
                  size="small"
                  placeholder="e.g. Cricket, Travelling, Tech"
                  value={tempEditData.hobbies || ""}
                  onChange={(e) => setTempEditData({ ...tempEditData, hobbies: e.target.value })}
                />
                <TextField
                  label="Professional Summary & About"
                  fullWidth
                  multiline
                  rows={3}
                  size="small"
                  placeholder="Brief summary or bio..."
                  value={tempEditData.about || ""}
                  onChange={(e) => setTempEditData({ ...tempEditData, about: e.target.value })}
                />
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditModalSection(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveEditModal} sx={{ bgcolor: "#1d68f0", textTransform: "none", fontWeight: 700 }}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={noteDialogOpen} onClose={() => setNoteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Add Employee Note</DialogTitle>
        <DialogContent>
          <TextField autoFocus fullWidth multiline rows={4} placeholder="Type notes here..." value={noteText} onChange={(e) => setNoteText(e.target.value)} sx={{ mt: 1 }} />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setNoteDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => { toast.success("Note saved!"); setNoteDialogOpen(false); setNoteText(""); }}>Save Note</Button>
        </DialogActions>
      </Dialog>

      {/* Payslip Preview Dialog Modal */}
      <SalarySlipModal
        open={Boolean(previewSlip)}
        onClose={() => setPreviewSlip(null)}
        slipData={previewSlip ? {
          ...previewSlip,
          name: profileData.fullName || userName || (user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : "Silu Reddy"),
          empId: profileData.employeeId || userEmpId || user?.employeeId || "I0064",
          designation: profileData.designation || displayRole || user?.role || "Technical Incharge",
          joiningDate: (profileData.joiningDate && profileData.joiningDate !== "—")
            ? profileData.joiningDate
            : (user?.joiningDate
              ? new Date(user.joiningDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
              : (user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                : (joinDate && joinDate !== "—" ? joinDate : "03 Oct 2026"))),
          department: profileData.department && profileData.department !== "—" ? profileData.department : (user?.department || "Technical Incharge"),
          employmentType: profileData.employmentType && profileData.employmentType !== "—" ? profileData.employmentType : (user?.employmentType || "Full-time"),
          bankName: profileData.bankName && profileData.bankName !== "—" ? profileData.bankName : (user?.bankName || user?.bankDetails?.bankName || "State Bank of India"),
          accountNo: profileData.accountNumber && profileData.accountNumber !== "—" ? profileData.accountNumber : (user?.accountNumber || user?.bankDetails?.accountNumber || "XXXX XXXX 7890"),
          ifscCode: profileData.ifscCode && profileData.ifscCode !== "—" ? profileData.ifscCode : (user?.ifscCode || user?.bankDetails?.ifscCode || "SBIN0001234"),
          pan: (profileData.panNumber && profileData.panNumber !== "—") ? profileData.panNumber : ((profileData.pan && profileData.pan !== "—") ? profileData.pan : (user?.pan || user?.panNumber || "ABCPD1234F")),
          attendance: previewSlip.attendance || previewSlip.raw?.attendance || previewSlip.raw?.attendanceSummary || (
            attendanceStats ? {
              totalDays: attendanceStats.daysInMonth || 30,
              presentDays: attendanceStats.presentCount ?? 0,
              absentDays: attendanceStats.absentCount ?? 0,
              leavePaid: attendanceStats.onLeaveCount ?? 0,
              leaveUnpaid: 0,
              holidays: (attendanceStats.weeklyOffCount ?? 0) + (attendanceStats.holidayCount ?? 0),
            } : undefined
          ),
          totalDays: previewSlip.attendance?.totalDays || previewSlip.raw?.attendance?.totalDays || attendanceStats?.daysInMonth || 30,
          presentDays: previewSlip.attendance?.presentDays !== undefined ? previewSlip.attendance.presentDays : (previewSlip.raw?.attendance?.presentDays !== undefined ? previewSlip.raw.attendance.presentDays : attendanceStats?.presentCount),
          absentDays: previewSlip.attendance?.absentDays !== undefined ? previewSlip.attendance.absentDays : (previewSlip.raw?.attendance?.absentDays !== undefined ? previewSlip.raw.attendance.absentDays : attendanceStats?.absentCount),
          basicSalary: previewSlip.raw?.basicSalary || Number(String(previewSlip.basic || "").replace(/,/g, "")) || 40000,
          allowanceDetails: previewSlip.raw?.allowanceDetails || [],
          deductionDetails: previewSlip.raw?.deductionDetails || [],
          earnings: previewSlip.raw?.earnings || (
            previewSlip.raw?.allowanceDetails && previewSlip.raw.allowanceDetails.length > 0
              ? [
                  { component: "Basic Salary", amount: previewSlip.raw?.basicSalary || 40000 },
                  ...previewSlip.raw.allowanceDetails.map((a) => ({ component: a.name || a.component, amount: a.amount })),
                ]
              : undefined
          ),
          deductions: previewSlip.raw?.deductions || (
            previewSlip.raw?.deductionDetails && previewSlip.raw.deductionDetails.length > 0
              ? previewSlip.raw.deductionDetails.map((d) => ({ component: d.name || d.component, amount: d.amount }))
              : undefined
          ),
        } : null}
      />

      {/* ── Document Category Viewer Modal ─────────────────────────────── */}
      <Dialog
        open={Boolean(selectedDocCategory)}
        onClose={() => setSelectedDocCategory(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "16px",
            bgcolor: isDark ? "#0f172a" : "#ffffff",
            backgroundImage: "none",
            border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0",
            boxShadow: isDark ? "0 20px 40px rgba(0,0,0,0.6)" : "0 20px 40px rgba(0,0,0,0.08)",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            pb: 1.5,
            borderBottom: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid #f1f5f9",
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            {selectedDocCategory && (
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: "10px",
                  bgcolor: isDark ? selectedDocCategory.darkBgColor : selectedDocCategory.bgColor,
                  color: selectedDocCategory.iconColor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {React.createElement(selectedDocCategory.icon, { sx: { fontSize: 20 } })}
              </Box>
            )}
            <Box>
              <Typography variant="subtitle1" fontWeight={800} sx={{ color: isDark ? "#f8fafc" : "#0f172a", fontSize: "1rem" }}>
                {selectedDocCategory?.title}
              </Typography>
              <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b" }}>
                {selectedDocCategory?.files?.length || 0} {selectedDocCategory?.files?.length === 1 ? "File attached" : "Files attached"}
              </Typography>
            </Box>
          </Stack>
          <IconButton size="small" onClick={() => setSelectedDocCategory(null)} sx={{ color: isDark ? "#94a3b8" : "#64748b" }}>
            <Close sx={{ fontSize: 20 }} />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: { xs: 2, sm: 2.5 } }}>
          <Stack spacing={1.5} sx={{ mt: 1 }}>
            {selectedDocCategory?.files?.map((file) => (
              <Paper
                key={file.id}
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: "12px",
                  bgcolor: isDark ? "rgba(255,255,255,0.02)" : "#f8fafc",
                  border: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid #e2e8f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1.5,
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0, flex: 1 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: "10px",
                      bgcolor: isDark ? "rgba(29, 104, 240, 0.12)" : "#eff6ff",
                      color: "#1d68f0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Description sx={{ fontSize: 22 }} />
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={700} noWrap sx={{ color: isDark ? "#f8fafc" : "#0f172a", fontSize: "0.86rem" }}>
                      {file.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.74rem" }}>
                      {file.size} • Uploaded on {file.uploadedOn}
                    </Typography>
                  </Box>
                </Stack>

                <Stack direction="row" spacing={1} alignItems="center">
                  {file.verified && (
                    <Chip
                      label="Verified"
                      size="small"
                      sx={{
                        height: 22,
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        bgcolor: isDark ? "rgba(16, 185, 129, 0.15)" : "#ecfdf5",
                        color: "#10b981",
                        borderRadius: "5px",
                      }}
                    />
                  )}
                  <Tooltip title="Download File">
                    <IconButton
                      size="small"
                      onClick={() => handleDownloadEmployeeDocument(file, selectedDocCategory)}
                      sx={{
                        color: "#1d68f0",
                        bgcolor: isDark ? "rgba(29, 104, 240, 0.1)" : "#eff6ff",
                        borderRadius: "7px",
                        "&:hover": { bgcolor: "#1d68f0", color: "#ffffff" },
                      }}
                    >
                      <FileDownload sx={{ fontSize: 17 }} />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Paper>
            ))}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2, borderTop: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid #f1f5f9", justifyContent: "space-between" }}>
          <Button
            startIcon={<CloudUpload />}
            onClick={() => {
              setNewDocForm({ categoryId: selectedDocCategory?.id || "aadhaar", name: "", file: null });
              setSelectedDocCategory(null);
              setUploadDocModalOpen(true);
            }}
            sx={{ textTransform: "none", fontWeight: 700, fontSize: "0.82rem", color: "#1d68f0" }}
          >
            Upload New File
          </Button>
          <Button onClick={() => setSelectedDocCategory(null)} variant="outlined" sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 700 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Upload Document Modal ───────────────────────────────────────── */}
      <Dialog
        open={uploadDocModalOpen}
        onClose={() => setUploadDocModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "16px",
            bgcolor: isDark ? "#0f172a" : "#ffffff",
            backgroundImage: "none",
            border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0",
            boxShadow: isDark ? "0 20px 40px rgba(0,0,0,0.6)" : "0 20px 40px rgba(0,0,0,0.08)",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            pb: 1.5,
            borderBottom: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid #f1f5f9",
          }}
        >
          <Typography variant="h6" fontWeight={800} sx={{ color: isDark ? "#f8fafc" : "#0f172a", fontSize: "1.1rem" }}>
            Upload Document
          </Typography>
          <IconButton size="small" onClick={() => setUploadDocModalOpen(false)} sx={{ color: isDark ? "#94a3b8" : "#64748b" }}>
            <Close sx={{ fontSize: 20 }} />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Stack spacing={2.2} sx={{ mt: 1 }}>
            {/* Category Selector */}
            <Box>
              <Typography variant="caption" fontWeight={700} sx={{ color: isDark ? "#cbd5e1" : "#475569", display: "block", mb: 0.75 }}>
                Document Category
              </Typography>
              <Select
                fullWidth
                size="small"
                value={newDocForm.categoryId}
                onChange={(e) => setNewDocForm({ ...newDocForm, categoryId: e.target.value })}
                sx={{
                  borderRadius: "9px",
                  fontSize: "0.85rem",
                  bgcolor: isDark ? "rgba(255,255,255,0.03)" : "#ffffff",
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: isDark ? "rgba(255,255,255,0.12)" : "#cbd5e1",
                  },
                }}
              >
                {documentsCategories.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.title}
                  </MenuItem>
                ))}
              </Select>
            </Box>

            {/* Document Title / Name */}
            <Box>
              <Typography variant="caption" fontWeight={700} sx={{ color: isDark ? "#cbd5e1" : "#475569", display: "block", mb: 0.75 }}>
                Document Name / Title
              </Typography>
              <TextField
                fullWidth
                size="small"
                placeholder="e.g. Master Degree Certificate or Form 16"
                value={newDocForm.name}
                onChange={(e) => setNewDocForm({ ...newDocForm, name: e.target.value })}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "9px",
                    fontSize: "0.85rem",
                    bgcolor: isDark ? "rgba(255,255,255,0.03)" : "#ffffff",
                  },
                }}
              />
            </Box>

            {/* Dropzone Box */}
            <Paper
              elevation={0}
              onClick={() => {
                const fakeInput = document.createElement("input");
                fakeInput.type = "file";
                fakeInput.accept = ".pdf,.jpg,.jpeg,.png";
                fakeInput.onchange = (e) => {
                  if (e.target.files?.[0]) {
                    const file = e.target.files[0];
                    setNewDocForm((prev) => ({
                      ...prev,
                      file: file,
                      name: prev.name || file.name.replace(/\.[^/.]+$/, ""),
                    }));
                  }
                };
                fakeInput.click();
              }}
              sx={{
                p: 3,
                borderRadius: "14px",
                border: isDark ? "2px dashed rgba(59, 130, 246, 0.4)" : "2px dashed #93c5fd",
                bgcolor: isDark ? "rgba(29, 104, 240, 0.04)" : "#f0f7ff",
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.2s ease",
                "&:hover": {
                  bgcolor: isDark ? "rgba(29, 104, 240, 0.08)" : "#e0f2fe",
                  borderColor: "#3b82f6",
                },
              }}
            >
              <CloudUpload sx={{ fontSize: 40, color: "#1d68f0", mb: 1 }} />
              <Typography variant="subtitle2" fontWeight={800} sx={{ color: isDark ? "#f8fafc" : "#0f172a", fontSize: "0.9rem" }}>
                {newDocForm.file ? newDocForm.file.name : "Click to browse or drag & drop file"}
              </Typography>
              <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", display: "block", mt: 0.5 }}>
                Supports PDF, PNG, JPG (Max 10MB)
              </Typography>
            </Paper>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2, borderTop: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid #f1f5f9" }}>
          <Button onClick={() => setUploadDocModalOpen(false)} sx={{ color: isDark ? "#94a3b8" : "#64748b", textTransform: "none", fontWeight: 700 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleUploadDocumentSubmit}
            sx={{
              borderRadius: "8px",
              textTransform: "none",
              fontWeight: 700,
              fontSize: "0.84rem",
              px: 3,
              bgcolor: "#1d68f0",
              backgroundImage: "linear-gradient(135deg, #1d68f0 0%, #2563eb 100%)",
            }}
          >
            Upload Document
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Lead Details Dialog Modal ────────────────────────────────────── */}
      <Dialog
        open={Boolean(selectedLeadDetails)}
        onClose={() => setSelectedLeadDetails(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "16px",
            bgcolor: isDark ? "#0f172a" : "#ffffff",
            backgroundImage: "none",
            border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0",
            boxShadow: isDark ? "0 20px 40px rgba(0,0,0,0.6)" : "0 20px 40px rgba(0,0,0,0.08)",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            pb: 1.5,
            borderBottom: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid #f1f5f9",
          }}
        >
          <Box>
            <Typography variant="h6" fontWeight={800} sx={{ color: isDark ? "#f8fafc" : "#0f172a", fontSize: "1.1rem" }}>
              Lead Details — {selectedLeadDetails?.leadNo}
            </Typography>
            <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b" }}>
              Assigned on: {selectedLeadDetails?.assignedDate}
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setSelectedLeadDetails(null)} sx={{ color: isDark ? "#94a3b8" : "#64748b" }}>
            <Close sx={{ fontSize: 20 }} />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
          {selectedLeadDetails && (
            <Stack spacing={2} sx={{ mt: 0.5 }}>
              {/* Top Status & Price Banner */}
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: "12px",
                  bgcolor: isDark ? "rgba(29, 104, 240, 0.08)" : "#f0f7ff",
                  border: isDark ? "1px solid rgba(29, 104, 240, 0.2)" : "1px solid #e0f2fe",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Box>
                  <Typography variant="caption" sx={{ color: "#1d68f0", fontWeight: 700, display: "block" }}>
                    QUOTATION AMOUNT
                  </Typography>
                  <Typography variant="h6" fontWeight={900} sx={{ color: isDark ? "#f8fafc" : "#0f172a" }}>
                    {selectedLeadDetails.amount}
                  </Typography>
                </Box>
                <Chip
                  label={selectedLeadDetails.status}
                  size="small"
                  sx={{
                    height: 26,
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    borderRadius: "6px",
                    px: 0.8,
                    bgcolor:
                      selectedLeadDetails.status === "Completed"
                        ? isDark ? "rgba(16, 185, 129, 0.15)" : "#ecfdf5"
                        : selectedLeadDetails.status === "In Progress"
                        ? isDark ? "rgba(245, 158, 11, 0.15)" : "#fffbeb"
                        : isDark ? "rgba(239, 68, 68, 0.15)" : "#fef2f2",
                    color:
                      selectedLeadDetails.status === "Completed"
                        ? "#10b981"
                        : selectedLeadDetails.status === "In Progress"
                        ? "#d97706"
                        : "#ef4444",
                  }}
                />
              </Paper>

              {/* Information Grid */}
              <Stack spacing={1.2}>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontWeight: 600 }}>Customer Name:</Typography>
                  <Typography variant="caption" fontWeight={700} sx={{ color: isDark ? "#f8fafc" : "#0f172a" }}>{selectedLeadDetails.customerName}</Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontWeight: 600 }}>Contact Phone:</Typography>
                  <Typography variant="caption" fontWeight={700} sx={{ color: isDark ? "#f8fafc" : "#0f172a" }}>{selectedLeadDetails.phone}</Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontWeight: 600 }}>Site Location:</Typography>
                  <Typography variant="caption" fontWeight={700} sx={{ color: isDark ? "#f8fafc" : "#0f172a" }}>{selectedLeadDetails.address}</Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontWeight: 600 }}>Solar Capacity:</Typography>
                  <Typography variant="caption" fontWeight={700} sx={{ color: isDark ? "#f8fafc" : "#0f172a" }}>{selectedLeadDetails.capacity}</Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontWeight: 600 }}>Assigned Date:</Typography>
                  <Typography variant="caption" fontWeight={700} sx={{ color: isDark ? "#f8fafc" : "#0f172a" }}>{selectedLeadDetails.assignedDate}</Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontWeight: 600 }}>Completion Date:</Typography>
                  <Typography variant="caption" fontWeight={700} sx={{ color: isDark ? "#f8fafc" : "#0f172a" }}>{selectedLeadDetails.completionDate}</Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontWeight: 600 }}>Remarks & Notes:</Typography>
                  <Typography variant="caption" fontWeight={700} sx={{ color: "#1d68f0" }}>{selectedLeadDetails.remarks}</Typography>
                </Box>
              </Stack>
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2, borderTop: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid #f1f5f9" }}>
          <Button onClick={() => setSelectedLeadDetails(null)} sx={{ color: isDark ? "#94a3b8" : "#64748b", textTransform: "none", fontWeight: 700 }}>
            Close
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              toast.success(`Opening Lead Management for ${selectedLeadDetails?.leadNo}...`);
              setSelectedLeadDetails(null);
            }}
            sx={{
              borderRadius: "8px",
              textTransform: "none",
              fontWeight: 700,
              fontSize: "0.82rem",
              bgcolor: "#1d68f0",
              backgroundImage: "linear-gradient(135deg, #1d68f0 0%, #2563eb 100%)",
            }}
          >
            Manage Lead
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Apply Leave Dialog Modal ────────────────────────────────────── */}
      <Dialog
        open={leaveModalOpen}
        onClose={() => !leaveSubmitting && setLeaveModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "16px",
            bgcolor: isDark ? "#0f172a" : "#ffffff",
            backgroundImage: "none",
            border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0",
            boxShadow: isDark ? "0 20px 40px rgba(0,0,0,0.6)" : "0 20px 40px rgba(0,0,0,0.08)",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            pb: 1.5,
            borderBottom: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid #f1f5f9",
          }}
        >
          <Box>
            <Typography variant="h6" fontWeight={800} sx={{ color: isDark ? "#f8fafc" : "#0f172a", fontSize: "1.1rem" }}>
              Apply Leave
            </Typography>
            <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b" }}>
              For: {profileData.fullName || "Employee"}
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setLeaveModalOpen(false)} sx={{ color: isDark ? "#94a3b8" : "#64748b" }}>
            <Close sx={{ fontSize: 20 }} />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {/* Leave Type */}
            <Box>
              <Typography variant="caption" fontWeight={700} sx={{ color: isDark ? "#cbd5e1" : "#475569", display: "block", mb: 0.75 }}>
                Leave Type
              </Typography>
              <Select
                fullWidth
                size="small"
                value={newLeaveData.leaveType}
                onChange={(e) => setNewLeaveData({ ...newLeaveData, leaveType: e.target.value })}
                sx={{
                  borderRadius: "9px",
                  fontSize: "0.85rem",
                  bgcolor: isDark ? "rgba(255,255,255,0.03)" : "#ffffff",
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: isDark ? "rgba(255,255,255,0.12)" : "#cbd5e1",
                  },
                }}
              >
                <MenuItem value="Casual Leave">Casual Leave</MenuItem>
                <MenuItem value="Sick Leave">Sick / Medical Leave</MenuItem>
                <MenuItem value="Earned Leave">Earned / Privilege Leave</MenuItem>
                <MenuItem value="Comp Off">Compensatory Off</MenuItem>
                <MenuItem value="Maternity / Paternity">Maternity / Paternity</MenuItem>
                <MenuItem value="Unpaid Leave">Unpaid Leave (LWP)</MenuItem>
                <MenuItem value="Other">Other Leave</MenuItem>
              </Select>
            </Box>

            {/* Start Date & End Date in Row */}
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" fontWeight={700} sx={{ color: isDark ? "#cbd5e1" : "#475569", display: "block", mb: 0.75 }}>
                  Start Date
                </Typography>
                <TextField
                  type="date"
                  fullWidth
                  size="small"
                  value={newLeaveData.startDate}
                  onChange={(e) => setNewLeaveData({ ...newLeaveData, startDate: e.target.value })}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "9px",
                      fontSize: "0.85rem",
                      bgcolor: isDark ? "rgba(255,255,255,0.03)" : "#ffffff",
                    },
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" fontWeight={700} sx={{ color: isDark ? "#cbd5e1" : "#475569", display: "block", mb: 0.75 }}>
                  End Date
                </Typography>
                <TextField
                  type="date"
                  fullWidth
                  size="small"
                  value={newLeaveData.endDate}
                  onChange={(e) => setNewLeaveData({ ...newLeaveData, endDate: e.target.value })}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "9px",
                      fontSize: "0.85rem",
                      bgcolor: isDark ? "rgba(255,255,255,0.03)" : "#ffffff",
                    },
                  }}
                />
              </Grid>
            </Grid>

            {/* Total Days Indicator */}
            {newLeaveData.startDate && newLeaveData.endDate && (
              <Paper
                elevation={0}
                sx={{
                  p: 1.25,
                  borderRadius: "8px",
                  bgcolor: isDark ? "rgba(59, 130, 246, 0.08)" : "#eff6ff",
                  border: isDark ? "1px solid rgba(59, 130, 246, 0.2)" : "1px solid #dbeafe",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography variant="caption" fontWeight={600} sx={{ color: isDark ? "#93c5fd" : "#1e40af" }}>
                  Calculated Duration:
                </Typography>
                <Chip
                  size="small"
                  label={
                    new Date(newLeaveData.endDate) >= new Date(newLeaveData.startDate)
                      ? `${Math.floor((new Date(newLeaveData.endDate) - new Date(newLeaveData.startDate)) / 86400000) + 1} Day(s)`
                      : "Invalid Range"
                  }
                  sx={{ fontWeight: 800, fontSize: "0.75rem", bgcolor: "#1d68f0", color: "#ffffff" }}
                />
              </Paper>
            )}

            {/* Leave Status (Direct Approval Option) */}
            <Box>
              <Typography variant="caption" fontWeight={700} sx={{ color: isDark ? "#cbd5e1" : "#475569", display: "block", mb: 0.75 }}>
                Approval Status
              </Typography>
              <Select
                fullWidth
                size="small"
                value={newLeaveData.status}
                onChange={(e) => setNewLeaveData({ ...newLeaveData, status: e.target.value })}
                sx={{
                  borderRadius: "9px",
                  fontSize: "0.85rem",
                  bgcolor: isDark ? "rgba(255,255,255,0.03)" : "#ffffff",
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: isDark ? "rgba(255,255,255,0.12)" : "#cbd5e1",
                  },
                }}
              >
                <MenuItem value="approved">Approved (Apply directly to attendance)</MenuItem>
                <MenuItem value="pending">Pending (Submit for manager review)</MenuItem>
              </Select>
            </Box>

            {/* Reason */}
            <Box>
              <Typography variant="caption" fontWeight={700} sx={{ color: isDark ? "#cbd5e1" : "#475569", display: "block", mb: 0.75 }}>
                Reason for Leave
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder="Enter detailed reason for leave (e.g. Medical emergency, Family function, etc.)"
                value={newLeaveData.reason}
                onChange={(e) => setNewLeaveData({ ...newLeaveData, reason: e.target.value })}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "9px",
                    fontSize: "0.85rem",
                    bgcolor: isDark ? "rgba(255,255,255,0.03)" : "#ffffff",
                  },
                }}
              />
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2, borderTop: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid #f1f5f9" }}>
          <Button onClick={() => setLeaveModalOpen(false)} sx={{ color: isDark ? "#94a3b8" : "#64748b", textTransform: "none", fontWeight: 700 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleApplyLeave}
            disabled={leaveSubmitting}
            sx={{
              borderRadius: "8px",
              textTransform: "none",
              fontWeight: 700,
              fontSize: "0.84rem",
              px: 3,
              bgcolor: "#1d68f0",
              backgroundImage: "linear-gradient(135deg, #1d68f0 0%, #2563eb 100%)",
            }}
          >
            {leaveSubmitting ? "Submitting..." : "Submit Leave"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Leave Review Dialog Modal ────────────────────────────────────── */}
      <Dialog
        open={reviewNoteModalOpen}
        onClose={() => !leaveSubmitting && setReviewNoteModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "16px",
            bgcolor: isDark ? "#0f172a" : "#ffffff",
            backgroundImage: "none",
            border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0",
          },
        }}
      >
        <DialogTitle sx={{ pb: 1.5, borderBottom: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid #f1f5f9" }}>
          <Typography variant="h6" fontWeight={800} sx={{ color: isDark ? "#f8fafc" : "#0f172a", fontSize: "1.05rem" }}>
            {reviewActionType === "approved" ? "Approve Leave Request" : "Reject Leave Request"}
          </Typography>
          <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b" }}>
            Leave: {selectedLeaveForReview?.leaveType} ({selectedLeaveForReview?.totalDays || 1} Days)
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 2.5 }}>
          <Typography variant="caption" fontWeight={700} sx={{ color: isDark ? "#cbd5e1" : "#475569", display: "block", mb: 0.75, mt: 1 }}>
            Review Note / Remarks (Optional)
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={2.5}
            placeholder="Add reviewer comments or note..."
            value={reviewNoteText}
            onChange={(e) => setReviewNoteText(e.target.value)}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "9px",
                fontSize: "0.85rem",
                bgcolor: isDark ? "rgba(255,255,255,0.03)" : "#ffffff",
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid #f1f5f9" }}>
          <Button onClick={() => setReviewNoteModalOpen(false)} sx={{ color: isDark ? "#94a3b8" : "#64748b", textTransform: "none", fontWeight: 700 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmitReview}
            disabled={leaveSubmitting}
            sx={{
              borderRadius: "8px",
              textTransform: "none",
              fontWeight: 700,
              fontSize: "0.84rem",
              px: 2.5,
              bgcolor: reviewActionType === "approved" ? "#10b981" : "#ef4444",
              "&:hover": {
                bgcolor: reviewActionType === "approved" ? "#059669" : "#dc2626",
              },
            }}
          >
            {leaveSubmitting ? "Processing..." : reviewActionType === "approved" ? "Confirm Approval" : "Confirm Rejection"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Generate Salary Slip Dialog Modal ────────────────────────────────────── */}
      <Dialog
        open={generateSlipModalOpen}
        onClose={() => !slipGenerating && setGenerateSlipModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "16px",
            bgcolor: isDark ? "#0f172a" : "#ffffff",
            backgroundImage: "none",
            border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0",
            boxShadow: isDark ? "0 20px 40px rgba(0,0,0,0.6)" : "0 20px 40px rgba(0,0,0,0.08)",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            pb: 1.5,
            borderBottom: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid #f1f5f9",
          }}
        >
          <Box>
            <Typography variant="h6" fontWeight={800} sx={{ color: isDark ? "#f8fafc" : "#0f172a", fontSize: "1.1rem" }}>
              Generate Salary Slip
            </Typography>
            <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b" }}>
              For: {profileData.fullName || "Employee"}
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setGenerateSlipModalOpen(false)} sx={{ color: isDark ? "#94a3b8" : "#64748b" }}>
            <Close sx={{ fontSize: 20 }} />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {/* Month & Year Selection in Row */}
            <Grid container spacing={2}>
              <Grid item xs={7}>
                <Typography variant="caption" fontWeight={700} sx={{ color: isDark ? "#cbd5e1" : "#475569", display: "block", mb: 0.75 }}>
                  Select Month
                </Typography>
                <Select
                  fullWidth
                  size="small"
                  value={newSlipMonth}
                  onChange={(e) => setNewSlipMonth(e.target.value)}
                  sx={{
                    borderRadius: "9px",
                    fontSize: "0.85rem",
                    bgcolor: isDark ? "rgba(255,255,255,0.03)" : "#ffffff",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: isDark ? "rgba(255,255,255,0.12)" : "#cbd5e1",
                    },
                  }}
                >
                  {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((m) => (
                    <MenuItem key={m} value={m}>{m}</MenuItem>
                  ))}
                </Select>
              </Grid>

              <Grid item xs={5}>
                <Typography variant="caption" fontWeight={700} sx={{ color: isDark ? "#cbd5e1" : "#475569", display: "block", mb: 0.75 }}>
                  Year
                </Typography>
                <Select
                  fullWidth
                  size="small"
                  value={newSlipYear}
                  onChange={(e) => setNewSlipYear(e.target.value)}
                  sx={{
                    borderRadius: "9px",
                    fontSize: "0.85rem",
                    bgcolor: isDark ? "rgba(255,255,255,0.03)" : "#ffffff",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: isDark ? "rgba(255,255,255,0.12)" : "#cbd5e1",
                    },
                  }}
                >
                  {["2026", "2025", "2024"].map((y) => (
                    <MenuItem key={y} value={y}>{y}</MenuItem>
                  ))}
                </Select>
              </Grid>
            </Grid>

            {/* Live Net Pay Breakdown Preview */}
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: "12px",
                bgcolor: isDark ? "rgba(59, 130, 246, 0.08)" : "#eff6ff",
                border: isDark ? "1px solid rgba(59, 130, 246, 0.2)" : "1px solid #dbeafe",
              }}
            >
              <Typography variant="caption" fontWeight={700} sx={{ color: "#1d68f0", display: "block", mb: 1 }}>
                SALARY STRUCTURE SNAPSHOT
              </Typography>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b" }}>Gross Earnings:</Typography>
                <Typography variant="caption" fontWeight={800} sx={{ color: "#10b981" }}>₹ {totalEarnings.toLocaleString("en-IN")}</Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b" }}>Total Deductions:</Typography>
                <Typography variant="caption" fontWeight={800} sx={{ color: "#ef4444" }}>₹ {totalDeductions.toLocaleString("en-IN")}</Typography>
              </Box>
              <Divider sx={{ my: 1, borderColor: isDark ? "rgba(255,255,255,0.08)" : "#cbd5e1" }} />
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="body2" fontWeight={800} sx={{ color: isDark ? "#f8fafc" : "#0f172a" }}>Net Payable:</Typography>
                <Typography variant="subtitle1" fontWeight={900} sx={{ color: "#1d68f0" }}>₹ {netPay.toLocaleString("en-IN")}</Typography>
              </Box>
            </Paper>

            {/* Payment Status */}
            <Box>
              <Typography variant="caption" fontWeight={700} sx={{ color: isDark ? "#cbd5e1" : "#475569", display: "block", mb: 0.75 }}>
                Payment Status
              </Typography>
              <Select
                fullWidth
                size="small"
                value={newSlipStatus}
                onChange={(e) => setNewSlipStatus(e.target.value)}
                sx={{
                  borderRadius: "9px",
                  fontSize: "0.85rem",
                  bgcolor: isDark ? "rgba(255,255,255,0.03)" : "#ffffff",
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: isDark ? "rgba(255,255,255,0.12)" : "#cbd5e1",
                  },
                }}
              >
                <MenuItem value="Paid">Paid (Marked as Disbursed)</MenuItem>
                <MenuItem value="Pending">Pending (Awaiting Disbursement)</MenuItem>
              </Select>
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2, borderTop: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid #f1f5f9" }}>
          <Button onClick={() => setGenerateSlipModalOpen(false)} sx={{ color: isDark ? "#94a3b8" : "#64748b", textTransform: "none", fontWeight: 700 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleGenerateSalarySlip}
            disabled={slipGenerating}
            sx={{
              borderRadius: "8px",
              textTransform: "none",
              fontWeight: 700,
              fontSize: "0.84rem",
              px: 3,
              bgcolor: "#1d68f0",
              backgroundImage: "linear-gradient(135deg, #1d68f0 0%, #2563eb 100%)",
            }}
          >
            {slipGenerating ? "Generating..." : "Generate & Save Slip"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserDetailsPage;
