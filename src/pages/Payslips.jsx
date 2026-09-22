import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  Breadcrumbs,
  Link,
  Pagination,
  useTheme,
  Alert,
} from "@mui/material";
import {
  Search,
  Visibility,
  FileDownload,
  CalendarToday,
  AccountBalanceWallet,
  ArrowForward,
  Lock,
  HourglassEmpty,
  Print,
  CheckCircle,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { toast } from "../components/useToast.jsx";
import SalarySlipModal from "../components/SalarySlipDocument";
import {
  PAYROLL_STATUS,
  SLIP_STATUS,
  getMonthlySalarySlips,
  getAvailablePayrollMonths,
  getCurrentPayrollMonth,
} from "../utils/payrollWorkflowStorage";

const DEPARTMENTS = [
  "All Roles",
  "Manager",
  "Supervisor",
  "Incharge",
];

export default function Payslips() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const navigate = useNavigate();

  // Dynamic available months up to current month (no future months)
  const monthOptions = useMemo(() => getAvailablePayrollMonths(12), []);
  const initialMonth = monthOptions[0] || getCurrentPayrollMonth();

  // ─── Filter States ──────────────────────────────────────────────────
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("All Roles");
  const [page, setPage] = useState(1);
  const rowsPerPage = 8;

  // ─── Data & Modal States ────────────────────────────────────────────
  const [slipsData, setSlipsData] = useState(() => getMonthlySalarySlips(initialMonth));
  const [previewSlip, setPreviewSlip] = useState(null);

  // Sync with storage on month change or cross-tab finalization
  const loadSlips = useCallback((month) => {
    const data = getMonthlySalarySlips(month);
    setSlipsData(data);
  }, []);

  useEffect(() => {
    loadSlips(selectedMonth);

    const handleStorage = () => {
      loadSlips(selectedMonth);
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [selectedMonth, loadSlips]);

  const isPayrollFinalized = slipsData.finalized;
  // Only display salary slips if payroll has been finalized / generated
  const rawSlips = isPayrollFinalized ? (slipsData.slips || []) : [];

  // ─── Filtered Slips ─────────────────────────────────────────────────
  const filteredSlips = useMemo(() => {
    return rawSlips.filter((item) => {
      const matchesSearch =
        !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.empId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.department.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDept =
        selectedDept === "All Roles" || item.department === selectedDept;

      return matchesSearch && matchesDept;
    });
  }, [rawSlips, searchQuery, selectedDept]);

  // Metric Totals
  const totalSlipsCount = rawSlips.length;
  const totalGrossSum = useMemo(() => rawSlips.reduce((acc, curr) => acc + (Number(curr.gross) || 0), 0), [rawSlips]);
  const totalDeductionsSum = useMemo(() => rawSlips.reduce((acc, curr) => acc + (Number(curr.deductions) || 0), 0), [rawSlips]);
  const totalNetSum = useMemo(() => rawSlips.reduce((acc, curr) => acc + (Number(curr.netPay) || 0), 0), [rawSlips]);

  // Pagination Slice
  const pageCount = Math.max(1, Math.ceil(filteredSlips.length / rowsPerPage));
  const displayedSlips = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filteredSlips.slice(start, start + rowsPerPage);
  }, [filteredSlips, page, rowsPerPage]);

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, minHeight: "100vh" }}>
      {/* ── 1. HEADER & BREADCRUMBS ──────────────────────────────────── */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 2 }}>
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
              <Typography variant="h5" fontWeight={900} sx={{ color: isDark ? "#f8fafc" : "#0f172a", letterSpacing: "-0.02em" }}>
                Salary Slips
              </Typography>
              <Chip
                label={isPayrollFinalized ? "GENERATED" : "PENDING FINALIZATION"}
                size="small"
                sx={{
                  fontWeight: 800,
                  fontSize: "0.74rem",
                  bgcolor: isPayrollFinalized
                    ? isDark ? "rgba(16, 185, 129, 0.15)" : "#f0fdf4"
                    : isDark ? "rgba(245, 158, 11, 0.15)" : "#fef3c7",
                  color: isPayrollFinalized
                    ? isDark ? "#34d399" : "#15803d"
                    : isDark ? "#fbbf24" : "#b45309",
                  border: isPayrollFinalized
                    ? "1px solid rgba(16, 185, 129, 0.3)"
                    : "1px solid rgba(245, 158, 11, 0.3)",
                }}
              />
            </Box>

            <Typography variant="body2" sx={{ color: isDark ? "#94a3b8" : "#64748b" }}>
              View and download employee salary slips for each finalized payroll month.
            </Typography>

            <Breadcrumbs sx={{ mt: 0.75, "& .MuiBreadcrumbs-separator": { color: isDark ? "#64748b" : "#94a3b8", fontSize: "0.75rem" } }}>
              <Link
                underline="hover"
                color="inherit"
                onClick={() => navigate("/dashboard")}
                sx={{ fontSize: "0.78rem", cursor: "pointer", color: isDark ? "#94a3b8" : "#64748b" }}
              >
                Home
              </Link>
              <Link
                underline="hover"
                color="inherit"
                onClick={() => navigate("/payroll")}
                sx={{ fontSize: "0.78rem", cursor: "pointer", color: isDark ? "#94a3b8" : "#64748b" }}
              >
                Payroll
              </Link>
              <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: "#1d68f0" }}>
                Salary Slips
              </Typography>
            </Breadcrumbs>
          </Box>

          {/* Month Selector */}
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Select
              size="small"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              startAdornment={<CalendarToday sx={{ fontSize: 16, mr: 1, color: "#1d68f0" }} />}
              sx={{
                borderRadius: "10px",
                fontSize: "0.85rem",
                fontWeight: 700,
                bgcolor: isDark ? "#0d1322" : "#ffffff",
                border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e2e8f0",
                "& .MuiSelect-select": { py: 1, pr: 3 },
              }}
            >
              {monthOptions.map((m) => (
                <MenuItem key={m} value={m} sx={{ fontSize: "0.85rem", fontWeight: 600 }}>
                  {m}
                </MenuItem>
              ))}
            </Select>
          </Stack>
        </Box>
      </Box>

      {/* ── 2. PAYROLL STATUS NOTIFICATION BANNER ────────────────────── */}
      {!isPayrollFinalized && (
        <Alert
          severity="info"
          sx={{
            mb: 3,
            borderRadius: "12px",
            bgcolor: isDark ? "rgba(59, 130, 246, 0.1)" : "#eff6ff",
            border: "1px solid #bfdbfe",
            "& .MuiAlert-message": { fontSize: "0.85rem", fontWeight: 600 },
          }}
        >
          Salary slips for {selectedMonth} will appear here automatically once the payroll is finalized.
        </Alert>
      )}

      {/* ── 3. STAT CARDS ────────────────────────────────────────────── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 2.2, borderRadius: "16px", bgcolor: isDark ? "#0d1322" : "#f0f7ff", border: isDark ? "1px solid rgba(59,130,246,0.2)" : "1px solid #dbeafe" }}>
            <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontWeight: 600 }}>Total Slips</Typography>
            <Typography variant="h6" fontWeight={900} sx={{ color: isDark ? "#f8fafc" : "#0f172a" }}>{totalSlipsCount}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 2.2, borderRadius: "16px", bgcolor: isDark ? "#0d1322" : "#ffffff", border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0" }}>
            <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontWeight: 600 }}>Gross Disbursed</Typography>
            <Typography variant="h6" fontWeight={900} sx={{ color: isDark ? "#f8fafc" : "#0f172a" }}>₹ {totalGrossSum.toLocaleString("en-IN")}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 2.2, borderRadius: "16px", bgcolor: isDark ? "#0d1322" : "#ffffff", border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0" }}>
            <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontWeight: 600 }}>Total Deductions</Typography>
            <Typography variant="h6" fontWeight={900} sx={{ color: "#dc2626" }}>₹ {totalDeductionsSum.toLocaleString("en-IN")}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 2.2, borderRadius: "16px", bgcolor: isDark ? "#0d1322" : "#ffffff", border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0" }}>
            <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontWeight: 600 }}>Total Net Pay</Typography>
            <Typography variant="h6" fontWeight={900} sx={{ color: "#16a34a" }}>₹ {totalNetSum.toLocaleString("en-IN")}</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* ── 4. SEARCH & FILTERS BAR ──────────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          borderRadius: "16px",
          bgcolor: isDark ? "#0d1322" : "#ffffff",
          border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <TextField
          size="small"
          placeholder="Search employee name, ID, role..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(1);
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: isDark ? "#64748b" : "#94a3b8", fontSize: 20 }} />
              </InputAdornment>
            ),
          }}
          sx={{
            minWidth: { xs: "100%", sm: 320 },
            "& .MuiOutlinedInput-root": { borderRadius: "10px", fontSize: "0.85rem" },
          }}
        />

        <Select
          size="small"
          value={selectedDept}
          onChange={(e) => {
            setSelectedDept(e.target.value);
            setPage(1);
          }}
          sx={{ borderRadius: "10px", fontSize: "0.82rem", fontWeight: 600, minWidth: 140 }}
        >
          {DEPARTMENTS.map((d) => (
            <MenuItem key={d} value={d} sx={{ fontSize: "0.82rem" }}>
              {d}
            </MenuItem>
          ))}
        </Select>
      </Paper>

      {/* ── 5. SALARY SLIPS TABLE ────────────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: "16px",
          bgcolor: isDark ? "#0d1322" : "#ffffff",
          border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0",
          overflow: "hidden",
        }}
      >
        <TableContainer>
          <Table sx={{ minWidth: 700 }}>
            <TableHead sx={{ bgcolor: isDark ? "rgba(255,255,255,0.02)" : "#f8fafc" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, fontSize: "0.8rem", color: isDark ? "#94a3b8" : "#475569" }}>
                  EMPLOYEE
                </TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: "0.8rem", color: isDark ? "#94a3b8" : "#475569" }}>
                  EMPLOYEE ID
                </TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: "0.8rem", color: isDark ? "#94a3b8" : "#475569" }}>
                  MONTH
                </TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: "0.8rem", color: isDark ? "#94a3b8" : "#475569" }}>
                  GROSS SALARY
                </TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: "0.8rem", color: isDark ? "#94a3b8" : "#475569" }}>
                  DEDUCTIONS
                </TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: "0.8rem", color: isDark ? "#94a3b8" : "#475569" }}>
                  NET PAY
                </TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: "0.8rem", color: isDark ? "#94a3b8" : "#475569" }}>
                  STATUS
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, fontSize: "0.8rem", color: isDark ? "#94a3b8" : "#475569" }}>
                  ACTIONS
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {displayedSlips.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <Typography variant="body2" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontWeight: 600 }}>
                      {!isPayrollFinalized
                        ? `No salary slips generated for ${selectedMonth} yet. Salary slips will appear here once finalized in Payroll.`
                        : `No salary slip records found for ${selectedMonth}.`}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                displayedSlips.map((row) => (
                  <TableRow key={row.id || row.empId} hover>
                    {/* Employee */}
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Avatar
                          sx={{
                            bgcolor: row.avatarBg || "#dbeafe",
                            color: row.avatarColor || "#1d4ed8",
                            fontWeight: 800,
                            fontSize: "0.8rem",
                            width: 36,
                            height: 36,
                          }}
                        >
                          {row.initials || row.name?.[0] || "E"}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight={800} sx={{ color: isDark ? "#f8fafc" : "#0f172a", lineHeight: 1.2 }}>
                            {row.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b" }}>
                            {row.designation || row.department}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    {/* Employee ID */}
                    <TableCell>
                      <Typography variant="body2" fontWeight={700} sx={{ fontFamily: "monospace", color: isDark ? "#cbd5e1" : "#334155" }}>
                        {row.empId}
                      </Typography>
                    </TableCell>

                    {/* Month */}
                    <TableCell>
                      <Typography variant="body2" sx={{ color: isDark ? "#cbd5e1" : "#334155", fontWeight: 600 }}>
                        {row.month || selectedMonth}
                      </Typography>
                    </TableCell>

                    {/* Gross */}
                    <TableCell>
                      <Typography variant="body2" fontWeight={700} sx={{ color: isDark ? "#f8fafc" : "#0f172a" }}>
                        ₹ {Number(row.gross || 0).toLocaleString("en-IN")}
                      </Typography>
                    </TableCell>

                    {/* Deductions */}
                    <TableCell>
                      <Typography variant="body2" fontWeight={700} sx={{ color: "#dc2626" }}>
                        ₹ {Number(row.deductions || 0).toLocaleString("en-IN")}
                      </Typography>
                    </TableCell>

                    {/* Net Pay */}
                    <TableCell>
                      <Typography variant="body2" fontWeight={900} sx={{ color: "#16a34a" }}>
                        ₹ {Number(row.netPay || 0).toLocaleString("en-IN")}
                      </Typography>
                    </TableCell>

                    {/* Slip Status */}
                    <TableCell>
                      {row.status === SLIP_STATUS.GENERATED && isPayrollFinalized ? (
                        <Chip
                          label="Generated"
                          size="small"
                          sx={{
                            fontWeight: 800,
                            fontSize: "0.75rem",
                            bgcolor: isDark ? "rgba(16, 185, 129, 0.15)" : "#f0fdf4",
                            color: isDark ? "#34d399" : "#15803d",
                            border: "1px solid rgba(16, 185, 129, 0.3)",
                          }}
                        />
                      ) : row.status === SLIP_STATUS.NEEDS_REGENERATION ? (
                        <Chip
                          label="Needs Regeneration"
                          size="small"
                          sx={{
                            fontWeight: 800,
                            fontSize: "0.75rem",
                            bgcolor: isDark ? "rgba(244, 63, 94, 0.15)" : "#fff1f2",
                            color: isDark ? "#fb7185" : "#e11d48",
                            border: "1px solid rgba(244, 63, 94, 0.3)",
                          }}
                        />
                      ) : (
                        <Chip
                          label="Not Generated"
                          size="small"
                          sx={{
                            fontWeight: 700,
                            fontSize: "0.75rem",
                            bgcolor: isDark ? "rgba(245, 158, 11, 0.15)" : "#fef3c7",
                            color: isDark ? "#fbbf24" : "#b45309",
                            border: "1px solid rgba(245, 158, 11, 0.3)",
                          }}
                        />
                      )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<Visibility sx={{ fontSize: 16 }} />}
                          onClick={() => setPreviewSlip(row)}
                          sx={{
                            borderRadius: "8px",
                            textTransform: "none",
                            fontWeight: 700,
                            fontSize: "0.78rem",
                            py: 0.3,
                            px: 1.2,
                            borderColor: isDark ? "rgba(255,255,255,0.15)" : "#cbd5e1",
                            color: isDark ? "#f8fafc" : "#0f172a",
                          }}
                        >
                          View
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<FileDownload sx={{ fontSize: 16 }} />}
                          onClick={() => setPreviewSlip(row)}
                          sx={{
                            borderRadius: "8px",
                            textTransform: "none",
                            fontWeight: 700,
                            fontSize: "0.78rem",
                            py: 0.3,
                            px: 1.2,
                            bgcolor: "#1d68f0",
                            "&:hover": { bgcolor: "#1557d0" },
                          }}
                        >
                          Download
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <Box sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
          <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b" }}>
            Showing {displayedSlips.length} of {filteredSlips.length} salary slips
          </Typography>
          <Pagination
            count={pageCount}
            page={page}
            onChange={(_, newPage) => setPage(newPage)}
            color="primary"
            size="small"
            shape="rounded"
          />
        </Box>
      </Paper>

      {/* ── 6. SALARY SLIP PREVIEW & PDF DOWNLOAD MODAL ──────────────── */}
      <SalarySlipModal
        open={Boolean(previewSlip)}
        onClose={() => setPreviewSlip(null)}
        slipData={previewSlip}
      />
    </Box>
  );
}
