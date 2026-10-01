import React, { useState, useEffect, useMemo } from "react";
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
  MenuItem,
  Grid,
  Divider,
  Paper,
  Chip,
  Tooltip,
  Alert,
  Autocomplete,
  CircularProgress,
  useTheme,
  alpha,
} from "@mui/material";
import {
  Close,
  Add,
  DeleteOutline,
  Inventory2,
  CheckCircle,
  QrCodeScanner,
  PersonOutline,
  TaskAlt,
} from "@mui/icons-material";
import axiosInstance from "../utils/axiosConfig";

const INDIGO = "#6366f1";
const SUCCESS = "#10b981";
const DANGER = "#ef4444";
const WARNING = "#f59e0b";

const formatCurrency = (amount) => {
  const num = Number(amount || 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(num) ? num : 0);
};

export default function InventoryOutDialog({
  open,
  onClose,
  preselectedCustomer = null,
  preselectedProject = null,
  onSuccess,
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  // Data sources
  const [customers, setCustomers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Form State
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");

  // Items State
  const [items, setItems] = useState([
    {
      _id: Math.random().toString(36).slice(2, 9),
      item: null,
      itemName: "",
      sku: "",
      category: "",
      brand: "",
      modelNumber: "",
      unit: "Nos",
      quantity: 1,
      unitCost: 0,
      totalCost: 0,
      serialNumbersInput: "",
      serialNumbers: [],
      availableStock: 0,
    },
  ]);

  // Load initial customers, inventory items, and warehouses
  useEffect(() => {
    if (!open) return;

    let isMounted = true;
    setErrorMsg("");

    const fetchData = async () => {
      setLoadingInitial(true);
      try {
        const [leadsRes, itemsRes, whRes] = await Promise.all([
          axiosInstance.get("/lead/getAll?limit=1000&sortBy=createdAt&sortOrder=desc"),
          axiosInstance.get("/inventory/items?limit=500&active=true"),
          axiosInstance.get("/inventory/warehouses?active=true").catch(() => ({ data: { result: [] } })),
        ]);

        if (!isMounted) return;

        const rawLeads = leadsRes?.data?.result?.leads || leadsRes?.data?.leads || leadsRes?.data?.result || [];
        const allLeads = Array.isArray(rawLeads) ? rawLeads : (Array.isArray(rawLeads?.leads) ? rawLeads.leads : []);
        setCustomers(allLeads);

        const rawItems = itemsRes?.data?.result?.items || itemsRes?.data?.items || itemsRes?.data?.result || [];
        const loadedItems = Array.isArray(rawItems) ? rawItems : (Array.isArray(rawItems?.items) ? rawItems.items : []);
        setInventoryItems(loadedItems);

        const rawWh = whRes?.data?.result || whRes?.data || [];
        const loadedWh = Array.isArray(rawWh) ? rawWh : (Array.isArray(rawWh?.warehouses) ? rawWh.warehouses : []);
        setWarehouses(loadedWh);
        if (loadedWh.length > 0 && !selectedWarehouse) {
          const defaultWh = loadedWh.find((w) => w.isDefault) || loadedWh[0];
          setSelectedWarehouse(defaultWh._id);
        }

        // Handle preselected customer/project
        if (preselectedCustomer) {
          const matchedCust = typeof preselectedCustomer === "object"
            ? preselectedCustomer
            : allLeads.find((l) => String(l._id) === String(preselectedCustomer));
          if (matchedCust) setSelectedCustomer(matchedCust);
        }

        if (preselectedProject) {
          const matchedProj = typeof preselectedProject === "object"
            ? preselectedProject
            : allLeads.find((l) => String(l._id) === String(preselectedProject));
          if (matchedProj) {
            setSelectedProject(matchedProj);
            if (!preselectedCustomer) setSelectedCustomer(matchedProj);
          }
        }
      } catch (err) {
        console.error("Failed to load inventory out dependencies", err);
        if (isMounted) setErrorMsg("Failed to load inventory data. Please try again.");
      } finally {
        if (isMounted) setLoadingInitial(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [open, preselectedCustomer, preselectedProject]);

  // When customer changes, load matching projects
  useEffect(() => {
    if (!selectedCustomer) {
      setProjects([]);
      if (!preselectedProject) setSelectedProject(null);
      return;
    }

    const custPhone = selectedCustomer.phone;
    const custId = String(selectedCustomer._id);
    const custList = Array.isArray(customers) ? customers : [];

    const relatedProjects = custList.filter((lead) => {
      if (lead && lead.isProject) {
        if (String(lead._id) === custId) return true;
        if (custPhone && lead.phone === custPhone) return true;
        if (lead.customerId && String(lead.customerId) === custId) return true;
      }
      return false;
    });

    const finalProjects = relatedProjects.length > 0 ? relatedProjects : [selectedCustomer];
    setProjects(finalProjects);

    if (!selectedProject || !finalProjects.some((p) => String(p._id) === String(selectedProject._id))) {
      setSelectedProject(finalProjects[0] || null);
    }
  }, [selectedCustomer, customers, preselectedProject, selectedProject]);

  // Item row operations
  const handleAddItemRow = () => {
    setItems((prev) => [
      ...prev,
      {
        _id: Math.random().toString(36).slice(2, 9),
        item: null,
        itemName: "",
        sku: "",
        category: "",
        brand: "",
        modelNumber: "",
        unit: "Nos",
        quantity: 1,
        unitCost: 0,
        totalCost: 0,
        serialNumbersInput: "",
        serialNumbers: [],
        availableStock: 0,
      },
    ]);
  };

  const handleRemoveItemRow = (index) => {
    setItems((prev) => {
      const updated = [...prev];
      updated.splice(index, 1);
      return updated.length > 0 ? updated : [
        {
          _id: Math.random().toString(36).slice(2, 9),
          item: null,
          itemName: "",
          sku: "",
          category: "",
          brand: "",
          modelNumber: "",
          unit: "Nos",
          quantity: 1,
          unitCost: 0,
          totalCost: 0,
          serialNumbersInput: "",
          serialNumbers: [],
          availableStock: 0,
        },
      ];
    });
  };

  const handleItemSelect = (index, selectedInvItem) => {
    setItems((prev) => {
      const updated = [...prev];
      if (!selectedInvItem) {
        updated[index] = {
          ...updated[index],
          item: null,
          itemName: "",
          sku: "",
          category: "",
          brand: "",
          modelNumber: "",
          unit: "Nos",
          unitCost: 0,
          totalCost: 0,
          availableStock: 0,
        };
        return updated;
      }

      const availableStock = (selectedInvItem.warehouseStock || []).reduce(
        (sum, r) => sum + (Number(r.availableQty) || 0),
        0
      );
      const purchaseCost = Number(selectedInvItem.pricing?.purchaseCost || 0);
      const qty = Number(updated[index].quantity) || 1;

      updated[index] = {
        ...updated[index],
        item: selectedInvItem._id,
        itemName: selectedInvItem.itemName,
        sku: selectedInvItem.sku || "",
        category: selectedInvItem.category || "",
        brand: selectedInvItem.brand || "",
        modelNumber: selectedInvItem.modelNumber || "",
        unit: selectedInvItem.unit || "Nos",
        unitCost: purchaseCost,
        quantity: qty,
        totalCost: Math.round(qty * purchaseCost * 100) / 100,
        availableStock,
      };
      return updated;
    });
  };

  const handleFieldChange = (index, field, value) => {
    setItems((prev) => {
      const updated = [...prev];
      const row = { ...updated[index] };

      if (field === "quantity") {
        const qty = Math.max(1, Number(value) || 1);
        row.quantity = qty;
        row.totalCost = Math.round(qty * (Number(row.unitCost) || 0) * 100) / 100;
      } else if (field === "unitCost") {
        const cost = Math.max(0, Number(value) || 0);
        row.unitCost = cost;
        row.totalCost = Math.round((Number(row.quantity) || 1) * cost * 100) / 100;
      } else if (field === "serialNumbersInput") {
        row.serialNumbersInput = value;
        const parsed = String(value || "")
          .split(/[\n,;]+/)
          .map((s) => s.trim())
          .filter(Boolean);
        row.serialNumbers = parsed;
      } else {
        row[field] = value;
      }

      updated[index] = row;
      return updated;
    });
  };

  // Grand totals
  const totals = useMemo(() => {
    let totalItems = 0;
    let totalQuantity = 0;
    let totalCost = 0;
    let totalSerials = 0;

    items.forEach((row) => {
      if (row.item || row.itemName) {
        totalItems += 1;
        totalQuantity += Number(row.quantity) || 0;
        totalCost += Number(row.totalCost) || 0;
        totalSerials += (row.serialNumbers || []).length;
      }
    });

    return {
      totalItems,
      totalQuantity,
      totalCost: Math.round(totalCost * 100) / 100,
      totalSerials,
    };
  }, [items]);

  // Submission handler
  const handleSubmit = async () => {
    setErrorMsg("");

    if (!selectedCustomer?._id) {
      setErrorMsg("Please select a Customer first.");
      return;
    }

    if (!selectedProject?._id) {
      setErrorMsg("Please select a Project.");
      return;
    }

    const validItems = items.filter((r) => r.item && r.quantity > 0);
    if (validItems.length === 0) {
      setErrorMsg("Please add at least one inventory item to issue.");
      return;
    }

    for (const r of validItems) {
      if (r.quantity > r.availableStock) {
        setErrorMsg(
          `Quantity (${r.quantity}) for "${r.itemName}" exceeds available stock (${r.availableStock}).`
        );
        return;
      }
    }

    const serialTracker = new Set();
    for (const r of validItems) {
      for (const sn of r.serialNumbers || []) {
        const lower = sn.toLowerCase();
        if (serialTracker.has(lower)) {
          setErrorMsg(`Duplicate serial number found in transaction: "${sn}"`);
          return;
        }
        serialTracker.add(lower);
      }
    }

    const payload = {
      customerId: selectedCustomer._id,
      projectId: selectedProject._id,
      warehouse: selectedWarehouse || null,
      issueDate,
      notes,
      items: validItems.map((r) => ({
        item: r.item,
        itemName: r.itemName,
        sku: r.sku,
        category: r.category,
        brand: r.brand,
        modelNumber: r.modelNumber,
        unit: r.unit,
        quantity: Number(r.quantity),
        unitCost: Number(r.unitCost),
        totalCost: Number(r.totalCost),
        serialNumbers: r.serialNumbers || [],
        notes: r.notes || "",
      })),
    };

    setSubmitting(true);
    try {
      const response = await axiosInstance.post("/inventory/inventory-out", payload);
      const createdRecord = response?.data?.result || response?.data || {};
      if (onSuccess) onSuccess(createdRecord);
      onClose();
    } catch (err) {
      console.error("Failed to issue inventory", err);
      const backendMessage =
        err?.response?.data?.message || err?.message || "Failed to create Inventory Out record.";
      setErrorMsg(backendMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={submitting ? undefined : onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3.5,
          bgcolor: isDark ? "#0b1220" : "#ffffff",
          color: isDark ? "#f8fafc" : "#0f172a",
          border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e2e8f0",
          boxShadow: isDark ? "0 24px 60px rgba(0,0,0,0.8)" : "0 24px 60px rgba(15,23,42,0.18)",
        },
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          m: 0,
          p: { xs: 2, sm: 2.75 },
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0",
          bgcolor: isDark ? "rgba(255,255,255,0.02)" : "#f8fafc",
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.75}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2.5,
              display: "grid",
              placeItems: "center",
              bgcolor: alpha(INDIGO, isDark ? 0.22 : 0.1),
              color: isDark ? "#818cf8" : INDIGO,
            }}
          >
            <Inventory2 fontSize="medium" />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={900}>
              Issue Material (Inventory Out)
            </Typography>
            <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontWeight: 700 }}>
              Issue inventory items, solar panels, inverters & batteries directly to a Customer & Project
            </Typography>
          </Box>
        </Stack>
        <IconButton onClick={onClose} disabled={submitting} size="small" sx={{ color: isDark ? "#94a3b8" : "#64748b" }}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
        {loadingInitial ? (
          <Box sx={{ py: 8, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <CircularProgress size={36} sx={{ color: INDIGO }} />
            <Typography variant="body2" sx={{ color: isDark ? "#94a3b8" : "#64748b" }}>
              Loading customers, projects and inventory items...
            </Typography>
          </Box>
        ) : (
          <Stack spacing={3}>
            {errorMsg && (
              <Alert severity="error" onClose={() => setErrorMsg("")} sx={{ borderRadius: 2 }}>
                {errorMsg}
              </Alert>
            )}

            {/* Step 1 & 2: Customer & Project Selection Cards */}
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 2.5,
                bgcolor: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc",
                border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0",
              }}
            >
              <Typography variant="subtitle2" fontWeight={900} sx={{ mb: 2, color: isDark ? "#818cf8" : INDIGO, display: "flex", alignItems: "center", gap: 1 }}>
                <PersonOutline fontSize="small" /> Step 1 & 2: Customer & Project Assignment
              </Typography>
              <Grid container spacing={2.5}>
                {/* Customer Selector */}
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" fontWeight={800} sx={{ color: isDark ? "#94a3b8" : "#64748b", mb: 0.5, display: "block" }}>
                    CUSTOMER *
                  </Typography>
                  <Autocomplete
                    options={Array.isArray(customers) ? customers : []}
                    getOptionLabel={(c) => {
                      const name = [c.firstName, c.lastName].filter(Boolean).join(" ") || c.customerName || "Customer";
                      const phone = c.phone ? ` • ${c.phone}` : "";
                      const city = c.city ? ` (${c.city})` : "";
                      return `${name}${phone}${city}`;
                    }}
                    value={selectedCustomer}
                    onChange={(e, val) => setSelectedCustomer(val)}
                    isOptionEqualToValue={(option, val) => String(option._id) === String(val?._id)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Search Customer by Name, Phone, City..."
                        size="small"
                        sx={{
                          bgcolor: isDark ? "#0f172a" : "#ffffff",
                          borderRadius: 2,
                          "& .MuiOutlinedInput-notchedOutline": { borderColor: isDark ? "rgba(255,255,255,0.15)" : "#cbd5e1" },
                        }}
                      />
                    )}
                  />
                </Grid>

                {/* Project Selector */}
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" fontWeight={800} sx={{ color: isDark ? "#94a3b8" : "#64748b", mb: 0.5, display: "block" }}>
                    PROJECT *
                  </Typography>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    value={selectedProject ? String(selectedProject._id) : ""}
                    onChange={(e) => {
                      const proj = projects.find((p) => String(p._id) === e.target.value);
                      setSelectedProject(proj || null);
                    }}
                    disabled={!selectedCustomer || projects.length === 0}
                    placeholder="Select Customer's Project"
                    sx={{
                      bgcolor: isDark ? "#0f172a" : "#ffffff",
                      borderRadius: 2,
                      "& .MuiOutlinedInput-notchedOutline": { borderColor: isDark ? "rgba(255,255,255,0.15)" : "#cbd5e1" },
                    }}
                  >
                    {projects.map((p) => {
                      const pCode = p.projectCode ? `[${p.projectCode}] ` : "";
                      const pType = p.projectType || "Residential";
                      const pCap = p.plantCapacity ? ` • ${p.plantCapacity} kW` : "";
                      return (
                        <MenuItem key={p._id} value={String(p._id)}>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <TaskAlt fontSize="small" sx={{ color: SUCCESS }} />
                            <Typography variant="body2" fontWeight={800}>
                              {pCode}{pType}{pCap}
                            </Typography>
                          </Stack>
                        </MenuItem>
                      );
                    })}
                  </TextField>
                </Grid>

                {/* Inventory Source & Date */}
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" fontWeight={800} sx={{ color: isDark ? "#94a3b8" : "#64748b", mb: 0.5, display: "block" }}>
                    DISPATCH INVENTORY
                  </Typography>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    value={selectedWarehouse}
                    onChange={(e) => setSelectedWarehouse(e.target.value)}
                    sx={{
                      bgcolor: isDark ? "#0f172a" : "#ffffff",
                      borderRadius: 2,
                      "& .MuiOutlinedInput-notchedOutline": { borderColor: isDark ? "rgba(255,255,255,0.15)" : "#cbd5e1" },
                    }}
                  >
                    <MenuItem value="">
                      <em>Default Inventory Stock</em>
                    </MenuItem>
                    {warehouses.map((w) => (
                      <MenuItem key={w._id} value={w._id}>
                        {w.name} {w.code ? `(${w.code})` : ""}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" fontWeight={800} sx={{ color: isDark ? "#94a3b8" : "#64748b", mb: 0.5, display: "block" }}>
                    ISSUE DATE
                  </Typography>
                  <TextField
                    type="date"
                    fullWidth
                    size="small"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    sx={{
                      bgcolor: isDark ? "#0f172a" : "#ffffff",
                      borderRadius: 2,
                      "& .MuiOutlinedInput-notchedOutline": { borderColor: isDark ? "rgba(255,255,255,0.15)" : "#cbd5e1" },
                    }}
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Step 3: Item & Serial Number Entry Table */}
            <Box>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
                <Typography variant="subtitle2" fontWeight={900} sx={{ color: isDark ? "#818cf8" : INDIGO, display: "flex", alignItems: "center", gap: 1 }}>
                  <QrCodeScanner fontSize="small" /> Step 3: Material Items & Serial Numbers
                </Typography>
                <Button
                  startIcon={<Add />}
                  variant="outlined"
                  size="small"
                  onClick={handleAddItemRow}
                  sx={{
                    borderColor: isDark ? "rgba(99, 102, 241, 0.4)" : alpha(INDIGO, 0.4),
                    color: isDark ? "#818cf8" : INDIGO,
                    fontWeight: 800,
                    textTransform: "none",
                    borderRadius: 2,
                  }}
                >
                  Add Another Item
                </Button>
              </Stack>

              <Stack spacing={2}>
                {items.map((row, idx) => {
                  const selectedInvObj = inventoryItems.find((it) => String(it._id) === String(row.item));
                  const isOverStock = row.quantity > row.availableStock && row.item;

                  return (
                    <Paper
                      key={row._id || idx}
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: 2.5,
                        bgcolor: isDark ? "#101827" : "#ffffff",
                        border: isOverStock
                          ? `1.5px solid ${DANGER}`
                          : isDark
                          ? "1px solid rgba(255,255,255,0.1)"
                          : "1px solid #e2e8f0",
                      }}
                    >
                      <Grid container spacing={1.75} alignItems="flex-start">
                        {/* Item Picker */}
                        <Grid item xs={12} md={4.5}>
                          <Typography variant="caption" fontWeight={800} sx={{ color: isDark ? "#94a3b8" : "#64748b", mb: 0.5, display: "block" }}>
                            ITEM #{idx + 1} *
                          </Typography>
                          <Autocomplete
                            options={inventoryItems}
                            getOptionLabel={(it) => `${it.itemName}${it.brand ? ` (${it.brand})` : ""}${it.sku ? ` [${it.sku}]` : ""}`}
                            value={selectedInvObj || null}
                            onChange={(e, val) => handleItemSelect(idx, val)}
                            isOptionEqualToValue={(option, val) => String(option._id) === String(val?._id)}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                placeholder="Search inventory item..."
                                size="small"
                                sx={{
                                  bgcolor: isDark ? "#070b14" : "#f8fafc",
                                  borderRadius: 2,
                                  "& .MuiOutlinedInput-notchedOutline": { borderColor: isDark ? "rgba(255,255,255,0.15)" : "#cbd5e1" },
                                }}
                              />
                            )}
                          />
                          {row.item && (
                            <Stack direction="row" spacing={1} sx={{ mt: 0.75 }} flexWrap="wrap">
                              <Chip
                                size="small"
                                label={`Stock: ${row.availableStock} ${row.unit}`}
                                sx={{
                                  height: 22,
                                  fontSize: 11,
                                  fontWeight: 800,
                                  bgcolor: row.availableStock <= 0 ? alpha(DANGER, 0.15) : alpha(SUCCESS, 0.15),
                                  color: row.availableStock <= 0 ? DANGER : SUCCESS,
                                }}
                              />
                              {row.category && (
                                <Chip size="small" label={row.category} sx={{ height: 22, fontSize: 11, fontWeight: 700 }} />
                              )}
                              {row.modelNumber && (
                                <Chip size="small" label={`Model: ${row.modelNumber}`} sx={{ height: 22, fontSize: 11 }} />
                              )}
                            </Stack>
                          )}
                        </Grid>

                        {/* Quantity */}
                        <Grid item xs={6} sm={3} md={1.75}>
                          <Typography variant="caption" fontWeight={800} sx={{ color: isDark ? "#94a3b8" : "#64748b", mb: 0.5, display: "block" }}>
                            QUANTITY *
                          </Typography>
                          <TextField
                            type="number"
                            size="small"
                            fullWidth
                            value={row.quantity}
                            onChange={(e) => handleFieldChange(idx, "quantity", e.target.value)}
                            inputProps={{ min: 1 }}
                            sx={{
                              bgcolor: isDark ? "#070b14" : "#f8fafc",
                              borderRadius: 2,
                              "& .MuiOutlinedInput-notchedOutline": { borderColor: isDark ? "rgba(255,255,255,0.15)" : "#cbd5e1" },
                            }}
                          />
                        </Grid>

                        {/* Unit Cost */}
                        <Grid item xs={6} sm={3} md={2}>
                          <Typography variant="caption" fontWeight={800} sx={{ color: isDark ? "#94a3b8" : "#64748b", mb: 0.5, display: "block" }}>
                            UNIT COST (₹)
                          </Typography>
                          <TextField
                            type="number"
                            size="small"
                            fullWidth
                            value={row.unitCost}
                            onChange={(e) => handleFieldChange(idx, "unitCost", e.target.value)}
                            sx={{
                              bgcolor: isDark ? "#070b14" : "#f8fafc",
                              borderRadius: 2,
                              "& .MuiOutlinedInput-notchedOutline": { borderColor: isDark ? "rgba(255,255,255,0.15)" : "#cbd5e1" },
                            }}
                          />
                        </Grid>

                        {/* Line Total */}
                        <Grid item xs={10} sm={5} md={2.75}>
                          <Typography variant="caption" fontWeight={800} sx={{ color: isDark ? "#94a3b8" : "#64748b", mb: 0.5, display: "block" }}>
                            LINE TOTAL
                          </Typography>
                          <Box
                            sx={{
                              p: 1,
                              px: 1.5,
                              borderRadius: 2,
                              bgcolor: isDark ? "rgba(255,255,255,0.04)" : "#f1f5f9",
                              border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography variant="body2" fontWeight={900} sx={{ color: isDark ? "#38bdf8" : "#0284c7" }}>
                              {formatCurrency(row.totalCost)}
                            </Typography>
                            <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b" }}>
                              ({row.quantity} {row.unit})
                            </Typography>
                          </Box>
                        </Grid>

                        {/* Delete Action */}
                        <Grid item xs={2} sm={1} md={1} sx={{ display: "flex", justifyContent: "flex-end", pt: 3.5 }}>
                          <Tooltip title="Remove item">
                            <IconButton
                              size="small"
                              onClick={() => handleRemoveItemRow(idx)}
                              disabled={items.length <= 1}
                              sx={{ color: DANGER }}
                            >
                              <DeleteOutline fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Grid>

                        {/* Serial Numbers Input for Serialized Items */}
                        <Grid item xs={12}>
                          <Box
                            sx={{
                              mt: 0.5,
                              p: 1.5,
                              borderRadius: 2,
                              bgcolor: isDark ? "rgba(255,255,255,0.02)" : "rgba(241,245,249,0.7)",
                              border: isDark ? "1px dashed rgba(255,255,255,0.12)" : "1px dashed #cbd5e1",
                            }}
                          >
                            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.75 }}>
                              <Typography variant="caption" fontWeight={800} sx={{ color: isDark ? "#cbd5e1" : "#334155", display: "flex", alignItems: "center", gap: 0.75 }}>
                                <QrCodeScanner sx={{ fontSize: 15, color: INDIGO }} /> Serial Number(s) for Panels / Inverters / Batteries
                              </Typography>
                              <Chip
                                size="small"
                                label={`${(row.serialNumbers || []).length} of ${row.quantity} serials entered`}
                                sx={{
                                  height: 20,
                                  fontSize: 10.5,
                                  fontWeight: 800,
                                  bgcolor:
                                    (row.serialNumbers || []).length === Number(row.quantity)
                                      ? alpha(SUCCESS, 0.15)
                                      : alpha(WARNING, 0.15),
                                  color:
                                    (row.serialNumbers || []).length === Number(row.quantity)
                                      ? SUCCESS
                                      : WARNING,
                                }}
                              />
                            </Stack>
                            <TextField
                              fullWidth
                              size="small"
                              placeholder="Enter serial numbers separated by commas or lines (e.g. SN-WAA-1001, SN-WAA-1002, SN-WAA-1003...)"
                              value={row.serialNumbersInput || ""}
                              onChange={(e) => handleFieldChange(idx, "serialNumbersInput", e.target.value)}
                              multiline={row.quantity > 3}
                              minRows={row.quantity > 3 ? 2 : 1}
                              sx={{
                                bgcolor: isDark ? "#070b14" : "#ffffff",
                                borderRadius: 1.5,
                                "& .MuiOutlinedInput-notchedOutline": { borderColor: isDark ? "rgba(255,255,255,0.1)" : "#cbd5e1" },
                              }}
                            />
                            {/* Render Serial Tag Badges */}
                            {row.serialNumbers && row.serialNumbers.length > 0 && (
                              <Stack direction="row" spacing={0.75} flexWrap="wrap" sx={{ mt: 1 }}>
                                {row.serialNumbers.map((sn, snIdx) => (
                                  <Chip
                                    key={snIdx}
                                    size="small"
                                    label={sn}
                                    sx={{
                                      height: 22,
                                      fontSize: 11,
                                      bgcolor: isDark ? "rgba(99,102,241,0.2)" : alpha(INDIGO, 0.1),
                                      color: isDark ? "#818cf8" : INDIGO,
                                      fontWeight: 800,
                                    }}
                                  />
                                ))}
                              </Stack>
                            )}
                          </Box>
                        </Grid>
                      </Grid>
                    </Paper>
                  );
                })}
              </Stack>
            </Box>

            {/* Notes & Summary */}
            <Grid container spacing={2.5}>
              <Grid item xs={12} md={6}>
                <Typography variant="caption" fontWeight={800} sx={{ color: isDark ? "#94a3b8" : "#64748b", mb: 0.5, display: "block" }}>
                  DISPATCH / ISSUE NOTES
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  multiline
                  minRows={3}
                  placeholder="Enter dispatch notes, vehicle number, technician/installer name..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  sx={{
                    bgcolor: isDark ? "#0f172a" : "#ffffff",
                    borderRadius: 2,
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: isDark ? "rgba(255,255,255,0.15)" : "#cbd5e1" },
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.2,
                    borderRadius: 2.5,
                    bgcolor: isDark ? "linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(59,130,246,0.05) 100%)" : "linear-gradient(135deg, #eef2ff 0%, #f0fdf4 100%)",
                    border: isDark ? "1px solid rgba(99,102,241,0.3)" : "1px solid #c7d2fe",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                  }}
                >
                  <Typography variant="caption" fontWeight={900} sx={{ color: isDark ? "#818cf8" : INDIGO, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    TRANSACTION SUMMARY
                  </Typography>
                  <Divider sx={{ my: 1, borderColor: isDark ? "rgba(255,255,255,0.1)" : "#cbd5e1" }} />
                  <Stack spacing={0.75}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontWeight: 700 }}>Total Line Items:</Typography>
                      <Typography variant="body2" fontWeight={900}>{totals.totalItems}</Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontWeight: 700 }}>Total Equipment Units:</Typography>
                      <Typography variant="body2" fontWeight={900}>{totals.totalQuantity} Units</Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontWeight: 700 }}>Serialized Equipment Count:</Typography>
                      <Typography variant="body2" fontWeight={900}>{totals.totalSerials} Serials</Typography>
                    </Stack>
                    <Divider sx={{ my: 0.5, borderColor: isDark ? "rgba(255,255,255,0.1)" : "#cbd5e1" }} />
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="subtitle1" fontWeight={900} sx={{ color: isDark ? "#f8fafc" : "#0f172a" }}>
                        Total Inventory Cost:
                      </Typography>
                      <Typography variant="h6" fontWeight={900} sx={{ color: SUCCESS }}>
                        {formatCurrency(totals.totalCost)}
                      </Typography>
                    </Stack>
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
          </Stack>
        )}
      </DialogContent>

      {/* Actions */}
      <DialogActions
        sx={{
          px: { xs: 2, sm: 3 },
          py: 2,
          borderTop: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0",
          bgcolor: isDark ? "rgba(255,255,255,0.02)" : "#f8fafc",
        }}
      >
        <Button
          variant="outlined"
          onClick={onClose}
          disabled={submitting}
          sx={{
            borderColor: isDark ? "rgba(255,255,255,0.15)" : "#cbd5e1",
            color: isDark ? "#f8fafc" : "#1e293b",
            fontWeight: 800,
            borderRadius: 2,
            px: 2.5,
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting || loadingInitial || totals.totalItems === 0}
          startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <CheckCircle />}
          sx={{
            bgcolor: INDIGO,
            "&:hover": { bgcolor: "#4f46e5" },
            fontWeight: 900,
            borderRadius: 2,
            px: 3.5,
            py: 1,
            boxShadow: "0 10px 25px rgba(99,102,241,0.35)",
          }}
        >
          {submitting ? "Confirming & Issuing..." : `Confirm & Issue ${totals.totalQuantity} Material Units`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
