// components/Topbar.jsx
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Avatar,
  Box,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
  alpha,
  Badge,
  InputBase,
  Divider,
  CircularProgress,
  SwipeableDrawer,
  Button,
  Paper,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Alert,
  InputAdornment,
  useTheme,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Logout as LogoutIcon,
  Notifications as NotificationsIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Search as SearchIcon,
  Help as HelpIcon,
  Dashboard as DashboardIcon,
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Edit as EditIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../contexts/AuthContext";
import { toBackendAssetUrl } from "../utils/backendAssetUrl";
import { API_BASE_URL } from "../utils/apiConfig";

const API = API_BASE_URL;

const getToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("authToken") ||
  localStorage.getItem("accessToken") ||
  "";

const getAvatarUrl = (avatar) => toBackendAssetUrl(avatar);

const isAdminRole = (role) => ["ADMIN", "Admin_panel"].includes(role);

const Topbar = ({ 
  toggleDrawer, 
  isMobile, 
  isTablet, 
  drawerOpen, 
  sidebarWidth = 280,
  collapsedWidth = 70 
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchor, setNotificationAnchor] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileEditing, setProfileEditing] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
  const [adminCurrentPassword, setAdminCurrentPassword] = useState('');
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    avatar: null,
  });

  const { user, logout, updateLocalUser } = useAuth()
  //console.log("users11...", user)
  const avatarSrc = avatarLoadFailed ? "" : getAvatarUrl(user?.avatar);

  useEffect(() => {
    setAvatarLoadFailed(false);
  }, [user?.avatar]);

  const fetchNotifications = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) return;

      const res = await fetch(`${API}/notifications?limit=8`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) return;
      const payload = await res.json();
      const data = payload?.data || payload?.result || {};
      const list = data?.notifications || [];

      setNotifications(
        list.map((item) => ({
          id: item._id || item.id,
          title: item.title,
          message: item.message,
          time: item.createdAt ? new Date(item.createdAt).toLocaleString("en-IN") : "Just now",
          read: Boolean(item.read),
          type: item.type || "general",
        }))
      );
    } catch (error) {
      console.error("Notification fetch failed:", error.message);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleProfileMenu = useCallback((event) => setAnchorEl(event.currentTarget), []);
  const handleNotificationMenu = useCallback((event) => setNotificationAnchor(event.currentTarget), []);
  const handleNotificationCenter = useCallback(() => {
    setNotificationAnchor(null);
    navigate('/notifications');
  }, [navigate]);
  
  const handleClose = useCallback(() => {
    setAnchorEl(null);
    setNotificationAnchor(null);
  }, []);
  
  const handleLogout = useCallback(async () => {
    if (!window.confirm('Are you sure you want to log out?')) {
      return;
    }
    try {
      setLoggingOut(true);
      handleClose();
      logout();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/login', { replace: true });
    } finally {
      setLoggingOut(false);
    }
  }, [navigate, handleClose, logout]);

  useEffect(() => {
    if (!profileOpen || !user) return;
    setProfileForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      avatar: null,
    });
    setProfileError('');
    setProfileEditing(false);
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  }, [profileOpen, user]);

  useEffect(() => {
    if (!profileOpen || !isAdminRole(user?.role) || !user?._id) return;

    const fetchAdminPassword = async () => {
      try {
        const token = getToken();
        const res = await fetch(`${API}/user/getViewPassword/${user._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const payload = await res.json();
        if (res.ok) {
          setAdminCurrentPassword(payload?.result?.viewPassword || '');
        }
      } catch {
        setAdminCurrentPassword('');
      }
    };

    fetchAdminPassword();
  }, [profileOpen, user]);

  const handleProfileSave = useCallback(async () => {
    if (profileForm.newPassword && profileForm.newPassword !== profileForm.confirmPassword) {
      setProfileError('New password and confirm password do not match.');
      return;
    }

    try {
      if (!profileEditing) return;
      setProfileSaving(true);
      setProfileError('');
      const token = getToken();
      const formData = new FormData();
      formData.append('firstName', profileForm.firstName);
      formData.append('lastName', profileForm.lastName);
      formData.append('email', profileForm.email);
      if (profileForm.avatar) formData.append('avatar', profileForm.avatar);
      if (profileForm.newPassword) {
        formData.append(
          'currentPassword',
          isAdminRole(user?.role) ? adminCurrentPassword : profileForm.currentPassword
        );
        formData.append('newPassword', profileForm.newPassword);
      }

      const res = await fetch(`${API}/user/profile`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.message || 'Profile update failed');
      updateLocalUser(payload.result);
      setProfileOpen(false);
      setProfileEditing(false);
    } catch (error) {
      setProfileError(error.message || 'Profile update failed');
    } finally {
      setProfileSaving(false);
    }
  }, [adminCurrentPassword, profileEditing, profileForm, updateLocalUser, user?.role]);

  const handleSearch = useCallback((e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      if (isMobile) {
        setMobileSearchOpen(false);
      }
    }
  }, [navigate, searchQuery, isMobile]);

  const handleMarkAsRead = useCallback(async (notificationId) => {
    try {
      const token = getToken();
      await fetch(`${API}/notifications/${notificationId}/read`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
    } catch (error) {
      console.error("Mark notification read failed:", error.message);
    }
  }, []);

  const handleMarkAllAsRead = useCallback(() => {
    const token = getToken();
    fetch(`${API}/notifications/read-all`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }).catch((error) => console.error("Mark all read failed:", error.message));

    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
  }, []);

  // User information
  const userInitials = useMemo(() => {
    if (!user) return 'U';
    return `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase() || 'U';
  }, [user]);

  const displayName = useMemo(() => {
    if (!user) return 'Team';
    return user?.firstName || 'Team';
  }, [user]);

  const fullName = useMemo(() => {
    if (!user) return 'User';
    return `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User';
  }, [user]);

  const userRole = useMemo(() => {
    if (!user?.role) return 'User';
    const roleMap = {
      'Admin_panel': 'Admin Panel',
      'ZSM': 'Operation Lead',
      'Incharge': 'Incharge',
      'TEAM': 'Field Executive'
    };
    return roleMap[user.role] || user.role;
  }, [user]);

  const unreadCount = useMemo(() => 
    notifications.filter(n => !n.read).length
  , [notifications]);

  // Calculate AppBar width
  const getAppBarWidth = useMemo(() => {
    if (isMobile) return "100%";
    if (isTablet) {
      return drawerOpen ? `calc(100% - ${sidebarWidth}px)` : `calc(100% - ${collapsedWidth}px)`;
    }
    return drawerOpen ? `calc(100% - ${sidebarWidth}px)` : `calc(100% - ${collapsedWidth}px)`;
  }, [isMobile, isTablet, drawerOpen, sidebarWidth, collapsedWidth]);

  // Mobile Search Drawer
  const MobileSearchDrawer = (
    <SwipeableDrawer
      anchor="top"
      open={mobileSearchOpen}
      onClose={() => setMobileSearchOpen(false)}
      onOpen={() => setMobileSearchOpen(true)}
      sx={{
        '& .MuiDrawer-paper': {
          top: 0,
          width: '100%',
          height: 'auto',
          backgroundColor: '#ffffff',
          borderBottomLeftRadius: 16,
          borderBottomRightRadius: 16,
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Tooltip title="Back" arrow>
            <IconButton onClick={() => setMobileSearchOpen(false)}>
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
          <Typography variant="h6" fontWeight={600}>Search</Typography>
        </Box>
        <Paper
          component="form"
          onSubmit={handleSearch}
          sx={{
            display: 'flex',
            alignItems: 'center',
            p: 1,
            bgcolor: '#f5f5f5',
            borderRadius: 2,
            border: '1px solid #e0e0e0',
          }}
        >
          <SearchIcon sx={{ color: '#999', mx: 1 }} />
          <InputBase
            placeholder="Search leads, customers, reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
            fullWidth
            sx={{ fontSize: '0.95rem' }}
          />
          {searchQuery && (
            <Tooltip title="Clear Search" arrow>
              <IconButton size="small" onClick={() => setSearchQuery('')}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Paper>
        
        {/* Recent Searches */}
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" color="#666" gutterBottom>
            Recent Searches
          </Typography>
          {['John Doe', 'Loan Application', 'Bangalore Leads'].map((item, index) => (
            <MenuItem
              key={index}
              onClick={() => {
                setSearchQuery(item);
                handleSearch({ preventDefault: () => {} });
              }}
              sx={{ borderRadius: 1, my: 0.5 }}
            >
              <ListItemIcon>
                <SearchIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={item} />
            </MenuItem>
          ))}
        </Box>
      </Box>
    </SwipeableDrawer>
  );

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          bgcolor: isDark ? '#080c14' : '#ffffff',
          borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e0e0e0',
          width: getAppBarWidth,
          ml: isMobile ? 0 : (drawerOpen ? `${sidebarWidth}px` : `${collapsedWidth}px`),
          zIndex: (theme) => theme.zIndex.drawer + 1,
          transition: 'all 0.3s ease',
        }}
      >
        <Toolbar sx={{
          justifyContent: 'space-between',
          minHeight: { xs: 56, sm: 64 },
          px: { xs: 1.5, sm: 2, md: 3 },
        }}>
          {/* Left Section */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
            {(isMobile || isTablet) && (
              <Tooltip title="Menu" arrow>
                <IconButton 
                  onClick={toggleDrawer} 
                  sx={{ 
                    color: isDark ? '#f8fafc' : '#0f1f3d',
                    '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.1)' : alpha('#0f1f3d', 0.1) },
                  }}
                >
                  <MenuIcon />
                </IconButton>
              </Tooltip>
            )}
            
            {/* Search Bar - Hidden on mobile */}
            {!isMobile && (
              <Box
                component="form"
                onSubmit={handleSearch}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  bgcolor: isDark ? '#0e1628' : '#f5f5f5',
                  borderRadius: 2,
                  px: 2,
                  py: 0.5,
                  width: { sm: 250, md: 300 },
                  ml: { sm: 2, md: 4 },
                  border: isDark ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid #e0e0e0',
                  '&:hover': { bgcolor: isDark ? '#121c32' : '#f0f0f0' },
                  '&:focus-within': {
                    borderColor: '#2563eb',
                    boxShadow: `0 0 0 2px rgba(37, 99, 235, 0.25)`,
                  },
                }}
              >
                <SearchIcon sx={{ color: isDark ? '#64748b' : '#999', mr: 1, fontSize: 20 }} />
                <InputBase
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  sx={{
                    flex: 1,
                    fontSize: '0.9rem',
                    color: isDark ? '#f8fafc' : 'inherit',
                    '& input::placeholder': { color: isDark ? '#64748b' : '#999', opacity: 1 },
                  }}
                />
              </Box>
            )}
          </Box>

          {/* Right Section */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 } }}>
            {/* Mobile Search Icon */}
            {isMobile && (
              <Tooltip title="Search" arrow>
                <IconButton
                  sx={{
                    color: isDark ? '#94a3b8' : '#666',
                    '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.08)' : alpha('#0f1f3d', 0.05) },
                  }}
                  onClick={() => setMobileSearchOpen(true)}
                >
                  <SearchIcon />
                </IconButton>
              </Tooltip>
            )}

            <Tooltip title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"} arrow>
              <IconButton
                onClick={() => {
                  const nextMode = isDark ? "light" : "dark";
                  localStorage.setItem("appThemeMode", nextMode);
                  window.dispatchEvent(new CustomEvent("themeModeChange", { detail: nextMode }));
                }}
                sx={{
                  color: isDark ? '#fbbf24' : '#64748b',
                  border: isDark ? '1px solid rgba(251, 191, 36, 0.3)' : '1px solid #e2e8f0',
                  bgcolor: isDark ? '#0e1628' : '#ffffff',
                  '&:hover': { bgcolor: isDark ? '#121c32' : alpha('#0f1f3d', 0.06) },
                }}
              >
                {isDark ? <LightModeIcon sx={{ fontSize: 20 }} /> : <DarkModeIcon sx={{ fontSize: 20 }} />}
              </IconButton>
            </Tooltip>

            <Tooltip title="Notifications" arrow>
              <IconButton
                onClick={handleNotificationMenu}
                sx={{
                  color: isDark ? '#60a5fa' : '#0f1f3d',
                  border: isDark ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid #e2e8f0',
                  bgcolor: isDark ? '#0e1628' : '#ffffff',
                  '&:hover': { bgcolor: isDark ? '#121c32' : alpha('#0f1f3d', 0.06) },
                }}
              >
                <Badge badgeContent={unreadCount} color="error" overlap="circular">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* User Profile */}
            <Tooltip title="Profile" arrow>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  cursor: 'pointer',
                  p: 0.5,
                  borderRadius: '8px',
                  '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.08)' : alpha('#0f1f3d', 0.05) },
                }}
                onClick={handleProfileMenu}
              >
                <Avatar
                  src={avatarSrc}
                  imgProps={{
                    onError: () => setAvatarLoadFailed(true),
                  }}
                  sx={{
                    bgcolor: avatarSrc ? 'transparent' : '#1e40af',
                    width: { xs: 32, sm: 36 },
                    height: { xs: 32, sm: 36 },
                    fontSize: { xs: '0.8rem', sm: '0.9rem' },
                    fontWeight: 600,
                    color: '#ffffff',
                  }}
                >
                  {!avatarSrc && userInitials}
                </Avatar>
                {!isMobile && (
                  <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                    <Typography 
                      fontSize="0.9rem"
                      fontWeight={600}
                      color={isDark ? '#f8fafc' : '#333333'}
                      sx={{ lineHeight: 1.2 }}
                    >
                      {displayName}
                    </Typography>
                    <Typography 
                      fontSize="0.75rem" 
                      color={isDark ? '#94a3b8' : '#666666'}
                      sx={{ lineHeight: 1.2 }}
                    >
                      {userRole}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Tooltip>
          </Box>
        </Toolbar>

        {/* Mobile Bottom Border Indicator */}
        {isMobile && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '2px',
              background: `linear-gradient(90deg, ${PRIMARY_COLOR} 0%, ${PRIMARY_LIGHT} 100%)`,
            }}
          />
        )}
      </AppBar>
       
      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{ 
          sx: { 
            width: { xs: '100%', sm: 280 },
            maxWidth: { xs: '100%', sm: 280 },
            mt: 1,
            borderRadius: { xs: 0, sm: '8px' },
            border: { xs: 'none', sm: '1px solid #e0e0e0' },
            boxShadow: { xs: 'none', sm: '0 4px 12px rgba(0, 0, 0, 0.08)' },
            position: { xs: 'fixed', sm: 'absolute' },
            top: { xs: '56px', sm: 'auto' },
            left: { xs: 0, sm: 'auto' },
            right: { xs: 0, sm: 'auto' },
          } 
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {/* User Info */}
        <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar
              src={avatarSrc}
              imgProps={{
                onError: () => setAvatarLoadFailed(true),
              }}
              sx={{
                bgcolor: avatarSrc ? 'transparent' : '#0f1f3d',
                color: '#ffffff',
                width: 48,
                height: 48,
                fontSize: '1rem',
                fontWeight: 600,
              }}
            >
              {!avatarSrc && userInitials}
            </Avatar>
            <Box>
              <Typography fontWeight={600} fontSize="0.95rem" color="#333333">
                {fullName}
              </Typography>
              <Typography fontSize="0.8rem" color="#666666" mb={0.5}>
                {userRole}
              </Typography>
              <Typography fontSize="0.75rem" color="#999">
                {user?.email || ''}
              </Typography>
            </Box>
          </Box>
        </Box>
        
        {/* Menu Items */}
        <Box sx={{ py: 0.5 }}>
          <MenuItem
            onClick={() => {
              handleClose();
              setProfileOpen(true);
            }}
          >
            <ListItemIcon>
              <PersonIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Profile"
              primaryTypographyProps={{ fontSize: '0.9rem' }}
            />
          </MenuItem>
          <MenuItem 
            onClick={handleLogout} 
            sx={{ 
              color: '#ff4444',
              '&:hover': { bgcolor: alpha('#ff4444', 0.05) }
            }}
            disabled={loggingOut}
          >
            <ListItemIcon sx={{ color: 'inherit' }}>
              {loggingOut ? <CircularProgress size={20} color="inherit" /> : <LogoutIcon fontSize="small" />}
            </ListItemIcon>
            <ListItemText 
              primary={loggingOut ? "Logging out..." : "Logout"} 
              primaryTypographyProps={{ fontSize: '0.9rem' }}
            />
          </MenuItem>
        </Box>
      </Menu>

      <Dialog open={profileOpen} onClose={() => setProfileOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {profileError && <Alert severity="error">{profileError}</Alert>}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar
                src={profileForm.avatar ? URL.createObjectURL(profileForm.avatar) : avatarSrc}
                imgProps={{
                  onError: () => setAvatarLoadFailed(true),
                }}
                sx={{ width: 64, height: 64, bgcolor: avatarSrc || profileForm.avatar ? 'transparent' : '#0f1f3d' }}
              >
                {!profileForm.avatar && !avatarSrc && userInitials}
              </Avatar>
              {profileEditing ? (
                <Button variant="outlined" component="label">
                  Change Image
                  <input
                    hidden
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setProfileForm((prev) => ({ ...prev, avatar: e.target.files?.[0] || null }))
                    }
                  />
                </Button>
              ) : (
                <Button variant="outlined" startIcon={<EditIcon />} onClick={() => setProfileEditing(true)}>
                  Edit
                </Button>
              )}
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                label="First name"
                value={profileForm.firstName}
                disabled={!profileEditing}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, firstName: e.target.value }))}
              />
              <TextField
                label="Last name"
                value={profileForm.lastName}
                disabled={!profileEditing}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, lastName: e.target.value }))}
              />
            </Box>
            <TextField
              label="Email"
              type="email"
              value={profileForm.email}
              disabled={!profileEditing}
              onChange={(e) => setProfileForm((prev) => ({ ...prev, email: e.target.value }))}
            />
            <Divider />
            <Typography fontWeight={600}>Change password</Typography>
            {isAdminRole(user?.role) ? (
              <TextField
                label="Current password"
                type={showCurrentPassword ? 'text' : 'password'}
                value={adminCurrentPassword}
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        edge="end"
                        onClick={() => setShowCurrentPassword((prev) => !prev)}
                      >
                        {showCurrentPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            ) : (
              <TextField
                label="Current password"
                type="password"
                value={profileForm.currentPassword}
                disabled={!profileEditing}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
              />
            )}
            <TextField
              label="New password"
              type={showNewPassword ? 'text' : 'password'}
              value={profileForm.newPassword}
              disabled={!profileEditing}
              onChange={(e) => setProfileForm((prev) => ({ ...prev, newPassword: e.target.value }))}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      edge="end"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => setShowNewPassword((prev) => !prev)}
                    >
                      {showNewPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              label="Confirm new password"
              type={showConfirmPassword ? 'text' : 'password'}
              value={profileForm.confirmPassword}
              disabled={!profileEditing}
              onChange={(e) => setProfileForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      edge="end"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                    >
                      {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProfileOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleProfileSave} disabled={!profileEditing || profileSaving}>
            {profileSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      <Menu
        anchorEl={notificationAnchor}
        open={Boolean(notificationAnchor)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: { xs: 'calc(100vw - 24px)', sm: 360 },
            maxWidth: 360,
            mt: 1,
            borderRadius: 3,
            border: '1px solid #e2e8f0',
            boxShadow: '0 18px 40px rgba(15, 23, 42, 0.14)',
            overflow: 'hidden',
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography fontWeight={700} fontSize="0.95rem" color="#0f172a">
              Notifications
            </Typography>
            <Typography fontSize="0.76rem" color="#64748b">
              {unreadCount > 0 ? `${unreadCount} unread updates` : 'All caught up'}
            </Typography>
          </Box>
          {unreadCount > 0 && (
            <Button size="small" onClick={handleMarkAllAsRead} sx={{ color: '#0f1f3d', fontWeight: 700 }}>
              Mark all read
            </Button>
          )}
        </Box>
        <Divider />
        <Box sx={{ maxHeight: 360, overflowY: 'auto' }}>
          {notifications.length === 0 ? (
            <Box sx={{ px: 2, py: 4, textAlign: 'center' }}>
              <NotificationsIcon sx={{ color: '#cbd5e1', fontSize: 28, mb: 1 }} />
              <Typography fontSize="0.88rem" fontWeight={600} color="#334155">
                No notifications yet
              </Typography>
              <Typography fontSize="0.78rem" color="#94a3b8">
                New alerts will appear here.
              </Typography>
            </Box>
          ) : (
            notifications.map((notification) => (
              <MenuItem
                key={notification.id}
                onClick={() => handleMarkAsRead(notification.id)}
                sx={{
                  alignItems: 'flex-start',
                  gap: 1.25,
                  px: 2,
                  py: 1.5,
                  whiteSpace: 'normal',
                  bgcolor: notification.read ? '#ffffff' : alpha('#0f1f3d', 0.045),
                  borderLeft: notification.read ? '3px solid transparent' : '3px solid #0f1f3d',
                }}
              >
                <ListItemIcon sx={{ minWidth: 0, mt: 0.35, color: notification.read ? '#94a3b8' : '#0f1f3d' }}>
                  <NotificationsIcon fontSize="small" />
                </ListItemIcon>
                <Box sx={{ minWidth: 0 }}>
                  <Typography fontSize="0.85rem" fontWeight={700} color="#0f172a" sx={{ mb: 0.25 }}>
                    {notification.title}
                  </Typography>
                  <Typography fontSize="0.78rem" color="#475569" sx={{ lineHeight: 1.5 }}>
                    {notification.message}
                  </Typography>
                  <Typography fontSize="0.72rem" color="#94a3b8" sx={{ mt: 0.6 }}>
                    {notification.time}
                  </Typography>
                </Box>
              </MenuItem>
            ))
          )}
        </Box>
        <Divider />
        <Box sx={{ p: 1.25 }}>
          <Button
            fullWidth
            variant="contained"
            onClick={handleNotificationCenter}
            sx={{
              bgcolor: '#0f1f3d',
              borderRadius: 2.5,
              fontWeight: 700,
              '&:hover': { bgcolor: '#3a5ac8' },
            }}
          >
            View All Notifications
          </Button>
        </Box>
      </Menu>

      {/* Mobile Search Drawer */}
      {MobileSearchDrawer}

      {/* Spacer for fixed AppBar */}
      <Box sx={{ height: { xs: 56, sm: 64 } }} />
    </>
  );
};

// Color constants for mobile border
const PRIMARY_COLOR = "#0f1f3d";
const PRIMARY_LIGHT = "#5c7cec";

export default Topbar;
