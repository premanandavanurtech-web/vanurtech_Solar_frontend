import React, { useState, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Stack,
  Typography,
  Button,
  TextField,
  IconButton,
  Grid,
  Divider,
  Paper,
  Chip,
  CircularProgress,
  useTheme,
  alpha,
  InputAdornment,
} from "@mui/material";
import {
  Close,
  Search,
  QrCodeScanner,
  CheckCircle,
  PersonOutline,
  TaskAlt,
  Inventory2,
  CalendarMonth,
  OpenInNew,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosConfig";

const BLUE = "#3b82f6";
const INDIGO = "#6366f1";
const SUCCESS = "#10b981";
const WARNING = "#f59e0b";

export default function SerialTraceabilityModal({
  open,
  onClose,
  initialSerial = "",
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const navigate = useNavigate();

  const [serialQuery, setSerialQuery] = useState(initialSerial || "");
  const [loading, setLoading] = useState(false);
  const [traceResult, setTraceResult] = useState(null);
  const [searched, setSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSearch = useCallback(async (e) => {
    if (e) e.preventDefault();
    const cleanSerial = serialQuery.trim();
    if (!cleanSerial) return;

    setLoading(true);
    setErrorMsg("");
    setSearched(true);
    try {
      const response = await axiosInstance.get(`/inventory/trace-serial/${encodeURIComponent(cleanSerial)}`);
      setTraceResult(response?.data?.result || response?.data || null);
    } catch (err) {
      console.error("Serial trace error", err);
      setErrorMsg(err?.response?.data?.message || "Failed to search serial number.");
      setTraceResult(null);
    } finally {
      setLoading(false);
    }
  }, [serialQuery]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3.5,
          bgcolor: isDark ? "#0b1220" : "#ffffff",
          color: isDark ? "#f8fafc" : "#0f172a",
          border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e2e8f0",
        },
      }}
    >
      <DialogTitle
        sx={{
          m: 0,
          p: 2.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0",
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2.5,
              display: "grid",
              placeItems: "center",
              bgcolor: alpha(INDIGO, 0.15),
              color: INDIGO,
            }}
          >
            <QrCodeScanner fontSize="small" />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={900}>
              Serial Number Traceability
            </Typography>
            <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b" }}>
              Lookup warranty, customer, project, and issue history by serial number
            </Typography>
          </Box>
        </Stack>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Stack spacing={3}>
          {/* Search Box */}
          <form onSubmit={handleSearch}>
            <TextField
              fullWidth
              autoFocus
              placeholder="Enter or scan equipment serial number (e.g. SN-WAA-1001, HAV-5KW-9021...)"
              value={serialQuery}
              onChange={(e) => setSerialQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: isDark ? "#818cf8" : INDIGO }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <Button
                    variant="contained"
                    onClick={handleSearch}
                    disabled={loading || !serialQuery.trim()}
                    sx={{ bgcolor: INDIGO, fontWeight: 800, borderRadius: 2, px: 2.5 }}
                  >
                    {loading ? <CircularProgress size={18} color="inherit" /> : "Trace Serial"}
                  </Button>
                ),
              }}
              sx={{
                bgcolor: isDark ? "#0f172a" : "#f8fafc",
                borderRadius: 2.5,
                "& .MuiOutlinedInput-notchedOutline": { borderColor: isDark ? "rgba(255,255,255,0.15)" : "#cbd5e1" },
              }}
            />
          </form>

          {errorMsg && (
            <Paper sx={{ p: 2, borderRadius: 2, bgcolor: alpha(DANGER, 0.1), border: `1px solid ${alpha(DANGER, 0.3)}` }}>
              <Typography variant="body2" sx={{ color: DANGER }}>{errorMsg}</Typography>
            </Paper>
          )}

          {/* Results Display */}
          {searched && !loading && traceResult && (
            <Box>
              {traceResult.found ? (
                <Stack spacing={2.5}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.5,
                      borderRadius: 2.5,
                      bgcolor: isDark ? "rgba(16, 185, 129, 0.08)" : "#f0fdf4",
                      border: `1px solid ${alpha(SUCCESS, 0.3)}`,
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <CheckCircle sx={{ color: SUCCESS, fontSize: 28 }} />
                      <Box>
                        <Typography variant="subtitle1" fontWeight={900} sx={{ color: isDark ? "#4ade80" : "#15803d" }}>
                          Serial Number Match Found: {traceResult.searchedSerial}
                        </Typography>
                        <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b" }}>
                          Found in {traceResult.issues?.length || 0} dispatch transaction(s)
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>

                  {/* Issues List */}
                  {(traceResult.issues || []).map((issue, idx) => (
                    <Paper
                      key={idx}
                      elevation={0}
                      sx={{
                        p: 2.5,
                        borderRadius: 3,
                        bgcolor: isDark ? "#0f172a" : "#ffffff",
                        border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0",
                      }}
                    >
                      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Chip
                            label={`Issue #${issue.issueNumber}`}
                            size="small"
                            sx={{ bgcolor: alpha(INDIGO, 0.15), color: isDark ? "#818cf8" : INDIGO, fontWeight: 900 }}
                          />
                          <Chip
                            label={String(issue.status || "issued").toUpperCase()}
                            size="small"
                            sx={{
                              bgcolor: issue.status === "issued" ? alpha(SUCCESS, 0.15) : alpha(DANGER, 0.15),
                              color: issue.status === "issued" ? SUCCESS : DANGER,
                              fontWeight: 800,
                            }}
                          />
                        </Stack>
                        <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b" }}>
                          Date: {issue.issueDate ? new Date(issue.issueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "-"}
                        </Typography>
                      </Stack>

                      <Grid container spacing={2}>
                        {/* Customer Info */}
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: isDark ? "rgba(255,255,255,0.02)" : "#f8fafc" }}>
                            <Typography variant="caption" fontWeight={800} sx={{ color: isDark ? "#94a3b8" : "#64748b", display: "flex", alignItems: "center", gap: 0.5 }}>
                              <PersonOutline fontSize="inherit" /> CUSTOMER
                            </Typography>
                            <Typography variant="subtitle2" fontWeight={900} sx={{ mt: 0.5 }}>
                              {issue.customerName || "Customer"}
                            </Typography>
                            <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", display: "block" }}>
                              {issue.customerPhone || ""} {issue.customerEmail ? `• ${issue.customerEmail}` : ""}
                            </Typography>
                          </Box>
                        </Grid>

                        {/* Project Info */}
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: isDark ? "rgba(255,255,255,0.02)" : "#f8fafc" }}>
                            <Typography variant="caption" fontWeight={800} sx={{ color: isDark ? "#94a3b8" : "#64748b", display: "flex", alignItems: "center", gap: 0.5 }}>
                              <TaskAlt fontSize="inherit" /> PROJECT
                            </Typography>
                            <Typography variant="subtitle2" fontWeight={900} sx={{ mt: 0.5 }}>
                              {issue.projectCode ? `[${issue.projectCode}] ` : ""}{issue.projectType || "Residential"}
                            </Typography>
                            {issue.project && (
                              <Button
                                size="small"
                                endIcon={<OpenInNew sx={{ fontSize: 12 }} />}
                                onClick={() => {
                                  onClose();
                                  navigate(`/projects/${issue.project._id || issue.project}`);
                                }}
                                sx={{ p: 0, mt: 0.5, fontSize: 11, fontWeight: 800, textTransform: "none", color: BLUE }}
                              >
                                View Project Details
                              </Button>
                            )}
                          </Box>
                        </Grid>

                        {/* Matching Item Info */}
                        <Grid item xs={12}>
                          <Typography variant="caption" fontWeight={800} sx={{ color: isDark ? "#94a3b8" : "#64748b", mb: 0.5, display: "block" }}>
                            MATCHING EQUIPMENT ITEM
                          </Typography>
                          {(issue.matchingItems || []).map((mItem, mIdx) => (
                            <Box key={mIdx} sx={{ p: 1.5, borderRadius: 2, bgcolor: isDark ? "rgba(99,102,241,0.08)" : alpha(INDIGO, 0.04), border: `1px solid ${alpha(INDIGO, 0.2)}` }}>
                              <Typography variant="subtitle2" fontWeight={900} sx={{ color: isDark ? "#818cf8" : INDIGO }}>
                                {mItem.itemName}
                              </Typography>
                              <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b" }}>
                                Brand: {mItem.brand || "-"} • Model: {mItem.modelNumber || "-"} • Unit Cost: ₹{mItem.unitCost || 0}
                              </Typography>
                            </Box>
                          ))}
                        </Grid>
                      </Grid>
                    </Paper>
                  ))}
                </Stack>
              ) : (
                <Paper
                  elevation={0}
                  sx={{
                    p: 4,
                    textAlign: "center",
                    borderRadius: 3,
                    bgcolor: isDark ? "#0f172a" : "#f8fafc",
                    border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0",
                  }}
                >
                  <Typography variant="subtitle1" fontWeight={800} sx={{ color: isDark ? "#f8fafc" : "#0f172a", mb: 0.5 }}>
                    No Records Found
                  </Typography>
                  <Typography variant="body2" sx={{ color: isDark ? "#94a3b8" : "#64748b" }}>
                    Serial number "{traceResult.searchedSerial}" is not currently linked to any customer issue or project.
                  </Typography>
                </Paper>
              )}
            </Box>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2.5, borderTop: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0" }}>
        <Button variant="outlined" onClick={onClose} sx={{ borderRadius: 2 }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
