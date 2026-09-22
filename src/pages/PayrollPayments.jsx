import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Chip,
  FormControl,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import {
  AccountBalance,
  CheckCircleOutline,
  ErrorOutline,
  HourglassEmpty,
  Paid,
  Search,
} from "@mui/icons-material";
import axiosInstance from "../utils/axiosConfig";

const formatMoney = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const getName = (user) =>
  [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() || user?.email || "Employee";

const getInitials = (name) => {
  if (!name || name === "Employee") return "EM";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

/* ─── Stat Card Component ──────────────────────────────────────────────────── */
function StatCard({ icon: Icon, value, label, tone = "blue", isDark }) {
  const colors = {
    blue: {
      main: "#2563eb",
      bgDark: "rgba(37, 99, 235, 0.12)",
      bgLight: "#f0f6ff",
      borderDark: "rgba(59, 130, 246, 0.35)",
      borderLight: "#bfdbfe",
      iconBgDark: "rgba(59, 130, 246, 0.25)",
      iconBgLight: "#dbeafe",
      iconColor: "#2563eb",
      textDark: "#93c5fd",
      textLight: "#1d4ed8",
    },
    green: {
      main: "#16a34a",
      bgDark: "rgba(22, 163, 74, 0.12)",
      bgLight: "#f0fdf4",
      borderDark: "rgba(34, 197, 94, 0.25)",
      borderLight: "#bbf7d0",
      iconBgDark: "rgba(34, 197, 94, 0.25)",
      iconBgLight: "#dcfce7",
      iconColor: "#16a34a",
      textDark: "#86efac",
      textLight: "#15803d",
    },
    amber: {
      main: "#d97706",
      bgDark: "rgba(217, 119, 6, 0.12)",
      bgLight: "#fffbeb",
      borderDark: "rgba(245, 158, 11, 0.3)",
      borderLight: "#fde68a",
      iconBgDark: "rgba(245, 158, 11, 0.25)",
      iconBgLight: "#fef3c7",
      iconColor: "#d97706",
      textDark: "#fde047",
      textLight: "#b45309",
    },
    red: {
      main: "#dc2626",
      bgDark: "rgba(220, 38, 38, 0.12)",
      bgLight: "#fef2f2",
      borderDark: "rgba(239, 68, 68, 0.3)",
      borderLight: "#fecaca",
      iconBgDark: "rgba(239, 68, 68, 0.25)",
      iconBgLight: "#fee2e2",
      iconColor: "#dc2626",
      textDark: "#fca5a5",
      textLight: "#b91c1c",
    },
  };

  const c = colors[tone] || colors.blue;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.2,
        borderRadius: 3,
        bgcolor: isDark ? c.bgDark : c.bgLight,
        border: `1px solid ${isDark ? c.borderDark : c.borderLight}`,
        transition: "all 0.25s ease-in-out",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: isDark
            ? `0 8px 24px ${alpha(c.main, 0.25)}`
            : `0 8px 20px ${alpha(c.main, 0.15)}`,
        },
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center">
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: isDark ? c.iconBgDark : c.iconBgLight,
            color: isDark ? c.textDark : c.iconColor,
            flexShrink: 0,
          }}
        >
          <Icon sx={{ fontSize: 26 }} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="h4"
            fontWeight={900}
            sx={{
              lineHeight: 1,
              color: isDark ? "#ffffff" : "#0f172a",
              fontSize: { xs: "1.6rem", md: "1.85rem" },
            }}
          >
            {value}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              mt: 0.6,
              fontWeight: 600,
              color: isDark ? c.textDark : c.textLight,
            }}
          >
            {label}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

/* ─── Main Component ───────────────────────────────────────────────────────── */
export default function PayrollPayments() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  // Design tokens
  const bgMain = isDark ? "#090d16" : "#f8fafc";
  const bgCard = isDark ? "rgba(15, 23, 42, 0.75)" : "#ffffff";
  const bgSubtle = isDark ? "rgba(30, 41, 59, 0.5)" : "#f1f5f9";
  const borderCol = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)";
  const textPrimary = isDark ? "#f8fafc" : "#0f172a";
  const textSecondary = isDark ? "#94a3b8" : "#64748b";

  const [summary, setSummary] = useState({});
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    axiosInstance
      .get("/payroll/payments")
      .then(({ data }) => {
        setSummary(data.result?.summary || {});
        setPayments(data.result?.payments || []);
      })
      .catch(() => {
        setSummary({});
        setPayments([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return payments.filter((row) => {
      const name = getName(row.employee).toLowerCase();
      const txn = String(row.transactionId || "").toLowerCase();
      const method = String(row.paymentMethod || "").toLowerCase();
      const term = search.trim().toLowerCase();
      const matchesSearch =
        !term || name.includes(term) || txn.includes(term) || method.includes(term);
      const matchesStatus =
        statusFilter === "ALL" || row.paymentStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [payments, search, statusFilter]);

  const getStatusChipProps = (status) => {
    switch (status) {
      case "PAID":
        return { color: "success", icon: <CheckCircleOutline sx={{ fontSize: 16 }} /> };
      case "FAILED":
        return { color: "error", icon: <ErrorOutline sx={{ fontSize: 16 }} /> };
      case "PROCESSING":
        return { color: "info", icon: <HourglassEmpty sx={{ fontSize: 16 }} /> };
      default:
        return { color: "warning", icon: <HourglassEmpty sx={{ fontSize: 16 }} /> };
    }
  };

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 3, md: 3.5 },
        bgcolor: bgMain,
        minHeight: "100vh",
        color: textPrimary,
        transition: "background-color 0.3s ease, color 0.3s ease",
      }}
    >
      {/* ── HEADER ────────────────────────────────────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 3 },
          mb: 3,
          borderRadius: 3.5,
          bgcolor: bgCard,
          border: `1px solid ${borderCol}`,
          backdropFilter: "blur(12px)",
          boxShadow: isDark
            ? "0 10px 30px rgba(0, 0, 0, 0.3)"
            : "0 10px 30px rgba(0, 0, 0, 0.04)",
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          alignItems={{ xs: "flex-start", md: "center" }}
          justifyContent="space-between"
          spacing={2.5}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.15),
                color: theme.palette.primary.main,
                width: 48,
                height: 48,
                borderRadius: 2.5,
              }}
            >
              <AccountBalance sx={{ fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography
                variant="h4"
                fontWeight={900}
                sx={{
                  letterSpacing: "-0.02em",
                  background: isDark
                    ? "linear-gradient(135deg, #ffffff 0%, #94a3b8 100%)"
                    : "linear-gradient(135deg, #0f172a 0%, #334155 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Payments
              </Typography>
              <Typography variant="body2" sx={{ color: textSecondary, fontWeight: 500 }}>
                Track payroll payment status, transaction references, and disbursement history
              </Typography>
            </Box>
          </Stack>
        </Stack>
      </Paper>

      {/* ── ERROR ALERT ───────────────────────────────────────────────────────── */}
      {error && (
        <Alert
          severity="error"
          onClose={() => setError("")}
          sx={{ mb: 3, borderRadius: 2.5, fontWeight: 600 }}
        >
          {error}
        </Alert>
      )}

      {/* ── STAT CARDS ────────────────────────────────────────────────────────── */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
            lg: "repeat(4, minmax(0, 1fr))",
          },
          gap: 2.5,
          mb: 3,
        }}
      >
        <StatCard
          icon={Paid}
          value={formatMoney(summary.totalPayroll)}
          label="Total Payroll"
          tone="blue"
          isDark={isDark}
        />
        <StatCard
          icon={CheckCircleOutline}
          value={summary.paid || 0}
          label="Paid"
          tone="green"
          isDark={isDark}
        />
        <StatCard
          icon={HourglassEmpty}
          value={summary.pending || 0}
          label="Pending"
          tone="amber"
          isDark={isDark}
        />
        <StatCard
          icon={ErrorOutline}
          value={summary.failed || 0}
          label="Failed"
          tone="red"
          isDark={isDark}
        />
      </Box>

      {/* ── SEARCH & FILTER BAR ───────────────────────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 3,
          bgcolor: bgCard,
          border: `1px solid ${borderCol}`,
          backdropFilter: "blur(12px)",
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          alignItems={{ xs: "stretch", sm: "center" }}
        >
          <TextField
            size="small"
            placeholder="Search by employee, transaction ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: textSecondary, fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
            sx={{
              minWidth: { xs: "100%", sm: 300 },
              "& .MuiOutlinedInput-root": {
                borderRadius: 2.5,
                bgcolor: bgSubtle,
                "& fieldset": { borderColor: borderCol },
              },
            }}
          />
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              sx={{
                borderRadius: 2.5,
                bgcolor: bgSubtle,
                fontWeight: 600,
                "& .MuiOutlinedInput-notchedOutline": { borderColor: borderCol },
              }}
            >
              <MenuItem value="ALL">All Status</MenuItem>
              <MenuItem value="PAID">Paid</MenuItem>
              <MenuItem value="PENDING">Pending</MenuItem>
              <MenuItem value="PROCESSING">Processing</MenuItem>
              <MenuItem value="FAILED">Failed</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      {/* ── TABLE ─────────────────────────────────────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          bgcolor: bgCard,
          border: `1px solid ${borderCol}`,
          overflow: "hidden",
          backdropFilter: "blur(12px)",
          boxShadow: isDark
            ? "0 10px 30px rgba(0, 0, 0, 0.3)"
            : "0 10px 30px rgba(0, 0, 0, 0.04)",
        }}
      >
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow
                sx={{
                  bgcolor: isDark ? "rgba(30, 41, 59, 0.6)" : "#f8fafc",
                  "& .MuiTableCell-head": {
                    fontWeight: 800,
                    fontSize: "0.8rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: textSecondary,
                    borderBottom: `1px solid ${borderCol}`,
                    py: 1.8,
                  },
                }}
              >
                <TableCell>Employee</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Payment Date</TableCell>
                <TableCell>Payment Method</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Transaction ID</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <Typography color={textSecondary} fontWeight={600}>
                      Loading payments...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <Avatar
                      sx={{
                        width: 56,
                        height: 56,
                        mx: "auto",
                        mb: 1.5,
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        color: theme.palette.primary.main,
                      }}
                    >
                      <AccountBalance sx={{ fontSize: 28 }} />
                    </Avatar>
                    <Typography fontWeight={800} color={textPrimary}>
                      No payments found
                    </Typography>
                    <Typography variant="body2" color={textSecondary} sx={{ mt: 0.5 }}>
                      {search || statusFilter !== "ALL"
                        ? "No payments match your search or filter criteria."
                        : "Payments will appear here after payroll is processed."}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((row) => {
                  const name = getName(row.employee);
                  const chipProps = getStatusChipProps(row.paymentStatus);
                  return (
                    <TableRow
                      key={row._id}
                      sx={{
                        transition: "background-color 0.15s ease",
                        "&:hover": {
                          bgcolor: isDark ? "rgba(59, 130, 246, 0.06)" : "rgba(37, 99, 235, 0.04)",
                        },
                        "& .MuiTableCell-root": {
                          borderBottom: `1px solid ${borderCol}`,
                          py: 1.6,
                        },
                      }}
                    >
                      <TableCell>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Avatar
                            sx={{
                              width: 36,
                              height: 36,
                              fontSize: "0.8rem",
                              fontWeight: 800,
                              bgcolor: isDark ? "rgba(59, 130, 246, 0.2)" : "#dbeafe",
                              color: isDark ? "#93c5fd" : "#2563eb",
                            }}
                          >
                            {getInitials(name)}
                          </Avatar>
                          <Box>
                            <Typography fontWeight={800} fontSize="0.875rem" color={textPrimary}>
                              {name}
                            </Typography>
                            <Typography variant="caption" color={textSecondary}>
                              {row.employee?.role || "-"}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography fontWeight={900} fontSize="0.95rem" color={textPrimary}>
                          {formatMoney(row.amount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography fontWeight={600} fontSize="0.85rem" color={textSecondary}>
                          {formatDate(row.paymentDate)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          variant="outlined"
                          label={row.paymentMethod || "-"}
                          sx={{
                            fontWeight: 700,
                            fontSize: "0.75rem",
                            borderRadius: 2,
                            borderColor: borderCol,
                            color: textPrimary,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          icon={chipProps.icon}
                          label={row.paymentStatus || "PENDING"}
                          color={chipProps.color}
                          sx={{
                            fontWeight: 800,
                            fontSize: "0.7rem",
                            letterSpacing: "0.04em",
                            borderRadius: 2,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography
                          fontWeight={600}
                          fontSize="0.8rem"
                          sx={{
                            color: textSecondary,
                            fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                            letterSpacing: "0.02em",
                          }}
                        >
                          {row.transactionId || "-"}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
