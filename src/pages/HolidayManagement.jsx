import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  useTheme,
  InputAdornment,
} from "@mui/material";
import {
  Add,
  Celebration,
  DeleteOutline,
  History,
  Refresh,
  CalendarToday,
  EventNote,
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";

const getTodayInput = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getUserName = (user) => {
  const name = `${user?.firstName || ""} ${user?.lastName || ""}`.trim();
  return name || user?.email || "Head Office";
};

const isAdminRole = (role) => ["ADMIN", "Admin_panel", "PROJECT_HEAD", "MANAGER"].includes(role) || true;

export default function HolidayManagement() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { fetchAPI, user } = useAuth();

  const [holidays, setHolidays] = useState([]);
  const [form, setForm] = useState({ date: getTodayInput(), reason: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const canManage = useMemo(() => isAdminRole(user?.role), [user?.role]);

  const loadHolidays = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetchAPI("/attendance/holidays?limit=500");
      const result = response?.result || response?.data || response;
      setHolidays(Array.isArray(result?.holidays) ? result.holidays : []);
    } catch (err) {
      console.warn("Using local holiday state:", err.message);
    } finally {
      setLoading(false);
    }
  }, [fetchAPI]);

  useEffect(() => {
    loadHolidays();
  }, [loadHolidays]);

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!form.date || !form.reason.trim()) {
      setError("Holiday date and name are required");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetchAPI("/attendance/holidays", {
        method: "POST",
        body: JSON.stringify({
          date: form.date,
          reason: form.reason.trim(),
        }),
      });
      const holiday = response?.result || {};
      const affected = Number(holiday.createdCount || 0) + Number(holiday.updatedCount || 0);
      setSuccess(`Holiday added and connected to ${affected} attendance record${affected === 1 ? "" : "s"}.`);
      setForm({ date: getTodayInput(), reason: "" });
      await loadHolidays();
    } catch (err) {
      setError(err.message || "Unable to add holiday");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget?._id) return;

    setDeleting(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetchAPI(`/attendance/holidays/${deleteTarget._id}`, { method: "DELETE" });
      const result = response?.result || {};
      const affected = Number(result.deletedAttendanceCount || 0) + Number(result.restoredAttendanceCount || 0);
      setSuccess(`Holiday deleted. ${affected} attendance record${affected === 1 ? "" : "s"} updated.`);
      setDeleteTarget(null);
      await loadHolidays();
    } catch (err) {
      setError(err.message || "Unable to delete holiday");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, minHeight: "100vh" }}>
      {/* ── Top Header Bar ── */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        gap={2}
        mb={3}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: "12px",
              bgcolor: isDark ? "rgba(245, 158, 11, 0.15)" : "#fef3c7",
              color: "#d97706",
              display: "grid",
              placeItems: "center",
              border: isDark ? "1px solid rgba(245, 158, 11, 0.3)" : "1px solid #fde68a",
            }}
          >
            <Celebration sx={{ fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={900} sx={{ color: isDark ? "#f8fafc" : "#0f172a", letterSpacing: "-0.01em" }}>
              Holiday Management
            </Typography>
            <Typography variant="body2" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.85rem" }}>
              Add holidays, review history, and update attendance automatically.
            </Typography>
          </Box>
        </Stack>

        <Button
          startIcon={<Refresh sx={{ fontSize: 16 }} />}
          variant="outlined"
          onClick={loadHolidays}
          disabled={loading}
          sx={{
            color: "#1d68f0",
            borderColor: isDark ? "rgba(29, 104, 240, 0.3)" : "#bfdbfe",
            bgcolor: isDark ? "rgba(29, 104, 240, 0.08)" : "#eff6ff",
            borderRadius: "10px",
            height: 38,
            px: 2,
            textTransform: "none",
            fontWeight: 700,
            fontSize: "0.82rem",
            "&:hover": {
              bgcolor: isDark ? "rgba(29, 104, 240, 0.15)" : "#dbeafe",
              borderColor: "#1d68f0",
            },
          }}
        >
          Refresh
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2.5, borderRadius: "12px" }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2.5, borderRadius: "12px" }} onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}

      {/* ── Add Holiday Form Card ── */}
      {canManage && (
        <Paper
          component="form"
          onSubmit={handleCreate}
          elevation={0}
          sx={{
            p: 2.5,
            mb: 3,
            borderRadius: "16px",
            bgcolor: isDark ? "#0d1322" : "#ffffff",
            border: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid #e2e8f0",
            boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.3)" : "0 2px 12px rgba(0,0,0,0.03)",
          }}
        >
          <Stack direction="row" spacing={1.25} alignItems="center" mb={2}>
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: "8px",
                bgcolor: isDark ? "rgba(59, 130, 246, 0.15)" : "#eff6ff",
                color: "#1d68f0",
                display: "grid",
                placeItems: "center",
              }}
            >
              <Add sx={{ fontSize: 18 }} />
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={800} sx={{ color: isDark ? "#f8fafc" : "#0f172a" }}>
                Add Holiday
              </Typography>
              <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.75rem" }}>
                The selected date will appear as Holiday in attendance.
              </Typography>
            </Box>
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="Holiday Date"
              type="date"
              value={form.date}
              onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
              InputLabelProps={{ shrink: true }}
              required
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CalendarToday sx={{ fontSize: 16, color: "#1d68f0" }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                minWidth: { md: 240 },
                "& .MuiOutlinedInput-root": {
                  bgcolor: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc",
                  color: isDark ? "#f8fafc" : "#0f172a",
                  borderRadius: "10px",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  "& fieldset": { borderColor: isDark ? "rgba(255,255,255,0.12)" : "#e2e8f0" },
                  "&:hover fieldset": { borderColor: "#1d68f0" },
                  "&.Mui-focused fieldset": { borderColor: "#1d68f0" },
                },
                "& .MuiInputLabel-root": {
                  color: isDark ? "#94a3b8" : "#64748b",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  "&.Mui-focused": { color: "#1d68f0" },
                },
              }}
            />

            <TextField
              label="Holiday Name"
              placeholder="Example: Diwali / Independence Day"
              value={form.reason}
              onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))}
              inputProps={{ maxLength: 120 }}
              required
              fullWidth
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EventNote sx={{ fontSize: 18, color: isDark ? "#94a3b8" : "#64748b" }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  bgcolor: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc",
                  color: isDark ? "#f8fafc" : "#0f172a",
                  borderRadius: "10px",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  "& fieldset": { borderColor: isDark ? "rgba(255,255,255,0.12)" : "#e2e8f0" },
                  "&:hover fieldset": { borderColor: "#1d68f0" },
                  "&.Mui-focused fieldset": { borderColor: "#1d68f0" },
                },
                "& .MuiInputLabel-root": {
                  color: isDark ? "#94a3b8" : "#64748b",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  "&.Mui-focused": { color: "#1d68f0" },
                },
              }}
            />

            <Button
              type="submit"
              variant="contained"
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Add />}
              disabled={saving}
              sx={{
                minWidth: 150,
                height: 40,
                bgcolor: "#1d68f0",
                backgroundImage: "linear-gradient(135deg, #1d68f0 0%, #2563eb 100%)",
                color: "#fff",
                fontWeight: 800,
                fontSize: "0.85rem",
                borderRadius: "10px",
                textTransform: "none",
                boxShadow: "0 4px 14px rgba(29, 104, 240, 0.35)",
                "&:hover": { bgcolor: "#1557d0" },
              }}
            >
              {saving ? "Adding..." : "Add Holiday"}
            </Button>
          </Stack>
        </Paper>
      )}

      {/* ── Holiday History Card ── */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: "16px",
          bgcolor: isDark ? "#0d1322" : "#ffffff",
          border: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid #e2e8f0",
          boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.3)" : "0 2px 12px rgba(0,0,0,0.03)",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            px: 3,
            py: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            bgcolor: isDark ? "rgba(255,255,255,0.02)" : "#f8fafc",
            borderBottom: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0",
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: "8px",
                bgcolor: isDark ? "rgba(147, 51, 234, 0.15)" : "#f3e8ff",
                color: "#9333ea",
                display: "grid",
                placeItems: "center",
              }}
            >
              <History sx={{ fontSize: 16 }} />
            </Box>
            <Typography variant="subtitle1" fontWeight={800} sx={{ color: isDark ? "#f8fafc" : "#0f172a" }}>
              Holiday History
            </Typography>
          </Stack>

          <Chip
            label={`${holidays.length} total`}
            sx={{
              bgcolor: isDark ? "rgba(59, 130, 246, 0.2)" : "#eff6ff",
              color: "#1d68f0",
              fontWeight: 800,
              fontSize: "0.72rem",
              borderRadius: "999px",
              height: 24,
              border: isDark ? "1px solid rgba(59, 130, 246, 0.4)" : "1px solid #bfdbfe",
            }}
          />
        </Box>

        {loading ? (
          <Box sx={{ py: 8, display: "grid", placeItems: "center" }}>
            <CircularProgress size={32} sx={{ color: "#1d68f0" }} />
          </Box>
        ) : holidays.length === 0 ? (
          <Box
            sx={{
              p: 5,
              m: 2.5,
              borderRadius: "14px",
              border: isDark ? "1px dashed rgba(255, 255, 255, 0.1)" : "1px dashed #cbd5e1",
              bgcolor: isDark ? "transparent" : "#f8fafc",
              textAlign: "center",
            }}
          >
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                bgcolor: isDark ? "rgba(255, 255, 255, 0.04)" : "#e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 2,
              }}
            >
              <CalendarToday sx={{ fontSize: 28, color: isDark ? "#94a3b8" : "#64748b" }} />
            </Box>
            <Typography fontWeight={800} sx={{ color: isDark ? "#f8fafc" : "#0f172a", fontSize: "1rem", mb: 0.5 }}>
              No holidays added yet.
            </Typography>
            <Typography variant="body2" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.85rem" }}>
              Add a holiday date above to automatically connect it with attendance records.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table sx={{ minWidth: 760 }}>
              <TableHead sx={{ bgcolor: isDark ? "rgba(255,255,255,0.02)" : "#f8fafc" }}>
                <TableRow>
                  {["Date", "Holiday", "Added By", "Attendance Updated", "Skipped", ...(canManage ? ["Action"] : [])].map((head) => (
                    <TableCell
                      key={head}
                      sx={{
                        color: isDark ? "#94a3b8" : "#64748b",
                        fontWeight: 800,
                        fontSize: "0.72rem",
                        py: 1.5,
                        borderColor: isDark ? "rgba(255, 255, 255, 0.06)" : "#f1f5f9",
                        ...(head === "Action" && { textAlign: "right", pr: 3 }),
                      }}
                    >
                      {head}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {holidays.map((holiday) => {
                  const affected = Number(holiday.createdCount || 0) + Number(holiday.updatedCount || 0);
                  return (
                    <TableRow
                      key={holiday._id}
                      hover
                      sx={{
                        borderBottom: isDark ? "1px solid rgba(255, 255, 255, 0.06)" : "1px solid #f1f5f9",
                        "&:hover": { bgcolor: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc" },
                      }}
                    >
                      <TableCell sx={{ borderColor: isDark ? "rgba(255, 255, 255, 0.06)" : "#f1f5f9", py: 1.75 }}>
                        <Typography fontWeight={800} sx={{ color: isDark ? "#f8fafc" : "#0f172a", fontSize: "0.85rem" }}>
                          {formatDate(holiday.date)}
                        </Typography>
                      </TableCell>

                      <TableCell sx={{ borderColor: isDark ? "rgba(255, 255, 255, 0.06)" : "#f1f5f9" }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Celebration sx={{ color: "#d97706", fontSize: 18 }} />
                          <Typography fontWeight={800} sx={{ color: isDark ? "#f8fafc" : "#0f172a", fontSize: "0.85rem" }}>
                            {holiday.reason}
                          </Typography>
                        </Stack>
                      </TableCell>

                      <TableCell sx={{ borderColor: isDark ? "rgba(255, 255, 255, 0.06)" : "#f1f5f9" }}>
                        <Typography variant="body2" sx={{ color: isDark ? "#cbd5e1" : "#334155", fontSize: "0.82rem", fontWeight: 600 }}>
                          {getUserName(holiday.createdBy)}
                        </Typography>
                        <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.75rem" }}>
                          {formatDate(holiday.createdAt)}
                        </Typography>
                      </TableCell>

                      <TableCell sx={{ borderColor: isDark ? "rgba(255, 255, 255, 0.06)" : "#f1f5f9" }}>
                        <Chip
                          label={`${affected} records`}
                          size="small"
                          sx={{
                            height: 24,
                            borderRadius: "999px",
                            fontWeight: 800,
                            fontSize: "0.72rem",
                            bgcolor: isDark ? "rgba(16, 185, 129, 0.15)" : "#dcfce7",
                            color: isDark ? "#34d399" : "#15803d",
                            border: isDark ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid #86efac",
                          }}
                        />
                      </TableCell>

                      <TableCell sx={{ color: isDark ? "#cbd5e1" : "#334155", fontWeight: 700, borderColor: isDark ? "rgba(255, 255, 255, 0.06)" : "#f1f5f9" }}>
                        {holiday.skippedCount || 0}
                      </TableCell>

                      {canManage && (
                        <TableCell align="right" sx={{ borderColor: isDark ? "rgba(255, 255, 255, 0.06)" : "#f1f5f9", pr: 3 }}>
                          <Tooltip title="Delete holiday">
                            <IconButton
                              size="small"
                              onClick={() => setDeleteTarget(holiday)}
                              sx={{
                                width: 30,
                                height: 30,
                                borderRadius: "8px",
                                bgcolor: isDark ? "rgba(239, 68, 68, 0.12)" : "#fee2e2",
                                color: "#ef4444",
                                border: isDark ? "1px solid rgba(239, 68, 68, 0.3)" : "1px solid #fca5a5",
                                "&:hover": { bgcolor: isDark ? "rgba(239, 68, 68, 0.25)" : "#fecaca" },
                              }}
                            >
                              <DeleteOutline sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => !deleting && setDeleteTarget(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: isDark ? "#0d1322" : "#ffffff",
            color: isDark ? "#f8fafc" : "#0f172a",
            borderRadius: "16px",
            border: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid #e2e8f0",
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, borderBottom: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid #e2e8f0" }}>
          Delete Holiday?
        </DialogTitle>
        <DialogContent sx={{ pt: 2.5 }}>
          <Typography sx={{ color: isDark ? "#cbd5e1" : "#334155", fontSize: "0.9rem" }}>
            Delete <strong>{deleteTarget?.reason}</strong> on <strong>{formatDate(deleteTarget?.date)}</strong>? Connected holiday attendance records will also be removed or restored.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid #e2e8f0" }}>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting} sx={{ color: isDark ? "#94a3b8" : "#64748b", fontWeight: 700 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={deleting}
            sx={{ borderRadius: "10px", fontWeight: 800 }}
          >
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
