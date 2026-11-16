// pages/Attendance.jsx (Dark Theme matching exact target screenshot design)
import React, {
  useState, useEffect, useCallback, useMemo, useRef,
} from "react";
import {
  Box, Grid, Paper, Typography, Chip, IconButton, Stack,
  Card, CardContent, Button, useTheme, useMediaQuery,
  Skeleton, Dialog, Slide, Alert, Snackbar, TextField,
  MenuItem, FormControl, InputLabel, Select, Pagination,
  Fade, Zoom, Badge, DialogTitle, DialogContent,
  CircularProgress, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Fab,
  SwipeableDrawer, BottomNavigation, BottomNavigationAction,
  InputAdornment, DialogActions, Tooltip, alpha,
  Menu, ListItemIcon, ListItemText, Divider, Avatar,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  CalendarToday, ChevronLeft, ChevronRight, AccessTime,
  Person, CheckCircle, Warning, Error as ErrorIcon,
  History, Login, Logout, LocationOn, Close,
  Dashboard, ExpandMore, Search, FilterAlt, Clear,
  Refresh, GpsFixed, GpsNotFixed, Timer, PlayArrow, Home,
  Business, MyLocation, FileDownload, Print, ContentCopy,
  ArrowBack, Phone, Email,
} from "@mui/icons-material";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { useAttendance } from "../hooks/useAttendance";
import { useGeo } from "../hooks/useGeo";
import AttendanceDetails, {
  generateCSV, generateJSON, downloadFile, printRecord,
} from "./AttendanceDetails";
import { format, differenceInSeconds } from "date-fns";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  startTracking,
  stopTracking,
  isCurrentlyTracking,
  simulateTrackingMovement,
} from "../utils/Locationtracker";
import { useSocket } from "../utils/Usesocket.js";
import { API_ORIGIN } from "../utils/apiConfig";

// ─── Constants & Dark Palette ──────────────────────────────────────────────────
const API = API_ORIGIN;

const COLOR = {
  get isDark() {
    return (localStorage.getItem("appThemeMode") || "dark") === "dark";
  },
  get bg() { return this.isDark ? "#060a12" : "#f6f8fc"; },
  get card() { return this.isDark ? "#0e1424" : "#ffffff"; },
  get cardHover() { return this.isDark ? "#131b30" : "#f8fafc"; },
  get cardHeader() { return this.isDark ? "#0b101c" : "#ffffff"; },
  get tableHead() { return this.isDark ? "#090d18" : "#f8fafc"; },
  get border() { return this.isDark ? "rgba(255, 255, 255, 0.08)" : "#e2e8f0"; },
  get text() { return this.isDark ? "#f8fafc" : "#0f172a"; },
  get textSub() { return this.isDark ? "#94a3b8" : "#334155"; },
  get textMuted() { return this.isDark ? "#64748b" : "#64748b"; },
  blue: "#3b82f6",
  green: "#10b981",
  amber: "#f59e0b",
  red: "#ef4444",
  orange: "#d97706",
};

const MANAGER_ROLES = ["ADMIN", "PROJECT_HEAD", "MANAGER", "SUPERVISOR"];

const PERIOD_OPTIONS = [
  { value: "Today", label: "Today" },
  { value: "This Week", label: "This Week" },
  { value: "This Month", label: "This Month" },
  { value: "All", label: "All Time" },
];

const STATUS_CONFIG = {
  present: { bg: "rgba(16, 185, 129, 0.12)", color: COLOR.green, icon: <CheckCircle sx={{ fontSize: 14 }} />, label: "Present" },
  absent: { bg: "rgba(239, 68, 68, 0.12)", color: COLOR.red, icon: <ErrorIcon sx={{ fontSize: 14 }} />, label: "Absent" },
  late: { bg: "rgba(245, 158, 11, 0.12)", color: COLOR.amber, icon: <Warning sx={{ fontSize: 14 }} />, label: "Late" },
  leave: { bg: "rgba(168, 85, 247, 0.12)", color: "#c084fc", icon: <Person sx={{ fontSize: 14 }} />, label: "Leave" },
  holiday: { bg: "rgba(59, 130, 246, 0.12)", color: COLOR.blue, icon: <CalendarToday sx={{ fontSize: 14 }} />, label: "Holiday" },
};

const DOW = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

const DEMO_FALLBACK_ROWS = [
  { dateKey: "2026-08-01", dateFormatted: "Aug 01, 2026", punchInTime: "09:08 AM", punchOutTime: "Ongoing", hours: "00:00", status: "Present" },
  { dateKey: "2026-07-31", dateFormatted: "Jul 31, 2026", punchInTime: "—", punchOutTime: "—", hours: "00:00", status: "Absent" },
  { dateKey: "2026-07-30", dateFormatted: "Jul 30, 2026", punchInTime: "—", punchOutTime: "—", hours: "00:00", status: "Absent" },
  { dateKey: "2026-07-29", dateFormatted: "Jul 29, 2026", punchInTime: "—", punchOutTime: "—", hours: "00:00", status: "Absent" },
  { dateKey: "2026-07-28", dateFormatted: "Jul 28, 2026", punchInTime: "09:45 AM", punchOutTime: "06:44 PM", hours: "07:59", status: "Present" },
  { dateKey: "2026-07-27", dateFormatted: "Jul 27, 2026", punchInTime: "—", punchOutTime: "—", hours: "00:00", status: "Absent" },
  { dateKey: "2026-07-26", dateFormatted: "Jul 26, 2026", punchInTime: "—", punchOutTime: "—", hours: "00:00", status: "Absent" },
  { dateKey: "2026-07-25", dateFormatted: "Jul 25, 2026", punchInTime: "09:49 AM", punchOutTime: "Ongoing", hours: "00:00", status: "Present" },
];

const fmtDate = (ts) =>
  !ts ? "—" : new Date(ts).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });

const fmtTime = (ts) =>
  !ts ? "—" : new Date(ts).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });

// ─── StatusBadge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ status, size = "small" }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.present;
  return (
    <Chip
      size={size}
      label={cfg.label}
      icon={cfg.icon}
      sx={{
        bgcolor: cfg.bg,
        color: cfg.color,
        fontWeight: 800,
        border: `1px solid ${alpha(cfg.color, 0.3)}`,
        borderRadius: "999px",
        height: 24,
        fontSize: "0.72rem",
        "& .MuiChip-icon": { color: cfg.color },
      }}
    />
  );
};

// ─── useWorkTimer ─────────────────────────────────────────────────────────────
function useWorkTimer() {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const timerRef = useRef(null);
  const pad = (n) => String(n).padStart(2, "0");
  const formatTimeStr = useCallback(
    (s) => `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`, []
  );
  const start = useCallback((ts = new Date()) => { setStartTime(ts); setIsActive(true); }, []);
  const stop = useCallback(() => {
    setIsActive(false);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);
  const reset = useCallback(() => {
    setElapsedSeconds(0); setStartTime(null); setIsActive(false);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);
  useEffect(() => {
    if (isActive && startTime) {
      timerRef.current = setInterval(
        () => setElapsedSeconds(differenceInSeconds(new Date(), new Date(startTime))), 1000
      );
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isActive, startTime]);
  return { elapsedSeconds, formattedTime: formatTimeStr(elapsedSeconds), isActive, start, stop, reset };
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Attendance() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark" || COLOR.isDark;
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { userId: paramUserId } = useParams();
  const location = useLocation();
  const memberInfo = location.state || {};
  const isAdminView = !!paramUserId;

  const { user, getCanonicalUserRole } = useAuth();
  const { socketRef } = useSocket();
  const {
    attendances, loading, error, success, pagination, summary,
    fetchAttendances, punchIn, punchOut, updateAttendance, clearMessages,
  } = useAttendance();
  const geo = useGeo();
  const timer = useWorkTimer();

  const userRole = getCanonicalUserRole();
  const isTeam = userRole === "INSTALLER";
  const isManagerRole = MANAGER_ROLES.includes(userRole);
  const showPunchControls = !isAdminView && !isManagerRole;
  const canManageAttendance = isManagerRole || isAdminView || ["ADMIN", "PROJECT_HEAD", "MANAGER", "SUPERVISOR", "Admin_panel"].includes(userRole);

  const [todayAtt, setTodayAtt] = useState(null);
  useEffect(() => {
    const ts = new Date().toDateString();
    const found = attendances?.find((a) => new Date(a.date).toDateString() === ts) || null;
    setTodayAtt(found);
    if (!isAdminView) {
      if (found?.punchIn && !found?.punchOut) timer.start(found.punchIn.time);
      else if (found?.punchOut) timer.stop();
      else timer.reset();
    }
  }, [attendances]);

  const isTodayPunched = Boolean(
    todayAtt?.punchIn?.time ||
    memberInfo?.punchedIn ||
    memberInfo?.member?.punchedIn
  );

  const activePunchInTime =
    todayAtt?.punchIn?.time ? fmtTime(todayAtt.punchIn.time) :
    memberInfo?.punchInTime ||
    memberInfo?.member?.punchInTime ||
    null;

  const activePunchOutTime =
    todayAtt?.punchOut?.time ? fmtTime(todayAtt.punchOut.time) :
    memberInfo?.punchOutTime ||
    memberInfo?.member?.punchOutTime ||
    null;

  const hasPunchedIn = isTodayPunched;
  const hasPunchedOut = Boolean(todayAtt?.punchOut?.time || activePunchOutTime);

  const [period, setPeriod] = useState(memberInfo.historyView ? "All" : "This Month");
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filters, setFilters] = useState({ page: 1, limit: 10, status: "", search: "" });
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [exportAnchorEl, setExportAnchorEl] = useState(null);
  const [tablePage, setTablePage] = useState(1);
  const [updatingDateKey, setUpdatingDateKey] = useState(null);
  const rowsPerPage = 8;
  const userSwitchedMonthRef = useRef(false);

  // If current month has 0 attendances but previous records exist, default to the latest attendance's month
  useEffect(() => {
    if (!userSwitchedMonthRef.current && attendances?.length > 0) {
      const dates = attendances.map((a) => new Date(a.date || a.createdAt)).filter((d) => !isNaN(d.getTime()));
      if (dates.length > 0) {
        dates.sort((a, b) => b.getTime() - a.getTime());
        const latest = dates[0];
        const now = new Date();
        const hasCurrentMonthRecord = dates.some(d => d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth());
        if (!hasCurrentMonthRecord) {
          setCurrentMonth(new Date(latest.getFullYear(), latest.getMonth(), 1));
        }
      }
    }
  }, [attendances]);

  const showSnack = useCallback((msg, sev = "success") => setSnackbar({ open: true, message: msg, severity: sev }), []);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState(null);

  const [targetUserProfile, setTargetUserProfile] = useState(null);

  useEffect(() => {
    let isMounted = true;
    if (paramUserId && /^[0-9a-fA-F]{24}$/.test(paramUserId)) {
      const token = localStorage.getItem("token");
      axios.get(`${API}/api/v1/user/getUserById/${paramUserId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then((res) => {
        if (isMounted) {
          const u = res.data?.result || res.data?.data || res.data?.user || res.data;
          if (u && (u.firstName || u.name || u.email)) {
            setTargetUserProfile(u);
          }
        }
      })
      .catch((err) => {
        console.warn("Failed to fetch target user profile:", err.message);
      });
    } else {
      setTargetUserProfile(null);
    }
    return () => { isMounted = false; };
  }, [paramUserId]);

  const loadData = useCallback(async () => {
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(paramUserId);
    const targetUid = isValidObjectId ? paramUserId : (user?._id || user?.id);
    const q = {
      page: filters.page,
      limit: 100,
      ...(filters.status && { status: filters.status }),
      ...(filters.search && { search: filters.search }),
      ...(targetUid && /^[0-9a-fA-F]{24}$/.test(targetUid) ? { userId: targetUid } : {}),
    };
    await fetchAttendances(q);
  }, [filters, user, fetchAttendances, paramUserId]);

  useEffect(() => { loadData(); }, [loadData]);

  // Combined Rows — unique per user with all days of the selected month included
  const mergedRows = useMemo(() => {
    const recordsMap = new Map();
    (attendances || []).forEach((item) => {
      const d = item.date || item.createdAt;
      if (d) {
        const key = format(new Date(d), "yyyy-MM-dd");
        recordsMap.set(key, item);
      }
    });

    const now = new Date();
    const todayKey = format(now, "yyyy-MM-dd");

    if (isTodayPunched && activePunchInTime && !recordsMap.has(todayKey)) {
      recordsMap.set(todayKey, {
        date: todayKey,
        punchIn: { time: todayAtt?.punchIn?.time || now.toISOString() },
        punchOut: activePunchOutTime ? { time: todayAtt?.punchOut?.time || now.toISOString() } : null,
        status: "present",
        workHours: 0,
        raw: todayAtt || null,
      });
    }

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth(); // 0-11
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const todayY = now.getFullYear();
    const todayM = now.getMonth();
    const todayD = now.getDate();

    const isCurrentMonthYear = year === todayY && month === todayM;
    const isPastMonth = year < todayY || (year === todayY && month < todayM);

    let maxDay = daysInMonth;
    if (isCurrentMonthYear) {
      maxDay = todayD;
      recordsMap.forEach((item, dateKey) => {
        const [y, m, d] = dateKey.split("-").map(Number);
        if (y === year && m === month + 1 && d > maxDay) {
          maxDay = Math.max(maxDay, d);
        }
      });
    } else if (!isPastMonth) {
      maxDay = 0;
      recordsMap.forEach((item, dateKey) => {
        const [y, m, d] = dateKey.split("-").map(Number);
        if (y === year && m === month + 1) {
          maxDay = Math.max(maxDay, d);
        }
      });
      if (maxDay === 0) maxDay = daysInMonth;
    }

    const rows = [];
    const processedKeys = new Set();

    for (let d = 1; d <= maxDay; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      processedKeys.add(dateStr);

      const cellDate = new Date(year, month, d);
      const isSunday = cellDate.getDay() === 0;
      const isToday = isCurrentMonthYear && d === todayD;
      const item = recordsMap.get(dateStr);

      if (item) {
        const hasPunchIn = Boolean(item.punchIn?.time);
        const punchInTime = item.punchIn?.time ? fmtTime(item.punchIn.time) : "—";
        const punchOutTime = item.punchOut?.time
          ? fmtTime(item.punchOut.time)
          : item.punchIn?.time
          ? (isToday && !item.punchOut?.time ? "Ongoing" : "—")
          : "—";

        const hoursNum = Number(item.workHours || 0);
        const h = Math.floor(hoursNum);
        const m = Math.round((hoursNum - h) * 60);
        const hours = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

        let status = "Absent";
        if (hasPunchIn || item.status?.toLowerCase() === "present") {
          status = "Present";
        } else if (item.status?.toLowerCase() === "holiday") {
          status = "Holiday";
        } else if (item.status?.toLowerCase() === "leave") {
          status = "Leave";
        } else if (item.status?.toLowerCase() === "late") {
          status = "Late";
        } else if (item.status?.toLowerCase() === "half-day") {
          status = "Half-Day";
        } else if (isSunday) {
          status = "Holiday";
        }

        rows.push({
          dateKey: dateStr,
          dateFormatted: fmtDate(cellDate),
          punchInTime,
          punchOutTime,
          hours,
          status,
          hasPunchIn,
          raw: item,
        });
      } else {
        const status = isSunday ? "Holiday" : "Absent";
        rows.push({
          dateKey: dateStr,
          dateFormatted: fmtDate(cellDate),
          punchInTime: "—",
          punchOutTime: "—",
          hours: "00:00",
          status,
          hasPunchIn: false,
          raw: null,
        });
      }
    }

    if (period === "All") {
      recordsMap.forEach((item, dateKey) => {
        if (!processedKeys.has(dateKey)) {
          const itemDate = new Date(item.date || item.createdAt);
          const hasPunchIn = Boolean(item.punchIn?.time);
          const punchInTime = item.punchIn?.time ? fmtTime(item.punchIn.time) : "—";
          const punchOutTime = item.punchOut?.time ? fmtTime(item.punchOut.time) : item.punchIn?.time ? "Ongoing" : "—";
          const hoursNum = Number(item.workHours || 0);
          const h = Math.floor(hoursNum);
          const m = Math.round((hoursNum - h) * 60);
          const hours = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
          let status = item.status || "Present";
          rows.push({
            dateKey,
            dateFormatted: fmtDate(itemDate),
            punchInTime,
            punchOutTime,
            hours,
            status,
            hasPunchIn,
            raw: item,
          });
          processedKeys.add(dateKey);
        }
      });
    }

    // Sort descending by date (latest date first)
    rows.sort((a, b) => b.dateKey.localeCompare(a.dateKey));
    return rows;
  }, [attendances, currentMonth, period, isTodayPunched, activePunchInTime, activePunchOutTime, todayAtt]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    return mergedRows.filter((r) => {
      if (filters.status && r.status.toLowerCase() !== filters.status.toLowerCase()) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (!r.dateFormatted.toLowerCase().includes(q) && !r.status.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [mergedRows, filters.search, filters.status]);

  // Paginated Table rows
  const totalTablePages = Math.ceil(filteredRows.length / rowsPerPage) || 1;
  const paginatedRows = useMemo(() => {
    const start = (tablePage - 1) * rowsPerPage;
    return filteredRows.slice(start, start + rowsPerPage);
  }, [filteredRows, tablePage]);

  // Summary counts
  const totalDaysCount = mergedRows.length;
  const presentCount = mergedRows.filter((r) => r.status.toLowerCase() === "present" || r.punchInTime !== "—").length;
  const lateCount = mergedRows.filter((r) => r.status.toLowerCase() === "late").length;
  const absentCount = mergedRows.filter((r) => r.status.toLowerCase() === "absent" && r.punchInTime === "—").length;
  let workHoursTotal = 0;
  mergedRows.forEach((r) => {
    if (r.hours && r.hours !== "00:00") {
      const [h, m] = r.hours.split(":").map(Number);
      workHoursTotal += (h || 0) + (m || 0) / 60;
    }
  });

  // Calendar Day Cells
  const calendarCells = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const now = new Date();
    const todayY = now.getFullYear();
    const todayM = now.getMonth();
    const todayD = now.getDate();

    const cells = [];
    const prevDays = new Date(year, month, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
      cells.push({ day: prevDays - i, isCurrent: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const cellDate = new Date(year, month, d);
      const isSunday = cellDate.getDay() === 0;
      const isToday = (year === todayY && month === todayM && d === todayD);
      const isPast = (year < todayY || (year === todayY && month < todayM) || (year === todayY && month === todayM && d < todayD));

      const match = mergedRows.find((r) => r.dateKey === dateStr);
      let dayStatus = null;

      if (match) {
        if (match.status.toLowerCase() === "present" || match.punchInTime !== "—") {
          dayStatus = "present";
        } else if (match.status.toLowerCase() === "holiday" || isSunday) {
          dayStatus = "holiday";
        } else if (match.status.toLowerCase() === "leave") {
          dayStatus = "leave";
        } else if (match.status.toLowerCase() === "late") {
          dayStatus = "late";
        } else {
          dayStatus = "absent";
        }
      } else if (isSunday) {
        dayStatus = "holiday";
      } else if (isToday) {
        dayStatus = isTodayPunched ? "present" : null;
      } else if (isPast) {
        dayStatus = "absent";
      }

      cells.push({ day: d, isCurrent: true, status: dayStatus, dateKey: dateStr });
    }
    const remaining = 35 - cells.length;
    const extra = remaining < 0 ? 42 - cells.length : remaining;
    for (let d = 1; d <= extra; d++) {
      cells.push({ day: d, isCurrent: false });
    }
    return cells;
  }, [currentMonth, mergedRows, isTodayPunched]);

  // Display metadata - dynamically resolved from targetUserProfile, memberInfo, or user
  const displayName = targetUserProfile
    ? (`${targetUserProfile.firstName || ""} ${targetUserProfile.lastName || ""}`.trim() || targetUserProfile.name || targetUserProfile.email || "Employee")
    : memberInfo.memberName || (isAdminView ? "Employee" : (user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : user?.name || "Employee"));

  const displayRole = targetUserProfile?.role || memberInfo.memberRole || (isAdminView ? "TEAM" : user?.role || "TEAM");
  const displayPhone = targetUserProfile?.phoneNumber || targetUserProfile?.phone || memberInfo.memberPhone || (!isAdminView ? (user?.phoneNumber || user?.phone || "") : "");
  const displayEmail = targetUserProfile?.email || memberInfo.memberEmail || (!isAdminView ? user?.email || "" : "");
  const displayAvatar = (displayName || "U").charAt(0).toUpperCase();

  const handleRowClick = useCallback((row) => {
    if (!row) return;

    const targetUserObj = targetUserProfile || {
      name: displayName,
      role: displayRole,
      phone: displayPhone,
      phoneNumber: displayPhone,
      email: displayEmail,
      _id: paramUserId || user?._id,
    };

    let att = null;
    if (row.raw) {
      att = {
        ...row.raw,
        user: (row.raw.user && typeof row.raw.user === "object") ? { ...targetUserObj, ...row.raw.user } : targetUserObj,
      };
    } else {
      att = {
        _id: "record_" + row.dateKey,
        date: row.dateKey,
        status: String(row.status || "absent").toLowerCase(),
        workHours: row.hours !== "—" ? row.hours : 0,
        workHoursFormatted: row.hours !== "—" ? row.hours : "00:00",
        punchIn: row.punchInTime && row.punchInTime !== "—" ? { time: `${row.dateKey}T09:00:00` } : null,
        punchOut: row.punchOutTime && row.punchOutTime !== "—" && row.punchOutTime !== "Ongoing" ? { time: `${row.dateKey}T18:00:00` } : null,
        user: targetUserObj,
        createdAt: row.dateKey,
        updatedAt: row.dateKey,
      };
    }

    setSelectedAttendance(att);
    setDetailsOpen(true);
  }, [displayName, displayRole, displayPhone, displayEmail, paramUserId, user, targetUserProfile]);

  const handleCalendarCellClick = useCallback((cell) => {
    if (!cell || !cell.isCurrent) return;
    const clickedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), cell.day);
    setSelectedDate(clickedDate);

    const dateStr = cell.dateKey || `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}-${String(cell.day).padStart(2, "0")}`;
    const matchingRow = mergedRows.find((r) => r.dateKey === dateStr);

    if (matchingRow) {
      handleRowClick(matchingRow);
    } else {
      const cellDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), cell.day);
      const isSunday = cellDate.getDay() === 0;
      handleRowClick({
        dateKey: dateStr,
        dateFormatted: fmtDate(cellDate),
        punchInTime: "—",
        punchOutTime: "—",
        hours: "00:00",
        status: isSunday ? "Holiday" : (cell.status ? cell.status.charAt(0).toUpperCase() + cell.status.slice(1) : "Absent"),
        hasPunchIn: false,
        raw: null,
      });
    }
  }, [currentMonth, mergedRows, handleRowClick]);

  const handleDeleteAttendance = useCallback(async (att) => {
    if (att?._id && !att._id.startsWith("record_")) {
      try {
        const token = localStorage.getItem("token");
        await axios.delete(`${API}/api/v1/attendance/${att._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        showSnack("Attendance record deleted successfully");
        await loadData();
      } catch (err) {
        showSnack(err?.response?.data?.message || "Failed to delete record", "error");
      }
    }
  }, [loadData, showSnack]);

  const handleEditAttendance = useCallback(async () => {
    await loadData();
  }, [loadData]);

  const handleQuickMark = useCallback(async (row, targetStatus) => {
    if (!row) return;
    try {
      setUpdatingDateKey(row.dateKey);
      const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(paramUserId);
      const targetUid = targetUserProfile?._id || (isValidObjectId ? paramUserId : (user?._id || user?.id));
      const isPresent = targetStatus === "present";

      const punchInDate = new Date(`${row.dateKey}T09:30:00`);
      const punchOutDate = new Date(`${row.dateKey}T18:00:00`);

      const payload = {
        userId: targetUid,
        user: targetUid,
        date: row.dateKey,
        status: targetStatus,
        workHours: isPresent ? 8.5 : 0,
        overtime: 0,
        punchIn: isPresent
          ? {
              time: punchInDate.toISOString(),
              address: "Marked present by Admin",
              location: { lat: 0, lng: 0 },
              battery: { percentage: 100, isCharging: false },
            }
          : {
              time: null,
              address: "Marked absent by Admin",
              location: { lat: 0, lng: 0 },
              battery: { percentage: 0, isCharging: false },
            },
        punchOut: isPresent
          ? {
              time: punchOutDate.toISOString(),
              address: "Marked present by Admin",
              location: { lat: 0, lng: 0 },
              battery: { percentage: 100, isCharging: false },
            }
          : {
              time: null,
              address: "Marked absent by Admin",
              location: { lat: 0, lng: 0 },
              battery: { percentage: 0, isCharging: false },
            },
        remarks: `Attendance marked ${targetStatus} by Admin`,
      };

      const recordId = (row.raw?._id && !String(row.raw._id).startsWith("record_"))
        ? row.raw._id
        : `record_${row.dateKey}`;

      const res = await updateAttendance(recordId, payload);
      if (res?.success) {
        showSnack(`Marked ${row.dateFormatted} as ${targetStatus.toUpperCase()}`, "success");
        await loadData();
      } else {
        showSnack(res?.error || "Failed to update attendance", "error");
      }
    } catch (err) {
      showSnack(err?.message || "Failed to update attendance", "error");
    } finally {
      setUpdatingDateKey(null);
    }
  }, [paramUserId, targetUserProfile, user, updateAttendance, showSnack, loadData]);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: COLOR.bg, color: COLOR.text, p: { xs: 1.5, md: 3 } }}>
      <Box sx={{ maxWidth: 1400, mx: "auto" }}>

        {/* ── Breadcrumb ── */}
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
          <Typography
            sx={{ fontSize: "0.78rem", color: COLOR.textMuted, cursor: "pointer", "&:hover": { color: COLOR.blue } }}
            onClick={() => navigate("/team-attendance")}
          >
            Team
          </Typography>
          <Typography sx={{ fontSize: "0.78rem", color: COLOR.textMuted }}>&gt;</Typography>
          <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: COLOR.text }}>
            {displayName}
          </Typography>
        </Stack>

        {/* ── Header Banner Card ── */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, md: 2.5 },
            borderRadius: "18px",
            background: "linear-gradient(135deg, #090e1a 0%, #111736 40%, #1f1347 100%)",
            border: `1px solid ${COLOR.border}`,
            boxShadow: "0 12px 32px rgba(0, 0, 0, 0.4)",
            mb: 2.5,
          }}
        >
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <IconButton
                onClick={() => navigate(-1)}
                sx={{
                  bgcolor: "rgba(255,255,255,0.08)",
                  color: "#fff",
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  border: "1px solid rgba(255,255,255,0.12)",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.16)" },
                }}
              >
                <ArrowBack sx={{ fontSize: 18 }} />
              </IconButton>
              
              <Avatar sx={{ width: 46, height: 46, bgcolor: "#3b82f6", color: "#fff", fontWeight: 800, fontSize: "1.1rem" }}>
                {displayAvatar}
              </Avatar>

              <Box>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                  <Typography variant="h6" fontWeight={800} sx={{ color: "#fff", letterSpacing: "-0.01em" }}>
                    {displayName}
                  </Typography>
                  <Chip
                    label={displayRole}
                    size="small"
                    sx={{
                      bgcolor: "rgba(59, 130, 246, 0.18)",
                      color: "#93c5fd",
                      fontWeight: 800,
                      height: 22,
                      fontSize: "0.68rem",
                      border: "1px solid rgba(59, 130, 246, 0.3)",
                    }}
                  />
                  {displayPhone && (
                    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: COLOR.textSub, fontSize: "0.78rem", ml: 1 }}>
                      <Phone sx={{ fontSize: 13 }} />
                      <span>{displayPhone}</span>
                    </Stack>
                  )}
                  {displayEmail && (
                    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: COLOR.textSub, fontSize: "0.78rem" }}>
                      <Email sx={{ fontSize: 13 }} />
                      <span>{displayEmail}</span>
                    </Stack>
                  )}
                </Stack>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1.5} alignItems="center">
              <Button
                variant="outlined"
                endIcon={<ExpandMore />}
                onClick={(e) => setExportAnchorEl(e.currentTarget)}
                sx={{
                  color: "#fff",
                  borderColor: "rgba(255,255,255,0.2)",
                  bgcolor: "rgba(255,255,255,0.06)",
                  borderRadius: "10px",
                  height: 38,
                  px: 2,
                  textTransform: "none",
                  fontWeight: 700,
                  fontSize: "0.82rem",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.12)" },
                }}
              >
                Export
              </Button>
              <Menu
                anchorEl={exportAnchorEl}
                open={Boolean(exportAnchorEl)}
                onClose={() => setExportAnchorEl(null)}
                PaperProps={{
                  sx: { bgcolor: COLOR.card, color: COLOR.text, border: `1px solid ${COLOR.border}`, borderRadius: "12px" },
                }}
              >
                <MenuItem
                  onClick={() => {
                    const csv = generateCSV(attendances);
                    downloadFile(csv, `attendances_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`, "text/csv");
                    setExportAnchorEl(null);
                  }}
                  sx={{ fontSize: "0.85rem", fontWeight: 600 }}
                >
                  Export as CSV (.csv)
                </MenuItem>
              </Menu>

              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={loadData}
                sx={{
                  color: "#fff",
                  borderColor: "rgba(255,255,255,0.2)",
                  bgcolor: "rgba(255,255,255,0.06)",
                  borderRadius: "10px",
                  height: 38,
                  px: 2,
                  textTransform: "none",
                  fontWeight: 700,
                  fontSize: "0.82rem",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.12)" },
                }}
              >
                Refresh
              </Button>
            </Stack>
          </Stack>

          <Stack direction="row" spacing={4} sx={{ mt: 2.5, pt: 2, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <Box>
              <Typography variant="caption" sx={{ color: COLOR.textMuted, fontSize: "0.7rem", fontWeight: 600, display: "block" }}>
                Total Records
              </Typography>
              <Typography variant="h6" fontWeight={900} sx={{ color: "#fff", lineHeight: 1.2 }}>
                {mergedRows.length}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: COLOR.textMuted, fontSize: "0.7rem", fontWeight: 600, display: "block" }}>
                Period
              </Typography>
              <Typography variant="h6" fontWeight={900} sx={{ color: "#fff", lineHeight: 1.2 }}>
                {period}
              </Typography>
            </Box>
          </Stack>
        </Paper>

        {/* ── 5 Stat Summary Cards Grid ── */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)", md: "repeat(5, 1fr)" }, gap: 1.5, mb: 2.5 }}>
          
          {/* Card 1: Total Days */}
          <Paper elevation={0} sx={{ p: 2, borderRadius: "16px", bgcolor: COLOR.card, border: `1px solid ${COLOR.border}`, position: "relative", overflow: "hidden" }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box sx={{ width: 36, height: 36, borderRadius: "10px", bgcolor: "rgba(255,255,255,0.06)", display: "grid", placeItems: "center", color: COLOR.textSub }}>
                <CalendarToday sx={{ fontSize: 18 }} />
              </Box>
              <Typography variant="h4" fontWeight={900} sx={{ color: COLOR.text }}>
                {totalDaysCount}
              </Typography>
            </Stack>
            <Box sx={{ mt: 1.5 }}>
              <Typography variant="body2" fontWeight={800} sx={{ color: COLOR.text, fontSize: "0.82rem" }}>
                Total Days
              </Typography>
              <Typography variant="caption" sx={{ color: COLOR.textMuted, fontSize: "0.7rem" }}>
                All records
              </Typography>
            </Box>
            <Box sx={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, bgcolor: COLOR.blue }} />
          </Paper>

          {/* Card 2: Work Hours */}
          <Paper elevation={0} sx={{ p: 2, borderRadius: "16px", bgcolor: COLOR.card, border: `1px solid ${COLOR.border}`, position: "relative", overflow: "hidden" }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box sx={{ width: 36, height: 36, borderRadius: "10px", bgcolor: alpha(COLOR.blue, 0.12), display: "grid", placeItems: "center", color: COLOR.blue }}>
                <AccessTime sx={{ fontSize: 18 }} />
              </Box>
              <Typography variant="h4" fontWeight={900} sx={{ color: COLOR.blue }}>
                {workHoursTotal.toFixed(1)}h
              </Typography>
            </Stack>
            <Box sx={{ mt: 1.5 }}>
              <Typography variant="body2" fontWeight={800} sx={{ color: COLOR.text, fontSize: "0.82rem" }}>
                Work Hours
              </Typography>
              <Typography variant="caption" sx={{ color: COLOR.textMuted, fontSize: "0.7rem" }}>
                Total logged
              </Typography>
            </Box>
            <Box sx={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, bgcolor: COLOR.blue }} />
          </Paper>

          {/* Card 3: Present */}
          <Paper elevation={0} sx={{ p: 2, borderRadius: "16px", bgcolor: COLOR.card, border: `1px solid ${COLOR.border}`, position: "relative", overflow: "hidden" }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box sx={{ width: 36, height: 36, borderRadius: "10px", bgcolor: alpha(COLOR.green, 0.15), display: "grid", placeItems: "center", color: COLOR.green }}>
                <CheckCircle sx={{ fontSize: 18 }} />
              </Box>
              <Typography variant="h4" fontWeight={900} sx={{ color: COLOR.green }}>
                {presentCount}
              </Typography>
            </Stack>
            <Box sx={{ mt: 1.5 }}>
              <Typography variant="body2" fontWeight={800} sx={{ color: COLOR.text, fontSize: "0.82rem" }}>
                Present
              </Typography>
              <Typography variant="caption" sx={{ color: COLOR.textMuted, fontSize: "0.7rem" }}>
                On time days
              </Typography>
            </Box>
            <Box sx={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, bgcolor: COLOR.green }} />
          </Paper>

          {/* Card 4: Late */}
          <Paper elevation={0} sx={{ p: 2, borderRadius: "16px", bgcolor: COLOR.card, border: `1px solid ${COLOR.border}`, position: "relative", overflow: "hidden" }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box sx={{ width: 36, height: 36, borderRadius: "10px", bgcolor: alpha(COLOR.amber, 0.15), display: "grid", placeItems: "center", color: COLOR.amber }}>
                <Warning sx={{ fontSize: 18 }} />
              </Box>
              <Typography variant="h4" fontWeight={900} sx={{ color: COLOR.amber }}>
                {lateCount}
              </Typography>
            </Stack>
            <Box sx={{ mt: 1.5 }}>
              <Typography variant="body2" fontWeight={800} sx={{ color: COLOR.text, fontSize: "0.82rem" }}>
                Late
              </Typography>
              <Typography variant="caption" sx={{ color: COLOR.textMuted, fontSize: "0.7rem" }}>
                Late arrivals
              </Typography>
            </Box>
            <Box sx={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, bgcolor: COLOR.amber }} />
          </Paper>

          {/* Card 5: Absent */}
          <Paper elevation={0} sx={{ p: 2, borderRadius: "16px", bgcolor: COLOR.card, border: `1px solid ${COLOR.border}`, position: "relative", overflow: "hidden" }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box sx={{ width: 36, height: 36, borderRadius: "10px", bgcolor: alpha(COLOR.red, 0.15), display: "grid", placeItems: "center", color: COLOR.red }}>
                <ErrorIcon sx={{ fontSize: 18 }} />
              </Box>
              <Typography variant="h4" fontWeight={900} sx={{ color: COLOR.red }}>
                {absentCount}
              </Typography>
            </Stack>
            <Box sx={{ mt: 1.5 }}>
              <Typography variant="body2" fontWeight={800} sx={{ color: COLOR.text, fontSize: "0.82rem" }}>
                Absent
              </Typography>
              <Typography variant="caption" sx={{ color: COLOR.textMuted, fontSize: "0.7rem" }}>
                Days missed
              </Typography>
            </Box>
            <Box sx={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, bgcolor: COLOR.red }} />
          </Paper>

        </Box>

        {/* ── Search & Filter Control Bar ── */}
        <Paper
          elevation={0}
          sx={{
            p: 1.75,
            px: 2,
            borderRadius: "16px",
            bgcolor: COLOR.cardHeader,
            border: `1px solid ${COLOR.border}`,
            mb: 2.5,
          }}
        >
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems="center" justifyContent="space-between" flexWrap="wrap">
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems="center" sx={{ width: { xs: "100%", sm: "auto" } }}>
              <TextField
                placeholder="Search records..."
                value={filters.search}
                onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: COLOR.textMuted, fontSize: 18 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  width: { xs: "100%", sm: 260 },
                  "& .MuiOutlinedInput-root": {
                    bgcolor: COLOR.bg,
                    borderRadius: "10px",
                    color: "#fff",
                    fontSize: "0.85rem",
                    "& fieldset": { borderColor: "rgba(255,255,255,0.1)" },
                    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.2)" },
                  },
                }}
              />

              <Select
                value={filters.status}
                onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
                size="small"
                displayEmpty
                sx={{
                  minWidth: 130,
                  bgcolor: COLOR.bg,
                  borderRadius: "10px",
                  color: "#fff",
                  fontSize: "0.85rem",
                  "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.1)" },
                  "& .MuiSvgIcon-root": { color: COLOR.textSub },
                }}
              >
                <MenuItem value="">Status: All</MenuItem>
                <MenuItem value="present">Status: Present</MenuItem>
                <MenuItem value="absent">Status: Absent</MenuItem>
                <MenuItem value="late">Status: Late</MenuItem>
              </Select>

              <Select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                size="small"
                sx={{
                  minWidth: 150,
                  bgcolor: COLOR.bg,
                  borderRadius: "10px",
                  color: "#fff",
                  fontSize: "0.85rem",
                  "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.1)" },
                  "& .MuiSvgIcon-root": { color: COLOR.textSub },
                }}
              >
                {PERIOD_OPTIONS.map((o) => (
                  <MenuItem key={o.value} value={o.value}>Period: {o.label}</MenuItem>
                ))}
              </Select>
            </Stack>

            {(filters.search || filters.status || period !== "All") && (
              <Button
                size="small"
                onClick={() => { setFilters({ page: 1, limit: 10, status: "", search: "" }); setPeriod("All"); }}
                startIcon={<Close sx={{ fontSize: 14 }} />}
                sx={{ color: COLOR.red, textTransform: "none", fontWeight: 700, fontSize: "0.82rem" }}
              >
                Clear All
              </Button>
            )}
          </Stack>

          {/* Active filter badges */}
          <Stack direction="row" spacing={1} sx={{ mt: 1.5, pt: 1.25, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <Chip
              size="small"
              label={`Period: ${period}`}
              onDelete={() => setPeriod("All")}
              sx={{
                bgcolor: "rgba(255,255,255,0.08)",
                color: COLOR.textSub,
                borderRadius: "8px",
                fontSize: "0.72rem",
                fontWeight: 700,
                "& .MuiChip-deleteIcon": { color: COLOR.textSub, "&:hover": { color: "#fff" } },
              }}
            />
          </Stack>
        </Paper>

        {/* ── 2-Column Content Layout ── */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "340px 1fr" }, gap: 2.5 }}>
          
          {/* Left Column: Monthly Calendar View */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: "18px",
              bgcolor: COLOR.card,
              border: `1px solid ${COLOR.border}`,
              height: "fit-content",
            }}
          >
            {/* Header */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Box>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Box sx={{ width: 28, height: 28, borderRadius: "8px", bgcolor: "rgba(147, 51, 234, 0.15)", color: "#c084fc", display: "grid", placeItems: "center" }}>
                    <CalendarToday sx={{ fontSize: 15 }} />
                  </Box>
                  <Typography variant="subtitle1" fontWeight={800} sx={{ color: COLOR.text }}>
                    {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </Typography>
                </Stack>
                <Typography variant="caption" sx={{ color: COLOR.textMuted, fontSize: "0.72rem", display: "block", mt: 0.2 }}>
                  Monthly attendance overview
                </Typography>
              </Box>

              <Stack direction="row" spacing={0.5}>
                <IconButton
                  size="small"
                  onClick={() => {
                    userSwitchedMonthRef.current = true;
                    setCurrentMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
                    setTablePage(1);
                  }}
                  sx={{ color: COLOR.textSub, border: `1px solid ${COLOR.border}`, borderRadius: "8px" }}
                >
                  <ChevronLeft sx={{ fontSize: 16 }} />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => {
                    userSwitchedMonthRef.current = true;
                    setCurrentMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
                    setTablePage(1);
                  }}
                  sx={{ color: COLOR.textSub, border: `1px solid ${COLOR.border}`, borderRadius: "8px" }}
                >
                  <ChevronRight sx={{ fontSize: 16 }} />
                </IconButton>
              </Stack>
            </Stack>

            {/* Days Header */}
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0.5, mb: 1, textAlign: "center" }}>
              {DOW.map((day) => (
                <Typography key={day} variant="caption" fontWeight={800} sx={{ color: COLOR.textMuted, fontSize: "0.65rem" }}>
                  {day}
                </Typography>
              ))}
            </Box>

            {/* Calendar Cells Grid */}
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0.75, mb: 3 }}>
              {calendarCells.map((cell, idx) => {
                if (!cell.isCurrent) {
                  return (
                    <Box key={`empty-${idx}`} sx={{ height: 36, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.15)", fontSize: "0.75rem", fontWeight: 600 }}>
                      {cell.day}
                    </Box>
                  );
                }

                const isSelected = selectedDate.getDate() === cell.day && selectedDate.getMonth() === currentMonth.getMonth() && selectedDate.getFullYear() === currentMonth.getFullYear();
                const isPresent = cell.status === "present";
                const isAbsent = cell.status === "absent";
                const isHoliday = cell.status === "holiday";
                const isLate = cell.status === "late";
                const isLeave = cell.status === "leave";

                return (
                  <Box
                    key={`day-${cell.day}`}
                    onClick={() => handleCalendarCellClick(cell)}
                    sx={{
                      height: 38,
                      borderRadius: "10px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      fontSize: "0.8rem",
                      fontWeight: 800,
                      position: "relative",
                      transition: "all 0.15s ease",
                      bgcolor: isSelected
                        ? (isPresent ? "rgba(16, 185, 129, 0.25)" : isAbsent ? "rgba(239, 68, 68, 0.25)" : isHoliday ? "rgba(59, 130, 246, 0.25)" : "rgba(37, 99, 235, 0.2)")
                        : isPresent
                        ? (isDark ? "rgba(16, 185, 129, 0.15)" : "#ecfdf5")
                        : isAbsent
                        ? (isDark ? "rgba(239, 68, 68, 0.15)" : "#fef2f2")
                        : isHoliday
                        ? (isDark ? "rgba(59, 130, 246, 0.15)" : "#eff6ff")
                        : isLeave
                        ? (isDark ? "rgba(245, 158, 11, 0.15)" : "#fffbeb")
                        : (isDark ? "rgba(255,255,255,0.03)" : "#f8fafc"),
                      color: isPresent
                        ? "#10b981"
                        : isAbsent
                        ? "#ef4444"
                        : isHoliday
                        ? "#2563eb"
                        : isLeave || isLate
                        ? "#f59e0b"
                        : (isDark ? "#94a3b8" : "#475569"),
                      border: isSelected
                        ? `2px solid ${isPresent ? "#10b981" : isAbsent ? "#ef4444" : isHoliday ? "#2563eb" : "#3b82f6"}`
                        : isPresent
                        ? (isDark ? "1px solid rgba(16, 185, 129, 0.4)" : "1px solid #6ee7b7")
                        : isAbsent
                        ? (isDark ? "1px solid rgba(239, 68, 68, 0.4)" : "1px solid #fca5a5")
                        : isHoliday
                        ? (isDark ? "1px solid rgba(59, 130, 246, 0.4)" : "1px solid #bfdbfe")
                        : isLeave || isLate
                        ? (isDark ? "1px solid rgba(245, 158, 11, 0.4)" : "1px solid #fde68a")
                        : (isDark ? `1px solid ${COLOR.border}` : "1px solid #e2e8f0"),
                      "&:hover": {
                        transform: "translateY(-1px)",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                      },
                    }}
                  >
                    {cell.day}
                    {(isPresent || isAbsent || isHoliday || isLate || isLeave) && (
                      <Box
                        sx={{
                          position: "absolute",
                          bottom: 3,
                          width: 5,
                          height: 5,
                          borderRadius: "50%",
                          bgcolor: isPresent
                            ? "#10b981"
                            : isAbsent
                            ? "#ef4444"
                            : isHoliday
                            ? "#2563eb"
                            : "#f59e0b",
                        }}
                      />
                    )}
                  </Box>
                );
              })}
            </Box>

            {/* Calendar Legend */}
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ pt: 2, borderTop: `1px solid ${COLOR.border}` }}>
              <Chip
                size="small"
                icon={<Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: COLOR.green, ml: "8px !important" }} />}
                label="Present"
                sx={{ bgcolor: COLOR.cardHeader, color: COLOR.textSub, border: `1px solid ${COLOR.border}`, fontSize: "0.7rem", fontWeight: 700, height: 26 }}
              />
              <Chip
                size="small"
                icon={<Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: COLOR.amber, ml: "8px !important" }} />}
                label="Leave"
                sx={{ bgcolor: COLOR.cardHeader, color: COLOR.textSub, border: `1px solid ${COLOR.border}`, fontSize: "0.7rem", fontWeight: 700, height: 26 }}
              />
              <Chip
                size="small"
                icon={<Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: COLOR.blue, ml: "8px !important" }} />}
                label="Holiday"
                sx={{ bgcolor: COLOR.cardHeader, color: COLOR.textSub, border: `1px solid ${COLOR.border}`, fontSize: "0.7rem", fontWeight: 700, height: 26 }}
              />
              <Chip
                size="small"
                icon={<Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: COLOR.red, ml: "8px !important" }} />}
                label="Absent"
                sx={{ bgcolor: COLOR.cardHeader, color: COLOR.textSub, border: `1px solid ${COLOR.border}`, fontSize: "0.7rem", fontWeight: 700, height: 26 }}
              />
            </Stack>
          </Paper>

          {/* Right Column: Attendance Log Table Card */}
          <Paper
            elevation={0}
            sx={{
              borderRadius: "18px",
              bgcolor: COLOR.card,
              border: `1px solid ${COLOR.border}`,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Table Header Bar */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 3, py: 2, borderBottom: `1px solid ${COLOR.border}`, bgcolor: COLOR.cardHeader }}>
              <Box>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Box sx={{ width: 28, height: 28, borderRadius: "8px", bgcolor: alpha(COLOR.blue, 0.15), color: COLOR.blue, display: "grid", placeItems: "center" }}>
                    <AccessTime sx={{ fontSize: 16 }} />
                  </Box>
                  <Typography variant="subtitle1" fontWeight={800} sx={{ color: COLOR.text }}>
                    Attendance Log — {currentMonth.toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                  </Typography>
                </Stack>
                <Typography variant="caption" sx={{ color: COLOR.textMuted, fontSize: "0.72rem", display: "block", mt: 0.2 }}>
                  {filteredRows.length} total records
                </Typography>
              </Box>

              <Button
                variant="contained"
                disableElevation
                startIcon={<History sx={{ fontSize: 16 }} />}
                onClick={() =>
                  navigate(isAdminView ? `/attendance-history/${paramUserId}` : `/attendance-history/${user?._id || user?.id || "me"}`, {
                    state: {
                      userId: paramUserId,
                      memberName: displayName,
                      memberRole: displayRole,
                      memberPhone: displayPhone,
                      memberEmail: displayEmail,
                    },
                  })
                }
                sx={{
                  bgcolor: COLOR.orange,
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: "0.78rem",
                  borderRadius: "10px",
                  height: 34,
                  px: 2,
                  textTransform: "none",
                  boxShadow: "0 4px 12px rgba(217, 119, 6, 0.25)",
                  "&:hover": { bgcolor: "#b45309" },
                }}
              >
                History
              </Button>
            </Stack>

            {/* Table Content */}
            <TableContainer sx={{ flex: 1 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: COLOR.bg }}>
                    {["DATE", "PUNCH IN", "PUNCH OUT", "HOURS", "STATUS", "ACTION"].map((head) => (
                      <TableCell key={head} sx={{ color: COLOR.textMuted, fontWeight: 800, fontSize: "0.68rem", letterSpacing: "0.05em", py: 1.5, borderColor: COLOR.border }}>
                        {head}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={6} sx={{ borderColor: COLOR.border, py: 1.5 }}>
                          <Skeleton variant="text" width="100%" height={30} sx={{ bgcolor: "rgba(255,255,255,0.06)" }} />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : paginatedRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} sx={{ textAlign: "center", py: 6, color: COLOR.textMuted, borderColor: COLOR.border }}>
                        No records match your filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedRows.map((row, idx) => {
                      const isPresent = row.status.toLowerCase() === "present";
                      const isAbsent = row.status.toLowerCase() === "absent";
                      const isLate = row.status.toLowerCase() === "late";
                      const isHoliday = row.status.toLowerCase() === "holiday";
                      const isLeave = row.status.toLowerCase() === "leave";

                      return (
                        <TableRow
                          key={row.dateKey + idx}
                          onClick={() => handleRowClick(row)}
                          sx={{
                            borderBottom: `1px solid ${COLOR.border}`,
                            cursor: "pointer",
                            transition: "background-color 0.15s ease",
                            "&:hover": { bgcolor: COLOR.cardHover },
                          }}
                        >
                          {/* Date */}
                          <TableCell sx={{ color: COLOR.text, fontWeight: 700, fontSize: "0.82rem", borderColor: COLOR.border, py: 1.75 }}>
                            {row.dateFormatted}
                          </TableCell>

                          {/* Punch In */}
                          <TableCell sx={{ borderColor: COLOR.border, py: 1.75 }}>
                            {row.punchInTime !== "—" ? (
                              <Box
                                sx={{
                                  display: "inline-flex",
                                  px: 1.2,
                                  py: 0.4,
                                  borderRadius: "8px",
                                  bgcolor: "rgba(16, 185, 129, 0.12)",
                                  border: "1px solid rgba(16, 185, 129, 0.3)",
                                  color: "#34d399",
                                  fontWeight: 700,
                                  fontSize: "0.75rem",
                                }}
                              >
                                {row.punchInTime}
                              </Box>
                            ) : (
                              <Typography sx={{ color: COLOR.textMuted, fontSize: "0.82rem" }}>—</Typography>
                            )}
                          </TableCell>

                          {/* Punch Out */}
                          <TableCell sx={{ borderColor: COLOR.border, py: 1.75 }}>
                            {row.punchOutTime === "Ongoing" ? (
                              <Box
                                sx={{
                                  display: "inline-flex",
                                  px: 1.2,
                                  py: 0.4,
                                  borderRadius: "8px",
                                  bgcolor: "rgba(59, 130, 246, 0.15)",
                                  border: "1px solid rgba(59, 130, 246, 0.3)",
                                  color: "#60a5fa",
                                  fontWeight: 700,
                                  fontSize: "0.75rem",
                                }}
                              >
                                Ongoing
                              </Box>
                            ) : row.punchOutTime !== "—" ? (
                              <Box
                                sx={{
                                  display: "inline-flex",
                                  px: 1.2,
                                  py: 0.4,
                                  borderRadius: "8px",
                                  bgcolor: "rgba(245, 158, 11, 0.12)",
                                  border: "1px solid rgba(245, 158, 11, 0.3)",
                                  color: "#fbbf24",
                                  fontWeight: 700,
                                  fontSize: "0.75rem",
                                }}
                              >
                                {row.punchOutTime}
                              </Box>
                            ) : (
                              <Typography sx={{ color: COLOR.textMuted, fontSize: "0.82rem" }}>—</Typography>
                            )}
                          </TableCell>

                          {/* Hours */}
                          <TableCell sx={{ color: COLOR.text, fontWeight: 700, fontSize: "0.82rem", borderColor: COLOR.border, py: 1.75 }}>
                            {row.hours}
                          </TableCell>

                          {/* Status Badge */}
                          <TableCell sx={{ borderColor: COLOR.border, py: 1.75 }}>
                            <Chip
                              size="small"
                              icon={
                                isPresent ? (
                                  <CheckCircle sx={{ fontSize: "14px !important", color: `${COLOR.green} !important` }} />
                                ) : isAbsent ? (
                                  <ErrorIcon sx={{ fontSize: "14px !important", color: `${COLOR.red} !important` }} />
                                ) : isHoliday ? (
                                  <CalendarToday sx={{ fontSize: "14px !important", color: `${COLOR.blue} !important` }} />
                                ) : isLeave ? (
                                  <Person sx={{ fontSize: "14px !important", color: "#c084fc !important" }} />
                                ) : (
                                  <Warning sx={{ fontSize: "14px !important", color: `${COLOR.amber} !important` }} />
                                )
                              }
                              label={row.status}
                              sx={{
                                height: 24,
                                borderRadius: "999px",
                                fontWeight: 800,
                                fontSize: "0.72rem",
                                bgcolor: isPresent
                                  ? "rgba(16, 185, 129, 0.12)"
                                  : isAbsent
                                  ? "rgba(239, 68, 68, 0.12)"
                                  : isHoliday
                                  ? "rgba(59, 130, 246, 0.12)"
                                  : isLeave
                                  ? "rgba(168, 85, 247, 0.12)"
                                  : "rgba(245, 158, 11, 0.12)",
                                color: isPresent
                                  ? COLOR.green
                                  : isAbsent
                                  ? COLOR.red
                                  : isHoliday
                                  ? COLOR.blue
                                  : isLeave
                                  ? "#c084fc"
                                  : COLOR.amber,
                                border: isPresent
                                  ? "1px solid rgba(16, 185, 129, 0.3)"
                                  : isAbsent
                                  ? "1px solid rgba(239, 68, 68, 0.3)"
                                  : isHoliday
                                  ? "1px solid rgba(59, 130, 246, 0.3)"
                                  : isLeave
                                  ? "1px solid rgba(168, 85, 247, 0.3)"
                                  : "1px solid rgba(245, 158, 11, 0.3)",
                              }}
                            />
                          </TableCell>

                          {/* Action Column */}
                          <TableCell sx={{ borderColor: COLOR.border, py: 1.25 }} onClick={(e) => e.stopPropagation()}>
                            {canManageAttendance ? (
                              isAbsent ? (
                                <Button
                                  size="small"
                                  variant="contained"
                                  disabled={updatingDateKey === row.dateKey}
                                  onClick={() => handleQuickMark(row, "present")}
                                  startIcon={
                                    updatingDateKey === row.dateKey ? (
                                      <CircularProgress size={12} color="inherit" />
                                    ) : (
                                      <CheckCircle sx={{ fontSize: 14 }} />
                                    )
                                  }
                                  sx={{
                                    bgcolor: COLOR.green,
                                    color: "#fff",
                                    fontSize: "0.72rem",
                                    fontWeight: 800,
                                    textTransform: "none",
                                    borderRadius: "8px",
                                    py: 0.4,
                                    px: 1.4,
                                    boxShadow: "0 2px 8px rgba(16, 185, 129, 0.25)",
                                    "&:hover": { bgcolor: "#059669" },
                                  }}
                                >
                                  {updatingDateKey === row.dateKey ? "Saving..." : "Mark Present"}
                                </Button>
                              ) : isPresent ? (
                                <Stack direction="row" spacing={0.8} alignItems="center">
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    disabled={updatingDateKey === row.dateKey}
                                    onClick={() => handleQuickMark(row, "absent")}
                                    startIcon={
                                      updatingDateKey === row.dateKey ? (
                                        <CircularProgress size={12} color="inherit" />
                                      ) : (
                                        <Close sx={{ fontSize: 13 }} />
                                      )
                                    }
                                    sx={{
                                      color: COLOR.red,
                                      borderColor: "rgba(239, 68, 68, 0.4)",
                                      fontSize: "0.7rem",
                                      fontWeight: 700,
                                      textTransform: "none",
                                      borderRadius: "8px",
                                      py: 0.3,
                                      px: 1,
                                      "&:hover": {
                                        borderColor: COLOR.red,
                                        bgcolor: "rgba(239, 68, 68, 0.1)",
                                      },
                                    }}
                                  >
                                    {updatingDateKey === row.dateKey ? "Saving..." : "Mark Absent"}
                                  </Button>
                                  <Tooltip title="Edit punch hours or details">
                                    <IconButton
                                      size="small"
                                      onClick={() => handleRowClick(row)}
                                      sx={{
                                        color: COLOR.textSub,
                                        border: `1px solid ${COLOR.border}`,
                                        borderRadius: "8px",
                                        p: 0.5,
                                        "&:hover": { color: COLOR.blue, borderColor: COLOR.blue, bgcolor: alpha(COLOR.blue, 0.1) },
                                      }}
                                    >
                                      <AccessTime sx={{ fontSize: 14 }} />
                                    </IconButton>
                                  </Tooltip>
                                </Stack>
                              ) : (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  disabled={updatingDateKey === row.dateKey}
                                  onClick={() => handleQuickMark(row, "present")}
                                  startIcon={
                                    updatingDateKey === row.dateKey ? (
                                      <CircularProgress size={12} color="inherit" />
                                    ) : (
                                      <CheckCircle sx={{ fontSize: 14 }} />
                                    )
                                  }
                                  sx={{
                                    color: COLOR.green,
                                    borderColor: "rgba(16, 185, 129, 0.4)",
                                    fontSize: "0.7rem",
                                    fontWeight: 700,
                                    textTransform: "none",
                                    borderRadius: "8px",
                                    py: 0.3,
                                    px: 1,
                                    "&:hover": {
                                      borderColor: COLOR.green,
                                      bgcolor: "rgba(16, 185, 129, 0.1)",
                                    },
                                  }}
                                >
                                  {updatingDateKey === row.dateKey ? "Saving..." : "Mark Present"}
                                </Button>
                              )
                            ) : (
                              <Button
                                size="small"
                                variant="text"
                                onClick={() => handleRowClick(row)}
                                sx={{ color: COLOR.textSub, fontSize: "0.72rem", textTransform: "none" }}
                              >
                                View
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination Bar */}
            <Stack direction="row" justifyContent="center" alignItems="center" spacing={1} sx={{ py: 2, px: 3, borderTop: `1px solid ${COLOR.border}`, bgcolor: COLOR.cardHeader }}>
              <IconButton
                size="small"
                disabled={tablePage === 1}
                onClick={() => setTablePage((prev) => Math.max(prev - 1, 1))}
                sx={{ color: COLOR.textSub, "&.Mui-disabled": { opacity: 0.3 } }}
              >
                <ChevronLeft sx={{ fontSize: 18 }} />
              </IconButton>

              {Array.from({ length: totalTablePages }, (_, i) => i + 1).map((pageNum) => (
                <Box
                  key={pageNum}
                  onClick={() => setTablePage(pageNum)}
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: "8px",
                    display: "grid",
                    placeItems: "center",
                    cursor: "pointer",
                    fontSize: "0.78rem",
                    fontWeight: 800,
                    bgcolor: tablePage === pageNum ? COLOR.blue : "transparent",
                    color: tablePage === pageNum ? "#fff" : COLOR.textSub,
                    "&:hover": { bgcolor: tablePage === pageNum ? COLOR.blue : "rgba(255,255,255,0.06)" },
                  }}
                >
                  {pageNum}
                </Box>
              ))}

              <IconButton
                size="small"
                disabled={tablePage === totalTablePages}
                onClick={() => setTablePage((prev) => Math.min(prev + 1, totalTablePages))}
                sx={{ color: COLOR.textSub, "&.Mui-disabled": { opacity: 0.3 } }}
              >
                <ChevronRight sx={{ fontSize: 18 }} />
              </IconButton>
            </Stack>

          </Paper>

        </Box>

        {/* ── Attendance Details Popup Modal ── */}
        <AttendanceDetails
          open={detailsOpen}
          onClose={() => setDetailsOpen(false)}
          attendance={selectedAttendance}
          canEdit={true}
          canDelete={true}
          onEdit={handleEditAttendance}
          onDelete={handleDeleteAttendance}
        />

      </Box>
    </Box>
  );
}
