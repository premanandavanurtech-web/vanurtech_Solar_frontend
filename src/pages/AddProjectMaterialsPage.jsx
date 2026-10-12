import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Stack,
  Typography,
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
  CircularProgress,
  useTheme,
  alpha,
  Alert,
  Checkbox,
  InputAdornment,
  Snackbar,
  Breadcrumbs,
  Link,
  Tooltip,
} from "@mui/material";
import {
  GridView,
  BatteryChargingFull,
  Architecture,
  ShieldOutlined,
  SolarPower,
  SettingsInputComponent,
  BuildOutlined,
  EngineeringOutlined,
  Cable,
  Search,
  Clear,
  Check,
  MoreVert,
  Remove,
  Add,
  Refresh,
  HomeOutlined,
  NavigateNext,
  PersonOutline,
  ElectricBolt,
  Inventory2Outlined,
  AccountCircleOutlined,
} from "@mui/icons-material";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axiosInstance from "../utils/axiosConfig";

const PRIMARY_BLUE = "#1D70F7";
const HOVER_BLUE = "#1558c7";
const BG_PAGE = "#F0F4FA";

const formatCurrency = (amount) => {
  const num = Number(amount || 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(num) ? num : 0);
};

// Category metadata with icons and harmonious theme colors
const CATEGORY_META = {
  "all": { label: "All Categories", icon: GridView, color: "#1D70F7", bg: "#EBF3FF", text: "#1D70F7" },
  "Solar Batteries": { label: "Solar Batteries", icon: BatteryChargingFull, color: "#2563EB", bg: "#E0EDFF", text: "#2563EB" },
  "Mounting Structure": { label: "Mounting Structure", icon: Architecture, color: "#9333EA", bg: "#F3E8FF", text: "#9333EA" },
  "Protection Devices": { label: "Protection Devices", icon: ShieldOutlined, color: "#0284C7", bg: "#E0F2FE", text: "#0284C7" },
  "Waaree Solar Panels": { label: "Waaree Solar Panels", icon: SolarPower, color: "#0284C7", bg: "#E0F2FE", text: "#0284C7" },
  "Amaze Solar Inverters": { label: "Amaze Solar Inverters", icon: SettingsInputComponent, color: "#7C3AED", bg: "#EDE9FE", text: "#7C3AED" },
  "Solar Accessories": { label: "Solar Accessories", icon: BuildOutlined, color: "#6366F1", bg: "#EEF2FF", text: "#6366F1" },
  "Safety Equipment": { label: "Safety Equipment", icon: EngineeringOutlined, color: "#D97706", bg: "#FEF3C7", text: "#D97706" },
  "Earthing Materials": { label: "Earthing Materials", icon: Cable, color: "#059669", bg: "#D1FAE5", text: "#059669" },
  "Distribution Box": { label: "Distribution Box", icon: GridView, color: "#0D9488", bg: "#CCFBF1", text: "#0D9488" },
  "Inverters": { label: "Inverters", icon: SettingsInputComponent, color: "#7C3AED", bg: "#EDE9FE", text: "#7C3AED" },
  "Solar Panels": { label: "Solar Panels", icon: SolarPower, color: "#0284C7", bg: "#E0F2FE", text: "#0284C7" },
  "Battery": { label: "Battery", icon: BatteryChargingFull, color: "#2563EB", bg: "#E0EDFF", text: "#2563EB" },
  "Electrical": { label: "Electrical", icon: Cable, color: "#059669", bg: "#D1FAE5", text: "#059669" },
  "Accessories": { label: "Accessories", icon: BuildOutlined, color: "#6366F1", bg: "#EEF2FF", text: "#6366F1" },
  "Tools": { label: "Tools", icon: BuildOutlined, color: "#64748B", bg: "#F1F5F9", text: "#475569" },
};

const getCategoryMeta = (catName) => {
  if (!catName) return { label: "General", icon: GridView, color: "#64748B", bg: "#F1F5F9", text: "#475569" };
  if (CATEGORY_META[catName]) return CATEGORY_META[catName];
  const matchedKey = Object.keys(CATEGORY_META).find((k) => k.toLowerCase() === catName.toLowerCase());
  if (matchedKey) return CATEGORY_META[matchedKey];
  return { label: catName, icon: GridView, color: "#2563EB", bg: "#E0EDFF", text: "#2563EB" };
};

// Item SVG / visual representations matching the exact image
const renderItemVisual = (item, isDark) => {
  if (item.image) {
    return (
      <Box
        component="img"
        src={item.image}
        alt={item.itemName}
        sx={{
          width: 44,
          height: 44,
          borderRadius: 2,
          objectFit: "cover",
          border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#E2E8F0"}`,
          bgcolor: isDark ? "#1E293B" : "#FFFFFF",
        }}
      />
    );
  }

  const name = (item.itemName || "").toLowerCase();
  const cat = (item.category || "").toLowerCase();

  // Custom rendered visual box for realistic preview
  return (
    <Box
      sx={{
        width: 44,
        height: 44,
        borderRadius: 2,
        bgcolor: isDark ? "#1E293B" : "#FFFFFF",
        border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#E2E8F0"}`,
        display: "grid",
        placeItems: "center",
        flexShrink: 0,
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}
    >
      {name.includes("battery") || cat.includes("battery") ? (
        <BatteryChargingFull sx={{ fontSize: 24, color: "#3B82F6" }} />
      ) : name.includes("panel") || cat.includes("panel") ? (
        <SolarPower sx={{ fontSize: 24, color: "#0284C7" }} />
      ) : name.includes("inverter") || cat.includes("inverter") ? (
        <SettingsInputComponent sx={{ fontSize: 24, color: "#7C3AED" }} />
      ) : name.includes("structure") || name.includes("channel") || cat.includes("mounting") ? (
        <Architecture sx={{ fontSize: 24, color: "#9333EA" }} />
      ) : name.includes("spd") || name.includes("mcb") || name.includes("fuse") || cat.includes("protection") ? (
        <ShieldOutlined sx={{ fontSize: 24, color: "#0284C7" }} />
      ) : name.includes("arrester") || name.includes("safety") || cat.includes("safety") ? (
        <EngineeringOutlined sx={{ fontSize: 24, color: "#D97706" }} />
      ) : name.includes("earthing") || name.includes("rod") || name.includes("cable") || cat.includes("earthing") ? (
        <Cable sx={{ fontSize: 24, color: "#059669" }} />
      ) : (
        <Inventory2Outlined sx={{ fontSize: 22, color: "#64748B" }} />
      )}
    </Box>
  );
};

export default function AddProjectMaterialsPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [project, setProject] = useState(location.state?.project || null);
  const [loadingProject, setLoadingProject] = useState(!project);
  const [loadingItems, setLoadingItems] = useState(true);
  const [inventoryItems, setInventoryItems] = useState([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedToIssue, setSelectedToIssue] = useState({});
  const [submittingIssue, setSubmittingIssue] = useState(false);
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });

  // 1. Fetch Project Details if not in state
  const fetchProjectDetails = useCallback(async () => {
    if (project || !projectId) return;
    setLoadingProject(true);
    try {
      const res = await axiosInstance.get(`/lead/getLeadById/${projectId}`);
      const leadData = res?.data?.result?.lead || res?.data?.result || res?.data?.lead || null;
      if (leadData) setProject(leadData);
    } catch (err) {
      console.warn("Could not fetch project details for material page", err);
    } finally {
      setLoadingProject(false);
    }
  }, [project, projectId]);

  // 2. Fetch Available Warehouse Inventory Catalog
  const fetchInventoryCatalog = useCallback(async () => {
    setLoadingItems(true);
    try {
      const res = await axiosInstance.get("/inventory/items?limit=500&active=true");
      const raw = res?.data?.result?.items || res?.data?.items || res?.data?.result || [];
      const list = Array.isArray(raw) ? raw : [];
      setInventoryItems(list);
    } catch (err) {
      console.error("Failed to fetch inventory catalog", err);
      setToast({ open: true, message: "Failed to load inventory catalog items", severity: "error" });
    } finally {
      setLoadingItems(false);
    }
  }, []);

  useEffect(() => {
    fetchProjectDetails();
    fetchInventoryCatalog();
  }, [fetchProjectDetails, fetchInventoryCatalog]);

  // Categories list
  const categories = useMemo(() => {
    const list = [
      "all",
      "Solar Batteries",
      "Mounting Structure",
      "Protection Devices",
      "Waaree Solar Panels",
      "Amaze Solar Inverters",
      "Solar Accessories",
      "Safety Equipment",
      "Earthing Materials",
      "Distribution Box",
    ];
    // Also include any custom category found in inventory items
    inventoryItems.forEach((it) => {
      if (it.category && !list.includes(it.category)) list.push(it.category);
    });
    return list;
  }, [inventoryItems]);

  // Filtered inventory items based on search and category
  const filteredInventoryItems = useMemo(() => {
    return inventoryItems.filter((item) => {
      const matchesSearch =
        !searchQuery ||
        item.itemName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.brand?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat =
        selectedCategory === "all" ||
        item.category?.toLowerCase() === selectedCategory.toLowerCase() ||
        (selectedCategory === "Solar Batteries" && (item.category?.toLowerCase().includes("battery") || item.itemName?.toLowerCase().includes("battery"))) ||
        (selectedCategory === "Mounting Structure" && (item.category?.toLowerCase().includes("structure") || item.category?.toLowerCase().includes("mounting") || item.itemName?.toLowerCase().includes("channel"))) ||
        (selectedCategory === "Protection Devices" && (item.category?.toLowerCase().includes("protection") || item.itemName?.toLowerCase().includes("spd") || item.itemName?.toLowerCase().includes("mcb") || item.itemName?.toLowerCase().includes("fuse"))) ||
        (selectedCategory === "Waaree Solar Panels" && (item.category?.toLowerCase().includes("panel") || item.itemName?.toLowerCase().includes("panel") || item.brand?.toLowerCase().includes("waaree"))) ||
        (selectedCategory === "Amaze Solar Inverters" && (item.category?.toLowerCase().includes("inverter") || item.itemName?.toLowerCase().includes("inverter") || item.brand?.toLowerCase().includes("amaze"))) ||
        (selectedCategory === "Solar Accessories" && (item.category?.toLowerCase().includes("accessories") || item.itemName?.toLowerCase().includes("accessories"))) ||
        (selectedCategory === "Safety Equipment" && (item.category?.toLowerCase().includes("safety") || item.itemName?.toLowerCase().includes("arrester"))) ||
        (selectedCategory === "Earthing Materials" && (item.category?.toLowerCase().includes("earthing") || item.itemName?.toLowerCase().includes("earthing")));

      return matchesSearch && matchesCat;
    });
  }, [inventoryItems, searchQuery, selectedCategory]);

  // Select all toggle
  const allFilteredSelected = useMemo(() => {
    if (filteredInventoryItems.length === 0) return false;
    return filteredInventoryItems.every((it) => selectedToIssue[it._id]?.selected);
  }, [filteredInventoryItems, selectedToIssue]);

  const handleToggleSelectAll = () => {
    if (allFilteredSelected) {
      // Unselect all filtered items
      setSelectedToIssue((prev) => {
        const next = { ...prev };
        filteredInventoryItems.forEach((it) => {
          delete next[it._id];
        });
        return next;
      });
    } else {
      // Select all in-stock items
      setSelectedToIssue((prev) => {
        const next = { ...prev };
        filteredInventoryItems.forEach((it) => {
          const available = (it.warehouseStock || []).reduce((sum, r) => sum + (Number(r.availableQty) || 0), 0);
          if (available > 0) {
            next[it._id] = {
              selected: true,
              quantity: prev[it._id]?.quantity || 1,
              maxAvailable: available,
              unitCost: Number(it.pricing?.purchaseCost || it.pricing?.sellingPrice || 0),
              itemData: it,
            };
          }
        });
        return next;
      });
    }
  };

  // Toggle individual item
  const handleToggleSelect = (item) => {
    const itemId = item._id;
    const available = (item.warehouseStock || []).reduce((sum, r) => sum + (Number(r.availableQty) || 0), 0);
    const purchaseCost = Number(item.pricing?.purchaseCost || item.pricing?.sellingPrice || 0);

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

  // Quantity stepper change
  const handleQuantityChange = (item, newQty) => {
    const itemId = item._id;
    const available = (item.warehouseStock || []).reduce((sum, r) => sum + (Number(r.availableQty) || 0), 0);
    const validQty = Math.max(1, Math.min(available > 0 ? available : 1, Number(newQty) || 1));

    setSelectedToIssue((prev) => ({
      ...prev,
      [itemId]: {
        selected: true,
        quantity: validQty,
        maxAvailable: available,
        unitCost: Number(item.pricing?.purchaseCost || item.pricing?.sellingPrice || 0),
        itemData: item,
      },
    }));
  };

  // Selected array
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

  // Submit Issue to Project
  const handleConfirmIssue = async () => {
    if (selectedList.length === 0) {
      setToast({ open: true, message: "Please select at least one material to issue to this project.", severity: "warning" });
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
      const customerId = project?._id || projectId;
      const payload = {
        customerId: customerId,
        projectId: projectId,
        issueDate: new Date().toISOString(),
        notes: `Materials allocated to project ${project?.projectCode || project?.firstName || ""}`,
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

      await axiosInstance.post("/inventory/inventory-out", payload);
      setToast({
        open: true,
        message: "Materials confirmed and allocated to project successfully!",
        severity: "success",
      });

      // Navigate back
      setTimeout(() => {
        if (location.state?.from === "inventory-out") {
          navigate("/inventory/out");
        } else {
          navigate(`/projects/${projectId}`, {
            state: {
              project,
              projectStage: "inventory",
            },
          });
        }
      }, 600);
    } catch (err) {
      console.error("Failed to issue materials", err);
      const msg = err?.response?.data?.message || err?.message || "Failed to issue items to project.";
      setToast({ open: true, message: msg, severity: "error" });
    } finally {
      setSubmittingIssue(false);
    }
  };

  const projectCode = project?.projectCode || project?.leadId || projectId;
  const customerName = [project?.firstName, project?.lastName].filter(Boolean).join(" ") || project?.customerName || "Noor Fatma";
  const projectRequirement = project?.solarRequirement || project?.systemSize || project?.capacity || project?.plantCapacity ? `${project.plantCapacity || 1}KW On-Grid` : "ULA 1KW On-Grid";
  const assignedName = project?.assignedUser?.name || [project?.assignedUser?.firstName, project?.assignedUser?.lastName].filter(Boolean).join(" ") || "DJ";

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 3, md: 3.5 },
        bgcolor: isDark ? "#060A13" : BG_PAGE,
        minHeight: "100vh",
        pb: 14, // bottom bar clearance
      }}
    >
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

      {/* ========================================================================= */}
      {/* 1. TOP BREADCRUMB & PROJECT ID HEADER                                     */}
      {/* ========================================================================= */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2.5, px: 0.5 }}
      >
        <Breadcrumbs
          separator={<NavigateNext sx={{ fontSize: 16, color: "#94A3B8" }} />}
          aria-label="breadcrumb"
          sx={{ fontSize: 13, color: "#64748B" }}
        >
          <Link
            underline="hover"
            color="inherit"
            onClick={() => navigate("/dashboard")}
            sx={{ display: "flex", alignItems: "center", cursor: "pointer", color: "#3B82F6" }}
          >
            <HomeOutlined sx={{ fontSize: 18 }} />
          </Link>
          <Link
            underline="hover"
            color="inherit"
            onClick={() => navigate("/projects")}
            sx={{ cursor: "pointer", fontWeight: 500, color: isDark ? "#94A3B8" : "#64748B" }}
          >
            Projects
          </Link>
          <Link
            underline="hover"
            color="inherit"
            onClick={() => navigate(`/projects/${projectId}`, { state: { project, projectStage: "inventory" } })}
            sx={{ cursor: "pointer", fontWeight: 500, color: isDark ? "#94A3B8" : "#64748B" }}
          >
            {projectCode}
          </Link>
          <Typography sx={{ fontWeight: 700, color: isDark ? "#F8FAFC" : "#0F172A", fontSize: 13 }}>
            Add Materials
          </Typography>
        </Breadcrumbs>

        {/* Project ID Tag */}
        <Chip
          label={`Project ID: ${projectCode}`}
          size="small"
          sx={{
            height: 28,
            fontWeight: 700,
            fontSize: 12,
            bgcolor: isDark ? "rgba(37,99,235,0.15)" : "#E0EDFF",
            color: PRIMARY_BLUE,
            borderRadius: "8px",
            border: "none",
          }}
        />
      </Stack>

      {/* ========================================================================= */}
      {/* 2. HERO HEADER (3D Box Icon + Title + Meta Pills + Refresh)               */}
      {/* ========================================================================= */}
      <Stack
        direction={{ xs: "column", lg: "row" }}
        alignItems={{ xs: "flex-start", lg: "center" }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3, px: 0.5 }}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          {/* Blue 3D Cube Icon Box */}
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: "14px",
              bgcolor: isDark ? "rgba(37,99,235,0.2)" : "#E0EDFF",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            <Box
              component="svg"
              viewBox="0 0 24 24"
              sx={{ width: 28, height: 28, fill: PRIMARY_BLUE }}
            >
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke={PRIMARY_BLUE} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <path d="M12 12v10M2 7v10M22 7v10" stroke={PRIMARY_BLUE} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </Box>
          </Box>
          <Box>
            <Typography
              variant="h5"
              fontWeight={800}
              sx={{
                color: isDark ? "#F8FAFC" : "#0F172A",
                fontSize: { xs: "1.25rem", sm: "1.45rem" },
                letterSpacing: "-0.015em",
              }}
            >
              Select Items from Warehouse Inventory
            </Typography>
            <Typography variant="body2" sx={{ color: isDark ? "#94A3B8" : "#64748B", mt: 0.25 }}>
              Pick the required equipment for this project from inventory and click Confirm.
            </Typography>
          </Box>
        </Stack>

        {/* Right Action & Customer Pills */}
        <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap">
          {/* Customer Name Pill */}
          <Chip
            icon={<PersonOutline sx={{ fontSize: 16, color: "#3B82F6 !important" }} />}
            label={customerName}
            sx={{
              height: 36,
              borderRadius: "10px",
              fontWeight: 700,
              fontSize: 13,
              bgcolor: isDark ? "rgba(59,130,246,0.12)" : "#EBF3FF",
              color: "#2563EB",
              border: "none",
              px: 0.5,
            }}
          />
          {/* Requirement / Plant Capacity Pill */}
          <Chip
            icon={<ElectricBolt sx={{ fontSize: 15, color: "#D97706 !important" }} />}
            label={projectRequirement}
            sx={{
              height: 36,
              borderRadius: "10px",
              fontWeight: 700,
              fontSize: 13,
              bgcolor: isDark ? "rgba(245,158,11,0.12)" : "#FEF3C7",
              color: "#D97706",
              border: "none",
              px: 0.5,
            }}
          />
          {/* Assignee Pill */}
          <Chip
            icon={<AccountCircleOutlined sx={{ fontSize: 16, color: "#9333EA !important" }} />}
            label={assignedName}
            sx={{
              height: 36,
              borderRadius: "10px",
              fontWeight: 700,
              fontSize: 13,
              bgcolor: isDark ? "rgba(147,51,234,0.12)" : "#F3E8FF",
              color: "#9333EA",
              border: "none",
              px: 0.5,
            }}
          />
          {/* Refresh Stock Button */}
          <Button
            startIcon={<Refresh sx={{ fontSize: 18 }} />}
            onClick={fetchInventoryCatalog}
            sx={{
              height: 36,
              borderRadius: "10px",
              fontWeight: 700,
              fontSize: 13,
              bgcolor: isDark ? "#0F172A" : "#FFFFFF",
              color: isDark ? "#CBD5E1" : "#1E293B",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#E2E8F0"}`,
              textTransform: "none",
              px: 2,
              boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
              "&:hover": {
                bgcolor: isDark ? "#1E293B" : "#F8FAFC",
                borderColor: PRIMARY_BLUE,
              },
            }}
          >
            Refresh Stock
          </Button>
        </Stack>
      </Stack>

      {/* ========================================================================= */}
      {/* 3. MAIN WAREHOUSE INVENTORY CATALOG CARD                                  */}
      {/* ========================================================================= */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: "18px",
          bgcolor: isDark ? "#0B1220" : "#FFFFFF",
          border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#E2E8F0"}`,
          boxShadow: isDark ? "0 8px 32px rgba(0,0,0,0.5)" : "0 4px 20px rgba(15,23,42,0.04)",
          overflow: "hidden",
        }}
      >
        {/* Card Header: Grid Icon + Title + Pill Search Input */}
        <Box sx={{ p: { xs: 2.5, sm: 3 }, pb: 2 }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
            spacing={2}
          >
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: "12px",
                  bgcolor: PRIMARY_BLUE,
                  display: "grid",
                  placeItems: "center",
                  color: "#FFFFFF",
                  boxShadow: "0 4px 12px rgba(29,112,247,0.3)",
                }}
              >
                <GridView sx={{ fontSize: 22 }} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={800} sx={{ color: isDark ? "#F8FAFC" : "#0F172A", fontSize: "1.1rem" }}>
                  Warehouse Inventory Catalog
                </Typography>
                <Typography variant="caption" sx={{ color: isDark ? "#94A3B8" : "#64748B", fontWeight: 500 }}>
                  Showing {filteredInventoryItems.length} available items across categories
                </Typography>
              </Box>
            </Stack>

            {/* Pill Search Input */}
            <TextField
              size="small"
              placeholder="Search item, SKU, category, brand..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ fontSize: 19, color: "#94A3B8" }} />
                  </InputAdornment>
                ),
                endAdornment: searchQuery ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchQuery("")} sx={{ color: "#94A3B8" }}>
                      <Clear sx={{ fontSize: 16 }} />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
              sx={{
                width: { xs: "100%", sm: 340 },
                "& .MuiOutlinedInput-root": {
                  borderRadius: "30px",
                  bgcolor: isDark ? "#060A13" : "#F8FAFC",
                  fontSize: 13,
                  fontWeight: 500,
                  "& fieldset": { borderColor: isDark ? "rgba(255,255,255,0.12)" : "#E2E8F0" },
                  "&:hover fieldset": { borderColor: PRIMARY_BLUE },
                },
              }}
            />
          </Stack>

          {/* Category Filter Chips Bar */}
          <Stack
            direction="row"
            spacing={1.25}
            sx={{
              mt: 2.5,
              overflowX: "auto",
              pb: 1,
              "&::-webkit-scrollbar": { height: 4 },
              "&::-webkit-scrollbar-thumb": { bgcolor: isDark ? "rgba(255,255,255,0.15)" : "#CBD5E1", borderRadius: 2 },
            }}
          >
            {categories.map((catKey) => {
              const meta = getCategoryMeta(catKey);
              const isActive = selectedCategory === catKey;
              const IconComp = meta.icon;

              return (
                <Chip
                  key={catKey}
                  icon={<IconComp sx={{ fontSize: 16, color: isActive ? "#FFFFFF !important" : `${isDark ? "#94A3B8" : "#64748B"} !important` }} />}
                  label={meta.label}
                  clickable
                  onClick={() => setSelectedCategory(catKey)}
                  size="medium"
                  sx={{
                    height: 38,
                    borderRadius: "20px",
                    fontWeight: 700,
                    fontSize: 12.5,
                    bgcolor: isActive ? PRIMARY_BLUE : isDark ? "rgba(255,255,255,0.05)" : "#FFFFFF",
                    color: isActive ? "#FFFFFF" : isDark ? "#CBD5E1" : "#475569",
                    border: `1px solid ${isActive ? PRIMARY_BLUE : isDark ? "rgba(255,255,255,0.1)" : "#E2E8F0"}`,
                    boxShadow: isActive ? "0 4px 12px rgba(29,112,247,0.35)" : "0 1px 2px rgba(0,0,0,0.02)",
                    px: 0.5,
                    "&:hover": {
                      bgcolor: isActive ? HOVER_BLUE : isDark ? "rgba(255,255,255,0.1)" : "#F1F5F9",
                    },
                  }}
                />
              );
            })}
          </Stack>
        </Box>

        {/* Table Content */}
        {loadingItems ? (
          <Box sx={{ p: 8, textAlign: "center" }}>
            <CircularProgress size={36} sx={{ color: PRIMARY_BLUE, mb: 2 }} />
            <Typography variant="body2" sx={{ color: isDark ? "#94A3B8" : "#64748B", fontWeight: 700 }}>
              Loading warehouse stock items...
            </Typography>
          </Box>
        ) : filteredInventoryItems.length === 0 ? (
          <Box sx={{ p: 8, textAlign: "center" }}>
            <Typography variant="h6" fontWeight={800} sx={{ color: isDark ? "#F8FAFC" : "#0F172A", mb: 0.5 }}>
              No Inventory Items Found
            </Typography>
            <Typography variant="body2" sx={{ color: isDark ? "#94A3B8" : "#64748B" }}>
              Try adjusting your search query or selecting a different category.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ overflowX: "auto" }}>
            <Table size="medium">
              <TableHead>
                <TableRow sx={{ bgcolor: isDark ? "rgba(255,255,255,0.02)" : "#FAFCFF", borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#EDF2F7"}` }}>
                  <TableCell padding="checkbox" sx={{ py: 1.75, pl: 3 }}>
                    <Checkbox
                      checked={allFilteredSelected}
                      indeterminate={selectedList.length > 0 && !allFilteredSelected}
                      onChange={handleToggleSelectAll}
                      sx={{
                        color: "#CBD5E1",
                        "&.Mui-checked": { color: PRIMARY_BLUE },
                        "&.MuiCheckbox-indeterminate": { color: PRIMARY_BLUE },
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: 11, color: isDark ? "#94A3B8" : "#64748B", letterSpacing: "0.05em", py: 1.75 }}>
                    ITEM DETAILS ↕
                  </TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: 11, color: isDark ? "#94A3B8" : "#64748B", letterSpacing: "0.05em", py: 1.75 }}>
                    CATEGORY ↕
                  </TableCell>
                  <TableCell align="left" sx={{ fontWeight: 800, fontSize: 11, color: isDark ? "#94A3B8" : "#64748B", letterSpacing: "0.05em", py: 1.75 }}>
                    COST PRICE ↕
                  </TableCell>
                  <TableCell align="left" sx={{ fontWeight: 800, fontSize: 11, color: isDark ? "#94A3B8" : "#64748B", letterSpacing: "0.05em", py: 1.75 }}>
                    AVAILABLE STOCK ↕
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800, fontSize: 11, color: isDark ? "#94A3B8" : "#64748B", letterSpacing: "0.05em", py: 1.75 }}>
                    REQUIRED QTY FOR PROJECT ↕
                  </TableCell>
                  <TableCell align="center" sx={{ py: 1.75, pr: 3, width: 40 }} />
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
                  const catMeta = getCategoryMeta(item.category);
                  const CatIcon = catMeta.icon;

                  return (
                    <TableRow
                      key={item._id}
                      hover
                      sx={{
                        bgcolor: isSelected
                          ? isDark ? "rgba(29,112,247,0.08)" : "#F0F7FF"
                          : "transparent",
                        transition: "all 0.15s ease",
                        "&:last-child td, &:last-child th": { border: 0 },
                      }}
                    >
                      {/* Checkbox */}
                      <TableCell padding="checkbox" sx={{ py: 2, pl: 3 }}>
                        <Checkbox
                          checked={isSelected}
                          disabled={isOutOfStock}
                          onChange={() => handleToggleSelect(item)}
                          sx={{
                            color: "#CBD5E1",
                            "&.Mui-checked": { color: PRIMARY_BLUE },
                          }}
                        />
                      </TableCell>

                      {/* Item Details */}
                      <TableCell sx={{ py: 2 }}>
                        <Stack direction="row" alignItems="center" spacing={1.75}>
                          {renderItemVisual(item, isDark)}
                          <Box>
                            <Typography
                              variant="body2"
                              fontWeight={800}
                              sx={{ color: isDark ? "#F8FAFC" : "#0F172A", fontSize: "0.925rem" }}
                            >
                              {item.itemName}
                            </Typography>
                            {item.sku && (
                              <Typography
                                variant="caption"
                                sx={{ color: isDark ? "#94A3B8" : "#64748B", fontWeight: 600, display: "block", mt: 0.25 }}
                              >
                                SKU: {item.sku}
                              </Typography>
                            )}
                          </Box>
                        </Stack>
                      </TableCell>

                      {/* Category Badge */}
                      <TableCell sx={{ py: 2 }}>
                        <Chip
                          icon={<CatIcon sx={{ fontSize: 15, color: `${catMeta.text} !important` }} />}
                          label={item.category || "General"}
                          size="small"
                          sx={{
                            height: 28,
                            borderRadius: "14px",
                            fontWeight: 700,
                            fontSize: 12,
                            bgcolor: isDark ? alpha(catMeta.color, 0.15) : catMeta.bg,
                            color: catMeta.text,
                            border: "none",
                            px: 0.5,
                          }}
                        />
                      </TableCell>

                      {/* Cost Price */}
                      <TableCell align="left" sx={{ py: 2 }}>
                        <Typography
                          variant="body2"
                          fontWeight={800}
                          sx={{ color: isDark ? "#F8FAFC" : "#0F172A", fontSize: "0.95rem" }}
                        >
                          {formatCurrency(item.pricing?.purchaseCost || item.pricing?.sellingPrice)}
                        </Typography>
                      </TableCell>

                      {/* Available Stock Pill */}
                      <TableCell align="left" sx={{ py: 2 }}>
                        {isOutOfStock ? (
                          <Chip
                            label="● 0 (Out of stock)"
                            size="small"
                            sx={{
                              height: 26,
                              borderRadius: "13px",
                              fontWeight: 700,
                              fontSize: 11.5,
                              bgcolor: isDark ? "rgba(239,68,68,0.15)" : "#FEE2E2",
                              color: "#EF4444",
                              border: "none",
                              px: 0.5,
                            }}
                          />
                        ) : (
                          <Chip
                            label={`● ${stock} ${item.unit || "pcs"} available`}
                            size="small"
                            sx={{
                              height: 26,
                              borderRadius: "13px",
                              fontWeight: 700,
                              fontSize: 11.5,
                              bgcolor: isDark ? "rgba(16,185,129,0.15)" : "#D1FAE5",
                              color: "#059669",
                              border: "none",
                              px: 0.5,
                            }}
                          />
                        )}
                      </TableCell>

                      {/* Required Qty Stepper */}
                      <TableCell align="center" sx={{ py: 2 }}>
                        {isOutOfStock ? (
                          <Stack direction="row" alignItems="center" justifyContent="center" spacing={1.5}>
                            <Stack
                              direction="row"
                              alignItems="center"
                              sx={{
                                opacity: 0.4,
                                border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#E2E8F0"}`,
                                borderRadius: "20px",
                                px: 1,
                                py: 0.25,
                              }}
                            >
                              <IconButton size="small" disabled sx={{ p: 0.5 }}>
                                <Remove sx={{ fontSize: 14 }} />
                              </IconButton>
                              <Typography variant="body2" sx={{ width: 24, textAlign: "center", fontWeight: 700 }}>
                                1
                              </Typography>
                              <IconButton size="small" disabled sx={{ p: 0.5 }}>
                                <Add sx={{ fontSize: 14 }} />
                              </IconButton>
                            </Stack>
                            <Typography variant="caption" sx={{ color: "#EF4444", fontWeight: 800 }}>
                              Out of stock
                            </Typography>
                          </Stack>
                        ) : (
                          <Stack
                            direction="row"
                            alignItems="center"
                            justifyContent="center"
                            sx={{
                              display: "inline-flex",
                              border: `1.5px solid ${isSelected ? PRIMARY_BLUE : isDark ? "rgba(255,255,255,0.12)" : "#E2E8F0"}`,
                              borderRadius: "20px",
                              bgcolor: isDark ? "#060A13" : "#FFFFFF",
                              px: 0.5,
                              py: 0.25,
                            }}
                          >
                            <IconButton
                              size="small"
                              onClick={() => {
                                if (currentQty > 1) handleQuantityChange(item, currentQty - 1);
                              }}
                              disabled={!isSelected || currentQty <= 1}
                              sx={{
                                color: isSelected ? PRIMARY_BLUE : "#94A3B8",
                                p: 0.5,
                                "&:hover": { bgcolor: isDark ? "rgba(255,255,255,0.1)" : "#F1F5F9" },
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
                                style: {
                                  textAlign: "center",
                                  width: 32,
                                  padding: "2px 0",
                                  fontWeight: 800,
                                  fontSize: 13,
                                  color: isDark ? "#F8FAFC" : "#0F172A",
                                },
                              }}
                              sx={{
                                width: 36,
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
                                color: isSelected ? PRIMARY_BLUE : "#94A3B8",
                                p: 0.5,
                                "&:hover": { bgcolor: isDark ? "rgba(255,255,255,0.1)" : "#F1F5F9" },
                              }}
                            >
                              <Add sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Stack>
                        )}
                      </TableCell>

                      {/* 3-Dot Action Menu */}
                      <TableCell align="center" sx={{ py: 2, pr: 3 }}>
                        <IconButton size="small" sx={{ color: "#94A3B8" }}>
                          <MoreVert sx={{ fontSize: 18 }} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
        )}
      </Paper>

      {/* ========================================================================= */}
      {/* 4. FIXED BOTTOM ACTION BAR (Matching exact layout & button styling)       */}
      {/* ========================================================================= */}
      <Paper
        elevation={6}
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          py: 1.75,
          px: { xs: 2, md: 4 },
          bgcolor: isDark ? "#0B1220" : "#FFFFFF",
          borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#E2E8F0"}`,
          boxShadow: isDark ? "0 -8px 32px rgba(0,0,0,0.6)" : "0 -4px 20px rgba(0,0,0,0.06)",
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ maxWidth: 1440, mx: "auto" }}
        >
          {/* Left: Items count & selection summary */}
          <Typography variant="body2" sx={{ color: isDark ? "#94A3B8" : "#64748B", fontWeight: 600 }}>
            {filteredInventoryItems.length} items &nbsp;•&nbsp; {selectedList.length} selected
            {totalSelectedCost > 0 && (
              <span style={{ marginLeft: 12, fontWeight: 700, color: PRIMARY_BLUE }}>
                (Value: {formatCurrency(totalSelectedCost)})
              </span>
            )}
          </Typography>

          {/* Right: Cancel and Confirm Selection button */}
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Button
              variant="outlined"
              onClick={() => {
                if (location.state?.from === "inventory-out") {
                  navigate("/inventory/out");
                } else {
                  navigate(`/projects/${projectId}`, { state: { project, projectStage: "inventory" } });
                }
              }}
              sx={{
                height: 42,
                borderRadius: "21px",
                fontWeight: 700,
                fontSize: "0.9rem",
                textTransform: "none",
                px: 3,
                borderColor: isDark ? "rgba(255,255,255,0.15)" : "#E2E8F0",
                color: isDark ? "#CBD5E1" : "#475569",
                bgcolor: isDark ? "transparent" : "#FFFFFF",
                "&:hover": {
                  bgcolor: isDark ? "rgba(255,255,255,0.06)" : "#F8FAFC",
                  borderColor: "#CBD5E1",
                },
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              disabled={selectedList.length === 0 || submittingIssue}
              onClick={handleConfirmIssue}
              startIcon={submittingIssue ? <CircularProgress size={18} color="inherit" /> : <Check sx={{ fontSize: 18 }} />}
              sx={{
                height: 42,
                borderRadius: "21px",
                fontWeight: 700,
                fontSize: "0.925rem",
                textTransform: "none",
                px: 3.5,
                bgcolor: PRIMARY_BLUE,
                color: "#FFFFFF",
                boxShadow: "0 4px 14px rgba(29,112,247,0.35)",
                "&:hover": {
                  bgcolor: HOVER_BLUE,
                  boxShadow: "0 6px 20px rgba(29,112,247,0.45)",
                },
                "&.Mui-disabled": {
                  bgcolor: isDark ? "rgba(255,255,255,0.12)" : "#CBD5E1",
                  color: isDark ? "#64748B" : "#94A3B8",
                },
              }}
            >
              {submittingIssue ? "Issuing..." : "Confirm Selection"}
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
}
