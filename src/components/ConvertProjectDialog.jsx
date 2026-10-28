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

const getStatusDetails = (status) => {
  const norm = String(status || "draft").toLowerCase();
  if (norm === "approved" || norm === "accepted") {
    return {
      label: "Approved",
      color: "#16a34a",
      bg: "#dcfce7",
      border: "#bbf7d0",
    };
  }
  if (norm === "sent" || norm === "pending") {
    return {
      label: "Pending",
      color: "#6366f1",
      bg: "#eef2ff",
      border: "#c7d2fe",
    };
  }
  return {
    label: "Draft",
    color: "#d97706",
    bg: "#fef3c7",
    border: "#fde68a",
  };
};

const QuotationCard = ({ quotation, selected, onSelect, onViewDetails }) => {
  const chips = getQuotationMeta(quotation);
<<<<<<< HEAD
  const issueDate = formatDisplayDate(quotation?.savedAt || quotation?.createdAt || quotation?.issueDate);
  const statusInfo = getStatusDetails(quotation?.status);
  const systemSize = Number(quotation?.systemSize || quotation?.form?.systemSize || 0).toFixed(2);
  const totalCost = quotation?.totalCost || quotation?.form?.totalCost || 0;
  const subsidyAmount = Number(quotation?.form?.subsidy || quotation?.subsidy || 0);
=======
  const issueDate = formatDisplayDate(quotation?.savedAt || quotation?.createdAt);
  const statusLabel = String(quotation?.status || "draft").toUpperCase();
  const isAccepted = quotation?.status === "accepted";
  const isSent = quotation?.status === "sent";
>>>>>>> origin/dipak

  return (
    <Paper
      elevation={0}
      onClick={onSelect}
      sx={{
        cursor: "pointer",
        borderRadius: 2,
        border: selected ? "2px solid #4f46e5" : "1.5px solid #e2e8f0",
        boxShadow: selected
          ? "0 8px 24px rgba(79, 70, 229, 0.16)"
          : "0 2px 8px rgba(15, 23, 42, 0.02)",
        bgcolor: "#ffffff",
        p: 2.2,
        position: "relative",
        transition: "all 0.2s ease-in-out",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        "&:hover": {
          borderColor: selected ? "#4f46e5" : "#cbd5e1",
          transform: "translateY(-1px)",
          boxShadow: selected
            ? "0 10px 28px rgba(79, 70, 229, 0.2)"
            : "0 6px 18px rgba(15, 23, 42, 0.06)",
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
                border: selected ? "2.5px solid #4f46e5" : "2px solid #cbd5e1",
                bgcolor: "#ffffff",
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
                    bgcolor: "#4f46e5",
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
<<<<<<< HEAD
            startIcon={<RemoveRedEyeOutlined sx={{ fontSize: "14px !important" }} />}
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails?.(quotation);
=======
            sx={{
              height: 30,
              fontWeight: 700,
              color: isAccepted ? "#15803d" : isSent ? "#2563eb" : "#d97706",
              bgcolor: isAccepted ? "#f0fdf4" : isSent ? "#eff6ff" : "#fff7ed",
              border: `1px solid ${isAccepted ? "#bbf7d0" : isSent ? "#bfdbfe" : "#fed7aa"}`,
              borderRadius: 999,
>>>>>>> origin/dipak
            }}
            sx={{
              minWidth: "auto",
              py: 0.3,
              px: 1.2,
              borderRadius: 999,
              textTransform: "none",
              fontSize: "0.74rem",
              fontWeight: 700,
              color: "#4f46e5",
              bgcolor: "#eef2ff",
              "&:hover": {
                bgcolor: "#e0e7ff",
              },
            }}
          >
            View Details
          </Button>
        </Stack>

        {/* Quotation Number */}
        <Typography sx={{ fontSize: "1.05rem", fontWeight: 800, color: "#0f172a", mt: 1.8, mb: 1.4 }}>
          {quotation?.quotationNumber || `QT-${String(quotation?.id || "").slice(-4)}`}
        </Typography>

        {/* Two Column Specs: System Size & Created On */}
        <Stack direction="row" spacing={3} alignItems="flex-start" sx={{ mb: 1.6 }}>
          <Box>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Bolt sx={{ fontSize: 16, color: "#0f172a" }} />
              <Typography sx={{ fontWeight: 800, fontSize: "0.88rem", color: "#0f172a" }}>
                {systemSize} kW
              </Typography>
            </Stack>
            <Typography sx={{ fontSize: "0.72rem", color: "#64748b", mt: 0.2, pl: 2.4 }}>
              System Size
            </Typography>
          </Box>

          <Box>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <CalendarMonthOutlined sx={{ fontSize: 16, color: "#0f172a" }} />
              <Typography sx={{ fontWeight: 800, fontSize: "0.88rem", color: "#0f172a" }}>
                {issueDate}
              </Typography>
            </Stack>
            <Typography sx={{ fontSize: "0.72rem", color: "#64748b", mt: 0.2, pl: 2.4 }}>
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
                bgcolor: "#f1f3fd",
                color: "#4338ca",
                fontWeight: 600,
                fontSize: "0.72rem",
                borderRadius: 999,
                px: 1.2,
                py: 0.35,
                border: "1px solid rgba(67, 56, 202, 0.08)",
              }}
            >
              {chip}
            </Box>
          ))}
        </Stack>
      </Box>

      {/* Bottom Financials */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ pt: 1, borderTop: "1px solid #f8fafc" }}>
        <Box>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <CheckCircleOutline sx={{ fontSize: 14, color: "#64748b" }} />
            <Typography sx={{ fontSize: "0.74rem", color: "#64748b", fontWeight: 600 }}>
              Total Cost
            </Typography>
          </Stack>
          <Typography sx={{ fontWeight: 900, fontSize: "1.15rem", color: "#0f172a", mt: 0.2 }}>
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
              bgcolor: "#dcfce7",
              border: "1px solid #bbf7d0",
              color: "#16a34a",
              fontWeight: 800,
              fontSize: "0.78rem",
            }}
          >
            ₹ {subsidyAmount ? Math.round(subsidyAmount).toLocaleString("en-IN") : "0"}
          </Box>
          <Typography sx={{ fontSize: "0.7rem", color: "#64748b", mt: 0.3 }}>
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
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const [selectedQuotationId, setSelectedQuotationId] = useState("");
  const [projectType, setProjectType] = useState("");
  const [previewQuotation, setPreviewQuotation] = useState(null);

  useEffect(() => {
    if (!open) return;
<<<<<<< HEAD
    const accepted = quotations.find((q) => q.status === "accepted" || q.status === "approved");
=======
    const accepted = quotations.find((q) => q.status === "accepted");
>>>>>>> origin/dipak
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
            bgcolor: "#ffffff",
            color: "#0f172a",
            boxShadow: "0 25px 70px rgba(15, 23, 42, 0.16)",
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
            bgcolor: "#ffffff",
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 3,
                bgcolor: "#eef2ff",
                color: "#4f46e5",
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
              }}
            >
              <ViewInArRounded sx={{ fontSize: 24 }} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: { xs: "1.15rem", md: "1.25rem" }, fontWeight: 800, color: "#0f172a", lineHeight: 1.2 }}>
                {`Create Project for ${resolveLeadName(lead)}`}
              </Typography>
              <Typography sx={{ color: "#64748b", fontSize: "0.84rem", mt: 0.3 }}>
                Set up your project details and select a suitable quote to proceed.
              </Typography>
            </Box>
          </Stack>
          <IconButton onClick={onClose} disabled={submitting} sx={{ color: "#64748b", "&:hover": { color: "#0f172a", bgcolor: "#f1f5f9" } }}>
            <Close />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: 0, bgcolor: "#ffffff" }}>
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
                bgcolor: "#f8fafc",
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
                  <Typography sx={{ fontWeight: 800, color: "#0f172a", fontSize: "0.9rem" }}>
                    Select Quote
                  </Typography>
                  <Typography sx={{ color: "#64748b", fontSize: "0.76rem", mt: 0.3, lineHeight: 1.4 }}>
                    Choose a quotation from the list below to continue.
                  </Typography>
                </Box>
              </Stack>
            </Box>

<<<<<<< HEAD
            {/* ── Main Content Area ── */}
            <Box sx={{ flex: 1, p: { xs: 2.5, sm: 3.5, md: 3.8 }, display: "flex", flexDirection: "column" }}>
              {/* Section 1: Select Project Type */}
              <Box sx={{ mb: 3 }}>
                <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 1.2 }}>
=======
                <Stack spacing={2.2} sx={{ maxWidth: 520 }}>
                  {quotations.map((quotation) => (
                    <QuotationCard
                      key={quotation.id}
                      quotation={quotation}
                      selected={quotation.id === selectedQuotationId}
                      onSelect={() => setSelectedQuotationId(quotation.id)}
                    />
                  ))}
                </Stack>

                <Stack
                  direction={{ xs: "column", md: "row" }}
                  spacing={1.8}
                  justifyContent="flex-end"
                  sx={{ mt: "auto", pt: 4, borderTop: "1px solid #e5e7eb" }}
                >
                  <Button
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={onCreateQuotation}
                    disabled={submitting}
                    sx={{
                      minHeight: 50,
                      px: 2.8,
                      borderRadius: 2,
                      textTransform: "none",
                      fontWeight: 700,
                      color: "#475569",
                      borderColor: "#dbe2ea",
                    }}
                  >
                    Create New Quote
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<ChevronRight />}
                    onClick={() => onCreateWithoutQuotation({ projectType })}
                    disabled={submitting || !projectType}
                    sx={{
                      minHeight: 50,
                      px: 2.8,
                      borderRadius: 2,
                      textTransform: "none",
                      fontWeight: 700,
                      color: "#475569",
                      borderColor: "#dbe2ea",
                    }}
                  >
                    Create without a quotation
                  </Button>
                  <Button
                    variant="contained"
                    endIcon={!submitting ? <ArrowForward /> : undefined}
                    startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : undefined}
                    onClick={() => onContinueWithQuotation(selectedQuotation, { projectType })}
                    disabled={!selectedQuotation || submitting || !projectType}
                    sx={{
                      minHeight: 50,
                      px: 3.2,
                      borderRadius: 2.5,
                      textTransform: "none",
                      fontWeight: 800,
                      fontSize: "0.96rem",
                      bgcolor: "#2563eb",
                      color: "#ffffff",
                      boxShadow: "0 10px 24px rgba(37, 99, 235, 0.28)",
                      "&:hover": {
                        bgcolor: "#1d4ed8",
                        boxShadow: "0 12px 28px rgba(37, 99, 235, 0.38)",
                      },
                      "&.Mui-disabled": {
                        bgcolor: "#e2e8f0",
                        color: "#94a3b8",
                        boxShadow: "none",
                      },
                    }}
                  >
                    {submitting ? "Converting to Project..." : "Continue with Selected Quote"}
                  </Button>
                </Stack>
              </>
            ) : (
              <Box
                sx={{
                  flex: 1,
                  minHeight: 420,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Stack spacing={2.4} alignItems="center" textAlign="center" sx={{ maxWidth: 560 }}>
>>>>>>> origin/dipak
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: 2,
                      bgcolor: "#eef2ff",
                      color: "#4f46e5",
                      display: "grid",
                      placeItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    <GridViewRounded sx={{ fontSize: 18 }} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontWeight: 800, color: "#0f172a", fontSize: "1.05rem" }}>
                      Select Project Type
                    </Typography>
                    <Typography sx={{ color: "#64748b", fontSize: "0.8rem" }}>
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
                    startAdornment={
                      <InputAdornment position="start" sx={{ pl: 0.5, mr: 1 }}>
                        <HomeOutlined sx={{ color: "#4f46e5", fontSize: 22 }} />
                      </InputAdornment>
                    }
                    renderValue={(selected) => (
                      <Box sx={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
                        <Typography sx={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 700, lineHeight: 1 }}>
                          Project Type <Box component="span" sx={{ color: "#ef4444" }}>*</Box>
                        </Typography>
                        <Typography sx={{ fontSize: "0.92rem", color: "#0f172a", fontWeight: 800, mt: 0.3 }}>
                          {selected}
                        </Typography>
                      </Box>
                    )}
                    sx={{
                      height: 56,
                      borderRadius: 3.5,
                      bgcolor: "#ffffff",
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#e2e8f0",
                        borderWidth: "1.5px",
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#c7d2fe",
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#4f46e5",
                      },
                    }}
                  >
                    {PROJECT_TYPES.map((type) => (
                      <MenuItem key={type} value={type}>
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
                        bgcolor: "#eef2ff",
                        color: "#4f46e5",
                        display: "grid",
                        placeItems: "center",
                        flexShrink: 0,
                      }}
                    >
                      <DescriptionOutlined sx={{ fontSize: 18 }} />
                    </Box>
                    <Box>
                      <Typography sx={{ fontWeight: 800, color: "#0f172a", fontSize: "1.05rem" }}>
                        Available Quotations
                      </Typography>
                      <Typography sx={{ color: "#64748b", fontSize: "0.8rem" }}>
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
                        bgcolor: "#eef2ff",
                        color: "#4f46e5",
                        fontWeight: 700,
                        fontSize: "0.78rem",
                        px: 1.4,
                        py: 0.4,
                        borderRadius: 999,
                      }}
                    >
                      <DescriptionOutlined sx={{ fontSize: 14, color: "#4f46e5" }} />
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
                      border: "1px dashed #cbd5e1",
                      p: 4,
                      textAlign: "center",
                      bgcolor: "#f8fafc",
                    }}
                  >
                    <DescriptionOutlined sx={{ fontSize: 40, color: "#94a3b8", mb: 1 }} />
                    <Typography sx={{ fontWeight: 700, color: "#1e293b", fontSize: "1rem" }}>
                      No Quotations Found
                    </Typography>
                    <Typography sx={{ color: "#64748b", fontSize: "0.85rem", mt: 0.5, mb: 2 }}>
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
                    color: "#0f172a",
                    borderColor: "#cbd5e1",
                    bgcolor: "#ffffff",
                    "&:hover": {
                      borderColor: "#94a3b8",
                      bgcolor: "#f8fafc",
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
                      bgcolor: "#e2e8f0",
                      color: "#94a3b8",
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
        PaperProps={{ sx: { borderRadius: 3.5, p: 1 } }}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: 800 }}>
          {previewQuotation?.quotationNumber || "Quotation Details"}
          <IconButton onClick={() => setPreviewQuotation(null)} size="small">
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
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

