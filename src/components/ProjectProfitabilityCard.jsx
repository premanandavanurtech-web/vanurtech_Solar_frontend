import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Stack,
  Typography,
  Paper,
  Chip,
  Button,
  IconButton,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Tooltip,
  CircularProgress,
  useTheme,
  alpha,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  Inventory2,
  Add,
  CheckCircle,
  Refresh,
  DeleteOutline,
  InventoryOutlined,
  WidgetsOutlined,
  PaidOutlined,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosConfig";

const BRAND = "#3B82F6";
const INDIGO = "#6366F1";
const SUCCESS = "#10B981";
const DANGER = "#EF4444";

const formatCurrency = (amount) => {
  const num = Number(amount || 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(num) ? num : 0);
};

export default function ProjectProfitabilityCard({
  projectId,
  leadOrProject = null,
  onUpdate = null,
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const navigate = useNavigate();

  // Data states
  const [loading, setLoading] = useState(true);
  const [issuedSummary, setIssuedSummary] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });
  const [cancellingIssueId, setCancellingIssueId] = useState(null);

  // Return Dialog State
  const [confirmReturnDialog, setConfirmReturnDialog] = useState({
    open: false,
    issueId: null,
    itemName: "",
    quantity: 0,
    unit: "pcs",
  });

  const targetProjectId = leadOrProject?._id || projectId;

  // 1. Fetch Issued Items for this Project
  const fetchAllData = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setErrorMsg("");
    try {
      const summaryRes = await axiosInstance.get(`/inventory/project-profitability/${projectId}`);
      const sumData = summaryRes?.data?.result || summaryRes?.data || null;
      setIssuedSummary(sumData);
    } catch (err) {
      console.error("Failed to fetch project inventory data", err);
      setErrorMsg("Failed to load inventory data.");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Extract issued items list
  const issuedItems = useMemo(() => {
    return issuedSummary?.inventorySummary?.items || [];
  }, [issuedSummary]);

  // Total Material Cost of all issued items
  const totalIssuedCost = useMemo(() => {
    return issuedItems.reduce((sum, it) => sum + (Number(it.totalCost) || 0), 0);
  }, [issuedItems]);

  const handleOpenReturnModal = (item) => {
    if (!item.issues || item.issues.length === 0) return;
    setConfirmReturnDialog({
      open: true,
      issueId: item.issues[0].issueId,
      itemName: item.itemName,
      quantity: item.quantity,
      unit: item.unit || "pcs",
    });
  };

  const handleConfirmReturn = async () => {
    if (!confirmReturnDialog.issueId) return;
    const issueId = confirmReturnDialog.issueId;
    setCancellingIssueId(issueId);
    setConfirmReturnDialog({ open: false, issueId: null, itemName: "", quantity: 0, unit: "pcs" });
    try {
      await axiosInstance.post(`/inventory/inventory-out/${issueId}/cancel`, {
        reason: "Returned from Project details",
      });
      setToast({ open: true, message: "Material returned and stock restored to inventory successfully!", severity: "success" });
      await fetchAllData();
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error("Failed to cancel issue", err);
      setToast({ open: true, message: err?.response?.data?.message || "Failed to return stock.", severity: "error" });
    } finally {
      setCancellingIssueId(null);
    }
  };

  const handleNavigateToAddMaterials = () => {
    navigate(`/projects/${targetProjectId}/issue-materials`, {
      state: { project: leadOrProject },
    });
  };

  if (loading) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 5,
          borderRadius: 3,
          bgcolor: isDark ? "#0b1220" : "#ffffff",
          border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0",
          textAlign: "center",
        }}
      >
        <CircularProgress size={32} sx={{ color: BRAND, mb: 1.5 }} />
        <Typography variant="body2" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontWeight: 600 }}>
          Loading Project Materials & Inventory data...
        </Typography>
      </Paper>
    );
  }

  return (
    <Stack spacing={3}>
      {/* Toast Alert */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={() => setToast({ ...toast, open: false })}
          severity={toast.severity}
          variant="filled"
          sx={{ width: "100%", fontWeight: 700, borderRadius: 2 }}
        >
          {toast.message}
        </Alert>
      </Snackbar>

      {/* ======================================================== */}
      {/* 📦 Equipment & Materials Issued to Project Card           */}
      {/* ======================================================== */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          bgcolor: isDark ? "#0b1220" : "#ffffff",
          border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0",
          overflow: "hidden",
          boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.4)" : "0 4px 20px rgba(0,0,0,0.03)",
        }}
      >
        {/* Section Header */}
        <Box
          sx={{
            p: { xs: 2, sm: 2.5 },
            borderBottom: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #edf2f7",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 1.5,
            bgcolor: isDark ? "rgba(255,255,255,0.02)" : "#f8fafc",
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: 2.5,
                display: "grid",
                placeItems: "center",
                background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                color: "#ffffff",
                boxShadow: "0 4px 12px rgba(16,185,129,0.3)",
              }}
            >
              <CheckCircle sx={{ fontSize: 22 }} />
            </Box>
            <Box>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="subtitle1" fontWeight={900} sx={{ color: isDark ? "#f8fafc" : "#0f172a", letterSpacing: "-0.01em" }}>
                  Equipment & Materials Issued to this Project
                </Typography>
                <Chip
                  label={`${issuedItems.length} Allocated`}
                  size="small"
                  sx={{
                    height: 22,
                    fontSize: 11,
                    fontWeight: 800,
                    bgcolor: isDark ? "rgba(16,185,129,0.15)" : "#dcfce7",
                    color: isDark ? "#34d399" : SUCCESS,
                  }}
                />
              </Stack>
              <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b" }}>
                Total items and hardware allocated from warehouse stock to this site
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap">
            {issuedItems.length > 0 && (
              <Chip
                icon={<PaidOutlined sx={{ fontSize: 16, color: "#10b981 !important" }} />}
                label={`Total Material Value: ${formatCurrency(totalIssuedCost)}`}
                sx={{
                  fontWeight: 800,
                  fontSize: 12,
                  bgcolor: isDark ? "rgba(16,185,129,0.12)" : "#ecfdf5",
                  color: isDark ? "#34d399" : "#065f46",
                  border: `1px solid ${alpha(SUCCESS, 0.25)}`,
                }}
              />
            )}
            <Button
              startIcon={<Refresh sx={{ fontSize: 18 }} />}
              size="small"
              variant="outlined"
              onClick={fetchAllData}
              sx={{
                borderRadius: 2,
                fontWeight: 800,
                textTransform: "none",
                borderColor: isDark ? "rgba(255,255,255,0.12)" : "#cbd5e1",
                color: isDark ? "#cbd5e1" : "#475569",
                "&:hover": {
                  bgcolor: isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9",
                  borderColor: BRAND,
                },
              }}
            >
              Refresh
            </Button>
            {/* Primary Action Button to redirect to Add Materials page */}
            <Button
              variant="contained"
              startIcon={<Add sx={{ fontSize: 18 }} />}
              size="small"
              onClick={handleNavigateToAddMaterials}
              sx={{
                borderRadius: 2,
                fontWeight: 800,
                fontSize: "0.875rem",
                textTransform: "none",
                px: 2,
                py: 0.75,
                bgcolor: BRAND,
                color: "#ffffff",
                boxShadow: "0 4px 12px rgba(59,130,246,0.3)",
                "&:hover": {
                  bgcolor: "#2563eb",
                  boxShadow: "0 6px 18px rgba(59,130,246,0.4)",
                },
              }}
            >
              Add materials to project
            </Button>
          </Stack>
        </Box>

        {issuedItems.length === 0 ? (
          <Box sx={{ p: 6, textAlign: "center" }}>
            <Box
              sx={{
                width: 60,
                height: 60,
                mx: "auto",
                mb: 2,
                borderRadius: 3,
                bgcolor: isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9",
                display: "grid",
                placeItems: "center",
                color: isDark ? "#64748b" : "#94a3b8",
              }}
            >
              <Inventory2 sx={{ fontSize: 30 }} />
            </Box>
            <Typography variant="h6" fontWeight={800} sx={{ color: isDark ? "#f8fafc" : "#0f172a", mb: 0.5 }}>
              No Materials Issued to this Project Yet
            </Typography>
            <Typography variant="body2" sx={{ color: isDark ? "#94a3b8" : "#64748b", maxWidth: 480, mx: "auto", mb: 3 }}>
              Select items from the warehouse inventory catalog, specify required quantities, and allocate them to this site.
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add sx={{ fontSize: 20 }} />}
              onClick={handleNavigateToAddMaterials}
              sx={{
                borderRadius: 2.5,
                fontWeight: 900,
                fontSize: "0.95rem",
                textTransform: "none",
                px: 3.5,
                py: 1.25,
                bgcolor: BRAND,
                color: "#ffffff",
                boxShadow: "0 4px 16px rgba(59,130,246,0.35)",
                "&:hover": {
                  bgcolor: "#2563eb",
                  boxShadow: "0 6px 22px rgba(59,130,246,0.45)",
                },
              }}
            >
              Add materials to project
            </Button>
          </Box>
        ) : (
          <Box sx={{ overflowX: "auto" }}>
            <Table size="medium">
              <TableHead>
                <TableRow sx={{ bgcolor: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc" }}>
                  <TableCell sx={{ fontWeight: 800, fontSize: 11, color: isDark ? "#94a3b8" : "#64748b", letterSpacing: "0.05em", py: 1.5 }}>
                    ITEM NAME & DETAILS
                  </TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: 11, color: isDark ? "#94a3b8" : "#64748b", letterSpacing: "0.05em", py: 1.5 }}>
                    CATEGORY
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800, fontSize: 11, color: isDark ? "#94a3b8" : "#64748b", letterSpacing: "0.05em", py: 1.5 }}>
                    QTY ISSUED
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, fontSize: 11, color: isDark ? "#94a3b8" : "#64748b", letterSpacing: "0.05em", py: 1.5 }}>
                    UNIT COST
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, fontSize: 11, color: isDark ? "#94a3b8" : "#64748b", letterSpacing: "0.05em", py: 1.5 }}>
                    TOTAL COST
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800, fontSize: 11, color: isDark ? "#94a3b8" : "#64748b", letterSpacing: "0.05em", py: 1.5 }}>
                    ACTIONS
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {issuedItems.map((item, idx) => (
                  <TableRow
                    key={idx}
                    hover
                    sx={{
                      transition: "background-color 0.15s ease",
                      "&:last-child td, &:last-child th": { border: 0 },
                    }}
                  >
                    <TableCell sx={{ py: 1.75 }}>
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Box
                          sx={{
                            width: 38,
                            height: 38,
                            borderRadius: 2,
                            bgcolor: isDark ? "rgba(59,130,246,0.12)" : "#eff6ff",
                            color: BRAND,
                            display: "grid",
                            placeItems: "center",
                            flexShrink: 0,
                          }}
                        >
                          <InventoryOutlined sx={{ fontSize: 20 }} />
                        </Box>
                        <Box>
                          <Typography variant="body2" fontWeight={800} sx={{ color: isDark ? "#f8fafc" : "#0f172a" }}>
                            {item.itemName}
                          </Typography>
                          {item.sku && (
                            <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontWeight: 600 }}>
                              SKU: {item.sku}
                            </Typography>
                          )}
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ py: 1.75 }}>
                      <Chip
                        size="small"
                        label={item.category || "General"}
                        sx={{
                          height: 22,
                          fontSize: 11,
                          fontWeight: 800,
                          textTransform: "capitalize",
                          bgcolor: isDark ? "rgba(99,102,241,0.15)" : "#eef2ff",
                          color: isDark ? "#818cf8" : INDIGO,
                        }}
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ py: 1.75 }}>
                      <Chip
                        size="small"
                        icon={<WidgetsOutlined sx={{ fontSize: 14, color: `${SUCCESS} !important` }} />}
                        label={`${item.quantity} ${item.unit || "pcs"}`}
                        sx={{
                          fontWeight: 900,
                          fontSize: 12,
                          bgcolor: isDark ? "rgba(16,185,129,0.15)" : "#dcfce7",
                          color: isDark ? "#34d399" : "#047857",
                          px: 0.5,
                        }}
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ py: 1.75 }}>
                      <Typography variant="body2" fontWeight={700} sx={{ color: isDark ? "#cbd5e1" : "#334155" }}>
                        {formatCurrency(item.unitCost)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ py: 1.75 }}>
                      <Typography variant="body2" fontWeight={900} sx={{ color: BRAND, fontSize: "0.95rem" }}>
                        {formatCurrency(item.totalCost)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center" sx={{ py: 1.75 }}>
                      {item.issues && item.issues.length > 0 ? (
                        <Tooltip title="Return this item back to inventory stock">
                          <span>
                            <IconButton
                              size="small"
                              color="error"
                              disabled={cancellingIssueId === item.issues[0].issueId}
                              onClick={() => handleOpenReturnModal(item)}
                              sx={{
                                border: `1px solid ${alpha(DANGER, 0.25)}`,
                                bgcolor: alpha(DANGER, 0.05),
                                borderRadius: 1.75,
                                "&:hover": {
                                  bgcolor: alpha(DANGER, 0.15),
                                  borderColor: DANGER,
                                },
                              }}
                            >
                              <DeleteOutline sx={{ fontSize: 18 }} />
                            </IconButton>
                          </span>
                        </Tooltip>
                      ) : (
                        <Typography variant="caption" color="text.secondary">-</Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </Paper>

      {/* Return Material Confirmation Dialog */}
      <Dialog
        open={confirmReturnDialog.open}
        onClose={() => setConfirmReturnDialog({ open: false, issueId: null, itemName: "", quantity: 0, unit: "pcs" })}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 1,
            bgcolor: isDark ? "#0f172a" : "#ffffff",
            backgroundImage: "none",
            border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e2e8f0",
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 900, fontSize: "1.1rem", color: isDark ? "#f8fafc" : "#0f172a", pb: 1 }}>
          Return Material to Inventory?
        </DialogTitle>
        <DialogContent sx={{ py: 1 }}>
          <Typography variant="body2" sx={{ color: isDark ? "#94a3b8" : "#64748b", mb: 1 }}>
            Are you sure you want to return <strong>{confirmReturnDialog.quantity} {confirmReturnDialog.unit}</strong> of <strong>"{confirmReturnDialog.itemName}"</strong> back to warehouse inventory?
          </Typography>
          <Typography variant="caption" sx={{ color: isDark ? "#64748b" : "#94a3b8" }}>
            This will restore the item's available stock and update the project ledger.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 1, gap: 1 }}>
          <Button
            variant="outlined"
            onClick={() => setConfirmReturnDialog({ open: false, issueId: null, itemName: "", quantity: 0, unit: "pcs" })}
            sx={{
              borderRadius: 2,
              fontWeight: 800,
              textTransform: "none",
              color: isDark ? "#cbd5e1" : "#475569",
              borderColor: isDark ? "rgba(255,255,255,0.15)" : "#cbd5e1",
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmReturn}
            sx={{
              borderRadius: 2,
              fontWeight: 900,
              textTransform: "none",
              px: 2.5,
              bgcolor: DANGER,
              "&:hover": { bgcolor: "#dc2626" },
            }}
          >
            Return to Stock
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
