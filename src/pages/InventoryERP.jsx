import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Menu,
  Paper,
  Snackbar,
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
  alpha,
  useTheme,
} from "@mui/material";
import {
  Add,
  ArrowBack,
  Check,
  Close,
  DeleteOutline,
  DownloadOutlined,
  EditOutlined,
  ErrorOutline,
  ExpandLess,
  ExpandMore,
  FileUploadOutlined,
  FilterAltOutlined,
  GridView,
  ImageOutlined,
  Inventory2,
  ListAlt,
  MoreVert,
  OutboxOutlined,
  QrCodeScanner,
  PersonOutline,
  TaskAlt,
  ContentCopy,
  Refresh,
  Search,
  Straighten,
  TrendingUp,
  UploadFileOutlined,
  VisibilityOutlined,
  ArrowForward,
  SolarPower,
  ElectricBolt,
  LocationOnOutlined,
  PhoneOutlined,
  CheckCircleOutline,
  HourglassEmpty,
} from "@mui/icons-material";
import { useLocation, useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosConfig";
import { toBackendAssetUrl } from "../utils/backendAssetUrl";
import InventoryOutDialog from "../components/InventoryOutDialog";
import SerialTraceabilityModal from "../components/SerialTraceabilityModal";

const BLUE = "#1e40af";
const INDIGO = "#4338ca";
const SUCCESS = "#16a34a";
const WARNING = "#f59e0b";
const DANGER = "#ef4444";
const TEXT = "#1e293b";
const MUTED = "#64748b";

const emptyCategory = {
  _id: "",
  category: "",
  description: "",
  subcategories: "",
  isActive: true,
};

const emptyItem = {
  _id: "",
  itemName: "",
  sku: "",
  category: "",
  subcategory: "",
  hsnSacCode: "",
  unit: "pcs",
  description: "",
  discountType: "Rs",
  discount: "",
  pricing: { purchaseCost: "", sellingPrice: "", taxPercent: "", igst: "", cgst: "", sgst: "", taxMode: "igst", autoSplitTax: true, totalGst: "" },
  tracking: { expiryDate: "" },
  dimensions: { length: "", width: "", height: "", unit: "cm" },
  weight: { value: "", unit: "kg" },
  warehouseStock: [],
  image: null,
  reorderLevel: 10,
  openingStock: "",
  maxStockLevel: "",
};

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });

const getResult = (response, fallback) => response?.data?.result ?? fallback;

const getAvailableStock = (item) =>
  item.availableStock ?? (item.warehouseStock || []).reduce((sum, row) => sum + (Number(row.availableQty) || 0), 0);

const getSoftCard = (isDark = false) => ({
  borderRadius: 2,
  border: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid #e5e7eb",
  bgcolor: isDark ? "#0b101c" : "#fff",
  boxShadow: isDark ? "0 8px 18px rgba(0,0,0,0.35)" : "0 8px 18px rgba(15,23,42,0.08)",
});

const getInputSx = (isDark = false) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: 1.5,
    minHeight: 45,
    bgcolor: isDark ? "#121929" : "#fff",
    color: isDark ? "#f8fafc" : "#0f172a",
    boxShadow: isDark ? "none" : "0 1px 2px rgba(15,23,42,0.04)",
    "& fieldset": {
      borderColor: isDark ? "rgba(255, 255, 255, 0.15)" : "#e5e7eb",
    },
    "&:hover fieldset": {
      borderColor: isDark ? "#60a5fa" : BLUE,
    },
    "&.Mui-focused fieldset": {
      borderColor: isDark ? "#60a5fa" : BLUE,
    },
  },
  "& .MuiInputBase-input": {
    color: isDark ? "#f8fafc" : "#0f172a",
  },
  "& .MuiInputBase-input::placeholder": {
    color: isDark ? "#94a3b8" : "#8a94a6",
    opacity: 1,
  },
  "& .MuiInputLabel-root": {
    color: isDark ? "#94a3b8" : "#8a94a6",
    fontWeight: 800,
    fontSize: 12,
    textTransform: "uppercase",
  },
  "& .MuiSvgIcon-root": {
    color: isDark ? "#94a3b8" : "action.active",
  },
});

const StatCard = ({ icon, label, value, color = BLUE, isDark = false, onClick, active = false }) => (
  <Card
    onClick={onClick}
    sx={{
      borderRadius: 3,
      boxShadow: active ? `0 0 0 2px ${color}` : 'none',
      border: active ? `2px solid ${color}` : isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
      backgroundColor: isDark ? '#0b101c' : '#fff',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'all 0.2s ease-in-out',
      '&:hover': onClick ? {
        transform: 'translateY(-3px)',
        boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.5)' : '0 8px 24px rgba(15,23,42,0.08)',
        borderColor: color,
      } : {},
    }}
  >
    <CardContent sx={{ p: 2.5 }}>
      <Stack direction="row" alignItems="center" spacing={2.5}>
        <Box sx={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          display: "grid",
          placeItems: "center",
          bgcolor: alpha(color, isDark ? 0.2 : 0.1),
          color: isDark && (color === BLUE || color === INDIGO) ? '#60a5fa' : color
        }}>
          {icon}
        </Box>
        <Box>
          <Typography color={isDark ? "#94a3b8" : MUTED} sx={{ fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {label}
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, color: isDark ? "#f8fafc" : TEXT, mt: 0.5, lineHeight: 1.2 }}>
            {value}
          </Typography>
        </Box>
      </Stack>
    </CardContent>
  </Card>
);

const PageIcon = ({ icon = <Inventory2 />, color = INDIGO }) => (
  <Box
    sx={{
      width: 50,
      height: 50,
      borderRadius: 2,
      display: "grid",
      placeItems: "center",
      bgcolor: color,
      color: "#fff",
      boxShadow: "0 10px 22px rgba(79,70,229,0.22)",
    }}
  >
    {icon}
  </Box>
);

const Field = ({ label, value, onChange, children, isDark = false, ...props }) => (
  <TextField
    label={label}
    value={value ?? ""}
    onChange={(event) => onChange(event.target.value)}
    fullWidth
    size="small"
    sx={{ ...getInputSx(isDark), ...props.sx }}
    {...props}
  >
    {children}
  </TextField>
);

const SectionCard = ({ icon, title, color, required, defaultOpen = true, isOpen, onToggle, children, isDark = false }) => {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isCardOpen = isOpen !== undefined ? isOpen : internalOpen;

  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalOpen((prev) => !prev);
    }
  };

  return (
    <Card sx={{ ...getSoftCard(isDark), boxShadow: "none" }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ px: 2.5, py: 2, cursor: "pointer" }}
        onClick={handleToggle}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box sx={{ width: 34, height: 34, borderRadius: 2, display: "grid", placeItems: "center", bgcolor: alpha(color, isDark ? 0.2 : 0.1), color: isDark && (color === BLUE || color === INDIGO) ? '#60a5fa' : color }}>
            {icon}
          </Box>
          <Typography fontWeight={900} color={isDark ? "#f8fafc" : TEXT}>
            {title}
          </Typography>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={1}>
          {required && <Chip size="small" label="REQUIRED" sx={{ bgcolor: alpha(BLUE, isDark ? 0.2 : 0.08), color: isDark ? "#60a5fa" : BLUE, fontWeight: 800 }} />}
          {isCardOpen ? <ExpandLess fontSize="small" sx={{ color: isDark ? "#94a3b8" : "inherit" }} /> : <ExpandMore fontSize="small" sx={{ color: isDark ? "#94a3b8" : "inherit" }} />}
        </Stack>
      </Stack>
      <Collapse in={isCardOpen}>
        <Divider sx={{ borderColor: isDark ? "rgba(255,255,255,0.08)" : undefined }} />
        <Box sx={{ p: 2.5 }}>{children}</Box>
      </Collapse>
    </Card>
  );
};

function InventoryERP() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const location = useLocation();
  const navigate = useNavigate();
  const sectionFromPath = location.pathname.split("/")[2] || "category";
  const [mode, setMode] = useState(sectionFromPath === "items" ? "items" : "categories");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const [itemFilter, setItemFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [warehouses, setWarehouses] = useState([]);
  const [summary, setSummary] = useState({});
  const [categoryForm, setCategoryForm] = useState(emptyCategory);
  const [itemForm, setItemForm] = useState(emptyItem);
  const [categoryMenuAnchor, setCategoryMenuAnchor] = useState(null);
  const [categoryMenuRow, setCategoryMenuRow] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: "", message: "", confirmLabel: "Delete", onConfirm: null });
  const [selectedCategoryForSub, setSelectedCategoryForSub] = useState(null);
  const [subcategorySearch, setSubcategorySearch] = useState("");
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });

  // Inventory Out State
  const [inventoryOutRecords, setInventoryOutRecords] = useState([]);
  const [inventoryOutPagination, setInventoryOutPagination] = useState({ page: 1, limit: 15, total: 0, pages: 1 });
  const [inventoryOutLoading, setInventoryOutLoading] = useState(false);
  const [inventoryOutSearch, setInventoryOutSearch] = useState("");
  const [inventoryOutStatus, setInventoryOutStatus] = useState("");
  const [inventoryOutPage, setInventoryOutPage] = useState(1);
  const [inventoryOutDialogOpen, setInventoryOutDialogOpen] = useState(false);
  const [serialTraceModalOpen, setSerialTraceModalOpen] = useState(false);
  const [selectedInventoryOutRecord, setSelectedInventoryOutRecord] = useState(null);
  const [cancelIssueRecord, setCancelIssueRecord] = useState(null);
  const [cancelReasonInput, setCancelReasonInput] = useState("");
  const [cancellingIssue, setCancellingIssue] = useState(false);

  // Select Converted Project for Add Materials Modal
  const [selectProjectModalOpen, setSelectProjectModalOpen] = useState(false);
  const [loadingConvertedProjects, setLoadingConvertedProjects] = useState(false);
  const [convertedProjects, setConvertedProjects] = useState([]);
  const [projectSearchQuery, setProjectSearchQuery] = useState("");

  const imagePreviewUrl = useMemo(() => {
    if (!itemForm.image) return null;
    if (itemForm.image instanceof File || itemForm.image instanceof Blob) {
      return URL.createObjectURL(itemForm.image);
    }
    if (typeof itemForm.image === "string") {
      if (itemForm.image.startsWith("http") || itemForm.image.startsWith("data:")) return itemForm.image;
      const baseUrl = process.env.REACT_APP_API_URL || "";
      return `${baseUrl}${itemForm.image.startsWith("/") ? "" : "/"}${itemForm.image}`;
    }
    return null;
  }, [itemForm.image]);

  const selectedCategory = useMemo(() => {
    return categories.find((entry) => entry.category === itemForm.category) || null;
  }, [categories, itemForm.category]);

  const [addSubcategoryModalOpen, setAddSubcategoryModalOpen] = useState(false);
  const [modalSubcategoryName, setModalSubcategoryName] = useState("");
  const [modalSubSaving, setModalSubSaving] = useState(false);

  const handleOpenAddSubcategoryModal = () => {
    if (!selectedCategory) {
      showToast("Please select a Category first", "error");
      return;
    }
    setModalSubcategoryName("");
    setAddSubcategoryModalOpen(true);
  };

  const handleCloseAddSubcategoryModal = () => {
    setAddSubcategoryModalOpen(false);
    setModalSubcategoryName("");
  };

  const handleSaveModalSubcategory = async () => {
    if (!selectedCategory) {
      showToast("Please select a Category first", "error");
      return;
    }
    const value = modalSubcategoryName.trim();
    if (!value) {
      showToast("Subcategory name is required", "error");
      return;
    }
    const current = selectedCategory.subcategories || [];
    if (current.some((entry) => entry.toLowerCase() === value.toLowerCase())) {
      showToast("Subcategory already exists", "error");
      updateItem("subcategory", value);
      handleCloseAddSubcategoryModal();
      return;
    }
    setModalSubSaving(true);
    try {
      const nextSubs = [...current, value];
      await updateCategorySubcategories(selectedCategory, nextSubs);
      updateItem("subcategory", value);
      showToast("Subcategory added successfully");
      handleCloseAddSubcategoryModal();
    } catch (error) {
      showToast("Failed to add subcategory", "error");
    } finally {
      setModalSubSaving(false);
    }
  };

  const handleQuickAddSubcategory = () => {
    handleOpenAddSubcategoryModal();
  };

  const [addCategoryModalOpen, setAddCategoryModalOpen] = useState(false);
  const [modalCategoryForm, setModalCategoryForm] = useState(emptyCategory);
  const [modalSaving, setModalSaving] = useState(false);

  const [viewMode, setViewMode] = useState("list");
  const [filterMenuAnchor, setFilterMenuAnchor] = useState(null);

  const [importModalOpen, setImportModalOpen] = useState(false);
  const [parsedImportItems, setParsedImportItems] = useState([]);
  const [importingBulk, setImportingBulk] = useState(false);
  const [importFileName, setImportFileName] = useState("");

  const handleDownloadSampleFormat = () => {
    const headers = "Item Name,SKU,Category,Subcategory,Selling Price (Rs),Cost Price (Rs),HSN/SAC Code,Unit,Opening Stock,Low Stock Alert\n";
    const sampleRows = [
      "Waaree 540W Mono PERC Panel,WAA-540W-MONO,Waaree Solar Panels,Mono PERC,14500,12000,8541,pcs,100,10",
      "Havells 5kW 3-Phase Inverter,HAV-5KW-3PH,Havells Solar Inverters,On-Grid String,42000,35000,8504,pcs,50,5",
      "Polycab 4sqmm DC Solar Cable,POL-4MM-DC,Cables & Wire,DC Cable,65,45,8544,meter,1000,100",
    ].join("\n");
    const blob = new Blob([headers + sampleRows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "inventory_items_sample_format.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Downloaded sample format CSV");
  };

  const exportCsvValue = (value) => {
    const text = String(value ?? "");
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };

  const handleExportItems = () => {
    const rows = visibleItems.map((item) => {
      const stock = getAvailableStock(item);
      return [
        item.itemName,
        item.sku,
        item.category,
        item.subcategory,
        item.pricing?.sellingPrice ?? 0,
        item.pricing?.purchaseCost ?? 0,
        item.discountType || "Rs",
        item.discount ?? 0,
        item.hsnSacCode,
        item.unit || "pcs",
        stock,
        item.reorderLevel ?? 0,
        item.maxStockLevel ?? item.warehouseStock?.[0]?.maxStockLevel ?? "",
        stock <= 0 ? "Out of Stock" : "Active",
        item.description,
      ].map(exportCsvValue).join(",");
    });

    const headers = [
      "Item Name",
      "SKU",
      "Category",
      "Subcategory",
      "Selling Price (Rs)",
      "Cost Price (Rs)",
      "Discount Type",
      "Discount",
      "HSN/SAC Code",
      "Unit",
      "Available Stock",
      "Low Stock Alert",
      "High Stock Limit",
      "Status",
      "Description",
    ].join(",");

    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.setAttribute("download", `inventory_items_${date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Exported ${rows.length} inventory items`);
  };

  const parseCSVText = (text) => {
    const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, "").toLowerCase());
    const parsedItems = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
      if (cols.length < 1 || !cols[0]) continue;

      const getVal = (possibleNames) => {
        const idx = headers.findIndex((h) => possibleNames.some((p) => h.includes(p)));
        return idx !== -1 ? cols[idx] : "";
      };

      const itemName = getVal(["item name", "item", "name", "title"]) || cols[0];
      let sku = getVal(["sku", "code"]) || cols[1] || "";
      if (!sku.trim()) {
        sku = `SKU-${Date.now().toString().slice(-6)}-${i}`;
      }
      const category = getVal(["category", "cat"]) || cols[2] || "General";
      const subcategory = getVal(["subcategory", "sub category", "sub"]) || cols[3] || "";
      const sellingPrice = Number(getVal(["selling price", "price", "selling"]) || cols[4] || 0);
      const purchaseCost = Number(getVal(["cost price", "cost", "purchase"]) || cols[5] || 0);
      const hsnSacCode = getVal(["hsn", "sac"]) || cols[6] || "";
      const unit = getVal(["unit"]) || cols[7] || "pcs";
      const openingStock = Number(getVal(["opening stock", "stock", "qty"]) || cols[8] || 0);
      const reorderLevel = Number(getVal(["low stock", "alert", "reorder"]) || cols[9] || 10);

      parsedItems.push({
        itemName,
        sku,
        category,
        subcategory,
        pricing: { sellingPrice, purchaseCost, taxPercent: 0 },
        hsnSacCode,
        unit,
        openingStock,
        reorderLevel,
      });
    }
    return parsedItems;
  };

  const handleCsvFileSelected = (file) => {
    if (!file) return;
    setImportFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      const parsed = parseCSVText(content);
      if (!parsed.length) {
        showToast("No valid items found in CSV file", "error");
      } else {
        setParsedImportItems(parsed);
        showToast(`Parsed ${parsed.length} items from CSV`);
      }
    };
    reader.readAsText(file);
  };

  const handleImportBulkItems = async () => {
    if (!parsedImportItems.length) {
      showToast("No items to import", "error");
      return;
    }
    setImportingBulk(true);
    let successCount = 0;

    try {
      for (const [idx, item] of parsedImportItems.entries()) {
        try {
          const finalSku = item.sku?.trim() || `SKU-${Date.now().toString().slice(-5)}-${idx + 1}`;

          const formData = new FormData();
          formData.append("itemName", item.itemName);
          formData.append("sku", finalSku);
          formData.append("category", item.category || "General");
          if (item.subcategory) formData.append("subcategory", item.subcategory);
          if (item.hsnSacCode) formData.append("hsnSacCode", item.hsnSacCode);
          formData.append("unit", item.unit || "pcs");
          formData.append("pricing", JSON.stringify(item.pricing || { sellingPrice: 0, purchaseCost: 0, taxPercent: 0 }));
          formData.append("reorderLevel", item.reorderLevel || 10);
          formData.append("openingStock", item.openingStock || 0);

          await axiosInstance.post("/inventory/items", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          successCount++;
        } catch (err) {
          try {
            const finalSku = item.sku?.trim() || `SKU-${Date.now().toString().slice(-5)}-${idx + 1}`;

            const jsonPayload = {
              itemName: item.itemName,
              sku: finalSku,
              category: item.category || "General",
              subcategory: item.subcategory || "",
              hsnSacCode: item.hsnSacCode || "",
              unit: item.unit || "pcs",
              pricing: item.pricing || { sellingPrice: 0, purchaseCost: 0, taxPercent: 0 },
              reorderLevel: item.reorderLevel || 10,
              openingStock: item.openingStock || 0,
            };

            await axiosInstance.post("/inventory/items", jsonPayload);
            successCount++;
          } catch (jsonErr) {
            console.error("Bulk item import failed:", item.itemName, jsonErr?.response?.data || jsonErr?.message);
          }
        }
      }
      await fetchItems();
      showToast(`Successfully imported ${successCount} inventory items!`);
      setImportModalOpen(false);
      setParsedImportItems([]);
      setImportFileName("");
    } catch (err) {
      showToast("Failed to complete bulk import", "error");
    } finally {
      setImportingBulk(false);
    }
  };

  const [openSection, setOpenSection] = useState("details");

  const toggleSection = (sectionId) => {
    setOpenSection((prev) => (prev === sectionId ? null : sectionId));
  };

  const showToast = useCallback((message, severity = "success") => {
    setToast({ open: true, message, severity });
  }, []);

  const openConfirmDialog = ({ title, message, confirmLabel = "Delete", onConfirm }) => {
    setConfirmDialog({ open: true, title, message, confirmLabel, onConfirm });
  };

  const closeConfirmDialog = () => {
    setConfirmDialog((prev) => ({ ...prev, open: false, onConfirm: null }));
  };

  const handleConfirmAction = async () => {
    const action = confirmDialog.onConfirm;
    closeConfirmDialog();
    if (action) await action();
  };

  const handleOpenAddCategoryModal = () => {
    setModalCategoryForm(emptyCategory);
    setAddCategoryModalOpen(true);
  };

  const handleCloseAddCategoryModal = () => {
    setAddCategoryModalOpen(false);
    setModalCategoryForm(emptyCategory);
  };

  const handleSaveModalCategory = async () => {
    if (!modalCategoryForm.category.trim()) {
      showToast("Category name is required", "error");
      return;
    }
    setModalSaving(true);
    try {
      const payload = {
        ...modalCategoryForm,
        subcategories: modalCategoryForm.subcategories
          .split(",")
          .map((entry) => entry.trim())
          .filter(Boolean),
      };
      const response = await axiosInstance.post("/inventory/categories", payload);
      const newCat = getResult(response, payload);
      const newCategoryName = newCat.category || modalCategoryForm.category;

      await fetchCategories();

      // Auto-select the newly created category in the item form
      updateItem("category", newCategoryName);
      updateItem("subcategory", "");

      showToast("Category created successfully");
      handleCloseAddCategoryModal();
    } catch (error) {
      showToast(error?.response?.data?.message || "Failed to create category", "error");
    } finally {
      setModalSaving(false);
    }
  };

  const setScreen = (targetMode) => {
    setMode(targetMode);
    if (targetMode === "categories") {
      navigate("/inventory/category");
    } else if (targetMode === "items") {
      navigate("/inventory/items");
    } else if (targetMode === "out") {
      navigate("/inventory/out");
    }
  };

  useEffect(() => {
    if (sectionFromPath === "items") {
      setMode("items");
    } else if (sectionFromPath === "out" || sectionFromPath === "inventory-out") {
      setMode("out");
    } else if (sectionFromPath === "trace" || sectionFromPath === "serial-trace") {
      setMode("out");
      setSerialTraceModalOpen(true);
    } else {
      setMode("categories");
    }
  }, [sectionFromPath]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await axiosInstance.get("/inventory/categories");
      setCategories(getResult(response, []));
    } catch (error) {
      showToast("Failed to fetch inventory categories", "error");
    }
  }, [showToast]);

  const fetchItems = useCallback(async () => {
    try {
      const response = await axiosInstance.get("/inventory/items", {
        params: {
          search,
          page,
          limit: pageSize,
          category: itemFilter && !["low", "out"].includes(itemFilter) ? itemFilter : undefined,
        },
      });
      const data = response.data?.result || {};
      setItems(data.items || []);
      setPagination(data.pagination || { page: 1, limit: pageSize, total: 0, pages: 1 });
    } catch (error) {
      showToast("Failed to fetch inventory items", "error");
    }
  }, [itemFilter, page, pageSize, search, showToast]);

  const fetchInventoryOut = useCallback(async () => {
    setInventoryOutLoading(true);
    try {
      const response = await axiosInstance.get("/inventory/inventory-out", {
        params: {
          search: inventoryOutSearch || undefined,
          status: inventoryOutStatus || undefined,
          page: inventoryOutPage,
          limit: 15,
        },
      });
      const data = response.data?.result || {};
      setInventoryOutRecords(data.records || []);
      setInventoryOutPagination(data.pagination || { page: 1, limit: 15, total: 0, pages: 1 });
    } catch (error) {
      showToast("Failed to fetch inventory out records", "error");
    } finally {
      setInventoryOutLoading(false);
    }
  }, [inventoryOutSearch, inventoryOutStatus, inventoryOutPage, showToast]);

  const handleCancelIssue = async () => {
    if (!cancelIssueRecord?._id) return;
    setCancellingIssue(true);
    try {
      await axiosInstance.post(`/inventory/inventory-out/${cancelIssueRecord._id}/cancel`, {
        cancelReason: cancelReasonInput || "Issue reversed by admin",
      });
      showToast("Inventory issue reversed & stock returned successfully!");
      setCancelIssueRecord(null);
      setCancelReasonInput("");
      fetchInventoryOut();
      fetchItems();
    } catch (error) {
      showToast(error?.response?.data?.message || "Failed to cancel issue", "error");
    } finally {
      setCancellingIssue(false);
    }
  };

  // Fetch only converted projects with EMPTY materials (not yet issued in active inventory-out)
  const fetchConvertedProjectsWithNoMaterials = useCallback(async () => {
    setLoadingConvertedProjects(true);
    try {
      const [leadsRes, worksheetsRes, allIssuesRes] = await Promise.allSettled([
        axiosInstance.get("/lead/getAll?limit=1000&sortBy=projectConvertedAt&sortOrder=desc"),
        axiosInstance.get("/installer-worksheets?limit=500"),
        axiosInstance.get("/inventory/inventory-out?limit=1000"),
      ]);

      const rawLeads = leadsRes.status === "fulfilled"
        ? (leadsRes.value?.data?.result?.leads || leadsRes.value?.data?.leads || leadsRes.value?.data?.result || [])
        : [];
      const allLeads = Array.isArray(rawLeads) ? rawLeads : [];

      const rawWorksheets = worksheetsRes.status === "fulfilled"
        ? (worksheetsRes.value?.data?.result || worksheetsRes.value?.data?.data || worksheetsRes.value?.data || [])
        : [];
      const worksheets = Array.isArray(rawWorksheets) ? rawWorksheets : [];

      const rawIssues = allIssuesRes.status === "fulfilled"
        ? (allIssuesRes.value?.data?.result?.records || allIssuesRes.value?.data?.records || allIssuesRes.value?.data?.result || [])
        : inventoryOutRecords;
      const allIssues = Array.isArray(rawIssues) ? rawIssues : [];

      // Active issues only (exclude cancelled)
      const activeIssues = allIssues.filter((r) => r.status !== "cancelled");

      // Filter converted leads
      const leadProjects = allLeads.filter(
        (l) => l.isProject || l.projectConvertedAt || String(l.status || "").toLowerCase() === "won" || String(l.stage || "").toLowerCase() === "won"
      );

      // Map worksheet projects
      const worksheetProjects = worksheets.flatMap((worksheet) => {
        const projs = Array.isArray(worksheet?.projects) ? worksheet.projects : [];
        return projs.map((project, index) => {
          const projectId = project?._id || `${worksheet?._id || "worksheet"}-${index}`;
          const customerName = project?.consumerName || project?.siteLocation || "APK Project";
          const createdDate = worksheet?.workDate || worksheet?.createdAt || new Date().toISOString();
          const d = new Date(createdDate);
          const dateStr = !isNaN(d.getTime())
            ? `${String(d.getDate()).padStart(2, "0")}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getFullYear()).slice(-2)}`
            : "010126";
          const projectCode = project?.projectCode || `APP-${dateStr}-${String(index + 1).padStart(2, "0")}`;

          return {
            ...project,
            _id: `worksheet-${worksheet?._id || "unknown"}-${projectId}`,
            source: "installerWorksheet",
            sourceLabel: "APK",
            worksheetId: worksheet?._id,
            worksheetProjectId: project?._id,
            projectCode,
            firstName: customerName,
            lastName: "",
            phone: project?.contactNo || "",
            city: project?.section || "",
            address: project?.address || project?.siteLocation || project?.gpsLocation?.address || "",
            email: "",
            capacity: project?.capacityKw ? `${project.capacityKw} KW` : "",
            solarRequirement: project?.capacityKw ? `${project.capacityKw} KW` : project?.projectType || "Solar Project",
            consumerAccountNo: project?.consumerAccountNo || "",
            assignedUser: project?.supervisor || worksheet?.user,
            supervisorName: [project?.supervisor?.firstName, project?.supervisor?.lastName].filter(Boolean).join(" "),
          };
        });
      });

      const allConverted = [...worksheetProjects, ...leadProjects];

      // Filter to keep ONLY projects that have NO active materials in inventory-out
      const emptyMaterialProjects = allConverted.filter((proj) => {
        const pId = String(proj._id || "");
        const pCode = String(proj.projectCode || "").trim().toLowerCase();
        const pWorksheetId = String(proj.worksheetProjectId || "");
        const pLeadId = String(proj.leadId || "");

        const hasMaterials = activeIssues.some((issue) => {
          const issueProjId = String(issue.project?._id || issue.project || "");
          const issueProjCode = String(issue.projectCode || "").trim().toLowerCase();
          const issueLeadId = String(issue.leadId || "");

          if (pId && issueProjId && pId === issueProjId) return true;
          if (pCode && issueProjCode && pCode === issueProjCode) return true;
          if (pWorksheetId && issueProjId && (issueProjId === pWorksheetId || issueProjId.includes(pWorksheetId))) return true;
          if (pLeadId && issueLeadId && (issueLeadId === pLeadId || issueProjId === pLeadId)) return true;
          return false;
        });

        return !hasMaterials;
      });

      setConvertedProjects(emptyMaterialProjects);
    } catch (err) {
      console.error("Failed to load converted projects with empty materials", err);
      showToast("Failed to load converted projects", "error");
    } finally {
      setLoadingConvertedProjects(false);
    }
  }, [inventoryOutRecords, showToast]);

  const handleSelectProjectToIssueMaterials = (proj) => {
    setSelectProjectModalOpen(false);
    navigate(`/projects/${proj._id}/issue-materials`, {
      state: { project: proj, from: "inventory-out" },
    });
  };

  const filteredConvertedProjects = useMemo(() => {
    if (!projectSearchQuery.trim()) return convertedProjects;
    const q = projectSearchQuery.toLowerCase();
    return convertedProjects.filter((p) => {
      const name = `${p.firstName || ""} ${p.lastName || ""} ${p.consumerName || ""}`.toLowerCase();
      const code = String(p.projectCode || p.leadId || "").toLowerCase();
      const phone = String(p.phone || p.contactNo || "").toLowerCase();
      const city = String(p.city || p.section || p.address || "").toLowerCase();
      const req = String(p.solarRequirement || p.capacity || p.projectType || "").toLowerCase();
      return name.includes(q) || code.includes(q) || phone.includes(q) || city.includes(q) || req.includes(q);
    });
  }, [convertedProjects, projectSearchQuery]);

  const fetchSummary = useCallback(async () => {
    try {
      const response = await axiosInstance.get("/inventory/summary");
      setSummary(getResult(response, {}));
    } catch (error) {
      // non-fatal
    }
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchCategories(), fetchItems()]);
    setLoading(false);
  }, [fetchCategories, fetchItems]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (mode === "out") {
      fetchInventoryOut();
    }
  }, [mode, fetchInventoryOut]);

  const startCreateCategory = () => {
    handleOpenAddCategoryModal();
  };

  const startEditCategory = (entry) => {
    setCategoryMenuAnchor(null);
    setModalCategoryForm({
      _id: entry._id,
      category: entry.category || "",
      description: entry.description || "",
      subcategories: (entry.subcategories || []).join(", "),
      isActive: entry.isActive !== false,
    });
    setAddCategoryModalOpen(true);
  };

  const openCategoryMenu = (event, entry) => {
    setCategoryMenuAnchor(event.currentTarget);
    setCategoryMenuRow(entry);
  };

  const closeCategoryMenu = () => {
    setCategoryMenuAnchor(null);
    setCategoryMenuRow(null);
  };

  const viewSubcategories = (entry) => {
    closeCategoryMenu();
    setSelectedCategoryForSub(entry);
    setSubcategorySearch("");
    setMode("subcategories");
  };

  const categoryRows = useMemo(
    () =>
      categories
        .map((entry) => ({
          ...entry,
          itemCount: items.filter((item) => item.category === entry.category).length,
          subcategoryCount: entry.subcategories?.length || 0,
        }))
        .filter((entry) => {
          const haystack = `${entry.category} ${entry.description || ""}`.toLowerCase();
          return !categorySearch || haystack.includes(categorySearch.toLowerCase());
        }),
    [categories, categorySearch, items],
  );

  const updateItem = (path, value) => {
    setItemForm((prev) => {
      const next = { ...prev };
      const keys = path.split(".");
      let cursor = next;
      keys.slice(0, -1).forEach((key) => {
        cursor[key] = { ...(cursor[key] || {}) };
        cursor = cursor[key];
      });
      cursor[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const saveCategory = async () => {
    setSaving(true);
    try {
      const payload = {
        ...categoryForm,
        subcategories: categoryForm.subcategories
          .split(",")
          .map((entry) => entry.trim())
          .filter(Boolean),
      };
      if (categoryForm._id) {
        await axiosInstance.put(`/inventory/categories/${categoryForm._id}`, payload);
      } else {
        await axiosInstance.post("/inventory/categories", payload);
      }
      setCategoryForm(emptyCategory);
      setScreen("categories");
      showToast(categoryForm._id ? "Category updated" : "Category created");
      fetchAll();
    } catch (error) {
      showToast(error?.response?.data?.message || "Failed to save category", "error");
    } finally {
      setSaving(false);
    }
  };

  const deleteCategory = async (entry) => {
    closeCategoryMenu();
    openConfirmDialog({
      title: "Delete Category",
      message: `Delete category "${entry.category}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await axiosInstance.delete(`/inventory/categories/${entry._id}`);
          showToast("Category deleted");
          fetchAll();
        } catch (error) {
          showToast(error?.response?.data?.message || "Failed to delete category", "error");
        }
      },
    });
  };

  const updateCategorySubcategories = async (category, nextSubcategories) => {
    if (!category?._id) return;
    try {
      const response = await axiosInstance.put(`/inventory/categories/${category._id}`, {
        category: category.category,
        description: category.description || "",
        isActive: category.isActive !== false,
        subcategories: nextSubcategories,
      });
      const updated = getResult(response, { ...category, subcategories: nextSubcategories });
      setCategories((prev) => prev.map((entry) => entry._id === category._id ? updated : entry));
      setSelectedCategoryForSub(updated);
      showToast("Subcategories updated");
    } catch (error) {
      showToast(error?.response?.data?.message || "Failed to update subcategories", "error");
    }
  };

  const addSubcategory = () => {
    const name = window.prompt("Subcategory name");
    const value = String(name || "").trim();
    if (!value || !selectedCategoryForSub) return;
    const current = selectedCategoryForSub.subcategories || [];
    if (current.some((entry) => entry.toLowerCase() === value.toLowerCase())) {
      showToast("Subcategory already exists", "error");
      return;
    }
    updateCategorySubcategories(selectedCategoryForSub, [...current, value]);
  };

  const editSubcategory = (oldName) => {
    const name = window.prompt("Subcategory name", oldName);
    const value = String(name || "").trim();
    if (!value || !selectedCategoryForSub) return;
    const current = selectedCategoryForSub.subcategories || [];
    if (current.some((entry) => entry !== oldName && entry.toLowerCase() === value.toLowerCase())) {
      showToast("Subcategory already exists", "error");
      return;
    }
    updateCategorySubcategories(selectedCategoryForSub, current.map((entry) => entry === oldName ? value : entry));
  };

  const deleteSubcategory = (name) => {
    if (!selectedCategoryForSub) return;
    openConfirmDialog({
      title: "Delete Subcategory",
      message: `Delete subcategory "${name}"?`,
      onConfirm: async () => {
        await updateCategorySubcategories(selectedCategoryForSub, (selectedCategoryForSub.subcategories || []).filter((entry) => entry !== name));
      },
    });
  };

  const buildItemPayload = () => {
    const formData = new FormData();
    const append = (key, value) => {
      if (value !== undefined && value !== null && value !== "") formData.append(key, value);
    };
    append("itemName", itemForm.itemName);
    append("sku", itemForm.sku);
    append("category", itemForm.category);
    append("subcategory", itemForm.subcategory);
    append("hsnSacCode", itemForm.hsnSacCode);
    append("unit", itemForm.unit);
    append("description", itemForm.description);
    append("openingStock", itemForm.openingStock);
    append("reorderLevel", itemForm.reorderLevel);
    append("maxStockLevel", itemForm.maxStockLevel);
    append("discountType", itemForm.discountType);
    append("discount", itemForm.discount);
    append("pricing", JSON.stringify(itemForm.pricing));
    append("tracking", JSON.stringify(itemForm.tracking));
    append("dimensions", JSON.stringify(itemForm.dimensions));
    append("weight", JSON.stringify(itemForm.weight));
    if (itemForm.image) formData.append("image", itemForm.image);
    return formData;
  };

  const saveItem = async () => {
    if (!itemForm.itemName.trim()) {
      showToast("Item Name is required", "error");
      setOpenSection("details");
      return;
    }
    if (!itemForm.category) {
      showToast("Item Category is required", "error");
      setOpenSection("details");
      return;
    }
    const stockVal = itemForm.openingStock !== undefined && itemForm.openingStock !== null ? String(itemForm.openingStock).trim() : "";
    if (stockVal === "") {
      showToast("Opening Stock is required", "error");
      setOpenSection("inventory");
      return;
    }
    const priceVal = itemForm.pricing?.sellingPrice !== undefined && itemForm.pricing?.sellingPrice !== null ? String(itemForm.pricing.sellingPrice).trim() : "";
    if (priceVal === "") {
      showToast("Price (Selling Price) is required", "error");
      setOpenSection("pricing");
      return;
    }
    setSaving(true);
    try {
      if (itemForm._id) {
        await axiosInstance.put(`/inventory/items/${itemForm._id}`, buildItemPayload(), { headers: { "Content-Type": "multipart/form-data" } });
      } else {
        await axiosInstance.post("/inventory/items", buildItemPayload(), { headers: { "Content-Type": "multipart/form-data" } });
      }
      setItemForm(emptyItem);
      setScreen("items");
      showToast(itemForm._id ? "Inventory item updated" : "Inventory item created");
      fetchAll();
    } catch (error) {
      const message = error?.response?.data?.message || error?.response?.data?.error || error?.message || "Failed to create item";
      showToast(message, "error");
    } finally {
      setSaving(false);
    }
  };

  const startEditItem = (item) => {
    const stockRows = item.warehouseStock || [];
    const primaryStock = stockRows[0] || {};
    const currentStock = item.openingStock ?? primaryStock.availableQty ?? getAvailableStock(item) ?? "";
    setItemForm({
      ...emptyItem,
      ...item,
      discount: item.discount ?? "",
      pricing: {
        ...emptyItem.pricing,
        ...(item.pricing || {}),
        purchaseCost: item.pricing?.purchaseCost ?? "",
        sellingPrice: item.pricing?.sellingPrice ?? "",
      },
      tracking: {
        ...emptyItem.tracking,
        ...(item.tracking || {}),
        expiryDate: item.tracking?.expiryDate ? String(item.tracking.expiryDate).slice(0, 10) : "",
      },
      dimensions: { ...emptyItem.dimensions, ...(item.dimensions || {}) },
      weight: { ...emptyItem.weight, ...(item.weight || {}) },
      image: item.image || null,
      openingStock: Number.isFinite(Number(currentStock)) && currentStock !== "" ? currentStock : "",
      maxStockLevel: item.maxStockLevel ?? primaryStock.maxStockLevel ?? "",
    });
    setMode("create-item");
  };

  const openItemView = (item) => {
    setViewItem(item);
  };

  const deleteItem = async (item) => {
    openConfirmDialog({
      title: "Delete Item",
      message: `Delete item "${item.itemName}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await axiosInstance.delete(`/inventory/items/${item._id}`);
          showToast("Inventory item deleted");
          fetchAll();
        } catch (error) {
          showToast(error?.response?.data?.message || "Failed to delete item", "error");
        }
      },
    });
  };

  const realSummaryStats = useMemo(() => {
    const totalCount = pagination.total || items.length;
    let totalVal = 0;
    let lowCount = 0;
    let outCount = 0;

    items.forEach((item) => {
      const stock = getAvailableStock(item);
      const price = Number(item.pricing?.sellingPrice || 0);

      if (stock > 0 && price > 0) {
        totalVal += stock * price;
      }

      if (stock <= 0) {
        outCount++;
      } else if (stock <= Number(item.reorderLevel || 10)) {
        lowCount++;
      }
    });

    return {
      totalItems: totalCount,
      totalValue: totalVal,
      lowStock: lowCount,
      outOfStock: outCount,
    };
  }, [items, pagination.total]);

  const visibleItems = useMemo(() => {
    if (itemFilter === "low") {
      return items.filter((item) => {
        const stock = getAvailableStock(item);
        return stock > 0 && stock <= Number(item.reorderLevel || 0);
      });
    }
    if (itemFilter === "out") return items.filter((item) => getAvailableStock(item) <= 0);
    return items;
  }, [itemFilter, items]);

  const categoryModalNode = (
    <Dialog
      open={addCategoryModalOpen}
      onClose={handleCloseAddCategoryModal}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          bgcolor: isDark ? "#0b101c" : "#ffffff",
          color: isDark ? "#f8fafc" : "#0f172a",
          backgroundImage: "none",
          border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e5e7eb",
        },
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2.5, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box sx={{ width: 36, height: 36, borderRadius: 2, display: "grid", placeItems: "center", bgcolor: alpha(BLUE, isDark ? 0.2 : 0.08), color: isDark ? "#60a5fa" : BLUE }}>
            <Inventory2 fontSize="small" />
          </Box>
          <Typography variant="h6" fontWeight={900}>
            {modalCategoryForm._id ? "Edit Category" : "Create New Category"}
          </Typography>
        </Stack>
        <IconButton onClick={handleCloseAddCategoryModal} size="small" sx={{ color: isDark ? "#94a3b8" : "inherit" }}>
          <Close />
        </IconButton>
      </DialogTitle>
      <Divider sx={{ borderColor: isDark ? "rgba(255,255,255,0.08)" : undefined }} />
      <DialogContent sx={{ p: 3 }}>
        <Stack spacing={2.5}>
          <Field
            isDark={isDark}
            label="Category Name *"
            placeholder="e.g. Solar Panels, Inverters"
            value={modalCategoryForm.category}
            onChange={(value) => setModalCategoryForm((prev) => ({ ...prev, category: value }))}
          />
          <Field
            isDark={isDark}
            label="Subcategories"
            placeholder="Enter subcategories separated by commas (e.g. Monocrystalline, Polycrystalline)"
            value={modalCategoryForm.subcategories}
            onChange={(value) => setModalCategoryForm((prev) => ({ ...prev, subcategories: value }))}
          />
          <Field
            isDark={isDark}
            label="Description"
            placeholder="Category description (optional)"
            multiline
            minRows={2}
            value={modalCategoryForm.description}
            onChange={(value) => setModalCategoryForm((prev) => ({ ...prev, description: value }))}
          />
          <Stack direction="row" alignItems="center" spacing={1}>
            <Checkbox
              checked={modalCategoryForm.isActive}
              onChange={(event) => setModalCategoryForm((prev) => ({ ...prev, isActive: event.target.checked }))}
              sx={{ color: isDark ? "#60a5fa" : BLUE, "&.Mui-checked": { color: isDark ? "#60a5fa" : BLUE } }}
            />
            <Typography fontWeight={800} sx={{ color: isDark ? "#f8fafc" : "#0f172a" }}>Active Category</Typography>
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
        <Button variant="outlined" onClick={handleCloseAddCategoryModal} sx={{ borderColor: isDark ? "rgba(255,255,255,0.15)" : "#e5e7eb", color: isDark ? "#f8fafc" : "#000", fontWeight: 800 }}>
          Cancel
        </Button>
        <Button startIcon={<Check />} variant="contained" onClick={handleSaveModalCategory} disabled={modalSaving} sx={{ bgcolor: INDIGO, fontWeight: 900, px: 2.5 }}>
          {modalSaving ? "Saving..." : modalCategoryForm._id ? "Update Category" : "Create Category"}
        </Button>
      </DialogActions>
    </Dialog>
  );

  const subCategoryModalNode = (
    <Dialog
      open={addSubcategoryModalOpen}
      onClose={handleCloseAddSubcategoryModal}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          bgcolor: isDark ? "#0b101c" : "#ffffff",
          color: isDark ? "#f8fafc" : "#0f172a",
          backgroundImage: "none",
          border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e5e7eb",
        },
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2.5, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box sx={{ width: 36, height: 36, borderRadius: 2, display: "grid", placeItems: "center", bgcolor: alpha(BLUE, isDark ? 0.2 : 0.08), color: isDark ? "#60a5fa" : BLUE }}>
            <ListAlt fontSize="small" />
          </Box>
          <Typography variant="h6" fontWeight={900}>
            Add Subcategory
          </Typography>
        </Stack>
        <IconButton onClick={handleCloseAddSubcategoryModal} size="small" sx={{ color: isDark ? "#94a3b8" : "inherit" }}>
          <Close />
        </IconButton>
      </DialogTitle>
      <Divider sx={{ borderColor: isDark ? "rgba(255,255,255,0.08)" : undefined }} />
      <DialogContent sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Typography variant="body2" color={isDark ? "#cbd5e1" : MUTED} fontWeight={800}>
            Category: <Box component="span" sx={{ color: isDark ? "#60a5fa" : BLUE, fontWeight: 900 }}>{selectedCategory?.category || "-"}</Box>
          </Typography>
          <Field
            isDark={isDark}
            label="Subcategory Name *"
            placeholder="e.g. Monocrystalline, Polycrystalline"
            value={modalSubcategoryName}
            onChange={(value) => setModalSubcategoryName(value)}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
        <Button variant="outlined" onClick={handleCloseAddSubcategoryModal} sx={{ borderColor: isDark ? "rgba(255,255,255,0.15)" : "#e5e7eb", color: isDark ? "#f8fafc" : "#000", fontWeight: 800 }}>
          Cancel
        </Button>
        <Button startIcon={<Check />} variant="contained" onClick={handleSaveModalSubcategory} disabled={modalSubSaving} sx={{ bgcolor: INDIGO, fontWeight: 900, px: 2.5 }}>
          {modalSubSaving ? "Saving..." : "Add Subcategory"}
        </Button>
      </DialogActions>
    </Dialog>
  );

  const importModalNode = (
    <Dialog
      open={importModalOpen}
      onClose={() => {
        if (!importingBulk) {
          setImportModalOpen(false);
          setParsedImportItems([]);
          setImportFileName("");
        }
      }}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          bgcolor: isDark ? "#0b101c" : "#ffffff",
          color: isDark ? "#f8fafc" : "#0f172a",
          backgroundImage: "none",
          border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e5e7eb",
        },
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2.5, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box sx={{ width: 38, height: 38, borderRadius: 2, display: "grid", placeItems: "center", bgcolor: alpha(INDIGO, isDark ? 0.2 : 0.08), color: isDark ? "#60a5fa" : INDIGO }}>
            <FileUploadOutlined fontSize="small" />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={900}>
              Import Bulk Inventory Items
            </Typography>
            <Typography variant="caption" color={isDark ? "#94a3b8" : MUTED}>
              Upload a CSV file to import multiple inventory items
            </Typography>
          </Box>
        </Stack>
        <IconButton
          onClick={() => {
            if (!importingBulk) setImportModalOpen(false);
          }}
          size="small"
          sx={{ color: isDark ? "#94a3b8" : "inherit" }}
        >
          <Close />
        </IconButton>
      </DialogTitle>
      <Divider sx={{ borderColor: isDark ? "rgba(255,255,255,0.08)" : undefined }} />
      <DialogContent sx={{ p: 3 }}>
        <Stack spacing={2.5}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 2.5,
              bgcolor: isDark ? "rgba(30, 41, 59, 0.6)" : "#f8fafc",
              border: `1px dashed ${isDark ? "rgba(255,255,255,0.18)" : "#cbd5e1"}`,
              textAlign: "center",
            }}
          >
            <Typography variant="subtitle2" fontWeight={800} color={isDark ? "#f8fafc" : "#1e293b"} sx={{ mb: 0.5 }}>
              Need the CSV Template Format?
            </Typography>
            <Typography variant="body2" color={isDark ? "#94a3b8" : MUTED} sx={{ mb: 1.5 }}>
              Download our sample CSV template pre-configured with required columns (Item Name, SKU, Category, Subcategory, Price, Stock).
            </Typography>
            <Button
              startIcon={<DownloadOutlined />}
              variant="outlined"
              onClick={handleDownloadSampleFormat}
              sx={{ borderColor: isDark ? "#60a5fa" : BLUE, color: isDark ? "#60a5fa" : BLUE, fontWeight: 800, textTransform: "none" }}
            >
              Download Sample CSV Format
            </Button>
          </Paper>

          <Box
            sx={{
              border: `2px dashed ${isDark ? "#3b82f6" : INDIGO}`,
              borderRadius: 3,
              p: 3.5,
              textAlign: "center",
              bgcolor: isDark ? "rgba(59, 130, 246, 0.04)" : alpha(INDIGO, 0.02),
            }}
          >
            <FileUploadOutlined sx={{ fontSize: 42, color: isDark ? "#60a5fa" : INDIGO, mb: 1 }} />
            <Typography fontWeight={900} variant="subtitle1" color={isDark ? "#f8fafc" : "#0f172a"}>
              {importFileName ? `Selected: ${importFileName}` : "Upload CSV File"}
            </Typography>
            <Typography variant="caption" color={isDark ? "#94a3b8" : MUTED} display="block" sx={{ my: 1 }}>
              Select a .csv file formatted with your product inventory columns
            </Typography>
            <Button
              component="label"
              variant="contained"
              sx={{ bgcolor: INDIGO, borderRadius: 2, fontWeight: 900, mt: 1 }}
            >
              Browse CSV File
              <input
                hidden
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleCsvFileSelected(e.target.files[0]);
                  }
                }}
              />
            </Button>
          </Box>

          {parsedImportItems.length > 0 && (
            <Box>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
                <Typography fontWeight={900} variant="subtitle2" color={isDark ? "#f8fafc" : "#0f172a"}>
                  Parsed Items Preview ({parsedImportItems.length})
                </Typography>
                <Chip size="small" label={`${parsedImportItems.length} items ready`} color="success" sx={{ fontWeight: 800 }} />
              </Stack>
              <TableContainer component={Paper} elevation={0} sx={{ maxHeight: 220, border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e2e8f0" }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Item Name</TableCell>
                      <TableCell>SKU</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Subcategory</TableCell>
                      <TableCell>Price</TableCell>
                      <TableCell>Stock</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {parsedImportItems.slice(0, 15).map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell><Typography variant="body2" fontWeight={800}>{row.itemName}</Typography></TableCell>
                        <TableCell>{row.sku || "-"}</TableCell>
                        <TableCell>{row.category}</TableCell>
                        <TableCell>{row.subcategory || "-"}</TableCell>
                        <TableCell>₹{(row.pricing?.sellingPrice || 0).toLocaleString("en-IN")}</TableCell>
                        <TableCell>{row.openingStock || 0} pcs</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              {parsedImportItems.length > 15 && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                  + showing 15 of {parsedImportItems.length} parsed items
                </Typography>
              )}
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
        <Button
          variant="outlined"
          onClick={() => setImportModalOpen(false)}
          disabled={importingBulk}
          sx={{ borderColor: isDark ? "rgba(255,255,255,0.15)" : "#e5e7eb", color: isDark ? "#f8fafc" : "#000", fontWeight: 800 }}
        >
          Cancel
        </Button>
        <Button
          startIcon={importingBulk ? <CircularProgress size={18} color="inherit" /> : <Check />}
          variant="contained"
          onClick={handleImportBulkItems}
          disabled={importingBulk || !parsedImportItems.length}
          sx={{ bgcolor: INDIGO, fontWeight: 900, px: 3 }}
        >
          {importingBulk ? "Importing..." : `Import ${parsedImportItems.length || 0} Items`}
        </Button>
      </DialogActions>
    </Dialog>
  );

  const viewItemImageUrl = toBackendAssetUrl(viewItem?.imageUrl);
  const viewItemStock = viewItem ? getAvailableStock(viewItem) : 0;
  const itemViewModalNode = (
    <Dialog
      open={Boolean(viewItem)}
      onClose={() => setViewItem(null)}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          bgcolor: isDark ? "#0b101c" : "#ffffff",
          color: isDark ? "#f8fafc" : "#0f172a",
          backgroundImage: "none",
          border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e5e7eb",
        },
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2.5, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box sx={{ width: 36, height: 36, borderRadius: 2, display: "grid", placeItems: "center", bgcolor: alpha(BLUE, isDark ? 0.2 : 0.08), color: isDark ? "#60a5fa" : BLUE }}>
            <VisibilityOutlined fontSize="small" />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={900}>{viewItem?.itemName || "Inventory Item"}</Typography>
            <Typography variant="caption" color={isDark ? "#94a3b8" : MUTED}>SKU: {viewItem?.sku || "-"}</Typography>
          </Box>
        </Stack>
        <IconButton onClick={() => setViewItem(null)} size="small" sx={{ color: isDark ? "#94a3b8" : "inherit" }}>
          <Close />
        </IconButton>
      </DialogTitle>
      <Divider sx={{ borderColor: isDark ? "rgba(255,255,255,0.08)" : undefined }} />
      <DialogContent sx={{ p: 3 }}>
        {viewItem && (
          <Grid container spacing={2.5}>
            <Grid item xs={12} md={4}>
              <Box sx={{ height: 190, borderRadius: 2, overflow: "hidden", bgcolor: isDark ? "rgba(255,255,255,0.05)" : "#f8fafc", display: "grid", placeItems: "center" }}>
                {viewItemImageUrl ? (
                  <img src={viewItemImageUrl} alt={viewItem.itemName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <ImageOutlined sx={{ fontSize: 56, color: isDark ? "#475569" : "#cbd5e1" }} />
                )}
              </Box>
            </Grid>
            <Grid item xs={12} md={8}>
              <Grid container spacing={1.5}>
                {[
                  ["Category", viewItem.category || "-"],
                  ["Subcategory", viewItem.subcategory || "-"],
                  ["HSN / SAC", viewItem.hsnSacCode || "-"],
                  ["Unit", viewItem.unit || "pcs"],
                  ["Stock", `${viewItemStock} ${viewItem.unit || "pcs"}`],
                  ["Low Stock Alert", viewItem.reorderLevel ?? "-"],
                  ["Selling Price", formatCurrency(viewItem.pricing?.sellingPrice)],
                  ["Cost Price", formatCurrency(viewItem.pricing?.purchaseCost)],
                ].map(([label, value]) => (
                  <Grid item xs={12} sm={6} key={label}>
                    <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: isDark ? "rgba(255,255,255,0.04)" : "#f8fafc", border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e5e7eb" }}>
                      <Typography variant="caption" color={isDark ? "#94a3b8" : MUTED} fontWeight={800}>{label}</Typography>
                      <Typography fontWeight={900} sx={{ color: isDark ? "#f8fafc" : "#0f172a", wordBreak: "break-word" }}>{value}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="caption" color={isDark ? "#94a3b8" : MUTED} fontWeight={800}>Description</Typography>
              <Typography sx={{ mt: 0.5, color: isDark ? "#e2e8f0" : "#334155" }}>{viewItem.description || "-"}</Typography>
            </Grid>
          </Grid>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
        <Button variant="outlined" onClick={() => setViewItem(null)} sx={{ borderColor: isDark ? "rgba(255,255,255,0.15)" : "#e5e7eb", color: isDark ? "#f8fafc" : "#000", fontWeight: 800 }}>
          Close
        </Button>
        {viewItem && (
          <Button variant="contained" startIcon={<EditOutlined />} onClick={() => { const item = viewItem; setViewItem(null); startEditItem(item); }} sx={{ bgcolor: INDIGO, fontWeight: 900 }}>
            Edit Item
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );

  const confirmDialogNode = (
    <Dialog
      open={confirmDialog.open}
      onClose={closeConfirmDialog}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          bgcolor: isDark ? "#0b101c" : "#ffffff",
          color: isDark ? "#f8fafc" : "#0f172a",
          backgroundImage: "none",
          border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e5e7eb",
          boxShadow: isDark ? "0 24px 70px rgba(0,0,0,0.75)" : "0 24px 70px rgba(15,23,42,0.22)",
        },
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2.5, display: "flex", alignItems: "center", gap: 1.5 }}>
        <Box sx={{ width: 38, height: 38, borderRadius: 2, display: "grid", placeItems: "center", bgcolor: alpha(DANGER, isDark ? 0.22 : 0.1), color: DANGER }}>
          <DeleteOutline fontSize="small" />
        </Box>
        <Typography variant="h6" fontWeight={900}>{confirmDialog.title}</Typography>
      </DialogTitle>
      <DialogContent sx={{ px: 2.5, pt: 0, pb: 1 }}>
        <Typography color={isDark ? "#cbd5e1" : "#475569"} sx={{ lineHeight: 1.6 }}>
          {confirmDialog.message}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 2.5, pb: 2.5, pt: 1 }}>
        <Button variant="outlined" onClick={closeConfirmDialog} sx={{ borderColor: isDark ? "rgba(255,255,255,0.15)" : "#e5e7eb", color: isDark ? "#f8fafc" : "#0f172a", fontWeight: 800 }}>
          Cancel
        </Button>
        <Button variant="contained" startIcon={<DeleteOutline />} onClick={handleConfirmAction} sx={{ bgcolor: DANGER, fontWeight: 900, "&:hover": { bgcolor: "#dc2626" } }}>
          {confirmDialog.confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );

  const toastSnackbarNode = (
    <Snackbar open={toast.open} autoHideDuration={3500} onClose={() => setToast((prev) => ({ ...prev, open: false }))}>
      <Alert severity={toast.severity} variant="filled" sx={{ color: "#fff" }}>{toast.message}</Alert>
    </Snackbar>
  );

  if (mode === "create-category") {
    return (
      <Box sx={{ p: { xs: 2, md: 5 }, bgcolor: isDark ? "#070b14" : "#fff", minHeight: "100vh", color: isDark ? "#f8fafc" : "inherit" }}>
        <Button startIcon={<ArrowBack />} onClick={() => setScreen("categories")} sx={{ mb: 3, color: isDark ? "#94a3b8" : MUTED }}>
          Back to Categories
        </Button>
        <Stack direction="row" alignItems="center" spacing={1.6} sx={{ mb: 5 }}>
          <PageIcon icon={<Inventory2 />} />
          <Box>
            <Typography variant="h3" fontWeight={900} color={isDark ? "#f8fafc" : "#000"}>
              {categoryForm._id ? "Edit Category" : "Create New Category"}
            </Typography>
            <Typography color={isDark ? "#94a3b8" : MUTED}>{categoryForm._id ? "Update category details and status" : "Add a new category to organize your inventory"}</Typography>
          </Box>
        </Stack>

        <Card sx={{ ...getSoftCard(isDark), maxWidth: 780 }}>
          <CardContent sx={{ p: { xs: 2.5, md: 3.8 } }}>
            <Stack spacing={3}>
              <Field
                isDark={isDark}
                label="Category Name *"
                placeholder="Enter category name"
                value={categoryForm.category}
                onChange={(value) => setCategoryForm((prev) => ({ ...prev, category: value }))}
              />
              <Field
                isDark={isDark}
                label="Description"
                placeholder="Enter category description (optional)"
                multiline
                minRows={3}
                value={categoryForm.description}
                onChange={(value) => setCategoryForm((prev) => ({ ...prev, description: value }))}
              />
              <Field
                isDark={isDark}
                label="Subcategories"
                placeholder="Panels, Inverters, Batteries"
                value={categoryForm.subcategories}
                onChange={(value) => setCategoryForm((prev) => ({ ...prev, subcategories: value }))}
              />
              <Stack direction="row" alignItems="center" spacing={1}>
                <Checkbox
                  checked={categoryForm.isActive}
                  onChange={(event) => setCategoryForm((prev) => ({ ...prev, isActive: event.target.checked }))}
                  sx={{ color: isDark ? "#60a5fa" : BLUE, "&.Mui-checked": { color: isDark ? "#60a5fa" : BLUE } }}
                />
                <Typography fontWeight={900} sx={{ color: isDark ? "#f8fafc" : "#0f172a" }}>Active</Typography>
              </Stack>
              <Stack direction="row" spacing={1.5}>
                <Button variant="outlined" onClick={() => setScreen("categories")} sx={{ px: 2.5, borderColor: isDark ? "rgba(255, 255, 255, 0.15)" : "#e5e7eb", color: isDark ? "#f8fafc" : "#000", fontWeight: 800 }}>
                  Cancel
                </Button>
                <Button startIcon={<Check />} variant="contained" onClick={saveCategory} disabled={saving} sx={{ px: 3, bgcolor: INDIGO, fontWeight: 900 }}>
                  {saving ? "Saving..." : categoryForm._id ? "Update Category" : "Create Category"}
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
        {categoryModalNode}
        {subCategoryModalNode}
        {toastSnackbarNode}
      </Box>
    );
  }

  if (mode === "create-item") {
    return (
      <Box sx={{ bgcolor: isDark ? "#070b14" : "#f8fafc", minHeight: "100vh", color: isDark ? "#f8fafc" : "inherit" }}>
        <Paper square sx={{ px: { xs: 2, md: 4 }, py: 1.8, bgcolor: isDark ? "#0b101c" : "#fff", borderBottom: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e5e7eb" }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <IconButton onClick={() => setScreen("items")} sx={{ border: isDark ? "1px solid rgba(255,255,255,0.15)" : "1px solid #e5e7eb", color: isDark ? "#f8fafc" : "inherit", borderRadius: 2 }}>
                <ArrowBack />
              </IconButton>
              <Box sx={{ width: 38, height: 38, borderRadius: 2, display: "grid", placeItems: "center", bgcolor: alpha(BLUE, isDark ? 0.2 : 0.08), color: isDark ? "#60a5fa" : BLUE }}>
                <Inventory2 />
              </Box>
              <Box>
                <Typography fontWeight={900} color={isDark ? "#f8fafc" : TEXT}>
                  {itemForm._id ? "Edit item" : "Create item"}
                </Typography>
                <Typography variant="body2" color={isDark ? "#94a3b8" : "#8a94a6"}>
                  Fill in item details, pricing, and tax settings
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" onClick={() => setScreen("items")} sx={{ borderColor: isDark ? "rgba(255,255,255,0.15)" : "#e5e7eb", color: isDark ? "#f8fafc" : TEXT, fontWeight: 800 }}>
                Cancel
              </Button>
              <Button startIcon={<Check />} variant="contained" onClick={saveItem} disabled={saving} sx={{ bgcolor: BLUE, fontWeight: 900 }}>
                {saving ? "Saving..." : itemForm._id ? "Update item" : "Save item"}
              </Button>
            </Stack>
          </Stack>
        </Paper>

        <Box sx={{ maxWidth: 1220, mx: "auto", p: { xs: 2, md: 3.5 } }}>
          <Grid container spacing={2.5}>
            <Grid item xs={12} lg={8}>
              <Stack spacing={2}>
                <SectionCard isDark={isDark} icon={<Inventory2 />} title="Item details" color={BLUE} required isOpen={openSection === "details"} onToggle={() => toggleSection("details")}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Field isDark={isDark} label="Item Name *" placeholder="e.g. Apple iPhone 15" value={itemForm.itemName} onChange={(value) => updateItem("itemName", value)} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Field isDark={isDark} label="SKU / Item Code (Optional)" placeholder="Auto-generated if blank" value={itemForm.sku} onChange={(value) => updateItem("sku", value)} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Field isDark={isDark} label="HSN / SAC Code" placeholder="e.g. 8471" value={itemForm.hsnSacCode} onChange={(value) => updateItem("hsnSacCode", value)} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.8 }}>
                        <Typography variant="caption" color={isDark ? "#94a3b8" : "#8a94a6"} fontWeight={900}>
                          CATEGORY *
                        </Typography>
                        <Button
                          type="button"
                          size="small"
                          startIcon={<Add fontSize="small" />}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleOpenAddCategoryModal();
                          }}
                          sx={{
                            fontSize: "0.78rem",
                            fontWeight: 800,
                            textTransform: "none",
                            color: isDark ? "#60a5fa" : BLUE,
                            py: 0,
                            px: 1,
                            minWidth: 0,
                          }}
                        >
                          Add Category
                        </Button>
                      </Stack>
                      <Field
                        isDark={isDark}
                        select
                        placeholder="Select Category"
                        value={itemForm.category}
                        onChange={(value) => {
                          if (value === "__add_new__") {
                            handleOpenAddCategoryModal();
                          } else {
                            updateItem("category", value);
                            updateItem("subcategory", "");
                          }
                        }}
                      >
                        <MenuItem
                          value="__add_new__"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleOpenAddCategoryModal();
                          }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleOpenAddCategoryModal();
                          }}
                          sx={{
                            color: isDark ? "#60a5fa" : BLUE,
                            fontWeight: 900,
                            borderBottom: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e5e7eb",
                            py: 1.2,
                          }}
                        >
                          <Add fontSize="small" sx={{ mr: 1 }} /> Add Category
                        </MenuItem>
                        {categories.map((entry) => (
                          <MenuItem key={entry.category} value={entry.category}>
                            {entry.category}
                          </MenuItem>
                        ))}
                      </Field>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.8 }}>
                        <Typography variant="caption" color={isDark ? "#94a3b8" : "#8a94a6"} fontWeight={900}>
                          SUBCATEGORY
                        </Typography>
                        {selectedCategory && (
                          <Button
                            type="button"
                            size="small"
                            startIcon={<Add fontSize="small" />}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleQuickAddSubcategory();
                            }}
                            sx={{
                              fontSize: "0.78rem",
                              fontWeight: 800,
                              textTransform: "none",
                              color: isDark ? "#60a5fa" : BLUE,
                              py: 0,
                              px: 1,
                              minWidth: 0,
                            }}
                          >
                            Add Subcategory
                          </Button>
                        )}
                      </Stack>
                      <Field
                        isDark={isDark}
                        select
                        placeholder="Select Subcategory"
                        value={itemForm.subcategory}
                        onChange={(value) => {
                          if (value === "__add_sub__") {
                            handleQuickAddSubcategory();
                          } else {
                            updateItem("subcategory", value);
                          }
                        }}
                        disabled={!selectedCategory}
                      >
                        {selectedCategory && (
                          <MenuItem
                            value="__add_sub__"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleQuickAddSubcategory();
                            }}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleQuickAddSubcategory();
                            }}
                            sx={{
                              color: isDark ? "#60a5fa" : BLUE,
                              fontWeight: 900,
                              borderBottom: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e5e7eb",
                              py: 1.2,
                            }}
                          >
                            <Add fontSize="small" sx={{ mr: 1 }} /> Add Subcategory
                          </MenuItem>
                        )}
                        {(selectedCategory?.subcategories || []).map((sub) => (
                          <MenuItem key={sub} value={sub}>
                            {sub}
                          </MenuItem>
                        ))}
                      </Field>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Field isDark={isDark} select label="Unit of Measure" value={itemForm.unit} onChange={(value) => updateItem("unit", value)}>
                        {["pcs", "Nos", "kg", "meter", "set", "Other (custom)"].map((unit) => (
                          <MenuItem key={unit} value={unit}>
                            {unit}
                          </MenuItem>
                        ))}
                      </Field>
                    </Grid>
                    <Grid item xs={12}>
                      <Field isDark={isDark} label="Description" placeholder="Short description of this item..." multiline minRows={3} value={itemForm.description} onChange={(value) => updateItem("description", value)} />
                    </Grid>
                  </Grid>
                </SectionCard>

                <SectionCard isDark={isDark} icon={<Inventory2 />} title="Tax information" color={WARNING} isOpen={openSection === "tax"} onToggle={() => toggleSection("tax")}>
                  <Grid container spacing={1.5}>
                    <Grid item xs={12} md={6}>
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => updateItem("pricing.taxMode", "igst")}
                        sx={{
                          height: 42,
                          borderRadius: 1.5,
                          borderColor: (itemForm.pricing?.taxMode || "igst") === "igst" ? WARNING : (isDark ? "rgba(255,255,255,0.15)" : "#e5e7eb"),
                          bgcolor: (itemForm.pricing?.taxMode || "igst") === "igst" ? alpha(WARNING, isDark ? 0.2 : 0.08) : "transparent",
                          color: (itemForm.pricing?.taxMode || "igst") === "igst" ? (isDark ? "#fbbf24" : WARNING) : (isDark ? "#94a3b8" : MUTED),
                          fontWeight: 900,
                        }}
                      >
                        Inter-state (IGST)
                      </Button>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => updateItem("pricing.taxMode", "cgst_sgst")}
                        sx={{
                          height: 42,
                          borderRadius: 1.5,
                          borderColor: itemForm.pricing?.taxMode === "cgst_sgst" ? WARNING : (isDark ? "rgba(255,255,255,0.15)" : "#e5e7eb"),
                          bgcolor: itemForm.pricing?.taxMode === "cgst_sgst" ? alpha(WARNING, isDark ? 0.2 : 0.08) : "transparent",
                          color: itemForm.pricing?.taxMode === "cgst_sgst" ? (isDark ? "#fbbf24" : WARNING) : (isDark ? "#94a3b8" : MUTED),
                          fontWeight: 900,
                        }}
                      >
                        Intra-state (CGST+SGST)
                      </Button>
                    </Grid>

                    {itemForm.pricing?.taxMode === "cgst_sgst" ? (
                      <>
                        <Grid item xs={12}>
                          <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.5 }}>
                            <Checkbox
                              checked={itemForm.pricing?.autoSplitTax !== false}
                              onChange={(e) => {
                                const auto = e.target.checked;
                                updateItem("pricing.autoSplitTax", auto);
                                if (auto) {
                                  const num = Number(itemForm.pricing?.totalGst) || 0;
                                  updateItem("pricing.cgst", num / 2);
                                  updateItem("pricing.sgst", num / 2);
                                }
                              }}
                              sx={{ p: 0, color: isDark ? "#fbbf24" : WARNING, "&.Mui-checked": { color: isDark ? "#fbbf24" : WARNING } }}
                            />
                            <Typography variant="body2" fontWeight={700} sx={{ color: isDark ? "#cbd5e1" : "#475569" }}>
                              Auto-split total GST equally into CGST + SGST
                            </Typography>
                          </Stack>
                        </Grid>
                        <Grid item xs={12}>
                          <Field
                            isDark={isDark}
                            label="TOTAL GST (%)"
                            placeholder="e.g. 18"
                            type="number"
                            value={itemForm.pricing?.totalGst ?? ""}
                            onChange={(val) => {
                              updateItem("pricing.totalGst", val);
                              const num = Number(val) || 0;
                              if (itemForm.pricing?.autoSplitTax !== false) {
                                updateItem("pricing.cgst", num ? num / 2 : "");
                                updateItem("pricing.sgst", num ? num / 2 : "");
                              }
                            }}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <Field
                            isDark={isDark}
                            label="SGST (%)"
                            placeholder="Auto"
                            type={itemForm.pricing?.autoSplitTax !== false ? "text" : "number"}
                            value={
                              itemForm.pricing?.autoSplitTax !== false
                                ? (Number(itemForm.pricing?.totalGst) ? Number(itemForm.pricing?.totalGst) / 2 : "Auto")
                                : (itemForm.pricing?.sgst ?? "")
                            }
                            disabled={itemForm.pricing?.autoSplitTax !== false}
                            onChange={(val) => updateItem("pricing.sgst", val)}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <Field
                            isDark={isDark}
                            label="CGST (%)"
                            placeholder="Auto"
                            type={itemForm.pricing?.autoSplitTax !== false ? "text" : "number"}
                            value={
                              itemForm.pricing?.autoSplitTax !== false
                                ? (Number(itemForm.pricing?.totalGst) ? Number(itemForm.pricing?.totalGst) / 2 : "Auto")
                                : (itemForm.pricing?.cgst ?? "")
                            }
                            disabled={itemForm.pricing?.autoSplitTax !== false}
                            onChange={(val) => updateItem("pricing.cgst", val)}
                          />
                        </Grid>
                      </>
                    ) : (
                      <Grid item xs={12}>
                        <Field
                          isDark={isDark}
                          label="IGST (%)"
                          placeholder="e.g. 18"
                          type="number"
                          value={itemForm.pricing?.igst ?? ""}
                          onChange={(value) => updateItem("pricing.igst", value)}
                        />
                      </Grid>
                    )}
                  </Grid>
                </SectionCard>

                <SectionCard isDark={isDark} icon={<ListAlt />} title="Inventory management" color="#0f766e" required isOpen={openSection === "inventory"} onToggle={() => toggleSection("inventory")}>
                  <Box sx={{ p: 1.7, border: isDark ? "1px solid rgba(16,185,129,0.3)" : "1px solid #bbf7d0", bgcolor: isDark ? "rgba(16,185,129,0.08)" : "#effdf7", borderRadius: 2, mb: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={1.3}>
                      <Checkbox sx={{ p: 0, color: isDark ? "#4ade80" : undefined, "&.Mui-checked": { color: isDark ? "#4ade80" : undefined } }} />
                      <Box>
                        <Typography fontWeight={900} sx={{ color: isDark ? "#f8fafc" : "#0f172a" }}>Track stock levels</Typography>
                        <Typography variant="body2" color={isDark ? "#4ade80" : "#0f766e"}>
                          Monitor and alert on inventory thresholds
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Field isDark={isDark} label="Opening Stock *" placeholder="e.g. 100" type="number" value={itemForm.openingStock ?? ""} onChange={(value) => updateItem("openingStock", value)} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Field isDark={isDark} label="Low Stock Alert" placeholder="e.g. 10" type="number" value={itemForm.reorderLevel} onChange={(value) => updateItem("reorderLevel", value)} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Field isDark={isDark} label="High Stock Limit" placeholder="e.g. 1000" type="number" value={itemForm.maxStockLevel ?? ""} onChange={(value) => updateItem("maxStockLevel", value)} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Field isDark={isDark} label="Expiry Date" type="date" value={itemForm.tracking.expiryDate} onChange={(value) => updateItem("tracking.expiryDate", value)} InputLabelProps={{ shrink: true }} />
                    </Grid>
                  </Grid>
                </SectionCard>

                <SectionCard isDark={isDark} icon={<Straighten />} title="Dimensions & weight" color="#7c3aed" isOpen={openSection === "dimensions"} onToggle={() => toggleSection("dimensions")}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={3}>
                      <Field isDark={isDark} label="L" value={itemForm.dimensions.length} onChange={(value) => updateItem("dimensions.length", value)} />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Field isDark={isDark} label="W" value={itemForm.dimensions.width} onChange={(value) => updateItem("dimensions.width", value)} />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Field isDark={isDark} label="H" value={itemForm.dimensions.height} onChange={(value) => updateItem("dimensions.height", value)} />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Field isDark={isDark} select label="Unit" value={itemForm.dimensions.unit} onChange={(value) => updateItem("dimensions.unit", value)}>
                        {["cm", "mm", "inch"].map((unit) => (
                          <MenuItem key={unit} value={unit}>
                            {unit}
                          </MenuItem>
                        ))}
                      </Field>
                    </Grid>
                    <Grid item xs={12}>
                      <Field isDark={isDark} label="Weight (kg)" placeholder="e.g. 1.5" value={itemForm.weight.value} onChange={(value) => updateItem("weight.value", value)} />
                    </Grid>
                  </Grid>
                </SectionCard>
              </Stack>
            </Grid>

            <Grid item xs={12} lg={4}>
              <Stack spacing={2}>
                <Card sx={{ ...getSoftCard(isDark), boxShadow: "none" }}>
                  <Stack direction="row" alignItems="center" spacing={1.5} sx={{ p: 2.5 }}>
                    <Box sx={{ width: 34, height: 34, borderRadius: 2, display: "grid", placeItems: "center", bgcolor: isDark ? "rgba(255,255,255,0.05)" : "#f1f5f9", color: isDark ? "#94a3b8" : "#94a3b8" }}>
                      <ImageOutlined />
                    </Box>
                    <Typography fontWeight={900} sx={{ color: isDark ? "#f8fafc" : "#0f172a" }}>Item image</Typography>
                  </Stack>
                  <Divider sx={{ borderColor: isDark ? "rgba(255,255,255,0.08)" : undefined }} />
                  <Box sx={{ p: 2.5 }}>
                    {imagePreviewUrl ? (
                      <Box sx={{ border: isDark ? "1px solid rgba(255,255,255,0.12)" : "1px solid #e5e7eb", borderRadius: 3, p: 2, textAlign: "center", bgcolor: isDark ? "rgba(255,255,255,0.02)" : "#f8fafc" }}>
                        <Box
                          component="img"
                          src={imagePreviewUrl}
                          alt="Item Preview"
                          sx={{
                            width: "100%",
                            maxHeight: 220,
                            objectFit: "contain",
                            borderRadius: 2,
                            mb: 1.5,
                            border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #cbd5e1",
                            bgcolor: isDark ? "#000" : "#fff",
                          }}
                        />
                        <Typography variant="body2" fontWeight={800} sx={{ color: isDark ? "#f8fafc" : "#0f172a", wordBreak: "break-all", mb: 1.5 }}>
                          {typeof itemForm.image === "object" && itemForm.image ? itemForm.image.name : "Item Image"}
                        </Typography>
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <Button component="label" size="small" variant="outlined" sx={{ borderColor: isDark ? "rgba(255,255,255,0.2)" : "#cbd5e1", color: isDark ? "#60a5fa" : BLUE, fontWeight: 800 }}>
                            Change File
                            <input
                              hidden
                              type="file"
                              accept="image/png,image/jpeg,image/webp"
                              onChange={(event) => {
                                if (event.target.files?.[0]) {
                                  updateItem("image", event.target.files[0]);
                                }
                              }}
                            />
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            onClick={() => updateItem("image", null)}
                            sx={{ fontWeight: 800 }}
                          >
                            Remove
                          </Button>
                        </Stack>
                      </Box>
                    ) : (
                      <Box sx={{ border: isDark ? "2px dashed rgba(255,255,255,0.15)" : "2px dashed #d8dee8", borderRadius: 3, p: 4, textAlign: "center", bgcolor: isDark ? "rgba(255,255,255,0.02)" : "transparent" }}>
                        <IconButton sx={{ border: isDark ? "1px solid rgba(255,255,255,0.15)" : "1px solid #e5e7eb", color: isDark ? "#f8fafc" : "inherit", mb: 1 }}>
                          <ImageOutlined />
                        </IconButton>
                        <Typography fontWeight={900} sx={{ color: isDark ? "#f8fafc" : "#0f172a" }}>Upload item image</Typography>
                        <Typography variant="body2" color={isDark ? "#94a3b8" : "#8a94a6"} sx={{ my: 1 }}>
                          Max 2 MB - PNG, JPG, WEBP
                        </Typography>
                        <Button component="label" variant="contained" sx={{ bgcolor: BLUE, borderRadius: 2, fontWeight: 900, mt: 1 }}>
                          Browse file
                          <input
                            hidden
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            onChange={(event) => {
                              if (event.target.files?.[0]) {
                                updateItem("image", event.target.files[0]);
                              }
                            }}
                          />
                        </Button>
                      </Box>
                    )}
                  </Box>
                </Card>

                <SectionCard isDark={isDark} icon={<Typography fontWeight={900}>Rs</Typography>} title="Pricing" color={SUCCESS} required isOpen={openSection === "pricing"} onToggle={() => toggleSection("pricing")}>
                  <Stack spacing={2}>
                    <Field isDark={isDark} label="Selling Price (Rs) *" type="number" value={itemForm.pricing?.sellingPrice ?? ""} onChange={(value) => updateItem("pricing.sellingPrice", value)} />
                    <Field isDark={isDark} label="Cost Price (Rs)" type="number" value={itemForm.pricing?.purchaseCost ?? ""} onChange={(value) => updateItem("pricing.purchaseCost", value)} />
                    <Grid container spacing={1}>
                      <Grid item xs={4}>
                        <Field isDark={isDark} select label="Discount" value={itemForm.discountType || "Rs"} onChange={(val) => updateItem("discountType", val)}>
                          <MenuItem value="Rs">Rs</MenuItem>
                          <MenuItem value="%">%</MenuItem>
                        </Field>
                      </Grid>
                      <Grid item xs={8}>
                        <Field isDark={isDark} label=" " type="number" value={itemForm.discount ?? ""} onChange={(value) => updateItem("discount", value)} />
                      </Grid>
                    </Grid>
                  </Stack>
                </SectionCard>
              </Stack>
            </Grid>
          </Grid>
        </Box>
        {categoryModalNode}
        {subCategoryModalNode}
        {toastSnackbarNode}
      </Box>
    );
  }

  if (mode === "subcategories") {
    const subcategories = (selectedCategoryForSub?.subcategories || []).filter((name) =>
      !subcategorySearch || name.toLowerCase().includes(subcategorySearch.toLowerCase()),
    );
    return (
      <Box sx={{ p: { xs: 2, md: 3.5 }, bgcolor: isDark ? "#070b14" : "#fff", minHeight: "100vh", color: isDark ? "#f8fafc" : "inherit" }}>
        <Button startIcon={<ArrowBack />} onClick={() => setScreen("categories")} sx={{ mb: 3, color: isDark ? "#94a3b8" : MUTED }}>
          Back to Categories
        </Button>
        <Stack direction={{ xs: "column", md: "row" }} alignItems={{ xs: "stretch", md: "center" }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
          <Stack direction="row" alignItems="center" spacing={1.6}>
            <PageIcon icon={<ListAlt />} />
            <Box>
              <Typography variant="h3" fontWeight={900} color={isDark ? "#f8fafc" : "#000"}>
                Subcategories
              </Typography>
              <Typography color={isDark ? "#94a3b8" : MUTED}>
                Category: <Box component="span" sx={{ color: isDark ? "#f8fafc" : TEXT, fontWeight: 900 }}>{selectedCategoryForSub?.category || "-"}</Box>
              </Typography>
            </Box>
          </Stack>
          <Button startIcon={<Add />} variant="contained" onClick={addSubcategory} disabled={!selectedCategoryForSub?._id} sx={{ bgcolor: INDIGO, borderRadius: 2, px: 3, py: 1.2, fontWeight: 900 }}>
            Add Subcategory
          </Button>
        </Stack>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <StatCard isDark={isDark} icon={<ListAlt />} label="Total Subcategories" value={selectedCategoryForSub?.subcategories?.length || 0} />
          </Grid>
          <Grid item xs={12} md={4}>
            <StatCard isDark={isDark} icon={<Inventory2 />} label="Active Subcategories" value={selectedCategoryForSub?.subcategories?.length || 0} color={SUCCESS} />
          </Grid>
          <Grid item xs={12} md={4}>
            <StatCard isDark={isDark} icon={<Search />} label="Filtered Results" value={subcategories.length} color="#7c3aed" />
          </Grid>
        </Grid>

        <TextField
          placeholder="Search subcategories by name..."
          value={subcategorySearch}
          onChange={(event) => setSubcategorySearch(event.target.value)}
          fullWidth
          InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
          sx={{ ...getInputSx(isDark), mb: 3, "& .MuiOutlinedInput-root": { ...getInputSx(isDark)["& .MuiOutlinedInput-root"], minHeight: 56 } }}
        />

        <TableCard
          isDark={isDark}
          columns={["Name", "Description", "Created", "Actions"]}
          rows={subcategories.map((name) => [
            <Stack direction="row" alignItems="center" spacing={1}>
              <ListAlt color="primary" fontSize="small" />
              <Typography color={isDark ? "#60a5fa" : BLUE} fontWeight={900}>{name}</Typography>
            </Stack>,
            <Typography color={isDark ? "#64748b" : "#94a3b8"} fontStyle="italic">No description</Typography>,
            selectedCategoryForSub?.updatedAt ? new Date(selectedCategoryForSub.updatedAt).toLocaleDateString() : "-",
            <Stack direction="row" spacing={0.5} justifyContent="flex-end">
              <Tooltip title="Edit">
                <IconButton size="small" onClick={() => editSubcategory(name)} sx={{ color: isDark ? "#60a5fa" : BLUE }}>
                  <EditOutlined fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete">
                <IconButton size="small" onClick={() => deleteSubcategory(name)} sx={{ color: DANGER }}>
                  <DeleteOutline fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>,
          ])}
          empty="No subcategories found."
        />

        <Paper sx={{ ...getSoftCard(isDark), p: 2, mt: 3 }}>
          <Stack direction={{ xs: "column", sm: "row" }} alignItems="center" justifyContent="space-between" spacing={2}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography color={isDark ? "#94a3b8" : MUTED}>Per page:</Typography>
              <TextField select size="small" value={10} sx={{ width: 86, ...getInputSx(isDark) }}>
                <MenuItem value={10}>10</MenuItem>
              </TextField>
            </Stack>
            <Typography color={isDark ? "#94a3b8" : MUTED}>{subcategories.length ? `1-${subcategories.length} of ${subcategories.length}` : "0 of 0"}</Typography>
            <Stack direction="row" spacing={1}>
              <Button disabled variant="outlined" sx={{ borderColor: isDark ? "rgba(255,255,255,0.15)" : "#e5e7eb" }}>Prev</Button>
              <Button variant="contained" sx={{ bgcolor: INDIGO }}>1</Button>
              <Button disabled variant="outlined" sx={{ borderColor: isDark ? "rgba(255,255,255,0.15)" : "#e5e7eb" }}>Next</Button>
            </Stack>
          </Stack>
        </Paper>
        {categoryModalNode}
        {subCategoryModalNode}
        {toastSnackbarNode}
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1.5, md: 2.5 }, bgcolor: isDark ? "#070b14" : "#fff", minHeight: "100vh", color: isDark ? "#f8fafc" : "inherit" }}>


      {mode === "categories" ? (
        <Stack spacing={2.5}>
          <Box>
            <Button
              startIcon={<ArrowBack />}
              onClick={() => setScreen("items")}
              sx={{ color: isDark ? "#94a3b8" : MUTED, fontWeight: 800, mb: 1.5, textTransform: "none" }}
            >
              Back to Inventory Items
            </Button>
          </Box>
          <Stack direction={{ xs: "column", md: "row" }} alignItems={{ xs: "stretch", md: "center" }} justifyContent="space-between" spacing={2}>
            <Stack direction="row" alignItems="center" spacing={1.6}>
              <PageIcon icon={<Inventory2 />} />
              <Box>
                <Typography variant="h3" fontWeight={900} color={isDark ? "#f8fafc" : "#000"}>
                  Inventory Categories
                </Typography>
                <Typography color={isDark ? "#94a3b8" : MUTED}>Organize and manage your product categories</Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Button
                startIcon={<Add />}
                variant="outlined"
                onClick={() => {
                  setItemForm(emptyItem);
                  setMode("create-item");
                }}
                sx={{
                  borderColor: isDark ? "rgba(99, 102, 241, 0.45)" : alpha(INDIGO, 0.45),
                  color: isDark ? "#818cf8" : INDIGO,
                  fontWeight: 800,
                  borderRadius: 2,
                }}
              >
                Add Item
              </Button>
              <Button startIcon={<Add />} variant="contained" onClick={startCreateCategory} sx={{ bgcolor: INDIGO, borderRadius: 2, px: 3, py: 1.2, fontWeight: 900 }}>
                Add Category
              </Button>
            </Stack>
          </Stack>

          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <StatCard isDark={isDark} icon={<ListAlt />} label="Total Categories" value={categoryRows.length} />
            </Grid>
            <Grid item xs={12} md={4}>
              <StatCard isDark={isDark} icon={<Inventory2 />} label="Active Categories" value={categoryRows.filter((row) => row.isActive !== false).length} color={SUCCESS} />
            </Grid>
            <Grid item xs={12} md={4}>
              <StatCard isDark={isDark} icon={<Search />} label="Filtered Results" value={categoryRows.length} color="#7c3aed" />
            </Grid>
          </Grid>

          <TextField
            placeholder="Search categories by name or description..."
            value={categorySearch}
            onChange={(event) => setCategorySearch(event.target.value)}
            fullWidth
            InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
            sx={{ ...getInputSx(isDark), "& .MuiOutlinedInput-root": { ...getInputSx(isDark)["& .MuiOutlinedInput-root"], minHeight: 56 } }}
          />

          <TableCard
            isDark={isDark}
            columns={["Name", "Description", "Subcategories", "Status", "Actions"]}
            rows={categoryRows.map((entry) => [
              <Stack direction="row" alignItems="center" spacing={1}>
                <Inventory2 color="primary" fontSize="small" />
                <Typography color={isDark ? "#60a5fa" : BLUE} fontWeight={900}>{entry.category}</Typography>
              </Stack>,
              <Typography color={entry.description ? (isDark ? "#e2e8f0" : TEXT) : (isDark ? "#64748b" : "#94a3b8")} fontStyle={entry.description ? "normal" : "italic"}>
                {entry.description || "No description"}
              </Typography>,
              <Chip size="small" label={entry.subcategoryCount} sx={{ bgcolor: alpha("#c026d3", isDark ? 0.25 : 0.12), color: isDark ? "#c084fc" : "#8b5cf6", fontWeight: 900 }} />,
              <Chip size="small" label={entry.isActive === false ? "Inactive" : "Active"} sx={{ bgcolor: alpha(SUCCESS, isDark ? 0.25 : 0.14), color: isDark ? "#4ade80" : "#15803d", fontWeight: 800 }} />,
              <Tooltip title="Actions">
                <IconButton size="small" onClick={(event) => openCategoryMenu(event, entry)} sx={{ color: isDark ? "#cbd5e1" : "inherit" }}>
                  <MoreVert fontSize="small" />
                </IconButton>
              </Tooltip>,
            ])}
            empty="No categories found."
          />
        </Stack>
      ) : mode === "out" ? (
        <Stack spacing={2.5}>
          {/* Header */}
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", md: "center" }} spacing={2}>
            <Stack direction="row" alignItems="center" spacing={1.6}>
              <PageIcon icon={<OutboxOutlined />} />
              <Box>
                <Typography variant="h3" fontWeight={900} color={isDark ? "#f8fafc" : "#000"}>
                  Customer & Project Inventory Out
                </Typography>
                <Typography color={isDark ? "#94a3b8" : MUTED}>
                  Issue inventory to customer projects with exact serial number tracking & cost allocation
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={1.5} justifyContent="flex-end" flexWrap="wrap">
              <Button
                startIcon={<Refresh />}
                variant="outlined"
                onClick={fetchInventoryOut}
                sx={{
                  borderColor: isDark ? "rgba(255, 255, 255, 0.15)" : "#e5e7eb",
                  color: isDark ? "#f8fafc" : "#000",
                  fontWeight: 800,
                  borderRadius: 2,
                }}
              >
                Refresh
              </Button>
              <Button
                startIcon={<Add />}
                variant="contained"
                onClick={() => {
                  fetchConvertedProjectsWithNoMaterials();
                  setSelectProjectModalOpen(true);
                }}
                sx={{ bgcolor: INDIGO, borderRadius: 2, fontWeight: 900, px: 3 }}
              >
                Add Materials to Project

              </Button>
            </Stack>
          </Stack>

          {/* Stat Cards */}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                isDark={isDark}
                icon={<OutboxOutlined />}
                label="Total Issues"
                value={inventoryOutPagination.total || inventoryOutRecords.length}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                isDark={isDark}
                icon={<Inventory2 />}
                label="Total Items Issued"
                value={inventoryOutRecords.reduce((sum, r) => sum + (r.totalQuantity || 0), 0)}
                color={BLUE}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                isDark={isDark}
                icon={<TrendingUp />}
                label="Total Material Cost"
                value={formatCurrency(inventoryOutRecords.reduce((sum, r) => sum + (r.totalCost || 0), 0))}
                color={SUCCESS}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                isDark={isDark}
                icon={<QrCodeScanner />}
                label="Serialized Units"
                value={inventoryOutRecords.reduce(
                  (sum, r) => sum + (r.items || []).reduce((iSum, it) => iSum + (it.serialNumbers?.length || 0), 0),
                  0,
                )}
                color="#7c3aed"
              />
            </Grid>
          </Grid>

          {/* Filters & Search */}
          <Paper sx={{ ...getSoftCard(isDark), p: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={8}>
                <TextField
                  placeholder="Search by Issue #, Project Code, Customer Name, Serial Number or Item..."
                  value={inventoryOutSearch}
                  onChange={(e) => setInventoryOutSearch(e.target.value)}
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                  }}
                  sx={getInputSx(isDark)}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  select
                  fullWidth
                  label="Filter by Status"
                  value={inventoryOutStatus}
                  onChange={(e) => setInventoryOutStatus(e.target.value)}
                  sx={getInputSx(isDark)}
                  InputLabelProps={{ shrink: true }}
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  <MenuItem value="issued">Issued / Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled / Reversed</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </Paper>

          {/* Table */}
          <TableCard
            isDark={isDark}
            columns={[
              "Customer & Project",
              "Items Issued",
              "Total Qty",
              "Total Cost",
              "Serial #s",
              "Date",
              "Status",
              "Actions",
            ]}
            columnSx={[
              { width: "22%" },
              { width: "22%" },
              { width: "9%" },
              { width: "12%" },
              { width: "13%" },
              { width: "10%" },
              { width: "9%" },
              { width: "8%", textAlign: "right" },
            ]}
            rows={inventoryOutRecords.map((record) => {
              const allSerials = (record.items || []).flatMap((it) => it.serialNumbers || []).filter(Boolean);
              const isCancelled = record.status === "cancelled";

              return [
                <Stack spacing={0.3}>
                  <Typography fontWeight={800} noWrap sx={{ color: isDark ? "#f8fafc" : "#0f172a", fontSize: 13 }}>
                    {record.customerName || record.customer?.firstName || "Customer"}
                  </Typography>
                  <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap">
                    <Chip
                      size="small"
                      label={record.projectCode || record.projectName || "Project"}
                      sx={{
                        height: 20,
                        fontSize: 11,
                        bgcolor: alpha(INDIGO, isDark ? 0.25 : 0.1),
                        color: isDark ? "#818cf8" : INDIGO,
                        fontWeight: 800,
                      }}
                    />
                  </Stack>
                </Stack>,

                <Stack spacing={0.3}>
                  {(record.items || []).slice(0, 2).map((item, idx) => (
                    <Typography key={idx} variant="body2" noWrap sx={{ fontSize: 12, color: isDark ? "#e2e8f0" : "#1e293b" }}>
                      • {item.itemName} <Box component="span" sx={{ color: MUTED }}>({item.quantity} {item.unit || "pcs"})</Box>
                    </Typography>
                  ))}
                  {(record.items || []).length > 2 && (
                    <Typography variant="caption" color={isDark ? "#60a5fa" : BLUE} fontWeight={700}>
                      +{(record.items || []).length - 2} more items...
                    </Typography>
                  )}
                </Stack>,

                <Typography fontWeight={900} sx={{ color: isDark ? "#f8fafc" : "#0f172a" }}>
                  {record.totalQuantity}
                </Typography>,

                <Box>
                  <Typography fontWeight={900} sx={{ color: SUCCESS, fontSize: 13 }}>
                    {formatCurrency(record.totalCost)}
                  </Typography>
                  <Typography variant="caption" color={isDark ? "#94a3b8" : MUTED}>
                    actual cost
                  </Typography>
                </Box>,

                <Box>
                  {allSerials.length > 0 ? (
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ maxWidth: 130 }}>
                      {allSerials.slice(0, 1).map((s, idx) => (
                        <Chip
                          key={idx}
                          size="small"
                          label={s}
                          onClick={() => {
                            navigator.clipboard?.writeText(s);
                            showToast(`Copied Serial: ${s}`);
                          }}
                          sx={{
                            height: 20,
                            fontSize: 10,
                            bgcolor: alpha("#7c3aed", isDark ? 0.25 : 0.1),
                            color: isDark ? "#c084fc" : "#7c3aed",
                            fontWeight: 700,
                          }}
                        />
                      ))}
                      {allSerials.length > 1 && (
                        <Chip
                          size="small"
                          label={`+${allSerials.length - 1}`}
                          onClick={() => setSelectedInventoryOutRecord(record)}
                          sx={{ height: 20, fontSize: 10, bgcolor: isDark ? "rgba(255,255,255,0.08)" : "#f1f5f9" }}
                        />
                      )}
                    </Stack>
                  ) : (
                    <Typography variant="caption" color={isDark ? "#64748b" : "#94a3b8"}>
                      None
                    </Typography>
                  )}
                </Box>,

                <Typography variant="body2" sx={{ color: isDark ? "#cbd5e1" : "#475569", fontSize: 12 }}>
                  {record.issueDate ? new Date(record.issueDate).toLocaleDateString() : "-"}
                </Typography>,

                <Chip
                  size="small"
                  label={isCancelled ? "Cancelled" : "Issued"}
                  sx={{
                    bgcolor: alpha(isCancelled ? DANGER : SUCCESS, isDark ? 0.25 : 0.12),
                    color: isCancelled ? DANGER : isDark ? "#4ade80" : SUCCESS,
                    fontWeight: 800,
                  }}
                />,

                <Stack direction="row" spacing={0.5} justifyContent="flex-end" alignItems="center">
                  <Tooltip title="View Details">
                    <IconButton
                      size="small"
                      onClick={() => setSelectedInventoryOutRecord(record)}
                      sx={{ color: isDark ? "#60a5fa" : BLUE, p: 0.75 }}
                    >
                      <VisibilityOutlined fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  {!isCancelled && (
                    <Tooltip title="Cancel / Reverse Issue">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setCancelIssueRecord(record);
                          setCancelReasonInput("");
                        }}
                        sx={{ color: DANGER, p: 0.75 }}
                      >
                        <DeleteOutline fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Stack>,
              ];
            })}
            empty={inventoryOutLoading ? "Loading inventory issues..." : "No inventory out records found."}
          />

          {/* Pagination */}
          <Paper sx={{ ...getSoftCard(isDark), p: 2 }}>
            <Stack direction={{ xs: "column", sm: "row" }} alignItems="center" justifyContent="space-between" spacing={2}>
              <Typography color={isDark ? "#94a3b8" : MUTED}>
                {inventoryOutPagination.total
                  ? `${(inventoryOutPagination.page - 1) * inventoryOutPagination.limit + 1}-${Math.min(
                      inventoryOutPagination.page * inventoryOutPagination.limit,
                      inventoryOutPagination.total,
                    )} of ${inventoryOutPagination.total}`
                  : "0 of 0"}
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button
                  disabled={inventoryOutPage <= 1}
                  onClick={() => setInventoryOutPage((prev) => Math.max(prev - 1, 1))}
                  variant="outlined"
                  sx={{ borderColor: isDark ? "rgba(255,255,255,0.15)" : "#e5e7eb", color: isDark ? "#f8fafc" : undefined }}
                >
                  Prev
                </Button>
                <Button variant="contained" sx={{ bgcolor: INDIGO }}>
                  {inventoryOutPage}
                </Button>
                <Button
                  disabled={inventoryOutPage >= inventoryOutPagination.pages}
                  onClick={() => setInventoryOutPage((prev) => prev + 1)}
                  variant="outlined"
                  sx={{ borderColor: isDark ? "rgba(255,255,255,0.15)" : "#e5e7eb", color: isDark ? "#f8fafc" : undefined }}
                >
                  Next
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </Stack>
      ) : (
        <Stack spacing={2.5}>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", md: "center" }} spacing={2}>
            <Stack direction="row" alignItems="center" spacing={1.6}>
              <PageIcon icon={<Inventory2 />} />
              <Box>
                <Typography variant="h3" fontWeight={900} color={isDark ? "#f8fafc" : "#000"}>
                  Inventory Items
                </Typography>
                <Typography color={isDark ? "#94a3b8" : MUTED}>Manage your product inventory and track stock levels</Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={1} justifyContent="flex-end" flexWrap="wrap">
              <Button
                startIcon={<DownloadOutlined />}
                variant="outlined"
                onClick={handleDownloadSampleFormat}
                sx={{ borderColor: isDark ? "rgba(255, 255, 255, 0.15)" : "#cbd5e1", color: isDark ? "#f8fafc" : "#1e293b", fontWeight: 800 }}
              >
                Download Format
              </Button>
              <Button
                startIcon={<DownloadOutlined />}
                variant="outlined"
                onClick={handleExportItems}
                disabled={!visibleItems.length}
                sx={{ borderColor: isDark ? "rgba(34, 197, 94, 0.45)" : alpha(SUCCESS, 0.45), color: isDark ? "#4ade80" : SUCCESS, fontWeight: 800 }}
              >
                Export Items
              </Button>
              <Button
                startIcon={<FileUploadOutlined />}
                variant="outlined"
                onClick={() => setImportModalOpen(true)}
                sx={{ borderColor: isDark ? "rgba(59, 130, 246, 0.5)" : alpha(BLUE, 0.5), color: isDark ? "#60a5fa" : BLUE, fontWeight: 800 }}
              >
                Import Data
              </Button>
              <Button startIcon={<Refresh />} variant="outlined" onClick={fetchAll} sx={{ borderColor: isDark ? "rgba(255, 255, 255, 0.15)" : "#e5e7eb", color: isDark ? "#f8fafc" : "#000", fontWeight: 800 }}>Refresh</Button>
              <Button
                startIcon={<ListAlt />}
                variant="outlined"
                onClick={() => setScreen("categories")}
                sx={{
                  borderColor: isDark ? "rgba(99, 102, 241, 0.45)" : alpha(INDIGO, 0.45),
                  color: isDark ? "#818cf8" : INDIGO,
                  fontWeight: 800,
                  borderRadius: 2,
                }}
              >
                Categories
              </Button>
              <Button
                startIcon={<Add />}
                variant="contained"
                onClick={() => {
                  setItemForm(emptyItem);
                  setMode("create-item");
                }}
                sx={{ bgcolor: INDIGO, borderRadius: 2, fontWeight: 900 }}
              >
                Add Item
              </Button>
            </Stack>
          </Stack>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                isDark={isDark}
                icon={<Inventory2 />}
                label="Total Items"
                value={realSummaryStats.totalItems}
                active={!itemFilter}
                onClick={() => setItemFilter("")}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                isDark={isDark}
                icon={<TrendingUp />}
                label="Total Value"
                value={formatCurrency(realSummaryStats.totalValue)}
                color={SUCCESS}
                active={!itemFilter}
                onClick={() => setItemFilter("")}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                isDark={isDark}
                icon={<ErrorOutline />}
                label="Low Stock"
                value={realSummaryStats.lowStock}
                color={WARNING}
                active={itemFilter === "low"}
                onClick={() => setItemFilter(itemFilter === "low" ? "" : "low")}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                isDark={isDark}
                icon={<ErrorOutline />}
                label="Out of Stock"
                value={realSummaryStats.outOfStock}
                color={DANGER}
                active={itemFilter === "out"}
                onClick={() => setItemFilter(itemFilter === "out" ? "" : "out")}
              />
            </Grid>
          </Grid>

          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems="center">
            <TextField
              placeholder="Search by name, SKU, HSN..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              fullWidth
              InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
              sx={getInputSx(isDark)}
            />
            <Stack direction="row" spacing={1}>
              <IconButton
                onClick={() => setViewMode("list")}
                sx={{
                  border: isDark ? "1px solid rgba(255,255,255,0.15)" : "1px solid #e5e7eb",
                  bgcolor: viewMode === "list" ? INDIGO : "transparent",
                  color: viewMode === "list" ? "#fff" : isDark ? "#cbd5e1" : "inherit",
                  borderRadius: 2,
                }}
              >
                <ListAlt />
              </IconButton>
              <IconButton
                onClick={() => setViewMode("grid")}
                sx={{
                  border: isDark ? "1px solid rgba(255,255,255,0.15)" : "1px solid #e5e7eb",
                  bgcolor: viewMode === "grid" ? INDIGO : "transparent",
                  color: viewMode === "grid" ? "#fff" : isDark ? "#cbd5e1" : "inherit",
                  borderRadius: 2,
                }}
              >
                <GridView />
              </IconButton>
              <Button
                startIcon={<FilterAltOutlined />}
                variant={itemFilter ? "contained" : "outlined"}
                onClick={(event) => setFilterMenuAnchor(event.currentTarget)}
                sx={{
                  borderColor: itemFilter ? undefined : isDark ? "rgba(255, 255, 255, 0.15)" : "#e5e7eb",
                  bgcolor: itemFilter ? INDIGO : undefined,
                  color: itemFilter ? "#fff" : isDark ? "#f8fafc" : "#000",
                  fontWeight: 900,
                }}
              >
                Filters {itemFilter ? `(${itemFilter})` : ""}
              </Button>
              <Menu
                anchorEl={filterMenuAnchor}
                open={Boolean(filterMenuAnchor)}
                onClose={() => setFilterMenuAnchor(null)}
                PaperProps={{
                  sx: {
                    mt: 1,
                    minWidth: 200,
                    borderRadius: 2,
                    bgcolor: isDark ? "#121929" : "#fff",
                    color: isDark ? "#f8fafc" : "inherit",
                    border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e5e7eb",
                  },
                }}
              >
                <MenuItem
                  onClick={() => {
                    setItemFilter("");
                    setFilterMenuAnchor(null);
                  }}
                  selected={!itemFilter}
                >
                  All Items
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    setItemFilter("low");
                    setFilterMenuAnchor(null);
                  }}
                  selected={itemFilter === "low"}
                >
                  Low Stock
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    setItemFilter("out");
                    setFilterMenuAnchor(null);
                  }}
                  selected={itemFilter === "out"}
                >
                  Out of Stock
                </MenuItem>
                {categories.length > 0 && <Divider sx={{ my: 1, borderColor: isDark ? "rgba(255,255,255,0.08)" : undefined }} />}
                {categories.map((entry) => (
                  <MenuItem
                    key={entry.category}
                    onClick={() => {
                      setItemFilter(entry.category);
                      setFilterMenuAnchor(null);
                    }}
                    selected={itemFilter === entry.category}
                  >
                    {entry.category}
                  </MenuItem>
                ))}
              </Menu>
            </Stack>
          </Stack>

          {viewMode === "grid" ? (
            <Grid container spacing={2}>
              {visibleItems.length === 0 ? (
                <Grid item xs={12}>
                  <Paper sx={{ ...getSoftCard(isDark), p: 4, textAlign: "center" }}>
                    <Typography color={isDark ? "#94a3b8" : MUTED}>
                      {loading ? "Loading inventory items..." : "No inventory items found."}
                    </Typography>
                  </Paper>
                </Grid>
              ) : (
                visibleItems.map((item) => {
                  const stock = getAvailableStock(item);
                  const imageUrl = toBackendAssetUrl(item.imageUrl);
                  return (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={item._id || item.itemName}>
                      <Paper
                        elevation={0}
                        sx={{
                          ...getSoftCard(isDark),
                          p: 2,
                          borderRadius: 3,
                          display: "flex",
                          flexDirection: "column",
                          height: "100%",
                          transition: "transform 0.2s, box-shadow 0.2s",
                          "&:hover": {
                            transform: "translateY(-3px)",
                            boxShadow: isDark ? "0 10px 25px rgba(0,0,0,0.5)" : "0 10px 25px rgba(15,23,42,0.08)",
                          },
                        }}
                      >
                        <Box sx={{ position: "relative", width: "100%", height: 130, borderRadius: 2, overflow: "hidden", bgcolor: isDark ? "rgba(255,255,255,0.04)" : "#f8fafc", mb: 1.5, display: "grid", placeItems: "center" }}>
                          {imageUrl ? (
                            <img src={imageUrl} alt={item.itemName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            <ImageOutlined sx={{ fontSize: 40, color: isDark ? "#475569" : "#cbd5e1" }} />
                          )}
                          <Chip
                            size="small"
                            label={stock <= 0 ? "Out of Stock" : `${stock} ${item.unit || "pcs"}`}
                            sx={{
                              position: "absolute",
                              top: 8,
                              right: 8,
                              bgcolor: stock <= 0 ? alpha(DANGER, 0.9) : stock <= Number(item.reorderLevel || 0) ? alpha(WARNING, 0.9) : alpha(SUCCESS, 0.9),
                              color: "#fff",
                              fontWeight: 900,
                              fontSize: 11,
                            }}
                          />
                        </Box>
                        <Chip
                          size="small"
                          label={item.category || "General"}
                          sx={{
                            alignSelf: "flex-start",
                            bgcolor: alpha(BLUE, isDark ? 0.25 : 0.12),
                            color: isDark ? "#60a5fa" : BLUE,
                            fontWeight: 800,
                            mb: 0.5,
                          }}
                        />
                        <Typography variant="subtitle1" fontWeight={900} sx={{ color: isDark ? "#f8fafc" : "#0f172a", fontSize: 15, lineHeight: 1.3, mb: 0.5, flexGrow: 1 }}>
                          {item.itemName}
                        </Typography>
                        <Typography variant="caption" color={isDark ? "#94a3b8" : MUTED} sx={{ mb: 1 }}>
                          SKU: {item.sku || "-"}
                        </Typography>
                        <Divider sx={{ my: 1, borderColor: isDark ? "rgba(255,255,255,0.08)" : undefined }} />
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                          <Box>
                            <Typography variant="caption" color={isDark ? "#94a3b8" : MUTED} display="block">Price</Typography>
                            <Typography variant="subtitle1" fontWeight={900} color={isDark ? "#f8fafc" : "#0f172a"}>
                              {formatCurrency(item.pricing?.sellingPrice)}
                            </Typography>
                          </Box>
                          <Stack direction="row" spacing={0.5}>
                            <Tooltip title="View">
                              <IconButton size="small" onClick={() => openItemView(item)} sx={{ color: isDark ? "#60a5fa" : BLUE }}>
                                <VisibilityOutlined fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit">
                              <IconButton size="small" onClick={() => startEditItem(item)} sx={{ color: isDark ? "#60a5fa" : BLUE }}>
                                <EditOutlined fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton size="small" onClick={() => deleteItem(item)} sx={{ color: DANGER }}>
                                <DeleteOutline fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </Stack>
                      </Paper>
                    </Grid>
                  );
                })
              )}
            </Grid>
          ) : (
            <TableCard
              isDark={isDark}
              columns={["", "Item", "Category", "Price", "HSN/SAC", "Unit", "Stock", "Status", "Actions"]}
              columnSx={[
                { width: 44, textAlign: "center", px: 1 },
                { width: "20%" },
                { width: "24%" },
                { width: "11%" },
                { width: "9%" },
                { width: "7%" },
                { width: "8%" },
                { width: "8%" },
                { width: "13%", textAlign: "right", pr: 1.5 },
              ]}
              rows={visibleItems.map((item) => {
                const stock = getAvailableStock(item);
                const imageUrl = toBackendAssetUrl(item.imageUrl);
                return [
                  <Checkbox size="small" sx={{ p: 0, color: isDark ? "#64748b" : undefined }} />,
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                    <Box sx={{ width: 46, height: 42, flex: "0 0 auto", borderRadius: 1.5, bgcolor: isDark ? "rgba(255,255,255,0.05)" : "#f8fafc", display: "grid", placeItems: "center", color: isDark ? "#64748b" : "#94a3b8", overflow: "hidden" }}>
                      {imageUrl ? <img src={imageUrl} alt={item.itemName} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }} /> : <ImageOutlined />}
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography fontWeight={900} noWrap sx={{ color: isDark ? "#f8fafc" : "#0f172a" }}>{item.itemName}</Typography>
                      <Typography variant="body2" noWrap color={isDark ? "#94a3b8" : MUTED}>{item.description || item.sku}</Typography>
                    </Box>
                  </Stack>,
                  <Stack direction="row" spacing={0.7} alignItems="center" sx={{ minWidth: 0, maxWidth: "100%" }}>
                    <Chip size="small" label={item.category || "-"} sx={{ maxWidth: "54%", bgcolor: alpha(BLUE, isDark ? 0.25 : 0.12), color: isDark ? "#60a5fa" : BLUE, "& .MuiChip-label": { overflow: "hidden", textOverflow: "ellipsis" } }} />
                    {item.subcategory && <Chip size="small" label={item.subcategory} sx={{ maxWidth: "44%", bgcolor: isDark ? "rgba(255,255,255,0.08)" : "#f1f5f9", color: isDark ? "#cbd5e1" : "inherit", "& .MuiChip-label": { overflow: "hidden", textOverflow: "ellipsis" } }} />}
                  </Stack>,
                  <Box>
                    <Typography fontWeight={900} sx={{ color: isDark ? "#f8fafc" : "#0f172a" }}>{formatCurrency(item.pricing?.sellingPrice)}</Typography>
                    <Typography variant="caption" color={isDark ? "#94a3b8" : MUTED}>Cost: {formatCurrency(item.pricing?.purchaseCost)}</Typography>
                  </Box>,
                  <Typography variant="body2" sx={{ color: isDark ? "#e2e8f0" : "inherit" }}>{item.hsnSacCode || "-"}</Typography>,
                  <Typography variant="body2" sx={{ color: isDark ? "#e2e8f0" : "inherit" }}>{item.unit || "pcs"}</Typography>,
                  <Typography fontWeight={900} sx={{ color: isDark ? "#f8fafc" : "#0f172a", whiteSpace: "nowrap" }}>{stock} {item.unit || "pcs"}</Typography>,
                  <Chip size="small" label={stock <= 0 ? "Out" : "Active"} sx={{ bgcolor: alpha(stock <= 0 ? DANGER : SUCCESS, isDark ? 0.25 : 0.12), color: stock <= 0 ? DANGER : isDark ? "#4ade80" : SUCCESS, fontWeight: 800 }} />,
                  <Stack direction="row" spacing={0.25} justifyContent="flex-end" alignItems="center">
                    <Tooltip title="View"><IconButton size="small" onClick={() => openItemView(item)} sx={{ color: isDark ? "#60a5fa" : BLUE, p: 0.75 }}><VisibilityOutlined fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Edit"><IconButton size="small" onClick={() => startEditItem(item)} sx={{ color: isDark ? "#60a5fa" : BLUE, p: 0.75 }}><EditOutlined fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Delete"><IconButton size="small" onClick={() => deleteItem(item)} sx={{ color: DANGER, p: 0.75 }}><DeleteOutline fontSize="small" /></IconButton></Tooltip>
                  </Stack>,
                ];
              })}
              empty={loading ? "Loading inventory items..." : "No inventory items found."}
            />
          )}
          <Paper sx={{ ...getSoftCard(isDark), p: 2 }}>
            <Stack direction={{ xs: "column", sm: "row" }} alignItems="center" justifyContent="space-between" spacing={2}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography color={isDark ? "#94a3b8" : MUTED}>Per page:</Typography>
                <TextField
                  select
                  size="small"
                  value={pageSize}
                  onChange={(event) => {
                    setPageSize(Number(event.target.value));
                    setPage(1);
                  }}
                  sx={{ width: 86, ...getInputSx(isDark) }}
                >
                  {[10, 20, 50, 100].map((size) => (
                    <MenuItem key={size} value={size}>{size}</MenuItem>
                  ))}
                </TextField>
              </Stack>
              <Typography color={isDark ? "#94a3b8" : MUTED}>
                {pagination.total ? `${(pagination.page - 1) * pagination.limit + 1}-${Math.min(pagination.page * pagination.limit, pagination.total)} of ${pagination.total}` : "0 of 0"}
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button disabled={page <= 1} onClick={() => setPage((prev) => Math.max(prev - 1, 1))} variant="outlined" sx={{ borderColor: isDark ? "rgba(255,255,255,0.15)" : "#e5e7eb", color: isDark ? "#f8fafc" : undefined }}>
                  Prev
                </Button>
                <Button variant="contained" sx={{ bgcolor: INDIGO }}>{page}</Button>
                <Button disabled={page >= pagination.pages} onClick={() => setPage((prev) => prev + 1)} variant="outlined" sx={{ borderColor: isDark ? "rgba(255,255,255,0.15)" : "#e5e7eb", color: isDark ? "#f8fafc" : undefined }}>
                  Next
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </Stack>
      )}

      <Menu
        anchorEl={categoryMenuAnchor}
        open={Boolean(categoryMenuAnchor)}
        onClose={closeCategoryMenu}
        PaperProps={{
          sx: {
            mt: 1,
            width: 220,
            borderRadius: 2,
            bgcolor: isDark ? "#121929" : "#fff",
            color: isDark ? "#f8fafc" : "inherit",
            boxShadow: isDark ? "0 12px 30px rgba(0,0,0,0.6)" : "0 12px 30px rgba(15,23,42,0.18)",
            border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e5e7eb",
          },
        }}
      >
        <MenuItem onClick={() => categoryMenuRow && viewSubcategories(categoryMenuRow)} sx={{ gap: 1.5, py: 1.2 }}>
          <VisibilityOutlined fontSize="small" />
          <Typography>View Subcategories</Typography>
        </MenuItem>
        <MenuItem onClick={() => categoryMenuRow && startEditCategory(categoryMenuRow)} sx={{ gap: 1.5, py: 1.2 }}>
          <EditOutlined fontSize="small" />
          <Typography>Edit</Typography>
        </MenuItem>
        <MenuItem onClick={() => categoryMenuRow && deleteCategory(categoryMenuRow)} sx={{ gap: 1.5, py: 1.2, color: DANGER }}>
          <DeleteOutline fontSize="small" />
          <Typography>Delete</Typography>
        </MenuItem>
      </Menu>

      {/* Inventory Out Details Dialog */}
      <Dialog
        open={Boolean(selectedInventoryOutRecord)}
        onClose={() => setSelectedInventoryOutRecord(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            bgcolor: isDark ? "#0f172a" : "#fff",
            color: isDark ? "#f8fafc" : "inherit",
          },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h6" fontWeight={900}>
                Issue Details: {selectedInventoryOutRecord?.issueNumber}
              </Typography>
              <Typography variant="caption" color={isDark ? "#94a3b8" : MUTED}>
                Issued on {selectedInventoryOutRecord?.issueDate ? new Date(selectedInventoryOutRecord.issueDate).toLocaleString() : "-"}
              </Typography>
            </Box>
            <IconButton onClick={() => setSelectedInventoryOutRecord(null)}>
              <Close />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: isDark ? "rgba(255,255,255,0.1)" : undefined }}>
          {selectedInventoryOutRecord && (
            <Stack spacing={3}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Paper sx={{ ...getSoftCard(isDark), p: 2 }}>
                    <Typography variant="caption" color={isDark ? "#94a3b8" : MUTED} fontWeight={700}>
                      CUSTOMER INFO
                    </Typography>
                    <Typography variant="subtitle1" fontWeight={800} sx={{ mt: 0.5 }}>
                      {selectedInventoryOutRecord.customerName}
                    </Typography>
                    {selectedInventoryOutRecord.customerPhone && (
                      <Typography variant="body2" color={isDark ? "#cbd5e1" : "#475569"}>
                        📞 {selectedInventoryOutRecord.customerPhone}
                      </Typography>
                    )}
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Paper sx={{ ...getSoftCard(isDark), p: 2 }}>
                    <Typography variant="caption" color={isDark ? "#94a3b8" : MUTED} fontWeight={700}>
                      PROJECT DETAILS
                    </Typography>
                    <Typography variant="subtitle1" fontWeight={800} sx={{ mt: 0.5, color: INDIGO }}>
                      {selectedInventoryOutRecord.projectName} ({selectedInventoryOutRecord.projectCode})
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              <Box>
                <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1 }}>
                  Issued Materials Breakdown
                </Typography>
                <TableContainer component={Paper} sx={{ ...getSoftCard(isDark), overflow: "hidden" }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: isDark ? "#1e293b" : "#f8fafc" }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 800 }}>Item</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Brand / Model</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Qty</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Unit Cost</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Total Cost</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Serial Numbers</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(selectedInventoryOutRecord.items || []).map((it, idx) => (
                        <TableRow key={idx}>
                          <TableCell sx={{ fontWeight: 700 }}>{it.itemName}</TableCell>
                          <TableCell>{it.brand || it.model || "-"}</TableCell>
                          <TableCell sx={{ fontWeight: 800 }}>{it.quantity} {it.unit}</TableCell>
                          <TableCell>{formatCurrency(it.unitCost)}</TableCell>
                          <TableCell sx={{ fontWeight: 800, color: SUCCESS }}>{formatCurrency(it.totalCost)}</TableCell>
                          <TableCell>
                            {(it.serialNumbers || []).length > 0 ? (
                              <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ maxWidth: 200 }}>
                                {it.serialNumbers.map((s, sIdx) => (
                                  <Chip
                                    key={sIdx}
                                    size="small"
                                    label={s}
                                    sx={{
                                      height: 20,
                                      fontSize: 10,
                                      bgcolor: alpha("#7c3aed", isDark ? 0.25 : 0.1),
                                      color: isDark ? "#c084fc" : "#7c3aed",
                                      fontWeight: 700,
                                    }}
                                  />
                                ))}
                              </Stack>
                            ) : (
                              <Typography variant="caption" color={MUTED}>Non-serialized</Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>

              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ pt: 1 }}>
                <Box>
                  <Typography variant="caption" color={MUTED}>Status</Typography>
                  <Box>
                    <Chip
                      size="small"
                      label={selectedInventoryOutRecord.status?.toUpperCase()}
                      sx={{
                        bgcolor: alpha(selectedInventoryOutRecord.status === "cancelled" ? DANGER : SUCCESS, 0.15),
                        color: selectedInventoryOutRecord.status === "cancelled" ? DANGER : SUCCESS,
                        fontWeight: 800,
                      }}
                    />
                  </Box>
                  {selectedInventoryOutRecord.remarks && (
                    <Typography variant="body2" sx={{ mt: 1, fontStyle: "italic", color: MUTED }}>
                      Note: {selectedInventoryOutRecord.remarks}
                    </Typography>
                  )}
                </Box>
                <Paper sx={{ p: 2, bgcolor: alpha(SUCCESS, isDark ? 0.15 : 0.08), borderRadius: 2, textAlign: "right" }}>
                  <Typography variant="caption" color={MUTED} fontWeight={700}>
                    TOTAL MATERIAL VALUE
                  </Typography>
                  <Typography variant="h5" fontWeight={900} color={SUCCESS}>
                    {formatCurrency(selectedInventoryOutRecord.totalCost)}
                  </Typography>
                </Paper>
              </Stack>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button variant="contained" onClick={() => setSelectedInventoryOutRecord(null)} sx={{ bgcolor: INDIGO }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Issue Confirmation Dialog */}
      <Dialog
        open={Boolean(cancelIssueRecord)}
        onClose={() => setCancelIssueRecord(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            bgcolor: isDark ? "#0f172a" : "#fff",
            color: isDark ? "#f8fafc" : "inherit",
          },
        }}
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight={900} color={DANGER}>
            Cancel Inventory Issue & Restore Stock
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, color: isDark ? "#cbd5e1" : "#475569" }}>
            Are you sure you want to cancel Issue <strong>{cancelIssueRecord?.issueNumber}</strong>?
            This will reverse the transaction, return all issued quantities back to warehouse stock, release serial numbers, and deduct the material cost from the project total.
          </Typography>
          <TextField
            fullWidth
            label="Reason for Cancellation"
            placeholder="e.g. Issued wrong item, project cancelled, or material returned"
            value={cancelReasonInput}
            onChange={(e) => setCancelReasonInput(e.target.value)}
            multiline
            rows={2}
            sx={getInputSx(isDark)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setCancelIssueRecord(null)} disabled={cancellingIssue}>
            Close
          </Button>
          <Button
            variant="contained"
            onClick={handleCancelIssue}
            disabled={cancellingIssue}
            sx={{ bgcolor: DANGER, "&:hover": { bgcolor: "#dc2626" }, fontWeight: 800 }}
          >
            {cancellingIssue ? "Reversing..." : "Confirm & Return Stock"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Inventory Out Creation Dialog */}
      <InventoryOutDialog
        open={inventoryOutDialogOpen}
        onClose={() => setInventoryOutDialogOpen(false)}
        onSuccess={() => {
          fetchInventoryOut();
          fetchItems();
          showToast("Materials issued successfully to project!");
        }}
      />

      {/* Serial Traceability Modal */}
      <SerialTraceabilityModal
        open={serialTraceModalOpen}
        onClose={() => setSerialTraceModalOpen(false)}
      />


      {/* Select Converted Project Modal for Add Materials Flow */}
      <Dialog
        open={selectProjectModalOpen}
        onClose={() => setSelectProjectModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            bgcolor: isDark ? "#0f172a" : "#fff",
            backgroundImage: "none",
            border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e2e8f0",
            boxShadow: isDark ? "0 25px 50px -12px rgba(0,0,0,0.7)" : "0 25px 50px -12px rgba(0,0,0,0.15)",
          },
        }}
      >
        <DialogTitle sx={{ p: 2.5, pb: 1.5, borderBottom: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #f1f5f9" }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: 2.5,
                  display: "grid",
                  placeItems: "center",
                  bgcolor: alpha(INDIGO, isDark ? 0.25 : 0.12),
                  color: isDark ? "#818cf8" : INDIGO,
                }}
              >
                <SolarPower fontSize="medium" />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={900} color={isDark ? "#f8fafc" : "#0f172a"}>
                  Select Converted Project
                </Typography>
                <Typography variant="caption" color={isDark ? "#94a3b8" : "#64748b"}>
                  Showing converted projects with empty materials (no inventory issued yet)
                </Typography>
              </Box>
            </Stack>
            <IconButton onClick={() => setSelectProjectModalOpen(false)} size="small" sx={{ color: isDark ? "#94a3b8" : "#64748b" }}>
              <Close fontSize="small" />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ p: 2.5 }}>
          <Stack spacing={2.5}>
            {/* Search and stats bar */}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems="center" justifyContent="space-between">
              <TextField
                placeholder="Search by Customer name, Project code, Phone, City..."
                value={projectSearchQuery}
                onChange={(e) => setProjectSearchQuery(e.target.value)}
                fullWidth
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: isDark ? "#94a3b8" : "#64748b" }} />
                    </InputAdornment>
                  ),
                  endAdornment: projectSearchQuery ? (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setProjectSearchQuery("")}>
                        <Close fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                }}
                sx={getInputSx(isDark)}
              />
              <Stack direction="row" spacing={1} alignItems="center" flexShrink={0}>
                <Chip
                  size="medium"
                  label={`${filteredConvertedProjects.length} Pending Projects`}
                  sx={{
                    fontWeight: 800,
                    bgcolor: alpha(INDIGO, isDark ? 0.2 : 0.1),
                    color: isDark ? "#818cf8" : INDIGO,
                    borderRadius: 2,
                  }}
                />
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Refresh fontSize="small" />}
                  onClick={fetchConvertedProjectsWithNoMaterials}
                  disabled={loadingConvertedProjects}
                  sx={{
                    borderRadius: 2,
                    fontWeight: 800,
                    borderColor: isDark ? "rgba(255,255,255,0.15)" : "#e2e8f0",
                    color: isDark ? "#f8fafc" : "#0f172a",
                  }}
                >
                  Refresh
                </Button>
              </Stack>
            </Stack>

            {/* List area */}
            {loadingConvertedProjects ? (
              <Stack alignItems="center" justifyContent="center" py={6} spacing={2}>
                <CircularProgress size={36} sx={{ color: INDIGO }} />
                <Typography variant="body2" color={isDark ? "#94a3b8" : "#64748b"} fontWeight={600}>
                  Scanning converted projects with empty materials...
                </Typography>
              </Stack>
            ) : filteredConvertedProjects.length === 0 ? (
              <Paper
                sx={{
                  p: 4,
                  textAlign: "center",
                  borderRadius: 3,
                  border: isDark ? "1px dashed rgba(255,255,255,0.15)" : "1px dashed #cbd5e1",
                  bgcolor: isDark ? "rgba(255,255,255,0.02)" : "#f8fafc",
                }}
              >
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    bgcolor: alpha(SUCCESS, 0.12),
                    color: SUCCESS,
                    display: "grid",
                    placeItems: "center",
                    mx: "auto",
                    mb: 2,
                  }}
                >
                  <CheckCircleOutline sx={{ fontSize: 32 }} />
                </Box>
                <Typography variant="subtitle1" fontWeight={800} color={isDark ? "#f8fafc" : "#0f172a"}>
                  {projectSearchQuery ? "No matching converted projects found" : "All Converted Projects Have Materials Issued"}
                </Typography>
                <Typography variant="body2" color={isDark ? "#94a3b8" : "#64748b"} sx={{ maxWidth: 480, mx: "auto", mt: 0.5, mb: 2.5 }}>
                  {projectSearchQuery
                    ? "Try adjusting your search terms or clear the filter."
                    : "There are currently no converted projects waiting for initial material allocation."}
                </Typography>
                <Stack direction="row" spacing={1.5} justifyContent="center">
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setSelectProjectModalOpen(false);
                      setInventoryOutDialogOpen(true);
                    }}
                    sx={{ borderRadius: 2, fontWeight: 700 }}
                  >
                    Open Manual Issue Dialog
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<Refresh />}
                    onClick={fetchConvertedProjectsWithNoMaterials}
                    sx={{ bgcolor: INDIGO, borderRadius: 2, fontWeight: 700 }}
                  >
                    Refresh Projects
                  </Button>
                </Stack>
              </Paper>
            ) : (
              <Stack spacing={1.5} sx={{ maxHeight: "55vh", overflowY: "auto", pr: 0.5 }}>
                {filteredConvertedProjects.map((p) => {
                  const customerName = [p.firstName, p.lastName].filter(Boolean).join(" ") || p.consumerName || "Customer";
                  const pCode = p.projectCode || p.leadId || "PRJ-PENDING";
                  const systemSize = p.capacity || p.solarRequirement || p.projectType || "Solar System";
                  const city = p.city || p.section || p.address || "";
                  const phone = p.phone || p.contactNo || "";

                  return (
                    <Paper
                      key={p._id}
                      onClick={() => handleSelectProjectToIssueMaterials(p)}
                      sx={{
                        p: 2,
                        borderRadius: 2.5,
                        cursor: "pointer",
                        bgcolor: isDark ? "#121929" : "#ffffff",
                        border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e5e7eb",
                        transition: "all 0.2s ease",
                        "&:hover": {
                          borderColor: INDIGO,
                          bgcolor: isDark ? "rgba(99,102,241,0.08)" : "#f5f7ff",
                          transform: "translateY(-1px)",
                          boxShadow: isDark ? "0 6px 20px rgba(0,0,0,0.4)" : "0 6px 20px rgba(99,102,241,0.12)",
                        },
                      }}
                    >
                      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={1.5}>
                        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0, flex: 1 }}>
                          <Box
                            sx={{
                              width: 44,
                              height: 44,
                              borderRadius: 2,
                              bgcolor: alpha(INDIGO, isDark ? 0.25 : 0.1),
                              color: isDark ? "#818cf8" : INDIGO,
                              display: "grid",
                              placeItems: "center",
                              fontWeight: 900,
                              fontSize: 16,
                              flexShrink: 0,
                            }}
                          >
                            {customerName.charAt(0).toUpperCase()}
                          </Box>
                          <Box sx={{ minWidth: 0 }}>
                            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                              <Typography fontWeight={800} color={isDark ? "#f8fafc" : "#0f172a"} noWrap sx={{ fontSize: 15 }}>
                                {customerName}
                              </Typography>
                              <Chip
                                size="small"
                                label={pCode}
                                sx={{
                                  height: 22,
                                  fontSize: 11,
                                  fontWeight: 800,
                                  bgcolor: alpha(INDIGO, isDark ? 0.3 : 0.12),
                                  color: isDark ? "#a5b4fc" : INDIGO,
                                  borderRadius: 1.5,
                                }}
                              />
                              <Chip
                                size="small"
                                icon={<ElectricBolt sx={{ fontSize: "14px !important", color: "#f59e0b" }} />}
                                label={systemSize}
                                sx={{
                                  height: 22,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  bgcolor: isDark ? "rgba(245,158,11,0.15)" : "#fef3c7",
                                  color: isDark ? "#fbbf24" : "#b45309",
                                  borderRadius: 1.5,
                                }}
                              />
                            </Stack>
                            <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 0.5 }} flexWrap="wrap">
                              {city && (
                                <Stack direction="row" spacing={0.5} alignItems="center">
                                  <LocationOnOutlined sx={{ fontSize: 14, color: isDark ? "#94a3b8" : "#64748b" }} />
                                  <Typography variant="caption" color={isDark ? "#cbd5e1" : "#64748b"} fontWeight={600}>
                                    {city}
                                  </Typography>
                                </Stack>
                              )}
                              {phone && (
                                <Stack direction="row" spacing={0.5} alignItems="center">
                                  <PhoneOutlined sx={{ fontSize: 14, color: isDark ? "#94a3b8" : "#64748b" }} />
                                  <Typography variant="caption" color={isDark ? "#cbd5e1" : "#64748b"} fontWeight={600}>
                                    {phone}
                                  </Typography>
                                </Stack>
                              )}
                              <Chip
                                size="small"
                                label="Empty Materials"
                                sx={{
                                  height: 20,
                                  fontSize: 10.5,
                                  fontWeight: 800,
                                  bgcolor: isDark ? "rgba(16,185,129,0.15)" : "#ecfdf5",
                                  color: isDark ? "#34d399" : "#047857",
                                  borderRadius: 1,
                                }}
                              />
                            </Stack>
                          </Box>
                        </Stack>

                        <Button
                          variant="contained"
                          endIcon={<ArrowForward fontSize="small" />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectProjectToIssueMaterials(p);
                          }}
                          sx={{
                            bgcolor: INDIGO,
                            "&:hover": { bgcolor: "#3730a3" },
                            fontWeight: 800,
                            borderRadius: 2,
                            px: 2.2,
                            py: 0.8,
                            flexShrink: 0,
                            textTransform: "none",
                            fontSize: 13,
                          }}
                        >
                          Add Materials
                        </Button>
                      </Stack>
                    </Paper>
                  );
                })}
              </Stack>
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2, px: 2.5, borderTop: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #f1f5f9", justifyContent: "space-between" }}>
          <Button
            size="small"
            color="inherit"
            onClick={() => {
              setSelectProjectModalOpen(false);
              setInventoryOutDialogOpen(true);
            }}
            sx={{ fontWeight: 700, color: isDark ? "#94a3b8" : "#64748b", textTransform: "none" }}
          >
            Need manual issue? Click here
          </Button>
          <Button
            variant="outlined"
            onClick={() => setSelectProjectModalOpen(false)}
            sx={{
              borderRadius: 2,
              fontWeight: 700,
              borderColor: isDark ? "rgba(255,255,255,0.15)" : "#e2e8f0",
              color: isDark ? "#f8fafc" : "#0f172a",
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {categoryModalNode}
      {subCategoryModalNode}
      {importModalNode}
      {itemViewModalNode}
      {confirmDialogNode}
      {toastSnackbarNode}
    </Box>
  );
}

const TableCard = ({ columns, rows, empty, isDark = false, columnSx = [] }) => (
  <TableContainer component={Paper} sx={{ ...getSoftCard(isDark), overflow: "hidden" }}>
    <Table sx={{ tableLayout: "fixed", width: "100%" }}>
      <TableHead sx={{ bgcolor: isDark ? "#121929" : "#f8f8f9" }}>
        <TableRow>
          {columns.map((column, index) => (
            <TableCell key={column} sx={{ py: 2, px: 1.25, color: isDark ? "#cbd5e1" : "#596275", fontWeight: 900, textTransform: "uppercase", fontSize: 12, borderBottom: isDark ? "1px solid rgba(255,255,255,0.08)" : undefined, verticalAlign: "middle", ...columnSx[index] }}>
              {column}
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={columns.length} sx={{ borderBottom: "none" }}>
              <Typography align="center" color={isDark ? "#94a3b8" : MUTED} sx={{ py: 4 }}>{empty}</Typography>
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row, index) => (
            <TableRow key={index} hover sx={{ height: 76, "&:hover": { bgcolor: isDark ? "rgba(255,255,255,0.03) !important" : undefined } }}>
              {row.map((cell, cellIndex) => (
                <TableCell key={`${index}-${cellIndex}`} sx={{ py: 1.5, px: 1.25, borderBottom: isDark ? "1px solid rgba(255,255,255,0.05)" : undefined, color: isDark ? "#e2e8f0" : undefined, verticalAlign: "middle", overflow: "hidden", ...columnSx[cellIndex] }}>
                  {cell}
                </TableCell>
              ))}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </TableContainer>
);

export default InventoryERP;
