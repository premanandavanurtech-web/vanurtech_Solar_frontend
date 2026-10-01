//pages/CreateLeadPage.jsx 
import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  Grid,
  Paper,
  CircularProgress,
  Snackbar,
  Alert,
  useMediaQuery,
  useTheme,
  Container,
  InputAdornment,
  IconButton,
  Card,
  CardContent,
  MenuItem,
  Divider,
  alpha,
  Fade,
  Avatar,
  Chip,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  Tooltip,
  BottomNavigation,
  BottomNavigationAction,
  Badge,
  Zoom,
  AlertTitle,
} from "@mui/material";
import {
  ArrowBack,
  Person,
  Email,
  Phone,
  LocationOn,
  Home,
  Badge as BadgeIcon,
  Map,
  PinDrop,
  Public,
  CheckCircle,
  Error as ErrorIcon,
  Add,
  Assignment,
  Place,
  Business,
  Description,
  Warning,
  Info,
  Dashboard,
  Schedule,
  People,
  Refresh,
  Close,
  ElectricBolt,
  SolarPower,
  AssignmentInd,
  Tune,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const PRIMARY = "#0f1f3d";
const SECONDARY = "#1a237e";
const SUCCESS = "#4caf50";
const ERROR = "#f44336";
const WARNING = "#ff9800";

// Role Configuration
const ROLE_CONFIG = {
  Admin_panel: {
    label: "Admin Panel",
    color: PRIMARY,
    icon: <Person sx={{ fontSize: 16 }} />,
  },
  ZSM: {
    label: "Operation Lead",
    color: PRIMARY,
    icon: <Person sx={{ fontSize: 16 }} />,
  },
  Incharge: {
    label: "Installer",
    color: PRIMARY,
    icon: <Person sx={{ fontSize: 16 }} />,
  },
  TEAM: {
    label: "Installer",
    color: PRIMARY,
    icon: <Person sx={{ fontSize: 16 }} />,
  },
};

const getRoleConfig = (role) => {
  return (
    ROLE_CONFIG[role] || {
      label: role || "User",
      color: PRIMARY,
      icon: <Person sx={{ fontSize: 16 }} />,
    }
  );
};

export default function CreateLeadPage() {
  const navigate = useNavigate();
  const { fetchAPI, user, getUserRole } = useAuth();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  
  // Responsive breakpoints
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));

  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    discomName: "",
    consumerNumber: "",
    plantCapacity: "",
    leadAssociate: "",
    street: "",
    city: "",
    state: "",
    postalCode: "",
    zone: "",
    notes: "",
    source: "Manual Entry",
  });

  const [associates, setAssociates] = useState([]);
  const [loadingAssociates, setLoadingAssociates] = useState(false);

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [formTouched, setFormTouched] = useState(false);
  
  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
    duration: 4000,
  });

  // Get user role
  const userRole = getUserRole();

  // Load associates for Lead Associate dropdown
  useEffect(() => {
    let isMounted = true;
    const loadAssociates = async () => {
      try {
        setLoadingAssociates(true);
        const response = await fetchAPI("/user/getAllUsers?limit=100&status=active");
        const list = response?.result?.users || response?.result?.data || response?.result || [];
        if (isMounted && Array.isArray(list)) {
          setAssociates(list);
        }
      } catch (err) {
        console.warn("Could not fetch associates:", err);
      } finally {
        if (isMounted) setLoadingAssociates(false);
      }
    };
    loadAssociates();
    return () => {
      isMounted = false;
    };
  }, [fetchAPI]);

  const getAssociateDisplayName = (assoc) => {
    if (!assoc) return "";
    const name = [assoc.firstName, assoc.lastName].filter(Boolean).join(" ").trim();
    return name || assoc.email || assoc.phoneNumber || "Unnamed User";
  };


  // Show snackbar helper
  const showSnackbar = useCallback((message, severity = "success", duration = 4000) => {
    setSnackbar({
      open: true,
      message,
      severity,
      duration,
    });
  }, []);

  // Close snackbar
  const handleCloseSnackbar = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  // Handle input change
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    
    // Mark form as touched
    if (!formTouched) {
      setFormTouched(true);
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field if user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  }, [errors, formTouched]);

  // Validate individual field - ONLY FIRST NAME AND PHONE
  const validateField = useCallback((name, value) => {
    const fieldErrors = {};
    
    switch (name) {
      case "firstName":
        if (!value.trim()) {
          fieldErrors.firstName = "First name is required";
        }
        break;
        
      case "phone":
        if (!value.trim()) {
          fieldErrors.phone = "Phone number is required";
        }
        break;
        
      default:
        break;
    }
    
    return fieldErrors;
  }, []);

  // Validate form on blur - ONLY FOR FIRST NAME AND PHONE
  const handleBlur = useCallback((e) => {
    const { name, value } = e.target;
    if (name === "firstName" || name === "phone") {
      const fieldErrors = validateField(name, value);
      setErrors(prev => ({ ...prev, ...fieldErrors }));
    }
  }, [validateField]);

  // Full form validation - ONLY FIRST NAME AND PHONE
  const validateForm = useCallback(() => {
    const newErrors = {};
    
    // Only validate first name and phone
    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Reset form
  const resetForm = useCallback(() => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      discomName: "",
      consumerNumber: "",
      plantCapacity: "",
      leadAssociate: "",
      street: "",
      city: "",
      state: "",
      postalCode: "",
      zone: "",
      notes: "",
      source: "Manual Entry",
    });
    setErrors({});
    setFormTouched(false);
  }, []);

  // Form submission
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showSnackbar("Please fill in the required fields before submitting", "error");
      return;
    }
    
    setLoading(true);
    
    try {
      // Prepare payload
      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim() || null,
        email: formData.email.trim() || null,
        phone: formData.phone.trim(),
        discomName: formData.discomName.trim() || null,
        consumerNumber: formData.consumerNumber.trim() || null,
        plantCapacity: formData.plantCapacity ? parseFloat(formData.plantCapacity) : null,
        leadAssociate: formData.leadAssociate || null,
        assignedTo: formData.leadAssociate || (user?.role === "TEAM" ? user?._id || null : null),
        address: {
          consumerNumber: formData.consumerNumber.trim() || null,
          street: formData.street.trim() || null,
          city: formData.city.trim() || null,
          state: formData.state.trim() || null,
          postalCode: formData.postalCode.trim() || null,
          zones: formData.zone.trim() || null,
        },
        notes: formData.notes.trim() || null,
        source: formData.source,
        createdBy: user?._id || null,
        status: "New",
      };
      
      // API call
      const response = await fetchAPI("/lead/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      
      // Handle response
      if (response?.success) {
        setSubmitted(true);
        showSnackbar("Lead created successfully!", "success");
        
        // Reset form after delay
        setTimeout(() => {
          resetForm();
          setSubmitted(false);
          navigate("/all-leads");
        }, 1500);
      } else {
        // Handle API errors
        const errorMessage = response?.message || response?.error || "Failed to create lead";
        
        if (response?.errors) {
          // Field-specific errors from backend
          const backendErrors = {};
          response.errors.forEach(error => {
            backendErrors[error.field] = error.message;
          });
          setErrors(backendErrors);
          showSnackbar("Please fix the highlighted errors", "error");
        } else if (response?.type === "VALIDATION_ERROR") {
          showSnackbar(errorMessage, "error");
        } else if (response?.type === "DUPLICATE_ERROR") {
          showSnackbar("A lead with this phone number already exists", "error");
        } else {
          throw new Error(errorMessage);
        }
      }
    } catch (error) {
      console.error("Create lead error:", error);
      
      // Handle different error types
      let errorMessage = "Failed to create lead. Please try again.";
      
      if (error.message.includes("Network")) {
        errorMessage = "Network error. Please check your internet connection.";
      } else if (error.message.includes("401") || error.message.includes("403")) {
        errorMessage = "Authentication error. Please log in again.";
        setTimeout(() => navigate("/login"), 2000);
      } else if (error.message.includes("500")) {
        errorMessage = "Server error. Please try again later.";
      } else {
        errorMessage = error.message || errorMessage;
      }
      
      showSnackbar(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  }, [formData, fetchAPI, navigate, validateForm, user, showSnackbar, resetForm]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    if (formTouched) {
      if (window.confirm("Are you sure? All unsaved changes will be lost.")) {
        navigate("/all-leads");
      }
    } else {
      navigate("/all-leads");
    }
  }, [formTouched, navigate]);

  // Text field style
  const textFieldStyle = {
    "& .MuiOutlinedInput-root": {
      borderRadius: 2,
      bgcolor: isDark ? "#0f172a" : "#fff",
      color: isDark ? "#f8fafc" : "#0f172a",
      transition: "all 0.2s ease",
      "& fieldset": { 
        border: "1.5px solid",
        borderColor: isDark ? "rgba(255,255,255,0.15)" : alpha("#000", 0.12),
      },
      "&:hover fieldset": { 
        borderColor: isDark ? "#60a5fa" : PRIMARY,
      },
      "&.Mui-focused fieldset": { 
        border: `2px solid ${isDark ? "#60a5fa" : PRIMARY}`,
        boxShadow: `0 0 0 3px ${alpha(isDark ? "#60a5fa" : PRIMARY, 0.15)}`,
      },
      "&.Mui-error fieldset": {
        borderColor: ERROR,
      },
    },
    "& .MuiInputBase-input": {
      fontSize: { xs: "0.9rem", sm: "0.95rem" },
      padding: { xs: "12px 14px", sm: "14px 16px" },
      color: isDark ? "#f8fafc" : "#0f172a",
      "&::placeholder": {
        color: isDark ? "#64748b" : "#94a3b8",
        opacity: 1,
      },
    },
    "& .MuiInputLabel-root": {
      fontSize: { xs: "0.85rem", sm: "0.9rem" },
      color: isDark ? "#94a3b8" : "text.secondary",
      "&.Mui-focused": {
        color: isDark ? "#60a5fa" : PRIMARY,
      },
    },
    "& .MuiFormHelperText-root": {
      fontSize: { xs: "0.7rem", sm: "0.8rem" },
      marginLeft: 0,
      color: isDark ? "#94a3b8" : "text.secondary",
    },
  };

  // Button styles
  const actionButtonStyle = {
    borderRadius: 2,
    px: { xs: 2, sm: 4 },
    py: { xs: 1, sm: 1.25 },
    fontWeight: 600,
    fontSize: { xs: "0.85rem", sm: "0.95rem" },
    minWidth: { xs: 100, sm: 120 },
    textTransform: "none",
    boxShadow: "none",
    transition: "all 0.2s ease",
    "&:hover": {
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      transform: "translateY(-1px)",
    },
    "&:disabled": {
      opacity: 0.7,
      transform: "none",
    },
  };

  // Field status indicator - ONLY FOR FIRST NAME AND PHONE
  const getFieldStatus = useCallback((fieldName) => {
    const value = formData[fieldName];
    const error = errors[fieldName];
    
    // Only show status for firstName and phone
    if (fieldName !== "firstName" && fieldName !== "phone") {
      return { color: "text.disabled", icon: null };
    }
    
    if (error) return { color: ERROR, icon: <Warning fontSize="small" /> };
    if (value && !error) return { color: SUCCESS, icon: <CheckCircle fontSize="small" /> };
    return { color: "text.disabled", icon: null };
  }, [formData, errors]);

  // If access is denied, show access denied message
  if (accessDenied) {
    return (
      <Box
        sx={{
          p: 3,
          textAlign: "center",
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Alert severity="error" sx={{ maxWidth: 500, borderRadius: 3 }}>
          <AlertTitle>Access Denied</AlertTitle>
          You don't have permission to create leads.
          <Button
            sx={{ mt: 2 }}
            variant="contained"
            onClick={() => navigate("/dashboard")}
            style={{ backgroundColor: PRIMARY }}
          >
            Go to Dashboard
          </Button>
        </Alert>
      </Box>
    );
  }

  return (
    <>
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={snackbar.duration}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ 
          vertical: isMobile ? "top" : "bottom", 
          horizontal: isMobile ? "center" : "right" 
        }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ 
            width: "100%",
            borderRadius: 2,
            boxShadow: 3,
            color:"#fff",
            alignItems: "center",
            "& .MuiAlert-icon": {
              alignItems: "center",
            },
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Box sx={{ 
        minHeight: "100vh",
        p: { xs: 1.5, sm: 2, md: 3 },
        pb: { xs: 8, sm: 3 },
        bgcolor: isDark ? "#070b14" : "#f8fafc",
        color: isDark ? "#f8fafc" : "inherit",
      }}>
        <Container maxWidth="lg" disableGutters>
          {/* Header with Gradient Background */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 3 },
              mb: 3,
              borderRadius: 3,
              background: isDark
                ? "linear-gradient(135deg, #0b101c 0%, #1e293b 100%)"
                : `linear-gradient(135deg, ${PRIMARY} 0%, ${SECONDARY} 100%)`,
              color: "#fff",
              border: isDark ? "1px solid rgba(255,255,255,0.08)" : "none",
            }}
          >
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", sm: "center" }}
            >
              <Box display="flex" alignItems="center" gap={2}>
                <IconButton 
                  onClick={handleCancel}
                  sx={{ 
                    color: "#fff",
                    bgcolor: "rgba(255,255,255,0.2)",
                    "&:hover": { bgcolor: "rgba(255,255,255,0.3)" },
                  }}
                >
                  <ArrowBack />
                </IconButton>
                <Box>
                  <Typography
                    variant={isMobile ? "h6" : "h5"}
                    fontWeight={700}
                    gutterBottom
                  >
                    Create New Lead
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      opacity: 0.9,
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                    }}
                  >
                    Fill in the lead details below • Role: {getRoleConfig(userRole).label}
                  </Typography>
                </Box>
              </Box>
              
              {formTouched && !loading && (
                <Chip
                  label="Unsaved Changes"
                  sx={{
                    bgcolor: "rgba(255,255,255,0.2)",
                    color: "#fff",
                    border: "1px solid rgba(255,255,255,0.3)",
                    "& .MuiChip-icon": { color: "#fff" },
                  }}
                  icon={<Warning />}
                  size="small"
                />
              )}
            </Stack>
          </Paper>

          {/* Main Form */}
          <Paper 
            component="form"
            onSubmit={handleSubmit}
            elevation={0} 
            sx={{ 
              borderRadius: 3,
              p: { xs: 2.5, sm: 4, md: 5 },
              bgcolor: isDark ? "#0b101c" : "#fff",
              color: isDark ? "#f8fafc" : "#0f172a",
              border: "1px solid",
              borderColor: isDark ? "rgba(255,255,255,0.08)" : "divider",
              boxShadow: isDark ? "none" : "0 4px 20px rgba(0,0,0,0.05)",
              mb: 4,
            }}
          >
            <Fade in={true} timeout={300}>
              <Box>
                {/* Personal Information Section */}
                <Box sx={{ mb: 4 }}>
                  <Stack direction="row" alignItems="center" spacing={2} mb={3}>
                    <Avatar sx={{ bgcolor: isDark ? "rgba(96, 165, 250, 0.15)" : alpha(PRIMARY, 0.1), color: isDark ? "#60a5fa" : PRIMARY }}>
                      <Person />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight="bold" sx={{ color: isDark ? "#f8fafc" : "text.primary" }}>
                        Personal Information
                      </Typography>
                      <Typography variant="body2" sx={{ color: isDark ? "#94a3b8" : "text.secondary" }}>
                        Basic details about the lead
                      </Typography>
                    </Box>
                  </Stack>
                  
                  <Grid container spacing={isMobile ? 2 : 3}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        required
                        name="firstName"
                        label="First Name"
                        value={formData.firstName}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={!!errors.firstName}
                        helperText={errors.firstName || "Enter lead's first name"}
                        placeholder="John"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Person fontSize="small" sx={{ color: getFieldStatus("firstName").color }} />
                            </InputAdornment>
                          ),
                        }}
                        sx={textFieldStyle}
                        size={isMobile ? "small" : "medium"}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        name="lastName"
                        label="Last Name"
                        value={formData.lastName}
                        onChange={handleChange}
                        helperText="Optional"
                        placeholder="Doe"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Person fontSize="small" sx={{ color: "text.disabled" }} />
                            </InputAdornment>
                          ),
                        }}
                        sx={textFieldStyle}
                        size={isMobile ? "small" : "medium"}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        name="email"
                        label="Email Address"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        helperText="Optional"
                        placeholder="john@example.com"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Email fontSize="small" sx={{ color: "text.disabled" }} />
                            </InputAdornment>
                          ),
                        }}
                        sx={textFieldStyle}
                        size={isMobile ? "small" : "medium"}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        required
                        name="phone"
                        label="Phone Number"
                        value={formData.phone}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={!!errors.phone}
                        helperText={errors.phone || "Enter lead's phone number"}
                        placeholder="9876543210"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Phone fontSize="small" sx={{ color: getFieldStatus("phone").color }} />
                            </InputAdornment>
                          ),
                        }}
                        sx={textFieldStyle}
                        size={isMobile ? "small" : "medium"}
                      />
                    </Grid>
                  </Grid>
                </Box>

                <Divider sx={{ my: 4, borderColor: isDark ? "rgba(255,255,255,0.08)" : undefined }} />

                {/* Address Information Section */}
                <Box sx={{ mb: 4 }}>
                  <Stack direction="row" alignItems="center" spacing={2} mb={3}>
                    <Avatar sx={{ bgcolor: isDark ? "rgba(96, 165, 250, 0.15)" : alpha(PRIMARY, 0.1), color: isDark ? "#60a5fa" : PRIMARY }}>
                      <Place />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight="bold" sx={{ color: isDark ? "#f8fafc" : "text.primary" }}>
                        Address Information
                      </Typography>
                      <Typography variant="body2" sx={{ color: isDark ? "#94a3b8" : "text.secondary" }}>
                        Optional - Fill if you have address details
                      </Typography>
                    </Box>
                  </Stack>
                  
                  <Grid container spacing={isMobile ? 2 : 3}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        name="street"
                        label="Street Address"
                        value={formData.street}
                        onChange={handleChange}
                        placeholder="123 Main Street"
                        helperText="Optional"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Home fontSize="small" sx={{ color: "text.disabled" }} />
                            </InputAdornment>
                          ),
                        }}
                        sx={textFieldStyle}
                        size={isMobile ? "small" : "medium"}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        name="city"
                        label="City"
                        value={formData.city}
                        onChange={handleChange}
                        helperText="Optional"
                        placeholder="Bangalore"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <LocationOn fontSize="small" sx={{ color: "text.disabled" }} />
                            </InputAdornment>
                          ),
                        }}
                        sx={textFieldStyle}
                        size={isMobile ? "small" : "medium"}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        name="state"
                        label="State"
                        value={formData.state}
                        onChange={handleChange}
                        helperText="Optional"
                        placeholder="Karnataka"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Map fontSize="small" sx={{ color: "text.disabled" }} />
                            </InputAdornment>
                          ),
                        }}
                        sx={textFieldStyle}
                        size={isMobile ? "small" : "medium"}
                      />
                    </Grid>
                  </Grid>
                </Box>

                <Divider sx={{ my: 4, borderColor: isDark ? "rgba(255,255,255,0.08)" : undefined }} />

                {/* Additional Information Section */}
                <Box sx={{ mb: 4 }}>
                  <Stack direction="row" alignItems="center" spacing={2} mb={3}>
                    <Avatar sx={{ bgcolor: isDark ? "rgba(96, 165, 250, 0.15)" : alpha(PRIMARY, 0.1), color: isDark ? "#60a5fa" : PRIMARY }}>
                      <Tune />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight="bold" sx={{ color: isDark ? "#f8fafc" : "text.primary" }}>
                        Additional Information
                      </Typography>
                      <Typography variant="body2" sx={{ color: isDark ? "#94a3b8" : "text.secondary" }}>
                        DISCOM, plant capacity, consumer number and lead associate details
                      </Typography>
                    </Box>
                  </Stack>
                  
                  <Grid container spacing={isMobile ? 2 : 3}>
                    {/* Row 1: DISCOM Name | Consumer Number */}
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        name="discomName"
                        label="DISCOM Name"
                        value={formData.discomName}
                        onChange={handleChange}
                        placeholder="e.g. BESCOM, TPVML, Tata Power"
                        helperText="Optional - Electricity distribution company"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <ElectricBolt fontSize="small" sx={{ color: "text.disabled" }} />
                            </InputAdornment>
                          ),
                        }}
                        sx={textFieldStyle}
                        size={isMobile ? "small" : "medium"}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        name="consumerNumber"
                        label="Consumer Number"
                        value={formData.consumerNumber}
                        onChange={handleChange}
                        placeholder="CN12345"
                        helperText="Optional - Electricity consumer account number"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <BadgeIcon fontSize="small" sx={{ color: "text.disabled" }} />
                            </InputAdornment>
                          ),
                        }}
                        sx={textFieldStyle}
                        size={isMobile ? "small" : "medium"}
                      />
                    </Grid>

                    {/* Row 2: Plant Capacity (kW) | Lead Associate */}
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        name="plantCapacity"
                        label="Plant Capacity (kW)"
                        type="number"
                        inputProps={{ min: "0", step: "0.1" }}
                        value={formData.plantCapacity}
                        onChange={handleChange}
                        placeholder="e.g. 5.0"
                        helperText="Optional - Proposed solar plant capacity in kilowatts"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <SolarPower fontSize="small" sx={{ color: "text.disabled" }} />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "text.secondary", fontWeight: 700 }}>
                                kW
                              </Typography>
                            </InputAdornment>
                          ),
                        }}
                        sx={textFieldStyle}
                        size={isMobile ? "small" : "medium"}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        select
                        fullWidth
                        name="leadAssociate"
                        label="Lead Associate"
                        value={formData.leadAssociate}
                        onChange={handleChange}
                        helperText="Optional - Select associate/sales person responsible"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <AssignmentInd fontSize="small" sx={{ color: "text.disabled" }} />
                            </InputAdornment>
                          ),
                        }}
                        sx={textFieldStyle}
                        size={isMobile ? "small" : "medium"}
                      >
                        <MenuItem value="">
                          <Typography variant="body2" sx={{ color: "text.secondary", fontStyle: "italic" }}>
                            None (Unassigned)
                          </Typography>
                        </MenuItem>
                        {loadingAssociates ? (
                          <MenuItem disabled value="__loading__">
                            <CircularProgress size={16} sx={{ mr: 1 }} /> Loading associates...
                          </MenuItem>
                        ) : associates.length > 0 ? (
                          associates.map((assoc) => (
                            <MenuItem key={assoc._id} value={assoc._id}>
                              <Stack direction="row" alignItems="center" spacing={1} justifyContent="space-between" width="100%">
                                <Typography variant="body2">
                                  {getAssociateDisplayName(assoc)}
                                </Typography>
                                {assoc.role && (
                                  <Chip
                                    label={assoc.role}
                                    size="small"
                                    sx={{
                                      height: 20,
                                      fontSize: "0.65rem",
                                      fontWeight: 600,
                                      bgcolor: isDark ? "rgba(96, 165, 250, 0.15)" : alpha(PRIMARY, 0.08),
                                      color: isDark ? "#60a5fa" : PRIMARY,
                                    }}
                                  />
                                )}
                              </Stack>
                            </MenuItem>
                          ))
                        ) : (
                          <MenuItem disabled value="__none__">
                            No associates available
                          </MenuItem>
                        )}
                      </TextField>
                    </Grid>

                    {/* Notes Field */}
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        name="notes"
                        label="Notes"
                        value={formData.notes}
                        onChange={handleChange}
                        multiline
                        rows={isMobile ? 2 : 3}
                        placeholder="Add any additional notes about the lead..."
                        helperText="Optional"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start" sx={{ alignSelf: "flex-start", mt: 1 }}>
                              <Description fontSize="small" sx={{ color: "text.disabled" }} />
                            </InputAdornment>
                          ),
                        }}
                        sx={textFieldStyle}
                        size={isMobile ? "small" : "medium"}
                      />
                    </Grid>
                  </Grid>
                </Box>

                {/* Form Actions */}
                <Box sx={{ 
                  mt: 4, 
                  pt: 4, 
                  borderTop: 1, 
                  borderColor: isDark ? "rgba(255,255,255,0.08)" : "divider",
                  display: "flex", 
                  justifyContent: "space-between",
                  flexDirection: { xs: "column", sm: "row" },
                  gap: 2,
                }}>
                  <Button
                    variant="outlined"
                    onClick={handleCancel}
                    disabled={loading}
                    fullWidth={isMobile}
                    sx={{
                      ...actionButtonStyle,
                      borderColor: isDark ? "rgba(255,255,255,0.15)" : "divider",
                      color: isDark ? "#cbd5e1" : "text.secondary",
                      "&:hover": {
                        borderColor: ERROR,
                        color: ERROR,
                      },
                    }}
                  >
                    Cancel
                  </Button>

                  <Stack 
                    direction={{ xs: "column", sm: "row" }} 
                    spacing={2}
                    width={{ xs: "100%", sm: "auto" }}
                  >
                    <Button
                      type="button"
                      variant="outlined"
                      onClick={resetForm}
                      disabled={loading || !formTouched}
                      fullWidth={isMobile}
                      sx={{
                        ...actionButtonStyle,
                        borderColor: isDark ? "#60a5fa" : PRIMARY,
                        color: isDark ? "#60a5fa" : PRIMARY,
                        "&:hover": {
                          borderColor: isDark ? "#60a5fa" : PRIMARY,
                          bgcolor: isDark ? "rgba(96,165,250,0.08)" : alpha(PRIMARY, 0.04),
                        },
                      }}
                    >
                      Reset Form
                    </Button>
                    
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={loading || submitted}
                      fullWidth={isMobile}
                      startIcon={
                        loading ? (
                          <CircularProgress size={20} color="inherit" />
                        ) : submitted ? (
                          <CheckCircle />
                        ) : (
                          <Add />
                        )
                      }
                      sx={{
                        ...actionButtonStyle,
                        bgcolor: isDark ? "#3b82f6" : PRIMARY,
                        "&:hover": { bgcolor: isDark ? "#2563eb" : SECONDARY },
                      }}
                    >
                      {loading ? "Creating..." : submitted ? "Lead Created!" : "Create Lead"}
                    </Button>
                  </Stack>
                </Box>
              </Box>
            </Fade>
          </Paper>

          {/* Information Card */}
          <Card sx={{ 
            borderRadius: 3,
            p: { xs: 2, sm: 3 },
            bgcolor: isDark ? "rgba(255,255,255,0.02)" : alpha(PRIMARY, 0.03),
            border: "1px solid",
            borderColor: isDark ? "rgba(255,255,255,0.08)" : alpha(PRIMARY, 0.1),
            color: isDark ? "#f8fafc" : "inherit",
          }}>
            <Stack direction="row" spacing={2} alignItems="flex-start">
              <Avatar sx={{ bgcolor: isDark ? "rgba(96,165,250,0.15)" : alpha(PRIMARY, 0.1), color: isDark ? "#60a5fa" : PRIMARY, width: 40, height: 40 }}>
                <Info />
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ color: isDark ? "#f8fafc" : "text.primary" }} mb={0.5}>
                  Important Information
                </Typography>
                <Stack spacing={0.5}>
                  <Typography variant="body2" sx={{ color: isDark ? "#94a3b8" : "text.secondary" }}>
                    • <strong>Required Fields:</strong> Only First Name and Phone Number are mandatory.
                  </Typography>
                  <Typography variant="body2" sx={{ color: isDark ? "#94a3b8" : "text.secondary" }}>
                    • <strong>All Other Fields:</strong> Optional details can be filled now or updated later.
                  </Typography>
                  <Typography variant="body2" sx={{ color: isDark ? "#94a3b8" : "text.secondary" }}>
                    • <strong>Assignment:</strong> TEAM users are auto-assigned; admin-created leads stay unassigned until assigned manually.
                  </Typography>
                </Stack>
              </Box>
            </Stack>
          </Card>
        </Container>
      </Box>
    </>
  );
}
