import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Drawer,
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Typography,
  Divider,
  IconButton,
  Tooltip,
  SwipeableDrawer,
  Avatar,
  useTheme,
  useMediaQuery,
  Badge,
  AppBar,
  Toolbar,
} from "@mui/material";
import {
  Dashboard,
  Groups,
  TaskAlt,
  Warning,
  CloudUpload,
  CalendarMonth,
  FilterAlt,
  Paid,
  AdminPanelSettings,
  Insights,
  AccountTree,
  Notifications,
  Logout,
  EventBusy,
  Celebration,
  ChevronLeft,
  ChevronRight,
  ExpandMore,
  CategoryOutlined,
  Inventory2Outlined,
  OutboxOutlined,
  MoveToInboxOutlined,
  Menu as MenuIcon,
  Close as CloseIcon,
  RequestQuote,
  Settings as SettingsIcon,
  ReceiptLong,
  AccountBalance,
  AccountBalanceWallet,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import ViewInAr from "@mui/icons-material/ViewInAr";
import { useAuth } from "../contexts/AuthContext";
import sidebarLogoLight from "../assets/sidebar-logo-light.webp";
import sidebarLogoDark from "../assets/sidebar-logo-dark.webp";

// ─── Design Tokens ─────────────────────────────────────────────────────────────
const BLUE = "#1e40af";
const BLUE_LIGHT = "#3b82f6";
const BLUE_GRADIENT = "linear-gradient(135deg, rgba(30,64,175,0.15) 0%, rgba(59,130,246,0.05) 100%)";
const DARK_BLUE_GRADIENT = "linear-gradient(135deg, rgba(37,99,235,0.25) 0%, rgba(30,64,175,0.1) 100%)";

const normalizeRole = (role) => {
  const value = String(role || "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  const map = {
    head_office: "ADMIN",
    admin_panel: "ADMIN",
    admin: "ADMIN",
    super_admin: "ADMIN",
    zsm: "PROJECT_HEAD",
    project_head: "PROJECT_HEAD",
    manager: "MANAGER",
    incharge: "SUPERVISOR",
    supervisor: "SUPERVISOR",
    team: "INSTALLER",
    installer: "INSTALLER",
  };
  return map[value] || role;
};

const TEAM_ATTENDANCE_ROLES = ["ADMIN", "PROJECT_HEAD", "MANAGER", "SUPERVISOR"];

// ─── Width Constants ──────────────────────────────────────────────────────────
const SIDEBAR_WIDTH    = 268;
const COLLAPSED_WIDTH  = 68;
const MOBILE_WIDTH     = 272;

// ─── Sidebar Component ────────────────────────────────────────────────────────
const Sidebar = ({ open, toggleDrawer, onClose }) => {
  const theme    = useTheme();
  const isDark   = theme.palette.mode === "dark";

  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));
  const navigate = useNavigate();
  const location = useLocation();

  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    const saved = localStorage.getItem("sidebarCollapsed");
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    if (!isMobile && !isTablet)
      localStorage.setItem("sidebarCollapsed", JSON.stringify(isCollapsed));
  }, [isCollapsed, isMobile, isTablet]);

  const effectiveCollapsed =
    !isMobile && (!open || (!isTablet && isCollapsed));
  const { user } = useAuth();
  const userRole = normalizeRole(user?.role);

  // Dynamic colors based on light vs dark theme
  const sidebarBg = isDark ? "#060b13" : "#ffffff";
  const borderCol = isDark ? "rgba(255,255,255,0.07)" : "rgba(30,64,175,0.12)";
  const textPri   = isDark ? "#f1f5f9" : "#1f2937";
  const textSec   = isDark ? "#94a3b8" : "#6b7280";
  const activeBg  = isDark ? "#132238" : "rgba(30,64,175,0.1)";
  const activeBdr = isDark ? "1.5px solid #3b82f6" : "1.5px solid rgba(30,64,175,0.3)";
  const activeIcon= isDark ? "#60a5fa" : BLUE;
  const sectionBg = isDark ? "rgba(255,255,255,0.04)" : "rgba(30,64,175,0.08)";

  // ── Menu items ─────────────────────────────────────────────────────────────
  const menuItems = useMemo(
    () => [
      { text: "Dashboard",       icon: <Dashboard />,         path: "/dashboard",              roles: ["Admin_panel","ZSM","Incharge","TEAM"] },
      { text: "Lead Funnel",     icon: <AccountTree />,       path: "/lead-funnel",            roles: ["Admin_panel","ZSM","Incharge","TEAM"] },
      { text: "All Leads",       icon: <FilterAlt />,         path: "/all-leads",              roles: ["Admin_panel","ZSM","Incharge","TEAM"] },
      { text: "Projects",        icon: <TaskAlt />,           path: "/projects",               roles: ["Admin_panel","ZSM","Incharge","TEAM"] },
      { text: "Total Visits",    icon: <Groups />,            path: "/total-visits",           roles: ["Admin_panel","ZSM","Incharge","TEAM"] },
      { text: "3D Design",       icon: <ViewInAr />,          path: "/3d-design",              roles: ["Admin_panel","ZSM","Incharge","TEAM"] },
      { text: "Inventory In",     icon: <MoveToInboxOutlined />, path: "/inventory/items",        roles: ["Admin_panel","ZSM","Incharge","TEAM","ADMIN","PROJECT_HEAD","MANAGER","SUPERVISOR","INSTALLER"] },
      { text: "Inventory Out",    icon: <OutboxOutlined />,    path: "/inventory/out",          roles: ["Admin_panel","ZSM","Incharge","TEAM","ADMIN","PROJECT_HEAD","MANAGER","SUPERVISOR","INSTALLER"] },
      { text: "Add Quotation",   icon: <RequestQuote />,      path: "/quotation/create",       roles: ["Admin_panel","ZSM","Incharge","TEAM"] },
      { text: "All Quotes",      icon: <RequestQuote />,      path: "/all-quotes",             roles: ["Admin_panel","ZSM","Incharge","TEAM"] },
      { text: "Missed Leads",    icon: <Warning />,           path: "/missed-leads",           roles: ["Admin_panel","ZSM","Incharge","TEAM"] },
      {
        text: TEAM_ATTENDANCE_ROLES.includes(userRole) ? "Team Attendance" : "My Attendance",
        icon: <CalendarMonth />,
        path: TEAM_ATTENDANCE_ROLES.includes(userRole) ? "/team-attendance" : "/attendance",
        roles: ["Admin_panel","ZSM","Incharge","TEAM"],
      },
      { text: "Leave",              icon: <EventBusy />,          path: "/leave-management",   roles: ["Admin_panel","ZSM","Incharge","TEAM"] },
      { text: "Leave Types",        icon: <Inventory2Outlined />, path: "/leave-types",        roles: ["Admin_panel","ZSM","Incharge","TEAM"] },
      { text: "Holiday Management", icon: <Celebration />,        path: "/holiday-management", roles: ["Admin_panel","ZSM","Incharge","TEAM"] },
      { text: "Payroll",            icon: <Paid />,               path: "/payroll",            roles: ["Admin_panel","ZSM","Incharge","TEAM","ADMIN","PROJECT_HEAD","MANAGER","SUPERVISOR","INSTALLER"] },
      { text: "Salary Structure",   icon: <ReceiptLong />,        path: "/payroll/salaries",   roles: ["Admin_panel","ZSM","Incharge","TEAM","ADMIN","PROJECT_HEAD","MANAGER","SUPERVISOR","INSTALLER"] },
      { text: "Salary Slips",       icon: <AccountBalanceWallet />,path: "/payroll/payslips",   roles: ["Admin_panel","ZSM","Incharge","TEAM","ADMIN","PROJECT_HEAD","MANAGER","SUPERVISOR","INSTALLER"] },
      { text: "Employees",          icon: <AdminPanelSettings />, path: "/user-management",    roles: ["Admin_panel","ZSM","Incharge"] },
      {
        text: "Location Visit",
        icon: <LocationOnIcon />,
        path: userRole === "INSTALLER" ? "/add-visit" : "/team-tracking",
        roles: ["Admin_panel","ZSM","Incharge","TEAM"],
      },
      { text: "Expense",       icon: <Paid />,              path: "/expense",          roles: ["Admin_panel","ZSM","Incharge","TEAM"] },
      { text: "Import Leads",  icon: <CloudUpload />,       path: "/import-leads",     roles: ["Admin_panel","ZSM"] },
      { text: "Reports",       icon: <Insights />,          path: "/reports",          roles: ["Admin_panel","ZSM","Incharge"] },
      { text: "Installer Work Register", icon: <Insights />, path: "/work-register", roles: ["ADMIN","PROJECT_HEAD","MANAGER","SUPERVISOR","Admin_panel","ZSM","Incharge"] },
      { text: "Notifications", icon: <Notifications />,     path: "/notifications",    roles: ["Admin_panel","ZSM","Incharge","TEAM"] },
      { text: "Settings",      icon: <SettingsIcon />,      path: "/settings",         roles: ["Admin_panel","ZSM","Incharge","TEAM","ADMIN","PROJECT_HEAD","MANAGER","SUPERVISOR","INSTALLER"] },
    ],
    [userRole],
  );

  const filteredItems = useMemo(
    () =>
      menuItems.filter((item) => {
        const itemRoles = item.roles.map((r) => normalizeRole(r).toUpperCase());
        const uRole = normalizeRole(userRole).toUpperCase();
        if (["ADMIN", "ADMIN_PANEL"].includes(uRole)) return true;
        if (["MANAGER", "PROJECT_HEAD", "ZSM"].includes(uRole)) {
          return true;
        }
        return itemRoles.includes(uRole);
      }),
    [menuItems, userRole],
  );

  const menuSections = useMemo(
    () =>
      [
        { text: "Overview",    icon: <Dashboard />,    itemNames: ["Dashboard","Lead Funnel"] },
        { text: "Leads",       icon: <FilterAlt />,    itemNames: ["All Leads","Missed Leads","Import Leads"] },
        { text: "Projects",    icon: <TaskAlt />,      itemNames: ["Projects","Total Visits","3D Design","Add Quotation","All Quotes"] },
        { text: "Inventory",   icon: <Inventory2Outlined />, itemNames: ["Inventory In","Inventory Out"] },
        { text: "Attendance",  icon: <CalendarMonth />,itemNames: ["Team Attendance","My Attendance","Leave","Leave Types","Holiday Management"] },
        { text: "Salary",      icon: <AccountBalanceWallet />, itemNames: ["Payroll","Salary Structure","Salary Slips"] },
        { text: "HR",          icon: <Groups />,       itemNames: ["Employees"] },
        { text: "Team",        icon: <Groups />,       itemNames: ["Location Visit","Expense"] },
        { text: "Insights",    icon: <Insights />,     itemNames: ["Reports","Installer Work Register","Notifications"] },
        { text: "Settings",    icon: <SettingsIcon />, itemNames: ["Settings"] },
      ]
        .map((section) => ({
          ...section,
          items: section.itemNames
            .map((name) => filteredItems.find((item) => item.text === name))
            .filter(Boolean),
        }))
        .filter((section) => section.items.length > 0),
    [filteredItems],
  );

  const [openSection, setOpenSection] = useState("Overview");

  useEffect(() => {
    const active = menuSections.find((s) =>
      s.items.some((item) => location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)),
    );
    if (active) setOpenSection(active.text);
  }, [location.pathname, menuSections]);

  const isActive  = (path) =>
    location.pathname === path ||
    (path !== "/payroll" && location.pathname.startsWith(`${path}/`));

  const handleNavigate = useCallback(
    (path) => {
      navigate(path);
      if (isMobile || isTablet) onClose?.();
    },
    [navigate, isMobile, isTablet, onClose],
  );

  const handleLogout     = () => navigate("/login");
  const getUserInitials  = () =>
    `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.toUpperCase() || "U";

  // ── Collapsed Icon Item ────────────────────────────────────────────────────
  const renderMenuItem = (item) => {
    const active = isActive(item.path);
    const btn = (
      <ListItemButton
        key={item.path}
        onClick={() => handleNavigate(item.path)}
        sx={{
          pl: effectiveCollapsed ? 0 : 2,
          justifyContent: effectiveCollapsed ? "center" : "flex-start",
          borderRadius: "12px",
          mx: effectiveCollapsed ? 0.5 : 1,
          my: 0.5,
          bgcolor: active ? activeBg : "transparent",
          color: textPri,
          minHeight: isMobile ? 52 : 46,
          py: isMobile ? 1.3 : 1,
          transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
          position: "relative",
          overflow: "hidden",
          border: active ? activeBdr : "1.5px solid transparent",
          boxShadow: active ? (isDark ? "0 4px 14px rgba(37,99,235,0.3)" : "0 2px 8px rgba(30,64,175,0.12)") : "none",
          "&::before": active ? {
            content: '""',
            position: "absolute",
            inset: 0,
            background: isDark ? DARK_BLUE_GRADIENT : BLUE_GRADIENT,
            pointerEvents: "none",
          } : {},
          "&:hover": { 
            bgcolor: active ? (isDark ? "rgba(37,99,235,0.25)" : "rgba(30,64,175,0.15)") : (isDark ? "rgba(59,130,246,0.1)" : "rgba(30,64,175,0.08)"),
            transform: isMobile ? "none" : "translateX(5px)",
            boxShadow: isDark ? "0 4px 16px rgba(37,99,235,0.2)" : "0 4px 16px rgba(30,64,175,0.15)",
            border: active ? activeBdr : (isDark ? "1.5px solid rgba(59,130,246,0.3)" : "1.5px solid rgba(30,64,175,0.25)"),
          },
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: effectiveCollapsed ? "auto" : 40,
            color: active ? activeIcon : textSec,
            "& svg": { fontSize: isMobile ? "1.35rem" : "1.25rem" },
            transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
            transform: active ? "scale(1.1)" : "scale(1)",
          }}
        >
          {item.badge ? (
            <Badge badgeContent={item.badge} color="error" variant="dot">{item.icon}</Badge>
          ) : item.icon}
        </ListItemIcon>
        {!effectiveCollapsed && (
          <ListItemText
            primary={item.label || item.text}
            primaryTypographyProps={{
              fontSize: isMobile ? "0.92rem" : "0.875rem",
              fontWeight: active ? 700 : 500,
              letterSpacing: "0.01em",
              noWrap: true,
              color: active ? activeIcon : textSec,
              transition: "all 0.25s ease",
            }}
          />
        )}
      </ListItemButton>
    );

    return effectiveCollapsed ? (
      <Tooltip key={item.path} title={item.label || item.text} placement="right" arrow>{btn}</Tooltip>
    ) : (
      <React.Fragment key={item.path}>{btn}</React.Fragment>
    );
  };

  // ── Submenu Item ───────────────────────────────────────────────────────────
  const renderSubmenuItem = (item) => {
    const active = isActive(item.path);
    return (
      <ListItemButton
        key={item.path}
        onClick={() => handleNavigate(item.path)}
        sx={{
          minHeight: isMobile ? 44 : 40,
          px: 1.1, py: 0.75, my: 0.3,
          borderRadius: "10px",
          position: "relative",
          color: active ? activeIcon : textSec,
          bgcolor: active ? activeBg : "transparent",
          border: active ? activeBdr : "1px solid transparent",
          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          boxShadow: active ? (isDark ? "0 2px 8px rgba(37,99,235,0.25)" : "0 2px 6px rgba(30,64,175,0.1)") : "none",
          "&:hover": {
            bgcolor: active ? (isDark ? "rgba(37,99,235,0.3)" : "rgba(30,64,175,0.18)") : (isDark ? "rgba(59,130,246,0.12)" : "rgba(30,64,175,0.08)"),
            color: active ? BLUE_LIGHT : textPri,
            transform: isMobile ? "none" : "translateX(3px)",
            boxShadow: isDark ? "0 3px 12px rgba(37,99,235,0.2)" : "0 3px 10px rgba(30,64,175,0.12)",
          },
        }}
      >
        {active && (
          <Box sx={{
            position: "absolute", left: 0, top: 8, bottom: 8,
            width: 3, borderRadius: 999, bgcolor: isDark ? "#3b82f6" : BLUE,
            animation: "slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            "@keyframes slideIn": {
              from: { left: -4, opacity: 0 },
              to: { left: 0, opacity: 1 },
            }
          }} />
        )}
        <ListItemIcon
          sx={{
            minWidth: 29,
            color: "inherit",
            "& svg": { fontSize: isMobile ? "1.08rem" : "1rem" },
            transition: "all 0.25s ease",
            transform: active ? "scale(1.15)" : "scale(1)",
          }}
        >
          {item.icon}
        </ListItemIcon>
        <ListItemText
          primary={item.label || item.text}
          primaryTypographyProps={{
            fontSize: isMobile ? "0.88rem" : "0.81rem",
            fontWeight: active ? 700 : 500,
            letterSpacing: "0.005em",
            noWrap: true,
          }}
        />
      </ListItemButton>
    );
  };

  // ── Section Header ─────────────────────────────────────────────────────────
  const renderMenuSection = (section) => {
    const isOpen        = openSection === section.text;
    const hasActiveItem = section.items.some((item) => isActive(item.path));

    return (
      <Box key={section.text} sx={{ mb: 0.6 }}>
        <ListItemButton
          onClick={() => setOpenSection(isOpen ? null : section.text)}
          sx={{
            minHeight: isMobile ? 50 : 46,
            mx: 0.75, px: 1.25,
            borderRadius: "12px",
            color: textPri,
            bgcolor: hasActiveItem ? activeBg : "transparent",
            border: hasActiveItem ? activeBdr : "1.5px solid transparent",
            transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow: hasActiveItem ? (isDark ? "0 2px 10px rgba(37,99,235,0.2)" : "0 2px 8px rgba(30,64,175,0.12)") : "none",
            "&:hover": { 
              bgcolor: hasActiveItem ? (isDark ? "rgba(37,99,235,0.25)" : "rgba(30,64,175,0.15)") : (isDark ? "rgba(255,255,255,0.06)" : "rgba(30,64,175,0.06)"),
              boxShadow: isDark ? "0 3px 12px rgba(37,99,235,0.2)" : "0 3px 12px rgba(30,64,175,0.12)",
            },
          }}
        >
          <Box
            sx={{
              width: 36, height: 36, mr: 1.25,
              borderRadius: "10px",
              display: "grid", placeItems: "center",
              bgcolor: hasActiveItem ? (isDark ? "rgba(37,99,235,0.25)" : "rgba(30,64,175,0.15)") : sectionBg,
              color: hasActiveItem ? activeIcon : textSec,
              flexShrink: 0,
              border: hasActiveItem ? activeBdr : `1.5px solid ${borderCol}`,
              transition: "all 0.25s ease",
              "& svg": { fontSize: "1.15rem" },
            }}
          >
            {section.icon}
          </Box>
          <ListItemText
            primary={section.text}
            primaryTypographyProps={{
              fontSize: isMobile ? "0.92rem" : "0.84rem",
              fontWeight: 700,
              letterSpacing: "0.015em",
              noWrap: true,
              color: hasActiveItem ? activeIcon : textSec,
              transition: "all 0.25s ease",
            }}
          />
          <ExpandMore
            sx={{
              fontSize: "1.25rem",
              color: hasActiveItem ? activeIcon : textSec,
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
        </ListItemButton>

        <Collapse in={isOpen} timeout={300} unmountOnExit>
          <Box
            sx={{
              mt: 0.5, mb: 0.8,
              ml: isMobile ? 3.1 : 2.8,
              mr: 0.9, pl: 1.15,
              borderLeft: `2px solid ${isDark ? "rgba(59,130,246,0.3)" : "rgba(30,64,175,0.15)"}`,
            }}
          >
            {section.items.map(renderSubmenuItem)}
          </Box>
        </Collapse>
      </Box>
    );
  };

  // ── Scroll Area ────────────────────────────────────────────────────────────
  const scrollArea = (
    <Box
      sx={{
        flex: 1, overflowY: "auto", overflowX: "hidden",
        py: 1.5, px: 0.5,
        "&::-webkit-scrollbar": { width: "4px" },
        "&::-webkit-scrollbar-thumb": { 
          background: isDark ? "rgba(59,130,246,0.3)" : "rgba(30,64,175,0.25)", 
          borderRadius: "6px",
        },
        "&::-webkit-scrollbar-track": { background: "transparent" },
      }}
    >
      {effectiveCollapsed
        ? filteredItems.map(renderMenuItem)
        : menuSections.map((section) =>
            section.direct ? renderMenuItem(section.items[0]) : renderMenuSection(section),
          )}
    </Box>
  );

  const currentLogo = isDark ? sidebarLogoDark : sidebarLogoLight;

  // ── Logo Bar ───────────────────────────────────────────────────────────────
  const logoBar = (
    <Box
      sx={{
        px: effectiveCollapsed ? 1 : 2.5, py: 2,
        display: "flex", alignItems: "center",
        justifyContent: effectiveCollapsed ? "center" : "flex-start",
        gap: 1.5,
        borderBottom: `1.5px solid ${borderCol}`,
        minHeight: 68, flexShrink: 0,
        background: sidebarBg,
      }}
    >
      <Box
        sx={{
          width: effectiveCollapsed ? 36 : 42,
          height: effectiveCollapsed ? 36 : 42,
          borderRadius: "12px", 
          bgcolor: isDark ? "#000" : "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, overflow: "hidden",
          border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : borderCol}`,
          boxShadow: isDark ? "0 6px 16px rgba(0,0,0,0.4)" : "0 6px 16px rgba(30,64,175,0.14)",
          transition: "all 0.25s ease",
        }}
      >
        <Box
          component="img" src={currentLogo} alt="Vanurtech Pvt Ltd"
          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = currentLogo; }}
          sx={{ width: "100%", height: "100%", objectFit: "contain", p: 0.3 }}
        />
      </Box>
      {!effectiveCollapsed && (
        <Box sx={{ overflow: "hidden" }}>
          <Typography variant="subtitle1" color={textPri} fontWeight={800}
            sx={{ lineHeight: 1.2, letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>
            Vanurtech Pvt Ltd
          </Typography>
        </Box>
      )}
    </Box>
  );

  // ── Mobile Header ──────────────────────────────────────────────────────────
  const mobileHeader = (
    <Box
      sx={{
        px: 2.5, py: 1.8,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: `1.5px solid ${borderCol}`,
        flexShrink: 0, minHeight: 68,
        background: sidebarBg,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Box sx={{
          height: 42, minWidth: 64, px: 1, borderRadius: "12px", bgcolor: isDark ? "#000" : "#fff",
          display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
          border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : borderCol}`,
          boxShadow: isDark ? "0 6px 16px rgba(0,0,0,0.4)" : "0 6px 16px rgba(30,64,175,0.14)",
        }}>
          <Box component="img" src={currentLogo} alt="Vanurtech Pvt Ltd"
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = currentLogo; }}
            sx={{ height: "85%", width: "auto", maxWidth: "100%", objectFit: "contain" }}
          />
        </Box>
        <Box>
          <Typography variant="subtitle1" color={textPri} fontWeight={800} sx={{ lineHeight: 1.2 }}>
            Vanurtech Pvt Ltd
          </Typography>
        </Box>
      </Box>
      <IconButton onClick={onClose} size="small"
        sx={{ color: textSec, bgcolor: isDark ? "rgba(255,255,255,0.08)" : "rgba(30,64,175,0.1)", borderRadius: "10px", width: 36, height: 36 }}>
        <CloseIcon fontSize="small" />
      </IconButton>
    </Box>
  );

  // ── Footer ─────────────────────────────────────────────────────────────────
  const footer = (
    <Box sx={{ p: effectiveCollapsed ? 1.5 : 2, borderTop: `1.5px solid ${borderCol}`,
      flexShrink: 0, background: sidebarBg }}>
      {!isMobile && !isTablet && (
        <Box sx={{ display: "flex", justifyContent: "center", mb: effectiveCollapsed ? 1 : 1.5 }}>
          <Tooltip title={effectiveCollapsed ? "Expand sidebar" : "Collapse sidebar"} placement="right" arrow>
            <IconButton onClick={() => setIsCollapsed((v) => !v)} size="small"
              sx={{ color: textSec, bgcolor: isDark ? "rgba(255,255,255,0.08)" : "rgba(30,64,175,0.1)", borderRadius: "10px", width: 36, height: 36 }}>
              {effectiveCollapsed ? <ChevronRight fontSize="small" /> : <ChevronLeft fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Box>
      )}

      <Box sx={{
        display: "flex",
        justifyContent: effectiveCollapsed ? "center" : "space-between",
        alignItems: "center", gap: 1,
      }}>
        {!effectiveCollapsed && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, overflow: "hidden", flex: 1 }}>
            <Avatar
              sx={{
                width: 36, height: 36, flexShrink: 0,
                bgcolor: isDark ? "rgba(37,99,235,0.3)" : "rgba(30,64,175,0.15)",
                border: `2px solid ${isDark ? "#3b82f6" : BLUE}`,
                fontSize: "0.75rem", fontWeight: 800,
                color: isDark ? "#60a5fa" : BLUE,
              }}
            >
              {getUserInitials()}
            </Avatar>
            <Box sx={{ overflow: "hidden" }}>
              <Typography variant="caption"
                sx={{ color: textPri, fontWeight: 700, display: "block", lineHeight: 1.2,
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {user?.firstName} {user?.lastName}
              </Typography>
              <Typography variant="caption" sx={{ color: textSec, fontSize: "0.63rem" }}>
                v2.2.0
              </Typography>
            </Box>
          </Box>
        )}
        <Tooltip title="Logout" placement={effectiveCollapsed ? "right" : "top"} arrow>
          <IconButton size="small" onClick={handleLogout}
            sx={{ color: textSec, bgcolor: isDark ? "rgba(239,68,68,0.15)" : "rgba(30,64,175,0.1)", borderRadius: "10px", width: 36, height: 36, flexShrink: 0 }}>
            <Logout fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );

  // ── Drawer Content ─────────────────────────────────────────────────────────
  const DesktopContent = (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column", background: sidebarBg }}>
      {logoBar}
      {scrollArea}
      {footer}
    </Box>
  );

  const MobileContent = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column", background: sidebarBg, width: MOBILE_WIDTH }}>
      {mobileHeader}
      {scrollArea}
      {footer}
    </Box>
  );

  return (
    <>
      {!isMobile && (
        <Drawer variant="permanent"
          sx={{
            display: { xs: "none", sm: "block" },
            width: effectiveCollapsed ? COLLAPSED_WIDTH : SIDEBAR_WIDTH,
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              width: effectiveCollapsed ? COLLAPSED_WIDTH : SIDEBAR_WIDTH,
              boxSizing: "border-box", overflowX: "hidden",
              transition: "width 0.3s cubic-bezier(0.4,0,0.2,1)",
              backgroundColor: sidebarBg, borderRight: `1px solid ${borderCol}`,
              boxShadow: isDark ? "4px 0 16px rgba(0,0,0,0.4)" : "2px 0 12px rgba(30,64,175,0.12)",
            },
          }}
        >
          {DesktopContent}
        </Drawer>
      )}

      {isMobile && (
        <SwipeableDrawer anchor="left" open={open} onClose={onClose} onOpen={toggleDrawer}
          swipeAreaWidth={28} disableSwipeToOpen={false}
          ModalProps={{ keepMounted: true }}
          sx={{
            zIndex: (t) => t.zIndex.drawer + 2,
            "& .MuiDrawer-paper": {
              width: MOBILE_WIDTH, maxWidth: "88vw",
              backgroundColor: sidebarBg, borderRight: `1px solid ${borderCol}`,
              boxShadow: "4px 0 16px rgba(0,0,0,0.4)",
            },
          }}
        >
          {MobileContent}
        </SwipeableDrawer>
      )}
    </>
  );
};

export default Sidebar;
