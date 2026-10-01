import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  alpha,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogTitle,
  FormHelperText,
  Grid,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import {
  ArrowBack,
  ArrowForward,
  CameraAlt,
  CheckCircle,
  Close,
  CloudUploadOutlined,
  Email,
  HomeWorkOutlined,
  LocationOn,
  MyLocation,
  Phone,
  Search,
  Tag,
  WhatsApp,
} from "@mui/icons-material";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useLocation, useNavigate } from "react-router-dom";
import { Autocomplete } from "@react-google-maps/api";

// Fix default Leaflet icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});
import { useAuth } from "../contexts/AuthContext";
import { buildApiUrl } from "../utils/apiConfig";
import { toBackendAssetUrl } from "../utils/backendAssetUrl";

const PRIMARY = "#e8703a";
const PRIMARY_DARK = "#d05e2a";
const ERROR_COLOR = "#dc2626";
const SUCCESS = "#16a34a";

const getIsDark = () => {
  try {
    const saved = localStorage.getItem("appThemeMode");
    if (saved) return saved === "dark";
  } catch {}
  return true;
};

const THEME = {
  get isDark() { return getIsDark(); },
  get PRIMARY_LIGHT() { return this.isDark ? "rgba(232, 112, 58, 0.18)" : "#fff4ef"; },
  get SURFACE() { return this.isDark ? "#0e1626" : "#ffffff"; },
  get SURFACE_ALT() { return this.isDark ? "#050811" : "#f6f7f9"; },
  get CARD_HEADER() { return this.isDark ? "#121d31" : "#fafafa"; },
  get BORDER() { return this.isDark ? "rgba(255, 255, 255, 0.08)" : "#e8eaed"; },
  get TEXT() { return this.isDark ? "#f8fafc" : "#18181b"; },
  get TEXT_SUB() { return this.isDark ? "#cbd5e1" : "#52525b"; },
  get TEXT_MUTED() { return this.isDark ? "#94a3b8" : "#a1a1aa"; },
  get PILL_BG() { return this.isDark ? "#172338" : "#ffffff"; },
  get PILL_SEL_BG() { return this.isDark ? "rgba(232, 112, 58, 0.25)" : "#fff4ef"; },
  get BADGE_BG() { return this.isDark ? "rgba(255, 255, 255, 0.08)" : "#f0f0f0"; },
  get STEP_INACTIVE_BG() { return this.isDark ? "rgba(255, 255, 255, 0.08)" : "#f0f0f0"; },
  get DROPZONE_BG() { return this.isDark ? "rgba(255, 255, 255, 0.02)" : "#fafafa"; },
  get DROPZONE_BORDER() { return this.isDark ? "rgba(255, 255, 255, 0.15)" : "#d4d4d4"; },
};
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
const DEFAULT_CENTER = { lat: 20.5937, lng: 78.9629 };
const GOOGLE_MAPS_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || "AIzaSyDQYrvUxQPWUrpqWIy-tLg4f3DGrr4GTlg";
const GOOGLE_MAP_CONTAINER_STYLE = { width: "100%", height: "100%" };
const GOOGLE_MAP_LIBRARIES = ["places"];
const SITE_SURVEY_DRAFT_STORAGE_KEY = "site-survey-active-draft";

const ROOF_TYPES = ["Flat Roof", "Sloped Roof", "Metal Roof", "Tile Roof", "Concrete Roof"];
const ROOF_MATERIALS = ["Concrete", "Metal Sheet", "Tile", "Asphalt", "Wood"];
const ROOF_CONDITIONS = ["Excellent", "Good", "Fair", "Poor", "Needs Repair"];
const SHADING_OPTIONS = ["Trees", "Buildings", "Water Tank", "Antenna/Satellite", "None"];
const SITE_ACCESS_OPTIONS = ["Easy", "Moderate", "Difficult", "Very Difficult"];
const EARTHING_OPTIONS = ["Yes", "No", "Needs Upgrade"];
const PHASE_OPTIONS = ["Single Phase", "Three Phase"];
const PANEL_BRANDS = ["Waaree", "Adani", "Tata Power", "Vikram Solar", "Renewsys"];
const INVERTER_BRANDS = ["Growatt", "SMA", "Fronius", "Sungrow", "Huawei"];
const INVERTER_TYPES = ["String Inverter", "Microinverter", "Hybrid Inverter"];

const getToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("authToken") ||
  localStorage.getItem("accessToken") ||
  "";

const getLeadFullName = (lead) => [lead?.firstName, lead?.lastName].filter(Boolean).join(" ").trim();

const normalizeLocationText = (value) => String(value || "").trim().toLowerCase();

const getUsableLocationText = (lead, ...values) => {
  const leadName = getLeadFullName(lead);
  const companyName = String(lead?.companyName || "").trim();
  const blockedLabels = new Set(
    [leadName, companyName]
      .map(normalizeLocationText)
      .filter(Boolean)
  );

  for (const value of values) {
    const trimmedValue = String(value || "").trim();
    if (!trimmedValue) continue;
    if (!blockedLabels.has(normalizeLocationText(trimmedValue))) {
      return trimmedValue;
    }
  }

  return "";
};

const getPreferredLocationLabel = (lead, siteSurvey = null) => {
  return getUsableLocationText(
    lead,
    siteSurvey?.locationName,
    lead?.address,
    lead?.city
  );
};

const getTodayAttendanceFromResponse = (payload) => {
  const attendanceRows = payload?.result?.attendances || payload?.attendances || [];
  const today = new Date().toDateString();
  return attendanceRows.find((row) => new Date(row?.date).toDateString() === today) || null;
};

const extractApiErrorMessage = (payload, fallback) =>
  payload?.message ||
  payload?.error?.message ||
  payload?.result?.message ||
  fallback;

const getExistingSiteSurvey = (lead) =>
  lead?.siteSurvey && typeof lead.siteSurvey === "object" ? lead.siteSurvey : null;

const parseStoredJson = (value) => {
  try {
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

const readSiteSurveyDraft = () => {
  if (typeof window === "undefined") return null;
  return parseStoredJson(window.localStorage.getItem(SITE_SURVEY_DRAFT_STORAGE_KEY));
};

const buildLeadDraftSnapshot = (lead) => {
  if (!lead || typeof lead !== "object") return null;
  return {
    _id: lead._id || "",
    firstName: lead.firstName || "",
    lastName: lead.lastName || "",
    companyName: lead.companyName || "",
    phone: lead.phone || "",
    email: lead.email || "",
    address: lead.address || "",
    city: lead.city || "",
    pincode: lead.pincode || "",
    siteSurvey: getExistingSiteSurvey(lead),
  };
};

const makeInitialSurveyData = (lead, siteSurvey = null) => {
  const general = siteSurvey?.general || {};
  return {
    roofType: general.roofType || "",
    roofMaterial: general.roofMaterial || "",
    roofCondition: general.roofCondition || "",
    shadingIssues: Array.isArray(general.shadingIssues) ? general.shadingIssues : [],
    siteAccess: general.siteAccess || "",
    existingElectricalLoad: general.existingElectricalLoad || "",
    mainDistributionBoardLocation: general.mainDistributionBoardLocation || "",
    earthingAvailable: general.earthingAvailable || "",
    phaseType: general.phaseType || "",
    recommendedPanelBrand: general.recommendedPanelBrand || "",
    recommendedInverterBrand: general.recommendedInverterBrand || "",
    inverterType: general.inverterType || "",
    availableRoofArea: general.availableRoofArea || "",
    usableRoofArea: general.usableRoofArea || "",
    distanceFromRoofToDb: general.distanceFromRoofToDb || "",
    customerExpectations: general.customerExpectations || "",
    specialRequirements: general.specialRequirements || "",
    challengesConcerns: general.challengesConcerns || "",
    locationName: getPreferredLocationLabel(lead, siteSurvey),
    latitude:
      siteSurvey?.latitude !== undefined && siteSurvey?.latitude !== null
        ? String(siteSurvey.latitude)
        : "",
    longitude:
      siteSurvey?.longitude !== undefined && siteSurvey?.longitude !== null
        ? String(siteSurvey.longitude)
        : "",
    remarks: siteSurvey?.remarks || "",
  };
};

const buildPersistedPhotoList = (storedPhotos = []) => {
  return storedPhotos
    .map((photo, index) => {
      const preview =
        typeof photo === "string"
          ? photo
          : photo?.url || photo?.uri || photo?.path || photo?.location || photo?.src || "";
      if (!preview) return null;
      const normalizedPreview = toBackendAssetUrl(preview);
      if (!normalizedPreview) return null;

      return {
        id: `existing-${index}-${String(preview).slice(-18)}`,
        file: null,
        preview: normalizedPreview,
        persistedUrl: preview,
      };
    })
    .filter(Boolean);
};

const buildInitialPhotos = (siteSurvey = null) => {
  const storedPhotos = Array.isArray(siteSurvey?.photos) ? siteSurvey.photos : [];
  return buildPersistedPhotoList(storedPhotos);
};

const buildDraftPhotos = (draftPhotos = [], siteSurvey = null) => {
  const restoredPhotos = buildPersistedPhotoList(Array.isArray(draftPhotos) ? draftPhotos : []);
  return restoredPhotos.length ? restoredPhotos : buildInitialPhotos(siteSurvey);
};

const mergeSurveyDraftData = (baseData, draftData) => {
  if (!draftData || typeof draftData !== "object") return baseData;
  return {
    ...baseData,
    ...draftData,
    shadingIssues: Array.isArray(draftData.shadingIssues)
      ? draftData.shadingIssues.filter(Boolean)
      : baseData.shadingIssues,
    locationName:
      typeof draftData.locationName === "string" ? draftData.locationName : baseData.locationName,
    latitude:
      draftData.latitude !== undefined && draftData.latitude !== null
        ? String(draftData.latitude)
        : baseData.latitude,
    longitude:
      draftData.longitude !== undefined && draftData.longitude !== null
        ? String(draftData.longitude)
        : baseData.longitude,
    remarks: typeof draftData.remarks === "string" ? draftData.remarks : baseData.remarks,
  };
};

const getPersistedPhotoRefs = (photos = []) =>
  photos
    .filter((photo) => !photo?.file && (photo?.persistedUrl || photo?.preview))
    .map((photo) => photo.persistedUrl || photo.preview)
    .filter(Boolean);

const getDraftStep = (draft) => {
  const step = Number(draft?.currentStep);
  return step >= 1 && step <= 3 ? step : 1;
};


/* ─── Shared section wrapper ─── */
function SectionCard({ icon, title, badge, children }) {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        border: `1px solid ${THEME.BORDER}`,
        bgcolor: THEME.SURFACE,
        overflow: "hidden",
        mb: 2,
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{
          px: 2.5,
          py: 1.5,
          borderBottom: `1px solid ${THEME.BORDER}`,
          bgcolor: THEME.CARD_HEADER,
        }}
      >
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Box
            sx={{
              width: 30,
              height: 30,
              borderRadius: 1.5,
              bgcolor: THEME.PRIMARY_LIGHT,
              color: PRIMARY,
              display: "grid",
              placeItems: "center",
            }}
          >
            {icon}
          </Box>
          <Typography sx={{ fontSize: "0.92rem", fontWeight: 700, color: THEME.TEXT }}>
            {title}
          </Typography>
        </Stack>
        {badge && (
          <Chip
            label={badge}
            size="small"
            sx={{
              height: 22,
              bgcolor: THEME.BADGE_BG,
              color: THEME.TEXT_MUTED,
              fontSize: "0.7rem",
              fontWeight: 600,
              borderRadius: 999,
            }}
          />
        )}
      </Stack>
      <Box sx={{ p: 2.5, bgcolor: THEME.SURFACE }}>{children}</Box>
    </Paper>
  );
}

/* ─── Field label ─── */
function FieldLabel({ children, required }) {
  return (
    <Typography
      sx={{
        fontSize: "0.78rem",
        fontWeight: 600,
        color: THEME.TEXT_SUB,
        mb: 0.75,
        letterSpacing: "0.01em",
      }}
    >
      {children}
      {required && (
        <Box component="span" sx={{ color: ERROR_COLOR, ml: 0.4 }}>
          *
        </Box>
      )}
    </Typography>
  );
}

/* ─── Pill selector (radio) ─── */
function PillGroup({ options, value, onChange }) {
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
      {options.map((opt) => {
        const sel = value === opt;
        return (
          <Box
            key={opt}
            onClick={() => onChange(opt)}
            sx={{
              px: 1.5,
              py: 0.6,
              borderRadius: 2,
              border: `1.5px solid ${sel ? PRIMARY : THEME.BORDER}`,
              bgcolor: sel ? THEME.PILL_SEL_BG : THEME.PILL_BG,
              color: sel ? PRIMARY : THEME.TEXT_SUB,
              fontWeight: sel ? 700 : 500,
              fontSize: "0.8rem",
              cursor: "pointer",
              userSelect: "none",
              transition: "all 0.15s",
              "&:hover": { borderColor: PRIMARY, bgcolor: sel ? THEME.PILL_SEL_BG : THEME.PRIMARY_LIGHT },
            }}
          >
            {opt}
          </Box>
        );
      })}
    </Box>
  );
}

/* ─── Pill selector (checkbox / multi) ─── */
function CheckPillGroup({ options, value = [], onChange }) {
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
      {options.map((opt) => {
        const sel = value.includes(opt);
        return (
          <Box
            key={opt}
            onClick={() => onChange(opt)}
            sx={{
              px: 1.5,
              py: 0.6,
              borderRadius: 2,
              border: `1.5px solid ${sel ? PRIMARY : THEME.BORDER}`,
              bgcolor: sel ? THEME.PILL_SEL_BG : THEME.PILL_BG,
              color: sel ? PRIMARY : THEME.TEXT_SUB,
              fontWeight: sel ? 700 : 500,
              fontSize: "0.8rem",
              cursor: "pointer",
              userSelect: "none",
              transition: "all 0.15s",
              "&:hover": { borderColor: PRIMARY, bgcolor: sel ? THEME.PILL_SEL_BG : THEME.PRIMARY_LIGHT },
            }}
          >
            {opt}
          </Box>
        );
      })}
    </Box>
  );
}

/* ─── Photo thumbnail ─── */
function UploadPreview({ photo, onRemove }) {
  if (!photo?.preview) return null;

  const photoLabel =
    photo?.file?.name ||
    photo?.persistedUrl?.split?.("/")?.pop?.() ||
    "Survey photo";

  return (
    <Box
      sx={{
        position: "relative",
        width: 96,
        height: 96,
        borderRadius: 2,
        overflow: "hidden",
        border: `1.5px solid ${THEME.BORDER}`,
        flexShrink: 0,
      }}
    >
      <Box
        component="img"
        src={photo.preview}
        alt={photoLabel}
        sx={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
      <IconButton
        size="small"
        onClick={() => onRemove(photo?.id)}
        sx={{
          position: "absolute",
          top: 4,
          right: 4,
          width: 22,
          height: 22,
          bgcolor: "rgba(0,0,0,0.6)",
          color: "#fff",
          "&:hover": { bgcolor: "rgba(0,0,0,0.8)" },
        }}
      >
        <Close sx={{ fontSize: 13 }} />
      </IconButton>
    </Box>
  );
}

/* ─── Success dialog ─── */
function SuccessDialog({ open, onClose, leadName }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3, bgcolor: THEME.SURFACE } }}>
      <DialogTitle sx={{ textAlign: "center", pt: 4 }}>
        <Box
          sx={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            bgcolor: alpha(SUCCESS, 0.1),
            display: "grid",
            placeItems: "center",
            mx: "auto",
            mb: 2,
          }}
        >
          <CheckCircle sx={{ fontSize: 40, color: SUCCESS }} />
        </Box>
        <Typography variant="h6" sx={{ color: THEME.TEXT, fontWeight: 800 }}>
          Site Survey Saved
        </Typography>
        <Typography variant="body2" sx={{ color: THEME.TEXT_MUTED, mt: 0.75 }}>
          {leadName
            ? `Survey for ${leadName} was saved successfully.`
            : "Survey details were saved successfully."}
        </Typography>
      </DialogTitle>
      <DialogActions sx={{ justifyContent: "center", pb: 3.5, px: 3 }}>
        <Button
          variant="contained"
          onClick={onClose}
          disableElevation
          sx={{
            borderRadius: 2,
            px: 3.5,
            py: 1,
            bgcolor: PRIMARY,
            fontWeight: 700,
            textTransform: "none",
            fontSize: "0.88rem",
            "&:hover": { bgcolor: PRIMARY_DARK },
          }}
        >
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ========== LEAFLET MAP PICKER (GOOGLE MAPS TILES) ==========
const LeafletMapPicker = ({ center, markerPosition, onMapPick }) => {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const lat = markerPosition?.lat || center?.lat || 20.5937;
    const lng = markerPosition?.lng || center?.lng || 78.9629;

    if (!mapRef.current) {
      const map = L.map(containerRef.current, {
        center: [lat, lng],
        zoom: markerPosition?.lat ? 17 : 14,
        zoomControl: true,
      });

      const googleStreets = L.tileLayer(
        "https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
        {
          maxZoom: 20,
          subdomains: ["mt0", "mt1", "mt2", "mt3"],
          attribution: "Google Maps",
        }
      );

      const googleHybrid = L.tileLayer(
        "https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}",
        {
          maxZoom: 20,
          subdomains: ["mt0", "mt1", "mt2", "mt3"],
          attribution: "Google Satellite",
        }
      );

      googleStreets.addTo(map);

      const baseMaps = {
        "Google Map": googleStreets,
        "Google Satellite": googleHybrid,
      };

      L.control.layers(baseMaps, null, { position: "topright" }).addTo(map);

      const marker = L.marker([lat, lng], { draggable: true }).addTo(map);

      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        onMapPick(pos.lat, pos.lng);
      });

      map.on("click", (e) => {
        const { lat: clickLat, lng: clickLng } = e.latlng;
        marker.setLatLng([clickLat, clickLng]);
        onMapPick(clickLat, clickLng);
      });

      mapRef.current = map;
      markerRef.current = marker;

      setTimeout(() => {
        map.invalidateSize();
      }, 300);
    } else {
      mapRef.current.setView([lat, lng], mapRef.current.getZoom() || 17);
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      }
    }
  }, [center?.lat, center?.lng, markerPosition?.lat, markerPosition?.lng]);

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return <div ref={containerRef} style={{ width: "100%", height: "100%", borderRadius: "8px" }} />;
};

/* ════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════ */
export default function VisitDetails({ onClose, onSave }) {
  const theme = useTheme();
  const [, setThemeTick] = useState(0);
  useEffect(() => {
    const handleTheme = () => setThemeTick((t) => t + 1);
    window.addEventListener("themeModeChange", handleTheme);
    return () => window.removeEventListener("themeModeChange", handleTheme);
  }, []);
  const isDark = theme?.palette?.mode === "dark" || THEME.isDark;
  const navigate = useNavigate();
  const locationState = useLocation();
  const { fetchAPI, getUserRole } = useAuth();
  const incomingLead = locationState.state?.lead || null;
  const restoredDraft = useMemo(() => readSiteSurveyDraft(), []);
  const canUseRestoredDraft = useMemo(() => {
    if (!restoredDraft) return false;
    if (!incomingLead?._id) return true;
    return restoredDraft?.lead?._id === incomingLead._id;
  }, [incomingLead?._id, restoredDraft]);
  const [lead, setLead] = useState(() =>
    incomingLead || (canUseRestoredDraft ? restoredDraft?.lead || null : null)
  );
  const existingSiteSurvey = useMemo(() => getExistingSiteSurvey(lead), [lead]);
  const currentUserRole = getUserRole?.() || null;
  const restoredDraftRef = useRef(canUseRestoredDraft && Boolean(restoredDraft));

  const isGoogleMapLoaded = typeof window !== "undefined" && Boolean(window.google?.maps?.places);
  const googleMapLoadError = false;

  const [currentStep, setCurrentStep] = useState(() =>
    canUseRestoredDraft ? getDraftStep(restoredDraft) : 1
  );
  const [surveyData, setSurveyData] = useState(() => {
    const baseData = makeInitialSurveyData(
      incomingLead || (canUseRestoredDraft ? restoredDraft?.lead : lead),
      existingSiteSurvey
    );
    return canUseRestoredDraft ? mergeSurveyDraftData(baseData, restoredDraft?.surveyData) : baseData;
  });
  const [photos, setPhotos] = useState(() =>
    canUseRestoredDraft
      ? buildDraftPhotos(restoredDraft?.photos, existingSiteSurvey)
      : buildInitialPhotos(existingSiteSurvey)
  );
  const [validationErrors, setValidationErrors] = useState({});
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationAttempts, setLocationAttempts] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successOpen, setSuccessOpen] = useState(false);
  const [submittedVisit, setSubmittedVisit] = useState(null);
  const [locationSearch, setLocationSearch] = useState(() =>
    canUseRestoredDraft
      ? getUsableLocationText(
          lead,
          restoredDraft?.locationSearch,
          restoredDraft?.surveyData?.locationName,
          existingSiteSurvey?.locationName,
          lead?.address,
          lead?.city
        )
      : getPreferredLocationLabel(lead, existingSiteSurvey)
  );
  const [searchingAddress, setSearchingAddress] = useState(false);
  const fileInputRef = useRef(null);
  const autocompleteRef = useRef(null);

  const leadName = useMemo(
    () => getLeadFullName(lead) || lead?.companyName || "Site Survey",
    [lead]
  );
  const avatarLabel = useMemo(() => {
    const seed = leadName || "SS";
    return (
      seed
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase())
        .join("") || "SS"
    );
  }, [leadName]);

  const mapCenter = useMemo(() => {
    if (surveyData.latitude && surveyData.longitude)
      return { lat: Number(surveyData.latitude), lng: Number(surveyData.longitude) };
    return DEFAULT_CENTER;
  }, [surveyData.latitude, surveyData.longitude]);
  const markerPosition = useMemo(() => {
    if (surveyData.latitude && surveyData.longitude) {
      return { lat: Number(surveyData.latitude), lng: Number(surveyData.longitude) };
    }
    return mapCenter;
  }, [mapCenter, surveyData.latitude, surveyData.longitude]);
  const surveyMarkerAnimation = useMemo(() => {
    if (!isGoogleMapLoaded || !window.google?.maps?.Animation) return undefined;
    return window.google.maps.Animation.DROP;
  }, [isGoogleMapLoaded]);

  useEffect(() => {
    if (incomingLead) setLead(incomingLead);
  }, [incomingLead]);

  const updateField = useCallback((field, value) => {
    setSurveyData((prev) => ({ ...prev, [field]: value }));
    setValidationErrors((prev) => ({ ...prev, [field]: "" }));
    setError("");
  }, []);

  const toggleCheckboxValue = useCallback((field, value) => {
    setSurveyData((prev) => {
      const current = prev[field] || [];
      const next =
        current.includes(value)
          ? current.filter((i) => i !== value)
          : value === "None"
          ? ["None"]
          : [...current.filter((i) => i !== "None"), value];
      return { ...prev, [field]: next };
    });
    setValidationErrors((prev) => ({ ...prev, [field]: "" }));
    setError("");
  }, []);

  const reverseGeocode = useCallback(async (lat, lng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
        { headers: { Accept: "application/json" } }
      );
      if (!res.ok) return "";
      const data = await res.json();
      return data?.display_name || "";
    } catch {
      return "";
    }
  }, []);

  const applyCoordinates = useCallback(
    async (lat, lng, options = {}) => {
      const { shouldPrefillLocation = true, forcedLocationName = "" } = options;
      updateField("latitude", Number(lat).toFixed(6));
      updateField("longitude", Number(lng).toFixed(6));
      if (forcedLocationName) {
        updateField("locationName", forcedLocationName);
        setLocationSearch(forcedLocationName);
        return;
      }
      if (shouldPrefillLocation && !surveyData.locationName.trim()) {
        const label = await reverseGeocode(lat, lng);
        if (label) {
          updateField("locationName", label);
          setLocationSearch(label);
        }
      }
    },
    [reverseGeocode, surveyData.locationName, updateField]
  );

  const getCurrentLocation = useCallback(
    (attempt = 0) => {
      if (!navigator.geolocation) {
        setError("Geolocation is not supported by this browser.");
        return;
      }
      setLocationLoading(true);
      setError("");
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          await applyCoordinates(pos.coords.latitude, pos.coords.longitude, {
            shouldPrefillLocation: true,
          });
          setLocationAttempts(0);
          setLocationLoading(false);
        },
        (geoError) => {
          if ((geoError.code === 3 || geoError.code === geoError.TIMEOUT) && attempt < 2) {
            const next = attempt + 1;
            setLocationAttempts(next);
            setTimeout(() => getCurrentLocation(next), 1200);
            return;
          }
          setLocationLoading(false);
          setError(
            geoError.code === 1
              ? "Location permission denied."
              : "Unable to capture current location."
          );
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
      );
    },
    [applyCoordinates]
  );

  useEffect(() => {
    if (surveyData.latitude && surveyData.longitude) return;
    if (existingSiteSurvey?.latitude && existingSiteSurvey?.longitude) return;
    getCurrentLocation();
  }, [
    existingSiteSurvey?.latitude,
    existingSiteSurvey?.longitude,
    getCurrentLocation,
    surveyData.latitude,
    surveyData.longitude,
  ]);

  useEffect(() => {
    if (!lead) return;
    if (restoredDraftRef.current) {
      restoredDraftRef.current = false;
      return;
    }
    setSurveyData(makeInitialSurveyData(lead, existingSiteSurvey));
    setPhotos(buildInitialPhotos(existingSiteSurvey));
    setLocationSearch(getPreferredLocationLabel(lead, existingSiteSurvey));
  }, [existingSiteSurvey, lead]);

  useEffect(() => {
    const hasDraftableData =
      Boolean(lead?._id) ||
      Boolean(locationSearch.trim()) ||
      Boolean(surveyData.locationName.trim()) ||
      Boolean(surveyData.latitude) ||
      Boolean(surveyData.longitude) ||
      photos.length > 0;

    if (!hasDraftableData) return;

    try {
      window.localStorage.setItem(
        SITE_SURVEY_DRAFT_STORAGE_KEY,
        JSON.stringify({
          lead: buildLeadDraftSnapshot(lead),
          currentStep,
          locationSearch,
          surveyData,
          photos: getPersistedPhotoRefs(photos),
          savedAt: new Date().toISOString(),
        })
      );
    } catch {
      // Ignore storage failures and continue using in-memory form state.
    }
  }, [currentStep, lead, locationSearch, photos, surveyData]);

  useEffect(() => {
    return () => {
      photos.forEach((photo) => {
        if (photo?.preview?.startsWith?.("blob:")) {
          URL.revokeObjectURL(photo.preview);
        }
      });
    };
  }, [photos]);

  const addFiles = useCallback((fileList) => {
    const picked = Array.from(fileList || []);
    if (!picked.length) return;
    const valid = [];
    let localError = "";
    picked.forEach((file) => {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        localError = "Only JPG, PNG, WEBP, HEIC, and HEIF images are supported.";
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        localError = "Each image must be under 10 MB.";
        return;
      }
      valid.push({
        id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        preview: URL.createObjectURL(file),
      });
    });
    if (localError) setError(localError);
    if (valid.length) {
      setPhotos((prev) => [...prev, ...valid]);
      setValidationErrors((prev) => ({ ...prev, photos: "" }));
      setError("");
    }
  }, []);

  const handleFileChange = useCallback(
    (e) => {
      addFiles(e.target.files);
      e.target.value = "";
    },
    [addFiles]
  );

  const removePhoto = useCallback((photoId) => {
    setPhotos((prev) => {
      const t = prev.find((p) => p.id === photoId);
      if (t?.preview?.startsWith?.("blob:")) URL.revokeObjectURL(t.preview);
      return prev.filter((p) => p.id !== photoId);
    });
  }, []);

  const handleMapPick = useCallback(
    async (lat, lng) => {
      await applyCoordinates(lat, lng, { shouldPrefillLocation: true });
    },
    [applyCoordinates]
  );

  const searchLocationOnMap = useCallback(async () => {
    if (!locationSearch.trim()) {
      setError("Enter a house name or address to search.");
      return;
    }
    setSearchingAddress(true);
    setError("");
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          locationSearch.trim()
        )}`
      );
      const payload = await res.json();
      const result = payload?.[0];
      if (!result || !result.lat || !result.lon)
        throw new Error("No matching location found.");
      const numLat = parseFloat(result.lat);
      const numLng = parseFloat(result.lon);
      const formattedAddress = result.display_name || locationSearch.trim();
      await applyCoordinates(numLat, numLng, {
        shouldPrefillLocation: true,
        forcedLocationName: formattedAddress,
      });
      setLocationSearch(formattedAddress);
    } catch (e) {
      setError(e.message || "Unable to find that address.");
    } finally {
      setSearchingAddress(false);
    }
  }, [applyCoordinates, locationSearch]);

  const handleAutocompleteLoad = useCallback((ac) => {
    autocompleteRef.current = ac;
  }, []);

  const handlePlaceChanged = useCallback(async () => {
    const place = autocompleteRef.current?.getPlace?.();
    const lat = place?.geometry?.location?.lat?.();
    const lng = place?.geometry?.location?.lng?.();
    if (typeof lat !== "number" || typeof lng !== "number") return;
    const label = place?.formatted_address || place?.name || locationSearch.trim();
    await applyCoordinates(lat, lng, { shouldPrefillLocation: true, forcedLocationName: label });
    setLocationSearch(label);
  }, [applyCoordinates, locationSearch]);

  const validateStep = useCallback(
    (step) => {
      const errs = {};
      if (step === 1) {
        if (!surveyData.roofType) errs.roofType = "Required";
        if (!surveyData.roofMaterial) errs.roofMaterial = "Required";
        if (!surveyData.roofCondition) errs.roofCondition = "Required";
        if (!surveyData.siteAccess) errs.siteAccess = "Required";
        if (!surveyData.existingElectricalLoad) errs.existingElectricalLoad = "Required";
        if (!surveyData.mainDistributionBoardLocation.trim())
          errs.mainDistributionBoardLocation = "Required";
        if (!surveyData.earthingAvailable) errs.earthingAvailable = "Required";
        if (!surveyData.phaseType) errs.phaseType = "Required";
        if (!surveyData.recommendedPanelBrand) errs.recommendedPanelBrand = "Required";
        if (!surveyData.recommendedInverterBrand) errs.recommendedInverterBrand = "Required";
        if (!surveyData.availableRoofArea) errs.availableRoofArea = "Required";
        if (!surveyData.usableRoofArea) errs.usableRoofArea = "Required";
      }
      if (step === 2) {
        if (!surveyData.latitude || !surveyData.longitude)
          errs.coordinates = "GPS coordinates are required.";
        if (!surveyData.locationName.trim()) errs.locationName = "Required";
      }
      if (step === 3) {
        if (!photos.length) errs.photos = "At least one site photo is required.";
      }
      setValidationErrors((prev) => ({ ...prev, ...errs }));
      return Object.keys(errs).length === 0;
    },
    [photos.length, surveyData]
  );

  const goStep = useCallback(
    (dir) => {
      if (dir > 0 && !validateStep(currentStep)) {
        setError("Please fill in all required fields before continuing.");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      setError("");
      setCurrentStep((prev) => Math.max(1, Math.min(3, prev + dir)));
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [currentStep, validateStep]
  );

  const surveySummary = useMemo(() => {
    const lines = [
      "Site Survey Summary",
      `Roof Type: ${surveyData.roofType || "-"}`,
      `Roof Material: ${surveyData.roofMaterial || "-"}`,
      `Roof Condition: ${surveyData.roofCondition || "-"}`,
      `Shading Issues: ${surveyData.shadingIssues.length ? surveyData.shadingIssues.join(", ") : "-"}`,
      `Site Access: ${surveyData.siteAccess || "-"}`,
      `Existing Electrical Load (kW): ${surveyData.existingElectricalLoad || "-"}`,
      `Main Distribution Board Location: ${surveyData.mainDistributionBoardLocation || "-"}`,
      `Earthing Available: ${surveyData.earthingAvailable || "-"}`,
      `Phase Type: ${surveyData.phaseType || "-"}`,
      `Recommended Panel Brand: ${surveyData.recommendedPanelBrand || "-"}`,
      `Recommended Inverter Brand: ${surveyData.recommendedInverterBrand || "-"}`,
      `Inverter Type: ${surveyData.inverterType || "-"}`,
      `Available Roof Area (sq ft): ${surveyData.availableRoofArea || "-"}`,
      `Usable Roof Area (sq ft): ${surveyData.usableRoofArea || "-"}`,
      `Distance from Roof to DB (meters): ${surveyData.distanceFromRoofToDb || "-"}`,
      `Customer Expectations: ${surveyData.customerExpectations || "-"}`,
      `Special Requirements: ${surveyData.specialRequirements || "-"}`,
      `Challenges/Concerns: ${surveyData.challengesConcerns || "-"}`,
      `Coordinates: ${surveyData.latitude || "-"}, ${surveyData.longitude || "-"}`,
    ];
    if (surveyData.remarks.trim()) lines.push(`Additional Notes: ${surveyData.remarks.trim()}`);
    return lines.join("\n");
  }, [surveyData]);

  const ensurePunchInReady = useCallback(async () => {
    if (["ADMIN", "Admin_panel"].includes(currentUserRole)) return;

    const attendancePayload = await fetchAPI("/attendance?limit=31");
    const todayAttendance = getTodayAttendanceFromResponse(attendancePayload);

    if (!todayAttendance) {
      throw new Error("No attendance record found for today. Please punch in first.");
    }

    if (!todayAttendance?.punchIn?.time) {
      throw new Error("Please punch in before saving the site survey.");
    }
  }, [currentUserRole, fetchAPI]);

  const handleSubmit = useCallback(async () => {
    for (const step of [1, 2, 3]) {
      if (!validateStep(step)) {
        setCurrentStep(step);
        setError("Please complete all required fields before submitting.");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
    }
    setSaving(true);
    setError("");
    try {
      await ensurePunchInReady();
      const now = new Date();
      const formData = new FormData();
      const displayName = leadName || surveyData.locationName.trim() || "Site Survey";
      const persistedPhotos = getPersistedPhotoRefs(photos);
      formData.append("latitude", surveyData.latitude);
      formData.append("longitude", surveyData.longitude);
      formData.append("locationName", surveyData.locationName.trim() || displayName);
      formData.append("isLeadCreated", "other");
      formData.append("visitDate", now.toISOString().split("T")[0]);
      formData.append("visitTime", now.toTimeString().slice(0, 5));
      formData.append("visitStatus", "Completed");
      formData.append("remarks", surveySummary);
      if (lead?._id) {
        formData.append("leadId", lead._id);
        formData.append(
          "siteSurveyData",
          JSON.stringify({
            ...surveyData,
            photos: persistedPhotos,
          })
        );
      }
      const contactName = getLeadFullName(lead);
      if (contactName) formData.append("contactPerson", contactName);
      if (lead?.phone) formData.append("phone", lead.phone);
      if (lead?.email) formData.append("email", lead.email);
      if (lead?.address) formData.append("address", lead.address);
      photos.forEach((photo) => {
        if (photo.file) formData.append("photos", photo.file);
      });
      const res = await fetch(buildApiUrl("/visit"), {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });
      const responseType = res.headers.get("content-type") || "";
      const payload = responseType.includes("application/json") ? await res.json() : null;
      if (!res.ok) throw new Error(extractApiErrorMessage(payload, `HTTP ${res.status}`));
      const visitResult = payload?.result ?? payload?.data ?? payload;
      const visitData = visitResult?.visit ?? visitResult;
      try {
        window.localStorage.removeItem(SITE_SURVEY_DRAFT_STORAGE_KEY);
      } catch {
        // Ignore storage cleanup failures after a successful save.
      }
      setSubmittedVisit(visitData);
      if (onSave) onSave(visitData);
      setSuccessOpen(true);
    } catch (e) {
      setError(e.message || "Failed to save site survey.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSaving(false);
    }
  }, [ensurePunchInReady, lead, leadName, onSave, photos, surveyData, surveySummary, validateStep]);

  const closeSuccess = useCallback(() => {
    setSuccessOpen(false);
    if (onClose) {
      onClose(submittedVisit);
      return;
    }
    if (lead?._id) {
      navigate(`/all-leads/${lead._id}`, {
        replace: true,
        state: {
          lead,
          initialTab: "siteSurvey",
        },
      });
      return;
    }
    navigate(-1);
  }, [lead, navigate, onClose, submittedVisit]);

  /* ── Step metadata ── */
  const steps = [
    { key: 1, label: "General Info", short: "General" },
    { key: 2, label: "GPS Location", short: "GPS" },
    { key: 3, label: "Site Photos", short: "Photos" },
  ];

  /* ── Contact chips ── */
  const contactItems = [
    { icon: <Phone sx={{ fontSize: 13 }} />, text: lead?.phone || "No phone", bg: isDark ? "rgba(67, 160, 71, 0.18)" : "#e8f5e9", color: "#43a047" },
    { icon: <Email sx={{ fontSize: 13 }} />, text: lead?.email || "No email", bg: isDark ? "rgba(30, 136, 229, 0.18)" : "#e3f2fd", color: "#1e88e5" },
    { icon: <LocationOn sx={{ fontSize: 13 }} />, text: lead?.address || lead?.city || "No address", bg: isDark ? "rgba(229, 57, 53, 0.18)" : "#fce4ec", color: "#e53935" },
    { icon: <Tag sx={{ fontSize: 13 }} />, text: lead?.pincode || "No pincode", bg: isDark ? "rgba(142, 36, 170, 0.18)" : "#f3e5f5", color: "#8e24aa" },
    { icon: <WhatsApp sx={{ fontSize: 13 }} />, text: "WhatsApp", bg: isDark ? "rgba(37, 211, 102, 0.18)" : "#e8f5e9", color: "#25d366" },
  ];

  /* ─────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────── */
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: THEME.SURFACE_ALT, color: THEME.TEXT, pb: 11 }}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      {/* ── TOP NAVBAR ── */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 0,
          borderBottom: `1px solid ${THEME.BORDER}`,
          px: { xs: 2, md: 3 },
          py: 1.25,
          position: "sticky",
          top: 0,
          zIndex: 30,
          bgcolor: THEME.SURFACE,
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={1.5} alignItems="center">
            {/* Avatar */}
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: 2,
                background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_DARK} 100%)`,
                color: "#fff",
                display: "grid",
                placeItems: "center",
                fontSize: "0.78rem",
                fontWeight: 800,
                letterSpacing: "0.03em",
                flexShrink: 0,
              }}
            >
              {avatarLabel}
            </Box>
            <Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography sx={{ fontSize: "0.94rem", fontWeight: 700, color: THEME.TEXT }}>
                  Site Survey
                </Typography>
                <Box
                  sx={{
                    px: 1,
                    py: 0.2,
                    borderRadius: 999,
                    bgcolor: isDark ? "rgba(232, 112, 58, 0.18)" : "#fff4ef",
                    border: `1px solid ${isDark ? "rgba(232, 112, 58, 0.35)" : "#fdd8b4"}`,
                    color: PRIMARY,
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    letterSpacing: "0.05em",
                  }}
                >
                  EDITING
                </Box>
              </Stack>
              <Typography sx={{ fontSize: "0.76rem", color: THEME.TEXT_MUTED, mt: 0.1 }}>
                {leadName}
              </Typography>
            </Box>
          </Stack>

          <Button
            variant="outlined"
            size="small"
            startIcon={<ArrowBack sx={{ fontSize: 13 }} />}
            onClick={() => (onClose ? onClose() : navigate(-1))}
            sx={{
              borderRadius: 2,
              px: 1.75,
              py: 0.6,
              borderColor: THEME.BORDER,
              color: THEME.TEXT_SUB,
              fontWeight: 600,
              textTransform: "none",
              fontSize: "0.8rem",
              "&:hover": { bgcolor: THEME.SURFACE_ALT, borderColor: isDark ? "rgba(255,255,255,0.2)" : "#d0d0d0" },
            }}
          >
            Back
          </Button>
        </Stack>
      </Paper>

      {/* ── CONTACT STRIP ── */}
      <Box
        sx={{
          borderBottom: `1px solid ${THEME.BORDER}`,
          px: { xs: 2, md: 3 },
          py: 1,
          bgcolor: THEME.SURFACE,
          overflowX: "auto",
        }}
      >
        <Stack direction="row" spacing={1.5} useFlexGap flexWrap="nowrap" sx={{ minWidth: "max-content" }}>
          {contactItems.map((item) => (
            <Stack key={item.text} direction="row" spacing={0.6} alignItems="center">
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  bgcolor: item.bg,
                  color: item.color,
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                }}
              >
                {item.icon}
              </Box>
              <Typography sx={{ fontSize: "0.77rem", color: THEME.TEXT_SUB, whiteSpace: "nowrap" }}>
                {item.text}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Box>

      {/* ── STEP INDICATOR ── */}
      <Box
        sx={{
          borderBottom: `1px solid ${THEME.BORDER}`,
          bgcolor: THEME.SURFACE,
          px: { xs: 2, md: 3 },
          py: 0,
        }}
      >
        <Stack
          direction="row"
          sx={{ maxWidth: 520, mx: "auto", position: "relative" }}
        >
          {steps.map((step, i) => {
            const done = step.key < currentStep;
            const active = step.key === currentStep;
            return (
              <Box
                key={step.key}
                sx={{
                  flex: 1,
                  py: 1.5,
                  textAlign: "center",
                  position: "relative",
                  borderBottom: active ? `2.5px solid ${PRIMARY}` : "2.5px solid transparent",
                  cursor: done ? "pointer" : "default",
                }}
                onClick={() => {
                  if (done) setCurrentStep(step.key);
                }}
              >
                <Stack direction="row" spacing={0.75} alignItems="center" justifyContent="center">
                  <Box
                    sx={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      bgcolor: done ? PRIMARY : active ? THEME.PRIMARY_LIGHT : THEME.STEP_INACTIVE_BG,
                      border: `2px solid ${done || active ? PRIMARY : THEME.BORDER}`,
                      color: done ? "#fff" : active ? PRIMARY : THEME.TEXT_MUTED,
                      display: "grid",
                      placeItems: "center",
                      fontSize: "0.68rem",
                      fontWeight: 800,
                      transition: "all 0.2s",
                    }}
                  >
                    {done ? <CheckCircle sx={{ fontSize: 12 }} /> : step.key}
                  </Box>
                  <Typography
                    sx={{
                      fontSize: "0.78rem",
                      fontWeight: active ? 700 : 500,
                      color: active ? PRIMARY : done ? THEME.TEXT_SUB : THEME.TEXT_MUTED,
                      display: { xs: "none", sm: "block" },
                    }}
                  >
                    {step.label}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "0.78rem",
                      fontWeight: active ? 700 : 500,
                      color: active ? PRIMARY : done ? THEME.TEXT_SUB : THEME.TEXT_MUTED,
                      display: { xs: "block", sm: "none" },
                    }}
                  >
                    {step.short}
                  </Typography>
                </Stack>
              </Box>
            );
          })}
        </Stack>
      </Box>

      {/* ── MAIN CONTENT ── */}
      <Box sx={{ px: { xs: 1.5, sm: 2, md: 3 }, py: 2.5, maxWidth: 900, mx: "auto" }}>
        {error && (
          <Alert
            severity="error"
            onClose={() => setError("")}
            sx={{ mb: 2, borderRadius: 2, fontSize: "0.83rem" }}
          >
            {error}
          </Alert>
        )}

        {/* ════ STEP 1: General Info ════ */}
        {currentStep === 1 && (
          <>
            {/* Roof Details */}
            <SectionCard
              icon={<HomeWorkOutlined sx={{ fontSize: 16 }} />}
              title="Roof Details"
            >
              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={6}>
                  <FieldLabel required>Roof Type</FieldLabel>
                  <TextField
                    select
                    SelectProps={{ native: true }}
                    value={surveyData.roofType}
                    onChange={(e) => updateField("roofType", e.target.value)}
                    fullWidth
                    size="small"
                    error={Boolean(validationErrors.roofType)}
                    helperText={validationErrors.roofType}
                  >
                    <option value="">Select roof type</option>
                    {ROOF_TYPES.map((o) => <option key={o} value={o}>{o}</option>)}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FieldLabel required>Roof Material</FieldLabel>
                  <TextField
                    select
                    SelectProps={{ native: true }}
                    value={surveyData.roofMaterial}
                    onChange={(e) => updateField("roofMaterial", e.target.value)}
                    fullWidth
                    size="small"
                    error={Boolean(validationErrors.roofMaterial)}
                    helperText={validationErrors.roofMaterial}
                  >
                    <option value="">Select material</option>
                    {ROOF_MATERIALS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FieldLabel required>Roof Condition</FieldLabel>
                  <PillGroup
                    options={ROOF_CONDITIONS}
                    value={surveyData.roofCondition}
                    onChange={(v) => updateField("roofCondition", v)}
                  />
                  {validationErrors.roofCondition && (
                    <FormHelperText error sx={{ mt: 0.5 }}>
                      {validationErrors.roofCondition}
                    </FormHelperText>
                  )}
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FieldLabel>Shading Issues</FieldLabel>
                  <CheckPillGroup
                    options={SHADING_OPTIONS}
                    value={surveyData.shadingIssues}
                    onChange={(v) => toggleCheckboxValue("shadingIssues", v)}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FieldLabel required>Available Roof Area (sq ft)</FieldLabel>
                  <TextField
                    type="number"
                    value={surveyData.availableRoofArea}
                    onChange={(e) => updateField("availableRoofArea", e.target.value)}
                    fullWidth
                    size="small"
                    error={Boolean(validationErrors.availableRoofArea)}
                    helperText={validationErrors.availableRoofArea}
                    placeholder="e.g. 800"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FieldLabel required>Usable Roof Area (sq ft)</FieldLabel>
                  <TextField
                    type="number"
                    value={surveyData.usableRoofArea}
                    onChange={(e) => updateField("usableRoofArea", e.target.value)}
                    fullWidth
                    size="small"
                    error={Boolean(validationErrors.usableRoofArea)}
                    helperText={validationErrors.usableRoofArea}
                    placeholder="e.g. 600"
                  />
                </Grid>
              </Grid>
            </SectionCard>

            {/* Electrical Details */}
            <SectionCard
              icon={
                <Box sx={{ fontSize: 16, lineHeight: 1 }}>⚡</Box>
              }
              title="Electrical Details"
            >
              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={6}>
                  <FieldLabel required>Site Access</FieldLabel>
                  <PillGroup
                    options={SITE_ACCESS_OPTIONS}
                    value={surveyData.siteAccess}
                    onChange={(v) => updateField("siteAccess", v)}
                  />
                  {validationErrors.siteAccess && (
                    <FormHelperText error sx={{ mt: 0.5 }}>
                      {validationErrors.siteAccess}
                    </FormHelperText>
                  )}
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FieldLabel required>Existing Electrical Load (kW)</FieldLabel>
                  <TextField
                    type="number"
                    value={surveyData.existingElectricalLoad}
                    onChange={(e) => updateField("existingElectricalLoad", e.target.value)}
                    fullWidth
                    size="small"
                    error={Boolean(validationErrors.existingElectricalLoad)}
                    helperText={validationErrors.existingElectricalLoad}
                    placeholder="e.g. 5"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FieldLabel required>Main Distribution Board Location</FieldLabel>
                  <TextField
                    value={surveyData.mainDistributionBoardLocation}
                    onChange={(e) => updateField("mainDistributionBoardLocation", e.target.value)}
                    fullWidth
                    size="small"
                    error={Boolean(validationErrors.mainDistributionBoardLocation)}
                    helperText={validationErrors.mainDistributionBoardLocation}
                    placeholder="e.g. Ground floor utility room"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FieldLabel>Distance from Roof to DB (meters)</FieldLabel>
                  <TextField
                    type="number"
                    value={surveyData.distanceFromRoofToDb}
                    onChange={(e) => updateField("distanceFromRoofToDb", e.target.value)}
                    fullWidth
                    size="small"
                    placeholder="e.g. 15"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FieldLabel required>Earthing Available</FieldLabel>
                  <PillGroup
                    options={EARTHING_OPTIONS}
                    value={surveyData.earthingAvailable}
                    onChange={(v) => updateField("earthingAvailable", v)}
                  />
                  {validationErrors.earthingAvailable && (
                    <FormHelperText error sx={{ mt: 0.5 }}>
                      {validationErrors.earthingAvailable}
                    </FormHelperText>
                  )}
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FieldLabel required>Phase Type</FieldLabel>
                  <PillGroup
                    options={PHASE_OPTIONS}
                    value={surveyData.phaseType}
                    onChange={(v) => updateField("phaseType", v)}
                  />
                  {validationErrors.phaseType && (
                    <FormHelperText error sx={{ mt: 0.5 }}>
                      {validationErrors.phaseType}
                    </FormHelperText>
                  )}
                </Grid>
              </Grid>
            </SectionCard>

            {/* Equipment Recommendations */}
            <SectionCard
              icon={<Box sx={{ fontSize: 16 }}>🔧</Box>}
              title="Equipment Recommendations"
            >
              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={6}>
                  <FieldLabel required>Panel Brand</FieldLabel>
                  <TextField
                    select
                    SelectProps={{ native: true }}
                    value={surveyData.recommendedPanelBrand}
                    onChange={(e) => updateField("recommendedPanelBrand", e.target.value)}
                    fullWidth
                    size="small"
                    error={Boolean(validationErrors.recommendedPanelBrand)}
                    helperText={validationErrors.recommendedPanelBrand}
                  >
                    <option value="">Select panel brand</option>
                    {PANEL_BRANDS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FieldLabel required>Inverter Brand</FieldLabel>
                  <TextField
                    select
                    SelectProps={{ native: true }}
                    value={surveyData.recommendedInverterBrand}
                    onChange={(e) => updateField("recommendedInverterBrand", e.target.value)}
                    fullWidth
                    size="small"
                    error={Boolean(validationErrors.recommendedInverterBrand)}
                    helperText={validationErrors.recommendedInverterBrand}
                  >
                    <option value="">Select inverter brand</option>
                    {INVERTER_BRANDS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <FieldLabel>Inverter Type</FieldLabel>
                  <PillGroup
                    options={INVERTER_TYPES}
                    value={surveyData.inverterType}
                    onChange={(v) => updateField("inverterType", v)}
                  />
                </Grid>
              </Grid>
            </SectionCard>

            {/* Notes */}
            <SectionCard
              icon={<Box sx={{ fontSize: 16 }}>📋</Box>}
              title="Notes & Requirements"
            >
              <Grid container spacing={2.5}>
                <Grid item xs={12}>
                  <FieldLabel>Customer Expectations</FieldLabel>
                  <TextField
                    value={surveyData.customerExpectations}
                    onChange={(e) => updateField("customerExpectations", e.target.value)}
                    multiline
                    minRows={3}
                    fullWidth
                    size="small"
                    placeholder="What does the customer expect from this installation?"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FieldLabel>Special Requirements</FieldLabel>
                  <TextField
                    value={surveyData.specialRequirements}
                    onChange={(e) => updateField("specialRequirements", e.target.value)}
                    multiline
                    minRows={3}
                    fullWidth
                    size="small"
                    placeholder="Any special needs or requests..."
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FieldLabel>Challenges / Concerns</FieldLabel>
                  <TextField
                    value={surveyData.challengesConcerns}
                    onChange={(e) => updateField("challengesConcerns", e.target.value)}
                    multiline
                    minRows={3}
                    fullWidth
                    size="small"
                    placeholder="Potential issues or concerns..."
                  />
                </Grid>
              </Grid>
            </SectionCard>
          </>
        )}

        {/* ════ STEP 2: GPS Location ════ */}
        {currentStep === 2 && (
          <SectionCard
            icon={<LocationOn sx={{ fontSize: 16 }} />}
            title="GPS Location"
          >
            {/* Search bar */}
            <Grid container spacing={1.5} alignItems="flex-start" sx={{ mb: 2 }}>
              <Grid item xs={12} sm>
                {isGoogleMapLoaded && typeof window !== "undefined" && Boolean(window.google?.maps?.places?.Autocomplete) ? (
                  <Autocomplete
                    onLoad={handleAutocompleteLoad}
                    onPlaceChanged={handlePlaceChanged}
                  >
                    <TextField
                      label="Search address or location"
                      value={locationSearch}
                      onChange={(e) => setLocationSearch(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          searchLocationOnMap();
                        }
                      }}
                      fullWidth
                      size="small"
                      placeholder="Search by house name, street, or area"
                    />
                  </Autocomplete>
                ) : (
                  <TextField
                    label="Search address or location"
                    value={locationSearch}
                    onChange={(e) => setLocationSearch(e.target.value)}
                    fullWidth
                    size="small"
                  />
                )}
              </Grid>
              <Grid item xs={12} sm="auto">
                <Button
                  variant="contained"
                  disableElevation
                  startIcon={
                    searchingAddress ? (
                      <CircularProgress size={14} color="inherit" />
                    ) : (
                      <Search sx={{ fontSize: 16 }} />
                    )
                  }
                  onClick={searchLocationOnMap}
                  disabled={!locationSearch.trim() || searchingAddress || !isGoogleMapLoaded}
                  sx={{
                    height: 40,
                    minWidth: { xs: "100%", sm: 120 },
                    borderRadius: 2,
                    bgcolor: PRIMARY,
                    fontWeight: 700,
                    textTransform: "none",
                    fontSize: "0.82rem",
                    "&:hover": { bgcolor: PRIMARY_DARK },
                  }}
                >
                  {searchingAddress ? "Searching…" : "Search"}
                </Button>
              </Grid>
            </Grid>

            {/* Map */}
            <Box
              sx={{
                width: "100%",
                height: 280,
                borderRadius: 2.5,
                overflow: "hidden",
                border: `1.5px solid ${THEME.BORDER}`,
                mb: 1.25,
              }}
            >
              <LeafletMapPicker
                center={mapCenter}
                markerPosition={markerPosition}
                onMapPick={(lat, lng) => handleMapPick(lat, lng)}
              />
            </Box>

            <Typography sx={{ fontSize: "0.74rem", color: THEME.TEXT_MUTED, mb: 2 }}>
              Tap the map or drag the red pin to point the exact house location.
            </Typography>

            {/* GPS button */}
            <Button
              variant="outlined"
              startIcon={
                locationLoading ? (
                  <CircularProgress size={14} sx={{ color: PRIMARY }} />
                ) : (
                  <MyLocation sx={{ fontSize: 16 }} />
                )
              }
              onClick={() => getCurrentLocation()}
              sx={{
                borderRadius: 2,
                px: 2,
                py: 0.85,
                borderColor: PRIMARY,
                color: PRIMARY,
                fontWeight: 700,
                textTransform: "none",
                fontSize: "0.82rem",
                mb: 2.5,
                "&:hover": { borderColor: PRIMARY, bgcolor: THEME.PRIMARY_LIGHT },
              }}
            >
              {locationLoading
                ? `Getting GPS${locationAttempts ? ` (${locationAttempts + 1}/3)` : ""}…`
                : "Use My Current Location"}
            </Button>

            {/* Coordinate fields */}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FieldLabel>Latitude</FieldLabel>
                <TextField
                  value={surveyData.latitude}
                  onChange={(e) => updateField("latitude", e.target.value)}
                  fullWidth
                  size="small"
                  placeholder="e.g. 20.593684"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FieldLabel>Longitude</FieldLabel>
                <TextField
                  value={surveyData.longitude}
                  onChange={(e) => updateField("longitude", e.target.value)}
                  fullWidth
                  size="small"
                  placeholder="e.g. 78.962880"
                />
              </Grid>
              <Grid item xs={12}>
                <FieldLabel required>Location Name</FieldLabel>
                <TextField
                  value={surveyData.locationName}
                  onChange={(e) => updateField("locationName", e.target.value)}
                  fullWidth
                  size="small"
                  error={Boolean(validationErrors.locationName)}
                  helperText={validationErrors.locationName}
                  placeholder="Descriptive name for this site"
                />
              </Grid>
            </Grid>
            {validationErrors.coordinates && (
              <FormHelperText error sx={{ mt: 1 }}>
                {validationErrors.coordinates}
              </FormHelperText>
            )}
          </SectionCard>
        )}

        {/* ════ STEP 3: Photos ════ */}
        {currentStep === 3 && (
          <SectionCard
            icon={<CameraAlt sx={{ fontSize: 16 }} />}
            title="Site Photos"
          >
            {/* Drop zone */}
            <Box
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                addFiles(e.dataTransfer.files);
              }}
              sx={{
                border: `2px dashed ${validationErrors.photos ? ERROR_COLOR : THEME.DROPZONE_BORDER}`,
                borderRadius: 2.5,
                px: 2,
                py: 5,
                textAlign: "center",
                cursor: "pointer",
                bgcolor: THEME.DROPZONE_BG,
                transition: "all 0.18s",
                "&:hover": {
                  borderColor: PRIMARY,
                  bgcolor: THEME.PRIMARY_LIGHT,
                },
              }}
            >
              <CloudUploadOutlined
                sx={{ fontSize: 36, color: alpha(PRIMARY, 0.65), mb: 1 }}
              />
              <Typography sx={{ fontSize: "0.88rem", color: THEME.TEXT_SUB, fontWeight: 500 }}>
                Drag & drop photos, or{" "}
                <Box component="span" sx={{ color: PRIMARY, fontWeight: 700 }}>
                  browse
                </Box>
              </Typography>
              <Typography sx={{ fontSize: "0.7rem", color: THEME.TEXT_MUTED, mt: 0.5 }}>
                JPG, PNG, WEBP · Max 10 MB each
              </Typography>
            </Box>

            {validationErrors.photos && (
              <FormHelperText error sx={{ mt: 1 }}>
                {validationErrors.photos}
              </FormHelperText>
            )}

            {/* Thumbnails */}
            {photos.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Typography sx={{ fontSize: "0.78rem", fontWeight: 600, color: THEME.TEXT_SUB }}>
                    {photos.length} photo{photos.length !== 1 ? "s" : ""} selected
                  </Typography>
                </Stack>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.25 }}>
                  {photos.filter((photo) => photo?.id && photo?.preview).map((photo) => (
                    <UploadPreview key={photo.id} photo={photo} onRemove={removePhoto} />
                  ))}
                </Box>
              </Box>
            )}

            {/* Remarks */}
            <Box sx={{ mt: 3 }}>
              <FieldLabel>Additional Notes</FieldLabel>
              <TextField
                value={surveyData.remarks}
                onChange={(e) => updateField("remarks", e.target.value)}
                multiline
                minRows={4}
                fullWidth
                size="small"
                placeholder="Any extra observations or notes about the site..."
              />
            </Box>
          </SectionCard>
        )}
      </Box>

      {/* ── BOTTOM ACTION BAR ── */}
      <Paper
        elevation={0}
        sx={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          borderTop: `1px solid ${THEME.BORDER}`,
          px: { xs: 2, md: 3 },
          py: 1.5,
          zIndex: 30,
          bgcolor: THEME.SURFACE,
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ maxWidth: 900, mx: "auto" }}
        >
          {/* Left: Back / Cancel */}
          {currentStep === 1 ? (
            <Button
              variant="outlined"
              onClick={() => (onClose ? onClose() : navigate(-1))}
              sx={{
                borderRadius: 2,
                px: 2,
                py: 0.85,
                borderColor: THEME.BORDER,
                color: THEME.TEXT_SUB,
                fontWeight: 600,
                textTransform: "none",
                fontSize: "0.83rem",
                "&:hover": { bgcolor: THEME.SURFACE_ALT },
              }}
            >
              Cancel
            </Button>
          ) : (
            <Button
              variant="outlined"
              startIcon={<ArrowBack sx={{ fontSize: 14 }} />}
              onClick={() => goStep(-1)}
              sx={{
                borderRadius: 2,
                px: 2,
                py: 0.85,
                borderColor: THEME.BORDER,
                color: THEME.TEXT_SUB,
                fontWeight: 600,
                textTransform: "none",
                fontSize: "0.83rem",
                "&:hover": { bgcolor: THEME.SURFACE_ALT },
              }}
            >
              Previous
            </Button>
          )}

          {/* Center: step counter */}
          <Stack direction="row" spacing={0.5} alignItems="center">
            {steps.map((s) => (
              <Box
                key={s.key}
                sx={{
                  width: s.key === currentStep ? 20 : 6,
                  height: 6,
                  borderRadius: 999,
                  bgcolor: s.key === currentStep ? PRIMARY : s.key < currentStep ? alpha(PRIMARY, 0.4) : THEME.BORDER,
                  transition: "all 0.25s",
                }}
              />
            ))}
          </Stack>

          {/* Right: Next / Submit */}
          {currentStep < 3 ? (
            <Button
              variant="contained"
              disableElevation
              endIcon={<ArrowForward sx={{ fontSize: 14 }} />}
              onClick={() => goStep(1)}
              sx={{
                borderRadius: 2,
                px: 2.5,
                py: 0.85,
                bgcolor: PRIMARY,
                fontWeight: 700,
                textTransform: "none",
                fontSize: "0.83rem",
                "&:hover": { bgcolor: PRIMARY_DARK },
              }}
            >
              Next
            </Button>
          ) : (
            <Button
              variant="contained"
              disableElevation
              startIcon={
                saving ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <CheckCircle sx={{ fontSize: 16 }} />
                )
              }
              disabled={saving}
              onClick={handleSubmit}
              sx={{
                borderRadius: 2,
                px: 2.5,
                py: 0.85,
                bgcolor: PRIMARY,
                fontWeight: 700,
                textTransform: "none",
                fontSize: "0.83rem",
                "&:hover": { bgcolor: PRIMARY_DARK },
                "&.Mui-disabled": { bgcolor: alpha(PRIMARY, 0.5), color: "#fff" },
              }}
            >
              {saving ? "Saving…" : "Save Survey"}
            </Button>
          )}
        </Stack>
      </Paper>

      <SuccessDialog open={successOpen} onClose={closeSuccess} leadName={leadName} />
    </Box>
  );
}
