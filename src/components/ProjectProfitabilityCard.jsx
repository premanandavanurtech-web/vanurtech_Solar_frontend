import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Stack,
  Typography,
  Grid,
  Paper,
  Chip,
  Button,
  IconButton,
  TextField,
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
  Checkbox,
  InputAdornment,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  Inventory2,
  Add,
  Remove,
  CheckCircle,
  Search,
  Refresh,
  DeleteOutline,
  Check,
  InventoryOutlined,
  WidgetsOutlined,
  Clear,
  LocalShippingOutlined,
  PaidOutlined,
} from "@mui/icons-material";
import axiosInstance from "../utils/axiosConfig";

const BRAND = "#3B82F6";
const INDIGO = "#6366F1";
const SUCCESS = "#10B981";
const DANGER = "#EF4444";
const WARNING = "#F59E0B";

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

  // Data states
  const [loading, setLoading] = useState(true);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [issuedSummary, setIssuedSummary] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });

  // Filter & Search states for available items
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Selection for items to issue to this project
  const [selectedToIssue, setSelectedToIssue] = useState({});
  const [submittingIssue, setSubmittingIssue] = useState(false);
  const [cancellingIssueId, setCancellingIssueId] = useState(null);

  const customerId = leadOrProject?._id || projectId;

  // 1. Fetch Issued Items for this Project & Available Warehouse Inventory
  const fetchAllData = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setErrorMsg("");
    try {
      const [summaryRes, itemsRes] = await Promise.all([
        axiosInstance.get(`/inventory/project-profitability/${projectId}`),
        axiosInstance.get("/inventory/items?limit=500&active=true"),
      ]);

      const sumData = summaryRes?.data?.result || summaryRes?.data || null;
      setIssuedSummary(sumData);

      const rawItems = itemsRes?.data?.result?.items || itemsRes?.data?.items || itemsRes?.data?.result || [];
      const itemsList = Array.isArray(rawItems) ? rawItems : [];
      setInventoryItems(itemsList);
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

  const totalIssuedQty = useMemo(() => {
    return issuedItems.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);
  }, [issuedItems]);

  // Categories list from inventory items
  const categories = useMemo(() => {
    const set = new Set();
    inventoryItems.forEach((it) => {
      if (it.category) set.add(it.category);
    });
    return ["all", ...Array.from(set)];
  }, [inventoryItems]);

  // Filtered available inventory items
  const filteredInventoryItems = useMemo(() => {
    return inventoryItems.filter((item) => {
      const matchesSearch =
        !searchQuery ||
        item.itemName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = selectedCategory === "all" || item.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [inventoryItems, searchQuery, selectedCategory]);

  // Handle selection toggles and quantity updates
  const handleToggleSelect = (item) => {
    const itemId = item._id;
    const available = (item.warehouseStock || []).reduce((sum, r) => sum + (Number(r.availableQty) || 0), 0);
    const purchaseCost = Number(item.pricing?.purchaseCost || 0);

    setSelectedToIssue((prev) => {
      const current = prev[itemId];
      if (current?.selected) {
        const next = { ...prev };
        delete next[itemId];
        return next;
      }
      return {
        ...prev,
        [itemId]: {
          selected: true,
          quantity: 1,
          maxAvailable: available,
          unitCost: purchaseCost,
          itemData: item,
        },
      };
    });
  };

  const handleQuantityChange = (item, newQty) => {
    const itemId = item._id;
    const available = (item.warehouseStock || []).reduce((sum, r) => sum + (Number(r.availableQty) || 0), 0);
    const validQty = Math.max(1, Math.min(available > 0 ? available : 1, Number(newQty) || 1));

    setSelectedToIssue((prev) => {
      return {
        ...prev,
        [itemId]: {
          selected: true,
          quantity: validQty,
          maxAvailable: available,
          unitCost: Number(item.pricing?.purchaseCost || 0),
          itemData: item,
        },
      };
    });
  };

  // Selected items array for confirmation
  const selectedList = useMemo(() => {
    return Object.entries(selectedToIssue)
      .filter(([_, val]) => val.selected && val.quantity > 0)
      .map(([id, val]) => ({
        itemId: id,
        ...val,
      }));
  }, [selectedToIssue]);

  const totalSelectedQty = useMemo(() => {
    return selectedList.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);
  }, [selectedList]);

  const totalSelectedCost = useMemo(() => {
    return selectedList.reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitCost) || 0), 0);
  }, [selectedList]);

  // 2. Submit / Confirm Issue to Project
  const handleConfirmIssue = async () => {
    if (selectedList.length === 0) {
      setToast({ open: true, message: "Please select at least one item to issue to this project.", severity: "warning" });
      return;
    }

    for (const sel of selectedList) {
      if (sel.quantity > sel.maxAvailable) {
        setToast({
          open: true,
          message: `Quantity for "${sel.itemData?.itemName}" (${sel.quantity}) exceeds available stock (${sel.maxAvailable}).`,
          severity: "error",
        });
        return;
      }
    }

    setSubmittingIssue(true);
    try {
      const payload = {
        customerId: customerId,
        projectId: projectId,
        issueDate: new Date().toISOString(),
        notes: `Materials allocated to project ${leadOrProject?.projectCode || leadOrProject?.firstName || ""}`,
        items: selectedList.map((sel) => ({
          item: sel.itemId,
          itemName: sel.itemData?.itemName,
          sku: sel.itemData?.sku || "",
          category: sel.itemData?.category || "",
          brand: sel.itemData?.brand || "",
          modelNumber: sel.itemData?.modelNumber || "",
          unit: sel.itemData?.unit || "Nos",
          quantity: Number(sel.quantity),
          unitCost: Number(sel.unitCost),
          totalCost: Math.round(Number(sel.quantity) * Number(sel.unitCost) * 100) / 100,
        })),
      };

      const res = await axiosInstance.post("/inventory/inventory-out", payload);
      setToast({
        open: true,
        message: "Materials confirmed and issued to project! Stock updated successfully.",
        severity: "success",
      });

      setSelectedToIssue({});
      await fetchAllData();
      if (onUpdate) onUpdate(res?.data?.result || res?.data);
    } catch (err) {
      console.error("Failed to issue materials", err);
      const msg = err?.response?.data?.message || err?.message || "Failed to issue items to project.";
      setToast({ open: true, message: msg, severity: "error" });
    } finally {
      setSubmittingIssue(false);
    }
  };

  // 3. Cancel / Return Issued Material Dialog State
  const [confirmReturnDialog, setConfirmReturnDialog] = useState({
    open: false,
    issueId: null,
    itemName: "",
    quantity: 0,
    unit: "pcs",
  });

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
    } catch (err) {
      console.error("Failed to cancel issue", err);
      setToast({ open: true, message: err?.response?.data?.message || "Failed to return stock.", severity: "error" });
    } finally {
      setCancellingIssueId(null);
    }
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
      {/* 📦 SECTION 1: Equipment & Materials Issued to Project     */}
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

          <Stack direction="row" alignItems="center" spacing={1.5}>
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
          </Stack>
        </Box>

        {issuedItems.length === 0 ? (
          <Box sx={{ p: 5, textAlign: "center" }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                mx: "auto",
                mb: 1.5,
                borderRadius: 3,
                bgcolor: isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9",
                display: "grid",
                placeItems: "center",
                color: isDark ? "#64748b" : "#94a3b8",
              }}
            >
              <Inventory2 sx={{ fontSize: 28 }} />
            </Box>
            <Typography variant="body1" fontWeight={800} sx={{ color: isDark ? "#f8fafc" : "#0f172a", mb: 0.5 }}>
              No Materials Issued to this Project Yet
            </Typography>
            <Typography variant="body2" sx={{ color: isDark ? "#94a3b8" : "#64748b", maxWidth: 460, mx: "auto" }}>
              Select items from the inventory catalog below, specify required quantities, and click <strong>"Confirm & Issue to Project"</strong>.
            </Typography>
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

      {/* ======================================================== */}
      {/* 📥 SECTION 2: Select Items from Inventory to Issue       */}
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
            bgcolor: isDark ? "rgba(255,255,255,0.02)" : "#f8fafc",
          }}
        >
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }} spacing={2}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: 2.5,
                  display: "grid",
                  placeItems: "center",
                  background: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
                  color: "#ffffff",
                  boxShadow: "0 4px 12px rgba(59,130,246,0.3)",
                }}
              >
                <Inventory2 sx={{ fontSize: 22 }} />
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight={900} sx={{ color: isDark ? "#f8fafc" : "#0f172a", letterSpacing: "-0.01em" }}>
                  Select Items from Warehouse Inventory
                </Typography>
                <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b" }}>
                  Pick the required equipment for this project from inventory and click Confirm
                </Typography>
              </Box>
            </Stack>

            {/* Quick Search Field */}
            <TextField
              size="small"
              placeholder="Search items, SKU, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ fontSize: 18, color: isDark ? "#94a3b8" : "#94a3b8" }} />
                  </InputAdornment>
                ),
                endAdornment: searchQuery ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchQuery("")} sx={{ color: "#94a3b8" }}>
                      <Clear sx={{ fontSize: 15 }} />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
              sx={{
                width: { xs: "100%", sm: 260 },
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  bgcolor: isDark ? "#070b14" : "#ffffff",
                  fontSize: 13,
                  fontWeight: 600,
                },
              }}
            />
          </Stack>

          {/* Category Filter Chips */}
          <Stack direction="row" spacing={1} sx={{ mt: 2, overflowX: "auto", pb: 0.5 }}>
            {categories.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <Chip
                  key={cat}
                  label={cat === "all" ? "All Categories" : cat}
                  clickable
                  onClick={() => setSelectedCategory(cat)}
                  size="small"
                  sx={{
                    fontWeight: 800,
                    fontSize: 12,
                    textTransform: "capitalize",
                    bgcolor: isActive ? BRAND : isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9",
                    color: isActive ? "#ffffff" : isDark ? "#cbd5e1" : "#475569",
                    boxShadow: isActive ? "0 2px 8px rgba(59,130,246,0.3)" : "none",
                    border: `1px solid ${isActive ? BRAND : isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0"}`,
                    "&:hover": {
                      bgcolor: isActive ? "#2563eb" : isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0",
                    },
                  }}
                />
              );
            })}
          </Stack>
        </Box>

        {/* Inventory Items List */}
        {filteredInventoryItems.length === 0 ? (
          <Box sx={{ p: 5, textAlign: "center" }}>
            <Typography variant="body2" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontWeight: 600 }}>
              No inventory items found matching your filter. Add items in <strong>Inventory</strong> first.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ overflowX: "auto" }}>
            <Table size="medium">
              <TableHead>
                <TableRow sx={{ bgcolor: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc" }}>
                  <TableCell padding="checkbox" sx={{ py: 1.5 }}>
                    <Typography variant="caption" fontWeight={800} color="text.secondary">
                      SELECT
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: 11, color: isDark ? "#94a3b8" : "#64748b", letterSpacing: "0.05em", py: 1.5 }}>
                    ITEM DETAILS
                  </TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: 11, color: isDark ? "#94a3b8" : "#64748b", letterSpacing: "0.05em", py: 1.5 }}>
                    CATEGORY
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, fontSize: 11, color: isDark ? "#94a3b8" : "#64748b", letterSpacing: "0.05em", py: 1.5 }}>
                    COST PRICE
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800, fontSize: 11, color: isDark ? "#94a3b8" : "#64748b", letterSpacing: "0.05em", py: 1.5 }}>
                    AVAILABLE STOCK
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800, fontSize: 11, color: isDark ? "#94a3b8" : "#64748b", letterSpacing: "0.05em", py: 1.5 }}>
                    REQUIRED QTY FOR PROJECT
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredInventoryItems.map((item) => {
                  const stock = (item.warehouseStock || []).reduce(
                    (sum, row) => sum + (Number(row.availableQty) || 0),
                    0
                  );
                  const isSelected = !!selectedToIssue[item._id]?.selected;
                  const currentQty = selectedToIssue[item._id]?.quantity || 1;
                  const isOutOfStock = stock <= 0;

                  return (
                    <TableRow
                      key={item._id}
                      hover
                      selected={isSelected}
                      sx={{
                        bgcolor: isSelected
                          ? isDark ? "rgba(59,130,246,0.12)" : "#eff6ff"
                          : "transparent",
                        borderLeft: isSelected ? `4px solid ${BRAND}` : "4px solid transparent",
                        opacity: isOutOfStock ? 0.6 : 1,
                        transition: "all 0.15s ease",
                      }}
                    >
                      <TableCell padding="checkbox" sx={{ py: 1.75 }}>
                        <Checkbox
                          checked={isSelected}
                          disabled={isOutOfStock}
                          onChange={() => handleToggleSelect(item)}
                          sx={{
                            color: isDark ? "#60a5fa" : BRAND,
                            "&.Mui-checked": { color: isDark ? "#60a5fa" : BRAND },
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ py: 1.75 }}>
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                          {item.image ? (
                            <Box
                              component="img"
                              src={item.image}
                              alt={item.itemName}
                              sx={{ width: 40, height: 40, borderRadius: 2, objectFit: "cover", border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0"}` }}
                            />
                          ) : (
                            <Box
                              sx={{
                                width: 40,
                                height: 40,
                                borderRadius: 2,
                                bgcolor: isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9",
                                display: "grid",
                                placeItems: "center",
                                color: isDark ? "#94a3b8" : "#64748b",
                                flexShrink: 0,
                              }}
                            >
                              <Inventory2 sx={{ fontSize: 20 }} />
                            </Box>
                          )}
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
                            bgcolor: isDark ? "rgba(255,255,255,0.08)" : "#f1f5f9",
                            color: isDark ? "#cbd5e1" : "#475569",
                          }}
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ py: 1.75 }}>
                        <Typography variant="body2" fontWeight={800} sx={{ color: isDark ? "#f8fafc" : "#0f172a" }}>
                          {formatCurrency(item.pricing?.purchaseCost || item.pricing?.sellingPrice)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center" sx={{ py: 1.75 }}>
                        <Chip
                          size="small"
                          label={isOutOfStock ? "0 (Out of stock)" : `${stock} ${item.unit || "pcs"} available`}
                          sx={{
                            fontWeight: 900,
                            fontSize: 11,
                            bgcolor: isOutOfStock
                              ? (isDark ? "rgba(239,68,68,0.15)" : "#fee2e2")
                              : (isDark ? "rgba(16,185,129,0.15)" : "#dcfce7"),
                            color: isOutOfStock ? DANGER : (isDark ? "#34d399" : "#047857"),
                          }}
                        />
                      </TableCell>
                      <TableCell align="center" sx={{ py: 1.75 }}>
                        {isOutOfStock ? (
                          <Typography variant="caption" color="error" fontWeight={800}>
                            Out of stock
                          </Typography>
                        ) : (
                          <Stack
                            direction="row"
                            alignItems="center"
                            justifyContent="center"
                            spacing={0.5}
                            sx={{
                              display: "inline-flex",
                              p: 0.5,
                              borderRadius: 2,
                              bgcolor: isDark ? "rgba(255,255,255,0.04)" : "#f8fafc",
                              border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#cbd5e1"}`,
                            }}
                          >
                            <IconButton
                              size="small"
                              onClick={() => {
                                if (currentQty > 1) handleQuantityChange(item, currentQty - 1);
                              }}
                              disabled={!isSelected || currentQty <= 1}
                              sx={{
                                width: 28,
                                height: 28,
                                borderRadius: 1.5,
                                bgcolor: isDark ? "rgba(255,255,255,0.06)" : "#ffffff",
                                "&:hover": { bgcolor: isDark ? "rgba(255,255,255,0.12)" : "#f1f5f9" },
                              }}
                            >
                              <Remove sx={{ fontSize: 16 }} />
                            </IconButton>
                            <TextField
                              size="small"
                              type="number"
                              value={currentQty}
                              disabled={!isSelected}
                              onChange={(e) => handleQuantityChange(item, e.target.value)}
                              inputProps={{
                                min: 1,
                                max: stock,
                                style: { textAlign: "center", width: 42, padding: "4px 2px", fontWeight: 800, fontSize: 13 },
                              }}
                              sx={{
                                width: 52,
                                "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                              }}
                            />
                            <IconButton
                              size="small"
                              onClick={() => {
                                if (currentQty < stock) handleQuantityChange(item, currentQty + 1);
                              }}
                              disabled={!isSelected || currentQty >= stock}
                              sx={{
                                width: 28,
                                height: 28,
                                borderRadius: 1.5,
                                bgcolor: isDark ? "rgba(255,255,255,0.06)" : "#ffffff",
                                "&:hover": { bgcolor: isDark ? "rgba(255,255,255,0.12)" : "#f1f5f9" },
                              }}
                            >
                              <Add sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Stack>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
        )}

        {/* Confirmation & Issue Bottom Bar */}
        <Box
          sx={{
            p: { xs: 2, sm: 2.5 },
            borderTop: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #edf2f7",
            bgcolor: isDark ? "rgba(255,255,255,0.02)" : "#f8fafc",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap">
            <Chip
              label={`${selectedList.length} item(s) selected`}
              sx={{
                fontWeight: 800,
                fontSize: 12,
                bgcolor: selectedList.length > 0 ? (isDark ? "rgba(59,130,246,0.2)" : "#dbeafe") : isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9",
                color: selectedList.length > 0 ? (isDark ? "#93c5fd" : BRAND) : isDark ? "#94a3b8" : "#64748b",
              }}
            />
            <Chip
              label={`Total Quantity: ${totalSelectedQty}`}
              sx={{
                fontWeight: 800,
                fontSize: 12,
                bgcolor: isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9",
                color: isDark ? "#cbd5e1" : "#475569",
              }}
            />
            <Chip
              icon={<PaidOutlined sx={{ fontSize: 16, color: `${SUCCESS} !important` }} />}
              label={`Total Cost: ${formatCurrency(totalSelectedCost)}`}
              sx={{
                fontWeight: 900,
                fontSize: 12,
                bgcolor: isDark ? "rgba(16,185,129,0.15)" : "#dcfce7",
                color: isDark ? "#34d399" : "#047857",
              }}
            />
          </Stack>

          <Button
            variant="contained"
            disabled={selectedList.length === 0 || submittingIssue}
            onClick={handleConfirmIssue}
            startIcon={submittingIssue ? <CircularProgress size={18} color="inherit" /> : <Check sx={{ fontSize: 18 }} />}
            sx={{
              bgcolor: SUCCESS,
              color: "#ffffff",
              fontWeight: 900,
              fontSize: "0.95rem",
              px: 3.5,
              py: 1.25,
              borderRadius: 2.5,
              textTransform: "none",
              boxShadow: "0 4px 14px rgba(16,185,129,0.35)",
              "&:hover": { bgcolor: "#059669", boxShadow: "0 6px 20px rgba(16,185,129,0.45)" },
              "&.Mui-disabled": { bgcolor: isDark ? "rgba(255,255,255,0.1)" : "#cbd5e1" },
            }}
          >
            {submittingIssue ? "Issuing to Project..." : "Confirm & Issue to Project"}
          </Button>
        </Box>
      </Paper>

      {/* Modern Return / Delete Confirmation Dialog */}
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
