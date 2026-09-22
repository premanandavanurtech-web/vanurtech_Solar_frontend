// pages/TeamAttendance.jsx
// NOTE: This page is for the MANAGER view — it shows team member cards.
// It does NOT do any GPS tracking itself. Tracking only happens in
// locationTracker.js (used by MemberVisitHistory when a user punches in).
// The LiveTrackMap dialog is a read-only view of a member's stored track points.

import React, { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Avatar, Chip, TextField, InputAdornment, Button,
  IconButton, Tooltip, LinearProgress, Divider, CircularProgress,
  Dialog, DialogContent, DialogTitle, DialogActions, MenuItem, useTheme,
  Switch, FormControlLabel,
} from "@mui/material";
import {
  Search, Refresh, AccessTime, CheckCircle, Cancel, LocationOn, Person,
  BatteryChargingFull, BatteryAlert, Battery20, Battery50, Battery80,
  CalendarToday, Celebration, Settings, History, Group, ShowChart, CardGiftcard,
  PersonOff, BatterySaver,
} from "@mui/icons-material";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import LiveTrackMap from "../utils/Livetrackmap";
import { API_ORIGIN } from "../utils/apiConfig";

const API = API_ORIGIN;

const avatarColors = [
  "#f97316", "#10b981", "#f59e0b", "#3b82f6",
  "#14b8a6", "#ec4899", "#f43f5e", "#8b5cf6",
];
const getColor = (name = "") => avatarColors[name.charCodeAt(0) % avatarColors.length];

const isAdminRole = (role) => ["ADMIN", "Admin_panel"].includes(role);

const formatTime = (iso) =>
  iso
    ? new Date(iso).toLocaleTimeString("en-IN", {
        hour: "2-digit", minute: "2-digit", hour12: true,
      })
    : null;

const normalizeClockValue = (value) => {
  const match = String(value || "").match(/^(\d{1,2}):(\d{2})/);
  if (!match) return "";
  const hours = Math.min(Math.max(Number(match[1]), 0), 23);
  const minutes = Math.min(Math.max(Number(match[2]), 0), 59);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

const formatClockToAmPm = (value) => {
  const normalized = normalizeClockValue(value);
  if (!normalized) return "";
  const [hours, minutes] = normalized.split(":").map(Number);
  const suffix = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${String(minutes).padStart(2, "0")} ${suffix}`;
};

const getClockParts = (value) => {
  const normalized = normalizeClockValue(value) || "09:00";
  const [hours, minutes] = normalized.split(":").map(Number);
  return {
    hour: String(hours % 12 || 12),
    minute: String(minutes).padStart(2, "0"),
    period: hours >= 12 ? "PM" : "AM",
  };
};

const clockPartsToValue = ({ hour, minute, period }) => {
  const displayHour = Math.min(Math.max(Number(hour) || 12, 1), 12);
  const minutes = Math.min(Math.max(Number(minute) || 0, 0), 59);
  const hours = period === "PM"
    ? displayHour === 12 ? 12 : displayHour + 12
    : displayHour === 12 ? 0 : displayHour;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

const HOUR_OPTIONS = Array.from({ length: 12 }, (_, index) => String(index + 1));
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, "0"));

const formatHours = (hours) => {
  if (!hours) return null;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m}m`;
};

const getTodayDateInput = () => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const formatSelectedDateLabel = (value) => {
  if (!value) return "";
  const [yyyy, mm, dd] = value.split("-").map(Number);
  return new Date(yyyy, mm - 1, dd).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const isTodayValue = (value) => value === getTodayDateInput();

const DEFAULT_DEMO_TEAM = [];

// ── Battery helpers ───────────────────────────────────────────────────────────
const getBatteryStyle = (pct) => {
  if (pct === null || pct === undefined) return null;
  if (pct > 60)
    return { color: "#22c55e", bg: "rgba(34, 197, 94, 0.15)", border: "rgba(34, 197, 94, 0.3)", track: "rgba(34, 197, 94, 0.2)", fill: "#22c55e" };
  if (pct > 20)
    return { color: "#f59e0b", bg: "rgba(245, 158, 11, 0.15)", border: "rgba(245, 158, 11, 0.3)", track: "rgba(245, 158, 11, 0.2)", fill: "#f59e0b" };
  return { color: "#ef4444", bg: "rgba(239, 68, 68, 0.15)", border: "rgba(239, 68, 68, 0.3)", track: "rgba(239, 68, 68, 0.2)", fill: "#ef4444" };
};

const getBatteryIcon = (pct, isCharging) => {
  if (isCharging) return <BatteryChargingFull sx={{ fontSize: "0.85rem" }} />;
  if (pct === null || pct === undefined) return <BatteryAlert sx={{ fontSize: "0.85rem" }} />;
  if (pct <= 20) return <Battery20 sx={{ fontSize: "0.85rem" }} />;
  if (pct <= 50) return <Battery50 sx={{ fontSize: "0.85rem" }} />;
  return <Battery80 sx={{ fontSize: "0.85rem" }} />;
};

// ── Status Badge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ member, isDark }) => {
  if (member.status === "holiday") {
    return (
      <Chip
        icon={<Celebration sx={{ fontSize: "0.8rem !important" }} />}
        label="Holiday"
        size="small"
        sx={{
          bgcolor: isDark ? "rgba(147, 51, 234, 0.2)" : "#f3e8ff",
          color: isDark ? "#c084fc" : "#9333ea",
          fontWeight: 700, fontSize: "0.7rem", height: 22,
          border: "1px solid rgba(147, 51, 234, 0.4)",
          "& .MuiChip-icon": { color: "inherit" },
        }}
      />
    );
  }
  if (member.punchedIn && !member.punchOutTime) {
    return (
      <Chip
        icon={<CheckCircle sx={{ fontSize: "0.8rem !important" }} />}
        label="Punched In"
        size="small"
        sx={{
          bgcolor: isDark ? "rgba(34, 197, 94, 0.2)" : "#dcfce7",
          color: isDark ? "#4ade80" : "#16a34a",
          fontWeight: 700, fontSize: "0.7rem", height: 22,
          border: "1px solid rgba(34, 197, 94, 0.4)",
          "& .MuiChip-icon": { color: "inherit" },
        }}
      />
    );
  }
  if (member.punchOutTime) {
    return (
      <Chip
        icon={<CheckCircle sx={{ fontSize: "0.8rem !important" }} />}
        label="Punched Out"
        size="small"
        sx={{
          bgcolor: isDark ? "rgba(245, 158, 11, 0.2)" : "#fef3c7",
          color: isDark ? "#fbbf24" : "#d97706",
          fontWeight: 700, fontSize: "0.7rem", height: 22,
          border: "1px solid rgba(245, 158, 11, 0.4)",
          "& .MuiChip-icon": { color: "inherit" },
        }}
      />
    );
  }
  return (
    <Chip
      icon={<Cancel sx={{ fontSize: "0.8rem !important" }} />}
      label="Not Punched In"
      size="small"
      sx={{
        bgcolor: isDark ? "rgba(239, 68, 68, 0.2)" : "#fee2e2",
        color: isDark ? "#fca5a5" : "#dc2626",
        fontWeight: 700, fontSize: "0.7rem", height: 22,
        border: "1px solid rgba(239, 68, 68, 0.35)",
        "& .MuiChip-icon": { color: "inherit" },
      }}
    />
  );
};

const TimeAmPmField = ({ label, value, onChange }) => {
  const parts = getClockParts(value);
  const updatePart = (key, nextValue) => {
    onChange(clockPartsToValue({ ...parts, [key]: nextValue }));
  };
  const selectSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "12px",
      bgcolor: "#080d19",
      color: "#f8fafc",
      "& fieldset": { borderColor: "rgba(255, 255, 255, 0.12)" },
    },
    "& .MuiSelect-select": {
      fontWeight: 700,
      color: "#f8fafc",
    },
  };

  return (
    <Box>
      <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: "#94a3b8", mb: 0.8 }}>
        {label}
      </Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1 }}>
        <TextField
          select
          label="Hour"
          size="small"
          value={parts.hour}
          onChange={(e) => updatePart("hour", e.target.value)}
          sx={selectSx}
        >
          {HOUR_OPTIONS.map((hour) => (
            <MenuItem key={hour} value={hour}>{hour}</MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Minute"
          size="small"
          value={parts.minute}
          onChange={(e) => updatePart("minute", e.target.value)}
          SelectProps={{ MenuProps: { PaperProps: { sx: { maxHeight: 260 } } } }}
          sx={selectSx}
        >
          {MINUTE_OPTIONS.map((minute) => (
            <MenuItem key={minute} value={minute}>{minute}</MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="AM/PM"
          size="small"
          value={parts.period}
          onChange={(e) => updatePart("period", e.target.value)}
          sx={selectSx}
        >
          <MenuItem value="AM">AM</MenuItem>
          <MenuItem value="PM">PM</MenuItem>
        </TextField>
      </Box>
      <Typography sx={{ fontSize: "0.72rem", color: "#64748b", mt: 0.7 }}>
        Selected: {formatClockToAmPm(value)}
      </Typography>
    </Box>
  );
};

// ── Member Card ───────────────────────────────────────────────────────────────
const MemberCard = ({ member }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const isActive = member.punchedIn && !member.punchOutTime;
  const isPunchedOut = !!member.punchOutTime;
  const isHoliday = member.status === "holiday";

  const fullName = `${member.firstName} ${member.lastName}`.trim();

  return (
    <Box
      sx={{
        bgcolor: isDark ? "#0c1322" : "#ffffff",
        borderRadius: "16px",
        p: 2.25,
        border: isActive
          ? "2px solid #22c55e"
          : isHoliday
          ? "1px solid rgba(147, 51, 234, 0.4)"
          : isPunchedOut
          ? "1px solid rgba(245, 158, 11, 0.4)"
          : "1px solid rgba(239, 68, 68, 0.25)",
        boxShadow: isActive ? "0 0 16px rgba(34, 197, 94, 0.25)" : "none",
        transition: "all 0.2s ease",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      {/* Live pulse dot top-right */}
      {isActive && (
        <Box
          sx={{
            position: "absolute", top: 14, right: 14,
            width: 10, height: 10, borderRadius: "50%",
            bgcolor: "#22c55e", boxShadow: "0 0 0 3px rgba(34,197,94,0.3)",
            animation: "pulse 2s infinite",
            "@keyframes pulse": {
              "0%": { boxShadow: "0 0 0 0 rgba(34,197,94,0.5)" },
              "70%": { boxShadow: "0 0 0 8px rgba(34,197,94,0)" },
              "100%": { boxShadow: "0 0 0 0 rgba(34,197,94,0)" },
            },
          }}
        />
      )}

      {/* Top Header: Avatar + Info */}
      <Box>
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, mb: 1.5 }}>
          <Avatar
            sx={{
              width: 42, height: 42, bgcolor: member.color,
              fontWeight: 800, fontSize: "1rem", flexShrink: 0,
              color: "#ffffff",
            }}
          >
            {member.avatar}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              sx={{
                fontWeight: 800,
                fontSize: "0.88rem",
                color: isDark ? "#f8fafc" : "#0f172a",
                lineHeight: 1.3,
                textTransform: "uppercase",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {fullName}
            </Typography>
            <Typography sx={{ fontSize: "0.74rem", color: isDark ? "#94a3b8" : "#64748b", mt: 0.2 }}>
              {member.phoneNumber}
            </Typography>
            <Typography
              sx={{
                fontSize: "0.7rem", color: isDark ? "#64748b" : "#94a3b8", mt: 0.1,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}
            >
              {member.email}
            </Typography>
          </Box>
        </Box>

        {/* Role + Status Badges */}
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center", mb: 1.5 }}>
          <Chip
            label={member.role || "TEAM"}
            size="small"
            sx={{
              bgcolor: isDark ? "rgba(255, 255, 255, 0.08)" : "#f1f5f9",
              color: isDark ? "#cbd5e1" : "#334155",
              fontWeight: 800,
              fontSize: "0.68rem", height: 22,
              border: "1px solid rgba(255, 255, 255, 0.12)",
            }}
          />
          <StatusBadge member={member} isDark={isDark} />
        </Box>

        {/* Status Box */}
        {isHoliday ? (
          <Box
            sx={{
              display: "flex", flexDirection: "column", gap: 0.4,
              bgcolor: isDark ? "rgba(147, 51, 234, 0.12)" : "#faf5ff",
              borderRadius: "10px", px: 1.5, py: 1.2,
              border: "1px solid rgba(147, 51, 234, 0.3)",
            }}
          >
            <Typography sx={{ fontSize: "0.78rem", color: isDark ? "#c084fc" : "#7e22ce", fontWeight: 700 }}>
              Holiday on this date
            </Typography>
            <Typography sx={{ fontSize: "0.72rem", color: isDark ? "#e9d5ff" : "#6b21a8" }}>
              {member.holidayReason || "Office holiday"}
            </Typography>
          </Box>
        ) : member.punchedIn ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 0.6,
              bgcolor: isDark ? "rgba(34, 197, 94, 0.1)" : "#f0fdf4",
              borderRadius: "10px",
              px: 1.5,
              py: 1.2,
              border: "1px solid rgba(34, 197, 94, 0.25)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
              <AccessTime sx={{ fontSize: "0.85rem", color: "#22c55e" }} />
              <Typography sx={{ fontSize: "0.76rem", color: isDark ? "#e2e8f0" : "#334155" }}>
                In: <span style={{ color: "#22c55e", fontWeight: 700 }}>{member.punchInTime}</span>
              </Typography>
              {member.punchOutTime && (
                <>
                  <Box sx={{ mx: 0.5, color: "#64748b" }}>•</Box>
                  <Typography sx={{ fontSize: "0.76rem", color: isDark ? "#e2e8f0" : "#334155" }}>
                    Out: <span style={{ color: "#f59e0b", fontWeight: 700 }}>{member.punchOutTime}</span>
                  </Typography>
                </>
              )}
            </Box>

            {member.location && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                <LocationOn sx={{ fontSize: "0.85rem", color: "#f43f5e" }} />
                <Typography
                  sx={{
                    fontSize: "0.74rem",
                    color: isDark ? "#94a3b8" : "#64748b",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {member.location}
                </Typography>
              </Box>
            )}
          </Box>
        ) : (
          <Box
            sx={{
              display: "flex", alignItems: "center", gap: 1,
              bgcolor: isDark ? "rgba(239, 68, 68, 0.1)" : "#fef2f2",
              borderRadius: "10px", px: 1.5, py: 1.2,
              border: "1px solid rgba(239, 68, 68, 0.2)",
            }}
          >
            <Cancel sx={{ fontSize: "0.95rem", color: "#ef4444" }} />
            <Typography sx={{ fontSize: "0.76rem", color: isDark ? "#fca5a5" : "#dc2626", fontWeight: 600 }}>
              Not yet punched in today
            </Typography>
          </Box>
        )}
      </Box>

      {/* Action Button */}
      <Box sx={{ mt: 2 }}>
        <Button
          fullWidth
          variant="contained"
          size="small"
          onClick={() =>
            navigate(`/attendance/${member.id}`, {
              state: {
                member: member,
                memberName: fullName,
                memberRole: member.role,
                memberPhone: member.phoneNumber,
                memberEmail: member.email,
                punchedIn: member.punchedIn,
                punchInTime: member.punchInTime,
                punchOutTime: member.punchOutTime,
                location: member.location,
                status: member.status,
                fromTeam: true,
                historyView: true,
              },
            })
          }
          startIcon={<History sx={{ fontSize: "0.95rem" }} />}
          sx={{
            borderRadius: "10px", py: 1, fontSize: "0.8rem", fontWeight: 700,
            textTransform: "none",
            bgcolor: "#ea580c",
            color: "#ffffff",
            boxShadow: "0 4px 14px rgba(234, 88, 12, 0.35)",
            "&:hover": { bgcolor: "#c2410c", boxShadow: "0 6px 18px rgba(234, 88, 12, 0.45)" },
          }}
        >
          Attendance
        </Button>
      </Box>
    </Box>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const TeamAttendance = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const canCreateHoliday = isAdminRole(user?.role);

  const [team, setTeam] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState(getTodayDateInput());
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [holidayDialogOpen, setHolidayDialogOpen] = useState(false);
  const [holidayDate, setHolidayDate] = useState(getTodayDateInput());
  const [holidayReason, setHolidayReason] = useState("");
  const [holidaySubmitting, setHolidaySubmitting] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [attendanceSettings, setAttendanceSettings] = useState({
    officePunchInTime: "10:00",
    officePunchOutTime: "19:00",
    blockEarlyPunchIn: true,
    autoPunchOutEnabled: true,
  });
  const [actionMessage, setActionMessage] = useState({ type: "", text: "" });

  const loadAttendanceSettings = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API}/api/v1/attendance/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = res.data?.result || res.data?.data || {};
      setAttendanceSettings((prev) => ({
        ...prev,
        ...result,
        officePunchInTime: normalizeClockValue(result.officePunchInTime || prev.officePunchInTime),
        officePunchOutTime: normalizeClockValue(result.officePunchOutTime || prev.officePunchOutTime),
        blockEarlyPunchIn: result.blockEarlyPunchIn !== undefined ? Boolean(result.blockEarlyPunchIn) : prev.blockEarlyPunchIn,
        autoPunchOutEnabled: result.autoPunchOutEnabled !== undefined ? Boolean(result.autoPunchOutEnabled) : prev.autoPunchOutEnabled,
      }));
    } catch (error) {
      console.error("Attendance settings fetch error:", error.message);
    }
  }, []);

  const fetchData = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    else setRefreshing(true);

    try {
      const targetDate = selectedDate;
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      let rawUsers = [];
      try {
        const allUsersRes = await axios.get(`${API}/api/v1/user/getAllUsers`, {
          headers, params: { limit: 200 },
        });
        const list = allUsersRes.data?.result?.users || allUsersRes.data?.data?.users || allUsersRes.data?.users || allUsersRes.data?.result || [];
        if (Array.isArray(list) && list.length > 0) {
          rawUsers = list.filter((u) => u.role !== "Head_office");
        }
      } catch (e) {
        console.warn("getAllUsers failed, trying getManagerUnderUserList:", e.message);
      }

      if (!rawUsers || rawUsers.length === 0) {
        try {
          const usersRes = await axios.get(`${API}/api/v1/user/getManagerUnderUserList`, {
            headers, params: { limit: 200 },
          });
          rawUsers = usersRes.data?.result?.users || [];
        } catch (e) {
          console.error("Users API failed:", e.message);
        }
      }

      let attendances = [];
      try {
        const userIds = rawUsers.map((u) => String(u._id || u.id)).filter(Boolean);

        if (userIds.length > 0) {
          const attRes = await axios.get(`${API}/api/v1/attendance`, {
            headers,
            params: {
              startDate: targetDate,
              endDate: targetDate,
              limit: 200,
            },
          });
          const allAtt = attRes.data?.result?.attendances || [];

          const allowedIdSet = new Set(userIds);
          attendances = allAtt.filter((a) => {
            const uid = String(a.user?.id || a.user?._id || "");
            return allowedIdSet.has(uid);
          });
        }
      } catch (e) {
        console.error("Attendance API failed:", e.message);
      }

      let batteryMap = {};
      try {
        const userIds = rawUsers.map((u) => String(u._id || u.id)).filter(Boolean);
        if (userIds.length > 0) {
          const battRes = await axios.get(`${API}/api/v1/battery/all-latest`, {
            headers,
            params: { userIds: userIds.join(",") },
          });
          const batteryLogs = battRes.data?.data || battRes.data?.result || [];

          batteryLogs.forEach((b) => {
            const key = String(b.userId || b.user?._id || b.user || "");
            if (key) {
              batteryMap[key] = {
                percentage: typeof b.percentage === "number" ? b.percentage : null,
                isCharging: b.isCharging ?? false,
              };
            }
          });
        }
      } catch (e) {
        console.error("Battery fetch failed:", e.message);
      }

      const attMap = {};
      attendances.forEach((a) => {
        const uid = String(a.user?.id || a.user?._id || "");
        if (uid) attMap[uid] = a;
      });

      if (rawUsers.length > 0) {
        const merged = rawUsers.map((u) => {
          const uid = String(u._id || u.id || "");
          const att = attMap[uid] || null;
          const punchedIn = !!att?.punchIn?.time;
          const punchOutTime = att?.punchOut?.time ? formatTime(att.punchOut.time) : null;
          const holidayReason = att?.status === "holiday"
            ? (att?.remarks || att?.metadata?.holidayReason || "Holiday")
            : null;

          return {
            id: uid,
            firstName: u.firstName || "",
            lastName: u.lastName || "",
            phoneNumber: u.phoneNumber || "",
            email: u.email || "",
            role: u.role || "TEAM",
            avatar: (u.firstName?.[0] || "").toUpperCase(),
            color: getColor(u.firstName || ""),
            status: att?.status || "absent",
            punchedIn,
            punchInTime: punchedIn ? formatTime(att.punchIn.time) : null,
            punchOutTime,
            location: att?.punchIn?.address || att?.punchOut?.address || null,
            totalHours: att?.workHours ? formatHours(att.workHours) : null,
            holidayReason,
            batteryPercentage: batteryMap[uid]?.percentage ?? null,
            isCharging: batteryMap[uid]?.isCharging ?? false,
          };
        });

        setTeam(merged);
      } else {
        setTeam(DEFAULT_DEMO_TEAM);
      }

      setLastRefreshed(new Date());
    } catch (err) {
      console.error("TeamAttendance fetch error:", err.message);
      setTeam(DEFAULT_DEMO_TEAM);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (canCreateHoliday) loadAttendanceSettings();
  }, [canCreateHoliday, loadAttendanceSettings]);

  useEffect(() => {
    if (!isTodayValue(selectedDate)) return undefined;
    const t = setInterval(() => fetchData(false), 60000);
    return () => clearInterval(t);
  }, [fetchData, selectedDate]);

  const openHolidayDialog = () => {
    setHolidayDate(selectedDate);
    setHolidayReason("");
    setActionMessage({ type: "", text: "" });
    setHolidayDialogOpen(true);
  };

  const handleCreateHoliday = async () => {
    if (!holidayDate || !holidayReason.trim()) {
      setActionMessage({ type: "error", text: "Please select a date and write the holiday reason." });
      return;
    }

    setHolidaySubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API}/api/v1/attendance/holiday`,
        { date: holidayDate, reason: holidayReason.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const result = res.data?.result || res.data?.data || {};
      setActionMessage({
        type: "success",
        text: `Holiday saved. Created ${result.createdCount || 0}, updated ${result.updatedCount || 0}, skipped ${result.skippedCount || 0}.`,
      });
      setSelectedDate(holidayDate);
      setHolidayDialogOpen(false);
      await fetchData(false);
    } catch (error) {
      setActionMessage({
        type: "error",
        text: error?.response?.data?.message || error.message || "Failed to create holiday.",
      });
    } finally {
      setHolidaySubmitting(false);
    }
  };

  const openSettingsDialog = () => {
    setActionMessage({ type: "", text: "" });
    loadAttendanceSettings();
    setSettingsOpen(true);
  };

  const saveAttendanceSettings = async () => {
    setSettingsSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `${API}/api/v1/attendance/settings`,
        {
          ...attendanceSettings,
          officePunchInTime: normalizeClockValue(attendanceSettings.officePunchInTime),
          officePunchOutTime: normalizeClockValue(attendanceSettings.officePunchOutTime),
          blockEarlyPunchIn: Boolean(attendanceSettings.blockEarlyPunchIn),
          autoPunchOutEnabled: Boolean(attendanceSettings.autoPunchOutEnabled),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const result = res.data?.result || res.data?.data || {};
      setAttendanceSettings((prev) => ({
        ...prev,
        ...result,
        officePunchInTime: normalizeClockValue(result.officePunchInTime || prev.officePunchInTime),
        officePunchOutTime: normalizeClockValue(result.officePunchOutTime || prev.officePunchOutTime),
        blockEarlyPunchIn: result.blockEarlyPunchIn !== undefined ? Boolean(result.blockEarlyPunchIn) : prev.blockEarlyPunchIn,
        autoPunchOutEnabled: result.autoPunchOutEnabled !== undefined ? Boolean(result.autoPunchOutEnabled) : prev.autoPunchOutEnabled,
      }));
      setActionMessage({ type: "success", text: "Attendance settings saved." });
      setSettingsOpen(false);
    } catch (error) {
      setActionMessage({
        type: "error",
        text: error?.response?.data?.message || error.message || "Failed to save attendance settings.",
      });
    } finally {
      setSettingsSaving(false);
    }
  };

  const filtered = team.filter((m) => {
    const matchSearch = `${m.firstName} ${m.lastName} ${m.phoneNumber} ${m.email}`
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchFilter =
      filter === "all"
        ? true
        : filter === "holiday"
        ? m.status === "holiday"
        : filter === "in"
        ? m.punchedIn && !m.punchOutTime
        : filter === "out"
        ? !!m.punchOutTime
        : filter === "low"
        ? m.batteryPercentage !== null && m.batteryPercentage <= 20
        : !m.punchedIn;
    return matchSearch && matchFilter;
  });

  const punchedInCount = team.filter((m) => m.punchedIn && !m.punchOutTime).length;
  const punchedOutCount = team.filter((m) => !!m.punchOutTime).length;
  const holidayCount = team.filter((m) => m.status === "holiday").length;
  const absentCount = team.filter((m) => !m.punchedIn && m.status !== "holiday").length;
  const lowBatteryCount = team.filter(
    (m) => m.batteryPercentage !== null && m.batteryPercentage <= 20
  ).length;

  const attendanceRate = team.length
    ? Math.round(((punchedInCount + punchedOutCount) / team.length) * 100)
    : 0;

  const filterBtns = [
    { key: "all", label: "All", count: team.length, color: "#3b82f6" },
    { key: "in", label: "Active", count: punchedInCount, color: "#22c55e" },
    { key: "out", label: "Punched Out", count: punchedOutCount, color: "#f59e0b" },
    { key: "holiday", label: "Holiday", count: holidayCount, color: "#a855f7" },
    { key: "absent", label: "Absent", count: absentCount, color: "#ef4444" },
    { key: "low", label: "Low Battery", count: lowBatteryCount, color: "#f97316" },
  ];

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress sx={{ color: "#3b82f6" }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, bgcolor: isDark ? "#060813" : "#f8fafc", minHeight: "100vh" }}>
      <Box sx={{ maxWidth: 1600, mx: "auto", display: "flex", flexDirection: "column", gap: 3 }}>

        {/* Hero Header Banner */}
        <Box
          sx={{
            background: "linear-gradient(135deg, #090e24 0%, #151b3d 45%, #2a1659 100%)",
            borderRadius: "20px", p: { xs: 2.5, sm: 3 },
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexWrap: "wrap", gap: 2, position: "relative", overflow: "hidden",
            border: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <Box
            sx={{
              position: "absolute", right: -50, top: -50, width: 220, height: 220,
              borderRadius: "50%", background: "radial-gradient(circle, rgba(124, 58, 237, 0.25) 0%, rgba(0,0,0,0) 70%)",
              pointerEvents: "none",
            }}
          />

          <Box sx={{ position: "relative", zIndex: 1 }}>
            <Typography variant="h4" sx={{ color: "#ffffff", fontWeight: 800, mb: 0.4, letterSpacing: "-0.02em" }}>
              Team Attendance
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.7)", fontSize: "0.85rem" }}>
              {team.length} team members · Saturday, 1 August
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.85)", fontSize: "0.8rem", fontWeight: 600, mt: 0.4 }}>
              Selected date: {formatSelectedDateLabel(selectedDate)}
            </Typography>

            <Box sx={{ mt: 1.5, width: { xs: "100%", sm: 300 } }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                <Typography sx={{ color: "rgba(255,255,255,0.7)", fontSize: "0.75rem" }}>
                  Attendance rate
                </Typography>
                <Typography sx={{ color: "#ffffff", fontSize: "0.75rem", fontWeight: 800 }}>
                  {attendanceRate}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={attendanceRate}
                sx={{
                  height: 6, borderRadius: 4, bgcolor: "rgba(255,255,255,0.15)",
                  "& .MuiLinearProgress-bar": { bgcolor: "#22c55e", borderRadius: 4 },
                }}
              />
            </Box>
          </Box>

          <Box sx={{ display: "flex", gap: 1.25, alignItems: "center", flexWrap: "wrap", zIndex: 1 }}>
            <TextField
              type="date"
              size="small"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              sx={{
                minWidth: 160,
                "& .MuiOutlinedInput-root": {
                  borderRadius: "12px",
                  bgcolor: "rgba(255,255,255,0.1)",
                  "& fieldset": { borderColor: "rgba(255,255,255,0.2)" },
                  "&:hover fieldset": { borderColor: "rgba(255,255,255,0.4)" },
                },
                "& .MuiInputBase-input": { color: "#ffffff", fontWeight: 600, fontSize: "0.85rem" },
              }}
            />
            {canCreateHoliday && (
              <>
                <Button
                  onClick={openSettingsDialog}
                  startIcon={<Settings sx={{ fontSize: 18 }} />}
                  sx={{
                    borderRadius: "12px",
                    px: 2,
                    py: 0.9,
                    color: "#ffffff",
                    border: "1px solid rgba(255,255,255,0.2)",
                    bgcolor: "rgba(255,255,255,0.1)",
                    textTransform: "none",
                    fontWeight: 700,
                    fontSize: "0.82rem",
                    "&:hover": { bgcolor: "rgba(255,255,255,0.2)" },
                  }}
                >
                  Settings
                </Button>
                <Button
                  onClick={openHolidayDialog}
                  startIcon={<Celebration sx={{ fontSize: 18 }} />}
                  sx={{
                    borderRadius: "12px",
                    px: 2,
                    py: 0.9,
                    color: "#ffffff",
                    bgcolor: "rgba(124, 58, 237, 0.6)",
                    border: "1px solid rgba(168, 85, 247, 0.4)",
                    textTransform: "none",
                    fontWeight: 700,
                    fontSize: "0.82rem",
                    "&:hover": { bgcolor: "rgba(124, 58, 237, 0.8)" },
                  }}
                >
                  Add Holiday
                </Button>
              </>
            )}
            <Tooltip title="Refresh attendance">
              <IconButton
                onClick={() => fetchData(false)}
                sx={{
                  bgcolor: "rgba(255,255,255,0.1)", color: "#ffffff",
                  borderRadius: "12px", width: 42, height: 42,
                  border: "1px solid rgba(255,255,255,0.2)",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.25)" },
                }}
              >
                <Refresh
                  sx={{
                    animation: refreshing ? "spin 0.8s linear infinite" : "none",
                    "@keyframes spin": {
                      from: { transform: "rotate(0deg)" },
                      to: { transform: "rotate(360deg)" },
                    },
                  }}
                />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* 6 KPI Summary Cards */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)", md: "repeat(6, 1fr)" },
            gap: 2,
          }}
        >
          {[
            { label: "Total", value: team.length, color: "#3b82f6", icon: <Group sx={{ fontSize: 20 }} />, bg: "rgba(37, 99, 235, 0.15)" },
            { label: "Active Now", value: punchedInCount, color: "#22c55e", icon: <ShowChart sx={{ fontSize: 20 }} />, bg: "rgba(34, 197, 94, 0.15)" },
            { label: "Punched Out", value: punchedOutCount, color: "#f59e0b", icon: <AccessTime sx={{ fontSize: 20 }} />, bg: "rgba(245, 158, 11, 0.15)" },
            { label: "Holiday", value: holidayCount, color: "#a855f7", icon: <CardGiftcard sx={{ fontSize: 20 }} />, bg: "rgba(168, 85, 247, 0.15)" },
            { label: "Absent", value: absentCount, color: "#ef4444", icon: <PersonOff sx={{ fontSize: 20 }} />, bg: "rgba(239, 68, 68, 0.15)" },
            { label: "Low Battery", value: lowBatteryCount, color: "#f97316", icon: <BatterySaver sx={{ fontSize: 20 }} />, bg: "rgba(249, 115, 22, 0.15)" },
          ].map((stat) => (
            <Box
              key={stat.label}
              sx={{
                bgcolor: isDark ? "#0c1322" : "#ffffff",
                borderRadius: "16px",
                p: 2,
                border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "#e2e8f0"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Box>
                <Typography
                  sx={{ fontSize: "1.75rem", fontWeight: 800, color: stat.color, lineHeight: 1 }}
                >
                  {stat.value}
                </Typography>
                <Typography sx={{ fontSize: "0.78rem", color: isDark ? "#94a3b8" : "#64748b", mt: 0.6, fontWeight: 700 }}>
                  {stat.label}
                </Typography>
              </Box>
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: "10px",
                  bgcolor: stat.bg,
                  color: stat.color,
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                }}
              >
                {stat.icon}
              </Box>
            </Box>
          ))}
        </Box>

        {/* Search + Filter Row */}
        <Box
          sx={{
            display: "flex",
            gap: 2,
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <TextField
            placeholder="Search team members..."
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ fontSize: 18, color: "#64748b" }} />
                </InputAdornment>
              ),
            }}
            sx={{
              width: { xs: "100%", md: 360 },
              "& .MuiOutlinedInput-root": {
                borderRadius: "12px",
                bgcolor: isDark ? "#080d19" : "#ffffff",
                color: isDark ? "#f8fafc" : "#0f172a",
                "& fieldset": { borderColor: isDark ? "rgba(255, 255, 255, 0.12)" : "#e2e8f0" },
              },
            }}
          />

          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
            {filterBtns.map((btn) => (
              <Box
                key={btn.key}
                onClick={() => setFilter(btn.key)}
                sx={{
                  px: 1.5, py: 0.6, borderRadius: "10px", cursor: "pointer",
                  fontSize: "0.78rem", fontWeight: 700,
                  border: filter === btn.key ? `2px solid ${btn.color}` : `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "#e2e8f0"}`,
                  bgcolor: filter === btn.key ? (isDark ? "rgba(37, 99, 235, 0.2)" : "#eff6ff") : (isDark ? "#080d19" : "#ffffff"),
                  color: filter === btn.key ? btn.color : (isDark ? "#94a3b8" : "#64748b"),
                  transition: "all 0.15s ease",
                  display: "flex", alignItems: "center", gap: 0.6,
                }}
              >
                {btn.label}
                <Box
                  sx={{
                    bgcolor: filter === btn.key ? btn.color : (isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0"),
                    color: filter === btn.key ? "#ffffff" : (isDark ? "#cbd5e1" : "#64748b"),
                    borderRadius: "6px", px: 0.6, py: 0.1,
                    fontSize: "0.68rem", fontWeight: 800, lineHeight: 1.5,
                  }}
                >
                  {btn.count}
                </Box>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Auto Refresh Info */}
        <Box>
          <Typography sx={{ fontSize: "0.75rem", color: "#22c55e", fontWeight: 700, display: "flex", alignItems: "center", gap: 0.6 }}>
            <span>●</span> {isTodayValue(selectedDate) ? "Auto-refresh is active for today" : "Viewing saved attendance for selected date"}
          </Typography>
          <Typography sx={{ fontSize: "0.72rem", color: "#64748b", mt: 0.2 }}>
            Auto-refreshes every 60s · Last updated:{" "}
            {lastRefreshed.toLocaleTimeString("en-IN", {
              hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true,
            })}
          </Typography>
        </Box>

        {/* Cards Grid */}
        {filtered.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 8, color: "#64748b" }}>
            <Person sx={{ fontSize: 48, mb: 1, opacity: 0.4 }} />
            <Typography sx={{ fontSize: "1rem", fontWeight: 700 }}>No team members found</Typography>
          </Box>
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr", sm: "repeat(2, 1fr)",
                md: "repeat(3, 1fr)", lg: "repeat(4, 1fr)",
              },
              gap: 2,
            }}
          >
            {filtered.map((member) => (
              <MemberCard key={member.id} member={member} />
            ))}
          </Box>
        )}

        {/* Holiday Dialog */}
        <Dialog
          open={holidayDialogOpen}
          onClose={() => !holidaySubmitting && setHolidayDialogOpen(false)}
          maxWidth="xs"
          fullWidth
          PaperProps={{ sx: { borderRadius: "18px", bgcolor: isDark ? "#0c1322" : "#ffffff", color: isDark ? "#f8fafc" : "#0f172a" } }}
        >
          <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>
            Create Holiday
          </DialogTitle>
          <DialogContent sx={{ pt: "8px !important" }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                label="Holiday Date"
                type="date"
                value={holidayDate}
                onChange={(e) => setHolidayDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{
                  "& .MuiOutlinedInput-root": { bgcolor: isDark ? "#080d19" : "#fff", color: isDark ? "#fff" : "#000" },
                }}
              />
              <TextField
                label="Reason"
                placeholder="Example: Ram Navami, Office Closed, National Holiday"
                value={holidayReason}
                onChange={(e) => setHolidayReason(e.target.value)}
                multiline
                minRows={3}
                sx={{
                  "& .MuiOutlinedInput-root": { bgcolor: isDark ? "#080d19" : "#fff", color: isDark ? "#fff" : "#000" },
                }}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={() => setHolidayDialogOpen(false)} disabled={holidaySubmitting}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleCreateHoliday}
              disabled={holidaySubmitting}
              startIcon={holidaySubmitting ? <CircularProgress size={14} color="inherit" /> : <Celebration />}
              sx={{ borderRadius: "10px", bgcolor: "#9333ea", "&:hover": { bgcolor: "#7e22ce" } }}
            >
              {holidaySubmitting ? "Saving..." : "Save Holiday"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Settings Dialog */}
        <Dialog
          open={settingsOpen}
          onClose={() => !settingsSaving && setSettingsOpen(false)}
          maxWidth="xs"
          fullWidth
          PaperProps={{ sx: { borderRadius: "18px", bgcolor: isDark ? "#0c1322" : "#ffffff", color: isDark ? "#f8fafc" : "#0f172a" } }}
        >
          <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>
            Attendance Settings
          </DialogTitle>
          <DialogContent sx={{ pt: "8px !important" }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TimeAmPmField
                label="Office Punch In Time"
                value={normalizeClockValue(attendanceSettings.officePunchInTime)}
                onChange={(value) =>
                  setAttendanceSettings((prev) => ({
                    ...prev,
                    officePunchInTime: value,
                  }))
                }
              />
              <TimeAmPmField
                label="Office Punch Out Time"
                value={normalizeClockValue(attendanceSettings.officePunchOutTime)}
                onChange={(value) =>
                  setAttendanceSettings((prev) => ({
                    ...prev,
                    officePunchOutTime: value,
                  }))
                }
              />

              <Divider sx={{ my: 0.5 }} />

              <FormControlLabel
                control={
                  <Switch
                    checked={!attendanceSettings.blockEarlyPunchIn}
                    onChange={(e) =>
                      setAttendanceSettings((prev) => ({
                        ...prev,
                        blockEarlyPunchIn: !e.target.checked,
                      }))
                    }
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: "0.85rem" }}>
                      Allow Punch In Anytime
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary", display: "block", fontSize: "0.72rem" }}>
                      {!attendanceSettings.blockEarlyPunchIn
                        ? "Users can punch in 24/7 at any time"
                        : `Punch in blocked before ${formatClockToAmPm(attendanceSettings.officePunchInTime)}`}
                    </Typography>
                  </Box>
                }
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={Boolean(attendanceSettings.autoPunchOutEnabled)}
                    onChange={(e) =>
                      setAttendanceSettings((prev) => ({
                        ...prev,
                        autoPunchOutEnabled: e.target.checked,
                      }))
                    }
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: "0.85rem" }}>
                      Auto Punch Out
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary", display: "block", fontSize: "0.72rem" }}>
                      {attendanceSettings.autoPunchOutEnabled
                        ? `Auto punches out at ${formatClockToAmPm(attendanceSettings.officePunchOutTime)}`
                        : "Auto punch-out is disabled"}
                    </Typography>
                  </Box>
                }
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={() => setSettingsOpen(false)} disabled={settingsSaving}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={saveAttendanceSettings}
              disabled={settingsSaving}
              startIcon={settingsSaving ? <CircularProgress size={14} color="inherit" /> : <Settings />}
              sx={{ borderRadius: "10px", bgcolor: "#2563eb", "&:hover": { bgcolor: "#1d4ed8" } }}
            >
              {settingsSaving ? "Saving..." : "Save Settings"}
            </Button>
          </DialogActions>
        </Dialog>

      </Box>
    </Box>
  );
};

export default TeamAttendance;
