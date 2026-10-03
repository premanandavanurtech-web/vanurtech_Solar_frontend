import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  Alert,
  Box,
  Button,
  ButtonBase,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Slider,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
  alpha,
  Snackbar,
  useTheme,
} from "@mui/material";
import {
  Add,
  AccessTime,
  ArrowBack,
  Bolt,
  CalendarToday,
  CameraAlt,
  CheckCircle,
  Clear,
  Close,
  ContentCopy,
  Delete,
  Edit,
  NightsStay,
  HomeWork,
  OpenInNew,
  Pause,
  Place,
  PlayArrow,
  RestartAlt,
  Save,
  Search,
  Share,
  Speed as SpeedIcon,
  ViewInAr,
  WbSunny,
  WbTwilight,
  WhatsApp,
  ZoomIn,
  ZoomOut,
} from "@mui/icons-material";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import * as THREE from "../vendor/three.module.js";

const GOOGLE_MAPS_KEY =
  process.env.REACT_APP_GOOGLE_MAPS_API_KEY ||
  "AIzaSyDQYrvUxQPWUrpqWIy-tLg4f3DGrr4GTlg";
const PUBLIC_APP_URL = (process.env.REACT_APP_PUBLIC_APP_URL || "https://vanurtech-solar-frontend.vercel.app").replace(/\/+$/, "");

const MAP_LIBRARIES = ["places"];
const DEFAULT_CENTER = { lat: 20.2961, lng: 85.8245 };
const PRIMARY = "#3566bb";
const ACCENT = "#0f9f6e";
const WARNING = "#f59e0b";
const STATIC_MAP_ZOOM = 19;
const STATIC_MAP_SIZE = 640;
const DESIGN_STORAGE_KEY = "solar360-3d-design";
const DESIGN_LEAD_STORAGE_KEY = "solar360-3d-design-lead";
const MIN_ROOF_POINTS = 3;
const MAX_ROOF_POINTS = 24;
const MIN_ROOF_POINT_SPACING_METERS = 0.25;
const MAX_SOLAR_PANELS = 24;
const EMPTY_CONTEXT_BUILDINGS = Object.freeze([]);
const ENABLE_3D_SHADOWS = false;
const SOLAR_STRUCTURE_TYPES = [
  { value: "rcc_rooftop", label: "RCC Rooftop" },
  { value: "metal_sheet_roof", label: "Metal Sheet Roof" },
  { value: "ground_mount", label: "Ground Mount" },
  { value: "elevated_structure", label: "Elevated Structure" },
  { value: "carport_pergola", label: "Carport / Pergola" },
  { value: "tin_shed", label: "Tin Shed" },
  { value: "single_axis_tracker", label: "Single-Axis Tracker" },
  { value: "dual_axis_tracker", label: "Dual-Axis Tracker" },
];
const SOLAR_STRUCTURE_VALUES = new Set(SOLAR_STRUCTURE_TYPES.map((type) => type.value));
const DEFAULT_ELEVATED_STRUCTURE_SETTINGS = {
  tiltAngle: 25,
  panelRows: 2,
  panelColumns: 3,
  structureHeight: 2.5,
};
const DEFAULT_SINGLE_AXIS_TRACKER_SETTINGS = {
  tiltAngle: 30,
  panelRows: 5,
  panelColumns: 2,
  structureHeight: 2.5,
};
const MAX_SOLAR_PANEL_ROWS = 5;
const MAX_SOLAR_PANEL_COLUMNS = 6;
const ENVIRONMENT_MODES = {
  day: {
    label: "Day",
    Icon: WbSunny,
    skyColor: 0xcfe3f8,
    surfaceColor: "#dce8f4",
    groundColor: 0xd7e3ee,
    satelliteTint: 0xffffff,
    hemiSkyColor: 0xffffff,
    hemiGroundColor: 0xd7e3f4,
    hemiIntensity: 2.4,
    sunColor: 0xffffff,
    sunIntensity: 3.8,
    inactiveSunIntensity: 2.2,
    shadowOpacity: 0.62,
    borderColor: 0xa7b5c8,
    buttonColor: "#fbbf24",
    buttonBg: "rgba(75, 58, 18, 0.72)",
  },
  dusk: {
    label: "Dusk",
    Icon: WbTwilight,
    skyColor: 0x1b1726,
    surfaceColor: "#14111f",
    groundColor: 0x8b5a33,
    satelliteTint: 0xe0a071,
    hemiSkyColor: 0xffb86a,
    hemiGroundColor: 0x3d2438,
    hemiIntensity: 1.15,
    sunColor: 0xffa24a,
    sunIntensity: 2.35,
    inactiveSunIntensity: 1.25,
    shadowOpacity: 0.78,
    borderColor: 0x9c6b4a,
    buttonColor: "#fb8c5a",
    buttonBg: "rgba(76, 32, 28, 0.72)",
  },
  night: {
    label: "Night",
    Icon: NightsStay,
    skyColor: 0x070b18,
    surfaceColor: "#070b18",
    groundColor: 0x172235,
    satelliteTint: 0x3b4a72,
    hemiSkyColor: 0x8fa8ff,
    hemiGroundColor: 0x07101d,
    hemiIntensity: 0.42,
    sunColor: 0x9fb7ff,
    sunIntensity: 0.55,
    inactiveSunIntensity: 0.35,
    shadowOpacity: 0.28,
    borderColor: 0x334155,
    buttonColor: "#a7b7ff",
    buttonBg: "rgba(22, 35, 90, 0.72)",
  },
};
const ENVIRONMENT_MODE_OPTIONS = ["day", "dusk", "night"];
const SUN_TIME_MIN = 0;
const SUN_TIME_MAX = 23 * 60 + 45;
const SUN_SPEED_OPTIONS = [15, 30, 60, 120];
const SUN_SPEED_VALUES = new Set(SUN_SPEED_OPTIONS);
const SUN_MONTHS = [
  { label: "Jan", days: 31 },
  { label: "Feb", days: 28 },
  { label: "Mar", days: 31 },
  { label: "Apr", days: 30 },
  { label: "May", days: 31 },
  { label: "Jun", days: 30 },
  { label: "Jul", days: 31 },
  { label: "Aug", days: 31 },
  { label: "Sep", days: 30 },
  { label: "Oct", days: 31 },
  { label: "Nov", days: 30 },
  { label: "Dec", days: 31 },
];
const DEFAULT_SUN_SETTINGS = {
  dayOfYear: 121,
  timeMinutes: 13 * 60 + 45,
  speed: 60,
  shadowsEnabled: true,
};
const DEFAULT_SOLAR_LAYOUT = {
  count: 0,
  xRatio: 0.22,
  zRatio: 0.24,
  structureType: "rcc_rooftop",
  selectedPanelIndex: -1,
  panelPositions: [],
  panelStructureTypes: [],
  elevatedSettings: DEFAULT_ELEVATED_STRUCTURE_SETTINGS,
};
const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const getApproxPointDistanceMeters = (a, b) => {
  if (!a || !b) return Number.POSITIVE_INFINITY;
  const averageLatitude = ((Number(a.lat) + Number(b.lat)) / 2) * (Math.PI / 180);
  const latMeters = (Number(a.lat) - Number(b.lat)) * 111320;
  const lngMeters =
    (Number(a.lng) - Number(b.lng)) * 111320 * Math.cos(averageLatitude);
  return Math.hypot(latMeters, lngMeters);
};

const sanitizeRoofPoints = (points = []) =>
  Array.isArray(points)
    ? points
        .slice(0, MAX_ROOF_POINTS)
        .map((point) => ({
          lat: Number(point?.lat),
          lng: Number(point?.lng),
        }))
        .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng))
        .filter(
          (point, index, safePoints) =>
            safePoints.findIndex(
              (candidate) =>
                getApproxPointDistanceMeters(point, candidate) <
                MIN_ROOF_POINT_SPACING_METERS
            ) === index
        )
    : [];

const canGenerateRoofModel = (points = []) =>
  sanitizeRoofPoints(points).length >= MIN_ROOF_POINTS;

const getEnvironmentMode = (mode) =>
  Object.prototype.hasOwnProperty.call(ENVIRONMENT_MODES, mode) ? mode : "day";

const getEnvironmentPreset = (mode) => ENVIRONMENT_MODES[getEnvironmentMode(mode)];

const SHARE_DATA_PARAM = "d";
const SHARE_ROUTE = "/s";

const roundShareNumber = (value, decimals = 3) => {
  const number = Number(value);
  return Number.isFinite(number) ? Number(number.toFixed(decimals)) : 0;
};

const getStructureCode = (type) => {
  const index = SOLAR_STRUCTURE_TYPES.findIndex((option) => option.value === type);
  return index >= 0 ? index : 0;
};

const getStructureFromCode = (code) => {
  const index = clamp(Math.round(Number(code) || 0), 0, SOLAR_STRUCTURE_TYPES.length - 1);
  return SOLAR_STRUCTURE_TYPES[index]?.value || DEFAULT_SOLAR_LAYOUT.structureType;
};

const getEnvironmentCode = (mode) => {
  const index = ENVIRONMENT_MODE_OPTIONS.indexOf(getEnvironmentMode(mode));
  return index >= 0 ? index : 0;
};

const getEnvironmentFromCode = (code) => {
  const index = clamp(Math.round(Number(code) || 0), 0, ENVIRONMENT_MODE_OPTIONS.length - 1);
  return ENVIRONMENT_MODE_OPTIONS[index] || "day";
};

const compactSharePayload = (payload = {}) => {
  const points = sanitizeRoofPoints(payload.points).map((point) => [
    roundShareNumber(point.lat, 6),
    roundShareNumber(point.lng, 6),
  ]);
  const layout = sanitizeSolarLayout(payload.solarLayout);
  const elevatedSettings = sanitizeElevatedStructureSettings(layout.elevatedSettings);
  const sunSettings = sanitizeSunSettings(payload.sunSettings || DEFAULT_SUN_SETTINGS);
  const compactLayout = {
    c: layout.count,
    x: roundShareNumber(layout.xRatio),
    z: roundShareNumber(layout.zRatio),
    t: getStructureCode(layout.structureType),
    h: [
      elevatedSettings.tiltAngle,
      elevatedSettings.panelRows,
      elevatedSettings.panelColumns,
      elevatedSettings.structureHeight,
    ],
  };
  if (layout.selectedPanelIndex >= 0) compactLayout.i = layout.selectedPanelIndex;
  if (layout.panelPositions.some(Boolean)) {
    compactLayout.p = layout.panelPositions.map((position) =>
      position ? [roundShareNumber(position.xRatio), roundShareNumber(position.zRatio)] : null
    );
  }
  if (layout.panelStructureTypes.some(Boolean)) {
    compactLayout.q = layout.panelStructureTypes.map((type) =>
      type ? getStructureCode(type) : null
    );
  }

  return {
    v: 2,
    p: points,
    l: compactLayout,
    s: [
      sunSettings.dayOfYear,
      sunSettings.timeMinutes,
      sunSettings.speed,
      sunSettings.shadowsEnabled ? 1 : 0,
    ],
    e: getEnvironmentCode(payload.environmentMode),
  };
};

const expandSharePayload = (payload) => {
  if (!payload || payload.v !== 2 || !Array.isArray(payload.p) || !payload.l) {
    return payload;
  }

  const layout = payload.l || {};
  const elevatedSettings = Array.isArray(layout.h)
    ? {
        tiltAngle: layout.h[0],
        panelRows: layout.h[1],
        panelColumns: layout.h[2],
        structureHeight: layout.h[3],
      }
    : DEFAULT_ELEVATED_STRUCTURE_SETTINGS;

  return {
    v: payload.v,
    points: payload.p.map((point) => ({
      lat: Number(point?.[0]),
      lng: Number(point?.[1]),
    })),
    satelliteTextureUrl: "",
    solarLayout: {
      count: layout.c,
      xRatio: layout.x,
      zRatio: layout.z,
      structureType: getStructureFromCode(layout.t),
      selectedPanelIndex: layout.i ?? -1,
      panelPositions: Array.isArray(layout.p)
        ? layout.p.map((position) =>
            Array.isArray(position)
              ? { xRatio: Number(position[0]), zRatio: Number(position[1]) }
              : null
          )
        : [],
      panelStructureTypes: Array.isArray(layout.q)
        ? layout.q.map((code) => (code === null || code === undefined ? null : getStructureFromCode(code)))
        : [],
      elevatedSettings,
    },
    sunSettings: Array.isArray(payload.s)
      ? {
          dayOfYear: payload.s[0],
          timeMinutes: payload.s[1],
          speed: payload.s[2],
          shadowsEnabled: payload.s[3] !== 0,
        }
      : DEFAULT_SUN_SETTINGS,
    environmentMode: getEnvironmentFromCode(payload.e),
  };
};

const encodeSharePayload = (payload) => {
  try {
    const bytes = new TextEncoder().encode(JSON.stringify(compactSharePayload(payload)));
    const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
    return window
      .btoa(binary)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");
  } catch {
    return "";
  }
};

const decodeSharePayload = (encoded) => {
  try {
    const base64 = String(encoded || "").replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const binary = window.atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return expandSharePayload(JSON.parse(new TextDecoder().decode(bytes)));
  } catch {
    return null;
  }
};

const sanitizeElevatedStructureSettings = (settings = {}) => {
  const tiltAngle = Number(settings.tiltAngle);
  const panelRows = Number(settings.panelRows);
  const panelColumns = Number(settings.panelColumns);
  const structureHeight = Number(settings.structureHeight);
  const safeColumns = clamp(
    Number.isFinite(panelColumns)
      ? Math.round(panelColumns)
      : DEFAULT_ELEVATED_STRUCTURE_SETTINGS.panelColumns,
    1,
    MAX_SOLAR_PANEL_COLUMNS
  );
  const safeRows = clamp(
    Number.isFinite(panelRows)
      ? Math.round(panelRows)
      : DEFAULT_ELEVATED_STRUCTURE_SETTINGS.panelRows,
    1,
    Math.min(MAX_SOLAR_PANEL_ROWS, Math.floor(MAX_SOLAR_PANELS / safeColumns))
  );

  return {
    tiltAngle: clamp(
      Number.isFinite(tiltAngle)
        ? Math.round(tiltAngle)
        : DEFAULT_ELEVATED_STRUCTURE_SETTINGS.tiltAngle,
      0,
      60
    ),
    panelRows: safeRows,
    panelColumns: safeColumns,
    structureHeight: clamp(
      Number.isFinite(structureHeight)
        ? Math.round(structureHeight * 2) / 2
        : DEFAULT_ELEVATED_STRUCTURE_SETTINGS.structureHeight,
      1,
      5
    ),
  };
};

const sanitizeSunSettings = (settings = {}) => {
  const dayOfYear = Number(settings.dayOfYear);
  const timeMinutes = Number(settings.timeMinutes);
  const speed = Number(settings.speed);

  return {
    dayOfYear: clamp(
      Number.isFinite(dayOfYear) ? Math.round(dayOfYear) : DEFAULT_SUN_SETTINGS.dayOfYear,
      0,
      364
    ),
    timeMinutes: clamp(
      Number.isFinite(timeMinutes) ? Math.round(timeMinutes / 15) * 15 : DEFAULT_SUN_SETTINGS.timeMinutes,
      SUN_TIME_MIN,
      SUN_TIME_MAX
    ),
    speed: SUN_SPEED_VALUES.has(speed) ? speed : DEFAULT_SUN_SETTINGS.speed,
    shadowsEnabled: settings.shadowsEnabled !== false,
  };
};

const formatSunDate = (dayOfYear) => {
  let day = clamp(Math.round(dayOfYear), 0, 364) + 1;
  for (const month of SUN_MONTHS) {
    if (day <= month.days) return `${month.label} ${day}`;
    day -= month.days;
  }
  return "Dec 31";
};

const formatSunTime = (timeMinutes) => {
  const minutes = clamp(Math.round(timeMinutes), SUN_TIME_MIN, SUN_TIME_MAX);
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
};

const getSunPositionInfo = (settings = DEFAULT_SUN_SETTINGS, latitude = DEFAULT_CENTER.lat) => {
  const sunSettings = sanitizeSunSettings(settings);
  const toRad = (value) => (value * Math.PI) / 180;
  const safeLatitude = clamp(Number(latitude) || DEFAULT_CENTER.lat, -66, 66);
  const latRad = toRad(safeLatitude);
  const declinationRad =
    toRad(23.44) * Math.sin(toRad((360 / 365) * (sunSettings.dayOfYear - 80)));
  const solarHour = sunSettings.timeMinutes / 60;
  const hourAngleRad = toRad((solarHour - 12) * 15);
  const sinAltitude =
    Math.sin(latRad) * Math.sin(declinationRad) +
    Math.cos(latRad) * Math.cos(declinationRad) * Math.cos(hourAngleRad);
  const altitudeRad = Math.asin(clamp(sinAltitude, -1, 1));
  const azimuthRad = Math.atan2(
    Math.sin(hourAngleRad),
    Math.cos(hourAngleRad) * Math.sin(latRad) -
      Math.tan(declinationRad) * Math.cos(latRad)
  );

  return {
    altitudeDeg: clamp((altitudeRad * 180) / Math.PI, 0, 90),
    altitudeRad: Math.max(altitudeRad, toRad(4)),
    azimuthRad,
  };
};

const getSunScenePosition = (sunInfo, radius = 58) => {
  const horizontal = Math.cos(sunInfo.altitudeRad);
  return new THREE.Vector3(
    Math.sin(sunInfo.azimuthRad) * horizontal * radius,
    Math.sin(sunInfo.altitudeRad) * radius + 7,
    Math.cos(sunInfo.azimuthRad) * horizontal * radius
  );
};

const sanitizeSolarLayout = (layout = {}) => {
  const count = Number(layout.count);
  const xRatio = Number(layout.xRatio);
  const zRatio = Number(layout.zRatio);
  const selectedPanelIndex = Number(layout.selectedPanelIndex);
  const structureType = SOLAR_STRUCTURE_VALUES.has(layout.structureType)
    ? layout.structureType
    : DEFAULT_SOLAR_LAYOUT.structureType;
  const elevatedSettings = sanitizeElevatedStructureSettings(layout.elevatedSettings);
  const requestedCount = Number.isFinite(count) ? Math.round(count) : DEFAULT_SOLAR_LAYOUT.count;
  const safeCount = clamp(
    structureType === "elevated_structure" && requestedCount > 0
      ? elevatedSettings.panelRows * elevatedSettings.panelColumns
      : requestedCount,
    0,
    MAX_SOLAR_PANELS
  );
  const panelPositions = Array.isArray(layout.panelPositions)
    ? layout.panelPositions.slice(0, safeCount).map((position) => {
        const panelXRatio = Number(position?.xRatio);
        const panelZRatio = Number(position?.zRatio);
        if (!Number.isFinite(panelXRatio) || !Number.isFinite(panelZRatio)) return null;
        return {
          xRatio: clamp(panelXRatio, 0, 1),
          zRatio: clamp(panelZRatio, 0, 1),
        };
      })
    : [];
  const panelStructureTypes = Array.isArray(layout.panelStructureTypes)
    ? layout.panelStructureTypes
        .slice(0, safeCount)
        .map((type) => (SOLAR_STRUCTURE_VALUES.has(type) ? type : null))
    : [];

  while (panelPositions.length < safeCount) panelPositions.push(null);
  while (panelStructureTypes.length < safeCount) panelStructureTypes.push(null);

  return {
    count: safeCount,
    xRatio: clamp(Number.isFinite(xRatio) ? xRatio : DEFAULT_SOLAR_LAYOUT.xRatio, 0, 1),
    zRatio: clamp(Number.isFinite(zRatio) ? zRatio : DEFAULT_SOLAR_LAYOUT.zRatio, 0, 1),
    structureType,
    selectedPanelIndex: clamp(
      Number.isFinite(selectedPanelIndex) ? Math.round(selectedPanelIndex) : -1,
      -1,
      Math.max(-1, safeCount - 1)
    ),
    panelPositions,
    panelStructureTypes,
    elevatedSettings,
  };
};

const distanceMeters = (a, b) => {
  if (!a || !b) return 0;
  const toRad = (value) => (value * Math.PI) / 180;
  const earthRadius = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return earthRadius * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
};

const getLocalRoofPoints = (points) => {
  if (!points?.length) return [];
  const origin = points[0];
  const metersPerLat = 111320;
  const metersPerLng = 111320 * Math.cos((origin.lat * Math.PI) / 180);

  return points.map((point) => ({
    x: (point.lng - origin.lng) * metersPerLng,
    z: (point.lat - origin.lat) * metersPerLat,
  }));
};

const getPolygonArea = (points) => {
  if (!points || points.length < 3) return 0;
  const local = getLocalRoofPoints(points);
  const sum = local.reduce((total, current, index) => {
    const next = local[(index + 1) % local.length];
    return total + current.x * next.z - next.x * current.z;
  }, 0);
  return Math.abs(sum) / 2;
};

const getRoofMetrics = (points) => {
  const safePoints = sanitizeRoofPoints(points);
  if (safePoints.length < MIN_ROOF_POINTS) {
    return {
      width: 0,
      length: 0,
      area: 0,
      height: 0,
    };
  }

  const local = getLocalRoofPoints(safePoints);
  const xs = local.map((point) => point.x);
  const zs = local.map((point) => point.z);
  const width = Math.max(...xs) - Math.min(...xs);
  const length = Math.max(...zs) - Math.min(...zs);
  const longestEdge = safePoints.reduce((maxLength, point, index) => {
    const next = safePoints[(index + 1) % safePoints.length];
    return Math.max(maxLength, distanceMeters(point, next));
  }, 0);
  const area = getPolygonArea(safePoints);
  const height = clamp(Math.sqrt(Math.max(area, 1)) * 0.35, 4.5, 12);

  return {
    width: Math.max(width, longestEdge),
    length,
    area,
    height,
  };
};

const getCentroid = (points = []) => {
  if (!points.length) return null;
  return points.reduce(
    (total, point) => ({
      lat: total.lat + point.lat / points.length,
      lng: total.lng + point.lng / points.length,
    }),
    { lat: 0, lng: 0 }
  );
};

const readLatLng = (location) => {
  if (!location) return null;

  const lat = typeof location.lat === "function" ? location.lat() : location.lat;
  const lng = typeof location.lng === "function" ? location.lng() : location.lng;

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
};

const normalizeSearchResult = (result, index, query) => {
  const position = readLatLng(result?.geometry?.location);
  if (!position) return null;

  const description =
    result.formatted_address ||
    [result.name, result.vicinity].filter(Boolean).join(", ") ||
    query;
  const fallbackTitle = description.split(",")[0]?.trim() || query;
  const title = result.name || fallbackTitle;
  const subtitle =
    result.formatted_address ||
    result.vicinity ||
    description.replace(title, "").replace(/^,\s*/, "");

  return {
    id: result.place_id || `${position.lat}-${position.lng}-${index}`,
    title,
    subtitle,
    description,
    position,
  };
};

const parseCoordinate = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const getIncomingLeadLocationSeed = (lead, initialLocation = null) => {
  const explicitLocation =
    initialLocation && typeof initialLocation === "object"
      ? {
          lat: parseCoordinate(initialLocation.lat),
          lng: parseCoordinate(initialLocation.lng),
          locationName: String(initialLocation.locationName || "").trim(),
        }
      : null;

  if (!lead || typeof lead !== "object") {
    if (!explicitLocation || !Number.isFinite(explicitLocation.lat) || !Number.isFinite(explicitLocation.lng)) {
      return explicitLocation?.locationName ? { searchText: explicitLocation.locationName } : null;
    }

    return {
      center: { lat: explicitLocation.lat, lng: explicitLocation.lng },
      searchText: explicitLocation.locationName || "",
      selectedPlace: {
        id: `${explicitLocation.lat}-${explicitLocation.lng}`,
        title: explicitLocation.locationName || "Selected location",
        subtitle: "",
        description: explicitLocation.locationName || "Selected location",
        position: { lat: explicitLocation.lat, lng: explicitLocation.lng },
      },
    };
  }

  const siteSurvey =
    lead.siteSurvey && typeof lead.siteSurvey === "object" ? lead.siteSurvey : null;
  const center = {
    lat: parseCoordinate(
      explicitLocation?.lat ??
        siteSurvey?.latitude ??
        lead?.latitude ??
        lead?.lat ??
        lead?.location?.lat
    ),
    lng: parseCoordinate(
      explicitLocation?.lng ??
        siteSurvey?.longitude ??
        lead?.longitude ??
        lead?.lng ??
        lead?.location?.lng
    ),
  };

  const title =
    [lead?.firstName, lead?.lastName].filter(Boolean).join(" ").trim() ||
    lead?.customerName ||
    lead?.name ||
    "Selected lead";
  const description =
    explicitLocation?.locationName ||
    siteSurvey?.locationName ||
    lead?.address ||
    [lead?.city, lead?.state, lead?.pincode].filter(Boolean).join(", ") ||
    title;

  if (!Number.isFinite(center.lat) || !Number.isFinite(center.lng)) {
    return description ? { searchText: description } : null;
  }

  return {
    center,
    searchText: description,
    selectedPlace: {
      id: lead?._id || `${center.lat}-${center.lng}`,
      title,
      subtitle: description && description !== title ? description : "",
      description,
      position: center,
    },
  };
};

const getMetersVector = (origin, point) => {
  const metersPerLat = 111320;
  const metersPerLng = 111320 * Math.cos((origin.lat * Math.PI) / 180);
  return {
    x: (point.lng - origin.lng) * metersPerLng,
    z: (point.lat - origin.lat) * metersPerLat,
  };
};

const getVectorLength = (vector) =>
  Math.sqrt(vector.x * vector.x + vector.z * vector.z);

const normalizeVector = (vector, fallback = { x: 1, z: 0 }) => {
  const length = getVectorLength(vector);
  if (!Number.isFinite(length) || length < 0.001) return fallback;
  return { x: vector.x / length, z: vector.z / length };
};

const getDot = (a, b) => a.x * b.x + a.z * b.z;

const getSceneBounds = (points = []) => {
  if (!points.length) {
    return {
      minX: 0,
      maxX: 0,
      minZ: 0,
      maxZ: 0,
      width: 0,
      depth: 0,
      centerX: 0,
      centerZ: 0,
    };
  }

  const xs = points.map((point) => point.x);
  const zs = points.map((point) => point.z);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minZ = Math.min(...zs);
  const maxZ = Math.max(...zs);

  return {
    minX,
    maxX,
    minZ,
    maxZ,
    width: maxX - minX,
    depth: maxZ - minZ,
    centerX: (minX + maxX) / 2,
    centerZ: (minZ + maxZ) / 2,
  };
};

const getSiteTransform = (points, metrics) => {
  const safePoints = sanitizeRoofPoints(points);
  if (safePoints.length < MIN_ROOF_POINTS) return null;

  const center = getCentroid(safePoints);
  const longestEdge = safePoints.reduce(
    (best, point, index) => {
      const next = safePoints[(index + 1) % safePoints.length];
      const vector = getMetersVector(point, next);
      const length = getVectorLength(vector);
      return length > best.length ? { vector, length } : best;
    },
    { vector: { x: 1, z: 0 }, length: 0 }
  );
  const widthAxis = normalizeVector(longestEdge.vector);
  const depthAxis = { x: -widthAxis.z, z: widthAxis.x };
  const projectedPoints = safePoints.map((point) => {
    const vector = getMetersVector(center, point);
    return {
      x: getDot(vector, widthAxis),
      z: getDot(vector, depthAxis),
    };
  });
  const rawBounds = getSceneBounds(projectedPoints);
  const maxExtent = Math.max(rawBounds.width, rawBounds.depth, metrics.width, metrics.length, 1);
  const scale = clamp(24 / maxExtent, 0.35, 2.2);
  const houseWidth = Math.max(rawBounds.width * scale, 1);
  const houseDepth = Math.max(rawBounds.depth * scale, 1);
  const wallHeight = clamp(metrics.height * Math.min(scale, 1.4), 5.2, 8);

  const houseRotationY = Math.atan2(widthAxis.z, widthAxis.x);
  const toScene = (point) => {
    const vector = getMetersVector(center, point);
    return {
      x: (getDot(vector, widthAxis) - rawBounds.centerX) * scale,
      z: (getDot(vector, depthAxis) - rawBounds.centerZ) * scale,
    };
  };
  const footprint = safePoints.map(toScene);

  return {
    center,
    scale,
    houseWidth,
    houseDepth,
    wallHeight,
    houseRotationY,
    footprint,
    footprintBounds: getSceneBounds(footprint),
    toScene,
  };
};

const parseBuildingHeight = (tags = {}, index = 0) => {
  const rawHeight = tags.height || tags["building:height"];
  if (rawHeight) {
    const parsed = Number.parseFloat(String(rawHeight).replace(/[^\d.]/g, ""));
    if (Number.isFinite(parsed) && parsed > 0) return clamp(parsed, 3, 24);
  }

  const levels = Number.parseFloat(tags["building:levels"] || tags.levels || "");
  if (Number.isFinite(levels) && levels > 0) return clamp(levels * 3.1, 3, 24);

  return [4.5, 5.2, 6.4, 7.1][index % 4];
};

const normalizeOverpassBuildings = (elements = []) => {
  const seen = new Set();

  return elements
    .filter((element) => element?.type === "way" && Array.isArray(element.geometry))
    .map((element, index) => ({
      id: String(element.id || index),
      footprint: element.geometry
        .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lon))
        .map((point) => ({ lat: point.lat, lng: point.lon })),
      heightMeters: parseBuildingHeight(element.tags, index),
      tags: element.tags || {},
    }))
    .filter((building) => {
      if (seen.has(building.id) || building.footprint.length < 3) return false;
      seen.add(building.id);
      return true;
    })
    .slice(0, 28);
};

const getSatelliteTextureUrl = (points = []) => {
  const center = getCentroid(points);
  if (!center) return "";
  const zoom = 18;
  const lat = center.lat;
  const lng = center.lng;
  const n = Math.pow(2, zoom);
  const xtile = Math.floor(((lng + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const ytile = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n
  );
  return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${ytile}/${xtile}`;
};

const formatNumber = (value, decimals = 1) =>
  Number.isFinite(value) ? value.toFixed(decimals) : "0.0";

const disposeMaterial = (material) => {
  Object.values(material).forEach((value) => {
    if (value?.isTexture) value.dispose();
  });
  material.dispose();
};

const clearGroup = (group) => {
  const geometries = new Set();
  const materials = new Set();

  group.traverse((child) => {
    if (child.geometry) geometries.add(child.geometry);
    if (Array.isArray(child.material)) {
      child.material.forEach((material) => materials.add(material));
    } else if (child.material) {
      materials.add(child.material);
    }
  });

  group.clear();
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach(disposeMaterial);
};

const setShadows = (mesh, cast = true, receive = true) => {
  mesh.castShadow = cast;
  mesh.receiveShadow = receive;
  return mesh;
};

const createMaterial = (color, options = {}) =>
  new THREE.MeshStandardMaterial({
    color,
    roughness: 0.68,
    metalness: 0.04,
    ...options,
  });

const createRadialGlowTexture = (
  innerColor = "rgba(255, 247, 173, 1)",
  midColor = "rgba(255, 183, 3, 0.55)",
  outerColor = "rgba(255, 111, 0, 0)"
) => {
  if (typeof document === "undefined") return null;

  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  const gradient = context.createRadialGradient(128, 128, 4, 128, 128, 128);
  gradient.addColorStop(0, innerColor);
  gradient.addColorStop(0.22, "rgba(255, 230, 128, 0.95)");
  gradient.addColorStop(0.48, midColor);
  gradient.addColorStop(1, outerColor);
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
};

const addSunPathVisual = (pathGroup, settings, latitude, environmentMode = "day") => {
  const environment = getEnvironmentPreset(environmentMode);
  clearGroup(pathGroup);

  const sunSettings = sanitizeSunSettings(settings);
  const pathPoints = [];
  for (let minute = SUN_TIME_MIN; minute <= SUN_TIME_MAX; minute += 20) {
    pathPoints.push(getSunScenePosition(getSunPositionInfo({ ...sunSettings, timeMinutes: minute }, latitude)));
  }

  const sunPathCurve = new THREE.CatmullRomCurve3(pathPoints);
  const pathGlow = new THREE.Mesh(
    new THREE.TubeGeometry(sunPathCurve, 180, 0.16, 12, false),
    new THREE.MeshBasicMaterial({
      color: 0xffd166,
      transparent: true,
      opacity: environmentMode === "night" ? 0.18 : 0.26,
      depthWrite: false,
    })
  );
  pathGroup.add(pathGlow);

  const pathTrack = new THREE.Mesh(
    new THREE.TubeGeometry(sunPathCurve, 180, 0.045, 10, false),
    new THREE.MeshBasicMaterial({
      color: environmentMode === "night" ? 0xfbbf24 : 0xf59e0b,
      transparent: true,
      opacity: environmentMode === "night" ? 0.72 : 0.94,
    })
  );
  pathGroup.add(pathTrack);

  for (let minute = 6 * 60; minute <= 18 * 60; minute += 3 * 60) {
    const markerInfo = getSunPositionInfo({ ...sunSettings, timeMinutes: minute }, latitude);
    const markerPosition = getSunScenePosition(markerInfo);
    const isNoon = minute === 12 * 60;
    const hourMarker = new THREE.Mesh(
      new THREE.SphereGeometry(isNoon ? 0.28 : 0.18, 14, 10),
      new THREE.MeshBasicMaterial({
        color: isNoon ? 0xfff4a3 : 0xffc64d,
        transparent: true,
        opacity: markerInfo.altitudeDeg > 1 ? 0.95 : 0.35,
      })
    );
    hourMarker.position.copy(markerPosition);
    pathGroup.add(hourMarker);
  }

  const currentSunInfo = getSunPositionInfo(sunSettings, latitude);
  const currentSunPosition = getSunScenePosition(currentSunInfo);

  const sunAuraTexture = createRadialGlowTexture();
  if (sunAuraTexture) {
    const sunAura = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: sunAuraTexture,
        color: 0xffffff,
        transparent: true,
        opacity: environmentMode === "night" ? 0.42 : 0.78,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    sunAura.position.copy(currentSunPosition);
    sunAura.scale.set(10.5, 10.5, 1);
    pathGroup.add(sunAura);
  }

  const sunCoronaTexture = createRadialGlowTexture(
    "rgba(255, 255, 230, 1)",
    "rgba(255, 146, 43, 0.5)",
    "rgba(255, 66, 0, 0)"
  );
  if (sunCoronaTexture) {
    const sunCorona = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: sunCoronaTexture,
        color: 0xffd166,
        transparent: true,
        opacity: environmentMode === "night" ? 0.25 : 0.52,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    sunCorona.position.copy(currentSunPosition);
    sunCorona.scale.set(5.6, 5.6, 1);
    pathGroup.add(sunCorona);
  }

  const sunOuter = new THREE.Mesh(
    new THREE.SphereGeometry(1.2, 40, 24),
    new THREE.MeshBasicMaterial({
      color: 0xff8f00,
      transparent: true,
      opacity: 0.92,
      depthWrite: false,
    })
  );
  sunOuter.position.copy(currentSunPosition);
  pathGroup.add(sunOuter);

  const sunMarker = new THREE.Mesh(
    new THREE.SphereGeometry(0.88, 40, 24),
    new THREE.MeshBasicMaterial({ color: 0xffc241 })
  );
  sunMarker.position.copy(currentSunPosition);
  pathGroup.add(sunMarker);

  const sunCore = new THREE.Mesh(
    new THREE.SphereGeometry(0.46, 20, 14),
    new THREE.MeshBasicMaterial({ color: 0xfff7ad })
  );
  sunCore.position.copy(currentSunPosition);
  pathGroup.add(sunCore);

  const sunlightGlow = new THREE.PointLight(0xffd166, environmentMode === "night" ? 0.55 : 1.25, 42, 1.6);
  sunlightGlow.position.copy(currentSunPosition);
  pathGroup.add(sunlightGlow);

  const shadowDirection = new THREE.Vector3(
    -currentSunPosition.x,
    0,
    -currentSunPosition.z
  ).normalize();
  const shadowLength = clamp(24 / Math.tan(currentSunInfo.altitudeRad), 7, 52);
  const shadowEnd = shadowDirection.multiplyScalar(shadowLength);
  const shadowCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.18, 0),
    new THREE.Vector3(shadowEnd.x, 0.18, shadowEnd.z),
  ]);
  const shadowLine = new THREE.Mesh(
    new THREE.TubeGeometry(shadowCurve, 8, 0.035, 8, false),
    new THREE.MeshBasicMaterial({
      color: sunSettings.shadowsEnabled ? 0x263445 : 0x94a3b8,
      transparent: true,
      opacity: sunSettings.shadowsEnabled ? environment.shadowOpacity : 0.2,
    })
  );
  pathGroup.add(shadowLine);

  const shadowArrow = new THREE.Mesh(
    new THREE.ConeGeometry(0.22, 0.72, 18),
    new THREE.MeshBasicMaterial({
      color: sunSettings.shadowsEnabled ? 0x263445 : 0x94a3b8,
      transparent: true,
      opacity: sunSettings.shadowsEnabled ? 0.85 : 0.25,
    })
  );
  shadowArrow.position.set(shadowEnd.x, 0.28, shadowEnd.z);
  shadowArrow.rotation.z = Math.PI / 2;
  shadowArrow.rotation.y = Math.atan2(shadowDirection.x, shadowDirection.z);
  pathGroup.add(shadowArrow);

  return { currentSunInfo, currentSunPosition };
};

const addBox = (
  group,
  { width, height, depth, x = 0, y = 0, z = 0, material, color, cast = true, receive = true }
) => {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    material || createMaterial(color)
  );
  mesh.position.set(x, y, z);
  setShadows(mesh, cast, receive);
  group.add(mesh);
  return mesh;
};

const addRotatedBox = (
  group,
  {
    width,
    height,
    depth,
    x = 0,
    y = 0,
    z = 0,
    rotationY = 0,
    material,
    color,
    cast = true,
    receive = true,
  }
) => {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    material || createMaterial(color)
  );
  mesh.position.set(x, y, z);
  mesh.rotation.y = rotationY;
  setShadows(mesh, cast, receive);
  group.add(mesh);
  return mesh;
};

const addEdges = (group, mesh, color = 0x94a3b8, opacity = 1) => {
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(mesh.geometry),
    new THREE.LineBasicMaterial({
      color,
      transparent: opacity < 1,
      opacity,
    })
  );
  edges.position.copy(mesh.position);
  edges.rotation.copy(mesh.rotation);
  edges.scale.copy(mesh.scale);
  group.add(edges);
  return edges;
};

const createFootprintShape = (footprint = []) => {
  if (footprint.length < MIN_ROOF_POINTS) return null;

  const shape = new THREE.Shape();
  footprint.forEach((point, index) => {
    const x = Number(point.x);
    const y = -Number(point.z);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    if (index === 0) {
      shape.moveTo(x, y);
    } else {
      shape.lineTo(x, y);
    }
  });
  shape.closePath();
  return shape;
};

const addFootprintMesh = (
  group,
  { footprint, height, y = 0, material, color, cast = true, receive = true }
) => {
  const shape = createFootprintShape(footprint);
  if (!shape) return null;

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: false,
  });
  geometry.rotateX(-Math.PI / 2);
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, material || createMaterial(color));
  mesh.position.y = y;
  setShadows(mesh, cast, receive);
  group.add(mesh);
  return mesh;
};

const addFootprintPlane = (
  group,
  { footprint, y = 0, material, color, cast = false, receive = true }
) => {
  const shape = createFootprintShape(footprint);
  if (!shape) return null;

  const geometry = new THREE.ShapeGeometry(shape);
  geometry.rotateX(-Math.PI / 2);
  const mesh = new THREE.Mesh(
    geometry,
    material ||
      createMaterial(color, {
        side: THREE.DoubleSide,
      })
  );
  mesh.position.y = y;
  setShadows(mesh, cast, receive);
  group.add(mesh);
  return mesh;
};

const addFootprintOutline = (group, footprint = [], y = 0, color = 0x94a3b8, opacity = 1) => {
  if (footprint.length < MIN_ROOF_POINTS) return null;

  const points = [...footprint, footprint[0]].map(
    (point) => new THREE.Vector3(point.x, y, point.z)
  );
  const line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({
      color,
      transparent: opacity < 1,
      opacity,
    })
  );
  group.add(line);
  return line;
};

const addPolygonEdgeWalls = (
  group,
  footprint = [],
  { y, height, thickness, material, color }
) => {
  if (footprint.length < MIN_ROOF_POINTS) return;

  footprint.forEach((point, index) => {
    const next = footprint[(index + 1) % footprint.length];
    const dx = next.x - point.x;
    const dz = next.z - point.z;
    const length = Math.hypot(dx, dz);
    if (length < 0.05) return;

    addRotatedBox(group, {
      width: length + thickness,
      height,
      depth: thickness,
      x: (point.x + next.x) / 2,
      y,
      z: (point.z + next.z) / 2,
      rotationY: -Math.atan2(dz, dx),
      material,
      color,
    });
  });
};

export const isPointInsideFootprint = (point, footprint = []) => {
  if (footprint.length < MIN_ROOF_POINTS) return false;

  let inside = false;
  for (
    let index = 0, previous = footprint.length - 1;
    index < footprint.length;
    previous = index, index += 1
  ) {
    const currentPoint = footprint[index];
    const previousPoint = footprint[previous];
    const crosses =
      currentPoint.z > point.z !== previousPoint.z > point.z &&
      point.x <
        ((previousPoint.x - currentPoint.x) * (point.z - currentPoint.z)) /
          (previousPoint.z - currentPoint.z || 0.0001) +
          currentPoint.x;
    if (crosses) inside = !inside;
  }

  return inside;
};

const REFERENCE_PANEL_W = 1.95;
const REFERENCE_PANEL_D = 1.05;

const getReferencePanelGrid = (count, cols, gap = 0.24) => {
  const rows = Math.ceil(count / cols);
  const arrW = cols * REFERENCE_PANEL_W + (cols - 1) * gap;
  const arrD = rows * REFERENCE_PANEL_D + (rows - 1) * gap;
  const positions = [];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      if (positions.length >= count) break;
      positions.push({
        x: -arrW / 2 + REFERENCE_PANEL_W / 2 + col * (REFERENCE_PANEL_W + gap),
        z: -arrD / 2 + REFERENCE_PANEL_D / 2 + row * (REFERENCE_PANEL_D + gap),
      });
    }
  }

  return { positions, arrW, arrD, rows };
};

const addReferenceSolarStructure = (
  group,
  {
    count,
    structureType,
    x,
    y,
    z,
    maxWidth,
    maxDepth,
    positionRatio,
    elevatedSettings,
  }
) => {
  if (!count) return null;

  const markSolar = (object) => {
    object.userData.isSolarPanel = true;
    object.userData.solarPanelIndex = null;
    object.userData.solarPositionRatio = positionRatio;
    object.traverse?.((child) => {
      child.userData.isSolarPanel = true;
      child.userData.solarPanelIndex = null;
      child.userData.solarPositionRatio = positionRatio;
    });
    return object;
  };
  const mat = (color, options = {}) => createMaterial(color, options);
  const materials = {
    panel: mat(0x1040b8, {
      roughness: 0.22,
      metalness: 0.18,
      emissive: new THREE.Color(0x08144a),
      emissiveIntensity: 0.12,
    }),
    frame: mat(0x607888, { roughness: 0.42, metalness: 0.55 }),
    darkFrame: mat(0x2f3f4f, { roughness: 0.42, metalness: 0.68 }),
    steel: mat(0x607080, { roughness: 0.4, metalness: 0.6 }),
    galv: mat(0x9ab0c4, { roughness: 0.38, metalness: 0.52 }),
    concrete: mat(0xa09888, { roughness: 0.88 }),
    lightConcrete: mat(0xc0b8a8, { roughness: 0.76 }),
    roofMetal: mat(0x7c8fa0, { roughness: 0.52, metalness: 0.28 }),
    tin: mat(0xb0c0cc, { roughness: 0.48, metalness: 0.32 }),
    timber: mat(0x7a5230, { roughness: 0.82 }),
    tracker: mat(0x3a4a58, { roughness: 0.38, metalness: 0.65 }),
    panelGlass: mat(0x4b8fdc, { roughness: 0.08, metalness: 0.08, transparent: true, opacity: 0.58 }),
    panelCell: mat(0x0d2f76, { roughness: 0.16, metalness: 0.22 }),
    panelCellAlt: mat(0x123f91, { roughness: 0.18, metalness: 0.2 }),
    busbar: mat(0xd6c35a, { roughness: 0.22, metalness: 0.7 }),
    glass: mat(0x80aacc, { roughness: 0.18, transparent: true, opacity: 0.6 }),
    wall: mat(0xd6d0c0, { roughness: 0.82 }),
    rubber: mat(0x171717, { roughness: 0.92 }),
    carPaint: mat(0x1a55a8, { roughness: 0.32, metalness: 0.22 }),
    chrome: mat(0xe0e8f0, { roughness: 0.18, metalness: 0.88 }),
  };
  const root = new THREE.Group();
  root.position.set(x, y, z);
  markSolar(root);
  group.add(root);

  const addLocalBox = (parent, width, height, depth, px, py, pz, material, rx = 0, ry = 0, rz = 0) => {
    const mesh = markSolar(new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material));
    mesh.position.set(px, py, pz);
    mesh.rotation.set(rx, ry, rz);
    setShadows(mesh);
    parent.add(mesh);
    return mesh;
  };
  const addLocalCyl = (parent, rt, rb, height, px, py, pz, material, rx = 0, ry = 0, rz = 0, segments = 16) => {
    const mesh = markSolar(
      new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, height, segments), material)
    );
    mesh.position.set(px, py, pz);
    mesh.rotation.set(rx, ry, rz);
    setShadows(mesh);
    parent.add(mesh);
    return mesh;
  };
  const addLocalSphere = (parent, radius, px, py, pz, material) => {
    const mesh = markSolar(new THREE.Mesh(new THREE.SphereGeometry(radius, 16, 12), material));
    mesh.position.set(px, py, pz);
    setShadows(mesh);
    parent.add(mesh);
    return mesh;
  };
  const addPanelMesh = (parent, px, py, pz, tilt = 0, azimuth = 0, panelW = REFERENCE_PANEL_W, panelD = REFERENCE_PANEL_D) => {
    const panel = new THREE.Group();
    panel.position.set(px, py, pz);
    panel.rotation.order = "YXZ";
    panel.rotation.y = azimuth;
    panel.rotation.x = -tilt;
    markSolar(panel);
    parent.add(panel);

    addLocalBox(panel, panelW + 0.03, 0.034, panelD + 0.03, 0, -0.018, 0, materials.darkFrame);
    addLocalBox(panel, panelW - 0.045, 0.018, panelD - 0.045, 0, 0.002, 0, materials.panel);
    addLocalBox(panel, panelW - 0.09, 0.012, panelD - 0.09, 0, 0.026, 0, materials.panelGlass);

    const cellCols = 6;
    const cellRows = 4;
    const cellW = (panelW - 0.16) / cellCols;
    const cellD = (panelD - 0.12) / cellRows;
    for (let col = 0; col < cellCols; col += 1) {
      for (let row = 0; row < cellRows; row += 1) {
        addLocalBox(
          panel,
          cellW - 0.014,
          0.006,
          cellD - 0.014,
          -panelW / 2 + 0.08 + cellW * (col + 0.5),
          0.034,
          -panelD / 2 + 0.06 + cellD * (row + 0.5),
          (col + row) % 2 ? materials.panelCellAlt : materials.panelCell
        );
      }
    }

    addLocalBox(panel, 0.008, 0.008, panelD - 0.14, -panelW * 0.18, 0.041, 0, materials.busbar);
    addLocalBox(panel, 0.008, 0.008, panelD - 0.14, panelW * 0.18, 0.041, 0, materials.busbar);
    const frameHeight = 0.06;
    const frameThickness = 0.045;
    addLocalBox(panel, panelW + 0.04, frameHeight, frameThickness, 0, 0.012, panelD / 2 + frameThickness / 2, materials.frame);
    addLocalBox(panel, panelW + 0.04, frameHeight, frameThickness, 0, 0.012, -panelD / 2 - frameThickness / 2, materials.frame);
    addLocalBox(panel, frameThickness, frameHeight, panelD, -panelW / 2 - frameThickness / 2, 0.012, 0, materials.frame);
    addLocalBox(panel, frameThickness, frameHeight, panelD, panelW / 2 + frameThickness / 2, 0.012, 0, materials.frame);
    addLocalBox(panel, 0.16, 0.055, 0.11, 0, -0.055, 0, materials.frame);

    const gridMaterial = new THREE.LineBasicMaterial({
      color: 0x3060d0,
      transparent: true,
      opacity: 0.7,
    });
    const points = [];
    for (let col = 1; col < cellCols; col += 1) {
      const lineX = -panelW / 2 + (panelW * col) / cellCols;
      points.push(
        new THREE.Vector3(lineX, 0.027, -panelD / 2 + 0.06),
        new THREE.Vector3(lineX, 0.027, panelD / 2 - 0.06)
      );
    }
    for (let row = 1; row < cellRows; row += 1) {
      const lineZ = -panelD / 2 + (panelD * row) / cellRows;
      points.push(
        new THREE.Vector3(-panelW / 2 + 0.06, 0.027, lineZ),
        new THREE.Vector3(panelW / 2 - 0.06, 0.027, lineZ)
      );
    }
    const grid = markSolar(
      new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(points), gridMaterial)
    );
    panel.add(grid);
    return panel;
  };

  const getSingleAxisTrackerMetrics = (panelRows, panelColumns) => {
    const rowCount = Math.max(1, panelRows);
    const columnCount = Math.max(1, panelColumns);
    const rowSpacing = 2.75;
    const axisLength = Math.max(14, (rowCount - 1) * rowSpacing + 3);
    const tableWidth = Math.max(4.2, (columnCount - 1) * 1.8 + 2.1);
    return {
      rowCount,
      columnCount,
      rowSpacing,
      axisLength,
      width: tableWidth,
      depth: axisLength + 1.8,
    };
  };

  const addSingleAxisTrackerTable = (parent, panelRows, panelColumns, tiltRad) => {
    const panelW = 1.65;
    const panelD = 0.99;
    const cellRows = 6;
    const cellCols = 10;
    const torqueY = 3.7;
    const rowCount = Math.max(1, panelRows);
    const columnCount = Math.max(1, panelColumns);
    const rowSpacing = 2.75;
    const columnSpacing = 1.8;
    const rowZs = Array.from(
      { length: rowCount },
      (_, index) => -((rowCount - 1) * rowSpacing) / 2 + index * rowSpacing
    );
    const columnXs = Array.from(
      { length: columnCount },
      (_, index) => -((columnCount - 1) * columnSpacing) / 2 + index * columnSpacing
    );
    const minZ = rowZs[0] || 0;
    const axisLength = Math.max(14, (rowCount - 1) * rowSpacing + 3);
    const purlinWidth = Math.max(3.8, (columnCount - 1) * columnSpacing + panelW + 0.45);
    const actuatorMaterial = mat(0xcc6600, { roughness: 0.3, metalness: 0.7 });
    const sensorMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff88 });
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.62,
    });

    rowZs.forEach((rowZ) => {
      addLocalBox(parent, 0.4, 0.3, 0.4, 0, 0.15, rowZ, materials.concrete);
      addLocalCyl(parent, 0.06, 0.08, 3.5, 0, 1.9, rowZ, materials.steel, 0, 0, 0, 12);
    });

    addLocalCyl(
      parent,
      0.08,
      0.08,
      axisLength,
      0,
      torqueY,
      0,
      materials.steel,
      Math.PI / 2,
      0,
      0,
      12
    );

    const tableGroup = new THREE.Group();
    tableGroup.position.set(0, torqueY, 0);
    tableGroup.rotation.z = -tiltRad;
    markSolar(tableGroup);
    parent.add(tableGroup);

    rowZs.forEach((rowZ) => {
      addLocalBox(tableGroup, purlinWidth, 0.05, 0.06, 0, 0, rowZ, materials.steel);
    });

    rowZs.forEach((rowZ) => {
      columnXs.forEach((xOff) => {
        addLocalBox(tableGroup, panelW, 0.025, panelD, xOff, 0.03, rowZ, materials.panel);

        [-1, 1].forEach((side) => {
          addLocalBox(
            tableGroup,
            panelW + 0.04,
            0.04,
            0.04,
            xOff,
            0.04,
            rowZ + side * panelD / 2,
            materials.frame
          );
          addLocalBox(
            tableGroup,
            0.04,
            0.04,
            panelD + 0.04,
            xOff + side * panelW / 2,
            0.04,
            rowZ,
            materials.frame
          );
        });

        const cellW = (panelW - 0.05) / cellCols;
        const cellD = (panelD - 0.05) / cellRows;
        for (let cellRow = 0; cellRow < cellRows; cellRow += 1) {
          for (let cellCol = 0; cellCol < cellCols; cellCol += 1) {
            addLocalBox(
              tableGroup,
              cellW - 0.008,
              0.006,
              cellD - 0.008,
              xOff + (cellCol - cellCols / 2 + 0.5) * cellW,
              0.048,
              rowZ + (cellRow - cellRows / 2 + 0.5) * cellD,
              (cellCol + cellRow) % 2 ? materials.panelCellAlt : materials.panelCell
            );
          }
        }

      });
    });

    const actuator = addLocalCyl(
      parent,
      0.05,
      0.07,
      1.2,
      1.5,
      3.3,
      0,
      actuatorMaterial,
      0,
      0,
      tiltRad * 0.5,
      10
    );
    actuator.userData.isSolarPanel = true;

    addLocalSphere(tableGroup, 0.12, 0, 0.25, minZ - 1, sensorMaterial);
    const ring = markSolar(
      new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.02, 8, 32), ringMaterial)
    );
    ring.position.set(0, 0.25, minZ - 1);
    tableGroup.add(ring);

    addLocalBox(
      parent,
      0.78,
      0.5,
      0.42,
      -purlinWidth / 2 - 0.55,
      0.25,
      minZ - 1.1,
      mat(0x2c3a48, { roughness: 0.5, metalness: 0.15 })
    );
    addLocalBox(parent, 0.34, 0.08, 0.36, -purlinWidth / 2 - 0.55, 0.56, minZ - 1.1, materials.galv);
  };

  const structureConfig = sanitizeElevatedStructureSettings(elevatedSettings);
  const structureTilt = (structureConfig.tiltAngle * Math.PI) / 180;
  const structureHeight = structureConfig.structureHeight;
  const cols = Math.min(structureConfig.panelColumns, count);
  const { positions, arrW, arrD } = getReferencePanelGrid(count, cols);
  const fitWidth = Math.max(arrW + 2.4, 1);
  const fitDepth = Math.max(arrD + 2.4, 1);
  const scale = Math.min(1, maxWidth / fitWidth, maxDepth / fitDepth);
  root.scale.setScalar(scale);

  if (structureType === "rcc_rooftop") {
    const slabW = arrW + 2.5;
    const slabD = arrD + 2.8;
    const slabTop = 0.32;
    addLocalBox(root, slabW, 0.32, slabD, 0, 0.16, 0, materials.concrete);
    const parapetH = 1.05;
    const parapetT = 0.38;
    addLocalBox(root, slabW + parapetT * 2, parapetH, parapetT, 0, 0.32 + parapetH / 2, slabD / 2, materials.concrete);
    addLocalBox(root, slabW + parapetT * 2, parapetH, parapetT, 0, 0.32 + parapetH / 2, -slabD / 2, materials.concrete);
    addLocalBox(root, parapetT, parapetH, slabD + parapetT * 2, -slabW / 2, 0.32 + parapetH / 2, 0, materials.concrete);
    addLocalBox(root, parapetT, parapetH, slabD + parapetT * 2, slabW / 2, 0.32 + parapetH / 2, 0, materials.concrete);
    addLocalBox(root, slabW + parapetT * 1.8, 0.055, slabD + parapetT * 1.8, 0, 0.32 + parapetH + 0.03, 0, materials.lightConcrete);
    addLocalCyl(root, 0.72, 0.72, 1.4, arrW / 2 - 1, 1.02, -arrD / 2 + 1, mat(0x1f2937, { roughness: 0.45, metalness: 0.1 }));
    addLocalCyl(root, 0.78, 0.78, 0.08, arrW / 2 - 1, 1.76, -arrD / 2 + 1, mat(0x374151, { roughness: 0.5, metalness: 0.15 }));
    addLocalBox(root, 1.8, 1.9, 1.5, -arrW / 2 + 1, 1.27, arrD / 2 - 1.2, mat(0xd8d0c0, { roughness: 0.72 }));
    addLocalBox(root, 0.7, 0.9, 0.08, -arrW / 2 + 1, 1.3, arrD / 2 - 0.43, materials.glass);
    addLocalBox(root, 0.9, 0.35, 0.55, 0.5, 0.54, -arrD / 2 + 0.8, mat(0xe0e8f0, { roughness: 0.5, metalness: 0.1 }));
    positions.forEach(({ x: panelX, z: panelZ }) => {
      [
        [-REFERENCE_PANEL_W * 0.36, -REFERENCE_PANEL_D * 0.36],
        [REFERENCE_PANEL_W * 0.36, -REFERENCE_PANEL_D * 0.36],
        [-REFERENCE_PANEL_W * 0.36, REFERENCE_PANEL_D * 0.36],
        [REFERENCE_PANEL_W * 0.36, REFERENCE_PANEL_D * 0.36],
      ].forEach(([blockX, blockZ]) =>
        addLocalBox(root, 0.24, 0.14, 0.26, panelX + blockX, 0.4, panelZ + blockZ, materials.concrete)
      );
      [-REFERENCE_PANEL_D * 0.32, REFERENCE_PANEL_D * 0.32].forEach((railZ) =>
        addLocalBox(root, REFERENCE_PANEL_W * 0.98, 0.05, 0.06, panelX, 0.5, panelZ + railZ, materials.galv)
      );
      [-REFERENCE_PANEL_W * 0.38, REFERENCE_PANEL_W * 0.38].forEach((legX) => {
        addLocalBox(root, 0.055, 0.26, 0.055, panelX + legX, slabTop + 0.26, panelZ - REFERENCE_PANEL_D * 0.3, materials.steel);
        addLocalBox(root, 0.055, 0.14, 0.055, panelX + legX, slabTop + 0.2, panelZ + REFERENCE_PANEL_D * 0.3, materials.steel);
        addLocalBox(root, 0.04, 0.04, REFERENCE_PANEL_D * 0.78, panelX + legX, slabTop + 0.26, panelZ, materials.galv, 0.22);
      });
      addPanelMesh(root, panelX, 0.58, panelZ, structureTilt);
    });
    return root;
  }

  if (structureType === "metal_sheet_roof" || structureType === "tin_shed") {
    const roofTilt = structureType === "tin_shed" ? 0.32 : 0.38;
    const roofW = arrW + 4.1;
    const roofD = arrD + 4.4;
    const roofY = structureType === "tin_shed" ? 1.12 : 0.92;
    const wallH = structureType === "tin_shed" ? 1.75 : 1.35;
    addLocalBox(root, roofW, 0.065, roofD, 0, roofY, 0, structureType === "tin_shed" ? materials.tin : materials.roofMetal, -roofTilt);
    for (let i = 0; i < Math.floor(roofW / 0.38); i += 1) {
      addLocalBox(root, 0.048, 0.065, roofD, -roofW / 2 + i * 0.38 + 0.19, roofY + 0.04, 0, materials.galv, -roofTilt);
    }
    for (let i = 0; i < 5; i += 1) {
      const rafterZ = -roofD / 2 + 0.55 + i * ((roofD - 1.1) / 4);
      addLocalBox(root, roofW + 0.15, 0.08, 0.08, 0, roofY - 0.12, rafterZ, materials.steel, -roofTilt);
    }
    [-roofW * 0.32, 0, roofW * 0.32].forEach((purlinX) => {
      addLocalBox(root, 0.08, 0.09, roofD + 0.2, purlinX, roofY - 0.18, 0, materials.steel);
    });
    if (structureType === "tin_shed") {
      addLocalBox(root, roofW, wallH, 0.2, 0, wallH / 2 - 0.08, roofD / 2, materials.wall);
      addLocalBox(root, roofW, wallH, 0.2, 0, wallH / 2 - 0.08, -roofD / 2, materials.wall);
      addLocalBox(root, 0.2, wallH, roofD, -roofW / 2, wallH / 2 - 0.08, 0, materials.wall);
      addLocalBox(root, 0.2, wallH, roofD, roofW / 2, wallH / 2 - 0.08, 0, materials.wall);
      addLocalBox(root, 1.2, 1.45, 0.12, 0, 0.68, roofD / 2 + 0.12, mat(0x5a4028, { roughness: 0.85 }));
      addLocalSphere(root, 0.055, 0.48, 0.72, roofD / 2 + 0.19, materials.chrome);
      addLocalBox(root, roofW + 0.4, 0.15, 0.35, 0, roofY + 0.15, -roofD * 0.18, materials.tin);
    } else {
      addLocalBox(root, roofW + 0.2, wallH, 0.2, 0, wallH / 2 - 0.12, roofD / 2, materials.wall);
      addLocalBox(root, roofW + 0.2, wallH, 0.2, 0, wallH / 2 - 0.12, -roofD / 2, materials.wall);
      addLocalBox(root, 0.2, wallH, roofD, -roofW / 2, wallH / 2 - 0.12, 0, materials.wall);
      addLocalBox(root, 0.2, wallH, roofD, roofW / 2, wallH / 2 - 0.12, 0, materials.wall);
      addLocalBox(root, roofW + 0.35, 0.09, 0.18, 0, roofY - 0.08, roofD / 2 + 0.15, materials.galv);
    }
    positions.forEach(({ x: panelX, z: panelZ }) => {
      const mountY = roofY + 0.2 + panelZ * Math.sin(roofTilt) * 0.08;
      [-REFERENCE_PANEL_W * 0.44, REFERENCE_PANEL_W * 0.44].forEach((clipX) =>
        addLocalBox(root, 0.07, 0.1, 0.05, panelX + clipX, mountY - 0.08, panelZ, materials.galv)
      );
      [-REFERENCE_PANEL_D * 0.33, REFERENCE_PANEL_D * 0.33].forEach((railZ) =>
        addLocalBox(root, REFERENCE_PANEL_W * 0.96, 0.045, 0.055, panelX, mountY - 0.05, panelZ + railZ, materials.galv, -roofTilt)
      );
      addPanelMesh(root, panelX, mountY, panelZ, structureTilt);
    });
    return root;
  }

  if (structureType === "ground_mount") {
    const backH = structureHeight;
    const frontH = Math.max(0.7, structureHeight * 0.45);
    const postCols = Math.min(4, cols) + 1;
    for (let col = 0; col < postCols; col += 1) {
      const postX = -arrW / 2 + col * (arrW / Math.max(1, postCols - 1));
      addLocalCyl(root, 0.22, 0.28, 0.35, postX, 0.175, -arrD / 2, materials.concrete);
      addLocalCyl(root, 0.065, 0.08, backH, postX, backH / 2, -arrD / 2, materials.steel);
      addLocalCyl(root, 0.22, 0.28, 0.35, postX, 0.175, arrD / 2, materials.concrete);
      addLocalCyl(root, 0.055, 0.07, frontH, postX, frontH / 2, arrD / 2, materials.steel);
      addLocalBox(root, 0.048, 0.048, arrD * 0.92, postX, (backH + frontH) / 2 - 0.05, 0, materials.galv, 0.42);
      addLocalBox(root, 0.04, backH - 0.35, 0.04, postX, backH / 2, -arrD * 0.23, materials.steel, 0, 0, col % 2 ? -0.22 : 0.22);
    }
    addLocalBox(root, arrW + 0.3, 0.08, 0.08, 0, backH + 0.05, -arrD / 2, materials.galv);
    addLocalBox(root, arrW + 0.3, 0.08, 0.08, 0, frontH + 0.05, arrD / 2, materials.galv);
    for (let row = 0; row <= Math.max(1, Math.ceil(count / cols)); row += 1) {
      const railZ = -arrD / 2 + row * (arrD / Math.max(1, Math.ceil(count / cols)));
      const fraction = (railZ + arrD / 2) / Math.max(arrD, 1);
      const railY = frontH + (backH - frontH) * (1 - fraction) + 0.08;
      addLocalBox(root, arrW + 0.35, 0.055, 0.055, 0, railY, railZ, materials.galv);
    }
    addLocalBox(root, arrW + 0.2, 0.06, 0.18, 0, 0.55, 0, mat(0x5a6a78, { roughness: 0.55, metalness: 0.4 }));
    addLocalBox(root, arrW + 0.5, 0.018, 0.018, 0, 0.24, 0, materials.busbar);
    positions.forEach(({ x: panelX, z: panelZ }) => {
      const frac = (panelZ + arrD / 2) / Math.max(arrD, 1);
      const panelY = frontH + (backH - frontH) * (1 - frac) + 0.12;
      [-REFERENCE_PANEL_D * 0.3, REFERENCE_PANEL_D * 0.3].forEach((railZ) =>
        addLocalBox(root, REFERENCE_PANEL_W * 0.96, 0.05, 0.055, panelX, panelY - 0.08, panelZ + railZ, materials.galv)
      );
      addPanelMesh(root, panelX, panelY, panelZ, structureTilt);
    });
    return root;
  }

  if (structureType === "elevated_structure") {
    const elevatedConfig = structureConfig;
    const tilt = structureTilt;
    const panelW = 1.6;
    const panelH = 1.0;
    const gapX = 0.15;
    const gapZ = 0.2;
    const poleHeight = structureHeight;
    const elevatedRows = elevatedConfig.panelRows;
    const elevatedCols = elevatedConfig.panelColumns;
    const colSpan = panelW + gapX;
    const rowSpan = panelH + gapZ;
    const totalW = elevatedCols * colSpan - gapX;
    const totalD = elevatedRows * rowSpan - gapZ;
    const ox = -totalW / 2 + panelW / 2;
    const oz = -totalD / 2 + panelH / 2;
    const poleCount = Math.ceil(elevatedCols / 2) + 1;
    const poleXs = Array.from(
      { length: poleCount },
      (_, index) => -totalW / 2 + (totalW / Math.max(1, poleCount - 1)) * index
    );
    const elevatedSteel = mat(0x8899aa, { roughness: 0.3, metalness: 0.85 });
    const elevatedSteelDark = mat(0x556677, { roughness: 0.4, metalness: 0.8 });
    const elevatedFrame = mat(0x445566, { roughness: 0.35, metalness: 0.9 });
    const elevatedCell = mat(0x112233, { roughness: 0.1, metalness: 0.3 });
    const elevatedCellLine = mat(0x1a3355, { roughness: 0.2, metalness: 0.5 });
    const elevatedGlass = mat(0x1e4466, {
      roughness: 0.05,
      metalness: 0.1,
      transparent: true,
      opacity: 0.85,
    });
    const elevatedBusbar = mat(0xddcc44, { roughness: 0.2, metalness: 0.95 });

    root.scale.setScalar(Math.min(1, maxWidth / (totalW + 1.2), maxDepth / (totalD + 1.2)));

    poleXs.forEach((poleX) => {
      [-totalD * 0.4, totalD * 0.4].forEach((poleZ) => {
        addLocalCyl(root, 0.055, 0.07, poleHeight, poleX, poleHeight / 2, poleZ, elevatedSteel, 0, 0, 0, 8);
        addLocalCyl(root, 0.12, 0.15, 0.18, poleX, 0.09, poleZ, elevatedSteelDark, 0, 0, 0, 8);
        addLocalCyl(root, 0.08, 0.055, 0.1, poleX, poleHeight + 0.05, poleZ, elevatedSteelDark, 0, 0, 0, 8);
      });

      addLocalBox(
        root,
        0.07,
        0.07,
        Math.abs(totalD * 0.8),
        poleX,
        poleHeight - 0.3,
        0,
        elevatedSteelDark
      );
    });

    for (let index = 0; index < poleXs.length - 1; index += 1) {
      const middleX = (poleXs[index] + poleXs[index + 1]) / 2;
      const span = Math.abs(poleXs[index + 1] - poleXs[index]);
      [-totalD * 0.4, totalD * 0.4].forEach((beamZ) => {
        addLocalBox(root, span, 0.07, 0.07, middleX, poleHeight, beamZ, elevatedSteel);
      });
      addLocalBox(root, span, 0.06, 0.06, middleX, poleHeight - 0.25, 0, elevatedSteelDark);
    }

    const railGroup = new THREE.Group();
    railGroup.position.set(0, poleHeight + 0.08, 0);
    railGroup.rotation.x = -tilt;
    markSolar(railGroup);
    root.add(railGroup);

    [-(totalW / 2 - 0.05), totalW / 2 - 0.05].forEach((railX) => {
      addLocalBox(railGroup, 0.06, 0.06, totalD + 0.1, railX, 0, 0, elevatedSteel);
    });

    for (let row = 0; row < elevatedRows; row += 1) {
      addLocalBox(railGroup, totalW + 0.1, 0.05, 0.04, 0, 0, oz + row * rowSpan, elevatedFrame);
    }

    for (let row = 0; row < elevatedRows; row += 1) {
      for (let col = 0; col < elevatedCols; col += 1) {
        const panelX = ox + col * colSpan;
        const panelZ = oz + row * rowSpan;
        const panelGroup = new THREE.Group();
        panelGroup.position.set(panelX, 0, panelZ);
        markSolar(panelGroup);
        railGroup.add(panelGroup);

        addLocalBox(panelGroup, panelW, 0.018, panelH, 0, -0.009, 0, mat(0x334455, { roughness: 0.6, metalness: 0.5 }));
        addLocalBox(panelGroup, panelW - 0.04, 0.012, panelH - 0.04, 0, 0.006, 0, elevatedGlass);

        [
          [panelW - 0.02, 0.022, 0.025, 0, 0.011, -(panelH / 2 - 0.0125)],
          [panelW - 0.02, 0.022, 0.025, 0, 0.011, panelH / 2 - 0.0125],
          [0.025, 0.022, panelH, -(panelW / 2 - 0.0125), 0.011, 0],
          [0.025, 0.022, panelH, panelW / 2 - 0.0125, 0.011, 0],
        ].forEach(([width, height, depth, frameX, frameY, frameZ]) => {
          addLocalBox(panelGroup, width, height, depth, frameX, frameY, frameZ, elevatedFrame);
        });

        const cellCols = 6;
        const cellRows = 4;
        const cellW = (panelW - 0.08) / cellCols;
        const cellD = (panelH - 0.06) / cellRows;
        for (let cellCol = 0; cellCol < cellCols; cellCol += 1) {
          for (let cellRow = 0; cellRow < cellRows; cellRow += 1) {
            addLocalBox(
              panelGroup,
              cellW - 0.012,
              0.008,
              cellD - 0.012,
              -panelW / 2 + 0.04 + cellW * (cellCol + 0.5),
              0.016,
              -panelH / 2 + 0.03 + cellD * (cellRow + 0.5),
              elevatedCell
            );
          }
        }

        for (let cellCol = 1; cellCol < cellCols; cellCol += 1) {
          addLocalBox(
            panelGroup,
            0.006,
            0.009,
            panelH - 0.06,
            -panelW / 2 + 0.04 + cellW * cellCol,
            0.017,
            0,
            elevatedCellLine
          );
        }

        addLocalBox(panelGroup, 0.004, 0.01, panelH - 0.06, 0, 0.018, 0, elevatedBusbar);
      }
    }

    addLocalBox(root, 0.35, 0.22, 0.15, totalW / 2 + 0.35, 0.8, 0, mat(0x667788, { roughness: 0.5, metalness: 0.7 }));
    addLocalBox(root, 0.33, 0.2, 0.05, totalW / 2 + 0.35, 0.8, 0.1, mat(0x445566, { roughness: 0.6, metalness: 0.5 }));
    return root;
  }

  if (structureType === "carport_pergola") {
    const postH = structureHeight + 0.7;
    const canopyPitch = 0.14;
    [
      [-arrW / 2, -arrD / 2],
      [arrW / 2, -arrD / 2],
      [-arrW / 2, arrD / 2],
      [arrW / 2, arrD / 2],
    ].forEach(([postX, postZ]) => {
      addLocalBox(root, 0.55, 0.22, 0.55, postX, 0.11, postZ, materials.concrete);
      addLocalBox(root, 0.14, postH, 0.06, postX, postH / 2, postZ, materials.steel);
      addLocalBox(root, 0.06, postH, 0.14, postX, postH / 2, postZ, materials.steel);
    });
    [-arrD / 2, arrD / 2].forEach((beamZ) =>
      addLocalBox(root, arrW + 0.22, 0.14, 0.08, 0, postH + 0.1, beamZ, materials.steel)
    );
    for (let i = 0; i <= cols; i += 1) {
      const beamX = -arrW / 2 + i * (arrW / Math.max(cols, 1));
      addLocalBox(root, 0.07, 0.1, arrD + 0.2, beamX, postH + 0.14, 0, materials.galv);
    }
    for (let i = 0; i < 5; i += 1) {
      const slatZ = -arrD / 2 + i * (arrD / 4);
      addLocalBox(root, arrW + 0.35, 0.055, 0.055, 0, postH + 0.24 + slatZ * canopyPitch * 0.04, slatZ, materials.timber);
    }
    addLocalBox(root, arrW + 0.6, 0.055, arrD + 0.45, 0, postH + 0.02, 0, mat(0x435569, { roughness: 0.55, metalness: 0.22 }));
    addLocalBox(root, 0.055, postH * 0.75, 0.055, -arrW / 2, postH * 0.5, 0, materials.steel, 0, 0, 0.4);
    addLocalBox(root, 0.055, postH * 0.75, 0.055, arrW / 2, postH * 0.5, 0, materials.steel, 0, 0, -0.4);
    addLocalBox(root, 1.95, 0.42, 0.95, 0, 0.42, 0, materials.carPaint);
    addLocalBox(root, 1.15, 0.3, 0.58, 0, 0.78, 0, materials.glass);
    addLocalBox(root, 0.65, 0.12, 0.98, -1.02, 0.36, 0, materials.carPaint);
    addLocalBox(root, 0.65, 0.12, 0.98, 1.02, 0.36, 0, materials.carPaint);
    addLocalBox(root, 0.3, 0.04, 0.98, -1.08, 0.52, 0, materials.chrome);
    addLocalBox(root, 0.3, 0.04, 0.98, 1.08, 0.52, 0, materials.chrome);
    [-0.58, 0.58].forEach((wheelX) =>
      [-0.35, 0.35].forEach((wheelZ) =>
        addLocalCyl(root, 0.12, 0.12, 0.08, wheelX, 0.18, wheelZ, materials.rubber, 0, 0, Math.PI / 2)
      )
    );
    positions.forEach(({ x: panelX, z: panelZ }) =>
      addPanelMesh(root, panelX, postH + 0.31 + panelZ * canopyPitch * 0.02, panelZ, structureTilt)
    );
    return root;
  }

  if (structureType === "single_axis_tracker") {
    const trackerMetrics = getSingleAxisTrackerMetrics(
      structureConfig.panelRows,
      structureConfig.panelColumns
    );
    root.scale.setScalar(
      Math.min(
        1,
        Math.max(0.28, (maxWidth * 2.4) / trackerMetrics.width),
        Math.max(0.28, (maxDepth * 3.2) / trackerMetrics.depth)
      )
    );
    addSingleAxisTrackerTable(
      root,
      structureConfig.panelRows,
      structureConfig.panelColumns,
      clamp(structureTilt, -85 * Math.PI / 180, 85 * Math.PI / 180)
    );
    return root;
  }

  if (structureType === "dual_axis_tracker") {
    const units = Math.min(count, 6);
    const trackerCols = Math.ceil(Math.sqrt(units));
    const trackerRows = Math.ceil(units / trackerCols);
    const spacingX = 5.2;
    const spacingZ = 4.8;
    let unitIndex = 0;
    for (let row = 0; row < trackerRows && unitIndex < units; row += 1) {
      for (let col = 0; col < trackerCols && unitIndex < units; col += 1) {
        const trackerX = -(trackerCols - 1) * spacingX / 2 + col * spacingX;
        const trackerZ = -(trackerRows - 1) * spacingZ / 2 + row * spacingZ;
        const mastH = structureHeight + 1.25;
        addLocalCyl(root, 0.7, 0.82, 0.28, trackerX, 0.14, trackerZ, materials.concrete, 0, 0, 0, 8);
        addLocalCyl(root, 0.09, 0.13, mastH, trackerX, mastH / 2 + 0.24, trackerZ, materials.steel, 0, 0, 0, 14);
        addLocalSphere(root, 0.17, trackerX, mastH + 0.32, trackerZ, materials.tracker);
        addLocalCyl(root, 0.34, 0.34, 0.11, trackerX, mastH + 0.39, trackerZ, materials.tracker, 0, 0, 0, 28);
        addLocalCyl(root, 0.22, 0.22, 0.13, trackerX, mastH + 0.43, trackerZ, materials.galv, 0, 0, 0, 24);
        addLocalBox(root, REFERENCE_PANEL_W * 1.7, 0.09, 0.09, trackerX, mastH + 0.52, trackerZ, materials.galv, 0, 0.12);
        addLocalBox(root, 0.08, 0.08, REFERENCE_PANEL_D * 1.55, trackerX, mastH + 0.56, trackerZ, materials.galv, 0, 0.12);
        addLocalCyl(root, 0.035, 0.035, 0.92, trackerX + 0.38, mastH + 0.58, trackerZ - 0.24, materials.chrome, 0.95, 0.12, 0);
        addLocalBox(root, 0.22, 0.18, 0.16, trackerX - 0.34, mastH + 0.36, trackerZ + 0.28, materials.tracker);
        addPanelMesh(root, trackerX, mastH + 0.72, trackerZ, structureTilt, 0.12, REFERENCE_PANEL_W * 1.32, REFERENCE_PANEL_D * 1.32);
        unitIndex += 1;
      }
    }
    addLocalBox(root, 0.78, 0.5, 0.42, -(trackerCols - 1) * spacingX / 2 - 1.25, 0.25, -(trackerRows - 1) * spacingZ / 2 - 1.1, mat(0x2c3a48, { roughness: 0.5, metalness: 0.15 }));
    addLocalBox(root, 0.34, 0.08, 0.36, -(trackerCols - 1) * spacingX / 2 - 1.25, 0.56, -(trackerRows - 1) * spacingZ / 2 - 1.1, materials.galv);
    return root;
  }

  positions.forEach(({ x: panelX, z: panelZ }) => addPanelMesh(root, panelX, 0.4, panelZ, structureTilt));
  return root;
};

const addSolarPanel = (
  group,
  {
    width,
    depth,
    x,
    y,
    z,
    material,
    structureType,
    panelIndex,
    positionRatio,
    isSelected,
    elevatedSettings = DEFAULT_ELEVATED_STRUCTURE_SETTINGS,
  }
) => {
  const isGroundMount = structureType === "ground_mount";
  const isElevated = structureType === "elevated_structure";
  const isTracker = ["single_axis_tracker", "dual_axis_tracker"].includes(structureType);
  const isDualTracker = structureType === "dual_axis_tracker";
  const isTinShed = structureType === "tin_shed";
  const isSheetRoof = ["metal_sheet_roof", "tin_shed"].includes(structureType);
  const isRcc = structureType === "rcc_rooftop";
  const isCarport = structureType === "carport_pergola";
  const structureConfig = sanitizeElevatedStructureSettings(elevatedSettings);
  const tilt = -(structureConfig.tiltAngle * Math.PI) / 180;
  const mountHeight = isCarport
    ? structureConfig.structureHeight + 0.55
    : isElevated ? structureConfig.structureHeight
    : isGroundMount ? structureConfig.structureHeight
    : isTracker ? (isDualTracker ? structureConfig.structureHeight + 0.95 : structureConfig.structureHeight + 0.15)
    : isSheetRoof ? clamp(structureConfig.structureHeight * 0.16, 0.28, 0.95)
    : clamp(structureConfig.structureHeight * 0.22, 0.45, 1.25);
  const supportMaterial = createMaterial(0x64748b, { roughness: 0.52, metalness: 0.28 });
  const railMaterial = createMaterial(0x94a3b8, { roughness: 0.46, metalness: 0.35 });
  const ballastMaterial = createMaterial(0xb8c1cc, { roughness: 0.76 });
  const concreteMaterial = createMaterial(0xa09888, { roughness: 0.88 });
  const sheetMaterial = createMaterial(structureType === "tin_shed" ? 0xb6c3d1 : 0xcdd6e2, {
    roughness: 0.48,
    metalness: 0.18,
  });
  const frameMaterial = createMaterial(0x607888, { roughness: 0.42, metalness: 0.55 });
  const darkFrameMaterial = createMaterial(0x2f3f4f, { roughness: 0.42, metalness: 0.68 });
  const panelGlassMaterial = createMaterial(0x4b8fdc, {
    roughness: 0.08,
    metalness: 0.08,
    transparent: true,
    opacity: 0.58,
  });
  const panelCellMaterial = createMaterial(0x0d2f76, { roughness: 0.16, metalness: 0.22 });
  const panelCellAltMaterial = createMaterial(0x123f91, { roughness: 0.18, metalness: 0.2 });
  const busbarMaterial = createMaterial(0xd6c35a, { roughness: 0.22, metalness: 0.7 });
  const timberMaterial = createMaterial(0x7a5230, { roughness: 0.82 });
  const rubberMaterial = createMaterial(0x171717, { roughness: 0.92 });
  const chromeMaterial = createMaterial(0xe0e8f0, { roughness: 0.18, metalness: 0.88 });
  const glassMaterial = createMaterial(0x80aacc, {
    roughness: 0.18,
    transparent: true,
    opacity: 0.62,
  });
  const markSolar = (object) => {
    object.userData.isSolarPanel = true;
    object.userData.solarPanelIndex = panelIndex;
    object.userData.solarPositionRatio = positionRatio;
    return object;
  };
  const addSolarBox = (options) => markSolar(addBox(group, options));
  const addLocalBox = (w, h, d, px, py, pz, meshMaterial) => {
    const mesh = markSolar(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), meshMaterial));
    mesh.position.set(px, py, pz);
    setShadows(mesh);
    panelGroup.add(mesh);
    return mesh;
  };
  const addWorldBox = (w, h, d, px, py, pz, meshMaterial, rx = 0, ry = 0, rz = 0) => {
    const mesh = markSolar(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), meshMaterial));
    mesh.position.set(px, py, pz);
    mesh.rotation.set(rx, ry, rz);
    setShadows(mesh);
    group.add(mesh);
    return mesh;
  };
  const addWorldCylinder = (rt, rb, h, px, py, pz, meshMaterial, rx = 0, ry = 0, rz = 0, segments = 12) => {
    const mesh = markSolar(new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, segments), meshMaterial));
    mesh.position.set(px, py, pz);
    mesh.rotation.set(rx, ry, rz);
    setShadows(mesh);
    group.add(mesh);
    return mesh;
  };

  const panelGroup = new THREE.Group();
  panelGroup.userData.isSolarPanel = true;
  panelGroup.userData.solarPanelIndex = panelIndex;
  panelGroup.userData.solarPositionRatio = positionRatio;
  panelGroup.position.set(x, y + mountHeight, z);
  panelGroup.rotation.x = tilt;
  if (structureType === "dual_axis_tracker") panelGroup.rotation.z = 0.08;
  group.add(panelGroup);

  if (isSheetRoof) {
    const roofTilt = isTinShed ? -0.28 : -0.34;
    addWorldBox(width * 1.34, 0.06, depth * 1.34, x, y + 0.08, z, sheetMaterial, roofTilt);
    for (let rib = -3; rib <= 3; rib += 1) {
      addWorldBox(0.035, 0.055, depth * 1.34, x + (width * rib) / 5.5, y + 0.13, z, railMaterial, roofTilt);
    }
    [-0.36, 0.36].forEach((railZ) => {
      addWorldBox(width * 1.04, 0.045, 0.055, x, y + 0.22, z + depth * railZ, railMaterial, roofTilt);
    });
    [-0.42, 0.42].forEach((clipX) => {
      addWorldBox(0.07, 0.09, 0.055, x + width * clipX, y + 0.27, z, railMaterial);
    });
    if (isTinShed) {
      const wallMaterial = createMaterial(0xd6d0c0, { roughness: 0.82 });
      addWorldBox(width * 1.3, 0.72, 0.12, x, y - 0.28, z + depth * 0.68, wallMaterial);
      addWorldBox(width * 0.36, 0.54, 0.08, x, y - 0.34, z + depth * 0.74, createMaterial(0x5a4028, { roughness: 0.85 }));
      addWorldCylinder(0.03, 0.03, 0.04, x + width * 0.14, y - 0.3, z + depth * 0.79, chromeMaterial, Math.PI / 2);
    } else {
      [-0.45, 0, 0.45].forEach((purlinX) => {
        addWorldBox(0.055, 0.06, depth * 1.28, x + width * purlinX, y - 0.04, z, supportMaterial);
      });
    }
  }

  if (isRcc) {
    [
      [-width * 0.34, -depth * 0.33],
      [width * 0.34, -depth * 0.33],
      [-width * 0.34, depth * 0.33],
      [width * 0.34, depth * 0.33],
    ].forEach(([blockX, blockZ]) => {
      addSolarBox({
        width: 0.22,
        height: 0.14,
        depth: 0.28,
        x: x + blockX,
        y: y + 0.08,
        z: z + blockZ,
        material: ballastMaterial,
      });
    });
    [-width * 0.38, width * 0.38].forEach((legX) => {
      addWorldBox(0.05, 0.28, 0.05, x + legX, y + mountHeight - 0.22, z - depth * 0.3, supportMaterial);
      addWorldBox(0.05, 0.14, 0.05, x + legX, y + mountHeight - 0.34, z + depth * 0.3, supportMaterial);
      addWorldBox(0.04, 0.04, depth * 0.76, x + legX, y + mountHeight - 0.25, z, railMaterial, 0.2);
    });
  }

  if (isRcc || isGroundMount || isElevated || isCarport || isTracker) {
    [-depth * 0.32, depth * 0.32].forEach((railZ) => {
      addSolarBox({
        width: width * 0.96,
        height: 0.055,
        depth: 0.06,
        x,
        y: y + Math.max(0.12, mountHeight - 0.08),
        z: z + railZ,
        material: railMaterial,
      });
    });
  }

  if (isGroundMount || isElevated || isCarport || isTracker) {
    const postPositions = isTracker
      ? [[0, 0]]
      : [
          [-width * 0.38, -depth * 0.36],
          [width * 0.38, -depth * 0.36],
          [-width * 0.38, depth * 0.36],
          [width * 0.38, depth * 0.36],
        ];

    postPositions.forEach(([postX, postZ]) => {
      if (!isTracker) {
        addSolarBox({
          width: isCarport ? 0.42 : 0.28,
          height: 0.14,
          depth: isCarport ? 0.42 : 0.28,
          x: x + postX,
          y: y + 0.07,
          z: z + postZ,
          material: concreteMaterial,
        });
      }
      const post = markSolar(new THREE.Mesh(
        new THREE.CylinderGeometry(isCarport ? 0.06 : 0.045, isCarport ? 0.06 : 0.045, mountHeight + 0.22, 10),
        supportMaterial
      ));
      post.position.set(x + postX, y + (mountHeight + 0.22) / 2, z + postZ);
      setShadows(post);
      group.add(post);
    });

    if (!isTracker) {
      [
        [-width * 0.32, 0, 0.38],
        [width * 0.32, 0, -0.38],
      ].forEach(([braceX, braceZ, direction]) => {
        const brace = markSolar(new THREE.Mesh(
          new THREE.BoxGeometry(0.045, mountHeight * 0.88, 0.045),
          supportMaterial
        ));
        brace.position.set(x + braceX, y + mountHeight * 0.48, z + braceZ);
        brace.rotation.z = direction;
        setShadows(brace);
        group.add(brace);
      });
    }

    if (isGroundMount) {
      [-depth * 0.42, 0, depth * 0.42].forEach((railZ) => {
        addWorldBox(width * 1.02, 0.052, 0.052, x, y + mountHeight - 0.16 + railZ * 0.12, z + railZ, railMaterial);
      });
      addWorldBox(width * 1.05, 0.016, 0.016, x, y + 0.2, z, busbarMaterial);
    }

    addSolarBox({
      width: isTracker ? width * 0.82 : width * 0.95,
      height: isCarport ? 0.08 : 0.06,
      depth: isTracker ? 0.12 : depth * 0.08,
      x,
      y: y + mountHeight + 0.06,
      z,
      material: supportMaterial,
    });
  }

  if (isCarport || structureType === "elevated_structure") {
    addSolarBox({
      width: width * 1.08,
      height: 0.045,
      depth: depth * 1.05,
      x,
      y: y + mountHeight - 0.16,
      z,
      material: railMaterial,
    });
  }

  if (isCarport) {
    addSolarBox({
      width: width * 1.18,
      height: 0.08,
      depth: depth * 1.18,
      x,
      y: y + mountHeight - 0.24,
      z,
      material: timberMaterial,
    });
    [-0.44, -0.22, 0, 0.22, 0.44].forEach((slatZ) => {
      addWorldBox(width * 1.22, 0.045, 0.05, x, y + mountHeight - 0.08, z + depth * slatZ, railMaterial);
    });
    [-0.46, 0.46].forEach((beamX) => {
      addWorldBox(0.06, 0.08, depth * 1.18, x + width * beamX, y + mountHeight - 0.12, z, supportMaterial);
    });
    addSolarBox({
      width: width * 0.62,
      height: 0.2,
      depth: depth * 0.42,
      x,
      y: y + 0.26,
      z,
      material: createMaterial(0x1a55a8, { roughness: 0.32, metalness: 0.22 }),
    });
    addSolarBox({
      width: width * 0.38,
      height: 0.14,
      depth: depth * 0.28,
      x,
      y: y + 0.42,
      z,
      material: glassMaterial,
    });
    addWorldBox(width * 0.24, 0.035, depth * 0.43, x - width * 0.39, y + 0.49, z, chromeMaterial);
    addWorldBox(width * 0.24, 0.035, depth * 0.43, x + width * 0.39, y + 0.49, z, chromeMaterial);
    [-0.28, 0.28].forEach((wheelX) => {
      [-0.19, 0.19].forEach((wheelZ) => {
        const wheel = markSolar(new THREE.Mesh(
          new THREE.CylinderGeometry(0.055, 0.055, 0.045, 12),
          rubberMaterial
        ));
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(x + width * wheelX, y + 0.12, z + depth * wheelZ);
        setShadows(wheel);
        group.add(wheel);
      });
    });
  }

  if (isTracker) {
    addSolarBox({
      width: isDualTracker ? 0.72 : 0.52,
      height: isDualTracker ? 0.22 : 0.18,
      depth: isDualTracker ? 0.72 : 0.52,
      x,
      y: y + (isDualTracker ? 0.11 : 0.09),
      z,
      material: concreteMaterial,
    });

    const hub = markSolar(new THREE.Mesh(
      new THREE.SphereGeometry(isDualTracker ? 0.18 : 0.14, 16, 12),
      createMaterial(0x475569, { roughness: 0.42, metalness: 0.35 })
    ));
    hub.position.set(x, y + mountHeight + 0.18, z);
    setShadows(hub);
    group.add(hub);

    const axis = markSolar(new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.045, width * 0.84, 12),
      supportMaterial
    ));
    axis.rotation.z = Math.PI / 2;
    axis.position.set(x, y + mountHeight + 0.18, z);
    setShadows(axis);
    group.add(axis);

    addWorldBox(width * 0.86, 0.045, 0.05, x, y + mountHeight + 0.26, z - depth * 0.32, railMaterial, 0, 0, isDualTracker ? 0.04 : -0.08);
    addWorldBox(width * 0.86, 0.045, 0.05, x, y + mountHeight + 0.26, z + depth * 0.32, railMaterial, 0, 0, isDualTracker ? 0.04 : -0.08);
    addWorldBox(0.22, 0.18, 0.16, x - width * 0.32, y + mountHeight + 0.04, z + depth * 0.22, createMaterial(0x303848, { roughness: 0.45, metalness: 0.35 }));

    if (isDualTracker) {
      addWorldCylinder(0.3, 0.3, 0.1, x, y + mountHeight + 0.1, z, supportMaterial, 0, 0, 0, 28);
      const secondAxis = markSolar(new THREE.Mesh(
        new THREE.CylinderGeometry(0.035, 0.035, depth * 0.72, 12),
        supportMaterial
      ));
      secondAxis.rotation.x = Math.PI / 2;
      secondAxis.position.set(x, y + mountHeight + 0.24, z);
      setShadows(secondAxis);
      group.add(secondAxis);
      addWorldCylinder(0.032, 0.032, 0.72, x + width * 0.23, y + mountHeight + 0.24, z - depth * 0.18, chromeMaterial, 0.9, 0.08, 0);
    } else {
      addWorldCylinder(0.06, 0.06, depth * 0.95, x, y + mountHeight + 0.16, z, supportMaterial, Math.PI / 2);
    }
  }

  const panel = addLocalBox(width, isElevated ? 0.05 : 0.042, depth, 0, 0, 0, material);

  if (!isElevated) {
    addLocalBox(width + 0.03, 0.032, depth + 0.03, 0, -0.024, 0, darkFrameMaterial);
    addLocalBox(width - 0.09, 0.012, depth - 0.09, 0, 0.032, 0, panelGlassMaterial);

    const cellW = (width - 0.16) / 6;
    const cellD = (depth - 0.12) / 4;
    for (let col = 0; col < 6; col += 1) {
      for (let row = 0; row < 4; row += 1) {
        addLocalBox(
          cellW - 0.012,
          0.006,
          cellD - 0.012,
          -width / 2 + 0.08 + cellW * (col + 0.5),
          0.042,
          -depth / 2 + 0.06 + cellD * (row + 0.5),
          (col + row) % 2 ? panelCellAltMaterial : panelCellMaterial
        );
      }
    }
    addLocalBox(0.007, 0.008, depth - 0.14, -width * 0.18, 0.048, 0, busbarMaterial);
    addLocalBox(0.007, 0.008, depth - 0.14, width * 0.18, 0.048, 0, busbarMaterial);
  }

  const lineMaterial = new THREE.LineBasicMaterial({
    color: 0x8ddcff,
    transparent: true,
    opacity: 0.88,
  });
  const linePoints = [];
  const topY = isElevated ? 0.033 : 0.056;
  const colCount = 6;
  const rowCount = 4;

  for (let col = 1; col < colCount; col += 1) {
    const lineX = -width / 2 + (width * col) / colCount;
    linePoints.push(
      new THREE.Vector3(lineX, topY, -depth / 2 + 0.06),
      new THREE.Vector3(lineX, topY, depth / 2 - 0.06)
    );
  }

  for (let row = 1; row < rowCount; row += 1) {
    const lineZ = -depth / 2 + (depth * row) / rowCount;
    linePoints.push(
      new THREE.Vector3(-width / 2 + 0.06, topY, lineZ),
      new THREE.Vector3(width / 2 - 0.06, topY, lineZ)
    );
  }

  const grid = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(linePoints), lineMaterial);
  markSolar(grid);
  panelGroup.add(grid);

  const frameHeight = 0.07;
  const frameThickness = 0.045;
  addLocalBox(width + frameThickness * 2, frameHeight, frameThickness, 0, 0.012, depth / 2 + frameThickness / 2, frameMaterial);
  addLocalBox(width + frameThickness * 2, frameHeight, frameThickness, 0, 0.012, -depth / 2 - frameThickness / 2, frameMaterial);
  addLocalBox(frameThickness, frameHeight, depth, -width / 2 - frameThickness / 2, 0.012, 0, frameMaterial);
  addLocalBox(frameThickness, frameHeight, depth, width / 2 + frameThickness / 2, 0.012, 0, frameMaterial);
  addLocalBox(Math.min(0.18, width * 0.22), 0.055, Math.min(0.12, depth * 0.22), 0, -0.055, 0, frameMaterial);

  const border = new THREE.LineSegments(
    new THREE.EdgesGeometry(panel.geometry),
    new THREE.LineBasicMaterial({
      color: isSelected ? 0xfbbf24 : 0xbfecff,
      transparent: true,
      opacity: isSelected ? 1 : 0.95,
    })
  );
  markSolar(border);
  panelGroup.add(border);

  return panelGroup;
};

const addTree = (group, x, z, scale = 1) => {
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12 * scale, 0.16 * scale, 1.2 * scale, 10),
    createMaterial(0x7c4a28, { roughness: 0.85 })
  );
  trunk.position.set(x, 0.95 * scale, z);
  setShadows(trunk);
  group.add(trunk);

  const leaves = new THREE.Mesh(
    new THREE.SphereGeometry(0.72 * scale, 16, 12),
    createMaterial(0x2f855a, { roughness: 0.8 })
  );
  leaves.position.set(x, 1.65 * scale, z);
  setShadows(leaves);
  group.add(leaves);
};

const addRoadMarkings = (group, road) => {
  const isHorizontal = road.width >= road.depth;
  const stripeCount = isHorizontal ? Math.floor(road.width / 4) : Math.floor(road.depth / 4);
  const stripeMaterial = createMaterial(0xf8fafc, {
    roughness: 0.7,
    transparent: true,
    opacity: 0.7,
  });

  for (let index = -stripeCount / 2; index < stripeCount / 2; index += 1) {
    addBox(group, {
      width: isHorizontal ? 1.6 : 0.08,
      height: 0.03,
      depth: isHorizontal ? 0.08 : 1.6,
      x: road.x + (isHorizontal ? index * 4 : 0),
      y: 0.48,
      z: road.z + (isHorizontal ? 0 : index * 4),
      material: stripeMaterial,
      cast: false,
      receive: false,
    });
  }
};

const addContextBuildingBox = (group, building) => {
  const palette = [0xe9e2d3, 0xf2eee6, 0xd8dee9, 0xe7d8c9, 0xeef2f7];
  const wallColor = building.color || palette[building.index % palette.length];
  const roofColor = building.roofColor || 0xe7ecf4;
  const body = addBox(group, {
    width: building.width,
    height: building.height,
    depth: building.depth,
    x: building.x,
    y: 0.45 + building.height / 2,
    z: building.z,
    color: wallColor,
  });
  addEdges(group, body, 0x94a3b8, 0.45);

  const roof = addBox(group, {
    width: building.width + 0.28,
    height: 0.22,
    depth: building.depth + 0.28,
    x: building.x,
    y: 0.45 + building.height + 0.12,
    z: building.z,
    color: roofColor,
  });
  addEdges(group, roof, 0x8ea0b8, 0.35);

  if (building.width > 2.8) {
    addBox(group, {
      width: Math.min(1.2, building.width * 0.32),
      height: 0.75,
      depth: 0.06,
      x: building.x - building.width * 0.18,
      y: 0.45 + building.height * 0.52,
      z: building.z + building.depth / 2 + 0.04,
      color: 0x6aa5cc,
    });
  }
};

const getStaticMapSceneSize = (transform) => {
  const lat = transform.center?.lat || DEFAULT_CENTER.lat;
  const metersPerPixel =
    (156543.03392 * Math.cos((lat * Math.PI) / 180)) /
    Math.pow(2, STATIC_MAP_ZOOM);
  const mapSpanMeters = STATIC_MAP_SIZE * metersPerPixel;
  const sceneSpan = mapSpanMeters * transform.scale;
  const minSpan = Math.max(transform.houseWidth, transform.houseDepth) + 56;
  return clamp(sceneSpan, minSpan, 190);
};

const addSatelliteRoofSurface = (
  group,
  { footprint, y }
) => {
  const roofMaterial = createMaterial(0xd8e2ef, {
    roughness: 0.76,
    metalness: 0,
    side: THREE.DoubleSide,
  });
  const roof = addFootprintPlane(group, {
    footprint,
    y,
    material: roofMaterial,
    cast: false,
  });
  return roof;
};

const addSatelliteGround = (
  group,
  transform,
  satelliteTextureUrl,
  environmentMode = "day",
  onTextureReady
) => {
  const environment = getEnvironmentPreset(environmentMode);
  const size = getStaticMapSceneSize(transform);
  const groundGroup = new THREE.Group();
  groundGroup.rotation.y = satelliteTextureUrl ? -(transform.houseRotationY || 0) : 0;
  group.add(groundGroup);

  const groundMaterial = createMaterial(environment.groundColor, {
    roughness: 0.9,
    metalness: 0,
    side: THREE.DoubleSide,
  });

  if (satelliteTextureUrl) {
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    loader.load(
      satelliteTextureUrl,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = 8;
        groundMaterial.map = texture;
        groundMaterial.color.set(environment.satelliteTint);
        groundMaterial.needsUpdate = true;
        onTextureReady?.();
      },
      undefined,
      () => {
        groundMaterial.color.set(environment.groundColor);
        groundMaterial.needsUpdate = true;
        onTextureReady?.();
      }
    );
  }

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(size, size), groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0.03;
  ground.receiveShadow = true;
  groundGroup.add(ground);

  const border = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.PlaneGeometry(size, size)),
    new THREE.LineBasicMaterial({ color: environment.borderColor, transparent: true, opacity: 0.55 })
  );
  border.rotation.x = -Math.PI / 2;
  border.position.y = 0.06;
  groundGroup.add(border);

  return size;
};

const getFallbackContextBoxes = (houseWidth, houseDepth) => {
  const left = -houseWidth / 2;
  const right = houseWidth / 2;
  const front = houseDepth / 2;
  const back = -houseDepth / 2;

  return [
    { x: left - 5.4, z: -houseDepth * 0.15, width: 5.4, depth: houseDepth * 0.9, height: 4.8 },
    { x: left - 12.2, z: -houseDepth * 0.08, width: 5.2, depth: houseDepth * 0.68, height: 6.1 },
    { x: right + 5.8, z: -houseDepth * 0.12, width: 5.8, depth: houseDepth * 0.82, height: 5.4 },
    { x: right + 12.4, z: -houseDepth * 0.32, width: 4.8, depth: houseDepth * 0.64, height: 4.5 },
    { x: -houseWidth * 0.22, z: back - 6.6, width: houseWidth * 0.42, depth: 4.8, height: 5.8 },
    { x: houseWidth * 0.32, z: back - 12.4, width: houseWidth * 0.34, depth: 5.4, height: 4.9 },
    { x: -houseWidth * 0.34, z: front + 6.6, width: houseWidth * 0.34, depth: 4.8, height: 4.6 },
    { x: houseWidth * 0.34, z: front + 12.2, width: houseWidth * 0.36, depth: 5.6, height: 5.7 },
  ];
};

const addNeighborhoodContext = (
  group,
  contextBuildings,
  transform,
  satelliteTextureUrl,
  environmentMode = "day",
  onTextureReady
) => {
  const environment = getEnvironmentPreset(environmentMode);
  const { houseWidth, houseDepth, scale } = transform;
  const satelliteSize = addSatelliteGround(
    group,
    transform,
    satelliteTextureUrl,
    environmentMode,
    onTextureReady
  );

  if (satelliteTextureUrl) return;

  const siteWidth = Math.max(satelliteSize, houseWidth + 42);
  const siteDepth = Math.max(satelliteSize * 0.78, houseDepth + 38);

  addBox(group, {
    width: siteWidth,
    height: 0.08,
    depth: siteDepth,
    y: 0.04,
    color: environment.groundColor,
    cast: false,
  });

  const roads = [
    {
      width: siteWidth,
      depth: 3.3,
      x: 0,
      z: houseDepth / 2 + 5.1,
    },
    {
      width: 3.3,
      depth: siteDepth,
      x: houseWidth / 2 + 5.2,
      z: 0,
    },
  ];
  roads.forEach((road) => {
    addBox(group, {
      width: road.width,
      height: 0.1,
      depth: road.depth,
      x: road.x,
      y: 0.32,
      z: road.z,
      color: 0xb8c1cc,
      cast: false,
    });
    addRoadMarkings(group, road);
  });

  const renderedBuildings = [];

  contextBuildings.forEach((building, index) => {
    const scenePoints = building.footprint.map((point) => transform.toScene(point));
    const xs = scenePoints.map((point) => point.x);
    const zs = scenePoints.map((point) => point.z);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minZ = Math.min(...zs);
    const maxZ = Math.max(...zs);
    const width = maxX - minX;
    const depth = maxZ - minZ;
    const x = minX + width / 2;
    const z = minZ + depth / 2;
    const overlapsSelected =
      maxX > -houseWidth / 2 - 0.8 &&
      minX < houseWidth / 2 + 0.8 &&
      maxZ > -houseDepth / 2 - 0.8 &&
      minZ < houseDepth / 2 + 0.8;

    if (
      overlapsSelected ||
      Math.abs(x) > siteWidth / 2 - 2 ||
      Math.abs(z) > siteDepth / 2 - 2 ||
      width < 1.2 ||
      depth < 1.2
    ) {
      return;
    }

    renderedBuildings.push({
      x,
      z,
      width: clamp(width, 1.8, 10),
      depth: clamp(depth, 1.8, 10),
      height: clamp(building.heightMeters * scale, 2.4, 8.5),
      index,
    });
  });

  const boxes = renderedBuildings.length
    ? renderedBuildings.slice(0, 18)
    : getFallbackContextBoxes(houseWidth, houseDepth);

  boxes.forEach((building, index) =>
    addContextBuildingBox(group, {
      ...building,
      width: clamp(building.width, 1.8, 10),
      depth: clamp(building.depth, 1.8, 12),
      height: clamp(building.height, 2.4, 8.5),
      index,
    })
  );

  [
    [-siteWidth * 0.35, -siteDepth * 0.34, 1.1],
    [-siteWidth * 0.26, houseDepth / 2 + 7.8, 0.9],
    [houseWidth / 2 + 8.1, -siteDepth * 0.28, 1.0],
    [siteWidth * 0.32, siteDepth * 0.24, 1.15],
    [-siteWidth * 0.42, siteDepth * 0.22, 0.85],
  ].forEach(([x, z, treeScale]) => addTree(group, x, z, treeScale));
};

const addBaseScene = (group, environmentMode = "day") => {
  const environment = getEnvironmentPreset(environmentMode);
  const slab = addBox(group, {
    width: 34,
    height: 0.45,
    depth: 24,
    y: 0.22,
    color: environment.groundColor,
    cast: false,
  });
  addEdges(group, slab, environment.borderColor, 0.8);

  const ghost = addBox(group, {
    width: 20,
    height: 5,
    depth: 12,
    y: 2.95,
    color: 0xffffff,
    cast: false,
    material: createMaterial(0xffffff, {
      transparent: true,
      opacity: 0.32,
      roughness: 0.9,
    }),
  });
  addEdges(group, ghost, 0x64748b, 0.55);
};

const addRoofModel = (
  group,
  points,
  metrics,
  contextBuildings = [],
  satelliteTextureUrl = "",
  solarLayout = DEFAULT_SOLAR_LAYOUT,
  environmentMode = "day",
  onTextureReady
) => {
  const transform = getSiteTransform(points, metrics);
  console.info("[3d-preview] roof transform completed");
  if (!transform) {
    addBaseScene(group, environmentMode);
    return;
  }

  const { houseWidth, houseDepth, wallHeight, footprint } = transform;
  const footprintBounds = transform.footprintBounds || getSceneBounds(footprint);
  const roofSlabHeight = 0.24;
  const parapetHeight = 0.38;
  const parapetThickness = 0.18;
  const frontZ = footprintBounds.maxZ;
  const backZ = footprintBounds.minZ;
  const leftX = footprintBounds.minX;
  const rightX = footprintBounds.maxX;

  const wallMaterial = createMaterial(0xe8dcc8, {
    roughness: 0.76,
    side: THREE.DoubleSide,
  });
  const trimMaterial = createMaterial(0xc9b18f, {
    roughness: 0.72,
    side: THREE.DoubleSide,
  });
  const accentMaterial = createMaterial(0x8a6a4d, {
    roughness: 0.58,
  });
  const roofEdgeMaterial = createMaterial(0x707985, {
    roughness: 0.56,
    metalness: 0.1,
  });
  const pillarMaterial = createMaterial(0xd7c3a5, {
    roughness: 0.74,
  });
  const porchMaterial = createMaterial(0xb99567, {
    roughness: 0.78,
  });
  const panelMaterial = createMaterial(0x1d63d8, {
    roughness: 0.32,
    metalness: 0.12,
    emissive: new THREE.Color(0x082a5d),
    emissiveIntensity: 0.1,
  });

  addNeighborhoodContext(
    group,
    contextBuildings,
    transform,
    satelliteTextureUrl,
    environmentMode,
    onTextureReady
  );
  console.info("[3d-preview] neighborhood completed");

  const groundPad = addFootprintMesh(group, {
    footprint,
    height: 0.35,
    y: 0,
    material: createMaterial(0xd8e2ef, {
      roughness: 0.9,
      side: THREE.DoubleSide,
    }),
    cast: false,
  });
  if (groundPad) addEdges(group, groundPad, 0xb7c2d0, 0.45);
  console.info("[3d-preview] ground pad completed");

  const house = addFootprintMesh(group, {
    footprint,
    height: wallHeight,
    y: 0.35,
    material: wallMaterial,
  });
  if (house) addEdges(group, house, 0xb7c2d0, 0.55);
  console.info("[3d-preview] house footprint completed");

  addFootprintMesh(group, {
    footprint,
    height: 0.58,
    y: 0.35,
    material: createMaterial(0xc8b89a, { roughness: 0.92 }),
  });

  const isRectangularFootprint = footprint.length === 4;
  const floorBandY = 0.35 + wallHeight * 0.48;
  const cornerPillarSize = clamp(Math.min(houseWidth, houseDepth) * 0.03, 0.22, 0.34);
  if (isRectangularFootprint) {
    addBox(group, {
      width: houseWidth + 0.18,
      height: 0.14,
      depth: 0.18,
      y: floorBandY,
      z: frontZ + 0.09,
      material: trimMaterial,
    });
    addBox(group, {
      width: houseWidth + 0.18,
      height: 0.14,
      depth: 0.18,
      y: floorBandY,
      z: backZ - 0.09,
      material: trimMaterial,
    });
    addBox(group, {
      width: 0.18,
      height: 0.14,
      depth: houseDepth + 0.18,
      x: leftX - 0.09,
      y: floorBandY,
      material: trimMaterial,
    });
    addBox(group, {
      width: 0.18,
      height: 0.14,
      depth: houseDepth + 0.18,
      x: rightX + 0.09,
      y: floorBandY,
      material: trimMaterial,
    });

    [
      [leftX + cornerPillarSize / 2, frontZ - cornerPillarSize / 2],
      [rightX - cornerPillarSize / 2, frontZ - cornerPillarSize / 2],
      [leftX + cornerPillarSize / 2, backZ + cornerPillarSize / 2],
      [rightX - cornerPillarSize / 2, backZ + cornerPillarSize / 2],
    ].forEach(([x, z]) => {
      addBox(group, {
        width: cornerPillarSize,
        height: wallHeight,
        depth: cornerPillarSize,
        x,
        y: 0.35 + wallHeight / 2,
        z,
        material: pillarMaterial,
      });
    });
  }

  const roofSlab = addFootprintMesh(group, {
    footprint,
    height: roofSlabHeight,
    y: wallHeight + 0.35,
    material: trimMaterial,
  });
  if (roofSlab) addEdges(group, roofSlab, 0x8ea0b8, 0.7);
  console.info("[3d-preview] roof slab completed");

  const roofTopY = wallHeight + 0.35 + roofSlabHeight;
  addPolygonEdgeWalls(group, footprint, {
    y: roofTopY + parapetHeight / 2,
    height: parapetHeight,
    thickness: parapetThickness,
    material: roofEdgeMaterial,
  });
  addFootprintOutline(group, footprint, roofTopY + parapetHeight + 0.03, 0x8ea0b8, 0.95);

  addSatelliteRoofSurface(group, {
    footprint,
    y: roofTopY + 0.07,
    transform,
    satelliteTextureUrl,
    environmentMode,
    onTextureReady,
  });
  console.info("[3d-preview] roof surface completed");

  if (isRectangularFootprint) {
    const porchWidth = clamp(houseWidth * 0.34, 2.8, 4.6);
    const porchDepth = clamp(houseDepth * 0.14, 1.25, 1.9);
    const porchX = -houseWidth * 0.16;
    const porchY = 0.48;
    addBox(group, {
      width: porchWidth,
      height: 0.16,
      depth: porchDepth,
      x: porchX,
      y: porchY,
      z: frontZ + porchDepth / 2 - 0.04,
      material: porchMaterial,
    });
    addBox(group, {
      width: porchWidth * 0.9,
      height: 0.1,
      depth: porchDepth * 0.68,
      x: porchX,
      y: porchY - 0.14,
      z: frontZ + porchDepth * 0.46,
      material: createMaterial(0xcab18b, { roughness: 0.82 }),
    });

    addBox(group, {
      width: houseWidth + 0.12,
      height: 0.42,
      depth: 0.16,
      y: 0.86,
      z: frontZ + 0.09,
      material: accentMaterial,
    });
    addBox(group, {
      width: houseWidth + 0.12,
      height: 0.28,
      depth: 0.16,
      y: wallHeight + 0.08,
      z: frontZ + 0.09,
      material: accentMaterial,
    });

  }
  console.info("[3d-preview] facade completed");

  const pipePositions = isRectangularFootprint
    ? [
        { x: -houseWidth / 2 + 0.1, z: backZ + 0.05 },
        { x: houseWidth / 2 - 0.1, z: backZ + 0.05 },
      ]
    : footprint
        .slice()
        .sort((a, b) => a.z - b.z)
        .slice(0, 2)
        .map((point) => ({ x: point.x, z: point.z }));
  pipePositions.forEach((position) => {
    const pipeHeight = wallHeight + 2;
    const pipe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, pipeHeight, 8),
      createMaterial(0x8090a0, { roughness: 0.5, metalness: 0.3 })
    );
    pipe.position.set(position.x, 0.35 + pipeHeight / 2, position.z);
    setShadows(pipe);
    group.add(pipe);
  });
  console.info("[3d-preview] pipes completed");

  const usableXMin = leftX + 1.05;
  const usableXMax = rightX - 1.05;
  const usableZMin = backZ + 1.05;
  const usableZMax = frontZ - 1.05;
  const usableWidth = Math.max(1, usableXMax - usableXMin);
  const usableDepth = Math.max(1, usableZMax - usableZMin);
  const solarDragSurface = addFootprintPlane(group, {
    footprint,
    y: roofTopY + 0.32,
    material: new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
    cast: false,
    receive: false,
  });
  if (solarDragSurface) {
    solarDragSurface.userData.isSolarDragSurface = true;
    solarDragSurface.userData.solarBounds = {
      usableXMin,
      usableXMax,
      usableZMin,
      usableZMax,
      usableWidth,
      usableDepth,
    };
  }

  const solarConfig = sanitizeSolarLayout(solarLayout);
  if (solarConfig.count > 0) {
    const solarGap = 0.18;
    const solarCols = Math.min(4, solarConfig.count);
    const solarRows = Math.ceil(solarConfig.count / solarCols);
    const solarPanelWidth = clamp(
      (usableWidth - solarGap * (solarCols - 1)) / solarCols,
      0.9,
      2.15
    );
    const solarPanelDepth = clamp(
      (usableDepth - solarGap * (solarRows - 1)) / solarRows,
      1.15,
      1.85
    );
    const solarArrayWidth = solarCols * solarPanelWidth + (solarCols - 1) * solarGap;
    const solarArrayDepth = solarRows * solarPanelDepth + (solarRows - 1) * solarGap;
    const solarCenterX = clamp(
      usableXMin + usableWidth * solarConfig.xRatio,
      usableXMin + solarArrayWidth / 2,
      usableXMax - solarArrayWidth / 2
    );
    const solarCenterZ = clamp(
      usableZMin + usableDepth * solarConfig.zRatio,
      usableZMin + solarArrayDepth / 2,
      usableZMax - solarArrayDepth / 2
    );
    const solarBaseX = solarCenterX - solarArrayWidth / 2 + solarPanelWidth / 2;
    const solarBaseZ = solarCenterZ - solarArrayDepth / 2 + solarPanelDepth / 2;
    const hasPanelOverrides =
      solarConfig.panelPositions.some(Boolean) || solarConfig.panelStructureTypes.some(Boolean);
    const canUseReferenceModel =
      solarConfig.selectedPanelIndex === -1 &&
      ["elevated_structure", "single_axis_tracker"].includes(solarConfig.structureType) &&
      !hasPanelOverrides;

    if (canUseReferenceModel) {
      addReferenceSolarStructure(group, {
        count: solarConfig.count,
        structureType: solarConfig.structureType,
        x: solarCenterX,
        y: roofTopY + 0.24,
        z: solarCenterZ,
        maxWidth: Math.max(solarArrayWidth, solarPanelWidth),
        maxDepth: Math.max(solarArrayDepth, solarPanelDepth),
        positionRatio: {
          xRatio: clamp((solarCenterX - usableXMin) / usableWidth, 0, 1),
          zRatio: clamp((solarCenterZ - usableZMin) / usableDepth, 0, 1),
        },
        elevatedSettings: solarConfig.elevatedSettings,
      });
    } else {
      for (let index = 0; index < solarConfig.count; index += 1) {
        const row = Math.floor(index / solarCols);
        const col = index % solarCols;
        if (row < solarRows) {
          const defaultX = solarBaseX + col * (solarPanelWidth + solarGap);
          const defaultZ = solarBaseZ + row * (solarPanelDepth + solarGap);
          const customPosition = solarConfig.panelPositions[index];
          const panelX = customPosition
            ? clamp(
                usableXMin + usableWidth * customPosition.xRatio,
                usableXMin + solarPanelWidth / 2,
                usableXMax - solarPanelWidth / 2
              )
            : defaultX;
          const panelZ = customPosition
            ? clamp(
                usableZMin + usableDepth * customPosition.zRatio,
                usableZMin + solarPanelDepth / 2,
                usableZMax - solarPanelDepth / 2
              )
            : defaultZ;
          const positionRatio = {
            xRatio: clamp((panelX - usableXMin) / usableWidth, 0, 1),
            zRatio: clamp((panelZ - usableZMin) / usableDepth, 0, 1),
          };
          addSolarPanel(group, {
            width: solarPanelWidth,
            depth: solarPanelDepth,
            x: panelX,
            y: roofTopY + 0.24,
            z: panelZ,
            material: panelMaterial,
            structureType: solarConfig.panelStructureTypes[index] || solarConfig.structureType,
            panelIndex: index,
            positionRatio,
            isSelected:
              solarConfig.selectedPanelIndex === -1 || solarConfig.selectedPanelIndex === index,
            elevatedSettings: solarConfig.elevatedSettings,
          });
        }
      }
    }
  }
  console.info("[3d-preview] solar layout completed");

  console.info("[3d-preview] roof model geometry completed");
};

const ThreeHousePreview = ({
  modelPoints,
  metrics,
  contextBuildings = EMPTY_CONTEXT_BUILDINGS,
  satelliteTextureUrl,
  solarLayout,
  sunSettings = DEFAULT_SUN_SETTINGS,
  environmentMode = "day",
  onSolarLayoutChange,
  onCaptureReady,
  height = { xs: 340, md: 520 },
}) => {
  const safeEnvironmentMode = getEnvironmentMode(environmentMode);
  const environment = getEnvironmentPreset(safeEnvironmentMode);
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const groupRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const hemiLightRef = useRef(null);
  const sunLightRef = useRef(null);
  const sunTargetRef = useRef(null);
  const sunPathGroupRef = useRef(null);
  const frameRef = useRef(null);
  const requestRenderRef = useRef(() => {});
  const sceneBuiltRef = useRef(false);
  const [isSceneBuilding, setIsSceneBuilding] = useState(true);
  const cameraControlsRef = useRef({
    zoomIn: () => {},
    zoomOut: () => {},
    reset: () => {},
  });
  const raycasterRef = useRef(new THREE.Raycaster());
  const pointerRef = useRef(new THREE.Vector2());
  const solarLayoutRef = useRef(sanitizeSolarLayout(solarLayout));
  const onSolarLayoutChangeRef = useRef(onSolarLayoutChange);
  const interactionRef = useRef({
    active: false,
    mode: null,
    lastX: 0,
    lastY: 0,
    solarOffsetX: 0,
    solarOffsetZ: 0,
    targetPanelIndex: -1,
    dragLastX: 0,
    dragLastZ: 0,
    dragTargets: [],
    pendingLayout: null,
    pinchDistance: 0,
  });

  useEffect(() => {
    solarLayoutRef.current = sanitizeSolarLayout(solarLayout);
  }, [solarLayout]);

  useEffect(() => {
    onSolarLayoutChangeRef.current = onSolarLayoutChange;
  }, [onSolarLayoutChange]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    console.info("[3d-preview] scene setup started");
    const initialEnvironment = getEnvironmentPreset("day");
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(initialEnvironment.skyColor);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    const cameraTarget = new THREE.Vector3(0, 6, 0);
    camera.position.set(34, 28, 46);
    camera.lookAt(cameraTarget);
    cameraRef.current = camera;

    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1);
    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      precision: "mediump",
      powerPreference: "high-performance",
      preserveDrawingBuffer: true,
      stencil: false,
    });
    console.info("[3d-preview] WebGL renderer created");
    renderer.setPixelRatio(pixelRatio);
    renderer.shadowMap.enabled = false;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.shadowMap.autoUpdate = false;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.current = renderer;
    mount.appendChild(renderer.domElement);

    const hemiLight = new THREE.HemisphereLight(
      initialEnvironment.hemiSkyColor,
      initialEnvironment.hemiGroundColor,
      initialEnvironment.hemiIntensity
    );
    hemiLightRef.current = hemiLight;
    scene.add(hemiLight);

    const sun = new THREE.DirectionalLight(
      initialEnvironment.sunColor,
      initialEnvironment.sunIntensity
    );
    sun.position.set(32, 48, 24);
    sun.castShadow = ENABLE_3D_SHADOWS;
    sun.shadow.mapSize.width = 1024;
    sun.shadow.mapSize.height = 1024;
    sun.shadow.camera.left = -70;
    sun.shadow.camera.right = 70;
    sun.shadow.camera.top = 70;
    sun.shadow.camera.bottom = -70;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 180;
    sun.shadow.bias = -0.0008;
    sunLightRef.current = sun;
    scene.add(sun);

    const sunTarget = new THREE.Object3D();
    sunTarget.position.set(0, 0, 0);
    sunTargetRef.current = sunTarget;
    scene.add(sunTarget);
    sun.target = sunTarget;

    const sunPathGroup = new THREE.Group();
    sunPathGroupRef.current = sunPathGroup;
    scene.add(sunPathGroup);

    const modelGroup = new THREE.Group();
    modelGroup.rotation.y = -0.38;
    groupRef.current = modelGroup;
    scene.add(modelGroup);

    let renderQueued = false;
    const requestRender = () => {
      if (renderQueued) return;
      renderQueued = true;
      frameRef.current = requestAnimationFrame(() => {
        renderQueued = false;
        console.info("[3d-preview] frame render started");
        renderer.render(scene, camera);
        console.info("[3d-preview] frame render completed");
      });
    };
    requestRenderRef.current = requestRender;

    const resize = () => {
      const rect = mount.getBoundingClientRect();
      const width = Math.max(1, rect.width);
      const height = Math.max(1, rect.height);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      requestRender();
    };

    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();

    const activePointers = new Map();
    const getPointerDistance = () => {
      const pointers = Array.from(activePointers.values());
      if (pointers.length < 2) return 0;
      return Math.hypot(pointers[0].x - pointers[1].x, pointers[0].y - pointers[1].y);
    };
    const zoomCamera = (scalar) => {
      const offset = camera.position.clone().sub(cameraTarget);
      const nextDistance = clamp(offset.length() * scalar, 18, 130);
      offset.setLength(nextDistance);
      camera.position.copy(cameraTarget).add(offset);
      camera.lookAt(cameraTarget);
      requestRender();
    };
    const resetCamera = () => {
      camera.position.set(34, 28, 46);
      camera.lookAt(cameraTarget);
      if (groupRef.current) {
        groupRef.current.rotation.set(0, -0.38, 0);
      }
      requestRender();
    };
    cameraControlsRef.current = {
      zoomIn: () => zoomCamera(0.84),
      zoomOut: () => zoomCamera(1.18),
      reset: resetCamera,
    };

    const updatePointer = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointerRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointerRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycasterRef.current.setFromCamera(pointerRef.current, camera);
    };

    const isSolarObject = (object) => {
      let current = object;
      while (current) {
        if (current.userData?.isSolarPanel) return true;
        current = current.parent;
      }
      return false;
    };

    const getSolarData = (object) => {
      let current = object;
      while (current) {
        if (current.userData?.isSolarPanel) {
          return {
            panelIndex: Number.isFinite(current.userData.solarPanelIndex)
              ? current.userData.solarPanelIndex
              : null,
            positionRatio: current.userData.solarPositionRatio || null,
          };
        }
        current = current.parent;
      }
      return { panelIndex: null, positionRatio: null };
    };

    const matchesSolarTarget = (object, targetPanelIndex) => {
      if (!isSolarObject(object)) return false;
      if (targetPanelIndex === -1) return true;
      return getSolarData(object).panelIndex === targetPanelIndex;
    };

    const hasMatchingSolarAncestor = (object, targetPanelIndex) => {
      let current = object.parent;
      while (current && current !== groupRef.current) {
        if (matchesSolarTarget(current, targetPanelIndex)) return true;
        current = current.parent;
      }
      return false;
    };

    const getSolarDragTargets = (targetPanelIndex) => {
      const targets = [];
      groupRef.current?.traverse((child) => {
        if (child === groupRef.current) return;
        if (!matchesSolarTarget(child, targetPanelIndex)) return;
        if (hasMatchingSolarAncestor(child, targetPanelIndex)) return;
        targets.push(child);
      });
      return targets;
    };

    const getSolarHit = (event) => {
      if (!groupRef.current) return null;
      updatePointer(event);
      return raycasterRef.current
        .intersectObjects(groupRef.current.children, true)
        .find((hit) => isSolarObject(hit.object));
    };

    const getSolarSurfaceHit = (event) => {
      if (!groupRef.current) return null;
      let surface = null;
      groupRef.current.traverse((child) => {
        if (!surface && child.userData?.isSolarDragSurface) surface = child;
      });
      if (!surface) return null;
      updatePointer(event);
      return raycasterRef.current.intersectObject(surface, false)[0] || null;
    };

    const onPointerDown = (event) => {
      activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (activePointers.size >= 2) {
        interactionRef.current = {
          ...interactionRef.current,
          active: true,
          mode: "pinch",
          pinchDistance: getPointerDistance(),
        };
        renderer.domElement.style.cursor = "grabbing";
        renderer.domElement.setPointerCapture?.(event.pointerId);
        event.preventDefault();
        return;
      }

      const solarHit = getSolarHit(event);
      const surfaceHit = solarHit ? getSolarSurfaceHit(event) : null;

      if (solarHit && surfaceHit && onSolarLayoutChangeRef.current) {
        const localPoint = groupRef.current.worldToLocal(surfaceHit.point.clone());
        const bounds = surfaceHit.object.userData.solarBounds;
        const currentLayout = sanitizeSolarLayout(solarLayoutRef.current);
        const solarData = getSolarData(solarHit.object);
        const targetPanelIndex =
          currentLayout.selectedPanelIndex === -1
            ? -1
            : solarData.panelIndex ?? currentLayout.selectedPanelIndex;
        const targetPosition =
          targetPanelIndex >= 0
            ? currentLayout.panelPositions[targetPanelIndex] ||
              solarData.positionRatio || {
                xRatio: currentLayout.xRatio,
                zRatio: currentLayout.zRatio,
              }
            : {
                xRatio: currentLayout.xRatio,
                zRatio: currentLayout.zRatio,
              };
        const currentX = bounds.usableXMin + bounds.usableWidth * targetPosition.xRatio;
        const currentZ = bounds.usableZMin + bounds.usableDepth * targetPosition.zRatio;

        if (targetPanelIndex !== currentLayout.selectedPanelIndex) {
          const nextLayout = {
            ...currentLayout,
            selectedPanelIndex: targetPanelIndex,
          };
          solarLayoutRef.current = nextLayout;
        }

        interactionRef.current = {
          active: true,
          mode: "solar",
          lastX: event.clientX,
          lastY: event.clientY,
          solarOffsetX: localPoint.x - currentX,
          solarOffsetZ: localPoint.z - currentZ,
          targetPanelIndex,
          dragLastX: currentX,
          dragLastZ: currentZ,
          dragTargets: getSolarDragTargets(targetPanelIndex),
          pendingLayout: null,
        };
        renderer.domElement.style.cursor = "grabbing";
        renderer.domElement.setPointerCapture?.(event.pointerId);
        event.preventDefault();
        return;
      }

      interactionRef.current = {
        ...interactionRef.current,
        active: true,
        mode: "rotate",
        lastX: event.clientX,
        lastY: event.clientY,
      };
      renderer.domElement.setPointerCapture?.(event.pointerId);
      event.preventDefault();
    };

    const onPointerMove = (event) => {
      if (activePointers.has(event.pointerId)) {
        activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      }

      const interaction = interactionRef.current;
      if (interaction.mode === "pinch") {
        const nextDistance = getPointerDistance();
        if (nextDistance > 0 && interaction.pinchDistance > 0) {
          zoomCamera(interaction.pinchDistance / nextDistance);
          interaction.pinchDistance = nextDistance;
        }
        event.preventDefault();
        return;
      }

      if (!interaction.active || !groupRef.current) return;

      if (interaction.mode === "solar") {
        const surfaceHit = getSolarSurfaceHit(event);
        if (!surfaceHit) return;

        const localPoint = groupRef.current.worldToLocal(surfaceHit.point.clone());
        const bounds = surfaceHit.object.userData.solarBounds;
        const nextX = clamp(
          localPoint.x - interaction.solarOffsetX,
          bounds.usableXMin,
          bounds.usableXMax
        );
        const nextZ = clamp(
          localPoint.z - interaction.solarOffsetZ,
          bounds.usableZMin,
          bounds.usableZMax
        );
        const currentLayout = sanitizeSolarLayout(solarLayoutRef.current);
        const nextRatio = {
          xRatio: clamp((nextX - bounds.usableXMin) / bounds.usableWidth, 0, 1),
          zRatio: clamp((nextZ - bounds.usableZMin) / bounds.usableDepth, 0, 1),
        };
        const targetPanelIndex = interaction.targetPanelIndex;
        const nextLayout =
          targetPanelIndex >= 0
            ? {
                ...currentLayout,
                selectedPanelIndex: targetPanelIndex,
                panelPositions: currentLayout.panelPositions.map((position, index) =>
                  index === targetPanelIndex ? nextRatio : position
                ),
              }
            : {
                ...currentLayout,
                xRatio: nextRatio.xRatio,
                zRatio: nextRatio.zRatio,
                panelPositions: currentLayout.panelPositions.map((position) =>
                  position
                    ? {
                        xRatio: clamp(
                          position.xRatio + nextRatio.xRatio - currentLayout.xRatio,
                          0,
                          1
                        ),
                        zRatio: clamp(
                          position.zRatio + nextRatio.zRatio - currentLayout.zRatio,
                          0,
                          1
                        ),
                      }
                    : position
                ),
              };
        const deltaX = nextX - interaction.dragLastX;
        const deltaZ = nextZ - interaction.dragLastZ;
        interaction.dragTargets.forEach((target) => {
          target.position.x += deltaX;
          target.position.z += deltaZ;
        });
        interaction.dragLastX = nextX;
        interaction.dragLastZ = nextZ;
        interaction.pendingLayout = nextLayout;
        solarLayoutRef.current = nextLayout;
        requestRender();
        event.preventDefault();
        return;
      }

      const dx = event.clientX - interaction.lastX;
      const dy = event.clientY - interaction.lastY;
      interaction.lastX = event.clientX;
      interaction.lastY = event.clientY;
      groupRef.current.rotation.y += dx * 0.01;
      groupRef.current.rotation.x = clamp(
        groupRef.current.rotation.x + dy * 0.006,
        -0.55,
        0.38
      );
      requestRender();
      event.preventDefault();
    };

    const onPointerUp = (event) => {
      const interaction = interactionRef.current;
      if (interaction.mode === "solar" && interaction.pendingLayout) {
        onSolarLayoutChangeRef.current?.(interaction.pendingLayout);
      }
      activePointers.delete(event.pointerId);
      interactionRef.current.active = false;
      interactionRef.current.mode = null;
      interactionRef.current.pinchDistance = 0;
      interactionRef.current.dragTargets = [];
      interactionRef.current.pendingLayout = null;
      renderer.domElement.style.cursor = "";
      if (renderer.domElement.hasPointerCapture?.(event.pointerId)) {
        renderer.domElement.releasePointerCapture(event.pointerId);
      }
    };

    const onWheel = (event) => {
      event.preventDefault();
      const scalar = event.deltaY > 0 ? 1.08 : 0.92;
      zoomCamera(scalar);
    };

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("pointerleave", onPointerUp);
    renderer.domElement.addEventListener("pointercancel", onPointerUp);
    renderer.domElement.addEventListener("wheel", onWheel, { passive: false });

    requestRender();

    return () => {
      cancelAnimationFrame(frameRef.current);
      requestRenderRef.current = () => {};
      observer.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("pointerleave", onPointerUp);
      renderer.domElement.removeEventListener("pointercancel", onPointerUp);
      renderer.domElement.removeEventListener("wheel", onWheel);
      cameraControlsRef.current = {
        zoomIn: () => {},
        zoomOut: () => {},
        reset: () => {},
      };
      clearGroup(modelGroup);
      clearGroup(sunPathGroup);
      scene.remove(modelGroup);
      scene.remove(sunPathGroup);
      scene.remove(sunTarget);
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;
    let cancelled = false;

    if (!sceneBuiltRef.current) setIsSceneBuilding(true);
    const buildFrame = requestAnimationFrame(() => {
      if (cancelled) return;
      console.info("[3d-preview] model build started", { pointCount: modelPoints.length });
      const nextGroup = new THREE.Group();
      addRoofModel(
        nextGroup,
        modelPoints,
        metrics,
        contextBuildings,
        satelliteTextureUrl,
        solarLayout,
        safeEnvironmentMode,
        () => requestRenderRef.current()
      );
      if (cancelled) {
        clearGroup(nextGroup);
        return;
      }
      clearGroup(group);
      while (nextGroup.children.length) {
        group.add(nextGroup.children[0]);
      }
      console.info("[3d-preview] model build completed", { childCount: group.children.length });
      if (ENABLE_3D_SHADOWS && rendererRef.current) {
        rendererRef.current.shadowMap.needsUpdate = true;
      }
      requestRenderRef.current();
      sceneBuiltRef.current = true;
      setIsSceneBuilding(false);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(buildFrame);
    };
  }, [modelPoints, metrics, contextBuildings, satelliteTextureUrl, solarLayout, safeEnvironmentMode]);

  useEffect(() => {
    if (!onCaptureReady) return undefined;

    onCaptureReady(() => {
      const renderer = rendererRef.current;
      const scene = sceneRef.current;
      const camera = cameraRef.current;
      if (!renderer || !scene || !camera) {
        throw new Error("3D view is not ready yet");
      }

      renderer.render(scene, camera);
      return renderer.domElement.toDataURL("image/png");
    });

    return () => onCaptureReady(null);
  }, [onCaptureReady]);

  useEffect(() => {
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const hemiLight = hemiLightRef.current;
    const sun = sunLightRef.current;
    const sunTarget = sunTargetRef.current;
    const sunPathGroup = sunPathGroupRef.current;
    if (!renderer || !sun || !sunTarget || !sunPathGroup) return;

    if (scene) {
      scene.background = new THREE.Color(environment.skyColor);
      renderer.setClearColor(environment.skyColor);
    }

    if (hemiLight) {
      hemiLight.color.set(environment.hemiSkyColor);
      hemiLight.groundColor.set(environment.hemiGroundColor);
      hemiLight.intensity = environment.hemiIntensity;
    }

    const safeSunSettings = sanitizeSunSettings(sunSettings);
    const latitude = modelPoints?.[0]?.lat || DEFAULT_CENTER.lat;
    const { currentSunInfo, currentSunPosition } = addSunPathVisual(
      sunPathGroup,
      safeSunSettings,
      latitude,
      safeEnvironmentMode
    );

    sun.position.copy(currentSunPosition);
    sun.color.set(environment.sunColor);
    sunTarget.position.set(0, 4, 0);
    sun.target.updateMatrixWorld();
    sun.castShadow =
      ENABLE_3D_SHADOWS &&
      safeSunSettings.shadowsEnabled &&
      currentSunInfo.altitudeDeg > 0 &&
      safeEnvironmentMode !== "night";
    sun.intensity = safeSunSettings.shadowsEnabled
      ? environment.sunIntensity
      : environment.inactiveSunIntensity;
    renderer.shadowMap.enabled = ENABLE_3D_SHADOWS && sun.castShadow;
    if (ENABLE_3D_SHADOWS) renderer.shadowMap.needsUpdate = true;
    requestRenderRef.current();
  }, [environment, modelPoints, safeEnvironmentMode, sunSettings]);

  return (
    <Box
      sx={{
        width: "100%",
        height,
        position: "relative",
        borderRadius: 2,
        overflow: "hidden",
        border: "1px solid",
        borderColor: "divider",
        bgcolor: environment.surfaceColor,
        cursor: "grab",
        touchAction: "none",
        overscrollBehavior: "contain",
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
    >
      <Box
        ref={mountRef}
        sx={{
          position: "absolute",
          inset: 0,
          "& canvas": {
            display: "block",
            width: "100%",
            height: "100%",
            touchAction: "none",
          },
          "&:active": {
            cursor: "grabbing",
          },
        }}
      />
      {isSceneBuilding && (
        <Stack
          alignItems="center"
          justifyContent="center"
          gap={1}
          sx={{
            position: "absolute",
            inset: 0,
            zIndex: 2,
            bgcolor: alpha(environment.surfaceColor, 0.82),
            pointerEvents: "none",
          }}
        >
          <CircularProgress size={30} />
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            Building 3D preview
          </Typography>
        </Stack>
      )}
      <Stack
        gap={0.7}
        sx={{
          position: "absolute",
          right: 14,
          bottom: 14,
          zIndex: 3,
        }}
      >
        {[
          { label: "Zoom in", icon: <ZoomIn fontSize="small" />, action: () => cameraControlsRef.current.zoomIn() },
          { label: "Zoom out", icon: <ZoomOut fontSize="small" />, action: () => cameraControlsRef.current.zoomOut() },
          { label: "Reset view", icon: <RestartAlt fontSize="small" />, action: () => cameraControlsRef.current.reset() },
        ].map((control) => (
          <Tooltip key={control.label} title={control.label} placement="left">
            <IconButton
              aria-label={control.label}
              size="small"
              onClick={control.action}
              sx={{
                width: 40,
                height: 40,
                bgcolor: "rgba(15, 23, 42, 0.74)",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.22)",
                backdropFilter: "blur(8px)",
                boxShadow: "0 10px 24px rgba(15,23,42,0.24)",
                "&:hover": {
                  bgcolor: "rgba(15, 23, 42, 0.88)",
                },
              }}
            >
              {control.icon}
            </IconButton>
          </Tooltip>
        ))}
      </Stack>
    </Box>
  );
};



const EnvironmentModeButtons = ({ environmentMode, onChange }) => (
  <Stack
    gap={0.8}
    sx={{
      position: "absolute",
      top: 14,
      right: 14,
      zIndex: 3,
      alignItems: "flex-end",
    }}
  >
    {ENVIRONMENT_MODE_OPTIONS.map((mode) => {
      const option = ENVIRONMENT_MODES[mode];
      const Icon = option.Icon;
      const isActive = environmentMode === mode;

      return (
        <ButtonBase
          key={mode}
          onClick={() => onChange(mode)}
          sx={{
            height: 30,
            minWidth: 86,
            px: 1.4,
            gap: 0.65,
            borderRadius: 999,
            justifyContent: "center",
            border: "1px solid",
            borderColor: isActive ? option.buttonColor : alpha(option.buttonColor, 0.35),
            bgcolor: isActive ? option.buttonBg : "rgba(15, 23, 42, 0.5)",
            color: option.buttonColor,
            boxShadow: isActive ? "0 8px 18px rgba(0,0,0,0.18)" : "none",
            backdropFilter: "blur(8px)",
            transition: "background-color .18s ease, border-color .18s ease",
            "&:hover": {
              bgcolor: option.buttonBg,
              borderColor: option.buttonColor,
            },
          }}
        >
          <Icon sx={{ fontSize: 16 }} />
          <Typography variant="caption" sx={{ fontWeight: 800, lineHeight: 1 }}>
            {option.label}
          </Typography>
        </ButtonBase>
      );
    })}
  </Stack>
);

const getLeadDisplayName = (lead = {}) =>
  [lead.firstName, lead.lastName].filter(Boolean).join(" ").trim() ||
  lead.name ||
  lead.customerName ||
  "Untitled";

const getDesignAddress = (lead = {}) =>
  [lead.address, lead.city, lead.state, lead.pincode].filter(Boolean).join(", ") ||
  lead.threeDDesign?.selectedPlace?.description ||
  "No address";

const getDesignCapacityKw = (layout) => {
  const solarLayout = sanitizeSolarLayout(layout);
  return Number((solarLayout.count * 0.55).toFixed(1));
};

const ThreeDDesignStatCard = ({ icon, label, value, color }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: "14px",
        border: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid #e5e7eb",
        boxShadow: isDark ? "0 4px 20px rgba(0, 0, 0, 0.3)" : "0 1px 4px rgba(15, 23, 42, 0.08)",
        bgcolor: isDark ? "#0b0e1a" : "#fff",
        color: isDark ? "#f8fafc" : "inherit",
        height: "100%",
      }}
    >
      <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: "12px",
              bgcolor: alpha(color, 0.12),
              color,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {icon}
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "text.secondary" }}>
              {label}
            </Typography>
            <Typography variant="h6" fontWeight={800} color={isDark ? "#f8fafc" : "#0f1f3d"}>
              {value}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

const ThreeDDesignCard = ({ lead, onOpen, onDelete }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const design = lead.threeDDesign || {};
  const solarLayout = sanitizeSolarLayout(design.solarLayout);
  const capacity = getDesignCapacityKw(solarLayout);
  const yearlyUnits = Math.round(capacity * 1207);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: "14px",
        border: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid #e5e7eb",
        boxShadow: isDark ? "0 4px 20px rgba(0, 0, 0, 0.3)" : "0 1px 4px rgba(15, 23, 42, 0.08)",
        bgcolor: isDark ? "#0b0e1a" : "#fff",
        color: isDark ? "#f8fafc" : "inherit",
        height: "100%",
      }}
    >
      <Stack spacing={2}>
        <Stack direction="row" alignItems="flex-start" spacing={1}>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="subtitle2" fontWeight={800} color="#0f1f3d" noWrap>
              {getLeadDisplayName(lead)} - Solar Design
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block", mt: 0.75 }}>
              {getDesignAddress(lead)}
            </Typography>
          </Box>
          <Chip
            label="DRAFT"
            size="small"
            sx={{ bgcolor: "#f2bd56", color: "#fff", fontWeight: 800, fontSize: 10, height: 22 }}
          />
        </Stack>

        <Stack direction="row" spacing={3}>
          <Box>
            <Typography variant="subtitle2" fontWeight={800} color="#0f1f3d">
              {solarLayout.count}
            </Typography>
            <Typography variant="caption" color="text.secondary">Panels</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" fontWeight={800} color="#0f1f3d">
              {capacity.toFixed(1)} kW
            </Typography>
            <Typography variant="caption" color="text.secondary">Capacity</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" fontWeight={800} color="#0f1f3d">
              {yearlyUnits.toLocaleString("en-IN")}
            </Typography>
            <Typography variant="caption" color="text.secondary">kWh/yr</Typography>
          </Box>
        </Stack>

        <Typography variant="caption" color="text.secondary">
          Lead: {getLeadDisplayName(lead)}
        </Typography>

        <Stack direction="row" spacing={1} alignItems="center">
          <Button
            fullWidth
            variant="contained"
            startIcon={<ViewInAr />}
            onClick={() => onOpen(lead)}
            sx={{
              bgcolor: "#2d3448",
              fontWeight: 800,
              borderRadius: "8px",
              "&:hover": { bgcolor: "#1f2638" },
            }}
          >
            Open Designer
          </Button>
          <Tooltip title="Delete saved design">
            <IconButton
              onClick={() => onDelete(lead)}
              sx={{
                border: "1px solid #ff6b55",
                color: "#ff6b55",
                borderRadius: "8px",
                width: 38,
                height: 38,
              }}
            >
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>
    </Paper>
  );
};

export const ThreeDDesignDashboard = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const navigate = useNavigate();
  const { fetchAPI } = useAuth();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const loadDesigns = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetchAPI("/lead/getAll?limit=500&sortBy=updatedAt&sortOrder=desc");
      setLeads(response.result?.leads || []);
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || "Failed to load 3D designs",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [fetchAPI]);

  useEffect(() => {
    loadDesigns();
  }, [loadDesigns]);

  const designs = useMemo(
    () =>
      leads.filter(
        (lead) =>
          (lead.threeDDesign?.status === "saved" || lead.threeDDesign?.status === "draft") &&
          sanitizeRoofPoints(lead.threeDDesign?.points).length >= MIN_ROOF_POINTS
      ),
    [leads]
  );

  const filteredDesigns = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return designs;
    return designs.filter((lead) =>
      [getLeadDisplayName(lead), getDesignAddress(lead), lead.phone, lead.email]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [designs, searchText]);

  const summary = useMemo(() => {
    const capacity = designs.reduce(
      (sum, lead) => sum + getDesignCapacityKw(lead.threeDDesign?.solarLayout),
      0
    );
    return {
      total: designs.length,
      saved: designs.length,
      proposed: 0,
      approved: 0,
      capacity: capacity.toFixed(1),
    };
  }, [designs]);

  const openDesign = useCallback(
    (lead) => {
      const design = {
        ...lead.threeDDesign,
        leadId: lead._id,
      };
      sessionStorage.setItem(DESIGN_STORAGE_KEY, JSON.stringify(design));
      sessionStorage.setItem(DESIGN_LEAD_STORAGE_KEY, JSON.stringify({ _id: lead._id, lead }));
      navigate("/3d-design/preview", { state: { design, lead, returnTo: `/all-leads/${lead._id}` } });
    },
    [navigate]
  );

  const deleteDesign = useCallback(
    async (lead) => {
      try {
        await fetchAPI(`/lead/updateLead/${lead._id}`, {
          method: "PUT",
          body: JSON.stringify({ threeDDesign: null }),
        });
        setLeads((current) =>
          current.map((item) =>
            item._id === lead._id ? { ...item, threeDDesign: null } : item
          )
        );
        setSnackbar({ open: true, message: "3D design deleted", severity: "success" });
      } catch (error) {
        setSnackbar({
          open: true,
          message: error.message || "Failed to delete 3D design",
          severity: "error",
        });
      }
    },
    [fetchAPI]
  );

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: isDark ? "#050811" : "#f8fafc" }}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 2.5 }}>
        <Box>
          <Typography variant="h5" fontWeight={900} color={isDark ? "#f8fafc" : "#0f1f3d"}>
            3D Solar Designer
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Solar Designer &gt; 3D Solar Designer
          </Typography>
        </Box>
      </Stack>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(5, 1fr)" },
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <ThreeDDesignStatCard icon={<Edit />} label="Total Designs" value={summary.total} color="#7c83ff" />
        </Box>
        <Box>
          <ThreeDDesignStatCard icon={<Edit />} label="Saved" value={summary.saved} color="#f59e0b" />
        </Box>
        <Box>
          <ThreeDDesignStatCard icon={<ViewInAr />} label="Proposed" value={summary.proposed} color="#38bdf8" />
        </Box>
        <Box>
          <ThreeDDesignStatCard icon={<CheckCircle />} label="Approved" value={summary.approved} color="#22c55e" />
        </Box>
        <Box>
          <ThreeDDesignStatCard icon={<Bolt />} label="Total Capacity" value={`${summary.capacity} kW`} color="#ff6b35" />
        </Box>
      </Box>

      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 2,
          borderRadius: "14px",
          border: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid #e5e7eb",
          boxShadow: isDark ? "0 4px 20px rgba(0, 0, 0, 0.3)" : "0 1px 4px rgba(15, 23, 42, 0.08)",
          bgcolor: isDark ? "#0b0e1a" : "#fff",
          color: isDark ? "#f8fafc" : "inherit",
        }}
      >
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="space-between">
          <TextField
            size="small"
            placeholder="Search designs..."
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ width: { xs: "100%", sm: 420 }, "& .MuiOutlinedInput-root": { bgcolor: isDark ? "#0e1220" : "#fff", color: isDark ? "#f8fafc" : "inherit", borderRadius: "8px", "& fieldset": { borderColor: isDark ? "rgba(255, 255, 255, 0.12)" : "inherit" } } }}
          />
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate("/3d-design/new")}
            sx={{ bgcolor: isDark ? "#ea580c" : "#2d3448", color: "#fff", fontWeight: 800, "&:hover": { bgcolor: isDark ? "#c2410c" : "#1f2638" } }}
          >
            New Design
          </Button>
        </Stack>
      </Paper>

      {loading ? (
        <Stack alignItems="center" sx={{ py: 8 }}>
          <CircularProgress />
        </Stack>
      ) : filteredDesigns.length ? (
        <Grid container spacing={2}>
          {filteredDesigns.map((lead) => (
            <Grid item xs={12} md={6} lg={4} key={lead._id}>
              <ThreeDDesignCard lead={lead} onOpen={openDesign} onDelete={deleteDesign} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Paper
          elevation={0}
          sx={{ p: 5, textAlign: "center", border: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid #e5e7eb", borderRadius: "14px", bgcolor: isDark ? "#0b0e1a" : "#fff", color: isDark ? "#f8fafc" : "inherit" }}
        >
          <Typography variant="h6" fontWeight={800} color={isDark ? "#f8fafc" : "#0f1f3d"}>
            No saved 3D designs found
          </Typography>
          <Typography variant="body2" sx={{ color: isDark ? "#94a3b8" : "text.secondary", mt: 1 }}>
            Open a lead, create a 3D house design, then it will appear here.
          </Typography>
        </Paper>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((current) => ({ ...current, open: false }))}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((current) => ({ ...current, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

// ========== LEAFLET ROOF MAP COMPONENT FOR 3D DESIGN ==========
const LeafletRoofMap = ({ center, roofPoints, onMapClick }) => {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const polygonRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const lat = Number(center?.lat) || 20.2961;
    const lng = Number(center?.lng) || 85.8245;

    if (!mapRef.current) {
      const map = L.map(containerRef.current, {
        center: [lat, lng],
        zoom: 18,
        zoomControl: true,
      });

      const googleSat = L.tileLayer(
        "https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}",
        {
          maxZoom: 20,
          subdomains: ["mt0", "mt1", "mt2", "mt3"],
          attribution: "Google Satellite",
        }
      );

      googleSat.addTo(map);

      map.on("click", (e) => {
        if (onMapClick) {
          onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
        }
      });

      mapRef.current = map;

      setTimeout(() => {
        map.invalidateSize();
      }, 300);
    } else {
      mapRef.current.setView([lat, lng], 18);
      setTimeout(() => {
        mapRef.current?.invalidateSize();
      }, 100);
    }
  }, [center?.lat, center?.lng]);

  useEffect(() => {
    const handleResize = () => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];

    roofPoints.forEach((point, idx) => {
      const iconHtml = `<div style="background:#10b981;color:white;border-radius:50%;width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:11px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4);">${idx + 1}</div>`;
      const customIcon = L.divIcon({
        html: iconHtml,
        className: "",
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });
      const marker = L.marker([point.lat, point.lng], { icon: customIcon }).addTo(map);
      markersRef.current.push(marker);
    });

    if (polygonRef.current) {
      map.removeLayer(polygonRef.current);
      polygonRef.current = null;
    }

    if (roofPoints.length >= 3) {
      const latLngs = roofPoints.map((p) => [p.lat, p.lng]);
      const polygon = L.polygon(latLngs, {
        color: "#0f9f6e",
        fillColor: "#10b981",
        fillOpacity: 0.35,
        weight: 3,
      }).addTo(map);
      polygonRef.current = polygon;
    }
  }, [roofPoints]);

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);
  return <div ref={containerRef} style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }} />;
};

const ThreeDDesign = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const location = useLocation();
  const navigate = useNavigate();
  const sourceLead = location.state?.lead || null;
  const returnTo = location.state?.returnTo || (sourceLead?._id ? `/all-leads/${sourceLead._id}` : "");
  const handleBack = useCallback(() => {
    if (returnTo) {
      navigate(returnTo, { state: { lead: sourceLead } });
      return;
    }
    navigate(-1);
  }, [navigate, returnTo, sourceLead]);
  const shouldRestoreOutline = location.state?.restoreOutline === true;
  const stateDesign =
    shouldRestoreOutline && location.state?.design?.points?.length ? location.state.design : null;
  const sourceLeadDesign = stateDesign || sourceLead?.threeDDesign || null;

  useEffect(() => {
    if (!sourceLead?._id) return;
    try {
      sessionStorage.setItem(DESIGN_LEAD_STORAGE_KEY, JSON.stringify({ _id: sourceLead._id, lead: sourceLead }));
    } catch (error) {
      console.warn("Unable to save active 3D design lead", error);
    }
  }, [sourceLead]);

  const [roofPoints, setRoofPoints] = useState(() => sourceLeadDesign?.points || []);

  const [center, setCenter] = useState(() => {
    const lat = Number(sourceLead?.address?.lat || sourceLead?.lat || sourceLeadDesign?.center?.lat || DEFAULT_CENTER.lat);
    const lng = Number(sourceLead?.address?.lng || sourceLead?.lng || sourceLeadDesign?.center?.lng || DEFAULT_CENTER.lng);
    return {
      lat: Number.isFinite(lat) && lat !== 0 ? lat : DEFAULT_CENTER.lat,
      lng: Number.isFinite(lng) && lng !== 0 ? lng : DEFAULT_CENTER.lng,
    };
  });

  const handleMapClick = useCallback((latlng) => {
    setRoofPoints((prev) => [...prev, latlng]);
  }, []);

  const clearSelection = useCallback(() => {
    setRoofPoints([]);
  }, []);

  const undoPoint = useCallback(() => {
    setRoofPoints((prev) => prev.slice(0, -1));
  }, []);

  const generateModel = useCallback(() => {
    if (!roofPoints || roofPoints.length < 3) return;
    const sanitized = sanitizeRoofPoints(roofPoints);
    const calculatedCenter = getCentroid(sanitized) || center;
    const design = {
      points: sanitized,
      center: calculatedCenter,
      leadId: sourceLead?._id,
    };
    try {
      sessionStorage.setItem(DESIGN_STORAGE_KEY, JSON.stringify(design));
      if (sourceLead?._id) {
        sessionStorage.setItem(DESIGN_LEAD_STORAGE_KEY, JSON.stringify({ _id: sourceLead._id, lead: sourceLead }));
      }
    } catch (e) {
      console.warn("Error saving design to session storage", e);
    }
    navigate("/3d-design/preview", {
      state: {
        lead: sourceLead,
        design,
        returnTo: returnTo || (sourceLead?._id ? `/all-leads/${sourceLead._id}` : "/3d-design"),
      },
    });
  }, [roofPoints, center, sourceLead, returnTo, navigate]);
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchResultsOpen, setSearchResultsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoaded, setIsLoaded] = useState(true);
  const [status, setStatus] = useState(() => sourceLead?.address?.city || sourceLead?.address?.state || "Outline Roof Boundary");

  const handleSearch = useCallback(async () => {
    if (!searchText.trim()) return;
    try {
      setIsSearching(true);
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchText.trim())}`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const results = data.slice(0, 5).map((item) => ({
          id: item.place_id,
          title: item.display_name.split(",")[0],
          subtitle: item.display_name,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
        }));
        setSearchResults(results);
        setSearchResultsOpen(true);
        if (results[0]?.lat && results[0]?.lng) {
          setCenter({ lat: results[0].lat, lng: results[0].lng });
        }
      } else {
        setSearchResults([]);
        setSearchResultsOpen(false);
      }
    } catch (err) {
      console.warn("Geocoding error", err);
    } finally {
      setIsSearching(false);
    }
  }, [searchText]);

  const selectSearchResult = useCallback((result) => {
    if (!result?.lat || !result?.lng) return;
    setSearchResultsOpen(false);
    setSearchText(result.title);
    setStatus(result.title);
    setCenter({ lat: result.lat, lng: result.lng });
  }, []);

  return (
    <Box sx={{ position: "relative", width: "100%", height: "100vh", overflow: "hidden" }}>
      <LeafletRoofMap
        center={center}
        roofPoints={roofPoints}
        onMapClick={handleMapClick}
      />
      <Paper
        elevation={4}
        sx={{
          position: "absolute",
          zIndex: 1000,
          top: 16,
          left: 16,
          right: 16,
          p: { xs: 1.2, md: 1.5 },
          borderRadius: 3,
          border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.12)",
          boxShadow: isDark ? "0 10px 30px rgba(0,0,0,0.6)" : "0 10px 30px rgba(0,0,0,0.15)",
          bgcolor: isDark ? "#0e1526" : "#ffffff",
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          alignItems={{ xs: "stretch", md: "center" }}
          gap={1.2}
        >
          <Stack direction="row" alignItems="center" gap={1} sx={{ minWidth: { md: 235 } }}>
            <IconButton
              onClick={handleBack}
              sx={{
                border: "1px solid",
                borderColor: isDark ? "rgba(255,255,255,0.12)" : "divider",
                bgcolor: isDark ? "rgba(30, 41, 59, 0.7)" : "rgba(255,255,255,0.92)",
                color: isDark ? "#60a5fa" : PRIMARY,
                flexShrink: 0,
                "&:hover": { bgcolor: isDark ? "rgba(59, 130, 246, 0.15)" : alpha(PRIMARY, 0.08) },
              }}
            >
              <ArrowBack fontSize="small" />
            </IconButton>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 1.5,
                bgcolor: isDark ? "rgba(59, 130, 246, 0.18)" : alpha(PRIMARY, 0.12),
                color: isDark ? "#60a5fa" : PRIMARY,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <ViewInAr fontSize="small" />
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: isDark ? "#f8fafc" : "#172033" }}>
                3D Design
              </Typography>
              <Stack direction="row" alignItems="center" gap={0.7} flexWrap="wrap">
                <Chip
                  size="small"
                  icon={<Place sx={{ color: isDark ? "#60a5fa !important" : "inherit" }} />}
                  label={status}
                  sx={{ bgcolor: isDark ? "rgba(59, 130, 246, 0.15)" : alpha(PRIMARY, 0.08), color: isDark ? "#93c5fd" : "#20304d", border: isDark ? "1px solid rgba(59, 130, 246, 0.25)" : "none" }}
                />
              </Stack>
            </Box>
          </Stack>

          <Box sx={{ position: "relative", flex: 1, minWidth: { md: 320 } }}>
            <TextField
              size="small"
              fullWidth
              value={searchText}
              placeholder="Search location"
              onChange={(event) => {
                setSearchText(event.target.value);
                setSearchResultsOpen(false);
              }}
              onFocus={() => {
                if (searchResults.length) setSearchResultsOpen(true);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleSearch();
                }
              }}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: "text.secondary" }} />,
              }}
            />

            {searchResultsOpen && searchResults.length > 0 && (
              <Paper
                elevation={8}
                sx={{
                  position: "absolute",
                  zIndex: 6,
                  top: "calc(100% + 8px)",
                  left: 0,
                  right: 0,
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: isDark ? "rgba(255,255,255,0.1)" : "divider",
                  bgcolor: isDark ? "#0f172a" : "#ffffff",
                  overflow: "hidden",
                  maxHeight: 320,
                }}
              >
                <Stack sx={{ py: 0.75 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      px: 1.5,
                      pb: 0.5,
                      fontWeight: 800,
                      color: "text.secondary",
                      textTransform: "uppercase",
                      letterSpacing: 0,
                    }}
                  >
                    Search results
                  </Typography>
                  {searchResults.map((result, index) => (
                    <React.Fragment key={result.id}>
                      <ButtonBase
                        type="button"
                        onClick={() => selectSearchResult(result)}
                        sx={{
                          width: "100%",
                          justifyContent: "flex-start",
                          alignItems: "flex-start",
                          textAlign: "left",
                          px: 1.5,
                          py: 1,
                          gap: 1,
                          "&:hover": { bgcolor: isDark ? "rgba(59, 130, 246, 0.12)" : alpha(PRIMARY, 0.06) },
                        }}
                      >
                        <Place sx={{ mt: 0.2, fontSize: 20, color: PRIMARY, flexShrink: 0 }} />
                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            variant="body2"
                            noWrap
                            sx={{ fontWeight: 800, color: isDark ? "#f8fafc" : "#172033" }}
                          >
                            {result.title}
                          </Typography>
                          {result.subtitle && (
                            <Typography
                              variant="caption"
                              noWrap
                              sx={{ display: "block", color: isDark ? "#94a3b8" : "text.secondary" }}
                            >
                              {result.subtitle}
                            </Typography>
                          )}
                        </Box>
                      </ButtonBase>
                      {index < searchResults.length - 1 && (
                        <Divider sx={{ borderColor: isDark ? "rgba(255,255,255,0.06)" : undefined }} />
                      )}
                    </React.Fragment>
                  ))}
                </Stack>
              </Paper>
            )}
          </Box>

          <Stack direction="row" gap={1} flexWrap="wrap" sx={{ flexShrink: 0 }}>
            <Button
              variant="contained"
              startIcon={isSearching ? <CircularProgress size={16} color="inherit" /> : <Search />}
              onClick={handleSearch}
              disabled={!searchText.trim() || isSearching || !isLoaded}
              sx={{ minWidth: 104 }}
            >
              Search
            </Button>
            <Button
              variant="outlined"
              startIcon={<ViewInAr />}
              onClick={generateModel}
              disabled={!canGenerateRoofModel(roofPoints)}
              sx={{ minWidth: 132 }}
            >
              Generate 3D
            </Button>
            <Button
              variant="outlined"
              startIcon={<Delete />}
              onClick={clearSelection}
              disabled={!roofPoints.length}
              sx={{
                minWidth: 140,
                color: "#e53935",
                borderColor: "rgba(229, 57, 53, 0.28)",
                "&:hover": {
                  borderColor: "#e53935",
                  bgcolor: "rgba(229, 57, 53, 0.05)",
                },
              }}
            >
              Remove Points
            </Button>
            <Tooltip title="Clear all points" arrow>
              <span>
                <IconButton
                  onClick={clearSelection}
                  disabled={!roofPoints.length}
                  sx={{
                    border: "1px solid",
                    borderColor: isDark ? "rgba(255,255,255,0.1)" : "divider",
                    color: isDark ? "#cbd5e1" : "inherit",
                    "&:hover": { bgcolor: isDark ? "rgba(255,255,255,0.05)" : undefined },
                  }}
                >
                  <RestartAlt />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Remove last point" arrow>
              <span>
                <IconButton
                  onClick={undoPoint}
                  disabled={!roofPoints.length}
                  sx={{
                    border: "1px solid",
                    borderColor: isDark ? "rgba(255,255,255,0.1)" : "divider",
                    color: isDark ? "#cbd5e1" : "inherit",
                    "&:hover": { bgcolor: isDark ? "rgba(255,255,255,0.05)" : undefined },
                  }}
                >
                  <Clear />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        </Stack>
      </Paper>

    </Box>
  );
};

export const ThreeDDesignPreview = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { fetchAPI } = useAuth();
  const storedLead = useMemo(() => {
    try {
      const saved = sessionStorage.getItem(DESIGN_LEAD_STORAGE_KEY);
      return saved ? JSON.parse(saved)?.lead || JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }, []);
  const sourceLead = location.state?.lead || storedLead || null;
  const previewReturnTo = location.state?.returnTo || (sourceLead?._id ? `/all-leads/${sourceLead._id}` : "");
  const handlePreviewBack = useCallback(() => {
    if (previewReturnTo) {
      navigate(previewReturnTo, { state: { lead: sourceLead } });
      return;
    }
    navigate(-1);
  }, [navigate, previewReturnTo, sourceLead]);
  const capturePreviewRef = useRef(null);

  const design = useMemo(() => {
    if (location.state?.design?.points?.length) return location.state.design;

    try {
      const saved = sessionStorage.getItem(DESIGN_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }, [location.state]);

  const modelPoints = useMemo(
    () => sanitizeRoofPoints(design?.points),
    [design]
  );
  const metrics = useMemo(() => getRoofMetrics(modelPoints), [modelPoints]);
  const satelliteTextureUrl = design?.satelliteTextureUrl || getSatelliteTextureUrl(modelPoints);
  const [solarLayout, setSolarLayout] = useState(() => sanitizeSolarLayout(design?.solarLayout));
  const [sunSettings, setSunSettings] = useState(() =>
    sanitizeSunSettings(design?.sunSettings || DEFAULT_SUN_SETTINGS)
  );
  const [environmentMode, setEnvironmentMode] = useState(() =>
    getEnvironmentMode(design?.environmentMode)
  );
  const [shareOpen, setShareOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [isSunPlaying, setIsSunPlaying] = useState(false);
  const [saveStatus, setSaveStatus] = useState({ saving: false, message: "", severity: "info" });
  const [captureImage, setCaptureImage] = useState(() => design?.captureImage || "");

  const handleCloseSnackbar = (event, reason) => {
    if (reason === "clickaway") return;
    setSaveStatus((prev) => ({ ...prev, message: "" }));
  };
  const solarConfig = useMemo(() => sanitizeSolarLayout(solarLayout), [solarLayout]);
  const sunConfig = useMemo(() => sanitizeSunSettings(sunSettings), [sunSettings]);
  const designLeadId = useMemo(() => {
    if (design?.leadId) return design.leadId;
    if (sourceLead?._id) return sourceLead._id;
    const match = String(previewReturnTo || "").match(/\/all-leads\/([^/?#]+)/);
    return match?.[1] || null;
  }, [design?.leadId, previewReturnTo, sourceLead?._id]);
  const sunInfo = useMemo(
    () => getSunPositionInfo(sunConfig, modelPoints?.[0]?.lat || DEFAULT_CENTER.lat),
    [modelPoints, sunConfig]
  );
  const structureConfig = solarConfig.elevatedSettings;
  const activeStructureType =
    solarConfig.selectedPanelIndex >= 0
      ? solarConfig.panelStructureTypes[solarConfig.selectedPanelIndex] || solarConfig.structureType
      : solarConfig.structureType;
  const sharePayload = useMemo(
    () => ({
      v: 1,
      points: modelPoints,
      solarLayout: solarConfig,
      sunSettings: sunConfig,
      environmentMode,
    }),
    [environmentMode, modelPoints, solarConfig, sunConfig]
  );
  const shareUrl = useMemo(() => {
    if (!modelPoints.length || typeof window === "undefined") return "";
    const encoded = encodeSharePayload(sharePayload);
    const isLocalhost = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
    const shareBaseUrl = PUBLIC_APP_URL || (!isLocalhost && window.location?.origin ? window.location.origin : "https://vanurtech-solar-frontend.vercel.app");
    return encoded
      ? `${shareBaseUrl}${SHARE_ROUTE}?${SHARE_DATA_PARAM}=${encoded}`
      : "";
  }, [modelPoints.length, sharePayload]);

  useEffect(() => {
    setSolarLayout(sanitizeSolarLayout(design?.solarLayout));
    const nextSunSettings = sanitizeSunSettings(design?.sunSettings || DEFAULT_SUN_SETTINGS);
    setSunSettings(nextSunSettings);
    setEnvironmentMode(getEnvironmentMode(design?.environmentMode));
  }, [design]);

  useEffect(() => {
    if (!design?.points?.length) return;

    const nextDesign = {
      ...design,
      leadId: designLeadId,
      solarLayout: solarConfig,
      sunSettings: sunConfig,
      environmentMode,
      updatedAt: Date.now(),
    };

    try {
      sessionStorage.setItem(DESIGN_STORAGE_KEY, JSON.stringify(nextDesign));
    } catch (error) {
      console.warn("Unable to save 3D solar panel layout", error);
    }

  }, [design, designLeadId, environmentMode, solarConfig, sunConfig]);

  const buildCurrentSavedDesign = useCallback(
    (nextCaptureImage = captureImage) => ({
      ...design,
      leadId: designLeadId,
      points: modelPoints,
      satelliteTextureUrl,
      solarLayout: solarConfig,
      sunSettings: sunConfig,
      environmentMode,
      captureImage: nextCaptureImage,
      status: "saved",
      updatedAt: Date.now(),
      createdAt: design?.createdAt || Date.now(),
    }),
    [captureImage, design, designLeadId, environmentMode, modelPoints, satelliteTextureUrl, solarConfig, sunConfig]
  );

  const saveDesign = useCallback(async (event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();

    if (!designLeadId) {
      setSaveStatus({
        saving: false,
        message: "Lead is not selected for this 3D design. Open it from the lead page and try Save again.",
        severity: "warning",
      });
      return;
    }

    const savedDesign = buildCurrentSavedDesign();
    setSaveStatus({ saving: true, message: "", severity: "success" });

    try {
      sessionStorage.setItem(DESIGN_STORAGE_KEY, JSON.stringify(savedDesign));
      const response = await fetchAPI(`/lead/updateLead/${designLeadId}`, {
        method: "PUT",
        body: JSON.stringify({ threeDDesign: savedDesign }),
      });
      const updatedLead = response?.result || (sourceLead ? { ...sourceLead, threeDDesign: savedDesign } : null);
      setSaveStatus({
        saving: false,
        message: "Design saved.",
        severity: "success",
      });
      const targetPath = previewReturnTo || `/all-leads/${designLeadId}`;
      navigate(targetPath, { state: { lead: updatedLead || sourceLead, initialTab: "threeDDesign" } });
    } catch (error) {
      setSaveStatus({
        saving: false,
        message: error.message || "Design save failed",
        severity: "error",
      });
    }
  }, [buildCurrentSavedDesign, designLeadId, fetchAPI, navigate, previewReturnTo, sourceLead]);

  useEffect(() => {
    if (!isSunPlaying) return undefined;

    const timer = window.setInterval(() => {
      setSunSettings((current) => {
        const safeCurrent = sanitizeSunSettings(current);
        const nextTime = safeCurrent.timeMinutes + safeCurrent.speed;
        return sanitizeSunSettings({
          ...safeCurrent,
          timeMinutes: nextTime > SUN_TIME_MAX ? SUN_TIME_MIN : nextTime,
        });
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isSunPlaying]);

  const updateSolarLayout = useCallback((updater) => {
    setSolarLayout((current) =>
      sanitizeSolarLayout(typeof updater === "function" ? updater(current) : updater)
    );
  }, []);

  const addSolarPanelToLayout = useCallback(() => {
    updateSolarLayout((current) => {
      const layout = sanitizeSolarLayout(current);
      if (layout.count <= 0) {
        const layoutCount = 1;
        const elevatedSettings =
          layout.structureType === "elevated_structure"
            ? sanitizeElevatedStructureSettings({
                ...layout.elevatedSettings,
                panelRows: 1,
                panelColumns: 1,
              })
            : layout.elevatedSettings;
        return {
          ...layout,
          elevatedSettings,
          count: layoutCount,
          selectedPanelIndex: 0,
          panelPositions: Array.from({ length: layoutCount }, () => null),
          panelStructureTypes: Array.from({ length: layoutCount }, () => null),
        };
      }

      if (layout.structureType === "elevated_structure") {
        const currentRows = layout.elevatedSettings.panelRows;
        const currentColumns = layout.elevatedSettings.panelColumns;
        if (currentRows * currentColumns >= MAX_SOLAR_PANELS) return layout;

        const elevatedSettings =
          layout.count <= 0
            ? layout.elevatedSettings
            : sanitizeElevatedStructureSettings({
                ...layout.elevatedSettings,
                panelColumns:
                  currentColumns < DEFAULT_ELEVATED_STRUCTURE_SETTINGS.panelColumns
                    ? DEFAULT_ELEVATED_STRUCTURE_SETTINGS.panelColumns
                    : currentColumns < MAX_SOLAR_PANEL_COLUMNS
                      ? currentColumns + 1
                      : currentColumns,
                panelRows:
                  currentColumns >= MAX_SOLAR_PANEL_COLUMNS &&
                  currentRows < MAX_SOLAR_PANEL_ROWS
                    ? currentRows + 1
                    : currentRows,
              });
        const elevatedCount = elevatedSettings.panelRows * elevatedSettings.panelColumns;
        return {
          ...layout,
          count: elevatedCount,
          selectedPanelIndex: -1,
          elevatedSettings,
          panelPositions: Array.from({ length: elevatedCount }, () => null),
          panelStructureTypes: Array.from({ length: elevatedCount }, () => null),
        };
      }

      const nextCount = Math.min(MAX_SOLAR_PANELS, layout.count + 1);
      return {
        ...layout,
        count: nextCount,
        selectedPanelIndex: nextCount > layout.count ? nextCount - 1 : layout.selectedPanelIndex,
        panelPositions: [...layout.panelPositions, null].slice(0, nextCount),
        panelStructureTypes: [...layout.panelStructureTypes, null].slice(0, nextCount),
      };
    });
  }, [updateSolarLayout]);

  const removeSolarPanelFromLayout = useCallback(() => {
    updateSolarLayout((current) => {
      const layout = sanitizeSolarLayout(current);
      if (layout.count <= 0) return layout;
      if (layout.selectedPanelIndex === -1) {
        return {
          ...layout,
          count: 0,
          selectedPanelIndex: -1,
          panelPositions: [],
          panelStructureTypes: [],
        };
      }

      const nextPanelPositions = layout.panelPositions.filter(
        (_, index) => index !== layout.selectedPanelIndex
      );
      const nextPanelStructureTypes = layout.panelStructureTypes.filter(
        (_, index) => index !== layout.selectedPanelIndex
      );
      const nextCount = layout.count - 1;
      return {
        ...layout,
        count: nextCount,
        selectedPanelIndex: nextCount ? Math.min(layout.selectedPanelIndex, nextCount - 1) : -1,
        panelPositions: nextPanelPositions,
        panelStructureTypes: nextPanelStructureTypes,
      };
    });
  }, [updateSolarLayout]);

  const updateSelectedSolarTarget = useCallback(
    (selectedPanelIndex) => {
      updateSolarLayout((current) => ({
        ...sanitizeSolarLayout(current),
        selectedPanelIndex: Number(selectedPanelIndex),
      }));
    },
    [updateSolarLayout]
  );

  const updateSolarStructureType = useCallback(
    (structureType) => {
      updateSolarLayout((current) => {
        const layout = sanitizeSolarLayout(current);
        if (structureType === "elevated_structure") {
          const elevatedSettings = sanitizeElevatedStructureSettings(layout.elevatedSettings);
          const elevatedCount = elevatedSettings.panelRows * elevatedSettings.panelColumns;
          return {
            ...layout,
            structureType,
            count: elevatedCount,
            selectedPanelIndex: -1,
            panelPositions: Array.from({ length: elevatedCount }, () => null),
            panelStructureTypes: Array.from({ length: elevatedCount }, () => null),
          };
        }

        if (structureType === "single_axis_tracker") {
          const trackerSettings = sanitizeElevatedStructureSettings({
            ...layout.elevatedSettings,
            ...DEFAULT_SINGLE_AXIS_TRACKER_SETTINGS,
          });
          const trackerCount = trackerSettings.panelRows * trackerSettings.panelColumns;
          return {
            ...layout,
            structureType,
            count: trackerCount,
            elevatedSettings: trackerSettings,
            selectedPanelIndex: -1,
            panelPositions: Array.from({ length: trackerCount }, () => null),
            panelStructureTypes: Array.from({ length: trackerCount }, () => null),
          };
        }

        if (layout.selectedPanelIndex === -1) {
          return {
            ...layout,
            structureType,
            panelStructureTypes: layout.panelStructureTypes.map(() => null),
          };
        }

        return {
          ...layout,
          panelStructureTypes: layout.panelStructureTypes.map((type, index) =>
            index === layout.selectedPanelIndex ? structureType : type
          ),
        };
      });
    },
    [updateSolarLayout]
  );

  const updateStructureSetting = useCallback(
    (key, value) => {
      updateSolarLayout((current) => {
        const layout = sanitizeSolarLayout(current);
        const elevatedSettings = sanitizeElevatedStructureSettings({
          ...layout.elevatedSettings,
          [key]: value,
        });
        const elevatedCount = elevatedSettings.panelRows * elevatedSettings.panelColumns;
        return {
          ...layout,
          elevatedSettings,
          count: elevatedCount,
          selectedPanelIndex: -1,
          panelPositions: Array.from({ length: elevatedCount }, () => null),
          panelStructureTypes: Array.from({ length: elevatedCount }, () => null),
        };
      });
    },
    [updateSolarLayout]
  );

  const updateSunSetting = useCallback((key, value) => {
    setSunSettings((current) =>
      sanitizeSunSettings({
        ...current,
        [key]: value,
      })
    );
  }, []);

  const updateEnvironmentMode = useCallback((mode) => {
    const safeMode = getEnvironmentMode(mode);
    setEnvironmentMode(safeMode);
  }, []);

  const copyShareUrl = useCallback(async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = shareUrl;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }

    setShareCopied(true);
    window.setTimeout(() => setShareCopied(false), 1800);
  }, [shareUrl]);

  const openSharePreview = useCallback(() => {
    if (shareUrl) window.open(shareUrl, "_blank", "noopener,noreferrer");
  }, [shareUrl]);

  const openWhatsAppShare = useCallback(() => {
    if (!shareUrl) return;
    const text = `View this solar 3D design: ${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  }, [shareUrl]);

  const handleCapturePreview = useCallback(async () => {
    try {
      if (!capturePreviewRef.current) {
        throw new Error("3D view is not ready yet");
      }

      const imageDataUrl = capturePreviewRef.current();
      setCaptureImage(imageDataUrl);
      const capturedDesign = buildCurrentSavedDesign(imageDataUrl);

      try {
        sessionStorage.setItem(DESIGN_STORAGE_KEY, JSON.stringify(capturedDesign));
      } catch (error) {
        console.warn("Unable to save captured 3D preview locally", error);
      }

      if (designLeadId) {
        await fetchAPI(`/lead/updateLead/${designLeadId}`, {
          method: "PUT",
          body: JSON.stringify({ threeDDesign: capturedDesign }),
        });
      }

      setSaveStatus({
        saving: false,
        message: designLeadId
          ? "Capture saved. It will show in quotation."
          : "Capture saved in this 3D design. Open from a lead to show it in quotation.",
        severity: "success",
      });
    } catch (error) {
      setSaveStatus({
        saving: false,
        message: error.message || "Capture failed. Try again after the 3D view finishes loading.",
        severity: "error",
      });
    }
  }, [buildCurrentSavedDesign, designLeadId, fetchAPI, navigate, previewReturnTo, sourceLead]);

  if (modelPoints.length < MIN_ROOF_POINTS) {
    return (
      <Stack gap={2} sx={{ width: "100%", py: 4 }}>
        <Alert severity="warning">
          Select at least {MIN_ROOF_POINTS} roof outline points on the map before opening 3D preview.
        </Alert>
        <Button
          variant="contained"
          startIcon={<ArrowBack />}
          onClick={handlePreviewBack}
          sx={{ alignSelf: "flex-start" }}
        >
          {previewReturnTo ? "Back to Lead" : "Back to Map"}
        </Button>
      </Stack>
    );
  }

  return (
    <Box
      sx={{
        width: "100%",
        height: { xs: "calc(100vh - 92px)", sm: "calc(100vh - 122px)" },
        minHeight: { xs: 560, md: 650 },
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: { xs: 1.2, md: 1.5 },
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ xs: "stretch", sm: "center" }}
          justifyContent="space-between"
          gap={1}
        >
          <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
            <Button
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={handlePreviewBack}
            >
              {previewReturnTo ? "Back to Lead" : "Back to Map"}
            </Button>
            <Chip
              size="small"
              icon={<HomeWork />}
              label="3D house preview"
              sx={{ bgcolor: alpha(ACCENT, 0.12), color: "#0b6f4d" }}
            />
            <Chip
              size="small"
              label={`${formatNumber(metrics.area, 1)} sq m`}
              sx={{ bgcolor: alpha(PRIMARY, 0.08), color: "#20304d" }}
            />
            <Chip
              size="small"
              label={`${solarConfig.count} solar panel${solarConfig.count === 1 ? "" : "s"}`}
              sx={{ bgcolor: alpha(PRIMARY, 0.1), color: PRIMARY }}
            />
            <Chip
              size="small"
              label={
                SOLAR_STRUCTURE_TYPES.find((type) => type.value === activeStructureType)
                  ?.label || "RCC Rooftop"
              }
              sx={{ bgcolor: alpha(WARNING, 0.12), color: "#945a00" }}
            />
          </Stack>
          <Stack direction="row" alignItems="center" justifyContent="flex-end" gap={1}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#172033" }}>
              3D Design Preview
            </Typography>
            <Button
              size="small"
              variant="contained"
              startIcon={<CameraAlt />}
              onClick={handleCapturePreview}
              sx={{
                bgcolor: "#0f766e",
                fontWeight: 800,
                "&:hover": { bgcolor: "#115e59" },
              }}
            >
              Capture
            </Button>
            <Button
              size="small"
              type="button"
              variant="contained"
              startIcon={saveStatus.saving ? <CircularProgress size={14} color="inherit" /> : <Save />}
              onClick={saveDesign}
              disabled={saveStatus.saving}
              sx={{
                bgcolor: "#2d3448",
                fontWeight: 800,
                "&:hover": { bgcolor: "#1f2638" },
              }}
            >
              Save
            </Button>
            <Button
              size="small"
              variant="contained"
              startIcon={<Share />}
              onClick={() => setShareOpen(true)}
              disabled={!shareUrl}
            >
              Share
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Box sx={{ flex: 1, minHeight: 0, position: "relative" }}>
        <ThreeHousePreview
          modelPoints={modelPoints}
          metrics={metrics}
          contextBuildings={EMPTY_CONTEXT_BUILDINGS}
          satelliteTextureUrl={satelliteTextureUrl}
          solarLayout={solarConfig}
          sunSettings={sunConfig}
          environmentMode={environmentMode}
          onSolarLayoutChange={updateSolarLayout}
          onCaptureReady={(captureHandler) => {
            capturePreviewRef.current = captureHandler;
          }}
          height="100%"
        />
        <EnvironmentModeButtons
          environmentMode={environmentMode}
          onChange={updateEnvironmentMode}
        />
        <Box
          sx={{
            position: "absolute",
            top: { xs: 124, sm: 14 },
            left: 14,
            width: { xs: "calc(100% - 28px)", sm: 300 },
            maxWidth: 320,
            maxHeight: { xs: "calc(100% - 138px)", sm: "calc(100% - 28px)" },
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 1,
            pr: 0.4,
          }}
        >
          <Paper
            elevation={5}
            sx={{
              p: 1.2,
              borderRadius: 2,
              border: "1px solid rgba(255,255,255,0.72)",
              bgcolor: "rgba(255,255,255,0.93)",
              backdropFilter: "blur(8px)",
            }}
          >
            <Stack gap={1}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#172033" }}>
                  Solar panels
                </Typography>
                <Chip
                  size="small"
                  label={solarConfig.count}
                  sx={{ bgcolor: alpha(PRIMARY, 0.1), color: PRIMARY, fontWeight: 800 }}
                />
              </Stack>

              <Stack direction="row" gap={1}>
                <Button
                  fullWidth
                  size="small"
                  variant="contained"
                  startIcon={<Add />}
                  onClick={addSolarPanelToLayout}
                  disabled={solarConfig.count >= MAX_SOLAR_PANELS}
                >
                  Add Solar
                </Button>
                <Button
                  fullWidth
                  size="small"
                  variant="outlined"
                  color="error"
                  startIcon={<Delete />}
                  onClick={removeSolarPanelFromLayout}
                  disabled={solarConfig.count <= 0}
                >
                  {solarConfig.selectedPanelIndex === -1 ? "Remove All" : "Remove"}
                </Button>
              </Stack>

              <TextField
                select
                fullWidth
                size="small"
                label="Access"
                value={
                  activeStructureType === "elevated_structure" ||
                  activeStructureType === "single_axis_tracker"
                    ? -1
                    : solarConfig.selectedPanelIndex
                }
                onChange={(event) => updateSelectedSolarTarget(event.target.value)}
                disabled={
                  solarConfig.count <= 0 ||
                  activeStructureType === "elevated_structure" ||
                  activeStructureType === "single_axis_tracker"
                }
              >
                <MenuItem value={-1}>All panels</MenuItem>
                {Array.from({ length: solarConfig.count }).map((_, index) => (
                  <MenuItem key={index} value={index}>
                    Panel {index + 1}
                  </MenuItem>
                ))}
              </TextField>

              <Stack
                gap={0.7}
                sx={{
                  p: 1,
                  borderRadius: 1.5,
                  border: "1px solid",
                  borderColor: alpha(PRIMARY, 0.16),
                  bgcolor: alpha(PRIMARY, 0.04),
                }}
              >
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography variant="caption" sx={{ fontWeight: 800, color: "#475569" }}>
                      Tilt angle
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: PRIMARY }}>
                      {structureConfig.tiltAngle} deg
                    </Typography>
                  </Stack>
                  <Slider
                    size="small"
                    min={0}
                    max={60}
                    step={1}
                    value={structureConfig.tiltAngle}
                    onChange={(_, value) =>
                      updateStructureSetting("tiltAngle", value)
                    }
                    sx={{ color: PRIMARY, py: 0.25 }}
                  />

                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography variant="caption" sx={{ fontWeight: 800, color: "#475569" }}>
                      Panel rows
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: PRIMARY }}>
                      {structureConfig.panelRows}
                    </Typography>
                  </Stack>
                  <Slider
                    size="small"
                    min={1}
                    max={MAX_SOLAR_PANEL_ROWS}
                    step={1}
                    value={structureConfig.panelRows}
                    onChange={(_, value) =>
                      updateStructureSetting("panelRows", value)
                    }
                    sx={{ color: PRIMARY, py: 0.25 }}
                  />

                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography variant="caption" sx={{ fontWeight: 800, color: "#475569" }}>
                      Panel columns
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: PRIMARY }}>
                      {structureConfig.panelColumns}
                    </Typography>
                  </Stack>
                  <Slider
                    size="small"
                    min={1}
                    max={MAX_SOLAR_PANEL_COLUMNS}
                    step={1}
                    value={structureConfig.panelColumns}
                    onChange={(_, value) =>
                      updateStructureSetting("panelColumns", value)
                    }
                    sx={{ color: PRIMARY, py: 0.25 }}
                  />

                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography variant="caption" sx={{ fontWeight: 800, color: "#475569" }}>
                      Structure height
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: PRIMARY }}>
                      {structureConfig.structureHeight}m
                    </Typography>
                  </Stack>
                  <Slider
                    size="small"
                    min={1}
                    max={5}
                    step={0.5}
                    value={structureConfig.structureHeight}
                    onChange={(_, value) =>
                      updateStructureSetting("structureHeight", value)
                    }
                    sx={{ color: PRIMARY, py: 0.25 }}
                  />
              </Stack>

              <TextField
                select
                fullWidth
                size="small"
                label="Structure Type"
                value={activeStructureType}
                onChange={(event) => updateSolarStructureType(event.target.value)}
              >
                {SOLAR_STRUCTURE_TYPES.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
          </Paper>

          <Paper
            elevation={5}
            sx={{
              p: 1.2,
              borderRadius: 2,
              border: "1px solid rgba(255,255,255,0.72)",
              bgcolor: "rgba(255,255,255,0.93)",
              backdropFilter: "blur(8px)",
            }}
          >
            <Stack gap={0.8}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
                <Stack direction="row" alignItems="center" gap={0.7}>
                  <WbSunny fontSize="small" sx={{ color: WARNING }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#172033" }}>
                    Sun path
                  </Typography>
                </Stack>
                <Typography variant="caption" sx={{ fontWeight: 800, color: "#475569" }}>
                  ALT: {formatNumber(sunInfo.altitudeDeg, 1)}°
                </Typography>
              </Stack>

              <Stack direction="row" alignItems="center" gap={0.7}>
                <CalendarToday sx={{ fontSize: 15, color: "#64748b" }} />
                <Typography variant="caption" sx={{ color: "#475569", fontWeight: 700 }}>
                  Date: {formatSunDate(sunConfig.dayOfYear)}
                </Typography>
              </Stack>
              <Slider
                size="small"
                min={0}
                max={364}
                step={1}
                value={sunConfig.dayOfYear}
                onChange={(_, value) => updateSunSetting("dayOfYear", value)}
                sx={{ color: ACCENT, py: 0.3 }}
              />

              <Stack direction="row" alignItems="center" gap={0.7}>
                <AccessTime sx={{ fontSize: 15, color: "#64748b" }} />
                <Typography variant="caption" sx={{ color: "#475569", fontWeight: 700 }}>
                  Time: {formatSunTime(sunConfig.timeMinutes)}
                </Typography>
              </Stack>
              <Slider
                size="small"
                min={SUN_TIME_MIN}
                max={SUN_TIME_MAX}
                step={15}
                value={sunConfig.timeMinutes}
                onChange={(_, value) => updateSunSetting("timeMinutes", value)}
                sx={{ color: ACCENT, py: 0.3 }}
              />

              <Stack direction="row" alignItems="center" gap={1}>
                <Tooltip title={isSunPlaying ? "Pause sun path" : "Play sun path"}>
                  <span>
                    <IconButton
                      size="small"
                      onClick={() => setIsSunPlaying((current) => !current)}
                      sx={{
                        width: 34,
                        height: 34,
                        border: "1px solid",
                        borderColor: "divider",
                        bgcolor: isSunPlaying ? alpha(WARNING, 0.12) : "background.paper",
                      }}
                    >
                      {isSunPlaying ? <Pause fontSize="small" /> : <PlayArrow fontSize="small" />}
                    </IconButton>
                  </span>
                </Tooltip>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Speed"
                  value={sunConfig.speed}
                  onChange={(event) => updateSunSetting("speed", Number(event.target.value))}
                  InputProps={{
                    startAdornment: <SpeedIcon sx={{ mr: 0.7, fontSize: 17, color: "#64748b" }} />,
                  }}
                >
                  {SUN_SPEED_OPTIONS.map((speed) => (
                    <MenuItem key={speed} value={speed}>
                      {speed} min/s
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>

              <FormControlLabel
                sx={{ m: 0 }}
                control={
                  <Switch
                    size="small"
                    checked={sunConfig.shadowsEnabled}
                    onChange={(event) => updateSunSetting("shadowsEnabled", event.target.checked)}
                  />
                }
                label={
                  <Typography variant="caption" sx={{ fontWeight: 800, color: "#475569" }}>
                    Shadows {sunConfig.shadowsEnabled ? "ON" : "OFF"}
                  </Typography>
                }
              />
            </Stack>
          </Paper>
        </Box>
      </Box>

      {shareOpen && (
        <Box
          sx={{
            position: "fixed",
            inset: 0,
            zIndex: 1600,
            display: "grid",
            placeItems: "center",
            px: 2,
            bgcolor: "rgba(15, 23, 42, 0.35)",
            backdropFilter: "blur(4px)",
          }}
          onClick={() => setShareOpen(false)}
        >
          <Paper
            elevation={10}
            sx={{
              width: "100%",
              maxWidth: 520,
              p: 2,
              borderRadius: 2,
              border: "1px solid rgba(255,255,255,0.78)",
              bgcolor: "rgba(255,255,255,0.96)",
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <Stack gap={1.4}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
                <Stack direction="row" alignItems="center" gap={0.8}>
                  <Share sx={{ fontSize: 18, color: PRIMARY }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 900, color: "#172033" }}>
                    Shareable Link
                  </Typography>
                </Stack>
                <IconButton size="small" onClick={() => setShareOpen(false)}>
                  <Close fontSize="small" />
                </IconButton>
              </Stack>

              <Divider />

              <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 700 }}>
                Anyone with this link can view the interactive 3D design, no login required.
              </Typography>

              <Stack direction={{ xs: "column", sm: "row" }} gap={1}>
                <TextField
                  fullWidth
                  size="small"
                  value={shareUrl}
                  inputProps={{ readOnly: true }}
                />
                <Button
                  variant="contained"
                  startIcon={<ContentCopy />}
                  onClick={copyShareUrl}
                  disabled={!shareUrl}
                  sx={{ minWidth: 104 }}
                >
                  {shareCopied ? "Copied" : "Copy"}
                </Button>
              </Stack>

              <Button
                fullWidth
                variant="contained"
                color="success"
                startIcon={<WhatsApp />}
                onClick={openWhatsAppShare}
                disabled={!shareUrl}
              >
                Send on WhatsApp
              </Button>

              <Button
                fullWidth
                variant="outlined"
                startIcon={<OpenInNew />}
                onClick={openSharePreview}
                disabled={!shareUrl}
              >
                Open Preview in New Tab
              </Button>
            </Stack>
          </Paper>
        </Box>
      )}
      <Snackbar
        open={Boolean(saveStatus.message)}
        autoHideDuration={3200}
        onClose={() => setSaveStatus((current) => ({ ...current, message: "" }))}
      >
        <Alert
          severity={saveStatus.severity}
          onClose={() => setSaveStatus((current) => ({ ...current, message: "" }))}
        >
          {saveStatus.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export const SharedThreeDDesignView = () => {
  const location = useLocation();
  const sharedDesign = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const payload = decodeSharePayload(params.get(SHARE_DATA_PARAM));
    if (!payload || !Array.isArray(payload.points)) return null;

    const points = sanitizeRoofPoints(payload.points);

    if (points.length < MIN_ROOF_POINTS) return null;

    return {
      points,
      satelliteTextureUrl:
        typeof payload.satelliteTextureUrl === "string" ? payload.satelliteTextureUrl : "",
      solarLayout: sanitizeSolarLayout(payload.solarLayout),
      sunSettings: sanitizeSunSettings(payload.sunSettings || DEFAULT_SUN_SETTINGS),
      environmentMode: getEnvironmentMode(payload.environmentMode),
    };
  }, [location.search]);
  const [environmentMode, setEnvironmentMode] = useState(
    getEnvironmentMode(sharedDesign?.environmentMode)
  );
  const [sunSettings, setSunSettings] = useState(() =>
    sanitizeSunSettings(sharedDesign?.sunSettings || DEFAULT_SUN_SETTINGS)
  );
  const modelPoints = sharedDesign?.points || [];
  const metrics = useMemo(() => getRoofMetrics(modelPoints), [modelPoints]);
  const solarConfig = useMemo(
    () => sanitizeSolarLayout(sharedDesign?.solarLayout),
    [sharedDesign]
  );
  const sunConfig = useMemo(() => sanitizeSunSettings(sunSettings), [sunSettings]);

  useEffect(() => {
    if (!sharedDesign) return;
    setEnvironmentMode(getEnvironmentMode(sharedDesign.environmentMode));
    setSunSettings(sanitizeSunSettings(sharedDesign.sunSettings));
  }, [sharedDesign]);

  const updateEnvironmentMode = useCallback((mode) => {
    const safeMode = getEnvironmentMode(mode);
    setEnvironmentMode(safeMode);
  }, []);

  if (!sharedDesign) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          p: 2,
          bgcolor: "#f8fafc",
        }}
      >
        <Paper sx={{ maxWidth: 420, p: 3, borderRadius: 2, textAlign: "center" }}>
          <Typography variant="h6" sx={{ fontWeight: 900, color: "#172033", mb: 1 }}>
            Preview link not available
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748b" }}>
            Please ask the team to share the 3D design link again.
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: "100dvh",
        minHeight: "100vh",
        width: "100vw",
        overflow: "hidden",
        bgcolor: getEnvironmentPreset(environmentMode).surfaceColor,
        position: "relative",
        touchAction: "none",
        overscrollBehavior: "none",
      }}
    >
      <ThreeHousePreview
        modelPoints={modelPoints}
        metrics={metrics}
        contextBuildings={EMPTY_CONTEXT_BUILDINGS}
        satelliteTextureUrl={sharedDesign.satelliteTextureUrl || getSatelliteTextureUrl(modelPoints)}
        solarLayout={solarConfig}
        sunSettings={sunConfig}
        environmentMode={environmentMode}
        height="100%"
      />

      <Chip
        size="small"
        icon={<WbSunny />}
        label="Solar Roof 3D"
        sx={{
          position: "absolute",
          top: 18,
          left: 18,
          zIndex: 4,
          height: 30,
          borderRadius: 999,
          bgcolor: "rgba(15, 23, 42, 0.64)",
          color: "#e5edf8",
          fontWeight: 900,
          backdropFilter: "blur(8px)",
          "& .MuiChip-icon": { color: "#fbbf24" },
        }}
      />

      <EnvironmentModeButtons
        environmentMode={environmentMode}
        onChange={updateEnvironmentMode}
      />
    </Box>
  );
};

export default ThreeDDesign;
