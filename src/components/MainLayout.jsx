// layouts/MainLayout.jsx
import React, { useState, useEffect } from "react";
import {
  Box,
  useTheme,
  useMediaQuery,
  Fab,
  Tooltip,
  Typography,
  Button,
  Dialog,
  DialogContent,
  DialogActions,
  Stack,
} from "@mui/material";
import { Menu as MenuIcon, Timer as TimerIcon, LockOutlined, Refresh as RefreshIcon } from "@mui/icons-material";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { useAuth } from "../contexts/AuthContext";
import axiosInstance from "../utils/axiosConfig";
import '../MainLayout.css';

const MainLayout = ({ children }) => {
  const theme = useTheme();
  const { user, updateLocalUser } = useAuth();
  const userRole = String(user?.role || "").trim().toUpperCase().replace(/[\s-]+/g, "_");
  const isSuperAdmin = ["SUPER_ADMIN", "SUPERADMIN"].includes(userRole);

  const [remainingMs, setRemainingMs] = useState(null);
  const [validityWarnOpen, setValidityWarnOpen] = useState(false);
  const [forceExpired, setForceExpired] = useState(false);
  const [forceDeactivated, setForceDeactivated] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(false);

  const syncProfileValidity = React.useCallback(async () => {
    if (isSuperAdmin || !user?._id) return;
    try {
      setCheckingAccess(true);
      const res = await axiosInstance.get("/user/profile");
      const profile = res.data?.result || res.data?.data || res.data?.user;
      if (profile && typeof updateLocalUser === "function") {
        updateLocalUser({
          subscriptionExpiresAt: profile.subscriptionExpiresAt ?? null,
          isExpired: Boolean(profile.isExpired),
          companyStatus: profile.companyStatus || "active",
          isDeactivated: Boolean(profile.isDeactivated),
        });
        setForceExpired(Boolean(profile.isExpired));
        setForceDeactivated(Boolean(profile.isDeactivated));
      }
    } catch (err) {
      if (err?.response?.status === 403) {
        const msg = String(err?.response?.data?.message || "").toLowerCase();
        if (msg.includes("deactivated")) {
          setForceDeactivated(true);
        } else {
          setForceExpired(true);
        }
      }
    } finally {
      setCheckingAccess(false);
    }
  }, [isSuperAdmin, user?._id, updateLocalUser]);

  useEffect(() => {
    syncProfileValidity();
  }, [syncProfileValidity]);

  useEffect(() => {
    if (isSuperAdmin) return;
    const handleAccessBlocked = (e) => {
      const reason = e?.detail?.reason;
      if (reason === "deactivated") setForceDeactivated(true);
      else if (reason === "expired") setForceExpired(true);
    };
    window.addEventListener("orgAccessBlocked", handleAccessBlocked);
    return () => window.removeEventListener("orgAccessBlocked", handleAccessBlocked);
  }, [isSuperAdmin]);

  useEffect(() => {
    if (isSuperAdmin || !user?.subscriptionExpiresAt) {
      setRemainingMs(null);
      return;
    }
    const expiryTime = new Date(user.subscriptionExpiresAt).getTime();
    if (Number.isNaN(expiryTime)) {
      setRemainingMs(null);
      return;
    }
    const updateRemaining = () => {
      setRemainingMs(Math.max(0, expiryTime - Date.now()));
    };
    updateRemaining();
    const timer = setInterval(updateRemaining, 1000);
    return () => clearInterval(timer);
  }, [isSuperAdmin, user?.subscriptionExpiresAt]);

  const isDeactivated = !isSuperAdmin && (
    forceDeactivated ||
    user?.isDeactivated === true ||
    user?.companyStatus === "inactive"
  );

  const isExpired = !isSuperAdmin && (
    forceExpired ||
    user?.isExpired === true ||
    (user?.subscriptionExpiresAt && (remainingMs !== null ? remainingMs <= 0 : new Date() > new Date(user.subscriptionExpiresAt)))
  );

  const isAccessBlocked = isDeactivated || isExpired;

  const isExpiringWithin48Hours =
    !isSuperAdmin &&
    !isExpired &&
    remainingMs !== null &&
    remainingMs > 0 &&
    remainingMs <= 48 * 60 * 60 * 1000;

  useEffect(() => {
    if (!isExpiringWithin48Hours || !user?._id) return;
    const dismissKey = `validity_warn_dismissed_${user._id}_${user.subscriptionExpiresAt}`;
    if (!sessionStorage.getItem(dismissKey)) {
      setValidityWarnOpen(true);
    }
  }, [isExpiringWithin48Hours, user?._id, user?.subscriptionExpiresAt]);

  useEffect(() => {
    const handleOpenWarn = () => {
      if (isExpiringWithin48Hours) setValidityWarnOpen(true);
    };
    window.addEventListener("openValidityWarningPopup", handleOpenWarn);
    return () => window.removeEventListener("openValidityWarningPopup", handleOpenWarn);
  }, [isExpiringWithin48Hours]);

  const handleCloseValidityWarn = () => {
    setValidityWarnOpen(false);
    if (user?._id && user?.subscriptionExpiresAt) {
      try {
        sessionStorage.setItem(
          `validity_warn_dismissed_${user._id}_${user.subscriptionExpiresAt}`,
          "1"
        );
      } catch {}
    }
  };

  const formatTimerParts = (ms) => {
    const totalSeconds = Math.max(0, Math.floor((ms || 0) / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return {
      hh: String(hours).padStart(2, "0"),
      mm: String(minutes).padStart(2, "0"),
      ss: String(seconds).padStart(2, "0"),
      daysLabel: hours >= 24 ? `${Math.ceil(hours / 24)} day${Math.ceil(hours / 24) > 1 ? "s" : ""}` : `${hours} hour${hours !== 1 ? "s" : ""}`,
    };
  };

  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));
  const [drawerOpen, setDrawerOpen] = useState(() => {
    if (typeof window === "undefined") return true;
    try {
      const saved = localStorage.getItem("sidebarCollapsed");
      return saved !== null ? !JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarWidth = 268;
  const collapsedWidth = 68;

  // Handle responsive behavior
  useEffect(() => {
    if (isMobile) {
      setMobileOpen(false);
    }
  }, [isMobile]);

  const toggleDrawer = () => {
    if (isMobile) {
      setMobileOpen((prev) => !prev);
    } else {
      setDrawerOpen((prev) => {
        const next = !prev;
        try {
          localStorage.setItem("sidebarCollapsed", JSON.stringify(!next));
        } catch {}
        return next;
      });
    }
  };

  const handleDrawerClose = () => {
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  // Calculate width based on device and drawer state
  const getContentWidth = () => {
    if (isSuperAdmin || isMobile) return "100%";
    if (isTablet) {
      return drawerOpen ? `calc(100% - ${sidebarWidth}px)` : `calc(100% - ${collapsedWidth}px)`;
    }
    return drawerOpen ? `calc(100% - ${sidebarWidth}px)` : `calc(100% - ${collapsedWidth}px)`;
  };

  const isDark = theme.palette.mode === "dark";

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        bgcolor: isDark ? "#050811" : "#f8f9fa",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Topbar Component */}
      <Topbar 
        toggleDrawer={toggleDrawer} 
        isMobile={isMobile} 
        isTablet={isTablet}
        drawerOpen={isMobile ? mobileOpen : drawerOpen}
        sidebarWidth={sidebarWidth}
        collapsedWidth={collapsedWidth}
        noSidebar={isSuperAdmin}
      />
      
      {/* Sidebar Component - completely removed for Super Admin */}
      {!isSuperAdmin && (
        <Sidebar
          open={isMobile ? mobileOpen : drawerOpen}
          toggleDrawer={toggleDrawer}
          onClose={handleDrawerClose}
          isMobile={isMobile}
          isTablet={isTablet}
        />
      )}

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minHeight: "100vh",
          transition: theme.transitions.create(["width"], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          marginLeft: 0,
          width: getContentWidth(),
          pt: {
            xs: "56px", // Mobile topbar height
            sm: "64px", // Tablet/Desktop topbar height
          },
          position: "relative",
          overflowY: "auto",
          overflowX: "hidden",
          height: "100vh",
          bgcolor: isDark ? "#050811" : "#f8f9fa",
          display: "flex",
          justifyContent: isSuperAdmin ? "center" : "flex-start",
        }}
      >
        {/* Content Wrapper */}
        <Box
          className="main-content-wrapper"
          sx={{
            width: "100%",
            maxWidth: isSuperAdmin ? "100%" : {
              xs: "100%",
              sm: "100%",
              md: "calc(100% - 32px)",
              lg: "1400px",
              xl: "1600px",
            },
            margin: isSuperAdmin ? "0 auto" : 0,
            px: {
              xs: 1,
              sm: 2,
              md: 3,
              lg: 4,
            },
            py: {
              xs: 1,
              sm: 2,
              md: 3,
            },
            boxSizing: "border-box",
          }}
        >
          {isAccessBlocked ? null : children}
        </Box>
      </Box>

      {/* Non-Dismissible Blocked Access Popup (Deactivated or Validity Expired) */}
      {isAccessBlocked && (
        <Dialog
          open={true}
          disableEscapeKeyDown
          onClose={() => {}}
          maxWidth="sm"
          fullWidth
          slotProps={{
            backdrop: {
              sx: {
                backdropFilter: "blur(10px)",
                backgroundColor: "rgba(4, 8, 18, 0.85)",
              },
            },
          }}
          PaperProps={{
            sx: {
              borderRadius: "24px",
              bgcolor: isDark ? "#0d1527" : "#ffffff",
              border: "2px solid #ef4444",
              boxShadow: "0 28px 70px rgba(239, 68, 68, 0.35)",
              overflow: "hidden",
            },
          }}
        >
          <Box sx={{ height: 5, bgcolor: "#ef4444" }} />
          <DialogContent sx={{ p: { xs: 3, sm: 4.5 }, textAlign: "center" }}>
            <Box
              sx={{
                width: 74,
                height: 74,
                borderRadius: "50%",
                bgcolor: "rgba(239, 68, 68, 0.12)",
                border: "1.5px solid rgba(239, 68, 68, 0.35)",
                color: "#ef4444",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 2,
              }}
            >
              <LockOutlined sx={{ fontSize: 38 }} />
            </Box>

            <Typography
              sx={{
                display: "inline-block",
                px: 1.5,
                py: 0.4,
                borderRadius: "999px",
                bgcolor: "rgba(239, 68, 68, 0.12)",
                color: "#ef4444",
                fontSize: "0.7rem",
                fontWeight: 800,
                letterSpacing: "0.08em",
                mb: 1.5,
              }}
            >
              {isDeactivated ? "ACCOUNT DEACTIVATED" : "ACCESS SUSPENDED"}
            </Typography>

            <Typography variant="h5" fontWeight={900} sx={{ color: isDark ? "#f8fafc" : "#0f172a", mb: 1.2 }}>
              {isDeactivated
                ? "Your Organization Account Has Been Deactivated"
                : "Your Organization Validity Has Ended"}
            </Typography>

            <Typography sx={{ color: isDark ? "#94a3b8" : "#475569", fontSize: "0.92rem", lineHeight: 1.65, mb: 2.5 }}>
              {isDeactivated
                ? "Your organization's access has been turned off by the Super Admin. All administrative and team workspace modules are currently disabled."
                : "Your workspace subscription period has expired, and access to all administrative and operational modules has been temporarily locked."}
            </Typography>

            <Box
              sx={{
                p: 1.8,
                borderRadius: "14px",
                bgcolor: isDark ? "rgba(239, 68, 68, 0.08)" : "#fef2f2",
                border: "1px solid rgba(239, 68, 68, 0.25)",
                mb: 3,
              }}
            >
              <Typography sx={{ color: isDark ? "#fca5a5" : "#b91c1c", fontSize: "0.86rem", fontWeight: 700 }}>
                {isDeactivated
                  ? "Please contact the Super Admin to reactivate your account and restore access."
                  : "Please contact the Super Admin to extend your validity and restore access."}
              </Typography>
            </Box>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="center">
              <Button
                variant="outlined"
                onClick={syncProfileValidity}
                disabled={checkingAccess}
                startIcon={<RefreshIcon />}
                sx={{
                  borderRadius: "12px",
                  px: 3,
                  py: 1.15,
                  fontWeight: 700,
                  textTransform: "none",
                  borderColor: isDark ? "rgba(148, 163, 184, 0.35)" : "#cbd5e1",
                  color: isDark ? "#e2e8f0" : "#0f172a",
                }}
              >
                {checkingAccess ? "Checking..." : "Check Access Status"}
              </Button>
              <Button
                variant="contained"
                onClick={() => {
                  localStorage.clear();
                  window.location.href = "/login";
                }}
                sx={{
                  borderRadius: "12px",
                  px: 3.5,
                  py: 1.15,
                  fontWeight: 800,
                  textTransform: "none",
                  bgcolor: "#ef4444",
                  boxShadow: "0 8px 20px -4px rgba(239, 68, 68, 0.5)",
                  "&:hover": { bgcolor: "#dc2626" },
                }}
              >
                Sign Out
              </Button>
            </Stack>
          </DialogContent>
        </Dialog>
      )}

      {/* Mobile FAB for quick navigation when drawer is closed */}
      {isMobile && !mobileOpen && !isSuperAdmin && (
        <Tooltip title="Open Menu" arrow>
          <Fab
            color="primary"
            aria-label="menu"
            onClick={toggleDrawer}
            sx={{
              position: "fixed",
              bottom: 80,
              right: 16,
              zIndex: 1100,
              display: { xs: "flex", sm: "none" },
              bgcolor: "#0f1f3d",
              "&:hover": {
                bgcolor: "#3a5ac8",
              },
              boxShadow: "0 4px 12px rgba(69, 105, 234, 0.3)",
            }}
          >
            <MenuIcon />
          </Fab>
        </Tooltip>
      )}

      {/* 48-Hour Validity Expiry Warning Popup */}
      {isExpiringWithin48Hours && (
        <Dialog
          open={validityWarnOpen}
          onClose={handleCloseValidityWarn}
          maxWidth="xs"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: "22px",
              bgcolor: isDark ? "#0d1527" : "#ffffff",
              border: "2px solid #ef4444",
              boxShadow: "0 24px 60px rgba(239, 68, 68, 0.28)",
              overflow: "hidden",
            },
          }}
        >
          <DialogContent sx={{ p: 3.5, textAlign: "center" }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                bgcolor: "rgba(239, 68, 68, 0.12)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                color: "#ef4444",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 2,
              }}
            >
              <TimerIcon sx={{ fontSize: 34 }} />
            </Box>

            <Typography variant="h6" fontWeight={800} sx={{ color: isDark ? "#f8fafc" : "#0f172a", mb: 1 }}>
              Validity Expiring in {formatTimerParts(remainingMs).daysLabel}
            </Typography>

            <Typography sx={{ color: isDark ? "#cbd5e1" : "#475569", fontSize: "0.88rem", lineHeight: 1.55, mb: 2.5 }}>
              Your organization&apos;s access validity will end on{" "}
              <strong style={{ color: isDark ? "#f8fafc" : "#0f172a" }}>
                {new Date(user.subscriptionExpiresAt).toLocaleString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </strong>
              . Please contact your company administrator to renew access.
            </Typography>

            {/* Live Red 48-Hour Countdown Box */}
            <Stack
              direction="row"
              spacing={1.2}
              justifyContent="center"
              alignItems="center"
              sx={{
                py: 1.4,
                px: 2,
                borderRadius: "14px",
                bgcolor: isDark ? "rgba(239, 68, 68, 0.14)" : "#fef2f2",
                border: "1px solid rgba(239, 68, 68, 0.35)",
              }}
            >
              {[
                { val: formatTimerParts(remainingMs).hh, unit: "HRS" },
                { val: formatTimerParts(remainingMs).mm, unit: "MIN" },
                { val: formatTimerParts(remainingMs).ss, unit: "SEC" },
              ].map((part, idx) => (
                <React.Fragment key={part.unit}>
                  {idx > 0 && (
                    <Typography sx={{ fontWeight: 900, fontSize: "1.25rem", color: "#ef4444" }}>:</Typography>
                  )}
                  <Box sx={{ minWidth: 50 }}>
                    <Typography
                      sx={{
                        fontSize: "1.35rem",
                        fontWeight: 900,
                        color: "#ef4444",
                        fontVariantNumeric: "tabular-nums",
                        lineHeight: 1.1,
                      }}
                    >
                      {part.val}
                    </Typography>
                    <Typography sx={{ fontSize: "0.62rem", fontWeight: 800, color: isDark ? "#fca5a5" : "#b91c1c" }}>
                      {part.unit}
                    </Typography>
                  </Box>
                </React.Fragment>
              ))}
            </Stack>
          </DialogContent>

          <DialogActions sx={{ px: 3.5, pb: 3, pt: 0, justifyContent: "center" }}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleCloseValidityWarn}
              sx={{
                borderRadius: "12px",
                py: 1.1,
                fontWeight: 800,
                textTransform: "none",
                bgcolor: "#ef4444",
                "&:hover": { bgcolor: "#dc2626" },
              }}
            >
              I Understand
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Overlay for mobile when drawer is open */}
      {isMobile && mobileOpen && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1199,
            backgroundColor: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
            transition: "all 0.3s ease",
            animation: "fadeIn 0.3s ease",
            "@keyframes fadeIn": {
              from: { opacity: 0 },
              to: { opacity: 1 },
            },
          }}
          onClick={handleDrawerClose}
        />
      )}
    </Box>
  );
};

export default MainLayout;
