import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";
import { buildApiUrl } from "../utils/apiConfig";

const AuthContext = createContext({});

const normalizeRole = (role) => {
  const value = String(role || "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  const map = { head_office: "ADMIN", admin_panel: "ADMIN", admin: "ADMIN", project_head: "PROJECT_HEAD", manager: "MANAGER", supervisor: "SUPERVISOR", installer: "INSTALLER", team: "INSTALLER", zsm: "PROJECT_HEAD", incharge: "SUPERVISOR" };
  return map[value] || role;
};

const normalizeLegacyRole = (role) => {
  const canonicalRole = normalizeRole(role);
  const map = {
    ADMIN: "Admin_panel",
    PROJECT_HEAD: "ZSM",
    MANAGER: "ZSM",
    SUPERVISOR: "Incharge",
    INSTALLER: "TEAM",
  };
  return map[canonicalRole] || canonicalRole || null;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);


  const isAuthenticated = useCallback(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (!token || !savedUser) return false;

      try {
        const parsedUser = JSON.parse(savedUser);
        return !!(parsedUser && parsedUser.email && normalizeRole(parsedUser.role));
      } catch {
        return false;
      }
  }, []);

  /* ===============================
     INIT AUTH FROM LOCAL STORAGE
  =============================== */

  useEffect(() => {
    const initAuth = () => {
      try {
        const token = localStorage.getItem("token");
        const savedUser = localStorage.getItem("user");

        if (token && savedUser && isAuthenticated()) {
          const parsedUser = JSON.parse(savedUser);
          const normalizedUser = {
            ...parsedUser,
            role: normalizeRole(parsedUser.role),
          };
          setUser(normalizedUser);
          localStorage.setItem("user", JSON.stringify(normalizedUser));
        }
      } catch (error) {
        console.error("Init error:", error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [isAuthenticated]);

  /* ===============================
     API HELPER
  =============================== */

  const fetchAPI = useCallback(async (endpoint, options = {}) => {
    const token = localStorage.getItem("token");

    const config = {
      ...options,
      headers: {
        ...(options.body instanceof FormData
          ? {}
          : { "Content-Type": "application/json" }),
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(buildApiUrl(endpoint), config);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.clear();
          setUser(null);
          window.location.href = "/login";
        }
        throw new Error(data.message || "Request failed");
      }

      return data;
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }, []);

  /* ===============================
     SAFE API HELPER
  =============================== */

  const safeFetchAPI = useCallback(
    async (endpoint, options = {}) => {
      try {
        const result = await fetchAPI(endpoint, options);
        return { success: true, ...result };
      } catch (error) {
        return {
          success: false,
          error: error.message || "Request failed",
        };
      }
    },
    [fetchAPI],
  );

  /* ===============================
     LOGIN
  =============================== */

  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetchAPI("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      const token = response.result?.token || response.token;
      const userData = response.result?.user || response.result || response;
      const normalizedUserData = {
        ...userData,
        role: normalizeRole(userData?.role),
      };

      if (!token) throw new Error("No token received");

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(normalizedUserData));

      setUser(normalizedUserData);
      setSuccess("Login successful");

      return { success: true, user: normalizedUserData, token };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  /* ===============================
     LOGOUT
  =============================== */

  const logout = useCallback(() => {
    localStorage.clear();
    setUser(null);
  }, []);

  const updateLocalUser = useCallback((nextUser) => {
    const normalizedUser = {
      ...nextUser,
      role: normalizeRole(nextUser?.role),
    };
    setUser(normalizedUser);
    localStorage.setItem("user", JSON.stringify(normalizedUser));
  }, []);

  /* ===============================
     ROLE HELPERS
  =============================== */

  // ✅ FIX: Define punchIn and punchOut as proper functions
  const punchIn = useCallback(
    async (locationData) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetchAPI("/attendance/punch-in", {
          method: "POST",
          body: JSON.stringify(locationData),
        });

        if (response.success) {
          // Update user or do any other necessary state updates
          setUser((prev) => ({
            ...prev,
            lastPunchIn: new Date().toISOString(),
          }));
        }

        return response;
      } catch (err) {
        setError(err.message);
        return { success: false, error: err.message };
      } finally {
        setLoading(false);
      }
    },
    [fetchAPI],
  );

  const punchOut = useCallback(
    async (locationData) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetchAPI("/attendance/punch-out", {
          method: "POST",
          body: JSON.stringify(locationData),
        });

        if (response.success) {
          // Update user or do any other necessary state updates
          setUser((prev) => ({
            ...prev,
            lastPunchOut: new Date().toISOString(),
          }));
        }

        return response;
      } catch (err) {
        setError(err.message);
        return { success: false, error: err.message };
      } finally {
        setLoading(false);
      }
    },
    [fetchAPI],
  );

  const getUserRole = useCallback(() => normalizeLegacyRole(user?.role), [user]);
  const getCanonicalUserRole = useCallback(() => normalizeRole(user?.role) || null, [user]);
  const isTeamMember = useCallback(() => normalizeRole(user?.role) === "INSTALLER", [user]);
  const isManager = useCallback(
    () => ["ADMIN", "PROJECT_HEAD", "MANAGER", "SUPERVISOR"].includes(normalizeRole(user?.role)),
    [user],
  );

  const value = {
    user,
    loading,
    error,
    success,
    login,
    logout,
    fetchAPI,
    punchIn, // ✅ Make sure these are included
    punchOut,
    safeFetchAPI,
    isAuthenticated,
    getUserRole,
    getCanonicalUserRole,
    isTeamMember,
    isManager,
    updateLocalUser,
    setError,
    setSuccess,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
