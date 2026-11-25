import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  TextField,
  IconButton,
  Divider,
  Switch,
  Snackbar,
  Alert,
  Avatar,
  InputAdornment,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  Stack,
  Chip,
} from "@mui/material";
import {
  AdminPanelSettings as AdminIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  VpnKey as KeyIcon,
  CloudUpload as CloudUploadIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  CameraAlt as CameraIcon,
  Shield as ShieldIcon,
  Palette as PaletteIcon,
  Security as SecurityIcon,
  Check as CheckIcon,
  PhoneAndroid as MobileAppIcon,
  AccessTime as AccessTimeIcon,
  EventAvailable as EventAvailableIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { API_BASE_URL } from "../utils/apiConfig";
import { toBackendAssetUrl } from "../utils/backendAssetUrl";

const API = API_BASE_URL;

const getToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("authToken") ||
  localStorage.getItem("accessToken") ||
  "";

const Settings = () => {
  const theme = useTheme();
  const { user, updateLocalUser } = useAuth();
  const isDark = theme.palette.mode === "dark";
  const navigate = useNavigate();

  // Modal control state: null | 'profile' | 'password' | 'theme'
  const [activeModal, setActiveModal] = useState(null);

  // Dark Mode State
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("appThemeMode") === "dark";
  });

  // Live Validity Countdown
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    if (!user?.subscriptionExpiresAt) return;
    const interval = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [user?.subscriptionExpiresAt]);

  const validityDisplay = React.useMemo(() => {
    if (!user?.subscriptionExpiresAt) {
      return {
        label: "Lifetime Access",
        sub: "No expiration date",
        color: "#22c55e",
        bg: isDark ? "rgba(34, 197, 94, 0.12)" : "#f0fdf4",
        border: isDark ? "rgba(34, 197, 94, 0.3)" : "#bbf7d0",
      };
    }
    const expMs = new Date(user.subscriptionExpiresAt).getTime();
    if (Number.isNaN(expMs)) return null;
    const diff = expMs - nowMs;
    const dateStr = new Date(expMs).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    if (diff <= 0) {
      return {
        label: "Validity Expired",
        sub: `Ended on ${dateStr}`,
        color: "#ef4444",
        bg: isDark ? "rgba(239, 68, 68, 0.14)" : "#fef2f2",
        border: isDark ? "rgba(239, 68, 68, 0.35)" : "#fecaca",
      };
    }

    const totalSec = Math.floor(diff / 1000);
    const days = Math.floor(totalSec / 86400);
    const hours = Math.floor((totalSec % 86400) / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;

    if (diff <= 48 * 3600 * 1000) {
      const totalHrs = Math.floor(totalSec / 3600);
      const hms = [totalHrs, mins, secs].map((n) => String(n).padStart(2, "0")).join(":");
      return {
        label: `${hms} Remaining`,
        sub: `Expires ${dateStr}`,
        color: "#ef4444",
        bg: isDark ? "rgba(239, 68, 68, 0.14)" : "#fef2f2",
        border: isDark ? "rgba(239, 68, 68, 0.38)" : "#fca5a5",
      };
    }

    return {
      label: `${days} Day${days !== 1 ? "s" : ""}, ${hours}h Left`,
      sub: `Valid until ${dateStr}`,
      color: "#16a34a",
      bg: isDark ? "rgba(34, 197, 94, 0.12)" : "#f0fdf4",
      border: isDark ? "rgba(34, 197, 94, 0.3)" : "#bbf7d0",
    };
  }, [user?.subscriptionExpiresAt, nowMs, isDark]);

  // Admin Profile Form state
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    avatar: null,
  });

  // Password state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Password Visibility toggles
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Avatar Preview
  const [avatarPreview, setAvatarPreview] = useState("");
  const [saving, setSaving] = useState(false);

  // Snackbar Toast State
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [usersList, setUsersList] = useState([]);

  useEffect(() => {
    const fetchUsersForPerms = async () => {
      try {
        const token = getToken();
        const res = await fetch(`${API}/user/getAllUsers?page=1&limit=200`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success && data.result?.users) {
          setUsersList(data.result.users);
        }
      } catch (err) {
        console.warn("Could not load users list for settings:", err);
      }
    };
    fetchUsersForPerms();
  }, []);

  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
        avatar: null,
      });
      if (user.avatar) {
        setAvatarPreview(toBackendAssetUrl(user.avatar));
      }
    }
  }, [user]);

  // Handle Theme Toggle
  const handleDarkModeToggle = (isDarkVal) => {
    setDarkMode(isDarkVal);
    const newMode = isDarkVal ? "dark" : "light";
    localStorage.setItem("appThemeMode", newMode);

    // Trigger instant theme update event for App.js
    window.dispatchEvent(new CustomEvent("themeModeChange", { detail: newMode }));

    setSnackbar({
      open: true,
      message: isDarkVal ? "Dark Mode Theme Applied" : "Light Mode Theme Applied",
      severity: "info",
    });
  };

  // Image Selection Handler
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileForm((prev) => ({ ...prev, avatar: file }));
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  // Remove Avatar Handler
  const handleRemoveImage = () => {
    setProfileForm((prev) => ({ ...prev, avatar: null }));
    setAvatarPreview("");
  };

  // Save Admin Profile
  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      const token = getToken();

      const formData = new FormData();
      formData.append("firstName", profileForm.firstName);
      formData.append("lastName", profileForm.lastName);
      formData.append("email", profileForm.email);
      if (profileForm.phone) formData.append("phone", profileForm.phone);
      if (profileForm.avatar) formData.append("avatar", profileForm.avatar);

      const res = await fetch(`${API}/user/profile`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.message || "Failed to update profile");

      if (updateLocalUser && payload.result) {
        updateLocalUser(payload.result);
      }

      setSnackbar({ open: true, message: "Admin profile updated successfully!", severity: "success" });
      setActiveModal(null);
    } catch (err) {
      setSnackbar({ open: true, message: err.message || "Failed to save profile", severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  // Save Security Password
  const handleSavePassword = async (e) => {
    if (e) e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setSnackbar({ open: true, message: "New password and confirm password do not match", severity: "error" });
      return;
    }
    if (!passwordForm.currentPassword) {
      setSnackbar({ open: true, message: "Please enter your current password", severity: "error" });
      return;
    }

    try {
      setSaving(true);
      const token = getToken();

      const formData = new FormData();
      formData.append("firstName", profileForm.firstName);
      formData.append("lastName", profileForm.lastName);
      formData.append("email", profileForm.email);
      formData.append("currentPassword", passwordForm.currentPassword);
      formData.append("newPassword", passwordForm.newPassword);

      const res = await fetch(`${API}/user/profile`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.message || "Failed to update password");

      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setSnackbar({ open: true, message: "Password updated successfully!", severity: "success" });
      setActiveModal(null);
    } catch (err) {
      setSnackbar({ open: true, message: err.message || "Failed to update password", severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  const getUserInitials = () =>
    `${profileForm.firstName?.[0] || ""}${profileForm.lastName?.[0] || ""}`.toUpperCase() || "A";

  // Card definitions matching the requested grid style
  const cards = [
    {
      key: "profile",
      icon: <PersonIcon sx={{ fontSize: 30, color: "#1e40af" }} />,
      title: "Admin Profile",
      subtitle: "Manage profile photo, name, email & phone",
    },
    {
      key: "password",
      icon: <LockIcon sx={{ fontSize: 30, color: "#1e40af" }} />,
      title: "Password & Security",
      subtitle: "Change admin security password",
    },
    {
      key: "appPermissions",
      icon: <MobileAppIcon sx={{ fontSize: 30, color: "#10b981" }} />,
      title: "Mobile APK Permissions",
      subtitle: "Select menus & features Incharge, Supervisor & Manager see in the APK",
    },
    {
      key: "theme",
      icon: darkMode ? (
        <DarkModeIcon sx={{ fontSize: 30, color: "#3b82f6" }} />
      ) : (
        <LightModeIcon sx={{ fontSize: 30, color: "#f59e0b" }} />
      ),
      title: "Dark Mode Theme",
      subtitle: "Toggle light and dark theme mode",
    },
  ];

  return (
    <Box sx={{ p: { xs: 2.5, sm: 4 }, bgcolor: theme.palette.background.default, minHeight: "100vh", maxWidth: 1280, mx: "auto" }}>
      {/* Page Title Header */}
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "center" }}
        spacing={2}
        sx={{ mb: 4 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800} sx={{ color: theme.palette.text.primary, letterSpacing: "-0.02em" }}>
            Settings & Configuration
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5, fontSize: "0.9rem" }}>
            Manage admin profile, password security, mobile APK role permissions, and theme appearance.
          </Typography>
        </Box>

        {validityDisplay && (
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            sx={{
              px: 2.2,
              py: 1.2,
              borderRadius: "14px",
              bgcolor: validityDisplay.bg,
              border: `1.5px solid ${validityDisplay.border}`,
              flexShrink: 0,
            }}
          >
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: "10px",
                bgcolor: isDark ? "rgba(255,255,255,0.06)" : "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: validityDisplay.color,
              }}
            >
              {user?.subscriptionExpiresAt ? (
                <AccessTimeIcon sx={{ fontSize: 21 }} />
              ) : (
                <EventAvailableIcon sx={{ fontSize: 21 }} />
              )}
            </Box>
            <Box>
              <Typography
                sx={{
                  fontSize: "0.68rem",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: theme.palette.text.secondary,
                  lineHeight: 1.2,
                }}
              >
                Workspace Validity
              </Typography>
              <Typography
                sx={{
                  fontSize: "0.95rem",
                  fontWeight: 800,
                  color: validityDisplay.color,
                  fontVariantNumeric: "tabular-nums",
                  lineHeight: 1.25,
                }}
              >
                {validityDisplay.label}
              </Typography>
              <Typography sx={{ fontSize: "0.74rem", fontWeight: 600, color: theme.palette.text.secondary }}>
                {validityDisplay.sub}
              </Typography>
            </Box>
          </Stack>
        )}
      </Stack>

      {/* Grid Cards Section */}
      <Grid container spacing={2.5}>
        {cards.map((card) => (
          <Grid item xs={12} sm={6} md={3} key={card.key}>
            <Paper
              elevation={0}
              onClick={() => {
                if (card.key === "appPermissions") {
                  navigate("/apk-permissions");
                } else {
                  setActiveModal(card.key);
                }
              }}
              sx={{
                p: 3.5,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                borderRadius: "16px",
                border: `1.5px dashed ${isDark ? "#334155" : "#cbd5e1"}`,
                bgcolor: theme.palette.background.paper,
                cursor: "pointer",
                position: "relative",
                overflow: "hidden",
                transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                "&:hover": {
                  borderColor: "#1e40af",
                  bgcolor: isDark ? "rgba(30, 64, 175, 0.08)" : "rgba(30, 64, 175, 0.03)",
                  transform: "translateY(-3px)",
                  boxShadow: "0 10px 24px rgba(30, 64, 175, 0.12)",
                  "& .icon-box": {
                    bgcolor: "rgba(30, 64, 175, 0.15)",
                    transform: "scale(1.08)",
                  },
                },
              }}
            >
              {/* Glowing Icon Box */}
              <Box
                className="icon-box"
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: "16px",
                  bgcolor: isDark ? "rgba(30, 64, 175, 0.2)" : "rgba(30, 64, 175, 0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mb: 2,
                  transition: "all 0.25s ease",
                }}
              >
                {card.icon}
              </Box>

              <Typography variant="subtitle1" fontWeight={700} sx={{ color: theme.palette.text.primary, fontSize: "1rem", mb: 0.5 }}>
                {card.title}
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: "0.82rem", lineHeight: 1.45 }}>
                {card.subtitle}
              </Typography>

              {/* Inline toggle switch for Dark Mode card */}
              {card.key === "theme" && (
                <Box
                  onClick={(e) => e.stopPropagation()}
                  sx={{ display: "flex", alignItems: "center", gap: 1, mt: 2, bgcolor: isDark ? "#0f172a" : "#f1f5f9", px: 2, py: 0.5, borderRadius: 4 }}
                >
                  <Typography variant="caption" fontWeight={600} color="text.secondary">
                    Light
                  </Typography>
                  <Switch
                    checked={darkMode}
                    onChange={(e) => handleDarkModeToggle(e.target.checked)}
                    color="primary"
                    size="small"
                  />
                  <Typography variant="caption" fontWeight={600} sx={{ color: darkMode ? "#3b82f6" : "text.secondary" }}>
                    Dark
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* ── REDESIGNED MODAL 1: ADMIN PROFILE ── */}
      <Dialog
        open={activeModal === "profile"}
        onClose={() => setActiveModal(null)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: "24px",
            bgcolor: theme.palette.background.paper,
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.2)",
            overflow: "hidden",
          },
        }}
      >
        {/* Modal Header */}
        <Box
          sx={{
            p: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: `1px solid ${isDark ? "#334155" : "#f1f5f9"}`,
            bgcolor: isDark ? "#0f172a" : "#ffffff",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: "12px",
                background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                boxShadow: "0 4px 12px rgba(30, 64, 175, 0.3)",
              }}
            >
              <PersonIcon />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={800} sx={{ color: theme.palette.text.primary, lineHeight: 1.2 }}>
                Admin Profile & Photo
              </Typography>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                Update personal info and profile avatar photo
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={() => setActiveModal(null)}
            sx={{
              bgcolor: isDark ? "#1e293b" : "#f1f5f9",
              color: theme.palette.text.secondary,
              "&:hover": { bgcolor: isDark ? "#334155" : "#e2e8f0" },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <Box component="form" onSubmit={handleSaveProfile}>
          <DialogContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
            {/* Avatar Photo Container */}
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 3.5 }}>
              <Box sx={{ position: "relative", mb: 2 }}>
                <Avatar
                  src={avatarPreview}
                  sx={{
                    width: 104,
                    height: 104,
                    bgcolor: "#1e40af",
                    fontSize: "2.5rem",
                    fontWeight: 800,
                    color: "#ffffff",
                    boxShadow: "0 0 0 4px #3b82f6, 0 8px 24px rgba(30, 64, 175, 0.3)",
                  }}
                >
                  {!avatarPreview && getUserInitials()}
                </Avatar>
                <IconButton
                  component="label"
                  sx={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    bgcolor: "#1e40af",
                    color: "#ffffff",
                    boxShadow: "0 4px 12px rgba(30, 64, 175, 0.4)",
                    "&:hover": { bgcolor: "#1d4ed8" },
                    width: 34,
                    height: 34,
                  }}
                >
                  <CameraIcon sx={{ fontSize: 18 }} />
                  <input hidden type="file" accept="image/*" onChange={handleImageChange} />
                </IconButton>
              </Box>

              <Stack direction="row" spacing={1.5}>
                <Button
                  variant="outlined"
                  size="small"
                  component="label"
                  startIcon={<CloudUploadIcon />}
                  sx={{
                    borderRadius: "10px",
                    textTransform: "none",
                    fontWeight: 700,
                    borderColor: "rgba(30, 64, 175, 0.4)",
                    color: isDark ? "#60a5fa" : "#1e40af",
                  }}
                >
                  Change Photo
                  <input hidden type="file" accept="image/*" onChange={handleImageChange} />
                </Button>
                {avatarPreview && (
                  <Button
                    variant="outlined"
                    size="small"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={handleRemoveImage}
                    sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 600 }}
                  >
                    Remove
                  </Button>
                )}
              </Stack>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={profileForm.firstName}
                  onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon sx={{ color: "#94a3b8", fontSize: 20 }} />
                      </InputAdornment>
                    ),
                    sx: { borderRadius: "12px", bgcolor: isDark ? "#0f172a" : "#f8fafc" },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={profileForm.lastName}
                  onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                  InputProps={{
                    sx: { borderRadius: "12px", bgcolor: isDark ? "#0f172a" : "#f8fafc" },
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon sx={{ color: "#94a3b8", fontSize: 20 }} />
                      </InputAdornment>
                    ),
                    sx: { borderRadius: "12px", bgcolor: isDark ? "#0f172a" : "#f8fafc" },
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon sx={{ color: "#94a3b8", fontSize: 20 }} />
                      </InputAdornment>
                    ),
                    sx: { borderRadius: "12px", bgcolor: isDark ? "#0f172a" : "#f8fafc" },
                  }}
                />
              </Grid>
            </Grid>
          </DialogContent>

          {/* Modal Footer */}
          <DialogActions sx={{ px: 3.5, py: 2.5, borderTop: `1px solid ${isDark ? "#334155" : "#f1f5f9"}` }}>
            <Button
              onClick={() => setActiveModal(null)}
              sx={{
                borderRadius: "10px",
                color: theme.palette.text.secondary,
                px: 2.5,
                fontWeight: 600,
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={saving}
              startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
              sx={{
                background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)",
                borderRadius: "12px",
                px: 3.5,
                py: 1,
                fontWeight: 700,
                boxShadow: "0 6px 20px rgba(30, 64, 175, 0.35)",
                "&:hover": { background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)" },
              }}
            >
              {saving ? "Saving..." : "Save Profile"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* ── REDESIGNED MODAL 2: PASSWORD & SECURITY ── */}
      <Dialog
        open={activeModal === "password"}
        onClose={() => setActiveModal(null)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: "24px",
            bgcolor: theme.palette.background.paper,
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.2)",
            overflow: "hidden",
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: `1px solid ${isDark ? "#334155" : "#f1f5f9"}`,
            bgcolor: isDark ? "#0f172a" : "#ffffff",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: "12px",
                background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                boxShadow: "0 4px 12px rgba(30, 64, 175, 0.3)",
              }}
            >
              <LockIcon />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={800} sx={{ color: theme.palette.text.primary, lineHeight: 1.2 }}>
                Password & Security
              </Typography>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                Update your account password for enhanced security
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={() => setActiveModal(null)}
            sx={{
              bgcolor: isDark ? "#1e293b" : "#f1f5f9",
              color: theme.palette.text.secondary,
              "&:hover": { bgcolor: isDark ? "#334155" : "#e2e8f0" },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <Box component="form" onSubmit={handleSavePassword}>
          <DialogContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
            <Stack spacing={2.5}>
              <TextField
                fullWidth
                label="Current Password"
                type={showCurrentPassword ? "text" : "password"}
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <KeyIcon sx={{ color: "#94a3b8", fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowCurrentPassword((prev) => !prev)} edge="end" size="small">
                        {showCurrentPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                  sx: { borderRadius: "12px", bgcolor: isDark ? "#0f172a" : "#f8fafc" },
                }}
              />

              <TextField
                fullWidth
                label="New Password"
                type={showNewPassword ? "text" : "password"}
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: "#94a3b8", fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowNewPassword((prev) => !prev)} edge="end" size="small">
                        {showNewPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                  sx: { borderRadius: "12px", bgcolor: isDark ? "#0f172a" : "#f8fafc" },
                }}
              />

              <TextField
                fullWidth
                label="Confirm New Password"
                type={showConfirmPassword ? "text" : "password"}
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: "#94a3b8", fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowConfirmPassword((prev) => !prev)} edge="end" size="small">
                        {showConfirmPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                  sx: { borderRadius: "12px", bgcolor: isDark ? "#0f172a" : "#f8fafc" },
                }}
              />
            </Stack>

            {/* Helper Security Tip */}
            <Paper
              elevation={0}
              sx={{
                mt: 3,
                p: 2,
                borderRadius: "12px",
                bgcolor: isDark ? "rgba(30, 64, 175, 0.12)" : "#eff6ff",
                border: `1px solid ${isDark ? "rgba(30, 64, 175, 0.25)" : "#dbeafe"}`,
                display: "flex",
                alignItems: "flex-start",
                gap: 1.5,
              }}
            >
              <ShieldIcon sx={{ color: "#2563eb", fontSize: 20, mt: 0.2 }} />
              <Typography variant="caption" sx={{ color: isDark ? "#93c5fd" : "#1e40af", lineHeight: 1.4 }}>
                <strong>Security Tip:</strong> Passwords should be at least 8 characters long and combine uppercase letters, numbers, and symbols for extra safety.
              </Typography>
            </Paper>
          </DialogContent>

          {/* Modal Footer */}
          <DialogActions sx={{ px: 3.5, py: 2.5, borderTop: `1px solid ${isDark ? "#334155" : "#f1f5f9"}` }}>
            <Button
              onClick={() => setActiveModal(null)}
              sx={{
                borderRadius: "10px",
                color: theme.palette.text.secondary,
                px: 2.5,
                fontWeight: 600,
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={saving}
              startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
              sx={{
                background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)",
                borderRadius: "12px",
                px: 3.5,
                py: 1,
                fontWeight: 700,
                boxShadow: "0 6px 20px rgba(30, 64, 175, 0.35)",
                "&:hover": { background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)" },
              }}
            >
              {saving ? "Updating..." : "Update Password"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* ── REDESIGNED MODAL 3: DARK MODE THEME ── */}
      <Dialog
        open={activeModal === "theme"}
        onClose={() => setActiveModal(null)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: "24px",
            bgcolor: theme.palette.background.paper,
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.2)",
            overflow: "hidden",
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: `1px solid ${isDark ? "#334155" : "#f1f5f9"}`,
            bgcolor: isDark ? "#0f172a" : "#ffffff",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: "12px",
                background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                boxShadow: "0 4px 12px rgba(30, 64, 175, 0.3)",
              }}
            >
              <PaletteIcon />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={800} sx={{ color: theme.palette.text.primary, lineHeight: 1.2 }}>
                Dark Mode & Theme
              </Typography>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                Select your preferred visual appearance mode
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={() => setActiveModal(null)}
            sx={{
              bgcolor: isDark ? "#1e293b" : "#f1f5f9",
              color: theme.palette.text.secondary,
              "&:hover": { bgcolor: isDark ? "#334155" : "#e2e8f0" },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: 3.5 }}>
          <Grid container spacing={2.5}>
            {/* Light Mode Card */}
            <Grid item xs={6}>
              <Paper
                elevation={0}
                onClick={() => handleDarkModeToggle(false)}
                sx={{
                  p: 3,
                  borderRadius: "16px",
                  border: `2px solid ${!darkMode ? "#1e40af" : isDark ? "#334155" : "#e2e8f0"}`,
                  bgcolor: "#ffffff",
                  color: "#0f172a",
                  cursor: "pointer",
                  textAlign: "center",
                  position: "relative",
                  transition: "all 0.25s ease",
                  boxShadow: !darkMode ? "0 8px 24px rgba(30, 64, 175, 0.15)" : "none",
                  "&:hover": { borderColor: "#1e40af", transform: "translateY(-2px)" },
                }}
              >
                {!darkMode && (
                  <Chip
                    icon={<CheckIcon sx={{ fontSize: "14px !important", color: "#ffffff !important" }} />}
                    label="Active"
                    size="small"
                    sx={{
                      position: "absolute",
                      top: 12,
                      right: 12,
                      bgcolor: "#1e40af",
                      color: "#ffffff",
                      fontWeight: 700,
                      fontSize: "0.68rem",
                      height: 20,
                    }}
                  />
                )}
                <LightModeIcon sx={{ fontSize: 40, color: "#f59e0b", mb: 1 }} />
                <Typography variant="subtitle1" fontWeight={800}>
                  Light Mode
                </Typography>
              </Paper>
            </Grid>

            {/* Dark Mode Card */}
            <Grid item xs={6}>
              <Paper
                elevation={0}
                onClick={() => handleDarkModeToggle(true)}
                sx={{
                  p: 3,
                  borderRadius: "16px",
                  border: `2px solid ${darkMode ? "#3b82f6" : isDark ? "#334155" : "#e2e8f0"}`,
                  bgcolor: "#0f172a",
                  color: "#f8fafc",
                  cursor: "pointer",
                  textAlign: "center",
                  position: "relative",
                  transition: "all 0.25s ease",
                  boxShadow: darkMode ? "0 8px 24px rgba(59, 130, 246, 0.25)" : "none",
                  "&:hover": { borderColor: "#3b82f6", transform: "translateY(-2px)" },
                }}
              >
                {darkMode && (
                  <Chip
                    icon={<CheckIcon sx={{ fontSize: "14px !important", color: "#ffffff !important" }} />}
                    label="Active"
                    size="small"
                    sx={{
                      position: "absolute",
                      top: 12,
                      right: 12,
                      bgcolor: "#3b82f6",
                      color: "#ffffff",
                      fontWeight: 700,
                      fontSize: "0.68rem",
                      height: 20,
                    }}
                  />
                )}
                <DarkModeIcon sx={{ fontSize: 40, color: "#60a5fa", mb: 1 }} />
                <Typography variant="subtitle1" fontWeight={800}>
                  Dark Mode
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 3.5, py: 2.5, borderTop: `1px solid ${isDark ? "#334155" : "#f1f5f9"}` }}>
          <Button
            onClick={() => setActiveModal(null)}
            variant="contained"
            sx={{
              background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)",
              borderRadius: "12px",
              px: 3.5,
              py: 1,
              fontWeight: 700,
            }}
          >
            Done
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toast Alert */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity={snackbar.severity} variant="filled" onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Settings;
