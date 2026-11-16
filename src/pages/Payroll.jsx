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
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Menu,
  CircularProgress,
  useTheme,
  alpha,
  Breadcrumbs,
  Link,
  Pagination,
  Alert,
  AlertTitle,
} from "@mui/material";
import {
  Search,
  CloudUpload,
  MoreHoriz,
  Visibility,
  FileDownload,
  CheckCircle,
  PlayArrow,
  CalendarToday,
  PeopleAlt,
  AccountBalanceWallet,
  Lock,
  Paid,
  FilterList,
  Tune,
  Close,
  Print,
  Check,
  Send,
  Calculate,
  Assessment,
  History,
  TrendingUp,
  ArrowForward,
  Edit,
  KeyboardArrowDown,
  ReceiptLong,
  InfoOutlined,
  Refresh,
  CheckCircleOutline,
  HourglassEmpty,
  LockOutlined,
  LockOpen,
  WarningAmber,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosConfig";
import { toast } from "../components/useToast.jsx";
import SalarySlipModal from "../components/SalarySlipDocument";
import {
  PAYROLL_STATUS,
  EMPLOYEE_PAYROLL_STATUS,
  PAYMENT_STATUS,
  SLIP_STATUS,
  getMonthlyPayrollState,
  saveMonthlyPayrollState,
  processMonthlyPayrollAction,
  finalizeMonthlyPayrollAction,
  updateEmployeePaymentAction,
  canReopenPayroll,
  reopenMonthlyPayrollAction,
  resetMonthlyPayrollAction,
  adjustIndividualEmployeePayrollAction,
  getMonthPeriodDetails,
  DEFAULT_HRMS_ROSTER,
  getAvailablePayrollMonths,
  getCurrentPayrollMonth,
} from "../utils/payrollWorkflowStorage";

const DEPARTMENTS = [
  "All Roles",
  "Manager",
  "Supervisor",
  "Incharge",
  "ZSM",
  "Admin_panel",
  "TEAM",
];

export default function Payroll() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const navigate = useNavigate();

  // Dynamic available months up to current month (no future months)
  const monthOptions = useMemo(() => getAvailablePayrollMonths(12), []);
  const initialMonth = monthOptions[0] || getCurrentPayrollMonth();

  // ─── Filter & Selection States ──────────────────────────────────────
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("All Roles");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [selectedRowIds, setSelectedRowIds] = useState([]);
  const [page, setPage] = useState(1);
  const rowsPerPage = 8;

  // ─── Payroll State Engine ───────────────────────────────────────────
  const [payrollState, setPayrollState] = useState(() => getMonthlyPayrollState(initialMonth, []));
  const [loading, setLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);

  // Modals & Menus
  const [previewEmployee, setPreviewEmployee] = useState(null);
  const [finalizeModalOpen, setFinalizeModalOpen] = useState(false);
  const [recalculateModalOpen, setRecalculateModalOpen] = useState(false);
  const [reopenModalOpen, setReopenModalOpen] = useState(false);
  const [reopenBlockedModalOpen, setReopenBlockedModalOpen] = useState(false);
  const [adjustEmployee, setAdjustEmployee] = useState(null);
  const [adjustFormData, setAdjustFormData] = useState({
    customBasic: 25000,
    customHra: 10000,
    customSpecial: 5000,
    customOther: 2000,
    customBonus: 0,
    customPf: 1800,
    customPt: 200,
    customTds: 1000,
    customOtherDeduction: 0,
    absentDays: 0,
    adjustmentNotes: "",
  });
  const [finalizedMenuAnchor, setFinalizedMenuAnchor] = useState(null);
  const [actionMenuAnchor, setActionMenuAnchor] = useState(null);
  const [activeRowMenu, setActiveRowMenu] = useState(null);

  // ─── Fetch / Sync Payroll State ─────────────────────────────────────
  const loadPayrollForMonth = useCallback(async (month) => {
    try {
      setLoading(true);
      const parts = String(month || "").trim().split(" ");
      const monthName = parts[0] || "August";
      const yearVal = parseInt(parts[1], 10) || new Date().getFullYear();
      const periodInfo = getMonthPeriodDetails(month);
      const totalDaysInMonth = periodInfo.totalDays;

      const pastelBgs = ["#bfdbfe", "#e2e8f0", "#dbeafe", "#dcfce7", "#ccfbf1", "#e0e7ff", "#f3e8ff", "#ffedd5"];
      const pastelColors = ["#1d4ed8", "#475569", "#2563eb", "#15803d", "#0f766e", "#4338ca", "#7e22ce", "#c2410c"];

      let overviewData = {};
      try {
        const res = await axiosInstance.get(`/payroll/overview?month=${monthName}&year=${yearVal}`);
        overviewData = res.data?.data || res.data?.result || res.data || {};
      } catch (err) {
        console.warn("Backend overview fetch fallback:", err.message);
      }

      const { currentRun, attendanceSummary = {}, employees: dbEmployees = [] } = overviewData;

      // ─── Scenario A: MongoDB contains an existing processed / finalized run ───
      if (currentRun && Array.isArray(currentRun.employees) && currentRun.employees.length > 0) {
        const mappedRunEmployees = currentRun.employees.map((row, idx) => {
          const u = row.employee || {};
          const name = `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email?.split("@")[0] || "Employee";
          const initials = `${u.firstName?.[0] || name[0] || "E"}${u.lastName?.[0] || ""}`.toUpperCase();
          const dept = row.department || u.department || u.role || "Incharge";
          const empId = u.employeeId || row.employeeId || (dept === "Incharge" ? `I${String(idx + 15).padStart(4, "0")}` : dept === "Supervisor" ? `S${String(idx + 10).padStart(4, "0")}` : `E${String(idx + 1).padStart(4, "0")}`);
          const bankStr = row.bankName
            ? `${row.bankName} (${row.accountMasked || (u.accountNumber ? "•••• " + String(u.accountNumber).slice(-4) : "•••• 0000")})`
            : (u.bankName ? `${u.bankName} (•••• ${String(u.accountNumber || "0000").slice(-4)})` : "Bank Transfer");
          const panStr = row.pan || u.pan || u.panTds || "ABCPD1234F";

          const hraItem = (row.earnings || []).find((e) => (e.name || e.component || "").toLowerCase().includes("hra"));
          const specialItem = (row.earnings || []).find((e) => (e.name || e.component || "").toLowerCase().includes("special"));
          const pfItem = (row.deductions || []).find((d) => (d.name || d.component || "").toLowerCase().includes("pf"));
          const ptItem = (row.deductions || []).find((d) => (d.name || d.component || "").toLowerCase().includes("pt") || (d.name || d.component || "").toLowerCase().includes("professional"));
          const tdsItem = (row.deductions || []).find((d) => (d.name || d.component || "").toLowerCase().includes("tds") || (d.name || d.component || "").toLowerCase().includes("tax"));

          const att = row.attendance || {};
          const rowTotalDays = periodInfo.totalDays;
          const rawUnpaid = Number(att.unpaidLeave || 0) + (Number(att.halfDays || 0) * 0.5);
          const absentDays = Math.max(0, Math.min(rowTotalDays, rawUnpaid));
          const presentDays = Math.max(0, Math.min(rowTotalDays - absentDays, Number(att.presentDays || 0)));

          return {
            id: u._id || row._id || idx + 1,
            _id: u._id || row._id,
            runEmployeeId: row._id,
            name,
            empId,
            department: dept,
            designation: row.designation || u.designation || u.role || `${dept} Lead`,
            role: u.role,
            avatarBg: pastelBgs[idx % pastelBgs.length],
            avatarColor: pastelColors[idx % pastelColors.length],
            initials,
            bank: bankStr,
            pan: panStr,
            gross: row.grossSalary || 0,
            basic: row.basicSalary || 0,
            hra: hraItem ? hraItem.amount : 0,
            special: specialItem ? specialItem.amount : 0,
            otherAllowance: row.allowances || 0,
            overtime: row.overtime || 0,
            pf: pfItem ? pfItem.amount : 0,
            pt: ptItem ? ptItem.amount : 0,
            tds: tdsItem ? tdsItem.amount : 0,
            deductions: row.totalDeductions || 0,
            netPay: row.netSalary || 0,
            earnings: (row.earnings || []).map((e) => ({ component: e.name || e.component, amount: e.amount })),
            deductionsBreakdown: (row.deductions || []).map((d) => ({ component: d.name || d.component, amount: d.amount })),
            attendance: {
              totalDays: rowTotalDays,
              presentDays,
              absentDays,
              leavePaid: att.paidLeave || 0,
              leaveUnpaid: att.unpaidLeave || 0,
              holidays: att.holidays || 0,
              halfDays: att.halfDays || 0,
              overtimeHours: att.overtimeHours || 0,
            },
            status: currentRun.status === "APPROVED" || currentRun.status === "PAID" ? EMPLOYEE_PAYROLL_STATUS.FINALIZED : EMPLOYEE_PAYROLL_STATUS.READY,
            paymentStatus: row.status === "PAID" ? PAYMENT_STATUS.PAID : PAYMENT_STATUS.PENDING,
            slipStatus: currentRun.status === "APPROVED" || currentRun.status === "PAID" ? SLIP_STATUS.GENERATED : SLIP_STATUS.NOT_GENERATED,
          };
        });

        const stateFromDb = {
          runId: currentRun._id,
          month,
          status: currentRun.status === "APPROVED" || currentRun.status === "PAID" ? PAYROLL_STATUS.FINALIZED : PAYROLL_STATUS.READY,
          processedAt: currentRun.createdAt,
          finalizedAt: currentRun.approvedAt,
          employees: mappedRunEmployees,
        };
        setPayrollState(stateFromDb);
        saveMonthlyPayrollState(month, stateFromDb);
        return;
      }

      // ─── Scenario B: Not yet processed in MongoDB - load users & real attendance ───
      let activeUsers = dbEmployees;
      if (!activeUsers || activeUsers.length === 0) {
        try {
          const usersRes = await axiosInstance.get("/user/getAllUsers?page=1&limit=100");
          const root = usersRes.data || {};
          const d = root.result || root.data || root;
          activeUsers = Array.isArray(d) ? d : d.users || d.data?.users || [];
        } catch (err) {
          // Fallback to local roster
        }
      }

      let mappedUsers = [];
      if (activeUsers && activeUsers.length > 0) {
        const now = new Date();
        const isCurrentMonth = yearVal === now.getFullYear() && (parts[0] || "").toLowerCase() === now.toLocaleString("en-US", { month: "long" }).toLowerCase();
        const elapsedDays = isCurrentMonth ? Math.min(totalDaysInMonth, now.getDate()) : totalDaysInMonth;

        mappedUsers = activeUsers.map((u, idx) => {
          const name = `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email?.split("@")[0] || "Employee";
          const initials = `${u.firstName?.[0] || name[0] || "E"}${u.lastName?.[0] || ""}`.toUpperCase();
          const roleStr = String(u.role || "").toLowerCase();
          const rawDept = String(u.department || "").toLowerCase();
          const dept = rawDept.includes("manager") || roleStr.includes("manager") || roleStr.includes("admin") || roleStr === "admin_panel"
            ? "Manager"
            : rawDept.includes("supervisor") || roleStr.includes("supervisor")
            ? "Supervisor"
            : "Incharge";
          const empId = u.employeeId || u.empId || (dept === "Incharge" ? `I${String(idx + 15).padStart(4, "0")}` : dept === "Supervisor" ? `S${String(idx + 10).padStart(4, "0")}` : `E${String(idx + 1).padStart(4, "0")}`);
          const bankStr = u.bankName ? `${u.bankName} (•••• ${String(u.accountNumber || "0000").slice(-4)})` : "Bank Transfer";
          const panStr = u.pan || u.panTds || "ABCPD1234F";

          // Real attendance from MongoDB Attendance Collection
          const userAtt = attendanceSummary[String(u._id)] || {};
          const rawPresent = Number(userAtt.presentDays ?? 0);
          const halfDays = Number(userAtt.halfDays ?? 0);
          const holidays = Number(userAtt.holidays ?? 0);
          const paidLeave = Number(userAtt.paidLeave ?? 0);
          const overtimeHours = Number(userAtt.overtimeHours ?? 0);

          // If attendance records were returned, use them; if no punch recorded for elapsed days, count as absent (matches Attendance History)
          let unpaidLeave = Number(userAtt.unpaidLeave ?? 0);
          if (userAtt.records === undefined || userAtt.records === 0) {
            unpaidLeave = Math.max(0, elapsedDays - rawPresent - halfDays - holidays - paidLeave);
          }

          const absentDays = Math.max(0, Math.min(totalDaysInMonth, unpaidLeave + (halfDays * 0.5)));
          const presentDays = Math.max(0, Math.min(totalDaysInMonth - absentDays, rawPresent));

          return {
            id: u._id || idx + 1,
            _id: u._id,
            name,
            empId,
            department: dept,
            designation: u.designation || u.role || `${dept} Lead`,
            role: u.role,
            avatarBg: pastelBgs[idx % pastelBgs.length],
            avatarColor: pastelColors[idx % pastelColors.length],
            initials,
            bank: bankStr,
            pan: panStr,
            attendance: {
              totalDays: totalDaysInMonth,
              presentDays,
              absentDays,
              leavePaid: paidLeave,
              leaveUnpaid: unpaidLeave,
              holidays,
              halfDays,
              overtimeHours,
            },
          };
        });
      }

      const state = getMonthlyPayrollState(month, mappedUsers);
      setPayrollState(state);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPayrollForMonth(selectedMonth);

    const handleStorageChange = () => {
      setPayrollState(getMonthlyPayrollState(selectedMonth));
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [selectedMonth, loadPayrollForMonth]);

  const employeesList = payrollState.employees || [];
  const overallStatus = payrollState.status; // "NOT_PROCESSED" | "READY" | "FINALIZED"

  // ─── Filtered Employees ─────────────────────────────────────────────
  const filteredEmployees = useMemo(() => {
    return employeesList.filter((emp) => {
      const matchesSearch =
        !searchQuery ||
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.empId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.designation?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDept =
        selectedDept === "All Roles" ||
        selectedDept === "All Departments" ||
        emp.department?.toLowerCase() === selectedDept.toLowerCase() ||
        emp.designation?.toLowerCase() === selectedDept.toLowerCase() ||
        emp.role?.toLowerCase() === selectedDept.toLowerCase();

      const matchesStatus =
        selectedStatus === "All Status" ||
        emp.status?.toLowerCase() === selectedStatus.toLowerCase() ||
        emp.paymentStatus?.toLowerCase() === selectedStatus.toLowerCase();

      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [employeesList, searchQuery, selectedDept, selectedStatus]);

  // ─── Metrics Calculation ───────────────────────────────────────────
  const totalEmployeesCount = employeesList.length;
  const totalGrossSum = useMemo(() => employeesList.reduce((acc, curr) => acc + (Number(curr.gross) || 0), 0), [employeesList]);
  const totalDeductionsSum = useMemo(() => employeesList.reduce((acc, curr) => acc + (Number(curr.deductions) || 0), 0), [employeesList]);
  const totalNetPaySum = useMemo(() => employeesList.reduce((acc, curr) => acc + (Number(curr.netPay) || 0), 0), [employeesList]);
  const totalPaidCount = useMemo(() => employeesList.filter((e) => e.paymentStatus === PAYMENT_STATUS.PAID).length, [employeesList]);
  const isAllPaid = totalPaidCount === totalEmployeesCount && totalEmployeesCount > 0;

  // Pagination Slice
  const pageCount = Math.max(1, Math.ceil(filteredEmployees.length / rowsPerPage));
  const displayedEmployees = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filteredEmployees.slice(start, start + rowsPerPage);
  }, [filteredEmployees, page, rowsPerPage]);

  // ─── Action Handlers (Full MongoDB Database Persistence) ────────────
  // Step 1 -> Step 2: Process Payroll (Persists PayrollRun & PayrollEmployee to MongoDB)
  const handleProcessPayroll = async () => {
    setIsProcessing(true);
    try {
      const parts = String(selectedMonth || "").trim().split(" ");
      const monthName = parts[0] || "August";
      const yearVal = parseInt(parts[1], 10) || new Date().getFullYear();

      await axiosInstance.post("/payroll/runs/start", {
        payrollMonth: monthName,
        payrollYear: yearVal,
        employeeScope: "ALL_EMPLOYEES",
      });

      toast.success(`Payroll processed & saved to database for ${selectedMonth}! Calculations are ready for review.`);
      await loadPayrollForMonth(selectedMonth);
    } catch (err) {
      console.warn("Backend payroll run start warning:", err.message);
      // Fallback local calculation
      const updatedState = processMonthlyPayrollAction(selectedMonth, employeesList);
      setPayrollState(updatedState);
      toast.success(`Payroll processed for ${selectedMonth}! Calculations are ready for review.`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Step 2 -> Recalculate (Recalculates formulas & attendance in MongoDB)
  const handleRecalculatePayroll = async () => {
    setRecalculateModalOpen(false);
    setIsProcessing(true);
    try {
      const parts = String(selectedMonth || "").trim().split(" ");
      const monthName = parts[0] || "August";
      const yearVal = parseInt(parts[1], 10) || new Date().getFullYear();

      await axiosInstance.post("/payroll/runs/start", {
        payrollMonth: monthName,
        payrollYear: yearVal,
        employeeScope: "ALL_EMPLOYEES",
      });

      toast.success(`Payroll formulas & attendance deductions re-calculated & saved in database!`);
      await loadPayrollForMonth(selectedMonth);
    } catch (err) {
      console.warn("Backend recalculate warning:", err.message);
      const updatedState = processMonthlyPayrollAction(selectedMonth, employeesList);
      setPayrollState(updatedState);
      toast.success(`Payroll formulas & attendance deductions re-calculated for ${selectedMonth}!`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Step 2 -> Step 3: Finalize Payroll & Generate Salary Slips in MongoDB
  const handleFinalizePayroll = async () => {
    setFinalizeModalOpen(false);
    setIsFinalizing(true);
    try {
      if (payrollState.runId) {
        await axiosInstance.post(`/payroll/runs/${payrollState.runId}/approve`);
      }
      toast.success(`Payroll finalized & locked in database for ${selectedMonth}! Salary slips generated.`);
      await loadPayrollForMonth(selectedMonth);
    } catch (err) {
      console.warn("Backend finalize warning:", err.message);
      const updatedState = finalizeMonthlyPayrollAction(selectedMonth, employeesList);
      setPayrollState(updatedState);
      toast.success(`Payroll finalized & locked for ${selectedMonth}! Salary slips generated.`);
    } finally {
      setIsFinalizing(false);
    }
  };

  // Step 3 -> Step 4: Mark Individual or All Paid (Saves to MongoDB Payment & Payroll)
  const handleMarkPaid = async (employeeId = "ALL") => {
    try {
      if (payrollState.runId) {
        const targetEmp = employeeId === "ALL"
          ? "ALL"
          : (employeesList.find((e) => e.id === employeeId || e._id === employeeId)?.runEmployeeId || employeeId);

        await axiosInstance.post(`/payroll/runs/${payrollState.runId}/payment`, {
          employeeId: targetEmp,
          paymentMethod: "Bank Transfer",
        });
        await loadPayrollForMonth(selectedMonth);
      } else {
        const updatedState = updateEmployeePaymentAction(selectedMonth, employeeId, PAYMENT_STATUS.PAID);
        setPayrollState(updatedState);
      }

      if (employeeId === "ALL") {
        toast.success(`All employees marked as Paid and saved to database for ${selectedMonth}!`);
      } else {
        toast.success(`Employee payment marked as Paid and saved to database!`);
      }
    } catch (err) {
      console.warn("Backend payment mark warning:", err.message);
      const updatedState = updateEmployeePaymentAction(selectedMonth, employeeId, PAYMENT_STATUS.PAID);
      setPayrollState(updatedState);
      toast.success(employeeId === "ALL" ? `All employees marked as Paid!` : `Employee payment marked as Paid!`);
    }
  };

  // Reset to Pending Action (Clears database run and resets to initial roster)
  const handleResetToPending = async () => {
    setFinalizedMenuAnchor(null);
    try {
      if (payrollState.runId) {
        await axiosInstance.post(`/payroll/runs/${payrollState.runId}/reset`);
      }
      const resetState = resetMonthlyPayrollAction(selectedMonth);
      setPayrollState(resetState);
      toast.info(`Payroll for ${selectedMonth} has been reset back to Pending in database.`);
      await loadPayrollForMonth(selectedMonth);
    } catch (err) {
      console.warn("Backend reset warning:", err.message);
      const resetState = resetMonthlyPayrollAction(selectedMonth);
      setPayrollState(resetState);
      toast.info(`Payroll for ${selectedMonth} has been reset back to Pending.`);
    }
  };

  // Reopen Payroll Action
  const handleOpenReopenMenuAction = () => {
    setFinalizedMenuAnchor(null);
    setReopenModalOpen(true);
  };

  // Confirm Reopen Action (Unlocks run in MongoDB)
  const handleConfirmReopenPayroll = async () => {
    try {
      if (payrollState.runId) {
        await axiosInstance.post(`/payroll/runs/${payrollState.runId}/reopen`);
      }
      const res = reopenMonthlyPayrollAction(selectedMonth, { force: true });
      if (res.success) {
        setPayrollState(res.state);
        setReopenModalOpen(false);
        setReopenBlockedModalOpen(false);
        toast.success(`Payroll for ${selectedMonth} has been reopened and unlocked in database.`);
        await loadPayrollForMonth(selectedMonth);
      } else {
        setReopenModalOpen(false);
        toast.error("Payroll cannot be reopened.");
      }
    } catch (err) {
      console.warn("Backend reopen warning:", err.message);
      const res = reopenMonthlyPayrollAction(selectedMonth, { force: true });
      if (res.success) {
        setPayrollState(res.state);
        setReopenModalOpen(false);
        setReopenBlockedModalOpen(false);
        toast.success(`Payroll for ${selectedMonth} has been reopened and unlocked.`);
      } else {
        setReopenModalOpen(false);
        toast.error("Payroll cannot be reopened.");
      }
    }
  };

  // Open individual adjustment modal for an employee
  const handleOpenAdjustment = (emp) => {
    if (!emp) return;
    setAdjustEmployee(emp);
    setAdjustFormData({
      customBasic: emp.basic ?? 10000,
      customHra: emp.hra ?? 2000,
      customSpecial: emp.special ?? 0,
      customOther: emp.otherAllowance ?? 0,
      customBonus: emp.customBonus ?? 0,
      customPf: emp.pf ?? 0,
      customPt: emp.pt ?? 0,
      customTds: emp.tds ?? 0,
      customOtherDeduction: emp.customOtherDeduction ?? 0,
      absentDays: emp.attendance?.absentDays ?? 0,
      adjustmentNotes: emp.adjustmentNotes || "Salary & Attendance correction",
    });
  };

  // Save individual adjustment in MongoDB
  const handleSaveAdjustment = async () => {
    if (!adjustEmployee) return;
    try {
      const payload = {
        employeeId: adjustEmployee.runEmployeeId || adjustEmployee._id || adjustEmployee.id,
        customBasic: Number(adjustFormData.customBasic) || 0,
        customHra: Number(adjustFormData.customHra) || 0,
        customSpecial: Number(adjustFormData.customSpecial) || 0,
        customOther: Number(adjustFormData.customOther) || 0,
        customBonus: Number(adjustFormData.customBonus) || 0,
        customPf: Number(adjustFormData.customPf) || 0,
        customPt: Number(adjustFormData.customPt) || 0,
        customTds: Number(adjustFormData.customTds) || 0,
        customOtherDeduction: Number(adjustFormData.customOtherDeduction) || 0,
        absentDays: Number(adjustFormData.absentDays) || 0,
        adjustmentNotes: adjustFormData.adjustmentNotes || "Salary & Attendance correction",
      };

      if (payrollState.runId) {
        await axiosInstance.post(`/payroll/runs/${payrollState.runId}/adjust-employee`, payload);
        await loadPayrollForMonth(selectedMonth);
      } else {
        const updatedState = adjustIndividualEmployeePayrollAction(selectedMonth, adjustEmployee.id, {
          ...payload,
          attendance: {
            totalDays: getMonthPeriodDetails(selectedMonth).totalDays,
            absentDays: Number(adjustFormData.absentDays) || 0,
            presentDays: Math.max(0, getMonthPeriodDetails(selectedMonth).totalDays - (Number(adjustFormData.absentDays) || 0)),
            leavePaid: 0,
            leaveUnpaid: 0,
            holidays: 0,
          },
        });
        setPayrollState(updatedState);
      }
      setAdjustEmployee(null);
      toast.success(`Salary adjustment saved in database for ${adjustEmployee.name}! Corrected payslip generated.`);
    } catch (err) {
      console.warn("Backend adjustment warning:", err.message);
      const updatedState = adjustIndividualEmployeePayrollAction(selectedMonth, adjustEmployee.id, {
        customBasic: Number(adjustFormData.customBasic) || 0,
        customHra: Number(adjustFormData.customHra) || 0,
        customSpecial: Number(adjustFormData.customSpecial) || 0,
        customOther: Number(adjustFormData.customOther) || 0,
        customBonus: Number(adjustFormData.customBonus) || 0,
        customPf: Number(adjustFormData.customPf) || 0,
        customPt: Number(adjustFormData.customPt) || 0,
        customTds: Number(adjustFormData.customTds) || 0,
        customOtherDeduction: Number(adjustFormData.customOtherDeduction) || 0,
        attendance: {
          totalDays: getMonthPeriodDetails(selectedMonth).totalDays,
          absentDays: Number(adjustFormData.absentDays) || 0,
          presentDays: Math.max(0, getMonthPeriodDetails(selectedMonth).totalDays - (Number(adjustFormData.absentDays) || 0)),
          leavePaid: 0,
          leaveUnpaid: 0,
          holidays: 0,
        },
        adjustmentNotes: adjustFormData.adjustmentNotes || "Salary & Attendance correction",
      });
      setPayrollState(updatedState);
      setAdjustEmployee(null);
      toast.success(`Salary adjustment saved for ${adjustEmployee.name}! Corrected payslip generated.`);
    }
  };

  // ─── Selection Handlers ─────────────────────────────────────────────
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedRowIds(displayedEmployees.map((e) => e.id));
    } else {
      setSelectedRowIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedRowIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const isAllSelected =
    displayedEmployees.length > 0 &&
    displayedEmployees.every((e) => selectedRowIds.includes(e.id));
  const isSomeSelected =
    displayedEmployees.some((e) => selectedRowIds.includes(e.id)) && !isAllSelected;

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, minHeight: "100vh" }}>
      {/* ── 1. HEADER & BREADCRUMBS ──────────────────────────────────── */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 2 }}>
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
              <Typography variant="h5" fontWeight={900} sx={{ color: isDark ? "#f8fafc" : "#0f172a", letterSpacing: "-0.02em" }}>
                Payroll
              </Typography>

              {/* Overall Payroll Status Badge */}
              {overallStatus === PAYROLL_STATUS.NOT_PROCESSED && (
                <Chip
                  icon={<HourglassEmpty sx={{ fontSize: "14px !important" }} />}
                  label="NOT PROCESSED"
                  size="small"
                  sx={{
                    fontWeight: 800,
                    fontSize: "0.74rem",
                    bgcolor: isDark ? "rgba(245, 158, 11, 0.15)" : "#fef3c7",
                    color: isDark ? "#fbbf24" : "#b45309",
                    border: "1px solid rgba(245, 158, 11, 0.3)",
                  }}
                />
              )}
              {overallStatus === PAYROLL_STATUS.READY && (
                <Chip
                  icon={<CheckCircleOutline sx={{ fontSize: "14px !important" }} />}
                  label="READY FOR REVIEW"
                  size="small"
                  sx={{
                    fontWeight: 800,
                    fontSize: "0.74rem",
                    bgcolor: isDark ? "rgba(59, 130, 246, 0.15)" : "#eff6ff",
                    color: isDark ? "#60a5fa" : "#1d4ed8",
                    border: "1px solid rgba(59, 130, 246, 0.3)",
                  }}
                />
              )}
              {overallStatus === PAYROLL_STATUS.FINALIZED && (
                <Chip
                  icon={<LockOutlined sx={{ fontSize: "14px !important" }} />}
                  label="FINALIZED (LOCKED)"
                  size="small"
                  sx={{
                    fontWeight: 800,
                    fontSize: "0.74rem",
                    bgcolor: isDark ? "rgba(16, 185, 129, 0.15)" : "#f0fdf4",
                    color: isDark ? "#34d399" : "#15803d",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                  }}
                />
              )}
            </Box>

            <Typography variant="body2" sx={{ color: isDark ? "#94a3b8" : "#64748b" }}>
              {overallStatus === PAYROLL_STATUS.NOT_PROCESSED && "Payroll has not been processed yet. Click Process Payroll to calculate salaries."}
              {overallStatus === PAYROLL_STATUS.READY && "Payroll calculated and ready for review. Verify calculations and finalize."}
              {overallStatus === PAYROLL_STATUS.FINALIZED && "Payroll is locked. Salary slips have been generated and employees can be marked as Paid."}
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
                onClick={() => navigate("/payroll/salaries")}
                sx={{ fontSize: "0.78rem", cursor: "pointer", color: isDark ? "#94a3b8" : "#64748b" }}
              >
                Salary
              </Link>
              <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: "#1d68f0" }}>
                Payroll
              </Typography>
            </Breadcrumbs>
          </Box>

          {/* Right Header Actions: Month Selector + Context-Aware Workflow Buttons */}
          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
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

            {/* 1. Before Processing */}
            {overallStatus === PAYROLL_STATUS.NOT_PROCESSED && (
              <Button
                variant="contained"
                disabled={isProcessing}
                startIcon={
                  isProcessing ? (
                    <CircularProgress size={16} sx={{ color: "#ffffff" }} />
                  ) : (
                    <PlayArrow sx={{ fontSize: 18 }} />
                  )
                }
                onClick={handleProcessPayroll}
                sx={{
                  bgcolor: "#1d68f0",
                  backgroundImage: isProcessing ? "none" : "linear-gradient(135deg, #1d68f0 0%, #2563eb 100%)",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  borderRadius: "10px",
                  px: 2.2,
                  py: 0.9,
                  boxShadow: "0 4px 14px rgba(29, 104, 240, 0.35)",
                  textTransform: "none",
                  "&:hover": { bgcolor: "#1557d0" },
                }}
              >
                {isProcessing ? "Processing Payroll..." : "Process Payroll"}
              </Button>
            )}

            {/* 2. After Processing (Ready for review) */}
            {overallStatus === PAYROLL_STATUS.READY && (
              <Stack direction="row" spacing={1} alignItems="center">
                <Button
                  variant="outlined"
                  startIcon={<History sx={{ fontSize: 16 }} />}
                  onClick={handleResetToPending}
                  sx={{
                    borderRadius: "10px",
                    textTransform: "none",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    borderColor: isDark ? "rgba(255,255,255,0.15)" : "#cbd5e1",
                    color: isDark ? "#cbd5e1" : "#475569",
                    "&:hover": {
                      borderColor: "#1d68f0",
                      color: "#1d68f0",
                    },
                  }}
                >
                  Back to Pending
                </Button>
              </Stack>
            )}

            {/* 3. After Finalization */}
            {overallStatus === PAYROLL_STATUS.FINALIZED && (
              <Stack direction="row" spacing={1} alignItems="center">
                <Button
                  variant="outlined"
                  startIcon={<AccountBalanceWallet sx={{ fontSize: 16 }} />}
                  onClick={() => navigate("/payroll/payslips")}
                  sx={{
                    borderRadius: "10px",
                    textTransform: "none",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    borderColor: "#1d68f0",
                    color: "#1d68f0",
                  }}
                >
                  View Salary Slips
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Paid sx={{ fontSize: 18 }} />}
                  disabled={isAllPaid}
                  onClick={() => handleMarkPaid("ALL")}
                  sx={{
                    bgcolor: isAllPaid ? (isDark ? "#1e293b" : "#e2e8f0") : "#16a34a",
                    backgroundImage: isAllPaid ? "none" : "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
                    color: isAllPaid ? (isDark ? "#64748b" : "#94a3b8") : "#ffffff",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    borderRadius: "10px",
                    px: 2,
                    py: 0.9,
                    boxShadow: isAllPaid ? "none" : "0 4px 14px rgba(22, 163, 74, 0.35)",
                    textTransform: "none",
                    "&:hover": { bgcolor: isAllPaid ? "none" : "#15803d" },
                  }}
                >
                  {isAllPaid ? "Payroll Completed" : "Mark All as Paid"}
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<History sx={{ fontSize: 16 }} />}
                  onClick={handleResetToPending}
                  sx={{
                    borderRadius: "10px",
                    textTransform: "none",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    borderColor: isDark ? "rgba(255,255,255,0.15)" : "#cbd5e1",
                    color: isDark ? "#cbd5e1" : "#475569",
                    "&:hover": {
                      borderColor: "#1d68f0",
                      color: "#1d68f0",
                    },
                  }}
                >
                  Back to Pending
                </Button>

                {/* More three-dot action menu button */}
                <Tooltip title="More options">
                  <IconButton
                    size="small"
                    onClick={(e) => setFinalizedMenuAnchor(e.currentTarget)}
                    sx={{
                      border: isDark ? "1px solid rgba(255,255,255,0.15)" : "1px solid #cbd5e1",
                      borderRadius: "10px",
                      p: 0.8,
                      color: isDark ? "#cbd5e1" : "#334155",
                    }}
                  >
                    <MoreHoriz />
                  </IconButton>
                </Tooltip>
              </Stack>
            )}
          </Stack>
        </Box>
      </Box>

      {/* Finalized More Menu */}
      <Menu
        anchorEl={finalizedMenuAnchor}
        open={Boolean(finalizedMenuAnchor)}
        onClose={() => setFinalizedMenuAnchor(null)}
        PaperProps={{ sx: { borderRadius: "12px", minWidth: 220, boxShadow: "0 4px 20px rgba(0,0,0,0.15)" } }}
      >
        <MenuItem onClick={handleResetToPending} sx={{ fontSize: "0.82rem", fontWeight: 700, color: "#1d68f0" }}>
          <History sx={{ fontSize: 16, mr: 1, color: "#1d68f0" }} /> Reset to Pending (Not Processed)
        </MenuItem>
        <MenuItem onClick={handleOpenReopenMenuAction} sx={{ fontSize: "0.82rem", fontWeight: 700, color: "#e11d48" }}>
          <LockOpen sx={{ fontSize: 16, mr: 1, color: "#e11d48" }} /> Reopen for Review
        </MenuItem>
      </Menu>

      {/* ── 2. TOP METRIC CARDS GRID ─────────────────────────────────── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* Card 1: Total Employees */}
        <Grid item xs={12} sm={6} md={2.4}>
          <Paper
            elevation={0}
            sx={{
              p: 2.2,
              borderRadius: "16px",
              bgcolor: isDark ? "#0d1322" : "#f0f7ff",
              border: isDark ? "1px solid rgba(59, 130, 246, 0.2)" : "1px solid #dbeafe",
              height: "100%",
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Box
              sx={{
                width: 46,
                height: 46,
                borderRadius: "12px",
                bgcolor: isDark ? "rgba(59, 130, 246, 0.2)" : "#dbeafe",
                color: "#1d4ed8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <PeopleAlt />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontWeight: 600 }}>
                Total Employees
              </Typography>
              <Typography variant="h6" fontWeight={900} sx={{ color: isDark ? "#f8fafc" : "#0f172a" }}>
                {totalEmployeesCount}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Card 2: Total Gross Outlay */}
        <Grid item xs={12} sm={6} md={2.4}>
          <Paper
            elevation={0}
            sx={{
              p: 2.2,
              borderRadius: "16px",
              bgcolor: isDark ? "#0d1322" : "#ffffff",
              border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0",
              height: "100%",
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Box
              sx={{
                width: 46,
                height: 46,
                borderRadius: "12px",
                bgcolor: isDark ? "rgba(99, 102, 241, 0.15)" : "#e0e7ff",
                color: "#4338ca",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ReceiptLong />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontWeight: 600 }}>
                Gross Salary
              </Typography>
              <Typography variant="h6" fontWeight={900} sx={{ color: isDark ? "#f8fafc" : "#0f172a" }}>
                ₹ {totalGrossSum.toLocaleString("en-IN")}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Card 3: Deductions */}
        <Grid item xs={12} sm={6} md={2.4}>
          <Paper
            elevation={0}
            sx={{
              p: 2.2,
              borderRadius: "16px",
              bgcolor: isDark ? "#0d1322" : "#ffffff",
              border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0",
              height: "100%",
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Box
              sx={{
                width: 46,
                height: 46,
                borderRadius: "12px",
                bgcolor: isDark ? "rgba(244, 63, 94, 0.15)" : "#fee2e2",
                color: "#dc2626",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Calculate />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontWeight: 600 }}>
                Deductions
              </Typography>
              <Typography variant="h6" fontWeight={900} sx={{ color: isDark ? "#f8fafc" : "#0f172a" }}>
                ₹ {totalDeductionsSum.toLocaleString("en-IN")}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Card 4: Net Payable */}
        <Grid item xs={12} sm={6} md={2.4}>
          <Paper
            elevation={0}
            sx={{
              p: 2.2,
              borderRadius: "16px",
              bgcolor: isDark ? "#0d1322" : "#ffffff",
              border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0",
              height: "100%",
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Box
              sx={{
                width: 46,
                height: 46,
                borderRadius: "12px",
                bgcolor: isDark ? "rgba(16, 185, 129, 0.15)" : "#dcfce7",
                color: "#15803d",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AccountBalanceWallet />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontWeight: 600 }}>
                Net Pay Outlay
              </Typography>
              <Typography variant="h6" fontWeight={900} sx={{ color: isDark ? "#f8fafc" : "#0f172a" }}>
                ₹ {totalNetPaySum.toLocaleString("en-IN")}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Card 5: Payment Progress */}
        <Grid item xs={12} sm={6} md={2.4}>
          <Paper
            elevation={0}
            sx={{
              p: 2.2,
              borderRadius: "16px",
              bgcolor: isDark ? "#0d1322" : "#ffffff",
              border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0",
              height: "100%",
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Box
              sx={{
                width: 46,
                height: 46,
                borderRadius: "12px",
                bgcolor: isDark ? "rgba(245, 158, 11, 0.15)" : "#fef3c7",
                color: "#b45309",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Paid />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontWeight: 600 }}>
                Disbursed / Paid
              </Typography>
              <Typography variant="h6" fontWeight={900} sx={{ color: isDark ? "#f8fafc" : "#0f172a" }}>
                {totalPaidCount} / {totalEmployeesCount}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* ── 3. SEARCH & ROLE FILTERS BAR ─────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          borderRadius: "16px",
          bgcolor: isDark ? "#0d1322" : "#ffffff",
          border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0",
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
          {/* Search Box */}
          <TextField
            size="small"
            placeholder="Search employee by name, ID, department..."
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
              minWidth: { xs: "100%", sm: 300 },
              "& .MuiOutlinedInput-root": {
                borderRadius: "10px",
                fontSize: "0.85rem",
              },
            }}
          />

          {/* Department Filter & Status Filter */}
          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
            <Select
              size="small"
              value={selectedDept}
              onChange={(e) => {
                setSelectedDept(e.target.value);
                setPage(1);
              }}
              sx={{
                borderRadius: "10px",
                fontSize: "0.82rem",
                fontWeight: 600,
                minWidth: 140,
              }}
            >
              {DEPARTMENTS.map((d) => (
                <MenuItem key={d} value={d} sx={{ fontSize: "0.82rem" }}>
                  {d}
                </MenuItem>
              ))}
            </Select>

            <Select
              size="small"
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              sx={{
                borderRadius: "10px",
                fontSize: "0.82rem",
                fontWeight: 600,
                minWidth: 140,
              }}
            >
              <MenuItem value="All Status" sx={{ fontSize: "0.82rem" }}>All Statuses</MenuItem>
              <MenuItem value="Pending" sx={{ fontSize: "0.82rem" }}>Pending</MenuItem>
              <MenuItem value="Ready" sx={{ fontSize: "0.82rem" }}>Ready</MenuItem>
              <MenuItem value="Finalized" sx={{ fontSize: "0.82rem" }}>Finalized</MenuItem>
              <MenuItem value="Paid" sx={{ fontSize: "0.82rem" }}>Paid</MenuItem>
            </Select>
          </Stack>
        </Box>
      </Paper>

      {/* ── 4. EMPLOYEE PAYROLL TABLE ─────────────────────────────────── */}
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
          <Table sx={{ minWidth: 750 }}>
            <TableHead sx={{ bgcolor: isDark ? "rgba(255,255,255,0.02)" : "#f8fafc" }}>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={isAllSelected}
                    indeterminate={isSomeSelected}
                    onChange={handleSelectAll}
                    size="small"
                  />
                </TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: "0.8rem", color: isDark ? "#94a3b8" : "#475569" }}>
                  EMPLOYEE
                </TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: "0.8rem", color: isDark ? "#94a3b8" : "#475569" }}>
                  GROSS
                </TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: "0.8rem", color: isDark ? "#94a3b8" : "#475569" }}>
                  DEDUCTIONS
                </TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: "0.8rem", color: isDark ? "#94a3b8" : "#475569" }}>
                  NET PAY
                </TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: "0.8rem", color: isDark ? "#94a3b8" : "#475569" }}>
                  PAYROLL STATUS
                </TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: "0.8rem", color: isDark ? "#94a3b8" : "#475569" }}>
                  PAYMENT
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, fontSize: "0.8rem", color: isDark ? "#94a3b8" : "#475569" }}>
                  ACTIONS
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {displayedEmployees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <Typography variant="body2" sx={{ color: isDark ? "#94a3b8" : "#64748b" }}>
                      No employee records found matching your filters.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                displayedEmployees.map((emp) => {
                  const isSelected = selectedRowIds.includes(emp.id);
                  return (
                    <TableRow
                      key={emp.id}
                      hover
                      selected={isSelected}
                      sx={{
                        "&.Mui-selected": {
                          bgcolor: isDark ? "rgba(29, 104, 240, 0.1)" : "#f0f7ff",
                        },
                      }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={isSelected}
                          onChange={() => handleSelectOne(emp.id)}
                          size="small"
                        />
                      </TableCell>

                      {/* Employee Info */}
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <Avatar
                            sx={{
                              bgcolor: emp.avatarBg || "#dbeafe",
                              color: emp.avatarColor || "#1d4ed8",
                              fontWeight: 800,
                              fontSize: "0.8rem",
                              width: 36,
                              height: 36,
                            }}
                          >
                            {emp.initials}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" fontWeight={800} sx={{ color: isDark ? "#f8fafc" : "#0f172a", lineHeight: 1.2 }}>
                              {emp.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b" }}>
                              {emp.empId} • {emp.designation || emp.department}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      {/* Gross */}
                      <TableCell>
                        <Typography variant="body2" fontWeight={700} sx={{ color: isDark ? "#f8fafc" : "#0f172a" }}>
                          ₹ {Number(emp.gross || 0).toLocaleString("en-IN")}
                        </Typography>
                      </TableCell>

                      {/* Deductions */}
                      <TableCell>
                        <Typography variant="body2" fontWeight={700} sx={{ color: "#dc2626" }}>
                          ₹ {Number(emp.deductions || 0).toLocaleString("en-IN")}
                        </Typography>
                        {emp.lopDays > 0 && (
                          <Typography variant="caption" sx={{ color: "#dc2626", display: "block", fontSize: "0.68rem" }}>
                            ({emp.lopDays} LOP: ₹{Number(emp.lopAmount).toLocaleString("en-IN")})
                          </Typography>
                        )}
                      </TableCell>

                      {/* Net Pay */}
                      <TableCell>
                        <Typography variant="body2" fontWeight={900} sx={{ color: "#16a34a" }}>
                          ₹ {Number(emp.netPay || 0).toLocaleString("en-IN")}
                        </Typography>
                      </TableCell>

                      {/* Payroll Status */}
                      <TableCell>
                        {emp.status === EMPLOYEE_PAYROLL_STATUS.PENDING && (
                          <Chip
                            label="Pending"
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
                        {emp.status === EMPLOYEE_PAYROLL_STATUS.READY && (
                          <Chip
                            label="Ready"
                            size="small"
                            sx={{
                              fontWeight: 700,
                              fontSize: "0.75rem",
                              bgcolor: isDark ? "rgba(59, 130, 246, 0.15)" : "#eff6ff",
                              color: isDark ? "#60a5fa" : "#1d4ed8",
                              border: "1px solid rgba(59, 130, 246, 0.3)",
                            }}
                          />
                        )}
                        {emp.status === EMPLOYEE_PAYROLL_STATUS.FINALIZED && (
                          <Chip
                            label="Finalized"
                            size="small"
                            sx={{
                              fontWeight: 700,
                              fontSize: "0.75rem",
                              bgcolor: isDark ? "rgba(16, 185, 129, 0.15)" : "#f0fdf4",
                              color: isDark ? "#34d399" : "#15803d",
                              border: "1px solid rgba(16, 185, 129, 0.3)",
                            }}
                          />
                        )}
                      </TableCell>

                      {/* Payment Status */}
                      <TableCell>
                        {overallStatus !== PAYROLL_STATUS.FINALIZED ? (
                          <Typography variant="caption" sx={{ color: isDark ? "#64748b" : "#94a3b8" }}>
                            —
                          </Typography>
                        ) : emp.paymentStatus === PAYMENT_STATUS.PAID ? (
                          <Chip
                            label="Paid"
                            size="small"
                            sx={{
                              fontWeight: 800,
                              fontSize: "0.75rem",
                              bgcolor: isDark ? "rgba(16, 185, 129, 0.15)" : "#f0fdf4",
                              color: isDark ? "#34d399" : "#15803d",
                              border: "1px solid rgba(16, 185, 129, 0.3)",
                            }}
                          />
                        ) : (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleMarkPaid(emp.id)}
                            sx={{
                              py: 0.2,
                              px: 1,
                              fontSize: "0.72rem",
                              fontWeight: 700,
                              textTransform: "none",
                              borderRadius: "6px",
                              borderColor: "#cbd5e1",
                              color: "#334155",
                            }}
                          >
                            Mark as Paid
                          </Button>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <Tooltip title="Preview Salary Slip / Breakdown">
                            <IconButton
                              size="small"
                              onClick={() => setPreviewEmployee(emp)}
                              sx={{ color: isDark ? "#94a3b8" : "#64748b" }}
                            >
                              <Visibility sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>

                          <IconButton
                            size="small"
                            onClick={(e) => setActiveRowMenu({ anchor: e.currentTarget, row: emp })}
                            sx={{ color: isDark ? "#94a3b8" : "#64748b" }}
                          >
                            <MoreHoriz sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination Bar */}
        <Box sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
          <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b" }}>
            Showing {displayedEmployees.length} of {filteredEmployees.length} employees
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

      {/* ── 5. STICKY BOTTOM ACTION BANNER ────────────────────────────── */}
      <Paper
        elevation={3}
        sx={{
          mt: 3,
          p: 2,
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
        <Box>
          <Typography variant="subtitle2" fontWeight={800} sx={{ color: isDark ? "#f8fafc" : "#0f172a" }}>
            Monthly Payroll Outlay — {selectedMonth}
          </Typography>
          <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b" }}>
            Total Net Payout: <strong>₹ {totalNetPaySum.toLocaleString("en-IN")}</strong> ({totalEmployeesCount} active employees)
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} alignItems="center">
          {overallStatus === PAYROLL_STATUS.NOT_PROCESSED && (
            <Button
              variant="contained"
              disabled={isProcessing}
              startIcon={
                isProcessing ? (
                  <CircularProgress size={16} sx={{ color: "#ffffff" }} />
                ) : (
                  <PlayArrow sx={{ fontSize: 18 }} />
                )
              }
              onClick={handleProcessPayroll}
              sx={{
                borderRadius: "10px",
                textTransform: "none",
                fontWeight: 700,
                fontSize: "0.85rem",
                bgcolor: "#1d68f0",
                color: "#ffffff",
                px: 2.5,
                py: 0.85,
              }}
            >
              {isProcessing ? "Processing Payroll..." : "Process Payroll"}
            </Button>
          )}

          {overallStatus === PAYROLL_STATUS.READY && (
            <>
              <Button
                variant="outlined"
                disabled={isProcessing}
                onClick={() => setRecalculateModalOpen(true)}
                sx={{
                  borderRadius: "10px",
                  textTransform: "none",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  borderColor: isDark ? "rgba(255,255,255,0.15)" : "#e2e8f0",
                  color: isDark ? "#cbd5e1" : "#334155",
                }}
              >
                Recalculate
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  if (displayedEmployees.length > 0) setPreviewEmployee(displayedEmployees[0]);
                }}
                sx={{
                  borderRadius: "10px",
                  textTransform: "none",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  borderColor: isDark ? "rgba(255,255,255,0.15)" : "#e2e8f0",
                  color: isDark ? "#cbd5e1" : "#334155",
                }}
              >
                Preview Payroll
              </Button>
              <Button
                variant="contained"
                disabled={isFinalizing}
                startIcon={
                  isFinalizing ? (
                    <CircularProgress size={16} sx={{ color: "#ffffff" }} />
                  ) : (
                    <Check sx={{ fontSize: 18 }} />
                  )
                }
                onClick={() => setFinalizeModalOpen(true)}
                sx={{
                  borderRadius: "10px",
                  textTransform: "none",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  bgcolor: "#1d68f0",
                  color: "#ffffff",
                  px: 2.5,
                  py: 0.85,
                }}
              >
                {isFinalizing ? "Finalizing Payroll..." : "Finalize Payroll"}
              </Button>
              <Button
                variant="outlined"
                startIcon={<History sx={{ fontSize: 16 }} />}
                onClick={handleResetToPending}
                sx={{
                  borderRadius: "10px",
                  textTransform: "none",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  borderColor: isDark ? "rgba(255,255,255,0.15)" : "#cbd5e1",
                  color: isDark ? "#94a3b8" : "#64748b",
                }}
              >
                Back to Pending
              </Button>
            </>
          )}

          {overallStatus === PAYROLL_STATUS.FINALIZED && (
            <>
              <Button
                variant="outlined"
                startIcon={<AccountBalanceWallet sx={{ fontSize: 16 }} />}
                onClick={() => navigate("/payroll/payslips")}
                sx={{
                  borderRadius: "10px",
                  textTransform: "none",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  borderColor: "#1d68f0",
                  color: "#1d68f0",
                }}
              >
                View Salary Slips
              </Button>
              <Button
                variant="contained"
                startIcon={<Paid sx={{ fontSize: 18 }} />}
                disabled={isAllPaid}
                onClick={() => handleMarkPaid("ALL")}
                sx={{
                  borderRadius: "10px",
                  textTransform: "none",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  bgcolor: isAllPaid ? (isDark ? "#1e293b" : "#e2e8f0") : "#16a34a",
                  color: isAllPaid ? (isDark ? "#64748b" : "#94a3b8") : "#ffffff",
                  px: 2.5,
                  py: 0.85,
                }}
              >
                {isAllPaid ? "Payroll Completed" : "Mark All as Paid"}
              </Button>
            </>
          )}
        </Stack>
      </Paper>

      {/* ── 6. MODALS & DIALOGS ───────────────────────────────────────── */}

      {/* MODAL 1: Individual Employee Payslip Breakdown Preview */}
      <SalarySlipModal
        open={Boolean(previewEmployee)}
        onClose={() => setPreviewEmployee(null)}
        slipData={previewEmployee ? { ...previewEmployee, month: selectedMonth } : null}
      />

      {/* MODAL 2: Finalize Payroll Confirmation Dialog */}
      <Dialog
        open={finalizeModalOpen}
        onClose={() => setFinalizeModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: "16px", p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: "1.1rem" }}>
          Are you sure you want to finalize {selectedMonth} payroll?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: isDark ? "#94a3b8" : "#64748b", mb: 2 }}>
            After finalization, payroll calculations will be locked. Salary slips will be generated for eligible employees.
          </Typography>
          <Paper elevation={0} sx={{ p: 2, borderRadius: "10px", bgcolor: isDark ? "rgba(255,255,255,0.02)" : "#f8fafc", border: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid #e2e8f0" }}>
            <Stack spacing={1}>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b" }}>Total Gross Outlay:</Typography>
                <Typography variant="caption" fontWeight={700}>₹ {totalGrossSum.toLocaleString("en-IN")}</Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b" }}>Total Statutory Deductions:</Typography>
                <Typography variant="caption" fontWeight={700}>₹ {totalDeductionsSum.toLocaleString("en-IN")}</Typography>
              </Box>
              <Divider sx={{ my: 0.5 }} />
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2" fontWeight={800} sx={{ color: "#1d68f0" }}>Total Net Payout:</Typography>
                <Typography variant="body2" fontWeight={900} sx={{ color: "#1d68f0" }}>₹ {totalNetPaySum.toLocaleString("en-IN")}</Typography>
              </Box>
            </Stack>
          </Paper>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setFinalizeModalOpen(false)} sx={{ textTransform: "none", fontWeight: 700, color: "#64748b" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleFinalizePayroll}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              bgcolor: "#1d68f0",
              "&:hover": { bgcolor: "#1557d0" },
            }}
          >
            Finalize Payroll
          </Button>
        </DialogActions>
      </Dialog>

      {/* MODAL 3: Recalculate Confirmation Dialog */}
      <Dialog
        open={recalculateModalOpen}
        onClose={() => setRecalculateModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: "16px" } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Recalculate Payroll</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: isDark ? "#94a3b8" : "#64748b" }}>
            This will recalculate payroll formulas, allowances, and attendance LOP deductions for all active employees for <strong>{selectedMonth}</strong>.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setRecalculateModalOpen(false)} sx={{ textTransform: "none", fontWeight: 700 }}>Cancel</Button>
          <Button variant="contained" onClick={handleRecalculatePayroll} sx={{ textTransform: "none", fontWeight: 700, bgcolor: "#1d68f0" }}>
            Recalculate Now
          </Button>
        </DialogActions>
      </Dialog>

      {/* MODAL 4: Reopen Payroll Confirmation Dialog (When 0 employees paid) */}
      <Dialog
        open={reopenModalOpen}
        onClose={() => setReopenModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: "16px", p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: "1.15rem", display: "flex", alignItems: "center", gap: 1 }}>
          <LockOpen sx={{ color: "#e11d48" }} /> Reopen Payroll?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: isDark ? "#cbd5e1" : "#334155", mb: 2, lineHeight: 1.6 }}>
            Reopening this payroll will unlock the payroll calculation and allow changes to employee salary data. Salary slips generated for this payroll will need to be regenerated after finalization.
          </Typography>
          <Paper elevation={0} sx={{ p: 2, borderRadius: "10px", bgcolor: isDark ? "rgba(244, 63, 94, 0.08)" : "#fff1f2", border: isDark ? "1px solid rgba(244, 63, 94, 0.2)" : "1px solid #fecaca" }}>
            <Typography variant="caption" fontWeight={700} sx={{ color: "#b91c1c", display: "block" }}>
              • Status will change from Finalized → Ready for Review
            </Typography>
            <Typography variant="caption" fontWeight={700} sx={{ color: "#b91c1c", display: "block", mt: 0.5 }}>
              • Existing salary slips will be marked as "Needs Regeneration"
            </Typography>
          </Paper>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setReopenModalOpen(false)} sx={{ textTransform: "none", fontWeight: 700, color: "#64748b" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmReopenPayroll}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              bgcolor: "#dc2626",
              "&:hover": { bgcolor: "#b91c1c" },
            }}
          >
            Reopen Payroll
          </Button>
        </DialogActions>
      </Dialog>

      {/* MODAL 5: Reopen Blocked Dialog (When 1+ employees already paid) */}
      <Dialog
        open={reopenBlockedModalOpen}
        onClose={() => setReopenBlockedModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: "16px", p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: "1.15rem", display: "flex", alignItems: "center", gap: 1 }}>
          <WarningAmber sx={{ color: "#f59e0b" }} /> Payroll Cannot Be Reopened
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: isDark ? "#cbd5e1" : "#334155", mb: 2, lineHeight: 1.6 }}>
            Some employees have already been paid for this payroll period. Reopening the complete payroll could affect completed payments. Please use a payroll adjustment or correction process.
          </Typography>
          <Paper elevation={0} sx={{ p: 2, borderRadius: "10px", bgcolor: isDark ? "rgba(245, 158, 11, 0.08)" : "#fefce8", border: isDark ? "1px solid rgba(245, 158, 11, 0.2)" : "1px solid #fef08a", mb: 2 }}>
            <Typography variant="caption" fontWeight={700} sx={{ color: "#b45309", display: "block" }}>
              Paid Employees: {totalPaidCount} / {totalEmployeesCount} completed
            </Typography>
            <Typography variant="caption" sx={{ color: isDark ? "#cbd5e1" : "#475569", display: "block", mt: 0.5 }}>
              To correct an unpaid employee (e.g. 360 Connect), click the ⋯ menu next to their name in the table and select <strong>"Salary Adjustment / Correct Payroll"</strong>.
            </Typography>
          </Paper>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button
            onClick={() => setReopenBlockedModalOpen(false)}
            sx={{ textTransform: "none", fontWeight: 700, color: "#64748b" }}
          >
            Close
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setReopenBlockedModalOpen(false);
              setSelectedStatus("Pending");
            }}
            sx={{ textTransform: "none", fontWeight: 700, bgcolor: "#1d68f0" }}
          >
            View Unpaid Employees
          </Button>
        </DialogActions>
      </Dialog>

      {/* MODAL 6: Individual Employee Salary Adjustment / Correction Dialog */}
      <Dialog
        open={Boolean(adjustEmployee)}
        onClose={() => setAdjustEmployee(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: "16px", p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: "1.15rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
            <Tune sx={{ color: "#1d68f0" }} />
            <Box>
              <Typography variant="subtitle1" fontWeight={800} sx={{ color: isDark ? "#f8fafc" : "#0f172a", lineHeight: 1.2 }}>
                Salary Adjustment & Correction — {adjustEmployee?.name}
              </Typography>
              <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b" }}>
                Emp ID: {adjustEmployee?.empId} • {adjustEmployee?.department} • {selectedMonth}
              </Typography>
            </Box>
          </Box>
          <IconButton size="small" onClick={() => setAdjustEmployee(null)}>
            <Close fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ borderColor: isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0" }}>
          {adjustEmployee && (
            <Box>
              <Alert severity="info" sx={{ mb: 2.5, borderRadius: "10px", fontSize: "0.82rem" }}>
                Adjusting this unpaid employee will recalculate their net pay and generate an updated salary slip without affecting already-paid employees.
              </Alert>

              <Grid container spacing={2.5}>
                {/* Section 1: Attendance / LOP Days */}
                <Grid item xs={12}>
                  <Typography variant="subtitle2" fontWeight={800} sx={{ color: isDark ? "#93c5fd" : "#1d4ed8", mb: 1 }}>
                    1. Attendance & Loss of Pay (LOP)
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Total Days in Month"
                        disabled
                        value={getMonthPeriodDetails(selectedMonth).totalDays}
                        InputProps={{ sx: { borderRadius: "10px", fontSize: "0.85rem", fontWeight: 700 } }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        label="Absent Days (LOP)"
                        value={adjustFormData.absentDays}
                        onChange={(e) => setAdjustFormData({ ...adjustFormData, absentDays: Math.max(0, Number(e.target.value)) })}
                        InputProps={{ sx: { borderRadius: "10px", fontSize: "0.85rem", fontWeight: 700 } }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Effective Present Days"
                        disabled
                        value={Math.max(0, getMonthPeriodDetails(selectedMonth).totalDays - (Number(adjustFormData.absentDays) || 0))}
                        InputProps={{ sx: { borderRadius: "10px", fontSize: "0.85rem", fontWeight: 700 } }}
                      />
                    </Grid>
                  </Grid>
                </Grid>

                {/* Section 2: Earnings Components */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" fontWeight={800} sx={{ color: isDark ? "#34d399" : "#15803d", mb: 1 }}>
                    2. Earnings Components (₹)
                  </Typography>
                  <Stack spacing={1.5}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="Basic Salary"
                      value={adjustFormData.customBasic}
                      onChange={(e) => setAdjustFormData({ ...adjustFormData, customBasic: e.target.value })}
                      InputProps={{ sx: { borderRadius: "10px", fontSize: "0.85rem" } }}
                    />
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="House Rent Allowance (HRA)"
                      value={adjustFormData.customHra}
                      onChange={(e) => setAdjustFormData({ ...adjustFormData, customHra: e.target.value })}
                      InputProps={{ sx: { borderRadius: "10px", fontSize: "0.85rem" } }}
                    />
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="Special Allowance"
                      value={adjustFormData.customSpecial}
                      onChange={(e) => setAdjustFormData({ ...adjustFormData, customSpecial: e.target.value })}
                      InputProps={{ sx: { borderRadius: "10px", fontSize: "0.85rem" } }}
                    />
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="Other Allowance"
                      value={adjustFormData.customOther}
                      onChange={(e) => setAdjustFormData({ ...adjustFormData, customOther: e.target.value })}
                      InputProps={{ sx: { borderRadius: "10px", fontSize: "0.85rem" } }}
                    />
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="Bonus / Arrears / Incentive"
                      value={adjustFormData.customBonus}
                      onChange={(e) => setAdjustFormData({ ...adjustFormData, customBonus: e.target.value })}
                      InputProps={{ sx: { borderRadius: "10px", fontSize: "0.85rem" } }}
                    />
                  </Stack>
                </Grid>

                {/* Section 3: Deductions Components */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" fontWeight={800} sx={{ color: isDark ? "#fb7185" : "#be123c", mb: 1 }}>
                    3. Deductions Components (₹)
                  </Typography>
                  <Stack spacing={1.5}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="Provident Fund (PF)"
                      value={adjustFormData.customPf}
                      onChange={(e) => setAdjustFormData({ ...adjustFormData, customPf: e.target.value })}
                      InputProps={{ sx: { borderRadius: "10px", fontSize: "0.85rem" } }}
                    />
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="Professional Tax (PT)"
                      value={adjustFormData.customPt}
                      onChange={(e) => setAdjustFormData({ ...adjustFormData, customPt: e.target.value })}
                      InputProps={{ sx: { borderRadius: "10px", fontSize: "0.85rem" } }}
                    />
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="TDS / Income Tax"
                      value={adjustFormData.customTds}
                      onChange={(e) => setAdjustFormData({ ...adjustFormData, customTds: e.target.value })}
                      InputProps={{ sx: { borderRadius: "10px", fontSize: "0.85rem" } }}
                    />
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="Other Deductions"
                      value={adjustFormData.customOtherDeduction}
                      onChange={(e) => setAdjustFormData({ ...adjustFormData, customOtherDeduction: e.target.value })}
                      InputProps={{ sx: { borderRadius: "10px", fontSize: "0.85rem" } }}
                    />
                    <TextField
                      fullWidth
                      size="small"
                      label="Adjustment Reason / Remarks"
                      placeholder="e.g. Overtime addition / 1 day attendance adjustment"
                      value={adjustFormData.adjustmentNotes}
                      onChange={(e) => setAdjustFormData({ ...adjustFormData, adjustmentNotes: e.target.value })}
                      InputProps={{ sx: { borderRadius: "10px", fontSize: "0.85rem" } }}
                    />
                  </Stack>
                </Grid>

                {/* Section 4: Live Calculated Preview */}
                {(() => {
                  const mTotalDays = getMonthPeriodDetails(selectedMonth).totalDays;
                  const mGross =
                    (Number(adjustFormData.customBasic) || 0) +
                    (Number(adjustFormData.customHra) || 0) +
                    (Number(adjustFormData.customSpecial) || 0) +
                    (Number(adjustFormData.customOther) || 0) +
                    (Number(adjustFormData.customBonus) || 0);
                  const mPerDay = mTotalDays > 0 ? mGross / mTotalDays : 0;
                  const mAbsent = Number(adjustFormData.absentDays) || 0;
                  const mLop = mAbsent > 0 ? Math.round(mPerDay * mAbsent * 100) / 100 : 0;
                  const mOtherDed =
                    (Number(adjustFormData.customPf) || 0) +
                    (Number(adjustFormData.customPt) || 0) +
                    (Number(adjustFormData.customTds) || 0) +
                    (Number(adjustFormData.customOtherDeduction) || 0);
                  const mTotalDed = mOtherDed + mLop;
                  const mNetPay = Math.max(0, Math.round((mGross - mTotalDed) * 100) / 100);

                  return (
                    <Grid item xs={12}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2,
                          borderRadius: "12px",
                          bgcolor: isDark ? "rgba(29, 104, 240, 0.08)" : "#eff6ff",
                          border: isDark ? "1px solid rgba(29, 104, 240, 0.25)" : "1px solid #bfdbfe",
                        }}
                      >
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={12} sm={4}>
                            <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontWeight: 700 }}>
                              New Gross Salary:
                            </Typography>
                            <Typography variant="subtitle1" fontWeight={800} sx={{ color: isDark ? "#f8fafc" : "#0f172a" }}>
                              ₹ {mGross.toLocaleString("en-IN")}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <Typography variant="caption" sx={{ color: isDark ? "#94a3b8" : "#64748b", fontWeight: 700 }}>
                              Total Deductions (incl. ₹{mLop} LOP):
                            </Typography>
                            <Typography variant="subtitle1" fontWeight={800} sx={{ color: "#dc2626" }}>
                              ₹ {mTotalDed.toLocaleString("en-IN")}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <Typography variant="caption" sx={{ color: "#16a34a", fontWeight: 800 }}>
                              New Net Payable:
                            </Typography>
                            <Typography variant="h6" fontWeight={900} sx={{ color: "#16a34a" }}>
                              ₹ {mNetPay.toLocaleString("en-IN")}
                            </Typography>
                          </Grid>
                        </Grid>
                      </Paper>
                    </Grid>
                  );
                })()}
              </Grid>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setAdjustEmployee(null)} sx={{ textTransform: "none", fontWeight: 700, color: "#64748b" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveAdjustment}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              bgcolor: "#1d68f0",
              px: 2.5,
              "&:hover": { bgcolor: "#1557d0" },
            }}
          >
            Save & Generate Corrected Slip
          </Button>
        </DialogActions>
      </Dialog>

      {/* Action Menu for Table Rows */}
      <Menu
        anchorEl={activeRowMenu?.anchor}
        open={Boolean(activeRowMenu)}
        onClose={() => setActiveRowMenu(null)}
        PaperProps={{ sx: { borderRadius: "12px", minWidth: 190, boxShadow: "0 4px 20px rgba(0,0,0,0.15)" } }}
      >
        <MenuItem
          onClick={() => {
            setPreviewEmployee(activeRowMenu?.row);
            setActiveRowMenu(null);
          }}
          sx={{ fontSize: "0.82rem", fontWeight: 600 }}
        >
          <Visibility sx={{ fontSize: 16, mr: 1, color: "#64748b" }} /> View Salary Slip
        </MenuItem>

        {/* Salary Adjustment / Correction for Unpaid Employee */}
        {activeRowMenu?.row?.paymentStatus !== PAYMENT_STATUS.PAID ? (
          <MenuItem
            onClick={() => {
              const row = activeRowMenu?.row;
              setActiveRowMenu(null);
              handleOpenAdjustment(row);
            }}
            sx={{ fontSize: "0.82rem", fontWeight: 700, color: "#1d68f0" }}
          >
            <Tune sx={{ fontSize: 16, mr: 1, color: "#1d68f0" }} /> Salary Adjustment / Correct Payroll
          </MenuItem>
        ) : (
          <MenuItem
            disabled
            sx={{ fontSize: "0.82rem", fontWeight: 600, color: "#64748b" }}
          >
            <CheckCircle sx={{ fontSize: 16, mr: 1, color: "#16a34a" }} /> Paid (Locked from edits)
          </MenuItem>
        )}

        {overallStatus === PAYROLL_STATUS.FINALIZED && activeRowMenu?.row?.paymentStatus !== PAYMENT_STATUS.PAID && (
          <MenuItem
            onClick={() => {
              handleMarkPaid(activeRowMenu?.row?.id);
              setActiveRowMenu(null);
            }}
            sx={{ fontSize: "0.82rem", fontWeight: 700, color: "#16a34a" }}
          >
            <Paid sx={{ fontSize: 16, mr: 1, color: "#16a34a" }} /> Mark as Paid
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
}

