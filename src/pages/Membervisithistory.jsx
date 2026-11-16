// pages/MemberVisitHistory.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Box,
  LinearProgress, Typography, Button, Chip, IconButton, Tooltip, alpha,
  useTheme, useMediaQuery, CircularProgress, Alert, Skeleton,
  SwipeableDrawer, Badge, Checkbox, FormControlLabel,
} from "@mui/material";
import {
  LocationOn, Refresh, MyLocation, FilterList,
  CheckCircle, AccessTime, Route, Timer, Close,
  Fullscreen, FullscreenExit,
  Store, PhotoCamera,
  CalendarToday, GpsFixed,
  ArrowDownward, DirectionsCar, Schedule,
  ArrowBack, OpenInNew, ReceiptLong, DeleteOutline,
  Wifi, WifiOff, SignalCellularAlt, SignalCellularOff, Lan, LocationOff,
  ReportProblem, StopCircle, Flag, Navigation, Speed,
} from "@mui/icons-material";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { stopTracking, isCurrentlyTracking } from "../utils/Locationtracker.js";
import LiveTrackingMap from "../utils/Livetrackmap.jsx";
import { useSocket } from "../utils/Usesocket.js";
import { API_BASE_URL, API_ORIGIN, KNOWN_API_HOSTS, LEGACY_API_ORIGINS } from "../utils/apiConfig";

const BASE_URL = API_BASE_URL;
const BACKEND_ORIGIN = API_ORIGIN;
const PHOTO_BACKEND_ORIGINS = [
  BACKEND_ORIGIN,
  ...LEGACY_API_ORIGINS,
].filter((origin, index, list) => origin && list.indexOf(origin) === index);
const KNOWN_BACKEND_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "::1",
  ...KNOWN_API_HOSTS,
]);

const PRIMARY = "#0f1f3d";
const SUCCESS = "#22c55e";
const WARNING = "#f59e0b";
const ERROR = "#ef4444";
const MONGO_OBJECT_ID_RE = /^[a-f\d]{24}$/i;

const toIdString = (value) => {
  if (!value) return "";
  if (typeof value === "object") {
    return toIdString(value._id || value.id || value.userId);
  }
  return String(value).trim();
};

const isValidMongoObjectId = (value) => MONGO_OBJECT_ID_RE.test(toIdString(value));

const readStoredUserId = () => {
  try {
    const stored = JSON.parse(localStorage.getItem("user") || localStorage.getItem("userData") || "null");
    return toIdString(stored);
  } catch {
    return "";
  }
};

const getMemberStateUserId = (state = {}) =>
  toIdString(
    state.memberId ||
    state.userId ||
    state._id ||
    state.id ||
    state.user ||
    state.member
  );

const getBatteryChipStyle = (percentage) => {
  if (percentage === null || percentage === undefined) {
    return { color: "#64748b", bg: "#f8fafc", border: "#e2e8f0", label: "Battery N/A" };
  }
  if (percentage > 60) {
    return { color: "#059669", bg: alpha("#10b981", 0.12), border: alpha("#10b981", 0.22), label: `Battery ${percentage}%` };
  }
  if (percentage > 20) {
    return { color: "#d97706", bg: alpha("#f59e0b", 0.12), border: alpha("#f59e0b", 0.22), label: `Battery ${percentage}%` };
  }
  return { color: "#dc2626", bg: alpha("#ef4444", 0.12), border: alpha("#ef4444", 0.22), label: `Battery ${percentage}%` };
};

const apiFetch = async (path, params = {}, options = {}) => {
  const token = localStorage.getItem("token") || localStorage.getItem("authToken") || localStorage.getItem("accessToken");
  const url = new URL(`${BASE_URL}${path}`);
  if (options.method !== "POST")
    Object.entries(params).forEach(([k, v]) => v != null && v !== "" && url.searchParams.set(k, v));
  const res = await fetch(url.toString(), {
    method: options.method || "GET",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(options.method === "POST" ? { body: JSON.stringify(params) } : {}),
  });
  if (!res.ok) {
    if (res.status === 404 && options.ignoreNotFound) return null;
    const e = await res.json().catch(() => ({}));
    if (res.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("authToken");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    throw new Error(e.message || `HTTP ${res.status}`);
  }
  return res.json();
};

const fmt = (d, fallback = null) => {
  const val = d || fallback;
  if (!val) return null;

  if (typeof val === "string") {
    const trimmed = val.trim();
    if (
      trimmed === "--:--" ||
      trimmed === "Invalid Date" ||
      trimmed === "null" ||
      trimmed === "undefined" ||
      !trimmed
    ) {
      if (fallback && fallback !== d) return fmt(fallback);
      return null;
    }
    // Already formatted time like "05:42 pm" or "10:30 AM" or "5:42 PM"
    if (/^\d{1,2}:\d{2}(\s*[ap]m)?$/i.test(trimmed)) {
      return trimmed.toUpperCase();
    }
    if (/^\d{1,2}:\d{2}:\d{2}(\s*[ap]m)?$/i.test(trimmed)) {
      return trimmed.replace(/:\d{2}(\s*[ap]m)/i, "$1").toUpperCase();
    }
  }

  const num = Number(val);
  const dateObj = !isNaN(num) && num > 10000000000 ? new Date(num) : new Date(val);
  if (!isNaN(dateObj.getTime())) {
    return dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  if (fallback && fallback !== d) {
    return fmt(fallback);
  }

  return null;
};
const formatCurrency = (amount) =>
  `\u20B9${Number(amount || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const formatStatusLabel = (status, hasPunchIn, hasPunchOut) => {
  if (status) {
    return String(status)
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (match) => match.toUpperCase());
  }
  if (hasPunchIn && hasPunchOut) return "Present";
  if (hasPunchIn) return "On Duty";
  return "Absent";
};

const getDateRangeLabel = (dateRange) => {
  if (dateRange === "today") return "Today";
  if (dateRange === "yesterday") return "Yesterday";
  if (dateRange === "week") return "This Week";
  if (dateRange === "month") return "This Month";
  if (dateRange?.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return new Date(`${dateRange}T00:00:00`).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }
  return dateRange || "Today";
};

const normalizePhotoUrl = (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== "string") return null;

  const trimmedUrl = rawUrl.trim().replace(/\\/g, "/");
  if (!trimmedUrl) return null;
  const withoutApiPrefix = trimmedUrl.replace(/^\/?api\/v1(?=\/)/i, "");

  if (withoutApiPrefix.startsWith("data:") || withoutApiPrefix.startsWith("blob:")) {
    return withoutApiPrefix;
  }

  if (withoutApiPrefix.startsWith("/public/")) {
    return `${BACKEND_ORIGIN}${withoutApiPrefix}`;
  }

  if (withoutApiPrefix.startsWith("/uploads/")) {
    return `${BACKEND_ORIGIN}/public${withoutApiPrefix}`;
  }

  if (withoutApiPrefix.startsWith("/")) {
    return `${BACKEND_ORIGIN}${withoutApiPrefix}`;
  }

  if (!/^https?:\/\//i.test(withoutApiPrefix)) {
    const cleanPath = withoutApiPrefix.replace(/^\/+/, "");
    const pathWithoutApi = cleanPath.replace(/^api\/v1\//i, "");
    return `${BACKEND_ORIGIN}/${pathWithoutApi.startsWith("uploads/") ? "public/" : ""}${pathWithoutApi}`;
  }

  try {
    const parsedUrl = new URL(withoutApiPrefix);
    const pathname = parsedUrl.pathname.replace(/^\/api\/v1(?=\/)/i, "");
    if (KNOWN_BACKEND_HOSTS.has(parsedUrl.hostname) && pathname.startsWith("/uploads/")) {
      return `${parsedUrl.origin}/public${pathname}`;
    }
    if (KNOWN_BACKEND_HOSTS.has(parsedUrl.hostname) && pathname.startsWith("/public/")) {
      return `${parsedUrl.origin}${pathname}`;
    }
    parsedUrl.pathname = pathname;
    return parsedUrl.toString();
  } catch {
    return withoutApiPrefix;
  }
};

const extractPhotoValue = (photoLike) => {
  if (!photoLike) return null;
  if (typeof photoLike === "string") return photoLike;
  if (typeof photoLike !== "object") return null;

  return (
    photoLike.url ||
    photoLike.uri ||
    photoLike.photoUrl ||
    photoLike.imageUrl ||
    photoLike.secure_url ||
    photoLike.downloadURL ||
    photoLike.path ||
    photoLike.location ||
    photoLike.filename ||
    photoLike.filePath ||
    photoLike.file_url ||
    photoLike.src ||
    null
  );
};

const getPhotoUrlCandidates = (rawPhoto) => {
  const primaryUrl = normalizePhotoUrl(extractPhotoValue(rawPhoto));
  if (!primaryUrl) return [];

  const candidates = [primaryUrl];
  const pushBackendPaths = (pathname) => {
    const normalizedPath = pathname
      .replace(/\\/g, "/")
      .replace(/^\/+/, "")
      .replace(/^api\/v1\//i, "");
    if (!normalizedPath) return;

    const filename = normalizedPath.split("/").filter(Boolean).pop();
    const pathVariants = [
      `/${normalizedPath}`,
      normalizedPath.startsWith("public/") ? `/${normalizedPath}` : `/public/${normalizedPath}`,
    ];

    if (normalizedPath.startsWith("uploads/")) {
      pathVariants.push(`/public/${normalizedPath}`);
    }

    if (filename) {
      pathVariants.push(
        `/public/${filename}`,
        `/public/uploads/${filename}`,
        `/public/uploads/images/${filename}`,
        `/uploads/${filename}`,
        `/uploads/images/${filename}`,
      );
    }

    PHOTO_BACKEND_ORIGINS.forEach((origin) => {
      pathVariants.forEach((path) => candidates.push(`${origin}${path}`));
    });
  };

  try {
    const parsedUrl = new URL(primaryUrl);
    const normalizedPathname = parsedUrl.pathname.replace(/^\/api\/v1(?=\/)/i, "");
    if (
      KNOWN_BACKEND_HOSTS.has(parsedUrl.hostname) &&
      (normalizedPathname.startsWith("/public/") || normalizedPathname.startsWith("/uploads/"))
    ) {
      const publicPath = normalizedPathname.startsWith("/uploads/")
        ? `/public${normalizedPathname}`
        : normalizedPathname;
      PHOTO_BACKEND_ORIGINS.forEach((origin) => {
        candidates.push(`${origin}${publicPath}`);
      });
    }
    if (KNOWN_BACKEND_HOSTS.has(parsedUrl.hostname)) {
      pushBackendPaths(parsedUrl.pathname.replace(/^\/api\/v1(?=\/)/i, ""));
    }
  } catch {
    pushBackendPaths(primaryUrl);
  }

  return candidates.filter((url, index, list) => url && list.indexOf(url) === index);
};

const getVisitPhotoUrls = (visit) => {
  if (!visit) return [];

  const photoSources = [
    ...(Array.isArray(visit.photos) ? visit.photos : []),
    visit.photo,
    visit.photoUrl,
    visit.image,
    visit.imageUrl,
    visit.visitPhoto,
    visit.thumbnail,
  ].filter(Boolean);

  return photoSources.flatMap((photo) => getPhotoUrlCandidates(photo))
    .filter((url, index, list) => url && list.indexOf(url) === index);
};

const getDateRange = (r) => {
  const now = new Date();

  // ✅ Build local midnight using local date parts (avoids UTC shift)
  const localMidnight = new Date(
    now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0
  );
  const localEndOfDay = new Date(
    now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999
  );

  if (r === "today") return {
    startDate: localMidnight.toISOString(),
    endDate: localEndOfDay.toISOString(),   // ✅ end at 23:59 not "now"
  };

  if (r === "yesterday") {
    const yStart = new Date(localMidnight); yStart.setDate(yStart.getDate() - 1);
    const yEnd = new Date(yStart); yEnd.setHours(23, 59, 59, 999);
    return { startDate: yStart.toISOString(), endDate: yEnd.toISOString() };
  }

  if (r === "week") {
    const w = new Date(localMidnight);
    w.setDate(localMidnight.getDate() - localMidnight.getDay());
    return { startDate: w.toISOString(), endDate: localEndOfDay.toISOString() };
  }

  if (r === "month") {
    const m = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    return { startDate: m.toISOString(), endDate: localEndOfDay.toISOString() };
  }

  if (r && r.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [yyyy, mm, dd] = r.split("-").map(Number);
    const start = new Date(yyyy, mm - 1, dd, 0, 0, 0, 0);
    const end = new Date(yyyy, mm - 1, dd, 23, 59, 59, 999);
    return { startDate: start.toISOString(), endDate: end.toISOString() };
  }

  return {};
};

const getSelectedDayKey = (dateRange) => {
  if (dateRange && /^\d{4}-\d{2}-\d{2}$/.test(dateRange)) return dateRange;

  const date = new Date();
  if (dateRange === "yesterday") {
    date.setDate(date.getDate() - 1);
  }

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const isSingleDayFilter = (dateRange) =>
  dateRange === "today" ||
  dateRange === "yesterday" ||
  /^\d{4}-\d{2}-\d{2}$/.test(dateRange || "");

const getRecentDays = () => {
  const days = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    // ✅ Use local date parts instead of toISOString() which gives UTC date
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const value = i === 0 ? "today" : `${yyyy}-${mm}-${dd}`; // "today" for today, "2025-04-08" for others
    const label = i === 0 ? "Today"
      : i === 1 ? "Yesterday"
        : d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    days.push({ value, label });
  }
  return days;
};

const isSystemStartLocationVisit = (visit) =>
  (visit?.locationName || "").trim().toLowerCase() === "start location";

const isVisitInDateRange = (visit, dateRange) => {
  const range = getDateRange(dateRange);
  if (!range.startDate || !range.endDate) return true;

  const rawDate = visit?.visitDate || visit?.checkInTime || visit?.createdAt;
  if (!rawDate) return true;

  const visitTime = new Date(rawDate).getTime();
  const startTime = new Date(range.startDate).getTime();
  const endTime = new Date(range.endDate).getTime();

  const tzBufferMs = 12 * 60 * 60 * 1000;

  return (
    Number.isFinite(visitTime) &&
    Number.isFinite(startTime) &&
    Number.isFinite(endTime) &&
    visitTime >= startTime - tzBufferMs &&
    visitTime <= endTime + tzBufferMs
  );
};

const formatStayDuration = (minutes) => {
  const value = Number(minutes) || 0;
  if (value >= 60) return `${Math.floor(value / 60)}h ${value % 60}m`;
  return `${value} min`;
};

// ─── Route Connector ──────────────────────────────────────────────────────────
// Shows the travel segment between two visits: distance + travel time
const RouteConnector = ({ visit }) => {
  const distKm = visit?.distanceFromPreviousKm ?? visit?.distance ?? 0;
  const travelInfo = visit?.travelInfo;
  const travelMins = travelInfo?.durationMinutes ?? visit?.travelTimeMinutes ?? 0;
  const isEstimated = travelInfo?.isEstimated ?? true;

  // Only render if there was a previous visit (i.e., this is not the first stop)
  if (!distKm || distKm <= 0) return null;

  const distText = travelInfo?.distanceText || `${Number(distKm).toFixed(2)} km`;
  const timeText = travelInfo?.durationText
    || (travelMins > 0
      ? travelMins >= 60
        ? `${Math.floor(travelMins / 60)}h ${travelMins % 60}m`
        : `${travelMins} min`
      : null);

  return (
    <Box sx={{
      display: "flex",
      alignItems: "stretch",
      gap: 0,
      my: 0,
    }}>
      {/* Left — dashed connector line aligned with circle column */}
      <Box sx={{
        width: 40,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}>
        {/* Dashed animated line */}
        <Box sx={{
          width: 2,
          flex: 1,
          minHeight: 56,
          background: `repeating-linear-gradient(
            to bottom,
            ${alpha(PRIMARY, 0.35)} 0px,
            ${alpha(PRIMARY, 0.35)} 6px,
            transparent 6px,
            transparent 12px
          )`,
          position: "relative",
        }}>
          {/* Animated travel dot */}
          <Box sx={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            width: 6,
            height: 6,
            borderRadius: "50%",
            bgcolor: PRIMARY,
            animation: "travelDot 2s ease-in-out infinite",
            "@keyframes travelDot": {
              "0%": { top: "0%", opacity: 1 },
              "80%": { top: "85%", opacity: 1 },
              "100%": { top: "85%", opacity: 0 },
            },
          }} />
        </Box>
      </Box>

      {/* Right — route info pill */}
      <Box sx={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        pl: 2,
        py: 1,
      }}>
        <Box sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 1.25,
          bgcolor: alpha(PRIMARY, 0.05),
          border: `1px dashed ${alpha(PRIMARY, 0.25)}`,
          borderRadius: "10px",
          px: 1.5,
          py: 0.6,
        }}>
          {/* Distance */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
            <DirectionsCar sx={{ fontSize: 13, color: PRIMARY }} />
            <Typography sx={{
              fontSize: "0.72rem",
              fontWeight: 700,
              color: PRIMARY,
              letterSpacing: "-0.2px",
            }}>
              {distText}
            </Typography>
          </Box>

          {/* Travel time */}
          {timeText && (
            <>
              <Box sx={{ width: 3, height: 3, borderRadius: "50%", bgcolor: alpha(PRIMARY, 0.3) }} />
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
                <Schedule sx={{ fontSize: 12, color: "#64748b" }} />
                <Typography sx={{
                  fontSize: "0.68rem",
                  color: "#64748b",
                  fontWeight: 600,
                }}>
                  {timeText}
                </Typography>
              </Box>
            </>
          )}

          {/* Estimated badge */}
          {isEstimated && (
            <Chip
              label="est."
              size="small"
              sx={{
                height: 14,
                fontSize: "0.55rem",
                fontWeight: 700,
                bgcolor: alpha(WARNING, 0.12),
                color: WARNING,
                "& .MuiChip-label": { px: 0.75 },
              }}
            />
          )}
        </Box>
      </Box>
    </Box>
  );
};

// ─── Visit Card ───────────────────────────────────────────────────────────────
const VisitCard = ({ visit: v, index, isLast, fixedBatteryInfo, fixedBatteryChip }) => {
  const cur = v.status === "InProgress";
  const [imgOpen, setImgOpen] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);

  const photoUrls = getVisitPhotoUrls(v);
  const photoUrl = photoUrls[photoIndex] || null;
  const photoCount = [
    ...(Array.isArray(v.photos) ? v.photos : []),
    v.photo,
    v.photoUrl,
    v.image,
    v.imageUrl,
    v.visitPhoto,
    v.thumbnail,
  ].filter(Boolean).length;

  const handlePhotoError = () => {
    setPhotoIndex((current) =>
      current + 1 < photoUrls.length ? current + 1 : current,
    );
  };

  useEffect(() => {
    setPhotoIndex(0);
  }, [v.id, v._id, v.photos, v.photo, v.photoUrl, v.image, v.imageUrl, v.visitPhoto, v.thumbnail]);

  const address = (() => {
    if (!v.address) return "";
    if (typeof v.address === "string") return v.address.trim();
    return (v.address?.full || v.address?.short || "").trim();
  })();

  const displayTime = v.checkInTime
    ? fmt(v.checkInTime)
    : v.createdAt
      ? fmt(v.createdAt)
      : v.visitTime || null;

  const displayDate = v.visitDate
    ? new Date(v.visitDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
    : null;

  const distKm = v.distanceFromPreviousKm ?? v.distance ?? 0;

  return (
    <Box sx={{ display: "flex", gap: 2, position: "relative" }}>

      {/* Left — circle (no connector line here — RouteConnector handles that) */}
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
        <Box sx={{
          width: 40, height: 40, borderRadius: "50%",
          bgcolor: cur ? SUCCESS : PRIMARY,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, zIndex: 1,
          boxShadow: `0 2px 8px ${alpha(cur ? SUCCESS : PRIMARY, 0.3)}`,
          ...(cur && {
            animation: "pl 1.5s ease-in-out infinite",
            "@keyframes pl": { "0%,100%": { opacity: 1 }, "50%": { opacity: 0.6 } },
          }),
        }}>
          <Store sx={{ fontSize: 17, color: "#fff" }} />
        </Box>
      </Box>

      {/* Middle — details */}
      <Box sx={{ flex: 1, minWidth: 0, pt: 0.25, pb: isLast ? 0 : 0.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, mb: 0.4 }}>
          <Typography sx={{ fontWeight: 700, color: "#0f172a", fontSize: "0.88rem", lineHeight: 1.3 }}>
            {v.locationName || `Stop ${index + 1}`}
          </Typography>
          {(displayTime || displayDate) && (
            <Typography sx={{ fontSize: "0.72rem", fontWeight: 600, color: "#94a3b8", flexShrink: 0 }}>
              {displayDate && displayTime
                ? `${displayDate} · ${displayTime}`
                : displayTime || displayDate}
            </Typography>
          )}
        </Box>

        {cur && (
          <Chip label="In Progress" size="small"
            sx={{ bgcolor: alpha(SUCCESS, 0.1), color: SUCCESS, fontWeight: 700, fontSize: "0.6rem", height: 18, mb: 0.5 }} />
        )}

        {fixedBatteryInfo?.percentage !== null && fixedBatteryInfo?.percentage !== undefined && (
          <Box sx={{ mb: 0.6 }}>
            <Chip
              size="small"
              label={`${fixedBatteryChip.label}${fixedBatteryInfo.isCharging ? " • Charging" : ""}`}
              sx={{ bgcolor: fixedBatteryChip.bg, color: fixedBatteryChip.color, fontWeight: 700, border: `1px solid ${fixedBatteryChip.border}`, height: 22, fontSize: "0.68rem" }}
            />
          </Box>
        )}

        {address && (
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.4, mb: 0.5 }}>
            <LocationOn sx={{ fontSize: 12, color: PRIMARY, mt: "2px", flexShrink: 0 }} />
            <Typography sx={{
              color: "#475569", fontSize: "0.75rem", lineHeight: 1.4,
              display: "-webkit-box", WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical", overflow: "hidden",
            }}>
              {address}
            </Typography>
          </Box>
        )}

        {v.remarks && (
          <Box sx={{ bgcolor: "#f8fafc", borderRadius: "8px", px: 1.5, py: 1, mt: 0.25, borderLeft: "3px solid #e2e8f0" }}>
            <Typography sx={{ color: "#64748b", fontSize: "0.73rem", fontStyle: "italic", lineHeight: 1.6 }}>
              "{v.remarks}"
            </Typography>
          </Box>
        )}

        {/* Tags row */}
        <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", mt: 0.5 }}>
          {v.timeSpentMinutes > 0 && (
            <Box sx={{
              display: "flex", alignItems: "center", gap: 0.4,
              bgcolor: alpha(WARNING, 0.07), borderRadius: "6px", px: 0.75, py: 0.3,
            }}>
              <Timer sx={{ fontSize: 11, color: WARNING }} />
              <Typography sx={{ fontSize: "0.68rem", color: WARNING, fontWeight: 600 }}>
                {v.timeSpentMinutes >= 60
                  ? `${Math.floor(v.timeSpentMinutes / 60)}h ${v.timeSpentMinutes % 60}m`
                  : `${v.timeSpentMinutes} min`}
              </Typography>
            </Box>
          )}

          {photoCount > 0 && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.3 }}>
              <PhotoCamera sx={{ fontSize: 11, color: "#94a3b8" }} />
              <Typography sx={{ fontSize: "0.68rem", color: "#94a3b8" }}>
                {photoCount} photo{photoCount > 1 ? "s" : ""}
              </Typography>
            </Box>
          )}
          {(v.isLeadCreate || v.isLeadCreated) && (
            <Chip label="Lead Created" size="small"
              sx={{ bgcolor: alpha(WARNING, 0.1), color: WARNING, fontWeight: 700, fontSize: "0.6rem", height: 18 }} />
          )}
        </Box>
      </Box>

      {/* Right — Photo thumbnail */}
      {photoUrl && (
        <>
          <Box
            onClick={() => setImgOpen(true)}
            sx={{
              width: 72, height: 72, borderRadius: "10px",
              overflow: "hidden", flexShrink: 0,
              border: "2px solid #e2e8f0",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              alignSelf: "flex-start", mt: 0.25,
              cursor: "pointer",
              transition: "transform 0.2s, box-shadow 0.2s",
              "&:hover": { transform: "scale(1.05)", boxShadow: "0 4px 16px rgba(0,0,0,0.18)", borderColor: PRIMARY },
            }}
          >
            <Box component="img" src={photoUrl} alt="Visit photo" onError={handlePhotoError}
              sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </Box>

          {imgOpen && (
            <Box onClick={() => setImgOpen(false)}
              sx={{
                position: "fixed", inset: 0, zIndex: 9999,
                bgcolor: "rgba(0,0,0,0.92)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "zoom-out", p: 2,
              }}
            >
              <Box sx={{
                position: "absolute", top: 16, right: 16,
                width: 36, height: 36, borderRadius: "50%",
                bgcolor: "rgba(255,255,255,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", "&:hover": { bgcolor: "rgba(255,255,255,0.25)" },
              }}>
                <Close sx={{ color: "#fff", fontSize: 20 }} />
              </Box>
              {v.locationName && (
                <Box sx={{
                  position: "absolute", top: 16, left: 16,
                  bgcolor: "rgba(0,0,0,0.5)", borderRadius: "8px", px: 1.5, py: 0.75,
                }}>
                  <Typography sx={{ color: "#fff", fontSize: "0.82rem", fontWeight: 600 }}>
                    📍 {v.locationName}
                  </Typography>
                  {v.checkInTime && (
                    <Typography sx={{ color: "#94a3b8", fontSize: "0.7rem" }}>{fmt(v.checkInTime)}</Typography>
                  )}
                </Box>
              )}
              <Box
                component="img" src={photoUrl} alt="Visit photo"
                onError={handlePhotoError}
                onClick={(e) => e.stopPropagation()}
                sx={{ maxWidth: "95vw", maxHeight: "90vh", borderRadius: "12px", objectFit: "contain", boxShadow: "0 8px 40px rgba(0,0,0,0.5)" }}
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

// ─── Trip Timeline Card ────────────────────────────────────────────────────────
const TripTimelineCard = ({ trip, index, onDeleteTrip, onPreviewImage }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const isStopped = trip.status === "stopped" || Boolean(trip.stopReason);
  const isCompleted = trip.status === "completed";
  const isOngoing = trip.status === "on_going" || trip.status === "in_progress";

  const startLoc = trip.start?.locationName || trip.startLocationName || "Start Location";
  const startAddr = trip.start?.address || "";
  const startTime = trip.start?.time || trip.start?.timestamp || trip.startTime || trip.createdAt;
  const startFallback = trip.start?.timestamp || trip.createdAt || trip.updatedAt;
  const formattedStartTime = fmt(startTime, startFallback);

  const startOdo = trip.start?.odometer ?? trip.startOdometer ?? null;
  const startPhoto = normalizePhotoUrl(trip.start?.photoUri || trip.startPhoto || trip.photoUrl);
  const startAutoOdo = trip.start?.autoDetectedOdometer ?? trip.autoDetectedReading ?? null;
  const isStartManual = startAutoOdo !== null && startOdo !== null && Math.round(Number(startOdo)) !== Math.round(Number(startAutoOdo));

  const destLoc = trip.destination?.name || trip.destination?.address || trip.destinationName || "";
  const endLoc = trip.end?.locationName || trip.endLocationName || (isOngoing ? (destLoc || "Destination") : (isStopped ? "Stopped Location" : "Completed Location"));
  const endAddr = trip.end?.address || trip.destination?.address || "";
  const endTime = trip.end?.time || trip.end?.timestamp || trip.endTime || trip.tripCompletedAt || trip.tripStoppedAt || (isOngoing ? null : trip.updatedAt);
  const endFallback = trip.end?.timestamp || trip.tripCompletedAt || trip.tripStoppedAt || (isOngoing ? null : trip.updatedAt);
  const formattedEndTime = fmt(endTime, endFallback);
  const endOdo = trip.end?.odometer ?? trip.endOdometer ?? null;
  const endPhoto = normalizePhotoUrl(trip.end?.photoUri || trip.endPhoto);
  const endAutoOdo = trip.end?.autoDetectedOdometer ?? null;
  const isEndManual = endAutoOdo !== null && endOdo !== null && Math.round(Number(endOdo)) !== Math.round(Number(endAutoOdo));

  const kmTravelled = Number(trip.kmTravelled ?? (startOdo !== null && endOdo !== null ? Math.max(0, endOdo - startOdo) : 0)) || 0;
  const durationMins = Number(trip.durationMinutes) || (startTime && endTime ? Math.max(0, Math.round((new Date(endTime) - new Date(startTime)) / 60000)) : 0);

  const formatDuration = (mins) => {
    if (!mins || mins <= 0) return null;
    const h = Math.floor(mins / 60);
    const m = Math.round(mins % 60);
    return h > 0 ? `${h}h ${m}m` : `${m} mins`;
  };

  const statusColor = isCompleted ? SUCCESS : isStopped ? WARNING : (isDark ? "#38bdf8" : PRIMARY);
  const statusLabel = isCompleted ? "Completed" : isStopped ? "Stopped Early" : "In Progress";
  const statusIcon = isCompleted ? <CheckCircle sx={{ fontSize: 13 }} /> : isStopped ? <StopCircle sx={{ fontSize: 13 }} /> : <Navigation sx={{ fontSize: 13 }} />;

  return (
    <Box sx={{
      p: 2, mb: 2,
      bgcolor: isDark ? "#0e1424" : "#ffffff",
      borderRadius: "14px",
      border: `1px solid ${isDark ? (isStopped ? alpha(WARNING, 0.45) : isCompleted ? alpha(SUCCESS, 0.35) : "rgba(255,255,255,0.12)") : (isStopped ? alpha(WARNING, 0.4) : isCompleted ? alpha(SUCCESS, 0.3) : alpha(PRIMARY, 0.2))}`,
      boxShadow: isDark ? "0 4px 16px rgba(0,0,0,0.35)" : "0 2px 10px rgba(0,0,0,0.04)",
      position: "relative",
      transition: "box-shadow 0.2s ease, border-color 0.2s ease",
      "&:hover": {
        boxShadow: isDark ? "0 6px 24px rgba(0,0,0,0.5)" : "0 6px 20px rgba(0,0,0,0.08)",
        borderColor: statusColor,
      }
    }}>
      {/* Header: Trip #, Purpose & Status */}
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 1.5, gap: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box sx={{
            width: 32, height: 32, borderRadius: "8px",
            bgcolor: alpha(statusColor, 0.12),
            color: statusColor,
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <DirectionsCar sx={{ fontSize: 18 }} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 800, color: isDark ? "#ffffff" : "#0f172a", fontSize: "0.88rem", lineHeight: 1.2 }}>
              Trip #{trip.tripNumber || index + 1}
            </Typography>
            {trip.purpose && (
              <Typography sx={{ fontSize: "0.72rem", color: isDark ? "#94a3b8" : "#64748b", fontWeight: 600 }}>
                {trip.purpose}
              </Typography>
            )}
          </Box>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Chip
            icon={statusIcon}
            label={statusLabel}
            size="small"
            sx={{
              height: 22,
              fontWeight: 800,
              fontSize: "0.68rem",
              bgcolor: alpha(statusColor, 0.12),
              color: statusColor,
              border: `1px solid ${alpha(statusColor, 0.3)}`,
              "& .MuiChip-icon": { color: statusColor }
            }}
          />
          {onDeleteTrip && (
            <Tooltip title="Delete Trip Record">
              <IconButton
                size="small"
                onClick={() => {
                  if (window.confirm("Are you sure you want to delete this trip record?")) {
                    onDeleteTrip(trip._id || trip.id);
                  }
                }}
                sx={{ color: isDark ? "#64748b" : "#94a3b8", "&:hover": { color: ERROR, bgcolor: alpha(ERROR, 0.08) }, p: 0.5 }}
              >
                <DeleteOutline sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Start Location Node */}
      <Box sx={{ display: "flex", gap: 1.2, position: "relative", mb: 1.5 }}>
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", width: 20, flexShrink: 0 }}>
          <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: SUCCESS, border: `2px solid ${isDark ? "#0e1424" : "#fff"}`, boxShadow: "0 0 0 2px #22c55e", mt: "4px" }} />
          <Box sx={{ width: 2, flex: 1, bgcolor: isDark ? "rgba(255,255,255,0.15)" : "#e2e8f0", my: 0.5 }} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: isDark ? "#f1f5f9" : "#1e293b" }}>
              Start: {startLoc}
            </Typography>
            {formattedStartTime && (
              <Typography sx={{ fontSize: "0.72rem", color: isDark ? "#94a3b8" : "#64748b", fontWeight: 700 }}>
                {formattedStartTime}
              </Typography>
            )}
          </Box>
          {startAddr && startAddr !== startLoc && (
            <Typography sx={{ fontSize: "0.7rem", color: isDark ? "#94a3b8" : "#64748b", mt: 0.2 }}>
              {startAddr}
            </Typography>
          )}

          {/* Start Odometer & Photo Card */}
          {(startOdo !== null || startPhoto) && (
            <Box sx={{
              mt: 0.75, p: 0.85, borderRadius: "8px",
              bgcolor: isDark ? "rgba(255,255,255,0.04)" : "#f8fafc",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0"}`,
              display: "flex", alignItems: "center", gap: 1.2
            }}>
              {startPhoto && (
                <Tooltip title="Click to view odometer photo" arrow>
                  <Box
                    onClick={() => onPreviewImage && onPreviewImage(startPhoto, `Trip #${trip.tripNumber || index + 1} Start Odometer`)}
                    sx={{
                      width: 44, height: 44, borderRadius: "8px", overflow: "hidden",
                      border: `2px solid ${isDark ? "rgba(255,255,255,0.15)" : "#cbd5e1"}`, cursor: "pointer", flexShrink: 0,
                      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                      transition: "transform 0.15s, border-color 0.15s",
                      "&:hover": { transform: "scale(1.05)", borderColor: "#2563eb" }
                    }}
                  >
                    <Box component="img" src={startPhoto} alt="Start Odometer" sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </Box>
                </Tooltip>
              )}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                {startAutoOdo !== null && (
                  <Typography sx={{ fontSize: "0.68rem", color: isDark ? "#60a5fa" : "#2563eb", fontWeight: 700, display: "flex", alignItems: "center", gap: 0.4 }}>
                    🤖 AI Scanned: {Number(startAutoOdo).toLocaleString()} km
                  </Typography>
                )}
                {isStartManual ? (
                  <Typography sx={{ fontSize: "0.72rem", color: isDark ? "#fbbf24" : "#b45309", fontWeight: 800 }}>
                    ✏️ Manual: {Number(startOdo).toLocaleString()} km (Override)
                  </Typography>
                ) : (
                  <Typography sx={{ fontSize: "0.72rem", color: isDark ? "#f1f5f9" : "#1e293b", fontWeight: 700 }}>
                    ✓ Odometer: {Number(startOdo).toLocaleString()} km
                  </Typography>
                )}
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      {/* End / Destination Node */}
      <Box sx={{ display: "flex", gap: 1.2, position: "relative", mb: 1.5 }}>
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", width: 20, flexShrink: 0 }}>
          <Box sx={{
            width: 12, height: 12, borderRadius: "50%",
            bgcolor: isStopped ? WARNING : isCompleted ? (isDark ? "#38bdf8" : PRIMARY) : "#94a3b8",
            border: `2px solid ${isDark ? "#0e1424" : "#fff"}`,
            boxShadow: `0 0 0 2px ${isStopped ? WARNING : isCompleted ? (isDark ? "#38bdf8" : PRIMARY) : "#94a3b8"}`,
            mt: "4px"
          }} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: isStopped ? (isDark ? "#fbbf24" : "#b45309") : (isDark ? "#f1f5f9" : "#1e293b") }}>
              {isOngoing ? "Heading To: " : isStopped ? "Stopped At: " : "End: "}
              {endLoc}
            </Typography>
            {formattedEndTime && (
              <Typography sx={{ fontSize: "0.72rem", color: isDark ? "#94a3b8" : "#64748b", fontWeight: 700 }}>
                {formattedEndTime}
              </Typography>
            )}
          </Box>
          {endAddr && endAddr !== endLoc && (
            <Typography sx={{ fontSize: "0.7rem", color: isDark ? "#94a3b8" : "#64748b", mt: 0.2 }}>
              {endAddr}
            </Typography>
          )}

          {/* End Odometer & Photo Card */}
          {(endOdo !== null || endPhoto) && (
            <Box sx={{
              mt: 0.75, p: 0.85, borderRadius: "8px",
              bgcolor: isDark ? "rgba(255,255,255,0.04)" : "#f8fafc",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0"}`,
              display: "flex", alignItems: "center", gap: 1.2
            }}>
              {endPhoto && (
                <Tooltip title="Click to view odometer photo" arrow>
                  <Box
                    onClick={() => onPreviewImage && onPreviewImage(endPhoto, `Trip #${trip.tripNumber || index + 1} End Odometer`)}
                    sx={{
                      width: 44, height: 44, borderRadius: "8px", overflow: "hidden",
                      border: `2px solid ${isDark ? "rgba(255,255,255,0.15)" : "#cbd5e1"}`, cursor: "pointer", flexShrink: 0,
                      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                      transition: "transform 0.15s, border-color 0.15s",
                      "&:hover": { transform: "scale(1.05)", borderColor: "#2563eb" }
                    }}
                  >
                    <Box component="img" src={endPhoto} alt="End Odometer" sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </Box>
                </Tooltip>
              )}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                {endAutoOdo !== null && (
                  <Typography sx={{ fontSize: "0.68rem", color: isDark ? "#60a5fa" : "#2563eb", fontWeight: 700, display: "flex", alignItems: "center", gap: 0.4 }}>
                    🤖 AI Scanned: {Number(endAutoOdo).toLocaleString()} km
                  </Typography>
                )}
                {isEndManual ? (
                  <Typography sx={{ fontSize: "0.72rem", color: isDark ? "#fbbf24" : "#b45309", fontWeight: 800 }}>
                    ✏️ Manual: {Number(endOdo).toLocaleString()} km (Override)
                  </Typography>
                ) : (
                  <Typography sx={{ fontSize: "0.72rem", color: isDark ? "#f1f5f9" : "#1e293b", fontWeight: 700 }}>
                    ✓ Odometer: {Number(endOdo).toLocaleString()} km
                  </Typography>
                )}
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      {/* STOPPED REASON CALLOUT BOX (Prominently displayed if user stopped the trip) */}
      {isStopped && (
        <Box sx={{
          p: 1.25, mb: 1.5,
          bgcolor: alpha(WARNING, isDark ? 0.15 : 0.08),
          borderRadius: "8px",
          borderLeft: `4px solid ${WARNING}`,
          display: "flex",
          alignItems: "flex-start",
          gap: 1
        }}>
          <ReportProblem sx={{ fontSize: 18, color: WARNING, mt: "2px", flexShrink: 0 }} />
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontSize: "0.74rem", fontWeight: 800, color: isDark ? "#fcd34d" : "#92400e", textTransform: "uppercase", letterSpacing: "0.02em" }}>
              Trip Stopped Early
            </Typography>
            <Typography sx={{ fontSize: "0.76rem", color: isDark ? "#fef3c7" : "#78350f", fontWeight: 600, mt: 0.25 }}>
              Reason: &ldquo;{trip.stopReason || "User manually stopped the trip before reaching destination."}&rdquo;
            </Typography>
            <Typography sx={{ fontSize: "0.7rem", color: isDark ? "#fde68a" : "#92400e", mt: 0.25 }}>
              Travelled <b>{kmTravelled > 0 ? kmTravelled.toFixed(2) : "0.00"} km</b> before stopping
              {endTime ? ` at ${fmt(endTime)}` : ""}.
            </Typography>
          </Box>
        </Box>
      )}

      {/* Stats row: KM travelled, Duration */}
      <Box sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        pt: 1,
        borderTop: `1px dashed ${isDark ? "rgba(255,255,255,0.12)" : "#e2e8f0"}`,
        flexWrap: "wrap",
        gap: 1
      }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
          <Speed sx={{ fontSize: 15, color: isDark ? "#38bdf8" : PRIMARY }} />
          <Typography sx={{ fontSize: "0.78rem", fontWeight: 800, color: isDark ? "#38bdf8" : PRIMARY }}>
            {kmTravelled > 0 ? `${kmTravelled.toFixed(2)} km` : "0.00 km"} travelled
          </Typography>
        </Box>

        {formatDuration(durationMins) && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
            <AccessTime sx={{ fontSize: 13, color: isDark ? "#94a3b8" : "#64748b" }} />
            <Typography sx={{ fontSize: "0.72rem", color: isDark ? "#94a3b8" : "#64748b", fontWeight: 600 }}>
              {formatDuration(durationMins)}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

const clientGeocodeCache = new Map();

const isCoordinateText = (text) => {
  if (!text || typeof text !== "string") return false;
  const clean = text.trim();
  return /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/.test(clean) || /^\d+\.\d+$/.test(clean);
};

const resolveCoordinateAddress = async (lat, lng) => {
  if (!lat || !lng || !Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) return null;
  const key = `${Number(lat).toFixed(4)},${Number(lng).toFixed(4)}`;
  if (clientGeocodeCache.has(key)) return clientGeocodeCache.get(key);

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=18&addressdetails=1`,
      { headers: { "Accept-Language": "en" } }
    );
    if (res.ok) {
      const data = await res.json();
      if (data?.display_name) {
        const addr = data.address || {};
        const road = addr.road || addr.pedestrian || addr.street || "";
        const neighbourhood = addr.suburb || addr.neighbourhood || addr.residential || addr.subdistrict || "";
        const city = addr.city || addr.town || addr.village || addr.municipality || "";
        const short = [neighbourhood || road, city].filter(Boolean).join(", ") || data.display_name.split(",").slice(0, 2).join(", ");
        const result = { full: data.display_name, short: short || data.display_name };
        clientGeocodeCache.set(key, result);
        return result;
      }
    }
  } catch (e) { }

  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
    );
    if (res.ok) {
      const data = await res.json();
      const informative = (data.localityInfo?.informative || []).map((i) => i.name).filter((n) => n && !/india/i.test(n));
      const admin = (data.localityInfo?.administrative || []).filter((a) => a.order >= 4).map((a) => a.name);
      const locality = data.locality || data.city;
      const district = data.principalSubdivision;
      const postcode = data.postcode;
      const uniqueParts = Array.from(new Set([...informative, ...admin, locality, district, postcode])).filter(Boolean);
      if (uniqueParts.length > 0) {
        const full = uniqueParts.join(", ");
        const short = uniqueParts.slice(0, 2).join(", ");
        const result = { full, short };
        clientGeocodeCache.set(key, result);
        return result;
      }
    }
  } catch (e) { }

  return null;
};

const StayedLocationCard = ({ stay }) => {
  const [geoAddress, setGeoAddress] = useState(null);

  const rawLat = stay?.lat ?? (isCoordinateText(stay?.locationName) ? Number(stay.locationName.split(",")[0]) : null);
  const rawLng = stay?.lng ?? (isCoordinateText(stay?.locationName) ? Number(stay.locationName.split(",")[1]) : null);
  const lat = Number(rawLat);
  const lng = Number(rawLng);

  useEffect(() => {
    let active = true;
    const isCoordName = isCoordinateText(stay?.locationName);
    const isCoordAddr = isCoordinateText(stay?.address);

    if ((!stay?.address || isCoordAddr || !stay?.locationName || isCoordName) && Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0) {
      resolveCoordinateAddress(lat, lng).then((resolved) => {
        if (active && resolved) {
          setGeoAddress(resolved);
        }
      });
    }
    return () => { active = false; };
  }, [stay, lat, lng]);

  const latestEvent = Array.isArray(stay?.events) && stay.events.length
    ? [...stay.events].sort((a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime())[0]
    : null;
  const startTime = latestEvent?.startTime || null;
  const endTime = latestEvent?.endTime || stay?.lastEndTime || null;
  const totalMinutes = Number(stay?.totalDurationMinutes) || 0;
  const visitCount = Number(stay?.visitCount) || 0;

  const displayName =
    (!isCoordinateText(stay?.locationName) && stay?.locationName) ||
    geoAddress?.short ||
    (!isCoordinateText(stay?.address) && stay?.address?.split(",")?.slice(0, 2)?.join(", ")) ||
    (Number.isFinite(lat) && Number.isFinite(lng) ? `Stayed Location (${lat.toFixed(4)}, ${lng.toFixed(4)})` : "Stayed location");

  const displayAddress =
    (!isCoordinateText(stay?.address) && stay?.address) ||
    geoAddress?.full ||
    (!isCoordinateText(stay?.locationName) && stay?.locationName) ||
    (geoAddress?.short ? geoAddress.short : "");

  return (
    <Box sx={{ display: "flex", gap: 2, position: "relative", mb: 2 }}>
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
        <Box sx={{
          width: 40, height: 40, borderRadius: "50%",
          bgcolor: WARNING,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 2px 8px ${alpha(WARNING, 0.3)}`,
        }}>
          <Timer sx={{ fontSize: 17, color: "#fff" }} />
        </Box>
      </Box>

      <Box sx={{ flex: 1, minWidth: 0, pt: 0.25 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, mb: 0.4 }}>
          <Typography sx={{ fontWeight: 700, color: "#0f172a", fontSize: "0.88rem", lineHeight: 1.3 }}>
            {displayName}
          </Typography>
          {endTime && (
            <Typography sx={{ fontSize: "0.72rem", fontWeight: 600, color: "#94a3b8", flexShrink: 0 }}>
              {fmt(endTime)}
            </Typography>
          )}
        </Box>

        {displayAddress ? (
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.4, mb: 0.5 }}>
            <LocationOn sx={{ fontSize: 12, color: WARNING, mt: "2px", flexShrink: 0 }} />
            <Typography sx={{
              color: "#475569", fontSize: "0.75rem", lineHeight: 1.4,
              display: "-webkit-box", WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical", overflow: "hidden",
            }}>
              {displayAddress}
            </Typography>
          </Box>
        ) : null}

        <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", mt: 0.5 }}>
          <Chip
            size="small"
            label={`${visitCount} time${visitCount === 1 ? "" : "s"} stayed`}
            sx={{ bgcolor: alpha(WARNING, 0.1), color: WARNING, fontWeight: 700, fontSize: "0.65rem", height: 20 }}
          />
          <Chip
            size="small"
            label={`${formatStayDuration(totalMinutes)} total`}
            sx={{ bgcolor: "#f8fafc", color: "#64748b", fontWeight: 700, fontSize: "0.65rem", height: 20, border: "1px solid #e2e8f0" }}
          />
          {startTime && endTime && (
            <Chip
              size="small"
              label={`${fmt(startTime)} - ${fmt(endTime)}`}
              sx={{ bgcolor: alpha(PRIMARY, 0.06), color: PRIMARY, fontWeight: 700, fontSize: "0.65rem", height: 20 }}
            />
          )}
        </Box>
      </Box>
    </Box>
  );
};

// ─── Filter Drawer ────────────────────────────────────────────────────────────
const FilterDrawer = ({ open, onClose, filters, onApply }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const cardBg = isDark ? "#0e1424" : "#ffffff";
  const cardBorder = isDark ? "rgba(255, 255, 255, 0.08)" : "#e8edf2";
  const textTitle = isDark ? "#ffffff" : "#0f172a";
  const textSub = isDark ? "#94a3b8" : "#64748b";
  const [local, setLocal] = useState(filters);

  useEffect(() => {
    if (open) {
      setLocal(filters);
    }
  }, [filters, open]);

  return (
    <SwipeableDrawer anchor="bottom" open={open} onClose={onClose} onOpen={() => { }}
      PaperProps={{ sx: { borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "80vh", bgcolor: cardBg, color: textTitle, borderTop: `1px solid ${cardBorder}` } }}>
      <Box sx={{ p: 3 }}>
        <Box sx={{ width: 36, height: 4, bgcolor: "#e2e8f0", borderRadius: 2, mx: "auto", mb: 2.5 }} />
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2.5 }}>
          <Typography variant="h6" fontWeight={700} sx={{ color: PRIMARY }}>Filter Visits</Typography>
          <IconButton onClick={onClose} size="small"><Close /></IconButton>
        </Box>


        {/* Date Range */}
        <Typography sx={{ fontWeight: 600, fontSize: "0.82rem", color: "#0f172a", mb: 1 }}>Date Range</Typography>

        {/* Recent day chips */}
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1.5 }}>
          {getRecentDays().map(o => (
            <Chip key={o.value} label={o.label}
              onClick={() => setLocal(p => ({ ...p, dateRange: o.value }))}
              sx={{
                fontWeight: 600, fontSize: "0.78rem", cursor: "pointer",
                bgcolor: local.dateRange === o.value ? PRIMARY : "#f1f5f9",
                color: local.dateRange === o.value ? "#fff" : "#374151",
              }} />
          ))}
          {/* This Week & This Month */}
          {[{ value: "week", label: "This Week" }, { value: "month", label: "This Month" }].map(o => (
            <Chip key={o.value} label={o.label}
              onClick={() => setLocal(p => ({ ...p, dateRange: o.value }))}
              sx={{
                fontWeight: 600, fontSize: "0.78rem", cursor: "pointer",
                bgcolor: local.dateRange === o.value ? PRIMARY : "#f1f5f9",
                color: local.dateRange === o.value ? "#fff" : "#374151",
              }} />
          ))}
        </Box>

        {/* Custom date picker */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2.5 }}>
          <CalendarToday sx={{ fontSize: 15, color: PRIMARY }} />
          <Typography sx={{ fontSize: "0.78rem", color: "#374151", fontWeight: 500 }}>Pick a date:</Typography>
          <Box
            component="input"
            type="date"
            max={new Date().toISOString().split("T")[0]}
            value={local.dateRange?.match(/^\d{4}-\d{2}-\d{2}$/) ? local.dateRange : ""}
            onChange={e => e.target.value && setLocal(p => ({ ...p, dateRange: e.target.value }))}
            sx={{
              border: `1px solid ${alpha(PRIMARY, 0.3)}`,
              borderRadius: "8px", px: 1.25, py: 0.6,
              fontSize: "0.78rem", color: "#374151",
              outline: "none", cursor: "pointer",
              "&:focus": { borderColor: PRIMARY },
            }}
          />
        </Box>





        <Typography sx={{ fontWeight: 600, fontSize: "0.82rem", color: "#0f172a", mb: 1 }}>Status</Typography>
        {["Completed", "InProgress", "Cancelled"].map(s => (
          <FormControlLabel key={s}
            label={<Typography sx={{ fontSize: "0.82rem" }}>{s}</Typography>}
            control={
              <Checkbox
                checked={local.statuses?.includes(s) || false}
                onChange={e => {
                  const a = local.statuses || [];
                  setLocal(p => ({ ...p, statuses: e.target.checked ? [...a, s] : a.filter(x => x !== s) }));
                }}
                sx={{ color: PRIMARY, "&.Mui-checked": { color: PRIMARY } }}
              />
            }
            sx={{ display: "flex", mb: 0.25 }} />
        ))}
        <Box sx={{ display: "flex", gap: 1.5, mt: 3 }}>
          <Button fullWidth variant="outlined" onClick={onClose}
            sx={{ borderColor: "#e2e8f0", color: "#374151", fontWeight: 600, borderRadius: "10px", py: 1.1 }}>
            Cancel
          </Button>
          <Button fullWidth variant="contained" onClick={() => { onApply(local); onClose(); }}
            sx={{ bgcolor: PRIMARY, fontWeight: 600, borderRadius: "10px", py: 1.1 }}>
            Apply
          </Button>
        </Box>
      </Box>
    </SwipeableDrawer>
  );
};

const ActiveTripCard = ({ trip, resolvedAddress, isDark }) => {
  if (!trip || (!trip.destination && trip.tripStatus !== "active")) return null;

  const destTitle = trip.destination?.name || trip.destination?.title || "Destination (Location B)";
  const destSubtitle = trip.destination?.address || trip.destination?.subtitle || "";
  const startLoc = trip.start?.locationName || resolvedAddress || "Punch-in Location (Location A)";
  const isStopped = trip.tripStatus === "stopped";
  const isCompleted = trip.tripStatus === "completed";

  return (
    <Box
      sx={{
        mt: 1.5,
        mb: 2,
        p: 2,
        borderRadius: "14px",
        bgcolor: isDark ? "rgba(37,99,235,0.08)" : "#f0f7ff",
        border: `1.5px solid ${isStopped ? "#f59e0b" : isCompleted ? "#22c55e" : "#3b82f6"}`,
        boxShadow: "0 4px 14px rgba(37,99,235,0.08)",
        transition: "all 0.2s ease",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: "8px",
              bgcolor: isStopped ? "#fef3c7" : isCompleted ? "#dcfce7" : "#dbeafe",
              color: isStopped ? "#d97706" : isCompleted ? "#16a34a" : "#2563eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <DirectionsCar sx={{ fontSize: 17 }} />
          </Box>
          <Typography sx={{ fontSize: "0.82rem", fontWeight: 800, color: isDark ? "#fff" : "#0f172a" }}>
            Trip #{trip.tripNumber || 1}
          </Typography>
        </Box>
        <Chip
          size="small"
          label={
            isStopped
              ? "Paused / Stopped"
              : isCompleted
                ? "Trip Completed"
                : "● Navigation Live"
          }
          sx={{
            bgcolor: isStopped ? "#fef3c7" : isCompleted ? "#dcfce7" : "#2563eb",
            color: isStopped ? "#92400e" : isCompleted ? "#166534" : "#ffffff",
            fontWeight: 700,
            fontSize: "0.68rem",
            height: 22,
          }}
        />
      </Box>

      {/* Origin (A) -> Destination (B) details */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.8, pl: 0.5 }}>
        {/* Start / Origin A */}
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#22c55e", mt: "5px", flexShrink: 0 }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 600 }}>
              Start (A){trip.start?.time ? ` · ${trip.start.time}` : ""}
            </Typography>
            <Typography sx={{ fontSize: "0.78rem", fontWeight: 600, color: isDark ? "#e2e8f0" : "#0f172a", lineHeight: 1.3 }}>
              {startLoc}
            </Typography>
          </Box>
        </Box>

        {/* Vertical dotted track */}
        <Box sx={{ width: 2, height: 10, bgcolor: "#cbd5e1", ml: "3px" }} />

        {/* Destination B */}
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: "2px", bgcolor: "#dc2626", mt: "5px", flexShrink: 0 }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: "0.7rem", color: "#dc2626", fontWeight: 700 }}>
              Destination (B)
            </Typography>
            <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: isDark ? "#fff" : "#0f172a", lineHeight: 1.3 }}>
              {destTitle}
            </Typography>
            {destSubtitle && (
              <Typography sx={{ fontSize: "0.72rem", color: "#64748b", mt: 0.2 }}>
                {destSubtitle}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>

      {/* Stats footer: Exact Distance & Duration */}
      <Box
        sx={{
          mt: 1.25,
          pt: 1,
          borderTop: isDark ? "1px dashed rgba(255,255,255,0.12)" : "1px dashed #bfdbfe",
          display: "flex",
          flexDirection: "column",
          gap: 0.75,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {trip.actualDistanceKm !== undefined ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Route sx={{ fontSize: 15, color: isStopped ? "#d97706" : "#22c55e" }} />
              <Typography sx={{ fontSize: "0.75rem", fontWeight: 800, color: isStopped ? "#b45309" : "#15803d" }}>
                {trip.actualDistanceKm} km travelled {trip.selectedRoute?.distanceKm ? "(of " + trip.selectedRoute.distanceKm + " km)" : ""}
              </Typography>
            </Box>
          ) : trip.selectedRoute?.distanceKm ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Route sx={{ fontSize: 14, color: "#2563eb" }} />
              <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: isDark ? "#93c5fd" : "#1e40af" }}>
                {trip.selectedRoute.distanceKm} km planned
              </Typography>
            </Box>
          ) : null}

          {trip.selectedRoute?.durationMin && !isStopped && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Schedule sx={{ fontSize: 14, color: "#2563eb" }} />
              <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: isDark ? "#93c5fd" : "#1e40af" }}>
                ~{trip.selectedRoute.durationMin} min ETA
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {trip.stopReason && (
        <Box sx={{ mt: 1, p: 1, borderRadius: "8px", bgcolor: "#fffbeb", border: "1px solid #fde68a" }}>
          <Typography sx={{ fontSize: "0.72rem", color: "#92400e", fontWeight: 700 }}>
            🛑 Stopped at {trip.actualDistanceKm !== undefined ? trip.actualDistanceKm + " km" : "early"}: {trip.stopReason}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function MemberVisitHistory({ userId: propUserId }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const pageBg = isDark ? "#060a12" : "#f4f6fb";
  const cardBg = isDark ? "#0e1424" : "#ffffff";
  const cardBorder = isDark ? "rgba(255, 255, 255, 0.08)" : "#e8edf2";
  const cardHoverBorder = isDark ? "rgba(255, 255, 255, 0.15)" : alpha(PRIMARY, 0.3);
  const textTitle = isDark ? "#ffffff" : "#0f172a";
  const textSub = isDark ? "#94a3b8" : "#64748b";
  const textMuted = isDark ? "#cbd5e1" : "#475569";
  const barBg = isDark ? "#090d18" : "#fafbfc";
  const dividerBorder = isDark ? "rgba(255, 255, 255, 0.08)" : "#f1f5f9";
  const { userId: paramUserId } = useParams();
  const location = useLocation();
  const { user: authUser } = useAuth();

  const selectedMember = location.state || {};
  const userId = toIdString(paramUserId || propUserId);
  const stateUserId = getMemberStateUserId(selectedMember);
  const authUserId = toIdString(authUser);
  const targetUserId = stateUserId || userId || authUserId || readStoredUserId();
  const hasValidTargetUserId = isValidMongoObjectId(targetUserId);
  const isAdminView = !!paramUserId;

  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hInchargeore, setHInchargeore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isPunchedIn, setIsPunchedIn] = useState(false);
  const [hasPunchedOut, setHasPunchedOut] = useState(false);
  const [attendanceRecord, setAttendanceRecord] = useState(null);
  const [activeTrip, setActiveTrip] = useState(null);
  const [vehicleTrips, setVehicleTrips] = useState([]);
  const [punchInLocation, setPunchInLocation] = useState(null);
  const [punchOutLocation, setPunchOutLocation] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [filters, setFilters] = useState(() => {
    const defaultDate = location.state?.selectedDate || "today";
    return { dateRange: defaultDate, statuses: [] };
  });
  const [filterOpen, setFilterOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [locateTrigger, setLocateTrigger] = useState(0);
  const [locating, setLocating] = useState(false);
  const [punchInPopupTrigger, setPunchInPopupTrigger] = useState(0);
  const [gpsDistance, setGpsDistance] = useState(null);
  const [mapDistance, setMapDistance] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [resolvedAddress, setResolvedAddress] = useState("");
  const [networkStatus, setNetworkStatus] = useState(() => {
    if (typeof navigator === "undefined" || !navigator.onLine) {
      return { isOnline: false, type: "offline", label: "Signal Off", color: "#ef4444", bg: "rgba(239, 68, 68, 0.12)" };
    }
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const type = conn ? String(conn.type || "").toLowerCase() : "";
    const effType = conn ? String(conn.effectiveType || "").toUpperCase() : "";

    if (type === "cellular" || type.includes("mobile") || type.includes("cellular")) {
      return { isOnline: true, type: "cellular", label: `Mobile Data (${effType || "4G"})`, color: "#10b981", bg: "rgba(16, 185, 129, 0.12)" };
    }
    if (type === "ethernet") {
      return { isOnline: true, type: "ethernet", label: "Ethernet", color: "#3b82f6", bg: "rgba(59, 130, 246, 0.12)" };
    }
    return { isOnline: true, type: "wifi", label: "WiFi Connected", color: "#06b6d4", bg: "rgba(6, 182, 212, 0.12)" };
  });

  useEffect(() => {
    const updateNet = () => {
      if (typeof navigator === "undefined" || !navigator.onLine) {
        setNetworkStatus({ isOnline: false, type: "offline", label: "Signal Off", color: "#ef4444", bg: "rgba(239, 68, 68, 0.12)" });
        return;
      }
      const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      const type = conn ? String(conn.type || "").toLowerCase() : "";
      const effType = conn ? String(conn.effectiveType || "").toUpperCase() : "";

      if (type === "cellular" || type.includes("mobile") || type.includes("cellular")) {
        setNetworkStatus({ isOnline: true, type: "cellular", label: `Mobile Data (${effType || "4G"})`, color: "#10b981", bg: "rgba(16, 185, 129, 0.12)" });
        return;
      }
      if (type === "ethernet") {
        setNetworkStatus({ isOnline: true, type: "ethernet", label: "Ethernet", color: "#3b82f6", bg: "rgba(59, 130, 246, 0.12)" });
        return;
      }
      setNetworkStatus({ isOnline: true, type: "wifi", label: "WiFi Connected", color: "#06b6d4", bg: "rgba(6, 182, 212, 0.12)" });
    };

    window.addEventListener("online", updateNet);
    window.addEventListener("offline", updateNet);

    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn && conn.addEventListener) {
      conn.addEventListener("change", updateNet);
    }

    return () => {
      window.removeEventListener("online", updateNet);
      window.removeEventListener("offline", updateNet);
      if (conn && conn.removeEventListener) {
        conn.removeEventListener("change", updateNet);
      }
    };
  }, []);

  const isRawCoordinateValue = (val) => {
    if (!val) return true;
    const str = typeof val === "string" ? val : val?.full || val?.short || "";
    const trimmed = str.trim();
    if (
      !trimmed ||
      trimmed === "Fetching address…" ||
      trimmed === "Location not available" ||
      trimmed === "Detecting location…"
    ) {
      return true;
    }
    return /^-?\d+(\.\d+)?[,\s]+-?\d+(\.\d+)?$/.test(trimmed);
  };

  const lastGeocodedRef = useRef(null);

  useEffect(() => {
    const lat = Number(currentLocation?.lat || punchInLocation?.lat || (Array.isArray(visits) && visits[0]?.coordinates?.lat));
    const lng = Number(currentLocation?.lng || punchInLocation?.lng || (Array.isArray(visits) && visits[0]?.coordinates?.lng));
    if (!lat || !lng) return;

    const coordKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
    if (lastGeocodedRef.current === coordKey) return;
    lastGeocodedRef.current = coordKey;

    let active = true;

    const resolveLocation = async () => {
      // 1. Try Nominatim first (zoom=18 for exact street, road, building & colony details)
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=18&addressdetails=1`,
          { headers: { "Accept-Language": "en" } }
        );
        if (res.ok) {
          const data = await res.json();
          if (data?.display_name && active) {
            setResolvedAddress(data.display_name);
            return;
          }
        }
      } catch (e) { }

      // 2. Fallback to BigDataCloud with full detailed area + street components
      try {
        const res = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
        );
        if (res.ok) {
          const data = await res.json();
          const informative = (data.localityInfo?.informative || [])
            .map((i) => i.name)
            .filter((n) => n && !/india/i.test(n));
          const admin = (data.localityInfo?.administrative || [])
            .filter((a) => a.order >= 4)
            .map((a) => a.name);
          const locality = data.locality || data.city;
          const district = data.principalSubdivision;
          const postcode = data.postcode;
          const country = data.countryName;

          const uniqueParts = Array.from(
            new Set([
              ...informative,
              ...admin,
              locality,
              district,
              postcode,
              country,
            ])
          ).filter(Boolean);

          if (uniqueParts.length > 0 && active) {
            setResolvedAddress(uniqueParts.join(", "));
            return;
          }
        }
      } catch (e) { }
    };

    resolveLocation();

    return () => { active = false; };
  }, [currentLocation?.lat, currentLocation?.lng, punchInLocation?.lat, punchInLocation?.lng, visits]);
  const [autoVisitToast, setAutoVisitToast] = useState(null);
  const [dwellInfo, setDwellInfo] = useState(null);
  const [stayedLocations, setStayedLocations] = useState([]);
  const [trips, setTrips] = useState([]);
  const [tripsLoading, setTripsLoading] = useState(false);
  const [odometerData, setOdometerData] = useState(null);
  const [previewOdoImg, setPreviewOdoImg] = useState(null);
  const [activeRightTab, setActiveRightTab] = useState("timeline"); // "timeline" | "trips"
  const [liveBatteryInfo, setLiveBatteryInfo] = useState({ percentage: null, isCharging: false, recordedAt: null });
  const [punchBatteryInfo, setPunchBatteryInfo] = useState({ percentage: null, isCharging: false, recordedAt: null });
  const [targetUserReady, setTargetUserReady] = useState(false);
  const [targetLookupRetry, setTargetLookupRetry] = useState(0);
  const canLoadTargetUser = hasValidTargetUserId && targetUserReady;

  const handleLocateMe = () => {
    setLocating(true);
    setLocateTrigger(t => t + 1);

    if (isAdminView) {
      setTimeout(() => setLocating(false), 600);
      return;
    }

    if (!navigator.geolocation) {
      setLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const accuracy = pos.coords.accuracy;
        setCurrentLocation({
          lat,
          lng,
          accuracy,
          time: new Date().toISOString(),
        });
        // Reset geocode cache so address refreshes for new coords
        lastGeocodedRef.current = null;
        setLocating(false);
      },
      () => {
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 }
    );
  };

  // Pan map to punch-in location and open the info popup
  const handlePunchInFocus = () => {
    setPunchInPopupTrigger(t => t + 1);
  };

  useEffect(() => {
    const onCreated = (e) => {
      const { locationName, address, dwellMins } = e.detail;
      setAutoVisitToast({ locationName, address, dwellMins });
      setDwellInfo(null);
      setPage(1);
      setTimeout(() => setAutoVisitToast(null), 7000);
    };
    window.addEventListener("autoVisitCreated", onCreated);
    return () => window.removeEventListener("autoVisitCreated", onCreated);
  }, []);

  useEffect(() => {
    if (!isPunchedIn || hasPunchedOut) { setDwellInfo(null); return; }
    const interval = setInterval(() => window.dispatchEvent(new CustomEvent("requestDwellInfo")), 60_000);
    const onDwell = (e) => setDwellInfo(e.detail);
    window.addEventListener("dwellInfoResponse", onDwell);
    return () => { clearInterval(interval); window.removeEventListener("dwellInfoResponse", onDwell); };
  }, [isPunchedIn, hasPunchedOut]);

  useEffect(() => { return () => { if (isCurrentlyTracking()) stopTracking(); }; }, []);

  useEffect(() => {
    setLiveBatteryInfo({ percentage: null, isCharging: false, recordedAt: null });
    setPunchBatteryInfo({ percentage: null, isCharging: false, recordedAt: null });
    setMapDistance(null);
  }, [targetUserId]);

  useEffect(() => {
    let cancelled = false;
    setTargetUserReady(false);

    if (!targetUserId) {
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    if (!hasValidTargetUserId) {
      setLoading(false);
      setVisits([]);
      setError("Selected member is not available. Please reopen this page from Team Tracking.");
      return () => {
        cancelled = true;
      };
    }

    setLoading(true);
    setError(null);
    apiFetch(`/user/getUserById/${targetUserId}`)
      .then(() => {
        if (cancelled) return;
        setTargetUserReady(true);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setTargetUserReady(false);
        setLoading(false);
        setVisits([]);
        setError(
          err.message === "User not found"
            ? "Selected member no longer exists. Please reopen this page from Team Tracking."
            : err.message
        );
      });

    return () => {
      cancelled = true;
    };
  }, [targetUserId, hasValidTargetUserId, targetLookupRetry]);

  const fetchPunchInStatus = useCallback(async () => {
    if (!targetUserId || !canLoadTargetUser) return;
    try {
      if (!isSingleDayFilter(filters.dateRange)) {
        setIsPunchedIn(false);
        setHasPunchedOut(false);
        setAttendanceRecord(null);
        setPunchInLocation(null);
        setPunchOutLocation(null);
        setPunchBatteryInfo({ percentage: null, isCharging: false, recordedAt: null });
        return;
      }

      const selectedDay = getSelectedDayKey(filters.dateRange);
      const res = await apiFetch("/attendance", {
        startDate: selectedDay, endDate: selectedDay, limit: 1,
        ...(isAdminView ? { userId: targetUserId } : {}),
      });
      const list = res?.data?.attendances || res?.result?.attendances || res?.data || [];
      const att = Array.isArray(list) ? list[0] : list;
      setAttendanceRecord(att || null);

      const metadata = att?.metadata instanceof Map
        ? Object.fromEntries(att.metadata)
        : (att?.metadata || {});
      const lastTrip = metadata.lastTrip || null;
      const vTrips = metadata.vehicleTrips || (lastTrip ? [lastTrip] : []);
      setActiveTrip(lastTrip);
      setVehicleTrips(Array.isArray(vTrips) ? vTrips : lastTrip ? [lastTrip] : []);

      if (att?.punchIn?.time) {
        const out = !!att?.punchOut?.time;
        const batterySnapshot =
          att.punchIn?.battery ||
          att.metadata?.batteryAtPunchIn ||
          null;
        setIsPunchedIn(!out);
        setHasPunchedOut(out);
        setPunchInLocation({
          lat: att.punchIn?.location?.lat || att.punchIn?.location?.latitude || null,
          lng: att.punchIn?.location?.lng || att.punchIn?.location?.longitude || null,
          address: att.punchIn?.address || null,
          time: att.punchIn?.time || null,
        });
        const normalizedPercentage =
          batterySnapshot?.percentage !== undefined && batterySnapshot?.percentage !== null
            ? Number(batterySnapshot.percentage)
            : null;
        setPunchBatteryInfo(prev => {
          if (!Number.isFinite(normalizedPercentage) && prev.percentage !== null) {
            return prev;
          }

          return {
            percentage: Number.isFinite(normalizedPercentage) ? normalizedPercentage : null,
            isCharging: batterySnapshot?.isCharging ?? false,
            recordedAt: batterySnapshot?.recordedAt || att.punchIn?.time || null,
          };
        });
        if (out && att.punchOut?.time) {
          setPunchOutLocation({
            lat: att.punchOut?.location?.lat || att.punchOut?.location?.latitude || null,
            lng: att.punchOut?.location?.lng || att.punchOut?.location?.longitude || null,
            address: att.punchOut?.address || null,
            time: att.punchOut?.time || null,
          });
        } else {
          setPunchOutLocation(null);
        }
      } else {
        setIsPunchedIn(false);
        setHasPunchedOut(false);
        setPunchInLocation(null);
        setPunchOutLocation(null);
        setPunchBatteryInfo({ percentage: null, isCharging: false, recordedAt: null });
      }
    } catch (e) { console.warn("Punch-in status failed:", e.message); }
  }, [targetUserId, canLoadTargetUser, isAdminView, filters.dateRange]);

  const fetchExpenses = useCallback(async () => {
    if (!targetUserId || !canLoadTargetUser) {
      setExpenses([]);
      return;
    }

    try {
      const res = await apiFetch("/expense/getAll", {
        userId: targetUserId,
        limit: 100,
        ...getDateRange(filters.dateRange),
      });
      const list = res?.data?.expenses || res?.result?.expenses || res?.expenses || [];
      setExpenses(Array.isArray(list) ? list : []);
    } catch (e) {
      console.warn("Expense fetch failed:", e.message);
      setExpenses([]);
    }
  }, [filters.dateRange, targetUserId, canLoadTargetUser]);

  const fetchVisits = useCallback(async (pageNum = 1, append = false) => {
    if (!targetUserId || !canLoadTargetUser) {
      setLoading(false);
      setLoadingMore(false);
      return;
    }
    try {
      if (pageNum === 1) setLoading(true); else setLoadingMore(true);
      setError(null);

      const res = await apiFetch("/visit", {
        page: pageNum, limit: 15,
        ...getDateRange(filters.dateRange),
        ...(isAdminView ? { userId: targetUserId } : {}),
        ...(filters.statuses?.length ? { status: filters.statuses.join(",") } : {}),
      });

      const fetchedVisits =
        res?.data?.visits ||
        res?.result?.visits ||
        res?.visits ||
        (Array.isArray(res?.data) ? res.data : null) ||
        (Array.isArray(res?.result) ? res.result : null) ||
        [];

      const pagination = res?.data?.pagination || res?.result?.pagination || res?.pagination || null;

      setVisits(prev => append ? [...prev, ...fetchedVisits] : fetchedVisits);
      setHInchargeore(pagination ? pageNum < pagination.totalPages : false);
      setLastUpdated(new Date());
    } catch (err) { setError(err.message); }
    finally { setLoading(false); setLoadingMore(false); }
  }, [filters, targetUserId, canLoadTargetUser, isAdminView]);

  const fetchStats = useCallback(async () => {
    if (!targetUserId || !canLoadTargetUser) return;
    try {
      await apiFetch("/visit/stats/overview", {
        ...getDateRange(filters.dateRange),
        ...(isAdminView ? { userId: targetUserId } : {}),
      });
    } catch { }
  }, [filters, targetUserId, canLoadTargetUser, isAdminView]);

  const fetchGpsDistance = useCallback(async () => {
    if (!targetUserId || !canLoadTargetUser) return;
    if (!isSingleDayFilter(filters.dateRange)) {
      setGpsDistance(null);
      return;
    }
    try {
      const selectedDate = getSelectedDayKey(filters.dateRange);
      const res = await apiFetch("/location/distance", { date: selectedDate, salesmanId: targetUserId });
      const data = res?.data || res?.result || res;
      setGpsDistance({ totalKm: data?.totalKm ?? 0, totalPoints: data?.totalPoints ?? 0 });
    } catch (e) { console.warn("GPS distance fetch failed:", e.message); }
  }, [filters.dateRange, targetUserId, canLoadTargetUser]);

  const fetchStayedLocations = useCallback(async () => {
    if (!targetUserId || !canLoadTargetUser || !isSingleDayFilter(filters.dateRange)) {
      setStayedLocations([]);
      return;
    }

    try {
      const selectedDate = getSelectedDayKey(filters.dateRange);
      const res = await apiFetch("/location/stays", {
        date: selectedDate,
        salesmanId: targetUserId,
        minimumStayMinutes: 15,
      });
      const data = res?.data || res?.result || res;
      const locations = data?.stayedLocations || [];
      setStayedLocations(Array.isArray(locations) ? locations : []);
    } catch (e) {
      console.warn("Stayed locations fetch failed:", e.message);
      setStayedLocations([]);
    }
  }, [filters.dateRange, targetUserId, canLoadTargetUser]);

  const fetchTrips = useCallback(async () => {
    if (!targetUserId || !canLoadTargetUser) {
      setTrips([]);
      setOdometerData(null);
      return;
    }
    try {
      setTripsLoading(true);
      const selectedDate = getSelectedDayKey(filters.dateRange);
      const [tripsRes, odoRes] = await Promise.all([
        apiFetch("/trips", {
          salesmanId: targetUserId,
          userId: targetUserId,
          dateKey: selectedDate,
        }, { ignoreNotFound: true }).catch(() => null),
        apiFetch("/trip/status/today", {
          salesmanId: targetUserId,
          userId: targetUserId,
          dateKey: selectedDate,
        }, { ignoreNotFound: true }).catch(() => null),
      ]);

      const rawList = tripsRes?.result ?? tripsRes?.data;
      const list = Array.isArray(rawList)
        ? rawList
        : Array.isArray(rawList?.trips)
          ? rawList.trips
          : [];
      setTrips(list);

      const odoInfo = odoRes?.data || odoRes?.result || null;
      setOdometerData(odoInfo);
    } catch (e) {
      console.warn("Trips fetch failed:", e.message);
      setTrips([]);
      setOdometerData(null);
    } finally {
      setTripsLoading(false);
    }
  }, [filters.dateRange, targetUserId, canLoadTargetUser]);

  const activeOdometerInfo = (() => {
    const startOdoObj = odometerData?.startOdometer;
    const firstTripWithOdo = trips.find(
      (t) => t.start?.photoUri || (t.start?.odometer != null && Number(t.start.odometer) > 0)
    );

    const rawPhoto = startOdoObj?.photoUrl || firstTripWithOdo?.start?.photoUri || "";
    const photoUrl = normalizePhotoUrl(rawPhoto);

    const effectiveKm =
      startOdoObj?.reading != null
        ? Number(startOdoObj.reading)
        : firstTripWithOdo?.start?.odometer != null
          ? Number(firstTripWithOdo.start.odometer)
          : null;

    const aiKm =
      startOdoObj?.autoDetectedReading != null
        ? Number(startOdoObj.autoDetectedReading)
        : firstTripWithOdo?.start?.autoDetectedOdometer != null
          ? Number(firstTripWithOdo.start.autoDetectedOdometer)
          : null;

    const recordedAt =
      startOdoObj?.recordedAt ||
      firstTripWithOdo?.start?.time ||
      firstTripWithOdo?.createdAt;

    const hasManual =
      aiKm != null && effectiveKm != null && Math.round(effectiveKm) !== Math.round(aiKm);

    if (!photoUrl && effectiveKm == null && aiKm == null) return null;

    return {
      photoUrl,
      effectiveKm,
      aiKm,
      hasManual,
      manualKm: hasManual ? effectiveKm : null,
      recordedAt,
    };
  })();

  const handleDeleteTrip = async (tripId) => {
    if (!tripId) return;
    try {
      await apiFetch(`/trips/${tripId}`, {}, { method: "DELETE" });
      fetchTrips();
    } catch (e) {
      console.warn("Delete trip error:", e);
    }
  };

  const fetchLatestBattery = useCallback(async () => {
    if (!targetUserId || !canLoadTargetUser) return;
    try {
      const res = await apiFetch(`/battery/latest/${targetUserId}`, {}, { ignoreNotFound: true });
      if (!res) return;
      const data = res?.data || res?.result || res;
      if (data?.percentage !== undefined) {
        const normalizedPercentage =
          data?.percentage !== undefined && data?.percentage !== null
            ? Number(data.percentage)
            : null;
        setLiveBatteryInfo({
          percentage: Number.isFinite(normalizedPercentage) ? normalizedPercentage : null,
          isCharging: data.isCharging ?? false,
          recordedAt: data.createdAt || data.recordedAt || null,
        });
      }
    } catch { }
  }, [targetUserId, canLoadTargetUser]);

  const memberName =
    selectedMember.memberName ||
    selectedMember.userName ||
    authUser?.name ||
    authUser?.fullName ||
    "Selected User";
  const memberRole =
    selectedMember.memberRole ||
    authUser?.role ||
    (isAdminView ? "Field User" : "My Visit History");
  const memberPhone = selectedMember.memberPhone || authUser?.phoneNumber || authUser?.phone || "";
  const memberEmail = selectedMember.memberEmail || authUser?.email || "";
  const memberInitials = memberName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "SU";

  useEffect(() => {
    if (!targetUserId) return;
    if (!hasValidTargetUserId) {
      setLoading(false);
      setVisits([]);
      setError("Selected member is not available. Please reopen this page from Team Tracking.");
      return;
    }
    setPage(1);
    fetchVisits(1, false);
    fetchStats();
    fetchPunchInStatus();
    fetchExpenses();
    fetchGpsDistance();
    fetchStayedLocations();
    fetchTrips();
    fetchLatestBattery();
  }, [filters, userId, authUserId, targetUserId, hasValidTargetUserId, fetchVisits, fetchStats, fetchPunchInStatus, fetchExpenses, fetchGpsDistance, fetchStayedLocations, fetchTrips, fetchLatestBattery]);

  const handleRefresh = () => {
    if (!hasValidTargetUserId) return;
    setPage(1);
    fetchVisits(1, false);
    fetchStats();
    fetchPunchInStatus();
    fetchExpenses();
    fetchGpsDistance();
    fetchStayedLocations();
    fetchTrips();
    fetchLatestBattery();
  };

  useEffect(() => {
    if (!hasPunchedOut || !hasValidTargetUserId) return;
    const timer = setTimeout(() => { fetchVisits(1, false); fetchExpenses(); fetchGpsDistance(); fetchStayedLocations(); fetchTrips(); }, 2000);
    return () => clearTimeout(timer);
  }, [hasPunchedOut, hasValidTargetUserId, fetchVisits, fetchExpenses, fetchGpsDistance, fetchStayedLocations, fetchTrips]);

  useEffect(() => {
    if (!targetUserId || !hasValidTargetUserId) return;
    if (filters.dateRange && filters.dateRange !== "today") return;
    const interval = setInterval(() => {
      fetchVisits(1, false);
      fetchExpenses();
      fetchGpsDistance();
      fetchStayedLocations();
      fetchTrips();
      fetchPunchInStatus();
      fetchLatestBattery();
    }, 12_000);
    return () => clearInterval(interval);
  }, [targetUserId, hasValidTargetUserId, filters.dateRange, fetchVisits, fetchExpenses, fetchGpsDistance, fetchStayedLocations, fetchTrips, fetchPunchInStatus, fetchLatestBattery]);

  // ── Derived stats ──────────────────────────────────────────────────────────
  const selectedMapDate = isSingleDayFilter(filters.dateRange)
    ? getSelectedDayKey(filters.dateRange)
    : null;
  const useVisitTrailOnly = !isSingleDayFilter(filters.dateRange);

  const visibleVisits = visits.filter(
    (visit) =>
      !isSystemStartLocationVisit(visit) &&
      isVisitInDateRange(visit, filters.dateRange),
  );
  const totalDist = visibleVisits.reduce((s, v) => s + (v.distanceFromPreviousKm ?? v.distance ?? 0), 0);
  const mapDistanceKm = Number(mapDistance?.totalKm || 0);
  const gpsDistanceKm = Number(gpsDistance?.totalKm || 0);
  const displayDistanceKm = gpsDistanceKm > 0 ? gpsDistanceKm : mapDistanceKm > 0 ? mapDistanceKm : totalDist;
  const stayedStopCount = stayedLocations.reduce(
    (sum, stay) => sum + Math.max(1, Number(stay.visitCount) || 0),
    0,
  );
  const totalStopCount = visibleVisits.length + stayedStopCount;
  const totalVisitMinutes = visibleVisits.reduce((s, v) => s + (v.timeSpentMinutes || 0), 0);
  const totalStayedMinutes = stayedLocations.reduce(
    (sum, stay) => sum + (Number(stay.totalDurationMinutes) || 0),
    0,
  );
  const avgTime = totalStopCount
    ? Math.round((totalVisitMinutes + totalStayedMinutes) / totalStopCount)
    : 0;
  const completedCount = visibleVisits.filter(v => v.status === "Completed").length;
  const inProgressCount = visibleVisits.filter(v => v.status === "InProgress").length;
  const cancelledCount = visibleVisits.filter(v => v.status === "Cancelled").length;
  const updatedLabel = lastUpdated
    ? (() => { const m = Math.floor((Date.now() - lastUpdated) / 60000); return m < 1 ? "just now" : `${m}m ago`; })()
    : null;

  // ── Visits sorted oldest → newest for A→B→C display ──────────────────────
  // Keep newest visits first in the timeline.
  const sortedVisits = visibleVisits;
  const currentBatteryInfo = liveBatteryInfo.percentage !== null ? liveBatteryInfo : punchBatteryInfo;
  const timelineBatteryInfo = punchBatteryInfo;
  const currentBatteryChip = getBatteryChipStyle(currentBatteryInfo.percentage);
  const timelineBatteryChip = getBatteryChipStyle(timelineBatteryInfo.percentage);
  const batteryInfo = currentBatteryInfo;
  const batteryChip = currentBatteryChip;
  const expenseTotal = expenses.reduce((sum, item) => sum + (Number(item?.amount) || 0), 0);
  const expenseCount = expenses.length;
  const selectedStatusLabel = formatStatusLabel(attendanceRecord?.status, isPunchedIn, hasPunchedOut);
  const selectedDayLabel = getDateRangeLabel(filters.dateRange);
  const punchInTimeValue = punchInLocation?.time || attendanceRecord?.punchIn?.time || null;
  const punchOutTimeValue = punchOutLocation?.time || attendanceRecord?.punchOut?.time || null;
  const workHoursValue = attendanceRecord?.workHours !== undefined && attendanceRecord?.workHours !== null
    ? Number(attendanceRecord.workHours)
    : null;
  const summaryCards = [
    { label: "Date", value: selectedDayLabel },
    { label: "Punch In", value: punchInTimeValue ? fmt(punchInTimeValue) : "—" },
    { label: "Punch Out", value: punchOutTimeValue ? fmt(punchOutTimeValue) : "—" },
    { label: "Hours", value: workHoursValue !== null ? `${workHoursValue.toFixed(2)} hrs` : "—" },
    { label: "Status", value: selectedStatusLabel },
    { label: "KM", value: `${displayDistanceKm.toFixed(2)} km` },
    { label: "Visits", value: `${totalStopCount}` },
    { label: "Expense", value: formatCurrency(expenseTotal) },
  ];

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: pageBg, color: textTitle }}>
      <FilterDrawer open={filterOpen} onClose={() => setFilterOpen(false)} filters={filters} onApply={setFilters} />

      <Box sx={{ p: { xs: 2, sm: 3, lg: 4 }, maxWidth: 1400, mx: "auto" }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: "10px" }}
            action={<Button size="small" onClick={handleRefresh}>Retry</Button>}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 420px" }, gap: 3, alignItems: "start" }}>

          {/* ── LEFT ── */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>

            {/* Auto-visit toast */}
            {autoVisitToast && (
              <Box sx={{
                bgcolor: "#0f172a", color: "#fff", borderRadius: "14px", px: 2.5, py: 1.75,
                display: "flex", alignItems: "center", gap: 2,
                boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
                animation: "fadeSlideIn 0.35s ease",
                "@keyframes fadeSlideIn": { from: { opacity: 0, transform: "translateY(-10px)" }, to: { opacity: 1, transform: "translateY(0)" } },
              }}>
                <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: SUCCESS, flexShrink: 0, animation: "avp 1.5s ease-in-out infinite", "@keyframes avp": { "0%,100%": { opacity: 1 }, "50%": { opacity: 0.4 } } }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontSize: "0.84rem", fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    📍 {autoVisitToast.locationName}
                  </Typography>
                  {autoVisitToast.address && (
                    <Typography sx={{ fontSize: "0.7rem", color: "#cbd5e1", mt: 0.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {autoVisitToast.address}
                    </Typography>
                  )}
                  <Typography sx={{ fontSize: "0.7rem", color: "#94a3b8", mt: 0.2 }}>
                    Auto-visit · stopped {autoVisitToast.dwellMins} min
                  </Typography>
                </Box>
                <Box sx={{ px: 1.5, py: 0.5, bgcolor: alpha(SUCCESS, 0.15), borderRadius: "8px", border: `1px solid ${alpha(SUCCESS, 0.25)}`, flexShrink: 0 }}>
                  <Typography sx={{ fontSize: "0.8rem", fontWeight: 800, color: SUCCESS }}>{autoVisitToast.dwellMins} min</Typography>
                </Box>
              </Box>
            )}

            {isAdminView && (
              <Box sx={{
                bgcolor: cardBg,
                borderRadius: "20px",
                border: `1px solid ${cardBorder}`,
                boxShadow: "0 8px 32px rgba(0,0,0,0.05)",
                px: { xs: 2.5, sm: 3 },
                py: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
                flexWrap: "wrap",
              }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, minWidth: 0 }}>
                  <Box sx={{ position: "relative" }}>
                    <Box sx={{
                      width: 48,
                      height: 48,
                      borderRadius: "14px",
                      bgcolor: alpha(PRIMARY, 0.12),
                      color: PRIMARY,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.05rem",
                      fontWeight: 800,
                      boxShadow: `0 0 0 2px ${isPunchedIn && !hasPunchedOut ? "#10b981" : "#ef4444"}`,
                    }}>
                      {memberInitials}
                    </Box>
                    <Box sx={{
                      position: "absolute", bottom: -2, right: -2, width: 12, height: 12, borderRadius: "50%",
                      bgcolor: isPunchedIn && !hasPunchedOut ? "#10b981" : "#ef4444",
                      border: "2px solid #fff",
                    }} />
                  </Box>

                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontSize: "1.1rem", fontWeight: 800, color: textTitle, lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {memberName}
                    </Typography>
                    <Typography sx={{ fontSize: "0.8rem", fontWeight: 600, color: textSub, mt: 0.3, whiteSpace: "nowrap" }}>
                      {memberRole}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                  {/* Duty Badge */}
                  {isPunchedIn && !hasPunchedOut ? (
                    <Chip
                      icon={<Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: SUCCESS, animation: "livePulse 1.5s infinite", "@keyframes livePulse": { "0%,100%": { opacity: 1 }, "50%": { opacity: 0.3 } } }} />}
                      label="On Duty"
                      size="small"
                      sx={{ bgcolor: alpha(SUCCESS, 0.12), color: SUCCESS, fontWeight: 800, fontSize: "0.72rem", height: 26, px: 0.5, border: `1px solid ${alpha(SUCCESS, 0.25)}` }}
                    />
                  ) : (
                    <Chip
                      icon={<LocationOff sx={{ fontSize: "13px !important", color: "#ef4444 !important" }} />}
                      label="Location Off"
                      size="small"
                      sx={{ bgcolor: "rgba(239, 68, 68, 0.12)", color: "#ef4444", fontWeight: 800, fontSize: "0.72rem", height: 26, px: 0.5, border: "1px solid rgba(239, 68, 68, 0.25)" }}
                    />
                  )}

                  {/* Network Chip */}
                  <Chip
                    icon={
                      !networkStatus.isOnline ? (
                        <WifiOff sx={{ fontSize: "14px !important", color: `${networkStatus.color} !important` }} />
                      ) : networkStatus.type === "cellular" ? (
                        <SignalCellularAlt sx={{ fontSize: "14px !important", color: `${networkStatus.color} !important` }} />
                      ) : networkStatus.type === "ethernet" ? (
                        <Lan sx={{ fontSize: "14px !important", color: `${networkStatus.color} !important` }} />
                      ) : (
                        <Wifi sx={{ fontSize: "14px !important", color: `${networkStatus.color} !important` }} />
                      )
                    }
                    label={networkStatus.label}
                    size="small"
                    sx={{
                      bgcolor: networkStatus.bg,
                      color: networkStatus.color,
                      fontWeight: 700,
                      fontSize: "0.72rem",
                      height: 26,
                      px: 0.5,
                      border: `1px solid ${alpha(networkStatus.color, 0.25)}`,
                    }}
                  />

                  {/* Battery Chip */}
                  <Chip
                    size="small"
                    label={`${batteryChip.label}${batteryInfo.isCharging ? " • Charging" : ""}`}
                    sx={{ bgcolor: batteryChip.bg, color: batteryChip.color, fontWeight: 700, fontSize: "0.72rem", height: 26, border: `1px solid ${batteryChip.border}` }}
                  />

                  {memberPhone && (
                    <Chip
                      size="small"
                      label={memberPhone}
                      sx={{ bgcolor: isDark ? "rgba(255, 255, 255, 0.05)" : "#f8fafc", color: textMuted, fontWeight: 600, fontSize: "0.72rem", height: 26, border: `1px solid ${cardBorder}` }}
                    />
                  )}
                  {memberEmail && (
                    <Chip
                      size="small"
                      label={memberEmail}
                      sx={{ bgcolor: alpha(PRIMARY, 0.06), color: PRIMARY, fontWeight: 600, fontSize: "0.72rem", height: 26 }}
                    />
                  )}
                </Box>
              </Box>
            )}


            {/* Map */}
            <Box sx={{
              borderRadius: "16px", overflow: "hidden", border: `1px solid ${cardBorder}`,
              height: fullscreen ? "70vh" : { xs: 300, sm: 400, lg: 460 },
              boxShadow: "0 4px 24px rgba(0,0,0,0.06)", transition: "height 0.3s ease",
              position: "relative",
            }}>


              <Tooltip title={fullscreen ? "Exit fullscreen" : "Fullscreen"} placement="left">
                <Box onClick={() => setFullscreen(p => !p)} sx={{ position: "absolute", top: 50, right: 10, zIndex: 1000, bgcolor: cardBg, borderRadius: "10px", p: 0.75, cursor: "pointer", boxShadow: "0 2px 10px rgba(0,0,0,0.12)", border: `1px solid ${cardBorder}`, display: "flex", "&:hover": { bgcolor: "#f8fafc" } }}>
                  {fullscreen ? <FullscreenExit sx={{ fontSize: 18, color: "#374151" }} /> : <Fullscreen sx={{ fontSize: 18, color: "#374151" }} />}
                </Box>
              </Tooltip>

              {dwellInfo && dwellInfo.mins >= 1 && (
                <Box sx={{ position: "absolute", bottom: 48, left: 10, zIndex: 1000, bgcolor: "rgba(255,255,255,0.95)", borderRadius: "10px", px: 1.5, py: 0.75, display: "flex", alignItems: "center", gap: 1, boxShadow: "0 2px 10px rgba(0,0,0,0.12)", border: "1px solid #e2e8f0" }}>
                  <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: WARNING, animation: "dp 1.5s ease-in-out infinite", "@keyframes dp": { "0%,100%": { opacity: 1 }, "50%": { opacity: 0.3 } } }} />
                  <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: "#0f172a" }}>Stopped {dwellInfo.mins} min</Typography>
                  {dwellInfo.mins < 15 && <Typography sx={{ fontSize: "0.65rem", color: "#94a3b8" }}>· visit in {15 - dwellInfo.mins} min</Typography>}
                </Box>
              )}

              <Tooltip title="Live location" placement="left">
                <Box onClick={handleLocateMe} sx={{ position: "absolute", top: 96, right: 10, zIndex: 1000, bgcolor: locating ? PRIMARY : "#fff", borderRadius: "10px", p: 0.75, cursor: "pointer", boxShadow: "0 2px 10px rgba(0,0,0,0.12)", border: `1px solid ${locating ? PRIMARY : "#e2e8f0"}`, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s", "&:hover": { bgcolor: locating ? PRIMARY : alpha(PRIMARY, 0.08), borderColor: PRIMARY } }}>
                  {locating ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : <GpsFixed sx={{ fontSize: 18, color: PRIMARY }} />}
                </Box>
              </Tooltip>



              {hasValidTargetUserId ? (
                <LiveTrackingMap
                  isPunchedIn={isPunchedIn}
                  hasPunchedOut={hasPunchedOut}
                  userId={targetUserId}
                  userName={memberName}
                  currentLocation={currentLocation}
                  isOwner={!isAdminView}
                  height="100%"
                  locateTrigger={locateTrigger}
                  punchInPopupTrigger={punchInPopupTrigger}
                  onDistanceChange={setMapDistance}
                  onCurrentLocationChange={setCurrentLocation}
                  punchInLocation={punchInLocation}
                  punchOutLocation={punchOutLocation}
                  punchBatteryInfo={punchBatteryInfo}
                  resolvedAddress={resolvedAddress}
                  visits={visibleVisits}
                  selectedDate={selectedMapDate}
                  preferVisitTrail={useVisitTrailOnly}
                  activeTrip={activeTrip}
                />
              ) : (
                <Box
                  sx={{
                    height: "100%",
                    display: "grid",
                    placeItems: "center",
                    bgcolor: "#f8fafc",
                    borderRadius: "18px",
                    p: 3,
                    textAlign: "center",
                  }}
                >
                  <Alert severity="warning">
                    Selected member is not available. Please reopen this page from Team Tracking.
                  </Alert>
                </Box>
              )}


            </Box>

            {/* Stats row */}
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(2, minmax(0, 1fr))" }, gap: 2 }}>
              {/* Card 1: Distance */}
              <Box sx={{
                bgcolor: cardBg, borderRadius: "16px", p: 2.25,
                border: `1px solid ${cardBorder}`, boxShadow: "0 2px 12px rgba(0,0,0,0.03)",
                transition: "all 0.25s ease",
                "&:hover": { transform: "translateY(-3px)", boxShadow: "0 8px 24px rgba(37, 99, 235, 0.12)", borderColor: alpha(PRIMARY, 0.4) }
              }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.25 }}>
                  <Typography sx={{ color: textSub, fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Distance</Typography>
                  <Box sx={{ width: 34, height: 34, borderRadius: "10px", bgcolor: alpha(PRIMARY, 0.1), color: PRIMARY, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Route sx={{ fontSize: 18 }} />
                  </Box>
                </Box>
                {loading ? <Skeleton width={60} height={32} /> : (
                  <>
                    <Typography sx={{ fontSize: "1.5rem", fontWeight: 800, color: textTitle, letterSpacing: "-0.5px", lineHeight: 1 }}>
                      {displayDistanceKm.toFixed(2)}{" "}
                      <Typography component="span" sx={{ fontSize: "0.78rem", fontWeight: 600, color: textSub }}>km</Typography>
                    </Typography>
                    <Typography sx={{ fontSize: "0.68rem", color: textMuted, mt: 0.75, fontWeight: 500 }}>
                      {mapDistanceKm > 0 ? "Tracked route distance" : gpsDistanceKm > 0 ? "GPS route distance" : "Visit route distance"}
                    </Typography>
                  </>
                )}
              </Box>

              {/* Card 2: Visits */}
              <Box sx={{
                bgcolor: cardBg, borderRadius: "16px", p: 2.25,
                border: `1px solid ${cardBorder}`, boxShadow: "0 2px 12px rgba(0,0,0,0.03)",
                transition: "all 0.25s ease",
                "&:hover": { transform: "translateY(-3px)", boxShadow: "0 8px 24px rgba(16, 185, 129, 0.12)", borderColor: alpha(SUCCESS, 0.4) }
              }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.25 }}>
                  <Typography sx={{ color: textSub, fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Visits</Typography>
                  <Box sx={{ width: 34, height: 34, borderRadius: "10px", bgcolor: alpha(SUCCESS, 0.1), color: SUCCESS, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <LocationOn sx={{ fontSize: 18 }} />
                  </Box>
                </Box>
                {loading ? <Skeleton width={60} height={32} /> : (
                  <>
                    <Typography sx={{ fontSize: "1.5rem", fontWeight: 800, color: textTitle, letterSpacing: "-0.5px", lineHeight: 1 }}>
                      {totalStopCount}{" "}
                      <Typography component="span" sx={{ fontSize: "0.78rem", fontWeight: 600, color: textSub }}>stops</Typography>
                    </Typography>
                    <Typography sx={{ fontSize: "0.68rem", color: textMuted, mt: 0.75, fontWeight: 500 }}>
                      {completedCount} completed · {inProgressCount} active
                    </Typography>
                  </>
                )}
              </Box>
            </Box>


            {/* Completion bar */}
            {!loading && visibleVisits.length > 0 && (
              <Box sx={{ bgcolor: cardBg, borderRadius: "14px", p: 2.5, border: `1px solid ${cardBorder}` }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", color: textTitle }}>Visit Completion</Typography>
                  <Typography sx={{ fontWeight: 800, fontSize: "1rem", color: PRIMARY }}>
                    {Math.round((completedCount / visibleVisits.length) * 100)}%
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", height: 10, borderRadius: "999px", overflow: "hidden", bgcolor: "#f1f5f9", mb: 1.5 }}>
                  {completedCount > 0 && <Box sx={{ width: `${(completedCount / visibleVisits.length) * 100}%`, bgcolor: SUCCESS, transition: "width 0.6s" }} />}
                  {inProgressCount > 0 && <Box sx={{ width: `${(inProgressCount / visibleVisits.length) * 100}%`, bgcolor: PRIMARY, animation: "sh 1.5s ease-in-out infinite", "@keyframes sh": { "0%,100%": { opacity: 1 }, "50%": { opacity: 0.5 } } }} />}
                  {cancelledCount > 0 && <Box sx={{ width: `${(cancelledCount / visibleVisits.length) * 100}%`, bgcolor: ERROR, opacity: 0.45 }} />}
                </Box>
                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                  {[
                    { label: "Done", count: completedCount, color: SUCCESS },
                    { label: "Active", count: inProgressCount, color: PRIMARY },
                    { label: "Cancelled", count: cancelledCount, color: ERROR },
                  ].map(s => (
                    <Box key={s.label} sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: s.color }} />
                      <Typography sx={{ fontSize: "0.72rem", color: "#64748b" }}>{s.label}</Typography>
                      <Box sx={{ px: 0.75, py: 0.1, borderRadius: "4px", bgcolor: alpha(s.color, 0.1) }}>
                        <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: s.color }}>
                          {s.count} · {Math.round((s.count / visibleVisits.length) * 100)}%
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            {/* Odometer Section (Shows photo, AI Scanned KM and Manual KM if user wrote one) */}
            {activeOdometerInfo && (
              <Box sx={{
                bgcolor: cardBg,
                borderRadius: "18px",
                p: { xs: 2, sm: 2.5 },
                border: `1px solid ${cardBorder}`,
                boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
                transition: "all 0.25s ease",
                "&:hover": {
                  boxShadow: "0 8px 28px rgba(37, 99, 235, 0.1)",
                  borderColor: alpha(PRIMARY, 0.35),
                }
              }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5, flexWrap: "wrap", gap: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                    <Box sx={{
                      width: 36, height: 36, borderRadius: "10px",
                      bgcolor: alpha("#2563eb", 0.1), color: "#2563eb",
                      display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                      <Speed sx={{ fontSize: 20 }} />
                    </Box>
                    <Box>
                      <Typography sx={{ fontWeight: 800, fontSize: "0.88rem", color: textTitle, lineHeight: 1.2 }}>
                        Starting Odometer
                      </Typography>
                      <Typography sx={{ fontSize: "0.7rem", color: textSub, fontWeight: 500, mt: 0.2 }}>
                        {activeOdometerInfo.recordedAt ? `Recorded at ${fmt(activeOdometerInfo.recordedAt)}` : "First trip of the day"}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Badges: AI Verified vs Manual Correction */}
                  {activeOdometerInfo.hasManual ? (
                    <Chip
                      label="✏️ Manual Override"
                      size="small"
                      sx={{
                        height: 24,
                        bgcolor: alpha(WARNING, 0.12),
                        color: "#b45309",
                        fontWeight: 800,
                        fontSize: "0.7rem",
                        border: `1px solid ${alpha(WARNING, 0.3)}`,
                      }}
                    />
                  ) : (
                    <Chip
                      icon={<CheckCircle sx={{ fontSize: "14px !important", color: `${SUCCESS} !important` }} />}
                      label="AI Verified"
                      size="small"
                      sx={{
                        height: 24,
                        bgcolor: alpha(SUCCESS, 0.1),
                        color: SUCCESS,
                        fontWeight: 800,
                        fontSize: "0.7rem",
                        border: `1px solid ${alpha(SUCCESS, 0.25)}`,
                      }}
                    />
                  )}
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: { xs: "wrap", sm: "nowrap" } }}>
                  {/* Odometer Photo Thumbnail */}
                  {activeOdometerInfo.photoUrl ? (
                    <Tooltip title="Click to view full-size photo" arrow>
                      <Box
                        onClick={() => setPreviewOdoImg({ url: activeOdometerInfo.photoUrl, title: "Starting Odometer Photo" })}
                        sx={{
                          width: { xs: 90, sm: 84 },
                          height: { xs: 90, sm: 84 },
                          borderRadius: "14px",
                          overflow: "hidden",
                          border: "2px solid #cbd5e1",
                          position: "relative",
                          cursor: "pointer",
                          flexShrink: 0,
                          boxShadow: "0 3px 12px rgba(0,0,0,0.08)",
                          transition: "all 0.2s ease",
                          "&:hover": {
                            transform: "scale(1.05)",
                            boxShadow: "0 8px 24px rgba(37,99,235,0.25)",
                            borderColor: "#2563eb",
                          }
                        }}
                      >
                        <Box
                          component="img"
                          src={activeOdometerInfo.photoUrl}
                          alt="Odometer"
                          sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                        <Box sx={{
                          position: "absolute",
                          bottom: 0, left: 0, right: 0,
                          bgcolor: "rgba(15, 23, 42, 0.8)",
                          py: 0.3,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 0.4,
                        }}>
                          <PhotoCamera sx={{ fontSize: 11, color: "#fff" }} />
                          <Typography sx={{ fontSize: "0.6rem", color: "#fff", fontWeight: 700 }}>
                            ZOOM
                          </Typography>
                        </Box>
                      </Box>
                    </Tooltip>
                  ) : (
                    <Box sx={{
                      width: 84, height: 84, borderRadius: "14px",
                      bgcolor: "#f1f5f9", display: "flex", flexDirection: "column",
                      alignItems: "center", justifyContent: "center", flexShrink: 0,
                      border: "1.5px dashed #cbd5e1"
                    }}>
                      <PhotoCamera sx={{ fontSize: 24, color: "#94a3b8" }} />
                      <Typography sx={{ fontSize: "0.62rem", color: "#94a3b8", mt: 0.5, fontWeight: 600 }}>
                        No Photo
                      </Typography>
                    </Box>
                  )}

                  {/* KM Readings (AI KM & Manual KM) */}
                  <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 1 }}>
                    {/* AI Scanned KM */}
                    <Box sx={{
                      p: 1.1,
                      borderRadius: "10px",
                      bgcolor: alpha("#2563eb", 0.05),
                      border: `1px solid ${alpha("#2563eb", 0.15)}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}>
                      <Box>
                        <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: "#1d4ed8", textTransform: "uppercase", letterSpacing: "0.3px" }}>
                          🤖 AI Scanned KM
                        </Typography>
                        <Typography sx={{ fontSize: "1.1rem", fontWeight: 800, color: textTitle, lineHeight: 1.1, mt: 0.2 }}>
                          {activeOdometerInfo.aiKm != null ? Number(activeOdometerInfo.aiKm).toLocaleString() : "—"}{" "}
                          <Typography component="span" sx={{ fontSize: "0.72rem", fontWeight: 600, color: textSub }}>KM</Typography>
                        </Typography>
                      </Box>
                      <Chip label="Gemini AI" size="small" sx={{ height: 20, fontSize: "0.62rem", fontWeight: 700, bgcolor: "#dbeafe", color: "#1d4ed8" }} />
                    </Box>

                    {/* Manual KM (if different/entered) OR Applied KM */}
                    {activeOdometerInfo.hasManual ? (
                      <Box sx={{
                        p: 1.1,
                        borderRadius: "10px",
                        bgcolor: alpha(WARNING, 0.08),
                        border: `1px solid ${alpha(WARNING, 0.25)}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}>
                        <Box>
                          <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: "#b45309", textTransform: "uppercase", letterSpacing: "0.3px" }}>
                            ✏️ Manual Typed KM
                          </Typography>
                          <Typography sx={{ fontSize: "1.1rem", fontWeight: 800, color: "#b45309", lineHeight: 1.1, mt: 0.2 }}>
                            {Number(activeOdometerInfo.manualKm).toLocaleString()}{" "}
                            <Typography component="span" sx={{ fontSize: "0.72rem", fontWeight: 600, color: "#b45309" }}>KM</Typography>
                          </Typography>
                        </Box>
                        <Chip label="Manual Override" size="small" sx={{ height: 20, fontSize: "0.62rem", fontWeight: 700, bgcolor: "#fef3c7", color: "#b45309" }} />
                      </Box>
                    ) : (
                      <Box sx={{
                        p: 1.1,
                        borderRadius: "10px",
                        bgcolor: alpha(SUCCESS, 0.06),
                        border: `1px solid ${alpha(SUCCESS, 0.18)}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}>
                        <Box>
                          <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: "#15803d", textTransform: "uppercase", letterSpacing: "0.3px" }}>
                            ✓ Active Trip Reading
                          </Typography>
                          <Typography sx={{ fontSize: "1.1rem", fontWeight: 800, color: textTitle, lineHeight: 1.1, mt: 0.2 }}>
                            {activeOdometerInfo.effectiveKm != null ? Number(activeOdometerInfo.effectiveKm).toLocaleString() : "—"}{" "}
                            <Typography component="span" sx={{ fontSize: "0.72rem", fontWeight: 600, color: textSub }}>KM</Typography>
                          </Typography>
                        </Box>
                        <Chip label="Matches AI" size="small" sx={{ height: 20, fontSize: "0.62rem", fontWeight: 700, bgcolor: "#dcfce7", color: "#15803d" }} />
                      </Box>
                    )}
                  </Box>
                </Box>
              </Box>
            )}

            {/* Current Location Box (Bottom Position) */}
            <Box sx={{
              bgcolor: cardBg,
              borderRadius: "20px",
              border: `1px solid ${cardBorder}`,
              boxShadow: "0 8px 32px rgba(0,0,0,0.05)",
              p: { xs: 2.5, sm: 3 },
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Box sx={{
                    width: 42, height: 42, borderRadius: "14px",
                    bgcolor: alpha(isPunchedIn && !hasPunchedOut ? SUCCESS : PRIMARY, 0.12),
                    color: isPunchedIn && !hasPunchedOut ? SUCCESS : PRIMARY,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: `0 4px 12px ${alpha(isPunchedIn && !hasPunchedOut ? SUCCESS : PRIMARY, 0.2)}`,
                  }}>
                    <LocationOn sx={{ fontSize: 22 }} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontWeight: 800, fontSize: "0.98rem", color: textTitle, lineHeight: 1.2 }}>
                      Current Location
                    </Typography>
                    <Typography sx={{ fontSize: "0.75rem", fontWeight: 500, color: textSub, mt: 0.3 }}>
                      {isPunchedIn && !hasPunchedOut ? "Live Real-Time Duty Location" : "Last Recorded Position"}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                  {/* Network Status Chip */}
                  <Chip
                    icon={
                      !networkStatus.isOnline ? (
                        <WifiOff sx={{ fontSize: "14px !important", color: `${networkStatus.color} !important` }} />
                      ) : networkStatus.type === "cellular" ? (
                        <SignalCellularAlt sx={{ fontSize: "14px !important", color: `${networkStatus.color} !important` }} />
                      ) : networkStatus.type === "ethernet" ? (
                        <Lan sx={{ fontSize: "14px !important", color: `${networkStatus.color} !important` }} />
                      ) : (
                        <Wifi sx={{ fontSize: "14px !important", color: `${networkStatus.color} !important` }} />
                      )
                    }
                    label={networkStatus.label}
                    size="small"
                    sx={{
                      bgcolor: networkStatus.bg,
                      color: networkStatus.color,
                      fontWeight: 700,
                      fontSize: "0.72rem",
                      height: 26,
                      px: 0.5,
                      border: `1px solid ${alpha(networkStatus.color, 0.25)}`,
                    }}
                  />

                  {/* Duty Status Chip */}
                  {isPunchedIn && !hasPunchedOut ? (
                    <Chip
                      icon={<Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: SUCCESS, animation: "livePulse 1.5s infinite", "@keyframes livePulse": { "0%,100%": { opacity: 1 }, "50%": { opacity: 0.3 } } }} />}
                      label="On Duty"
                      size="small"
                      sx={{ bgcolor: alpha(SUCCESS, 0.12), color: SUCCESS, fontWeight: 800, fontSize: "0.72rem", height: 26, px: 0.5, border: `1px solid ${alpha(SUCCESS, 0.25)}` }}
                    />
                  ) : (
                    <Chip
                      icon={<LocationOff sx={{ fontSize: "13px !important", color: "#ef4444 !important" }} />}
                      label="Location Off"
                      size="small"
                      sx={{ bgcolor: "rgba(239, 68, 68, 0.12)", color: "#ef4444", fontWeight: 800, fontSize: "0.72rem", height: 26, px: 0.5, border: "1px solid rgba(239, 68, 68, 0.25)" }}
                    />
                  )}

                  {/* Live Location Button */}
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={locating ? <CircularProgress size={14} sx={{ color: "#fff" }} /> : <GpsFixed sx={{ fontSize: 15 }} />}
                    onClick={handleLocateMe}
                    sx={{
                      bgcolor: PRIMARY,
                      color: "#fff",
                      fontWeight: 800,
                      fontSize: "0.78rem",
                      textTransform: "none",
                      borderRadius: "12px",
                      px: 2,
                      py: 0.6,
                      boxShadow: "0 4px 14px rgba(37, 99, 235, 0.3)",
                      "&:hover": {
                        bgcolor: "#1d4ed8",
                        boxShadow: "0 6px 18px rgba(37, 99, 235, 0.4)",
                        transform: "translateY(-1px)",
                      },
                      transition: "all 0.2s ease",
                    }}
                  >
                    Live Location
                  </Button>
                </Box>
              </Box>

              {/* Address card */}
              <Box sx={{
                bgcolor: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc",
                borderRadius: "14px",
                p: 2,
                border: `1px solid ${dividerBorder}`,
              }}>
                <Typography sx={{ fontSize: "0.88rem", fontWeight: 700, color: textTitle, lineHeight: 1.5, mb: 1 }}>
                  {currentLocation?.accuracy ? "📡" : "📍"} {resolvedAddress || currentLocation?.address || (typeof punchInLocation?.address === "string" ? punchInLocation.address : punchInLocation?.address?.full || punchInLocation?.address?.short) || visibleVisits[0]?.address || "Location coordinates active"}
                </Typography>

                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
                  {/* Coords + status row */}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                    <Typography sx={{ fontSize: "0.78rem", color: PRIMARY, fontFamily: "monospace", fontWeight: 700, bgcolor: alpha(PRIMARY, 0.08), px: 1.2, py: 0.3, borderRadius: "6px" }}>
                      {Number(currentLocation?.lat || punchInLocation?.lat || visibleVisits[0]?.coordinates?.lat || 20.29044).toFixed(5)},{" "}
                      {Number(currentLocation?.lng || punchInLocation?.lng || visibleVisits[0]?.coordinates?.lng || 85.86197).toFixed(5)}
                    </Typography>

                    {/* Show live badge when current location was freshly fetched */}
                    {currentLocation?.accuracy ? (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <Box sx={{
                          display: "inline-flex", alignItems: "center", gap: 0.5,
                          bgcolor: alpha("#22c55e", 0.12), border: "1px solid",
                          borderColor: alpha("#22c55e", 0.3), borderRadius: "6px",
                          px: 0.9, py: 0.25,
                        }}>
                          <Box sx={{
                            width: 6, height: 6, borderRadius: "50%", bgcolor: "#22c55e",
                            animation: "livePulse 1.5s ease-in-out infinite",
                            "@keyframes livePulse": { "0%,100%": { opacity: 1 }, "50%": { opacity: 0.3 } },
                          }} />
                          <Typography sx={{ fontSize: "0.68rem", fontWeight: 800, color: "#16a34a" }}>Live · Now</Typography>
                        </Box>
                        <Typography sx={{ fontSize: "0.68rem", color: textSub, fontWeight: 600 }}>
                          ±{Math.round(currentLocation.accuracy)}m
                        </Typography>
                      </Box>
                    ) : (currentLocation?.time || currentLocation?.recordedAt || punchInLocation?.time) ? (
                      <Typography sx={{ fontSize: "0.75rem", color: textSub, fontWeight: 600 }}>
                        Recorded {fmt(currentLocation?.time || currentLocation?.recordedAt || punchInLocation?.time)}
                      </Typography>
                    ) : null}
                  </Box>

                  <Button
                    component="a"
                    href={`https://www.google.com/maps/search/?api=1&query=${currentLocation?.lat || punchInLocation?.lat || 20.29044},${currentLocation?.lng || punchInLocation?.lng || 85.86197}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    endIcon={<OpenInNew sx={{ fontSize: 13 }} />}
                    sx={{ fontSize: "0.75rem", color: PRIMARY, fontWeight: 700, textTransform: "none", p: 0, minWidth: 0, "&:hover": { bgcolor: "transparent", textDecoration: "underline" } }}
                  >
                    Open Google Maps
                  </Button>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* ── RIGHT — Visit & Trip Timeline ── */}
          <Box sx={{
            bgcolor: cardBg, borderRadius: "20px", border: `1px solid ${cardBorder}`,
            boxShadow: "0 8px 32px rgba(0,0,0,0.05)", overflow: "hidden",
            display: "flex", flexDirection: "column",
            position: { lg: "sticky" }, top: { lg: 16 },
            maxHeight: "calc(100vh - 110px)",
          }}>
            {/* Header */}
            <Box sx={{ px: 3, pt: 2.5, pb: 1.5, borderBottom: `1px solid ${dividerBorder}` }}>
              <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 0.5 }}>
                <Typography sx={{ fontWeight: 700, fontSize: "1rem", color: textTitle }}>
                  {activeRightTab === "trips" ? "Vehicle Trips" : "Visit Timeline"}
                </Typography>
                <Tooltip title="Refresh">
                  <IconButton size="small" onClick={handleRefresh}
                    sx={{ color: "#94a3b8", "&:hover": { color: PRIMARY, bgcolor: alpha(PRIMARY, 0.06) } }}>
                    <Refresh sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              </Box>

              {!loading && displayDistanceKm >= 0.005 && (
                <Chip
                  icon={<Route sx={{ fontSize: "13px !important" }} />}
                  label={`${displayDistanceKm.toFixed(2)} km travelled`}
                  size="small"
                  sx={{ mb: 0.75, bgcolor: alpha(PRIMARY, 0.08), color: PRIMARY, fontWeight: 700, fontSize: "0.7rem", height: 22, "& .MuiChip-icon": { color: PRIMARY } }}
                />
              )}

              {updatedLabel && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.4, mb: 1 }}>
                  <AccessTime sx={{ fontSize: 12, color: "#94a3b8" }} />
                  <Typography sx={{ fontSize: "0.7rem", color: "#94a3b8" }}>Updated {updatedLabel}</Typography>
                </Box>
              )}

              {/* Tabs Switcher: Visits & Stays vs Vehicle Trips */}
              <Box sx={{ display: "flex", gap: 1, mt: 1, bgcolor: isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9", p: "4px", borderRadius: "10px" }}>
                <Button
                  size="small"
                  onClick={() => setActiveRightTab("timeline")}
                  startIcon={<Store sx={{ fontSize: 15 }} />}
                  sx={{
                    flex: 1,
                    textTransform: "none",
                    fontWeight: activeRightTab === "timeline" ? 800 : 600,
                    fontSize: "0.75rem",
                    py: 0.6,
                    borderRadius: "8px",
                    bgcolor: activeRightTab === "timeline" ? (isDark ? "rgba(255,255,255,0.14)" : "#ffffff") : "transparent",
                    color: activeRightTab === "timeline" ? (isDark ? "#ffffff" : PRIMARY) : (isDark ? "#94a3b8" : "#64748b"),
                    boxShadow: activeRightTab === "timeline" ? (isDark ? "0 2px 8px rgba(0,0,0,0.4)" : "0 2px 6px rgba(0,0,0,0.08)") : "none",
                    "&:hover": { bgcolor: activeRightTab === "timeline" ? (isDark ? "rgba(255,255,255,0.18)" : "#ffffff") : (isDark ? "rgba(255,255,255,0.05)" : alpha(PRIMARY, 0.04)) },
                  }}
                >
                  Visits & Stays ({visibleVisits.length + stayedLocations.length})
                </Button>

                <Button
                  size="small"
                  onClick={() => setActiveRightTab("trips")}
                  startIcon={<DirectionsCar sx={{ fontSize: 15 }} />}
                  sx={{
                    flex: 1,
                    textTransform: "none",
                    fontWeight: activeRightTab === "trips" ? 800 : 600,
                    fontSize: "0.75rem",
                    py: 0.6,
                    borderRadius: "8px",
                    bgcolor: activeRightTab === "trips" ? (isDark ? "rgba(255,255,255,0.14)" : "#ffffff") : "transparent",
                    color: activeRightTab === "trips" ? (isDark ? "#ffffff" : PRIMARY) : (isDark ? "#94a3b8" : "#64748b"),
                    boxShadow: activeRightTab === "trips" ? (isDark ? "0 2px 8px rgba(0,0,0,0.4)" : "0 2px 6px rgba(0,0,0,0.08)") : "none",
                    "&:hover": { bgcolor: activeRightTab === "trips" ? (isDark ? "rgba(255,255,255,0.18)" : "#ffffff") : (isDark ? "rgba(255,255,255,0.05)" : alpha(PRIMARY, 0.04)) },
                  }}
                >
                  Trips ({trips.length})
                </Button>
              </Box>
            </Box>

            {/* Filter / Sub-header bar */}
            <Box sx={{ px: 3, py: 1.25, borderBottom: `1px solid ${dividerBorder}`, bgcolor: barBg, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CalendarToday sx={{ fontSize: 13, color: PRIMARY }} />
                <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, color: PRIMARY }}>
                  {filters.dateRange === "today" ? "Today"
                    : filters.dateRange === "yesterday" ? "Yesterday"
                      : filters.dateRange === "week" ? "This Week"
                        : filters.dateRange === "month" ? "This Month"
                          : filters.dateRange?.match(/^\d{4}-\d{2}-\d{2}$/)
                            ? new Date(filters.dateRange).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                            : filters.dateRange}
                </Typography>

                {activeRightTab === "timeline" ? (
                  <Typography sx={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                    · {loading ? "…" : `${visibleVisits.length} visit${visibleVisits.length !== 1 ? "s" : ""}`}
                    {stayedLocations.length > 0 ? ` · ${stayedLocations.length} stayed` : ""}
                  </Typography>
                ) : (
                  <Typography sx={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                    · {tripsLoading ? "…" : `${trips.length} trip${trips.length !== 1 ? "s" : ""}`}
                  </Typography>
                )}
              </Box>

              {activeRightTab === "timeline" && (
                <Badge badgeContent={filters.statuses?.length || 0} color="primary"
                  sx={{ "& .MuiBadge-badge": { fontSize: "0.6rem", height: 16, minWidth: 16 } }}>
                  <Box onClick={() => setFilterOpen(true)} sx={{ display: "flex", alignItems: "center", gap: 0.5, cursor: "pointer", px: 1, py: 0.4, borderRadius: "6px", "&:hover": { bgcolor: alpha(PRIMARY, 0.06) } }}>
                    <FilterList sx={{ fontSize: 15, color: PRIMARY }} />
                    <Typography sx={{ fontSize: "0.72rem", fontWeight: 600, color: PRIMARY }}>Filter</Typography>
                  </Box>
                </Badge>
              )}
            </Box>

            {/* Scrollable Content Area */}
            <Box sx={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", "&::-webkit-scrollbar": { width: 4 }, "&::-webkit-scrollbar-track": { bgcolor: "#f8fafc" }, "&::-webkit-scrollbar-thumb": { bgcolor: "#e2e8f0", borderRadius: 2 } }}>
              {activeRightTab === "trips" ? (
                /* ── VEHICLE TRIPS TAB ── */
                tripsLoading ? (
                  <Box sx={{ p: 3 }}>
                    {[1, 2, 3].map(i => (
                      <Box key={i} sx={{ p: 2, mb: 2, borderRadius: "14px", border: "1px solid #e2e8f0" }}>
                        <Skeleton width="40%" height={24} />
                        <Skeleton width="90%" height={16} sx={{ mt: 1 }} />
                        <Skeleton width="75%" height={16} sx={{ mt: 0.5 }} />
                        <Skeleton variant="rounded" width="100%" height={32} sx={{ mt: 1.5 }} />
                      </Box>
                    ))}
                  </Box>
                ) : trips.length === 0 ? (
                  <Box sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", p: 4, minHeight: 250, textAlign: "center" }}>
                    <Box sx={{ width: 56, height: 56, borderRadius: "50%", bgcolor: isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", mb: 2 }}>
                      <DirectionsCar sx={{ fontSize: 28, color: "#94a3b8" }} />
                    </Box>
                    <Typography sx={{ fontWeight: 700, color: textTitle, fontSize: "0.95rem", mb: 0.5 }}>
                      No Vehicle Trips Recorded
                    </Typography>
                    <Typography sx={{ color: "#64748b", fontSize: "0.78rem", maxWidth: 260, lineHeight: 1.5 }}>
                      Trips started or ended by this member with start/end odometer and locations will appear here.
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ p: 2.5 }}>
                    {trips.map((t, idx) => (
                      <TripTimelineCard
                        key={t._id || t.id || idx}
                        trip={t}
                        index={idx}
                        onDeleteTrip={handleDeleteTrip}
                        onPreviewImage={(url, title) => setPreviewOdoImg({ url, title })}
                      />
                    ))}
                  </Box>
                )
              ) : (
                /* ── VISITS & TIMELINE TAB ── */
                loading ? (
                  <Box sx={{ p: 3 }}>
                    {[1, 2, 3].map(i => (
                      <Box key={i} sx={{ display: "flex", gap: 2, mb: 3 }}>
                        <Skeleton variant="circular" width={38} height={38} sx={{ flexShrink: 0 }} />
                        <Box sx={{ flex: 1 }}>
                          <Skeleton width="55%" height={20} />
                          <Skeleton width="80%" height={14} sx={{ mt: 0.5 }} />
                          <Skeleton width="40%" height={14} sx={{ mt: 0.5 }} />
                          <Skeleton variant="rounded" width="100%" height={40} sx={{ mt: 1 }} />
                        </Box>
                      </Box>
                    ))}
                  </Box>
                ) : visibleVisits.length === 0 && stayedLocations.length === 0 ? (
                  <Box sx={{ flex: 1, display: "flex", flexDirection: "column", p: 3 }}>
                    {isPunchedIn && !hasPunchedOut ? (
                      <>
                        <Box sx={{ display: "flex", gap: 2 }}>
                          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                            <Box
                              onClick={handlePunchInFocus}
                              sx={{ width: 40, height: 40, borderRadius: "50%", bgcolor: SUCCESS, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 0 4px ${alpha(SUCCESS, 0.2)}`, animation: "pl 1.5s ease-in-out infinite", "@keyframes pl": { "0%,100%": { opacity: 1 }, "50%": { opacity: 0.6 } }, cursor: "pointer", transition: "transform 0.15s", "&:hover": { transform: "scale(1.12)" } }}
                            >
                              <MyLocation sx={{ fontSize: 18, color: "#fff" }} />
                            </Box>
                          </Box>
                          <Box sx={{ flex: 1, minWidth: 0, pt: 0.5 }}>
                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.4 }}>
                              <Typography sx={{ fontWeight: 700, color: "#0f172a", fontSize: "0.88rem" }}>Punched In</Typography>
                              {punchInLocation?.time && <Typography sx={{ fontSize: "0.72rem", fontWeight: 600, color: "#94a3b8" }}>{fmt(punchInLocation.time)}</Typography>}
                            </Box>
                            {timelineBatteryInfo.percentage !== null && (
                              <Box sx={{ mb: 0.8 }}>
                                <Chip
                                  size="small"
                                  label={`${timelineBatteryChip.label}${timelineBatteryInfo.isCharging ? " • Charging" : ""}`}
                                  sx={{ bgcolor: timelineBatteryChip.bg, color: timelineBatteryChip.color, fontWeight: 700, border: `1px solid ${timelineBatteryChip.border}`, height: 24 }}
                                />
                              </Box>
                            )}
                            {/* Address (prefer resolved geocoded address, fallback to punchInLocation.address, then coords) */}
                            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.4, mb: 0.5 }}>
                              <LocationOn sx={{ fontSize: 12, color: "#94a3b8", mt: "2px", flexShrink: 0 }} />
                              <Typography sx={{ fontSize: "0.75rem", color: "#64748b", lineHeight: 1.5 }}>
                                {resolvedAddress ||
                                  (!isRawCoordinateValue(punchInLocation?.address) ? (typeof punchInLocation?.address === "string" ? punchInLocation.address : punchInLocation?.address?.full || punchInLocation?.address?.short) : null) ||
                                  (punchInLocation?.lat ? "Locating address…" : "Location not available")}
                              </Typography>
                            </Box>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
                              <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: SUCCESS, animation: "dp 1.5s ease-in-out infinite", "@keyframes dp": { "0%,100%": { opacity: 1 }, "50%": { opacity: 0.3 } } }} />
                              <Typography sx={{ fontSize: "0.7rem", color: SUCCESS, fontWeight: 600 }}>On Duty · No visits yet today</Typography>
                            </Box>
                          </Box>
                        </Box>

                        {/* Active Navigation Trip Card (Origin A -> Destination B) */}
                        <ActiveTripCard trip={activeTrip} resolvedAddress={resolvedAddress} isDark={isDark} />
                      </>
                    ) : (
                      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, minHeight: 200 }}>
                        <Box sx={{ width: 48, height: 48, borderRadius: "50%", bgcolor: isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", mb: 1.5 }}>
                          <MyLocation sx={{ fontSize: 22, color: "#cbd5e1" }} />
                        </Box>
                        <Typography sx={{ fontWeight: 600, color: textSub, fontSize: "0.88rem", mb: 0.4 }}>Not Punched In</Typography>
                        <Typography sx={{ color: "#cbd5e1", fontSize: "0.75rem", textAlign: "center" }}>Punch in to start tracking visits</Typography>
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Box sx={{ p: 3 }}>

                    {/* ── Active Navigation Trip Card ── */}
                    <ActiveTripCard trip={activeTrip} resolvedAddress={resolvedAddress} isDark={isDark} />

                    {/* ── Punch In header ── */}
                    {punchInLocation?.address && (
                      <Box sx={{ mb: 0 }}>
                        <Box sx={{ display: "flex", gap: 2 }}>
                          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                            <Box
                              onClick={handlePunchInFocus}
                              sx={{ width: 40, height: 40, borderRadius: "50%", bgcolor: SUCCESS, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 2px 8px ${alpha(SUCCESS, 0.3)}`, cursor: "pointer", transition: "transform 0.15s", "&:hover": { transform: "scale(1.12)" } }}
                            >
                              <MyLocation sx={{ fontSize: 18, color: "#fff" }} />
                            </Box>
                          </Box>
                          <Box sx={{ flex: 1, minWidth: 0, pt: 0.5, pb: 0.5 }}>
                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.4 }}>
                              <Typography sx={{ fontWeight: 700, color: "#0f172a", fontSize: "0.88rem" }}>Punched In</Typography>
                              {punchInLocation.time && <Typography sx={{ fontSize: "0.72rem", fontWeight: 600, color: "#94a3b8" }}>{fmt(punchInLocation.time)}</Typography>}
                            </Box>
                            {timelineBatteryInfo.percentage !== null && (
                              <Box sx={{ mb: 0.8 }}>
                                <Chip
                                  size="small"
                                  label={`${timelineBatteryChip.label}${timelineBatteryInfo.isCharging ? " • Charging" : ""}`}
                                  sx={{ bgcolor: timelineBatteryChip.bg, color: timelineBatteryChip.color, fontWeight: 700, border: `1px solid ${timelineBatteryChip.border}`, height: 24 }}
                                />
                              </Box>
                            )}
                            {/* Address (prefer resolved geocoded address, fallback to punchInLocation.address, then coords) */}
                            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.4, mb: 0.5 }}>
                              <LocationOn sx={{ fontSize: 12, color: "#94a3b8", mt: "2px", flexShrink: 0 }} />
                              <Typography sx={{ fontSize: "0.75rem", color: "#64748b", lineHeight: 1.5 }}>
                                {resolvedAddress ||
                                  (!isRawCoordinateValue(punchInLocation?.address) ? (typeof punchInLocation?.address === "string" ? punchInLocation.address : punchInLocation?.address?.full || punchInLocation?.address?.short) : null) ||
                                  (punchInLocation?.lat ? "Locating address…" : "Location not available")}
                              </Typography>
                            </Box>
                            {timelineBatteryInfo.percentage !== null && (
                              <Box sx={{ mt: 0.5 }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={timelineBatteryInfo.percentage}
                                  sx={{
                                    height: 4,
                                    borderRadius: 2,
                                    bgcolor: isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0",
                                    "& .MuiLinearProgress-bar": {
                                      bgcolor: timelineBatteryChip.color,
                                      borderRadius: 2,
                                    },
                                  }}
                                />
                              </Box>
                            )}
                          </Box>
                        </Box>
                      </Box>
                    )}

                    {/* ── Stays card (if any stayed locations) ── */}
                    {stayedLocations.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                          <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: textSub, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                            Stayed Locations
                          </Typography>
                          <Chip
                            size="small"
                            label={`${stayedLocations.length}`}
                            sx={{ height: 18, bgcolor: alpha(WARNING, 0.12), color: WARNING, fontSize: "0.62rem", fontWeight: 800 }}
                          />
                        </Box>
                        {stayedLocations.map((stay, index) => (
                          <StayedLocationCard
                            key={`${stay.lat || "stay"}-${stay.lng || index}-${stay.lastEndTime || index}`}
                            stay={stay}
                          />
                        ))}
                      </Box>
                    )}

                    {/* ── Visit cards with route connectors between them ── */}
                    {sortedVisits.map((v, i) => (
                      <Box key={v._id || i}>
                        <VisitCard
                          visit={v}
                          index={i}
                          isLast={i === sortedVisits.length - 1 && !hasPunchedOut}
                          fixedBatteryInfo={timelineBatteryInfo}
                          fixedBatteryChip={timelineBatteryChip}
                        />
                        {/* Route connector AFTER this visit, pointing to next visit */}
                        {i < sortedVisits.length - 1 && sortedVisits[i + 1]?.distanceFromPreviousKm > 0 && (
                          <RouteConnector visit={sortedVisits[i + 1]} />
                        )}
                      </Box>
                    ))}

                    {hasPunchedOut && punchOutLocation?.time && (
                      <Box sx={{ display: "flex", gap: 2, mt: 0 }}>
                        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                          <Box sx={{ width: 40, height: 40, borderRadius: "50%", bgcolor: WARNING, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 2px 8px ${alpha(WARNING, 0.3)}` }}>
                            <MyLocation sx={{ fontSize: 18, color: "#fff" }} />
                          </Box>
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0, pt: 0.5 }}>
                          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.4 }}>
                            <Typography sx={{ fontWeight: 700, color: "#0f172a", fontSize: "0.88rem" }}>Punched Out</Typography>
                            <Typography sx={{ fontSize: "0.72rem", fontWeight: 600, color: "#94a3b8" }}>{fmt(punchOutLocation.time)}</Typography>
                          </Box>
                          {timelineBatteryInfo.percentage !== null && (
                            <Box sx={{ mb: 0.8 }}>
                              <Chip
                                size="small"
                                label={`${timelineBatteryChip.label}${timelineBatteryInfo.isCharging ? " • Charging" : ""}`}
                                sx={{ bgcolor: timelineBatteryChip.bg, color: timelineBatteryChip.color, fontWeight: 700, border: `1px solid ${timelineBatteryChip.border}`, height: 24 }}
                              />
                            </Box>
                          )}
                          {punchOutLocation?.address && (
                            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.4 }}>
                              <LocationOn sx={{ fontSize: 12, color: WARNING, mt: "2px", flexShrink: 0 }} />
                              <Typography sx={{ fontSize: "0.75rem", color: "#475569", lineHeight: 1.5 }}>
                                {typeof punchOutLocation.address === "string" ? punchOutLocation.address : punchOutLocation.address?.full || punchOutLocation.address?.short || ""}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </Box>
                    )}
                  </Box>
                )
              )}
            </Box>

            {/* Load more (only for Visits tab) */}
            {activeRightTab === "timeline" && (hInchargeore || loadingMore) && (
              <Box sx={{ px: 3, py: 2, borderTop: "1px solid #f1f5f9", textAlign: "center" }}>
                <Button size="small" disabled={loadingMore}
                  startIcon={loadingMore ? <CircularProgress size={12} /> : null}
                  onClick={() => { const n = page + 1; setPage(n); fetchVisits(n, true); }}
                  sx={{ color: PRIMARY, fontWeight: 600, fontSize: "0.78rem", textTransform: "none" }}>
                  {loadingMore ? "Loading…" : "Load earlier visits"}
                </Button>
              </Box>
            )}
          </Box>
        </Box>
        {/* Full-Screen Odometer Image Preview Modal */}
        {previewOdoImg && (
          <Box
            onClick={() => setPreviewOdoImg(null)}
            sx={{
              position: "fixed",
              inset: 0,
              zIndex: 99999,
              bgcolor: "rgba(15, 23, 42, 0.94)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "zoom-out",
              p: { xs: 1.5, sm: 3 },
            }}
          >
            <Box
              sx={{
                position: "absolute",
                top: 20,
                right: 20,
                width: 42,
                height: 42,
                borderRadius: "50%",
                bgcolor: "rgba(255,255,255,0.18)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.2s",
                "&:hover": { bgcolor: "rgba(255,255,255,0.32)", transform: "scale(1.08)" },
              }}
            >
              <Close sx={{ color: "#fff", fontSize: 24 }} />
            </Box>

            <Box
              sx={{
                position: "absolute",
                top: 20,
                left: 20,
                bgcolor: "rgba(0,0,0,0.65)",
                borderRadius: "10px",
                px: 2,
                py: 1,
                border: "1px solid rgba(255,255,255,0.15)",
                display: "flex",
                alignItems: "center",
                gap: 1
              }}
            >
              <PhotoCamera sx={{ color: "#38bdf8", fontSize: 18 }} />
              <Typography sx={{ color: "#fff", fontSize: "0.92rem", fontWeight: 700 }}>
                {previewOdoImg.title || "Odometer Photo"}
              </Typography>
            </Box>

            <Box
              component="img"
              src={previewOdoImg.url}
              alt="Odometer Preview"
              onClick={(e) => e.stopPropagation()}
              sx={{
                maxWidth: "92vw",
                maxHeight: "88vh",
                borderRadius: "16px",
                objectFit: "contain",
                boxShadow: "0 16px 48px rgba(0,0,0,0.65)",
                border: "2px solid rgba(255,255,255,0.12)",
              }}
            />
          </Box>
        )}
      </Box>
    </Box>
  );

}
