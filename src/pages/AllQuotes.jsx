import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  alpha,
  Avatar,
  Box,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import {
  AccessTime,
  CalendarToday,
  CheckCircleOutline,
  DeleteOutline,
  DescriptionOutlined,
  DownloadOutlined,
  EditOutlined,
  MoreVert,
  OpenInNew,
  PlaceOutlined,
  RequestQuote,
  Search,
  SendOutlined,
} from "@mui/icons-material";
import {
  deleteQuotation,
  fetchQuotationsFromServer,
  loadQuotationLibrary,
  setCurrentQuotation,
  updateQuotationStatus,
} from "../utils/quotationStorage";
import { useAuth } from "../contexts/AuthContext";

const BLUE = "#2563eb";
const BLUE_LIGHT = "#60a5fa";
const CYAN = "#06b6d4";
const PURPLE = "#8b5cf6";
const GREEN = "#22c55e";
const ORANGE = "#f97316";
const RED = "#ef4444";
const SLATE = "#64748b";

const STATUS_META = {
  draft: { label: "Draft", color: BLUE_LIGHT, dotColor: "#3b82f6", soft: alpha(BLUE_LIGHT, 0.15) },
  sent: { label: "Sent", color: CYAN, dotColor: "#06b6d4", soft: alpha(CYAN, 0.15) },
  negotiation: { label: "Negotiation", color: PURPLE, dotColor: "#8b5cf6", soft: alpha(PURPLE, 0.15) },
  accepted: { label: "Accepted", color: GREEN, dotColor: "#22c55e", soft: alpha(GREEN, 0.15) },
  rejected: { label: "Rejected", color: RED, dotColor: "#ef4444", soft: alpha(RED, 0.15) },
  expired: { label: "Expired", color: ORANGE, dotColor: "#f97316", soft: alpha(ORANGE, 0.15) },
};

const PIPELINE_ORDER = ["all", "draft", "sent", "negotiation", "accepted", "rejected", "expired"];

const DEFAULT_SAMPLE_QUOTES = [
  {
    id: "quote-sample-5",
    quotationNumber: "QT-0005/2026",
    quotationTitle: "Commercial - Waaree Energies",
    leadName: "raman ragab",
    customerName: "raman ragab",
    customerPhone: "",
    customerLocation: "Location unavailable",
    systemSize: 2000.0,
    totalCost: 2000,
    status: "draft",
    createdAt: "2026-07-29T10:00:00.000Z",
    savedAt: "2026-07-29T10:00:00.000Z",
    validityDays: 14,
    form: {
      customerType: "Commercial",
      panelBrand: "Waaree Energies",
      totalCost: 2000,
      subsidyAmount: 0,
      systemSize: 2000.0,
    },
  },
  {
    id: "quote-sample-4",
    quotationNumber: "QT-0004/2026",
    quotationTitle: "Commercial - Waaree Energies",
    leadName: "raman ragab",
    customerName: "raman ragab",
    customerPhone: "",
    customerLocation: "Location unavailable",
    systemSize: 2000.0,
    totalCost: 2000,
    status: "draft",
    createdAt: "2026-07-29T10:00:00.000Z",
    savedAt: "2026-07-29T10:00:00.000Z",
    validityDays: 14,
    form: {
      customerType: "Commercial",
      panelBrand: "Waaree Energies",
      totalCost: 2000,
      subsidyAmount: 0,
      systemSize: 2000.0,
    },
  },
  {
    id: "quote-sample-3",
    quotationNumber: "QT-0003/2026",
    quotationTitle: "Commercial - Waaree Energies",
    leadName: "raman ragab",
    customerName: "raman ragab",
    customerPhone: "",
    customerLocation: "Location unavailable",
    systemSize: 2000.0,
    totalCost: 2000,
    status: "expired",
    createdAt: "2026-07-02T10:00:00.000Z",
    savedAt: "2026-07-02T10:00:00.000Z",
    validityDays: 14,
    form: {
      customerType: "Commercial",
      panelBrand: "Waaree Energies",
      totalCost: 2000,
      subsidyAmount: 0,
      systemSize: 2000.0,
    },
  },
  {
    id: "quote-sample-2",
    quotationNumber: "QT-0002/2026",
    quotationTitle: "Commercial - Waaree Energies",
    leadName: "raman ragab",
    customerName: "raman ragab",
    customerPhone: "",
    customerLocation: "Location unavailable",
    systemSize: 2000.0,
    totalCost: 2000,
    status: "expired",
    createdAt: "2026-07-02T10:00:00.000Z",
    savedAt: "2026-07-02T10:00:00.000Z",
    validityDays: 14,
    form: {
      customerType: "Commercial",
      panelBrand: "Waaree Energies",
      totalCost: 2000,
      subsidyAmount: 0,
      systemSize: 2000.0,
    },
  },
  {
    id: "quote-sample-1",
    quotationNumber: "QT-0001/2026",
    quotationTitle: "Commercial - Waaree Energies",
    leadName: "raman ragab",
    customerName: "raman ragab",
    customerPhone: "",
    customerLocation: "Location unavailable",
    systemSize: 2000.0,
    totalCost: 2000,
    status: "expired",
    createdAt: "2026-07-02T10:00:00.000Z",
    savedAt: "2026-07-02T10:00:00.000Z",
    validityDays: 14,
    form: {
      customerType: "Commercial",
      panelBrand: "Waaree Energies",
      totalCost: 2000,
      subsidyAmount: 0,
      systemSize: 2000.0,
    },
  },
];

const formatCurrency = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "₹0";
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${Math.round(amount / 1000)}K`;
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
};

const formatDate = (value) => {
  const parsed = value ? new Date(value) : null;
  if (!parsed || Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getValidityEndDate = (quotation) => {
  const baseDate = new Date(quotation?.createdAt || quotation?.savedAt || Date.now());
  if (Number.isNaN(baseDate.getTime())) return null;
  const nextDate = new Date(baseDate);
  nextDate.setDate(nextDate.getDate() + Number(quotation?.validityDays || 14));
  return nextDate;
};

const getResolvedStatus = (quotation) => {
  const rawStatus = String(quotation?.status || "draft").toLowerCase();
  if (rawStatus === "accepted" || rawStatus === "rejected" || rawStatus === "negotiation") return rawStatus;
  const validityEnd = getValidityEndDate(quotation);
  if (rawStatus !== "accepted" && rawStatus !== "rejected" && validityEnd && validityEnd < new Date()) {
    return "expired";
  }
  if (rawStatus === "sent") return "sent";
  return "draft";
};

const getCustomerName = (quotation) =>
  quotation?.leadName ||
  quotation?.customerName ||
  quotation?.quotationTitle ||
  quotation?.lead?.customerName ||
  quotation?.lead?.name ||
  [quotation?.lead?.firstName, quotation?.lead?.lastName].filter(Boolean).join(" ").trim() ||
  "Customer";

const getCustomerPhone = (quotation) =>
  quotation?.customerPhone || quotation?.lead?.phone || quotation?.lead?.mobile || quotation?.lead?.whatsappNumber || "";

const getCustomerLocation = (quotation) =>
  quotation?.customerLocation || [quotation?.lead?.city, quotation?.lead?.state].filter(Boolean).join(", ") || "Location unavailable";

const getCustomerType = (quotation) => quotation?.form?.customerType || "Commercial";

const getPanelBrand = (quotation) => quotation?.form?.panelBrand || "Waaree Energies";

const getQuoteValue = (quotation) => Number(quotation?.totalCost || quotation?.form?.totalCost || 0);

const getQuoteSizeLabel = (quotation) => `${Number(quotation?.systemSize || 2000).toFixed(1)} kW`;

const getInitials = (name) =>
  String(name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "RR";

const getQuarterStart = () => {
  const now = new Date();
  const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
  return new Date(now.getFullYear(), quarterMonth, 1);
};

const createCsvData = (rows) => {
  const headers = ["Quote", "Customer", "Phone", "Location", "Status", "Valid Until", "Value"];
  const lines = rows.map((quotation) => [
    quotation.quotationNumber || "",
    getCustomerName(quotation),
    getCustomerPhone(quotation),
    getCustomerLocation(quotation),
    STATUS_META[getResolvedStatus(quotation)]?.label || "Draft",
    formatDate(getValidityEndDate(quotation)),
    getQuoteValue(quotation),
  ]);

  return [headers, ...lines]
    .map((row) => row.map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
};

const StatCard = ({ icon, value, label, note, iconBg, iconColor }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const BORDER = isDark ? "rgba(255, 255, 255, 0.07)" : "#e6ebf4";
  const PAPER = isDark ? "#0c1322" : "#ffffff";
  const TEXT = isDark ? "#f8fafc" : "#14213d";
  const TEXT_MUTED = isDark ? "#94a3b8" : "#91a0b8";

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.25,
        borderRadius: 3,
        border: `1px solid ${BORDER}`,
        bgcolor: PAPER,
        minHeight: 120,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            bgcolor: iconBg,
            color: iconColor,
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
        <Typography sx={{ fontSize: "1.8rem", lineHeight: 1, fontWeight: 800, color: TEXT }}>
          {value}
        </Typography>
      </Stack>
      <Box sx={{ mt: 1.25 }}>
        <Typography sx={{ fontSize: "0.85rem", fontWeight: 700, color: isDark ? "#f1f5f9" : TEXT }}>
          {label}
        </Typography>
        <Typography sx={{ mt: 0.35, fontSize: "0.72rem", color: TEXT_MUTED, lineHeight: 1.35 }}>
          {note}
        </Typography>
      </Box>
    </Paper>
  );
};

export default function AllQuotes() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const SURFACE = isDark ? "#060813" : "#f6f8fc";
  const PAPER = isDark ? "#0c1322" : "#ffffff";
  const BORDER = isDark ? "rgba(255, 255, 255, 0.07)" : "#e6ebf4";
  const TEXT = isDark ? "#f8fafc" : "#14213d";
  const TEXT_SUB = isDark ? "#94a3b8" : "#5c6b85";
  const TEXT_MUTED = isDark ? "#64748b" : "#91a0b8";

  const [quotations, setQuotations] = useState(() => {
    const cached = loadQuotationLibrary();
    return Array.isArray(cached) && cached.length > 0 ? cached : [];
  });
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [activeQuote, setActiveQuote] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const { user, getUserRole } = useAuth();
  const userRole = getUserRole ? getUserRole() : user?.role;
  const isAdmin = ["admin", "admin_panel", "head_office", "super_admin"].includes(
    String(userRole || "").toLowerCase()
  );

  const loadQuotes = useCallback(() => {
    // 1. Immediately read local library
    const cached = loadQuotationLibrary();
    if (Array.isArray(cached) && cached.length > 0) {
      setQuotations(cached);
    }

    // 2. Fetch server quotations to ensure full sync
    fetchQuotationsFromServer()
      .then((serverQuotes) => {
        if (Array.isArray(serverQuotes)) {
          setQuotations(serverQuotes);
        }
      })
      .catch((err) => {
        console.warn("Failed to fetch server quotations:", err);
      });
  }, []);

  useEffect(() => {
    loadQuotes();
    window.addEventListener("focus", loadQuotes);
    return () => window.removeEventListener("focus", loadQuotes);
  }, [loadQuotes]);

  const currentUserId = user?._id || user?.id;

  const visibleQuotations = useMemo(() => {
    if (isAdmin) return quotations;
    if (!currentUserId) return quotations;
    return quotations.filter((q) => {
      const creatorId = q.createdBy?._id || q.createdBy?.id || q.createdBy;
      if (!creatorId) return true;
      return String(creatorId) === String(currentUserId);
    });
  }, [quotations, isAdmin, currentUserId]);

  const formattedQuotations = useMemo(() => {
    return visibleQuotations.map((quotation) => {
      const resolvedStatus = getResolvedStatus(quotation);
      const validityEnd = getValidityEndDate(quotation);
      const totalValue = getQuoteValue(quotation);

      return {
        ...quotation,
        resolvedStatus,
        validityEnd,
        totalValue,
        customerName: getCustomerName(quotation),
        customerPhone: getCustomerPhone(quotation),
        customerLocation: getCustomerLocation(quotation),
      };
    });
  }, [visibleQuotations]);

  const pipelineCounts = useMemo(() => {
    const counts = {
      all: formattedQuotations.length,
      draft: 0,
      sent: 0,
      negotiation: 0,
      accepted: 0,
      rejected: 0,
      expired: 0,
    };

    formattedQuotations.forEach((quotation) => {
      if (counts[quotation.resolvedStatus] !== undefined) {
        counts[quotation.resolvedStatus] += 1;
      }
    });

    return counts;
  }, [formattedQuotations]);

  const summary = useMemo(() => {
    const quarterStart = getQuarterStart();
    const now = new Date();
    const weekFromNow = new Date();
    weekFromNow.setDate(now.getDate() + 7);

    let totalValue = 0;
    let draftCount = 0;
    let sentToday = 0;
    let expiringThisWeek = 0;
    let readyToConvert = 0;
    let acceptedThisQuarter = 0;
    let activeCount = 0;

    formattedQuotations.forEach((quotation) => {
      const { resolvedStatus, totalValue: val, validityEnd, createdAt, savedAt } = quotation;
      totalValue += val;

      if (resolvedStatus === "draft") draftCount += 1;
      if (resolvedStatus === "accepted") readyToConvert += 1;

      if (resolvedStatus === "draft" || resolvedStatus === "sent" || resolvedStatus === "negotiation") {
        activeCount += 1;
      }

      const quoteDate = new Date(createdAt || savedAt || Date.now());
      if (resolvedStatus === "sent" && quoteDate.toDateString() === now.toDateString()) {
        sentToday += 1;
      }

      if (validityEnd && validityEnd >= now && validityEnd <= weekFromNow && resolvedStatus !== "accepted" && resolvedStatus !== "rejected") {
        expiringThisWeek += 1;
      }

      if (resolvedStatus === "accepted" && quoteDate >= quarterStart) {
        acceptedThisQuarter += 1;
      }
    });

    return {
      activeCount,
      totalValue,
      acceptedThisQuarter,
      draftCount,
      sentToday,
      expiringThisWeek,
      readyToConvert,
    };
  }, [formattedQuotations]);

  const filteredQuotations = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return formattedQuotations.filter((quotation) => {
      const matchesStatus = selectedStatus === "all" || quotation.resolvedStatus === selectedStatus;
      if (!matchesStatus) return false;
      if (!search) return true;

      const numberMatch = (quotation.quotationNumber || "").toLowerCase().includes(search);
      const titleMatch = (quotation.quotationTitle || "").toLowerCase().includes(search);
      const customerMatch = (quotation.customerName || "").toLowerCase().includes(search);
      const phoneMatch = (quotation.customerPhone || "").toLowerCase().includes(search);
      const locationMatch = (quotation.customerLocation || "").toLowerCase().includes(search);

      return numberMatch || titleMatch || customerMatch || phoneMatch || locationMatch;
    });
  }, [formattedQuotations, selectedStatus, searchTerm]);

  useEffect(() => {
    setPage(0);
  }, [selectedStatus, searchTerm]);

  const paginatedQuotations = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredQuotations.slice(start, start + rowsPerPage);
  }, [filteredQuotations, page, rowsPerPage]);

  const handlePreview = useCallback((quotation) => {
    if (!quotation) return;
    setCurrentQuotation(quotation);
    const targetId = quotation.id || quotation._id || quotation.quotationNumber;
    navigate(`/quotation?quoteId=${encodeURIComponent(targetId)}`, {
      state: {
        quotationId: targetId,
        quotationData: quotation,
        quotationUpdatedAt: quotation.savedAt,
      },
    });
  }, [navigate]);

  const handleEdit = useCallback((quotation) => {
    if (!quotation) return;
    navigate("/quotation/edit", {
      state: {
        mode: "edit",
        lead: quotation.lead,
        quotationTitle: quotation.quotationTitle,
        quotationData: quotation,
      },
    });
  }, [navigate]);

  const handleStatusChange = useCallback((quotationId, status) => {
    setQuotations(updateQuotationStatus(quotationId, status));
    setMenuAnchor(null);
    setActiveQuote(null);
  }, []);

  const handleDelete = useCallback(async (quotationId) => {
    if (!window.confirm("Delete this quotation?")) return;
    try {
      const updated = await deleteQuotation(quotationId);
      setQuotations(updated);
      setMenuAnchor(null);
      setActiveQuote(null);
      try {
        const fresh = await fetchQuotationsFromServer();
        if (Array.isArray(fresh)) {
          setQuotations(fresh);
        }
      } catch {}
    } catch (err) {
      console.warn("Failed to delete quotation:", err);
    }
  }, []);

  const handleExport = useCallback(() => {
    const csvData = createCsvData(filteredQuotations);
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `quotes-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [filteredQuotations]);

  const openLeadDetails = useCallback((quotation) => {
    if (!quotation?.leadId) return;
    navigate(`/all-leads/${quotation.leadId}`, {
      state: {
        lead: quotation.lead,
        initialTab: "quotations",
      },
    });
  }, [navigate]);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: SURFACE, p: { xs: 2, md: 3 } }}>
      <Stack spacing={2.5}>
        {/* Header Breadcrumb & Titles */}
        <Box>
          <Typography
            sx={{
              fontSize: "0.72rem",
              fontWeight: 800,
              color: "#3b82f6",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
          >
            SALES · PIPELINE
          </Typography>
          <Typography
            sx={{
              mt: 0.4,
              fontSize: { xs: "1.75rem", md: "2.1rem" },
              fontWeight: 800,
              color: TEXT,
              letterSpacing: "-0.02em",
            }}
          >
            Quotes
          </Typography>
          <Typography sx={{ mt: 0.4, fontSize: "0.85rem", color: TEXT_SUB }}>
            {`${summary.activeCount} active · ${formatCurrency(summary.totalValue)} in flight · ${summary.acceptedThisQuarter} accepted this quarter`}
          </Typography>
        </Box>

        {/* 4 KPI Summary Cards */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
            gap: 2,
          }}
        >
          <StatCard
            icon={<DescriptionOutlined sx={{ fontSize: 20 }} />}
            value={summary.draftCount}
            label="Drafts pending review"
            note="Drafts idle > 2 days can be followed up first."
            iconBg="rgba(37, 99, 235, 0.2)"
            iconColor="#3b82f6"
          />
          <StatCard
            icon={<SendOutlined sx={{ fontSize: 20 }} />}
            value={summary.sentToday}
            label="Sent today"
            note="Sent today · awaiting customer response."
            iconBg="rgba(124, 58, 237, 0.2)"
            iconColor="#8b5cf6"
          />
          <StatCard
            icon={<AccessTime sx={{ fontSize: 20 }} />}
            value={summary.expiringThisWeek}
            label="Expiring this week"
            note="Quotes near validity end should be revisited."
            iconBg="rgba(245, 158, 11, 0.2)"
            iconColor="#f97316"
          />
          <StatCard
            icon={<CheckCircleOutline sx={{ fontSize: 20 }} />}
            value={summary.readyToConvert}
            label="Ready to convert"
            note="Accepted quotes can now be moved into projects."
            iconBg="rgba(34, 197, 94, 0.2)"
            iconColor="#22c55e"
          />
        </Box>

        {/* QUOTE PIPELINE Filter Bar */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            border: `1px solid ${BORDER}`,
            bgcolor: PAPER,
            overflow: "hidden",
          }}
        >
          <Box sx={{ p: 2, pb: 1, borderBottom: `1px solid ${BORDER}` }}>
            <Typography
              sx={{
                fontSize: "0.7rem",
                fontWeight: 800,
                color: TEXT_MUTED,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              QUOTE PIPELINE
            </Typography>
          </Box>
          <Box sx={{ p: 2, pt: 1.5, overflowX: "auto" }}>
            <Stack direction="row" spacing={1.5} sx={{ minWidth: 1000 }}>
              {PIPELINE_ORDER.map((statusKey) => {
                const active = selectedStatus === statusKey;
                const meta =
                  statusKey === "all"
                    ? { label: "All Quotes", color: "#3b82f6", dotColor: "#3b82f6", soft: "rgba(37, 99, 235, 0.15)" }
                    : STATUS_META[statusKey];

                return (
                  <Paper
                    key={statusKey}
                    elevation={0}
                    onClick={() => setSelectedStatus(statusKey)}
                    sx={{
                      flex: 1,
                      minWidth: 135,
                      p: 1.75,
                      borderRadius: 2.5,
                      border: active ? `2px solid ${BLUE}` : `1px solid ${BORDER}`,
                      bgcolor: active
                        ? isDark
                          ? "rgba(37, 99, 235, 0.15)"
                          : "#eff6ff"
                        : isDark
                        ? "#080d19"
                        : "#fbfcfe",
                      boxShadow: active ? "0 0 12px rgba(37, 99, 235, 0.25)" : "none",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      position: "relative",
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography sx={{ fontSize: "1.65rem", fontWeight: 800, lineHeight: 1, color: TEXT }}>
                        {pipelineCounts[statusKey]}
                      </Typography>
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          border: `1.5px solid ${meta.dotColor}`,
                          bgcolor: active ? meta.dotColor : "transparent",
                        }}
                      />
                    </Stack>
                    <Typography
                      sx={{
                        mt: 1,
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        color: active ? (isDark ? "#60a5fa" : BLUE) : TEXT_SUB,
                      }}
                    >
                      {meta.label}
                    </Typography>
                  </Paper>
                );
              })}
            </Stack>
          </Box>
        </Paper>

        {/* Action Bar (Search & Export / Create Buttons) */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            border: `1px solid ${BORDER}`,
            bgcolor: PAPER,
            overflow: "hidden",
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", md: "center" }}
            sx={{ p: 2.25, borderBottom: `1px solid ${BORDER}` }}
          >
            <TextField
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by quote ID, customer name, phone..."
              size="small"
              sx={{
                width: { xs: "100%", md: 420 },
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2.5,
                  bgcolor: isDark ? "#080d19" : "#fff",
                  color: isDark ? "#f8fafc" : TEXT,
                  "& fieldset": { borderColor: isDark ? "rgba(255, 255, 255, 0.12)" : BORDER },
                  "&:hover fieldset": { borderColor: isDark ? "#60a5fa" : BLUE },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ fontSize: 18, color: TEXT_MUTED }} />
                  </InputAdornment>
                ),
              }}
            />

            <Stack direction="row" spacing={1.5} justifyContent="flex-end">
              <Button
                variant="outlined"
                startIcon={<DownloadOutlined sx={{ fontSize: 16 }} />}
                onClick={handleExport}
                sx={{
                  borderRadius: 2.5,
                  borderColor: isDark ? "rgba(34, 197, 94, 0.4)" : alpha(GREEN, 0.45),
                  color: isDark ? "#34d399" : GREEN,
                  fontWeight: 700,
                  px: 2.2,
                  "&:hover": { borderColor: GREEN, bgcolor: alpha(GREEN, 0.08) },
                }}
              >
                Export
              </Button>
              <Button
                variant="contained"
                startIcon={<RequestQuote sx={{ fontSize: 16 }} />}
                onClick={() => navigate("/quotation/create", { state: { mode: "create", quotationTitle: "Quotation" } })}
                sx={{
                  borderRadius: 2.5,
                  bgcolor: "#2563eb",
                  color: "#fff",
                  fontWeight: 700,
                  px: 2.5,
                  boxShadow: "0 4px 14px rgba(37, 99, 235, 0.35)",
                  "&:hover": { bgcolor: "#1d4ed8", boxShadow: "0 6px 18px rgba(37, 99, 235, 0.45)" },
                }}
              >
                Create Quote
              </Button>
            </Stack>
          </Stack>

          {/* Quotes Data Table */}
          {filteredQuotations.length ? (
            <>
              <TableContainer>
                <Table sx={{ minWidth: 1000 }}>
                  <TableHead sx={{ bgcolor: isDark ? "#080d19" : "#f8fafc" }}>
                    <TableRow>
                      <TableCell sx={{ width: 36, borderBottomColor: BORDER }} />
                      <TableCell
                        sx={{
                          borderBottomColor: BORDER,
                          color: TEXT_MUTED,
                          fontWeight: 800,
                          fontSize: "0.68rem",
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                        }}
                      >
                        QUOTE
                      </TableCell>
                      <TableCell
                        sx={{
                          borderBottomColor: BORDER,
                          color: TEXT_MUTED,
                          fontWeight: 800,
                          fontSize: "0.68rem",
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                        }}
                      >
                        CUSTOMER · SITE
                      </TableCell>
                      <TableCell
                        sx={{
                          borderBottomColor: BORDER,
                          color: TEXT_MUTED,
                          fontWeight: 800,
                          fontSize: "0.68rem",
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                        }}
                      >
                        STATUS
                      </TableCell>
                      <TableCell
                        sx={{
                          borderBottomColor: BORDER,
                          color: TEXT_MUTED,
                          fontWeight: 800,
                          fontSize: "0.68rem",
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                        }}
                      >
                        VALIDITY
                      </TableCell>
                      <TableCell
                        sx={{
                          borderBottomColor: BORDER,
                          color: TEXT_MUTED,
                          fontWeight: 800,
                          fontSize: "0.68rem",
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                        }}
                      >
                        VALUE
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          borderBottomColor: BORDER,
                          color: TEXT_MUTED,
                          fontWeight: 800,
                          fontSize: "0.68rem",
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                        }}
                      >
                        ACTIONS
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedQuotations.map((quotation) => {
                      const statusMeta = STATUS_META[quotation.resolvedStatus] || STATUS_META.draft;

                      return (
                        <TableRow
                          key={quotation.id}
                          hover
                          sx={{
                            "&:hover": { bgcolor: isDark ? "rgba(255, 255, 255, 0.03) !important" : undefined },
                          }}
                        >
                          <TableCell sx={{ borderBottomColor: BORDER, pr: 0 }}>
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                bgcolor: statusMeta.dotColor,
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ borderBottomColor: BORDER }}>
                            <Typography sx={{ fontSize: "0.85rem", fontWeight: 800, color: TEXT }}>
                              {quotation.quotationNumber || "Quote"}
                            </Typography>
                            {isAdmin && quotation.createdBy && (
                              <Typography sx={{ fontSize: "0.68rem", color: TEXT_MUTED, mt: 0.2 }}>
                                Created by: {quotation.createdBy?.firstName ? `${quotation.createdBy.firstName} ${quotation.createdBy.lastName || ""}` : (quotation.createdBy?.role || "Staff")}
                              </Typography>
                            )}
                            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.35 }}>
                              <Typography
                                sx={{
                                  fontSize: "0.74rem",
                                  fontWeight: 700,
                                  color: isDark ? "#60a5fa" : BLUE,
                                  cursor: "pointer",
                                }}
                                onClick={() => handlePreview(quotation)}
                              >
                                {getQuoteSizeLabel(quotation)}
                              </Typography>
                              <Typography sx={{ fontSize: "0.74rem", color: TEXT_MUTED }}>
                                {`${getCustomerType(quotation)} - ${getPanelBrand(quotation)}`}
                              </Typography>
                            </Stack>
                          </TableCell>

                          <TableCell sx={{ borderBottomColor: BORDER }}>
                            <Stack direction="row" spacing={1.25} alignItems="center">
                              <Avatar
                                sx={{
                                  width: 28,
                                  height: 28,
                                  bgcolor: isDark ? "#334155" : "#cbd5e1",
                                  color: isDark ? "#f8fafc" : "#1e293b",
                                  fontSize: "0.72rem",
                                  fontWeight: 800,
                                }}
                              >
                                {getInitials(quotation.customerName)}
                              </Avatar>
                              <Box>
                                <Typography
                                  sx={{
                                    fontSize: "0.82rem",
                                    fontWeight: 700,
                                    color: TEXT,
                                    cursor: quotation.leadId ? "pointer" : "default",
                                  }}
                                  onClick={() => openLeadDetails(quotation)}
                                >
                                  {quotation.customerName}
                                </Typography>
                                <Stack direction="row" spacing={0.4} alignItems="center" sx={{ mt: 0.2 }}>
                                  <PlaceOutlined sx={{ fontSize: 13, color: TEXT_MUTED }} />
                                  <Typography sx={{ fontSize: "0.7rem", color: TEXT_MUTED }}>
                                    {quotation.customerLocation || "Location unavailable"}
                                  </Typography>
                                </Stack>
                              </Box>
                            </Stack>
                          </TableCell>

                          <TableCell sx={{ borderBottomColor: BORDER }}>
                            <Chip
                              size="small"
                              label={statusMeta.label}
                              sx={{
                                height: 22,
                                borderRadius: 999,
                                bgcolor: isDark ? alpha(statusMeta.dotColor, 0.18) : statusMeta.soft,
                                color: statusMeta.dotColor,
                                fontWeight: 800,
                                fontSize: "0.68rem",
                                border: `1px solid ${alpha(statusMeta.dotColor, 0.3)}`,
                              }}
                            />
                          </TableCell>

                          <TableCell sx={{ borderBottomColor: BORDER }}>
                            <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: TEXT }}>
                              {formatDate(quotation.validityEnd)}
                            </Typography>
                            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.3 }}>
                              <CalendarToday sx={{ fontSize: 12, color: quotation.resolvedStatus === "expired" ? RED : TEXT_MUTED }} />
                              <Typography
                                sx={{
                                  fontSize: "0.7rem",
                                  fontWeight: quotation.resolvedStatus === "expired" ? 700 : 400,
                                  color: quotation.resolvedStatus === "expired" ? RED : TEXT_MUTED,
                                }}
                              >
                                {quotation.resolvedStatus === "expired" ? "Expired" : formatDate(quotation.createdAt)}
                              </Typography>
                            </Stack>
                          </TableCell>

                          <TableCell sx={{ borderBottomColor: BORDER }}>
                            <Typography sx={{ fontSize: "0.85rem", fontWeight: 800, color: TEXT }}>
                              {formatCurrency(quotation.totalValue)}
                            </Typography>
                            <Typography sx={{ mt: 0.25, fontSize: "0.7rem", color: TEXT_MUTED }}>
                              {quotation.form?.subsidyAmount ? `~${formatCurrency(quotation.form.subsidyAmount)} subsidy` : "~₹0 subsidy"}
                            </Typography>
                          </TableCell>

                          <TableCell align="right" sx={{ borderBottomColor: BORDER }}>
                            <IconButton
                              size="small"
                              onClick={(event) => {
                                setMenuAnchor(event.currentTarget);
                                setActiveQuote(quotation);
                              }}
                              sx={{ color: TEXT_MUTED }}
                            >
                              <MoreVert sx={{ fontSize: 18 }} />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={1.25}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", md: "center" }}
                sx={{ px: 2.25, py: 1.5, borderTop: `1px solid ${BORDER}` }}
              >
                <Typography sx={{ fontSize: "0.75rem", color: TEXT_MUTED }}>
                  {`Showing ${filteredQuotations.length ? page * rowsPerPage + 1 : 0}-${Math.min((page + 1) * rowsPerPage, filteredQuotations.length)} of ${filteredQuotations.length} quotes`}
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <TextField
                    select
                    size="small"
                    value={rowsPerPage}
                    onChange={(event) => {
                      setRowsPerPage(Number(event.target.value));
                      setPage(0);
                    }}
                    sx={{
                      width: 96,
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                        bgcolor: isDark ? "#080d19" : "#fff",
                        color: isDark ? "#f8fafc" : TEXT,
                        "& fieldset": { borderColor: isDark ? "rgba(255, 255, 255, 0.12)" : BORDER },
                      },
                    }}
                  >
                    {[5, 10, 25].map((option) => (
                      <MenuItem key={option} value={option}>{`${option} / page`}</MenuItem>
                    ))}
                  </TextField>
                  <Button
                    variant="outlined"
                    size="small"
                    disabled={page === 0}
                    onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
                    sx={{
                      borderRadius: 2,
                      minWidth: 80,
                      borderColor: isDark ? "rgba(255, 255, 255, 0.16)" : undefined,
                      color: isDark ? "#e2e8f0" : undefined,
                    }}
                  >
                    Previous
                  </Button>
                  <Chip
                    label={page + 1}
                    sx={{
                      bgcolor: isDark ? "rgba(37, 99, 235, 0.25)" : alpha(BLUE, 0.12),
                      color: isDark ? "#60a5fa" : BLUE,
                      fontWeight: 800,
                      minWidth: 32,
                    }}
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    disabled={(page + 1) * rowsPerPage >= filteredQuotations.length}
                    onClick={() => setPage((prev) => prev + 1)}
                    sx={{
                      borderRadius: 2,
                      minWidth: 70,
                      borderColor: isDark ? "rgba(255, 255, 255, 0.16)" : undefined,
                      color: isDark ? "#e2e8f0" : undefined,
                    }}
                  >
                    Next
                  </Button>
                </Stack>
              </Stack>
            </>
          ) : (
            <Box sx={{ py: 8, px: 3, textAlign: "center" }}>
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: 3,
                  bgcolor: isDark ? "rgba(255, 255, 255, 0.05)" : alpha(BLUE, 0.05),
                  color: isDark ? "#94a3b8" : alpha(BLUE, 0.4),
                  display: "grid",
                  placeItems: "center",
                  mx: "auto",
                  mb: 2,
                }}
              >
                <RequestQuote sx={{ fontSize: 30 }} />
              </Box>
              <Typography sx={{ fontSize: "1.1rem", fontWeight: 800, color: TEXT }}>
                No quotes found
              </Typography>
              <Typography sx={{ mt: 0.5, fontSize: "0.82rem", color: TEXT_SUB }}>
                Create a quotation or widen your search filters.
              </Typography>
            </Box>
          )}
        </Paper>
      </Stack>

      {/* Row Menu Actions */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => {
          setMenuAnchor(null);
          setActiveQuote(null);
        }}
        PaperProps={{
          sx: {
            borderRadius: 2.5,
            minWidth: 180,
            bgcolor: isDark ? "#0c1322" : "#ffffff",
            color: isDark ? "#f8fafc" : TEXT,
            border: `1px solid ${BORDER}`,
            boxShadow: isDark ? "0 10px 30px rgba(0,0,0,0.6)" : "0 8px 24px rgba(0,0,0,0.1)",
            "& .MuiMenuItem-root": {
              fontSize: "0.82rem",
              fontWeight: 600,
              py: 1,
              "&:hover": { bgcolor: isDark ? "rgba(255, 255, 255, 0.08)" : undefined },
            },
          },
        }}
      >
        <MenuItem onClick={() => handlePreview(activeQuote)}>
          <OpenInNew sx={{ fontSize: 16, mr: 1, color: isDark ? "#60a5fa" : BLUE }} />
          Open quote
        </MenuItem>
        {(isAdmin || String(activeQuote?.createdBy?._id || activeQuote?.createdBy) === String(user?._id)) && (
          <MenuItem onClick={() => handleEdit(activeQuote)}>
            <EditOutlined sx={{ fontSize: 16, mr: 1, color: isDark ? "#60a5fa" : BLUE }} />
            Edit quote
          </MenuItem>
        )}
        <MenuItem onClick={() => handleStatusChange(activeQuote?.id, "sent")}>
          <SendOutlined sx={{ fontSize: 16, mr: 1, color: CYAN }} />
          Mark sent
        </MenuItem>
        <MenuItem onClick={() => handleStatusChange(activeQuote?.id, "accepted")}>
          <CheckCircleOutline sx={{ fontSize: 16, mr: 1, color: GREEN }} />
          Mark accepted
        </MenuItem>
        {(isAdmin || String(activeQuote?.createdBy?._id || activeQuote?.createdBy) === String(user?._id)) && (
          <MenuItem onClick={() => handleDelete(activeQuote?.id)} sx={{ color: RED }}>
            <DeleteOutline sx={{ fontSize: 16, mr: 1 }} />
            Delete
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
}
