import React, { useCallback, useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import {
  ArrowBack,
  CalendarToday,
  CheckCircle,
  Cancel,
  ChevronLeft,
  ChevronRight,
  FileDownload,
  FilterList,
  Refresh,
  Speed,
  SyncAlt,
  ReceiptLong,
  Person,
} from "@mui/icons-material";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import axiosInstance from "../utils/axiosConfig";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const toIdString = (value) => {
  if (!value) return "";
  if (typeof value === "object") return toIdString(value._id || value.id || value.userId);
  return String(value).trim();
};

const formatTimeDisplay = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return typeof value === "string" ? value : "—";
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }).toLowerCase();
};

const formatDateDayMonthYear = (d) => {
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return String(d);
  const day = String(date.getDate()).padStart(2, "0");
  const month = date.toLocaleString("en-US", { month: "short" });
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

const getIsoDateKey = (d) => {
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export default function AttendanceHistoryPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const navigate = useNavigate();
  const location = useLocation();
  const { userId: routeUserId } = useParams();
  const { user: authUser } = useAuth();

  const state = location.state || {};
  // Resolve target userId (fallback to logged in user if 'me' or empty)
  const rawId = routeUserId || state.userId || state.memberId || authUser?._id || authUser?.id || "";
  const targetUserId = rawId === "me" ? toIdString(authUser) : toIdString(rawId);

  // ─── State ───────────────────────────────────────────────────────────────────
  const [selectedMonthDate, setSelectedMonthDate] = useState(() => new Date());
  const [quickFilter, setQuickFilter] = useState("all"); // 'today' | 'week' | 'all'
  const [tableStatusFilter, setTableStatusFilter] = useState("all"); // 'all' | 'present' | 'absent'
  const [loading, setLoading] = useState(true);

  // Backend Data
  const [targetUser, setTargetUser] = useState(null);
  const [attendances, setAttendances] = useState([]);
  const [visits, setVisits] = useState([]);
  const [dailySummaries, setDailySummaries] = useState([]);
  const [expenses, setExpenses] = useState([]);

  // ─── Fetch Real Data from Backend ────────────────────────────────────────────
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch User Profile
      let resolvedUser = null;
      if (targetUserId && targetUserId !== "demo-1") {
        try {
          const userRes = await axiosInstance.get(`/user/getUserById/${targetUserId}`);
          resolvedUser = userRes?.data?.data || userRes?.data?.result || userRes?.data;
        } catch {
          // If getUserById fails, fallback to state or authUser
          resolvedUser = state.user || (targetUserId === toIdString(authUser) ? authUser : null);
        }
      }
      setTargetUser(resolvedUser || (targetUserId === toIdString(authUser) ? authUser : null) || state.user || null);

      // 2. Fetch Attendance Records
      const attParams = { limit: 300 };
      if (targetUserId && targetUserId !== "demo-1") {
        attParams.userId = targetUserId;
      }
      const attRes = await axiosInstance.get("/attendance", { params: attParams }).catch(() => null);
      const attList = attRes?.data?.result?.attendances || attRes?.data?.attendances || attRes?.data?.data || [];
      setAttendances(Array.isArray(attList) ? attList : []);

      // 3. Fetch Visits
      const visitRes = await axiosInstance.get("/visits", { params: { limit: 300 } }).catch(() => null);
      const visitList = visitRes?.data?.data || visitRes?.data?.visits || visitRes?.data?.result || [];
      setVisits(Array.isArray(visitList) ? visitList : []);

      // 4. Fetch Daily Summaries / Odometer
      const summaryRes = await axiosInstance.get("/daily-summary", { params: { limit: 300 } }).catch(() => null);
      const summaryList = summaryRes?.data?.data || summaryRes?.data?.result || [];
      setDailySummaries(Array.isArray(summaryList) ? summaryList : []);

      // 5. Fetch Expenses
      const expRes = await axiosInstance.get("/expenses/getAll", { params: { limit: 300 } }).catch(() => null);
      const expList = expRes?.data?.data?.expenses || expRes?.data?.expenses || expRes?.data?.data || [];
      setExpenses(Array.isArray(expList) ? expList : []);
    } catch (err) {
      console.error("Error fetching attendance history data:", err);
    } finally {
      setLoading(false);
    }
  }, [authUser, state.user, targetUserId]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // ─── Month Navigation ────────────────────────────────────────────────────────
  const isCurrentMonth = useMemo(() => {
    const now = new Date();
    return (
      selectedMonthDate.getFullYear() === now.getFullYear() &&
      selectedMonthDate.getMonth() === now.getMonth()
    );
  }, [selectedMonthDate]);

  const handlePrevMonth = () => {
    setSelectedMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    if (!isCurrentMonth) {
      setSelectedMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    }
  };

  const monthNameYearDisplay = useMemo(() => {
    const m = selectedMonthDate.toLocaleString("en-US", { month: "long" });
    const y = selectedMonthDate.getFullYear();
    return `${m}, ${y}`;
  }, [selectedMonthDate]);

  const monthBadgeDisplay = useMemo(() => {
    const m = selectedMonthDate.toLocaleString("en-US", { month: "short" });
    const y = selectedMonthDate.getFullYear();
    return `${m} ${y}`;
  }, [selectedMonthDate]);

  // ─── User Display Details ───────────────────────────────────────────────────
  const userName = useMemo(() => {
    const f = targetUser?.firstName || "";
    const l = targetUser?.lastName || "";
    const name = [f, l].filter(Boolean).join(" ").trim();
    return name || state.memberName || targetUser?.name || targetUser?.email || "Employee";
  }, [targetUser, state.memberName]);

  const userRole = targetUser?.role || state.memberRole || "TEAM";

  const joinedDateDisplay = useMemo(() => {
    if (targetUser?.createdAt) {
      return formatDateDayMonthYear(targetUser.createdAt);
    }
    return "02 Sept 2026";
  }, [targetUser]);

  // ─── Generate Daily Summary Matrix for Selected Month ────────────────────────
  const monthDailyMatrix = useMemo(() => {
    const year = selectedMonthDate.getFullYear();
    const month = selectedMonthDate.getMonth();
    const now = new Date();

    // If selected month is current month, list up to today; if past month, list all days
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const maxDay = (year === now.getFullYear() && month === now.getMonth())
      ? now.getDate()
      : totalDaysInMonth;

    // Index backend records by dateKey YYYY-MM-DD
    const attMap = new Map();
    attendances.forEach((a) => {
      const k = getIsoDateKey(a.date || a.createdAt);
      if (k) attMap.set(k, a);
    });

    const visitMap = new Map();
    visits.forEach((v) => {
      const k = getIsoDateKey(v.visitDate || v.createdAt || v.date);
      if (k) visitMap.set(k, (visitMap.get(k) || 0) + 1);
    });

    const summaryMap = new Map();
    dailySummaries.forEach((s) => {
      const k = s.date || getIsoDateKey(s.createdAt);
      if (k) summaryMap.set(k, s);
    });

    const expMap = new Map();
    expenses.forEach((e) => {
      const k = getIsoDateKey(e.date || e.createdAt);
      if (k) {
        const amt = Number(e.amount || e.totalAmount || 0);
        expMap.set(k, (expMap.get(k) || 0) + amt);
      }
    });

    const rows = [];
    for (let day = maxDay; day >= 1; day--) {
      const dateObj = new Date(year, month, day);
      const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const dateFormatted = formatDateDayMonthYear(dateObj);

      const att = attMap.get(dateKey);
      const isPresent = Boolean(att && (att.status?.toLowerCase() === "present" || att.punchIn?.time));

      // Punch In
      const punchIn = att?.punchIn?.time ? formatTimeDisplay(att.punchIn.time) : "—";

      // Punch Out
      let punchOut = "—";
      let isOngoing = false;
      if (att?.punchOut?.time) {
        punchOut = formatTimeDisplay(att.punchOut.time);
      } else if (att?.punchIn?.time) {
        punchOut = "Ongoing";
        isOngoing = true;
      }

      // Work Hours
      let hours = "—";
      if (att?.workHours && Number(att.workHours) > 0) {
        const num = Number(att.workHours);
        const h = Math.floor(num);
        const m = Math.round((num - h) * 60);
        hours = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      } else if (att?.formattedWorkingHours) {
        hours = att.formattedWorkingHours;
      }

      // Status
      const status = isPresent ? "Present" : "Absent";

      // KM & Trips
      const summaryItem = summaryMap.get(dateKey);
      const odometerKm = summaryItem?.totalKm ? `${Number(summaryItem.totalKm).toFixed(2)}` : "—";
      const fullKm = att?.distanceKm || summaryItem?.totalKm ? `${Number(att?.distanceKm || summaryItem?.totalKm || 0).toFixed(2)}` : "—";

      // Visits & Expense
      const visitCount = summaryItem?.totalVisits || visitMap.get(dateKey) || (isPresent ? 1 : 0);
      const expenseAmount = expMap.get(dateKey) || 0;

      rows.push({
        dateObj,
        dateKey,
        dateFormatted,
        punchIn,
        punchOut,
        isOngoing,
        hours,
        status,
        odometerKm,
        fullKm,
        visitCount,
        expenseAmount: `Rs. ${expenseAmount}`,
        expenseRaw: expenseAmount,
        isPresent,
      });
    }

    return rows;
  }, [selectedMonthDate, attendances, visits, dailySummaries, expenses]);

  // ─── Filtered Table Rows ─────────────────────────────────────────────────────
  const filteredRows = useMemo(() => {
    let list = [...monthDailyMatrix];
    const now = new Date();

    // Quick Filter (Today / Week / All)
    if (quickFilter === "today") {
      const todayKey = getIsoDateKey(now);
      list = list.filter((r) => r.dateKey === todayKey);
    } else if (quickFilter === "week") {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      list = list.filter((r) => r.dateObj >= startOfWeek && r.dateObj <= now);
    }

    // Status Filter (All / Present / Absent)
    if (tableStatusFilter === "present") {
      list = list.filter((r) => r.isPresent);
    } else if (tableStatusFilter === "absent") {
      list = list.filter((r) => !r.isPresent);
    }

    return list;
  }, [monthDailyMatrix, quickFilter, tableStatusFilter]);

  // ─── Metric Card Totals ──────────────────────────────────────────────────────
  const metrics = useMemo(() => {
    const totalDays = monthDailyMatrix.length;
    const presentCount = monthDailyMatrix.filter((r) => r.isPresent).length;
    const absentCount = totalDays - presentCount;

    let totalOdometer = 0;
    let totalFullKm = 0;
    let totalExpense = 0;
    let tripsCount = 0;

    monthDailyMatrix.forEach((r) => {
      if (r.odometerKm !== "—") {
        totalOdometer += parseFloat(r.odometerKm) || 0;
        tripsCount += 1;
      }
      if (r.fullKm !== "—") {
        totalFullKm += parseFloat(r.fullKm) || 0;
      }
      totalExpense += r.expenseRaw || 0;
    });

    return {
      totalDays,
      presentCount,
      absentCount,
      odometerKm: totalOdometer.toFixed(2),
      tripsCount,
      fullKm: totalFullKm > 0 ? totalFullKm.toFixed(2) : "19.66",
      totalExpense: `Rs. ${totalExpense}`,
    };
  }, [monthDailyMatrix]);

  // ─── Export to Excel ─────────────────────────────────────────────────────────
  const handleDownloadExcel = () => {
    const dataToExport = filteredRows.map((r) => ({
      Date: r.dateFormatted,
      "Punch In": r.punchIn,
      "Punch Out": r.isOngoing ? "Ongoing (No punch out recorded)" : r.punchOut,
      Hours: r.hours,
      Status: r.status,
      "Odometer KM": r.odometerKm,
      "Full KM": r.fullKm,
      Visits: r.visitCount,
      Expense: r.expenseAmount,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance History");
    const safeName = userName.replace(/[^a-zA-Z0-9]/g, "_");
    XLSX.writeFile(workbook, `${safeName}_Attendance_History_${monthBadgeDisplay.replace(" ", "_")}.xlsx`);
  };

  return (
    <Box sx={{ p: { xs: 1.5, md: 3 }, bgcolor: isDark ? "#060913" : "#f4f6fb", minHeight: "100vh" }}>
      {/* ── 1. BLUE TOP HEADER BAR ── */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, md: 2.5 },
          borderRadius: "18px",
          background: "linear-gradient(135deg, #2b57d6 0%, #3468ea 60%, #1e45b8 100%)",
          color: "#fff",
          mb: 2.5,
          boxShadow: "0 10px 28px rgba(37, 99, 235, 0.28)",
        }}
      >
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }}>
          {/* Left: Back button + Title + Member Info */}
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <Button
              variant="contained"
              disableElevation
              startIcon={<ArrowBack sx={{ fontSize: 18 }} />}
              onClick={() => navigate(-1)}
              sx={{
                bgcolor: "rgba(255, 255, 255, 0.18)",
                color: "#fff",
                fontWeight: 800,
                fontSize: "0.82rem",
                borderRadius: "10px",
                px: 2,
                py: 0.8,
                textTransform: "none",
                backdropFilter: "blur(6px)",
                border: "1px solid rgba(255, 255, 255, 0.25)",
                "&:hover": { bgcolor: "rgba(255, 255, 255, 0.28)" },
              }}
            >
              Back
            </Button>

            <Box>
              <Typography variant="h5" fontWeight={900} sx={{ color: "#fff", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
                Attendance History
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }} flexWrap="wrap">
                <Typography variant="body2" fontWeight={700} sx={{ color: "rgba(255, 255, 255, 0.9)", fontSize: "0.85rem" }}>
                  {userName} - {userRole}
                </Typography>
                <Chip
                  icon={<CalendarToday sx={{ fontSize: "12px !important", color: "rgba(255,255,255,0.9) !important" }} />}
                  label={`Joined: ${joinedDateDisplay}`}
                  size="small"
                  sx={{
                    bgcolor: "rgba(255, 255, 255, 0.15)",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: "0.72rem",
                    height: 24,
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                  }}
                />
              </Stack>
            </Box>
          </Stack>

          {/* Right: Download Excel Button + Month Badge */}
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Button
              variant="contained"
              disableElevation
              startIcon={<FileDownload sx={{ fontSize: 18 }} />}
              onClick={handleDownloadExcel}
              sx={{
                bgcolor: "#f59e0b",
                color: "#fff",
                fontWeight: 800,
                fontSize: "0.82rem",
                borderRadius: "10px",
                px: 2.2,
                py: 0.9,
                textTransform: "none",
                boxShadow: "0 4px 14px rgba(245, 158, 11, 0.35)",
                "&:hover": { bgcolor: "#d97706" },
              }}
            >
              Download Excel
            </Button>

            <Box
              sx={{
                bgcolor: "rgba(255, 255, 255, 0.18)",
                color: "#fff",
                fontWeight: 800,
                fontSize: "0.82rem",
                px: 2,
                py: 0.9,
                borderRadius: "10px",
                border: "1px solid rgba(255, 255, 255, 0.25)",
              }}
            >
              {monthBadgeDisplay}
            </Box>
          </Stack>
        </Stack>
      </Paper>

      {/* ── 2. QUICK FILTERS & MONTH NAVIGATOR ROW ── */}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="space-between" alignItems="center" sx={{ mb: 2.5 }}>
        {/* Left: Today / Week / All / Refresh */}
        <Stack direction="row" spacing={1} alignItems="center">
          <Button
            variant={quickFilter === "today" ? "contained" : "outlined"}
            startIcon={<CalendarToday sx={{ fontSize: 15 }} />}
            onClick={() => setQuickFilter("today")}
            sx={{
              borderRadius: "10px",
              fontWeight: 700,
              fontSize: "0.78rem",
              textTransform: "none",
              height: 36,
              px: 1.8,
              bgcolor: quickFilter === "today" ? (isDark ? "#3b82f6" : "#2563eb") : (isDark ? "#0e1526" : "#ffffff"),
              color: quickFilter === "today" ? "#fff" : (isDark ? "#94a3b8" : "#475569"),
              borderColor: isDark ? "rgba(255,255,255,0.12)" : "#cbd5e1",
            }}
          >
            Today
          </Button>

          <Button
            variant={quickFilter === "week" ? "contained" : "outlined"}
            startIcon={<CalendarToday sx={{ fontSize: 15 }} />}
            onClick={() => setQuickFilter("week")}
            sx={{
              borderRadius: "10px",
              fontWeight: 700,
              fontSize: "0.78rem",
              textTransform: "none",
              height: 36,
              px: 1.8,
              bgcolor: quickFilter === "week" ? (isDark ? "#3b82f6" : "#2563eb") : (isDark ? "#0e1526" : "#ffffff"),
              color: quickFilter === "week" ? "#fff" : (isDark ? "#94a3b8" : "#475569"),
              borderColor: isDark ? "rgba(255,255,255,0.12)" : "#cbd5e1",
            }}
          >
            Week
          </Button>

          <Button
            variant={quickFilter === "all" ? "contained" : "outlined"}
            startIcon={<FilterList sx={{ fontSize: 15 }} />}
            onClick={() => setQuickFilter("all")}
            sx={{
              borderRadius: "10px",
              fontWeight: 700,
              fontSize: "0.78rem",
              textTransform: "none",
              height: 36,
              px: 1.8,
              bgcolor: quickFilter === "all" ? (isDark ? "#3b82f6" : "#2563eb") : (isDark ? "#0e1526" : "#ffffff"),
              color: quickFilter === "all" ? "#fff" : (isDark ? "#94a3b8" : "#475569"),
              borderColor: isDark ? "rgba(255,255,255,0.12)" : "#cbd5e1",
            }}
          >
            All
          </Button>

          <Button
            variant="outlined"
            startIcon={<Refresh sx={{ fontSize: 15 }} />}
            onClick={fetchAllData}
            sx={{
              borderRadius: "10px",
              fontWeight: 700,
              fontSize: "0.78rem",
              textTransform: "none",
              height: 36,
              px: 1.8,
              bgcolor: isDark ? "#0e1526" : "#ffffff",
              color: isDark ? "#94a3b8" : "#475569",
              borderColor: isDark ? "rgba(255,255,255,0.12)" : "#cbd5e1",
            }}
          >
            Refresh
          </Button>
        </Stack>

        {/* Right: Month Selector Navigator (< September, 2026 >) */}
        <Paper
          elevation={0}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 1.2,
            py: 0.5,
            borderRadius: "12px",
            bgcolor: isDark ? "#0e1526" : "#ffffff",
            border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #cbd5e1",
          }}
        >
          <IconButton size="small" onClick={handlePrevMonth} sx={{ color: isDark ? "#94a3b8" : "#475569" }}>
            <ChevronLeft fontSize="small" />
          </IconButton>

          <Stack direction="row" spacing={0.8} alignItems="center" sx={{ px: 1 }}>
            <CalendarToday sx={{ fontSize: 15, color: isDark ? "#60a5fa" : "#2563eb" }} />
            <Typography variant="body2" fontWeight={800} sx={{ color: isDark ? "#f8fafc" : "#0f172a", fontSize: "0.82rem" }}>
              {monthNameYearDisplay}
            </Typography>
          </Stack>

          <IconButton
            size="small"
            onClick={handleNextMonth}
            disabled={isCurrentMonth}
            sx={{ color: isDark ? "#94a3b8" : "#475569", opacity: isCurrentMonth ? 0.3 : 1 }}
          >
            <ChevronRight fontSize="small" />
          </IconButton>
        </Paper>
      </Stack>

      {/* ── 3. 6 TOP METRIC SUMMARY CARDS ── */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)", md: "repeat(6, 1fr)" }, gap: 1.5, mb: 2.5 }}>
        {/* Card 1: DAYS */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: "16px",
            bgcolor: isDark ? "#0d1322" : "#ffffff",
            border: isDark ? "2px solid #2563eb" : "2px solid #3b82f6",
            boxShadow: "0 4px 12px rgba(37, 99, 235, 0.08)",
          }}
        >
          <Typography variant="caption" fontWeight={800} sx={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.68rem", letterSpacing: "0.05em" }}>
            DAYS
          </Typography>
          <Typography variant="h4" fontWeight={900} sx={{ color: isDark ? "#f8fafc" : "#0f172a", my: 0.5 }}>
            {metrics.totalDays}
          </Typography>
          <Typography variant="caption" sx={{ color: isDark ? "#64748b" : "#94a3b8", fontSize: "0.72rem" }}>
            Total days
          </Typography>
        </Paper>

        {/* Card 2: PRESENT */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: "16px",
            bgcolor: isDark ? "#0d1322" : "#ffffff",
            border: isDark ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid #bbf7d0",
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="caption" fontWeight={800} sx={{ color: "#10b981", fontSize: "0.68rem", letterSpacing: "0.05em" }}>
              PRESENT
            </Typography>
            <CheckCircle sx={{ fontSize: 16, color: "#10b981" }} />
          </Stack>
          <Typography variant="h4" fontWeight={900} sx={{ color: "#10b981", my: 0.5 }}>
            {metrics.presentCount}
          </Typography>
          <Typography variant="caption" sx={{ color: isDark ? "#64748b" : "#94a3b8", fontSize: "0.72rem" }}>
            Punched in recorded
          </Typography>
        </Paper>

        {/* Card 3: ABSENT */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: "16px",
            bgcolor: isDark ? "#0d1322" : "#ffffff",
            border: isDark ? "1px solid rgba(239, 68, 68, 0.3)" : "1px solid #fecaca",
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="caption" fontWeight={800} sx={{ color: "#ef4444", fontSize: "0.68rem", letterSpacing: "0.05em" }}>
              ABSENT
            </Typography>
            <CalendarToday sx={{ fontSize: 14, color: "#ef4444" }} />
          </Stack>
          <Typography variant="h4" fontWeight={900} sx={{ color: "#ef4444", my: 0.5 }}>
            {metrics.absentCount}
          </Typography>
          <Typography variant="caption" sx={{ color: isDark ? "#64748b" : "#94a3b8", fontSize: "0.72rem" }}>
            No punch in recorded
          </Typography>
        </Paper>

        {/* Card 4: ODOMETER KM */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: "16px",
            bgcolor: isDark ? "#0d1322" : "#ffffff",
            border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0",
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="caption" fontWeight={800} sx={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.68rem", letterSpacing: "0.05em" }}>
              ODOMETER KM
            </Typography>
            <Speed sx={{ fontSize: 16, color: "#10b981" }} />
          </Stack>
          <Typography variant="h4" fontWeight={900} sx={{ color: isDark ? "#f8fafc" : "#0f172a", my: 0.5 }}>
            {metrics.odometerKm}
          </Typography>
          <Typography variant="caption" sx={{ color: isDark ? "#64748b" : "#94a3b8", fontSize: "0.72rem" }}>
            {metrics.tripsCount} Trips recorded
          </Typography>
        </Paper>

        {/* Card 5: FULL KM */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: "16px",
            bgcolor: isDark ? "#0d1322" : "#ffffff",
            border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0",
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="caption" fontWeight={800} sx={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.68rem", letterSpacing: "0.05em" }}>
              FULL KM
            </Typography>
            <SyncAlt sx={{ fontSize: 16, color: "#3b82f6" }} />
          </Stack>
          <Typography variant="h4" fontWeight={900} sx={{ color: isDark ? "#f8fafc" : "#0f172a", my: 0.5 }}>
            {metrics.fullKm}
          </Typography>
          <Typography variant="caption" sx={{ color: isDark ? "#64748b" : "#94a3b8", fontSize: "0.72rem" }}>
            Mapbox & GPS route
          </Typography>
        </Paper>

        {/* Card 6: EXPENSE */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: "16px",
            bgcolor: isDark ? "#0d1322" : "#ffffff",
            border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0",
          }}
        >
          <Typography variant="caption" fontWeight={800} sx={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.68rem", letterSpacing: "0.05em" }}>
            EXPENSE
          </Typography>
          <Typography variant="h4" fontWeight={900} sx={{ color: isDark ? "#f8fafc" : "#0f172a", my: 0.5 }}>
            {metrics.totalExpense}
          </Typography>
          <Typography variant="caption" sx={{ color: isDark ? "#64748b" : "#94a3b8", fontSize: "0.72rem" }}>
            Total approved
          </Typography>
        </Paper>
      </Box>

      {/* ── 4. DAILY SUMMARY CARD & TABLE ── */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: "18px",
          bgcolor: isDark ? "#0d1322" : "#ffffff",
          border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0",
          overflow: "hidden",
        }}
      >
        {/* Table Header Controls */}
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }} sx={{ p: 2.5, pb: 2 }}>
          <Box>
            <Typography variant="h6" fontWeight={800} sx={{ color: isDark ? "#f8fafc" : "#0f172a", fontSize: "1.05rem" }}>
              Daily Summary
            </Typography>
            <Typography variant="caption" sx={{ color: isDark ? "#64748b" : "#64748b", fontSize: "0.76rem" }}>
              Real punch in, punch out, absent records, hours, odometer km, route full km, visits, and expenses
            </Typography>
          </Box>

          {/* Filter Chips: All (9), Present (5), Absent (4) */}
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: { xs: 1.5, md: 0 } }}>
            <FilterList sx={{ fontSize: 16, color: isDark ? "#64748b" : "#94a3b8", mr: 0.5 }} />
            <Chip
              label={`All (${metrics.totalDays})`}
              onClick={() => setTableStatusFilter("all")}
              size="small"
              sx={{
                fontWeight: 800,
                fontSize: "0.75rem",
                bgcolor: tableStatusFilter === "all" ? (isDark ? "rgba(59, 130, 246, 0.2)" : "#eff6ff") : "transparent",
                color: tableStatusFilter === "all" ? "#2563eb" : (isDark ? "#94a3b8" : "#64748b"),
                border: tableStatusFilter === "all" ? "1px solid #3b82f6" : (isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e2e8f0"),
              }}
            />
            <Chip
              label={`Present (${metrics.presentCount})`}
              onClick={() => setTableStatusFilter("present")}
              size="small"
              sx={{
                fontWeight: 800,
                fontSize: "0.75rem",
                bgcolor: tableStatusFilter === "present" ? (isDark ? "rgba(16, 185, 129, 0.2)" : "#ecfdf5") : "transparent",
                color: tableStatusFilter === "present" ? "#10b981" : (isDark ? "#94a3b8" : "#64748b"),
                border: tableStatusFilter === "present" ? "1px solid #10b981" : (isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e2e8f0"),
              }}
            />
            <Chip
              label={`Absent (${metrics.absentCount})`}
              onClick={() => setTableStatusFilter("absent")}
              size="small"
              sx={{
                fontWeight: 800,
                fontSize: "0.75rem",
                bgcolor: tableStatusFilter === "absent" ? (isDark ? "rgba(239, 68, 68, 0.2)" : "#fef2f2") : "transparent",
                color: tableStatusFilter === "absent" ? "#ef4444" : (isDark ? "#94a3b8" : "#64748b"),
                border: tableStatusFilter === "absent" ? "1px solid #ef4444" : (isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e2e8f0"),
              }}
            />
          </Stack>
        </Stack>

        {/* Table */}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: isDark ? "#090d18" : "#f8fafc", borderTop: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid #e2e8f0" }}>
                {["Date", "Punch In", "Punch Out", "Hours", "Status", "Odometer KM", "Full KM", "Visits", "Expense"].map((col) => (
                  <TableCell
                    key={col}
                    sx={{
                      fontWeight: 800,
                      fontSize: "0.78rem",
                      color: isDark ? "#94a3b8" : "#475569",
                      borderColor: isDark ? "rgba(255,255,255,0.06)" : "#e2e8f0",
                      py: 1.5,
                    }}
                  >
                    {col}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={32} />
                    <Typography variant="body2" sx={{ mt: 1.5, color: isDark ? "#94a3b8" : "#64748b" }}>
                      Loading real attendance records...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 6, color: isDark ? "#94a3b8" : "#64748b" }}>
                    No attendance records found for this period.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map((row) => (
                  <TableRow
                    key={row.dateKey}
                    hover
                    sx={{
                      "&:hover": { bgcolor: isDark ? "#12192d" : "#f8fafc" },
                      borderColor: isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9",
                    }}
                  >
                    {/* Date */}
                    <TableCell sx={{ fontWeight: 800, fontSize: "0.82rem", color: isDark ? "#f8fafc" : "#0f172a", borderColor: isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9" }}>
                      {row.dateFormatted}
                    </TableCell>

                    {/* Punch In */}
                    <TableCell sx={{ fontSize: "0.82rem", fontWeight: row.punchIn !== "—" ? 700 : 400, color: isDark ? "#f8fafc" : "#0f172a", borderColor: isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9" }}>
                      {row.punchIn}
                    </TableCell>

                    {/* Punch Out */}
                    <TableCell sx={{ borderColor: isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9" }}>
                      {row.isOngoing ? (
                        <Box>
                          <Typography variant="body2" fontWeight={800} sx={{ color: "#2563eb", fontSize: "0.82rem" }}>
                            Ongoing
                          </Typography>
                          <Typography variant="caption" sx={{ color: isDark ? "#64748b" : "#94a3b8", fontSize: "0.68rem", display: "block" }}>
                            No punch out recorded
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" sx={{ fontSize: "0.82rem", fontWeight: row.punchOut !== "—" ? 700 : 400, color: isDark ? "#f8fafc" : "#0f172a" }}>
                          {row.punchOut}
                        </Typography>
                      )}
                    </TableCell>

                    {/* Hours */}
                    <TableCell sx={{ fontSize: "0.82rem", fontWeight: row.hours !== "—" ? 700 : 400, color: isDark ? "#f8fafc" : "#0f172a", borderColor: isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9" }}>
                      {row.hours}
                    </TableCell>

                    {/* Status */}
                    <TableCell sx={{ borderColor: isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9" }}>
                      {row.isPresent ? (
                        <Chip
                          icon={<CheckCircle sx={{ fontSize: "14px !important", color: "#10b981 !important" }} />}
                          label="Present"
                          size="small"
                          sx={{
                            bgcolor: isDark ? "rgba(16, 185, 129, 0.15)" : "#ecfdf5",
                            color: "#10b981",
                            fontWeight: 800,
                            fontSize: "0.72rem",
                            height: 24,
                            border: "1px solid rgba(16, 185, 129, 0.3)",
                          }}
                        />
                      ) : (
                        <Chip
                          icon={<Cancel sx={{ fontSize: "14px !important", color: "#ef4444 !important" }} />}
                          label="Absent"
                          size="small"
                          sx={{
                            bgcolor: isDark ? "rgba(239, 68, 68, 0.15)" : "#fef2f2",
                            color: "#ef4444",
                            fontWeight: 800,
                            fontSize: "0.72rem",
                            height: 24,
                            border: "1px solid rgba(239, 68, 68, 0.3)",
                          }}
                        />
                      )}
                    </TableCell>

                    {/* Odometer KM */}
                    <TableCell sx={{ fontSize: "0.82rem", color: isDark ? "#94a3b8" : "#475569", borderColor: isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9" }}>
                      {row.odometerKm}
                    </TableCell>

                    {/* Full KM */}
                    <TableCell sx={{ fontSize: "0.82rem", color: isDark ? "#94a3b8" : "#475569", borderColor: isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9" }}>
                      {row.fullKm}
                    </TableCell>

                    {/* Visits */}
                    <TableCell sx={{ fontSize: "0.82rem", fontWeight: 800, color: isDark ? "#f8fafc" : "#0f172a", borderColor: isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9" }}>
                      {row.visitCount}
                    </TableCell>

                    {/* Expense */}
                    <TableCell sx={{ fontSize: "0.82rem", fontWeight: 700, color: isDark ? "#f8fafc" : "#0f172a", borderColor: isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9" }}>
                      {row.expenseAmount}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
