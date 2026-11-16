import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  Add,
  ArrowForward,
  Bolt,
  CalendarMonthOutlined,
  CheckCircleOutline,
  Close,
  DescriptionOutlined,
  GridViewRounded,
  HomeOutlined,
  PaidOutlined,
  RemoveRedEyeOutlined,
  ViewInArRounded,
  KeyboardArrowDownRounded,
} from "@mui/icons-material";
import { format, isValid, parseISO } from "date-fns";

const PROJECT_TYPES = ["Residential", "Commercial", "ULA 1kw On-grid", "Maintenance", "Others"];

const resolveLeadName = (lead) =>
  lead?.customerName ||
  lead?.name ||
  lead?.fullName ||
  [lead?.firstName, lead?.lastName].filter(Boolean).join(" ").trim() ||
  "Lead";

const formatDisplayDate = (value) => {
  if (!value) return "—";
  try {
    const parsed = typeof value === "string" ? parseISO(value) : new Date(value);
    return isValid(parsed) ? format(parsed, "dd MMM yyyy") : "—";
  } catch {
    return "—";
  }
};

const formatCurrency = (value) => {
  const numericValue = Number(value || 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(numericValue) ? numericValue : 0);
};

const getQuotationMeta = (quotation) => {
  const form = quotation?.form || {};
  const tags = [
    form.panelBrand || form.brand || quotation?.panelBrand,
    form.inverterBrand || quotation?.inverterBrand,
    form.customerType || form.projectType || quotation?.projectType,
  ].filter(Boolean);

  if (!tags.length && quotation?.systemType) {
    tags.push(quotation.systemType);
  }
  return tags;
};

const isThemeDark = (theme) => {
  if (theme?.palette?.mode === "dark") return true;
  if (typeof window === "undefined") return false;
  return (
    document.documentElement.classList.contains("dark") ||
    document.body.classList.contains("dark") ||
    localStorage.getItem("solar_theme") === "dark" ||
    localStorage.getItem("theme") === "dark"
  );
};

const getStatusDetails = (status, isDark = false) => {
  const norm = String(status || "draft").toLowerCase();
  if (norm === "approved" || norm === "accepted") {
    return {
      label: "Approved",
      color: isDark ? "#4ade80" : "#16a34a",
      bg: isDark ? "rgba(34, 197, 94, 0.16)" : "#dcfce7",
      border: isDark ? "rgba(34, 197, 94, 0.3)" : "#bbf7d0",
    };
  }
  if (norm === "sent" || norm === "pending") {
    return {
      label: "Pending",
      color: isDark ? "#818cf8" : "#6366f1",
      bg: isDark ? "rgba(99, 102, 241, 0.16)" : "#eef2ff",
      border: isDark ? "rgba(99, 102, 241, 0.3)" : "#c7d2fe",
    };
  }
  return {
    label: "Draft",
    color: isDark ? "#fbbf24" : "#d97706",
    bg: isDark ? "rgba(245, 158, 11, 0.16)" : "#fef3c7",
    border: isDark ? "rgba(245, 158, 11, 0.3)" : "#fde68a",
  };
};

const QuotationCard = ({ quotation, selected, onSelect, onViewDetails }) => {
  const theme = useTheme();
  const isDark = isThemeDark(theme);
  const chips = getQuotationMeta(quotation);
  const issueDate = formatDisplayDate(quotation?.savedAt || quotation?.createdAt || quotation?.issueDate);
  const statusInfo = getStatusDetails(quotation?.status, isDark);
  const systemSize = Number(quotation?.systemSize || quotation?.form?.systemSize || 0).toFixed(2);
  const totalCost = quotation?.totalCost || quotation?.form?.totalCost || 0;
  const subsidyAmount = Number(quotation?.form?.subsidy || quotation?.subsidy || 0);

  return (
    <Paper
      elevation={0}
      onClick={onSelect}
      sx={{
        cursor: "pointer",
        borderRadius: 2.5,
        border: selected
          ? "2px solid #6366f1"
          : (isDark ? "1px solid rgba(255,255,255,0.12)" : "1.5px solid #e2e8f0"),
        boxShadow: selected
          ? (isDark ? "0 8px 24px rgba(99, 102, 241, 0.25)" : "0 8px 24px rgba(79, 70, 229, 0.16)")
          : (isDark ? "none" : "0 2px 8px rgba(15, 23, 42, 0.02)"),
        bgcolor: isDark
          ? (selected ? "rgba(99, 102, 241, 0.08)" : "#111c30")
          : "#ffffff",
        p: 2.2,
        position: "relative",
        transition: "all 0.2s ease-in-out",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        "&:hover": {
          borderColor: selected ? "#6366f1" : (isDark ? "rgba(255,255,255,0.25)" : "#cbd5e1"),
          transform: "translateY(-1px)",
          boxShadow: selected
            ? (isDark ? "0 10px 28px rgba(99, 102, 241, 0.35)" : "0 10px 28px rgba(79, 70, 229, 0.2)")
            : (isDark ? "0 6px 18px rgba(0, 0, 0, 0.3)" : "0 6px 18px rgba(15, 23, 42, 0.06)"),
        },
      }}
    >
      <Box>
        {/* Top Row: Radio + Status + View Details */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
          <Stack direction="row" spacing={1.2} alignItems="center">
            {/* Custom Radio Button */}
            <Box
              sx={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                border: selected ? "2.5px solid #6366f1" : (isDark ? "2px solid #475569" : "2px solid #cbd5e1"),
                bgcolor: isDark ? "#0e1626" : "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "all 0.15s ease",
              }}
            >
              {selected && (
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    bgcolor: "#6366f1",
                  }}
                />
              )}
            </Box>

            {/* Status Chip */}
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.5,
                height: 24,
                px: 1,
                borderRadius: 999,
                fontWeight: 700,
                fontSize: "0.72rem",
                color: statusInfo.color,
                bgcolor: statusInfo.bg,
                border: `1px solid ${statusInfo.border}`,
              }}
            >
              <DescriptionOutlined sx={{ fontSize: 13, color: statusInfo.color }} />
              {statusInfo.label}
            </Box>
          </Stack>

          {/* View Details Ghost Button */}
          <Button
            size="small"
            startIcon={<RemoveRedEyeOutlined sx={{ fontSize: "14px !important" }} />}
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails?.(quotation);
            }}
            sx={{
              minWidth: "auto",
              py: 0.3,
              px: 1.2,
              borderRadius: 999,
              textTransform: "none",
              fontSize: "0.74rem",
              fontWeight: 700,
              color: isDark ? "#a5b4fc" : "#4f46e5",
              bgcolor: isDark ? "rgba(99, 102, 241, 0.15)" : "#eef2ff",
              "&:hover": {
                bgcolor: isDark ? "rgba(99, 102, 241, 0.25)" : "#e0e7ff",
              },
            }}
          >
            View Details
          </Button>
        </Stack>

        {/* Quotation Number */}
        <Typography sx={{ fontSize: "1.05rem", fontWeight: 800, color: isDark ? "#f8fafc" : "#0f172a", mt: 1.8, mb: 1.4 }}>
          {quotation?.quotationNumber || `QT-${String(quotation?.id || "").slice(-4)}`}
        </Typography>

        {/* Two Column Specs: System Size & Created On */}
        <Stack direction="row" spacing={3} alignItems="flex-start" sx={{ mb: 1.6 }}>
          <Box>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Bolt sx={{ fontSize: 16, color: isDark ? "#f59e0b" : "#0f172a" }} />
              <Typography sx={{ fontWeight: 800, fontSize: "0.88rem", color: isDark ? "#f8fafc" : "#0f172a" }}>
                {systemSize} kW
              </Typography>
            </Stack>
            <Typography sx={{ fontSize: "0.72rem", color: isDark ? "#94a3b8" : "#64748b", mt: 0.2, pl: 2.4 }}>
              System Size
            </Typography>
          </Box>

          <Box>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <CalendarMonthOutlined sx={{ fontSize: 16, color: isDark ? "#38bdf8" : "#0f172a" }} />
              <Typography sx={{ fontWeight: 800, fontSize: "0.88rem", color: isDark ? "#f8fafc" : "#0f172a" }}>
                {issueDate}
              </Typography>
            </Stack>
            <Typography sx={{ fontSize: "0.72rem", color: isDark ? "#94a3b8" : "#64748b", mt: 0.2, pl: 2.4 }}>
              Created On
            </Typography>
          </Box>
        </Stack>

        {/* Component Tags Row */}
        <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
          {chips.map((chip, idx) => (
            <Box
              key={`${chip}-${idx}`}
              sx={{
                bgcolor: isDark ? "rgba(99, 102, 241, 0.12)" : "#f1f3fd",
                color: isDark ? "#c7d2fe" : "#4338ca",
                fontWeight: 600,
                fontSize: "0.72rem",
                borderRadius: 999,
                px: 1.2,
                py: 0.35,
                border: `1px solid ${isDark ? "rgba(99, 102, 241, 0.2)" : "rgba(67, 56, 202, 0.08)"}`,
              }}
            >
              {chip}
            </Box>
          ))}
        </Stack>
      </Box>

      {/* Bottom Financials */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ pt: 1, borderTop: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #f8fafc" }}>
        <Box>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <CheckCircleOutline sx={{ fontSize: 14, color: isDark ? "#94a3b8" : "#64748b" }} />
            <Typography sx={{ fontSize: "0.74rem", color: isDark ? "#94a3b8" : "#64748b", fontWeight: 600 }}>
              Total Cost
            </Typography>
          </Stack>
          <Typography sx={{ fontWeight: 900, fontSize: "1.15rem", color: isDark ? "#f8fafc" : "#0f172a", mt: 0.2 }}>
            {formatCurrency(totalCost)}
          </Typography>
        </Box>

        <Box sx={{ textAlign: "right" }}>
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              px: 1,
              py: 0.2,
              borderRadius: 999,
              bgcolor: isDark ? "rgba(34, 197, 94, 0.15)" : "#dcfce7",
              border: `1px solid ${isDark ? "rgba(34, 197, 94, 0.3)" : "#bbf7d0"}`,
              color: isDark ? "#4ade80" : "#16a34a",
              fontWeight: 800,
              fontSize: "0.78rem",
            }}
          >
            ₹ {subsidyAmount ? Math.round(subsidyAmount).toLocaleString("en-IN") : "0"}
          </Box>
          <Typography sx={{ fontSize: "0.7rem", color: isDark ? "#94a3b8" : "#64748b", mt: 0.3 }}>
            Subsidy
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
};

export default function ConvertProjectDialog({
  open,
  lead,
  quotations = [],
  submitting = false,
  onClose,
  onCreateQuotation,
  onContinueWithQuotation,
}) {
  const theme = useTheme();
  const isDark = isThemeDark(theme);
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const [selectedQuotationId, setSelectedQuotationId] = useState("");
  const [projectType, setProjectType] = useState("");
  const [previewQuotation, setPreviewQuotation] = useState(null);

  useEffect(() => {
    if (!open) return;
    const accepted = quotations.find((q) => q.status === "accepted" || q.status === "approved");
    setSelectedQuotationId(accepted?.id || quotations[0]?.id || "");
    setProjectType(PROJECT_TYPES.includes(lead?.projectType) ? lead.projectType : "Residential");
  }, [open, quotations, lead?.projectType]);

  const selectedQuotation = useMemo(
    () => quotations.find((quotation) => quotation.id === selectedQuotationId) || null,
    [quotations, selectedQuotationId],
  );

  return (
    <>
      <Dialog
        open={open}
        onClose={submitting ? undefined : onClose}
        maxWidth="lg"
        fullWidth
        fullScreen={fullScreen}
        PaperProps={{
          sx: {
            borderRadius: fullScreen ? 0 : 5,
            overflow: "hidden",
            bgcolor: isDark ? "#0e1626" : "#ffffff",
            color: isDark ? "#f8fafc" : "#0f172a",
            boxShadow: isDark ? "0 25px 70px rgba(0, 0, 0, 0.7)" : "0 25px 70px rgba(15, 23, 42, 0.16)",
            border: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "none",
            maxWidth: 1040,
          },
        }}
      >
        {/* ── Dialog Header ── */}
        <Box
          sx={{
            px: { xs: 2.5, sm: 3.5, md: 4 },
            py: 2.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            bgcolor: isDark ? "#0e1626" : "#ffffff",
            borderBottom: isDark ? "1px solid rgba(255, 255, 255, 0.06)" : "1px solid #f1f5f9",
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 3,
                bgcolor: isDark ? "rgba(99, 102, 241, 0.15)" : "#eef2ff",
                color: isDark ? "#818cf8" : "#4f46e5",
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
              }}
            >
              <ViewInArRounded sx={{ fontSize: 24 }} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: { xs: "1.15rem", md: "1.25rem" }, fontWeight: 800, color: isDark ? "#f8fafc" : "#0f172a", lineHeight: 1.2 }}>
                {`Create Project for ${resolveLeadName(lead)}`}
              </Typography>
              <Typography sx={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.84rem", mt: 0.3 }}>
                Set up your project details and select a suitable quote to proceed.
              </Typography>
            </Box>
          </Stack>
          <IconButton onClick={onClose} disabled={submitting} sx={{ color: isDark ? "#94a3b8" : "#64748b", "&:hover": { color: isDark ? "#f8fafc" : "#0f172a", bgcolor: isDark ? "rgba(255, 255, 255, 0.06)" : "#f1f5f9" } }}>
            <Close />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: 0, bgcolor: isDark ? "#0e1626" : "#ffffff" }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              minHeight: 490,
            }}
          >
            {/* ── Left Sidebar Stepper ── */}
            <Box
              sx={{
                width: { xs: "100%", md: 240 },
                flexShrink: 0,
                bgcolor: isDark ? "#090d16" : "#f8fafc",
                borderRight: isDark ? "1px solid rgba(255, 255, 255, 0.06)" : "1px solid #e2e8f0",
                p: 3,
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Step 1: Active */}
              <Stack direction="row" spacing={1.5} alignItems="flex-start">
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    bgcolor: "#4f46e5",
                    color: "#ffffff",
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 800,
                    fontSize: "0.88rem",
                    flexShrink: 0,
                    boxShadow: "0 4px 10px rgba(79, 70, 229, 0.3)",
                  }}
                >
                  1
                </Box>
                <Box sx={{ pt: 0.2 }}>
                  <Typography sx={{ fontWeight: 800, color: isDark ? "#f8fafc" : "#0f172a", fontSize: "0.9rem" }}>
                    Select Quote
                  </Typography>
                  <Typography sx={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.76rem", mt: 0.3, lineHeight: 1.4 }}>
                    Choose a quotation from the list below to continue.
                  </Typography>
                </Box>
              </Stack>
            </Box>

            {/* ── Main Content Area ── */}
            <Box sx={{ flex: 1, p: { xs: 2.5, sm: 3.5, md: 3.8 }, display: "flex", flexDirection: "column" }}>
              {/* Section 1: Select Project Type */}
              <Box sx={{ mb: 3 }}>
                <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 1.2 }}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: 2,
                      bgcolor: isDark ? "rgba(99, 102, 241, 0.15)" : "#eef2ff",
                      color: isDark ? "#818cf8" : "#4f46e5",
                      display: "grid",
                      placeItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    <GridViewRounded sx={{ fontSize: 18 }} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontWeight: 800, color: isDark ? "#f8fafc" : "#0f172a", fontSize: "1.05rem" }}>
                      Select Project Type
                    </Typography>
                    <Typography sx={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.8rem" }}>
                      Choose the project category before selecting a quotation.
                    </Typography>
                  </Box>
                </Stack>

                <FormControl fullWidth>
                  <Select
                    value={projectType}
                    onChange={(e) => setProjectType(e.target.value)}
                    disabled={submitting}
                    IconComponent={KeyboardArrowDownRounded}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          bgcolor: isDark ? "#111c30" : "#ffffff",
                          color: isDark ? "#f8fafc" : "#0f172a",
                          border: isDark ? "1px solid rgba(255, 255, 255, 0.1)" : "none",
                        },
                      },
                    }}
                    startAdornment={
                      <InputAdornment position="start" sx={{ pl: 0.5, mr: 1 }}>
                        <HomeOutlined sx={{ color: isDark ? "#818cf8" : "#4f46e5", fontSize: 22 }} />
                      </InputAdornment>
                    }
                    renderValue={(selected) => (
                      <Box sx={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
                        <Typography sx={{ fontSize: "0.7rem", color: isDark ? "#94a3b8" : "#64748b", fontWeight: 700, lineHeight: 1 }}>
                          Project Type <Box component="span" sx={{ color: "#ef4444" }}>*</Box>
                        </Typography>
                        <Typography sx={{ fontSize: "0.92rem", color: isDark ? "#f8fafc" : "#0f172a", fontWeight: 800, mt: 0.3 }}>
                          {selected}
                        </Typography>
                      </Box>
                    )}
                    sx={{
                      height: 56,
                      borderRadius: 3.5,
                      bgcolor: isDark ? "#111c30" : "#ffffff",
                      color: isDark ? "#f8fafc" : "#0f172a",
                      "& .MuiSvgIcon-root": {
                        color: isDark ? "#94a3b8" : "#64748b",
                      },
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: isDark ? "rgba(255, 255, 255, 0.12)" : "#e2e8f0",
                        borderWidth: "1.5px",
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: isDark ? "rgba(99, 102, 241, 0.5)" : "#c7d2fe",
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#4f46e5",
                      },
                    }}
                  >
                    {PROJECT_TYPES.map((type) => (
                      <MenuItem key={type} value={type} sx={{ color: isDark ? "#f8fafc" : "inherit" }}>
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {/* Section 2: Available Quotations */}
              <Box sx={{ mb: 2.5 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.6 }}>
                  <Stack direction="row" spacing={1.2} alignItems="center">
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: 2,
                        bgcolor: isDark ? "rgba(99, 102, 241, 0.15)" : "#eef2ff",
                        color: isDark ? "#818cf8" : "#4f46e5",
                        display: "grid",
                        placeItems: "center",
                        flexShrink: 0,
                      }}
                    >
                      <DescriptionOutlined sx={{ fontSize: 18 }} />
                    </Box>
                    <Box>
                      <Typography sx={{ fontWeight: 800, color: isDark ? "#f8fafc" : "#0f172a", fontSize: "1.05rem" }}>
                        Available Quotations
                      </Typography>
                      <Typography sx={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.8rem" }}>
                        Select one of the quotations below to create your project.
                      </Typography>
                    </Box>
                  </Stack>

                  {quotations.length > 0 && (
                    <Box
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 0.6,
                        bgcolor: isDark ? "rgba(99, 102, 241, 0.15)" : "#eef2ff",
                        color: isDark ? "#a5b4fc" : "#4f46e5",
                        fontWeight: 700,
                        fontSize: "0.78rem",
                        px: 1.4,
                        py: 0.4,
                        borderRadius: 999,
                      }}
                    >
                      <DescriptionOutlined sx={{ fontSize: 14, color: isDark ? "#a5b4fc" : "#4f46e5" }} />
                      {`${quotations.length} quote${quotations.length === 1 ? "" : "s"} found`}
                    </Box>
                  )}
                </Stack>

                {/* Quotation Cards Grid */}
                {quotations.length > 0 ? (
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "1fr",
                        sm: "repeat(auto-fit, minmax(250px, 1fr))",
                      },
                      gap: 2,
                    }}
                  >
                    {quotations.map((quotation) => (
                      <QuotationCard
                        key={quotation.id}
                        quotation={quotation}
                        selected={quotation.id === selectedQuotationId}
                        onSelect={() => setSelectedQuotationId(quotation.id)}
                        onViewDetails={(q) => setPreviewQuotation(q)}
                      />
                    ))}
                  </Box>
                ) : (
                  <Box
                    sx={{
                      borderRadius: 3.5,
                      border: isDark ? "1px dashed rgba(255, 255, 255, 0.15)" : "1px dashed #cbd5e1",
                      p: 4,
                      textAlign: "center",
                      bgcolor: isDark ? "#111c30" : "#f8fafc",
                    }}
                  >
                    <DescriptionOutlined sx={{ fontSize: 40, color: isDark ? "#64748b" : "#94a3b8", mb: 1 }} />
                    <Typography sx={{ fontWeight: 700, color: isDark ? "#f8fafc" : "#1e293b", fontSize: "1rem" }}>
                      No Quotations Found
                    </Typography>
                    <Typography sx={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.85rem", mt: 0.5, mb: 2 }}>
                      Create a quotation first to convert this lead to a project.
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<Add />}
                      onClick={onCreateQuotation}
                      sx={{
                        borderRadius: 999,
                        px: 3,
                        py: 1,
                        textTransform: "none",
                        fontWeight: 700,
                        bgcolor: "#4f46e5",
                        "&:hover": {
                          bgcolor: "#4338ca",
                        },
                      }}
                    >
                      Create Quotation
                    </Button>
                  </Box>
                )}
              </Box>

              {/* ── Footer Actions ── */}
              <Stack
                direction="row"
                spacing={1.5}
                justifyContent="flex-end"
                alignItems="center"
                sx={{ mt: "auto", pt: 2.5 }}
              >
                <Button
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={onCreateQuotation}
                  disabled={submitting}
                  sx={{
                    minHeight: 44,
                    px: 2.8,
                    borderRadius: 999,
                    textTransform: "none",
                    fontWeight: 700,
                    fontSize: "0.88rem",
                    color: isDark ? "#f8fafc" : "#0f172a",
                    borderColor: isDark ? "rgba(255, 255, 255, 0.16)" : "#cbd5e1",
                    bgcolor: isDark ? "#111c30" : "#ffffff",
                    "&:hover": {
                      borderColor: isDark ? "rgba(255, 255, 255, 0.3)" : "#94a3b8",
                      bgcolor: isDark ? "#172338" : "#f8fafc",
                    },
                  }}
                >
                  Create New Quote
                </Button>

                <Button
                  variant="contained"
                  endIcon={!submitting ? <ArrowForward sx={{ fontSize: 17 }} /> : undefined}
                  startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : undefined}
                  onClick={() => onContinueWithQuotation(selectedQuotation, { projectType })}
                  disabled={!selectedQuotation || submitting || !projectType}
                  sx={{
                    minHeight: 44,
                    px: 3,
                    borderRadius: 999,
                    textTransform: "none",
                    fontWeight: 700,
                    fontSize: "0.88rem",
                    bgcolor: "#4f46e5",
                    color: "#ffffff",
                    boxShadow: "0 6px 20px rgba(79, 70, 229, 0.3)",
                    "&:hover": {
                      bgcolor: "#4338ca",
                      boxShadow: "0 8px 24px rgba(79, 70, 229, 0.4)",
                    },
                    "&.Mui-disabled": {
                      bgcolor: isDark ? "rgba(255, 255, 255, 0.08)" : "#e2e8f0",
                      color: isDark ? "#64748b" : "#94a3b8",
                      boxShadow: "none",
                    },
                  }}
                >
                  {submitting ? "Converting to Project..." : "Continue with Selected Quote"}
                </Button>
              </Stack>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {/* ── Quotation Details Preview Dialog ── */}
      <Dialog
        open={Boolean(previewQuotation)}
        onClose={() => setPreviewQuotation(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3.5,
            p: 1,
            bgcolor: isDark ? "#0e1626" : "#ffffff",
            color: isDark ? "#f8fafc" : "#0f172a",
            border: isDark ? "1px solid rgba(255, 255, 255, 0.1)" : "none",
          },
        }}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: 800 }}>
          {previewQuotation?.quotationNumber || "Quotation Details"}
          <IconButton onClick={() => setPreviewQuotation(null)} size="small" sx={{ color: isDark ? "#94a3b8" : "inherit" }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "divider" }}>
          <Stack spacing={2}>
            <Stack direction="row" justifyContent="space-between">
              <Typography color="text.secondary">System Size</Typography>
              <Typography fontWeight={700}>
                {Number(previewQuotation?.systemSize || previewQuotation?.form?.systemSize || 0).toFixed(2)} kW
              </Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography color="text.secondary">Panel Brand</Typography>
              <Typography fontWeight={700}>{previewQuotation?.form?.panelBrand || previewQuotation?.panelBrand || "—"}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography color="text.secondary">Inverter Brand</Typography>
              <Typography fontWeight={700}>{previewQuotation?.form?.inverterBrand || previewQuotation?.inverterBrand || "—"}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography color="text.secondary">Total Cost</Typography>
              <Typography fontWeight={800} color="#4f46e5">
                {formatCurrency(previewQuotation?.totalCost || previewQuotation?.form?.totalCost || 0)}
              </Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography color="text.secondary">Estimated Subsidy</Typography>
              <Typography fontWeight={800} color="#16a34a">
                {formatCurrency(previewQuotation?.form?.subsidy || previewQuotation?.subsidy || 0)}
              </Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography color="text.secondary">Net Price</Typography>
              <Typography fontWeight={800}>
                {formatCurrency(
                  (previewQuotation?.totalCost || previewQuotation?.form?.totalCost || 0) -
                  (previewQuotation?.form?.subsidy || previewQuotation?.subsidy || 0)
                )}
              </Typography>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  );
}

