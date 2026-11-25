// contexts/DashboardContext.js
import React, { createContext, useState, useContext, useCallback } from "react";
import { useAuth } from "./AuthContext";

const DashboardContext = createContext({});
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

export const useDashboard = () => useContext(DashboardContext);

export const DashboardProvider = ({ children }) => {
  const { fetchAPI, user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  /** 🔹 Fetch dashboard data based on user role */
  const fetchDashboardData = useCallback(async (forceRefresh = false) => {
    try {
      // Return cached data if not forcing refresh and data exists
      if (!forceRefresh && dashboardData) {
        return { success: true, data: dashboardData };
      }

      setLoading(true);
      setError(null);

      const userRole = normalizeRole(user?.role);
      //console.log('Fetching dashboard for role:', userRole);

      let endpoint;
      let requestBody = {};

      // Determine API endpoint based on role
      switch (userRole) {
        case "ADMIN":
        case "SUPER_ADMIN":
        case "PROJECT_HEAD":
        case "MANAGER":
          endpoint = "/lead/HeadOfficeDashboard";
          break;
        case "SUPERVISOR":
          endpoint = "/lead/InchargeDashboard";
          break;
        case "INSTALLER":
          endpoint = "/lead/TeamDashboard";
          break;
        default:
          endpoint = "/lead/HeadOfficeDashboard";
          break;
      }

      // Fetch dashboard data
      const response = await fetchAPI(endpoint, {
        method: "GET"
      });

      //console.log('Dashboard API response:', response);

      if (response?.success) {
        const dashboardResult = response.result;
        setDashboardData(dashboardResult);
        setLastUpdated(new Date());
        return { success: true, data: dashboardResult };
      } else {
        throw new Error(response?.message || "Failed to fetch dashboard data");
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [fetchAPI, user, dashboardData]);

  /** 🔹 Refresh dashboard data */
  const refreshDashboard = async () => {
    return await fetchDashboardData(true);
  };

  /** 🔹 Clear dashboard data */
  const clearDashboardData = () => {
    setDashboardData(null);
    setError(null);
    setLastUpdated(null);
  };

  /** 🔹 Format date/time */
  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  /** 🔹 Get user role display name */
  const getRoleDisplayName = () => {
    switch (normalizeRole(user?.role)) {
      case "ADMIN": return "Admin";
      case "PROJECT_HEAD": return "Project Head";
      case "MANAGER": return "Manager";
      case "SUPERVISOR": return "Supervisor";
      case "INSTALLER": return "Installer";
      default: return "User";
    }
  };

  return (
    <DashboardContext.Provider
      value={{
        dashboardData,
        loading,
        error,
        lastUpdated,
        fetchDashboardData,
        refreshDashboard,
        clearDashboardData,
        formatDateTime,
        getRoleDisplayName,
        setError
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};
