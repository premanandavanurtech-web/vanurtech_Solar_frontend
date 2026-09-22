// pages/AddUserPage.jsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  FormControl,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
  Card,
  Avatar,
  Divider,
  useTheme,
  useMediaQuery,
  Fade,
  Container,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  MobileStepper,
  Slide,
  Zoom,
} from "@mui/material";
import {
  ArrowBack,
  Visibility,
  VisibilityOff,
  PersonAdd,
  Security,
  Group,
  CheckCircle,
  Email,
  Phone,
  Lock,
  Person,
  KeyboardArrowLeft,
  KeyboardArrowRight,
  Info,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

const PRIMARY_COLOR = "#3a5ac8";
const SECONDARY_COLOR = "#2c489e";

const ROLE_CONFIG = {
  Admin_panel: {
    label: "Admin panel",
    icon: <Security />,
    description: "Full system access and administration rights",
    color: "#3a5ac8",
    shortDesc: "Admin panel",
  },
  ADMIN: {
    label: "Admin panel",
    icon: <Security />,
    description: "Full system access and administration rights",
    color: "#3a5ac8",
    shortDesc: "Admin panel",
  },
  ZSM: {
    label: "Manager",
    icon: <Group />,
    description: "Manage operations and approvals",
    color: "#3a5ac8",
    shortDesc: "Manager",
  },
  MANAGER: {
    label: "Manager",
    icon: <Group />,
    description: "Manage operations and approvals",
    color: "#3a5ac8",
    shortDesc: "Manager",
  },
  SUPERVISOR: {
    label: "Supervisor",
    icon: <Group />,
    description: "Supervise incharge teams and operations",
    color: "#3a5ac8",
    shortDesc: "Supervisor",
  },
  Incharge: {
    label: "Incharge",
    icon: <Person />,
    description: "Manage local site operations and tasks",
    color: "#3a5ac8",
    shortDesc: "Incharge",
  },
};

const normalizeRole = (role) => {
  const key = String(role || "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  const map = {
    admin: "Admin_panel",
    admin_panel: "Admin_panel",
    head_office: "Admin_panel",
    headoffice: "Admin_panel",
    project_head: "ZSM",
    manager: "ZSM",
    zsm: "ZSM",
    operation_lead: "ZSM",
    supervisor: "SUPERVISOR",
    incharge: "Incharge",
  };
  return map[key] || role;
};

// Form steps for mobile stepper
const STEPS = [
  {
    label: "Personal Info",
    fields: ["firstName", "lastName", "email", "phoneNumber"],
  },
  { label: "Security", fields: ["password", "confirmPassword"] },
  { label: "Role Assignment", fields: ["role", "supervisor"] },
];

export default function AddUserPage() {
  const navigate = useNavigate();
  const { fetchAPI, user: currentUser } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));

  // State
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    role: "",
    supervisor: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [supervisors, setSupervisors] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordRuleChecks = [
    {
      key: "length",
      label: "At least 8 characters",
      valid: formData.password.length >= 8,
    },
    {
      key: "uppercase",
      label: "At least one uppercase letter",
      valid: /[A-Z]/.test(formData.password),
    },
    {
      key: "number",
      label: "At least one number",
      valid: /\d/.test(formData.password),
    },
    {
      key: "special",
      label: "At least one special character",
      valid: /[^A-Za-z0-9]/.test(formData.password),
    },
  ];

  const missingPasswordRules = passwordRuleChecks.filter((rule) => !rule.valid);
  const [activeStep, setActiveStep] = useState(0);


  const [touched, setTouched] = useState({});

  // Determine available roles based on current user's role
  const getAvailableRoles = () => {
    const currentRole = normalizeRole(currentUser?.role);
    if (currentRole === "Admin_panel") {
      return ["Admin_panel", "ZSM", "SUPERVISOR", "Incharge"];
    } else if (currentRole === "ZSM") {
      return ["SUPERVISOR", "Incharge"];
    } else if (currentRole === "SUPERVISOR") {
      return ["Incharge"];
    }
    return ["Incharge"];
  };

  const roles = getAvailableRoles();

  // Fetch supervisors for Incharge / Supervisor role
  useEffect(() => {
    if (formData.role === "Incharge" || formData.role === "SUPERVISOR") {
      fetchSupervisors();
    }
  }, [formData.role]);

  const fetchSupervisors = async () => {
    try {
      const data = await fetchAPI(`/user/getAllUsers?page=1&limit=100`);
      if (data.success) {
        let filteredSupervisors = [];
        const currentRole = normalizeRole(currentUser?.role);
        if (currentRole === "Admin_panel") {
          filteredSupervisors = data.result.users.filter((u) =>
            ["Admin_panel", "ZSM", "SUPERVISOR"].includes(normalizeRole(u.role))
          );
        } else if (currentRole === "ZSM") {
          filteredSupervisors = data.result.users.filter((u) =>
            ["ZSM", "SUPERVISOR"].includes(normalizeRole(u.role))
          );
        } else if (currentRole === "SUPERVISOR") {
          filteredSupervisors = data.result.users.filter(
            (u) => normalizeRole(u.role) === "SUPERVISOR"
          );
        } else {
          filteredSupervisors = data.result.users;
        }
        setSupervisors(filteredSupervisors);
      }
    } catch (err) {
      console.error("Error fetching supervisors:", err);
    }
  };

  const validateField = (field, value) => {
    const newErrors = { ...errors };

    switch (field) {
      case "firstName":
        if (!value?.trim()) {
          newErrors.firstName = "First name is required";
        } else {
          delete newErrors.firstName;
        }
        break;
      case "lastName":
        if (!value?.trim()) {
          newErrors.lastName = "Last name is required";
        } else {
          delete newErrors.lastName;
        }
        break;
      case "email":
        if (!value?.trim()) {
          newErrors.email = "Email is required";
        } else if (!/\S+@\S+\.\S+/.test(value)) {
          newErrors.email = "Invalid email format";
        } else {
          delete newErrors.email;
        }
        break;
      case "phoneNumber":
        if (!value?.trim()) {
          newErrors.phoneNumber = "Phone number is required";
        } else if (!/^\d{10}$/.test(value.replace(/\D/g, ""))) {
          newErrors.phoneNumber = "Must be 10 digits";
        } else {
          delete newErrors.phoneNumber;
        }
        break;
      case "password":
        if (!value) {
          newErrors.password = "Password is required";
        } else if (value.length < 8) {
          newErrors.password = "Minimum 8 characters required";
        } else if (!/(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/.test(value)) {
          newErrors.password = "Include uppercase, number, and special character";
        } else {
          delete newErrors.password;
        }
        break;
      case "confirmPassword":
        if (!value) {
          newErrors.confirmPassword = "Confirm password is required";
        } else if (formData.password !== value) {
          newErrors.confirmPassword = "Passwords do not match";
        } else {
          delete newErrors.confirmPassword;
        }
        break;
      case "role":
        if (!value) {
          newErrors.role = "Role is required";
        } else {
          delete newErrors.role;
        }
        break;
    }

    setErrors(newErrors);
    return !newErrors[field];
  };

  // Handle blur for validation
  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field, formData[field]);
  };

  // Validate form for current step
  const validateStep = (step) => {
    const fieldsToValidate = STEPS[step]?.fields || [];
    let isValid = true;

    fieldsToValidate.forEach((field) => {
      if (!validateField(field, formData[field])) {
        isValid = false;
      }
      setTouched((prev) => ({ ...prev, [field]: true }));
    });

    return isValid;
  };

  // Handle next step
  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prev) => prev + 1);
    }
  };

  // Handle back step
  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  // Validate entire form
  const validateForm = () => {
    let isValid = true;
    Object.keys(formData).forEach((field) => {
      if (field !== "supervisor") {
        // Supervisor is optional
        if (!validateField(field, formData[field])) {
          isValid = false;
        }
      }
    });
    return isValid;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setError("Please fill all required fields correctly");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        phoneNumber: formData.phoneNumber.replace(/\D/g, ""),
        password: formData.password,
        role: formData.role,
        status: "active",
      };

      // Add supervisor if TEAM role and supervisor selected
      if (formData.role === "TEAM" && formData.supervisor) {
        payload.supervisor = formData.supervisor;
      }

      const data = await fetchAPI("/user/create", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate("/user-management", {
            state: { showSnackbar: true, message: "User created successfully" },
          });
        }, 1500);
      } else {
        setError(data.message || "Failed to create user");
      }
    } catch (err) {
      setError(err.message || "An error occurred while creating user");
    } finally {
      setLoading(false);
    }
  };

  // Handle input change
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) {
      validateField(field, value);
    }
  };

  // Success State
  if (success) {
    return (
      <Zoom in={true} timeout={500}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "70vh",
            p: 3,
          }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            <Avatar
              sx={{
                width: { xs: 60, sm: 80 },
                height: { xs: 60, sm: 80 },
                bgcolor: PRIMARY_COLOR,
                color: "white",
                mb: 3,
                mx: "auto",
              }}
            >
              <CheckCircle sx={{ fontSize: { xs: 30, sm: 40 } }} />
            </Avatar>
          </motion.div>
          <Typography
            variant={isMobile ? "h6" : "h5"}
            fontWeight="bold"
            gutterBottom
          >
            User Created Successfully!
          </Typography>
          <Typography
            color="text.secondary"
            sx={{ mb: 4, textAlign: "center" }}
          >
            The new user has been added to the system.
          </Typography>
          <CircularProgress size={24} sx={{ color: PRIMARY_COLOR }} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Redirecting to user management...
          </Typography>
        </Box>
      </Zoom>
    );
  }

  return (
    <Container
      maxWidth="lg"
      sx={{
        py: { xs: 2, sm: 3, md: 4 },
        px: { xs: 1, sm: 2, md: 3 },
      }}
    >
      {/* Header */}
      <Box sx={{ mb: { xs: 2, sm: 3 }, ml: 2 }}>
        <Box display="flex" alignItems="center" gap={1.5} mb={1}>
          <IconButton
            onClick={() => navigate(-1)}
            size={isMobile ? "small" : "medium"}
            sx={{
              color: "text.secondary",
              bgcolor: "rgba(0,0,0,0.04)",
              "&:hover": { bgcolor: "rgba(0,0,0,0.08)" },
            }}
          >
            <ArrowBack fontSize={isMobile ? "small" : "medium"} />
          </IconButton>
          <Typography variant={isMobile ? "h6" : "h5"} fontWeight="bold">
            Add New User
          </Typography>
        </Box>
        <Typography
          color="text.secondary"
          sx={{
            ml: { xs: 5, sm: 6 },
            fontSize: { xs: "0.875rem", sm: "1rem" },
          }}
        >
          Fill in the details below to create a new user account
        </Typography>
      </Box>

      {/* Mobile Stepper */}
      {isMobile && (
        <MobileStepper
          variant="progress"
          steps={3}
          position="static"
          activeStep={activeStep}
          sx={{
            mb: 3,
            bgcolor: "transparent",
            "& .MuiMobileStepper-progress": {
              width: "100%",
              height: 8,
              borderRadius: 4,
            },
          }}
          nextButton={
            <Button
              size="small"
              onClick={handleNext}
              disabled={activeStep === 2}
              sx={{ color: PRIMARY_COLOR }}
            >
              Next
              <KeyboardArrowRight />
            </Button>
          }
          backButton={
            <Button
              size="small"
              onClick={handleBack}
              disabled={activeStep === 0}
              sx={{ color: PRIMARY_COLOR }}
            >
              <KeyboardArrowLeft />
              Back
            </Button>
          }
        />
      )}

      {/* Error Alert */}
      <AnimatePresence>
        {error && (
          <Slide direction="down" in={true}>
            <Alert
              severity="error"
              sx={{
                mb: 3,
                borderRadius: 2,
                fontSize: { xs: "0.875rem", sm: "1rem" },
              }}
              onClose={() => setError("")}
            >
              {error}
            </Alert>
          </Slide>
        )}
      </AnimatePresence>

      <Paper
        component="form"
        onSubmit={handleSubmit}
        elevation={0}
        sx={{
          p: { xs: 2, sm: 3, md: 4 },
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          ml: isMobile ? 2 : 6,
          bgcolor: "background.paper",
        }}
      >
        <Grid container spacing={{ xs: 2, sm: 3 }}>
          {/* Personal Information Section */}
          {(!isMobile || activeStep === 0) && (
            <Grid item xs={12}>
              <Typography
                variant="subtitle1"
                fontWeight={600}
                color={PRIMARY_COLOR}
                gutterBottom
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <Person fontSize="small" /> Personal Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
          )}

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="First Name *"
              value={formData.firstName}
              onChange={(e) => handleInputChange("firstName", e.target.value)}
              onBlur={() => handleBlur("firstName")}
              error={touched.firstName && !!errors.firstName}
              helperText={touched.firstName && errors.firstName}
              required
              size={isMobile ? "small" : "medium"}
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Last Name *"
              value={formData.lastName}
              onChange={(e) => handleInputChange("lastName", e.target.value)}
              onBlur={() => handleBlur("lastName")}
              error={touched.lastName && !!errors.lastName}
              helperText={touched.lastName && errors.lastName}
              required
              size={isMobile ? "small" : "medium"}
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Email Address *"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              onBlur={() => handleBlur("email")}
              error={touched.email && !!errors.email}
              helperText={touched.email && errors.email}
              required
              size={isMobile ? "small" : "medium"}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email
                      color="action"
                      sx={{ fontSize: { xs: 18, sm: 20 } }}
                    />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Phone Number *"
              value={formData.phoneNumber}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                handleInputChange("phoneNumber", value);
              }}
              onBlur={() => handleBlur("phoneNumber")}
              error={touched.phoneNumber && !!errors.phoneNumber}
              helperText={touched.phoneNumber && errors.phoneNumber}
              required
              size={isMobile ? "small" : "medium"}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Phone
                      color="action"
                      sx={{ fontSize: { xs: 18, sm: 20 } }}
                    />
                  </InputAdornment>
                ),
                inputProps: { maxLength: 10 },
              }}
            />
          </Grid>

          {/* Security Section */}
          {(!isMobile || activeStep === 1) && (
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Typography
                variant="subtitle1"
                fontWeight={600}
                color={PRIMARY_COLOR}
                gutterBottom
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <Lock fontSize="small" /> Security
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
          )}

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Password *"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              onBlur={() => handleBlur("password")}
              error={touched.password && !!errors.password}
              helperText={touched.password && errors.password}
              required
              size={isMobile ? "small" : "medium"}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock
                      color="action"
                      sx={{ fontSize: { xs: 18, sm: 20 } }}
                    />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      size="small"
                    >
                      {showPassword ? (
                        <VisibilityOff fontSize="small" />
                      ) : (
                        <Visibility fontSize="small" />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            {(formData.password || touched.password) && missingPasswordRules.length > 0 && (
              <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 0.5 }}>
                {missingPasswordRules.map((rule) => (
                  <Typography
                    key={rule.key}
                    variant="caption"
                    sx={{
                      color: "#d32f2f",
                      display: "flex",
                      alignItems: "center",
                      gap: 0.75,
                      fontSize: { xs: "0.72rem", sm: "0.78rem" },
                    }}
                  >
                    <Box
                      component="span"
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        bgcolor: "#d32f2f",
                        flexShrink: 0,
                      }}
                    />
                    {rule.label}
                  </Typography>
                ))}
              </Box>
            )}
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Confirm Password *"
              type={showConfirmPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={(e) =>
                handleInputChange("confirmPassword", e.target.value)
              }
              onBlur={() => handleBlur("confirmPassword")}
              error={touched.confirmPassword && !!errors.confirmPassword}
              helperText={touched.confirmPassword && errors.confirmPassword}
              required
              size={isMobile ? "small" : "medium"}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock
                      color="action"
                      sx={{ fontSize: { xs: 18, sm: 20 } }}
                    />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      edge="end"
                      size="small"
                    >
                      {showConfirmPassword ? (
                        <VisibilityOff fontSize="small" />
                      ) : (
                        <Visibility fontSize="small" />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          {/* Role Selection Section */}
          {(!isMobile || activeStep === 2) && (
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Typography
                variant="subtitle1"
                fontWeight={600}
                color={PRIMARY_COLOR}
                gutterBottom
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <Security fontSize="small" /> Role Assignment
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {errors.role && touched.role && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                  {errors.role}
                </Alert>
              )}

              <Grid container spacing={2}>
                {roles.map((role) => {
                  const config = ROLE_CONFIG[role];
                  return (
                    <Grid item xs={12} sm={6} key={role}>
                      <Card
                        onClick={() =>
                          !loading && handleInputChange("role", role)
                        }
                        sx={{
                          p: { xs: 1.5, sm: 2 },
                          borderRadius: 2,
                          cursor: loading ? "default" : "pointer",
                          border:
                            formData.role === role
                              ? `2px solid ${config.color}`
                              : "1px solid",
                          borderColor:
                            formData.role === role ? config.color : "divider",
                          bgcolor:
                            formData.role === role
                              ? `${config.color}10`
                              : "background.paper",
                          transition: "all 0.2s",
                          opacity: loading ? 0.7 : 1,
                          "&:hover": loading
                            ? {}
                            : {
                                borderColor: config.color,
                                bgcolor: `${config.color}08`,
                              },
                        }}
                      >
                        <Box display="flex" alignItems="center" gap={1.5}>
                          <Avatar
                            sx={{
                              bgcolor:
                                formData.role === role
                                  ? config.color
                                  : "action.disabledBackground",
                              width: { xs: 36, sm: 40 },
                              height: { xs: 36, sm: 40 },
                            }}
                          >
                            {React.cloneElement(config.icon, {
                              sx: { fontSize: { xs: 18, sm: 20 } },
                            })}
                          </Avatar>
                          <Box flex={1}>
                            <Typography
                              fontWeight={600}
                              fontSize={{ xs: "0.9rem", sm: "1rem" }}
                            >
                              {isMobile ? config.shortDesc : config.label}
                            </Typography>
                            {!isMobile && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {config.description}
                              </Typography>
                            )}
                          </Box>
                          {formData.role === role && (
                            <CheckCircle
                              sx={{
                                color: config.color,
                                fontSize: { xs: 18, sm: 20 },
                              }}
                            />
                          )}
                        </Box>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </Grid>
          )}

          {/* Supervisor Selection for Incharge / Supervisor */}
          {(formData.role === "Incharge" || formData.role === "SUPERVISOR") && (!isMobile || activeStep === 2) && (
            <Grid item xs={12}>
              <Typography
                variant="subtitle1"
                fontWeight={600}
                color={PRIMARY_COLOR}
                gutterBottom
                sx={{ mt: 2 }}
              >
                Assign Supervisor (Optional)
              </Typography>
              <FormControl fullWidth size={isMobile ? "small" : "medium"}>
                <Select
                  value={formData.supervisor}
                  onChange={(e) =>
                    handleInputChange("supervisor", e.target.value)
                  }
                  displayEmpty
                  disabled={loading}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="">
                    <em>Select a supervisor (Optional)</em>
                  </MenuItem>
                  {supervisors.map((supervisor) => (
                    <MenuItem key={supervisor._id} value={supervisor._id}>
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <Avatar
                          sx={{
                            width: { xs: 28, sm: 32 },
                            height: { xs: 28, sm: 32 },
                            bgcolor:
                              ROLE_CONFIG[supervisor.role]?.color ||
                              PRIMARY_COLOR,
                            fontSize: { xs: "0.8rem", sm: "0.9rem" },
                          }}
                        >
                          {supervisor.firstName?.[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="body2">
                            {supervisor.firstName} {supervisor.lastName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {ROLE_CONFIG[supervisor.role]?.label ||
                              supervisor.role}
                          </Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 1, display: "block" }}
              >
                Users can be assigned to supervisors for better management
              </Typography>
            </Grid>
          )}

          {/* Hierarchy Info */}
          {currentUser && (
            <Grid item xs={12}>
              <Alert
                severity="info"
                sx={{
                  borderRadius: 2,
                  mt: 2,
                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                }}
                icon={<Info fontSize="small" />}
              >
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Role Hierarchy
                </Typography>
                <Typography variant="body2">
                  {normalizeRole(currentUser.role) === "Admin_panel" &&
                    "Admin panel -> Manager -> Supervisor -> Incharge"}
                  {normalizeRole(currentUser.role) === "ZSM" &&
                    "Manager -> Supervisor -> Incharge"}
                  {normalizeRole(currentUser.role) === "SUPERVISOR" &&
                    "Supervisor -> Incharge"}
                  {normalizeRole(currentUser.role) === "Incharge" &&
                    "Incharge"}
                </Typography>
              </Alert>
            </Grid>
          )}

          {/* Action Buttons */}
          {(!isMobile || activeStep === 2) && (
            <Grid item xs={12} sx={{ mt: { xs: 2, sm: 4 } }}>
              <Box
                display="flex"
                gap={2}
                justifyContent={{ xs: "space-between", sm: "flex-end" }}
                flexDirection={{ xs: "column", sm: "row" }}
              >
                {isMobile && activeStep === 2 && (
                  <Button
                    onClick={handleBack}
                    variant="outlined"
                    disabled={loading}
                    fullWidth
                    sx={{
                      borderRadius: 2,
                      borderColor: PRIMARY_COLOR,
                      color: PRIMARY_COLOR,
                      order: { xs: 2, sm: 1 },
                    }}
                  >
                    Back
                  </Button>
                )}
                <Button
                  onClick={() => navigate(-1)}
                  variant="outlined"
                  disabled={loading}
                  fullWidth={isMobile}
                  sx={{
                    borderRadius: 2,
                    minWidth: { xs: "auto", sm: 100 },
                    borderColor: PRIMARY_COLOR,
                    color: PRIMARY_COLOR,
                    order: { xs: 2, sm: 1 },
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  startIcon={
                    loading ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <PersonAdd fontSize={isMobile ? "small" : "medium"} />
                    )
                  }
                  fullWidth={isMobile}
                  sx={{
                    bgcolor: PRIMARY_COLOR,
                    color: "white",
                    borderRadius: 2,
                    minWidth: { xs: "auto", sm: 150 },
                    order: { xs: 1, sm: 2 },
                    "&:hover": { bgcolor: SECONDARY_COLOR },
                    "&.Mui-disabled": {
                      bgcolor: "action.disabledBackground",
                    },
                  }}
                >
                  {loading
                    ? "Creating..."
                    : isMobile
                      ? "Create"
                      : "Create User"}
                </Button>
              </Box>
            </Grid>
          )}
        </Grid>

        {/* Step Indicators for Mobile */}
        {isMobile && (
          <Box
            sx={{ display: "flex", justifyContent: "center", mt: 3, gap: 1 }}
          >
            {[0, 1, 2].map((step) => (
              <Box
                key={step}
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  bgcolor: step === activeStep ? PRIMARY_COLOR : "divider",
                  transition: "all 0.2s",
                  cursor: "pointer",
                  "&:hover": {
                    bgcolor:
                      step === activeStep ? PRIMARY_COLOR : "action.hover",
                  },
                }}
                onClick={() => setActiveStep(step)}
              />
            ))}
          </Box>
        )}
      </Paper>
    </Container>
  );
}
