import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Tooltip,
  Stack,
  Switch,
  Divider,
  Tabs,
  Tab,
  InputBase,
  ButtonBase,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  Business,
  AdminPanelSettings,
  PeopleAlt,
  CloudDone,
  Add,
  Search,
  Edit,
  VpnKey,
  DeleteOutline,
  CloudUpload,
  Refresh,
  CheckCircle,
  Email,
  Phone,
  Visibility,
  VisibilityOff,
  ContentCopy,
  GridView,
  TableRows,
  Domain,
  VerifiedUser,
  AutoAwesome,
  CalendarToday,
  Circle,
  ShieldOutlined,
  ColorLensOutlined,
  SpeedOutlined,
  Close,
  RocketLaunch,
  Shield,
  Link as LinkIcon,
  LocationOnOutlined,
  PersonOutline,
  LockOutlined,
  ArrowBack,
  ArrowForward,
  AccessTime,
  EventAvailable,
  Timer,
  Security,
  CorporateFare,
  Badge,
  OpenInNew,
} from "@mui/icons-material";
import axiosInstance from "../utils/axiosConfig";
import { toast } from "../components/useToast.jsx";
import { useAuth } from "../contexts/AuthContext";
import { toBackendAssetUrl } from "../utils/backendAssetUrl";
import orgBannerSolar from "../assets/org-banner-solar.jpg";

export default function SuperAdminDashboard() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const normalizedRole = String(user?.role || "").trim().toUpperCase().replace(/[\s-]+/g, "_");
  const isSuperAdmin = ["SUPER_ADMIN", "SUPERADMIN"].includes(normalizedRole);

  useEffect(() => {
    if (user && !isSuperAdmin) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, isSuperAdmin, navigate]);

  // ─── Stats & Data States ────────────────────────────────────────────
  const [stats, setStats] = useState({
    totalCompanies: 0,
    activeCompanies: 0,
    inactiveCompanies: 0,
    totalAdmins: 0,
    totalUsers: 0,
    platformStatus: "Operational",
    systemVersion: "v2.5.0 SaaS Multi-Tenant",
  });
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'table'

  // ─── Create Admin Full Page State ───────────────────────────────────
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const isCreateView = isCreateOpen || location.pathname.endsWith("/new") || location.search.includes("view=new");

  const openCreatePage = () => {
    setIsCreateOpen(true);
    navigate("/super-admin/new");
  };

  const closeCreatePage = () => {
    setIsCreateOpen(false);
    navigate("/super-admin");
  };

  // ─── Organization Detail Full Page State ─────────────────────────────
  const { id: paramOrgId } = useParams();
  const urlOrgId =
    paramOrgId ||
    (location.pathname.includes("/super-admin/org/")
      ? location.pathname.split("/super-admin/org/")[1]?.split("/")[0]
      : location.pathname.includes("/super-admin/organization/")
        ? location.pathname.split("/super-admin/organization/")[1]?.split("/")[0]
        : null);

  const isDetailView = Boolean(urlOrgId);
  const selectedOrg = useMemo(() => {
    if (!urlOrgId) return null;
    return companies.find((c) => String(c._id) === String(urlOrgId)) || null;
  }, [companies, urlOrgId]);

  const closeDetailPage = () => {
    navigate("/super-admin");
  };

  const [quickValidityDuration, setQuickValidityDuration] = useState("1_month");
  const [quickCustomDate, setQuickCustomDate] = useState("");
  const [savingQuickValidity, setSavingQuickValidity] = useState(false);

  useEffect(() => {
    if (selectedOrg) {
      setQuickValidityDuration(selectedOrg.subscriptionValidity || "1_month");
      if (selectedOrg.subscriptionExpiresAt) {
        const d = new Date(selectedOrg.subscriptionExpiresAt);
        const iso = !isNaN(d.getTime()) ? d.toISOString().split("T")[0] : "";
        setQuickCustomDate(iso);
      } else {
        setQuickCustomDate("");
      }
    }
  }, [selectedOrg]);

  const handleUpdateQuickValidity = async () => {
    if (!selectedOrg) return;
    try {
      setSavingQuickValidity(true);
      const fd = new FormData();
      fd.append("name", selectedOrg.name || "");
      fd.append("validityDuration", quickValidityDuration);
      if (quickValidityDuration === "custom" && quickCustomDate) {
        fd.append("customExpiryDate", quickCustomDate);
      }
      await axiosInstance.put(`/super-admin/companies/${selectedOrg._id}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Organization access validity updated successfully!");
      fetchData();
    } catch (err) {
      console.error("Failed to update validity:", err);
      toast.error(err.response?.data?.message || "Failed to update validity");
    } finally {
      setSavingQuickValidity(false);
    }
  };

  const [creating, setCreating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [formData, setFormData] = useState({
    companyName: "",
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    address: "",
    plan: "Enterprise SaaS",
    companyLogoUrl: "",
    validityDuration: "1_month",
    customExpiryDate: "",
  });

  // ─── Edit Modal State ───────────────────────────────────────────────
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [editLogoPreview, setEditLogoPreview] = useState(null);
  const [editLogoFile, setEditLogoFile] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    phone: "",
    address: "",
    plan: "Enterprise SaaS",
    status: "active",
    logoUrl: "",
    validityDuration: "1_month",
    customExpiryDate: "",
  });

  // ─── Reset Password Modal State ─────────────────────────────────────
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetCompany, setResetCompany] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetting, setResetting] = useState(false);

  // ─── Delete Confirmation Modal ──────────────────────────────────────
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingCompany, setDeletingCompany] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ─── Fetch Platform Stats & Companies ───────────────────────────────
  const fetchData = useCallback(async () => {
    if (!isSuperAdmin) return;
    try {
      setLoading(true);
      const [statsRes, companiesRes] = await Promise.allSettled([
        axiosInstance.get("/super-admin/stats"),
        axiosInstance.get("/super-admin/companies"),
      ]);

      if (statsRes.status === "fulfilled") {
        setStats(statsRes.value.data?.result || statsRes.value.data?.data || stats);
      }

      if (companiesRes.status === "fulfilled") {
        const root = companiesRes.value.data?.result || companiesRes.value.data?.data || {};
        setCompanies(root.companies || (Array.isArray(root) ? root : []));
      }
    } catch (err) {
      console.error("Failed to load Super Admin data:", err);
      toast.error("Failed to load platform data");
    } finally {
      setLoading(false);
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const handleGlobalSearch = (e) => {
      if (typeof e.detail === "string") {
        setSearchQuery(e.detail);
      }
    };
    window.addEventListener("superAdminSearch", handleGlobalSearch);
    return () => window.removeEventListener("superAdminSearch", handleGlobalSearch);
  }, []);

  // ─── Dynamic Tab Counts ─────────────────────────────────────────────
  const tabCounts = useMemo(() => {
    let active = 0;
    let expired = 0;
    let inactive = 0;
    const now = new Date();
    companies.forEach((c) => {
      const isExp = c.subscriptionExpiresAt && new Date(c.subscriptionExpiresAt) < now;
      if (isExp) {
        expired++;
      } else if (c.status === "active") {
        active++;
      } else {
        inactive++;
      }
    });
    return {
      all: companies.length,
      active,
      expired,
      inactive,
    };
  }, [companies]);

  // ─── Filtered Companies ─────────────────────────────────────────────
  const filteredCompanies = useMemo(() => {
    const now = new Date();
    return companies.filter((c) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        c.name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.adminUser?.email?.toLowerCase().includes(q) ||
        c.adminUser?.employeeId?.toLowerCase().includes(q) ||
        c.adminUser?.firstName?.toLowerCase().includes(q) ||
        c.adminUser?.lastName?.toLowerCase().includes(q);

      const isExp = c.subscriptionExpiresAt && new Date(c.subscriptionExpiresAt) < now;

      const matchesTab =
        selectedTab === "all" ||
        (selectedTab === "active" && c.status === "active" && !isExp) ||
        (selectedTab === "expired" && isExp) ||
        (selectedTab === "inactive" && c.status === "inactive" && !isExp);

      return matchesSearch && matchesTab;
    });
  }, [companies, searchQuery, selectedTab]);

  // ─── Generate Strong Random Password ────────────────────────────────
  const generateRandomPassword = (target) => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
    let pwd = "";
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    if (target === "create") {
      setFormData((prev) => ({ ...prev, password: pwd }));
      setShowPassword(true);
    } else {
      setNewPassword(pwd);
      setShowNewPassword(true);
    }
    toast.info(`Generated password: ${pwd}`);
  };

  // ─── Handle Logo Selection for Create Modal ─────────────────────────
  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.warning("Logo file size must be less than 5MB");
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // ─── Submit Create Company & Admin ──────────────────────────────────
  const handleCreateCompanyAdmin = async (e) => {
    e.preventDefault();
    if (!formData.companyName.trim()) {
      toast.warning("Please enter a company name");
      return;
    }
    if (!formData.email.trim()) {
      toast.warning("Please enter admin email");
      return;
    }
    if (!formData.password || formData.password.length < 6) {
      toast.warning("Password must be at least 6 characters");
      return;
    }

    try {
      setCreating(true);
      const data = new FormData();
      data.append("companyName", formData.companyName.trim());
      data.append("email", formData.email.trim());
      data.append("password", formData.password);
      data.append("firstName", formData.firstName.trim() || "Admin");
      data.append("lastName", formData.lastName.trim() || "User");
      if (formData.phoneNumber) data.append("phoneNumber", formData.phoneNumber.trim());
      if (formData.address) data.append("address", formData.address.trim());
      data.append("plan", formData.plan);
      data.append("validityDuration", formData.validityDuration || "1_month");
      if (formData.customExpiryDate) {
        data.append("customExpiryDate", formData.customExpiryDate);
      }

      if (logoFile) {
        data.append("companyLogo", logoFile);
      } else if (formData.companyLogoUrl) {
        data.append("companyLogo", formData.companyLogoUrl.trim());
      }

      await axiosInstance.post("/super-admin/companies", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success(`Company "${formData.companyName}" & Admin created successfully!`);
      closeCreatePage();
      setFormData({
        companyName: "",
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        phoneNumber: "",
        address: "",
        plan: "Enterprise SaaS",
        companyLogoUrl: "",
        validityDuration: "1_month",
        customExpiryDate: "",
      });
      setLogoFile(null);
      setLogoPreview(null);
      fetchData();
    } catch (err) {
      console.error("Failed to create company admin:", err);
      toast.error(err.response?.data?.message || "Failed to create company admin");
    } finally {
      setCreating(false);
    }
  };

  // ─── Toggle Company Status ──────────────────────────────────────────
  const handleToggleStatus = async (company) => {
    try {
      await axiosInstance.patch(`/super-admin/companies/${company._id}/status`);
      const nextStatus = company.status === "active" ? "inactive" : "active";
      toast.success(`"${company.name}" is now ${nextStatus}`);
      setCompanies((prev) =>
        prev.map((c) =>
          c._id === company._id
            ? { ...c, status: nextStatus }
            : c
        )
      );
    } catch (err) {
      console.error("Failed to toggle status:", err);
      toast.error("Failed to update status");
    }
  };

  // ─── Open Edit Modal ────────────────────────────────────────────────
  const openEditModal = (comp) => {
    setEditingCompany(comp);
    setEditFormData({
      name: comp.name || "",
      phone: comp.phone || "",
      address: comp.address || "",
      plan: comp.plan || "Enterprise SaaS",
      status: comp.status || "active",
      logoUrl: comp.logo || "",
      validityDuration: comp.subscriptionValidity || "1_month",
      customExpiryDate: comp.subscriptionExpiresAt ? String(comp.subscriptionExpiresAt).slice(0, 10) : "",
    });
    setEditLogoPreview(toBackendAssetUrl(comp.logo) || null);
    setEditLogoFile(null);
    setEditModalOpen(true);
  };

  // ─── Handle Edit Logo ───────────────────────────────────────────────
  const handleEditLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // ─── Save Company Edit ──────────────────────────────────────────────
  const handleUpdateCompany = async (e) => {
    e.preventDefault();
    if (!editFormData.name.trim()) {
      toast.warning("Company name cannot be empty");
      return;
    }

    try {
      setUpdating(true);
      const data = new FormData();
      data.append("name", editFormData.name.trim());
      if (editFormData.phone) data.append("phone", editFormData.phone.trim());
      if (editFormData.address) data.append("address", editFormData.address.trim());
      data.append("plan", editFormData.plan);
      data.append("status", editFormData.status);
      if (editFormData.validityDuration) {
        data.append("validityDuration", editFormData.validityDuration);
      }
      if (editFormData.customExpiryDate) {
        data.append("customExpiryDate", editFormData.customExpiryDate);
      }

      if (editLogoFile) {
        data.append("companyLogo", editLogoFile);
      } else if (editFormData.logoUrl) {
        data.append("logo", editFormData.logoUrl.trim());
      }

      await axiosInstance.put(`/super-admin/companies/${editingCompany._id}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Company updated successfully!");
      setEditModalOpen(false);
      fetchData();
    } catch (err) {
      console.error("Failed to update company:", err);
      toast.error(err.response?.data?.message || "Failed to update company");
    } finally {
      setUpdating(false);
    }
  };

  // ─── Open Reset Password Modal ──────────────────────────────────────
  const openResetPasswordModal = (comp) => {
    setResetCompany(comp);
    setNewPassword("");
    const existingPassword = comp?.adminPassword || comp?.adminUser?.viewPassword || "";
    setNewPassword(existingPassword);
    setShowNewPassword(true);
    setResetModalOpen(true);
  };

  // ─── Submit Reset Password ──────────────────────────────────────────
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.warning("Password must be at least 6 characters");
      return;
    }

    try {
      setResetting(true);
      await axiosInstance.post(`/super-admin/companies/${resetCompany._id}/reset-password`, {
        password: newPassword,
      });

      toast.success(`Password for ${resetCompany.name} admin reset successfully!`);
      toast.success(`Password for ${resetCompany.name} admin updated successfully!`);
      setResetModalOpen(false);
      setNewPassword("");
      fetchData();
    } catch (err) {
      console.error("Failed to reset password:", err);
      toast.error(err.response?.data?.message || "Failed to reset password");
    } finally {
      setResetting(false);
    }
  };

  // ─── Delete Company Confirmation ────────────────────────────────────
  const openDeleteModal = (comp) => {
    setDeletingCompany(comp);
    setDeleteModalOpen(true);
  };

  const handleDeleteCompany = async () => {
    if (!deletingCompany) return;
    try {
      setDeleting(true);
      await axiosInstance.delete(`/super-admin/companies/${deletingCompany._id}`);
      toast.success(`Company "${deletingCompany.name}" deleted successfully`);
      setDeleteModalOpen(false);
      setDeletingCompany(null);
      if (isDetailView) {
        navigate("/super-admin");
      }
      fetchData();
    } catch (err) {
      console.error("Failed to delete company:", err);
      toast.error(err.response?.data?.message || "Failed to delete company");
    } finally {
      setDeleting(false);
    }
  };

  // ─── Copy Email to Clipboard ────────────────────────────────────────
  const copyToClipboard = (text, label = "Email") => {
    navigator.clipboard.writeText(text);
    toast.info(`Copied ${label} "${text}" to clipboard`);
  };

  if (!isSuperAdmin) {
    return null;
  }

  // ─── Helper for Expiration Preview ──────────────────────────────────
  const getExpiryPreview = (duration, customDate) => {
    if (duration === "unlimited") {
      return { text: "Lifetime Access (No Expiration)", isExpired: false };
    }
    if (duration === "custom") {
      if (!customDate) return { text: "Please pick an expiry date below", isExpired: false };
      const d = new Date(customDate);
      const diffDays = Math.ceil((d - new Date()) / (1000 * 60 * 60 * 24));
      return {
        text: `Access Valid until: ${d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })} (${diffDays > 0 ? `${diffDays} days from now` : "Expired"})`,
        isExpired: diffDays <= 0,
      };
    }
    const d = new Date();
    if (duration === "1_month") d.setMonth(d.getMonth() + 1);
    else if (duration === "3_months") d.setMonth(d.getMonth() + 3);
    else if (duration === "6_months") d.setMonth(d.getMonth() + 6);
    else if (duration === "1_year") d.setFullYear(d.getFullYear() + 1);
    else d.setMonth(d.getMonth() + 1);

    const diffDays = Math.ceil((d - new Date()) / (1000 * 60 * 60 * 24));
    return {
      text: `Access Valid until: ${d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })} (${diffDays} days from now)`,
      isExpired: false,
    };
  };

  const VALIDITY_OPTIONS = [
    { value: "1_month", label: "1 Month", badge: "30 Days", icon: <AccessTime sx={{ fontSize: 16, color: "#3b82f6" }} />, color: "#3b82f6" },
    { value: "3_months", label: "3 Months", badge: "90 Days", icon: <AccessTime sx={{ fontSize: 16, color: "#3b82f6" }} />, color: "#3b82f6" },
    { value: "6_months", label: "6 Months", badge: "180 Days", icon: <AccessTime sx={{ fontSize: 16, color: "#3b82f6" }} />, color: "#3b82f6" },
    { value: "1_year", label: "1 Year", badge: "365 Days", icon: <EventAvailable sx={{ fontSize: 16, color: "#22c55e" }} />, color: "#22c55e" },
    { value: "custom", label: "Custom Date", badge: "Pick Date", icon: <CalendarToday sx={{ fontSize: 16, color: "#f59e0b" }} />, color: "#f59e0b" },
    { value: "unlimited", label: "Lifetime", badge: "Unlimited", icon: <AutoAwesome sx={{ fontSize: 16, color: "#a855f7" }} />, color: "#a855f7" },
  ];

  const renderValiditySelect = (value, onChange) => (
    <Select
      fullWidth
      size="small"
      value={value}
      onChange={onChange}
      renderValue={(selected) => {
        const opt = VALIDITY_OPTIONS.find((o) => o.value === selected) || VALIDITY_OPTIONS[0];
        return (
          <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ width: "100%", pr: 0.5 }}>
            <Stack direction="row" spacing={0.9} alignItems="center" sx={{ minWidth: 0 }}>
              {opt.icon}
              <Typography component="span" sx={{ fontSize: "0.84rem", fontWeight: 700, color: isDark ? "#f8fafc" : "#0f172a", whiteSpace: "nowrap" }}>
                {opt.label}
              </Typography>
            </Stack>
            <Chip
              label={opt.badge}
              size="small"
              sx={{
                height: 20,
                fontSize: "0.68rem",
                fontWeight: 700,
                bgcolor: isDark ? "rgba(59, 130, 246, 0.14)" : "rgba(37, 99, 235, 0.08)",
                color: isDark ? "#93c5fd" : "#1d4ed8",
                borderRadius: "6px",
                "& .MuiChip-label": { px: 0.9 },
              }}
            />
          </Stack>
        );
      }}
      MenuProps={{
        PaperProps: {
          sx: {
            mt: 0.8,
            borderRadius: "14px",
            bgcolor: isDark ? "#0b1426" : "#ffffff",
            border: `1px solid ${isDark ? "rgba(56, 189, 248, 0.22)" : "#e2e8f0"}`,
            boxShadow: isDark
              ? "0 18px 40px rgba(0, 0, 0, 0.7)"
              : "0 12px 32px rgba(15, 23, 42, 0.12)",
            backgroundImage: "none",
            "& .MuiList-root": { p: 0.75 },
          },
        },
      }}
      sx={{
        borderRadius: "10px",
        bgcolor: isDark ? "#081020" : "#ffffff",
        height: 44,
        "& .MuiOutlinedInput-notchedOutline": { borderColor: isDark ? "rgba(148, 163, 184, 0.22)" : "#cbd5e1" },
        "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: isDark ? "rgba(148, 163, 184, 0.45)" : "#94a3b8" },
        "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: isDark ? "#3b82f6" : "#2563eb" },
        "& .MuiSelect-icon": { color: isDark ? "#94a3b8" : "#64748b" },
        "& .MuiSelect-select": {
          display: "flex",
          alignItems: "center",
          py: 0,
        },
      }}
    >
      {VALIDITY_OPTIONS.map((opt) => {
        const isSelected = value === opt.value;
        return (
          <MenuItem
            key={opt.value}
            value={opt.value}
            sx={{
              borderRadius: "10px",
              px: 1.4,
              py: 1,
              my: 0.25,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
              bgcolor: isSelected
                ? isDark
                  ? "rgba(59, 130, 246, 0.16)"
                  : "rgba(37, 99, 235, 0.08)"
                : "transparent",
              "&:hover": {
                bgcolor: isDark ? "rgba(148, 163, 184, 0.1)" : "#f1f5f9",
              },
              "&.Mui-selected": {
                bgcolor: isDark ? "rgba(59, 130, 246, 0.18)" : "rgba(37, 99, 235, 0.1)",
                "&:hover": {
                  bgcolor: isDark ? "rgba(59, 130, 246, 0.24)" : "rgba(37, 99, 235, 0.14)",
                },
              },
            }}
          >
            <Stack direction="row" spacing={1.2} alignItems="center">
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: isDark ? "rgba(255,255,255,0.05)" : "#f8fafc",
                }}
              >
                {opt.icon}
              </Box>
              <Typography sx={{ fontSize: "0.85rem", fontWeight: isSelected ? 700 : 600, color: isDark ? "#f8fafc" : "#0f172a" }}>
                {opt.label}
              </Typography>
            </Stack>
            <Chip
              label={opt.badge}
              size="small"
              sx={{
                height: 22,
                fontSize: "0.7rem",
                fontWeight: 700,
                borderRadius: "6px",
                bgcolor: isSelected
                  ? isDark
                    ? "rgba(59, 130, 246, 0.25)"
                    : "rgba(37, 99, 235, 0.14)"
                  : isDark
                    ? "rgba(148, 163, 184, 0.1)"
                    : "#f1f5f9",
                color: isSelected
                  ? isDark
                    ? "#93c5fd"
                    : "#1d4ed8"
                  : isDark
                    ? "#94a3b8"
                    : "#64748b",
              }}
            />
          </MenuItem>
        );
      })}
    </Select>
  );

  // ─── Reusable Modals (Edit, Reset Password, Delete) ──────────────────
  const renderCommonModals = () => (
    <>
      {/* ═══════════════ MODAL: EDIT COMPANY (MATCHING POLISH) ═══════════════ */}
      <Dialog
        open={editModalOpen}
        onClose={() => !updating && setEditModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "24px",
            bgcolor: isDark ? "#0a1120" : "#fff",
            backgroundImage: "none",
            border: `1px solid ${isDark ? "rgba(56, 189, 248, 0.25)" : "#e2e8f0"}`,
            boxShadow: isDark
              ? "0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 50px rgba(56, 189, 248, 0.12)"
              : "0 25px 60px -15px rgba(37, 99, 235, 0.25)",
            overflow: "hidden",
          },
        }}
      >
        <DialogTitle sx={{ px: { xs: 2.5, sm: 3.5 }, pt: 3, pb: 1.5, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar sx={{ bgcolor: "rgba(56, 189, 248, 0.15)", color: "#38bdf8", width: 44, height: 44, borderRadius: "12px" }}>
              <Edit />
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight={900}>
                Edit Organization Details
              </Typography>
              <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b" }}>
                Update branding, company name, contact info or status
              </Typography>
            </Box>
          </Stack>
          <IconButton onClick={() => setEditModalOpen(false)} sx={{ color: isDark ? "#94a3b8" : "#64748b" }}>
            <Close />
          </IconButton>
        </DialogTitle>

        <form onSubmit={handleUpdateCompany}>
          <DialogContent sx={{ px: { xs: 2.5, sm: 3.5 }, py: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  size="small"
                  label="Company Name"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px", bgcolor: isDark ? "#0d1527" : "#fff" } }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Subscription Plan</InputLabel>
                  <Select
                    value={editFormData.plan}
                    label="Subscription Plan"
                    onChange={(e) => setEditFormData({ ...editFormData, plan: e.target.value })}
                    sx={{ borderRadius: "12px", bgcolor: isDark ? "#0d1527" : "#fff" }}
                  >
                    <MenuItem value="Enterprise SaaS">Enterprise SaaS</MenuItem>
                    <MenuItem value="Professional">Professional</MenuItem>
                    <MenuItem value="Starter">Starter</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={editFormData.status}
                    label="Status"
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                    sx={{ borderRadius: "12px", bgcolor: isDark ? "#0d1527" : "#fff" }}
                  >
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Extend / Set Validity</InputLabel>
                  <Select
                    value={editFormData.validityDuration || "1_month"}
                    label="Extend / Set Validity"
                    onChange={(e) => setEditFormData({ ...editFormData, validityDuration: e.target.value })}
                    sx={{ borderRadius: "12px", bgcolor: isDark ? "#0d1527" : "#fff" }}
                  >
                    <MenuItem value="1_month">+1 Month (30 Days)</MenuItem>
                    <MenuItem value="3_months">+3 Months (90 Days)</MenuItem>
                    <MenuItem value="6_months">+6 Months (180 Days)</MenuItem>
                    <MenuItem value="1_year">+1 Year (365 Days)</MenuItem>
                    <MenuItem value="custom">Custom Expiry Date...</MenuItem>
                    <MenuItem value="unlimited">Unlimited / Lifetime</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {editFormData.validityDuration === "custom" && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="date"
                    size="small"
                    label="Expiry Date"
                    InputLabelProps={{ shrink: true }}
                    value={editFormData.customExpiryDate}
                    onChange={(e) => setEditFormData({ ...editFormData, customExpiryDate: e.target.value })}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px", bgcolor: isDark ? "#0d1527" : "#fff" } }}
                  />
                </Grid>
              )}

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Contact Phone"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px", bgcolor: isDark ? "#0d1527" : "#fff" } }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Office Address"
                  value={editFormData.address}
                  onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px", bgcolor: isDark ? "#0d1527" : "#fff" } }}
                />
              </Grid>

              {/* Logo Upload Strip */}
              <Grid item xs={12}>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ p: 1.5, borderRadius: "14px", bgcolor: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc" }}>
                  <Avatar
                    src={editLogoPreview || editFormData.logoUrl}
                    variant="rounded"
                    sx={{ width: 52, height: 52, borderRadius: "14px", bgcolor: isDark ? "#1e293b" : "#e2e8f0" }}
                  >
                    {editFormData.name?.[0] || "C"}
                  </Avatar>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<CloudUpload />}
                    size="small"
                    sx={{ borderRadius: "10px", fontWeight: 700 }}
                  >
                    Change Logo
                    <input type="file" accept="image/*" hidden onChange={handleEditLogoChange} />
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions sx={{ px: { xs: 2.5, sm: 3.5 }, pb: 3, pt: 1.5, borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#e2e8f0"}` }}>
            <Button variant="outlined" onClick={() => setEditModalOpen(false)} sx={{ borderRadius: "12px" }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={updating}
              sx={{
                background: "linear-gradient(135deg, #0284c7 0%, #2563eb 100%)",
                fontWeight: 800,
                borderRadius: "12px",
                px: 3,
              }}
            >
              {updating ? "Saving..." : "Save Changes"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ═══════════════ MODAL: RESET ADMIN PASSWORD ═══════════════ */}
      <Dialog
        open={resetModalOpen}
        onClose={() => !resetting && setResetModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "24px",
            bgcolor: isDark ? "#0a1120" : "#fff",
            backgroundImage: "none",
            border: `1px solid ${isDark ? "rgba(245, 158, 11, 0.3)" : "#e2e8f0"}`,
            boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.7)",
          },
        }}
      >
        <DialogTitle sx={{ px: 3, pt: 3, pb: 1 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar sx={{ bgcolor: "rgba(245, 158, 11, 0.15)", color: "#f59e0b", width: 44, height: 44, borderRadius: "12px" }}>
              <VpnKey />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={900}>
                Reset Admin Password
              </Typography>
              <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b" }}>
                {resetCompany?.name}
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>

        <form onSubmit={handleResetPassword}>
          <DialogContent sx={{ px: 3, py: 2 }}>
            <Typography variant="body2" sx={{ color: isDark ? "#cbd5e1" : "#475569", mb: 2 }}>
              Enter a new secure password for <b>{resetCompany?.email || "this company admin"}</b>:
              Current / New password for <b>{resetCompany?.email || "this company admin"}</b>:
            </Typography>

            <TextField
              fullWidth
              required
              size="small"
              type={showNewPassword ? "text" : "password"}
              label="New Admin Password"
              placeholder="Minimum 6 characters"
              label="Admin Password"
              placeholder="Enter or view admin password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px", bgcolor: isDark ? "#0d1527" : "#fff" } }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    {newPassword && (
                      <Tooltip title="Copy Password">
                        <IconButton
                          size="small"
                          onClick={() => copyToClipboard(newPassword, "Admin Password")}
                          sx={{ color: isDark ? "#94a3b8" : "#64748b", mr: 0.5 }}
                        >
                          <ContentCopy sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Generate Strong Password">
                      <IconButton size="small" onClick={() => generateRandomPassword("reset")} sx={{ color: "#38bdf8", mr: 0.5 }}>
                        <AutoAwesome sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                    <IconButton size="small" onClick={() => setShowNewPassword(!showNewPassword)}>
                      {showNewPassword ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 3, pt: 1, borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#e2e8f0"}` }}>
            <Button variant="outlined" onClick={() => setResetModalOpen(false)} sx={{ borderRadius: "12px" }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={resetting}
              sx={{
                bgcolor: "#f59e0b",
                color: "#fff",
                fontWeight: 800,
                borderRadius: "12px",
                px: 3,
                "&:hover": { bgcolor: "#d97706" },
              }}
            >
              {resetting ? "Resetting..." : "Reset Password"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ═══════════════ MODAL: DELETE COMPANY CONFIRMATION ═══════════════ */}
      <Dialog
        open={deleteModalOpen}
        onClose={() => !deleting && setDeleteModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "24px",
            bgcolor: isDark ? "#0a1120" : "#fff",
            backgroundImage: "none",
            border: `1px solid ${isDark ? "rgba(239, 68, 68, 0.3)" : "#e2e8f0"}`,
          },
        }}
      >
        <DialogTitle sx={{ px: 3, pt: 3, pb: 1 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar sx={{ bgcolor: "rgba(239, 68, 68, 0.12)", color: "#ef4444", width: 44, height: 44, borderRadius: "12px" }}>
              <DeleteOutline />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={900}>
                Delete Tenant Company
              </Typography>
              <Typography variant="caption" sx={{ color: "#ef4444" }}>
                Warning: Permanent Action
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ px: 3, py: 2 }}>
          <Typography variant="body2" sx={{ color: isDark ? "#cbd5e1" : "#475569" }}>
            Are you sure you want to delete <b>"{deletingCompany?.name}"</b>?
            This will permanently remove their company record and deactivate their admin login.
          </Typography>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, pt: 1, borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#e2e8f0"}` }}>
          <Button variant="outlined" onClick={() => setDeleteModalOpen(false)} sx={{ borderRadius: "12px" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={deleting}
            onClick={handleDeleteCompany}
            sx={{
              bgcolor: "#ef4444",
              color: "#fff",
              fontWeight: 800,
              borderRadius: "12px",
              px: 3,
              "&:hover": { bgcolor: "#dc2626" },
            }}
          >
            {deleting ? "Deleting..." : "Delete Permanently"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );

  // ─── FULL PAGE VIEW: CREATE NEW ORGANIZATION ───────────────────────
  if (isCreateView) {
    const expiryInfo = getExpiryPreview(formData.validityDuration, formData.customExpiryDate);
    const createFieldSx = {
      "& .MuiOutlinedInput-root": {
        borderRadius: "10px",
        bgcolor: isDark ? "#081020" : "#ffffff",
        color: isDark ? "#f8fafc" : "#0f172a",
        height: 44,
        "& fieldset": { borderColor: isDark ? "rgba(148, 163, 184, 0.22)" : "#cbd5e1" },
        "&:hover fieldset": { borderColor: isDark ? "rgba(148, 163, 184, 0.45)" : "#94a3b8" },
        "&.Mui-focused fieldset": { borderColor: isDark ? "#3b82f6" : "#2563eb" },
        "& input": {
          color: isDark ? "#f8fafc" : "#0f172a",
          "&::placeholder": { color: isDark ? "#64748b" : "#94a3b8", opacity: 1 },
        },
      },
    };
    const createLabelSx = {
      fontSize: "0.76rem",
      fontWeight: 700,
      color: isDark ? "#cbd5e1" : "#1e293b",
      mb: 0.5,
    };
    const createIconSx = { color: isDark ? "#94a3b8" : "#475569", fontSize: 18 };

    return (
      <Box
        sx={{
          minHeight: "calc(100vh - 72px)",
          bgcolor: isDark ? "#060b13" : "#f1f5f9",
          p: { xs: 2, sm: 3, md: 4 },
        }}
      >
        {/* Navigation Breadcrumb / Back button */}
        <Box sx={{ maxWidth: 1140, mx: "auto", mb: 3 }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
            spacing={1.5}
          >
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Button
                startIcon={<ArrowBack sx={{ fontSize: 18 }} />}
                onClick={closeCreatePage}
                sx={{
                  color: isDark ? "#94a3b8" : "#334155",
                  bgcolor: isDark ? "rgba(255,255,255,0.06)" : "#ffffff",
                  border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "#cbd5e1"}`,
                  borderRadius: "10px",
                  px: 2,
                  py: 0.7,
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  textTransform: "none",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                  "&:hover": {
                    bgcolor: isDark ? "rgba(255,255,255,0.1)" : "#f8fafc",
                    color: isDark ? "#f8fafc" : "#0f172a",
                  },
                }}
              >
                Back to Directory
              </Button>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography
                  onClick={closeCreatePage}
                  sx={{
                    cursor: "pointer",
                    fontSize: "0.88rem",
                    fontWeight: 600,
                    color: isDark ? "#64748b" : "#64748b",
                    "&:hover": { color: "#2563eb" },
                  }}
                >
                  Organizations
                </Typography>
                <Typography sx={{ color: isDark ? "#475569" : "#94a3b8", fontSize: "0.88rem" }}>/</Typography>
                <Typography sx={{ fontSize: "0.88rem", fontWeight: 700, color: isDark ? "#f8fafc" : "#0f172a" }}>
                  Deploy New Tenant
                </Typography>
              </Box>
            </Stack>

            <Chip
              icon={<VerifiedUser sx={{ fontSize: "16px !important", color: "#38bdf8" }} />}
              label="SaaS Isolated Tenant Setup"
              size="small"
              sx={{
                bgcolor: isDark ? "rgba(56, 189, 248, 0.12)" : "rgba(37, 99, 235, 0.08)",
                color: isDark ? "#38bdf8" : "#2563eb",
                fontWeight: 700,
                fontSize: "0.76rem",
                borderRadius: "8px",
              }}
            />
          </Stack>
        </Box>

        {/* ─── Elevated Full-Page 2-Column Split Card ─── */}
        <Box
          sx={{
            maxWidth: 1140,
            mx: "auto",
            borderRadius: "24px",
            bgcolor: isDark ? "#0d1629" : "#ffffff",
            boxShadow: isDark
              ? "0 20px 60px rgba(0, 0, 0, 0.6)"
              : "0 10px 40px -10px rgba(15, 23, 42, 0.08)",
            border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.1)" : "#e2e8f0"}`,
            overflow: "hidden",
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            minHeight: 620,
          }}
        >
          {/* Left Column: Crisp Solar Hero Banner */}
          <Box
            sx={{
              width: { xs: "100%", md: 340 },
              minWidth: { md: 340 },
              maxWidth: { md: 340 },
              bgcolor: "#060d1c",
              position: "relative",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              p: { xs: 3, md: 3.5 },
              overflow: "hidden",
              flexShrink: 0,
              borderRight: isDark ? "1px solid rgba(56, 189, 248, 0.14)" : "none",
            }}
          >
            {/* Full-bleed Solar Home Background Image */}
            <Box
              component="img"
              src={orgBannerSolar}
              alt="Solar Smart Organization"
              sx={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center center",
                display: "block",
              }}
            />

            {/* Top & Bottom Contrast Gradient Scrim */}
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(180deg, rgba(6, 13, 28, 0.88) 0%, rgba(6, 13, 28, 0.35) 36%, rgba(6, 13, 28, 0.12) 60%, rgba(6, 13, 28, 0.92) 100%)",
                pointerEvents: "none",
              }}
            />

            {/* Top Brand Header */}
            <Box sx={{ position: "relative", zIndex: 1 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: "12px",
                  bgcolor: "rgba(15, 23, 42, 0.65)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(251, 191, 36, 0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mb: 2,
                }}
              >
                <CorporateFare sx={{ color: "#fbbf24", fontSize: 24 }} />
              </Box>
              <Typography
                sx={{
                  fontFamily: "'Birdie', sans-serif",
                  color: "#ffffff",
                  fontSize: "1.95rem",
                  fontWeight: 700,
                  lineHeight: 1.12,
                  letterSpacing: "0.01em",
                  textShadow: "0 2px 14px rgba(0, 0, 0, 0.55)",
                }}
              >
                Create New
                <Box
                  component="span"
                  sx={{
                    display: "block",
                    fontFamily: "'Birdie', sans-serif",
                    background: "linear-gradient(90deg, #fde68a 0%, #f59e0b 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Organization
                </Box>
              </Typography>
              <Typography
                sx={{
                  color: "#e2e8f0",
                  fontSize: "0.82rem",
                  lineHeight: 1.5,
                  mt: 1.2,
                  textShadow: "0 1px 8px rgba(0, 0, 0, 0.65)",
                }}
              >
                Set up your organization and get started with powerful workspace tools.
              </Typography>
            </Box>

            {/* Bottom Feature Highlights */}
            <Stack spacing={1.2} sx={{ position: "relative", zIndex: 1, mt: "auto", pt: 16 }}>
              {[
                { icon: <ColorLensOutlined sx={{ fontSize: 17, color: "#fbbf24" }} />, label: "Custom Branding" },
                { icon: <PeopleAlt sx={{ fontSize: 17, color: "#fbbf24" }} />, label: "Manage Your Team" },
                { icon: <RocketLaunch sx={{ fontSize: 17, color: "#fbbf24" }} />, label: "Deploy Workspace" },
              ].map((item) => (
                <Stack
                  key={item.label}
                  direction="row"
                  spacing={1.3}
                  alignItems="center"
                  sx={{
                    px: 1.2,
                    py: 0.7,
                    borderRadius: "10px",
                    bgcolor: "rgba(6, 13, 28, 0.58)",
                    backdropFilter: "blur(8px)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                  }}
                >
                  <Box
                    sx={{
                      width: 26,
                      height: 26,
                      borderRadius: "8px",
                      bgcolor: "rgba(251, 191, 36, 0.16)",
                      border: "1px solid rgba(251, 191, 36, 0.28)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {item.icon}
                  </Box>
                  <Typography sx={{ color: "#f8fafc", fontSize: "0.82rem", fontWeight: 600 }}>
                    {item.label}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Box>

          {/* Right Column: Theme-Aware Form Content */}
          <Box
            component="form"
            onSubmit={handleCreateCompanyAdmin}
            sx={{
              flex: 1,
              p: { xs: 2.5, sm: 4, md: 4.5 },
              bgcolor: isDark ? "#0d1629" : "#ffffff",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            {/* Header with amber bar */}
            <Box sx={{ mb: 2.5 }}>
              <Box sx={{ width: 36, height: 4, bgcolor: "#f59e0b", borderRadius: "4px", mb: 1.2 }} />
              <Typography
                sx={{
                  fontFamily: "'Birdie', sans-serif",
                  color: isDark ? "#f8fafc" : "#0f172a",
                  fontSize: "1.6rem",
                  fontWeight: 700,
                  letterSpacing: "0.01em",
                }}
              >
                Organization Details
              </Typography>
              <Typography sx={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.82rem", mt: 0.3 }}>
                Configure organization credentials, branding, and access time validity.
              </Typography>
            </Box>

            {/* Form Fields Stack */}
            <Stack spacing={2.2} sx={{ mb: 3 }}>
              {/* Top Row: Upload Logo + Inputs */}
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="stretch">
                {/* Upload Logo Box */}
                <Box
                  component="label"
                  sx={{
                    width: { xs: "100%", sm: 155 },
                    minWidth: { sm: 155 },
                    minHeight: 140,
                    border: isDark ? "2px dashed rgba(96, 165, 250, 0.45)" : "2px dashed #93c5fd",
                    borderRadius: "16px",
                    bgcolor: isDark ? "rgba(30, 58, 138, 0.22)" : "#f0f7ff",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    p: 1.5,
                    cursor: "pointer",
                    textAlign: "center",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      borderColor: isDark ? "#60a5fa" : "#2563eb",
                      bgcolor: isDark ? "rgba(37, 99, 235, 0.28)" : "#e0f2fe",
                      transform: "translateY(-1px)",
                    },
                  }}
                >
                  <input type="file" accept="image/*" hidden onChange={handleLogoChange} />
                  {logoPreview || formData.companyLogoUrl ? (
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <Avatar
                        src={logoPreview || formData.companyLogoUrl}
                        variant="rounded"
                        sx={{ width: 62, height: 62, borderRadius: "12px", mb: 0.8 }}
                      />
                      <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: isDark ? "#60a5fa" : "#1d4ed8" }}>
                        Change Logo
                      </Typography>
                    </Box>
                  ) : (
                    <>
                      <Avatar
                        sx={{
                          bgcolor: isDark ? "#1d4ed8" : "#0f2b66",
                          width: 44,
                          height: 44,
                          mb: 1,
                          boxShadow: "0 4px 12px rgba(15, 43, 102, 0.25)",
                        }}
                      >
                        <CloudUpload sx={{ color: "#ffffff", fontSize: 22 }} />
                      </Avatar>
                      <Typography sx={{ fontWeight: 700, fontSize: "0.84rem", color: isDark ? "#f8fafc" : "#0f172a" }}>
                        Upload Logo
                      </Typography>
                      <Typography sx={{ fontSize: "0.7rem", color: isDark ? "#94a3b8" : "#64748b" }}>
                        PNG, JPG (up to 2MB)
                      </Typography>
                    </>
                  )}
                </Box>

                {/* Right side of top row: Company Name + Time Validity + Logo URL */}
                <Box sx={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 1.6 }}>
                  {/* Row with Company Name and Time Validity */}
                  <Grid container spacing={1.5}>
                    {/* Company Name */}
                    <Grid item xs={12} sm={6.5}>
                      <Typography sx={createLabelSx}>
                        Company Name <span style={{ color: "#ef4444" }}>*</span>
                      </Typography>
                      <TextField
                        fullWidth
                        required
                        size="small"
                        placeholder="e.g. Acme Solar Technologies"
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Business sx={createIconSx} />
                            </InputAdornment>
                          ),
                        }}
                        sx={createFieldSx}
                      />
                    </Grid>

                    {/* Time Validity Duration */}
                    <Grid item xs={12} sm={5.5}>
                      <Typography sx={createLabelSx}>
                        Access Time Validity <span style={{ color: "#ef4444" }}>*</span>
                      </Typography>
                      {renderValiditySelect(
                        formData.validityDuration,
                        (e) => setFormData({ ...formData, validityDuration: e.target.value })
                      )}
                    </Grid>
                  </Grid>

                  {/* If custom date is chosen, render date input */}
                  {formData.validityDuration === "custom" && (
                    <Box>
                      <Typography sx={createLabelSx}>
                        Pick Expiry Date <span style={{ color: "#ef4444" }}>*</span>
                      </Typography>
                      <TextField
                        fullWidth
                        type="date"
                        size="small"
                        value={formData.customExpiryDate}
                        onChange={(e) => setFormData({ ...formData, customExpiryDate: e.target.value })}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <CalendarToday sx={createIconSx} />
                            </InputAdornment>
                          ),
                        }}
                        sx={createFieldSx}
                      />
                    </Box>
                  )}

                  {/* Dynamic Expiry Preview Badge */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      px: 1.5,
                      py: 0.8,
                      borderRadius: "8px",
                      bgcolor: isDark ? "rgba(22, 163, 74, 0.12)" : "#f0fdf4",
                      border: isDark ? "1px solid rgba(34, 197, 94, 0.3)" : "1px solid #bbf7d0",
                    }}
                  >
                    <EventAvailable sx={{ fontSize: 16, color: isDark ? "#4ade80" : "#16a34a" }} />
                    <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: isDark ? "#4ade80" : "#15803d" }}>
                      {expiryInfo.text}
                    </Typography>
                    <Typography sx={{ fontSize: "0.72rem", color: isDark ? "#94a3b8" : "#64748b", ml: "auto" }}>
                      Auto-locks tenant upon expiry
                    </Typography>
                  </Box>

                  {/* Or Logo Image URL (Optional) */}
                  <Box>
                    <Typography sx={createLabelSx}>
                      Or Logo Image URL <span style={{ color: "#64748b", fontWeight: 500 }}>(Optional)</span>
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="https://example.com/logo.png"
                      value={formData.companyLogoUrl}
                      onChange={(e) => {
                        setFormData({ ...formData, companyLogoUrl: e.target.value });
                        if (!logoFile) setLogoPreview(e.target.value);
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LinkIcon sx={createIconSx} />
                          </InputAdornment>
                        ),
                      }}
                      sx={createFieldSx}
                    />
                  </Box>
                </Box>
              </Stack>

              {/* Middle Card: Administrator Access Credentials */}
              <Box
                sx={{
                  bgcolor: isDark ? "rgba(15, 23, 42, 0.75)" : "#f0f5ff",
                  borderRadius: "16px",
                  border: isDark ? "1px solid rgba(59, 130, 246, 0.25)" : "1px solid #dbeafe",
                  p: 2.2,
                }}
              >
                <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 1.8 }}>
                  <Shield sx={{ fontSize: 24, color: isDark ? "#60a5fa" : "#2563eb" }} />
                  <Box>
                    <Typography sx={{ color: isDark ? "#f8fafc" : "#0f172a", fontWeight: 800, fontSize: "0.9rem" }}>
                      Administrator Access Credentials
                    </Typography>
                    <Typography sx={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.76rem" }}>
                      These details will be used to access and manage the organization.
                    </Typography>
                  </Box>
                </Stack>

                <Grid container spacing={2}>
                  {/* Admin Login Email */}
                  <Grid item xs={12} sm={6}>
                    <Typography sx={createLabelSx}>
                      Admin Login Email <span style={{ color: "#ef4444" }}>*</span>
                    </Typography>
                    <TextField
                      fullWidth
                      required
                      size="small"
                      type="email"
                      placeholder="admin@company.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Email sx={createIconSx} />
                          </InputAdornment>
                        ),
                      }}
                      sx={createFieldSx}
                    />
                  </Grid>

                  {/* Admin Password */}
                  <Grid item xs={12} sm={6}>
                    <Typography sx={createLabelSx}>
                      Admin Password <span style={{ color: "#ef4444" }}>*</span>
                    </Typography>
                    <TextField
                      fullWidth
                      required
                      size="small"
                      type={showPassword ? "text" : "password"}
                      placeholder="Min 6 characters"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockOutlined sx={createIconSx} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton size="small" onClick={() => setShowPassword(!showPassword)} sx={{ color: isDark ? "#94a3b8" : "#64748b" }}>
                              {showPassword ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      sx={createFieldSx}
                    />
                  </Grid>

                  {/* Admin Full Name */}
                  <Grid item xs={12} sm={6}>
                    <Typography sx={createLabelSx}>
                      Admin Full Name
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Admin User"
                      value={`${formData.firstName} ${formData.lastName}`.trim()}
                      onChange={(e) => {
                        const parts = e.target.value.split(" ");
                        setFormData({
                          ...formData,
                          firstName: parts[0] || "",
                          lastName: parts.slice(1).join(" ") || "",
                        });
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonOutline sx={createIconSx} />
                          </InputAdornment>
                        ),
                      }}
                      sx={createFieldSx}
                    />
                  </Grid>

                  {/* Contact Phone (Optional) */}
                  <Grid item xs={12} sm={6}>
                    <Typography sx={createLabelSx}>
                      Contact Phone <span style={{ color: "#64748b", fontWeight: 500 }}>(Optional)</span>
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="+91 9876543210"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Phone sx={createIconSx} />
                          </InputAdornment>
                        ),
                      }}
                      sx={createFieldSx}
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* Bottom Row: Office / Headquarters Address */}
              <Box>
                <Typography sx={createLabelSx}>
                  Office / Headquarters Address <span style={{ color: "#64748b", fontWeight: 500 }}>(Optional)</span>
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="123 Solar Blvd, Tech District, City"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationOnOutlined sx={createIconSx} />
                      </InputAdornment>
                    ),
                  }}
                  sx={createFieldSx}
                />
              </Box>
            </Stack>

            {/* Footer Action Buttons */}
            <Stack direction="row" spacing={2} justifyContent="flex-end" alignItems="center" sx={{ pt: 1.5, pb: 0.5 }}>
              <Button
                variant="outlined"
                onClick={closeCreatePage}
                disabled={creating}
                sx={{
                  borderRadius: "999px",
                  px: 3.5,
                  py: 1,
                  borderColor: isDark ? "rgba(148, 163, 184, 0.3)" : "#cbd5e1",
                  color: isDark ? "#e2e8f0" : "#0f172a",
                  fontWeight: 700,
                  textTransform: "none",
                  fontSize: "0.88rem",
                  "&:hover": {
                    borderColor: isDark ? "rgba(148, 163, 184, 0.55)" : "#94a3b8",
                    bgcolor: isDark ? "rgba(255, 255, 255, 0.05)" : "#f8fafc",
                  },
                }}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                variant="contained"
                disabled={creating}
                startIcon={creating ? <CircularProgress size={18} color="inherit" /> : <RocketLaunch sx={{ fontSize: 18, color: "#fff" }} />}
                sx={{
                  borderRadius: "999px",
                  px: 3.5,
                  py: 1,
                  background: "linear-gradient(135deg, #091a3e 0%, #17387d 50%, #1d4ed8 100%)",
                  boxShadow: "0 10px 24px rgba(23, 56, 125, 0.35)",
                  color: "#ffffff",
                  fontWeight: 800,
                  textTransform: "none",
                  fontSize: "0.88rem",
                  whiteSpace: "nowrap",
                  letterSpacing: "-0.01em",
                  "&:hover": {
                    background: "linear-gradient(135deg, #06132f 0%, #132d66 50%, #1e40af 100%)",
                    boxShadow: "0 12px 28px rgba(23, 56, 125, 0.45)",
                  },
                }}
              >
                {creating ? "Deploying..." : "Deploy Workspace & Admin →"}
              </Button>
            </Stack>
          </Box>
        </Box>
      </Box>
    );
  }

  // ─── FULL PAGE VIEW: ORGANIZATION PROFILE & MANAGEMENT ──────────────
  if (isDetailView) {
    if (loading && !selectedOrg) {
      return (
        <Box
          sx={{
            minHeight: "calc(100vh - 72px)",
            bgcolor: isDark ? "#060b13" : "#f1f5f9",
            p: 4,
            textAlign: "center",
            py: 16,
          }}
        >
          <CircularProgress size={42} thickness={4} sx={{ color: "#38bdf8" }} />
          <Typography variant="body1" fontWeight={700} sx={{ mt: 2, color: isDark ? "#94a3b8" : "#64748b" }}>
            Loading Organization Workspace...
          </Typography>
        </Box>
      );
    }

    if (!selectedOrg) {
      return (
        <Box
          sx={{
            minHeight: "calc(100vh - 72px)",
            bgcolor: isDark ? "#060b13" : "#f1f5f9",
            p: { xs: 2, sm: 4 },
          }}
        >
          <Box
            sx={{
              maxWidth: 720,
              mx: "auto",
              textAlign: "center",
              py: 10,
              bgcolor: isDark ? "#0d1527" : "#ffffff",
              borderRadius: "24px",
              p: 4,
              border: `1.5px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "#e2e8f0"}`,
              boxShadow: isDark ? "0 10px 30px rgba(0,0,0,0.4)" : "0 8px 24px rgba(0,0,0,0.03)",
            }}
          >
            <Business sx={{ fontSize: 56, color: "#94a3b8", mb: 2 }} />
            <Typography variant="h5" fontWeight={800} sx={{ color: isDark ? "#f8fafc" : "#0f172a" }}>
              Organization Not Found
            </Typography>
            <Typography variant="body2" sx={{ color: isDark ? "#94a3b8" : "#64748b", mt: 1, mb: 3 }}>
              The organization you requested could not be found or may have been removed.
            </Typography>
            <Button
              variant="contained"
              startIcon={<ArrowBack />}
              onClick={closeDetailPage}
              sx={{
                borderRadius: "10px",
                textTransform: "none",
                fontWeight: 700,
                bgcolor: "#2563eb",
                "&:hover": { bgcolor: "#1d4ed8" },
              }}
            >
              Back to Organizations Directory
            </Button>
          </Box>
        </Box>
      );
    }

    const orgAdmin = selectedOrg.adminUser || {};
    const orgLogoSrc = toBackendAssetUrl(selectedOrg.logo || orgAdmin.companyLogo);
    const orgInitials = selectedOrg.name
      ? selectedOrg.name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()
      : "CO";
    const isOrgActive = selectedOrg.status === "active";
    const isExpired = selectedOrg.subscriptionExpiresAt && new Date(selectedOrg.subscriptionExpiresAt) < new Date();
    const expiryDateObj = selectedOrg.subscriptionExpiresAt ? new Date(selectedOrg.subscriptionExpiresAt) : null;
    const remainingDays = expiryDateObj ? Math.ceil((expiryDateObj - new Date()) / (1000 * 60 * 60 * 24)) : null;

    const quickExpiryPreview = getExpiryPreview(quickValidityDuration, quickCustomDate);

    return (
      <Box
        sx={{
          minHeight: "calc(100vh - 72px)",
          bgcolor: isDark ? "#060b13" : "#f1f5f9",
          p: { xs: 2, sm: 3, md: 4 },
        }}
      >
        <Box sx={{ maxWidth: 1400, mx: "auto" }}>
          {/* Top Breadcrumb & Quick Actions Bar */}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
            spacing={2}
            sx={{ mb: 3 }}
          >
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Button
                startIcon={<ArrowBack sx={{ fontSize: 18 }} />}
                onClick={closeDetailPage}
                sx={{
                  color: isDark ? "#94a3b8" : "#334155",
                  bgcolor: isDark ? "rgba(255,255,255,0.06)" : "#ffffff",
                  border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "#cbd5e1"}`,
                  borderRadius: "10px",
                  px: 2,
                  py: 0.7,
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  textTransform: "none",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                  "&:hover": {
                    bgcolor: isDark ? "rgba(255,255,255,0.1)" : "#f8fafc",
                    color: isDark ? "#f8fafc" : "#0f172a",
                  },
                }}
              >
                Back to Directory
              </Button>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography
                  onClick={closeDetailPage}
                  sx={{
                    cursor: "pointer",
                    fontSize: "0.88rem",
                    fontWeight: 600,
                    color: isDark ? "#64748b" : "#64748b",
                    "&:hover": { color: "#38bdf8" },
                  }}
                >
                  Organizations
                </Typography>
                <Typography sx={{ color: isDark ? "#475569" : "#cbd5e1", fontSize: "0.88rem" }}>/</Typography>
                <Typography
                  sx={{
                    fontSize: "0.88rem",
                    fontWeight: 700,
                    color: isDark ? "#f8fafc" : "#0f172a",
                  }}
                >
                  {selectedOrg.name}
                </Typography>
              </Box>
            </Stack>

            {/* Header Right Action Buttons */}
            <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: "wrap", gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<VpnKey sx={{ fontSize: 15 }} />}
                onClick={() => openResetPasswordModal(selectedOrg)}
                sx={{
                  borderRadius: "10px",
                  fontWeight: 700,
                  fontSize: "0.8rem",
                  textTransform: "none",
                  color: "#f59e0b",
                  borderColor: "rgba(245, 158, 11, 0.4)",
                  bgcolor: isDark ? "rgba(245, 158, 11, 0.08)" : "#fffbeb",
                  "&:hover": {
                    borderColor: "#f59e0b",
                    bgcolor: "rgba(245, 158, 11, 0.15)",
                  },
                }}
              >
                Password
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<Edit sx={{ fontSize: 15 }} />}
                onClick={() => openEditModal(selectedOrg)}
                sx={{
                  borderRadius: "10px",
                  fontWeight: 700,
                  fontSize: "0.8rem",
                  textTransform: "none",
                  color: "#38bdf8",
                  borderColor: "rgba(56, 189, 248, 0.4)",
                  bgcolor: isDark ? "rgba(56, 189, 248, 0.08)" : "#f0f9ff",
                  "&:hover": {
                    borderColor: "#38bdf8",
                    bgcolor: "rgba(56, 189, 248, 0.15)",
                  },
                }}
              >
                Edit
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<DeleteOutline sx={{ fontSize: 15 }} />}
                onClick={() => openDeleteModal(selectedOrg)}
                sx={{
                  borderRadius: "10px",
                  fontWeight: 700,
                  fontSize: "0.8rem",
                  textTransform: "none",
                  color: "#ef4444",
                  borderColor: "rgba(239, 68, 68, 0.4)",
                  bgcolor: isDark ? "rgba(239, 68, 68, 0.08)" : "#fef2f2",
                  "&:hover": {
                    borderColor: "#ef4444",
                    bgcolor: "rgba(239, 68, 68, 0.15)",
                  },
                }}
              >
                Delete
              </Button>
            </Stack>
          </Stack>

          {/* Hero Banner Card */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2.5, sm: 3.5 },
              mb: 3,
              borderRadius: "20px",
              bgcolor: isDark ? "#0d1527" : "#ffffff",
              border: `1.5px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "#e2e8f0"}`,
              boxShadow: isDark
                ? "0 10px 30px rgba(0,0,0,0.4)"
                : "0 8px 24px rgba(0,0,0,0.03)",
              background: isDark
                ? "linear-gradient(135deg, rgba(13, 21, 39, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)"
                : "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
            }}
          >
            <Stack
              direction={{ xs: "column", md: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", md: "center" }}
              spacing={2.5}
            >
              <Stack direction="row" spacing={2.5} alignItems="center">
                <Avatar
                  src={orgLogoSrc}
                  variant="rounded"
                  sx={{
                    width: { xs: 64, sm: 76 },
                    height: { xs: 64, sm: 76 },
                    borderRadius: "18px",
                    bgcolor: isDark ? "#17223b" : "#f1f5f9",
                    border: `2px solid ${isDark ? "rgba(56, 189, 248, 0.3)" : "#dbeafe"}`,
                    color: "#2563eb",
                    fontWeight: 900,
                    fontSize: "1.6rem",
                    p: orgLogoSrc ? 0.4 : 0,
                  }}
                >
                  {orgInitials}
                </Avatar>

                <Box>
                  <Stack direction="row" spacing={1.2} alignItems="center" sx={{ flexWrap: "wrap", gap: 0.8 }}>
                    <Typography
                      variant="h5"
                      fontWeight={900}
                      sx={{
                        color: isDark ? "#f8fafc" : "#0f172a",
                        fontSize: { xs: "1.3rem", sm: "1.65rem" },
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {selectedOrg.name}
                    </Typography>
                    <Chip
                      label={selectedOrg.plan || "Enterprise SaaS"}
                      size="small"
                      sx={{
                        height: 22,
                        fontSize: "0.72rem",
                        fontWeight: 800,
                        bgcolor: "rgba(168, 85, 247, 0.12)",
                        color: "#c084fc",
                      }}
                    />
                    {isExpired ? (
                      <Chip
                        label="Validity Expired"
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: "0.7rem",
                          fontWeight: 800,
                          bgcolor: "rgba(239, 68, 68, 0.15)",
                          color: "#ef4444",
                          border: "1px solid rgba(239, 68, 68, 0.3)",
                        }}
                      />
                    ) : !selectedOrg.subscriptionExpiresAt ? (
                      <Chip
                        label="Lifetime Access"
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: "0.7rem",
                          fontWeight: 800,
                          bgcolor: "rgba(56, 189, 248, 0.15)",
                          color: "#38bdf8",
                        }}
                      />
                    ) : (
                      <Chip
                        label={`Valid until ${expiryDateObj?.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`}
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: "0.7rem",
                          fontWeight: 800,
                          bgcolor: "rgba(16, 185, 129, 0.15)",
                          color: "#10b981",
                        }}
                      />
                    )}
                  </Stack>

                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 1, flexWrap: "wrap", gap: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <Email sx={{ fontSize: 15, color: isDark ? "#94a3b8" : "#64748b" }} />
                      <Typography variant="body2" sx={{ color: isDark ? "#cbd5e1" : "#334155", fontWeight: 600 }}>
                        {selectedOrg.email || orgAdmin.email || "No email assigned"}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => copyToClipboard(selectedOrg.email || orgAdmin.email, "Email")}
                        sx={{ p: 0.3, color: isDark ? "#94a3b8" : "#64748b" }}
                      >
                        <ContentCopy sx={{ fontSize: 13 }} />
                      </IconButton>
                    </Box>

                    {selectedOrg.phone && (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <Phone sx={{ fontSize: 15, color: isDark ? "#94a3b8" : "#64748b" }} />
                        <Typography variant="body2" sx={{ color: isDark ? "#cbd5e1" : "#334155", fontWeight: 600 }}>
                          {selectedOrg.phone}
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </Box>
              </Stack>

              {/* Status Switch Control */}
              <Box
                sx={{
                  p: 1.5,
                  px: 2,
                  borderRadius: "14px",
                  bgcolor: isDark ? "rgba(255, 255, 255, 0.03)" : "#f8fafc",
                  border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "#e2e8f0"}`,
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                }}
              >
                <Box>
                  <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontWeight: 600, display: "block" }}>
                    Organization Status
                  </Typography>
                  <Typography
                    variant="subtitle2"
                    fontWeight={800}
                    sx={{ color: isOrgActive ? "#22c55e" : "#ef4444" }}
                  >
                    {isOrgActive ? "ACTIVE & LIVE" : "DISABLED"}
                  </Typography>
                </Box>
                <Switch
                  checked={isOrgActive}
                  onChange={() => handleToggleStatus(selectedOrg)}
                  color="success"
                />
              </Box>
            </Stack>
          </Paper>

          {/* 4-Metric KPI Grid */}
          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            {/* KPI 1: Access Validity */}
            <Grid item xs={12} sm={6} md={3}>
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: "16px",
                  bgcolor: isDark ? "#0d1527" : "#ffffff",
                  border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "#e2e8f0"}`,
                  height: "100%",
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.2 }}>
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: "10px",
                      bgcolor: isExpired
                        ? "rgba(239, 68, 68, 0.12)"
                        : "rgba(16, 185, 129, 0.12)",
                      color: isExpired ? "#ef4444" : "#10b981",
                      display: "flex",
                    }}
                  >
                    <Timer sx={{ fontSize: 20 }} />
                  </Box>
                  <Typography variant="caption" fontWeight={700} sx={{ color: isDark ? "#94a3b8" : "#64748b" }}>
                    Access Validity
                  </Typography>
                </Stack>
                <Typography variant="h6" fontWeight={800} sx={{ color: isExpired ? "#ef4444" : isDark ? "#f8fafc" : "#0f172a" }}>
                  {isExpired
                    ? "Validity Expired"
                    : !selectedOrg.subscriptionExpiresAt
                      ? "Lifetime Access"
                      : remainingDays !== null
                        ? `${remainingDays} Days Left`
                        : "Active Access"}
                </Typography>
                <Typography variant="caption" sx={{ color: isDark ? "#64748b" : "#94a3b8", display: "block", mt: 0.5 }}>
                  {!selectedOrg.subscriptionExpiresAt
                    ? "No expiration limit"
                    : `Expires: ${expiryDateObj?.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`}
                </Typography>
              </Box>
            </Grid>

            {/* KPI 2: Primary Administrator */}
            <Grid item xs={12} sm={6} md={3}>
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: "16px",
                  bgcolor: isDark ? "#0d1527" : "#ffffff",
                  border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "#e2e8f0"}`,
                  height: "100%",
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.2 }}>
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: "10px",
                      bgcolor: "rgba(56, 189, 248, 0.12)",
                      color: "#38bdf8",
                      display: "flex",
                    }}
                  >
                    <AdminPanelSettings sx={{ fontSize: 20 }} />
                  </Box>
                  <Typography variant="caption" fontWeight={700} sx={{ color: isDark ? "#94a3b8" : "#64748b" }}>
                    Primary Administrator
                  </Typography>
                </Stack>
                <Typography variant="h6" fontWeight={800} noWrap sx={{ color: isDark ? "#f8fafc" : "#0f172a" }}>
                  {orgAdmin.firstName || "Company"} {orgAdmin.lastName || "Admin"}
                </Typography>
                <Typography variant="caption" sx={{ color: isDark ? "#64748b" : "#94a3b8", display: "block", mt: 0.5 }}>
                  Employee ID: {orgAdmin.employeeId || "ADM0001"}
                </Typography>
              </Box>
            </Grid>

            {/* KPI 3: Workspace Members */}
            <Grid item xs={12} sm={6} md={3}>
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: "16px",
                  bgcolor: isDark ? "#0d1527" : "#ffffff",
                  border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "#e2e8f0"}`,
                  height: "100%",
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.2 }}>
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: "10px",
                      bgcolor: "rgba(129, 140, 248, 0.12)",
                      color: "#818cf8",
                      display: "flex",
                    }}
                  >
                    <PeopleAlt sx={{ fontSize: 20 }} />
                  </Box>
                  <Typography variant="caption" fontWeight={700} sx={{ color: isDark ? "#94a3b8" : "#64748b" }}>
                    Registered Staff
                  </Typography>
                </Stack>
                <Typography variant="h6" fontWeight={800} sx={{ color: isDark ? "#f8fafc" : "#0f172a" }}>
                  {selectedOrg.staffCount || 0} Staff Members
                </Typography>
                <Typography variant="caption" sx={{ color: isDark ? "#64748b" : "#94a3b8", display: "block", mt: 0.5 }}>
                  Multi-tenant isolated team
                </Typography>
              </Box>
            </Grid>

            {/* KPI 4: Tenant Creation */}
            <Grid item xs={12} sm={6} md={3}>
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: "16px",
                  bgcolor: isDark ? "#0d1527" : "#ffffff",
                  border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "#e2e8f0"}`,
                  height: "100%",
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.2 }}>
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: "10px",
                      bgcolor: "rgba(245, 158, 11, 0.12)",
                      color: "#f59e0b",
                      display: "flex",
                    }}
                  >
                    <CalendarToday sx={{ fontSize: 20 }} />
                  </Box>
                  <Typography variant="caption" fontWeight={700} sx={{ color: isDark ? "#94a3b8" : "#64748b" }}>
                    Onboarded Since
                  </Typography>
                </Stack>
                <Typography variant="h6" fontWeight={800} sx={{ color: isDark ? "#f8fafc" : "#0f172a" }}>
                  {new Date(selectedOrg.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </Typography>
                <Typography variant="caption" sx={{ color: isDark ? "#64748b" : "#94a3b8", display: "block", mt: 0.5 }}>
                  Cloud instance active
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {/* Deep-Dive 2-Column Grid */}
          <Grid container spacing={3}>
            {/* Left Column: Validity & Organization Information */}
            <Grid item xs={12} lg={7}>
              {/* Access Validity & License Manager */}
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2.5, sm: 3 },
                  mb: 3,
                  borderRadius: "20px",
                  bgcolor: isDark ? "#0d1527" : "#ffffff",
                  border: `1.5px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "#e2e8f0"}`,
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                  <AccessTime sx={{ color: "#38bdf8" }} />
                  <Typography variant="h6" fontWeight={800} sx={{ color: isDark ? "#f8fafc" : "#0f172a" }}>
                    Access Time Validity & License
                  </Typography>
                </Stack>

                {/* Validity Status Banner */}
                <Box
                  sx={{
                    p: 2,
                    borderRadius: "14px",
                    bgcolor: isExpired
                      ? "rgba(239, 68, 68, 0.1)"
                      : "rgba(16, 185, 129, 0.1)",
                    border: `1px solid ${isExpired ? "rgba(239, 68, 68, 0.3)" : "rgba(16, 185, 129, 0.3)"}`,
                    mb: 3,
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    {isExpired ? (
                      <Close sx={{ color: "#ef4444" }} />
                    ) : (
                      <CheckCircle sx={{ color: "#10b981" }} />
                    )}
                    <Box>
                      <Typography
                        variant="subtitle2"
                        fontWeight={800}
                        sx={{ color: isExpired ? "#ef4444" : "#10b981" }}
                      >
                        {isExpired
                          ? "Access Expired — Site Locked for Tenant"
                          : "Active Access License Granted"}
                      </Typography>
                      <Typography variant="body2" sx={{ color: isDark ? "#cbd5e1" : "#475569", mt: 0.3 }}>
                        {isExpired
                          ? "The time validity for this organization has expired. Admin and staff cannot log in to the portal."
                          : !selectedOrg.subscriptionExpiresAt
                            ? "This organization has unlimited Lifetime validity with no expiration restrictions."
                            : `Valid until ${expiryDateObj?.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })} (${remainingDays} days remaining).`}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>

                {/* Quick Validity Extension Form */}
                <Typography variant="subtitle2" fontWeight={800} sx={{ color: isDark ? "#f8fafc" : "#0f172a", mb: 1.5 }}>
                  Extend or Change Validity Duration:
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={quickValidityDuration === "custom" ? 6 : 12}>
                    {renderValiditySelect(
                      quickValidityDuration,
                      (e) => setQuickValidityDuration(e.target.value)
                    )}
                  </Grid>

                  {quickValidityDuration === "custom" && (
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        size="small"
                        type="date"
                        label="Custom Expiry Date"
                        value={quickCustomDate}
                        onChange={(e) => setQuickCustomDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
                      />
                    </Grid>
                  )}
                </Grid>

                {/* Dynamic Preview */}
                <Box
                  sx={{
                    mt: 2,
                    p: 1.5,
                    borderRadius: "10px",
                    bgcolor: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc",
                    border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#e2e8f0"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 1.5,
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <EventAvailable sx={{ fontSize: 18, color: "#38bdf8" }} />
                    <Typography variant="body2" fontWeight={700} sx={{ color: isDark ? "#38bdf8" : "#0284c7" }}>
                      {quickExpiryPreview.text}
                    </Typography>
                  </Stack>

                  <Button
                    variant="contained"
                    size="small"
                    disabled={savingQuickValidity}
                    onClick={handleUpdateQuickValidity}
                    sx={{
                      borderRadius: "8px",
                      px: 2.5,
                      fontWeight: 700,
                      textTransform: "none",
                      bgcolor: "#2563eb",
                      "&:hover": { bgcolor: "#1d4ed8" },
                    }}
                  >
                    {savingQuickValidity ? "Saving..." : "Update Validity"}
                  </Button>
                </Box>
              </Paper>

              {/* Organization Contact & Details */}
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2.5, sm: 3 },
                  borderRadius: "20px",
                  bgcolor: isDark ? "#0d1527" : "#ffffff",
                  border: `1.5px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "#e2e8f0"}`,
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                  <CorporateFare sx={{ color: "#38bdf8" }} />
                  <Typography variant="h6" fontWeight={800} sx={{ color: isDark ? "#f8fafc" : "#0f172a" }}>
                    Organization Profile & Identity
                  </Typography>
                </Stack>

                <Stack spacing={2}>
                  <Box sx={{ p: 2, borderRadius: "12px", bgcolor: isDark ? "rgba(255,255,255,0.02)" : "#f8fafc", border: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "#e2e8f0"}` }}>
                    <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontWeight: 700 }}>
                      Company Legal / Brand Name
                    </Typography>
                    <Typography variant="body1" fontWeight={800} sx={{ color: isDark ? "#f8fafc" : "#0f172a", mt: 0.3 }}>
                      {selectedOrg.name}
                    </Typography>
                  </Box>

                  <Box sx={{ p: 2, borderRadius: "12px", bgcolor: isDark ? "rgba(255,255,255,0.02)" : "#f8fafc", border: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "#e2e8f0"}` }}>
                    <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontWeight: 700 }}>
                      Headquarters / Office Address
                    </Typography>
                    <Typography variant="body1" fontWeight={600} sx={{ color: isDark ? "#cbd5e1" : "#334155", mt: 0.3 }}>
                      {selectedOrg.address || "No office address registered"}
                    </Typography>
                  </Box>

                  <Box sx={{ p: 2, borderRadius: "12px", bgcolor: isDark ? "rgba(255,255,255,0.02)" : "#f8fafc", border: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "#e2e8f0"}` }}>
                    <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontWeight: 700 }}>
                      Tenant Unique ID (Database Reference)
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.3 }}>
                      <Typography variant="body2" sx={{ fontFamily: "monospace", color: isDark ? "#94a3b8" : "#64748b" }}>
                        {selectedOrg._id}
                      </Typography>
                      <IconButton size="small" onClick={() => copyToClipboard(selectedOrg._id, "Tenant ID")} sx={{ p: 0.3 }}>
                        <ContentCopy sx={{ fontSize: 13 }} />
                      </IconButton>
                    </Stack>
                  </Box>
                </Stack>
              </Paper>
            </Grid>

            {/* Right Column: Administrator Credentials & Actions */}
            <Grid item xs={12} lg={5}>
              {/* Administrator Details */}
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2.5, sm: 3 },
                  mb: 3,
                  borderRadius: "20px",
                  bgcolor: isDark ? "#0d1527" : "#ffffff",
                  border: `1.5px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "#e2e8f0"}`,
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                  <Shield sx={{ color: "#38bdf8" }} />
                  <Typography variant="h6" fontWeight={800} sx={{ color: isDark ? "#f8fafc" : "#0f172a" }}>
                    Tenant Administrator
                  </Typography>
                </Stack>

                <Stack spacing={2}>
                  <Box sx={{ p: 2, borderRadius: "12px", bgcolor: isDark ? "rgba(255,255,255,0.02)" : "#f8fafc", border: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "#e2e8f0"}` }}>
                    <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontWeight: 700 }}>
                      Administrator Name & ID
                    </Typography>
                    <Typography variant="body1" fontWeight={800} sx={{ color: isDark ? "#f8fafc" : "#0f172a", mt: 0.3 }}>
                      {orgAdmin.firstName || "Company"} {orgAdmin.lastName || "Admin"}
                    </Typography>
                    <Chip
                      label={orgAdmin.employeeId || "ADM0001"}
                      size="small"
                      sx={{
                        mt: 0.8,
                        height: 20,
                        fontWeight: 800,
                        fontSize: "0.68rem",
                        bgcolor: isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0",
                        color: isDark ? "#cbd5e1" : "#475569",
                      }}
                    />
                  </Box>

                  <Box sx={{ p: 2, borderRadius: "12px", bgcolor: isDark ? "rgba(255,255,255,0.02)" : "#f8fafc", border: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "#e2e8f0"}` }}>
                    <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontWeight: 700 }}>
                      Admin Login Email
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.3 }}>
                      <Typography variant="body2" fontWeight={700} sx={{ color: isDark ? "#38bdf8" : "#0284c7" }}>
                        {selectedOrg.email || orgAdmin.email || "No email assigned"}
                      </Typography>
                      <IconButton size="small" onClick={() => copyToClipboard(selectedOrg.email || orgAdmin.email, "Admin Email")} sx={{ p: 0.3 }}>
                        <ContentCopy sx={{ fontSize: 13 }} />
                      </IconButton>
                    </Stack>
                  </Box>

                  <Box sx={{ p: 2, borderRadius: "12px", bgcolor: isDark ? "rgba(255,255,255,0.02)" : "#f8fafc", border: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "#e2e8f0"}` }}>
                    <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontWeight: 700 }}>
                      Current Admin Password
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.3 }}>
                      <Typography variant="body2" fontWeight={700} sx={{ fontFamily: "monospace", color: isDark ? "#fbbf24" : "#d97706", letterSpacing: "0.03em" }}>
                        {selectedOrg.adminPassword || selectedOrg.adminUser?.viewPassword || "Available in Reset Modal"}
                      </Typography>
                      {(selectedOrg.adminPassword || selectedOrg.adminUser?.viewPassword) && (
                        <IconButton
                          size="small"
                          onClick={() => copyToClipboard(selectedOrg.adminPassword || selectedOrg.adminUser?.viewPassword, "Admin Password")}
                          sx={{ p: 0.3 }}
                        >
                          <ContentCopy sx={{ fontSize: 13 }} />
                        </IconButton>
                      )}
                    </Stack>
                  </Box>

                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<VpnKey />}
                    onClick={() => openResetPasswordModal(selectedOrg)}
                    sx={{
                      borderRadius: "12px",
                      py: 1.2,
                      fontWeight: 700,
                      textTransform: "none",
                      color: "#f59e0b",
                      borderColor: "rgba(245, 158, 11, 0.4)",
                      bgcolor: isDark ? "rgba(245, 158, 11, 0.08)" : "#fffbeb",
                      "&:hover": {
                        borderColor: "#f59e0b",
                        bgcolor: "rgba(245, 158, 11, 0.15)",
                      },
                    }}
                  >
                    Reset Admin Password
                  </Button>
                </Stack>
              </Paper>

              {/* Workspace Management Actions */}
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2.5, sm: 3 },
                  borderRadius: "20px",
                  bgcolor: isDark ? "#0d1527" : "#ffffff",
                  border: `1.5px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "#e2e8f0"}`,
                }}
              >
                <Typography variant="subtitle1" fontWeight={800} sx={{ color: isDark ? "#f8fafc" : "#0f172a", mb: 2 }}>
                  Workspace Management
                </Typography>

                <Stack spacing={1.5}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Edit />}
                    onClick={() => openEditModal(selectedOrg)}
                    sx={{
                      borderRadius: "10px",
                      py: 1,
                      fontWeight: 700,
                      textTransform: "none",
                      color: "#38bdf8",
                      borderColor: "rgba(56, 189, 248, 0.35)",
                      "&:hover": {
                        borderColor: "#38bdf8",
                        bgcolor: "rgba(56, 189, 248, 0.08)",
                      },
                    }}
                  >
                    Edit Organization Profile
                  </Button>

                  <Button
                    fullWidth
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteOutline />}
                    onClick={() => openDeleteModal(selectedOrg)}
                    sx={{
                      borderRadius: "10px",
                      py: 1,
                      fontWeight: 700,
                      textTransform: "none",
                      borderColor: "rgba(239, 68, 68, 0.35)",
                      "&:hover": {
                        borderColor: "#ef4444",
                        bgcolor: "rgba(239, 68, 68, 0.08)",
                      },
                    }}
                  >
                    Delete Organization
                  </Button>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </Box>
        {renderCommonModals()}
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2.5, sm: 3.5, md: 5 }, maxWidth: 1600, margin: "0 auto" }}>
      {/* ─── Premium Header Section (Clean, Linear & Stripe inspired) ───────────── */}
      <Box sx={{ mb: 4 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          alignItems={{ xs: "flex-start", md: "center" }}
          justifyContent="space-between"
          spacing={2.5}
        >
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.8 }}>
              <Typography
                variant="caption"
                sx={{
                  color: "#38bdf8",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontSize: "0.72rem",
                }}
              >
                SaaS Master Control Plane
              </Typography>
              <Circle sx={{ fontSize: 5, color: "rgba(255, 255, 255, 0.3)" }} />
              <Typography variant="caption" sx={{ color: "rgba(255, 255, 255, 0.5)", fontWeight: 600 }}>
                Multi-Tenant Architecture
              </Typography>
            </Stack>

            <Stack direction="row" spacing={1.5} alignItems="center">
              <Typography
                variant="h4"
                fontWeight={900}
                sx={{
                  fontSize: { xs: "1.85rem", md: "2.35rem" },
                  color: isDark ? "#f8fafc" : "#0f172a",
                  letterSpacing: "-0.03em",
                }}
              >
                Organizations & Tenants
              </Typography>
              <Chip
                label={`${stats.totalCompanies} Total`}
                size="small"
                sx={{
                  fontWeight: 800,
                  fontSize: "0.75rem",
                  bgcolor: "rgba(56, 189, 248, 0.12)",
                  color: "#38bdf8",
                  border: "1px solid rgba(56, 189, 248, 0.25)",
                }}
              />
            </Stack>

            <Typography
              variant="body2"
              sx={{
                color: isDark ? "#94a3b8" : "#64748b",
                mt: 0.6,
                maxWidth: 720,
                fontSize: "0.95rem",
              }}
            >
              Deploy and manage isolated company workspaces, assign branding logos, configure subscriptions,
              and provision tenant administrator credentials.
            </Typography>
          </Box>

          {/* Right Action Buttons */}
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Tooltip title="Refresh Platform Data" arrow>
              <IconButton
                onClick={fetchData}
                disabled={loading}
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: "10px",
                  bgcolor: isDark ? "rgba(255, 255, 255, 0.04)" : "#ffffff",
                  border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "#e2e8f0"}`,
                  color: isDark ? "#94a3b8" : "#475569",
                  boxShadow: isDark ? "0 2px 8px rgba(0,0,0,0.2)" : "0 1px 3px rgba(0,0,0,0.05)",
                  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  "&:hover": {
                    bgcolor: isDark ? "rgba(255, 255, 255, 0.08)" : "#f8fafc",
                    borderColor: isDark ? "rgba(56, 189, 248, 0.4)" : "#38bdf8",
                    color: isDark ? "#38bdf8" : "#2563eb",
                    transform: "rotate(30deg)",
                  },
                }}
              >
                <Refresh
                  sx={{
                    fontSize: 18,
                    animation: loading ? "spin 1s linear infinite" : "none",
                    "@keyframes spin": {
                      "0%": { transform: "rotate(0deg)" },
                      "100%": { transform: "rotate(360deg)" },
                    },
                  }}
                />
              </IconButton>
            </Tooltip>

            <Button
              variant="contained"
              onClick={openCreatePage}
              startIcon={<Add sx={{ fontSize: 18 }} />}
              sx={{
                height: 40,
                borderRadius: "10px",
                px: 2.5,
                fontWeight: 700,
                fontSize: "0.875rem",
                letterSpacing: "-0.01em",
                textTransform: "none",
                bgcolor: "#2563eb",
                color: "#ffffff",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                boxShadow: isDark
                  ? "0 4px 14px rgba(37, 99, 235, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.2)"
                  : "0 4px 12px rgba(37, 99, 235, 0.25)",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                "&:hover": {
                  bgcolor: "#1d4ed8",
                  boxShadow: isDark
                    ? "0 6px 20px rgba(37, 99, 235, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3)"
                    : "0 6px 18px rgba(37, 99, 235, 0.35)",
                  transform: "translateY(-1px)",
                },
                "&:active": {
                  transform: "translateY(0px)",
                },
              }}
            >
              New Organization
            </Button>
          </Stack>
        </Stack>
      </Box>

      {/* ─── Sleek Linear-Style Metric Strip ─────────────────────────────────── */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        {/* Card 1: Organizations */}
        <Grid item xs={12} sm={6} lg={3}>
          <Box
            sx={{
              p: 2.5,
              borderRadius: "18px",
              bgcolor: isDark ? "#0d1527" : "#ffffff",
              border: `1px solid ${isDark ? "rgba(56, 189, 248, 0.15)" : "#e2e8f0"}`,
              position: "relative",
              overflow: "hidden",
              boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.3)" : "0 4px 20px rgba(0,0,0,0.03)",
              transition: "border-color 0.2s ease, transform 0.2s ease",
              "&:hover": {
                borderColor: "#38bdf8",
                transform: "translateY(-2px)",
              },
            }}
          >
            {/* Top Color Accent Bar */}
            <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, bgcolor: "#38bdf8" }} />

            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography
                variant="caption"
                sx={{
                  color: isDark ? "#94a3b8" : "#64748b",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  fontSize: "0.7rem",
                  letterSpacing: "0.06em",
                }}
              >
                Client Organizations
              </Typography>
              <Avatar sx={{ width: 34, height: 34, bgcolor: "rgba(56, 189, 248, 0.12)", color: "#38bdf8", borderRadius: "10px" }}>
                <Domain sx={{ fontSize: 18 }} />
              </Avatar>
            </Stack>

            <Typography variant="h3" fontWeight={900} sx={{ color: isDark ? "#f8fafc" : "#0f172a", mt: 1, letterSpacing: "-0.03em" }}>
              {stats.totalCompanies}
            </Typography>

            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.2 }}>
              <Chip
                label={`${stats.activeCompanies} Active`}
                size="small"
                sx={{
                  height: 20,
                  fontSize: "0.68rem",
                  fontWeight: 800,
                  bgcolor: "rgba(34, 197, 94, 0.12)",
                  color: "#4ade80",
                }}
              />
              <Typography variant="caption" sx={{ color: isDark ? "#64748b" : "#94a3b8", fontWeight: 600 }}>
                {stats.inactiveCompanies} Inactive
              </Typography>
            </Stack>
          </Box>
        </Grid>

        {/* Card 2: Company Admins */}
        <Grid item xs={12} sm={6} lg={3}>
          <Box
            sx={{
              p: 2.5,
              borderRadius: "18px",
              bgcolor: isDark ? "#0d1527" : "#ffffff",
              border: `1px solid ${isDark ? "rgba(16, 185, 129, 0.15)" : "#e2e8f0"}`,
              position: "relative",
              overflow: "hidden",
              boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.3)" : "0 4px 20px rgba(0,0,0,0.03)",
              transition: "border-color 0.2s ease, transform 0.2s ease",
              "&:hover": {
                borderColor: "#10b981",
                transform: "translateY(-2px)",
              },
            }}
          >
            <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, bgcolor: "#10b981" }} />

            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography
                variant="caption"
                sx={{
                  color: isDark ? "#94a3b8" : "#64748b",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  fontSize: "0.7rem",
                  letterSpacing: "0.06em",
                }}
              >
                Provisioned Admins
              </Typography>
              <Avatar sx={{ width: 34, height: 34, bgcolor: "rgba(16, 185, 129, 0.12)", color: "#10b981", borderRadius: "10px" }}>
                <AdminPanelSettings sx={{ fontSize: 18 }} />
              </Avatar>
            </Stack>

            <Typography variant="h3" fontWeight={900} sx={{ color: "#10b981", mt: 1, letterSpacing: "-0.03em" }}>
              {stats.activeCompanies}
            </Typography>

            <Typography variant="caption" sx={{ color: isDark ? "#6ee7b7" : "#059669", fontWeight: 700, mt: 1.2, display: "block" }}>
              ✓ 100% Operational Accounts
            </Typography>
          </Box>
        </Grid>

        {/* Card 3: Platform Staff */}
        <Grid item xs={12} sm={6} lg={3}>
          <Box
            sx={{
              p: 2.5,
              borderRadius: "18px",
              bgcolor: isDark ? "#0d1527" : "#ffffff",
              border: `1px solid ${isDark ? "rgba(168, 85, 247, 0.15)" : "#e2e8f0"}`,
              position: "relative",
              overflow: "hidden",
              boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.3)" : "0 4px 20px rgba(0,0,0,0.03)",
              transition: "border-color 0.2s ease, transform 0.2s ease",
              "&:hover": {
                borderColor: "#a855f7",
                transform: "translateY(-2px)",
              },
            }}
          >
            <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, bgcolor: "#a855f7" }} />

            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography
                variant="caption"
                sx={{
                  color: isDark ? "#94a3b8" : "#64748b",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  fontSize: "0.7rem",
                  letterSpacing: "0.06em",
                }}
              >
                Total Platform Staff
              </Typography>
              <Avatar sx={{ width: 34, height: 34, bgcolor: "rgba(168, 85, 247, 0.12)", color: "#a855f7", borderRadius: "10px" }}>
                <PeopleAlt sx={{ fontSize: 18 }} />
              </Avatar>
            </Stack>

            <Typography variant="h3" fontWeight={900} sx={{ color: "#c084fc", mt: 1, letterSpacing: "-0.03em" }}>
              {stats.totalUsers}
            </Typography>

            <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontWeight: 600, mt: 1.2, display: "block" }}>
              Enrolled across all branches
            </Typography>
          </Box>
        </Grid>

        {/* Card 4: Platform Engine */}
        <Grid item xs={12} sm={6} lg={3}>
          <Box
            sx={{
              p: 2.5,
              borderRadius: "18px",
              bgcolor: isDark ? "#0d1527" : "#ffffff",
              border: `1px solid ${isDark ? "rgba(59, 130, 246, 0.15)" : "#e2e8f0"}`,
              position: "relative",
              overflow: "hidden",
              boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.3)" : "0 4px 20px rgba(0,0,0,0.03)",
              transition: "border-color 0.2s ease, transform 0.2s ease",
              "&:hover": {
                borderColor: "#3b82f6",
                transform: "translateY(-2px)",
              },
            }}
          >
            <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, bgcolor: "#3b82f6" }} />

            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography
                variant="caption"
                sx={{
                  color: isDark ? "#94a3b8" : "#64748b",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  fontSize: "0.7rem",
                  letterSpacing: "0.06em",
                }}
              >
                Cluster Status
              </Typography>
              <Avatar sx={{ width: 34, height: 34, bgcolor: "rgba(59, 130, 246, 0.12)", color: "#3b82f6", borderRadius: "10px" }}>
                <CloudDone sx={{ fontSize: 18 }} />
              </Avatar>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.5 }}>
              <Box sx={{ width: 9, height: 9, borderRadius: "50%", bgcolor: "#4ade80", boxShadow: "0 0 10px #4ade80" }} />
              <Typography variant="h5" fontWeight={800} sx={{ color: isDark ? "#f8fafc" : "#0f172a" }}>
                {stats.platformStatus}
              </Typography>
            </Stack>

            <Typography variant="caption" sx={{ color: isDark ? "#64748b" : "#94a3b8", fontWeight: 600, mt: 1.2, display: "block" }}>
              {stats.systemVersion}
            </Typography>
          </Box>
        </Grid>
      </Grid>

      {/* ─── Status Tabs & Filter Toolbar ────────────────────────────────────── */}
      <Box sx={{ mb: 3 }}>
        <Stack
          direction={{ xs: "column", lg: "row" }}
          alignItems={{ xs: "stretch", lg: "center" }}
          justifyContent="space-between"
          spacing={2}
          sx={{
            borderBottom: `1px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "#e2e8f0"}`,
            pb: 2,
          }}
        >
          {/* Modern Segmented Status Filter Tabs */}
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              p: "4px",
              borderRadius: "14px",
              bgcolor: isDark ? "rgba(15, 23, 42, 0.65)" : "#f1f5f9",
              border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "#e2e8f0"}`,
              boxShadow: isDark
                ? "inset 0 1px 2px rgba(0, 0, 0, 0.3)"
                : "inset 0 1px 2px rgba(0, 0, 0, 0.04)",
              overflowX: "auto",
              maxWidth: "100%",
              scrollbarWidth: "none",
              "&::-webkit-scrollbar": { display: "none" },
              gap: 0.5,
            }}
          >
            {[
              {
                id: "all",
                label: "All Organizations",
                count: tabCounts.all,
                dotColor: "#6366f1",
                activeBg: isDark ? "rgba(99, 102, 241, 0.18)" : "#e0e7ff",
                activeColor: isDark ? "#a5b4fc" : "#4338ca",
              },
              {
                id: "active",
                label: "Active",
                count: tabCounts.active,
                dotColor: "#10b981",
                activeBg: isDark ? "rgba(16, 185, 129, 0.18)" : "#d1fae5",
                activeColor: isDark ? "#6ee7b7" : "#047857",
              },
              {
                id: "expired",
                label: "Expired Validity",
                count: tabCounts.expired,
                dotColor: "#f43f5e",
                activeBg: isDark ? "rgba(244, 63, 94, 0.18)" : "#ffe4e6",
                activeColor: isDark ? "#fda4af" : "#be123c",
              },
              {
                id: "inactive",
                label: "Inactive",
                count: tabCounts.inactive,
                dotColor: "#94a3b8",
                activeBg: isDark ? "rgba(148, 163, 184, 0.18)" : "#f1f5f9",
                activeColor: isDark ? "#cbd5e1" : "#475569",
              },
            ].map((tab) => {
              const isSelected = selectedTab === tab.id;
              return (
                <ButtonBase
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  sx={{
                    px: { xs: 1.5, sm: 2 },
                    py: 0.85,
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    gap: 1.1,
                    whiteSpace: "nowrap",
                    cursor: "pointer",
                    fontSize: "0.84rem",
                    fontWeight: isSelected ? 700 : 500,
                    color: isSelected
                      ? isDark
                        ? "#f8fafc"
                        : "#0f172a"
                      : isDark
                        ? "#94a3b8"
                        : "#64748b",
                    bgcolor: isSelected
                      ? isDark
                        ? "#1e293b"
                        : "#ffffff"
                      : "transparent",
                    boxShadow: isSelected
                      ? isDark
                        ? "0 3px 12px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.08)"
                        : "0 2px 8px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.04)"
                      : "none",
                    transition: "all 0.18s cubic-bezier(0.4, 0, 0.2, 1)",
                    "&:hover": {
                      bgcolor: isSelected
                        ? isDark
                          ? "#1e293b"
                          : "#ffffff"
                        : isDark
                          ? "rgba(255, 255, 255, 0.05)"
                          : "rgba(0, 0, 0, 0.04)",
                      color: isDark ? "#ffffff" : "#0f172a",
                    },
                  }}
                >
                  {/* Status Indicator Dot */}
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: tab.dotColor,
                      boxShadow: isSelected
                        ? `0 0 10px ${tab.dotColor}, 0 0 4px ${tab.dotColor}`
                        : "none",
                      transition: "box-shadow 0.2s ease",
                      flexShrink: 0,
                    }}
                  />

                  {/* Tab Label */}
                  <span>{tab.label}</span>

                  {/* Modern Pill Badge Count */}
                  <Box
                    component="span"
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      px: 0.9,
                      py: 0.15,
                      minWidth: 22,
                      borderRadius: "999px",
                      fontSize: "0.72rem",
                      fontWeight: 800,
                      lineHeight: 1.3,
                      bgcolor: isSelected
                        ? tab.activeBg
                        : isDark
                          ? "rgba(255, 255, 255, 0.06)"
                          : "#e2e8f0",
                      color: isSelected
                        ? tab.activeColor
                        : isDark
                          ? "#94a3b8"
                          : "#64748b",
                      transition: "all 0.18s ease",
                    }}
                  >
                    {tab.count}
                  </Box>
                </ButtonBase>
              );
            })}
          </Box>

          {/* Right Toolbar: Search & View Switcher */}
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ width: { xs: "100%", md: "auto" } }}>
            <TextField
              size="small"
              placeholder="Filter by name, email, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{
                width: { xs: "100%", md: 320 },
                "& .MuiOutlinedInput-root": {
                  borderRadius: "10px",
                  bgcolor: isDark ? "#0d1527" : "#f8fafc",
                  fontSize: "0.85rem",
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: isDark ? "#64748b" : "#94a3b8", fontSize: 18 }} />
                  </InputAdornment>
                ),
              }}
            />

            {/* View Switcher: Grid vs Table */}
            <Stack
              direction="row"
              sx={{
                bgcolor: isDark ? "#0d1527" : "#f1f5f9",
                borderRadius: "10px",
                p: 0.3,
                border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#cbd5e1"}`,
              }}
            >
              <Tooltip title="Cards Grid View">
                <IconButton
                  size="small"
                  onClick={() => setViewMode("grid")}
                  sx={{
                    borderRadius: "8px",
                    px: 1,
                    py: 0.5,
                    bgcolor: viewMode === "grid" ? "#2563eb" : "transparent",
                    color: viewMode === "grid" ? "#fff" : isDark ? "#94a3b8" : "#64748b",
                    "&:hover": { bgcolor: viewMode === "grid" ? "#2563eb" : "transparent" },
                  }}
                >
                  <GridView sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Data Table View">
                <IconButton
                  size="small"
                  onClick={() => setViewMode("table")}
                  sx={{
                    borderRadius: "8px",
                    px: 1,
                    py: 0.5,
                    bgcolor: viewMode === "table" ? "#2563eb" : "transparent",
                    color: viewMode === "table" ? "#fff" : isDark ? "#94a3b8" : "#64748b",
                    "&:hover": { bgcolor: viewMode === "table" ? "#2563eb" : "transparent" },
                  }}
                >
                  <TableRows sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>
        </Stack>
      </Box>

      {/* ─── Main Content ────────────────────────────────────────────────────── */}
      {loading ? (
        <Box sx={{ py: 14, textAlign: "center" }}>
          <CircularProgress size={40} thickness={4} sx={{ color: "#38bdf8" }} />
          <Typography variant="body2" fontWeight={700} sx={{ mt: 2, color: isDark ? "#94a3b8" : "#64748b" }}>
            Querying Tenant Organizations...
          </Typography>
        </Box>
      ) : filteredCompanies.length === 0 ? (
        /* ═══════════════ PREMIUM EMPTY STATE ONBOARDING ═══════════════ */
        <Box
          sx={{
            py: 10,
            px: { xs: 3, md: 6 },
            borderRadius: "24px",
            bgcolor: isDark ? "#0d1527" : "#ffffff",
            border: `1.5px dashed ${isDark ? "rgba(56, 189, 248, 0.25)" : "#cbd5e1"}`,
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
            boxShadow: isDark ? "0 10px 30px rgba(0,0,0,0.4)" : "0 8px 24px rgba(0,0,0,0.03)",
          }}
        >
          {/* Subtle Ambient Radial Glow */}
          <Box
            sx={{
              position: "absolute",
              top: "20%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 320,
              height: 320,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(56, 189, 248, 0.12) 0%, transparent 70%)",
              filter: "blur(40px)",
              pointerEvents: "none",
            }}
          />

          <Avatar
            sx={{
              width: 72,
              height: 72,
              bgcolor: "rgba(56, 189, 248, 0.12)",
              color: "#38bdf8",
              mx: "auto",
              mb: 2.5,
              borderRadius: "20px",
              border: "1px solid rgba(56, 189, 248, 0.3)",
              boxShadow: "0 8px 25px rgba(56, 189, 248, 0.2)",
            }}
          >
            <Domain sx={{ fontSize: 36 }} />
          </Avatar>

          <Typography
            variant="h4"
            fontWeight={900}
            sx={{ color: isDark ? "#f8fafc" : "#0f172a", letterSpacing: "-0.02em" }}
          >
            Deploy Your First Tenant Organization
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: isDark ? "#94a3b8" : "#64748b",
              mt: 1,
              mb: 4,
              maxWidth: 620,
              mx: "auto",
              fontSize: "0.98rem",
              lineHeight: 1.6,
            }}
          >
            Provision an isolated workspace for your solar company client. They receive dedicated administrator credentials,
            custom logo branding in their sidebar, and complete database multi-tenancy.
          </Typography>

          {/* 3 Pillars of SaaS Multi-Tenancy */}
          <Grid container spacing={2.5} sx={{ maxWidth: 860, mx: "auto", mb: 4.5 }}>
            <Grid item xs={12} sm={4}>
              <Box sx={{ p: 2, borderRadius: "14px", bgcolor: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc", border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#e2e8f0"}` }}>
                <ShieldOutlined sx={{ color: "#38bdf8", fontSize: 24, mb: 0.5 }} />
                <Typography variant="subtitle2" fontWeight={800} sx={{ color: isDark ? "#f1f5f9" : "#1e293b" }}>
                  Isolated Data
                </Typography>
                <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b" }}>
                  Tenants only access their company's leads, projects & staff.
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box sx={{ p: 2, borderRadius: "14px", bgcolor: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc", border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#e2e8f0"}` }}>
                <ColorLensOutlined sx={{ color: "#a855f7", fontSize: 24, mb: 0.5 }} />
                <Typography variant="subtitle2" fontWeight={800} sx={{ color: isDark ? "#f1f5f9" : "#1e293b" }}>
                  Custom Branding
                </Typography>
                <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b" }}>
                  Upload custom company logos for the sidebar & portal header.
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box sx={{ p: 2, borderRadius: "14px", bgcolor: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc", border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#e2e8f0"}` }}>
                <SpeedOutlined sx={{ color: "#10b981", fontSize: 24, mb: 0.5 }} />
                <Typography variant="subtitle2" fontWeight={800} sx={{ color: isDark ? "#f1f5f9" : "#1e293b" }}>
                  Instant Provisioning
                </Typography>
                <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b" }}>
                  Admin accounts are ready to sign in immediately upon creation.
                </Typography>
              </Box>
            </Grid>
          </Grid>

          <Button
            variant="contained"
            onClick={openCreatePage}
            startIcon={<Add />}
            sx={{
              background: "linear-gradient(135deg, #0284c7 0%, #2563eb 50%, #4f46e5 100%)",
              color: "#fff",
              fontWeight: 800,
              fontSize: "1rem",
              borderRadius: "14px",
              px: 4,
              py: 1.4,
              boxShadow: "0 10px 28px rgba(37, 99, 235, 0.45)",
              letterSpacing: "0.01em",
              textTransform: "none",
            }}
          >
            Launch First Organization
          </Button>
        </Box>
      ) : viewMode === "grid" ? (
        /* ═══════════════ REFINED SAAS COMPANY CARDS ═══════════════ */
        <Grid container spacing={3}>
          {filteredCompanies.map((comp) => {
            const isActive = comp.status === "active";
            const adminUser = comp.adminUser || {};
            const logoSrc = toBackendAssetUrl(comp.logo || adminUser.companyLogo);
            const initials = comp.name
              ? comp.name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()
              : "CO";

            return (
              <Grid item xs={12} sm={6} lg={4} key={comp._id}>
                <Box
                  onClick={() => navigate(`/super-admin/org/${comp._id}`)}
                  sx={{
                    borderRadius: "18px",
                    bgcolor: isDark ? "rgba(13, 21, 39, 0.85)" : "#ffffff",
                    backdropFilter: "blur(12px)",
                    border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "#e2e8f0"}`,
                    boxShadow: isDark
                      ? "0 4px 20px rgba(0, 0, 0, 0.35)"
                      : "0 4px 20px rgba(0, 0, 0, 0.04)",
                    transition: "all 0.22s cubic-bezier(0.4, 0, 0.2, 1)",
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                    p: 2.8,
                    cursor: "pointer",
                    position: "relative",
                    overflow: "hidden",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      borderColor: isDark ? "rgba(56, 189, 248, 0.5)" : "#38bdf8",
                      boxShadow: isDark
                        ? "0 16px 36px -8px rgba(0, 0, 0, 0.6), 0 0 24px rgba(56, 189, 248, 0.15)"
                        : "0 16px 36px -8px rgba(37, 99, 235, 0.12)",
                      "& .manage-link": {
                        color: "#38bdf8",
                        transform: "translateX(3px)",
                      },
                    },
                  }}
                >
                  {/* Top Ambient Highlight Gradient */}
                  <Box
                    sx={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 3,
                      background: isActive
                        ? "linear-gradient(90deg, #38bdf8 0%, #2563eb 50%, #818cf8 100%)"
                        : "linear-gradient(90deg, #94a3b8 0%, #64748b 100%)",
                      opacity: isActive ? 0.9 : 0.4,
                    }}
                  />

                  {/* Header: Avatar, Name, Validity, Status Switch */}
                  <Stack direction="row" spacing={1.8} alignItems="flex-start" justifyContent="space-between">
                    <Stack direction="row" spacing={1.6} alignItems="center" sx={{ minWidth: 0, flex: 1 }}>
                      <Avatar
                        src={logoSrc}
                        variant="rounded"
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: "13px",
                          bgcolor: isDark ? "#17223b" : "#f1f5f9",
                          border: `1.5px solid ${isDark ? "rgba(56, 189, 248, 0.25)" : "#dbeafe"}`,
                          color: "#2563eb",
                          fontWeight: 900,
                          fontSize: "1.1rem",
                          p: logoSrc ? 0.3 : 0,
                          flexShrink: 0,
                        }}
                      >
                        {initials}
                      </Avatar>

                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography
                          variant="h6"
                          fontWeight={800}
                          noWrap
                          sx={{
                            color: isDark ? "#f8fafc" : "#0f172a",
                            fontSize: "1.05rem",
                            letterSpacing: "-0.01em",
                            lineHeight: 1.25,
                          }}
                        >
                          {comp.name}
                        </Typography>

                        {/* Status / Validity Pill */}
                        <Box sx={{ mt: 0.6, display: "flex", alignItems: "center", gap: 0.8, flexWrap: "wrap" }}>
                          {comp.subscriptionExpiresAt ? (
                            new Date() > new Date(comp.subscriptionExpiresAt) ? (
                              <Chip
                                label="Expired"
                                size="small"
                                sx={{
                                  height: 20,
                                  fontSize: "0.68rem",
                                  fontWeight: 800,
                                  bgcolor: "rgba(239, 68, 68, 0.12)",
                                  color: "#ef4444",
                                  border: "1px solid rgba(239, 68, 68, 0.25)",
                                }}
                              />
                            ) : (
                              <Chip
                                label={`Valid: ${new Date(comp.subscriptionExpiresAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`}
                                size="small"
                                sx={{
                                  height: 20,
                                  fontSize: "0.68rem",
                                  fontWeight: 700,
                                  bgcolor: isDark ? "rgba(16, 185, 129, 0.12)" : "#dcfce7",
                                  color: isDark ? "#34d399" : "#15803d",
                                  border: `1px solid ${isDark ? "rgba(16, 185, 129, 0.25)" : "transparent"}`,
                                }}
                              />
                            )
                          ) : (
                            <Chip
                              label="Lifetime"
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: "0.68rem",
                                fontWeight: 700,
                                bgcolor: isDark ? "rgba(56, 189, 248, 0.12)" : "#e0f2fe",
                                color: isDark ? "#38bdf8" : "#0284c7",
                                border: `1px solid ${isDark ? "rgba(56, 189, 248, 0.25)" : "transparent"}`,
                              }}
                            />
                          )}

                          <Chip
                            label={comp.plan || "Enterprise"}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: "0.66rem",
                              fontWeight: 700,
                              bgcolor: isDark ? "rgba(168, 85, 247, 0.1)" : "#f3e8ff",
                              color: isDark ? "#c084fc" : "#7e22ce",
                            }}
                          />
                        </Box>
                      </Box>
                    </Stack>

                    {/* Compact Status Switch Pill */}
                    <Box
                      onClick={(e) => e.stopPropagation()}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.6,
                        p: "2px 6px 2px 10px",
                        borderRadius: "999px",
                        bgcolor: isActive
                          ? isDark ? "rgba(16, 185, 129, 0.1)" : "#f0fdf4"
                          : isDark ? "rgba(148, 163, 184, 0.08)" : "#f1f5f9",
                        border: `1px solid ${isActive
                          ? isDark ? "rgba(16, 185, 129, 0.25)" : "#bbf7d0"
                          : isDark ? "rgba(148, 163, 184, 0.15)" : "#e2e8f0"}`,
                      }}
                    >
                      <Box
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          bgcolor: isActive ? "#22c55e" : "#94a3b8",
                          boxShadow: isActive ? "0 0 6px #22c55e" : "none",
                        }}
                      />
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 800,
                          fontSize: "0.68rem",
                          letterSpacing: "0.02em",
                          color: isActive
                            ? isDark ? "#4ade80" : "#16a34a"
                            : isDark ? "#94a3b8" : "#64748b",
                        }}
                      >
                        {isActive ? "Active" : "Off"}
                      </Typography>
                      <Switch
                        checked={isActive}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleToggleStatus(comp);
                        }}
                        color="success"
                        size="small"
                        sx={{
                          transform: "scale(0.8)",
                          mr: -0.5,
                        }}
                      />
                    </Box>
                  </Stack>

                  {/* Clean Admin & Contact Info Strip (Modern Linear Style) */}
                  <Box
                    sx={{
                      my: 2.2,
                      p: 1.8,
                      borderRadius: "12px",
                      bgcolor: isDark ? "rgba(255, 255, 255, 0.02)" : "#f8fafc",
                      border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.05)" : "#eef2f6"}`,
                    }}
                  >
                    {/* Admin Name & Badge */}
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                        <PersonOutline sx={{ fontSize: 16, color: "#38bdf8", flexShrink: 0 }} />
                        <Typography
                          variant="body2"
                          fontWeight={700}
                          noWrap
                          sx={{ color: isDark ? "#f1f5f9" : "#1e293b", fontSize: "0.86rem" }}
                        >
                          {adminUser.firstName || "Company"} {adminUser.lastName || "Admin"}
                        </Typography>
                      </Stack>
                      <Chip
                        label={adminUser.employeeId || "ADM0001"}
                        size="small"
                        sx={{
                          height: 18,
                          fontWeight: 800,
                          fontSize: "0.62rem",
                          bgcolor: isDark ? "rgba(255,255,255,0.06)" : "#e2e8f0",
                          color: isDark ? "#cbd5e1" : "#475569",
                        }}
                      />
                    </Stack>

                    {/* Email with 1-Click Copy */}
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                      <Email sx={{ fontSize: 15, color: isDark ? "#64748b" : "#94a3b8", flexShrink: 0 }} />
                      <Typography
                        variant="caption"
                        noWrap
                        sx={{
                          color: isDark ? "#94a3b8" : "#475569",
                          fontWeight: 500,
                          fontSize: "0.8rem",
                          flex: 1,
                        }}
                      >
                        {comp.email || adminUser.email || "No email assigned"}
                      </Typography>
                      <Tooltip title="Copy Email">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(comp.email || adminUser.email, "Admin Email");
                          }}
                          sx={{
                            p: 0.3,
                            color: isDark ? "#64748b" : "#94a3b8",
                            "&:hover": { color: "#38bdf8" },
                          }}
                        >
                          <ContentCopy sx={{ fontSize: 13 }} />
                        </IconButton>
                      </Tooltip>
                    </Stack>

                    {/* Phone Number (if present) */}
                    {comp.phone && (
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.6 }}>
                        <Phone sx={{ fontSize: 14, color: isDark ? "#64748b" : "#94a3b8", flexShrink: 0 }} />
                        <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontWeight: 500, fontSize: "0.78rem" }}>
                          {comp.phone}
                        </Typography>
                      </Stack>
                    )}
                  </Box>

                  {/* Metadata Row: Members & Joined Date */}
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: "auto", pt: 0.2 }}>
                    <Stack direction="row" spacing={0.8} alignItems="center">
                      <PeopleAlt sx={{ fontSize: 14, color: "#818cf8" }} />
                      <Typography variant="caption" fontWeight={700} sx={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.76rem" }}>
                        {comp.staffCount || 0} Members
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={0.8} alignItems="center">
                      <CalendarToday sx={{ fontSize: 13, color: isDark ? "#64748b" : "#94a3b8" }} />
                      <Typography variant="caption" sx={{ color: isDark ? "#64748b" : "#94a3b8", fontSize: "0.76rem" }}>
                        {new Date(comp.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </Typography>
                    </Stack>
                  </Stack>

                  <Divider sx={{ my: 1.8, borderColor: isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9" }} />

                  {/* Card Bottom: Manage Link & Quick Actions */}
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    {/* Manage Link */}
                    <Stack
                      direction="row"
                      spacing={0.5}
                      alignItems="center"
                      className="manage-link"
                      sx={{
                        color: isDark ? "#94a3b8" : "#64748b",
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        transition: "all 0.2s ease",
                      }}
                    >
                      <span>Manage</span>
                      <ArrowForward sx={{ fontSize: 13 }} />
                    </Stack>

                    {/* Quick Action Buttons Group */}
                    <Stack direction="row" spacing={0.8} alignItems="center" onClick={(e) => e.stopPropagation()}>
                      <Tooltip title="Reset Admin Password">
                        <Button
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            openResetPasswordModal(comp);
                          }}
                          startIcon={<VpnKey sx={{ fontSize: 13 }} />}
                          sx={{
                            borderRadius: "8px",
                            fontWeight: 700,
                            fontSize: "0.72rem",
                            textTransform: "none",
                            py: 0.4,
                            px: 1.1,
                            color: isDark ? "#fbbf24" : "#d97706",
                            bgcolor: isDark ? "rgba(245, 158, 11, 0.08)" : "#fffbeb",
                            border: `1px solid ${isDark ? "rgba(245, 158, 11, 0.2)" : "#fde68a"}`,
                            "&:hover": {
                              bgcolor: isDark ? "rgba(245, 158, 11, 0.16)" : "#fef3c7",
                            },
                          }}
                        >
                          Password
                        </Button>
                      </Tooltip>

                      <Tooltip title="Edit Organization">
                        <Button
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(comp);
                          }}
                          startIcon={<Edit sx={{ fontSize: 13 }} />}
                          sx={{
                            borderRadius: "8px",
                            fontWeight: 700,
                            fontSize: "0.72rem",
                            textTransform: "none",
                            py: 0.4,
                            px: 1.1,
                            color: isDark ? "#38bdf8" : "#0284c7",
                            bgcolor: isDark ? "rgba(56, 189, 248, 0.08)" : "#f0f9ff",
                            border: `1px solid ${isDark ? "rgba(56, 189, 248, 0.2)" : "#bae6fd"}`,
                            "&:hover": {
                              bgcolor: isDark ? "rgba(56, 189, 248, 0.16)" : "#e0f2fe",
                            },
                          }}
                        >
                          Edit
                        </Button>
                      </Tooltip>

                      <Tooltip title="Delete Organization">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDeleteModal(comp);
                          }}
                          sx={{
                            p: 0.6,
                            borderRadius: "8px",
                            color: isDark ? "#f87171" : "#ef4444",
                            bgcolor: isDark ? "rgba(239, 68, 68, 0.08)" : "#fef2f2",
                            border: `1px solid ${isDark ? "rgba(239, 68, 68, 0.2)" : "#fecaca"}`,
                            "&:hover": {
                              bgcolor: isDark ? "rgba(239, 68, 68, 0.18)" : "#fee2e2",
                            },
                          }}
                        >
                          <DeleteOutline sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Stack>
                </Box>
              </Grid>
            );
          })}
        </Grid>
      ) : (
        /* ═══════════════ HIGH-DENSITY DATA TABLE VIEW ═══════════════ */
        <Box
          sx={{
            borderRadius: "20px",
            bgcolor: isDark ? "#0d1527" : "#ffffff",
            border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "#e2e8f0"}`,
            boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.3)" : "0 4px 20px rgba(0,0,0,0.03)",
            overflow: "hidden",
          }}
        >
          <TableContainer component={Paper} elevation={0} sx={{ bgcolor: "transparent" }}>
            <Table>
              <TableHead sx={{ bgcolor: isDark ? "rgba(255,255,255,0.02)" : "#f8fafc" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800, color: isDark ? "#94a3b8" : "#475569" }}>Company</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: isDark ? "#94a3b8" : "#475569" }}>Admin Account</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: isDark ? "#94a3b8" : "#475569" }}>Plan</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: isDark ? "#94a3b8" : "#475569" }}>Staff</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: isDark ? "#94a3b8" : "#475569" }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: isDark ? "#94a3b8" : "#475569" }}>Created Date</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, color: isDark ? "#94a3b8" : "#475569" }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredCompanies.map((comp) => {
                  const isActive = comp.status === "active";
                  const adminUser = comp.adminUser || {};
                  const logoSrc = toBackendAssetUrl(comp.logo || adminUser.companyLogo);

                  return (
                    <TableRow
                      key={comp._id}
                      hover
                      onClick={() => navigate(`/super-admin/org/${comp._id}`)}
                      sx={{
                        cursor: "pointer",
                        "&:last-child td, &:last-child th": { border: 0 },
                      }}
                    >
                      {/* Company Name & Logo */}
                      <TableCell>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Avatar
                            src={logoSrc}
                            variant="rounded"
                            sx={{
                              width: 42,
                              height: 42,
                              borderRadius: "12px",
                              bgcolor: isDark ? "#17223b" : "#f1f5f9",
                              color: "#2563eb",
                              fontWeight: 800,
                            }}
                          >
                            {comp.name?.[0] || "C"}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" fontWeight={800} sx={{ color: isDark ? "#f8fafc" : "#0f172a" }}>
                              {comp.name}
                            </Typography>
                            {comp.phone && (
                              <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b" }}>
                                {comp.phone}
                              </Typography>
                            )}
                          </Box>
                        </Stack>
                      </TableCell>

                      {/* Admin Account */}
                      <TableCell>
                        <Typography variant="body2" fontWeight={700} sx={{ color: isDark ? "#e2e8f0" : "#1e293b" }}>
                          {adminUser.firstName || "Admin"} {adminUser.lastName || "User"}
                        </Typography>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b" }}>
                            {comp.email || adminUser.email}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(comp.email || adminUser.email, "Admin Email");
                            }}
                            sx={{ p: 0.2 }}
                          >
                            <ContentCopy sx={{ fontSize: 12, color: isDark ? "#94a3b8" : "#64748b" }} />
                          </IconButton>
                        </Stack>
                      </TableCell>

                      {/* Plan */}
                      <TableCell>
                        <Chip
                          label={comp.plan || "Enterprise SaaS"}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            fontSize: "0.72rem",
                            bgcolor: isDark ? "rgba(168, 85, 247, 0.12)" : "#f3e8ff",
                            color: isDark ? "#c084fc" : "#7e22ce",
                          }}
                        />
                      </TableCell>

                      {/* Staff */}
                      <TableCell>
                        <Typography variant="body2" fontWeight={700} sx={{ color: "#818cf8" }}>
                          {comp.staffCount || 0} Members
                        </Typography>
                      </TableCell>

                      {/* Status */}
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Switch
                          checked={isActive}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleToggleStatus(comp);
                          }}
                          color="success"
                          size="small"
                        />
                        <Typography
                          variant="caption"
                          sx={{
                            ml: 0.5,
                            fontWeight: 800,
                            color: isActive ? "#4ade80" : "#94a3b8",
                          }}
                        >
                          {isActive ? "Active" : "Inactive"}
                        </Typography>
                      </TableCell>

                      {/* Created Date */}
                      <TableCell>
                        <Typography variant="body2" sx={{ color: isDark ? "#94a3b8" : "#64748b" }}>
                          {new Date(comp.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </Typography>
                      </TableCell>

                      {/* Actions */}
                      <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Tooltip title="Reset Password">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                openResetPasswordModal(comp);
                              }}
                              sx={{ color: "#f59e0b" }}
                            >
                              <VpnKey sx={{ fontSize: 17 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit Company">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditModal(comp);
                              }}
                              sx={{ color: "#38bdf8" }}
                            >
                              <Edit sx={{ fontSize: 17 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Company">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                openDeleteModal(comp);
                              }}
                              sx={{ color: "#ef4444" }}
                            >
                              <DeleteOutline sx={{ fontSize: 17 }} />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {renderCommonModals()}
    </Box>
  );
}
