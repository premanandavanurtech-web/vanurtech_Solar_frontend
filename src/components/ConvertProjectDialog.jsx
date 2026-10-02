import React, { useEffect, useMemo, useState } from "react";
import {
  alpha,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import {
  Add,
  ArrowForward,
  CalendarToday,
  Check,
  ChevronRight,
  Close,
  DescriptionOutlined,
} from "@mui/icons-material";
import { format, isValid, parseISO } from "date-fns";

const PRIMARY = "#31384d";
const ACCENT = "#5160d6";
const ACCENT_LIGHT = "#a6d9cc";

const PROJECT_TYPES = ["Residential", "Commercial", "ULA 1kw On-grid", "Maintenance", "Others"];

const resolveLeadName = (lead) =>
  lead?.customerName ||
  lead?.name ||
  lead?.fullName ||
  [lead?.firstName, lead?.lastName].filter(Boolean).join(" ").trim() ||
  "Lead";

const formatDisplayDate = (value) => {
  if (!value) return "";
  const parsed = typeof value === "string" ? parseISO(value) : new Date(value);
  if (!isValid(parsed)) return "";
  return format(parsed, "d MMM yyyy");
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
  return [
    form.panelBrand || form.brand || quotation?.panelBrand,
    form.inverterBrand || quotation?.inverterBrand,
    form.customerType || form.projectType || quotation?.projectType,
  ].filter(Boolean);
};

const StepItem = ({ active, label, completed = false }) => (
  <Box
    sx={{
      display: "inline-flex",
      alignItems: "center",
      gap: 1,
      px: 2,
      py: 1.2,
      borderRadius: 999,
      bgcolor: active ? PRIMARY : "transparent",
      color: active ? "#fff" : "#a1a1aa",
      fontWeight: 700,
      fontSize: "0.98rem",
      minWidth: 320,
      maxWidth: "100%",
    }}
  >
    <Check sx={{ fontSize: 18, opacity: completed || active ? 1 : 0.55 }} />
    <Typography sx={{ fontSize: "inherit", fontWeight: "inherit", color: "inherit" }}>
      {label}
    </Typography>
  </Box>
);

const QuotationCard = ({ quotation, selected, onSelect }) => {
  const chips = getQuotationMeta(quotation);
  const issueDate = formatDisplayDate(quotation?.savedAt || quotation?.createdAt);
  const statusLabel = String(quotation?.status || "draft").toUpperCase();
  const isAccepted = quotation?.status === "accepted";
  const isSent = quotation?.status === "sent";

  return (
    <Paper
      elevation={0}
      onClick={onSelect}
      sx={{
        cursor: "pointer",
        borderRadius: 3,
        border: `1px solid ${selected ? alpha(ACCENT, 0.6) : "#e5e7eb"}`,
        boxShadow: selected ? "0 18px 32px rgba(81, 96, 214, 0.12)" : "none",
        bgcolor: selected ? alpha(ACCENT, 0.03) : "#fff",
        p: 3,
        transition: "all 0.2s ease",
        "&:hover": {
          borderColor: alpha(ACCENT, 0.45),
          boxShadow: "0 14px 28px rgba(15, 23, 42, 0.08)",
        },
      }}
    >
      <Stack spacing={2}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1.5}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: 2,
                bgcolor: alpha(ACCENT, 0.08),
                color: ACCENT,
                display: "grid",
                placeItems: "center",
              }}
            >
              <DescriptionOutlined />
            </Box>
            <Typography sx={{ fontSize: "1.25rem", fontWeight: 800, color: "#0f172a" }}>
              {quotation?.quotationNumber || "Quotation"}
            </Typography>
          </Stack>
          <Chip
            label={statusLabel}
            size="small"
            sx={{
              height: 30,
              fontWeight: 700,
              color: isAccepted ? "#15803d" : isSent ? "#2563eb" : "#d97706",
              bgcolor: isAccepted ? "#f0fdf4" : isSent ? "#eff6ff" : "#fff7ed",
              border: `1px solid ${isAccepted ? "#bbf7d0" : isSent ? "#bfdbfe" : "#fed7aa"}`,
              borderRadius: 999,
            }}
          />
        </Stack>

        <Box>
          <Typography sx={{ fontSize: "1rem", color: "#0f172a", fontWeight: 800 }}>
            {Number(quotation?.systemSize || 0).toFixed(2)}{" "}
            <Box component="span" sx={{ color: "#64748b", fontWeight: 500 }}>
              kW System
            </Box>
          </Typography>
          {issueDate ? (
            <Stack direction="row" spacing={0.8} alignItems="center" sx={{ mt: 0.7, color: "#64748b" }}>
              <CalendarToday sx={{ fontSize: 16 }} />
              <Typography sx={{ fontSize: "0.95rem" }}>{issueDate}</Typography>
            </Stack>
          ) : null}
        </Box>

        {chips.length ? (
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {chips.map((chip) => (
              <Chip
                key={chip}
                label={chip}
                size="small"
                sx={{
                  bgcolor: "#f8fafc",
                  color: "#64748b",
                  border: "1px solid #e2e8f0",
                  borderRadius: 2,
                }}
              />
            ))}
          </Stack>
        ) : null}

        <Box
          sx={{
            borderRadius: 2.5,
            border: "1px solid #e5e7eb",
            px: 2,
            py: 1.8,
            display: "grid",
            gap: 1,
          }}
        >
          <Stack direction="row" justifyContent="space-between" spacing={2}>
            <Typography sx={{ color: "#64748b" }}>Total Cost</Typography>
            <Typography sx={{ color: "#0f172a", fontWeight: 800 }}>
              {formatCurrency(quotation?.totalCost)}
            </Typography>
          </Stack>
          <Stack direction="row" justifyContent="space-between" spacing={2}>
            <Typography sx={{ color: "#64748b" }}>Subsidy</Typography>
            <Typography sx={{ color: "#14b8a6", fontWeight: 800 }}>
              {formatCurrency(quotation?.form?.subsidy || quotation?.subsidy)}
            </Typography>
          </Stack>
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
  onCreateWithoutQuotation,
  onContinueWithQuotation,
}) {
  const [selectedQuotationId, setSelectedQuotationId] = useState("");
  const [projectType, setProjectType] = useState("");

  useEffect(() => {
    if (!open) return;
    const accepted = quotations.find((q) => q.status === "accepted");
    setSelectedQuotationId(accepted?.id || quotations[0]?.id || "");
    setProjectType(PROJECT_TYPES.includes(lead?.projectType) ? lead.projectType : "Residential");
  }, [open, quotations, lead?.projectType]);

  const selectedQuotation = useMemo(
    () => quotations.find((quotation) => quotation.id === selectedQuotationId) || null,
    [quotations, selectedQuotationId],
  );

  return (
    <Dialog
      open={open}
      onClose={submitting ? undefined : onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          overflow: "hidden",
          boxShadow: "0 30px 80px rgba(15, 23, 42, 0.18)",
        },
      }}
    >
      <Box
        sx={{
          px: { xs: 2.5, md: 4 },
          py: 2.6,
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Typography sx={{ fontSize: { xs: "1.35rem", md: "1.6rem" }, fontWeight: 800, color: "#1f2937" }}>
          {`Create Project for ${resolveLeadName(lead)}`}
        </Typography>
        <IconButton onClick={onClose} disabled={submitting} sx={{ color: "#52525b" }}>
          <Close />
        </IconButton>
      </Box>

      <DialogContent sx={{ px: { xs: 2.5, md: 4 }, py: { xs: 2.5, md: 3.5 } }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "320px minmax(0, 1fr)" },
            gap: { xs: 3, md: 5 },
            minHeight: { md: 520 },
          }}
        >
          <Stack spacing={1.4}>
            <StepItem active completed label="Step 1  Select Quote" />
            <StepItem label="Step 2  Project Details" completed />
          </Stack>

          <Box sx={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
            <Box sx={{ mb: 3, maxWidth: 520 }}>
              <Typography sx={{ fontSize: { xs: "1.35rem", md: "1.65rem" }, fontWeight: 800, color: "#1f2937", mb: 0.8 }}>
                Select Project Type
              </Typography>
              <Typography sx={{ color: "#64748b", fontSize: "0.98rem", mb: 1.8 }}>
                Choose the project category before converting this lead into a project.
              </Typography>
              <FormControl fullWidth required>
                <InputLabel id="convert-project-type-label">Project Type</InputLabel>
                <Select
                  labelId="convert-project-type-label"
                  value={projectType}
                  label="Project Type"
                  onChange={(event) => setProjectType(event.target.value)}
                  disabled={submitting}
                  sx={{ borderRadius: 2 }}
                >
                  {PROJECT_TYPES.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {quotations.length ? (
              <>
                <Box sx={{ mb: 3 }}>
                  <Typography sx={{ fontSize: { xs: "1.5rem", md: "1.9rem" }, fontWeight: 800, color: "#1f2937" }}>
                    Select a Quote
                  </Typography>
                  <Typography sx={{ mt: 0.6, color: "#64748b", fontSize: "1rem" }}>
                    Choose a quotation to create the project from
                  </Typography>
                </Box>

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
                  <Box
                    sx={{
                      width: 92,
                      height: 92,
                      borderRadius: 4,
                      bgcolor: "#f1f5f9",
                      color: "#6474a4",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <DescriptionOutlined sx={{ fontSize: 42 }} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: { xs: "1.6rem", md: "2rem" }, fontWeight: 800, color: "#1f2937", mb: 1 }}>
                      No Quotations Yet
                    </Typography>
                    <Typography sx={{ color: "#64748b", fontSize: "1rem", lineHeight: 1.8 }}>
                      No quotation found for this lead. You can create one first, or proceed directly to create the project without a quotation.
                    </Typography>
                  </Box>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.6} sx={{ pt: 1 }}>
                    <Button
                      variant="contained"
                      startIcon={<Add />}
                      onClick={onCreateQuotation}
                      disabled={submitting}
                      sx={{
                        minHeight: 56,
                        minWidth: 240,
                        px: 3,
                        borderRadius: 2.5,
                        textTransform: "none",
                        fontWeight: 800,
                        bgcolor: ACCENT,
                        boxShadow: "0 18px 34px rgba(81, 96, 214, 0.24)",
                        "&:hover": { bgcolor: "#4454c9" },
                      }}
                    >
                      Create Quotation
                    </Button>
                    <Button
                      variant="contained"
                      onClick={() => onCreateWithoutQuotation({ projectType })}
                      disabled={submitting || !projectType}
                      sx={{
                        minHeight: 56,
                        minWidth: 270,
                        px: 3,
                        borderRadius: 2.5,
                        textTransform: "none",
                        fontWeight: 800,
                        color: "#475569",
                        bgcolor: "#f8fafc",
                        boxShadow: "0 18px 34px rgba(15, 23, 42, 0.08)",
                        "&:hover": { bgcolor: "#eef2f7" },
                      }}
                    >
                      Create without a quotation
                    </Button>
                  </Stack>
                </Stack>
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
