import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  alpha,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  Fade,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  AssignmentInd,
  CheckCircle,
  Close,
  Email,
  Groups,
  Person,
  Phone,
  SupervisorAccount,
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";

const ASSIGN_ROLES = {
  Admin_panel: ["Incharge", "TEAM"],
  ZSM: ["Incharge", "TEAM"],
  Incharge: ["TEAM"],
};

const getDisplayName = (record) => {
  const firstName = (record?.firstName || "").trim();
  const lastName = (record?.lastName || "").trim();
  const combined = [firstName, lastName].filter(Boolean).join(" ").trim();

  return (
    combined ||
    (record?.contactPerson || "").trim() ||
    (record?.name || "").trim() ||
    (record?.companyName || "").trim() ||
    "Unnamed Record"
  );
};

const getInitials = (label) =>
  (label || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";

const normalizeUsers = (response) => {
  const result = response?.result;

  if (Array.isArray(result?.users)) return result.users;
  if (Array.isArray(result?.data)) return result.data;
  if (Array.isArray(result)) return result;
  if (result && typeof result === "object") return [result];

  return [];
};

const LeadAssignDialog = ({
  open,
  onClose,
  record,
  recordTypeLabel = "Lead",
  userRole,
  onAssigned,
  showSnackbar,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const { fetchAPI, user } = useAuth();

  const [availableRoles, setAvailableRoles] = useState([]);
  const [assignToRole, setAssignToRole] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [inchargeUsers, setInchargeUsers] = useState([]);
  const [teamUsers, setTeamUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingAssign, setLoadingAssign] = useState(false);
  const [error, setError] = useState("");

  const canAssign = Boolean(ASSIGN_ROLES[userRole]?.length);
  const recordName = useMemo(() => getDisplayName(record), [record]);
  const recordContact = useMemo(() => {
    const email = (record?.email || record?.contactEmail || "").trim();
    const phone = (record?.phone || record?.mobile || record?.contactNumber || "").trim();
    return [email, phone].filter(Boolean);
  }, [record]);
  const recordChipLabel = recordTypeLabel || "Lead";
  const selectedUsers = assignToRole === "Incharge" ? inchargeUsers : teamUsers;
  const surface = isDark ? "#0b1120" : "#f6fbfd";
  const panel = isDark ? "#111827" : "#fff";
  const panelSoft = isDark ? "#0f172a" : "#fff";
  const textMain = isDark ? "#f8fafc" : "#1f2937";
  const textMuted = isDark ? "#94a3b8" : "text.secondary";
  const border = isDark ? "rgba(148, 163, 184, 0.18)" : "rgba(15, 31, 61, 0.1)";
  const accent = isDark ? "#38bdf8" : "#4c63f2";

  const resetState = useCallback(() => {
    setAvailableRoles([]);
    setAssignToRole("");
    setSelectedUserId("");
    setInchargeUsers([]);
    setTeamUsers([]);
    setLoadingUsers(false);
    setLoadingAssign(false);
    setError("");
  }, []);

  const loadUsersForRole = useCallback(
    async (role) => {
      if (!canAssign || !role) return;

      try {
        setLoadingUsers(true);
        setError("");

        let endpoint = "";
        let queryParams = "?page=1&limit=100";

        if (userRole === "Admin_panel" || userRole === "ZSM") {
          endpoint = role === "Incharge" ? "/user/managerList" : "/user/getManagerUnderUserList";
        } else if (userRole === "Incharge" && role === "TEAM") {
          endpoint = "/user/getManagerUnderUserList";
          queryParams = `?page=1&limit=100&supervisorId=${user?._id}`;
        }

        if (!endpoint) {
          setError(`No endpoint configured for ${role} users.`);
          return;
        }

        const response = await fetchAPI(`${endpoint}${queryParams}`);
        if (!response?.success) {
          throw new Error(response?.message || `Failed to load ${role} users`);
        }

        const users = normalizeUsers(response).filter((candidate) => {
          const hasRole = candidate?.role === role;
          const isActive = (candidate?.status || "").toLowerCase() !== "inactive";
          const supervised =
            userRole !== "Incharge" ||
            role !== "TEAM" ||
            candidate?.supervisor?._id === user?._id ||
            candidate?.supervisorId === user?._id ||
            candidate?.supervisor === user?._id;

          return hasRole && isActive && supervised;
        });

        if (role === "Incharge") setInchargeUsers(users);
        if (role === "TEAM") setTeamUsers(users);

        if (!users.length) {
          setError(`No active ${role === "Incharge" ? "Incharge users" : "team members"} available.`);
        }
      } catch (loadError) {
        const message = loadError?.message || "Failed to load users";
        setError(message);
        showSnackbar?.(message, "error");
      } finally {
        setLoadingUsers(false);
      }
    },
    [canAssign, fetchAPI, showSnackbar, user, userRole],
  );

  useEffect(() => {
    if (!open) {
      resetState();
      return;
    }

    const roles = ASSIGN_ROLES[userRole] || [];
    setAvailableRoles(roles);
    setSelectedUserId("");
    setAssignToRole("");
    setInchargeUsers([]);
    setTeamUsers([]);
    setError("");

    if (roles.length === 1) {
      const initialRole = roles[0];
      setAssignToRole(initialRole);
      loadUsersForRole(initialRole);
    }
  }, [loadUsersForRole, open, resetState, userRole]);

  const handleRoleSelect = useCallback(
    async (role) => {
      setAssignToRole(role);
      setSelectedUserId("");
      setError("");
      if (role === "Incharge") setInchargeUsers([]);
      if (role === "TEAM") setTeamUsers([]);
      await loadUsersForRole(role);
    },
    [loadUsersForRole],
  );

  const handleSubmit = useCallback(async () => {
    if (!record?._id) {
      setError("Missing record details.");
      return;
    }
    if (!assignToRole) {
      setError("Please choose a role.");
      return;
    }
    if (!selectedUserId) {
      setError("Please select a user to assign.");
      return;
    }

    try {
      setLoadingAssign(true);
      setError("");

      const payload = {
        leadId: record._id,
        targetId: selectedUserId,
        targetRole: assignToRole,
      };

      if (assignToRole === "Incharge") {
        payload.managerId = selectedUserId;
      } else {
        payload.userId = selectedUserId;
      }

      const response = await fetchAPI("/lead/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response?.success) {
        throw new Error(response?.message || `Failed to assign ${recordTypeLabel.toLowerCase()}`);
      }

      await onAssigned?.(response.result);
      showSnackbar?.(`${recordTypeLabel} assigned successfully`, "success");
      onClose?.();
    } catch (assignError) {
      const message = assignError?.message || `Failed to assign ${recordTypeLabel.toLowerCase()}`;
      setError(message);
      showSnackbar?.(message, "error");
    } finally {
      setLoadingAssign(false);
    }
  }, [assignToRole, fetchAPI, onAssigned, onClose, record, recordTypeLabel, selectedUserId, showSnackbar]);

  if (!open) {
    return null;
  }

  if (!canAssign) {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        fullScreen={fullScreen}
        maxWidth="sm"
        fullWidth
        TransitionComponent={Fade}
        PaperProps={{
          sx: {
            borderRadius: fullScreen ? 0 : 4,
            overflow: "hidden",
            bgcolor: panel,
            color: textMain,
            backgroundImage: "none",
          },
        }}
      >
        <DialogContent sx={{ p: 0, bgcolor: surface }}>
          <Box
            sx={{
              p: 3,
              color: "#fff",
              background: isDark ? "linear-gradient(135deg, #0f172a 0%, #155e75 100%)" : "linear-gradient(135deg, #1a2747 0%, #3f7a93 100%)",
            }}
          >
            <Typography variant="h6" fontWeight={800}>
              Access denied
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5, opacity: 0.9 }}>
              Your role does not have permission to assign records.
            </Typography>
          </Box>
          <Box sx={{ p: 3 }}>
            <Typography variant="body2" color={textMuted}>
              Role: {userRole || "Unknown"}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, bgcolor: panel }}>
          <Button onClick={onClose} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={fullScreen}
      TransitionComponent={Fade}
      PaperProps={{
        sx: {
          borderRadius: fullScreen ? 0 : 5,
          overflow: "hidden",
          bgcolor: panel,
          color: textMain,
          backgroundImage: "none",
          boxShadow: isDark ? "0 24px 80px rgba(0,0,0,0.65)" : "0 24px 64px rgba(15, 31, 61, 0.18)",
        },
      }}
    >
      <Box
        sx={{
          position: "relative",
          overflow: "hidden",
          px: { xs: 2.5, sm: 3.5 },
          py: { xs: 2.5, sm: 3 },
          minHeight: 128,
          color: "#fff",
          background: isDark ? "linear-gradient(135deg, #0f172a 0%, #155e75 100%)" : "linear-gradient(135deg, #14233f 0%, #276e89 100%)",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 85% 10%, rgba(255,255,255,0.14) 0, rgba(255,255,255,0.14) 12%, transparent 13%), radial-gradient(circle at 28% 72%, rgba(255,255,255,0.08) 0, rgba(255,255,255,0.08) 10%, transparent 11%)",
          }}
        />
        <Stack direction="row" spacing={2} alignItems="center" sx={{ position: "relative", zIndex: 1 }}>
          <Avatar
            sx={{
              width: 64,
              height: 64,
              bgcolor: "#4c63f2",
              boxShadow: "0 14px 30px rgba(38, 63, 170, 0.35)",
            }}
          >
            <AssignmentInd sx={{ fontSize: 34 }} />
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h5" fontWeight={800} sx={{ lineHeight: 1.1 }}>
              Assign Lead
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.4, opacity: 0.92, fontWeight: 500 }} noWrap>
              {recordName}
            </Typography>
          </Box>
          <Button
            onClick={onClose}
            aria-label="Close"
            sx={{
              minWidth: 40,
              width: 40,
              height: 40,
              borderRadius: "50%",
              color: "#fff",
              bgcolor: "rgba(255,255,255,0.12)",
              "&:hover": { bgcolor: "rgba(255,255,255,0.2)" },
            }}
          >
            <Close />
          </Button>
        </Stack>
      </Box>

      <DialogContent sx={{ p: 0, bgcolor: surface, color: textMain }}>
        <Box sx={{ px: { xs: 2.5, sm: 3.5 }, py: { xs: 2.5, sm: 3 } }}>
          <Box
            sx={{
              p: { xs: 2, sm: 2.5 },
              mb: 3,
              borderRadius: 4,
              bgcolor: panel,
              border: `1px solid ${border}`,
              boxShadow: isDark ? "0 10px 30px rgba(0,0,0,0.22)" : "0 10px 24px rgba(15, 31, 61, 0.04)",
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar
                sx={{
                  width: 58,
                  height: 58,
                  bgcolor: alpha(accent, 0.16),
                  color: accent,
                  fontWeight: 800,
                }}
              >
                {getInitials(recordName)}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle1" fontWeight={800} noWrap>
                  {recordName}
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 0.75, flexWrap: "wrap" }}>
                  {recordContact[0] && (
                    <Stack direction="row" spacing={0.75} alignItems="center">
                      <Email sx={{ fontSize: 16, color: textMuted }} />
                      <Typography variant="body2" color={textMuted} noWrap>
                        {recordContact[0]}
                      </Typography>
                    </Stack>
                  )}
                  {recordContact[1] && (
                    <Stack direction="row" spacing={0.75} alignItems="center">
                      <Phone sx={{ fontSize: 16, color: textMuted }} />
                      <Typography variant="body2" color={textMuted} noWrap>
                        {recordContact[1]}
                      </Typography>
                    </Stack>
                  )}
                </Stack>
                <Chip
                  label={recordChipLabel}
                  size="small"
                  sx={{
                    mt: 1.2,
                    borderRadius: 999,
                    fontWeight: 700,
                    bgcolor: alpha(accent, 0.14),
                    color: accent,
                  }}
                />
              </Box>
            </Stack>
          </Box>

          <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1.5 }}>
            Assign To Role
          </Typography>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mb: 3 }}>
            {availableRoles.map((role) => {
              const selected = assignToRole === role;
              const icon = role === "Incharge" ? <SupervisorAccount /> : <Groups />;

              return (
                <Button
                  key={role}
                  type="button"
                  onClick={() => handleRoleSelect(role)}
                  variant="outlined"
                  startIcon={icon}
                  sx={{
                    flex: 1,
                    justifyContent: "flex-start",
                    px: 2,
                    py: 1.6,
                    borderRadius: 3,
                    borderWidth: 1.5,
                    textTransform: "none",
                    fontSize: 16,
                    fontWeight: 600,
                    borderColor: selected ? accent : border,
                    color: textMain,
                    bgcolor: selected ? alpha(accent, 0.14) : panelSoft,
                    "&:hover": {
                      borderWidth: 1.5,
                      borderColor: accent,
                      bgcolor: alpha(accent, 0.1),
                    },
                  }}
                >
                  {role === "Incharge" ? "Incharge" : "Team"}
                  {selected && (
                    <Box sx={{ ml: "auto", display: "flex", color: accent }}>
                      <CheckCircle fontSize="small" />
                    </Box>
                  )}
                </Button>
              );
            })}
          </Stack>

          {(assignToRole || availableRoles.length === 1) && (
            <Box>
              <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1 }}>
                Select {assignToRole === "TEAM" ? "Team Member" : assignToRole || "User"}
              </Typography>

              {loadingUsers ? (
                <Box sx={{ py: 4, textAlign: "center" }}>
                  <CircularProgress size={30} />
                  <Typography variant="body2" color={textMuted} sx={{ mt: 1.25 }}>
                    Loading available users...
                  </Typography>
                </Box>
              ) : selectedUsers.length ? (
                <Stack spacing={1.25} sx={{ maxHeight: 260, overflow: "auto", pr: 0.5 }}>
                  {selectedUsers.map((candidate) => {
                    const selected = selectedUserId === candidate._id;
                    const name = getDisplayName(candidate);
                    const secondary = candidate?.email || candidate?.phone || "";

                    return (
                      <Box
                        key={candidate._id}
                        onClick={() => setSelectedUserId(candidate._id)}
                        role="button"
                        tabIndex={0}
                        sx={{
                          p: 1.5,
                          borderRadius: 3,
                          cursor: "pointer",
                          border: `1.5px solid ${selected ? accent : border}`,
                          bgcolor: selected ? alpha(accent, 0.14) : panelSoft,
                          display: "flex",
                          alignItems: "center",
                          gap: 1.5,
                          transition: "all 0.2s ease",
                          "&:hover": {
                            borderColor: accent,
                            bgcolor: alpha(accent, 0.1),
                          },
                        }}
                      >
                        <Avatar
                          sx={{
                            width: 42,
                            height: 42,
                            bgcolor: alpha(accent, 0.18),
                            color: accent,
                            fontWeight: 800,
                          }}
                        >
                          {getInitials(name)}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" fontWeight={700} noWrap>
                            {name}
                          </Typography>
                          {secondary && (
                            <Typography variant="caption" color={textMuted} noWrap>
                              {secondary}
                            </Typography>
                          )}
                        </Box>
                        <Box
                          sx={{
                            width: 22,
                            height: 22,
                            borderRadius: "50%",
                            border: `2px solid ${selected ? accent : border}`,
                            bgcolor: selected ? accent : "transparent",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {selected && <CheckCircle sx={{ fontSize: 14, color: "#fff" }} />}
                        </Box>
                      </Box>
                    );
                  })}
                </Stack>
              ) : (
                <Box
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    textAlign: "center",
                    bgcolor: panelSoft,
                    border: `1px dashed ${border}`,
                  }}
                >
                  <Person sx={{ fontSize: 34, color: alpha(accent, 0.55) }} />
                  <Typography variant="body2" color={textMuted} sx={{ mt: 1 }}>
                    No available users found.
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {error && (
            <Box
              sx={{
                mt: 3,
                p: 1.5,
                borderRadius: 2.5,
                bgcolor: alpha("#ef4444", isDark ? 0.16 : 0.08),
                color: isDark ? "#fca5a5" : "#b91c1c",
                border: `1px solid ${alpha("#ef4444", isDark ? 0.28 : 0.18)}`,
                fontSize: 14,
              }}
            >
              {error}
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          px: { xs: 2.5, sm: 3.5 },
          py: 2.5,
          bgcolor: panel,
          borderTop: `1px solid ${border}`,
          gap: 1.5,
        }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          disabled={loadingAssign || loadingUsers}
          sx={{
            minWidth: 140,
            borderRadius: 999,
            borderColor: alpha(accent, 0.45),
            color: accent,
            fontWeight: 700,
            textTransform: "none",
            "&:hover": { borderColor: accent, bgcolor: alpha(accent, 0.08) },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loadingAssign || loadingUsers || !selectedUserId || !assignToRole}
          startIcon={loadingAssign ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : <AssignmentInd />}
          sx={{
            minWidth: 180,
            borderRadius: 999,
            bgcolor: "#f2892e",
            fontWeight: 800,
            textTransform: "none",
            boxShadow: "0 10px 18px rgba(242, 137, 46, 0.25)",
            "&:hover": { bgcolor: "#dd7720" },
            "&.Mui-disabled": {
              bgcolor: alpha(isDark ? "#94a3b8" : "#f2892e", 0.28),
              color: isDark ? "#cbd5e1" : "#fff",
            },
          }}
        >
          {loadingAssign ? "Assigning..." : "Assign Lead"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LeadAssignDialog;
