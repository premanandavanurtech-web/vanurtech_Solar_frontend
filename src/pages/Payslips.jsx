import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  Breadcrumbs,
  Link,
  Pagination,
  useTheme,
  Alert,
  CircularProgress,
} from "@mui/material";
import {
  Search,
  Visibility,
  FileDownload,
  CalendarToday,
  AccountBalanceWallet,
  ArrowForward,
  Lock,
  HourglassEmpty,
  Print,
  CheckCircle,
  Refresh,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosConfig";
import { toast } from "../components/useToast.jsx";
import SalarySlipModal from "../components/SalarySlipDocument";
import {
  PAYROLL_STATUS,
  SLIP_STATUS,
  getMonthlySalarySlips,
  getAvailablePayrollMonths,
  getCurrentPayrollMonth,
  getMonthPeriodDetails,
} from "../utils/payrollWorkflowStorage";

const DEPARTMENTS = [
  "All Roles",
  "Incharge",
  "Supervisor",
  "Manager",
  "ZSM",
  "TEAM",
  "Admin_panel",
];

export default function Payslips() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const navigate = useNavigate();

  // Dynamic available months up to current month (no future months)
  const monthOptions = useMemo(() => getAvailablePayrollMonths(12), []);
  const initialMonth = monthOptions[0] || getCurrentPayrollMonth();

  // ─── Filter States ──────────────────────────────────────────────────
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("All Roles");
  const [page, setPage] = useState(1);
  const rowsPerPage = 8;

  // ─── Data & Modal States ────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [dbSlips, setDbSlips] = useState([]);
  const [previewSlip, setPreviewSlip] = useState(null);

  // ─── Load Real Backend Data (Users, Salary Structures, Payslips) ─────
  const loadBackendPayslips = useCallback(async (monthStr) => {
    try {
      setLoading(true);
      const parts = monthStr.split(" ");
      const monthName = parts[0] || "October";
      const yearVal = parts[1] || "2026";

      const [overviewRes, usersRes, structuresRes, payslipsRes] = await Promise.allSettled([
        axiosInstance.get(`/payroll/overview?month=${monthName}&year=${yearVal}`),
        axiosInstance.get("/user/getAllUsers?page=1&limit=200"),
        axiosInstance.get("/payroll/salary-structures"),
        axiosInstance.get(`/payroll/payslips?month=${monthName}&year=${yearVal}&limit=200`),
      ]);

      const overviewData = overviewRes.status === "fulfilled"
        ? (overviewRes.value?.data?.result || overviewRes.value?.data?.data || overviewRes.value?.data || {})
        : {};

      const currentRun = overviewData.currentRun || null;
      const attendanceSummary = overviewData.attendanceSummary || {};

      let users = [];
      if (usersRes.status === "fulfilled") {
        const root = usersRes.value?.data || {};
        const d = root.result || root.data || root;
        users = Array.isArray(d) ? d : d.users || d.data?.users || [];
      } else if (overviewData.employees && Array.isArray(overviewData.employees)) {
        users = overviewData.employees;
      }

      let structures = [];
      if (structuresRes.status === "fulfilled") {
        const sRoot = structuresRes.value?.data || {};
        const sData = sRoot.result || sRoot.data || sRoot;
        structures = sData.salaryStructures || sRoot.salaryStructures || (Array.isArray(sData) ? sData : []);
      }

      let payslipsFromDb = [];
      if (payslipsRes.status === "fulfilled") {
        const pRoot = payslipsRes.value?.data || {};
        const pData = pRoot.result || pRoot.data || pRoot;
        payslipsFromDb = pData.payslips || pRoot.payslips || (Array.isArray(pData) ? pData : []);
      }

      const templates = {
        Incharge: {
          basic: 10000,
          earnings: [
            { component: "Basic Salary", amount: 10000 },
            { component: "House Rent Allowance (HRA)", amount: 2000 },
          ],
          deductions: [
            { component: "Provident Fund (PF)", amount: 1800 },
            { component: "Professional Tax (PT)", amount: 200 },
            { component: "TDS / Tax", amount: 1000 },
          ],
        },
        Supervisor: {
          basic: 26000,
          earnings: [
            { component: "Basic Salary", amount: 26000 },
            { component: "House Rent Allowance (HRA)", amount: 10400 },
            { component: "Field Supervision Allowance", amount: 4000 },
            { component: "Site Travel Allowance", amount: 2500 },
            { component: "Communication Allowance", amount: 1000 },
          ],
          deductions: [
            { component: "Provident Fund (PF)", amount: 3120 },
            { component: "Professional Tax (PT)", amount: 200 },
            { component: "TDS / Tax", amount: 1200 },
          ],
        },
        Manager: {
          basic: 35000,
          earnings: [
            { component: "Basic Salary", amount: 35000 },
            { component: "House Rent Allowance (HRA)", amount: 14000 },
            { component: "Management Allowance", amount: 8000 },
            { component: "Travel & Conveyance", amount: 4000 },
            { component: "Performance Incentive", amount: 5000 },
          ],
          deductions: [
            { component: "Provident Fund (PF)", amount: 4200 },
            { component: "Professional Tax (PT)", amount: 200 },
            { component: "TDS / Tax", amount: 2500 },
          ],
        },
      };

      const normalizeRole = (r, d) => {
        const str = `${r || ""} ${d || ""}`.toLowerCase();
        if (str.includes("manager") || str.includes("admin") || str.includes("zsm") || str.includes("project_head")) return "Manager";
        if (str.includes("supervisor")) return "Supervisor";
        return "Incharge";
      };

      const pastelBgs = ["#bfdbfe", "#e2e8f0", "#dbeafe", "#dcfce7", "#ccfbf1", "#e0e7ff", "#f3e8ff", "#ffedd5"];
      const pastelColors = ["#1d4ed8", "#475569", "#2563eb", "#15803d", "#0f766e", "#4338ca", "#7e22ce", "#c2410c"];

      const periodDetails = getMonthPeriodDetails(monthStr);
      const totalCalendarDays = periodDetails.totalDays;

      // Scenario A: Persisted Run exists from MongoDB
      if (currentRun && Array.isArray(currentRun.employees) && currentRun.employees.length > 0) {
        const runSlips = currentRun.employees.map((row, idx) => {
          const emp = row.employee || {};
          const name = `${emp.firstName || ""} ${emp.lastName || ""}`.trim() || emp.name || row.employeeName || "Employee";
          const empRole = normalizeRole(emp.role || row.department, emp.department);
          const empId = emp.employeeId || row.empId || `E${String(idx + 1).padStart(4, "0")}`;
          const initials = `${emp.firstName?.[0] || name[0] || "E"}${emp.lastName?.[0] || ""}`.toUpperCase();

          const earnings = Array.isArray(row.earnings) && row.earnings.length > 0
            ? row.earnings.map((e) => ({ component: e.name || e.component, amount: Number(e.amount) || 0 }))
            : [
                { component: "Basic Salary", amount: Number(row.basicSalary || 10000) },
                { component: "House Rent Allowance (HRA)", amount: Number(row.allowances || 2000) },
              ];

          const deductions = Array.isArray(row.deductions) && row.deductions.length > 0
            ? row.deductions.map((d) => ({ component: d.name || d.component, amount: Number(d.amount) || 0 }))
            : [
                { component: "Provident Fund (PF)", amount: 1800 },
                { component: "Professional Tax (PT)", amount: 200 },
                { component: "TDS / Tax", amount: 1000 },
              ];

          const att = row.attendance || attendanceSummary[String(emp._id || row.employee)] || {
            totalDays: totalCalendarDays,
            presentDays: row.presentDays !== undefined ? row.presentDays : 0,
            absentDays: row.absentDays !== undefined ? row.absentDays : 13,
            leavePaid: 0,
            leaveUnpaid: 0,
            holidays: 0,
          };

          return {
            id: row._id || `run-${idx + 1}`,
            _id: emp._id || row.employee,
            name,
            employeeName: name,
            empId,
            employeeId: empId,
            department: row.department || emp.department || "Solar Technical & Installation",
            designation: row.designation || emp.designation || "Technical Incharge",
            role: emp.role || empRole,
            month: monthStr,
            payPeriod: periodDetails.payPeriod,
            joiningDate: emp.joiningDate || (emp.createdAt ? new Date(emp.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "03 Oct 2026"),
            bankName: emp.bankName || row.bankName || "State Bank of India",
            accountNo: emp.accountNumber || row.accountMasked || "XXXX XXXX 7890",
            ifscCode: emp.ifsc || "SBIN0001234",
            pan: emp.pan || row.pan || "ABCPD1234F",
            basicSalary: Number(row.basicSalary) || 10000,
            basic: Number(row.basicSalary) || 10000,
            gross: Number(row.grossSalary) || 12000,
            deductions: Number(row.totalDeductions) || 3000,
            netPay: Number(row.netSalary) || 9000,
            status: currentRun.status === "PAID" ? SLIP_STATUS.PAID : SLIP_STATUS.GENERATED,
            finalized: true,
            earnings,
            deductionDetails: deductions,
            attendance: att,
            avatarBg: pastelBgs[idx % pastelBgs.length],
            avatarColor: pastelColors[idx % pastelColors.length],
            initials,
          };
        });

        setDbSlips(runSlips);
        return;
      }

      // Scenario B: Derive from real users + real attendanceSummary + real salary structures
      const combinedSlips = users.map((u, idx) => {
        const name = `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email?.split("@")[0] || "Employee";
        const empRole = normalizeRole(u.role, u.department);
        const empId = u.employeeId || u.empId || (empRole === "Incharge" ? `I${String(idx + 15).padStart(4, "0")}` : empRole === "Supervisor" ? `S${String(idx + 10).padStart(4, "0")}` : `E${String(idx + 1).padStart(4, "0")}`);
        const initials = `${u.firstName?.[0] || name[0] || "E"}${u.lastName?.[0] || ""}`.toUpperCase();

        // Check if DB custom structure exists
        const userStruct = structures.find((s) => String(s.employee?._id || s.employee || s.user?._id || s.user) === String(u._id))?.structure
          || structures.find((s) => String(s.employee?._id || s.employee || s.user?._id || s.user) === String(u._id));

        const defaultTemplate = templates[empRole] || templates.Incharge;

        let basicSalary = Number(userStruct?.basicSalary || defaultTemplate.basic);
        let earnings = userStruct?.earnings?.length > 0
          ? userStruct.earnings.map((e) => ({ component: e.name || e.component, amount: Number(e.amount) || 0 }))
          : defaultTemplate.earnings;
        
        let deductions = userStruct?.deductions?.length > 0
          ? userStruct.deductions.map((d) => ({ component: d.name || d.component, amount: Number(d.amount) || 0 }))
          : defaultTemplate.deductions;

        const gross = earnings.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

        // Fetch real attendance from MongoDB attendance summary
        const realAtt = attendanceSummary[String(u._id)] || attendanceSummary[u.employeeId] || null;
        let attObj;
        if (realAtt) {
          attObj = {
            totalDays: realAtt.totalDays || totalCalendarDays,
            presentDays: realAtt.presentDays ?? 0,
            absentDays: realAtt.absentDays ?? 0,
            leavePaid: realAtt.leavePaid ?? 0,
            leaveUnpaid: realAtt.leaveUnpaid ?? 0,
            holidays: realAtt.holidays ?? 0,
          };
        } else {
          // If viewing current month, reconcile elapsed days
          const now = new Date();
          const isCurrentMonth = monthName.toLowerCase().startsWith(now.toLocaleString("en-US", { month: "short" }).toLowerCase()) && Number(yearVal) === now.getFullYear();
          const elapsed = isCurrentMonth ? Math.min(now.getDate(), totalCalendarDays) : totalCalendarDays;
          attObj = {
            totalDays: totalCalendarDays,
            presentDays: 0,
            absentDays: elapsed,
            leavePaid: 0,
            leaveUnpaid: 0,
            holidays: 0,
          };
        }

        // Real Loss of Pay (LOP) deduction
        const lopAmount = attObj.absentDays > 0 ? Number(((gross / (attObj.totalDays || 30)) * attObj.absentDays).toFixed(2)) : 0;
        const deductionsWithLop = [...deductions];
        if (lopAmount > 0 && !deductionsWithLop.some((d) => (d.component || d.name || "").toLowerCase().includes("lop") || (d.component || d.name || "").toLowerCase().includes("loss of pay"))) {
          deductionsWithLop.push({
            component: `Loss of Pay (LOP) - ${attObj.absentDays} Day${attObj.absentDays > 1 ? "s" : ""}`,
            amount: lopAmount,
          });
        }

        const totalDeductions = deductionsWithLop.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
        const netPay = Math.max(0, gross - totalDeductions);

        return {
          id: u._id || idx + 1,
          _id: u._id,
          name,
          employeeName: name,
          empId,
          employeeId: empId,
          department: u.department || (empRole === "Incharge" ? "Solar Technical & Installation" : `${empRole} Operations`),
          designation: u.designation || u.role || (empRole === "Incharge" ? "Technical Incharge" : empRole),
          role: u.role || empRole,
          month: monthStr,
          payPeriod: periodDetails.payPeriod,
          joiningDate: u.joiningDate || (u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "03 Oct 2026"),
          bankName: u.bankName || "State Bank of India",
          accountNo: u.accountNumber || "XXXX XXXX 7890",
          ifscCode: u.ifsc || "SBIN0001234",
          pan: u.pan || "ABCPD1234F",
          basicSalary,
          basic: basicSalary,
          gross,
          deductions: totalDeductions,
          netPay,
          status: SLIP_STATUS.GENERATED,
          finalized: true,
          earnings,
          deductionDetails: deductionsWithLop,
          attendance: attObj,
          avatarBg: pastelBgs[idx % pastelBgs.length],
          avatarColor: pastelColors[idx % pastelColors.length],
          initials,
        };
      });

      if (combinedSlips.length > 0) {
        setDbSlips(combinedSlips);
      } else {
        const local = getMonthlySalarySlips(monthStr);
        setDbSlips(local.slips || []);
      }
    } catch (err) {
      console.error("Failed to load backend payslips:", err);
      const local = getMonthlySalarySlips(monthStr);
      setDbSlips(local.slips || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBackendPayslips(selectedMonth);
  }, [selectedMonth, loadBackendPayslips]);

  const rawSlips = dbSlips;
  const isPayrollFinalized = true;

  // ─── Filtered Slips ─────────────────────────────────────────────────
  const filteredSlips = useMemo(() => {
    return rawSlips.filter((item) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.empId.toLowerCase().includes(q) ||
        (item.department || "").toLowerCase().includes(q) ||
        (item.role || "").toLowerCase().includes(q);

      const matchesDept =
        selectedDept === "All Roles" ||
        item.role === selectedDept ||
        item.department.toLowerCase().includes(selectedDept.toLowerCase()) ||
        item.designation.toLowerCase().includes(selectedDept.toLowerCase());

      return matchesSearch && matchesDept;
    });
  }, [rawSlips, searchQuery, selectedDept]);

  // Metric Totals
  const totalSlipsCount = rawSlips.length;
  const totalGrossSum = useMemo(() => rawSlips.reduce((acc, curr) => acc + (Number(curr.gross) || 0), 0), [rawSlips]);
  const totalDeductionsSum = useMemo(() => rawSlips.reduce((acc, curr) => acc + (Number(curr.deductions) || 0), 0), [rawSlips]);
  const totalNetSum = useMemo(() => rawSlips.reduce((acc, curr) => acc + (Number(curr.netPay) || 0), 0), [rawSlips]);

  // Pagination Slice
  const pageCount = Math.max(1, Math.ceil(filteredSlips.length / rowsPerPage));
  const displayedSlips = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filteredSlips.slice(start, start + rowsPerPage);
  }, [filteredSlips, page, rowsPerPage]);

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, minHeight: "100vh" }}>
      {/* ── 1. HEADER & BREADCRUMBS ──────────────────────────────────── */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 2 }}>
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
              <Typography variant="h5" fontWeight={900} sx={{ color: isDark ? "#f8fafc" : "#0f172a", letterSpacing: "-0.02em" }}>
                Salary Slips
              </Typography>
              <Chip
                label={isPayrollFinalized ? "GENERATED" : "PENDING FINALIZATION"}
                size="small"
                sx={{
                  fontWeight: 800,
                  fontSize: "0.74rem",
                  bgcolor: isPayrollFinalized
                    ? isDark ? "rgba(16, 185, 129, 0.15)" : "#f0fdf4"
                    : isDark ? "rgba(245, 158, 11, 0.15)" : "#fef3c7",
                  color: isPayrollFinalized
                    ? isDark ? "#34d399" : "#15803d"
                    : isDark ? "#fbbf24" : "#b45309",
                  border: isPayrollFinalized
                    ? "1px solid rgba(16, 185, 129, 0.3)"
                    : "1px solid rgba(245, 158, 11, 0.3)",
                }}
              />
            </Box>

            <Typography variant="body2" sx={{ color: isDark ? "#94a3b8" : "#64748b" }}>
              View and download employee salary slips for each finalized payroll month.
            </Typography>

            <Breadcrumbs sx={{ mt: 0.75, "& .MuiBreadcrumbs-separator": { color: isDark ? "#64748b" : "#94a3b8", fontSize: "0.75rem" } }}>
              <Link
                underline="hover"
                color="inherit"
                onClick={() => navigate("/dashboard")}
                sx={{ fontSize: "0.78rem", cursor: "pointer", color: isDark ? "#94a3b8" : "#64748b" }}
              >
                Home
              </Link>
              <Link
                underline="hover"
                color="inherit"
                onClick={() => navigate("/payroll")}
                sx={{ fontSize: "0.78rem", cursor: "pointer", color: isDark ? "#94a3b8" : "#64748b" }}
              >
                Payroll
              </Link>
              <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: "#1d68f0" }}>
                Salary Slips
              </Typography>
            </Breadcrumbs>
          </Box>

          {/* Month Selector & Refresh */}
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Select
              size="small"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              startAdornment={<CalendarToday sx={{ fontSize: 16, mr: 1, color: "#1d68f0" }} />}
              sx={{
                borderRadius: "10px",
                fontSize: "0.85rem",
                fontWeight: 700,
                bgcolor: isDark ? "#0d1322" : "#ffffff",
                border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e2e8f0",
                "& .MuiSelect-select": { py: 1, pr: 3 },
              }}
            >
              {monthOptions.map((m) => (
                <MenuItem key={m} value={m} sx={{ fontSize: "0.85rem", fontWeight: 600 }}>
                  {m}
                </MenuItem>
              ))}
            </Select>
            <Tooltip title="Sync with backend">
              <IconButton
                onClick={() => loadBackendPayslips(selectedMonth)}
                sx={{
                  bgcolor: isDark ? "#0d1322" : "#ffffff",
                  border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e2e8f0",
                  color: "#1d68f0",
                  borderRadius: "10px",
                }}
              >
                <Refresh sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>
      </Box>

      {/* ── 2. PAYROLL STATUS NOTIFICATION BANNER ────────────────────── */}
      {!isPayrollFinalized && (
        <Alert
          severity="info"
          sx={{
            mb: 3,
            borderRadius: "12px",
            bgcolor: isDark ? "rgba(59, 130, 246, 0.1)" : "#eff6ff",
            border: "1px solid #bfdbfe",
            "& .MuiAlert-message": { fontSize: "0.85rem", fontWeight: 600 },
          }}
        >
          Salary slips for {selectedMonth} will appear here automatically once the payroll is finalized.
        </Alert>
      )}

      {/* ── 3. STAT CARDS ────────────────────────────────────────────── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 2.2, borderRadius: "16px", bgcolor: isDark ? "#0d1322" : "#f0f7ff", border: isDark ? "1px solid rgba(59,130,246,0.2)" : "1px solid #dbeafe" }}>
            <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontWeight: 600 }}>Total Slips</Typography>
            <Typography variant="h6" fontWeight={900} sx={{ color: isDark ? "#f8fafc" : "#0f172a" }}>{totalSlipsCount}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 2.2, borderRadius: "16px", bgcolor: isDark ? "#0d1322" : "#ffffff", border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0" }}>
            <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontWeight: 600 }}>Gross Disbursed</Typography>
            <Typography variant="h6" fontWeight={900} sx={{ color: isDark ? "#f8fafc" : "#0f172a" }}>₹ {totalGrossSum.toLocaleString("en-IN")}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 2.2, borderRadius: "16px", bgcolor: isDark ? "#0d1322" : "#ffffff", border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0" }}>
            <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontWeight: 600 }}>Total Deductions</Typography>
            <Typography variant="h6" fontWeight={900} sx={{ color: "#dc2626" }}>₹ {totalDeductionsSum.toLocaleString("en-IN")}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 2.2, borderRadius: "16px", bgcolor: isDark ? "#0d1322" : "#ffffff", border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0" }}>
            <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontWeight: 600 }}>Total Net Pay</Typography>
            <Typography variant="h6" fontWeight={900} sx={{ color: "#16a34a" }}>₹ {totalNetSum.toLocaleString("en-IN")}</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* ── 4. SEARCH & FILTERS BAR ──────────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          borderRadius: "16px",
          bgcolor: isDark ? "#0d1322" : "#ffffff",
          border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <TextField
          size="small"
          placeholder="Search employee name, ID, role..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(1);
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: isDark ? "#64748b" : "#94a3b8", fontSize: 20 }} />
              </InputAdornment>
            ),
          }}
          sx={{
            minWidth: { xs: "100%", sm: 320 },
            "& .MuiOutlinedInput-root": { borderRadius: "10px", fontSize: "0.85rem" },
          }}
        />

        <Select
          size="small"
          value={selectedDept}
          onChange={(e) => {
            setSelectedDept(e.target.value);
            setPage(1);
          }}
          sx={{ borderRadius: "10px", fontSize: "0.82rem", fontWeight: 600, minWidth: 140 }}
        >
          {DEPARTMENTS.map((d) => (
            <MenuItem key={d} value={d} sx={{ fontSize: "0.82rem" }}>
              {d}
            </MenuItem>
          ))}
        </Select>
      </Paper>

      {/* ── 5. SALARY SLIPS TABLE ────────────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: "16px",
          bgcolor: isDark ? "#0d1322" : "#ffffff",
          border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0",
          overflow: "hidden",
        }}
      >
        <TableContainer>
          <Table sx={{ minWidth: 700 }}>
            <TableHead sx={{ bgcolor: isDark ? "rgba(255,255,255,0.02)" : "#f8fafc" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, fontSize: "0.8rem", color: isDark ? "#94a3b8" : "#475569" }}>
                  EMPLOYEE
                </TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: "0.8rem", color: isDark ? "#94a3b8" : "#475569" }}>
                  EMPLOYEE ID
                </TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: "0.8rem", color: isDark ? "#94a3b8" : "#475569" }}>
                  MONTH
                </TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: "0.8rem", color: isDark ? "#94a3b8" : "#475569" }}>
                  GROSS SALARY
                </TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: "0.8rem", color: isDark ? "#94a3b8" : "#475569" }}>
                  DEDUCTIONS
                </TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: "0.8rem", color: isDark ? "#94a3b8" : "#475569" }}>
                  NET PAY
                </TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: "0.8rem", color: isDark ? "#94a3b8" : "#475569" }}>
                  STATUS
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, fontSize: "0.8rem", color: isDark ? "#94a3b8" : "#475569" }}>
                  ACTIONS
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={32} sx={{ color: "#1d68f0", mb: 1.5 }} />
                    <Typography variant="body2" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontWeight: 600 }}>
                      Loading employee salary slips from backend...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : displayedSlips.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <Typography variant="body2" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontWeight: 600 }}>
                      No salary slip records found for {selectedMonth}.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                displayedSlips.map((row) => (
                  <TableRow key={row.id || row.empId} hover>
                    {/* Employee */}
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Avatar
                          sx={{
                            bgcolor: row.avatarBg || "#dbeafe",
                            color: row.avatarColor || "#1d4ed8",
                            fontWeight: 800,
                            fontSize: "0.8rem",
                            width: 36,
                            height: 36,
                          }}
                        >
                          {row.initials || row.name?.[0] || "E"}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight={800} sx={{ color: isDark ? "#f8fafc" : "#0f172a", lineHeight: 1.2 }}>
                            {row.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b" }}>
                            {row.designation || row.department}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    {/* Employee ID */}
                    <TableCell>
                      <Typography variant="body2" fontWeight={700} sx={{ fontFamily: "monospace", color: isDark ? "#cbd5e1" : "#334155" }}>
                        {row.empId}
                      </Typography>
                    </TableCell>

                    {/* Month */}
                    <TableCell>
                      <Typography variant="body2" sx={{ color: isDark ? "#cbd5e1" : "#334155", fontWeight: 600 }}>
                        {row.month || selectedMonth}
                      </Typography>
                    </TableCell>

                    {/* Gross */}
                    <TableCell>
                      <Typography variant="body2" fontWeight={700} sx={{ color: isDark ? "#f8fafc" : "#0f172a" }}>
                        ₹ {Number(row.gross || 0).toLocaleString("en-IN")}
                      </Typography>
                    </TableCell>

                    {/* Deductions */}
                    <TableCell>
                      <Typography variant="body2" fontWeight={700} sx={{ color: "#dc2626" }}>
                        ₹ {Number(row.deductions || 0).toLocaleString("en-IN")}
                      </Typography>
                    </TableCell>

                    {/* Net Pay */}
                    <TableCell>
                      <Typography variant="body2" fontWeight={900} sx={{ color: "#16a34a" }}>
                        ₹ {Number(row.netPay || 0).toLocaleString("en-IN")}
                      </Typography>
                    </TableCell>

                    {/* Slip Status */}
                    <TableCell>
                      {row.status === SLIP_STATUS.GENERATED && isPayrollFinalized ? (
                        <Chip
                          label="Generated"
                          size="small"
                          sx={{
                            fontWeight: 800,
                            fontSize: "0.75rem",
                            bgcolor: isDark ? "rgba(16, 185, 129, 0.15)" : "#f0fdf4",
                            color: isDark ? "#34d399" : "#15803d",
                            border: "1px solid rgba(16, 185, 129, 0.3)",
                          }}
                        />
                      ) : row.status === SLIP_STATUS.NEEDS_REGENERATION ? (
                        <Chip
                          label="Needs Regeneration"
                          size="small"
                          sx={{
                            fontWeight: 800,
                            fontSize: "0.75rem",
                            bgcolor: isDark ? "rgba(244, 63, 94, 0.15)" : "#fff1f2",
                            color: isDark ? "#fb7185" : "#e11d48",
                            border: "1px solid rgba(244, 63, 94, 0.3)",
                          }}
                        />
                      ) : (
                        <Chip
                          label="Not Generated"
                          size="small"
                          sx={{
                            fontWeight: 700,
                            fontSize: "0.75rem",
                            bgcolor: isDark ? "rgba(245, 158, 11, 0.15)" : "#fef3c7",
                            color: isDark ? "#fbbf24" : "#b45309",
                            border: "1px solid rgba(245, 158, 11, 0.3)",
                          }}
                        />
                      )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<Visibility sx={{ fontSize: 16 }} />}
                          onClick={() => setPreviewSlip(row)}
                          sx={{
                            borderRadius: "8px",
                            textTransform: "none",
                            fontWeight: 700,
                            fontSize: "0.78rem",
                            py: 0.3,
                            px: 1.2,
                            borderColor: isDark ? "rgba(255,255,255,0.15)" : "#cbd5e1",
                            color: isDark ? "#f8fafc" : "#0f172a",
                          }}
                        >
                          View
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<FileDownload sx={{ fontSize: 16 }} />}
                          onClick={() => setPreviewSlip(row)}
                          sx={{
                            borderRadius: "8px",
                            textTransform: "none",
                            fontWeight: 700,
                            fontSize: "0.78rem",
                            py: 0.3,
                            px: 1.2,
                            bgcolor: "#1d68f0",
                            "&:hover": { bgcolor: "#1557d0" },
                          }}
                        >
                          Download
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <Box sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
          <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b" }}>
            Showing {displayedSlips.length} of {filteredSlips.length} salary slips
          </Typography>
          <Pagination
            count={pageCount}
            page={page}
            onChange={(_, newPage) => setPage(newPage)}
            color="primary"
            size="small"
            shape="rounded"
          />
        </Box>
      </Paper>

      {/* ── 6. SALARY SLIP PREVIEW & PDF DOWNLOAD MODAL ──────────────── */}
      <SalarySlipModal
        open={Boolean(previewSlip)}
        onClose={() => setPreviewSlip(null)}
        slipData={previewSlip}
      />
    </Box>
  );
}
